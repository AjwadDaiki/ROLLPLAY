import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import type { RollTier } from "../config";
import { findItemByName, makeSpeechBubble } from "./helpers";

export const useVerb: VerbHandler = {
  id: "use",
  aliases: /utilise|boire?|manger?|consomme|applique|active|equipe|porte/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "use" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const item = findItemByName(state.player.inventory, draft.desiredItemName ?? draft.freeText);
    if (!item) return { ok: false, reason: "no_item", narrative: "Tu ne possedes pas cet objet." };
    return { ok: true };
  },

  plan(draft, state, roll) {
    const item = findItemByName(state.player.inventory, draft.desiredItemName ?? draft.freeText);
    if (!item) return { ops: [] };

    const ops: WorldOp[] = [];
    const extraData: Record<string, unknown> = {};

    // Item effects based on catalog
    const name = item.name.toLowerCase();
    if (name.includes("potion") || name.includes("soin")) {
      extraData.healSelf = 5;
      ops.push({ type: "transfer_item", fromRef: "player:self", toRef: "player:self", itemName: item.name, qty: -1 });
    } else if (name.includes("ration") || name.includes("nourriture")) {
      extraData.healSelf = 3;
      ops.push({ type: "transfer_item", fromRef: "player:self", toRef: "player:self", itemName: item.name, qty: -1 });
    } else if (name.includes("herbe") || name.includes("calmant")) {
      extraData.stressDelta = -8;
      ops.push({ type: "transfer_item", fromRef: "player:self", toRef: "player:self", itemName: item.name, qty: -1 });
    } else if (name.includes("bombe") || name.includes("explosif")) {
      extraData.attackPower = 10;
      ops.push({ type: "transfer_item", fromRef: "player:self", toRef: "player:self", itemName: item.name, qty: -1 });
    } else {
      // Generic use - just narrate
      extraData.addItemEffect = true;
    }

    return { ops, extraData };
  },

  narrate(ops, roll, tier, draft, state) {
    const item = findItemByName(state.player.inventory, draft.desiredItemName ?? draft.freeText);
    return `Tu utilises ${item?.name ?? "l objet"}. L effet se fait sentir.`;
  },

  narrateFailure(reason, draft, state) {
    return "Tu ne possedes pas cet objet.";
  },
};
