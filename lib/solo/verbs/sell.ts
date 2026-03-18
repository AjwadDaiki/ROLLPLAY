import { CONFIG, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { resolveTarget, isShopLike, findItemByName, getSellPrice, makeSpeechBubble } from "./helpers";

export const sellVerb: VerbHandler = {
  id: "sell",
  aliases: /vends|vendre|vente|revends|revendre/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "sell" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const target = resolveTarget(state, draft);
    if (!target || !isShopLike(target)) {
      return { ok: false, reason: "no_shop", narrative: "Il n y a pas de marchand pres de toi." };
    }
    const item = findItemByName(state.player.inventory, draft.desiredItemName ?? "");
    if (!item) {
      return { ok: false, reason: "no_item", narrative: "Tu ne possedes pas cet objet." };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    const target = resolveTarget(state, draft);
    if (!target) return { ops: [] };
    const item = findItemByName(state.player.inventory, draft.desiredItemName ?? "");
    if (!item) return { ops: [] };
    const unitPrice = getSellPrice(item.name, state.player.shopDiscountPercent);

    return {
      ops: [
        { type: "transfer_item", fromRef: "player:self", toRef: target.ref, itemName: item.name, qty: 1 },
        { type: "adjust_player_gold", delta: unitPrice, reason: `Vente ${item.name}` },
      ],
      speechBubbles: [
        makeSpeechBubble(target.ref, target.name, `Je te reprends ${item.name} pour ${unitPrice} or.`, "speech", 2400),
      ],
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const target = resolveTarget(state, draft);
    return `${target?.name ?? "Le marchand"} rachete ton objet.`;
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_shop") return "Ventes possibles uniquement a la boutique.";
    if (reason === "no_item") return "Tu ne possedes pas cet objet.";
    return "Vente impossible.";
  },
};
