"use strict";

const fs = require("node:fs");
const path = require("node:path");

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

function loadModules() {
  const world = require("../.codex-solo-bug-hunt/lib/solo/world");
  const mapArt = require("../.codex-solo-bug-hunt/lib/solo/mapArt");
  return { world, mapArt };
}

function createPreviewState(world) {
  return world.createInitialSoloState({
    playerName: "Map",
    powerText: "map preview",
    powerRoll: 12,
    powerAccepted: true,
    characterId: "Boy",
  });
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

function toLocalAsset(publicPath) {
  return encodeURI(`../public${publicPath}`).replace(/#/g, "%23");
}

function mapObjectValues(input, mapper) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, mapper(value)]));
}

function serializeTilePreview(tile, x, y, state, mapArt) {
  return {
    x,
    y,
    terrain: tile.terrain,
    prop: tile.prop,
    poi: tile.poi,
    blocked: tile.blocked,
    terrainFrame: mapArt.pickTerrainFrame(tile.terrain, x, y, {
      worldWidth: state.worldWidth,
      worldHeight: state.worldHeight,
    }),
    terrainOverlays: mapArt.getTerrainOverlayLayers(tile.terrain, x, y),
    propLayers: mapArt.getPropLayers(tile.prop, x, y, tile.terrain),
  };
}

function buildPreviewData() {
  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_MODEL;

  const { world, mapArt } = loadModules();
  const state = createPreviewState(world);
  const poiNodes = world.getAllPoiNodes();
  const decors = collectAllDecors(world).map((decor) => ({
    ...decor,
    layers: mapArt.getDecorLayers(decor.kind),
  }));
  const structures = (typeof world.getMapStructures === "function" ? world.getMapStructures() : [])
    .map((structure) => ({
      ...structure,
    }))
    .sort((a, b) => `${a.category}_${a.id}`.localeCompare(`${b.category}_${b.id}`));
  const actors = state.actors
    .filter((actor) => actor.alive)
    .map((actor) => ({
      id: actor.id,
      name: actor.name,
      kind: actor.kind,
      hostile: actor.hostile,
      x: actor.x,
      y: actor.y,
      sprite: toLocalAsset(actor.sprite),
    }))
    .sort((a, b) => `${a.kind}_${a.id}`.localeCompare(`${b.kind}_${b.id}`));

  const tiles = state.tiles.map((tile, index) => {
    const x = index % state.worldWidth;
    const y = Math.floor(index / state.worldWidth);
    return serializeTilePreview(tile, x, y, state, mapArt);
  });

  const data = {
    layoutVersion: world.WORLD_LAYOUT_VERSION,
    worldWidth: state.worldWidth,
    worldHeight: state.worldHeight,
    tiles,
    poiNodes,
    decors,
    structures,
    actors,
    chunkLabels: CHUNK_LABELS,
    assets: mapObjectValues(mapArt.MAP_BASE_ASSETS, toLocalAsset),
    catalog: mapArt.MAP_ASSET_CATALOG.map((entry) => ({
      ...entry,
      src: toLocalAsset(mapArt.MAP_BASE_ASSETS[entry.asset]),
    })),
  };

  return { data, world, state, mapArt };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderPreviewHtml(data, options = {}) {
  const title = options.title ?? "Carte PNJ / POI avec assets reels";
  const subtitle =
    options.subtitle ??
    `Layout ${data.layoutVersion} - rendu precompile avec les memes couches terrain / props / decors que le jeu.`;
  const actorList = data.actors
    .map((actor) => {
      const chunkX = Math.floor(actor.x / 16);
      const chunkY = Math.floor(actor.y / 16);
      const chunkLabel = data.chunkLabels[`${chunkX}_${chunkY}`] ?? `${chunkX},${chunkY}`;
      return `
        <li class="actorRow actor-${escapeHtml(actor.kind)}">
          <span class="actorDot"></span>
          <div>
            <div class="actorName">${escapeHtml(actor.name)}</div>
            <div class="actorMeta">${escapeHtml(actor.id)} - ${escapeHtml(actor.kind)} - (${actor.x}, ${actor.y}) - ${escapeHtml(chunkLabel)}</div>
          </div>
        </li>
      `;
    })
    .join("");
  const structureList = (data.structures || [])
    .map((structure) => {
      const chunkX = Math.floor(structure.x / 16);
      const chunkY = Math.floor(structure.y / 16);
      const chunkLabel = data.chunkLabels[`${chunkX}_${chunkY}`] ?? `${chunkX},${chunkY}`;
      const title = structure.label || structure.id;
      return `
        <li class="structureRow structure-${escapeHtml(structure.category)}">
          <span class="structureDot"></span>
          <div>
            <div class="structureName">${escapeHtml(title)}</div>
            <div class="structureMeta">${escapeHtml(structure.id)} - ${escapeHtml(structure.category)} - ${escapeHtml(structure.decorKind)} - (${structure.x}, ${structure.y}) - ${escapeHtml(chunkLabel)}</div>
          </div>
        </li>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a1020;
      --panel: #11192d;
      --stroke: #7f6336;
      --text: #f2f6ff;
      --muted: #9eb2d7;
      --accent: #ffe2a0;
      --npc: #8be0ff;
      --animal: #ffe39a;
      --monster: #ff9e8b;
      --boss: #ff6464;
      --structure: #bfe3ff;
      --landmark: #ffd98d;
      --gate: #ffb86f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top, #15233f 0%, var(--bg) 55%);
      color: var(--text);
      font-family: Segoe UI, sans-serif;
    }
    main {
      max-width: 1880px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      margin-bottom: 18px;
      padding: 18px 20px;
      border: 1px solid var(--stroke);
      border-radius: 20px;
      background: rgba(17, 25, 45, 0.92);
    }
    h1 {
      margin: 0 0 6px;
      font-size: 28px;
      color: var(--accent);
    }
    .sub {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }
    .toolbar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 14px;
    }
    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(11, 18, 33, 0.46);
      color: var(--muted);
      font-size: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(780px, 1.25fr) minmax(520px, 0.9fr) 360px;
      gap: 18px;
      align-items: start;
    }
    .panel {
      border: 1px solid var(--stroke);
      border-radius: 20px;
      padding: 14px;
      background: rgba(17, 25, 45, 0.92);
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.2);
    }
    .panel h2 {
      margin: 0 0 10px;
      font-size: 18px;
      color: var(--accent);
    }
    .panel p {
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 13px;
    }
    canvas {
      display: block;
      width: 100%;
      max-width: 100%;
      border-radius: 14px;
      background: #101828;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    .info {
      margin-top: 10px;
      min-height: 20px;
      color: #d6e0f2;
      font-size: 13px;
    }
    .legend {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .legendItem {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      font-size: 12px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      border: 1.5px solid #0f1627;
    }
    .actorList {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
      max-height: calc(100vh - 240px);
      overflow: auto;
    }
    .actorRow {
      display: grid;
      grid-template-columns: 14px 1fr;
      gap: 10px;
      align-items: start;
      padding: 8px 10px;
      border-radius: 12px;
      background: rgba(9, 14, 25, 0.28);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .actorRow .actorDot {
      width: 10px;
      height: 10px;
      margin-top: 4px;
      border-radius: 999px;
      border: 1.5px solid #0f1627;
      background: #fff;
    }
    .actor-npc .actorDot { background: var(--npc); }
    .actor-animal .actorDot { background: var(--animal); }
    .actor-monster .actorDot { background: var(--monster); }
    .actor-boss .actorDot { background: var(--boss); }
    .actorName {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 2px;
    }
    .actorMeta {
      font-size: 11px;
      line-height: 1.35;
      color: var(--muted);
    }
    .structureTitle {
      margin: 16px 0 10px;
      font-size: 14px;
      color: var(--accent);
    }
    .structureList {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }
    .structureRow {
      display: grid;
      grid-template-columns: 14px 1fr;
      gap: 10px;
      align-items: start;
      padding: 8px 10px;
      border-radius: 12px;
      background: rgba(9, 14, 25, 0.28);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .structureDot {
      width: 10px;
      height: 10px;
      margin-top: 4px;
      border-radius: 999px;
      border: 1.5px solid #0f1627;
      background: var(--structure);
    }
    .structure-landmark .structureDot { background: var(--landmark); }
    .structure-gate .structureDot { background: var(--gate); }
    .structureName {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 2px;
    }
    .structureMeta {
      font-size: 11px;
      line-height: 1.35;
      color: var(--muted);
    }
    .foot {
      margin-top: 12px;
      color: var(--muted);
      font-size: 12px;
    }
    @media (max-width: 1680px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .actorList {
        max-height: none;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p class="sub">${escapeHtml(subtitle)}</p>
      <div class="toolbar">
        <label class="toggle"><input type="checkbox" id="toggle-poi" checked /> Labels POI</label>
        <label class="toggle"><input type="checkbox" id="toggle-actors" checked /> Labels acteurs</label>
        <label class="toggle"><input type="checkbox" id="toggle-outlines" checked /> Contours decors</label>
        <label class="toggle"><input type="checkbox" id="toggle-chunks" checked /> Cadres chunks</label>
      </div>
    </header>
    <section class="grid">
      <section class="panel">
        <h2>Monde entier</h2>
        <p>Vue globale avec les vraies couches terrain, props, decors, POI et sprites d acteurs.</p>
        <canvas id="overview" width="864" height="864"></canvas>
        <div class="info" id="overview-info">Survole la carte pour lire la case et les occupants.</div>
      </section>
      <section class="panel">
        <h2>Village Central</h2>
        <p>Zoom fort pour controler maisons, enseignes, routes, labels et positions PNJ.</p>
        <canvas id="village" width="512" height="512"></canvas>
        <div class="info" id="village-info">Le zoom village permet de verifier les ancrages et la lisibilite des services.</div>
      </section>
      <aside class="panel">
        <h2>Acteurs</h2>
        <div class="legend">
          <span class="legendItem"><span class="dot" style="background: var(--npc)"></span>PNJ</span>
          <span class="legendItem"><span class="dot" style="background: var(--animal)"></span>Animal</span>
          <span class="legendItem"><span class="dot" style="background: var(--monster)"></span>Monstre</span>
          <span class="legendItem"><span class="dot" style="background: var(--boss)"></span>Boss</span>
        </div>
        <ul class="actorList">${actorList}</ul>
        <h3 class="structureTitle">Structures</h3>
        <ul class="structureList">${structureList}</ul>
        <div class="foot">Atlas complet: ouvre aussi <code>MAP_ASSET_ATLAS.html</code> pour verifier les morceaux canoniques utilises par la map.</div>
      </aside>
    </section>
  </main>
  <script>
    const DATA = ${jsonForScript(data)};
    const OVERVIEW_TILE = 18;
    const ZOOM_TILE = 32;
    const TERRAIN_FALLBACK = {
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
    const ACTOR_COLORS = {
      npc: "#8be0ff",
      animal: "#ffe39a",
      monster: "#ff9e8b",
      boss: "#ff6464",
    };
    const controls = {
      poi: document.getElementById("toggle-poi"),
      actors: document.getElementById("toggle-actors"),
      outlines: document.getElementById("toggle-outlines"),
      chunks: document.getElementById("toggle-chunks"),
    };
    const overviewCanvas = document.getElementById("overview");
    const villageCanvas = document.getElementById("village");
    const overviewInfo = document.getElementById("overview-info");
    const villageInfo = document.getElementById("village-info");
    const imageCache = new Map();

    window.addEventListener("load", async () => {
      await preloadAllImages();
      redraw();
      attachInspector(overviewCanvas, overviewInfo, { startX: 0, startY: 0, tilePx: OVERVIEW_TILE, width: 48, height: 48 });
      attachInspector(villageCanvas, villageInfo, { startX: 16, startY: 16, tilePx: ZOOM_TILE, width: 16, height: 16 });
      Object.values(controls).forEach((input) => input.addEventListener("change", redraw));
    });

    function redraw() {
      drawOverview();
      drawVillage();
    }

    async function preloadAllImages() {
      const assetUrls = Object.values(DATA.assets);
      const actorUrls = DATA.actors.map((actor) => actor.sprite);
      const catalogUrls = DATA.catalog.map((entry) => entry.src);
      const urls = Array.from(new Set([...assetUrls, ...actorUrls, ...catalogUrls]));
      await Promise.all(urls.map(loadImage));
    }

    function loadImage(src) {
      if (imageCache.has(src)) return Promise.resolve(imageCache.get(src));
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          imageCache.set(src, img);
          resolve(img);
        };
        img.onerror = () => {
          imageCache.set(src, null);
          resolve(null);
        };
        img.src = src;
      });
    }

    function drawOverview() {
      const ctx = overviewCanvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      drawRegion(ctx, {
        startX: 0,
        startY: 0,
        width: 48,
        height: 48,
        tilePx: OVERVIEW_TILE,
        showPoiLabels: controls.poi.checked,
        showActorLabels: false,
      });
      if (controls.chunks.checked) {
        drawChunkFrames(ctx, OVERVIEW_TILE, 0, 0);
      }
    }

    function drawVillage() {
      const ctx = villageCanvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      drawRegion(ctx, {
        startX: 16,
        startY: 16,
        width: 16,
        height: 16,
        tilePx: ZOOM_TILE,
        showPoiLabels: controls.poi.checked,
        showActorLabels: controls.actors.checked,
      });
    }

    function drawRegion(ctx, options) {
      const { startX, startY, width, height, tilePx, showPoiLabels, showActorLabels } = options;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      for (let y = startY; y < startY + height; y += 1) {
        for (let x = startX; x < startX + width; x += 1) {
          const tile = tileAt(x, y);
          const px = (x - startX) * tilePx;
          const py = (y - startY) * tilePx;
          drawTile(ctx, tile, px, py, tilePx);
        }
      }

      for (const decor of DATA.decors) {
        if (!rectIntersects(decor.x, decor.y, decor.w, decor.h, startX, startY, width, height)) continue;
        drawDecor(ctx, decor, startX, startY, tilePx);
      }

      for (const node of DATA.poiNodes.filter((entry) => withinRegion(entry.x, entry.y, startX, startY, width, height))) {
        drawPoiFocus(ctx, node, startX, startY, tilePx, showPoiLabels);
      }

      const actors = DATA.actors.filter((actor) => withinRegion(actor.x, actor.y, startX, startY, width, height));
      const labelLayout = buildActorLabelLayout(actors, startX, startY, width, height, tilePx);
      for (const actor of actors.sort((a, b) => a.y - b.y)) {
        drawActor(ctx, actor, startX, startY, tilePx, showActorLabels, labelLayout.get(actor.id) ?? null);
      }
    }

    function drawTile(ctx, tile, px, py, tilePx) {
      drawLayer(ctx, tile.terrainFrame, px, py, tilePx, tilePx);
      for (const layer of tile.terrainOverlays) {
        drawLayer(ctx, layer, px, py, tilePx, tilePx);
      }
      if (!tile.terrainFrame || !DATA.assets[tile.terrainFrame.asset]) {
        ctx.fillStyle = TERRAIN_FALLBACK[tile.terrain] || "#666";
        ctx.fillRect(px, py, tilePx, tilePx);
      }
      for (const layer of tile.propLayers) {
        drawLayer(ctx, layer, px, py, tilePx, tilePx);
      }
    }

    function drawDecor(ctx, decor, startX, startY, tilePx) {
      const dx = (decor.x - startX) * tilePx;
      const dy = (decor.y - startY) * tilePx;
      const width = decor.w * tilePx;
      const height = decor.h * tilePx;
      for (const layer of decor.layers) {
        drawLayer(ctx, layer, dx, dy, width, height);
      }
      if (controls.outlines.checked) {
        ctx.save();
        ctx.strokeStyle = /house|well|gate|ruin/.test(decor.kind) ? "rgba(60, 34, 16, 0.82)" : "rgba(255, 222, 157, 0.72)";
        ctx.lineWidth = 1.6;
        ctx.strokeRect(Math.round(dx) + 1, Math.round(dy) + 1, Math.round(width) - 2, Math.round(height) - 2);
        ctx.restore();
      }
    }

    function drawLayer(ctx, layer, x, y, width, height) {
      const src = DATA.assets[layer.asset];
      const image = src ? imageCache.get(src) : null;
      const dx = x + (layer.offsetX || 0) * width;
      const dy = y + (layer.offsetY || 0) * height;
      const dw = width * (layer.widthScale || 1);
      const dh = height * (layer.heightScale || 1);
      ctx.save();
      if (typeof layer.opacity === "number") {
        ctx.globalAlpha = layer.opacity;
      }
      if (image) {
        ctx.drawImage(image, layer.sx, layer.sy, layer.sw, layer.sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
      } else if (layer.fill) {
        ctx.fillStyle = layer.fill;
        ctx.fillRect(Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
      }
      ctx.restore();
    }

    function drawChunkFrames(ctx, tilePx, startX, startY) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.58)";
      ctx.font = "700 12px Segoe UI, sans-serif";
      ctx.fillStyle = "#10192b";
      for (let cy = 0; cy < 3; cy += 1) {
        for (let cx = 0; cx < 3; cx += 1) {
          const x = (cx * 16 - startX) * tilePx;
          const y = (cy * 16 - startY) * tilePx;
          ctx.strokeRect(x, y, 16 * tilePx, 16 * tilePx);
          const key = cx + "_" + cy;
          ctx.fillText(DATA.chunkLabels[key] || key, x + 6, y + 14);
        }
      }
      ctx.restore();
    }

    function drawPoiFocus(ctx, node, startX, startY, tilePx, showLabels) {
      if (!node.showLabel) {
        return;
      }
      if (showLabels && node.showLabel && node.label) {
        drawLabel(ctx, (node.anchorX - startX) * tilePx, (node.anchorY - startY) * tilePx - 8, node.label, "#ffe2a0");
      }
    }

    function drawActor(ctx, actor, startX, startY, tilePx, showLabels, labelBox) {
      const px = (actor.x - startX) * tilePx;
      const py = (actor.y - startY) * tilePx;
      const sprite = imageCache.get(actor.sprite);
      drawShadow(ctx, px + tilePx / 2, py + tilePx - 4, Math.max(5, tilePx * 0.28), 0.25);
      if (sprite) {
        if (sprite.width >= 64 && sprite.height >= 64) {
          ctx.drawImage(sprite, 0, 0, 16, 16, Math.round(px), Math.round(py), tilePx, tilePx);
        } else {
          ctx.drawImage(sprite, 0, 0, 16, 16, Math.round(px + 1), Math.round(py + 4), tilePx - 2, tilePx - 2);
        }
      } else {
        ctx.fillStyle = ACTOR_COLORS[actor.kind] || "#fff";
        ctx.fillRect(px + 4, py + 4, tilePx - 8, tilePx - 8);
      }

      if (showLabels && labelBox) {
        drawLabelAt(ctx, labelBox.x, labelBox.y, labelBox.width, shortActorLabel(actor), ACTOR_COLORS[actor.kind] || "#ffe2a0");
      }
    }

    function drawLabel(ctx, centerX, baselineY, text, stroke) {
      ctx.save();
      ctx.font = "700 11px Segoe UI, sans-serif";
      const width = Math.max(60, Math.ceil(ctx.measureText(text).width) + 16);
      const x = Math.round(Math.max(4, Math.min(centerX - width / 2, ctx.canvas.width - width - 4)));
      const y = Math.round(Math.max(4, Math.min(baselineY - 18, ctx.canvas.height - 24)));
      ctx.fillStyle = "rgba(15, 23, 40, 0.94)";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.fillRect(x, y, width, 20);
      ctx.strokeRect(x, y, width, 20);
      ctx.fillStyle = "#f2f6ff";
      ctx.textAlign = "center";
      ctx.fillText(text, Math.round(x + width / 2), y + 14);
      ctx.restore();
    }

    function drawLabelAt(ctx, x, y, width, text, stroke) {
      ctx.save();
      ctx.font = "700 11px Segoe UI, sans-serif";
      ctx.fillStyle = "rgba(15, 23, 40, 0.94)";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.fillRect(x, y, width, 20);
      ctx.strokeRect(x, y, width, 20);
      ctx.fillStyle = "#f2f6ff";
      ctx.textAlign = "center";
      ctx.fillText(text, Math.round(x + width / 2), y + 14);
      ctx.restore();
    }

    function buildActorLabelLayout(actors, startX, startY, width, height, tilePx) {
      const placed = [];
      const byPriority = actors
        .filter((actor) => actor.kind !== "animal")
        .slice()
        .sort((left, right) => actorPriority(right) - actorPriority(left));
      const layout = new Map();

      for (const actor of byPriority) {
        const markerX = (actor.x - startX + 0.5) * tilePx;
        const markerY = (actor.y - startY + 0.5) * tilePx;
        const text = shortActorLabel(actor);
        const labelWidth = Math.max(60, text.length * 7 + 16);
        const candidates = [
          { x: markerX + tilePx * 0.85 - labelWidth / 2, y: markerY - 26 },
          { x: markerX - tilePx * 0.85 - labelWidth / 2, y: markerY - 26 },
          { x: markerX - labelWidth / 2, y: markerY - tilePx * 1.18 },
          { x: markerX - labelWidth / 2, y: markerY + tilePx * 0.62 },
        ].map((entry) => ({
          x: Math.round(Math.max(4, Math.min(entry.x, width * tilePx - labelWidth - 4))),
          y: Math.round(Math.max(4, Math.min(entry.y, height * tilePx - 24))),
          width: labelWidth,
          height: 20,
        }));

        let choice = candidates.find((candidate) => placed.every((prev) => !boxesOverlap(candidate, prev)));
        if (!choice) {
          choice = candidates[0];
        }
        placed.push(choice);
        layout.set(actor.id, choice);
      }

      return layout;
    }

    function actorPriority(actor) {
      if (actor.kind === "boss") return 4;
      if (actor.kind === "monster") return 3;
      if (actor.id === "npc_guild_master" || actor.id === "npc_shopkeeper" || actor.id === "npc_innkeeper") return 3;
      return 2;
    }

    function boxesOverlap(left, right) {
      return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
    }

    function drawShadow(ctx, x, y, radius, alpha) {
      ctx.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function attachInspector(canvas, output, config) {
      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const localX = Math.floor((event.clientX - rect.left) * scaleX);
        const localY = Math.floor((event.clientY - rect.top) * scaleY);
        const tileX = config.startX + Math.floor(localX / config.tilePx);
        const tileY = config.startY + Math.floor(localY / config.tilePx);
        if (tileX < config.startX || tileY < config.startY || tileX >= config.startX + config.width || tileY >= config.startY + config.height) {
          output.textContent = "Hors zone.";
          return;
        }
        const tile = tileAt(tileX, tileY);
        const actors = DATA.actors.filter((actor) => actor.x === tileX && actor.y === tileY);
        const structures = (DATA.structures || []).filter((structure) => tileX >= structure.x && tileX < structure.x + structure.w && tileY >= structure.y && tileY < structure.y + structure.h);
        const actorText = actors.length > 0 ? " | acteurs: " + actors.map((actor) => actor.name).join(", ") : "";
        const structureText = structures.length > 0 ? " | structures: " + structures.map((structure) => structure.label || structure.id).join(", ") : "";
        const poiText = tile.poi ? " | poi: " + poiName(tile.poi) : "";
        const propText = tile.prop && tile.prop !== "none" ? " | prop: " + tile.prop : "";
        output.textContent = "Case (" + tileX + ", " + tileY + ") - terrain: " + tile.terrain + poiText + propText + structureText + actorText;
      });
      canvas.addEventListener("mouseleave", () => {
        output.textContent = "Survole la carte pour lire la case et les occupants.";
      });
    }

    function rectIntersects(x, y, w, h, startX, startY, width, height) {
      return x < startX + width && x + w > startX && y < startY + height && y + h > startY;
    }

    function withinRegion(x, y, startX, startY, width, height) {
      return x >= startX && y >= startY && x < startX + width && y < startY + height;
    }

    function tileAt(x, y) {
      return DATA.tiles[y * DATA.worldWidth + x];
    }

    function shortActorLabel(actor) {
      if (actor.id === "npc_guild_master") return "Maitre guilde";
      if (actor.id === "npc_shopkeeper") return "Marchand";
      if (actor.id === "npc_innkeeper") return "Aubergiste";
      if (actor.id === "npc_guard_road") return "Garde";
      if (actor.id === "npc_child_village") return "Enfant";
      return actor.name;
    }

    function poiName(poi) {
      if (poi === "guild") return "Guilde";
      if (poi === "shop") return "Boutique";
      if (poi === "inn") return "Auberge";
      if (poi === "house") return "Maison";
      if (poi === "dungeon_gate") return "Donjon";
      if (poi === "boss_gate") return "Citadelle";
      return "Camp";
    }
  </script>
</body>
</html>`;
}

function renderAtlasHtml(data, options = {}) {
  const title = options.title ?? "Atlas des assets de map";
  const subtitle =
    options.subtitle ??
    "Catalogue semantique des morceaux canoniques utilises par la map. Verifie ici qu un sprite est bien associe a un role clair avant de l employer.";
  const cards = data.catalog
    .map(
      (entry, index) => `
        <article class="card" data-index="${index}">
          <canvas width="96" height="96" data-canvas="${index}"></canvas>
          <div class="meta">
            <div class="label">${escapeHtml(entry.label)}</div>
            <div class="id">${escapeHtml(entry.id)}</div>
            <div class="category">${escapeHtml(entry.category)}</div>
            <p>${escapeHtml(entry.note)}</p>
          </div>
        </article>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a1020;
      --panel: #11192d;
      --stroke: #7f6336;
      --text: #f2f6ff;
      --muted: #9eb2d7;
      --accent: #ffe2a0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Segoe UI, sans-serif;
      color: var(--text);
      background: radial-gradient(circle at top, #15233f 0%, var(--bg) 60%);
    }
    main {
      max-width: 1680px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      padding: 18px 20px;
      border: 1px solid var(--stroke);
      border-radius: 20px;
      background: rgba(17, 25, 45, 0.92);
      margin-bottom: 18px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 28px;
      color: var(--accent);
    }
    p.sub {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .card {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 14px;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(17, 25, 45, 0.92);
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
    }
    canvas {
      width: 96px;
      height: 96px;
      border-radius: 12px;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      background:
        linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%),
        linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%);
      background-size: 18px 18px;
      background-position: 0 0, 9px 9px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .meta {
      min-width: 0;
    }
    .label {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }
    .id {
      font-size: 12px;
      color: #86b6ff;
      margin-bottom: 4px;
    }
    .category {
      display: inline-block;
      margin-bottom: 8px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(255, 226, 160, 0.12);
      border: 1px solid rgba(255, 226, 160, 0.24);
      color: var(--accent);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .meta p {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p class="sub">${escapeHtml(subtitle)}</p>
    </header>
    <section class="grid">${cards}</section>
  </main>
  <script>
    const DATA = ${jsonForScript(data.catalog)};
    const imageCache = new Map();

    window.addEventListener("load", async () => {
      const urls = Array.from(new Set(DATA.map((entry) => entry.src)));
      await Promise.all(urls.map(loadImage));
      for (const entry of DATA) {
        const canvas = document.querySelector('canvas[data-canvas="' + entry.index + '"]');
        if (!canvas) continue;
      }
      document.querySelectorAll("canvas[data-canvas]").forEach((canvas) => {
        const index = Number(canvas.getAttribute("data-canvas"));
        const entry = DATA[index];
        if (!entry) return;
        drawEntry(canvas, entry);
      });
    });

    function loadImage(src) {
      if (imageCache.has(src)) return Promise.resolve(imageCache.get(src));
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          imageCache.set(src, img);
          resolve(img);
        };
        img.onerror = () => {
          imageCache.set(src, null);
          resolve(null);
        };
        img.src = src;
      });
    }

    function drawEntry(canvas, entry) {
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const image = imageCache.get(entry.src);
      if (!image) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }
      const scale = Math.min(canvas.width / entry.sw, canvas.height / entry.sh);
      const dw = Math.floor(entry.sw * scale);
      const dh = Math.floor(entry.sh * scale);
      const dx = Math.floor((canvas.width - dw) / 2);
      const dy = Math.floor((canvas.height - dh) / 2);
      ctx.drawImage(image, entry.sx, entry.sy, entry.sw, entry.sh, dx, dy, dw, dh);
    }
  </script>
</body>
</html>`;
}

function writePreviewHtml(outputPath, options = {}) {
  const { data } = buildPreviewData();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderPreviewHtml(data, options), "utf8");
  return outputPath;
}

function writeAssetAtlasHtml(outputPath, options = {}) {
  const { data } = buildPreviewData();
  data.catalog = data.catalog.map((entry, index) => ({ ...entry, index }));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderAtlasHtml(data, options), "utf8");
  return outputPath;
}

module.exports = {
  CHUNK_LABELS,
  buildPreviewData,
  renderPreviewHtml,
  renderAtlasHtml,
  writePreviewHtml,
  writeAssetAtlasHtml,
};
