import { NextRequest, NextResponse } from "next/server";
import { applyOutcome, buildActionContext } from "@/lib/solo/logic";
import { resolveSoloAction } from "@/lib/solo/resolve";
import type { SoloGameState } from "@/lib/solo/types";

type ActionPayload = {
  actionText?: string;
  state?: SoloGameState;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActionPayload;
    const actionText = typeof body.actionText === "string" ? body.actionText.trim().slice(0, 400) : "";
    const state = body.state;

    if (!actionText || !isSoloState(state)) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const safeState = normalizeState(state);
    const context = buildActionContext(safeState);
    const outcome = await resolveSoloAction({ actionText, context });
    const nextState = applyOutcome(safeState, outcome);

    return NextResponse.json({
      ok: true,
      outcome,
      state: nextState,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "action_failed",
      },
      { status: 500 }
    );
  }
}

function normalizeState(state: SoloGameState): SoloGameState {
  const normalized: SoloGameState = {
    ...state,
    player: {
      ...state.player,
      rank: state.player.rank || "C",
      equippedItemId: state.player.equippedItemId ?? null,
      equippedItemName: state.player.equippedItemName ?? null,
      equippedItemSprite: state.player.equippedItemSprite ?? null,
    },
  };
  if (!Number.isFinite(normalized.player.x) || !Number.isFinite(normalized.player.y)) {
    normalized.player.x = 24;
    normalized.player.y = 25;
  }
  normalized.player.x = Math.min(Math.max(Math.round(normalized.player.x), 0), normalized.worldWidth - 1);
  normalized.player.y = Math.min(Math.max(Math.round(normalized.player.y), 0), normalized.worldHeight - 1);
  return normalized;
}

function isSoloState(value: unknown): value is SoloGameState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!v.player || typeof v.player !== "object") return false;
  if (!Array.isArray(v.tiles) || !Array.isArray(v.actors) || !Array.isArray(v.log) || !Array.isArray(v.quests)) {
    return false;
  }
  if (typeof v.worldWidth !== "number" || typeof v.worldHeight !== "number") return false;
  return true;
}
