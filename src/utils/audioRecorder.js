/**
 * Universal Web Audio 16 kHz Mono PCM WAV Recorder
 * 
 * Solves:
 * 1. Chromium on Windows buffer starvation bug (2.6 KB truncated WebM recordings).
 * 2. Directly produces uncompressed 16-bit 16 kHz Mono WAV audio (Whisper's native format).
 * 3. 100% deterministic size: 1 second = exactly 32,044 bytes.
 * 4. Real-time volume calculation from raw PCM samples without stream cloning.
 */

function downsampleBuffer(buffer, inputRate, outputRate = 16000) {
  if (inputRate === outputRate) return buffer;
  if (inputRate < outputRate) return buffer;
  const sampleRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? (accum / count) : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count (mono = 1) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  /* write PCM samples */
  floatTo16BitPCM(view, 44, samples);
  return new Blob([view], { type: 'audio/wav' });
}

export class AudioRecorder {
  constructor() {
    this.audioContext = null;
    this.stream = null;
    this.source = null;
    this.processor = null;
    this.gainNode = null;
    this.recordedBuffers = [];
    this.isRecording = false;
    this.onVolumeChange = null;
    this.startTime = 0;
  }

  async start(onVolume) {
    this.onVolumeChange = onVolume;
    this.recordedBuffers = [];
    this.startTime = Date.now();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support microphone capture. Please use Chrome or Edge.');
    }

    // 1. Get raw microphone stream using native hardware constraints
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
        throw new Error('Microphone permission was denied. Please allow microphone access in your browser address bar.');
      }
      throw new Error(`Microphone access error: ${err.message}`);
    }

    // 2. Initialize Web Audio Context at native OS hardware rate (44.1kHz or 48kHz)
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API is not supported in this browser.');
    }

    this.audioContext = new AudioCtx();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // 3. Create audio pipeline: Source -> Processor -> Muted Gain -> Destination
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    
    // ScriptProcessor with 4096 buffer size, 1 input channel, 1 output channel
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    // Muted GainNode prevents speaker monitor feedback loop while keeping Web Audio clock active
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const input = e.inputBuffer.getChannelData(0);
      
      // Store cloned copy of the raw float32 samples
      this.recordedBuffers.push(new Float32Array(input));

      // Calculate live RMS volume
      let sum = 0;
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * input[i];
      }
      const rms = Math.sqrt(sum / input.length);
      const normalizedVolume = Math.min(100, Math.round(rms * 350));
      if (this.onVolumeChange) {
        this.onVolumeChange(normalizedVolume);
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.isRecording = true;
    console.log(`🎙️ Web Audio 16kHz WAV Recorder started. Hardware sampleRate: ${this.audioContext.sampleRate}Hz`);
  }

  stop() {
    return new Promise((resolve) => {
      const elapsedMs = Date.now() - this.startTime;
      this.isRecording = false;

      // Calculate total audio sample count
      let totalSamples = 0;
      for (const buffer of this.recordedBuffers) {
        totalSamples += buffer.length;
      }

      if (totalSamples === 0 || !this.audioContext) {
        this.cleanup();
        resolve(null);
        return;
      }

      // Merge all buffers into one continuous Float32Array
      const merged = new Float32Array(totalSamples);
      let offset = 0;
      for (const buffer of this.recordedBuffers) {
        merged.set(buffer, offset);
        offset += buffer.length;
      }

      const inputRate = this.audioContext.sampleRate;
      
      // Downsample to 16,000 Hz (native Whisper sample rate)
      const downsampled = downsampleBuffer(merged, inputRate, 16000);

      // Encode into uncompressed 16-bit PCM WAV Blob
      const wavBlob = encodeWAV(downsampled, 16000);

      console.log(`🎙️ Recording finished: ${elapsedMs}ms, Input: ${inputRate}Hz (${totalSamples} samples) -> Output: 16kHz (${downsampled.length} samples), WAV Blob: ${wavBlob.size} bytes`);

      this.cleanup();

      resolve({
        blob: wavBlob,
        durationMs: elapsedMs,
        sizeBytes: wavBlob.size,
        mimeType: 'audio/wav'
      });
    });
  }

  cleanup() {
    this.isRecording = false;

    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (e) {}
      this.processor = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
      this.gainNode = null;
    }

    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.recordedBuffers = [];

    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }
}

export const audioRecorder = new AudioRecorder();
