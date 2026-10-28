import { RARITY_META, SKINS, type Rarity, type Skin } from "./skins";

export interface CaseDef {
  id: string;
  name: string;
  description: string;
  /** Open price in USD cents */
  price: number;
  accent: string;
  skinIds: string[];
}

export const CASES: CaseDef[] = [
  {
    id: "starter-crate",
    name: "Beach Crate",
    description: "Low-tier scrap for new survivors.",
    price: 100,
    accent: "#6b8f71",
    skinIds: [
      "ak-tempered",
      "ak-forest",
      "mp5-urban",
      "thompson-tundra",
      "sar-hunter",
      "python-copper",
      "lr-midnight",
    ],
  },
  {
    id: "military-crate",
    name: "Military Crate",
    description: "Raided from an outpost armory.",
    price: 350,
    accent: "#3b82c4",
    skinIds: [
      "thompson-tundra",
      "sar-hunter",
      "python-copper",
      "lr-midnight",
      "bolt-arctic",
      "ak-ember",
      "mp5-neon",
      "lr-oxide",
    ],
  },
  {
    id: "oil-rig",
    name: "Oil Rig Cache",
    description: "High-risk haul from the big rig.",
    price: 1250,
    accent: "#c45c26",
    skinIds: [
      "lr-midnight",
      "bolt-arctic",
      "ak-ember",
      "mp5-neon",
      "lr-oxide",
      "sar-blood",
      "ak-dragon",
      "bolt-eclipse",
      "python-king",
    ],
  },
  {
    id: "relic-vault",
    name: "Relic Vault",
    description: "Only the rarest forge-marked skins.",
    price: 5000,
    accent: "#f59e0b",
    skinIds: [
      "mp5-neon",
      "lr-oxide",
      "sar-blood",
      "ak-dragon",
      "bolt-eclipse",
      "python-king",
      "custom-furnace",
      "ak-scrapyard",
    ],
  },
];

export function getCase(id: string): CaseDef | undefined {
  return CASES.find((c) => c.id === id);
}

export function caseSkins(caseDef: CaseDef): Skin[] {
  return caseDef.skinIds
    .map((id) => SKINS.find((s) => s.id === id))
    .filter((s): s is Skin => Boolean(s));
}

/** Weighted roll using rarity weights within the case pool. */
export function rollCaseSkin(caseDef: CaseDef, random = Math.random): Skin {
  const pool = caseSkins(caseDef);
  const weights = pool.map((s) => RARITY_META[s.rarity as Rarity].weight);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
