# DOCS_CONVENTION

Regles de structure et de nommage pour garder la documentation utile et maintenable.

## 1) Structure racine `docs/`
- Uniquement des fichiers `.md` actifs.
- Dossiers racine autorises: `archive/`, `sources/`.
- `archive/` = historique.
- `sources/` = sources brutes (non canoniques).

## 2) Nommage
- `README.md` est accepte.
- Sinon format obligatoire: `UPPER_SNAKE_CASE.md`.

## 3) Source de verite
- Les docs actives a la racine sont canoniques.
- Les docs dans `archive/` ne servent que d historique.
- Les fichiers de `sources/` ne doivent pas etre cites comme spec officielle.

## 4) Archive
- Sous-dossiers autorises dans `docs/archive/`: `generalization/`, `audits/`, `legacy/`, `map/`.

## 5) Validation automatique
- Commande : `npm run docs:check`
- Le check verifie:
- fichiers requis presents
- nommage conforme
- absence de fichiers non autorises
- structure archive conforme

## 6) Workflow conseille
1. Ajouter/modifier une doc active en racine.
2. Deplacer les docs obsoletes vers `docs/archive/<categorie>/`.
3. Lancer `npm run docs:check`.
4. Commit uniquement si le check passe.
