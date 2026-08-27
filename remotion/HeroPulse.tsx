import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const BG = "#050506";
const ACCENT = "#ffb020";
const CELL = 64;
const PULSE_PERIODS = [60, 75, 100, 150]; // frame counts, all divisors of the 300-frame loop

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function GridPulses({
  width,
  height,
  frame,
}: {
  width: number;
  height: number;
  frame: number;
}) {
  const cols = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(height / CELL) + 1;
  const nodes: React.ReactNode[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = row * cols + col;
      if (hash(id) > 0.08) continue; // sparse — ~8% of intersections pulse

      const period = PULSE_PERIODS[Math.floor(hash(id + 100) * PULSE_PERIODS.length)];
      const offset = Math.floor(hash(id + 200) * period);
      const local = ((frame + offset) % period) / period;
      const pulse = Math.sin(local * Math.PI); // 0 -> 1 -> 0, seamless per-period loop
      const opacity = interpolate(pulse, [0, 1], [0, 0.85]);
      const scale = interpolate(pulse, [0, 1], [0.4, 1.6]);

      nodes.push(
        <circle key={id} cx={col * CELL} cy={row * CELL} r={3 * scale} fill={ACCENT} opacity={opacity} />
      );
    }
  }

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      {nodes}
    </svg>
  );
}

export function LightSweep({
  width,
  height,
  frame,
  durationInFrames,
  index,
}: {
  width: number;
  height: number;
  frame: number;
  durationInFrames: number;
  index: number;
}) {
  const period = durationInFrames; // exactly one sweep per full loop — inherently seamless
  const phase = (index / 3) * period;
  const local = ((frame + phase) % period) / period;
  const diagonal = width + height;
  const pos = interpolate(local, [0, 1], [-diagonal * 0.3, diagonal * 1.1]);
  const opacity = interpolate(local, [0, 0.1, 0.5, 0.9, 1], [0, 0.5, 0.5, 0, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: pos - height,
        width: 2,
        height: height * 2.4,
        background: `linear-gradient(180deg, transparent, ${ACCENT}, transparent)`,
        transform: "rotate(35deg)",
        transformOrigin: "top left",
        opacity,
        filter: "blur(1px)",
      }}
    />
  );
}

export function HeroPulse() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <GridPulses width={width} height={height} frame={frame} />
      {[0, 1, 2].map((i) => (
        <LightSweep
          key={i}
          width={width}
          height={height}
          frame={frame}
          durationInFrames={durationInFrames}
          index={i}
        />
      ))}
    </AbsoluteFill>
  );
}
