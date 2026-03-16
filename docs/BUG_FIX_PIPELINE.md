# Bug Fix Pipeline

Date: 2026-03-16  
But: transformer un bug flou en correction verifiable, sans casser le jeu.

## 1. Objectif

Ce pipeline sert a repondre a 4 questions pour chaque bug:

1. `Qu est-ce qui casse exactement ?`
2. `Comment le reproduire de maniere fiable ?`
3. `Comment verifier la correction sans creer un autre bug ?`
4. `Comment garder une trace exploitable pour les prochains correctifs ?`

Le principe est simple:

`bug observe -> fiche claire -> repro -> test -> fix -> revalidation -> cloture`

---

## 2. Ou ecrire quoi

## A. Fiche bug

Chaque bug doit etre note dans un format court et strict.

Template recommande:

```md
## BUG-XXX - Titre court

- Date:
- Zone:
- Severite: critique | haute | moyenne | basse
- Type: gameplay | map | ui | narration | perf | save/load | regression
- Etat de depart:
- Action joueur:
- Resultat attendu:
- Resultat observe:
- Frequence: toujours | souvent | rare | une fois
- Impact joueur:
- Repro courte:
  1. ...
  2. ...
  3. ...
- Preuves:
  - capture
  - log
  - video
  - save state
- Hypothese technique:
- Test a ajouter:
- Statut: open | repro_ok | fix_in_progress | fixed | verified | closed
```

Ce format oblige a separer:

- l etat de depart,
- l action,
- l attendu,
- l observe.

Sans ca, on corrige des symptomes, pas des bugs.

## B. Liste priorisee

Utiliser une liste unique avec ces colonnes:

```md
| ID | Zone | Severite | Resume | Repro | Test ajoute | Statut |
|---|---|---|---|---|---|---|
| BUG-001 | shop | haute | Achat invalide accepte | oui | qa:solo | verified |
```

Ordre de priorite recommande:

1. crash / blocage
2. corruption etat / save
3. incoherence gameplay
4. map / collision / pathfinding
5. UI comprehension
6. polish visuel

---

## 3. Comment formuler un bug correctement

Un bon bug secrit comme:

`Depuis tel etat, si le joueur fait telle action, alors le jeu produit tel resultat incorrect.`

Exemple bon:

`Depuis le camp, si le joueur ecrit "j achete potion de soin", le jeu envoie parfois vers l auberge au lieu de la boutique.`

Exemple mauvais:

`Le shop bug.`

Regle:

- une phrase pour l etat,
- une phrase pour l action,
- une phrase pour l erreur.

---

## 4. Pipeline de traitement

## Etape 0 - Preflight

Avant toute analyse:

1. `npm run dev`
2. `npx tsc --noEmit`
3. `npm run lint`
4. `npm run qa:solo`

But:

- verifier si le bug existe encore,
- verifier si le projet est deja casse ailleurs,
- partir d une base propre techniquement.

## Etape 1 - Reproduction manuelle

Pour chaque bug:

1. noter l etat exact du joueur
2. noter l action exacte
3. noter le resultat reel
4. noter si le bug est deterministe ou non

Etat minimum a capturer:

- position joueur
- chunk courant
- PV / vies / or / stress
- inventaire utile
- quetes
- PNJ / ennemis proches si necessaire
- texte exact tape

Exemple:

```md
Etat:
- position: 24,25
- chunk: 1,1
- or: 10
- inventaire: Torche x1
- quete guilde: non terminee

Action:
- "j achete potion de soin"

Observe:
- le jeu ouvre une logique de repos / auberge
```

## Etape 2 - Classer le bug

Choisir une seule categorie principale:

- `systemic`: logique pure, resolver, state mutation, economie, quetes
- `map`: tiles, collisions, POI, decors, pathfinding
- `ui`: labels, HUD, journal, overlays, feedback
- `animation`: fluidite, facing, mort, transitions
- `content`: texte, dialogues, labels, docs

Ce classement decide quel test ajouter.

## Etape 3 - Ajouter un test de verification

### Si le bug est systemique

Ajouter un scenario dans:

[solo-bug-hunt.ts](/c:/Users/Daiki/Desktop/Rollplay/scripts/solo-bug-hunt.ts)

Format recommande:

```ts
{
  id: "nom_du_bug",
  actionText: "...",
  setup: (state) => { ... },
  check: ({ initial, outcome, next }) => {
    const out: Finding[] = [];
    // assertions
    return out;
  },
}
```

### Si le bug est map/pathfinding

Ajouter si possible:

- un audit statique dans `auditWorldLayout`, `auditBiomeConsistency`, `auditRouteBatch`
- ou un scenario de trajet cible

### Si le bug est UI pur

Le bug-hunt ne suffit pas.

Il faut ajouter:

- une fiche manuelle,
- une checklist de verification visuelle,
- des lignes precises a verifier dans le runtime.

Format recommande:

```md
Checklist UI:
- label visible
- overlap absent
- animation lisible
- feedback texte coherent
- comportement mobile acceptable
```

## Etape 4 - Fix minimal et localise

Regles:

- corriger la cause, pas juste masquer le symptome
- eviter les hardcodes si un contrat commun suffit
- ne pas melanger correction et refonte globale si le bug est critique
- garder le correctif testable

Question a se poser avant commit:

`Est-ce que cette correction change seulement le comportement concerne, ou est-ce qu elle ouvre un risque lateral ?`

## Etape 5 - Revalidation

Apres correction:

1. rejouer la reproduction manuelle
2. relancer les verifications techniques
3. verifier qu aucun effet de bord evident n apparait

Commande minimale:

```powershell
npx tsc --noEmit
npm run lint
npm run qa:solo
```

Si le bug touche le rendu ou l UX:

1. `npm run dev`
2. rejouer la scene
3. verifier la checklist visuelle

## Etape 6 - Cloture

Un bug est `verified` seulement si:

- la reproduction originale ne casse plus
- le test ajoute passe
- les checks globaux passent
- aucun effet de bord majeur n est observe

Un bug est `closed` seulement si:

- la fiche est mise a jour
- la liste priorisee est mise a jour
- le test reste dans la suite

---

## 5. Quoi tester selon le type de bug

## A. Gameplay / Resolver / State

Tester:

- `action -> outcome -> next state`
- or / hp / inventory / quests
- refus explicites
- absence de mutation illegale

Commandes:

```powershell
npm run qa:solo
npx tsc --noEmit
npm run lint
```

## B. Map / Collision / Pathfinding

Tester:

- reachability des POI
- collisions
- changement de chunk
- placement PNJ
- coherence biome / props / decors

Commandes:

```powershell
npm run qa:solo
npm run dev
```

Checks manuels:

- aller a la boutique
- aller a la guilde
- aller au donjon
- aller au boss
- se deplacer le long des bords des chunks

## C. UI / UX

Tester:

- lisibilite immediate
- labels
- overlays
- hierarchie de texte
- feedback action
- coherence journal / objectif / panneau contextuel

Commandes:

```powershell
npm run dev
npx tsc --noEmit
npm run lint
```

Checklist minimale:

- pas de texte coupe
- pas de bouton inatteignable
- pas de panel bloque
- pas d overlay impossible a fermer
- info importante visible sans fouiller le log

## D. Save / Load

Tester:

- sauvegarde locale apres plusieurs tours
- reload
- coherence position / inventaire / quetes / logs

## E. Animation / Feedback

Tester:

- mouvement lisible
- pas de freeze
- orientation stable
- animation de mort visible
- evenement majeur bien mis en scene

---

## 6. Checklists de verification rapides

## Smoke global

```md
- boot ok
- setup solo ok
- map visible
- input actif
- boutique ok
- guilde ok
- combat ok
- mort / respawn ok
- save / load ok
```

## Smoke map

```md
- routes lisibles
- POI labels visibles
- chunks traversables
- maisons coherentes
- PNJ bien places
- decors non bloques de facon absurde
```

## Smoke UX

```md
- objectif comprehensible
- intention comprise visible
- suggestions utiles
- log lisible
- evenement majeur bien visible
```

---

## 7. Commandes de travail recommandee

## Boucle rapide

```powershell
npm run qa:solo
npx tsc --noEmit
npm run lint
```

## Boucle gameplay complete

```powershell
npm run dev
```

Puis:

1. ouvrir `http://localhost:3000`
2. rejouer le bug
3. verifier la checklist correspondante

## Rendu / inspection manuelle

Quand le bug est purement visuel, noter:

- capture avant
- capture apres
- ce qui a change
- ce qui reste incorrect

---

## 8. Regles pour ne pas reintroduire les bugs

1. tout bug systemique corrige doit avoir un scenario `qa:solo` si possible
2. tout bug map doit avoir au moins un audit ou un trajet verifie
3. tout bug UI doit avoir une checklist de verification manuelle
4. ne jamais corriger sans reproduction claire
5. ne jamais fermer un bug sur impression seulement

---

## 9. Definition of Done d un correctif

Un correctif est acceptable si:

- le bug initial est reproduit puis elimine
- un test ou une verification explicite existe
- `npx tsc --noEmit` passe
- `npm run lint` passe
- `npm run qa:solo` passe
- le comportement adjacent critique a ete verifie

---

## 10. Pipeline ideal par session

Ordre de travail recommande:

1. lister les bugs du jour
2. choisir 1 a 3 bugs max
3. ecrire la fiche de chaque bug
4. ajouter ou preparer le test de verification
5. reproduire
6. corriger
7. relancer `tsc`, `lint`, `qa:solo`
8. rejouer manuellement si visuel/gameplay
9. marquer `verified`
10. passer au bug suivant

Ce rythme evite:

- les fixes flous,
- les regressions silencieuses,
- les sessions ou beaucoup de code change mais aucun bug n est vraiment clos.
