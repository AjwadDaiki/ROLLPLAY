import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import type { RollTier } from "../config";
import { resolveTargetActor, distanceToTarget, makeSpeechBubble } from "./helpers";
import { CONFIG } from "../config";

export const talkVerb: VerbHandler = {
  id: "talk",
  aliases: /parle|discute|demande|questionne|salue|bonjour|dialogue|dis |interpelle/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "talk" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const actor = resolveTargetActor(state, draft);
    if (!actor) return { ok: false, reason: "no_target", narrative: "Personne a qui parler ici." };
    const dist = distanceToTarget(state, actor);
    if (dist > CONFIG.interaction.talkRange) {
      return { ok: false, reason: "too_far", narrative: `${actor.name} est trop loin. Approche-toi d abord.` };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    const actor = resolveTargetActor(state, draft);
    if (!actor) return { ops: [] };

    const speech =
      actor.dialogue && actor.dialogue.length > 0
        ? actor.dialogue[Math.floor(Math.random() * actor.dialogue.length)]
        : "Le PNJ te regarde en silence.";

    const ops: WorldOp[] = [];

    // Inn heals
    if (actor.id === "npc_innkeeper") {
      // Handled by extraData for compat
    }

    return {
      ops,
      speechBubbles: [
        makeSpeechBubble(`actor:${actor.id}`, actor.name, speech, "speech", 2400),
      ],
      extraData: {
        talkToActorId: actor.id,
        npcSpeech: speech,
      },
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const actor = resolveTargetActor(state, draft);
    return `${actor?.name ?? "Le PNJ"} te repond.`;
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_target") return "Il n y a personne a qui parler.";
    if (reason === "too_far") return "Trop loin pour discuter. Approche-toi.";
    return "La conversation est impossible.";
  },
};
