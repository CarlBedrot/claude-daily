import { NextRequest, NextResponse } from "next/server";
import { head, put } from "@vercel/blob";
import { getBriefing } from "@/lib/data";

const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const storyId = searchParams.get("storyId");

  if (!date || !storyId) {
    return NextResponse.json(
      { error: "Missing date or storyId" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Audio generation not configured" },
      { status: 503 },
    );
  }

  const blobKey = `audio/story/${date}/${storyId}.mp3`;

  // Check cache
  try {
    const existing = await head(blobKey);
    if (existing) {
      return NextResponse.json({ audio_url: existing.url });
    }
  } catch {
    // Not found in cache, generate it
  }

  // Find the story text
  const briefing = await getBriefing(date);
  if (!briefing) {
    return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
  }

  let storyText = "";
  for (const tab of Object.values(briefing.tabs)) {
    const story = tab.stories.find((s) => s.id === storyId);
    if (story) {
      storyText = `${story.headline}. ${story.summary}`;
      if (story.impact) {
        storyText += ` ${story.impact}`;
      }
      break;
    }
  }

  if (!storyText) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  // Strip footnote markers like [1], [2]
  storyText = storyText.replace(/\[\d+\]/g, "");

  try {
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: storyText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
          },
        }),
      },
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      return NextResponse.json(
        { error: `TTS failed: ${errorText}` },
        { status: 502 },
      );
    }

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());

    const blob = await put(blobKey, audioBuffer, {
      access: "public",
      contentType: "audio/mpeg",
    });

    return NextResponse.json({ audio_url: blob.url });
  } catch (error) {
    return NextResponse.json(
      { error: `Audio generation failed: ${error}` },
      { status: 500 },
    );
  }
}
