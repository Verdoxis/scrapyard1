/**
 * Resolve Steam profile media from a trade URL partner id.
 * steamid64 = accountId + 76561197960265728
 */

const STEAM_ID_OFFSET = BigInt("76561197960265728");

export function partnerFromTradeUrl(tradeUrl: string): string | null {
  try {
    const u = new URL(tradeUrl);
    return u.searchParams.get("partner");
  } catch {
    const m = tradeUrl.match(/[?&]partner=(\d+)/);
    return m?.[1] ?? null;
  }
}

export function steamIdFromPartner(partner: string): string {
  return (BigInt(partner) + STEAM_ID_OFFSET).toString();
}

export interface SteamProfileMedia {
  steamId64: string;
  personaName: string | null;
  avatarUrl: string;
  profileUrl: string;
}

const DEFAULT_AVATAR =
  "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";

export async function fetchSteamProfile(
  tradeUrl: string,
): Promise<SteamProfileMedia | null> {
  const partner = partnerFromTradeUrl(tradeUrl);
  if (!partner) return null;
  const steamId64 = steamIdFromPartner(partner);
  const profileUrl = `https://steamcommunity.com/profiles/${steamId64}`;

  try {
    const res = await fetch(`${profileUrl}/?xml=1`, {
      headers: { "User-Agent": "ScrapyardBot/1.0" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return {
        steamId64,
        personaName: null,
        avatarUrl: DEFAULT_AVATAR,
        profileUrl,
      };
    }
    const xml = await res.text();
    const name = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/)?.[1]
      || xml.match(/<steamID>([^<]+)<\/steamID>/)?.[1]
      || null;
    const avatar =
      xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/)?.[1]
      || xml.match(/<avatarMedium><!\[CDATA\[(.*?)\]\]><\/avatarMedium>/)?.[1]
      || DEFAULT_AVATAR;

    return {
      steamId64,
      personaName: name?.trim() || null,
      avatarUrl: avatar,
      profileUrl,
    };
  } catch {
    return {
      steamId64,
      personaName: null,
      avatarUrl: DEFAULT_AVATAR,
      profileUrl,
    };
  }
}
