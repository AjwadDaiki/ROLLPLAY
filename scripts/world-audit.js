"use strict";

const fs = require("node:fs");
const path = require("node:path");

delete process.env.GROQ_API_KEY;
delete process.env.GROQ_MODEL;

const HIGH = "high";
const MEDIUM = "medium";
const LOW = "low";

async function run() {
  const world = require("../.codex-solo-bug-hunt/lib/solo/world");
  const logic = require("../.codex-solo-bug-hunt/lib/solo/logic");
  const resolveLib = require("../.codex-solo-bug-hunt/lib/solo/resolve");

  const state = world.createInitialSoloState({
    playerName: "Audit",
    powerText: "audit monde",
    powerRoll: 12,
    powerAccepted: true,
    characterId: "Boy",
  });

  const findings = [];
  findings.push(...checkWorldInvariants(state, world, "initial"));
  findings.push(...checkMapPalette(state, "initial"));
  findings.push(...(await runMovementSuite(state, world, logic, resolveLib)));

  const grouped = groupBySeverity(findings);
  const report = renderReport(grouped);
  const output = path.resolve("docs", "WORLD_AUDIT_REPORT.md");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, report, "utf8");
  process.stdout.write(report);
  if (grouped.high.length > 0) process.exitCode = 1;
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

function checkMapPalette(state, scope) {
  const findings = [];
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
      if ((tile.terrain === "road" || tile.poi !== null) && tile.prop !== "none") {
        findings.push({
          severity: MEDIUM,
          scope: `palette:${scope}`,
          message: `POI/Road tile at (${x},${y}) carries prop ${tile.prop}.`,
        });
      }
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

function renderReport(grouped) {
  const header = [
    "# World Audit Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Checks: map coherence, actor placement, movement budget, chunk continuity.",
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

