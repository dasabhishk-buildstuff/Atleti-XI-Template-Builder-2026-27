import clubsJson from "@/data/clubs.json";
import playersJson from "@/data/players.atleti-2026-27.json";
import type { ClubAsset, PlayerAsset } from "@/types/domain";

export const players = playersJson as PlayerAsset[];
export const clubs = clubsJson as ClubAsset[];

export const HOME_CLUB_ID = "atletico-de-madrid";

export const competitions = [
  { id: "all", label: "All clubs" },
  { id: "laliga-2026-27", label: "LaLiga 2026–27" },
  { id: "ucl-2026-27", label: "Champions League 2026–27" },
  { id: "supercopa-2027", label: "Supercopa 2027" },
  { id: "copa-del-rey", label: "Copa del Rey" },
] as const;

export const matchCompetitions = [
  "LaLiga",
  "Champions League",
  "Copa del Rey",
  "Supercopa de España",
] as const;

export function playerCutoutSrc(player: PlayerAsset | undefined): string | undefined {
  if (!player) return undefined;
  if (player.shirtNumber != null) return `/assets/players/${player.shirtNumber}.png`;
  return player.imagePath;
}

export function getPlayer(id: string | undefined): PlayerAsset | undefined {
  if (!id) return undefined;
  return players.find((player) => player.id === id);
}

export function getClub(id: string | undefined): ClubAsset | undefined {
  if (!id) return undefined;
  return clubs.find((club) => club.id === id);
}
