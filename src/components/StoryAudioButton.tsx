"use client";

import { useState, useRef } from "react";

type StoryAudioButtonProps = {
  date: string;
  storyId: string;
};

function SpeakerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 5.5h2l3-2.5v8L4 8.5H2a1 1 0 01-1-1v-1a1 1 0 011-1z" />
      <path d="M10 4.5a3.5 3.5 0 010 5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="20 10"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    </svg>
  );
}

export function StoryAudioButton({ date, storyId }: StoryAudioButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleClick = async () => {
    if (state === "playing") {
      audioRef.current?.pause();
      audioRef.current = null;
      setState("idle");
      return;
    }

    if (state === "loading") return;

    setState("loading");
    try {
      const res = await fetch(
        `/api/audio?date=${encodeURIComponent(date)}&storyId=${encodeURIComponent(storyId)}`,
      );
      if (!res.ok) {
        setState("idle");
        return;
      }
      const data = await res.json();
      if (!data.audio_url) {
        setState("idle");
        return;
      }

      const audio = new Audio(data.audio_url);
      audioRef.current = audio;
      audio.addEventListener("ended", () => {
        setState("idle");
        audioRef.current = null;
      });
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      className="p-1 rounded-full hover:bg-claude-orange/10 text-gray-secondary hover:text-claude-orange transition-colors cursor-pointer"
      aria-label={
        state === "playing"
          ? "Stop audio"
          : state === "loading"
            ? "Loading audio..."
            : "Listen to this story"
      }
      title={
        state === "playing"
          ? "Stop"
          : state === "loading"
            ? "Loading..."
            : "Listen"
      }
    >
      {state === "loading" ? (
        <SpinnerIcon />
      ) : state === "playing" ? (
        <StopIcon />
      ) : (
        <SpeakerIcon />
      )}
    </button>
  );
}
