# Echo — Audiovisualizer

Echo est un instrument de peinture audiovisuelle mobile : choisissez une brosse emoji et peignez directement des flux de particules qui restent vivants et réagissent à la musique.

## Fonctionnalités

- huit brosses de flux distinctes : liquide, feu, croissance, vortex, brume, constellation, halo et membrane ;
- peinture WebGL pilotée par shader, filaments, particules structurelles et profondeur lumineuse ;
- gestes échantillonnés et persistants, avec vitesse et matière propres à chaque brosse ;
- plusieurs matières peuvent cohabiter dans une même composition ;
- analyse audio normalisée avec attack/release par graves, médiums, aigus, énergie et transitoires ;
- animation autonome même sans musique, avec annulation et effacement ;
- réglages expressifs de taille et d’opacité mémorisés dans chaque geste ;
- mode contemplation plein écran avec panorama shader, gyroscope mobile et glisser de secours ;
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
