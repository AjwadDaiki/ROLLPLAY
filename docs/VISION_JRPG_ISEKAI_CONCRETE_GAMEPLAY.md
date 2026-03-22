# Vision Concrete - JRPG Sandbox ISEKAI (version marquee)

## 1) Cible produit (non negociable)
Le jeu doit donner cette sensation:
- "Je peux tenter presque n importe quoi."
- "Le monde reagit vraiment."
- "Mes choix changent ma run."

Formule cible:
**Liberte forte + lisibilite immediate + consequences visibles + progression motivante + surprises coherentes.**

Le mode ISEKAI est la vitrine:
- il doit impressionner dans les 5 premieres minutes,
- il doit produire des histoires racontables,
- il doit rester comprenable sans lire une doc externe.

---

## 2) Analyse reelle: RPG/JRPG qui fonctionnent + attentes joueurs

## A. Ce qui rend les grands RPG/JRPG efficaces
### Boucle claire
- Exploration -> decision -> resolution -> consequence -> nouvelle opportunite.
- Le joueur sait toujours quoi faire ensuite.

### Regles stables
- Peu de surprises arbitraires.
- La profondeur vient des combinaisons, pas du flou.

### Feedback fort
- Toute action importante est vue, entendue, comprise.
- Les bons jeux evitent les "succes invisibles".

### Progression lisible
- Le joueur sent qu il devient meilleur.
- Nouvelles options = nouveau plaisir, pas surcharge.

## B. Ce que les joueurs aiment vraiment
- Sentiment de controle.
- Choix qui comptent.
- Monde reactif.
- Moments uniques a raconter.

## C. Ce qui fait abandonner
- UI confuse.
- Resultats incomprehensibles.
- Actions sans impact reel.
- Monde fige qui ne se souvient pas.

## D. Conclusion actionnable
1. Pas d action morte.
2. Pas de victoire sans effet visible.
3. Pas de consequence majeure sans explication claire.
4. Pas de complexite inutile sans gain de fun.

---

## 3) Loop gameplay concrete

## Boucle 30-90 secondes
1. Deplacement vers cible.
2. Action rapide ou action libre.
3. Resolution (stats + roll + contexte).
4. Impact visible (map, PNJ, ressources, reputation).
5. Nouveau choix immediat.

## Boucle 5-15 minutes
- Objectif local (combat, commerce, diplomatie, infiltration).
- Incident dynamique.
- Decision couteuse.
- Changement persistant local.

## Boucle 45-120 minutes
- Au moins 1 zone change d etat.
- Au moins 2 relations PNJ evoluent fortement.
- Au moins 1 souvenir de run "incroyable mais logique".

---

## 4) Systeme "aucune partie identique"

## Moteurs de variation
1. Seed de run (humeurs factions, stocks, tensions, meteo sociale).
2. Memoire du monde (crimes, aides, dettes, trahisons, exploits).
3. Evenements contextuels (raids, rumeurs, crises, opportunites).
4. PNJ imparfaits (hesitation, peur, ego, panique, opportunisme).
5. Cascades multi-systemes (social + economie + acces + map).

## Regle anti-chaos
- La variation est forte, mais toujours expliquee par:
  - contexte,
  - personnalites,
  - ressources,
  - historique.

---

## 5) Scenes gameplay concretes (base)

## Scene 1 - Combat hybride lisible
- Joueur entre en combat dedie contre un demon.
- Tour 1: defense classique.
- Tour 2: action libre "sable dans les yeux".
- Tour 3: attaque de precision sur ouverture.
- Fin: loot + reputation locale + danger de zone ajuste.

## Scene 2 - Negociation a enjeu
- Marchand en penurie.
- Joueur propose un contrat de protection.
- Prix baissent temporairement, mais dette active.

## Scene 3 - Detournement de quete
- Au lieu de chercher une cle, joueur casse une cloison fragile.
- Quete validee autrement.
- Taxe de reparation + garde mefiant.

## Scene 4 - Action opportuniste
- Joueur attire des monstres vers une patrouille.
- Combat evite.
- Reputation "manipulateur" monte.

## Scene 5 - Choix moral
- Sauver un PNJ cle ou proteger un depot de vivres.
- Les deux options ont une perte visible.

---

## 6) Refonte combat (concrete)

## Interface combat
- Haut: ennemi, PV, statuts, intention probable.
- Centre: timeline initiative.
- Bas gauche: actions classiques.
- Bas droite: action libre + estimation de risque.
- Panneau optionnel "Pourquoi?" (cause du resultat).

## Regles
- 1 action principale par tour.
- Actions libres = potentiel plus fort + risque plus fort.
- Resultats possibles:
  - reussite,
  - reussite partielle,
  - echec utile,
  - echec critique.

## Sortie de combat
- Resume court:
  - degats,
  - statuts,
  - gains/pertes,
  - impact monde.

---

## 7) Refonte deplacement (concrete)
- Vitesse uniforme par case.
- Maintien touche = cadence fixe, pas acceleration cumulative.
- Pas de diagonales involontaires.
- Preview de chemin a la souris.
- Animation synchronisee au vrai mouvement (idle/walk/turn).
- Priorite interaction correcte (entite avant decor).

---

## 8) Refonte map et level design

## Grammaire zones
- Village: social et services.
- Foret: ressources et embuscades.
- Dunes: zones ouvertes a risques.
- Donjon: tension, couloirs, alternatives.

## Regles map
- Aucun sprite sans raison.
- Aucun batiment casse ou incoherent.
- Aucun doublon de porte.
- Chemins lisibles.
- POI visibles sans surcharge.

---

## 9) PNJ et vie du monde
- Chaque PNJ a role, routine, lieu principal, relations.
- Reactions visibles:
  - mouvement,
  - bulle courte,
  - changement d attitude.
- Le monde "vit sans le joueur":
  - prix,
  - patrouilles,
  - tensions locales evoluent.

---

## 10) Interface finale (design reel)

## Ecran monde
- Haut compact: PV, stress, stats cles, objectif, reputation resumee.
- Centre: map large prioritaire.
- Droite: narration + historique + impacts.
- Bas: saisie libre + actions contextuelles.

## Ecran interaction
- Pop-up clair:
  - actions rapides,
  - champ libre,
  - risques/gains estimes.

## Ecran combat
- transition forte,
- commandes evidentes,
- causalite lisible.

---

## 11) Liberte + impact des choix

## Contrat impact visible
Chaque action significative touche au moins 1 bloc:
- terrain/map,
- relation PNJ,
- reputation faction,
- economie locale,
- acces/permissions,
- etat combat.

## Contrat impact persistant
Apres sauvegarde/reload, restent:
- crimes,
- destructions,
- alliances,
- prix negocies,
- etats de zones.

---

## 12) Grain de folie: WTF controle

## Mecanique signature: Resonance ISEKAI
- Certaines actions libres a haut risque activent une "resonance".
- Effets:
  - bonus creatif temporaire,
  - cout reel (stress, dette, hostilite, rumeur).
- But:
  - moments "wtf mais logique",
  - sans casser les regles du monde.

---

## 13) Idees fortes qui differencient le jeu
1. Serment d origine ISEKAI (choix initial qui deforme toutes les interactions).
2. Chronique vivante (les 5 decisions majeures de la run).
3. Systeme de dette/faveur visible (anti abus, roleplay fort).
4. Territoires sensibles (tolerance differente a violence/vol).
5. Boss social adaptatif (reagit a ta reputation, pas seulement a ton niveau).

---

## 14) Refonte priorisee (production)

## Phase 1 - Clarte jouable
- Stabiliser deplacement + combat lisible.
- UI impact immediate.
- Eliminer succes sans effet.

## Phase 2 - Monde vivant
- Routines PNJ.
- Reactions sociales/economiques.
- Cohesion map stricte.

## Phase 3 - Jeu marquant
- Resonance ISEKAI.
- Cascades robustes.
- Moments "racontables" frequents.

---

## 15) Critere final
Le jeu est reussi si:
- les joueurs racontent des runs differentes,
- les choix sont visibles et memorables,
- la liberte reste comprenable,
- le jeu donne envie de relancer une nouvelle partie.

---

## 16) Situations signatures (20 cas concrets)

### 1. Mediation de marche
- Action joueur: "J arbitre le conflit entre deux marchands."
- Ce qui se passe: l un accepte une truce, l autre boude.
- Consequences: prix stables 1 jour, relation rivale ouverte.
- Interet: gain global, conflit futur plante.

### 2. Mensonge de securite
- Action joueur: faux signal d attaque.
- Ce qui se passe: milice deplacee.
- Consequences: zone vide exploitable, confiance milice baisse.
- Interet: outil tactique a cout social.

### 3. Escorte heroique
- Action joueur: escorter caravane.
- Ce qui se passe: route securisee.
- Consequences: stock ville +, bandits ciblent le joueur ensuite.
- Interet: victoire immediate, risque reporte.

### 4. Vol discret avec temoin
- Action joueur: voler comptoir.
- Ce qui se passe: pas d arrestation immediate.
- Consequences: plainte differree, piege legal plus tard.
- Interet: tension long terme.

### 5. Duel legal
- Action joueur: defier un rival en duel public.
- Ce qui se passe: combat encadre, temoins nombreux.
- Consequences: si victoire, statut +; si defaite, prestige -.
- Interet: conflit dramatique mais lisible.

### 6. Racket inverse
- Action joueur: "Je protege ton atelier contre prime hebdo."
- Ce qui se passe: accord force.
- Consequences: revenu passif +, reputation morale -.
- Interet: economie sale emergente.

### 7. Mur brise pour quete
- Action joueur: casser acces secondaire.
- Ce qui se passe: quete avance.
- Consequences: cout de reparation public + acces shortcut.
- Interet: solution creative avec trace durable.

### 8. Piege au feu
- Action joueur: huile + torche en couloir.
- Ce qui se passe: ennemis repousses.
- Consequences: couloir bloque pour tout le monde.
- Interet: avantage tactique et contrainte retour.

### 9. Detournement de milice
- Action joueur: signaler une fausse piste.
- Ce qui se passe: patrouille quitte quartier.
- Consequences: crimes locaux +, quartier te soupconne.
- Interet: manipulation systemique.

### 10. Sauvetage d enfant PNJ
- Action joueur: interposer pendant raid.
- Ce qui se passe: PNJ survit.
- Consequences: famille alliee, faction adverse rancuniere.
- Interet: lien emotionnel + gameplay.

### 11. Corruption d entree
- Action joueur: soudoyer garde frontiere.
- Ce qui se passe: passage ouvre.
- Consequences: dossier de chantage contre toi.
- Interet: succes fragile.

### 12. Chantage de guilde
- Action joueur: reveler secret interne.
- Ce qui se passe: faveur immediate.
- Consequences: guilde ferme quetes premium.
- Interet: court terme fort, long terme dur.

### 13. Blindage improvise
- Action joueur: demonter caisse pour fabriquer bouclier.
- Ce qui se passe: defense + en combat.
- Consequences: commerce ralentit.
- Interet: craft opportuniste avec impact local.

### 14. Recrutement d un bandit
- Action joueur: recruter ancien hostile.
- Ce qui se passe: allié combat puissant.
- Consequences: habitants mefiants, checkpoints +.
- Interet: force vs acceptation sociale.

### 15. Dette d auberge
- Action joueur: repos sans payer.
- Ce qui se passe: service accorde.
- Consequences: dette visible, refus futur si non reglee.
- Interet: anti spam elegant.

### 16. Pont provisoire
- Action joueur: poser caisses pour traverser.
- Ce qui se passe: nouvel axe.
- Consequences: monstres utilisent aussi ce pont.
- Interet: le monde reutilise tes solutions.

### 17. Intimidation ratee
- Action joueur: menacer chef de bande.
- Ce qui se passe: echec social.
- Consequences: chef sous-estime joueur (ouverture combat).
- Interet: echec utile.

### 18. Crime "propre"
- Action joueur: assassinat sans bruit.
- Ce qui se passe: pas d alerte immediate.
- Consequences: enquete lente + prime monte plus tard.
- Interet: suspense au lieu de punition instant.

### 19. Soin en chaos
- Action joueur: soigner neutre en bataille.
- Ce qui se passe: neutre rejoint temporairement.
- Consequences: dette de faction.
- Interet: support devient levier diplomatique.

### 20. Sacrifice conscient
- Action joueur: perdre equipement rare pour sauver quartier.
- Ce qui se passe: crise evitee.
- Consequences: titre heroique + faiblesse combat temporaire.
- Interet: choix memorable, cout reel.

---

## 17) WTF coherent (10 situations)

1. Tu lances ta bourse pour distraire un mini-boss: il perd 1 tour, mais les voleurs te ciblent ensuite.
2. Tu cries "controle sanitaire": la taverne se vide, un pickpocket lache une preuve.
3. Tu menaces un demon avec un contrat legal: il accepte duel public au lieu d embuscade.
4. Tu enterres une relique: un PNJ la trouve et devient antagoniste local.
5. Tu invites deux rivaux a negocier: ils cassent un cartel, prix chutent en ville.
6. Tu simules une blessure: medecin aide, puis te denonce pour fraude.
7. Tu poses trop de torches: quartier plus lisible, mais panique "pyromane".
8. Tu offres un os de monstre a un enfant: panique de rue, milice patrouille.
9. Tu recrutes un monstre faible: les monstres elites changent d aggro.
10. Tu rates un vol mais la cible croit a un "signe": elle ferme boutique une nuit.

Regle:
- Surprenant oui, arbitraire non.

---

## 18) Chaines de consequences (10 cascades)

1. Vol boutique -> temoin parle -> milice hostile -> taxe punitive -> acces guilde limite.
2. Sauvetage caravane -> stock + -> prix potions - -> raids bandits + -> quete defense ouverte.
3. Mur casse -> quete validee -> circulation change -> plaintes habitants -> patrouilles detournees.
4. Pacte monstre -> combats - -> suspicion milice + -> controles + -> retards quetes.
5. Incendie tactique -> ennemi vaincu -> fumee attire renforts -> quartier evacue -> commerce stop.
6. Don massif -> soutien religieux + -> bandits ciblent joueur riche -> embuscades route nord +.
7. Mensonge politique -> rival ecarte -> vide pouvoir -> corruption locale + -> prix "protection" +.
8. Recrutement deserter -> puissance + -> dossier judiciaire actif -> checkpoints hostiles.
9. Protection PNJ cle -> relation + -> quete unique + -> faction adverse lance rumeur.
10. Refus d aide crise -> pertes ville -> economie - -> rarete ressources -> craft meta change.

---

## 19) 5 runs tres differentes

## Run Diplomate
- Comportement: parle, arbitre, evite conflits.
- Monde: stable, alliances fortes, peu d embuscades.
- Signature: progression sociale, acces premium.

## Run Manipulateur
- Comportement: mensonge, chantage, detournement.
- Monde: instable, gains rapides, confiance fragile.
- Signature: grosses ouvertures ponctuelles, retours de baton.

## Run Violent
- Comportement: force brute, elimination directe.
- Monde: peur + repression + primes.
- Signature: gear rapide, ville durcie contre toi.

## Run Opportuniste
- Comportement: profite des crises, choisit le meilleur gain court terme.
- Monde: economie volatile, factions mefiantes.
- Signature: richesse forte mais reseau faible.

## Run Hybride tactique
- Comportement: alterne social, combat, ruse selon contexte.
- Monde: reactions complexes mais maitrisables.
- Signature: run la plus flexible et "pro".

---

## 20) 15 moments racontables (anecdotes)

1. "J ai rate une intimidation, mais le boss m a sous-estime et j ai gagne."
2. "J ai sauve un marchand, son rival m a declare une guerre de prix."
3. "J ai casse un mur pour finir une quete et la ville utilise encore ce passage."
4. "Mon vol a ete puni 20 minutes plus tard, pas sur le moment."
5. "J ai recrute un monstre faible et toute l aggro de zone a change."
6. "J ai obtenu un rabais, puis une crise l a annule dans la meme run."
7. "J ai refuse d aider un raid, le village ne m a plus jamais fait confiance."
8. "J ai gagne un combat au feu, puis j ai bloque ma propre fuite."
9. "J ai protege un enfant et j ai debloque une arme unique."
10. "J ai menti a la foule, j ai gagne du temps mais perdu ma credibilite."
11. "J ai soudoye un garde, il m a vendu puis denonce."
12. "J ai enterre un objet rare, un PNJ l a transforme en probleme majeur."
13. "Mon echec social est devenu ma meilleure ouverture tactique."
14. "J ai cree un pont, les ennemis l ont pris pour me contourner."
15. "Un acte heroique a rendu le boss plus agressif contre moi."

---

## 21) Impact visuel renforce (spec concrete)

## Reputation
- Barres par faction (Village, Guilde, Milice, Monstres, Demon Army).
- Variation animee immediate (+/- avec couleur).
- Etat textuel clair: respecte / mefiant / chasse.

## Relations PNJ
- Badge au-dessus du PNJ:
  - allie,
  - neutre,
  - mefiant,
  - hostile.
- Changement de posture visible:
  - recule,
  - suit,
  - bloque,
  - appelle aide.

## Map
- Batiments: ouvert / ferme / alerte / endommage.
- Routes: sure / risque / coupee.
- Traces persistantes: feu, debris, barricades, trous, autels, tags faction.

## Objets et equipements
- Arme equipee visible sur sprite.
- Gros objet porte/traine visible.
- Objet "vole" avec marquage visuel discret (contour).

## Feedback consequence
- Carte result action (2 secondes):
  - ce qui a reussi,
  - ce qui a coute,
  - ce qui a change.
- Panneau "Pourquoi?" en detail optionnel.

---

## 22) Monde qui se transforme vraiment

## Village (4 etats)
1. Stable: commerce normal, patrouille legere.
2. Sous tension: controles +, prix +5%.
3. Crise: couvre-feu partiel, quetes bloquees.
4. Redressement: reconstruction, bonus civiques, nouvelles dettes politiques.

## Foret (3 etats)
1. Calme: ressources abondantes.
2. Predation: embuscades +, sentiers fermes.
3. Purgee: monstres -, loot rare +.

## Dunes (3 etats)
1. Caravane active.
2. Pillage frequent.
3. Milice mobile lourde.

## Donjon (3 etats)
1. Tension normale.
2. Alerte: pieges + coordination ennemie.
3. Brise: raccourcis ouverts, elites deplacees.

## Factions evolutives
- Milice: protectrice -> autoritaire.
- Guilde: ouverte -> selective.
- Marchands: concurrents -> cartelises.

---

## 23) Scenes gameplay supplementaires (ressenti direct)

## Scene Exploration
- Tu observes une place en debat.
- Tu choisis de calmer ou d envenimer.
- L etat social du quartier change immediatement.

## Scene Interaction
- Tu cliques un PNJ loin.
- Le perso s approche auto.
- Le popup propose presets + texte libre.
- Le resultat s affiche en bulle + log causal.

## Scene Combat
- Un hostile te coupe la route.
- Transition propre.
- Tu tentes une action libre risky.
- Reussite partielle: avantage + cout visible.

## Scene Fuite
- Tu abandonnes un combat.
- Tu t echappes mais la faction adverse garde la rancune.
- Embuscade possible plus tard.

## Scene Manipulation
- Tu deplaces une patrouille via fausse alerte.
- Tu obtiens une fenetre d infiltration.
- Le quartier paie le prix de ton choix.

## Scene Consequence immediate
- Tu negocies un prix.
- UI boutique mise a jour instant.
- Timer de duree de remise visible.

---

## 24) Garde-fous de coherence (important)
- Pas de random gratuit.
- Chaque surprise a une cause.
- Chaque consequence majeure est visible.
- Cascades bornees pour rester lisibles.
- 3 impacts principaux affiches, details en option.

Resultat vise:
**Un jeu libre, clair, vivant, surprenant, et racontable.**
