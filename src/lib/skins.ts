import steamSkins from "./steam-skins-data.json";

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
  /** Local cached Steam market / economy image */
  image: string;
  steamIconUrl?: string;
  marketHashName?: string;
}

export const RARITY_META: Record<
  Rarity,
  { label: string; color: string; glow: string; weight: number }
> = {
  common: {
    label: "Consumer",
    color: "#8b8680",
    glow: "rgba(139,134,128,0.35)",
    weight: 45,
  },
  uncommon: {
    label: "Industrial",
    color: "#5a9e6a",
    glow: "rgba(90,158,106,0.4)",
    weight: 28,
  },
  rare: {
    label: "Mil-Spec",
    color: "#4a90c8",
    glow: "rgba(74,144,200,0.45)",
    weight: 15,
  },
  epic: {
    label: "Restricted",
    color: "#9b59c6",
    glow: "rgba(155,89,198,0.5)",
    weight: 8,
  },
  legendary: {
    label: "Classified",
    color: "#cd412b",
    glow: "rgba(205,65,43,0.55)",
    weight: 3.5,
  },
  relic: {
    label: "Covert",
    color: "#f0a020",
    glow: "rgba(240,160,32,0.6)",
    weight: 0.5,
  },
};

export const SKINS: Skin[] = steamSkins as Skin[];

export function getSkin(id: string): Skin | undefined {
  return SKINS.find((s) => s.id === id);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
