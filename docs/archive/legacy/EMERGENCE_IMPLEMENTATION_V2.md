# Emergence Implementation V2 (Cohérence + Liberté + Variation)

Date: 2026-03-21

## Ce qui a été implémenté

Le runtime solo applique maintenant un pipeline enrichi:

`Intent -> Plan -> VariantSelect -> Cascade/Policy -> Delta -> Render/UI -> Persist`

### 1) Contrats no-dead + no-boring
- `lib/solo/kernel.ts`
  - garde `no-dead`: aucune action ne finit sans impact.
  - garde `no-boring`: si aucun signal d’intérêt n’est détecté, injection d’une micro-conséquence systémique.
  - génération systématique de `interestSignals`.
  - génération d’un `CausalityTrace` fallback si absent.

### 2) Sélection de variantes contrôlée
- `lib/solo/emergence.ts` (nouveau)
  - construit `EmergenceContext` (biome, heure, météo, témoins, pression incidents, réputation locale/faction).
  - génère 2-4 variantes candidates (baseline + effets secondaires bornés).
  - score chaque variante avec priorité:
    - cohérence
    - lisibilité
    - intérêt
    - nouveauté
  - choisit une variante et produit `CausalityTrace`.

### 3) Intégration verb engine
- `lib/solo/verbs/index.ts`
  - branchement de `selectConsequenceVariant(...)` avant cascade.
  - applique les ops de la variante sélectionnée.
  - expose dans `SoloOutcome`:
    - `variants`
    - `selectedVariantId`
    - `interestSignals`
    - `causalityTrace`

### 4) Contrats/types consolidés
- `lib/solo/types.ts`
  - ajout de:
    - `InterestSignal`
    - `EmergenceContext`
    - `ConsequenceVariant`
    - `CausalityTrace`
    - `NPCReactionProfile`
  - extension `WorldDelta`:
    - `noBoringGuardTriggered`
    - `noDeadSatisfied`
    - `noBoringSatisfied`
    - `interestSignals`
    - `causalityTrace`
  - extension `SoloOutcome` / `ResolutionPlan` avec données de variante et causalité.

### 5) UX “résumé + détail optionnel”
- `app/game/GameClient.tsx`
- `app/game/GameClient.module.css`
  - ajout d’une carte “Pourquoi ce résultat”.
  - résumé immédiat (`causalityTrace.summary`).
  - détail optionnel (variant choisie, scores, systèmes impactés, raisons).
  - affichage des signaux d’intérêt.

### 6) QA/métriques de généralisation
- `scripts/sandbox-generalization-check.ts`
  - exécution via kernel autoritaire (et non plus resolve/apply isolés).
  - nouvelles métriques:
    - no-boring
    - causality trace coverage
    - no-dead / no-boring pass rates
  - rapports mis à jour automatiquement.

## Résultats de validation

### Typecheck
`npx tsc --noEmit` ✅

### Lint
`npm run lint` ✅ (warnings existants hors scope déjà présents dans le projet)

### QA généralisation
`npm run qa:sandbox` ✅

Extrait des métriques actuelles:
- Total actions: 1000
- Crashes: 0
- Any impact: 100%
- No-dead pass: 100%
- No-boring pass: 100%
- Causality trace: 100%
- WorldOps coverage: 80%
- Semantic miss (supported): 4%

## Ce qui reste prioritaire (prochaine itération)
- Réduire les `semantic miss` (ex: `burn` routé vers `destroy`).
- Améliorer les familles “contained” (`block`, `trap`, `disarm`, `bribe`) vers des verbes génériques pleinement supportés.
- Renforcer la propagation cross-systems réelle (social -> économie -> pathing) avec budgets de fan-out stricts.
