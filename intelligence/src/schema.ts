import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "glob";
import { Neo4jGraphQL } from "@neo4j/graphql";
import type { Driver } from "neo4j-driver";

const SCHEMA_DIR = join(import.meta.dir, "../db/schema");

export function loadTypeDefs(): string {
  const files = globSync("*.graphql", { cwd: SCHEMA_DIR }).sort();
  return files
    .map((f) => readFileSync(join(SCHEMA_DIR, f), "utf-8"))
    .join("\n\n");
}

export async function buildSchema(driver: Driver) {
  const typeDefs = loadTypeDefs();
  const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
  const schema = await neoSchema.getSchema();
  return schema;
}
