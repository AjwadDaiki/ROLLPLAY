# Oracle20 - Roadmap + QA + Couverture Actions

Date: 2026-03-16  
Objectif: fournir un plan executable et un cadre de verification pour faire evoluer le projet sans casser la jouabilite.

## 1) Situation actuelle (synthese)
- Solo jouable avec boucle complete.
- IA active (Groq) + fallback local.
- Map chunkee 48x48 (3x3 ecrans 16x16).
- Actions basiques ok (move, destroy, attack, buy, quetes scriptes).
- Gaps majeurs sur actions sociales/economie/politiques/systemiques.

## 2) Couverture actions (etat)
Base de travail:
- 1000 actions repertoriees (basic -> wtf).

Etat schema actuel:
- OK: 550
- PARTIAL: 50
- GAP: 400

Objectif:
- 1000/1000 via extensions structurelles (pas 1000 commandes hardcodees).

## 3) Gaps structurels a fermer
- `H02`: economie avancee (stock/revenus/taxes)
- `H03`: construction/transformations physiques de map
- `H04`: gouvernance/lois/factions
- `H05`: coherence narrative des shifts majeurs
- `H06`: operations massives en batch
- `H07`: morph identite/sprite/state
- `H08`: contrats/ownership/droits
- `H09`: magie libre compilee en ops
- `H10`: meta-regles victoire/defaite
- `H11`: stealth line-of-sight + alertes

## 4) Plan d implementation par phases
### P0 - Fondation authoritaire
- figer `WorldOp` (union discriminee)
- ajouter schemas stricts
- implementer `Validator`
- retourner `appliedOps/rejectedOps/stateDelta`
- garder fallback local
- figer contrats API `start/action` + idempotence

Definition done P0:
- plus aucune mutation monde directe hors ops
- rejets codes et lisibles
- API stable pour debug

### P0.1 - Contrat de generalisation
- ajouter `unknownIntent` dans le protocol IA cible
- implementer compile `unknownIntent -> WorldOp` connues
- implementer degradation typee si non compilable
- tracer chaque cas dans `EventLog` + file de typage futur

Definition done P0.1:
- aucune action texte valide ne produit une reponse vide
- chaque action a `appliedOps` ou `rejectedOps` + consequences explicites
- `unknown_intent_*` mesurable en QA/replay

### P1 - Economie + ownership utiles
- `ShopState` complet
- ownership + access policy + price policy
- Contract engine minimal
- capability matrix minimale

Definition done P1:
- privatiser boutique possible et coherent
- prix owner/public differencies
- refus explicite pour non autorises

### P2 - EventLog + replay
- `TurnEvent` structure
- snapshots periodiques
- outil de replay tour pour debug

Definition done P2:
- un bug gameplay peut etre rejoue
- un tour expose exactement les ops appliquees/rejetees

### P3 - Monde reactif
- cascade engine (petit set de regles prioritaire)
- status/effets persistants
- propagation controlee avec caps
- support trait-based rules (tags/vulnerabilities)

Definition done P3:
- une action peut produire effets secondaires coherents
- pas de boucle infinie

### P3.1 - 10 CascadeRules fondamentales (a figer avant codage avance)
Les regles ci-dessous sont le minimum obligatoire pour lancer le moteur de cascades.
Chaque regle est deterministic (meme input -> meme output), tracee dans `EventLog`,
et plafonnee pour eviter les boucles.

| ID | Trigger | Conditions minimales | Ops generees (cible WorldOp) | Caps / garde-fous |
|---|---|---|---|---|
| `CR01_DAMAGE_APPLY` | `damage_actor` applique | acteur existe, cible valide, hp > 0 avant hit | `set_actor_hp`, `set_actor_state(injured)` | 1 execution par acteur/tour/source |
| `CR02_DEATH_DROP_RESPAWN` | hp acteur <= 0 apres `CR01` | acteur vivant avant hit, pas deja traite ce tour | `spawn_drop_container`, `transfer_inventory_to_container`, `gold_transfer`, `set_actor_lives`, `move_actor(camp)`, `set_actor_hp(10)` ou `set_game_status(defeat)` | 1 mort/acteur/tour, max 1 container de drop |
| `CR03_DESTROY_MUTATION` | `destroy_entity` reussi (arbre, caisse, objet decor) | entite `destroyable=true` + portee valide | `mutate_entity_state(destroyed)`, `mutate_tile`, `spawn_entity(drop)` | max 6 mutations map/action |
| `CR04_POI_ENTER_CONTEXT` | joueur entre rayon POI (shop/guild/inn/gate) | POI existe et accessible | `set_player_context(poi)`, `push_ui_hint`, `set_available_actions` | 1 changement de contexte/step |
| `CR05_TRANSACTION_ATOMIC` | demande `buy/sell` | shop ouvert, stock dispo, policy allow, or/items suffisants | `gold_delta`, `add_item/consume_item`, `shop_stock_delta`, `log_transaction` (atomique) | rollback total si une op echoue |
| `CR06_QUEST_PROGRESS` | evenement tagge (kill, pickup, talk, explore, deliver) | quete active + predicate validee | `quest_update`, `quest_complete`, `add_item`, `gold_delta`, `xp_delta` | max 2 transitions de quete/tour |
| `CR07_AGGRO_COMBAT_TRANSITION` | hostile voit joueur ou joueur attaque hostile | LOS/range valide + pas deja en combat verrouille | `set_relation(hostile)`, `set_combat_state(engaged)`, `move_actor_toward` | max 3 hostiles engages simultanes en solo |
| `CR08_STATUS_TICK` | `turn_advance` | status actif (poison, burn, buff, fear, etc.) | `damage_actor/heal_actor`, `status_stack_delta`, `status_expire` | ordre fixe: dot -> hot -> expire |
| `CR09_OWNERSHIP_POLICY_EFFECTS` | ownership/contrat change OU tick de manche | entite ownable, contrat valide | `set_owner`, `set_access_policy`, `set_price_policy`, `gold_transfer(passive_income)` | revenus passifs capes par manche |
| `CR10_OBJECTIVE_SHIFT_GUARD` | LLM propose `objective_patch` majeur | policy allow + coherence graph + non contradiction hard rules | `objective_patch`, `quest_add`, `log_objective_shift` | max 1 shift majeur/acte, jamais en combat verrouille |

Definition done P3.1:
- les 10 regles sont codees + testees (unit + integration)
- chaque regle a un `ruleId` visible dans `EventLog`
- aucune cascade n execute > `MAX_CASCADE_DEPTH`
- aucune cascade n applique > `MAX_CASCADE_OPS_PER_ACTION`

Valeurs initiales recommandees:
- `MAX_CASCADE_DEPTH = 4`
- `MAX_CASCADE_OPS_PER_ACTION = 24`
- `MAX_CASCADE_SPAWNS_PER_ACTION = 4`
- `MAX_CASCADE_TILE_MUTATIONS = 32`

### P3.2 - Trait engine (tags/vulnerabilities)
- ajouter traits sur toutes les entites interactives
- evaluer effets par regles generiques (pas de hardcode cas unique)
- brancher combat/destruction/capture/commerce sur traits + policy

Definition done P3.2:
- cas "arme de siege vs structure" resolu sans regle ad hoc
- cas "feu vs flammable" resolu via traits
- ajout d une nouvelle entite possible par data seulement (sans code gameplay)

### P4 - Systeme avance
- dialogue stateful
- investigation/fouille stateful
- objective graph dynamique
- faction/law/reputation

Definition done P4:
- actions sociales/politiques ont impact durable et trace

## 5) Checklists QA (acceptance)
### Boot / Stability
- demarrage rapide, pas d initialisation infinie
- pas d erreur runtime bloquante
- fallback IA actif sans cle API

### Gameplay core
- deplacements/collisions/bords corrects
- D20 applique et visible
- combat inflige degats et mort propre
- destruction map modifie vraiment l etat
- shop achete seulement si proche + or suffisant
- action non prevue explicitement -> resolution explicite (compile ou reject degrade)
- ownership/prix/acces impacts reels en shop

### Coherence systeme
- chaque action a:
  - soit `appliedOps` non vide
  - soit `rejectedOps` explicites
- aucun cas "narration seulement" pour une action systemique
- aucune mutation hors pipeline validator/policy
- toute cascade reference un `ruleId` connu (CR01..CR10)

### Save/Load
- sauvegarde locale fiable
- restauration sans corruption

### Performance web
- input toujours reactif
- rendering stable en tours consecutifs
- pas de fuite memoire visible sur sessions longues

## 6) Critere de release v1 solide
Release "socle solide" si:
1. pipeline ops/validator/policy en prod
2. eventlog structure actif
3. entity-first actif pour interactifs
4. shop ownership basique operationnel
5. checklist QA passee sans blocage critique
6. contrat `unknownIntent` actif sans trous fonctionnels
7. trait engine actif sur combat/destruction/interaction

## 7) Points de vigilance produit
- eviter le scope drift (casino, lois complexes, submaps dynamiques) tant que P0/P1/P2 non verrouilles
- prioriser l experience jouable et lisible
- garder la promesse "tout essayable, toujours une reponse claire"

## 8) Regle d hygiene docs
Quand un changement moteur est fait:
- mettre a jour `ENGINE_SPEC.md`
- mettre a jour cette roadmap (phase impactee)
- noter la decision dans commit/message de PR

## 9) Sanity checks architecture (a toujours verifier)
Ces checks evitent de retomber dans des specs irrealistes:

1. aucune op utilisee hors union `WorldOp`.
2. pas de `custom_op` applique en runtime authoritaire.
3. pas de conditions de regles exprimees en string interpretee.
4. separation stricte:
- planning/orchestration IA
- application monde authoritaire
5. pas de scope creep scenario avant stabilisation v1 isekai.
6. provider IA neutre dans la spec moteur (pas de dependance design a un vendor).
