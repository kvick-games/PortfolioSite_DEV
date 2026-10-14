import { useEffect, useRef, useState, type RefObject } from "react";

/*
 * Smoke behind the AI Timeline board: a small stable-fluids simulation on the GPU
 * (WebGL2, half-float targets). Velocity runs on a coarse grid (~128 cells on the
 * short side), the dye on a finer one, and a display pass tone-maps the dye into
 * dark, lit smoke over the board's ground colour.
 *
 * Everything that injects motion or colour goes through uniforms in the two
 * advection passes, so a frame costs a fixed set of passes however much is
 * happening: lane emitters (dye bleeding off each lab's line), a few slow
 * wanderers, the pointer, and a nudge when the world is panned.
 *
 * Motion is kept local: the ambient force is curl noise (divergence-free, zero
 * mean), so nothing translates the whole field. Reduced motion renders one
 * settled frame and takes no input.
 */

export type SmokeLane = { y: number; color: string; /** World x where the line starts. */ start?: number };

type Props = {
  /** Lane centre lines in board pixels (from the top), with each line's colour. */
  lanes: SmokeLane[];
  /** The world's horizontal pan offset in pixels, read every frame. */
  offsetRef: RefObject<number>;
  /** World x of the "now" line, where the lane lines end. */
  nowX: number;
  /** An element whose area (for example the caption card) gets darker smoke. */
  shadeRef?: RefObject<HTMLElement | null>;
  /** Board pixels at the top kept quiet for the axis labels. */
  axisHeight?: number;
};

const MAX_LANES = 8;
const MAX_EMITTERS = 8;
const SIM_RES = 128;
const PRESSURE_ITERATIONS = 20;
const VELOCITY_DISSIPATION = 0.45;
const DYE_DISSIPATION = 0.42;
const CURL = 6;
const PRESSURE_RETAIN = 0.8;
const AMBIENT = 2.4; // curl-noise acceleration, sim cells per s^2
const BUOYANCY = 7.0;
const PALE = [0.5, 0.55, 0.66];
const WARMUP_STEPS = 150;

/* Shaders ------------------------------------------------------------------ */

const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

/* Advect velocity, then add the ambient curl noise, buoyancy and emitter impulses. */
const VELOCITY_FRAG = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
uniform float uTime;
uniform float uAspect;
uniform float uAmbient;
uniform float uBuoyancy;
uniform int uCount;
uniform vec4 uEmit[${MAX_EMITTERS}];
uniform vec2 uForce[${MAX_EMITTERS}];
float field(vec2 p) {
  return vnoise(p + uTime * vec2(0.021, 0.013)) * 0.65
       + vnoise(p * 2.03 + vec2(17.3, 4.1) - uTime * vec2(0.012, -0.027)) * 0.35;
}
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  vec2 v = texture(uVelocity, coord).xy / (1.0 + uDissipation * uDt);
  vec2 p = vec2(vUv.x * uAspect, vUv.y) * 0.9;
  float e = 0.02;
  float dx = field(p + vec2(e, 0.0)) - field(p - vec2(e, 0.0));
  float dy = field(p + vec2(0.0, e)) - field(p - vec2(0.0, e));
  v += uAmbient * uDt * vec2(dy, -dx) / (2.0 * e);
  float d = dot(texture(uDye, vUv).rgb, vec3(0.3333));
  v.y += uBuoyancy * uDt * min(d, 1.5);
  for (int i = 0; i < ${MAX_EMITTERS}; i++) {
    if (i >= uCount) break;
    vec2 q = vUv - uEmit[i].xy;
    q.x *= uAspect;
    v += uForce[i] * exp(-dot(q, q) / uEmit[i].z);
  }
  outColor = vec4(v, 0.0, 1.0);
}`;

/* Advect dye, then add colour from the lanes and the emitters. */
const DYE_FRAG = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform vec2 uSimTexel;
uniform float uDt;
uniform float uDissipation;
uniform float uTime;
uniform float uAspect;
uniform float uLaneWidth;
uniform float uNowU;
uniform int uLaneCount;
uniform vec4 uLane[${MAX_LANES}];
uniform float uLaneStart[${MAX_LANES}];
uniform int uCount;
uniform vec4 uEmit[${MAX_EMITTERS}];
uniform vec3 uEmitColor[${MAX_EMITTERS}];
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uSimTexel;
  vec3 c = texture(uDye, coord).rgb / (1.0 + uDissipation * uDt);
  float ends = smoothstep(uNowU + 0.004, uNowU - 0.05, vUv.x);
  float x = vUv.x * uAspect;
  for (int i = 0; i < ${MAX_LANES}; i++) {
    if (i >= uLaneCount) break;
    float dy = (vUv.y - uLane[i].x) / uLaneWidth;
    float band = exp(-dy * dy);
    if (band < 0.002) continue;
    float seed = float(i) * 7.31;
    // Patches that come and go in place: the noise evolves, it does not slide.
    float patchy = smoothstep(0.5, 0.9, vnoise(vec2(x * 2.2 + seed, uTime * 0.07 + seed)));
    float grain = 0.7 + 0.3 * vnoise(vec2(x * 5.0 + seed * 3.0, uTime * 0.15));
    float starts = smoothstep(uLaneStart[i] - 0.01, uLaneStart[i] + 0.05, vUv.x);
    c += uLane[i].yzw * band * patchy * grain * ends * starts * uDt;
  }
  for (int i = 0; i < ${MAX_EMITTERS}; i++) {
    if (i >= uCount) break;
    vec2 q = vUv - uEmit[i].xy;
    q.x *= uAspect;
    c += uEmitColor[i] * exp(-dot(q, q) / uEmit[i].z);
  }
  outColor = vec4(c, 1.0);
}`;

const CURL_FRAG = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY_FRAG = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uCurlStrength;
uniform float uDt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * C;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  v = clamp(v, vec2(-1000.0), vec2(1000.0));
  outColor = vec4(v, 0.0, 1.0);
}`;

const DIVERGENCE_FRAG = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  vec2 C = texture(uVelocity, vUv).xy;
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CLEAR_FRAG = `${HEAD}
uniform sampler2D uTexture;
uniform float uValue;
void main() {
  outColor = uValue * texture(uTexture, vUv);
}`;

const PRESSURE_FRAG = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  outColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT_FRAG = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  outColor = vec4(v, 0.0, 1.0);
}`;

/* Dye to screen: desaturate toward a cool smoke grey, light the density from the
   upper left so the wisps read as volume, cap the brightness so the board's
   labels keep their contrast, and quiet the axis band and the caption card. */
const DISPLAY_FRAG = `${HEAD}
uniform sampler2D uDye;
uniform vec2 uDyeTexel;
uniform vec3 uGround;
uniform vec4 uShade;
uniform float uShadeOn;
uniform float uAspect;
uniform float uTop;
uniform float uTime;
float dens(vec2 uv) {
  vec3 c = texture(uDye, uv).rgb;
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
void main() {
  vec3 c = max(texture(uDye, vUv).rgb, 0.0);
  vec2 o = uDyeTexel * 4.0;
  float dx = dens(vUv + vec2(o.x, 0.0)) - dens(vUv - vec2(o.x, 0.0));
  float dy = dens(vUv + vec2(0.0, o.y)) - dens(vUv - vec2(0.0, o.y));
  vec3 n = normalize(vec3(-dx, -dy, 0.3));
  float light = dot(n, normalize(vec3(-0.55, 0.65, 0.5)));
  float rim = smoothstep(0.55, 1.0, light);

  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 grey = vec3(l) * vec3(0.80, 0.86, 0.98);
  vec3 tint = mix(grey, c, 0.45);
  // Soft cap: dense smoke saturates toward a dim ceiling, never toward white.
  vec3 smoke = 0.28 * (1.0 - exp(-tint * 2.2));
  smoke *= 0.82 + 0.3 * clamp(light, 0.0, 1.0);
  // Thick cores sit a little in their own shadow, so dense smoke keeps its form.
  smoke *= mix(1.0, 0.7, smoothstep(0.45, 2.0, l));
  smoke += vec3(0.80, 0.86, 1.0) * rim * min(l, 0.5) * 0.03;

  vec2 p = (vUv - vec2(0.56, 0.48)) * vec2(uAspect, 1.0) / max(uAspect, 1.0);
  float vignette = smoothstep(0.98, 0.18, length(p * vec2(1.0, 1.5)));
  float axis = mix(0.3, 1.0, smoothstep(uTop, uTop + 0.14, 1.0 - vUv.y));
  float mask = mix(0.32, 1.0, vignette) * axis;
  if (uShadeOn > 0.5) {
    vec2 sp = vec2(vUv.x * uAspect, vUv.y);
    vec2 lo = vec2(uShade.x * uAspect, uShade.y);
    vec2 hi = vec2(uShade.z * uAspect, uShade.w);
    float d = sdBox(sp - (lo + hi) * 0.5, (hi - lo) * 0.5);
    mask *= mix(0.72, 1.0, smoothstep(-0.04, 0.12, d));
  }
  vec3 col = uGround + smoke * mask;
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * (1.6 / 255.0);
  outColor = vec4(col, 1.0);
}`;

/* GL plumbing ---------------------------------------------------------------- */

type Target = {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w: number;
  h: number;
  texel: [number, number];
};
type DoubleTarget = { read: Target; write: Target; swap: () => void };
type Program = { prog: WebGLProgram; uni: (name: string) => WebGLUniformLocation | null };
type Format = { internal: number; format: number };

function parseColor(value: string): [number, number, number] {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  return [0.02, 0.027, 0.043];
}

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function supportsFormat(gl: WebGL2RenderingContext, internal: number, format: number) {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, gl.HALF_FLOAT, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  return ok;
}

function pickFormats(gl: WebGL2RenderingContext) {
  if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) {
    return null;
  }
  const rgba: Format = { internal: gl.RGBA16F, format: gl.RGBA };
  if (!supportsFormat(gl, rgba.internal, rgba.format)) return null;
  const rg: Format = supportsFormat(gl, gl.RG16F, gl.RG) ? { internal: gl.RG16F, format: gl.RG } : rgba;
  const r: Format = supportsFormat(gl, gl.R16F, gl.RED) ? { internal: gl.R16F, format: gl.RED } : rg;
  return { rgba, rg, r };
}

function createSmoke(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const formats = pickFormats(gl);
  if (!formats) return null;

  const shaders: WebGLShader[] = [];
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`SmokeField shader: ${log}`);
    }
    shaders.push(shader);
    return shader;
  };
  const vert = compile(gl.VERTEX_SHADER, VERT);
  const programs: WebGLProgram[] = [];
  const program = (frag: string): Program => {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`SmokeField link: ${gl.getProgramInfoLog(prog)}`);
    }
    programs.push(prog);
    const cache = new Map<string, WebGLUniformLocation | null>();
    return {
      prog,
      uni: (name) => {
        if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
        return cache.get(name)!;
      },
    };
  };

  const p = {
    velocity: program(VELOCITY_FRAG),
    dye: program(DYE_FRAG),
    curl: program(CURL_FRAG),
    vorticity: program(VORTICITY_FRAG),
    divergence: program(DIVERGENCE_FRAG),
    clear: program(CLEAR_FRAG),
    pressure: program(PRESSURE_FRAG),
    gradient: program(GRADIENT_FRAG),
    display: program(DISPLAY_FRAG),
  };

  // One oversized triangle covers the viewport.
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const targets: Target[] = [];
  const target = (w: number, h: number, f: Format): Target => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, f.internal, w, h, 0, f.format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const t = { tex, fbo, w, h, texel: [1 / w, 1 / h] as [number, number] };
    targets.push(t);
    return t;
  };
  const double = (w: number, h: number, f: Format): DoubleTarget => {
    const d = {
      read: target(w, h, f),
      write: target(w, h, f),
      swap: () => {
        const tmp = d.read;
        d.read = d.write;
        d.write = tmp;
      },
    };
    return d;
  };
  const freeTargets = () => {
    for (const t of targets) {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
    targets.length = 0;
  };

  let sim!: { w: number; h: number };
  let velocity!: DoubleTarget;
  let dye!: DoubleTarget;
  let pressure!: DoubleTarget;
  let divergence!: Target;
  let curl!: Target;

  const sizeFor = (base: number, aspect: number) =>
    aspect >= 1
      ? { w: Math.round(base * aspect), h: base }
      : { w: base, h: Math.round(base / aspect) };

  const allocate = (aspect: number, dyeBase: number) => {
    freeTargets();
    sim = sizeFor(SIM_RES, aspect);
    const d = sizeFor(dyeBase, aspect);
    velocity = double(sim.w, sim.h, formats.rg);
    dye = double(d.w, d.h, formats.rgba);
    pressure = double(sim.w, sim.h, formats.r);
    divergence = target(sim.w, sim.h, formats.r);
    curl = target(sim.w, sim.h, formats.r);
  };

  const bindTex = (unit: number, t: Target) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    return unit;
  };
  const draw = (prog: Program, dest: Target | null, texel: [number, number]) => {
    gl.uniform2f(prog.uni("uTexel"), texel[0], texel[1]);
    if (dest) {
      gl.viewport(0, 0, dest.w, dest.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, dest.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const emitPos = new Float32Array(MAX_EMITTERS * 4);
  const emitForce = new Float32Array(MAX_EMITTERS * 2);
  const emitColor = new Float32Array(MAX_EMITTERS * 3);
  const laneData = new Float32Array(MAX_LANES * 4);
  const laneStart = new Float32Array(MAX_LANES);

  type Frame = {
    dt: number;
    time: number;
    aspect: number;
    emitters: number;
    lanes: number;
    laneWidth: number;
    nowU: number;
  };

  const step = (f: Frame) => {
    gl.disable(gl.BLEND);
    gl.bindVertexArray(vao);
    const st = velocity.read.texel;

    gl.useProgram(p.curl.prog);
    gl.uniform1i(p.curl.uni("uVelocity"), bindTex(0, velocity.read));
    draw(p.curl, curl, st);

    gl.useProgram(p.vorticity.prog);
    gl.uniform1i(p.vorticity.uni("uVelocity"), bindTex(0, velocity.read));
    gl.uniform1i(p.vorticity.uni("uCurl"), bindTex(1, curl));
    gl.uniform1f(p.vorticity.uni("uCurlStrength"), CURL);
    gl.uniform1f(p.vorticity.uni("uDt"), f.dt);
    draw(p.vorticity, velocity.write, st);
    velocity.swap();

    gl.useProgram(p.divergence.prog);
    gl.uniform1i(p.divergence.uni("uVelocity"), bindTex(0, velocity.read));
    draw(p.divergence, divergence, st);

    gl.useProgram(p.clear.prog);
    gl.uniform1i(p.clear.uni("uTexture"), bindTex(0, pressure.read));
    gl.uniform1f(p.clear.uni("uValue"), PRESSURE_RETAIN);
    draw(p.clear, pressure.write, st);
    pressure.swap();

    gl.useProgram(p.pressure.prog);
    gl.uniform1i(p.pressure.uni("uDivergence"), bindTex(1, divergence));
    for (let i = 0; i < PRESSURE_ITERATIONS; i += 1) {
      gl.uniform1i(p.pressure.uni("uPressure"), bindTex(0, pressure.read));
      draw(p.pressure, pressure.write, st);
      pressure.swap();
    }

    gl.useProgram(p.gradient.prog);
    gl.uniform1i(p.gradient.uni("uPressure"), bindTex(0, pressure.read));
    gl.uniform1i(p.gradient.uni("uVelocity"), bindTex(1, velocity.read));
    draw(p.gradient, velocity.write, st);
    velocity.swap();

    const v = p.velocity;
    gl.useProgram(v.prog);
    gl.uniform1i(v.uni("uVelocity"), bindTex(0, velocity.read));
    gl.uniform1i(v.uni("uDye"), bindTex(1, dye.read));
    gl.uniform1f(v.uni("uDt"), f.dt);
    gl.uniform1f(v.uni("uDissipation"), VELOCITY_DISSIPATION);
    gl.uniform1f(v.uni("uTime"), f.time);
    gl.uniform1f(v.uni("uAspect"), f.aspect);
    gl.uniform1f(v.uni("uAmbient"), AMBIENT);
    gl.uniform1f(v.uni("uBuoyancy"), BUOYANCY);
    gl.uniform1i(v.uni("uCount"), f.emitters);
    gl.uniform4fv(v.uni("uEmit"), emitPos);
    gl.uniform2fv(v.uni("uForce"), emitForce);
    draw(v, velocity.write, st);
    velocity.swap();

    const d = p.dye;
    gl.useProgram(d.prog);
    gl.uniform1i(d.uni("uVelocity"), bindTex(0, velocity.read));
    gl.uniform1i(d.uni("uDye"), bindTex(1, dye.read));
    gl.uniform2f(d.uni("uSimTexel"), st[0], st[1]);
    gl.uniform1f(d.uni("uDt"), f.dt);
    gl.uniform1f(d.uni("uDissipation"), DYE_DISSIPATION);
    gl.uniform1f(d.uni("uTime"), f.time);
    gl.uniform1f(d.uni("uAspect"), f.aspect);
    gl.uniform1f(d.uni("uLaneWidth"), f.laneWidth);
    gl.uniform1f(d.uni("uNowU"), f.nowU);
    gl.uniform1i(d.uni("uLaneCount"), f.lanes);
    gl.uniform4fv(d.uni("uLane"), laneData);
    gl.uniform1fv(d.uni("uLaneStart"), laneStart);
    gl.uniform1i(d.uni("uCount"), f.emitters);
    gl.uniform4fv(d.uni("uEmit"), emitPos);
    gl.uniform3fv(d.uni("uEmitColor"), emitColor);
    draw(d, dye.write, dye.read.texel);
    dye.swap();
  };

  const render = (o: {
    ground: [number, number, number];
    shade: [number, number, number, number] | null;
    aspect: number;
    top: number;
    time: number;
  }) => {
    gl.bindVertexArray(vao);
    const d = p.display;
    gl.useProgram(d.prog);
    gl.uniform1i(d.uni("uDye"), bindTex(0, dye.read));
    gl.uniform2f(d.uni("uDyeTexel"), dye.read.texel[0], dye.read.texel[1]);
    gl.uniform3f(d.uni("uGround"), o.ground[0], o.ground[1], o.ground[2]);
    gl.uniform1f(d.uni("uShadeOn"), o.shade ? 1 : 0);
    gl.uniform4f(d.uni("uShade"), ...(o.shade ?? ([0, 0, 0, 0] as [number, number, number, number])));
    gl.uniform1f(d.uni("uAspect"), o.aspect);
    gl.uniform1f(d.uni("uTop"), o.top);
    gl.uniform1f(d.uni("uTime"), o.time);
    draw(d, null, dye.read.texel);
  };

  const destroy = () => {
    freeTargets();
    for (const prog of programs) gl.deleteProgram(prog);
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
  };

  return {
    gl,
    allocate,
    step,
    render,
    destroy,
    emitPos,
    emitForce,
    emitColor,
    laneData,
    laneStart,
    get sim() {
      return sim;
    },
  };
}

/* Component ------------------------------------------------------------------- */

export default function SmokeField({ lanes, offsetRef, nowX, shadeRef, axisHeight = 64 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lanesRef = useRef(lanes);
  const nowRef = useRef(nowX);
  const axisRef = useRef(axisHeight);
  lanesRef.current = lanes;
  nowRef.current = nowX;
  axisRef.current = axisHeight;
  const laneKey = lanes.map((l) => `${l.y}:${l.color}`).join("|");

  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [state, setState] = useState<"idle" | "ready" | "fallback">("idle");

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Reduced motion: re-settle the still frame when the lanes move.
  const resettleRef = useRef<() => void>(() => {});
  useEffect(() => {
    resettleRef.current();
  }, [laneKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const field = wrap?.parentElement;
    if (!canvas || !wrap || !field) return;

    let smoke: ReturnType<typeof createSmoke> = null;
    try {
      smoke = createSmoke(canvas);
    } catch (error) {
      console.warn(error);
      smoke = null;
    }
    if (!smoke) {
      setState("fallback");
      return;
    }
    const s = smoke;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowEnd = coarse || (navigator.hardwareConcurrency ?? 8) <= 4;
    const dprCap = lowEnd ? 1.25 : 1.5;

    let width = 0;
    let height = 0;
    let aspect = 1;
    let ground: [number, number, number] = [0.02, 0.027, 0.043];
    let shade: [number, number, number, number] | null = null;
    let time = Math.random() * 100;
    let last = 0;
    let raf = 0;
    let inView = false;
    let pageVisible = document.visibilityState !== "hidden";
    let lastOffset = offsetRef.current ?? 0;
    let lastPointerAt = -1e9;
    let ready = false;
    let warm = WARMUP_STEPS;
    const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false, has: false };
    const laneRgb = new Map<string, [number, number, number]>();
    const rgbOf = (hex: string) => {
      let c = laneRgb.get(hex);
      if (!c) {
        c = parseColor(hex).map(srgbToLinear) as [number, number, number];
        laneRgb.set(hex, c);
      }
      return c;
    };

    const measure = () => {
      const w = field.clientWidth;
      const h = field.clientHeight;
      if (!w || !h) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ground = parseColor(getComputedStyle(field).backgroundColor);
      const shadeEl = shadeRef?.current;
      shade = null;
      if (shadeEl) {
        const f = field.getBoundingClientRect();
        const r = shadeEl.getBoundingClientRect();
        if (r.width && r.right > f.left && r.left < f.right && r.bottom > f.top && r.top < f.bottom) {
          shade = [
            (r.left - f.left) / w,
            1 - (r.bottom - f.top) / h,
            (r.right - f.left) / w,
            1 - (r.top - f.top) / h,
          ];
        }
      }
      const resized = w !== width || h !== height;
      width = w;
      height = h;
      aspect = w / h;
      return resized;
    };

    const allocate = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const base = Math.round(height * dpr * (lowEnd ? 0.4 : 0.5));
      s.allocate(aspect, Math.min(lowEnd ? 512 : 768, Math.max(256, base)));
    };

    // Slow wanderers: pale wisps on long Lissajous paths, breathing in strength.
    const wanderers = [
      { ax: 0.34, ay: 0.3, fx: 0.031, fy: 0.047, px: 0.0, py: 1.3, cx: 0.6, cy: 0.5, lane: 0 },
      { ax: 0.3, ay: 0.34, fx: 0.023, fy: 0.037, px: 2.1, py: 0.4, cx: 0.45, cy: 0.42, lane: 1 },
      { ax: 0.26, ay: 0.28, fx: 0.041, fy: 0.029, px: 4.0, py: 2.6, cx: 0.72, cy: 0.58, lane: 2 },
    ];

    const buildFrame = (dt: number, interactive: boolean) => {
      const sim = s.sim;
      const ls = lanesRef.current.slice(0, MAX_LANES);
      // Lanes: y in uv, then the emission colour (rate per second).
      s.laneData.fill(0);
      ls.forEach((lane, i) => {
        const c = rgbOf(lane.color);
        const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        const gain = 1.3 / Math.max(0.12, lum) ** 0.35;
        s.laneData[i * 4] = 1 - lane.y / height;
        s.laneData[i * 4 + 1] = c[0] * gain;
        s.laneData[i * 4 + 2] = c[1] * gain;
        s.laneData[i * 4 + 3] = c[2] * gain;
        s.laneStart[i] = lane.start === undefined ? -1 : ((offsetRef.current ?? 0) + lane.start) / width;
      });

      let n = 0;
      const push = (
        x: number,
        y: number,
        radius: number,
        fx: number,
        fy: number,
        color: [number, number, number] | number[] | null,
        amount: number,
      ) => {
        if (n >= MAX_EMITTERS) return;
        s.emitPos.set([x, y, radius * radius, 0], n * 4);
        s.emitForce.set([fx, fy], n * 2);
        s.emitColor.set(color ? [color[0] * amount, color[1] * amount, color[2] * amount] : [0, 0, 0], n * 3);
        n += 1;
      };

      for (const w of wanderers) {
        const a = time * w.fx * Math.PI * 2 + w.px;
        const b = time * w.fy * Math.PI * 2 + w.py;
        const x = w.cx + Math.sin(a) * w.ax * 0.6;
        const y = w.cy + Math.sin(b) * w.ay;
        // Direction of travel, in sim cells.
        const vx = Math.cos(a) * w.ax * 0.6 * w.fx;
        const vy = Math.cos(b) * w.ay * w.fy;
        const len = Math.hypot(vx, vy) || 1;
        const breathe = 0.55 + 0.45 * Math.sin(time * 0.21 + w.px * 2.0);
        const accel = 14 * breathe;
        const lane = ls[w.lane];
        const lc = lane ? rgbOf(lane.color) : PALE;
        const tint = [0, 1, 2].map((k) => lc[k] * 0.6 + PALE[k] * 0.4);
        push(x, y, 0.1, (vx / len) * accel * dt, (vy / len) * accel * dt, tint, 0.2 * breathe * dt);
      }

      if (interactive && pointer.moved && pointer.has) {
        const frameDt = Math.max(dt, 1 / 120);
        let fx = ((pointer.dx / width) * sim.w) / frameDt;
        let fy = ((-pointer.dy / height) * sim.h) / frameDt;
        const mag = Math.hypot(fx, fy);
        const maxMag = 360;
        if (mag > maxMag) {
          fx *= maxMag / mag;
          fy *= maxMag / mag;
        }
        const speed = Math.hypot(pointer.dx, pointer.dy);
        let nearest: SmokeLane | null = null;
        for (const lane of ls) if (!nearest || Math.abs(lane.y - pointer.y) < Math.abs(nearest.y - pointer.y)) nearest = lane;
        const base = nearest ? rgbOf(nearest.color) : [0.6, 0.65, 0.75];
        const color = [0, 1, 2].map((k) => base[k] * 0.72 + PALE[k] * 0.28);
        const amount = Math.min(0.08, speed * 0.002);
        push(pointer.x / width, 1 - pointer.y / height, 0.05, fx * 0.6, fy * 0.6, color, amount);
        pointer.dx = 0;
        pointer.dy = 0;
        pointer.moved = false;
      }

      // Keyboard or inertial pans give the lanes a light shove; a drag already
      // stirs the smoke under the pointer.
      const offset = offsetRef.current ?? 0;
      const pan = offset - lastOffset;
      lastOffset = offset;
      if (interactive && Math.abs(pan) > 0.5 && performance.now() - lastPointerAt > 90 && ls.length) {
        const push0 = Math.max(-140, Math.min(140, ((pan / width) * sim.w) / Math.max(dt, 1 / 120))) * 0.3;
        for (let i = 0; n < MAX_EMITTERS && i < 4; i += 1) {
          const lane = ls[(i * 2 + Math.floor(time * 3)) % ls.length];
          push(0.2 + 0.2 * i, 1 - lane.y / height, 0.09, push0, 0, null, 0);
        }
      }

      const nowU = ((offsetRef.current ?? 0) + nowRef.current) / width;
      return {
        dt,
        time,
        aspect,
        emitters: n,
        lanes: ls.length,
        laneWidth: Math.max(6, height * 0.022) / height,
        nowU,
      };
    };

    const render = () =>
      s.render({ ground, shade, aspect, top: axisRef.current / height, time });

    const markReady = () => {
      if (!ready) {
        ready = true;
        setState("ready");
      }
    };

    const settle = (steps: number) => {
      const dt = 1 / 60;
      for (let i = 0; i < steps; i += 1) {
        time += dt;
        s.step(buildFrame(dt, false));
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!inView || !pageVisible) return;
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      if (dt > 0) {
        // The first frames in view also run a few catch-up steps, so the smoke
        // is already up as the canvas fades in.
        for (let i = 0; warm > 0 && i < 3; i += 1, warm -= 1) {
          time += 1 / 60;
          s.step(buildFrame(1 / 60, false));
        }
        time += dt;
        s.step(buildFrame(dt, true));
        render();
        markReady();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reduced || raf || !inView || !pageVisible || !width) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const still = () => {
      if (!width || !lanesRef.current.length) return;
      allocate();
      settle(240);
      render();
      markReady();
    };

    measure();
    if (width) {
      allocate();
      if (reduced) still();
    }
    resettleRef.current = reduced ? still : () => {};

    let resizeTimer = 0;
    const resizeObserver = new ResizeObserver(() => {
      const resized = measure();
      if (!resized && width) {
        if (reduced) render();
        return;
      }
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!width) return;
        if (reduced) {
          still();
        } else {
          allocate();
          warm = WARMUP_STEPS;
          start();
        }
      }, 140);
      if (reduced) render();
    });
    resizeObserver.observe(field);

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        if (inView) start();
        else stop();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(field);

    const onVisibility = () => {
      pageVisible = document.visibilityState !== "hidden";
      if (pageVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Passive listeners on the board: they only read, so drag, the zoom rail and links are untouched.
    const onPointerMove = (event: PointerEvent) => {
      const rect = field.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (pointer.has) {
        pointer.dx += x - pointer.x;
        pointer.dy += y - pointer.y;
        pointer.moved = true;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.has = true;
      lastPointerAt = performance.now();
    };
    const onPointerLeave = () => {
      pointer.has = false;
      pointer.moved = false;
      pointer.dx = 0;
      pointer.dy = 0;
    };
    if (!reduced) {
      field.addEventListener("pointermove", onPointerMove, { passive: true });
      field.addEventListener("pointerleave", onPointerLeave, { passive: true });
      field.addEventListener("pointercancel", onPointerLeave, { passive: true });
    }

    const onLost = (event: Event) => {
      event.preventDefault();
      stop();
      setState("fallback");
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      field.removeEventListener("pointermove", onPointerMove);
      field.removeEventListener("pointerleave", onPointerLeave);
      field.removeEventListener("pointercancel", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      resettleRef.current = () => {};
      if (!s.gl.isContextLost()) s.destroy();
    };
  }, [reduced, offsetRef, shadeRef]);

  return (
    <div
      ref={wrapRef}
      className={`tlm-smoke${state === "ready" ? " is-ready" : ""}${state === "fallback" ? " is-fallback" : ""}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
