export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "relic";

export type WeaponType =
  | "ak"
  | "lr300"
  | "mp5"
  | "thompson"
  | "python"
  | "bolt"
  | "sar"
  | "custom";

export interface Skin {
  id: string;
  name: string;
  weapon: string;
  weaponType: WeaponType;
  rarity: Rarity;
  /** Price in USD cents */
  price: number;
  color: string;
}

export const RARITY_META: Record<
  Rarity,
  { label: string; color: string; glow: string; weight: number }
> = {
  common: {
    label: "Scrap",
    color: "#8b8680",
    glow: "rgba(139,134,128,0.35)",
    weight: 45,
  },
  uncommon: {
    label: "Field",
    color: "#4a9e6e",
    glow: "rgba(74,158,110,0.4)",
    weight: 28,
  },
  rare: {
    label: "Military",
    color: "#3b82c4",
    glow: "rgba(59,130,196,0.45)",
    weight: 15,
  },
  epic: {
    label: "Restricted",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.5)",
    weight: 8,
  },
  legendary: {
    label: "Covert",
    color: "#e11d48",
    glow: "rgba(225,29,72,0.55)",
    weight: 3.5,
  },
  relic: {
    label: "Relic",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.6)",
    weight: 0.5,
  },
};

export const SKINS: Skin[] = [
  {
    id: "ak-tempered",
    name: "Tempered",
    weapon: "Assault Rifle",
    weaponType: "ak",
    rarity: "common",
    price: 45,
    color: "#6b6560",
  },
  {
    id: "ak-forest",
    name: "Forest Camo",
    weapon: "Assault Rifle",
    weaponType: "ak",
    rarity: "common",
    price: 62,
    color: "#3d5c45",
  },
  {
    id: "mp5-urban",
    name: "Urban Decay",
    weapon: "MP5A4",
    weaponType: "mp5",
    rarity: "common",
    price: 38,
    color: "#5a5a5e",
  },
  {
    id: "thompson-tundra",
    name: "Tundra",
    weapon: "Thompson",
    weaponType: "thompson",
    rarity: "uncommon",
    price: 125,
    color: "#4a7a6a",
  },
  {
    id: "sar-hunter",
    name: "Hunter",
    weapon: "Semi-Auto Rifle",
    weaponType: "sar",
    rarity: "uncommon",
    price: 180,
    color: "#5c7a4a",
  },
  {
    id: "python-copper",
    name: "Copperhead",
    weapon: "Python Revolver",
    weaponType: "python",
    rarity: "uncommon",
    price: 210,
    color: "#b87333",
  },
  {
    id: "lr-midnight",
    name: "Midnight Ops",
    weapon: "LR-300",
    weaponType: "lr300",
    rarity: "rare",
    price: 450,
    color: "#2a3a5c",
  },
  {
    id: "bolt-arctic",
    name: "Arctic Ghost",
    weapon: "Bolt Action",
    weaponType: "bolt",
    rarity: "rare",
    price: 620,
    color: "#6a8a9e",
  },
  {
    id: "ak-ember",
    name: "Ember Trail",
    weapon: "Assault Rifle",
    weaponType: "ak",
    rarity: "rare",
    price: 780,
    color: "#c45c26",
  },
  {
    id: "mp5-neon",
    name: "Neon Grid",
    weapon: "MP5A4",
    weaponType: "mp5",
    rarity: "epic",
    price: 1450,
    color: "#7c3aed",
  },
  {
    id: "lr-oxide",
    name: "Oxide Bloom",
    weapon: "LR-300",
    weaponType: "lr300",
    rarity: "epic",
    price: 2100,
    color: "#c2410c",
  },
  {
    id: "sar-blood",
    name: "Blood Moon",
    weapon: "Semi-Auto Rifle",
    weaponType: "sar",
    rarity: "epic",
    price: 2750,
    color: "#9f1239",
  },
  {
    id: "ak-dragon",
    name: "Dragonforge",
    weapon: "Assault Rifle",
    weaponType: "ak",
    rarity: "legendary",
    price: 8900,
    color: "#dc2626",
  },
  {
    id: "bolt-eclipse",
    name: "Solar Eclipse",
    weapon: "Bolt Action",
    weaponType: "bolt",
    rarity: "legendary",
    price: 12500,
    color: "#b91c1c",
  },
  {
    id: "python-king",
    name: "Kingmaker",
    weapon: "Python Revolver",
    weaponType: "python",
    rarity: "legendary",
    price: 15800,
    color: "#e11d48",
  },
  {
    id: "custom-furnace",
    name: "Furnace Heart",
    weapon: "Custom SMG",
    weaponType: "custom",
    rarity: "relic",
    price: 45000,
    color: "#f59e0b",
  },
  {
    id: "ak-scrapyard",
    name: "Scrapyard Legend",
    weapon: "Assault Rifle",
    weaponType: "ak",
    rarity: "relic",
    price: 89000,
    color: "#fbbf24",
  },
];

export function getSkin(id: string): Skin | undefined {
  return SKINS.find((s) => s.id === id);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function skinKey(skinId: string, instanceId: string) {
  return `${skinId}:${instanceId}`;
}
