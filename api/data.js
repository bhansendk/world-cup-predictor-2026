import { put, list } from '@vercel/blob';

const BLOB_NAME = 'wc2026-tirsdagsklubben.json';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';

// VM 2026 kickoff: 11. juni 2026 kl. 21:00 CEST (UTC+2) = 19:00 UTC
const REVEAL_DATE = new Date('2026-06-11T19:00:00Z');

async function readBlob() {
  try {
    const { blobs } = await list({ prefix: BLOB_NAME });
    if (!blobs.length) return { colleagues: [], results: {} };
    const res = await fetch(blobs[0].url + `?t=${Date.now()}`, { cache: 'no-store' });
    return await res.json();
  } catch { return { colleagues: [], results: {} }; }
}

async function writeBlob(data) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN mangler i Vercel Environment Variables');
  }
  await put(BLOB_NAME, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json'
  });
}

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
      const data = await readBlob();
      const isAdmin = req.query.password === ADMIN_PASS;
      const revealed = new Date() >= REVEAL_DATE;
      if (!revealed && !isAdmin) {
        // Strip predictions - only return name, mode, submittedAt
        return res.status(200).json({
          ...data,
          revealed: false,
          revealDate: REVEAL_DATE.toISOString(),
          colleagues: data.colleagues.map(({ name, mode, submittedAt }) => ({ name, mode, submittedAt })),
        });
      }
      return res.status(200).json({ ...data, revealed: true, revealDate: REVEAL_DATE.toISOString() });
    }

    if (req.method === 'POST') {
      const action = req.query.action;
      const body = req.body || {};

      if (action === 'verify') {
        const { password } = body;
        if (password !== ADMIN_PASS) return res.status(403).json({ error: 'Forkert adgangskode' });
        return res.status(200).json({ ok: true });
      }

      if (action === 'submit') {
        const { name, mode, prediction } = body;
        if (!name?.trim()) return res.status(400).json({ error: 'Navn mangler' });
        if (new Date() >= REVEAL_DATE) {
          return res.status(403).json({ error: 'Tilmelding er lukket. VM er startet.' });
        }
        const data = await readBlob();
        const idx = data.colleagues.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
        const entry = { name: name.trim(), mode, prediction, submittedAt: new Date().toISOString() };
        if (idx >= 0) data.colleagues[idx] = entry;
        else data.colleagues.push(entry);
        await writeBlob(data);
        return res.status(200).json({ ok: true });
      }

      if (action === 'results') {
        const { results, password } = body;
        if (password !== ADMIN_PASS) return res.status(403).json({ error: 'Forkert adgangskode' });
        const data = await readBlob();
        data.results = results;
        await writeBlob(data);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Ukendt action' });
    }

    if (req.method === 'DELETE') {
      const { action, name, password } = req.query;

      if (action === 'clearAll') {
        if (password !== ADMIN_PASS) return res.status(403).json({ error: 'Forkert adgangskode' });
        const data = await readBlob();
        data.colleagues = [];
        await writeBlob(data);
        return res.status(200).json({ ok: true });
      }

      if (name) {
        if (password !== ADMIN_PASS) return res.status(403).json({ error: 'Forkert adgangskode' });
        const data = await readBlob();
        data.colleagues = data.colleagues.filter(c => c.name.toLowerCase() !== name.toLowerCase());
        await writeBlob(data);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Mangler parametre' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Uventet serverfejl' });
  }
}
