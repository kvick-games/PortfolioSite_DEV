import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  NavigationType,
  Router,
  UNSAFE_createBrowserHistory as createBrowserHistory,
} from "react-router-dom";

let running = 0;

/** True while a route change is cross-fading, so new content can arrive already revealed. */
export function viewTransitionRunning() {
  return running > 0;
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
 * transitions"), and the scroll reset in App happens under the fade. A jump to
 * another section of the same page cross-fades the same way, instead of
 * cutting. Browsers without the API update instantly, as before.
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
      const sameView =
        location.pathname === current.pathname &&
        location.search === current.search &&
        location.hash === current.hash;
      current = location;
      const update = () => setState({ action, location });
      // Clicking the link for where you already are still goes there with a fade.
      if ((sameView && action !== NavigationType.Push) || !document.startViewTransition || document.hidden) {
        update();
        return;
      }
      running += 1;
      const transition = document.startViewTransition(async () => {
        flushSync(update);
        // Previous/Next on a painting page morphs one painting into the next.
        const target = document.querySelector<HTMLImageElement>("img[data-shared-painting]");
        if (target) await settle(target);
      });
      transition.ready.catch(() => undefined);
      const done = () => {
        running -= 1;
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
