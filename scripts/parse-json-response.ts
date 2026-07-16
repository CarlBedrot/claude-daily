// Claude occasionally prefaces JSON output with conversational text (e.g.
// "Looking at these items, here's the briefing...") even when the prompt
// says "output ONLY valid JSON". Stripping markdown fences alone doesn't
// handle that case, so fall back to slicing out the outermost {...}/[...]
// before giving up.
//
// Separately, Claude sometimes emits a raw control character (most often a
// literal newline) inside a JSON string value instead of the escaped form
// (\n) the JSON spec requires -- e.g. a multi-line summary field. That
// produces a structurally intact but spec-invalid document, which
// JSON.parse rejects with "Bad control character in string literal"
// regardless of the preamble-stripping above. sanitizeControlCharsInStrings
// walks the text tracking string-literal boundaries and escapes any raw
// control character found inside one, leaving everything outside string
// literals (including JSON's own structural whitespace) untouched.
function sanitizeControlCharsInStrings(text: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const ch of text) {
    if (!inString) {
      result += ch;
      if (ch === '"') inString = true;
      continue;
    }

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = false;
      result += ch;
      continue;
    }

    const code = ch.charCodeAt(0);
    if (code < 0x20) {
      switch (ch) {
        case "\n":
          result += "\\n";
          break;
        case "\r":
          result += "\\r";
          break;
        case "\t":
          result += "\\t";
          break;
        default:
          result += "\\u" + code.toString(16).padStart(4, "0");
      }
      continue;
    }

    result += ch;
  }

  return result;
}

function extractOutermostJson(text: string): string | null {
  const starts = [text.indexOf("{"), text.indexOf("[")].filter((i) => i !== -1);
  const start = starts.length ? Math.min(...starts) : -1;
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));

  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start, end + 1);
}

export function parseJsonResponse<T>(raw: string): T {
  const stripped = raw
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  const sliced = extractOutermostJson(stripped);
  const candidates = sliced && sliced !== stripped ? [stripped, sliced] : [stripped];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      try {
        return JSON.parse(sanitizeControlCharsInStrings(candidate)) as T;
      } catch {
        // try the next candidate
      }
    }
  }

  throw new Error(`Claude response did not contain valid JSON: ${stripped.slice(0, 200)}`);
}
