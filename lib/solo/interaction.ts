import type {
  InteractionMode,
  PoiType,
  SoloGameState,
  TerrainType,
  Tile,
  TileProp,
  WorldActor,
  WorldEntityKind,
  WorldEntityRef,
  WorldPoint,
} from "./types";
import { CHUNK_SIZE, WORLD_SCREENS_X, WORLD_SCREENS_Y } from "./types";
import { getMapStructures, getTile, idxOf, inBounds, screenLabel } from "./world";

export type WorldEntity = {
  ref: WorldEntityRef;
  kind: WorldEntityKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocked: boolean;
  terrain?: TerrainType;
  prop?: TileProp;
  poi?: Exclude<PoiType, null> | null;
  actorId?: string;
  structureId?: string;
  faction?: string;
  modes: InteractionMode[];
  description: string;
  infoLines: string[];
};

type ParsedRef = {
  kind: WorldEntityKind;
  id: string;
};

type PathNode = WorldPoint & {
  key: string;
};

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

function parseRef(ref: WorldEntityRef): ParsedRef | null {
  const divider = ref.indexOf(":");
  if (divider <= 0) return null;
  const kind = ref.slice(0, divider) as WorldEntityKind;
  const id = ref.slice(divider + 1);
  if (!id) return null;
  return { kind, id };
}

export function actorEntityRef(actorId: string): WorldEntityRef {
  return `actor:${actorId}`;
}

export function structureEntityRef(structureId: string): WorldEntityRef {
  return `structure:${structureId}`;
}

export function tileEntityRef(x: number, y: number): WorldEntityRef {
  return `tile:${x},${y}`;
}

export function edgeEntityRef(direction: "north" | "south" | "east" | "west", cx: number, cy: number): WorldEntityRef {
  return `edge:${direction}:${cx},${cy}`;
}

function buildActorEntity(actor: WorldActor): WorldEntity {
  const modes: InteractionMode[] = ["inspect", "context"];
  if (actor.kind === "npc" || actor.kind === "animal") {
    modes.push("talk");
  }
  if (actor.hostile) {
    modes.push("attack");
  }
  if (actor.recruitmentEligible) {
    modes.push("recruit");
  }
  return {
    ref: actorEntityRef(actor.id),
    kind: "actor",
    name: actor.name,
    x: actor.x,
    y: actor.y,
    width: 1,
    height: 1,
    blocked: actor.alive,
    actorId: actor.id,
    faction: actor.faction,
    modes,
    description: actor.loreSummary ?? `${actor.name} se tient ici.`,
    infoLines: [
      `Type: ${actor.kind}`,
      `Faction: ${actor.faction ?? "independante"}`,
      `Role: ${actor.role ?? actor.profession ?? "inconnu"}`,
      `Personnalite: ${actor.personality ?? "reservee"}`,
      `Humeur: ${actor.mood ?? "calme"}`,
      `PV: ${actor.hp}/${actor.maxHp}`,
      actor.recruitmentEligible ? `Recrutable: ${actor.recruitmentMode ?? "persuade"}` : "Recrutable: non",
    ],
  };
}

function buildStructureEntity(
  structure: ReturnType<typeof getMapStructures>[number]
): WorldEntity {
  const name = structure.label || structure.id.replace(/_/g, " ");
  return {
    ref: structureEntityRef(structure.id),
    kind: "structure",
    name,
    x: structure.serviceX ?? structure.x,
    y: structure.serviceY ?? structure.y,
    width: structure.w,
    height: structure.h,
    blocked: true,
    structureId: structure.id,
    poi: structure.poi,
    terrain: structure.biome,
    modes: ["inspect", "interact", "context"],
    description: structure.poi
      ? `${name} sert de point d interaction pour ${structure.poi}.`
      : `${name} marque le paysage.`,
    infoLines: [
      `Categorie: ${structure.category}`,
      `Biome: ${structure.biome}`,
      structure.poi ? `POI: ${structure.poi}` : "POI: aucun",
      `Ancre: ${structure.anchorX.toFixed(1)}, ${structure.anchorY.toFixed(1)}`,
    ],
  };
}

function terrainName(terrain: TerrainType): string {
  if (terrain === "forest") return "Foret";
  if (terrain === "desert") return "Desert";
  if (terrain === "village") return "Village";
  if (terrain === "road") return "Route";
  if (terrain === "water") return "Eau";
  if (terrain === "stone") return "Pierre";
  if (terrain === "dungeon") return "Donjon";
  if (terrain === "boss") return "Citadelle";
  return "Plaine";
}

function propName(prop: TileProp): string {
  if (prop === "tree") return "Arbre";
  if (prop === "stump") return "Souche";
  if (prop === "rock") return "Rocher";
  if (prop === "cactus") return "Arbuste desertique";
  if (prop === "palm") return "Palmier";
  if (prop === "ruin") return "Ruine";
  if (prop === "crate") return "Caisse";
  if (prop === "hole") return "Trou";
  if (prop === "crater") return "Cratere";
  if (prop === "charred") return "Sol calciné";
  if (prop === "rubble") return "Gravats";
  return "Sol";
}

function buildTileEntity(x: number, y: number, tile: Tile): WorldEntity {
  const name =
    tile.poi !== null
      ? `Zone ${tile.poi}`
      : tile.prop !== "none"
        ? propName(tile.prop)
        : terrainName(tile.terrain);
  const modes: InteractionMode[] = ["inspect", "context"];
  if (!tile.blocked) {
    modes.unshift("move");
  }
  if (tile.prop !== "none" || tile.destructible || tile.poi !== null) {
    modes.push("interact");
  }
  return {
    ref: tileEntityRef(x, y),
    kind: tile.prop !== "none" ? "prop" : tile.poi !== null ? "poi" : "tile",
    name,
    x,
    y,
    width: 1,
    height: 1,
    blocked: tile.blocked,
    terrain: tile.terrain,
    prop: tile.prop,
    poi: tile.poi,
    modes,
    description:
      tile.poi !== null
        ? `Cet endroit correspond a ${tile.poi}.`
        : tile.prop !== "none"
          ? `${propName(tile.prop)} pose sur ${terrainName(tile.terrain).toLowerCase()}.`
          : `${terrainName(tile.terrain)} libre.`,
    infoLines: [
      `Terrain: ${terrainName(tile.terrain)}`,
      `POI: ${tile.poi ?? "aucun"}`,
      `Prop: ${tile.prop}`,
      `Bloque: ${tile.blocked ? "oui" : "non"}`,
      `Destructible: ${tile.destructible ? "oui" : "non"}`,
    ],
  };
}

export function getWorldEntities(state: SoloGameState): WorldEntity[] {
  const actors = state.actors.filter((actor) => actor.alive).map((actor) => buildActorEntity(actor));
  const structures = getMapStructures().map((structure) => buildStructureEntity(structure));
  return [...structures, ...actors];
}

export function findWorldEntityByRef(state: SoloGameState, ref: WorldEntityRef | null | undefined): WorldEntity | null {
  if (!ref) return null;
  const parsed = parseRef(ref);
  if (!parsed) return null;

  if (parsed.kind === "actor") {
    const actor = state.actors.find((entry) => entry.id === parsed.id && entry.alive);
    return actor ? buildActorEntity(actor) : null;
  }

  if (parsed.kind === "structure") {
    const structure = getMapStructures().find((entry) => entry.id === parsed.id);
    return structure ? buildStructureEntity(structure) : null;
  }

  if (parsed.kind === "tile") {
    const [xRaw, yRaw] = parsed.id.split(",");
    const x = Number(xRaw);
    const y = Number(yRaw);
    const tile = Number.isFinite(x) && Number.isFinite(y) ? getTile(state, x, y) : null;
    return tile ? buildTileEntity(x, y, tile) : null;
  }

  if (parsed.kind === "edge") {
    const edge = getEdgeEntityFromRef(parsed.id);
    return edge ? buildEdgeEntity(edge.direction, edge.cx, edge.cy) : null;
  }

  return null;
}

export function findEntityAtTile(state: SoloGameState, x: number, y: number): WorldEntity | null {
  if (!inBounds(x, y)) return null;

  const actor = state.actors.find((entry) => entry.alive && entry.x === x && entry.y === y);
  if (actor) return buildActorEntity(actor);

  const structure = getMapStructures().find(
    (entry) => x >= entry.x && y >= entry.y && x < entry.x + entry.w && y < entry.y + entry.h
  );
  if (structure) return buildStructureEntity(structure);

  const tile = getTile(state, x, y);
  return tile ? buildTileEntity(x, y, tile) : null;
}

export function getEdgeEntitiesForChunk(state: SoloGameState, cx: number, cy: number): WorldEntity[] {
  const edges: Array<WorldEntity | null> = [];
  if (cy > 0) edges.push(buildEdgeEntity("north", cx, cy));
  if (cy < WORLD_SCREENS_Y - 1) edges.push(buildEdgeEntity("south", cx, cy));
  if (cx > 0) edges.push(buildEdgeEntity("west", cx, cy));
  if (cx < WORLD_SCREENS_X - 1) edges.push(buildEdgeEntity("east", cx, cy));
  return edges.filter((entry): entry is WorldEntity => entry !== null);
}

function getEdgeEntityFromRef(value: string): { direction: "north" | "south" | "east" | "west"; cx: number; cy: number } | null {
  const [directionRaw, chunkRaw] = value.split(":");
  const [cxRaw, cyRaw] = (chunkRaw ?? "").split(",");
  const direction = directionRaw as "north" | "south" | "east" | "west";
  const cx = Number(cxRaw);
  const cy = Number(cyRaw);
  if (!["north", "south", "east", "west"].includes(direction) || !Number.isFinite(cx) || !Number.isFinite(cy)) {
    return null;
  }
  return { direction, cx, cy };
}

function buildEdgeEntity(direction: "north" | "south" | "east" | "west", cx: number, cy: number): WorldEntity {
  const centerX = cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
  const centerY = cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
  const target =
    direction === "north"
      ? { x: centerX, y: cy * CHUNK_SIZE }
      : direction === "south"
        ? { x: centerX, y: cy * CHUNK_SIZE + CHUNK_SIZE - 1 }
        : direction === "west"
          ? { x: cx * CHUNK_SIZE, y: centerY }
          : { x: cx * CHUNK_SIZE + CHUNK_SIZE - 1, y: centerY };
  const nextChunk =
    direction === "north"
      ? screenLabel(cx, cy - 1)
      : direction === "south"
        ? screenLabel(cx, cy + 1)
        : direction === "west"
          ? screenLabel(cx - 1, cy)
          : screenLabel(cx + 1, cy);
  return {
    ref: edgeEntityRef(direction, cx, cy),
    kind: "edge",
    name: `Passage ${direction}`,
    x: target.x,
    y: target.y,
    width: 1,
    height: 1,
    blocked: false,
    modes: ["move", "inspect", "context"],
    description: `Ce bord conduit vers ${nextChunk}.`,
    infoLines: [`Destination: ${nextChunk}`, `Direction: ${direction}`],
  };
}

export function isWalkableTile(
  state: SoloGameState,
  x: number,
  y: number,
  options?: { ignoreActorId?: string | null; allowGoalActor?: boolean }
): boolean {
  if (!inBounds(x, y)) return false;
  const tile = state.tiles[idxOf(x, y)];
  if (!tile || tile.blocked) return false;
  const blockingActor = state.actors.find(
    (actor) => actor.alive && actor.x === x && actor.y === y && actor.id !== options?.ignoreActorId
  );
  if (blockingActor && !options?.allowGoalActor) return false;
  return true;
}

function neighborPoints(x: number, y: number): WorldPoint[] {
  return [
    { x, y: y - 1 },
    { x: x + 1, y },
    { x, y: y + 1 },
    { x: x - 1, y },
  ];
}

export function findOrthogonalPath(
  state: SoloGameState,
  start: WorldPoint,
  goals: WorldPoint[],
  options?: { ignoreActorId?: string | null; maxSteps?: number }
): WorldPoint[] | null {
  if (!goals.length) return null;
  const goalKeys = new Set(goals.map((entry) => pointKey(entry.x, entry.y)));
  if (goalKeys.has(pointKey(start.x, start.y))) return [];

  const queue: PathNode[] = [{ x: start.x, y: start.y, key: pointKey(start.x, start.y) }];
  const visited = new Set<string>([pointKey(start.x, start.y)]);
  const parents = new Map<string, string>();
  const maxSteps = options?.maxSteps ?? state.worldWidth * state.worldHeight;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (goalKeys.has(current.key)) {
      const path: WorldPoint[] = [];
      let cursor = current.key;
      while (cursor !== pointKey(start.x, start.y)) {
        const [xRaw, yRaw] = cursor.split(",");
        path.push({ x: Number(xRaw), y: Number(yRaw) });
        const parent = parents.get(cursor);
        if (!parent) break;
        cursor = parent;
      }
      path.reverse();
      return path;
    }

    if (parents.size > maxSteps) break;

    for (const next of neighborPoints(current.x, current.y)) {
      const key = pointKey(next.x, next.y);
      if (visited.has(key)) continue;
      if (!goalKeys.has(key) && !isWalkableTile(state, next.x, next.y, { ignoreActorId: options?.ignoreActorId })) {
        continue;
      }
      visited.add(key);
      parents.set(key, current.key);
      queue.push({ ...next, key });
    }
  }

  return null;
}

function getStructureApproachGoals(state: SoloGameState, entity: WorldEntity): WorldPoint[] {
  const structure = getMapStructures().find((entry) => entry.id === entity.structureId);
  if (!structure) return [];

  const unique = new Map<string, WorldPoint>();
  const push = (x: number, y: number): void => {
    if (!isWalkableTile(state, x, y)) return;
    unique.set(pointKey(x, y), { x, y });
  };

  if (structure.serviceX !== null && structure.serviceY !== null) {
    push(structure.serviceX, structure.serviceY);
  }

  for (let x = structure.x - 1; x <= structure.x + structure.w; x += 1) {
    push(x, structure.y - 1);
    push(x, structure.y + structure.h);
  }
  for (let y = structure.y; y < structure.y + structure.h; y += 1) {
    push(structure.x - 1, y);
    push(structure.x + structure.w, y);
  }

  return Array.from(unique.values());
}

function getActorApproachGoals(state: SoloGameState, actor: WorldActor): WorldPoint[] {
  return neighborPoints(actor.x, actor.y).filter((entry) => isWalkableTile(state, entry.x, entry.y, { ignoreActorId: actor.id }));
}

export function getEntityGoals(state: SoloGameState, entity: WorldEntity): WorldPoint[] {
  if (entity.kind === "edge") return [{ x: entity.x, y: entity.y }];
  if (entity.kind === "structure") return getStructureApproachGoals(state, entity);
  if (entity.kind === "actor") {
    const actor = state.actors.find((entry) => entry.id === entity.actorId && entry.alive);
    return actor ? getActorApproachGoals(state, actor) : [];
  }
  if (entity.kind === "tile" || entity.kind === "poi") {
    return isWalkableTile(state, entity.x, entity.y) ? [{ x: entity.x, y: entity.y }] : [];
  }
  if (entity.kind === "prop") {
    if (!entity.blocked && isWalkableTile(state, entity.x, entity.y)) {
      return [{ x: entity.x, y: entity.y }];
    }
    return neighborPoints(entity.x, entity.y).filter((entry) => isWalkableTile(state, entry.x, entry.y));
  }
  return [];
}

export function findPathToEntity(
  state: SoloGameState,
  entity: WorldEntity,
  options?: { ignoreActorId?: string | null; maxSteps?: number }
): WorldPoint[] | null {
  return findOrthogonalPath(
    state,
    { x: state.player.x, y: state.player.y },
    getEntityGoals(state, entity),
    options
  );
}

export function findPathToTile(
  state: SoloGameState,
  x: number,
  y: number,
  options?: { ignoreActorId?: string | null; maxSteps?: number }
): WorldPoint[] | null {
  return findOrthogonalPath(state, { x: state.player.x, y: state.player.y }, [{ x, y }], options);
}
