# Oracle20 - Engine Spec (Technique)

Date: 2026-03-16  
Status: spec de reference pour developpement et review.

## 1) Stack actuelle
- Next.js 14 (App Router)
- React 18
- TypeScript
- Canvas 2D (rendu map)
- API routes serveur: `POST /api/solo/start`, `POST /api/solo/action`
- endpoint brut legacy: `POST /api/solo/resolve`
- LLM: `groq-sdk` (optionnel)
- fallback local heuristique si LLM indisponible

## 2) Architecture runtime actuelle
### Front
- `app/page.tsx`: menu
- `app/solo/page.tsx`: setup solo
- `app/game/GameClient.tsx`: loop UI + rendering + appel API + apply outcome

### Back
- `app/api/solo/start/route.ts`
  - cree l etat initial serveur
- `app/api/solo/resolve/route.ts`
  - input: `{ actionText, context }`
  - output: `{ ok, outcome }`
  - endpoint brut du resolver, encore utile pour debug
- `app/api/solo/action/route.ts`
  - input: `{ actionText, state }`
  - output: `{ ok, outcome, state }`
  - pipeline runtime principal utilise par le client

### Core gameplay
- `lib/solo/types.ts`: modeles
- `lib/solo/world.ts`: generation monde initial + POI + actors
- `lib/solo/logic.ts`: `buildActionContext()` + `applyOutcome()`
- `lib/solo/resolve.ts`: LLM orchestration + fallback parser local
- `lib/solo/assets.ts`: resolution item -> icon/sprite/emoji

## 3) Donnees principales actuelles
### Constantes
- `WORLD_WIDTH = 48`
- `WORLD_HEIGHT = 48`
- `CHUNK_SIZE = 16`
- `WORLD_SCREENS_X = 3`
- `WORLD_SCREENS_Y = 3`

### State principal
`SoloGameState`:
- `status`: `playing | defeat | victory`
- `turn`
- `tiles[]`
- `actors[]`
- `quests[]`
- `log[]`
- `player`
- `revealedChunks[]`
- `lastAction`
- `lastNarration`

### Context envoye a l IA
`SoloActionContext`:
- snapshot joueur: hp, lives, gold, strength, stress
- objectif et pouvoir
- position + chunk + terrain + poi
- `nearbyPois[]`
- `nearActors[]` (max 8)
- quetes resumees
- inventaire resume
- logs recents

### Resultat IA attendu
`SoloOutcome`:
- narration: `narrative`, `storyLine`, `worldEvent`
- d20: `diceRoll`
- actions: move, moveToPoi, attack, destroy, talk, quest, buy, add item, spawn, tile mutations
- deltas stats: hp/gold/stress/strength
- objectif: `objectivePatch`, `completeObjective`

## 4) Pipeline action actuel
1. UI recoit texte joueur.
2. UI ajoute log optimiste.
3. UI construit `SoloActionContext`.
4. API `/api/solo/action` appelee.
5. Le serveur reconstruit `SoloActionContext` depuis le state envoye.
6. `resolveSoloAction()`:
- LLM si disponible
- sinon fallback local
7. `applyOutcome()` applique la mutation d etat.
8. UI affiche narration, D20, effets visuels.

## 5) Details `applyOutcome()` (ordre d application)
Ordre actuel:
1. moveBy
2. moveToPoi (BFS)
3. approach hostile
4. terrain changes
5. destroy target
6. attack nearest hostile
7. npc talk
8. quest request
9. add item / buy item
10. hp/gold/stress/strength deltas
11. spawn actors
12. objective patch / objective complete
13. triggers de tile + vie/respawn + sync quetes
14. logs system/MJ

## 6) Rendu map actuel
- chunk courant seul visible (16x16)
- transition slide entre chunks adjacents (`220ms`)
- rendu terrain + props + decors + acteurs
- rendu personnage principal avec idle bob + walk frames
- animation combat simplifiee (scene neutral type duel)
- animation item gain (loot fx)

## 7) Assets
Source principale: `public/assets/Ninja Adventure - Asset Pack/...`

Usage actuel:
- personnages/monstres/animaux via spritesheets
- UI icons (or, stress, force, coeur)
- tilesets (field/nature/desert/dungeon/house)

Resolver objet:
- matching par mots-cle (`lib/solo/assets.ts`)
- fallback icon + emoji si pas de match fiable

## 8) Persistance
- localStorage par run:
  - cle: `freeroll_solo_save_v8_{player}_{run}`
- autosave debounce (`320ms`)
- reprise auto au chargement
- reset manuel via bouton rejouer

## 9) Limites techniques actuelles
1. outcome direct:
- le LLM renvoie un effet, pas une liste d ops validees.
2. pas de validator authoritaire par operation.
3. pas de policy engine (droits, lois, contrats).
4. event log non structure replay.
5. interactions complexes encore narratives.
6. le serveur travaille encore a partir d un snapshot de state envoye par le client.

## 10) Architecture cible (a implementer)
Objectif:
`WorldOp DSL + Validator + Policy Engine + EventLog`

### 10.1 WorldOp DSL (runtime authoritaire)
Chaque mutation monde doit passer par une op typée.

Familles d ops:
- acteur: move, damage, heal, status
- inventaire: add/consume/drop/equip
- economie: buy/sell/gold transfer
- entites: spawn/despawn/destroy/capture/ownership
- monde: mutate tile / structure
- social: relation/faction/crime/role
- quetes/objectifs: add/update/complete/patch
- gouvernance: laws/policies

Regle:
- pas de mutation directe hors apply d ops.
- idempotence par `opId`.

### 10.2 Validator
Verifie par op:
- schema et types
- existence de cibles
- distance / portee / collision
- ressources (or/items/hp/mana)
- cooldowns
- caps de securite (ops max, batch max)

Sortie:
- `appliedOps[]`
- `rejectedOps[]` (avec code stable)

### 10.3 Policy Engine
Decide autorisations selon:
1. hard safety
2. regles scenario
3. lois de zone
4. ownership/contrats
5. capabilities acteur
6. modificateurs contexte
7. default permissif

Decision:
- allow
- allow_with_modifiers
- deny(code)

### 10.4 EventLog structure
Par tour:
- action brute
- intent interprete
- checks + rolls D20
- proposedOps
- validatedOps
- appliedOps
- rejectedOps
- stateDelta
- narration finale

Snapshots:
- snapshot compact tous les N tours (ex: 20)
- replay entre snapshots

### 10.5 Contrat de generalisation (UnknownIntent, jamais de vide)
Probleme cible:
- une action peut sortir du DSL courant.
- le moteur ne doit jamais repondre "rien" sans raison.

Regle runtime:
- le LLM peut proposer `unknownIntent` quand aucune op connue ne couvre assez l action.
- `unknownIntent` n est jamais applique directement.
- le moteur tente d abord une compilation vers `WorldOp` connues.
- si impossible: degradation controlee + rejet explicite + log de typage futur.

Structures minimales:
```ts
type UnknownIntent = {
  intentId: string;
  rawAction: string;
  semanticTags: string[];
  targetRefs: string[];
  estimatedRisk: "low" | "medium" | "high";
  estimatedCost?: { hp?: number; gold?: number; stress?: number };
  estimatedConsequences: string[];
  confidence: number; // 0..1
};

type UnknownIntentResolution = {
  compiledOps: WorldOp[];
  degradedOps: WorldOp[];
  rejected: boolean;
  rejectCode?: RejectCode;
  typedCandidate: {
    title: string;
    whyMissing: string;
    suggestedOpFamily: string;
  };
};
```

Decision matrix:
1. `confidence >= 0.75` et risque bas -> compile vers ops connues.
2. `0.45 <= confidence < 0.75` -> resolution partielle (D20 + cout + effet limite).
3. `confidence < 0.45` ou risque haut interdit -> reject explicite + degradation minimale.

Degradation minimale authorisee (toujours typee):
- `advance_time`
- `stress_delta`
- `reputation_delta`
- `log_system_message`
- `record_unknown_intent`

Interdit:
- `custom_op` dynamique appliquee telle quelle.
- mutation monde opaque non tracee.

### 10.6 Modele tags/vulnerabilities (moteur de generalisation)
Objectif:
- remplacer le hardcode "cas par cas" par des regles generiques data-driven.

Schema entite minimal:
```ts
type EntityTraits = {
  tags: string[];            // ex: structure, wood, flammable, undead, merchant
  vulnerabilities: Record<string, number>; // ex: fire:2, siege:3
  resistances: Record<string, number>;     // ex: slash:0.7
  immunities: string[];      // ex: poison
  capabilities: string[];    // ex: destroyable, tradable, capturable, ownable
  states: string[];          // ex: intact, burning, broken, owned
};
```

Regle de calcul effet (ordre):
1. base power de l action
2. multiplicateurs `vulnerabilities`
3. reductions `resistances`
4. annulation si `immunities`
5. modificateurs policy/scenario
6. clamp securite

Exemples generiques:
- source tag `siege_weapon` + cible tag `structure` -> bonus degats structure.
- source tag `fire` + cible tag `flammable` -> chance de `state:burning`.
- action capture -> exige `capability:capturable` + policy allow.

### 10.7 Priorites d evaluation (ordre non negociable)
1. schema validator
2. hard safety
3. policy engine
4. collision/range/LOS
5. economy/resource checks
6. cascade rules
7. event log final

## 11) Reject codes (minimum canon)
- `target_not_found`
- `out_of_range`
- `line_of_sight_blocked`
- `insufficient_resource`
- `shop_closed`
- `shop_not_found`
- `not_owner`
- `missing_capability`
- `violates_law`
- `cooldown_active`
- `conflict_with_directive`
- `max_ops_cap`
- `scenario_guardrail_denied`
- `op_schema_invalid`
- `unknown_intent_unresolved`
- `unknown_intent_high_risk_denied`
- `policy_denied`
- `capability_missing`

## 12) Protocol IA cible
### Input (ContextPack)
- player snapshot
- nearby entities/tiles/POI
- active laws/policies/capabilities
- recent events
- directives persistantes
- gameplay caps
- world rulebook digest (tags/vulnerabilities actuellement visibles)

### Output (ResolutionPlan)
- interpreted intent
- checks requis
- branches D20
- proposedOps par branche
- narrative hints
- optional `unknownIntent` (si couverture DSL insuffisante)

Important:
- le LLM propose, le moteur decide.

## 12.1 Prompt systeme exact actuel (source: `lib/solo/resolve.ts`)
Le systeme envoie exactement ce template (avec `context` JSON injecte):

```text
Tu es le MJ IA d un RPG solo isekai tour par tour.
Reponds uniquement en JSON valide respectant SoloOutcome.
Le joueur peut tenter toute action.
Le moteur applique seulement des operations valides.
D20: 1 catastrophe / 2-5 echec / 6-10 partiel / 11-14 succes / 15-19 gros succes / 20 legendaire.
Si action sans risque: diceRoll null.
N envoie pas de champs non demandes. N envoie destroyTarget que si destruction explicite.
Toujours fournir storyLine (phrase courte style narration en haut).
Contexte joueur:
{JSON.stringify(context)}
Schema attendu:
{
  "narrative":"string",
  "storyLine":"string",
  "diceRoll":"number|null",
  "moveBy":{"dx":0,"dy":0},
  "moveToPoi":"camp|guild|shop|inn|dungeon_gate|boss_gate|null",
  "moveToPoiSteps":2,
  "approachNearestHostile":false,
  "damageSelf":0,
  "healSelf":0,
  "stressDelta":0,
  "strengthDelta":0,
  "goldDelta":0,
  "requestQuest":false,
  "buyItemName":null,
  "addItemName":null,
  "destroyTarget":{"dx":0,"dy":-1},
  "attackNearestHostile":false,
  "attackPower":8,
  "talkToNearestNpc":false,
  "npcSpeech":null,
  "terrainChanges":[],
  "spawnActors":[],
  "worldEvent":null,
  "objectivePatch":null,
  "completeObjective":false
}
```

Notes:
- Ce prompt est la verite runtime actuelle.
- Toute evolution du role MJ doit d abord etre versionnee ici.
- Quand on passera a `ResolutionPlan + WorldOps`, cette section devra etre dupliquee en `Prompt v2`.

## 12.2 Enveloppe d appel LLM exacte (runtime actuel)
Appel effectif (`resolveSoloAction`) quand `GROQ_API_KEY` est present:

```ts
groq.chat.completions.create({
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  temperature: 0.55,
  max_tokens: 700,
  messages: [
    { role: "system", content: buildSystemPrompt(input) },
    { role: "user", content: `Action joueur: ${input.actionText}` },
  ],
});
```

Post-traitement strict:
- extraction JSON via `extractJson()`
- `sanitizeOutcome()` (clamps, champs autorises, tailles max arrays)
- `postProcessOutcome()` (intent parser, move/poi normalization, D20 fallback)
- fallback local complet si erreur provider ou JSON invalide

Regle d exploitation:
- si ce bloc change, mettre a jour cette section le meme jour.
- garder un historique de versions (`Prompt v1`, `Prompt v2`) pour debug regressions.

## 13) Regle entity-first (non negociable)
Tout element interactif du decor est une entite adressable.

Capacites minimales par entite (selon policy):
- `destroyable`
- `tradable`
- `capturable`
- `interactable`

## 14) Contraintes perf recommandees
- max ops par action: 12
- max batch tiles par action: 32
- max spawn par action: 4
- timeout API IA strict + fallback local
- diff state minimal renvoye au client

## 15) Erreurs de conception a eviter
- `custom_op` non type en runtime
- conditions de regles en string interpretee (quasi eval)
- ops utilisees en cascade mais absentes du type union
- scope creep scenario (casino/politique lourde) avant socle v1 stable

## 16) Contrats API cibles a figer (v1 solo)
### 16.1 `POST /api/solo/start`
Input:
- `playerName: string`
- `scenarioId: "isekai"`
- `spriteId: string`
- `powerText: string`
- `powerRoll?: number` (si absent: serveur roll)

Output:
- `sessionId: string`
- `snapshot: GameStateSnapshot`
- `serverNow: string`

### 16.2 `POST /api/solo/action`
Input:
- `sessionId: string`
- `clientTurnId: string`
- `actionText: string`
- `stateDigest: string`

Output:
- `ok: boolean`
- `rolls: { d20?: number }`
- `appliedOps: WorldOp[]`
- `rejectedOps: { opId?: string; code: RejectCode; reason: string }[]`
- `stateDelta: GameStateDelta`
- `narration: { storyLine: string; narrative: string; worldEvent?: string }`
- `eventId: string`

Garanties:
- idempotence par `clientTurnId`
- jamais de reponse vide pour une action valide en entree

## 17) `WorldOp` canon minimal (union discriminee)
Families minimales a impler en v1:
- actor: `move_actor`, `damage_actor`, `heal_actor`, `set_actor_state`
- inventory: `add_item`, `consume_item`, `drop_item`, `equip_item`, `unequip_item`
- economy: `gold_delta`, `buy_item`, `sell_item`, `shop_stock_delta`
- world: `mutate_tile`, `mutate_entity_state`, `spawn_entity`, `despawn_entity`
- social: `dialogue_start`, `relation_delta`, `faction_delta`
- quest/objective: `quest_add`, `quest_update`, `quest_complete`, `objective_patch`
- governance: `set_owner`, `set_access_policy`, `set_price_policy`
- generalization-safe: `record_unknown_intent`, `advance_time`, `reputation_delta`, `log_system_message`

Contraintes:
- chaque op a `opId`, `type`, `actorId`, `timestamp`, `payload`.
- toute op est validable sans eval dynamique.

## 18) Policy matrix minimale (ordre de priorite)
1. hard safety (never bypass)
2. scenario guardrails
3. global world laws
4. zone laws
5. ownership/contracts
6. actor capabilities
7. default permissif

Sortie policy:
- `allow`
- `allow_with_modifiers` (cout, cap, cooldown)
- `deny` + `RejectCode`

## 19) Definition of done architecture
La spec est consideree "suffisante pour livrer le jeu cible" si:
1. les endpoints 16.1/16.2 sont implementes et testes.
2. le union `WorldOp` section 17 est active en runtime.
3. la policy matrix section 18 est appliquee avant mutation.
4. `unknownIntent` est gere sans reponse vide.
5. les cascades P3.1 sont tracees dans `EventLog`.
