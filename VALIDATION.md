# Vérifications de la migration V27

Vérifications réalisées le 19 novembre 2026.

- Les deux archives V27 retrouvées ont des fichiers applicatifs communs identiques.
- `contenus.json` est identique, octet par octet, au fichier V27 livré ; les données intégrées au HTML d’origine contenaient les mêmes informations.
- Les 45 images d’origine sont conservées sans modification, avec comparaison des empreintes SHA-256.
- Inventaire contrôlé : trois parvis, 13 univers, 33 lieux et 84 fiches.
- Vérification syntaxique JavaScript et contrôle des JSON, définitions, coordonnées, chemins et fichiers d’images : réussis.
- Préparation du dossier statique `dist/` : réussie.
- Dans le navigateur, les 13 univers et les 33 lieux ont été ouverts. Une fiche a été ouverte et refermée dans chaque lieu possédant des fiches ; son texte a été vérifié comme présent.
- Les trois parvis, les deux nouveaux pavillons Bioéconomie et Europe, et le retour au campus ont été parcourus.
- Contrôle complémentaire dans une fenêtre intégrée de 390 × 844 pixels, sous le sous-chemin `/_subpath/campus-biotechs/` : chargement du campus, navigation entre les parvis et ouverture d’une fiche Europe réussis.

La simulation mobile sur ordinateur ne remplace pas un essai sur un téléphone réel. Les contenus scientifiques de la V27 sont conservés ; cette migration n’est pas un nouvel audit de leurs sources.

Le workflow GitHub Pages est préparé. Son exécution et l’adresse publique restent à vérifier après création du dépôt et activation de Pages.
