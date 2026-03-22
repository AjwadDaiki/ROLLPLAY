# Oracle20 — Plan UX Complet

> Version 2 — 2026-03-18
> Ce document est le plan d implementation unique. Chaque section = un chantier implementable.

---

## Vision

Oracle20 est un RPG solo ou le monde vit, reagit, et evolue visiblement.

Le joueur doit ressentir 5 choses:

1. **Le monde est vivant** — les PNJ ont une volonte, les monstres rodent, des evenements arrivent sans que j intervienne.
2. **Je progresse** — je vois ma progression sur la map, dans mes stats, dans les reactions du monde.
3. **Je comprends tout** — chaque action, chaque consequence, chaque element d interface est lisible en 1 seconde.
4. **C est beau et fluide** — pas de saccade, pas de chevauchement, pas de confusion visuelle.
5. **Chaque partie est unique** — les evenements, les rencontres, les consequences creent une histoire differente a chaque fois.

---

## A. LAYOUT — Refonte Complete de l Interface

### Etat actuel

Layout 3 lignes: HUD top, map+sidebar center, input bottom.
Probleme: trop de texte partout, pas assez de hierarchie, le sidebar "Narrateur" mange l espace, la map est trop petite.

### Nouveau Layout

```
+---------------------------------------------------------------+
|  [PORTRAIT] Nom Nv.12  ♥♥♥♥♥ 47/60  ⚡12  💰234  [Rang: B]  |
|  [STR 8] [SPD 6] [WIL 10] [MAG 14] [AUR 7] [CMB 9]          |
+---------------------------------------------------------------+
|                                                                |
|                                                                |
|                    MAP CANVAS (70%)                             |
|                                                                |
|                                                                |
|  +----------------------------------------------------------+  |
|  | Objectif: Rejoindre la guilde   [?]                       |  |
|  +----------------------------------------------------------+  |
|  | [💬 Parler] [⚔ Attaquer] [🔍 Inspecter] [✏ Libre...]    |  |
|  | > Ecris ton action...                              [D20]  |  |
|  +----------------------------------------------------------+  |
|  | Journal ▾  (3 dernieres lignes, cliquable pour expand)    |  |
|  +----------------------------------------------------------+  |
+---------------------------------------------------------------+
```

### Changements precis

| Element | Avant | Apres |
|---------|-------|-------|
| Map | ~55% largeur, sidebar a droite | 100% largeur, plein ecran avec overlays |
| Sidebar "Narrateur" | Colonne fixe a droite | Supprimee — remplacee par journal compact en bas |
| HUD stats | Badges horizontaux simples | Barre compacte top avec icones, barres, valeurs |
| Input | Champ texte central large | Zone contextuelle en bas, sous la map |
| Objectif | Panneau dans sidebar | Bandeau fin sous la map, toujours visible |
| Journal/Log | Scroll dans sidebar | 3 lignes visibles en bas, expand on click |
| Inventaire | Tab dans sidebar | Accessible via touche I ou icone HUD |

### Pourquoi

La map EST le jeu. Tout le reste doit etre un overlay ou un panneau compact.
Le joueur doit voir le monde en premier, pas du texte.

### Spec technique

- CSS Grid: `grid-template-rows: auto 1fr auto`
- Map canvas: `width: 100%; aspect-ratio: 1`
- Journal overlay: `position: absolute; bottom: 0` dans la section map, max-height 40%, collapse par defaut
- Inventaire: modal overlay declenche par touche `I`
- HUD: `position: sticky; top: 0; z-index: 10`

---

## B. HUD — Barre de Statut Premium

### Design

Une seule ligne horizontale, compacte, lisible.

```
[👤 Portrait] Akira Nv.12  | ♥ 47/60 [====----] | ⚡ 12/100 | 💰 234 | ⚔ Rang B | [⚙]
```

### Elements

| Element | Rendu | Animation |
|---------|-------|-----------|
| Portrait | Sprite 32x32 du personnage | Idle bob subtil |
| Nom + Niveau | Texte bold, niveau en badge | Flash dore au level up |
| PV | Barre horizontale + chiffres | Couleur: vert > 50%, jaune > 25%, rouge < 25%. Tremblement quand < 15% |
| Stress | Barre fine sous PV | Gris = calme, orange = alerte, rouge = danger. Pulse quand > 80 |
| Or | Nombre avec icone piece | Bounce +X sur gain, flash rouge sur perte |
| Rang | Badge lettre (C/B/A/S) | Glow + scale up pendant 1s au changement |
| Stats | Chips compacts: STR SPD WIL MAG AUR CMB | Tooltip au hover avec description |
| Settings | Icone engrenage | Ouvre modal parametres |

### Barre de PV — Detail

```css
/* Couleur dynamique selon % */
--hp-color: hpPct > 50 ? #54be8d : hpPct > 25 ? #e8c040 : #e05040;
/* Tremblement critique */
animation: hpShake 0.15s infinite (si hpPct < 15%);
/* Transition fluide */
transition: width 0.4s ease-out;
```

### Barre de Stress — Detail

Le stress n est pas juste un chiffre. C est un indicateur d etat mental:
- 0-30: calme (gris-bleu)
- 31-60: alerte (orange)
- 61-80: panique (rouge)
- 81-100: rupture (rouge pulse + ecran tremble legerement)

Au dessus de 80, le personnage peut rater des actions, les PNJ le remarquent ("Tu as l air epuise...").

---

## C. MAP — Creer de la Vie

### C.1 Monde Vivant — PNJ a Volonte

Chaque PNJ (acteur non-hostile) doit avoir un **cycle de vie visible**:

| Comportement | Implementation | Effet visuel |
|-------------|---------------|--------------|
| Routine | PNJ marchand va de sa maison a sa boutique | Trajet visible, bulle "Allez, au travail!" |
| Repos | PNJ s arrete a un point et idle | Animation idle, bulle "..." ou bâillement |
| Reaction | PNJ reagit aux evenements proches | Se tourne vers l explosion, bulle "Qu est-ce que..." |
| Opinion | PNJ a une humeur qui change | Bulle contextuelle ("Belle journee!" vs "Encore toi...") |
| Memoire | PNJ se souvient des actions du joueur | Dialogue different si le joueur l a aide/vole/attaque |

**Spec technique:**

Ajouter a `WorldActor`:
```typescript
routine?: {
  waypoints: Array<{ x: number; y: number }>;  // Points de passage
  currentWaypoint: number;
  pauseTicksAtWaypoint: number;  // Combien de ticks rester
  pauseRemaining: number;
  activeHours?: [number, number];  // Heures actives (si day/night)
};
mood?: "happy" | "neutral" | "annoyed" | "afraid" | "angry";
memory?: Array<{
  type: "helped" | "stolen" | "attacked" | "talked";
  turnsAgo: number;
}>;
```

Dans `worldTick.ts`, ajouter `advanceActorRoutines()`:
- Chaque PNJ avec routine avance vers son prochain waypoint
- En arrivant, il s arrete `pauseTicksAtWaypoint` tours
- Puis passe au suivant (boucle)
- Emmet une bulle aleatoire pertinente a son role

### C.2 Monstres a Volonte

Les monstres ne doivent pas etre des sacs de PV statiques. Ils ont un comportement:

| Type | Volonte | Comportement |
|------|---------|-------------|
| Bete sauvage | Faim | Erre, attaque si le joueur est faible ou proche |
| Monstre territorial | Protection | Reste dans sa zone, attaque si on entre, ne poursuit pas au dela |
| Monstre predateur | Chasse | Traque activement le joueur, se cache, tend des embuscades |
| Boss | Domination | Invoque des sbires, change de phase, dialogue menacant |
| Monstre peureux | Survie | Fuit si le joueur est fort, attaque seulement si coinced |

**Spec technique:**

Ajouter a `WorldActor`:
```typescript
volition?: "hungry" | "territorial" | "predator" | "dominator" | "coward";
homePosition?: { x: number; y: number };  // Centre du territoire
territoryRadius?: number;  // Rayon de protection
lastKnownPlayerPos?: { x: number; y: number } | null;  // Pour la traque
```

Dans `handleHostileAi()`, utiliser `volition` pour moduler:
- `territorial`: n attaque que si `distance(player, homePosition) < territoryRadius`
- `predator`: met a jour `lastKnownPlayerPos`, approche meme hors aggro
- `coward`: fuit si `playerPower > actorPower * 1.5`
- `dominator` (boss): spawn sbires tous les X tours si PV < 50%

### C.3 Evenements de Map Spontanes

Les 5 evenements actuels sont bons mais pas assez frequents et pas assez visuels.

**Nouveaux evenements a ajouter:**

| Evenement | Declencheur | Effet visuel | Effet gameplay |
|-----------|-------------|--------------|----------------|
| Caravane marchande | Tous les ~15 tours | PNJ marchand ambulant traverse la map | Shop temporaire, prix uniques |
| Tempete de sable | Aleatoire en desert | Overlay particles, visibilite reduite | Malus precision, bonus stealth |
| Feu de foret | Aleatoire en foret | Tiles changent en feu, propagation | Degats zone, fuite PNJ |
| Apparition fantome | Nuit en donjon | Entite transparente apparait | Dialogue cryptique, loot mystere |
| Festival du village | Tous les ~30 tours | PNJ rassembles, decorations | Bonus reputation, prix reduits |
| Tremblement de terre | Rare | Ecran shake, tiles fissurees | Nouveaux passages ouverts |
| Eclipse | Tres rare | Assombrissement progressif | Monstres boost, magic boost |
| Messager royal | Apres certains kills | PNJ coureur arrive | Nouvelle quete, info lore |

**Spec: comment rendre les evenements visibles**

Chaque evenement doit avoir 3 phases:
1. **Annonce** (0.5s): son visuel (flash, shake, overlay), bulle systeme
2. **Deploiement** (2-5s): apparition des entites/effets, narration
3. **Persistance**: effet reste visible (tiles modifiees, PNJ present) jusqu a resolution

Ajouter un `EventOverlay` component:
```typescript
type ActiveMapEvent = {
  id: string;
  type: string;
  position: { x: number; y: number };
  startedAt: number;
  durationTurns: number;
  turnsRemaining: number;
  visualEffect: "particles" | "tint" | "shake" | "glow" | null;
  tiles?: Array<{ x: number; y: number; newTerrain: string }>;
};
```

### C.4 Progression Visible sur la Map

Le joueur doit VOIR sa progression:

| Marqueur | Quand | Visuel |
|----------|-------|--------|
| Breadcrumbs | A chaque pas | Cases visitees legerement desaturees, fade sur 20 cases |
| Territoire explore | Chunk visite | Mini bordure doree sur la minimap |
| Zone conquise | Boss/monstre zone tue | Couleur des tiles change (plus vive, plus sure) |
| POI debloque | Premiere visite | Label apparait, reste visible ensuite |
| Cicatrice de combat | Apres un gros combat | Tiles marquees (terre brulee, sang, fissures) pendant N tours |
| Tombe | PNJ/monstre important meurt | Petite croix/pierre a l endroit de la mort |

**Spec technique breadcrumbs:**

```typescript
// Dans le state du chunk
visitedTiles: Map<string, number>;  // "x_y" -> turnVisited
```

Au rendu canvas: si `visitedTiles.has(tileKey)`:
- `ctx.globalAlpha = 0.15`
- `ctx.fillStyle = "rgba(200, 180, 140, 0.3)"`
- Dessiner par dessus la tile
- Alpha diminue avec l age: `0.3 * Math.max(0, 1 - (turnNow - turnVisited) / 30)`

### C.5 Labels POI et Lisibilite

Chaque POI (boutique, guilde, auberge, donjon, citadelle) doit avoir:

- **Label flottant permanent**: texte pixel-art au dessus du batiment
- **Icone de role**: petit symbole (piece, epee, lit, crane, couronne)
- **Halo a portee**: quand le joueur est a 2 cases, lueur douce autour du POI
- **Etat visible**: boutique fermee = label grise, guilde active = label lumineux

**Spec canvas:**
```typescript
function drawPoiLabel(ctx, poiName, icon, x, y, playerDist) {
  const alpha = playerDist <= 2 ? 1 : playerDist <= 5 ? 0.7 : 0.4;
  ctx.globalAlpha = alpha;
  // Background pill
  ctx.fillStyle = "rgba(10, 14, 24, 0.85)";
  roundRect(ctx, x - textWidth/2 - 6, y - 18, textWidth + 12, 16, 4);
  // Icon + text
  ctx.fillStyle = "#ffe4ad";
  ctx.font = "bold 9px sans-serif";
  ctx.fillText(`${icon} ${poiName}`, x - textWidth/2, y - 7);
  ctx.globalAlpha = 1;
}
```

---

## D. BULLES DE DIALOGUE — Zero Chevauchement

### Probleme actuel

Les bulles se chevauchent quand plusieurs PNJ parlent en meme temps.
Le systeme de collision (occupiedBubbleRects) est basique.

### Nouveau systeme

**Regle 1: Maximum 4 bulles visibles en meme temps**

Si plus de 4 bulles actives, les plus anciennes disparaissent immediatement.

**Regle 2: Placement avec priorite**

```
Priorite 1: Au dessus de l entite, centre
Priorite 2: Decale a droite si collision
Priorite 3: Decale a gauche si collision
Priorite 4: En dessous de l entite si tout est pris
```

**Regle 3: File d attente**

Si une entite a plusieurs bulles en attente, elles s affichent sequentiellement (pas en meme temps).

**Regle 4: Taille adaptative**

- Texte court (< 30 chars): bulle compacte, 1 ligne
- Texte moyen (30-60 chars): bulle standard, 2 lignes max
- Texte long (> 60 chars): tronque a 60 chars + "..."

**Regle 5: Z-order**

- Bulle du joueur: toujours au dessus
- Bulle de la cible actuelle: en second
- Autres: par proximite avec le joueur

**Spec technique:**

```typescript
const MAX_VISIBLE_BUBBLES = 4;
const BUBBLE_MARGIN = 8;  // Minimum pixels entre deux bulles

function layoutBubbles(bubbles: ActiveBubble[], playerRef: string): LayoutResult[] {
  // Trier par priorite: joueur > cible > distance
  const sorted = sortByPriority(bubbles, playerRef);
  // Garder seulement les MAX_VISIBLE_BUBBLES premieres
  const visible = sorted.slice(0, MAX_VISIBLE_BUBBLES);
  // Placer avec collision avoidance
  const placed: Rect[] = [];
  return visible.map(bubble => {
    const pos = findBestPosition(bubble, placed, BUBBLE_MARGIN);
    placed.push(pos.rect);
    return { bubble, ...pos };
  });
}
```

### Styles par type

| Type | Bordure | Fond | Texte | Usage |
|------|---------|------|-------|-------|
| speech | #4a7ab5 | rgba(10,20,40,0.92) | #e8f0ff | Dialogue PNJ |
| thought | #6a8ab0 dashed | rgba(15,25,45,0.85) | #a0c8e8 italic | Pensee interne |
| action | #b08840 | rgba(30,20,10,0.92) | #ffe4b0 | Action effectuee |
| system | #7050a0 | rgba(20,15,35,0.92) | #c8b0e8 | Info systeme |
| shout | #d04040 | rgba(40,10,10,0.92) | #ffb0b0 bold | Cri, alarme |

Ajouter le type `shout` pour les alertes (gardes, boss, raid).

---

## E. COMBAT — Interface Pokemon Finalisee

### Etat actuel (deja implemente)

- BattleFx type avec tier, difficulty, stats, narration
- Roue de combat avec poids stats+RNG
- drawBattleScene avec sprites Pokemon-style
- CSS avec animations tier, difficulty badges

### Ameliorations restantes

| Point | Detail |
|-------|--------|
| Animation d attaque | Flash blanc sur le sprite touche pendant 0.1s |
| Barre XP | Ajouter sous la HP bar: progression vers le prochain niveau |
| Multi-hit | Si critical/legendary, afficher 2-3 flash rapides au lieu d un seul |
| Fuite | Si le joueur fuit, animation de slide-out rapide |
| Capture/Recrutement | Roue de combat adaptee pour le recrutement (vert au lieu de rouge) |
| Dialogue combat | Bulle de dialogue du monstre pendant le combat ("Je vais t ecraser!") |

### Combat Flow Complet

```
1. Transition: fondu noir 0.3s
2. Apparition: sprites slide in depuis les cotes (0.5s)
3. HP bars apparaissent (fade 0.3s)
4. Commande: chips s illuminent (0.2s)
5. Roue: spin (2.15s avec easing)
6. Impact: flash + shake + damage numbers (0.4s)
7. Result: texte tier + narration (0.8s)
8. Transition out: fondu retour a la map (0.3s)
```

Total: ~4.5s pour un combat complet. Assez pour etre theatral, assez court pour pas ennuyer.

---

## F. SYSTEME DE CONSEQUENCES — 3 Niveaux

### Niveau 1: Consequences Mineures (inline)

Exemples: petit gain d or, soin leger, item commun, stress +5.

**Traitement:** popup flottante 1.5s au dessus du joueur, pas de pause du jeu.

```
+12 💰   ou   +5 PV   ou   🗡 Epee rouillée
```

Style: texte qui monte et fade, couleur selon le type (or=dore, PV=vert, item=blanc, stress=orange).

### Niveau 2: Consequences Moyennes (carte)

Exemples: quete terminee, objet rare, monstre vaincu, lieu debloque, rang up.

**Traitement:** carte centre ecran pendant 2s, jeu en pause, fond assombri.

```
+------------------------------------+
|  ⚔ QUETE TERMINEE                 |
|  Exploration du donjon             |
|                                    |
|  Recompense: 150 💰 + Amulette    |
|            [Continuer]             |
+------------------------------------+
```

Style: bordure doree, fond sombre, animation slide-up + fade-in.

### Niveau 3: Consequences Majeures (overlay dramatique)

Exemples: tete mise a prix, mort PNJ important, boss revele, fin de chapitre, mort du joueur.

**Traitement:** overlay plein ecran, animation lente, couleur dominante, bouton de reprise.

```
+================================================+
|                                                |
|          TA TETE EST MISE A PRIX               |
|                                                |
|    Le village entier te cherche.               |
|    Des chasseurs de primes sont en route.      |
|                                                |
|    [Reputation: -40]  [Danger: EXTREME]        |
|                                                |
|              [Affronter le destin]              |
+================================================+
```

Style par type:
- Mise a prix: rouge/noir
- Mort PNJ: gris/bleu sombre
- Boss revele: violet/noir
- Rang up: or/blanc
- Mort joueur: rouge sombre/noir
- Victoire: or eclatant

---

## G. JOURNAL COMPACT — Remplacer la Sidebar

### Concept

Le journal n est plus une colonne permanente. C est un panneau retractable en bas de la map.

### Etat par defaut

3 dernières lignes visibles, texte petit, fond semi-transparent:

```
[MJ] Tu entres dans la foret sombre...
[PNJ] Marchand: "Bonne chance, aventurier."
[COMBAT] Tu inflige 12 degats au Gobelin.
```

### Etat deploye (clic ou touche J)

Panneau qui monte depuis le bas, max 40% de la map, scrollable:

```
+--------------------------------------------+
|  📜 Journal                          [X]   |
|  ----------------------------------------  |
|  [MJ] Tu entres dans la foret sombre...    |
|  [PNJ] Marchand: "Bonne chance."           |
|  [COMBAT] Tu inflige 12 degats au Gobelin. |
|  [EVENT] Un tremblement secoue la terre!   |
|  [SYSTEM] Quete "Donjon" mise a jour.      |
|  [MJ] Le gobelin s ecroule.                |
|  ...                                        |
+--------------------------------------------+
```

### Categories visuelles

| Tag | Couleur | Icone |
|-----|---------|-------|
| MJ | #ffe4ad (or) | 📜 |
| PNJ | #a0c8ff (bleu) | 💬 |
| COMBAT | #ff8080 (rouge) | ⚔ |
| EVENT | #c080ff (violet) | ⚡ |
| SYSTEM | #80c8a0 (vert) | ⚙ |
| LOOT | #ffd060 (jaune) | 🎁 |

---

## H. INPUT — Zone d Action Contextuelle

### Concept

L input n est plus un chat. C est un composeur d action lie au contexte.

### Layout

```
+------------------------------------------------------------+
| Objectif: Rejoindre la guilde pour prendre une quete  [?]  |
+------------------------------------------------------------+
| [💬 Parler] [⚔ Attaquer] [🛡 Defendre] [🏃 Fuir] [✏ ...]|
+------------------------------------------------------------+
| > Ecris ton action...                              [D20 🎲]|
+------------------------------------------------------------+
```

### Comportement des chips

Les chips changent selon le contexte:

| Contexte | Chips affichees |
|----------|----------------|
| Pres d un PNJ | Parler, Recruter, Voler, Attaquer, Inspecter |
| Pres d une boutique | Acheter, Vendre, Negocier, Voler |
| Pres d un ennemi | Attaquer, Fuir, Inspecter, Parler |
| En foret | Explorer, Se cacher, Couper du bois, Se reposer |
| En donjon | Avancer, Inspecter, Se cacher, Magie |
| Aucun contexte | Se deplacer, Explorer, Se reposer, Inspecter |

Cliquer sur un chip = remplit le champ texte avec l action correspondante.
Le joueur peut toujours ecrire librement.

### Placeholder dynamique

```
"Que fais-tu ?" (defaut)
"Que dis-tu au marchand ?" (pres du marchand)
"Comment attaques-tu le gobelin ?" (pres d un ennemi)
"Ou vas-tu ?" (terrain ouvert)
```

### Feedback d interpretation

Apres soumission, avant resolution, afficher brievement:

```
Intention: attaquer le gobelin avec l epee
Cible: Gobelin (Nv.3, 15 PV)
```

Cela rassure le joueur que le jeu a compris.

---

## I. INTERACTION POPUP — Refonte

### Etat actuel

Popup modale avec presets, info toggle, shop grid. Fonctionne mais pas assez fluide.

### Nouvelle version

La popup doit etre un **panneau contextuel qui apparait a cote de la cible**, pas au centre de l ecran.

```
     [Gobelin Nv.3]
    ┌──────────────────┐
    │  ♥ 15/15  ⚔ POW 8│
    │                    │
    │  [Attaquer]        │
    │  [Parler]          │
    │  [Inspecter]       │
    │  [Recruter]        │
    │                    │
    │  > Action libre... │
    └──────────────────┘
```

### Regles

- Position: a droite de la cible si possible, sinon a gauche
- Pas de recouvrement du joueur
- Max 6 presets affichees
- Champ texte libre toujours disponible
- Info panel (stats, lore) accessible via icone [i]
- Pour les shops: grille d items inline, pas de modal separee
- Fermeture: Echap, clic dehors, ou action soumise

### Shop inline

```
    ┌──────────────────────┐
    │  🏪 Boutique          │
    │  Reduction: -10%      │
    │                       │
    │  Potion (30💰)  [+]  │
    │  Epee   (80💰)  [+]  │
    │  Bouclier (60💰) [+] │
    │                       │
    │  [Negocier] [Voler]   │
    │  > Action libre...    │
    └──────────────────────┘
```

---

## J. MINIMAP — Orientation Globale

### Concept

Petit widget 80x80px en haut a droite de la map canvas.

### Contenu

- Grille representant les chunks visites (colores par biome)
- Point joueur (clignotant)
- Points POI (icones minuscules)
- Chunk actuel surligne
- Chunks non visites = gris

### Spec

```typescript
type MinimapData = {
  chunks: Map<string, { biome: string; visited: boolean; hasPoi: string[] }>;
  playerChunk: { cx: number; cy: number };
};
```

Rendu: petit canvas separe 80x80, overlay en haut a droite, `opacity: 0.85`.
Chaque chunk = carre 8x8px, couleur selon biome.

---

## K. NOTIFICATIONS — Systeme de Toast

Pour les infos qui ne meritent pas une bulle de dialogue mais doivent etre vues:

```
┌─────────────────────────────┐
│ ⚔ Le gobelin est mort!      │  ← toast 2s, slide from right
│ +25 💰  +15 XP              │
└─────────────────────────────┘
```

### Types de toast

| Type | Couleur | Duree | Exemple |
|------|---------|-------|---------|
| info | bleu | 2s | "Nouveau chunk decouvert" |
| gain | vert | 2s | "+25 or, +15 XP" |
| loss | rouge | 2.5s | "-10 PV, stress +15" |
| event | violet | 3s | "Un tremblement secoue la terre!" |
| achievement | or | 4s | "Rang B atteint!" |

### Placement

Stack en haut a droite, max 3 visibles, les anciennes sortent vers le haut.

---

## L. PROGRESSION VISIBLE — Systeme d XP et Niveaux

### Concept

Le joueur doit voir sa progression de facon tangible.

### Barre d XP

```
Nv.12 [================----] 78% → Nv.13
```

- Visible dans le HUD, sous le nom
- XP gagne: combat, quetes, exploration, social
- Level up: flash dore + toast "Niveau 13!" + stats augmentent

### Gains d XP

| Source | XP |
|--------|-----|
| Tuer un monstre normal | 10-25 |
| Tuer un boss | 100-200 |
| Terminer une quete | 50-150 |
| Decouvrir un nouveau chunk | 15 |
| Premier commerce reussi | 10 |
| Recruter un allie | 20 |
| Evenement monde resolu | 30-80 |

### Stats au level up

A chaque niveau, le joueur gagne:
- +5 PV max
- +1 a une stat aleatoire (ou choix du joueur)
- Deblocage de capacites a certains paliers

---

## M. ATMOSPHERE — Particules et Ambiance

### Particules par biome

| Biome | Particules | Couleur | Vitesse |
|-------|-----------|---------|---------|
| Foret | Feuilles qui tombent | vert/marron | lent |
| Desert | Grains de sable | beige | moyen, horizontal |
| Donjon | Poussieres, lucioles | gris/jaune pale | tres lent |
| Village | Fumee des cheminees | gris clair | lent, monte |
| Boss | Braises, cendres | rouge/orange | moyen |
| Eau/Lac | Reflets, gouttes | bleu clair | lent |

### Spec technique

```typescript
type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
  alpha: number;
};

const MAX_PARTICLES = 40;  // Leger, pas de lag
```

Rendu: dans le draw loop principal, apres les tiles, avant les entites.
Reset au changement de chunk.

### Effets d atmosphere

- **Vignette**: bords de la map legerement assombris (toujours, subtil)
- **Tint biome**: overlay couleur tres leger selon le biome (vert foret, jaune desert)
- **Transition chunk**: fondu de 0.3s entre les tints au changement

---

## N. INVENTAIRE — Modal Dedié

### Acces

Touche `I` ou icone dans le HUD.

### Layout

```
+--------------------------------------------+
|  🎒 Inventaire                       [X]   |
+--------------------------------------------+
|  Equipe:                                    |
|  [🗡 Epee de fer]  [🛡 Bouclier bois]      |
|                                              |
|  Sac (12/20):                               |
|  [Potion x3] [Pierre x5] [Cle donjon x1]  |
|  [Bois x8] [Amulette x1] [...]             |
|                                              |
|  > Clic pour equiper/utiliser/jeter         |
+--------------------------------------------+
```

### Actions sur item

Clic sur un item: mini-menu [Equiper] [Utiliser] [Jeter] [Inspecter]

---

## O. COMPAGNONS — Panneau de Gestion

### Acces

Touche `C` ou icone dans le HUD (visible seulement si >= 1 compagnon).

### Layout

```
+--------------------------------------------+
|  👥 Compagnons (2/4)                 [X]   |
+--------------------------------------------+
|  [🐺 Loup gris]  Nv.5  ♥ 20/20           |
|  Ordre: Suivre  [Suivre|Garder|Attaquer]   |
|                                              |
|  [⚔ Garde du chemin]  Nv.8  ♥ 35/40       |
|  Ordre: Garder  [Suivre|Garder|Attaquer]    |
+--------------------------------------------+
```

---

## P. ONBOARDING — Premiers 5 Tours

Le jeu doit guider sans etre intrusif.

### Tour 1

Toast: "Bienvenue dans Oracle20! Clique sur la map pour te deplacer."
Highlight: cases autour du joueur.

### Tour 2

Toast: "Clic droit sur un PNJ pour interagir avec lui."
Highlight: PNJ le plus proche.

### Tour 3

Toast: "Ecris n importe quelle action dans le champ texte. Tout est possible!"
Highlight: champ input.

### Tour 4

Toast: "Visite la guilde pour prendre une quete."
Fleche: vers le POI guilde.

### Tour 5

Toast: "Consulte ton objectif en bas de la map pour savoir quoi faire."
Fin de l onboarding.

Stocke `onboardingStep` dans le state. Ne se re-declenche jamais.

---

## Q. ACCESSIBILITE

| Point | Implementation |
|-------|---------------|
| Contraste texte | Minimum 4.5:1 ratio sur tous les textes |
| Taille boutons | Min 36x36px touch target |
| Focus clavier | Outline visible sur tous les elements interactifs |
| Info non-couleur | Toute info importante aussi en texte/icone, pas que couleur |
| Animations | Respect `prefers-reduced-motion` pour desactiver les particules et shakes |
| Mobile | Layout responsive, touch targets larges, pas de hover-only |

---

## ROADMAP D IMPLEMENTATION

### Phase 1 — Layout et HUD (priorite absolue)

1. Refondre le layout: supprimer sidebar, map plein ecran
2. Nouveau HUD compact en une ligne
3. Journal retractable en bas
4. Input contextuel avec chips

### Phase 2 — Map vivante

5. Breadcrumbs (cases visitees)
6. Labels POI permanents
7. Routines PNJ (waypoints, pauses, bulles)
8. Monstres a volonte (territorial, predator, coward)
9. Particules d ambiance par biome

### Phase 3 — Bulles et feedback

10. Refonte systeme de bulles (max 4, collision, z-order, file d attente)
11. Systeme de toasts (notifications)
12. Consequences 3 niveaux (inline, carte, overlay)
13. Combat: animations d attaque, multi-hit, barre XP

### Phase 4 — Progression et profondeur

14. Systeme XP et level up
15. Nouveaux evenements de map (caravane, tempete, festival, etc.)
16. Minimap
17. Inventaire modal
18. Compagnons modal

### Phase 5 — Finition

19. Onboarding 5 tours
20. Interaction popup repositionnee (a cote de la cible)
21. Transitions de chunk plus theatrales
22. Accessibilite et mobile
23. Polish: vignette, tints biome, animations de gain/perte

---

## DEFINITION OF DONE

Le plan est reussi quand:

- [ ] Un nouveau joueur comprend quoi faire en < 30 secondes
- [ ] La map montre la vie (PNJ bougent, particules, evenements)
- [ ] Aucune bulle ne chevauche une autre
- [ ] Le joueur voit sa progression (XP, breadcrumbs, zones conquises)
- [ ] Chaque action a une lecture en 3 temps: intention → execution → consequence
- [ ] Les evenements majeurs sont impossibles a rater
- [ ] L interface est belle, coherente, fluide
- [ ] Le jeu fonctionne sur mobile sans perte de lisibilite
- [ ] 0 erreur TypeScript

---

## DECISION PRODUIT

Si arbitrage necessaire, prioriser dans cet ordre:

1. **Comprehension** — le joueur comprend-il ce qui se passe?
2. **Fluidite** — est-ce que ca coule naturellement?
3. **Vie** — le monde semble-t-il vivant?
4. **Beaute** — est-ce agreable a regarder?
5. **Profondeur** — est-ce que ca ajoute du gameplay?

Un monde simple mais vivant vaut mieux qu un monde complexe mais mort.
