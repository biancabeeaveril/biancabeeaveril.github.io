/**
 * Cloudflare Worker — log-pengajar-writer
 *
 * Read/write proxy untuk app "Log Pengajaran".
 * Data disimpan di GitHub Gist (file: ajar-data.json).
 * Browser TIDAK pernah menyentuh GitHub API secara langsung untuk menulis,
 * dan PAT tidak pernah masuk ke browser.
 *
 * Secrets (Worker → Settings → Variables and Secrets):
 *   GIST_ID  = id gist
 *   GIST_PAT = GitHub PAT (scope: gist)
 */

const ALLOWED_ORIGINS = [
  'https://biancabeeaveril.github.io', // repo fork (username.github.io)
  'https://dionisiusnp.github.io',     // repo asal
]; // ← tambah domain lain bila perlu
const GIST_FILE = 'ajar-data.json';

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

const EMPTY = { univs: [], courses: [], meetings: [], topics: [], members: [], groups: [], schedules: [] };

/** Merge dua array by id — item dengan updatedAt lebih baru menang. */
function mergeArr(g = [], b = []) {
  const map = new Map();
  for (const it of g) map.set(it.id, it);
  for (const it of b) {
    const ex = map.get(it.id);
    if (!ex || (it.updatedAt || 0) >= (ex.updatedAt || 0)) map.set(it.id, it);
  }
  return [...map.values()];
}

function mergeDb(g = {}, b = {}) {
  return {
    univs: mergeArr(g.univs || [], b.univs || []),
    courses: mergeArr(g.courses || [], b.courses || []),
    meetings: mergeArr(g.meetings || [], b.meetings || []),
    topics: mergeArr(g.topics || [], b.topics || []),
    members: mergeArr(g.members || [], b.members || []),
    groups: mergeArr(g.groups || [], b.groups || []),
    schedules: mergeArr(g.schedules || [], b.schedules || []),
  };
}

function json(data, status = 200, cors = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    const ghHdr = {
      'Authorization': `Bearer ${env.GIST_PAT}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'log-pengajar-worker',
    };

    try {
      /* ── READ ── */
      const getResp = await fetch(`https://api.github.com/gists/${env.GIST_ID}`, { headers: ghHdr });
      if (!getResp.ok) {
        return json({ error: 'gists fetch ' + getResp.status }, getResp.status, cors);
      }
      const gistData = await getResp.json();
      const content = gistData.files?.[GIST_FILE]?.content;
      let gistDb = { ...EMPTY };
      if (content) {
        try { gistDb = { ...EMPTY, ...JSON.parse(content) }; } catch { gistDb = { ...EMPTY }; }
      }

      if (request.method === 'GET') {
        return json(gistDb, 200, cors);
      }

      /* ── WRITE (read-merge-write) ── */
      const browserDb = await request.json();
      const merged = mergeDb(gistDb, browserDb || {});

      const patchResp = await fetch(`https://api.github.com/gists/${env.GIST_ID}`, {
        method: 'PATCH',
        headers: ghHdr,
        body: JSON.stringify({
          files: { [GIST_FILE]: { content: JSON.stringify(merged, null, 2) } },
        }),
      });
      const result = await patchResp.json();
      if (!patchResp.ok) {
        return json({ error: result.message || 'gist patch failed' }, patchResp.status, cors);
      }
      return json({ ok: true }, 200, cors);
    } catch (e) {
      return json({ error: e.message }, 500, cors);
    }
  },
};
