#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const docsRoot = path.join(projectRoot, "docs");
const archiveRoot = path.join(docsRoot, "archive");

const allowedRootFiles = new Set([
  "README.md",
  "DOCS_CONVENTION.md",
  "COMPREHENSION_PROJET.md",
  "SYSTEMES_VARIABLES_REFERENCE.md",
  "ONBOARDING_DEV_RAPIDE.md",
  "PLAN_IMPLEMENTATION_JRPG_ISEKAI.md",
  "VISION_JRPG_ISEKAI_CONCRETE_GAMEPLAY.md",
  "ENGINE_SPEC.md",
  "PROJECT_GUIDE.md",
  "INTERACTION_REWORK_SPEC.md",
  "CORE_BASELINE.md",
  "ROADMAP_QA.md",
  "BUG_FIX_PIPELINE.md",
  "MAP_ART_SYSTEM.md",
]);

const requiredRootFiles = [
  "README.md",
  "DOCS_CONVENTION.md",
  "PLAN_IMPLEMENTATION_JRPG_ISEKAI.md",
  "VISION_JRPG_ISEKAI_CONCRETE_GAMEPLAY.md",
  "COMPREHENSION_PROJET.md",
  "SYSTEMES_VARIABLES_REFERENCE.md",
  "ONBOARDING_DEV_RAPIDE.md",
];

const allowedArchiveDirs = new Set(["generalization", "audits", "legacy", "map"]);

function fail(errors) {
  console.error("\n[docs:check] Echec");
  for (const entry of errors) {
    console.error(`- ${entry}`);
  }
  console.error(
    "\nCorrige les erreurs ou deplace les docs obsoletes dans docs/archive/{generalization|audits|legacy}/"
  );
  process.exit(1);
}

function main() {
  const errors = [];

  if (!fs.existsSync(docsRoot) || !fs.statSync(docsRoot).isDirectory()) {
    fail(["Le dossier docs/ est introuvable."]);
    return;
  }

  const rootEntries = fs.readdirSync(docsRoot, { withFileTypes: true });
  const rootFiles = rootEntries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const rootDirs = rootEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  for (const required of requiredRootFiles) {
    if (!rootFiles.includes(required)) {
      errors.push(`Fichier requis manquant dans docs/: ${required}`);
    }
  }

  for (const file of rootFiles) {
    if (!file.toLowerCase().endsWith(".md")) {
      errors.push(`Fichier non-markdown interdit a la racine docs/: ${file}`);
      continue;
    }
    if (!allowedRootFiles.has(file)) {
      errors.push(`Fichier non autorise a la racine docs/: ${file}`);
    }
    if (!/^(README|[A-Z0-9_]+)\.md$/.test(file)) {
      errors.push(`Nom invalide (utiliser README.md ou UPPER_SNAKE_CASE.md): ${file}`);
    }
  }

  const allowedRootDirs = new Set(["archive", "sources"]);
  for (const dir of rootDirs) {
    if (!allowedRootDirs.has(dir)) {
      errors.push(`Dossier non autorise a la racine docs/: ${dir}`);
    }
  }

  if (!fs.existsSync(archiveRoot) || !fs.statSync(archiveRoot).isDirectory()) {
    errors.push("Le dossier docs/archive/ est manquant.");
  } else {
    const archiveReadme = path.join(archiveRoot, "README.md");
    if (!fs.existsSync(archiveReadme)) {
      errors.push("docs/archive/README.md est manquant.");
    }
    const archiveEntries = fs.readdirSync(archiveRoot, { withFileTypes: true });
    const archiveDirs = archiveEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    for (const dir of archiveDirs) {
      if (!allowedArchiveDirs.has(dir)) {
        errors.push(`Sous-dossier archive non autorise: docs/archive/${dir}`);
      }
    }
  }

  if (errors.length > 0) {
    fail(errors);
    return;
  }

  console.log("[docs:check] OK");
  console.log(`- docs root files: ${rootFiles.length}`);
  console.log(`- docs root allowlist: ${allowedRootFiles.size}`);
  console.log(`- archive dirs: ${Array.from(allowedArchiveDirs).join(", ")}`);
}

main();
