# Systèmes et Variables - Référence rapide

## 1. État principal du jeu
Le state central est `SoloGameState` (voir `lib/solo/types.ts`).

Blocs majeurs:
- `player`: stats, position, inventaire, équipement, objectif, réputation perso.
- `tiles`: map monde (terrain, blocage, props, POI).
- `actors`: PNJ, animaux, monstres, boss.
- `entityStates`: ownership, inventaires entités, équipements, politiques d’accès.
- `quests`: progression des objectifs.
- `log`: historique narratif court.
- `factionReputations` / `zoneReputations`: relations sociales.
- `incidents` / `bounties`: mémoire sociale et justice.
- `followers`: compagnons recrutés.
- `worldClock`: moment de la journée + météo.
- `shopState`: stock et multiplicateurs d’économie.
- `combatState`: contexte combat actif.
- `mapEditorDraft`: surcharge map issue de l’éditeur.

## 2. Systèmes gameplay

## Déplacement / Monde
- Position joueur: `player.x`, `player.y`.
- Cohérence map: `enforceWorldCoherence(...)` dans `lib/solo/world.ts`.
- Lecture des tuiles: `getTile`, `idxOf`, `inBounds`.

## Interaction
- Entrée structurée: `PlayerInteractionRequest`.
- Cibles: `targetRef`, `primaryTargetRef`, `targetTile`.
- Intention libre: `actionText`, `freeText`.

## Combat
- État combat: `combatState`.
- Résolution dépend de stats + roll + contexte.
- Résultat post-combat doit alimenter log + delta monde.

## Social / Réputation
- Factions: `factionReputations`.
- Zones: `zoneReputations`.
- Incidents persistants: `incidents`.

## Économie
- Inventaire boutique: `shopState.stock`.
- Multiplicateurs de demande: `shopState.demandMultiplier`.
- Réduction joueur possible via `player.shopDiscountPercent`.

## Persistance
- Sauvegarde client (local) + session serveur.
- State hydraté via `hydrateSoloState(...)` (`lib/solo/runtime.ts`).

## 3. Pipeline central (résumé)
1. Commande joueur.
2. Interprétation.
3. Validation (distance, règles, accès, etc.).
4. Résolution.
5. Application sur le state.
6. Rendu et feedback.
7. Persistance.

## 4. Contrats de qualité
- Pas d’action muette.
- Toute action significative doit modifier au moins un bloc observable.
- Toute conséquence importante doit survivre au reload.

## 5. Fichiers clés (où regarder)
- Types: `lib/solo/types.ts`
- Monde: `lib/solo/world.ts`
- Runtime/hydratation: `lib/solo/runtime.ts`
- Logique action: `lib/solo/logic.ts`
- Noyau exécution: `lib/solo/kernel.ts`
- Routes API: `app/api/solo/start/route.ts`, `app/api/solo/action/route.ts`
- Client jeu: `app/game/GameClient.tsx`
- Éditeur map: `app/map-editor/page.tsx`, `lib/solo/mapEditor.ts`
