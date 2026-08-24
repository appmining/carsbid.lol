import { Composition } from "remotion";
import { Promo } from "./Promo";
import { HeroPulse } from "./HeroPulse";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HeroPulse"
        component={HeroPulse}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
