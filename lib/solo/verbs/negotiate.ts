import { CONFIG, getRollTier, type RollTier } from "../config";
import { getShopDiscountPercent } from "../shop";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { resolveTarget, isShopLike, makeSpeechBubble, templateNarrate } from "./helpers";

export const negotiateVerb: VerbHandler = {
  id: "negotiate",
  aliases: /negocie|prix|baisse|rabais|reduc|reduction|moins cher|marchande/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "negotiate" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const target = resolveTarget(state, draft);
    if (!target || !isShopLike(target)) {
      return { ok: false, reason: "no_shop", narrative: "Il n y a personne avec qui negocier." };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    if (roll === null) return { ops: [] };
    const target = resolveTarget(state, draft);
    if (!target) return { ops: [] };
    const tier = getRollTier(roll);

    const currentDiscount = getShopDiscountPercent(state.player.shopDiscountPercent);
    const bonus = roll >= 18 ? CONFIG.negotiate.bonusLegendary : roll >= 15 ? CONFIG.negotiate.bonusCritical : roll >= CONFIG.negotiate.rollThreshold ? CONFIG.negotiate.bonusSuccess : 0;
    const nextDiscount = Math.min(CONFIG.shop.negotiateMaxDiscount, currentDiscount + bonus);

    const success = roll >= CONFIG.negotiate.rollThreshold;
    const ops: WorldOp[] = [];

    if (tier === "catastrophe") {
      // Opposite: prices go UP
      const penalty = Math.max(0, currentDiscount - 5);
      ops.push({ type: "set_shop_discount", targetRef: target.ref, percent: penalty });
      return {
        ops,
        speechBubbles: [
          makeSpeechBubble(target.ref, target.name, "Tu m insultes ? Les prix augmentent.", "speech", 2600),
        ],
      };
    }

    ops.push({
      type: "set_shop_discount",
      targetRef: target.ref,
      percent: success ? nextDiscount : currentDiscount,
    });

    const speech = tier === "miss"
      ? "Hmm, non. Mais sans rancune."
      : tier === "failure"
        ? "Non. Et n insiste pas."
        : tier === "legendary"
          ? `Incroyable... -${nextDiscount}% et je t offre un cadeau.`
          : `Bon. Tu auras -${nextDiscount}% pour cette partie.`;

    return {
      ops,
      speechBubbles: [
        makeSpeechBubble(target.ref, target.name, speech, "speech", 2600),
      ],
    };
  },

  narrate(ops, roll, tier, draft, state) {
    return templateNarrate("negotiate", tier ?? "success", { target: "le marchand" });
  },

  narrateFailure(reason, draft, state) {
    return "Il n y a personne avec qui negocier ici.";
  },
};
