import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import type { RollTier } from "../config";
import { resolveTarget, getEntityState, findItemByName, makeSpeechBubble } from "./helpers";

export const takeVerb: VerbHandler = {
  id: "take",
  aliases: /fouille|pille|ramasse|prends|prendre|recupere|loot|saisis/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "take" || draft.verb === "loot" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const target = resolveTarget(state, draft);
    if (!target) return { ok: false, reason: "no_target", narrative: "Rien a ramasser ici." };
    const targetState = getEntityState(state, target.ref);
    const item = draft.desiredItemName ? findItemByName(targetState.inventory, draft.desiredItemName) : targetState.inventory[0] ?? null;
    if (!item) return { ok: false, reason: "no_item", narrative: "Il n y a rien a prendre." };
    return { ok: true };
  },

  plan(draft, state, roll) {
    const target = resolveTarget(state, draft);
    if (!target) return { ops: [] };
    const targetState = getEntityState(state, target.ref);
    const item = draft.desiredItemName ? findItemByName(targetState.inventory, draft.desiredItemName) : targetState.inventory[0] ?? null;
    if (!item) return { ops: [] };

    return {
      ops: [
        { type: "transfer_item", fromRef: target.ref, toRef: "player:self", itemName: item.name, qty: 1 },
      ],
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const target = resolveTarget(state, draft);
    return `Tu recuperes un objet${target ? ` de ${target.name}` : ""}.`;
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_item") return "Il n y a rien a prendre ici.";
    return "Tu ne peux rien ramasser.";
  },
};
