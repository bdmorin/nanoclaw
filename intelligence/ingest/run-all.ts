import { closeDriver } from "../src/neo4j";
import { OrganizationsImporter } from "./importers/organizations";
import { FacilitiesImporter } from "./importers/facilities";
import { DossiersImporter } from "./importers/dossiers";
import { CabinetImporter } from "./importers/cabinet";

async function main() {
  console.log("=== Intelligence Graph Ingest ===\n");

  const importers = [
    new OrganizationsImporter(),
    new FacilitiesImporter(),
    new DossiersImporter(),
    new CabinetImporter(),
  ];

  for (const importer of importers) {
    console.log(`Running: ${importer.name}`);
    try {
      await importer.run();
      importer.printStats();
    } catch (err) {
      console.error(`  FAILED: ${importer.name}:`, err);
    }
  }

  // Print summary stats
  console.log("\n=== Ingest Complete ===");

  await closeDriver();
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
