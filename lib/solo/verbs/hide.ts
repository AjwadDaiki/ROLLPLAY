import { CONFIG, getRollTier, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { makeSpeechBubble, templateNarrate } from "./helpers";

function nearbyHostileCount(state: SoloGameState): number {
  return state.actors.filter((a) =>
    a.alive && a.hostile && a.leaderId !== "player" &&
    Math.abs(a.x - state.player.x) + Math.abs(a.y - state.player.y) <= (a.sightRange ?? 5)
  ).length;
}

function terrainCoverBonus(state: SoloGameState): number {
  const tile = state.tiles[state.player.y * state.worldWidth + state.player.x];
  if (!tile) return 0;
  if (tile.terrain === "forest") return 3;
  if (tile.prop === "tree" || tile.prop === "rock") return 2;
  if (tile.terrain === "dungeon" || tile.terrain === "stone") return 1;
  return 0;
}

export const hideVerb: VerbHandler = {
  id: "hide",
  aliases: /cache|cacher|planque|faufile|dissimule|tapir?|stealth|discret|invisible|camoufle/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "hide" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    return { ok: true };
  },

  plan(draft, state, roll) {
    if (roll === null) return { ops: [] };
    const tier = getRollTier(roll);
    const coverBonus = terrainCoverBonus(state);
    const effectiveRoll = roll + Math.floor(state.player.discretion / 3) + coverBonus;
    const effectiveTier = getRollTier(Math.min(20, effectiveRoll));

    const ops: WorldOp[] = [];
    const bubbles = [];
    const hostiles = nearbyHostileCount(state);

    if (tier === "catastrophe") {
      // Opposite: you make noise, attract attention
      if (hostiles > 0) {
        bubbles.push(makeSpeechBubble("player:self", null, "CRAC !", "action", 1400));
      }
      return {
        ops,
        speechBubbles: bubbles,
        narrative: templateNarrate("hide", "catastrophe", {}),
        extraData: { stressDelta: 4 },
      };
    }

    if (tier === "failure") {
      return {
        ops,
        narrative: templateNarrate("hide", "failure", {}),
        extraData: { stressDelta: 2 },
      };
    }

    if (effectiveTier === "miss" || tier === "miss") {
      return {
        ops,
        narrative: templateNarrate("hide", "miss", {}),
      };
    }

    // Success+ : hidden, stress relief
    const stressRelief = effectiveTier === "legendary" ? -8 : effectiveTier === "critical" ? -4 : -2;

    if (effectiveTier === "legendary" || effectiveTier === "critical") {
      bubbles.push(makeSpeechBubble("player:self", null, "...", "thought", 1000));
    }

    return {
      ops,
      speechBubbles: bubbles,
      extraData: { stressDelta: stressRelief },
    };
  },

  narrate(ops, roll, tier, draft, state) {
    return templateNarrate("hide", tier ?? "success", {});
  },

  narrateFailure(reason, draft, state) {
    return "Tu ne trouves pas d endroit pour te cacher.";
  },
};
