module.exports = async function handler(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(200).json({ results: [] });

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=8`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).end(text);
  } catch (e) {
    res.status(504).json({ error: 'upstream timeout', results: [] });
  }
};
