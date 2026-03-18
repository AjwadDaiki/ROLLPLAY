import type { PoiType } from "./types";

type BlueprintPoi = Exclude<PoiType, null>;

export type VillageBuildingBlueprint = {
  id: string;
  poi: BlueprintPoi;
  decorKind: "house_a" | "house_b" | "house_c" | "house_d";
  decorX: number;
  decorY: number;
  decorW: number;
  decorH: number;
  serviceX: number;
  serviceY: number;
  anchorX: number;
  anchorY: number;
  label: string | null;
  showLabel: boolean;
  highlightX: number;
  highlightY: number;
  highlightW: number;
  highlightH: number;
  accents: Array<{
    id: string;
    kind: "guild_flag" | "inn_sign" | "shop_stall" | "well";
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
};

type VillageHouseBlueprint = {
  id: string;
  decorKind: "house_a" | "house_b" | "house_c" | "house_d";
  decorX: number;
  decorY: number;
  decorW: number;
  decorH: number;
  serviceX: number;
  serviceY: number;
  anchorX: number;
  anchorY: number;
  highlightX: number;
  highlightY: number;
  highlightW: number;
  highlightH: number;
};

export type VillageStructureEntity = {
  id: string;
  category: "service_building" | "house";
  biome: "village";
  decorKind: "house_a" | "house_b" | "house_c" | "house_d";
  poi: BlueprintPoi;
  x: number;
  y: number;
  w: number;
  h: number;
  serviceX: number;
  serviceY: number;
  anchorX: number;
  anchorY: number;
  label: string | null;
  showLabel: boolean;
  artProfileId: string;
  highlight: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
};

export const VILLAGE_BUILDINGS: VillageBuildingBlueprint[] = [
  {
    id: "guild",
    poi: "guild",
    decorKind: "house_a",
    decorX: 16,
    decorY: 17,
    decorW: 4,
    decorH: 4,
    serviceX: 17,
    serviceY: 21,
    anchorX: 18.1,
    anchorY: 18.1,
    label: "Guilde",
    showLabel: true,
    highlightX: 16,
    highlightY: 17,
    highlightW: 4,
    highlightH: 5,
    accents: [],
  },
  {
    id: "inn",
    poi: "inn",
    decorKind: "house_b",
    decorX: 22,
    decorY: 17,
    decorW: 4,
    decorH: 4,
    serviceX: 24,
    serviceY: 21,
    anchorX: 24.1,
    anchorY: 18.1,
    label: "Auberge",
    showLabel: true,
    highlightX: 22,
    highlightY: 17,
    highlightW: 4,
    highlightH: 5,
    accents: [],
  },
  {
    id: "shop",
    poi: "shop",
    decorKind: "house_d",
    decorX: 27,
    decorY: 17,
    decorW: 4,
    decorH: 4,
    serviceX: 28,
    serviceY: 21,
    anchorX: 29,
    anchorY: 18.1,
    label: "Boutique",
    showLabel: true,
    highlightX: 27,
    highlightY: 17,
    highlightW: 4,
    highlightH: 5,
    accents: [],
  },
];

export const VILLAGE_HOUSES: VillageHouseBlueprint[] = [
  {
    id: "house_south_west",
    decorKind: "house_b",
    decorX: 16,
    decorY: 26,
    decorW: 4,
    decorH: 4,
    serviceX: 20,
    serviceY: 28,
    anchorX: 18.1,
    anchorY: 27.25,
    highlightX: 16,
    highlightY: 26,
    highlightW: 5,
    highlightH: 4,
  },
  {
    id: "house_south_east",
    decorKind: "house_a",
    decorX: 27,
    decorY: 26,
    decorW: 4,
    decorH: 4,
    serviceX: 26,
    serviceY: 28,
    anchorX: 29,
    anchorY: 27.25,
    highlightX: 26,
    highlightY: 26,
    highlightW: 5,
    highlightH: 4,
  },
];

export const VILLAGE_GENERIC_POI = [
  {
    id: "camp",
    poi: "camp" as const,
    x: 24,
    y: 26,
    anchorX: 24,
    anchorY: 25.7,
    label: "Camp",
    showLabel: false,
    protectPath: true,
    highlight: { x: 22, y: 25, w: 4, h: 3 },
  },
];

export const VILLAGE_ACTOR_ANCHORS = [
  { actorId: "npc_guild_master", x: 17, y: 22 },
  { actorId: "npc_shopkeeper", x: 28, y: 22 },
  { actorId: "npc_innkeeper", x: 24, y: 22 },
  { actorId: "npc_villager_square_a", x: 21, y: 27 },
  { actorId: "npc_villager_square_b", x: 25, y: 29 },
  { actorId: "npc_guard_road", x: 21, y: 23 },
  { actorId: "npc_child_village", x: 25, y: 27 },
  { actorId: "animal_cat_village", x: 24, y: 29 },
];

export function createVillageStructureEntities(): VillageStructureEntity[] {
  const serviceBuildings = VILLAGE_BUILDINGS.map((building) => ({
    id: building.id,
    category: "service_building" as const,
    biome: "village" as const,
    decorKind: building.decorKind,
    poi: building.poi,
    x: building.decorX,
    y: building.decorY,
    w: building.decorW,
    h: building.decorH,
    serviceX: building.serviceX,
    serviceY: building.serviceY,
    anchorX: building.anchorX,
    anchorY: building.anchorY,
    label: building.label,
    showLabel: building.showLabel,
    artProfileId: building.decorKind,
    highlight: {
      x: building.highlightX,
      y: building.highlightY,
      w: building.highlightW,
      h: building.highlightH,
    },
  }));

  const houses = VILLAGE_HOUSES.map((house) => ({
    id: house.id,
    category: "house" as const,
    biome: "village" as const,
    decorKind: house.decorKind,
    poi: "house" as const,
    x: house.decorX,
    y: house.decorY,
    w: house.decorW,
    h: house.decorH,
    serviceX: house.serviceX,
    serviceY: house.serviceY,
    anchorX: house.anchorX,
    anchorY: house.anchorY,
    label: null,
    showLabel: false,
    artProfileId: house.decorKind,
    highlight: {
      x: house.highlightX,
      y: house.highlightY,
      w: house.highlightW,
      h: house.highlightH,
    },
  }));

  return [...serviceBuildings, ...houses];
}

export function createVillagePoiNodes() {
  const nodes = VILLAGE_BUILDINGS.map((building) => ({
    id: `${building.id}_service`,
    poi: building.poi,
    x: building.serviceX,
    y: building.serviceY,
    anchorX: building.anchorX,
    anchorY: building.anchorY,
    label: building.label,
    showLabel: building.showLabel,
    protectPath: true,
    highlight: {
      x: building.highlightX,
      y: building.highlightY,
      w: building.highlightW,
      h: building.highlightH,
    },
  }));

  const houses = VILLAGE_HOUSES.map((house) => ({
    id: house.id,
    poi: "house" as const,
    x: house.serviceX,
    y: house.serviceY,
    anchorX: house.anchorX,
    anchorY: house.anchorY,
    label: null,
    showLabel: false,
    protectPath: true,
    highlight: {
      x: house.highlightX,
      y: house.highlightY,
      w: house.highlightW,
      h: house.highlightH,
    },
  }));

  return [...VILLAGE_GENERIC_POI, ...nodes, ...houses];
}

export function createVillageDecors() {
  const decors = VILLAGE_BUILDINGS.flatMap((building) => [
    {
      id: `v_${building.id}_house`,
      screenX: 1,
      screenY: 1,
      x: building.decorX,
      y: building.decorY,
      w: building.decorW,
      h: building.decorH,
      kind: building.decorKind,
    },
    ...building.accents.map((accent) => ({
      id: `v_${building.id}_${accent.id}`,
      screenX: 1,
      screenY: 1,
      x: accent.x,
      y: accent.y,
      w: accent.w,
      h: accent.h,
      kind: accent.kind,
    })),
  ]);

  return [
    ...decors,
    {
      id: "v_square_well",
      screenX: 1,
      screenY: 1,
      x: 23,
      y: 23,
      w: 2,
      h: 2,
      kind: "well" as const,
    },
    ...VILLAGE_HOUSES.map((house) => ({
      id: `v_${house.id}`,
      screenX: 1,
      screenY: 1,
      x: house.decorX,
      y: house.decorY,
      w: house.decorW,
      h: house.decorH,
      kind: house.decorKind,
    })),
  ];
}
