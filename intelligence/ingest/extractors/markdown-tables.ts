// Parse markdown key-value tables like:
// | **Field** | Detail |
// |-----------|--------|
// | **Name**  | CECOT  |

export interface TableEntry {
  [key: string]: string;
}

export function parseMarkdownTable(text: string): TableEntry {
  const entry: TableEntry = {};
  const lines = text.split("\n");

  for (const line of lines) {
    // Match: | **Key** | Value |
    const match = line.match(/\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && value && !value.match(/^-+$/)) {
        entry[key] = value;
      }
    }
  }
  return entry;
}

// Parse a full markdown table with headers
// | Location | Capacity | Cost | Status |
// |----------|----------|------|--------|
// | **Hutchins, TX** | 9,500 | Unknown | Planned |
export function parseFullMarkdownTable(text: string): TableEntry[] {
  const lines = text.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return []; // Need header + separator + at least 1 row

  // Extract headers
  const headers = lines[0]
    .split("|")
    .map((h) => h.trim())
    .filter((h) => h && !h.match(/^-+$/));

  // Skip separator line (index 1)
  const rows: TableEntry[] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split("|")
      .map((c) => c.trim().replace(/\*\*/g, ""))
      .filter((c) => c);

    if (cells.length >= headers.length) {
      const entry: TableEntry = {};
      for (let j = 0; j < headers.length; j++) {
        entry[headers[j]] = cells[j];
      }
      rows.push(entry);
    }
  }
  return rows;
}

// Extract sections from markdown by heading level
export function extractSections(
  markdown: string,
  level: number = 3
): Map<string, string> {
  const prefix = "#".repeat(level) + " ";
  const sections = new Map<string, string>();
  const lines = markdown.split("\n");
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith(prefix)) {
      if (currentTitle) {
        sections.set(currentTitle, currentContent.join("\n").trim());
      }
      currentTitle = line.slice(prefix.length).trim();
      currentContent = [];
    } else if (currentTitle) {
      // Stop at same or higher level heading
      if (line.match(/^#{1,3} /)) {
        sections.set(currentTitle, currentContent.join("\n").trim());
        currentTitle = "";
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
  }
  if (currentTitle) {
    sections.set(currentTitle, currentContent.join("\n").trim());
  }

  return sections;
}
