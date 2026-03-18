// ─── Shared Verb Handler Utilities ───

import { CONFIG, getRollTier, type RollTier } from "../config";
import { findWorldEntityByRef, type WorldEntity } from "../interaction";
import { normalizeActionText } from "../runtime";
import { findShopCatalogEntry, getShopPrice } from "../shop";
import type {
  ActionDraft,
  EntityInventoryItem,
  SoloGameState,
  WorldActor,
  WorldEntityRef,
  WorldEntityState,
  WorldOp,
  SpeechBubbleEvent,
} from "../types";

export function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function resolveTarget(state: SoloGameState, draft: ActionDraft): WorldEntity | null {
  return findWorldEntityByRef(state, draft.primaryTargetRef ?? null);
}

export function resolveTargetActor(state: SoloGameState, draft: ActionDraft): WorldActor | null {
  const entity = resolveTarget(state, draft);
  if (!entity?.actorId) return null;
  return state.actors.find((a) => a.id === entity.actorId && a.alive) ?? null;
}

export function distanceToTarget(state: SoloGameState, target: { x: number; y: number }): number {
  return manhattan(state.player.x, state.player.y, target.x, target.y);
}

export function getEntityState(state: SoloGameState, ref: WorldEntityRef): WorldEntityState {
  return (
    state.entityStates[ref] ?? {
      ref,
      ownerRef: null,
      faction: null,
      inventory: [],
      equipment: {},
      tags: [],
      states: [],
      witnessRange: 0,
      accessPolicy: null,
    }
  );
}

export function findItemByName(
  items: Array<EntityInventoryItem | { name: string; qty: number }>,
  rawName: string
): EntityInventoryItem | null {
  const needle = normalizeActionText(rawName);
  if (!needle) return null;
  let best: EntityInventoryItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    const normalizedItem = normalizeActionText(item.name);
    const score =
      normalizedItem === needle ? 5 : normalizedItem.includes(needle) || needle.includes(normalizedItem) ? 2 : 0;
    if (score > bestScore) {
      bestScore = score;
      best =
        "icon" in item
          ? item
          : ({ ...item, id: item.name, itemId: null, icon: "", sprite: null, emoji: "" } as EntityInventoryItem);
    }
  }
  return bestScore > 0 ? best : null;
}

export function isShopLike(entity: WorldEntity): boolean {
  return (
    (entity.kind === "structure" && entity.poi === "shop") ||
    (entity.kind === "actor" && entity.actorId === "npc_shopkeeper")
  );
}

export function isNearPoi(state: SoloGameState, poi: string, range: number): boolean {
  const { x, y } = state.player;
  for (let dy = -range; dy <= range; dy += 1) {
    for (let dx = -range; dx <= range; dx += 1) {
      if (Math.abs(dx) + Math.abs(dy) > range) continue;
      const tx = x + dx;
      const ty = y + dy;
      if (tx < 0 || ty < 0 || tx >= state.worldWidth || ty >= state.worldHeight) continue;
      const tile = state.tiles[ty * state.worldWidth + tx];
      if (tile?.poi === poi) return true;
    }
  }
  return false;
}

export function makeSpeechBubble(
  ref: WorldEntityRef,
  speaker: string | null,
  text: string,
  kind: "speech" | "thought" | "action" | "system" = "speech",
  ttlMs = 2400
): SpeechBubbleEvent {
  return { sourceRef: ref, speaker, text, kind, ttlMs };
}

export function actorStrength(actor: WorldActor): number {
  return clamp(Math.round(actor.strength ?? actor.maxHp / 2 + 4), 1, 99);
}

export function actorCombat(actor: WorldActor): number {
  return clamp(
    Math.round(actor.combatLevel ?? Math.floor(actor.maxHp / 4) + (actor.kind === "boss" ? 8 : actor.kind === "monster" ? 4 : 2)),
    1,
    30
  );
}

/** Get the unit sell price for an item */
export function getSellPrice(itemName: string, discount?: number): number {
  const entry = findShopCatalogEntry(itemName);
  if (entry) {
    return Math.max(1, Math.floor(getShopPrice(entry, discount) * CONFIG.shop.defaultResalePercent / 100));
  }
  return CONFIG.shop.fallbackSellPriceNoSprite;
}

/** Narration templates by verb + roll tier */
const NARRATION_TEMPLATES: Record<string, Partial<Record<RollTier, string>>> = {
  steal: {
    catastrophe: "Ta main tremblante renverse tout. {target} te regarde avec fureur.",
    failure: "Tu t approches de {target} mais tes doigts glissent. Rien de vole.",
    partial: "Tu attrapes quelques pieces, mais {target} a senti quelque chose.",
    success: "D un geste discret, tu subtilises l objet de {target}. Ni vu ni connu.",
    critical: "Le vol est parfait. {target} ne remarquera rien avant demain.",
    legendary: "Un exploit legendaire. Tu voles tout ce qui brille sans un bruit.",
  },
  attack: {
    catastrophe: "Ton arme t echappe des mains. {target} en profite.",
    failure: "Ton coup rate lamentablement.",
    partial: "Tu egratignnes {target}, mais c est insuffisant.",
    success: "Ton coup touche {target} avec precision.",
    critical: "Un coup puissant fait reculer {target}.",
    legendary: "Un coup legendaire. {target} vacille sous l impact.",
  },
  negotiate: {
    catastrophe: "Ton offre ridicule insulte le marchand.",
    failure: "Le marchand refuse categoriquement.",
    partial: "Le marchand hesite mais refuse.",
    success: "Le marchand accepte de faire un geste commercial.",
    critical: "Tu negocies une belle remise.",
    legendary: "Le marchand, impressionne, t offre ses meilleurs prix.",
  },
  recruit: {
    catastrophe: "{target} se moque de ta proposition.",
    failure: "{target} refuse poliment de te suivre.",
    partial: "{target} hesite mais decline.",
    success: "{target} accepte de te suivre.",
    critical: "{target} est enthousiaste a l idee de t accompagner.",
    legendary: "{target} te jure une fidelite sans faille.",
  },
  destroy: {
    catastrophe: "Tu te blesses en frappant. L objet est intact.",
    failure: "Tes coups n entament meme pas la surface.",
    partial: "Tu fissures la cible mais elle tient bon.",
    success: "Tu detruis {target} avec efficacite.",
    critical: "La destruction est nette et precise. Des materiaux tombent.",
    legendary: "D un coup titanesque, tu pulverises tout.",
  },
  use: {
    success: "Tu utilises {item}. L effet se fait sentir immediatement.",
  },
  inspect: {
    success: "Tu prends le temps d observer attentivement.",
  },
};

export function templateNarrate(verb: string, tier: RollTier, vars: Record<string, string>): string {
  const templates = NARRATION_TEMPLATES[verb];
  if (!templates) return `Tu tentes de ${verb}. Le destin decide...`;
  const template = templates[tier] ?? templates.success ?? `Tu ${verb} avec ${tier === "legendary" ? "brio" : "determination"}.`;
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}
