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

export type TileProp =
  | "none"
  | "tree"
  | "stump"
  | "rock"
  | "cactus"
  | "palm"
  | "ruin"
  | "crate"
  | "hole"
  | "crater"
  | "charred"
  | "rubble";

export type RankTier = "C" | "B" | "A" | "S";

export type WorldPoint = {
  x: number;
  y: number;
};

export type Tile = {
  terrain: TerrainType;
  blocked: boolean;
  destructible: boolean;
  poi: PoiType;
  prop: TileProp;
};

export type ActorKind = "npc" | "animal" | "monster" | "boss";

export type WorldEntityKind = "actor" | "structure" | "poi" | "prop" | "tile" | "edge";

export type WorldEntityRef = string;

export type InteractionMode =
  | "move"
  | "talk"
  | "interact"
  | "inspect"
  | "attack"
  | "recruit"
  | "context";

export type FollowerOrder = "follow" | "hold" | "guard" | "attack";

export type RecruitmentMode = "persuade" | "contract" | "tame";

export type SpeechBubbleKind = "speech" | "thought" | "action" | "system";

export type SpeechBubbleEvent = {
  id?: string;
  sourceRef: WorldEntityRef;
  speaker?: string | null;
  text: string;
  kind?: SpeechBubbleKind;
  ttlMs?: number;
};

export type ReputationMap = Record<string, number>;

export type SocialIncidentType = "crime" | "heroic" | "quest" | "recruitment" | "world_event";

export type SocialIncident = {
  id: string;
  type: SocialIncidentType;
  faction: string;
  zone: string;
  actorId?: string | null;
  summary: string;
  severity: number;
  createdTurn: number;
  expiresAfterTurn?: number | null;
  permanent?: boolean;
};

export type ActiveBounty = {
  id: string;
  faction: string;
  zone: string;
  reason: string;
  level: number;
  active: boolean;
  createdTurn: number;
};

export type FollowerState = {
  actorId: string;
  role: string;
  loyalty: number;
  morale: number;
  order: FollowerOrder;
  recruitedTurn: number;
};

export type WorldEventDirectorState = {
  actionsUntilNextEvent: number;
  lastEventTurn: number;
  eventCounter: number;
};

export type PlayerInteractionRequest = {
  type: InteractionMode;
  actionText?: string;
  targetRef?: WorldEntityRef | null;
  primaryTargetRef?: WorldEntityRef | null;
  secondaryTargetRef?: WorldEntityRef | null;
  targetTile?: WorldPoint | null;
  previewPath?: WorldPoint[] | null;
  desiredItemName?: string | null;
  instrumentItemId?: string | null;
  stance?: "neutral" | "friendly" | "hostile" | "furtive";
  freeText?: string;
  source?: "keyboard" | "mouse" | "text";
  repeatSignature?: string | null;
  showContextMenu?: boolean;
  askInfo?: boolean;
};

export type InteractionTargetInfo = {
  ref: WorldEntityRef;
  kind: WorldEntityKind;
  name: string;
  x: number;
  y: number;
  distance: number;
  ownerRef?: WorldEntityRef | null;
  visibleItems?: string[];
  equippedItems?: string[];
  accessPolicy?: EntityAccessPolicy | null;
  faction?: string | null;
};

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
  role?: string;
  profession?: string;
  faction?: string;
  personality?: string;
  loreSummary?: string;
  mood?: string;
  disposition?: string;
  homeStructureId?: string | null;
  workStructureId?: string | null;
  strength?: number;
  speed?: number;
  willpower?: number;
  magic?: number;
  aura?: number;
  defense?: number;
  precision?: number;
  evasion?: number;
  perception?: number;
  discretion?: number;
  chance?: number;
  initiative?: number;
  charisma?: number;
  endurance?: number;
  resonance?: number;
  combatLevel?: number;
  stress?: number;
  morale?: number;
  loyalty?: number;
  obedience?: number;
  bravery?: number;
  alertness?: number;
  aggroRange?: number;
  sightRange?: number;
  hearingRange?: number;
  recruitmentEligible?: boolean;
  recruitmentMode?: RecruitmentMode;
  leaderId?: string | null;
  followerOrder?: FollowerOrder | null;
  memoryTags?: string[];
  persistentHostile?: boolean;
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

export type EquipmentSlot =
  | "weapon"
  | "offhand"
  | "head"
  | "body"
  | "accessory"
  | "tool";

export type EntityInventoryItem = InventoryItem & {
  ownerRef?: WorldEntityRef | null;
  equippedSlot?: EquipmentSlot | null;
  tags?: string[];
};

export type EntityAccessPolicy = {
  locked?: boolean;
  sealed?: boolean;
  requiresKeyItemId?: string | null;
  crimeFaction?: string | null;
  crimeZone?: string | null;
  theftSeverity?: number;
};

export type WorldEntityState = {
  ref: WorldEntityRef;
  ownerRef?: WorldEntityRef | null;
  faction?: string | null;
  inventory: EntityInventoryItem[];
  equipment: Partial<Record<EquipmentSlot, string>>;
  tags: string[];
  states: string[];
  witnessRange?: number;
  accessPolicy?: EntityAccessPolicy | null;
};

export type ActionVerb =
  | "move"
  | "talk"
  | "inspect"
  | "attack"
  | "recruit"
  | "bribe"
  | "disarm"
  | "threaten"
  | "block"
  | "trap"
  | "buy"
  | "sell"
  | "negotiate"
  | "steal"
  | "loot"
  | "take"
  | "open"
  | "burn"
  | "destroy"
  | "dig"
  | "use"
  | "rest"
  | "unknown";

export type ActionDraft = {
  verb: ActionVerb;
  primaryTargetRef?: WorldEntityRef | null;
  secondaryTargetRef?: WorldEntityRef | null;
  desiredItemName?: string | null;
  instrumentItemId?: string | null;
  stance?: "neutral" | "friendly" | "hostile" | "furtive";
  requiresApproach?: boolean;
  freeText: string;
};

export type WorldOp =
  | {
      type: "move_path";
      path: WorldPoint[];
      targetRef?: WorldEntityRef | null;
    }
  | {
      type: "transfer_item";
      fromRef?: WorldEntityRef | null;
      toRef: WorldEntityRef;
      itemName: string;
      qty: number;
      createIfMissing?: boolean;
    }
  | {
      type: "adjust_player_gold";
      delta: number;
      reason?: string | null;
    }
  | {
      type: "set_shop_discount";
      targetRef: WorldEntityRef;
      percent: number;
    }
  | {
      type: "record_incident";
      incident: Omit<SocialIncident, "id" | "createdTurn"> & { id?: string; createdTurn?: number };
    }
  | {
      type: "add_speech_bubble";
      bubble: SpeechBubbleEvent;
    }
  | {
      type: "set_entity_state";
      ref: WorldEntityRef;
      tags?: string[];
      states?: string[];
    };

export type ResolutionPlan = {
  draft: ActionDraft;
  worldOps: WorldOp[];
  narrative: string;
  storyLine?: string;
  diceRoll: number | null;
  npcSpeech?: string | null;
  compatOutcome?: Partial<SoloOutcome>;
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
  speed: number;
  willpower: number;
  magic: number;
  aura: number;
  defense: number;
  precision: number;
  evasion: number;
  perception: number;
  discretion: number;
  chance: number;
  initiative: number;
  charisma: number;
  endurance: number;
  resonance: number;
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
  reputationTitle?: string | null;
  shopDiscountPercent?: number;
};

export type SoloGameState = {
  serverSessionId?: string | null;
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
  factionReputations: ReputationMap;
  zoneReputations: ReputationMap;
  incidents: SocialIncident[];
  bounties: ActiveBounty[];
  followers: FollowerState[];
  worldDirector: WorldEventDirectorState;
  recentActionSignatures: string[];
  entityStates: Record<WorldEntityRef, WorldEntityState>;
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
  speed: number;
  willpower: number;
  magic: number;
  aura: number;
  defense: number;
  precision: number;
  evasion: number;
  perception: number;
  discretion: number;
  chance: number;
  initiative: number;
  charisma: number;
  endurance: number;
  resonance: number;
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
  target?: InteractionTargetInfo | null;
  factionReputations: ReputationMap;
  zoneReputations: ReputationMap;
  followers: FollowerState[];
  recentActionSignatures: string[];
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
  faction?: string;
  role?: string;
  profession?: string;
  personality?: string;
  loreSummary?: string;
  recruitmentEligible?: boolean;
  recruitmentMode?: RecruitmentMode;
  strength?: number;
  speed?: number;
  willpower?: number;
  magic?: number;
  aura?: number;
  defense?: number;
  precision?: number;
  evasion?: number;
  perception?: number;
  discretion?: number;
  chance?: number;
  initiative?: number;
  charisma?: number;
  endurance?: number;
  resonance?: number;
  combatLevel?: number;
};

export type SoloOutcome = {
  narrative: string;
  storyLine?: string;
  diceRoll: number | null;
  actionDraft?: ActionDraft | null;
  worldOps?: WorldOp[] | null;
  targetRef?: WorldEntityRef | null;
  targetTile?: WorldPoint | null;
  movePath?: WorldPoint[] | null;
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
  sellItemName?: string | null;
  sellItemQty?: number | null;
  setShopDiscountPercent?: number | null;
  addItemName?: string | null;
  destroyTarget?: { dx: number; dy: number } | null;
  attackNearestHostile?: boolean;
  attackActorId?: string | null;
  attackPower?: number;
  talkToNearestNpc?: boolean;
  talkToActorId?: string | null;
  npcSpeech?: string | null;
  recruitActorId?: string | null;
  recruitMode?: RecruitmentMode | null;
  terrainChanges?: TerrainChange[];
  spawnActors?: SpawnActor[];
  speechBubbles?: SpeechBubbleEvent[];
  factionReputationDelta?: ReputationMap;
  zoneReputationDelta?: ReputationMap;
  recordIncidents?: Array<Omit<SocialIncident, "id" | "createdTurn"> & { id?: string; createdTurn?: number }>;
  setFollowerOrder?: { actorId: string; order: FollowerOrder } | null;
  worldEvent?: string | null;
  objectivePatch?: string | null;
  completeObjective?: boolean;
};

export type SoloResolveRequest = {
  actionText: string;
  context: SoloActionContext;
  interaction?: PlayerInteractionRequest | null;
  state?: SoloGameState;
};
