# cm cards

Des packs de memecoins sur Solana : chaque carte est un NFT qui contient de vrais coins.

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
