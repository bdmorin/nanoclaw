import { Composition } from "remotion";
import { DossierVideo } from "./components/DossierVideo";
import type { SectionAssets } from "./types/script";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DossierVideo"
        component={DossierVideo}
        durationInFrames={30 * 150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          sections: [] as SectionAssets[],
        }}
        calculateMetadata={({ props }) => {
          const sections = (props as { sections: SectionAssets[] }).sections;
          const totalSeconds = sections.reduce(
            (sum, s) => sum + s.audio_duration_seconds,
            0
          );
          return {
            durationInFrames: Math.ceil(totalSeconds * 30) || 30 * 150,
          };
        }}
      />
    </>
  );
};
