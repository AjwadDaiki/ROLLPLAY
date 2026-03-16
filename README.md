# FREEROLL - Oracle20

RPG solo top-down pilote par IA (action libre + D20).

## Demarrage
```bash
npm install
npm run dev
```
Ouvrir `http://localhost:3000`.

## Etat produit (v1)
- mode solo jouable
- scenario Isekai actif
- map monde `48x48` (chunk visible `16x16`)
- API MJ: `POST /api/solo/resolve`
- fallback local si pas de cle LLM

## Variables d environnement
Voir [`.env.example`](/c:/Users/daiki/Desktop/FREEROLL/.env.example).

## Documentation canonique
- [PROJECT_GUIDE.md](/c:/Users/daiki/Desktop/FREEROLL/docs/PROJECT_GUIDE.md)  
  vue produit + gameplay + regles
- [ENGINE_SPEC.md](/c:/Users/daiki/Desktop/FREEROLL/docs/ENGINE_SPEC.md)  
  architecture technique, types, protocoles, moteur cible
- [ROADMAP_QA.md](/c:/Users/daiki/Desktop/FREEROLL/docs/ROADMAP_QA.md)  
  phases implementation, couverture actions, checklist QA

## Arborescence code utile
- `app/page.tsx` menu
- `app/solo/page.tsx` setup
- `app/game/GameClient.tsx` runtime client
- `app/api/solo/resolve/route.ts` endpoint MJ
- `lib/solo/types.ts` modeles
- `lib/solo/world.ts` generation monde
- `lib/solo/logic.ts` application outcome
- `lib/solo/resolve.ts` orchestration IA
