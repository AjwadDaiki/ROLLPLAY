const BASE_UI =
  "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Ui/Skill Icon";
const BASE_ITEMS = "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Items";

const DEFAULT_ICON = `${BASE_UI}/Items & Weapon/Scroll.png`;
const DEFAULT_EMOJI = "item";

type AssetPreset = {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  sprite?: string;
  keywords: string[];
};

const PRESETS: AssetPreset[] = [
  {
    id: "sword_iron",
    name: "Epee en fer",
    icon: `${BASE_UI}/Items & Weapon/Guard.png`,
    emoji: "sword",
    sprite: `${BASE_ITEMS}/Weapons/Sword/SpriteInHand.png`,
    keywords: ["epee", "sword", "lame", "blade", "katana"],
  },
  {
    id: "shield_wood",
    name: "Bouclier",
    icon: `${BASE_UI}/Items & Weapon/Armor.png`,
    emoji: "shield",
    keywords: ["bouclier", "shield", "parade"],
  },
  {
    id: "bow_wood",
    name: "Arc",
    icon: `${BASE_UI}/Items & Weapon/Arrow.png`,
    emoji: "bow",
    sprite: `${BASE_ITEMS}/Weapons/Bow/Sprite.png`,
    keywords: ["arc", "bow", "fleche", "arrow"],
  },
  {
    id: "staff_magic",
    name: "Baton magique",
    icon: `${BASE_UI}/Spell/MagicWeapon.png`,
    emoji: "staff",
    sprite: `${BASE_ITEMS}/Weapons/MagicWand/SpriteInHand.png`,
    keywords: ["baton", "staff", "magic", "mage", "sort"],
  },
  {
    id: "potion_heal",
    name: "Potion de soin",
    icon: `${BASE_UI}/Job & Action/Potion.png`,
    emoji: "potion",
    sprite: `${BASE_ITEMS}/Potion/LifePot.png`,
    keywords: ["potion", "soin", "heal", "elixir"],
  },
  {
    id: "gold_coin",
    name: "Piece d or",
    icon: `${BASE_UI}/Items & Weapon/Money.png`,
    emoji: "gold",
    sprite: `${BASE_ITEMS}/Treasure/GoldCoin.png`,
    keywords: ["or", "gold", "coin", "argent", "money", "piece"],
  },
  {
    id: "gem_blue",
    name: "Cristal",
    icon: `${BASE_UI}/Items & Weapon/Ring.png`,
    emoji: "gem",
    keywords: ["gem", "cristal", "pierre", "relique"],
  },
  {
    id: "pickaxe",
    name: "Pioche",
    icon: `${BASE_UI}/Job & Action/Mine.png`,
    emoji: "pickaxe",
    sprite: `${BASE_ITEMS}/Tool/Pickaxe.png`,
    keywords: ["pioche", "pickaxe", "mine", "miner"],
  },
  {
    id: "bomb",
    name: "Bombe",
    icon: `${BASE_UI}/Spell/Explosion.png`,
    emoji: "bomb",
    sprite: `${BASE_ITEMS}/Projectile/Bomb.png`,
    keywords: ["bombe", "bomb", "explosif", "dynamite"],
  },
  {
    id: "food",
    name: "Ration",
    icon: `${BASE_UI}/Job & Action/Cook.png`,
    emoji: "food",
    keywords: ["nourriture", "food", "ration", "viande", "pain"],
  },
  {
    id: "wood_log",
    name: "Bois",
    icon: `${BASE_UI}/Job & Action/Harvest.png`,
    emoji: "wood",
    sprite: `${BASE_ITEMS}/Resource/Branch.png`,
    keywords: ["bois", "wood", "branche", "tronc"],
  },
  {
    id: "torch",
    name: "Torche",
    icon: `${BASE_UI}/Job & Action/Interact.png`,
    emoji: "fire",
    keywords: ["torche", "torch", "flamme", "feu"],
  },
  {
    id: "rope",
    name: "Corde solide",
    icon: `${BASE_UI}/Items & Weapon/Hook.png`,
    emoji: "rope",
    keywords: ["corde", "rope", "hook", "grappin"],
  },
];

export type ResolvedItemAsset = {
  itemId: string | null;
  id: string;
  name: string;
  icon: string;
  sprite: string | null;
  emoji: string;
};

export function resolveItemAsset(rawName: string): ResolvedItemAsset {
  const name = rawName.trim() || "Objet inconnu";
  const normalized = normalizeText(name);

  let best: AssetPreset | null = null;
  let bestScore = 0;

  for (const preset of PRESETS) {
    let score = 0;
    for (const keyword of preset.keywords) {
      if (normalized.includes(keyword)) score += 2;
    }
    if (normalized.includes(normalizeText(preset.name))) score += 1;
    if (score > bestScore) {
      best = preset;
      bestScore = score;
    }
  }

  if (!best || bestScore === 0) {
    return {
      itemId: null,
      id: toLocalId(name),
      name,
      icon: DEFAULT_ICON,
      sprite: null,
      emoji: guessEmoji(normalized),
    };
  }

  return {
    itemId: best.id,
    id: best.id,
    name: best.name,
    icon: best.icon,
    sprite: best.sprite ?? null,
    emoji: best.emoji,
  };
}

function guessEmoji(normalized: string): string {
  if (normalized.includes("epee") || normalized.includes("sword")) return "sword";
  if (normalized.includes("arc") || normalized.includes("bow")) return "bow";
  if (normalized.includes("bouclier") || normalized.includes("shield")) return "shield";
  if (normalized.includes("potion") || normalized.includes("heal")) return "potion";
  if (normalized.includes("or") || normalized.includes("gold") || normalized.includes("coin")) return "gold";
  if (normalized.includes("gem") || normalized.includes("cristal")) return "gem";
  if (normalized.includes("bois") || normalized.includes("wood")) return "wood";
  if (normalized.includes("feu") || normalized.includes("torche") || normalized.includes("torch")) return "fire";
  return DEFAULT_EMOJI;
}

function toLocalId(text: string): string {
  return normalizeText(text)
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
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
