import { hydrateSoloState } from "./runtime";
import type { SoloGameState } from "./types";

const globalKey = "__oracle20_solo_sessions__";

type SessionMap = Map<string, SoloGameState>;

function getStore(): SessionMap {
  const globalState = globalThis as typeof globalThis & { [globalKey]?: SessionMap };
  if (!globalState[globalKey]) {
    globalState[globalKey] = new Map<string, SoloGameState>();
  }
  return globalState[globalKey]!;
}

function cloneState(state: SoloGameState): SoloGameState {
  return hydrateSoloState(JSON.parse(JSON.stringify(state)) as SoloGameState);
}

export function createSoloSession(state: SoloGameState): SoloGameState {
  const sessionId = `solo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const sessionState = cloneState({
    ...state,
    serverSessionId: sessionId,
  });
  getStore().set(sessionId, sessionState);
  return cloneState(sessionState);
}

export function getSoloSession(sessionId: string | null | undefined): SoloGameState | null {
  if (!sessionId) return null;
  const found = getStore().get(sessionId);
  return found ? cloneState(found) : null;
}

export function putSoloSession(state: SoloGameState): SoloGameState {
  const sessionId = state.serverSessionId;
  if (!sessionId) return cloneState(state);
  const next = cloneState(state);
  getStore().set(sessionId, next);
  return cloneState(next);
}
