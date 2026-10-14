import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import Brand from "./Brand";
import "../splash.css";

type Panel = {
  href: string;
  title: ReactNode;
  meta: ReactNode;
  image: string;
  width: number;
  height: number;
  /** Horizontal focal point of the open panel. */
  focus: string;
  /** Focal point of the closed slice, when it should differ (say, to avoid UI text). */
  slice?: string;
};

const img = (name: string) => `/Resources/Site/img/${name}.webp`;

const panels: Panel[] = [
  {
    href: "#work",
    title: "God of War",
    meta: "Sony Santa Monica Studio, 2016–2018",
    image: img("gow-kratos-atreus"),
    width: 1600,
    height: 720,
    focus: "38%",
  },
  {
    href: "#judas",
    title: "Judas",
    meta: "Ghost Story Games, 2018–2020",
    image: img("projects-judas-img2"),
    width: 1800,
    height: 1013,
    focus: "50%",
  },
  {
    href: "#dreamatron",
    title: <Brand />,
    meta: (
      <>
        AI Timeline and <Brand name="Auteur" />
      </>
    ),
    image: img("dreamatron-timeline"),
    width: 1800,
    height: 1125,
    focus: "50%",
    slice: "9%",
  },
  {
    href: "#tanuki",
    title: "Tanuki",
    meta: (
      <>
        <Brand />, 2020 to now
      </>
    ),
    image: img("tanuki-1"),
    width: 1800,
    height: 1081,
    focus: "50%",
    slice: "30%",
  },
  {
    href: "#ewa",
    title: "EWA",
    meta: "Solo project, 2020 to now",
    image: img("ewa-ewa-concept-01"),
    width: 1800,
    height: 766,
    focus: "47%",
  },
  {
    href: "#level-generator",
    title: "Level Generator",
    meta: "Solo technical demo, 2023",
    image: img("levelgenerator-3"),
    width: 1800,
    height: 782,
    focus: "50%",
  },
  {
    href: "#paintings",
    title: "Paintings",
    meta: "Characters, rooms and imagined places",
    image: "/Resources/ArtStation/fallen/01-mike-nevins-fallen.jpg",
    width: 1920,
    height: 897,
    focus: "70%",
  },
];

/**
 * The home page's opening: the projects side by side as a horizontal
 * accordion. The pointer's position across the whole strip, split into equal
 * bands, picks the open panel. Bands, rather than hover on each panel, keep
 * the choice steady while panels resize under the cursor: with every closed
 * panel the same width, the open panel always covers its band.
 */
export default function ProjectSplash() {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLElement>(null);

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

  const onPointerMove = (event: PointerEvent<HTMLUListElement>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const band = Math.floor(((event.clientX - rect.left) / rect.width) * panels.length);
    setActive(Math.min(panels.length - 1, Math.max(0, band)));
  };

  return (
    <section className="splash" ref={rootRef} aria-labelledby="splash-title">
      <h1 id="splash-title" className="splash-title">
        Interfaces for games and creative tools
      </h1>
      <ul className="splash-strip" aria-label="Projects" onPointerMove={onPointerMove}>
        {panels.map((panel, index) => (
          <li
            key={panel.href}
            className={index === active ? "splash-item is-active" : "splash-item"}
            style={{ "--i": index } as CSSProperties}
          >
            <a className="splash-panel" href={panel.href} onFocus={() => setActive(index)}>
              <span className="splash-media">
                <img
                  src={panel.image}
                  alt=""
                  width={panel.width}
                  height={panel.height}
                  style={
                    {
                      "--focus": panel.focus,
                      "--slice": panel.slice ?? panel.focus,
                    } as CSSProperties
                  }
                  fetchPriority={index === 0 ? "high" : undefined}
                />
                <span className="splash-tab" aria-hidden="true">
                  {panel.title}
                </span>
              </span>
              <span className="splash-caption">
                <span className="splash-name">{panel.title}</span>
                <span className="splash-meta">{panel.meta}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
