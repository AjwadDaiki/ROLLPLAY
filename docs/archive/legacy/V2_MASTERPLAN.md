# ORACLE20 V2 — MASTERPLAN DE MIGRATION

> De "moteur isekai solo jouable" vers "sandbox RPG generalise par IA"
>
> Date: 2026-03-18 | Auteur: Claude + Daiki

---

## TABLE DES MATIERES

1. [Diagnostic V1 — Etat des lieux](#1-diagnostic-v1)
2. [Les 7 problemes fondamentaux](#2-les-7-problemes-fondamentaux)
3. [Architecture cible V2](#3-architecture-cible-v2)
4. [Phase 0 — Config Layer & Magic Numbers](#4-phase-0--config-layer)
5. [Phase 1 — Le Verb Engine (generalisation des actions)](#5-phase-1--verb-engine)
6. [Phase 2 — Entity-First World Model](#6-phase-2--entity-first-world-model)
7. [Phase 3 — Cascade & Policy Engine](#7-phase-3--cascade--policy-engine)
8. [Phase 4 — IA Resolution Pipeline v2](#8-phase-4--ia-resolution-pipeline-v2)
9. [Phase 5 — UX Spatiale & Interaction Directe](#9-phase-5--ux-spatiale)
10. [Phase 6 — Monde Vivant (Events, PNJ AI, Companions)](#10-phase-6--monde-vivant)
11. [Phase 7 — Stats & Combat v2](#11-phase-7--stats--combat-v2)
12. [Phase 8 — Persistance & Multijoueur Ready](#12-phase-8--persistance)
13. [Ordre d'execution & dependances](#13-ordre-dexecution)
14. [Metriques de succes](#14-metriques-de-succes)
15. [Risques & mitigations](#15-risques--mitigations)

---

## 1. DIAGNOSTIC V1

### Ce qui marche bien
- Map 48x48 coherente, audit 0 bug
- Boucle de jeu complete: move → action → D20 → narration → consequence
- Shop, guild, combat, respawn, save/load fonctionnels
- Rendu canvas pixel-art fluide a 60fps
- Fallback local si pas d'API key Groq
- Systeme de reputation et incidents sociaux en place

### Ce qui bloque la generalisation

| Metrique | V1 actuelle | Cible V2 |
|----------|-------------|----------|
| Actions gerees par sandbox | 29% | 95%+ |
| Actions avec WorldOps reelles | 22% | 95%+ |
| Legacy hardcode restant | 32% | 0% |
| Erreurs semantiques (mauvais verbe/cible) | 11% | <2% |
| Reroutes suspectes | 14% | <3% |
| Items dans le shop | 5 | 30+ (dynamique) |
| Types d'evenements monde | 5 | 20+ (procedurale) |
| Stats joueur | 6 | 16+ |
| Comportements PNJ distincts | 2 (follow/hold) | 8+ |

---

## 2. LES 7 PROBLEMES FONDAMENTAUX

### P1. Absence de couche de configuration
**Symptome:** 200+ magic numbers eparpilles dans 12 fichiers.
**Impact:** Chaque changement d'equilibrage necessite de modifier du code source.
**Exemples critiques:**
- `MAX_STRESS = 100` (logic.ts:32)
- Respawn a (24,25) hardcode (logic.ts:832)
- Vente a 55% du prix (logic.ts:621)
- Damage hostile = 2 (logic.ts:536)
- Temperature IA = 0.55 (resolve.ts:113)
- 5 items de shop a 12 gold chacun (shop.ts:8-39)
- Spawn garde a (22,23) avec stats fixes (worldTick.ts:263)
- Reputation militia hostile a -12 (worldTick.ts)

**Solution:** Extraire TOUTES les constantes dans `lib/solo/config.ts` — un fichier unique, type, avec des sections claires. Zero magic number dans le code metier.

---

### P2. Resolution d'action fragmentee et non-generalisable
**Symptome:** 3 chemins de resolution paralleles qui ne partagent rien:
1. `sandbox.ts` — code imperatif pour steal/buy/sell/negotiate/take
2. `resolve.ts` → LLM Groq — prompt + parse JSON
3. `resolveLocally()` — fallback minimal sans IA

**Impact:** Ajouter un nouveau verbe = modifier 3 fichiers. 32% des actions passent encore par le legacy pipeline.

**Solution:** Un **Verb Engine** unique. Chaque verbe est un module independant avec: `canHandle(draft) → bool`, `plan(draft, state) → WorldOp[]`, `narrate(ops, roll) → string`. L'IA ne produit plus un `SoloOutcome` monolithique — elle produit un `ActionDraft` (verbe + cible + parametres) que le Verb Engine execute.

---

### P3. SoloOutcome monolithique = plafond de verre
**Symptome:** `SoloOutcome` a 25+ champs optionnels. L'IA doit deviner lequel remplir. Chaque nouvelle action = ajouter un champ.

```typescript
// Aujourd'hui l'IA doit retourner:
{ moveBy, moveToPoi, attackNearestHostile, attackPower,
  buyItemName, addItemName, destroyTarget, talkToNearestNpc,
  terrainChanges, spawnActors, worldEvent, objectivePatch, ... }
```

**Impact:** Schema instable, erreurs de parsing frequentes, impossible de generaliser.

**Solution:** L'IA retourne un `ActionDraft` minimal:
```typescript
{ verb: string, target: EntityRef, params: Record<string, any>,
  diceRoll: number | null, narrative: string, storyLine: string }
```
Le moteur traduit le draft en `WorldOp[]` via le Verb Engine. L'IA n'a plus besoin de connaitre la structure interne du jeu.

---

### P4. GameClient monolithique (2400+ lignes)
**Symptome:** Un seul composant React gere: rendu canvas, input clavier/souris, state management, animations, sons, UI, sauvegarde, reseau.
**Impact:** Impossible de modifier une partie sans risquer de casser les autres. Ajout de features = complexite exponentielle.

**Solution:** Decomposer en modules:
- `useGameState()` — hook de state management
- `useInput()` — clavier + souris
- `useCanvas()` — rendu 2D
- `useNetwork()` — requetes API avec retry/backoff
- `useAnimations()` — FX, transitions, bulles
- `GameHUD` — composant React pour le HUD
- `NarratorPanel` — journal du MJ
- `ContextMenu` — menu contextuel sur clic droit

---

### P5. Stats derivees du HP = systeme fragile
**Symptome:** `strength = maxHp/2 + 4`, `combatLevel = maxHp/4 + bonus`, `defense = maxHp/3`
**Impact:** Pas de build diversity. Un monstre avec 20 HP a automatiquement 14 strength. Changer le HP casse tout.

**Solution:** Stats primaires explicites sur chaque entite:
```typescript
{ force, vitesse, volonte, magie, aura } // 5 primaires
{ defense, precision, esquive, perception, discretion,
  chance, initiative, charisme, endurance, resonance } // 10 secondaires
```
Les secondaires se calculent a partir des primaires + equipement + buffs, jamais du HP.

---

### P6. Monde statique entre les tours
**Symptome:** Les PNJ ne bougent pas, ne reagissent pas, ne vivent pas. Le monde attend que le joueur agisse.
**Impact:** Aucune immersion. Le village semble mort.

**Solution:**
- **World Tick enrichi:** Chaque tour, les PNJ executent une micro-action (patrouille, dialogue ambiant, commerce entre eux)
- **Event Director:** Genere des evenements dynamiques bases sur le contexte (pas juste 5 scripts)
- **Memoire sociale:** Les PNJ se souviennent des actions du joueur et adaptent leur comportement

---

### P7. Pas de gestion d'erreur gracieuse
**Symptome:** Timeout IA → erreur generique. Parse JSON echoue → fallback silencieux. localStorage plein → perte silencieuse.
**Impact:** Le joueur ne sait jamais pourquoi quelque chose ne marche pas.

**Solution:**
- Retry avec backoff exponentiel (3 tentatives, 1s/2s/4s)
- Si echec IA: narration explicit "Le destin hesite..." + resolution locale de qualite
- Erreurs de save: notification visuelle + retry auto
- Chaque action retourne un `confidence` score: "ai_resolved" | "sandbox_resolved" | "fallback_resolved"

---

## 3. ARCHITECTURE CIBLE V2

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  GameShell → [useInput, useCanvas, useAnimations]    │
│  GameHUD ← state                                     │
│  NarratorPanel ← log                                 │
│  ContextMenu ← entity capabilities                   │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/solo/action
                       ▼
┌─────────────────────────────────────────────────────┐
│                  API GATEWAY                          │
│  validate → hydrate → rate-limit → route             │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│              ACTION PIPELINE V2                       │
│                                                       │
│  1. PlayerInteractionRequest                          │
│     ↓                                                 │
│  2. ActionDraft (verb + target + params)              │
│     ↓ [IA si ambigue, sinon deterministe]             │
│  3. Verb Engine → WorldOp[] proposees                 │
│     ↓                                                 │
│  4. Validator (schema, distance, ressources)          │
│     ↓                                                 │
│  5. Policy Engine (regles, lois, cooldowns)           │
│     ↓                                                 │
│  6. Cascade Engine (reactions en chaine)              │
│     ↓                                                 │
│  7. State Application (mutations atomiques)           │
│     ↓                                                 │
│  8. Narration (IA genere le texte apres les faits)   │
│     ↓                                                 │
│  9. Response { appliedOps, rejectedOps, narrative,    │
│               stateDelta, confidence }                │
└─────────────────────────────────────────────────────┘
```

### Changement fondamental: L'IA passe de "decideur" a "interprete + narrateur"

**V1:** L'IA recoit le texte du joueur et retourne les mutations du monde.
**V2:** L'IA recoit le texte du joueur et retourne un `ActionDraft` (intention). Le moteur decide des mutations. L'IA narrate le resultat.

Pourquoi: L'IA est excellente pour comprendre l'intention et raconter l'histoire. Elle est mauvaise pour garantir la coherence mecanique. En separant ces roles, on obtient un moteur deterministe fiable + une narration creative.

---

## 4. PHASE 0 — CONFIG LAYER

**Objectif:** Zero magic number dans le code metier.
**Effort:** 1-2 jours
**Dependances:** Aucune (peut etre fait immediatement)

### Fichier: `lib/solo/config.ts`

```typescript
export const CONFIG = {
  world: {
    width: 48,
    height: 48,
    chunkSize: 16,
  },
  player: {
    startHp: 10,
    startLives: 3,
    startGold: 10,
    startTorches: 1,
    maxStress: 100,
    respawnPosition: { x: 24, y: 25 },
    deathGoldLossPercent: 50,
    maxMovePerTurn: 10,
    maxPoiPathSteps: 12,
  },
  combat: {
    baseDamageHostile: 2,
    bossCompletionGold: 40,
    regularEnemyGold: 8,
    damageFormula: "strength * roll / 20", // sera evalue dynamiquement
  },
  shop: {
    defaultResalePercent: 55,
    maxDiscountPercent: 60,
    catalog: [
      { id: "potion_soin", label: "Potion de soin", price: 12, effect: "heal", value: 5 },
      { id: "torche", label: "Torche", price: 8, effect: "light", value: 1 },
      // ... extensible
    ],
  },
  ai: {
    model: "llama-3.3-70b-versatile",
    temperature: 0.45,     // baisse de 0.55 pour plus de coherence
    maxTokens: 700,
    timeoutMs: 12000,      // monte de 9000 pour fiabilite
    maxRetries: 3,
    retryDelaysMs: [1000, 2000, 4000],
  },
  reputation: {
    militiaHostileThreshold: -12,
    bountyThreshold: -20,
    heroTitle: 30,
    protectorTitle: 16,
  },
  worldEvents: {
    minTurnsBetween: 8,
    maxTurnsBetween: 16,
  },
  rendering: {
    tilePx: 30,
    slideMs: 220,
    saveDebounceMs: 320,
    moveIntervalMs: 138,
    maxSpeechBubbles: 14,
  },
} as const;
```

### Actions:
1. Creer `lib/solo/config.ts` avec toutes les constantes
2. Remplacer chaque magic number par `CONFIG.xxx`
3. Verifier que `npx tsc --noEmit` passe
4. Aucun changement fonctionnel — refactor pur

---

## 5. PHASE 1 — VERB ENGINE (generalisation des actions)

**Objectif:** Chaque action du joueur passe par un verbe generique au lieu de branches hardcodees.
**Effort:** 3-5 jours
**Dependances:** Phase 0

### Concept: Le Verb Registry

```typescript
// lib/solo/verbs/types.ts
interface VerbHandler {
  id: string;                          // "attack", "buy", "steal", etc.
  aliases: string[];                   // ["attaquer", "frapper", "taper"]
  canHandle(draft: ActionDraft, state: SoloGameState): boolean;
  validate(draft: ActionDraft, state: SoloGameState): ValidationResult;
  plan(draft: ActionDraft, state: SoloGameState, roll: number | null): WorldOp[];
  narrateSuccess(ops: WorldOp[], roll: number, state: SoloGameState): string;
  narrateFailure(reason: string, roll: number, state: SoloGameState): string;
}

interface ActionDraft {
  verb: string;                        // identifie par le Verb Engine ou l'IA
  target: EntityRef | null;            // cible contextuelle
  params: Record<string, any>;         // parametres specifiques au verbe
  diceRoll: number | null;             // D20 si applicable
  rawText: string;                     // texte original du joueur
  source: "sandbox" | "ai" | "ui";    // origine de l'interpretation
}
```

### Verbes a implementer (par priorite)

**Tier 1 — Core (sans IA):**
| Verbe | Alias FR | Cible | WorldOps generees |
|-------|----------|-------|-------------------|
| `move` | aller, marcher, courir | tile/poi | `move_actor` |
| `attack` | attaquer, frapper, taper | actor | `damage_actor`, `gold_delta`, `set_actor_state` |
| `buy` | acheter | item@shop | `gold_delta`, `add_item`, `shop_stock_delta` |
| `sell` | vendre | item | `gold_delta`, `consume_item`, `shop_stock_delta` |
| `use` | utiliser, boire, manger | item | `consume_item`, `heal_actor` / `set_actor_state` |
| `talk` | parler, discuter | actor | `dialogue_start`, `relation_delta` |
| `take` | prendre, ramasser | object/drop | `add_item`, `despawn_entity` |
| `inspect` | examiner, regarder | any | (pas de mutation, narration only) |

**Tier 2 — Social (avec D20):**
| Verbe | Alias FR | Cible | WorldOps generees |
|-------|----------|-------|-------------------|
| `steal` | voler, derober | actor/structure | `transfer_item`, `record_crime`, `relation_delta` |
| `negotiate` | negocier, marchander | actor | `gold_delta`, `relation_delta` |
| `recruit` | recruter, apprivoiser | actor | `recruit_actor`, `loyalty_delta` |
| `intimidate` | intimider, menacer | actor | `relation_delta`, `set_actor_state` |
| `persuade` | convaincre, persuader | actor | `relation_delta`, `quest_update` |

**Tier 3 — Monde (avec D20):**
| Verbe | Alias FR | Cible | WorldOps generees |
|-------|----------|-------|-------------------|
| `destroy` | detruire, casser | structure/object | `mutate_tile`, `spawn_entity(debris)` |
| `open` | ouvrir | structure/object | `set_entity_state`, `spawn_entity(loot)` |
| `burn` | bruler, enflammer | tile/structure | `mutate_tile`, `set_entity_state`, `damage_actor(zone)` |
| `build` | construire, reparer | tile | `mutate_tile`, `consume_item` |
| `craft` | fabriquer, creer | item+item | `consume_item`, `add_item` |

**Tier 4 — Meta / Specials:**
| Verbe | Alias FR | Cible | WorldOps generees |
|-------|----------|-------|-------------------|
| `rest` | dormir, se reposer | self/inn | `heal_actor`, `advance_time`, `gold_delta` |
| `wait` | attendre | self | `advance_time` |
| `equip` | equiper | item | `equip_item` |
| `drop` | poser, lacher | item | `drop_item`, `spawn_entity` |
| `cast` | lancer (sort) | any | depends on spell |

### Fichier: `lib/solo/verbs/registry.ts`

```typescript
const VERB_REGISTRY: VerbHandler[] = [];

export function registerVerb(handler: VerbHandler) {
  VERB_REGISTRY.push(handler);
}

export function resolveVerb(draft: ActionDraft, state: SoloGameState): VerbHandler | null {
  // 1. Match exact par verb id
  const exact = VERB_REGISTRY.find(v => v.id === draft.verb);
  if (exact?.canHandle(draft, state)) return exact;

  // 2. Match par alias
  const byAlias = VERB_REGISTRY.find(v =>
    v.aliases.some(a => draft.rawText.toLowerCase().includes(a))
  );
  if (byAlias?.canHandle(draft, state)) return byAlias;

  // 3. Pas de match → l'IA decidera
  return null;
}
```

### Pipeline de resolution V2:

```
Texte joueur
  ↓
[1] Sandbox intent parser (regex + heuristiques)
  → ActionDraft si pattern reconnu
  ↓ sinon
[2] IA intent parser (prompt minimal: "quel verbe + quelle cible?")
  → ActionDraft
  ↓
[3] Verb Engine: resolveVerb(draft) → VerbHandler
  ↓
[4] VerbHandler.validate(draft, state) → ok | deny(reason)
  ↓
[5] D20 roll si necessaire
  ↓
[6] VerbHandler.plan(draft, state, roll) → WorldOp[]
  ↓
[7] Policy Engine filtre les ops
  ↓
[8] Apply ops → new state
  ↓
[9] Narration (IA ou template)
```

### Exemple concret: "je vole la bourse du marchand"

```
[1] Sandbox: regex "vol" → verb="steal"
    target detection: "marchand" → actor:npc_shopkeeper
    → ActionDraft { verb: "steal", target: "actor:npc_shopkeeper", params: { item: "bourse" } }

[3] Verb Engine: resolveVerb → StealHandler
[4] StealHandler.validate:
    - joueur a portee du marchand? ✓ (distance <= 2)
    - marchand vivant? ✓
    - cooldown steal? ✓ (pas de vol recent)
    → ok

[5] D20 roll: 14 (succes)

[6] StealHandler.plan:
    → [
        { type: "gold_delta", actorId: "player", delta: +15 },
        { type: "gold_delta", actorId: "npc_shopkeeper", delta: -15 },
        { type: "record_crime", incident: { type: "theft", victim: "npc_shopkeeper", zone: "village" } },
        { type: "relation_delta", actorId: "npc_shopkeeper", delta: -20 },
        { type: "set_entity_state", entityId: "npc_shopkeeper", state: "alert" },
      ]

[7] Policy:
    - vol autorise dans cette zone? oui (pas de zone sacree)
    - joueur pas en cooldown? oui
    → toutes ops validees

[8] Apply: state mute

[9] Narration IA: "D'un geste vif, tu subtilises la bourse du marchand pendant
    qu'il se retourne. 15 pieces d'or de plus dans ta poche. Mais ses yeux
    se plissent — il a remarque quelque chose..."
```

---

## 6. PHASE 2 — ENTITY-FIRST WORLD MODEL

**Objectif:** Tout element interactif du monde est une entite adressable avec des capacites declaratives.
**Effort:** 3-4 jours
**Dependances:** Phase 0

### Probleme actuel
- Les batiments sont des blocs de tiles sans identite
- Les PNJ sont des `WorldActor` avec des champs optionnels incoherents
- Les objets au sol n'existent pas comme entites
- Le terrain n'a pas de proprietes interactives

### Solution: WorldEntity unifie

```typescript
// lib/solo/entities/types.ts
interface WorldEntity {
  id: string;                    // unique, stable
  kind: EntityKind;              // "actor" | "structure" | "object" | "tile_feature"
  label: string;                 // nom affiche
  position: Vec2;                // position monde
  footprint: Vec2[];             // cases occupees (multi-tile pour batiments)
  approachCells: Vec2[];         // cases depuis lesquelles interagir

  // Capabilities declaratives — le Verb Engine les consulte
  capabilities: string[];        // ["buy", "sell", "talk", "quest", "rest"]
  tags: string[];                // ["merchant", "hostile", "destructible", "container"]
  states: Set<string>;           // ["open", "burning", "alert", "dead"]

  // Inventaire (si applicable)
  inventory?: ItemStack[];

  // Stats (si applicable)
  stats?: EntityStats;

  // Social (si applicable)
  faction?: string;
  relationToPlayer?: number;     // -100 to +100

  // AI behavior (si applicable)
  behavior?: BehaviorProfile;
}
```

### Avantage cle: les capabilities pilotent le Verb Engine

Quand le joueur ecrit "acheter epee" pres du marchand:
1. On cherche une entite avec `capabilities.includes("sell")` dans un rayon de 2
2. On resout le verbe `buy`
3. Le `BuyHandler` consulte `entity.inventory` pour verifier le stock

Quand le joueur ecrit "acheter epee" pres d'un arbre:
1. Aucune entite avec `capabilities.includes("sell")` → rejet clair
2. Narration: "Il n'y a personne ici pour te vendre quoi que ce soit."

### Migration des structures hardcodees

```
getMapStructures()           → EntityRegistry.getStructures()
VILLAGE_BUILDINGS            → entities avec kind="structure"
VILLAGE_ACTOR_ANCHORS        → entities avec kind="actor" + behavior
createVillagePoiNodes()      → entities avec capabilities
```

### Entity Registry: `lib/solo/entities/registry.ts`

```typescript
class EntityRegistry {
  private entities: Map<string, WorldEntity> = new Map();

  register(entity: WorldEntity): void;
  getById(id: string): WorldEntity | null;
  getAtTile(x: number, y: number): WorldEntity[];
  getInRadius(center: Vec2, radius: number): WorldEntity[];
  getWithCapability(cap: string): WorldEntity[];
  getWithTag(tag: string): WorldEntity[];
  getByKind(kind: EntityKind): WorldEntity[];

  // Mutations
  setState(id: string, state: string, active: boolean): void;
  updateInventory(id: string, fn: (inv: ItemStack[]) => ItemStack[]): void;
  updateRelation(id: string, delta: number): void;
}
```

---

## 7. PHASE 3 — CASCADE & POLICY ENGINE

**Objectif:** Les consequences des actions se propagent naturellement selon des regles declaratives.
**Effort:** 4-5 jours
**Dependances:** Phase 1, Phase 2

### Pourquoi c'est necessaire

Aujourd'hui, quand le joueur tue un marchand:
- Le marchand meurt ✓
- ... et c'est tout.

En V2, quand le joueur tue un marchand:
- Le marchand meurt → `CR02_DEATH_DROP_RESPAWN`
- Son inventaire tombe au sol → `spawn_entity(loot_container)`
- Les temoins signalent le crime → `CR_WITNESS_REPORT`
- La reputation baisse → `reputation_delta`
- La milice devient hostile → `CR07_AGGRO_COMBAT_TRANSITION`
- Le shop ferme (plus de marchand) → `set_entity_state("shop", "closed")`
- Une quete de marchand echoue → `CR06_QUEST_PROGRESS`

Tout ca sans code specifique. Juste des regles generiques.

### Les 10 Cascade Rules (deja specifiees dans ENGINE_SPEC)

Implementation sous forme de handlers:

```typescript
// lib/solo/cascade/types.ts
interface CascadeRule {
  id: string;
  trigger: (op: WorldOp, state: SoloGameState) => boolean;
  generate: (op: WorldOp, state: SoloGameState) => WorldOp[];
  maxPerTurn: number;  // safety cap
}
```

### Policy Engine: 3 couches de validation

```
WorldOp proposee
  ↓
[1] HARD SAFETY — invariants du moteur
    - Pas de teleportation > 48 cases
    - Pas de HP > maxHp
    - Pas de gold negatif
    - Pas de spawn hors monde
    - MAX_CASCADE_DEPTH = 4
    - MAX_OPS_PER_ACTION = 24
    ↓
[2] SCENARIO RULES — regles du monde
    - Zones sacrees (pas de combat dans le temple)
    - Immunites (boss invulnerable en phase 1)
    - Heures (shop ferme la nuit)
    - Restrictions de quete
    ↓
[3] ENTITY POLICY — regles par entite
    - Ownership (pas voler son propre stock)
    - Capabilities (pas acheter a un arbre)
    - Cooldowns (pas renegocier 2x de suite)
    - Distance (hors portee = rejet)
    ↓
Resultat: allow | allow_with_modifiers | deny(code, reason)
```

### Fichier: `lib/solo/cascade/engine.ts`

```typescript
export function applyCascade(
  initialOps: WorldOp[],
  state: SoloGameState,
  rules: CascadeRule[]
): { applied: WorldOp[], rejected: RejectedOp[], depth: number } {

  const applied: WorldOp[] = [];
  const rejected: RejectedOp[] = [];
  let pending = [...initialOps];
  let depth = 0;

  while (pending.length > 0 && depth < MAX_CASCADE_DEPTH) {
    const newOps: WorldOp[] = [];

    for (const op of pending) {
      const policyResult = evaluatePolicy(op, state);

      if (policyResult.decision === "deny") {
        rejected.push({ op, reason: policyResult.reason });
        continue;
      }

      applyOp(op, state); // mutation atomique
      applied.push(op);

      // Verifier si cette op declenche des cascades
      for (const rule of rules) {
        if (rule.trigger(op, state)) {
          const cascaded = rule.generate(op, state);
          newOps.push(...cascaded);
        }
      }
    }

    pending = newOps;
    depth++;

    if (applied.length > MAX_OPS_PER_ACTION) break; // safety
  }

  return { applied, rejected, depth };
}
```

---

## 8. PHASE 4 — IA RESOLUTION PIPELINE V2

**Objectif:** L'IA devient interprete d'intention + narrateur, pas decideur de mutations.
**Effort:** 3-4 jours
**Dependances:** Phase 1

### Probleme actuel du prompt IA

Le prompt actuel demande a l'IA de retourner un JSON avec 25+ champs:
```json
{ "moveBy": {"dx":0,"dy":1}, "attackNearestHostile": true, "attackPower": 8,
  "buyItemName": "potion", "goldDelta": -12, ... }
```

C'est fragile car:
- L'IA doit connaitre la structure interne du jeu
- Elle fait des erreurs de coherence (acheter sans gold, attaquer hors portee)
- Ajouter un nouveau type d'action = modifier le schema + le prompt

### Pipeline V2: 2 appels IA distincts

**Appel 1: Intent Resolution** (rapide, tokens minimaux)
```
Prompt: "Le joueur dit: '{actionText}'. Contexte: {position, nearby_entities, inventory}.
Retourne JSON: { verb, target_id, params, needs_dice: bool }"

Temperature: 0.3 (deterministe)
Max tokens: 150
```

**Appel 2: Narration** (creatif, apres resolution)
```
Prompt: "Le joueur a tente '{verb}' sur '{target}'.
Resultat D20: {roll} ({interpretation}).
Operations appliquees: {applied_ops_summary}.
Operations rejetees: {rejected_ops_summary}.
Raconte ce qui s'est passe en 2-3 phrases. Style: MJ de RPG, vivant, concis."

Temperature: 0.6 (creatif)
Max tokens: 300
```

### Avantages:
- **Appel 1 est cacheable:** meme texte + meme contexte = meme intent
- **Appel 2 est parallisable:** peut commencer pendant que les ops s'appliquent
- **Fallback degrade gracieusement:** si Appel 2 echoue, on utilise un template
- **Le moteur reste deterministe:** l'IA n'a plus le pouvoir de tricher

### Fallback local ameliore

Quand Groq est down, au lieu du `resolveLocally()` minimal actuel:

```typescript
function resolveLocallyV2(draft: ActionDraft, ops: WorldOp[], roll: number): string {
  // Templates narratifs par verbe
  const templates = NARRATION_TEMPLATES[draft.verb];
  if (!templates) return `Tu tentes de ${draft.verb}. Le destin decide...`;

  const tier = rollTier(roll); // catastrophe | failure | partial | success | critical | legendary
  return templates[tier]
    .replace("{target}", draft.target?.label ?? "la cible")
    .replace("{roll}", String(roll));
}
```

Avec des templates riches par verbe:
```typescript
const NARRATION_TEMPLATES = {
  steal: {
    catastrophe: "Ta main tremblante renverse l'etalage de {target}. Tout le monde te regarde.",
    failure: "Tu t'approches de {target} mais tes doigts glissent. Rien de vole.",
    partial: "Tu attrapes quelques pieces, mais {target} a senti quelque chose.",
    success: "D'un geste discret, tu subtilises la bourse de {target}. Ni vu ni connu.",
    critical: "Le vol est parfait. {target} ne remarquera rien avant demain.",
    legendary: "Tu voles non seulement la bourse, mais aussi la ceinture de {target}. Un exploit de legende.",
  },
  // ... pour chaque verbe
};
```

---

## 9. PHASE 5 — UX SPATIALE

**Objectif:** Le monde devient l'interface principale, pas le chat.
**Effort:** 5-7 jours
**Dependances:** Phase 2, Phase 4

### Interactions directes

| Input | Action |
|-------|--------|
| Clic gauche sur tile | Deplacement (pathfinding preview avant confirmation) |
| Clic gauche sur PNJ | Selection + panel d'info |
| Clic droit sur PNJ | Menu contextuel (parler, acheter, voler, recruter...) |
| Clic droit sur batiment | Menu contextuel (entrer, ouvrir, detruire...) |
| Clic droit sur terrain | Menu contextuel (examiner, creuser, bruler...) |
| ZQSD/fleches | Mouvement orthogonal |
| E / Enter | Interagir avec l'entite la plus proche |
| Espace | Ouvrir champ texte libre (contextualize a la cible selectionnee) |
| Tab | Cycle entre entites proches |

### Menu contextuel dynamique

Le menu est genere a partir des `capabilities` de l'entite:

```typescript
function buildContextMenu(entity: WorldEntity, playerState: PlayerState): MenuItem[] {
  const items: MenuItem[] = [];

  if (entity.capabilities.includes("talk"))    items.push({ label: "Parler", verb: "talk" });
  if (entity.capabilities.includes("sell"))    items.push({ label: "Acheter", verb: "buy" });
  if (entity.capabilities.includes("buy"))     items.push({ label: "Vendre", verb: "sell" });
  if (entity.tags.includes("hostile"))         items.push({ label: "Attaquer", verb: "attack" });
  if (entity.tags.includes("container"))       items.push({ label: "Fouiller", verb: "open" });
  if (entity.tags.includes("destructible"))    items.push({ label: "Detruire", verb: "destroy" });

  // Toujours disponible
  items.push({ label: "Examiner", verb: "inspect" });
  items.push({ label: "Action libre...", verb: "free_text" });

  // Filtrer par distance
  const dist = manhattan(playerState.position, entity.position);
  return items.filter(i => i.verb === "inspect" || dist <= 2);
}
```

### Bulles de dialogue dans la scene

Au lieu de tout mettre dans le chat:
- Actions du joueur → bulle au-dessus du joueur (2s)
- Reponses PNJ → bulle au-dessus du PNJ (3s)
- Narration MJ → panel lateral droit (persistent)
- Evenements monde → carte evenement plein ecran (3.5s)

### Decomposition du GameClient

```
app/game/
├── GameClient.tsx          → Shell (layout, routing entre phases)
├── hooks/
│   ├── useGameState.ts     → State management + save/load
│   ├── useInput.ts         → Keyboard + mouse handlers
│   ├── useCanvas.ts        → Canvas rendering loop
│   ├── useNetwork.ts       → API calls + retry + timeout
│   └── useAnimations.ts    → FX, transitions, timers
├── components/
│   ├── GameHUD.tsx         → HP, gold, stress, rank bars
│   ├── NarratorPanel.tsx   → Journal du MJ (scrollable)
│   ├── ContextMenu.tsx     → Menu clic droit
│   ├── ObjectiveBar.tsx    → Objectif en 3 niveaux
│   ├── EventCard.tsx       → Carte evenement plein ecran
│   └── SpeechBubble.tsx    → Bulle de dialogue dans canvas
└── renderers/
    ├── terrainRenderer.ts  → Tiles, terrain, decors
    ├── entityRenderer.ts   → PNJ, monstres, objets
    ├── fxRenderer.ts       → Particules, flash, trails
    └── uiRenderer.ts       → Labels, halos, selection
```

---

## 10. PHASE 6 — MONDE VIVANT

**Objectif:** Le monde bouge, reagit, vit meme quand le joueur ne fait rien.
**Effort:** 4-5 jours
**Dependances:** Phase 2, Phase 3

### PNJ AI: Comportements par profil

```typescript
type BehaviorProfile = {
  type: "fixed" | "patrol" | "wander" | "schedule" | "reactive";

  // Patrol
  patrolPath?: Vec2[];
  patrolSpeed?: number;

  // Schedule (jour/nuit)
  schedule?: { dawn: Vec2, day: Vec2, dusk: Vec2, night: Vec2 };

  // Reactive
  sightRange?: number;    // cases de detection visuelle
  hearingRange?: number;  // cases de detection sonore
  aggroRange?: number;    // distance d'aggro auto
  fleeThreshold?: number; // HP% sous lequel fuir

  // Social
  dialoguePool?: string[]; // phrases ambiantes
  gossipTopics?: string[]; // sujets de conversation entre PNJ
};
```

### World Tick V2: chaque tour

```
1. Advance time counter
2. For each NPC:
   a. Execute behavior (patrol step, wander, schedule check)
   b. Check perception (joueur visible? bruit? crime?)
   c. Update mood (relation, fear, loyalty)
   d. Maybe ambient dialogue (1/10 chance)
3. For each active effect:
   a. Tick DoT/HoT
   b. Expire buffs/debuffs
4. Event Director check:
   a. Enough turns since last event?
   b. Generate contextual event (pas juste random)
   c. Apply event ops via cascade engine
5. Economy tick (shop restock, price fluctuation)
6. Quest deadline check
```

### Event Director: generation contextuelle

Au lieu de 5 events hardcodes, le director choisit en fonction du contexte:

```typescript
interface WorldEvent {
  id: string;
  label: string;
  conditions: (state: SoloGameState) => boolean;  // quand cet event peut arriver
  weight: (state: SoloGameState) => number;        // probabilite relative
  generate: (state: SoloGameState) => WorldOp[];   // mutations
  narrative: string;                                 // description pour l'IA
}

const EVENT_POOL: WorldEvent[] = [
  {
    id: "merchant_caravan",
    label: "Caravane marchande",
    conditions: s => s.turn > 10 && getShopState(s).stock < 3,
    weight: s => 10 - getShopState(s).stock,  // plus le stock est bas, plus probable
    generate: s => [
      { type: "shop_stock_delta", items: randomTradeGoods(3) },
      { type: "spawn_entity", entity: caravanGuard(s) },
    ],
    narrative: "Une caravane marchande arrive au village, chargee de marchandises exotiques.",
  },
  {
    id: "wanted_poster",
    label: "Avis de recherche",
    conditions: s => getPlayerCrimeScore(s) > 10,
    weight: s => getPlayerCrimeScore(s) / 5,
    generate: s => [
      { type: "set_bounty", target: "player", amount: getPlayerCrimeScore(s) * 5 },
      { type: "spawn_entity", entity: bountyHunter(s) },
    ],
    narrative: "Des affiches avec ton portrait apparaissent dans le village...",
  },
  // 20+ events contextuels
];
```

### Companion System

```typescript
interface CompanionState {
  actorId: string;
  recruitmentMode: "persuade" | "hire" | "oath" | "tame" | "rescue";
  order: "follow" | "guard" | "scout" | "hold" | "flee" | "attack";
  loyalty: number;     // 0-100, decroit si mal traite
  morale: number;      // 0-100, affecte par combats et repos
  trust: number;       // 0-100, augmente avec le temps
  combatStyle: "melee" | "ranged" | "support" | "tank";
}
```

Verbes dedies: `recruit`, `order`, `dismiss`, `gift` (augmenter loyalty).

---

## 11. PHASE 7 — STATS & COMBAT V2

**Objectif:** Diversite de builds, combat tactique, progression significative.
**Effort:** 3-4 jours
**Dependances:** Phase 2

### Nouveau systeme de stats

```typescript
interface EntityStats {
  // Primaires (augmentent par level up, equipement, quetes)
  force: number;      // degats physiques, capacite de destruction
  vitesse: number;    // initiative, esquive, nombre d'actions
  volonte: number;    // resistance mentale, stress, persuasion
  magie: number;      // sorts, interactions surnaturelles
  aura: number;       // charisme, intimidation, influence passive

  // Secondaires (derives des primaires + equipement + buffs)
  defense: number;    // reduction de degats = force/3 + armure
  precision: number;  // chance de toucher = vitesse/2 + arme
  esquive: number;    // chance d'eviter = vitesse/3 + agilite
  perception: number; // detection pieges/secrets = volonte/3 + aura/4
  discretion: number; // vol, infiltration = vitesse/4 + volonte/4
  chance: number;     // loot quality, events = aura/3
  initiative: number; // ordre de combat = vitesse/2 + perception/4
  charisme: number;   // prix, recrutement = aura/2 + volonte/4
  endurance: number;  // HP max bonus = force/3
  resonance: number;  // puissance magique = magie/2 + aura/4
}
```

### Combat V2: D20 + stats

```
Attaque:
  jet = D20 + precision
  seuil = 10 + esquive_cible
  si jet >= seuil:
    degats = force + arme_bonus - defense_cible
    degats = max(1, degats) // toujours au moins 1

  si roll == 20: coup critique (degats x2)
  si roll == 1: echec critique (perte d'equilibre, -1 action prochain tour)

Defense:
  si esquive > 0:
    jet_esquive = D20 + esquive
    si jet_esquive >= 15: esquive totale
```

### Integration avec le Verb Engine

Le `AttackHandler` utilise les stats:
```typescript
class AttackHandler implements VerbHandler {
  plan(draft, state, roll) {
    const attacker = getEntity(state, "player");
    const target = getEntity(state, draft.target);

    const hitRoll = roll + attacker.stats.precision;
    const threshold = 10 + target.stats.esquive;

    if (hitRoll >= threshold) {
      const baseDmg = attacker.stats.force + getWeaponBonus(attacker);
      const reduction = target.stats.defense;
      const finalDmg = Math.max(1, baseDmg - reduction);
      const isCrit = roll === 20;

      return [
        { type: "damage_actor", target: draft.target, amount: isCrit ? finalDmg * 2 : finalDmg },
        ...(isCrit ? [{ type: "set_actor_state", target: draft.target, state: "staggered" }] : []),
      ];
    } else {
      return []; // miss — narration only
    }
  }
}
```

---

## 12. PHASE 8 — PERSISTANCE

**Objectif:** Etat serveur autoritaire, sessions persistantes, ready pour multi.
**Effort:** 3-4 jours
**Dependances:** Phase 3

### Problemes actuels
- `sessionStore.ts` = Map en memoire, perdu au restart
- Session ID devinable (`solo_${Date.now()}`)
- Pas de conflict resolution client/serveur
- JSON.stringify/parse perd les types complexes

### Solution: SQLite local + migration future

```typescript
// lib/solo/persistence/store.ts
interface GameStore {
  createSession(state: SoloGameState): Promise<string>;    // returns session ID
  getSession(id: string): Promise<SoloGameState | null>;
  updateSession(id: string, state: SoloGameState): Promise<void>;

  // Event log pour replay
  appendTurnLog(sessionId: string, turn: TurnEvent): Promise<void>;
  getTurnLog(sessionId: string, fromTurn: number): Promise<TurnEvent[]>;

  // Snapshots pour rollback
  saveSnapshot(sessionId: string, state: SoloGameState): Promise<void>;
  loadSnapshot(sessionId: string, turn: number): Promise<SoloGameState | null>;
}
```

Phase 1: SQLite via `better-sqlite3` (local, zero config)
Phase 2: Migration vers PostgreSQL/Supabase pour multi

### Session ID securise
```typescript
import { randomBytes } from "crypto";
const sessionId = `solo_${randomBytes(16).toString("hex")}`;
```

### Conflict resolution
```
Client envoie: { state, lastKnownTurn }
Serveur compare: session.turn vs lastKnownTurn
  si match → apply normally
  si client behind → reject, send current state
  si server behind → impossible (server est autoritaire)
```

---

## 13. ORDRE D'EXECUTION & DEPENDANCES

```
Semaine 1:
  [Phase 0] Config Layer ──────────────────────── (1-2 jours)
     ↓
  [Phase 2] Entity Model (en parallele) ────────── (3-4 jours)

Semaine 2:
  [Phase 1] Verb Engine ───────────────────────── (3-5 jours)
     ↓
  [Phase 4] IA Pipeline v2 ────────────────────── (3-4 jours)

Semaine 3:
  [Phase 3] Cascade & Policy Engine ───────────── (4-5 jours)
  [Phase 7] Stats & Combat v2 (en parallele) ──── (3-4 jours)

Semaine 4:
  [Phase 5] UX Spatiale ──────────────────────── (5-7 jours)

Semaine 5:
  [Phase 6] Monde Vivant ─────────────────────── (4-5 jours)
  [Phase 8] Persistance (en parallele) ─────────── (3-4 jours)
```

### Dependances critiques:
```
Phase 0 → Phase 1 (config necessaire pour les verb handlers)
Phase 0 → Phase 2 (config necessaire pour les entites)
Phase 1 + Phase 2 → Phase 3 (cascade a besoin de verbes + entites)
Phase 1 → Phase 4 (IA pipeline utilise le verb engine)
Phase 2 + Phase 4 → Phase 5 (UX a besoin d'entites + pipeline)
Phase 2 + Phase 3 → Phase 6 (monde vivant a besoin de cascade)
Phase 2 → Phase 7 (stats sur les entites)
Phase 3 → Phase 8 (persistance des ops/cascades)
```

### Points de validation (gates)

Apres chaque phase, valider:
- `npx tsc --noEmit` passe
- `npm run lint` passe
- Le jeu demarre et est jouable
- Les boucles existantes (shop, combat, quete, respawn) marchent toujours
- Les tests sandbox passent avec >= couverture actuelle

**Regle d'or: a chaque commit, le jeu reste jouable.** Pas de big bang.

---

## 14. METRIQUES DE SUCCES

### V2 sera consideree reussie quand:

| Metrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Actions gerees par Verb Engine | ≥95% | Test suite de 1000 actions |
| Legacy hardcode restant | 0% | Grep pour `if.*action.*===` |
| Magic numbers dans le code | 0 | Grep pour literals numeriques hors config |
| Erreur semantique (mauvais verbe) | <2% | Test suite de 1000 actions |
| Temps de reponse moyen | <2s | Monitoring API |
| Taux d'echec IA gracieux | 100% | Toute erreur IA → fallback narratif |
| Verbes supportes | 25+ | Comptage verb registry |
| Entites interactives | 50+ | Comptage entity registry |
| PNJ avec comportement unique | 8+ | Audit behavior profiles |
| Items dans le jeu | 30+ | Comptage item catalog |
| Evenements monde distincts | 20+ | Comptage event pool |
| Decomposition frontend | 8+ modules | Comptage fichiers composants |

### Tests automatises a ajouter:

```bash
npm run test:verbs      # chaque verbe resout correctement
npm run test:cascade    # les cascades ne boucle pas, respectent les caps
npm run test:policy     # les rejets sont corrects
npm run test:entities   # toutes les entites sont valides
npm run test:narrative  # les templates couvrent tous les verbes x tiers
npm run qa:solo         # test end-to-end existant (enrichi)
```

---

## 15. RISQUES & MITIGATIONS

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Regression sur boucles existantes | Haute | Critique | Tests E2E avant/apres chaque phase. Gate de validation. |
| IA Pipeline v2 moins bonne que v1 | Moyenne | Haute | Garder le pipeline v1 en fallback pendant la transition. A/B test. |
| Verb Engine trop rigide pour actions creatives | Moyenne | Haute | Verb `free_action` catch-all qui delegue a l'IA pour tout ce qui n'est pas couvert. |
| Performance cascade (boucles infinies) | Faible | Critique | Safety caps hardcodes: depth=4, ops=24. Tests de stress. |
| Decomposition frontend casse le rendu | Moyenne | Haute | Deplacer hook par hook, pas tout d'un coup. Tester visuellement a chaque etape. |
| Complexite explose avec 25+ verbes | Moyenne | Moyenne | Chaque verbe est un fichier isole. Interface commune stricte. Pas d'heritage. |
| Groq rate limiting | Faible | Moyenne | 2 appels IA (intent + narration) au lieu de 1. Caching des intents. Fallback local riche. |

### Strategie anti-regression: le "Verb free_action"

Pour garantir que V2 n'est JAMAIS pire que V1:

```typescript
class FreeActionHandler implements VerbHandler {
  id = "free_action";
  aliases = []; // catch-all, jamais match par alias

  canHandle() { return true; } // accepte tout

  async plan(draft, state, roll) {
    // Delegue a l'IA v1 pour les cas non couverts
    const legacyOutcome = await resolveSoloAction({ ...draft, useLegacy: true });
    return convertOutcomeToOps(legacyOutcome);
  }
}
```

Ce handler est le DERNIER dans le registry. Si aucun verbe specifique ne match, `free_action` prend le relais avec le pipeline actuel. Ca garantit zero regression.

Au fur et a mesure que des verbes specifiques sont ajoutes, `free_action` est appele de moins en moins. Quand il tombe sous 5% des appels, on peut le retirer.

---

## RESUME EXECUTIF

**Oracle20 V1** est un prototype fonctionnel avec un moteur IA. Mais 32% des actions passent par du code hardcode, le GameClient est un monolithe de 2400 lignes, et le monde est statique entre les tours du joueur.

**Oracle20 V2** transforme le moteur en sandbox generalise via:
1. **Verb Engine** — chaque action est un module independant, extensible sans toucher au code existant
2. **Entity-First Model** — tout est une entite avec des capabilities, le monde se decode lui-meme
3. **Cascade Engine** — les consequences se propagent naturellement via des regles declaratives
4. **IA comme interprete** — l'IA comprend l'intention et raconte l'histoire, le moteur decide des mutations
5. **UX spatiale** — le monde est l'interface, pas le chat

La migration se fait en 8 phases sur ~5 semaines, avec une regle d'or: **le jeu reste jouable a chaque commit**. Le `free_action` handler garantit zero regression pendant la transition.

Le resultat: un MMO solo ou **toute action est possible** parce que le moteur sait interpreter n'importe quel verbe, valider n'importe quelle operation, propager n'importe quelle consequence, et narrer n'importe quel resultat.
