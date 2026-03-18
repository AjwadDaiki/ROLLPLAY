import { findPathToEntity, findWorldEntityByRef, type WorldEntity } from "./interaction";
import { buildStoryLine } from "./logic";
import { normalizeActionText } from "./runtime";
import { findShopCatalogEntry, getShopDiscountPercent, getShopPrice, SHOP_CATALOG } from "./shop";
import { getMapStructures } from "./world";
import type {
  ActionDraft,
  ActionVerb,
  EntityInventoryItem,
  ResolutionPlan,
  SoloGameState,
  SoloOutcome,
  SoloResolveRequest,
  WorldEntityRef,
  WorldEntityState,
} from "./types";

const PLAYER_REF = "player:self";

export function tryResolveSandboxAction(input: SoloResolveRequest): SoloOutcome | null {
  const draft = buildSandboxActionDraft(input);
  if (!draft) return null;
  const plan = buildResolutionPlan(input, draft);
  return plan ? resolutionPlanToOutcome(plan) : null;
}

export function buildSandboxActionDraft(input: SoloResolveRequest): ActionDraft | null {
  const text = input.actionText.trim();
  if (!text) return null;
  const normalized = normalizeActionText(text);
  const verb = inferActionVerb(normalized);
  if (!["steal", "buy", "sell", "negotiate", "loot", "take"].includes(verb)) {
    return null;
  }

  const mentionedTargetRef = findNamedTargetRef(input.state ?? null, normalized);
  const contextualTargetRef = inferContextualTargetRef(input.state ?? null, verb);
  const primaryTargetRef =
    mentionedTargetRef ??
    input.interaction?.primaryTargetRef ??
    input.interaction?.targetRef ??
    contextualTargetRef ??
    null;

  const desiredItemName =
    input.interaction?.desiredItemName ??
    extractDesiredItemName(input.state ?? null, normalized, verb) ??
    null;

  return {
    verb,
    primaryTargetRef,
    secondaryTargetRef: input.interaction?.secondaryTargetRef ?? null,
    desiredItemName,
    instrumentItemId: input.interaction?.instrumentItemId ?? null,
    stance: inferStance(verb),
    requiresApproach: true,
    freeText: text,
  };
}

function buildResolutionPlan(input: SoloResolveRequest, draft: ActionDraft): ResolutionPlan | null {
  if (!input.state) return null;
  if (draft.verb === "steal") return planSteal(input, draft);
  if (draft.verb === "negotiate") return planNegotiate(input, draft);
  if (draft.verb === "buy") return planBuy(input, draft);
  if (draft.verb === "sell") return planSell(input, draft);
  if (draft.verb === "loot" || draft.verb === "take") return planTake(input, draft);
  return null;
}

function planSteal(input: SoloResolveRequest, draft: ActionDraft): ResolutionPlan | null {
  const state = input.state;
  if (!state) return null;
  const target = resolveTargetEntity(state, draft.primaryTargetRef);
  if (!target) {
    return simplePlan(draft, input, "Tu ne trouves aucune cible claire a voler.", null);
  }

  const holderState = getEntityState(state, target.ref);
  const desiredItem = draft.desiredItemName ? findItemByName(holderState.inventory, draft.desiredItemName) : holderState.inventory[0] ?? null;
  if (!desiredItem) {
    return simplePlan(draft, input, `${target.name} ne semble pas porter l objet que tu cherches.`, null);
  }

  const distance = manhattan(target.x, target.y, state.player.x, state.player.y);
  const worldOps: ResolutionPlan["worldOps"] = [];
  if (distance > 1) {
    const path = input.interaction?.previewPath ?? findPathToEntity(state, target, { maxSteps: 320 }) ?? [];
    if (path.length > 0) {
      worldOps.push({ type: "move_path" as const, path, targetRef: target.ref });
    }
  }

  const roll = rollD20();
  const threshold = desiredItem.tags?.includes("legendary") || desiredItem.name.toLowerCase().includes("demon") ? 18 : target.kind === "actor" ? 14 : 12;
  const success = roll >= threshold;
  if (success) {
    worldOps.push({
      type: "transfer_item" as const,
      fromRef: target.ref,
      toRef: PLAYER_REF,
      itemName: desiredItem.name,
      qty: 1,
    });
  } else {
    worldOps.push({
      type: "record_incident" as const,
      incident: {
        type: "crime",
        faction: target.faction ?? "village",
        zone: "village_camp",
        actorId: target.kind === "actor" ? target.actorId ?? null : null,
        summary: `Tentative de vol contre ${target.name}.`,
        severity: target.kind === "actor" ? 6 : 4,
        permanent: true,
      },
    });
  }
  worldOps.push({
    type: "add_speech_bubble" as const,
    bubble: {
      sourceRef: target.ref,
      speaker: target.kind === "actor" ? target.name : null,
      text: success ? "Hein... attends. Il me manque quelque chose." : "Je t ai vu.",
      kind: target.kind === "actor" ? "speech" : "system",
      ttlMs: 2600,
    },
  });

  return {
    draft,
    worldOps,
    narrative: success
      ? `Tu parviens a subtiliser ${desiredItem.name}.`
      : `Ta tentative de vol sur ${target.name} echoue.`,
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: roll,
  };
}

function planNegotiate(input: SoloResolveRequest, draft: ActionDraft): ResolutionPlan | null {
  const state = input.state;
  if (!state) return null;
  const target = resolveTargetEntity(state, draft.primaryTargetRef);
  if (!target || !isShopLike(target)) return null;
  const distance = manhattan(target.x, target.y, state.player.x, state.player.y);
  const worldOps: ResolutionPlan["worldOps"] = [];
  if (distance > 1) {
    const path = input.interaction?.previewPath ?? findPathToEntity(state, target, { maxSteps: 320 }) ?? [];
    if (path.length > 0) {
      worldOps.push({ type: "move_path" as const, path, targetRef: target.ref });
    }
  }

  const roll = rollD20();
  const currentDiscount = getShopDiscountPercent(state.player.shopDiscountPercent);
  const bonus = roll >= 18 ? 12 : roll >= 15 ? 8 : roll >= 12 ? 5 : 0;
  const nextDiscount = Math.min(35, currentDiscount + bonus);
  return {
    draft,
    worldOps: [
      ...worldOps,
      {
        type: "set_shop_discount" as const,
        targetRef: target.ref,
        percent: roll >= 12 ? nextDiscount : currentDiscount,
      },
      {
        type: "add_speech_bubble" as const,
        bubble: {
          sourceRef: target.ref,
          speaker: target.name,
          text: roll >= 12 ? `Bon. Tu auras -${nextDiscount}% pour cette partie.` : "Non. Je garde mes prix.",
          kind: "speech",
          ttlMs: 2600,
        },
      },
    ],
    narrative: roll >= 12 ? "Le marchand ajuste reellement ses prix." : "Le marchand refuse de renegocier.",
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: roll,
  };
}

function planBuy(input: SoloResolveRequest, draft: ActionDraft): ResolutionPlan | null {
  const state = input.state;
  if (!state) return null;
  const target = resolveTargetEntity(state, draft.primaryTargetRef);
  if (!target || !isShopLike(target)) return null;
  const distance = manhattan(target.x, target.y, state.player.x, state.player.y);
  const worldOps: ResolutionPlan["worldOps"] = [];
  if (distance > 1) {
    const path = input.interaction?.previewPath ?? findPathToEntity(state, target, { maxSteps: 320 }) ?? [];
    if (path.length > 0) {
      worldOps.push({ type: "move_path" as const, path, targetRef: target.ref });
    }
  }

  const entry = findShopCatalogEntry(draft.desiredItemName ?? "");
  if (!entry) {
    return simplePlan(draft, input, "Le marchand attend que tu precises l objet voulu.", null);
  }

  const price = getShopPrice(entry, state.player.shopDiscountPercent);
  if (state.player.gold < price) {
    return simplePlan(draft, input, `Pas assez d or pour ${entry.name} (${price} or).`, null);
  }

  return {
    draft,
    worldOps: [
      ...worldOps,
      {
        type: "adjust_player_gold" as const,
        delta: -price,
        reason: `Achat ${entry.name}`,
      },
      {
        type: "transfer_item" as const,
        fromRef: target.ref,
        toRef: PLAYER_REF,
        itemName: entry.name,
        qty: 1,
        createIfMissing: true,
      },
      {
        type: "add_speech_bubble" as const,
        bubble: {
          sourceRef: target.ref,
          speaker: target.name,
          text: `${entry.name}, tres bien. Cela fera ${price} or.`,
          kind: "speech",
          ttlMs: 2400,
        },
      },
    ],
    narrative: `${target.name} te vend ${entry.name}.`,
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: null,
  };
}

function planSell(input: SoloResolveRequest, draft: ActionDraft): ResolutionPlan | null {
  const state = input.state;
  if (!state) return null;
  const target = resolveTargetEntity(state, draft.primaryTargetRef);
  if (!target || !isShopLike(target)) return null;
  const distance = manhattan(target.x, target.y, state.player.x, state.player.y);
  const worldOps: ResolutionPlan["worldOps"] = [];
  if (distance > 1) {
    const path = input.interaction?.previewPath ?? findPathToEntity(state, target, { maxSteps: 320 }) ?? [];
    if (path.length > 0) {
      worldOps.push({ type: "move_path" as const, path, targetRef: target.ref });
    }
  }

  const item = findItemByName(state.player.inventory, draft.desiredItemName ?? "");
  if (!item) {
    return simplePlan(draft, input, "Tu ne possedes pas cet objet.", null);
  }

  const catalogEntry = findShopCatalogEntry(item.name);
  const unitPrice = catalogEntry ? Math.max(1, Math.floor(getShopPrice(catalogEntry, state.player.shopDiscountPercent) * 0.55)) : 3;
  return {
    draft,
    worldOps: [
      ...worldOps,
      {
        type: "transfer_item" as const,
        fromRef: PLAYER_REF,
        toRef: target.ref,
        itemName: item.name,
        qty: 1,
      },
      {
        type: "adjust_player_gold" as const,
        delta: unitPrice,
        reason: `Vente ${item.name}`,
      },
      {
        type: "add_speech_bubble" as const,
        bubble: {
          sourceRef: target.ref,
          speaker: target.name,
          text: `Je te reprends ${item.name} pour ${unitPrice} or.`,
          kind: "speech",
          ttlMs: 2400,
        },
      },
    ],
    narrative: `${target.name} rachete ${item.name}.`,
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: null,
  };
}

function planTake(input: SoloResolveRequest, draft: ActionDraft): ResolutionPlan | null {
  const state = input.state;
  if (!state) return null;
  const target = resolveTargetEntity(state, draft.primaryTargetRef);
  if (!target) return null;
  const distance = manhattan(target.x, target.y, state.player.x, state.player.y);
  const worldOps: ResolutionPlan["worldOps"] = [];
  if (distance > 1) {
    const path = input.interaction?.previewPath ?? findPathToEntity(state, target, { maxSteps: 320 }) ?? [];
    if (path.length > 0) {
      worldOps.push({ type: "move_path" as const, path, targetRef: target.ref });
    }
  }
  const targetState = getEntityState(state, target.ref);
  const item = draft.desiredItemName ? findItemByName(targetState.inventory, draft.desiredItemName) : targetState.inventory[0] ?? null;
  if (!item) return null;

  return {
    draft,
    worldOps: [
      ...worldOps,
      {
        type: "transfer_item" as const,
        fromRef: target.ref,
        toRef: PLAYER_REF,
        itemName: item.name,
        qty: 1,
      },
    ],
    narrative: `Tu recuperes ${item.name}.`,
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: null,
  };
}

function simplePlan(
  draft: ActionDraft,
  input: SoloResolveRequest,
  narrative: string,
  diceRoll: number | null
): ResolutionPlan {
  return {
    draft,
    worldOps: [],
    narrative,
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll,
  };
}

function resolutionPlanToOutcome(plan: ResolutionPlan): SoloOutcome {
  const speechBubbles = plan.worldOps
    .filter((op): op is Extract<ResolutionPlan["worldOps"][number], { type: "add_speech_bubble" }> => op.type === "add_speech_bubble")
    .map((op) => op.bubble);
  return {
    narrative: plan.narrative,
    storyLine: plan.storyLine,
    diceRoll: plan.diceRoll,
    actionDraft: plan.draft,
    worldOps: plan.worldOps,
    targetRef: plan.draft.primaryTargetRef ?? null,
    npcSpeech: plan.npcSpeech ?? null,
    speechBubbles: speechBubbles.length > 0 ? speechBubbles : undefined,
  };
}

function inferActionVerb(normalized: string): ActionVerb {
  if (/vole|voler|derobe|pickpocket|chaparde/.test(normalized)) return "steal";
  if (/negocie|prix|baisse|rabais|reduc|reduction|moins cher/.test(normalized)) return "negotiate";
  if (/achete|acheter|buy|commande|prendre au marchand/.test(normalized)) return "buy";
  if (/vends|vendre|vente|revends|revendre/.test(normalized)) return "sell";
  if (/fouille|pille|ramasse|prends|recupere|loot/.test(normalized)) return "loot";
  if (/prends|prendre|saisis/.test(normalized)) return "take";
  return "unknown";
}

function inferStance(verb: ActionVerb): "neutral" | "friendly" | "hostile" | "furtive" {
  if (verb === "steal") return "furtive";
  if (verb === "attack") return "hostile";
  if (verb === "buy" || verb === "sell" || verb === "negotiate" || verb === "talk") return "friendly";
  return "neutral";
}

function findNamedTargetRef(state: SoloGameState | null, normalizedText: string): WorldEntityRef | null {
  if (!state) return null;
  const actorMatches = state.actors
    .filter((actor) => actor.alive)
    .map((actor) => ({ ref: `actor:${actor.id}` as WorldEntityRef, score: scoreTargetName(normalizedText, actor.name) }))
    .filter((entry) => entry.score > 0);
  if (actorMatches.length > 0) {
    return actorMatches.sort((a, b) => b.score - a.score)[0]?.ref ?? null;
  }

  const structureMatches = getMapStructures()
    .map((structure) => ({
      ref: `structure:${structure.id}` as WorldEntityRef,
      score: scoreTargetName(normalizedText, structure.label ?? structure.id),
    }))
    .filter((entry) => entry.score > 0);
  return structureMatches.sort((a, b) => b.score - a.score)[0]?.ref ?? null;
}

function scoreTargetName(normalizedText: string, rawName: string): number {
  const name = normalizeActionText(rawName);
  if (!name) return 0;
  if (normalizedText.includes(name)) return 5;
  return name
    .split(" ")
    .filter((part) => part.length >= 3 && normalizedText.includes(part))
    .length;
}

function extractDesiredItemName(state: SoloGameState | null, normalizedText: string, verb: ActionVerb): string | null {
  const candidates = new Set<string>();
  for (const entry of SHOP_CATALOG) candidates.add(entry.name);
  for (const item of state?.player.inventory ?? []) candidates.add(item.name);
  for (const entityState of Object.values(state?.entityStates ?? {})) {
    for (const item of entityState.inventory) candidates.add(item.name);
  }

  let best: { name: string; score: number } | null = null;
  for (const name of Array.from(candidates)) {
    const normalizedName = normalizeActionText(name);
    if (!normalizedName) continue;
    let score = 0;
    if (normalizedText.includes(normalizedName)) score += 5;
    if (verb === "buy" && SHOP_CATALOG.some((entry) => entry.name === name)) score += 1;
    if (score > (best?.score ?? 0)) {
      best = { name, score };
    }
  }
  return best?.name ?? null;
}

function resolveTargetEntity(state: SoloGameState, ref: WorldEntityRef | null | undefined): WorldEntity | null {
  return ref ? findWorldEntityByRef(state, ref) : null;
}

function inferContextualTargetRef(state: SoloGameState | null, verb: ActionVerb): WorldEntityRef | null {
  if (!state) return null;
  const here = state.tiles[state.player.y * state.worldWidth + state.player.x];
  const nearbyPoi = [
    here?.poi,
    state.tiles[(state.player.y - 1) * state.worldWidth + state.player.x]?.poi,
    state.tiles[(state.player.y + 1) * state.worldWidth + state.player.x]?.poi,
    state.tiles[state.player.y * state.worldWidth + state.player.x - 1]?.poi,
    state.tiles[state.player.y * state.worldWidth + state.player.x + 1]?.poi,
  ];
  if (["buy", "sell", "negotiate"].includes(verb) && nearbyPoi.includes("shop")) {
    return "structure:shop";
  }
  return null;
}

function getEntityState(state: SoloGameState, ref: WorldEntityRef): WorldEntityState {
  return (
    state.entityStates[ref] ?? {
      ref,
      ownerRef: null,
      faction: null,
      inventory: [],
      equipment: {},
      tags: [],
      states: [],
      witnessRange: 0,
      accessPolicy: null,
    }
  );
}

function findItemByName(items: Array<EntityInventoryItem | { name: string; qty: number }>, rawName: string): EntityInventoryItem | null {
  const normalizedNeedle = normalizeActionText(rawName);
  if (!normalizedNeedle) return null;
  let best: EntityInventoryItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    const normalizedItem = normalizeActionText(item.name);
    const score =
      normalizedItem === normalizedNeedle
        ? 5
        : normalizedItem.includes(normalizedNeedle) || normalizedNeedle.includes(normalizedItem)
          ? 2
          : 0;
    if (score > bestScore) {
      bestScore = score;
      best = "icon" in item ? item : ({ ...item, id: item.name, itemId: null, icon: "", sprite: null, emoji: "" } as EntityInventoryItem);
    }
  }
  return bestScore > 0 ? best : null;
}

function isShopLike(target: WorldEntity): boolean {
  return (
    (target.kind === "structure" && target.poi === "shop") ||
    (target.kind === "actor" && target.actorId === "npc_shopkeeper")
  );
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function rollD20(): number {
  return 1 + Math.floor(Math.random() * 20);
}
