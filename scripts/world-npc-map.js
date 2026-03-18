"use strict";

const fs = require("node:fs");
const path = require("node:path");

delete process.env.GROQ_API_KEY;
delete process.env.GROQ_MODEL;

const TILE = 18;
const ZOOM_TILE = 32;
const PADDING = 24;
const LEFT_WIDTH = 48 * TILE;
const ZOOM_WIDTH = 16 * ZOOM_TILE;
const ZOOM_HEIGHT = 16 * ZOOM_TILE;
const PANEL_GAP = 28;
const LEGEND_X = PADDING + LEFT_WIDTH + PANEL_GAP + ZOOM_WIDTH + PANEL_GAP;
const SVG_WIDTH = LEGEND_X + 420;
const SVG_HEIGHT = Math.max(PADDING * 2 + ZOOM_HEIGHT + 220, PADDING * 2 + 48 * TILE);
const TERRAIN_COLORS = {
  grass: "#79b76c",
  forest: "#4f8a4c",
  desert: "#cb9659",
  village: "#d8b37d",
  road: "#a57b54",
  water: "#4878a8",
  stone: "#7b7885",
  dungeon: "#605964",
  boss: "#764a4b",
};
const KIND_COLORS = {
  npc: "#8be0ff",
  animal: "#ffe39a",
  monster: "#ff9e8b",
  boss: "#ff6464",
};
const CHUNK_LABELS = {
  "0_0": "Bois Ancien",
  "1_0": "Hauteurs de la Route",
  "2_0": "Mesa Brulee",
  "0_1": "Foret de Brume",
  "1_1": "Village Central",
  "2_1": "Dunes Rouges",
  "0_2": "Lisiere Sud-Ouest",
  "1_2": "Donjon Oublie",
  "2_2": "Citadelle du Demon",
};

function run() {
  const world = require("../.codex-solo-bug-hunt/lib/solo/world");
  const state = world.createInitialSoloState({
    playerName: "Map",
    powerText: "map preview",
    powerRoll: 12,
    powerAccepted: true,
    characterId: "Boy",
  });

  const poiNodes = world.getAllPoiNodes();
  const decors = collectAllDecors(world);
  const actors = state.actors
    .filter((actor) => actor.alive)
    .slice()
    .sort((a, b) => actorSortKey(a).localeCompare(actorSortKey(b)));

  const svg = [
    svgOpen(),
    background(),
    titleBlock(world.WORLD_LAYOUT_VERSION),
    drawOverviewMap(state, world, poiNodes, decors, actors),
    drawVillageZoom(state, world, poiNodes, decors, actors),
    drawLegend(actors, world),
    "</svg>",
  ].join("\n");

  const output = path.resolve("docs", "WORLD_PNJ_MAP.svg");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, svg, "utf8");
  process.stdout.write(`Generated ${output}\n`);
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

function svgOpen() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">`;
}

function background() {
  return [
    `<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#0a1020"/>`,
    `<rect x="8" y="8" width="${SVG_WIDTH - 16}" height="${SVG_HEIGHT - 16}" rx="22" fill="#11192d" stroke="#7f6336" stroke-width="1.5"/>`,
  ].join("\n");
}

function titleBlock(layoutVersion) {
  return [
    `<text x="${PADDING}" y="34" fill="#ffe2a0" font-size="24" font-weight="700">Carte PNJ / POI</text>`,
    `<text x="${PADDING}" y="56" fill="#b8c8eb" font-size="13">Vue statique pour audit rapide de la map, des labels, des PNJ et des zones d interaction</text>`,
    `<text x="${PADDING}" y="75" fill="#8ea5cf" font-size="12">Layout ${escapeSvg(layoutVersion)} • Village zoome a droite • Liste complete des PNJ / monstres a l extreme droite</text>`,
  ].join("\n");
}

function drawOverviewMap(state, world, poiNodes, decors, actors) {
  const originX = PADDING;
  const originY = 96;
  const parts = [
    panel(originX - 8, originY - 12, LEFT_WIDTH + 16, 48 * TILE + 16, "Monde entier"),
  ];

  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      parts.push(
        `<rect x="${originX + x * TILE}" y="${originY + y * TILE}" width="${TILE}" height="${TILE}" fill="${terrainColor(tile?.terrain)}"/>`
      );
    }
  }

  for (let cx = 0; cx < 3; cx += 1) {
    for (let cy = 0; cy < 3; cy += 1) {
      const chunkKey = `${cx}_${cy}`;
      const x = originX + cx * 16 * TILE;
      const y = originY + cy * 16 * TILE;
      parts.push(`<rect x="${x}" y="${y}" width="${16 * TILE}" height="${16 * TILE}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>`);
      parts.push(`<text x="${x + 8}" y="${y + 16}" fill="#0f1627" font-size="13" font-weight="700">${escapeSvg(CHUNK_LABELS[chunkKey] ?? world.screenLabel(cx, cy))}</text>`);
    }
  }

  for (const decor of decors) {
    const x = originX + decor.x * TILE;
    const y = originY + decor.y * TILE;
    const stroke = /house|well|gate|ruin/.test(decor.kind) ? "rgba(46, 24, 12, 0.85)" : "rgba(255, 225, 157, 0.75)";
    parts.push(`<rect x="${x + 1}" y="${y + 1}" width="${decor.w * TILE - 2}" height="${decor.h * TILE - 2}" fill="rgba(12,16,28,0.08)" stroke="${stroke}" stroke-width="1.5"/>`);
  }

  for (const node of poiNodes) {
    if (!node.showLabel) continue;
    if (node.showLabel && node.label) {
      parts.push(smallLabel(originX + node.anchorX * TILE, originY + node.anchorY * TILE - 6, node.label));
    }
  }

  const actorLabels = buildOverviewActorLabels(actors, originX, originY);
  for (const entry of actorLabels) {
    parts.push(`<line x1="${entry.markerX}" y1="${entry.markerY}" x2="${entry.labelX}" y2="${entry.labelY - 8}" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>`);
    parts.push(actorMarker(entry.markerX, entry.markerY, entry.color, entry.hostile));
    parts.push(smallLabel(entry.labelX, entry.labelY, entry.shortLabel, entry.color));
  }

  return parts.join("\n");
}

function drawVillageZoom(state, world, poiNodes, decors, actors) {
  const cx = 1;
  const cy = 1;
  const startX = cx * 16;
  const startY = cy * 16;
  const originX = PADDING + LEFT_WIDTH + PANEL_GAP;
  const originY = 96;
  const villageNodes = poiNodes.filter((node) => world.chunkOf(node.x, node.y).cx === cx && world.chunkOf(node.x, node.y).cy === cy);
  const villageDecors = decors.filter((decor) => decor.screenX === cx && decor.screenY === cy);
  const villageActors = actors.filter((actor) => world.chunkOf(actor.x, actor.y).cx === cx && world.chunkOf(actor.x, actor.y).cy === cy);
  const parts = [
    panel(originX - 8, originY - 12, ZOOM_WIDTH + 16, ZOOM_HEIGHT + 16, "Zoom village"),
  ];

  for (let y = startY; y < startY + 16; y += 1) {
    for (let x = startX; x < startX + 16; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      parts.push(
        `<rect x="${originX + (x - startX) * ZOOM_TILE}" y="${originY + (y - startY) * ZOOM_TILE}" width="${ZOOM_TILE}" height="${ZOOM_TILE}" fill="${terrainColor(tile?.terrain)}" stroke="rgba(17,24,38,0.18)"/>`
      );
    }
  }

  for (const decor of villageDecors) {
    const x = originX + (decor.x - startX) * ZOOM_TILE;
    const y = originY + (decor.y - startY) * ZOOM_TILE;
    const fill = /house/.test(decor.kind) ? "rgba(90, 59, 32, 0.18)" : "rgba(255, 210, 120, 0.08)";
    const stroke = /house|well/.test(decor.kind) ? "rgba(60, 34, 16, 0.85)" : "rgba(255, 222, 157, 0.8)";
    parts.push(`<rect x="${x + 1}" y="${y + 1}" width="${decor.w * ZOOM_TILE - 2}" height="${decor.h * ZOOM_TILE - 2}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
    parts.push(`<text x="${x + 6}" y="${y + 18}" fill="#2f1f13" font-size="11" font-weight="700">${escapeSvg(shortDecorLabel(decor.kind))}</text>`);
  }

  for (const node of villageNodes) {
    if (!node.showLabel) continue;
    if (node.showLabel && node.label) {
      parts.push(smallLabel(originX + (node.anchorX - startX) * ZOOM_TILE, originY + (node.anchorY - startY) * ZOOM_TILE - 8, node.label));
    }
  }

  const villageLabelLayout = buildVillageActorLabels(villageActors, originX, originY, startX, startY);
  for (const entry of villageLabelLayout) {
    parts.push(`<line x1="${entry.markerX}" y1="${entry.markerY}" x2="${entry.labelX}" y2="${entry.labelY - 10}" stroke="rgba(255,255,255,0.18)" stroke-width="1.2"/>`);
    parts.push(actorMarker(entry.markerX, entry.markerY, entry.color, entry.hostile, 5.6));
    parts.push(smallLabel(entry.labelX, entry.labelY, entry.label, entry.color));
  }

  return parts.join("\n");
}

function drawLegend(actors, world) {
  const parts = [
    panel(LEGEND_X - 8, 84, 396, SVG_HEIGHT - 108, "Liste des acteurs"),
    legendSwatch(LEGEND_X + 10, 110, KIND_COLORS.npc, "PNJ"),
    legendSwatch(LEGEND_X + 110, 110, KIND_COLORS.animal, "Animal"),
    legendSwatch(LEGEND_X + 220, 110, KIND_COLORS.monster, "Monstre"),
    legendSwatch(LEGEND_X + 330, 110, KIND_COLORS.boss, "Boss"),
  ];

  let y = 146;
  for (const actor of actors) {
    const chunk = world.chunkOf(actor.x, actor.y);
    const chunkLabel = CHUNK_LABELS[`${chunk.cx}_${chunk.cy}`] ?? world.screenLabel(chunk.cx, chunk.cy);
    const color = actorColor(actor);
    parts.push(`<circle cx="${LEGEND_X + 14}" cy="${y - 4}" r="${actor.kind === "boss" ? 5.5 : 4.5}" fill="${color}" stroke="#0f1627" stroke-width="1.5"/>`);
    parts.push(`<text x="${LEGEND_X + 28}" y="${y}" fill="#f2f6ff" font-size="13" font-weight="700">${escapeSvg(actor.name)}</text>`);
    parts.push(`<text x="${LEGEND_X + 28}" y="${y + 16}" fill="#9eb2d7" font-size="11">${escapeSvg(actor.id)} • ${actor.kind} • (${actor.x},${actor.y}) • ${escapeSvg(chunkLabel)}</text>`);
    y += 32;
  }

  return parts.join("\n");
}

function buildOverviewActorLabels(actors, originX, originY) {
  return actors.map((actor, index) => {
    const markerX = originX + (actor.x + 0.5) * TILE;
    const markerY = originY + (actor.y + 0.5) * TILE;
    const side = actor.x < 24 ? -1 : 1;
    const row = index % 3;
    const labelX = markerX + side * (28 + row * 12);
    const labelY = markerY + (-12 + row * 13);
    return {
      markerX,
      markerY,
      labelX,
      labelY,
      color: actorColor(actor),
      hostile: actor.hostile,
      shortLabel: shortActorLabel(actor),
    };
  });
}

function buildVillageActorLabels(actors, originX, originY, startX, startY) {
  const placed = [];
  return actors
    .filter((actor) => actor.kind !== "animal")
    .map((actor, index) => {
    const markerX = originX + (actor.x - startX + 0.5) * ZOOM_TILE;
    const markerY = originY + (actor.y - startY + 0.5) * ZOOM_TILE;
    const text = shortActorLabel(actor);
    const labelWidth = Math.max(58, text.length * 7 + 16);
    const candidates = [
      { x: markerX + 42 - labelWidth / 2, y: markerY - 18 },
      { x: markerX - 42 - labelWidth / 2, y: markerY - 18 },
      { x: markerX - labelWidth / 2, y: markerY - 36 },
      { x: markerX - labelWidth / 2, y: markerY + 20 },
    ].map((entry) => ({
      x: Math.round(Math.max(PADDING + LEFT_WIDTH + PANEL_GAP + 4, Math.min(entry.x, PADDING + LEFT_WIDTH + PANEL_GAP + ZOOM_WIDTH - labelWidth - 4))),
      y: Math.round(Math.max(100, Math.min(entry.y, 96 + ZOOM_HEIGHT - 24))),
      w: labelWidth,
      h: 20,
    }));
    let choice = candidates.find((candidate) => placed.every((prev) => !rectsOverlap(candidate, prev)));
    if (!choice) {
      choice = candidates[0];
    }
    placed.push(choice);
    return {
      markerX,
      markerY,
      labelX: choice.x + choice.w / 2,
      labelY: choice.y + 18,
      color: actorColor(actor),
      hostile: actor.hostile,
      label: text,
    };
  });
}

function panel(x, y, w, h, title) {
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#0f1728" stroke="#7f6336" stroke-width="1.2"/>`,
    `<text x="${x + 12}" y="${y + 22}" fill="#ffe2a0" font-size="15" font-weight="700">${escapeSvg(title)}</text>`,
  ].join("\n");
}

function smallLabel(centerX, baselineY, text, accent = "#ffe2a0") {
  const width = Math.max(58, text.length * 7 + 16);
  const x = Math.round(Math.max(4, Math.min(centerX - width / 2, SVG_WIDTH - width - 4)));
  const y = Math.round(Math.max(4, Math.min(baselineY - 18, SVG_HEIGHT - 24)));
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="20" rx="8" fill="rgba(15,23,40,0.94)" stroke="${accent}" stroke-width="1.2"/>`,
    `<text x="${Math.round(x + width / 2)}" y="${y + 14}" fill="#f2f6ff" font-size="11" font-weight="700" text-anchor="middle">${escapeSvg(text)}</text>`,
  ].join("\n");
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function legendSwatch(x, y, color, label) {
  return [
    `<circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="#0f1627" stroke-width="1.4"/>`,
    `<text x="${x + 12}" y="${y + 4}" fill="#dfe8fa" font-size="12">${escapeSvg(label)}</text>`,
  ].join("\n");
}

function actorMarker(x, y, color, hostile, radius = 4.5) {
  const ring = hostile ? "#ffd0c5" : "#0f1627";
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" stroke="${ring}" stroke-width="1.7"/>`;
}

function actorColor(actor) {
  return KIND_COLORS[actor.kind] ?? "#ffffff";
}

function shortActorLabel(actor) {
  if (actor.id === "npc_guild_master") return "Maitre guilde";
  if (actor.id === "npc_shopkeeper") return "Marchand";
  if (actor.id === "npc_innkeeper") return "Aubergiste";
  if (actor.id === "npc_guard_road") return "Garde";
  if (actor.id === "npc_child_village") return "Enfant";
  return actor.name;
}

function shortDecorLabel(kind) {
  if (kind === "house_a") return "Maison G";
  if (kind === "house_b") return "Auberge";
  if (kind === "house_c") return "Maison B";
  if (kind === "house_d") return "Boutique";
  if (kind === "guild_flag") return "Guilde";
  if (kind === "shop_stall") return "Shop";
  if (kind === "inn_sign") return "Inn";
  if (kind === "well") return "Puits";
  if (kind === "dungeon_gate") return "Donjon";
  if (kind === "boss_gate") return "Boss";
  if (kind === "ruin_a" || kind === "ruin_b") return "Ruin";
  if (kind === "forest_grove_a" || kind === "forest_grove_b") return "Bosquet";
  if (kind === "stone_cluster") return "Rochers";
  if (kind === "citadel_tower") return "Tour";
  return kind;
}

function terrainColor(terrain) {
  return TERRAIN_COLORS[terrain] ?? "#666";
}

function actorSortKey(actor) {
  return `${actor.kind}_${actor.id}`;
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

run();
