/**
 * Wispr Flow Voice Interface API Service
 * Official integration for Scaler x Wispr Flow Hackathon ("India Runs on Voice").
 * 
 * Endpoint: POST https://platform-api.wisprflow.ai/api/v1/dash/api
 * Supports custom `dictionary_context` to prevent phonetic degradation of Indian names
 * and regional Kirana terminology (e.g. 'Avinash', 'Vaishali', 'sev', 'kanda').
 */

/**
 * Converts a Blob to a raw base64 string (without the data URL prefix)
 */
export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        } else {
          reject(new Error('FileReader did not return a string'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcribe audio using Wispr Flow API with dynamic Kirana dictionary context
 * 
 * @param {string} apiKey - Wispr Flow API Key
 * @param {Blob} audioBlob - 16kHz mono PCM WAV blob
 * @param {string} language - Target language code ('hi' or 'en')
 * @param {Array<string>} customDictionary - Words/names to bias the recognition
 */
export async function transcribeWithWisprFlow({
  apiKey,
  audioBlob,
  language = 'hi',
  customDictionary = []
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Wispr Flow API Key is missing.');
  }

  const base64Audio = await blobToBase64(audioBlob);

  const defaultDictionary = [
    'Avinash', 'अविनाश', 'Vaishali', 'वैशाली', 'Ramesh Bhai', 'रमेश भाई',
    'Parth', 'पार्थ', 'Sunita', 'सुनीता', 'Sharma Ji', 'शर्मा जी',
    'Pintu', 'पिंटू', 'Mahesh Tailor', 'महेश',
    'sev', 'सेव', 'seb', 'सेब', 'namkeen', 'नमकीन',
    'aloo', 'आलू', 'kanda', 'कांदा', 'pyaz', 'प्याज़', 'tamatar', 'टमाटर',
    'dhania', 'धनिया', 'cheeni', 'चीनी', 'tel', 'तेल', 'dudh', 'दूध',
    'chawal', 'चावल', 'atta', 'आटा', 'dal', 'दाल', 'rawa', 'रवा', 'suji', 'सूजी',
    'kela chips', 'केला चिप्स', 'tilli tel', 'तिल का तेल',
    'likh do', 'लिख दो', 'udhaar', 'उधार', 'jama', 'जमा'
  ];

  const combinedDictionary = Array.from(new Set([...defaultDictionary, ...(customDictionary || [])]));

  console.log(`🎙️ Sending ${audioBlob.size} bytes (${audioBlob.type}) to Wispr Flow API...`);

  const response = await fetch('https://platform-api.wisprflow.ai/api/v1/dash/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      audio: base64Audio,
      language: language === 'en' ? ['en'] : ['hi'],
      context: {
        app: {
          name: 'GallaVoice Kirana',
          type: 'other'
        },
        dictionary_context: combinedDictionary
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Wispr Flow API error ${response.status}`);
  }

  const data = await response.json();
  console.log('⚡ Wispr Flow API response received:', data);

  const text = data.text || data.transcription || data.result || '';
  if (!text || !text.trim()) {
    throw new Error('Wispr Flow returned empty transcription.');
  }

  return text.trim();
}
