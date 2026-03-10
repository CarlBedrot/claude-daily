import { searchBriefings } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return Response.json({ results: [], query: "" });
  }

  const results = searchBriefings(query);

  return Response.json(
    { results, query },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
