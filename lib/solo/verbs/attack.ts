import { CONFIG, getRollTier, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, ValidationResult, VerbPlanResult } from "./types";
import { resolveTargetActor, distanceToTarget, actorStrength, clamp, makeSpeechBubble, templateNarrate } from "./helpers";

export const attackVerb: VerbHandler = {
  id: "attack",
  aliases: /attaque|frappe|tuer|tue|combats?|tape|cogne|poignarde|transperce/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "attack" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const actor = resolveTargetActor(state, draft);
    if (!actor) return { ok: false, reason: "no_target", narrative: "Aucune cible a attaquer a portee." };
    const dist = distanceToTarget(state, actor);
    if (dist > CONFIG.interaction.attackRange + CONFIG.interaction.approachStepsMax) {
      return { ok: false, reason: "too_far", narrative: `${actor.name} est beaucoup trop loin.` };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    const actor = resolveTargetActor(state, draft);
    if (!actor || roll === null) return { ops: [] };

    const tier = getRollTier(roll);
    const power = clamp(Math.round(roll + state.player.strength / CONFIG.combat.strengthDivisor), 1, 99);
    const ops: WorldOp[] = [];
    const bubbles = [];

    // If too far, need approach first (handled by main pipeline via movePath)
    const dist = distanceToTarget(state, actor);
    if (dist > CONFIG.interaction.attackRange) {
      // The pipeline will handle approach. We still plan the attack ops.
    }

    if (tier === "catastrophe") {
      // Self-damage on critical fail
      ops.push({ type: "adjust_player_gold", delta: 0, reason: "Echec critique au combat" });
      bubbles.push(makeSpeechBubble(`actor:${actor.id}`, actor.name, "Pathethique.", "speech", 1800));
    } else if (tier === "failure") {
      bubbles.push(makeSpeechBubble(`actor:${actor.id}`, actor.name, "Rate.", "speech", 1600));
    } else {
      // Hit - no direct state mutation, this is handled by applyOutcome compatibility layer
      bubbles.push(makeSpeechBubble(`actor:${actor.id}`, actor.name, actor.hostile ? "Argh !" : "Qu est-ce qui te prend ?", "speech", 1800));
    }

    return {
      ops,
      speechBubbles: bubbles,
      extraData: {
        attackActorId: actor.id,
        attackPower: power,
        approachNearestHostile: dist > CONFIG.interaction.attackRange,
      },
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const actor = resolveTargetActor(state, draft);
    const name = actor?.name ?? "la cible";
    return templateNarrate("attack", tier ?? "success", { target: name });
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_target") return "Aucune cible a portee pour attaquer.";
    if (reason === "too_far") return "La cible est beaucoup trop loin.";
    return "Tu ne peux pas attaquer maintenant.";
  },
};
