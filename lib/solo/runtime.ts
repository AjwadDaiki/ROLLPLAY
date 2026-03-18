import { CONFIG } from "./config";
import type {
  ActiveBounty,
  EntityInventoryItem,
  FollowerOrder,
  FollowerState,
  PlayerInteractionRequest,
  PlayerState,
  ReputationMap,
  SoloGameState,
  SocialIncident,
  WorldActor,
  WorldEntityRef,
  WorldEntityState,
  WorldEventDirectorState,
} from "./types";

const DEFAULT_PLAYER_POSITION = CONFIG.player.respawnPosition;

function withReputationDefaults(input?: ReputationMap): ReputationMap {
  return {
    village: 0,
    guild: 0,
    militia: 0,
    monsters: 0,
    demon_army: 0,
    wildlife: 0,
    ...(input ?? {}),
  };
}

function createDefaultWorldDirector(): WorldEventDirectorState {
  return {
    actionsUntilNextEvent: CONFIG.worldEvents.initialCountdown,
    lastEventTurn: 0,
    eventCounter: 0,
  };
}

export function normalizeActionText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildRepeatSignature(actionText: string, interaction?: PlayerInteractionRequest | null): string {
  const normalizedText = normalizeActionText(actionText);
  const target =
    interaction?.primaryTargetRef ??
    interaction?.targetRef ??
    (interaction?.targetTile ? `${interaction.targetTile.x},${interaction.targetTile.y}` : "");
  const type = interaction?.type ?? "text";
  return `${type}|${target}|${normalizedText}`.slice(0, 180);
}

export function pushRecentActionSignature(
  recent: string[],
  signature: string,
  maxEntries = 12
): string[] {
  const trimmed = signature.trim();
  if (!trimmed) return recent.slice(-maxEntries);
  return [...recent.filter((entry) => entry !== trimmed), trimmed].slice(-maxEntries);
}

export function isActionRecentlyRepeated(recent: string[], signature: string, lookback = 4): boolean {
  const trimmed = signature.trim();
  if (!trimmed) return false;
  return recent.slice(-lookback).includes(trimmed);
}

export function hydrateWorldActor(actor: WorldActor): WorldActor {
  const faction =
    actor.faction ??
    (actor.kind === "npc"
      ? "village"
      : actor.kind === "animal"
        ? "wildlife"
        : actor.kind === "boss"
          ? "demon_army"
          : "monsters");

  const combatLevel =
    actor.combatLevel ??
    Math.max(1, Math.floor(actor.maxHp / 4) + (actor.kind === "boss" ? 8 : actor.kind === "monster" ? 4 : 2));

  const strength = actor.strength ?? Math.max(1, Math.round(actor.maxHp / 2 + 4));
  const speed = actor.speed ?? (actor.kind === "animal" ? 8 : actor.kind === "monster" ? 6 : 5);
  const willpower = actor.willpower ?? (actor.kind === "boss" ? 12 : actor.kind === "monster" ? 7 : 5);
  const magic = actor.magic ?? (actor.kind === "boss" ? 12 : actor.kind === "monster" ? 4 : 2);
  const aura = actor.aura ?? (actor.kind === "boss" ? 12 : actor.kind === "monster" ? 5 : 3);
  const defense = actor.defense ?? Math.max(1, Math.floor(actor.maxHp / 3));
  const precision = actor.precision ?? Math.max(1, 4 + combatLevel);
  const evasion = actor.evasion ?? Math.max(1, 3 + Math.floor(speed / 2));
  const perception = actor.perception ?? Math.max(2, 4 + (actor.kind === "monster" || actor.kind === "boss" ? 2 : 0));
  const discretion = actor.discretion ?? (actor.kind === "animal" ? 7 : 3);
  const chance = actor.chance ?? 4;
  const initiative = actor.initiative ?? Math.max(1, speed + Math.floor(combatLevel / 2));
  const charisma = actor.charisma ?? (actor.kind === "npc" ? 6 : 2);
  const endurance = actor.endurance ?? Math.max(1, Math.floor(actor.maxHp / 2));
  const resonance = actor.resonance ?? Math.max(1, Math.floor((magic + aura) / 2));
  const mood = actor.mood ?? (actor.hostile ? "hostile" : "calm");
  const disposition = actor.disposition ?? (actor.hostile ? "hostile" : "neutral");
  const recruitmentEligible =
    typeof actor.recruitmentEligible === "boolean"
      ? actor.recruitmentEligible
      : actor.kind === "animal" || actor.kind === "monster";

  return {
    ...actor,
    faction,
    role: actor.role ?? (actor.kind === "npc" ? "habitants" : actor.kind),
    profession: actor.profession ?? actor.role ?? (actor.kind === "npc" ? "habitants" : actor.kind),
    personality: actor.personality ?? (actor.kind === "boss" ? "imperieux" : actor.kind === "monster" ? "agressif" : "prudent"),
    loreSummary: actor.loreSummary ?? `${actor.name} appartient au monde d Oracle20.`,
    mood,
    disposition,
    homeStructureId: typeof actor.homeStructureId === "undefined" ? null : actor.homeStructureId,
    workStructureId: typeof actor.workStructureId === "undefined" ? null : actor.workStructureId,
    strength,
    speed,
    willpower,
    magic,
    aura,
    defense,
    precision,
    evasion,
    perception,
    discretion,
    chance,
    initiative,
    charisma,
    endurance,
    resonance,
    combatLevel,
    stress: actor.stress ?? 12,
    morale: actor.morale ?? (actor.hostile ? 56 : 68),
    loyalty: actor.loyalty ?? (actor.hostile ? 12 : 44),
    obedience: actor.obedience ?? (actor.kind === "animal" ? 35 : 42),
    bravery: actor.bravery ?? (actor.hostile ? 55 : 38),
    alertness: actor.alertness ?? (actor.hostile ? 60 : 34),
    aggroRange: actor.aggroRange ?? (actor.hostile ? (actor.kind === "boss" ? 8 : 5) : 0),
    sightRange: actor.sightRange ?? (actor.kind === "boss" ? 8 : actor.kind === "monster" ? 6 : 4),
    hearingRange: actor.hearingRange ?? (actor.kind === "boss" ? 7 : actor.kind === "monster" ? 5 : 3),
    recruitmentEligible,
    recruitmentMode: actor.recruitmentMode ?? (actor.kind === "animal" ? "tame" : actor.kind === "monster" ? "persuade" : "contract"),
    leaderId: typeof actor.leaderId === "undefined" ? null : actor.leaderId,
    followerOrder: typeof actor.followerOrder === "undefined" ? null : actor.followerOrder,
    memoryTags: actor.memoryTags ?? [],
    persistentHostile: actor.persistentHostile ?? actor.kind === "boss",
  };
}

export function hydratePlayerState(player: PlayerState): PlayerState {
  return {
    ...player,
    speed: player.speed ?? CONFIG.player.startSpeed,
    willpower: player.willpower ?? CONFIG.player.startWillpower,
    magic: player.magic ?? CONFIG.player.startMagic,
    aura: player.aura ?? CONFIG.player.startAura,
    defense: player.defense ?? CONFIG.player.startDefense,
    precision: player.precision ?? CONFIG.player.startPrecision,
    evasion: player.evasion ?? CONFIG.player.startEvasion,
    perception: player.perception ?? CONFIG.player.startPerception,
    discretion: player.discretion ?? CONFIG.player.startDiscretion,
    chance: player.chance ?? CONFIG.player.startChance,
    initiative: player.initiative ?? CONFIG.player.startInitiative,
    charisma: player.charisma ?? CONFIG.player.startCharisma,
    endurance: player.endurance ?? CONFIG.player.startEndurance,
    resonance: player.resonance ?? CONFIG.player.startResonance,
    shopDiscountPercent: clampPercent(player.shopDiscountPercent),
    x: Number.isFinite(player.x) ? player.x : DEFAULT_PLAYER_POSITION.x,
    y: Number.isFinite(player.y) ? player.y : DEFAULT_PLAYER_POSITION.y,
    reputationTitle: typeof player.reputationTitle === "undefined" ? null : player.reputationTitle,
  };
}

function hydrateIncidents(incidents?: SocialIncident[]): SocialIncident[] {
  if (!Array.isArray(incidents)) return [];
  return incidents
    .filter((entry) => entry && typeof entry.summary === "string")
    .map((entry, index) => ({
      ...entry,
      id: entry.id || `incident_${index}_${entry.type}`,
      actorId: typeof entry.actorId === "undefined" ? null : entry.actorId,
      severity: Number.isFinite(entry.severity) ? entry.severity : 1,
      createdTurn: Number.isFinite(entry.createdTurn) ? entry.createdTurn : 0,
    }));
}

function hydrateBounties(bounties?: ActiveBounty[]): ActiveBounty[] {
  if (!Array.isArray(bounties)) return [];
  return bounties
    .filter((entry) => entry && typeof entry.faction === "string")
    .map((entry, index) => ({
      ...entry,
      id: entry.id || `bounty_${index}_${entry.faction}`,
      zone: entry.zone || "village",
      reason: entry.reason || "Incident non precise",
      level: Number.isFinite(entry.level) ? entry.level : 1,
      active: typeof entry.active === "boolean" ? entry.active : true,
      createdTurn: Number.isFinite(entry.createdTurn) ? entry.createdTurn : 0,
    }));
}

function hydrateFollowers(followers?: FollowerState[]): FollowerState[] {
  if (!Array.isArray(followers)) return [];
  return followers
    .filter((entry) => entry && typeof entry.actorId === "string")
    .map((entry) => ({
      actorId: entry.actorId,
      role: entry.role || "compagnon",
      loyalty: Number.isFinite(entry.loyalty) ? entry.loyalty : 50,
      morale: Number.isFinite(entry.morale) ? entry.morale : 50,
      order: (entry.order ?? "follow") as FollowerOrder,
      recruitedTurn: Number.isFinite(entry.recruitedTurn) ? entry.recruitedTurn : 0,
    }));
}

function hydrateEntityInventory(items?: EntityInventoryItem[]): EntityInventoryItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((entry) => entry && typeof entry.name === "string")
    .map((entry) => ({
      ...entry,
      itemId: typeof entry.itemId === "undefined" ? null : entry.itemId,
      ownerRef: typeof entry.ownerRef === "undefined" ? null : entry.ownerRef,
      equippedSlot: typeof entry.equippedSlot === "undefined" ? null : entry.equippedSlot,
      tags: Array.isArray(entry.tags) ? entry.tags.filter((tag): tag is string => typeof tag === "string") : [],
    }));
}

function hydrateEntityStates(
  states: Record<WorldEntityRef, WorldEntityState> | undefined,
  actors: WorldActor[]
): Record<WorldEntityRef, WorldEntityState> {
  const next: Record<WorldEntityRef, WorldEntityState> = {};
  const entries = states ? Object.entries(states) : [];
  for (const [ref, entry] of entries) {
    if (!entry || typeof ref !== "string") continue;
    next[ref] = {
      ref,
      ownerRef: typeof entry.ownerRef === "undefined" ? null : entry.ownerRef,
      faction: typeof entry.faction === "undefined" ? null : entry.faction,
      inventory: hydrateEntityInventory(entry.inventory),
      equipment: entry.equipment ? { ...entry.equipment } : {},
      tags: Array.isArray(entry.tags) ? entry.tags.filter((tag): tag is string => typeof tag === "string") : [],
      states: Array.isArray(entry.states) ? entry.states.filter((tag): tag is string => typeof tag === "string") : [],
      witnessRange: Number.isFinite(entry.witnessRange) ? entry.witnessRange : undefined,
      accessPolicy: entry.accessPolicy
        ? {
            ...entry.accessPolicy,
            requiresKeyItemId:
              typeof entry.accessPolicy.requiresKeyItemId === "undefined" ? null : entry.accessPolicy.requiresKeyItemId,
          }
        : null,
    };
  }

  for (const actor of actors) {
    const ref = `actor:${actor.id}`;
    if (next[ref]) continue;
    next[ref] = {
      ref,
      ownerRef: null,
      faction: actor.faction ?? null,
      inventory: [],
      equipment: {},
      tags: [actor.kind],
      states: actor.alive ? ["alive"] : ["dead"],
      witnessRange: actor.kind === "npc" ? 5 : actor.kind === "boss" ? 8 : 3,
      accessPolicy: null,
    };
  }

  return next;
}

export function hydrateSoloState(state: SoloGameState): SoloGameState {
  const actors = Array.isArray(state.actors) ? state.actors.map((actor) => hydrateWorldActor(actor)) : [];
  return {
    ...state,
    serverSessionId: typeof state.serverSessionId === "undefined" ? null : state.serverSessionId,
    player: hydratePlayerState(state.player),
    actors,
    factionReputations: withReputationDefaults(state.factionReputations),
    zoneReputations: withReputationDefaults(state.zoneReputations),
    incidents: hydrateIncidents(state.incidents),
    bounties: hydrateBounties(state.bounties),
    followers: hydrateFollowers(state.followers),
    worldDirector: state.worldDirector ? { ...createDefaultWorldDirector(), ...state.worldDirector } : createDefaultWorldDirector(),
    recentActionSignatures: Array.isArray(state.recentActionSignatures)
      ? state.recentActionSignatures.filter((entry): entry is string => typeof entry === "string").slice(-12)
      : [],
    entityStates: hydrateEntityStates(state.entityStates, actors),
  };
}

export function isSoloState(value: unknown): value is SoloGameState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!v.player || typeof v.player !== "object") return false;
  if (!Array.isArray(v.tiles) || !Array.isArray(v.actors) || !Array.isArray(v.log)) return false;
  return true;
}

function clampPercent(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(CONFIG.shop.maxDiscountPercent, Math.round(value ?? 0)));
}
