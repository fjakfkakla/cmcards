/* La chaîne : le réseau, le wallet de cm cards, les mémos qui lient un paiement à
   un achat. Lu par le navigateur comme par le serveur. */

export type Cluster = "devnet" | "mainnet-beta";
export const CLUSTER: Cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta" ? "mainnet-beta" : "devnet";
export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC
  || (CLUSTER === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com");

/* Le wallet qui reçoit le prix des boosters et les frais du marché. */
export const TREASURY = process.env.NEXT_PUBLIC_TREASURY ?? "";

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
export const explorer = (sig: string) =>
  `https://solscan.io/tx/${sig}${CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;
