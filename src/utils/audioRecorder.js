/**
 * Hybrid Audio Recorder: MediaRecorder Capture + Post-Processing WAV Conversion
 *
 * Architecture:
 * 1. MediaRecorder (native browser path) captures audio reliably as WebM/Opus.
 * 2. AnalyserNode on the SAME stream (no cloning!) provides real-time volume.
 * 3. On stop: decodeAudioData() → downsample to 16 kHz → encode as RIFF WAV.
 *
 * This approach solves:
 * - ScriptProcessorNode all-zero buffer bug on Windows Chromium (deprecated API).
 * - Original stream.clone() + sampleRate:16000 buffer starvation bug.
 * - Whisper hallucination on silent/corrupted audio.
 */

// ── WAV Encoding Utilities ─────────────────────────────────────────────────

function downsampleBuffer(buffer, inputRate, outputRate = 16000) {
  if (inputRate === outputRate) return buffer;
  if (inputRate < outputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.round(i * ratio);
    const end = Math.round((i + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end && j < buffer.length; j++) {
      sum += buffer[j];
      count++;
    }
    result[i] = count > 0 ? sum / count : 0;
  }
  return result;
}

function encodeWAV(samples, sampleRate = 16000) {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);       // PCM format chunk size
  view.setUint16(20, 1, true);        // PCM format
  view.setUint16(22, 1, true);        // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);  // byte rate
  view.setUint16(32, 2, true);        // block align
  view.setUint16(34, 16, true);       // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  // Float32 [-1,1] → Int16 [-32768,32767]
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// ── Main Recorder Class ────────────────────────────────────────────────────

export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.isRecording = false;
    this.onVolumeChange = null;
    this.startTime = 0;
    this.animFrameId = null;
  }

  async start(onVolume) {
    this.onVolumeChange = onVolume;
    this.audioChunks = [];
    this.startTime = Date.now();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser does not support microphone. Use Chrome or Edge.');
    }

    // ── 1. Get microphone stream (NO sampleRate constraint!) ──────────
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission denied. Please allow mic access.');
      }
      throw new Error(`Microphone error: ${err.message}`);
    }

    // ── 2. MediaRecorder for reliable audio capture ───────────────────
    let mimeType = 'audio/webm';
    for (const candidate of [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ]) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        mimeType = candidate;
        break;
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      audioBitsPerSecond: 128000
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250);
    this.isRecording = true;

    // ── 3. AnalyserNode for live volume (same stream, NO cloning!) ────
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.3;
        this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
        this.sourceNode.connect(this.analyser);
        // Do NOT connect to destination — just observe frequency data

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const pollVolume = () => {
          if (!this.isRecording) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          if (this.onVolumeChange) this.onVolumeChange(normalized);
          this.animFrameId = requestAnimationFrame(pollVolume);
        };
        this.animFrameId = requestAnimationFrame(pollVolume);
      }
    } catch (e) {
      console.warn('Volume visualizer setup failed (non-critical):', e.message);
    }

    console.log(`🎙️ MediaRecorder started. Format: ${mimeType}, Stream tracks: ${this.stream.getAudioTracks().length}`);
  }

  stop() {
    return new Promise((resolve) => {
      const elapsedMs = Date.now() - this.startTime;
      this.isRecording = false;

      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const webmMime = this.mediaRecorder?.mimeType || 'audio/webm';
        const webmBlob = new Blob(this.audioChunks, { type: webmMime });

        console.log(`🎙️ MediaRecorder stopped: ${elapsedMs}ms, chunks: ${this.audioChunks.length}, WebM size: ${webmBlob.size} bytes`);

        if (webmBlob.size < 1000) {
          console.warn('⚠️ WebM blob is suspiciously small. Recording may have failed.');
          this.cleanup();
          resolve(null);
          return;
        }

        // ── Convert WebM/Opus → 16 kHz Mono PCM WAV ──────────────────
        try {
          const wavBlob = await this.convertToWav16k(webmBlob);

          console.log(`✅ WAV conversion complete: ${wavBlob.size} bytes (16 kHz mono PCM)`);

          this.cleanup();
          resolve({
            blob: wavBlob,
            durationMs: elapsedMs,
            sizeBytes: wavBlob.size,
            mimeType: 'audio/wav',
            originalWebmSize: webmBlob.size
          });
        } catch (convErr) {
          this.cleanup();
          if (convErr.message && convErr.message.startsWith('SILENT_AUDIO:')) {
            console.warn('⚠️ Silence detected:', convErr.message);
            resolve({
              isSilent: true,
              durationMs: elapsedMs,
              errorMessage: convErr.message
            });
            return;
          }
          console.error('WAV conversion failed, sending raw WebM:', convErr.message);
          // Fallback: send the raw WebM to Whisper (it accepts WebM too)
          resolve({
            blob: webmBlob,
            durationMs: elapsedMs,
            sizeBytes: webmBlob.size,
            mimeType: webmMime,
            originalWebmSize: webmBlob.size
          });
        }
      };

      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
          this.mediaRecorder.stop();
        } else {
          this.cleanup();
          resolve(null);
        }
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
        this.cleanup();
        resolve(null);
      }
    });
  }

  /**
   * Decode any browser-recorded audio blob (WebM/Opus/MP4) into
   * 16 kHz mono 16-bit PCM WAV using the Web Audio API decoder.
   */
  async convertToWav16k(audioBlob) {
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Use a temporary AudioContext for decoding (works offline, not real-time)
    const tempCtx = new (window.AudioContext || window.webkitAudioContext)();

    let audioBuffer;
    try {
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    } catch (decodeErr) {
      await tempCtx.close().catch(() => {});
      throw new Error(`Audio decode failed: ${decodeErr.message}`);
    }

    const inputRate = audioBuffer.sampleRate;
    const rawPcm = audioBuffer.getChannelData(0); // Mono channel 0

    // Audio quality diagnostics
    let peak = 0;
    let rmsSum = 0;
    for (let i = 0; i < rawPcm.length; i++) {
      const abs = Math.abs(rawPcm[i]);
      if (abs > peak) peak = abs;
      rmsSum += rawPcm[i] * rawPcm[i];
    }
    const rms = Math.sqrt(rmsSum / rawPcm.length);
    const rmsDb = rms > 0 ? (20 * Math.log10(rms)).toFixed(1) : '-Inf';
    const peakDb = peak > 0 ? (20 * Math.log10(peak)).toFixed(1) : '-Inf';

    console.log(`🔊 Decoded Audio: ${inputRate}Hz, ${rawPcm.length} samples (${(rawPcm.length / inputRate).toFixed(1)}s), RMS=${rms.toFixed(4)} (${rmsDb} dBFS), Peak=${peak.toFixed(4)} (${peakDb} dBFS)`);

    if (rms < 0.005) {
      console.warn('⚠️ Decoded audio is silent or near-zero (RMS < 0.005). Microphone is muted or uncaptured.');
      await tempCtx.close().catch(() => {});
      throw new Error('SILENT_AUDIO: माइक्रोफ़ोन से कोई आवाज़ नहीं आई (वॉल्यूम 0% है)। कृपया अपना माइक म्यूट चेक करें और दोबारा बोलें।');
    } else {
      console.log('✅ Audio levels look healthy for speech recognition.');
    }

    // Downsample to 16 kHz
    const downsampled = downsampleBuffer(rawPcm, inputRate, 16000);

    await tempCtx.close().catch(() => {});

    // Encode as standard RIFF WAV
    return encodeWAV(downsampled, 16000);
  }

  cleanup() {
    this.isRecording = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (e) {}
      this.sourceNode = null;
    }
    this.analyser = null;
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    if (this.onVolumeChange) this.onVolumeChange(0);
  }
}

export const audioRecorder = new AudioRecorder();
