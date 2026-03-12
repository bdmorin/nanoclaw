// Node counts by type
MATCH (n)
WHERE NOT n:__Migration
RETURN labels(n)[0] AS label, count(n) AS count
ORDER BY count DESC;

// Relationship counts by type
MATCH ()-[r]->()
RETURN type(r) AS type, count(r) AS count
ORDER BY count DESC;

// Incidents by type
MATCH (i:Incident)
RETURN i.incident_type AS type, count(i) AS count
ORDER BY count DESC;

// Facilities by status
MATCH (f:Facility)
RETURN f.status AS status, count(f) AS count
ORDER BY count DESC
