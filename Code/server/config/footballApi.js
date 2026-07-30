import "./dotenv.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://v3.football.api-sports.io";

// The free plan allows 100 requests/day and a single Match Detail page needs
// five of them, so responses are cached to disk rather than memory: nodemon
// restarts on every save and would otherwise re-spend the quota on each edit.
const CACHE_DIR = path.resolve(__dirname, "../.cache");

// The seasons we can actually read (2022-2024) are finished, so their data
// never changes. Long TTL, but not infinite — a live season would need this
// lowered, and a stale entry should eventually correct itself either way.
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function cachePathFor(requestPath) {
  const hash = crypto.createHash("sha1").update(requestPath).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

function readCache(requestPath) {
  try {
    const entry = JSON.parse(fs.readFileSync(cachePathFor(requestPath), "utf8"));
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
    return entry.response;
  } catch {
    // Missing file, unreadable file, or malformed JSON all mean the same thing
    // to a caller: no usable cache. Refetching is always a safe fallback.
    return null;
  }
}

function writeCache(requestPath, response) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      cachePathFor(requestPath),
      JSON.stringify({ path: requestPath, fetchedAt: Date.now(), response }),
    );
  } catch (error) {
    // A cache write failing is not worth failing the request over — we already
    // have the data. Log it so a broken disk doesn't silently burn quota.
    console.warn(`could not cache ${requestPath}:`, error.message);
  }
}

// Free plans allow 10 requests/minute and answer the 11th with
// "rateLimit: Too many requests". Every real network call is spaced out to stay
// under that. Cache hits skip this entirely, so a warm app is unaffected — it
// only paces genuinely new fetches, notably the bulk `npm run sync`.
const MIN_REQUEST_GAP_MS = 6500;
let lastRequestAt = 0;

async function throttle() {
  const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
}

// Older cache entries stored the bare `response` array. Normalising here keeps
// those files valid instead of forcing a re-fetch that would cost quota.
function normalise(entry) {
  if (Array.isArray(entry)) return { response: entry, paging: { current: 1, total: 1 } };
  return entry;
}

// `withPaging` returns { response, paging } instead of just the response array
// — needed to walk a paginated endpoint, where the caller has to know how many
// pages there are.
export async function footballApiGet(requestPath, { withPaging = false } = {}) {
  const cached = readCache(requestPath);
  if (cached) {
    const entry = normalise(cached);
    return withPaging ? entry : entry.response;
  }

  await throttle();

  const res = await fetch(`${BASE_URL}${requestPath}`, {
    headers: { "x-apisports-key": process.env.FOOTBALL_API_KEY },
  });
  if (!res.ok) throw new Error(`API-Football request failed: ${res.status}`);

  const body = await res.json();

  // API-Football answers 200 OK even when it refuses the request — a bad key,
  // a spent quota, or an out-of-plan season all come back as an empty
  // `response` with the real reason tucked into `errors`. Left unchecked those
  // are indistinguishable from "no fixtures found", which is what made the
  // whole app look like it had no data. `errors` is [] on success, an object
  // on failure.
  const { errors } = body;
  if (errors && !Array.isArray(errors) && Object.keys(errors).length > 0) {
    const detail = Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join("; ");
    throw new Error(`API-Football rejected ${requestPath} — ${detail}`);
  }

  const entry = {
    response: body.response,
    paging: body.paging ?? { current: 1, total: 1 },
  };
  writeCache(requestPath, entry);
  return withPaging ? entry : entry.response;
}
