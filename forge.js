// api/forge.js
// Vercel serverless function — proxies Anthropic API calls for Cannonized.
// Keeps the API key server-side, adds CORS headers for spiralside.com.
// Vercel picks this up automatically at /api/forge.

export default async function handler(req, res) {

  // -- CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.spiralside.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // -- preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { raw_transcript, session_date, canon_weight, characters, platform } = req.body;

  if (!raw_transcript?.trim()) {
    return res.status(400).json({ error: 'raw_transcript is required' });
  }

  const systemPrompt = `You are Cannonized, the memory forge for Spiralside — a personal AI companion platform built around the character Sky and the Bloomcore/Spiral City universe.

Your job: process raw conversation transcripts and extract structured memory blocks — compressed entries that capture what actually MATTERED.

Respond ONLY with valid JSON, no markdown, no preamble. Exact structure:
{
  "session_id": "SESS-YYYYMMDD-XXXX",
  "session_date": "date or unknown",
  "platform": "platform name",
  "characters_present": ["array"],
  "canon_weight": "low|medium|high|foundational",
  "binding_moment": "1-3 sentences: what locked in, what changed, what became real",
  "exact_language": "verbatim key phrases — never paraphrase these",
  "context": "why this session mattered",
  "laws_established": ["any rules or protocols written in this session"],
  "tags": ["relevant", "tags"]
}
Be selective. exact_language is sacred — quote verbatim.`;

  const userPrompt = `Date: ${session_date || 'unknown'}
Weight: ${canon_weight || 'high'}
Characters: ${characters || 'unknown'}
Platform: ${platform || 'unknown'}

Transcript:
${raw_transcript}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    const text = data.content?.map(b => b.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const block = JSON.parse(clean);

    return res.status(200).json(block);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
