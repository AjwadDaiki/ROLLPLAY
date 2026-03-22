# Plan De Fermeture Des Lacunes De Generalisation

## 1. Diagnostic Base Sur Les Runs Fuzz
- Source principale: `docs/SANDBOX_WTF_FUZZ_REPORT_1000.md` (1000 cas, seed 4242).
- Etat actuel:
- `WorldOps coverage`: 53%.
- `Meaningful impact`: 62%.
- `Semantic miss` sur actions supportees: 4% (23/617).
- `misroute`: 1 cas.
- `no_impact`: 68 cas.
- `contained`: 311 cas.
- Zones les plus faibles:
- `free`: 33 no_impact.
- `cat_actor`: 15 no_impact.
- `ruin_tile`: 17 no_impact.
- `tree_tile`: 3 no_impact + 1 misroute.

## 2. Causes Racines
- Parser semantique encore trop lexical:
- `detruis ...` et `coupe ...` ne passent pas toujours en `destroy`.
- Des modificateurs de style (`moonwalk`) detournent vers `perform`.
- Contrat "action supportee => impact" incomplet:
- `rest`, `craft`, `hide` peuvent produire 0 delta quand etat sature ou miss propre.
- Familles d actions non modelees dans le moteur:
- entrave (`menotter`, `desarmer`), pieges/obstacles, coercition sociale, manipulation d objet lourd, construction/transformation.
- Trop de `resolvedVerb = none` (325/1000):
- fallback correct en securite, mais pas assez de generalisation mecanique.

## 3. Principe De Refonte (sans hardcode)
- Unifier la chaine:
- `Input libre -> ActionIntent canonique -> ActionPlan -> WorldOps -> Delta visible + persistant`.
- Isoler les modificateurs de style:
- `manner/modifier` (moonwalk, discretement, etc.) ne doit jamais remplacer le verbe principal.
- Garantir "zero no-impact sur actions supportees":
- si outcome principal est nul, injecter un delta systemique minimal (etat, temps, fatigue, trace, memoire sociale).

## 4. Plan D Execution Par Lots

## Lot A (Priorite 1): Eliminer `no_impact` et `misroute` residuels
- Verbes cibles: `rest`, `craft`, `hide`, `destroy`.
- Actions:
- Ajouter un `min_effect_policy` pour verbes supportes: au minimum `set_entity_state` ou `adjust_*` ou `record_incident` contextuel.
- `rest`: toujours produire un effet (recuperation, sinon micro-relief stress/fatigue/temps passe trace).
- `craft`: si miss propre, produire un effet de progression artisanat/etat atelier au lieu de 0.
- `hide`: si stress deja bas, produire au moins trace de furtivite/memoire entite/etat camouflage temporaire.
- `destroy`: couvrir flexions verbales (`detruis`, `coupe`, `decoupe`) via normalisation canonique.
- `perform`: ajouter gardes anti-collision semantique contre lexique destructif.
- Sortie attendue:
- `no_impact` <= 1% sur fuzz 1000.
- `misroute` = 0 sur 3 seeds consecutifs.

## Lot B (Priorite 2): Stabiliser la comprehension semantique
- Objectif: baisser `semantic miss` de 4% a <= 1%.
- Actions:
- Ajouter un pre-parser de lemmas FR (verbe de base + complement + cible + style).
- Introduire un score de confiance par verbe, avec penalite forte pour `perform` si verbe action concret present.
- Split "intention" vs "manner": ex. `couper arbre` (intent) + `moonwalk` (manner).
- Renforcer la resolution cible:
- cible explicite > cible contextuelle popup > fallback proximite.
- Sortie attendue:
- `semantic miss` <= 1%.
- `destroy->none` et `destroy->perform` quasi nuls.

## Lot C (Priorite 3): Generaliser les familles contenues les plus frequentes
- Prioriser par volume (d apres 1000 cas):
- Entrave/controle.
- Pieges/obstacles.
- Magie realite/impossible.
- Construction/transformation.
- Coercition sociale.
- Actions multi-cibles.
- Manipulation physique lourde.
- Actions:
- Creer 7 familles canoniques de verbes et plans generiques:
- `control_entity`, `deploy_obstacle`, `coerce_social`, `construct_world`, `manipulate_heavy_object`, `batch_social_action`, `high_cost_reality_action`.
- Chaque famille doit se compiler en WorldOps parametriques, pas en cas ad hoc par PNJ/map.
- Ajouter policy engine par capacites:
- masse, slots mains, outils, faction law, preuves/temoins, cout ressources, zone sensible.
- Sortie attendue:
- reduction `contained` de 311 a <= 180 (premiere vague).
- `resolvedVerb = none` en baisse continue.

## Lot D (Priorite 4): Rendre les rejets eux-memes systemiques
- Objectif: meme non supporte => consequence visible coherente.
- Actions:
- Rejet explicite avec code + cause + alternative automatique.
- Delta minimal cross-system:
- trace, bruit, suspicion, memoire PNJ, mini cout temps/energie.
- Journal causal standardise (pour debug et UX).
- Sortie attendue:
- disparition des "actions mortes silencieuses".
- meilleure lisibilite joueur sur "pourquoi ca n a pas marche".

## Lot E (Priorite 5): Industrialiser la QA de generalisation
- Actions:
- Garder `qa:wtf:fuzz` en CI avec 3 seeds fixes (`300 + 1000`) et seuils bloquants.
- Ajouter rapports diff run-to-run (regressions verbes/cibles/categories).
- Ajouter corpus "extreme scripted" par famille de verbe canonique.
- Sortie attendue:
- regression immediate detectee.
- pipeline mesurable et pilotable.

## 5. KPI Cibles (gates de release)
- `misroute_rate`: 0.
- `no_impact_rate` (actions supportees): <= 1%.
- `semantic_miss_rate` (actions supportees): <= 1%.
- `world_ops_coverage`: >= 80%.
- `meaningful_impact_rate`: >= 85%.
- `contained_rate`: baisse sprint apres sprint.

## 6. Ordre De Mise En Oeuvre Recommande
- Semaine 1: Lot A (rest/craft/hide/destroy + guard perform).
- Semaine 2: Lot B (pre-parser intent/manner + scoring verbe).
- Semaine 3-4: Lot C (2 familles a la fois: `control_entity`, `deploy_obstacle`, puis `coerce_social`, `manipulate_heavy_object`).
- Semaine 5+: Lot D et E (rejets systemiques + CI quality gates stricts).

## 7. Definition De Reussite Produit
- Un joueur peut tenter des actions absurdes, opportunistes ou creativement violentes.
- Le moteur repond sans casser la coherence:
- soit effet mecanique visible et persistant,
- soit rejet explicite avec consequences contextuelles utiles.
- Le comportement emerge de familles generiques + policy engine, pas d accumulation de patches regex.

