// Claude occasionally prefaces JSON output with conversational text (e.g.
// "Looking at these items, here's the briefing...") even when the prompt
// says "output ONLY valid JSON". Stripping markdown fences alone doesn't
// handle that case, so fall back to slicing out the outermost {...}/[...]
// before giving up.
export function parseJsonResponse<T>(raw: string): T {
  const stripped = raw
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    const starts = [stripped.indexOf("{"), stripped.indexOf("[")].filter((i) => i !== -1);
    const start = starts.length ? Math.min(...starts) : -1;
    const end = Math.max(stripped.lastIndexOf("}"), stripped.lastIndexOf("]"));

    if (start === -1 || end === -1 || end < start) {
      throw new Error(`Claude response did not contain valid JSON: ${stripped.slice(0, 200)}`);
    }

    return JSON.parse(stripped.slice(start, end + 1)) as T;
  }
}
