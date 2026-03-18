import type { TerrainType, TileProp } from "./types";

export const MAP_BASE_ASSETS = {
  field:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetField.png",
  floor:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetFloor.png",
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
  relief:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetRelief.png",
  reliefDetail:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetReliefDetail.png",
  interiorFloor:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/Interior/TilesetInteriorFloor.png",
  floorDetail:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetFloorDetail.png",
  villageAbandoned:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetVillageAbandoned.png",
  towers:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetTowers.png",
  rock:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Items/Resource/Rock.png",
  chest:
    "/assets/Ninja Adventure - Asset Pack/Ninja Adventure - Asset Pack/Items/Treasure/LittleTreasureChest.png",
} as const;

export type MapAssetKey = keyof typeof MAP_BASE_ASSETS;

export type MapSpriteFrame = {
  asset: MapAssetKey;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

export type MapLayer = MapSpriteFrame & {
  offsetX?: number;
  offsetY?: number;
  widthScale?: number;
  heightScale?: number;
  opacity?: number;
  fill?: string;
};

export type AssetCatalogEntry = MapSpriteFrame & {
  id: string;
  label: string;
  category: string;
  note: string;
};

type DecorKind =
  | "house_a"
  | "house_b"
  | "house_c"
  | "house_d"
  | "fence_h"
  | "fence_v"
  | "ruin_a"
  | "ruin_b"
  | "palm_cluster"
  | "forest_grove_a"
  | "forest_grove_b"
  | "stone_cluster"
  | "citadel_tower"
  | "well"
  | "guild_flag"
  | "shop_stall"
  | "inn_sign"
  | "dungeon_gate"
  | "boss_gate";

export type DecorStyleProfile = {
  id: DecorKind;
  label: string;
  role: "building" | "house" | "landmark" | "accent" | "gate";
  quality: "approved" | "deprecated";
  allowedTerrains: TerrainType[];
  note: string;
};

export type PropStyleProfile = {
  id: string;
  prop: TileProp;
  label: string;
  allowedTerrains: TerrainType[];
  note: string;
};

export type BiomeStyleProfile = {
  id: TerrainType;
  label: string;
  terrainAsset: string;
  approvedProps: TileProp[];
  approvedDecors: DecorKind[];
  note: string;
};

const FIELD_GRASS_VARIANTS: Array<[number, number]> = [
  [16, 64],
  [48, 48],
  [64, 48],
  [48, 64],
];

const FIELD_FOREST_VARIANTS: Array<[number, number]> = [
  [16, 112],
  [48, 96],
  [64, 96],
  [48, 112],
];

const FIELD_DESERT_VARIANTS: Array<[number, number]> = [
  [16, 160],
  [48, 144],
  [64, 144],
  [48, 160],
];

const FIELD_VILLAGE_VARIANTS: Array<[number, number]> = [
  [0, 0],
  [16, 0],
  [0, 16],
  [16, 16],
];

const FIELD_ROAD_VARIANTS: Array<[number, number]> = [
  [16, 16],
  [48, 0],
  [64, 0],
  [48, 16],
];

const INTERIOR_DUNGEON_VARIANTS: Array<[number, number]> = [
  [176, 192],
  [192, 192],
  [208, 192],
  [224, 192],
];

const INTERIOR_BOSS_VARIANTS: Array<[number, number]> = [
  [176, 208],
  [192, 208],
  [208, 208],
  [224, 208],
];

const FLOOR_GRASS_TUFT_VARIANTS: Array<[number, number]> = [
  [0, 32],
  [16, 32],
  [32, 32],
];

const DUNGEON_RUBBLE_VARIANTS: Array<[number, number]> = [
  [0, 0],
  [16, 0],
  [32, 0],
];

const DESERT_SHRUB_VARIANTS: Array<[number, number]> = [
  [160, 128],
  [192, 128],
];

export const MAP_STYLE_LIBRARY = {
  biomes: {
    grass: {
      id: "grass",
      label: "Plaine claire",
      terrainAsset: "field",
      approvedProps: ["none", "tree", "stump", "rock", "hole", "crater", "charred", "rubble"],
      approvedDecors: ["forest_grove_a", "forest_grove_b"],
      note: "Zone de transition sobre, enrichie par quelques souches et rochers.",
    },
    forest: {
      id: "forest",
      label: "Foret dense",
      terrainAsset: "field",
      approvedProps: ["none", "tree", "stump", "rock", "hole", "crater", "charred", "rubble"],
      approvedDecors: ["forest_grove_a", "forest_grove_b"],
      note: "Palette verte dense avec canopees larges, touffes d herbe et bosquets multi-tiles.",
    },
    desert: {
      id: "desert",
      label: "Mesa / desert",
      terrainAsset: "field",
      approvedProps: ["none", "cactus", "rock", "hole", "crater", "charred", "rubble"],
      approvedDecors: ["ruin_a", "ruin_b", "palm_cluster", "stone_cluster"],
      note: "Sable rose chaud, ruines completes et vegetaux desertiques; aucun morceau de tour recadre.",
    },
    village: {
      id: "village",
      label: "Cour de village",
      terrainAsset: "floor",
      approvedProps: ["none", "hole", "crater", "charred", "rubble"],
      approvedDecors: ["house_a", "house_b", "house_d", "well", "guild_flag", "inn_sign", "shop_stall"],
      note: "Sol de place orange propre, plus net que le sable du desert; les batiments reposent sur une vraie place.",
    },
    road: {
      id: "road",
      label: "Route principale",
      terrainAsset: "field",
      approvedProps: ["none", "hole", "crater", "charred", "rubble"],
      approvedDecors: ["house_a", "house_b", "house_d", "well", "guild_flag", "inn_sign", "shop_stall", "dungeon_gate"],
      note: "Terre battue chaude qui relie proprement les POI et gates.",
    },
    water: {
      id: "water",
      label: "Eau",
      terrainAsset: "water",
      approvedProps: ["none"],
      approvedDecors: [],
      note: "Frontiere externe seulement.",
    },
    stone: {
      id: "stone",
      label: "Pierre",
      terrainAsset: "interiorFloor",
      approvedProps: ["none", "rock", "crate", "hole", "crater", "charred", "rubble"],
      approvedDecors: ["dungeon_gate", "stone_cluster"],
      note: "Pierre grise utilitaire pour les transitions de donjon.",
    },
    dungeon: {
      id: "dungeon",
      label: "Donjon",
      terrainAsset: "interiorFloor",
      approvedProps: ["none", "rock", "crate", "hole", "crater", "charred", "rubble"],
      approvedDecors: ["dungeon_gate", "stone_cluster"],
      note: "Dalles sombres lisibles avec debris dedies du tileset donjon.",
    },
    boss: {
      id: "boss",
      label: "Citadelle",
      terrainAsset: "interiorFloor",
      approvedProps: ["none", "rock", "crate", "hole", "crater", "charred", "rubble"],
      approvedDecors: ["boss_gate", "stone_cluster", "citadel_tower"],
      note: "Version plus sombre et monumentale du sol donjon, reservee a la citadelle.",
    },
  } satisfies Record<TerrainType, BiomeStyleProfile>,
  decors: {
    house_a: {
      id: "house_a",
      label: "Facade guilde / maison orange",
      role: "building",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Facade complete et stable, porte lisible.",
    },
    house_b: {
      id: "house_b",
      label: "Facade auberge / maison beige",
      role: "house",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Batiment simple, sans portique parasite.",
    },
    house_c: {
      id: "house_c",
      label: "Facade a portique double",
      role: "building",
      quality: "deprecated",
      allowedTerrains: ["village", "road"],
      note: "Deprecated: provoque l effet porte devant porte et des silhouettes ambiguës.",
    },
    house_d: {
      id: "house_d",
      label: "Facade boutique rouge",
      role: "building",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Facade boutique complete sans portique coupe.",
    },
    fence_h: {
      id: "fence_h",
      label: "Cloture horizontale",
      role: "accent",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Accent secondaire.",
    },
    fence_v: {
      id: "fence_v",
      label: "Cloture verticale",
      role: "accent",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Accent secondaire.",
    },
    ruin_a: {
      id: "ruin_a",
      label: "Ruine moussue A",
      role: "landmark",
      quality: "approved",
      allowedTerrains: ["desert"],
      note: "Ruine complete du pack VillageAbandoned, adaptee au biome mesa.",
    },
    ruin_b: {
      id: "ruin_b",
      label: "Ruine moussue B",
      role: "landmark",
      quality: "approved",
      allowedTerrains: ["desert"],
      note: "Variante de ruine complete, pas de demi-batiment coupe.",
    },
    palm_cluster: {
      id: "palm_cluster",
      label: "Cluster de palmiers",
      role: "landmark",
      quality: "approved",
      allowedTerrains: ["desert"],
      note: "Vegetation desertique complete servant d oasis/landmark.",
    },
    forest_grove_a: {
      id: "forest_grove_a",
      label: "Bosquet dense A",
      role: "landmark",
      quality: "approved",
      allowedTerrains: ["forest", "grass"],
      note: "Composition multi-tiles de quatre arbres pour casser l effet petits props isoles.",
    },
    forest_grove_b: {
      id: "forest_grove_b",
      label: "Bosquet dense B",
      role: "landmark",
      quality: "approved",
      allowedTerrains: ["forest", "grass"],
      note: "Variante de bosquet multi-tiles plus ronde.",
    },
    stone_cluster: {
      id: "stone_cluster",
      label: "Amas rocheux",
      role: "landmark",
      quality: "approved",
      allowedTerrains: ["desert", "stone", "dungeon", "boss"],
      note: "Gros rocher compose pour eviter les demi-cailloux sans sens.",
    },
    citadel_tower: {
      id: "citadel_tower",
      label: "Tour de citadelle",
      role: "landmark",
      quality: "approved",
      allowedTerrains: ["boss"],
      note: "Repere architectural pour encadrer la citadelle et eviter le vide.",
    },
    well: {
      id: "well",
      label: "Puits",
      role: "accent",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Point focal de place.",
    },
    guild_flag: {
      id: "guild_flag",
      label: "Enseigne de guilde",
      role: "accent",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Accent de signalisation.",
    },
    shop_stall: {
      id: "shop_stall",
      label: "Etal de boutique",
      role: "accent",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Accent de marche, a utiliser avec parcimonie.",
    },
    inn_sign: {
      id: "inn_sign",
      label: "Enseigne auberge",
      role: "accent",
      quality: "approved",
      allowedTerrains: ["village", "road"],
      note: "Accent de service.",
    },
    dungeon_gate: {
      id: "dungeon_gate",
      label: "Entree de donjon",
      role: "gate",
      quality: "approved",
      allowedTerrains: ["road", "dungeon", "stone"],
      note: "Entree naturelle dediee.",
    },
    boss_gate: {
      id: "boss_gate",
      label: "Porte citadelle",
      role: "gate",
      quality: "approved",
      allowedTerrains: ["boss"],
      note: "Portail monumental de fin.",
    },
  } satisfies Record<DecorKind, DecorStyleProfile>,
  props: [
    {
      id: "prop.tree.full",
      prop: "tree",
      label: "Arbres canoniques",
      allowedTerrains: ["grass", "forest"],
      note: "Melange d arbres riches du tileset nature, sans sapin neige ni silhouettes mortes hors contexte.",
    },
    {
      id: "prop.stump.wood",
      prop: "stump",
      label: "Souches",
      allowedTerrains: ["grass", "forest"],
      note: "Cassent le vide dans les zones de transition.",
    },
    {
      id: "prop.rock.forest",
      prop: "rock",
      label: "Rochers contextuels",
      allowedTerrains: ["grass", "forest", "desert", "stone", "dungeon", "boss"],
      note: "Rendu different selon le biome pour eviter les carrés blancs parasites.",
    },
    {
      id: "prop.desert.shrub",
      prop: "cactus",
      label: "Shrub / palmier desertique",
      allowedTerrains: ["desert"],
      note: "Remplace l ancien faux cactus qui etait en realite un morceau de tour desertique.",
    },
    {
      id: "prop.crate.dungeon",
      prop: "crate",
      label: "Caisse donjon",
      allowedTerrains: ["dungeon", "boss"],
      note: "Petit props utilitaire lisible.",
    },
  ] satisfies PropStyleProfile[],
} as const;

export const DEPRECATED_DECOR_KINDS = Object.values(MAP_STYLE_LIBRARY.decors)
  .filter((profile) => profile.quality === "deprecated")
  .map((profile) => profile.id);

export const MAP_ASSET_CATALOG: AssetCatalogEntry[] = [
  { id: "terrain.village.floor_a", label: "Village plaza warm A", category: "terrain", note: "Sol village chaud, propre et lisible.", asset: "floor", sx: 0, sy: 0, sw: 16, sh: 16 },
  { id: "terrain.village.floor_b", label: "Village plaza warm B", category: "terrain", note: "Variante lisse pour casser la repetition.", asset: "floor", sx: 16, sy: 0, sw: 16, sh: 16 },
  { id: "terrain.village.plaza_a", label: "Village plaza A", category: "terrain", note: "Dalle orange propre pour la place du village.", asset: "floor", sx: 0, sy: 0, sw: 16, sh: 16 },
  { id: "terrain.village.plaza_b", label: "Village plaza B", category: "terrain", note: "Variante lisse de la place du village.", asset: "floor", sx: 16, sy: 16, sw: 16, sh: 16 },
  { id: "terrain.road.cobble_a", label: "Road cobble A", category: "terrain", note: "Route chaude pour les axes principaux.", asset: "field", sx: 16, sy: 16, sw: 16, sh: 16 },
  { id: "terrain.road.cobble_b", label: "Road cobble B", category: "terrain", note: "Variante route orange.", asset: "field", sx: 48, sy: 0, sw: 16, sh: 16 },
  { id: "terrain.dungeon.floor_a", label: "Dungeon floor A", category: "terrain", note: "Dalle grise lisible pour donjon.", asset: "interiorFloor", sx: 176, sy: 176, sw: 16, sh: 16 },
  { id: "terrain.dungeon.floor_b", label: "Dungeon floor B", category: "terrain", note: "Variante grise secondaire.", asset: "interiorFloor", sx: 192, sy: 176, sw: 16, sh: 16 },
  { id: "terrain.boss.floor_a", label: "Citadel floor A", category: "terrain", note: "Dalle plus noire pour la citadelle.", asset: "interiorFloor", sx: 176, sy: 256, sw: 16, sh: 16 },
  { id: "relief.border.top", label: "Relief top border", category: "relief", note: "Morceau de falaise/bord pour frontieres.", asset: "relief", sx: 32, sy: 0, sw: 32, sh: 32 },
  { id: "relief.border.side", label: "Relief side border", category: "relief", note: "Mur vertical pour limites.", asset: "relief", sx: 128, sy: 0, sw: 32, sh: 32 },
  { id: "relief.cave.entrance", label: "Cave entrance", category: "decor", note: "Entree naturelle pour donjon.", asset: "reliefDetail", sx: 0, sy: 160, sw: 64, sh: 32 },
  { id: "building.guild", label: "Guild facade", category: "building", note: "Facade utilisee pour la guilde.", asset: "house", sx: 0, sy: 0, sw: 64, sh: 64 },
  { id: "building.inn", label: "Inn facade", category: "building", note: "Facade auberge.", asset: "house", sx: 64, sy: 0, sw: 64, sh: 64 },
  { id: "building.shop", label: "Shop facade", category: "building", note: "Ancienne facade boutique a eviter a cause du double-portique.", asset: "house", sx: 128, sy: 0, sw: 64, sh: 64 },
  { id: "building.shop_alt", label: "Shop facade alt", category: "building", note: "Facade boutique complete sans double-portique.", asset: "house", sx: 192, sy: 0, sw: 64, sh: 64 },
  { id: "prop.guild_sign", label: "Guild sign", category: "prop", note: "Petit panneau pour marquer la guilde.", asset: "house", sx: 48, sy: 64, sw: 32, sh: 16 },
  { id: "prop.inn_sign", label: "Inn sign", category: "prop", note: "Enseigne auberge.", asset: "house", sx: 480, sy: 64, sw: 16, sh: 16 },
  { id: "prop.shop_stall", label: "Shop stall", category: "prop", note: "Etal de marche.", asset: "house", sx: 256, sy: 256, sw: 48, sh: 32 },
  { id: "prop.well", label: "Well", category: "prop", note: "Puits central.", asset: "house", sx: 384, sy: 32, sw: 32, sh: 32 },
  { id: "prop.tree.oak", label: "Oak tree", category: "prop", note: "Arbre rond plus riche pour les forets.", asset: "nature", sx: 96, sy: 0, sw: 32, sh: 32 },
  { id: "prop.desert.shrub", label: "Desert shrub", category: "prop", note: "Petit palmier desertique utilise a la place du faux cactus.", asset: "desert", sx: 160, sy: 128, sw: 32, sh: 32 },
  { id: "prop.dungeon.rubble", label: "Dungeon rubble", category: "prop", note: "Debris issus du tileset donjon pour casser le vide.", asset: "dungeon", sx: 0, sy: 0, sw: 16, sh: 16 },
  { id: "decor.forest.grove", label: "Forest grove", category: "decor", note: "Bosquet 2x2 compose de quatre arbres.", asset: "nature", sx: 256, sy: 32, sw: 64, sh: 32 },
  { id: "decor.stone.cluster", label: "Stone cluster", category: "decor", note: "Gros amas rocheux pour donjon/citadelle.", asset: "nature", sx: 256, sy: 224, sw: 64, sh: 64 },
  { id: "decor.citadel.tower", label: "Citadel tower", category: "decor", note: "Tour de garde stylisee pour la zone boss.", asset: "towers", sx: 224, sy: 64, sw: 32, sh: 32 },
  { id: "ruin.moss_a", label: "Moss ruin A", category: "ruin", note: "Ruine desertique plus lisible.", asset: "villageAbandoned", sx: 96, sy: 0, sw: 64, sh: 64 },
  { id: "ruin.moss_b", label: "Moss ruin B", category: "ruin", note: "Ruine secondaire.", asset: "villageAbandoned", sx: 160, sy: 0, sw: 64, sh: 64 },
  { id: "fortress.red_gate", label: "Citadel gate", category: "fortress", note: "Portail citadelle/boss.", asset: "towers", sx: 192, sy: 0, sw: 64, sh: 64 },
];

export function getRequiredMapAssetPaths(): string[] {
  return Object.values(MAP_BASE_ASSETS);
}

export function pickTerrainFrame(
  terrain: TerrainType,
  x: number,
  y: number,
  options?: { worldWidth?: number; worldHeight?: number }
): MapSpriteFrame {
  const hash = tileHash(x, y) % 4;
  const pick = (variants: Array<[number, number]>) => variants[hash % variants.length] ?? variants[0];
  const worldWidth = options?.worldWidth ?? 48;
  const worldHeight = options?.worldHeight ?? 48;
  const isWorldBorder = x === 0 || y === 0 || x === worldWidth - 1 || y === worldHeight - 1;

  if (terrain === "water" && isWorldBorder) {
    if (y === 0 || y === worldHeight - 1) {
      return { asset: "relief", sx: 32, sy: 0, sw: 32, sh: 32 };
    }
    return { asset: "relief", sx: 128, sy: 0, sw: 32, sh: 32 };
  }

  if (terrain === "grass") {
    const [sx, sy] = pick(FIELD_GRASS_VARIANTS);
    return { asset: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "forest") {
    const [sx, sy] = pick(FIELD_FOREST_VARIANTS);
    return { asset: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "desert") {
    const [sx, sy] = pick(FIELD_DESERT_VARIANTS);
    return { asset: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "village") {
    const [sx, sy] = pick(FIELD_VILLAGE_VARIANTS);
    return { asset: "floor", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "road") {
    const [sx, sy] = pick(FIELD_ROAD_VARIANTS);
    return { asset: "field", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "dungeon" || terrain === "stone") {
    const [sx, sy] = pick(INTERIOR_DUNGEON_VARIANTS);
    return { asset: "interiorFloor", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "boss") {
    const [sx, sy] = pick(INTERIOR_BOSS_VARIANTS);
    return { asset: "interiorFloor", sx, sy, sw: 16, sh: 16 };
  }
  if (terrain === "water") {
    return { asset: "water", sx: 0, sy: 0, sw: 16, sh: 16 };
  }
  const [sx, sy] = pick(FIELD_GRASS_VARIANTS);
  return { asset: "field", sx, sy, sw: 16, sh: 16 };
}

export function getTerrainOverlayLayers(terrain: TerrainType, x: number, y: number): MapLayer[] {
  const hash = tileHash(x, y, 17);
  if ((terrain === "grass" || terrain === "forest") && hash % 7 === 0) {
    const [sx, sy] = FLOOR_GRASS_TUFT_VARIANTS[hash % FLOOR_GRASS_TUFT_VARIANTS.length] ?? FLOOR_GRASS_TUFT_VARIANTS[0];
    return [{ asset: "floorDetail", sx, sy, sw: 16, sh: 16, offsetX: 0.06, offsetY: 0.12, widthScale: 0.82, heightScale: 0.82, opacity: 0.88 }];
  }
  if (terrain === "desert" && hash % 21 === 0) {
    return [{ asset: "rock", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.24, offsetY: 0.24, widthScale: 0.36, heightScale: 0.36, opacity: 0.72 }];
  }
  if ((terrain === "dungeon" || terrain === "stone" || terrain === "boss") && hash % 5 === 0) {
    const [sx, sy] = DUNGEON_RUBBLE_VARIANTS[hash % DUNGEON_RUBBLE_VARIANTS.length] ?? DUNGEON_RUBBLE_VARIANTS[0];
    return [{ asset: "dungeon", sx, sy, sw: 16, sh: 16, offsetX: 0.18, offsetY: 0.2, widthScale: terrain === "boss" ? 0.62 : 0.56, heightScale: terrain === "boss" ? 0.62 : 0.56, opacity: terrain === "boss" ? 0.82 : 0.95 }];
  }
  return [];
}

export function getPropLayers(prop: TileProp, x: number, y: number, terrain?: TerrainType): MapLayer[] {
  const hash = tileHash(x, y, 31);
  if (prop === "tree") {
    const variants: Array<[number, number]> = [[32, 0], [96, 0], [256, 0], [288, 0]];
    const pick = variants[hash % variants.length] ?? variants[0];
    return [
      {
        asset: "nature",
        sx: pick[0],
        sy: pick[1],
        sw: 32,
        sh: 32,
        offsetX: -0.2,
        offsetY: -0.5,
        widthScale: 1.4,
        heightScale: 1.4,
      },
    ];
  }
  if (prop === "stump") {
    return [{ asset: "nature", sx: 16, sy: 96, sw: 16, sh: 16, offsetX: 0.18, offsetY: 0.32, widthScale: 0.62, heightScale: 0.62 }];
  }
  if (prop === "rock") {
    if (terrain === "dungeon" || terrain === "boss" || terrain === "stone") {
      return [{ asset: "rock", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.12, offsetY: 0.18, widthScale: terrain === "boss" ? 0.88 : 0.78, heightScale: terrain === "boss" ? 0.88 : 0.78 }];
    }
    if (terrain === "desert") {
      return [{ asset: "rock", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.18, offsetY: 0.24, widthScale: 0.62, heightScale: 0.62, opacity: 0.86 }];
    }
    const variants: Array<[number, number, number, number]> = [[32, 96, 16, 16], [16, 112, 16, 16], [48, 112, 16, 16]];
    const pick = variants[hash % variants.length] ?? variants[0];
    return [{ asset: "nature", sx: pick[0], sy: pick[1], sw: pick[2], sh: pick[3], offsetX: 0.14, offsetY: 0.18, widthScale: 0.72, heightScale: 0.72 }];
  }
  if (prop === "cactus") {
    const pick = DESERT_SHRUB_VARIANTS[hash % DESERT_SHRUB_VARIANTS.length] ?? DESERT_SHRUB_VARIANTS[0];
    return [{ asset: "desert", sx: pick[0], sy: pick[1], sw: 32, sh: 32, offsetX: 0.04, offsetY: -0.1, widthScale: 0.92, heightScale: 1.02 }];
  }
  if (prop === "crate") {
    return [{ asset: "chest", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.18, offsetY: 0.18, widthScale: 0.68, heightScale: 0.68 }];
  }
  if (prop === "hole") {
    return [
      { asset: "floorDetail", sx: 16, sy: 80, sw: 16, sh: 16, offsetX: 0.14, offsetY: 0.18, widthScale: 0.74, heightScale: 0.74, opacity: 0.62 },
      { asset: "rock", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.32, offsetY: 0.34, widthScale: 0.18, heightScale: 0.18, opacity: 0.42 },
      { asset: "field", sx: 48, sy: 160, sw: 16, sh: 16, offsetX: 0.18, offsetY: 0.26, widthScale: 0.48, heightScale: 0.38, opacity: 0.42 },
      { asset: "field", sx: 64, sy: 160, sw: 16, sh: 16, offsetX: 0.22, offsetY: 0.3, widthScale: 0.38, heightScale: 0.24, opacity: 0.68 },
    ];
  }
  if (prop === "crater") {
    return [
      { asset: "reliefDetail", sx: 64, sy: 32, sw: 32, sh: 32, offsetX: -0.06, offsetY: -0.04, widthScale: 1.1, heightScale: 1.06, opacity: 0.5 },
      { asset: "field", sx: 48, sy: 160, sw: 16, sh: 16, offsetX: 0.1, offsetY: 0.16, widthScale: 0.76, heightScale: 0.56, opacity: 0.52 },
      { asset: "field", sx: 64, sy: 160, sw: 16, sh: 16, offsetX: 0.18, offsetY: 0.24, widthScale: 0.58, heightScale: 0.36, opacity: 0.76 },
      { asset: "rock", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.06, offsetY: 0.18, widthScale: 0.22, heightScale: 0.22, opacity: 0.48 },
      { asset: "rock", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.56, offsetY: 0.44, widthScale: 0.18, heightScale: 0.18, opacity: 0.38 },
    ];
  }
  if (prop === "charred") {
    return [
      { asset: "field", sx: 48, sy: 160, sw: 16, sh: 16, offsetX: 0.08, offsetY: 0.12, widthScale: 0.82, heightScale: 0.74, opacity: 0.32 },
      { asset: "field", sx: 64, sy: 160, sw: 16, sh: 16, offsetX: 0.14, offsetY: 0.22, widthScale: 0.68, heightScale: 0.46, opacity: 0.84 },
      { asset: "field", sx: 48, sy: 160, sw: 16, sh: 16, offsetX: 0.28, offsetY: 0.28, widthScale: 0.34, heightScale: 0.24, opacity: 0.54 },
    ];
  }
  if (prop === "rubble") {
    return [
      { asset: "dungeon", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.14, offsetY: 0.22, widthScale: 0.54, heightScale: 0.54, opacity: 0.9 },
      { asset: "rock", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.42, offsetY: 0.32, widthScale: 0.22, heightScale: 0.22, opacity: 0.52 },
      { asset: "rock", sx: 0, sy: 0, sw: 16, sh: 16, offsetX: 0.12, offsetY: 0.42, widthScale: 0.16, heightScale: 0.16, opacity: 0.42 },
    ];
  }
  return [];
}

export function getDecorLayers(kind: DecorKind): MapLayer[] {
  if (kind === "house_a") return [{ asset: "house", sx: 0, sy: 0, sw: 64, sh: 64, offsetY: -0.2, heightScale: 1.2 }];
  if (kind === "house_b") return [{ asset: "house", sx: 64, sy: 0, sw: 64, sh: 64, offsetY: -0.2, heightScale: 1.2 }];
  if (kind === "house_c") return [{ asset: "house", sx: 128, sy: 0, sw: 64, sh: 64, offsetY: -0.2, heightScale: 1.2 }];
  if (kind === "house_d") return [{ asset: "house", sx: 192, sy: 0, sw: 64, sh: 64, offsetY: -0.2, heightScale: 1.2 }];
  if (kind === "fence_h") return [{ asset: "house", sx: 128, sy: 64, sw: 16, sh: 16 }];
  if (kind === "fence_v") return [{ asset: "house", sx: 128, sy: 64, sw: 16, sh: 16 }];
  if (kind === "ruin_a") return [{ asset: "villageAbandoned", sx: 96, sy: 0, sw: 64, sh: 64, offsetY: -0.08, heightScale: 1.08 }];
  if (kind === "ruin_b") return [{ asset: "villageAbandoned", sx: 160, sy: 0, sw: 64, sh: 64, offsetY: -0.08, heightScale: 1.08 }];
  if (kind === "palm_cluster") return [{ asset: "desert", sx: 192, sy: 64, sw: 64, sh: 64, offsetY: -0.25, heightScale: 1.15 }];
  if (kind === "forest_grove_a") return buildForestGrove([[32, 0], [96, 0], [0, 0], [288, 0]]);
  if (kind === "forest_grove_b") return buildForestGrove([[96, 0], [32, 0], [256, 0], [0, 0]], true);
  if (kind === "stone_cluster") return [{ asset: "nature", sx: 256, sy: 224, sw: 64, sh: 64, offsetY: -0.08, heightScale: 1.08 }];
  if (kind === "citadel_tower") return [{ asset: "towers", sx: 224, sy: 64, sw: 32, sh: 32, offsetY: -0.22, heightScale: 1.26 }];
  if (kind === "well") return [{ asset: "house", sx: 384, sy: 32, sw: 32, sh: 32 }];
  if (kind === "guild_flag") return [{ asset: "house", sx: 48, sy: 64, sw: 32, sh: 16, offsetX: -0.15, offsetY: 0.12, widthScale: 1.32, heightScale: 0.72 }];
  if (kind === "shop_stall") return [{ asset: "house", sx: 256, sy: 256, sw: 48, sh: 32, offsetX: 0.02, offsetY: 0.1, heightScale: 1.42 }];
  if (kind === "inn_sign") return [{ asset: "house", sx: 480, sy: 64, sw: 16, sh: 16, offsetX: 0.14, offsetY: 0.1, widthScale: 0.74, heightScale: 0.78 }];
  if (kind === "dungeon_gate") return [{ asset: "reliefDetail", sx: 0, sy: 160, sw: 64, sh: 32, offsetX: -0.18, offsetY: -0.12, widthScale: 1.34, heightScale: 1.08 }];
  if (kind === "boss_gate") {
    return [
      { asset: "towers", sx: 192, sy: 0, sw: 64, sh: 64, offsetX: -0.12, offsetY: -0.45, widthScale: 1.26, heightScale: 1.72 },
      { asset: "towers", sx: 224, sy: 0, sw: 32, sh: 32, offsetX: 0.42, offsetY: 0.2, widthScale: 0.46, heightScale: 0.46, opacity: 0.9 },
    ];
  }
  return [];
}

function buildForestGrove(
  trees: [[number, number], [number, number], [number, number], [number, number]],
  denserCanopy = false
): MapLayer[] {
  const layers: MapLayer[] = [
    { asset: "nature", sx: trees[0][0], sy: trees[0][1], sw: 32, sh: 32, offsetX: -0.06, offsetY: -0.24, widthScale: 0.56, heightScale: 0.56 },
    { asset: "nature", sx: trees[1][0], sy: trees[1][1], sw: 32, sh: 32, offsetX: 0.28, offsetY: -0.24, widthScale: 0.56, heightScale: 0.56 },
    { asset: "nature", sx: trees[2][0], sy: trees[2][1], sw: 32, sh: 32, offsetX: -0.02, offsetY: 0.08, widthScale: 0.56, heightScale: 0.56 },
    { asset: "nature", sx: trees[3][0], sy: trees[3][1], sw: 32, sh: 32, offsetX: 0.32, offsetY: 0.08, widthScale: 0.56, heightScale: 0.56 },
    { asset: "nature", sx: 256, sy: 32, sw: 64, sh: 32, offsetX: 0.08, offsetY: denserCanopy ? -0.28 : -0.26, widthScale: 0.84, heightScale: denserCanopy ? 0.48 : 0.44, opacity: denserCanopy ? 0.98 : 0.94 },
  ];
  if (denserCanopy) {
    layers.push({ asset: "nature", sx: 256, sy: 32, sw: 64, sh: 32, offsetX: 0.1, offsetY: 0.02, widthScale: 0.8, heightScale: 0.38, opacity: 0.86 });
  }
  return layers;
}

function tileHash(x: number, y: number, salt = 0): number {
  return ((((x + 31) * 73856093) ^ ((y + 17) * 19349663) ^ ((salt + 11) * 83492791)) >>> 0);
}
