# Oracle20 - Pipeline de Test V1 Solo Isekai

Date: 2026-03-16  
But: verifier la demo de bout en bout, sans zones grises.

## 1) Preflight
1. Lancer `npm install`
2. Lancer `npm run dev`
3. Ouvrir `http://localhost:3000`
4. Verifier console navigateur:
- aucune erreur bloquante au chargement
- pas de boucle "initialisation" infinie

## 2) Menu Start
1. Entrer un pseudo
2. Cliquer `Jeu solo`
3. Verifier:
- navigation vers `/solo`
- `Creer room` et `Rejoindre room` visibles mais desactives

## 3) Setup Solo
1. Choisir un sprite
2. Saisir un pouvoir (>= 3 chars)
3. Lancer D20 initial
4. Lancer la partie
5. Verifier:
- navigation vers `/game`
- HUD present
- map visible
- input action actif

## 4) Boucle Action + D20
1. Taper `je me deplace au nord`
2. Taper `j avance d un ecran vers l est`
3. Verifier:
- animation D20 visible
- logs `TOI`, `MJ`, `SYSTEM`
- deplacement reel sur map
- slide entre ecrans quand changement de chunk

## 5) Deplacements cibles
1. Taper `je vais a la boutique`
2. Verifier:
- perso se deplace reellement vers le shop
- panneau shop visible
3. Taper `je vais a la maison`
4. Verifier:
- si non precisee: refus explicite
5. Taper `je vais a la maison la plus proche`
6. Verifier:
- deplacement vers un POI maison

## 6) Shop interactif
1. Se placer proche shop
2. Cliquer un item dans le panneau
3. Verifier:
- action envoyee
- or diminue
- item ajoute inventaire
- animation loot visible

## 7) Guilde interactive
1. Se placer proche guilde
2. Cliquer une quete dans le panneau guilde
3. Verifier:
- progression/etat de quete mis a jour
- rang joueur visible (`C/B/A/S`)

## 8) Combat
1. Taper `j attaque le monstre`
2. Verifier:
- sequence combat visible
- PV cibles/joueur changes
- mort possible + drop + or

## 9) Maison / Donjon / Boss visual mode
1. Aller sur POI maison
2. Verifier:
- rendu map change (mode interieur)
3. Aller vers donjon
4. Verifier:
- rendu map mode donjon
5. Lancer combat
6. Verifier:
- scene combat distincte

## 10) Mort, Respawn, Fin
1. Prendre des degats jusqu a 0 PV
2. Verifier:
- perte de vie
- respawn camp
- perte inventaire/or appliquee
3. Epuiser toutes les vies
4. Verifier:
- overlay `Game Over`

## 11) Save / Load
1. Jouer 2-3 actions
2. Recharger la page
3. Verifier:
- etat conserve (position, inventaire, quetes, logs)

## 12) Resilience IA
1. Couper `GROQ_API_KEY` (ou simuler indisponibilite)
2. Rejouer 5 actions
3. Verifier:
- fallback local fonctionne
- aucune action ne bloque la partie

## 13) Perf rapide
1. Faire 100 actions courtes
2. Verifier:
- input reste reactif
- FPS map stable
- pas de freeze long

## 14) Definition de validation V1
V1 est validee si:
1. menu -> setup -> game marche sans blocage
2. D20 visible et coherent
3. deplacements libres + POI cibles fonctionnent
4. shop/guilde cliquables et impactent l etat
5. combat/mort/respawn/fin fonctionnent
6. map reste lisible et coherente visuellement
7. sauvegarde/reprise stables
8. fallback IA operationnel

