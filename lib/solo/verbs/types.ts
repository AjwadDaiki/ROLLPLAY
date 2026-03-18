// ─── Verb Engine Types ───
// Each action the player can take is handled by a VerbHandler.
// The engine resolves intent → draft → plan → ops → narrate.

import type {
  ActionDraft,
  SoloGameState,
  SoloResolveRequest,
  WorldOp,
  WorldEntityRef,
  SpeechBubbleEvent,
} from "../types";
import type { RollTier } from "../config";

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string; narrative?: string };

export type VerbPlanResult = {
  ops: WorldOp[];
  speechBubbles?: SpeechBubbleEvent[];
  narrative?: string;
  extraData?: Record<string, unknown>;
};

export interface VerbHandler {
  /** Unique verb identifier, matches ActionDraft.verb */
  id: string;

  /** French aliases for regex-based intent matching */
  aliases: RegExp;

  /** Whether this verb needs a D20 roll */
  requiresDice: boolean;

  /** Can this handler process the given draft? */
  canHandle(draft: ActionDraft, state: SoloGameState): boolean;

  /** Validate preconditions (distance, resources, cooldowns) */
  validate(draft: ActionDraft, state: SoloGameState): ValidationResult;

  /** Generate WorldOps based on the action + roll result */
  plan(draft: ActionDraft, state: SoloGameState, roll: number | null): VerbPlanResult;

  /** Generate narration for successful execution */
  narrate(
    ops: WorldOp[],
    roll: number | null,
    tier: RollTier | null,
    draft: ActionDraft,
    state: SoloGameState
  ): string;

  /** Generate narration for validation failure */
  narrateFailure(reason: string, draft: ActionDraft, state: SoloGameState): string;
}

/** Compact verb result returned to the main pipeline */
export type VerbResolution = {
  verb: string;
  draft: ActionDraft;
  ops: WorldOp[];
  rejectedOps?: Array<{ op: WorldOp; reason: string }>;
  roll: number | null;
  tier: RollTier | null;
  narrative: string;
  storyLine: string;
  speechBubbles: SpeechBubbleEvent[];
  confidence: "verb_engine" | "ai_resolved" | "fallback";
  targetRef?: WorldEntityRef | null;
};
