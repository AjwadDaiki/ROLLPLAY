import { resolveCharacter } from "./characters";
import type { InventoryItem, PoiType, SoloGameState, TerrainType, Tile, TileProp, WorldActor } from "./types";
import { CHUNK_SIZE, WORLD_HEIGHT, WORLD_WIDTH, WORLD_SCREENS_X, WORLD_SCREENS_Y } from "./types";

const CHARACTER_BASE =
  "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters";
const ANIMAL_BASE = "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Animals";
const MONSTER_BASE = "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Monsters";

const ICON_BASE =
  "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Ui/Skill Icon/Job & Action";

export type SceneDecorKind =
  | "house_a"
  | "house_b"
  | "house_c"
  | "fence_h"
  | "fence_v"
  | "ruin_a"
  | "ruin_b"
  | "palm_cluster"
  | "well"
  | "guild_flag"
  | "shop_stall"
  | "inn_sign"
  | "dungeon_gate"
  | "boss_gate";

export type SceneDecor = {
  id: string;
  screenX: number;
  screenY: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: SceneDecorKind;
};

export const WORLD_LAYOUT_VERSION = "solo_map_v10";

type CanonicalPoi = Exclude<PoiType, null>;
type PoiPlacement = { poi: CanonicalPoi; x: number; y: number; anchorX: number; anchorY: number };

const CANONICAL_POI_PLACEMENTS: PoiPlacement[] = [
  { poi: "camp", x: 24, y: 26, anchorX: 24, anchorY: 25.7 },
  { poi: "guild", x: 18, y: 23, anchorX: 18.2, anchorY: 22.2 },
  { poi: "inn", x: 24, y: 23, anchorX: 24.2, anchorY: 22.2 },
  { poi: "shop", x: 27, y: 23, anchorX: 27.2, anchorY: 22.2 },
  { poi: "house", x: 18, y: 22, anchorX: 24.2, anchorY: 17.2 },
  { poi: "house", x: 24, y: 22, anchorX: 24.2, anchorY: 17.2 },
  { poi: "house", x: 30, y: 22, anchorX: 24.2, anchorY: 17.2 },
  { poi: "dungeon_gate", x: 24, y: 40, anchorX: 24, anchorY: 39.25 },
  { poi: "boss_gate", x: 40, y: 40, anchorX: 40, anchorY: 39.25 },
];

const PROTECTED_PATH_TILES: Array<{ x: number; y: number }> = [
  { x: 18, y: 23 },
  { x: 24, y: 23 },
  { x: 27, y: 23 },
  { x: 24, y: 26 },
];

const DECORS: SceneDecor[] = [
  { id: "v_house_a", screenX: 1, screenY: 1, x: 17, y: 17, w: 4, h: 4, kind: "house_a" },
  { id: "v_house_b", screenX: 1, screenY: 1, x: 23, y: 17, w: 4, h: 4, kind: "house_c" },
  { id: "v_house_c", screenX: 1, screenY: 1, x: 28, y: 17, w: 4, h: 4, kind: "house_a" },
  { id: "v_guild_flag", screenX: 1, screenY: 1, x: 18, y: 22, w: 1, h: 1, kind: "guild_flag" },
  { id: "v_inn_sign", screenX: 1, screenY: 1, x: 24, y: 22, w: 1, h: 1, kind: "inn_sign" },
  { id: "v_shop_stall", screenX: 1, screenY: 1, x: 26, y: 22, w: 2, h: 1, kind: "shop_stall" },
  { id: "dg_gate", screenX: 1, screenY: 2, x: 23, y: 39, w: 2, h: 2, kind: "dungeon_gate" },
  { id: "boss_gate", screenX: 2, screenY: 2, x: 40, y: 40, w: 2, h: 2, kind: "boss_gate" },
];

const MONSTER_TEMPLATES: Array<{
  id: string;
  name: string;
  sprite: string;
  face: string;
  hp: number;
  kind: "monster" | "boss";
}> = [
  {
    id: "goblin",
    name: "Goblin",
    sprite: `${CHARACTER_BASE}/GreenPig/SeparateAnim/Walk.png`,
    face: `${CHARACTER_BASE}/GreenPig/Faceset.png`,
    hp: 14,
    kind: "monster",
  },
  {
    id: "skeleton",
    name: "Squelette",
    sprite: `${CHARACTER_BASE}/Skeleton/SeparateAnim/Walk.png`,
    face: `${CHARACTER_BASE}/Skeleton/Faceset.png`,
    hp: 16,
    kind: "monster",
  },
  {
    id: "demon",
    name: "Demon",
    sprite: `${CHARACTER_BASE}/DemonRed/SeparateAnim/Walk.png`,
    face: `${CHARACTER_BASE}/DemonRed/Faceset.png`,
    hp: 20,
    kind: "monster",
  },
  {
    id: "lord",
    name: "Roi Demon",
    sprite: `${CHARACTER_BASE}/DemonGreen/SeparateAnim/Walk.png`,
    face: `${CHARACTER_BASE}/DemonGreen/Faceset.png`,
    hp: 42,
    kind: "boss",
  },
];

export function createInitialSoloState(input: {
  playerName: string;
  powerText: string;
  powerRoll: number;
  powerAccepted: boolean;
  characterId?: string;
}): SoloGameState {
  const character = resolveCharacter(input.characterId);
  const tiles = createTiles();
  const actors = createActors();

  const startX = 24;
  const startY = 25;
  const startChunk = chunkOf(startX, startY);

  const playerInventory: InventoryItem[] = [
    {
      id: "starter_torch",
      itemId: "starter_torch",
      name: "Torche",
      qty: 1,
      icon: `${ICON_BASE}/Interact.png`,
      sprite: null,
      emoji: "fire",
    },
  ];

  const state: SoloGameState = {
    status: "playing",
    turn: 1,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    tiles,
    actors,
    quests: [
      {
        id: "quest_guild_notice",
        title: "Inscription de guilde",
        description: "Parle au maitre de guilde pour debloquer ta mission.",
        rank: "C",
        done: false,
        progress: 0,
        target: 1,
        rewardGold: 15,
      },
      {
        id: "quest_dungeon_core",
        title: "Coeur du donjon",
        description: "Atteins la porte du donjon et recupere une relique.",
        rank: "B",
        done: false,
        progress: 0,
        target: 1,
        rewardGold: 40,
      },
      {
        id: "quest_demon_king",
        title: "Roi Demon",
        description: "Vaincs le boss final dans la zone infernale.",
        rank: "S",
        done: false,
        progress: 0,
        target: 1,
        rewardGold: 100,
      },
    ],
    log: [
      "SYSTEM: Bienvenue dans Oracle20 Solo Isekai.",
      `SYSTEM: ${input.powerAccepted ? "Pouvoir accepte" : "Pouvoir inverse"} (D20 initial ${input.powerRoll}).`,
      "SYSTEM: Objectif principal: vaincre le Roi Demon.",
    ],
    player: {
      name: input.playerName,
      characterId: character.id,
      characterIdle: character.idle,
      characterWalk: character.walk,
      characterFace: character.face,
      hp: 10,
      maxHp: 10,
      lives: 3,
      maxLives: 3,
      gold: 10,
      strength: 5,
      stress: 0,
      x: startX,
      y: startY,
      powerText: input.powerText,
      powerRoll: input.powerRoll,
      powerAccepted: input.powerAccepted,
      objective: "Vaincre le Roi Demon",
      rank: "C",
      equippedItemId: null,
      equippedItemName: null,
      equippedItemSprite: null,
      inventory: playerInventory,
    },
    revealedChunks: [chunkKey(startChunk.cx, startChunk.cy)],
    lastAction: "Debut de partie",
    lastNarration: "Tu arrives au camp du village central.",
  };

  enforceWorldCoherence(state);
  return state;
}

export function idxOf(x: number, y: number): number {
  return y * WORLD_WIDTH + x;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < WORLD_WIDTH && y < WORLD_HEIGHT;
}

export function chunkOf(x: number, y: number): { cx: number; cy: number } {
  return {
    cx: Math.floor(x / CHUNK_SIZE),
    cy: Math.floor(y / CHUNK_SIZE),
  };
}

export function chunkKey(cx: number, cy: number): string {
  return `${cx}_${cy}`;
}

export function screenLabel(cx: number, cy: number): string {
  const key = `${cx}_${cy}`;
  if (key === "1_1") return "Village Central";
  if (key === "0_1") return "Foret de Brume";
  if (key === "2_1") return "Dunes Rouges";
  if (key === "1_2") return "Donjon Oublie";
  if (key === "2_2") return "Citadelle du Demon";
  if (key === "0_0") return "Bois Ancien";
  if (key === "1_0") return "Hauteurs de la Route";
  if (key === "2_0") return "Mesa Brulee";
  return "Lisiere Sud";
}

export function getTile(state: SoloGameState, x: number, y: number): Tile | null {
  if (!inBounds(x, y)) return null;
  return state.tiles[idxOf(x, y)] ?? null;
}

export function visibleTiles(state: SoloGameState): Array<{ x: number; y: number; tile: Tile }> {
  const { cx, cy } = chunkOf(state.player.x, state.player.y);
  return tilesForChunk(state, cx, cy);
}

export function tilesForChunk(
  state: SoloGameState,
  cx: number,
  cy: number
): Array<{ x: number; y: number; tile: Tile }> {
  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;
  const out: Array<{ x: number; y: number; tile: Tile }> = [];

  for (let y = 0; y < CHUNK_SIZE; y += 1) {
    for (let x = 0; x < CHUNK_SIZE; x += 1) {
      const worldX = startX + x;
      const worldY = startY + y;
      if (!inBounds(worldX, worldY)) continue;
      out.push({ x: worldX, y: worldY, tile: state.tiles[idxOf(worldX, worldY)] });
    }
  }

  return out;
}

export function actorsInChunk(state: SoloGameState, cx: number, cy: number): WorldActor[] {
  return state.actors.filter((actor) => actor.alive && chunkOf(actor.x, actor.y).cx === cx && chunkOf(actor.x, actor.y).cy === cy);
}

export function chunkCenter(cx: number, cy: number): { x: number; y: number } {
  return {
    x: cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2),
    y: cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2),
  };
}

export function poiLabel(poi: PoiType): string {
  if (poi === "camp") return "Camp";
  if (poi === "guild") return "Guilde";
  if (poi === "shop") return "Boutique";
  if (poi === "inn") return "Auberge";
  if (poi === "house") return "Maison";
  if (poi === "dungeon_gate") return "Porte du Donjon";
  if (poi === "boss_gate") return "Porte du Boss";
  return "";
}

export function terrainLabel(terrain: TerrainType): string {
  if (terrain === "forest") return "Foret";
  if (terrain === "desert") return "Desert";
  if (terrain === "village") return "Village";
  if (terrain === "road") return "Route";
  if (terrain === "water") return "Eau";
  if (terrain === "stone") return "Pierre";
  if (terrain === "dungeon") return "Donjon";
  if (terrain === "boss") return "Zone Boss";
  return "Plaine";
}

export function terrainColor(terrain: TerrainType): string {
  if (terrain === "forest") return "#4f8a4c";
  if (terrain === "desert") return "#bf8f50";
  if (terrain === "village") return "#d2ac74";
  if (terrain === "road") return "#b18d64";
  if (terrain === "water") return "#3f6f9d";
  if (terrain === "stone") return "#72707d";
  if (terrain === "dungeon") return "#615a67";
  if (terrain === "boss") return "#6e4545";
  return "#6aa75e";
}

export function getDecorsForChunk(cx: number, cy: number): SceneDecor[] {
  return DECORS.filter((entry) => entry.screenX === cx && entry.screenY === cy);
}

export function getPoiAnchor(
  cx: number,
  cy: number,
  poi: Exclude<PoiType, null>
): { x: number; y: number } | null {
  const found = CANONICAL_POI_PLACEMENTS.find((entry) => {
    if (entry.poi !== poi) return false;
    const chunk = chunkOf(entry.x, entry.y);
    return chunk.cx === cx && chunk.cy === cy;
  });
  if (!found) return null;
  return { x: found.anchorX, y: found.anchorY };
}

function createTiles(): Tile[] {
  const tiles: Tile[] = new Array(WORLD_WIDTH * WORLD_HEIGHT);

  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      tiles[idxOf(x, y)] = {
        terrain: "grass",
        blocked: false,
        destructible: false,
        poi: null,
        prop: "none",
      };
    }
  }

  paintScreen(tiles, 0, 0, "forest");
  paintScreen(tiles, 1, 0, "grass");
  paintScreen(tiles, 2, 0, "desert");
  paintScreen(tiles, 0, 1, "forest");
  paintScreen(tiles, 1, 1, "village");
  paintScreen(tiles, 2, 1, "desert");
  paintScreen(tiles, 0, 2, "forest");
  paintScreen(tiles, 1, 2, "dungeon");
  paintScreen(tiles, 2, 2, "boss");

  // Core roads: east-west main route, then north-south village spine.
  paintRoadBandHorizontal(tiles, 23, 23, 1, WORLD_WIDTH - 2);
  paintRoadBandVertical(tiles, 23, 23, 8, WORLD_HEIGHT - 2);

  // Village plaza to break monotony and keep readable POI flow.
  paintRect(tiles, 20, 22, 10, 6, { terrain: "road", blocked: false, destructible: false });
  paintRect(tiles, 16, 16, 16, 7, { terrain: "village", blocked: false, destructible: false });
  paintRect(tiles, 20, 25, 8, 4, { terrain: "village", blocked: false, destructible: false });

  // Water boundaries.
  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    setTile(tiles, x, 0, { terrain: "water", blocked: true });
    setTile(tiles, x, WORLD_HEIGHT - 1, { terrain: "water", blocked: true });
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    setTile(tiles, 0, y, { terrain: "water", blocked: true });
    setTile(tiles, WORLD_WIDTH - 1, y, { terrain: "water", blocked: true });
  }

  // Canonical POI layout.
  for (const poi of CANONICAL_POI_PLACEMENTS) {
    setPoi(tiles, poi.x, poi.y, poi.poi);
  }

  // Handcrafted resources (no random placement).
  addForestZoneProps(tiles);
  addDesertZoneProps(tiles);
  addDungeonZoneProps(tiles);
  applyDecorCollisionFootprints(tiles);

  // Keep central roads clean.
  clearRoadProps(tiles, 23, "vertical");
  clearRoadProps(tiles, 24, "vertical");
  clearRoadProps(tiles, 23, "horizontal");
  clearRoadProps(tiles, 24, "horizontal");
  clearProtectedPathTiles(tiles);

  return tiles;
}

function createActors(): WorldActor[] {
  const actors: WorldActor[] = [
    {
      id: "npc_guild_master",
      name: "Maitre de Guilde",
      kind: "npc",
      x: 18,
      y: 24,
      hp: 18,
      maxHp: 18,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/Master/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/Master/Faceset.png`,
      dialogue: [
        "La guilde recrute des aventuriers audacieux.",
        "Si tu veux du rang, prouve ta valeur dans le donjon.",
        "Les quetes de rang S ne sont pas pour les faibles.",
      ],
      patrol: { axis: "y", range: 0.2, speed: 0.35, phase: 0.2 },
    },
    {
      id: "npc_shopkeeper",
      name: "Marchand",
      kind: "npc",
      x: 27,
      y: 24,
      hp: 14,
      maxHp: 14,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/OldMan2/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/OldMan2/Faceset.png`,
      dialogue: [
        "Mes prix changent selon le danger du moment.",
        "Tu veux acheter ou vendre ?",
        "J ai recu des potions fraiches ce matin.",
      ],
      patrol: { axis: "x", range: 0.2, speed: 0.3, phase: 0.7 },
    },
    {
      id: "npc_innkeeper",
      name: "Aubergiste",
      kind: "npc",
      x: 24,
      y: 24,
      hp: 14,
      maxHp: 14,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/OldWoman/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/OldWoman/Faceset.png`,
      dialogue: [
        "Un repos ici reduit ton stress.",
        "Le demon rode pres des ruines du sud-est.",
        "Fais attention dans les dunes, aventurier.",
      ],
      patrol: { axis: "x", range: 0.2, speed: 0.3, phase: 1.1 },
    },
    {
      id: "npc_villager_square_a",
      name: "Villageois",
      kind: "npc",
      x: 22,
      y: 27,
      hp: 10,
      maxHp: 10,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/Villager/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/Villager/Faceset.png`,
      dialogue: [
        "La place est plus sure depuis l arrivee des aventuriers.",
        "Tu as vu le chat du village ? Il traine partout.",
      ],
      patrol: { axis: "x", range: 0.3, speed: 0.4, phase: 0.35 },
    },
    {
      id: "npc_villager_square_b",
      name: "Forgeron",
      kind: "npc",
      x: 27,
      y: 27,
      hp: 12,
      maxHp: 12,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/Villager2/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/Villager2/Faceset.png`,
      dialogue: [
        "Les routes sont ouvertes, mais les dunes restent dangereuses.",
        "Si tu ramenes du minerai, je pourrai forger quelque chose.",
      ],
      patrol: { axis: "y", range: 0.3, speed: 0.4, phase: 0.55 },
    },
    {
      id: "npc_guard_road",
      name: "Garde",
      kind: "npc",
      x: 20,
      y: 23,
      hp: 16,
      maxHp: 16,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/KnightGold/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/KnightGold/Faceset.png`,
      dialogue: [
        "La route principale est securisee.",
        "Ne t aventure pas au sud sans preparation.",
      ],
      patrol: { axis: "x", range: 0.3, speed: 0.35, phase: 1.4 },
    },
    {
      id: "npc_child_village",
      name: "Enfant",
      kind: "npc",
      x: 26,
      y: 26,
      hp: 6,
      maxHp: 6,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/Child/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/Child/Faceset.png`,
      dialogue: [
        "Un jour je serai aventurier comme toi !",
        "Le chat a vole un poisson au marche !",
      ],
      patrol: { axis: "x", range: 0.4, speed: 0.5, phase: 0.9 },
    },
    {
      id: "animal_cat_village",
      name: "Chat",
      kind: "animal",
      x: 25,
      y: 28,
      hp: 6,
      maxHp: 6,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Cat/SpriteSheet.png`,
      face: `${ANIMAL_BASE}/Cat/Faceset.png`,
      dialogue: ["Miaou."],
      patrol: { axis: "x", range: 0.4, speed: 0.5, phase: 0.4 },
    },
    {
      id: "animal_dog_forest",
      name: "Chien",
      kind: "animal",
      x: 10,
      y: 21,
      hp: 6,
      maxHp: 6,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Dog/SpriteSheet.png`,
      face: `${ANIMAL_BASE}/Dog/Faceset.png`,
      dialogue: ["Wouf."],
      patrol: { axis: "y", range: 0.4, speed: 0.45, phase: 2.2 },
    },
    {
      id: "animal_chicken_desert",
      name: "Poulet perdu",
      kind: "animal",
      x: 39,
      y: 21,
      hp: 5,
      maxHp: 5,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Chicken/SpriteSheetWhite.png`,
      face: `${ANIMAL_BASE}/Chicken/FacesetWhite.png`,
      dialogue: ["Cot cot."],
      patrol: { axis: "x", range: 0.4, speed: 0.5, phase: 1.8 },
    },
    {
      id: "animal_frog_dungeon",
      name: "Grenouille",
      kind: "animal",
      x: 22,
      y: 36,
      hp: 4,
      maxHp: 4,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Frog/SpriteSheet.png`,
      face: `${ANIMAL_BASE}/Frog/Faceset.png`,
      dialogue: ["Croaa."],
      patrol: { axis: "y", range: 0.3, speed: 0.4, phase: 3.1 },
    },
  ];

  const spawned = spawnHostiles();
  return [...actors, ...spawned];
}

function spawnHostiles(): WorldActor[] {
  const hostileSpawns: Array<{ x: number; y: number; templateId: string }> = [
    { x: 10, y: 9, templateId: "goblin" },
    { x: 12, y: 30, templateId: "skeleton" },
    { x: 7, y: 39, templateId: "goblin" },
    { x: 34, y: 8, templateId: "skeleton" },
    { x: 41, y: 22, templateId: "demon" },
    { x: 36, y: 38, templateId: "demon" },
    { x: 26, y: 39, templateId: "skeleton" },
    { x: 40, y: 40, templateId: "lord" },
  ];

  return hostileSpawns.map((spawn, index) => {
    const template = MONSTER_TEMPLATES.find((entry) => entry.id === spawn.templateId) ?? MONSTER_TEMPLATES[0];
    return {
      id: `hostile_${index}_${template.id}`,
      name: template.name,
      kind: template.kind,
      x: spawn.x,
      y: spawn.y,
      hp: template.hp,
      maxHp: template.hp,
      hostile: true,
      alive: true,
      sprite: template.sprite,
      face: template.face,
      dialogue: template.kind === "boss" ? ["Je suis ton destin final."] : [],
      patrol:
        template.kind === "boss"
          ? { axis: "x", range: 0.3, speed: 0.35, phase: 0.9 }
          : {
              axis: index % 2 === 0 ? "x" : "y",
              range: 0.35,
              speed: 0.35 + (index % 3) * 0.06,
              phase: index * 0.6,
            },
    };
  });
}

function setTile(tiles: Tile[], x: number, y: number, patch: Partial<Tile>): void {
  if (!inBounds(x, y)) return;
  const index = idxOf(x, y);
  tiles[index] = {
    ...tiles[index],
    ...patch,
  };
}

function setPoi(tiles: Tile[], x: number, y: number, poi: NonNullable<PoiType>): void {
  setTile(tiles, x, y, { poi, blocked: false, destructible: false });
}

function paintScreen(tiles: Tile[], screenX: number, screenY: number, terrain: TerrainType): void {
  const sx = screenX * CHUNK_SIZE;
  const sy = screenY * CHUNK_SIZE;
  for (let y = sy; y < sy + CHUNK_SIZE; y += 1) {
    for (let x = sx; x < sx + CHUNK_SIZE; x += 1) {
      setTile(tiles, x, y, {
        terrain,
        blocked: terrain === "water",
        destructible: false,
        poi: null,
        prop: "none",
      });
    }
  }
}

function paintRoadBandHorizontal(
  tiles: Tile[],
  yStart: number,
  yEnd: number,
  xStart: number,
  xEnd: number
): void {
  for (let y = yStart; y <= yEnd; y += 1) {
    for (let x = xStart; x <= xEnd; x += 1) {
      setTile(tiles, x, y, { terrain: "road", blocked: false, destructible: false, prop: "none" });
    }
  }
}

function paintRoadBandVertical(
  tiles: Tile[],
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number
): void {
  for (let x = xStart; x <= xEnd; x += 1) {
    for (let y = yStart; y <= yEnd; y += 1) {
      setTile(tiles, x, y, { terrain: "road", blocked: false, destructible: false, prop: "none" });
    }
  }
}

function paintRect(
  tiles: Tile[],
  x: number,
  y: number,
  w: number,
  h: number,
  patch: Partial<Tile>
): void {
  for (let iy = y; iy < y + h; iy += 1) {
    for (let ix = x; ix < x + w; ix += 1) {
      setTile(tiles, ix, iy, patch);
    }
  }
}

function blockRect(tiles: Tile[], x: number, y: number, w: number, h: number): void {
  for (let iy = y; iy < y + h; iy += 1) {
    for (let ix = x; ix < x + w; ix += 1) {
      setTile(tiles, ix, iy, { blocked: true, destructible: false, prop: "none" });
    }
  }
}

function placeProp(tiles: Tile[], x: number, y: number, prop: TileProp, blocks: boolean): void {
  if (!inBounds(x, y)) return;
  const tile = tiles[idxOf(x, y)];
  if (!tile) return;
  if (tile.terrain === "road" || tile.poi !== null) return;
  if (tile.blocked && tile.prop !== "none") return;

  setTile(tiles, x, y, {
    prop,
    blocked: blocks,
    destructible: true,
  });
}

function addForestZoneProps(tiles: Tile[]): void {
  const forestInteriorTrees: Array<[number, number]> = [
    [2, 2], [4, 2], [6, 3], [9, 2], [12, 3], [14, 4],
    [3, 6], [5, 7], [8, 6], [11, 7], [14, 8],
    [2, 18], [4, 19], [7, 18], [13, 19],
    [3, 27], [6, 28], [10, 27], [14, 29],
    [2, 34], [5, 35], [9, 34], [12, 36], [14, 37],
    [3, 40], [6, 41], [10, 40], [13, 42],
  ];
  forestInteriorTrees.forEach(([x, y]) => placeProp(tiles, x, y, "tree", true));

  const forestRocks: Array<[number, number]> = [
    [8, 20],
    [12, 21],
    [6, 26],
    [11, 30],
    [8, 39],
    [12, 43],
  ];
  forestRocks.forEach(([x, y]) => placeProp(tiles, x, y, "rock", true));
}

function addDesertZoneProps(tiles: Tile[]): void {
  const desertCactus: Array<[number, number]> = [
    [34, 2], [36, 3], [39, 2], [42, 3], [45, 4],
    [33, 7], [36, 8], [40, 7], [44, 8], [46, 9],
    [35, 12], [38, 13], [42, 12], [45, 13],
  ];
  desertCactus.forEach(([x, y]) => placeProp(tiles, x, y, "cactus", true));

  const desertRocks: Array<[number, number]> = [
    [34, 18],
    [36, 19],
    [40, 18],
    [43, 20],
    [35, 35],
    [41, 36],
  ];
  desertRocks.forEach(([x, y]) => placeProp(tiles, x, y, "rock", true));
}

function addDungeonZoneProps(tiles: Tile[]): void {
  const stoneDebris: Array<[number, number]> = [
    [19, 34],
    [22, 35],
    [27, 34],
    [29, 36],
    [21, 42],
    [26, 43],
  ];
  stoneDebris.forEach(([x, y]) => placeProp(tiles, x, y, "rock", true));

  const crates: Array<[number, number]> = [
    [34, 34],
    [36, 35],
    [40, 34],
    [42, 36],
    [37, 42],
    [44, 43],
  ];
  crates.forEach(([x, y]) => placeProp(tiles, x, y, "crate", true));
}

function applyDecorCollisionFootprints(tiles: Tile[]): void {
  const solidKinds = new Set<SceneDecorKind>([
    "house_a",
    "house_b",
    "house_c",
    "ruin_a",
    "ruin_b",
    "fence_h",
    "fence_v",
    "well",
  ]);
  for (const decor of DECORS) {
    if (!solidKinds.has(decor.kind)) continue;
    blockRect(tiles, decor.x, decor.y, decor.w, decor.h);
  }
}

function clearRoadProps(tiles: Tile[], axis: number, orientation: "vertical" | "horizontal"): void {
  if (orientation === "vertical") {
    for (let y = 1; y < WORLD_HEIGHT - 1; y += 1) {
      setTile(tiles, axis, y, { prop: "none", blocked: false, destructible: false });
      setTile(tiles, axis - 1, y, { prop: "none", blocked: false, destructible: false });
    }
    return;
  }

  for (let x = 1; x < WORLD_WIDTH - 1; x += 1) {
    setTile(tiles, x, axis, { prop: "none", blocked: false, destructible: false });
    setTile(tiles, x, axis - 1, { prop: "none", blocked: false, destructible: false });
  }
}

function clearProtectedPathTiles(tiles: Tile[]): void {
  for (const pathTile of PROTECTED_PATH_TILES) {
    setTile(tiles, pathTile.x, pathTile.y, {
      terrain: "road",
      blocked: false,
      destructible: false,
      prop: "none",
    });
  }
}

function isWalkableTile(tile: Tile | undefined): boolean {
  if (!tile) return false;
  if (tile.blocked) return false;
  if (tile.terrain === "water") return false;
  return true;
}

function findNearestWalkable(
  state: SoloGameState,
  startX: number,
  startY: number,
  chunkX: number,
  chunkY: number,
  occupied: Set<string>
): { x: number; y: number } | null {
  const originX = Math.min(Math.max(Math.round(startX), 0), WORLD_WIDTH - 1);
  const originY = Math.min(Math.max(Math.round(startY), 0), WORLD_HEIGHT - 1);
  const minX = chunkX * CHUNK_SIZE;
  const maxX = minX + CHUNK_SIZE - 1;
  const minY = chunkY * CHUNK_SIZE;
  const maxY = minY + CHUNK_SIZE - 1;

  for (let radius = 0; radius <= 10; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) > radius) continue;
        const x = originX + dx;
        const y = originY + dy;
        if (x < minX || x > maxX || y < minY || y > maxY) continue;
        if (!inBounds(x, y)) continue;
        const key = `${x},${y}`;
        if (occupied.has(key)) continue;
        const tile = state.tiles[idxOf(x, y)];
        if (!isWalkableTile(tile)) continue;
        if (tile?.poi === "house" || tile?.poi === "dungeon_gate" || tile?.poi === "boss_gate") continue;
        return { x, y };
      }
    }
  }
  return null;
}

function normalizeActorPositions(state: SoloGameState): void {
  const occupied = new Set<string>([`${Math.round(state.player.x)},${Math.round(state.player.y)}`]);
  for (const actor of state.actors) {
    if (!actor.alive) continue;
    const rawX = Math.min(Math.max(Math.round(actor.x), 0), WORLD_WIDTH - 1);
    const rawY = Math.min(Math.max(Math.round(actor.y), 0), WORLD_HEIGHT - 1);
    const { cx, cy } = chunkOf(rawX, rawY);
    const tile = inBounds(rawX, rawY) ? state.tiles[idxOf(rawX, rawY)] : undefined;
    const key = `${rawX},${rawY}`;
    if (isWalkableTile(tile) && !occupied.has(key)) {
      actor.x = rawX;
      actor.y = rawY;
      occupied.add(key);
      continue;
    }

    const fallback = findNearestWalkable(state, rawX, rawY, cx, cy, occupied);
    if (!fallback) continue;
    actor.x = fallback.x;
    actor.y = fallback.y;
    occupied.add(`${fallback.x},${fallback.y}`);
  }
}

function normalizePlayerPosition(state: SoloGameState): void {
  if (!Number.isFinite(state.player.x) || !Number.isFinite(state.player.y)) {
    state.player.x = 24;
    state.player.y = 25;
  }
  const playerX = Math.min(Math.max(Math.round(state.player.x), 0), WORLD_WIDTH - 1);
  const playerY = Math.min(Math.max(Math.round(state.player.y), 0), WORLD_HEIGHT - 1);
  state.player.x = playerX;
  state.player.y = playerY;

  const tile = state.tiles[idxOf(playerX, playerY)];
  if (isWalkableTile(tile)) return;
  const { cx, cy } = chunkOf(playerX, playerY);
  const safeTile = findNearestWalkable(state, playerX, playerY, cx, cy, new Set());
  if (safeTile) {
    state.player.x = safeTile.x;
    state.player.y = safeTile.y;
    return;
  }
  state.player.x = 24;
  state.player.y = 25;
}

function normalizeTilePropsForBiome(tiles: Tile[]): void {
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      const index = idxOf(x, y);
      const tile = tiles[index];
      if (!tile) continue;

      let nextProp: TileProp = tile.prop;
      if (nextProp === "palm") nextProp = "cactus";
      if (nextProp === "ruin") nextProp = "rock";

      if (tile.poi !== null && nextProp !== "none") {
        nextProp = "none";
      }

      if (nextProp === "tree" || nextProp === "stump") {
        if (tile.terrain !== "forest" && tile.terrain !== "grass") nextProp = "none";
      } else if (nextProp === "cactus") {
        if (tile.terrain !== "desert") nextProp = "none";
      } else if (nextProp === "crate") {
        if (tile.terrain !== "dungeon" && tile.terrain !== "boss") nextProp = "none";
      } else if (nextProp === "rock") {
        if (tile.terrain === "water") nextProp = "none";
      }

      if (nextProp !== tile.prop) {
        tiles[index] = {
          ...tile,
          prop: nextProp,
          blocked: nextProp === "none" ? tile.blocked : true,
          destructible: nextProp === "none" ? false : tile.destructible || true,
        };
      }
    }
  }
}

export function enforceWorldCoherence(state: SoloGameState): void {
  if (!Array.isArray(state.tiles) || state.tiles.length !== WORLD_WIDTH * WORLD_HEIGHT) return;

  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    setTile(state.tiles, x, 0, { terrain: "water", blocked: true, destructible: false, prop: "none" });
    setTile(state.tiles, x, WORLD_HEIGHT - 1, {
      terrain: "water",
      blocked: true,
      destructible: false,
      prop: "none",
    });
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    setTile(state.tiles, 0, y, { terrain: "water", blocked: true, destructible: false, prop: "none" });
    setTile(state.tiles, WORLD_WIDTH - 1, y, {
      terrain: "water",
      blocked: true,
      destructible: false,
      prop: "none",
    });
  }

  for (const poi of CANONICAL_POI_PLACEMENTS) {
    setTile(state.tiles, poi.x, poi.y, {
      poi: poi.poi,
      blocked: false,
      destructible: false,
      prop: "none",
    });
  }

  clearRoadProps(state.tiles, 23, "vertical");
  clearRoadProps(state.tiles, 24, "vertical");
  clearRoadProps(state.tiles, 23, "horizontal");
  clearRoadProps(state.tiles, 24, "horizontal");
  clearProtectedPathTiles(state.tiles);
  normalizeTilePropsForBiome(state.tiles);

  applyDecorCollisionFootprints(state.tiles);
  normalizePlayerPosition(state);
  normalizeActorPositions(state);
}

export const UI_ASSETS = {
  dialogBox:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Ui/Dialog/DialogBox.png",
  dialogInfo:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Ui/Dialog/DialogInfo.png",
  heart:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Ui/Receptacle/Heart.png",
  gold:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Ui/Skill Icon/Items & Weapon/Money.png",
  stress:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Ui/Skill Icon/Job & Action/Sing.png",
  strength:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Ui/Skill Icon/Job & Action/Punch.png",
};

export const WORLD_META = {
  screensX: WORLD_SCREENS_X,
  screensY: WORLD_SCREENS_Y,
  tileSize: 32,
  chunkSize: CHUNK_SIZE,
};

// Optional sprite hint for special enemies.
export const SPECIAL_SPRITES = {
  lanternRed: `${MONSTER_BASE}/LanternRed/SpriteSheet.png`,
};
