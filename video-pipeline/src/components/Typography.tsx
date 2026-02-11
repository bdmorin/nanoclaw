import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { TypographyLayer } from "../types/script";

interface TypographyProps {
  layer: TypographyLayer;
  localFrame: number;
  fps: number;
}

// Style presets matching the visual agent's style vocabulary
const STYLES: Record<string, React.CSSProperties> = {
  name_large: {
    fontSize: 72,
    fontWeight: 300,
    letterSpacing: "0.02em",
    textAlign: "center",
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 36,
    fontWeight: 300,
    letterSpacing: "0.08em",
    textAlign: "center",
    opacity: 0.7,
  },
  witness_quote: {
    fontSize: 48,
    fontWeight: 400,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 1.5,
    paddingLeft: 80,
    paddingRight: 80,
  },
  witness_quote_primary: {
    fontSize: 56,
    fontWeight: 500,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 1.4,
    paddingLeft: 60,
    paddingRight: 60,
  },
  narration_emphasis: {
    fontSize: 44,
    fontWeight: 400,
    textAlign: "center",
    lineHeight: 1.6,
    paddingLeft: 80,
    paddingRight: 80,
  },
  narration_flat: {
    fontSize: 40,
    fontWeight: 300,
    textAlign: "center",
    lineHeight: 1.6,
    opacity: 0.8,
  },
  document_header: {
    fontSize: 32,
    fontWeight: 300,
    letterSpacing: "0.12em",
    textAlign: "center",
    textTransform: "uppercase" as const,
    opacity: 0.5,
  },
  official_quote: {
    fontSize: 44,
    fontWeight: 400,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 1.5,
    paddingLeft: 80,
    paddingRight: 80,
    opacity: 0.85,
  },
  autopsy_finding: {
    fontSize: 48,
    fontWeight: 500,
    textAlign: "center",
    lineHeight: 1.8,
    fontFamily: "monospace",
  },
  name_secondary: {
    fontSize: 44,
    fontWeight: 300,
    textAlign: "center",
    lineHeight: 1.5,
  },
  time_marker: {
    fontSize: 36,
    fontWeight: 300,
    letterSpacing: "0.15em",
    textAlign: "center",
    opacity: 0.6,
  },
  statistic: {
    fontSize: 64,
    fontWeight: 600,
    textAlign: "center",
    letterSpacing: "0.02em",
  },
  source_attribution: {
    fontSize: 24,
    fontWeight: 300,
    textAlign: "center",
    opacity: 0.4,
    position: "absolute" as const,
    bottom: 120,
    left: 60,
    right: 60,
  },
};

export const Typography: React.FC<TypographyProps> = ({ layer, localFrame, fps }) => {
  const { width } = useVideoConfig();
  const style = STYLES[layer.style] || STYLES.narration_emphasis;

  // Gentle spring entrance
  const entrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 30, stiffness: 80 },
  });

  const translateY = interpolate(entrance, [0, 1], [20, 0]);

  // Handle highlight text (e.g., "HOMICIDE" in red)
  const renderContent = () => {
    if (!layer.highlight) {
      return layer.content;
    }

    const parts = layer.content.split(layer.highlight);
    return (
      <>
        {parts[0]}
        <span style={{ color: layer.highlight_color || "#dc2626", fontWeight: 700 }}>
          {layer.highlight}
        </span>
        {parts.slice(1).join(layer.highlight)}
      </>
    );
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontFamily: "Inter, -apple-system, sans-serif",
          whiteSpace: "pre-line",
          transform: `translateY(${translateY}px)`,
          opacity: entrance,
          maxWidth: width - 120,
          ...style,
        }}
      >
        {renderContent()}
      </div>
      {layer.source && (
        <div style={STYLES.source_attribution}>
          {layer.source}
        </div>
      )}
    </AbsoluteFill>
  );
};
