# Sandbox WTF Fuzz Report

Generated: 2026-03-20T22:33:19.767Z
Cases: 1000
Seed: 4242

## Summary
- WorldOps coverage: 603/1000 (60%)
- Meaningful impact: 694/1000 (69%)
- Semantic miss (supported cases): 0/617 (0%)
- Categories: ok=694, contained=306, no_impact=0, misroute=0, illusion=0

## Critical Findings
- none

## DA Generalization Ideas (From Contained Cases)
| Theme | Count | Generic Ops Candidate | Example |
| --- | ---: | --- | --- |
| Controle / entrave d entites | 54 | apply_status + disarm + restraint_duration + witness_incident | je menotte le garde a mains nues |
| Pieges et obstacles deployables | 53 | spawn_prop + collision_policy + trigger_effect + cleanup | je bloque la boutique avec un sofa geant en mode legendaire tres lentement |
| Magie de realite / impossible | 44 | high_cost_spell_policy + bounded_world_rewrite + catastrophe_branch | je me teleporte instant au boss tres lentement |
| Autres actions absurde/non modelees | 38 | introduce_generic_policy + explicit_reject_delta | je sacrifie le chat au volcan en mode legendaire en plein chaos |
| Construction / transformation lourde | 34 | craft_recipe_graph + place_structure + material_budget + nav_rebuild | je reconstruis la ruine en palais tres lentement |
| Coercition sociale | 32 | social_contest + bribe_transfer + relation_delta + legal_incident | je taxe tous les villageois d un coup sans faire de bruit |
| Actions multi-cibles | 31 | query_targets + batch_plan + capped_event_budget | je marie le marchand et le garde a mains nues |
| Manipulation physique lourde | 20 | carry_mode(drag/lift) + mass_check + occupancy_update + drop_op | je deplace cet arbre jusqu au donjon en panique a mains nues |

## Resolved Verb Distribution
| Verb | Count |
| --- | ---: |
| none | 308 |
| perform | 77 |
| recruit | 74 |
| talk | 74 |
| destroy | 70 |
| move | 63 |
| steal | 61 |
| attack | 39 |
| sell | 36 |
| loot | 35 |
| give | 26 |
| dig | 23 |
| take | 18 |
| negotiate | 17 |
| rest | 17 |
| craft | 16 |
| hide | 15 |
| use | 12 |
| buy | 12 |
| cast | 7 |

## Sample Results
| id | action | ctx | expected | resolved | impact | category |
| --- | --- | --- | --- | --- | ---: | --- |
| fuzz_0001 | je vole la lance du garde en panique | guard_actor | steal | steal | yes | ok |
| fuzz_0002 | je vends torche avec une banane | shop_structure | sell | sell | yes | ok |
| fuzz_0003 | je sacrifie le chat au volcan en mode legendaire en plein chaos | cat_actor | none | none | no | contained |
| fuzz_0004 | je coupe cet arbre en planches en moonwalk sans faire de bruit | tree_tile | destroy | destroy | yes | ok |
| fuzz_0005 | je vais a la boutique sans faire de bruit | free | move | move | yes | ok |
| fuzz_0006 | je vole la bourse du marchand en mode legendaire | shop_actor | steal | steal | yes | ok |
| fuzz_0007 | je vole la lune comme un ninja | free | none | steal | no | contained |
| fuzz_0008 | je bloque la boutique avec un sofa geant en mode legendaire tres lentement | shop_structure | none | none | no | contained |
| fuzz_0009 | je desactive l aura du roi demon avec ma pensee avec style | boss_actor | none | use | yes | ok |
| fuzz_0010 | je detruis la ruine pierre par pierre en mode legendaire avec une banane | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0011 | je cache un tresor sous le chat avec style | cat_actor | hide | hide | yes | ok |
| fuzz_0012 | je pose un piege laser devant la boutique en plein chaos | shop_structure | none | none | no | contained |
| fuzz_0013 | je me teleporte instant au boss tres lentement | free | none | cast | no | contained |
| fuzz_0014 | je detruis la ruine pierre par pierre en mode legendaire | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0015 | je recrute ce chat en plein chaos avec une banane | cat_actor | recruit | recruit | yes | ok |
| fuzz_0016 | je menotte le roi demon tres lentement | boss_actor | none | none | yes | ok |
| fuzz_0017 | je donne 5 or au marchand en panique comme un ninja | shop_actor | give | give | yes | ok |
| fuzz_0018 | je grave un message sur la ruine a mains nues | ruin_tile | perform | perform | yes | ok |
| fuzz_0019 | je clone mon personnage avec style avec style | free | none | none | no | contained |
| fuzz_0020 | je deplace cet arbre jusqu au donjon en panique a mains nues | tree_tile | none | none | no | contained |
| fuzz_0021 | je marie le marchand et le garde a mains nues | shop_actor | none | none | no | contained |
| fuzz_0022 | je vends torche tres lentement | shop_structure | sell | sell | yes | ok |
| fuzz_0023 | je recrute ce chat sans faire de bruit | cat_actor | recruit | recruit | yes | ok |
| fuzz_0024 | je grave un message sur la ruine en panique | ruin_tile | perform | perform | yes | ok |
| fuzz_0025 | je parle au roi demon en moonwalk | boss_actor | talk | talk | yes | ok |
| fuzz_0026 | je vais a la boutique en panique | free | move | move | yes | ok |
| fuzz_0027 | je cache un tresor sous le chat avec une banane tres lentement | cat_actor | hide | hide | yes | ok |
| fuzz_0028 | j achete potion de soin tres lentement | shop_structure | buy | buy | yes | ok |
| fuzz_0029 | je negocie 35 pourcent de remise en plein chaos | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0030 | j attaque le garde avec une banane tres lentement | guard_actor | attack | attack | yes | ok |
| fuzz_0031 | je negocie 35 pourcent de remise en mode legendaire | shop_structure | negotiate | negotiate | yes | ok |
| fuzz_0032 | je taxe tous les villageois d un coup sans faire de bruit | free | none | none | no | contained |
| fuzz_0033 | je vends torche sans faire de bruit | shop_structure | sell | sell | yes | ok |
| fuzz_0034 | je detruis la ruine pierre par pierre sans faire de bruit avec une banane | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0035 | je menotte le marchand a mains nues en moonwalk | shop_actor | none | perform | yes | ok |
| fuzz_0036 | je marie le marchand et le garde avec une banane | shop_actor | none | none | no | contained |
| fuzz_0037 | je bloque la boutique avec un sofa geant a mains nues | shop_structure | none | none | no | contained |
| fuzz_0038 | je detruis la ruine pierre par pierre en chantant | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0039 | je parle au roi demon en plein chaos | boss_actor | talk | talk | yes | ok |
| fuzz_0040 | je parle au garde en panique | guard_actor | talk | talk | yes | ok |
| fuzz_0041 | je sacrifie le chat au volcan en panique en plein chaos | cat_actor | none | none | no | contained |
| fuzz_0042 | je parle au chat en panique | cat_actor | talk | talk | yes | ok |
| fuzz_0043 | je vends la terre compacte au marchand tres lentement sans faire de bruit | shop_structure | sell | sell | yes | ok |
| fuzz_0044 | je vole la lance du garde avec style | guard_actor | steal | steal | yes | ok |
| fuzz_0045 | je transforme le village en bateau volant avec une banane comme un ninja | free | none | none | no | contained |
| fuzz_0046 | je pose un piege laser dans la ruine avec une banane | ruin_tile | none | none | no | contained |
| fuzz_0047 | je vends la terre compacte au marchand en panique avec une banane | shop_structure | sell | sell | yes | ok |
| fuzz_0048 | je soudoye le garde avec 1 or en plein chaos | guard_actor | none | none | no | contained |
| fuzz_0049 | je pose un piege laser devant la boutique sans faire de bruit | shop_structure | none | none | no | contained |
| fuzz_0050 | j attaque le roi demon avec une banane | boss_actor | attack | attack | yes | ok |
| fuzz_0051 | je detone la boutique en chantant en panique | shop_structure | none | none | no | contained |
| fuzz_0052 | je marie le chat et le garde en panique | cat_actor | none | none | no | contained |
| fuzz_0053 | je grave un message sur la ruine avec une banane comme un ninja | ruin_tile | perform | perform | yes | ok |
| fuzz_0054 | j attaque le garde en chantant | guard_actor | attack | attack | yes | ok |
| fuzz_0055 | je vends torche sans faire de bruit | shop_structure | sell | sell | yes | ok |
| fuzz_0056 | je recrute le roi demon en moonwalk | boss_actor | recruit | recruit | yes | ok |
| fuzz_0057 | je vends torche | shop_structure | sell | sell | yes | ok |
| fuzz_0058 | je vends la terre compacte au marchand tres lentement | shop_structure | sell | sell | yes | ok |
| fuzz_0059 | je creuse un trou geant sous mes pieds avec style | free | dig | dig | yes | ok |
| fuzz_0060 | je craft une potion sans faire de bruit en chantant | free | craft | craft | yes | ok |
| fuzz_0061 | je creuse un trou geant sous mes pieds | free | dig | dig | yes | ok |
| fuzz_0062 | je desactive l aura du roi demon avec ma pensee comme un ninja tres lentement | boss_actor | none | use | yes | ok |
| fuzz_0063 | je taxe tous les villageois d un coup tres lentement | free | none | none | no | contained |
| fuzz_0064 | je vais a la boutique a mains nues | shop_structure | move | move | yes | ok |
| fuzz_0065 | je transforme cet arbre en epee geante en panique sans faire de bruit | tree_tile | none | none | no | contained |
| fuzz_0066 | je vole l epee du demon en moonwalk en mode legendaire | boss_actor | steal | steal | yes | ok |
| fuzz_0067 | je marie le marchand et le garde en mode legendaire | shop_actor | none | none | no | contained |
| fuzz_0068 | je vole la bourse du marchand en moonwalk | shop_actor | steal | steal | yes | ok |
| fuzz_0069 | je detruis la ruine pierre par pierre comme un ninja | ruin_tile | destroy | destroy | yes | ok |
| fuzz_0070 | je donne 5 or au marchand en panique sans faire de bruit | shop_actor | give | give | yes | ok |
| fuzz_0071 | je menotte le garde a mains nues | guard_actor | none | none | no | contained |
| fuzz_0072 | je detone la boutique avec style | shop_structure | none | none | no | contained |
| fuzz_0073 | je brule la route sans faire de bruit | free | destroy | destroy | yes | ok |
| fuzz_0074 | je transforme cet arbre en epee geante en mode legendaire | tree_tile | none | none | no | contained |
| fuzz_0075 | je vends la terre compacte au marchand | shop_structure | sell | sell | yes | ok |
| fuzz_0076 | je me repose en plein chaos | free | rest | rest | yes | ok |
| fuzz_0077 | je sacrifie le chat au volcan en moonwalk avec une banane | cat_actor | none | perform | yes | ok |
| fuzz_0078 | je parle au roi demon comme un ninja | boss_actor | talk | talk | yes | ok |
| fuzz_0079 | je mets le feu a cet arbre tres lentement | tree_tile | destroy | destroy | yes | ok |
| fuzz_0080 | je vends la terre compacte au marchand en mode legendaire en mode legendaire | shop_structure | sell | sell | yes | ok |

## Next Focus
- Keep current target/misroute robustness: already stable on this run.
- Convert highest-volume contained themes into canonical verbs (not regex patches).
- For each new verb family, require `ActionDraft -> WorldOps -> visible delta -> persistence` contract before shipping.
- Re-run this fuzz with multiple seeds each sprint and block regressions in CI.

