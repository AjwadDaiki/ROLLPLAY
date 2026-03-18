import { CONFIG, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { isNearPoi, makeSpeechBubble } from "./helpers";

export const restVerb: VerbHandler = {
  id: "rest",
  aliases: /dormir|repose|repos|medite|dort|sieste|recupere|se soigner|auberge/,
  requiresDice: false,

  canHandle(draft, state) {
    return draft.verb === "rest" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    return { ok: true };
  },

  plan(draft, state, roll) {
    const atInn = isNearPoi(state, "inn", 1);
    const healAmount = atInn ? Math.min(state.player.maxHp - state.player.hp, 4) : Math.min(state.player.maxHp - state.player.hp, 2);
    const stressRelief = atInn ? CONFIG.inn.stressReliefOnTalk : 4;
    const goldCost = atInn ? 3 : 0;

    return {
      ops: [],
      extraData: {
        healSelf: healAmount,
        stressDelta: -stressRelief,
        goldDelta: -goldCost,
      },
      speechBubbles: atInn
        ? [makeSpeechBubble("structure:inn", "Aubergiste", "Repose-toi bien, aventurier.", "speech", 2200)]
        : [],
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const atInn = isNearPoi(state, "inn", 1);
    return atInn
      ? "Tu te reposes confortablement a l auberge. Tes blessures guerissent et ton stress diminue."
      : "Tu prends un moment pour te reposer. Tu te sens un peu mieux.";
  },

  narrateFailure(reason, draft, state) {
    return "Tu ne trouves pas d endroit pour te reposer.";
  },
};
