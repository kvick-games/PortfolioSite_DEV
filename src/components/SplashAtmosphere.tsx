import { useEffect, useRef, useState } from "react";

/** Flakes on screen at once. */
const COUNT = 220;
/** Seconds a flake lives; it fades in and out over its life, so none pop. */
const LIFE = [7, 14] as const;

const FOG_VS = `#version 300 es
in vec2 p;
out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

// Low fog: domain-warped fbm drifting with the wind, held to a band around
// the waterline and the boat, thinnest at the top of the frame.
const FOG_FS = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform float t;
uniform float aspect;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 q = vec2(uv.x * aspect, uv.y) * 1.6;
  vec2 drift = vec2(t * 0.018, 0.0);
  vec2 warp = vec2(fbm(q * 0.7 + drift * 0.6 + 3.1), fbm(q * 0.7 - drift * 0.4 + 9.2));
  float n = fbm(q + warp * 1.4 - drift);
  // uv.y is 0 at the bottom: densest just above the water, around the hull.
  float band = smoothstep(0.05, 0.3, uv.y) * (1.0 - smoothstep(0.32, 0.62, uv.y));
  float haze = 0.35 * (1.0 - smoothstep(0.0, 0.55, uv.y));
  float a = smoothstep(0.32, 0.8, n) * (band + haze) * 0.5;
  vec3 tint = vec3(0.78, 0.87, 0.92);
  color = vec4(tint * a, a);
}`;

const SNOW_VS = `#version 300 es
in vec4 flake; // x, y (0..1, y down), size px, alpha
uniform vec2 res;
out float alpha;
void main() {
  gl_Position = vec4(flake.x * 2.0 - 1.0, 1.0 - flake.y * 2.0, 0.0, 1.0);
  gl_PointSize = flake.z;
  alpha = flake.w;
}`;

const SNOW_FS = `#version 300 es
precision mediump float;
in float alpha;
out vec4 color;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = alpha * smoothstep(1.0, 0.15, d);
  color = vec4(vec3(0.94, 0.97, 1.0) * a, a);
}`;

// A smooth scalar field; its curl gives the flakes' swirl. Divergence-free,
// so they eddy without bunching up.
const field = (x: number, y: number, t: number) =>
  Math.sin(x * 3.1 + t * 0.21) * Math.cos(y * 2.7 - t * 0.17) +
  0.6 * Math.sin(x * 5.3 - y * 4.1 + t * 0.29) +
  0.35 * Math.cos(x * 9.7 + y * 7.9 - t * 0.37);

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const program = gl.createProgram()!;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  return program;
}

/**
 * Weather over the God of War panel: a low fog drifting over the water and
 * snow eddying on curl noise. It runs only while its panel is open and on
 * screen, and fades in once its first frame is drawn. Reduced motion, or no
 * WebGL2, leaves the still picture alone.
 */
export default function SplashAtmosphere({ playing }: { playing: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [still] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const playingRef = useRef(playing);
  const kick = useRef<() => void>(() => undefined);

  useEffect(() => {
    playingRef.current = playing;
    kick.current();
  }, [playing]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || still) return;
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) return;

    const fog = compile(gl, FOG_VS, FOG_FS);
    const snow = compile(gl, SNOW_VS, SNOW_FS);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const flakesBuffer = gl.createBuffer();
    const data = new Float32Array(COUNT * 4);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const flakes = Array.from({ length: COUNT }, () => {
      const life = rand(LIFE[0], LIFE[1]);
      return { x: Math.random(), y: Math.random(), z: rand(0.25, 1), age: Math.random() * life, life };
    });

    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
    };
    resize();
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);

    let visible = false;
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick.current();
    });
    seen.observe(canvas);

    let frame = 0;
    let last = 0;
    let time = Math.random() * 100;
    let drawn = false;

    const step = (now: number) => {
      frame = 0;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      time += dt;
      const aspect = width / Math.max(height, 1);
      const e = 0.01;

      flakes.forEach((f, i) => {
        f.age += dt;
        if (f.age > f.life) {
          f.age = 0;
          f.life = rand(LIFE[0], LIFE[1]);
          f.x = Math.random();
          f.y = Math.random() * 0.9;
          f.z = rand(0.25, 1);
        }
        const px = f.x * aspect * 1.4;
        const py = f.y * 1.4;
        const s = time * (0.6 + f.z * 0.2);
        const curlX = (field(px, py + e, s) - field(px, py - e, s)) / (2 * e);
        const curlY = -(field(px + e, py, s) - field(px - e, py, s)) / (2 * e);
        // Nearer flakes fall faster; all drift a little with the wind.
        const speed = 0.35 + f.z * 0.65;
        f.x += (0.012 + curlX * 0.009) * speed * dt / aspect;
        f.y += (0.028 + curlY * 0.007) * speed * dt;
        if (f.x > 1.02) f.x -= 1.04;
        if (f.x < -0.02) f.x += 1.04;
        if (f.y > 1.02) f.y -= 1.04;
        const fade = Math.sin((f.age / f.life) * Math.PI);
        data[i * 4] = f.x;
        data[i * 4 + 1] = f.y;
        data[i * 4 + 2] = (1.2 + f.z * f.z * 3.8) * dpr;
        data[i * 4 + 3] = fade * (0.25 + f.z * 0.55);
      });

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(fog);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      const pLoc = gl.getAttribLocation(fog, "p");
      gl.enableVertexAttribArray(pLoc);
      gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(gl.getUniformLocation(fog, "t"), time);
      gl.uniform1f(gl.getUniformLocation(fog, "aspect"), aspect);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(pLoc);

      gl.useProgram(snow);
      gl.bindBuffer(gl.ARRAY_BUFFER, flakesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      const fLoc = gl.getAttribLocation(snow, "flake");
      gl.enableVertexAttribArray(fLoc);
      gl.vertexAttribPointer(fLoc, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, COUNT);
      gl.disableVertexAttribArray(fLoc);

      if (!drawn) {
        drawn = true;
        setReady(true);
      }
      if (playingRef.current && visible && !document.hidden) frame = requestAnimationFrame(step);
      else last = 0;
    };

    kick.current = () => {
      if (!frame && playingRef.current && visible && !document.hidden) frame = requestAnimationFrame(step);
    };
    const onVisibility = () => kick.current();
    document.addEventListener("visibilitychange", onVisibility);
    kick.current();

    return () => {
      cancelAnimationFrame(frame);
      kick.current = () => undefined;
      sizes.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [still]);

  if (still) return null;
  return (
    <canvas
      ref={ref}
      className={ready ? "splash-atmosphere is-ready" : "splash-atmosphere"}
      aria-hidden="true"
    />
  );
}
