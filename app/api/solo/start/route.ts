import { NextRequest, NextResponse } from "next/server";
import { createInitialSoloState } from "@/lib/solo/world";

type StartPayload = {
  playerName?: string;
  powerText?: string;
  powerRoll?: number;
  powerAccepted?: boolean;
  characterId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StartPayload;
    const playerName = (body.playerName || "Aventurier").trim().slice(0, 20) || "Aventurier";
    const powerText = (body.powerText || "").trim();
    const powerRoll = Number.isFinite(body.powerRoll) ? Math.max(1, Math.min(20, Math.round(body.powerRoll!))) : 10;
    const powerAccepted = typeof body.powerAccepted === "boolean" ? body.powerAccepted : powerRoll >= 11;

    if (powerText.length < 3) {
      return NextResponse.json({ ok: false, error: "power_text_required" }, { status: 400 });
    }

    const state = createInitialSoloState({
      playerName,
      powerText,
      powerRoll,
      powerAccepted,
      characterId: body.characterId,
    });

    return NextResponse.json({ ok: true, state });
  } catch {
    return NextResponse.json({ ok: false, error: "start_failed" }, { status: 500 });
  }
}

