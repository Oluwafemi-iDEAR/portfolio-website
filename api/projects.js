// GET /api/projects  (public)
// Returns the enabled projects for the showcase carousel, in the order the
// dashboard set. Uses the server-side GitHub token so PRIVATE repos can be
// included — but only ever returns sanitized metadata (never code, never the
// token). For private repos, no code link is exposed and the "view" target is
// the landing page, or the contact page when there is no landing page.
import {
  readConfig,
  listOwnedRepos,
  fetchLanguages,
  githubConfigured,
  kvConfigured
} from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!githubConfigured() || !kvConfigured()) {
    // Backend not set up yet — tell the frontend to use its public fallback.
    return res.status(200).json({ configured: false, items: [] });
  }

  try {
    const config = await readConfig();
    const repos = await listOwnedRepos();
    const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));

    const enabled = config.order
      .map((name) => byName.get(String(name).toLowerCase()))
      .filter(Boolean);

    const items = await Promise.all(
      enabled.map(async (r) => {
        const languages = await fetchLanguages(r.languages_url);
        const homepage = (r.homepage || '').trim();
        const isPrivate = Boolean(r.private);
        const override = config.overrides[r.name] || {};

        // Where the big preview links to (computed server-side so a private
        // repo's code URL is never sent to the browser).
        let viewUrl;
        if (homepage) viewUrl = homepage;
        else if (isPrivate) viewUrl = '/contact.html';
        else viewUrl = r.html_url;

        return {
          name: r.name,
          owner: r.owner ? r.owner.login : '',
          isPrivate,
          live: homepage,
          viewUrl,
          showCode: !isPrivate,
          repoUrl: isPrivate ? '' : r.html_url,
          language: r.language || '',
          languages,
          topics: r.topics || [],
          githubDescription: r.description || '',
          pushedAt: r.pushed_at,
          override: {
            title: override.title || '',
            badge: override.badge || '',
            description: override.description || '',
            tags: Array.isArray(override.tags) ? override.tags : []
          }
        };
      })
    );

    // Short CDN cache: keeps GitHub calls low while staying near real-time.
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.status(200).json({ configured: true, items });
  } catch (err) {
    console.error('api/projects error:', err);
    return res.status(200).json({ configured: false, items: [], error: 'load_failed' });
  }
}
