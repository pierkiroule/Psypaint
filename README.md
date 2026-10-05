# Echo — Audiovisualizer

Echo est un audiovisualizer mobile : choisissez un archétype emoji, touchez la scène et faites émerger une présence tridimensionnelle qui vit seule puis réagit à la musique.

## Fonctionnalités

- trois archétypes pilotes profondément distincts : champ liquide, organisme filamentaire et champ orbital ;
- scène WebGL pilotée par shaders, FBM, domain warping, filaments et profondeur lumineuse ;
- toucher traité comme un champ de force avec comportements tap, drag et maintien ;
- transitions fondues de 1,6 seconde entre les matières, sans coupure de scène ;
- analyse audio normalisée avec attack/release par graves, médiums, aigus, énergie et transitoires ;
- animation autonome même sans musique ;
- rendu responsive avec densité de pixels plafonnée pour les mobiles.

## Développement

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run preview
```
