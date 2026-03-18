import { resolveCharacter } from "./characters";
import { resolveItemAsset } from "./assets";
import {
  createVillageDecors,
  createVillagePoiNodes,
  createVillageStructureEntities,
  VILLAGE_ACTOR_ANCHORS,
} from "./mapBlueprints";
import { hydrateSoloState } from "./runtime";
import { SHOP_CATALOG } from "./shop";
import type { EntityInventoryItem, InventoryItem, PoiType, SoloGameState, TerrainType, Tile, TileProp, WorldActor, WorldEntityRef, WorldEntityState } from "./types";
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
  | "house_d"
  | "fence_h"
  | "fence_v"
  | "ruin_a"
  | "ruin_b"
  | "palm_cluster"
  | "forest_grove_a"
  | "forest_grove_b"
  | "stone_cluster"
  | "citadel_tower"
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

export type PoiNode = {
  id: string;
  poi: Exclude<PoiType, null>;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  label: string | null;
  showLabel: boolean;
  protectPath: boolean;
  highlight: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

type ActorAnchor = {
  actorId: string;
  x: number;
  y: number;
};

export type MapStructure = {
  id: string;
  category: "service_building" | "house" | "landmark" | "gate";
  biome: TerrainType;
  decorKind: SceneDecorKind;
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
  serviceX: number | null;
  serviceY: number | null;
  poi: Exclude<PoiType, null> | null;
  label: string | null;
  showLabel: boolean;
  artProfileId: string;
};

export const WORLD_LAYOUT_VERSION = "solo_map_v14";

type CanonicalPoi = Exclude<PoiType, null>;
type PoiPlacement = { poi: CanonicalPoi; x: number; y: number; anchorX: number; anchorY: number };

const POI_NODES: PoiNode[] = [
  ...createVillagePoiNodes(),
  {
    id: "dungeon_gate",
    poi: "dungeon_gate",
    x: 24,
    y: 40,
    anchorX: 24,
    anchorY: 38.35,
    label: "Donjon",
    showLabel: true,
    protectPath: true,
    highlight: { x: 23, y: 39, w: 2, h: 2 },
  },
  {
    id: "boss_gate",
    poi: "boss_gate",
    x: 40,
    y: 40,
    anchorX: 40.5,
    anchorY: 38.35,
    label: "Citadelle",
    showLabel: true,
    protectPath: true,
    highlight: { x: 40, y: 40, w: 2, h: 2 },
  },
];

const CANONICAL_POI_PLACEMENTS: PoiPlacement[] = POI_NODES.map((entry) => ({
  poi: entry.poi,
  x: entry.x,
  y: entry.y,
  anchorX: entry.anchorX,
  anchorY: entry.anchorY,
}));

const PROTECTED_PATH_TILES: Array<{ x: number; y: number; terrain: TerrainType }> = POI_NODES.filter((entry) => entry.protectPath).map((entry) => ({
  x: entry.x,
  y: entry.y,
  terrain: entry.poi === "boss_gate" ? "boss" : "road",
}));

const LANDMARK_STRUCTURES: MapStructure[] = [
  {
    id: "mesa_ruin",
    category: "landmark",
    biome: "desert",
    decorKind: "ruin_a",
    x: 35,
    y: 4,
    w: 4,
    h: 4,
    anchorX: 37,
    anchorY: 4.8,
    serviceX: null,
    serviceY: null,
    poi: null,
    label: "Ruines",
    showLabel: false,
    artProfileId: "ruin_a",
  },
  {
    id: "mesa_oasis",
    category: "landmark",
    biome: "desert",
    decorKind: "palm_cluster",
    x: 40,
    y: 7,
    w: 4,
    h: 4,
    anchorX: 42,
    anchorY: 7.2,
    serviceX: null,
    serviceY: null,
    poi: null,
    label: "Oasis",
    showLabel: false,
    artProfileId: "palm_cluster",
  },
  {
    id: "dungeon_gate_structure",
    category: "gate",
    biome: "dungeon",
    decorKind: "dungeon_gate",
    x: 23,
    y: 39,
    w: 2,
    h: 2,
    anchorX: 24,
    anchorY: 38.35,
    serviceX: 24,
    serviceY: 40,
    poi: "dungeon_gate",
    label: "Donjon",
    showLabel: true,
    artProfileId: "dungeon_gate",
  },
  {
    id: "boss_gate_structure",
    category: "gate",
    biome: "boss",
    decorKind: "boss_gate",
    x: 40,
    y: 40,
    w: 2,
    h: 2,
    anchorX: 41,
    anchorY: 38.35,
    serviceX: 40,
    serviceY: 40,
    poi: "boss_gate",
    label: "Citadelle",
    showLabel: true,
    artProfileId: "boss_gate",
  },
];

const SCENERY_DECORS: SceneDecor[] = [
  { id: "forest_grove_ancient_a", screenX: 0, screenY: 0, x: 2, y: 2, w: 4, h: 4, kind: "forest_grove_a" },
  { id: "forest_grove_ancient_b", screenX: 0, screenY: 0, x: 9, y: 4, w: 4, h: 4, kind: "forest_grove_b" },
  { id: "forest_grove_brume_a", screenX: 0, screenY: 1, x: 2, y: 18, w: 4, h: 4, kind: "forest_grove_a" },
  { id: "forest_grove_brume_b", screenX: 0, screenY: 1, x: 9, y: 26, w: 4, h: 4, kind: "forest_grove_b" },
  { id: "forest_grove_lisiere_a", screenX: 0, screenY: 2, x: 2, y: 34, w: 4, h: 4, kind: "forest_grove_a" },
  { id: "highland_grove_a", screenX: 1, screenY: 0, x: 18, y: 4, w: 4, h: 4, kind: "forest_grove_b" },
  { id: "highland_grove_b", screenX: 1, screenY: 0, x: 27, y: 8, w: 4, h: 4, kind: "forest_grove_a" },
  { id: "dunes_ruin_secondary", screenX: 2, screenY: 1, x: 34, y: 18, w: 4, h: 4, kind: "ruin_b" },
  { id: "dunes_stone_outcrop", screenX: 2, screenY: 1, x: 41, y: 34, w: 3, h: 3, kind: "stone_cluster" },
  { id: "dungeon_cluster_west", screenX: 1, screenY: 2, x: 18, y: 35, w: 4, h: 4, kind: "stone_cluster" },
  { id: "dungeon_cluster_south", screenX: 1, screenY: 2, x: 27, y: 41, w: 4, h: 4, kind: "stone_cluster" },
  { id: "citadel_tower_nw", screenX: 2, screenY: 2, x: 35, y: 34, w: 2, h: 2, kind: "citadel_tower" },
  { id: "citadel_tower_ne", screenX: 2, screenY: 2, x: 44, y: 34, w: 2, h: 2, kind: "citadel_tower" },
  { id: "citadel_tower_sw", screenX: 2, screenY: 2, x: 35, y: 43, w: 2, h: 2, kind: "citadel_tower" },
  { id: "citadel_tower_se", screenX: 2, screenY: 2, x: 44, y: 43, w: 2, h: 2, kind: "citadel_tower" },
  { id: "citadel_cluster_west", screenX: 2, screenY: 2, x: 36, y: 38, w: 4, h: 4, kind: "stone_cluster" },
];

const MAP_STRUCTURES: MapStructure[] = [
  ...createVillageStructureEntities(),
  ...LANDMARK_STRUCTURES,
];

const DECORS: SceneDecor[] = [
  ...createVillageDecors(),
  ...SCENERY_DECORS,
  ...LANDMARK_STRUCTURES.map((structure) => ({
    id: structure.id,
    screenX: Math.floor(structure.x / CHUNK_SIZE),
    screenY: Math.floor(structure.y / CHUNK_SIZE),
    x: structure.x,
    y: structure.y,
    w: structure.w,
    h: structure.h,
    kind: structure.decorKind,
  })),
];

const ACTOR_ANCHORS: ActorAnchor[] = [
  ...VILLAGE_ACTOR_ANCHORS,
  { actorId: "animal_dog_forest", x: 10, y: 21 },
  { actorId: "animal_chicken_desert", x: 39, y: 21 },
  { actorId: "animal_frog_dungeon", x: 22, y: 36 },
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

function createEntityItem(name: string, qty = 1, ownerRef?: WorldEntityRef | null): EntityInventoryItem {
  const asset = resolveItemAsset(name);
  return {
    id: ownerRef ? `${ownerRef}_${asset.id}` : asset.id,
    itemId: asset.itemId,
    name: asset.name,
    qty,
    icon: asset.icon,
    sprite: asset.sprite,
    emoji: asset.emoji,
    ownerRef: ownerRef ?? null,
    equippedSlot: null,
    tags: [],
  };
}

function createInitialEntityStates(actors: WorldActor[]): Record<WorldEntityRef, WorldEntityState> {
  const entityStates: Record<WorldEntityRef, WorldEntityState> = {};

  for (const structure of getMapStructures()) {
    const ref = `structure:${structure.id}`;
    const base: WorldEntityState = {
      ref,
      ownerRef: null,
      faction: structure.poi === "guild" ? "guild" : structure.poi === "shop" || structure.poi === "inn" || structure.poi === "house" ? "village" : null,
      inventory: [],
      equipment: {},
      tags: [structure.category, structure.biome, structure.poi ?? "structure"],
      states: [],
      witnessRange: structure.poi === "shop" || structure.poi === "guild" || structure.poi === "inn" ? 6 : 3,
      accessPolicy: structure.poi
        ? {
            locked: false,
            sealed: false,
            requiresKeyItemId: null,
            crimeFaction: structure.poi === "guild" ? "guild" : "village",
            crimeZone: "village_camp",
            theftSeverity: structure.poi === "shop" ? 6 : 3,
          }
        : null,
    };

    if (structure.id === "shop") {
      base.inventory = SHOP_CATALOG.map((entry) => createEntityItem(entry.name, 6, ref));
      base.tags.push("merchant_stock");
    } else if (structure.id === "inn") {
      base.inventory = [createEntityItem("Ration", 4, ref), createEntityItem("Potion de soin", 1, ref)];
      base.tags.push("hospitality");
    } else if (structure.id === "guild") {
      base.inventory = [createEntityItem("Registre de quetes", 1, ref)];
      base.tags.push("quest_hub");
    }

    entityStates[ref] = base;
  }

  for (const actor of actors) {
    const ref = `actor:${actor.id}`;
    const state: WorldEntityState = {
      ref,
      ownerRef: actor.workStructureId ? `structure:${actor.workStructureId}` : actor.homeStructureId ? `structure:${actor.homeStructureId}` : null,
      faction: actor.faction ?? null,
      inventory: [],
      equipment: {},
      tags: [actor.kind, actor.role ?? actor.profession ?? actor.kind],
      states: actor.alive ? ["alive"] : ["dead"],
      witnessRange: actor.kind === "npc" ? 5 : actor.kind === "boss" ? 8 : 3,
      accessPolicy: actor.kind === "npc"
        ? {
            locked: false,
            sealed: false,
            requiresKeyItemId: null,
            crimeFaction: actor.faction ?? "village",
            crimeZone: actor.workStructureId === "guild" || actor.homeStructureId ? "village_camp" : "wilds",
            theftSeverity: actor.id === "npc_guard_road" ? 7 : 4,
          }
        : null,
    };

    if (actor.id === "npc_shopkeeper") {
      state.inventory = [createEntityItem("Bourse de marchand", 1, ref)];
      state.equipment.weapon = "ledger";
    } else if (actor.id === "npc_guard_road") {
      const spear = createEntityItem("Lance de garde", 1, ref);
      spear.equippedSlot = "weapon";
      state.inventory = [spear];
      state.equipment.weapon = spear.id;
    } else if (actor.kind === "boss") {
      const sword = createEntityItem("Epee du demon", 1, ref);
      sword.equippedSlot = "weapon";
      sword.tags = ["legendary", "boss_item"];
      state.inventory = [sword, createEntityItem("Couronne infernale", 1, ref)];
      state.equipment.weapon = sword.id;
      state.tags.push("boss");
    } else if (actor.kind === "monster") {
      state.inventory = [createEntityItem("Butin monstrueux", 1, ref)];
    } else if (actor.kind === "animal") {
      state.inventory = [];
    } else if (actor.id === "npc_innkeeper") {
      state.inventory = [createEntityItem("Cle de chambre", 1, ref)];
    } else if (actor.id === "npc_guild_master") {
      state.inventory = [createEntityItem("Sceau de guilde", 1, ref)];
    }

    entityStates[ref] = state;
  }

  return entityStates;
}

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
  const entityStates = createInitialEntityStates(actors);

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
    serverSessionId: null,
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
      speed: 5,
      willpower: 5,
      magic: 4,
      aura: 5,
      defense: 4,
      precision: 5,
      evasion: 4,
      perception: 5,
      discretion: 4,
      chance: 5,
      initiative: 5,
      charisma: 5,
      endurance: 5,
      resonance: 4,
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
      reputationTitle: null,
      shopDiscountPercent: 0,
    },
    revealedChunks: [chunkKey(startChunk.cx, startChunk.cy)],
    lastAction: "Debut de partie",
    lastNarration: "Tu arrives au camp du village central.",
    factionReputations: {
      village: 0,
      guild: 0,
      militia: 0,
      monsters: 0,
      demon_army: 0,
      wildlife: 0,
    },
    zoneReputations: {
      "1_1": 0,
      "0_1": 0,
      "2_1": 0,
      "1_2": 0,
      "2_2": 0,
    },
    incidents: [],
    bounties: [],
    followers: [],
    worldDirector: {
      actionsUntilNextEvent: 8,
      lastEventTurn: 0,
      eventCounter: 0,
    },
    recentActionSignatures: [],
    entityStates,
  };

  enforceWorldCoherence(state);
  return hydrateSoloState(state);
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

export function getPoiNodesForChunk(cx: number, cy: number): PoiNode[] {
  return POI_NODES.filter((entry) => {
    const chunk = chunkOf(entry.x, entry.y);
    return chunk.cx === cx && chunk.cy === cy;
  });
}

export function getAllPoiNodes(): PoiNode[] {
  return POI_NODES.map((entry) => ({
    ...entry,
    highlight: { ...entry.highlight },
  }));
}

export function getActorAnchors(): Array<{ actorId: string; x: number; y: number }> {
  return ACTOR_ANCHORS.map((entry) => ({ ...entry }));
}

export function getMapStructures(): MapStructure[] {
  return MAP_STRUCTURES.map((structure) => ({
    ...structure,
  }));
}

export function getPoiAnchor(
  cx: number,
  cy: number,
  poi: Exclude<PoiType, null>
): { x: number; y: number } | null {
  const found = POI_NODES.find((entry) => {
    if (entry.poi !== poi) return false;
    const chunk = chunkOf(entry.x, entry.y);
    return chunk.cx === cx && chunk.cy === cy;
  });
  if (!found) return null;
  return { x: found.anchorX, y: found.anchorY };
}

function getActorAnchor(actorId: string): ActorAnchor | null {
  return ACTOR_ANCHORS.find((entry) => entry.actorId === actorId) ?? null;
}

function applyVillageGrounding(tiles: Tile[]): void {
  paintRect(tiles, 16, 16, 16, 16, {
    terrain: "village",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 19, 21, 10, 6, {
    terrain: "road",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 17, 21, 2, 2, {
    terrain: "road",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 23, 21, 2, 2, {
    terrain: "road",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 28, 21, 2, 2, {
    terrain: "road",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 23, 25, 2, 5, {
    terrain: "road",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 19, 28, 2, 2, {
    terrain: "road",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 27, 28, 2, 2, {
    terrain: "road",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 22, 22, 4, 3, {
    terrain: "village",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 21, 27, 6, 2, {
    terrain: "village",
    blocked: false,
    destructible: false,
    prop: "none",
  });
}

function applyCanonicalGroundPatches(tiles: Tile[]): void {
  applyVillageGrounding(tiles);

  // Gate approaches need stable, clean interaction tiles.
  paintRect(tiles, 23, 39, 2, 2, {
    terrain: "road",
    blocked: false,
    destructible: false,
    prop: "none",
  });
  paintRect(tiles, 40, 40, 2, 2, {
    terrain: "boss",
    blocked: false,
    destructible: false,
    prop: "none",
  });
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
  applyCanonicalGroundPatches(tiles);

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
  addHighlandZoneProps(tiles);
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
  const actorX = (actorId: string, fallbackX: number) => getActorAnchor(actorId)?.x ?? fallbackX;
  const actorY = (actorId: string, fallbackY: number) => getActorAnchor(actorId)?.y ?? fallbackY;
  const actors: WorldActor[] = [
    {
      id: "npc_guild_master",
      name: "Maitre de Guilde",
      kind: "npc",
      x: actorX("npc_guild_master", 17),
      y: actorY("npc_guild_master", 22),
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
      faction: "guild",
      role: "maitre de guilde",
      profession: "recruteur",
      personality: "exigeant mais juste",
      loreSummary: "Chef local de la guilde, il observe les nouveaux aventuriers avec attention.",
      homeStructureId: "guild",
      workStructureId: "guild",
      recruitmentEligible: false,
      patrol: { axis: "y", range: 0.2, speed: 0.35, phase: 0.2 },
    },
    {
      id: "npc_shopkeeper",
      name: "Marchand",
      kind: "npc",
      x: actorX("npc_shopkeeper", 28),
      y: actorY("npc_shopkeeper", 22),
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
      faction: "village",
      role: "marchand",
      profession: "commercant",
      personality: "roublard mais utile",
      loreSummary: "Le marchand sait lire la tension du monde et ajuste ses affaires en consequence.",
      homeStructureId: "shop",
      workStructureId: "shop",
      recruitmentEligible: false,
      patrol: { axis: "x", range: 0.2, speed: 0.3, phase: 0.7 },
    },
    {
      id: "npc_innkeeper",
      name: "Aubergiste",
      kind: "npc",
      x: actorX("npc_innkeeper", 24),
      y: actorY("npc_innkeeper", 22),
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
      faction: "village",
      role: "aubergiste",
      profession: "tenanciere",
      personality: "chaleureuse",
      loreSummary: "Elle tient l auberge et collecte toutes les rumeurs importantes.",
      homeStructureId: "inn",
      workStructureId: "inn",
      recruitmentEligible: false,
      patrol: { axis: "x", range: 0.2, speed: 0.3, phase: 1.1 },
    },
    {
      id: "npc_villager_square_a",
      name: "Villageois",
      kind: "npc",
      x: actorX("npc_villager_square_a", 22),
      y: actorY("npc_villager_square_a", 27),
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
      faction: "village",
      role: "villageois",
      profession: "artisan",
      personality: "curieux",
      loreSummary: "Un habitant du village central, plus bavard que prudent.",
      homeStructureId: "house_south_west",
      recruitmentEligible: true,
      recruitmentMode: "contract",
      patrol: { axis: "x", range: 0.3, speed: 0.4, phase: 0.35 },
    },
    {
      id: "npc_villager_square_b",
      name: "Forgeron",
      kind: "npc",
      x: actorX("npc_villager_square_b", 27),
      y: actorY("npc_villager_square_b", 27),
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
      faction: "village",
      role: "forgeron",
      profession: "forgeron",
      personality: "bourru et loyal",
      loreSummary: "Le forgeron du village repare armes et outils contre du minerai ou de l or.",
      homeStructureId: "house_south_east",
      workStructureId: "house_south_east",
      recruitmentEligible: true,
      recruitmentMode: "contract",
      patrol: { axis: "y", range: 0.3, speed: 0.4, phase: 0.55 },
    },
    {
      id: "npc_guard_road",
      name: "Garde",
      kind: "npc",
      x: actorX("npc_guard_road", 21),
      y: actorY("npc_guard_road", 23),
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
      faction: "militia",
      role: "garde",
      profession: "milicien",
      personality: "discipline",
      loreSummary: "Le garde surveille l axe principal et reagit vite a la violence gratuite.",
      workStructureId: "guild",
      recruitmentEligible: false,
      patrol: { axis: "x", range: 0.3, speed: 0.35, phase: 1.4 },
    },
    {
      id: "npc_child_village",
      name: "Enfant",
      kind: "npc",
      x: actorX("npc_child_village", 26),
      y: actorY("npc_child_village", 26),
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
      faction: "village",
      role: "enfant",
      profession: "ecolier",
      personality: "enthousiaste",
      loreSummary: "Un enfant du village fascine par les aventuriers et les monstres.",
      homeStructureId: "house_south_west",
      recruitmentEligible: false,
      patrol: { axis: "x", range: 0.4, speed: 0.5, phase: 0.9 },
    },
    {
      id: "animal_cat_village",
      name: "Chat",
      kind: "animal",
      x: actorX("animal_cat_village", 25),
      y: actorY("animal_cat_village", 27),
      hp: 6,
      maxHp: 6,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Cat/SpriteSheet.png`,
      face: `${ANIMAL_BASE}/Cat/Faceset.png`,
      dialogue: ["Miaou."],
      faction: "wildlife",
      role: "compagnon potentiel",
      profession: "chat du village",
      personality: "insaisissable",
      loreSummary: "Le chat connait tous les recoins de la place et peut devenir un compagnon discret.",
      recruitmentEligible: true,
      recruitmentMode: "tame",
      patrol: { axis: "x", range: 0.4, speed: 0.5, phase: 0.4 },
    },
    {
      id: "animal_dog_forest",
      name: "Chien",
      kind: "animal",
      x: actorX("animal_dog_forest", 10),
      y: actorY("animal_dog_forest", 21),
      hp: 6,
      maxHp: 6,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Dog/SpriteSheet.png`,
      face: `${ANIMAL_BASE}/Dog/Faceset.png`,
      dialogue: ["Wouf."],
      faction: "wildlife",
      role: "chien errant",
      profession: "animal",
      personality: "fidele",
      loreSummary: "Un chien de foret qui peut apprendre a suivre un aventurier assez convaincant.",
      recruitmentEligible: true,
      recruitmentMode: "tame",
      patrol: { axis: "y", range: 0.4, speed: 0.45, phase: 2.2 },
    },
    {
      id: "animal_chicken_desert",
      name: "Poulet perdu",
      kind: "animal",
      x: actorX("animal_chicken_desert", 39),
      y: actorY("animal_chicken_desert", 21),
      hp: 5,
      maxHp: 5,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Chicken/SpriteSheetWhite.png`,
      face: `${ANIMAL_BASE}/Chicken/FacesetWhite.png`,
      dialogue: ["Cot cot."],
      faction: "wildlife",
      role: "volaille egaree",
      profession: "animal",
      personality: "apeure",
      loreSummary: "Le poulet s est egare loin du village et reagit a la moindre presence.",
      recruitmentEligible: true,
      recruitmentMode: "tame",
      patrol: { axis: "x", range: 0.4, speed: 0.5, phase: 1.8 },
    },
    {
      id: "animal_frog_dungeon",
      name: "Grenouille",
      kind: "animal",
      x: actorX("animal_frog_dungeon", 22),
      y: actorY("animal_frog_dungeon", 36),
      hp: 4,
      maxHp: 4,
      hostile: false,
      alive: true,
      sprite: `${ANIMAL_BASE}/Frog/SpriteSheet.png`,
      face: `${ANIMAL_BASE}/Frog/Faceset.png`,
      dialogue: ["Croaa."],
      faction: "wildlife",
      role: "grenouille cavernicole",
      profession: "animal",
      personality: "placide",
      loreSummary: "Une grenouille qui survit dans l humidite du donjon oublie.",
      recruitmentEligible: true,
      recruitmentMode: "tame",
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
      faction: template.kind === "boss" ? "demon_army" : "monsters",
      role: template.kind === "boss" ? "seigneur demon" : "predateur",
      profession: template.kind === "boss" ? "souverain infernal" : "maraudeur",
      personality: template.kind === "boss" ? "tyrannique" : "agressif",
      loreSummary: template.kind === "boss" ? "Le coeur de la menace qui pese sur le monde." : "Une menace hostile liee au chaos de la region.",
      recruitmentEligible: template.kind !== "boss",
      recruitmentMode: "persuade",
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
  const current = tiles[index];
  const persistentScarProps = new Set<TileProp>(["hole", "crater", "charred", "rubble"]);
  const preserveGroundScar =
    current &&
    persistentScarProps.has(current.prop) &&
    patch.prop === "none" &&
    patch.blocked !== true &&
    patch.terrain !== "water";
  tiles[index] = {
    ...current,
    ...patch,
    prop: preserveGroundScar ? current.prop : patch.prop ?? current.prop,
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
    [7, 2], [14, 4],
    [6, 9], [13, 8],
    [7, 18], [13, 19],
    [6, 29], [14, 29],
    [9, 34], [14, 37],
    [6, 41], [13, 42],
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

function addHighlandZoneProps(tiles: Tile[]): void {
  const highlandStumps: Array<[number, number]> = [
    [19, 4],
    [22, 6],
    [28, 5],
    [30, 8],
    [27, 12],
  ];
  highlandStumps.forEach(([x, y]) => placeProp(tiles, x, y, "stump", true));

  const highlandRocks: Array<[number, number]> = [
    [18, 10],
    [29, 14],
    [31, 9],
  ];
  highlandRocks.forEach(([x, y]) => placeProp(tiles, x, y, "rock", true));
}

function addDesertZoneProps(tiles: Tile[]): void {
  const desertCactus: Array<[number, number]> = [
    [33, 7], [35, 9], [38, 10], [42, 8], [44, 10],
    [35, 13], [39, 13], [43, 12],
  ];
  desertCactus.forEach(([x, y]) => placeProp(tiles, x, y, "cactus", true));

  const desertRocks: Array<[number, number]> = [
    [34, 18],
    [37, 19],
    [41, 18],
    [44, 20],
    [35, 35],
    [41, 36],
  ];
  desertRocks.forEach(([x, y]) => placeProp(tiles, x, y, "rock", true));
}

function addDungeonZoneProps(tiles: Tile[]): void {
  const stoneDebris: Array<[number, number]> = [
    [22, 35],
    [24, 37],
    [27, 34],
    [26, 43],
    [42, 39],
  ];
  stoneDebris.forEach(([x, y]) => placeProp(tiles, x, y, "rock", true));

  const crates: Array<[number, number]> = [
    [34, 34],
    [36, 35],
    [40, 34],
    [42, 36],
    [37, 42],
    [44, 43],
    [39, 40],
  ];
  crates.forEach(([x, y]) => placeProp(tiles, x, y, "crate", true));
}

function applyDecorCollisionFootprints(tiles: Tile[]): void {
  const solidKinds = new Set<SceneDecorKind>([
    "house_a",
    "house_b",
    "house_c",
    "house_d",
    "forest_grove_a",
    "forest_grove_b",
    "ruin_a",
    "ruin_b",
    "stone_cluster",
    "citadel_tower",
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
      terrain: pathTile.terrain,
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
    const anchor = getActorAnchor(actor.id);
    if (anchor) {
      const anchorTile = state.tiles[idxOf(anchor.x, anchor.y)];
      const anchorKey = `${anchor.x},${anchor.y}`;
      if (isWalkableTile(anchorTile) && !occupied.has(anchorKey)) {
        actor.x = anchor.x;
        actor.y = anchor.y;
        occupied.add(anchorKey);
        continue;
      }
    }

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

      if (
        tile.poi !== null &&
        nextProp !== "none" &&
        nextProp !== "hole" &&
        nextProp !== "crater" &&
        nextProp !== "charred" &&
        nextProp !== "rubble"
      ) {
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
      } else if (nextProp === "hole" || nextProp === "crater" || nextProp === "charred" || nextProp === "rubble") {
        if (tile.terrain === "water") nextProp = "none";
      }

      if (nextProp !== tile.prop) {
        const persistentGroundScar =
          nextProp === "hole" || nextProp === "crater" || nextProp === "charred" || nextProp === "rubble";
        tiles[index] = {
          ...tile,
          prop: nextProp,
          blocked: nextProp === "none" ? tile.blocked : persistentGroundScar ? false : true,
          destructible: nextProp === "none" ? false : persistentGroundScar ? false : tile.destructible || true,
        };
      }
    }
  }
}

export function enforceWorldCoherence(state: SoloGameState): void {
  if (!Array.isArray(state.tiles) || state.tiles.length !== WORLD_WIDTH * WORLD_HEIGHT) return;

  applyCanonicalGroundPatches(state.tiles);

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
      terrain: getTile(state, poi.x, poi.y)?.terrain ?? "road",
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
