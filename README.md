# cm cards

Les cartes des traders de memecoins, sur Solana. On ouvre des boosters (payés en SOL),
on garde ses cartes ou on les revend aux autres joueurs, au prix qu'on fixe.

## Comment ça marche

- **Connexion** : le wallet (Phantom, Solflare, Backpack…) signe un message ; le serveur
  vérifie la signature et pose un cookie signé. Pas d'email, pas de mot de passe.
- **Boosters** : le seul prix fixé par cm cards. Le joueur paie le wallet de cm cards
  (`NEXT_PUBLIC_TREASURY`) avec un mémo `cmcards:pack:<booster>` ; le serveur relit la
  transaction sur la chaîne, puis tire les cartes. Chaque carte a un numéro, dans un stock
  fixe par rareté (une seule Mythic par trader).
- **Marché** : vendre est gratuit, le vendeur fixe son prix. L'acheteur réserve la carte
  (2 min), puis paie en une transaction : le prix au vendeur, 1 % de frais à cm cards, mémo
  `cmcards:buy:<annonce>`. Le serveur relit le paiement et passe la carte. Un paiement qui
  arrive trop tard est noté dans `refunds` pour être remboursé.
- Une carte ne contient pas de coins : elle vaut ce que les joueurs en donnent.

## Configuration

Copier `.env.example` en `.env.local`. En local, sans Upstash, les données vont dans
`.data/kv.json`. Sur Vercel, il faut Upstash Redis (intégration Vercel), `SESSION_SECRET`
et `NEXT_PUBLIC_TREASURY`, sinon les paiements restent fermés.

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
