import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";

type SoloGameState = import("../lib/solo/types").SoloGameState;
type SoloOutcome = import("../lib/solo/types").SoloOutcome;
type PlayerInteractionRequest = import("../lib/solo/types").PlayerInteractionRequest;

type HarnessCase = {
  id: string;
  actionText: string;
  setup: (state: SoloGameState) => SoloGameState;
  interaction?: PlayerInteractionRequest | null;
  expectedMention?: string | null;
  expectedVerb?: string | null;
  expectedSupported?: boolean;
};

type CaseResult = {
  id: string;
  actionText: string;
  targetRef: string | null;
  resolvedVerb: string | null;
  sandboxHandled: boolean;
  usedWorldOps: boolean;
  legacyHandled: boolean;
  genericFallback: boolean;
  semanticMiss: boolean;
  coercedToTalk: boolean;
  unsupportedSafelyContained: boolean;
  rerouteSuspicious: boolean;
  error?: string | null;
};

delete process.env.GROQ_API_KEY;
delete process.env.GROQ_MODEL;

async function main(): Promise<void> {
  const world = await import("../lib/solo/world");
  const logic = await import("../lib/solo/logic");
  const resolveLib = await import("../lib/solo/resolve");
  const interactionLib = await import("../lib/solo/interaction");

  const base = world.createInitialSoloState({
    playerName: "Stress",
    powerText: "je casse les limites",
    powerRoll: 12,
    powerAccepted: true,
    characterId: "Boy",
  });

  const cases = buildHarnessCases(base, interactionLib.findWorldEntityByRef);
  const results: CaseResult[] = [];

  for (const testCase of cases) {
    try {
      const initial = testCase.setup(cloneState(base));
      const interaction = testCase.interaction ? { ...testCase.interaction } : null;
      const context = logic.buildActionContext(initial, interaction);
      const outcome = await resolveLib.resolveSoloAction({
        actionText: testCase.actionText,
        context,
        interaction,
        state: initial,
      });
      logic.applyOutcome(initial, outcome, interaction);
      results.push(classifyResult(testCase, outcome));
    } catch (error) {
      results.push({
        id: testCase.id,
        actionText: testCase.actionText,
        targetRef: null,
        resolvedVerb: null,
        sandboxHandled: false,
        usedWorldOps: false,
        legacyHandled: false,
        genericFallback: false,
        semanticMiss: false,
        coercedToTalk: false,
        unsupportedSafelyContained: false,
        rerouteSuspicious: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const report = renderReport(results);
  const outputPath = resolvePath("docs", "SANDBOX_GENERALIZATION_REPORT.md");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, report, "utf8");
  process.stdout.write(report);

  if (results.some((entry) => entry.error)) {
    process.exitCode = 1;
  }
}

function buildHarnessCases(
  base: SoloGameState,
  findWorldEntityByRef: (state: SoloGameState, ref: string | null | undefined) => unknown
): HarnessCase[] {
  const shopkeeper = base.actors.find((actor) => actor.id === "npc_shopkeeper");
  const guildMaster = base.actors.find((actor) => actor.id === "npc_guild_master");
  const guard = base.actors.find((actor) => actor.id === "npc_guard_road");
  const villager = base.actors.find((actor) => actor.id === "npc_villager_square_a");
  const boss = base.actors.find((actor) => actor.kind === "boss");
  const monster = base.actors.find((actor) => actor.kind === "monster");
  const shop = findWorldEntityByRef(base, "structure:shop") as { x: number; y: number } | null;
  const guild = findWorldEntityByRef(base, "structure:guild") as { x: number; y: number } | null;

  const forestTree = findFirstProp(base, "tree");
  const rock = findFirstProp(base, "rock");
  const ruin = findFirstProp(base, "ruin");

  const contexts = {
    shop_near: (state: SoloGameState) => placeNearActor(state, shopkeeper?.id ?? null),
    guild_near: (state: SoloGameState) => placeNearActor(state, guildMaster?.id ?? null),
    guard_near: (state: SoloGameState) => placeNearActor(state, guard?.id ?? null),
    villager_near: (state: SoloGameState) => placeNearActor(state, villager?.id ?? null),
    boss_near: (state: SoloGameState) => placeNearActor(state, boss?.id ?? null),
    monster_near: (state: SoloGameState) => placeNearActor(state, monster?.id ?? null),
    tree_near: (state: SoloGameState) => placeNearTile(state, forestTree?.x ?? 8, forestTree?.y ?? 8),
    rock_near: (state: SoloGameState) => placeNearTile(state, rock?.x ?? 35, rock?.y ?? 21),
    ruin_near: (state: SoloGameState) => placeNearTile(state, ruin?.x ?? 36, ruin?.y ?? 5),
    start: (state: SoloGameState) => state,
  } satisfies Record<string, (state: SoloGameState) => SoloGameState>;

  const templates = [
    { kind: "shop", text: "je negocie les prix", mention: "shop", verb: "negotiate", supported: true },
    { kind: "shop", text: "j achete potion de soin", mention: "shop", verb: "buy", supported: true },
    { kind: "shop", text: "je vends torche", mention: "shop", verb: "sell", supported: true },
    { kind: "shop", text: "je vole la bourse du marchand", mention: "shopkeeper", verb: "steal", supported: true },
    { kind: "guild", text: "je parle au maitre de guilde", mention: "guild_master", verb: "talk", supported: true },
    { kind: "guard", text: "je parle au garde", mention: "guard", verb: "talk", supported: true },
    { kind: "guard", text: "je vole la lance du garde", mention: "guard", verb: "steal", supported: true },
    { kind: "villager", text: "je fouille le villageois", mention: "villager", verb: "loot", supported: true },
    { kind: "boss", text: "je vole l epee du demon", mention: "boss", verb: "steal", supported: true },
    { kind: "boss", text: "je parle au roi demon", mention: "boss", verb: "talk", supported: true },
    { kind: "monster", text: "j attaque le monstre", mention: "monster", verb: "attack", supported: true },
    { kind: "tree", text: "je prends du bois", mention: "tree", verb: "take", supported: true },
    { kind: "tree", text: "je brule cet arbre", mention: "tree", verb: "burn", supported: true },
    { kind: "rock", text: "je prends la pierre du rocher", mention: "rock", verb: "take", supported: true },
    { kind: "ruin", text: "je fouille la ruine", mention: "ruin", verb: "loot", supported: true },
    { kind: "boss", text: "je veux soudoyer le roi demon avec une torche", mention: "boss", verb: "bribe", supported: false },
    { kind: "boss", text: "je desarme le roi demon", mention: "boss", verb: "disarm", supported: false },
    { kind: "guard", text: "je menotte le garde", mention: "guard", verb: "handcuff", supported: false },
    { kind: "shop", text: "je bloque l entree de la boutique", mention: "shop", verb: "block", supported: false },
    { kind: "ruin", text: "je pose un piege dans la ruine", mention: "ruin", verb: "trap", supported: false },
    { kind: "tree", text: "j embrasse cet arbre", mention: "tree", verb: "kiss", supported: false },
    { kind: "rock", text: "je prie ce rocher", mention: "rock", verb: "pray", supported: false },
    { kind: "shop_popup_mismatch", text: "je vole l epee du demon", mention: "boss", verb: "steal", supported: true },
    { kind: "shop_popup_mismatch", text: "je parle au roi demon", mention: "boss", verb: "talk", supported: true },
    { kind: "guard_popup_mismatch", text: "j achete potion de soin", mention: "shop", verb: "buy", supported: true },
    { kind: "start", text: "je prends la lune", mention: null, verb: "take", supported: false },
    { kind: "start", text: "je negocie avec le vent", mention: null, verb: "negotiate", supported: false },
    { kind: "start", text: "je vole mon ombre", mention: null, verb: "steal", supported: false },
  ];

  const cases: HarnessCase[] = [];
  let index = 0;

  while (cases.length < 1000) {
    const template = templates[index % templates.length];
    const suffix = variantSuffix(index);
    const actionText = `${template.text}${suffix}`;
    const id = `case_${String(index + 1).padStart(4, "0")}`;
    let setup = contexts.start;
    let interaction: PlayerInteractionRequest | null = null;

    if (template.kind === "shop") {
      setup = contexts.shop_near;
      interaction = { type: "context", targetRef: "structure:shop", primaryTargetRef: "structure:shop", source: "text" };
    } else if (template.kind === "guild") {
      setup = contexts.guild_near;
      interaction = { type: "talk", targetRef: `actor:${guildMaster?.id ?? "npc_guild_master"}`, primaryTargetRef: `actor:${guildMaster?.id ?? "npc_guild_master"}`, source: "text" };
    } else if (template.kind === "guard") {
      setup = contexts.guard_near;
      interaction = { type: "context", targetRef: `actor:${guard?.id ?? "npc_guard_road"}`, primaryTargetRef: `actor:${guard?.id ?? "npc_guard_road"}`, source: "text" };
    } else if (template.kind === "villager") {
      setup = contexts.villager_near;
      interaction = { type: "context", targetRef: `actor:${villager?.id ?? "npc_villager_square_a"}`, primaryTargetRef: `actor:${villager?.id ?? "npc_villager_square_a"}`, source: "text" };
    } else if (template.kind === "boss") {
      setup = contexts.boss_near;
      interaction = { type: "context", targetRef: `actor:${boss?.id ?? "hostile_7_lord"}`, primaryTargetRef: `actor:${boss?.id ?? "hostile_7_lord"}`, source: "text" };
    } else if (template.kind === "monster") {
      setup = contexts.monster_near;
      interaction = { type: "context", targetRef: `actor:${monster?.id ?? "hostile_0_goblin"}`, primaryTargetRef: `actor:${monster?.id ?? "hostile_0_goblin"}`, source: "text" };
    } else if (template.kind === "tree") {
      setup = contexts.tree_near;
      interaction = forestTree
        ? { type: "context", targetRef: `tile:${forestTree.x},${forestTree.y}`, primaryTargetRef: `tile:${forestTree.x},${forestTree.y}`, source: "text" }
        : null;
    } else if (template.kind === "rock") {
      setup = contexts.rock_near;
      interaction = rock ? { type: "context", targetRef: `tile:${rock.x},${rock.y}`, primaryTargetRef: `tile:${rock.x},${rock.y}`, source: "text" } : null;
    } else if (template.kind === "ruin") {
      setup = contexts.ruin_near;
      interaction = ruin ? { type: "context", targetRef: `tile:${ruin.x},${ruin.y}`, primaryTargetRef: `tile:${ruin.x},${ruin.y}`, source: "text" } : null;
    } else if (template.kind === "shop_popup_mismatch") {
      setup = contexts.shop_near;
      interaction = { type: "context", targetRef: "structure:shop", primaryTargetRef: "structure:shop", source: "mouse" };
    } else if (template.kind === "guard_popup_mismatch") {
      setup = contexts.guard_near;
      interaction = { type: "context", targetRef: `actor:${guard?.id ?? "npc_guard_road"}`, primaryTargetRef: `actor:${guard?.id ?? "npc_guard_road"}`, source: "mouse" };
    }

    cases.push({
      id,
      actionText,
      setup,
      interaction,
      expectedMention: template.mention,
      expectedVerb: template.verb,
      expectedSupported: template.supported,
    });
    index += 1;
  }

  return cases;
}

function classifyResult(testCase: HarnessCase, outcome: SoloOutcome): CaseResult {
  const sandboxHandled = !!outcome.actionDraft;
  const usedWorldOps = !!outcome.worldOps && outcome.worldOps.length > 0;
  const legacyHandled = !!(
    outcome.attackActorId ||
    outcome.attackNearestHostile ||
    outcome.talkToActorId ||
    outcome.talkToNearestNpc ||
    outcome.buyItemName ||
    outcome.sellItemName ||
    outcome.requestQuest ||
    outcome.moveToPoi
  );
  const genericFallback =
    !sandboxHandled &&
    !legacyHandled &&
    /maitre du jeu analyse|monde reste silencieux|tu t adresses au vide|tu t adresses a l environnement/i.test(outcome.narrative);

  const mention = testCase.expectedMention;
  const targetRef = outcome.targetRef ?? null;
  const resolvedVerb = outcome.actionDraft?.verb ?? inferLegacyVerb(outcome);
  const targetMatches = targetMatchesExpectation(targetRef, mention);
  const rerouteSuspicious = Boolean(
    !!mention &&
      !!targetRef &&
      !targetMatches
  );
  const semanticMiss = Boolean(
    testCase.expectedSupported &&
      testCase.expectedVerb &&
      resolvedVerb &&
      resolvedVerb !== testCase.expectedVerb
  );
  const coercedToTalk = Boolean(
    testCase.expectedSupported &&
      testCase.expectedVerb &&
      testCase.expectedVerb !== "talk" &&
      resolvedVerb === "talk"
  );
  const unsupportedSafelyContained = Boolean(
    testCase.expectedSupported === false &&
      !outcome.actionDraft &&
      !usedWorldOps &&
      !rerouteSuspicious
  );

  return {
    id: testCase.id,
    actionText: testCase.actionText,
    targetRef,
    resolvedVerb,
    sandboxHandled,
    usedWorldOps,
    legacyHandled,
    genericFallback,
    semanticMiss,
    coercedToTalk,
    unsupportedSafelyContained,
    rerouteSuspicious,
    error: null,
  };
}

function renderReport(results: CaseResult[]): string {
  const total = results.length;
  const crashes = results.filter((entry) => entry.error).length;
  const sandboxHandled = results.filter((entry) => entry.sandboxHandled).length;
  const withWorldOps = results.filter((entry) => entry.usedWorldOps).length;
  const legacyHandled = results.filter((entry) => entry.legacyHandled).length;
  const genericFallback = results.filter((entry) => entry.genericFallback).length;
  const semanticMiss = results.filter((entry) => entry.semanticMiss).length;
  const coercedToTalk = results.filter((entry) => entry.coercedToTalk).length;
  const unsupportedSafelyContained = results.filter((entry) => entry.unsupportedSafelyContained).length;
  const suspicious = results.filter((entry) => entry.rerouteSuspicious).length;
  const examples = {
    sandbox: results.find((entry) => entry.sandboxHandled && entry.usedWorldOps && !entry.error),
    legacy: results.find((entry) => entry.legacyHandled && !entry.sandboxHandled && !entry.error),
    fallback: results.find((entry) => entry.genericFallback && !entry.error),
    suspicious: results.find((entry) => entry.rerouteSuspicious),
    semanticMiss: results.find((entry) => entry.semanticMiss),
  };

  const lines = [
    "# Sandbox Generalization Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Total actions tested: ${total}`,
    `Crashes: ${crashes}`,
    `Handled by sandbox draft: ${sandboxHandled}`,
    `Handled by sandbox world ops: ${withWorldOps}`,
    `Handled only by legacy pipeline: ${legacyHandled}`,
    `Generic fallback/no real understanding: ${genericFallback}`,
    `Semantic misses on supported verbs: ${semanticMiss}`,
    `Supported actions coerced into talk: ${coercedToTalk}`,
    `Unsupported actions safely contained: ${unsupportedSafelyContained}`,
    `Suspicious reroutes: ${suspicious}`,
    "",
    "## Verdict",
    verdictLine(total, sandboxHandled, withWorldOps, legacyHandled, genericFallback, semanticMiss, suspicious),
    "",
    "## Examples",
    `- Sandbox: ${formatExample(examples.sandbox)}`,
    `- Legacy: ${formatExample(examples.legacy)}`,
    `- Fallback: ${formatExample(examples.fallback)}`,
    `- Semantic miss: ${formatExample(examples.semanticMiss)}`,
    `- Suspicious reroute: ${formatExample(examples.suspicious)}`,
    "",
    "## Top Remaining Limits",
    "- `steal / buy / sell / negotiate / loot / take` are now materially generalized.",
    "- `attack / talk / recruit` still lean heavily on the legacy resolver and old `SoloOutcome` flags.",
    "- Weird open-ended verbs like `soudoyer`, `desarmer`, `menotter`, `poser un piege`, `bloquer la porte` are still mostly not generalized.",
    "- The popup still sends a primary clicked target, even if the new planner can override it for some named mentions.",
    "- Server authority exists only in memory for now; it is better than before but not final.",
    "",
    "## Error Samples",
    ...results.filter((entry) => entry.error).slice(0, 12).map((entry) => `- ${entry.id}: ${entry.actionText} -> ${entry.error}`),
  ];

  return `${lines.join("\n")}\n`;
}

function verdictLine(
  total: number,
  sandboxHandled: number,
  withWorldOps: number,
  legacyHandled: number,
  genericFallback: number,
  semanticMiss: number,
  suspicious: number
): string {
  const sandboxRatio = Math.round((sandboxHandled / Math.max(1, total)) * 100);
  const worldOpsRatio = Math.round((withWorldOps / Math.max(1, total)) * 100);
  const fallbackRatio = Math.round((genericFallback / Math.max(1, total)) * 100);
  const semanticMissRatio = Math.round((semanticMiss / Math.max(1, total)) * 100);
  return `The engine is no longer purely hardcoded, but it is not yet a fully generalized sandbox. About ${sandboxRatio}% of these 1000 actions hit the new semantic draft layer, ${worldOpsRatio}% produce real generic world operations, ${fallbackRatio}% fall back to weak generic handling, and ${semanticMissRatio}% of supported requests still resolve to the wrong verb or the wrong target family.`;
}

function formatExample(entry: CaseResult | undefined): string {
  if (!entry) return "none";
  return `${entry.actionText} -> verb=${entry.resolvedVerb ?? "none"}, target=${entry.targetRef ?? "none"}`;
}

function inferLegacyVerb(outcome: SoloOutcome): string | null {
  if (outcome.buyItemName) return "buy";
  if (outcome.sellItemName) return "sell";
  if (outcome.attackActorId || outcome.attackNearestHostile) return "attack";
  if (outcome.talkToActorId || outcome.talkToNearestNpc) return "talk";
  if (outcome.requestQuest) return "quest";
  if (outcome.moveToPoi) return "move";
  if (outcome.destroyTarget) return "destroy";
  return null;
}

function targetMatchesExpectation(targetRef: string | null, mention: string | null | undefined): boolean {
  if (!mention) return !targetRef;
  if (!targetRef) return false;
  if (mention === "shop") return targetRef.includes("shop");
  if (mention === "boss") return targetRef.includes("hostile_7_lord");
  if (mention === "guard") return targetRef.includes("npc_guard_road");
  if (mention === "guild_master") return targetRef.includes("npc_guild_master");
  if (mention === "villager") return targetRef.includes("npc_villager_square_a");
  if (mention === "shopkeeper") return targetRef.includes("npc_shopkeeper");
  if (mention === "monster") return targetRef.includes("hostile_");
  if (mention === "tree" || mention === "rock" || mention === "ruin") return targetRef.startsWith("tile:");
  return targetRef.includes(mention);
}

function cloneState(state: SoloGameState): SoloGameState {
  return JSON.parse(JSON.stringify(state)) as SoloGameState;
}

function placeNearActor(state: SoloGameState, actorId: string | null): SoloGameState {
  if (!actorId) return state;
  const actor = state.actors.find((entry) => entry.id === actorId);
  if (!actor) return state;
  return placeNearTile(state, actor.x, actor.y);
}

function placeNearTile(state: SoloGameState, x: number, y: number): SoloGameState {
  const candidates = [
    { x, y: y - 1 },
    { x: x + 1, y },
    { x, y: y + 1 },
    { x: x - 1, y },
  ];
  const target =
    candidates.find((entry) => isWalkable(state, entry.x, entry.y)) ??
    candidates[0] ?? { x: state.player.x, y: state.player.y };
  state.player.x = target.x;
  state.player.y = target.y;
  return state;
}

function isWalkable(state: SoloGameState, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= state.worldWidth || y >= state.worldHeight) return false;
  const tile = state.tiles[y * state.worldWidth + x];
  const occupied = state.actors.some((actor) => actor.alive && actor.x === x && actor.y === y);
  return !!tile && !tile.blocked && !occupied;
}

function findFirstProp(state: SoloGameState, prop: SoloGameState["tiles"][number]["prop"]): { x: number; y: number } | null {
  for (let y = 0; y < state.worldHeight; y += 1) {
    for (let x = 0; x < state.worldWidth; x += 1) {
      const tile = state.tiles[y * state.worldWidth + x];
      if (tile?.prop === prop) return { x, y };
    }
  }
  return null;
}

function variantSuffix(index: number): string {
  const variants = [
    "",
    " s il te plait",
    " maintenant",
    " sans me faire voir",
    " rapidement",
    " calmement",
    " si possible",
    " avec mon pouvoir",
    " de force",
    " proprement",
  ];
  return variants[index % variants.length];
}

void main();
