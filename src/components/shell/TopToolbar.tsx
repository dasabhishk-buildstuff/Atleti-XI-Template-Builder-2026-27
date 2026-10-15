import { useRef, useState } from "react";
import { ChevronDown, Download, FileDown, FileUp, MoreVertical, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { matchCompetitions } from "@/data/catalog";
import { exportArtboardPng } from "@/features/export/exporter";
import { formations } from "@/features/formations/presets";
import { templates } from "@/features/templates/skins";
import { useEditorStore } from "@/store/editor-store";

export function TopToolbar() {
  const project = useEditorStore((state) => state.project);
  const past = useEditorStore((state) => state.past);
  const future = useEditorStore((state) => state.future);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const setSkin = useEditorStore((state) => state.setSkin);
  const setFormation = useEditorStore((state) => state.setFormation);
  const setProjectName = useEditorStore((state) => state.setProjectName);
  const setMatchField = useEditorStore((state) => state.setMatchField);
  const resetProject = useEditorStore((state) => state.resetProject);
  const exportProject = useEditorStore((state) => state.exportProject);
  const importProject = useEditorStore((state) => state.importProject);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(ratio: 2 | 3 = 2) {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportArtboardPng(project, ratio);
    } finally {
      setIsExporting(false);
    }
  }

  function handleExportJson() {
    const json = exportProject();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const name = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    link.href = url;
    link.download = `${name}-project.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Project JSON downloaded.");
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        importProject(content);
      }
    };
    reader.readAsText(file);
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b-2 border-primary bg-black px-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className="flex items-center gap-2.5 pr-2">
        <img src="/ATM.svg" alt="Atlético de Madrid" className="h-11 w-auto" />
        <div className="leading-none">
          <div className="font-display text-[28px] leading-none font-bold tracking-wide text-white uppercase">Atleti</div>
          <div className="text-[10px] tracking-[0.28em] text-white/70 uppercase">XI Studio</div>
        </div>
      </div>

      <input
        aria-label="Project name"
        value={project.name}
        onChange={(event) => setProjectName(event.target.value)}
        className="hidden h-8 w-56 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 xl:block"
      />

      <ToolbarSelect
        label="Template"
        value={project.skinId}
        onValueChange={(value) => value && setSkin(value)}
        options={templates.map((template) => ({ value: template.id, label: template.label }))}
      />
      <ToolbarSelect
        label="Formation"
        value={project.formationId}
        onValueChange={(value) => value && setFormation(value)}
        options={formations.map((formation) => ({ value: formation.id, label: formation.label }))}
      />
      <ToolbarSelect
        label="Competition"
        value={project.match.competition}
        onValueChange={(value) => value && setMatchField("competition", value)}
        options={matchCompetitions.map((label) => ({ value: label, label }))}
      />

      <div className="ml-auto flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" disabled={past.length === 0} onClick={undo} aria-label="Undo" />
            }
          >
            <Undo2 />
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" disabled={future.length === 0} onClick={redo} aria-label="Redo" />
            }
          >
            <Redo2 />
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Project actions" />
            }
          >
            <MoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Project
            </div>
            <DropdownMenuItem onClick={handleExportJson}>
              <FileDown className="mr-2 size-4" />
              Export Project JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2 size-4" />
              Import Project JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (window.confirm("Reset lineup and project back to initial default?")) {
                  resetProject();
                }
              }}
            >
              <RotateCcw className="mr-2 size-4" />
              Reset Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Split Export Button: 1-click 2x export + resolution dropdown */}
        <div className="ml-1.5 flex items-center shadow-sm">
          <Button
            className="rounded-r-none font-medium gap-1.5"
            disabled={isExporting}
            onClick={() => handleExport(2)}
          >
            <Download className="size-4" />
            {isExporting ? "Exporting..." : "Export 2× PNG"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  className="rounded-l-none border-l border-white/20 px-2"
                  disabled={isExporting}
                  aria-label="Export resolutions"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Choose Resolution
              </div>
              <DropdownMenuItem onClick={() => handleExport(2)}>
                <span className="font-medium">2× High-Res PNG</span>
                <span className="ml-auto text-xs text-muted-foreground">2160 × 2700</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(3)}>
                <span className="font-medium">3× Ultra-Res PNG</span>
                <span className="ml-auto text-xs text-muted-foreground">3240 × 4050</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function ToolbarSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string | null) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} items={options}>
      <SelectTrigger aria-label={label} className="max-w-44 bg-white/5">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
