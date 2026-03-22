# Sandbox Generalization Batch Report

Generated: 2026-03-20T17:34:01.071Z
AI mode requested: yes
AI runtime available (GROQ_API_KEY): no

## Summary
| Actions | Crashes | Sandbox Draft | WorldOps | Legacy Only | Semantic Miss | Suspicious Reroute |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0 | 86 (86%) | 33 (33%) | 21 (21%) | 4 (4%) | 0 |
| 200 | 0 | 167 (84%) | 67 (34%) | 38 (19%) | 7 (4%) | 0 |
| 300 | 0 | 248 (83%) | 100 (33%) | 61 (20%) | 11 (4%) | 0 |

## Run 100 actions

Total actions tested: 100
Crashes: 0
Handled by sandbox draft: 86
Handled by sandbox world ops: 33
Handled only by legacy pipeline: 21
Generic fallback/no real understanding: 0
Semantic misses on supported verbs: 4
Supported actions coerced into talk: 0
Unsupported actions safely contained: 14
Suspicious reroutes: 0

## Verdict
The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About 86% of these 100 actions hit the new semantic draft layer, 33% produce real generic world operations, 0% fall back to weak generic handling, and 4% of supported requests still resolve to the wrong verb or the wrong target family.

## Examples
- Sandbox: je negocie les prix -> verb=negotiate, target=structure:shop
- Legacy: je desarme le roi demon si possible -> verb=talk, target=actor:hostile_7_lord
- Fallback: none
- Semantic miss: je brule cet arbre maintenant -> verb=destroy, target=tile:5,1
- Suspicious reroute: none

## Top Remaining Limits
- `steal / buy / sell / negotiate / loot / take` are now materially generalized.
- `attack / talk / recruit` still lean heavily on the legacy resolver and old `SoloOutcome` flags.
- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.
- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.
- Server authority exists only in memory for now; it is better than before but not final.

## Error Samples

## Run 200 actions

Total actions tested: 200
Crashes: 0
Handled by sandbox draft: 167
Handled by sandbox world ops: 67
Handled only by legacy pipeline: 38
Generic fallback/no real understanding: 0
Semantic misses on supported verbs: 7
Supported actions coerced into talk: 0
Unsupported actions safely contained: 33
Suspicious reroutes: 0

## Verdict
The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About 84% of these 200 actions hit the new semantic draft layer, 34% produce real generic world operations, 0% fall back to weak generic handling, and 4% of supported requests still resolve to the wrong verb or the wrong target family.

## Examples
- Sandbox: je negocie les prix -> verb=negotiate, target=structure:shop
- Legacy: je desarme le roi demon si possible -> verb=talk, target=actor:hostile_7_lord
- Fallback: none
- Semantic miss: je brule cet arbre maintenant -> verb=destroy, target=tile:5,1
- Suspicious reroute: none

## Top Remaining Limits
- `steal / buy / sell / negotiate / loot / take` are now materially generalized.
- `attack / talk / recruit` still lean heavily on the legacy resolver and old `SoloOutcome` flags.
- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.
- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.
- Server authority exists only in memory for now; it is better than before but not final.

## Error Samples

## Run 300 actions

Total actions tested: 300
Crashes: 0
Handled by sandbox draft: 248
Handled by sandbox world ops: 100
Handled only by legacy pipeline: 61
Generic fallback/no real understanding: 0
Semantic misses on supported verbs: 11
Supported actions coerced into talk: 0
Unsupported actions safely contained: 52
Suspicious reroutes: 0

## Verdict
The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About 83% of these 300 actions hit the new semantic draft layer, 33% produce real generic world operations, 0% fall back to weak generic handling, and 4% of supported requests still resolve to the wrong verb or the wrong target family.

## Examples
- Sandbox: je negocie les prix -> verb=negotiate, target=structure:shop
- Legacy: je desarme le roi demon si possible -> verb=talk, target=actor:hostile_7_lord
- Fallback: none
- Semantic miss: je brule cet arbre maintenant -> verb=destroy, target=tile:5,1
- Suspicious reroute: none

## Top Remaining Limits
- `steal / buy / sell / negotiate / loot / take` are now materially generalized.
- `attack / talk / recruit` still lean heavily on the legacy resolver and old `SoloOutcome` flags.
- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.
- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.
- Server authority exists only in memory for now; it is better than before but not final.

## Error Samples
