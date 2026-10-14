import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { generateLevel, type Edge, type LevelMap, type Slot } from "./levelGenMap";
import LevelGenStepRail, { type Rerun } from "./LevelGenStepRail";
import { DONE, LAST_STEP, PHASE_MS, STEPS, type Step } from "./levelGenSteps";
import "./LevelGenSketch.css";

/** A new map on every visit. */
const randomSeed = () => 1000 + Math.floor(Math.random() * 99000);
/** One grid cell, in SVG units. */
const U = 10;
/** Each step of a quest-request re-run, in ms. */
const RERUN_MS = 520;
/** Room expansion shows at most this many growth rounds. */
const GROWTH_SHOWN = 6;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const useCompact = () => {
  const query = "(max-width: 720px)";
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setCompact(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, []);
  return compact;
};

type Mode = "play" | "step" | "objective" | "edit";

/** Hand edits to a map: moved or added points, and edges cut or kept. */
interface Edits {
  cols: number;
  at: Array<[number, number]> | null;
  cut: Set<string>;
  keep: Set<string>;
}
const touch = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
/** Points closer than this (in cells) would leave no room to grow. */
const MIN_GAP = 2;
type Anim = { "data-in"?: true; "data-out"?: true; style?: CSSProperties };
const at = (ms: number) => ({ "--d": Math.round(ms) }) as CSSProperties;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const pts = (poly: Array<[number, number]>) => poly.map(([x, y]) => `${x},${y}`).join(" ");

/** Every keyed piece of a map, by the step that makes it. */
function piecesOf(map: LevelMap) {
  return {
    1: map.points.map((p) => `p${p.id}:${p.x},${p.y}`),
    2: map.edges.map((e) => `e${e.a}-${e.b}`),
    3: map.edges.map((e) => `e${e.a}-${e.b}:${e.kept}`),
    4: map.rooms.map((r) => r.key),
    5: [...map.halls.map((c) => c.key), ...map.doors.map((d) => d.key)],
    6: map.walls.map((w) => w.key),
    7: map.slots.map((s) => s.key),
    8: map.slots.map((s) => `${s.key}:${s.kept}`),
    9: map.props.map((p) => `${p.key}:${p.w}x${p.h}`),
  } as Record<number, string[]>;
}

interface ObjectiveRun {
  prev: LevelMap;
  newRoom: boolean;
  /** Keys present now that weren't before. */
  fresh: Set<string>;
  steps: number[];
}

/** What a quest request changed, and so which steps re-run. */
function diffMaps(prev: LevelMap, next: LevelMap): ObjectiveRun {
  const before = piecesOf(prev);
  const after = piecesOf(next);
  const steps: number[] = [];
  for (let n = 1; n <= LAST_STEP; n++) {
    const old = new Set(before[n]);
    const now = new Set(after[n]);
    if (after[n].some((k) => !old.has(k)) || before[n].some((k) => !now.has(k))) steps.push(n);
  }
  const keys = (map: LevelMap) =>
    new Set<string>([
      ...map.points.map((p) => `p${p.id}`),
      ...map.edges.filter((e) => e.kept).map((e) => e.key),
      ...map.rooms.map((r) => `${r.key}:${r.objective}`),
      ...map.halls.map((c) => c.key),
      ...map.walls.map((w) => w.key),
      ...map.doors.map((d) => d.key),
      ...map.slots.filter((s) => s.kept).map((s) => s.key),
      ...map.props.map((p) => p.key),
    ]);
  const old = keys(prev);
  const fresh = new Set([...keys(next)].filter((k) => !old.has(k)));
  return { prev, newRoom: next.rooms.length > prev.rooms.length, fresh, steps };
}

/**
 * A browser sketch of the level generator, run step by step: random points,
 * Delaunay triangulation, edge pruning, room expansion, doors, the mesh, every
 * possible slot, slot pruning and props. Everything arrives and leaves by
 * fading; nothing on the plan moves.
 */
export default function LevelGenSketch() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const compact = useCompact();
  const [seed, setSeed] = useState(randomSeed);
  const [edits, setEdits] = useState<Edits | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [objectives, setObjectives] = useState(0);
  const [phase, setPhase] = useState(0);
  const [mode, setMode] = useState<Mode>("play");
  const [run, setRun] = useState(0);
  const [rerun, setRerun] = useState<Rerun | null>(null);
  const [objectiveRun, setObjectiveRun] = useState<ObjectiveRun | null>(null);
  const [hover, setHover] = useState<Step | null>(null);
  const [announce, setAnnounce] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const planRef = useRef<SVGGElement>(null);
  const timers = useRef<number[]>([]);
  const started = useRef(false);

  const cols = compact ? 22 : 50;
  const rows = compact ? 19 : 17;
  // Edits made at one grid size don't carry over to the other.
  const own = edits?.cols === cols ? edits : null;
  const options = useMemo(
    () => (own ? { at: own.at ?? undefined, cut: own.cut, keep: own.keep } : {}),
    [own],
  );
  const map = useMemo(
    () => generateLevel(seed, cols, rows, objectives, options),
    [seed, cols, rows, objectives, options],
  );

  const stop = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const play = useCallback(() => {
    stop();
    started.current = true;
    setMode("play");
    setRun((n) => n + 1);
    setRerun(null);
    setObjectiveRun(null);
    if (reducedMotion()) {
      setPhase(DONE);
      return;
    }
    setPhase(0);
    let t = 60;
    for (let p = 1; p <= DONE; p++) {
      later(() => setPhase(p), t);
      t += PHASE_MS[p] ?? 0;
    }
  }, []);

  // After an edit, play carries on from the next step with the edited plan
  // instead of starting over. Otherwise it replays every step.
  const resume = () => {
    if (mode !== "edit" || phase >= DONE) {
      play();
      return;
    }
    stop();
    setMode("play");
    setNote("");
    // The next step starts in the same render that leaves edit mode, so
    // what's already drawn stays put rather than fading in again.
    const from = phase + 1;
    setPhase(reducedMotion() ? DONE : from);
    if (reducedMotion()) return;
    let t = PHASE_MS[from] ?? 0;
    for (let p = from + 1; p <= DONE; p++) {
      later(() => setPhase(p), t);
      t += PHASE_MS[p] ?? 0;
    }
  };

  // Start the first run once the sketch is on screen; pause loops off screen.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        element.toggleAttribute("data-offscreen", !entry.isIntersecting);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25 && !started.current) play();
      },
      { threshold: [0, 0.25] },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [play]);

  const jump = (step: number) => {
    stop();
    started.current = true;
    setMode("step");
    setRun((n) => n + 1);
    setRerun(null);
    setObjectiveRun(null);
    setPhase(step);
    setAnnounce(`Step ${step} of ${LAST_STEP}: ${STEPS[step - 1].label}.`);
  };

  const generate = () => {
    let next = seed;
    while (next === seed) next = 1000 + Math.floor(Math.random() * 99000);
    setSeed(next);
    setEdits(null);
    setNote("");
    setObjectives(0);
    setAnnounce(`New map, seed ${next}.`);
    play();
  };

  const placeObjective = () => {
    stop();
    started.current = true;
    const next = generateLevel(seed, cols, rows, objectives + 1, options);
    const diff = diffMaps(map, next);
    setMode("objective");
    setRun((n) => n + 1);
    setPhase(DONE);
    setObjectives((n) => n + 1);
    setObjectiveRun(diff);
    const plan = { steps: diff.steps, index: 0 };
    if (reducedMotion()) {
      setRerun({ ...plan, index: plan.steps.length });
    } else {
      setRerun(plan);
      plan.steps.forEach((_, i) => later(() => setRerun({ ...plan, index: i + 1 }), (i + 1) * RERUN_MS));
    }
    setAnnounce(
      diff.newRoom
        ? `Objective room added. ${plural(diff.steps.length, "step")} ran again.`
        : "No space for a new room, so the objective went to a dead-end room.",
    );
  };

  // Editing: points can be dragged while they show (steps 1 to 5), added at
  // step 1, and edges cut or kept at step 3. The plan then updates in place,
  // without replaying the step.
  const editing = phase >= 1 && phase <= 5 && mode !== "objective";
  const maxPoints = compact ? 12 : 22;
  const beginEdit = () => {
    if (mode === "edit") return;
    stop();
    started.current = true;
    setMode("edit");
    setRerun(null);
    setObjectiveRun(null);
  };
  const ownPoints = () =>
    map.points.filter((p) => !p.objective).map((p) => [p.x, p.y] as [number, number]);
  const cellAt = (event: { clientX: number; clientY: number }): [number, number] | null => {
    const ctm = planRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    const clamp = (v: number, hi: number) => Math.min(Math.max(Math.floor(v), 2), hi - 3);
    return [clamp(p.x, cols), clamp(p.y, rows)];
  };
  const fits = (list: Array<[number, number]>, [x, y]: [number, number], skip = -1) =>
    list.every(([px, py], i) => i === skip || Math.hypot(px - x, py - y) >= MIN_GAP);
  // Moving a point changes the triangulation, so edge edits start over.
  const placePoints = (at: Array<[number, number]>) =>
    setEdits({ cols, at, cut: new Set(), keep: new Set() });

  const grab = (event: PointerEvent<SVGCircleElement>, id: number) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginEdit();
    setNote("");
    setDrag(id);
  };
  const move = (event: PointerEvent<SVGCircleElement>, id: number) => {
    if (drag !== id) return;
    const cell = cellAt(event);
    const list = ownPoints();
    if (!cell || (list[id][0] === cell[0] && list[id][1] === cell[1]) || !fits(list, cell, id)) return;
    list[id] = cell;
    placePoints(list);
  };
  const drop = () => {
    if (drag === null) return;
    setDrag(null);
    setAnnounce(`Point moved. ${plural(map.rooms.length, "room")}, ${plural(map.doors.length, "door")}.`);
  };
  const addPoint = (event: MouseEvent<SVGSVGElement>) => {
    if (phase !== 1 || mode === "objective") return;
    if ((event.target as Element).closest(".lg-handles")) return;
    const cell = cellAt(event);
    const list = ownPoints();
    if (!cell) return;
    beginEdit();
    if (list.length >= maxPoints) {
      setNote(`That's as many points as the grid holds (${maxPoints}).`);
      return;
    }
    if (!fits(list, cell)) return;
    placePoints([...list, cell]);
    setNote("");
    setAnnounce(`Point added. ${plural(list.length + 1, "point")}.`);
  };
  const toggleEdge = (edge: Edge) => {
    beginEdit();
    const id = `${edge.a}-${edge.b}`;
    const cut = new Set(own?.cut);
    const keep = new Set(own?.keep);
    if (edge.kept) {
      keep.delete(id);
      cut.add(id);
    } else {
      cut.delete(id);
      keep.add(id);
    }
    const at = own?.at ?? null;
    const after = generateLevel(seed, cols, rows, objectives, { at: at ?? undefined, cut, keep });
    const stays = edge.kept && after.edges.find((e) => e.key === edge.key)?.kept;
    const message = stays ? "That edge is the only way into a room, so it stays." : "";
    setEdits({ cols, at, cut, keep });
    setNote(message);
    setAnnounce(message || (edge.kept ? "Edge cut." : "Edge kept."));
  };

  // Hovering a step highlights what it makes on the plan.
  const onHover = (step: Step | null) => {
    setHover(step);
    const element = root.current;
    if (!element) return;
    if (step) element.dataset.focus = step.produces.join(" ");
    else delete element.dataset.focus;
  };

  // Timing. A piece fades in when the step that makes it plays; in a quest
  // re-run, only new pieces fade in, when their step's turn comes.
  const rerunAt = (step: number) => {
    const i = objectiveRun ? objectiveRun.steps.indexOf(step) : -1;
    return (i < 0 ? 0 : i) * RERUN_MS + 120;
  };
  const enter = (step: number, key: string, ms: number): Anim => {
    if (mode === "objective") {
      return objectiveRun?.fresh.has(key) ? { "data-in": true, style: at(rerunAt(step) + ms * 0.3) } : {};
    }
    return phase === step ? { "data-in": true, style: at(ms) } : {};
  };
  const leave = (ms: number): Anim => ({ "data-out": true, style: at(ms) });

  const width = cols * U;
  const height = rows * U;
  // Sweep delays: left to right across the map.
  const sweep = (x: number, y: number, span: number) =>
    ((x + y * 0.35) / (cols + rows * 0.35)) * span;

  const counts = useMemo(() => {
    const kept = map.edges.filter((e) => e.kept);
    return {
      kept: kept.length,
      loops: kept.filter((e) => !e.mst).length,
      pruned: map.edges.length - kept.length,
      slotsKept: map.slots.filter((s) => s.kept).length,
      objective: map.rooms.filter((r) => r.objective).length,
    };
  }, [map]);
  const hallPath = (m: LevelMap, skip?: Set<string>) =>
    m.halls
      .filter((c) => !skip?.has(c.key))
      .map((c) => `M${c.x} ${c.y}h1v1h-1z`)
      .join("");
  const growth = useMemo(() => {
    const shown = Math.min(map.growthRounds, GROWTH_SHOWN);
    return Array.from({ length: shown }, (_, k) => Math.round(((k + 1) * map.growthRounds) / shown) - 1);
  }, [map]);
  const growStep = 1300 / Math.max(growth.length, 1);
  const edgeOrder = useMemo(() => {
    const mid = (i: number) => {
      const e = map.edges[i];
      return map.points[e.a].x + map.points[e.b].x;
    };
    const order = new Map<string, number>();
    map.edges
      .map((_, i) => i)
      .sort((a, b) => mid(a) - mid(b))
      .forEach((i, rank) => order.set(map.edges[i].key, rank / Math.max(map.edges.length - 1, 1)));
    return order;
  }, [map]);

  const slotRect = (s: Slot) => {
    if (s.kind === "floor") return { x: s.x + 0.32, y: s.y + 0.32, width: 0.36, height: 0.36 };
    if (s.side === "n") return { x: s.x + 0.18, y: s.y + 0.14, width: 0.64, height: 0.24 };
    if (s.side === "s") return { x: s.x + 0.18, y: s.y + 0.62, width: 0.64, height: 0.24 };
    if (s.side === "w") return { x: s.x + 0.14, y: s.y + 0.18, width: 0.24, height: 0.64 };
    return { x: s.x + 0.62, y: s.y + 0.18, width: 0.24, height: 0.64 };
  };

  // Pieces a quest request removed fade out where they were.
  const gone = useMemo(() => {
    if (!objectiveRun) return null;
    const { prev } = objectiveRun;
    const now = (keys: string[]) => new Set(keys);
    const walls = now(map.walls.map((w) => w.key));
    const doors = now(map.doors.map((d) => d.key));
    const props = now(map.props.map((p) => p.key));
    const slots = now(map.slots.filter((s) => s.kept).map((s) => s.key));
    const halls = now(map.halls.map((c) => c.key));
    const floors = now(map.rooms.map((r) => `${r.key}:${r.objective}`));
    return {
      floors: prev.rooms.filter((r) => !floors.has(`${r.key}:${r.objective}`)),
      walls: prev.walls.filter((w) => !walls.has(w.key)),
      doors: prev.doors.filter((d) => !doors.has(d.key)),
      props: prev.props.filter((p) => !props.has(p.key)),
      slots: prev.slots.filter((s) => s.kept && !slots.has(s.key)),
      halls: prev.halls.filter((c) => !halls.has(c.key)),
    };
  }, [objectiveRun, map]);

  // The line under the steps: the hovered step, else the current one.
  const shown = hover ? hover.n : phase;
  let lead = "";
  let rest = "";
  if (mode === "objective" && objectiveRun && !hover) {
    lead = "Quest request.";
    rest = objectiveRun.newRoom
      ? "A point is added where there is the most space and the steps run again. Only the pieces that changed are rebuilt."
      : "No space for another room, so the objective goes to a dead-end room and its props are cleared.";
  } else {
    const label = STEPS[shown - 1]?.label;
    if (label) lead = `${label}.`;
    switch (shown) {
      case 1:
        rest = own?.at
          ? `${plural(map.points.length, "point")}, placed by hand. Every point will become a room.`
          : `${plural(map.points.length, "point")} scattered across the grid, each kept clear of the others. Every point will become a room.`;
        break;
      case 2:
        rest = `Every point is joined to its natural neighbours: ${plural(map.edges.length, "candidate connection")}, none crossing.`;
        break;
      case 3:
        rest = `A minimum spanning tree keeps every room reachable and ${plural(counts.loops, "extra edge")} ${counts.loops === 1 ? "survives as a loop" : "survive as loops"}. The other ${counts.pruned} are cut.`;
        break;
      case 4:
        rest = "Each point grows outward a row at a time until it reaches its size or meets a neighbour.";
        break;
      case 5:
        rest = `Each kept edge becomes a route: ${plural(map.doors.length, "door")} where it crosses a wall, and ${plural(map.halls.length, "hall cell")} where rooms don't touch.`;
        break;
      case 6:
        rest = `${plural(map.walls.length, "wall run")}, doors and floors are built from the cells. Each room has a theme.`;
        break;
      case 7:
        rest = `Every cell of every room could hold something: ${plural(map.slots.length, "candidate slot")}, along the walls and in the open.`;
        break;
      case 8:
        rest = `${map.slots.length - counts.slotsKept} are cut to keep doorways and walking lanes clear and props spaced out. ${counts.slotsKept} remain.`;
        break;
      case 9:
        rest = `Each room's theme turns kept slots into props: ${plural(map.props.length, "prop")}. Some slots stay empty.`;
        break;
      case DONE:
        lead = `Seed ${seed}.`;
        rest = `${plural(map.rooms.length, "room")}, ${plural(map.doors.length, "door")}, ${plural(map.props.length, "prop")}. Select a step to replay it, or step 1 to move the points.`;
        break;
    }
  }
  // What can be changed at this step.
  const hint =
    hover || !editing
      ? ""
      : note ||
        (phase === 1
          ? `Drag a point to move it, or ${touch() ? "tap" : "click"} the grid to add one.`
          : phase === 3
            ? `${touch() ? "Tap" : "Click"} an edge to cut it or bring it back.`
            : "Drag a point to move it.") +
        (mode === "edit" ? " Press play to carry on from here." : "");


  const label = `Generated floor plan, seed ${seed}: ${map.rooms.length} rooms${
    counts.objective ? `, ${counts.objective} holding an objective` : ""
  }.`;

  const floorPlan = (
    <svg
      className="lg-map"
      data-mode={mode}
      data-dragging={drag !== null || undefined}
      data-adding={(phase === 1 && mode !== "objective") || undefined}
      onClick={addPoint}
      viewBox={`${-U * 0.6} ${-U * 0.6} ${width + U * 1.2} ${height + U * 1.2}`}
      style={{ aspectRatio: `${width + U * 1.2} / ${height + U * 1.2}` }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
    >
      <defs>
        <pattern id={`${uid}-dots`} width={U} height={U} patternUnits="userSpaceOnUse">
          <circle className="lg-dot" cx="0" cy="0" r="0.55" />
        </pattern>
        <pattern id={`${uid}-t0`} width={U} height={2.5} patternUnits="userSpaceOnUse">
          <path className="lg-pat" d={`M0 2.5H${U}M3 0V2.5`} />
        </pattern>
        <pattern id={`${uid}-t1`} width={U / 2} height={U / 2} patternUnits="userSpaceOnUse">
          <path className="lg-pat" d={`M0 0H${U / 2}M0 0V${U / 2}`} />
        </pattern>
        <pattern id={`${uid}-t2`} width={3} height={3} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path className="lg-pat" d="M0 0V3" />
        </pattern>
        <pattern id={`${uid}-obj`} width={2.6} height={2.6} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <path className="lg-pat-objective" d="M0 0V2.6" />
        </pattern>
      </defs>
      <rect
        x={-U * 0.6}
        y={-U * 0.6}
        width={width + U * 1.2}
        height={height + U * 1.2}
        fill={`url(#${uid}-dots)`}
      />
      <g key={`${seed}-${cols}-${run}`} ref={planRef} className="lg-plan" transform={`scale(${U})`}>
        {/* 5 + 6: hall floors, then room floors with their themes. */}
        {phase >= 5 ? (
          <g className="lg-halls" data-layer="doors">
            <path d={hallPath(map, mode === "objective" ? objectiveRun?.fresh : undefined)} {...(phase === 5 && mode !== "objective" ? { "data-in": true, style: at(0) } : {})} />
            {mode === "objective"
              ? map.halls
                  .filter((c) => objectiveRun?.fresh.has(c.key))
                  .map((c) => <rect key={c.key} className="lg-hall-new" x={c.x} y={c.y} width={1} height={1} {...enter(5, c.key, 0)} />)
              : null}
            {gone?.halls.map((c) => (
              <rect key={`g${c.key}`} x={c.x} y={c.y} width={1} height={1} {...leave(rerunAt(5))} />
            ))}
          </g>
        ) : null}
        {phase >= 6 ? (
          <g className="lg-floor" data-layer="mesh">
            <g transform={`scale(${1 / U})`}>
              {map.rooms.map((room, i) => (
                <polygon
                  key={room.key}
                  points={room.poly.map(([x, y]) => `${x * U},${y * U}`).join(" ")}
                  fill={room.objective ? `url(#${uid}-obj)` : `url(#${uid}-t${room.theme})`}
                  data-objective={room.objective || undefined}
                  {...enter(6, `${room.key}:${room.objective}`, i * 50)}
                />
              ))}
              {gone?.floors.map((room) => (
                <polygon
                  key={`g${room.key}`}
                  points={room.poly.map(([x, y]) => `${x * U},${y * U}`).join(" ")}
                  fill={room.objective ? `url(#${uid}-obj)` : `url(#${uid}-t${room.theme})`}
                  {...leave(rerunAt(6))}
                />
              ))}
            </g>
          </g>
        ) : null}

        {/* 4: rooms grow from their points; their outlines give way to the mesh. */}
        {phase === 4
          ? growth.slice(0, -1).map((round, k) => (
              <g
                key={`g${round}`}
                className="lg-grow"
                data-layer="rooms"
                style={{ ...at(k * growStep), "--g": `${Math.round(growStep * 2.2)}ms` } as CSSProperties}
              >
                {map.rooms.map((room) => {
                  const r = room.growth[round];
                  return <rect key={room.id} x={r.x} y={r.y} width={r.w} height={r.h} />;
                })}
              </g>
            ))
          : null}
        {phase >= 4 && phase <= 6 && mode !== "objective" ? (
          <g className="lg-rooms" data-layer="rooms">
            {map.rooms.map((room) => (
              <polygon
                key={room.key}
                points={pts(room.poly)}
                data-objective={room.objective || undefined}
                {...(phase === 6 ? leave(0) : phase === 4 ? { "data-in": true, style: at((growth.length - 1) * growStep) } : {})}
              />
            ))}
          </g>
        ) : null}

        {/* 2 + 3: the triangulation, then the edges pruning leaves. */}
        {phase >= 2 && phase <= 6 && mode !== "objective" ? (
          <g className={`lg-tri${phase >= 4 ? " is-dim" : ""}`} data-layer="delaunay">
            {map.edges
              .filter((e) => e.kept || phase <= 3)
              .map((e) => {
                const p = map.points[e.a];
                const q = map.points[e.b];
                const rank = edgeOrder.get(e.key) ?? 0;
                const anim =
                  phase === 6
                    ? leave(0)
                    : phase === 3 && !e.kept
                      ? leave(250 + rank * 800)
                      : phase === 2
                        ? { "data-in": true as const, style: at(rank * 1100) }
                        : {};
                return (
                  <line
                    key={e.key}
                    x1={p.x + 0.5}
                    y1={p.y + 0.5}
                    x2={q.x + 0.5}
                    y2={q.y + 0.5}
                    data-kept={(phase >= 3 && e.kept) || undefined}
                    data-loop={(phase >= 3 && e.kept && !e.mst) || undefined}
                    data-pruned={(phase === 3 && !e.kept) || undefined}
                    {...anim}
                  />
                );
              })}
          </g>
        ) : null}

        {/* 6: walls and doors. */}
        {phase >= 6 ? (
          <g className="lg-walls" data-layer="mesh">
            {map.walls.map((w) => (
              <line
                key={w.key}
                x1={w.x1}
                y1={w.y1}
                x2={w.x2}
                y2={w.y2}
                {...enter(6, w.key, 150 + sweep(Math.min(w.x1, w.x2), Math.min(w.y1, w.y2), 600))}
              />
            ))}
            {gone?.walls.map((w) => (
              <line key={`g${w.key}`} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} {...leave(rerunAt(6))} />
            ))}
          </g>
        ) : null}
        {phase >= 6 ? (
          <g className="lg-doors" data-layer="mesh">
            {map.doors.map((d) => (
              <path key={d.key} d={d.d} {...enter(6, d.key, 650 + sweep(d.x, d.y, 400))} />
            ))}
            {gone?.doors.map((d) => <path key={`g${d.key}`} d={d.d} {...leave(rerunAt(6))} />)}
          </g>
        ) : null}

        {/* 5: where each kept edge crosses a wall, a door. */}
        {phase === 5 || (phase === 6 && mode !== "objective") ? (
          <g className="lg-doormarks" data-layer="doors">
            {map.doors.map((d) => (
              <line
                key={d.key}
                x1={d.vertical ? d.x : d.x + 0.15}
                y1={d.vertical ? d.y + 0.15 : d.y}
                x2={d.vertical ? d.x : d.x + 0.85}
                y2={d.vertical ? d.y + 0.85 : d.y}
                {...(phase === 6 ? leave(500) : { "data-in": true as const, style: at(350 + sweep(d.x, d.y, 700)) })}
              />
            ))}
          </g>
        ) : null}

        {/* 7 + 8: every possible slot, then the ones pruning keeps. */}
        {phase >= 7 ? (
          <g className={`lg-slots${phase >= 9 ? " is-dim" : ""}`} data-layer="slots">
            {map.slots
              .filter((s) => s.kept || phase <= 8)
              .map((s) => (
                <rect
                  key={s.key}
                  {...slotRect(s)}
                  data-kind={s.kind}
                  data-pruned={(phase === 8 && !s.kept) || undefined}
                  {...(phase === 8 && !s.kept
                    ? leave(250 + sweep(s.x, s.y, 800))
                    : phase === 7
                      ? { "data-in": true as const, style: at(sweep(s.x, s.y, 1000)) }
                      : enter(8, s.key, 0))}
                />
              ))}
            {gone?.slots.map((s) => (
              <rect key={`g${s.key}`} {...slotRect(s)} {...leave(rerunAt(8))} />
            ))}
          </g>
        ) : null}

        {/* 9: props. */}
        {phase >= 9 ? (
          <g className="lg-props" data-layer="props">
            {map.props.map((p) => {
              const anim = enter(9, p.key, sweep(p.x, p.y, 1000));
              return p.round ? (
                <circle key={p.key} cx={p.x + 0.5} cy={p.y + 0.5} r={0.3} {...anim} />
              ) : (
                <rect key={p.key} x={p.x + 0.2} y={p.y + 0.2} width={p.w - 0.4} height={p.h - 0.4} {...anim} />
              );
            })}
            {gone?.props.map((p) =>
              p.round ? (
                <circle key={`g${p.key}`} cx={p.x + 0.5} cy={p.y + 0.5} r={0.3} {...leave(rerunAt(9))} />
              ) : (
                <rect key={`g${p.key}`} x={p.x + 0.2} y={p.y + 0.2} width={p.w - 0.4} height={p.h - 0.4} {...leave(rerunAt(9))} />
              ),
            )}
          </g>
        ) : null}

        {/* 1: the points every room grows from. */}
        {phase >= 1 && phase <= 6 && mode !== "objective" ? (
          <g className={`lg-points${phase >= 4 ? " is-dim" : ""}`} data-layer="points">
            {map.points.map((p, i) => (
              <circle
                key={p.id}
                cx={p.x + 0.5}
                cy={p.y + 0.5}
                r={0.42}
                data-objective={p.objective || undefined}
                {...(phase === 6
                  ? leave(0)
                  : phase === 1
                    ? { "data-in": true as const, style: at((i * 900) / map.points.length) }
                    : {})}
              />
            ))}
          </g>
        ) : null}

        {/* A quest request: the new point and its edges, glimpsed while the steps re-run. */}
        {mode === "objective" && objectiveRun?.newRoom ? (
          <g className="lg-glimpse" data-layer="objective">
            {map.edges
              .filter((e) => e.kept && objectiveRun.fresh.has(e.key))
              .map((e) => (
                <line
                  key={e.key}
                  x1={map.points[e.a].x + 0.5}
                  y1={map.points[e.a].y + 0.5}
                  x2={map.points[e.b].x + 0.5}
                  y2={map.points[e.b].y + 0.5}
                  style={at(rerunAt(3))}
                />
              ))}
            {map.points
              .filter((p) => objectiveRun.fresh.has(`p${p.id}`))
              .map((p) => (
                <circle key={p.id} cx={p.x + 0.5} cy={p.y + 0.5} r={0.42} style={at(rerunAt(1))} />
              ))}
          </g>
        ) : null}

        {/* Editing: wide, invisible targets over the edges and points. */}
        {phase === 3 && mode !== "objective" ? (
          <g className="lg-edge-hits">
            {map.edges.map((e) => (
              <line
                key={e.key}
                x1={map.points[e.a].x + 0.5}
                y1={map.points[e.a].y + 0.5}
                x2={map.points[e.b].x + 0.5}
                y2={map.points[e.b].y + 0.5}
                onClick={() => toggleEdge(e)}
              />
            ))}
          </g>
        ) : null}
        {editing ? (
          <g className="lg-handles">
            {map.points
              .filter((p) => !p.objective)
              .map((p) => (
                <circle
                  key={p.id}
                  cx={p.x + 0.5}
                  cy={p.y + 0.5}
                  r={1.1}
                  data-active={drag === p.id || undefined}
                  onPointerDown={(event) => grab(event, p.id)}
                  onPointerMove={(event) => move(event, p.id)}
                  onPointerUp={drop}
                  onPointerCancel={drop}
                />
              ))}
          </g>
        ) : null}

        {/* Objective markers, once the rooms are built. */}
        {phase >= 6 ? (
          <g className="lg-markers" data-layer="objective">
            {map.rooms
              .filter((room) => room.objective)
              .map((room) => (
                <polygon
                  key={room.key}
                  className="lg-diamond"
                  transform={`translate(${room.ax + 0.5} ${room.ay + 0.5})`}
                  points="0,-0.55 0.55,0 0,0.55 -0.55,0"
                  {...enter(6, `${room.key}:true`, 500)}
                />
              ))}
          </g>
        ) : null}
      </g>
    </svg>
  );

  return (
    <div className="levelgen-pipeline lg" ref={root} data-reveal>
      <div className="lg-stage">
        <LevelGenStepRail
          phase={phase}
          rerun={rerun}
          resumes={mode === "edit" && phase < DONE}
          onJump={jump}
          onReplay={resume}
          onHover={onHover}
        />
        <p className="lg-caption" aria-hidden="true">
          {lead ? <strong>{lead}</strong> : null} {rest}
          {hint ? <span className="lg-hint"> {hint}</span> : null}
        </p>
        {floorPlan}
      </div>

      <div className="lg-bar">
        <span className="lg-seed">Seed {seed}</span>
        <button type="button" className="lg-button lg-button--ink" onClick={generate}>
          Generate
        </button>
        <button
          type="button"
          className="lg-button"
          onClick={placeObjective}
          disabled={counts.objective >= map.rooms.length - 1}
        >
          <span className="lg-glyph" aria-hidden="true" />
          Place an objective
        </button>
      </div>
      <p className="lg-note">
        A sketch of the idea, running in your browser. The real generator runs
        in Unreal Engine 5.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
