import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { clubs } from "../src/data/catalog";
import { parseProjectJson } from "../src/lib/validation";
import { starterProject } from "../src/store/editor-store";

describe("project validation", () => {
  it("validates a healthy starter project", () => {
    const starter = starterProject();
    const result = parseProjectJson(JSON.stringify(starter));
    expect(result.success).toBe(true);
  });

  it("rejects invalid schema versions", () => {
    const invalid = { ...starterProject(), schemaVersion: 2 };
    const result = parseProjectJson(JSON.stringify(invalid));
    expect(result.success).toBe(false);
  });

  it("rejects malformed background settings", () => {
    const invalidFit = { ...starterProject(), backgroundFit: "stretch" };
    const result = parseProjectJson(JSON.stringify(invalidFit));
    expect(result.success).toBe(false);

    const invalidOpacity = { ...starterProject(), backgroundOpacity: 2.5 };
    const result2 = parseProjectJson(JSON.stringify(invalidOpacity));
    expect(result2.success).toBe(false);
  });

  it("validates lineup slot scale overrides", () => {
    const project = starterProject();
    project.lineupSlots[0].scaleOverride = 1.35;
    const result = parseProjectJson(JSON.stringify(project));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lineupSlots[0].scaleOverride).toBe(1.35);
    }
  });
});

describe("club crest asset verification", () => {
  it("verifies all 51 clubs have corresponding svg crest assets in public directory", () => {
    expect(clubs).toHaveLength(51);
    for (const club of clubs) {
      expect(club.crestPath).toBeDefined();
      expect(club.crestPath?.endsWith(".svg")).toBe(true);
      const relativePath = club.crestPath!.replace(/^\//, "");
      const fullPath = path.resolve(__dirname, "..", "public", relativePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});
