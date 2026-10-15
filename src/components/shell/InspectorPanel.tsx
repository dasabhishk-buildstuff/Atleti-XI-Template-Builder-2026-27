import type { ReactNode } from "react";
import { clubs, getPlayer, HOME_CLUB_ID } from "@/data/catalog";
import { palettes } from "@/features/theme/palettes";
import { useEditorStore } from "@/store/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InspectorPanel({ fill = false }: { fill?: boolean }) {
  const project = useEditorStore((state) => state.project);
  const selection = useEditorStore((state) => state.selection);
  const setMatchField = useEditorStore((state) => state.setMatchField);
  const setTheme = useEditorStore((state) => state.setTheme);
  const setCustomToken = useEditorStore((state) => state.setCustomToken);
  const setOpponent = useEditorStore((state) => state.setOpponent);
  const setHome = useEditorStore((state) => state.setHome);
  const swapSides = useEditorStore((state) => state.swapSides);
  const setSlotOverride = useEditorStore((state) => state.setSlotOverride);
  const clearSlot = useEditorStore((state) => state.clearSlot);
  const resetSlotPosition = useEditorStore((state) => state.resetSlotPosition);
  const resetAllPositions = useEditorStore((state) => state.resetAllPositions);
  const setSlotScaleOverride = useEditorStore((state) => state.setSlotScaleOverride);
  const resetSlotScale = useEditorStore((state) => state.resetSlotScale);
  const setBackgroundAssetId = useEditorStore((state) => state.setBackgroundAssetId);
  const setBackgroundFit = useEditorStore((state) => state.setBackgroundFit);
  const setBackgroundOpacity = useEditorStore((state) => state.setBackgroundOpacity);
  const resetLineup = useEditorStore((state) => state.resetLineup);

  const selectedSlot =
    selection.kind === "slot"
      ? project.lineupSlots.find((slot) => slot.formationSlotId === selection.slotId)
      : undefined;
  const selectedPlayer = getPlayer(selectedSlot?.playerId);
  const hasCustomPositions = project.lineupSlots.some((slot) => slot.positionOverride);

  return (
    <aside
      className={`flex shrink-0 flex-col gap-5 overflow-auto border-white/10 bg-sidebar px-4 py-4 ${
        fill ? "h-full w-full" : "w-[280px] border-l"
      }`}
    >
      <div>
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Inspector</p>
        <h2 className="font-display text-4xl leading-none font-bold tracking-wide uppercase">
          {selection.kind === "slot"
            ? "Player"
            : selection.kind === "home"
              ? "Home"
            : selection.kind === "opponent"
              ? project.skinId === "heritage"
                ? "Opponent"
                : "Away"
              : selection.kind === "title"
                ? "Headline"
                : "Match"}
        </h2>
      </div>

      {selection.kind === "slot" && selectedSlot ? (
        <div className="space-y-3">
          <Field label="Squad name">
            <p className="text-sm font-medium">{selectedPlayer?.displayName ?? "Empty position"}</p>
          </Field>
          <Field label="Lineup label">
            <Input
              value={selectedSlot.displayNameOverride ?? selectedPlayer?.shortName ?? ""}
              placeholder="Name on the poster"
              onChange={(event) =>
                setSlotOverride(selectedSlot.formationSlotId, "displayNameOverride", event.target.value)
              }
            />
          </Field>
          <Field label="Shirt number">
            <Input
              value={selectedSlot.shirtNumberOverride ?? (selectedPlayer?.shirtNumber ? String(selectedPlayer.shirtNumber) : "")}
              onChange={(event) =>
                setSlotOverride(selectedSlot.formationSlotId, "shirtNumberOverride", event.target.value)
              }
            />
          </Field>
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                Cutout scale <span className="text-[10px] text-primary font-semibold uppercase">(Ratio locked)</span>
              </span>
              <span className="font-mono text-xs font-semibold">
                {Math.round((selectedSlot.scaleOverride ?? 1) * 100)}%
              </span>
            </div>
            <Slider
              value={[(selectedSlot.scaleOverride ?? 1) * 100]}
              min={50}
              max={220}
              step={2}
              onValueChange={(vals) => {
                const val = Array.isArray(vals) ? vals[0] : vals;
                if (typeof val === "number") {
                  setSlotScaleOverride(selectedSlot.formationSlotId, val / 100, true);
                }
              }}
            />
            {selectedSlot.scaleOverride && selectedSlot.scaleOverride !== 1 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => resetSlotScale(selectedSlot.formationSlotId)}
              >
                Reset cutout scale to 100%
              </Button>
            ) : null}
          </div>
          {selectedSlot.positionOverride ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => resetSlotPosition(selectedSlot.formationSlotId)}
            >
              Reset to formation spot
            </Button>
          ) : null}
          <Button variant="outline" className="w-full" onClick={() => clearSlot(selectedSlot.formationSlotId)}>
            Clear position
          </Button>
        </div>
      ) : null}

      {selection.kind === "opponent" && project.skinId === "heritage" ? (
        <Field label="Opponent club">
          <ClubSelect
            label="Opponent club"
            value={project.match.opponentClubId ?? ""}
            excludeId={HOME_CLUB_ID}
            onValueChange={(value) => setOpponent(value || undefined)}
          />
        </Field>
      ) : null}

      {project.skinId !== "heritage" && selection.kind !== "slot" ? (
        <div className="space-y-3">
          <Field label="Home">
            <ClubSelect
              label="Home club"
              value={project.match.homeClubId === "" ? "" : (project.match.homeClubId ?? HOME_CLUB_ID)}
              excludeId={project.match.opponentClubId}
              onValueChange={(value) => setHome(value || "")}
            />
          </Field>
          <Field label="Away">
            <ClubSelect
              label="Away club"
              value={project.match.opponentClubId ?? ""}
              excludeId={project.match.homeClubId === "" ? undefined : (project.match.homeClubId ?? HOME_CLUB_ID)}
              onValueChange={(value) => setOpponent(value || undefined)}
              allowEmpty
            />
          </Field>
          <Button variant="outline" className="w-full" onClick={swapSides}>
            Swap home and away
          </Button>
        </div>
      ) : null}

      {selection.kind !== "slot" ? (
        <div className="space-y-3">
          <Field label="Headline">
            <Input value={project.match.title} onChange={(event) => setMatchField("title", event.target.value)} />
          </Field>
          <Field label="Subtitle">
            <Input
              value={project.match.subtitle ?? ""}
              onChange={(event) => setMatchField("subtitle", event.target.value)}
            />
          </Field>
          <Field label="Date">
            <Input
              value={project.match.dateText ?? ""}
              placeholder="13 Oct 2026"
              onChange={(event) => setMatchField("dateText", event.target.value)}
            />
          </Field>
          <Field label="Kick-off">
            <Input
              value={project.match.kickoffText ?? ""}
              placeholder="21:00"
              onChange={(event) => setMatchField("kickoffText", event.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {selection.kind !== "slot" ? (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Wallpaper Overlay</p>
            {project.backgroundAssetId ? (
              <button
                type="button"
                onClick={() => setBackgroundAssetId(undefined)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Detach
              </button>
            ) : null}
          </div>
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={project.backgroundFit === "cover" ? "default" : "outline"}
              className="flex-1 text-xs"
              onClick={() => setBackgroundFit("cover")}
            >
              Cover
            </Button>
            <Button
              type="button"
              size="sm"
              variant={project.backgroundFit === "contain" ? "default" : "outline"}
              className="flex-1 text-xs"
              onClick={() => setBackgroundFit("contain")}
            >
              Contain
            </Button>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Opacity</span>
              <span>{Math.round(project.backgroundOpacity * 100)}%</span>
            </div>
            <Slider
              value={[project.backgroundOpacity]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(vals) => {
                const val = Array.isArray(vals) ? vals[0] : vals;
                if (typeof val === "number") setBackgroundOpacity(val);
              }}
            />
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Palette</p>
        <div className="grid grid-cols-2 gap-2">
          {palettes.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => setTheme(palette.id)}
              className={`rounded-lg border p-2 text-left text-xs ${
                project.themeId === palette.id ? "border-primary bg-primary/5" : "border-white/10"
              }`}
            >
              <span className="mb-1 flex gap-1">
                <Swatch color={palette.tokens.background} />
                <Swatch color={palette.tokens.primary} />
                <Swatch color={palette.tokens.secondary} />
              </span>
              {palette.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Accent">
          <input
            aria-label="Accent color"
            type="color"
            value={
              project.customTokens?.primary ??
              palettes.find((item) => item.id === project.themeId)?.tokens.primary ??
              "#C8102E"
            }
            onChange={(event) => {
              setCustomToken("primary", event.target.value);
              setCustomToken("accent", event.target.value);
            }}
            className="h-8 w-full cursor-pointer bg-transparent"
          />
        </Field>
        <Field label="Paper">
          <input
            aria-label="Background color"
            type="color"
            value={
              project.customTokens?.background ??
              palettes.find((item) => item.id === project.themeId)?.tokens.background ??
              "#F3EEE4"
            }
            onChange={(event) => setCustomToken("background", event.target.value)}
            className="h-8 w-full cursor-pointer bg-transparent"
          />
        </Field>
      </div>

      <div className="space-y-1.5 pt-2">
        {hasCustomPositions ? (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={resetAllPositions}>
            Reset all positions to formation
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={resetLineup}>
          Reset eleven
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Player cutouts use the numbered PNGs in assets/players. Club crests are loaded from assets/clubs.
      </p>
    </aside>
  );
}

function ClubSelect({
  label,
  value,
  excludeId,
  allowEmpty,
  onValueChange,
}: {
  label: string;
  value: string;
  excludeId?: string;
  allowEmpty?: boolean;
  onValueChange: (value: string) => void;
}) {
  const options = clubs.filter((club) => club.id !== excludeId);
  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(next ?? "")}
      items={[
        ...(allowEmpty ? [{ value: "", label: "Choose a club" }] : []),
        ...options.map((club) => ({ value: club.id, label: club.displayName })),
      ]}
    >
      <SelectTrigger aria-label={label} className="w-full bg-white/5">
        <SelectValue placeholder="Choose a club" />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty ? <SelectItem value="">Choose a club</SelectItem> : null}
        {options.map((club) => (
          <SelectItem key={club.id} value={club.id}>
            {club.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{label}</Label>
      {children}
    </label>
  );
}

function Swatch({ color }: { color: string }) {
  return <span className="size-3 rounded-full border border-black/20" style={{ background: color }} />;
}
