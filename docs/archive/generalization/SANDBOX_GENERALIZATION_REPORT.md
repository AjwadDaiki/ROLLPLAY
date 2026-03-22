# Sandbox Generalization Report

Generated: 2026-03-21T03:40:22.246Z
AI mode requested: no
AI runtime available (GROQ_API_KEY): no

## Run

Total actions tested: 1000
Crashes: 0
Handled by sandbox draft: 893
Handled by sandbox world ops: 801
Handled by legacy only (no sandbox draft): 0
Handled by hybrid (sandbox draft + legacy flags): 0
Any concrete gameplay impact (worldOps OR legacy OR direct deltas): 1000
Actions with interest signals (no-boring): 1000
Actions with causality trace: 1000
No-dead contract pass: 1000
No-boring contract pass: 1000
Generic fallback/no real understanding: 0
Semantic misses on supported verbs: 36
Supported actions coerced into talk: 0
Unsupported actions safely contained: 0
Suspicious reroutes: 79

## Verdict
The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About 89% of these 1000 actions hit the semantic draft layer, 80% produce canonical world operations, 100% have at least one concrete gameplay impact, 100% pass no-boring, and 100% expose a causality trace. 0% are still legacy-only and 0% remain hybrid. 0% still fall back to weak generic handling, and 4% of supported requests resolve to the wrong verb or target family.

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
| burn | 36 | 0 | 36 | 36 | 36 | 0 | 0 | 36 |
| attack | 36 | 36 | 0 | 36 | 36 | 0 | 0 | 36 |
| block | 36 | 0 | 0 | 7 | 7 | 0 | 0 | 36 |
| bribe | 36 | 0 | 0 | 36 | 36 | 0 | 0 | 36 |
| buy | 71 | 71 | 0 | 71 | 71 | 0 | 0 | 71 |
| disarm | 36 | 0 | 0 | 36 | 36 | 0 | 0 | 36 |
| handcuff | 36 | 0 | 0 | 7 | 7 | 0 | 0 | 36 |
| kiss | 35 | 0 | 0 | 7 | 7 | 0 | 0 | 35 |
| loot | 72 | 72 | 0 | 72 | 36 | 0 | 0 | 72 |
| negotiate | 71 | 71 | 0 | 71 | 71 | 0 | 0 | 71 |
| pray | 35 | 0 | 0 | 14 | 14 | 0 | 0 | 35 |
| sell | 36 | 36 | 0 | 36 | 36 | 0 | 0 | 36 |
| steal | 178 | 178 | 0 | 178 | 150 | 0 | 0 | 178 |
| take | 107 | 107 | 0 | 107 | 79 | 0 | 0 | 107 |
| talk | 143 | 143 | 0 | 143 | 143 | 0 | 0 | 143 |
| trap | 36 | 0 | 0 | 36 | 36 | 0 | 0 | 36 |

## Top Remaining Limits
- `steal / buy / sell / negotiate / loot / take` are now materially generalized.
- `attack / talk / recruit` now execute through canonical `WorldOps`; remaining legacy-only traffic mainly comes from unsupported verbs.
- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.
- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.
- Server authority exists only in memory for now; it is better than before but not final.

## Error Samples

Coverage notes: worldOps=80%, impactAny=100%, noDead=100%, noBoring=100%, legacyOnly=0%, hybrid=0%.
