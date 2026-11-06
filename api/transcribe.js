export default async function handler(req, res) {
  // Set CORS headers for security and portability
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Server configuration error: GROQ_API_KEY environment variable is missing on the server.' 
    });
  }

  try {
    const { audioBase64, mimeType = 'audio/wav', language = 'hi' } = req.body || {};
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 parameter is required.' });
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    const whisperModels = ['whisper-large-v3-turbo', 'whisper-large-v3'];
    let lastError = null;

    for (const model of whisperModels) {
      try {
        const formData = new FormData();
        formData.append('file', blob, 'counter_recording.wav');
        formData.append('model', model);
        formData.append('language', language === 'en' ? 'en' : 'hi');
        formData.append(
          'prompt',
          'किराना खाता: अविनाश, रमेश भाई, वैशाली, पार्थ, सुनीता, शर्मा जी, पिंटू, महेश। सेव, नमकीन, आलू, कांदा, प्याज, टमाटर, धनिया, चीनी, दूध, तेल, चावल। दो किलो, चार किलो, उधार लिखो, जमा करो।'
        );
        formData.append('temperature', '0');
        formData.append('response_format', 'verbose_json');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json({
            text: (data.text || '').trim(),
            language: data.language,
            duration: data.duration
          });
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || `Whisper status ${response.status}`;
        }
      } catch (err) {
        lastError = err.message || 'Whisper request failed';
      }
    }

    return res.status(502).json({ error: lastError || 'Transcription failed on Groq Whisper.' });
  } catch (error) {
    console.error('API /transcribe error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
