import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import "../recipe-sketch.css";

/**
 * A playable sketch of Tanuki's criteria-based recipes. Ingredients carry
 * qualities (what they are, what kind of thing, how they're cooked) and each
 * recipe card asks for qualities rather than a specific item, so it lights up
 * whenever anything in the pan satisfies it. This is an illustration of the
 * idea written for the site, not the game's code.
 */

type Kind = "carrot" | "onion" | "apple";
type Item = { kind: Kind; name: string; family: "vegetable" | "fruit" };
type ItemState = { inPan: boolean; grilled: boolean };

const ITEMS: Item[] = [
  { kind: "carrot", name: "Carrot", family: "vegetable" },
  { kind: "onion", name: "Onion", family: "vegetable" },
  { kind: "apple", name: "Apple", family: "fruit" },
];

type Recipe = { id: string; label: string; accepts: (item: Item, state: ItemState) => boolean };

// The three examples are the ones given for the real system.
const RECIPES: Recipe[] = [
  { id: "grilled-carrot", label: "A grilled carrot", accepts: (i, s) => i.kind === "carrot" && s.grilled },
  {
    id: "grilled-veg",
    label: "Any grilled vegetable",
    accepts: (i, s) => i.family === "vegetable" && s.grilled,
  },
  { id: "any-carrot", label: "A carrot of any quality", accepts: (i) => i.kind === "carrot" },
];

const GRILL_MS = 1100;

const fresh = (): Record<Kind, ItemState> => ({
  carrot: { inPan: false, grilled: false },
  onion: { inPan: false, grilled: false },
  apple: { inPan: false, grilled: false },
});

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function RecipeSketch() {
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const [items, setItems] = useState(fresh);
  const [heat, setHeat] = useState(false);
  const [live, setLive] = useState(false);

  // Only animate while on screen, and give a first, quiet demonstration the
  // first time it comes into view: the carrot hops into the pan.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let demo = 0;
    let shown = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        setLive(entry.isIntersecting);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !shown) {
          shown = true;
          demo = window.setTimeout(() => {
            if (touched.current) return;
            setItems((s) => ({ ...s, carrot: { ...s.carrot, inPan: true } }));
          }, prefersReducedMotion() ? 0 : 650);
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      window.clearTimeout(demo);
    };
  }, []);

  // Anything sitting in a hot pan grills after a moment.
  const cooking = ITEMS.filter(({ kind }) => heat && items[kind].inPan && !items[kind].grilled).map(
    ({ kind }) => kind,
  );
  const cookingKey = cooking.join(",");
  useEffect(() => {
    if (!cookingKey) return;
    const kinds = cookingKey.split(",") as Kind[];
    const t = window.setTimeout(
      () =>
        setItems((s) => {
          const next = { ...s };
          kinds.forEach((k) => {
            if (next[k].inPan) next[k] = { ...next[k], grilled: true };
          });
          return next;
        }),
      prefersReducedMotion() ? 0 : GRILL_MS,
    );
    return () => window.clearTimeout(t);
  }, [cookingKey]);

  const place = (kind: Kind, inPan: boolean) => {
    touched.current = true;
    setItems((s) => {
      if (s[kind].inPan === inPan) return s;
      // Taking something out puts a fresh one back on the board.
      return { ...s, [kind]: { inPan, grilled: inPan ? s[kind].grilled : false } };
    });
  };
  const toggle = (kind: Kind) => place(kind, !items[kind].inPan);

  // Mouse and pen can also drag ingredients in and out. Touch stays a tap, so
  // a finger on the board still scrolls the page.
  const drag = useRef<{ kind: Kind; x: number; y: number; moved: boolean; el: HTMLElement } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (kind: Kind) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    drag.current = { kind, x: e.clientX, y: e.clientY, moved: false, el: e.currentTarget };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    d.el.dataset.dragging = "";
    d.el.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    suppressClick.current = true;
    const pan = panRef.current?.getBoundingClientRect();
    let inside = items[d.kind].inPan;
    if (pan) {
      const r = pan.width / 2;
      inside = Math.hypot(e.clientX - (pan.left + r), e.clientY - (pan.top + r)) < r * 1.08;
    }
    // Release with transitions on, so the item glides from where it was
    // dropped to its resting place.
    delete d.el.dataset.dragging;
    d.el.style.transform = "";
    place(d.kind, inside);
  };
  const onClick = (kind: Kind) => () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    toggle(kind);
  };

  const matches = RECIPES.map((recipe) =>
    ITEMS.filter((item) => items[item.kind].inPan && recipe.accepts(item, items[item.kind])),
  );
  const metCount = matches.filter((m) => m.length > 0).length;
  const steaming = heat && ITEMS.some(({ kind }) => items[kind].inPan);

  return (
    <figure className="rs-figure">
    <div
      ref={rootRef}
      className="rs"
      data-live={live ? "" : undefined}
      data-heat={heat ? "" : undefined}
    >
      <div className="rs-stage">
        <div className="rs-board" aria-hidden="true">
          {ITEMS.map((item) => {
            const s = items[item.kind];
            return (
              <div
                key={item.kind}
                className="rs-slot"
                data-kind={item.kind}
                data-empty={s.inPan ? "" : undefined}
                onClick={() => toggle(item.kind)}
              >
                <span className="rs-slot-mark" />
                <span className="rs-slot-label" id={`${uid}-${item.kind}`}>
                  <strong>{item.name}</strong>
                  <span>
                    {s.grilled ? "grilled" : "raw"} {item.family}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="rs-pan" ref={panRef} data-steam={steaming ? "" : undefined}>
          <svg className="rs-pan-art" viewBox="0 0 200 200" aria-hidden="true">
            <g className="rs-flames">
              {Array.from({ length: 16 }, (_, i) => (
                <g key={i} transform={`rotate(${i * 22.5} 100 100)`}>
                  <path
                    className="rs-flame"
                    style={{ ["--i" as string]: i }}
                    d="M100 9 C105 15 107 21 100 28 C93 21 95 15 100 9Z"
                  />
                </g>
              ))}
            </g>
            <circle className="rs-pan-rim" cx="100" cy="100" r="80" />
            <circle className="rs-pan-floor" cx="100" cy="100" r="69" />
            <g className="rs-steam">
              <path style={{ ["--i" as string]: 0 }} d="M78 96 C72 86 84 80 78 70" />
              <path style={{ ["--i" as string]: 1 }} d="M100 90 C94 80 106 74 100 64" />
              <path style={{ ["--i" as string]: 2 }} d="M122 96 C116 86 128 80 122 70" />
            </g>
          </svg>
        </div>

        {ITEMS.map((item) => {
          const s = items[item.kind];
          return (
            <button
              key={item.kind}
              type="button"
              className="rs-item"
              data-kind={item.kind}
              data-place={s.inPan ? "pan" : "board"}
              data-grilled={s.grilled ? "" : undefined}
              data-cooking={cooking.includes(item.kind) ? "" : undefined}
              aria-pressed={s.inPan}
              aria-label={`${item.name} in the pan`}
              aria-describedby={`${uid}-${item.kind}`}
              onClick={onClick(item.kind)}
              onPointerDown={onPointerDown(item.kind)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <Ingredient kind={item.kind} clipId={`${uid}-clip-${item.kind}`} />
            </button>
          );
        })}

        <button
          type="button"
          className="rs-heat"
          aria-pressed={heat}
          onClick={() => {
            touched.current = true;
            setHeat((h) => !h);
          }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.5c.6 2.4 4.5 4.6 4.5 8.2A4.5 4.5 0 0 1 3.5 9.7C3.5 7.4 5 6.3 5.6 4.6c.9 1 1.4 1.9 1.5 3C8.3 6 8.4 3.6 8 1.5Z" />
          </svg>
          Grill
        </button>
      </div>

      <ul className="rs-recipes" aria-label="Recipes">
        {RECIPES.map((recipe, r) => {
          const met = matches[r];
          return (
            <li key={recipe.id} className="rs-card" data-met={met.length ? "" : undefined}>
              <span className="rs-card-label">{recipe.label}</span>
              <span className="sr-only">{met.length ? ", met" : ", not met"}</span>
              <span className="rs-card-fill" aria-hidden="true">
                {met.map((item) => (
                  <span key={item.kind} className="rs-mini" data-kind={item.kind} data-grilled={items[item.kind].grilled ? "" : undefined}>
                    <Ingredient kind={item.kind} clipId={`${uid}-mini-${recipe.id}-${item.kind}`} />
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="sr-only" aria-live="polite">
        {metCount} of {RECIPES.length} recipes met
      </p>
    </div>
    <figcaption>A sketch of the recipe system, not the game’s code.</figcaption>
    </figure>
  );
}

/* Flat, toy-like ingredient drawings. Colours come from CSS so the grilled
   state can ease in. */
function Ingredient({ kind, clipId }: { kind: Kind; clipId: string }) {
  const body = BODIES[kind];
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="rs-art">
      <defs>
        <clipPath id={clipId}>
          <path d={body} />
        </clipPath>
      </defs>
      {kind === "carrot" && (
        <g className="rs-leaf">
          <path d="M43 21 C38 14 37 7 40 2 C45 6 47 13 46 20Z" />
          <path d="M45 21 C47 13 53 8 60 7 C59 13 54 19 47 23Z" />
          <path d="M44 22 C40 17 33 15 28 16 C31 21 37 24 43 24Z" />
        </g>
      )}
      {kind === "apple" && (
        <>
          <path className="rs-stem" d="M32 21 C32 15 33 11 36 7" />
          <path className="rs-leaf" d="M35 13 C38 6 46 5 50 8 C46 14 40 15 35 13Z" />
        </>
      )}
      {kind === "onion" && <path className="rs-sprout" d="M30 13 C30 8 31 5 33 2 C35 5 35 9 34 13Z" />}
      <path className="rs-body" d={body} />
      <g className="rs-detail" clipPath={`url(#${clipId})`}>
        {kind === "carrot" && (
          <>
            <path d="M33 30 L39 34" />
            <path d="M25 40 L30 43" />
            <path d="M18 49 L22 51" />
          </>
        )}
        {kind === "onion" && (
          <>
            <path d="M32 14 C22 24 22 44 30 55" />
            <path d="M32 14 C42 24 42 44 34 55" />
          </>
        )}
        {kind === "apple" && <path d="M44 26 C47 29 48 33 48 37" />}
      </g>
      <g className="rs-marks" clipPath={`url(#${clipId})`}>
        <path d="M2 40 L46 4" />
        <path d="M10 52 L58 12" />
        <path d="M20 62 L64 26" />
      </g>
    </svg>
  );
}

const BODIES: Record<Kind, string> = {
  carrot: "M47 19 C52 23 50 30 44 36 L15 58 C11 61 8 58 11 54 L35 23 C39 18 43 16 47 19Z",
  onion: "M32 12 C34 17 38 19 44 23 C54 29 54 46 44 52 C38 56 26 56 20 52 C10 46 10 29 20 23 C26 19 30 17 32 12Z",
  apple: "M32 21 C26 15 12 16 11 31 C10 45 20 57 28 56 C30 56 31 55 32 55 C33 55 34 56 36 56 C44 57 54 45 53 31 C52 16 38 15 32 21Z",
};
