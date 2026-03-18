// ─── Cascade & Policy Engine ───
// Validates WorldOps and propagates consequences via declarative rules.

import { CONFIG } from "./config";
import type {
  SoloGameState,
  WorldActor,
  WorldOp,
  WorldEntityRef,
  SpeechBubbleEvent,
} from "./types";

// ─── Policy Results ───

export type PolicyDecision =
  | { decision: "allow" }
  | { decision: "allow_with_modifiers"; modifiers: Record<string, unknown> }
  | { decision: "deny"; code: string; reason: string };

export type RejectedOp = {
  op: WorldOp;
  reason: string;
};

// ─── Cascade Rules ───

export type CascadeRule = {
  id: string;
  trigger: (op: WorldOp, state: SoloGameState) => boolean;
  generate: (op: WorldOp, state: SoloGameState) => WorldOp[];
  maxPerTurn: number;
};

// ─── Built-in Rules ───

const cascadeRules: CascadeRule[] = [
  // CR05: Transactions are atomic - gold + item must both succeed
  {
    id: "CR05_TRANSACTION_ATOMIC",
    trigger: (op) => op.type === "adjust_player_gold" && (op.reason?.startsWith("Achat") ?? false),
    generate: () => [],
    maxPerTurn: 10,
  },

  // CR01: When an actor takes damage, check if they die
  {
    id: "CR01_DAMAGE_CHECK",
    trigger: (op) => op.type === "set_entity_state" && (op.states?.includes("damaged") ?? false),
    generate: () => [],
    maxPerTurn: 8,
  },
];

// ─── Policy Engine ───

export function evaluatePolicy(op: WorldOp, state: SoloGameState): PolicyDecision {
  // Layer 1: Hard safety invariants
  if (op.type === "adjust_player_gold") {
    const newGold = state.player.gold + op.delta;
    if (newGold < 0 && op.delta < 0) {
      return { decision: "deny", code: "insufficient_gold", reason: `Pas assez d or (besoin: ${-op.delta}, actuel: ${state.player.gold})` };
    }
  }

  if (op.type === "transfer_item" && op.qty <= 0 && !op.createIfMissing) {
    return { decision: "deny", code: "invalid_qty", reason: "Quantite invalide" };
  }

  // Layer 2: Scenario rules (extensible)
  // Currently minimal - will grow with world rules

  // Layer 3: Entity policy (distance, capabilities, cooldowns)
  // Handled per-verb in validate() for now

  return { decision: "allow" };
}

// ─── Cascade Execution ───

export type CascadeResult = {
  applied: WorldOp[];
  rejected: RejectedOp[];
  cascadedBubbles: SpeechBubbleEvent[];
  depth: number;
};

export function executeCascade(
  initialOps: WorldOp[],
  state: SoloGameState,
  rules: CascadeRule[] = cascadeRules
): CascadeResult {
  const applied: WorldOp[] = [];
  const rejected: RejectedOp[] = [];
  const cascadedBubbles: SpeechBubbleEvent[] = [];
  let pending = [...initialOps];
  let depth = 0;
  const ruleCounters = new Map<string, number>();

  while (pending.length > 0 && depth < CONFIG.cascade.maxDepth) {
    const newOps: WorldOp[] = [];

    for (const op of pending) {
      // Policy check
      const policyResult = evaluatePolicy(op, state);

      if (policyResult.decision === "deny") {
        rejected.push({ op, reason: policyResult.reason });
        continue;
      }

      // Collect speech bubbles from ops
      if (op.type === "add_speech_bubble") {
        cascadedBubbles.push(op.bubble);
      }

      applied.push(op);

      // Check cascade triggers
      for (const rule of rules) {
        const count = ruleCounters.get(rule.id) ?? 0;
        if (count >= rule.maxPerTurn) continue;

        if (rule.trigger(op, state)) {
          const cascaded = rule.generate(op, state);
          newOps.push(...cascaded);
          ruleCounters.set(rule.id, count + 1);
        }
      }
    }

    pending = newOps;
    depth++;

    // Safety cap
    if (applied.length > CONFIG.cascade.maxOpsPerAction) break;
  }

  return { applied, rejected, cascadedBubbles, depth };
}

// ─── Op Application ───
// Applies validated WorldOps to game state. This is the ONLY place
// where state mutation happens for WorldOps.

export function applyValidatedOps(state: SoloGameState, ops: WorldOp[]): void {
  for (const op of ops) {
    if (op.type === "adjust_player_gold") {
      state.player.gold = Math.max(0, state.player.gold + Math.round(op.delta));
      continue;
    }

    if (op.type === "set_shop_discount") {
      const maxDiscount = CONFIG.shop.maxDiscountPercent;
      state.player.shopDiscountPercent = Math.max(0, Math.min(maxDiscount, Math.round(op.percent)));
      continue;
    }

    if (op.type === "transfer_item") {
      applyTransferItem(state, op);
      continue;
    }

    if (op.type === "record_incident") {
      state.incidents.push({
        ...op.incident,
        id: op.incident.id || `incident_${state.turn}_${state.incidents.length + 1}`,
        createdTurn: op.incident.createdTurn ?? state.turn,
      });
      continue;
    }

    if (op.type === "set_entity_state") {
      const entity = getOrCreateEntityState(state, op.ref);
      if (op.tags) entity.tags = [...op.tags];
      if (op.states) entity.states = [...op.states];
      continue;
    }

    // move_path and add_speech_bubble are handled separately by the pipeline
  }
}

function applyTransferItem(
  state: SoloGameState,
  op: Extract<WorldOp, { type: "transfer_item" }>
): void {
  const qty = Math.max(1, Math.round(op.qty));

  // Remove from source
  let transferred = true;
  if (op.fromRef && op.fromRef !== "player:self") {
    transferred = removeEntityItem(state, op.fromRef, op.itemName, qty);
  } else if (op.fromRef === "player:self") {
    transferred = removePlayerItem(state, op.itemName, qty);
  }

  if (!transferred && !op.createIfMissing) return;

  // Add to destination
  if (op.toRef === "player:self") {
    addPlayerItem(state, op.itemName, qty);
  } else {
    addEntityItem(state, op.toRef, op.itemName, qty);
  }
}

function removePlayerItem(state: SoloGameState, rawName: string, qty: number): boolean {
  const normalized = rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const found = state.player.inventory.find((entry) => {
    const n = entry.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return n === normalized || n.includes(normalized) || normalized.includes(n);
  });
  if (!found) return false;
  found.qty -= Math.min(qty, found.qty);
  if (found.qty <= 0) {
    state.player.inventory = state.player.inventory.filter((e) => e.id !== found.id);
    if (state.player.equippedItemId === found.id) {
      state.player.equippedItemId = null;
      state.player.equippedItemName = null;
      state.player.equippedItemSprite = null;
    }
  }
  return true;
}

function addPlayerItem(state: SoloGameState, name: string, qty: number): void {
  // Delegate to existing resolveItemAsset pattern
  const existing = state.player.inventory.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.qty += qty;
    return;
  }
  state.player.inventory.push({
    id: `item_${name.toLowerCase().replace(/\s+/g, "_")}`,
    itemId: null,
    name,
    qty,
    icon: "",
    sprite: null,
    emoji: "",
  });
}

function removeEntityItem(state: SoloGameState, ref: WorldEntityRef, name: string, qty: number): boolean {
  const entity = state.entityStates[ref];
  if (!entity) return false;
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const found = entity.inventory.find((e) => {
    const n = e.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return n === normalized || n.includes(normalized) || normalized.includes(n);
  });
  if (!found) return false;
  found.qty -= Math.min(qty, found.qty);
  if (found.qty <= 0) {
    entity.inventory = entity.inventory.filter((e) => e.id !== found.id);
  }
  return true;
}

function addEntityItem(state: SoloGameState, ref: WorldEntityRef, name: string, qty: number): void {
  const entity = getOrCreateEntityState(state, ref);
  const existing = entity.inventory.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.qty += qty;
    return;
  }
  entity.inventory.push({
    id: `${ref}_${name.toLowerCase().replace(/\s+/g, "_")}`,
    itemId: null,
    name,
    qty,
    icon: "",
    sprite: null,
    emoji: "",
    ownerRef: ref,
    equippedSlot: null,
    tags: [],
  });
}

function getOrCreateEntityState(state: SoloGameState, ref: WorldEntityRef) {
  if (!state.entityStates[ref]) {
    state.entityStates[ref] = {
      ref,
      ownerRef: null,
      faction: null,
      inventory: [],
      equipment: {},
      tags: [],
      states: [],
      witnessRange: 0,
      accessPolicy: null,
    };
  }
  return state.entityStates[ref];
}
