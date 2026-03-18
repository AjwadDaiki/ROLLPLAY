import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import type { RollTier } from "../config";
import { resolveTarget, makeSpeechBubble } from "./helpers";

export const inspectVerb: VerbHandler = {
  id: "inspect",
  aliases: /examine|regarde|observe|inspecte|scrute|analyse|etudie|identifie/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "inspect" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    return { ok: true };
  },

  plan(draft, state, roll) {
    const target = resolveTarget(state, draft);
    const bubbles = [];
    if (target) {
      bubbles.push(
        makeSpeechBubble(
          target.ref,
          target.kind === "actor" ? target.name : null,
          target.description,
          target.kind === "actor" ? "speech" : "system",
          2600
        )
      );
    }
    return { ops: [], speechBubbles: bubbles };
  },

  narrate(ops, roll, tier, draft, state) {
    const target = resolveTarget(state, draft);
    return target ? target.description : "Tu prends le temps d observer les environs.";
  },

  narrateFailure(reason, draft, state) {
    return "Il n y a rien de notable a observer.";
  },
};
