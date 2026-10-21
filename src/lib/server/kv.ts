/* La mémoire du serveur : quelques commandes Redis. En production, le Redis du projet
   Railway (REDIS_URL = ${{Redis.REDIS_URL}}), ou Upstash par son API REST ; en local,
   un fichier .data/kv.json qui comprend les mêmes commandes. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Redis from "ioredis";

export type Cmd = (string | number)[];

const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

const REDIS_URL = process.env.REDIS_URL || "";
let redis: Redis | null = null;
const tcp = () => (redis ??= new Redis(REDIS_URL, { maxRetriesPerRequest: 3, family: 0 })); // family 0 : le réseau privé de Railway est en IPv6

/* Sur Railway ou Vercel, un fichier ne survit pas à un déploiement : sans vrai Redis,
   rien ne s'achète. */
export const kvReady = () =>
  !!REDIS_URL || !!(URL_ && TOKEN) || !(process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT);

export async function run<T = unknown>(cmd: Cmd): Promise<T> {
  if (REDIS_URL) {
    const [op, ...args] = cmd;
    return (await tcp().call(String(op), ...args.map(String))) as T;
  }
  if (URL_ && TOKEN) {
    const j = await upstash("", cmd);
    if (j.error) throw new Error(`kv: ${j.error}`);
    return j.result as T;
  }
  return local(cmd) as T;
}

/* Tout ou rien : les commandes passent ensemble. */
export async function multi(cmds: Cmd[]): Promise<unknown[]> {
  if (!cmds.length) return [];
  if (REDIS_URL) {
    // ioredis range les commandes d'un multi par nom de méthode : en minuscules
    const res = await tcp().multi(cmds.map(([op, ...a]) => [String(op).toLowerCase(), ...a.map(String)])).exec();
    if (!res) throw new Error("kv: multi annulé");
    return res.map(([e, r]) => { if (e) throw e; return r; });
  }
  if (URL_ && TOKEN) {
    const j = await upstash("/multi-exec", cmds);
    if (!Array.isArray(j)) throw new Error(`kv: ${j.error ?? "multi-exec"}`);
    return j.map((r: { result?: unknown; error?: string }) => {
      if (r.error) throw new Error(`kv: ${r.error}`);
      return r.result;
    });
  }
  return cmds.map(local);
}

/* Lit des objets JSON rangés sous plusieurs clés (les absents sont écartés). */
export async function getMany<T>(keys: string[]): Promise<T[]> {
  if (!keys.length) return [];
  const out: T[] = [];
  for (let i = 0; i < keys.length; i += 500) {
    const raw = await run<(string | null)[]>(["MGET", ...keys.slice(i, i + 500)]);
    for (const r of raw) if (r) out.push(JSON.parse(r) as T);
  }
  return out;
}

export async function getJson<T>(key: string): Promise<T | null> {
  const r = await run<string | null>(["GET", key]);
  return r ? (JSON.parse(r) as T) : null;
}

async function upstash(path: string, body: unknown) {
  const r = await fetch(URL_ + path, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return r.json();
}

/* ——— le fichier local ——— */

type Val = { s: string } | { set: string[] } | { list: string[] };
type Db = { v: Record<string, Val>; exp: Record<string, number> };
const FILE = join(process.cwd(), ".data", "kv.json");
let db: Db | null = null;

function load(): Db {
  if (db) return db;
  try { db = JSON.parse(readFileSync(FILE, "utf8")) as Db; } catch { db = { v: {}, exp: {} }; }
  return db;
}
function save() {
  if (!existsSync(join(FILE, ".."))) mkdirSync(join(FILE, ".."), { recursive: true });
  writeFileSync(FILE, JSON.stringify(db));
}

function local(cmd: Cmd): unknown {
  const d = load();
  const [op, ...a] = cmd.map(String);
  const now = Date.now();
  const live = (k: string) => {
    if (d.exp[k] && d.exp[k] <= now) { delete d.v[k]; delete d.exp[k]; }
    return d.v[k];
  };
  const str = (k: string) => { const v = live(k); return v && "s" in v ? v.s : null; };
  const set = (k: string) => { const v = live(k); return v && "set" in v ? v.set : []; };
  const list = (k: string) => { const v = live(k); return v && "list" in v ? v.list : []; };
  let out: unknown;
  switch (op.toUpperCase()) {
    case "GET": return str(a[0]);
    case "MGET": return a.map(str);
    case "EXISTS": return a.filter((k) => live(k) !== undefined).length;
    case "SMEMBERS": return [...set(a[0])];
    case "SISMEMBER": return set(a[0]).includes(a[1]) ? 1 : 0;
    case "LRANGE": {
      const l = list(a[0]), stop = Number(a[2]);
      return l.slice(Number(a[1]), stop < 0 ? l.length + stop + 1 : stop + 1);
    }
    case "SET": {
      const [k, v, ...opts] = a;
      const up = opts.map((o) => o.toUpperCase());
      if (up.includes("NX") && live(k) !== undefined) return null;
      d.v[k] = { s: v };
      const ex = up.indexOf("EX");
      if (ex >= 0) d.exp[k] = now + Number(opts[ex + 1]) * 1000; else delete d.exp[k];
      out = "OK"; break;
    }
    case "DEL": out = a.filter((k) => { const had = live(k) !== undefined; delete d.v[k]; delete d.exp[k]; return had; }).length; break;
    case "INCR": { const n = Number(str(a[0]) ?? 0) + 1; d.v[a[0]] = { s: String(n) }; out = n; break; }
    case "SADD": { const s = set(a[0]); const add = a.slice(1).filter((m) => !s.includes(m)); d.v[a[0]] = { set: [...s, ...add] }; out = add.length; break; }
    case "SREM": { const s = set(a[0]); const rest = s.filter((m) => !a.slice(1).includes(m)); d.v[a[0]] = { set: rest }; out = s.length - rest.length; break; }
    case "LPUSH": { const l = list(a[0]); d.v[a[0]] = { list: [...a.slice(1).reverse(), ...l] }; out = l.length + a.length - 1; break; }
    case "LTRIM": { const l = list(a[0]); d.v[a[0]] = { list: l.slice(Number(a[1]), Number(a[2]) + 1) }; out = "OK"; break; }
    default: throw new Error(`kv: ${op} n'existe pas en local`);
  }
  save();
  return out;
}
