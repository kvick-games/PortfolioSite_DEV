import { useEffect, useRef, type RefObject } from "react";
import "./magnetic-cursor.css";

/**
 * A cursor for a tab list that is pulled toward the nearest tab and snaps onto
 * it, after the free-moving skill tree cursor Michael prototyped for God of War.
 * It is a homage written for this page, not the game's code.
 *
 * Mouse: only for fine pointers that can hover. A gamepad works too, when one
 * is connected and the list is on screen: the left stick moves the cursor, the
 * d-pad steps through tabs and A selects. Keyboard and touch are untouched.
 */

type Rect = { x: number; y: number; w: number; h: number };

const FIELD = 22; // px of free space around the tabs where the pull begins
const HYSTERESIS = 7; // px a snapped tab holds the cursor past its own edge
const STIFFNESS = 520;
const DAMPING = 2 * Math.sqrt(STIFFNESS) * 0.7; // a little overshoot
const SEED = 14; // the free cursor's size, which the frame grows from
const PAD_SPEED = 760; // px per second at full stick

const contains = (r: Rect, x: number, y: number, pad = 0) =>
  x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;

/** Sticky mapping: flat near the centre, steep near the edges. */
const stick = (u: number, strength: number) =>
  u * (1 - strength) + Math.sign(u) * Math.abs(u) ** 3 * strength;

export default function MagneticCursor({
  listRef,
  tabsRef,
  snappedRef,
  activeRef,
  onSelect,
}: {
  listRef: RefObject<HTMLElement | null>;
  tabsRef: RefObject<Array<HTMLButtonElement | null>>;
  snappedRef: { current: number | null };
  activeRef: RefObject<number>;
  onSelect: (index: number) => void;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const list = listRef.current;
    const root = rootRef.current;
    const frame = frameRef.current;
    const dot = dotRef.current;
    if (!list || !root || !frame || !dot) return;

    const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let rects: Rect[] = [];
    let mode: "mouse" | "pad" | null = null;
    let clientX = 0;
    let clientY = 0;
    let pad = { x: 0, y: 0 }; // gamepad cursor, relative to the list
    let reticle = { x: 0, y: 0 };
    let snapped: number | null = null;
    let raf = 0;
    let last = 0;
    let visible = false;
    let padConnected = false;
    let padRaf = 0;
    let padPrev: boolean[] = [];

    // Frame springs: position, size and a "lock-on" inflation.
    const f = { x: 0, y: 0, w: SEED, h: SEED, i: 0 };
    const v = { x: 0, y: 0, w: 0, h: 0, i: 0 };

    const measure = () => {
      rects = (tabsRef.current ?? []).map((tab) =>
        tab
          ? { x: tab.offsetLeft, y: tab.offsetTop, w: tab.offsetWidth, h: tab.offsetHeight }
          : { x: 0, y: 0, w: 0, h: 0 },
      );
    };

    const setSnapped = (next: number | null) => {
      if (next === snapped) return;
      const tabs = tabsRef.current ?? [];
      if (snapped !== null) tabs[snapped]?.removeAttribute("data-snapped");
      if (next !== null) {
        tabs[next]?.setAttribute("data-snapped", "");
        // A snap onto a new tab lands slightly large, then locks in.
        if (!motionQuery.matches) {
          v.i += snapped === null ? 0 : 60;
          f.i = Math.max(f.i, snapped === null ? 0 : 5);
        }
      }
      snapped = next;
      snappedRef.current = next;
      root.dataset.state = next === null ? (mode ? "free" : "off") : "snapped";
    };

    const nearest = (x: number, y: number) => {
      let best = -1;
      let bestDist = Infinity;
      let bx = x;
      let by = y;
      rects.forEach((r, index) => {
        const cx = Math.min(Math.max(x, r.x), r.x + r.w);
        const cy = Math.min(Math.max(y, r.y), r.y + r.h);
        const d = Math.hypot(x - cx, y - cy);
        if (d < bestDist) {
          bestDist = d;
          best = index;
          bx = cx;
          by = cy;
        }
      });
      return { index: best, dist: bestDist, x: bx, y: by };
    };

    const pointer = (): { x: number; y: number } => {
      if (mode === "pad") return pad;
      const box = list.getBoundingClientRect();
      return { x: clientX - box.left, y: clientY - box.top };
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      const still = motionQuery.matches;
      const p = pointer();

      // Which tab holds the cursor? The current one keeps it a little longer.
      let next: number | null = null;
      if (mode) {
        if (snapped !== null && rects[snapped] && contains(rects[snapped], p.x, p.y, HYSTERESIS)) {
          next = snapped;
        } else {
          const hit = rects.findIndex((r) => contains(r, p.x, p.y));
          next = hit === -1 ? null : hit;
        }
      }
      setSnapped(next);

      // Where the reticle wants to be.
      let tx = p.x;
      let ty = p.y;
      if (snapped !== null) {
        const r = rects[snapped];
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const tall = r.h > r.w;
        const ux = Math.max(-1, Math.min(1, (p.x - cx) / (r.w / 2)));
        const uy = Math.max(-1, Math.min(1, (p.y - cy) / (r.h / 2)));
        tx = cx + stick(ux, tall ? 0.85 : 0.35) * (r.w / 2 - 6);
        ty = cy + stick(uy, tall ? 0.35 : 0.85) * (r.h / 2 - 6);
      } else if (mode) {
        const n = nearest(p.x, p.y);
        if (n.index !== -1 && n.dist < FIELD) {
          const pull = 0.55 * (1 - n.dist / FIELD);
          tx += (n.x - p.x) * pull;
          ty += (n.y - p.y) * pull;
        }
      }
      if (still) {
        reticle = { x: tx, y: ty };
      } else {
        const k = 1 - Math.exp(-dt * 32);
        reticle.x += (tx - reticle.x) * k;
        reticle.y += (ty - reticle.y) * k;
      }

      // Where the frame wants to be: on the tab, leaning a touch toward the
      // pointer as if held by the magnet, or folded into the reticle.
      let target: Rect = { x: reticle.x - SEED / 2, y: reticle.y - SEED / 2, w: SEED, h: SEED };
      if (snapped !== null) {
        const r = rects[snapped];
        const lean = (d: number, k: number, max: number) =>
          Math.max(-max, Math.min(max, d * k));
        target = {
          ...r,
          x: r.x + lean(p.x - (r.x + r.w / 2), 0.03, 4),
          y: r.y + lean(p.y - (r.y + r.h / 2), 0.1, 3),
        };
      }
      const onSelected =
        snapped !== null &&
        tabsRef.current?.[snapped]?.getAttribute("aria-selected") === "true";
      if (onSelected !== root.hasAttribute("data-on-selected")) {
        root.toggleAttribute("data-on-selected", onSelected);
      }
      let moving = false;
      if (still) {
        f.x = target.x;
        f.y = target.y;
        f.w = target.w;
        f.h = target.h;
        f.i = 0;
      } else {
        const goals = { x: target.x, y: target.y, w: target.w, h: target.h, i: 0 };
        (Object.keys(goals) as Array<keyof typeof goals>).forEach((key) => {
          const a = STIFFNESS * (goals[key] - f[key]) - DAMPING * v[key];
          v[key] += a * dt;
          f[key] += v[key] * dt;
          if (Math.abs(goals[key] - f[key]) > 0.3 || Math.abs(v[key]) > 3) moving = true;
        });
        if (Math.abs(tx - reticle.x) > 0.3 || Math.abs(ty - reticle.y) > 0.3) moving = true;
      }

      const grow = f.i;
      frame.style.transform = `translate(${f.x - grow}px, ${f.y - grow}px)`;
      frame.style.width = `${Math.max(0, f.w + grow * 2)}px`;
      frame.style.height = `${Math.max(0, f.h + grow * 2)}px`;
      dot.style.transform = `translate(${reticle.x}px, ${reticle.y}px)`;

      // Rest when nothing is in flight; the next move or click wakes it.
      if (moving) raf = requestAnimationFrame(step);
      else raf = 0;
    };

    const run = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(step);
      }
    };

    const place = (x: number, y: number) => {
      // Start from wherever the cursor came in, with nothing in flight.
      reticle = { x, y };
      Object.assign(f, { x: x - SEED / 2, y: y - SEED / 2, w: SEED, h: SEED, i: 0 });
      Object.assign(v, { x: 0, y: 0, w: 0, h: 0, i: 0 });
    };

    const enter = (mode_: "mouse" | "pad") => {
      measure();
      const wasOff = mode === null;
      mode = mode_;
      if (wasOff) {
        const p = pointer();
        place(p.x, p.y);
      }
      root.dataset.mode = mode_;
      if (snapped === null) root.dataset.state = "free";
      run();
    };

    const leave = () => {
      mode = null;
      setSnapped(null);
      root.dataset.state = "off";
      run();
    };

    // Mouse ------------------------------------------------------------------
    const fineOn = () => fineQuery.matches;
    const syncFine = () => {
      if (fineOn()) list.setAttribute("data-magnet", "");
      else {
        list.removeAttribute("data-magnet");
        if (mode === "mouse") leave();
      }
    };
    syncFine();

    const isMouse = (event: PointerEvent) =>
      fineOn() && (event.pointerType === "mouse" || event.pointerType === "pen");

    const onMove = (event: PointerEvent) => {
      if (!isMouse(event)) return;
      clientX = event.clientX;
      clientY = event.clientY;
      if (mode !== "mouse") {
        mode = null;
        enter("mouse");
      } else run();
    };
    const onLeave = (event: PointerEvent) => {
      if (mode === "mouse" && isMouse(event)) leave();
    };
    const onDown = (event: PointerEvent) => {
      if (mode !== "mouse" || !isMouse(event) || snapped === null) return;
      if (!motionQuery.matches) v.i -= 90; // a small press, then back
      run();
    };
    const onScroll = () => {
      if (mode === "mouse") run();
    };

    // A selection changes the frame's look, so let it catch up.
    const wake = () => {
      if (mode) run();
    };

    list.addEventListener("pointermove", onMove);
    list.addEventListener("click", wake);
    list.addEventListener("keydown", wake);
    list.addEventListener("pointerleave", onLeave);
    list.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    fineQuery.addEventListener("change", syncFine);

    const resize = new ResizeObserver(() => {
      measure();
      if (mode) run();
    });
    resize.observe(list);

    // Gamepad ----------------------------------------------------------------
    const padStep = () => {
      padRaf = 0;
      if (!padConnected || !visible) return;
      const gp = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      if (!gp) return;
      const buttons = gp.buttons.map((b) => b.pressed);
      const pressed = (i: number) => buttons[i] && !padPrev[i];
      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      const mag = Math.hypot(ax, ay);
      const stickOn = mag > 0.2;
      const dpad = [12, 13, 14, 15].some(pressed);
      const select = pressed(0);

      if (stickOn || dpad || select) {
        if (mode !== "pad") {
          measure();
          const start = rects[snapped ?? activeRef.current ?? 0];
          if (start) pad = { x: start.x + start.w / 2, y: start.y + start.h / 2 };
          mode = null;
          enter("pad");
        }
      }

      if (mode === "pad") {
        const dt = 1 / 60;
        if (stickOn) {
          // Magnetism as friction: the cursor slows as it nears a tab's centre.
          let slow = 1;
          if (snapped !== null) {
            const r = rects[snapped];
            const d = Math.hypot(pad.x - (r.x + r.w / 2), pad.y - (r.y + r.h / 2));
            slow = 0.4 + 0.6 * Math.min(1, d / (Math.min(r.w, r.h) * 0.6));
          }
          const speed = PAD_SPEED * ((mag - 0.2) / 0.8) ** 1.4 * slow;
          pad.x += (ax / mag) * speed * dt;
          pad.y += (ay / mag) * speed * dt;
        } else if (snapped !== null) {
          // Let go of the stick and it settles onto the tab.
          const r = rects[snapped];
          pad.x += (r.x + r.w / 2 - pad.x) * 0.25;
          pad.y += (r.y + r.h / 2 - pad.y) * 0.25;
        }
        const box = list.getBoundingClientRect();
        pad.x = Math.min(Math.max(pad.x, -FIELD), box.width + FIELD);
        pad.y = Math.min(Math.max(pad.y, -FIELD), box.height + FIELD);

        if (dpad && rects.length) {
          const from = snapped ?? activeRef.current ?? 0;
          const dir = pressed(12) || pressed(14) ? -1 : 1;
          const to = (from + dir + rects.length) % rects.length;
          pad = { x: rects[to].x + rects[to].w / 2, y: rects[to].y + rects[to].h / 2 };
        }
        if (select && snapped !== null) {
          selectRef.current(snapped);
          if (!motionQuery.matches) v.i -= 90;
        }
        run();
      }
      padPrev = buttons;
      padRaf = requestAnimationFrame(padStep);
    };
    const padSync = () => {
      padConnected = Array.from(navigator.getGamepads?.() ?? []).some(Boolean);
      if (!padConnected && mode === "pad") leave();
      if (padConnected && visible && !padRaf) padRaf = requestAnimationFrame(padStep);
    };
    window.addEventListener("gamepadconnected", padSync);
    window.addEventListener("gamepaddisconnected", padSync);

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && mode === "pad") leave();
      padSync();
    });
    seen.observe(list);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(padRaf);
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("click", wake);
      list.removeEventListener("keydown", wake);
      list.removeEventListener("pointerleave", onLeave);
      list.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("gamepadconnected", padSync);
      window.removeEventListener("gamepaddisconnected", padSync);
      fineQuery.removeEventListener("change", syncFine);
      resize.disconnect();
      seen.disconnect();
      list.removeAttribute("data-magnet");
      (tabsRef.current ?? []).forEach((tab) => tab?.removeAttribute("data-snapped"));
      snappedRef.current = null;
    };
  }, [listRef, tabsRef, snappedRef, activeRef]);

  return (
    <span ref={rootRef} className="magnet" data-state="off" aria-hidden="true">
      <span ref={frameRef} className="magnet-frame">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span ref={dotRef} className="magnet-dot" />
    </span>
  );
}
