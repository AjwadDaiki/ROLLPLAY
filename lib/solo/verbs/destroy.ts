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

    if (tier === "catastrophe") {
      // Opposite: player gets hurt
      return { ops: [], narrative: templateNarrate("destroy", tier, { target: target.name }) };
    }
    if (tier === "failure") {
      // Fails with minor fatigue
      return { ops: [], narrative: templateNarrate("destroy", tier, { target: target.name }) };
    }
    if (tier === "miss") {
      // Clean fail, nothing happens
      return { ops: [], narrative: templateNarrate("destroy", tier, { target: target.name }) };
    }

    // Success+ — destruction with terrain modification on critical/legendary
    const extraOps: WorldOp[] = [];

    // On critical/legendary, change surrounding terrain
    if (tier === "critical" || tier === "legendary") {
      const range = tier === "legendary" ? 2 : 1;
      for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
          if (dx === 0 && dy === 0) continue;
          const tx = target.x + dx;
          const ty = target.y + dy;
          if (tx >= 0 && ty >= 0 && tx < state.worldWidth && ty < state.worldHeight) {
            const tile = state.tiles[ty * state.worldWidth + tx];
            if (tile && !tile.blocked && tile.terrain !== "water" && !tile.poi) {
              extraOps.push({
                type: "set_entity_state",
                ref: `tile:${tx},${ty}`,
                tags: ["destroyed"],
                states: ["crater"],
              });
            }
          }
        }
      }
    }

    return {
      ops: [...ops, ...extraOps],
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
