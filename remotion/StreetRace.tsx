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
const RED = "#ff3b30";
const GREEN = "#3ddc6a";

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

function TrafficLight({ lit }: { lit: "red" | "green" }) {
  const dots: Array<{ color: string; on: boolean }> = [
    { color: RED, on: lit === "red" },
    { color: AMBER, on: false },
    { color: GREEN, on: lit === "green" },
  ];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "16px 12px",
        background: "#0a0908",
        border: `1px solid ${BEZEL}`,
        borderRadius: 14,
      }}
    >
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: d.on ? d.color : "#221f1c",
            boxShadow: d.on ? `0 0 24px 6px ${d.color}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function RedLightScene() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
  const zoom = 1.05 + progress * 0.06;
  const pulse = 0.25 + Math.max(0, Math.sin(frame / 9)) * 0.25 * progress;
  const lightIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Img
        src={CAR_PHOTO}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `blur(20px) brightness(0.35) saturate(0.9)`,
          transform: `scale(${zoom})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, rgba(255,45,30,${pulse}) 0%, transparent 65%)`,
        }}
      />
      <Vignette />
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: lightIn }}>
        <TrafficLight lit="red" />
      </div>
    </AbsoluteFill>
  );
}

function LaunchScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [0, 6, 18], [1, 0.55, 0], { extrapolateRight: "clamp" });
  const blur = interpolate(frame, [0, 30], [2, 22], { extrapolateRight: "clamp" });
  const split = spring({ frame, fps, config: { damping: 12 } });
  const titleIn = spring({ frame: frame - 8, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        <div style={{ width: "50%", height: "100%", overflow: "hidden", transform: `translateX(${-split * 6}px)` }}>
          <Img
            src={CAR_PHOTO}
            style={{
              width: "200%",
              height: "100%",
              objectFit: "cover",
              filter: `blur(${blur}px) brightness(0.55)`,
            }}
          />
        </div>
        <div style={{ width: "50%", height: "100%", overflow: "hidden", transform: `translateX(${split * 6}px) scaleX(-1)` }}>
          <Img
            src={CAR_PHOTO}
            style={{
              width: "200%",
              height: "100%",
              objectFit: "cover",
              filter: `blur(${blur}px) brightness(0.55)`,
            }}
          />
        </div>
      </div>
      <Vignette />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#eef4ef",
          opacity: flash,
        }}
      />
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <TrafficLight lit="green" />
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            transform: `scale(${0.7 + titleIn * 0.3})`,
            opacity: Math.min(1, titleIn * 1.4),
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 84,
            color: INK,
            textAlign: "center",
          }}
        >
          3.20 <span style={{ color: AMBER }}>VS</span> 3.20
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function SpeedStreaks({ frame, count }: { frame: number; count: number }) {
  const lines = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {lines.map((i) => {
        const period = 14 + Math.floor(hash(i) * 10);
        const phase = hash(i + 50) * period;
        const local = ((frame + phase) % period) / period;
        const y = 120 + hash(i + 200) * 1680;
        const width = interpolate(local, [0, 0.5, 1], [0, 340, 0]);
        const opacity = interpolate(local, [0, 0.15, 0.7, 1], [0, 0.55, 0.3, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: y,
              left: local > 0.5 ? "auto" : 0,
              right: local > 0.5 ? 0 : "auto",
              width,
              height: 3,
              background: `linear-gradient(${local > 0.5 ? "270deg" : "90deg"}, transparent, ${AMBER})`,
              opacity,
            }}
          />
        );
      })}
    </>
  );
}

function SpeedCounter({ frame }: { frame: number }) {
  const value = Math.round(interpolate(frame, [0, 60], [60, 214], { extrapolateRight: "clamp" }));
  const flicker = 0.85 + Math.sin(frame / 4) * 0.15;
  return (
    <div style={{ textAlign: "center", opacity: flicker }}>
      <div
        style={{
          fontFamily: "monospace",
          fontWeight: 700,
          fontSize: 110,
          color: INK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 22, letterSpacing: 3, color: INK_MUTED }}>
        KM/S
      </div>
    </div>
  );
}

function RaceScene() {
  const frame = useCurrentFrame();
  const spread = interpolate(frame, [0, 60], [0, 90], { extrapolateRight: "clamp" });
  const blur = interpolate(frame, [0, 60], [22, 40], { extrapolateRight: "clamp" });
  const punch = frame % 15 < 2 ? 0.12 : 0;

  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        <div style={{ width: "50%", height: "100%", overflow: "hidden", transform: `translateX(${-spread}px)` }}>
          <Img
            src={CAR_PHOTO}
            style={{ width: "200%", height: "100%", objectFit: "cover", filter: `blur(${blur}px) brightness(0.5)` }}
          />
        </div>
        <div style={{ width: "50%", height: "100%", overflow: "hidden", transform: `translateX(${spread}px) scaleX(-1)` }}>
          <Img
            src={CAR_PHOTO}
            style={{ width: "200%", height: "100%", objectFit: "cover", filter: `blur(${blur}px) brightness(0.5)` }}
          />
        </div>
      </div>
      <SpeedStreaks frame={frame} count={22} />
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: punch }} />
      <Vignette />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SpeedCounter frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
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

function PhotoFinishScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [0, 4, 14], [1, 0.4, 0], { extrapolateRight: "clamp" });
  const stamp = spring({ frame: frame - 6, fps, config: { damping: 9 } });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        <div style={{ width: "50%", height: "100%", overflow: "hidden" }}>
          <Img
            src={CAR_PHOTO}
            style={{ width: "200%", height: "100%", objectFit: "cover", filter: "grayscale(1) brightness(0.45) contrast(1.1)" }}
          />
        </div>
        <div style={{ width: "50%", height: "100%", overflow: "hidden", transform: "scaleX(-1)" }}>
          <Img
            src={CAR_PHOTO}
            style={{ width: "200%", height: "100%", objectFit: "cover", filter: "grayscale(1) brightness(0.45) contrast(1.1)" }}
          />
        </div>
      </div>
      <Grain frame={frame} />
      <Vignette />
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            transform: `scale(${0.7 + Math.min(1, stamp) * 0.35}) rotate(-6deg)`,
            opacity: Math.min(1, stamp * 1.4),
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 88,
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

      <Sequence from={0} durationInFrames={60}>
        <RedLightScene />
      </Sequence>
      <Sequence from={60} durationInFrames={30}>
        <LaunchScene />
      </Sequence>
      <Sequence from={90} durationInFrames={60}>
        <RaceScene />
      </Sequence>
      <Sequence from={150} durationInFrames={40}>
        <PhotoFinishScene />
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
