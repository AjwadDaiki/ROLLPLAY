"use strict";

const path = require("node:path");
const { writeAssetAtlasHtml, writePreviewHtml } = require("./map-preview-shared");

function run() {
  const previewPath = path.resolve("docs", "WORLD_PNJ_MAP_ASSETS.html");
  const auditPath = path.resolve("docs", "WORLD_AUDIT_ASSETS.html");
  const atlasPath = path.resolve("docs", "MAP_ASSET_ATLAS.html");

  writePreviewHtml(previewPath, {
    title: "Carte PNJ / POI avec assets reels",
    subtitle:
      "Layout compile a partir du catalogue d assets canonique et des memes couches terrain / props / decors que le jeu.",
  });
  writePreviewHtml(auditPath, {
    title: "World Audit Assets",
    subtitle:
      "Vue d audit avec vrais assets pour verifier portes, labels, empreintes de decors, routes et positions PNJ sans relancer le jeu.",
  });
  writeAssetAtlasHtml(atlasPath, {
    title: "Atlas des assets de map",
  });

  process.stdout.write(`Generated ${previewPath}\n`);
  process.stdout.write(`Generated ${auditPath}\n`);
  process.stdout.write(`Generated ${atlasPath}\n`);
}

run();
