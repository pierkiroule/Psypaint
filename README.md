# PsyPaint

PsyPaint est un atelier de peinture générative qui associe le geste, la matière et le son. Cette version refactorise le prototype historique `psypaint360.html` en une application React moderne propulsée par Vite.

## Fonctionnalités

- cinq outils de dessin texturés : aquarelle, encre sensible à la pression, crayon graphite et deux tampons ;
- quatre palettes avec texture de papier dynamique ;
- choix libre de la couleur, de l’épaisseur et de l’opacité ;
- import d’un morceau audio pour animer les brosses en temps réel, sans générateur sonore ;
- annulation, remise à zéro et export PNG ;
- rendu cohérent des outils dans la toile 2D et la vue 3D à 360°, avec un manche virtuel, accélération, inertie et virages amortis ;
- mode immersif, contrôles clavier et interface responsive.

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
