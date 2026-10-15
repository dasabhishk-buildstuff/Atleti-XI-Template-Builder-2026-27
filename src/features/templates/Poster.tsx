import { useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";
import { getClub, getPlayer, HOME_CLUB_ID, playerCutoutSrc } from "@/data/catalog";
import { mapNormalizedToRect } from "@/features/formations/geometry";
import { getFormation } from "@/features/formations/presets";
import { getTemplate } from "@/features/templates/skins";
import { resolveTokens } from "@/features/theme/palettes";
import { getBackgroundUrl, subscribeBackgrounds } from "@/lib/background-manager";
import { useEditorStore } from "@/store/editor-store";
import type { DesignTokens, FormationSlot, LineupSlotState, Rect } from "@/types/domain";

const STAGE = { width: 1080, height: 1350 };

export function Poster() {
  const project = useEditorStore((state) => state.project);
  const selection = useEditorStore((state) => state.selection);
  const setSelection = useEditorStore((state) => state.setSelection);
  const assignPlayer = useEditorStore((state) => state.assignPlayer);
  const setOpponent = useEditorStore((state) => state.setOpponent);
  const setHome = useEditorStore((state) => state.setHome);
  const swapSides = useEditorStore((state) => state.swapSides);
  const setSlotPositionOverride = useEditorStore((state) => state.setSlotPositionOverride);
  const setSlotScaleOverride = useEditorStore((state) => state.setSlotScaleOverride);

  const template = getTemplate(project.skinId);
  const formation = getFormation(project.formationId);
  const tokens = resolveTokens(project.themeId, project.customTokens);
  const home = getClub(project.match.homeClubId === "" ? "" : (project.match.homeClubId ?? HOME_CLUB_ID));
  const opponent = getClub(project.match.opponentClubId);

  const [bgUrl, setBgUrl] = useState<string | undefined>(() =>
    getBackgroundUrl(project.backgroundAssetId)
  );

  useEffect(() => {
    setBgUrl(getBackgroundUrl(project.backgroundAssetId));
    return subscribeBackgrounds(() => {
      setBgUrl(getBackgroundUrl(project.backgroundAssetId));
    });
  }, [project.backgroundAssetId]);

  function onDragOver(event: DragEvent) {
    if (event.dataTransfer.types.includes("text/plain")) {
      event.preventDefault();
    }
  }

  return (
    <div
      data-artboard
      style={{
        width: STAGE.width,
        height: STAGE.height,
        position: "relative",
        overflow: "hidden",
        background: tokens.background,
        color: tokens.text,
        fontFamily: '"Figtree", sans-serif',
      }}
    >
      <SkinBackdrop
        skinId={template.id}
        tokens={tokens}
        bgUrl={bgUrl}
        backgroundFit={project.backgroundFit}
        backgroundOpacity={project.backgroundOpacity}
        competition={project.match.competition}
        title={project.match.title}
        subtitle={project.match.subtitle}
        dateText={project.match.dateText}
        kickoffText={project.match.kickoffText}
        formationLabel={formation.label}
        homeName={home?.shortName ?? "Home"}
        homeCrest={home?.crestPath?.endsWith(".svg") ? home.crestPath : undefined}
        opponentName={opponent?.shortName ?? "Opponent"}
        opponentCrest={opponent?.crestPath?.endsWith(".svg") ? opponent.crestPath : undefined}
        homeSelected={selection.kind === "home"}
        opponentSelected={selection.kind === "opponent"}
        titleSelected={selection.kind === "title"}
        onSelectTitle={() => setSelection({ kind: "title" })}
        onSelectHome={() => setSelection({ kind: "home" })}
        onSelectOpponent={() => setSelection({ kind: "opponent" })}
        onHomeDrop={(clubId) => setHome(clubId)}
        onOpponentDrop={(clubId) => setOpponent(clubId)}
        onSwapSides={swapSides}
      />
      {formation.slots.map((slot) => {
        const state = project.lineupSlots.find(
          (item) => item.formationSlotId === slot.id,
        );
        const point = mapNormalizedToRect(
          state?.positionOverride ?? { x: slot.x, y: slot.y },
          template.formationBounds,
        );
        if (!state?.positionOverride) {
          point.y += rowGapOffset(formation.slots, slot.y, 8);
        }
        return (
          <PlayerNode
            key={slot.id}
            slot={slot}
            state={state}
            x={point.x}
            y={point.y}
            tokens={tokens}
            bounds={template.formationBounds}
            frame={cutoutFrame(template.id, template.formationBounds, formation.slots)}
            selected={selection.kind === "slot" && selection.slotId === slot.id}
            onSelect={() => setSelection({ kind: "slot", slotId: slot.id })}
            onDropPlayer={(playerId) => assignPlayer(playerId, slot.id)}
            onDragOver={onDragOver}
            onMove={(normX, normY) => setSlotPositionOverride(slot.id, { x: normX, y: normY })}
            onResize={(scale, commit) => setSlotScaleOverride(slot.id, scale, commit)}
          />
        );
      })}
    </div>
  );
}

function SkinBackdrop({ skinId, ...props }: BackdropProps & { skinId: string }) {
  if (skinId === "stadium") return <StadiumBackdrop {...props} />;
  if (skinId === "tactical") return <TacticalBackdrop {...props} />;
  if (skinId === "heritage") return <HeritageBackdrop {...props} />;
  return <EditorialBackdrop {...props} />;
}

function WallpaperLayer({
  url,
  fit,
  opacity,
}: {
  url: string;
  fit: "cover" | "contain";
  opacity: number;
}) {
  return (
    <div
      data-canvas-background
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <img
        src={url}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          opacity: opacity,
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.52) 100%)",
        }}
      />
    </div>
  );
}

function EditorialBackdrop(props: BackdropProps) {
  const { tokens, bgUrl, backgroundFit, backgroundOpacity } = props;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: tokens.background }} />
      {bgUrl ? (
        <WallpaperLayer url={bgUrl} fit={backgroundFit} opacity={backgroundOpacity} />
      ) : null}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, background: tokens.primary, zIndex: 2 }} />
      <div style={{ position: "absolute", left: 64, right: 56, top: 58, zIndex: 2 }}>
        <Kicker color={tokens.mutedText}>{props.competition}</Kicker>
        <TitleButton
          selected={props.titleSelected}
          color={tokens.text}
          accent={tokens.primary}
          onClick={props.onSelectTitle}
        >
          {props.title || "Starting XI"}
        </TitleButton>
        <p style={{ margin: "10px 0 0", fontSize: 28, color: tokens.mutedText, fontFamily: '"Newsreader", serif', fontStyle: "italic" }}>
          {props.subtitle || "Atlético de Madrid"}
        </p>
        <div style={{ height: 1, margin: "28px 0 22px", background: tokens.text, opacity: 0.16 }} />
        <Matchup {...props} />
        <MetaLine tokens={tokens} dateText={props.dateText} kickoffText={props.kickoffText} formationLabel={props.formationLabel} />
      </div>
      <div style={{ position: "relative", zIndex: 2 }}>
        <PitchWash tokens={tokens} top={500} />
      </div>
      <div style={{ position: "relative", zIndex: 2 }}>
        <FooterMark tokens={tokens} />
      </div>
    </>
  );
}

function StadiumBackdrop(props: BackdropProps) {
  const { tokens, bgUrl, backgroundFit, backgroundOpacity } = props;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: tokens.background }} />
      {bgUrl ? (
        <WallpaperLayer url={bgUrl} fit={backgroundFit} opacity={backgroundOpacity} />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: `
            radial-gradient(460px 260px at 16% 0%, ${tokens.secondary}88, transparent 70%),
            radial-gradient(520px 300px at 86% 0%, ${tokens.primary}77, transparent 72%),
            ${bgUrl ? "rgba(7, 10, 16, 0.45)" : tokens.background}
          `,
        }}
      />
      <div style={{ position: "absolute", left: 64, right: 64, top: 72, textAlign: "center", zIndex: 2 }}>
        <Kicker color={tokens.mutedText}>{props.competition}</Kicker>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <LogoDuel {...props} large />
        </div>
        <TitleButton
          selected={props.titleSelected}
          color={tokens.text}
          accent={tokens.primary}
          onClick={props.onSelectTitle}
          align="center"
        >
          {props.title || "Starting XI"}
        </TitleButton>
        <MetaLine tokens={tokens} dateText={props.dateText} kickoffText={props.kickoffText} formationLabel="" centered />
      </div>
      <div
        style={{
          position: "absolute",
          left: 64,
          right: 64,
          top: 500,
          bottom: 72,
          borderRadius: 28,
          background: bgUrl ? `${tokens.surface}cc` : tokens.surface,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          zIndex: 2,
        }}
      />
      <div style={{ position: "relative", zIndex: 2 }}>
        <PitchWash tokens={tokens} top={530} inset={96} />
      </div>
    </>
  );
}

function TacticalBackdrop(props: BackdropProps) {
  const { tokens, bgUrl, backgroundFit, backgroundOpacity } = props;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: tokens.background }} />
      {bgUrl ? (
        <WallpaperLayer url={bgUrl} fit={backgroundFit} opacity={backgroundOpacity} />
      ) : null}
      <div style={{ position: "absolute", left: 48, right: 48, top: 42, zIndex: 2 }}>
        <Kicker color={tokens.mutedText}>{props.competition}</Kicker>
        <div style={{ fontFamily: '"Newsreader", serif', fontSize: 54, lineHeight: 0.95 }}>{props.title || "Starting XI"}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 4, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            <LogoDuel {...props} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 48, top: 168, letterSpacing: "0.22em", fontSize: 14, textTransform: "uppercase", color: tokens.mutedText, zIndex: 2 }}>
        {props.formationLabel}
      </div>
      <FootballPitch hasWallpaper={Boolean(bgUrl)} />
    </>
  );
}

function FootballPitch({ hasWallpaper = false }: { hasWallpaper?: boolean }) {
  const x = 120;
  const y = 230;
  const w = 840;
  const h = 1020;
  const pad = 26;
  const left = pad;
  const top = pad;
  const right = w - pad;
  const bottom = h - pad;
  const width = right - left;
  const height = bottom - top;
  const cx = left + width / 2;
  const cy = top + height / 2;
  const penW = width * (40.32 / 68);
  const penH = height * (16.5 / 105);
  const sixW = width * (18.32 / 68);
  const sixH = height * (5.5 / 105);
  const spot = height * (11 / 105);
  const radius = width * (9.15 / 68);
  const corner = width * (1 / 68);
  const goalW = width * (7.32 / 68);
  const goalD = 16;
  const stripe = w / 12;
  const line = "#f4f7f2";

  return (
    <svg
      aria-hidden
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 2, opacity: hasWallpaper ? 0.88 : 1 }}
    >
      {Array.from({ length: 12 }, (_, index) => (
        <rect
          key={index}
          x={index * stripe}
          y={0}
          width={stripe + 0.5}
          height={h}
          fill={index % 2 === 0 ? "#1c7a3a" : "#176832"}
        />
      ))}
      <rect width={w} height={h} fill="url(#tactical-pitch-shade)" />
      <g fill="none" stroke={line} strokeWidth={3} strokeLinejoin="round">
        <rect x={left} y={top} width={width} height={height} />
        <line x1={left} y1={cy} x2={right} y2={cy} />
        <circle cx={cx} cy={cy} r={radius} />
        <rect x={cx - penW / 2} y={top} width={penW} height={penH} />
        <rect x={cx - penW / 2} y={bottom - penH} width={penW} height={penH} />
        <rect x={cx - sixW / 2} y={top} width={sixW} height={sixH} />
        <rect x={cx - sixW / 2} y={bottom - sixH} width={sixW} height={sixH} />
        <rect x={cx - goalW / 2} y={top - goalD} width={goalW} height={goalD} />
        <rect x={cx - goalW / 2} y={bottom} width={goalW} height={goalD} />
        <circle cx={left} cy={top} r={corner} clipPath="url(#tactical-field-clip)" />
        <circle cx={right} cy={top} r={corner} clipPath="url(#tactical-field-clip)" />
        <circle cx={left} cy={bottom} r={corner} clipPath="url(#tactical-field-clip)" />
        <circle cx={right} cy={bottom} r={corner} clipPath="url(#tactical-field-clip)" />
        <circle cx={cx} cy={top + spot} r={radius} clipPath="url(#tactical-top-arc)" />
        <circle cx={cx} cy={bottom - spot} r={radius} clipPath="url(#tactical-bottom-arc)" />
      </g>
      <g fill={line}>
        <circle cx={cx} cy={cy} r={4} />
        <circle cx={cx} cy={top + spot} r={3.5} />
        <circle cx={cx} cy={bottom - spot} r={3.5} />
      </g>
      <defs>
        <linearGradient id="tactical-pitch-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04140a" stopOpacity="0.18" />
          <stop offset="0.45" stopColor="#04140a" stopOpacity="0" />
          <stop offset="1" stopColor="#04140a" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id="tactical-field-clip">
          <rect x={left} y={top} width={width} height={height} />
        </clipPath>
        <clipPath id="tactical-top-arc">
          <rect x={left} y={top + penH} width={width} height={height / 2} />
        </clipPath>
        <clipPath id="tactical-bottom-arc">
          <rect x={left} y={cy} width={width} height={bottom - cy - penH} />
        </clipPath>
      </defs>
    </svg>
  );
}

function HeritageBackdrop(props: BackdropProps) {
  const { tokens, bgUrl, backgroundFit, backgroundOpacity } = props;
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: `repeating-linear-gradient(90deg, ${tokens.primary} 0 78px, ${tokens.secondary} 78px 156px)`,
        }}
      />
      {bgUrl ? (
        <WallpaperLayer url={bgUrl} fit={backgroundFit} opacity={backgroundOpacity} />
      ) : null}
      <div style={{ position: "absolute", left: 36, top: 48, width: 340, color: "#F7F3EC", zIndex: 2 }}>
        <div style={{ fontSize: 13, letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.85 }}>{props.competition}</div>
        <TitleButton selected={props.titleSelected} color="#F7F3EC" accent="#F7F3EC" onClick={props.onSelectTitle}>
          {props.title || "Starting XI"}
        </TitleButton>
        <p style={{ margin: "8px 0 0", fontFamily: '"Newsreader", serif', fontStyle: "italic", fontSize: 26 }}>{props.subtitle}</p>
        <div style={{ marginTop: 28 }}>
          <OpponentTarget {...props} light />
        </div>
        <div style={{ marginTop: 18, fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          {props.formationLabel}
          {props.dateText ? ` · ${props.dateText}` : ""}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 400,
          top: 72,
          width: 632,
          bottom: 56,
          background: bgUrl ? `${tokens.surface}e6` : tokens.surface,
          borderRadius: 28,
          zIndex: 2,
        }}
      />
    </>
  );
}

interface BackdropProps {
  tokens: DesignTokens;
  bgUrl?: string;
  backgroundFit: "cover" | "contain";
  backgroundOpacity: number;
  competition: string;
  title: string;
  subtitle?: string;
  dateText?: string;
  kickoffText?: string;
  formationLabel: string;
  homeName: string;
  homeCrest?: string;
  opponentName: string;
  opponentCrest?: string;
  opponentSelected: boolean;
  homeSelected: boolean;
  titleSelected: boolean;
  onSelectTitle: () => void;
  onSelectOpponent: () => void;
  onSelectHome: () => void;
  onOpponentDrop: (clubId: string) => void;
  onHomeDrop: (clubId: string) => void;
  onSwapSides: () => void;
}

function Kicker({ children, color }: { children: string; color: string }) {
  return (
    <div style={{ fontSize: 16, letterSpacing: "0.32em", textTransform: "uppercase", color }}>{children}</div>
  );
}

function TitleButton({
  children,
  selected,
  color,
  accent,
  onClick,
  align = "left",
}: {
  children: string;
  selected: boolean;
  color: string;
  accent: string;
  onClick: () => void;
  align?: "left" | "center";
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      style={{
        display: "block",
        width: "100%",
        marginTop: 12,
        padding: 0,
        border: "none",
        background: "transparent",
        textAlign: align,
        color,
        fontFamily: '"Newsreader", serif',
        fontSize: 86,
        lineHeight: 0.88,
        letterSpacing: "-0.03em",
        cursor: "pointer",
        outline: selected ? `2px solid ${accent}` : "none",
        outlineOffset: 8,
      }}
    >
      {children}
    </button>
  );
}

function Matchup(props: BackdropProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <NamedSide
        label="Home"
        name={props.homeName}
        crest={props.homeCrest}
        tokens={props.tokens}
        selected={props.homeSelected}
        onSelect={props.onSelectHome}
        onDrop={props.onHomeDrop}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 36, textAlign: "center", letterSpacing: "0.14em", color: props.tokens.mutedText }}>VS</div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            props.onSwapSides();
          }}
          style={{
            border: `1px solid ${props.tokens.pitchLine}`,
            background: "transparent",
            color: props.tokens.mutedText,
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            padding: "4px 8px",
          }}
        >
          Swap
        </button>
      </div>
      <NamedSide
        label="Away"
        name={props.opponentName}
        crest={props.opponentCrest}
        tokens={props.tokens}
        selected={props.opponentSelected}
        onSelect={props.onSelectOpponent}
        onDrop={props.onOpponentDrop}
      />
    </div>
  );
}

function LogoDuel({ large, ...props }: BackdropProps & { large?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: large ? 36 : 18 }}>
      <CrestSlot
        crest={props.homeCrest}
        name={props.homeName}
        tokens={props.tokens}
        large={large}
        selected={props.homeSelected}
        onSelect={props.onSelectHome}
        onDrop={props.onHomeDrop}
      />
      <span
        style={{
          fontFamily: large ? '"Newsreader", serif' : undefined,
          fontSize: large ? 28 : 14,
          letterSpacing: "0.18em",
        }}
      >
        VS
      </span>
      <CrestSlot
        crest={props.opponentCrest}
        name={props.opponentName}
        tokens={props.tokens}
        large={large}
        selected={props.opponentSelected}
        onSelect={props.onSelectOpponent}
        onDrop={props.onOpponentDrop}
      />
    </div>
  );
}

function NamedSide({
  label,
  name,
  crest,
  tokens,
  selected,
  onSelect,
  onDrop,
}: {
  label: string;
  name: string;
  crest?: string;
  tokens: DesignTokens;
  selected: boolean;
  onSelect: () => void;
  onDrop: (clubId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("text/plain")) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload = event.dataTransfer.getData("text/plain");
        if (payload.startsWith("club:")) onDrop(payload.slice(5));
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        border: selected ? `2px solid ${tokens.primary}` : "2px dashed transparent",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        padding: 6,
        borderRadius: 16,
      }}
    >
      <Monogram name={name} tokens={tokens} crestSrc={crest} pending={!crest} />
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: tokens.mutedText }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 600 }}>{crest ? name : label}</div>
      </div>
    </button>
  );
}

function CrestSlot({
  crest,
  name,
  tokens,
  large,
  selected,
  onSelect,
  onDrop,
}: {
  crest?: string;
  name: string;
  tokens: DesignTokens;
  large?: boolean;
  selected: boolean;
  onSelect: () => void;
  onDrop: (clubId: string) => void;
}) {
  const height = large ? 112 : 72;
  return (
    <button
      type="button"
      aria-label={name}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("text/plain")) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload = event.dataTransfer.getData("text/plain");
        if (payload.startsWith("club:")) onDrop(payload.slice(5));
      }}
      style={{
        border: selected ? `2px solid ${tokens.primary}` : "2px dashed transparent",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        padding: 4,
        borderRadius: 8,
      }}
    >
      {crest ? (
        <img src={crest} alt="" draggable={false} style={{ height, width: "auto", display: "block", objectFit: "contain" }} />
      ) : (
        <span
          style={{
            display: "block",
            height,
            width: Math.round(height * 0.78),
            border: `1.5px dashed ${tokens.mutedText}`,
            borderRadius: 6,
          }}
        />
      )}
    </button>
  );
}

function OpponentTarget({
  tokens,
  opponentName,
  opponentCrest,
  opponentSelected,
  onSelectOpponent,
  onOpponentDrop,
  large,
  light,
}: BackdropProps & { large?: boolean; light?: boolean }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelectOpponent();
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("text/plain")) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const payload = event.dataTransfer.getData("text/plain");
        if (payload.startsWith("club:")) onOpponentDrop(payload.slice(5));
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        border: opponentSelected ? `2px solid ${light ? "#F7F3EC" : tokens.primary}` : "2px dashed transparent",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        padding: 6,
        borderRadius: 16,
      }}
    >
      <Monogram name={opponentName} tokens={tokens} large={large} crestSrc={opponentCrest} pending={!opponentCrest} />
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7 }}>Opponent</div>
        <div style={{ fontSize: large ? 26 : 28, fontWeight: 600 }}>{opponentName}</div>
      </div>
    </button>
  );
}

function Monogram({
  name,
  tokens,
  large,
  pending,
  crestSrc,
}: {
  name: string;
  tokens: DesignTokens;
  large?: boolean;
  pending?: boolean;
  crestSrc?: string;
}) {
  const size = large ? 112 : 78;
  return (
    <div style={{ position: "relative" }}>
      {crestSrc ? (
        <img
          src={crestSrc}
          alt=""
          draggable={false}
          style={{ height: size, width: "auto", display: "block", objectFit: "contain" }}
        />
      ) : (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: tokens.surface,
          color: tokens.primary,
          border: `1px solid ${tokens.pitchLine}`,
          fontFamily: '"Newsreader", serif',
          fontSize: large ? 28 : 20,
          letterSpacing: "0.04em",
        }}
      >
        {name.slice(0, 3).toUpperCase()}
      </div>
      )}
      {pending ? (
        <span style={{ position: "absolute", left: 0, right: 0, bottom: -16, textAlign: "center", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: tokens.mutedText }}>
          No crest
        </span>
      ) : null}
    </div>
  );
}

function MetaLine({
  tokens,
  dateText,
  kickoffText,
  formationLabel,
  centered,
}: {
  tokens: DesignTokens;
  dateText?: string;
  kickoffText?: string;
  formationLabel: string;
  centered?: boolean;
}) {
  const parts = [formationLabel, dateText, kickoffText].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div style={{ marginTop: 16, fontSize: 15, letterSpacing: "0.18em", textTransform: "uppercase", color: tokens.mutedText, textAlign: centered ? "center" : "left" }}>
      {parts.join("  ·  ")}
    </div>
  );
}

function PitchWash({ tokens, top, inset = 80 }: { tokens: DesignTokens; top: number; inset?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: inset,
        right: inset,
        top,
        bottom: 90,
        background: tokens.pitch,
        borderRadius: 24,
        opacity: 0.9,
      }}
    >
      <div style={{ position: "absolute", left: 24, right: 24, top: "18%", borderTop: `1px solid ${tokens.pitchLine}` }} />
      <div style={{ position: "absolute", left: 24, right: 24, top: "50%", borderTop: `1px solid ${tokens.pitchLine}` }} />
      <div style={{ position: "absolute", left: 24, right: 24, top: "78%", borderTop: `1px solid ${tokens.pitchLine}` }} />
    </div>
  );
}

function FooterMark({ tokens }: { tokens: DesignTokens }) {
  return (
    <div style={{ position: "absolute", left: 64, right: 56, bottom: 36, display: "flex", justifyContent: "space-between", alignItems: "flex-end", color: tokens.mutedText }}>
      <span style={{ letterSpacing: "0.24em", fontSize: 13, textTransform: "uppercase" }}>Starting eleven</span>
      <span style={{ fontFamily: '"Newsreader", serif', fontSize: 28, color: tokens.primary }}>Atleti</span>
    </div>
  );
}

function rowGapOffset(slots: FormationSlot[], y: number, extraPx: number) {
  const rows = [...new Set(slots.map((slot) => slot.y))].sort((a, b) => a - b);
  const index = rows.indexOf(y);
  if (index < 0) return 0;
  return (index - (rows.length - 1) / 2) * extraPx;
}

function cutoutFrame(
  skinId: string,
  bounds: { x: number; y: number; width: number; height: number },
  slots: FormationSlot[],
) {
  if (skinId !== "tactical") return { width: 168, height: 196, compact: false };
  const highest = Math.min(...slots.map((slot) => slot.y));
  const feet = bounds.y + highest * bounds.height;
  const height = Math.round(Math.min(bounds.height * 0.3, Math.max(200, feet - 274)));
  const width = Math.round(height * 0.7);
  return { width, height, compact: true };
}

function PlayerNode({
  slot,
  state,
  x,
  y,
  tokens,
  bounds,
  frame,
  selected,
  onSelect,
  onDropPlayer,
  onDragOver,
  onMove,
  onResize,
}: {
  slot: FormationSlot;
  state?: LineupSlotState;
  x: number;
  y: number;
  tokens: DesignTokens;
  bounds: Rect;
  frame: { width: number; height: number; compact: boolean };
  selected: boolean;
  onSelect: () => void;
  onDropPlayer: (playerId: string) => void;
  onDragOver: (event: DragEvent) => void;
  onMove: (normX: number, normY: number) => void;
  onResize: (scale: number, commit?: boolean) => void;
}) {
  const player = getPlayer(state?.playerId);
  const src = playerCutoutSrc(player);
  const label = state?.displayNameOverride || player?.shortName || "";
  const number = state?.shirtNumberOverride || (player?.shirtNumber ? String(player.shirtNumber) : "");
  const { compact } = frame;

  const scale = state?.scaleOverride ?? 1;
  const width = Math.round(frame.width * scale);
  const height = Math.round(frame.height * scale);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startLogicalX: number;
    startLogicalY: number;
  } | null>(null);

  const resizeRef = useRef<{
    startClientY: number;
    startHeight: number;
  } | null>(null);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startLogicalX: x,
      startLogicalY: y,
    };
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startClientX;
    const dy = e.clientY - dragRef.current.startClientY;
    if (!isDragging && Math.hypot(dx, dy) > 5) {
      setIsDragging(true);
    }
    if (isDragging) {
      const artboard = document.querySelector<HTMLElement>("[data-artboard]");
      const rect = artboard?.getBoundingClientRect();
      const currentScale = rect ? rect.width / STAGE.width : 1;
      const targetX = dragRef.current.startLogicalX + dx / currentScale;
      const targetY = dragRef.current.startLogicalY + dy / currentScale;
      const normX = Math.max(0, Math.min(1, (targetX - bounds.x) / bounds.width));
      const normY = Math.max(0, Math.min(1, (targetY - bounds.y) / bounds.height));
      onMove(normX, normY);
    }
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    const target = e.currentTarget;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {}
    if (!isDragging) {
      onSelect();
    }
    setIsDragging(false);
    dragRef.current = null;
  }

  function handleResizePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
    setIsResizing(true);
    resizeRef.current = {
      startClientY: e.clientY,
      startHeight: height,
    };
  }

  function handleResizePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!resizeRef.current) return;
    const dy = e.clientY - resizeRef.current.startClientY;
    const artboard = document.querySelector<HTMLElement>("[data-artboard]");
    const rect = artboard?.getBoundingClientRect();
    const currentScale = rect ? rect.width / STAGE.width : 1;
    // Moving up decreases clientY, increasing cutout height anchored at bottom feet
    const deltaHeight = -dy / currentScale;
    const newHeight = Math.max(60, resizeRef.current.startHeight + deltaHeight);
    const newScale = Math.max(0.4, Math.min(2.5, newHeight / frame.height));
    onResize(newScale, false);
  }

  function handleResizePointerUp(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    const target = e.currentTarget;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {}
    if (resizeRef.current) {
      const dy = e.clientY - resizeRef.current.startClientY;
      const artboard = document.querySelector<HTMLElement>("[data-artboard]");
      const rect = artboard?.getBoundingClientRect();
      const currentScale = rect ? rect.width / STAGE.width : 1;
      const deltaHeight = -dy / currentScale;
      const newHeight = Math.max(60, resizeRef.current.startHeight + deltaHeight);
      const newScale = Math.max(0.4, Math.min(2.5, newHeight / frame.height));
      onResize(newScale, true);
    }
    setIsResizing(false);
    resizeRef.current = null;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={onDragOver}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const payload = event.dataTransfer.getData("text/plain");
        if (payload.startsWith("player:")) onDropPlayer(payload.slice(7));
      }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: isDragging || isResizing ? 100 : 10 + Math.round(slot.y * 20),
        transform: "translate(-50%, -100%)",
        width,
        border: "none",
        background: "transparent",
        color: tokens.text,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        padding: 0,
        textAlign: "center",
        userSelect: "none",
        outline: "none",
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            display: "block",
            width,
            height,
            objectFit: "contain",
            objectPosition: "center bottom",
            background: "transparent",
            filter: selected
              ? `drop-shadow(0 0 0.5px ${tokens.primary}) drop-shadow(0 10px 12px rgba(0,0,0,0.28))`
              : "drop-shadow(0 12px 14px rgba(0,0,0,0.28))",
          }}
        />
      ) : (
        <div style={{ height, display: "grid", alignItems: "end", justifyItems: "center" }}>
          <div
            style={{
              width: compact ? Math.round(54 * scale) : Math.round(72 * scale),
              height: compact ? Math.round(78 * scale) : Math.round(108 * scale),
              borderRadius: 8,
              border: `1.5px dashed ${selected ? tokens.primary : tokens.pitchLine}`,
              color: tokens.mutedText,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              letterSpacing: "0.12em",
            }}
          >
            {slot.role}
          </div>
        </div>
      )}

      {/* Interactive Selection Box & Locked-Ratio Corner Handles */}
      {selected ? (
        <div data-no-export style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              inset: -3,
              border: `1.5px dashed ${tokens.primary}`,
              borderRadius: 6,
              boxShadow: `0 0 10px ${tokens.primary}44`,
            }}
          />
          {/* Top-Right Resize Handle */}
          <div
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            title="Drag to resize cutout (ratio locked)"
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#ffffff",
              border: `2px solid ${tokens.primary}`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
              cursor: "nesw-resize",
              pointerEvents: "auto",
              display: "grid",
              placeItems: "center",
              zIndex: 30,
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: tokens.primary }} />
          </div>
          {/* Top-Left Resize Handle */}
          <div
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            title="Drag to resize cutout (ratio locked)"
            style={{
              position: "absolute",
              top: -8,
              left: -8,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#ffffff",
              border: `2px solid ${tokens.primary}`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
              cursor: "nwse-resize",
              pointerEvents: "auto",
              display: "grid",
              placeItems: "center",
              zIndex: 30,
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: tokens.primary }} />
          </div>
          {isResizing ? (
            <div
              style={{
                position: "absolute",
                top: -32,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.88)",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "monospace",
                fontWeight: 600,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                border: "1px solid rgba(255,255,255,0.25)",
                zIndex: 40,
              }}
            >
              {Math.round(scale * 100)}% (Ratio Locked)
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: compact ? undefined : "100%",
          bottom: compact ? 0 : undefined,
          transform: "translateX(-50%)",
          marginTop: compact ? 0 : 4,
          maxWidth: width + 36,
          padding: "3px 7px 2px",
          borderRadius: 3,
          background: "rgba(8, 8, 10, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.72)",
          color: "#ffffff",
          fontSize: compact ? 13 : 15,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          pointerEvents: "none",
        }}
      >
        {player ? label : "Open"}
        {player && number ? (
          <span style={{ marginLeft: 5, fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", color: "rgba(255,255,255,0.86)" }}>
            {number}
          </span>
        ) : null}
      </div>
    </div>
  );
}
