import { useEffect, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Scan } from "lucide-react";
import { Poster } from "@/features/templates/Poster";
import { getTemplate } from "@/features/templates/skins";
import { useEditorStore } from "@/store/editor-store";

const STAGE_WIDTH = 1080;
const STAGE_HEIGHT = 1350;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 2.75;

export function ArtboardViewport() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.55);
  const [zoom, setZoom] = useState(1.15);
  const skinId = useEditorStore((state) => state.project.skinId);
  const setSelection = useEditorStore((state) => state.setSelection);
  const skin = getTemplate(skinId);
  const scale = fitScale * zoom;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const next = Math.min(
        (frame.clientWidth - 28) / STAGE_WIDTH,
        (frame.clientHeight - 36) / STAGE_HEIGHT,
      );
      setFitScale(Math.max(0.2, next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? 0.92 : 1.08;
      setZoom((current) => clamp(current * direction));
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="relative min-h-0 min-w-0 flex-1">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(75% 60% at 0% 0%, rgb(0 0 0 / 0.78), transparent 62%),
            radial-gradient(75% 60% at 100% 0%, rgb(0 0 0 / 0.78), transparent 62%),
            radial-gradient(75% 60% at 0% 100%, rgb(0 0 0 / 0.78), transparent 62%),
            radial-gradient(75% 60% at 100% 100%, rgb(0 0 0 / 0.78), transparent 62%)
          `,
        }}
      />
      <div
        ref={frameRef}
        className="absolute inset-0 overflow-auto"
        onClick={() => setSelection({ kind: "none" })}
      >
        <div
          className="flex items-center justify-center p-6"
          style={{
            minWidth: "100%",
            minHeight: "100%",
            width: STAGE_WIDTH * scale + 64,
            height: STAGE_HEIGHT * scale + 64,
          }}
        >
          <div className="relative" style={{ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }}>
            <div
              className="absolute top-0 left-0 origin-top-left shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
              style={{ transform: `scale(${scale})` }}
            >
              <Poster />
            </div>
          </div>
        </div>
      </div>
      <div
        className="absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] tracking-[0.14em] text-foreground/85 uppercase backdrop-blur"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="px-2">{skin.label}</span>
        <span className="text-foreground/35">1080 × 1350</span>
        <ZoomButton label="Zoom out" onClick={() => setZoom((current) => clamp(current / 1.15))}>
          <Minus className="size-3.5" />
        </ZoomButton>
        <span className="min-w-12 px-1 text-center">{Math.round(zoom * 100)}%</span>
        <ZoomButton label="Zoom in" onClick={() => setZoom((current) => clamp(current * 1.15))}>
          <Plus className="size-3.5" />
        </ZoomButton>
        <ZoomButton label="Fit canvas" onClick={() => setZoom(1)}>
          <Scan className="size-3.5" />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-full hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function clamp(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}
