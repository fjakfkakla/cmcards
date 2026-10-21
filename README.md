# cm cards

Les cartes des traders de memecoins, sur Solana. On ouvre des boosters (payés en SOL),
on garde ses cartes ou on les revend aux autres joueurs, au prix qu'on fixe.

## Comment ça marche

- **Connexion** : le wallet (Phantom, Solflare, Backpack…) signe un message ; le serveur
  vérifie la signature et pose un cookie signé. Pas d'email, pas de mot de passe.
- **Boosters** : le seul prix fixé par cm cards. Le joueur paie le wallet de cm cards
  (`TREASURY_WALLET`) avec un mémo `cmcards:pack:<booster>` ; le serveur relit la
  transaction sur la chaîne, puis tire les cartes. Chaque carte a un numéro, dans un stock
  fixe par rareté (une seule Mythic par trader).
- **Marché** : vendre est gratuit, le vendeur fixe son prix. L'acheteur réserve la carte
  (2 min), puis paie en une transaction : le prix au vendeur, 1 % de frais à cm cards, mémo
  `cmcards:buy:<annonce>`. Le serveur relit le paiement et passe la carte. Un paiement qui
  arrive trop tard est noté dans `refunds` pour être remboursé.
- Une carte ne contient pas de coins : elle vaut ce que les joueurs en donnent.

## Déploiement : Railway + Vercel (comme memescanner)

- **Railway** fait tourner l'app entière (`npm run build`, `npm start`) avec **toutes les
  variables** (voir `.env.example`) et un **Redis** dans le même projet
  (`REDIS_URL = ${{Redis.REDIS_URL}}`). Les cartes, les annonces et les paiements vivent
  dans ce Redis.
- **Vercel** sert les pages et renvoie `/api/*` au service Railway : **aucune variable** à
  y mettre. L'adresse Railway est écrite en dur dans `next.config.ts` (`RAILWAY`).
- Le navigateur lit le réseau, son RPC et le wallet de cm cards sur `/api/config` : rien
  n'est figé dans le build.
- Sans Redis sur Railway (ou Vercel), les paiements restent fermés : un fichier ne survit
  pas à un déploiement. En local, sans `REDIS_URL`, les données vont dans `.data/kv.json`.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:3000
```

## Le logo

Généré par script, jamais retouché à la main :

```bash
pip install fonttools brotli skia-pathops
python3 tools/brand/cmcards.py    # public/brand/*.svg
node tools/brand/png.cjs          # PNG, src/app/favicon.ico, tools/brand/board.png (planche de contrôle)
```

Le symbole : une carte, et une pièce dedans. Le nom : « cm » Bricolage Grotesque 800
à l'encre, « cards » Bricolage 500 en bleu.

Pour X, les mêmes scripts écrivent `public/brand/cmcards-x-pdp.png` (la photo de
profil, 1000 × 1000, X la rogne en rond) et `public/brand/cmcards-x-banner.png` (la
bannière, 1500 × 500 : le logo, l'accroche en anglais, cinq cartes de la saison en
éventail, rien d'important en bas à gauche où X pose la photo de profil).
