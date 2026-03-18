import { CONFIG, getRollTier, type RollTier } from "../config";
import type { ActionDraft, SoloGameState, WorldOp } from "../types";
import type { VerbHandler, VerbPlanResult } from "./types";
import { findItemByName, makeSpeechBubble, templateNarrate } from "./helpers";

/** Craftable recipes: input item(s) → output item name */
const RECIPES: { inputs: string[]; output: string; minTier: RollTier }[] = [
  { inputs: ["bois"], output: "Bouclier en bois", minTier: "success" },
  { inputs: ["bois", "bois"], output: "Barricade", minTier: "success" },
  { inputs: ["pierre brute"], output: "Projectile de pierre", minTier: "success" },
  { inputs: ["bois"], output: "Torche", minTier: "miss" },
  { inputs: ["materiau"], output: "Outil improvise", minTier: "success" },
  { inputs: ["bois"], output: "Piege rudimentaire", minTier: "success" },
  { inputs: ["pierre brute", "bois"], output: "Hache de fortune", minTier: "success" },
];

function findRecipe(state: SoloGameState, desiredName?: string | null) {
  for (const recipe of RECIPES) {
    if (desiredName) {
      const norm = desiredName.toLowerCase();
      if (!recipe.output.toLowerCase().includes(norm) && !norm.includes(recipe.output.toLowerCase())) continue;
    }
    const hasAll = recipe.inputs.every((input) =>
      state.player.inventory.some((inv) => inv.name.toLowerCase().includes(input.toLowerCase()) && inv.qty > 0)
    );
    if (hasAll) return recipe;
  }
  return null;
}

export const craftVerb: VerbHandler = {
  id: "craft",
  aliases: /fabrique|construit|forge|assemble|bricole|repare|cree|craft|batir?|batis/,
  requiresDice: true,

  canHandle(draft, state) {
    return draft.verb === "craft" || this.aliases.test(draft.freeText.toLowerCase());
  },

  validate(draft, state) {
    const recipe = findRecipe(state, draft.desiredItemName ?? draft.freeText);
    if (!recipe) {
      return { ok: false, reason: "no_recipe", narrative: "Tu n as pas les materiaux necessaires pour fabriquer quoi que ce soit." };
    }
    return { ok: true };
  },

  plan(draft, state, roll) {
    if (roll === null) return { ops: [] };
    const tier = getRollTier(roll);
    const recipe = findRecipe(state, draft.desiredItemName ?? draft.freeText);
    if (!recipe) return { ops: [] };

    const ops: WorldOp[] = [];

    if (tier === "catastrophe") {
      // Materials destroyed, nothing crafted
      for (const input of recipe.inputs) {
        ops.push({ type: "transfer_item", fromRef: "player:self", toRef: "void", itemName: input, qty: 1 });
      }
      return { ops, narrative: templateNarrate("craft", tier, { item: recipe.output }) };
    }

    if (tier === "failure") {
      // Materials damaged, one lost
      ops.push({ type: "transfer_item", fromRef: "player:self", toRef: "void", itemName: recipe.inputs[0], qty: 1 });
      return { ops, narrative: templateNarrate("craft", tier, { item: recipe.output }) };
    }

    if (tier === "miss") {
      // Clean fail, nothing consumed, nothing crafted
      return { ops: [], narrative: templateNarrate("craft", tier, { item: recipe.output }) };
    }

    // Success+ : consume inputs, create output
    for (const input of recipe.inputs) {
      ops.push({ type: "transfer_item", fromRef: "player:self", toRef: "void", itemName: input, qty: 1 });
    }
    ops.push({ type: "transfer_item", fromRef: "void", toRef: "player:self", itemName: recipe.output, qty: 1, createIfMissing: true });

    // Critical/legendary bonus: extra item or gold
    if (tier === "critical") {
      ops.push({ type: "adjust_player_gold", delta: 3, reason: "Bonus craft critique" });
    }
    if (tier === "legendary") {
      ops.push({ type: "adjust_player_gold", delta: 8, reason: "Chef-d oeuvre artisanal" });
      ops.push({ type: "transfer_item", fromRef: "void", toRef: "player:self", itemName: recipe.output, qty: 1, createIfMissing: true });
    }

    return {
      ops,
      speechBubbles: tier === "legendary" ? [
        makeSpeechBubble("player:self", null, "Un chef-d oeuvre !", "action", 2000),
      ] : [],
    };
  },

  narrate(ops, roll, tier, draft, state) {
    const recipe = findRecipe(state, draft.desiredItemName ?? draft.freeText);
    return templateNarrate("craft", tier ?? "success", { item: recipe?.output ?? "l objet" });
  },

  narrateFailure(reason, draft, state) {
    if (reason === "no_recipe") return "Tu n as pas les materiaux necessaires.";
    return "Impossible de fabriquer quoi que ce soit.";
  },
};
