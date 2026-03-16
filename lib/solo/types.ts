export const CHUNK_SIZE = 16;
export const WORLD_WIDTH = 48;
export const WORLD_HEIGHT = 48;
export const WORLD_SCREENS_X = WORLD_WIDTH / CHUNK_SIZE;
export const WORLD_SCREENS_Y = WORLD_HEIGHT / CHUNK_SIZE;

export type TerrainType =
  | "grass"
  | "forest"
  | "desert"
  | "village"
  | "road"
  | "water"
  | "stone"
  | "dungeon"
  | "boss";

export type PoiType = "camp" | "guild" | "shop" | "inn" | "house" | "dungeon_gate" | "boss_gate" | null;

export type TileProp = "none" | "tree" | "stump" | "rock" | "cactus" | "palm" | "ruin" | "crate";

export type RankTier = "C" | "B" | "A" | "S";

export type Tile = {
  terrain: TerrainType;
  blocked: boolean;
  destructible: boolean;
  poi: PoiType;
  prop: TileProp;
};

export type ActorKind = "npc" | "animal" | "monster" | "boss";

export type PatrolPath = {
  axis: "x" | "y";
  range: number;
  speed: number;
  phase: number;
};

export type WorldActor = {
  id: string;
  name: string;
  kind: ActorKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  hostile: boolean;
  alive: boolean;
  sprite: string;
  face: string;
  dialogue: string[];
  patrol?: PatrolPath;
};

export type InventoryItem = {
  id: string;
  itemId: string | null;
  name: string;
  qty: number;
  icon: string;
  sprite: string | null;
  emoji: string;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  rank: RankTier;
  done: boolean;
  progress: number;
  target: number;
  rewardGold: number;
};

export type PlayerState = {
  name: string;
  characterId: string;
  characterIdle: string;
  characterWalk: string;
  characterFace: string;
  hp: number;
  maxHp: number;
  lives: number;
  maxLives: number;
  gold: number;
  strength: number;
  stress: number;
  x: number;
  y: number;
  powerText: string;
  powerRoll: number;
  powerAccepted: boolean;
  objective: string;
  rank: RankTier;
  equippedItemId: string | null;
  equippedItemName: string | null;
  equippedItemSprite: string | null;
  inventory: InventoryItem[];
};

export type SoloGameState = {
  status: "playing" | "defeat" | "victory";
  turn: number;
  worldWidth: number;
  worldHeight: number;
  tiles: Tile[];
  actors: WorldActor[];
  quests: Quest[];
  log: string[];
  player: PlayerState;
  revealedChunks: string[];
  lastAction: string;
  lastNarration: string;
};

export type SoloActionContext = {
  turn: number;
  playerName: string;
  rank: RankTier;
  hp: number;
  maxHp: number;
  lives: number;
  gold: number;
  strength: number;
  stress: number;
  powerText: string;
  powerRoll: number;
  powerAccepted: boolean;
  objective: string;
  position: { x: number; y: number };
  chunk: { x: number; y: number };
  terrain: TerrainType;
  poi: PoiType;
  nearbyPois: string[];
  nearActors: Array<{
    id: string;
    name: string;
    kind: ActorKind;
    hostile: boolean;
    hp: number;
    strength: number;
    combat: number;
    stress: number;
    distance: number;
  }>;
  quests: Array<{ id: string; title: string; done: boolean; progress: number; target: number }>;
  inventory: Array<{ id: string; name: string; qty: number }>;
  recentLog: string[];
};

export type TerrainChange = {
  dx: number;
  dy: number;
  terrain: TerrainType;
  blocked?: boolean;
  destructible?: boolean;
  poi?: PoiType;
  prop?: TileProp;
};

export type SpawnActor = {
  name: string;
  kind: ActorKind;
  hp: number;
  hostile: boolean;
  dx: number;
  dy: number;
  sprite: string;
  face: string;
};

export type SoloOutcome = {
  narrative: string;
  storyLine?: string;
  diceRoll: number | null;
  moveBy?: { dx: number; dy: number } | null;
  moveToPoi?: Exclude<PoiType, null> | null;
  moveToPoiSteps?: number;
  approachNearestHostile?: boolean;
  damageSelf?: number;
  healSelf?: number;
  stressDelta?: number;
  strengthDelta?: number;
  goldDelta?: number;
  requestQuest?: boolean;
  buyItemName?: string | null;
  addItemName?: string | null;
  destroyTarget?: { dx: number; dy: number } | null;
  attackNearestHostile?: boolean;
  attackPower?: number;
  talkToNearestNpc?: boolean;
  npcSpeech?: string | null;
  terrainChanges?: TerrainChange[];
  spawnActors?: SpawnActor[];
  worldEvent?: string | null;
  objectivePatch?: string | null;
  completeObjective?: boolean;
};

export type SoloResolveRequest = {
  actionText: string;
  context: SoloActionContext;
};
