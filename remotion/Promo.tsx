import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

const RED = "#e11d2e";
const BG = "#07080a";
const GOLD = "#d4af37";

function Digits({
  value,
  delay,
  frame,
  fps,
}: {
  value: string;
  delay: number;
  frame: number;
  fps: number;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {value.split("").map((digit, i) => {
        const local = frame - delay - i * 2;
        const roll = spring({ frame: local, fps, config: { damping: 200, stiffness: 90 } });
        const shown = Math.min(9, Math.round(roll * 9));
        const display = local < 0 ? "0" : local > fps * 0.6 ? digit : String(shown);
        return (
          <div
            key={i}
            style={{
              width: 64,
              height: 88,
              borderRadius: 10,
              background: "linear-gradient(180deg,#1c1f26,#0e1013)",
              border: "1px solid #262a33",
              display: "grid",
              placeItems: "center",
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: 52,
              color: "#f5f6f7",
              boxShadow: "inset 0 -10px 16px rgba(0,0,0,0.5)",
            }}
          >
            {display}
          </div>
        );
      })}
    </div>
  );
}

export function Promo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 14 } });
  const headlineOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const headlineY = interpolate(frame, [10, 30], [24, 0], { extrapolateRight: "clamp" });
  const statsOpacity = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });
  const ctaOpacity = interpolate(frame, [95, 115], [0, 1], { extrapolateRight: "clamp" });
  const ctaScale = spring({ frame: frame - 95, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(225,29,46,0.18), transparent 70%)",
        }}
      />

      <div
        style={{
          transform: `scale(${0.7 + logoIn * 0.3})`,
          opacity: logoIn,
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: RED,
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg viewBox="0 0 24 24" width={30} height={30} fill="none">
            <path
              d="M4 16.5 5.4 12a2 2 0 0 1 1.9-1.4h9.4a2 2 0 0 1 1.9 1.4l1.4 4.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="3" y="16.5" width="18" height="3" rx="1.2" stroke="white" strokeWidth="1.6" />
          </svg>
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: "white" }}>
          carsbid<span style={{ color: RED }}>.lol</span>
        </div>
      </div>

      <div
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          fontSize: 46,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          maxWidth: width * 0.8,
          lineHeight: 1.2,
        }}
      >
        Favori araba modelini <span style={{ color: RED }}>zirveye taşı</span>
      </div>

      <Sequence from={40}>
        <div style={{ opacity: statsOpacity, marginTop: 40 }}>
          <Digits value="9822" delay={0} frame={frame - 40} fps={fps} />
        </div>
        <div
          style={{
            opacity: statsOpacity,
            marginTop: 10,
            textAlign: "center",
            color: "#9aa0ac",
            fontSize: 20,
            letterSpacing: 2,
          }}
        >
          TOPLAM OY
        </div>
      </Sequence>

      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${0.85 + ctaScale * 0.15})`,
          marginTop: 48,
          background: RED,
          color: "white",
          fontSize: 26,
          fontWeight: 700,
          padding: "18px 40px",
          borderRadius: 999,
        }}
      >
        Sosyal Hesabını Tanıt →
      </div>

      <div
        style={{
          opacity: ctaOpacity,
          position: "absolute",
          bottom: height * 0.08,
          color: GOLD,
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        carsbid.lol
      </div>
    </AbsoluteFill>
  );
}
