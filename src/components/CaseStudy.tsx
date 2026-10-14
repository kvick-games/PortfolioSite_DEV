import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import LoopVideo from "./LoopVideo";
import { markLoaded } from "./PaintingRows";
import VideoGlyph, { VideoSeek } from "./VideoGlyph";
import "./case-study.css";

/*
 * Building blocks for the project focus pages (/portfolio?project=…).
 * The page itself (PortfolioPage) sets the head, the hero and the pager;
 * each project's Article composes its body from these.
 *
 * Motion rule: nothing travels. Blocks fade in place (App's [data-reveal]
 * observer), images fade in once loaded (`img[data-fade]`), and footage
 * plays only while it is on screen.
 */

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface CaseImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** An image that fades in once it has loaded; a cached one shows at once. */
export function FadeImage({
  src,
  alt,
  width,
  height,
  eager = false,
}: CaseImage & { eager?: boolean }) {
  return (
    <img
      ref={markLoaded}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      data-fade
      onLoad={(event) => {
        event.currentTarget.dataset.loaded = "";
      }}
    />
  );
}

/* Head and hero ------------------------------------------------------------ */

/** Title and meta on the left, the statement on the right, as on the home page. */
export function CaseHead({
  title,
  details,
  statement,
}: {
  title: string;
  details: ReactNode[];
  statement: ReactNode;
}) {
  return (
    <header className="chapter-head case-head">
      <h1 className="chapter-title case-title" data-reveal>
        {title}
      </h1>
      <p className="meta" data-reveal>
        {details.map((line, index) => (
          <span className="case-meta-line" key={index}>
            {line}
          </span>
        ))}
      </p>
      <p className="statement" data-reveal>
        {statement}
      </p>
    </header>
  );
}

/**
 * The project's key image, full width. `bleed` runs it edge to edge with its
 * top and bottom dissolving into the page, like the home page's God of War
 * cover. `loop` lays a muted loop over the image (its first frame), playing
 * only while on screen.
 */
export function CaseHero({
  image,
  bleed = false,
  loop,
  caption,
}: {
  image: CaseImage;
  bleed?: boolean;
  loop?: string;
  caption?: ReactNode;
}) {
  return (
    <figure
      className={bleed ? "case-hero case-hero--bleed" : "case-hero"}
      data-reveal
    >
      <div
        className="case-hero-media"
        style={{ "--ratio": image.width / image.height } as CSSProperties}
      >
        <FadeImage {...image} eager />
        {loop ? <LoopVideo src={loop} /> : null}
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/** A hero built from something other than a still (a player, a trailer). */
export function CaseHeroFrame({
  caption,
  children,
}: {
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="case-hero case-hero--frame">
      {children}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/* Body --------------------------------------------------------------------- */

/** The article body: a 12-column grid that sections and media sit on. */
export function CaseBody({ children }: { children: ReactNode }) {
  return <div className="case-body">{children}</div>;
}

/**
 * A section: its title (and an optional aside, such as a list) on the left,
 * the text in a comfortable measure on the right, then any media at full
 * width below.
 */
export function CaseSection({
  title,
  aside,
  media,
  children,
}: {
  title?: string;
  aside?: ReactNode;
  media?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="case-section">
      {title || aside ? (
        <div className="case-section-side">
          {title ? (
            <h2 className="case-section-title" data-reveal>
              {title}
            </h2>
          ) : null}
          {aside}
        </div>
      ) : null}
      {children ? (
        <div className="case-section-text" data-reveal>
          {children}
        </div>
      ) : null}
      {media}
    </section>
  );
}

/** Text on the left, one figure on the right; for material that sits beside its copy. */
export function CaseSplit({
  title,
  figure,
  children,
}: {
  title?: string;
  figure: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="case-split">
      <div className="case-split-text" data-reveal>
        {title ? <h2 className="case-section-title">{title}</h2> : null}
        {children}
      </div>
      {figure}
    </section>
  );
}

/** A short labelled list, set small and quiet. */
export function CaseList({
  label,
  items,
}: {
  label: string;
  items: ReactNode[];
}) {
  return (
    <div className="case-aside" data-reveal>
      <h3 className="case-aside-title">{label}</h3>
      <ul className="case-list">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** Short design notes, two to a row beside the section title. */
export function CaseNotes({
  notes,
}: {
  notes: Array<{ title: string; body: ReactNode }>;
}) {
  return (
    <div className="case-notes">
      {notes.map((note) => (
        <div key={note.title} data-reveal>
          <h3>{note.title}</h3>
          <p>{note.body}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * One image. `measure` aligns it with the text column; `natural` shows it no
 * larger than its own pixels (small interface captures stay sharp).
 */
export function CaseFigure({
  image,
  size = "full",
  caption,
}: {
  image: CaseImage;
  size?: "full" | "measure" | "natural";
  caption?: ReactNode;
}) {
  return (
    <figure className={`case-figure case-figure--${size}`} data-reveal>
      <FadeImage {...image} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export interface GalleryItem extends CaseImage {
  /** Columns of 12 on desktop (default 6). */
  span?: number;
  /** Columns of 12 on phones (default 12). */
  spanSmall?: number;
  /** Crop to this ratio instead of the image's own. */
  ratio?: number;
}

/**
 * A grid of images. As on the home page, the one under the pointer keeps its
 * colour and the others turn grey (fine pointers only).
 */
export function CaseGallery({
  items,
  caption,
}: {
  items: GalleryItem[];
  caption?: ReactNode;
}) {
  return (
    <div className="case-gallery-block">
      <div className="case-gallery">
        {items.map((item) => (
          <figure
            key={item.src}
            data-reveal
            style={
              {
                "--span": item.span ?? 6,
                "--span-sm": item.spanSmall ?? 12,
                "--ratio": item.ratio ?? item.width / item.height,
              } as CSSProperties
            }
          >
            <FadeImage {...item} />
          </figure>
        ))}
      </div>
      {caption ? (
        <p className="case-caption" data-reveal>
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/* Footage ------------------------------------------------------------------ */

/**
 * Footage with the site's own controls: a play/pause glyph and a scrubber
 * that sit on the frame and stay hidden until the pointer is over them.
 * `ambient` footage is muted and plays by itself while on screen (never
 * under reduced motion); otherwise it waits for a press and plays with sound.
 * The poster is a fading image underneath, and the video fades in over it
 * once it is actually playing.
 */
export function CaseVideo({
  src,
  poster,
  label,
  ambient = false,
  ratio = 16 / 9,
}: {
  src: string;
  poster: CaseImage;
  label: string;
  ambient?: boolean;
  ratio?: number;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const wanted = useRef(ambient);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (reducedMotion()) wanted.current = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (ambient && wanted.current) element.play().catch(() => undefined);
        } else if (!element.paused) {
          element.pause();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ambient]);

  const toggle = () => {
    const element = video.current;
    if (!element) return;
    if (element.paused) {
      wanted.current = true;
      element.play().catch(() => undefined);
    } else {
      wanted.current = false;
      element.pause();
    }
  };

  return (
    <div
      className="case-video"
      style={{ "--ratio": ratio } as CSSProperties}
      data-started={started ? "" : undefined}
      data-reveal
    >
      <FadeImage {...poster} />
      {/* A click on the footage toggles it too; the button is the keyboard
          and screen reader route. */}
      <video
        ref={video}
        src={src}
        muted={ambient}
        loop={ambient}
        playsInline
        preload="none"
        aria-label={label}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onPlaying={() => setStarted(true)}
      />
      <div className="case-video-controls">
        <button
          type="button"
          className="case-video-toggle"
          aria-label={playing ? `Pause ${label}` : `Play ${label}`}
          onClick={toggle}
        >
          <VideoGlyph playing={playing} />
        </button>
        <VideoSeek video={video} label={`${label} position`} />
      </div>
    </div>
  );
}

/**
 * A YouTube video behind a still: nothing from YouTube loads until the
 * visitor presses play, then the player fades in over the still.
 */
export function CaseYouTube({
  id,
  title,
  poster,
}: {
  id: string;
  title: string;
  poster: CaseImage;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="case-embed" data-reveal>
      <button
        type="button"
        className="case-embed-still"
        aria-label={`Play ${title}`}
        onClick={() => setOpen(true)}
        disabled={open}
      >
        <FadeImage {...poster} />
        <VideoGlyph />
      </button>
      {open ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          data-loaded={loaded ? "" : undefined}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
    </div>
  );
}
