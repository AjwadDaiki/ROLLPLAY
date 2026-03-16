import { Suspense } from "react";
import GameClient from "./GameClient";

export default function GamePage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>Chargement...</main>}>
      <GameClient />
    </Suspense>
  );
}
