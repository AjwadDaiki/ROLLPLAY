# Oracle20 — Couverture d'Actions (1000 idées joueur)

> Test de généralisation du Verb Engine V2.
> Pour chaque action : quel verbe la capte, résultat succès/échec, et si le moteur gère ou tombe sur l'IA.

**Légende :**
- ✅ Verb Engine gère entièrement
- 🤖 Tombe sur l'IA (fallback)
- ⚠️ Verb Engine partiel + IA narration

---

## A. COMBAT (1-120)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 1 | "j'attaque le slime" | ✅ attack | Dégâts infligés au slime, bulle combat | Dé bas → le slime esquive, joueur prend 2 dégâts |
| 2 | "je frappe le Roi Démon" | ✅ attack | Dégâts boss, narrative épique | Dé raté → boss contre-attaque violemment |
| 3 | "je donne un coup de poing au garde" | ✅ attack | Dégâts au garde, réputation milice -8 | Garde esquive, milice alertée |
| 4 | "je mords le loup" | ✅ attack | Dégâts au loup, bulle WTF | Le loup mord en retour, dégâts |
| 5 | "je tire une flèche sur le squelette" | ✅ attack | Flèche touche, dégâts | Flèche rate, squelette approche |
| 6 | "je lance ma torche sur le goblin" | ✅ attack | Dégâts feu au goblin | Torche tombe, goblin rit |
| 7 | "je défonce le bandit à coups de bouclier" | ✅ attack | Dégâts + stun narratif | Bouclier glisse, bandit riposte |
| 8 | "j'égorge le poulet" | ✅ attack | Poulet mort, viande? | C'est un poulet, auto-succès probable |
| 9 | "je décapite le zombie" | ✅ attack | Zombie éliminé si dé haut | Zombie résiste, continue d'avancer |
| 10 | "j'attaque le marchand" | ✅ attack | Dégâts, crime enregistré, milice hostile | Marchand esquive, crie à l'aide |
| 11 | "je fais un uppercut au démon" | ✅ attack | Gros dégâts si critical | Démon encaisse et contre |
| 12 | "je plante mon épée dans le boss" | ✅ attack | Dégâts arme, narrative héroïque | Boss pare l'épée |
| 13 | "j'attaque l'arbre" | ✅ destroy | Arbre détruit, bois récupéré | Arbre trop solide |
| 14 | "je frappe le sol de rage" | ✅ destroy | Cratère cosmétique | Rien ne se passe, stress +2 |
| 15 | "j'attaque le mur du donjon" | ✅ destroy | Mur fissuré, passage? | Mur intact, main endolorie |
| 16 | "je poignarde le fantôme" | ✅ attack | Si arme magique: dégâts | Lame traverse le fantôme sans effet |
| 17 | "je balance une bombe sur le groupe d'ennemis" | ✅ attack | Explosion, dégâts zone | Bombe n'explose pas / rate |
| 18 | "je fais un headbutt au squelette" | ✅ attack | Crâne fissuré, dégâts | Joueur se fait mal à la tête |
| 19 | "j'empale le slime avec un bâton" | ✅ attack | Slime percé, dégâts | Bâton glisse dans le slime |
| 20 | "je casse la mâchoire du loup" | ✅ attack | Dégâts critiques au loup | Loup esquive et mord |
| 21 | "j'étrangle le goblin" | ✅ attack | Goblin éliminé en mêlée | Goblin se débat, dégâts |
| 22 | "je fais un balayage au garde" | ✅ attack | Garde tombe, dégâts | Garde stable, contre-attaque |
| 23 | "je lance des pierres sur le démon" | ✅ attack | Dégâts distance | Pierres sans effet sur l'armure |
| 24 | "je saute sur le boss depuis un rocher" | ✅ attack | Dégâts bonus attaque aérienne | Atterrissage raté, dégâts self |
| 25 | "j'attaque tout le monde" | ✅ attack | Cible le plus proche hostile | Trop vague, attaque le premier venu |
| 26 | "je gifle le marchand" | ✅ attack | Dégâts faibles, crime léger | Marchand crie, réputation -4 |
| 27 | "je me bats avec le fantôme du donjon" | ✅ attack | Combat fantôme, dégâts si arme | Pas d'arme magique → 0 dégât |
| 28 | "je tue le rat" | ✅ attack | Rat éliminé, pas de loot | Rat esquive |
| 29 | "j'attaque par derrière" | ✅ attack | Bonus furtif si discretion haute | Repéré, pas de bonus |
| 30 | "je charge tête baissée" | ✅ attack | Dégâts + approche auto | Se prend un mur si pas de cible |
| 31 | "j'écrase le scarabée" | ✅ attack | Insecte mort | Insecte s'envole |
| 32 | "je plonge mon épée dans la lave pour frapper le boss" | ✅ attack | Dégâts feu bonus narratif | Épée fondue (narration IA) |
| 33 | "j'empoisonne ma lame et j'attaque" | 🤖 AI | Dégâts + poison DoT narratif | Poison mal appliqué |
| 34 | "j'utilise la magie pour attaquer" | ✅ attack | Dégâts magiques si stat magic haute | Spell fizzle |
| 35 | "je lance un sort de feu" | 🤖 AI | Boule de feu, dégâts zone | Sort raté, brûlure self |
| 36 | "j'invoque un familier pour combattre" | 🤖 AI | Familier apparaît (narratif) | Invocation échoue |
| 37 | "je fais exploser le baril à côté du goblin" | ✅ destroy | Explosion, goblin touché | Baril vide, pas d'effet |
| 38 | "j'utilise mon bouclier pour charger" | ✅ attack | Dégâts + knockback narratif | Charge bloquée |
| 39 | "je mets le feu au campement ennemi" | ✅ destroy | Campement brûle, ennemis fuient | Feu ne prend pas |
| 40 | "j'attaque le pont pour le faire tomber" | ✅ destroy | Pont détruit, passage bloqué | Pont trop solide |
| 41 | "je provoque le boss en duel" | ✅ attack | Combat 1v1, narrative épique | Boss ignore la provocation |
| 42 | "j'envoie mon compagnon attaquer" | 🤖 AI | Follower attaque la cible | Follower refuse/pas de follower |
| 43 | "je fais une feinte puis frappe" | ✅ attack | Bonus narratif sur critical | Feinte échoue, riposte |
| 44 | "j'attrape le squelette et le jette contre le mur" | ✅ attack | Dégâts + bulle action | Force insuffisante |
| 45 | "je crève les yeux du goblin" | ✅ attack | Dégâts + aveugle narratif | Goblin bloque les mains |
| 46 | "j'écrase la tête du zombie avec mon pied" | ✅ attack | Zombie éliminé si HP bas | Pied coincé dans le zombie |
| 47 | "j'utilise l'ennemi comme bouclier humain" | 🤖 AI | Prise d'otage narratif | Ennemi trop fort, se libère |
| 48 | "j'attaque avec les deux mains" | ✅ attack | Dégâts normaux + narration style | Standard attack |
| 49 | "je donne un coup de genou" | ✅ attack | Dégâts mêlée | Coup dévié |
| 50 | "j'arrache les ailes du démon" | ✅ attack | Dégâts + loot potentiel si kill | Ailes trop résistantes |
| 51 | "j'attaque le cristal au centre de la salle" | ✅ destroy | Cristal brisé, événement | Cristal protégé par magie |
| 52 | "je renverse la table sur les ennemis" | ✅ destroy | Table brisée, dégâts zone narratif | Table trop lourde |
| 53 | "j'assomme le garde par derrière" | ✅ attack | Garde KO si dé haut | Garde se retourne, combat |
| 54 | "je coupe la corde du pont-levis" | ✅ destroy | Pont tombe, accès ouvert/bloqué | Corde trop épaisse |
| 55 | "j'empoisonne le puits du village" | 🤖 AI | Réputation catastrophique, incident majeur | Pris sur le fait, prison |
| 56 | "je défie tous les monstres de la zone" | ✅ attack | Combat contre le plus proche | Pas de monstre en vue |
| 57 | "j'utilise ma corde pour étrangler le bandit" | ✅ attack | Dégâts + use item | Bandit coupe la corde |
| 58 | "je casse mon épée sur le boss" | ✅ attack | Dégâts + perte arme narratif | Épée rebondit |
| 59 | "j'attaque le toit pour le faire s'effondrer" | ✅ destroy | Effondrement, dégâts zone | Structure trop solide |
| 60 | "je combat à mains nues" | ✅ attack | Dégâts réduits, pas d'arme | Mains douloureuses |
| 61 | "j'attaque le coffre piégé" | ✅ destroy | Coffre détruit, piège neutralisé | Piège déclenché |
| 62 | "je frappe l'aubergiste" | ✅ attack | Dégâts, crime, ban de l'auberge | Aubergiste esquive, appelle la milice |
| 63 | "j'utilise un crochet de serrure comme arme" | ✅ attack | Dégâts faibles, arme improvisée | Crochet se casse |
| 64 | "je lance ma potion sur l'ennemi" | ✅ attack | Dégâts improvisation | Potion gâchée |
| 65 | "je protège le villageois" | 🤖 AI | Interception narratif, dégâts sur joueur | Arrive trop tard |
| 66 | "j'attrape la flèche en vol" | 🤖 AI | Réflexe héroïque narratif | Flèche touche le joueur |
| 67 | "je fais un combo d'attaques" | ✅ attack | Dégâts standard, narration combo | Premier coup raté = combo cassé |
| 68 | "j'attaque en utilisant la gravité" | ✅ attack | Saut + attaque narrative | Atterrissage raté |
| 69 | "je fais tomber le lustre sur les ennemis" | ✅ destroy | Lustre tombe, dégâts | Pas de lustre / raté |
| 70 | "j'utilise le corps du slime mort comme projectile" | ✅ attack | Dégâts + humiliation | Slime éclabousse le joueur |
| 71 | "je défends ma position" | 🤖 AI | Posture défensive, prochain tour bonus | Pas d'effet mécanique |
| 72 | "j'esquive" | 🤖 AI | Narratif d'esquive | Pas d'action offensive |
| 73 | "je pare le coup" | 🤖 AI | Réduction dégâts narratif | Coup trop puissant |
| 74 | "j'attaque le leader des bandits" | ✅ attack | Dégâts au leader, gang déstabilisé | Leader esquive, gang attaque |
| 75 | "j'éventre le sac du marchand" | ✅ steal | Or récupéré si dé haut | Pris en flagrant délit |
| 76 | "je casse les chaînes du prisonnier" | ✅ destroy | Prisonnier libéré, quête? | Chaînes trop solides |
| 77 | "j'attaque le totem magique" | ✅ destroy | Totem brisé, effet zone | Totem protégé, feedback magique |
| 78 | "j'écrase les potions de l'ennemi" | ✅ destroy | Potions détruites | Potions intactes |
| 79 | "je tranche la tente avec mon épée" | ✅ destroy | Tente déchirée, contenu visible | Tissu résiste |
| 80 | "j'attaque le sol sous l'ennemi" | ✅ destroy | Sol s'effondre narratif | Sol trop dur |
| 81 | "j'attrape l'arme de l'ennemi" | 🤖 AI | Désarme, arme récupérée | Ennemi tient bon |
| 82 | "je fonce dans le tas" | ✅ attack | Charge, dégâts au premier ennemi | Encerclé, dégâts multiples |
| 83 | "j'achève le monstre blessé" | ✅ attack | Exécution, butin | Monstre fait un dernier coup |
| 84 | "je déclenche le piège sur l'ennemi" | 🤖 AI | Piège activé, ennemi touché | Piège rate ou n'existe pas |
| 85 | "je pousse l'ennemi dans le vide" | ✅ attack | Ennemi tombe, éliminé | Ennemi s'accroche |
| 86 | "j'attaque avec ma torche enflammée" | ✅ attack | Dégâts feu, monstre recule | Torche s'éteint |
| 87 | "je brise le sceau qui retient le démon" | ✅ destroy | Sceau brisé, événement boss | Sceau résiste |
| 88 | "j'étouffe le feu avec mon manteau" | 🤖 AI | Feu éteint, manteau abîmé | Manteau prend feu |
| 89 | "je vise les jambes du boss" | ✅ attack | Dégâts + ralenti narratif | Boss trop blindé en bas |
| 90 | "je fais une attaque surprise en sortant du buisson" | ✅ attack | Bonus surprise si discretion OK | Repéré avant |
| 91 | "j'attaque avec mon amulette" | ✅ attack | Dégâts magiques faibles | Amulette pas une arme |
| 92 | "j'utilise la bombe sur le mur" | ✅ destroy | Mur détruit, passage ouvert | Mur trop épais |
| 93 | "j'attaque le piège" | ✅ destroy | Piège neutralisé | Piège déclenché |
| 94 | "je saute et j'attaque en l'air" | ✅ attack | Attaque aérienne narrative | Atterrissage raté |
| 95 | "je fais tournoyer mon épée" | ✅ attack | Zone narrative, dégâts | Perd l'équilibre |
| 96 | "j'attrape le monstre par la queue" | ✅ attack | Prise, dégâts grapple | Queue glissante |
| 97 | "j'utilise un os comme massue" | ✅ attack | Dégâts improvisation | Os se casse |
| 98 | "j'attaque l'oeuf du dragon" | ✅ destroy | Oeuf détruit | Maman dragon furieuse |
| 99 | "je coince l'ennemi entre deux rochers" | 🤖 AI | Piège improvisé, ennemi bloqué | Rochers trop loin |
| 100 | "je jette du sable dans les yeux du boss" | ✅ attack | Aveugle temporaire narratif | Boss a des lunettes (lol) |
| 101 | "j'arrache une branche pour me battre" | ✅ attack | Arme improvisée, dégâts faibles | Branche casse au premier coup |
| 102 | "j'enfonce la porte du donjon" | ✅ destroy | Porte détruite, accès | Porte blindée |
| 103 | "j'attaque le portail magique" | ✅ destroy | Portail fissuré | Feedback magique, dégâts self |
| 104 | "j'utilise l'environnement pour combattre" | 🤖 AI | IA interprète le contexte | Trop vague |
| 105 | "j'attaque le sol pour créer une fissure" | ✅ destroy | Fissure créée | Sol trop dur |
| 106 | "je balance le goblin sur un autre goblin" | ✅ attack | Dégâts double narratif | Force insuffisante |
| 107 | "j'attaque le cadavre pour être sûr" | ✅ attack | Pas de dégâts (déjà mort) | Validation: cible morte |
| 108 | "je mets le feu à la forêt" | ✅ destroy | Incendie, fuite monstres | Forêt trop humide |
| 109 | "j'utilise mon compagnon loup pour attaquer" | 🤖 AI | Follower attaque si present | Pas de compagnon |
| 110 | "j'attaque le marchand et je prends tout" | ✅ attack | Crime + dégâts, inventaire pas auto-volé | Milice intervient |
| 111 | "je frappe le sol avec mon marteau" | ✅ destroy | Impact au sol, prop change | Recul dans les mains |
| 112 | "j'attaque en criant très fort" | ✅ attack | Attaque normale + bulle speech cri | Cri n'aide pas |
| 113 | "j'attaque les deux ennemis en même temps" | ✅ attack | Un seul ciblé (le + proche) | Multi-cible pas supporté |
| 114 | "je frappe le cristal de mana" | ✅ destroy | Cristal brisé, explosion mana | Cristal absorbe le coup |
| 115 | "j'attaque le PNJ qui m'a trahi" | ✅ attack | Dégâts, crime si PNJ non-hostile | PNJ esquive, appelle à l'aide |
| 116 | "je combat le reflet dans le miroir" | 🤖 AI | Combat symbolique narratif | Miroir se brise |
| 117 | "je me bats contre mon ombre" | 🤖 AI | Narration philosophique | Pas de cible réelle |
| 118 | "je vise le point faible du boss" | ✅ attack | Dégâts bonus si legendary | Pas de point faible trouvé |
| 119 | "j'attaque la statue" | ✅ destroy | Statue brisée, matériaux | Statue trop solide |
| 120 | "je fais un massacre au village" | ✅ attack | Attaque le PNJ le + proche, crime massif | Milice riposte immédiatement |

---

## B. COMMERCE (121-200)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 121 | "j'achète une potion" | ✅ buy | -12 or, potion ajoutée | Pas assez d'or / pas au shop |
| 122 | "j'achète une épée en fer" | ✅ buy | -18 or, épée ajoutée | Or insuffisant |
| 123 | "achète torche" | ✅ buy | -8 or, torche ajoutée | Or/distance shop |
| 124 | "je veux une corde" | ✅ buy | -10 or, corde | Pas au shop |
| 125 | "j'achète tout le stock" | ✅ buy | Achète 1er item trouvé | Or insuffisant pour tout |
| 126 | "je prends une ration" | ✅ buy | -6 or, ration | Ambiguïté take/buy, résolu par proximité shop |
| 127 | "j'achète un bouclier" | ✅ buy | -15 or, bouclier bois | Or insuffisant |
| 128 | "j'achète l'herbe apaisante" | ✅ buy | -10 or, herbe | Pas d'or |
| 129 | "donne moi une bombe" | ✅ buy | -20 or, petite bombe | Or insuffisant |
| 130 | "achète un crochet de serrure" | ✅ buy | -14 or, lockpick | Pas au shop |
| 131 | "j'achète l'amulette de chance" | ✅ buy | -25 or, amulette | Trop cher |
| 132 | "je vends mon épée" | ✅ sell | +or (55% du prix), item retiré | Pas au shop / pas dans inventaire |
| 133 | "je vends tout mon inventaire" | ✅ sell | Vend 1 item (le premier) | Inventaire vide |
| 134 | "je vends la potion" | ✅ sell | +6 or environ | Pas de potion |
| 135 | "je revends le bouclier" | ✅ sell | +8 or environ | Pas de bouclier |
| 136 | "j'échange mon épée contre une potion" | 🤖 AI | Vente + achat en séquence narrative | Pas supporté atomiquement |
| 137 | "combien coûte la potion ?" | ✅ inspect | Affiche prix: 12 or | — |
| 138 | "montre moi le stock" | ✅ inspect | Liste des items + prix | Pas au shop |
| 139 | "je négocie le prix de l'épée" | ✅ negotiate | Dé → réduction 5-35% | Dé bas → pas de réduction |
| 140 | "je marchande avec le marchand" | ✅ negotiate | Discount appliqué | Échec négo |
| 141 | "je demande une remise" | ✅ negotiate | Discount si dé OK | Marchand refuse |
| 142 | "je négocie un prix de groupe" | ✅ negotiate | Discount global | Marchand inflexible |
| 143 | "j'achète 3 potions" | ✅ buy | Achète 1 potion (qty=1 par action) | Or insuffisant |
| 144 | "j'achète un truc pas dans le catalogue" | ✅ buy | findShopCatalogEntry → null → échec | "Pas en stock" |
| 145 | "j'achète une maison" | ✅ buy | Pas dans le catalogue → refus | Marchand confus |
| 146 | "j'achète le marchand" | 🤖 AI | Narration absurde, refus | On n'achète pas les gens |
| 147 | "je vends le marchand" | 🤖 AI | Narration absurde | Pas un objet |
| 148 | "je vends de l'air" | ✅ sell | Pas dans inventaire → échec | "Rien à vendre" |
| 149 | "j'achète avec l'or volé" | ✅ buy | Achat normal (or = or) | Or insuffisant |
| 150 | "je paie le double pour impressionner" | 🤖 AI | Achat + réputation bonus narratif | — |
| 151 | "je demande un échantillon gratuit" | 🤖 AI | Marchand refuse poliment | — |
| 152 | "j'achète une potion et je la bois direct" | ✅ buy | Achat puis use au tour suivant | Or insuffisant |
| 153 | "je fais du troc" | 🤖 AI | Échange narratif | Marchand préfère l'or |
| 154 | "j'ouvre un stand de vente" | 🤖 AI | Narratif marchand improvisé | Pas de mécanique |
| 155 | "je vends les matériaux récupérés" | ✅ sell | +or pour item "bois"/"pierre" | Pas de matériaux |
| 156 | "j'arnaque le marchand" | ✅ negotiate | Discount extrême si legendary | Marchand se méfie |
| 157 | "je paie avec des faux or" | 🤖 AI | Crime, réputation --, milice | Pas de mécanique faux or |
| 158 | "j'achète un cadeau pour le PNJ" | ✅ buy | Achat normal, item en inventaire | Or insuffisant |
| 159 | "j'achète des provisions pour le voyage" | ✅ buy | Ration achetée | Or insuffisant |
| 160 | "je vends mon âme au démon" | 🤖 AI | Pacte narratif, conséquences RP | Démon pas intéressé |
| 161 | "combien tu me rachètes ça ?" | ✅ inspect | Prix revente affiché | Pas au shop |
| 162 | "je fais faillite, j'ai plus rien" | 🤖 AI | Narration de misère | Pas une action |
| 163 | "j'investis dans le shop" | 🤖 AI | Investissement narratif | Pas de mécanique |
| 164 | "j'achète les clés du donjon" | ✅ buy | Pas dans catalogue → refus | Pas un item standard |
| 165 | "je vends les ailes du monstre" | ✅ sell | +or si item en inventaire | Pas d'ailes |
| 166 | "j'achète de la nourriture pour mon compagnon" | ✅ buy | Ration achetée | Or insuffisant |
| 167 | "je revends l'amulette au double du prix" | ✅ sell | Prix fixe (55%), pas de surenchère | Pas d'amulette |
| 168 | "j'achète un animal de compagnie" | 🤖 AI | Pas dans catalogue | Narratif refus |
| 169 | "j'achète et je repars sans payer" | ✅ steal | Vol du shop, crime | Pris en flagrant délit |
| 170 | "je négocie ma liberté avec le garde" | ✅ negotiate | Discount/pot-de-vin narratif | Garde incorruptible |

---

## C. VOL & DISCRÉTION (171-270)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 171 | "je vole le marchand" | ✅ steal | Item volé, -6 réputation si pris | Pris → crime, milice alertée |
| 172 | "je pickpocket le garde" | ✅ steal | Or ou item volé | Pris, combat immédiat |
| 173 | "je vole dans le coffre du shop" | ✅ steal | Item volé du shop | Coffre verrouillé/pris |
| 174 | "je me faufile derrière le PNJ et vole sa bourse" | ✅ steal | Or volé si dé ≥ DC14 | Repéré, incident |
| 175 | "je vole les potions du marchand" | ✅ steal | Potion volée | Pris en flagrant délit |
| 176 | "je fouille les poches du mort" | ✅ take | Loot du cadavre | Pas de cadavre/rien |
| 177 | "je vole l'épée du garde endormi" | ✅ steal | Épée récupérée | Garde se réveille |
| 178 | "je me cache dans l'ombre" | 🤖 AI | Narratif stealth | Pas de mécanique d'ombre |
| 179 | "je me déguise en marchand" | 🤖 AI | Déguisement narratif | Repéré |
| 180 | "je vole la clé du donjon" | ✅ steal | Clé volée si PNJ l'a | PNJ n'a pas de clé |
| 181 | "je subtilise l'amulette du boss" | ✅ steal | DC18 (legendary) → amulette | Boss trop vigilant |
| 182 | "je vole de la nourriture" | ✅ steal | Ration volée | Pris |
| 183 | "je me glisse dans le shop la nuit" | 🤖 AI | Infiltration narrative | Pas de cycle jour/nuit |
| 184 | "je crochète la serrure" | 🤖 AI | Porte ouverte si lockpick | Pas de lockpick |
| 185 | "j'espionne la conversation du garde" | ✅ inspect | Info récupérée | Trop loin pour entendre |
| 186 | "je vole les plans du donjon" | ✅ steal | Plans volés narratif | Pas de plans |
| 187 | "je fais diversion pour voler" | 🤖 AI | Bonus vol narratif | Diversion échoue |
| 188 | "je vole le cheval du garde" | ✅ steal | Cheval volé narratif | Pas de cheval en jeu |
| 189 | "je vole et je m'enfuis" | ✅ steal | Vol + fuite narratif | Pris avant de fuir |
| 190 | "je vole les ailes du démon" | ✅ steal | DC18 → ailes volées narratif | Impossible physiquement |
| 191 | "je me cache sous un tonneau" | 🤖 AI | Caché narratif | Tonneau trop petit |
| 192 | "je rampe sous les gardes" | 🤖 AI | Passage furtif | Repéré |
| 193 | "je vole l'or du temple" | ✅ steal | Or volé, réputation temple -- | Prêtres alertent |
| 194 | "je truque les dés du joueur" | 🤖 AI | Arnaque narrative | Pas de joueur |
| 195 | "je vole l'armure du squelette" | ✅ steal | Armure récupérée | Squelette se défend |
| 196 | "je suis le PNJ discrètement" | 🤖 AI | Filature narrative | Repéré |
| 197 | "je vole le trône du boss" | ✅ steal | Trop lourd → échec humoristique | Pas transportable |
| 198 | "je dérobe la couronne du roi" | ✅ steal | DC18 → couronne | Gardes partout |
| 199 | "je vole les gemmes des statues" | ✅ steal | Gemmes récupérées | Statues piégées |
| 200 | "je fais les poches à tout le village" | ✅ steal | Vol sur le PNJ le + proche | Crime massif |
| 201 | "je vole la recette secrète de l'aubergiste" | ✅ steal | Recette narrative | Pas de recette en inventaire PNJ |
| 202 | "je subtilise le poison du marchand" | ✅ steal | Poison narratif | Pas de poison en stock |
| 203 | "je vole les provisions du campement" | ✅ steal | Rations volées | Campement gardé |
| 204 | "je m'infiltre dans le donjon par les égouts" | 🤖 AI | Passage secret narratif | Pas d'égouts |
| 205 | "je vole la carte au trésor" | ✅ steal | Carte narrative | Pas de carte |
| 206 | "je prends l'épée dans la pierre" | ✅ take | Épée légendaire narratif | Épée reste coincée |
| 207 | "je vole les bottes du marchand" | ✅ steal | Bottes volées | Marchand les porte |
| 208 | "je me fais passer pour un garde" | 🤖 AI | Infiltration | Démasqué |
| 209 | "je crochète le coffre au trésor" | 🤖 AI | Coffre ouvert, loot | Pas de lockpick / piégé |
| 210 | "je vole pendant que le garde dort" | ✅ steal | DC réduit narratif | Garde fait semblant |
| 211 | "je pique la torche du mur" | ✅ take | Torche récupérée | Torche fixée |
| 212 | "je vole les flèches du squelette archer" | ✅ steal | Flèches volées | Squelette tire |
| 213 | "je dérobe le grimoire du mage" | ✅ steal | Grimoire narratif | Mage protège |
| 214 | "je fais un trou dans la bourse du PNJ" | ✅ steal | Or tombe, récupéré | PNJ remarque |
| 215 | "je vole le chapeau du marchand" | ✅ steal | Chapeau narratif | Marchand furieux |
| 216 | "je vole les yeux du boss" | ✅ steal | Absurde, échec | Pas faisable |
| 217 | "je pille les ruines" | ✅ take | Matériaux récupérés | Ruines vides |
| 218 | "je fouille le cadavre du boss" | ✅ take | Loot épique | Pas de cadavre boss |
| 219 | "je ramasse tout ce qui traîne" | ✅ take | Item le + proche | Rien par terre |
| 220 | "je vole discrètement pendant le combat" | ✅ steal | Opportunisme vol | Combat occupe tout |
| 221 | "je kidnappe le marchand" | 🤖 AI | Prise d'otage, crime | Marchand se défend |
| 222 | "je planque l'or dans un buisson" | 🤖 AI | Or caché narratif | Pas de mécanique cache |
| 223 | "je fouille la maison abandonnée" | ✅ inspect | Description + loot potentiel | Maison vide |
| 224 | "je récupère les pièces par terre" | ✅ take | Or ramassé | Pas de pièces |
| 225 | "je vole le familier du mage" | ✅ steal | Animal volé narratif | Familier mord |
| 226 | "je vole les matériaux de construction" | ✅ steal | Bois/pierre volés | Pas de matériaux |
| 227 | "je prends l'arme du garde mort" | ✅ take | Arme récupérée | Garde pas mort |
| 228 | "je fouille le tonneau suspect" | ✅ inspect | Contenu révélé | Tonneau vide |
| 229 | "je vole le secret du PNJ" | 🤖 AI | Information narrative | Pas de secret mécanique |
| 230 | "je me cache dans le foin" | 🤖 AI | Caché | Allergique au foin narratif |
| 231 | "je vole pendant la diversion de mon allié" | ✅ steal | Bonus narratif | Pas d'allié |
| 232 | "je subtilise le contrat du guild master" | ✅ steal | Contrat narratif | Guild master vigilant |
| 233 | "je piège le coffre après l'avoir vidé" | 🤖 AI | Piège placé narratif | Pas de mécanique piège |
| 234 | "je remplace le contenu du coffre par des cailloux" | 🤖 AI | Arnaque narrative | Pas de mécanique |
| 235 | "je vole l'identité du garde" | 🤖 AI | Déguisement + infiltration | Trop complexe |
| 236 | "je siphonne l'énergie du cristal" | 🤖 AI | Mana narrative | Pas de mécanique mana |
| 237 | "j'empoche les gemmes du lustre" | ✅ steal | Gemmes récupérées | Lustre trop haut |
| 238 | "je vole la selle du cheval" | ✅ steal | Selle narrative | Pas de cheval |
| 239 | "je détourne la livraison du shop" | 🤖 AI | Items interceptés | Pas de livraison |
| 240 | "je vole les rêves du PNJ" | 🤖 AI | Absurde, narration magique | Pas possible |
| 241 | "je récupère le butin du donjon" | ✅ take | Loot ramassé | Pas de loot |
| 242 | "je vole la statue du temple" | ✅ steal | Trop lourde | Crime religieux |
| 243 | "je me fais invisible pour voler" | 🤖 AI | Invisibilité + vol narratif | Pas de sort |
| 244 | "je vole le coeur du golem" | ✅ steal | DC18 → coeur magique | Golem écrase le bras |
| 245 | "je fouille les décombres" | ✅ inspect | Matériaux/items | Décombres vides |
| 246 | "je vole les offrandes de l'autel" | ✅ steal | Offrandes prises, malédiction? | Prêtre furieux |
| 247 | "je récupère les flèches tirées" | ✅ take | Flèches récupérées | Flèches cassées |
| 248 | "je ramasse les champignons" | ✅ take | Champignons récupérés | Toxiques? |
| 249 | "je prends les herbes médicinales" | ✅ take | Herbes ajoutées | Pas d'herbes |
| 250 | "je vole le mécanisme du piège" | ✅ steal | Mécanisme récupéré | Piège se déclenche |
| 251 | "je suis un voleur professionnel" | 🤖 AI | Narration de classe | Pas une action |
| 252 | "je fouille toutes les poches de tous les PNJ" | ✅ steal | Vol sur le + proche | Crime en série |
| 253 | "je dérobe le sceptre magique" | ✅ steal | Sceptre si DC legendary | Protégé |
| 254 | "je récupère les échantillons de minerai" | ✅ take | Minerai ajouté | Pas de minerai |
| 255 | "je pille le camp ennemi abandonné" | ✅ take | Loot camp | Camp pas abandonné |
| 256 | "je vole la nourriture de l'auberge" | ✅ steal | Rations volées | Aubergiste voit |
| 257 | "je choure le journal intime du PNJ" | ✅ steal | Journal narratif | PNJ le protège |
| 258 | "je prends les pièges désactivés" | ✅ take | Piège en inventaire | Piège actif → dégâts |
| 259 | "je vole les clochettes du temple" | ✅ steal | Clochettes narratif | Bruit alerte tout le monde |
| 260 | "je récupère le bois flotté" | ✅ take | Bois ajouté | Pas de bois flotté |
| 261 | "je me faufile par la fenêtre" | 🤖 AI | Infiltration | Pas de fenêtre |
| 262 | "je vole l'antidote" | ✅ steal | Antidote volé | Pas d'antidote |
| 263 | "je cache mon butin dans un arbre creux" | 🤖 AI | Cache narrative | Pas de mécanique |
| 264 | "je vole les fers du prisonnier" | ✅ steal | Chaînes récupérées | Trop lourdes |
| 265 | "je dérobe les plans de guerre" | ✅ steal | Plans narratif | Pas de plans |
| 266 | "je fouille sous le lit de l'auberge" | ✅ inspect | Trouvaille narrative | Rien |
| 267 | "je vole le calice sacré" | ✅ steal | Calice volé, malédiction? | Temple gardé |
| 268 | "je ramasse les éclats du cristal brisé" | ✅ take | Éclats ajoutés | Pas d'éclats |
| 269 | "je vole le temps du PNJ" | 🤖 AI | Métaphore, narration drôle | Pas possible |
| 270 | "je récupère l'essence de slime" | ✅ take | Essence slime narrative | Pas de slime mort |

---

## D. DÉPLACEMENT (271-370)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 271 | "j'avance vers le nord" | ✅ move | Déplacement nord | Obstacle/mur |
| 272 | "je vais au shop" | ✅ move | Pathfinding → shop | Déjà au shop |
| 273 | "j'entre dans le donjon" | ✅ move | Déplacement vers donjon | Trop loin |
| 274 | "je vais à l'auberge" | ✅ move | Pathfinding → inn | Déjà à l'auberge |
| 275 | "je retourne au village" | ✅ move | Path vers centre village | Déjà au village |
| 276 | "je m'approche du boss" | ✅ move | Déplacement vers boss | Déjà adjacent |
| 277 | "je fuis" | ✅ move | Déplacement opposé aux hostiles | Encerclé |
| 278 | "je cours vers la sortie" | ✅ move | Pathfinding sortie | Pas de sortie |
| 279 | "je me déplace vers l'est" | ✅ move | Déplacement est | Mur |
| 280 | "j'explore la forêt" | ✅ move | Déplacement vers forêt | Déjà en forêt |
| 281 | "je traverse la rivière" | ✅ move | Si tile pas bloquée | Eau bloquée |
| 282 | "je grimpe la montagne" | ✅ move | Déplacement vers montagne | Tile bloquée |
| 283 | "je descends dans la cave" | ✅ move | Déplacement vers cave/donjon | Pas de cave |
| 284 | "je vais voir le garde" | ✅ move | Approche du garde | Garde pas trouvé |
| 285 | "je marche vers le marchand" | ✅ move | Approche marchand | Déjà adjacent |
| 286 | "je vais au sud-ouest" | ✅ move | Déplacement diagonal (2 moves) | Obstacle |
| 287 | "j'entre dans la guilde" | ✅ move | Pathfinding → guild | Déjà dans la guilde |
| 288 | "je me téléporte" | 🤖 AI | Pas de téléportation | Pas de mécanique |
| 289 | "je saute par-dessus le mur" | 🤖 AI | Saut narratif | Mur trop haut |
| 290 | "je nage" | ✅ move | Si tile eau accessible | Eau bloquée |
| 291 | "je creuse un tunnel" | 🤖 AI | Tunnel narratif | Trop long |
| 292 | "je vole" | 🤖 AI | Pas d'ailes | Impossible |
| 293 | "je m'éloigne du combat" | ✅ move | Fuite, déplacement opposé | Encerclé |
| 294 | "j'avance prudemment" | ✅ move | Déplacement normal | Piège? |
| 295 | "je fonce tout droit" | ✅ move | Déplacement rapide | Mur/obstacle |
| 296 | "j'escalade le mur du donjon" | 🤖 AI | Escalade narrative | Mur lisse |
| 297 | "je me cache derrière un arbre" | 🤖 AI | Stealth narratif | Pas d'arbre |
| 298 | "je contourne l'ennemi" | ✅ move | Pathfinding autour | Pas de chemin |
| 299 | "je recule" | ✅ move | Déplacement arrière | Mur derrière |
| 300 | "je vais à la citadelle du démon" | ✅ move | Path vers zone boss | Très loin |
| 301 | "je me place en hauteur" | 🤖 AI | Position haute narrative | Pas de relief |
| 302 | "je rampe vers l'ennemi" | ✅ move | Déplacement furtif narratif | Repéré |
| 303 | "j'entre dans la maison" | ✅ move | Déplacement vers POI | Pas de maison |
| 304 | "je suis le chemin" | ✅ move | Suit la route | Déjà sur la route |
| 305 | "je vais vers la lumière" | ✅ move | Déplacement narratif | Pas de lumière |
| 306 | "je marche dans le désert" | ✅ move | Déplacement zone désert | Déjà dans le désert |
| 307 | "je retourne sur mes pas" | ✅ move | Retour position précédente | Pas de mémoire position |
| 308 | "j'avance de 3 cases" | ✅ move | Déplacement 3 tiles max | Obstacle avant |
| 309 | "je sprinte vers le boss" | ✅ move | Approche rapide boss | Déjà adjacent |
| 310 | "je me planque dans les hautes herbes" | 🤖 AI | Stealth narratif | Pas de hautes herbes |
| 311 | "je saute par-dessus le fossé" | 🤖 AI | Saut réussi | Fossé trop large |
| 312 | "je plonge dans l'eau" | ✅ move | Si tile eau non-bloquée | Noyade narratif |
| 313 | "j'explore la zone inconnue" | ✅ move | Déplacement vers tile non-visitée | Tout exploré |
| 314 | "je vais là où il y a du bruit" | 🤖 AI | Déplacement narratif | Pas de son |
| 315 | "je cherche un passage secret" | ✅ inspect | Description murs/sol | Pas de passage |
| 316 | "je pousse la pierre pour ouvrir le passage" | 🤖 AI | Passage ouvert | Pierre immobile |
| 317 | "je descends les escaliers" | ✅ move | Déplacement vers bas | Pas d'escaliers |
| 318 | "je monte sur le toit" | 🤖 AI | Position haute | Pas de toit accessible |
| 319 | "je traverse le pont" | ✅ move | Pathfinding pont | Pont détruit |
| 320 | "je vais vers le feu de camp" | ✅ move | Déplacement vers camp | Pas de camp |
| 321 | "j'avance dans le noir" | ✅ move | Déplacement + risque piège | Piège? |
| 322 | "je longe le mur" | ✅ move | Déplacement le long du mur | Impasse |
| 323 | "j'entre dans la taverne" | ✅ move | Pathfinding → inn | Pas de taverne |
| 324 | "je vais où est le trésor" | ✅ move | Déplacement narratif | Pas de trésor connu |
| 325 | "je quitte le village" | ✅ move | Déplacement hors village | Déjà hors village |
| 326 | "je vais m'entraîner dans la forêt" | ✅ move | Déplacement forêt | Déjà en forêt |
| 327 | "je cherche un endroit sûr" | ✅ move | Déplacement vers inn/guild | Nulle part sûr |
| 328 | "j'entre dans l'arène" | ✅ move | Déplacement narratif | Pas d'arène |
| 329 | "je passe par-dessus la clôture" | 🤖 AI | Saut clôture | Barbelés |
| 330 | "je m'enfuis en courant" | ✅ move | Fuite rapide | Encerclé |
| 331 | "je me rapproche du feu" | ✅ move | Déplacement vers prop feu | Pas de feu |
| 332 | "je vais à la source" | ✅ move | Déplacement vers eau | Pas de source |
| 333 | "je me positionne derrière l'ennemi" | ✅ move | Positionnement tactique | Ennemi se retourne |
| 334 | "j'avance vers le portail" | ✅ move | Déplacement portail | Pas de portail |
| 335 | "je pars à l'aventure" | ✅ move | Déplacement aléatoire | Déjà en aventure |
| 336 | "je vais au cimetière" | ✅ move | Déplacement zone | Pas de cimetière |
| 337 | "je traverse la place du village" | ✅ move | Déplacement village centre | Déjà sur place |
| 338 | "j'escalade l'arbre" | 🤖 AI | En haut narratif | Arbre glissant |
| 339 | "je saute de toit en toit" | 🤖 AI | Parkour narratif | Pas de toits |
| 340 | "je me cache dans la grotte" | ✅ move | Déplacement grotte | Pas de grotte |
| 341 | "je glisse le long de la pente" | ✅ move | Déplacement rapide | Chute, dégâts |
| 342 | "je fais le tour du lac" | ✅ move | Contournement eau | Trop loin |
| 343 | "j'entre dans la tente" | ✅ move | Déplacement tente | Pas de tente |
| 344 | "je m'approche discrètement" | ✅ move | Approche furtive | Repéré |
| 345 | "je vais vers la mesa" | ✅ move | Déplacement zone désert | Loin |
| 346 | "je passe par les bois" | ✅ move | Déplacement forêt | Obstacle |
| 347 | "je suis les traces de sang" | 🤖 AI | Piste narrative | Pas de traces |
| 348 | "je retourne à mon point de spawn" | ✅ move | Path vers respawnPosition | Déjà là |
| 349 | "j'avance en formation avec mes alliés" | ✅ move | Déplacement + followers suivent | Pas d'alliés |
| 350 | "je zigzague entre les arbres" | ✅ move | Déplacement forêt | Pas d'arbres |
| 351 | "je cours vers le PNJ en danger" | ✅ move | Approche PNJ | Pas de PNJ en danger |
| 352 | "je m'enfonce dans le donjon" | ✅ move | Deeper into dungeon | Déjà au fond |
| 353 | "j'erre sans but" | ✅ move | Déplacement aléatoire | Pas de but = pas de path |
| 354 | "je vais voir ce qu'il y a derrière la colline" | ✅ move | Exploration | Pas de colline |
| 355 | "je me réfugie dans l'auberge" | ✅ move | Path → inn | Déjà à l'auberge |
| 356 | "je cours aussi vite que possible" | ✅ move | Déplacement max tiles | Obstacle |
| 357 | "je me place entre l'ennemi et le villageois" | ✅ move | Positionnement | Pas de villageois en danger |
| 358 | "je fais demi-tour" | ✅ move | Retour direction opposée | Mur |
| 359 | "je vais explorer le cratère" | ✅ move | Déplacement vers cratère | Pas de cratère |
| 360 | "je vais vers le son de la bataille" | ✅ move | Vers le + proche hostile | Pas de combat |
| 361 | "je cherche la sortie du labyrinthe" | ✅ move | Pathfinding sortie | Pas de labyrinthe |
| 362 | "j'avance vers le trône du boss" | ✅ move | Path vers zone boss | Loin |
| 363 | "je m'installe près de la rivière" | ✅ move | Déplacement eau | Pas de rivière |
| 364 | "je suis le PNJ" | ✅ move | Approche PNJ | PNJ pas trouvé |
| 365 | "je vais à la forge" | ✅ move | Pas de forge → move aléatoire | Pas de POI forge |
| 366 | "je rentre chez moi" | ✅ move | Path → respawnPosition | Déjà chez soi |
| 367 | "j'avance case par case" | ✅ move | 1 tile move | Normal |
| 368 | "je m'enfuis vers le désert" | ✅ move | Path vers désert | Bloqué |
| 369 | "je vais voir ce que veut le PNJ" | ✅ move | Approche PNJ + talk | PNJ pas trouvé |
| 370 | "je cours rejoindre mon compagnon" | ✅ move | Path vers follower | Pas de follower |

---

## E. SOCIAL & DIALOGUE (371-500)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 371 | "je parle au marchand" | ✅ talk | Dialogue marchand, stock affiché | Trop loin |
| 372 | "je parle au garde" | ✅ talk | Dialogue garde, info zone | Trop loin |
| 373 | "je salue le PNJ" | ✅ talk | Réponse polie | PNJ hostile |
| 374 | "je demande des infos sur le donjon" | ✅ talk | Info narrative sur donjon | Pas de PNJ nearby |
| 375 | "je demande au garde de m'entraîner" | ✅ talk | Entraînement narratif | Garde refuse |
| 376 | "je supplie le boss de m'épargner" | ✅ talk | Boss rit, narratif | Boss attaque quand même |
| 377 | "je menace le marchand" | ✅ talk | Marchand intimidé, discount? | Marchand appelle la garde |
| 378 | "je drague l'aubergiste" | ✅ talk | Réponse embarrassée/amusée | Rejet |
| 379 | "je raconte une blague au garde" | ✅ talk | Garde rit, mood améliore | Blague nulle |
| 380 | "je recrute le loup" | ✅ recruit | Dé ≥ DC11 → loup tamed | Loup grogne et attaque |
| 381 | "je recrute le goblin" | ✅ recruit | Dé ≥ DC15 → goblin rejoint | Goblin refuse et fuit |
| 382 | "je recrute le garde" | ✅ recruit | Dé ≥ DC18 → garde rejoint | Garde refuse (loyalty militia) |
| 383 | "je recrute le boss" | ✅ recruit | DC astronomique, quasi impossible | Boss rit et attaque |
| 384 | "je recrute le marchand" | ✅ recruit | Marchand quitte son poste | Marchand a un commerce |
| 385 | "je demande de l'aide au villageois" | ✅ talk | Villageois donne un indice | Villageois a peur |
| 386 | "j'intimide le PNJ" | ✅ talk | PNJ effrayé, info forcée | PNJ appelle à l'aide |
| 387 | "je fais un discours héroïque" | ✅ talk | Réputation +, moral allies + | Personne n'écoute |
| 388 | "je demande au PNJ de me suivre" | ✅ recruit | Si éligible: recrute | PNJ refuse |
| 389 | "je parle au mort" | ✅ talk | Pas de réponse (mort) | Cible morte → échec |
| 390 | "je négocie la paix avec le goblin" | ✅ talk | Goblin accepte si dé haut | Goblin attaque |
| 391 | "je demande pardon au garde pour mes crimes" | ✅ talk | Réduction bounty narrative | Garde inflexible |
| 392 | "je flatte le boss" | ✅ talk | Boss amusé, un tour de répit | Boss pas impressionné |
| 393 | "j'insulte le démon" | ✅ talk | Démon provoqué, aggro | Démon indifférent |
| 394 | "je chante pour calmer le monstre" | 🤖 AI | Monstre apaisé narratif | Monstre attaque |
| 395 | "je raconte mon histoire au villageois" | ✅ talk | Lore exchange narratif | Villageois s'en fiche |
| 396 | "je demande un lit à l'aubergiste" | ✅ talk | Repos à l'auberge, soin | Auberge trop loin |
| 397 | "j'interroge le prisonnier" | ✅ talk | Info narrative | Prisonnier muet |
| 398 | "je convaincs le garde de me laisser passer" | ✅ negotiate | Passage si dé OK | Garde refuse |
| 399 | "je ments au PNJ" | ✅ talk | Mensonge accepté narratif | PNJ voit le mensonge |
| 400 | "je propose une alliance au clan ennemi" | 🤖 AI | Alliance narrative | Refus |
| 401 | "je demande au marchand ses meilleures offres" | ✅ talk | Stock + prix affichés | Trop loin |
| 402 | "je confie un secret au PNJ" | ✅ talk | Confiance ++, relation | PNJ le répète |
| 403 | "je convaincs les villageois de se battre" | 🤖 AI | Mobilisation narrative | Personne ne bouge |
| 404 | "je parle à mon compagnon" | ✅ talk | Dialogue follower | Pas de follower |
| 405 | "je donne un ordre à mon allié" | 🤖 AI | Follower obéit | Follower refuse |
| 406 | "je remercie le PNJ" | ✅ talk | Politesse, mood + | — |
| 407 | "je demande le chemin" | ✅ talk | Direction narrative | Pas de PNJ |
| 408 | "j'implore le dieu du temple" | 🤖 AI | Prière narrative, bénédiction? | Silence divin |
| 409 | "je défie le garde en duel verbal" | ✅ talk | Joute verbale narrative | Garde impassible |
| 410 | "je fais une proposition commerciale" | ✅ negotiate | Deal narrative | Refus |
| 411 | "je recrute l'animal blessé" | ✅ recruit | Animal soigné + tamed | Animal fuit |
| 412 | "je parle au fantôme" | ✅ talk | Fantôme répond narratif | Fantôme disparaît |
| 413 | "je demande au PNJ son nom" | ✅ talk | PNJ se présente | PNJ hostile |
| 414 | "je murmure un secret au vent" | 🤖 AI | Poétique narratif | Pas d'effet |
| 415 | "je crie au secours" | 🤖 AI | Attention des PNJ nearby | Personne n'entend |
| 416 | "je siffle pour attirer l'attention" | 🤖 AI | PNJ/animal se retourne | Personne ne vient |
| 417 | "je fais la paix avec mon ennemi" | ✅ talk | Diplomatie, hostile → neutral | Ennemi refuse |
| 418 | "je convaincs le slime d'être mon ami" | ✅ recruit | Slime tamed si dé OK | Slime attaque |
| 419 | "je demande une quête au guild master" | ✅ talk | Quête narrative | Pas de guild master |
| 420 | "j'encourage mes alliés" | 🤖 AI | Morale + narratif | Pas d'alliés |
| 421 | "je pardonne au PNJ traître" | ✅ talk | Relation réparée | PNJ s'en fuit |
| 422 | "je fais un sermon moral au voleur" | ✅ talk | Voleur honteux narratif | Voleur rit |
| 423 | "je dis au revoir au village" | ✅ talk | Adieux narratifs | — |
| 424 | "je demande au PNJ de garder un objet" | 🤖 AI | Objet confié narratif | PNJ refuse |
| 425 | "je raconte les exploits du boss vaincu" | ✅ talk | Réputation + village | Pas de boss vaincu |
| 426 | "je demande au PNJ pourquoi il est triste" | ✅ talk | Lore/quête narrative | PNJ pas triste |
| 427 | "je convaincs le monstre de changer de camp" | ✅ recruit | Recrutement si dé OK | Monstre trop hostile |
| 428 | "je parle à l'arbre" | ✅ talk | Silence, narration poétique | Arbre ne répond pas |
| 429 | "je dis au marchand qu'il est un arnaqueur" | ✅ talk | Marchand offensé | Réputation shop -- |
| 430 | "je présente mon compagnon au PNJ" | ✅ talk | Introduction narratif | Pas de compagnon |
| 431 | "je chuchote un plan à mon allié" | ✅ talk | Stratégie narratif | Pas d'allié |
| 432 | "je provoque le monstre en criant" | ✅ talk | Monstre aggro | Monstre charge immédiatement |
| 433 | "je dis la vérité au garde" | ✅ talk | Clémence narrative | Garde indifférent |
| 434 | "je demande à être jugé par le village" | 🤖 AI | Procès narratif | Pas de mécanique justice |
| 435 | "je fais rire le boss" | ✅ talk | Boss déconcentré narratif | Boss pas d'humour |
| 436 | "je propose un marché au démon" | ✅ negotiate | Deal diabolique narratif | Démon refuse |
| 437 | "je parle en langue ancienne" | 🤖 AI | Effet magique narratif | Gibberish |
| 438 | "je séduis le dragon" | 🤖 AI | Dragon amusé/flatté | Dragon crache du feu |
| 439 | "je demande au PNJ de m'apprendre la magie" | ✅ talk | Leçon narrative | PNJ pas mage |
| 440 | "je donne un nom au slime apprivoisé" | 🤖 AI | Slime nommé narratif | Pas de slime apprivoisé |
| 441 | "je fais un pacte de sang avec le PNJ" | 🤖 AI | Alliance profonde narrative | PNJ refuse |
| 442 | "je jure fidélité au roi" | 🤖 AI | Allégeance narrative | Pas de roi |
| 443 | "j'ordonne à mon follower d'attendre ici" | 🤖 AI | Follower hold order | Pas de follower |
| 444 | "je fais un toast à la taverne" | ✅ talk | Ambiance ++ auberge | Pas à l'auberge |
| 445 | "je demande au PNJ de me prêter son arme" | ✅ talk | Arme prêtée narrative | PNJ refuse |
| 446 | "j'annonce que je suis le héros élu" | ✅ talk | Réaction village narrative | Village sceptique |
| 447 | "je console le PNJ en deuil" | ✅ talk | Relation +, mood PNJ + | PNJ pas en deuil |
| 448 | "je diffuse de fausses rumeurs" | 🤖 AI | Réputation manipulation narrative | Rumeurs ignorées |
| 449 | "je demande au garde ses souvenirs de guerre" | ✅ talk | Lore narrative | Garde taiseux |
| 450 | "je convaincs le monstre que je suis un dieu" | ✅ recruit | Si charisma haute + dé haut | Monstre pas convaincu |
| 451 | "je fais ami-ami avec le rat" | ✅ recruit | Rat tamed | Rat fuit |
| 452 | "je parle au slime" | ✅ talk | Slime fait "blob" | Pas de dialogue possible |
| 453 | "je demande une récompense" | ✅ talk | Or narratif si quête complète | Rien à récompenser |
| 454 | "je bannis mon follower" | 🤖 AI | Follower quitte le groupe | Pas de follower |
| 455 | "je trahis mon allié" | 🤖 AI | Alliance brisée, conséquences | Pas d'allié |
| 456 | "je demande au PNJ de créer une diversion" | 🤖 AI | PNJ aide narrative | PNJ refuse |
| 457 | "je prie pour les morts" | 🤖 AI | Respect, ambiance | Pas de mécanique prière |
| 458 | "je donne de l'or au mendiant" | 🤖 AI | Réputation +, or - | Pas de mendiant |
| 459 | "je parle au boss pendant le combat" | ✅ talk | Dialogue mid-combat | Boss ignore et frappe |
| 460 | "je demande au PNJ ce qu'il pense de moi" | ✅ talk | Avis basé sur réputation | PNJ indifférent |
| 461 | "je recrute le squelette" | ✅ recruit | Squelette rejoint si dé OK | Squelette attaque |
| 462 | "je demande au marchand un crédit" | ✅ talk | Marchand refuse (pas de crédit) | — |
| 463 | "j'appelle mes alliés en renfort" | 🤖 AI | Followers approchent | Pas d'alliés |
| 464 | "je négocie ma reddition" | ✅ negotiate | Clémence narrative | Ennemis veulent le sang |
| 465 | "je demande au PNJ de me raconter une légende" | ✅ talk | Lore du monde narrative | PNJ pas causant |
| 466 | "je dis au monstre que son boss est mort" | ✅ talk | Monstre démoralisé | Boss pas mort |
| 467 | "je convaincs le bandit de devenir honnête" | ✅ recruit | Bandit réformé narrative | Bandit rit |
| 468 | "j'apprends la langue des monstres" | 🤖 AI | Compétence narrative | Trop long |
| 469 | "je fais un discours de victoire" | ✅ talk | Morale + narratif | Pas de victoire |
| 470 | "je demande au PNJ de me soigner" | ✅ talk | Soin si PNJ à l'auberge | PNJ pas soigneur |
| 471 | "je dis au garde que j'ai changé" | ✅ talk | Bounty réduit narrative | Garde pas convaincu |
| 472 | "je propose un duel amical" | ✅ talk | Sparring narratif | PNJ refuse |
| 473 | "je demande au PNJ de surveiller mes arrières" | 🤖 AI | PNJ aide narrative | PNJ refuse |
| 474 | "je parle tout seul" | 🤖 AI | Monologue narratif | Rien |
| 475 | "je crie le nom du boss" | ✅ talk | Provocation, aggro boss | Boss déjà aggro |
| 476 | "je demande l'heure" | ✅ talk | PNJ donne l'heure narrative | Pas de PNJ |
| 477 | "je fais une promesse au PNJ" | ✅ talk | Engagement narratif | — |
| 478 | "je m'excuse auprès du villageois" | ✅ talk | Relation réparée | Villageois rancunier |
| 479 | "je recrute le fantôme" | ✅ recruit | Fantôme allié spectral | Fantôme disparaît |
| 480 | "je convaincs les gardes de me donner une arme" | ✅ negotiate | Arme narrative si dé haut | Gardes refusent |
| 481 | "je demande au PNJ s'il a vu le boss" | ✅ talk | Info direction boss | PNJ ne sait pas |
| 482 | "je chante une berceuse au bébé slime" | 🤖 AI | Slime endormi narrative | Slime pas bébé |
| 483 | "je raconte les horreurs du donjon" | ✅ talk | Villageois effrayés | Pas de PNJ nearby |
| 484 | "je propose au PNJ de s'enfuir ensemble" | 🤖 AI | Fuite narrative | PNJ veut rester |
| 485 | "je fais du théâtre pour distraire les gardes" | 🤖 AI | Distraction narrative | Gardes pas intéressés |
| 486 | "je recrute l'ours" | ✅ recruit | Ours tamed si dé OK | Ours charge |
| 487 | "je demande au marchand d'où viennent ses produits" | ✅ talk | Lore commerce | Marchand évasif |
| 488 | "je convaincs le monstre que je suis toxique à manger" | 🤖 AI | Monstre recule narrative | Monstre pas convaincu |
| 489 | "je forme une guilde" | 🤖 AI | Guilde narrative | Pas de mécanique |
| 490 | "je fais un pari avec le PNJ" | 🤖 AI | Pari narrative | PNJ refuse |
| 491 | "je recrute le demon rouge" | ✅ recruit | DC très haut → allié démoniaque | Démon attaque |
| 492 | "je dis au PNJ que je l'aime" | ✅ talk | PNJ gêné/flatté | PNJ fuit |
| 493 | "je demande des renforts à la guilde" | ✅ talk | Aide narrative | Guilde occupée |
| 494 | "je prie pour un miracle" | 🤖 AI | Miracle narratif | Silence |
| 495 | "je demande le wifi" | 🤖 AI | Narration confused medieval | Anachronisme |
| 496 | "je raconte une histoire d'horreur au coin du feu" | ✅ talk | Ambiance narrative | Pas de feu |
| 497 | "j'enseigne au PNJ comment se battre" | 🤖 AI | PNJ + fort narrative | PNJ pas intéressé |
| 498 | "je convaincs l'ennemi de se suicider" | 🤖 AI | Absurde, refus | Pas possible |
| 499 | "je recrute la milice entière" | ✅ recruit | 1 garde recruté max | Milice hostile |
| 500 | "j'annonce ma candidature comme chef du village" | 🤖 AI | Élection narrative | Village sceptique |

---

## F. EXPLORATION & INSPECTION (501-600)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 501 | "j'inspecte la zone" | ✅ inspect | Description terrain + PNJ + POI | Rien de spécial |
| 502 | "je regarde autour de moi" | ✅ inspect | Vue d'ensemble narrative | Zone vide |
| 503 | "j'examine le coffre" | ✅ inspect | Contenu + piège? | Coffre vide |
| 504 | "je fouille le corps" | ✅ inspect | Inventaire du mort | Pas de corps |
| 505 | "j'observe le marchand" | ✅ inspect | Description PNJ, stock | Trop loin |
| 506 | "je lis l'inscription sur le mur" | ✅ inspect | Texte narratif | Pas d'inscription |
| 507 | "j'analyse le piège" | ✅ inspect | Type de piège, désactivation? | Pas de piège |
| 508 | "je regarde par la fenêtre" | ✅ inspect | Vue extérieure narrative | Pas de fenêtre |
| 509 | "j'examine mes blessures" | ✅ inspect | État HP/stress du joueur | — |
| 510 | "je vérifie mon inventaire" | ✅ inspect | Liste items | Inventaire vide |
| 511 | "j'observe le ciel" | ✅ inspect | Description ciel/météo | Sous-terrain |
| 512 | "je regarde sous le lit" | ✅ inspect | Trouvaille narrative | Rien sous le lit |
| 513 | "j'examine la porte verrouillée" | ✅ inspect | Serrure décrite | Pas de porte |
| 514 | "je cherche des traces" | ✅ inspect | Traces narratif | Pas de traces |
| 515 | "j'observe les étoiles" | ✅ inspect | Description ciel nocturne | Pas de nuit |
| 516 | "j'examine la carte" | ✅ inspect | Carte du monde narrative | Pas de carte |
| 517 | "je regarde dans le puits" | ✅ inspect | Profondeur, eau? | Pas de puits |
| 518 | "j'inspecte l'arme du garde" | ✅ inspect | Description arme | Trop loin |
| 519 | "j'examine le cristal magique" | ✅ inspect | Propriétés magiques narratif | Pas de cristal |
| 520 | "je renifle l'air" | ✅ inspect | Odeurs descriptives | Rien de spécial |
| 521 | "j'écoute attentivement" | ✅ inspect | Sons ambiants narrative | Silence |
| 522 | "j'examine le sol du donjon" | ✅ inspect | Dalles, pièges, indices | Sol normal |
| 523 | "je touche le mur pour trouver un passage" | ✅ inspect | Passage secret? | Mur normal |
| 524 | "j'observe le comportement du monstre" | ✅ inspect | Pattern d'attaque narrative | Monstre trop loin |
| 525 | "je lis le panneau" | ✅ inspect | Texte du panneau | Pas de panneau |
| 526 | "j'examine le mécanisme" | ✅ inspect | Mécanisme décrit | Pas de mécanisme |
| 527 | "je goûte l'eau de la rivière" | ✅ inspect | Eau pure/empoisonnée | Pas de rivière |
| 528 | "j'observe le lever de soleil" | ✅ inspect | Description poétique | Sous-terrain |
| 529 | "je cherche un indice" | ✅ inspect | Indice narratif | Rien trouvé |
| 530 | "j'examine mon épée" | ✅ inspect | État de l'arme | Pas d'épée |
| 531 | "je regarde le fond du gouffre" | ✅ inspect | Profondeur, danger | Pas de gouffre |
| 532 | "j'inspecte le cadavre du boss" | ✅ inspect | Loot épique description | Boss pas mort |
| 533 | "je cherche des herbes médicinales" | ✅ inspect | Herbes trouvées? | Zone sans herbes |
| 534 | "je regarde si quelqu'un me suit" | ✅ inspect | Alentours décrits | Personne |
| 535 | "j'examine les ruines" | ✅ inspect | Architecture, histoire | Pas de ruines |
| 536 | "je vérifie si le coffre est piégé" | ✅ inspect | Piège détecté/pas | Pas de coffre |
| 537 | "j'observe la patrouille des gardes" | ✅ inspect | Pattern patrouille | Pas de gardes |
| 538 | "j'examine la statue ancienne" | ✅ inspect | Description statue, lore | Pas de statue |
| 539 | "je cherche de l'eau potable" | ✅ inspect | Source trouvée? | Zone sèche |
| 540 | "j'inspecte les dégâts du cratère" | ✅ inspect | Cratère décrit | Pas de cratère |
| 541 | "je regarde dans le miroir" | ✅ inspect | Reflet, état du joueur | Pas de miroir |
| 542 | "j'examine le portail mystérieux" | ✅ inspect | Portail décrit | Pas de portail |
| 543 | "je cherche un abri" | ✅ inspect | Abri trouvé? | Pas d'abri |
| 544 | "j'observe les mouvements ennemis" | ✅ inspect | Positions hostiles | Pas d'ennemis |
| 545 | "j'examine la serrure de plus près" | ✅ inspect | Type de serrure | Pas de serrure |
| 546 | "je fouille la bibliothèque" | ✅ inspect | Livres, grimoires narrative | Pas de bibliothèque |
| 547 | "je regarde à travers le trou dans le mur" | ✅ inspect | Vue de l'autre côté | Pas de trou |
| 548 | "j'examine le totem tribal" | ✅ inspect | Symbolisme décrit | Pas de totem |
| 549 | "je cherche des champignons comestibles" | ✅ inspect | Champignons trouvés? | Zone sans champignons |
| 550 | "j'observe la lune" | ✅ inspect | Description nuit | Jour |
| 551 | "j'examine les gravures sur la tombe" | ✅ inspect | Inscription funéraire | Pas de tombe |
| 552 | "je fouille le chariot abandonné" | ✅ inspect | Contenu chariot | Pas de chariot |
| 553 | "je cherche un raccourci" | ✅ inspect | Chemin alternatif? | Pas de raccourci |
| 554 | "j'examine le bouclier du boss" | ✅ inspect | Point faible? | Boss trop loin |
| 555 | "je regarde au loin" | ✅ inspect | Horizon décrit | Murs autour |
| 556 | "j'étudie le système de pièges" | ✅ inspect | Mécanisme global | Pas de pièges |
| 557 | "j'examine mes potions" | ✅ inspect | Liste potions + effets | Pas de potions |
| 558 | "je cherche de la nourriture dans la nature" | ✅ inspect | Baies/gibier narrative | Zone stérile |
| 559 | "j'observe l'architecture du donjon" | ✅ inspect | Style, époque, secrets | Pas dans donjon |
| 560 | "j'examine le collier du monstre" | ✅ inspect | Bijou décrit | Monstre pas de collier |
| 561 | "je regarde dans le tonneau" | ✅ inspect | Contenu: vin, eau, vide | Pas de tonneau |
| 562 | "j'étudie les runes sur le sol" | ✅ inspect | Runes décrites | Pas de runes |
| 563 | "j'examine l'entrée de la grotte" | ✅ inspect | Grotte décrite | Pas de grotte |
| 564 | "je cherche des empreintes" | ✅ inspect | Empreintes trouvées? | Sol trop dur |
| 565 | "j'observe le combat depuis un abri" | ✅ inspect | Vue bataille | Pas de combat |
| 566 | "je vérifie si le PNJ est blessé" | ✅ inspect | État HP du PNJ | PNJ en forme |
| 567 | "j'examine le mécanisme de la porte" | ✅ inspect | Mécanisme décrit | Pas de porte |
| 568 | "je fouille les décombres" | ✅ inspect | Trouvailles | Décombres vides |
| 569 | "j'observe les nuages" | ✅ inspect | Formes, météo | Sous-terrain |
| 570 | "j'examine la fontaine du village" | ✅ inspect | Fontaine décrite, pièces? | Pas de fontaine |
| 571 | "je vérifie mes arrières" | ✅ inspect | Alentours sûrs? | Ennemi derrière |
| 572 | "j'étudie la magie du lieu" | ✅ inspect | Aura magique narrative | Pas de magie |
| 573 | "je cherche un trésor caché" | ✅ inspect | Trésor? | Rien trouvé |
| 574 | "j'examine la qualité de mon armure" | ✅ inspect | État équipement | Pas d'armure |
| 575 | "je regarde sous l'eau" | ✅ inspect | Fond marin/rivière | Pas d'eau |
| 576 | "j'observe les oiseaux" | ✅ inspect | Faune aérienne | Pas d'oiseaux |
| 577 | "j'examine la forge" | ✅ inspect | Outils, état | Pas de forge |
| 578 | "je fouille la sacoche du bandit mort" | ✅ inspect | Loot bandit | Pas de bandit mort |
| 579 | "je cherche un passage dans le mur" | ✅ inspect | Passage secret? | Mur solide |
| 580 | "j'étudie les constellations" | ✅ inspect | Navigation narrative | Sous-terrain |
| 581 | "j'examine la chaîne qui pend du plafond" | ✅ inspect | Chaîne décrite | Pas de chaîne |
| 582 | "je fouille le nid de l'oiseau géant" | ✅ inspect | Oeufs, trésors? | Pas de nid |
| 583 | "j'observe la marée" | ✅ inspect | Eau monte/descend | Pas d'océan |
| 584 | "j'examine le sceau magique" | ✅ inspect | Sceau décrit | Pas de sceau |
| 585 | "je cherche des survivants" | ✅ inspect | PNJ vivants nearby | Personne |
| 586 | "j'examine la cicatrice du vieux guerrier" | ✅ inspect | Histoire narrative | Pas de guerrier |
| 587 | "je fouille les poubelles" | ✅ inspect | Déchets, trouvailles? | Pas de poubelles |
| 588 | "j'examine le levier" | ✅ inspect | Levier décrit | Pas de levier |
| 589 | "je cherche le point faible du mur" | ✅ inspect | Fissure? | Mur intact |
| 590 | "j'observe les ombres" | ✅ inspect | Ombres suspectes | Juste des ombres |
| 591 | "j'examine le journal du mage" | ✅ inspect | Lore magique | Pas de journal |
| 592 | "je cherche la sortie" | ✅ inspect | Direction sortie | Pas prisonnier |
| 593 | "j'étudie le monstre endormi" | ✅ inspect | Stats/faiblesses | Monstre réveillé |
| 594 | "j'examine la couronne du roi" | ✅ inspect | Bijou royal décrit | Pas de couronne |
| 595 | "je cherche des alliés potentiels" | ✅ inspect | PNJ recrutables nearby | Personne |
| 596 | "j'observe le coucher de soleil" | ✅ inspect | Description romantique | Nuit/donjon |
| 597 | "j'examine la qualité du sol" | ✅ inspect | Terrain décrit | Sol normal |
| 598 | "j'écoute les rumeurs à l'auberge" | ✅ inspect | Lore narrative | Pas à l'auberge |
| 599 | "j'examine le trône du boss" | ✅ inspect | Trône décrit, pouvoir? | Pas de trône |
| 600 | "je cherche un endroit pour camper" | ✅ inspect | Spot sûr trouvé? | Zone dangereuse |

---

## G. DESTRUCTION & CONSTRUCTION (601-700)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 601 | "je casse le rocher" | ✅ destroy | Pierre brute récupérée, tile changé | Rocher trop solide |
| 602 | "je coupe l'arbre" | ✅ destroy | Bois récupéré, arbre disparaît | Hache nécessaire narrative |
| 603 | "je détruis le mur" | ✅ destroy | Mur brisé, passage | Mur incassable |
| 604 | "je brûle la maison" | ✅ destroy | Maison brûlée, crime, milice | Feu ne prend pas |
| 605 | "je casse la vitrine du shop" | ✅ destroy | Vitrine brisée, crime | Pas de vitrine |
| 606 | "je détruis le pont" | ✅ destroy | Pont effondré, passage bloqué | Pont trop solide |
| 607 | "je démolis la porte" | ✅ destroy | Porte ouverte | Porte renforcée |
| 608 | "je casse les barreaux" | ✅ destroy | Barreaux pliés, passage | Force insuffisante |
| 609 | "je brûle les buissons" | ✅ destroy | Buissons brûlés, chemin | Trop humide |
| 610 | "je détruis l'autel" | ✅ destroy | Autel brisé, malédiction? | Autel protégé |
| 611 | "je casse le cristal" | ✅ destroy | Cristal brisé, explosion mana | Cristal absorbe |
| 612 | "je déterre les fondations" | ✅ destroy | Sol déterré | Trop dur |
| 613 | "je détruis le totem" | ✅ destroy | Totem brisé, effet zone | Totem résiste |
| 614 | "je casse la chaîne" | ✅ destroy | Chaîne brisée | Trop épaisse |
| 615 | "je détruis le mécanisme du piège" | ✅ destroy | Piège neutralisé | Piège se déclenche |
| 616 | "je brûle le drapeau ennemi" | ✅ destroy | Drapeau brûlé, moral ennemi -- | Pas de drapeau |
| 617 | "je casse le tonneau" | ✅ destroy | Tonneau brisé, contenu | Tonneau vide |
| 618 | "je détruis la barricade" | ✅ destroy | Passage ouvert | Barricade trop forte |
| 619 | "je brûle les plans ennemis" | ✅ destroy | Plans détruits | Pas de plans |
| 620 | "je casse le sceau magique" | ✅ destroy | Sceau brisé, libération | Sceau résiste |
| 621 | "je détruis le nid de monstres" | ✅ destroy | Nid détruit, plus de spawn | Monstres défendent |
| 622 | "je creuse un trou" | ✅ destroy | Trou creusé, tile changé | Sol trop dur |
| 623 | "je brûle la lettre compromettante" | ✅ destroy | Preuve détruite | Pas de lettre |
| 624 | "je détruis le portail magique" | ✅ destroy | Portail fermé | Magie trop forte |
| 625 | "je casse l'idole" | ✅ destroy | Idole brisée | Idole protégée |
| 626 | "je détruis le campement ennemi" | ✅ destroy | Camp rasé | Camp trop grand |
| 627 | "je creuse une tranchée" | ✅ destroy | Tranchée narrative | Sol dur |
| 628 | "je casse la fontaine" | ✅ destroy | Fontaine brisée, eau partout | Fontaine solide |
| 629 | "je brûle la forêt" | ✅ destroy | Incendie massif, conséquences | Forêt humide |
| 630 | "je détruis le laboratoire du mage" | ✅ destroy | Explosions, dégâts zone | Pas de labo |
| 631 | "je construis un abri" | 🤖 AI | Abri narratif | Pas de matériaux |
| 632 | "je construis un mur" | 🤖 AI | Mur narratif | Pas de ressources |
| 633 | "je fabrique une arme" | 🤖 AI | Arme improvisée narrative | Pas de forge |
| 634 | "je construis un radeau" | 🤖 AI | Radeau narratif | Pas de bois/rivière |
| 635 | "je forge une épée" | 🤖 AI | Épée narrative | Pas de forge |
| 636 | "je construis un piège" | 🤖 AI | Piège posé narrative | Pas de matériaux |
| 637 | "je fabrique une torche" | 🤖 AI | Torche créée | Pas de bois/tissu |
| 638 | "je construis une échelle" | 🤖 AI | Échelle narrative | Pas de ressources |
| 639 | "je répare mon armure" | 🤖 AI | Armure réparée | Pas d'armure |
| 640 | "je construis un pont de fortune" | 🤖 AI | Pont narratif | Pas de bois |
| 641 | "je fabrique un arc" | 🤖 AI | Arc narratif | Matériaux manquants |
| 642 | "je construis une barricade" | 🤖 AI | Barricade narrative | Pas de ressources |
| 643 | "je sculpte une statue" | 🤖 AI | Statue narrative | Artiste? |
| 644 | "je détruis tout dans la pièce" | ✅ destroy | Destruction de la prop la + proche | Pièce vide |
| 645 | "je casse mon propre équipement" | ✅ destroy | Item détruit, perte | Pas d'équipement |
| 646 | "je démolit le trône du boss" | ✅ destroy | Trône détruit symbolique | Boss défend |
| 647 | "je casse les flacons du mage" | ✅ destroy | Flacons brisés, effets | Pas de flacons |
| 648 | "je brûle le village" | ✅ destroy | Incendie, crime majeur, milice | Trop de bâtiments |
| 649 | "je déterre le trésor" | ✅ destroy | Trésor déterré? | Pas de trésor |
| 650 | "je casse la glace" | ✅ destroy | Glace brisée, passage | Pas de glace |
| 651 | "je démonte le mécanisme" | ✅ destroy | Pièces récupérées | Pas de mécanisme |
| 652 | "je brûle les preuves" | ✅ destroy | Preuves détruites | Pas de preuves |
| 653 | "je casse la cage" | ✅ destroy | Cage ouverte, captif libre | Cage solide |
| 654 | "je détruis la stèle" | ✅ destroy | Stèle brisée | Stèle protégée |
| 655 | "je construis un camp" | 🤖 AI | Camp narratif | Zone hostile |
| 656 | "je brûle le corps du boss" | ✅ destroy | Corps brûlé, pas de résurrection | Boss pas mort |
| 657 | "je casse le miroir magique" | ✅ destroy | Miroir brisé, 7 ans malheur | Miroir résiste |
| 658 | "je creuse sous le mur" | ✅ destroy | Passage souterrain | Sol rocheux |
| 659 | "je détruis l'horloge du donjon" | ✅ destroy | Horloge brisée | Pas d'horloge |
| 660 | "je démolit l'escalier" | ✅ destroy | Escalier détruit, piège | Pas d'escalier |
| 661 | "je brûle la bibliothèque" | ✅ destroy | Livres brûlés, crime | Pas de bibliothèque |
| 662 | "j'explose la porte avec la bombe" | ✅ destroy | Porte soufflée, bombe consommée | Pas de bombe |
| 663 | "je détruis le générateur magique" | ✅ destroy | Générateur off | Pas de générateur |
| 664 | "je casse les colonnes du temple" | ✅ destroy | Temple s'effondre | Colonnes massives |
| 665 | "je brûle le contrat" | ✅ destroy | Contrat détruit | Pas de contrat |
| 666 | "je détruis le monde" | ✅ destroy | Détruit le prop le + proche | Un seul tile |
| 667 | "je casse la cloche" | ✅ destroy | Cloche brisée | Pas de cloche |
| 668 | "je déterre les ossements" | ✅ destroy | Ossements récupérés | Sol trop dur |
| 669 | "je démonte la catapulte" | ✅ destroy | Catapulte démontée | Pas de catapulte |
| 670 | "je brûle l'épouvantail" | ✅ destroy | Épouvantail brûlé | Pas d'épouvantail |
| 671 | "je construis un cercueil pour le PNJ" | 🤖 AI | Respect narrative | Morbide |
| 672 | "je fabrique un bouclier avec du bois" | 🤖 AI | Bouclier improvisé | Pas de bois |
| 673 | "je répare le pont" | 🤖 AI | Pont réparé | Pas de matériaux |
| 674 | "je construis une tour de guet" | 🤖 AI | Tour narrative | Trop ambitieux |
| 675 | "je brûle mes propres affaires" | ✅ destroy | Items détruits | Inventaire vide |
| 676 | "je casse la couronne du roi" | ✅ destroy | Couronne détruite | Pas de couronne |
| 677 | "je déterre un corps" | ✅ destroy | Squelette? Trésor? | Sol dur |
| 678 | "je détruis le symbole de la guilde" | ✅ destroy | Symbole détruit, crime guilde | Pas de symbole |
| 679 | "je brûle la carte" | ✅ destroy | Carte détruite | Pas de carte |
| 680 | "je casse les vitraux" | ✅ destroy | Vitraux brisés | Pas de vitraux |
| 681 | "je fabrique des flèches" | 🤖 AI | Flèches narratif | Matériaux manquants |
| 682 | "je construis un totem" | 🤖 AI | Totem narratif | Pas de matériaux |
| 683 | "je brûle l'effigie du démon" | ✅ destroy | Effigie brûlée | Pas d'effigie |
| 684 | "je démolis la statue du tyran" | ✅ destroy | Statue détruite | Statue trop grande |
| 685 | "je creuse un puits" | 🤖 AI | Puits narratif | Trop long |
| 686 | "je casse la table de l'auberge" | ✅ destroy | Table brisée, crime | Aubergiste furieux |
| 687 | "je détruis les réserves de l'ennemi" | ✅ destroy | Réserves détruites | Pas de réserves |
| 688 | "je brûle le traité de paix" | ✅ destroy | Traité détruit, guerre | Pas de traité |
| 689 | "je construis une embuscade" | 🤖 AI | Piège narratif | Pas de mécanique |
| 690 | "je détruis l'ascenseur du donjon" | ✅ destroy | Ascenseur bloqué | Pas d'ascenseur |
| 691 | "je casse le sablier magique" | ✅ destroy | Temps figé narratif | Pas de sablier |
| 692 | "je brûle les récoltes" | ✅ destroy | Récoltes brûlées, famine | Pas de récoltes |
| 693 | "je détruis la prison" | ✅ destroy | Mur brisé, évasion | Prison trop solide |
| 694 | "je casse le cadran solaire" | ✅ destroy | Cadran brisé | Pas de cadran |
| 695 | "je détruis le phare" | ✅ destroy | Phare éteint | Pas de phare |
| 696 | "je brûle la bannière du boss" | ✅ destroy | Bannière brûlée | Pas de bannière |
| 697 | "je casse l'aquarium géant" | ✅ destroy | Inondation narrative | Pas d'aquarium |
| 698 | "je démolit la passerelle" | ✅ destroy | Passerelle détruite | Pas de passerelle |
| 699 | "je construis une arme secrète" | 🤖 AI | Arme narrative | Irréaliste |
| 700 | "je détruis le quatrième mur" | 🤖 AI | Méta-humour narratif | Le jeu continue |

---

## H. REPOS, SOIN & UTILISATION D'OBJETS (701-800)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 701 | "je me repose" | ✅ rest | Stress -2, heal +1 | — |
| 702 | "je dors à l'auberge" | ✅ rest | Stress -12, heal +2 | Pas à l'auberge |
| 703 | "je médite" | ✅ rest | Stress réduit | — |
| 704 | "je fais une sieste" | ✅ rest | Repos léger | Zone dangereuse |
| 705 | "je me soigne" | ✅ rest | Heal léger | — |
| 706 | "je mange ma ration" | ✅ use | Ration consommée, heal +3 | Pas de ration |
| 707 | "je bois la potion de soin" | ✅ use | Potion consommée, heal +5 | Pas de potion |
| 708 | "j'utilise l'herbe apaisante" | ✅ use | Stress -8 | Pas d'herbe |
| 709 | "je m'assois près du feu" | ✅ rest | Stress réduit, ambiance | Pas de feu |
| 710 | "je me repose derrière un arbre" | ✅ rest | Repos couvert narratif | Pas d'arbre |
| 711 | "j'utilise ma torche" | ✅ use | Torche allumée, vision + | Pas de torche |
| 712 | "j'équipe l'épée en fer" | ✅ use | Épée équipée | Pas d'épée |
| 713 | "j'utilise la corde" | ✅ use | Usage contextuel narratif | Pas de corde |
| 714 | "j'utilise le crochet de serrure" | ✅ use | Serrure crochetée | Pas de crochet/serrure |
| 715 | "j'utilise la bombe" | ✅ use | Explosion, dégâts zone | Pas de bombe |
| 716 | "j'équipe le bouclier" | ✅ use | Bouclier équipé, defense + | Pas de bouclier |
| 717 | "j'utilise l'amulette de chance" | ✅ use | Buff chance narrative | Pas d'amulette |
| 718 | "je bois de l'eau" | ✅ rest | Hydratation, micro heal | — |
| 719 | "je mange les champignons" | ✅ use | Effet aléatoire narratif | Toxiques? |
| 720 | "je pose un piège" | 🤖 AI | Piège placé narratif | Pas d'item piège |
| 721 | "j'applique un bandage" | ✅ use | Heal léger | Pas de bandage |
| 722 | "je prends un bain" | ✅ rest | Stress réduit, propreté | Pas d'eau |
| 723 | "j'utilise la pierre sur l'épée pour l'aiguiser" | 🤖 AI | Épée + tranchante narratif | Pas de pierre |
| 724 | "je fais du feu" | 🤖 AI | Feu de camp, repos + | Pas de bois |
| 725 | "je cuisine" | 🤖 AI | Repas cuisiné narratif | Pas d'ingrédients |
| 726 | "je lis le grimoire" | ✅ use | Savoir magique narratif | Pas de grimoire |
| 727 | "je bois une bière à l'auberge" | ✅ rest | Stress -5, ambiance | Pas à l'auberge |
| 728 | "j'utilise la clé" | ✅ use | Porte ouverte | Pas de clé/porte |
| 729 | "je soigne mon compagnon" | 🤖 AI | Follower healed | Pas de follower |
| 730 | "je me repose dans la grotte" | ✅ rest | Repos couvert | Pas de grotte |
| 731 | "j'utilise la carte" | ✅ use | Carte consultée | Pas de carte |
| 732 | "je mange le monstre" | 🤖 AI | Viande de monstre, heal? | Écœurant |
| 733 | "je bois le poison" | ✅ use | Empoisonnement, dégâts self | Pas de poison |
| 734 | "j'utilise mon charisme" | 🤖 AI | Buff social narratif | Pas une action |
| 735 | "je me bande les yeux" | 🤖 AI | Aveugle volontaire | Pourquoi? |
| 736 | "je déséquipe mon arme" | ✅ use | Arme rangée | Pas d'arme équipée |
| 737 | "je donne ma potion au PNJ" | 🤖 AI | Potion donnée, relation + | Pas de potion |
| 738 | "j'utilise la bombe sur moi-même" | ✅ use | Dégâts self, suicide? | Pas de bombe |
| 739 | "je lance la corde pour escalader" | ✅ use | Escalade narrative | Pas de corde |
| 740 | "je fais sécher mes vêtements" | ✅ rest | Confort narratif | Pas mouillé |
| 741 | "j'utilise la torche pour voir dans le noir" | ✅ use | Vision + donjon | Pas de torche |
| 742 | "je me cache sous ma couverture" | ✅ rest | Stealth narrative | Pas de couverture |
| 743 | "j'utilise le bouclier comme luge" | 🤖 AI | Glissade narrative | Pas de pente |
| 744 | "je bande mes blessures" | ✅ rest | Heal léger | — |
| 745 | "j'utilise l'épée comme canne" | 🤖 AI | Marche narrative | Pas d'épée |
| 746 | "je fais le plein d'eau" | 🤖 AI | Gourde remplie | Pas de source |
| 747 | "j'affûte mes réflexes" | ✅ rest | Entraînement narratif | — |
| 748 | "je récupère mes forces" | ✅ rest | Heal + stress relief | — |
| 749 | "j'utilise le matériau pour réparer" | 🤖 AI | Réparation narrative | Pas de matériau |
| 750 | "je m'étire" | ✅ rest | Micro repos | — |
| 751 | "j'utilise la potion sur l'ennemi" | 🤖 AI | Potion gâchée / poison? | Pas de potion |
| 752 | "je mange l'herbe apaisante" | ✅ use | Stress -8 | Pas d'herbe |
| 753 | "je fais un feu de joie" | 🤖 AI | Fête narrative | Pas de bois |
| 754 | "je dors debout" | ✅ rest | Micro repos malheureux | Zone dangereuse |
| 755 | "j'utilise mes matériaux pour bloquer la porte" | 🤖 AI | Porte barricadée | Pas de matériaux |
| 756 | "je prépare un antidote" | 🤖 AI | Antidote narratif | Pas d'ingrédients |
| 757 | "je me concentre" | ✅ rest | Focus, stress -1 | — |
| 758 | "j'utilise le cristal pour soigner" | 🤖 AI | Heal magique | Pas de cristal |
| 759 | "je me repose sur le trône du boss" | ✅ rest | Repos royal narratif | Boss vivant |
| 760 | "je donne de la nourriture au loup" | 🤖 AI | Loup apprivoisé? | Pas de nourriture |
| 761 | "j'utilise la gemme comme monnaie" | 🤖 AI | Paiement gemme narrative | Pas de gemme |
| 762 | "je récupère en marchant" | ✅ rest | Micro heal passif | — |
| 763 | "j'utilise la lanterne" | ✅ use | Lumière narrative | Pas de lanterne |
| 764 | "je prépare mes armes" | ✅ rest | Préparation narrative | — |
| 765 | "j'utilise le grappin" | ✅ use | Escalade/traversée | Pas de grappin |
| 766 | "je me repose dans les ruines" | ✅ rest | Repos dangereux | Zone hostile |
| 767 | "je fais une potion" | 🤖 AI | Potion crafted | Pas d'alchimie |
| 768 | "j'utilise le sifflet" | 🤖 AI | Son attire attention | Pas de sifflet |
| 769 | "je lave mes blessures dans la rivière" | ✅ rest | Heal + propre | Pas de rivière |
| 770 | "j'utilise la pelle" | ✅ use | Creuse narrative | Pas de pelle |
| 771 | "je me recharge en énergie magique" | ✅ rest | Mana regen narrative | — |
| 772 | "j'utilise un item qui n'existe pas" | ✅ use | Item non trouvé → échec | "Pas dans l'inventaire" |
| 773 | "je consomme tout mon inventaire" | ✅ use | 1 item consommé par action | Queue d'actions |
| 774 | "j'utilise le corps du slime comme oreiller" | ✅ rest | Repos WTF narratif | Slime vivant → attaque |
| 775 | "je me prépare mentalement" | ✅ rest | Stress -1, focus | — |
| 776 | "je prie pour guérir" | ✅ rest | Heal narratif, micro heal | — |
| 777 | "j'utilise la plume pour écrire" | 🤖 AI | Message écrit narratif | Pas de plume |
| 778 | "je me repose sur le dos du monstre apprivoisé" | ✅ rest | Repos monture | Pas de monture |
| 779 | "je fais un check-up complet" | ✅ inspect | État joueur détaillé | — |
| 780 | "j'utilise tout ce que j'ai" | ✅ use | 1 item random consommé | Inventaire vide |
| 781 | "je me repose en attendant l'aube" | ✅ rest | Full rest narrative | Zone hostile |
| 782 | "j'utilise le miroir pour éblouir l'ennemi" | 🤖 AI | Ennemi aveuglé | Pas de miroir |
| 783 | "je mange de la terre" | 🤖 AI | Dégâts self narratif | Pourquoi? |
| 784 | "j'utilise le champignon phosphorescent" | ✅ use | Lumière narrative | Pas de champignon |
| 785 | "je me repose une semaine" | ✅ rest | 1 tour de repos seulement | Temps pas simulé |
| 786 | "je fais de la gym" | ✅ rest | Entraînement, stats narratif | — |
| 787 | "j'utilise la cloche pour alerter" | 🤖 AI | Alerte village | Pas de cloche |
| 788 | "je me repose derrière le boss" | ✅ rest | Repos dangereux, boss aggro | Boss attaque |
| 789 | "j'utilise le parchemin magique" | ✅ use | Sort lancé narratif | Pas de parchemin |
| 790 | "je prends une grande inspiration" | ✅ rest | Stress -1 | — |
| 791 | "j'utilise la fiole mystérieuse" | ✅ use | Effet aléatoire narratif | Pas de fiole |
| 792 | "je me repose au sommet de la montagne" | ✅ rest | Vue magnifique, repos | Pas de montagne |
| 793 | "j'équipe deux armes en même temps" | ✅ use | 1 seul équipement | Pas dual-wield |
| 794 | "je me soigne avec de la magie" | ✅ rest | Heal narratif magic | Stat magic basse |
| 795 | "j'utilise mes dernières forces" | ✅ rest | Pas de repos, motivation narrative | — |
| 796 | "je bois le sang du monstre" | 🤖 AI | Effet WTF narratif | Écœurant |
| 797 | "je me repose dans le lit du boss" | ✅ rest | Repos royal WTF | Boss vivant |
| 798 | "j'utilise la plante comme remède" | ✅ use | Heal si plante en inventaire | Pas de plante |
| 799 | "je dors avec un oeil ouvert" | ✅ rest | Repos léger + vigilance | — |
| 800 | "j'utilise l'os comme cure-dent" | 🤖 AI | Narration absurde | Pas d'os |

---

## I. ACTIONS WTF & IMPROBABLES (801-900)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 801 | "je mange l'épée" | 🤖 AI | Dégâts self, narration absurde | Gorge tranchée |
| 802 | "j'épouse le boss" | 🤖 AI | Boss amusé/furieux | Refus catégorique |
| 803 | "je lèche le mur du donjon" | 🤖 AI | Goût de pierre narratif | Empoisonnement |
| 804 | "je fais un câlin au slime" | 🤖 AI | Slime collant, dégâts acide | Slime heureux? |
| 805 | "je danse sur la tombe du boss" | 🤖 AI | Irrespect, malédiction? | Boss pas mort |
| 806 | "je mange le cristal magique" | 🤖 AI | Indigestion magique, dégâts | Cristal trop gros |
| 807 | "je me noie volontairement" | 🤖 AI | Dégâts, quelqu'un sauve? | Mort → respawn |
| 808 | "je vends mon âme" | 🤖 AI | Pacte démoniaque narratif | Pas de démon |
| 809 | "j'essaie de voler (dans les airs)" | 🤖 AI | Saut pathétique | Pas d'ailes |
| 810 | "je mange le PNJ" | 🤖 AI | Crime cannibale, crime | PNJ se défend |
| 811 | "je fais du yoga devant le boss" | 🤖 AI | Boss confus, tour gratuit | Boss attaque |
| 812 | "j'adopte le slime" | ✅ recruit | Slime tamed si dé OK | Slime attaque |
| 813 | "je me transforme en loup" | 🤖 AI | Pas de transformation | Pas de magie |
| 814 | "je creuse jusqu'au centre de la terre" | ✅ destroy | 1 tile creusé | Sol trop dur |
| 815 | "je fais un selfie avec le boss" | 🤖 AI | Narration absurde | Pas de caméra |
| 816 | "j'apprends au slime à parler" | 🤖 AI | Slime fait "blob" | Pas de progrès |
| 817 | "je construis un robot" | 🤖 AI | Pas de technologie | Médiéval fantasy |
| 818 | "je fais un barbecue avec le dragon" | 🤖 AI | BBQ épique narrative | Dragon hostile |
| 819 | "je donne un nom au rocher" | 🤖 AI | "Pierre-Jean" narratif | Rocher indifférent |
| 820 | "je fais un concert de rock" | 🤖 AI | Musique narrative | Pas d'instruments |
| 821 | "je mange la clé" | 🤖 AI | Clé avalée, dégâts | Pas de clé |
| 822 | "je kidnappe le bébé du boss" | 🤖 AI | Pas de bébé | Boss furieux |
| 823 | "je fais la paix dans le monde" | 🤖 AI | Utopie narrative | Trop ambitieux |
| 824 | "je renverse le régime" | 🤖 AI | Révolution narrative | Pas de régime |
| 825 | "je mange 100 potions d'un coup" | ✅ use | 1 potion consommée par action | Overdose narrative |
| 826 | "j'accuse le PNJ d'être le boss déguisé" | ✅ talk | PNJ confus/offensé | — |
| 827 | "je fais un backflip" | 🤖 AI | Acrobatie narrative | Atterrissage raté |
| 828 | "je demande au boss pourquoi il est méchant" | ✅ talk | Lore boss narrative | Boss attaque |
| 829 | "je creuse la tombe du boss vivant" | ✅ destroy | Trou creusé, provocation | Boss offensé |
| 830 | "je me déguise en arbre" | 🤖 AI | Camouflage absurde | Repéré |
| 831 | "je fais du commerce avec les monstres" | ✅ talk | Monstres confus | Pas de mécanique |
| 832 | "je lance un caillou sur la lune" | 🤖 AI | Caillou retombe | Trop loin |
| 833 | "j'essaie de devenir le boss" | 🤖 AI | Narration de pouvoir | Pas de mécanique |
| 834 | "je fais un château de sable" | 🤖 AI | Château narratif | Pas de sable |
| 835 | "j'essaie de réanimer le mort" | 🤖 AI | Résurrection échoue | Pas de magie nécro |
| 836 | "je vole les vêtements du garde" | ✅ steal | Vol absurde narrative | Garde se défend |
| 837 | "je fais une bataille de nourriture" | 🤖 AI | Gaspillage narratif | Pas de nourriture |
| 838 | "je nomme le slime premier ministre" | 🤖 AI | Nomination absurde | Slime indifférent |
| 839 | "j'organise les JO du donjon" | 🤖 AI | Compétition narrative | Pas de participants |
| 840 | "je fais un câlin au guard" | ✅ talk | Garde gêné/amusé | Garde repousse |
| 841 | "je plante un drapeau sur le boss mort" | 🤖 AI | Victoire symbolique | Boss vivant |
| 842 | "je fais une blague au démon" | ✅ talk | Démon rit/enragé | Blague pas drôle |
| 843 | "j'appelle mon avocat" | 🤖 AI | Pas d'avocat en fantasy | Anachronisme |
| 844 | "je google comment battre le boss" | 🤖 AI | Pas de Google | Anachronisme |
| 845 | "je fais un TikTok" | 🤖 AI | Pas de technologie | Anachronisme |
| 846 | "j'ouvre un restaurant" | 🤖 AI | Restaurant narratif | Pas de mécanique |
| 847 | "je deviens végétarien" | 🤖 AI | Choix de vie narratif | Pas d'impact |
| 848 | "je fais du surf sur le slime" | 🤖 AI | Slime-surf narrative | Slime attaque |
| 849 | "je peins le mur du donjon" | 🤖 AI | Art narratif | Pas de peinture |
| 850 | "j'apprends au boss la danse" | 🤖 AI | Boss confus | Boss attaque |
| 851 | "je fais un potager" | 🤖 AI | Jardin narratif | Zone hostile |
| 852 | "je lance le bouclier comme un frisbee" | ✅ attack | Dégâts distance | Bouclier perdu |
| 853 | "je fais ami avec la mort" | 🤖 AI | Narration philosophique | Pas d'entité mort |
| 854 | "j'organise une rave dans le donjon" | 🤖 AI | Fête narratif | Monstres pas d'humeur |
| 855 | "je demande au boss son numéro" | ✅ talk | Boss confus/amusé | Boss attaque |
| 856 | "j'ouvre un zoo avec mes monstres" | 🤖 AI | Zoo narratif | Pas de mécanique |
| 857 | "je fais de la spéléologie" | ✅ move | Exploration grotte | Pas de grotte |
| 858 | "je mange le chapeau du marchand" | 🤖 AI | Chapeau mangé, dégâts | Marchand furieux |
| 859 | "j'invente la poudre à canon" | 🤖 AI | Invention narrative | Trop avancé |
| 860 | "je fais un discours de motivation au slime" | ✅ talk | Slime motivé narrative | Slime indifférent |
| 861 | "j'essaie de diviser par zéro" | 🤖 AI | Univers stable | Math pas une action |
| 862 | "je vole le temps" | 🤖 AI | Absurde poétique | Pas possible |
| 863 | "je mange le sol" | 🤖 AI | Dégâts narratif | Terre pas comestible |
| 864 | "je fais un combat de regards avec le boss" | ✅ talk | Boss impressionné? | Boss frappe |
| 865 | "je crée une religion" | 🤖 AI | Culte narratif | Pas de fidèles |
| 866 | "j'essaie de casser le jeu" | 🤖 AI | Le jeu résiste | Méta-humour |
| 867 | "je regarde sous la carte" | 🤖 AI | Void narratif | Pas de "sous" |
| 868 | "je recule le temps" | 🤖 AI | Pas de time travel | Impossible |
| 869 | "j'ordonne au soleil de se coucher" | 🤖 AI | Soleil indifférent | Pas de cycle jour |
| 870 | "je deviens invisible" | 🤖 AI | Pas de sort invisibilité | Visible |
| 871 | "je clone le PNJ" | 🤖 AI | Pas de clonage | Impossible |
| 872 | "j'absorbe les pouvoirs du boss" | 🤖 AI | Pas de mécanique absorption | Échec |
| 873 | "j'apprivoise l'arbre" | ✅ recruit | Arbre pas recruteable | Échec WTF |
| 874 | "je fais un trou noir" | 🤖 AI | Pas de physique avancée | Impossible |
| 875 | "je parle au narrateur" | 🤖 AI | Méta, narrateur répond? | 4th wall |
| 876 | "je quitte le jeu" | 🤖 AI | Narration d'adieu | Toujours en jeu |
| 877 | "j'annule ma dernière action" | 🤖 AI | Pas de undo | Impossible |
| 878 | "je crée un nouveau personnage" | 🤖 AI | Pas de re-roll | Un seul perso |
| 879 | "j'achète le jeu" | 🤖 AI | Méta-humour | Déjà dedans |
| 880 | "je speedrun le donjon" | ✅ move | Déplacement rapide vers boss | Obstacles |
| 881 | "j'utilise le cheat code" | 🤖 AI | Pas de cheats | Pas de codes |
| 882 | "je sauvegarde" | 🤖 AI | Save auto narrative | Pas une action |
| 883 | "je charge ma partie précédente" | 🤖 AI | Pas de load | Continuité |
| 884 | "j'ouvre la console développeur" | 🤖 AI | Méta, pas d'accès | 4th wall |
| 885 | "j'efface le boss du jeu" | 🤖 AI | Boss toujours là | Impossible |
| 886 | "je fais spawner 1000 potions" | 🤖 AI | Pas de spawn commands | Triche refusée |
| 887 | "je vends le jeu" | 🤖 AI | Méta-humour | Pas une action |
| 888 | "j'appelle le support technique" | 🤖 AI | Pas de support en fantasy | Anachronisme |
| 889 | "je rage quit" | 🤖 AI | Narration de frustration | Toujours en jeu |
| 890 | "j'invoque Cthulhu" | 🤖 AI | Invocation échoue | Mauvais univers |
| 891 | "je fais du breakdance au combat" | 🤖 AI | Danse combat narrative | Boss frappe |
| 892 | "j'essaie de corrompre l'IA du jeu" | 🤖 AI | Méta, IA résiste | Prompt injection refusé |
| 893 | "je photobomb le boss" | 🤖 AI | Anachronisme narratif | Pas de photo |
| 894 | "je bois la lave" | 🤖 AI | Mort instantanée narrative | Dégâts massifs |
| 895 | "je mange le mur" | 🤖 AI | Dents cassées narrative | Pas comestible |
| 896 | "je fais l'amour au donjon" | 🤖 AI | Narration éludée | Pas de mécanique |
| 897 | "j'adopte le boss comme père" | 🤖 AI | Boss confus | Refus |
| 898 | "je lance une startup" | 🤖 AI | Entrepreneuriat médiéval | Anachronisme |
| 899 | "je fais un procès au slime" | 🤖 AI | Tribunal narratif | Pas de justice pour slimes |
| 900 | "j'essaie de sortir de la matrice" | 🤖 AI | Méta philosophique | Toujours en jeu |

---

## J. CRÉATIF, ENVIRONNEMENT & META (901-1000)

| # | Action du joueur | Verbe | Succès | Échec |
|---|---|---|---|---|
| 901 | "je chante" | 🤖 AI | Mélodie narrative | Fausse note |
| 902 | "je danse" | 🤖 AI | Danse narrative | Trébuchement |
| 903 | "je dessine sur le sol" | 🤖 AI | Dessin narrative | Pas d'outil |
| 904 | "je fais de la musique avec les os" | 🤖 AI | Xylophone macabre | Pas d'os |
| 905 | "je compose un poème" | 🤖 AI | Poème narratif | Pas inspiré |
| 906 | "je grave mon nom dans la pierre" | ✅ destroy | Gravure narrative | Pierre trop dure |
| 907 | "je plante une fleur" | 🤖 AI | Fleur plantée narrative | Pas de graine |
| 908 | "je fais un bonhomme de neige" | 🤖 AI | Bonhomme narrative | Pas de neige |
| 909 | "je joue de la flûte" | 🤖 AI | Musique apaisante | Pas de flûte |
| 910 | "je peins un portrait du PNJ" | 🤖 AI | Portrait narrative | Pas de peinture |
| 911 | "je fais du théâtre d'ombres" | 🤖 AI | Spectacle narrative | Pas de lumière |
| 912 | "je raconte une histoire aux enfants" | ✅ talk | Histoire narrative | Pas d'enfants |
| 913 | "je fais un feu d'artifice" | 🤖 AI | Spectacle | Pas de matériel |
| 914 | "je sculpte le bois" | 🤖 AI | Sculpture narrative | Pas de bois |
| 915 | "j'écris un livre" | 🤖 AI | Livre narratif | Pas de plume |
| 916 | "je fais du jonglage" | 🤖 AI | Jonglage narrative | Items tombent |
| 917 | "je siffle un air" | 🤖 AI | Mélodie narrative | — |
| 918 | "je fais un noeud marin" | 🤖 AI | Noeud fait | Pas de corde |
| 919 | "je dessine une carte" | 🤖 AI | Carte dessinée | Pas de papier |
| 920 | "j'envoie un message en bouteille" | 🤖 AI | Bouteille lancée | Pas d'eau |
| 921 | "je plante un arbre" | 🤖 AI | Arbre planté narrative | Pas de graine |
| 922 | "je creuse un canal" | ✅ destroy | 1 tile creusé | Sol dur |
| 923 | "je fais un pont de singe" | 🤖 AI | Pont narrative | Pas de corde |
| 924 | "je décore l'auberge" | 🤖 AI | Déco narrative | Pas à l'auberge |
| 925 | "je fais un monument aux héros" | 🤖 AI | Monument narrative | Pas de matériaux |
| 926 | "je renomme le village" | 🤖 AI | Nouveau nom narratif | Pas d'autorité |
| 927 | "je cartographie le donjon" | ✅ inspect | Description zones visitées | Pas dans donjon |
| 928 | "je fais un jardin zen" | 🤖 AI | Jardin narrative | Zone hostile |
| 929 | "je crée une carte au trésor" | 🤖 AI | Carte narrative | Pas de trésor |
| 930 | "je fais un cairn" | 🤖 AI | Pile de pierres narrative | Pas de pierres |
| 931 | "je marque le chemin" | 🤖 AI | Balises narratif | — |
| 932 | "je fais une offrande au temple" | 🤖 AI | Offrande, bénédiction? | Pas d'item à offrir |
| 933 | "je lance une pièce pour décider" | 🤖 AI | Pile ou face narrative | Pas de pièce |
| 934 | "j'enterre un objet" | 🤖 AI | Objet enterré | Pas de mécanique |
| 935 | "je fais un souhait" | 🤖 AI | Souhait narratif | Pas de lampe |
| 936 | "je pleure" | 🤖 AI | Émotion narrative | — |
| 937 | "je ris" | 🤖 AI | Rire narratif | — |
| 938 | "je hurle de rage" | 🤖 AI | Cri, attention des monstres | Monstres alertés |
| 939 | "je fais le mort" | 🤖 AI | Feindre la mort | Monstre pas dupe |
| 940 | "je contemple le vide" | 🤖 AI | Philosophie narrative | Stress? |
| 941 | "j'appelle le vent" | 🤖 AI | Brise narrative | Pas de magie |
| 942 | "je pose pour une statue" | 🤖 AI | Pose héroïque | Personne ne regarde |
| 943 | "j'invente un nouveau mot" | 🤖 AI | Mot inventé narrative | Personne comprend |
| 944 | "je baptise mon épée" | 🤖 AI | Nom d'arme narrative | Pas d'épée |
| 945 | "j'écris sur le mur du donjon" | 🤖 AI | Tag narratif | Pas de quoi écrire |
| 946 | "je fais un pacte avec la nature" | 🤖 AI | Pacte druidique | Pas de magie |
| 947 | "j'observe le flux de mana" | ✅ inspect | Flux magique narratif | Pas de mana visible |
| 948 | "je trace un cercle magique" | 🤖 AI | Cercle narrative | Pas de magie |
| 949 | "je médite sur le sens de la vie" | ✅ rest | Stress réduit, philosophie | — |
| 950 | "je fais un rituel ancien" | 🤖 AI | Rituel narratif, effet? | Pas de connaissances |
| 951 | "je bénis mon arme" | 🤖 AI | Arme bénie narratif | Pas de pouvoir sacré |
| 952 | "j'entonne un chant de guerre" | 🤖 AI | Moral allié + | Pas d'alliés |
| 953 | "je fais le serment du héros" | 🤖 AI | Serment narratif | — |
| 954 | "je communique avec les esprits" | 🤖 AI | Esprits narratif | Pas de médium |
| 955 | "je lis les lignes de la main du PNJ" | ✅ talk | Divination narrative | PNJ sceptique |
| 956 | "je fais une cérémonie funéraire" | 🤖 AI | Cérémonie narratif | Pas de mort |
| 957 | "j'invoque la pluie" | 🤖 AI | Pluie narrative | Pas de magie météo |
| 958 | "je défie les lois de la physique" | 🤖 AI | Gravité persiste | Impossible |
| 959 | "je fais une déclaration de guerre" | ✅ talk | Guerre narrative | Pas de faction ennemie |
| 960 | "j'abdique mon titre" | 🤖 AI | Titre perdu narratif | Pas de titre |
| 961 | "je forme une alliance avec les monstres" | ✅ recruit | 1 monstre recruté si dé | Monstres hostiles |
| 962 | "je déclare l'indépendance du donjon" | 🤖 AI | Déclaration absurde | Pas de mécanique |
| 963 | "je fais un discours au cratère" | ✅ talk | Discours au vide | Personne écoute |
| 964 | "je fais un sacrifice au volcan" | 🤖 AI | Sacrifice narratif | Pas de volcan |
| 965 | "je maudis le boss" | 🤖 AI | Malédiction narrative | Pas de magie |
| 966 | "je fais un voeu à la fontaine" | 🤖 AI | Voeu + -1 or | Pas de fontaine |
| 967 | "je rédige un testament" | 🤖 AI | Testament narratif | Pas de plume |
| 968 | "j'organise un tournoi" | 🤖 AI | Tournoi narratif | Pas de participants |
| 969 | "je fais un concours de cuisine" | 🤖 AI | Concours narrative | Pas de cuisine |
| 970 | "j'essaie de domestiquer le feu" | 🤖 AI | Feu narratif | Brûlures |
| 971 | "je plante ma bannière" | 🤖 AI | Territoire marqué | Pas de bannière |
| 972 | "je fais un spectacle de magie" | 🤖 AI | Spectacle narratif | Pas de magie |
| 973 | "je fais du troc avec la nature" | 🤖 AI | Nature indifférente | Absurde |
| 974 | "j'enseigne l'art du combat au slime" | ✅ talk | Slime blob narrative | Slime pas d'armes |
| 975 | "je fais une sieste dans un arbre" | ✅ rest | Repos arboricole | Chute |
| 976 | "je déclare la paix universelle" | 🤖 AI | Paix narrative | Monstres pas d'accord |
| 977 | "j'essaie de transcender" | 🤖 AI | Transcendance narrative | Toujours mortel |
| 978 | "je fais un haiku" | 🤖 AI | Haiku composé | Syllabes fausses |
| 979 | "je donne un cours de philo" | ✅ talk | Leçon narrative | Personne intéressé |
| 980 | "j'ouvre une école" | 🤖 AI | École narrative | Pas de bâtiment |
| 981 | "je fais grève" | 🤖 AI | Refus d'avancer narrative | Pas d'employeur |
| 982 | "j'écris mes mémoires" | 🤖 AI | Mémoires narrative | Pas de quoi écrire |
| 983 | "j'invente la roue" | 🤖 AI | Roue narrative | Déjà inventée |
| 984 | "je fais un sondage de satisfaction" | 🤖 AI | Méta-humour | Pas de mécanique |
| 985 | "j'organise un défilé" | 🤖 AI | Défilé narratif | Pas de participants |
| 986 | "j'essaie de me souvenir de ma vie passée" | 🤖 AI | Flashback narratif | Rien à se souvenir |
| 987 | "je fais une prédiction" | 🤖 AI | Prophétie narratif | Fausse |
| 988 | "je cherche le sens du jeu" | 🤖 AI | Philosophie méta | Pas de réponse |
| 989 | "j'écris 'ici était un héros' sur le mur" | 🤖 AI | Graffiti narrative | Pas de quoi écrire |
| 990 | "j'attends" | ✅ rest | 1 tour passe, stress -1 | — |
| 991 | "je ne fais rien" | ✅ rest | Tour passe, monde avance | — |
| 992 | "je réfléchis à ma stratégie" | ✅ rest | Focus narratif | — |
| 993 | "je fais le bilan" | ✅ inspect | État complet joueur | — |
| 994 | "je me prépare au pire" | ✅ rest | Préparation narrative | — |
| 995 | "je regarde le joueur dans les yeux" | 🤖 AI | 4th wall break | Méta |
| 996 | "je dis merci au développeur" | 🤖 AI | Méta-remerciement | 4th wall |
| 997 | "j'essaie de trouver le Easter egg" | 🤖 AI | Easter egg narratif? | Pas d'easter egg |
| 998 | "je fais un bug report" | 🤖 AI | Méta-humour | Pas de support |
| 999 | "je souris" | 🤖 AI | Sourire narratif | — |
| 1000 | "je vis ma meilleure vie" | 🤖 AI | Narration épique de conclusion | Le voyage continue |

---

## RÉSUMÉ DE COUVERTURE

| Catégorie | Total | ✅ Verb Engine | 🤖 AI Fallback | Taux couverture |
|---|---|---|---|---|
| A. Combat | 120 | ~95 | ~25 | **79%** |
| B. Commerce | 50 | ~38 | ~12 | **76%** |
| C. Vol & Discrétion | 100 | ~72 | ~28 | **72%** |
| D. Déplacement | 100 | ~88 | ~12 | **88%** |
| E. Social & Dialogue | 130 | ~90 | ~40 | **69%** |
| F. Exploration | 100 | ~96 | ~4 | **96%** |
| G. Destruction & Construction | 100 | ~68 | ~32 | **68%** |
| H. Repos & Items | 100 | ~68 | ~32 | **68%** |
| I. WTF & Improbable | 100 | ~8 | ~92 | **8%** |
| J. Créatif & Meta | 100 | ~18 | ~82 | **18%** |
| **TOTAL** | **1000** | **~641** | **~359** | **~64%** |

### Analyse

**Le Verb Engine couvre ~64% des 1000 actions** de manière déterministe, sûre et prévisible.

Les ~36% restants tombent sur l'IA, ce qui est **normal et souhaité** :
- Les actions WTF/méta/créatives sont par nature imprévisibles → l'IA est le bon outil
- Les actions de construction/craft n'ont pas encore de VerbHandler → extensible
- Les actions sociales complexes (alliances, procès, trahisons) dépassent le scope d'un handler simple

**Points forts de la généralisation :**
1. Toute action de combat/mouvement/achat/vente/vol/repos/inspection est gérée sans IA
2. Le fallback IA garantit que RIEN n'est impossible — le joueur reçoit toujours une réponse
3. Ajouter un nouveau verbe (craft, fish, cook...) = 1 fichier de 60-80 lignes

**Pour passer de 64% à 80%+ :**
- Ajouter `craftVerb` (couvre construction/fabrication → +30 actions)
- Ajouter `giveVerb` (donner des items → +15 actions)
- Ajouter `hideVerb` (se cacher/stealth → +20 actions)
- Ajouter `castVerb` (magie/sorts → +25 actions)
- Ajouter `performVerb` (actions sociales/créatives → +20 actions)
