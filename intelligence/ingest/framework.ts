import type { Session, Driver } from "neo4j-driver";
import { getDriver } from "../src/neo4j";

export interface ImporterStats {
  created: number;
  merged: number;
  relationships: number;
  errors: number;
}

export abstract class BaseImporter {
  protected driver: Driver;
  protected stats: ImporterStats = { created: 0, merged: 0, relationships: 0, errors: 0 };
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
    this.driver = getDriver();
  }

  abstract run(): Promise<void>;

  protected async withSession<T>(fn: (session: Session) => Promise<T>): Promise<T> {
    const session = this.driver.session();
    try {
      return await fn(session);
    } finally {
      await session.close();
    }
  }

  protected async mergeNode(
    session: Session,
    label: string,
    id: string,
    slug: string,
    properties: Record<string, unknown>
  ): Promise<void> {
    // Filter out undefined values
    const props = Object.fromEntries(
      Object.entries(properties).filter(([, v]) => v !== undefined && v !== null)
    );

    const result = await session.run(
      `MERGE (n:${label} {id: $id})
       ON CREATE SET n += $props, n.slug = $slug
       ON MATCH SET n += $props
       RETURN n.id AS id,
              CASE WHEN n.created_at IS NULL THEN true ELSE false END AS wasCreated`,
      { id, slug, props: { ...props, slug } }
    );

    const wasCreated = result.records[0]?.get("wasCreated");
    if (wasCreated) this.stats.created++;
    else this.stats.merged++;
  }

  protected async createRelationship(
    session: Session,
    fromLabel: string,
    fromId: string,
    toLabel: string,
    toId: string,
    relType: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    const props = Object.fromEntries(
      Object.entries(properties).filter(([, v]) => v !== undefined && v !== null)
    );

    await session.run(
      `MATCH (a:${fromLabel} {id: $fromId})
       MATCH (b:${toLabel} {id: $toId})
       MERGE (a)-[r:${relType}]->(b)
       SET r += $props
       RETURN type(r)`,
      { fromId, toId, props }
    );
    this.stats.relationships++;
  }

  printStats(): void {
    console.log(
      `  ${this.name}: ${this.stats.created} created, ${this.stats.merged} merged, ` +
      `${this.stats.relationships} rels, ${this.stats.errors} errors`
    );
  }
}
