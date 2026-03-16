import { NextRequest, NextResponse } from "next/server";
import { resolveSoloAction } from "@/lib/solo/resolve";
import type { SoloResolveRequest } from "@/lib/solo/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SoloResolveRequest>;
    const actionText = typeof body.actionText === "string" ? body.actionText.trim() : "";
    const context = body.context;

    if (!actionText || !context || typeof context !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid payload",
        },
        { status: 400 }
      );
    }

    const outcome = await resolveSoloAction({
      actionText: actionText.slice(0, 400),
      context,
    });

    return NextResponse.json({ ok: true, outcome });
  } catch {
    return NextResponse.json({
      ok: true,
      outcome: {
        narrative: "Le maitre du jeu perd le fil pendant un instant. Reessaie.",
        diceRoll: null,
      },
    });
  }
}
