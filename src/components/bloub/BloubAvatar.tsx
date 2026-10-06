import { forwardRef, useEffect, useRef, useState } from "react";
import {
  cachedRadii,
  easeInOut,
  lerpRadii,
  radiiToPath,
  type ShapeId,
} from "@/lib/bloub-shapes";
import { EXPRESSION_SCALES, renderFace, type ExpressionId } from "./expressions";

export type BloubProps = {
  shape: ShapeId;
  expression: ExpressionId;
  color: string;
  ink?: string;
  size?: number;
  /** Disable morph + blink motion (thumbnails, reduced motion). */
  still?: boolean;
  className?: string;
  /** Breathing speed multiplier (0.3–3). */
  tempo?: number;
  /** Breathing amplitude multiplier (0–4). */
  wobble?: number;
  /** Mean interval between blinks in ms. */
  blinkEvery?: number;
};

const MORPH_MS = 650;

export const BloubAvatar = forwardRef<SVGSVGElement, BloubProps>(function BloubAvatar(
  { shape, expression, color, ink = "#f9f9f9", size = 220, still = false, className, tempo = 1, wobble = 1, blinkEvery = 3500 },
  ref,
) {
  const [path, setPath] = useState(() =>
    radiiToPath(cachedRadii(shape), 100, 100, 78),
  );
  const [blink, setBlink] = useState(1);
  const faceScale = EXPRESSION_SCALES[expression];

  const fromRef = useRef<number[]>(cachedRadii(shape));
  const currentRef = useRef<number[]>(cachedRadii(shape));
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const tempoRef = useRef(tempo);
  const wobbleRef = useRef(wobble);
  tempoRef.current = tempo;
  wobbleRef.current = wobble;

  // Shape morphing: interpolate the radii of the previous shape into the new one.
  useEffect(() => {
    const target = cachedRadii(shape);
    if (still) {
      currentRef.current = target;
      setPath(radiiToPath(target, 100, 100, 78));
      return;
    }
    fromRef.current = currentRef.current;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / MORPH_MS);
      const e = easeInOut(t);
      const radii = lerpRadii(fromRef.current, target, e);
      // Soft breathing wobble so the blob always feels alive.
      const phase = (now / 900) * tempoRef.current;
      const w = wobbleRef.current;
      const live = radii.map(
        (r, i) =>
          r *
          (1 +
            0.016 * w * Math.sin(phase + (i / radii.length) * Math.PI * 4) +
            0.01 * w * Math.sin(phase * 0.7 + (i / radii.length) * Math.PI * 6)),
      );
      currentRef.current = radii;
      setPath(radiiToPath(live, 100, 100, 78));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [shape, still]);

  // Blink loop.
  useEffect(() => {
    if (still) return;
    let timeout: ReturnType<typeof setTimeout>;
    const loop = () => {
      timeout = setTimeout(() => {
        setBlink(0);
        timeout = setTimeout(() => {
          setBlink(1);
          loop();
        }, 110);
      }, blinkEvery * (0.6 + Math.random() * 0.8));
    };
    loop();
    return () => clearTimeout(timeout);
  }, [still, blinkEvery]);

  return (
    <svg
      ref={ref}
      role="img"
      aria-label={`Avatar bloub, forme ${shape}, expression ${expression}`}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={path} fill={color} />
      <g
        transform={`translate(100 105) scale(${faceScale}) translate(-100 -105)`}
      >
        {renderFace(expression, ink, blink)}
      </g>
    </svg>
  );
});
