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

const ALLOWED_ORIGIN = 'https://biancabeeaveril.github.io'; // ← ganti dengan domain Pages-mu
const GIST_FILE = 'ajar-data.json';

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const EMPTY = { univs: [], sems: [], courses: [], meetings: [], topics: [] };

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
    sems: mergeArr(g.sems || [], b.sems || []),
    courses: mergeArr(g.courses || [], b.courses || []),
    meetings: mergeArr(g.meetings || [], b.meetings || []),
    topics: mergeArr(g.topics || [], b.topics || []),
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
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
        return json({ error: 'gists fetch ' + getResp.status }, getResp.status);
      }
      const gistData = await getResp.json();
      const content = gistData.files?.[GIST_FILE]?.content;
      let gistDb = { ...EMPTY };
      if (content) {
        try { gistDb = { ...EMPTY, ...JSON.parse(content) }; } catch { gistDb = { ...EMPTY }; }
      }

      if (request.method === 'GET') {
        return json(gistDb);
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
        return json({ error: result.message || 'gist patch failed' }, patchResp.status);
      }
      return json({ ok: true });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};
