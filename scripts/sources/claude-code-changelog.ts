import { RawItem } from "./types";

const CHANGELOG_URL =
  "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md";

export async function fetchClaudeCodeChangelog(): Promise<RawItem[]> {
  try {
    const response = await fetch(CHANGELOG_URL);
    const text = await response.text();

    const items: RawItem[] = [];

    // Match version headers: ## 2.17.1 or ## [2.17.1]
    const versionRegex = /^## \[?(\d+\.\d+\.\d+)\]?.*$/gm;
    const sections: { version: string; start: number }[] = [];
    let match;

    while ((match = versionRegex.exec(text)) !== null) {
      sections.push({ version: match[1], start: match.index });
    }

    // Only take the 3 most recent versions — older ones aren't news
    const recentSections = sections.slice(0, 3);

    for (let i = 0; i < recentSections.length; i++) {
      const section = recentSections[i];
      const nextStart =
        i + 1 < sections.length ? sections[i + 1].start : text.length;
      const content = text.slice(section.start, nextStart).trim();

      // Extract bullet points from the section
      const highlights = content
        .split("\n")
        .filter((line) => line.startsWith("- ") || line.startsWith("* "))
        .map((line) => line.replace(/^[-*] /, "").trim())
        .slice(0, 5)
        .join(". ");

      items.push({
        title: `Claude Code v${section.version}`,
        url: `https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md#${section.version.replace(/\./g, "")}`,
        content: highlights || `Claude Code version ${section.version} release`,
        source_type: "blog",
        published_at: new Date().toISOString(),
      });
    }

    return items;
  } catch (error) {
    console.error("Failed to fetch Claude Code changelog:", error);
    return [];
  }
}
