import Groq from "groq-sdk";
import { buildStoryLine } from "./logic";
import { findShopCatalogEntry, renderShopStockList } from "./shop";
import type { PoiType, SoloOutcome, SoloResolveRequest, SpawnActor, TerrainChange } from "./types";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const MAX_MOVE_TO_POI_STEPS = 8;

const MONSTER_SPAWN_FALLBACK = {
  sprite:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/Skeleton/SeparateAnim/Walk.png",
  face: "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/Skeleton/Faceset.png",
};

type ActionIntent = {
  wantsMove: boolean;
  wantsAttack: boolean;
  wantsApproachHostile: boolean;
  wantsDestroy: boolean;
  wantsBuy: boolean;
  wantsLoot: boolean;
  wantsRest: boolean;
  wantsTalk: boolean;
  wantsQuest: boolean;
  wantsObjective: boolean;
  wantsShop: boolean;
  wantsGuild: boolean;
  wantsInn: boolean;
  wantsHouse: boolean;
  wantsNearest: boolean;
  wantsDungeon: boolean;
  wantsBoss: boolean;
  asksList: boolean;
};

export async function resolveSoloAction(input: SoloResolveRequest): Promise<SoloOutcome> {
  if (!input.actionText || !input.context) {
    return fallbackOutcome("Action invalide.", input);
  }

  if (!groq) {
    return resolveLocally(input);
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.55,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(input),
        },
        {
          role: "user",
          content: `Action joueur: ${input.actionText}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseOutcome(raw, input);
    if (!parsed) return resolveLocally(input);
    return postProcessOutcome(parsed, input);
  } catch {
    return resolveLocally(input);
  }
}

function buildSystemPrompt(input: SoloResolveRequest): string {
  const ctx = input.context;
  return [
    "Tu es le MJ IA d un RPG solo isekai tour par tour.",
    "Reponds uniquement en JSON valide respectant SoloOutcome.",
    "Le joueur peut tenter toute action.",
    "Le moteur applique seulement des operations valides.",
    "D20: 1 catastrophe / 2-5 echec / 6-10 partiel / 11-14 succes / 15-19 gros succes / 20 legendaire.",
    "Si action sans risque: diceRoll null.",
    "N envoie pas de champs non demandes. N envoie destroyTarget que si destruction explicite.",
    "Toujours fournir storyLine (phrase courte style narration en haut).",
    "Contexte joueur:",
    JSON.stringify(ctx),
    "Schema attendu:",
    JSON.stringify({
      narrative: "string",
      storyLine: "string",
      diceRoll: "number|null",
      moveBy: { dx: 0, dy: 0 },
      moveToPoi: "camp|guild|shop|inn|house|dungeon_gate|boss_gate|null",
      moveToPoiSteps: 2,
      approachNearestHostile: false,
      damageSelf: 0,
      healSelf: 0,
      stressDelta: 0,
      strengthDelta: 0,
      goldDelta: 0,
      requestQuest: false,
      buyItemName: null,
      addItemName: null,
      destroyTarget: { dx: 0, dy: -1 },
      attackNearestHostile: false,
      attackPower: 8,
      talkToNearestNpc: false,
      npcSpeech: null,
      terrainChanges: [],
      spawnActors: [],
      worldEvent: null,
      objectivePatch: null,
      completeObjective: false,
    }),
  ].join("\n");
}

function parseOutcome(raw: string, input: SoloResolveRequest): SoloOutcome | null {
  try {
    const payload = JSON.parse(extractJson(raw)) as Record<string, unknown>;
    return sanitizeOutcome(payload, input);
  } catch {
    return null;
  }
}

function sanitizeOutcome(payload: Record<string, unknown>, input: SoloResolveRequest): SoloOutcome {
  const normalizedAction = normalize(input.actionText);
  const intent = parseIntent(normalizedAction);

  const moveRaw = asObject(payload.moveBy);
  const destroyRaw = asObject(payload.destroyTarget);

  const moveBy = moveRaw
    ? {
        dx: clamp(asInt(moveRaw.dx, 0), -10, 10),
        dy: clamp(asInt(moveRaw.dy, 0), -10, 10),
      }
    : undefined;

  const destroyTarget = destroyRaw
    ? {
        dx: clamp(asInt(destroyRaw.dx, 0), -4, 4),
        dy: clamp(asInt(destroyRaw.dy, -1), -4, 4),
      }
    : undefined;

  const moveToPoi = asPoi(payload.moveToPoi);

  const out: SoloOutcome = {
    narrative: asString(payload.narrative, "Le maitre du jeu observe la scene."),
    storyLine: asString(payload.storyLine, buildStoryLine(input.context.playerName, input.actionText)),
    diceRoll:
      payload.diceRoll === null || typeof payload.diceRoll === "undefined"
        ? null
        : clamp(asInt(payload.diceRoll, 10), 1, 20),
    moveBy: moveBy && (moveBy.dx !== 0 || moveBy.dy !== 0) ? moveBy : undefined,
    moveToPoi: moveToPoi ?? undefined,
    moveToPoiSteps: clamp(asInt(payload.moveToPoiSteps, 4), 1, MAX_MOVE_TO_POI_STEPS),
    approachNearestHostile: asBool(payload.approachNearestHostile, false),
    damageSelf: clamp(asInt(payload.damageSelf, 0), 0, 30),
    healSelf: clamp(asInt(payload.healSelf, 0), 0, 30),
    stressDelta: clamp(asInt(payload.stressDelta, 0), -30, 30),
    strengthDelta: clamp(asInt(payload.strengthDelta, 0), -5, 5),
    goldDelta: clamp(asInt(payload.goldDelta, 0), -200, 200),
    requestQuest: asBool(payload.requestQuest, false),
    buyItemName: nullableString(payload.buyItemName),
    addItemName: nullableString(payload.addItemName),
    destroyTarget:
      destroyTarget && (intent.wantsDestroy || destroyTarget.dx !== 0 || destroyTarget.dy !== 0)
        ? destroyTarget
        : undefined,
    attackNearestHostile: asBool(payload.attackNearestHostile, false),
    attackPower: clamp(asInt(payload.attackPower, 8), 1, 50),
    talkToNearestNpc: asBool(payload.talkToNearestNpc, false),
    npcSpeech: nullableString(payload.npcSpeech),
    terrainChanges: Array.isArray(payload.terrainChanges)
      ? payload.terrainChanges
          .map((entry) => asTerrainChange(entry))
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
          .slice(0, 6)
      : undefined,
    spawnActors: Array.isArray(payload.spawnActors)
      ? payload.spawnActors
          .map((entry) => asSpawn(entry))
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
          .slice(0, 3)
      : undefined,
    worldEvent: nullableString(payload.worldEvent),
    objectivePatch: nullableString(payload.objectivePatch),
    completeObjective: asBool(payload.completeObjective, false),
  };

  return postProcessOutcome(out, input);
}

function postProcessOutcome(outcome: SoloOutcome, input: SoloResolveRequest): SoloOutcome {
  const text = normalize(input.actionText);
  const intent = parseIntent(text);
  const hasDirection = hasDirectionWords(text);
  const ctx = input.context;
  const poiTarget = detectPoiTarget(intent, text);
  const parsedDirectionMove = parseMove(text);
  const risky = isRiskyAction(
    text,
    intent,
    ctx.nearActors.some((actor) => actor.hostile && actor.distance <= 2)
  );

  const next: SoloOutcome = {
    ...outcome,
    storyLine: outcome.storyLine || buildStoryLine(ctx.playerName, input.actionText),
    narrative: outcome.narrative || "Le maitre du jeu observe ton initiative.",
  };

  if (!intent.wantsDestroy) {
    next.destroyTarget = undefined;
  }

  if (!intent.wantsAttack) {
    next.attackNearestHostile = false;
    next.attackPower = undefined;
  }

  if (!intent.wantsApproachHostile && !intent.wantsAttack) {
    next.approachNearestHostile = false;
  }

  if (!intent.wantsQuest) {
    next.requestQuest = false;
  }

  if (!intent.wantsBuy) {
    next.buyItemName = null;
  }

  if (!intent.wantsLoot) {
    next.addItemName = next.addItemName && intent.wantsBuy ? next.addItemName : null;
  }

  if (intent.wantsMove && !intent.wantsApproachHostile && !next.moveBy && !next.moveToPoi) {
    if (parsedDirectionMove && (!poiTarget || hasDirection)) {
      next.moveBy = { dx: parsedDirectionMove.dx, dy: parsedDirectionMove.dy };
    } else if (poiTarget) {
      next.moveToPoi = poiTarget;
    }
  }

  if (hasDirection && parsedDirectionMove) {
    next.moveBy = { dx: parsedDirectionMove.dx, dy: parsedDirectionMove.dy };
    if (!intent.wantsShop && !intent.wantsGuild && !intent.wantsInn && !intent.wantsHouse) {
      next.moveToPoi = undefined;
      next.moveToPoiSteps = undefined;
    }
  }

  if (poiTarget && !hasDirection) {
    next.moveBy = undefined;
    next.moveToPoi = poiTarget;
  }

  if (intent.wantsShop && !isNearPoi(ctx, "shop")) {
    next.moveBy = undefined;
    next.moveToPoi = "shop";
    next.moveToPoiSteps = 6;
  }

  if (intent.wantsShop && (intent.wantsMove || intent.wantsBuy || intent.asksList) && !isNearPoi(ctx, "shop")) {
    next.moveToPoi = "shop";
    next.moveToPoiSteps = 4;
  }

  if (intent.wantsGuild && (intent.wantsMove || intent.wantsQuest) && !isNearPoi(ctx, "guild")) {
    next.moveToPoi = "guild";
    next.moveToPoiSteps = 4;
  }

  if (intent.wantsInn && (intent.wantsMove || intent.wantsRest) && !isNearPoi(ctx, "inn")) {
    next.moveToPoi = "inn";
    next.moveToPoiSteps = 4;
  }

  if (intent.wantsHouse && isNearPoi(ctx, "house")) {
    next.moveToPoi = "house";
    next.moveToPoiSteps = 2;
  }

  if (intent.wantsHouse && intent.wantsNearest && (intent.wantsMove || intent.wantsTalk) && !isNearPoi(ctx, "house")) {
    next.moveToPoi = "house";
    next.moveToPoiSteps = 4;
  }

  if (intent.wantsDungeon && intent.wantsMove && !isNearPoi(ctx, "dungeon_gate")) {
    next.moveToPoi = "dungeon_gate";
    next.moveToPoiSteps = 5;
  }

  if (intent.wantsBoss && intent.wantsMove && !isNearPoi(ctx, "boss_gate")) {
    next.moveToPoi = "boss_gate";
    next.moveToPoiSteps = 6;
  }

  if (intent.asksList && intent.wantsShop) {
    next.talkToNearestNpc = true;
    next.npcSpeech = renderShopStockList();
    if (!isNearPoi(ctx, "shop")) {
      next.moveToPoi = "shop";
      next.moveToPoiSteps = 4;
      next.narrative = "Tu te diriges vers la boutique pour consulter le stock.";
    } else {
      next.narrative = "Le marchand te montre clairement ses articles.";
    }
  }

  if (intent.wantsBuy && !isNearPoi(ctx, "shop") && !next.moveToPoi) {
    next.moveToPoi = "shop";
    next.moveToPoiSteps = 4;
    next.narrative = "Tu te mets en route vers la boutique avant d acheter.";
  }

  if (intent.wantsBuy && !isNearPoi(ctx, "shop")) {
    next.buyItemName = null;
    if (!next.moveToPoi) {
      next.moveToPoi = "shop";
      next.moveToPoiSteps = 4;
    }
    next.narrative = "Tu te diriges d abord vers la boutique. L achat viendra une fois sur place.";
  }

  if (intent.wantsBuy && next.buyItemName) {
    const entry = findShopCatalogEntry(next.buyItemName);
    if (entry) {
      next.buyItemName = entry.name;
    } else {
      next.buyItemName = null;
      if (isNearPoi(ctx, "shop")) {
        next.talkToNearestNpc = true;
        next.npcSpeech = renderShopStockList();
        next.narrative = "Le marchand ne vend pas cet objet. Il te montre son vrai stock.";
      }
    }
  }

  if (intent.wantsQuest && !isNearPoi(ctx, "guild") && !next.moveToPoi) {
    next.moveToPoi = "guild";
    next.moveToPoiSteps = 4;
    next.narrative = "Tu cherches la guilde pour recuperer une mission.";
  }

  if (intent.wantsRest && !intent.wantsBuy && !isNearPoi(ctx, "inn") && !next.moveToPoi) {
    next.moveToPoi = "inn";
    next.moveToPoiSteps = 4;
    next.narrative = "Tu avances vers l auberge pour recuperer.";
  }

  if (intent.wantsHouse && !intent.wantsNearest && !isNearPoi(ctx, "house")) {
    next.moveBy = undefined;
    next.moveToPoi = undefined;
    next.moveToPoiSteps = undefined;
    next.narrative = "Il y a plusieurs maisons. Precise laquelle ou dis la plus proche.";
  }

  if (intent.wantsApproachHostile && !intent.wantsAttack) {
    next.approachNearestHostile = true;
    next.moveBy = undefined;
    if (/jusqu|jusqua|jusqu au|jusqu a|aller voir/.test(text)) {
      next.moveToPoiSteps = 8;
    } else if (!next.moveToPoiSteps) {
      next.moveToPoiSteps = 6;
    }
    next.narrative = "Tu t approches prudemment de la menace.";
  }

  if (intent.wantsAttack) {
    next.attackNearestHostile = true;
    next.approachNearestHostile = true;
    if (!next.attackPower || next.attackPower < 10) {
      next.attackPower = /tue|elimine|acheve|termine/.test(text) ? 18 : 12;
    }
  }

  if (!risky) {
    next.diceRoll = null;
  } else {
    if (typeof next.diceRoll !== "number") {
      next.diceRoll = rollD20();
    }
    if (next.moveToPoi) {
      if (next.diceRoll <= 5) {
        next.moveToPoi = undefined;
        next.moveToPoiSteps = undefined;
        next.narrative = "Tu rates ton orientation et restes sur place.";
      } else if (next.diceRoll <= 10) {
        next.moveToPoiSteps = 3;
      } else if (next.diceRoll <= 19) {
        next.moveToPoiSteps = 5;
      } else {
        next.moveToPoiSteps = 6;
      }
    }
    if (next.approachNearestHostile && next.diceRoll <= 5) {
      next.approachNearestHostile = false;
      next.narrative = "Tu hesites et n oses pas approcher le monstre.";
    }
  }

  if (next.moveBy && next.moveBy.dx === 0 && next.moveBy.dy === 0) {
    next.moveBy = undefined;
  }

  return next;
}

function resolveLocally(input: SoloResolveRequest): SoloOutcome {
  const text = normalize(input.actionText);
  const ctx = input.context;
  const intent = parseIntent(text);
  const hasDirection = hasDirectionWords(text);
  const risky = isRiskyAction(text, intent, ctx.nearActors.some((actor) => actor.hostile && actor.distance <= 2));
  const roll = risky ? rollD20() : null;

  const outcome: SoloOutcome = {
    narrative: "Le maitre du jeu analyse ton action.",
    storyLine: buildStoryLine(ctx.playerName, input.actionText),
    diceRoll: roll,
    goldDelta: 0,
    stressDelta: 0,
  };

  const poiTarget = detectPoiTarget(intent, text);
  const move = parseMove(text);

  if (intent.wantsHouse && !intent.wantsNearest && !isNearPoi(ctx, "house")) {
    outcome.narrative = "Precise la maison cible ou demande la maison la plus proche.";
    outcome.diceRoll = null;
    return outcome;
  }

  if (intent.wantsMove) {
    const movePower = computeMovePower(roll);
    if (intent.wantsHouse && isNearPoi(ctx, "house")) {
      outcome.moveToPoi = "house";
      outcome.moveToPoiSteps = 2;
      outcome.narrative = "Tu te rapproches de la maison la plus proche.";
    }

    if (poiTarget && !isNearPoi(ctx, poiTarget)) {
      outcome.moveToPoi = poiTarget;
      outcome.moveToPoiSteps = roll !== null && roll <= 10 ? 2 : roll === 20 ? 6 : roll !== null && roll >= 15 ? 5 : 4;
      outcome.narrative = `Tu te diriges vers ${poiLabelFr(poiTarget)}.`;
    }

    if (move && movePower > 0 && (!poiTarget || hasDirection) && !intent.wantsApproachHostile) {
      outcome.moveBy = {
        dx: move.dx * movePower,
        dy: move.dy * movePower,
      };
      outcome.narrative = narrateMove(move, roll);
    }
  }

  if (intent.wantsAttack) {
    outcome.attackNearestHostile = true;
    outcome.attackPower = computeAttackPower(roll);
    if (roll !== null && roll <= 4) {
      outcome.damageSelf = 2;
      outcome.stressDelta = (outcome.stressDelta ?? 0) + 6;
    }
    outcome.narrative = narrateAttack(roll);
  }

  if (intent.wantsApproachHostile && !intent.wantsAttack) {
    outcome.approachNearestHostile = true;
    outcome.moveBy = undefined;
    outcome.moveToPoiSteps = /jusqu|jusqua|jusqu au|jusqu a|aller voir/.test(text) ? 8 : 6;
    outcome.narrative = "Tu avances vers la creature que tu as reperee.";
  }

  if (intent.wantsDestroy) {
    outcome.destroyTarget = move
      ? { dx: clamp(move.dx, -1, 1), dy: clamp(move.dy, -1, 1) }
      : { dx: 0, dy: -1 };
    outcome.narrative = narrateDestroy(roll);
  }

  if (intent.wantsQuest) {
    if (isNearPoi(ctx, "guild")) {
      outcome.requestQuest = true;
      outcome.narrative = "Le tableau de guilde grince et valide ton inscription.";
    } else {
      outcome.moveToPoi = "guild";
      outcome.moveToPoiSteps = 6;
      outcome.narrative = "Tu te rends vers la guilde pour trouver une mission.";
    }
  }

  if (intent.wantsShop && intent.asksList) {
    outcome.talkToNearestNpc = true;
    outcome.npcSpeech = renderShopStockList();
    if (!isNearPoi(ctx, "shop")) {
      outcome.moveToPoi = "shop";
      outcome.moveToPoiSteps = 4;
      outcome.narrative = "Tu te diriges vers la boutique pour voir la liste.";
    } else {
      outcome.narrative = "Le marchand te presente son stock.";
    }
  }

  if (intent.wantsShop && !intent.asksList && !intent.wantsBuy) {
    if (!isNearPoi(ctx, "shop")) {
      outcome.moveToPoi = "shop";
      outcome.moveToPoiSteps = 6;
      outcome.narrative = "Tu te diriges vers la boutique.";
    } else {
      outcome.talkToNearestNpc = true;
      outcome.narrative = "Tu ouvres la boutique.";
    }
  }

  if (intent.wantsBuy) {
    if (isNearPoi(ctx, "shop")) {
      const requestedName = extractItemName(text, ["acheter", "achete", "buy", "shop", "boutique", "prends"]);
      const entry = findShopCatalogEntry(requestedName || "potion de soin");
      if (entry) {
        outcome.buyItemName = entry.name;
        outcome.narrative = `Le marchand te vend ${entry.name}.`;
      } else {
        outcome.talkToNearestNpc = true;
        outcome.npcSpeech = renderShopStockList();
        outcome.narrative = "Le marchand secoue la tete: cet objet n est pas en stock.";
      }
    } else {
      outcome.moveToPoi = "shop";
      outcome.moveToPoiSteps = 4;
      outcome.narrative = "Tu dois d abord rejoindre la boutique.";
    }
  }

  if (intent.wantsLoot) {
    const itemName = extractItemName(text, [
      "prend",
      "ramasse",
      "obtiens",
      "forge",
      "craft",
      "cree",
      "invoque",
      "fabrique",
    ]);
    outcome.addItemName = itemName || "materiau improvise";
    outcome.narrative = `Le monde repond: ${outcome.addItemName} rejoint ton inventaire.`;
  }

  if (intent.wantsRest && !intent.wantsBuy) {
    if (!isNearPoi(ctx, "inn")) {
      outcome.moveToPoi = "inn";
      outcome.moveToPoiSteps = 4;
      outcome.narrative = "Tu cherches l auberge pour te reposer.";
    } else {
      outcome.healSelf = roll === null ? 4 : Math.max(1, Math.floor((roll + 2) / 4));
      outcome.stressDelta = (outcome.stressDelta ?? 0) - 14;
      outcome.narrative = "Tu reprends ton souffle et recuperes tes forces.";
    }
  }

  if (intent.wantsTalk && !intent.asksList) {
    outcome.talkToNearestNpc = true;
    outcome.npcSpeech = pickNpcSpeech(text);
    outcome.stressDelta = (outcome.stressDelta ?? 0) - 4;
    outcome.narrative = "La conversation influence ton prochain choix.";
  }

  if (intent.wantsObjective && roll !== null && roll >= 15) {
    outcome.objectivePatch = "Construire ta propre faction et renverser l ordre etabli";
    outcome.narrative = "Ton ambition change la trajectoire de ton aventure.";
  }

  if (/invoque|summon|apparaitre monstre/.test(text) && roll !== null && roll >= 11) {
    outcome.spawnActors = [
      {
        name: "Spectre invoque",
        kind: "monster",
        hp: 12,
        hostile: true,
        dx: 1,
        dy: 0,
        sprite: MONSTER_SPAWN_FALLBACK.sprite,
        face: MONSTER_SPAWN_FALLBACK.face,
      },
    ];
    outcome.narrative = "Une entite surgit a cote de toi.";
  }

  if (roll !== null) {
    if (roll === 1) {
      outcome.damageSelf = (outcome.damageSelf ?? 0) + 4;
      outcome.goldDelta = (outcome.goldDelta ?? 0) - 3;
      outcome.stressDelta = (outcome.stressDelta ?? 0) + 10;
      outcome.narrative = `${outcome.narrative} Catastrophe.`;
    } else if (roll >= 20) {
      outcome.goldDelta = (outcome.goldDelta ?? 0) + 8;
      outcome.strengthDelta = (outcome.strengthDelta ?? 0) + 1;
      if (!outcome.addItemName && /arme|epee|loot|relique|craft/.test(text)) {
        outcome.addItemName = "artefact legendaire";
      }
      outcome.narrative = `${outcome.narrative} Reussite legendaire.`;
    } else if (roll >= 15) {
      outcome.goldDelta = (outcome.goldDelta ?? 0) + 2;
      outcome.stressDelta = (outcome.stressDelta ?? 0) - 2;
    } else if (roll <= 5 && !intent.wantsRest) {
      outcome.damageSelf = (outcome.damageSelf ?? 0) + 1;
      outcome.stressDelta = (outcome.stressDelta ?? 0) + 4;
    }
  }

  if (roll !== null && roll <= 5) {
    if (outcome.moveToPoi) {
      outcome.moveToPoi = undefined;
      outcome.moveToPoiSteps = undefined;
      outcome.narrative = "Tu rates ton orientation et ne progresses pas.";
    }
    if (outcome.approachNearestHostile) {
      outcome.approachNearestHostile = false;
    }
  }

  if (!ctx.powerAccepted && /pouvoir|cheat|invocation|ultime|magie/.test(text)) {
    outcome.goldDelta = (outcome.goldDelta ?? 0) - 2;
    outcome.stressDelta = (outcome.stressDelta ?? 0) + 3;
    outcome.narrative += " Ton pouvoir inverse cree un contrecoup.";
  }

  if (ctx.turn % 7 === 0) {
    outcome.worldEvent = randomWorldEvent();
  }

  return outcome;
}

function parseIntent(text: string): ActionIntent {
  return {
    wantsMove: /deplace|avance|marche|cours|aller|vais|va |rejoins|rejoindre|se rend/.test(text),
    wantsAttack: /attaque|frappe|combat|tue|elimine|duel/.test(text),
    wantsApproachHostile: /squelette|skeleton|goblin|monstre|demon|loup/.test(text) && /voir|aller|vais|va |rejoins|rejoindre|chercher|trouver/.test(text),
    wantsDestroy: /detrui|casse|coupe|explose|ruine|rase/.test(text),
    wantsBuy: /achete|acheter|buy|commande/.test(text),
    wantsLoot: /prend|ramasse|obtiens|forge|craft|cree|invoque|fabrique/.test(text),
    wantsRest: /repos|repose|dors|auberge|inn|heal|soigne|soigner|recupere|recuperer/.test(text),
    wantsTalk: /parle|discute|questionne|negocie|dialogue|demande/.test(text),
    wantsQuest: /quete|mission|tableau|contrat/.test(text),
    wantsObjective: /objectif|changer mission|nouvel objectif/.test(text),
    wantsShop: /shop|boutique|marchand|vendeur/.test(text),
    wantsGuild: /guilde/.test(text),
    wantsInn: /auberge|inn/.test(text),
    wantsHouse: /maison|house|habitation/.test(text),
    wantsNearest: /plus proche|proche|nearest/.test(text),
    wantsDungeon: /donjon|dungeon/.test(text),
    wantsBoss: /roi demon|boss|citadelle/.test(text),
    asksList: /liste|stock|dispo|disponible|vendre|vente|prix|catalogue|outil/.test(text),
  };
}

function detectPoiTarget(intent: ActionIntent, text: string): Exclude<PoiType, null> | null {
  if (intent.wantsShop) return "shop";
  if (intent.wantsGuild) return "guild";
  if (intent.wantsInn) return "inn";
  if (intent.wantsHouse && intent.wantsNearest) return "house";
  if (intent.wantsDungeon) return "dungeon_gate";
  if (intent.wantsBoss) return "boss_gate";
  if (/camp|base|respawn/.test(text)) return "camp";
  return null;
}

function isNearPoi(ctx: SoloResolveRequest["context"], poi: Exclude<PoiType, null>): boolean {
  return ctx.poi === poi || ctx.nearbyPois.includes(poi);
}

function poiLabelFr(poi: Exclude<PoiType, null>): string {
  if (poi === "shop") return "la boutique";
  if (poi === "guild") return "la guilde";
  if (poi === "inn") return "l auberge";
  if (poi === "house") return "la maison";
  if (poi === "dungeon_gate") return "la porte du donjon";
  if (poi === "boss_gate") return "la citadelle du roi demon";
  return "le camp";
}

function narrateMove(move: { dx: number; dy: number }, roll: number | null): string {
  const direction =
    move.dy < 0 ? "vers le nord" : move.dy > 0 ? "vers le sud" : move.dx > 0 ? "vers l est" : "vers l ouest";
  if (roll === null) return `Tu avances ${direction} sans incident.`;
  if (roll <= 5) return `Tu veux aller ${direction}, mais tu glisses et perds du temps.`;
  if (roll <= 14) return `Tu progresses ${direction} avec prudence.`;
  return `Tu files ${direction} avec une precision impressionnante.`;
}

function narrateAttack(roll: number | null): string {
  if (roll === null) return "Tu engages le combat.";
  if (roll <= 5) return "Ton attaque rate et tu t exposes.";
  if (roll <= 14) return "Ton coup touche la cible.";
  return "Ton attaque est devastatrice.";
}

function narrateDestroy(roll: number | null): string {
  if (roll === null) return "Tu forces la structure.";
  if (roll <= 5) return "La destruction est partielle.";
  if (roll <= 14) return "L obstacle cede.";
  return "Tout s effondre proprement.";
}

function computeMovePower(roll: number | null): number {
  if (roll === null) return 1;
  if (roll <= 5) return 0;
  return 1;
}

function computeAttackPower(roll: number | null): number {
  if (roll === null) return 8;
  if (roll <= 5) return 4;
  if (roll <= 14) return 10;
  if (roll <= 19) return 14;
  return 22;
}

function parseMove(text: string): { dx: number; dy: number } | null {
  const north = /nord|haut|north|up/.test(text);
  const south = /sud|bas|south|down/.test(text);
  const east = /est|droite|east|right/.test(text);
  const west = /ouest|gauche|west|left/.test(text);
  const screenMove =
    /(\bun\b|\b1\b)\s*(ecran|chunk)/.test(text) ||
    (/ecran|chunk|zone entiere|carte entiere/.test(text) && /entier|complete|jusqu au bout|full/.test(text));
  const explicitTiles = text.match(/(\d+)\s*(case|cases|tile|tiles)/);

  let dx = 0;
  let dy = 0;
  if (north) dy -= 1;
  if (south) dy += 1;
  if (east) dx += 1;
  if (west) dx -= 1;

  let distance = 1;
  if (screenMove) {
    distance = 10;
  } else if (explicitTiles) {
    distance = clamp(asInt(explicitTiles[1], 1), 1, 10);
  } else if (/leger|doucement|une case|1 case|petit pas/.test(text)) {
    distance = 1;
  }

  if (dx === 0 && dy === 0) return null;

  return { dx: dx * distance, dy: dy * distance };
}

function hasDirectionWords(text: string): boolean {
  return /nord|sud|est|ouest|haut|bas|droite|gauche|north|south|east|west|up|down|left|right/.test(text);
}

function extractItemName(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    const index = text.indexOf(keyword);
    if (index < 0) continue;
    const suffix = text.slice(index + keyword.length).trim();
    if (!suffix) continue;
    const cleaned = suffix
      .replace(/^(un|une|des|du|de la|de l|la|le|les)\s+/, "")
      .replace(/\b(au|a la|a l|dans|sur|pour)\b.*$/, "")
      .trim();
    if (cleaned.length > 0) return cleaned.slice(0, 48);
  }
  return null;
}

function pickNpcSpeech(text: string): string {
  if (/prix|tarif|boutique|or/.test(text)) return "Les prix montent quand le danger grimpe.";
  if (/quete|mission|guilde/.test(text)) return "La guilde veut des preuves, pas des promesses.";
  if (/demon|boss|roi/.test(text)) return "Le Roi Demon attend au sud-est, dans la citadelle.";
  return "Continue d agir, ce monde reagit a chacune de tes decisions.";
}

function randomWorldEvent(): string {
  const pool = [
    "Un vent violet traverse la region et agite les monstres.",
    "Des chasseurs de reliques apparaissent pres du donjon.",
    "La boutique applique une hausse de prix temporaire.",
    "Une rumeur annonce que le Roi Demon prepare un rituel.",
  ];
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
}

function isRiskyAction(text: string, intent: ActionIntent, nearbyHostile: boolean): boolean {
  if (intent.wantsAttack || intent.wantsDestroy || intent.wantsObjective) return true;
  if (intent.wantsLoot) return true;
  if (/saut|vole|invoque|pouvoir|cheat|boss|demon|explose|fuis/.test(text)) return true;
  if (nearbyHostile && /attaque|combat|fuis|danger/.test(text)) return true;
  return false;
}

function fallbackOutcome(narrative: string, input: SoloResolveRequest): SoloOutcome {
  return {
    narrative,
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: null,
  };
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function asTerrainChange(input: unknown): TerrainChange | null {
  const obj = asObject(input);
  if (!obj) return null;
  const terrain = asString(obj.terrain, "grass");
  if (!isTerrain(terrain)) return null;

  return {
    dx: clamp(asInt(obj.dx, 0), -6, 6),
    dy: clamp(asInt(obj.dy, 0), -6, 6),
    terrain,
    blocked: typeof obj.blocked === "boolean" ? obj.blocked : undefined,
    destructible: typeof obj.destructible === "boolean" ? obj.destructible : undefined,
    poi: isPoi(obj.poi) ? obj.poi : undefined,
    prop: isProp(obj.prop) ? obj.prop : undefined,
  };
}

function asSpawn(input: unknown): SpawnActor | null {
  const obj = asObject(input);
  if (!obj) return null;

  const kind = asString(obj.kind, "monster");
  const actorKind = isActorKind(kind) ? kind : "monster";

  return {
    name: asString(obj.name, "Entite"),
    kind: actorKind,
    hp: clamp(asInt(obj.hp, 12), 1, 120),
    hostile: asBool(obj.hostile, actorKind === "monster" || actorKind === "boss"),
    dx: clamp(asInt(obj.dx, 0), -6, 6),
    dy: clamp(asInt(obj.dy, 0), -6, 6),
    sprite: asString(obj.sprite, MONSTER_SPAWN_FALLBACK.sprite),
    face: asString(obj.face, MONSTER_SPAWN_FALLBACK.face),
  };
}

function asPoi(value: unknown): Exclude<PoiType, null> | null {
  if (value === "camp") return "camp";
  if (value === "guild") return "guild";
  if (value === "shop") return "shop";
  if (value === "inn") return "inn";
  if (value === "house") return "house";
  if (value === "dungeon_gate") return "dungeon_gate";
  if (value === "boss_gate") return "boss_gate";
  return null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function nullableString(value: unknown): string | null {
  if (value === null || typeof value === "undefined") return null;
  const out = asString(value, "");
  return out.length > 0 ? out : null;
}

function asInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function isTerrain(value: string): value is TerrainChange["terrain"] {
  return ["grass", "forest", "desert", "village", "road", "water", "stone", "dungeon", "boss"].includes(value);
}

function isPoi(value: unknown): value is NonNullable<TerrainChange["poi"]> | null {
  return (
    value === "camp" ||
    value === "guild" ||
    value === "shop" ||
    value === "inn" ||
    value === "house" ||
    value === "dungeon_gate" ||
    value === "boss_gate" ||
    value === null
  );
}

function isProp(value: unknown): value is NonNullable<TerrainChange["prop"]> {
  return (
    value === "none" ||
    value === "tree" ||
    value === "stump" ||
    value === "rock" ||
    value === "cactus" ||
    value === "palm" ||
    value === "ruin" ||
    value === "crate"
  );
}

function isActorKind(value: string): value is SpawnActor["kind"] {
  return value === "npc" || value === "animal" || value === "monster" || value === "boss";
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

function rollD20(): number {
  return 1 + Math.floor(Math.random() * 20);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
