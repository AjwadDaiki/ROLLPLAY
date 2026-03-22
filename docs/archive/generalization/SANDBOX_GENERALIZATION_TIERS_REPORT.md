# Sandbox Generalization Batch Report

Generated: 2026-03-21T03:40:16.331Z
AI mode requested: no
AI runtime available (GROQ_API_KEY): no

## Summary
| Actions | Crashes | Sandbox Draft | WorldOps | Any Impact | No-Boring | Causality Trace | Legacy Only | Hybrid | Semantic Miss | Suspicious Reroute |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0 | 91 (91%) | 82 (82%) | 100 (100%) | 100 (100%) | 100 (100%) | 0 (0%) | 0 (0%) | 4 (4%) | 9 |
| 200 | 0 | 178 (89%) | 160 (80%) | 200 (100%) | 200 (100%) | 200 (100%) | 0 (0%) | 0 (0%) | 7 (4%) | 15 |
| 300 | 0 | 268 (89%) | 241 (80%) | 300 (100%) | 300 (100%) | 300 (100%) | 0 (0%) | 0 (0%) | 11 (4%) | 24 |

## Run 100 actions

Total actions tested: 100
Crashes: 0
Handled by sandbox draft: 91
Handled by sandbox world ops: 82
Handled by legacy only (no sandbox draft): 0
Handled by hybrid (sandbox draft + legacy flags): 0
Any concrete gameplay impact (worldOps OR legacy OR direct deltas): 100
Actions with interest signals (no-boring): 100
Actions with causality trace: 100
No-dead contract pass: 100
No-boring contract pass: 100
Generic fallback/no real understanding: 0
Semantic misses on supported verbs: 4
Supported actions coerced into talk: 0
Unsupported actions safely contained: 0
Suspicious reroutes: 9

## Verdict
The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About 91% of these 100 actions hit the semantic draft layer, 82% produce canonical world operations, 100% have at least one concrete gameplay impact, 100% pass no-boring, and 100% expose a causality trace. 0% are still legacy-only and 0% remain hybrid. 0% still fall back to weak generic handling, and 4% of supported requests resolve to the wrong verb or target family.

## Examples
- Sandbox: je negocie les prix -> verb=negotiate, target=structure:shop
- Legacy only: none
- Hybrid: none
- Any impact: je negocie les prix -> verb=negotiate, target=structure:shop
- Fallback: none
- Semantic miss: je brule cet arbre maintenant -> verb=destroy, target=tile:5,1
- Suspicious reroute: je fouille le villageois avec mon pouvoir -> verb=loot, target=actor:hostile_6_skeleton

## Verb Coverage
| Verb (expected) | Cases | Exact match | Semantic miss | Sandbox draft | WorldOps | Legacy only | Hybrid | Any impact |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| burn | 4 | 0 | 4 | 4 | 4 | 0 | 0 | 4 |
| attack | 4 | 4 | 0 | 4 | 4 | 0 | 0 | 4 |
| block | 3 | 0 | 0 | 1 | 1 | 0 | 0 | 3 |
| bribe | 4 | 0 | 0 | 4 | 4 | 0 | 0 | 4 |
| buy | 7 | 7 | 0 | 7 | 7 | 0 | 0 | 7 |
| disarm | 3 | 0 | 0 | 3 | 3 | 0 | 0 | 3 |
| handcuff | 3 | 0 | 0 | 1 | 1 | 0 | 0 | 3 |
| kiss | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| loot | 8 | 8 | 0 | 8 | 4 | 0 | 0 | 8 |
| negotiate | 7 | 7 | 0 | 7 | 7 | 0 | 0 | 7 |
| pray | 3 | 0 | 0 | 1 | 1 | 0 | 0 | 3 |
| sell | 4 | 4 | 0 | 4 | 4 | 0 | 0 | 4 |
| steal | 18 | 18 | 0 | 18 | 16 | 0 | 0 | 18 |
| take | 11 | 11 | 0 | 11 | 8 | 0 | 0 | 11 |
| talk | 15 | 15 | 0 | 15 | 15 | 0 | 0 | 15 |
| trap | 3 | 0 | 0 | 3 | 3 | 0 | 0 | 3 |

## Top Remaining Limits
- `steal / buy / sell / negotiate / loot / take` are now materially generalized.
- `attack / talk / recruit` now execute through canonical `WorldOps`; remaining legacy-only traffic mainly comes from unsupported verbs.
- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.
- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.
- Server authority exists only in memory for now; it is better than before but not final.

## Error Samples

Coverage notes: worldOps=82%, impactAny=100%, noDead=100%, noBoring=100%, legacyOnly=0%, hybrid=0%.

## Run 200 actions

Total actions tested: 200
Crashes: 0
Handled by sandbox draft: 178
Handled by sandbox world ops: 160
Handled by legacy only (no sandbox draft): 0
Handled by hybrid (sandbox draft + legacy flags): 0
Any concrete gameplay impact (worldOps OR legacy OR direct deltas): 200
Actions with interest signals (no-boring): 200
Actions with causality trace: 200
No-dead contract pass: 200
No-boring contract pass: 200
Generic fallback/no real understanding: 0
Semantic misses on supported verbs: 7
Supported actions coerced into talk: 0
Unsupported actions safely contained: 0
Suspicious reroutes: 15

## Verdict
The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About 89% of these 200 actions hit the semantic draft layer, 80% produce canonical world operations, 100% have at least one concrete gameplay impact, 100% pass no-boring, and 100% expose a causality trace. 0% are still legacy-only and 0% remain hybrid. 0% still fall back to weak generic handling, and 4% of supported requests resolve to the wrong verb or target family.

## Examples
- Sandbox: je negocie les prix -> verb=negotiate, target=structure:shop
- Legacy only: none
- Hybrid: none
- Any impact: je negocie les prix -> verb=negotiate, target=structure:shop
- Fallback: none
- Semantic miss: je brule cet arbre maintenant -> verb=destroy, target=tile:5,1
- Suspicious reroute: je fouille le villageois avec mon pouvoir -> verb=loot, target=actor:hostile_6_skeleton

## Verb Coverage
| Verb (expected) | Cases | Exact match | Semantic miss | Sandbox draft | WorldOps | Legacy only | Hybrid | Any impact |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| burn | 7 | 0 | 7 | 7 | 7 | 0 | 0 | 7 |
| attack | 7 | 7 | 0 | 7 | 7 | 0 | 0 | 7 |
| block | 7 | 0 | 0 | 1 | 1 | 0 | 0 | 7 |
| bribe | 7 | 0 | 0 | 7 | 7 | 0 | 0 | 7 |
| buy | 15 | 15 | 0 | 15 | 15 | 0 | 0 | 15 |
| disarm | 7 | 0 | 0 | 7 | 7 | 0 | 0 | 7 |
| handcuff | 7 | 0 | 0 | 2 | 2 | 0 | 0 | 7 |
| kiss | 7 | 0 | 0 | 1 | 1 | 0 | 0 | 7 |
| loot | 14 | 14 | 0 | 14 | 7 | 0 | 0 | 14 |
| negotiate | 15 | 15 | 0 | 15 | 15 | 0 | 0 | 15 |
| pray | 7 | 0 | 0 | 2 | 2 | 0 | 0 | 7 |
| sell | 8 | 8 | 0 | 8 | 8 | 0 | 0 | 8 |
| steal | 36 | 36 | 0 | 36 | 31 | 0 | 0 | 36 |
| take | 21 | 21 | 0 | 21 | 15 | 0 | 0 | 21 |
| talk | 28 | 28 | 0 | 28 | 28 | 0 | 0 | 28 |
| trap | 7 | 0 | 0 | 7 | 7 | 0 | 0 | 7 |

## Top Remaining Limits
- `steal / buy / sell / negotiate / loot / take` are now materially generalized.
- `attack / talk / recruit` now execute through canonical `WorldOps`; remaining legacy-only traffic mainly comes from unsupported verbs.
- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.
- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.
- Server authority exists only in memory for now; it is better than before but not final.

## Error Samples

Coverage notes: worldOps=80%, impactAny=100%, noDead=100%, noBoring=100%, legacyOnly=0%, hybrid=0%.

## Run 300 actions

Total actions tested: 300
Crashes: 0
Handled by sandbox draft: 268
Handled by sandbox world ops: 241
Handled by legacy only (no sandbox draft): 0
Handled by hybrid (sandbox draft + legacy flags): 0
Any concrete gameplay impact (worldOps OR legacy OR direct deltas): 300
Actions with interest signals (no-boring): 300
Actions with causality trace: 300
No-dead contract pass: 300
No-boring contract pass: 300
Generic fallback/no real understanding: 0
Semantic misses on supported verbs: 11
Supported actions coerced into talk: 0
Unsupported actions safely contained: 0
Suspicious reroutes: 24

## Verdict
The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About 89% of these 300 actions hit the semantic draft layer, 80% produce canonical world operations, 100% have at least one concrete gameplay impact, 100% pass no-boring, and 100% expose a causality trace. 0% are still legacy-only and 0% remain hybrid. 0% still fall back to weak generic handling, and 4% of supported requests resolve to the wrong verb or target family.

## Examples
- Sandbox: je negocie les prix -> verb=negotiate, target=structure:shop
- Legacy only: none
- Hybrid: none
- Any impact: je negocie les prix -> verb=negotiate, target=structure:shop
- Fallback: none
- Semantic miss: je brule cet arbre maintenant -> verb=destroy, target=tile:5,1
- Suspicious reroute: je fouille le villageois avec mon pouvoir -> verb=loot, target=actor:hostile_6_skeleton

## Verb Coverage
| Verb (expected) | Cases | Exact match | Semantic miss | Sandbox draft | WorldOps | Legacy only | Hybrid | Any impact |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| burn | 11 | 0 | 11 | 11 | 11 | 0 | 0 | 11 |
| attack | 11 | 11 | 0 | 11 | 11 | 0 | 0 | 11 |
| block | 11 | 0 | 0 | 2 | 2 | 0 | 0 | 11 |
| bribe | 11 | 0 | 0 | 11 | 11 | 0 | 0 | 11 |
| buy | 21 | 21 | 0 | 21 | 21 | 0 | 0 | 21 |
| disarm | 11 | 0 | 0 | 11 | 11 | 0 | 0 | 11 |
| handcuff | 11 | 0 | 0 | 2 | 2 | 0 | 0 | 11 |
| kiss | 10 | 0 | 0 | 2 | 2 | 0 | 0 | 10 |
| loot | 22 | 22 | 0 | 22 | 11 | 0 | 0 | 22 |
| negotiate | 21 | 21 | 0 | 21 | 21 | 0 | 0 | 21 |
| pray | 10 | 0 | 0 | 4 | 4 | 0 | 0 | 10 |
| sell | 11 | 11 | 0 | 11 | 11 | 0 | 0 | 11 |
| steal | 53 | 53 | 0 | 53 | 45 | 0 | 0 | 53 |
| take | 32 | 32 | 0 | 32 | 24 | 0 | 0 | 32 |
| talk | 43 | 43 | 0 | 43 | 43 | 0 | 0 | 43 |
| trap | 11 | 0 | 0 | 11 | 11 | 0 | 0 | 11 |

## Top Remaining Limits
- `steal / buy / sell / negotiate / loot / take` are now materially generalized.
- `attack / talk / recruit` now execute through canonical `WorldOps`; remaining legacy-only traffic mainly comes from unsupported verbs.
- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.
- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.
- Server authority exists only in memory for now; it is better than before but not final.

## Error Samples

Coverage notes: worldOps=80%, impactAny=100%, noDead=100%, noBoring=100%, legacyOnly=0%, hybrid=0%.
