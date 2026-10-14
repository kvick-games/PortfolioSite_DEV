import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  Router,
  UNSAFE_createBrowserHistory as createBrowserHistory,
} from "react-router-dom";

/** The name a clicked thumbnail and the painting page's main image share. */
const SHARED_NAME = "painting";

let running = 0;
let lent: HTMLElement[] = [];

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True while a route change is cross-fading, so new content can arrive already revealed. */
export function viewTransitionRunning() {
  return running > 0;
}

/**
 * Lets the next route change grow this element into the painting page's main
 * image (marked `data-shared-painting`). Call it from the click that navigates.
 * The name lives on the element only for that one transition.
 */
export function shareWithNextPage(element: HTMLElement) {
  returnNames();
  if (!document.startViewTransition || reducedMotion()) return;
  // Two elements with the same name would cancel the whole transition.
  document
    .querySelectorAll<HTMLElement>("[data-shared-painting]")
    .forEach((other) => lend(other, "none"));
  lend(element, SHARED_NAME);
}

function lend(element: HTMLElement, name: string) {
  element.style.viewTransitionName = name;
  lent.push(element);
}

function returnNames() {
  lent.forEach((element) => element.style.removeProperty("view-transition-name"));
  lent = [];
}

/** Waits briefly for the destination image to decode, so the morph never lands on a blank frame. */
function settle(image: HTMLImageElement) {
  return Promise.race([
    image.decode().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 300)),
  ]);
}

/**
 * BrowserRouter, except every change of page runs inside a View Transition:
 * the old page fades out as the new one fades in (styles.css, "Page
 * transitions"), and the scroll reset in App happens under the fade. Same-page
 * hash jumps and browsers without the API update instantly, as before.
 */
export default function TransitionRouter({ children }: { children: ReactNode }) {
  const historyRef = useRef<ReturnType<typeof createBrowserHistory>>(null);
  historyRef.current ??= createBrowserHistory({ v5Compat: true });
  const history = historyRef.current;
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  useLayoutEffect(() => {
    let current = history.location;
    return history.listen(({ action, location }) => {
      const samePage =
        location.pathname === current.pathname && location.search === current.search;
      current = location;
      const update = () => setState({ action, location });
      if (samePage || !document.startViewTransition || document.hidden) {
        returnNames();
        update();
        return;
      }
      running += 1;
      const transition = document.startViewTransition(async () => {
        flushSync(update);
        // The old page has been captured; only the new page's image keeps the name.
        returnNames();
        const target = document.querySelector<HTMLImageElement>("img[data-shared-painting]");
        if (target) await settle(target);
      });
      transition.ready.catch(() => undefined);
      const done = () => {
        running -= 1;
        if (!running) returnNames();
      };
      transition.finished.then(done, done);
    });
  }, [history]);

  return (
    <Router
      location={state.location}
      navigationType={state.action}
      navigator={history}
      useTransitions={false}
    >
      {children}
    </Router>
  );
}
