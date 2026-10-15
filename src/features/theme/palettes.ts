import type { DesignTokens } from "@/types/domain";

export interface PalettePreset {
  id: string;
  label: string;
  tokens: DesignTokens;
}

export const palettes: PalettePreset[] = [
  {
    id: "colchoneros",
    label: "Colchoneros",
    tokens: {
      background: "#F7F4F2",
      surface: "#FFFFFF",
      primary: "#CB3524",
      secondary: "#272E61",
      accent: "#CB3524",
      text: "#141820",
      mutedText: "#5C6572",
      pitch: "#E6E0D4",
      pitchLine: "#C9C1B3",
    },
  },
  {
    id: "stadium-night",
    label: "Stadium night",
    tokens: {
      background: "#0C0C0E",
      surface: "#16161A",
      primary: "#CB3524",
      secondary: "#F4F4F4",
      accent: "#CB3524",
      text: "#F6F1EA",
      mutedText: "#A8B1C2",
      pitch: "#10182A",
      pitchLine: "#3A4660",
    },
  },
  {
    id: "monochrome",
    label: "Monochrome",
    tokens: {
      background: "#F5F4F1",
      surface: "#FFFFFF",
      primary: "#1A1A1A",
      secondary: "#1A1A1A",
      accent: "#1A1A1A",
      text: "#111111",
      mutedText: "#6A6A6A",
      pitch: "#ECEBE7",
      pitchLine: "#CFCDC7",
    },
  },
  {
    id: "heritage",
    label: "Heritage",
    tokens: {
      background: "#F7F3EC",
      surface: "#0E1C33",
      primary: "#D0122D",
      secondary: "#F4F0E8",
      accent: "#D0122D",
      text: "#121820",
      mutedText: "#6A6258",
      pitch: "#F3EEE6",
      pitchLine: "#D7CFC3",
    },
  },
  {
    id: "atlantic",
    label: "Atlantic",
    tokens: {
      background: "#E6EEF1",
      surface: "#F7FBFC",
      primary: "#0F4C5C",
      secondary: "#12323F",
      accent: "#C45C26",
      text: "#102028",
      mutedText: "#5C6B73",
      pitch: "#D5E2E4",
      pitchLine: "#B5C8CB",
    },
  },
  {
    id: "away-white",
    label: "Away white",
    tokens: {
      background: "#FBFBFB",
      surface: "#FFFFFF",
      primary: "#161616",
      secondary: "#C8102E",
      accent: "#C8102E",
      text: "#161616",
      mutedText: "#6E6E6E",
      pitch: "#F1F1F1",
      pitchLine: "#D5D5D5",
    },
  },
];

export function resolveTokens(
  themeId: string,
  custom?: Partial<DesignTokens>,
): DesignTokens {
  const preset = palettes.find((palette) => palette.id === themeId) ?? palettes[0];
  return { ...preset.tokens, ...stripEmpty(custom) };
}

function stripEmpty(custom?: Partial<DesignTokens>): Partial<DesignTokens> {
  if (!custom) return {};
  return Object.fromEntries(
    Object.entries(custom).filter(([, value]) => Boolean(value)),
  ) as Partial<DesignTokens>;
}
