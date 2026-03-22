# Sandbox Real Consequences Demo

Generated: 2026-03-21T03:46:02.555Z
Steps: 10
Steps with WorldOps: 10/10
Steps with actor impact: 9/10
Steps with map tile impact: 1/10

## Global State At End
- Position: (29,21)
- HP: 7/10
- Stress: 2
- Gold: 39
- Shop discount: 5%
- Followers: animal_cat_village
- Incidents total: 5

## Step By Step

### step_01 — Negociation boutique
- Input: `je negocie les prix`
- Resolved verb: `negotiate`
- Target: `structure:shop`
- Dice: 13
- Narrative: Le marchand accepte de faire un geste commercial.
- WorldOps: set_shop_discount(5%), set_entity_state(structure:shop)
- Player delta: hp +0, stress +0, gold +0, discount 0%->5%
- Position: (29,21)->(29,21)
- Inventory delta: none
- Followers: +[none], -[none]
- Incidents added: none
- Reputation delta: faction none, zone none
- Actor changes: none
- Tile changes: none

### step_02 — Achat apres negociation
- Input: `j achete potion de soin`
- Resolved verb: `buy`
- Target: `structure:shop`
- Dice: none
- Narrative: Boutique te vend Potion de soin.
- WorldOps: adjust_player_gold(-11), transfer_item(Potion de soin x1), record_incident(world_event, sev=1)
- Player delta: hp +0, stress +0, gold -11, discount 5%->5%
- Position: (29,21)->(29,21)
- Inventory delta: Potion de soin +1
- Followers: +[none], -[none]
- Incidents added: world_event(1) Une rumeur locale se propage.
- Reputation delta: faction none, zone none
- Actor changes: animal_cat_village: pos (21,28)->(21,27)
- Tile changes: none

### step_03 — Dialogue garde
- Input: `je parle au garde`
- Resolved verb: `talk`
- Target: `actor:npc_guard_road`
- Dice: none
- Narrative: Garde te repond.
- WorldOps: set_entity_state(actor:npc_guard_road), talk_actor(npc_guard_road), set_entity_state(actor:npc_guard_road)
- Player delta: hp +0, stress +0, gold +0, discount 5%->5%
- Position: (22,23)->(22,23)
- Inventory delta: none
- Followers: +[none], -[none]
- Incidents added: none
- Reputation delta: faction none, zone none
- Actor changes: animal_cat_village: pos (21,27)->(21,28)
- Tile changes: none

### step_04 — Combat monstre
- Input: `j attaque le monstre`
- Resolved verb: `attack`
- Target: `actor:hostile_0_goblin`
- Dice: 13
- Narrative: Tu engages Goblin au corps a corps. Action partiellement executee, mais l impact est limite. Degats infliges: 0. Degats recus: 2.
- WorldOps: adjust_player_hp(-2), adjust_player_stress(2)
- Player delta: hp -4, stress +2, gold +0, discount 5%->5%
- Position: (8,7)->(8,7)
- Inventory delta: none
- Followers: +[none], -[none]
- Incidents added: none
- Reputation delta: faction none, zone none
- Actor changes: npc_innkeeper: pos (24,21)->(24,20) | npc_villager_square_a: pos (20,22)->(20,21) | npc_villager_square_b: pos (25,22)->(25,21) | npc_guard_road: pos (22,24)->(22,23) | animal_dog_forest: pos (10,21)->(10,20)
- Tile changes: none

### step_05 — Recrutement animal
- Input: `je te recrute`
- Resolved verb: `recruit`
- Target: `actor:animal_cat_village`
- Dice: 13
- Narrative: Chat accepte de te suivre.
- WorldOps: set_entity_state(actor:animal_cat_village), set_entity_state(actor:animal_cat_village), recruit_actor(animal_cat_village, mode=tame), record_incident(world_event, sev=1)
- Player delta: hp +0, stress +0, gold +0, discount 5%->5%
- Position: (21,27)->(21,27)
- Inventory delta: none
- Followers: +[animal_cat_village], -[none]
- Incidents added: world_event(1) Une rumeur locale se propage.
- Reputation delta: faction none, zone none
- Actor changes: npc_guild_master: pos (18,21)->(19,21) | npc_innkeeper: pos (24,20)->(24,21) | npc_villager_square_a: pos (20,21)->(20,22) | npc_guard_road: pos (22,23)->(22,24) | animal_cat_village: faction wildlife->player_party
- Tile changes: none

### step_06 — Creuser le sol
- Input: `je creuse ici`
- Resolved verb: `dig`
- Target: `actor:hostile_0_goblin`
- Dice: none
- Narrative: Tu te rapproches de Goblin (14 cases) avant de lancer ton action.
- WorldOps: move_path(len=2)
- Player delta: hp +0, stress +0, gold +0, discount 5%->5%
- Position: (15,1)->(13,1)
- Inventory delta: none
- Followers: +[none], -[none]
- Incidents added: none
- Reputation delta: faction none, zone none
- Actor changes: npc_guild_master: pos (19,21)->(18,21) | npc_villager_square_b: pos (25,21)->(25,22) | npc_child_village: pos (21,19)->(21,18) | animal_dog_forest: pos (10,20)->(10,21)
- Tile changes: none

### step_07 — Bruler le meme point
- Input: `je brule ici`
- Resolved verb: `destroy`
- Target: `actor:hostile_0_goblin`
- Dice: none
- Narrative: Tu te rapproches de Goblin (14 cases) avant de lancer ton action.
- WorldOps: move_path(len=2)
- Player delta: hp +0, stress +0, gold +0, discount 5%->5%
- Position: (15,1)->(13,1)
- Inventory delta: none
- Followers: +[none], -[none]
- Incidents added: none
- Reputation delta: faction none, zone none
- Actor changes: npc_villager_square_b: pos (25,22)->(25,21) | npc_child_village: pos (21,18)->(21,19)
- Tile changes: none

### step_08 — Vol sur marchand
- Input: `je vole la bourse du marchand`
- Resolved verb: `steal`
- Target: `actor:npc_shopkeeper`
- Dice: 13
- Narrative: D un geste discret, tu subtilises l objet de Marchand. Ni vu ni connu.
- WorldOps: transfer_item(Bourse de marchand x1), set_entity_state(actor:npc_shopkeeper), record_incident(crime, sev=2)
- Player delta: hp +0, stress +0, gold +0, discount 5%->5%
- Position: (29,21)->(29,21)
- Inventory delta: Piece d or +1
- Followers: +[none], -[none]
- Incidents added: crime(2) L action est jugee agressive par des temoins. | world_event(4) La route du village a ete frappee par un raid.
- Reputation delta: faction none, zone none
- Actor changes: npc_villager_square_b: pos (25,21)->(25,22) | npc_guard_road: hostile false->true | npc_child_village: pos (21,19)->(21,18)
- Tile changes: (31,22) terrain village->village, prop none->hole, blocked false->false | (30,23) terrain road->road, prop none->hole, blocked false->false | (31,23) terrain village->village, prop none->crater, blocked false->false

### step_09 — Repos
- Input: `je me repose`
- Resolved verb: `rest`
- Target: `none`
- Dice: none
- Narrative: Tu prends un moment pour te reposer. Tu te sens un peu mieux.
- WorldOps: adjust_player_hp(3), adjust_player_stress(-4), record_incident(world_event, sev=1)
- Player delta: hp +3, stress -2, gold +0, discount 5%->5%
- Position: (29,21)->(29,21)
- Inventory delta: none
- Followers: +[none], -[none]
- Incidents added: world_event(1) Une rumeur locale se propage.
- Reputation delta: faction none, zone none
- Actor changes: npc_guild_master: pos (18,21)->(19,21) | npc_child_village: pos (21,18)->(21,19) | raid_demon_9: pos (31,22)->(31,21)
- Tile changes: none

### step_10 — Vente boutique
- Input: `je vends potion de soin`
- Resolved verb: `sell`
- Target: `actor:hostile_0_goblin`
- Dice: 13
- Narrative: Tu mobilises un objet en plein combat contre Goblin. Action partiellement executee, mais l impact est limite. Degats infliges: 0. Degats recus: 2.
- WorldOps: adjust_player_hp(-2), adjust_player_stress(2)
- Player delta: hp -2, stress +2, gold +0, discount 5%->5%
- Position: (29,21)->(29,21)
- Inventory delta: none
- Followers: +[none], -[none]
- Incidents added: none
- Reputation delta: faction none, zone none
- Actor changes: npc_guild_master: pos (19,21)->(18,21) | raid_demon_9: pos (31,21)->(30,21)
- Tile changes: none

## Persistence Checks
- Tile impact persisted after later steps: YES (sample: (31,22) terrain village->village, prop none->hole, blocked false->false).
- Follower persistence for animal_cat_village: YES.
- Shop discount changed: YES, persisted to end: YES.

