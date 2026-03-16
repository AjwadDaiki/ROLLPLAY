"use client";

/* eslint-disable @next/next/no-img-element */

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyOutcome, buildActionContext, buildStoryLine, describeLocation } from "@/lib/solo/logic";
import { SHOP_CATALOG } from "@/lib/solo/shop";
import type { InventoryItem, PoiType, SoloGameState, SoloOutcome, WorldActor } from "@/lib/solo/types";
import { CHUNK_SIZE } from "@/lib/solo/types";
import {
  actorsInChunk,
  chunkOf,
  createInitialSoloState,
  getDecorsForChunk,
  screenLabel,
  tilesForChunk,
  UI_ASSETS,
} from "@/lib/solo/world";
import styles from "./GameClient.module.css";

const TILE_PX = 30;
const MAP_PX = CHUNK_SIZE * TILE_PX;
const SAVE_DEBOUNCE_MS = 320;
const SLIDE_MS = 220;
const REQUEST_TIMEOUT_MS = 9000;

const BASE_ASSETS = {
  field:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetField.png",
  floor:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetFloor.png",
  floorB:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetFloorB.png",
  nature:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetNature.png",
  house:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetHouse.png",
  desert:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetDesert.png",
  dungeon:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetDungeon.png",
  water:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetWater.png",
  rock:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Items/Resource/Rock.png",
  chest:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Items/Treasure/LittleTreasureChest.png",
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

type BubbleState = {
  actorId: string;
  text: string;
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
  };
  enemyStats: {
    power: number;
    combat: number;
    stress: number;
    hp: number;
  };
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
    () => `freeroll_solo_save_v8_${slugify(playerName)}_${slugify(runId)}`,
    [playerName, runId]
  );

  const [state, setState] = useState<SoloGameState | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionText, setActionText] = useState("");
  const [lastDice, setLastDice] = useState<number | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [bubble, setBubble] = useState<BubbleState | null>(null);
  const [lootFx, setLootFx] = useState<LootFx | null>(null);
  const [battleFx, setBattleFx] = useState<BattleFx | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [activePanel, setActivePanel] = useState<"log" | "inventory">("log");
  const [contextPanel, setContextPanel] = useState<ContextPanel>(null);
  const [goldFx, setGoldFx] = useState<GoldFx | null>(null);
  const [pinnedActorId, setPinnedActorId] = useState<string | null>(null);
  const [intentSummary, setIntentSummary] = useState("Explore le village ou parle a un PNJ.");
  const [majorEvent, setMajorEvent] = useState<MajorEventCard | null>(null);
  const [focusedPoi, setFocusedPoi] = useState<Exclude<PoiType, null> | null>(null);
  const [deathFx, setDeathFx] = useState<DeathFx[]>([]);

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

    const dx = state.player.x - prev.x;
    const dy = state.player.y - prev.y;
    let facing = prev.facing;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
      facing = dx > 0 ? "right" : "left";
    } else if (dy !== 0) {
      facing = dy > 0 ? "down" : "up";
    }

    const movedTiles = Math.abs(dx) + Math.abs(dy);
    const animateMove = movedTiles > 0 && movedTiles <= 2;
    playerRenderRef.current = {
      x: state.player.x,
      y: state.player.y,
      fromX: animateMove ? prev.x : state.player.x,
      fromY: animateMove ? prev.y : state.player.y,
      moveStartAt: now,
      moveEndAt: animateMove ? now + 240 + movedTiles * 85 : now,
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
      const worldPaused = busy || diceRolling || !!battleFx;
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
          bubble,
          imageCacheRef.current,
          wanderRef.current,
          playerRenderRef.current,
          sceneMode,
          worldPaused,
          pinnedActorId,
          trailRef.current,
          focusedPoi,
          deathFx
        );
        drawChunkScene(
          ctx,
          state,
          transition.to.cx,
          transition.to.cy,
          travelX - shiftX,
          travelY - shiftY,
          now,
          bubble,
          imageCacheRef.current,
          wanderRef.current,
          playerRenderRef.current,
          sceneMode,
          worldPaused,
          pinnedActorId,
          trailRef.current,
          focusedPoi,
          deathFx
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
          bubble,
          imageCacheRef.current,
          wanderRef.current,
          playerRenderRef.current,
          sceneMode,
          worldPaused,
          pinnedActorId,
          trailRef.current,
          focusedPoi,
          deathFx
        );
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [assetsReady, battleFx, bubble, busy, deathFx, diceRolling, focusedPoi, pinnedActorId, state, transition]);

  useEffect(() => {
    if (!state || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [busy, state]);

  useEffect(() => {
    if (!bubble) return;
    const timer = window.setTimeout(() => setBubble(null), Math.max(100, bubble.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [bubble]);

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
    };
  }, []);

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

  useEffect(() => {
    if (contextPanel === "shop" && !nearShop) {
      setContextPanel(null);
      return;
    }
    if (contextPanel === "guild" && !nearGuild) {
      setContextPanel(null);
    }
  }, [contextPanel, nearGuild, nearShop]);

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

  async function submitAction(override?: string): Promise<void> {
    if (!state || busy || state.status !== "playing") return;
    const text = (override ?? actionText).trim();
    if (!text) return;
    const normalizedText = normalizeText(text);
    setIntentSummary(describeTypedIntent(state, text));

    setBusy(true);
    setActionText("");
    startDiceAnimation();

    const storyline = buildStoryLine(state.player.name, text);
    const wasNearShop = hasPoiNearby(state, "shop", 1);
    const wasNearGuild = hasPoiNearby(state, "guild", 1);
    const optimistic: SoloGameState = {
      ...state,
      log: [...state.log, `TOI: ${text}`],
      lastAction: storyline,
    };
    const pinnedCandidate = findMoveTargetActor(optimistic, normalizedText);
    if (pinnedCandidate) {
      setPinnedActorId(pinnedCandidate.id);
    }
    setState(optimistic);

    try {
      const context = buildActionContext(optimistic);
      const enemyBefore = nearestVisibleHostile(optimistic, 3);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch("/api/solo/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionText: text, state: optimistic, context }),
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
          : applyOutcome(optimistic, outcome);
      await stopDiceAnimation(typeof outcome.diceRoll === "number" ? outcome.diceRoll : null);
      setState(next);
      setIntentSummary(describeResolvedIntent(text, outcome, next));

      const deltaGold = next.player.gold - optimistic.player.gold;
      if (deltaGold !== 0) {
        setGoldFx({
          delta: deltaGold,
          startedAt: Date.now(),
        });
      }

      const lowered = normalizedText;
      const nearShopAfter = hasPoiNearby(next, "shop", 1);
      const nearGuildAfter = hasPoiNearby(next, "guild", 1);
      if (contextPanelTimerRef.current !== null) {
        window.clearTimeout(contextPanelTimerRef.current);
        contextPanelTimerRef.current = null;
      }

      const shouldOpenShopPanel =
        isShopIntent(lowered) &&
        nearShopAfter &&
        (!outcome.buyItemName || !wasNearShop);
      if (shouldOpenShopPanel) {
        const delay = !wasNearShop && nearShopAfter ? 260 : 0;
        contextPanelTimerRef.current = window.setTimeout(() => {
          setContextPanel("shop");
          contextPanelTimerRef.current = null;
        }, delay);
      } else if (isGuildIntent(lowered) && nearGuildAfter && (!outcome.requestQuest || !wasNearGuild)) {
        const delay = !wasNearGuild && nearGuildAfter ? 220 : 0;
        contextPanelTimerRef.current = window.setTimeout(() => {
          setContextPanel("guild");
          contextPanelTimerRef.current = null;
        }, delay);
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

      const enemyAfter = outcome.attackNearestHostile ? nearestVisibleHostile(next, 4) : null;
      const enemyForFx = enemyBefore ?? enemyAfter;
      if (outcome.attackNearestHostile && enemyForFx) {
        const enemyAfterById = enemyBefore ? next.actors.find((entry) => entry.id === enemyBefore.id) ?? null : null;
        const wheel = buildBattleWheelFx(
          optimistic,
          next,
          enemyForFx,
          enemyBefore,
          enemyAfterById,
          outcome.attackPower ?? 10,
          typeof outcome.diceRoll === "number" ? outcome.diceRoll : null
        );
        setBattleFx({
          enemyName: enemyForFx.name,
          enemySprite: enemyForFx.sprite,
          startedAt: Date.now(),
          durationMs: 2350,
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
          setBubble({
            actorId: nearNpc.actor.id,
            text: outcome.npcSpeech,
            expiresAt: Date.now() + 2400,
          });
        }
      }
    } catch {
      await stopDiceAnimation(null);
      const fallbackOutcome: SoloOutcome = {
        narrative: "Erreur reseau temporaire. Reessaie.",
        storyLine: storyline,
        diceRoll: null,
      };
      const fallback = applyOutcome(optimistic, fallbackOutcome);
      setState(fallback);
      setIntentSummary(describeResolvedIntent(text, fallbackOutcome, fallback));
    } finally {
      setBusy(false);
    }
  }

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
    setBubble(null);
    setLootFx(null);
    setBattleFx(null);
    setGoldFx(null);
    setContextPanel(null);
    setTransition(null);
    setPinnedActorId(null);
    wanderRef.current.clear();
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
            <strong>{state.player.name}</strong>
            <small>Scenario {scenario.toUpperCase()} - Tour {state.turn}</small>
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
            <div className={styles.vitalMeter}>
              <div className={styles.vitalMeterTrack}>
                <div className={styles.vitalMeterFill} style={{ width: `${hpPercent}%` }} />
              </div>
              <span>PV {state.player.hp}/{state.player.maxHp}</span>
            </div>
            <div className={styles.stressMeter} data-tone={state.player.stress >= 70 ? "danger" : state.player.stress >= 35 ? "warn" : "calm"}>
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
            <span>OR {state.player.gold}</span>
          </div>
          <div>
            <img src={BASE_ASSETS.strength} alt="" />
            <span>FOR {state.player.strength}</span>
          </div>
          <div>
            <img src={BASE_ASSETS.stress} alt="" />
            <span>STRESS {state.player.stress}</span>
          </div>
          <div>
            <span>RANG {rank}</span>
          </div>
          <div data-accent="hp">
            <span>PV {state.player.hp}/{state.player.maxHp}</span>
          </div>
        </div>

        <div className={styles.objective}>
          <small>Grand objectif</small>
          <strong>{objectiveLens?.primary ?? state.player.objective}</strong>
          <div className={styles.objectiveDetail}>
            <span>Etape</span>
            <p>{objectiveLens?.step ?? "Observe le monde et choisis ta prochaine action."}</p>
          </div>
          <div className={styles.objectiveDetail}>
            <span>Suggestion</span>
            <p>{objectiveLens?.suggestion ?? "Explore les points d interet visibles."}</p>
          </div>
          <div className={styles.objectiveActions}>
            <button
              type="button"
              onClick={() => focusPoi(objectiveLens?.targetPoi ?? null)}
              disabled={!objectiveLens?.targetPoi || busy}
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

          <canvas ref={canvasRef} width={MAP_PX} height={MAP_PX} className={styles.canvas} />
          {battleFx ? (
            <div className={styles.combatWheelOverlay}>
              <div className={styles.combatWheelCard}>
                <div className={styles.combatWheelHead}>Roue de combat</div>
                <div className={styles.combatWheelStats}>
                  <div>
                    <strong>{state.player.name}</strong>
                    <small>POW {battleFx.playerStats.power} | CMB {battleFx.playerStats.combat}</small>
                    <small>STR {state.player.strength} | STRESS {battleFx.playerStats.stress}</small>
                  </div>
                  <div>
                    <strong>{battleFx.enemyName}</strong>
                    <small>POW {battleFx.enemyStats.power} | CMB {battleFx.enemyStats.combat}</small>
                    <small>HP {battleFx.enemyStats.hp} | STRESS {battleFx.enemyStats.stress}</small>
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
              disabled={!nearShop || busy}
              onClick={() => setContextPanel("shop")}
            >
              Boutique
            </button>
            <button
              type="button"
              disabled={!nearGuild || busy}
              onClick={() => setContextPanel("guild")}
            >
              Guilde
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
                          disabled={busy}
                        >
                          Retirer
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.itemAction}
                          onClick={() => equipItem(item.id)}
                          disabled={busy}
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
            disabled={busy || state.status !== "playing"}
            placeholder={
              state.status === "playing"
                ? `Ex: ${actionSuggestions[0] ?? "je vais a la guilde"}`
                : "Partie terminee."
            }
          />
          <button
            onClick={() => void submitAction()}
            disabled={busy || state.status !== "playing" || actionText.trim().length === 0}
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
                disabled={busy || state.status !== "playing"}
                onClick={() => void submitAction(entry)}
              >
                {entry}
              </button>
            ))}
          </div>
          <p className={styles.inputHintText}>
            Entree pour agir. Tu peux ecrire librement, mais les suggestions donnent les commandes les plus utiles maintenant.
          </p>
        </div>
      </section>

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
                      disabled={busy}
                      onClick={() => void submitAction(`j achete ${entry.name}`)}
                    >
                      <span>{entry.name}</span>
                      <em>{entry.price} or</em>
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
                      disabled={busy || quest.done}
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

function isShopIntent(text: string): boolean {
  return /(shop|boutique|marchand|acheter|achete|buy|commande)/.test(text);
}

function isGuildIntent(text: string): boolean {
  return /(guilde|quete|quest|mission|contrat)/.test(text);
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
  roll: number | null
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
    },
    enemyStats: {
      power: enemyPower,
      combat: enemyCombat,
      stress: enemyStress,
      hp: enemyHpBefore,
    },
  };
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
  now: number
): { x: number; y: number; facing: Facing; moving: boolean } {
  if (!render) {
    return { x: 0, y: 0, facing: "down", moving: false };
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
      tone: /danger|rituel|roi demon|monstre/.test(outcome.worldEvent.toLowerCase()) ? "danger" : "arcane",
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

function describeTypedIntent(state: SoloGameState, rawText: string): string {
  const text = normalizeText(rawText);
  if (/achete|acheter|buy|commande/.test(text)) return "Le jeu va verifier le stock, puis te faire marcher vers la boutique si necessaire.";
  if (/guilde|quete|mission|contrat/.test(text)) return "Le jeu prepare une interaction de quete avec la guilde.";
  if (/attaque|frappe|combat|tue|duel/.test(text)) return "Le jeu cible la menace la plus proche et prepare une resolution de combat.";
  if (/repos|repose|auberge|dors/.test(text)) return "Le jeu interprete une action de recuperation.";
  if (/va|vais|aller|rejoins|rejoindre/.test(text)) {
    return `Le jeu interprete un deplacement depuis ${screenLabel(chunkOf(state.player.x, state.player.y).cx, chunkOf(state.player.x, state.player.y).cy)}.`;
  }
  return "Le jeu va interpreter ton intention librement et appliquer le resultat le plus coherent.";
}

function describeResolvedIntent(rawText: string, outcome: SoloOutcome, next: SoloGameState): string {
  if (outcome.buyItemName) return `Acheter ${outcome.buyItemName}.`;
  if (outcome.requestQuest) return "Prendre une mission de guilde.";
  if (outcome.attackNearestHostile) return "Attaquer l ennemi le plus proche.";
  if (outcome.destroyTarget) return "Detruire un obstacle proche.";
  if (outcome.talkToNearestNpc && outcome.npcSpeech) return "Dialoguer avec le PNJ le plus proche.";
  if (outcome.moveToPoi) return `Se rendre vers ${poiDisplayName(outcome.moveToPoi)}.`;
  if (outcome.moveBy) return "Se deplacer dans la zone actuelle.";
  return describeTypedIntent(next, rawText);
}

function collectChunkPoiMarkers(
  state: SoloGameState,
  cx: number,
  cy: number
): Array<{ poi: Exclude<PoiType, null>; label: string; x: number; y: number; near: boolean }> {
  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;
  const groups = new Map<Exclude<PoiType, null>, Array<{ x: number; y: number }>>();

  for (let y = startY; y < startY + CHUNK_SIZE; y += 1) {
    for (let x = startX; x < startX + CHUNK_SIZE; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      if (!tile?.poi) continue;
      const poi = tile.poi;
      const list = groups.get(poi) ?? [];
      list.push({ x, y });
      groups.set(poi, list);
    }
  }

  return Array.from(groups.entries())
    .map(([poi, tiles]) => {
      const averageX = tiles.reduce((sum, entry) => sum + entry.x, 0) / tiles.length;
      const averageY = tiles.reduce((sum, entry) => sum + entry.y, 0) / tiles.length;
      return {
        poi,
        label: poi === "house" ? "Maisons" : poiDisplayName(poi),
        x: averageX,
        y: averageY,
        near: hasPoiNearby(state, poi, 1),
      };
    })
    .sort((a, b) => a.y - b.y);
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
  const x = Math.round(centerX - width / 2);
  const y = Math.round(topY - 18);
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
  ctx.fillText(label, Math.round(centerX), y + 13);
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
  if (actor.patrol?.axis === "x") return ["left", "right"];
  if (actor.patrol?.axis === "y") return ["up", "down"];
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
  if (actor.patrol?.axis === "x") {
    return current === "left" ? "right" : "left";
  }
  if (actor.patrol?.axis === "y") {
    return current === "up" ? "down" : "up";
  }
  const opposite = oppositeFacing(current);
  if (allowed.includes(opposite)) return opposite;
  return pickNextFacing(current, allowed);
}

function oppositeFacing(facing: Facing): Facing {
  if (facing === "up") return "down";
  if (facing === "down") return "up";
  if (facing === "left") return "right";
  return "left";
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
  if (kind === "animal") return randomBetween(2200, 6400);
  if (kind === "monster" || kind === "boss") return randomBetween(2600, 7600);
  return randomBetween(2800, 8400);
}

function nextMoveInterval(kind: WorldActor["kind"]): number {
  if (kind === "animal") return randomBetween(5200, 8200);
  if (kind === "monster" || kind === "boss") return randomBetween(5800, 9000);
  return randomBetween(6200, 9600);
}

function moveDuration(kind: WorldActor["kind"]): number {
  if (kind === "animal") return randomBetween(780, 1120);
  if (kind === "monster" || kind === "boss") return randomBetween(860, 1220);
  return randomBetween(920, 1280);
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
  bubble: BubbleState | null,
  cache: Map<string, HTMLImageElement>,
  wanderMap: Map<string, WanderState>,
  playerRender: PlayerRenderState | null,
  sceneMode: SceneMode,
  paused: boolean,
  pinnedActorId: string | null,
  trail: TrailEntry[],
  focusedPoi: Exclude<PoiType, null> | null,
  deathFx: DeathFx[]
): void {
  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;
  const field = cache.get(BASE_ASSETS.field);
  const floor = cache.get(BASE_ASSETS.floor);
  const floorB = cache.get(BASE_ASSETS.floorB);
  const nature = cache.get(BASE_ASSETS.nature);
  const house = cache.get(BASE_ASSETS.house);
  const desert = cache.get(BASE_ASSETS.desert);
  const dungeon = cache.get(BASE_ASSETS.dungeon);
  const water = cache.get(BASE_ASSETS.water);
  const rock = cache.get(BASE_ASSETS.rock);
  const chest = cache.get(BASE_ASSETS.chest);
  const bubbleIcon = cache.get(BASE_ASSETS.dialogInfo);
  const playerPose = playerRender
    ? getPlayerRenderPose(playerRender, now)
    : { x: state.player.x, y: state.player.y, facing: "down" as Facing, moving: false };

  const tiles = tilesForChunk(state, cx, cy);

  for (const entry of tiles) {
    const lx = entry.x - startX;
    const ly = entry.y - startY;
    const px = offsetX + lx * TILE_PX;
    const py = offsetY + ly * TILE_PX;
    const tile = entry.tile;

    const terrainPick = pickTerrainTile(tile.terrain, entry.x, entry.y, sceneMode);
    const terrainImage =
      terrainPick.sheet === "field"
        ? field
        : terrainPick.sheet === "floor"
          ? floor
          : terrainPick.sheet === "floorB"
            ? floorB
            : terrainPick.sheet === "house"
              ? house
              : terrainPick.sheet === "desert"
                ? desert
                : terrainPick.sheet === "dungeon"
                  ? dungeon
                  : terrainPick.sheet === "water"
                    ? water
                    : field;

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
      ctx.fillStyle = "rgba(73, 43, 18, 0.2)";
      ctx.fillRect(px + 2, py + 2, TILE_PX - 4, TILE_PX - 4);
    }

    if ((tile.terrain === "water" || terrainPick.sheet === "water") && water) {
      drawSprite(ctx, water, terrainPick.sx, terrainPick.sy, 16, 16, px, py, TILE_PX, TILE_PX);
    }

    if (tile.prop === "tree" && nature) {
      const variants: Array<[number, number]> = [
        [0, 0],
        [32, 0],
        [0, 32],
        [32, 32],
      ];
      const [treeSx, treeSy] = variants[(entry.x * 3 + entry.y * 5) % variants.length] ?? variants[0];
      drawSprite(
        ctx,
        nature,
        treeSx,
        treeSy,
        32,
        32,
        px - Math.floor(TILE_PX * 0.18),
        py - Math.floor(TILE_PX * 0.42),
        Math.floor(TILE_PX * 1.34),
        Math.floor(TILE_PX * 1.34)
      );
    } else if (tile.prop === "stump" && nature) {
      drawSprite(ctx, nature, 0, 128, 16, 16, px + 8, py + 14, TILE_PX - 14, TILE_PX - 14);
    } else if (tile.prop === "rock" && rock) {
      drawSprite(ctx, rock, 0, 0, rock.width, rock.height, px + 5, py + 6, TILE_PX - 9, TILE_PX - 9);
    } else if (tile.prop === "cactus" && desert) {
      drawSprite(ctx, desert, 96, 0, 16, 32, px + 10, py + 2, TILE_PX - 16, TILE_PX - 2);
    } else if (tile.prop === "palm" && desert) {
      drawSprite(ctx, desert, 160, 64, 32, 32, px - 3, py - 8, TILE_PX * 1.2, TILE_PX * 1.2);
    } else if (tile.prop === "ruin" && desert) {
      drawSprite(ctx, desert, 126, 42, 32, 25, px + 2, py + 8, TILE_PX - 4, TILE_PX - 8);
    } else if (tile.prop === "crate" && chest) {
      drawSprite(ctx, chest, 0, 0, chest.width, chest.height, px + 6, py + 6, TILE_PX - 10, TILE_PX - 10);
    }
  }

  const activeTrail = trail
    .filter((entry) => entry.chunkKey === `${cx}_${cy}`)
    .slice(-20);
  for (const entry of activeTrail) {
    const age = Date.now() - entry.startedAt;
    const fade = clamp(1 - age / 5600, 0.14, 0.58);
    const px = offsetX + (entry.x - startX) * TILE_PX;
    const py = offsetY + (entry.y - startY) * TILE_PX;
    ctx.fillStyle = `rgba(196, 205, 214, ${0.1 * fade})`;
    ctx.fillRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8);
    ctx.strokeStyle = `rgba(228, 236, 246, ${0.16 * fade})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 6, py + 6, TILE_PX - 12, TILE_PX - 12);
  }

  const decors = getDecorsForChunk(cx, cy);
  for (const decor of decors) {
    const px = offsetX + (decor.x - startX) * TILE_PX;
    const py = offsetY + (decor.y - startY) * TILE_PX;
    drawDecor(ctx, decor.kind, px, py, decor.w * TILE_PX, decor.h * TILE_PX, {
      house,
      desert,
      field,
      nature,
      chest,
    });
  }

  const poiMarkers = collectChunkPoiMarkers(state, cx, cy);
  for (const marker of poiMarkers) {
    const px = offsetX + (marker.x - startX) * TILE_PX;
    const py = offsetY + (marker.y - startY) * TILE_PX;
    const isFocused = focusedPoi === marker.poi;
    if (marker.near || isFocused) {
      ctx.save();
      ctx.strokeStyle = isFocused ? "rgba(255, 222, 145, 0.94)" : "rgba(116, 213, 255, 0.7)";
      ctx.fillStyle = isFocused ? "rgba(255, 210, 108, 0.14)" : "rgba(98, 184, 240, 0.12)";
      ctx.lineWidth = isFocused ? 2.5 : 2;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, TILE_PX - 4, TILE_PX - 4, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    drawPoiLabel(ctx, marker.label, px + TILE_PX / 2, py - 8, marker.near, isFocused);
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

  const playerInChunk =
    chunkOf(state.player.x, state.player.y).cx === cx && chunkOf(state.player.x, state.player.y).cy === cy;

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
      const frame = entry.moving ? moveFrame : 0;
      const row = entry.facing === "down" ? 0 : entry.facing === "up" ? 3 : entry.facing === "left" ? 1 : 2;
      const movingLeft = entry.facing === "left";

      drawShadow(ctx, localX + TILE_PX / 2, localY + TILE_PX - 5, 10, 0.28);
      if (sprite.width >= 64 && sprite.height >= 64) {
        drawSprite(ctx, sprite, frame * 16, row * 16, 16, 16, localX, localY, TILE_PX, TILE_PX);
      } else {
        const animalFrame = entry.moving ? Math.floor(now * 0.0024 + hashFloat(entry.actor.id) * 5) % 2 : 0;
        drawSpriteFlip(
          ctx,
          sprite,
          animalFrame * 16,
          0,
          16,
          16,
          localX + 2,
          localY + 6,
          TILE_PX - 4,
          TILE_PX - 4,
          !!movingLeft
        );
      }

      if (bubble && bubble.actorId === entry.actor.id && bubble.expiresAt > Date.now() && bubbleIcon) {
        drawSprite(ctx, bubbleIcon, 0, 0, bubbleIcon.width, bubbleIcon.height, localX + 6, localY - 18, 20, 20);
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
        const frame = moving ? Math.floor(now * 0.0065) % 4 : 0;
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
        const pick = (x + y) % 2 === 0 ? { sx: 0, sy: 96 } : { sx: 16, sy: 96 };
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
  if (kind === "guild_flag" && assets.nature) {
    drawSprite(ctx, assets.nature, 0, 224, 16, 16, x, y, TILE_PX, TILE_PX);
    return;
  }
  if (kind === "shop_stall" && assets.house) {
    drawSprite(ctx, assets.house, 320, 240, 48, 32, x + 3, y + 4, w, h + Math.floor(TILE_PX * 0.6));
    return;
  }
  if (kind === "inn_sign" && assets.house) {
    drawSprite(ctx, assets.house, 96, 64, 16, 16, x, y, TILE_PX, TILE_PX);
    return;
  }
  if (kind === "dungeon_gate" && assets.desert) {
    drawSprite(ctx, assets.desert, 160, 112, 32, 32, x, y, w, h);
    return;
  }
  if (kind === "boss_gate" && assets.desert) {
    ctx.save();
    ctx.filter = "hue-rotate(-25deg) saturate(1.2)";
    drawSprite(ctx, assets.desert ?? assets.house ?? assets.field!, 192, 112, 32, 32, x, y, w, h);
    ctx.restore();
  }
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

function pickTerrainTile(terrain: string, x: number, y: number, sceneMode: SceneMode): {
  sheet: "field" | "floor" | "floorB" | "house" | "desert" | "dungeon" | "water";
  sx: number;
  sy: number;
  sw: number;
  sh: number;
} {
  const pick = (choices: Array<[number, number]>): [number, number] => {
    const idx = Math.abs(x * 11 + y * 7 + x * y) % choices.length;
    return choices[idx] ?? choices[0];
  };

  if (sceneMode === "dungeon" || sceneMode === "boss") {
    const [sx, sy] = pick([
      [0, 16],
      [16, 16],
      [32, 16],
    ]);
    return { sheet: "dungeon", sx, sy, sw: 16, sh: 16 };
  }

  if (terrain === "forest") {
    const [sx, sy] = pick([
      [16, 32],
      [32, 32],
      [16, 64],
      [32, 64],
    ]);
    return { sheet: "field", sx, sy, sw: 16, sh: 16 };
  }
  const inVillageChunk = x >= 16 && x < 32 && y >= 16 && y < 32;
  if (terrain === "village") {
    const [sx, sy] = pick([
      [304, 80],
      [320, 80],
      [336, 80],
      [352, 80],
      [304, 96],
      [320, 96],
    ]);
    return { sheet: "house", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "road" && inVillageChunk) {
    const [sx, sy] = pick([
      [400, 48],
      [432, 48],
      [400, 64],
      [304, 176],
      [320, 176],
      [432, 192],
    ]);
    return { sheet: "house", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "desert" || terrain === "road" || terrain === "grass") {
    const [sx, sy] = pick([
      [0, 0],
      [16, 0],
      [32, 0],
    ]);
    return { sheet: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "water") {
    const [sx, sy] = pick([
      [0, 0],
      [16, 0],
    ]);
    return { sheet: "water", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "dungeon" || terrain === "stone" || terrain === "boss") {
    const [sx, sy] = pick([
      [0, 16],
      [16, 16],
      [32, 16],
    ]);
    return { sheet: "dungeon", sx, sy, sw: 16, sh: 16 };
  }
  const [sx, sy] = pick([
    [16, 32],
    [32, 32],
    [16, 64],
    [32, 64],
  ]);
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
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!v.player || typeof v.player !== "object") return false;
  if (!Array.isArray(v.tiles) || !Array.isArray(v.actors) || !Array.isArray(v.log)) return false;
  return true;
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
  const next = { ...state, player: { ...state.player } };
  if (!next.player.rank) {
    next.player.rank = computeRankFromQuests(next);
  }
  if (typeof next.player.equippedItemId === "undefined") {
    next.player.equippedItemId = null;
  }
  if (typeof next.player.equippedItemName === "undefined") {
    next.player.equippedItemName = null;
  }
  if (typeof next.player.equippedItemSprite === "undefined") {
    next.player.equippedItemSprite = null;
  }
  if (!Number.isFinite(next.player.x) || !Number.isFinite(next.player.y)) {
    next.player.x = 24;
    next.player.y = 25;
  }
  if (next.player.x < 0 || next.player.y < 0 || next.player.x >= next.worldWidth || next.player.y >= next.worldHeight) {
    next.player.x = Math.min(Math.max(24, 0), next.worldWidth - 1);
    next.player.y = Math.min(Math.max(25, 0), next.worldHeight - 1);
  }
  if (!next.player.characterWalk || !next.player.characterIdle) {
    next.player.characterWalk =
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/Boy/SeparateAnim/Walk.png";
    next.player.characterIdle =
      "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Actor/Characters/Boy/SeparateAnim/Idle.png";
  }
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
