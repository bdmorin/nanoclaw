import { BaseImporter } from "../framework";

// Seed known organizations referenced across dossiers
const ORGANIZATIONS = [
  // Federal agencies
  { id: "org-dhs", slug: "dhs", name: "Department of Homeland Security", abbreviation: "DHS", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: null },
  { id: "org-ice", slug: "ice", name: "Immigration and Customs Enforcement", abbreviation: "ICE", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: "org-dhs" },
  { id: "org-cbp", slug: "cbp", name: "Customs and Border Protection", abbreviation: "CBP", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: "org-dhs" },
  { id: "org-ero", slug: "ero", name: "Enforcement and Removal Operations", abbreviation: "ERO", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: "org-ice" },
  { id: "org-hsi", slug: "hsi", name: "Homeland Security Investigations", abbreviation: "HSI", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: "org-dhs" },
  { id: "org-usms", slug: "usms", name: "United States Marshals Service", abbreviation: "USMS", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: "org-doj" },
  { id: "org-doj", slug: "doj", name: "Department of Justice", abbreviation: "DOJ", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: null },
  { id: "org-fbi", slug: "fbi", name: "Federal Bureau of Investigation", abbreviation: "FBI", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: "org-doj" },
  { id: "org-bop", slug: "bop", name: "Federal Bureau of Prisons", abbreviation: "BOP", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: "org-doj" },
  { id: "org-dod", slug: "dod", name: "Department of Defense", abbreviation: "DOD", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: null },
  { id: "org-usn", slug: "usn", name: "United States Navy", abbreviation: "USN", org_type: "FEDERAL_AGENCY", jurisdiction: "Federal", parent_org_id: "org-dod" },

  // Private contractors
  { id: "org-geo-group", slug: "geo-group", name: "GEO Group", abbreviation: null, org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },
  { id: "org-corecivic", slug: "corecivic", name: "CoreCivic", abbreviation: null, org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },
  { id: "org-transcor", slug: "transcor", name: "TransCor America", abbreviation: "TransCor", org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },
  { id: "org-mvm", slug: "mvm", name: "MVM Inc", abbreviation: "MVM", org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },
  { id: "org-acquisition-logistics", slug: "acquisition-logistics", name: "Acquisition Logistics LLC", abbreviation: null, org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },

  // TITUS contractors
  { id: "org-701c", slug: "701c", name: "701C", abbreviation: null, org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },
  { id: "org-kdp-global", slug: "kdp-global", name: "KDP Global Enterprises", abbreviation: null, org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },
  { id: "org-anovaeon", slug: "anovaeon", name: "Anovaeon", abbreviation: null, org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },
  { id: "org-sgk-global", slug: "sgk-global", name: "SGK Global Services", abbreviation: null, org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },
  { id: "org-guardian-6", slug: "guardian-6", name: "Guardian 6 Solutions", abbreviation: null, org_type: "CONTRACTOR", jurisdiction: null, parent_org_id: null },

  // Political
  { id: "org-patriot-front", slug: "patriot-front", name: "Patriot Front", abbreviation: "PF", org_type: "POLITICAL", jurisdiction: null, parent_org_id: null },
] as const;

export class OrganizationsImporter extends BaseImporter {
  constructor() {
    super("organizations");
  }

  async run(): Promise<void> {
    await this.withSession(async (session) => {
      for (const org of ORGANIZATIONS) {
        await this.mergeNode(session, "Organization", org.id, org.slug, {
          name: org.name,
          abbreviation: org.abbreviation,
          org_type: org.org_type,
          jurisdiction: org.jurisdiction,
          parent_org_id: org.parent_org_id,
        });
      }

      // Create SUBSIDIARY_OF relationships
      for (const org of ORGANIZATIONS) {
        if (org.parent_org_id) {
          await this.createRelationship(
            session,
            "Organization", org.id,
            "Organization", org.parent_org_id,
            "SUBSIDIARY_OF",
            {
              confidence: 1.0,
              confidence_method: "DIRECT",
              sources: ["official-org-chart"],
              asserted_at: new Date().toISOString(),
            }
          );
        }
      }
    });
  }
}
