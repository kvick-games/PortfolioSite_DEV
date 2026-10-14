import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { artDimensions } from "../data/artDimensions";
import type { ArtPiece } from "../data/types";
import LoopVideo from "./LoopVideo";
import PaintingFocus from "./PaintingFocus";

/** Marks an image loaded so it fades in (styles.css, `img[data-fade]`); cached images show at once. */
export function markLoaded(image: HTMLImageElement | null) {
  if (image?.complete && image.naturalWidth) image.dataset.loaded = "";
}

/**
 * Splits the paintings into rows that each fill the measure, choosing the
 * breaks that keep every row (the last one included) closest to the target
 * height. Returns how many paintings go in each row.
 */
function justify(ratios: number[], width: number, gap: number, target: number) {
  const best = [0];
  const from = [0];
  for (let end = 1; end <= ratios.length; end += 1) {
    best[end] = Infinity;
    let sum = 0;
    for (let start = end - 1; start >= 0 && end - start <= 12; start -= 1) {
      sum += ratios[start];
      const height = (width - gap * (end - start - 1)) / sum;
      if (height <= 0) break;
      const cost = best[start] + Math.log(height / target) ** 2;
      if (cost < best[end]) {
        best[end] = cost;
        from[end] = start;
      }
    }
  }
  const counts: number[] = [];
  for (let end = ratios.length; end > 0; end = from[end]) counts.unshift(end - from[end]);
  return counts;
}

/**
 * Paintings in justified rows: every work keeps its own proportions, uncropped,
 * and each row fills the measure. Row height aims at the --row custom property.
 * Until the list has been measured, plain flex wrapping gives a close layout.
 * Clicking a painting lifts it out to the centre of the screen (PaintingFocus);
 * the link still points at its page, for new tabs and shared URLs.
 */
export default function PaintingRows({
  pieces,
  eager = 0,
}: {
  pieces: ArtPiece[];
  eager?: number;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [focus, setFocus] = useState<{ index: number; slot: HTMLElement } | null>(null);
  const [layout, setLayout] = useState<{ counts: number[]; gap: number } | null>(null);
  const sizes = pieces.map((piece) => artDimensions[piece.slug] ?? [4, 3]);
  const ratios = sizes.map(([width, height]) => width / height);
  const ratiosKey = ratios.join();

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const style = getComputedStyle(list);
      const gap = parseFloat(style.columnGap) || 0;
      // --row is registered as a <length> (styles.css), so it reads back in pixels.
      const target = parseFloat(style.getPropertyValue("--row")) || 240;
      const counts = justify(ratiosKey.split(",").map(Number), list.clientWidth, gap, target);
      setLayout((previous) =>
        previous && previous.gap === gap && previous.counts.join() === counts.join()
          ? previous
          : { counts, gap },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [ratiosKey]);

  // Each painting's share of its row's width, once the rows are known.
  const widths: string[] = [];
  layout?.counts.reduce((start, count) => {
    const row = ratios.slice(start, start + count);
    const sum = row.reduce((total, ratio) => total + ratio, 0);
    const gaps = layout.gap * (count - 1);
    row.forEach((ratio) =>
      // A hair under the exact share, so rounding never pushes the last one down a row.
      widths.push(`calc((100% - ${gaps}px) * ${ratio / sum} - 0.05px)`),
    );
    return start + count;
  }, 0);

  return (
    <ul ref={listRef} className={layout ? "painting-rows is-justified" : "painting-rows"}>
      {pieces.map((piece, index) => {
        const [width, height] = sizes[index];
        const ratio = ratios[index];
        return (
          <li
            key={piece.slug}
            style={{
              ...(layout
                ? { flex: "none", width: widths[index] }
                : { flexGrow: ratio, flexBasis: `calc(var(--row) * ${ratio})` }),
              aspectRatio: `${width} / ${height}`,
            }}
            data-reveal
          >
            <Link
              to={`/art?piece=${piece.slug}`}
              className="painting-link"
              onClick={(event) => {
                const opensElsewhere =
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey;
                if (opensElsewhere) return;
                event.preventDefault();
                setFocus({ index, slot: event.currentTarget });
              }}
              onKeyDown={(event) => {
                if (event.key !== " ") return;
                event.preventDefault();
                setFocus({ index, slot: event.currentTarget });
              }}
            >
              <img
                ref={markLoaded}
                src={piece.coverImage}
                alt={piece.title}
                width={width}
                height={height}
                loading={index < eager ? "eager" : "lazy"}
                decoding="async"
                data-fade
                onLoad={(event) => {
                  event.currentTarget.dataset.loaded = "";
                }}
              />
              {piece.loop ? <LoopVideo src={piece.loop} /> : null}
            </Link>
          </li>
        );
      })}
      {focus ? (
        <PaintingFocus
          key={pieces[focus.index].slug}
          piece={pieces[focus.index]}
          width={sizes[focus.index][0]}
          height={sizes[focus.index][1]}
          slot={focus.slot}
          onClosed={() => setFocus(null)}
        />
      ) : null}
    </ul>
  );
}
