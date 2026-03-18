import { resolveItemAsset } from "./assets";
import { CONFIG } from "./config";
import { findWorldEntityByRef } from "./interaction";
import { hydrateSoloState, pushRecentActionSignature } from "./runtime";
import { findShopCatalogEntry, getShopDiscountPercent, getShopPrice } from "./shop";
import type {
  EntityInventoryItem,
  PlayerInteractionRequest,
  PoiType,
  SoloActionContext,
  SoloGameState,
  SoloOutcome,
  SpawnActor,
  TerrainChange,
  Tile,
  WorldActor,
  WorldEntityRef,
  WorldEntityState,
  WorldOp,
} from "./types";
import { applyWorldTick } from "./worldTick";
import {
  chunkKey,
  chunkOf,
  enforceWorldCoherence,
  getTile,
  idxOf,
  inBounds,
  poiLabel,
  terrainLabel,
} from "./world";

const MAX_STRESS = CONFIG.player.maxStress;
const MAX_MOVE_TILES_PER_TURN = CONFIG.player.maxMovePerTurn;
const MAX_POI_PATH_STEPS = CONFIG.player.maxPoiPathSteps;

export function buildActionContext(
  state: SoloGameState,
  interaction?: PlayerInteractionRequest | null
): SoloActionContext {
  const playerTile = getTile(state, state.player.x, state.player.y);
  const { cx, cy } = chunkOf(state.player.x, state.player.y);
  const target =
    interaction?.primaryTargetRef || interaction?.targetRef
      ? findWorldEntityByRef(state, interaction?.primaryTargetRef ?? interaction?.targetRef ?? null)
      : interaction?.targetTile
        ? findWorldEntityByRef(state, `tile:${interaction.targetTile.x},${interaction.targetTile.y}`)
        : null;

  const nearbyPois = [
    getTile(state, state.player.x, state.player.y)?.poi,
    getTile(state, state.player.x + 1, state.player.y)?.poi,
    getTile(state, state.player.x - 1, state.player.y)?.poi,
    getTile(state, state.player.x, state.player.y + 1)?.poi,
    getTile(state, state.player.x, state.player.y - 1)?.poi,
  ]
    .filter((value): value is NonNullable<typeof value> => value !== null)
    .map((value) => value.toString())
    .filter((value, index, list) => list.indexOf(value) === index);

  const nearActors = state.actors
    .filter((actor) => actor.alive)
    .map((actor) => ({
      id: actor.id,
      name: actor.name,
      kind: actor.kind,
      hostile: actor.hostile,
      hp: actor.hp,
      strength: actorStrength(actor),
      combat: actorCombat(actor),
      stress: actorStress(actor),
      distance: manhattan(actor.x, actor.y, state.player.x, state.player.y),
    }))
    .filter((actor) => actor.distance <= 5)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8);

  return {
    turn: state.turn,
    playerName: state.player.name,
    rank: state.player.rank,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    lives: state.player.lives,
    gold: state.player.gold,
    strength: state.player.strength,
    speed: state.player.speed,
    willpower: state.player.willpower,
    magic: state.player.magic,
    aura: state.player.aura,
    defense: state.player.defense,
    precision: state.player.precision,
    evasion: state.player.evasion,
    perception: state.player.perception,
    discretion: state.player.discretion,
    chance: state.player.chance,
    initiative: state.player.initiative,
    charisma: state.player.charisma,
    endurance: state.player.endurance,
    resonance: state.player.resonance,
    stress: state.player.stress,
    powerText: state.player.powerText,
    powerRoll: state.player.powerRoll,
    powerAccepted: state.player.powerAccepted,
    objective: state.player.objective,
    position: { x: state.player.x, y: state.player.y },
    chunk: { x: cx, y: cy },
    terrain: playerTile?.terrain ?? "grass",
    poi: playerTile?.poi ?? null,
    nearbyPois,
    nearActors,
    quests: state.quests.map((quest) => ({
      id: quest.id,
      title: quest.title,
      done: quest.done,
      progress: quest.progress,
      target: quest.target,
    })),
    inventory: state.player.inventory.map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
    })),
    target: target
      ? {
          ref: target.ref,
          kind: target.kind,
          name: target.name,
          x: target.x,
          y: target.y,
          distance: manhattan(target.x, target.y, state.player.x, state.player.y),
          ownerRef: state.entityStates[target.ref]?.ownerRef ?? null,
          visibleItems: (state.entityStates[target.ref]?.inventory ?? []).map((item) => item.name).slice(0, 6),
          equippedItems: Object.values(state.entityStates[target.ref]?.equipment ?? {})
            .map((itemId) => (state.entityStates[target.ref]?.inventory ?? []).find((item) => item.id === itemId)?.name ?? null)
            .filter((entry): entry is string => !!entry),
          accessPolicy: state.entityStates[target.ref]?.accessPolicy ?? null,
          faction: state.entityStates[target.ref]?.faction ?? null,
        }
      : null,
    factionReputations: { ...state.factionReputations },
    zoneReputations: { ...state.zoneReputations },
    followers: state.followers.map((entry) => ({ ...entry })),
    recentActionSignatures: [...state.recentActionSignatures],
    recentLog: state.log.slice(-10),
  };
}

function actorStrength(actor: WorldActor): number {
  return clamp(Math.round((actor as { strength?: number }).strength ?? actor.maxHp / 2 + 4), 1, 99);
}

function actorCombat(actor: WorldActor): number {
  const raw = (actor as { combatLevel?: number }).combatLevel ?? Math.floor(actor.maxHp / 4) + (actor.kind === "boss" ? 8 : actor.kind === "monster" ? 4 : 2);
  return clamp(Math.round(raw), 1, 30);
}

function actorStress(actor: WorldActor): number {
  return clamp(Math.round((actor as { stress?: number }).stress ?? 12), 0, 100);
}

export function applyOutcome(
  prev: SoloGameState,
  outcome: SoloOutcome,
  interaction?: PlayerInteractionRequest | null
): SoloGameState {
  const safePrev = hydrateSoloState(prev);
  if (safePrev.status !== "playing") return safePrev;

  const next: SoloGameState = {
    ...safePrev,
    turn: safePrev.turn + 1,
    player: {
      ...safePrev.player,
      inventory: safePrev.player.inventory.map((item) => ({ ...item })),
    },
    quests: safePrev.quests.map((quest) => ({ ...quest })),
    actors: safePrev.actors.map((actor) => ({ ...actor })),
    log: [...safePrev.log],
    revealedChunks: [...safePrev.revealedChunks],
    tiles: safePrev.tiles,
    incidents: safePrev.incidents.map((entry) => ({ ...entry })),
    bounties: safePrev.bounties.map((entry) => ({ ...entry })),
    followers: safePrev.followers.map((entry) => ({ ...entry })),
    factionReputations: { ...safePrev.factionReputations },
    zoneReputations: { ...safePrev.zoneReputations },
    worldDirector: { ...safePrev.worldDirector },
    recentActionSignatures: [...safePrev.recentActionSignatures],
    entityStates: cloneEntityStates(safePrev.entityStates),
    lastAction: outcome.storyLine?.trim() || safePrev.lastAction,
    lastNarration: outcome.narrative || safePrev.lastNarration,
  };

  let tilesCopied = false;
  const ensureTiles = (): Tile[] => {
    if (!tilesCopied) {
      next.tiles = [...safePrev.tiles];
      tilesCopied = true;
    }
    return next.tiles;
  };

  if (Array.isArray(outcome.worldOps) && outcome.worldOps.length > 0) {
    applyWorldOps(next, outcome.worldOps);
  }

  if (outcome.movePath && outcome.movePath.length > 0) {
    applyMovePath(next, outcome.movePath);
  } else if (outcome.moveBy) {
    applyMovement(next, outcome.moveBy.dx, outcome.moveBy.dy);
  }

  if (outcome.moveToPoi) {
    moveTowardPoi(next, outcome.moveToPoi, clamp(Math.round(outcome.moveToPoiSteps ?? 4), 1, MAX_POI_PATH_STEPS));
  }

  if (outcome.approachNearestHostile) {
    const steps =
      typeof outcome.moveToPoiSteps === "number"
        ? clamp(Math.round(outcome.moveToPoiSteps), 1, MAX_POI_PATH_STEPS)
        : typeof outcome.diceRoll === "number" && outcome.diceRoll >= 15
          ? 8
          : 6;
    approachNearestHostile(next, steps);
  }

  if (Array.isArray(outcome.terrainChanges) && outcome.terrainChanges.length > 0) {
    for (const mutation of outcome.terrainChanges.slice(0, 6)) {
      applyTerrainChange(next, mutation, ensureTiles);
    }
  }

  if (outcome.destroyTarget) {
    applyDestroy(next, outcome.destroyTarget.dx, outcome.destroyTarget.dy, ensureTiles);
  }

  if (outcome.attackActorId) {
    applyAttack(next, outcome.attackPower ?? 7, outcome.diceRoll, outcome.attackActorId);
  } else if (outcome.attackNearestHostile) {
    applyAttack(next, outcome.attackPower ?? 7, outcome.diceRoll);
  }

  if (outcome.talkToActorId || outcome.talkToNearestNpc) {
    applyNpcTalk(next, outcome.npcSpeech, outcome.talkToActorId ?? undefined);
  }

  if (outcome.requestQuest) {
    applyQuestBoard(next);
  }

  if (outcome.addItemName) {
    addInventoryItem(next, outcome.addItemName, 1);
  }

  if (outcome.buyItemName) {
    buyInventoryItem(next, outcome.buyItemName, 1);
  }

  if (outcome.sellItemName) {
    sellInventoryItem(next, outcome.sellItemName, outcome.sellItemQty ?? 1);
  }

  if (typeof outcome.setShopDiscountPercent === "number") {
    next.player.shopDiscountPercent = getShopDiscountPercent(outcome.setShopDiscountPercent);
  }

  if (typeof outcome.damageSelf === "number") {
    next.player.hp = clamp(next.player.hp - Math.max(0, Math.round(outcome.damageSelf)), 0, next.player.maxHp);
  }

  if (typeof outcome.healSelf === "number") {
    next.player.hp = clamp(next.player.hp + Math.max(0, Math.round(outcome.healSelf)), 0, next.player.maxHp);
  }

  if (typeof outcome.goldDelta === "number") {
    next.player.gold = Math.max(0, next.player.gold + Math.round(outcome.goldDelta));
  }

  if (typeof outcome.stressDelta === "number") {
    next.player.stress = clamp(next.player.stress + Math.round(outcome.stressDelta), 0, MAX_STRESS);
  }

  if (typeof outcome.strengthDelta === "number") {
    next.player.strength = clamp(next.player.strength + Math.round(outcome.strengthDelta), 1, 99);
  }

  if (Array.isArray(outcome.spawnActors) && outcome.spawnActors.length > 0) {
    for (const spawn of outcome.spawnActors.slice(0, 3)) {
      spawnRelativeActor(next, spawn);
    }
  }

  if (outcome.objectivePatch && outcome.objectivePatch.trim().length > 0) {
    next.player.objective = outcome.objectivePatch.trim().slice(0, 120);
    appendLog(next, `SYSTEM: Objectif mis a jour -> ${next.player.objective}`);
  }

  if (outcome.completeObjective) {
    next.quests.forEach((quest) => {
      if (!quest.done) {
        quest.done = true;
        quest.progress = quest.target;
      }
    });
  }

  if (interaction?.repeatSignature) {
    next.recentActionSignatures = pushRecentActionSignature(next.recentActionSignatures, interaction.repeatSignature);
  }

  enforceWorldCoherence(next);
  revealPlayerChunk(next);
  checkTileTriggers(next);
  syncQuestProgress(next);

  const tick = applyWorldTick(safePrev, next, outcome, interaction);
  if ((!outcome.worldEvent || outcome.worldEvent.trim().length === 0) && tick.worldEvent) {
    outcome.worldEvent = tick.worldEvent;
  }
  if (tick.speechBubbles.length > 0) {
    outcome.speechBubbles = [...(outcome.speechBubbles ?? []), ...tick.speechBubbles];
  }

  checkLifeAndRespawn(next);

  if (typeof outcome.diceRoll === "number") {
    appendLog(next, `SYSTEM: D20 = ${outcome.diceRoll}`);
  }
  appendLog(next, `MJ: ${outcome.narrative || "Le monde reste silencieux."}`);
  if (outcome.worldEvent) {
    appendLog(next, `EVENT: ${outcome.worldEvent}`);
  }

  if (next.quests.every((quest) => quest.done) && next.status === "playing") {
    next.status = "victory";
    appendLog(next, "SYSTEM: Quetes principales completees. Victoire.");
  }

  if (next.log.length > CONFIG.log.maxEntries) {
    next.log = next.log.slice(-CONFIG.log.trimTo);
  }

  return next;
}

export function applyFreeMoveStep(
  prev: SoloGameState,
  step: { x: number; y: number }
): SoloGameState {
  const safePrev = hydrateSoloState(prev);
  if (safePrev.status !== "playing") return safePrev;
  if (!step || !Number.isFinite(step.x) || !Number.isFinite(step.y)) return safePrev;
  if (!inBounds(step.x, step.y)) return safePrev;
  if (manhattan(step.x, step.y, safePrev.player.x, safePrev.player.y) !== 1) return safePrev;

  const tile = safePrev.tiles[idxOf(step.x, step.y)];
  if (!tile || tile.blocked) return safePrev;
  const occupied = safePrev.actors.some((actor) => actor.alive && actor.x === step.x && actor.y === step.y);
  if (occupied) return safePrev;

  const next: SoloGameState = {
    ...safePrev,
    player: {
      ...safePrev.player,
      inventory: safePrev.player.inventory.map((item) => ({ ...item })),
      x: step.x,
      y: step.y,
    },
    quests: safePrev.quests.map((quest) => ({ ...quest })),
    actors: safePrev.actors.map((actor) => ({ ...actor })),
    log: [...safePrev.log],
    revealedChunks: [...safePrev.revealedChunks],
    incidents: safePrev.incidents.map((entry) => ({ ...entry })),
    bounties: safePrev.bounties.map((entry) => ({ ...entry })),
    followers: safePrev.followers.map((entry) => ({ ...entry })),
    factionReputations: { ...safePrev.factionReputations },
    zoneReputations: { ...safePrev.zoneReputations },
    worldDirector: { ...safePrev.worldDirector },
    recentActionSignatures: [...safePrev.recentActionSignatures],
    entityStates: cloneEntityStates(safePrev.entityStates),
    lastAction: "Deplacement",
    lastNarration: "Tu avances d une case.",
  };

  revealPlayerChunk(next);
  checkTileTriggers(next);
  applyImmediateThreatReaction(next);
  checkLifeAndRespawn(next);

  if (next.log.length > CONFIG.log.maxEntries) {
    next.log = next.log.slice(-CONFIG.log.trimTo);
  }

  return next;
}

function applyMovement(state: SoloGameState, rawDx: number, rawDy: number): void {
  const dx = clamp(Math.round(rawDx), -MAX_MOVE_TILES_PER_TURN, MAX_MOVE_TILES_PER_TURN);
  const dy = clamp(Math.round(rawDy), -MAX_MOVE_TILES_PER_TURN, MAX_MOVE_TILES_PER_TURN);
  if (dx === 0 && dy === 0) return;

  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);

  for (let i = 0; i < Math.abs(dx); i += 1) {
    const nx = state.player.x + stepX;
    const ny = state.player.y;
    if (!inBounds(nx, ny)) break;
    const tile = state.tiles[idxOf(nx, ny)];
    if (!tile || tile.blocked) break;
    state.player.x = nx;
  }

  for (let i = 0; i < Math.abs(dy); i += 1) {
    const nx = state.player.x;
    const ny = state.player.y + stepY;
    if (!inBounds(nx, ny)) break;
    const tile = state.tiles[idxOf(nx, ny)];
    if (!tile || tile.blocked) break;
    state.player.y = ny;
  }
}

function applyMovePath(state: SoloGameState, path: Array<{ x: number; y: number }>): void {
  let remaining = MAX_MOVE_TILES_PER_TURN;
  for (const step of path) {
    if (remaining <= 0) break;
    if (!inBounds(step.x, step.y)) break;
    const distance = manhattan(step.x, step.y, state.player.x, state.player.y);
    if (distance !== 1) break;
    const tile = state.tiles[idxOf(step.x, step.y)];
    if (!tile || tile.blocked) break;
    const occupied = state.actors.some((actor) => actor.alive && actor.x === step.x && actor.y === step.y);
    if (occupied) break;
    state.player.x = step.x;
    state.player.y = step.y;
    remaining -= 1;
  }
}

function applyTerrainChange(
  state: SoloGameState,
  change: TerrainChange,
  ensureTiles: () => Tile[]
): void {
  const x = state.player.x + clamp(Math.round(change.dx), -6, 6);
  const y = state.player.y + clamp(Math.round(change.dy), -6, 6);
  if (!inBounds(x, y)) return;

  const tiles = ensureTiles();
  const index = idxOf(x, y);
  const current = tiles[index];
  tiles[index] = {
    terrain: change.terrain,
    blocked: typeof change.blocked === "boolean" ? change.blocked : current.blocked,
    destructible:
      typeof change.destructible === "boolean" ? change.destructible : current.destructible,
    poi: typeof change.poi !== "undefined" ? change.poi : current.poi,
    prop: typeof change.prop !== "undefined" ? change.prop : current.prop,
  };
}

function applyDestroy(
  state: SoloGameState,
  rawDx: number,
  rawDy: number,
  ensureTiles: () => Tile[]
): void {
  const x = state.player.x + clamp(Math.round(rawDx), -3, 3);
  const y = state.player.y + clamp(Math.round(rawDy), -3, 3);
  if (!inBounds(x, y)) return;

  const tiles = ensureTiles();
  const index = idxOf(x, y);
  const tile = tiles[index];
  if (!tile.destructible) {
    appendLog(state, "SYSTEM: Rien de destructible ici.");
    return;
  }

  const dropped = tile.prop === "tree" ? "bois" : tile.prop === "rock" ? "pierre brute" : "materiau";
  addInventoryItem(state, dropped, 1);

  tiles[index] = {
    ...tile,
    blocked: false,
    destructible: false,
    prop: tile.prop === "tree" ? "stump" : "none",
    terrain: tile.terrain === "forest" ? "grass" : tile.terrain,
    poi: tile.poi,
  };
}

function applyAttack(
  state: SoloGameState,
  rawPower: number,
  roll: number | null,
  targetActorId?: string
): void {
  let targetIndex =
    typeof targetActorId === "string"
      ? state.actors.findIndex((actor) => actor.id === targetActorId && actor.alive)
      : nearestHostileIndex(state, 3);
  if (targetIndex < 0) {
    targetIndex = nearestHostileIndex(state, 2);
  }
  if (targetIndex < 0) {
    const approachSteps =
      typeof roll === "number" ? (roll >= 15 ? 8 : roll >= 11 ? 6 : roll >= 6 ? 5 : 4) : 6;
    if (approachNearestHostile(state, approachSteps)) {
      appendLog(state, "SYSTEM: Tu te rapproches de la cible hostile.");
      targetIndex = nearestHostileIndex(state, 2);
    }
    if (targetIndex < 0) {
      appendLog(state, "SYSTEM: Aucune cible a portee.");
      return;
    }
  }

  const targetDistance = manhattan(state.actors[targetIndex].x, state.actors[targetIndex].y, state.player.x, state.player.y);
  if (targetDistance > 1) {
    appendLog(state, "SYSTEM: La cible est encore hors de portee.");
    return;
  }

  const power = clamp(Math.round(rawPower) + Math.floor(state.player.strength / CONFIG.combat.strengthDivisor), 1, 99);
  const actor = state.actors[targetIndex];
  actor.hp -= power;

  if (actor.hp <= 0) {
    actor.hp = 0;
    actor.alive = false;
    state.player.gold += actor.kind === "boss" ? CONFIG.combat.bossCompletionGold : CONFIG.combat.regularEnemyGold;
    state.player.stress = Math.max(0, state.player.stress - CONFIG.combat.stressReliefOnKill);
    appendLog(state, `SYSTEM: ${actor.name} est vaincu.`);
  } else if (typeof roll === "number" && roll <= CONFIG.combat.failedAttackRollThreshold) {
    state.player.hp = Math.max(0, state.player.hp - CONFIG.combat.damageOnFailedAttack);
    state.player.stress = clamp(state.player.stress + CONFIG.combat.stressGainOnHit, 0, MAX_STRESS);
  }
}

function applyNpcTalk(state: SoloGameState, forcedSpeech?: string | null, actorId?: string): void {
  const speaker =
    typeof actorId === "string"
      ? state.actors.find((actor) => actor.id === actorId && actor.alive && !actor.hostile) ?? null
      : nearestNpc(state, 3);
  if (!speaker) {
    appendLog(state, "SYSTEM: Aucun PNJ assez proche pour discuter.");
    return;
  }

  const line =
    forcedSpeech && forcedSpeech.trim().length > 0
      ? forcedSpeech.trim()
      : speaker.dialogue[Math.floor(Math.random() * speaker.dialogue.length)] ||
        "Le PNJ te regarde en silence.";
  appendLog(state, `${speaker.name}: ${line}`);

  if (speaker.id === "npc_innkeeper") {
    state.player.stress = Math.max(0, state.player.stress - CONFIG.inn.stressReliefOnTalk);
    state.player.hp = clamp(state.player.hp + CONFIG.inn.healOnTalk, 0, state.player.maxHp);
  }
}

function applyQuestBoard(state: SoloGameState): void {
  if (!isNearPoi(state, "guild", 1)) {
    appendLog(state, "SYSTEM: Tu dois etre a la guilde pour gerer les quetes.");
    return;
  }

  const first = state.quests.find((quest) => !quest.done && quest.id === "quest_guild_notice");
  if (!first) {
    appendLog(state, "SYSTEM: Plus aucune quete disponible a ce rang.");
    return;
  }

  first.progress = first.target;
  first.done = true;
  state.player.gold += first.rewardGold;
  appendLog(state, `SYSTEM: Quete terminee: ${first.title}. +${first.rewardGold} or.`);
}

function buyInventoryItem(state: SoloGameState, name: string, qty: number): void {
  if (!isNearPoi(state, "shop", 1)) {
    appendLog(state, "SYSTEM: Achats possibles uniquement a la boutique.");
    return;
  }

  const entry = findShopCatalogEntry(name);
  if (!entry) {
    appendLog(state, "SYSTEM: Le marchand ne vend pas cet objet.");
    return;
  }

  const quantity = Math.max(1, Math.round(qty));
  const unitPrice = getShopPrice(entry, state.player.shopDiscountPercent);
  const totalCost = unitPrice * quantity;
  if (state.player.gold < totalCost) {
    appendLog(state, `SYSTEM: Pas assez d or (cout ${totalCost}).`);
    return;
  }

  state.player.gold -= totalCost;
  addInventoryItem(state, entry.name, quantity);
  appendLog(state, `SYSTEM: Achat de ${entry.name} x${quantity} (${unitPrice} or l unite).`);
}

function sellInventoryItem(state: SoloGameState, rawName: string, qty: number): void {
  if (!isNearPoi(state, "shop", 1)) {
    appendLog(state, "SYSTEM: Ventes possibles uniquement a la boutique.");
    return;
  }

  const found = findInventoryItemEntry(state, rawName);
  if (!found) {
    appendLog(state, "SYSTEM: Tu ne possedes pas cet objet.");
    return;
  }

  const quantity = clamp(Math.max(1, Math.round(qty)), 1, found.qty);
  const catalogEntry = findShopCatalogEntry(found.name);
  const unitPrice = catalogEntry ? Math.max(1, Math.floor(catalogEntry.price * CONFIG.shop.defaultResalePercent / 100)) : found.sprite ? CONFIG.shop.fallbackSellPriceWithSprite : CONFIG.shop.fallbackSellPriceNoSprite;
  const totalGain = unitPrice * quantity;

  found.qty -= quantity;
  if (found.qty <= 0) {
    state.player.inventory = state.player.inventory.filter((entry) => entry.id !== found.id);
    if (state.player.equippedItemId === found.id) {
      state.player.equippedItemId = null;
      state.player.equippedItemName = null;
      state.player.equippedItemSprite = null;
    }
  }

  state.player.gold += totalGain;
  appendLog(state, `SYSTEM: Vente de ${found.name} x${quantity}. +${totalGain} or.`);
}

function moveTowardPoi(state: SoloGameState, poi: Exclude<PoiType, null>, steps: number): void {
  for (let step = 0; step < steps; step += 1) {
    const next = nextStepTowardPoi(state, poi);
    if (!next) return;
    state.player.x = next.x;
    state.player.y = next.y;
    const tile = getTile(state, state.player.x, state.player.y);
    if (tile?.poi === poi) return;
  }
}

function approachNearestHostile(state: SoloGameState, steps: number): boolean {
  let moved = false;
  for (let step = 0; step < steps; step += 1) {
    const next = nextStepTowardNearestHostile(state);
    if (!next) break;
    state.player.x = next.x;
    state.player.y = next.y;
    moved = true;
    if (nearestHostileIndex(state, 2) >= 0) break;
  }
  return moved;
}

function addInventoryItem(state: SoloGameState, name: string, qty: number): void {
  const asset = resolveItemAsset(name);
  const quantity = Math.max(1, Math.round(qty));
  const found = state.player.inventory.find((entry) => entry.id === asset.id);

  if (found) {
    found.qty += quantity;
    return;
  }

  state.player.inventory.push({
    id: asset.id,
    itemId: asset.itemId,
    name: asset.name,
    qty: quantity,
    icon: asset.icon,
    sprite: asset.sprite,
    emoji: asset.emoji,
  });
}

function spawnRelativeActor(state: SoloGameState, spawn: SpawnActor): void {
  const x = state.player.x + clamp(Math.round(spawn.dx), -6, 6);
  const y = state.player.y + clamp(Math.round(spawn.dy), -6, 6);
  if (!inBounds(x, y)) return;

  const tile = state.tiles[idxOf(x, y)];
  if (tile.blocked) return;

  const hp = clamp(Math.round(spawn.hp), 1, 120);
  state.actors.push({
    id: `spawn_${state.turn}_${state.actors.length}`,
    name: spawn.name.trim() || "Entite",
    kind: spawn.kind,
    x,
    y,
    hp,
    maxHp: hp,
    hostile: spawn.hostile,
    alive: true,
    sprite: spawn.sprite,
    face: spawn.face,
    dialogue: spawn.hostile ? [] : ["Bonjour aventurier."],
    faction: spawn.faction,
    role: spawn.role,
    profession: spawn.profession,
    personality: spawn.personality,
    loreSummary: spawn.loreSummary,
    recruitmentEligible: spawn.recruitmentEligible,
    recruitmentMode: spawn.recruitmentMode,
    strength: spawn.strength,
    speed: spawn.speed,
    willpower: spawn.willpower,
    magic: spawn.magic,
    aura: spawn.aura,
    defense: spawn.defense,
    precision: spawn.precision,
    evasion: spawn.evasion,
    perception: spawn.perception,
    discretion: spawn.discretion,
    chance: spawn.chance,
    initiative: spawn.initiative,
    charisma: spawn.charisma,
    endurance: spawn.endurance,
    resonance: spawn.resonance,
    combatLevel: spawn.combatLevel,
    patrol: { axis: "x", range: 0.6, speed: 0.8, phase: state.turn % 7 },
  });
}

function findInventoryItemEntry(state: SoloGameState, rawName: string) {
  const normalized = normalizeName(rawName);
  if (!normalized) return null;

  let best: SoloGameState["player"]["inventory"][number] | null = null;
  let bestScore = 0;
  for (const entry of state.player.inventory) {
    const entryName = normalizeName(entry.name);
    const score =
      normalized === entryName ? 5 : entryName.includes(normalized) || normalized.includes(entryName) ? 2 : 0;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

function checkTileTriggers(state: SoloGameState): void {
  const tile = getTile(state, state.player.x, state.player.y);
  if (!tile) return;

  if (tile.poi === "inn") {
    state.player.stress = Math.max(0, state.player.stress - CONFIG.inn.stressReliefOnVisit);
  }

  if (tile.poi === "dungeon_gate") {
    const quest = state.quests.find((entry) => entry.id === "quest_dungeon_core" && !entry.done);
    if (quest) {
      quest.progress = quest.target;
      quest.done = true;
      state.player.gold += quest.rewardGold;
      addInventoryItem(state, "relique ancienne", 1);
      appendLog(state, "SYSTEM: Tu as recupere une relique du donjon.");
    }
  }

  if (tile.poi === "boss_gate") {
    const bossAlive = state.actors.some((actor) => actor.kind === "boss" && actor.alive);
    if (!bossAlive) {
      const quest = state.quests.find((entry) => entry.id === "quest_demon_king");
      if (quest && !quest.done) {
        quest.progress = quest.target;
        quest.done = true;
        state.player.gold += quest.rewardGold;
      }
    }
  }
}

function syncQuestProgress(state: SoloGameState): void {
  const killQuest = state.quests.find((quest) => quest.id === "quest_demon_king");
  if (killQuest && !killQuest.done) {
    const bossAlive = state.actors.some((actor) => actor.kind === "boss" && actor.alive);
    if (!bossAlive) {
      killQuest.progress = killQuest.target;
      killQuest.done = true;
      state.player.gold += killQuest.rewardGold;
      appendLog(state, `SYSTEM: Quete terminee: ${killQuest.title}. +${killQuest.rewardGold} or.`);
    }
  }

  updateRank(state);
}

function updateRank(state: SoloGameState): void {
  const completed = state.quests.filter((quest) => quest.done).length;
  const previous = state.player.rank;
  let next = previous;
  if (completed >= CONFIG.rank.thresholds.S) next = "S";
  else if (completed >= CONFIG.rank.thresholds.A) next = "A";
  else if (completed >= CONFIG.rank.thresholds.B) next = "B";
  else next = "C";

  if (next !== previous) {
    state.player.rank = next;
    appendLog(state, `SYSTEM: Rang mis a jour: ${next}.`);
  }
}

function checkLifeAndRespawn(state: SoloGameState): void {
  if (state.player.hp > 0) return;

  state.player.lives -= 1;
  appendLog(state, "SYSTEM: Tu tombes au combat.");

  if (state.player.lives <= 0) {
    state.status = "defeat";
    appendLog(state, "SYSTEM: Plus aucune vie. Game over.");
    return;
  }

  const lostGold = Math.floor(state.player.gold * CONFIG.player.deathGoldLossPercent / 100);
  state.player.gold -= lostGold;
  state.player.inventory = [];
  state.player.equippedItemId = null;
  state.player.equippedItemName = null;
  state.player.equippedItemSprite = null;
  state.player.hp = state.player.maxHp;
  state.player.stress = Math.max(0, state.player.stress - CONFIG.player.deathStressRelief);
  state.player.x = CONFIG.player.respawnPosition.x;
  state.player.y = CONFIG.player.respawnPosition.y;
  appendLog(state, `SYSTEM: Respawn au camp. Vie restante: ${state.player.lives}. Tu perds ${lostGold} or.`);
}

function revealPlayerChunk(state: SoloGameState): void {
  const { cx, cy } = chunkOf(state.player.x, state.player.y);
  const key = chunkKey(cx, cy);
  if (!state.revealedChunks.includes(key)) {
    state.revealedChunks.push(key);
    appendLog(state, `SYSTEM: Nouvelle zone decouverte (${cx},${cy}).`);
  }
}

function applyImmediateThreatReaction(state: SoloGameState): void {
  const hostileIndex = nearestHostileIndex(state, 1);
  if (hostileIndex < 0) return;
  const actor = state.actors[hostileIndex];
  const damage = clamp(Math.round(((actor.strength ?? actor.maxHp / 2 + 4) + (actor.combatLevel ?? 4)) / 14), 1, actor.kind === "boss" ? 4 : 2);
  state.player.hp = Math.max(0, state.player.hp - damage);
  state.player.stress = clamp(state.player.stress + 3, 0, MAX_STRESS);
  appendLog(state, `ENNEMI: ${actor.name} profite de ta proximite (${damage}).`);
}

function nearestHostileIndex(state: SoloGameState, range: number): number {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < state.actors.length; i += 1) {
    const actor = state.actors[i];
    if (!actor.alive || !actor.hostile) continue;
    const distance = manhattan(actor.x, actor.y, state.player.x, state.player.y);
    if (distance > range) continue;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function nearestNpc(state: SoloGameState, range: number): WorldActor | null {
  let best: WorldActor | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const actor of state.actors) {
    if (!actor.alive || actor.hostile || actor.kind === "monster" || actor.kind === "boss") continue;
    const distance = manhattan(actor.x, actor.y, state.player.x, state.player.y);
    if (distance > range) continue;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = actor;
    }
  }
  return best;
}

function nextStepTowardPoi(
  state: SoloGameState,
  poi: Exclude<PoiType, null>
): { x: number; y: number } | null {
  const width = state.worldWidth;
  const height = state.worldHeight;
  const size = width * height;

  const startX = state.player.x;
  const startY = state.player.y;
  const start = idxOf(startX, startY);

  const targetSet = new Set<number>();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = state.tiles[idxOf(x, y)];
      if (tile?.poi === poi) targetSet.add(idxOf(x, y));
    }
  }
  if (targetSet.size === 0) return null;
  if (targetSet.has(start)) return null;

  const visited = new Uint8Array(size);
  const prev = new Int32Array(size);
  prev.fill(-1);

  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;

  visited[start] = 1;
  queue[tail] = start;
  tail += 1;

  let found = -1;
  while (head < tail) {
    const current = queue[head];
    head += 1;

    if (targetSet.has(current)) {
      found = current;
      break;
    }

    const x = current % width;
    const y = Math.floor(current / width);
    const neighbors: Array<{ x: number; y: number }> = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (const n of neighbors) {
      if (!inBounds(n.x, n.y)) continue;
      const ni = idxOf(n.x, n.y);
      if (visited[ni]) continue;
      const tile = state.tiles[ni];
      if (!tile || tile.blocked) continue;
      visited[ni] = 1;
      prev[ni] = current;
      queue[tail] = ni;
      tail += 1;
    }
  }

  if (found < 0) return null;

  let cursor = found;
  while (prev[cursor] !== start && prev[cursor] !== -1) {
    cursor = prev[cursor];
  }
  if (prev[cursor] === -1) return null;

  return {
    x: cursor % width,
    y: Math.floor(cursor / width),
  };
}

function nextStepTowardNearestHostile(state: SoloGameState): { x: number; y: number } | null {
  const width = state.worldWidth;
  const height = state.worldHeight;
  const size = width * height;
  const start = idxOf(state.player.x, state.player.y);

  const targetSet = new Set<number>();
  for (const actor of state.actors) {
    if (!actor.alive || !actor.hostile) continue;
    if (!inBounds(actor.x, actor.y)) continue;
    targetSet.add(idxOf(actor.x, actor.y));
  }
  if (targetSet.size === 0) return null;

  const visited = new Uint8Array(size);
  const prev = new Int32Array(size);
  prev.fill(-1);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;

  visited[start] = 1;
  queue[tail] = start;
  tail += 1;

  let found = -1;
  while (head < tail) {
    const current = queue[head];
    head += 1;

    if (targetSet.has(current)) {
      found = current;
      break;
    }

    const x = current % width;
    const y = Math.floor(current / width);
    const neighbors: Array<{ x: number; y: number }> = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (const n of neighbors) {
      if (!inBounds(n.x, n.y)) continue;
      const ni = idxOf(n.x, n.y);
      if (visited[ni]) continue;
      const tile = state.tiles[ni];
      if (!tile || tile.blocked) continue;
      visited[ni] = 1;
      prev[ni] = current;
      queue[tail] = ni;
      tail += 1;
    }
  }

  if (found < 0) return null;
  let cursor = found;
  while (prev[cursor] !== start && prev[cursor] !== -1) {
    cursor = prev[cursor];
  }
  if (prev[cursor] === -1) return null;
  return {
    x: cursor % width,
    y: Math.floor(cursor / width),
  };
}

function isNearPoi(
  state: SoloGameState,
  poi: Exclude<PoiType, null>,
  distance: number
): boolean {
  for (let dy = -distance; dy <= distance; dy += 1) {
    for (let dx = -distance; dx <= distance; dx += 1) {
      if (Math.abs(dx) + Math.abs(dy) > distance) continue;
      const x = state.player.x + dx;
      const y = state.player.y + dy;
      if (!inBounds(x, y)) continue;
      const tile = state.tiles[idxOf(x, y)];
      if (tile?.poi === poi) return true;
    }
  }
  return false;
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function cloneEntityStates(
  states: Record<WorldEntityRef, WorldEntityState>
): Record<WorldEntityRef, WorldEntityState> {
  const next: Record<WorldEntityRef, WorldEntityState> = {};
  for (const [ref, entry] of Object.entries(states)) {
    next[ref] = {
      ...entry,
      inventory: entry.inventory.map((item) => ({ ...item, tags: item.tags ? [...item.tags] : [] })),
      equipment: { ...entry.equipment },
      tags: [...entry.tags],
      states: [...entry.states],
      accessPolicy: entry.accessPolicy ? { ...entry.accessPolicy } : null,
    };
  }
  return next;
}

function getOrCreateEntityState(state: SoloGameState, ref: WorldEntityRef): WorldEntityState {
  const existing = state.entityStates[ref];
  if (existing) return existing;
  const created: WorldEntityState = {
    ref,
    ownerRef: null,
    faction: null,
    inventory: [],
    equipment: {},
    tags: [],
    states: [],
    witnessRange: 0,
    accessPolicy: null,
  };
  state.entityStates[ref] = created;
  return created;
}

function findEntityInventoryEntry(state: WorldEntityState, rawName: string): EntityInventoryItem | null {
  const normalizedNeedle = normalizeName(rawName);
  if (!normalizedNeedle) return null;
  let best: EntityInventoryItem | null = null;
  let bestScore = 0;
  for (const item of state.inventory) {
    const normalizedItem = normalizeName(item.name);
    const score =
      normalizedItem === normalizedNeedle
        ? 5
        : normalizedItem.includes(normalizedNeedle) || normalizedNeedle.includes(normalizedItem)
          ? 2
          : 0;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

function addEntityInventoryItem(state: SoloGameState, ref: WorldEntityRef, name: string, qty: number): void {
  const entity = getOrCreateEntityState(state, ref);
  const asset = resolveItemAsset(name);
  const existing = entity.inventory.find((item) => item.name === asset.name);
  if (existing) {
    existing.qty += Math.max(1, Math.round(qty));
    return;
  }
  entity.inventory.push({
    id: `${ref}_${asset.id}`,
    itemId: asset.itemId,
    name: asset.name,
    qty: Math.max(1, Math.round(qty)),
    icon: asset.icon,
    sprite: asset.sprite,
    emoji: asset.emoji,
    ownerRef: ref,
    equippedSlot: null,
    tags: [],
  });
}

function removeEntityInventoryItem(state: SoloGameState, ref: WorldEntityRef, name: string, qty: number): boolean {
  const entity = getOrCreateEntityState(state, ref);
  const item = findEntityInventoryEntry(entity, name);
  if (!item) return false;
  const quantity = clamp(Math.max(1, Math.round(qty)), 1, item.qty);
  item.qty -= quantity;
  if (item.qty <= 0) {
    entity.inventory = entity.inventory.filter((entry) => entry.id !== item.id);
    for (const [slot, itemId] of Object.entries(entity.equipment)) {
      if (itemId === item.id) {
        delete entity.equipment[slot as keyof typeof entity.equipment];
      }
    }
  }
  return true;
}

function removePlayerInventoryItem(state: SoloGameState, rawName: string, qty: number): boolean {
  const found = findInventoryItemEntry(state, rawName);
  if (!found) return false;
  const quantity = clamp(Math.max(1, Math.round(qty)), 1, found.qty);
  found.qty -= quantity;
  if (found.qty <= 0) {
    state.player.inventory = state.player.inventory.filter((entry) => entry.id !== found.id);
    if (state.player.equippedItemId === found.id) {
      state.player.equippedItemId = null;
      state.player.equippedItemName = null;
      state.player.equippedItemSprite = null;
    }
  }
  return true;
}

function applyWorldOps(state: SoloGameState, ops: WorldOp[]): void {
  for (const op of ops) {
    if (op.type === "move_path") {
      applyMovePath(state, op.path);
      continue;
    }

    if (op.type === "adjust_player_gold") {
      state.player.gold = Math.max(0, state.player.gold + Math.round(op.delta));
      continue;
    }

    if (op.type === "set_shop_discount") {
      state.player.shopDiscountPercent = getShopDiscountPercent(op.percent);
      continue;
    }

    if (op.type === "transfer_item") {
      const quantity = Math.max(1, Math.round(op.qty));
      let transferred = true;
      if (op.fromRef && op.fromRef !== "player:self") {
        transferred = removeEntityInventoryItem(state, op.fromRef, op.itemName, quantity);
      } else if (op.fromRef === "player:self") {
        transferred = removePlayerInventoryItem(state, op.itemName, quantity);
      }

      if (!transferred && !op.createIfMissing) {
        continue;
      }

      if (op.toRef === "player:self") {
        addInventoryItem(state, op.itemName, quantity);
      } else {
        addEntityInventoryItem(state, op.toRef, op.itemName, quantity);
      }
      continue;
    }

    if (op.type === "record_incident") {
      state.incidents.push({
        ...op.incident,
        id: op.incident.id || `incident_${state.turn}_${state.incidents.length + 1}`,
        createdTurn: op.incident.createdTurn ?? state.turn,
      });
      continue;
    }

    if (op.type === "set_entity_state") {
      const entity = getOrCreateEntityState(state, op.ref);
      if (op.tags) entity.tags = [...op.tags];
      if (op.states) entity.states = [...op.states];
    }
  }
}

function appendLog(state: SoloGameState, line: string): void {
  state.log.push(line);
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildStoryLine(playerName: string, actionText: string): string {
  const action = actionText.trim().replace(/\s+/g, " ").slice(0, 160);
  if (!action) return `${playerName} hesite un instant.`;
  return `${playerName} veut ${action}.`;
}

export function describeLocation(state: SoloGameState): string {
  const tile = getTile(state, state.player.x, state.player.y);
  if (!tile) return "Zone inconnue";
  const poiText = tile.poi ? ` - ${poiLabel(tile.poi)}` : "";
  return `${terrainLabel(tile.terrain)}${poiText}`;
}
