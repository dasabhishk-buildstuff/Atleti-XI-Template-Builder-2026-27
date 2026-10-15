import { useEffect, useState } from "react";
import { ArtboardViewport } from "@/components/shell/ArtboardViewport";
import { InspectorPanel } from "@/components/shell/InspectorPanel";
import { LibraryRail } from "@/components/shell/LibraryRail";
import { TopToolbar } from "@/components/shell/TopToolbar";
import { useEditorStore } from "@/store/editor-store";

type Pane = "library" | "artboard" | "inspector";

export function Studio() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const hydrateStore = useEditorStore((state) => state.hydrateStore);
  const [wide, setWide] = useState(true);
  const [pane, setPane] = useState<Pane>("artboard");

  useEffect(() => {
    hydrateStore();
  }, [hydrateStore]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1180px)");
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redo, undo]);

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <TopToolbar />
      {wide ? (
        <div className="flex min-h-0 flex-1">
          <LibraryRail />
          <ArtboardViewport />
          <InspectorPanel />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex gap-1 border-b border-white/10 px-3 py-2">
            {(["library", "artboard", "inspector"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPane(item)}
                className={`rounded-full px-3 py-1 text-sm capitalize ${
                  pane === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {pane === "library" ? <LibraryRail fill /> : null}
            {pane === "artboard" ? <ArtboardViewport /> : null}
            {pane === "inspector" ? <InspectorPanel fill /> : null}
          </div>
        </div>
      )}
    </div>
  );
}
