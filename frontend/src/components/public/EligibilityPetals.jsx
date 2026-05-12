import { useMemo } from "react";

/** Couleurs vives unies (style confetti type référence) */
const CONFETTI_COLORS = [
  "#00e676",
  "#00bcd4",
  "#ffeb3b",
  "#e91e63",
  "#9c27b0",
  "#ff5722",
  "#76ff03",
  "#40c4ff",
  "#ffd600",
  "#7c4dff",
  "#ff1744",
  "#18ffff",
];

/** Simple seeded PRNG */
function makeRng(seed) {
  let s = Math.max(1, seed | 0);
  return () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return (s & 0xfffffff) / 0xfffffff;
  };
}

function rand(rng, min, max) {
  return min + rng() * (max - min);
}

const TRACK_COUNT = 8;

/**
 * Confetti éligibilité : cercles + pastilles plates, couleurs saturées (sans dégradé).
 * @param {{ burstId?: number }} props
 */
export function EligibilityPetals({ burstId = 0 }) {
  const pieces = useMemo(() => {
    const rng = makeRng(burstId * 7919 + 104729);
    const count = 78;
    return Array.from({ length: count }, (_, i) => {
      const isCircle = rng() > 0.42;
      let w;
      let h;
      if (isCircle) {
        const s = rand(rng, 4, 11);
        w = s;
        h = s;
      } else {
        w = rand(rng, 11, 22);
        h = rand(rng, 4, 8);
      }
      return {
        id: `${burstId}-${i}`,
        track: i % TRACK_COUNT,
        shape: isCircle ? "circle" : "pill",
        left: `${rand(rng, 0, 100)}%`,
        top: `${rand(rng, -18, 8)}%`,
        delay: `${rand(rng, 0, 1.15)}s`,
        duration: `${rand(rng, 2.1, 3.6)}s`,
        w,
        h,
        color: CONFETTI_COLORS[(Math.floor(rng() * 1e6) + i) % CONFETTI_COLORS.length],
        rotation: rand(rng, 0, 360),
      };
    });
  }, [burstId]);

  return (
    <div className="eligibility-confetti-layer" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`eligibility-confetti-outer eligibility-confetti-outer--t${p.track}`}
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          <span
            className={`eligibility-confetti-shape eligibility-confetti-shape--${p.shape}`}
            style={{
              width: `${p.w}px`,
              height: `${p.h}px`,
              backgroundColor: p.color,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
