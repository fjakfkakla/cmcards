/* La connexion : le wallet signe un message (rien ne part sur la chaîne), le serveur
   vérifie la signature et pose un cookie signé. Aucune base, aucun mot de passe. */

import { createHmac, createPublicKey, randomBytes, timingSafeEqual, verify } from "node:crypto";
import { cookies } from "next/headers";
import { PublicKey } from "@solana/web3.js";
import { Oops } from "./errors";

const COOKIE = "cm_session";
const WEEK = 7 * 24 * 3600;
const NONCE_TTL = 10 * 60 * 1000;

function secret() {
  const s = process.env.SESSION_SECRET || (process.env.VERCEL ? "" : "cmcards-dev-secret");
  if (!s) throw new Oops(503, "Connexion pas encore configurée (SESSION_SECRET).");
  return s;
}
const mac = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");
const same = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function isWallet(w: unknown): w is string {
  if (typeof w !== "string" || w.length < 32 || w.length > 44) return false;
  try { return new PublicKey(w).toBase58() === w; } catch { return false; }
}

/* Le message à signer : il nomme le wallet et porte un nonce que seul le serveur sait
   fabriquer, valable dix minutes. */
export function challenge(wallet: string) {
  const n = `${randomBytes(12).toString("base64url")}.${Date.now()}`;
  return [
    "cm cards : connexion",
    "",
    `Wallet : ${wallet}`,
    `Nonce : ${n}.${mac(`${wallet}.${n}`)}`,
    "",
    "Signer ce message ne coûte rien et n'autorise aucune transaction.",
  ].join("\n");
}

export function checkSignIn(wallet: string, message: string, signature: string) {
  const w = /^Wallet : (\S+)$/m.exec(message)?.[1];
  const n = /^Nonce : ([\w-]+)\.(\d+)\.([\w-]+)$/m.exec(message);
  if (w !== wallet || !n) throw new Oops(400, "Message de connexion invalide.");
  const [, rand, ts, tag] = n;
  if (!same(tag, mac(`${wallet}.${rand}.${ts}`))) throw new Oops(400, "Message de connexion invalide.");
  if (Date.now() - Number(ts) > NONCE_TTL) throw new Oops(400, "Message expiré, recommence.");
  const key = createPublicKey({
    key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(new PublicKey(wallet).toBytes()).toString("base64url") },
    format: "jwk",
  });
  if (!verify(null, Buffer.from(message, "utf8"), key, Buffer.from(signature, "base64")))
    throw new Oops(401, "Signature refusée.");
}

export async function openSession(wallet: string) {
  const exp = Date.now() + WEEK * 1000;
  (await cookies()).set(COOKIE, `${wallet}.${exp}.${mac(`${wallet}.${exp}`)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: WEEK,
  });
}

export async function closeSession() {
  (await cookies()).delete(COOKIE);
}

/* Le wallet connecté, ou null. */
export async function sessionWallet(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  const [w, exp, tag] = v?.split(".") ?? [];
  if (!w || !exp || !tag || Number(exp) < Date.now()) return null;
  try { return same(tag, mac(`${w}.${exp}`)) ? w : null; } catch { return null; }
}

export async function needWallet() {
  const w = await sessionWallet();
  if (!w) throw new Oops(401, "Connecte ton wallet.");
  return w;
}
