import { CONFIG, getRollTier, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { resolveTargetActor, distanceToTarget, makeSpeechBubble, templateNarrate } from "./helpers";

export const recruitVerb: VerbHandler = {
  id: "recruit",
  aliases: /recrute|suis moi|viens avec moi|accompagne|apprivoise|rallie/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "recruit" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const actor = resolveTargetActor(state, draft);
    if (!actor) return { ok: false, reason: "no_target", narrative: "Personne a recruter ici." };
    if (!actor.recruitmentEligible) return { ok: false, reason: "not_recruitable", narrative: `${actor.name} ne peut pas etre recrute.` };
    const dist = distanceToTarget(state, actor);
    if (dist > CONFIG.interaction.recruitRange) {
      return { ok: false, reason: "too_far", narrative: `${actor.name} est trop loin. Approche-toi d abord.` };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    if (roll === null) return { ops: [] };
    const actor = resolveTargetActor(state, draft);
    if (!actor) return { ops: [] };

    const threshold =
      actor.kind === "monster" ? CONFIG.recruit.monsterThreshold
      : actor.kind === "animal" ? CONFIG.recruit.animalThreshold
      : actor.id === "npc_guard_road" ? CONFIG.recruit.guardThreshold
      : CONFIG.recruit.npcThreshold;
    const tier = getRollTier(roll);
    const success = roll >= threshold;

    if (tier === "catastrophe") {
      // Opposite: target becomes aggressive
      return {
        ops: [],
        speechBubbles: [
          makeSpeechBubble(`actor:${actor.id}`, actor.name, "Tu oses ? Je vais te le faire regretter.", "speech", 2500),
        ],
        extraData: { recruitActorId: null, recruitMode: null },
      };
    }

    const speech = tier === "miss"
      ? (actor.kind === "animal" ? "..." : "Peut-etre une autre fois.")
      : success
        ? (tier === "legendary"
          ? (actor.kind === "monster" ? "Mon epee est tienne, pour toujours." : "Je te suivrai jusqu au bout du monde.")
          : (actor.kind === "monster" ? "Je combats a tes cotes." : actor.kind === "animal" ? "..." : "Je te suis."))
        : (actor.kind === "monster" ? "Jamais." : "Non merci.");

    return {
      ops: [],
      speechBubbles: [
        makeSpeechBubble(`actor:${actor.id}`, actor.name, speech, "speech", 2500),
      ],
      extraData: {
        recruitActorId: success ? actor.id : null,
        recruitMode: success ? (actor.recruitmentMode ?? "persuade") : null,
      },
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const actor = resolveTargetActor(state, draft);
    return templateNarrate("recruit", tier ?? "success", { target: actor?.name ?? "la cible" });
  },

  narrateFailure(reason, draft, state) {
    if (reason === "not_recruitable") return "Cette entite ne peut pas etre recrutee.";
    if (reason === "too_far") return "Trop loin pour recruter. Approche-toi d abord.";
    return "Le recrutement est impossible.";
  },
};
