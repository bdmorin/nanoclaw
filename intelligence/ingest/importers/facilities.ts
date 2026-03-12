import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BaseImporter } from "../framework";
import { slugify } from "../../src/types";

const CAMPS_FILE = join(
  import.meta.dir,
  "../../../groups/main/osint/camps/exported-detention-database.md"
);

// Hardcoded facility data extracted from the markdown tables
// The markdown is narrative-heavy so parsing programmatically is fragile;
// we encode the structured data directly.

interface FacilityRecord {
  id: string;
  name: string;
  facility_type: string;
  location_name: string;
  status: string;
  capacity?: number;
  operator?: string;
  notes?: string;
  operator_org_id?: string;
}

const FOREIGN_FACILITIES: FacilityRecord[] = [
  { id: "fac-cecot", name: "Centro de Confinamiento del Terrorismo (CECOT)", facility_type: "FOREIGN_PRISON", location_name: "Tecoluca, San Vicente Department, El Salvador", status: "ACTIVE", capacity: 40000, operator: "Government of El Salvador", notes: "U.S. payment: $6M for 300 prisoners/year. HRW: torture, enforced disappearance." },
  { id: "fac-rwanda", name: "Rwanda Detention Facility", facility_type: "FOREIGN_PRISON", location_name: "Rwanda (undisclosed location)", status: "ACTIVE", capacity: 250, notes: "U.S. payment: $7.5M upfront. 7 deportees received August 2025." },
  { id: "fac-dema-camp", name: "Dema Camp", facility_type: "MILITARY", location_name: "Outside Accra, Ghana", status: "ACTIVE", notes: "Military training camp. At least 11 men. Extreme heat, unsanitary conditions." },
  { id: "fac-darien-camp", name: "Darien Transit Camp", facility_type: "OTHER", location_name: "Darien Province, Panama", status: "ACTIVE", notes: "Transit/processing for Asian deportees." },
];

const TITUS_FACILITIES: FacilityRecord[] = [
  { id: "fac-titus-hutchins", name: "TITUS Hutchins", facility_type: "TENT_CAMP", location_name: "Hutchins, TX (near Dallas)", status: "PLANNED", capacity: 9500, operator_org_id: "org-usn" },
  { id: "fac-titus-el-paso", name: "TITUS El Paso", facility_type: "TENT_CAMP", location_name: "El Paso County, TX (near Clint)", status: "PURCHASED", capacity: 8500, notes: "$123 million", operator_org_id: "org-usn" },
  { id: "fac-camp-east-montana", name: "Camp East Montana (Fort Bliss)", facility_type: "MILITARY", location_name: "Fort Bliss, TX", status: "OPERATIONAL", capacity: 5000, notes: "3 deaths in 44 days. 1 homicide. TB outbreak. WWII Japanese American internment site. $1.2B Acquisition Logistics contract.", operator_org_id: "org-acquisition-logistics" },
  { id: "fac-titus-san-antonio", name: "TITUS San Antonio", facility_type: "CONVERTED", location_name: "San Antonio, TX", status: "PLANNED", notes: "$37M, 640K sq ft warehouse", operator_org_id: "org-usn" },
  { id: "fac-titus-surprise", name: "TITUS Surprise", facility_type: "TENT_CAMP", location_name: "Surprise, AZ", status: "PURCHASED", notes: "$70M. City officials NOT notified.", operator_org_id: "org-usn" },
  { id: "fac-titus-philadelphia", name: "TITUS Philadelphia", facility_type: "TENT_CAMP", location_name: "Outside Philadelphia, PA", status: "PURCHASED", notes: "$87.4M", operator_org_id: "org-usn" },
  { id: "fac-titus-maryland", name: "TITUS Maryland", facility_type: "TENT_CAMP", location_name: "Maryland", status: "PURCHASED", notes: "$102M. Constant community protests.", operator_org_id: "org-usn" },
  { id: "fac-titus-roxbury", name: "TITUS Roxbury", facility_type: "TENT_CAMP", location_name: "Roxbury, NJ", status: "PLANNED", notes: "Groundwater contamination concerns", operator_org_id: "org-usn" },
  { id: "fac-titus-kansas-city", name: "TITUS Kansas City", facility_type: "TENT_CAMP", location_name: "Kansas City, MO", status: "PLANNED", capacity: 7000, notes: "City council passed resolution to block", operator_org_id: "org-usn" },
  { id: "fac-titus-shakopee", name: "TITUS Shakopee", facility_type: "TENT_CAMP", location_name: "Shakopee, MN", status: "BLOCKED", notes: "Community protests, warehouse owner rejected DHS", operator_org_id: "org-usn" },
  { id: "fac-titus-slc", name: "TITUS Salt Lake City", facility_type: "TENT_CAMP", location_name: "Salt Lake City, UT", status: "BLOCKED", notes: "Protests + city code challenge", operator_org_id: "org-usn" },
  { id: "fac-titus-hanover", name: "TITUS Hanover County", facility_type: "TENT_CAMP", location_name: "Hanover County, VA", status: "BLOCKED", notes: "Unanimous Board of Supervisors resolution against", operator_org_id: "org-usn" },
  { id: "fac-titus-chester", name: "TITUS Chester", facility_type: "TENT_CAMP", location_name: "Chester, NY", status: "PLANNED", notes: "10,000 signatures against in town of 12,000", operator_org_id: "org-usn" },
  { id: "fac-titus-social-circle", name: "TITUS Social Circle", facility_type: "TENT_CAMP", location_name: "Social Circle, GA", status: "PLANNED", notes: "Would triple city population", operator_org_id: "org-usn" },
];

export class FacilitiesImporter extends BaseImporter {
  constructor() {
    super("facilities");
  }

  async run(): Promise<void> {
    await this.withSession(async (session) => {
      const allFacilities = [...FOREIGN_FACILITIES, ...TITUS_FACILITIES];
      const now = new Date().toISOString();

      for (const fac of allFacilities) {
        await this.mergeNode(session, "Facility", fac.id, slugify(fac.name), {
          name: fac.name,
          facility_type: fac.facility_type,
          location_name: fac.location_name,
          status: fac.status,
          capacity: fac.capacity,
          operator: fac.operator,
          notes: fac.notes,
        });

        // Create source reference
        const sourceId = "src-detention-database";
        await this.mergeNode(session, "Source", sourceId, "exported-detention-database", {
          source_type: "MEDIA",
          title: "Exported Detention Database",
          file_path: "groups/main/osint/camps/exported-detention-database.md",
          reliability: "HIGH",
          obtained_by: "oilcloth",
        });

        await this.createRelationship(
          session,
          "Facility", fac.id,
          "Source", sourceId,
          "SOURCED_FROM",
          { confidence: 0.9, confidence_method: "CORROBORATED", sources: [sourceId], asserted_at: now }
        );

        // Link operator org if known
        if (fac.operator_org_id) {
          await this.createRelationship(
            session,
            "Organization", fac.operator_org_id,
            "Facility", fac.id,
            "OPERATES",
            { confidence: 0.9, confidence_method: "CORROBORATED", sources: [sourceId], asserted_at: now }
          );
        }
      }

      // Link ICE as operator for foreign facilities
      for (const fac of FOREIGN_FACILITIES) {
        await this.createRelationship(
          session,
          "Organization", "org-ice",
          "Facility", fac.id,
          "OPERATES",
          { confidence: 0.8, confidence_method: "CORROBORATED", sources: ["src-detention-database"], asserted_at: now, notes: "Sends deportees; does not directly operate" }
        );
      }
    });
  }
}
