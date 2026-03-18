"use strict";

const fs = require("node:fs");
const path = require("node:path");

let CANVAS_API = null;
try {
  CANVAS_API = require("canvas");
} catch {
  CANVAS_API = null;
}

delete process.env.GROQ_API_KEY;
delete process.env.GROQ_MODEL;

const HIGH = "high";
const MEDIUM = "medium";
const LOW = "low";
const OVERVIEW_TILE = 12;
const CHUNK_TILE = 28;
const SOLID_DECORS = new Set(["house_a", "house_b", "house_c", "house_d", "ruin_a", "ruin_b", "forest_grove_a", "forest_grove_b", "stone_cluster", "citadel_tower", "fence_h", "fence_v", "well"]);
const TERRAIN_COLORS = {
  grass: "#7cb968",
  forest: "#4f8a4c",
  desert: "#c79459",
  village: "#d2ac74",
  road: "#a47c53",
  water: "#4677a8",
  stone: "#74727f",
  dungeon: "#615a67",
  boss: "#70484a",
};
const ACTOR_POI_RULES = [
  { actorId: "npc_guild_master", poi: "guild", maxDistance: 2 },
  { actorId: "npc_shopkeeper", poi: "shop", maxDistance: 2 },
  { actorId: "npc_innkeeper", poi: "inn", maxDistance: 2 },
];
const ASSET_FILES = {
  house: resolvePublicAsset(
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetHouse.png"
  ),
  desert: resolvePublicAsset(
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetDesert.png"
  ),
  nature: resolvePublicAsset(
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetNature.png"
  ),
  towers: resolvePublicAsset(
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetTowers.png"
  ),
};

async function run() {
  const world = require("../.codex-solo-bug-hunt/lib/solo/world");
  const logic = require("../.codex-solo-bug-hunt/lib/solo/logic");
  const resolveLib = require("../.codex-solo-bug-hunt/lib/solo/resolve");
  const mapArt = require("../.codex-solo-bug-hunt/lib/solo/mapArt");

  const state = world.createInitialSoloState({
    playerName: "Audit",
    powerText: "audit monde",
    powerRoll: 12,
    powerAccepted: true,
    characterId: "Boy",
  });

  const decors = collectAllDecors(world);
  const poiNodes = world.getAllPoiNodes();
  const actorAnchors = world.getActorAnchors();
  const structures = typeof world.getMapStructures === "function" ? world.getMapStructures() : [];

  const findings = [];
  findings.push(...checkWorldInvariants(state, world, "initial"));
  findings.push(...checkMapPalette(state, mapArt, "initial"));
  findings.push(...checkDecorLayout(state, decors));
  findings.push(...checkDecorBiomeAlignment(state, decors, mapArt));
  findings.push(...checkPoiNodes(state, world, poiNodes));
  findings.push(...checkActorAnchors(state, world, poiNodes, actorAnchors));
  findings.push(...checkStructureRegistry(state, structures));
  findings.push(...(await runMovementSuite(state, world, logic, resolveLib)));

  const artifacts = await renderArtifacts(state, world, poiNodes, decors, actorAnchors);
  const grouped = groupBySeverity(findings);
  const report = renderReport(grouped, world.WORLD_LAYOUT_VERSION, artifacts);
  const output = path.resolve("docs", "WORLD_AUDIT_REPORT.md");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, report, "utf8");
  process.stdout.write(report);
  if (grouped.high.length > 0) process.exitCode = 1;
}

function collectAllDecors(world) {
  const out = [];
  for (let cy = 0; cy < 3; cy += 1) {
    for (let cx = 0; cx < 3; cx += 1) {
      out.push(...world.getDecorsForChunk(cx, cy));
    }
  }
  return out;
}

function runTurn(state, actionText, world, logic, resolveLib) {
  return resolveLib
    .resolveSoloAction({
      actionText,
      context: logic.buildActionContext(state),
    })
    .then((outcome) => {
      const next = logic.applyOutcome(state, outcome);
      world.enforceWorldCoherence(next);
      return { outcome, next };
    });
}

async function runMovementSuite(base, world, logic, resolveLib) {
  const findings = [];
  const sequence = [
    "je vais au nord",
    "je vais au sud",
    "je vais a la boutique",
    "je vais a la guilde",
    "je vais a l auberge",
    "je vais jusqu au squelette",
    "attaque le squelette",
    "je vais d un ecran vers l est",
    "je vais au donjon",
  ];

  let state = clone(base);
  for (let index = 0; index < sequence.length; index += 1) {
    const actionText = sequence[index];
    const before = { x: state.player.x, y: state.player.y, chunk: world.chunkOf(state.player.x, state.player.y) };
    const { outcome, next } = await runTurn(state, actionText, world, logic, resolveLib);
    const after = { x: next.player.x, y: next.player.y, chunk: world.chunkOf(next.player.x, next.player.y) };
    const stepDistance = manhattan(before.x, before.y, after.x, after.y);

    const budget = /ecran|chunk/.test(normalize(actionText)) ? 10 : 8;
    if (stepDistance > budget) {
      findings.push({
        severity: HIGH,
        scope: "movement",
        message: `Action "${actionText}" moved ${stepDistance} tiles (budget ${budget}).`,
      });
    }

    if (outcome.moveToPoi && stepDistance === 0) {
      findings.push({
        severity: MEDIUM,
        scope: "movement",
        message: `Action "${actionText}" targeted POI ${outcome.moveToPoi} but player did not move.`,
      });
    }

    if (Math.abs(after.chunk.cx - before.chunk.cx) + Math.abs(after.chunk.cy - before.chunk.cy) > 1) {
      findings.push({
        severity: HIGH,
        scope: "movement",
        message: `Action "${actionText}" skipped chunks (${before.chunk.cx},${before.chunk.cy}) -> (${after.chunk.cx},${after.chunk.cy}).`,
      });
    }

    findings.push(...checkWorldInvariants(next, world, `turn:${index + 1}:${actionText}`));
    state = next;
  }

  return findings;
}

function checkMapPalette(state, mapArt, scope) {
  const findings = [];
  const biomeProfiles = mapArt.MAP_STYLE_LIBRARY?.biomes ?? {};
  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      if (!tile) continue;
      if (tile.prop === "palm" || tile.prop === "ruin") {
        findings.push({
          severity: MEDIUM,
          scope: `palette:${scope}`,
          message: `Legacy prop ${tile.prop} at (${x},${y}) should be normalized.`,
        });
      }
      if (
        (tile.terrain === "road" || tile.poi !== null) &&
        tile.prop !== "none" &&
        tile.prop !== "hole" &&
        tile.prop !== "crater" &&
        tile.prop !== "charred" &&
        tile.prop !== "rubble"
      ) {
        findings.push({
          severity: MEDIUM,
          scope: `palette:${scope}`,
          message: `POI/Road tile at (${x},${y}) carries prop ${tile.prop}.`,
        });
      }
      const biomeProfile = biomeProfiles[tile.terrain];
      if (tile.prop !== "none" && biomeProfile && !biomeProfile.approvedProps.includes(tile.prop)) {
        findings.push({
          severity: MEDIUM,
          scope: `palette:${scope}`,
          message: `Prop ${tile.prop} at (${x},${y}) is not approved for biome ${tile.terrain}.`,
        });
      }
    }
  }
  return findings;
}

function checkDecorLayout(state, decors) {
  const findings = [];
  for (const decor of decors) {
    if (
      decor.x < 0 ||
      decor.y < 0 ||
      decor.x + decor.w > state.worldWidth ||
      decor.y + decor.h > state.worldHeight
    ) {
      findings.push({
        severity: HIGH,
        scope: "decor",
        message: `Decor ${decor.id} overflows the world bounds.`,
      });
    }
  }

  for (let i = 0; i < decors.length; i += 1) {
    for (let j = i + 1; j < decors.length; j += 1) {
      const left = decors[i];
      const right = decors[j];
      if (!rectsOverlap(left, right)) continue;
      if (!SOLID_DECORS.has(left.kind) && !SOLID_DECORS.has(right.kind)) continue;
      findings.push({
        severity: HIGH,
        scope: "decor",
        message: `Decor overlap between ${left.id} and ${right.id}.`,
      });
    }
  }

  return findings;
}

function checkDecorBiomeAlignment(state, decors, mapArt) {
  const findings = [];
  const decorProfiles = mapArt.MAP_STYLE_LIBRARY?.decors ?? {};
  const deprecatedKinds = new Set(mapArt.DEPRECATED_DECOR_KINDS ?? []);

  for (const decor of decors) {
    const profile = decorProfiles[decor.kind];
    const allowed = profile?.allowedTerrains;
    if (deprecatedKinds.has(decor.kind)) {
      findings.push({
        severity: HIGH,
        scope: "decor-style",
        message: `Decor ${decor.id} uses deprecated art profile ${decor.kind}.`,
      });
    }
    if (!allowed) continue;
    const terrains = new Map();
    for (let y = decor.y; y < decor.y + decor.h; y += 1) {
      for (let x = decor.x; x < decor.x + decor.w; x += 1) {
        const tile = state.tiles[y * state.worldWidth + x];
        if (!tile) continue;
        terrains.set(tile.terrain, (terrains.get(tile.terrain) ?? 0) + 1);
      }
    }
    const dominant = [...terrains.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
    if (!dominant || allowed.includes(dominant)) continue;
    findings.push({
      severity: MEDIUM,
      scope: "decor-biome",
      message: `Decor ${decor.id} (${decor.kind}) sits mostly on ${dominant}, expected ${allowed.join(" / ")}.`,
    });
  }

  return findings;
}

function checkStructureRegistry(state, structures) {
  const findings = [];
  for (const structure of structures) {
    if (
      structure.x < 0 ||
      structure.y < 0 ||
      structure.x + structure.w > state.worldWidth ||
      structure.y + structure.h > state.worldHeight
    ) {
      findings.push({
        severity: HIGH,
        scope: "structure",
        message: `Structure ${structure.id} overflows the world bounds.`,
      });
    }

    if (structure.showLabel && !structure.label) {
      findings.push({
        severity: MEDIUM,
        scope: "structure",
        message: `Structure ${structure.id} shows a label but has no text.`,
      });
    }

    if (typeof structure.serviceX === "number" && typeof structure.serviceY === "number") {
      const tile = state.tiles[structure.serviceY * state.worldWidth + structure.serviceX];
      if (!tile || tile.blocked) {
        findings.push({
          severity: HIGH,
          scope: "structure",
          message: `Structure ${structure.id} has a blocked service tile at (${structure.serviceX},${structure.serviceY}).`,
        });
      }
      if (structure.poi && tile?.poi !== structure.poi) {
        findings.push({
          severity: MEDIUM,
          scope: "structure",
          message: `Structure ${structure.id} expects poi ${structure.poi} at (${structure.serviceX},${structure.serviceY}) but found ${tile?.poi ?? "none"}.`,
        });
      }
    }
  }
  return findings;
}

function checkPoiNodes(state, world, poiNodes) {
  const findings = [];
  const seenIds = new Set();
  const labelBoxesByChunk = new Map();

  for (const node of poiNodes) {
    if (seenIds.has(node.id)) {
      findings.push({
        severity: HIGH,
        scope: "poi",
        message: `Duplicate POI node id ${node.id}.`,
      });
      continue;
    }
    seenIds.add(node.id);

    const tile = state.tiles[node.y * state.worldWidth + node.x];
    if (!tile) {
      findings.push({
        severity: HIGH,
        scope: "poi",
        message: `POI node ${node.id} points to a missing tile (${node.x},${node.y}).`,
      });
      continue;
    }

    if (tile.poi !== node.poi) {
      findings.push({
        severity: HIGH,
        scope: "poi",
        message: `POI node ${node.id} expects ${node.poi} but tile has ${String(tile.poi)}.`,
      });
    }

    if (tile.blocked || tile.terrain === "water") {
      findings.push({
        severity: HIGH,
        scope: "poi",
        message: `POI node ${node.id} is not walkable (${node.x},${node.y}).`,
      });
    }

    if (node.showLabel && !node.label) {
      findings.push({
        severity: HIGH,
        scope: "poi",
        message: `POI node ${node.id} is visible but has no label.`,
      });
    }

    if (!highlightContains(node.highlight, node.x, node.y)) {
      findings.push({
        severity: MEDIUM,
        scope: "poi",
        message: `POI node ${node.id} falls outside its highlight rect.`,
      });
    }

    const chunk = world.chunkOf(node.x, node.y);
    const labelChunk = world.chunkOf(Math.floor(node.anchorX), Math.floor(node.anchorY));
    if (chunk.cx !== labelChunk.cx || chunk.cy !== labelChunk.cy) {
      findings.push({
        severity: MEDIUM,
        scope: "poi",
        message: `POI node ${node.id} label anchor points to another chunk.`,
      });
    }

    if (node.anchorX < node.highlight.x - 1 || node.anchorX > node.highlight.x + node.highlight.w + 1) {
      findings.push({
        severity: MEDIUM,
        scope: "poi",
        message: `POI node ${node.id} label anchor drifts horizontally away from its focus zone.`,
      });
    }

    if (node.anchorY < node.highlight.y - 2.5 || node.anchorY > node.highlight.y + node.highlight.h) {
      findings.push({
        severity: MEDIUM,
        scope: "poi",
        message: `POI node ${node.id} label anchor drifts vertically away from its focus zone.`,
      });
    }

    if (!node.showLabel || !node.label) continue;
    const chunkKey = `${chunk.cx},${chunk.cy}`;
    const labelBoxes = labelBoxesByChunk.get(chunkKey) ?? [];
    const box = buildLabelBox(node);
    for (const previous of labelBoxes) {
      if (!rectsOverlap(box, previous.box)) continue;
      findings.push({
        severity: MEDIUM,
        scope: "poi-label",
        message: `Label overlap between ${previous.id} and ${node.id} in chunk ${chunkKey}.`,
      });
    }
    labelBoxes.push({ id: node.id, box });
    labelBoxesByChunk.set(chunkKey, labelBoxes);
  }

  return findings;
}

function checkActorAnchors(state, world, poiNodes, actorAnchors) {
  const findings = [];
  const actors = new Map(state.actors.map((actor) => [actor.id, actor]));
  const poiLookup = new Map();
  for (const node of poiNodes) {
    const list = poiLookup.get(node.poi) ?? [];
    list.push(node);
    poiLookup.set(node.poi, list);
  }

  for (const anchor of actorAnchors) {
    const actor = actors.get(anchor.actorId);
    if (!actor) {
      findings.push({
        severity: HIGH,
        scope: "actor-anchor",
        message: `Missing anchored actor ${anchor.actorId}.`,
      });
      continue;
    }

    if (actor.x !== anchor.x || actor.y !== anchor.y) {
      findings.push({
        severity: MEDIUM,
        scope: "actor-anchor",
        message: `Actor ${anchor.actorId} drifted to (${actor.x},${actor.y}) instead of (${anchor.x},${anchor.y}).`,
      });
    }

    if (!isWalkable(state, anchor.x, anchor.y)) {
      findings.push({
        severity: HIGH,
        scope: "actor-anchor",
        message: `Actor anchor ${anchor.actorId} sits on a blocked tile.`,
      });
    }
  }

  for (const rule of ACTOR_POI_RULES) {
    const actor = actors.get(rule.actorId);
    const targets = poiLookup.get(rule.poi) ?? [];
    if (!actor || targets.length === 0) continue;
    const distance = targets.reduce((best, node) => Math.min(best, manhattan(actor.x, actor.y, node.x, node.y)), Number.POSITIVE_INFINITY);
    if (distance > rule.maxDistance) {
      findings.push({
        severity: MEDIUM,
        scope: "actor-role",
        message: `${rule.actorId} is too far from ${rule.poi} (distance ${distance}).`,
      });
    }
  }

  return findings;
}

function checkWorldInvariants(state, world, scope) {
  const findings = [];
  const actorPos = new Set();
  const playerKey = `${state.player.x},${state.player.y}`;
  if (!isWalkable(state, state.player.x, state.player.y)) {
    findings.push({
      severity: HIGH,
      scope,
      message: `Player on invalid tile (${state.player.x},${state.player.y}).`,
    });
  }

  for (const actor of state.actors) {
    if (!actor.alive) continue;
    const key = `${actor.x},${actor.y}`;
    if (actorPos.has(key)) {
      findings.push({
        severity: MEDIUM,
        scope,
        message: `Two actors share tile ${key}.`,
      });
    }
    actorPos.add(key);
    if (!isWalkable(state, actor.x, actor.y)) {
      findings.push({
        severity: HIGH,
        scope,
        message: `Actor ${actor.id} on invalid tile (${actor.x},${actor.y}).`,
      });
    }
    if (key === playerKey) {
      findings.push({
        severity: MEDIUM,
        scope,
        message: `Actor ${actor.id} overlaps player at ${key}.`,
      });
    }
  }

  const currentChunk = world.chunkOf(state.player.x, state.player.y);
  if (currentChunk.cx < 0 || currentChunk.cy < 0 || currentChunk.cx > 2 || currentChunk.cy > 2) {
    findings.push({
      severity: HIGH,
      scope,
      message: `Player chunk out of bounds (${currentChunk.cx},${currentChunk.cy}).`,
    });
  }

  return findings;
}

async function renderArtifacts(state, world, poiNodes, decors, actorAnchors) {
  const outDir = path.resolve("docs");
  fs.mkdirSync(outDir, { recursive: true });
  const { writeAssetAtlasHtml, writePreviewHtml } = require("./map-preview-shared");
  const htmlPath = path.join(outDir, "WORLD_AUDIT_ASSETS.html");
  const atlasPath = path.join(outDir, "MAP_ASSET_ATLAS.html");
  const mapPath = path.join(outDir, "WORLD_AUDIT_MAP.svg");
  const villagePath = path.join(outDir, "WORLD_AUDIT_VILLAGE.svg");

  writePreviewHtml(htmlPath, {
    title: "World Audit Assets",
    subtitle:
      "Vue d audit assetisee pour verifier routes, portes, labels, empreintes de decors et positions PNJ avec la meme grammaire visuelle que le runtime.",
  });
  writeAssetAtlasHtml(atlasPath, {
    title: "Atlas des assets de map",
  });
  await renderOverviewSvg(state, world, poiNodes, decors, actorAnchors, mapPath);
  await renderVillageSvg(state, world, poiNodes, decors, actorAnchors, villagePath);
  return {
    map: "docs/WORLD_AUDIT_MAP.svg",
    village: "docs/WORLD_AUDIT_VILLAGE.svg",
    html: "docs/WORLD_AUDIT_ASSETS.html",
    atlas: "docs/MAP_ASSET_ATLAS.html",
  };
}

async function renderOverview(state, world, poiNodes, decors, actorAnchors, outputPath) {
  const { createCanvas } = CANVAS_API;
  const width = state.worldWidth * OVERVIEW_TILE;
  const height = state.worldHeight * OVERVIEW_TILE;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      ctx.fillStyle = TERRAIN_COLORS[tile?.terrain] ?? "#666";
      ctx.fillRect(x * OVERVIEW_TILE, y * OVERVIEW_TILE, OVERVIEW_TILE, OVERVIEW_TILE);
    }
  }

  ctx.strokeStyle = "rgba(18, 24, 38, 0.35)";
  for (let x = 0; x <= state.worldWidth; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * OVERVIEW_TILE, 0);
    ctx.lineTo(x * OVERVIEW_TILE, height);
    ctx.stroke();
  }
  for (let y = 0; y <= state.worldHeight; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * OVERVIEW_TILE);
    ctx.lineTo(width, y * OVERVIEW_TILE);
    ctx.stroke();
  }

  ctx.lineWidth = 2;
  for (const decor of decors) {
    ctx.strokeStyle = SOLID_DECORS.has(decor.kind) ? "rgba(29, 16, 10, 0.8)" : "rgba(244, 217, 142, 0.8)";
    ctx.strokeRect(
      decor.x * OVERVIEW_TILE + 1,
      decor.y * OVERVIEW_TILE + 1,
      decor.w * OVERVIEW_TILE - 2,
      decor.h * OVERVIEW_TILE - 2
    );
  }

  for (const node of poiNodes) {
    ctx.fillStyle = node.showLabel ? "#ffe29a" : "#f3f5ff";
    ctx.beginPath();
    ctx.arc((node.x + 0.5) * OVERVIEW_TILE, (node.y + 0.5) * OVERVIEW_TILE, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const anchor of actorAnchors) {
    ctx.fillStyle = "#7fd2ff";
    ctx.fillRect(anchor.x * OVERVIEW_TILE + 3, anchor.y * OVERVIEW_TILE + 3, OVERVIEW_TILE - 6, OVERVIEW_TILE - 6);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  for (let cx = 1; cx < 3; cx += 1) {
    ctx.beginPath();
    ctx.moveTo(cx * 16 * OVERVIEW_TILE, 0);
    ctx.lineTo(cx * 16 * OVERVIEW_TILE, height);
    ctx.stroke();
  }
  for (let cy = 1; cy < 3; cy += 1) {
    ctx.beginPath();
    ctx.moveTo(0, cy * 16 * OVERVIEW_TILE);
    ctx.lineTo(width, cy * 16 * OVERVIEW_TILE);
    ctx.stroke();
  }

  ctx.fillStyle = "#0d1320";
  ctx.font = "bold 13px sans-serif";
  for (let cy = 0; cy < 3; cy += 1) {
    for (let cx = 0; cx < 3; cx += 1) {
      const label = world.screenLabel(cx, cy);
      ctx.fillText(label, cx * 16 * OVERVIEW_TILE + 8, cy * 16 * OVERVIEW_TILE + 16);
    }
  }

  await writeCanvas(outputPath, canvas);
}

async function renderVillage(state, world, poiNodes, decors, actorAnchors, outputPath) {
  const { createCanvas } = CANVAS_API;
  const cx = 1;
  const cy = 1;
  const startX = cx * 16;
  const startY = cy * 16;
  const canvas = createCanvas(16 * CHUNK_TILE, 16 * CHUNK_TILE);
  const ctx = canvas.getContext("2d");
  const villageNodes = poiNodes.filter((node) => world.chunkOf(node.x, node.y).cx === cx && world.chunkOf(node.x, node.y).cy === cy);
  const villageDecors = decors.filter((decor) => decor.screenX === cx && decor.screenY === cy);
  const villageActors = actorAnchors.filter((entry) => world.chunkOf(entry.x, entry.y).cx === cx && world.chunkOf(entry.x, entry.y).cy === cy);
  const assets = await loadPreviewAssets();

  for (let y = startY; y < startY + 16; y += 1) {
    for (let x = startX; x < startX + 16; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      const px = (x - startX) * CHUNK_TILE;
      const py = (y - startY) * CHUNK_TILE;
      ctx.fillStyle = TERRAIN_COLORS[tile?.terrain] ?? "#666";
      ctx.fillRect(px, py, CHUNK_TILE, CHUNK_TILE);
      ctx.strokeStyle = "rgba(18,24,38,0.15)";
      ctx.strokeRect(px, py, CHUNK_TILE, CHUNK_TILE);
    }
  }

  for (const decor of villageDecors) {
    const dx = (decor.x - startX) * CHUNK_TILE;
    const dy = (decor.y - startY) * CHUNK_TILE;
    drawDecorPreview(ctx, assets, decor.kind, dx, dy, decor.w * CHUNK_TILE, decor.h * CHUNK_TILE);
    ctx.strokeStyle = SOLID_DECORS.has(decor.kind) ? "rgba(36, 18, 10, 0.75)" : "rgba(255, 238, 192, 0.75)";
    ctx.strokeRect(dx + 1, dy + 1, decor.w * CHUNK_TILE - 2, decor.h * CHUNK_TILE - 2);
  }

  for (const node of villageNodes) {
    const highlightX = (node.highlight.x - startX) * CHUNK_TILE;
    const highlightY = (node.highlight.y - startY) * CHUNK_TILE;
    ctx.fillStyle = node.showLabel ? "rgba(255, 222, 145, 0.14)" : "rgba(214, 226, 255, 0.08)";
    ctx.strokeStyle = node.showLabel ? "rgba(255, 214, 118, 0.92)" : "rgba(214, 226, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(highlightX + 2, highlightY + 2, node.highlight.w * CHUNK_TILE - 4, node.highlight.h * CHUNK_TILE - 4, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#101826";
    ctx.beginPath();
    ctx.arc((node.x - startX + 0.5) * CHUNK_TILE, (node.y - startY + 0.5) * CHUNK_TILE, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe6af";
    ctx.beginPath();
    ctx.arc((node.x - startX + 0.5) * CHUNK_TILE, (node.y - startY + 0.5) * CHUNK_TILE, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (node.showLabel && node.label) {
      drawAuditLabel(
        ctx,
        node.label,
        (node.anchorX - startX) * CHUNK_TILE,
        (node.anchorY - startY) * CHUNK_TILE - 10
      );
    }
  }

  for (const actor of villageActors) {
    const px = (actor.x - startX + 0.5) * CHUNK_TILE;
    const py = (actor.y - startY + 0.5) * CHUNK_TILE;
    ctx.fillStyle = "#8be0ff";
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#0d1320";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Village Canonique", 10, 22);

  await writeCanvas(outputPath, canvas);
}

function drawAuditLabel(ctx, label, centerX, baselineY) {
  ctx.save();
  ctx.font = "bold 12px sans-serif";
  const width = Math.ceil(ctx.measureText(label).width) + 16;
  const x = Math.round(centerX - width / 2);
  const y = Math.round(baselineY - 18);
  ctx.fillStyle = "rgba(16, 24, 38, 0.92)";
  ctx.strokeStyle = "rgba(255, 214, 118, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 20, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe6af";
  ctx.textAlign = "center";
  ctx.fillText(label, Math.round(centerX), y + 14);
  ctx.restore();
}

function drawDecorPreview(ctx, assets, kind, x, y, w, h) {
  if (kind === "house_a" && assets.house) {
    ctx.drawImage(assets.house, 0, 0, 64, 64, x, y - Math.floor(CHUNK_TILE * 0.15), w, h + Math.floor(CHUNK_TILE * 0.15));
    return;
  }
  if (kind === "house_b" && assets.house) {
    ctx.drawImage(assets.house, 64, 0, 64, 64, x, y - Math.floor(CHUNK_TILE * 0.15), w, h + Math.floor(CHUNK_TILE * 0.15));
    return;
  }
  if (kind === "house_c" && assets.house) {
    ctx.drawImage(assets.house, 128, 0, 64, 64, x, y - Math.floor(CHUNK_TILE * 0.15), w, h + Math.floor(CHUNK_TILE * 0.15));
    return;
  }
  if (kind === "house_d" && assets.house) {
    ctx.drawImage(assets.house, 192, 0, 64, 64, x, y - Math.floor(CHUNK_TILE * 0.15), w, h + Math.floor(CHUNK_TILE * 0.15));
    return;
  }
  if (kind === "guild_flag" && assets.house) {
    ctx.drawImage(assets.house, 48, 64, 32, 16, x - 4, y + 4, CHUNK_TILE + 8, CHUNK_TILE - 8);
    ctx.fillStyle = "rgba(73, 44, 23, 0.9)";
    ctx.fillRect(Math.round(x + CHUNK_TILE * 0.44), Math.round(y + CHUNK_TILE * 0.36), 3, Math.round(CHUNK_TILE * 0.7));
    return;
  }
  if (kind === "inn_sign" && assets.house) {
    ctx.drawImage(assets.house, 480, 64, 16, 16, x + 4, y + 2, CHUNK_TILE - 8, CHUNK_TILE - 5);
    return;
  }
  if (kind === "shop_stall" && assets.house) {
    ctx.drawImage(assets.house, 256, 256, 48, 32, x + 2, y + 3, w, h + Math.floor(CHUNK_TILE * 0.4));
    return;
  }
  if (kind === "well" && assets.house) {
    ctx.drawImage(assets.house, 384, 32, 32, 32, x, y, w, h);
    return;
  }
  if (kind === "ruin_a" && assets.desert) {
    ctx.drawImage(assets.desert, 0, 128, 64, 48, x, y, w, h);
    return;
  }
  if (kind === "ruin_b" && assets.desert) {
    ctx.drawImage(assets.desert, 128, 128, 64, 48, x, y, w, h);
    return;
  }
  if (kind === "palm_cluster" && assets.desert) {
    ctx.drawImage(assets.desert, 192, 64, 64, 64, x, y - 8, w, h + 8);
    return;
  }
  if (kind === "forest_grove_a" && assets.nature) {
    ctx.drawImage(assets.nature, 256, 32, 64, 32, x, y - Math.floor(CHUNK_TILE * 0.8), w, Math.floor(h * 0.48));
    ctx.drawImage(assets.nature, 32, 0, 32, 32, x - Math.floor(CHUNK_TILE * 0.24), y - Math.floor(CHUNK_TILE * 0.9), Math.floor(w * 0.58), Math.floor(h * 0.58));
    ctx.drawImage(assets.nature, 96, 0, 32, 32, x + Math.floor(w * 0.28), y - Math.floor(CHUNK_TILE * 0.9), Math.floor(w * 0.58), Math.floor(h * 0.58));
    ctx.drawImage(assets.nature, 0, 0, 32, 32, x, y + Math.floor(h * 0.08), Math.floor(w * 0.56), Math.floor(h * 0.56));
    ctx.drawImage(assets.nature, 288, 0, 32, 32, x + Math.floor(w * 0.32), y + Math.floor(h * 0.08), Math.floor(w * 0.56), Math.floor(h * 0.56));
    return;
  }
  if (kind === "forest_grove_b" && assets.nature) {
    ctx.drawImage(assets.nature, 256, 32, 64, 32, x, y - Math.floor(CHUNK_TILE * 0.7), w, Math.floor(h * 0.48));
    ctx.drawImage(assets.nature, 96, 0, 32, 32, x - Math.floor(CHUNK_TILE * 0.24), y - Math.floor(CHUNK_TILE * 0.9), Math.floor(w * 0.58), Math.floor(h * 0.58));
    ctx.drawImage(assets.nature, 32, 0, 32, 32, x + Math.floor(w * 0.28), y - Math.floor(CHUNK_TILE * 0.9), Math.floor(w * 0.58), Math.floor(h * 0.58));
    ctx.drawImage(assets.nature, 256, 0, 32, 32, x, y + Math.floor(h * 0.08), Math.floor(w * 0.56), Math.floor(h * 0.56));
    ctx.drawImage(assets.nature, 0, 0, 32, 32, x + Math.floor(w * 0.32), y + Math.floor(h * 0.08), Math.floor(w * 0.56), Math.floor(h * 0.56));
    return;
  }
  if (kind === "stone_cluster" && assets.nature) {
    ctx.drawImage(assets.nature, 256, 224, 64, 64, x, y - Math.floor(CHUNK_TILE * 0.2), w, h + Math.floor(CHUNK_TILE * 0.2));
    return;
  }
  if (kind === "citadel_tower" && assets.towers) {
    ctx.drawImage(assets.towers, 224, 64, 32, 32, x, y - Math.floor(CHUNK_TILE * 0.32), w, h + Math.floor(CHUNK_TILE * 0.32));
    return;
  }
  if (kind === "dungeon_gate" && assets.house) {
    ctx.drawImage(assets.house, 0, 128, 48, 48, x - 4, y - 6, w + 8, h + 6);
    return;
  }
  if (kind === "boss_gate" && assets.house) {
    ctx.save();
    ctx.filter = "hue-rotate(-25deg) saturate(1.35) brightness(0.85)";
    ctx.drawImage(assets.house, 0, 128, 48, 48, x - 4, y - 6, w + 8, h + 6);
    ctx.restore();
  }
}

async function loadPreviewAssets() {
  if (!CANVAS_API) return {};
  const { loadImage } = CANVAS_API;
  const entries = await Promise.all(
    Object.entries(ASSET_FILES).map(async ([key, filePath]) => {
      try {
        return [key, await loadImage(filePath)];
      } catch {
        return [key, null];
      }
    })
  );
  return Object.fromEntries(entries);
}

async function writeCanvas(outputPath, canvas) {
  await fs.promises.writeFile(outputPath, canvas.toBuffer("image/png"));
}

async function renderOverviewSvg(state, world, poiNodes, decors, actorAnchors, outputPath) {
  const width = state.worldWidth * OVERVIEW_TILE;
  const height = state.worldHeight * OVERVIEW_TILE;
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#0d1320"/>`,
  ];

  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      lines.push(
        `<rect x="${x * OVERVIEW_TILE}" y="${y * OVERVIEW_TILE}" width="${OVERVIEW_TILE}" height="${OVERVIEW_TILE}" fill="${TERRAIN_COLORS[tile?.terrain] ?? "#666"}"/>`
      );
    }
  }

  for (const decor of decors) {
    const stroke = SOLID_DECORS.has(decor.kind) ? "rgba(36,18,10,0.8)" : "rgba(255,228,164,0.75)";
    lines.push(
      `<rect x="${decor.x * OVERVIEW_TILE + 1}" y="${decor.y * OVERVIEW_TILE + 1}" width="${decor.w * OVERVIEW_TILE - 2}" height="${decor.h * OVERVIEW_TILE - 2}" fill="none" stroke="${stroke}" stroke-width="2"/>`
    );
  }

  for (const node of poiNodes) {
    const fill = node.showLabel ? "#ffe29a" : "#edf1ff";
    lines.push(
      `<circle cx="${(node.x + 0.5) * OVERVIEW_TILE}" cy="${(node.y + 0.5) * OVERVIEW_TILE}" r="3.2" fill="${fill}"/>`
    );
  }

  for (const actor of actorAnchors) {
    lines.push(
      `<rect x="${actor.x * OVERVIEW_TILE + 3}" y="${actor.y * OVERVIEW_TILE + 3}" width="${OVERVIEW_TILE - 6}" height="${OVERVIEW_TILE - 6}" fill="#8be0ff"/>`
    );
  }

  for (let cx = 1; cx < 3; cx += 1) {
    lines.push(
      `<line x1="${cx * 16 * OVERVIEW_TILE}" y1="0" x2="${cx * 16 * OVERVIEW_TILE}" y2="${height}" stroke="rgba(255,255,255,0.7)" stroke-width="3"/>`
    );
  }
  for (let cy = 1; cy < 3; cy += 1) {
    lines.push(
      `<line x1="0" y1="${cy * 16 * OVERVIEW_TILE}" x2="${width}" y2="${cy * 16 * OVERVIEW_TILE}" stroke="rgba(255,255,255,0.7)" stroke-width="3"/>`
    );
  }

  for (let cy = 0; cy < 3; cy += 1) {
    for (let cx = 0; cx < 3; cx += 1) {
      lines.push(
        `<text x="${cx * 16 * OVERVIEW_TILE + 8}" y="${cy * 16 * OVERVIEW_TILE + 16}" fill="#101826" font-size="13" font-weight="700">${escapeSvg(
          world.screenLabel(cx, cy)
        )}</text>`
      );
    }
  }

  lines.push("</svg>");
  await fs.promises.writeFile(outputPath, lines.join("\n"));
}

async function renderVillageSvg(state, world, poiNodes, decors, actorAnchors, outputPath) {
  const cx = 1;
  const cy = 1;
  const startX = cx * 16;
  const startY = cy * 16;
  const width = 16 * CHUNK_TILE;
  const height = 16 * CHUNK_TILE;
  const villageNodes = poiNodes.filter((node) => world.chunkOf(node.x, node.y).cx === cx && world.chunkOf(node.x, node.y).cy === cy);
  const villageDecors = decors.filter((decor) => decor.screenX === cx && decor.screenY === cy);
  const villageActors = actorAnchors.filter((entry) => world.chunkOf(entry.x, entry.y).cx === cx && world.chunkOf(entry.x, entry.y).cy === cy);
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#0d1320"/>`,
  ];

  for (let y = startY; y < startY + 16; y += 1) {
    for (let x = startX; x < startX + 16; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      lines.push(
        `<rect x="${(x - startX) * CHUNK_TILE}" y="${(y - startY) * CHUNK_TILE}" width="${CHUNK_TILE}" height="${CHUNK_TILE}" fill="${TERRAIN_COLORS[tile?.terrain] ?? "#666"}" stroke="rgba(18,24,38,0.15)"/>`
      );
    }
  }

  for (const decor of villageDecors) {
    const stroke = SOLID_DECORS.has(decor.kind) ? "#3b2012" : "#ffe6af";
    lines.push(
      `<rect x="${(decor.x - startX) * CHUNK_TILE + 1}" y="${(decor.y - startY) * CHUNK_TILE + 1}" width="${decor.w * CHUNK_TILE - 2}" height="${decor.h * CHUNK_TILE - 2}" fill="rgba(17,21,34,0.08)" stroke="${stroke}" stroke-width="2"/>`
    );
  }

  for (const node of villageNodes) {
    lines.push(
      `<rect x="${(node.highlight.x - startX) * CHUNK_TILE + 2}" y="${(node.highlight.y - startY) * CHUNK_TILE + 2}" width="${node.highlight.w * CHUNK_TILE - 4}" height="${node.highlight.h * CHUNK_TILE - 4}" rx="9" fill="${node.showLabel ? "rgba(255,222,145,0.14)" : "rgba(214,226,255,0.08)"}" stroke="${node.showLabel ? "rgba(255,214,118,0.92)" : "rgba(214,226,255,0.4)"}" stroke-width="2"/>`
    );
    lines.push(
      `<circle cx="${(node.x - startX + 0.5) * CHUNK_TILE}" cy="${(node.y - startY + 0.5) * CHUNK_TILE}" r="4" fill="#101826"/>`
    );
    lines.push(
      `<circle cx="${(node.x - startX + 0.5) * CHUNK_TILE}" cy="${(node.y - startY + 0.5) * CHUNK_TILE}" r="2.5" fill="#ffe6af"/>`
    );

    if (node.showLabel && node.label) {
      const labelWidth = node.label.length * 8 + 18;
      const labelX = (node.anchorX - startX) * CHUNK_TILE - labelWidth / 2;
      const labelY = (node.anchorY - startY) * CHUNK_TILE - 28;
      lines.push(
        `<rect x="${labelX}" y="${labelY}" width="${labelWidth}" height="22" rx="8" fill="rgba(16,24,38,0.92)" stroke="rgba(255,214,118,0.9)" stroke-width="1.5"/>`
      );
      lines.push(
        `<text x="${(node.anchorX - startX) * CHUNK_TILE}" y="${labelY + 15}" fill="#ffe6af" text-anchor="middle" font-size="12" font-weight="700">${escapeSvg(node.label)}</text>`
      );
    }
  }

  for (const actor of villageActors) {
    lines.push(
      `<circle cx="${(actor.x - startX + 0.5) * CHUNK_TILE}" cy="${(actor.y - startY + 0.5) * CHUNK_TILE}" r="4.5" fill="#8be0ff"/>`
    );
  }

  lines.push(`<text x="10" y="22" fill="#101826" font-size="18" font-weight="700">Village Canonique</text>`);
  lines.push("</svg>");
  await fs.promises.writeFile(outputPath, lines.join("\n"));
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLabelBox(node) {
  const widthTiles = (String(node.label).length * 7 + 16) / 32;
  return {
    x: node.anchorX - widthTiles / 2,
    y: node.anchorY - 0.95,
    w: widthTiles,
    h: 0.72,
  };
}

function highlightContains(highlight, x, y) {
  return x >= highlight.x && x < highlight.x + highlight.w && y >= highlight.y && y < highlight.y + highlight.h;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isWalkable(state, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= state.worldWidth || iy >= state.worldHeight) return false;
  const tile = state.tiles[iy * state.worldWidth + ix];
  if (!tile) return false;
  if (tile.blocked) return false;
  return tile.terrain !== "water";
}

function resolvePublicAsset(urlPath) {
  return path.resolve("public", urlPath.replace(/^\//, "").replace(/\//g, path.sep));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function manhattan(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

function groupBySeverity(findings) {
  return {
    high: findings.filter((entry) => entry.severity === HIGH),
    medium: findings.filter((entry) => entry.severity === MEDIUM),
    low: findings.filter((entry) => entry.severity === LOW),
  };
}

function renderGroup(title, entries) {
  const lines = [`## ${title} (${entries.length})`];
  if (entries.length === 0) {
    lines.push("- none");
  } else {
    for (const entry of entries) {
      lines.push(`- [${entry.scope}] ${entry.message}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function renderReport(grouped, layoutVersion, artifacts) {
  const header = [
    "# World Audit Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Layout: ${layoutVersion}`,
    "",
    "Checks: map coherence, actor placement, movement budget, chunk continuity, POI geometry, label overlap, decor collisions.",
    "",
    "Artifacts:",
    `- ${artifacts.map}`,
    `- ${artifacts.village}`,
    `- ${artifacts.html}`,
    `- ${artifacts.atlas}`,
    "",
  ].join("\n");

  return [
    header,
    renderGroup("HIGH", grouped.high),
    renderGroup("MEDIUM", grouped.medium),
    renderGroup("LOW", grouped.low),
  ].join("\n");
}

run().catch((error) => {
  process.stderr.write(String(error?.stack || error));
  process.exitCode = 1;
});
