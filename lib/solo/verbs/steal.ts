import { CONFIG, getRollTier, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { resolveTarget, distanceToTarget, getEntityState, findItemByName, makeSpeechBubble, templateNarrate } from "./helpers";

export const stealVerb: VerbHandler = {
  id: "steal",
  aliases: /vole|voler|derobe|pickpocket|chaparde|subtilise/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "steal" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const target = resolveTarget(state, draft);
    if (!target) return { ok: false, reason: "no_target", narrative: "Tu ne trouves aucune cible a voler." };
    const dist = distanceToTarget(state, target);
    if (dist > CONFIG.interaction.stealRange + CONFIG.interaction.approachStepsMax) {
      return { ok: false, reason: "too_far", narrative: `${target.name} est trop loin.` };
    }
    const holderState = getEntityState(state, target.ref);
    const item = draft.desiredItemName ? findItemByName(holderState.inventory, draft.desiredItemName) : holderState.inventory[0] ?? null;
    if (!item) {
      return { ok: false, reason: "no_item", narrative: `${target.name} ne porte rien d interessant.` };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    if (roll === null) return { ops: [] };
    const target = resolveTarget(state, draft);
    if (!target) return { ops: [] };
    const tier = getRollTier(roll);

    const holderState = getEntityState(state, target.ref);
    const item = draft.desiredItemName ? findItemByName(holderState.inventory, draft.desiredItemName) : holderState.inventory[0] ?? null;
    if (!item) return { ops: [] };

    const threshold = item.tags?.includes("legendary") || item.name.toLowerCase().includes("demon")
      ? CONFIG.steal.legendaryDC
      : target.kind === "actor" ? CONFIG.steal.actorDC : CONFIG.steal.structureDC;

    const success = roll >= threshold;
    const ops: WorldOp[] = [];

    if (success) {
      ops.push({
        type: "transfer_item",
        fromRef: target.ref,
        toRef: "player:self",
        itemName: item.name,
        qty: 1,
      });
    } else {
      ops.push({
        type: "record_incident",
        incident: {
          type: "crime",
          faction: target.faction ?? "village",
          zone: "village_camp",
          actorId: target.kind === "actor" ? (target.actorId ?? null) : null,
          summary: `Tentative de vol contre ${target.name}.`,
          severity: target.kind === "actor" ? CONFIG.steal.failedStealSeverityActor : CONFIG.steal.failedStealSeverityStructure,
          permanent: true,
        },
      });
    }

    return {
      ops,
      speechBubbles: [
        makeSpeechBubble(
          target.ref,
          target.kind === "actor" ? target.name : null,
          success ? "Hein... attends. Il me manque quelque chose." : "Je t ai vu.",
          target.kind === "actor" ? "speech" : "system",
          2600
        ),
      ],
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const target = resolveTarget(state, draft);
    return templateNarrate("steal", tier ?? "success", { target: target?.name ?? "la cible" });
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_target") return "Tu ne trouves aucune cible a voler.";
    if (reason === "no_item") return "La cible ne porte rien d interessant.";
    return "Le vol est impossible ici.";
  },
};
