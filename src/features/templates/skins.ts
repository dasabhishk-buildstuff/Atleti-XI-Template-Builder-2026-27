import type { TemplateDefinition } from "@/types/domain";

export const templates: TemplateDefinition[] = [
  {
    id: "editorial",
    label: "Editorial Cover",
    description: "Magazine cover. Large headline, quiet pitch.",
    formationBounds: { x: 96, y: 520, width: 888, height: 720 },
    playerPresentation: "portrait-card",
  },
  {
    id: "stadium",
    label: "Stadium Night",
    description: "Floodlit poster. Crests up top, lineup below.",
    formationBounds: { x: 110, y: 560, width: 860, height: 680 },
    playerPresentation: "portrait-card",
  },
  {
    id: "tactical",
    label: "Tactical Board",
    description: "Pitch diagram with compact names.",
    formationBounds: { x: 150, y: 400, width: 780, height: 800 },
    playerPresentation: "cutout",
  },
  {
    id: "heritage",
    label: "Heritage Stripes",
    description: "Red-and-white stripes with a navy panel.",
    formationBounds: { x: 430, y: 430, width: 580, height: 800 },
    playerPresentation: "portrait-card",
  },
];

export function getTemplate(id: string): TemplateDefinition {
  return templates.find((template) => template.id === id) ?? templates[0];
}
