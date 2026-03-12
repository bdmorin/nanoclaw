// Find potential duplicate persons (same name, different IDs)
MATCH (a:Person), (b:Person)
WHERE a.id < b.id
  AND a.full_name IS NOT NULL
  AND b.full_name IS NOT NULL
  AND apoc.text.sorensenDiceSimilarity(toLower(a.full_name), toLower(b.full_name)) > 0.8
RETURN a.id AS id_a, a.full_name AS name_a,
       b.id AS id_b, b.full_name AS name_b,
       apoc.text.sorensenDiceSimilarity(toLower(a.full_name), toLower(b.full_name)) AS similarity
ORDER BY similarity DESC;

// Find potential duplicate facilities
MATCH (a:Facility), (b:Facility)
WHERE a.id < b.id
  AND a.name IS NOT NULL
  AND b.name IS NOT NULL
  AND apoc.text.sorensenDiceSimilarity(toLower(a.name), toLower(b.name)) > 0.7
RETURN a.id AS id_a, a.name AS name_a,
       b.id AS id_b, b.name AS name_b,
       apoc.text.sorensenDiceSimilarity(toLower(a.name), toLower(b.name)) AS similarity
ORDER BY similarity DESC
