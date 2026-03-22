# Onboarding Dev Rapide

## 1. Lancer le projet
```bash
npm install
npm run dev
```

URL utiles:
- Jeu: `http://localhost:3000/game`
- Éditeur map: `http://localhost:3000/map-editor`

## 2. Vérifications minimales avant commit
```bash
npx tsc --noEmit
npm run lint
```

## 3. Workflow recommandé
1. Lire `docs/README.md`.
2. Lire `PLAN_IMPLEMENTATION_JRPG_ISEKAI.md` (priorités phase en cours).
3. Travailler sur un seul système à la fois.
4. Tester en jeu réel (pas seulement unit test).
5. Vérifier lisibilité du résultat côté joueur.

## 4. Règle de développement
- Pas de feature sans feedback visible.
- Pas de correction UI si bug vient de la simulation.
- Pas de nouvelle mécanique si la boucle actuelle n’est pas stable.

## 5. Quand toucher quoi
- Bug de logique monde: `lib/solo/world.ts`, `lib/solo/logic.ts`.
- Bug d’intention/action: `lib/solo/kernel.ts`, `lib/solo/resolve.ts`, `lib/solo/verbs/*`.
- Bug UI/rendu: `app/game/*`.
- Bug map placement: `app/map-editor/*`, `lib/solo/mapEditor.ts`.

## 6. Débogage rapide
- Vérifier le `log` in-game et l’historique d’action.
- Reproduire sur seed/scénario court.
- Tester reload pour vérifier persistance.
- Valider qu’il n’y a pas d’action morte.

## 7. Définition de "fait" (Done)
Une tâche est terminée si:
1. comportement correct en jeu,
2. résultat visible et compréhensible,
3. persistance correcte,
4. `tsc` + `lint` passent.
