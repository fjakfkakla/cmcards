# cm cards

## Git : toujours pousser sur `main`

- Chaque travail terminé est commité puis **poussé sur `main`** (`git push origin HEAD:main`), sans attendre qu'on le demande.
- Si la session impose une autre branche, pousser aussi sur cette branche, mais `main` d'abord : c'est `main` qui est déployé.
- Avant de pousser : `git fetch origin main` et fusionner `origin/main` (jamais de force-push sur `main`), puis vérifier `npx next build`.

@AGENTS.md
