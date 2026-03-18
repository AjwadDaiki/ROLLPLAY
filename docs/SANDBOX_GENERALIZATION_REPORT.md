# Sandbox Generalization Report

Generated: 2026-03-18T13:30:37.725Z

Total actions tested: 1000
Crashes: 0
Handled by sandbox draft: 286
Handled by sandbox world ops: 215
Handled only by legacy pipeline: 322
Generic fallback/no real understanding: 0
Semantic misses on supported verbs: 107
Supported actions coerced into talk: 71
Unsupported actions safely contained: 320
Suspicious reroutes: 141

## Verdict
The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About 29% of these 1000 actions hit the new semantic draft layer, 22% produce real generic world operations, 0% fall back to weak generic handling, and 11% of supported requests still resolve to the wrong verb or the wrong target family.

## Examples
- Sandbox: je negocie les prix -> verb=negotiate, target=structure:shop
- Legacy: je parle au garde calmement -> verb=talk, target=actor:npc_guard_road
- Fallback: none
- Semantic miss: je fouille le villageois avec mon pouvoir -> verb=talk, target=actor:npc_villager_square_a
- Suspicious reroute: je vole l epee du demon de force -> verb=steal, target=actor:hostile_4_demon

## Top Remaining Limits
- `steal / buy / sell / negotiate / loot / take` are now materially generalized.
- `attack / talk / recruit` still lean heavily on the legacy resolver and old `SoloOutcome` flags.
- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.
- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.
- Server authority exists only in memory for now; it is better than before but not final.

## Error Samples
