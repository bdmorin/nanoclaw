import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SectionAssets, VisualLayer } from "../types/script";
import { Typography } from "./Typography";

interface SectionProps {
  section: SectionAssets;
  durationFrames: number;
  fps: number;
}

export const Section: React.FC<SectionProps> = ({ section, durationFrames, fps }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Scale visual layer timings to actual audio duration
  const estimatedDuration = section.visual.duration_seconds;
  const actualDuration = section.audio_duration_seconds;
  const timeScale = actualDuration / estimatedDuration;

  // Fade transitions
  const fadeIn = section.visual.transition_in === "fade_from_black"
    ? interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  const fadeOut = section.visual.transition_out.includes("fade")
    ? interpolate(
        frame,
        [durationFrames - fps * 1, durationFrames],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: section.visual.background || "#000000",
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      {section.visual.layers.map((layer, i) => {
        // Scale timing to actual audio duration
        const layerIn = (layer.timing.in || 0) * timeScale;
        const layerDuration = (layer.timing.duration || layer.timing.hold || 3) * timeScale;
        const layerOut = (layer.timing.out || 0.5) * timeScale;
        const totalLayerDuration = layerDuration + layerOut;

        const layerStartFrame = Math.floor(layerIn * fps);
        const layerEndFrame = Math.floor((layerIn + totalLayerDuration) * fps);
        const localFrame = frame - layerStartFrame;

        // Don't render if not in range
        if (frame < layerStartFrame || frame > layerEndFrame) return null;

        // Layer opacity with fade in/out
        const layerOpacity = interpolate(
          localFrame,
          [0, fps * 0.3, (totalLayerDuration - layerOut) * fps, totalLayerDuration * fps],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <AbsoluteFill key={i} style={{ opacity: layerOpacity }}>
            {layer.type === "typography" && (
              <Typography layer={layer} localFrame={localFrame} fps={fps} />
            )}
            {/* Map and satellite layers will be added as separate components */}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
