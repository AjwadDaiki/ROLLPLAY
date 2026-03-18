// ─── Oracle20 V2 — Centralized Configuration ───
// Zero magic numbers in business logic. All constants live here.

export const CONFIG = {
  world: {
    width: 48,
    height: 48,
    chunkSize: 16,
  },

  player: {
    startHp: 10,
    startMaxHp: 10,
    startLives: 3,
    startMaxLives: 3,
    startGold: 10,
    startTorches: 1,
    startStrength: 6,
    startSpeed: 5,
    startWillpower: 5,
    startMagic: 4,
    startAura: 5,
    startDefense: 4,
    startPrecision: 5,
    startEvasion: 4,
    startPerception: 5,
    startDiscretion: 4,
    startChance: 5,
    startInitiative: 5,
    startCharisma: 5,
    startEndurance: 5,
    startResonance: 4,
    maxStress: 100,
    maxStrength: 99,
    respawnPosition: { x: 24, y: 25 },
    deathGoldLossPercent: 50,
    deathStressRelief: 15,
    maxMovePerTurn: 10,
    maxPoiPathSteps: 12,
  },

  combat: {
    baseDamageHostile: 2,
    bossDamageMax: 4,
    monsterDamageMax: 2,
    bossCompletionGold: 40,
    regularEnemyGold: 8,
    stressReliefOnKill: 8,
    stressGainOnHit: 6,
    damageOnFailedAttack: 2,
    failedAttackRollThreshold: 5,
    strengthDivisor: 3,
    threatDamageDivisor: 14,
    followerDamageDivisor: 8,
    followerDamageMin: 2,
    followerDamageMax: 8,
    hostileAiDamageDivisor: 10,
    hostileAiBossDamageMax: 6,
    hostileAiNormalDamageMax: 3,
    fearThresholdOffset: 10,
  },

  shop: {
    defaultResalePercent: 55,
    maxDiscountPercent: 60,
    negotiateMaxDiscount: 35,
    fallbackSellPriceWithSprite: 5,
    fallbackSellPriceNoSprite: 3,
    catalog: [
      { id: "potion_heal", name: "Potion de soin", price: 12, aliases: ["potion", "potion de soin", "soin", "heal"], effect: "heal", value: 5 },
      { id: "torch", name: "Torche", price: 8, aliases: ["torche", "torch", "flamme"], effect: "light", value: 1 },
      { id: "rope", name: "Corde solide", price: 10, aliases: ["corde", "corde solide", "rope", "hook"], effect: "utility", value: 1 },
      { id: "sword_iron", name: "Epee en fer", price: 18, aliases: ["epee", "epee de base", "epee en fer", "sword", "lame"], effect: "weapon", value: 4 },
      { id: "food", name: "Ration", price: 6, aliases: ["ration", "nourriture", "food", "pain"], effect: "heal", value: 3 },
      { id: "shield_wood", name: "Bouclier en bois", price: 15, aliases: ["bouclier", "shield", "bouclier en bois"], effect: "defense", value: 3 },
      { id: "herb_antistress", name: "Herbe apaisante", price: 10, aliases: ["herbe", "herbe apaisante", "calmant"], effect: "stress_relief", value: 8 },
      { id: "bomb_small", name: "Petite bombe", price: 20, aliases: ["bombe", "petite bombe", "explosif"], effect: "damage", value: 10 },
      { id: "lockpick", name: "Crochet de serrure", price: 14, aliases: ["crochet", "lockpick", "crochet de serrure"], effect: "utility", value: 1 },
      { id: "amulet_luck", name: "Amulette de chance", price: 25, aliases: ["amulette", "amulet", "chance"], effect: "buff", value: 2 },
    ],
  },

  ai: {
    model: "llama-3.3-70b-versatile",
    intentTemperature: 0.3,
    narrativeTemperature: 0.55,
    intentMaxTokens: 200,
    narrativeMaxTokens: 500,
    timeoutMs: 12000,
    maxRetries: 2,
    retryDelaysMs: [1000, 2500],
  },

  reputation: {
    militiaHostileThreshold: -12,
    bountyThreshold: -20,
    heroTitleThreshold: 30,
    protectorTitleThreshold: 16,
    outlawCrimeThreshold: 20,
    killHostileHeroDelta: 4,
    killBossHeroDelta: 15,
    killInnocentSeverity: 8,
    killAnimalSeverity: 4,
    killMonstersFactionDelta: -2,
    guildDeltaDivisor: 2,
  },

  worldEvents: {
    minTurnsBetween: 8,
    maxTurnsBetween: 16,
    initialCountdown: 8,
  },

  interaction: {
    nearbyActorRange: 5,
    nearbyActorMax: 8,
    nearbyPoiRange: 1,
    attackRange: 1,
    talkRange: 2,
    recruitRange: 3,
    stealRange: 2,
    approachStepsDefault: 6,
    approachStepsMax: 8,
    maxPathfindingSteps: 320,
  },

  spawning: {
    maxSpawnsPerTurn: 3,
    maxTerrainChanges: 6,
    maxActorHp: 120,
    defaultPatrol: { axis: "x" as const, range: 0.6, speed: 0.8 },
    militiaSpawnPosition: { x: 22, y: 23 },
    raidSpawnPosition: { x: 31, y: 23 },
  },

  cascade: {
    maxDepth: 4,
    maxOpsPerAction: 24,
    maxSpawns: 4,
    maxTileMutations: 32,
  },

  inn: {
    stressReliefOnVisit: 2,
    stressReliefOnTalk: 12,
    healOnTalk: 2,
  },

  rank: {
    thresholds: { S: 3, A: 2, B: 1, C: 0 } as Record<string, number>,
  },

  log: {
    maxEntries: 320,
    trimTo: 260,
    worldTickMaxEntries: 340,
    worldTickTrimTo: 280,
  },

  rendering: {
    tilePx: 30,
    slideMs: 220,
    saveDebounceMs: 320,
    moveIntervalMs: 138,
    maxSpeechBubbles: 14,
    requestTimeoutMs: 9000,
  },

  steal: {
    legendaryDC: 18,
    actorDC: 14,
    structureDC: 12,
    failedStealSeverityActor: 6,
    failedStealSeverityStructure: 4,
  },

  negotiate: {
    rollThreshold: 12,
    bonusLegendary: 12,
    bonusCritical: 8,
    bonusSuccess: 5,
  },

  recruit: {
    monsterThreshold: 15,
    animalThreshold: 11,
    guardThreshold: 18,
    npcThreshold: 13,
    minLoyalty: 62,
    minMorale: 58,
  },

  destroy: {
    maxRange: 3,
    terrainChangeRange: 6,
    propDrops: {
      tree: "bois",
      rock: "pierre brute",
      default: "materiau",
    } as Record<string, string>,
  },
} as const;

// ─── D20 Roll Tiers ───
export type RollTier = "catastrophe" | "failure" | "partial" | "success" | "critical" | "legendary";

export function getRollTier(roll: number): RollTier {
  if (roll <= 1) return "catastrophe";
  if (roll <= 5) return "failure";
  if (roll <= 10) return "partial";
  if (roll <= 14) return "success";
  if (roll <= 19) return "critical";
  return "legendary";
}

export function rollD20(): number {
  return 1 + Math.floor(Math.random() * 20);
}
