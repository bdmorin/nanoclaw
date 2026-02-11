// Types matching the Story Agent and Visual Agent output formats

export interface StoryScript {
  approach: string;
  title: string;
  description: string;
  script: {
    name: string;
    moment: string;
    record: string;
    pattern: string;
    question: string;
  };
  sources: string[];
  tags: string[];
  duration_estimate_seconds: number;
  duration_rationale: string;
  content_warnings: string[];
  subject: {
    name: string;
    age: number;
    nationality: string;
    date_of_death: string;
    facility: string;
    cause: string;
    ruling: string;
  };
}

export interface VisualTiming {
  in: number;
  hold?: number;
  duration?: number;
  out?: number;
}

export interface TypographyLayer {
  type: "typography";
  content: string;
  style: string;
  source?: string;
  highlight?: string;
  highlight_color?: string;
  timing: VisualTiming;
}

export interface MapLayer {
  type: "map";
  action: string;
  location?: { name: string; lat: number; lon: number; label?: string };
  waypoints?: Array<{ name: string; lat: number; lon: number; label?: string; hold: number }>;
  style: string;
  timing: VisualTiming;
}

export interface SatelliteLayer {
  type: "satellite";
  source: string;
  location: { lat: number; lon: number };
  date_range: [string, string];
  action: string;
  label?: string;
  attribution: string;
  timing: VisualTiming;
}

export interface DocumentLayer {
  type: "document";
  source: string;
  case_id?: string;
  page?: number;
  highlight?: string;
  timing: VisualTiming;
}

export type VisualLayer = TypographyLayer | MapLayer | SatelliteLayer | DocumentLayer;

export interface VisualSection {
  section: "name" | "moment" | "record" | "pattern" | "question";
  duration_seconds: number;
  layers: VisualLayer[];
  background: string;
  transition_in: string;
  transition_out: string;
}

export interface VisualDirection {
  sections: VisualSection[];
  global_style: {
    aspect_ratio: string;
    resolution: string;
    background: string;
    font_primary: string;
    font_mono: string;
    color_text: string;
    color_accent: string;
    color_source_attribution: string;
  };
}

// What the pipeline produces per section after TTS
export interface SectionAssets {
  section: "name" | "moment" | "record" | "pattern" | "question";
  narration_text: string;
  audio_file: string; // path to WAV
  audio_duration_seconds: number; // actual measured duration
  visual: VisualSection;
}

export interface VideoAssets {
  script: StoryScript;
  visuals: VisualDirection;
  sections: SectionAssets[];
  total_duration_seconds: number;
}
