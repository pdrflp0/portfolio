export function PedroParts() {
  return (
    <>
      <g className="player-leg leg-a">
        <rect className="player-jeans" x="-5" y="-12" width="4" height="10" />
        <rect className="player-shoe" x="-5" y="-2" width="5" height="2" />
      </g>
      <g className="player-leg leg-b">
        <rect className="player-jeans" x="1" y="-12" width="4" height="10" />
        <rect className="player-shoe" x="1" y="-2" width="5" height="2" />
      </g>
      <g className="player-arm arm-a">
        <rect className="player-shirt-dark" x="-9" y="-27" width="3" height="6" />
        <rect className="player-skin-dark" x="-9" y="-21" width="3" height="7" />
      </g>
      <rect className="player-shirt" x="-6" y="-28" width="12" height="17" />
      <rect className="player-collar" x="-2" y="-28" width="5" height="2" />
      <rect className="player-skin" x="0" y="-28" width="2" height="2" />
      <g className="player-arm arm-b">
        <rect className="player-shirt-dark" x="6" y="-27" width="3" height="6" />
        <rect className="player-skin" x="6" y="-21" width="3" height="7" />
      </g>
      <rect className="player-skin" x="-1" y="-30" width="4" height="2" />
      <rect className="player-skin" x="-5" y="-40" width="11" height="10" />
      <rect className="player-skin-dark" x="-6" y="-36" width="2" height="3" />
      <rect className="player-hair" x="-6" y="-43" width="12" height="4" />
      <rect className="player-hair" x="-7" y="-41" width="3" height="6" />
      <rect className="player-hair" x="-5" y="-45" width="3" height="2" />
      <rect className="player-hair" x="-1" y="-46" width="4" height="3" />
      <rect className="player-hair" x="4" y="-44" width="3" height="3" />
      <rect className="player-hair" x="5" y="-41" width="2" height="2" />
      <rect className="player-hair" x="1" y="-37" width="4" height="1" />
      <rect className="player-eye" x="3" y="-35" width="2" height="2" />
      <rect className="player-hair" x="1" y="-32" width="5" height="1" />
      <rect className="player-hair" x="0" y="-31" width="2" height="2" />
      <rect className="player-hair" x="2" y="-30" width="4" height="2" />
    </>
  );
}

export const PEDRO_PIXELS: [string, number, number, number, number][] = [
  ["#34404f", -5, -12, 4, 10],
  ["#15171b", -5, -2, 5, 2],
  ["#34404f", 1, -12, 4, 10],
  ["#15171b", 1, -2, 5, 2],
  ["#111215", -9, -27, 3, 6],
  ["#c99a7b", -9, -21, 3, 7],
  ["#1b1d21", -6, -28, 12, 17],
  ["#2a2d33", -2, -28, 5, 2],
  ["#e0b394", 0, -28, 2, 2],
  ["#111215", 6, -27, 3, 6],
  ["#e0b394", 6, -21, 3, 7],
  ["#e0b394", -1, -30, 4, 2],
  ["#e0b394", -5, -40, 11, 10],
  ["#c99a7b", -6, -36, 2, 3],
  ["#1d1714", -6, -43, 12, 4],
  ["#1d1714", -7, -41, 3, 6],
  ["#1d1714", -5, -45, 3, 2],
  ["#1d1714", -1, -46, 4, 3],
  ["#1d1714", 4, -44, 3, 3],
  ["#1d1714", 5, -41, 2, 2],
  ["#1d1714", 1, -37, 4, 1],
  ["#1d1714", 3, -35, 2, 2],
  ["#1d1714", 1, -32, 5, 1],
  ["#1d1714", 0, -31, 2, 2],
  ["#1d1714", 2, -30, 4, 2],
];

export type CosmeticId = "none" | "headset" | "cap" | "hardhat" | "shades" | "crown";

const COSMETIC_PIXELS: Record<Exclude<CosmeticId, "none">, [string, number, number, number, number][]> = {
  headset: [
    ["#2a2d33", -6, -47, 13, 1],
    ["#2a2d33", -7, -46, 1, 6],
    ["#2a2d33", 6, -46, 1, 6],
    ["#ff4fd8", -8, -41, 2, 4],
    ["#ff4fd8", 6, -41, 2, 4],
    ["#2a2d33", 7, -37, 1, 3],
    ["#2a2d33", 5, -34, 3, 1],
  ],
  cap: [
    ["#3f6f7e", -6, -48, 12, 4],
    ["#6e9ead", -5, -48, 4, 1],
    ["#3f6f7e", 4, -45, 6, 1],
    ["#ff4fd8", -1, -47, 2, 2],
  ],
  hardhat: [
    ["#d9a441", -6, -49, 12, 5],
    ["#f0c56b", -4, -49, 4, 1],
    ["#b8862d", -8, -45, 16, 1],
    ["#b8862d", -1, -49, 2, 5],
  ],
  shades: [
    ["#0b0c0e", -2, -37, 9, 1],
    ["#0b0c0e", -1, -36, 3, 2],
    ["#0b0c0e", 3, -36, 3, 2],
    ["#f3f0e8", -1, -36, 1, 1],
    ["#f3f0e8", 3, -36, 1, 1],
  ],
  crown: [
    ["#d9a441", -5, -48, 11, 2],
    ["#d9a441", -5, -51, 1, 3],
    ["#d9a441", 0, -52, 1, 4],
    ["#d9a441", 5, -51, 1, 3],
    ["#ff4fd8", 0, -49, 1, 1],
  ],
};

export function Cosmetic({ id }: { id: CosmeticId }) {
  if (id === "none") return null;
  return (
    <>
      {COSMETIC_PIXELS[id].map(([c, x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={c} />
      ))}
    </>
  );
}
