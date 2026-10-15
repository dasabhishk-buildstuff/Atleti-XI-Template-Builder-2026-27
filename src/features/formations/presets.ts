import type { FormationDefinition, FormationSlot } from "@/types/domain";

function slots(
  rows: Array<Array<{ id: string; role: string; x: number }>>,
  yPositions: number[],
): FormationSlot[] {
  const built: FormationSlot[] = [];
  rows.forEach((row, rowIndex) => {
    const y = yPositions[rowIndex] ?? 0.5;
    row.forEach((slot) => {
      built.push({
        id: slot.id,
        role: slot.role,
        x: slot.x,
        y,
        order: built.length,
      });
    });
  });
  return built;
}

const gk = [{ id: "gk", role: "GK", x: 0.5 }];

export const formations: FormationDefinition[] = [
  {
    id: "4-3-3",
    label: "4-3-3",
    slots: slots(
      [
        gk,
        [
          { id: "lb", role: "LB", x: 0.12 },
          { id: "lcb", role: "LCB", x: 0.36 },
          { id: "rcb", role: "RCB", x: 0.64 },
          { id: "rb", role: "RB", x: 0.88 },
        ],
        [
          { id: "lcm", role: "LCM", x: 0.28 },
          { id: "cm", role: "CM", x: 0.5 },
          { id: "rcm", role: "RCM", x: 0.72 },
        ],
        [
          { id: "lw", role: "LW", x: 0.16 },
          { id: "st", role: "ST", x: 0.5 },
          { id: "rw", role: "RW", x: 0.84 },
        ],
      ],
      [0.9, 0.72, 0.48, 0.2],
    ),
  },
  {
    id: "4-4-2",
    label: "4-4-2",
    slots: slots(
      [
        gk,
        [
          { id: "lb", role: "LB", x: 0.12 },
          { id: "lcb", role: "LCB", x: 0.36 },
          { id: "rcb", role: "RCB", x: 0.64 },
          { id: "rb", role: "RB", x: 0.88 },
        ],
        [
          { id: "lm", role: "LM", x: 0.14 },
          { id: "lcm", role: "LCM", x: 0.38 },
          { id: "rcm", role: "RCM", x: 0.62 },
          { id: "rm", role: "RM", x: 0.86 },
        ],
        [
          { id: "ls", role: "LS", x: 0.36 },
          { id: "rs", role: "RS", x: 0.64 },
        ],
      ],
      [0.9, 0.7, 0.46, 0.18],
    ),
  },
  {
    id: "4-2-3-1",
    label: "4-2-3-1",
    slots: slots(
      [
        gk,
        [
          { id: "lb", role: "LB", x: 0.12 },
          { id: "lcb", role: "LCB", x: 0.36 },
          { id: "rcb", role: "RCB", x: 0.64 },
          { id: "rb", role: "RB", x: 0.88 },
        ],
        [
          { id: "ldm", role: "LDM", x: 0.36 },
          { id: "rdm", role: "RDM", x: 0.64 },
        ],
        [
          { id: "lam", role: "LAM", x: 0.2 },
          { id: "cam", role: "CAM", x: 0.5 },
          { id: "ram", role: "RAM", x: 0.8 },
        ],
        [{ id: "st", role: "ST", x: 0.5 }],
      ],
      [0.9, 0.72, 0.56, 0.36, 0.14],
    ),
  },
  {
    id: "3-5-2",
    label: "3-5-2",
    slots: slots(
      [
        gk,
        [
          { id: "lcb", role: "LCB", x: 0.28 },
          { id: "cb", role: "CB", x: 0.5 },
          { id: "rcb", role: "RCB", x: 0.72 },
        ],
        [
          { id: "lwb", role: "LWB", x: 0.1 },
          { id: "lcm", role: "LCM", x: 0.32 },
          { id: "cm", role: "CM", x: 0.5 },
          { id: "rcm", role: "RCM", x: 0.68 },
          { id: "rwb", role: "RWB", x: 0.9 },
        ],
        [
          { id: "ls", role: "LS", x: 0.36 },
          { id: "rs", role: "RS", x: 0.64 },
        ],
      ],
      [0.9, 0.72, 0.46, 0.18],
    ),
  },
  {
    id: "3-4-3",
    label: "3-4-3",
    slots: slots(
      [
        gk,
        [
          { id: "lcb", role: "LCB", x: 0.28 },
          { id: "cb", role: "CB", x: 0.5 },
          { id: "rcb", role: "RCB", x: 0.72 },
        ],
        [
          { id: "lm", role: "LM", x: 0.16 },
          { id: "lcm", role: "LCM", x: 0.38 },
          { id: "rcm", role: "RCM", x: 0.62 },
          { id: "rm", role: "RM", x: 0.84 },
        ],
        [
          { id: "lw", role: "LW", x: 0.18 },
          { id: "st", role: "ST", x: 0.5 },
          { id: "rw", role: "RW", x: 0.82 },
        ],
      ],
      [0.9, 0.7, 0.46, 0.18],
    ),
  },
  {
    id: "4-1-4-1",
    label: "4-1-4-1",
    slots: slots(
      [
        gk,
        [
          { id: "lb", role: "LB", x: 0.12 },
          { id: "lcb", role: "LCB", x: 0.36 },
          { id: "rcb", role: "RCB", x: 0.64 },
          { id: "rb", role: "RB", x: 0.88 },
        ],
        [{ id: "dm", role: "DM", x: 0.5 }],
        [
          { id: "lm", role: "LM", x: 0.14 },
          { id: "lcm", role: "LCM", x: 0.38 },
          { id: "rcm", role: "RCM", x: 0.62 },
          { id: "rm", role: "RM", x: 0.86 },
        ],
        [{ id: "st", role: "ST", x: 0.5 }],
      ],
      [0.9, 0.72, 0.56, 0.36, 0.14],
    ),
  },
  {
    id: "5-3-2",
    label: "5-3-2",
    slots: slots(
      [
        gk,
        [
          { id: "lwb", role: "LWB", x: 0.08 },
          { id: "lcb", role: "LCB", x: 0.28 },
          { id: "cb", role: "CB", x: 0.5 },
          { id: "rcb", role: "RCB", x: 0.72 },
          { id: "rwb", role: "RWB", x: 0.92 },
        ],
        [
          { id: "lcm", role: "LCM", x: 0.28 },
          { id: "cm", role: "CM", x: 0.5 },
          { id: "rcm", role: "RCM", x: 0.72 },
        ],
        [
          { id: "ls", role: "LS", x: 0.36 },
          { id: "rs", role: "RS", x: 0.64 },
        ],
      ],
      [0.9, 0.7, 0.44, 0.18],
    ),
  },
];

export function getFormation(id: string): FormationDefinition {
  const found = formations.find((formation) => formation.id === id);
  if (!found) {
    throw new Error(`Unknown formation: ${id}`);
  }
  return found;
}
