## Sandbox Engine Migration Plan

### Goal
Turn the current solo runtime from a `regex -> SoloOutcome flags -> imperative branches` pipeline into an entity-first sandbox engine that can resolve:

- contextual verbs beyond `talk / attack / recruit`
- possessions and equipment owned by actors and structures
- persistent world consequences
- richer interaction requests
- future server authority without rewriting the client again

### Current Reality
- UI and game loop are already world-first in [GameClient.tsx](/c:/Users/Daiki/Desktop/Rollplay/app/game/GameClient.tsx).
- Runtime resolution is still centered on [SoloOutcome](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/types.ts).
- World entities exist visually and spatially, but not yet as full simulation entities with inventory/equipment/policy.

### Migration Strategy
Keep the existing game playable during the refactor.

1. Add the new engine layer next to the old one.
2. Migrate high-value verbs first.
3. Keep `SoloOutcome` only as the UI transport layer.
4. Move more verbs from hardcoded branches to `ActionDraft -> ResolutionPlan -> WorldOp`.

### Phase 1: Entity State
Files:
- [types.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/types.ts)
- [world.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/world.ts)
- [runtime.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/runtime.ts)
- [logic.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/logic.ts)

Deliverables:
- `WorldEntityState`
- `EntityInventoryItem`
- `EquipmentSlot`
- `EntityAccessPolicy`
- persistent `entityStates` in `SoloGameState`

Rules:
- every actor must have an entity ref
- every interactable structure must have an entity ref
- bosses and key NPC must expose inventory/equipment
- old saves must hydrate missing entity states safely

### Phase 2: Semantic Action Input
Files:
- [types.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/types.ts)
- [GameClient.tsx](/c:/Users/Daiki/Desktop/Rollplay/app/game/GameClient.tsx)
- [resolve.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/resolve.ts)

Deliverables:
- richer `PlayerInteractionRequest`
- explicit `primaryTargetRef`
- optional `secondaryTargetRef`
- `desiredItemName`
- `instrumentItemId`
- `stance`
- `freeText`

Rules:
- popup interactions must stop being only “text tied to clicked target”
- text input and mouse input must converge to the same internal request model

### Phase 3: ActionDraft
Files:
- [sandbox.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/sandbox.ts)
- [resolve.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/resolve.ts)

Deliverables:
- `ActionDraft`
- verb inference
- target inference
- desired item inference
- stance inference

Rules:
- do not jump directly from text to `SoloOutcome`
- compile first, resolve second

### Phase 4: ResolutionPlan
Files:
- [sandbox.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/sandbox.ts)
- [logic.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/logic.ts)

Deliverables:
- `ResolutionPlan`
- generic `WorldOp[]`
- plan-to-outcome compatibility layer

Core ops:
- `move_path`
- `transfer_item`
- `adjust_player_gold`
- `set_shop_discount`
- `record_incident`
- `add_speech_bubble`
- `set_entity_state`

Rules:
- new verbs should prefer `WorldOp`
- old flags remain only for not-yet-migrated systems

### Phase 5: Migrate Critical Verbs
Priority order:
1. `steal`
2. `buy`
3. `sell`
4. `negotiate`
5. `loot`
6. `take`
7. `open`
8. `use`
9. `burn`
10. `destroy`

Reason:
- these verbs break the current generalization the most
- they depend directly on ownership, containment, equipment and consequences

### Phase 6: Rich Context For The Model
Files:
- [logic.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/logic.ts)
- [resolve.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/resolve.ts)

Deliverables:
- target ownership
- visible items
- equipped items
- access policy
- faction
- witnesses

Rules:
- the model must reason over real state, not invent hidden facts when avoidable

### Phase 7: Dialogue Policy
Files:
- [resolve.ts](/c:/Users/Daiki/Desktop/Rollplay/lib/solo/resolve.ts)

Deliverables:
- AI-driven targeted dialogue when model access exists
- local fallback only for resilience or major scripted exceptions
- shopkeeper and guild master can remain partially scripted where economy/quests require determinism

### Phase 8: Server Authority
Files:
- [app/api/solo/start/route.ts](/c:/Users/Daiki/Desktop/Rollplay/app/api/solo/start/route.ts)
- [app/api/solo/action/route.ts](/c:/Users/Daiki/Desktop/Rollplay/app/api/solo/action/route.ts)
- future session store module

Deliverables:
- authoritative run state
- session key
- conflict-safe save/load

Rules:
- client should stop being the final source of truth for systemic world state

### Phase 9: Sandbox Systems To Layer On Top
- witness system
- theft detection
- crime response
- faction escalation
- lock and key logic
- container states
- companion orders
- real loot from corpses and structures
- weapon visibility on actors
- procedural local consequences

### Immediate Implementation Checklist
- [x] add persistent entity states
- [x] add richer interaction request fields
- [x] add `ActionDraft`, `ResolutionPlan`, `WorldOp`
- [x] add generic world op execution
- [x] migrate `steal`, `buy`, `sell`, `negotiate`, `loot/take`
- [x] enrich action context with ownership/inventory/policy
- [x] support dynamic PNJ dialogue when model access is available
- [ ] move attack/recruit/talk fully onto the new planner
- [ ] replace permissive loot fallback with simulation-safe acquisition only
- [ ] make the server authoritative

### Compatibility Rule
During migration:
- `SoloOutcome` stays valid
- UI keeps consuming `SoloOutcome`
- new systems must be encoded in `worldOps`
- old flags are legacy compatibility, not the long-term core
