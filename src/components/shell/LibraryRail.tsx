import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clubs, competitions, playerCutoutSrc, players } from "@/data/catalog";
import {
  removeBackground,
  subscribeBackgrounds,
  uploadBackground,
  type CachedBackground,
} from "@/lib/background-manager";
import { useEditorStore } from "@/store/editor-store";
import type { ClubAsset, PlayerAsset } from "@/types/domain";

const positionFilters = ["ALL", "GK", "DEF", "MID", "FWD"] as const;

function positionLabel(position: PlayerAsset["position"]) {
  if (position === "GK") return "Goalkeeper";
  if (position === "DEF") return "Defender";
  if (position === "MID") return "Midfielder";
  if (position === "FWD") return "Forward";
  return "Position open";
}

export function LibraryRail({ fill = false }: { fill?: boolean }) {
  const libraryTab = useEditorStore((state) => state.libraryTab);
  const setLibraryTab = useEditorStore((state) => state.setLibraryTab);
  const playerQuery = useEditorStore((state) => state.playerQuery);
  const setPlayerQuery = useEditorStore((state) => state.setPlayerQuery);
  const positionFilter = useEditorStore((state) => state.positionFilter);
  const setPositionFilter = useEditorStore((state) => state.setPositionFilter);
  const clubQuery = useEditorStore((state) => state.clubQuery);
  const setClubQuery = useEditorStore((state) => state.setClubQuery);
  const competitionFilter = useEditorStore((state) => state.competitionFilter);
  const setCompetitionFilter = useEditorStore((state) => state.setCompetitionFilter);
  const assignPlayer = useEditorStore((state) => state.assignPlayer);
  const setOpponent = useEditorStore((state) => state.setOpponent);
  const setHome = useEditorStore((state) => state.setHome);
  const selection = useEditorStore((state) => state.selection);
  const lineup = useEditorStore((state) => state.project.lineupSlots);

  const placed = new Set(lineup.map((slot) => slot.playerId).filter(Boolean));
  const visiblePlayers = players.filter((player) => {
    const haystack = `${player.displayName} ${player.shortName}`.toLowerCase();
    if (playerQuery && !haystack.includes(playerQuery.toLowerCase())) return false;
    if (positionFilter !== "ALL") return player.position === positionFilter;
    return player.active;
  });

  const visibleClubs = clubs.filter((club) => {
    if (competitionFilter !== "all" && !club.competitions.includes(competitionFilter)) return false;
    if (clubQuery && !`${club.displayName} ${club.shortName}`.toLowerCase().includes(clubQuery.toLowerCase())) {
      return false;
    }
    return club.active;
  });

  return (
    <aside
      className={`flex shrink-0 flex-col border-white/10 bg-sidebar ${
        fill ? "h-full w-full" : "w-[280px] border-r"
      }`}
    >
      <Tabs
        value={libraryTab}
        onValueChange={(value) => setLibraryTab(value as typeof libraryTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="px-3 pt-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="clubs">Clubs</TabsTrigger>
            <TabsTrigger value="backgrounds">Walls</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="players" className="flex min-h-0 flex-col">
          <div className="space-y-2 px-3 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
              <Input
                value={playerQuery}
                onChange={(event) => setPlayerQuery(event.target.value)}
                placeholder="Search squad"
                aria-label="Search players"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {positionFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPositionFilter(filter)}
                  className={`rounded-full px-2 py-0.5 text-[11px] tracking-wide uppercase ${
                    positionFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {filter === "ALL" ? "All" : filter}
                </button>
              ))}
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="grid grid-cols-2 gap-2 px-3 pb-4">
              {visiblePlayers.length === 0 ? (
                <EmptyCopy>
                  No players match this filter. Positions stay blank until you confirm them.
                </EmptyCopy>
              ) : (
                visiblePlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    placed={placed.has(player.id)}
                    onChoose={() => assignPlayer(player.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clubs" className="flex min-h-0 flex-col">
          <div className="space-y-2 px-3 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
              <Input
                value={clubQuery}
                onChange={(event) => setClubQuery(event.target.value)}
                placeholder="Search clubs"
                aria-label="Search clubs"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {competitions.map((competition) => (
                <button
                  key={competition.id}
                  type="button"
                  onClick={() => setCompetitionFilter(competition.id)}
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    competitionFilter === competition.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {competition.label}
                </button>
              ))}
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-1.5 px-3 pb-4">
              {visibleClubs.length === 0 ? (
                <EmptyCopy>
                  Copa del Rey opponents are added after the official draw. Nothing is invented here.
                </EmptyCopy>
              ) : (
                visibleClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onChoose={() => (selection.kind === "home" ? setHome(club.id) : setOpponent(club.id))}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="backgrounds" className="flex min-h-0 flex-col">
          <BackgroundsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function BackgroundsTab() {
  const [backgrounds, setBackgrounds] = useState<CachedBackground[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundAssetId = useEditorStore((state) => state.project.backgroundAssetId);
  const setBackgroundAssetId = useEditorStore((state) => state.setBackgroundAssetId);

  useEffect(() => {
    return subscribeBackgrounds((list) => setBackgrounds(list));
  }, []);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PNG, JPEG, or WebP image.");
      return;
    }

    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("Image file is too large (max 15MB).");
      return;
    }

    try {
      setIsUploading(true);
      const uploaded = await uploadBackground(file);
      setBackgroundAssetId(uploaded.id);
      toast.success("Wallpaper uploaded and applied!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save wallpaper.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await removeBackground(id);
      if (backgroundAssetId === id) {
        setBackgroundAssetId(undefined);
      }
      toast.success("Wallpaper removed from library.");
    } catch {
      toast.error("Failed to delete wallpaper.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="rounded-xl border border-dashed border-white/15 bg-white/3 p-3.5 text-center">
        <p className="font-display text-2xl font-bold tracking-wide uppercase">Wallpaper Desk</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload PNG, JPEG, or WebP (max 15 MB). Persisted locally in your browser.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1.5 size-3.5" />
            {isUploading ? "Uploading..." : "Upload image"}
          </Button>
          {backgroundAssetId ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setBackgroundAssetId(undefined)}
            >
              Detach
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Your Wallpapers ({backgrounds.length})
        </span>
      </div>

      <ScrollArea className="mt-2 min-h-0 flex-1">
        {backgrounds.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No custom wallpapers yet. Upload one to personalize your poster.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 pb-4">
            {backgrounds.map((bg) => {
              const active = backgroundAssetId === bg.id;
              return (
                <div
                  key={bg.id}
                  onClick={() => setBackgroundAssetId(bg.id)}
                  className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border p-1 text-left transition ${
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-white/10 bg-white/4 hover:border-white/25 hover:bg-white/8"
                  }`}
                >
                  <div className="relative aspect-4/5 w-full overflow-hidden rounded bg-black/40">
                    <img
                      src={bg.url}
                      alt={bg.name}
                      className="h-full w-full object-cover"
                    />
                    {active ? (
                      <span className="absolute top-1 right-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                        ACTIVE
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1 px-1">
                    <span className="truncate text-[11px] font-medium text-foreground/80">
                      {bg.name}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete wallpaper"
                      onClick={(e) => handleDelete(bg.id, e)}
                      className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function PlayerCard({
  player,
  placed,
  onChoose,
}: {
  player: PlayerAsset;
  placed: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", `player:${player.id}`);
        event.dataTransfer.effectAllowed = "copy";
      }}
      onClick={onChoose}
      className="rounded-xl border border-white/10 bg-white/4 p-2 text-left transition hover:border-primary/60 hover:bg-white/8"
    >
      <div className="flex h-28 items-end justify-center overflow-hidden rounded-lg bg-black/25">
        <img
          src={playerCutoutSrc(player)}
          alt=""
          draggable={false}
          className="h-full w-full object-contain object-bottom"
        />
      </div>
      <div className="mt-2 truncate text-sm font-medium">{player.displayName}</div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{positionLabel(player.position)}</span>
        {placed ? <Badge variant="secondary">In XI</Badge> : null}
      </div>
    </button>
  );
}

function ClubCard({ club, onChoose }: { club: ClubAsset; onChoose: () => void }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", `club:${club.id}`);
        event.dataTransfer.effectAllowed = "copy";
      }}
      onClick={onChoose}
      className="flex w-full items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-2 py-1.5 text-left hover:border-primary/50"
    >
      {club.crestPath?.endsWith(".svg") ? (
        <img src={club.crestPath} alt="" className="h-9 w-auto shrink-0 object-contain" />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-white/20 font-display text-xs">
          {club.shortName.slice(0, 3)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm">{club.displayName}</span>
        {club.crestPath?.endsWith(".svg") ? null : (
          <span className="block text-[11px] text-muted-foreground">Crest not installed</span>
        )}
      </span>
    </button>
  );
}

function EmptyCopy({ children }: { children: string }) {
  return <p className="col-span-2 px-1 py-6 text-sm text-muted-foreground">{children}</p>;
}
