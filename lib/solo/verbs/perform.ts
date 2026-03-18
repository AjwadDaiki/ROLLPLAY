import { CONFIG, getRollTier, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { makeSpeechBubble, templateNarrate } from "./helpers";

function inferPerformanceType(text: string): "music" | "dance" | "speech" | "art" | "acrobatics" | "generic" {
  const n = text.toLowerCase();
  if (/chante|musique|joue de|melodie|flute|lyre|barde|fredonne|siffle/.test(n)) return "music";
  if (/danse|dansant|valse|breakdance|moonwalk/.test(n)) return "dance";
  if (/discours|annonce|proclame|declare|harangue|sermon|raconte/.test(n)) return "speech";
  if (/dessine|peint|sculpte|grave|ecrit|compose|poeme/.test(n)) return "art";
  if (/acrobat|salto|backflip|jongle|equilibre|parkour/.test(n)) return "acrobatics";
  return "generic";
}

function nearbyActorCount(state: SoloGameState, range: number): number {
  return state.actors.filter((a) =>
    a.alive && Math.abs(a.x - state.player.x) + Math.abs(a.y - state.player.y) <= range
  ).length;
}

export const performVerb: VerbHandler = {
  id: "perform",
  aliases: /chante|danse|dessine|peint|joue de|musique|spectacle|jongle|acrobat|proclame|discours|barde|fredonne|compose|sculpture|grave|salto|backflip|moonwalk|siffle un air/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "perform" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    return { ok: true };
  },

  plan(draft, state, roll) {
    if (roll === null) return { ops: [] };
    const tier = getRollTier(roll);
    const perfType = inferPerformanceType(draft.freeText);
    const audience = nearbyActorCount(state, 5);
    const charismaBonus = Math.floor(state.player.charisma / 4);

    const ops: WorldOp[] = [];
    const bubbles = [];

    if (tier === "catastrophe") {
      // Embarrassing failure — stress gain, audience mocks
      if (audience > 0) {
        bubbles.push(makeSpeechBubble("player:self", null, "Oups...", "action", 1400));
      }
      return {
        ops,
        speechBubbles: bubbles,
        narrative: templateNarrate("perform", "catastrophe", {}),
        extraData: { stressDelta: 5 },
      };
    }

    if (tier === "failure") {
      return {
        ops,
        narrative: templateNarrate("perform", "failure", {}),
        extraData: { stressDelta: 2 },
      };
    }

    if (tier === "miss") {
      return {
        ops,
        narrative: templateNarrate("perform", "miss", {}),
      };
    }

    // Success+ — audience matters for reward
    const stressRelief = tier === "legendary" ? -10 : tier === "critical" ? -6 : -3;
    const goldReward = audience > 0
      ? (tier === "legendary" ? 8 + charismaBonus : tier === "critical" ? 4 + charismaBonus : 1)
      : 0;

    if (goldReward > 0) {
      ops.push({ type: "adjust_player_gold", delta: goldReward, reason: "Performance applaudie" });
    }

    // On legendary, even hostiles are affected
    if (tier === "legendary" && audience > 0) {
      bubbles.push(makeSpeechBubble("player:self", null, "Un silence sacre s installe...", "action", 2400));
      // Record an incident — performance that pacified
      ops.push({
        type: "record_incident",
        incident: {
          type: "heroic",
          faction: "village",
          zone: "village",
          actorId: null,
          summary: "Une performance legendaire a captive toute la zone.",
          severity: 3,
          permanent: false,
        },
      });
    } else if (tier === "critical") {
      bubbles.push(makeSpeechBubble("player:self", null, "Le public est captive.", "action", 2000));
    } else {
      bubbles.push(makeSpeechBubble("player:self", null, performEmote(perfType), "action", 1600));
    }

    return {
      ops,
      speechBubbles: bubbles,
      extraData: { stressDelta: stressRelief },
    };
  },

  narrate(ops, roll, tier, draft, state) {
    return templateNarrate("perform", tier ?? "success", {});
  },

  narrateFailure(reason, draft, state) {
    return "L inspiration ne vient pas.";
  },
};

function performEmote(type: string): string {
  switch (type) {
    case "music": return "♪ ♫ ♪";
    case "dance": return "Tu fais quelques pas de danse.";
    case "speech": return "Ta voix porte.";
    case "art": return "Tu traces des lignes avec soin.";
    case "acrobatics": return "Un mouvement agile !";
    default: return "Tu fais ton show.";
  }
}
