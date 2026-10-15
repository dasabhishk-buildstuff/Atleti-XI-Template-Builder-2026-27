import { describe, expect, it } from "vitest";
import { clubs, players } from "../src/data/catalog";
import { mapNormalizedToRect } from "../src/features/formations/geometry";
import { formations } from "../src/features/formations/presets";

describe("formations", () => {
  it("ships seven formations with eleven unique in-bounds slots", () => {
    expect(formations).toHaveLength(7);
    for (const formation of formations) {
      expect(formation.slots).toHaveLength(11);
      const ids = formation.slots.map((slot) => slot.id);
      expect(new Set(ids).size).toBe(11);
      for (const slot of formation.slots) {
        expect(Number.isFinite(slot.x)).toBe(true);
        expect(Number.isFinite(slot.y)).toBe(true);
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.x).toBeLessThanOrEqual(1);
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("maps normalized coordinates into a template rectangle", () => {
    const point = mapNormalizedToRect(
      { x: 0.5, y: 1 },
      { x: 100, y: 200, width: 800, height: 400 },
    );
    expect(point).toEqual({ x: 500, y: 600 });
  });
});

describe("catalogues", () => {
  it("lists the 24 Atlético labels without duplicate ids", () => {
    expect(players).toHaveLength(24);
    expect(new Set(players.map((player) => player.id)).size).toBe(24);
  });

  it("deduplicates clubs across competition tags", () => {
    expect(new Set(clubs.map((club) => club.id)).size).toBe(clubs.length);
    expect(clubs.filter((club) => club.competitions.includes("laliga-2026-27"))).toHaveLength(20);
    expect(clubs.filter((club) => club.competitions.includes("ucl-2026-27"))).toHaveLength(36);
    expect(clubs.filter((club) => club.competitions.includes("supercopa-2027"))).toHaveLength(4);
    expect(clubs.filter((club) => club.atletiOpponent)).toHaveLength(8);
    const madrid = clubs.filter((club) => club.id === "real-madrid");
    expect(madrid).toHaveLength(1);
    expect(madrid[0]?.competitions).toEqual(
      expect.arrayContaining(["laliga-2026-27", "ucl-2026-27", "supercopa-2027"]),
    );
  });
});
