import { readFile } from "node:fs/promises";
import type { DossierMetadata } from "../../src/types";

export async function parseMetadataJson(path: string): Promise<DossierMetadata> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as DossierMetadata;
}

// Map metadata.json "type" field to our IncidentType enum
export function mapIncidentType(
  type: string
): "SWEEP" | "ARREST" | "DEPORTATION" | "DETENTION" | "VIOLENCE" | "POLICY_ACTION" | "SHOOTING" | "PURSUIT" | "OTHER" {
  const map: Record<string, ReturnType<typeof mapIncidentType>> = {
    "detention-death": "DETENTION",
    "officer-involved-shooting": "SHOOTING",
    "incident": "OTHER",
    "federal_arrest": "ARREST",
    "extremist_rally": "OTHER",
    "sniper-attack": "SHOOTING",
    "ice-shooting": "SHOOTING",
    "ice-pursuit-death": "PURSUIT",
  };
  return map[type] || "OTHER";
}

// Extract the incident date from various metadata formats
export function extractDate(meta: DossierMetadata): string | undefined {
  return meta.date_of_incident || meta.incident_date || meta.date_created || meta.created;
}

// Get dossier ID - some have "id", some derive from folder name
export function getDossierId(meta: DossierMetadata, folderName: string): string {
  return meta.id || folderName;
}

// Get subject name from various metadata formats
export function getSubjectName(meta: DossierMetadata): string | undefined {
  return (
    meta.subject ||
    meta.event ||
    meta.victim_details?.name ||
    meta.subject_details?.name
  );
}
