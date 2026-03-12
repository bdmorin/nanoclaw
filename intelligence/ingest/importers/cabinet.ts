import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { BaseImporter } from "../framework";
import { slugify } from "../../src/types";

const CABINET_DIR = join(
  import.meta.dir,
  "../../../groups/main/osint/cabinet"
);

// Known cabinet members with structured data extracted from the markdown headers
// since there's no metadata.json for these
const CABINET_PROFILES: Array<{
  folder: string;
  full_name: string;
  title: string;
  party: string;
  jurisdiction: string;
  chamber: string;
  status: string;
  affiliated_orgs: string[];
}> = [
  {
    folder: "bondi-pam",
    full_name: "Pam Bondi",
    title: "Attorney General",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: ["org-doj"],
  },
  {
    folder: "homan-tom",
    full_name: "Tom Homan",
    title: "Border Czar",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: ["org-dhs", "org-ice"],
  },
  {
    folder: "noem-kristi",
    full_name: "Kristi Noem",
    title: "Secretary of Homeland Security",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: ["org-dhs"],
  },
  {
    folder: "miller-stephen",
    full_name: "Stephen Miller",
    title: "Deputy Chief of Staff for Policy and Homeland Security Advisor",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: [],
  },
  {
    folder: "vance-jd",
    full_name: "JD Vance",
    title: "Vice President",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: [],
  },
  {
    folder: "bovino-gregory",
    full_name: "Gregory Bovino",
    title: "Acting ICE Director",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: ["org-ice"],
  },
  {
    folder: "exum-charles",
    full_name: "Charles Exum",
    title: "DHS Official",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: ["org-dhs"],
  },
  {
    folder: "lyons-todd",
    full_name: "Todd Lyons",
    title: "Acting USCIS Director",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: ["org-dhs"],
  },
  {
    folder: "ross-jonathan",
    full_name: "Jonathan Ross",
    title: "DHS Official",
    party: "Republican",
    jurisdiction: "Federal",
    chamber: "EXECUTIVE",
    status: "CURRENT",
    affiliated_orgs: ["org-dhs"],
  },
];

export class CabinetImporter extends BaseImporter {
  constructor() {
    super("cabinet");
  }

  async run(): Promise<void> {
    await this.withSession(async (session) => {
      const now = new Date().toISOString();

      for (const profile of CABINET_PROFILES) {
        const id = `pa-${profile.folder}`;
        const slug = profile.folder;

        // Check if markdown dossier exists to create a Source node
        const dossierPath = join(CABINET_DIR, profile.folder, "dossier-public.md");
        let hasDossier = false;
        try {
          await readFile(dossierPath, "utf-8");
          hasDossier = true;
        } catch {}

        // Create PoliticalActor node
        await this.mergeNode(session, "PoliticalActor", id, slug, {
          full_name: profile.full_name,
          title: profile.title,
          party: profile.party,
          jurisdiction: profile.jurisdiction,
          chamber: profile.chamber,
          status: profile.status,
        });

        // Create Source from dossier
        if (hasDossier) {
          const sourceId = `src-cabinet-${profile.folder}`;
          await this.mergeNode(session, "Source", sourceId, `cabinet-${slug}`, {
            source_type: "MEDIA",
            title: `${profile.full_name} Dossier`,
            file_path: `groups/main/osint/cabinet/${profile.folder}/dossier-public.md`,
            reliability: "HIGH",
            obtained_by: "oilcloth",
          });

          await this.createRelationship(
            session,
            "PoliticalActor", id,
            "Source", sourceId,
            "IDENTIFIED_BY",
            {
              confidence: 0.95,
              confidence_method: "DIRECT",
              sources: [sourceId],
              asserted_at: now,
            }
          );
        }

        // Link to affiliated organizations
        for (const orgId of profile.affiliated_orgs) {
          await this.createRelationship(
            session,
            "PoliticalActor", id,
            "Organization", orgId,
            "AFFILIATED_WITH",
            {
              confidence: 0.95,
              confidence_method: "DIRECT",
              sources: [`src-cabinet-${profile.folder}`],
              asserted_at: now,
              role: profile.title,
            }
          );
        }
      }
    });
  }
}
