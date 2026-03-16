export type ShopCatalogEntry = {
  id: string;
  name: string;
  price: number;
  aliases: string[];
};

export const SHOP_CATALOG: ShopCatalogEntry[] = [
  {
    id: "potion_heal",
    name: "Potion de soin",
    price: 12,
    aliases: ["potion", "potion de soin", "soin", "heal"],
  },
  {
    id: "torch",
    name: "Torche",
    price: 12,
    aliases: ["torche", "torch", "flamme"],
  },
  {
    id: "rope",
    name: "Corde solide",
    price: 12,
    aliases: ["corde", "corde solide", "rope", "hook"],
  },
  {
    id: "sword_iron",
    name: "Epee en fer",
    price: 12,
    aliases: ["epee", "epee de base", "epee en fer", "sword", "lame"],
  },
  {
    id: "food",
    name: "Ration",
    price: 12,
    aliases: ["ration", "nourriture", "food", "pain"],
  },
];

export function findShopCatalogEntry(rawName: string | null | undefined): ShopCatalogEntry | null {
  const normalized = normalize(rawName ?? "");
  if (!normalized) return null;

  let best: ShopCatalogEntry | null = null;
  let bestScore = 0;

  for (const entry of SHOP_CATALOG) {
    let score = 0;
    if (normalized === normalize(entry.name)) {
      score += 5;
    } else if (normalize(entry.name).includes(normalized) || normalized.includes(normalize(entry.name))) {
      score += 2;
    }

    for (const alias of entry.aliases) {
      const normalizedAlias = normalize(alias);
      if (normalized === normalizedAlias) {
        score += 4;
      } else if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : null;
}

export function renderShopStockList(): string {
  return `Stock: ${SHOP_CATALOG.map((entry) => entry.name.toLowerCase()).join(", ")}.`;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
