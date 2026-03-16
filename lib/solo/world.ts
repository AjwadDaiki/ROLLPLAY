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

const DECORS: SceneDecor[] = [
  { id: "v_house_a", screenX: 1, screenY: 1, x: 18, y: 18, w: 4, h: 4, kind: "house_a" },
  { id: "v_house_b", screenX: 1, screenY: 1, x: 24, y: 18, w: 4, h: 4, kind: "house_b" },
  { id: "v_house_c", screenX: 1, screenY: 1, x: 30, y: 18, w: 4, h: 4, kind: "house_b" },
  { id: "v_guild_flag", screenX: 1, screenY: 1, x: 18, y: 22, w: 1, h: 1, kind: "guild_flag" },
  { id: "v_inn_sign", screenX: 1, screenY: 1, x: 21, y: 23, w: 1, h: 1, kind: "inn_sign" },
  { id: "f_fence_1", screenX: 0, screenY: 1, x: 9, y: 23, w: 4, h: 1, kind: "fence_h" },
  { id: "f_fence_2", screenX: 0, screenY: 1, x: 6, y: 20, w: 1, h: 4, kind: "fence_v" },
  { id: "d_ruin_1", screenX: 2, screenY: 1, x: 35, y: 19, w: 3, h: 3, kind: "ruin_a" },
  { id: "d_ruin_2", screenX: 2, screenY: 1, x: 40, y: 21, w: 3, h: 3, kind: "ruin_b" },
  { id: "d_palms", screenX: 2, screenY: 1, x: 43, y: 24, w: 2, h: 2, kind: "palm_cluster" },
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

  return {
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
  paintRoadBandHorizontal(tiles, 23, 24, 1, WORLD_WIDTH - 2);
  paintRoadBandVertical(tiles, 23, 24, 8, WORLD_HEIGHT - 2);

  // Village plaza to break monotony and keep readable POI flow.
  paintRect(tiles, 20, 22, 10, 6, { terrain: "road", blocked: false, destructible: false });

  // Water boundaries.
  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    setTile(tiles, x, 0, { terrain: "water", blocked: true });
    setTile(tiles, x, WORLD_HEIGHT - 1, { terrain: "water", blocked: true });
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    setTile(tiles, 0, y, { terrain: "water", blocked: true });
    setTile(tiles, WORLD_WIDTH - 1, y, { terrain: "water", blocked: true });
  }

  // Dungeon and boss gates.
  setPoi(tiles, 24, 40, "dungeon_gate");
  setPoi(tiles, 40, 40, "boss_gate");

  // Village POI.
  setPoi(tiles, 24, 25, "camp");
  setPoi(tiles, 18, 23, "guild");
  setPoi(tiles, 27, 23, "shop");
  setPoi(tiles, 21, 24, "inn");
  setPoi(tiles, 19, 22, "house");
  setPoi(tiles, 25, 22, "house");
  setPoi(tiles, 31, 22, "house");

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
      ],
      patrol: { axis: "y", range: 0.28, speed: 0.22, phase: 0.2 },
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
      dialogue: ["Mes prix changent selon le danger du moment.", "Tu veux acheter ou vendre ?"],
      patrol: { axis: "x", range: 0.3, speed: 0.24, phase: 0.7 },
    },
    {
      id: "npc_innkeeper",
      name: "Aubergiste",
      kind: "npc",
      x: 21,
      y: 25,
      hp: 14,
      maxHp: 14,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/OldWoman/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/OldWoman/Faceset.png`,
      dialogue: ["Un repos ici reduit ton stress.", "Le demon rode pres des ruines du sud-est."],
      patrol: { axis: "x", range: 0.24, speed: 0.21, phase: 1.1 },
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
      dialogue: ["La place est plus sure depuis l arrivee des aventuriers."],
      patrol: { axis: "x", range: 0.3, speed: 0.22, phase: 0.35 },
    },
    {
      id: "npc_villager_square_b",
      name: "Forgeron",
      kind: "npc",
      x: 28,
      y: 27,
      hp: 12,
      maxHp: 12,
      hostile: false,
      alive: true,
      sprite: `${CHARACTER_BASE}/Villager2/SeparateAnim/Walk.png`,
      face: `${CHARACTER_BASE}/Villager2/Faceset.png`,
      dialogue: ["Les routes sont ouvertes, mais les dunes restent dangereuses."],
      patrol: { axis: "y", range: 0.28, speed: 0.22, phase: 0.55 },
    },
    {
      id: "animal_cat_village",
      name: "Chat",
      kind: "animal",
      x: 23,
      y: 27,
      hp: 6,
      maxHp: 6,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Cat/SpriteSheet.png`,
      face: `${ANIMAL_BASE}/Cat/Faceset.png`,
      dialogue: ["Miaou."],
      patrol: { axis: "x", range: 0.32, speed: 0.29, phase: 0.4 },
    },
    {
      id: "animal_dog_forest",
      name: "Chien",
      kind: "animal",
      x: 11,
      y: 24,
      hp: 6,
      maxHp: 6,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Dog/SpriteSheet.png`,
      face: `${ANIMAL_BASE}/Dog/Faceset.png`,
      dialogue: ["Wouf."],
      patrol: { axis: "y", range: 0.34, speed: 0.28, phase: 2.2 },
    },
    {
      id: "animal_chicken_desert",
      name: "Poulet perdu",
      kind: "animal",
      x: 38,
      y: 24,
      hp: 5,
      maxHp: 5,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Chicken/SpriteSheetWhite.png`,
      face: `${ANIMAL_BASE}/Chicken/FacesetWhite.png`,
      dialogue: ["Cot cot."],
      patrol: { axis: "x", range: 0.3, speed: 0.3, phase: 1.8 },
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
          ? { axis: "x", range: 0.2, speed: 0.2, phase: 0.9 }
          : {
              axis: index % 2 === 0 ? "x" : "y",
              range: 0.25,
              speed: 0.22 + (index % 3) * 0.05,
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

  const desertPalms: Array<[number, number]> = [
    [37, 20],
    [42, 22],
    [44, 25],
    [35, 29],
    [39, 30],
    [45, 33],
  ];
  desertPalms.forEach(([x, y]) => placeProp(tiles, x, y, "palm", false));

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
  const ruins: Array<[number, number]> = [
    [19, 34],
    [22, 35],
    [27, 34],
    [29, 36],
    [21, 42],
    [26, 43],
  ];
  ruins.forEach(([x, y]) => placeProp(tiles, x, y, "ruin", true));

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
  const solidKinds = new Set<SceneDecorKind>(["house_a", "house_b", "ruin_a", "ruin_b", "fence_h", "fence_v"]);
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
