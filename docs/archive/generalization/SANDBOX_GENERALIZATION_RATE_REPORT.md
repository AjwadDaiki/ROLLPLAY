# Sandbox Generalization Rate Report

Generated: 2026-03-20
Scope: 5 fuzz runs x 1000 actions = 5000 actions

## Method

Primary metric (strict):
- `Generalization Rate (strict)` = supported actions that are:
  - semantically correct (`semanticMiss = false`)
  - meaningful (`meaningfulImpact = true`)
  - not misrouted (`misroute = false`)
  - not illusion (`category != illusion`)
- divided by total supported actions.

Secondary metrics:
- `Supported meaningful rate` = supported actions with real world impact.
- `WorldOps coverage` = actions that emitted `worldOps`.
- `Meaningful impact rate` = all actions (supported + unsupported) with real world impact.
- `Unsupported contained rate` = unsupported actions safely contained (no fake success).

## Aggregate Results

- Total actions: `5000`
- Supported actions: `3113`
- Unsupported actions: `1887`
- Generalization Rate (strict): `99.71%`
- Supported meaningful rate: `100.00%`
- Semantic miss rate (supported): `0.29%`
- WorldOps coverage: `58.58%`
- Meaningful impact rate (global): `70.06%`
- Unsupported with impact: `20.67%`
- Unsupported contained: `79.33%`
- Misroute count: `0`
- No-impact count: `0`
- Illusion count: `0`

## Per Seed

| Seed | Supported | Strict Generalization | Semantic Miss (supported) | WorldOps Coverage | Global Meaningful Impact |
| --- | ---: | ---: | ---: | ---: | ---: |
| 4242 | 617 | 100.00% | 0.00% | 60.30% | 69.40% |
| 1337 | 643 | 100.00% | 0.00% | 59.50% | 71.10% |
| 2026 | 604 | 99.50% | 0.50% | 55.50% | 68.20% |
| 9001 | 622 | 99.36% | 0.64% | 58.10% | 69.00% |
| 7777 | 627 | 99.68% | 0.32% | 59.50% | 72.60% |

## Source Artifacts

- `docs/SANDBOX_WTF_FUZZ_RESULTS_1000_seed4242.json`
- `docs/SANDBOX_WTF_FUZZ_RESULTS_1000_seed1337.json`
- `docs/SANDBOX_WTF_FUZZ_RESULTS_1000_seed2026.json`
- `docs/SANDBOX_WTF_FUZZ_RESULTS_1000_seed9001.json`
- `docs/SANDBOX_WTF_FUZZ_RESULTS_1000_seed7777.json`
