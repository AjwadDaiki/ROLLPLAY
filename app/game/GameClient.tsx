"use client";

/* eslint-disable @next/next/no-img-element */

import { type CSSProperties, type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  findEntityAtTile,
  findPathToEntity,
  findPathToTile,
  findWorldEntityByRef,
  getEdgeEntitiesForChunk,
  type WorldEntity,
} from "@/lib/solo/interaction";
import { applyFreeMoveStep, applyOutcome, buildActionContext, buildStoryLine, describeLocation } from "@/lib/solo/logic";
import { getShopDiscountPercent, getShopPrice, SHOP_CATALOG } from "@/lib/solo/shop";
import { buildRepeatSignature, hydrateSoloState as hydrateSharedState, isSoloState as isSharedSoloState } from "@/lib/solo/runtime";
import {
  getDecorLayers,
  getPropLayers,
  getTerrainOverlayLayers,
  MAP_BASE_ASSETS,
  type MapAssetKey,
  pickTerrainFrame,
} from "@/lib/solo/mapArt";
import type {
  InventoryItem,
  PlayerInteractionRequest,
  PoiType,
  SoloGameState,
  SoloOutcome,
  SpeechBubbleEvent,
  WorldActor,
  WorldPoint,
} from "@/lib/solo/types";
import { CHUNK_SIZE } from "@/lib/solo/types";
import {
  actorsInChunk,
  chunkOf,
  createInitialSoloState,
  enforceWorldCoherence,
  getDecorsForChunk,
  getMapStructures,
  getPoiNodesForChunk,
  screenLabel,
  tilesForChunk,
  UI_ASSETS,
  WORLD_LAYOUT_VERSION,
} from "@/lib/solo/world";
import styles from "./GameClient.module.css";

const TILE_PX = 30;
const MAP_PX = CHUNK_SIZE * TILE_PX;
const SAVE_DEBOUNCE_MS = 320;
const SLIDE_MS = 220;
const REQUEST_TIMEOUT_MS = 9000;

const BASE_ASSETS = {
  ...MAP_BASE_ASSETS,
  dialogInfo: UI_ASSETS.dialogInfo,
  heart: UI_ASSETS.heart,
  gold: UI_ASSETS.gold,
  stress: UI_ASSETS.stress,
  strength: UI_ASSETS.strength,
};

type TransitionState = {
  from: { cx: number; cy: number };
  to: { cx: number; cy: number };
  start: number;
  duration: number;
};

type SpeechBubbleState = {
  id: string;
  sourceRef: string;
  speaker?: string | null;
  text: string;
  kind: "speech" | "thought" | "action" | "system";
  expiresAt: number;
};

type LootFx = {
  icon: string;
  name: string;
  startedAt: number;
};

type BattleFx = {
  enemyName: string;
  enemySprite: string;
  startedAt: number;
  durationMs: number;
  commandLabel: string;
  roll: number | null;
  playerWeight: number;
  enemyWeight: number;
  winner: "player" | "enemy";
  spinDeg: number;
  playerStats: {
    power: number;
    combat: number;
    stress: number;
    hp: number;
    hpAfter: number;
    maxHp: number;
  };
  enemyStats: {
    power: number;
    combat: number;
    stress: number;
    hp: number;
    hpAfter: number;
    maxHp: number;
  };
  playerDamageTaken: number;
  enemyDamageTaken: number;
};

type Facing = "up" | "down" | "left" | "right";

type WanderState = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  facing: Facing;
  nextDirectionAt: number;
  nextMoveAt: number;
  moving?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    startAt: number;
    endAt: number;
  };
};

type PlayerRenderState = {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  moveStartAt: number;
  moveEndAt: number;
  facing: Facing;
};

type SceneMode = "world" | "dungeon" | "boss";

type ContextPanel = "shop" | "guild" | null;

type GoldFx = {
  delta: number;
  startedAt: number;
};

type DamageFx = {
  delta: number;
  startedAt: number;
  sourceName?: string | null;
};

type TrailEntry = {
  x: number;
  y: number;
  chunkKey: string;
  startedAt: number;
};

type MajorEventTone = "danger" | "arcane" | "reward" | "victory";

type MajorEventCard = {
  id: string;
  title: string;
  body: string;
  tone: MajorEventTone;
};

type DeathFx = {
  id: string;
  x: number;
  y: number;
  chunkKey: string;
  startedAt: number;
  hostile: boolean;
  name: string;
};

type ObjectiveLens = {
  primary: string;
  step: string;
  suggestion: string;
  targetPoi: Exclude<PoiType, null> | null;
};

type HoverState = {
  tile: { x: number; y: number };
  entity: WorldEntity | null;
  path: WorldPoint[];
  reachable: boolean;
};

type InteractionDialogState = {
  target: WorldEntity;
  prompt: string;
  showInfo: boolean;
};

type ControlPreset = "zqsd" | "wasd";
type InteractionHotkey = "enter" | "e";
type MoveDirection = "up" | "down" | "left" | "right";

const HELD_MOVE_INTERVAL_MS = 138;

function keyToDirection(
  key: string,
  keyMap: Record<MoveDirection, Set<string>>
): MoveDirection | null {
  if (keyMap.up.has(key)) return "up";
  if (keyMap.down.has(key)) return "down";
  if (keyMap.left.has(key)) return "left";
  if (keyMap.right.has(key)) return "right";
  return null;
}

function directionDelta(direction: MoveDirection): { dx: number; dy: number } {
  if (direction === "up") return { dx: 0, dy: -1 };
  if (direction === "down") return { dx: 0, dy: 1 };
  if (direction === "left") return { dx: -1, dy: 0 };
  return { dx: 1, dy: 0 };
}

function directionPrompt(direction: MoveDirection): string {
  if (direction === "up") return "Tu montes d une case.";
  if (direction === "down") return "Tu descends d une case.";
  if (direction === "left") return "Tu vas d une case vers la gauche.";
  return "Tu vas d une case vers la droite.";
}

function findNearestInteractionTarget(current: SoloGameState): WorldEntity | null {
  const candidates = new Map<string, { entity: WorldEntity; distance: number; priority: number }>();
  const priorityForKind = (kind: WorldEntity["kind"]): number => {
    if (kind === "actor") return 0;
    if (kind === "structure") return 1;
    if (kind === "prop") return 2;
    if (kind === "poi") return 3;
    return 4;
  };

  for (let dy = -3; dy <= 3; dy += 1) {
    for (let dx = -3; dx <= 3; dx += 1) {
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance === 0 || distance > 3) continue;
      const entity = findEntityAtTile(current, current.player.x + dx, current.player.y + dy);
      if (!entity) continue;
      if (entity.kind === "tile" || entity.kind === "edge") continue;
      if (!entity.modes.some((mode) => mode !== "move")) continue;
      const priority = priorityForKind(entity.kind);
      const existing = candidates.get(entity.ref);
      if (!existing || distance < existing.distance || (distance === existing.distance && priority < existing.priority)) {
        candidates.set(entity.ref, { entity, distance, priority });
      }
    }
  }

  return Array.from(candidates.values())
    .sort((a, b) => a.distance - b.distance || a.priority - b.priority || a.entity.name.localeCompare(b.entity.name))[0]
    ?.entity ?? null;
}

function isShopEntity(target: WorldEntity | null): boolean {
  return !!target && (
    (target.kind === "structure" && target.poi === "shop") ||
    (target.kind === "actor" && target.actorId === "npc_shopkeeper")
  );
}

function isGuildEntity(target: WorldEntity | null): boolean {
  return !!target && (
    (target.kind === "structure" && target.poi === "guild") ||
    (target.kind === "actor" && target.actorId === "npc_guild_master")
  );
}

function defaultPromptForTarget(target: WorldEntity): string {
  if (target.kind === "actor") {
    if (isShopEntity(target)) return "je veux acheter";
    if (isGuildEntity(target)) return "je demande une quete";
    if (target.modes.includes("talk")) return `je parle a ${target.name}`;
    if (target.modes.includes("attack")) return `j attaque ${target.name}`;
    return `j observe ${target.name}`;
  }
  if (target.kind === "structure") {
    return target.poi === "shop"
      ? "je veux acheter"
      : target.poi === "guild"
        ? "je demande une quete"
        : `j interagis avec ${target.name}`;
  }
  if (target.kind === "prop") {
    return target.prop === "tree" ? "je coupe cet arbre" : `j interagis avec ${target.name}`;
  }
  return `j observe ${target.name}`;
}

export default function GameClient() {
  const router = useRouter();
  const params = useSearchParams();

  const playerName = (params.get("name") || "Aventurier").slice(0, 20);
  const scenario = params.get("scenario") || "isekai";
  const powerText = (params.get("power") || "").trim();
  const powerRoll = parseNumber(params.get("roll"), 10);
  const powerAccepted = params.get("accepted") === "1";
  const characterId = params.get("character") || undefined;
  const runId = (params.get("run") || "default").slice(0, 32);

  const saveKey = useMemo(
    () => `freeroll_solo_save_${WORLD_LAYOUT_VERSION}_${slugify(playerName)}_${slugify(runId)}`,
    [playerName, runId]
  );

  const [state, setState] = useState<SoloGameState | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [movementBusy, setMovementBusy] = useState(false);
  const [actionText, setActionText] = useState("");
  const [lastDice, setLastDice] = useState<number | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubbleState[]>([]);
  const [lootFx, setLootFx] = useState<LootFx | null>(null);
  const [battleFx, setBattleFx] = useState<BattleFx | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [activePanel, setActivePanel] = useState<"log" | "inventory">("log");
  const [contextPanel, setContextPanel] = useState<ContextPanel>(null);
  const [goldFx, setGoldFx] = useState<GoldFx | null>(null);
  const [damageFx, setDamageFx] = useState<DamageFx | null>(null);
  const [pinnedActorId, setPinnedActorId] = useState<string | null>(null);
  const [intentSummary, setIntentSummary] = useState("Explore le village ou parle a un PNJ.");
  const [majorEvent, setMajorEvent] = useState<MajorEventCard | null>(null);
  const [focusedPoi, setFocusedPoi] = useState<Exclude<PoiType, null> | null>(null);
  const [deathFx, setDeathFx] = useState<DeathFx[]>([]);
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const [interactionDialog, setInteractionDialog] = useState<InteractionDialogState | null>(null);
  const [controlPreset, setControlPreset] = useState<ControlPreset>("zqsd");
  const [interactionHotkey, setInteractionHotkey] = useState<InteractionHotkey>("enter");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const diceTimerRef = useRef<number | null>(null);
  const contextPanelTimerRef = useRef<number | null>(null);
  const previousChunkRef = useRef<{ cx: number; cy: number } | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const wanderRef = useRef<Map<string, WanderState>>(new Map());
  const playerRenderRef = useRef<PlayerRenderState | null>(null);
  const trailRef = useRef<TrailEntry[]>([]);
  const previousPlayerTileRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const focusPoiTimerRef = useRef<number | null>(null);
  const submitActionRef = useRef<((override?: string, interactionOverride?: PlayerInteractionRequest | null) => Promise<void>) | null>(null);
  const movementTimerRef = useRef<number | null>(null);
  const heldDirectionsRef = useRef<MoveDirection[]>([]);
  const heldMoveTimerRef = useRef<number | null>(null);
  const stateRef = useRef<SoloGameState | null>(null);
  const busyRef = useRef(false);
  const movementBusyRef = useRef(false);
  const interactionDialogRef = useRef<InteractionDialogState | null>(null);
  const settingsOpenRef = useRef(false);

  useEffect(() => {
    setBootError(null);
    const fromStorage = loadFromStorage(saveKey);
    if (fromStorage) {
      setState(fromStorage);
      return;
    }

    if (!powerText || powerText.length < 3) {
      setBootError("Configuration solo absente. Retourne a la preparation.");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/solo/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName,
            powerText,
            powerRoll,
            powerAccepted,
            characterId,
          }),
        });
        const data = (await response.json()) as { ok?: boolean; state?: SoloGameState };
        if (!cancelled && data.ok && data.state) {
          setState(hydrateState(data.state));
          return;
        }
      } catch {
        // fallback local below
      }

      if (cancelled) return;
      const initial = createInitialSoloState({
        playerName,
        powerText,
        powerRoll,
        powerAccepted,
        characterId,
      });
      setState(initial);
    })();

    return () => {
      cancelled = true;
    };
  }, [characterId, playerName, powerAccepted, powerRoll, powerText, saveKey]);

  useEffect(() => {
    if (!state) return;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(saveKey, JSON.stringify(state));
      } catch {
        // ignore storage errors
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveKey, state]);

  useEffect(() => {
    if (!state) return;
    const chunk = chunkOf(state.player.x, state.player.y);
    const previous = previousChunkRef.current;
    if (
      previous &&
      (previous.cx !== chunk.cx || previous.cy !== chunk.cy) &&
      Math.abs(previous.cx - chunk.cx) + Math.abs(previous.cy - chunk.cy) === 1
    ) {
      setTransition({
        from: previous,
        to: chunk,
        start: performance.now(),
        duration: SLIDE_MS,
      });
    }
    previousChunkRef.current = chunk;
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const now = performance.now();
    const prev = playerRenderRef.current;
    if (!prev) {
      playerRenderRef.current = {
        x: state.player.x,
        y: state.player.y,
        fromX: state.player.x,
        fromY: state.player.y,
        moveStartAt: now,
        moveEndAt: now,
        facing: "down",
      };
      return;
    }

    const currentPose = getPlayerRenderPose(prev, now, prev.x, prev.y);
    const originX = prev.moveEndAt > now ? currentPose.x : prev.x;
    const originY = prev.moveEndAt > now ? currentPose.y : prev.y;
    const dx = state.player.x - originX;
    const dy = state.player.y - originY;
    let facing = prev.facing;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
      facing = dx > 0 ? "right" : "left";
    } else if (dy !== 0) {
      facing = dy > 0 ? "down" : "up";
    }

    const movedTiles = Math.abs(state.player.x - prev.x) + Math.abs(state.player.y - prev.y);
    const animateMove = movedTiles > 0 && movedTiles <= 20;
    const moveDuration = animateMove ? clamp(105 + movedTiles * 18, 105, 280) : 0;
    playerRenderRef.current = {
      x: state.player.x,
      y: state.player.y,
      fromX: animateMove ? originX : state.player.x,
      fromY: animateMove ? originY : state.player.y,
      moveStartAt: now,
      moveEndAt: animateMove ? now + moveDuration : now,
      facing,
    };
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const { cx, cy } = chunkOf(state.player.x, state.player.y);
    const previous = previousPlayerTileRef.current;

    if (!previous || previous.cx !== cx || previous.cy !== cy) {
      trailRef.current = [
        {
          x: state.player.x,
          y: state.player.y,
          chunkKey: `${cx}_${cy}`,
          startedAt: Date.now(),
        },
      ];
    } else if (previous.x !== state.player.x || previous.y !== state.player.y) {
      trailRef.current = [
        ...trailRef.current.filter((entry) => entry.chunkKey === `${cx}_${cy}`),
        {
          x: state.player.x,
          y: state.player.y,
          chunkKey: `${cx}_${cy}`,
          startedAt: Date.now(),
        },
      ].slice(-20);
    }

    previousPlayerTileRef.current = {
      x: state.player.x,
      y: state.player.y,
      cx,
      cy,
    };
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const paths = new Set<string>(Object.values(BASE_ASSETS));
    paths.add(state.player.characterIdle);
    paths.add(state.player.characterWalk);
    paths.add(state.player.characterFace);
    state.actors.forEach((actor) => {
      paths.add(actor.sprite);
      paths.add(actor.face);
    });
    if (state.player.equippedItemSprite) {
      paths.add(state.player.equippedItemSprite);
    }

    let cancelled = false;
    void preloadImages(Array.from(paths), imageCacheRef.current).then(() => {
      if (!cancelled) setAssetsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [state]);

  useEffect(() => {
    if (!state || !assetsReady || !canvasRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const drawFrame = (now: number) => {
      if (!state) return;

      const currentChunk = chunkOf(state.player.x, state.player.y);
      const sceneMode = resolveSceneMode(state);
      const worldPaused = busy || movementBusy || diceRolling || !!battleFx;
      const previewPath = hovered?.path ?? [];
      const hoveredRef = hovered?.entity?.ref ?? null;
      const chunkEdges = getEdgeEntitiesForChunk(state, currentChunk.cx, currentChunk.cy);
      ctx.clearRect(0, 0, MAP_PX, MAP_PX);

      if (battleFx) {
        drawBattleScene(ctx, state, battleFx, now, imageCacheRef.current);
        rafRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      if (transition) {
        const elapsed = now - transition.start;
        const progress = clamp(elapsed / transition.duration, 0, 1);
        const eased = easeInOut(progress);
        const dx = transition.to.cx - transition.from.cx;
        const dy = transition.to.cy - transition.from.cy;
        const travelX = dx * MAP_PX;
        const travelY = dy * MAP_PX;
        const shiftX = travelX * eased;
        const shiftY = travelY * eased;

        drawChunkScene(
          ctx,
          state,
          transition.from.cx,
          transition.from.cy,
          -shiftX,
          -shiftY,
          now,
          speechBubbles,
          imageCacheRef.current,
          wanderRef.current,
          playerRenderRef.current,
          sceneMode,
          worldPaused,
          pinnedActorId,
          trailRef.current,
          focusedPoi,
          deathFx,
          damageFx,
          previewPath,
          hoveredRef,
          chunkEdges
        );
        drawChunkScene(
          ctx,
          state,
          transition.to.cx,
          transition.to.cy,
          travelX - shiftX,
          travelY - shiftY,
          now,
          speechBubbles,
          imageCacheRef.current,
          wanderRef.current,
          playerRenderRef.current,
          sceneMode,
          worldPaused,
          pinnedActorId,
          trailRef.current,
          focusedPoi,
          deathFx,
          damageFx,
          previewPath,
          hoveredRef,
          chunkEdges
        );

        if (progress >= 1) {
          setTransition(null);
        }
      } else {
        drawChunkScene(
          ctx,
          state,
          currentChunk.cx,
          currentChunk.cy,
          0,
          0,
          now,
          speechBubbles,
          imageCacheRef.current,
          wanderRef.current,
          playerRenderRef.current,
          sceneMode,
          worldPaused,
          pinnedActorId,
          trailRef.current,
          focusedPoi,
          deathFx,
          damageFx,
          previewPath,
          hoveredRef,
          chunkEdges
        );
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [assetsReady, battleFx, busy, damageFx, deathFx, diceRolling, focusedPoi, hovered, movementBusy, pinnedActorId, speechBubbles, state, transition]);

  useEffect(() => {
    if (!state || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [busy, state]);

  useEffect(() => {
    if (speechBubbles.length === 0) return;
    const timer = window.setTimeout(() => {
      setSpeechBubbles((prev) => prev.filter((entry) => entry.expiresAt > Date.now()));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [speechBubbles]);

  useEffect(() => {
    if (!lootFx) return;
    const timer = window.setTimeout(() => setLootFx(null), 1550);
    return () => window.clearTimeout(timer);
  }, [lootFx]);

  useEffect(() => {
    if (!battleFx) return;
    const timer = window.setTimeout(() => setBattleFx(null), battleFx.durationMs);
    return () => window.clearTimeout(timer);
  }, [battleFx]);

  useEffect(() => {
    if (!goldFx) return;
    const timer = window.setTimeout(() => setGoldFx(null), 1100);
    return () => window.clearTimeout(timer);
  }, [goldFx]);

  useEffect(() => {
    if (!damageFx) return;
    const timer = window.setTimeout(() => setDamageFx(null), 960);
    return () => window.clearTimeout(timer);
  }, [damageFx]);

  useEffect(() => {
    if (!majorEvent) return;
    const timer = window.setTimeout(() => setMajorEvent(null), 3600);
    return () => window.clearTimeout(timer);
  }, [majorEvent]);

  useEffect(() => {
    if (deathFx.length === 0) return;
    const timer = window.setTimeout(() => {
      setDeathFx((prev) => prev.filter((entry) => Date.now() - entry.startedAt < 900));
    }, 920);
    return () => window.clearTimeout(timer);
  }, [deathFx]);

  useEffect(() => {
    return () => {
      if (diceTimerRef.current !== null) {
        window.clearInterval(diceTimerRef.current);
      }
      if (contextPanelTimerRef.current !== null) {
        window.clearTimeout(contextPanelTimerRef.current);
      }
      if (focusPoiTimerRef.current !== null) {
        window.clearTimeout(focusPoiTimerRef.current);
      }
      if (movementTimerRef.current !== null) {
        window.clearTimeout(movementTimerRef.current);
      }
      if (heldMoveTimerRef.current !== null) {
        window.clearTimeout(heldMoveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    movementBusyRef.current = movementBusy;
  }, [movementBusy]);

  useEffect(() => {
    interactionDialogRef.current = interactionDialog;
  }, [interactionDialog]);

  useEffect(() => {
    settingsOpenRef.current = settingsOpen;
  }, [settingsOpen]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("freeroll_controls_v1");
      if (saved === "zqsd" || saved === "wasd") {
        setControlPreset(saved);
      }
      const savedInteractionKey = window.localStorage.getItem("freeroll_interaction_key_v1");
      if (savedInteractionKey === "enter" || savedInteractionKey === "e") {
        setInteractionHotkey(savedInteractionKey);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("freeroll_controls_v1", controlPreset);
      window.localStorage.setItem("freeroll_interaction_key_v1", interactionHotkey);
    } catch {
      // ignore
    }
  }, [controlPreset, interactionHotkey]);

  const currentChunk = useMemo(() => {
    if (!state) return { cx: 1, cy: 1 };
    return chunkOf(state.player.x, state.player.y);
  }, [state]);

  const screenName = state ? screenLabel(currentChunk.cx, currentChunk.cy) : "-";
  const location = state ? describeLocation(state) : "-";
  const statusLine =
    state?.status === "victory"
      ? "Victoire"
      : state?.status === "defeat"
        ? "Game Over"
        : movementBusy
          ? "Deplacement"
        : busy
          ? "Resolution IA en cours..."
          : "Ton tour";

  const nearShop = state ? hasPoiNearby(state, "shop", 1) : false;
  const nearGuild = state ? hasPoiNearby(state, "guild", 1) : false;
  const rank = state ? state.player.rank || computeRankFromQuests(state) : "C";
  const objectiveLens = state ? deriveObjectiveLens(state) : null;
  const actionSuggestions = state && objectiveLens ? buildActionSuggestions(state, objectiveLens) : [];
  const hpPercent = state ? clamp((state.player.hp / Math.max(1, state.player.maxHp)) * 100, 0, 100) : 0;
  const stressPercent = state ? clamp((state.player.stress / 100) * 100, 0, 100) : 0;
  const equippedLabel = state?.player.equippedItemName ?? "Mains nues";
  const edgeEntities = state ? getEdgeEntitiesForChunk(state, currentChunk.cx, currentChunk.cy) : [];
  const controlLabel = controlPreset === "zqsd" ? "ZQSD + fleches" : "WASD + fleches";
  const interactionHotkeyLabel = interactionHotkey === "enter" ? "Entree" : "E";

  useEffect(() => {
    if (contextPanel === "shop" && !nearShop) {
      setContextPanel(null);
      return;
    }
    if (contextPanel === "guild" && !nearGuild) {
      setContextPanel(null);
    }
  }, [contextPanel, nearGuild, nearShop]);

  useEffect(() => {
    const keyMap =
      controlPreset === "zqsd"
        ? {
            up: new Set(["z", "w", "arrowup"]),
            down: new Set(["s", "arrowdown"]),
            left: new Set(["q", "a", "arrowleft"]),
            right: new Set(["d", "arrowright"]),
          }
        : {
            up: new Set(["w", "z", "arrowup"]),
            down: new Set(["s", "arrowdown"]),
            left: new Set(["a", "q", "arrowleft"]),
            right: new Set(["d", "arrowright"]),
          };

    const interactionKeys = interactionHotkey === "e" ? new Set(["e"]) : new Set(["enter"]);

    const canUseWorldHotkeys = (): boolean => {
      if (busyRef.current || movementBusyRef.current || interactionDialogRef.current || settingsOpenRef.current) return false;
      const current = stateRef.current;
      return !!current && current.status === "playing";
    };

    const clearHeldMoveTimer = (): void => {
      if (heldMoveTimerRef.current !== null) {
        window.clearTimeout(heldMoveTimerRef.current);
        heldMoveTimerRef.current = null;
      }
    };

    const performHeldDirectionStep = (direction: MoveDirection): void => {
      const current = stateRef.current;
      if (!current || current.status !== "playing") return;
      const delta = directionDelta(direction);
      const step = {
        x: current.player.x + delta.dx,
        y: current.player.y + delta.dy,
      };
      let moved = false;
      let damageTaken = 0;
      setState((prev) => {
        if (!prev) return prev;
        const next = applyFreeMoveStep(prev, step);
        moved = next.player.x !== prev.player.x || next.player.y !== prev.player.y;
        damageTaken = Math.max(0, prev.player.hp - next.player.hp);
        return next;
      });
      if (!moved) return;
      setIntentSummary(directionPrompt(direction));
      setPinnedActorId(null);
      setContextPanel(null);
      setInteractionDialog(null);
      if (damageTaken > 0) {
        pushPlayerDamageFx(damageTaken);
      }
    };

    const openNearestInteractionDialog = (): void => {
      const current = stateRef.current;
      if (!current || current.status !== "playing") return;
      const target = findNearestInteractionTarget(current);
      if (!target) {
        setIntentSummary("Aucune entite interactive assez proche.");
        return;
      }
      setInteractionDialog({
        target,
        prompt: defaultPromptForTarget(target),
        showInfo: false,
      });
      setIntentSummary(`${target.name} est pret pour une interaction.`);
    };

    const scheduleHeldMoveLoop = (): void => {
      clearHeldMoveTimer();
      heldMoveTimerRef.current = window.setTimeout(() => {
        heldMoveTimerRef.current = null;
        const direction = heldDirectionsRef.current[heldDirectionsRef.current.length - 1] ?? null;
        if (!direction) return;
        if (canUseWorldHotkeys()) {
          performHeldDirectionStep(direction);
        }
        if (heldDirectionsRef.current.length > 0) {
          scheduleHeldMoveLoop();
        }
      }, HELD_MOVE_INTERVAL_MS);
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || active?.isContentEditable) {
        return;
      }

      const key = event.key.toLowerCase();
      if (interactionKeys.has(key)) {
        event.preventDefault();
        if (canUseWorldHotkeys()) {
          openNearestInteractionDialog();
        }
        return;
      }

      const direction = keyToDirection(key, keyMap);
      if (!direction) return;
      event.preventDefault();

      heldDirectionsRef.current = [...heldDirectionsRef.current.filter((entry) => entry !== direction), direction];
      if (heldDirectionsRef.current.length === 1 && canUseWorldHotkeys()) {
        performHeldDirectionStep(direction);
      }
      if (heldMoveTimerRef.current === null) {
        scheduleHeldMoveLoop();
      }
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      const direction = keyToDirection(event.key.toLowerCase(), keyMap);
      if (!direction) return;
      heldDirectionsRef.current = heldDirectionsRef.current.filter((entry) => entry !== direction);
      if (heldDirectionsRef.current.length === 0) {
        clearHeldMoveTimer();
      }
    };

    const onBlur = (): void => {
      heldDirectionsRef.current = [];
      clearHeldMoveTimer();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      heldDirectionsRef.current = [];
      clearHeldMoveTimer();
    };
  }, [controlPreset, interactionHotkey]);

  function startDiceAnimation(): void {
    if (diceTimerRef.current !== null) {
      window.clearInterval(diceTimerRef.current);
    }
    setDiceRolling(true);
    setLastDice(1 + Math.floor(Math.random() * 20));
    diceTimerRef.current = window.setInterval(() => {
      setLastDice(1 + Math.floor(Math.random() * 20));
    }, 65);
  }

  async function stopDiceAnimation(finalRoll: number | null): Promise<void> {
    if (finalRoll === null) {
      if (diceTimerRef.current !== null) {
        window.clearInterval(diceTimerRef.current);
        diceTimerRef.current = null;
      }
      setDiceRolling(false);
      setLastDice(null);
      return;
    }

    await wait(420);
    if (diceTimerRef.current !== null) {
      window.clearInterval(diceTimerRef.current);
      diceTimerRef.current = null;
    }
    setDiceRolling(false);
    setLastDice(finalRoll);
  }

  function focusPoi(poi: Exclude<PoiType, null> | null): void {
    if (!poi) return;
    if (state) {
      const hint = describePoiDirection(state, poi);
      if (hint) {
        setIntentSummary(`${poiDisplayName(poi)}: ${hint}`);
      }
    }
    setFocusedPoi(poi);
    if (focusPoiTimerRef.current !== null) {
      window.clearTimeout(focusPoiTimerRef.current);
    }
    focusPoiTimerRef.current = window.setTimeout(() => {
      setFocusedPoi(null);
      focusPoiTimerRef.current = null;
    }, 2200);
  }

  function pushSpeechBubbleEvents(events: SpeechBubbleEvent[]): void {
    if (events.length === 0) return;
    const now = Date.now();
    setSpeechBubbles((prev) => [
      ...prev.filter((entry) => entry.expiresAt > now),
      ...events.map((entry, index) => ({
        id: entry.id ?? `${entry.sourceRef}_${now}_${index}`,
        sourceRef: entry.sourceRef,
        speaker: entry.speaker ?? null,
        text: entry.text,
        kind: entry.kind ?? "speech",
        expiresAt: now + Math.max(1200, entry.ttlMs ?? 2400),
      })),
    ].slice(-14));
  }

  function pushPlayerSpeechBubble(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    pushSpeechBubbleEvents([
      {
        sourceRef: "player:self",
        speaker: state?.player.name ?? playerName,
        text: trimmed.slice(0, 110),
        kind: "speech",
        ttlMs: 2200,
      },
    ]);
  }

  function pushPlayerDamageFx(delta: number, sourceName?: string | null): void {
    if (delta <= 0) return;
    setDamageFx({
      delta,
      startedAt: Date.now(),
      sourceName: sourceName ?? null,
    });
  }

  function clearMovementTimer(): void {
    if (movementTimerRef.current !== null) {
      window.clearTimeout(movementTimerRef.current);
      movementTimerRef.current = null;
    }
  }

  function runCodeMovement(path: WorldPoint[], narration: string, onComplete?: () => void): void {
    const sanitizedPath = path.filter(
      (step): step is WorldPoint =>
        !!step && Number.isFinite(step.x) && Number.isFinite(step.y)
    );
    if (sanitizedPath.length === 0) {
      onComplete?.();
      return;
    }
    clearMovementTimer();
    setMovementBusy(true);
    setIntentSummary("Deplacement manuel sur le chemin previsualise.");
    setPinnedActorId(null);
    setContextPanel(null);
    setInteractionDialog(null);
    let stepIndex = 0;

    const tick = (): void => {
      const currentStep = sanitizedPath[stepIndex];
      if (!currentStep) {
        movementTimerRef.current = null;
        setMovementBusy(false);
        return;
      }
      let shouldContinue = true;
      let damageTaken = 0;
      setState((prev) => {
        if (!prev) return prev;
        if (prev.status !== "playing") {
          shouldContinue = false;
          return prev;
        }
        const next = applyFreeMoveStep(prev, currentStep);
        next.lastAction = "Deplacement";
        next.lastNarration = narration;
        damageTaken = Math.max(0, prev.player.hp - next.player.hp);
        if (next.status !== "playing") {
          shouldContinue = false;
        }
        return next;
      });

      if (damageTaken > 0) {
        pushPlayerDamageFx(damageTaken);
      }

      stepIndex += 1;
      if (!shouldContinue || stepIndex >= sanitizedPath.length) {
        movementTimerRef.current = null;
        setMovementBusy(false);
        if (shouldContinue && stepIndex >= sanitizedPath.length && onComplete) {
          window.setTimeout(onComplete, 48);
        }
        return;
      }
      movementTimerRef.current = window.setTimeout(tick, 170);
    };

    tick();
  }

  function resolveMovementPath(interaction: PlayerInteractionRequest): WorldPoint[] {
    if (!state) return [];
    if (interaction.targetRef) {
      const target = findWorldEntityByRef(state, interaction.targetRef);
      return target ? findPathToEntity(state, target, { maxSteps: 320 }) ?? [] : [];
    }
    if (interaction.targetTile) {
      return findPathToTile(state, interaction.targetTile.x, interaction.targetTile.y, { maxSteps: 320 }) ?? [];
    }
    return [];
  }

  function buildInteractionRequest(
    text: string,
    interactionOverride?: PlayerInteractionRequest | null
  ): PlayerInteractionRequest {
    const base: PlayerInteractionRequest = interactionOverride
      ? { ...interactionOverride }
      : { type: "context", source: "text" };
    return {
      ...base,
      actionText: text,
      freeText: text,
      primaryTargetRef: base.primaryTargetRef ?? base.targetRef ?? null,
      source: base.source ?? "text",
      repeatSignature: base.repeatSignature?.trim() || buildRepeatSignature(text, base),
    };
  }

  function shouldAnimateDice(text: string, interaction: PlayerInteractionRequest): boolean {
    const normalized = normalizeText(text);
    if (interaction.type === "move" || interaction.type === "inspect") return false;
    if (
      interaction.type === "context" &&
      /(achete|acheter|buy|vends|vendre|stock|catalogue|boutique|guilde|quete|rang)/.test(normalized) &&
      !/(negocie|prix|baisse|rabais|vole|voler|attaque|menace|pouvoir|sort)/.test(normalized)
    ) {
      return false;
    }
    if (interaction.type === "talk" && !/(prix|baisse|rabais|recrute|attaque|menace)/.test(normalizeText(text))) {
      return false;
    }
    return true;
  }

  async function submitAction(
    override?: string,
    interactionOverride?: PlayerInteractionRequest | null
  ): Promise<void> {
    if (!state || busy || movementBusy || state.status !== "playing") return;
    const text = (override ?? actionText).trim();
    if (!text) return;
    const normalizedText = normalizeText(text);
    const safeInteraction = buildInteractionRequest(text, interactionOverride);
    setIntentSummary(describeTypedIntent(state, text, safeInteraction));

    if (safeInteraction.type === "move") {
      const path = resolveMovementPath(safeInteraction);
      if (path.length === 0) {
        setIntentSummary("Aucun chemin valable vers cette destination.");
        return;
      }
      setActionText("");
      runCodeMovement(path, safeInteraction.targetRef ? `Tu te rapproches de la cible.` : "Tu avances.");
      return;
    }

    setBusy(true);
    setActionText("");
    if (shouldAnimateDice(text, safeInteraction)) {
      startDiceAnimation();
    } else {
      setLastDice(null);
      setDiceRolling(false);
    }
    if (safeInteraction.source !== "text") {
      pushPlayerSpeechBubble(text);
    }

    const storyline = buildStoryLine(state.player.name, text);
    const optimistic: SoloGameState = {
      ...state,
      log: [...state.log, `TOI: ${text}`],
      lastAction: storyline,
    };
    const pinnedCandidate = findMoveTargetActor(optimistic, normalizedText);
    if (safeInteraction.targetRef?.startsWith("actor:")) {
      const actorId = safeInteraction.targetRef.slice("actor:".length);
      const actor = optimistic.actors.find((entry) => entry.id === actorId);
      if (actor) {
        setPinnedActorId(actor.id);
      }
    }
    if (pinnedCandidate) {
      setPinnedActorId(pinnedCandidate.id);
    }
    setState(optimistic);

    try {
      const context = buildActionContext(optimistic, safeInteraction);
      const enemyBefore = nearestVisibleHostile(optimistic, 3);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch("/api/solo/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionText: text, state: optimistic, context, interaction: safeInteraction }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }

      const data = (await response.json()) as { ok?: boolean; outcome?: SoloOutcome; state?: SoloGameState };
      const outcome = data.outcome ?? {
        narrative: "Le maitre du jeu hesite un instant.",
        storyLine: storyline,
        diceRoll: null,
      };

      const next =
        data.ok && data.state && isSoloState(data.state)
          ? hydrateState(data.state)
          : applyOutcome(optimistic, outcome, safeInteraction);
      await stopDiceAnimation(typeof outcome.diceRoll === "number" ? outcome.diceRoll : null);
      setState(next);
      setIntentSummary(describeResolvedIntent(text, outcome, next, safeInteraction));

      const deltaGold = next.player.gold - optimistic.player.gold;
      if (deltaGold !== 0) {
        setGoldFx({
          delta: deltaGold,
          startedAt: Date.now(),
        });
      }

      const playerDamageTaken = Math.max(0, optimistic.player.hp - next.player.hp);
      if (playerDamageTaken > 0) {
        pushPlayerDamageFx(playerDamageTaken);
      }

      if (contextPanelTimerRef.current !== null) {
        window.clearTimeout(contextPanelTimerRef.current);
        contextPanelTimerRef.current = null;
      }

      const gainedItem = findGainedItem(optimistic.player.inventory, next.player.inventory);
      if (gainedItem) {
        setLootFx({
          icon: gainedItem.icon,
          name: gainedItem.name,
          startedAt: Date.now(),
        });
      }

      const deaths = findNewlyDeadActors(optimistic, next);
      if (deaths.length > 0) {
        const startedAt = Date.now();
        setDeathFx((prev) => [
          ...prev,
          ...deaths.map((actor, index) => ({
            id: `${actor.id}_${next.turn}_${index}`,
            x: actor.x,
            y: actor.y,
            chunkKey: `${chunkOf(actor.x, actor.y).cx}_${chunkOf(actor.x, actor.y).cy}`,
            startedAt,
            hostile: actor.hostile,
            name: actor.name,
          })),
        ].slice(-10));
      }

      const eventCard = detectMajorEventCard(optimistic, next, outcome, text);
      if (eventCard) {
        setMajorEvent(eventCard);
      }

      const enemyBeforeById =
        outcome.attackActorId
          ? optimistic.actors.find((entry) => entry.id === outcome.attackActorId && entry.alive) ?? null
          : enemyBefore;
      const enemyAfterById =
        outcome.attackActorId
          ? next.actors.find((entry) => entry.id === outcome.attackActorId) ?? null
          : outcome.attackNearestHostile && enemyBefore
            ? next.actors.find((entry) => entry.id === enemyBefore.id) ?? null
            : null;
      const enemyAfter = outcome.attackNearestHostile ? nearestVisibleHostile(next, 4) : enemyAfterById;
      const enemyForFx = enemyBeforeById ?? enemyAfter;
      if ((outcome.attackNearestHostile || outcome.attackActorId) && enemyForFx) {
        const wheel = buildBattleWheelFx(
          optimistic,
          next,
          enemyForFx,
          enemyBeforeById,
          enemyAfterById,
          outcome.attackPower ?? 10,
          typeof outcome.diceRoll === "number" ? outcome.diceRoll : null,
          deriveBattleCommandLabel(text)
        );
        setBattleFx({
          enemyName: enemyForFx.name,
          enemySprite: enemyForFx.sprite,
          startedAt: Date.now(),
          durationMs: 2550,
          ...wheel,
        });
      }

      setPinnedActorId((prev) => {
        const active = pinnedCandidate?.id ?? prev;
        if (!active) return null;
        const actor = next.actors.find((entry) => entry.id === active && entry.alive);
        if (!actor) return null;
        if (manhattan(actor.x, actor.y, next.player.x, next.player.y) <= 1) return null;
        return active;
      });

      if (outcome.talkToNearestNpc && outcome.npcSpeech) {
        const nearNpc = next.actors
          .filter((actor) => actor.alive && !actor.hostile)
          .map((actor) => ({
            actor,
            distance: Math.abs(actor.x - next.player.x) + Math.abs(actor.y - next.player.y),
          }))
          .sort((a, b) => a.distance - b.distance)[0];

        if (nearNpc) {
          pushSpeechBubbleEvents([
            {
              sourceRef: `actor:${nearNpc.actor.id}`,
              speaker: nearNpc.actor.name,
              text: outcome.npcSpeech,
              kind: "speech",
              ttlMs: 2400,
            },
          ]);
        }
      }
      if (outcome.speechBubbles && outcome.speechBubbles.length > 0) {
        pushSpeechBubbleEvents(outcome.speechBubbles);
      }
    } catch {
      await stopDiceAnimation(null);
      const fallbackOutcome: SoloOutcome = {
        narrative: "Erreur reseau temporaire. Reessaie.",
        storyLine: storyline,
        diceRoll: null,
      };
      const fallback = applyOutcome(optimistic, fallbackOutcome, safeInteraction);
      setState(fallback);
      setIntentSummary(describeResolvedIntent(text, fallbackOutcome, fallback, safeInteraction));
    } finally {
      setBusy(false);
    }
  }
  submitActionRef.current = submitAction;

  function equipItem(itemId: string): void {
    if (!state) return;
    const picked = state.player.inventory.find((entry) => entry.id === itemId);
    if (!picked) return;
    if (!picked.sprite) return;
    setState((prev) => {
      if (!prev) return prev;
      const next: SoloGameState = {
        ...prev,
        player: {
          ...prev.player,
          equippedItemId: picked.id,
          equippedItemName: picked.name,
          equippedItemSprite: picked.sprite,
        },
        log: [...prev.log, `SYSTEM: ${picked.name} equipe.`],
      };
      return next;
    });
  }

  function unequipItem(): void {
    setState((prev) => {
      if (!prev) return prev;
      if (!prev.player.equippedItemId) return prev;
      return {
        ...prev,
        player: {
          ...prev.player,
          equippedItemId: null,
          equippedItemName: null,
          equippedItemSprite: null,
        },
        log: [...prev.log, "SYSTEM: Equipement retire."],
      };
    });
  }

  function restartRun(): void {
    window.localStorage.removeItem(saveKey);
    if (!powerText || powerText.length < 3) {
      router.push(`/solo?name=${encodeURIComponent(playerName)}`);
      return;
    }

    const fresh = createInitialSoloState({
      playerName,
      powerText,
      powerRoll,
      powerAccepted,
      characterId,
    });
    setState(fresh);
    if (diceTimerRef.current !== null) {
      window.clearInterval(diceTimerRef.current);
      diceTimerRef.current = null;
    }
    setDiceRolling(false);
    setLastDice(null);
    setActionText("");
    setSpeechBubbles([]);
    setLootFx(null);
    setBattleFx(null);
    setGoldFx(null);
    setContextPanel(null);
    setTransition(null);
    setPinnedActorId(null);
    setHovered(null);
    setInteractionDialog(null);
    setSettingsOpen(false);
    clearMovementTimer();
    setMovementBusy(false);
    wanderRef.current.clear();
  }

  function resolveCanvasTile(clientX: number, clientY: number): {
    localX: number;
    localY: number;
    worldX: number;
    worldY: number;
  } | null {
    const canvas = canvasRef.current;
    if (!canvas || !state) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    const localX = clamp(Math.floor(px / TILE_PX), 0, CHUNK_SIZE - 1);
    const localY = clamp(Math.floor(py / TILE_PX), 0, CHUNK_SIZE - 1);
    return {
      localX,
      localY,
      worldX: currentChunk.cx * CHUNK_SIZE + localX,
      worldY: currentChunk.cy * CHUNK_SIZE + localY,
    };
  }

  function edgeEntityForLocalTile(localX: number, localY: number): WorldEntity | null {
    if (!state) return null;
    if (localY === 0) {
      return edgeEntities.find((entry) => entry.ref === `edge:north:${currentChunk.cx},${currentChunk.cy}`) ?? null;
    }
    if (localY === CHUNK_SIZE - 1) {
      return edgeEntities.find((entry) => entry.ref === `edge:south:${currentChunk.cx},${currentChunk.cy}`) ?? null;
    }
    if (localX === 0) {
      return edgeEntities.find((entry) => entry.ref === `edge:west:${currentChunk.cx},${currentChunk.cy}`) ?? null;
    }
    if (localX === CHUNK_SIZE - 1) {
      return edgeEntities.find((entry) => entry.ref === `edge:east:${currentChunk.cx},${currentChunk.cy}`) ?? null;
    }
    return null;
  }

  function hitTestEntityAtCanvasPoint(localPxX: number, localPxY: number): WorldEntity | null {
    if (!state) return null;
    const now = performance.now();
    const scenePaused = busy || movementBusy || diceRolling || !!battleFx;

    const actors = actorsInChunk(state, currentChunk.cx, currentChunk.cy)
      .map((actor) => {
        const pose = getActorRenderPose(state, actor, now, wanderRef.current, scenePaused, pinnedActorId);
        const localX = (pose.x - currentChunk.cx * CHUNK_SIZE) * TILE_PX;
        const localY = (pose.y - currentChunk.cy * CHUNK_SIZE) * TILE_PX;
        return {
          actor,
          left: localX - 4,
          top: localY - 6,
          right: localX + TILE_PX + 4,
          bottom: localY + TILE_PX + 6,
        };
      })
      .sort((a, b) => a.bottom - b.bottom);

    for (let i = actors.length - 1; i >= 0; i -= 1) {
      const hit = actors[i];
      if (
        localPxX >= hit.left &&
        localPxX <= hit.right &&
        localPxY >= hit.top &&
        localPxY <= hit.bottom
      ) {
        return findWorldEntityByRef(state, `actor:${hit.actor.id}`);
      }
    }

    const structures = getMapStructures()
      .filter((structure) => chunkOf(structure.x, structure.y).cx === currentChunk.cx && chunkOf(structure.x, structure.y).cy === currentChunk.cy)
      .map((structure) => ({
        structure,
        left: (structure.x - currentChunk.cx * CHUNK_SIZE) * TILE_PX,
        top: (structure.y - currentChunk.cy * CHUNK_SIZE) * TILE_PX - TILE_PX * 0.2,
        right: (structure.x - currentChunk.cx * CHUNK_SIZE + structure.w) * TILE_PX,
        bottom: (structure.y - currentChunk.cy * CHUNK_SIZE + structure.h) * TILE_PX,
      }))
      .sort((a, b) => a.bottom - b.bottom);

    for (let i = structures.length - 1; i >= 0; i -= 1) {
      const hit = structures[i];
      if (
        localPxX >= hit.left &&
        localPxX <= hit.right &&
        localPxY >= hit.top &&
        localPxY <= hit.bottom
      ) {
        return findWorldEntityByRef(state, `structure:${hit.structure.id}`);
      }
    }

    return null;
  }

  function buildHoverState(
    localX: number,
    localY: number,
    worldX: number,
    worldY: number,
    localPxX?: number,
    localPxY?: number
  ): HoverState | null {
    if (!state) return null;
    const edgeEntity = edgeEntityForLocalTile(localX, localY);
    const preciseEntity =
      typeof localPxX === "number" && typeof localPxY === "number"
        ? hitTestEntityAtCanvasPoint(localPxX, localPxY)
        : null;
    const entity = preciseEntity ?? edgeEntity ?? findEntityAtTile(state, worldX, worldY);
    let path: WorldPoint[] = [];
    let reachable = false;
    if (entity) {
      const nextPath = findPathToEntity(state, entity, { maxSteps: 320 });
      reachable = nextPath !== null;
      path = nextPath ?? [];
    } else {
      const nextPath = findPathToTile(state, worldX, worldY, { maxSteps: 320 });
      reachable = nextPath !== null;
      path = nextPath ?? [];
    }
    return {
      tile: { x: worldX, y: worldY },
      entity,
      path,
      reachable,
    };
  }

  function canInteractDirectly(hover: HoverState): boolean {
    if (!hover.entity || !hover.reachable || hover.path.length !== 0) return false;
    return hover.entity.kind === "actor" || hover.entity.kind === "structure" || hover.entity.kind === "prop";
  }

  function actionTextForMove(target: WorldEntity | null): string {
    if (!target) return "je me deplace";
    if (target.kind === "edge") return `je vais vers ${target.infoLines[0]?.replace("Destination: ", "") ?? target.name}`;
    if (target.kind === "actor" || target.kind === "structure") return `je me rapproche de ${target.name}`;
    return `je vais sur ${target.name}`;
  }

  function inferInteractionType(target: WorldEntity, prompt: string): PlayerInteractionRequest["type"] {
    const normalized = normalizeText(prompt);
    if (/observe|inspecte|info|regarde/.test(normalized)) return "inspect";
    if (/attaque|frappe|tue|menace/.test(normalized)) return target.kind === "actor" ? "attack" : "context";
    if (/recrute|suis moi|viens avec moi|accompagne|apprivoise/.test(normalized)) return target.kind === "actor" ? "recruit" : "context";
    if (isShopEntity(target) || isGuildEntity(target)) return "context";
    if (target.kind === "actor") return target.modes.includes("talk") ? "talk" : "interact";
    return "context";
  }

  function dialogPresets(target: WorldEntity): Array<{ label: string; prompt: string }> {
    const presets: Array<{ label: string; prompt: string }> = [];
    const push = (label: string, prompt: string): void => {
      if (!presets.some((entry) => entry.label === label && entry.prompt === prompt)) {
        presets.push({ label, prompt });
      }
    };

    if (isShopEntity(target)) {
      push("Acheter", "je veux acheter");
      push("Vendre", "je veux vendre");
      push("Negocier", "je negocie les prix");
      push("Voler", "je tente de voler");
      push("Stock", "montre moi le stock");
      for (const entry of SHOP_CATALOG.slice(0, 5)) {
        push(entry.name, `j achete ${entry.name}`);
      }
      return presets;
    }

    if (isGuildEntity(target)) {
      push("Quete", "je veux une quete");
      push("Rang", "quel est mon rang");
      push("Infos", "je veux des infos sur la guilde");
      return presets;
    }

    if (target.kind === "actor") {
      if (target.modes.includes("talk")) push("Parler", `je parle a ${target.name}`);
      if (target.modes.includes("attack")) push("Attaquer", `j attaque ${target.name}`);
      if (target.modes.includes("recruit")) push("Recruter", `je recrute ${target.name}`);
      push("Observer", `j observe ${target.name}`);
      return presets;
    }

    if (target.kind === "prop") {
      if (target.prop === "tree") {
        push("Couper", "je coupe cet arbre");
        push("Bruler", "je brule cet arbre");
      } else if (target.prop === "rock") {
        push("Miner", "je mine ce rocher");
        push("Casser", "je casse ce rocher");
      } else {
        push("Inspecter", `j observe ${target.name}`);
        push("Detruire", `je detruis ${target.name}`);
      }
    }

    return presets;
  }

  function handleCanvasMouseMove(event: ReactMouseEvent<HTMLCanvasElement>): void {
    if (!state || transition || state.status !== "playing") return;
    const tile = resolveCanvasTile(event.clientX, event.clientY);
    if (!tile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (event.clientX - rect.left) * scaleX;
    const py = (event.clientY - rect.top) * scaleY;
    setHovered(buildHoverState(tile.localX, tile.localY, tile.worldX, tile.worldY, px, py));
  }

  function handleCanvasMouseLeave(): void {
    setHovered(null);
  }

  function handleCanvasClick(): void {
    if (!state || !hovered || busy || movementBusy || state.status !== "playing") return;
    if (!hovered.reachable) {
      setIntentSummary("Aucun chemin propre vers cette cible depuis ta position.");
      return;
    }
    const target = hovered.entity;
    if (target && canInteractDirectly(hovered)) {
      setInteractionDialog({
        target,
        prompt: defaultPromptForTarget(target),
        showInfo: false,
      });
      return;
    }
    void submitAction(actionTextForMove(target), {
      type: "move",
      targetRef: target?.ref ?? null,
      targetTile: hovered.tile,
      source: "mouse",
    });
  }

  function handleCanvasContextMenu(event: ReactMouseEvent<HTMLCanvasElement>): void {
    event.preventDefault();
    if (!state || busy || movementBusy || state.status !== "playing" || transition) return;
    const tile = resolveCanvasTile(event.clientX, event.clientY);
    if (!tile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (event.clientX - rect.left) * scaleX;
    const py = (event.clientY - rect.top) * scaleY;
    const hover = buildHoverState(tile.localX, tile.localY, tile.worldX, tile.worldY, px, py);
    if (!hover?.entity) return;
    setHovered(hover);
    setInteractionDialog({
      target: hover.entity,
      prompt: defaultPromptForTarget(hover.entity),
      showInfo: false,
    });
  }

  function submitDialogInteraction(): void {
    if (!interactionDialog) return;
    const prompt = interactionDialog.prompt.trim();
    if (!prompt) return;
    const target = interactionDialog.target;
    const interaction: PlayerInteractionRequest = {
      type: inferInteractionType(target, prompt),
      targetRef: target.ref,
      primaryTargetRef: target.ref,
      targetTile: { x: target.x, y: target.y },
      freeText: prompt,
      source: "mouse",
    };
    setInteractionDialog(null);
    if (state) {
      const path =
        target.kind === "actor" || target.kind === "structure" || target.kind === "prop" || target.kind === "poi"
          ? findPathToEntity(state, target, { maxSteps: 320 }) ?? []
          : findPathToTile(state, target.x, target.y, { maxSteps: 320 }) ?? [];
      if (path.length > 0) {
        runCodeMovement(path, `Tu te rapproches de ${target.name}.`, () => {
          void submitActionRef.current?.(prompt, interaction);
        });
        return;
      }
    }
    void submitAction(prompt, interaction);
  }

  if (bootError) {
    return (
      <main className={styles.page}>
        <div className={styles.errorCard}>
          <h2>Initialisation impossible</h2>
          <p>{bootError}</p>
          <div className={styles.errorActions}>
            <button onClick={() => router.push(`/solo?name=${encodeURIComponent(playerName)}`)}>
              Preparation solo
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>Initialisation de la partie...</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.topPanel}>
        <div className={styles.playerCard}>
          <img src={state.player.characterFace} alt={state.player.name} className={styles.playerFace} />
          <div className={styles.playerMeta}>
            <div className={styles.playerTitleRow}>
              <strong>{state.player.name}</strong>
              <span className={styles.turnBadge}>Tour {state.turn}</span>
            </div>
            <small>Scenario {scenario.toUpperCase()} - {state.player.reputationTitle ?? "Aventurier en route"}</small>
            <small>Equipement: {equippedLabel}</small>
            <div className={styles.lifeRow}>
              <div className={styles.hearts}>
                {Array.from({ length: state.player.maxLives }).map((_, index) => (
                  <img
                    key={`heart_${index}`}
                    src={BASE_ASSETS.heart}
                    alt="vie"
                    data-empty={index >= state.player.lives ? "1" : "0"}
                  />
                ))}
              </div>
              <span className={styles.lifeText}>{state.player.lives}/{state.player.maxLives} vies</span>
            </div>
            <div className={styles.vitalMeter} data-damaged={damageFx ? "1" : "0"}>
              <div className={styles.vitalMeterTrack}>
                <div className={styles.vitalMeterFill} style={{ width: `${hpPercent}%` }} />
              </div>
              <span>PV {state.player.hp}/{state.player.maxHp}</span>
            </div>
            <div
              className={styles.stressMeter}
              data-tone={state.player.stress >= 70 ? "danger" : state.player.stress >= 35 ? "warn" : "calm"}
              data-damaged={damageFx ? "1" : "0"}
            >
              <div className={styles.stressMeterTrack}>
                <div className={styles.stressMeterFill} style={{ width: `${stressPercent}%` }} />
              </div>
              <span>Stress {state.player.stress}/100</span>
            </div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div>
            <img src={BASE_ASSETS.gold} alt="" />
            <small>Or</small>
            <strong>{state.player.gold}</strong>
          </div>
          <div>
            <img src={BASE_ASSETS.strength} alt="" />
            <small>Force</small>
            <strong>{state.player.strength}</strong>
          </div>
          <div>
            <small>Vitesse</small>
            <strong>{state.player.speed}</strong>
          </div>
          <div>
            <small>Volonte</small>
            <strong>{state.player.willpower}</strong>
          </div>
          <div>
            <small>Magie</small>
            <strong>{state.player.magic}</strong>
          </div>
          <div>
            <small>Aura</small>
            <strong>{state.player.aura}</strong>
          </div>
          <div>
            <small>Rang</small>
            <strong>{rank}</strong>
          </div>
        </div>

        <div className={styles.objective}>
          <small>Grand objectif</small>
          <strong>{objectiveLens?.primary ?? state.player.objective}</strong>
          <div className={styles.objectiveDetail}>
            <span>Etape</span>
            <p>{objectiveLens?.step ?? "Observe le monde et choisis ta prochaine action."}</p>
          </div>
          <p className={styles.objectiveHint}>{objectiveLens?.suggestion ?? "Explore les points d interet visibles."}</p>
          <div className={styles.objectiveActions}>
            <button
              type="button"
              onClick={() => focusPoi(objectiveLens?.targetPoi ?? null)}
              disabled={!objectiveLens?.targetPoi || busy || movementBusy}
            >
              Afficher la destination
            </button>
          </div>
        </div>
      </section>

      <section className={styles.mainZone}>
        <section className={styles.mapCard}>
          <header className={styles.mapHead}>
            <div>
              <strong>{screenName}</strong>
              <small>{location}</small>
            </div>
            <div className={styles.statusStack}>
              <span className={styles.status} data-tone={state.status === "playing" ? "ok" : "warn"}>
                {statusLine}
              </span>
              <span className={styles.diceBadge} data-rolling={diceRolling ? "1" : "0"}>
                {diceRolling ? `D20: ${lastDice ?? "..."}` : lastDice ? `D20: ${lastDice}` : "D20"}
              </span>
            </div>
          </header>

          <canvas
            ref={canvasRef}
            width={MAP_PX}
            height={MAP_PX}
            className={styles.canvas}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasContextMenu}
          />
          <p className={styles.canvasHint}>
            {hovered?.entity
              ? canInteractDirectly(hovered)
                ? `${hovered.entity.name} - clic gauche pour interagir, clic droit pour agir librement.`
                : `${hovered.entity.name} - clic gauche pour te deplacer, clic droit pour agir.`
              : `Controles: ${controlLabel}. Clic gauche = deplacement, clic droit = interaction.`}
          </p>
          {battleFx ? (
            <div className={styles.combatWheelOverlay}>
              <div className={styles.combatWheelCard}>
                <div className={styles.combatWheelHead}>Scene de combat</div>
                <div className={styles.combatCommandStrip}>
                  {["Attaquer", "Pouvoir", "Parler", "Fuir"].map((label) => (
                    <span
                      key={label}
                      className={styles.combatCommandChip}
                      data-active={battleFx.commandLabel === label ? "1" : "0"}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className={styles.combatWheelStats}>
                  <div className={styles.combatStatPanel} data-side="player">
                    <strong>{state.player.name}</strong>
                    <small>POW {battleFx.playerStats.power} | CMB {battleFx.playerStats.combat}</small>
                    <div className={styles.combatHpBar}>
                      <div
                        className={styles.combatHpFill}
                        style={{ width: `${clamp((battleFx.playerStats.hpAfter / Math.max(1, battleFx.playerStats.maxHp)) * 100, 0, 100)}%` }}
                      />
                    </div>
                    <small>PV {battleFx.playerStats.hpAfter}/{battleFx.playerStats.maxHp} | Stress {battleFx.playerStats.stress}</small>
                    <small>{battleFx.playerDamageTaken > 0 ? `-${battleFx.playerDamageTaken} PV` : "Aucun degat subi"}</small>
                  </div>
                  <div className={styles.combatStatPanel} data-side="enemy">
                    <strong>{battleFx.enemyName}</strong>
                    <small>POW {battleFx.enemyStats.power} | CMB {battleFx.enemyStats.combat}</small>
                    <div className={styles.combatHpBar}>
                      <div
                        className={styles.combatHpFill}
                        style={{ width: `${clamp((battleFx.enemyStats.hpAfter / Math.max(1, battleFx.enemyStats.maxHp)) * 100, 0, 100)}%` }}
                      />
                    </div>
                    <small>PV {battleFx.enemyStats.hpAfter}/{battleFx.enemyStats.maxHp} | Stress {battleFx.enemyStats.stress}</small>
                    <small>{battleFx.enemyDamageTaken > 0 ? `-${battleFx.enemyDamageTaken} PV` : "Aucun degat inflige"}</small>
                  </div>
                </div>
                <div className={styles.combatWheelWrap}>
                  <span className={styles.combatPointer} />
                  <div
                    className={styles.combatWheel}
                    style={
                      {
                        background: `conic-gradient(#54be8d 0deg ${(battleFx.playerWeight / (battleFx.playerWeight + battleFx.enemyWeight)) * 360}deg, #cf6c6c ${(battleFx.playerWeight / (battleFx.playerWeight + battleFx.enemyWeight)) * 360}deg 360deg)`,
                        "--spin-deg": `${battleFx.spinDeg}deg`,
                      } as CSSProperties
                    }
                  />
                </div>
                <div className={styles.combatWheelResult}>
                  {battleFx.winner === "player" ? "Avantage joueur" : "Avantage adversaire"}
                  {typeof battleFx.roll === "number" ? ` - D20 ${battleFx.roll}` : ""}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <aside className={styles.narratorCard}>
          <h3>Narrateur MJ</h3>
          <div className={styles.storyLine}>{state.lastAction}</div>
          <div className={styles.narration}>{state.lastNarration}</div>
          <div className={styles.intentCard}>
            <small>Intention comprise</small>
            <strong>{intentSummary}</strong>
          </div>

          <div className={styles.contextButtons}>
            <button
              type="button"
              disabled={!nearShop || busy || movementBusy}
              onClick={() => setContextPanel("shop")}
            >
              Boutique
            </button>
            <button
              type="button"
              disabled={!nearGuild || busy || movementBusy}
              onClick={() => setContextPanel("guild")}
            >
              Guilde
            </button>
            <button type="button" disabled={busy || movementBusy} onClick={() => setSettingsOpen(true)}>
              Parametres
            </button>
          </div>

          <div className={styles.tabs}>
            <button
              className={activePanel === "log" ? styles.activeTab : ""}
              onClick={() => setActivePanel("log")}
            >
              Journal
            </button>
            <button
              className={activePanel === "inventory" ? styles.activeTab : ""}
              onClick={() => setActivePanel("inventory")}
            >
              Inventaire
            </button>
          </div>

          {activePanel === "log" ? (
            <div ref={logRef} className={styles.logPanel}>
              {state.log.map((line, index) => {
                const entry = parseLogEntry(line);
                return (
                  <p
                    key={`${index}_${line.slice(0, 18)}`}
                    className={`${styles.logLine} ${styles[entry.className] ?? ""}`}
                  >
                    <span className={styles.logTag}>{entry.tag}</span>
                    <span>{entry.body}</span>
                  </p>
                );
              })}
              {busy ? <p className={`${styles.logLine} ${styles.pending}`}>MJ: resolution...</p> : null}
            </div>
          ) : (
            <div className={styles.inventoryPanel}>
              {state.player.inventory.length === 0 ? (
                <p className={styles.muted}>Inventaire vide.</p>
              ) : (
                state.player.inventory.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <img src={item.icon} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <small>x{item.qty} {item.emoji}</small>
                    </div>
                    {item.sprite ? (
                      state.player.equippedItemId === item.id ? (
                        <button
                          type="button"
                          className={styles.itemAction}
                          onClick={unequipItem}
                          disabled={busy || movementBusy}
                        >
                          Retirer
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.itemAction}
                          onClick={() => equipItem(item.id)}
                          disabled={busy || movementBusy}
                        >
                          Equiper
                        </button>
                      )
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}
        </aside>
      </section>

      <section className={styles.bottomPanel}>
        <div className={styles.inputRow}>
          <input
            value={actionText}
            onChange={(event) => setActionText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void submitAction();
              }
            }}
            disabled={busy || movementBusy || state.status !== "playing"}
            placeholder={
              state.status === "playing"
                ? `Ex: ${actionSuggestions[0] ?? "je vais a la guilde"}`
                : "Partie terminee."
            }
          />
          <button
            onClick={() => void submitAction()}
            disabled={busy || movementBusy || state.status !== "playing" || actionText.trim().length === 0}
          >
            Lancer D20 et resoudre
          </button>
        </div>
        <div className={styles.inputHints}>
          <div className={styles.suggestionRail}>
            {actionSuggestions.map((entry) => (
              <button
                key={entry}
                type="button"
                className={styles.suggestionChip}
                disabled={busy || movementBusy || state.status !== "playing"}
                onClick={() => void submitAction(entry)}
              >
                {entry}
              </button>
            ))}
          </div>
          <p className={styles.inputHintText}>
            Entree pour agir. Le monde reagit aussi au clavier et a la souris: deplacement orthogonal case par case, maintien d une direction pour avancer en continu, preview du chemin au survol, popup contextuel au clic droit.
          </p>
        </div>
      </section>

      {interactionDialog && state.status === "playing" ? (
        <div className={styles.contextOverlay}>
          <div className={styles.contextCard}>
            <header>
              <strong>{interactionDialog.target.name}</strong>
              <button type="button" onClick={() => setInteractionDialog(null)}>
                Fermer
              </button>
            </header>
            <div className={styles.dialogActions}>
              {dialogPresets(interactionDialog.target).map((preset) => (
                <button
                  key={`${preset.label}_${preset.prompt}`}
                  type="button"
                  className={styles.dialogChip}
                  onClick={() =>
                    setInteractionDialog((prev) =>
                      prev ? { ...prev, prompt: preset.prompt } : prev
                    )
                  }
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                className={styles.dialogChip}
                onClick={() =>
                  setInteractionDialog((prev) => (prev ? { ...prev, showInfo: !prev.showInfo } : prev))
                }
              >
                {interactionDialog.showInfo ? "Masquer infos" : "Infos"}
              </button>
            </div>
            {interactionDialog.showInfo ? (
              <div className={styles.dialogInfoPanel}>
                {interactionDialog.target.infoLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
            {isShopEntity(interactionDialog.target) ? (
              <div className={styles.dialogTradeGrid}>
                <div className={styles.shopPanel}>
                  <strong>Achats rapides</strong>
                  <small>Remise active: -{getShopDiscountPercent(state.player.shopDiscountPercent)}%</small>
                  <ul>
                    {SHOP_CATALOG.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setInteractionDialog((prev) =>
                              prev ? { ...prev, prompt: `j achete ${entry.name}` } : prev
                            )
                          }
                        >
                          <span>{entry.name}</span>
                          <em>{getShopPrice(entry, state.player.shopDiscountPercent)} or</em>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.shopPanel}>
                  <strong>Vendre depuis l inventaire</strong>
                  {state.player.inventory.length === 0 ? (
                    <small>Aucun objet a vendre.</small>
                  ) : (
                    <ul>
                      {state.player.inventory.slice(0, 6).map((item) => (
                        <li key={`sell_${item.id}`}>
                          <button
                            type="button"
                            onClick={() =>
                              setInteractionDialog((prev) =>
                                prev ? { ...prev, prompt: `je vends ${item.name}` } : prev
                              )
                            }
                          >
                            <span>{item.name}</span>
                            <em>x{item.qty}</em>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
            <textarea
              className={styles.dialogInput}
              value={interactionDialog.prompt}
              onChange={(event) =>
                setInteractionDialog((prev) => (prev ? { ...prev, prompt: event.target.value } : prev))
              }
              placeholder="Decris exactement ce que tu veux faire."
            />
            <div className={styles.dialogFooter}>
              <button type="button" onClick={submitDialogInteraction} disabled={busy || movementBusy || interactionDialog.prompt.trim().length === 0}>
                Agir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {contextPanel && state.status === "playing" ? (
        <div className={styles.contextOverlay}>
          <div className={styles.contextCard}>
            <header>
              <strong>{contextPanel === "shop" ? "Boutique" : `Guilde (Rang ${rank})`}</strong>
              <button type="button" onClick={() => setContextPanel(null)}>
                Fermer
              </button>
            </header>

            {contextPanel === "shop" ? (
              <ul>
                {SHOP_CATALOG.map((entry) => (
                  <li key={entry.name}>
                    <button
                      type="button"
                      disabled={busy || movementBusy}
                      onClick={() => void submitAction(`j achete ${entry.name}`)}
                    >
                      <span>{entry.name}</span>
                      <em>{getShopPrice(entry, state.player.shopDiscountPercent)} or</em>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                {state.quests.map((quest) => (
                  <li key={quest.id}>
                    <button
                      type="button"
                      disabled={busy || movementBusy || quest.done}
                      onClick={() => void submitAction(`je prends la quete ${quest.title}`)}
                    >
                      <span>{quest.done ? `Terminee - ${quest.title}` : quest.title}</span>
                      <em>{quest.rank}</em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {majorEvent && state.status === "playing" ? (
        <div className={styles.eventOverlay}>
          <div className={styles.eventCard} data-tone={majorEvent.tone}>
            <small>Evenement majeur</small>
            <strong>{majorEvent.title}</strong>
            <p>{majorEvent.body}</p>
            <button type="button" onClick={() => setMajorEvent(null)}>
              Continuer
            </button>
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div className={styles.contextOverlay}>
          <div className={styles.contextCard}>
            <header>
              <strong>Parametres</strong>
              <button type="button" onClick={() => setSettingsOpen(false)}>
                Fermer
              </button>
            </header>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={`${styles.dialogChip} ${controlPreset === "zqsd" ? styles.activeChip : ""}`}
                onClick={() => setControlPreset("zqsd")}
              >
                ZQSD + Fleches
              </button>
              <button
                type="button"
                className={`${styles.dialogChip} ${controlPreset === "wasd" ? styles.activeChip : ""}`}
                onClick={() => setControlPreset("wasd")}
              >
                WASD + Fleches
              </button>
            </div>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={`${styles.dialogChip} ${interactionHotkey === "enter" ? styles.activeChip : ""}`}
                onClick={() => setInteractionHotkey("enter")}
              >
                Ouvrir: Entree
              </button>
              <button
                type="button"
                className={`${styles.dialogChip} ${interactionHotkey === "e" ? styles.activeChip : ""}`}
                onClick={() => setInteractionHotkey("e")}
              >
                Ouvrir: E
              </button>
            </div>
            <p className={styles.inputHintText}>
              Deplacement case par case, jamais en diagonale. Maintiens une direction pour avancer a vitesse uniforme. {interactionHotkeyLabel} ouvre l interaction de l entite la plus proche.
            </p>
          </div>
        </div>
      ) : null}

      {state.status !== "playing" ? (
        <div className={styles.overlay}>
          <div className={styles.overlayCard}>
            <h2>{state.status === "victory" ? "Quete reussie" : "Game Over"}</h2>
            <p>{state.status === "victory" ? "Le monde te reconnait comme heros." : "Tes vies sont epuisees."}</p>
            <div className={styles.overlayActions}>
              <button onClick={restartRun}>Rejouer</button>
            </div>
          </div>
        </div>
      ) : null}

      {lootFx ? (
        <div className={styles.lootFx} key={`${lootFx.startedAt}_${lootFx.name}`}>
          <img src={lootFx.icon} alt={lootFx.name} />
          <span>{lootFx.name}</span>
        </div>
      ) : null}

      {goldFx ? (
        <div className={styles.goldFx} key={`${goldFx.startedAt}_${goldFx.delta}`}>
          {goldFx.delta > 0 ? `+${goldFx.delta} or` : `${goldFx.delta} or`}
        </div>
      ) : null}
    </main>
  );
}

function hasPoiNearby(
  state: SoloGameState,
  poi: "camp" | "guild" | "shop" | "inn" | "house" | "dungeon_gate" | "boss_gate",
  distance: number
): boolean {
  for (let dy = -distance; dy <= distance; dy += 1) {
    for (let dx = -distance; dx <= distance; dx += 1) {
      if (Math.abs(dx) + Math.abs(dy) > distance) continue;
      const x = state.player.x + dx;
      const y = state.player.y + dy;
      if (x < 0 || y < 0 || x >= state.worldWidth || y >= state.worldHeight) continue;
      const tile = state.tiles[y * state.worldWidth + x];
      if (tile?.poi === poi) return true;
    }
  }
  return false;
}

function findGainedItem(before: InventoryItem[], after: InventoryItem[]): InventoryItem | null {
  for (const item of after) {
    const previous = before.find((entry) => entry.id === item.id);
    if (!previous || item.qty > previous.qty) return item;
  }
  return null;
}

function nearestVisibleHostile(state: SoloGameState, range: number): WorldActor | null {
  let best: WorldActor | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const actor of state.actors) {
    if (!actor.alive || !actor.hostile) continue;
    const distance = Math.abs(actor.x - state.player.x) + Math.abs(actor.y - state.player.y);
    if (distance > range) continue;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = actor;
    }
  }
  return best;
}

function findMoveTargetActor(state: SoloGameState, normalizedAction: string): WorldActor | null {
  if (!/(aller|vais|va |rejoins|rejoindre|approche|jusqu|voir)/.test(normalizedAction)) {
    return null;
  }
  let best: WorldActor | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const actor of state.actors) {
    if (!actor.alive) continue;
    const aliases = actorNameAliases(actor);
    const matched = aliases.some((entry) => normalizedAction.includes(entry));
    if (!matched) continue;
    const distance = manhattan(actor.x, actor.y, state.player.x, state.player.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = actor;
    }
  }
  return best;
}

function actorNameAliases(actor: WorldActor): string[] {
  const parts = normalizeText(actor.name)
    .split(" ")
    .filter((entry) => entry.length >= 3);
  const aliases = new Set<string>([normalizeText(actor.name), ...parts]);
  const normalized = normalizeText(actor.name);
  if (normalized.includes("poulet")) {
    aliases.add("poule");
    aliases.add("chicken");
  }
  if (normalized.includes("chat")) aliases.add("cat");
  if (normalized.includes("chien")) aliases.add("dog");
  if (normalized.includes("squelette")) aliases.add("skeleton");
  return Array.from(aliases);
}

function buildBattleWheelFx(
  before: SoloGameState,
  after: SoloGameState,
  enemy: WorldActor,
  enemyBefore: WorldActor | null,
  enemyAfter: WorldActor | null,
  attackPower: number,
  roll: number | null,
  commandLabel: string
): Omit<BattleFx, "enemyName" | "enemySprite" | "startedAt" | "durationMs"> {
  const playerCombat = computePlayerCombat(before);
  const playerPower = clamp(
    Math.round(attackPower + before.player.strength * 0.8 + (before.player.powerAccepted ? before.player.powerRoll * 0.25 : 0)),
    1,
    99
  );
  const enemyPower = actorPower(enemy);
  const enemyCombat = actorCombat(enemy);
  const enemyStress = actorStress(enemy);

  const playerWeight = clamp(
    Math.round(playerPower * 2 + playerCombat * 4 + Math.max(0, 34 - before.player.stress)),
    14,
    260
  );
  const enemyWeight = clamp(
    Math.round(enemyPower * 2 + enemyCombat * 4 + Math.max(0, 34 - enemyStress)),
    14,
    260
  );

  const enemyHpBefore = enemyBefore?.hp ?? enemy.hp;
  const enemyHpAfter = enemyAfter ? enemyAfter.hp : 0;
  const enemyDamageTaken = Math.max(0, enemyHpBefore - enemyHpAfter);
  const playerDamageTaken = Math.max(0, before.player.hp - after.player.hp);

  let winner: "player" | "enemy" = enemyDamageTaken >= playerDamageTaken ? "player" : "enemy";
  if (enemyAfter && !enemyAfter.alive) winner = "player";
  if (after.player.hp <= 0 && before.player.hp > 0) winner = "enemy";

  const total = playerWeight + enemyWeight;
  const playerSpan = (playerWeight / total) * 360;
  const safeMargin = 8;
  const pickAngle = (start: number, end: number): number => {
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    const span = max - min;
    if (span <= safeMargin * 2) return min + span / 2;
    return min + safeMargin + Math.random() * (span - safeMargin * 2);
  };

  const targetAngle = winner === "player" ? pickAngle(0, playerSpan) : pickAngle(playerSpan, 360);
  const spinDeg = 1440 + (270 - targetAngle);

  return {
    commandLabel,
    roll,
    playerWeight,
    enemyWeight,
    winner,
    spinDeg,
    playerStats: {
      power: playerPower,
      combat: playerCombat,
      stress: before.player.stress,
      hp: before.player.hp,
      hpAfter: after.player.hp,
      maxHp: before.player.maxHp,
    },
    enemyStats: {
      power: enemyPower,
      combat: enemyCombat,
      stress: enemyStress,
      hp: enemyHpBefore,
      hpAfter: enemyAfter ? enemyAfter.hp : Math.max(0, enemyHpBefore - enemyDamageTaken),
      maxHp: enemy.maxHp,
    },
    playerDamageTaken,
    enemyDamageTaken,
  };
}

function deriveBattleCommandLabel(text: string): string {
  const normalized = normalizeText(text);
  if (/pouvoir|magie|sort|spell/.test(normalized)) return "Pouvoir";
  if (/parle|discute|negocie|calme/.test(normalized)) return "Parler";
  if (/fuis|fuir|retraite|recul/.test(normalized)) return "Fuir";
  return "Attaquer";
}

function computePlayerCombat(state: SoloGameState): number {
  const completed = state.quests.filter((entry) => entry.done).length;
  return clamp(2 + completed * 2 + Math.floor(state.player.strength / 3), 1, 30);
}

function actorPower(actor: WorldActor): number {
  return clamp(Math.round(((actor as { strength?: number }).strength ?? actor.maxHp / 2 + 4)), 1, 99);
}

function actorCombat(actor: WorldActor): number {
  const raw = (actor as { combatLevel?: number }).combatLevel ?? Math.floor(actor.maxHp / 4) + (actor.kind === "boss" ? 8 : actor.kind === "monster" ? 4 : 2);
  return clamp(Math.round(raw), 1, 30);
}

function actorStress(actor: WorldActor): number {
  return clamp(Math.round((actor as { stress?: number }).stress ?? 12), 0, 100);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

function getPlayerRenderPose(
  render: PlayerRenderState | null,
  now: number,
  fallbackX: number,
  fallbackY: number
): { x: number; y: number; facing: Facing; moving: boolean } {
  if (!render) {
    return { x: fallbackX, y: fallbackY, facing: "down", moving: false };
  }
  const duration = Math.max(1, render.moveEndAt - render.moveStartAt);
  const t = clamp((now - render.moveStartAt) / duration, 0, 1);
  return {
    x: lerp(render.fromX, render.x, t),
    y: lerp(render.fromY, render.y, t),
    facing: render.facing,
    moving: t < 1 && duration > 1,
  };
}

function playerWalkFrame(now: number): number {
  const cycle = [0, 1, 0, 2];
  return cycle[Math.floor(now * 0.0062) % cycle.length] ?? 0;
}

function findNewlyDeadActors(before: SoloGameState, after: SoloGameState): WorldActor[] {
  const deaths: WorldActor[] = [];
  for (const actorBefore of before.actors) {
    if (!actorBefore.alive) continue;
    const actorAfter = after.actors.find((entry) => entry.id === actorBefore.id);
    if (actorAfter && !actorAfter.alive) {
      deaths.push(actorAfter);
    }
  }
  return deaths;
}

function detectMajorEventCard(
  before: SoloGameState,
  after: SoloGameState,
  outcome: SoloOutcome,
  actionText: string
): MajorEventCard | null {
  const beforeRank = before.player.rank || computeRankFromQuests(before);
  const afterRank = after.player.rank || computeRankFromQuests(after);
  const completedQuests = after.quests.filter((quest) => {
    const previous = before.quests.find((entry) => entry.id === quest.id);
    return quest.done && !previous?.done;
  });
  const beforeTile = before.tiles[before.player.y * before.worldWidth + before.player.x];
  const afterTile = after.tiles[after.player.y * after.worldWidth + after.player.x];
  const narrativeBlob = `${outcome.narrative} ${outcome.worldEvent ?? ""} ${actionText}`.toLowerCase();

  if (after.status === "victory" && before.status !== "victory") {
    return {
      id: `victory_${after.turn}`,
      title: "Victoire",
      body: "Le monde te reconnait enfin comme le heros qui a renverse le Roi Demon.",
      tone: "victory",
    };
  }

  if (/mise a prix|tete est mise a prix|wanted/.test(narrativeBlob)) {
    return {
      id: `wanted_${after.turn}`,
      title: "TA TETE EST MISE A PRIX",
      body: "Le monde a bascule. Ton nom circule et des chasseurs commencent deja a te chercher.",
      tone: "danger",
    };
  }

  if (completedQuests.length > 0) {
    return {
      id: `quest_${completedQuests[0].id}_${after.turn}`,
      title: "Quete terminee",
      body: `${completedQuests[0].title} completee. Le monde reagit a ta progression.`,
      tone: "reward",
    };
  }

  if (afterRank !== beforeRank) {
    return {
      id: `rank_${afterRank}_${after.turn}`,
      title: `Rang ${afterRank}`,
      body: `Ta reputation grimpe. Tu quittes le rang ${beforeRank} pour atteindre le rang ${afterRank}.`,
      tone: "reward",
    };
  }

  if (outcome.worldEvent) {
    return {
      id: `world_${after.turn}`,
      title: "Le monde change",
      body: outcome.worldEvent,
      tone: /danger|rituel|roi demon|monstre|meteor|impact|effondr|fracture|raid|attaque/.test(outcome.worldEvent.toLowerCase())
        ? "danger"
        : "arcane",
    };
  }

  if (after.player.objective !== before.player.objective) {
    return {
      id: `objective_${after.turn}`,
      title: "Nouvel objectif",
      body: after.player.objective,
      tone: "arcane",
    };
  }

  if ((afterTile?.poi === "dungeon_gate" || afterTile?.terrain === "dungeon") && beforeTile?.terrain !== "dungeon") {
    return {
      id: `dungeon_${after.turn}`,
      title: "Donjon oublie",
      body: "L air devient lourd, la pierre remplace la terre et chaque pas semble plus dangereux.",
      tone: "arcane",
    };
  }

  if ((afterTile?.poi === "boss_gate" || afterTile?.terrain === "boss") && beforeTile?.terrain !== "boss") {
    return {
      id: `boss_${after.turn}`,
      title: "Citadelle du Roi Demon",
      body: "Le decor change de ton. Tu entres dans un lieu ou chaque erreur peut devenir fatale.",
      tone: "danger",
    };
  }

  return null;
}

function deriveObjectiveLens(state: SoloGameState): ObjectiveLens {
  const guildQuest = state.quests.find((quest) => quest.id === "quest_guild_notice");
  const dungeonQuest = state.quests.find((quest) => quest.id === "quest_dungeon_core");
  const bossQuest = state.quests.find((quest) => quest.id === "quest_demon_king");
  const potionCount = playerItemQty(state, "Potion de soin");

  if (guildQuest && !guildQuest.done) {
    return {
      primary: state.player.objective,
      step: hasPoiNearby(state, "guild", 1) ? "Parler au maitre de guilde et prendre la premiere mission." : "Rejoindre la guilde du village.",
      suggestion: hasPoiNearby(state, "guild", 1) ? "Ouvre la guilde ou demande une quete." : "Va a la guilde pour lancer ta progression.",
      targetPoi: "guild",
    };
  }

  if (dungeonQuest && !dungeonQuest.done) {
    if (potionCount <= 0) {
      return {
        primary: state.player.objective,
        step: hasPoiNearby(state, "shop", 1) ? "Faire des provisions avant le donjon." : "Passer a la boutique pour se preparer.",
        suggestion: hasPoiNearby(state, "shop", 1) ? "Achete au moins une Potion de soin." : "Va a la boutique avant de descendre au donjon.",
        targetPoi: "shop",
      };
    }
    return {
      primary: state.player.objective,
      step: hasPoiNearby(state, "dungeon_gate", 1) ? "Entrer dans le donjon et recuperer la relique." : "Atteindre la porte du donjon.",
      suggestion: hasPoiNearby(state, "dungeon_gate", 1) ? "Avance dans le donjon et garde tes ressources." : "Traverse le sud et prepare ton entree dans le donjon.",
      targetPoi: "dungeon_gate",
    };
  }

  if (bossQuest && !bossQuest.done) {
    return {
      primary: state.player.objective,
      step: hasPoiNearby(state, "boss_gate", 1) ? "Affronter le Roi Demon." : "Rejoindre la citadelle du Roi Demon.",
      suggestion: hasPoiNearby(state, "boss_gate", 1) ? "Prepare ton attaque finale." : "Prends la route du sud-est vers la citadelle.",
      targetPoi: "boss_gate",
    };
  }

  return {
    primary: state.player.objective,
    step: "Le chapitre principal est boucle. Tu peux explorer ou recommencer une aventure.",
    suggestion: "Profite du monde, du journal et de ton inventaire avant une nouvelle partie.",
    targetPoi: null,
  };
}

function buildActionSuggestions(state: SoloGameState, objective: ObjectiveLens): string[] {
  const suggestions: string[] = [];
  const push = (value: string): void => {
    if (!suggestions.includes(value)) suggestions.push(value);
  };

  if (objective.targetPoi && !hasPoiNearby(state, objective.targetPoi, 1)) {
    push(actionForPoi(objective.targetPoi));
  }

  if (hasPoiNearby(state, "shop", 1)) {
    push("j achete Potion de soin");
    push("je demande les prix du marchand");
  }
  if (hasPoiNearby(state, "guild", 1)) {
    push("je prends la quete");
    push("je parle au maitre de guilde");
  }
  if (hasPoiNearby(state, "inn", 1)) {
    push("je me repose");
  }
  if (hasPoiNearby(state, "dungeon_gate", 1)) {
    push("je vais au donjon");
  }
  if (hasPoiNearby(state, "boss_gate", 1)) {
    push("j attaque le Roi Demon");
  }

  const nearbyHostile = nearestVisibleHostile(state, 2);
  if (nearbyHostile) {
    push("j attaque le monstre");
  }

  push("je vais a la boutique");
  push("je vais a la guilde");

  return suggestions.slice(0, 6);
}

function actionForPoi(poi: Exclude<PoiType, null>): string {
  if (poi === "shop") return "je vais a la boutique";
  if (poi === "guild") return "je vais a la guilde";
  if (poi === "inn") return "je vais a l auberge";
  if (poi === "house") return "je vais a la maison la plus proche";
  if (poi === "dungeon_gate") return "je vais au donjon";
  if (poi === "boss_gate") return "je vais au boss";
  return "je vais au camp";
}

function describeTypedIntent(
  state: SoloGameState,
  rawText: string,
  interaction?: PlayerInteractionRequest | null
): string {
  const text = normalizeText(rawText);
  if (interaction?.type === "move" && interaction.targetTile) {
    return `Deplacement orthogonal vers la case (${interaction.targetTile.x}, ${interaction.targetTile.y}).`;
  }
  if (interaction?.type === "talk") return "Interaction de dialogue ciblee.";
  if (interaction?.type === "inspect") return "Observation detaillee de la cible selectionnee.";
  if (interaction?.type === "recruit") return "Tentative de rallier cette entite a ton groupe.";
  if (interaction?.type === "attack") return "Attaque ciblee sur l entite selectionnee.";
  if (/achete|acheter|buy|commande/.test(text)) return "Le jeu va verifier le stock, puis te faire marcher vers la boutique si necessaire.";
  if (/guilde|quete|mission|contrat/.test(text)) return "Le jeu prepare une interaction de quete avec la guilde.";
  if (/attaque|frappe|combat|tue|duel/.test(text)) return "Le jeu cible la menace la plus proche et prepare une resolution de combat.";
  if (/repos|repose|auberge|dors/.test(text)) return "Le jeu interprete une action de recuperation.";
  if (/va|vais|aller|rejoins|rejoindre/.test(text)) {
    return `Le jeu interprete un deplacement depuis ${screenLabel(chunkOf(state.player.x, state.player.y).cx, chunkOf(state.player.x, state.player.y).cy)}.`;
  }
  return "Le jeu va interpreter ton intention librement et appliquer le resultat le plus coherent.";
}

function describeResolvedIntent(
  rawText: string,
  outcome: SoloOutcome,
  next: SoloGameState,
  interaction?: PlayerInteractionRequest | null
): string {
  if (outcome.buyItemName) return `Acheter ${outcome.buyItemName}.`;
  if (outcome.requestQuest) return "Prendre une mission de guilde.";
  if (outcome.attackActorId || outcome.attackNearestHostile) return "Attaquer la cible selectionnee.";
  if (outcome.destroyTarget) return "Detruire un obstacle proche.";
  if (outcome.recruitActorId) return "Recrutement reussi.";
  if ((outcome.talkToActorId || outcome.talkToNearestNpc) && outcome.npcSpeech) return "Dialoguer avec la cible selectionnee.";
  if (outcome.moveToPoi) return `Se rendre vers ${poiDisplayName(outcome.moveToPoi)}.`;
  if (outcome.movePath) return "Suivre le chemin prevu sur la carte.";
  if (outcome.moveBy) return "Se deplacer dans la zone actuelle.";
  return describeTypedIntent(next, rawText, interaction);
}

function collectChunkPoiMarkers(
  state: SoloGameState,
  cx: number,
  cy: number
): Array<{
  poi: Exclude<PoiType, null>;
  label: string;
  anchorX: number;
  anchorY: number;
  near: boolean;
  highlight: { x: number; y: number; w: number; h: number };
}> {
  return getPoiNodesForChunk(cx, cy)
    .filter((entry) => entry.showLabel && entry.label)
    .map((entry) => ({
      poi: entry.poi,
      label: entry.label ?? poiDisplayName(entry.poi),
      anchorX: entry.anchorX,
      anchorY: entry.anchorY,
      near: hasPoiNearby(state, entry.poi, 1),
      highlight: entry.highlight,
    }))
    .sort((a, b) => a.anchorY - b.anchorY);
}

function drawPoiLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  centerX: number,
  topY: number,
  near: boolean,
  focused: boolean
): void {
  ctx.save();
  ctx.font = `${focused ? 700 : 600} 11px sans-serif`;
  const width = Math.ceil(ctx.measureText(label).width) + 16;
  const x = Math.round(clamp(centerX - width / 2, 4, MAP_PX - width - 4));
  const y = Math.round(clamp(topY - 18, 4, MAP_PX - 24));
  const toneFill = focused ? "rgba(53, 38, 12, 0.96)" : near ? "rgba(18, 46, 61, 0.92)" : "rgba(14, 22, 38, 0.84)";
  const toneStroke = focused ? "rgba(255, 214, 118, 0.94)" : near ? "rgba(112, 212, 255, 0.9)" : "rgba(143, 161, 205, 0.62)";
  ctx.fillStyle = toneFill;
  ctx.strokeStyle = toneStroke;
  ctx.lineWidth = focused ? 2 : 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 18, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = focused ? "#ffe6af" : near ? "#d9f2ff" : "#d6e2ff";
  ctx.textAlign = "center";
  ctx.fillText(label, Math.round(x + width / 2), y + 13);
  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  bubble: SpeechBubbleState,
  centerX: number,
  bottomY: number,
  occupied: Array<{ x: number; y: number; width: number; height: number }>
): void {
  const text = bubble.text.length > 72 ? `${bubble.text.slice(0, 69)}...` : bubble.text;
  ctx.save();
  ctx.font = "600 11px sans-serif";
  const width = clamp(Math.ceil(ctx.measureText(text).width) + 18, 64, 190);
  const height = 18;
  let x = Math.round(clamp(centerX - width / 2, 4, MAP_PX - width - 4));
  let y = Math.round(clamp(bottomY - 26, 4, MAP_PX - 28));
  let attempts = 0;
  while (
    occupied.some((entry) => x < entry.x + entry.width && x + width > entry.x && y < entry.y + entry.height && y + height > entry.y) &&
    attempts < 8
  ) {
    y = Math.max(4, y - 22);
    if (attempts % 2 === 1) {
      x = Math.round(clamp(x + (attempts % 4 === 1 ? 16 : -16), 4, MAP_PX - width - 4));
    }
    attempts += 1;
  }
  occupied.push({ x, y, width, height });
  const tones =
    bubble.kind === "thought"
      ? { fill: "rgba(26, 34, 49, 0.96)", stroke: "rgba(124, 198, 255, 0.8)", text: "#e3f4ff" }
      : bubble.kind === "action"
        ? { fill: "rgba(43, 31, 13, 0.96)", stroke: "rgba(243, 201, 111, 0.82)", text: "#ffe8b7" }
        : bubble.kind === "system"
          ? { fill: "rgba(18, 28, 48, 0.96)", stroke: "rgba(151, 170, 213, 0.8)", text: "#e6edff" }
          : { fill: "rgba(17, 26, 43, 0.96)", stroke: "rgba(100, 205, 255, 0.88)", text: "#f0f7ff" };
  ctx.fillStyle = tones.fill;
  ctx.strokeStyle = tones.stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tones.text;
  ctx.textAlign = "center";
  ctx.fillText(text, x + width / 2, y + 13);
  ctx.restore();
}

function drawEdgeArrow(
  ctx: CanvasRenderingContext2D,
  ref: string,
  x: number,
  y: number,
  highlighted: boolean
): void {
  ctx.save();
  ctx.fillStyle = highlighted ? "rgba(255, 214, 118, 0.9)" : "rgba(122, 207, 255, 0.82)";
  ctx.strokeStyle = highlighted ? "rgba(255, 239, 189, 0.96)" : "rgba(226, 244, 255, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ref.startsWith("edge:north")) {
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x - 9, y + 5);
    ctx.lineTo(x + 9, y + 5);
  } else if (ref.startsWith("edge:south")) {
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x - 9, y - 5);
    ctx.lineTo(x + 9, y - 5);
  } else if (ref.startsWith("edge:west")) {
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 5, y - 9);
    ctx.lineTo(x + 5, y + 9);
  } else {
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x - 5, y - 9);
    ctx.lineTo(x - 5, y + 9);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawDeathFx(
  ctx: CanvasRenderingContext2D,
  entry: DeathFx,
  startX: number,
  startY: number,
  offsetX: number,
  offsetY: number,
  now: number
): void {
  const progress = clamp((now - entry.startedAt) / 860, 0, 1);
  if (progress >= 1) return;
  const px = offsetX + (entry.x - startX) * TILE_PX + TILE_PX / 2;
  const py = offsetY + (entry.y - startY) * TILE_PX + TILE_PX / 2;
  const ring = 6 + progress * 22;
  const alpha = 1 - progress;
  const color = entry.hostile ? "245, 196, 110" : "179, 215, 255";

  ctx.save();
  ctx.strokeStyle = `rgba(${color}, ${0.82 * alpha})`;
  ctx.fillStyle = `rgba(${color}, ${0.22 * alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, ring, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 255, 255, ${0.74 * alpha})`;
  ctx.fillRect(px - 1, py - 10, 2, 20);
  ctx.fillRect(px - 10, py - 1, 20, 2);
  ctx.restore();
}

function playerItemQty(state: SoloGameState, name: string): number {
  const normalized = normalizeText(name);
  const found = state.player.inventory.find((entry) => normalizeText(entry.name) === normalized);
  return found?.qty ?? 0;
}

function poiDisplayName(poi: Exclude<PoiType, null>): string {
  if (poi === "shop") return "Boutique";
  if (poi === "guild") return "Guilde";
  if (poi === "inn") return "Auberge";
  if (poi === "house") return "Maison";
  if (poi === "dungeon_gate") return "Donjon";
  if (poi === "boss_gate") return "Citadelle";
  return "Camp";
}

function describePoiDirection(state: SoloGameState, poi: Exclude<PoiType, null>): string | null {
  const targets: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      if (state.tiles[y * state.worldWidth + x]?.poi === poi) {
        targets.push({ x, y });
      }
    }
  }
  if (targets.length === 0) return null;

  const target = targets.sort(
    (a, b) => manhattan(a.x, a.y, state.player.x, state.player.y) - manhattan(b.x, b.y, state.player.x, state.player.y)
  )[0];
  const dx = target.x - state.player.x;
  const dy = target.y - state.player.y;
  if (dx === 0 && dy === 0) return "tu y es deja.";

  const horizontal = dx > 0 ? "est" : dx < 0 ? "ouest" : "";
  const vertical = dy > 0 ? "sud" : dy < 0 ? "nord" : "";
  const direction = [vertical, horizontal].filter(Boolean).join("-");
  const screens = Math.abs(Math.floor(target.x / CHUNK_SIZE) - Math.floor(state.player.x / CHUNK_SIZE)) +
    Math.abs(Math.floor(target.y / CHUNK_SIZE) - Math.floor(state.player.y / CHUNK_SIZE));
  if (screens <= 0) return `dans ce chunk, vers le ${direction}.`;
  return `${screens} zone${screens > 1 ? "s" : ""} plus loin, vers le ${direction}.`;
}

function parseLogEntry(line: string): { tag: string; body: string; className: string } {
  const match = line.match(/^([^:]+):\s*(.*)$/);
  if (!match) {
    return { tag: "LOG", body: line, className: "logMisc" };
  }
  const [, rawTag, body] = match;
  const tag = rawTag.trim();
  if (tag === "SYSTEM") return { tag, body, className: "logSystem" };
  if (tag === "MJ") return { tag, body, className: "logMj" };
  if (tag === "EVENT") return { tag, body, className: "logEvent" };
  if (tag === "TOI") return { tag, body, className: "logPlayer" };
  return { tag, body, className: "logNpc" };
}

function getActorRenderPose(
  state: SoloGameState,
  actor: WorldActor,
  now: number,
  wanderMap: Map<string, WanderState>,
  paused: boolean,
  pinnedActorId: string | null
): { x: number; y: number; facing: Facing; moving: boolean } {
  let entry = wanderMap.get(actor.id);
  const mustReset =
    !entry ||
    !Number.isFinite(entry.x) ||
    !Number.isFinite(entry.y) ||
    Math.abs(entry.baseX - actor.x) > 3 ||
    Math.abs(entry.baseY - actor.y) > 3;

  if (mustReset) {
    const allowed = facingOptions(actor);
    entry = {
      x: actor.x,
      y: actor.y,
      baseX: actor.x,
      baseY: actor.y,
      facing: initialFacing(actor, allowed),
      nextDirectionAt: now + nextDirectionInterval(actor.kind),
      nextMoveAt: now + nextMoveInterval(actor.kind),
    };
    wanderMap.set(actor.id, entry);
  }
  if (!entry) {
    return {
      x: actor.x,
      y: actor.y,
      facing: "down",
      moving: false,
    };
  }
  entry.baseX = actor.x;
  entry.baseY = actor.y;

  const allowed = facingOptions(actor);
  const leashRange = patrolRange(actor);

  if (leashRange === 0) {
    entry.x = actor.x;
    entry.y = actor.y;
    entry.moving = undefined;
    return {
      x: entry.x,
      y: entry.y,
      facing: entry.facing,
      moving: false,
    };
  }

  if (paused || (pinnedActorId !== null && actor.id === pinnedActorId)) {
    if (entry.moving) {
      entry.moving = undefined;
    }
    return {
      x: entry.x,
      y: entry.y,
      facing: entry.facing,
      moving: false,
    };
  }

  if (entry.moving) {
    const move = entry.moving;
    const t = clamp((now - move.startAt) / Math.max(1, move.endAt - move.startAt), 0, 1);
    entry.x = lerp(move.fromX, move.toX, t);
    entry.y = lerp(move.fromY, move.toY, t);
    if (t >= 1) {
      entry.x = move.toX;
      entry.y = move.toY;
      entry.moving = undefined;
    }
  }

  if (!entry.moving && now >= entry.nextDirectionAt) {
    entry.nextDirectionAt = now + nextDirectionInterval(actor.kind);
  }

  if (!entry.moving && now >= entry.nextMoveAt) {
    const attemptMove = (facing: Facing): boolean => {
      const step = directionVector(facing);
      const targetX = Math.round(entry.x) + step.dx;
      const targetY = Math.round(entry.y) + step.dy;
      const canMove =
        inWorld(state, targetX, targetY) &&
        !isBlocked(state, targetX, targetY) &&
        Math.abs(targetX - entry.baseX) <= leashRange &&
        Math.abs(targetY - entry.baseY) <= leashRange;
      if (!canMove) return false;
      const duration = moveDuration(actor.kind);
      entry.facing = facing;
      entry.moving = {
        fromX: entry.x,
        fromY: entry.y,
        toX: targetX,
        toY: targetY,
        startAt: now,
        endAt: now + duration,
      };
      return true;
    };

    let moved = attemptMove(entry.facing);
    if (!moved) {
      moved = attemptMove(nextWanderFacing(actor, entry.facing, allowed));
    }

    if (!moved) {
      entry.nextDirectionAt = now + 700;
    }
    entry.nextMoveAt = now + nextMoveInterval(actor.kind);
  }

  return {
    x: entry.x,
    y: entry.y,
    facing: entry.facing,
    moving: !!entry.moving,
  };
}

function inWorld(state: SoloGameState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.worldWidth && y < state.worldHeight;
}

function isBlocked(state: SoloGameState, x: number, y: number): boolean {
  const tile = state.tiles[y * state.worldWidth + x];
  return !tile || tile.blocked;
}

function facingOptions(actor: WorldActor): Facing[] {
  // All actors can face any direction for natural wandering
  // The patrol axis only influences preference, not restriction
  if (actor.kind === "animal") return ["up", "right", "down", "left"];
  if (actor.kind === "monster" || actor.kind === "boss") return ["up", "right", "down", "left"];
  // NPCs: allow all directions but still start with axis preference
  return ["up", "right", "down", "left"];
}

function patrolRange(actor: WorldActor): number {
  if (!actor.patrol) return actor.kind === "animal" ? 2 : 1;
  const raw = Math.abs(actor.patrol.range ?? 0.3);
  if (raw < 0.05) return 0;
  return clamp(Math.round(raw * 10), 1, 4);
}

function initialFacing(actor: WorldActor, allowed: Facing[]): Facing {
  if (allowed.length === 0) return "down";
  if (allowed.length === 1) return allowed[0];
  const seed = hashFloat(actor.id);
  return allowed[Math.floor(seed * allowed.length)] ?? allowed[0];
}

function nextWanderFacing(actor: WorldActor, current: Facing, allowed: Facing[]): Facing {
  // Natural wandering: 50% chance to pick axis-preferred direction, 50% random
  if (Math.random() < 0.5 && actor.patrol?.axis) {
    if (actor.patrol.axis === "x") {
      return current === "left" ? "right" : "left";
    }
    if (actor.patrol.axis === "y") {
      return current === "up" ? "down" : "up";
    }
  }
  // Otherwise pick a random allowed direction (different from current)
  return pickNextFacing(current, allowed);
}

function pickNextFacing(current: Facing, allowed: Facing[]): Facing {
  const fallback: Facing[] = ["up", "right", "down", "left"];
  const pool: Facing[] = allowed.length > 0 ? allowed : fallback;
  const candidates = pool.filter((entry) => entry !== current);
  const bag: Facing[] = candidates.length > 0 ? candidates : pool;
  return bag[Math.floor(Math.random() * bag.length)] ?? current;
}

function directionVector(facing: Facing): { dx: number; dy: number } {
  if (facing === "up") return { dx: 0, dy: -1 };
  if (facing === "down") return { dx: 0, dy: 1 };
  if (facing === "left") return { dx: -1, dy: 0 };
  return { dx: 1, dy: 0 };
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function nextDirectionInterval(kind: WorldActor["kind"]): number {
  if (kind === "animal") return randomBetween(1200, 3200);
  if (kind === "monster" || kind === "boss") return randomBetween(1600, 4000);
  return randomBetween(1800, 4200);
}

function nextMoveInterval(kind: WorldActor["kind"]): number {
  if (kind === "animal") return randomBetween(1800, 3600);
  if (kind === "monster" || kind === "boss") return randomBetween(2200, 4200);
  return randomBetween(2600, 4800);
}

function moveDuration(kind: WorldActor["kind"]): number {
  if (kind === "animal") return randomBetween(600, 900);
  if (kind === "monster" || kind === "boss") return randomBetween(700, 1000);
  return randomBetween(750, 1050);
}

function hashFloat(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash *= 16777619;
  }
  return Math.abs(hash % 1000) / 1000;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawChunkScene(
  ctx: CanvasRenderingContext2D,
  state: SoloGameState,
  cx: number,
  cy: number,
  offsetX: number,
  offsetY: number,
  now: number,
  speechBubbles: SpeechBubbleState[],
  cache: Map<string, HTMLImageElement>,
  wanderMap: Map<string, WanderState>,
  playerRender: PlayerRenderState | null,
  sceneMode: SceneMode,
  paused: boolean,
  pinnedActorId: string | null,
  trail: TrailEntry[],
  focusedPoi: Exclude<PoiType, null> | null,
  deathFx: DeathFx[],
  damageFx: DamageFx | null,
  previewPath: WorldPoint[],
  hoveredRef: string | null,
  edgeEntities: WorldEntity[]
): void {
  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;
  const playerPose = playerRender
    ? getPlayerRenderPose(playerRender, now, state.player.x, state.player.y)
    : { x: state.player.x, y: state.player.y, facing: "down" as Facing, moving: false };
  const occupiedBubbleRects: Array<{ x: number; y: number; width: number; height: number }> = [];

  const tiles = tilesForChunk(state, cx, cy);
  const resolveMapAsset = (key: MapAssetKey): HTMLImageElement | undefined => cache.get(BASE_ASSETS[key]);

  for (const entry of tiles) {
    const lx = entry.x - startX;
    const ly = entry.y - startY;
    const px = offsetX + lx * TILE_PX;
    const py = offsetY + ly * TILE_PX;
    const tile = entry.tile;

    const terrainPick = pickTerrainFrame(tile.terrain, entry.x, entry.y, {
      worldWidth: state.worldWidth,
      worldHeight: state.worldHeight,
    });
    const terrainImage = resolveMapAsset(terrainPick.asset);

    if (terrainImage) {
      drawSprite(
        ctx,
        terrainImage,
        terrainPick.sx,
        terrainPick.sy,
        terrainPick.sw,
        terrainPick.sh,
        px,
        py,
        TILE_PX,
        TILE_PX
      );
    } else {
      ctx.fillStyle = terrainFallback(tile.terrain);
      ctx.fillRect(px, py, TILE_PX, TILE_PX);
    }

    for (const layer of getTerrainOverlayLayers(tile.terrain, entry.x, entry.y)) {
      drawMapLayer(ctx, layer, resolveMapAsset, px, py, TILE_PX, TILE_PX);
    }

    if (sceneMode === "dungeon" || tile.terrain === "dungeon" || tile.terrain === "stone") {
      ctx.fillStyle = "rgba(39, 44, 67, 0.18)";
      ctx.fillRect(px, py, TILE_PX, TILE_PX);
    } else if (sceneMode === "boss" || tile.terrain === "boss") {
      ctx.fillStyle = "rgba(88, 37, 43, 0.2)";
      ctx.fillRect(px, py, TILE_PX, TILE_PX);
    } else if (tile.terrain === "desert") {
      ctx.fillStyle = "rgba(220, 136, 49, 0.2)";
      ctx.fillRect(px, py, TILE_PX, TILE_PX);
    } else if (tile.terrain === "village") {
      ctx.fillStyle = "rgba(118, 90, 58, 0.08)";
      ctx.fillRect(px, py, TILE_PX, TILE_PX);
    } else if (tile.terrain === "road") {
      ctx.fillStyle = "rgba(95, 62, 29, 0.1)";
      ctx.fillRect(px, py, TILE_PX, TILE_PX);
    }

    for (const layer of getPropLayers(tile.prop, entry.x, entry.y, tile.terrain)) {
      drawMapLayer(ctx, layer, resolveMapAsset, px, py, TILE_PX, TILE_PX);
    }
  }

  const activeTrail = trail
    .filter((entry) => entry.chunkKey === `${cx}_${cy}`)
    .slice(-10);
  for (const entry of activeTrail) {
    const age = Date.now() - entry.startedAt;
    const fade = clamp(1 - age / 5200, 0.1, 0.38);
    const px = offsetX + (entry.x - startX) * TILE_PX;
    const py = offsetY + (entry.y - startY) * TILE_PX;
    const footprintW = Math.max(5, Math.floor(TILE_PX * 0.34));
    const footprintH = Math.max(3, Math.floor(TILE_PX * 0.18));
    ctx.fillStyle = `rgba(196, 205, 214, ${0.16 * fade})`;
    ctx.beginPath();
    ctx.ellipse(
      px + TILE_PX * 0.5,
      py + TILE_PX * 0.72,
      footprintW,
      footprintH,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  const visiblePath = previewPath.filter((entry) => chunkOf(entry.x, entry.y).cx === cx && chunkOf(entry.x, entry.y).cy === cy);
  for (const entry of visiblePath) {
    const px = offsetX + (entry.x - startX) * TILE_PX;
    const py = offsetY + (entry.y - startY) * TILE_PX;
    ctx.save();
    ctx.fillStyle = "rgba(122, 207, 255, 0.2)";
    ctx.strokeStyle = "rgba(122, 207, 255, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const decors = getDecorsForChunk(cx, cy);
  for (const decor of decors) {
    const px = offsetX + (decor.x - startX) * TILE_PX;
    const py = offsetY + (decor.y - startY) * TILE_PX;
    drawDecor(ctx, decor.kind, resolveMapAsset, px, py, decor.w * TILE_PX, decor.h * TILE_PX);
  }

  const poiMarkers = collectChunkPoiMarkers(state, cx, cy);
  for (const marker of poiMarkers) {
    const labelX = offsetX + (marker.anchorX - startX) * TILE_PX;
    const labelY = offsetY + (marker.anchorY - startY) * TILE_PX;
    const isFocused = focusedPoi === marker.poi;
    if (marker.near || isFocused) {
      const focusX = offsetX + (marker.highlight.x - startX) * TILE_PX;
      const focusY = offsetY + (marker.highlight.y - startY) * TILE_PX;
      const focusW = marker.highlight.w * TILE_PX;
      const focusH = marker.highlight.h * TILE_PX;
      ctx.save();
      ctx.strokeStyle = isFocused ? "rgba(255, 222, 145, 0.94)" : "rgba(116, 213, 255, 0.7)";
      ctx.fillStyle = isFocused ? "rgba(255, 210, 108, 0.14)" : "rgba(98, 184, 240, 0.12)";
      ctx.lineWidth = isFocused ? 2.5 : 2;
      ctx.beginPath();
      ctx.roundRect(focusX + 2, focusY + 2, focusW - 4, focusH - 4, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    drawPoiLabel(ctx, marker.label, labelX, labelY - 8, marker.near, isFocused);
  }

  for (const edge of edgeEntities) {
    const edgeChunk = chunkOf(edge.x, edge.y);
    if (edgeChunk.cx !== cx || edgeChunk.cy !== cy) continue;
    const localX = offsetX + (edge.x - startX) * TILE_PX + TILE_PX / 2;
    const localY = offsetY + (edge.y - startY) * TILE_PX + TILE_PX / 2;
    const highlighted = hoveredRef === edge.ref;
    drawEdgeArrow(ctx, edge.ref, localX, localY, highlighted);
  }

  const worldBubbles = speechBubbles.filter(
    (bubble) =>
      bubble.expiresAt > Date.now() &&
      bubble.sourceRef !== "player:self" &&
      !bubble.sourceRef.startsWith("actor:")
  );
  for (const bubble of worldBubbles) {
    const entity = findWorldEntityByRef(state, bubble.sourceRef);
    if (!entity) continue;
    const entityChunk = chunkOf(entity.x, entity.y);
    if (entityChunk.cx !== cx || entityChunk.cy !== cy) continue;
    const centerX = offsetX + (entity.x - startX) * TILE_PX + TILE_PX / 2;
    const topY = offsetY + (entity.y - startY) * TILE_PX - 10;
    drawSpeechBubble(ctx, bubble, centerX, topY, occupiedBubbleRects);
  }

  const actors = actorsInChunk(state, cx, cy)
    .map((actor) => {
      const pose = getActorRenderPose(state, actor, now, wanderMap, paused, pinnedActorId);
      return {
        actor,
        x: pose.x,
        y: pose.y,
        facing: pose.facing,
        moving: pose.moving,
      };
    })
    .sort((a, b) => a.y - b.y);

  const playerPoseChunk = chunkOf(Math.round(playerPose.x), Math.round(playerPose.y));
  const fromChunk = playerRender ? chunkOf(Math.round(playerRender.fromX), Math.round(playerRender.fromY)) : playerPoseChunk;
  const toChunk = playerRender ? chunkOf(Math.round(playerRender.x), Math.round(playerRender.y)) : playerPoseChunk;
  const playerInChunk =
    playerPoseChunk.cx === cx && playerPoseChunk.cy === cy ||
    fromChunk.cx === cx && fromChunk.cy === cy ||
    toChunk.cx === cx && toChunk.cy === cy;

  const drawables: Array<{ y: number; draw: () => void }> = actors.map((entry) => ({
    y: entry.y,
    draw: () => {
      const sprite = cache.get(entry.actor.sprite);
      const localX = offsetX + (entry.x - startX) * TILE_PX;
      const localY = offsetY + (entry.y - startY) * TILE_PX;
      if (!sprite) {
        drawShadow(ctx, localX + TILE_PX / 2, localY + TILE_PX - 5, 10, 0.24);
        ctx.fillStyle = entry.actor.hostile ? "#f07a7a" : "#9cc0ff";
        ctx.fillRect(localX + 8, localY + 8, TILE_PX - 16, TILE_PX - 16);
        return;
      }
      const moveFrame = Math.floor(now * 0.0033 + hashFloat(entry.actor.id) * 8) % 4;
      // Idle animation: slow breathing/sway cycle (frame 0 and 1 alternating)
      const idlePhase = hashFloat(entry.actor.id) * 6000;
      const idleFrame = Math.floor((now + idlePhase) * 0.0008) % 2;
      const frame = entry.moving ? moveFrame : idleFrame;
      const row = entry.facing === "down" ? 0 : entry.facing === "up" ? 3 : entry.facing === "left" ? 1 : 2;
      const movingLeft = entry.facing === "left";
      // Subtle idle bob for standing NPCs
      const idleBob = entry.moving ? 0 : Math.sin((now + idlePhase) * 0.003) * 0.8;

      drawShadow(ctx, localX + TILE_PX / 2, localY + TILE_PX - 5, 10, 0.28);
      if (sprite.width >= 64 && sprite.height >= 64) {
        drawSprite(ctx, sprite, frame * 16, row * 16, 16, 16, localX, localY + idleBob, TILE_PX, TILE_PX);
      } else {
        const animalFrame = entry.moving
          ? Math.floor(now * 0.0024 + hashFloat(entry.actor.id) * 5) % 2
          : Math.floor((now + idlePhase) * 0.001) % 2;
        drawSpriteFlip(
          ctx,
          sprite,
          animalFrame * 16,
          0,
          16,
          16,
          localX + 2,
          localY + 6 + idleBob,
          TILE_PX - 4,
          TILE_PX - 4,
          !!movingLeft
        );
      }

      const actorBubbles = speechBubbles.filter(
        (bubble) => bubble.expiresAt > Date.now() && bubble.sourceRef === `actor:${entry.actor.id}`
      );
      if (actorBubbles.length > 0) {
        drawSpeechBubble(ctx, actorBubbles[actorBubbles.length - 1], localX + TILE_PX / 2, localY - 8, occupiedBubbleRects);
      }
    },
  }));

  if (playerInChunk) {
    drawables.push({
      y: playerPose.y,
      draw: () => {
        const walk = cache.get(state.player.characterWalk);
        const idle = cache.get(state.player.characterIdle);
        const localX = offsetX + (playerPose.x - startX) * TILE_PX;
        const idleBob = Math.sin(now * 0.0045) * 1.25;
        const localY = offsetY + (playerPose.y - startY) * TILE_PX + idleBob;
        const facing = playerPose.facing;
        const moving = playerPose.moving;
        const row = facing === "down" ? 0 : facing === "up" ? 3 : facing === "left" ? 1 : 2;
        const frame = moving ? playerWalkFrame(now) : 0;
        const sheet = moving ? walk ?? idle : idle ?? walk;
        drawShadow(ctx, localX + TILE_PX / 2, localY + TILE_PX - 5, 12, 0.34);
        drawPlayerGlow(ctx, localX + TILE_PX / 2, localY + TILE_PX / 2, now);
        if (sheet) {
          drawSpriteFlip(
            ctx,
            sheet,
            frame * 16,
            row * 16,
            16,
            16,
            localX,
            localY,
            TILE_PX,
            TILE_PX,
            false
          );
        } else {
          ctx.fillStyle = "#ffe0a3";
          ctx.fillRect(localX + 8, localY + 8, TILE_PX - 16, TILE_PX - 16);
          ctx.strokeStyle = "#6a4820";
          ctx.lineWidth = 2;
          ctx.strokeRect(localX + 8, localY + 8, TILE_PX - 16, TILE_PX - 16);
        }
        if (state.player.equippedItemSprite) {
          const equipped = cache.get(state.player.equippedItemSprite);
          if (equipped) {
            drawEquippedItem(ctx, equipped, facing, localX, localY);
          }
        }
        const playerBubbles = speechBubbles.filter(
          (bubble) => bubble.expiresAt > Date.now() && bubble.sourceRef === "player:self"
        );
        if (playerBubbles.length > 0) {
          drawSpeechBubble(ctx, playerBubbles[playerBubbles.length - 1], localX + TILE_PX / 2, localY - 10, occupiedBubbleRects);
        }
        if (damageFx && Date.now() - damageFx.startedAt < 960) {
          drawDamageFx(ctx, damageFx, localX + TILE_PX / 2, localY - 6, now);
        }
      },
    });
  }

  drawables.sort((a, b) => a.y - b.y);
  drawables.forEach((entry) => entry.draw());

  const activeDeaths = deathFx.filter((entry) => entry.chunkKey === `${cx}_${cy}`);
  for (const entry of activeDeaths) {
    drawDeathFx(ctx, entry, startX, startY, offsetX, offsetY, now);
  }
}

function drawDamageFx(
  ctx: CanvasRenderingContext2D,
  entry: DamageFx,
  centerX: number,
  topY: number,
  now: number
): void {
  const progress = clamp((now - entry.startedAt) / 960, 0, 1);
  if (progress >= 1) return;

  const rise = progress * 22;
  const alpha = 1 - progress;
  const pulse = 1 + Math.sin(progress * Math.PI) * 0.18;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = `800 ${Math.round(18 * pulse)}px sans-serif`;
  ctx.lineWidth = 4;
  ctx.strokeStyle = `rgba(27, 8, 10, ${0.85 * alpha})`;
  ctx.fillStyle = `rgba(255, 121, 121, ${0.96 * alpha})`;
  ctx.strokeText(`-${entry.delta} PV`, centerX, topY - rise);
  ctx.fillText(`-${entry.delta} PV`, centerX, topY - rise);
  ctx.font = `900 ${Math.round(16 * pulse)}px sans-serif`;
  ctx.fillStyle = `rgba(255, 214, 214, ${0.92 * alpha})`;
  ctx.fillText("coeur brise", centerX, topY - 18 - rise);
  ctx.restore();
}

function drawBattleScene(
  ctx: CanvasRenderingContext2D,
  state: SoloGameState,
  battle: BattleFx,
  now: number,
  cache: Map<string, HTMLImageElement>
): void {
  const field = cache.get(BASE_ASSETS.field);
  const player = cache.get(state.player.characterWalk);
  const enemy = cache.get(battle.enemySprite);

  ctx.fillStyle = "#1a2231";
  ctx.fillRect(0, 0, MAP_PX, MAP_PX);

  if (field) {
    for (let y = 0; y < CHUNK_SIZE; y += 1) {
      for (let x = 0; x < CHUNK_SIZE; x += 1) {
        const pick = (x + y) % 2 === 0 ? { sx: 48, sy: 96 } : { sx: 16, sy: 112 };
        drawSprite(ctx, field, pick.sx, pick.sy, 16, 16, x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX);
      }
    }
  }

  const progress = clamp((now - battle.startedAt) / battle.durationMs, 0, 1);
  const swing = Math.sin(progress * Math.PI) * 20;
  const shake = battle.roll === 1 ? Math.sin(now * 0.05) * 2.5 : 0;

  const playerX = 110 + swing;
  const enemyX = MAP_PX - 180 - swing;
  const y = MAP_PX * 0.5 - 24;

  drawShadow(ctx, playerX + 34, y + 64, 16, 0.3);
  drawShadow(ctx, enemyX + 34, y + 64, 16, 0.3);

  if (player) {
    const frame = Math.floor(now * 0.004) % 4;
    drawSprite(ctx, player, frame * 16, 0, 16, 16, playerX + shake, y, 64, 64);
  }
  if (enemy) {
    const frame = Math.floor(now * 0.004) % 4;
    drawSpriteFlip(ctx, enemy, frame * 16, 0, 16, 16, enemyX - shake, y, 64, 64, true);
  }

  ctx.fillStyle = "rgba(10, 14, 24, 0.75)";
  ctx.fillRect(24, MAP_PX - 74, MAP_PX - 48, 50);
  ctx.strokeStyle = "rgba(246, 205, 118, 0.7)";
  ctx.strokeRect(24, MAP_PX - 74, MAP_PX - 48, 50);
  ctx.fillStyle = "#ffe6b0";
  ctx.font = "700 18px sans-serif";
  ctx.fillText(`Combat: ${battle.enemyName}`, 40, MAP_PX - 42);
}

function drawDecor(
  ctx: CanvasRenderingContext2D,
  kind: string,
  resolveMapAsset: (key: MapAssetKey) => HTMLImageElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const layers = getDecorLayers(kind as Parameters<typeof getDecorLayers>[0]);
  if (layers.length > 0) {
    for (const layer of layers) {
      drawMapLayer(ctx, layer, resolveMapAsset, x, y, w, h);
    }
    return;
  }

  drawDecorLegacy(ctx, kind, x, y, w, h, {
    house: resolveMapAsset("house") ?? undefined,
    desert: resolveMapAsset("desert") ?? undefined,
    field: resolveMapAsset("field") ?? undefined,
    nature: resolveMapAsset("nature") ?? undefined,
    chest: resolveMapAsset("chest") ?? undefined,
  });
}

function drawDecorLegacy(
  ctx: CanvasRenderingContext2D,
  kind: string,
  x: number,
  y: number,
  w: number,
  h: number,
  assets: {
    house?: HTMLImageElement;
    desert?: HTMLImageElement;
    field?: HTMLImageElement;
    nature?: HTMLImageElement;
    chest?: HTMLImageElement;
  }
): void {
  if (kind === "house_a" && assets.house) {
    drawSprite(ctx, assets.house, 0, 0, 64, 64, x, y - Math.floor(TILE_PX * 0.2), w, h + Math.floor(TILE_PX * 0.2));
    return;
  }
  if (kind === "house_b" && assets.house) {
    drawSprite(ctx, assets.house, 64, 0, 64, 64, x, y - Math.floor(TILE_PX * 0.2), w, h + Math.floor(TILE_PX * 0.2));
    return;
  }
  if (kind === "house_c" && assets.house) {
    drawSprite(ctx, assets.house, 128, 0, 64, 64, x, y - Math.floor(TILE_PX * 0.2), w, h + Math.floor(TILE_PX * 0.2));
    return;
  }
  if (kind === "house_d" && assets.house) {
    drawSprite(ctx, assets.house, 192, 0, 64, 64, x, y - Math.floor(TILE_PX * 0.2), w, h + Math.floor(TILE_PX * 0.2));
    return;
  }
  if (kind === "fence_h" && (assets.house || assets.field)) {
    const source = assets.house ?? assets.field!;
    const cells = Math.max(1, Math.round(w / TILE_PX));
    for (let i = 0; i < cells; i += 1) {
      drawSprite(ctx, source, 128, 64, 16, 16, x + i * TILE_PX, y, TILE_PX, TILE_PX);
    }
    return;
  }
  if (kind === "fence_v" && (assets.house || assets.field)) {
    const source = assets.house ?? assets.field!;
    const cells = Math.max(1, Math.round(h / TILE_PX));
    for (let i = 0; i < cells; i += 1) {
      drawSprite(ctx, source, 128, 64, 16, 16, x, y + i * TILE_PX, TILE_PX, TILE_PX);
    }
    return;
  }
  if (kind === "ruin_a" && assets.desert) {
    drawSprite(ctx, assets.desert, 0, 128, 64, 48, x, y, w, h);
    return;
  }
  if (kind === "ruin_b" && assets.desert) {
    drawSprite(ctx, assets.desert, 128, 128, 64, 48, x, y, w, h);
    return;
  }
  if (kind === "palm_cluster" && assets.desert) {
    drawSprite(ctx, assets.desert, 192, 64, 64, 64, x, y - 8, w, h + 8);
    return;
  }
  if (kind === "well" && assets.house) {
    drawSprite(ctx, assets.house, 384, 32, 32, 32, x, y, w, h);
    return;
  }
  if (kind === "guild_flag" && assets.house) {
    // Compact dojo-style sign; avoids reading like a second doorway on the street.
    drawSprite(ctx, assets.house, 48, 64, 32, 16, x - 5, y + 4, TILE_PX + 10, TILE_PX - 8);
    ctx.fillStyle = "rgba(73, 44, 23, 0.9)";
    ctx.fillRect(Math.round(x + TILE_PX * 0.44), Math.round(y + TILE_PX * 0.36), 3, Math.round(TILE_PX * 0.7));
    return;
  }
  if (kind === "guild_flag" && assets.nature) {
    // Fallback: draw a simple guild banner
    ctx.fillStyle = "#c04040";
    ctx.fillRect(x + 12, y + 2, 8, TILE_PX - 6);
    ctx.fillStyle = "#f0d060";
    ctx.fillRect(x + 10, y + 2, 12, 8);
    return;
  }
  if (kind === "shop_stall" && assets.house) {
    // Market stall with awning — house tileset around y=256 area
    drawSprite(ctx, assets.house, 256, 256, 48, 32, x + 2, y + 3, w, h + Math.floor(TILE_PX * 0.45));
    return;
  }
  if (kind === "inn_sign" && assets.house) {
    // Hanging sign / lantern from house tileset — small element area
    drawSprite(ctx, assets.house, 480, 64, 16, 16, x + 4, y + 2, TILE_PX - 8, TILE_PX - 4);
    return;
  }
  if (kind === "dungeon_gate" && assets.house) {
    // Dark archway entry from house tileset (~y=128 cave entrances)
    drawSprite(ctx, assets.house, 0, 128, 48, 48, x - 4, y - 6, w + 8, h + 6);
    return;
  }
  if (kind === "dungeon_gate" && assets.desert) {
    drawSprite(ctx, assets.desert, 160, 112, 32, 32, x, y, w, h);
    return;
  }
  if (kind === "boss_gate" && assets.house) {
    // Larger dark archway with red tint for boss
    ctx.save();
    ctx.filter = "hue-rotate(-25deg) saturate(1.4) brightness(0.85)";
    drawSprite(ctx, assets.house, 0, 128, 48, 48, x - 4, y - 6, w + 8, h + 6);
    ctx.restore();
    return;
  }
  if (kind === "boss_gate" && assets.desert) {
    ctx.save();
    ctx.filter = "hue-rotate(-25deg) saturate(1.2)";
    drawSprite(ctx, assets.desert, 192, 112, 32, 32, x, y, w, h);
    ctx.restore();
  }
}

function drawMapLayer(
  ctx: CanvasRenderingContext2D,
  layer: {
    asset: MapAssetKey;
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    offsetX?: number;
    offsetY?: number;
    widthScale?: number;
    heightScale?: number;
    opacity?: number;
    fill?: string;
  },
  resolveMapAsset: (key: MapAssetKey) => HTMLImageElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const image = resolveMapAsset(layer.asset);
  const dx = x + (layer.offsetX ?? 0) * w;
  const dy = y + (layer.offsetY ?? 0) * h;
  const dw = w * (layer.widthScale ?? 1);
  const dh = h * (layer.heightScale ?? 1);

  ctx.save();
  if (typeof layer.opacity === "number") {
    ctx.globalAlpha = layer.opacity;
  }
  if (image) {
    drawSprite(ctx, image, layer.sx, layer.sy, layer.sw, layer.sh, dx, dy, dw, dh);
  } else if (layer.fill) {
    ctx.fillStyle = layer.fill;
    ctx.fillRect(Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
  }
  ctx.restore();
}

function drawShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number
): void {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEquippedItem(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  facing: Facing,
  x: number,
  y: number
): void {
  const size = Math.round(TILE_PX * 0.55);
  let dx = x + TILE_PX - size + 1;
  let dy = y + Math.round(TILE_PX * 0.38);
  let flip = false;

  if (facing === "left") {
    dx = x - 1;
    dy = y + Math.round(TILE_PX * 0.38);
    flip = true;
  } else if (facing === "up") {
    dx = x + Math.round(TILE_PX * 0.22);
    dy = y + 1;
  } else if (facing === "down") {
    dx = x + Math.round(TILE_PX * 0.46);
    dy = y + Math.round(TILE_PX * 0.52);
  }

  drawSpriteFlip(ctx, img, 0, 0, img.width, img.height, dx, dy, size, size, flip);
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): void {
  ctx.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
}

function drawSpriteFlip(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  flipX: boolean
): void {
  if (!flipX) {
    drawSprite(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh);
    return;
  }
  ctx.save();
  ctx.translate(Math.round(dx + dw), Math.round(dy));
  ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, Math.round(dw), Math.round(dh));
  ctx.restore();
}

// Legacy terrain picker kept as reference while the runtime uses lib/solo/mapArt.ts.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function pickTerrainTile(terrain: string, x: number, y: number, sceneMode: SceneMode): {
  sheet: "field" | "floor" | "floorB" | "house" | "desert" | "dungeon" | "water";
  sx: number;
  sy: number;
  sw: number;
  sh: number;
} {
  // TilesetField.png: 80×240, autotile = 5 cols × 3 rows per block (16×16 cells).
  // FILL tiles (no borders) — verified by pixel uniformity analysis:
  //   [1,1]=98%, [3,0]/[4,0]=96%, [3,1]/[4,1]=94%  ← USE THESE
  //   Row 2 cols 0-2 = EDGE/BORDER (22-26%)          ← NEVER use
  //
  // Block 0 (y=0):   Orange  → ROAD
  // Block 1 (y=48):  Yellow-green → GRASS
  // Block 2 (y=96):  Dark green → FOREST
  // Block 3 (y=144): Peach → DESERT
  // Block 4 (y=192): White → VILLAGE

  const hash = ((x * 7 + y * 13) & 0xffff) % 4;
  const pick = (variants: Array<[number, number]>): [number, number] =>
    variants[hash % variants.length] ?? variants[0];

  if (sceneMode === "dungeon" || sceneMode === "boss") {
    const [sx, sy] = pick([[0, 0], [16, 0], [32, 0], [48, 0]]);
    return { sheet: "dungeon", sx, sy, sw: 16, sh: 16 };
  }

  if (terrain === "grass") {
    // Block 1 fills: (16,64)98%, (48,48)96%, (64,48)96%, (48,64)94%
    const [sx, sy] = pick([[16, 64], [48, 48], [64, 48], [48, 64]]);
    return { sheet: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "forest") {
    // Block 2 fills: (16,112)98%, (48,96)96%, (64,96)96%, (48,112)94%
    const [sx, sy] = pick([[16, 112], [48, 96], [64, 96], [48, 112]]);
    return { sheet: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "road") {
    // Block 0 fills: (16,16)98%, (48,0)96%, (64,0)96%, (48,16)94%
    const [sx, sy] = pick([[16, 16], [48, 0], [64, 0], [48, 16]]);
    return { sheet: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "village") {
    // Block 4 fills: (16,208)98%, (48,192)96%, (64,192)96%, (48,208)94%
    const [sx, sy] = pick([[16, 208], [48, 192], [64, 192], [48, 208]]);
    return { sheet: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "desert") {
    // Block 3 fills: (16,160)98%, (48,144)96%, (64,144)96%, (48,160)94%
    const [sx, sy] = pick([[16, 160], [48, 144], [64, 144], [48, 160]]);
    return { sheet: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "water") {
    const [sx, sy] = pick([[0, 0], [16, 0]]);
    return { sheet: "water", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "dungeon" || terrain === "stone" || terrain === "boss") {
    const [sx, sy] = pick([[0, 0], [16, 0], [32, 0], [48, 0]]);
    return { sheet: "dungeon", sx, sy, sw: 16, sh: 16 };
  }
  // Default: grass fills
  const [sx, sy] = pick([[16, 64], [48, 48], [64, 48], [48, 64]]);
  return { sheet: "field", sx, sy, sw: 16, sh: 16 };
}

function terrainFallback(terrain: string): string {
  if (terrain === "forest") return "#4b8d50";
  if (terrain === "desert") return "#c79b5c";
  if (terrain === "village") return "#d9b17e";
  if (terrain === "road") return "#b48f66";
  if (terrain === "water") return "#44739d";
  if (terrain === "dungeon" || terrain === "stone") return "#6e6d78";
  if (terrain === "boss") return "#6a4747";
  return "#5ea461";
}

async function preloadImages(paths: string[], cache: Map<string, HTMLImageElement>): Promise<void> {
  const tasks = paths.map((path) => {
    if (cache.has(path)) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        cache.set(path, img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = encodeURI(path).replace(/#/g, "%23");
    });
  });
  await Promise.all(tasks);
}

function loadFromStorage(key: string): SoloGameState | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isSoloState(parsed)) return null;
    return hydrateState(parsed);
  } catch {
    return null;
  }
}

function isSoloState(value: unknown): value is SoloGameState {
  return isSharedSoloState(value);
}

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(parsed);
}

function resolveSceneMode(state: SoloGameState): SceneMode {
  const tile = state.tiles[state.player.y * state.worldWidth + state.player.x];
  if (!tile) return "world";
  if (tile.terrain === "boss" || tile.poi === "boss_gate") return "boss";
  if (tile.terrain === "dungeon" || tile.poi === "dungeon_gate") return "dungeon";
  return "world";
}

function drawPlayerGlow(ctx: CanvasRenderingContext2D, x: number, y: number, now: number): void {
  const pulse = 0.35 + Math.sin(now * 0.008) * 0.1;
  const radius = TILE_PX * (0.5 + pulse);
  const gradient = ctx.createRadialGradient(x, y, TILE_PX * 0.12, x, y, radius);
  gradient.addColorStop(0, "rgba(120, 214, 255, 0.34)");
  gradient.addColorStop(1, "rgba(120, 214, 255, 0)");
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function computeRankFromQuests(state: SoloGameState): "C" | "B" | "A" | "S" {
  const completed = state.quests.filter((quest) => quest.done).length;
  if (completed >= 3) return "S";
  if (completed >= 2) return "A";
  if (completed >= 1) return "B";
  return "C";
}

function hydrateState(state: SoloGameState): SoloGameState {
  const next = hydrateSharedState(state);
  if (!next.player.rank) {
    next.player.rank = computeRankFromQuests(next);
  }
  enforceWorldCoherence(next);
  return next;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}
