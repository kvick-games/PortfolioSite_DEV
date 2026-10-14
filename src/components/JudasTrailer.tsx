import { useCallback, useEffect, useRef, useState } from "react";
import "./JudasTrailer.css";
import VideoGlyph from "./VideoGlyph";
import LayeredArt, { type ArtLayer } from "./LayeredArt";
import { markLoaded } from "./PaintingRows";

/*
 * The Judas reveal trailer as a lite YouTube facade. Until the visitor presses
 * play there is only a still image: no YouTube script, frame or connection.
 * Pressing play blinks the still shut, as a first-person game opens and closes
 * its eyes, and the trailer opens out of the blink.
 *
 * The official Ghost Story upload is age-restricted and will not play
 * embedded, so the player uses IGN's upload of the same trailer.
 */
const VIDEO_ID = "oeHHsw_Jb2E";
const EMBED_ORIGIN = "https://www.youtube-nocookie.com";

// Keep in step with the keyframe durations in JudasTrailer.css.
const CLOSE_MS = 320;
const OPEN_MS = 640;
const SHUT_MS = 280;
const REOPEN_MS = 460;
const AUTOPLAY_WAIT_MS = 1200;
const MAX_WAIT_MS = 2400;

type Phase = "still" | "closing" | "opening" | "open" | "shutting";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function JudasTrailer({
  poster,
  layers,
  alt,
  className = "",
}: {
  poster: string;
  /** The poster split for scroll parallax; `poster` is used without it. */
  layers?: ArtLayer[];
  alt: string;
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>("still");
  const [loaded, setLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const [closed, setClosed] = useState(false); // the blink has finished shutting
  const figure = useRef<HTMLElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = () => {
    if (phase !== "still") return;
    setLoaded(false);
    setStarted(false);
    setClosed(false);
    if (reducedMotion()) {
      setPhase("open");
      return;
    }
    setPhase("closing");
    later(() => setClosed(true), CLOSE_MS);
  };

  // Listen to the player through YouTube's postMessage protocol (no API
  // script) so the eye opens on the trailer itself, not a loading spinner.
  useEffect(() => {
    if (!loaded) return;
    const target = frame.current?.contentWindow;
    if (!target) return;
    let heard = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== target || typeof event.data !== "string") return;
      heard = true;
      try {
        const data = JSON.parse(event.data);
        const state = data.event === "onStateChange" ? data.info : data.info?.playerState;
        if (state === 1) setStarted(true);
      } catch {
        // Not a player message.
      }
    };
    window.addEventListener("message", onMessage);
    let tries = 0;
    let handshake = 0;
    const listen = () => {
      if (heard || tries++ > 12) return;
      target.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), EMBED_ORIGIN);
      handshake = window.setTimeout(listen, 250);
    };
    listen();
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(handshake);
    };
  }, [loaded]);

  // Open the eye once the blink has shut and the trailer is playing. If it
  // does not start (a phone may block autoplay), open on the player anyway.
  useEffect(() => {
    if (phase !== "closing" || !closed) return;
    if (started) {
      setPhase("opening");
      return;
    }
    const wait = window.setTimeout(() => setPhase("opening"), loaded ? AUTOPLAY_WAIT_MS : MAX_WAIT_MS);
    return () => clearTimeout(wait);
  }, [phase, closed, loaded, started]);

  useEffect(() => {
    if (phase === "opening") {
      closeButton.current?.focus({ preventScroll: true });
      const done = window.setTimeout(() => setPhase("open"), OPEN_MS);
      return () => clearTimeout(done);
    }
    if (phase === "open" && !figure.current?.contains(document.activeElement))
      closeButton.current?.focus({ preventScroll: true });
  }, [phase]);

  const close = useCallback(() => {
    const finish = () => {
      setPhase("still");
      requestAnimationFrame(() => playButton.current?.focus({ preventScroll: true }));
    };
    if (reducedMotion()) {
      finish();
      return;
    }
    setPhase("shutting");
    later(finish, SHUT_MS + REOPEN_MS);
  }, []);

  const playing = phase === "opening" || phase === "open";

  // Esc returns to the still (when focus is on the page, not inside the player).
  useEffect(() => {
    if (!playing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [playing, close]);

  // Pause the trailer when it is scrolled out of view.
  useEffect(() => {
    const element = figure.current;
    if (!playing || !element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) return;
      frame.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
        EMBED_ORIGIN,
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [playing]);

  const mounted = phase !== "still";
  const src =
    `${EMBED_ORIGIN}/embed/${VIDEO_ID}?autoplay=1&playsinline=1&rel=0&enablejsapi=1` +
    `&origin=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.origin)}`;

  return (
    <figure className={`judas-trailer ${className}`.trim()} data-phase={phase} data-reveal ref={figure}>
      <button
        type="button"
        className="judas-trailer-still"
        ref={playButton}
        onClick={play}
        aria-label="Play the Judas reveal trailer"
        hidden={playing}
      >
        {layers ? (
          <LayeredArt layers={layers} axis="x" width={1800} height={1013} alt={alt} />
        ) : (
          <img
            ref={markLoaded}
            src={poster}
            alt={alt}
            loading="lazy"
            data-fade
            onLoad={(event) => {
              event.currentTarget.dataset.loaded = "";
            }}
          />
        )}
        <VideoGlyph className="judas-trailer-play" />
      </button>
      {mounted && (
        <div className="judas-trailer-screen">
          <iframe
            ref={frame}
            src={src}
            title="Judas reveal trailer"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
          />
        </div>
      )}
      {mounted && (
        <button
          type="button"
          className="judas-trailer-close text-button"
          ref={closeButton}
          onClick={close}
          disabled={!playing}
          tabIndex={playing ? 0 : -1}
        >
          Close<span className="sr-only"> the trailer</span>
        </button>
      )}
    </figure>
  );
}
