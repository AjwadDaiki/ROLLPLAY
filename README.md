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
- API de session: `POST /api/solo/start`
- API d action: `POST /api/solo/action`
- endpoint brut legacy du resolver: `POST /api/solo/resolve`
- fallback local si pas de cle LLM

## Variables d environnement
Voir [`.env.example`](/c:/Users/Daiki/Desktop/Rollplay/.env.example).

## Documentation canonique
- [PROJECT_GUIDE.md](/c:/Users/Daiki/Desktop/Rollplay/docs/PROJECT_GUIDE.md)  
  vue produit + gameplay + regles
- [ENGINE_SPEC.md](/c:/Users/Daiki/Desktop/Rollplay/docs/ENGINE_SPEC.md)  
  architecture technique, types, protocoles, moteur cible
- [ROADMAP_QA.md](/c:/Users/Daiki/Desktop/Rollplay/docs/ROADMAP_QA.md)  
  phases implementation, couverture actions, checklist QA

## Arborescence code utile
- `app/page.tsx` menu
- `app/solo/page.tsx` setup
- `app/game/GameClient.tsx` runtime client
- `app/api/solo/start/route.ts` creation de partie
- `app/api/solo/action/route.ts` pipeline runtime principal
- `app/api/solo/resolve/route.ts` endpoint brut du resolver
- `lib/solo/types.ts` modeles
- `lib/solo/world.ts` generation monde
- `lib/solo/logic.ts` application outcome
- `lib/solo/resolve.ts` orchestration IA
