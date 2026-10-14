import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Brand from "./Brand";
import SplashAtmosphere from "./SplashAtmosphere";
import SplashLayers, { type SplashLayer } from "./SplashLayers";
import SplashLevelGen from "./SplashLevelGen";
import SplashPaintings from "./SplashPaintings";
import "../splash.css";

type Panel = {
  href: string;
  title: ReactNode;
  meta: ReactNode;
  /** Years, set apart from the meta by space rather than a comma. */
  when?: string;
  image: string;
  width: number;
  height: number;
  /** Horizontal focal point of the open panel. */
  focus: string;
  /** Drawn rather than photographed: the stacked wordmark. */
  wordmark?: boolean;
  /** Open, the panel shows a grid of paintings instead of `image`. */
  grid?: boolean;
  /** Open, the picture is these aligned layers, which follow the pointer. */
  layers?: SplashLayer[];
  /** Open, snow and a low fog drift over the picture. */
  weather?: boolean;
  /** Open, a muted loop plays over `image`, which is its first frame. */
  video?: { mp4: string; webm: string; poster: string };
  /** Open, levels build one after another over `image`, the first one finished. */
  levelgen?: boolean;
};

const img = (name: string) => `/Resources/Site/img/${name}.webp`;

const panels: Panel[] = [
  {
    href: "#work",
    title: "God of War",
    meta: "Sony Santa Monica Studio",
    when: "2016–2018",
    image: img("gow-boat"),
    width: 2880,
    height: 1620,
    focus: "47%",
    weather: true,
  },
  {
    href: "#judas",
    title: "Judas",
    meta: "Ghost Story Games",
    when: "2018–2020",
    image: img("projects-judas-img2"),
    width: 1800,
    height: 1013,
    focus: "50%",
    layers: [
      { src: "/Resources/Site/img/layers/judas/plate.webp", depth: 0 },
      { src: "/Resources/Site/img/layers/judas/judas.webp", depth: 1 },
    ],
  },
  {
    href: "#dreamatron",
    title: <Brand />,
    meta: "AI for games",
    image: "",
    width: 0,
    height: 0,
    focus: "50%",
    wordmark: true,
  },
  {
    href: "#ewa",
    title: "EWA",
    meta: <Brand />,
    image: img("ewa-key-tower"),
    width: 2400,
    height: 1300,
    focus: "36%",
  },
  {
    href: "#tanuki",
    title: "Tanuki",
    meta: <Brand />,
    image: img("tanuki-concept-island"),
    width: 1690,
    height: 931,
    focus: "50%",
    video: {
      mp4: "/Resources/Site/loops/tanuki-island.mp4",
      webm: "/Resources/Site/loops/tanuki-island.webm",
      poster: "/Resources/Site/loops/tanuki-island.webp",
    },
  },
  {
    href: "#level-generator",
    title: "Level Generator",
    meta: "Solo technical demo",
    when: "2023",
    image: "/Resources/Site/loops/levelgen-plan.webp",
    width: 1200,
    height: 1000,
    focus: "50%",
    levelgen: true,
  },
  {
    href: "#paintings",
    title: "Paintings",
    meta: "Characters, rooms and imagined places",
    image: "/Resources/ArtStation/fallen/01-mike-nevins-fallen.jpg",
    width: 1920,
    height: 897,
    focus: "70%",
    grid: true,
  },
];

/** Open panel width relative to a closed one; matches flex-grow in splash.css. */
const OPEN_GROW = 5;
/** How long the pointer rests on a panel before it opens, so sweeping across doesn't. */
const HOVER_INTENT_MS = 90;

const NAME = "DREAMATRON";
/**
 * The wordmark's reveal as one still: each row is a frame, the name arriving
 * a letter or two at a time and then leaving from the left. [first, last).
 */
const FRAMES: Array<[number, number]> = [
  [0, 3],
  [0, 5],
  [0, 6],
  [0, 8],
  [0, 10],
  [0, 10],
  [1, 10],
  [6, 10],
];

/**
 * A panel's loop. It loads with the page's other deferred pictures, plays
 * while its panel is open and rests on its current frame otherwise. It stays
 * invisible over the still until its first frame is actually playing, then
 * fades in and never hides again, so starting, pausing and looping can't
 * flash a poster or an empty frame. Reduced motion keeps the still.
 */
function SplashVideo({ video, playing, load }: { video: NonNullable<Panel["video"]>; playing: boolean; load: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [still] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) el.play().catch(() => undefined);
    else el.pause();
  }, [playing, load]);
  if (still || !load) return null;
  return (
    <video
      ref={ref}
      className={ready ? "splash-video is-ready" : "splash-video"}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onPlaying={() => setReady(true)}
    >
      <source src={video.webm} type="video/webm" />
      <source src={video.mp4} type="video/mp4" />
    </video>
  );
}

/** The stacked wordmark. Letters keep their columns, so rows read as frames. */
function WordmarkStack({ className }: { className: string }) {
  return (
    <span className={`splash-img splash-wordmark ${className}`} aria-hidden="true">
      {FRAMES.map(([first, last], row) => (
        <span key={row} className="splash-wordmark-row" style={{ "--r": row } as CSSProperties}>
          {[...NAME].slice(first, last).map((letter, i) => {
            const column = first + i;
            // The letter arriving (or leaving) in each frame is half there.
            const passing =
              (last < NAME.length && column === last - 1) || (first > 0 && column === first);
            return (
              <span
                key={column}
                className={passing ? "is-passing" : undefined}
                style={{ "--c": column, gridColumn: column + 1 } as CSSProperties}
              >
                {letter}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/**
 * The home page's opening: the projects side by side as a horizontal
 * accordion. Resting the pointer on a panel brings it into focus.
 *
 * Nothing the visitor is looking at moves. Each picture is pinned to the
 * place its panel occupies when open, and every panel is a window onto its
 * pinned picture (a clip that animates with the panel's width). Opening a
 * panel reveals more of a still picture while its colour fades in over a
 * dim greyscale copy; closing does the reverse. The vertical names are
 * pinned too: each has a place left of the open panel and one right of it,
 * and fades out of one and into the other.
 */
export default function ProjectSplash() {
  const [active, setActive] = useState(0);
  // The paintings grid loads its pictures once the page has settled, or as
  // soon as its panel opens.
  const [gridReady, setGridReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const intentRef = useRef(0);

  // The strip fills the screen below the header, whose height changes with
  // the viewport (it wraps to two rows on phones).
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const root = rootRef.current;
    if (!header || !root) return;
    const sync = () =>
      root.style.setProperty("--splash-header", `${header.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Panel widths in pixels, for pinning the pictures and sizing their clips.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sync = () => {
      // The strip's resolved gap; the custom property itself is an unresolved clamp().
      const strip = stage.querySelector(".splash-strip");
      const gap = strip ? parseFloat(getComputedStyle(strip).columnGap) || 0 : 0;
      const free = stage.clientWidth - gap * (panels.length - 1);
      const closed = free / (OPEN_GROW + panels.length - 1);
      stage.style.setProperty("--closed-w", `${closed}px`);
      stage.style.setProperty("--open-w", `${closed * OPEN_GROW}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(intentRef.current), []);

  useEffect(() => {
    if (panels[active].grid) setGridReady(true);
    const timer = window.setTimeout(() => setGridReady(true), 2500);
    return () => window.clearTimeout(timer);
  }, [active]);

  const intend = (index: number) => {
    window.clearTimeout(intentRef.current);
    intentRef.current = window.setTimeout(() => setActive(index), HOVER_INTENT_MS);
  };
  const cancel = () => window.clearTimeout(intentRef.current);
  const place = (index: number) =>
    index === active ? "is-active" : index < active ? "is-before" : "is-after";

  return (
    <section className="splash" ref={rootRef} aria-labelledby="splash-title">
      <h1 id="splash-title" className="splash-title sr-only">
        Interfaces for games and creative tools
      </h1>
      <div className="splash-stage" ref={stageRef}>
        {/* Pinned pictures and names for the accordion; the list below carries the links. */}
        <div className="splash-pictures" aria-hidden="true">
          {panels.map((panel, index) => (
            <span
              key={panel.href}
              className={`splash-picture ${place(index)}`}
              style={{ "--i": index, "--focus": panel.focus } as CSSProperties}
            >
              {panel.wordmark ? (
                <>
                  <WordmarkStack className="splash-img--dim" />
                  <WordmarkStack className="splash-img--lit" />
                </>
              ) : (
                <>
                  <img
                    className="splash-img splash-img--dim"
                    src={panel.image}
                    alt=""
                    width={panel.width}
                    height={panel.height}
                    fetchPriority={index === 0 ? "high" : undefined}
                  />
                  <span className="splash-img--lit">
                    {panel.grid ? (
                      <SplashPaintings load={gridReady} />
                    ) : panel.layers ? (
                      <SplashLayers layers={panel.layers} width={panel.width} height={panel.height} />
                    ) : (
                      <img
                        className="splash-img"
                        src={panel.image}
                        alt=""
                        width={panel.width}
                        height={panel.height}
                      />
                    )}
                    {panel.weather ? <SplashAtmosphere playing={index === active} /> : null}
                    {panel.levelgen ? (
                      <SplashLevelGen playing={index === active} load={gridReady} />
                    ) : null}
                    {panel.video ? (
                      <SplashVideo video={panel.video} playing={index === active} load={gridReady} />
                    ) : null}
                  </span>
                </>
              )}
            </span>
          ))}
          {panels.map((panel, index) =>
            (["is-before", "is-after"] as const).map((side) => (
              <span
                key={`${panel.href}-${side}`}
                className={`splash-label splash-label--${side.slice(3)}${
                  place(index) === side ? " is-shown" : ""
                }`}
                style={{ "--i": index } as CSSProperties}
              >
                {panel.title}
              </span>
            )),
          )}
        </div>
        <ul className="splash-strip" aria-label="Projects" onPointerLeave={cancel}>
          {panels.map((panel, index) => (
            <li
              key={panel.href}
              className={`splash-item ${place(index)}`}
              style={{ "--i": index, "--focus": panel.focus } as CSSProperties}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") intend(index);
              }}
            >
              <a className="splash-panel" href={panel.href} onFocus={() => setActive(index)}>
                <span className="splash-media">
                  {/* Shown in the stacked layout; the accordion uses the pinned pictures. */}
                  {panel.wordmark ? (
                    <WordmarkStack className="splash-img--stack" />
                  ) : (
                    <img
                      className="splash-img splash-img--stack"
                      src={panel.image}
                      alt=""
                      width={panel.width}
                      height={panel.height}
                    />
                  )}
                </span>
                <span className="splash-caption">
                  <span className="splash-name">{panel.title}</span>
                  <span className="splash-meta">
                    {panel.meta}
                    {panel.when ? <span className="splash-when">{panel.when}</span> : null}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
