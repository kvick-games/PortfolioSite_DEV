import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Brand from "./Brand";
import "./scroll-rail.css";

/* The home page chapters, in page order. */
const SECTIONS: ReadonlyArray<{ id: string; label: ReactNode }> = [
  { id: "work", label: "God of War" },
  { id: "judas", label: "Judas" },
  { id: "dreamatron", label: <Brand /> },
  { id: "ewa", label: "EWA" },
  { id: "tanuki", label: "Tanuki" },
  { id: "ai-timeline", label: "AI Timeline" },
  { id: "level-generator", label: "Level Generator" },
  { id: "paintings", label: "Paintings" },
  { id: "about", label: "About" },
];

/* A section becomes current when its top passes this far down the viewport. */
const READ_LINE = 0.42;

type Field = "ground" | "night" | "accent";

/**
 * A quiet rail in the left margin of the home page: a hairline with a tick
 * per chapter. The line fills as the page scrolls, the current chapter's tick
 * is drawn longer, and chapter names fade in on hover or focus. It stays out
 * of the opening splash and fades in once the first chapter arrives.
 *
 * Positions are read once per animation frame on scroll and resize; the fill
 * is a transform, so scrolling never triggers layout.
 */
export default function ScrollRail() {
  const fillRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(-1);
  const [shown, setShown] = useState(false);
  const [field, setField] = useState<Field>("ground");

  useEffect(() => {
    let frame = 0;
    const last = SECTIONS.length - 1;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const line = vh * READ_LINE;
      const tops = SECTIONS.map(
        ({ id }) => document.getElementById(id)?.getBoundingClientRect().top ?? Infinity,
      );
      const atEnd =
        window.scrollY + vh >= document.documentElement.scrollHeight - 2;

      // Current chapter: the last whose top has passed the read line.
      let current = -1;
      tops.forEach((top, i) => {
        if (top <= line) current = i;
      });
      if (atEnd) current = last;

      // The fill reaches tick i as chapter i starts and tick i + 1 as the next
      // one does, so the ticks can be evenly spaced whatever the chapter lengths.
      let progress = 0;
      if (current >= last) progress = 1;
      else if (current >= 0) {
        const span = tops[current + 1] - tops[current];
        const within = span > 0 ? (line - tops[current]) / span : 0;
        progress = (current + Math.min(1, Math.max(0, within))) / last;
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${progress.toFixed(4)})`;

      const section = current >= 0 ? document.getElementById(SECTIONS[current].id) : null;
      setActive(current);
      // Out of the splash once the first chapter is well into view.
      setShown(tops[0] < vh * 0.6);
      setField(
        section?.classList.contains("field-night")
          ? "night"
          : section?.classList.contains("field-accent")
            ? "accent"
            : "ground",
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Lazy images and late fonts move the chapters after the first paint.
    const observer = new ResizeObserver(schedule);
    const main = document.getElementById("main");
    if (main) observer.observe(main);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // A mouse click shouldn't leave the link focused (detail is 0 for Enter).
    if (event.detail > 0) event.currentTarget.blur();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
  };

  return (
    <nav
      className="scroll-rail"
      aria-label="Sections"
      data-shown={shown || undefined}
      data-field={field}
    >
      <span className="scroll-rail-track" aria-hidden="true">
        <span className="scroll-rail-fill" ref={fillRef} />
      </span>
      <ol>
        {SECTIONS.map(({ id, label }, i) => (
          <li key={id} style={{ top: `${(i / (SECTIONS.length - 1)) * 100}%` }}>
            <a
              href={`#${id}`}
              aria-current={i === active ? "true" : undefined}
              data-passed={i < active || undefined}
              onClick={(event) => go(event, id)}
            >
              <span className="scroll-rail-label">{label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
