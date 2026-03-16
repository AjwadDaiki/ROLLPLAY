"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function StartPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  function launchSolo(): void {
    const playerName = name.trim() || "Aventurier";
    const params = new URLSearchParams({ name: playerName });
    router.push(`/solo?${params.toString()}`);
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.kicker}>Freeroll</div>
        <h1>Oracle 20</h1>
        <p>
          RPG de plateau pilote par IA. Tu proposes une action libre, le MJ arbitre,
          puis le D20 decide du resultat.
        </p>

        <label htmlFor="player-name" className={styles.label}>
          Pseudo
        </label>
        <input
          id="player-name"
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value.slice(0, 20))}
          placeholder="Ton nom de joueur"
          onKeyDown={(event) => {
            if (event.key === "Enter") launchSolo();
          }}
        />

        <div className={styles.actions}>
          <button className={styles.primary} onClick={launchSolo}>
            Jeu solo
          </button>
          <button className={styles.secondary} disabled>
            Creer room (bientot)
          </button>
          <button className={styles.secondary} disabled>
            Rejoindre room (bientot)
          </button>
        </div>
      </section>
    </main>
  );
}
