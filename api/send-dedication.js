const SUPABASE_URL        = 'https://lwjolnfoojblpnzeuxzl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_KEY           = process.env.OPENAI_KEY;

const BLOCK_IF = {
  'harassment/threatening': 0.60,
  'harassment':             0.82,
  'hate/threatening':       0.60,
  'self-harm/intent':       0.75,
  'violence/graphic':       0.80,
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { page_hash, track_name, artist_name, artwork_url, preview_url,
          clip_start, clip_duration, message } = req.body || {};
  if (!page_hash || !track_name) return res.status(400).json({ error: 'missing_fields' });

  // ── Moderation ────────────────────────────────────────────────
  if (message && message.trim() && OPENAI_KEY) {
    try {
      const modRes = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: message }),
        signal: AbortSignal.timeout(5000),
      });
      if (modRes.ok) {
        const { results } = await modRes.json();
        const scores = results?.[0]?.category_scores || {};
        for (const [cat, threshold] of Object.entries(BLOCK_IF)) {
          if ((scores[cat] || 0) > threshold) {
            return res.status(422).json({ error: 'message_flagged' });
          }
        }
      }
    } catch {}
  }

  // ── Insert via Supabase REST (no npm package needed) ──────────
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/anonymous_dedications`, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({
      page_hash,
      track_name,
      artist_name,
      artwork_url:   artwork_url   || null,
      preview_url:   preview_url   || null,
      clip_start:    clip_start    ?? 0,
      clip_duration: clip_duration ?? 15,
      message:       message       || null,
    }),
  });

  if (!insertRes.ok) {
    const detail = await insertRes.text().catch(() => '');
    return res.status(500).json({ error: 'db_error', detail });
  }
  return res.status(200).json({ ok: true });
};
