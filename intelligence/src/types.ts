// TypeScript interfaces matching the Neo4j graph model

export interface AssertionMeta {
  confidence: number;
  confidence_method: "DIRECT" | "CORROBORATED" | "INFERRED" | "UNVERIFIED";
  sources: string[];
  asserted_at: string;
  last_verified?: string;
  notes?: string;
}

export interface PersonNode {
  id: string;
  slug: string;
  full_name?: string;
  known_aliases?: string[];
  role?: string;
  badge_number?: string;
  employee_id?: string;
  agency_id?: string;
  physical_description?: string;
  notes?: string;
  status?: "ACTIVE" | "INACTIVE" | "DECEASED" | "UNKNOWN";
}

export interface OrganizationNode {
  id: string;
  slug: string;
  name: string;
  abbreviation?: string;
  org_type?: "FEDERAL_AGENCY" | "STATE_AGENCY" | "CONTRACTOR" | "POLITICAL" | "NGO" | "UNKNOWN";
  jurisdiction?: string;
  parent_org_id?: string;
  notes?: string;
}

export interface IncidentNode {
  id: string;
  slug: string;
  incident_type?: "SWEEP" | "ARREST" | "DEPORTATION" | "DETENTION" | "VIOLENCE" | "POLICY_ACTION" | "SHOOTING" | "PURSUIT" | "OTHER";
  title?: string;
  description?: string;
  occurred_at?: string;
  occurred_at_precision?: "EXACT" | "DATE" | "MONTH" | "YEAR" | "APPROXIMATE";
  location_name?: string;
  location_lat?: number;
  location_lon?: number;
  victim_count?: number;
  status?: "CONFIRMED" | "ALLEGED" | "DISPUTED" | "RETRACTED";
}

export interface SourceNode {
  id: string;
  slug: string;
  source_type?: "FOIA" | "COURT_FILING" | "MEDIA" | "WITNESS" | "LEAKED" | "OFFICIAL" | "SOCIAL_MEDIA" | "OTHER";
  title?: string;
  url?: string;
  archive_url?: string;
  publication_date?: string;
  author?: string;
  outlet?: string;
  reliability?: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  file_path?: string;
  notes?: string;
}

export interface FacilityNode {
  id: string;
  slug: string;
  name: string;
  common_names?: string[];
  facility_type?: "ICE_DETENTION" | "CBP_HOLDING" | "PRIVATE_PRISON" | "MILITARY" | "CONVERTED" | "TENT_CAMP" | "FOREIGN_PRISON" | "OTHER";
  address?: string;
  location_name?: string;
  location_lat?: number;
  location_lon?: number;
  capacity?: number;
  current_population?: number;
  operator?: string;
  contractor?: string;
  status?: "ACTIVE" | "CLOSED" | "PLANNED" | "BLOCKED" | "RUMORED" | "PURCHASED" | "OPERATIONAL";
  notes?: string;
}

export interface PoliticalActorNode {
  id: string;
  slug: string;
  full_name: string;
  title?: string;
  party?: string;
  jurisdiction?: string;
  district?: string;
  chamber?: string;
  term_start?: string;
  term_end?: string;
  status?: "CURRENT" | "FORMER" | "CANDIDATE" | "APPOINTED";
  notes?: string;
}

export interface DossierMetadata {
  id?: string;
  subject?: string;
  event?: string;
  type: string;
  created?: string;
  date_created?: string;
  updated?: string;
  status?: string;
  confidence?: string;
  tags?: string[];
  summary?: string;
  sources_count?: number;
  related_dossiers?: string[];
  related_subjects?: string[];
  victim_details?: {
    name?: string;
    age?: number;
    nationality?: string;
    immigration_status?: string;
    medical_condition?: string;
    date_of_death?: string;
    location_of_death?: string;
    cause_of_death?: string;
    days_in_custody?: number;
  };
  subject_details?: {
    name?: string;
    age?: number;
    location?: string;
    activism_focus?: string;
    social_media?: string;
  };
  facility?: string;
  date_of_incident?: string;
  incident_date?: string;
  location?: string;
  agencies_involved?: string[];
  charges?: {
    federal?: string[];
    jurisdiction?: string;
    status?: string;
  };
  groups_present?: string[];
  [key: string]: unknown;
}

// Confidence mapping from metadata.json strings to Neo4j floats
export function mapConfidence(raw?: string): { confidence: number; confidence_method: string } {
  if (!raw) return { confidence: 0.2, confidence_method: "UNVERIFIED" };
  const lower = raw.toLowerCase();
  if (lower === "high") return { confidence: 0.9, confidence_method: "CORROBORATED" };
  if (lower === "medium") return { confidence: 0.65, confidence_method: "CORROBORATED" };
  if (lower === "low") return { confidence: 0.3, confidence_method: "UNVERIFIED" };
  return { confidence: 0.2, confidence_method: "UNVERIFIED" };
}

// Generate a slug from text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
