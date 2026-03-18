import { CONFIG } from "./config";
import { actorEntityRef, findOrthogonalPath, tileEntityRef } from "./interaction";
import type {
  FollowerOrder,
  PlayerInteractionRequest,
  SoloGameState,
  SoloOutcome,
  SpeechBubbleEvent,
  WorldActor,
  WorldPoint,
} from "./types";

type WorldTickResult = {
  speechBubbles: SpeechBubbleEvent[];
  worldEvent: string | null;
};

type WorldDirectorEventResult = {
  narrative: string;
  speechBubbles?: SpeechBubbleEvent[];
};

function appendLog(state: SoloGameState, line: string): void {
  state.log.push(line);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function manhattan(a: WorldPoint, b: WorldPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function neighbors(x: number, y: number): WorldPoint[] {
  return [
    { x, y: y - 1 },
    { x: x + 1, y },
    { x, y: y + 1 },
    { x: x - 1, y },
  ];
}

function changeReputation(state: SoloGameState, scope: "factionReputations" | "zoneReputations", key: string, delta: number): void {
  state[scope][key] = (state[scope][key] ?? 0) + delta;
}

function currentZoneKey(state: SoloGameState): string {
  const chunkX = Math.floor(state.player.x / 16);
  const chunkY = Math.floor(state.player.y / 16);
  return `${chunkX}_${chunkY}`;
}

function makeIncidentId(prefix: string, turn: number, actorId: string | null): string {
  return `${prefix}_${turn}_${actorId ?? "world"}`;
}

function actorStrength(actor: WorldActor): number {
  return clamp(Math.round(actor.strength ?? actor.maxHp / 2 + 4), 1, 99);
}

function actorCombat(actor: WorldActor): number {
  return clamp(Math.round(actor.combatLevel ?? Math.floor(actor.maxHp / 4) + (actor.kind === "boss" ? 8 : actor.kind === "monster" ? 4 : 2)), 1, 30);
}

function actorBravery(actor: WorldActor): number {
  return clamp(Math.round(actor.bravery ?? (actor.hostile ? 55 : 35)), 1, 99);
}

function pickFreeSpawnNear(state: SoloGameState, origin: WorldPoint, radius = 2): WorldPoint | null {
  for (let dist = 1; dist <= radius; dist += 1) {
    for (const entry of [
      { x: origin.x, y: origin.y - dist },
      { x: origin.x + dist, y: origin.y },
      { x: origin.x, y: origin.y + dist },
      { x: origin.x - dist, y: origin.y },
    ]) {
      const tile = state.tiles[entry.y * state.worldWidth + entry.x];
      const occupied = state.actors.some((actor) => actor.alive && actor.x === entry.x && actor.y === entry.y);
      if (tile && !tile.blocked && !occupied) return entry;
    }
  }
  return null;
}

function tileAt(state: SoloGameState, x: number, y: number) {
  if (x < 0 || y < 0 || x >= state.worldWidth || y >= state.worldHeight) return null;
  return state.tiles[y * state.worldWidth + x] ?? null;
}

function ensureMutableTiles(prev: SoloGameState, state: SoloGameState): void {
  if (state.tiles === prev.tiles) {
    state.tiles = [...state.tiles];
  }
}

function setWorldTile(prev: SoloGameState, state: SoloGameState, x: number, y: number, patch: Partial<SoloGameState["tiles"][number]>): boolean {
  if (x < 0 || y < 0 || x >= state.worldWidth || y >= state.worldHeight) return false;
  ensureMutableTiles(prev, state);
  const index = y * state.worldWidth + x;
  const current = state.tiles[index];
  if (!current) return false;
  state.tiles[index] = {
    ...current,
    ...patch,
  };
  return true;
}

function tileHasLivingActor(state: SoloGameState, x: number, y: number): boolean {
  return state.actors.some((actor) => actor.alive && actor.x === x && actor.y === y);
}

function pickEventTile(
  state: SoloGameState,
  terrains: ReadonlyArray<string>,
  options?: { minDistance?: number; maxDistance?: number }
): WorldPoint | null {
  const minDistance = options?.minDistance ?? 3;
  const maxDistance = options?.maxDistance ?? 99;
  const candidates: WorldPoint[] = [];

  for (let y = 1; y < state.worldHeight - 1; y += 1) {
    for (let x = 1; x < state.worldWidth - 1; x += 1) {
      const tile = tileAt(state, x, y);
      if (!tile || !terrains.includes(tile.terrain)) continue;
      if (tile.terrain === "water" || tile.poi !== null || tile.blocked) continue;
      if (tileHasLivingActor(state, x, y)) continue;
      const distance = manhattan({ x, y }, { x: state.player.x, y: state.player.y });
      if (distance < minDistance || distance > maxDistance) continue;
      candidates.push({ x, y });
    }
  }

  if (candidates.length === 0 && minDistance > 0) {
    return pickEventTile(state, terrains, { minDistance: 0, maxDistance });
  }
  if (candidates.length === 0) return null;

  const seed = Math.abs(state.turn * 13 + state.worldDirector.eventCounter * 17 + state.player.x * 7 + state.player.y * 11);
  return candidates[seed % candidates.length] ?? null;
}

function addGroundImpact(prev: SoloGameState, state: SoloGameState, center: WorldPoint, opts?: { terrain?: string; centerProp?: "crater" | "hole" }): void {
  const terrain = opts?.terrain;
  const centerProp = opts?.centerProp ?? "crater";
  const centerTile = tileAt(state, center.x, center.y);
  if (!centerTile) return;

  const ring = [
    { x: center.x, y: center.y, prop: centerProp },
    { x: center.x + 1, y: center.y, prop: "hole" as const },
    { x: center.x - 1, y: center.y, prop: "hole" as const },
    { x: center.x, y: center.y + 1, prop: "hole" as const },
    { x: center.x, y: center.y - 1, prop: "hole" as const },
  ];

  for (const entry of ring) {
    const tile = tileAt(state, entry.x, entry.y);
    if (!tile || tile.terrain === "water" || tile.poi === "guild" || tile.poi === "shop" || tile.poi === "inn") continue;
    setWorldTile(prev, state, entry.x, entry.y, {
      terrain: (terrain as typeof tile.terrain | undefined) ?? tile.terrain,
      blocked: false,
      destructible: false,
      prop: entry.prop,
    });
  }
}

function pushWorldIncident(state: SoloGameState, summary: string, zone: string): void {
  state.incidents.push({
    id: makeIncidentId("world_event", state.turn, null),
    type: "world_event",
    faction: "world",
    zone,
    actorId: null,
    summary,
    severity: 4,
    createdTurn: state.turn,
    permanent: false,
  });
}

function spawnEventMonster(
  state: SoloGameState,
  idPrefix: string,
  name: string,
  origin: WorldPoint,
  config: {
    sprite: string;
    face: string;
    hp: number;
    faction: string;
    role: string;
    personality: string;
    loreSummary: string;
    strength: number;
    speed: number;
    willpower: number;
    magic: number;
    aura: number;
    defense: number;
    precision: number;
    evasion: number;
    combatLevel: number;
  }
): boolean {
  const spawn = pickFreeSpawnNear(state, origin, 3);
  if (!spawn) return false;
  state.actors.push({
    id: `${idPrefix}_${state.turn}`,
    name,
    kind: "monster",
    x: spawn.x,
    y: spawn.y,
    hp: config.hp,
    maxHp: config.hp,
    hostile: true,
    alive: true,
    sprite: config.sprite,
    face: config.face,
    dialogue: ["Le monde s ouvre sous mes griffes."],
    faction: config.faction,
    role: config.role,
    profession: config.role,
    personality: config.personality,
    loreSummary: config.loreSummary,
    strength: config.strength,
    speed: config.speed,
    willpower: config.willpower,
    magic: config.magic,
    aura: config.aura,
    defense: config.defense,
    precision: config.precision,
    evasion: config.evasion,
    perception: 7,
    discretion: 3,
    chance: 4,
    initiative: config.speed + 1,
    charisma: 2,
    endurance: config.hp - 4,
    resonance: Math.max(3, Math.floor((config.magic + config.aura) / 2)),
    combatLevel: config.combatLevel,
    stress: 18,
    morale: 72,
    loyalty: 68,
    obedience: 74,
    bravery: 78,
    alertness: 80,
    aggroRange: 7,
    sightRange: 7,
    hearingRange: 5,
    recruitmentEligible: true,
    recruitmentMode: "persuade",
    leaderId: null,
    followerOrder: null,
    memoryTags: ["world_event", idPrefix],
    persistentHostile: true,
    patrol: { axis: "x", range: 0.35, speed: 0.42, phase: 0.2 },
  });
  return true;
}

function ensureMilitiaResponse(state: SoloGameState): void {
  const guard = state.actors.find((actor) => actor.id === "npc_guard_road");
  if (guard) {
    guard.hostile = true;
    guard.persistentHostile = true;
    guard.faction = "militia";
    guard.role = "milicien";
    guard.personality = guard.personality ?? "intraitable";
    guard.mood = "en alerte";
    guard.aggroRange = Math.max(guard.aggroRange ?? 0, 7);
  }

  const alreadySpawned = state.actors.some((actor) => actor.id === "militia_reinforcement" && actor.alive);
  if (alreadySpawned) return;

  const spawn = pickFreeSpawnNear(state, CONFIG.spawning.militiaSpawnPosition, 3);
  if (!spawn) return;

  state.actors.push({
    id: "militia_reinforcement",
    name: "Milicien",
    kind: "npc",
    x: spawn.x,
    y: spawn.y,
    hp: 18,
    maxHp: 18,
    hostile: true,
    alive: true,
    sprite:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/KnightBlue/SeparateAnim/Walk.png",
    face:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/KnightBlue/Faceset.png",
    dialogue: ["Au nom du village, rends-toi !"],
    faction: "militia",
    role: "milicien",
    profession: "garde",
    personality: "discipline",
    loreSummary: "Renfort de la milice locale.",
    strength: 9,
    speed: 5,
    willpower: 7,
    magic: 2,
    aura: 4,
    defense: 7,
    precision: 7,
    evasion: 4,
    perception: 7,
    discretion: 3,
    chance: 4,
    initiative: 6,
    charisma: 4,
    endurance: 8,
    resonance: 3,
    combatLevel: 8,
    stress: 18,
    morale: 78,
    loyalty: 88,
    obedience: 92,
    bravery: 80,
    alertness: 85,
    aggroRange: 7,
    sightRange: 7,
    hearingRange: 5,
    recruitmentEligible: false,
    recruitmentMode: "contract",
    leaderId: null,
    followerOrder: null,
    memoryTags: ["justice", "militia"],
    persistentHostile: true,
    patrol: { axis: "x", range: 0.4, speed: 0.35, phase: 0.4 },
  });
}

function applyOutcomeReputation(state: SoloGameState, outcome: SoloOutcome): void {
  if (outcome.factionReputationDelta) {
    for (const [key, value] of Object.entries(outcome.factionReputationDelta)) {
      changeReputation(state, "factionReputations", key, value);
    }
  }
  if (outcome.zoneReputationDelta) {
    for (const [key, value] of Object.entries(outcome.zoneReputationDelta)) {
      changeReputation(state, "zoneReputations", key, value);
    }
  }
  if (outcome.recordIncidents) {
    for (const incident of outcome.recordIncidents) {
      state.incidents.push({
        id: incident.id || makeIncidentId(incident.type, state.turn, incident.actorId ?? null),
        type: incident.type,
        faction: incident.faction,
        zone: incident.zone,
        actorId: typeof incident.actorId === "undefined" ? null : incident.actorId,
        summary: incident.summary,
        severity: incident.severity,
        createdTurn: incident.createdTurn ?? state.turn,
        expiresAfterTurn: typeof incident.expiresAfterTurn === "undefined" ? null : incident.expiresAfterTurn,
        permanent: incident.permanent ?? false,
      });
    }
  }
}

function updateReputationTitle(state: SoloGameState): void {
  const heroScore = (state.factionReputations.village ?? 0) + (state.factionReputations.guild ?? 0);
  const crimeScore = Math.abs(Math.min(0, state.factionReputations.militia ?? 0)) + Math.abs(Math.min(0, state.factionReputations.village ?? 0));
  if (crimeScore >= CONFIG.reputation.outlawCrimeThreshold) {
    state.player.reputationTitle = "Hors-la-loi";
    return;
  }
  if (heroScore >= CONFIG.reputation.heroTitleThreshold) {
    state.player.reputationTitle = "Heros du village";
    return;
  }
  if (heroScore >= CONFIG.reputation.protectorTitleThreshold) {
    state.player.reputationTitle = "Protecteur";
    return;
  }
  state.player.reputationTitle = null;
}

function handleDeaths(prev: SoloGameState, state: SoloGameState, speechBubbles: SpeechBubbleEvent[]): string | null {
  let worldEvent: string | null = null;

  for (const beforeActor of prev.actors) {
    if (!beforeActor.alive) continue;
    const afterActor = state.actors.find((entry) => entry.id === beforeActor.id);
    if (!afterActor || afterActor.alive) continue;

    if (beforeActor.hostile) {
      const heroDelta = beforeActor.kind === "boss" ? CONFIG.reputation.killBossHeroDelta : CONFIG.reputation.killHostileHeroDelta;
      changeReputation(state, "factionReputations", "village", heroDelta);
      changeReputation(state, "factionReputations", "guild", Math.max(2, Math.floor(heroDelta / CONFIG.reputation.guildDeltaDivisor)));
      changeReputation(state, "factionReputations", "monsters", CONFIG.reputation.killMonstersFactionDelta);
      state.incidents.push({
        id: makeIncidentId("heroic", state.turn, beforeActor.id),
        type: "heroic",
        faction: "village",
        zone: currentZoneKey(state),
        actorId: beforeActor.id,
        summary: `${beforeActor.name} a ete elimine.`,
        severity: beforeActor.kind === "boss" ? 6 : 2,
        createdTurn: state.turn,
        permanent: beforeActor.kind === "boss",
      });
      if (beforeActor.kind === "boss") {
        worldEvent = "La chute du Roi Demon change l equilibre du monde.";
      }
      continue;
    }

    const severity = beforeActor.kind === "npc" ? CONFIG.reputation.killInnocentSeverity : CONFIG.reputation.killAnimalSeverity;
    changeReputation(state, "factionReputations", "village", -severity);
    changeReputation(state, "factionReputations", "militia", -severity - 4);
    state.bounties.push({
      id: makeIncidentId("bounty", state.turn, beforeActor.id),
      faction: "militia",
      zone: "village",
      reason: `Mort de ${beforeActor.name}`,
      level: severity,
      active: true,
      createdTurn: state.turn,
    });
    state.incidents.push({
      id: makeIncidentId("crime", state.turn, beforeActor.id),
      type: "crime",
      faction: "militia",
      zone: "village",
      actorId: beforeActor.id,
      summary: `Tu as tue ${beforeActor.name} sans justification acceptee.`,
      severity,
      createdTurn: state.turn,
      permanent: true,
    });
    ensureMilitiaResponse(state);
    speechBubbles.push({
      sourceRef: actorEntityRef(beforeActor.id),
      speaker: beforeActor.name,
      text: "Pourquoi... ?",
      kind: "speech",
      ttlMs: 2400,
    });
    worldEvent = "La milice te considere desormais comme une menace.";
  }

  updateReputationTitle(state);
  return worldEvent;
}

function recruitActor(state: SoloGameState, actorId: string, speechBubbles: SpeechBubbleEvent[]): void {
  const actor = state.actors.find((entry) => entry.id === actorId && entry.alive);
  if (!actor) return;
  if (state.followers.some((entry) => entry.actorId === actorId)) return;

  actor.hostile = false;
  actor.persistentHostile = false;
  actor.faction = "player_party";
  actor.leaderId = "player";
  actor.followerOrder = "follow";
  actor.mood = "loyal";
  actor.disposition = "loyal";
  actor.loyalty = Math.max(actor.loyalty ?? 40, 62);
  actor.morale = Math.max(actor.morale ?? 40, 58);
  actor.recruitmentEligible = false;

  state.followers.push({
    actorId: actor.id,
    role: actor.role ?? actor.profession ?? actor.kind,
    loyalty: actor.loyalty ?? 60,
    morale: actor.morale ?? 60,
    order: "follow",
    recruitedTurn: state.turn,
  });

  appendLog(state, `SYSTEM: ${actor.name} rejoint ton groupe.`);
  speechBubbles.push({
    sourceRef: actorEntityRef(actor.id),
    speaker: actor.name,
    text: actor.kind === "monster" ? "Je combats a tes cotes." : "Je te suis.",
    kind: "speech",
    ttlMs: 2600,
  });
}

function setFollowerOrder(state: SoloGameState, actorId: string, order: FollowerOrder): void {
  const follower = state.followers.find((entry) => entry.actorId === actorId);
  if (!follower) return;
  follower.order = order;
  const actor = state.actors.find((entry) => entry.id === actorId);
  if (actor) {
    actor.followerOrder = order;
  }
}

function handleFollowers(state: SoloGameState, speechBubbles: SpeechBubbleEvent[]): void {
  for (const follower of state.followers) {
    const actor = state.actors.find((entry) => entry.id === follower.actorId && entry.alive);
    if (!actor) continue;

    const nearbyHostile = state.actors
      .filter((entry) => entry.alive && entry.hostile && entry.leaderId !== "player")
      .sort(
        (a, b) =>
          manhattan({ x: a.x, y: a.y }, { x: actor.x, y: actor.y }) -
          manhattan({ x: b.x, y: b.y }, { x: actor.x, y: actor.y })
      )[0];

    if (nearbyHostile && manhattan({ x: nearbyHostile.x, y: nearbyHostile.y }, { x: actor.x, y: actor.y }) <= 1) {
      const damage = clamp(Math.round((actorStrength(actor) + actorCombat(actor)) / CONFIG.combat.followerDamageDivisor), CONFIG.combat.followerDamageMin, CONFIG.combat.followerDamageMax);
      nearbyHostile.hp = Math.max(0, nearbyHostile.hp - damage);
      appendLog(state, `ALLIE: ${actor.name} frappe ${nearbyHostile.name} (${damage}).`);
      speechBubbles.push({
        sourceRef: actorEntityRef(actor.id),
        speaker: actor.name,
        text: "J attaque !",
        kind: "speech",
        ttlMs: 1600,
      });
      if (nearbyHostile.hp <= 0) {
        nearbyHostile.alive = false;
      }
      continue;
    }

    if (follower.order === "hold") continue;

    const goals =
      follower.order === "guard"
        ? neighbors(state.player.x, state.player.y)
        : [{ x: state.player.x, y: state.player.y }, ...neighbors(state.player.x, state.player.y)];
    const path = findOrthogonalPath(state, { x: actor.x, y: actor.y }, goals, {
      ignoreActorId: actor.id,
      maxSteps: 24,
    });
    const step = path?.[0];
    if (!step) continue;
    actor.x = step.x;
    actor.y = step.y;
  }
}

function moveAwayFromPlayer(state: SoloGameState, actor: WorldActor): boolean {
  const currentDistance = manhattan({ x: actor.x, y: actor.y }, { x: state.player.x, y: state.player.y });
  let best: WorldPoint | null = null;
  let bestDistance = currentDistance;

  for (const candidate of neighbors(actor.x, actor.y)) {
    const tile = state.tiles[candidate.y * state.worldWidth + candidate.x];
    const occupied = state.actors.some(
      (entry) => entry.alive && entry.id !== actor.id && entry.x === candidate.x && entry.y === candidate.y
    );
    if (!tile || tile.blocked || occupied) continue;
    const distance = manhattan(candidate, { x: state.player.x, y: state.player.y });
    if (distance > bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  if (!best) return false;
  actor.x = best.x;
  actor.y = best.y;
  return true;
}

function handleHostileAi(state: SoloGameState, speechBubbles: SpeechBubbleEvent[]): void {
  const heroScore = (state.factionReputations.village ?? 0) + (state.factionReputations.guild ?? 0) + state.player.aura;

  for (const actor of state.actors) {
    if (!actor.alive || !actor.hostile || actor.leaderId === "player") continue;

    const distanceToPlayer = manhattan({ x: actor.x, y: actor.y }, { x: state.player.x, y: state.player.y });
    const aggroRange = actor.aggroRange ?? 4;
    const fearThreshold = heroScore - actorBravery(actor);

    if (distanceToPlayer <= 1) {
      const damage = clamp(Math.round((actorStrength(actor) + actorCombat(actor)) / CONFIG.combat.hostileAiDamageDivisor), 1, actor.kind === "boss" ? CONFIG.combat.hostileAiBossDamageMax : CONFIG.combat.hostileAiNormalDamageMax);
      state.player.hp = Math.max(0, state.player.hp - damage);
      appendLog(state, `ENNEMI: ${actor.name} t attaque (${damage}).`);
      speechBubbles.push({
        sourceRef: actorEntityRef(actor.id),
        speaker: actor.name,
        text: actor.kind === "boss" ? "Je t ecrase." : "A l attaque !",
        kind: "speech",
        ttlMs: 1700,
      });
      continue;
    }

    if (fearThreshold >= CONFIG.combat.fearThresholdOffset && actor.kind !== "boss") {
      if (moveAwayFromPlayer(state, actor)) {
        actor.mood = "effraye";
        speechBubbles.push({
          sourceRef: actorEntityRef(actor.id),
          speaker: actor.name,
          text: "Il degage une aura effrayante...",
          kind: "thought",
          ttlMs: 1600,
        });
      }
      continue;
    }

    if (distanceToPlayer > aggroRange) continue;
    const goals = neighbors(state.player.x, state.player.y);
    const path = findOrthogonalPath(state, { x: actor.x, y: actor.y }, goals, {
      ignoreActorId: actor.id,
      maxSteps: 24,
    });
    const step = path?.[0];
    if (!step) continue;
    actor.x = step.x;
    actor.y = step.y;
    actor.mood = "en chasse";
  }
}

function maybeAddDynamicQuest(state: SoloGameState, id: string, title: string, description: string): void {
  if (state.quests.some((entry) => entry.id === id)) return;
  state.quests.push({
    id,
    title,
    description,
    rank: "B",
    done: false,
    progress: 0,
    target: 1,
    rewardGold: 30,
  });
}

function spawnRaidMonster(state: SoloGameState): void {
  const spawn = pickFreeSpawnNear(state, CONFIG.spawning.raidSpawnPosition, 4);
  if (!spawn) return;
  state.actors.push({
    id: `raid_demon_${state.turn}`,
    name: "Maraudeur demoniaque",
    kind: "monster",
    x: spawn.x,
    y: spawn.y,
    hp: 18,
    maxHp: 18,
    hostile: true,
    alive: true,
    sprite:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/DemonRed/SeparateAnim/Walk.png",
    face:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/DemonRed/Faceset.png",
    dialogue: ["Le village brulera."],
    faction: "demon_army",
    role: "raider",
    profession: "assaillant",
    personality: "agressif",
    loreSummary: "Un demon envoye pour tester les defenses du village.",
    strength: 10,
    speed: 5,
    willpower: 7,
    magic: 4,
    aura: 5,
    defense: 6,
    precision: 7,
    evasion: 4,
    perception: 6,
    discretion: 2,
    chance: 4,
    initiative: 6,
    charisma: 2,
    endurance: 8,
    resonance: 4,
    combatLevel: 7,
    stress: 18,
    morale: 70,
    loyalty: 82,
    obedience: 86,
    bravery: 62,
    alertness: 72,
    aggroRange: 6,
    sightRange: 6,
    hearingRange: 4,
    recruitmentEligible: true,
    recruitmentMode: "persuade",
    leaderId: null,
    followerOrder: null,
    memoryTags: ["raid"],
    persistentHostile: true,
    patrol: { axis: "x", range: 0.4, speed: 0.4, phase: 0.2 },
  });
}

function rollNextWorldEventCountdown(): number {
  return CONFIG.worldEvents.minTurnsBetween + Math.floor(Math.random() * (CONFIG.worldEvents.maxTurnsBetween - CONFIG.worldEvents.minTurnsBetween));
}

function triggerMeteorStrike(prev: SoloGameState, state: SoloGameState): WorldDirectorEventResult | null {
  const center = pickEventTile(state, ["grass", "forest", "desert", "road"], { minDistance: 4, maxDistance: 18 });
  if (!center) return null;

  addGroundImpact(prev, state, center, { centerProp: "crater" });
  spawnEventMonster(state, "meteor_spawn", "Bete calcinée", center, {
    sprite:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/DemonRed/SeparateAnim/Walk.png",
    face:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/DemonRed/Faceset.png",
    hp: 20,
    faction: "world",
    role: "predateur stellaire",
    personality: "furieux",
    loreSummary: "Une creature née de l impact meteoritique.",
    strength: 11,
    speed: 5,
    willpower: 8,
    magic: 6,
    aura: 7,
    defense: 7,
    precision: 8,
    evasion: 4,
    combatLevel: 8,
  });
  maybeAddDynamicQuest(
    state,
    "dynamic_meteor_crater",
    "Cratere fumant",
    "Examine le point d impact avant que quelque chose n en emerge completement."
  );
  pushWorldIncident(state, "Une meteorite a creuse un cratere fumant.", `${Math.floor(center.x / 16)}_${Math.floor(center.y / 16)}`);
  return {
    narrative: "Une meteorite fend le ciel et laisse un cratere fumant dans la region.",
    speechBubbles: [
      {
        sourceRef: tileEntityRef(center.x, center.y),
        text: "Un impact meteoritique secoue le sol.",
        kind: "action",
        ttlMs: 2600,
      },
    ],
  };
}

function triggerVillageRaid(prev: SoloGameState, state: SoloGameState): WorldDirectorEventResult {
  spawnRaidMonster(state);
  addGroundImpact(prev, state, CONFIG.spawning.raidSpawnPosition, { centerProp: "crater" });
  maybeAddDynamicQuest(
    state,
    "dynamic_village_defense",
    "Defense du village",
    "Repousse la vague hostile avant qu elle ne fracture la place centrale."
  );
  ensureMilitiaResponse(state);
  pushWorldIncident(state, "La route du village a ete frappee par un raid.", "1_1");
  return {
    narrative: "Une nouvelle vague hostile frappe la route du village et laisse des traces bien visibles.",
    speechBubbles: [
      {
        sourceRef: tileEntityRef(31, 23),
        text: "Des assaillants dechiquettent la route.",
        kind: "action",
        ttlMs: 2500,
      },
    ],
  };
}

function triggerMesaCollapse(prev: SoloGameState, state: SoloGameState): WorldDirectorEventResult | null {
  const center = pickEventTile(state, ["desert"], { minDistance: 4, maxDistance: 20 });
  if (!center) return null;

  addGroundImpact(prev, state, center, { centerProp: "crater" });
  spawnEventMonster(state, "mesa_revenant", "Revenant des ruines", center, {
    sprite:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/Skeleton/SeparateAnim/Walk.png",
    face:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/Skeleton/Faceset.png",
    hp: 16,
    faction: "monsters",
    role: "revenant",
    personality: "tenace",
    loreSummary: "Une carcasse ancienne reveillee par l effondrement de la mesa.",
    strength: 8,
    speed: 4,
    willpower: 7,
    magic: 3,
    aura: 4,
    defense: 5,
    precision: 6,
    evasion: 3,
    combatLevel: 6,
  });
  maybeAddDynamicQuest(
    state,
    "dynamic_mesa_collapse",
    "Ruines ouvertes",
    "Fouille la zone effondree avant que les revenants ne s en emparent."
  );
  pushWorldIncident(state, "Un pan de mesa s est effondre et a revele des ruines.", "2_0");
  return {
    narrative: "Une portion de la mesa s effondre, ouvre des ruines et reveille quelque chose dessous.",
    speechBubbles: [
      {
        sourceRef: tileEntityRef(center.x, center.y),
        text: "La pierre cede dans un grondement sec.",
        kind: "action",
        ttlMs: 2400,
      },
    ],
  };
}

function triggerDungeonCaveIn(prev: SoloGameState, state: SoloGameState): WorldDirectorEventResult | null {
  const center = pickEventTile(state, ["dungeon", "stone"], { minDistance: 3, maxDistance: 18 });
  if (!center) return null;

  addGroundImpact(prev, state, center, { centerProp: "crater" });
  spawnEventMonster(state, "dungeon_ambush", "Ombre du cave-in", center, {
    sprite:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/Skeleton/SeparateAnim/Walk.png",
    face:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/Skeleton/Faceset.png",
    hp: 18,
    faction: "monsters",
    role: "guetteur du donjon",
    personality: "sournois",
    loreSummary: "Une ombre attiree par l effondrement souterrain.",
    strength: 9,
    speed: 5,
    willpower: 8,
    magic: 4,
    aura: 5,
    defense: 6,
    precision: 7,
    evasion: 4,
    combatLevel: 7,
  });
  pushWorldIncident(state, "Une galerie du donjon s est partiellement effondree.", "1_2");
  return {
    narrative: "Un pan du donjon cede et laisse un effondrement noir entre les dalles.",
    speechBubbles: [
      {
        sourceRef: tileEntityRef(center.x, center.y),
        text: "Le donjon tremble puis s affaisse.",
        kind: "action",
        ttlMs: 2400,
      },
    ],
  };
}

function triggerCitadelSurge(prev: SoloGameState, state: SoloGameState): WorldDirectorEventResult | null {
  const center = pickEventTile(state, ["boss"], { minDistance: 3, maxDistance: 18 });
  if (!center) return null;

  addGroundImpact(prev, state, center, { centerProp: "crater" });
  spawnEventMonster(state, "citadel_surge", "Heraut infernal", center, {
    sprite:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/DemonRed/SeparateAnim/Walk.png",
    face:
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/DemonRed/Faceset.png",
    hp: 24,
    faction: "demon_army",
    role: "heraut",
    personality: "implacable",
    loreSummary: "Un heraut du Roi Demon jailli d une pulsation de la citadelle.",
    strength: 12,
    speed: 6,
    willpower: 10,
    magic: 7,
    aura: 8,
    defense: 8,
    precision: 8,
    evasion: 5,
    combatLevel: 9,
  });
  pushWorldIncident(state, "La citadelle du demon pulse et ouvre une fracture.", "2_2");
  return {
    narrative: "La citadelle pulse d energie et dechire le sol sous une nouvelle fracture infernale.",
    speechBubbles: [
      {
        sourceRef: tileEntityRef(center.x, center.y),
        text: "Une fracture infernale s ouvre.",
        kind: "action",
        ttlMs: 2500,
      },
    ],
  };
}

function advanceWorldDirector(prev: SoloGameState, state: SoloGameState): WorldDirectorEventResult | null {
  state.worldDirector.actionsUntilNextEvent -= 1;
  if (state.worldDirector.actionsUntilNextEvent > 0) return null;

  state.worldDirector.actionsUntilNextEvent = rollNextWorldEventCountdown();
  state.worldDirector.lastEventTurn = state.turn;
  state.worldDirector.eventCounter += 1;

  const pool = [
    () => triggerVillageRaid(prev, state),
    () => triggerMeteorStrike(prev, state),
    () => triggerMesaCollapse(prev, state),
    () => triggerDungeonCaveIn(prev, state),
    () => triggerCitadelSurge(prev, state),
  ];

  for (let attempt = 0; attempt < pool.length; attempt += 1) {
    const index = Math.abs(state.turn + state.worldDirector.eventCounter + attempt * 3) % pool.length;
    const event = pool[index] ?? pool[0];
    const result = event();
    if (result) return result;
  }

  return null;
}

export function applyWorldTick(
  prev: SoloGameState,
  state: SoloGameState,
  outcome: SoloOutcome,
  interaction?: PlayerInteractionRequest | null
): WorldTickResult {
  const speechBubbles: SpeechBubbleEvent[] = [];
  let worldEvent: string | null = null;

  applyOutcomeReputation(state, outcome);

  if (outcome.recruitActorId) {
    recruitActor(state, outcome.recruitActorId, speechBubbles);
  }

  if (outcome.setFollowerOrder) {
    setFollowerOrder(state, outcome.setFollowerOrder.actorId, outcome.setFollowerOrder.order);
  }

  const deathEvent = handleDeaths(prev, state, speechBubbles);
  if (deathEvent) {
    worldEvent = deathEvent;
  }

  if ((state.factionReputations.militia ?? 0) <= CONFIG.reputation.militiaHostileThreshold || state.bounties.some((entry) => entry.active && entry.faction === "militia")) {
    ensureMilitiaResponse(state);
  }

  handleFollowers(state, speechBubbles);
  handleHostileAi(state, speechBubbles);

  if (interaction?.type !== "inspect") {
    const event = advanceWorldDirector(prev, state);
    if (event?.speechBubbles?.length) {
      speechBubbles.push(...event.speechBubbles);
    }
    if (event?.narrative && !worldEvent) {
      worldEvent = event.narrative;
    }
  }

  updateReputationTitle(state);

  if (state.log.length > CONFIG.log.worldTickMaxEntries) {
    state.log = state.log.slice(-CONFIG.log.worldTickTrimTo);
  }

  return {
    speechBubbles,
    worldEvent,
  };
}
