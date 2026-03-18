import Groq from "groq-sdk";
import { CONFIG } from "./config";
import { findPathToEntity, findPathToTile, findWorldEntityByRef } from "./interaction";
import { buildStoryLine } from "./logic";
import { buildRepeatSignature, normalizeActionText } from "./runtime";
import { tryResolveSandboxAction } from "./sandbox";
import { findShopCatalogEntry, getShopDiscountPercent, getShopPrice, renderShopStockList } from "./shop";
import type { PoiType, SoloOutcome, SoloResolveRequest, SpawnActor, TerrainChange, WorldActor } from "./types";
import { tryVerbEngineResolution } from "./verbs";

const MODEL = process.env.GROQ_MODEL || CONFIG.ai.model;
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

function actorAliases(actor: WorldActor): string[] {
  const normalized = normalizeActionText(actor.name);
  const parts = normalized.split(" ").filter((entry) => entry.length >= 3);
  const aliases = new Set<string>([normalized, ...parts]);
  if (normalized.includes("marchand")) aliases.add("vendeur");
  if (normalized.includes("maitre")) aliases.add("guilde");
  if (normalized.includes("chat")) aliases.add("cat");
  if (normalized.includes("chien")) aliases.add("dog");
  if (normalized.includes("poulet")) aliases.add("poule");
  return Array.from(aliases);
}

function findReferencedActor(state: SoloResolveRequest["state"], normalizedText: string): WorldActor | null {
  if (!state) return null;
  let best: WorldActor | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const actor of state.actors) {
    if (!actor.alive) continue;
    const matched = actorAliases(actor).some((alias) => normalizedText.includes(alias));
    if (!matched) continue;
    const distance = Math.abs(actor.x - state.player.x) + Math.abs(actor.y - state.player.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = actor;
    }
  }
  return best;
}

export async function resolveSoloAction(input: SoloResolveRequest): Promise<SoloOutcome> {
  if (!input.actionText || !input.context) {
    return fallbackOutcome("Action invalide.", input);
  }

  const repeatSignature =
    input.interaction?.repeatSignature?.trim() || buildRepeatSignature(input.actionText, input.interaction);

  // V2: Try Verb Engine first (generalized action resolution)
  const verbOutcome = tryVerbEngineResolution(input);
  if (verbOutcome) {
    return verbOutcome;
  }

  // V1 legacy: Sandbox fallback for remaining hardcoded actions
  const sandboxOutcome = tryResolveSandboxAction(input);
  if (sandboxOutcome) {
    return sandboxOutcome;
  }

  if (!input.interaction && input.state) {
    const normalized = normalizeActionText(input.actionText);
    const intent = parseIntent(normalized);
    const actor = findReferencedActor(input.state, normalized);
    if (actor && (intent.wantsTalk || intent.wantsAttack || /recrute|suis moi|viens avec moi|accompagne|apprivoise/.test(normalized))) {
      const targetedInput: SoloResolveRequest = {
        ...input,
        interaction: {
          type: intent.wantsAttack ? "attack" : /recrute|suis moi|viens avec moi|accompagne|apprivoise/.test(normalized) ? "recruit" : "talk",
          targetRef: `actor:${actor.id}`,
          targetTile: { x: actor.x, y: actor.y },
          source: "text",
          actionText: input.actionText,
          repeatSignature,
        },
      };
      return maybeUpgradeTargetedDialogue(resolveTargetedInteraction(targetedInput), targetedInput);
    }
  }

  if (shouldResolveTargeted(input)) {
    return maybeUpgradeTargetedDialogue(resolveTargetedInteraction(input), input);
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

function shouldResolveTargeted(input: SoloResolveRequest): boolean {
  if (!input.interaction) return false;
  return (
    input.interaction.type !== "context" ||
    !!input.interaction.targetRef ||
    !!input.interaction.targetTile ||
    !!input.interaction.askInfo
  );
}

function resolveTargetedInteraction(input: SoloResolveRequest): SoloOutcome {
  const interaction = input.interaction;
  const state = input.state;
  if (!interaction || !state) {
    return fallbackOutcome("Interaction ciblee invalide.", input);
  }

  const target =
    interaction.targetRef
      ? findWorldEntityByRef(state, interaction.targetRef)
      : interaction.targetTile
        ? findWorldEntityByRef(state, `tile:${interaction.targetTile.x},${interaction.targetTile.y}`)
        : null;
  const normalizedText = normalizeActionText(input.actionText);

  if (interaction.askInfo || interaction.type === "inspect") {
    return {
      narrative: target ? target.description : "Tu prends le temps d observer les environs.",
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef: target?.ref ?? interaction.targetRef ?? null,
      targetTile: interaction.targetTile ?? null,
      speechBubbles: target
        ? [
            {
              sourceRef: target.ref,
              speaker: target.kind === "actor" ? target.name : null,
              text: target.kind === "actor" ? pickActorInfoSpeech(state, target.actorId) : target.description,
              kind: target.kind === "actor" ? "speech" : "system",
              ttlMs: 2600,
            },
          ]
        : undefined,
    };
  }

  if (interaction.type === "move") {
    const path = resolveInteractionPath(input, target);
    if (!path || path.length === 0) {
      return {
        narrative: target ? `Tu es deja au contact de ${target.name}.` : "Aucun chemin valable.",
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: null,
        targetRef: target?.ref ?? interaction.targetRef ?? null,
        targetTile: interaction.targetTile ?? null,
      };
    }
    return {
      narrative: target ? `Tu te diriges vers ${target.name}.` : "Tu avances.",
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef: target?.ref ?? interaction.targetRef ?? null,
      targetTile: interaction.targetTile ?? null,
      movePath: path,
    };
  }

  if (interaction.type === "attack") {
    const actor = target?.actorId ? state.actors.find((entry) => entry.id === target.actorId && entry.alive) ?? null : null;
    const targetRef = target?.ref ?? interaction.targetRef ?? null;
    if (!actor) {
      return fallbackOutcome("Aucune cible valide a attaquer.", input);
    }
    const distance = Math.abs(actor.x - state.player.x) + Math.abs(actor.y - state.player.y);
    if (distance > interactionRangeForActor(actor, "attack")) {
      const path = resolveInteractionPath(input, target);
      return {
        narrative: `Tu te rapproches de ${actor.name} avant d attaquer.`,
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: null,
        targetRef,
        movePath: path ?? undefined,
      };
    }
    const roll = rollD20();
    return {
      narrative: actor.hostile ? narrateAttack(roll) : `Tu attaques ${actor.name}.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: roll,
      targetRef,
      attackActorId: actor.id,
      attackPower: computeAttackPower(roll),
      speechBubbles: [
        {
          sourceRef: targetRef ?? `actor:${actor.id}`,
          speaker: actor.name,
          text: actor.hostile ? "Je vais te reduire en pieces." : "Qu est-ce qui te prend ?",
          kind: "speech",
          ttlMs: 1800,
        },
      ],
    };
  }

  if (interaction.type === "talk") {
    const actor = target?.actorId ? state.actors.find((entry) => entry.id === target.actorId && entry.alive) ?? null : null;
    const targetRef = target?.ref ?? interaction.targetRef ?? null;
    if (!actor) {
      return fallbackOutcome("Tu t adresses au vide.", input);
    }
    const distance = Math.abs(actor.x - state.player.x) + Math.abs(actor.y - state.player.y);
    if (distance > interactionRangeForActor(actor, "talk")) {
      return {
        narrative: `${actor.name} est trop loin. Approche-toi d abord.`,
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: null,
        targetRef,
      };
    }

    if (actor.id === "npc_shopkeeper" && target) {
      return resolveShopInteraction(input, target, normalizedText);
    }

    if (actor.id === "npc_guild_master" && target) {
      return resolveGuildInteraction(input, target, normalizedText);
    }

    const negotiation = /prix|baisse|rabais|reduc|reduction|moins cher/.test(normalizedText);
    const roll = negotiation ? rollD20() : null;
    if (negotiation && actor.id === "npc_shopkeeper") {
      const success = roll !== null && roll >= 12;
      return {
        narrative: success
          ? "Le marchand accepte de faire un petit geste commercial."
          : "Le marchand refuse de baisser ses prix.",
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: roll,
        targetRef,
        talkToActorId: actor.id,
        npcSpeech: success ? "D accord, je te fais une remise symbolique cette fois." : "Mes prix sont deja serres.",
        goldDelta: success ? 2 : 0,
        speechBubbles: [
          {
            sourceRef: targetRef ?? `actor:${actor.id}`,
            speaker: actor.name,
            text: success ? "Je peux faire un geste." : "Pas cette fois.",
            kind: "speech",
            ttlMs: 2200,
          },
        ],
      };
    }

    const speech = chooseTargetedSpeech(actor, normalizedText);
    return {
      narrative: `${actor.name} te repond.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: roll,
      targetRef,
      talkToActorId: actor.id,
      npcSpeech: speech,
      speechBubbles: [
        {
          sourceRef: targetRef ?? `actor:${actor.id}`,
          speaker: actor.name,
          text: speech,
          kind: "speech",
          ttlMs: 2400,
        },
      ],
    };
  }

  if (interaction.type === "recruit") {
    const actor = target?.actorId ? state.actors.find((entry) => entry.id === target.actorId && entry.alive) ?? null : null;
    if (!actor || !actor.recruitmentEligible) {
      return fallbackOutcome("Cette entite ne peut pas etre recrutee.", input);
    }
    const distance = Math.abs(actor.x - state.player.x) + Math.abs(actor.y - state.player.y);
    if (distance > interactionRangeForActor(actor, "recruit")) {
      return {
        narrative: `${actor.name} est trop loin pour etre rallie. Approche-toi d abord.`,
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: null,
        targetRef: target?.ref ?? null,
      };
    }

    const roll = rollD20();
    const threshold =
      actor.kind === "monster" ? 15 : actor.kind === "animal" ? 11 : actor.id === "npc_guard_road" ? 18 : 13;
    const success = roll >= threshold;
    return {
      narrative: success
        ? `${actor.name} accepte de te suivre.`
        : `${actor.name} refuse de rejoindre ton groupe.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: roll,
      targetRef: target?.ref ?? null,
      recruitActorId: success ? actor.id : null,
      recruitMode: success ? actor.recruitmentMode ?? "persuade" : null,
      speechBubbles: [
        {
          sourceRef: target?.ref ?? `actor:${actor.id}`,
          speaker: actor.name,
          text: success ? recruitmentSuccessSpeech(actor) : recruitmentFailSpeech(actor),
          kind: "speech",
          ttlMs: 2500,
        },
      ],
    };
  }

  return resolveContextualInteraction(input, target, normalizedText);
}

function resolveContextualInteraction(
  input: SoloResolveRequest,
  target: ReturnType<typeof findWorldEntityByRef>,
  normalizedText: string
): SoloOutcome {
  if (!target) {
    return {
      narrative: "Tu t adresses a l environnement. Il reste silencieux pour l instant.",
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
    };
  }

  if (target.kind === "actor") {
    if (/attaque|frappe|tue|menace/.test(normalizedText)) {
      return resolveTargetedInteraction({
        ...input,
        interaction: { ...(input.interaction ?? { type: "attack" }), type: "attack", targetRef: target.ref },
      });
    }
    if (/recrute|suis moi|viens avec moi|accompagne|apprivoise/.test(normalizedText)) {
      return resolveTargetedInteraction({
        ...input,
        interaction: { ...(input.interaction ?? { type: "recruit" }), type: "recruit", targetRef: target.ref },
      });
    }
    return resolveTargetedInteraction({
      ...input,
      interaction: { ...(input.interaction ?? { type: "talk" }), type: "talk", targetRef: target.ref },
    });
  }

  if (isEnvironmentMutationIntent(normalizedText)) {
    return resolveEnvironmentMutation(input, target, normalizedText);
  }

  if (target.kind === "structure") {
    if (isShopTarget(target)) {
      return resolveShopInteraction(input, target, normalizedText);
    }
    if (isGuildTarget(target)) {
      return resolveGuildInteraction(input, target, normalizedText);
    }
  }

  if (/creuse|fouille|cherche|inspecte|observe/.test(normalizedText)) {
    const isDigAction = /creuse|fouille|cherche/.test(normalizedText);
    const dx = target.x - input.context.position.x;
    const dy = target.y - input.context.position.y;
    const distance = Math.abs(dx) + Math.abs(dy);
    if (isDigAction && distance > interactionRangeForTarget(target)) {
      return {
        narrative: `${target.name} est trop loin. Deplace-toi d abord.`,
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: null,
        targetRef: target.ref,
      };
    }

    const roll = isDigAction ? rollD20() : null;
    const loot = target.terrain === "desert" ? "fragment fossilise" : target.terrain === "forest" ? "racine rare" : "terre compacte";
    const leavesGroundScar =
      isDigAction &&
      roll !== null &&
      roll >= 5 &&
      (target.kind === "tile" || target.kind === "poi") &&
      target.terrain !== "water";
    return {
      narrative:
        roll === null
          ? target.description
          : roll >= 12
            ? `Tu remues ${target.name} et tu en tires quelque chose d utile.`
            : leavesGroundScar
              ? `Le sol garde la trace de ton passage.`
              : `Tu explores ${target.name}, sans resultat majeur.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: roll,
      targetRef: target.ref,
      addItemName: roll !== null && roll >= 12 ? loot : null,
      terrainChanges: leavesGroundScar
        ? [
            {
              dx,
              dy,
              terrain: target.terrain ?? "grass",
              blocked: false,
              destructible: false,
              poi: target.poi ?? undefined,
              prop: "hole",
            },
          ]
        : undefined,
      speechBubbles: [
        {
          sourceRef: target.ref,
          text:
            roll !== null && roll >= 12
              ? `Tu recuperes ${loot}. Un trou frais marque le sol.`
              : leavesGroundScar
                ? "Le terrain est maintenant creuse."
                : target.description,
          kind: "system",
          ttlMs: 2200,
        },
      ],
    };
  }

  return {
    narrative: target.description,
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: null,
    targetRef: target.ref,
    speechBubbles: [
      {
        sourceRef: target.ref,
        text: target.description,
        kind: "system",
        ttlMs: 2400,
      },
    ],
  };
}

function isEnvironmentMutationIntent(normalizedText: string): boolean {
  return /coupe|casse|detrui|mine|brule|incend|explose|rase|fracasse|pulverise|saccage/.test(normalizedText);
}

function resolveEnvironmentMutation(
  input: SoloResolveRequest,
  target: NonNullable<ReturnType<typeof findWorldEntityByRef>>,
  normalizedText: string
): SoloOutcome {
  const dx = target.x - input.context.position.x;
  const dy = target.y - input.context.position.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  if (distance > interactionRangeForTarget(target)) {
    return {
      narrative: `${target.name} est trop loin. Deplace-toi d abord.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef: target.ref,
    };
  }

  const roll = rollD20();
  const isBurn = /brule|incend/.test(normalizedText);
  const isBlast = /explose|pulverise|rase/.test(normalizedText);
  const isMining = /mine/.test(normalizedText);
  const actionMode = isBurn ? "burn" : isBlast ? "blast" : isMining ? "mine" : "break";

  if (target.kind === "prop" || target.kind === "tile" || target.kind === "poi") {
    const mutation = buildTileMutationForAction(target, actionMode, dx, dy);
    const addItemName =
      roll >= 12
        ? target.prop === "rock" && (actionMode === "mine" || actionMode === "break")
          ? "minerai brut"
          : target.prop === "tree"
            ? isBurn
              ? "bois calciné"
              : "bois"
            : target.prop === "crate"
              ? "planche brisée"
              : target.terrain === "desert"
                ? "sable noirci"
                : null
        : null;

    return {
      narrative: mutation.narrative,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: roll,
      targetRef: target.ref,
      destroyTarget: mutation.useDestroyTarget ? { dx, dy } : null,
      terrainChanges: mutation.terrainChanges.length > 0 ? mutation.terrainChanges : undefined,
      addItemName,
      speechBubbles: [
        {
          sourceRef: target.ref,
          text: mutation.bubbleText,
          kind: "action",
          ttlMs: 1900,
        },
      ],
    };
  }

  if (target.kind === "structure") {
    const changes = buildStructureMutation(target, actionMode, dx, dy);
    const crimeAgainstVillage = target.terrain === "village" || target.poi === "shop" || target.poi === "guild" || target.poi === "inn";
    return {
      narrative: isBurn
        ? `${target.name} porte maintenant des traces de feu visibles.`
        : isBlast
          ? `${target.name} est secoue et le sol se fracture devant lui.`
          : `${target.name} garde les marques de ton passage violent.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: roll,
      targetRef: target.ref,
      terrainChanges: changes,
      factionReputationDelta: crimeAgainstVillage ? { village: -4, militia: -5 } : undefined,
      recordIncidents: crimeAgainstVillage
        ? [
            {
              type: "crime",
              faction: "militia",
              zone: "village",
              actorId: null,
              summary: `Tu as degrade ${target.name}.`,
              severity: 4,
              permanent: true,
            },
          ]
        : undefined,
      speechBubbles: [
        {
          sourceRef: target.ref,
          text: isBurn ? "Les flammes mordent la facade." : isBlast ? "L impact fait vibrer la structure." : "La facade encaisse des degats.",
          kind: "action",
          ttlMs: 2200,
        },
      ],
    };
  }

  return {
    narrative: "Le monde resiste a ton geste sans en garder de marque claire.",
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: roll,
    targetRef: target.ref,
  };
}

function buildTileMutationForAction(
  target: NonNullable<ReturnType<typeof findWorldEntityByRef>>,
  actionMode: "burn" | "blast" | "mine" | "break",
  dx: number,
  dy: number
): {
  narrative: string;
  bubbleText: string;
  useDestroyTarget: boolean;
  terrainChanges: TerrainChange[];
} {
  const changeBase = {
    dx,
    dy,
    terrain: target.terrain ?? "grass",
    blocked: false,
    destructible: false,
    poi: target.poi ?? undefined,
  } satisfies Omit<TerrainChange, "prop">;

  if (target.prop === "tree") {
    if (actionMode === "burn") {
      return {
        narrative: `${target.name} se consume et laisse une terre calcinée.`,
        bubbleText: "Les flammes laissent une marque noire.",
        useDestroyTarget: false,
        terrainChanges: [{ ...changeBase, prop: "charred" }],
      };
    }
    return {
      narrative: narrateDestroy(14),
      bubbleText: `${target.name} est entaille.`,
      useDestroyTarget: true,
      terrainChanges: [],
    };
  }

  if (target.prop === "rock") {
    return {
      narrative: actionMode === "blast" ? "Le rocher vole en eclats et creuse la terre." : "Le rocher cede et laisse un trou mineral.",
      bubbleText: actionMode === "blast" ? "Des eclats retombent partout." : "La pierre s arrache du sol.",
      useDestroyTarget: false,
      terrainChanges: [{ ...changeBase, prop: actionMode === "blast" ? "crater" : "hole" }],
    };
  }

  if (target.prop === "cactus") {
    return {
      narrative: actionMode === "burn" ? "L arbuste se consume sur place." : "L arbuste desertique est arrache et laisse une cicatrice de sable.",
      bubbleText: actionMode === "burn" ? "Un foyer sec noircit le sable." : "Le sable se fend sous l impact.",
      useDestroyTarget: false,
      terrainChanges: [{ ...changeBase, prop: actionMode === "burn" ? "charred" : "hole" }],
    };
  }

  if (target.prop === "crate") {
    return {
      narrative: actionMode === "burn" ? "La caisse flambe et finit en debris charbonneux." : "La caisse eclate en gravats de bois.",
      bubbleText: actionMode === "burn" ? "Des braises tombent au sol." : "La caisse se disloque.",
      useDestroyTarget: false,
      terrainChanges: [{ ...changeBase, prop: actionMode === "burn" ? "charred" : "rubble" }],
    };
  }

  return {
    narrative:
      actionMode === "burn"
        ? "Le sol est noirci par ton action."
        : actionMode === "blast"
          ? "Le terrain eclate et garde une cicatrice profonde."
          : actionMode === "mine"
            ? "Le terrain cede et laisse un trou net."
            : "Le terrain garde une marque de destruction.",
    bubbleText:
      actionMode === "burn"
        ? "Une marque de brulure reste visible."
        : actionMode === "blast"
          ? "Le sol est souffle."
          : actionMode === "mine"
            ? "La surface est creusee."
            : "Les coups laissent des gravats.",
    useDestroyTarget: false,
    terrainChanges: [
      {
        ...changeBase,
        prop: actionMode === "burn" ? "charred" : actionMode === "blast" ? "crater" : actionMode === "mine" ? "hole" : "rubble",
      },
    ],
  };
}

function buildStructureMutation(
  target: NonNullable<ReturnType<typeof findWorldEntityByRef>>,
  actionMode: "burn" | "blast" | "mine" | "break",
  dx: number,
  dy: number
): TerrainChange[] {
  const prop = actionMode === "burn" ? "charred" : actionMode === "blast" ? "crater" : "rubble";
  const around: Array<{ dx: number; dy: number; prop: TerrainChange["prop"] }> = [
    { dx, dy, prop },
    { dx: dx + (actionMode === "blast" ? 1 : 0), dy: dy + (actionMode === "blast" ? 0 : 1), prop: actionMode === "blast" ? "hole" : prop },
  ];
  return around.map((entry) => ({
    dx: entry.dx,
    dy: entry.dy,
    terrain: target.terrain ?? "village",
    blocked: false,
    destructible: false,
    poi: target.poi ?? undefined,
    prop: entry.prop,
  }));
}

function resolveInteractionPath(
  input: SoloResolveRequest,
  target: ReturnType<typeof findWorldEntityByRef>
): Array<{ x: number; y: number }> | null {
  if (!input.state) return null;
  if (target) {
    return findPathToEntity(input.state, target, { maxSteps: 24 })?.slice(0, 10) ?? null;
  }
  if (input.interaction?.targetTile) {
    return findPathToTile(input.state, input.interaction.targetTile.x, input.interaction.targetTile.y, {
      maxSteps: 24,
    })?.slice(0, 10) ?? null;
  }
  return null;
}

function interactionRangeForActor(actor: WorldActor, mode: "talk" | "attack" | "recruit"): number {
  if (mode === "attack") return 1;
  if (actor.id === "npc_shopkeeper" || actor.id === "npc_guild_master") return 2;
  if (actor.kind === "npc") return 2;
  if (actor.kind === "animal") return 2;
  return mode === "recruit" ? 2 : 1;
}

function interactionRangeForTarget(target: NonNullable<ReturnType<typeof findWorldEntityByRef>>): number {
  if (target.kind === "structure") return target.poi === "shop" || target.poi === "guild" || target.poi === "inn" ? 2 : 1;
  if (target.kind === "prop" || target.kind === "poi") return 2;
  return 1;
}

function isShopTarget(target: ReturnType<typeof findWorldEntityByRef>): boolean {
  return !!target && (
    (target.kind === "structure" && target.poi === "shop") ||
    (target.kind === "actor" && target.actorId === "npc_shopkeeper")
  );
}

function isGuildTarget(target: ReturnType<typeof findWorldEntityByRef>): boolean {
  return !!target && (
    (target.kind === "structure" && target.poi === "guild") ||
    (target.kind === "actor" && target.actorId === "npc_guild_master")
  );
}

function findInventoryMatch(input: SoloResolveRequest, rawName: string | null): { name: string; qty: number } | null {
  const normalizedNeedle = normalize(rawName ?? "");
  if (!normalizedNeedle) return null;
  let best: { name: string; qty: number } | null = null;
  let bestScore = 0;
  for (const item of input.state?.player.inventory ?? []) {
    const normalizedItem = normalize(item.name);
    const score =
      normalizedNeedle === normalizedItem
        ? 5
        : normalizedItem.includes(normalizedNeedle) || normalizedNeedle.includes(normalizedItem)
          ? 2
          : 0;
    if (score > bestScore) {
      best = { name: item.name, qty: item.qty };
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

function resolveShopInteraction(
  input: SoloResolveRequest,
  target: NonNullable<ReturnType<typeof findWorldEntityByRef>>,
  normalizedText: string
): SoloOutcome {
  const path = resolveInteractionPath(input, target);
  const distance = path?.length ?? 0;
  if (distance > interactionRangeForTarget(target) - 1) {
    return {
      narrative: `${target.name} est trop loin. Approche-toi d abord.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef: target.ref,
    };
  }
  const targetRef = target.ref;
  const merchantName = target.kind === "actor" ? target.name : "Le marchand";
  const currentDiscount = getShopDiscountPercent(input.state?.player.shopDiscountPercent);
  const wantsBuy = /achete|acheter|buy|commande|prendre|prends/.test(normalizedText);
  const wantsSell = /vends|vendre|vente|revends|revendre|cede|cede moi/.test(normalizedText);
  const wantsNegotiate = /prix|baisse|rabais|reduc|reduction|negocie|moins cher/.test(normalizedText);
  const wantsSteal = /vole|voler|derobe|pickpocket|chaparde/.test(normalizedText);
  const wantsStock = /liste|stock|dispo|disponible|catalogue|montre/.test(normalizedText);

  if (wantsSteal) {
    const roll = rollD20();
    const success = roll >= 16;
    return {
      narrative: success
        ? "Tu subtilises quelque chose pendant que le marchand detourne les yeux."
        : "Le marchand repere aussitot ta tentative de vol.",
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: roll,
      targetRef,
      goldDelta: success ? 5 : 0,
      factionReputationDelta: success ? { village: -1, militia: -1 } : { village: -4, militia: -7 },
      zoneReputationDelta: success ? { village_camp: -1 } : { village_camp: -4 },
      recordIncidents: [
        {
          type: "crime",
          faction: "militia",
          zone: "village_camp",
          actorId: target.kind === "actor" ? target.actorId ?? null : "npc_shopkeeper",
          summary: success ? "Vol discret a la boutique." : "Tentative de vol reperee a la boutique.",
          severity: success ? 2 : 6,
          permanent: !success,
        },
      ],
      speechBubbles: [
        {
          sourceRef: targetRef,
          speaker: merchantName,
          text: success ? "Hein... il me manquait quelque chose ?" : "Au voleur !",
          kind: "speech",
          ttlMs: 2400,
        },
      ],
    };
  }

  if (wantsNegotiate) {
    const roll = rollD20();
    const success = roll >= 12;
    const bonus = success ? (roll >= 18 ? 12 : roll >= 15 ? 8 : 5) : 0;
    const nextDiscount = Math.min(35, currentDiscount + bonus);
    return {
      narrative: success
        ? "Le marchand accepte de baisser reellement ses prix."
        : "Le marchand refuse de baisser ses prix.",
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: roll,
      targetRef,
      setShopDiscountPercent: success ? nextDiscount : currentDiscount,
      speechBubbles: [
        {
          sourceRef: targetRef,
          speaker: merchantName,
          text: success
            ? `D accord. Pour toi, je passe a -${nextDiscount}% sur mon stock.`
            : "Mes prix sont deja honnetes.",
          kind: "speech",
          ttlMs: 2200,
        },
      ],
    };
  }

  if (wantsStock) {
    return {
      narrative: "Le marchand t expose clairement son stock.",
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef,
      speechBubbles: [
        {
          sourceRef: targetRef,
          speaker: merchantName,
          text: renderShopStockList(currentDiscount),
          kind: "speech",
          ttlMs: 2800,
        },
      ],
    };
  }

  if (wantsBuy) {
    const requestedName = extractItemName(normalizedText, ["acheter", "achete", "buy", "commande", "prendre", "prends"]);
    const entry = findShopCatalogEntry(requestedName || "");
    if (!entry) {
      return {
        narrative: "Le marchand attend que tu precises l objet voulu.",
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: null,
        targetRef,
        speechBubbles: [
          {
            sourceRef: targetRef,
            speaker: merchantName,
            text: `Que veux-tu acheter ? ${renderShopStockList(currentDiscount)}`,
            kind: "speech",
            ttlMs: 3000,
          },
        ],
      };
    }
    const displayedPrice = getShopPrice(entry, currentDiscount);
    return {
      narrative: `${merchantName} prepare ${entry.name}.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef,
      buyItemName: entry.name,
      speechBubbles: [
        {
          sourceRef: targetRef,
          speaker: merchantName,
          text: `${entry.name}, tres bien. Cela fera ${displayedPrice} or.`,
          kind: "speech",
          ttlMs: 2400,
        },
      ],
    };
  }

  if (wantsSell) {
    const requestedName = extractItemName(normalizedText, ["vendre", "vends", "vente", "revendre", "revends", "cede"]);
    if (!requestedName) {
      const carry = (input.state?.player.inventory ?? []).slice(0, 4).map((item) => item.name).join(", ");
      return {
        narrative: "Le marchand te demande ce que tu veux mettre en vente.",
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: null,
        targetRef,
        speechBubbles: [
          {
            sourceRef: targetRef,
            speaker: merchantName,
            text: carry ? `Que veux-tu vendre ? Tu portes: ${carry}.` : "Tu n as rien a vendre pour l instant.",
            kind: "speech",
            ttlMs: 3000,
          },
        ],
      };
    }

    const item = findInventoryMatch(input, requestedName);
    if (!item) {
      return {
        narrative: "Tu n as pas l objet que tu proposes.",
        storyLine: buildStoryLine(input.context.playerName, input.actionText),
        diceRoll: null,
        targetRef,
        speechBubbles: [
          {
            sourceRef: targetRef,
            speaker: merchantName,
            text: "Montre-moi d abord un objet que tu possedes vraiment.",
            kind: "speech",
            ttlMs: 2400,
          },
        ],
      };
    }

    return {
      narrative: `${merchantName} examine ${item.name} et accepte l echange.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef,
      sellItemName: item.name,
      sellItemQty: 1,
      speechBubbles: [
        {
          sourceRef: targetRef,
          speaker: merchantName,
          text: `Je peux te reprendre ${item.name}.`,
          kind: "speech",
          ttlMs: 2400,
        },
      ],
    };
  }

  return {
    narrative: "Le marchand attend ta demande.",
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: null,
    targetRef,
    speechBubbles: [
      {
        sourceRef: targetRef,
        speaker: merchantName,
        text: `Tu veux acheter, vendre, negocier ou tenter quelque chose de plus risque ? ${renderShopStockList(currentDiscount)}`,
        kind: "speech",
        ttlMs: 2700,
      },
    ],
  };
}

function resolveGuildInteraction(
  input: SoloResolveRequest,
  target: NonNullable<ReturnType<typeof findWorldEntityByRef>>,
  normalizedText: string
): SoloOutcome {
  const path = resolveInteractionPath(input, target);
  const distance = path?.length ?? 0;
  if (distance > interactionRangeForTarget(target) - 1) {
    return {
      narrative: `${target.name} est trop loin. Approche-toi d abord.`,
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef: target.ref,
    };
  }
  const targetRef = target.ref;
  if (/quete|mission|contrat|travail/.test(normalizedText)) {
    return {
      narrative: "La guilde consulte ses contrats disponibles.",
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef,
      requestQuest: true,
      speechBubbles: [
        {
          sourceRef: targetRef,
          text: "Voyons ce qui merite ton attention aujourd hui.",
          kind: "speech",
          ttlMs: 2500,
        },
      ],
    };
  }
  if (/rang|grade|statut/.test(normalizedText)) {
    return {
      narrative: "La guilde te rappelle ton rang actuel.",
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      targetRef,
      speechBubbles: [
        {
          sourceRef: targetRef,
          text: `Ton rang actuel est ${input.context.rank}. Continue pour viser plus haut.`,
          kind: "speech",
          ttlMs: 2500,
        },
      ],
    };
  }
  return {
    narrative: "La guilde attend de savoir ce que tu cherches.",
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: null,
    targetRef,
    speechBubbles: [
      {
        sourceRef: targetRef,
        text: "Tu viens pour une quete, des infos ou ton rang ?",
        kind: "speech",
        ttlMs: 2500,
      },
    ],
  };
}

async function maybeUpgradeTargetedDialogue(outcome: SoloOutcome, input: SoloResolveRequest): Promise<SoloOutcome> {
  if (!groq || !input.state || !input.interaction) return outcome;
  if (input.interaction.type !== "talk" || !outcome.npcSpeech) return outcome;

  const targetRef = outcome.targetRef ?? input.interaction.targetRef ?? null;
  if (!targetRef || !targetRef.startsWith("actor:")) return outcome;

  const actorId = targetRef.slice("actor:".length);
  const actor = input.state.actors.find((entry) => entry.id === actorId && entry.alive);
  if (!actor) return outcome;
  if (actor.id === "npc_shopkeeper" || actor.id === "npc_guild_master") return outcome;

  const improved = await generateDynamicActorSpeech(input, actor, outcome.npcSpeech);
  if (!improved) return outcome;

  return {
    ...outcome,
    npcSpeech: improved,
    speechBubbles:
      outcome.speechBubbles && outcome.speechBubbles.length > 0
        ? outcome.speechBubbles.map((bubble) =>
            bubble.sourceRef === targetRef
              ? {
                  ...bubble,
                  speaker: bubble.speaker ?? actor.name,
                  text: improved,
                }
              : bubble
          )
        : [
            {
              sourceRef: targetRef,
              speaker: actor.name,
              text: improved,
              kind: "speech",
              ttlMs: 2400,
            },
          ],
  };
}

async function generateDynamicActorSpeech(
  input: SoloResolveRequest,
  actor: WorldActor,
  fallbackSpeech: string
): Promise<string | null> {
  if (!groq) return null;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      max_tokens: 90,
      messages: [
        {
          role: "system",
          content: [
            "Tu joues un PNJ d un RPG sandbox fantasy.",
            "Reponds uniquement avec la replique du PNJ, en francais.",
            "Reste bref: 1 ou 2 phrases, moins de 180 caracteres.",
            "Pas de markdown, pas de JSON, pas de narration externe, pas de guillemets.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `PNJ: ${actor.name}`,
            `Role: ${actor.role ?? actor.profession ?? "inconnu"}`,
            `Faction: ${actor.faction ?? "independante"}`,
            `Personnalite: ${actor.personality ?? "reservee"}`,
            `Humeur: ${actor.mood ?? "calme"}`,
            `Lore: ${actor.loreSummary ?? "Aucun lore fourni."}`,
            `Joueur: ${input.context.playerName}`,
            `Reputation village: ${input.context.factionReputations.village ?? 0}`,
            `Reputation guilde: ${input.context.factionReputations.guild ?? 0}`,
            `Demande du joueur: ${input.actionText}`,
            `Reponse de secours: ${fallbackSpeech}`,
          ].join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").replace(/^['"]+|['"]+$/g, "").trim();
    if (!cleaned) return null;
    return cleaned.slice(0, 180);
  } catch {
    return null;
  }
}

function chooseTargetedSpeech(actor: WorldActor, normalizedText: string): string {
  if (actor.id === "npc_shopkeeper" && !/achete|acheter|buy|prix|baisse|rabais|reduc|vendre|vente|stock|catalogue/.test(normalizedText)) {
    return "Tu veux acheter, vendre ou negocier ?";
  }
  if (/qui es tu|nom|role|metier/.test(normalizedText)) {
    return pickActorInfoSpeechFromActor(actor);
  }
  if (/quete|mission|travail/.test(normalizedText)) {
    return actor.dialogue[1] ?? actor.dialogue[0] ?? `${actor.name} te regarde en silence.`;
  }
  if (/danger|monstre|roi demon|citadelle/.test(normalizedText)) {
    return actor.dialogue[2] ?? actor.dialogue[0] ?? `${actor.name} partage une rumeur locale.`;
  }
  return actor.dialogue[0] ?? `${actor.name} te repond d un ton neutre.`;
}

function pickActorInfoSpeech(state: SoloResolveRequest["state"], actorId?: string): string {
  const actor = actorId ? state?.actors.find((entry) => entry.id === actorId) : null;
  return actor ? pickActorInfoSpeechFromActor(actor) : "Difficile de lire plus d informations.";
}

function pickActorInfoSpeechFromActor(actor: WorldActor): string {
  const role = actor.role ?? actor.profession ?? actor.kind;
  const faction = actor.faction ?? "independante";
  return `${actor.name}. Role: ${role}. Faction: ${faction}. Personnalite: ${actor.personality ?? "reservee"}.`;
}

function recruitmentSuccessSpeech(actor: WorldActor): string {
  if (actor.kind === "animal") return "Je te fais confiance.";
  if (actor.kind === "monster") return "Je reconnais ta force.";
  return "Tres bien, je viens avec toi.";
}

function recruitmentFailSpeech(actor: WorldActor): string {
  if (actor.kind === "animal") return "La creature garde ses distances.";
  if (actor.kind === "monster") return "Le monstre refuse de se soumettre.";
  return "Pas question.";
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
    outcome.narrative = "Le monde ne cree pas d objet depuis le vide. Cible d abord une entite, un corps, un coffre ou un conteneur.";
    outcome.diceRoll = null;
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
    value === "crate" ||
    value === "hole" ||
    value === "crater" ||
    value === "charred" ||
    value === "rubble"
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
