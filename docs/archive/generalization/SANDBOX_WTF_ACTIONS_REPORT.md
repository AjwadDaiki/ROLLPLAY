# Sandbox WTF Actions Analysis

Generated: 2026-03-20T19:42:31.059Z
Total actions: 50
WorldOps coverage: 22/50 (44%)
Meaningful impact: 28/50 (56%)

## Category Summary
- ok: 28
- contained (unsupported but safely limited): 22
- no_impact (supported intent but no meaningful delta): 0
- illusion (positive narrative but no meaningful delta): 0
- misroute (wrong target/system): 0

## Priority Issues
- none

## Full Results
| id | action | context | verb | target | worldOps | impact | category |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| wtf_001 | je vole la lune | free | steal | none | 0 | no | contained |
| wtf_002 | je mange mon ombre | free | use | none | 0 | no | contained |
| wtf_003 | je taxe tous les villageois | free | none | none | 0 | no | contained |
| wtf_004 | je parle au vent | free | talk | none | 0 | no | contained |
| wtf_005 | je prie ce rocher imaginaire | free | none | none | 0 | no | contained |
| wtf_006 | je deplace la guilde dans le desert | free | move | none | 0 | yes | ok |
| wtf_007 | je construis un pont en pommes | free | none | none | 0 | no | contained |
| wtf_008 | je deviens invisible et je passe au travers des murs | free | hide | none | 0 | no | contained |
| wtf_009 | je clone mon personnage | free | none | none | 0 | no | contained |
| wtf_010 | je transforme le village en bateau volant | free | none | none | 0 | no | contained |
| wtf_011 | je negocie 90 pourcent de remise | shop_structure | negotiate | structure:shop | 1 | yes | ok |
| wtf_012 | je negocie un prix negatif | shop_structure | negotiate | structure:shop | 1 | yes | ok |
| wtf_013 | je vends un dragon | shop_structure | sell | structure:shop | 1 | yes | ok |
| wtf_014 | je force le marchand a tout donner | shop_actor | steal | actor:npc_shopkeeper | 2 | yes | ok |
| wtf_015 | je vole la caisse du marchand | shop_actor | steal | actor:npc_shopkeeper | 2 | yes | ok |
| wtf_016 | je menotte le marchand | shop_actor | none | actor:npc_shopkeeper | 0 | no | contained |
| wtf_017 | je parle au roi demon | shop_structure | talk | actor:hostile_7_lord | 1 | yes | ok |
| wtf_018 | je vole l epee du demon | shop_structure | steal | actor:hostile_7_lord | 1 | yes | ok |
| wtf_019 | je desarme le garde avec une banane | guard_actor | none | actor:npc_guard_road | 0 | no | contained |
| wtf_020 | je soudoye le garde avec 1 or | guard_actor | none | actor:npc_guard_road | 0 | no | contained |
| wtf_021 | je recrute le garde | guard_actor | recruit | actor:npc_guard_road | 2 | yes | ok |
| wtf_022 | je parle au garde de physique quantique | guard_actor | talk | actor:npc_guard_road | 2 | yes | ok |
| wtf_023 | j attaque le garde | guard_actor | attack | actor:npc_guard_road | 2 | yes | ok |
| wtf_024 | je recrute le roi demon | boss_actor | recruit | actor:hostile_7_lord | 2 | yes | ok |
| wtf_025 | je parle au roi demon gentiment | boss_actor | talk | actor:hostile_7_lord | 2 | yes | ok |
| wtf_026 | je menotte le roi demon | boss_actor | none | actor:hostile_7_lord | 0 | yes | ok |
| wtf_027 | je vole les bottes du roi demon | boss_actor | steal | actor:hostile_7_lord | 2 | yes | ok |
| wtf_028 | je desactive l aura du roi demon | boss_actor | use | actor:hostile_7_lord | 1 | yes | ok |
| wtf_029 | j attaque le roi demon | boss_actor | attack | actor:hostile_7_lord | 2 | yes | ok |
| wtf_030 | je recrute ce chat | cat_actor | recruit | actor:animal_cat_village | 3 | yes | ok |
| wtf_031 | je parle au chat de politique | cat_actor | talk | actor:animal_cat_village | 2 | yes | ok |
| wtf_032 | je marie le chat et le garde | cat_actor | none | actor:animal_cat_village | 0 | no | contained |
| wtf_033 | je sacrifie le chat au volcan | cat_actor | none | actor:animal_cat_village | 0 | no | contained |
| wtf_034 | je porte cet arbre sur mon dos | tree_tile | none | tile:5,1 | 0 | no | contained |
| wtf_035 | je coupe cet arbre en 4 planches | tree_tile | destroy | tile:5,1 | 0 | yes | ok |
| wtf_036 | je mets le feu a cet arbre | tree_tile | destroy | tile:5,1 | 0 | yes | ok |
| wtf_037 | je cache un tresor sous cet arbre | tree_tile | hide | tile:5,1 | 0 | no | contained |
| wtf_038 | je transforme cet arbre en epee geante | tree_tile | none | tile:5,1 | 0 | no | contained |
| wtf_039 | je fouille la ruine et je prends tout | ruin_tile | loot | tile:36,5 | 2 | yes | ok |
| wtf_040 | je pose un piege laser ici | ruin_tile | none | tile:36,5 | 0 | no | contained |
| wtf_041 | je detone la ruine | ruin_tile | none | tile:36,5 | 0 | no | contained |
| wtf_042 | je grave un message sur la ruine | ruin_tile | perform | tile:36,5 | 1 | yes | ok |
| wtf_043 | je me teleporte au donjon | free | cast | structure:dungeon_gate_structure | 0 | no | contained |
| wtf_044 | je vais a la boutique en moonwalk | free | move | structure:shop | 1 | yes | ok |
| wtf_045 | je creuse un trou geant sous mes pieds | free | dig | none | 0 | yes | ok |
| wtf_046 | je brule la route | free | destroy | none | 0 | yes | ok |
| wtf_047 | je frappe l air tres fort | free | attack | none | 0 | no | contained |
| wtf_048 | je recrute tous les monstres de la map | free | recruit | none | 0 | no | contained |
| wtf_049 | je donne 1000 or au marchand | shop_actor | give | actor:npc_shopkeeper | 1 | yes | ok |
| wtf_050 | je vends la terre compacte au marchand | shop_structure | sell | structure:shop | 1 | yes | ok |

## Detailed Notes
### wtf_001
- Input: `je vole la lune`
- Narrative: Tu ne trouves aucune cible a voler. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_002
- Input: `je mange mon ombre`
- Narrative: Tu ne possedes pas cet objet. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_003
- Input: `je taxe tous les villageois`
- Narrative: Tu je taxe tous les villageois.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_004
- Input: `je parle au vent`
- Narrative: Personne a qui parler ici. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_005
- Input: `je prie ce rocher imaginaire`
- Narrative: Tu je prie ce rocher imaginaire.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_006
- Input: `je deplace la guilde dans le desert`
- Narrative: Tu te diriges vers la guilde.
- Summary: pos (24,25) -> (20,25); ops=[none]
- Flags: misroute=false, illusion=false, impact=true

### wtf_007
- Input: `je construis un pont en pommes`
- Narrative: Tu je construis un pont en pommes.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_008
- Input: `je deviens invisible et je passe au travers des murs`
- Narrative: Tu te glisses dans l ombre. Personne ne te voit.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_009
- Input: `je clone mon personnage`
- Narrative: Tu je clone mon personnage.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_010
- Input: `je transforme le village en bateau volant`
- Narrative: Tu je transforme le village en bateau volan.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_011
- Input: `je negocie 90 pourcent de remise`
- Narrative: Le marchand accepte de faire un geste commercial.
- Summary: no_meaningful_delta; ops=[set_shop_discount]
- Flags: misroute=false, illusion=false, impact=true

### wtf_012
- Input: `je negocie un prix negatif`
- Narrative: Le marchand accepte de faire un geste commercial.
- Summary: no_meaningful_delta; ops=[set_shop_discount]
- Flags: misroute=false, illusion=false, impact=true

### wtf_013
- Input: `je vends un dragon`
- Narrative: Tu ne possedes pas cet objet.
- Summary: no_meaningful_delta; ops=[set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_014
- Input: `je force le marchand a tout donner`
- Narrative: D un geste discret, tu subtilises l objet de Marchand. Ni vu ni connu.
- Summary: invQty +1; ops=[transfer_item,set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_015
- Input: `je vole la caisse du marchand`
- Narrative: D un geste discret, tu subtilises l objet de Marchand. Ni vu ni connu.
- Summary: invQty +1; ops=[transfer_item,set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_016
- Input: `je menotte le marchand`
- Narrative: Action non comprise sur Marchand. Essaie parler, attaquer, recruter, voler ou inspecter. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_017
- Input: `je parle au roi demon`
- Narrative: Roi Demon est inaccessible pour le moment.
- Summary: no_meaningful_delta; ops=[set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_018
- Input: `je vole l epee du demon`
- Narrative: Roi Demon est inaccessible pour le moment.
- Summary: no_meaningful_delta; ops=[set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_019
- Input: `je desarme le garde avec une banane`
- Narrative: Action non comprise sur Garde. Essaie parler, attaquer, recruter, voler ou inspecter. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_020
- Input: `je soudoye le garde avec 1 or`
- Narrative: Action non comprise sur Garde. Essaie parler, attaquer, recruter, voler ou inspecter. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_021
- Input: `je recrute le garde`
- Narrative: Garde refuse de rejoindre ton groupe.
- Summary: no_meaningful_delta; ops=[set_entity_state,set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_022
- Input: `je parle au garde de physique quantique`
- Narrative: Garde te repond.
- Summary: no_meaningful_delta; ops=[set_entity_state,talk_actor]
- Flags: misroute=false, illusion=false, impact=true

### wtf_023
- Input: `j attaque le garde`
- Narrative: Ton coup touche Garde avec precision.
- Summary: hp -2 | gold +8 | incidents +1 | actor_state_changed; ops=[set_entity_state,attack_actor]
- Flags: misroute=false, illusion=false, impact=true

### wtf_024
- Input: `je recrute le roi demon`
- Narrative: Roi Demon refuse de rejoindre ton groupe.
- Summary: hp -6; ops=[set_entity_state,set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_025
- Input: `je parle au roi demon gentiment`
- Narrative: Roi Demon te repond.
- Summary: hp -6; ops=[set_entity_state,talk_actor]
- Flags: misroute=false, illusion=false, impact=true

### wtf_026
- Input: `je menotte le roi demon`
- Narrative: Action non comprise sur Roi Demon. Essaie parler, attaquer, recruter, voler ou inspecter. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: hp -6; ops=[none]
- Flags: misroute=false, illusion=false, impact=true

### wtf_027
- Input: `je vole les bottes du roi demon`
- Narrative: D un geste discret, tu subtilises l objet de Roi Demon. Ni vu ni connu.
- Summary: hp -6 | incidents +1; ops=[record_incident,set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_028
- Input: `je desactive l aura du roi demon`
- Narrative: Tu ne possedes pas cet objet.
- Summary: hp -6; ops=[set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_029
- Input: `j attaque le roi demon`
- Narrative: Ton coup touche Roi Demon avec precision.
- Summary: hp -6 | actor_state_changed; ops=[set_entity_state,attack_actor]
- Flags: misroute=false, illusion=false, impact=true

### wtf_030
- Input: `je recrute ce chat`
- Narrative: Chat accepte de te suivre.
- Summary: followers +1 | actor_state_changed; ops=[set_entity_state,set_entity_state,recruit_actor]
- Flags: misroute=false, illusion=false, impact=true

### wtf_031
- Input: `je parle au chat de politique`
- Narrative: Chat te repond.
- Summary: no_meaningful_delta; ops=[set_entity_state,talk_actor]
- Flags: misroute=false, illusion=false, impact=true

### wtf_032
- Input: `je marie le chat et le garde`
- Narrative: Action non comprise sur Chat. Essaie parler, attaquer, recruter, voler ou inspecter. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_033
- Input: `je sacrifie le chat au volcan`
- Narrative: Action non comprise sur Chat. Essaie parler, attaquer, recruter, voler ou inspecter. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_034
- Input: `je porte cet arbre sur mon dos`
- Narrative: Arbre pose sur foret.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_035
- Input: `je coupe cet arbre en 4 planches`
- Narrative: L obstacle cede.
- Summary: invQty +2 | tile_changed; ops=[none]
- Flags: misroute=false, illusion=false, impact=true

### wtf_036
- Input: `je mets le feu a cet arbre`
- Narrative: Tu detruis Arbre avec efficacite.
- Summary: tile_changed; ops=[none]
- Flags: misroute=false, illusion=false, impact=true

### wtf_037
- Input: `je cache un tresor sous cet arbre`
- Narrative: Tu te glisses dans l ombre. Personne ne te voit.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_038
- Input: `je transforme cet arbre en epee geante`
- Narrative: Arbre pose sur foret.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_039
- Input: `je fouille la ruine et je prends tout`
- Narrative: Tu recuperes un objet de Desert.
- Summary: invQty +1; ops=[transfer_item,set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_040
- Input: `je pose un piege laser ici`
- Narrative: Desert libre.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_041
- Input: `je detone la ruine`
- Narrative: Desert libre.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_042
- Input: `je grave un message sur la ruine`
- Narrative: Ta performance attire l attention. On t ecoute.
- Summary: gold +1; ops=[adjust_player_gold]
- Flags: misroute=false, illusion=false, impact=true

### wtf_043
- Input: `je me teleporte au donjon`
- Narrative: Le sort fonctionne. L energie magique atteint sa cible.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_044
- Input: `je vais a la boutique en moonwalk`
- Narrative: Tu te diriges vers Boutique.
- Summary: pos (24,25) -> (26,21); ops=[move_path]
- Flags: misroute=false, illusion=false, impact=true

### wtf_045
- Input: `je creuse un trou geant sous mes pieds`
- Narrative: Tu detruis le sol avec efficacite.
- Summary: tile_changed; ops=[none]
- Flags: misroute=false, illusion=false, impact=true

### wtf_046
- Input: `je brule la route`
- Narrative: Tu detruis la cible avec efficacite.
- Summary: tile_changed; ops=[none]
- Flags: misroute=false, illusion=false, impact=true

### wtf_047
- Input: `je frappe l air tres fort`
- Narrative: Aucune cible a attaquer a portee. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_048
- Input: `je recrute tous les monstres de la map`
- Narrative: Personne a recruter ici. Le monde n evolue pas encore; ajuste ta methode, ta cible ou ton outil.
- Summary: no_meaningful_delta; ops=[none]
- Flags: misroute=false, illusion=false, impact=false

### wtf_049
- Input: `je donne 1000 or au marchand`
- Narrative: Tu n as pas assez d or a offrir.
- Summary: no_meaningful_delta; ops=[set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

### wtf_050
- Input: `je vends la terre compacte au marchand`
- Narrative: Tu ne possedes pas cet objet.
- Summary: no_meaningful_delta; ops=[set_entity_state]
- Flags: misroute=false, illusion=false, impact=true

