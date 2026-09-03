// Shared helpers for the serverless showcase backend.
// Files prefixed with "_" inside /api are NOT exposed as routes by Vercel.
import crypto from 'node:crypto';

// ---- Config key in the KV store ----------------------------------------
export const CONFIG_KEY = 'showcase:config';

// Environment (set these in Vercel → Project → Settings → Environment Variables):
//   GITHUB_TOKEN  — a GitHub token that can read your repos (see README).
//   ADMIN_SECRET  — the password that protects the dashboard.
//   KV_REST_API_URL / KV_REST_API_TOKEN   (added automatically by Vercel KV)
//   — or — UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Upstash marketplace)
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

export function kvConfigured() {
  return Boolean(KV_URL && KV_TOKEN);
}

// Run a single Redis command against the Upstash-compatible REST API.
async function kvCommand(command) {
  if (!kvConfigured()) throw new Error('KV store is not configured');
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + KV_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  if (!res.ok) throw new Error('KV request failed: ' + res.status);
  const data = await res.json();
  return data.result;
}

export async function kvGetJSON(key) {
  const raw = await kvCommand(['GET', key]);
  if (raw == null) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return null;
  }
}

export async function kvSetJSON(key, value) {
  return kvCommand(['SET', key, JSON.stringify(value)]);
}

// ---- Config helpers -----------------------------------------------------
// Config shape: { order: ["repoName", ...], overrides: { repoName: {title,badge,description,tags[]} } }
export async function readConfig() {
  const cfg = (await kvGetJSON(CONFIG_KEY)) || {};
  return {
    order: Array.isArray(cfg.order) ? cfg.order : [],
    overrides: cfg.overrides && typeof cfg.overrides === 'object' ? cfg.overrides : {}
  };
}

export async function writeConfig(cfg) {
  const clean = {
    order: Array.isArray(cfg.order) ? cfg.order.filter((n) => typeof n === 'string') : [],
    overrides: cfg.overrides && typeof cfg.overrides === 'object' ? cfg.overrides : {}
  };
  await kvSetJSON(CONFIG_KEY, clean);
  return clean;
}

// ---- GitHub helpers -----------------------------------------------------
export function githubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN);
}

export async function gh(path) {
  return fetch('https://api.github.com' + path, {
    headers: {
      Authorization: 'Bearer ' + (process.env.GITHUB_TOKEN || ''),
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-showcase',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
}

// Fetch every repo the token owner owns (public + private). Cached in module
// scope for a short time so warm serverless instances avoid refetching.
let repoCache = { time: 0, repos: null };
const REPO_CACHE_MS = 30 * 1000;

// Pass force=true (used by the admin dashboard) to bypass the cache so a
// just-pushed repo appears immediately instead of waiting out the TTL.
export async function listOwnedRepos(force = false) {
  if (!force && repoCache.repos && Date.now() - repoCache.time < REPO_CACHE_MS) {
    return repoCache.repos;
  }
  const repos = [];
  for (let page = 1; page <= 5; page += 1) {
    const res = await gh(
      '/user/repos?per_page=100&affiliation=owner&sort=created&direction=desc&page=' + page
    );
    if (!res.ok) throw new Error('GitHub list repos failed: ' + res.status);
    const batch = await res.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  repoCache = { time: Date.now(), repos };
  return repos;
}

export async function fetchLanguages(languagesUrl) {
  try {
    const res = await fetch(languagesUrl, {
      headers: {
        Authorization: 'Bearer ' + (process.env.GITHUB_TOKEN || ''),
        Accept: 'application/vnd.github+json',
        'User-Agent': 'portfolio-showcase'
      }
    });
    if (!res.ok) return [];
    const map = await res.json();
    return Object.keys(map).sort((a, b) => map[b] - map[a]);
  } catch (e) {
    return [];
  }
}

// ---- Auth ---------------------------------------------------------------
export function isAuthorized(req) {
  const secret = process.env.ADMIN_SECRET || '';
  const header = req.headers.authorization || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
