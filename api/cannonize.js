export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { raw_transcript, session_date, canon_weight, characters, platform } = req.body;
  if (!raw_transcript || !raw_transcript.trim()) return res.status(400).json({ error: 'raw_transcript required' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        system: 'You are Cannonized, memory forge for Spiralside. Extract structured memory blocks from transcripts. Respond ONLY with valid JSON: {session_id, session_date, platform, characters_present, canon_weight, binding_moment, exact_language, context, laws_established, tags}',
        messages: [{ role: 'user', content: 'Date: '+(session_date||'unknown')+' Weight: '+(canon_weight||'high')+' Characters: '+(characters||'unknown')+' Platform: '+(platform||'unknown')+'\n\nTranscript:\n'+raw_transcript }]
      })
    });
    const data = await r.json();
    if (r.status !== 200) return res.status(r.status).json({ error: data.error && data.error.message });
    const text = (data.content || []).map(b => b.text || '').join('');
    const block = JSON.parse(text.replace(/```json|```/g,'').trim());
    return res.status(200).json(block);
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
