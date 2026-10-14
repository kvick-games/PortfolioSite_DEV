import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { generateLevel, type LevelMap } from "./levelGenMap";
import { PipelineGraph, PipelineList, type Rerun } from "./LevelGenPipeline";
import {
  DONE,
  LAST_STEP,
  LAYER_AT,
  NODE,
  PHASE_MS,
  type Layer,
  type PipeNode,
} from "./levelGenGraph";
import "./LevelGenSketch.css";

const FIRST_SEED = 2023;
/** One grid cell, in SVG units. */
const U = 10;
/** Each phase of a quest-request re-run, in ms. */
const RERUN_MS = 620;
/** Below this width the graph turns into the step list. */
const GRAPH_MIN = 720;

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

type Mode = "play" | "step" | "objective";
const delay = (ms: number) => ({ "--d": ms }) as CSSProperties;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

interface ObjectiveRun {
  newRoom: boolean;
  cells: number;
  walls: number;
  doors: number;
  fresh: Set<string>;
}

/** What changed when a quest request added an objective. */
function diffMaps(prev: LevelMap, next: LevelMap) {
  const added = <T extends { key: string }>(a: T[], b: T[]) => {
    const old = new Set(a.map((x) => x.key));
    return b.filter((x) => !old.has(x.key));
  };
  const changed = <T extends { key: string }>(a: T[], b: T[]) =>
    added(a, b).length > 0 || added(b, a).length > 0;
  const newRoom = next.rooms.length > prev.rooms.length;
  const cells = added(prev.cells, next.cells).length;
  const walls = added(prev.walls, next.walls).length;
  const doors = added(prev.doors, next.doors).length;
  const slots = changed(prev.slots, next.slots);
  const props = changed(prev.props, next.props);
  const nodes = new Set(["spawner", "create", "mapdata", "rooms"]);
  if (newRoom) nodes.add("footprints");
  if (cells) nodes.add("cells");
  if (walls) nodes.add("wall").add("cells");
  if (doors) nodes.add("door").add("cells");
  if (cells || walls || doors) nodes.add("construct");
  if (slots) nodes.add("populate").add("spawnProps").add("setup");
  if (props) nodes.add("populate").add("spawnProps").add("resolve");
  const phases = [...new Set([...nodes].filter((id) => id !== "spawner").map((id) => NODE[id].phases[0]))].sort(
    (a, b) => a - b,
  );
  const oldLinks = new Set(prev.links.map(([a, b]) => `e${a}-${b}`));
  const fresh = new Set<string>();
  for (const room of next.rooms) if (room.id >= prev.rooms.length) fresh.add(`f${room.id}`);
  for (const [a, b] of next.links) if (!oldLinks.has(`e${a}-${b}`)) fresh.add(`e${a}-${b}`);
  return { rerun: { nodes, phases, index: 0 } as Rerun, run: { newRoom, cells, walls, doors, fresh } };
}

/**
 * A browser sketch of the level generator, driven step by step through a
 * live recreation of the real pipeline diagram. The original diagram image
 * stays one toggle away.
 */
export default function LevelGenSketch({ pipelineSrc }: { pipelineSrc: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const compact = useCompact();
  const [seed, setSeed] = useState(FIRST_SEED);
  const [objectives, setObjectives] = useState(0);
  const [phase, setPhase] = useState(0);
  const [mode, setMode] = useState<Mode>("play");
  const [rerun, setRerun] = useState<Rerun | null>(null);
  const [objectiveRun, setObjectiveRun] = useState<ObjectiveRun | null>(null);
  const [hover, setHover] = useState<PipeNode | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [graph, setGraph] = useState(
    () => typeof window === "undefined" || window.innerWidth > 760,
  );
  const [announce, setAnnounce] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const started = useRef(false);
  const hovering = useRef(false);

  const cols = compact ? 22 : 50;
  const rows = compact ? 19 : 17;
  const map = useMemo(
    () => generateLevel(seed, cols, rows, objectives),
    [seed, cols, rows, objectives],
  );

  // Graph or list, by the width the component actually has.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => setGraph(element.clientWidth >= GRAPH_MIN);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
    setRerun(null);
    setObjectiveRun(null);
    if (reducedMotion()) {
      setPhase(DONE);
      return;
    }
    setPhase(0);
    let at = 60;
    for (let p = 1; p <= DONE; p++) {
      later(() => setPhase(p), at);
      at += PHASE_MS[p] ?? 0;
    }
  }, []);

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
    setRerun(null);
    setObjectiveRun(null);
    if (reducedMotion()) {
      setPhase(step);
    } else {
      // Drop back one step for a frame so this step's pieces build again.
      setPhase(step - 1);
      requestAnimationFrame(() => requestAnimationFrame(() => setPhase(step)));
    }
    setAnnounce(`Step ${step} of ${LAST_STEP}.`);
  };

  const generate = () => {
    let next = seed;
    while (next === seed) next = 1000 + Math.floor(Math.random() * 99000);
    setSeed(next);
    setObjectives(0);
    setAnnounce(`New map, seed ${next}.`);
    play();
  };

  const placeObjective = () => {
    stop();
    started.current = true;
    const next = generateLevel(seed, cols, rows, objectives + 1);
    const { rerun: plan, run } = diffMaps(map, next);
    setMode("objective");
    setPhase(DONE);
    setObjectives((n) => n + 1);
    setObjectiveRun(run);
    if (reducedMotion()) {
      setRerun({ ...plan, index: plan.phases.length });
    } else {
      setRerun(plan);
      plan.phases.forEach((_: number, i: number) => later(() => setRerun({ ...plan, index: i + 1 }), (i + 1) * RERUN_MS));
    }
    setAnnounce(
      run.newRoom
        ? `Objective room added. Rebuilt ${plural(run.cells, "cell")}, ${plural(run.walls, "wall run")} and ${plural(run.doors, "door")}.`
        : "Objective given to an existing room.",
    );
  };

  // Hovering a node highlights what it makes; hovering the map, what made it.
  const focusLayers = (layers: Layer[] | null) => {
    const element = root.current;
    if (!element) return;
    if (layers && layers.length) element.dataset.focus = layers.join(" ");
    else delete element.dataset.focus;
  };
  const onHover = (node: PipeNode | null) => {
    hovering.current = !!node;
    setHover(node);
    focusLayers(node ? node.produces : null);
  };
  const onMapPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== "mouse" || hovering.current) return;
    const layer = (event.target as Element).closest("[data-layer]")?.getAttribute("data-layer");
    focusLayers(layer ? [layer as Layer] : null);
  };

  // Map timing: where each layer starts within its phase.
  const rerunStart = (p: number) => {
    const i = rerun ? rerun.phases.indexOf(p) : -1;
    return i < 0 ? 0 : i * RERUN_MS + 140;
  };
  const layerStyle = (layer: Layer) => {
    const [p, at] = LAYER_AT[layer];
    const o = mode === "objective" ? rerunStart(p) : mode === "step" ? at * 0.6 : at;
    return { "--o": `${Math.round(o)}ms` } as CSSProperties;
  };
  const past = (until: number) => (phase > until ? " is-past" : "");

  const width = cols * U;
  const height = rows * U;
  // Sweep delays: left to right across the map.
  const sweep = (x: number, y: number, span: number) =>
    Math.round(((x + y * 0.35) / (cols + rows * 0.35)) * span);
  const hallFloor = useMemo(
    () =>
      map.cells
        .filter((c) => c.room < 0)
        .map((c) => `M${c.x} ${c.y}h1v1h-1z`)
        .join(""),
    [map],
  );
  const used = useMemo(() => {
    const cells = new Set<string>();
    for (const p of map.props)
      for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) cells.add(`${x},${y}`);
    return cells;
  }, [map]);

  const objectiveCount = map.rooms.filter((room) => room.objective).length;
  const bespoke = map.rooms.filter((room) => room.bespoke).length;
  const generated = map.rooms.filter((room) => !room.bespoke && !room.objective).length;

  // The line between diagram and map: the hovered node, else the step.
  let lead = "";
  let rest = "";
  if (hover) {
    lead = hover.label2 ? `${hover.label} ${hover.label2}` : hover.label;
    rest = hover.about;
  } else if (mode === "objective" && objectiveRun) {
    lead = "Quest request.";
    rest = objectiveRun.newRoom
      ? `CreateMapData() adds a room to hold the objective, then only the new pieces are built: ${plural(objectiveRun.cells, "cell")}, ${plural(objectiveRun.walls, "wall run")}, ${plural(objectiveRun.doors, "door")}.`
      : "No space for a new room, so CreateMapData() gives the objective to a quiet room.";
  } else {
    switch (phase) {
      case 1:
        lead = "LevelConfig";
        rest = `hands over ${plural(bespoke, "bespoke room")} to place.`;
        break;
      case 2:
        lead = "CreateMapData()";
        rest = `places the bespoke room first, then ${plural(generated, "generated footprint")} around it.`;
        break;
      case 3:
        lead = "MapData";
        rest = `${plural(map.rooms.length, "room")} and the ${plural(map.links.length, "connection")} between them. No geometry yet.`;
        break;
      case 4:
        lead = "CellData[]";
        rest = `${plural(map.cells.length, "cell")}, ${plural(map.walls.length, "wall run")} and ${plural(map.doors.length, "door")}. Each room is given a Theme.`;
        break;
      case 5:
        lead = "ConstructMapMesh()";
        rest = "builds walls, doors and floors from MapData, consulting each room's Theme.";
        break;
      case 6:
        lead = "SetupSlots()";
        rest = `${plural(map.slots.length, "slot")} along the walls, kept clear of doorways.`;
        break;
      case 7:
        lead = "ResolveSlots()";
        rest = `each room's Theme fills ${plural(map.props.length, "slot")} with props; the rest stay empty.`;
        break;
      case DONE:
        lead = `Seed ${seed}.`;
        rest = `${plural(map.rooms.length, "room")}, ${plural(map.props.length, "prop")}. Select a step to replay it.`;
        break;
    }
  }

  const label = `Generated floor plan, seed ${seed}: ${map.rooms.length} rooms${
    objectiveCount ? `, ${objectiveCount} holding an objective` : ""
  }.`;
  const diagramProps = {
    phase,
    rerun,
    hover: hover?.id ?? null,
    onSelect: (node: PipeNode) => jump(node.phases[0]),
    onJump: jump,
    onReplay: play,
    onHover,
  };

  const original = (
    <a className="lg-original" href={pipelineSrc} target="_blank" rel="noreferrer">
      <img
        src={pipelineSrc}
        alt="The original pipeline diagram, from GameMode and LevelConfig through CreateMapData(), MapData and ConstructMapMesh() to PopulateRooms() and SpawnProps()"
      />
      <span className="sr-only">(opens full size in a new tab)</span>
    </a>
  );
  const diagram = showOriginal ? original : graph ? (
    <PipelineGraph {...diagramProps} />
  ) : (
    <PipelineList {...diagramProps} />
  );

  const floorPlan = (
    <svg
      className="lg-map"
      data-mode={mode}
      viewBox={`${-U * 0.6} ${-U * 0.6} ${width + U * 1.2} ${height + U * 1.2}`}
      style={{ aspectRatio: `${width + U * 1.2} / ${height + U * 1.2}` }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      onPointerOver={onMapPointer}
      onPointerLeave={() => !hovering.current && focusLayers(null)}
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
      <g key={`${seed}-${cols}`} transform={`scale(${U})`}>
        {phase >= 5 ? (
          <g className="lg-floor" data-layer="floor" style={layerStyle("floor")}>
            <path className="lg-halls" d={hallFloor} />
            <g transform={`scale(${1 / U})`}>
              {map.rooms
                .filter((room) => !room.objective)
                .map((room, i) => (
                  <polygon
                    key={`t${room.id}`}
                    points={room.poly.map(([x, y]) => `${x * U},${y * U}`).join(" ")}
                    fill={`url(#${uid}-t${room.theme})`}
                    style={delay(i * 70)}
                  />
                ))}
            </g>
          </g>
        ) : null}
        {phase >= 2 ? (
          <g className="lg-objectives" data-layer="objective" style={layerStyle("objective")}>
            {map.rooms
              .filter((room) => room.objective)
              .map((room) => (
                <g key={`o${room.id}`}>
                  <polygon className="lg-objective-floor" points={room.poly.map(([x, y]) => `${x},${y}`).join(" ")} />
                  <polygon
                    className="lg-objective-hatch"
                    transform={`scale(${1 / U})`}
                    points={room.poly.map(([x, y]) => `${x * U},${y * U}`).join(" ")}
                    fill={`url(#${uid}-obj)`}
                  />
                </g>
              ))}
          </g>
        ) : null}
        {phase >= 4 ? (
          <g className={`lg-cells${phase >= 5 ? " is-floor" : ""}`} data-layer="cells" style={layerStyle("cells")}>
            {map.cells.map((c) => (
              <rect
                key={c.key}
                x={c.x + 0.08}
                y={c.y + 0.08}
                width={0.84}
                height={0.84}
                data-corridor={c.room < 0 || undefined}
                style={delay(sweep(c.x, c.y, 650))}
              />
            ))}
          </g>
        ) : null}
        {phase >= 1 && map.rooms[0]?.bespoke ? (
          <g className={`lg-bespoke${past(1)}`} data-layer="bespoke" style={layerStyle("bespoke")}>
            <polygon pathLength={1} points={map.rooms[0].poly.map(([x, y]) => `${x},${y}`).join(" ")} />
          </g>
        ) : null}
        {phase >= 2 ? (
          <g className={`lg-footprints${past(4)}`} data-layer="footprints" style={layerStyle("footprints")}>
            {map.rooms.map((room, i) => (
              <polygon
                key={`f${room.id}`}
                pathLength={1}
                data-bespoke={room.bespoke || undefined}
                data-objective={room.objective || undefined}
                points={room.poly.map(([x, y]) => `${x},${y}`).join(" ")}
                style={delay(i * 70)}
              />
            ))}
          </g>
        ) : null}
        {phase >= 3 ? (
          <g className={`lg-links${past(4)}`} data-layer="graph" style={layerStyle("graph")}>
            {map.links.map(([a, b]) => {
              const p = map.rooms[a];
              const q = map.rooms[b];
              return (
                <line
                  key={`e${a}-${b}`}
                  pathLength={1}
                  x1={p.ax + 0.5}
                  y1={p.ay + 0.5}
                  x2={q.ax + 0.5}
                  y2={q.ay + 0.5}
                  style={delay(Math.min(a, b) * 45)}
                />
              );
            })}
            {map.rooms.map((room, i) => (
              <circle
                key={`n${room.id}`}
                cx={room.ax + 0.5}
                cy={room.ay + 0.5}
                r={0.38}
                data-objective={room.objective || undefined}
                style={delay(i * 50)}
              />
            ))}
          </g>
        ) : null}
        {objectiveRun && objectiveRun.fresh.size ? (
          <g className="lg-fresh" data-layer="objective" style={layerStyle("footprints")}>
            {map.rooms
              .filter((room) => objectiveRun.fresh.has(`f${room.id}`))
              .map((room) => (
                <polygon key={`ff${room.id}`} pathLength={1} points={room.poly.map(([x, y]) => `${x},${y}`).join(" ")} />
              ))}
            {map.links
              .filter(([a, b]) => objectiveRun.fresh.has(`e${a}-${b}`))
              .map(([a, b]) => (
                <line
                  key={`fe${a}-${b}`}
                  pathLength={1}
                  x1={map.rooms[a].ax + 0.5}
                  y1={map.rooms[a].ay + 0.5}
                  x2={map.rooms[b].ax + 0.5}
                  y2={map.rooms[b].ay + 0.5}
                  style={delay(900)}
                />
              ))}
          </g>
        ) : null}
        {phase >= 4 ? (
          <g className={`lg-swatches${past(4)}`} style={{ "--o": "820ms" } as CSSProperties}>
            <g transform={`scale(${1 / U})`}>
              {map.rooms
                .filter((room) => !room.objective)
                .map((room, i) => (
                  <rect
                    key={`s${room.id}`}
                    x={(room.rects[0].x + 0.3) * U}
                    y={(room.rects[0].y + 0.3) * U}
                    width={1.6 * U}
                    height={1.6 * U}
                    fill={`url(#${uid}-t${room.theme})`}
                    style={delay(i * 60)}
                  />
                ))}
            </g>
          </g>
        ) : null}
        {phase >= 4 ? (
          <g className={`lg-wallmarks${past(4)}`} data-layer="walls" style={{ "--o": "560ms" } as CSSProperties}>
            {map.walls.map((w) => (
              <line key={w.key} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} style={delay(sweep(w.x1, w.y1, 300))} />
            ))}
            {map.doors.map((d) => (
              <path key={d.key} className="lg-doormark" d={d.d} />
            ))}
          </g>
        ) : null}
        {phase >= 5 ? (
          <g className="lg-walls" data-layer="walls" style={layerStyle("walls")}>
            {map.walls.map((w) => (
              <line
                key={w.key}
                pathLength={1}
                x1={w.x1}
                y1={w.y1}
                x2={w.x2}
                y2={w.y2}
                style={delay(sweep(Math.min(w.x1, w.x2), Math.min(w.y1, w.y2), 520))}
              />
            ))}
          </g>
        ) : null}
        {phase >= 5 ? (
          <g className="lg-doors" data-layer="doors" style={layerStyle("doors")}>
            {map.doors.map((d) => (
              <path key={d.key} d={d.d} />
            ))}
          </g>
        ) : null}
        {phase >= 6 ? (
          <g className={`lg-slots${past(6)}`} data-layer="slots" style={layerStyle("slots")}>
            {map.slots.map((s) => (
              <rect
                key={s.key}
                data-used={used.has(`${s.x},${s.y}`) || undefined}
                x={s.x + 0.24}
                y={s.y + 0.24}
                width={s.w - 0.48}
                height={s.h - 0.48}
                style={delay(sweep(s.x, s.y, 420))}
              />
            ))}
          </g>
        ) : null}
        {phase >= 7 ? (
          <g className="lg-props" data-layer="props" style={layerStyle("props")}>
            {map.props.map((p) =>
              p.round ? (
                <circle key={p.key} cx={p.x + 0.5} cy={p.y + 0.5} r={0.3} style={delay(sweep(p.x, p.y, 380))} />
              ) : (
                <rect
                  key={p.key}
                  x={p.x + 0.2}
                  y={p.y + 0.2}
                  width={p.w - 0.4}
                  height={p.h - 0.4}
                  style={delay(sweep(p.x, p.y, 380))}
                />
              ),
            )}
          </g>
        ) : null}
        {phase >= 2 ? (
          <g className="lg-markers" data-layer="objective" style={layerStyle("doors")}>
            {map.rooms
              .filter((room) => room.objective)
              .map((room) => (
                <g key={`m${room.id}`} transform={`translate(${room.ax + 0.5} ${room.ay + 0.5})`}>
                  <circle className="lg-ring" r={0.9} />
                  <polygon className="lg-diamond" points="0,-0.52 0.52,0 0,0.52 -0.52,0" />
                </g>
              ))}
          </g>
        ) : null}
      </g>
    </svg>
  );

  return (
    <div
      className="levelgen-pipeline lg"
      ref={root}
      data-form={graph ? "graph" : "list"}
      data-reveal
    >
      <div className="lg-stage">
        {graph ? diagram : floorPlan}
        <p className="lg-caption" aria-hidden="true">
          {lead ? <strong>{lead}</strong> : null} {rest}
        </p>
        {graph ? floorPlan : diagram}
      </div>

      <div className="lg-bar">
        <button
          type="button"
          className="lg-toggle"
          aria-pressed={showOriginal}
          onClick={() => setShowOriginal((v) => !v)}
        >
          Original diagram
        </button>
        <div className="lg-actions">
          <span className="lg-seed">Seed {seed}</span>
          <button type="button" className="lg-button lg-button--ink" onClick={generate}>
            Generate
          </button>
          <button
            type="button"
            className="lg-button"
            onClick={placeObjective}
            disabled={objectiveCount >= map.rooms.length}
          >
            <span className="lg-glyph" aria-hidden="true" />
            Place an objective
          </button>
        </div>
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
