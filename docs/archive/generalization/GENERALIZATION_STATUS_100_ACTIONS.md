# Generalization Status + 100 Actions Matrix

Generated: 2026-03-20

## 1) Current generalization level (real, measured)

Source: `docs/SANDBOX_GENERALIZATION_REPORT.md`

- Actions tested: `1000`
- Crashes: `0`
- Parsed through new semantic draft layer: `828` (`83%`)
- Producing generic world operations: `356` (`36%`)
- Still handled by legacy pipeline: `230` (`23%`)
- Weak generic fallback: `0`
- Semantic misses on supported verbs: `36` (`4%`)
- Suspicious reroutes: `0`

### Practical reading

- The engine is no longer “hardcoded only”.
- The target routing is now reliable enough to avoid major misroutes (notably shop/boss confusion fixed).
- True systemic execution (`WorldOps`) exists and works, but coverage is still partial.
- Core blocker to “total sandbox freedom” remains: too much legacy behavior for `attack/talk/recruit` and many open-ended verbs.

## 2) Freedom feeling (player perception)

### Short-term freedom (current)

Estimated: `7/10`

- Good:
  - Trade/steal/loot/take/negotiate work with concrete state changes.
  - No-op guard prevents dead responses.
  - UI gets actionable deltas: movement, inventory, hp/stress/gold, bubbles, events.
- Weak:
  - Some valid actions still route to nearby “close enough” verbs instead of exact intent.
  - Combat/social still partially legacy, reducing systemic richness.

### Long-term systemic freedom (current)

Estimated: `5.5/10`

- Persistent in game state:
  - Tile scars (`hole`, `crater`, `charred`, `rubble`)
  - Inventory/equipment transfers
  - Reputation/faction and incidents/crimes
  - Bounties/followers/NPC hostility flags
- Persistence model today:
  - Server-authoritative per active session (memory map)
  - Client autosave in `localStorage`
  - Not yet a durable DB + replay log architecture
  - Server restart can drop in-memory authority; client save can still restore local run state

## 3) Action -> API -> World translation

Current API action flow:

1. `POST /api/solo/action` with `command` (`actionText`, `interaction`, `source`, `clientPosition`)
2. Server builds context + resolves action
3. Resolver outputs `SoloOutcome` (`worldOps` + compatibility fields)
4. Runtime applies changes, emits:
   - `events[]` (`economy_changed`, `reputation_changed`, `terrain_changed`, etc.)
   - `delta` (`inventoryChanges`, `tileChanges`, `hpDelta`, `goldDelta`, etc.)
5. Client renders world + UI from returned `state/outcome/delta/events`

## 4) 100 gradual actions (from basic to WTF)

Legend:
- Route: `VE`=Verb Engine, `LG`=Legacy resolver, `FC`=Fallback contained, `MX`=mixed
- Impact tags: `MOVE`, `INV`, `ECO`, `HP`, `STRESS`, `TILE`, `REP`, `INC`, `NPC`, `QUEST`
- LT = long-term persistence in current save/state model

1. `je vais au shop` | Route `LG` | `MOVE` via poi | UI: move/log | LT: yes (position/chunk)
2. `je parle au garde` | `VE/LG` | `NPC` bubble/log | LT: light memory tags possible
3. `je parle au marchand` | `VE/LG` | `NPC` + shop context | LT: dialogue history in log
4. `je regarde le sol` | `VE inspect` | narrative + bubble | LT: none/minor
5. `je me repose` | `VE rest` | `HP/STRESS` | LT: player stats saved
6. `j attaque le gobelin` | `VE/LG` | `HP` target/self + combat event | LT: actor death persists
7. `je recrute le villageois` | `VE/LG` | `NPC` follower attempt | LT: follower state persists
8. `je prends la pierre` | `VE take` | `INV` transfer if itemized | LT: inventory persists
9. `je fouille la ruine` | `VE loot/take` | `INV` if loot present | LT: inventory persists
10. `je detruis cette caisse` | `VE destroy` | `TILE`/destroy effect | LT: tile state persists
11. `j achete potion de soin` | `VE buy` | `ECO+INV+NPC` | LT: gold/inventory/shop demand
12. `je vends torche` | `VE sell` | `ECO+INV+NPC` | LT: gold/inventory/shop demand
13. `je negocie les prix` | `VE negotiate` | `ECO` discount + bubble | LT: discount persisted
14. `je vole la bourse du marchand` | `VE steal` | success:`INV`; fail:`INC+REP` | LT: incidents/reputation
15. `je vole l epee du demon` | `VE steal` | if success transfer from boss entity | LT: boss inventory/equipment effects
16. `je donne une potion au garde` | `VE give` | `INV` + social flavor | LT: inventory + potential memory tags
17. `j utilise ma potion` | `VE use` | `HP` recover | LT: hp/inventory
18. `je me cache derriere la maison` | `VE hide` | narrative + stealth modifiers | LT: mostly transient
19. `je lance un sort sur le monstre` | `VE cast` | combat-like effect | LT: hp/status
20. `je performe au centre du village` | `VE perform` | stress/rep flavor possible | LT: log + possible reputation
21. `je veux acheter une amulette de chance` | `VE buy` | `ECO+INV` | LT: item persistent
22. `je veux acheter crochet de serrure` | `VE buy` | `ECO+INV` | LT: item persistent
23. `je veux acheter herbe apaisante` | `VE buy` | `ECO+INV` | LT: item persistent
24. `je veux acheter petite bombe` | `VE buy` | `ECO+INV` | LT: item persistent
25. `je veux acheter bouclier en bois` | `VE buy` | `ECO+INV` | LT: item persistent
26. `je revends mon bouclier` | `VE sell` | `ECO+INV` | LT: shop stock/demand updated
27. `je negocie encore` | `VE negotiate` | discount adjust | LT: stored discount
28. `je menace le marchand pour un prix` | `MX` | may become negotiate/talk | LT: uncertain, mostly social log
29. `je parle au maitre de guilde pour une quete` | `VE/LG` | `NPC/QUEST` potential | LT: quest state persisted
30. `je vais au donjon` | `LG` | `MOVE` to poi gate | LT: position/discovery
31. `je vais a la citadelle` | `LG` | `MOVE` to boss gate | LT: position/discovery
32. `je creuse ici` | `LG/VE destroy-like` | `TILE` hole/ground effect | LT: tile scar persists
33. `je rebouche le trou` | `MX` | may remove/alter scar if resolved | LT: tile update persists
34. `je brule le sol` | `VE destroy` | `TILE` charred mark possible | LT: charred persists
35. `je brule cet arbre` | `VE destroy` | currently mapped as destroy | LT: terrain/prop changed if applied
36. `je casse la porte` | `MX` | if targetable as prop/structure: `TILE/INC` | LT: depends on target mapping
37. `je bloque le passage avec un objet` | `FC/MX` | often narrative/guarded | LT: limited until block verb generalized
38. `je jette une bombe` | `MX` | use/destroy depending parser | LT: partial
39. `je fouille le garde` | `VE loot/take` | target inventory transfer if available | LT: incidents possible
40. `je fouille le villageois` | `VE loot/take` | item transfer if target has items | LT: social consequences if crime
41. `je tue un villageois` | `VE/LG attack` | `HP` death + `INC+REP` + militia hostility | LT: strong persistent consequences
42. `je tue le chat` | `VE/LG attack` | `INC+REP` negative | LT: persistent incident/bounty impact
43. `je tue un demon` | `VE/LG attack` | hostile death + heroic rep gain | LT: persistent reputation shift
44. `je attaque devant un garde` | `VE/LG` | witness/crime chain | LT: militia response persists
45. `je vole devant un garde` | `VE steal` | fail likely -> `INC+REP` | LT: bounty/hostility chain
46. `je fuis apres un crime` | `MOVE` | escape now, consequences remain | LT: hostility persists
47. `je reviens au village apres crime` | `MOVE` | guards/militia can stay hostile | LT: persistent faction state
48. `je defends le village contre raid` | `combat/world tick` | heroic incidents | LT: reputation increases
49. `je parle a un pnj en boucle` | `VE/LG` | always feedback, no dead silence | LT: log/history grows
50. `je donne plusieurs objets a un pnj` | `VE give` | `INV` transfer repeated | LT: inventory + relation tags potential
51. `je me repose apres combat` | `VE rest` | hp/stress recovery | LT: stats saved
52. `je prends du bois` | `VE take/loot` | `INV` wood-like item if available | LT: inventory
53. `je craft un bouclier en bois` | `VE craft` | transform resources -> item if valid | LT: inventory/stat growth possible
54. `je craft une bombe` | `VE craft` | if recipe recognized | LT: inventory
55. `je utilise crochet de serrure` | `VE use` | contextual utility/narrative | LT: state depending outcome
56. `je cache un objet` | `VE hide/use` | partial support | LT: limited without full container system
57. `je intimide le marchand` | `MX/FC` | may map negotiate/talk | LT: weak unless incident generated
58. `je persuade le garde` | `MX` | often talk/recruit path | LT: limited memory effect
59. `je recrute un monstre` | `VE recruit` | difficult roll path | LT: follower persists if success
60. `je ordonne a mon follower de garder` | `world tick follower` | follower order/state | LT: persisted follower order
61. `je demande au marchand -10%` | `VE negotiate` | discount variable changes truly | LT: persistent discount
62. `je demande un prix pour 3 objets` | `MX` | per-item currently stronger than bundle | LT: partial
63. `je vends un objet vole` | `VE sell/MX` | can sell, “heat” model partial | LT: economy + incidents partial
64. `je vole puis je negocie` | `VE steal+negotiate` | chain consequences | LT: relation/rep may conflict
65. `je parle au roi demon` | `VE/LG talk` | bubble + narrative | LT: mostly narrative unless ops
66. `je attaque puis recrute` | `VE/LG` | inconsistent by context | LT: depends on actor alive/state
67. `je inspecte chaque case` | `VE inspect` | always explicit feedback | LT: no major state change
68. `je spam action absurde` | `FC` | explicit rejection/system consequence | LT: mostly log/stress
69. `je prie un rocher` | `FC` | safe contained, no crash | LT: negligible
70. `je negocie avec le vent` | `FC` | explicit non-effect feedback | LT: none
71. `je vole mon ombre` | `FC` | guarded response | LT: none
72. `je prends la lune` | `FC` | guarded response | LT: none
73. `je menotte le garde` | `LG/FC` | often downgraded talk today | LT: no robust cuff system yet
74. `je desarme le roi demon` | `LG` | mostly talk/legacy branch | LT: disarm not generalized yet
75. `je pose un piege` | `FC/MX` | mostly unsupported today | LT: no persistent trap system yet
76. `je bloque la boutique` | `FC/MX` | no robust block op yet | LT: limited
77. `je soudoye la milice` | `FC/MX` | can narrate, low systemic reliability | LT: partial
78. `je fais diversion puis je vole` | `MX` | may reduce to steal simple | LT: partial
79. `je fais un rituel interdit` | `FC/MX` | likely narrative + stress/event | LT: limited
80. `je sacrifie un item au demon` | `MX` | item transfer possible, systemic meaning partial | LT: inventory sure, lore partial
81. `je transporte un arbre` | `FC/MX` | not fully entity-physical yet | LT: not robust today
82. `je traine un corps` | `FC/MX` | body-as-object system partial | LT: limited
83. `je enterre un objet` | `FC/MX` | no full bury container pipeline yet | LT: weak
84. `je construis une barricade` | `FC/MX` | no generic build op yet | LT: weak
85. `je detourne une riviere` | `FC` | impossible context -> explicit reject | LT: none
86. `je fais exploser la place` | `MX` | can create `TILE` scars/events in some paths | LT: scars persist if applied
87. `je transforme le desert en foret` | `FC/MX` | large biome transform not generalized | LT: none/limited
88. `je clone un pnj` | `FC` | no clone op | LT: none
89. `je fusionne avec un monstre` | `FC/MX` | narrative possible, system weak | LT: minimal
90. `je convaincs tous les monstres de partir` | `FC/MX` | no global policy op yet | LT: minimal
91. `je declare une greve des marchands` | `FC/MX` | may touch shop state only indirectly | LT: limited
92. `je brule le donjon entier` | `FC/MX` | chunk-wide transformation not generalized | LT: limited
93. `je deplace la citadelle` | `FC` | impossible structure move globally | LT: none
94. `je remonte le temps` | `FC` | no timeline rewind system | LT: none
95. `je change la gravite` | `FC` | no physics continuous model | LT: none
96. `je deviens roi demon sans combat` | `FC/MX` | narrative only or blocked | LT: no robust faction transfer op
97. `je supprime toutes les collisions` | `FC` | engine constraints deny | LT: none
98. `je teleporte toute la map` | `FC` | not allowed as world op | LT: none
99. `je redemarre le monde` | `FC` | explicit reject / no-op guard | LT: none
100. `je veux que tout soit possible instantanément` | `FC` | explicit system limitation feedback | LT: none

## 5) What is truly persistent today (important)

### Yes, persistent in saved game state

- Player position/stats/hp/stress/gold/inventory
- Tile modifications (`hole/crater/charred/rubble`) when applied
- Actor alive/dead, follower states, militia hostility
- Reputation maps + incidents + bounties
- Shop discount and economy variables used by current systems

### Partially persistent / still fragile

- Some social memory tags are present but not yet universal
- Some advanced interactions are narrated but not fully simulated
- Several verbs still rely on legacy outcomes instead of pure `WorldOps`

### Not fully production-grade persistent yet

- No durable server database with replay log as single source of truth
- Server authority is in-memory session map; long-term durability depends on client autosave path
