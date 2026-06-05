"use client";

import { motion } from "framer-motion";

type Props = {
  completedCount: number;
  level: number;
  // 0–100. Below ~50 the plant visibly wilts: leaves desaturate, droop, and
  // the canopy thins. Recovers when the mentee completes tasks.
  health?: number;
};

// Interpolate leaf colour from healthy green toward a dry, faded tone as health
// falls. Keeps the silhouette but drains the life out of it.
function leafColors(health: number): { primary: string; accent: string } {
  if (health >= 75) return { primary: "#2E8B57", accent: "#A8D5B5" };
  if (health >= 50) return { primary: "#5C8A4A", accent: "#C2CFA0" };
  if (health >= 25) return { primary: "#8A8A3A", accent: "#CBC089" };
  return { primary: "#A98B4A", accent: "#D8C79A" };
}

const TRUNK = "M 120 260 C 118 220 115 180 118 140 C 120 110 122 80 120 50";

const BRANCHES = [
  {
    d: "M 118 200 C 100 190 80 175 60 170",
    tip: [60, 170] as [number, number],
  },
  {
    d: "M 120 200 C 138 190 158 175 178 172",
    tip: [178, 172] as [number, number],
  },
  {
    d: "M 119 160 C 100 148 78 138 55 130",
    tip: [55, 130] as [number, number],
  },
  {
    d: "M 120 160 C 140 148 162 138 185 132",
    tip: [185, 132] as [number, number],
  },
  { d: "M 119 120 C 102 108 85 95 65 88", tip: [65, 88] as [number, number] },
  {
    d: "M 120 120 C 138 108 155 95 175 90",
    tip: [175, 90] as [number, number],
  },
];

// Extra scatter leaves per branch (offsets from tip)
const LEAF_SCATTERS: [number, number][][] = [
  [
    [-8, -6],
    [6, -10],
  ],
  [
    [8, -6],
    [-6, -10],
  ],
  [
    [-10, -5],
    [5, -12],
  ],
  [
    [10, -5],
    [-5, -12],
  ],
  [
    [-8, -8],
    [7, -5],
  ],
  [
    [8, -8],
    [-7, -5],
  ],
];

function branchCount(completedCount: number): number {
  if (completedCount >= 6) return 6;
  if (completedCount >= 3) return 4;
  return 2;
}

export function GrowthTree({ completedCount, level, health = 100 }: Props) {
  const visibleBranches = branchCount(completedCount);
  const showLeaves = completedCount >= 3;
  const showSun = completedCount >= 6 && health >= 50;
  const isWilting = health < 50;
  const { primary: leafPrimary, accent: leafAccent } = leafColors(health);
  // Wilting droops the canopy and slows the sway; vitality drives leaf opacity.
  const droop = isWilting ? (50 - health) / 12 : 0;
  const leafOpacity = 0.5 + (health / 100) * 0.4;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 240 280"
        className="w-full max-w-[260px]"
        aria-label="Growth Tree visualisation"
      >
        <title>Growth Tree</title>
        {/* Background */}
        <rect x="4" y="4" width="232" height="272" rx="20" fill="#F0EDE8" />

        {/* Sun (level 3) */}
        {showSun && (
          <motion.circle
            cx={175}
            cy={45}
            r={22}
            fill="#F5A623"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
          />
        )}

        {/* Soil */}
        <ellipse
          cx="120"
          cy="262"
          rx="28"
          ry="7"
          fill="#A8D5B5"
          opacity="0.6"
        />

        {/* Trunk with idle sway — slows and stills as the plant wilts */}
        <motion.g
          animate={{ rotate: isWilting ? [0, 0.4, -0.4, 0] : [0, 1, -1, 0] }}
          transition={{
            duration: isWilting ? 7 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "120px 260px" }}
        >
          <motion.path
            d={TRUNK}
            stroke="#1A5C3A"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </motion.g>

        {/* Branches */}
        {BRANCHES.slice(0, visibleBranches).map((branch, i) => (
          <motion.path
            key={branch.d}
            d={branch.d}
            stroke="#2E8B57"
            strokeWidth={4 - i * 0.3}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.5 + i * 0.15,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Leaves at branch tips */}
        {showLeaves &&
          BRANCHES.slice(0, visibleBranches).map((branch, i) => {
            const [tx, ty] = branch.tip;
            const scatters = LEAF_SCATTERS[i] ?? [];
            const allLeafPoints: [number, number][] = [
              [tx, ty],
              ...scatters.map(
                ([dx, dy]) => [tx + dx, ty + dy] as [number, number],
              ),
            ];
            return allLeafPoints.map(([cx, cy], j) => (
              <motion.circle
                key={`leaf-${cx}-${cy}`}
                cx={cx}
                cy={cy + droop}
                r={j === 0 ? 7 : 5}
                fill={j % 2 === 0 ? leafAccent : leafPrimary}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: isWilting ? 0.85 : 1, opacity: leafOpacity }}
                transition={{
                  type: "spring",
                  delay: 0.8 + i * 0.1 + j * 0.06,
                  stiffness: 200,
                  damping: 15,
                }}
              />
            ));
          })}

        {/* Level badge */}
        <text
          x="120"
          y="18"
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="#1A5C3A"
          fontFamily="inherit"
        >
          {level === 1 ? "Explorer" : level === 2 ? "Advocate" : "Mentor"} —
          Level {level}
        </text>
      </svg>
    </div>
  );
}
