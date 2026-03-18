# Oracle20 - Guide Projet (Produit + Gameplay)

Date: 2026-03-18  
Scope: version solo Isekai actuelle + direction cible validee.

## 1) Le jeu en une phrase
Oracle20 est un RPG top-down pixel art ou le joueur incarne physiquement son personnage dans le monde, cible l environnement, exprime une intention libre, puis le moteur MJ + D20 arbitre les consequences.

## 2) Vision
- Liberte d action: le joueur peut tenter n importe quoi.
- Coherence systeme: le moteur applique les regles du monde.
- Progression emergente: les actions changent vraiment la partie (map, inventaire, combat, quetes, objectif).
- Immersion spatiale: le joueur agit d abord dans la scene, pas dans un chat abstrait.

## 3) Flow joueur actuel
1. Menu (`/`):
- saisie pseudo
- `Jeu solo` actif
- `Creer room` / `Rejoindre room` desactives
2. Setup solo (`/solo`):
- scenario Isekai (seul scenario actif)
- choix sprite personnage
- texte de pouvoir libre
- D20 initial d acceptation du pouvoir
3. Partie (`/game`):
- haut: infos joueur (vies, PV, or, force, stress, objectif)
- centre: map (chunk 16x16 visible)
- droite: narrateur MJ + journal / inventaire
- bas: input action libre + bouton resolution
4. Fin:
- victoire si quetes principales completees
- game over si vies epuisees

## 3.1) Pivot produit valide pour la phase suivante

Le runtime actuel repose encore sur un input texte global.  
La direction validee pour la prochaine phase est differente:

- clavier/souris comme interface primaire,
- deplacement direct dans le monde,
- deplacement orthogonal case par case, jamais en diagonale,
- survol souris = preview exacte du chemin avant clic,
- clic gauche pour se deplacer et selectionner,
- clic droit pour ouvrir une interaction contextuelle sur PNJ, structure, objet ou sol,
- panneau `Narrateur MJ` conserve a droite comme historique et narration persistante,
- bulle locale au dessus du joueur ou de la cible pour rendre l interaction visible dans la scene.

Voir la spec complete: [INTERACTION_REWORK_SPEC.md](/c:/Users/Daiki/Desktop/Rollplay/docs/INTERACTION_REWORK_SPEC.md)

## 4) Regles de base (v1)
### D20
- 1: catastrophe
- 2-5: echec
- 6-10: partiel
- 11-14: succes
- 15-19: gros succes
- 20: legendaire

### Stats de depart actuelles
- 3 vies
- 10 PV
- 10 or
- 1 torche

### Evolution cible des stats
Le socle futur doit conserver:

- PV
- vies
- or
- stress
- rang

Et ajouter comme stats principales:

- force
- vitesse
- volonte
- magie
- aura

Et comme stats secondaires utiles au genre:

- defense
- precision
- esquive
- perception
- discretion
- chance
- initiative
- charisme
- endurance
- resonance

### Mort
- perte d une vie
- perte d une partie de l or
- inventaire vide au respawn
- respawn au camp

## 5) Monde actuel
- taille monde: `48x48` tuiles
- chunk/ecran: `16x16`
- ecrans logiques: `3x3`
- biome central: village
- biomes adjacents: foret, desert, donjon, zone boss

POI v1:
- camp
- guilde
- boutique
- auberge
- porte donjon
- porte boss

## 5.1) Monde cible
Le monde doit devenir `entity-first`.

Cela veut dire:

- un PNJ est une entite,
- un batiment est une entite,
- un arbre est une entite,
- une porte est une entite,
- une case de sol ciblee peut devenir une cible systemique,
- un bord d ecran utilisable peut devenir une entite de transition.

Un batiment important ne doit plus etre seulement un sprite et un label.  
Il doit avoir:

- un `id`
- un footprint
- une entree reelle
- une zone d approche
- une zone d interaction
- des tags / capabilities / states
- des acteurs rattaches si besoin

Un PNJ important doit aussi porter:

- un nom
- un role
- un metier
- une personnalite
- une faction
- une humeur
- un minimum de lore

Le monde cible doit aussi memoriser socialement:

- crimes
- reputation
- hostilite de faction
- alertes de zone
- compagnons recrutes

## 6) Ce qui marche deja bien
- boucle solo complete jouable
- deplacements + collisions de base
- deplacement vers POI (shop/guild/inn/dungeon/boss)
- ciblage maison la plus proche si precisee
- combat de base contre hostiles
- destruction de props destructibles
- drops ressources inventaire
- achats shop simples
- quetes principales scriptes
- fallback IA local sans cle API

## 7) Limites actuelles
- le champ texte global reste l interface principale alors que le jeu est spatial
- pas de vrai registre unifie d entites interactives monde
- buildings encore partiellement modelises comme POI/sprites plutot que structures adressees
- pas encore de clic gauche deplacement / clic droit interaction contextuelle
- collisions et transitions pas encore alignees sur un vrai modele d entite
- shop encore simple (prix fixe, pas de ownership/politiques)
- dialogue/fouille pas stateful
- event log surtout texte (pas replay complet)
- pass visuel map encore incomplet
- promesse "tout est possible" partiellement tenue sur actions complexes
- monde encore trop peu vivant entre les actions joueur
- pas encore de memoire sociale persistante assez forte
- pas encore de systeme de companions / followers

## 8) Principe d architecture cible (important)
- le LLM ne fixe jamais l etat final directement
- il propose un plan
- le moteur valide
- le moteur applique
- le moteur trace

Formule:
`Action contextuelle -> Plan -> Validate -> Policy -> Apply -> Log -> Narration`

## 9) Regle produit non-negociable
Tout element interactif du decor doit etre entity-first:
- adressable
- destructible (si autorise)
- echangeable (si autorise)
- capturable (si autorise)

Consequence immediate:

- une boutique, une guilde, une auberge, une maison, un arbre, un puits, une porte et meme une case de sol ciblee doivent etre modelisables comme cibles d interaction,
- un batiment ne doit plus etre seulement un sprite ou un POI implicite,
- l interaction texte doit toujours etre contextualisee par une cible ou une zone.

## 10) Contrat de generalisation (critique)
But: ne jamais bloquer une action joueur, meme si elle est inedite.

Regle produit:
- aucune action libre ne doit finir en "rien ne se passe" sans explication systeme.
- toute action produit soit:
  - des `appliedOps` concretes, ou
  - des `rejectedOps` explicites + une consequence narrative/systeme tracee.

Flux de generalisation:
1. le joueur selectionne une cible ou une zone.
2. il exprime une intention libre contextualisee.
3. le moteur propose une intention + ops connues.
4. si la couverture est insuffisante, il remplit aussi un `unknownIntent`.
5. le moteur tente de compiler `unknownIntent` vers des `WorldOp` connues.
6. si compilation possible et policy ok: application.
7. sinon: degradation controlee (cout, temps, stress, reputation, log) + rejet explicite.
8. creation d un ticket de typage futur pour enrichir le DSL.

Garantie:
- "tout est possible" = tout est tentable + tout recoit une resolution explicite.
- "tout n est pas gratuit" = policy + ressources + risques gardent la coherence.

## 11) Moteur tags + vulnerabilities (generalisation massive)
Chaque entite doit exposer des metadonnees dynamiques:
- `tags`: nature de l entite (structure, bois, vivant, magique, fragile, etc.)
- `vulnerabilities`: multiplicateurs d effet (feu x2 sur bois, siege x3 sur structure)
- `resistances`: reductions d effet
- `capabilities`: ce que l entite peut faire/subir (trade, destroy, capture, own)
- `states`: etats courants (intact, burning, stunned, broken, owned)

Le moteur lit ces donnees pour appliquer des regles generiques:
- arme `siege_weapon` -> degats massifs sur cible `structure`
- action `fire` -> forte propagation sur `flammable`, faible sur `stone`
- capture -> autorisee seulement si cible `capturable` + policy allow
- commerce -> modulable si cible `merchant` + relation + humeur + historique de repetition

Resultat:
- moins de hardcode au cas par cas
- couverture de centaines de situations nouvelles avec peu de regles

## 12) Ordre d implementation pour atteindre le resultat voulu
1. figer le pivot interactionnel clavier/souris + entites monde + popup contextuel.
2. figer le contrat `WorldOp + Validator + Policy + EventLog`.
3. figer le contrat LLM (`ContextPack`, `ResolutionPlan`, `unknownIntent`) avec cible explicite.
4. implementer le registre entity-first sur map + acteurs + structures + objets + edges.
5. implementer navigation, collisions, transitions et popup d interaction.
6. implementer la boucle authoritaire (plus de mutation directe hors ops).
7. implementer la generalisation `unknownIntent -> compile/degrade/log`.
8. brancher tags, vulnerabilities et capabilities sur ce modele.
9. ajouter anti-repeat et memoire de tentative par cible/contexte.
10. migrer les stats vers `force`, `vitesse`, `volonte`, `magie`.
11. ajouter `aura` + stats secondaires utiles + variables riches sur les entites.
12. implementer IA ennemie reactive + mouvements PNJ credibles + directeur d evenements.
13. implementer crime / reputation / justice / memoire sociale.
14. implementer recrutement PNJ / mercenaires / creatures.
15. passer la checklist QA complete (boot, gameplay, coherence, save/load, perf).
16. seulement ensuite: polish visuel avance.

Definition of done produit:
- un joueur peut se deplacer sans utiliser le champ texte global,
- un clic droit sur un PNJ, un arbre, un batiment ou le sol ouvre une interaction claire,
- chaque action recoit une resolution visible localement et dans le journal,
- la meme action ne peut pas etre exploitee en boucle sur la meme cible,
- le monde reagit avec ennemis, PNJ et evenements de facon credible,
- un crime grave laisse une trace durable dans le monde,
- la reputation heroique ou criminelle modifie les relations,
- le joueur peut recruter des allies quand le contexte et les rolls le permettent,
- la map, l inventaire, les stats et les objectifs evoluent de facon coherente.

## 13) Documents a lire ensuite
- [ENGINE_SPEC.md](/c:/Users/Daiki/Desktop/Rollplay/docs/ENGINE_SPEC.md)
- [INTERACTION_REWORK_SPEC.md](/c:/Users/Daiki/Desktop/Rollplay/docs/INTERACTION_REWORK_SPEC.md)
- [USER_EXPERIENCE.md](/c:/Users/Daiki/Desktop/Rollplay/docs/USER_EXPERIENCE.md)
- [ROADMAP_QA.md](/c:/Users/Daiki/Desktop/Rollplay/docs/ROADMAP_QA.md)
