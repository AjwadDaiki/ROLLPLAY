// ─── Verb Engine — Central Index ───
// Registers all verb handlers and exposes the main resolution pipeline.

import { CONFIG, getRollTier, rollD20 } from "../config";
import { executeCascade, applyValidatedOps } from "../cascade";
import { buildStoryLine } from "../logic";
import { normalizeActionText } from "../runtime";
import type {
  ActionDraft,
  ActionVerb,
  PlayerInteractionRequest,
  SoloGameState,
  SoloOutcome,
  SoloResolveRequest,
  WorldOp,
} from "../types";
import type { VerbHandler, VerbResolution } from "./types";
import { registerVerb, resolveVerb, inferVerbFromText, buildDraftFromText } from "./registry";

// ─── Import all verb handlers ───
import { attackVerb } from "./attack";
import { moveVerb } from "./move";
import { destroyVerb } from "./destroy";
import { inspectVerb } from "./inspect";
import { restVerb } from "./rest";
import { buyVerb } from "./buy";
import { sellVerb } from "./sell";
import { stealVerb } from "./steal";
import { negotiateVerb } from "./negotiate";
import { takeVerb } from "./take";
import { talkVerb } from "./talk";
import { recruitVerb } from "./recruit";
import { useVerb } from "./use";

// ─── Register all verbs ───
let registered = false;
export function ensureVerbsRegistered(): void {
  if (registered) return;
  registered = true;

  registerVerb(attackVerb);
  registerVerb(moveVerb);
  registerVerb(destroyVerb);
  registerVerb(inspectVerb);
  registerVerb(restVerb);
  registerVerb(buyVerb);
  registerVerb(sellVerb);
  registerVerb(stealVerb);
  registerVerb(negotiateVerb);
  registerVerb(takeVerb);
  registerVerb(talkVerb);
  registerVerb(recruitVerb);
  registerVerb(useVerb);
}

// ─── Main Resolution Pipeline ───

/**
 * Try to resolve an action through the Verb Engine.
 * Returns null if no verb handler matches (falls through to AI).
 */
export function tryVerbEngineResolution(input: SoloResolveRequest): SoloOutcome | null {
  ensureVerbsRegistered();

  const state = input.state;
  if (!state) return null;

  // Step 1: Build ActionDraft from input
  const draft = buildActionDraft(input);
  if (!draft || draft.verb === "unknown") return null;

  // Step 2: Find matching verb handler
  const handler = resolveVerb(draft, state);
  if (!handler) return null;

  // Step 3: Validate preconditions
  const validation = handler.validate(draft, state);
  if (!validation.ok) {
    return {
      narrative: validation.narrative ?? handler.narrateFailure(validation.reason, draft, state),
      storyLine: buildStoryLine(input.context.playerName, input.actionText),
      diceRoll: null,
      actionDraft: draft,
      worldOps: [],
    };
  }

  // Step 4: Roll D20 if needed
  const roll = handler.requiresDice ? rollD20() : null;
  const tier = roll !== null ? getRollTier(roll) : null;

  // Step 5: Plan WorldOps
  const planResult = handler.plan(draft, state, roll);

  // Step 6: Run cascade & policy engine on the ops
  const cascadeResult = executeCascade(planResult.ops, state);

  // Step 7: Generate narrative
  const narrative = planResult.narrative
    ?? handler.narrate(cascadeResult.applied, roll, tier, draft, state);

  // Step 8: Build SoloOutcome for compatibility with existing applyOutcome
  const outcome: SoloOutcome = {
    narrative,
    storyLine: buildStoryLine(input.context.playerName, input.actionText),
    diceRoll: roll,
    actionDraft: draft,
    worldOps: cascadeResult.applied,
    targetRef: draft.primaryTargetRef ?? null,
    speechBubbles: [
      ...(planResult.speechBubbles ?? []),
      ...cascadeResult.cascadedBubbles,
    ],
  };

  // Step 9: Apply extraData fields to outcome for backward compatibility
  const extra = planResult.extraData ?? {};
  if (extra.attackActorId) outcome.attackActorId = extra.attackActorId as string;
  if (extra.attackPower) outcome.attackPower = extra.attackPower as number;
  if (extra.approachNearestHostile) outcome.approachNearestHostile = extra.approachNearestHostile as boolean;
  if (extra.destroyTarget) outcome.destroyTarget = extra.destroyTarget as { dx: number; dy: number };
  if (extra.talkToActorId) outcome.talkToActorId = extra.talkToActorId as string;
  if (extra.npcSpeech) outcome.npcSpeech = extra.npcSpeech as string;
  if (extra.recruitActorId) outcome.recruitActorId = extra.recruitActorId as string;
  if (extra.recruitMode) outcome.recruitMode = extra.recruitMode as "persuade" | "contract" | "tame";
  if (extra.healSelf !== undefined) outcome.healSelf = extra.healSelf as number;
  if (extra.stressDelta !== undefined) outcome.stressDelta = extra.stressDelta as number;
  if (extra.goldDelta !== undefined) outcome.goldDelta = extra.goldDelta as number;
  if (extra.setShopDiscountPercent !== undefined) outcome.setShopDiscountPercent = extra.setShopDiscountPercent as number;

  // Add rejected ops info to narrative if any
  if (cascadeResult.rejected.length > 0) {
    const reasons = cascadeResult.rejected.map((r) => r.reason).join("; ");
    outcome.narrative += ` (Bloque: ${reasons})`;
  }

  return outcome;
}

// ─── Draft Building ───

function buildActionDraft(input: SoloResolveRequest): ActionDraft | null {
  const text = input.actionText?.trim();
  if (!text) return null;

  // If interaction already has a clear type, use that as verb
  if (input.interaction) {
    const interactionVerb = interactionTypeToVerb(input.interaction);
    if (interactionVerb !== "unknown") {
      return {
        verb: interactionVerb,
        primaryTargetRef: input.interaction.primaryTargetRef ?? input.interaction.targetRef ?? null,
        secondaryTargetRef: input.interaction.secondaryTargetRef ?? null,
        desiredItemName: input.interaction.desiredItemName ?? extractItemFromText(text) ?? null,
        instrumentItemId: input.interaction.instrumentItemId ?? null,
        stance: input.interaction.stance ?? inferStanceFromVerb(interactionVerb),
        requiresApproach: true,
        freeText: text,
      };
    }
  }

  // Infer verb from free text
  const verb = inferVerbFromText(text);
  return {
    verb,
    primaryTargetRef: input.interaction?.primaryTargetRef ?? input.interaction?.targetRef ?? null,
    secondaryTargetRef: input.interaction?.secondaryTargetRef ?? null,
    desiredItemName: input.interaction?.desiredItemName ?? extractItemFromText(text) ?? null,
    instrumentItemId: input.interaction?.instrumentItemId ?? null,
    stance: inferStanceFromVerb(verb),
    requiresApproach: true,
    freeText: text,
  };
}

function interactionTypeToVerb(interaction: PlayerInteractionRequest): ActionVerb {
  switch (interaction.type) {
    case "move": return "move";
    case "attack": return "attack";
    case "talk": return "talk";
    case "recruit": return "recruit";
    case "inspect": return "inspect";
    default: return "unknown";
  }
}

function inferStanceFromVerb(verb: ActionVerb): "neutral" | "friendly" | "hostile" | "furtive" {
  if (verb === "steal") return "furtive";
  if (verb === "attack" || verb === "destroy" || verb === "burn") return "hostile";
  if (verb === "buy" || verb === "sell" || verb === "negotiate" || verb === "talk") return "friendly";
  return "neutral";
}

function extractItemFromText(text: string): string | null {
  const normalized = normalizeActionText(text);

  // Try to find catalog item names in the text
  for (const item of CONFIG.shop.catalog) {
    const itemNorm = normalizeActionText(item.name);
    if (normalized.includes(itemNorm)) return item.name;
    for (const alias of item.aliases) {
      if (normalized.includes(normalizeActionText(alias))) return item.name;
    }
  }

  return null;
}

// Re-export for external use
export { ensureVerbsRegistered as initVerbEngine };
export { resolveVerb, inferVerbFromText, buildDraftFromText } from "./registry";
export type { VerbHandler, VerbResolution } from "./types";
