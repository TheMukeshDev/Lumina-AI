// Simple Vercel Serverless proxy for Google Gemini API
// Receives POST { model: string, payload: object } and forwards to Google with server-side API key

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { model, payload } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server API key not configured (GEMINI_API_KEY).' });
    }

    if (!model || !payload) {
      return res.status(400).json({ error: 'Request must include `model` and `payload`.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    // Forward status and body (preserve JSON text)
    res.status(response.status).setHeader('Content-Type', 'application/json');

    // Forward Retry-After header if present
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) res.setHeader('Retry-After', retryAfter);

    return res.send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy failed', details: String(err) });
  }
}
