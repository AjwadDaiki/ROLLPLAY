# User Experience

## Intention

Ce document fixe une direction UX claire pour `Rollplay / Oracle20 Solo Isekai`.

Le but n est pas seulement de rendre le jeu joli. Le vrai objectif est:

- rendre le monde lisible en 3 secondes,
- faire comprendre au joueur ou il est, ou aller et pourquoi,
- rendre chaque action logique et lisible,
- transformer les consequences du jeu en moments memorables,
- donner une sensation de finition, de coherence et de confort.

Le jeu doit etre beau, mais surtout comprehensible, fluide et intuitif.

---

## Diagnostic Actuel

### Ce qui fonctionne deja

- La structure generale est bonne: HUD en haut, map au centre, narration a droite, input en bas.
- Le style visuel a une identite correcte: fantasy pixel-art, ambiance nocturne, tons or/bleu.
- Les panels contextuels boutique/guilde existent deja.
- Les feedbacks de base existent: D20, loot popup, gain/perte d or, ecran victoire/defaite.
- Les PNJ bougent deja de maniere beaucoup plus credible qu avant.

### Ce qui bloque encore l experience

- Le monde n explique pas assez visuellement ce qui est interactif.
- Les POI ne sont pas assez signales dans la map elle-meme.
- Le joueur n a pas assez de feedback spatial: il voit la scene, mais ne lit pas assez facilement son parcours.
- L interface de stats est correcte, mais pas encore assez elegante ni assez hierarchisee.
- Les evenements graves ou rares ne prennent pas assez de place visuelle.
- Les consequences sont parfois trop textuelles et pas assez theatrales.
- Le champ de saisie laisse le joueur libre, mais ne l aide pas assez a comprendre comment "bien jouer" avec le moteur.
- Le journal et l objectif ne transforment pas encore la confusion en direction.

Conclusion: le jeu a deja une base jouable, mais il lui manque une couche UX de clarification, de mise en scene et de guidance.

---

## North Star UX

Le joueur doit ressentir ceci:

1. `Je comprends instantanement ou je suis.`
2. `Je vois clairement ce qui est important autour de moi.`
3. `Quand j ecris une action, je comprends ce que le jeu a interprete.`
4. `Quand quelque chose d important arrive, le jeu me le fait ressentir visuellement.`
5. `Chaque zone a sa logique, sa lisibilite et sa personnalite.`

Le jeu doit etre:

- lisible,
- coherant,
- reactif,
- immersif,
- dramatique quand il le faut,
- calme et clair le reste du temps.

---

## Principes UX Non Negociables

### 1. Priorite a la lisibilite

Le joueur ne doit jamais lutter contre l interface pour comprendre:

- ou est le personnage,
- ce qui est solide ou traversable,
- quel batiment est la boutique, la guilde, l auberge,
- quel PNJ est important,
- quel est le prochain objectif utile.

### 2. Le monde doit parler sans texte

Avant meme de lire le log, le joueur doit pouvoir deviner:

- ceci est une route,
- ceci est la boutique,
- ceci est dangereux,
- ceci est un lieu cle,
- ceci est une consequence majeure.

### 3. Une action doit avoir une lecture en 3 temps

Pour chaque action:

1. intention lisible,
2. execution visible,
3. consequence evidente.

Exemple:

- `je vais a la boutique`
- le personnage marche jusqu a la boutique
- la boutique s ouvre avec un label et un panel propre

Pas de melange flou entre action, resultat et menu.

### 4. Les gros evenements doivent casser le rythme normal

Une mise a prix, une mort importante, une quete completee, un boss revele, une zone debloquee:

- doivent suspendre legerement le flux,
- doivent avoir un traitement plein ecran ou quasi plein ecran,
- doivent etre ressentis comme des jalons.

### 5. L elegance vient de la coherence

Le jeu ne doit pas accumuler des gimmicks.

Il faut une grammaire claire:

- une couleur pour les infos systeme,
- une couleur pour les gains,
- une couleur pour le danger,
- un type d animation pour l interaction,
- un type d animation pour la perte,
- un type d animation pour les evenements majeurs.

---

## Besoins Joueur

## A. Comprendre l espace

Le joueur a besoin de savoir:

- ou il est,
- ou il est passe,
- quels chemins sont naturels,
- quelles zones sont sures,
- quelles zones sont hostiles,
- quels batiments sont utiles.

### Recommandations

- La case du joueur doit rester la reference visuelle absolue.
- Le chemin deja parcouru dans le chunk courant doit devenir `legerement grise`.
- Les routes doivent etre lisibles comme des routes, pas comme un bruit de texture.
- Les POI doivent avoir un label flottant discret:
  - `Boutique`
  - `Guilde`
  - `Auberge`
  - `Maison`
  - `Donjon`
  - `Citadelle`
- Quand le joueur est proche d un POI, le label devient plus visible.
- Les chunks doivent avoir une identite visuelle plus nette:
  - village = structure, chaleur, civilisation
  - foret = densite, vegetation, organicite
  - desert = vide, exposition, ruines, chaleur
  - donjon = pierre, oppression, repetabilite lisible
  - boss = mise en scene, contraste, menace

### Spec UX concrete

- Ajouter une `memoire de pas` sur le chunk courant:
  - 8 a 20 dernieres cases parcourues,
  - desaturation legere,
  - opacity basse,
  - disparition progressive.
- Ajouter des `labels POI` directement sur la map:
  - affichage passif si visible,
  - surbrillance quand le joueur est a 1-2 cases,
  - disparition si trop loin ou masques par un evenement majeur.
- Ajouter un `anneau d interaction` doux autour du joueur quand il est a portee d un lieu interactif.

---

## B. Comprendre les personnages

Le joueur doit identifier d un coup d oeil:

- PNJ important,
- PNJ decoratif,
- animal,
- ennemi normal,
- boss.

### Recommandations

- Les PNJ majeurs doivent avoir un signe visuel stable:
  - icone de role,
  - label court,
  - palette ou silhouette plus reconnaissable.
- Le marchand doit etre lisible comme marchand meme sans texte.
- Le maitre de guilde doit etre lisible comme figure d autorite.
- Les animaux et PNJ mineurs doivent enrichir la scene sans parasiter la lecture.

### Spec UX concrete

- Ajouter un `badge role` discret au dessus des PNJ cle:
  - sac / piece pour le marchand,
  - banniere / blason pour la guilde,
  - lit / tasse pour l auberge.
- Ajouter un `nom flottant` seulement:
  - au hover si souris,
  - ou quand le joueur est proche,
  - ou pendant une interaction.
- Les PNJ fixes ne doivent pas bouger leur orientation tant qu ils n avancent pas reellement.
- Les morts de PNJ ou monstres doivent avoir une animation simple mais propre:
  - flash court,
  - chute / fade,
  - petite dissipation,
  - eventuellement drop au sol.

---

## C. Comprendre l objectif

Le joueur doit pouvoir repondre a tout moment a cette question:

`Qu est-ce que je devrais faire maintenant ?`

### Probleme actuel

L objectif global existe, mais il manque une decomposition claire en etapes visibles.

### Recommandations

- Distinguer:
  - objectif principal,
  - objectif immediat,
  - action recommandee.
- L objectif ne doit pas etre seulement un texte statique.
- Il doit servir de boussole.

### Spec UX concrete

- Transformer le bloc `Objectif` en panneau a 3 niveaux:
  - `Grand objectif`: Vaincre le Roi Demon
  - `Etape actuelle`: Rejoindre la guilde / Explorer le donjon / Acheter de quoi survivre
  - `Suggestion`: Va a la guilde, parle au maitre, prends une mission
- Quand l objectif change, afficher une animation de mise a jour plus lisible.
- Ajouter un bouton `Afficher la destination`:
  - surligne le POI cible 2 secondes,
  - ou pulse doucement sur la map.

---

## D. Comprendre le langage d action

Le free text est fort, mais il peut perdre les joueurs.

### Le joueur doit savoir

- quel type de phrase marche bien,
- ce que le jeu a compris,
- pourquoi une action a echoue ou a ete reinterpretee.

### Recommandations

- Ne jamais laisser une interpretation importante implicite.
- Montrer une ligne `Intention comprise`.
- Donner des exemples d actions utiles.

### Spec UX concrete

- Sous l input, afficher des `suggestions contextuelles`:
  - `aller a la boutique`
  - `parler au marchand`
  - `prendre une quete`
  - `aller au donjon`
- Ajouter une ligne au dessus du log:
  - `Intention comprise: se rendre a la boutique`
  - `Intention comprise: acheter Potion de soin`
- En cas d ambiguite:
  - expliquer clairement,
  - proposer 2 ou 3 reformulations.

---

## E. Comprendre les consequences

Un jeu narratif et systemique vit par ses consequences.

Actuellement elles existent, mais elles ne sont pas encore assez hierarchisees.

### Il faut 3 niveaux de consequence

#### 1. Consequence mineure

Exemples:

- gain d or,
- petit loot,
- petit soin,
- stress,
- phrase PNJ.

Traitement:

- popup courte,
- animation locale,
- log.

#### 2. Consequence moyenne

Exemples:

- quete terminee,
- objet rare obtenu,
- monstre vaincu,
- nouveau lieu debloque,
- changement d objectif.

Traitement:

- carte centre ecran,
- freeze tres court du jeu,
- grand texte,
- icone claire,
- son plus tard si audio.

#### 3. Consequence majeure

Exemples:

- tete mise a prix,
- mort d un PNJ important,
- guerre locale,
- mort du joueur,
- revelation du boss,
- passage de rang,
- fin de chapitre.

Traitement:

- overlay dramatique,
- titre grand format,
- sous-titre explicatif,
- couleur dominante selon l evenement,
- bouton de reprise ou confirmation.

### Spec UX concrete

- Ajouter des `Event Cards` pour les evenements majeurs.
- Exemple `Mise a Prix`:
  - grand titre: `TA TETE EST MISE A PRIX`
  - sous-texte: `Le village parle de toi. Des chasseurs te recherchent.`
  - visuel: rouge/or/noir
  - effet secondaire visible sur le HUD ou le journal
- Ajouter des `Death Cards` pour la mort d un ennemi important.
- Ajouter un `Quest Complete Banner`.
- Ajouter un `Rank Up Banner`.

---

## F. HUD et ergonomie generale

## HUD haut

### Problemes

- les stats sont lisibles, mais pas encore assez premium,
- les points de vie peuvent etre plus agreables visuellement,
- l objectif est un peu trop "bloc de texte".

### Recommandations

- Passer d un simple ensemble de badges a un HUD plus hierarchique.
- Mettre plus en valeur:
  - PV,
  - OR,
  - STRESS,
  - RANG.

### Spec UX concrete

- PV:
  - garder les coeurs, mais les rendre plus propres et plus vivants,
  - ajouter une jauge fine ou une capsule numerique lisible,
  - animation de perte/gain plus douce.
- OR:
  - badge plus lumineux,
  - mini rebond quand le nombre change.
- STRESS:
  - couleur neutre a faible stress,
  - glisse vers orange puis rouge.
- RANG:
  - capsule plus noble,
  - effet de promotion lors du passage B/A/S.

## Colonne Narrateur

### Recommandations

- Mieux differencier:
  - phrase MJ,
  - narration,
  - log systeme,
  - dialogue PNJ.

### Spec UX concrete

- `StoryLine` = ligne forte, grande, presque comme un titre d action.
- `Narration` = bloc propre, respiration plus grande.
- `Journal` = typographie plus petite, mais meilleure separation des entrees.
- Ajouter categories visuelles:
  - SYSTEM
  - MJ
  - PNJ
  - EVENT
  - COMBAT

## Input

### Recommandations

- Donner au joueur des rails sans casser la liberte.

### Spec UX concrete

- placeholder plus intelligent,
- suggestions d actions cliquables,
- dernieres actions rapides,
- touche `Entree` bien mise en valeur,
- bouton principal plus vivant au hover et au press.

---

## G. Map et feedback spatial

C est un chantier central.

### Besoins

- terrain plus clair,
- routes plus lisibles,
- POI plus explicites,
- parcours plus visible,
- interactions plus localisees.

### Demandes concretes a integrer

- la ou le joueur passe, cela devient `legerement grise`,
- la boutique doit afficher `Boutique` au dessus,
- la guilde doit afficher `Guilde`,
- les lieux utiles doivent etre reconnaissables avant interaction.

### Spec UX concrete

- `Breadcrumb Trail`:
  - couleur gris chaud / desaturation,
  - intensite faible,
  - fade progressif,
  - reset au changement de chunk.
- `POI Header Labels`:
  - petits cartouches pixel-art,
  - apparition douce,
  - plus nets a proximite.
- `Reach Highlight`:
  - quand un lieu est utilisable, un contour ou halo discret apparait.
- `Tile Readability`:
  - routes = plus continues et moins bruitees,
  - zones dangereuses = plus contrastees,
  - zones sures = plus propres,
  - zone boss = traitement exceptionnel.

---

## H. Animation et sensation de finition

### Probleme actuel

Le jeu bouge, mais il manque encore une vraie hierarchie motion.

### Il faut une motion language

#### Mouvement normal

- souple,
- lisible,
- cadence constante.

#### Interaction

- petit accent visuel,
- pas trop long,
- pas trop agressif.

#### Combat

- plus nerveux,
- plus contraste,
- impacts plus visibles.

#### Mort

- disparition propre,
- feedback de victoire.

#### Grand evenement

- ralentissement relatif,
- apparition ceremonielle,
- texte large.

### Spec UX concrete

- Mort PNJ/monstre:
  - flash,
  - petite secousse,
  - fade,
  - eventuel drop avec bounce.
- Recompense:
  - popup plus lisible,
  - trajectoire plus propre,
  - moins "technique", plus "celebration".
- Evenement majeur:
  - modal avec grand titre,
  - animation d entree plus lente,
  - fond assombri.
- Transition de chunk:
  - garder le slide,
  - mais mieux marquer l entree dans une nouvelle ambiance.

---

## I. Beaute visuelle

Le jeu ne doit pas etre seulement fonctionnel.
Il doit etre desirables a regarder.

### Direction

- pixel-art propre,
- UI noble et lisible,
- ambiance fantasy d aventure,
- or chaud + bleu nuit + couleurs de biome bien separees.

### Recommandations

- Plus d espace negatif dans les panneaux.
- Plus de contraste entre infos importantes et secondaires.
- Coins, bordures et ombres plus coherents.
- Typographie:
  - garder une police simple si besoin,
  - mais mieux gerer tailles, poids, espacements.

### Regle

Chaque bloc UI doit avoir:

- un role clair,
- une hierarchie claire,
- une respiration claire.

---

## J. Menus a ajouter ou renforcer

### 1. Menu Evenement Majeur

Pour:

- mise a prix,
- rang augmente,
- quete completee,
- boss revele,
- grande consequence narrative.

### 2. Menu Resume de Tour

Optionnel mais utile:

- ce que tu as fait,
- ce que tu as gagne/perdu,
- ce qui a change.

### 3. Menu d aide rapide

Tres utile pour onboarding:

- comment ecrire des actions,
- que veut dire le D20,
- que fait le stress,
- comment progresser.

---

## K. Accessibilite et confort

Meme pour un jeu stylise, il faut du confort.

### A prevoir

- textes assez contrastes,
- boutons assez grands,
- mobile lisible,
- focus visible clavier,
- animations reductibles plus tard,
- information jamais transmise uniquement par la couleur.

---

## Priorites Produit

## P0 - comprehension immediate

- labels `Boutique`, `Guilde`, `Auberge`, `Donjon`, `Citadelle` sur la map
- chemin parcouru legerement grise
- objectif en 3 niveaux
- meilleure lisibilite des routes et POI
- distinction visuelle claire PNJ majeurs / PNJ mineurs / ennemis
- interpretation d action plus explicite

## P1 - confort et elegance

- HUD sante/or/stress/rang plus premium
- animation de gain/perte plus propre
- meilleure hierarchie dans la colonne Narrateur
- suggestions d actions contextuelles
- labels et halos d interaction

## P2 - moments memorables

- modals d evenement majeur
- animation de mort plus aboutie
- mise a prix grand format
- rank up / quest complete / world event en cartes dediees

---

## Proposition de Roadmap Implementation

## Phase 1 - lisibilite spatiale

- tracer des breadcrumbs sur le chunk courant
- ajouter labels POI en surimpression
- revoir la lecture routes / sols / POI
- surligner les lieux interactifs a portee

## Phase 2 - HUD et narration

- refaire la carte stats
- rendre la sante plus agreable visuellement
- hierarchiser davantage objectif / action / narration / log
- ajouter suggestions de commandes

## Phase 3 - feedback et consequences

- systeme de banners et modals evenementiels
- animation de mort
- animation de quete completee / rang augmente
- ecran `mise a prix`

## Phase 4 - finition

- harmoniser motion, spacing, couleurs et rythmes
- ajouter sons plus tard si voulu
- polir mobile et petits ecrans

---

## Definition of Done UX

Une passe UX est reussie si:

- un nouveau joueur comprend en moins de 30 secondes ou aller,
- il identifie la boutique et la guilde sans lire tout le journal,
- il comprend pourquoi une action produit son resultat,
- les gros evenements sont impossibles a rater,
- la map devient lisible et memoire du parcours,
- l interface donne une sensation de jeu fini, pas juste de prototype.

---

## Decision Produit

Si un arbitrage est necessaire, on priorise dans cet ordre:

1. comprehension,
2. lisibilite spatiale,
3. feedback consequence,
4. elegance visuelle,
5. sophistication.

Un jeu simple mais tres lisible vaut mieux qu un jeu riche mais confus.
