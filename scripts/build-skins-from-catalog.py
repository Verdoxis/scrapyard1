#!/usr/bin/env python3
import json
from pathlib import Path

catalog = json.loads(Path("/workspace/src/lib/steam-catalog.json").read_text())

rarities = ["common", "uncommon", "rare", "epic", "legendary", "relic"]
# Assign rarity by price tiers (cents)
def rarity_for(price: int) -> str:
    if price < 50:
        return "common"
    if price < 120:
        return "uncommon"
    if price < 200:
        return "rare"
    if price < 400:
        return "epic"
    if price < 700:
        return "legendary"
    return "relic"

weapon_type_map = {
    "Assault Rifle": "ak",
    "LR-300": "lr300",
    "LR300": "lr300",
    "MP5A4": "mp5",
    "Thompson": "thompson",
    "Custom SMG": "custom",
    "Python Revolver": "python",
    "Bolt Action Rifle": "bolt",
    "Semi-Automatic Rifle": "sar",
    "Pump Shotgun": "custom",
    "Metal Facemask": "custom",
    "Hoodie": "custom",
}

def slug(s: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]

skins = []
for c in catalog:
    price = int(c.get("price") or 100)
    if price < 10:
        price = 50  # floor for gambling UX
    skins.append(
        {
            "id": slug(c["name"]),
            "name": c["name"],
            "weapon": c.get("itemType") or "Skin",
            "weaponType": weapon_type_map.get(c.get("itemType") or "", "custom"),
            "rarity": rarity_for(price),
            "price": price,
            "color": c.get("accent") or "#c45c26",
            "image": c.get("localImage") or "/items/rifle.ak.png",
            "steamIconUrl": c.get("iconUrl"),
            "marketHashName": c["name"],
        }
    )

Path("/workspace/src/lib/steam-skins-data.json").write_text(json.dumps(skins, indent=2))
print(f"wrote {len(skins)} skins")
