import type { NextConfig } from "next";

/* Comme memescanner : le serveur (l'API, ses secrets, Redis) tourne sur Railway, et
   toutes les variables vivent là-bas. Vercel ne sert que les pages, et renvoie /api/*
   au service Railway : il n'a besoin d'aucune variable. L'adresse est écrite ici, en
   dur ; vide, Vercel répond lui-même (paiements fermés, faute de variables). */
const RAILWAY = "";

const nextConfig: NextConfig = {
  async rewrites() {
    if (!process.env.VERCEL || !RAILWAY) return [];
    return { beforeFiles: [{ source: "/api/:path*", destination: `${RAILWAY}/api/:path*` }], afterFiles: [], fallback: [] };
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
