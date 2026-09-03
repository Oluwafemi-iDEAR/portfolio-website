// /api/admin  (password protected)
//   GET  → list ALL repos (public + private) with their current on/off state.
//   POST → save { order: [...names], overrides: {...} } to the KV store.
// Auth: send header  Authorization: Bearer <ADMIN_SECRET>
import {
  readConfig,
  writeConfig,
  listOwnedRepos,
  isAuthorized,
  githubConfigured,
  kvConfigured
} from './_lib.js';

export default async function handler(req, res) {
  // Never cache admin responses.
  res.setHeader('Cache-Control', 'no-store');

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!githubConfigured() || !kvConfigured()) {
    return res.status(500).json({
      error: 'Backend not fully configured',
      needs: {
        GITHUB_TOKEN: githubConfigured(),
        KV: kvConfigured()
      }
    });
  }

  try {
    if (req.method === 'GET') {
      const config = await readConfig();
      const orderIndex = new Map(config.order.map((n, i) => [n.toLowerCase(), i]));
      const repos = await listOwnedRepos(true);

      const items = repos.map((r) => ({
        name: r.name,
        isPrivate: Boolean(r.private),
        homepage: (r.homepage || '').trim(),
        description: r.description || '',
        language: r.language || '',
        pushedAt: r.pushed_at,
        enabled: orderIndex.has(r.name.toLowerCase()),
        order: orderIndex.has(r.name.toLowerCase()) ? orderIndex.get(r.name.toLowerCase()) : -1
      }));

      // Enabled first (in saved order), then the rest by most recent.
      items.sort((a, b) => {
        if (a.enabled && b.enabled) return a.order - b.order;
        if (a.enabled) return -1;
        if (b.enabled) return 1;
        return new Date(b.pushedAt) - new Date(a.pushedAt);
      });

      return res.status(200).json({ items, overrides: config.overrides });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!Array.isArray(body.order)) {
        return res.status(400).json({ error: 'Expected { order: [...] }' });
      }
      // Validate the submitted names against repos the owner actually has.
      const repos = await listOwnedRepos(true);
      const valid = new Set(repos.map((r) => r.name));
      const order = body.order.filter((n) => valid.has(n));
      const saved = await writeConfig({ order, overrides: body.overrides || {} });
      return res.status(200).json({ ok: true, saved });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('api/admin error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
