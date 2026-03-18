import { CONFIG, getRollTier, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { resolveTarget, distanceToTarget, makeSpeechBubble, templateNarrate } from "./helpers";

function magicPower(state: SoloGameState): number {
  return Math.max(1, Math.floor((state.player.magic + state.player.resonance + state.player.willpower) / 3));
}

function inferSpellType(text: string): "attack" | "heal" | "terrain" | "buff" | "generic" {
  const normalized = text.toLowerCase();
  if (/feu|flamme|eclair|boule|explosion|foudre|glace|givre/.test(normalized)) return "attack";
  if (/soin|guerir?|regenere|heal|soigne|restaure/.test(normalized)) return "heal";
  if (/mur|barriere|terre|seisme|lave|inondation/.test(normalized)) return "terrain";
  if (/force|vitesse|bouclier|protege|beni/.test(normalized)) return "buff";
  return "generic";
}

export const castVerb: VerbHandler = {
  id: "cast",
  aliases: /lance un sort|sort de|magie|incantation|enchante|invoque|conjure|ensorcele|sort|spell/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "cast" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    if (state.player.magic < 2 && state.player.resonance < 2) {
      return { ok: false, reason: "no_magic", narrative: "Tu ne sens aucune affinite magique en toi." };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    if (roll === null) return { ops: [] };
    const tier = getRollTier(roll);
    const power = magicPower(state);
    const spellType = inferSpellType(draft.freeText);
    const target = resolveTarget(state, draft);

    const ops: WorldOp[] = [];
    const bubbles = [];

    if (tier === "catastrophe") {
      // Spell backfires — opposite effect
      return {
        ops,
        speechBubbles: [makeSpeechBubble("player:self", null, "Le sort se retourne !", "action", 2000)],
        narrative: templateNarrate("cast", "catastrophe", {}),
        extraData: {
          healSelf: -Math.min(power, 4),
          stressDelta: 6,
        },
      };
    }

    if (tier === "failure") {
      return {
        ops,
        narrative: templateNarrate("cast", "failure", {}),
        extraData: { stressDelta: 3 },
      };
    }

    if (tier === "miss") {
      return {
        ops,
        narrative: templateNarrate("cast", "miss", {}),
      };
    }

    // Success+ — effect depends on spell type
    const multiplier = tier === "legendary" ? 3 : tier === "critical" ? 2 : 1;

    if (spellType === "attack" && target) {
      bubbles.push(makeSpeechBubble("player:self", null, "Par la magie !", "action", 1800));
      return {
        ops,
        speechBubbles: bubbles,
        extraData: {
          attackActorId: target.kind === "actor" ? target.actorId : null,
          attackPower: power * multiplier + roll,
        },
      };
    }

    if (spellType === "heal") {
      const healAmount = Math.min(power * multiplier, 8);
      return {
        ops,
        speechBubbles: [makeSpeechBubble("player:self", null, "Lumiere guerisseuse...", "action", 1800)],
        extraData: {
          healSelf: healAmount,
          stressDelta: -Math.min(multiplier * 2, 6),
        },
      };
    }

    if (spellType === "terrain") {
      // Terrain modification on critical/legendary
      if (tier === "critical" || tier === "legendary") {
        const range = tier === "legendary" ? 3 : 2;
        for (let dy = -range; dy <= range; dy++) {
          for (let dx = -range; dx <= range; dx++) {
            const tx = state.player.x + dx;
            const ty = state.player.y + dy;
            if (tx >= 0 && ty >= 0 && tx < state.worldWidth && ty < state.worldHeight) {
              ops.push({
                type: "set_entity_state",
                ref: `tile:${tx},${ty}`,
                tags: ["magic_altered"],
                states: ["transformed"],
              });
            }
          }
        }
      }
      bubbles.push(makeSpeechBubble("player:self", null, "La terre tremble...", "action", 2200));
      return { ops, speechBubbles: bubbles };
    }

    if (spellType === "buff") {
      return {
        ops,
        speechBubbles: [makeSpeechBubble("player:self", null, "Force interieure !", "action", 1800)],
        extraData: {
          stressDelta: -Math.min(multiplier * 3, 8),
        },
      };
    }

    // Generic magic
    bubbles.push(makeSpeechBubble("player:self", null, "L energie circule...", "action", 1600));
    return {
      ops,
      speechBubbles: bubbles,
      extraData: {
        stressDelta: -multiplier,
      },
    };
  },

  narrate(ops, roll, tier, draft, state) {
    return templateNarrate("cast", tier ?? "success", {});
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_magic") return "Tu ne possedes aucune affinite magique.";
    return "Le sort echoue.";
  },
};
