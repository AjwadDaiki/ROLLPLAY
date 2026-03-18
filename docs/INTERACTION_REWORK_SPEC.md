# Oracle20 - Interaction Rework Spec

Date: 2026-03-18  
Status: proposition produit/technique a valider avant implementation code.

## 1. Decision produit

Le jeu ne doit plus etre pilote principalement par un champ de texte global en bas de l ecran.

Nouvelle regle:

- le joueur agit d abord dans le monde,
- le clavier et la souris deviennent l interface primaire,
- le texte libre reste central, mais il est contextualise par une cible et une position,
- le panneau `Narrateur MJ` reste a droite pour raconter, journaliser et historiser la partie.

Formule cible:

`Se deplacer -> cibler le monde -> exprimer une intention -> roll -> consequence visible -> narration persistante`

Le MJ IA ne disparait pas.  
Il change de place dans l experience:

- il n est plus la "surface" principale d interaction,
- il devient le moteur d interpretation, de narration et d arbitrage.

## 2. Experience cible joueur

### 2.1 Boucle principale

1. Le joueur se deplace dans le monde avec le clavier ou la souris.
2. Il survole ou selectionne une cible:
   - PNJ
   - batiment
   - arbre
   - caisse
   - sol
   - bord d ecran
3. Il clique droit sur la cible pour ouvrir un popup d interaction contextualise.
4. Il ecrit librement ce qu il veut faire a cette cible ou dans cette zone.
5. Le moteur resout l action avec contexte + D20 + regles + contraintes.
6. Le resultat apparait:
   - en bulle au dessus du joueur ou de la cible,
   - dans le panneau `Narrateur MJ`,
   - dans le state du monde si l action change vraiment quelque chose.

### 2.2 Controles cibles

Par defaut:

- deplacement clavier: `ZQSD`
- schema alternatif: fleches, ou remap complet dans `Parametres`
- clic gauche sur une case marchable: deplacement
- clic gauche sur une cible proche: selection/focus
- clic droit sur une cible ou une case: ouvrir l interaction contextuelle

Regles absolues de deplacement:

- deplacement strictement case par case,
- aucun mouvement diagonal,
- une seule case orthogonale par input clavier,
- pathfinding souris limite aux segments orthogonaux valides.

Preview de trajectoire:

- au survol d une case marchable, le jeu calcule le chemin previsionnel reel,
- ce chemin apparait en surbrillance avant le clic,
- la surbrillance doit correspondre exactement au chemin qui sera suivi,
- si aucun chemin propre n existe, la preview doit l indiquer visuellement au lieu de mentir.

Regles de navigation:

- si le joueur atteint le bord d un ecran avec le clavier et que le passage est valide, le slide de chunk se declenche immediatement,
- si le joueur utilise la souris, des fleches de transition apparaissent sur les bords valides pour rendre ce passage explicite,
- la navigation souris ne doit jamais teleporter sans lecture visuelle du trajet.

## 2.3 Boucle monde vivante

Le monde ne doit pas attendre passivement le joueur.

Apres chaque action joueur validee:

- les ennemis peuvent reagir,
- les PNJ peuvent se deplacer ou changer d humeur,
- le monde peut faire avancer un mini tick d ambiance,
- un directeur d evenements peut preparer ou declencher un nouvel evenement.

## 3. Contrat d immersion

Le joueur ne "parle" plus a une console abstraite.  
Il parle au monde.

Exemples:

- clic droit sur un arbre -> `je grimpe`, `je coupe une branche`, `je regarde si quelque chose est cache`
- clic droit sur le marchand -> `baisse le prix`, `je te paye demain`, `montre tes potions rares`
- clic droit sur le sol -> `je creuse ici`, `je pose un piege`, `je me cache`
- clic droit sur une porte -> `je frappe`, `je crochete`, `je colle mon oreille`

La liberte reste totale:

- toute action est tentable,
- toute action doit recevoir une resolution claire,
- toute resolution doit etre rattachee a une cible ou a une zone.

## 4. Monde entity-first

Pour rendre ce modele maintenable, tout ce qui compte dans le monde doit etre adresse comme une entite.

### 4.1 Types de cibles

Le moteur doit pouvoir cibler au moins:

- `actor`: PNJ, animal, monstre, boss, joueur
- `structure`: boutique, guilde, auberge, maison, donjon, citadelle, ruine, portail
- `object`: arbre, caisse, pierre, puits, enseigne, feu, mobilier, ressource
- `tile`: une case ou une zone de terrain sans entite forte
- `edge`: un bord de chunk / transition d ecran
- `self`: le joueur lui-meme

### 4.2 Contrat minimal d une entite

Chaque entite interactive doit exposer:

```ts
type WorldEntity = {
  id: string;
  type: "actor" | "structure" | "object" | "tile" | "edge";
  label: string;
  role?: string;
  profession?: string;
  faction?: string;
  personality?: string[];
  loreSummary?: string;
  chunk: { x: number; y: number };
  position: { x: number; y: number };
  footprint: Array<{ x: number; y: number }>;
  blockedCells: Array<{ x: number; y: number }>;
  approachCells: Array<{ x: number; y: number }>;
  interactionCells: Array<{ x: number; y: number }>;
  bubbleAnchor: { x: number; y: number };
  labelAnchor: { x: number; y: number };
  homeAnchor?: { x: number; y: number };
  workAnchor?: { x: number; y: number };
  patrolProfile?: "fixed" | "lane" | "loop" | "wander" | "schedule";
  scheduleKey?: string;
  relationshipToPlayer?: number;
  recruitmentEligible?: boolean;
  recruitmentMode?: "persuade" | "hire" | "oath" | "tame" | "dominate" | "rescue_debt";
  loyalty?: number;
  morale?: number;
  obedience?: number;
  bravery?: number;
  trust?: number;
  fear?: number;
  greed?: number;
  alertness?: number;
  aura?: number;
  force?: number;
  vitesse?: number;
  volonte?: number;
  magie?: number;
  defense?: number;
  precision?: number;
  esquive?: number;
  perception?: number;
  discretion?: number;
  chance?: number;
  hearingRange?: number;
  sightRange?: number;
  aggroRange?: number;
  actionCooldowns?: Record<string, number>;
  memoryFlags?: string[];
  lastInteractionSignatures?: string[];
  tags: string[];
  capabilities: string[];
  states: string[];
};
```

### 4.3 Regle speciale batiments

Les batiments ne doivent plus etre seulement des sprites ou des POI.

Ils doivent etre des `structures` avec:

- une silhouette visuelle stable,
- un footprint de collision,
- une entree canonique,
- une zone d approche,
- une zone d interaction,
- un label,
- des PNJ rattaches,
- des tags et capabilities.

Exemples:

- la boutique connait `merchant`, `trade`, `buy`, `sell`, `haggle`
- la guilde connait `quest_board`, `guild_master`, `rank`, `contract`
- l auberge connait `rest`, `rent_room`, `rumor`
- une maison connait `resident`, `private`, `knock`, `break_in`

## 4.4 Panneau d info lore

Quand le joueur clique droit sur un PNJ, le popup doit proposer deux voies:

- `Interagir`
- `Infos`

Le bouton `Infos` ouvre une fiche lore concise avec:

- nom
- role
- metier
- faction
- personnalite dominante
- humeur actuelle
- relation au joueur
- rumeurs / lore resume
- tags sociaux utiles (`avare`, `mefiant`, `loyal`, `pieux`, `violent`, etc.)

Cette fiche ne doit pas spoiler tout le jeu.  
Elle doit aider a comprendre le monde et a mieux choisir ses interactions.

## 5. Contrat d input cible

Le texte libre ne disparait pas.  
Il change de forme.

Au lieu d un simple:

```ts
{ actionText, state }
```

la couche interaction doit produire un input plus riche:

```ts
type PlayerInteractionRequest = {
  inputMode: "keyboard" | "mouse";
  actionText: string;
  targetRef:
    | { id: string; type: "actor" | "structure" | "object" | "tile" | "edge" | "self" }
    | null;
  targetTile: { x: number; y: number } | null;
  playerOrigin: { x: number; y: number; chunkX: number; chunkY: number };
  requestedApproach: boolean;
  uiIntentHint:
    | "move"
    | "talk"
    | "inspect"
    | "trade"
    | "attack"
    | "use"
    | "alter_world"
    | "transition"
    | null;
  repeatSignature: string;
};
```

## 6. Resolver cible

Le moteur de resolution doit devenir `target-aware`.

Il doit recevoir:

- le texte libre,
- la cible exacte ou la case visee,
- la position du joueur,
- les metadonnees de la cible,
- le contexte local autour de la cible.

Le moteur doit alors:

1. verifier si le joueur est deja a portee,
2. approcher si necessaire,
3. resoudre l intention,
4. appliquer les effets,
5. produire une reponse locale et une narration persistante.

### 6.1 Regle de portee

Si une action demande une cible hors portee:

- le jeu privilegie d abord une approche visible,
- puis ouvre ou relance l interaction,
- sauf si l action est explicitement a distance.

Exemple:

- clic droit sur le marchand trop loin -> le joueur s approche du marchand -> popup d interaction disponible

### 6.2 Regle "tout est possible"

La promesse reste:

- toute action est tentable,
- rien ne doit etre bloque par manque de bouton,
- mais tout passe quand meme par des contraintes de portee, ressources, risques, opposition et policy.

Le moteur doit continuer a utiliser:

- interpretation libre,
- compilation en actions connues,
- degradation controlee quand l action est trop nouvelle,
- rejet explicite si elle est interdite ou absurde.

## 6.3 PNJ et personalite

La personnalite d un PNJ doit modifier la resolution.

Exemples:

- un marchand `avare` resiste mieux aux reductions de prix,
- un garde `soupconneux` aggrave plus vite une tentative louche,
- un aubergiste `chaleureux` donne plus facilement une rumeur,
- un PNJ `craintif` peut ceder sous intimidation mais rompre ensuite la relation.

La personnalite n est pas seulement du lore.  
Elle influence:

- prix
- confiance
- reponses sociales
- probabilites de cooperation
- types d evenements futurs

## 7. Anti-spam et anti-boucle

Le nouveau modele ne doit pas permettre de cliquer 20 fois la meme demande pour exploiter le systeme.

Chaque tentative doit donc porter une signature stable:

`acteur + cible + verbe + contexte local + fenetre de tours`

Effets attendus:

- si la meme action est repetee trop vite, le jeu explique la repetition,
- le meme marchand ne renegocie pas infiniment sans changement de contexte,
- la meme fouille sur le meme arbre ne redonne pas un loot gratuit,
- la meme intimidation sur le meme PNJ peut etre ignoree, aggraver la relation ou monter le stress,
- la narration doit dire pourquoi la repetition perd de sa valeur.

Le panneau MJ doit l afficher clairement:

- `Tu as deja tente cela il y a un instant.`
- `Le marchand se ferme et refuse de renegocier.`
- `Le sol est deja retourne ici.`

## 8. Collision, pathfinding, transitions

### 8.1 Collision

Le moteur de deplacement doit considerer:

- footprint des structures,
- props solides,
- acteurs,
- cases detruites ou ouvertes,
- portes reelles et non visuelles.

### 8.2 Pathfinding

Le clic gauche doit:

- calculer un chemin court vers la case cible,
- s arreter avant une collision,
- choisir automatiquement une `approachCell` pour un PNJ ou une structure si la cible elle-meme est non marchable,
- ne jamais couper en diagonale,
- ne jamais traverser une porte murale ou un decor non valide,
- conserver exactement le chemin previsualise.

### 8.2.1 Surbrillance de chemin

Le chemin affiche avant clic doit:

- utiliser un code couleur lisible,
- montrer la case finale,
- montrer les cases bloquees si la destination est invalide,
- se mettre a jour instantanement quand la souris bouge,
- disparaitre quand le popup d interaction est ouvert.

### 8.3 Bords de chunk

Clavier:

- toucher le bord valide = slide direct.

Souris:

- afficher une fleche de passage sur le bord vise,
- clic sur cette fleche = transition,
- pas de passage silencieux ni ambigu.

## 8.4 Risques de bugs a prevenir

Cette refonte peut creer des bugs structurels.  
Le systeme doit les anticiper des la spec.

Bugs critiques a prevenir:

- preview de chemin differente du trajet reel,
- chemin valide au hover mais invalide au clic apres mouvement d un acteur,
- ouverture du popup sur une mauvaise cible a cause d un mauvais z-index ou hitbox,
- slide de chunk pendant un autopathe incomplet,
- ennemi qui attaque a travers un mur ou un batiment,
- PNJ qui se parle a lui-meme car mauvaise cible selectionnee,
- clic droit sur batiment qui ouvre la fiche d un PNJ proche par erreur,
- boucle d aggro infinie au bord d un chunk,
- evenement aleatoire qui coupe une interaction critique au mauvais moment,
- repetition involontaire de la meme action a cause d un mauvais `repeatSignature`,
- bulle locale qui ne correspond pas au log du `Narrateur MJ`,
- acteur pousse dans une case bloquee apres mutation du monde,
- transitions souris qui ignorent une collision fraichement creee.

Regle:

- la preview, la collision, la portee et la resolution doivent partager la meme source de verite.

## 9. Bulles et narration

Le resultat d une interaction doit exister a deux niveaux.

### 9.1 Niveau local

Une bulle doit apparaitre:

- au dessus du joueur pour son intention ou son action,
- au dessus du PNJ si le PNJ repond,
- au dessus d un objet ou d une case si le monde "repond" par une description.

Exemples:

- joueur: `Je veux negocier ce prix.`
- marchand: `Je peux retirer 2 or, pas plus.`
- arbre: `L ecorce cede, mais rien d utile n apparait.`

### 9.2 Niveau persistant

Le panneau `Narrateur MJ` a droite reste en place et conserve:

- historique,
- interpretation,
- resultat du D20,
- consequences systemes,
- reponse narrative plus complete.

Le panneau de droite ne disparait pas.  
Il devient le journal de reference du monde.

## 9.3 Evenements de monde dynamiques

Pour rendre chaque run differente, le jeu doit avoir un `World Event Director`.

Regle de base:

- toutes les `3 a 10` actions joueur, le directeur peut tenter de generer un nouvel evenement,
- il ne doit pas spammer un evenement a chaque fenetre,
- il doit respecter le biome, le moment, l etat du monde, les quetes, la tension et les evenements recents.

Effets attendus:

- nouveau monstre attaque le village,
- nouvelle quete disponible a la guilde,
- marchand ambulant apparait,
- animal rare visible en foret,
- voyageur blesse demande de l aide,
- garde cherche un suspect,
- rumeur sur un tresor ou un danger,
- bandits sur la route,
- incendie mineur,
- autel magique instable,
- faille surnaturelle,
- caravane en panne,
- duel entre PNJ,
- enfant perdu,
- pluie de cendres,
- attaque de loups,
- chasseur demon blesse,
- objet maudit decouvert,
- maison verrouillee soudainement,
- renforts a la citadelle,
- boss qui envoie des eclaireurs,
- taxes improvisees,
- fete locale,
- rupture de stock a la boutique,
- reduction temporaire a l auberge,
- quete urgente de defense,
- disparition nocturne,
- invasion de slimes,
- marchand voleur,
- rencontre mystique,
- fragment magique tombe du ciel.

Regles de securite:

- pas d evenement world-scale toutes les 3 actions si la tension est deja haute,
- pas d evenement qui rend une quete principale impossible sans contrepartie,
- pas de repetition immediate du meme template,
- historique recent obligatoire pour varier les runs.

## 9.4 Contexte narratif persistant: crime, reputation, justice

Le monde doit se souvenir moralement et socialement de ce que fait le joueur.

Principe:

- un acte gratuit contre un innocent ne peut pas etre traite comme un combat neutre,
- une defense heroique ne peut pas etre oubliee au tour suivant,
- quitter un chunk ne doit pas effacer la consequence sociale,
- revenir plus tard doit retrouver un monde coherent avec les actes passes.

### Crimes et memoire sociale

Exemple de reference:

- le joueur tue un villageois sans raison,
- des temoins, gardes ou survivants peuvent `voir`, `entendre` ou `deduire` l acte,
- un incident de type `crime grave` est cree,
- la milice peut etre envoyee,
- la faction du village peut devenir hostile,
- cette hostilite doit persister si le joueur fuit puis revient.

Le moteur doit prendre en compte:

- type de victime (`civil`, `garde`, `marchand`, `notable`, `monstre`, `bandit`)
- lieu (`village`, `route`, `foret`, `donjon`, etc.)
- temoins directs
- temoins indirects / rapport
- legitimite de l acte (`defense`, `quete`, `crime gratuit`, `duel`, `ordre de mission`)
- gravite
- repetition

Sorties possibles:

- milice deployee
- prime / mise a prix
- boutique fermee au joueur
- garde hostile a vue
- villageois paniques ou fuyants
- refus de quete
- rumeurs negatives persistantes

### Reputation heroique

L inverse doit exister aussi.

Exemples:

- le joueur tue des monstres qui menacent le village,
- sauve un PNJ,
- defend une route,
- termine une quete utile,
- respecte ses promesses.

Effets attendus:

- villageois plus chaleureux
- prix negocies plus facilement
- nouvelles quetes ou aides
- gardes moins soupconneux
- surnoms / reconnaissance
- certains monstres faibles peuvent hesiter, reculer ou fuir face a une aura/reputation trop forte

### Variables minimales

Le state cible doit ajouter:

- reputation globale
- reputations par faction
- reputations par zone
- incidents actifs
- crimes enregistres
- primes actives
- niveau d alerte par zone
- rumeurs connues
- heroicActs majeurs

### Regles de persistance

- un crime majeur reste memoire plusieurs sessions de jeu tant qu il n est pas resolu,
- une prime ne disparait pas en changeant de chunk,
- une reputation positive ne doit pas se volatiliser apres un seul tour,
- les reactions sociales doivent evoluer graduellement, pas binaire et instantanees.

## 9.5 Recrutement, compagnons et monstres allies

Le moteur cible doit permettre de recruter des aides.

Cela inclut:

- PNJ recrutables
- mercenaires engages
- allie temporaire de quete
- creature apprivoisee
- monstre soumis, charme ou impressionne

### Regles de recrutement

Un recrutement ne doit jamais etre gratuit ni garanti.

Il depend de:

- type de cible
- relation actuelle
- personnalite
- reputation
- force / aura / charisme / volonte / magie selon le cas
- contexte narratif
- capacite `recruitable` ou `tamable`
- policy locale
- roll

Exemples:

- un villageois ne rejoint pas facilement une aventure suicidaire,
- un garde peut refuser pour raison de devoir,
- un mercenaire accepte si paiement et contexte sont bons,
- un monstre faible peut se soumettre si le joueur est terrifiant,
- une creature magique peut demander une resonance ou magie suffisante.

### Contrat follower

Un compagnon doit avoir:

- un `leaderId`
- un statut (`following`, `guarding`, `scouting`, `holding`, `fleeing`)
- une loyauté
- un moral
- des ordres simples
- des limites (peur, faim, dette, devoir, serment, cupidite)

### Effets en combat

Un compagnon doit pouvoir:

- suivre
- aider en combat
- proteger
- soigner
- tenir une position
- fuir si la situation ou sa loyauté se casse

### Monstres allies

Le systeme doit explicitement permettre:

- apprivoiser
- intimider pour soumettre
- charmer
- lier magiquement

Mais avec fortes contraintes:

- duree limitee ou cout d entretien
- risque de rupture
- policy / morale
- rejet explicite si la cible est non recrutable

## 10. Stats ciblees

Le bloc stats doit evoluer.

Stats a garder:

- PV
- vies
- or
- stress
- rang

Stats a faire apparaitre comme socle principal:

- `Force`
- `Vitesse`
- `Volonte`
- `Magie`
- `Aura`

Stats secondaires recommandees:

- `Defense`
- `Precision`
- `Esquive`
- `Perception`
- `Discretion`
- `Chance`
- `Initiative`
- `Charisme`
- `Endurance`
- `Resonance`

Interpretation cible:

- `Force`: degats physiques, destruction, port de charge, pression corporelle
- `Vitesse`: initiative, esquive, deplacement, execution
- `Volonte`: resistance mentale, pression sociale, maintien sous stress, opposition psychique
- `Magie`: puissance arcanique, controle des pouvoirs, interactions surnaturelles
- `Aura`: presence, intimidation, charisme, impression mystique ou heroique

Interpretation des secondaires:

- `Defense`: reduction passive et tenue au choc
- `Precision`: capacite a toucher ou executer proprement
- `Esquive`: capacite a eviter un coup ou une consequence
- `Perception`: detection, lecture du monde, details caches
- `Discretion`: infiltration, approche silencieuse
- `Chance`: variance favorable et opportunites rares
- `Initiative`: priorite dans les echanges rapides
- `Charisme`: influence sociale explicite
- `Endurance`: tenue sur la duree, fatigue, effort
- `Resonance`: affinite avec le surnaturel, objets et lieux mystiques

## 10.1 IA ennemie integree

Les ennemis ne doivent plus etre seulement des cibles passives.

Ils doivent pouvoir:

- detecter le joueur a vue ou a l ouie,
- engager si le joueur passe dans leur zone de menace,
- poursuivre sur une courte distance,
- abandonner si la cible disparait ou sort de leur logique,
- proteger une zone, une porte ou un PNJ,
- reagir a une attaque, un vol, une intimidation ou un bruit.

Comportements attendus:

- garde hostile si intrusion ou crime,
- monstre qui attaque si tu passes devant lui,
- demon qui priorise le joueur faible,
- animal qui fuit plutot qu attaquer,
- boss qui telegraphie ses grosses actions.

Le systeme doit gerer:

- cone de vision ou rayon de detection,
- ouie simple,
- niveau d alerte,
- cible memorisee pendant quelques tours,
- retour a la patrouille,
- aggro propre au chunk et aux transitions.

## 10.2 Mouvement PNJ realiste

Les PNJ doivent donner l impression d habiter le monde.

Regles cibles:

- chaque PNJ important a un `homeAnchor` et souvent un `workAnchor`,
- un marchand reste pres de sa boutique,
- un garde couvre une zone lisible,
- un enfant bouge sur un petit rayon credible,
- un forgeron reste majoritairement pres de sa forge,
- un aubergiste existe autour de l auberge,
- un PNJ ne tourne pas sur lui-meme sans raison,
- un PNJ evite de traverser un autre acteur si une alternative existe,
- un PNJ peut regarder temporairement une interaction proche,
- un PNJ revient a sa logique de base apres perturbation.

Modeles utiles:

- `fixed`
- `lane`
- `loop`
- `wander`
- `schedule`
- `reactive_guard`
- `shop_anchor`
- `home_to_work`

## 10.3 Animation et lisibilite des sprites

Le rendu doit devenir plus beau sans perdre la lecture.

Regles:

- mouvement orthogonal = animation 4 directions propre,
- pas de flip absurde ni de toupie,
- anticipation tres courte avant un depart,
- easing leger entre les cases,
- settle court a l arrivee,
- highlight de chemin discret mais lisible,
- aggro ennemi avec telegraph visuel,
- reponse d interaction avec petite animation de bulle,
- impact combat avec flash + recoil,
- mort avec fade/chute/dissipation,
- transition de chunk plus fluide mais breve.

Animations prioritaires:

- marche joueur
- marche PNJ
- idle vivant
- regard/focus cible
- aggro
- attaque
- degat subi
- mort
- interaction reussie
- interaction echouee
- apparition d evenement monde

Le combat actuel peut etre conserve comme base visuelle, mais doit ensuite lire ces vraies stats.

## 11. UI cible

### 11.1 Ecran principal

- haut: HUD plus riche et plus lisible
- centre: map active
- droite: `Narrateur MJ` + historique + details
- bas: plus de chat primaire permanent

Le bas de l ecran peut devenir:

- une zone de hints,
- un rappel des controles,
- une ligne d etat,
- ou un mini composeur contextuel quand une interaction est ouverte.

### 11.2 Popup d interaction

Le popup doit afficher:

- la cible selectionnee,
- son role ou son type,
- la distance,
- un mini resume (`Marchand`, `Arbre ancien`, `Sol sablonneux`, `Porte verrouillee`),
- un champ libre,
- des exemples d intention,
- un bouton `Infos`,
- une fermeture simple.

Le bouton `Infos` ouvre:

- nom
- role
- metier
- personnalite
- faction
- humeur actuelle
- relation au joueur
- courte note de lore

### 11.3 Feedback spatiaux

- survol = highlight discret
- cible selectionnee = outline/halo plus fort
- case visee = curseur clair
- chemin previsionnel = lecture visible
- trace de pas = memoire courte du trajet

## 12. Phases d implementation

### Phase 1 - Docs et contrats

- figer cette spec
- aligner `PROJECT_GUIDE`, `ENGINE_SPEC`, `USER_EXPERIENCE`, `CORE_BASELINE`

### Phase 2 - Registre d entites monde

- transformer batiments, props et edges en entites stables
- definir footprints, entrees, ancres, tags, capabilities

### Phase 3 - Navigation et collisions

- mouvement clavier remappable
- clic gauche deplacement
- deplacement strictement orthogonal
- preview de chemin avant clic
- pathfinding vers approach cells
- slide chunk clavier
- fleches de transition souris

### Phase 4 - Popup d interaction et bulles

- selection cible
- clic droit popup
- bulle intention joueur
- bulle reponse cible/monde
- journal narrateur synchronise

### Phase 5 - Resolver cible + anti-repeat

- `PlayerInteractionRequest`
- target context enrichi
- signature anti-boucle
- narration locale + persistante
- integration personnalite / role / humeur des PNJ

### Phase 6 - Migration stats/combat

- ajouter `force`, `vitesse`, `volonte`, `magie`, `aura`
- ajouter les stats secondaires utiles
- recalculer combat, social, magie, destruction, infiltration, perception

### Phase 6.1 - IA monde

- IA ennemie reactive
- mouvements PNJ credibles
- directeur d evenements tous les 3 a 10 tours joueur
- historique recent pour eviter la repetition

### Phase 6.2 - Systeme social persistant

- incidents et crimes traces
- temoins et rapports
- hostilite persistante par faction / zone
- reputation heroique et criminelle
- reactions village / milice / commerce / quetes
- peur ou respect de certains monstres selon reputation et aura

### Phase 6.3 - Recrutement et compagnons

- cibles `recruitable` / `tamable`
- follower slots
- loyauté / moral / obedience
- ordres simples des compagnons
- companions actifs en combat
- monstres allies sous contraintes

### Phase 7 - QA

- tests clavier
- tests souris
- tests collisions
- tests transitions
- tests preview de chemin
- tests interactions PNJ / objet / sol / edge
- tests anti-repeat
- tests narration + bulles
- tests aggro ennemi
- tests evenements aleatoires
- tests popup `Infos`
- tests crime persistant
- tests milice hostile apres meurtre civil
- tests reputation heroique
- tests peur de monstres faibles
- tests recrutement PNJ
- tests recrutement monstre
- tests rupture de loyauté / fuite

## 13. Definition of done

La refonte est reussie si:

1. un joueur peut se deplacer sans utiliser le champ texte global,
2. un clic droit sur un PNJ, un arbre, un batiment ou le sol ouvre une interaction claire,
3. les batiments importants sont traites comme des entites stables,
4. le deplacement est orthogonal, lisible et previsualise,
5. les collisions et transitions sont lisibles et fiables,
6. le moteur reste libre et contextuel,
7. la meme action ne peut pas etre exploitee en boucle,
8. les ennemis peuvent reagir et menacer le joueur de maniere credible,
9. les PNJ ont des roles, une personnalite et une presence lisible,
10. les crimes et actions heroiques changent durablement la reaction du monde,
11. on peut recruter des allies quand contexte, roll et policy le permettent,
12. le panneau `Narrateur MJ` raconte toujours l histoire sans etre l interface principale,
13. les bulles locales et le journal racontent la meme action a deux echelles differentes,
14. les evenements aleatoires rendent deux runs sensiblement differentes.
