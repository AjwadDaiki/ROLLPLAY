# Sandbox WTF Fuzz Report

Generated: 2026-03-20T20:57:07.545Z
Cases: 300
Seed: 1337

## Summary
- WorldOps coverage: 180/300 (60%)
- Meaningful impact: 213/300 (71%)
- Semantic miss (supported cases): 0/200 (0%)
- Categories: ok=213, contained=87, no_impact=0, misroute=0, illusion=0

## Critical Findings
- none

## DA Generalization Ideas (From Contained Cases)
| Theme | Count | Generic Ops Candidate | Example |
| --- | ---: | --- | --- |
| Pieges et obstacles deployables | 19 | spawn_prop + collision_policy + trigger_effect + cleanup | je bloque la boutique avec un sofa geant en panique |
| Controle / entrave d entites | 16 | apply_status + disarm + restraint_duration + witness_incident | je menotte le garde tres lentement |
| Magie de realite / impossible | 12 | high_cost_spell_policy + bounded_world_rewrite + catastrophe_branch | je transforme cet arbre en epee geante en mode legendaire |
| Autres actions absurde/non modelees | 11 | introduce_generic_policy + explicit_reject_delta | je sacrifie le chat au volcan comme un ninja |
| Actions multi-cibles | 10 | query_targets + batch_plan + capped_event_budget | je marie le chat et le garde a mains nues |
| Construction / transformation lourde | 7 | craft_recipe_graph + place_structure + material_budget + nav_rebuild | je construis un pont en pommes en panique |
| Manipulation physique lourde | 6 | carry_mode(drag/lift) + mass_check + occupancy_update + drop_op | je deplace cet arbre jusqu au donjon en chantant |
| Coercition sociale | 6 | social_contest + bribe_transfer + relation_delta + legal_incident | je soudoye le garde avec 1 or avec une banane |

## Resolved Verb Distribution
| Verb | Count |
| --- | ---: |
| none | 84 |
| move | 27 |
| recruit | 27 |
| steal | 23 |
| talk | 22 |
| destroy | 19 |
| attack | 16 |
| dig | 14 |
| perform | 13 |
| sell | 10 |
| give | 9 |
| buy | 9 |
| loot | 8 |
| negotiate | 5 |
| use | 3 |
| take | 3 |
| hide | 3 |
| craft | 2 |
| rest | 2 |
| cast | 1 |

## Sample Results
| id | action | ctx | expected | resolved | impact | category |
| --- | --- | --- | --- | --- | ---: | --- |
| fuzz_0001 | je vais a la boutique comme un ninja | shop_structure | move | move | yes | ok |
| fuzz_0002 | je donne 5 or au marchand en panique | shop_actor | give | give | yes | ok |
| fuzz_0003 | j attaque le roi demon avec une banane en plein chaos | boss_actor | attack | attack | yes | ok |
| fuzz_0004 | je soudoye le garde avec 1 or en moonwalk sans faire de bruit | guard_actor | none | perform | yes | ok |
| fuzz_0005 | je recrute le garde avec style | guard_actor | recruit | recruit | yes | ok |
| fuzz_0006 | je vends la terre compacte au marchand sans faire de bruit | shop_structure | sell | sell | yes | ok |
| fuzz_0007 | je bloque la boutique avec un sofa geant en panique | shop_structure | none | none | no | contained |
| fuzz_0008 | je parle au marchand en moonwalk en chantant | shop_actor | talk | talk | yes | ok |
| fuzz_0009 | j attaque le garde tres lentement | guard_actor | attack | attack | yes | ok |
| fuzz_0010 | je deplace cet arbre jusqu au donjon en chantant | tree_tile | none | none | no | contained |
| fuzz_0011 | je vais a la guilde en chantant en moonwalk | free | move | move | yes | ok |
| fuzz_0012 | je construis un pont en pommes en panique | free | none | none | no | contained |
| fuzz_0013 | je parle au garde en chantant | guard_actor | talk | talk | yes | ok |
| fuzz_0014 | je vends torche comme un ninja | shop_structure | sell | sell | yes | ok |
| fuzz_0015 | je marie le chat et le garde a mains nues | cat_actor | none | none | no | contained |
| fuzz_0016 | je vends la terre compacte au marchand a mains nues | shop_structure | sell | sell | yes | ok |
| fuzz_0017 | j attaque le roi demon avec une banane avec une banane | boss_actor | attack | attack | yes | ok |
| fuzz_0018 | je desactive l aura du roi demon avec ma pensee comme un ninja sans faire de bruit | boss_actor | none | use | yes | ok |
| fuzz_0019 | je menotte le garde tres lentement | guard_actor | none | none | no | contained |
| fuzz_0020 | je recrute le roi demon avec une banane | boss_actor | recruit | recruit | yes | ok |
| fuzz_0021 | j attaque le garde en moonwalk | guard_actor | attack | attack | yes | ok |
| fuzz_0022 | je creuse un trou geant sous mes pieds avec style | free | dig | dig | yes | ok |
| fuzz_0023 | je recrute le roi demon tres lentement | boss_actor | recruit | recruit | yes | ok |
| fuzz_0024 | je vends torche a mains nues sans faire de bruit | shop_structure | sell | sell | yes | ok |
| fuzz_0025 | je menotte le garde avec une banane | guard_actor | none | none | no | contained |
| fuzz_0026 | je recrute le marchand en plein chaos | shop_actor | recruit | recruit | yes | ok |
| fuzz_0027 | je vais a la boutique en chantant | free | move | move | yes | ok |
| fuzz_0028 | je parle au roi demon comme un ninja | boss_actor | talk | talk | yes | ok |
| fuzz_0029 | je creuse au pied de cet arbre en chantant | tree_tile | dig | dig | yes | ok |
| fuzz_0030 | je vais a la guilde comme un ninja | free | move | move | yes | ok |
| fuzz_0031 | je creuse au pied de cet arbre a mains nues en moonwalk | tree_tile | dig | dig | yes | ok |
| fuzz_0032 | je sacrifie le chat au volcan comme un ninja | cat_actor | none | none | no | contained |
| fuzz_0033 | je vole l epee du demon en mode legendaire en chantant | boss_actor | steal | steal | yes | ok |
| fuzz_0034 | je vais a la boutique comme un ninja | free | move | move | yes | ok |
| fuzz_0035 | je grave un message sur la ruine | ruin_tile | perform | perform | yes | ok |
| fuzz_0036 | j achete potion de soin avec style en chantant | shop_structure | buy | buy | yes | ok |
| fuzz_0037 | je vends la terre compacte au marchand en mode legendaire | shop_structure | sell | sell | yes | ok |
| fuzz_0038 | je vais a la boutique tres lentement | shop_structure | move | move | yes | ok |
| fuzz_0039 | je vends la terre compacte au marchand en chantant | shop_structure | sell | sell | yes | ok |
| fuzz_0040 | je soudoye le garde avec 1 or avec une banane | guard_actor | none | none | no | contained |
| fuzz_0041 | je reconstruis la ruine en palais en plein chaos avec une banane | ruin_tile | none | none | no | contained |
| fuzz_0042 | je mets le feu a cet arbre en mode legendaire | tree_tile | destroy | destroy | yes | ok |
| fuzz_0043 | je recrute ce chat comme un ninja | cat_actor | recruit | recruit | yes | ok |
| fuzz_0044 | je recrute le marchand sans faire de bruit | shop_actor | recruit | recruit | yes | ok |
| fuzz_0045 | j attaque le roi demon en plein chaos en moonwalk | boss_actor | attack | attack | yes | ok |
| fuzz_0046 | je transforme cet arbre en epee geante en mode legendaire | tree_tile | none | none | no | contained |
| fuzz_0047 | je grave un message sur la ruine en moonwalk | ruin_tile | perform | perform | yes | ok |
| fuzz_0048 | je vole la lance du garde avec une banane | guard_actor | steal | steal | yes | ok |
| fuzz_0049 | je recrute ce chat en moonwalk | cat_actor | recruit | recruit | yes | ok |
| fuzz_0050 | je recrute le garde en chantant en chantant | guard_actor | recruit | recruit | yes | ok |
| fuzz_0051 | je vole l epee du demon comme un ninja | boss_actor | steal | steal | yes | ok |
| fuzz_0052 | je brule la route a mains nues en mode legendaire | free | destroy | destroy | yes | ok |
| fuzz_0053 | je parle au garde en panique | guard_actor | talk | talk | yes | ok |
| fuzz_0054 | j attaque le garde tres lentement | guard_actor | attack | attack | yes | ok |
| fuzz_0055 | j achete potion de soin en moonwalk | shop_structure | buy | buy | yes | ok |
| fuzz_0056 | je creuse au pied de cet arbre avec style comme un ninja | tree_tile | dig | dig | yes | ok |
| fuzz_0057 | je prends du bois de cet arbre | tree_tile | take | take | yes | ok |
| fuzz_0058 | je bloque la boutique avec un sofa geant tres lentement tres lentement | shop_structure | none | none | no | contained |
| fuzz_0059 | je vole la lance du garde a mains nues | guard_actor | steal | steal | yes | ok |
| fuzz_0060 | je mets le feu a cet arbre en panique sans faire de bruit | tree_tile | destroy | destroy | yes | ok |
| fuzz_0061 | je mets le feu a cet arbre a mains nues avec une banane | tree_tile | destroy | destroy | yes | ok |
| fuzz_0062 | je vais a la boutique avec une banane | free | move | move | yes | ok |
| fuzz_0063 | je recrute le marchand avec style | shop_actor | recruit | recruit | yes | ok |
| fuzz_0064 | je recrute le marchand comme un ninja sans faire de bruit | shop_actor | recruit | recruit | yes | ok |
| fuzz_0065 | je taxe tous les villageois d un coup en panique avec style | free | none | none | no | contained |
| fuzz_0066 | je recrute le garde avec une banane en panique | guard_actor | recruit | recruit | yes | ok |
| fuzz_0067 | je mets le feu a cet arbre comme un ninja avec une banane | tree_tile | destroy | destroy | yes | ok |
| fuzz_0068 | je craft une potion en mode legendaire tres lentement | free | craft | craft | yes | ok |
| fuzz_0069 | je parle au garde avec une banane avec style | guard_actor | talk | talk | yes | ok |
| fuzz_0070 | j achete potion de soin comme un ninja | shop_structure | buy | buy | yes | ok |
| fuzz_0071 | je coupe cet arbre en planches comme un ninja a mains nues | tree_tile | destroy | destroy | yes | ok |
| fuzz_0072 | je fouille la ruine et je prends tout en panique comme un ninja | ruin_tile | loot | loot | yes | ok |
| fuzz_0073 | je sacrifie le chat au volcan avec une banane tres lentement | cat_actor | none | none | no | contained |
| fuzz_0074 | je me teleporte instant au boss a mains nues comme un ninja | free | none | cast | no | contained |
| fuzz_0075 | je grave un message sur la ruine avec une banane | ruin_tile | perform | perform | yes | ok |
| fuzz_0076 | je mets le feu a cet arbre en plein chaos | tree_tile | destroy | destroy | yes | ok |
| fuzz_0077 | je desarme le marchand avec une plume en mode legendaire en mode legendaire | shop_actor | none | none | no | contained |
| fuzz_0078 | j attaque le roi demon en mode legendaire | boss_actor | attack | attack | yes | ok |
| fuzz_0079 | je reconstruis la ruine en palais en moonwalk | ruin_tile | none | perform | yes | ok |
| fuzz_0080 | je parle au roi demon avec style sans faire de bruit | boss_actor | talk | talk | yes | ok |

## Next Focus
- Keep current target/misroute robustness: already stable on this run.
- Convert highest-volume contained themes into canonical verbs (not regex patches).
- For each new verb family, require `ActionDraft -> WorldOps -> visible delta -> persistence` contract before shipping.
- Re-run this fuzz with multiple seeds each sprint and block regressions in CI.

