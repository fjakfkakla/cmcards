/* La configuration du serveur, lue dans les variables de Railway. Les anciens noms
   NEXT_PUBLIC_* sont encore lus, pour ne rien casser. */

import { type Cluster, type Config, defaultRpc } from "../solana";

const env = (...names: string[]) => names.map((n) => process.env[n]).find((v) => v) ?? "";

export const CLUSTER: Cluster =
  env("SOLANA_CLUSTER", "NEXT_PUBLIC_SOLANA_CLUSTER") === "mainnet-beta" ? "mainnet-beta" : "devnet";
/* Le RPC du navigateur, public ; celui du serveur peut porter une clé privée. */
export const PUBLIC_RPC = env("SOLANA_RPC_PUBLIC", "NEXT_PUBLIC_SOLANA_RPC") || defaultRpc(CLUSTER);
export const SERVER_RPC = env("SOLANA_RPC") || PUBLIC_RPC;
export const TREASURY = env("TREASURY_WALLET", "NEXT_PUBLIC_TREASURY");

export const publicConfig = (): Config => ({ cluster: CLUSTER, rpc: PUBLIC_RPC, treasury: TREASURY });
