import { CONFIG } from "./config";

export type ShopCatalogEntry = {
  id: string;
  name: string;
  price: number;
  aliases: string[];
  effect?: string;
  value?: number;
};

export const SHOP_CATALOG: ShopCatalogEntry[] = CONFIG.shop.catalog.map((entry) => ({
  id: entry.id,
  name: entry.name,
  price: entry.price,
  aliases: [...entry.aliases],
  effect: entry.effect,
  value: entry.value,
}));

export function getShopDiscountPercent(raw: number | null | undefined): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(CONFIG.shop.maxDiscountPercent, Math.round(raw ?? 0)));
}

export function getShopPrice(entry: ShopCatalogEntry, discountPercent?: number | null): number {
  const safeDiscount = getShopDiscountPercent(discountPercent);
  return Math.max(1, Math.floor((entry.price * (100 - safeDiscount)) / 100));
}

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

export function renderShopStockList(discountPercent?: number | null): string {
  const safeDiscount = getShopDiscountPercent(discountPercent);
  const items = SHOP_CATALOG.map((entry) => `${entry.name.toLowerCase()} (${getShopPrice(entry, safeDiscount)} or)`);
  const discountLabel = safeDiscount > 0 ? ` Remise active: -${safeDiscount}%.` : "";
  return `Stock: ${items.join(", ")}.${discountLabel}`;
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
