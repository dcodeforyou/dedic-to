module.exports = async function handler(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(200).json({ results: [] });

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=8`;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000),
    });
    const data = await upstream.json();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (e) {
    res.status(504).json({ results: [], error: e.message });
  }
};
