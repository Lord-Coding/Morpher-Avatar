export const SAMPLES = 120;

export type ShapeId =
  | "cercle"
  | "galet"
  | "squircle"
  | "capsule"
  | "triangle"
  | "hexagone"
  | "nuage"
  | "goutte";

export const SHAPES: { id: ShapeId; label: string }[] = [
  { id: "cercle", label: "Cercle" },
  { id: "galet", label: "Galet" },
  { id: "squircle", label: "Squircle" },
  { id: "capsule", label: "Capsule" },
  { id: "triangle", label: "Triangle" },
  { id: "hexagone", label: "Hexagone" },
  { id: "nuage", label: "Nuage" },
  { id: "goutte", label: "Goutte" },
];

/** Superellipse radius for a given angle. */
function superellipse(t: number, rx: number, ry: number, n: number) {
  const c = Math.abs(Math.cos(t)) / rx;
  const s = Math.abs(Math.sin(t)) / ry;
  return 1 / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
}

/** Regular polygon radius (circumradius normalized). */
function polygon(t: number, sides: number, rotation = 0) {
  const seg = (2 * Math.PI) / sides;
  const a = ((t + rotation) % seg + seg) % seg;
  return Math.cos(seg / 2) / Math.cos(a - seg / 2);
}

function smooth(values: number[], passes: number, window = 3) {
  let out = values;
  for (let p = 0; p < passes; p++) {
    const next = new Array<number>(out.length);
    for (let i = 0; i < out.length; i++) {
      let sum = 0;
      for (let k = -window; k <= window; k++) {
        sum += out[(i + k + out.length) % out.length]!;
      }
      next[i] = sum / (window * 2 + 1);
    }
    out = next;
  }
  return out;
}

function normalize(values: number[]) {
  const max = Math.max(...values);
  return values.map((v) => v / max);
}

/** Radii sampled clockwise starting at the top (12 o'clock). */
export function shapeRadii(shape: ShapeId): number[] {
  const raw: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const a = (i / SAMPLES) * Math.PI * 2; // 0 = top
    const t = a - Math.PI / 2; // standard angle for trig helpers
    const top = Math.cos(a); // 1 at top, -1 at bottom
    let r: number;

    switch (shape) {
      case "cercle":
        r = 1;
        break;
      case "galet":
        r = superellipse(t, 1.04, 0.9, 2.6) * (1 + 0.03 * Math.cos(a * 2 + 0.8));
        break;
      case "squircle":
        r = superellipse(t, 1, 1, 4.4);
        break;
      case "capsule":
        r = superellipse(t, 1.18, 0.74, 8);
        break;
      case "triangle":
        r = polygon(a + Math.PI, 3) * 1.06;
        break;
      case "hexagone":
        r = polygon(a, 6);
        break;
      case "nuage":
        r = 1 + 0.12 * Math.cos(a * 5) + 0.05 * Math.cos(a * 3 + 1.2);
        break;
      case "goutte":
        r = 0.96 + 0.55 * Math.pow(Math.max(0, top), 6);
        break;
      default:
        r = 1;
    }
    raw.push(r);
  }

  const passes = shape === "triangle" || shape === "hexagone" ? 4 : shape === "nuage" ? 1 : 2;
  return normalize(smooth(raw, passes));
}

const CACHE = new Map<ShapeId, number[]>();
export function cachedRadii(shape: ShapeId) {
  let r = CACHE.get(shape);
  if (!r) {
    r = shapeRadii(shape);
    CACHE.set(shape, r);
  }
  return r;
}

export function lerpRadii(from: number[], to: number[], t: number) {
  return from.map((v, i) => v + (to[i]! - v) * t);
}

/** Closed smooth path through the sampled radii. */
export function radiiToPath(radii: number[], cx: number, cy: number, scale: number) {
  const pts = radii.map((r, i) => {
    const a = (i / radii.length) * Math.PI * 2;
    return [cx + Math.sin(a) * r * scale, cy - Math.cos(a) * r * scale] as const;
  });

  let d = `M ${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]!;
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d} Z`;
}

export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
