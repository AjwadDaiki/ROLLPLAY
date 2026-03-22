# Compréhension Projet - Rollplay

## 1. Idée du jeu
Rollplay est un JRPG sandbox ISEKAI:
- le joueur peut tenter des actions variées (combat, social, manipulation, exploration),
- le monde réagit avec des conséquences visibles,
- les conséquences persistent et modifient la suite de la run.

Objectif produit:
- liberté forte,
- lisibilité claire,
- impact réel des choix.

## 2. Boucle joueur
Boucle courte:
1. Se déplacer vers une cible.
2. Agir (action rapide ou texte libre).
3. Résolution (contexte + stats + roll).
4. Voir le résultat (map, UI, narration, relations, ressources).

Boucle longue:
- les actions changent zones, factions, prix, accès, et comportement PNJ.

## 3. Piliers du gameplay
- **Combat lisible**: entrée/sortie claires, conséquences compréhensibles.
- **Interaction libre**: texte joueur interprété, pas limité à des menus fixes.
- **Monde vivant**: PNJ, événements, mémoire locale.
- **Conséquences persistantes**: ce qui est fait n’est pas oublié.

## 4. Architecture fonctionnelle (vue simple)
- Entrée joueur -> interprétation intention -> validation -> résolution -> delta monde -> rendu -> sauvegarde.
- Une action ne doit jamais être ignorée:
  - succès,
  - succès partiel,
  - échec utile,
  - refus explicite.

## 5. Ce qui est déjà en place
- Base gameplay solo.
- Systèmes d’actions et de conséquences.
- Outils map editor en cours.
- Documentation vision + plan d’implémentation.

## 6. Ce qui est prioritaire
1. Stabiliser le pipeline unique d’action.
2. Renforcer la lisibilité UI des causes/effets.
3. Consolider map/PNJ/combat pour une boucle fun et propre.
4. Brancher l’émergence sans casser la cohérence.

## 7. Règle de qualité
Avant de valider une feature:
- Est-ce que le joueur comprend ce qui s’est passé ?
- Est-ce que le résultat est visible dans le monde ?
- Est-ce que cette action change réellement la suite ?

Si non, la feature n’est pas prête.
