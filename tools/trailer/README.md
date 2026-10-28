# La bande-annonce

Une vidéo de 36 s (1920 × 1080, 60 i/s) montée à partir de la vraie app : les plans sont
filmés image par image dans le navigateur, puis montés par une page React
(`src/components/trailer/Trailer.tsx`, servie sur `/trailer` en développement seulement).

```bash
npm run dev                                # l'app sur http://localhost:3000
node tools/trailer/shoot.cjs               # les plans : public/trailer/<plan>/*.jpg (faux serveur : mock.cjs)
python3 tools/trailer/music.py             # la musique et les bruitages : tools/trailer/out/music.wav
node tools/trailer/render.cjs              # le film : tools/trailer/out/cmcards-trailer.mp4
```

- `engine.cjs` fige le temps de la page (horloge de Playwright, animations CSS en pause)
  et l'avance de 1/60 s entre deux photos : pas de saccade, quelle que soit la machine.
- `node tools/trailer/peek.cjs 4.5 10 …` : une planche d'images fixes (`peek.jpg`) pour
  vérifier le montage ; `/trailer?play` le joue en direct dans le navigateur.
- Le montage (les temps, les textes, les cadrages dans les plans) est dans `Trailer.tsx`,
  la partition dans `music.py` : 120 BPM, un temps = 0,5 s.
