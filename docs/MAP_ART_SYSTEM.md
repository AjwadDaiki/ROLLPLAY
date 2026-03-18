## Systeme art map

Ce document fixe la grammaire visuelle de la map solo et la facon dont le moteur s auto-controle.

### Objectif

Ne plus composer la carte par intuition de coordonnées.
Chaque biome, prop, decor et structure doit venir d un profil canonique partage par:

- le runtime
- les previews HTML/SVG
- l audit automatique

### Bibliotheque canonique

Village:
- sol principal: sable chaud du set `TilesetField`
- route: terre battue orange du set `TilesetField`
- facades approuvees: `house_a`, `house_b`, `house_d`
- facade depreciee: `house_c`

Foret / plaine:
- base: verts `TilesetField`
- vegetation: arbres riches `TilesetNature`
- details: touffes d herbe `TilesetFloorDetail`

Mesa / desert:
- base: sable rose `TilesetField`
- landmarks: `ruin_a`, `ruin_b`, `palm_cluster`
- petit prop desertique: palmier/shrub du set `TilesetDesert`
- ancien faux cactus supprime: il pointait vers un morceau de tour

Donjon / citadelle:
- base donjon: dalles grises `TilesetInteriorFloor`
- base boss: variante plus sombre `TilesetInteriorFloor`
- details: debris `TilesetDungeon`
- gate: `dungeon_gate` / `boss_gate`

### Structures explicites

Les maisons et grands batiments ne sont plus juste des sprites.
Le registre `getMapStructures()` decrit chaque structure avec:

- `id`
- `category`
- `biome`
- `decorKind`
- `bounds`
- `anchor`
- `service tile`
- `poi`
- `artProfileId`

Ca permet de relier plus tard navigation, interaction, labels, quetes et IA a une meme entite stable.

### Profils depreciés

`house_c` est explicitement marque `deprecated`.

Raison:
- silhouette ambiguë
- effet porte devant porte
- lecture frontale confuse pour une boutique ou une maison

L audit map doit remonter une erreur haute severite si ce profil reapparait.

### Auto audit

L audit map verifie maintenant:

- prop non approuve pour son biome
- decor sur biome interdit
- decor utilisant un profil deprecie
- structure hors limites
- structure sans label alors qu elle en affiche un
- case de service bloquee
- case de service avec mauvais POI

### Boucle de travail

1. choisir un biome ou une structure
2. utiliser uniquement un profil canonique
3. regenerer `WORLD_AUDIT_ASSETS.html` et `WORLD_PNJ_MAP_ASSETS.html`
4. lancer `npm run qa:world`
5. corriger jusqu a `0` high / `0` medium

### Priorite suivante

Les prochaines grosses ameliorations rentables sont:

- routes avec vraies transitions de bordure
- composition desert `mesa` plus verticale avec relief
- donjon/citadelle avec plus de landmarks massifs
- structure registry et suggestions gameplay basees sur `getMapStructures()`
