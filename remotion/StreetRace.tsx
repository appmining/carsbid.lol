import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { GridPulses, LightSweep } from "./HeroPulse";
import { CAR_IMAGES } from "../src/data/carImages.generated";

const BG = "#050506";
const INK = "#ede7da";
const INK_MUTED = "#9a9287";
const BEZEL = "#2a2621";
const AMBER = "#ffb020";
const AMBER_BRIGHT = "#ffc65a";

const SANS = "Arial, Helvetica, sans-serif";
const CAR_PHOTO = CAR_IMAGES["bmw-3-serisi"].wide;

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Eyebrow({ children, opacity = 1 }: { children: React.ReactNode; opacity?: number }) {
  return (
    <div
      style={{
        opacity,
        fontFamily: "monospace",
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 4,
        color: AMBER,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function Vignette() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at center, transparent 40%, rgba(5,5,6,0.85) 100%)",
      }}
    />
  );
}

function Grain({ frame }: { frame: number }) {
  const opacity = 0.05 + hash(Math.floor(frame / 2)) * 0.05;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "3px 3px",
      }}
    />
  );
}

function Particles({ frame, count }: { frame: number; count: number }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {items.map((i) => {
        const startY = 400 + hash(i) * 1400;
        const x = 60 + hash(i + 40) * 960;
        const speed = 0.35 + hash(i + 80) * 0.85;
        const size = 2 + hash(i + 120) * 3;
        const y = startY - frame * speed;
        if (y < -20 || y > 1940) return null;
        const twinkle = 0.25 + Math.max(0, Math.sin(frame / 8 + i)) * 0.55;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: AMBER_BRIGHT,
              opacity: twinkle,
              boxShadow: `0 0 ${size * 3}px ${AMBER}`,
            }}
          />
        );
      })}
    </>
  );
}

function GlitchBars({ frame }: { frame: number }) {
  if (frame < 0 || frame > 10) return null;
  const bars = Array.from({ length: 6 }, (_, i) => i);
  return (
    <>
      {bars.map((i) => {
        const seed = i + frame * 5;
        const y = hash(seed) * 1920;
        const h = 4 + hash(seed + 1) * 40;
        const shift = (hash(seed + 2) - 0.5) * 70;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: y,
              left: 0,
              right: 0,
              height: h,
              transform: `translateX(${shift}px)`,
              background: hash(seed + 3) > 0.5 ? "rgba(255,176,32,0.35)" : "rgba(255,255,255,0.2)",
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </>
  );
}

function HeroLine({
  text,
  frame,
  from,
  hold,
}: {
  text: string;
  frame: number;
  from: number;
  hold: number;
}) {
  const local = frame - from;
  const opacity = interpolate(local, [0, 12, hold, hold + 14], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(local, [0, 12], [22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(local, [0, 12], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px) scale(${scale})`,
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 76,
          color: INK,
          textAlign: "center",
          padding: "0 90px",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

// Single continuous cinematic shot (0-190f): one hero car photo under a slow
// zoom/drift camera move, narrated by kinetic type instead of a literal race,
// ending on a freeze-frame "KAZANAN YOK" stamp.
function HeroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 190], [1.05, 1.34], { extrapolateRight: "clamp" });
  const panX = interpolate(frame, [0, 190], [0, -26], { extrapolateRight: "clamp" });
  const shake = Math.sin(frame / 5) * 1.2 + Math.sin(frame / 13) * 0.6;
  const brightness = interpolate(frame, [0, 190], [0.5, 0.42]);

  const freezeStart = 128;
  const isFrozen = frame >= freezeStart;
  const desaturate = interpolate(frame, [freezeStart, freezeStart + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flash = interpolate(frame, [freezeStart, freezeStart + 3, freezeStart + 14], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stamp = spring({ frame: frame - (freezeStart + 8), fps, config: { damping: 9 } });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Img
        src={CAR_PHOTO}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `brightness(${brightness}) saturate(${1 - desaturate * 0.9}) grayscale(${desaturate})`,
          transform: `scale(${zoom}) translate(${panX + shake}px, ${shake}px)`,
        }}
      />
      <Particles frame={frame} count={26} />
      <Vignette />
      {isFrozen && <Grain frame={frame} />}
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
      <GlitchBars frame={frame - (freezeStart - 8)} />

      <HeroLine text="İki genç." frame={frame} from={0} hold={30} />
      <HeroLine text="Aynı araba." frame={frame} from={40} hold={30} />
      <HeroLine text="Aynı gece." frame={frame} from={80} hold={32} />

      {isFrozen && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              transform: `scale(${0.7 + Math.min(1, Math.max(0, stamp)) * 0.35}) rotate(-6deg)`,
              opacity: Math.min(1, Math.max(0, stamp) * 1.4),
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 84,
              color: INK,
              border: `4px solid ${INK}`,
              borderRadius: 12,
              padding: "18px 40px",
              letterSpacing: 2,
            }}
          >
            KAZANAN YOK
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

function TransitionLineScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 18], [16, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 58,
          color: INK,
          textAlign: "center",
          padding: "0 100px",
        }}
      >
        Sokakta kazanan belli olmaz.
      </div>
    </AbsoluteFill>
  );
}

function VoteCounter({ target, frame, fps }: { target: number; frame: number; fps: number }) {
  const progress = spring({ frame, fps, config: { damping: 200, stiffness: 60 } });
  const value = Math.round(interpolate(progress, [0, 1], [0, target]));
  return (
    <div
      style={{
        fontFamily: "monospace",
        fontWeight: 700,
        fontSize: 96,
        color: INK,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value.toLocaleString("tr-TR")}
    </div>
  );
}

function StreetVoteScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headline = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const cardIn = spring({ frame: frame - 20, fps, config: { damping: 13 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.03;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "0 80px" }}>
        <div style={{ opacity: headline, marginBottom: 34 }}>
          <Eyebrow>AMA CARSBID.LOL&apos;DE BELLİ</Eyebrow>
        </div>

        <div
          style={{
            opacity: Math.min(1, cardIn * 1.4),
            transform: `scale(${0.85 + cardIn * 0.15})`,
            background: "linear-gradient(180deg,#151311,#0a0908)",
            border: `1px solid ${BEZEL}`,
            borderRadius: 28,
            padding: "44px 56px",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: INK }}>
            BMW 3 Serisi
          </div>
          <VoteCounter target={9822} frame={frame - 24} fps={fps} />
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: 3,
              color: INK_MUTED,
            }}
          >
            TOPLAM OY
          </div>
        </div>

        <div
          style={{
            opacity: interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" }),
            marginTop: 40,
            transform: `scale(${pulse})`,
            display: "inline-block",
            background: AMBER,
            color: BG,
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 34,
            padding: "20px 52px",
            borderRadius: 999,
          }}
        >
          Ücretsiz Oy Ver
        </div>
      </div>
    </AbsoluteFill>
  );
}

function PriceBadge({ value, color }: { value: string; color: string }) {
  return (
    <div
      style={{
        fontFamily: "monospace",
        fontWeight: 700,
        fontSize: 40,
        color,
        background: "rgba(255,176,32,0.12)",
        border: `1px solid ${color}`,
        borderRadius: 14,
        padding: "10px 26px",
      }}
    >
      ${value}
    </div>
  );
}

function PatronRevealScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headline = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const cardIn = spring({ frame: frame - 15, fps, config: { damping: 13 } });

  const flip1 = frame > 40 && frame < 60;
  const flip2 = frame >= 60;
  const priceScale = spring({ frame: frame - 40, fps, config: { damping: 9 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "0 80px" }}>
        <div style={{ opacity: headline, marginBottom: 34 }}>
          <Eyebrow>BMW 3 SERİSİ&apos;NİN PATRONU</Eyebrow>
        </div>

        <div
          style={{
            opacity: Math.min(1, cardIn * 1.4),
            transform: `scale(${0.85 + cardIn * 0.15})`,
            background: "linear-gradient(180deg,#151311,#0a0908)",
            border: `1px solid ${BEZEL}`,
            borderRadius: 28,
            padding: "40px 52px",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            minWidth: 460,
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${AMBER_BRIGHT}, ${AMBER})`,
              display: "grid",
              placeItems: "center",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 30,
              color: BG,
            }}
          >
            3.2
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: INK }}>
            @320.tribe
          </div>
          <div
            style={{
              transform: `scale(${flip1 || flip2 ? 0.9 + priceScale * 0.1 : 1})`,
            }}
          >
            <PriceBadge value={frame < 40 ? "2" : flip1 ? "5" : "8"} color={AMBER} />
          </div>
        </div>

        <div
          style={{
            opacity: interpolate(frame, [78, 90], [0, 1], { extrapolateRight: "clamp" }),
            marginTop: 36,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 32,
            color: INK,
          }}
        >
          BMW 3 Serisi&apos;nin Patronu Oldu
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Mark({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} fill="none">
      <path
        d="M30 14.5A13 13 0 1 0 30 29.5"
        stroke={AMBER}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="30.5" cy="22" r="2.6" fill={AMBER} />
    </svg>
  );
}

function CtaScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 12 } });
  const taglineOpacity = interpolate(frame, [20, 36], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ transform: `scale(${0.7 + logoIn * 0.3})`, opacity: logoIn, marginBottom: 8 }}>
          <Mark size={140} />
        </div>
        <div
          style={{
            transform: `scale(${0.85 + logoIn * 0.15})`,
            opacity: logoIn,
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 76,
            color: INK,
          }}
        >
          carsbid<span style={{ color: AMBER }}>.lol</span>
        </div>
        <div style={{ opacity: taglineOpacity, marginTop: 18 }}>
          <Eyebrow>PATRON OL &middot; ZİRVEYE TAŞI</Eyebrow>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function StreetRace() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: BG, fontFamily: SANS }}>
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

      <Sequence from={0} durationInFrames={190}>
        <HeroScene />
      </Sequence>
      <Sequence from={190} durationInFrames={40}>
        <TransitionLineScene />
      </Sequence>
      <Sequence from={230} durationInFrames={110}>
        <StreetVoteScene />
      </Sequence>
      <Sequence from={340} durationInFrames={90}>
        <PatronRevealScene />
      </Sequence>
      <Sequence from={430} durationInFrames={70}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
}
