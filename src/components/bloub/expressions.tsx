import type { ReactNode } from "react";
import monstrousExpression from "@/assets/expression-monstrueux-blanc.png?inline";

export type ExpressionId =
  | "neutre"
  | "attentif"
  | "surpris"
  | "excite"
  | "heureux"
  | "hilare"
  | "colere"
  | "triste"
  | "effraye"
  | "mefiant"
  | "confus"
  | "curieux"
  | "fier"
  | "timide"
  | "blase"
  | "somnolent"
  | "monstrueux";

export const EXPRESSIONS: { id: ExpressionId; label: string }[] = [
  { id: "neutre", label: "Neutre" },
  { id: "attentif", label: "Attentif" },
  { id: "surpris", label: "Surpris" },
  { id: "excite", label: "Excité" },
  { id: "heureux", label: "Heureux" },
  { id: "hilare", label: "Hilare" },
  { id: "colere", label: "En colère" },
  { id: "triste", label: "Triste" },
  { id: "effraye", label: "Effrayé" },
  { id: "mefiant", label: "Méfiant" },
  { id: "confus", label: "Confus" },
  { id: "curieux", label: "Curieux" },
  { id: "fier", label: "Fier" },
  { id: "timide", label: "Timide" },
  { id: "blase", label: "Blasé" },
  { id: "somnolent", label: "Somnolent" },
  { id: "monstrueux", label: "Monstrueux" },
];

/** Visual calibration for each face, centered inside every avatar shape. */
export const EXPRESSION_SCALES: Record<ExpressionId, number> = {
  neutre: 1.48,
  attentif: 1.36,
  surpris: 1.2,
  excite: 1.2,
  heureux: 1.22,
  hilare: 1.12,
  colere: 1.28,
  triste: 1.12,
  effraye: 1.12,
  mefiant: 1.28,
  confus: 1.16,
  curieux: 1.22,
  fier: 1.18,
  timide: 1.3,
  blase: 1.3,
  somnolent: 1.28,
  monstrueux: 0.92,
};

const LX = 82;
const RX = 118;
const EY = 96;

/** Rounded capsule eye. */
function capsule(x: number, y: number, w: number, h: number, fill: string, key: string) {
  return (
    <rect
      key={key}
      x={x - w / 2}
      y={y - h / 2}
      width={w}
      height={h}
      rx={Math.min(w, h) / 2}
      fill={fill}
    />
  );
}

function stroke(d: string, fill: string, key: string, width = 5) {
  return (
    <path
      key={key}
      d={d}
      fill="none"
      stroke={fill}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

export function renderFace(
  expression: ExpressionId,
  ink: string,
  blink: number,
): ReactNode {
  // blink: 1 = open, 0 = closed. Applied to tall eyes only.
  const k = (h: number) => Math.max(1.6, h * blink);

  switch (expression) {
    case "neutre":
      return [
        capsule(LX, EY, 9, k(9), ink, "l"),
        capsule(RX, EY, 9, k(9), ink, "r"),
      ];
    case "attentif":
      return [
        capsule(LX, EY, 10, k(22), ink, "l"),
        capsule(RX, EY, 10, k(22), ink, "r"),
      ];
    case "surpris":
      return [
        capsule(LX, EY, 20, k(20), ink, "l"),
        capsule(RX, EY, 20, k(20), ink, "r"),
      ];
    case "excite":
      return [
        capsule(LX, EY - 4, 16, k(16), ink, "l"),
        capsule(RX, EY - 4, 16, k(16), ink, "r"),
        stroke("M 88 122 Q 100 136 112 122", ink, "m", 6),
      ];
    case "heureux":
      return [
        stroke("M 72 100 Q 82 86 92 100", ink, "l", 6),
        stroke("M 108 100 Q 118 86 128 100", ink, "r", 6),
      ];
    case "hilare":
      return [
        stroke("M 72 96 Q 82 82 92 96", ink, "l", 6),
        stroke("M 108 96 Q 118 82 128 96", ink, "r", 6),
        stroke("M 84 116 Q 100 134 116 116", ink, "m", 6),
      ];
    case "colere":
      return [
        <g key="l" transform={`rotate(20 ${LX} ${EY})`}>
          {capsule(LX, EY, 11, k(19), ink, "le")}
        </g>,
        <g key="r" transform={`rotate(-20 ${RX} ${EY})`}>
          {capsule(RX, EY, 11, k(19), ink, "re")}
        </g>,
      ];
    case "triste":
      return [
        stroke("M 72 92 Q 82 104 92 92", ink, "l", 6),
        stroke("M 108 92 Q 118 104 128 92", ink, "r", 6),
        stroke("M 88 128 Q 100 118 112 128", ink, "m", 5),
      ];
    case "effraye":
      return [
        capsule(LX, EY - 2, 22, k(24), ink, "l"),
        capsule(RX, EY - 2, 22, k(24), ink, "r"),
        <ellipse key="m" cx={100} cy={128} rx={7} ry={6} fill={ink} />,
      ];
    case "mefiant":
      return [
        capsule(LX, EY, 20, k(8), ink, "l"),
        capsule(RX, EY, 14, k(8), ink, "r"),
      ];
    case "confus":
      return [
        capsule(LX, EY, 18, k(18), ink, "l"),
        capsule(RX, EY + 2, 10, k(10), ink, "r"),
        stroke("M 86 124 q 7 -8 14 0 q 7 8 14 0", ink, "m", 4),
      ];
    case "curieux":
      return [
        capsule(LX, EY, 12, k(18), ink, "l"),
        stroke("M 108 100 Q 118 86 128 100", ink, "r", 6),
      ];
    case "fier":
      return [
        stroke("M 72 98 Q 82 86 92 98", ink, "l", 6),
        stroke("M 108 98 Q 118 86 128 98", ink, "r", 6),
        stroke("M 88 122 L 112 122", ink, "m", 5),
      ];
    case "timide":
      return [
        capsule(LX, EY + 2, 9, k(9), ink, "l"),
        capsule(RX, EY + 2, 9, k(9), ink, "r"),
        stroke("M 92 124 Q 100 130 108 124", ink, "m", 4),
      ];
    case "blase":
      return [
        capsule(LX, EY, 20, 5, ink, "l"),
        capsule(RX, EY, 20, 5, ink, "r"),
      ];
    case "somnolent":
      return [
        stroke("M 72 98 L 92 98", ink, "l", 5),
        stroke("M 108 98 L 128 98", ink, "r", 5),
        stroke("M 92 124 L 108 124", ink, "m", 4),
      ];
    case "monstrueux":
      return (
        <image
          href={monstrousExpression}
          x={0}
          y={0}
          width={200}
          height={200}
          preserveAspectRatio="xMidYMid meet"
        />
      );
    default:
      return null;
  }
}
