# Plan Directeur — Refonte Globale JRPG Sandbox IA

## 1. Rappel clair de l’objectif du jeu
Créer un JRPG sandbox narratif où le joueur peut tenter des actions variées (physiques, sociales, créatives, absurdes), et où le monde répond de manière:
- cohérente (règles stables),
- visible (feedback clair à l’écran),
- persistante (conséquences qui restent),
- significative (les choix changent réellement la partie).

Formule cible: **Liberté forte + Jouabilité + Lisibilité + Impact réel**.

---

## 2. Analyse critique de l’état actuel
Le projet a une ambition rare et forte, mais l’expérience perçue reste inégale.

### Diagnostic principal
- Le système propose beaucoup d’actions, mais l’impact réel n’est pas toujours clair.
- Plusieurs boucles se superposent (texte libre, interactions contextuelles, combat, map) sans hiérarchie UX constante.
- La lisibilité de ce qui se passe “mécaniquement” est insuffisante pour soutenir la promesse “tout est possible”.

### Analyse de références RPG/JRPG (classiques et indés)
Principes observés dans les jeux qui fonctionnent:

| Référence | Pourquoi c’est fort | Principe réutilisable |
|---|---|---|
| Pokémon (loop classique) | Lisibilité parfaite des tours, états et conséquences | UI combat ultra claire, règles explicites, feedback immédiat |
| Chrono Trigger / FF6 | Rythme maîtrisé, lieux mémorables, progression motivante | Alternance tension/respiration, zones avec identité visuelle forte |
| EarthBound / Golden Sun | Monde lisible, interactions simples mais marquantes | Chaque zone a un langage visuel et des interactions signatures |
| Baldur’s Gate 3 | Liberté d’action + règles fortes + conséquences sociales | Sandbox cadré par systèmes, pas par scripts fragiles |
| Disco Elysium | Poids des mots et des choix | Dialogue = gameplay, pas juste texte décoratif |
| Undertale | Conséquences visibles long terme | Le jeu se souvient et le montre au joueur |
| Chained Echoes / Sea of Stars | Qualité perçue via polish UX | Clarté UI, animation lisible, pacing propre |

Conclusion de benchmark: les jeux marquants combinent **systèmes solides + feedback clair + direction artistique lisible + conséquences mémorables**.

---

## 3. Ce qui fonctionne déjà
- Vision produit différenciante: sandbox JRPG piloté IA.
- Base système avancée: actions variées, réputation, incidents, économie, événements.
- Direction “entity-first” engagée: meilleure base pour généraliser.
- Outils en cours (audit map, rapports, fuzz) utiles pour industrialiser.
- Volonté forte d’itération rapide avec validation visuelle.

---

## 4. Ce qui ne fonctionne pas
- **Lisibilité insuffisante**: le joueur ne comprend pas toujours pourquoi un résultat arrive.
- **Cohérence map inégale**: placements assets/portes/props parfois incohérents.
- **Combat perçu flou**: entrée/sortie et résolution pas toujours compréhensibles.
- **Feedback d’impact incomplet**: certaines actions semblent “réussir” sans effet perçu.
- **Surcharge cognitive UI**: trop d’infos simultanées, priorités visuelles faibles.

---

## 5. Ce qui est sous-exploité
- Pouvoir initial et stats comme véritables modificateurs globaux.
- Routines PNJ et identité sociale locale des zones.
- Variantes visuelles du monde après actions (destruction, traces, tensions).
- Système de conséquences long terme (mémoire locale, sanctions, réputation contextuelle).
- Mise en scène des moments forts (combat, décision critique, événement monde).

---

## 6. Grands axes d’amélioration
- **Axe A — Clarté immédiate**: chaque action explique “quoi, pourquoi, conséquence”.
- **Axe B — Monde crédible**: map cohérente, zones vivantes, PNJ contextualisés.
- **Axe C — Combat lisible et profond**: interface dédiée, tours clairs, actions libres utiles.
- **Axe D — Conséquences visibles**: court terme + long terme, affichées proprement.
- **Axe E — Liberté cadrée**: beaucoup d’options, mais règles compréhensibles.

---

## 7. Vision du jeu final
Un jeu où:
- le joueur agit librement,
- le monde réagit de façon logique,
- les choix changent l’histoire locale et systémique,
- les conséquences se voient sur la map, les PNJ, l’économie, la réputation,
- tout reste lisible et agréable à jouer.

---

## 8. Refonte du gameplay (boucle globale)
Boucle cible:
1. Explorer une zone lisible (objectif + opportunités visibles).
2. Interagir (dialogue, action contextuelle, action libre).
3. Résoudre (roll + stats + contexte + règles).
4. Appliquer les conséquences (monde/social/combat/économie).
5. Afficher clairement l’impact (immédiat + persistant).
6. Ouvrir de nouvelles options (ou fermer certaines).

Règle de qualité:
- pas d’action ignorée,
- pas de succès sans effet tangible,
- pas de conséquence sans feedback.

---

## 9. Refonte du combat
### Objectif
Combat hybride: **tour par tour lisible** + **action libre utile**.

### Structure cible
- Déclenchement clair (contact hostile + intention).
- Transition visuelle vers écran combat dédié.
- Tour explicite: ordre d’initiative, options, coûts, risques.
- Actions classiques: attaquer, compétence, objet, défense, fuite.
- Action libre: proposition IA contrainte, difficulté explicite, effets réels.

### Résolution claire
- Score = stats + équipement + contexte + roll + état.
- Issues: réussite, réussite partielle, échec utile, échec critique.
- Chaque issue génère des effets visibles: HP, statuts, position, moral, réputation, terrain.

### Fin de combat lisible
- Résumé combat: dégâts, statuts, gains/pertes, conséquences sociales.
- Persistance: ennemis blessés/morts, relation locale, danger de zone mis à jour.

---

## 10. Refonte des déplacements
Objectif: sensation “propre, stable, précise”.

### Principes
- Vitesse uniforme par case (maintien de touche sans accélération abusive).
- Aucun déplacement diagonal involontaire.
- Animation synchronisée au déplacement réel.
- Collision et pathing fiables (pas de téléportation parasite).

### UX mouvement
- Preview de trajectoire avant clic.
- Règles de blocage explicites (“obstacle”, “distance”, “zone interdite”).
- Priorité input cohérente clavier/souris.

### Rendu
- Transition idle/marche/arrêt propre.
- Orientation stable (pas de rotation “toupie”).
- Lisibilité du personnage prioritaire (contraste, halo discret, z-order correct).

---

## 11. Refonte de la map
### Problème actuel
Map perçue comme incohérente, répétitive et parfois aléatoire.

### Méthode obligatoire de level design
1. Définir macro-zones et leur fonction gameplay.
2. Définir flux de circulation (routes primaires/secondaires).
3. Définir points focaux (POI, landmarks, scènes de vie).
4. Appliquer grammaire visuelle par biome.
5. Placer PNJ par rôle et routine.
6. Valider automatiquement (collisions, overlaps, portes, footprints).

### Objectifs de qualité
- Chaque sprite a une raison d’être.
- Zéro bâtiment coupé/absurde.
- Zéro porte incohérente.
- Zones lisibles à 3 secondes de regard.
- Variété maîtrisée sans chaos.

---

## 12. Refonte des PNJ
### PNJ crédibles, pas décoratifs
- Chaque PNJ a: rôle, lieu, routine simple, personnalité, relation au joueur.
- Réactions aux événements: violence, aide, vol, négociation, réputation.
- États émotionnels visibles: calme, méfiant, hostile, reconnaissant.

### Boucle PNJ
- Percevoir -> interpréter -> réagir -> mémoriser.
- Propagation sociale locale (rumeurs, témoins, sanctions, gratitude).

### Priorité immersion
- Zones actives (marché, guilde, poste de garde).
- Zones calmes (résidentiel, périphérie).
- Interactions contextuelles utiles, pas juste du filler.

---

## 13. Refonte de l’interface (UX/UI)
Objectif: tout comprendre sans friction.

### Architecture UI cible
- **Haut**: état joueur synthétique (HP, stress, stats clés, objectif).
- **Centre**: map et acteurs, interactions visuelles.
- **Droite**: narration + conséquences + panneau “Pourquoi?”.
- **Bas**: entrée action libre + actions contextuelles.

### Principes UX
- Hiérarchie visuelle stricte (important > secondaire > décoratif).
- Micro-feedback immédiat après action.
- Historique lisible des causes et effets.
- Icônes et labels homogènes.

### Contrat de lisibilité
Le joueur doit savoir à tout moment:
- ce qu’il peut faire,
- ce qu’il vient de faire,
- ce qui a changé,
- pourquoi cela a changé.

---

## 14. Améliorer la sensation de liberté
### Liberté utile, pas chaos
- Compréhension libre du texte joueur.
- Conversion en intention structurée (verbe/cible/méthode/contexte).
- Alternatives automatiques si action impossible brute.

Exemple:
- “porter l’arbre” -> porter impossible -> traîner possible -> découper possible.

### Règle produit
Ne jamais répondre par vide.
Toujours produire:
- action exécutée,
- ou rejet explicite + alternative + conséquence mineure.

---

## 15. Améliorer l’impact des choix
### Court terme
- HP/stress/stats/inventaire modifiés visiblement.
- Réaction immédiate PNJ/faction/zone.
- Nouvelles opportunités ou blocages instantanés.

### Long terme
- Réputation locale et globale persistante.
- Accès ou refus à certains lieux/services.
- Variation durable des prix et du comportement social.
- Mémoire des crimes/actes héroïques.

### Dialogue à poids réel
- Une phrase peut:
  - améliorer/dégrader relation,
  - déclencher enquête/suspicion,
  - ouvrir un raccourci de quête,
  - créer un conflit futur.

---

## 16. Propositions concrètes pour montrer visuellement les conséquences
- Jauge de réputation par faction et par zone.
- Carte des relations PNJ (hostile/neutre/allié).
- Effets map persistants (traces, dégâts, obstacles, zones sécurisées/dangereuses).
- Signalétique contexte (marchands fermés, milice en alerte, quartier festif).
- Indicateurs d’état acteur (peur, colère, blessure, dette, loyauté).
- Résumé post-action compact: `Action -> Résultat -> Impact`.
- Panneau “Pourquoi?” détaillant la causalité mécanique.

---

## 17. À quoi devrait ressembler le jeu final
Une session idéale:
- Le joueur explore une zone claire et vivante.
- Il prend une décision sociale risquée.
- Le système résout proprement et montre les effets.
- Les PNJ adaptent leur comportement.
- Les prix, accès, quêtes et tensions changent.
- En revenant plus tard, le monde se souvient.

Résultat attendu: impression d’un monde réactif, crédible et mémorable.

---

## 18. Priorités de production
### Priorité P0 (fondations)
- Contrat “zéro action morte / zéro succès vide”.
- Pipeline canonique unique intention -> simulation -> delta -> feedback.
- Stabilisation déplacement et combat lisible.

### Priorité P1 (qualité de jeu)
- Refonte map village + 2 biomes avec grammaire visuelle stricte.
- PNJ routines + réactions sociales de base.
- UI causalité + résumé impacts.

### Priorité P2 (profondeur)
- Économie dynamique crédible.
- Quêtes émergentes robustes.
- Conséquences long terme renforcées (mémoire sociale persistante).

### Priorité P3 (polish)
- Animation, audio feedback, moments forts, pacing narratif avancé.
- Équilibrage global (frustration, récompense, variété).

---

## 19. Erreurs à éviter
- Ajouter des features sans améliorer la lisibilité.
- Empiler du hardcode par cas sans abstraction stable.
- Confondre “texte narratif” et “impact gameplay”.
- Surcharger l’écran d’informations non hiérarchisées.
- Corriger en UI ce qui est cassé en simulation.
- Faire “plus grand” au lieu de faire “plus lisible”.

---

## 20. Recommandations globales (A à Z)
1. Garder une vision produit unique: liberté + clarté + conséquences.
2. Mesurer la qualité par expérience joueur, pas seulement par quantité de features.
3. Prioriser les boucles jouables avant l’extension du contenu.
4. Établir des critères de validation UX obligatoires à chaque release.
5. Faire des passes régulières “plaisir de jeu” et pas seulement “bugfix”.
6. Industrialiser les tests de cohérence (map, actions, persistance, combat).
7. Utiliser l’IA comme moteur de variation contrôlée, jamais comme source de chaos.
8. Maintenir une direction artistique systémique: beau, lisible, cohérent.
9. Créer des conséquences visibles qui racontent une histoire de partie.
10. Travailler en cycles courts: prototype -> test joueur -> correction -> consolidation.

---

## Filtre décisionnel permanent (à appliquer à chaque idée)
Avant d’implémenter une feature, valider:
- Cette idée améliore-t-elle vraiment la liberté perçue ?
- Cette idée améliore-t-elle vraiment la compréhension ?
- Cette idée augmente-t-elle l’impact réel des choix ?
- Cette idée rapproche-t-elle le jeu d’un produit complet, et pas d’une démo ?

Si la réponse n’est pas clairement oui sur au moins 3 points, la feature doit être repensée.

