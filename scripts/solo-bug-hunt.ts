import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";

type Severity = "high" | "medium" | "low";

type Finding = {
  severity: Severity;
  scope: string;
  message: string;
};

type Scenario = {
  id: string;
  actionText: string;
  setup: (state: SoloGameState) => SoloGameState;
  check: (input: ScenarioCheckInput) => Finding[];
};

type ScenarioCheckInput = {
  initial: SoloGameState;
  outcome: SoloOutcome;
  next: SoloGameState;
};

type SoloGameState = import("../lib/solo/types").SoloGameState;
type SoloOutcome = import("../lib/solo/types").SoloOutcome;
type PoiName = Exclude<import("../lib/solo/types").PoiType, null>;

delete process.env.GROQ_API_KEY;
delete process.env.GROQ_MODEL;

async function main(): Promise<void> {
  const world = await import("../lib/solo/world");
  const logic = await import("../lib/solo/logic");
  const resolveLib = await import("../lib/solo/resolve");
  const assets = await import("../lib/solo/assets");
  const shop = await import("../lib/solo/shop");

  const initial = world.createInitialSoloState({
    playerName: "Audit",
    powerText: "je lis les bugs",
    powerRoll: 12,
    powerAccepted: true,
    characterId: "Boy",
  });

  const findings: Finding[] = [];
  findings.push(...auditWorldLayout(initial));
  findings.push(...auditPoiReachability(initial));
  findings.push(...auditChunkTransitions(initial));
  findings.push(...auditBiomeConsistency(initial));
  findings.push(...auditPoiRoleConsistency(initial));
  findings.push(...auditCatalogConsistency(assets, shop));
  findings.push(...auditRouteBatch(initial, logic));
  findings.push(...(await auditScenarioBatch(initial, logic, resolveLib)));
  findings.push(...(await auditFuzzBatch(initial, logic, resolveLib)));

  const grouped = groupBySeverity(findings);
  const report = renderReport(grouped);
  const outputPath = resolvePath("docs", "SOLO_BUG_HUNT_REPORT.md");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, report, "utf8");

  process.stdout.write(report);
  if (grouped.high.length > 0) {
    process.exitCode = 1;
  }
}

function auditWorldLayout(state: SoloGameState): Finding[] {
  const findings: Finding[] = [];
  const actorIds = new Set<string>();
  const tileMap = new Map<string, string[]>();

  for (const actor of state.actors) {
    if (actorIds.has(actor.id)) {
      findings.push({
        severity: "high",
        scope: "world-layout",
        message: `Duplicate actor id: ${actor.id}`,
      });
    }
    actorIds.add(actor.id);

    if (!inBounds(state, actor.x, actor.y)) {
      findings.push({
        severity: "high",
        scope: "world-layout",
        message: `${actor.id} is out of bounds at (${actor.x},${actor.y}).`,
      });
      continue;
    }

    const tile = state.tiles[idxOf(state, actor.x, actor.y)];
    if (!tile) {
      findings.push({
        severity: "high",
        scope: "world-layout",
        message: `${actor.id} stands on a missing tile at (${actor.x},${actor.y}).`,
      });
      continue;
    }

    if (tile.blocked) {
      findings.push({
        severity: "high",
        scope: "world-layout",
        message: `${actor.id} stands on a blocked tile at (${actor.x},${actor.y}).`,
      });
    }

    const key = `${actor.x},${actor.y}`;
    const occupants = tileMap.get(key) ?? [];
    occupants.push(actor.id);
    tileMap.set(key, occupants);
  }

  tileMap.forEach((occupants, key) => {
    if (occupants.length <= 1) return;
    findings.push({
      severity: "medium",
      scope: "world-layout",
      message: `Multiple actors share tile ${key}: ${occupants.join(", ")}.`,
    });
  });

  if (!inBounds(state, state.player.x, state.player.y)) {
    findings.push({
      severity: "high",
      scope: "world-layout",
      message: `Player start is out of bounds at (${state.player.x},${state.player.y}).`,
    });
  } else {
    const tile = state.tiles[idxOf(state, state.player.x, state.player.y)];
    if (tile?.blocked) {
      findings.push({
        severity: "high",
        scope: "world-layout",
        message: `Player start is on a blocked tile at (${state.player.x},${state.player.y}).`,
      });
    }
    const actorHere = state.actors.find((actor) => actor.x === state.player.x && actor.y === state.player.y);
    if (actorHere) {
      findings.push({
        severity: "medium",
        scope: "world-layout",
        message: `Player start overlaps actor ${actorHere.id} at (${state.player.x},${state.player.y}).`,
      });
    }
  }

  return findings;
}

function auditPoiReachability(state: SoloGameState): Finding[] {
  const findings: Finding[] = [];
  const poiTargets: PoiName[] = ["camp", "guild", "shop", "inn", "house", "dungeon_gate", "boss_gate"];

  for (const poi of poiTargets) {
    const distance = shortestDistance(state, state.player.x, state.player.y, (x, y) => tileAt(state, x, y)?.poi === poi);
    if (distance === null) {
      findings.push({
        severity: "high",
        scope: "poi-reachability",
        message: `POI ${poi} is unreachable from the starting camp.`,
      });
    }
  }

  for (let cy = 0; cy < state.worldHeight / 16; cy += 1) {
    for (let cx = 0; cx < state.worldWidth / 16; cx += 1) {
      const startX = cx * 16;
      const startY = cy * 16;
      const distance = shortestDistance(state, state.player.x, state.player.y, (x, y) => {
        if (x < startX || x >= startX + 16 || y < startY || y >= startY + 16) return false;
        const tile = tileAt(state, x, y);
        return !!tile && !tile.blocked;
      });
      if (distance === null) {
        findings.push({
          severity: "high",
          scope: "poi-reachability",
          message: `Chunk (${cx},${cy}) has no reachable walkable tile from camp.`,
        });
      }
    }
  }

  return findings;
}

function auditChunkTransitions(state: SoloGameState): Finding[] {
  const findings: Finding[] = [];

  for (let boundaryX = 16; boundaryX < state.worldWidth - 1; boundaryX += 16) {
    let passablePairs = 0;
    for (let y = 0; y < state.worldHeight; y += 1) {
      const left = tileAt(state, boundaryX - 1, y);
      const right = tileAt(state, boundaryX, y);
      if (left && right && !left.blocked && !right.blocked) {
        passablePairs += 1;
      }
    }
    if (passablePairs === 0) {
      findings.push({
        severity: "high",
        scope: "chunk-transition",
        message: `No walkable crossing found on vertical chunk boundary x=${boundaryX}.`,
      });
    }
  }

  for (let boundaryY = 16; boundaryY < state.worldHeight - 1; boundaryY += 16) {
    let passablePairs = 0;
    for (let x = 0; x < state.worldWidth; x += 1) {
      const top = tileAt(state, x, boundaryY - 1);
      const bottom = tileAt(state, x, boundaryY);
      if (top && bottom && !top.blocked && !bottom.blocked) {
        passablePairs += 1;
      }
    }
    if (passablePairs === 0) {
      findings.push({
        severity: "high",
        scope: "chunk-transition",
        message: `No walkable crossing found on horizontal chunk boundary y=${boundaryY}.`,
      });
    }
  }

  return findings;
}

function auditBiomeConsistency(state: SoloGameState): Finding[] {
  const findings: Finding[] = [];

  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      const tile = tileAt(state, x, y);
      if (!tile) continue;

      if ((tile.prop === "tree" || tile.prop === "stump") && tile.terrain !== "forest" && tile.terrain !== "grass") {
        findings.push({
          severity: "medium",
          scope: "biome-consistency",
          message: `${tile.prop} at (${x},${y}) is on ${tile.terrain} instead of forest/grass.`,
        });
      }
      if ((tile.prop === "cactus" || tile.prop === "palm") && tile.terrain !== "desert") {
        findings.push({
          severity: "medium",
          scope: "biome-consistency",
          message: `${tile.prop} at (${x},${y}) is on ${tile.terrain} instead of desert.`,
        });
      }
      if (tile.prop === "crate" && tile.terrain !== "dungeon" && tile.terrain !== "boss") {
        findings.push({
          severity: "medium",
          scope: "biome-consistency",
          message: `crate at (${x},${y}) is on ${tile.terrain} instead of dungeon/boss.`,
        });
      }
    }
  }

  for (const actor of state.actors) {
    const tile = tileAt(state, actor.x, actor.y);
    if (!tile) continue;

    if (actor.hostile && tile.terrain === "village") {
      findings.push({
        severity: "high",
        scope: "biome-consistency",
        message: `Hostile actor ${actor.id} spawned in the village chunk.`,
      });
    }

    if (actor.id.includes("_forest") && (tile.terrain === "road" || (tile.terrain !== "forest" && tile.terrain !== "grass"))) {
      findings.push({
        severity: "medium",
        scope: "biome-consistency",
        message: `Forest-tagged actor ${actor.id} stands on ${tile.terrain}.`,
      });
    }

    if (actor.id.includes("_desert") && (tile.terrain === "road" || tile.terrain !== "desert")) {
      findings.push({
        severity: "medium",
        scope: "biome-consistency",
        message: `Desert-tagged actor ${actor.id} stands on ${tile.terrain}.`,
      });
    }

    if (actor.id.startsWith("npc_") && !actor.id.includes("forest") && !actor.id.includes("desert")) {
      const chunkX = Math.floor(actor.x / 16);
      const chunkY = Math.floor(actor.y / 16);
      if (chunkX !== 1 || chunkY !== 1) {
        findings.push({
          severity: "medium",
          scope: "biome-consistency",
          message: `Village NPC ${actor.id} is outside the central village chunk.`,
        });
      }
    }
  }

  return findings;
}

function auditPoiRoleConsistency(state: SoloGameState): Finding[] {
  const findings: Finding[] = [];
  const checks: Array<{ actorId: string; poi: PoiName; maxDistance: number }> = [
    { actorId: "npc_shopkeeper", poi: "shop", maxDistance: 2 },
    { actorId: "npc_guild_master", poi: "guild", maxDistance: 2 },
    { actorId: "npc_innkeeper", poi: "inn", maxDistance: 1 },
  ];

  for (const check of checks) {
    const actor = state.actors.find((entry) => entry.id === check.actorId);
    const poiTiles = findPoiTiles(state, check.poi);
    if (!actor || poiTiles.length === 0) {
      findings.push({
        severity: "high",
        scope: "poi-role",
        message: `Missing actor or POI for ${check.actorId}/${check.poi}.`,
      });
      continue;
    }

    const distance = poiTiles.reduce((best, entry) => Math.min(best, manhattan(actor.x, actor.y, entry.x, entry.y)), Number.POSITIVE_INFINITY);
    if (distance > check.maxDistance) {
      findings.push({
        severity: "medium",
        scope: "poi-role",
        message: `${check.actorId} is too far from ${check.poi} (distance ${distance}).`,
      });
    }
  }

  return findings;
}

function auditCatalogConsistency(
  assets: typeof import("../lib/solo/assets"),
  shop: typeof import("../lib/solo/shop")
): Finding[] {
  const findings: Finding[] = [];

  for (const entry of shop.SHOP_CATALOG) {
    const asset = assets.resolveItemAsset(entry.name);
    if (!asset.itemId) {
      findings.push({
        severity: "medium",
        scope: "shop-catalog",
        message: `${entry.name} has no resolved item asset id.`,
      });
    }
    if (normalize(asset.name) !== normalize(entry.name)) {
      findings.push({
        severity: "medium",
        scope: "shop-catalog",
        message: `${entry.name} resolves to mismatched asset name ${asset.name}.`,
      });
    }
  }

  return findings;
}

function auditRouteBatch(
  base: SoloGameState,
  logic: typeof import("../lib/solo/logic")
): Finding[] {
  const findings: Finding[] = [];
  const routes: Array<{ id: string; poi: PoiName; maxTurns: number; start?: { x: number; y: number } }> = [
    { id: "route_to_shop", poi: "shop", maxTurns: 2 },
    { id: "route_to_guild", poi: "guild", maxTurns: 2 },
    { id: "route_to_inn", poi: "inn", maxTurns: 2 },
    { id: "route_to_house", poi: "house", maxTurns: 2 },
    { id: "route_to_dungeon_gate", poi: "dungeon_gate", maxTurns: 2 },
    { id: "route_to_boss_gate", poi: "boss_gate", maxTurns: 3 },
    { id: "route_back_to_camp", poi: "camp", maxTurns: 3, start: { x: 40, y: 40 } },
  ];

  for (const route of routes) {
    let state = cloneState(base);
    if (route.start) {
      state.player.x = route.start.x;
      state.player.y = route.start.y;
    }

    let reached = tileAt(state, state.player.x, state.player.y)?.poi === route.poi;
    for (let turn = 0; turn < route.maxTurns && !reached; turn += 1) {
      const next = logic.applyOutcome(state, {
        narrative: "route test",
        storyLine: "route test",
        diceRoll: null,
        moveToPoi: route.poi,
        moveToPoiSteps: 24,
      });
      findings.push(...runStateInvariantChecks(next, `route:${route.id}:turn:${turn + 1}`));

      if (next.player.x === state.player.x && next.player.y === state.player.y) {
        findings.push({
          severity: "high",
          scope: `route:${route.id}`,
          message: `Pathing toward ${route.poi} stalled at (${state.player.x},${state.player.y}).`,
        });
        break;
      }

      state = next;
      reached = tileAt(state, state.player.x, state.player.y)?.poi === route.poi;
    }

    if (!reached) {
      findings.push({
        severity: "high",
        scope: `route:${route.id}`,
        message: `Did not reach ${route.poi} within ${route.maxTurns} route turns.`,
      });
    }
  }

  return findings;
}

async function auditScenarioBatch(
  base: SoloGameState,
  logic: typeof import("../lib/solo/logic"),
  resolveLib: typeof import("../lib/solo/resolve")
): Promise<Finding[]> {
  const treeTarget = findTile(base, (tile) => tile.prop === "tree");
  const scenarios: Scenario[] = [
    {
      id: "remote_buy_walks_first",
      actionText: "j achete potion de soin",
      setup: (state) => state,
      check: ({ initial, outcome, next }) => {
        const out: Finding[] = [];
        const initialPotion = itemQty(initial, "Potion de soin");
        const nextPotion = itemQty(next, "Potion de soin");
        if (typeof outcome.buyItemName === "string" && outcome.buyItemName.trim().length > 0) {
          out.push({
            severity: "high",
            scope: "scenario:remote_buy_walks_first",
            message: "Remote buy still returns buyItemName in the same turn.",
          });
        }
        if (outcome.moveToPoi !== "shop") {
          out.push({
            severity: "high",
            scope: "scenario:remote_buy_walks_first",
            message: `Remote buy should route to shop first, got ${String(outcome.moveToPoi)}.`,
          });
        }
        if (next.player.gold !== initial.player.gold) {
          out.push({
            severity: "high",
            scope: "scenario:remote_buy_walks_first",
            message: `Remote buy changed gold immediately (${initial.player.gold} -> ${next.player.gold}).`,
          });
        }
        if (nextPotion !== initialPotion) {
          out.push({
            severity: "high",
            scope: "scenario:remote_buy_walks_first",
            message: "Remote buy added an item before arrival at the shop.",
          });
        }
        return out;
      },
    },
    {
      id: "remote_quest_walks_first",
      actionText: "je prends la quete de la guilde",
      setup: (state) => state,
      check: ({ initial, outcome, next }) => {
        const out: Finding[] = [];
        const doneBefore = initial.quests.filter((quest) => quest.done).length;
        const doneAfter = next.quests.filter((quest) => quest.done).length;
        if (outcome.requestQuest) {
          out.push({
            severity: "high",
            scope: "scenario:remote_quest_walks_first",
            message: "Remote quest request resolves immediately instead of walking first.",
          });
        }
        if (doneAfter > doneBefore) {
          out.push({
            severity: "high",
            scope: "scenario:remote_quest_walks_first",
            message: "Quest completed before the player reached the guild.",
          });
        }
        return out;
      },
    },
    {
      id: "ambiguous_house_requires_clarification",
      actionText: "je vais a la maison",
      setup: (state) => state,
      check: ({ initial, outcome, next }) => {
        const out: Finding[] = [];
        if (next.player.x !== initial.player.x || next.player.y !== initial.player.y) {
          out.push({
            severity: "high",
            scope: "scenario:ambiguous_house_requires_clarification",
            message: "Ambiguous house command moved the player anyway.",
          });
        }
        if (!/precise|plus proche/i.test(outcome.narrative)) {
          out.push({
            severity: "medium",
            scope: "scenario:ambiguous_house_requires_clarification",
            message: "Ambiguous house command does not explain how to disambiguate.",
          });
        }
        return out;
      },
    },
    {
      id: "attacking_merchant_does_not_damage_npc",
      actionText: "j attaque le marchand",
      setup: (state) => withPlayerAt(state, 26, 24),
      check: ({ initial, next }) => {
        const out: Finding[] = [];
        const merchantBefore = initial.actors.find((actor) => actor.id === "npc_shopkeeper");
        const merchantAfter = next.actors.find((actor) => actor.id === "npc_shopkeeper");
        if (merchantBefore && merchantAfter && merchantAfter.hp !== merchantBefore.hp) {
          out.push({
            severity: "high",
            scope: "scenario:attacking_merchant_does_not_damage_npc",
            message: `Merchant HP changed unexpectedly (${merchantBefore.hp} -> ${merchantAfter.hp}).`,
          });
        }
        return out;
      },
    },
    {
      id: "destroy_tree_is_stable",
      actionText: "je coupe au nord",
      setup: (state) => {
        if (!treeTarget) return state;
        return withPlayerAt(state, treeTarget.x, treeTarget.y + 1);
      },
      check: ({ next }) => {
        const out: Finding[] = [];
        if (!treeTarget) {
          out.push({
            severity: "medium",
            scope: "scenario:destroy_tree_is_stable",
            message: "No tree target found in the handcrafted world.",
          });
          return out;
        }
        const tile = next.tiles[idxOf(next, treeTarget.x, treeTarget.y)];
        if (!tile || tile.blocked) {
          out.push({
            severity: "high",
            scope: "scenario:destroy_tree_is_stable",
            message: "Destroyed tree tile stayed blocked.",
          });
        }
        if (tile?.prop !== "stump" && tile?.prop !== "none") {
          out.push({
            severity: "medium",
            scope: "scenario:destroy_tree_is_stable",
            message: `Destroyed tree left unexpected prop state: ${String(tile?.prop)}.`,
          });
        }
        return out;
      },
    },
    {
      id: "respawn_is_sane",
      actionText: "__direct_apply_respawn__",
      setup: (state) => {
        const next = cloneState(state);
        next.player.hp = 1;
        next.player.gold = 30;
        next.player.inventory.push({
          id: "test_item",
          itemId: null,
          name: "Test",
          qty: 1,
          icon: "",
          sprite: null,
          emoji: "item",
        });
        return next;
      },
      check: ({ initial, next }) => {
        const out: Finding[] = [];
        if (next.player.lives !== initial.player.lives - 1) {
          out.push({
            severity: "high",
            scope: "scenario:respawn_is_sane",
            message: "Respawn did not consume exactly one life.",
          });
        }
        if (next.player.x !== 24 || next.player.y !== 25) {
          out.push({
            severity: "high",
            scope: "scenario:respawn_is_sane",
            message: `Respawn moved player to unexpected tile (${next.player.x},${next.player.y}).`,
          });
        }
        if (next.player.inventory.length !== 0) {
          out.push({
            severity: "high",
            scope: "scenario:respawn_is_sane",
            message: "Respawn did not clear inventory.",
          });
        }
        return out;
      },
    },
    {
      id: "nearby_shop_purchase_costs_once",
      actionText: "j achete potion de soin",
      setup: (state) => {
        const next = withPlayerAt(state, 26, 23);
        next.player.gold = 30;
        return next;
      },
      check: ({ initial, outcome, next }) => {
        const out: Finding[] = [];
        const deltaGold = initial.player.gold - next.player.gold;
        if (deltaGold !== 12) {
          out.push({
            severity: "medium",
            scope: "scenario:nearby_shop_purchase_costs_once",
            message: `Expected shop purchase cost 12 gold, got ${deltaGold}.`,
          });
        }
        const potionGain = itemQty(next, "Potion de soin") - itemQty(initial, "Potion de soin");
        if (potionGain !== 1) {
          out.push({
            severity: "medium",
            scope: "scenario:nearby_shop_purchase_costs_once",
            message: `Expected one potion gained, got ${potionGain}.`,
          });
        }
        if (outcome.moveToPoi && outcome.moveToPoi !== "shop") {
          out.push({
            severity: "high",
            scope: "scenario:nearby_shop_purchase_costs_once",
            message: `Nearby purchase should not redirect to ${outcome.moveToPoi}.`,
          });
        }
        return out;
      },
    },
    {
      id: "asking_prices_does_not_spawn_loot",
      actionText: "je demande les prix du marchand",
      setup: (state) => state,
      check: ({ initial, outcome, next }) => {
        const out: Finding[] = [];
        if (typeof outcome.addItemName === "string" && outcome.addItemName.trim().length > 0) {
          out.push({
            severity: "high",
            scope: "scenario:asking_prices_does_not_spawn_loot",
            message: `Price inquiry should not create loot intent (${outcome.addItemName}).`,
          });
        }
        if (next.player.inventory.length !== initial.player.inventory.length) {
          out.push({
            severity: "high",
            scope: "scenario:asking_prices_does_not_spawn_loot",
            message: "Price inquiry changed inventory size.",
          });
        }
        return out;
      },
    },
    {
      id: "invalid_shop_item_is_rejected",
      actionText: "j achete fusil legendaire",
      setup: (state) => {
        const next = withPlayerAt(state, 26, 23);
        next.player.gold = 50;
        return next;
      },
      check: ({ initial, outcome, next }) => {
        const out: Finding[] = [];
        if (typeof outcome.buyItemName === "string" && outcome.buyItemName.trim().length > 0) {
          out.push({
            severity: "high",
            scope: "scenario:invalid_shop_item_is_rejected",
            message: `Invalid shop item still produced a buyItemName (${outcome.buyItemName}).`,
          });
        }
        if (next.player.gold !== initial.player.gold) {
          out.push({
            severity: "high",
            scope: "scenario:invalid_shop_item_is_rejected",
            message: "Invalid shop item still consumed gold.",
          });
        }
        if (next.player.inventory.length !== initial.player.inventory.length) {
          out.push({
            severity: "high",
            scope: "scenario:invalid_shop_item_is_rejected",
            message: "Invalid shop item still modified inventory.",
          });
        }
        if (!/stock|vend pas|pas en stock/i.test(outcome.narrative)) {
          out.push({
            severity: "medium",
            scope: "scenario:invalid_shop_item_is_rejected",
            message: "Invalid shop item does not clearly explain the rejection.",
          });
        }
        return out;
      },
    },
  ];

  const findings: Finding[] = [];
  for (const scenario of scenarios) {
    const initialState = scenario.setup(cloneState(base));
    let outcome: SoloOutcome;
    let next: SoloGameState;

    if (scenario.id === "respawn_is_sane") {
      outcome = {
        narrative: "test",
        storyLine: "test",
        diceRoll: null,
        damageSelf: 5,
      };
      next = logic.applyOutcome(initialState, outcome);
    } else {
      const context = logic.buildActionContext(initialState);
      outcome = await resolveActionDeterministic(resolveLib, scenario.actionText, context);
      next = logic.applyOutcome(initialState, outcome);
    }

    findings.push(...runStateInvariantChecks(next, `scenario:${scenario.id}`));
    findings.push(...scenario.check({ initial: initialState, outcome, next }));
  }

  return findings;
}

async function auditFuzzBatch(
  base: SoloGameState,
  logic: typeof import("../lib/solo/logic"),
  resolveLib: typeof import("../lib/solo/resolve")
): Promise<Finding[]> {
  const actions = [
    "je vais a la boutique",
    "je vais a la guilde",
    "je vais au donjon",
    "je vais a la maison la plus proche",
    "je parle au marchand",
    "je me repose",
    "j attaque le monstre",
    "je coupe au nord",
    "je prends une potion",
    "je change mon objectif",
    "je vais au boss",
  ];

  const states = [
    base,
    withPlayerAt(base, 26, 23),
    withPlayerAt(base, 21, 24),
    withPlayerAt(base, 18, 24),
    withPlayerAt(base, 24, 39),
  ];

  const findings: Finding[] = [];
  for (let stateIndex = 0; stateIndex < states.length; stateIndex += 1) {
    const seedState = states[stateIndex];
    for (const actionText of actions) {
      const initial = cloneState(seedState);
      const context = logic.buildActionContext(initial);
      const outcome = await resolveActionDeterministic(resolveLib, actionText, context);
      const next = logic.applyOutcome(initial, outcome);
      findings.push(...runStateInvariantChecks(next, `fuzz:${stateIndex}:${actionText}`));

      const nonHostileDamage = countNonHostileDamage(initial, next);
      if (/(attaque|frappe|combat)/.test(actionText) && nonHostileDamage.length > 0) {
        findings.push({
          severity: "high",
          scope: `fuzz:${stateIndex}:${actionText}`,
          message: `Non-hostile actors lost HP: ${nonHostileDamage.join(", ")}.`,
        });
      }
    }
  }

  return findings;
}

function runStateInvariantChecks(state: SoloGameState, scope: string): Finding[] {
  const findings: Finding[] = [];

  if (!inBounds(state, state.player.x, state.player.y)) {
    findings.push({
      severity: "high",
      scope,
      message: `Player out of bounds at (${state.player.x},${state.player.y}).`,
    });
  } else {
    const tile = state.tiles[idxOf(state, state.player.x, state.player.y)];
    if (!tile) {
      findings.push({
        severity: "high",
        scope,
        message: `Player is on a missing tile at (${state.player.x},${state.player.y}).`,
      });
    } else if (tile.blocked) {
      findings.push({
        severity: "high",
        scope,
        message: `Player ended on a blocked tile at (${state.player.x},${state.player.y}).`,
      });
    }
  }

  if (state.player.hp < 0 || state.player.hp > state.player.maxHp) {
    findings.push({
      severity: "high",
      scope,
      message: `Player HP out of range: ${state.player.hp}/${state.player.maxHp}.`,
    });
  }
  if (state.player.lives < 0 || state.player.lives > state.player.maxLives) {
    findings.push({
      severity: "high",
      scope,
      message: `Player lives out of range: ${state.player.lives}/${state.player.maxLives}.`,
    });
  }
  if (state.player.stress < 0 || state.player.stress > 100) {
    findings.push({
      severity: "high",
      scope,
      message: `Player stress out of range: ${state.player.stress}.`,
    });
  }
  if (state.player.gold < 0) {
    findings.push({
      severity: "high",
      scope,
      message: `Player gold below zero: ${state.player.gold}.`,
    });
  }

  for (const item of state.player.inventory) {
    if (item.qty <= 0) {
      findings.push({
        severity: "high",
        scope,
        message: `Inventory item ${item.id} has invalid qty ${item.qty}.`,
      });
    }
  }

  const actorTiles = new Map<string, string[]>();
  for (const actor of state.actors) {
    if (!inBounds(state, actor.x, actor.y)) {
      findings.push({
        severity: "high",
        scope,
        message: `Actor ${actor.id} is out of bounds at (${actor.x},${actor.y}).`,
      });
      continue;
    }

    const tile = state.tiles[idxOf(state, actor.x, actor.y)];
    if (!tile) {
      findings.push({
        severity: "high",
        scope,
        message: `Actor ${actor.id} is on a missing tile at (${actor.x},${actor.y}).`,
      });
      continue;
    }
    if (tile.blocked && actor.alive) {
      findings.push({
        severity: "high",
        scope,
        message: `Actor ${actor.id} is alive on a blocked tile at (${actor.x},${actor.y}).`,
      });
    }

    const key = `${actor.x},${actor.y}`;
    const occupants = actorTiles.get(key) ?? [];
    occupants.push(actor.id);
    actorTiles.set(key, occupants);
  }

  actorTiles.forEach((occupants, key) => {
    if (occupants.length <= 1) return;
    findings.push({
      severity: "medium",
      scope,
      message: `Multiple actors overlap at ${key}: ${occupants.join(", ")}.`,
    });
  });

  return findings;
}

function countNonHostileDamage(before: SoloGameState, after: SoloGameState): string[] {
  const damaged: string[] = [];
  for (const actorBefore of before.actors) {
    if (actorBefore.hostile) continue;
    const actorAfter = after.actors.find((entry) => entry.id === actorBefore.id);
    if (!actorAfter) continue;
    if (actorAfter.hp < actorBefore.hp) {
      damaged.push(actorBefore.id);
    }
  }
  return damaged;
}

async function resolveActionDeterministic(
  resolveLib: typeof import("../lib/solo/resolve"),
  actionText: string,
  context: import("../lib/solo/types").SoloActionContext
): Promise<SoloOutcome> {
  const originalRandom = Math.random;
  Math.random = () => 0.61;
  try {
    return await resolveLib.resolveSoloAction({ actionText, context });
  } finally {
    Math.random = originalRandom;
  }
}

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

function withPlayerAt(state: SoloGameState, x: number, y: number): SoloGameState {
  const next = cloneState(state);
  next.player.x = x;
  next.player.y = y;
  return next;
}

function idxOf(state: SoloGameState, x: number, y: number): number {
  return y * state.worldWidth + x;
}

function inBounds(state: SoloGameState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.worldWidth && y < state.worldHeight;
}

function itemQty(state: SoloGameState, name: string): number {
  const normalized = normalize(name);
  const found = state.player.inventory.find((item) => normalize(item.name) === normalized);
  return found?.qty ?? 0;
}

function tileAt(state: SoloGameState, x: number, y: number): SoloGameState["tiles"][number] | null {
  if (!inBounds(state, x, y)) return null;
  return state.tiles[idxOf(state, x, y)] ?? null;
}

function findPoiTiles(state: SoloGameState, poi: PoiName): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      if (tileAt(state, x, y)?.poi === poi) {
        out.push({ x, y });
      }
    }
  }
  return out;
}

function shortestDistance(
  state: SoloGameState,
  startX: number,
  startY: number,
  isTarget: (x: number, y: number) => boolean
): number | null {
  if (!inBounds(state, startX, startY)) return null;
  const startTile = tileAt(state, startX, startY);
  if (!startTile || startTile.blocked) return null;
  if (isTarget(startX, startY)) return 0;

  const queue: Array<{ x: number; y: number; d: number }> = [{ x: startX, y: startY, d: 0 }];
  const visited = new Set<string>([`${startX},${startY}`]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    for (const [nx, ny] of [
      [current.x + 1, current.y],
      [current.x - 1, current.y],
      [current.x, current.y + 1],
      [current.x, current.y - 1],
    ]) {
      if (!inBounds(state, nx, ny)) continue;
      const tile = tileAt(state, nx, ny);
      if (!tile || tile.blocked) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (isTarget(nx, ny)) return current.d + 1;
      visited.add(key);
      queue.push({ x: nx, y: ny, d: current.d + 1 });
    }
  }

  return null;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findTile(
  state: SoloGameState,
  predicate: (tile: SoloGameState["tiles"][number]) => boolean
): { x: number; y: number } | null {
  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      const tile = state.tiles[idxOf(state, x, y)];
      if (tile && predicate(tile)) return { x, y };
    }
  }
  return null;
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function groupBySeverity(findings: Finding[]): Record<Severity, Finding[]> {
  const ordered = findings
    .slice()
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.scope.localeCompare(b.scope));

  return {
    high: ordered.filter((finding) => finding.severity === "high"),
    medium: ordered.filter((finding) => finding.severity === "medium"),
    low: ordered.filter((finding) => finding.severity === "low"),
  };
}

function severityRank(value: Severity): number {
  if (value === "high") return 0;
  if (value === "medium") return 1;
  return 2;
}

function renderReport(grouped: Record<Severity, Finding[]>): string {
  const lines: string[] = [];
  lines.push("# Solo Bug Hunt Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  for (const severity of ["high", "medium", "low"] as const) {
    const list = grouped[severity];
    lines.push(`## ${severity.toUpperCase()} (${list.length})`);
    if (list.length === 0) {
      lines.push("- none");
    } else {
      for (const finding of list) {
        lines.push(`- [${finding.scope}] ${finding.message}`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
