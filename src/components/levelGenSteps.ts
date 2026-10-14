/**
 * The level generator's nine steps, in order, and what each one adds to the
 * floor plan. Step 0 is the empty grid; DONE is the finished level.
 */

/** Floor-plan layers, as named on the map's groups (data-layer). */
export type Layer =
  | "points"
  | "delaunay"
  | "rooms"
  | "doors"
  | "mesh"
  | "slots"
  | "props"
  | "objective";

export interface Step {
  n: number;
  label: string;
  produces: Layer[];
}

export const STEPS: Step[] = [
  { n: 1, label: "Random points", produces: ["points"] },
  { n: 2, label: "Delaunay triangulation", produces: ["delaunay"] },
  { n: 3, label: "Edge pruning", produces: ["delaunay"] },
  { n: 4, label: "Room expansion", produces: ["rooms"] },
  { n: 5, label: "Door generation", produces: ["doors"] },
  { n: 6, label: "Mesh generation", produces: ["mesh"] },
  { n: 7, label: "Slot generation", produces: ["slots"] },
  { n: 8, label: "Slot pruning", produces: ["slots"] },
  { n: 9, label: "Prop instantiation", produces: ["props"] },
];

export const LAST_STEP = STEPS.length;
export const DONE = LAST_STEP + 1;
/** How long each step holds during autoplay, in ms. */
export const PHASE_MS = [0, 1500, 1700, 1700, 2000, 1700, 1700, 1600, 1700, 1600];
