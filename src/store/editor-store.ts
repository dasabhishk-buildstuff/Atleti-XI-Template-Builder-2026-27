import { toast } from "sonner";
import { create } from "zustand";
import { getFormation } from "@/features/formations/presets";
import { initBackgrounds } from "@/lib/background-manager";
import { loadLastActiveProject, saveProject } from "@/lib/idb";
import { CanvasProjectSchema, parseProjectJson } from "@/lib/validation";
import type {
  CanvasProject,
  DesignTokens,
  LibraryTab,
  LineupSlotState,
  Selection,
} from "@/types/domain";

const HISTORY_LIMIT = 50;

function emptySlots(formationId: string): LineupSlotState[] {
  return getFormation(formationId).slots.map((slot) => ({
    formationSlotId: slot.id,
  }));
}

export function starterProject(): CanvasProject {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: "Atlético — Starting XI",
    updatedAt: new Date().toISOString(),
    skinId: "editorial",
    formationId: "4-3-3",
    themeId: "colchoneros",
    match: {
      competition: "LaLiga",
      title: "Starting XI",
      subtitle: "Atlético de Madrid",
      homeClubId: "atletico-de-madrid",
    },
    lineupSlots: emptySlots("4-3-3"),
    backgroundFit: "cover",
    backgroundOpacity: 0.55,
  };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleAutosave(project: CanvasProject) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveProject(project).catch((err) => {
      console.error("Autosave failed:", err);
    });
  }, 600);
}

interface EditorState {
  project: CanvasProject;
  past: CanvasProject[];
  future: CanvasProject[];
  selection: Selection;
  libraryTab: LibraryTab;
  playerQuery: string;
  positionFilter: "ALL" | "GK" | "DEF" | "MID" | "FWD";
  clubQuery: string;
  competitionFilter: string;
  isHydrated: boolean;
  commit: (recipe: (project: CanvasProject) => CanvasProject) => void;
  replace: (recipe: (project: CanvasProject) => CanvasProject) => void;
  undo: () => void;
  redo: () => void;
  setSelection: (selection: Selection) => void;
  setLibraryTab: (tab: LibraryTab) => void;
  setPlayerQuery: (query: string) => void;
  setPositionFilter: (filter: EditorState["positionFilter"]) => void;
  setClubQuery: (query: string) => void;
  setCompetitionFilter: (filter: string) => void;
  setSkin: (skinId: string) => void;
  setFormation: (formationId: string) => void;
  setTheme: (themeId: string) => void;
  setCustomToken: (key: keyof DesignTokens, value: string) => void;
  setProjectName: (name: string) => void;
  setMatchField: (
    field: keyof CanvasProject["match"],
    value: string,
  ) => void;
  setOpponent: (clubId: string | undefined) => void;
  setHome: (clubId: string | undefined) => void;
  swapSides: () => void;
  assignPlayer: (playerId: string, slotId?: string) => void;
  clearSlot: (slotId: string) => void;
  setSlotOverride: (
    slotId: string,
    field: "displayNameOverride" | "shirtNumberOverride",
    value: string,
  ) => void;
  setSlotPositionOverride: (
    slotId: string,
    positionOverride?: { x: number; y: number },
  ) => void;
  resetSlotPosition: (slotId: string) => void;
  resetAllPositions: () => void;
  setSlotScaleOverride: (
    slotId: string,
    scaleOverride?: number,
    recordHistory?: boolean,
  ) => void;
  resetSlotScale: (slotId: string) => void;
  setBackgroundAssetId: (id: string | undefined) => void;
  setBackgroundFit: (fit: "cover" | "contain") => void;
  setBackgroundOpacity: (opacity: number) => void;
  resetLineup: () => void;
  resetProject: () => void;
  importProject: (jsonStr: string) => boolean;
  exportProject: () => string;
  hydrateStore: () => Promise<void>;
}

function touch(project: CanvasProject): CanvasProject {
  return { ...project, updatedAt: new Date().toISOString() };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: starterProject(),
  past: [],
  future: [],
  selection: { kind: "none" },
  libraryTab: "players",
  playerQuery: "",
  positionFilter: "ALL",
  clubQuery: "",
  competitionFilter: "all",
  isHydrated: false,

  commit: (recipe) => {
    const current = get().project;
    const next = touch(recipe(current));
    set({
      project: next,
      past: [...get().past, current].slice(-HISTORY_LIMIT),
      future: [],
    });
    scheduleAutosave(next);
  },

  replace: (recipe) => {
    const next = touch(recipe(get().project));
    set({ project: next });
    scheduleAutosave(next);
  },

  undo: () => {
    const { past, project, future } = get();
    const previous = past.at(-1);
    if (!previous) return;
    set({
      project: previous,
      past: past.slice(0, -1),
      future: [project, ...future].slice(0, HISTORY_LIMIT),
    });
    scheduleAutosave(previous);
  },

  redo: () => {
    const { past, project, future } = get();
    const next = future[0];
    if (!next) return;
    set({
      project: next,
      future: future.slice(1),
      past: [...past, project].slice(-HISTORY_LIMIT),
    });
    scheduleAutosave(next);
  },

  setSelection: (selection) => set({ selection }),
  setLibraryTab: (libraryTab) => set({ libraryTab }),
  setPlayerQuery: (playerQuery) => set({ playerQuery }),
  setPositionFilter: (positionFilter) => set({ positionFilter }),
  setClubQuery: (clubQuery) => set({ clubQuery }),
  setCompetitionFilter: (competitionFilter) => set({ competitionFilter }),

  setSkin: (skinId) => {
    get().commit((project) => ({ ...project, skinId }));
  },

  setFormation: (formationId) => {
    get().commit((project) => {
      const nextSlots = getFormation(formationId).slots.map((slot, index) => {
        const previous = project.lineupSlots[index];
        return {
          formationSlotId: slot.id,
          playerId: previous?.playerId,
          displayNameOverride: previous?.displayNameOverride,
          shirtNumberOverride: previous?.shirtNumberOverride,
          positionOverride: undefined,
        };
      });
      return { ...project, formationId, lineupSlots: nextSlots };
    });
    toast("Formation updated. Players stayed in list order.");
  },

  setTheme: (themeId) => {
    get().commit((project) => ({
      ...project,
      themeId,
      customTokens: undefined,
    }));
  },

  setCustomToken: (key, value) => {
    get().commit((project) => ({
      ...project,
      customTokens: { ...project.customTokens, [key]: value },
    }));
  },

  setProjectName: (name) => {
    get().replace((project) => ({ ...project, name }));
  },

  setMatchField: (field, value) => {
    get().replace((project) => ({
      ...project,
      match: { ...project.match, [field]: value },
    }));
  },

  setOpponent: (clubId) => {
    get().commit((project) => ({
      ...project,
      match: { ...project.match, opponentClubId: clubId },
    }));
    set({ selection: { kind: "opponent" } });
  },

  setHome: (clubId) => {
    get().commit((project) => ({
      ...project,
      match: { ...project.match, homeClubId: clubId ?? "" },
    }));
    set({ selection: { kind: "home" } });
  },

  swapSides: () => {
    get().commit((project) => {
      const homeClubId = project.match.homeClubId ?? "atletico-de-madrid";
      return {
        ...project,
        match: {
          ...project.match,
          homeClubId: project.match.opponentClubId ?? "",
          opponentClubId: homeClubId,
        },
      };
    });
  },

  assignPlayer: (playerId, slotId) => {
    const { project, selection } = get();
    const targetId =
      slotId ??
      (selection.kind === "slot" ? selection.slotId : undefined) ??
      project.lineupSlots.find((slot) => !slot.playerId)?.formationSlotId;

    if (!targetId) {
      toast("Select a position, or clear one, before adding another player.");
      return;
    }

    const alreadyThere = project.lineupSlots.some(
      (slot) => slot.formationSlotId === targetId && slot.playerId === playerId,
    );
    if (alreadyThere) {
      set({ selection: { kind: "slot", slotId: targetId } });
      return;
    }

    get().commit((current) => ({
      ...current,
      lineupSlots: current.lineupSlots.map((slot) => {
        if (slot.formationSlotId === targetId) {
          return {
            ...slot,
            formationSlotId: slot.formationSlotId,
            playerId,
          };
        }
        if (slot.playerId === playerId) {
          return {
            ...slot,
            formationSlotId: slot.formationSlotId,
            playerId: undefined,
            displayNameOverride: undefined,
            shirtNumberOverride: undefined,
          };
        }
        return slot;
      }),
    }));
    set({ selection: { kind: "slot", slotId: targetId } });
  },

  clearSlot: (slotId) => {
    get().commit((project) => ({
      ...project,
      lineupSlots: project.lineupSlots.map((slot) =>
        slot.formationSlotId === slotId
          ? { formationSlotId: slot.formationSlotId }
          : slot,
      ),
    }));
  },

  setSlotOverride: (slotId, field, value) => {
    get().replace((project) => ({
      ...project,
      lineupSlots: project.lineupSlots.map((slot) =>
        slot.formationSlotId === slotId
          ? { ...slot, [field]: value || undefined }
          : slot,
      ),
    }));
  },

  setSlotPositionOverride: (slotId, positionOverride) => {
    get().replace((project) => ({
      ...project,
      lineupSlots: project.lineupSlots.map((slot) =>
        slot.formationSlotId === slotId
          ? { ...slot, positionOverride }
          : slot,
      ),
    }));
  },

  resetSlotPosition: (slotId) => {
    get().commit((project) => ({
      ...project,
      lineupSlots: project.lineupSlots.map((slot) =>
        slot.formationSlotId === slotId
          ? { ...slot, positionOverride: undefined }
          : slot,
      ),
    }));
    toast("Reset position to formation.");
  },

  resetAllPositions: () => {
    get().commit((project) => ({
      ...project,
      lineupSlots: project.lineupSlots.map((slot) => ({
        ...slot,
        positionOverride: undefined,
      })),
    }));
    toast("Reset all players to formation positions.");
  },

  setSlotScaleOverride: (slotId, scaleOverride, recordHistory = false) => {
    const fn = recordHistory ? get().commit : get().replace;
    fn((project) => ({
      ...project,
      lineupSlots: project.lineupSlots.map((slot) =>
        slot.formationSlotId === slotId
          ? {
              ...slot,
              scaleOverride:
                scaleOverride && Math.abs(scaleOverride - 1) > 0.001
                  ? Math.round(scaleOverride * 100) / 100
                  : undefined,
            }
          : slot,
      ),
    }));
  },

  resetSlotScale: (slotId) => {
    get().commit((project) => ({
      ...project,
      lineupSlots: project.lineupSlots.map((slot) =>
        slot.formationSlotId === slotId
          ? { ...slot, scaleOverride: undefined }
          : slot,
      ),
    }));
    toast("Reset player cutout size.");
  },

  setBackgroundAssetId: (id) => {
    get().commit((project) => ({
      ...project,
      backgroundAssetId: id,
    }));
  },

  setBackgroundFit: (backgroundFit) => {
    get().commit((project) => ({
      ...project,
      backgroundFit,
    }));
  },

  setBackgroundOpacity: (backgroundOpacity) => {
    get().replace((project) => ({
      ...project,
      backgroundOpacity,
    }));
  },

  resetLineup: () => {
    get().commit((project) => ({
      ...project,
      lineupSlots: emptySlots(project.formationId),
    }));
    set({ selection: { kind: "none" } });
  },

  resetProject: () => {
    const starter = starterProject();
    set({
      project: starter,
      past: [],
      future: [],
      selection: { kind: "none" },
    });
    scheduleAutosave(starter);
    toast("Project reset to default starter.");
  },

  exportProject: () => {
    return JSON.stringify(get().project, null, 2);
  },

  importProject: (jsonStr) => {
    const parsed = parseProjectJson(jsonStr);
    if (!parsed.success) {
      toast.error(`Invalid project JSON: ${parsed.error}`);
      return false;
    }
    const validated = parsed.data as CanvasProject;
    get().commit(() => validated);
    toast.success("Project imported successfully!");
    return true;
  },

  hydrateStore: async () => {
    if (get().isHydrated) return;
    try {
      await initBackgrounds();
      const saved = await loadLastActiveProject();
      if (saved) {
        const check = CanvasProjectSchema.safeParse(saved);
        if (check.success) {
          set({ project: check.data as CanvasProject, isHydrated: true });
          return;
        } else {
          console.warn("Stored project schema mismatch, keeping starter project", check.error);
        }
      }
    } catch (e) {
      console.error("Failed to load project from storage:", e);
    }
    set({ isHydrated: true });
  },
}));
