import { createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { getDriver, closeDriver } from "./neo4j";
import { buildSchema } from "./schema";

const PORT = 4000;

async function main() {
  console.log("Starting Intelligence Graph API...");

  const driver = getDriver();
  await driver.verifyConnectivity();
  console.log("  ✓ Neo4j connected");

  const schema = await buildSchema(driver);
  console.log("  ✓ Schema built");

  const yoga = createYoga({ schema });
  const server = createServer(yoga);

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`  ✓ GraphQL API at http://127.0.0.1:${PORT}/graphql`);
  });

  const shutdown = async () => {
    console.log("\nShutting down...");
    server.close();
    await closeDriver();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
