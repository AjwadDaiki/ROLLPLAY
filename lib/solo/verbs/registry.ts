// ─── Verb Registry ───
// Central registry for all verb handlers. Resolves ActionDraft → VerbHandler.

import type { ActionDraft, ActionVerb, SoloGameState } from "../types";
import { normalizeActionText } from "../runtime";
import type { VerbHandler } from "./types";

const VERB_REGISTRY: VerbHandler[] = [];

export function registerVerb(handler: VerbHandler): void {
  // Prevent duplicate registration
  const existing = VERB_REGISTRY.findIndex((v) => v.id === handler.id);
  if (existing >= 0) {
    VERB_REGISTRY[existing] = handler;
  } else {
    VERB_REGISTRY.push(handler);
  }
}

export function resolveVerb(draft: ActionDraft, state: SoloGameState): VerbHandler | null {
  // 1. Exact match by verb id
  const exact = VERB_REGISTRY.find((v) => v.id === draft.verb);
  if (exact && exact.canHandle(draft, state)) return exact;

  // 2. Match by alias pattern against freeText
  const normalizedText = normalizeActionText(draft.freeText);
  const byAlias = VERB_REGISTRY.find((v) => v.aliases.test(normalizedText));
  if (byAlias && byAlias.canHandle(draft, state)) return byAlias;

  // 3. No match
  return null;
}

export function getRegisteredVerbs(): VerbHandler[] {
  return [...VERB_REGISTRY];
}

export function inferVerbFromText(text: string): ActionVerb {
  const normalized = normalizeActionText(text);

  for (const handler of VERB_REGISTRY) {
    if (handler.aliases.test(normalized)) return handler.id as ActionVerb;
  }

  return "unknown";
}

/** Build an ActionDraft from raw text using registered verb aliases */
export function buildDraftFromText(
  text: string,
  state: SoloGameState | null,
  targetRef?: string | null
): ActionDraft {
  const normalized = normalizeActionText(text);
  const verb = inferVerbFromText(normalized);

  return {
    verb,
    primaryTargetRef: targetRef ?? null,
    secondaryTargetRef: null,
    desiredItemName: null,
    instrumentItemId: null,
    stance: inferStance(verb),
    requiresApproach: true,
    freeText: text,
  };
}

function inferStance(verb: ActionVerb): "neutral" | "friendly" | "hostile" | "furtive" {
  if (verb === "steal") return "furtive";
  if (verb === "attack" || verb === "destroy" || verb === "burn") return "hostile";
  if (verb === "buy" || verb === "sell" || verb === "negotiate" || verb === "talk") return "friendly";
  return "neutral";
}
