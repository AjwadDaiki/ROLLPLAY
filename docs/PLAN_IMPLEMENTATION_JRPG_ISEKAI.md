# Plan d'Implémentation - JRPG Sandbox ISEKAI

## 1. Plan global de développement (ordre de construction)
Objectif de pilotage: construire un noyau solide, puis élargir progressivement sans casser la lisibilité.

Ordre recommandé:
1. Noyau technique stable (pipeline unique d'action + persistance + UI de base lisible).
2. Boucle jouable complète (déplacement, interaction, combat, conséquences visibles).
3. Systèmes de monde (PNJ, social, économie, événements).
4. Émergence contrôlée (variation, cascades multi-systèmes, mémoire long terme).
5. Polish production (UX, perf, contenu, QA intensive).

Dépendances clés:
- Combat dépend de stats/capacités + pipeline action.
- Social/économie dépendent d'events et persistance.
- Émergence dépend d'un monde cohérent et testable.

---

## 2. Roadmap par phases

## Phase 1 - Fondations (2 à 4 semaines)
Objectifs:
- Pipeline unique: Action -> Interprétation -> Validation -> Résolution -> Delta -> Rendu -> Persistance.
- Serveur autoritaire sur l'état.
- UI minimale causale (résultat action + raison).

Systèmes:
- Contrat d'action canonique (`PlayerCommand`, `ActionIntent`, `WorldOp`, `WorldDelta`).
- Event bus interne.
- Sauvegarde snapshot + event log.

Livrable:
- Vertical slice interne: déplacement + interaction simple + logs de causalité.

Validation:
- 0 crash sur boucle principale.
- 100% actions testées donnent un résultat explicite (succès/échec utile).

## Phase 2 - Gameplay de base (3 à 5 semaines)
Objectifs:
- Jeu jouable et fun en boucle courte.
- Combat lisible dédié (tour par tour + action libre cadrée).
- Map cohérente sur 1 village + 1 biome.

Systèmes:
- Déplacement stable case par case.
- Combat v1 (commandes classiques + texte libre résolu proprement).
- Interaction contextuelle PNJ/objets.

Livrable:
- MVP public testable (30-45 min de session viable).

Validation:
- Feedback clair sur chaque action.
- Au moins 1 conséquence visible après chaque action significative.

## Phase 3 - Systèmes avancés (4 à 8 semaines)
Objectifs:
- Monde vivant crédible.
- Réputation/relations/économie réellement connectées.

Systèmes:
- PNJ routines + perception + mémoire locale.
- Social (factions, crimes, témoins, réactions).
- Économie (prix dynamiques, stock, négociation).

Livrable:
- 2-3 styles de run distincts déjà perceptibles.

Validation:
- Les choix sociaux changent accès/prix/comportements.
- Rechargement conserve les impacts majeurs.

## Phase 4 - Émergence et complexité (5 à 10 semaines)
Objectifs:
- Aucune run identique, sans chaos.
- Situations mémorables générées par systèmes.

Systèmes:
- Variantes de conséquences (succès partiel, coûts cachés, effets secondaires).
- Cascades multi-systèmes bornées.
- Événements dynamiques contextuels.

Livrable:
- Mode ISEKAI "story generator" stable.

Validation:
- Corpus QA: séquences non triviales mais cohérentes.
- Taux d'actions mortes < 1%.

## Phase 5 - Polish et production (continu)
Objectifs:
- Qualité perçue "jeu pro".
- Stabilité/perf/UX finalisées.

Systèmes:
- Polissage UX, animations, son, onboarding.
- Optimisations runtime et outillage QA.

Livrable:
- Build production candidate.

Validation:
- KPI jouabilité, retention session, stabilité.

---

## 3. MVP (version minimale jouable)
Indispensable MVP:
- Déplacement stable.
- Map cohérente (village + 2 zones).
- Combat dédié lisible.
- Interaction PNJ + objets.
- Réputation simple (au moins 3 factions).
- Persistance impacts de base.

Peut attendre après MVP:
- Économie profonde.
- Variantes avancées d'émergence.
- Quêtes émergentes complexes.

Promesse MVP:
- Fun immédiat.
- Compréhension claire.
- Liberté crédible (pas totale) avec impacts visibles.

---

## 4. Priorisation des systèmes
Indispensables:
- Pipeline d'action canonique.
- Déplacement/collision.
- Combat lisible.
- UI causalité.
- Persistance fiable.

Importants:
- PNJ routines + mémoire.
- Social/réputation.
- Économie locale.
- Outils map/audit.

Secondaires:
- Variantes avancées de combat.
- Événements narratifs rares.
- Personnalités PNJ fines.

Optionnels (post-stabilité):
- Multi-run meta progression.
- Modes de difficulté dynamiques.

---

## 5. Architecture du jeu (modulaire)
Modules recommandés:
- `kernel/` exécution autoritaire.
- `intent/` parse + structuration intention.
- `policy/` validation règles.
- `simulation/` application `WorldOp`.
- `systems/` combat, social, économie, quêtes, PNJ.
- `projection/` rendu des deltas vers UI/map.
- `persistence/` snapshot + logs + migrations.
- `tooling/` audit, replay, fuzz.

Règle:
- Aucun module UI ne mutile l'état monde directement.
- Toute mutation passe par `WorldOp`.

---

## 6. Pipeline central (critique)
Flux unique:
1. Input joueur (`PlayerCommand`).
2. Interprétation (`ActionIntent`).
3. Validation (`PolicyResult`).
4. Planification (`ActionPlan` + variantes).
5. Résolution (roll + stats + contexte).
6. Application (`WorldOps` -> `WorldDelta` + `WorldEvents`).
7. Rendu (map, UI, feedback).
8. Persistance (event log + snapshot).

Sortie obligatoire:
- Succès, partiel, échec utile ou refus explicite.
- Jamais de no-op silencieux.

---

## 7. Stratégie d'implémentation (simple -> fonctionnel -> avancé)

Déplacement:
- v1: cadence fixe, collisions fiables.
- v2: path preview + confort input.
- v3: micro-polish animation.
Piège: mélanger logique mouvement et animation.

Combat:
- v1: actions classiques + résolution claire.
- v2: action libre sécurisée.
- v3: profondeur tactique contextuelle.
Piège: action libre sans contraintes.

PNJ:
- v1: placement + routines simples.
- v2: mémoire + réactions.
- v3: personnalités et biais.
Piège: IA "smart" mais illisible pour joueur.

Social/économie:
- v1: réputation + prix basiques.
- v2: témoins + sanctions.
- v3: propagation et marchés locaux.
Piège: trop de variables non visibles en UI.

---

## 8. Méthodes de test
Tests système:
- Invariants (collisions, ownership, inventaires, états).
- Tests propriété (persistance/rechargement).

Tests gameplay:
- Scénarios scriptés (combat, vol, négociation, crime, fuite).
- Scénarios extrêmes (actions WTF).

Tests robustesse:
- Fuzz 1k/10k actions.
- Replay deterministe des seeds.

Détection actions mortes:
- KPI `WorldImpactRatio` et `NoOpRate`.
- Blocage CI si régression.

---

## 9. Risques et mitigations
Complexité explosive:
- Danger: système ingérable.
- Mitigation: DSL stricte + scope par phase.

Incohérence gameplay:
- Danger: jeu imprévisible sans logique.
- Mitigation: policy engine + causal trace.

UX confuse:
- Danger: joueur perdu.
- Mitigation: feedback compact + détail optionnel.

Perf:
- Danger: simulation coûteuse.
- Mitigation: updates chunk-local + budgets tick.

Dette technique:
- Danger: patches hardcodés.
- Mitigation: strangler pattern + extinction legacy planifiée.

---

## 10. Stratégie de simplification
Règles:
- 1 pipeline, 1 source de vérité.
- Préférer 10 règles réutilisables à 100 cas spéciaux.
- Introduire la profondeur par combinaison, pas par exceptions.
- Afficher seulement les impacts les plus importants.

Heuristique:
- Si une feature n'améliore ni clarté ni impact joueur, elle attend.

---

## 11. Outils nécessaires
Debug:
- Inspecteur entité (états, ownership, relations, access policy).
- Trace `Intent -> Plan -> Ops -> Delta`.

Test:
- Fuzz runner actions.
- Replay runner seeds.
- Validation map (collisions, overlaps, footprints, portes).

Création:
- Éditeur map visuel (déjà en route).
- Palette assets + règles de placement.
- Audit automatique en CI.

---

## 12. Objectifs jouables par étape
Chaque phase doit produire un build jouable:
- P1: sandbox technique interne.
- P2: MVP fun testable.
- P3: monde vivant crédible.
- P4: runs distinctes et mémorables.
- P5: build qualité production.

Règle:
- pas de cycle long sans playtest.

---

## 13. Règles de développement (discipline équipe)
Toujours faire:
- Coder par contrats explicites.
- Ajouter test + trace causalité pour chaque système critique.
- Mesurer les KPI gameplay (impact, lisibilité, persistance).

Ne jamais faire:
- Mutation d'état hors `WorldOp`.
- Hardcode d'exception non documentée.
- Feature sans feedback visible.

Bonnes pratiques:
- Feature flags.
- Migration incrémentale.
- Revue architecture hebdo.
- Playtest régulier orienté "compréhension joueur".

---

## 14. KPI de pilotage
- `NoOpRate` < 1%.
- `WorldImpactRatio` > 90% actions significatives.
- `PersistenceIntegrity` > 95% impacts majeurs après reload.
- `MisrouteRate` (mauvaise cible/système) en baisse continue.
- `ExplainabilityPass` > 95% actions avec cause lisible.

---

## 15. Résultat attendu
Un projet:
- réalisable (phases nettes),
- stable (pipeline unique),
- progressif (livrables jouables),
- testable (outils + KPI),
- scalable (architecture modulaire),
- aligné avec la vision ambitieuse sans devenir chaotique.
