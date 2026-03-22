# Sandbox WTF Fuzz Report

Generated: 2026-03-20T22:35:04.447Z
Cases: 1000
Seed: 9001

## Summary
- WorldOps coverage: 581/1000 (58%)
- Meaningful impact: 690/1000 (69%)
- Semantic miss (supported cases): 4/622 (1%)
- Categories: ok=690, contained=310, no_impact=0, misroute=0, illusion=0

## Critical Findings
- none

## DA Generalization Ideas (From Contained Cases)
| Theme | Count | Generic Ops Candidate | Example |
| --- | ---: | --- | --- |
| Controle / entrave d entites | 53 | apply_status + disarm + restraint_duration + witness_incident | je desarme le marchand avec une plume avec style |
| Magie de realite / impossible | 52 | high_cost_spell_policy + bounded_world_rewrite + catastrophe_branch | je clone mon personnage tres lentement en mode legendaire |
| Pieges et obstacles deployables | 45 | spawn_prop + collision_policy + trigger_effect + cleanup | je pose un piege laser dans la ruine avec une banane |
| Autres actions absurde/non modelees | 44 | introduce_generic_policy + explicit_reject_delta | je vole la lune |
| Actions multi-cibles | 34 | query_targets + batch_plan + capped_event_budget | je marie le marchand et le garde avec style en mode legendaire |
| Construction / transformation lourde | 32 | craft_recipe_graph + place_structure + material_budget + nav_rebuild | je reconstruis la ruine en palais en chantant |
| Manipulation physique lourde | 31 | carry_mode(drag/lift) + mass_check + occupancy_update + drop_op | je deplace cet arbre jusqu au donjon sans faire de bruit |
| Coercition sociale | 19 | social_contest + bribe_transfer + relation_delta + legal_incident | je taxe tous les villageois d un coup sans faire de bruit |

## Resolved Verb Distribution
| Verb | Count |
| --- | ---: |
| none | 310 |
| destroy | 80 |
| recruit | 79 |
| talk | 77 |
| steal | 71 |
| perform | 59 |
| move | 55 |
| attack | 36 |
| dig | 33 |
| sell | 28 |
| give | 24 |
| negotiate | 22 |
| take | 22 |
| loot | 21 |
| rest | 17 |
| buy | 16 |
| craft | 15 |
| hide | 15 |
| use | 13 |
| cast | 7 |

## Sample Results
| id | action | ctx | expected | resolved | impact | category |
| --- | --- | --- | --- | --- | ---: | --- |
| fuzz_0001 | je coupe cet arbre en planches avec une banane avec une banane | tree_tile | destroy | destroy | yes | ok |
| fuzz_0002 | je vole la bourse du marchand a mains nues en plein chaos | shop_actor | steal | steal | yes | ok |
| fuzz_0003 | je parle au roi demon en plein chaos | boss_actor | talk | talk | yes | ok |
| fuzz_0004 | je parle au chat avec une banane avec une banane | cat_actor | talk | talk | yes | ok |
| fuzz_0005 | je deplace cet arbre jusqu au donjon sans faire de bruit | tree_tile | none | none | no | contained |
| fuzz_0006 | je desactive l aura du roi demon avec ma pensee en plein chaos | boss_actor | none | use | yes | ok |
| fuzz_0007 | je recrute le roi demon comme un ninja | boss_actor | recruit | recruit | yes | ok |
| fuzz_0008 | je vole la bourse du marchand comme un ninja en chantant | shop_actor | steal | steal | yes | ok |
| fuzz_0009 | je vole la lance du garde en panique | guard_actor | steal | steal | yes | ok |
| fuzz_0010 | je menotte le roi demon | boss_actor | none | none | yes | ok |
| fuzz_0011 | je me repose avec une banane en moonwalk | free | rest | perform | yes | ok |
| fuzz_0012 | je pose un piege laser devant la boutique en mode legendaire en moonwalk | shop_structure | none | perform | yes | ok |
| fuzz_0013 | j achete potion de soin avec style | shop_structure | buy | buy | yes | ok |
| fuzz_0014 | je menotte le roi demon en moonwalk | boss_actor | none | perform | yes | ok |
| fuzz_0015 | je negocie 35 pourcent de remise avec style | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0016 | je recrute le garde avec une banane | guard_actor | recruit | recruit | yes | ok |
| fuzz_0017 | je vole la lance du garde tres lentement en mode legendaire | guard_actor | steal | steal | yes | ok |
| fuzz_0018 | je negocie 35 pourcent de remise a mains nues tres lentement | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0019 | je reconstruis la ruine en palais en chantant | ruin_tile | none | none | no | contained |
| fuzz_0020 | je pose un piege laser dans la ruine avec une banane | ruin_tile | none | none | no | contained |
| fuzz_0021 | je taxe tous les villageois d un coup sans faire de bruit | free | none | none | no | contained |
| fuzz_0022 | je porte cet arbre sur mon dos en panique | tree_tile | none | none | no | contained |
| fuzz_0023 | je fouille la ruine et je prends tout en panique | ruin_tile | loot | loot | yes | ok |
| fuzz_0024 | j attaque le garde avec une banane | guard_actor | attack | attack | yes | ok |
| fuzz_0025 | je vole la bourse du marchand en chantant comme un ninja | shop_actor | steal | steal | yes | ok |
| fuzz_0026 | je desarme le marchand avec une plume avec style | shop_actor | none | none | no | contained |
| fuzz_0027 | je deplace cet arbre jusqu au donjon avec style | tree_tile | none | none | no | contained |
| fuzz_0028 | je vais a la guilde a mains nues | free | move | move | yes | ok |
| fuzz_0029 | je vais a la boutique en plein chaos | free | move | move | yes | ok |
| fuzz_0030 | je recrute le garde avec style | guard_actor | recruit | recruit | yes | ok |
| fuzz_0031 | je vole la lune | free | none | steal | no | contained |
| fuzz_0032 | je marie le marchand et le garde avec style en mode legendaire | shop_actor | none | none | no | contained |
| fuzz_0033 | je vole la bourse du marchand tres lentement | shop_actor | steal | steal | yes | ok |
| fuzz_0034 | je vais a la boutique | free | move | move | yes | ok |
| fuzz_0035 | je clone mon personnage tres lentement en mode legendaire | free | none | none | no | contained |
| fuzz_0036 | je vole la lune a mains nues | free | none | steal | no | contained |
| fuzz_0037 | je desactive l aura du roi demon avec ma pensee en panique | boss_actor | none | use | yes | ok |
| fuzz_0038 | je prends du bois de cet arbre en mode legendaire | tree_tile | take | take | yes | ok |
| fuzz_0039 | je vais a la boutique en panique sans faire de bruit | free | move | move | yes | ok |
| fuzz_0040 | j attaque le garde a mains nues | guard_actor | attack | attack | yes | ok |
| fuzz_0041 | je desarme le marchand avec une plume comme un ninja | shop_actor | none | none | no | contained |
| fuzz_0042 | je grave un message sur la ruine comme un ninja tres lentement | ruin_tile | perform | perform | yes | ok |
| fuzz_0043 | je donne 5 or au marchand avec style | shop_actor | give | give | yes | ok |
| fuzz_0044 | je desarme le marchand avec une plume en plein chaos a mains nues | shop_actor | none | none | no | contained |
| fuzz_0045 | je vais a la guilde en panique | free | move | move | yes | ok |
| fuzz_0046 | je bloque la boutique avec un sofa geant en chantant en moonwalk | shop_structure | none | perform | yes | ok |
| fuzz_0047 | je porte cet arbre sur mon dos en chantant sans faire de bruit | tree_tile | none | none | no | contained |
| fuzz_0048 | je brule la route avec style | free | destroy | destroy | yes | ok |
| fuzz_0049 | je transforme cet arbre en epee geante a mains nues | tree_tile | none | none | no | contained |
| fuzz_0050 | je menotte le marchand en panique | shop_actor | none | none | no | contained |
| fuzz_0051 | je negocie 35 pourcent de remise en moonwalk | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0052 | je pose un piege laser dans la ruine a mains nues en chantant | ruin_tile | none | none | no | contained |
| fuzz_0053 | je menotte le roi demon comme un ninja | boss_actor | none | none | yes | ok |
| fuzz_0054 | je reconstruis la ruine en palais avec une banane | ruin_tile | none | none | no | contained |
| fuzz_0055 | je donne 5 or au marchand en moonwalk avec style | shop_actor | give | give | yes | ok |
| fuzz_0056 | je vends la terre compacte au marchand | shop_structure | sell | sell | yes | ok |
| fuzz_0057 | je vais a la guilde en panique | free | move | move | yes | ok |
| fuzz_0058 | je negocie 35 pourcent de remise avec style en chantant | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0059 | je recrute ce chat a mains nues en mode legendaire | cat_actor | recruit | recruit | yes | ok |
| fuzz_0060 | je transforme cet arbre en epee geante en plein chaos | tree_tile | none | none | no | contained |
| fuzz_0061 | je bloque la boutique avec un sofa geant avec une banane en plein chaos | shop_structure | none | none | no | contained |
| fuzz_0062 | je parle au roi demon avec style | boss_actor | talk | talk | yes | ok |
| fuzz_0063 | je prends du bois de cet arbre en mode legendaire | tree_tile | take | take | yes | ok |
| fuzz_0064 | je vole la bourse du marchand en panique tres lentement | shop_actor | steal | steal | yes | ok |
| fuzz_0065 | je vais a la boutique en moonwalk tres lentement | free | move | move | yes | ok |
| fuzz_0066 | je reconstruis la ruine en palais en panique | ruin_tile | none | none | no | contained |
| fuzz_0067 | je marie le marchand et le garde avec une banane | shop_actor | none | none | no | contained |
| fuzz_0068 | je vole la bourse du marchand | shop_actor | steal | steal | yes | ok |
| fuzz_0069 | je desarme le marchand avec une plume avec une banane | shop_actor | none | none | no | contained |
| fuzz_0070 | je prends du bois de cet arbre tres lentement | tree_tile | take | take | yes | ok |
| fuzz_0071 | je fouille la ruine et je prends tout comme un ninja | ruin_tile | loot | loot | yes | ok |
| fuzz_0072 | je me repose en mode legendaire | free | rest | rest | yes | ok |
| fuzz_0073 | j attaque le roi demon en moonwalk | boss_actor | attack | attack | yes | ok |
| fuzz_0074 | je detone la boutique en panique | shop_structure | none | none | no | contained |
| fuzz_0075 | je craft une potion en mode legendaire | free | craft | craft | yes | ok |
| fuzz_0076 | je recrute le marchand tres lentement | shop_actor | recruit | recruit | yes | ok |
| fuzz_0077 | je recrute ce chat avec style | cat_actor | recruit | recruit | yes | ok |
| fuzz_0078 | je reconstruis la ruine en palais en moonwalk avec style | ruin_tile | none | perform | yes | ok |
| fuzz_0079 | je recrute ce chat avec une banane | cat_actor | recruit | recruit | yes | ok |
| fuzz_0080 | je reconstruis la ruine en palais avec style avec une banane | ruin_tile | none | none | no | contained |

## Next Focus
- Keep current target/misroute robustness: already stable on this run.
- Convert highest-volume contained themes into canonical verbs (not regex patches).
- For each new verb family, require `ActionDraft -> WorldOps -> visible delta -> persistence` contract before shipping.
- Re-run this fuzz with multiple seeds each sprint and block regressions in CI.

