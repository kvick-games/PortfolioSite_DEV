import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import MagneticCursor from "./MagneticCursor";
import VideoGlyph, { VideoSeek } from "./VideoGlyph";

export interface MenuView {
  id: string;
  label: string;
  caption: string;
  poster: string;
  video?: string;
  alt: string;
}

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A tabbed media viewer: the tabs mirror the menu tabs of the work being shown.
 * Video tabs autoplay muted unless the visitor prefers reduced motion.
 */
export default function MenuViewer({
  views,
  label,
  credit,
  children,
}: {
  views: MenuView[];
  label: string;
  credit?: string;
  children?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(reducedMotion);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const tablist = useRef<HTMLDivElement>(null);
  const snapped = useRef<number | null>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  const video = useRef<HTMLVideoElement>(null);
  const view = views[active];

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (paused) element.pause();
    else element.play().catch(() => setPaused(true));
  }, [active, paused]);

  const select = (index: number) => {
    const next = (index + views.length) % views.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: views.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key]);
  };

  return (
    <div className="menu-viewer">
      <div className="menu-viewer-stage">
        <div
          className="menu-viewer-screen"
          role="tabpanel"
          id={`${label}-panel`}
          aria-labelledby={`${label}-tab-${view.id}`}
          data-paused={view.video && paused ? "" : undefined}
        >
          {view.video ? (
            <>
              {/* A click on the footage toggles it too; the button is the
                  keyboard and screen reader route. */}
              <video
                key={view.id}
                ref={video}
                src={view.video}
                poster={view.poster}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={view.alt}
                onClick={() => setPaused((value) => !value)}
              />
              <button
                type="button"
                className="menu-viewer-toggle"
                aria-label={paused ? "Play footage" : "Pause footage"}
                onClick={() => setPaused((value) => !value)}
              >
                <VideoGlyph playing={!paused} />
              </button>
              <VideoSeek
                key={`${view.id}-seek`}
                video={video}
                label={`${view.label} footage position`}
                className="menu-viewer-seek"
              />
            </>
          ) : (
            <img key={view.id} src={view.poster} alt={view.alt} />
          )}
        </div>
        {credit ? <p className="menu-viewer-credit">{credit}</p> : null}
      </div>
      <div className="menu-viewer-side">
        {children}
        <div
          ref={tablist}
          className="menu-viewer-tabs"
          role="tablist"
          aria-label={`${label} menus`}
          onKeyDown={onKeyDown}
        >
          {views.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              id={`${label}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-controls={`${label}-panel`}
              tabIndex={index === active ? 0 : -1}
              onClick={(event) => {
                // With the magnetic cursor, a click selects the tab it has
                // snapped to, which can sit a few pixels past the pointer.
                const target =
                  event.detail > 0 && snapped.current !== null
                    ? snapped.current
                    : index;
                setActive(target);
                if (target !== index) tabs.current[target]?.focus();
              }}
            >
              {item.label}
            </button>
          ))}
          <MagneticCursor
            listRef={tablist}
            tabsRef={tabs}
            snappedRef={snapped}
            activeRef={activeRef}
            onSelect={setActive}
          />
        </div>
        <p className="menu-viewer-caption" aria-live="polite">
          {view.caption}
        </p>
      </div>
    </div>
  );
}
