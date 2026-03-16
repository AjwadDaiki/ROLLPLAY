"use client";

/* eslint-disable @next/next/no-img-element */

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CHARACTER_OPTIONS } from "@/lib/solo/characters";
import styles from "./page.module.css";

export default function SoloSetupPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <section className={styles.card}>Chargement...</section>
        </main>
      }
    >
      <SoloSetupInner />
    </Suspense>
  );
}

function SoloSetupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const playerName = (params.get("name") || "Aventurier").slice(0, 20);

  const [scenario] = useState("isekai");
  const [powerText, setPowerText] = useState("");
  const [rolling, setRolling] = useState(false);
  const [previewRoll, setPreviewRoll] = useState<number | null>(null);
  const [finalRoll, setFinalRoll] = useState<number | null>(null);
  const [characterId, setCharacterId] = useState(CHARACTER_OPTIONS[0].id);

  const accepted = useMemo(() => {
    if (finalRoll === null) return null;
    return finalRoll >= 11;
  }, [finalRoll]);

  async function rollPower(): Promise<void> {
    if (rolling) return;
    const customPower = powerText.trim();
    if (customPower.length < 3) return;

    setRolling(true);
    setFinalRoll(null);

    const interval = window.setInterval(() => {
      setPreviewRoll(1 + Math.floor(Math.random() * 20));
    }, 70);

    await new Promise((resolve) => setTimeout(resolve, 1300));
    window.clearInterval(interval);

    const roll = 1 + Math.floor(Math.random() * 20);
    setPreviewRoll(roll);
    setFinalRoll(roll);
    setRolling(false);
  }

  function startGame(): void {
    if (finalRoll === null) return;
    const runId = `${Date.now()}`;

    const query = new URLSearchParams({
      name: playerName,
      scenario,
      character: characterId,
      power: powerText.trim(),
      roll: String(finalRoll),
      accepted: finalRoll >= 11 ? "1" : "0",
      run: runId,
    });

    router.push(`/game?${query.toString()}`);
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div>
            <div className={styles.kicker}>Preparation solo</div>
            <h1>Mode Isekai</h1>
          </div>
          <button className={styles.back} onClick={() => router.push("/")}>
            Retour menu
          </button>
        </header>

        <div className={styles.meta}>Joueur: {playerName}</div>

        <div className={styles.scenarioBox}>
          <label>Scenario actif</label>
          <select value={scenario} disabled>
            <option value="isekai">Isekai (disponible)</option>
          </select>
          <small>Autres scenarios a venir.</small>
        </div>

        <div className={styles.spriteBox}>
          <label>Choisis ton sprite</label>
          <div className={styles.spriteGrid}>
            {CHARACTER_OPTIONS.map((character) => {
              const active = character.id === characterId;
              return (
                <button
                  key={character.id}
                  className={active ? styles.spriteActive : styles.sprite}
                  onClick={() => setCharacterId(character.id)}
                  type="button"
                >
                  <img src={character.face} alt={character.label} />
                  <span>{character.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label htmlFor="power" className={styles.label}>
          Decris ton pouvoir (libre)
        </label>
        <textarea
          id="power"
          value={powerText}
          onChange={(event) => setPowerText(event.target.value.slice(0, 220))}
          className={styles.input}
          placeholder="Exemple: je manipule le temps local pendant 3 secondes"
        />

        <button
          className={styles.rollButton}
          onClick={() => void rollPower()}
          disabled={rolling || powerText.trim().length < 3}
        >
          {rolling ? "Lancement en cours..." : "Lancer le D20 d acceptation du pouvoir"}
        </button>

        <div className={styles.rollBox}>
          <span>D20 initial</span>
          <strong>{previewRoll ?? "-"}</strong>
          <small>
            {accepted === null
              ? "Le jet decide si ton pouvoir est accepte ou inverse."
              : accepted
                ? "Pouvoir accepte."
                : "Pouvoir inverse: meme idee, effet oppose."}
          </small>
        </div>

        <button className={styles.startButton} disabled={finalRoll === null} onClick={startGame}>
          Lancer la partie solo
        </button>
      </section>
    </main>
  );
}
