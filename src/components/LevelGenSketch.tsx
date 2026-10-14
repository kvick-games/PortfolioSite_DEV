import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { generateLevel } from "./levelGenMap";
import "./LevelGenSketch.css";

/** Pipeline stage names, as they appear in the real diagram. */
const STEPS = ["CreateMapData()", "CellData[]", "ConstructMapMesh()", "Theme", "PopulateRooms()"];
/** When each step starts during the autoplay, in ms. */
const STEP_AT = [0, 1250, 2250, 3150, 3900];
const FIRST_SEED = 2023;
/** One grid cell, in SVG units. */
const U = 10;

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

/**
 * A browser sketch of the level generator's idea: an abstract map first, then
 * the level built from it. Sits beside the real pipeline diagram, which stays
 * one tab away.
 */
export default function LevelGenSketch({ pipelineSrc }: { pipelineSrc: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const compact = useCompact();
  const [view, setView] = useState<"sketch" | "pipeline">("sketch");
  const [seed, setSeed] = useState(FIRST_SEED);
  const [objectives, setObjectives] = useState(0);
  const [phase, setPhase] = useState(0);
  const [mode, setMode] = useState<Mode>("play");
  const [announce, setAnnounce] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const started = useRef(false);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  const cols = compact ? 22 : 50;
  const rows = compact ? 19 : 17;
  const map = useMemo(
    () => generateLevel(seed, cols, rows, objectives),
    [seed, cols, rows, objectives],
  );

  const stop = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const play = useCallback(() => {
    stop();
    started.current = true;
    setMode("play");
    if (reducedMotion()) {
      setPhase(STEPS.length);
      return;
    }
    setPhase(0);
    STEP_AT.forEach((at, i) => {
      timers.current.push(window.setTimeout(() => setPhase(i + 1), at + 60));
    });
  }, []);

  // Start the first run once the sketch is on screen.
  useEffect(() => {
    const element = root.current;
    if (!element || started.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [play]);

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
    setMode("objective");
    setPhase(STEPS.length);
    setObjectives((n) => n + 1);
    setAnnounce("Objective room added.");
  };

  const goTo = (step: number) => {
    stop();
    started.current = true;
    setMode("step");
    setPhase(step);
  };

  const selectView = (index: number) => {
    const next = index % 2 === 0 ? "sketch" : "pipeline";
    setView(next);
    tabs.current[index % 2]?.focus();
  };
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = view === "sketch" ? 0 : 1;
    if (event.key === "Home") selectView(0);
    else if (event.key === "End") selectView(1);
    else selectView(current + 1);
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
  const objectiveCount = map.rooms.filter((room) => room.objective).length;
  const label = `Generated map, seed ${seed}: ${map.rooms.length} rooms${
    objectiveCount ? `, ${objectiveCount} holding an objective` : ""
  }. Showing step ${Math.max(phase, 1)} of ${STEPS.length}, ${STEPS[Math.max(phase, 1) - 1]}.`;

  return (
    <div className="levelgen-pipeline lg" ref={root} data-reveal>
      <div
        className="lg-stage"
        data-view={view}
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${view}`}
      >
        {view === "pipeline" ? (
          <a className="lg-pipeline" href={pipelineSrc} target="_blank" rel="noreferrer">
            <img
              src={pipelineSrc}
              alt="Diagram of the generation pipeline, from LevelConfig and CreateMapData() to MapData, then ConstructMapMesh(), PopulateRooms() and SpawnProps()"
            />
          </a>
        ) : (
          <>
            <div className="lg-steps">
              <ol aria-label="Pipeline steps">
                {STEPS.map((name, i) => (
                  <li key={name}>
                    <button
                      type="button"
                      aria-label={name}
                      aria-current={phase === i + 1 ? "step" : undefined}
                      data-done={phase > i + 1 || undefined}
                      onClick={() => goTo(i + 1)}
                    >
                      <span />
                    </button>
                  </li>
                ))}
              </ol>
              <span className="lg-step-name" aria-hidden="true">
                {phase > 0 ? STEPS[phase - 1] : ""}
              </span>
            </div>
            <svg
              className="lg-map"
              data-mode={mode}
              viewBox={`${-U * 0.6} ${-U * 0.6} ${width + U * 1.2} ${height + U * 1.2}`}
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
                <pattern
                  id={`${uid}-t2`}
                  width={3}
                  height={3}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <path className="lg-pat" d="M0 0V3" />
                </pattern>
                <pattern
                  id={`${uid}-obj`}
                  width={2.6}
                  height={2.6}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-45)"
                >
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
                {phase >= 2 ? (
                  <g className={`lg-cells${phase >= 3 ? " is-floor" : ""}${phase >= 4 ? " is-themed" : ""}`}>
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
                {phase >= 3 ? (
                  <g className="lg-halls">
                    <path d={hallFloor} style={delay(300)} />
                  </g>
                ) : null}
                {phase >= 4 ? (
                  <g className="lg-theme" transform={`scale(${1 / U})`}>
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
                ) : null}
                {phase >= 1 ? (
                  <g className="lg-objectives">
                    {map.rooms
                      .filter((room) => room.objective)
                      .map((room) => (
                        <g key={`o${room.id}`}>
                          <polygon
                            className="lg-objective-floor"
                            points={room.poly.map(([x, y]) => `${x},${y}`).join(" ")}
                          />
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
                {phase >= 1 ? (
                  <g className={`lg-footprints${past(2)}`}>
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
                {phase >= 1 ? (
                  <g className={`lg-graph${past(1)}`}>
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
                          style={delay(450 + Math.min(a, b) * 45)}
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
                        style={delay(i * 70 + 200)}
                      />
                    ))}
                  </g>
                ) : null}
                {phase >= 3 ? (
                  <g className="lg-walls">
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
                {phase >= 3 ? (
                  <g className="lg-doors">
                    {map.doors.map((d) => (
                      <path key={d.key} d={d.d} style={delay(420)} />
                    ))}
                  </g>
                ) : null}
                {phase >= 5 ? (
                  <g className="lg-props">
                    {map.props.map((p, i) =>
                      p.round ? (
                        <circle
                          key={p.key}
                          cx={p.x + 0.5}
                          cy={p.y + 0.5}
                          r={0.3}
                          style={delay(i * 22)}
                        />
                      ) : (
                        <rect
                          key={p.key}
                          x={p.x + 0.2}
                          y={p.y + 0.2}
                          width={p.w - 0.4}
                          height={p.h - 0.4}
                          style={delay(i * 22)}
                        />
                      ),
                    )}
                  </g>
                ) : null}
                {phase >= 1 ? (
                  <g className="lg-markers">
                    {map.rooms
                      .filter((room) => room.objective)
                      .map((room) => (
                        <g
                          key={`m${room.id}`}
                          transform={`translate(${room.ax + 0.5} ${room.ay + 0.5})`}
                        >
                          <circle className="lg-ring" r={0.9} />
                          <polygon className="lg-diamond" points="0,-0.52 0.52,0 0,0.52 -0.52,0" />
                        </g>
                      ))}
                  </g>
                ) : null}
              </g>
            </svg>
          </>
        )}
      </div>

      <div className="lg-bar">
        <div className="lg-views" role="tablist" aria-label="Level generator views" onKeyDown={onTabKey}>
          {(["sketch", "pipeline"] as const).map((name, i) => (
            <button
              key={name}
              ref={(element) => {
                tabs.current[i] = element;
              }}
              id={`${uid}-tab-${name}`}
              type="button"
              role="tab"
              aria-selected={view === name}
              aria-controls={`${uid}-panel`}
              tabIndex={view === name ? 0 : -1}
              onClick={() => setView(name)}
            >
              {name === "sketch" ? "Sketch" : "Pipeline"}
            </button>
          ))}
        </div>
        <div className="lg-actions" hidden={view !== "sketch"}>
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
      <p className="lg-note" hidden={view !== "sketch"}>
        A sketch of the idea, running in your browser. The real generator runs
        in Unreal Engine 5.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
