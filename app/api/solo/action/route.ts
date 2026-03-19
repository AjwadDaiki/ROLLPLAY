import { NextRequest, NextResponse } from "next/server";
import { applyOutcome, buildActionContext } from "@/lib/solo/logic";
import { resolveSoloAction } from "@/lib/solo/resolve";
import { buildRepeatSignature, hydrateSoloState, isSoloState } from "@/lib/solo/runtime";
import { getSoloSession, putSoloSession } from "@/lib/solo/sessionStore";
import type { PlayerInteractionRequest, SoloGameState } from "@/lib/solo/types";

type ActionPayload = {
  actionText?: string;
  state?: SoloGameState;
  interaction?: PlayerInteractionRequest | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActionPayload;
    const actionText = typeof body.actionText === "string" ? body.actionText.trim().slice(0, 400) : "";
    const state = body.state;
    const interaction =
      body.interaction && typeof body.interaction === "object"
        ? {
            ...body.interaction,
            source: body.interaction.source ?? "text",
          }
        : null;

    if (!actionText || !isSoloState(state)) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const hydratedClientState = hydrateSoloState(state);
    const serverSession = getSoloSession(hydratedClientState.serverSessionId);
    // Merge: use the server session as base (authoritative for non-movement state)
    // but always adopt the client's player position, since keyboard movement
    // (applyFreeMoveStep) happens purely on the client and is never sent to the server.
    const safeState = serverSession
      ? {
          ...serverSession,
          player: {
            ...serverSession.player,
            x: hydratedClientState.player.x,
            y: hydratedClientState.player.y,
          },
          // Also sync client-side changes that happen between API calls
          revealedChunks: hydratedClientState.revealedChunks,
          log: hydratedClientState.log,
          lastAction: hydratedClientState.lastAction,
          lastNarration: hydratedClientState.lastNarration,
        }
      : hydratedClientState;
    const safeInteraction: PlayerInteractionRequest = interaction
      ? {
          ...interaction,
          actionText,
          repeatSignature:
            interaction.repeatSignature?.trim() ||
            buildRepeatSignature(actionText, {
              ...interaction,
              actionText,
            }),
        }
      : {
          type: "context",
          actionText,
          source: "text",
          repeatSignature: buildRepeatSignature(actionText, null),
        };

    const context = buildActionContext(safeState, safeInteraction);
    const outcome = await resolveSoloAction({ actionText, context, interaction: safeInteraction, state: safeState });
    const nextState = putSoloSession(applyOutcome(safeState, outcome, safeInteraction));

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
