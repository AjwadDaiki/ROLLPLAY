# Sandbox WTF Fuzz Report

Generated: 2026-03-20T22:35:04.290Z
Cases: 1000
Seed: 7777

## Summary
- WorldOps coverage: 595/1000 (60%)
- Meaningful impact: 726/1000 (73%)
- Semantic miss (supported cases): 2/627 (0%)
- Categories: ok=726, contained=274, no_impact=0, misroute=0, illusion=0

## Critical Findings
- none

## DA Generalization Ideas (From Contained Cases)
| Theme | Count | Generic Ops Candidate | Example |
| --- | ---: | --- | --- |
| Controle / entrave d entites | 64 | apply_status + disarm + restraint_duration + witness_incident | je desarme le garde avec une banane comme un ninja |
| Magie de realite / impossible | 43 | high_cost_spell_policy + bounded_world_rewrite + catastrophe_branch | je transforme le village en bateau volant a mains nues |
| Autres actions absurde/non modelees | 43 | introduce_generic_policy + explicit_reject_delta | je vole la lune tres lentement en chantant |
| Pieges et obstacles deployables | 35 | spawn_prop + collision_policy + trigger_effect + cleanup | je pose un piege laser devant la boutique sans faire de bruit avec style |
| Manipulation physique lourde | 32 | carry_mode(drag/lift) + mass_check + occupancy_update + drop_op | je deplace cet arbre jusqu au donjon a mains nues |
| Construction / transformation lourde | 22 | craft_recipe_graph + place_structure + material_budget + nav_rebuild | je reconstruis la ruine en palais en plein chaos avec une banane |
| Coercition sociale | 19 | social_contest + bribe_transfer + relation_delta + legal_incident | je soudoye le garde avec 1 or en panique en panique |
| Actions multi-cibles | 16 | query_targets + batch_plan + capped_event_budget | je marie le marchand et le garde avec une banane |

## Resolved Verb Distribution
| Verb | Count |
| --- | ---: |
| none | 289 |
| destroy | 83 |
| perform | 79 |
| steal | 76 |
| recruit | 74 |
| talk | 73 |
| move | 50 |
| attack | 43 |
| dig | 35 |
| sell | 31 |
| buy | 25 |
| loot | 24 |
| hide | 19 |
| use | 17 |
| rest | 17 |
| craft | 15 |
| negotiate | 15 |
| take | 14 |
| give | 12 |
| cast | 9 |

## Sample Results
| id | action | ctx | expected | resolved | impact | category |
| --- | --- | --- | --- | --- | ---: | --- |
| fuzz_0001 | je brule la route a mains nues en chantant | free | destroy | destroy | yes | ok |
| fuzz_0002 | je deplace cet arbre jusqu au donjon a mains nues | tree_tile | none | none | no | contained |
| fuzz_0003 | je recrute le garde avec une banane | guard_actor | recruit | recruit | yes | ok |
| fuzz_0004 | je vole la lance du garde sans faire de bruit en plein chaos | guard_actor | steal | steal | yes | ok |
| fuzz_0005 | je creuse au pied de cet arbre tres lentement | tree_tile | dig | dig | yes | ok |
| fuzz_0006 | je vole la bourse du marchand en moonwalk | shop_actor | steal | steal | yes | ok |
| fuzz_0007 | je soudoye le garde avec 1 or en panique en panique | guard_actor | none | none | no | contained |
| fuzz_0008 | je pose un piege laser dans la ruine en moonwalk | ruin_tile | none | perform | yes | ok |
| fuzz_0009 | je bloque la boutique avec un sofa geant en moonwalk | shop_structure | none | perform | yes | ok |
| fuzz_0010 | je transforme le village en bateau volant a mains nues | free | none | none | no | contained |
| fuzz_0011 | j achete potion de soin a mains nues | shop_structure | buy | buy | yes | ok |
| fuzz_0012 | je soudoye le garde avec 1 or en moonwalk | guard_actor | none | perform | yes | ok |
| fuzz_0013 | je transforme le roi demon en chaise en moonwalk | boss_actor | none | perform | yes | ok |
| fuzz_0014 | je desarme le garde avec une banane comme un ninja | guard_actor | none | none | no | contained |
| fuzz_0015 | j achete potion de soin en chantant | shop_structure | buy | buy | yes | ok |
| fuzz_0016 | je parle au garde a mains nues | guard_actor | talk | talk | yes | ok |
| fuzz_0017 | je donne 5 or au marchand en plein chaos | shop_actor | give | give | yes | ok |
| fuzz_0018 | je recrute le garde en chantant | guard_actor | recruit | recruit | yes | ok |
| fuzz_0019 | je soudoye le garde avec 1 or comme un ninja tres lentement | guard_actor | none | none | no | contained |
| fuzz_0020 | je parle au marchand avec une banane en moonwalk | shop_actor | talk | talk | yes | ok |
| fuzz_0021 | je craft une potion en moonwalk | free | craft | craft | yes | ok |
| fuzz_0022 | je mets le feu a cet arbre en moonwalk | tree_tile | destroy | destroy | yes | ok |
| fuzz_0023 | je vole la lune tres lentement en chantant | free | none | steal | no | contained |
| fuzz_0024 | je desactive l aura du roi demon avec ma pensee sans faire de bruit | boss_actor | none | use | yes | ok |
| fuzz_0025 | je vole la bourse du marchand avec style | shop_actor | steal | steal | yes | ok |
| fuzz_0026 | je soudoye le garde avec 1 or comme un ninja en moonwalk | guard_actor | none | perform | yes | ok |
| fuzz_0027 | je donne 5 or au marchand a mains nues | shop_actor | give | give | yes | ok |
| fuzz_0028 | je vais a la boutique avec une banane | shop_structure | move | move | yes | ok |
| fuzz_0029 | je parle au garde en moonwalk | guard_actor | talk | talk | yes | ok |
| fuzz_0030 | je donne 5 or au marchand sans faire de bruit | shop_actor | give | give | yes | ok |
| fuzz_0031 | je me repose en chantant | free | rest | rest | yes | ok |
| fuzz_0032 | je craft une potion en plein chaos | free | craft | craft | yes | ok |
| fuzz_0033 | je desarme le garde avec une banane sans faire de bruit | guard_actor | none | none | no | contained |
| fuzz_0034 | je soudoye le garde avec 1 or en moonwalk a mains nues | guard_actor | none | perform | yes | ok |
| fuzz_0035 | je marie le marchand et le garde avec une banane | shop_actor | none | none | no | contained |
| fuzz_0036 | je menotte le roi demon avec une banane | boss_actor | none | none | yes | ok |
| fuzz_0037 | je recrute le garde tres lentement | guard_actor | recruit | recruit | yes | ok |
| fuzz_0038 | je transforme cet arbre en epee geante avec style | tree_tile | none | none | no | contained |
| fuzz_0039 | je vole la bourse du marchand tres lentement | shop_actor | steal | steal | yes | ok |
| fuzz_0040 | je parle au roi demon en plein chaos | boss_actor | talk | talk | yes | ok |
| fuzz_0041 | je menotte le roi demon sans faire de bruit | boss_actor | none | none | yes | ok |
| fuzz_0042 | je desactive l aura du roi demon avec ma pensee tres lentement | boss_actor | none | use | yes | ok |
| fuzz_0043 | je creuse un trou geant sous mes pieds en plein chaos | free | dig | dig | yes | ok |
| fuzz_0044 | je grave un message sur la ruine sans faire de bruit | ruin_tile | perform | perform | yes | ok |
| fuzz_0045 | je detruis la ruine pierre par pierre avec style | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0046 | je grave un message sur la ruine en moonwalk | ruin_tile | perform | perform | yes | ok |
| fuzz_0047 | je reconstruis la ruine en palais avec style en moonwalk | ruin_tile | none | perform | yes | ok |
| fuzz_0048 | je menotte le roi demon sans faire de bruit en chantant | boss_actor | none | none | yes | ok |
| fuzz_0049 | je detone la boutique en mode legendaire en moonwalk | shop_structure | none | perform | yes | ok |
| fuzz_0050 | je detone la boutique avec une banane | shop_structure | none | none | no | contained |
| fuzz_0051 | je detruis la ruine pierre par pierre avec style | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0052 | je vends torche a mains nues | shop_structure | sell | sell | yes | ok |
| fuzz_0053 | je pose un piege laser devant la boutique sans faire de bruit avec style | shop_structure | none | none | no | contained |
| fuzz_0054 | je pose un piege laser dans la ruine tres lentement en moonwalk | ruin_tile | none | perform | yes | ok |
| fuzz_0055 | je parle au roi demon comme un ninja | boss_actor | talk | talk | yes | ok |
| fuzz_0056 | je creuse un trou geant sous mes pieds en plein chaos | free | dig | dig | yes | ok |
| fuzz_0057 | je donne 5 or au marchand tres lentement | shop_actor | give | give | yes | ok |
| fuzz_0058 | je marie le chat et le garde en moonwalk | cat_actor | none | perform | yes | ok |
| fuzz_0059 | je pose un piege laser devant la boutique en moonwalk tres lentement | shop_structure | none | perform | yes | ok |
| fuzz_0060 | je creuse au pied de cet arbre tres lentement | tree_tile | dig | dig | yes | ok |
| fuzz_0061 | je recrute le marchand en moonwalk | shop_actor | recruit | recruit | yes | ok |
| fuzz_0062 | je negocie 35 pourcent de remise en moonwalk | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0063 | je coupe cet arbre en planches en chantant | tree_tile | destroy | destroy | yes | ok |
| fuzz_0064 | je cache un tresor sous le chat a mains nues avec une banane | cat_actor | hide | hide | yes | ok |
| fuzz_0065 | je detone la boutique sans faire de bruit | shop_structure | none | none | no | contained |
| fuzz_0066 | je menotte le roi demon en plein chaos | boss_actor | none | none | yes | ok |
| fuzz_0067 | j attaque le garde avec style avec une banane | guard_actor | attack | attack | yes | ok |
| fuzz_0068 | je clone mon personnage en plein chaos sans faire de bruit | free | none | none | no | contained |
| fuzz_0069 | je vends la terre compacte au marchand sans faire de bruit | shop_structure | sell | sell | yes | ok |
| fuzz_0070 | je coupe cet arbre en planches en mode legendaire en plein chaos | tree_tile | destroy | destroy | yes | ok |
| fuzz_0071 | je brule la route en panique en plein chaos | free | destroy | destroy | yes | ok |
| fuzz_0072 | je detruis la ruine pierre par pierre en plein chaos | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0073 | je marie le chat et le garde sans faire de bruit comme un ninja | cat_actor | none | none | no | contained |
| fuzz_0074 | je vais a la boutique avec style | free | move | move | yes | ok |
| fuzz_0075 | je desactive l aura du roi demon avec ma pensee en chantant | boss_actor | none | use | yes | ok |
| fuzz_0076 | je vole la lune en chantant | free | none | steal | no | contained |
| fuzz_0077 | je desactive l aura du roi demon avec ma pensee en plein chaos | boss_actor | none | use | yes | ok |
| fuzz_0078 | je bloque la boutique avec un sofa geant en moonwalk | shop_structure | none | perform | yes | ok |
| fuzz_0079 | je detone la boutique en panique | shop_structure | none | none | no | contained |
| fuzz_0080 | je creuse au pied de cet arbre a mains nues | tree_tile | dig | dig | yes | ok |

## Next Focus
- Keep current target/misroute robustness: already stable on this run.
- Convert highest-volume contained themes into canonical verbs (not regex patches).
- For each new verb family, require `ActionDraft -> WorldOps -> visible delta -> persistence` contract before shipping.
- Re-run this fuzz with multiple seeds each sprint and block regressions in CI.

