import { useEffect, useRef, type CSSProperties } from "react";
import { artDimensions } from "../data/artDimensions";
import { artPieces } from "../data/artPieces";

/** Paintings for the splash grid, picked to sit well together at thumbnail size. */
const picks = [
  "gold",
  "red-hall",
  "always-something-left-unsaid",
  "furnace-room",
  "bird",
  "white",
  "redblue",
  "the-tower",
  "amber",
  "midnight",
  "guardian",
  "fallen",
  "genesis-prime",
  "alone",
  "black",
  "super",
  "mary",
  "bloom",
];

const COLUMNS = 3;
/** How far each column travels with the pointer, in px at the panel's edge. */
const DEPTH = [40, 72, 54];

type Tile = { slug: string; src: string; width: number; height: number };

// Shortest column first, so the columns end at similar heights.
const columns = (() => {
  const result: Tile[][] = Array.from({ length: COLUMNS }, () => []);
  const heights = new Array(COLUMNS).fill(0);
  for (const slug of picks) {
    const piece = artPieces.find((item) => item.slug === slug);
    const size = artDimensions[slug];
    if (!piece || !size) continue;
    const [width, height] = size;
    const column = heights.indexOf(Math.min(...heights));
    result[column].push({ slug, src: piece.coverImage, width, height });
    heights[column] += height / width;
  }
  return result;
})();

/**
 * The Paintings panel's picture: a grid of paintings in staggered columns.
 * While the panel is open, the frames shift with the pointer, a column at a
 * time and each column by a different amount, while the paintings inside
 * them hold still: the frames slide over them like windows. The movement follows the visitor's hand and settles
 * softly; nothing moves on its own. The painting under the pointer keeps its
 * colour and the rest turn grey.
 */
export default function SplashPaintings({ load }: { load: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const grid = ref.current;
    const stage = grid?.closest<HTMLElement>(".splash-stage");
    if (!grid || !stage) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let frame = 0;
    let hovered: HTMLElement | null = null;

    const tick = () => {
      frame = 0;
      now.x += (target.x - now.x) * 0.08;
      now.y += (target.y - now.y) * 0.08;
      const cols = grid.querySelectorAll<HTMLElement>(".splash-paintings-column");
      cols.forEach((col, i) => {
        const depth = DEPTH[i % DEPTH.length];
        const x = (now.x * depth * 0.4).toFixed(2);
        const y = (now.y * depth).toFixed(2);
        col.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        // The paintings move back by the same amount, so they stay put.
        col.style.setProperty("--hold-x", `${-x}px`);
        col.style.setProperty("--hold-y", `${-y}px`);
      });
      if (Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.001)
        frame = requestAnimationFrame(tick);
    };
    // The pictures layer doesn't take the pointer (the links above it do),
    // so find the painting under it by position.
    const hover = (tile: HTMLElement | null) => {
      if (tile === hovered) return;
      hovered?.classList.remove("is-hovered");
      tile?.classList.add("is-hovered");
      grid.classList.toggle("has-hover", !!tile);
      hovered = tile;
    };
    const move = (event: PointerEvent) => {
      if (!grid.closest(".is-active")) return hover(null);
      const rect = grid.getBoundingClientRect();
      // -1..1 across the open panel; the opposite way to the pointer.
      target.x = -((event.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(tick);
      const tiles = grid.querySelectorAll<HTMLElement>(".splash-paintings-tile");
      hover(
        [...tiles].find((tile) => {
          const box = tile.getBoundingClientRect();
          return (
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom
          );
        }) ?? null,
      );
    };
    const leave = () => {
      target.x = 0;
      target.y = 0;
      hover(null);
      if (!frame) frame = requestAnimationFrame(tick);
    };

    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <span ref={ref} className="splash-paintings">
      {load
        ? columns.map((tiles, i) => (
            <span
              key={i}
              className="splash-paintings-column"
              style={
                {
                  "--col": i,
                  "--pad-x": `${Math.ceil(DEPTH[i % DEPTH.length] * 0.4) + 2}px`,
                  "--pad-y": `${DEPTH[i % DEPTH.length] + 2}px`,
                } as CSSProperties
              }
            >
              {tiles.map((tile, n) => (
                <span
                  key={tile.slug}
                  className="splash-paintings-tile"
                  style={{ "--n": n, aspectRatio: `${tile.width} / ${tile.height}` } as CSSProperties}
                >
                  <img
                    src={tile.src}
                    alt=""
                    width={tile.width}
                    height={tile.height}
                    decoding="async"
                  />
                </span>
              ))}
            </span>
          ))
        : null}
    </span>
  );
}
