import { useEffect, useRef, useState, type JSX } from "react";

/** All positions are in the plate's frame, measured in frame heights. */
const ASPECT = 1800 / 1013;
/** The canvas runs this far past each side of the frame (share of its width), so
 *  rocks near an edge aren't clipped when the parallax shifts the layer sideways. */
const BLEED = 0.04;
const TAU = Math.PI * 2;
const ORBIT = 90;
/** The fourteen main rocks, largest first (radius in frame heights), spread round the belt. */
const HERO_SIZES = [0.07, 0.056, 0.046, 0.039, 0.033, 0.028, 0.024, 0.021, 0.018, 0.016, 0.014, 0.012, 0.011, 0.01];

const ROCK_VS = `#version 300 es
layout(location = 0) in vec3 p;
layout(location = 1) in vec3 normal;
uniform mat3 rotation;
uniform vec4 body; // centre xyz, radius
uniform vec3 cover; // horizontal/vertical scale, horizontal crop offset
out vec3 local;
out vec3 world;
out vec3 n;
void main() {
  local = p;
  world = rotation * p * body.w + body.xyz;
  n = rotation * normal;
  float depth = 4.0 - world.z;
  // Perspective in the source frame, followed by the image's cover crop.
  gl_Position = vec4(
    cover.x * 8.0 * world.x / ${ASPECT} + cover.z * depth,
    cover.y * 8.0 * world.y,
    (12.0 + 0.1) / (12.0 - 0.1) * depth - 2.0 * 12.0 * 0.1 / (12.0 - 0.1), depth);
}`;

const ROCK_FS = `#version 300 es
precision highp float;
in vec3 local;
in vec3 world;
in vec3 n;
out vec4 color;
uniform float t;
uniform vec2 material; // unique seed, ember coverage
float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), u.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z);
}
void main() {
  vec3 q = local * 13.0 + material.x;
  float grain = noise(q) * 0.65 + noise(q * 2.03) * 0.35;
  vec3 N = normalize(n);
  // Surface gradients add chipped grain without another texture or mesh.
  vec3 dx = dFdx(world), dy = dFdy(world);
  vec3 rx = cross(dy, N), ry = cross(N, dx);
  float det = dot(dx, rx);
  vec3 gradient = (dFdx(grain) * rx + dFdy(grain) * ry) / max(abs(det), 0.00000001);
  N = normalize(N - sign(det) * gradient * 0.0011);
  vec3 V = normalize(vec3(0, 0, 4) - world);
  vec3 blue = vec3(0.247, 0.525, 1.0);
  vec3 orange = vec3(1.0, 0.478, 0.173);
  vec3 cold = normalize(vec3(-0.85, 0.65, -0.4));
  vec3 warm = normalize(vec3(1.0, 0.22, 0.05));
  // Which side of the plate a rock is on: the nebula's blue on the left,
  // the fire's orange on the right. Both light every rock, weighted by side.
  float left = 1.0 - smoothstep(-0.9, 0.7, world.x);
  vec3 albedo = vec3(0.115, 0.108, 0.120) * mix(0.6, 1.35, grain);
  float cd = dot(N, cold), wd = dot(N, warm);
  // Wrapped diffuse, so the light reaches round the rock's shoulders.
  float coldWrap = max((cd + 0.35) / 1.35, 0.0);
  float warmWrap = max((wd + 0.35) / 1.35, 0.0);
  vec3 ambient = mix(vec3(0.30, 0.16, 0.10), vec3(0.10, 0.18, 0.42), left);
  vec3 light = albedo * (ambient
    + blue * coldWrap * coldWrap * (0.6 + left * 3.6)
    + orange * warmWrap * warmWrap * (4.2 - left * 3.4));
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.2);
  light += rim * (blue * smoothstep(-0.2, 0.6, cd) * (0.12 + left * 1.25)
    + orange * smoothstep(-0.2, 0.6, wd) * (1.3 - left * 1.05));
  float spark = noise(local * 15.0 + material.x);
  float ember = (smoothstep(0.77, 0.88, spark) + 0.07 * smoothstep(0.64, 0.83, spark))
    * smoothstep(0.48, 0.7, noise(local * 5.0 + material.x + 19.0));
  float pulse = 0.8 + 0.2 * sin(t * ${TAU / 9} + material.x);
  light += vec3(1.0, 0.682, 0.290) * ember * material.y * pulse;
  // Far rocks sink into the plate: a deep blue on the left, ember dark on the right.
  float haze = 1.0 - smoothstep(-1.0, 0.65, world.z);
  vec3 depthTint = mix(vec3(0.16, 0.06, 0.03), vec3(0.03, 0.08, 0.24), left);
  light = mix(light, depthTint, haze * 0.55);
  float alpha = mix(1.0, 0.6, haze);
  color = vec4(light * alpha, alpha);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const program = gl.createProgram();
  if (!program) return null;
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) { gl.deleteProgram(program); return null; }
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("JudasAsteroids:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      gl.deleteProgram(program);
      return null;
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("JudasAsteroids:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function noise(x: number, y: number, z: number) {
  const hash = (a: number, b: number, c: number) => {
    let n = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  x -= ix; y -= iy; z -= iz;
  x *= x * (3 - 2 * x); y *= y * (3 - 2 * y); z *= z * (3 - 2 * z);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  return mix(
    mix(mix(hash(ix, iy, iz), hash(ix + 1, iy, iz), x), mix(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), x), y),
    mix(mix(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), x), mix(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), x), y), z);
}

// Shared midpoint vertices keep the displaced surface and its normals seamless.
function rock(seed: number) {
  const rand = random(seed);
  const g = (1 + Math.sqrt(5)) / 2;
  const vertices = [[-1,g,0],[1,g,0],[-1,-g,0],[1,-g,0],[0,-1,g],[0,1,g],
    [0,-1,-g],[0,1,-g],[g,0,-1],[g,0,1],[-g,0,-1],[-g,0,1]];
  for (const v of vertices) {
    const length = Math.hypot(...v);
    for (let i = 0; i < 3; i++) v[i] /= length;
  }
  let faces = [0,11,5, 0,5,1, 0,1,7, 0,7,10, 0,10,11, 1,5,9, 5,11,4, 11,10,2,
    10,7,6, 7,1,8, 3,9,4, 3,4,2, 3,2,6, 3,6,8, 3,8,9, 4,9,5, 2,4,11, 6,2,10, 8,6,7, 9,8,1];
  for (let level = 0; level < 3; level++) {
    const cache = new Map<number, number>();
    const midpoint = (a: number, b: number) => {
      const key = Math.min(a, b) * 65536 + Math.max(a, b);
      const found = cache.get(key);
      if (found !== undefined) return found;
      const v = vertices[a].map((value, i) => value + vertices[b][i]);
      const length = Math.hypot(...v);
      const index = vertices.push(v.map(value => value / length)) - 1;
      cache.set(key, index);
      return index;
    };
    const next: number[] = [];
    for (let i = 0; i < faces.length; i += 3) {
      const a = faces[i], b = faces[i + 1], c = faces[i + 2];
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      next.push(a,ab,ca, b,bc,ab, c,ca,bc, ab,bc,ca);
    }
    faces = next;
  }
  const craters = Array.from({ length: 2 + Math.floor(rand() * 3) }, () => {
    const z = rand() * 2 - 1, angle = rand() * TAU, r = Math.sqrt(1 - z * z);
    return [r * Math.cos(angle), r * Math.sin(angle), z, 0.24 + rand() * 0.25, 0.12 + rand() * 0.15];
  });
  const squash = [0.83 + rand() * 0.28, 0.65 + rand() * 0.25, 0.8 + rand() * 0.25];
  for (const v of vertices) {
    let field = 0, amplitude = 0.5, frequency = 2.8;
    for (let octave = 0; octave < 5; octave++) {
      field += amplitude * noise(v[0] * frequency + seed, v[1] * frequency, v[2] * frequency);
      amplitude *= 0.5; frequency *= 2.03;
    }
    let radius = 0.61 + field * 0.78;
    for (const c of craters) {
      const distance = Math.hypot(v[0] - c[0], v[1] - c[1], v[2] - c[2]) / c[3];
      radius -= c[4] * Math.exp(-distance * distance * 3);
      radius += 0.025 * Math.exp(-Math.pow((distance - 0.95) * 5, 2));
    }
    for (let i = 0; i < 3; i++) v[i] *= radius * squash[i];
  }
  const normals = new Float32Array(vertices.length * 3);
  for (let i = 0; i < faces.length; i += 3) {
    const a = vertices[faces[i]], b = vertices[faces[i + 1]], c = vertices[faces[i + 2]];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    for (let j = 0; j < 3; j++) {
      const index = faces[i + j] * 3;
      normals[index] += uy * vz - uz * vy;
      normals[index + 1] += uz * vx - ux * vz;
      normals[index + 2] += ux * vy - uy * vx;
    }
  }
  const data = new Float32Array(vertices.length * 6);
  vertices.forEach((v, i) => {
    const length = Math.hypot(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
    for (let j = 0; j < 3; j++) {
      data[i * 6 + j] = v[j];
      data[i * 6 + 3 + j] = normals[i * 3 + j] / length;
    }
  });
  return { data, indices: new Uint16Array(faces) };
}

/**
 * A slow belt of basalt and embers between the Judas plate and her cutout.
 * The camera stays fixed; cover cropping follows the plate at every aspect.
 * Offscreen panels pause their clock. Reduced motion keeps a single still.
 */
export default function JudasAsteroids({ playing = true, focus = 0.5, className }: {
  playing?: boolean;
  focus?: number;
  className?: string;
}): JSX.Element | null {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const playingRef = useRef(playing);
  const focusRef = useRef(focus);
  const kick = useRef<() => void>(() => undefined);
  const reframe = useRef<() => void>(() => undefined);

  useEffect(() => { playingRef.current = playing; kick.current(); }, [playing]);
  useEffect(() => { focusRef.current = focus; reframe.current(); }, [focus]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) return;
    const program = compile(gl, ROCK_VS, ROCK_FS);
    if (!program) return;
    const meshes = Array.from({ length: 5 }, (_, i) => {
      const { data, indices } = rock(71 + i * 137);
      const vao = gl.createVertexArray(), buffer = gl.createBuffer(), index = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      return { vao, buffer, index, count: indices.length };
    });
    const uniforms = {
      rotation: gl.getUniformLocation(program, "rotation"), body: gl.getUniformLocation(program, "body"),
      cover: gl.getUniformLocation(program, "cover"), t: gl.getUniformLocation(program, "t"),
      material: gl.getUniformLocation(program, "material"),
    };
    const rand = random(1937);
    const bodies = Array.from({ length: 54 }, (_, i) => {
      const ax = rand() * 2 - 1, ay = rand() * 2 - 1, az = rand() * 2 - 1;
      const length = Math.hypot(ax, ay, az);
      return {
        mesh: meshes[i % 5], phase: (i < 14 ? i / 14 : rand()) * TAU + 0.18,
        radius: 0.9 + rand() * 0.2, height: (rand() - 0.5) * (i < 14 ? 0.12 : 0.38),
        size: i < 14 ? HERO_SIZES[(i * 5) % 14] : 0.0018 + rand() * 0.0045,
        ax: ax / length, ay: ay / length, az: az / length,
        tumble: 5 + Math.floor(rand() * 10), spin: rand() * TAU,
        seed: rand() * 100, ember: i % 3 === 0 ? 1 : 0, x: 0, y: 0, z: 0,
      };
    });
    const order = bodies.slice();
    const rotation = new Float32Array(9);
    const cover = new Float32Array(3);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let still = motion.matches;
    let visible = false, lost = false, drawn = false, dirty = true;
    let width = 0, height = 0, frame = 0, last = 0, time = 0;
    // The belt narrows to the visible part of the frame, so a tall crop still sees the loop.
    let belt = 1;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const resize = () => {
      if (lost) return;
      width = canvas.clientWidth; height = canvas.clientHeight;
      // Frame the scene to the panel, not to the wider canvas.
      const frameWidth = width / (1 + 2 * BLEED);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const scale = Math.max(frameWidth / 1800, height / 1013);
      const focus = Number.isFinite(focusRef.current) ? Math.max(0, Math.min(1, focusRef.current)) : 0.5;
      cover[0] = 1800 * scale / Math.max(frameWidth, 1);
      cover[1] = 1013 * scale / Math.max(height, 1);
      cover[2] = (cover[0] - 1) * (1 - 2 * focus);
      belt = Math.max(0.35, Math.min(1, 0.95 / cover[0]));
      // The frame fills the middle of clip space; the bleed lies outside it.
      cover[0] *= frameWidth / Math.max(width, 1);
      cover[2] *= frameWidth / Math.max(width, 1);
      dirty = true;
      kick.current();
    };
    const running = () => playingRef.current && !still;
    const step = (now: number) => {
      frame = 0;
      if (lost || !visible || document.hidden || !width || !height) { last = 0; return; }
      if (running()) time = (time + (last ? Math.min((now - last) / 1000, 0.05) : 0)) % ORBIT;
      last = running() ? now : 0;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform3fv(uniforms.cover, cover);
      gl.uniform1f(uniforms.t, time);
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i], angle = b.phase + time * TAU / ORBIT;
        const c = Math.cos(angle), s = Math.sin(angle);
        b.x = c * ASPECT * 0.6 * b.radius * belt;
        b.y = -0.05 + s * 0.15 + c * 0.105 + b.height;
        b.z = s * 0.85 * b.radius;
        order[i] = b;
      }
      // Far-to-near blending, with depth writes for the rocks' own surfaces.
      for (let i = 1; i < order.length; i++) {
        const b = order[i];
        let j = i - 1;
        while (j >= 0 && order[j].z > b.z) { order[j + 1] = order[j]; j--; }
        order[j + 1] = b;
      }
      for (let i = 0; i < order.length; i++) {
        const b = order[i], angle = b.spin + time * TAU * b.tumble / ORBIT;
        const c = Math.cos(angle), s = Math.sin(angle), k = 1 - c;
        const x = b.ax, y = b.ay, z = b.az;
        rotation[0] = c + x*x*k; rotation[1] = y*x*k + z*s; rotation[2] = z*x*k - y*s;
        rotation[3] = x*y*k - z*s; rotation[4] = c + y*y*k; rotation[5] = z*y*k + x*s;
        rotation[6] = x*z*k + y*s; rotation[7] = y*z*k - x*s; rotation[8] = c + z*z*k;
        gl.uniformMatrix3fv(uniforms.rotation, false, rotation);
        gl.uniform4f(uniforms.body, b.x, b.y, b.z, b.size);
        gl.uniform2f(uniforms.material, b.seed, b.ember);
        gl.bindVertexArray(b.mesh.vao);
        gl.drawElements(gl.TRIANGLES, b.mesh.count, gl.UNSIGNED_SHORT, 0);
      }
      dirty = false;
      if (!drawn) { drawn = true; setReady(true); }
      if (running()) frame = requestAnimationFrame(step);
    };
    kick.current = () => {
      if (lost || !visible || document.hidden || !width || !height || (!running() && !dirty)) {
        cancelAnimationFrame(frame); frame = 0; last = 0;
      } else if (!frame) frame = requestAnimationFrame(step);
    };
    reframe.current = resize;
    const sizes = new ResizeObserver(resize);
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick.current(); });
    const onVisibility = () => kick.current();
    const onMotion = () => { still = motion.matches; kick.current(); };
    const onLoss = () => { lost = true; cancelAnimationFrame(frame); frame = 0; setReady(false); };
    sizes.observe(canvas);
    seen.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);
    canvas.addEventListener("webglcontextlost", onLoss);
    resize();

    return () => {
      lost = true;
      cancelAnimationFrame(frame);
      kick.current = () => undefined;
      reframe.current = () => undefined;
      sizes.disconnect(); seen.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
      canvas.removeEventListener("webglcontextlost", onLoss);
      gl.bindVertexArray(null);
      for (const mesh of meshes) {
        gl.deleteVertexArray(mesh.vao); gl.deleteBuffer(mesh.buffer); gl.deleteBuffer(mesh.index);
      }
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={["judas-asteroids", className, ready && "is-ready"].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={{ position: "absolute", top: 0, left: `${-BLEED * 100}%`, width: `${(1 + 2 * BLEED) * 100}%`,
        height: "100%", display: "block",
        pointerEvents: "none", opacity: ready ? 1 : 0, transition: "opacity 1.2s" }}
    />
  );
}
