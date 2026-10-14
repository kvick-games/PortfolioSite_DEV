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
const DEPTH = [26, 44, 34];

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
 * While the panel is open, the columns shift a little with the pointer, each
 * by a different amount, so the grid has depth. The movement follows the
 * visitor's hand and settles softly; nothing moves on its own.
 */
export default function SplashPaintings({ load }: { load: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const grid = ref.current;
    const stage = grid?.closest<HTMLElement>(".splash-stage");
    if (!grid || !stage) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cols = [...grid.querySelectorAll<HTMLElement>(".splash-paintings-column")];
    const target = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let frame = 0;

    const tick = () => {
      frame = 0;
      now.x += (target.x - now.x) * 0.08;
      now.y += (target.y - now.y) * 0.08;
      cols.forEach((col, i) => {
        const depth = DEPTH[i % DEPTH.length];
        col.style.transform = `translate3d(${(now.x * depth * 0.35).toFixed(2)}px, ${(now.y * depth).toFixed(2)}px, 0)`;
      });
      if (Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.001)
        frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (!grid.closest(".is-active")) return;
      const rect = grid.getBoundingClientRect();
      // -1..1 across the open panel; the opposite way to the pointer.
      target.x = -((event.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const leave = () => {
      target.x = 0;
      target.y = 0;
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
              style={{ "--col": i } as CSSProperties}
            >
              {tiles.map((tile, n) => (
                <img
                  key={tile.slug}
                  src={tile.src}
                  alt=""
                  width={tile.width}
                  height={tile.height}
                  decoding="async"
                  style={{ "--n": n } as CSSProperties}
                />
              ))}
            </span>
          ))
        : null}
    </span>
  );
}
