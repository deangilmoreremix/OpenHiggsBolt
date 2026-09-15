"use client";

import { useState } from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "voice", label: "Voice" },
  { id: "dub", label: "Dub" },
  { id: "stories", label: "Stories" },
  { id: "audiobook", label: "Audiobook" },
  { id: "voices", label: "Voices" },
  { id: "transcriptions", label: "Transcriptions" },
  { id: "projects", label: "Projects" },
];

export default function VoiceStudio() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <h1 className="text-lg font-semibold">Voice Studio</h1>
        <span className="text-xs text-white/50">SmartVideo GO</span>
        <div className="ml-auto flex items-center gap-2">
          <BackendStatus />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="flex w-64 flex-col gap-1 border-r border-white/10 p-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && <OverviewPlaceholder />}
          {activeTab === "voice" && <SectionPlaceholder title="Voice" description="Voice generation and cloning workspace." />}
          {activeTab === "dub" && <SectionPlaceholder title="Dub" description="Multi-language dubbing and voice casting." />}
          {activeTab === "stories" && <SectionPlaceholder title="Stories" description="Story narration and audio storytelling." />}
          {activeTab === "audiobook" && <SectionPlaceholder title="Audiobook" description="Long-form audiobook generation." />}
          {activeTab === "voices" && <SectionPlaceholder title="Voices" description="Voice gallery and profile management." />}
          {activeTab === "transcriptions" && <SectionPlaceholder title="Transcriptions" description="Speech-to-text and transcription history." />}
          {activeTab === "projects" && <SectionPlaceholder title="Projects" description="Voice project management and batch queue." />}
        </main>
      </div>
    </div>
  );
}

function OverviewPlaceholder() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-semibold">Voice Studio</h2>
      <p className="text-white/70">
        SmartVideo GO voice experiences are powered by a separate cloud inference
        backend. This scaffold preserves the existing Audio, Video, Cinema, and
        all other studios while adding the new Voice Studio route.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <FeatureCard title="Text to Speech" description="Generate natural speech from text." />
        <FeatureCard title="Voice Cloning" description="Clone voices from audio samples." />
        <FeatureCard title="Dubbing" description="Multi-language dub with voice casting." />
        <FeatureCard title="Transcription" description="Accurate speech-to-text with timestamps." />
      </div>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card-bg p-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-white/70">{description}</p>
    </div>
  );
}

function SectionPlaceholder({ title, description }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-white/70">{description}</p>
      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-white/50">
        Coming soon
      </div>
    </div>
  );
}

function BackendStatus() {
  const [status, setStatus] = useState("checking");

  useState(() => {
    let cancelled = false;
    fetch("/api/voice/health")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data.status === "ok" ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  });

  return (
    <span className="flex items-center gap-2 text-xs text-white/60">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          status === "ready" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-yellow-500"
        }`}
      />
      {status === "ready" ? "Voice backend ready" : status === "error" ? "Voice backend unreachable" : "Checking voice backend"}
    </span>
  );
}
