/* La chaîne : le réseau, les frais, les mémos qui lient un paiement à un achat.
   Lu par le navigateur comme par le serveur. */

export type Cluster = "devnet" | "mainnet-beta";
export const defaultRpc = (c: Cluster) =>
  c === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com";

/* Ce que le navigateur doit savoir, lu sur le serveur (/api/config) : toutes les
   variables vivent sur Railway, aucune n'est cuite dans le build de Vercel. */
export type Config = {
  cluster: Cluster;
  rpc: string;      // le RPC du navigateur (jamais celui du serveur, qui peut porter une clé)
  treasury: string; // le wallet de cm cards ; vide : les paiements sont fermés
};
export const DEFAULT_CONFIG: Config = { cluster: "devnet", rpc: defaultRpc("devnet"), treasury: "" };

/* Les frais du marché : 1 % du prix, payés par l'acheteur en plus du prix, versés à
   cm cards. Le vendeur reçoit son prix entier ; mettre en vente ne coûte rien. */
export const FEE_BPS = 100;
export const LAMPORTS = 1_000_000_000;
export const MIN_PRICE = 0.001; // SOL
export const MAX_PRICE = 100_000;
export const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

export const toLamports = (sol: number) => Math.round(sol * LAMPORTS);
export const toSol = (lamports: number) => lamports / LAMPORTS;
export const feeOf = (lamports: number) => Math.ceil((lamports * FEE_BPS) / 10_000);

/* Le mémo d'un paiement : le serveur ne compte un virement que pour l'achat qu'il nomme. */
export const MEMO = {
  pack: (pack: string) => `cmcards:pack:${pack}`,
  buy: (listing: string) => `cmcards:buy:${listing}`,
};

export const short = (w: string) => `${w.slice(0, 4)}…${w.slice(-4)}`;
export const explorer = (sig: string, cluster: Cluster) =>
  `https://solscan.io/tx/${sig}${cluster === "devnet" ? "?cluster=devnet" : ""}`;
