# Map Redesign V2 (Zone-First)

## 1) Structure avant sprites

La map est maintenant construite dans cet ordre:

1. Macro-zones biomes (3x3 chunks).
2. Coutures biome verticales/horizontales.
3. Flux de circulation globaux (`paintWorldRoutes`).
4. Districts village (`applyVillageGrounding`).
5. POI et access points.
6. Props et decors par biome.
7. Collisions decors, puis re-ouverture des couloirs canoniques (`unblockPrimaryRoutes`).

## 2) Logique monde

- Village nord: services (guilde, auberge, boutique).
- Village centre: place active (croisement principal).
- Village sud: residentiel (maisons SW/SE).
- Axe monde: route ouest-est + epine dorsale nord-sud.
- Donjon/Boss: route de descente dediee jusqu'aux portes.

## 3) Vie et role PNJ

- PNJ village ancrés sur zones fonctionnelles (service, place, residentiel).
- Ajout d'un eclaireur (hauteurs) et d'un caravanier (dunes) pour activer les biomes hors village.
- Anchors valides auditées (pas sur tuiles bloquees).

## 4) Règles de placement

- Aucun prop sur route/POI.
- Pas de decor solide sans re-ouverture de circulation.
- Pas de porte en doublon par accent.
- Service tiles forcees accessibles apres collisions.

## 5) Validation

- `npm run qa:world` doit rester HIGH/MEDIUM/LOW = 0.
- `npm run map:pnj` regenere les audits visuels de validation.
