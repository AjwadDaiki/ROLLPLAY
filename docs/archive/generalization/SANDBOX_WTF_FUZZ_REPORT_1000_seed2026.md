# Sandbox WTF Fuzz Report

Generated: 2026-03-20T22:33:19.687Z
Cases: 1000
Seed: 2026

## Summary
- WorldOps coverage: 555/1000 (56%)
- Meaningful impact: 682/1000 (68%)
- Semantic miss (supported cases): 3/604 (0%)
- Categories: ok=682, contained=318, no_impact=0, misroute=0, illusion=0

## Critical Findings
- none

## DA Generalization Ideas (From Contained Cases)
| Theme | Count | Generic Ops Candidate | Example |
| --- | ---: | --- | --- |
| Pieges et obstacles deployables | 68 | spawn_prop + collision_policy + trigger_effect + cleanup | je pose un piege laser devant la boutique en chantant |
| Magie de realite / impossible | 50 | high_cost_spell_policy + bounded_world_rewrite + catastrophe_branch | je clone mon personnage en mode legendaire |
| Controle / entrave d entites | 49 | apply_status + disarm + restraint_duration + witness_incident | je desarme le marchand avec une plume en chantant |
| Autres actions absurde/non modelees | 35 | introduce_generic_policy + explicit_reject_delta | je detone la boutique en panique |
| Construction / transformation lourde | 31 | craft_recipe_graph + place_structure + material_budget + nav_rebuild | je reconstruis la ruine en palais en chantant avec une banane |
| Coercition sociale | 31 | social_contest + bribe_transfer + relation_delta + legal_incident | je soudoye le garde avec 1 or tres lentement avec style |
| Manipulation physique lourde | 28 | carry_mode(drag/lift) + mass_check + occupancy_update + drop_op | je deplace cet arbre jusqu au donjon avec une banane tres lentement |
| Actions multi-cibles | 26 | query_targets + batch_plan + capped_event_budget | je marie le chat et le garde comme un ninja |

## Resolved Verb Distribution
| Verb | Count |
| --- | ---: |
| none | 323 |
| destroy | 82 |
| talk | 67 |
| perform | 66 |
| steal | 62 |
| recruit | 59 |
| move | 55 |
| dig | 43 |
| sell | 41 |
| attack | 29 |
| rest | 24 |
| hide | 22 |
| loot | 19 |
| negotiate | 18 |
| craft | 18 |
| give | 17 |
| use | 15 |
| take | 14 |
| buy | 14 |
| cast | 12 |

## Sample Results
| id | action | ctx | expected | resolved | impact | category |
| --- | --- | --- | --- | --- | ---: | --- |
| fuzz_0001 | j attaque le garde comme un ninja sans faire de bruit | guard_actor | attack | attack | yes | ok |
| fuzz_0002 | je marie le chat et le garde comme un ninja | cat_actor | none | none | no | contained |
| fuzz_0003 | je parle au marchand en chantant | shop_actor | talk | talk | yes | ok |
| fuzz_0004 | je fouille la ruine et je prends tout sans faire de bruit en plein chaos | ruin_tile | loot | loot | yes | ok |
| fuzz_0005 | je reconstruis la ruine en palais en chantant avec une banane | ruin_tile | none | none | no | contained |
| fuzz_0006 | je pose un piege laser devant la boutique en chantant | shop_structure | none | none | no | contained |
| fuzz_0007 | je creuse un trou geant sous mes pieds en plein chaos | free | dig | dig | yes | ok |
| fuzz_0008 | je marie le marchand et le garde comme un ninja | shop_actor | none | none | no | contained |
| fuzz_0009 | je clone mon personnage en mode legendaire | free | none | none | no | contained |
| fuzz_0010 | je negocie 35 pourcent de remise en mode legendaire | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0011 | je transforme cet arbre en epee geante tres lentement | tree_tile | none | none | no | contained |
| fuzz_0012 | je transforme cet arbre en epee geante avec style | tree_tile | none | none | no | contained |
| fuzz_0013 | je parle au marchand | shop_actor | talk | talk | yes | ok |
| fuzz_0014 | je fouille la ruine et je prends tout tres lentement | ruin_tile | loot | loot | yes | ok |
| fuzz_0015 | je pose un piege laser devant la boutique | shop_structure | none | none | no | contained |
| fuzz_0016 | je menotte le roi demon comme un ninja | boss_actor | none | none | yes | ok |
| fuzz_0017 | je me teleporte instant au boss en mode legendaire | free | none | cast | no | contained |
| fuzz_0018 | je me teleporte instant au boss tres lentement | free | none | cast | no | contained |
| fuzz_0019 | je me repose a mains nues | free | rest | rest | yes | ok |
| fuzz_0020 | je vends torche en mode legendaire | shop_structure | sell | sell | yes | ok |
| fuzz_0021 | je vends la terre compacte au marchand a mains nues comme un ninja | shop_structure | sell | sell | yes | ok |
| fuzz_0022 | je grave un message sur la ruine en moonwalk | ruin_tile | perform | perform | yes | ok |
| fuzz_0023 | je parle au roi demon en chantant a mains nues | boss_actor | talk | talk | yes | ok |
| fuzz_0024 | je vole la bourse du marchand avec une banane | shop_actor | steal | steal | yes | ok |
| fuzz_0025 | je deplace cet arbre jusqu au donjon avec une banane tres lentement | tree_tile | none | none | no | contained |
| fuzz_0026 | je negocie 35 pourcent de remise en mode legendaire en plein chaos | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0027 | je fouille la ruine et je prends tout sans faire de bruit a mains nues | ruin_tile | loot | loot | yes | ok |
| fuzz_0028 | je vais a la boutique comme un ninja | free | move | move | yes | ok |
| fuzz_0029 | je grave un message sur la ruine en panique | ruin_tile | perform | perform | yes | ok |
| fuzz_0030 | je mets le feu a cet arbre comme un ninja | tree_tile | destroy | destroy | yes | ok |
| fuzz_0031 | je creuse un trou geant sous mes pieds tres lentement sans faire de bruit | free | dig | dig | yes | ok |
| fuzz_0032 | je vole la bourse du marchand tres lentement sans faire de bruit | shop_actor | steal | steal | yes | ok |
| fuzz_0033 | je pose un piege laser devant la boutique en chantant sans faire de bruit | shop_structure | none | none | no | contained |
| fuzz_0034 | je deplace cet arbre jusqu au donjon avec style en chantant | tree_tile | none | none | no | contained |
| fuzz_0035 | je desarme le marchand avec une plume en chantant | shop_actor | none | none | no | contained |
| fuzz_0036 | j attaque le garde en plein chaos | guard_actor | attack | attack | yes | ok |
| fuzz_0037 | je bloque la boutique avec un sofa geant en moonwalk en moonwalk | shop_structure | none | perform | yes | ok |
| fuzz_0038 | je vais a la guilde | free | move | move | yes | ok |
| fuzz_0039 | je donne 5 or au marchand | shop_actor | give | give | yes | ok |
| fuzz_0040 | je creuse un trou geant sous mes pieds tres lentement | free | dig | dig | yes | ok |
| fuzz_0041 | je soudoye le garde avec 1 or tres lentement avec style | guard_actor | none | none | no | contained |
| fuzz_0042 | je transforme cet arbre en epee geante en chantant | tree_tile | none | none | no | contained |
| fuzz_0043 | je cache un tresor sous le chat avec style | cat_actor | hide | hide | yes | ok |
| fuzz_0044 | je construis un pont en pommes en panique | free | none | none | no | contained |
| fuzz_0045 | je transforme le roi demon en chaise avec une banane | boss_actor | none | none | yes | ok |
| fuzz_0046 | je marie le chat et le garde en mode legendaire | cat_actor | none | none | no | contained |
| fuzz_0047 | je craft une potion en panique | free | craft | craft | yes | ok |
| fuzz_0048 | je deplace cet arbre jusqu au donjon en chantant | tree_tile | none | none | no | contained |
| fuzz_0049 | je recrute ce chat avec style | cat_actor | recruit | recruit | yes | ok |
| fuzz_0050 | je prends du bois de cet arbre avec style | tree_tile | take | take | yes | ok |
| fuzz_0051 | je coupe cet arbre en planches | tree_tile | destroy | destroy | yes | ok |
| fuzz_0052 | je construis un pont en pommes comme un ninja | free | none | none | no | contained |
| fuzz_0053 | je grave un message sur la ruine en mode legendaire | ruin_tile | perform | perform | yes | ok |
| fuzz_0054 | je detruis la ruine pierre par pierre en mode legendaire | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0055 | je brule la route sans faire de bruit tres lentement | free | destroy | destroy | yes | ok |
| fuzz_0056 | je vais a la boutique a mains nues | free | move | move | yes | ok |
| fuzz_0057 | je parle au marchand en moonwalk | shop_actor | talk | talk | yes | ok |
| fuzz_0058 | je menotte le garde avec une banane | guard_actor | none | none | no | contained |
| fuzz_0059 | je grave un message sur la ruine avec une banane | ruin_tile | perform | perform | yes | ok |
| fuzz_0060 | je detone la boutique en panique | shop_structure | none | none | no | contained |
| fuzz_0061 | je recrute le garde en mode legendaire | guard_actor | recruit | recruit | yes | ok |
| fuzz_0062 | je coupe cet arbre en planches comme un ninja en moonwalk | tree_tile | destroy | destroy | yes | ok |
| fuzz_0063 | je menotte le garde tres lentement en plein chaos | guard_actor | none | none | no | contained |
| fuzz_0064 | je sacrifie le chat au volcan a mains nues | cat_actor | none | none | no | contained |
| fuzz_0065 | je vais a la guilde en moonwalk | free | move | move | yes | ok |
| fuzz_0066 | je grave un message sur la ruine en panique | ruin_tile | perform | perform | yes | ok |
| fuzz_0067 | je transforme le village en bateau volant avec une banane | free | none | none | no | contained |
| fuzz_0068 | je donne 5 or au marchand avec une banane | shop_actor | give | give | yes | ok |
| fuzz_0069 | je craft une potion en mode legendaire | free | craft | craft | yes | ok |
| fuzz_0070 | je pose un piege laser devant la boutique avec une banane | shop_structure | none | none | no | contained |
| fuzz_0071 | je recrute le garde avec style | guard_actor | recruit | recruit | yes | ok |
| fuzz_0072 | je cache un tresor sous le chat avec une banane en chantant | cat_actor | hide | hide | yes | ok |
| fuzz_0073 | je creuse un trou geant sous mes pieds a mains nues | free | dig | dig | yes | ok |
| fuzz_0074 | je parle au chat avec une banane | cat_actor | talk | talk | yes | ok |
| fuzz_0075 | je recrute le marchand en moonwalk | shop_actor | recruit | recruit | yes | ok |
| fuzz_0076 | je bloque la boutique avec un sofa geant avec une banane | shop_structure | none | none | no | contained |
| fuzz_0077 | je vends la terre compacte au marchand a mains nues en mode legendaire | shop_structure | sell | sell | yes | ok |
| fuzz_0078 | je grave un message sur la ruine avec style | ruin_tile | perform | perform | yes | ok |
| fuzz_0079 | je marie le chat et le garde en mode legendaire | cat_actor | none | none | no | contained |
| fuzz_0080 | je menotte le garde comme un ninja | guard_actor | none | none | no | contained |

## Next Focus
- Keep current target/misroute robustness: already stable on this run.
- Convert highest-volume contained themes into canonical verbs (not regex patches).
- For each new verb family, require `ActionDraft -> WorldOps -> visible delta -> persistence` contract before shipping.
- Re-run this fuzz with multiple seeds each sprint and block regressions in CI.

