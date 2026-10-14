import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import "./rune-text.css";

/**
 * Elder Futhark runes as stroke paths on a 10 × 16 box (the stave runs from
 * 1 to 15). Drawn rather than set in a font, so every visitor sees them.
 */
const RUNES = {
  fehu: "M3 1V15M3 6L8 2M3 10L8 6",
  uruz: "M2.5 15V1L7.5 5V15",
  ansuz: "M3 1V15M3 2L8 6M3 6L8 10",
  raido: "M2.5 15V1L7.5 4.5L2.5 8L7.5 15",
  kaunan: "M7 3L3 8L7 13",
  gebo: "M2 2L8 14M8 2L2 14",
  wunjo: "M3 15V1L7.5 4.5L3 8",
  hagalaz: "M2.5 1V15M7.5 1V15M2.5 6L7.5 10",
  naudiz: "M5 1V15M2 6L8 10",
  isa: "M5 1V15",
  jera: "M4.5 3L2 6L4.5 9M5.5 7L8 10L5.5 13",
  perth: "M3 1V15M3 1L7.5 4.5M3 15L7.5 11.5",
  algiz: "M5 1V15M5 6L1.5 2M5 6L8.5 2",
  sowilo: "M7 1.5L3 6L7 10L3 14.5",
  tiwaz: "M5 1V15M1.5 5L5 1L8.5 5",
  berkanan: "M3 1V15M3 1L7.5 4.5L3 8L7.5 11.5L3 15",
  ehwaz: "M2 15V1L5 5L8 1V15",
  mannaz: "M2 15V1L8 7M8 15V1L2 7",
  laguz: "M3.5 1V15M3.5 1L7.5 5",
  othala: "M5 1L8.5 6L2 14M5 1L1.5 6L8 14",
  dagaz: "M2 2V14M8 2V14M2 2L8 14M8 2L2 14",
};
type Rune = keyof typeof RUNES;

/** Each letter's rune, by sound where Old Norse has one. */
const LETTER: Record<string, Rune> = {
  a: "ansuz", b: "berkanan", c: "kaunan", d: "dagaz", e: "ehwaz", f: "fehu",
  g: "gebo", h: "hagalaz", i: "isa", j: "jera", k: "kaunan", l: "laguz",
  m: "mannaz", n: "naudiz", o: "othala", p: "perth", q: "kaunan", r: "raido",
  s: "sowilo", t: "tiwaz", u: "uruz", v: "wunjo", w: "wunjo", x: "algiz",
  y: "jera", z: "algiz",
};
const ALL = Object.keys(RUNES) as Rune[];

/** How long the translation takes to spread across the line, in ms. */
const SPREAD = 1400;
/** How long the runes rest before the first letter turns, in ms. */
const HOLD = 350;

const runeFor = (char: string, index: number): Rune | null => {
  const lower = char.toLowerCase();
  if (LETTER[lower]) return LETTER[lower];
  // Digits get a rune too, picked by position so it stays put between renders.
  if (/\d/.test(char)) return ALL[(index * 7 + Number(char)) % ALL.length];
  return null;
};

// A stable shuffle, so a line translates in the same scattered order each time.
const delayFor = (index: number) => {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return HOLD + Math.round((x - Math.floor(x)) * SPREAD);
};

/**
 * Text that arrives as Norse runes and translates into English: each letter's
 * rune fades out where it stands as the letter fades in under it, in a
 * scattered order. Every glyph keeps its place (the runes sit over the
 * letters' own boxes), so nothing moves. Starts the first time it is seen,
 * and again whenever the text changes. Reduced motion shows the English.
 */
export default function RuneText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  const [still] = useState(
    () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen]);

  const words = useMemo(() => {
    let index = 0;
    return text.split(/(\s+)/).map((part) => {
      if (/^\s+$/.test(part) || !part) return part;
      return [...part].map((char) => ({ char, rune: runeFor(char, index), index: index++ }));
    });
  }, [text]);

  if (still) return <span className={className}>{text}</span>;

  return (
    <span
      ref={ref}
      className={`rune-text${seen ? " is-translating" : ""}${className ? ` ${className}` : ""}`}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) =>
          typeof word === "string" ? (
            word
          ) : (
            <span key={w} className="rune-word">
              {word.map(({ char, rune, index }) => (
                <span
                  key={index}
                  className="rune-char"
                  style={{ "--d": `${delayFor(index)}ms` } as CSSProperties}
                >
                  <span className="rune-latin">{char}</span>
                  {rune ? (
                    <svg className="rune-glyph" viewBox="0 0 10 16" aria-hidden="true">
                      <path d={RUNES[rune]} />
                    </svg>
                  ) : null}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
