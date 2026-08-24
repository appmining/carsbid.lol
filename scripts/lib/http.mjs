// Polite HTTP client shared by the scrapers.
//
// Identifies itself, keeps a floor on the gap between requests to one host,
// backs off on 429/5xx, and counts what it sent so a run can report its own
// footprint. auto-data.net allows `User-agent: *`, which is not a licence to
// hammer it.

export const USER_AGENT =
  "carsbid.lol-catalog/1.0 (+https://carsbid.lol; contact: berke.duzgun@dgpaysit.com)";

const lastRequestAt = new Map();
const counters = new Map();

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hostOf(url) {
  return new URL(url).host;
}

/** Wait out the remainder of `minIntervalMs` since this host was last hit. */
async function throttle(host, minIntervalMs) {
  const previous = lastRequestAt.get(host) ?? 0;
  const wait = previous + minIntervalMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt.set(host, Date.now());
}

export function requestCounts() {
  return Object.fromEntries(counters);
}

/**
 * @param {string} url
 * @param {{ minIntervalMs?: number, retries?: number, accept?: string, timeoutMs?: number }} opts
 * @returns {Promise<Response>}
 */
export async function politeFetch(url, opts = {}) {
  const {
    minIntervalMs = 1000,
    retries = 4,
    accept = "text/html,application/xhtml+xml",
    timeoutMs = 30000,
  } = opts;
  const host = hostOf(url);

  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle(host, minIntervalMs);
    counters.set(host, (counters.get(host) ?? 0) + 1);

    let res;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: accept },
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "follow",
      });
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(2000 * 2 ** attempt);
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      if (attempt === retries) return res;
      // Honour Retry-After when the server sends one, else exponential backoff.
      const retryAfter = Number(res.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 2000 * 2 ** attempt;
      await sleep(delay);
      continue;
    }

    return res;
  }
  throw new Error(`unreachable: ${url}`);
}

export async function fetchText(url, opts) {
  const res = await politeFetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export async function fetchJson(url, opts) {
  const res = await politeFetch(url, { accept: "application/json", ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}
