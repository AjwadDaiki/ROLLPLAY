import { CONFIG, type RollTier } from "../config";
import { findShopCatalogEntry, getShopPrice } from "../shop";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { resolveTarget, distanceToTarget, isShopLike, makeSpeechBubble } from "./helpers";

export const buyVerb: VerbHandler = {
  id: "buy",
  aliases: /achete|acheter|buy|commande|prendre au marchand/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "buy" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const target = resolveTarget(state, draft);
    if (!target || !isShopLike(target)) {
      return { ok: false, reason: "no_shop", narrative: "Il n y a pas de marchand pres de toi." };
    }
    const entry = findShopCatalogEntry(draft.desiredItemName ?? "");
    if (!entry) {
      return { ok: false, reason: "no_item", narrative: "Le marchand ne vend pas cet objet." };
    }
    const price = getShopPrice(entry, state.player.shopDiscountPercent);
    if (state.player.gold < price) {
      return { ok: false, reason: "no_gold", narrative: `Pas assez d or pour ${entry.name} (${price} or).` };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    const target = resolveTarget(state, draft);
    if (!target) return { ops: [] };
    const entry = findShopCatalogEntry(draft.desiredItemName ?? "");
    if (!entry) return { ops: [] };
    const price = getShopPrice(entry, state.player.shopDiscountPercent);

    const ops: WorldOp[] = [
      { type: "adjust_player_gold", delta: -price, reason: `Achat ${entry.name}` },
      { type: "transfer_item", fromRef: target.ref, toRef: "player:self", itemName: entry.name, qty: 1, createIfMissing: true },
    ];

    return {
      ops,
      speechBubbles: [
        makeSpeechBubble(target.ref, target.name, `${entry.name}, tres bien. Cela fera ${price} or.`, "speech", 2400),
      ],
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const target = resolveTarget(state, draft);
    const entry = findShopCatalogEntry(draft.desiredItemName ?? "");
    return `${target?.name ?? "Le marchand"} te vend ${entry?.name ?? "l objet"}.`;
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_shop") return "Il faut etre pres d un marchand pour acheter.";
    if (reason === "no_item") return "Le marchand ne vend pas cet objet.";
    if (reason === "no_gold") return "Tu n as pas assez d or.";
    return "Achat impossible.";
  },
};
