import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import { DailyBriefing } from "../src/types/daily";

const anthropic = new Anthropic();

const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

export async function generateAudioScript(
  briefing: DailyBriefing,
): Promise<string> {
  const formattedDate = new Date(
    briefing.date + "T00:00:00",
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const tabSummaries = Object.entries(briefing.tabs)
    .filter(([key]) => key !== "tips")
    .map(([key, tab]) => {
      const stories = tab.stories.slice(0, 3);
      if (stories.length === 0) return "";
      const storyLines = stories
        .map((s) => `- ${s.headline}: ${s.summary}`)
        .join("\n");
      return `### ${tab.label}\n${storyLines}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const tipSection =
    briefing.tabs.tips?.stories
      ?.slice(0, 2)
      .map((t) => `- ${t.headline}: ${t.summary}`)
      .join("\n") ?? "";

  const digest =
    typeof briefing.digest === "object" && briefing.digest
      ? briefing.digest.lead
      : typeof briefing.digest === "string"
        ? briefing.digest
        : "";

  const prompt = `Write a 2-3 minute audio briefing script for a daily AI news podcast called "Claude Daily". This will be read aloud by a text-to-speech system, so write it conversationally — short sentences, natural rhythm, no markdown formatting or special characters.

Date: ${formattedDate}

Digest: ${digest}

${tabSummaries}

${tipSection ? `### Quick Tips\n${tipSection}` : ""}

Guidelines:
- Open with "Good morning, here's your Claude Daily for ${formattedDate}."
- Cover the top 2-3 stories briefly (1-2 sentences each)
- Mention 1 tip if there's a good one
- Close with something like "That's your Claude Daily. See you tomorrow."
- Keep it under 400 words
- No URLs, no source attributions, no bullet points
- Write for the ear, not the eye`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.find((c) => c.type === "text");
  return text?.text ?? "";
}

export async function synthesizeAudio(
  script: string,
  date: string,
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  const blob = await put(`audio/${date}.mp3`, audioBuffer, {
    access: "public",
    contentType: "audio/mpeg",
  });

  return blob.url;
}

export async function generateDailyAudio(
  briefing: DailyBriefing,
): Promise<string | null> {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      console.log("  Skipping audio generation (ELEVENLABS_API_KEY not set)");
      return null;
    }

    console.log("Generating audio script...");
    const script = await generateAudioScript(briefing);
    console.log(
      `  Script: ${script.length} chars (~${Math.ceil(script.split(/\s+/).length / 150)} min)`,
    );

    console.log("Synthesizing audio with ElevenLabs...");
    const audioUrl = await synthesizeAudio(script, briefing.date);
    console.log(`  Audio: ${audioUrl}`);

    return audioUrl;
  } catch (error) {
    console.error("Audio generation failed (non-fatal):", error);
    return null;
  }
}
