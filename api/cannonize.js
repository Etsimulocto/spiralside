export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { raw_transcript, session_date, canon_weight, characters, platform, schema_fields } = req.body || {};
  if (!raw_transcript) return res.status(400).json({ error: 'raw_transcript required' });

  // Get auth token from request header — pass through to Railway
  const authHeader = req.headers['authorization'] || '';

  try {
    const railResp = await fetch('https://web-production-4e6f3.up.railway.app/cannonize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ raw_transcript, session_date, canon_weight, characters, platform, schema_fields: schema_fields || [] }),
    });

    const data = await railResp.json();

    if (!railResp.ok) {
      return res.status(railResp.status).json({ error: data.detail || 'Railway error' });
    }

    // Return block + usage info to frontend
    return res.status(200).json(data.block || data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
