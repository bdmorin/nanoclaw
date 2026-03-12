import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDriver, closeDriver } from "./neo4j";

const MIGRATIONS_DIR = join(import.meta.dir, "../db/migrations");

async function getAppliedMigrations(): Promise<Set<string>> {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      "MATCH (m:__Migration) RETURN m.name AS name"
    );
    return new Set(result.records.map((r) => r.get("name") as string));
  } finally {
    await session.close();
  }
}

async function applyMigration(name: string, cypher: string): Promise<void> {
  const driver = getDriver();
  const session = driver.session();
  try {
    // Split on semicolons but skip empty statements
    const statements = cypher
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("//"));

    for (const statement of statements) {
      await session.run(statement);
    }

    // Record migration
    await session.run(
      "CREATE (m:__Migration {name: $name, applied_at: datetime()}) RETURN m",
      { name }
    );
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}: ${err}`);
    throw err;
  } finally {
    await session.close();
  }
}

async function main() {
  console.log("Running migrations...");

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".cypher"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    await closeDriver();
    return;
  }

  const applied = await getAppliedMigrations();
  let count = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  - ${file} (already applied)`);
      continue;
    }
    const cypher = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
    await applyMigration(file, cypher);
    count++;
  }

  console.log(
    count > 0 ? `\nApplied ${count} migration(s).` : "\nAll migrations up to date."
  );
  await closeDriver();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
