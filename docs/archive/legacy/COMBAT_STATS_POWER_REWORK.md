# Combat + Stats/Power Rework (Hybrid JRPG)

## Scope

This rework separates two layers:

- `combat system`: turn resolution, action categories, rolls, battle state lifecycle
- `capability system`: stats + initial power profile used by combat and non-combat verbs

Core files:

- `lib/solo/capabilities.ts`
- `lib/solo/combatEngine.ts`
- `lib/solo/verbs/index.ts`
- `lib/solo/logic.ts`
- `app/game/GameClient.tsx`
- `app/game/components/CombatOverlay.tsx`

## Key Decisions

1. Single combat pipeline in the verb engine  
`tryBuildHybridCombatPlan(...)` remains the combat entry point and now outputs:
- `combatResolution`
- `nextCombatState`
- canonical `WorldOp[]` for concrete world impact

2. Stats/power are global and persistent  
`powerText/powerRoll/powerAccepted` are interpreted by `capabilities.ts` and applied as persistent stat modifiers.

3. No “text-only” combat outcomes  
Combat plans emit real ops (`damage_actor`, `adjust_player_hp`, `set_actor_hostility`, `set_combat_state`) and UI consumes `combatResolution`.

## New/Extended Data Contracts

- `PlayerState` includes:
  - `agility`, `intelligence`, `persuasion`, `intimidation`
- `SoloGameState` includes:
  - `combatState`
- `SoloOutcome` includes:
  - `combatResolution`
  - `nextCombatState`
- `WorldOp` includes:
  - `damage_actor`
  - `set_actor_hostility`
  - `set_combat_state`

## Runtime Wiring

- `lib/solo/verbs/helpers.ts` now computes effective stats using power-adjusted base stats.
- `lib/solo/logic.ts`:
  - applies new world ops
  - syncs derived player stats each turn
  - tracks combat effects in action history
- `app/game/GameClient.tsx`:
  - prefers `outcome.combatResolution` to drive battle overlay
  - falls back to legacy attack FX when needed

## UX

- Combat overlay now includes a dedicated `Defendre` action button.
- Stats panel shows new derived gameplay stats:
  - Agility, Intelligence, Persuasion, Intimidation

## Validation

- `npx tsc --noEmit`: pass
- `npm run lint`: pass (warnings only, existing baseline)
