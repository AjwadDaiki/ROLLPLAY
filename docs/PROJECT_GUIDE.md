# Oracle20 - Guide Projet (Produit + Gameplay)

Date: 2026-03-16  
Scope: version solo Isekai actuelle + direction cible.

## 1) Le jeu en une phrase
Oracle20 est un RPG top-down pixel art ou le joueur ecrit une action libre, le MJ IA arbitre, et le D20 decide les consequences.

## 2) Vision
- Liberté d action: le joueur peut tenter n importe quoi.
- Coherence systeme: le moteur applique les regles du monde.
- Progression emergente: les actions changent vraiment la partie (map, inventaire, combat, quetes, objectif).

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

## 4) Regles de base (v1)
### D20
- 1: catastrophe
- 2-5: echec
- 6-10: partiel
- 11-14: succes
- 15-19: gros succes
- 20: legendaire

### Stats de depart
- 3 vies
- 10 PV
- 10 or
- 1 torche

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

## 6) Ce qui marche deja bien
- boucle solo complete jouable
- deplacements + collisions
- deplacement vers POI (shop/guild/inn/dungeon/boss)
- ciblage maison la plus proche si precisee
- combat de base contre hostiles
- destruction de props destructibles
- drops ressources inventaire
- achats shop simples
- quetes principales scriptes
- fallback IA local sans cle API

## 7) Limites actuelles
- pas de vrai moteur WorldOp/Validator/Policy en runtime
- etat encore reconstruit a partir d un snapshot client, pas d autorite serveur complete
- shop encore simple (prix fixe, pas de ownership/politiques)
- dialogue/fouille pas stateful
- event log surtout texte (pas replay complet)
- resolver assets encore partiellement manuel
- pass visuel map encore incomplet (coherence biomes/sols/decors)
- promesse "tout est possible" partiellement tenue sur actions complexes

## 8) Principe d architecture cible (important)
- le LLM ne fixe jamais l etat final directement
- il propose un plan
- le moteur valide
- le moteur applique
- le moteur trace

Formule:
`Action -> Plan -> Validate -> Policy -> Apply -> Log -> Narration`

## 9) Regle produit non-negociable
Tout element interactif du decor doit etre entity-first:
- adressable
- destructible (si autorise)
- echangeable (si autorise)
- capturable (si autorise)

## 10) Contrat de generalisation (critique)
But: ne jamais bloquer une action joueur, meme si elle est inedite.

Regle produit:
- aucune action libre ne doit finir en "rien ne se passe" sans explication systeme.
- toute action produit soit:
  - des `appliedOps` concretes, ou
  - des `rejectedOps` explicites + une consequence narrative/systeme tracee.

Flux de generalisation:
1. le LLM propose une intention + ops connues.
2. si la couverture est insuffisante, il remplit aussi un `unknownIntent`.
3. le moteur tente de compiler `unknownIntent` vers des `WorldOp` connues.
4. si compilation possible et policy ok: application.
5. sinon: degradation controlee (cout, temps, stress, reputation, log) + rejet explicite.
6. creation d un ticket de typage futur pour enrichir le DSL.

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

Resultat:
- moins de hardcode au cas par cas
- couverture de centaines de situations nouvelles avec peu de regles

## 12) Ordre d implementation pour atteindre le resultat voulu
1. figer le contrat `WorldOp + Validator + Policy + EventLog`.
2. figer le contrat LLM (`ContextPack`, `ResolutionPlan`, `unknownIntent`).
3. implementer la boucle authoritaire (plus de mutation directe hors ops).
4. implementer la generalisation `unknownIntent -> compile/degrade/log`.
5. implementer tags/vulnerabilities entity-first sur map + acteurs + objets.
6. brancher les 10 `CascadeRules` sur ce modele.
7. passer la checklist QA complete (boot, gameplay, coherence, save/load, perf).
8. seulement ensuite: polish UI avancé.

Definition of done produit:
- un joueur peut tenter des actions classiques, originales, absurdes.
- chaque action recoit une resolution claire et visible.
- la map, l inventaire, les stats et les objectifs evoluent de facon coherente.

## 13) Documents a lire ensuite
- [ENGINE_SPEC.md](/c:/Users/Daiki/Desktop/Rollplay/docs/ENGINE_SPEC.md)
- [ROADMAP_QA.md](/c:/Users/Daiki/Desktop/Rollplay/docs/ROADMAP_QA.md)
