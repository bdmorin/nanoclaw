// Full-text indexes for name search
CREATE FULLTEXT INDEX person_names IF NOT EXISTS FOR (p:Person) ON EACH [p.full_name, p.known_aliases];
CREATE FULLTEXT INDEX org_names IF NOT EXISTS FOR (o:Organization) ON EACH [o.name, o.abbreviation];
CREATE FULLTEXT INDEX facility_names IF NOT EXISTS FOR (f:Facility) ON EACH [f.name, f.common_names];
CREATE FULLTEXT INDEX political_actor_names IF NOT EXISTS FOR (pa:PoliticalActor) ON EACH [pa.full_name];
CREATE FULLTEXT INDEX incident_text IF NOT EXISTS FOR (i:Incident) ON EACH [i.title, i.description];

// Temporal indexes for date queries
CREATE INDEX incident_date IF NOT EXISTS FOR (i:Incident) ON (i.occurred_at);
CREATE INDEX source_date IF NOT EXISTS FOR (s:Source) ON (s.publication_date);
CREATE INDEX facility_status IF NOT EXISTS FOR (f:Facility) ON (f.status);
CREATE INDEX person_status IF NOT EXISTS FOR (p:Person) ON (p.status)
