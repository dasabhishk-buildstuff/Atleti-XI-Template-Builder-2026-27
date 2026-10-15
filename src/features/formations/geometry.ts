import type { Rect } from "@/types/domain";

export interface Point {
  x: number;
  y: number;
}

/** Map a normalized formation coordinate into a skin's formation rectangle. */
export function mapNormalizedToRect(
  normalized: Point,
  bounds: Rect,
): Point {
  return {
    x: bounds.x + normalized.x * bounds.width,
    y: bounds.y + normalized.y * bounds.height,
  };
}
