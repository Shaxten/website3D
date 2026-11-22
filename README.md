# A70 Vision White · Visite interactive

Site de démonstration en Vue 3 et Vite pour le boîtier Thermalright A70 Vision White.
Le build produit un site statique, hébergeable sur GitHub Pages.

## Commandes

```powershell
npm install        # installer les dépendances
npm run dev        # serveur de développement (http://localhost:5173)
npm run build      # génère le dossier dist/
npm run preview    # prévisualise le build
npm run assets     # régénère public/media à partir du dossier Content/
```

## Structure

| Chemin | Rôle |
|---|---|
| `Content/` | Médias d'origine (non modifiés) |
| `scripts/optimize-assets.mjs` | Convertit les images en WebP, compresse la vidéo, extrait 230 images pour le tour 360° |
| `scripts/make-parts.mjs` | Détoure les composants (écran, ventilateurs, refroidisseur, carte graphique) pour la vue éclatée (`npm run parts`) |
| `public/media/` | Médias optimisés utilisés par le site (générés, à versionner) |
| `src/components/` | Une section par composant : Hero, Tour, Exploded, Hotspot, Screens, Angles, Video, Specs |
| `.github/workflows/deploy.yml` | Déploiement automatique sur GitHub Pages |

## Mettre le site en ligne

1. Créer un dépôt sur GitHub (par exemple `a70-vision`).
2. Dans le dossier du projet :
   ```powershell
   git init -b main
   git add .
   git commit -m "Premier commit"
   git remote add origin https://github.com/<utilisateur>/<depot>.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch**,
   branche **`gh-pages`**, dossier **`/ (root)`**. Ne pas servir `main` directement : c'est le code
   source non compilé, la page resterait blanche.
4. Chaque push sur `main` compile le site et met à jour la branche `gh-pages`. Le site est ensuite à
   `https://<utilisateur>.github.io/<depot>/`.

Les chemins sont relatifs (`base: './'`), donc le nom du dépôt n'a pas besoin d'être configuré.

## Remplacer par un vrai modèle 3D plus tard

La section « Visite 360° » est calée sur la vidéo. Si un fichier `.glb` du boîtier devient disponible,
on peut la remplacer par une scène Three.js interactive sans toucher au reste du site.

## Sources

Caractéristiques : [fiche officielle Thermalright](https://www.thermalright.com/product/a70-vision-white/).
Images et vidéo : Thermalright. Ce site n'est pas affilié à la marque.

