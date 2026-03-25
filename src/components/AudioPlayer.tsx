"use client";

import { useState, useRef, useEffect } from "react";

type AudioPlayerProps = {
  audioUrl: string;
};

const SPEEDS = [1, 1.5, 2] as const;

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6 4l10 6-10 6V4z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="5" y="4" width="3.5" height="12" rx="1" />
      <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
    </svg>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = SPEEDS[next];
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 pb-1">
      <div className="flex items-center gap-3 bg-cream-dark/50 rounded-lg px-4 py-3">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        <button
          onClick={togglePlay}
          className="shrink-0 w-9 h-9 rounded-full bg-claude-orange text-white flex items-center justify-center hover:bg-claude-orange-hover transition-colors cursor-pointer"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-secondary mb-1.5">
            <span>{formatTime(currentTime)}</span>
            <span className="text-gray-secondary/50">/</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div
            className="h-1.5 bg-cream-dark rounded-full cursor-pointer"
            onClick={seek}
          >
            <div
              className="h-full bg-claude-orange rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={cycleSpeed}
          className="shrink-0 text-xs font-semibold text-gray-secondary hover:text-claude-orange transition-colors px-2 py-1 rounded cursor-pointer"
          aria-label="Playback speed"
        >
          {SPEEDS[speedIndex]}x
        </button>
      </div>
    </div>
  );
}
