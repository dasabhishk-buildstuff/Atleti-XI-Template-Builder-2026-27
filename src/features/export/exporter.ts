import { toBlob, toPng } from "html-to-image";
import { toast } from "sonner";
import type { CanvasProject } from "@/types/domain";

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
  const binaryString = window.atob(parts[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function exportArtboardPng(
  project: CanvasProject,
  pixelRatio: 2 | 3 = 2,
): Promise<void> {
  const artboard = document.querySelector<HTMLElement>("[data-artboard]");
  if (!artboard) {
    toast.error("Could not find artboard to export.");
    return;
  }

  const opponent = project.match.opponentClubId || "matchday";
  const dateStr = project.match.dateText ? `-${project.match.dateText.replace(/\s+/g, "_")}` : "";
  const sanitizedTitle = (project.name || "atleti-xi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const filename = `${sanitizedTitle || "atleti-xi"}-vs-${opponent}${dateStr}-${pixelRatio}x.png`;

  // 1. Prompt user for save location via File System Access API while user gesture is active
  let fileHandle: any = null;
  if ("showSaveFilePicker" in window) {
    try {
      fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "PNG Image (*.png)",
            accept: { "image/png": [".png"] },
          },
        ],
      });
    } catch (pickerErr: any) {
      if (pickerErr?.name === "AbortError") {
        // User deliberately canceled the save dialog
        return;
      }
      console.warn("showSaveFilePicker unavailable or dismissed, falling back to download link:", pickerErr);
    }
  }

  const exportToastId = toast.loading(
    `Generating ${pixelRatio}× PNG (${1080 * pixelRatio} × ${1350 * pixelRatio})...`,
  );

  try {
    // 2. Wait for document fonts to be ready
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // 3. Set export flag so outlines/handles can be cleanly hidden
    artboard.setAttribute("data-exporting", "true");

    // Allow pending DOM updates / paints to settle
    await new Promise((resolve) => setTimeout(resolve, 80));

    const targetWidth = 1080;
    const targetHeight = 1350;

    const TRANSPARENT_PIXEL =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    const exportOptions = {
      pixelRatio,
      width: targetWidth,
      height: targetHeight,
      canvasWidth: targetWidth * pixelRatio,
      canvasHeight: targetHeight * pixelRatio,
      cacheBust: false,
      skipFonts: true,
      imagePlaceholder: TRANSPARENT_PIXEL,
      onImageErrorHandler: () => TRANSPARENT_PIXEL,
      style: {
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
      },
      filter: (node: Node) => {
        if (node instanceof HTMLElement) {
          if (node.hasAttribute("data-no-export")) return false;
        }
        return true;
      },
    };

    // 4. Generate PNG Blob (direct toBlob with dataUrlToBlob fallback, never fetch(dataUrl))
    let blob: Blob | null = null;
    try {
      blob = await toBlob(artboard, exportOptions);
    } catch (blobErr) {
      console.warn("toBlob failed, attempting toPng fallback:", blobErr);
    }

    if (!blob) {
      const dataUrl = await toPng(artboard, exportOptions);
      if (!dataUrl || dataUrl === "data:,") {
        throw new Error("Canvas rendering produced an empty image.");
      }
      blob = dataUrlToBlob(dataUrl);
    }

    artboard.removeAttribute("data-exporting");

    if (!blob || blob.size === 0) {
      throw new Error("Generated PNG blob is empty.");
    }

    // 5. Save to user-selected fileHandle or trigger browser download anchor
    let savedToFile = false;
    if (fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        savedToFile = true;
      } catch (writeErr) {
        console.warn("Direct FileHandle write failed, falling back to download anchor:", writeErr);
      }
    }

    if (!savedToFile) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }

    const dims = `${targetWidth * pixelRatio} × ${targetHeight * pixelRatio}`;
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
    toast.success(`Saved ${filename} (${dims}, ${sizeMb} MB)`, { id: exportToastId });
  } catch (err) {
    artboard.removeAttribute("data-exporting");
    console.error("Export failed:", err);
    const errorMsg =
      err instanceof Error
        ? err.message
        : err instanceof Event
          ? "Asset load error while capturing artboard"
          : String(err);
    toast.error(`Export failed: ${errorMsg}`, { id: exportToastId });
  }
}

