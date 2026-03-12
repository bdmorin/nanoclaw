import { readdir, readFile, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { BaseImporter } from "../framework";
import { mapConfidence, slugify } from "../../src/types";
import type { DossierMetadata } from "../../src/types";
import { mapIncidentType, extractDate, getDossierId, getSubjectName } from "../extractors/metadata-json";

const DOSSIERS_DIR = join(
  import.meta.dir,
  "../../../groups/main/osint/dossiers"
);

// Map metadata tags to known organization IDs
const TAG_TO_ORG: Record<string, string> = {
  ice: "org-ice",
  cbp: "org-cbp",
  dhs: "org-dhs",
  fbi: "org-fbi",
  transcor: "org-transcor",
  corecivic: "org-corecivic",
  "geo-group": "org-geo-group",
  hsi: "org-hsi",
};

export class DossiersImporter extends BaseImporter {
  constructor() {
    super("dossiers");
  }

  async run(): Promise<void> {
    const entries = await readdir(DOSSIERS_DIR);
    // Filter to only directories
    const folders: string[] = [];
    for (const entry of entries) {
      const s = await stat(join(DOSSIERS_DIR, entry));
      if (s.isDirectory()) folders.push(entry);
    }

    for (const folder of folders) {
      const metaPath = join(DOSSIERS_DIR, folder, "metadata.json");
      try {
        const raw = await readFile(metaPath, "utf-8");
        const meta: DossierMetadata = JSON.parse(raw);
        await this.importDossier(meta, folder);
      } catch (err: any) {
        if (err.code === "ENOENT") {
          // No metadata.json — skip (e.g. portland-tear-gas has report only)
          continue;
        }
        console.error(`  ! Error importing ${folder}: ${err.message}`);
        this.stats.errors++;
      }
    }
  }

  private async importDossier(meta: DossierMetadata, folder: string): Promise<void> {
    await this.withSession(async (session) => {
      const dossierId = getDossierId(meta, folder);
      const now = new Date().toISOString();
      const conf = mapConfidence(meta.confidence);
      const incidentDate = extractDate(meta);
      const subjectName = getSubjectName(meta);

      // 1. Create Source node for the dossier itself
      const sourceId = `src-${dossierId}`;
      await this.mergeNode(session, "Source", sourceId, slugify(sourceId), {
        source_type: "MEDIA",
        title: subjectName || folder,
        file_path: `groups/main/osint/dossiers/${folder}/metadata.json`,
        reliability: conf.confidence >= 0.8 ? "HIGH" : conf.confidence >= 0.5 ? "MEDIUM" : "LOW",
        obtained_by: "oilcloth",
      });

      // 2. Create Incident node
      const incidentType = mapIncidentType(meta.type);
      await this.mergeNode(session, "Incident", dossierId, slugify(dossierId), {
        incident_type: incidentType,
        title: subjectName || meta.summary || folder,
        description: meta.summary,
        occurred_at: incidentDate,
        occurred_at_precision: incidentDate ? "DATE" : undefined,
        location_name: meta.location,
        status: "CONFIRMED",
      });

      // Link incident to source
      await this.createRelationship(
        session,
        "Incident", dossierId,
        "Source", sourceId,
        "SOURCED_FROM",
        { confidence: conf.confidence, confidence_method: conf.confidence_method, sources: [sourceId], asserted_at: now }
      );

      // 3. Create Person node(s)
      if (meta.type === "detention-death" || meta.type === "officer-involved-shooting" || meta.type === "ice-pursuit-death" || meta.type === "sniper-attack" || meta.type === "ice-shooting") {
        const personName = meta.victim_details?.name || meta.subject_details?.name || (meta as any).victim?.name || meta.subject;
        if (personName) {
          const personId = `person-${slugify(personName)}`;
          const personSlug = slugify(personName);

          const victimDetails = meta.victim_details || (meta as any).victim || {};
          const isDeceased = meta.type === "detention-death" || meta.type === "ice-pursuit-death" || meta.type === "sniper-attack" ||
            (meta as any).incident?.outcome === "fatal";

          await this.mergeNode(session, "Person", personId, personSlug, {
            full_name: personName,
            known_aliases: (meta as any).aliases,
            role: "victim",
            notes: meta.summary,
            status: isDeceased ? "DECEASED" : "ACTIVE",
          });

          // Person INVOLVED_IN Incident
          await this.createRelationship(
            session,
            "Person", personId,
            "Incident", dossierId,
            "INVOLVED_IN",
            {
              confidence: conf.confidence,
              confidence_method: conf.confidence_method,
              sources: [sourceId],
              asserted_at: now,
              notes: "victim",
            }
          );

          // Person IDENTIFIED_BY Source
          await this.createRelationship(
            session,
            "Person", personId,
            "Source", sourceId,
            "IDENTIFIED_BY",
            { confidence: conf.confidence, confidence_method: conf.confidence_method, sources: [sourceId], asserted_at: now }
          );

          // Link detention if facility mentioned
          const facilityName = meta.facility || (meta as any).detention?.facility;
          if (facilityName) {
            const facilityId = `fac-dossier-${slugify(facilityName)}`;
            await this.mergeNode(session, "Facility", facilityId, slugify(facilityName), {
              name: facilityName,
              facility_type: "ICE_DETENTION",
              location_name: meta.location,
              status: "ACTIVE",
            });

            await this.createRelationship(
              session,
              "Person", personId,
              "Facility", facilityId,
              "DETAINED_AT",
              {
                confidence: conf.confidence,
                confidence_method: conf.confidence_method,
                sources: [sourceId],
                asserted_at: now,
                notes: meta.type === "detention-death"
                  ? `Died ${meta.victim_details?.date_of_death || incidentDate || "date unknown"}`
                  : undefined,
              }
            );
          }
        }
      }

      // 4. Link responsible organizations from tags
      const tags = meta.tags || [];
      const linkedOrgs = new Set<string>();
      for (const tag of tags) {
        const orgId = TAG_TO_ORG[tag.toLowerCase()];
        if (orgId && !linkedOrgs.has(orgId)) {
          linkedOrgs.add(orgId);
          await this.createRelationship(
            session,
            "Organization", orgId,
            "Incident", dossierId,
            "RESPONSIBLE_FOR",
            {
              confidence: conf.confidence * 0.9, // slightly lower — inferred from tags
              confidence_method: "INFERRED",
              sources: [sourceId],
              asserted_at: now,
              notes: `Inferred from dossier tags: ${tag}`,
            }
          );
        }
      }

      // Also link agencies_involved if present
      const agencies = meta.agencies_involved || [];
      for (const agency of agencies) {
        const agencyLower = agency.toLowerCase();
        let orgId: string | undefined;
        if (agencyLower.includes("hsi") || agencyLower.includes("homeland security investigations")) orgId = "org-hsi";
        else if (agencyLower.includes("fbi")) orgId = "org-fbi";
        else if (agencyLower.includes("ice")) orgId = "org-ice";
        else if (agencyLower.includes("cbp")) orgId = "org-cbp";
        else if (agencyLower.includes("doj") || agencyLower.includes("department of justice")) orgId = "org-doj";
        else if (agencyLower.includes("marshal")) orgId = "org-usms";

        if (orgId && !linkedOrgs.has(orgId)) {
          linkedOrgs.add(orgId);
          await this.createRelationship(
            session,
            "Organization", orgId,
            "Incident", dossierId,
            "RESPONSIBLE_FOR",
            {
              confidence: conf.confidence,
              confidence_method: conf.confidence_method,
              sources: [sourceId],
              asserted_at: now,
            }
          );
        }
      }
    });
  }
}
