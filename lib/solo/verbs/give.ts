import { CONFIG, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { resolveTargetActor, distanceToTarget, makeSpeechBubble, templateNarrate } from "./helpers";

export const giveVerb: VerbHandler = {
  id: "give",
  aliases: /donne|offre|tend|remet|confie|partage|distribue/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "give" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const target = resolveTargetActor(state, draft);
    if (!target) return { ok: false, reason: "no_target", narrative: "Personne a qui donner." };
    const dist = distanceToTarget(state, target);
    if (dist > CONFIG.interaction.talkRange + CONFIG.interaction.approachStepsMax) {
      return { ok: false, reason: "too_far", narrative: `${target.name} est trop loin.` };
    }
    if (state.player.inventory.length === 0) {
      return { ok: false, reason: "empty_inventory", narrative: "Tu n as rien a donner." };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    const target = resolveTargetActor(state, draft);
    if (!target) return { ops: [] };

    // Find item to give
    const itemName = draft.desiredItemName
      ?? state.player.inventory[0]?.name
      ?? null;
    if (!itemName) return { ops: [], narrative: "Tu n as rien a donner." };

    const item = state.player.inventory.find(
      (e) => e.name.toLowerCase().includes(itemName.toLowerCase())
    );
    if (!item) return { ops: [], narrative: `Tu ne possedes pas de ${itemName}.` };

    const ops: WorldOp[] = [
      {
        type: "transfer_item",
        fromRef: "player:self",
        toRef: `actor:${target.id}`,
        itemName: item.name,
        qty: 1,
      },
    ];

    // Giving to friendly NPCs improves relations
    const isFriendly = !target.hostile;
    const speechText = isFriendly
      ? "Merci beaucoup ! C est tres genereux."
      : "Hm... un cadeau ? Interessant.";

    return {
      ops,
      speechBubbles: [
        makeSpeechBubble(`actor:${target.id}`, target.name, speechText, "speech", 2400),
      ],
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const target = resolveTargetActor(state, draft);
    const itemName = draft.desiredItemName ?? state.player.inventory[0]?.name ?? "l objet";
    return templateNarrate("give", tier ?? "success", { target: target?.name ?? "le PNJ", item: itemName });
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_target") return "Personne a qui donner.";
    if (reason === "empty_inventory") return "Tu n as rien a donner.";
    return "Impossible de donner quoi que ce soit.";
  },
};
