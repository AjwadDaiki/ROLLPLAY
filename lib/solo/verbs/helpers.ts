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
    catastrophe: "Ta main glisse et renverse l etalage. {target} t attrape par le col et alerte tout le monde.",
    failure: "Tu t approches de {target} mais tes doigts tremblent. {target} te repousse, mefiant.",
    miss: "Tu cherches une ouverture mais {target} ne quitte rien des yeux. Pas d occasion.",
    success: "D un geste discret, tu subtilises l objet de {target}. Ni vu ni connu.",
    critical: "Le vol est parfait. {target} ne remarquera rien avant demain.",
    legendary: "Un exploit legendaire. Tu voles tout ce qui brille sans un bruit, et en plus tu trouves un bonus cache.",
  },
  attack: {
    catastrophe: "Ton arme t echappe des mains et blesse ta propre jambe. {target} en profite pour frapper.",
    failure: "Ton coup glisse sur {target} et l impact te desequilibre.",
    miss: "Tu frappes dans le vide. {target} n a meme pas eu besoin d esquiver.",
    success: "Ton coup touche {target} avec precision.",
    critical: "Un coup puissant fait reculer {target}. Tu sens sa garde faiblir.",
    legendary: "Un coup legendaire fend l air. {target} vacille, a genoux, sous l impact devastateur.",
  },
  negotiate: {
    catastrophe: "Ton offre ridicule insulte le marchand. Les prix augmentent.",
    failure: "Le marchand refuse et te regarde de travers.",
    miss: "Le marchand ecoute poliment mais ne bouge pas sur les prix.",
    success: "Le marchand accepte de faire un geste commercial.",
    critical: "Tu negocies une belle remise. Le marchand est impressionne.",
    legendary: "Le marchand, subjugue par ton eloquence, t offre ses meilleurs prix et un cadeau.",
  },
  recruit: {
    catastrophe: "{target} se moque de ta proposition et devient agressif.",
    failure: "{target} refuse et te tourne le dos.",
    miss: "{target} t ecoute mais secoue la tete. Peut-etre une autre fois.",
    success: "{target} accepte de te suivre.",
    critical: "{target} est enthousiaste a l idee de t accompagner. Sa loyaute est forte.",
    legendary: "{target} te jure une fidelite sans faille. Un lien profond se forme.",
  },
  destroy: {
    catastrophe: "Le choc te revient en plein bras. Tu te blesses et l objet est intact.",
    failure: "Tes coups n entament meme pas la surface. Tu t epuises.",
    miss: "Tu frappes mais c est trop solide. Aucun degat, aucune consequence.",
    success: "Tu detruis {target} avec efficacite.",
    critical: "La destruction est nette et precise. Des materiaux tombent et le terrain se transforme.",
    legendary: "D un coup titanesque, tu pulverises tout. Le paysage change autour du point d impact.",
  },
  craft: {
    catastrophe: "Les materiaux explosent dans tes mains. Tu perds tout.",
    failure: "L assemblage se brise. Materiaux gaches.",
    miss: "Tu essayes mais les pieces ne s emboitent pas. Rien de perdu.",
    success: "Tu assembles les materiaux avec soin. L objet prend forme.",
    critical: "L objet est plus solide que prevu. Un travail remarquable.",
    legendary: "Un chef-d oeuvre. L objet brille d une qualite exceptionnelle.",
  },
  hide: {
    catastrophe: "Tu trebuches en te cachant et fais un vacarme. Tout le monde te voit.",
    failure: "Tu te caches mal. On te repere presque immediatement.",
    miss: "Il n y a pas d endroit pour se cacher ici.",
    success: "Tu te glisses dans l ombre. Personne ne te voit.",
    critical: "Tu deviens invisible. Meme les plus vigilants passent sans te voir.",
    legendary: "Tu fais corps avec l obscurite. Tu pourrais voler la couronne d un roi.",
  },
  cast: {
    catastrophe: "Le sort se retourne contre toi. L energie magique te brule.",
    failure: "Le sort fuse mais s evapore sans effet. Tu es fatigue.",
    miss: "Tu concentres ton energie mais rien ne se passe. Le sort s eteint.",
    success: "Le sort fonctionne. L energie magique atteint sa cible.",
    critical: "Le sort depasse tes attentes. L effet est amplifie.",
    legendary: "Une vague de magie pure transforme la zone. Un pouvoir extraordinaire se manifeste.",
  },
  give: {
    success: "Tu tends {item} a {target}. L echange se fait simplement.",
    critical: "{target} est touche par ta generosite. Votre lien se renforce.",
    legendary: "{target} est profondement emu. Ce geste change tout entre vous.",
  },
  perform: {
    catastrophe: "Ta performance est si mauvaise que le public te lance des choses.",
    failure: "Personne ne regarde. L ambiance est glaciale.",
    miss: "Tu tentes quelque chose mais l inspiration ne vient pas.",
    success: "Ta performance attire l attention. On t ecoute.",
    critical: "Le public est captive. Ta performance restera dans les memoires.",
    legendary: "Un moment magique. Meme les ennemis s arretent pour ecouter.",
  },
  use: {
    success: "Tu utilises {item}. L effet se fait sentir immediatement.",
    critical: "L objet revele un effet bonus inattendu.",
    legendary: "L objet libere un pouvoir cache. L effet est amplifie au-dela du normal.",
  },
  inspect: {
    success: "Tu prends le temps d observer attentivement.",
    critical: "Ton regard percant revele des details caches.",
    legendary: "Tu decouvres un secret que personne n avait vu avant toi.",
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
