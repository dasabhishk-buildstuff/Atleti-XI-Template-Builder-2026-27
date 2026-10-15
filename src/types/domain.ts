export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";
export type PlayerImageMode = "crop" | "contain";

export interface PlayerAsset {
  id: string;
  displayName: string;
  shortName: string;
  /** Official first-team position from the club squad profiles. */
  position?: PlayerPosition;
  shirtNumber?: number;
  imagePath?: string;
  imageMode: PlayerImageMode;
  season: "2026-27";
  active: boolean;
}

export interface ClubAsset {
  id: string;
  displayName: string;
  shortName: string;
  crestPath?: string;
  competitions: string[];
  /** Confirmed 2026–27 Champions League league-phase opponent of Atlético. */
  atletiOpponent?: boolean;
  season: "2026-27";
  active: boolean;
}

export interface FormationSlot {
  id: string;
  role: string;
  x: number;
  y: number;
  order: number;
}

export interface FormationDefinition {
  id: string;
  label: string;
  slots: FormationSlot[];
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
  formationBounds: Rect;
  playerPresentation: "portrait-card" | "cutout";
}

export interface DesignTokens {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  mutedText: string;
  pitch: string;
  pitchLine: string;
}

export interface LineupSlotState {
  formationSlotId: string;
  playerId?: string;
  displayNameOverride?: string;
  shirtNumberOverride?: string;
  positionOverride?: { x: number; y: number };
  scaleOverride?: number;
}

export interface MatchMetadata {
  competition: string;
  title: string;
  subtitle?: string;
  dateText?: string;
  kickoffText?: string;
  opponentClubId?: string;
  /** Undefined uses Atlético until the user picks a club. An empty string means no home club. */
  homeClubId?: string;
}

export interface CanvasProject {
  schemaVersion: 1;
  id: string;
  name: string;
  updatedAt: string;
  skinId: string;
  formationId: string;
  themeId: string;
  customTokens?: Partial<DesignTokens>;
  match: MatchMetadata;
  lineupSlots: LineupSlotState[];
  backgroundAssetId?: string;
  backgroundFit: "cover" | "contain";
  backgroundOpacity: number;
}

export type LibraryTab = "players" | "clubs" | "backgrounds";

export type Selection =
  | { kind: "none" }
  | { kind: "slot"; slotId: string }
  | { kind: "opponent" }
  | { kind: "home" }
  | { kind: "title" }
  | { kind: "subtitle" };
