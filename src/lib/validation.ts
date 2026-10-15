import { z } from "zod";

export const LineupSlotStateSchema = z.object({
  formationSlotId: z.string(),
  playerId: z.string().optional(),
  displayNameOverride: z.string().optional(),
  shirtNumberOverride: z.string().optional(),
  positionOverride: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  scaleOverride: z.number().optional(),
});

export const MatchMetadataSchema = z.object({
  competition: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  dateText: z.string().optional(),
  kickoffText: z.string().optional(),
  opponentClubId: z.string().optional(),
  homeClubId: z.string().optional(),
});

export const DesignTokensSchema = z.object({
  background: z.string(),
  surface: z.string(),
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  text: z.string(),
  mutedText: z.string(),
  pitch: z.string(),
  pitchLine: z.string(),
});

export const CanvasProjectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
  skinId: z.string(),
  formationId: z.string(),
  themeId: z.string(),
  customTokens: DesignTokensSchema.partial().optional(),
  match: MatchMetadataSchema,
  lineupSlots: z.array(LineupSlotStateSchema),
  backgroundAssetId: z.string().optional(),
  backgroundFit: z.enum(["cover", "contain"]).default("cover"),
  backgroundOpacity: z.number().min(0).max(1).default(0.55),
});

export type ValidatedCanvasProject = z.infer<typeof CanvasProjectSchema>;

export function parseProjectJson(raw: string): { success: true; data: ValidatedCanvasProject } | { success: false; error: string } {
  try {
    const json = JSON.parse(raw);
    const parsed = CanvasProjectSchema.safeParse(json);
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }
    return { success: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ") };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}
