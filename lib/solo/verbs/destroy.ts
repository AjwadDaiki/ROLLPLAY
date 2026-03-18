import { CONFIG, getRollTier, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { resolveTarget, distanceToTarget, clamp, makeSpeechBubble, templateNarrate } from "./helpers";

export const destroyVerb: VerbHandler = {
  id: "destroy",
  aliases: /detruire?|casse|brise|demolir?|fracasse|defonce/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "destroy" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const target = resolveTarget(state, draft);
    if (!target) return { ok: false, reason: "no_target", narrative: "Rien a detruire ici." };
    const dist = distanceToTarget(state, target);
    if (dist > CONFIG.destroy.maxRange) {
      return { ok: false, reason: "too_far", narrative: "Trop loin pour detruire." };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    if (roll === null) return { ops: [] };
    const tier = getRollTier(roll);
    const target = resolveTarget(state, draft);
    if (!target) return { ops: [] };

    const ops: WorldOp[] = [];

    if (tier === "catastrophe" || tier === "failure") {
      return { ops: [], narrative: templateNarrate("destroy", tier, { target: target.name }) };
    }

    // Destruction is handled by applyOutcome destroyTarget compatibility
    return {
      ops,
      extraData: {
        destroyTarget: { dx: target.x - state.player.x, dy: target.y - state.player.y },
      },
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const target = resolveTarget(state, draft);
    return templateNarrate("destroy", tier ?? "success", { target: target?.name ?? "la cible" });
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_target") return "Il n y a rien de destructible ici.";
    return "Tu ne peux pas detruire cela.";
  },
};
