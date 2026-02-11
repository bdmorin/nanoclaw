import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SectionAssets } from "../types/script";
import { Section } from "./Section";

export interface DossierVideoProps {
  sections: SectionAssets[];
  [key: string]: unknown;
}

export const DossierVideo: React.FC<DossierVideoProps> = ({ sections }) => {
  const fps = 30;
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {sections.map((section, i) => {
        const durationFrames = Math.ceil(section.audio_duration_seconds * fps);
        const startFrame = currentFrame;
        currentFrame += durationFrames;

        return (
          <Sequence
            key={section.section}
            from={startFrame}
            durationInFrames={durationFrames}
            name={section.section}
          >
            {section.audio_file && (
              <Audio src={staticFile(section.audio_file)} />
            )}
            <Section
              section={section}
              durationFrames={durationFrames}
              fps={fps}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
