# Core Baseline

Date: 2026-03-16  
But: figer la liste des taches de base a rendre solides avant de repartir sur des systemes plus avances.

## Regle de pilotage

Tant que ce socle n est pas stable:

- on evite les mecaniques complexes,
- on evite les features scenario trop ambitieuses,
- on evite d ajouter des couches systemiques qui compliquent la lecture du jeu.

Priorite absolue:

1. le joueur comprend,
2. le joueur peut agir,
3. le jeu reagit clairement,
4. la map est lisible,
5. les boucles de base sont fiables.

---

## 1. Fondamentaux non negociables

Ce sont les bases minimales d un jeu solo presentable.

### A. Lecture immediate de la map

Le joueur doit comprendre en quelques secondes:

- ou il est,
- ou aller,
- quels lieux sont importants,
- ce qui est praticable ou bloque,
- quelle zone est sure ou dangereuse.

Taches:

- routes lisibles
- sols coherents par biome
- POI visibles directement sur la map
- labels `Boutique`, `Guilde`, `Auberge`, `Donjon`, `Citadelle`
- maisons correctement orientees et placees
- decor non absurde
- chunks coherents entre eux
- trace du chemin joueur legere et lisible

Definition of done:

- un nouveau joueur identifie boutique et guilde sans lire le log
- aucun chunk ne parait casse ou melange au hasard
- les collisions visibles correspondent a la logique reelle

### B. Deplacement propre

Le deplacement est une base absolue.

Taches:

- mouvement clavier remappable fiable
- clic gauche deplacement fiable
- clic droit interaction contextuelle fiable
- deplacement strictement orthogonal
- preview de chemin avant clic fiable
- mouvement case par case fiable
- mouvement vers POI fiable
- transitions de chunks propres
- pas de blocage invisible
- pas de teleports absurdes
- personnage visuellement fluide
- orientation du joueur logique

Definition of done:

- le joueur peut se deplacer sans utiliser le champ texte global
- clic gauche sur une case marchable = chemin lisible et fiable
- clic droit sur une cible = ouverture d interaction claire
- aucun chemin previsualise ne differe du trajet reel
- `je vais a la boutique` marche toujours
- `je vais a la guilde` marche toujours
- `je vais au donjon` marche toujours
- aucun trajet simple ne bloque sans raison

### C. PNJ propres et lisibles

Les PNJ doivent enrichir la scene, pas la casser.

Taches:

- PNJ cle bien places
- PNJ mineurs utiles visuellement
- pas de rotation bizarre
- deplacements limits et credibles
- bouton `Infos` utile sur PNJ importants
- marchand lisible comme marchand
- maitre de guilde lisible comme maitre de guilde
- bulles/dialogues propres
- noms/roles visibles a proximite

Definition of done:

- aucun PNJ important ne parait perdu ou mal positionne
- aucun PNJ ne bouge d une facon ridicule
- le joueur sait qui est utile sans tester tout le monde

### D. Interface de comprehension

L interface doit aider au lieu de demander un effort.

Taches:

- HUD plus lisible
- PV / vies / stress / or / rang bien hierarchises
- force / vitesse / volonte / magie integrables proprement
- aura et stats secondaires integrables sans surcharge
- objectif principal + etape actuelle + suggestion
- `intention comprise` visible
- journal mieux lisible
- inventaire propre
- boutons utiles visibles
- popup d interaction contextuel
- bulles locales action/reponse
- input contextuel avec suggestions

Definition of done:

- le joueur sait quoi faire ensuite
- le joueur comprend ce que le jeu a interprete
- le joueur n a pas besoin de deviner l etat du personnage
- le monde est bien l interface principale, pas un chat abstrait

### E. Boucles gameplay minimales

Les boucles de base doivent marcher sans ambiguite.

Taches:

- boutique
- guilde
- quete simple
- combat simple
- loot
- mort / respawn
- save / load
- restart run

Definition of done:

- chaque boucle marche de bout en bout
- chaque boucle donne un feedback lisible
- chaque boucle est testable

---

## 2. Liste des taches de base a verrouiller

## P0 - Base jouable propre

Ce bloc doit etre termine avant tout elargissement.

### Map

- reprendre le chunk village jusqu a coherence totale
- reprendre foret, desert, donjon, boss chunk par chunk
- nettoyer tous les mauvais placements decor/sol/props
- harmoniser routes et intersections
- verifier reachability de tous les POI

### Navigation

- mettre en place le schema `ZQSD` par defaut + remap
- ajouter clic gauche deplacement et focus
- ajouter clic droit interaction contextuelle
- verifier tous les deplacements cibles
- verifier les bords et traverses de chunk
- verifier les collisions de decors
- verifier les chemins longs vers donjon et boss

### PNJ

- stabiliser tous les PNJ importants
- fixer leur position/metier/role
- nettoyer les PNJ decoratifs inutiles si necessaire
- ajouter labels de role discrets

### UI

- fiabiliser HUD
- fiabiliser objectif
- fiabiliser journal / narration / log
- fiabiliser overlays
- clarifier l input et les suggestions

### Gameplay

- shop fiable
- guilde fiable
- quetes fiables
- combat de base fiable
- IA ennemie reactive fiable
- evenements monde dynamiques fiables
- crime / reputation / hostilite persistante fiables
- recrutement companions fiable
- mort / respawn fiable
- save/load fiable

### QA

- tout bug systemique important doit etre dans `qa:solo`
- todo map / ui avec checklist manuelle
- checklist IA ennemi / evenements / popup infos
- zero bug critique connu sur la boucle de base

---

## 3. Ordre recommande des travaux

## Etape 1 - Map centrale

Objectif:

- rendre le village impeccable

Taches:

- routes
- sols
- maisons
- boutique
- guilde
- auberge
- puits / place centrale
- placement PNJ
- lisibilite POI

Pourquoi en premier:

- c est la premiere image du jeu
- c est la zone la plus vue
- c est la base des interactions shop/guilde

## Etape 2 - Boucle de deplacement et d interaction

Objectif:

- garantir que le joueur peut aller la ou il veut et interagir avec le monde sans friction absurde

Taches:

- focus cible
- POI targetting
- trajectoires
- interaction proximity
- popup contextuel
- bulle locale
- narration synchronisee avec le panneau de droite
- overlays contextuels
- suggestions d action

## Etape 3 - HUD + Journal + comprehension

Objectif:

- rendre le jeu intuitif meme sans connaitre le code

Taches:

- objectif en 3 niveaux
- intention comprise
- log lisible
- feedback visuel gains/pertes
- messages d erreur clairs

## Etape 4 - Boucles de base

Objectif:

- rendre la progression simple et satisfaisante

Taches:

- shop
- guilde
- quete
- combat
- mort
- respawn
- save/load

## Etape 5 - Polish de consequence

Objectif:

- faire ressentir les moments importants

Taches:

- mort ennemie
- quete completee
- rank up
- evenement majeur
- entree donjon
- entree boss

---

## 4. Ce qu on ne doit pas attaquer tout de suite

Tant que le socle n est pas verrouille, on repousse:

- economie complexe
- politics/factions lourdes
- construction du monde libre
- ownership avance
- magie libre tres ouverte
- transformations massives de map
- meta systems lourds
- simulation complexe

Ce n est pas interdit plus tard.
Ce n est juste pas la priorite maintenant.

---

## 5. Definition of Done du socle

Le socle de base est considere solide si:

1. la map n est plus confuse
2. les POI sont evidents
3. les deplacements vers POI fonctionnent sans surprise
4. les PNJ importants sont propres
5. le HUD explique bien l etat du joueur
6. l objectif dit quoi faire
7. shop/guilde/combat/respawn/save-load sont stables
8. `npx tsc --noEmit` passe
9. `npm run lint` passe
10. `npm run qa:solo` passe
11. les checks manuels map/UI ne montrent pas de bug critique

---

## 6. Backlog concret a faire maintenant

### Bloc 1 - Map village

- corriger tous les tiles encore incoherents du village
- verifier chaque maison
- verifier chaque route
- verifier chaque decor bloquant
- verifier boutique / guilde / auberge
- verifier labels et halos

### Bloc 2 - Map monde

- foret lisible
- desert lisible
- donjon lisible
- boss lisible
- transitions entre zones propres

### Bloc 3 - PNJ

- review de tous les PNJ importants
- role clair
- position claire
- mouvement clair
- interaction claire

### Bloc 4 - UX de base

- HUD plus lisible encore si necessaire
- log plus clair encore si necessaire
- suggestions plus pertinentes
- overlays plus propres
- messages d erreur plus intelligents

### Bloc 5 - Boucles gameplay

- test complet boutique
- test complet guilde
- test complet quetes
- test complet combat
- test complet respawn
- test complet save/load

---

## 7. Strategie de progression

On travaille comme ca:

1. choisir un bloc de base
2. fixer les bugs
3. ajouter ou mettre a jour les tests
4. valider techniquement
5. valider en jeu
6. seulement ensuite passer au bloc suivant

Regle:

`pas de nouvel elargissement tant que le bloc courant n est pas propre`

---

## 8. Priorite immediate recommandee

Si on doit choisir le prochain chantier tout de suite:

1. map village
2. transitions / reachability / collisions
3. PNJ importants
4. shop + guilde + quete
5. combat / mort / respawn
6. save/load

---

## 9. Suite apres socle

Une fois le socle valide, on peut elargir proprement vers:

- economie plus riche
- reputation
- relations PNJ
- consequences majeures
- factions
- monde plus reactif
- systems scenario plus avances

Mais pas avant.
