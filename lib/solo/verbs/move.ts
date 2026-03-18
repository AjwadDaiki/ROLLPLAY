import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, ValidationResult, VerbPlanResult } from "./types";
import type { RollTier } from "../config";

export const moveVerb: VerbHandler = {
  id: "move",
  aliases: /^(va |aller|marche|cours?|deplac|avance|recule|dirige|approche|entre dans|entre a)/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "move";
  },

  validate(draft, state) {
    return { ok: true };
  },

  plan(draft, state, roll) {
    // Movement is handled by the main pipeline via movePath/moveBy/moveToPoi
    // This verb handler mostly just signals "yes this is a move"
    return { ops: [] };
  },

  narrate(ops, roll, tier, draft, state) {
    return "Tu te deplace.";
  },

  narrateFailure(reason, draft, state) {
    return "Tu ne peux pas aller par la.";
  },
};
