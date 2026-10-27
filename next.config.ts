import type { NextConfig } from "next";

/* Comme memescanner : le serveur (l'API, ses secrets, Redis) tourne sur Railway, et
   toutes les variables vivent là-bas. Vercel ne sert que les pages, et renvoie /api/*
   au service Railway : il n'a besoin d'aucune variable. L'adresse est écrite ici, en
   dur ; vide, Vercel répond lui-même (paiements fermés, faute de variables). */
const RAILWAY = "https://cmcards-production.up.railway.app";

const nextConfig: NextConfig = {
  /* Les anciennes adresses en français, gardées pour les liens déjà partagés. */
  async redirects() {
    return [
      { source: "/marche", destination: "/market", permanent: true },
      { source: "/profil", destination: "/profile", permanent: true },
      { source: "/cartes", destination: "/cards", permanent: true },
      { source: "/cartes/:id", destination: "/cards/:id", permanent: true },
    ];
  },
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
