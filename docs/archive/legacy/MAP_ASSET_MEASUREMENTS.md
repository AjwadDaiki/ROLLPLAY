# Mesures Asset-First (Map v17)

Ce document verrouille les dimensions reelles observees sur les tilesets avant placement map.

## Batiments `TilesetHouse.png`

- `house_a` source `0,0,64,64` -> bbox alpha `64x63` (quasi 4x4).
- `house_b` source `64,0,64,64` -> bbox alpha `64x60` (offset vertical haut).
- `house_c` source `128,0,64,64` -> bbox alpha `64x64` (4x4 complet, style deprecie).
- `house_d` source `192,0,64,64` -> bbox alpha `64x46` (visuel plus bas, gros padding transparent).

Decision de rendu:

- Les frames sont coupees/calees (`sy/sh` + `offsetY/heightScale`) pour respecter l alpha reel.
- Le rendu reste coherent visuellement, sans “double porte” due au padding transparent.
- Collision gameplay: footprint 4x3 pour les maisons (pas 4x4 plein), afin de garder des entrees propres.

## Ruines `TilesetVillageAbandoned.png`

Ancien mapping coupe des batiments (frames non alignees sur la grille).

Mapping v17:

- `ruin_a` -> `0,0,64,64` (ruine complete).
- `ruin_b` -> `128,0,64,64` (ruine complete secondaire).

## Terrain et routes

- Les variantes `road` sont limitees a la palette orange (suppression des derives visuelles blanches).
- Les biomes utilisent des variantes plus larges mais homogenes par palette (grass/forest/desert/village).

## Validation attendue

- Plus de demi-batiments issus de mauvais crops.
- Plus de portes/objets visuels empiles devant une entree de service.
- Village lisible: axes de circulation clairs, service pads distincts, marche lateral.
