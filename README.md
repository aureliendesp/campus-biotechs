# Campus Biotechs Occitanie

Visite libre et immersive du campus, reprise de la **V27** : trois parvis, 13 univers, 33 lieux et 84 fiches de découverte. Les textes et les 45 images de la livraison V27 sont conservés. Les lieux illustrés sont fictifs.

## Publication sur GitHub Pages

1. Créer un dépôt dédié, par exemple `campus-biotechs`, et y envoyer le contenu de ce dossier sur la branche `main`.
2. Dans **Settings → Pages → Build and deployment → Source**, sélectionner **GitHub Actions**.
3. Dans **Actions**, lancer « Publier le campus sur GitHub Pages » si le premier lancement a eu lieu avant l’activation de Pages.
4. L’adresse du campus apparaît dans **Settings → Pages**, puis dans le résultat du déploiement.

Avec GitHub Free, utiliser un dépôt public pour GitHub Pages. Un dépôt privé nécessite une offre compatible. Le site lui-même est destiné à une visite publique.

Le workflow vérifie les contenus, prépare `dist/`, puis publie automatiquement chaque modification de `main`. Les demandes de fusion exécutent uniquement la vérification et la préparation.

La visite utilise des chemins relatifs : elle fonctionne sous le sous-chemin d’un dépôt GitHub Pages ou avec un domaine personnalisé. Elle ne dépend d’aucun service Netlify, d’aucune clé et d’aucun serveur applicatif.

## Modifier le campus

| Fichier | Rôle |
| --- | --- |
| `contenus.json` | Source unique des univers, lieux, fiches, définitions et positions des points « + » |
| `assets/images.json` | Correspondance entre les identifiants de visuels et les fichiers |
| `assets/campus.js` | Navigation, parvis, lieux, fiches et plein écran |
| `assets/campus.css` | Présentation et adaptation aux écrans |
| `index.html` | Structure de la visite |
| `images/` | Visuels originaux de la V27, sans modification |

Les positions des bâtiments sur les trois parvis sont définies dans `homePositions`, dans `assets/campus.js`.

## Vérifier localement

Node.js 20 ou ultérieur suffit ; aucune dépendance à installer.

```sh
npm run check
npm run build
python3 -m http.server 8000 --directory dist
```

Ouvrir ensuite `http://localhost:8000`. Utiliser un serveur HTTP plutôt qu’un double-clic sur `index.html`, car les contenus JSON sont chargés au démarrage.

## Reprise de la V27

- Contenus identiques à `contenus_V27.json` et à l’archive `Campus_Biotechs_Occitanie_V27_Nouveaux_Visuels.zip`.
- Conservation des trois parvis, des 13 univers, de leurs lieux, des fiches et des visuels.
- Séparation des contenus, styles et scripts ; suppression du doublon de données intégré au HTML.
- Correction de l’ancien titre V21 et des compteurs de lieux Recherche/Industrie, auparavant figés à quatre espaces.
- Navigation immédiate lors de clics rapprochés ; retour du focus après fermeture d’une fiche.

Cette migration ne constitue pas une nouvelle validation scientifique ou éditoriale des fiches de la V27.
