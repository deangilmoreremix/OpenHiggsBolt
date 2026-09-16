"use client";

import { useState } from "react";

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
          {activeTab === "overview" && <OverviewLaunchpad onNavigate={setActiveTab} />}
          {activeTab === "voice" && <VoiceWorkspace />}
          {activeTab === "dub" && <DubShell />}
          {activeTab === "stories" && <StoriesWorkspace />}
          {activeTab === "audiobook" && <AudiobookWorkspace />}
          {activeTab === "voices" && <VoicesGallery />}
          {activeTab === "transcriptions" && <TranscriptionsWorkspace />}
          {activeTab === "projects" && <ProjectsWorkspace />}
        </main>
      </div>
    </div>
  );
}

function OverviewLaunchpad({ onNavigate }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Voice Studio</h2>
        <p className="text-white/70">
          Generate, clone, design, and deliver voice content. Pick a workspace to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LaunchCard title="From Audio" description="Clone or generate speech from a reference audio recording." onClick={() => onNavigate("voice")} />
        <LaunchCard title="By Design" description="Design a new voice from attributes, personality, and presets." onClick={() => onNavigate("voice")} />
        <LaunchCard title="Convert" description="Convert speech from one voice to another using source audio and a target profile." onClick={() => onNavigate("voice")} />
        <LaunchCard title="Dub" description="Import source video, translate, assign voices, and review dubbed output." onClick={() => onNavigate("dub")} />
        <LaunchCard title="Stories" description="Build narrated stories with script sections, voice assignment, and playback." onClick={() => onNavigate("stories")} />
        <LaunchCard title="Audiobook" description="Organize chapters, assign voices, and generate long-form audiobook content." onClick={() => onNavigate("audiobook")} />
        <LaunchCard title="Voices" description="Browse preset, saved, designed, and cloned voices." onClick={() => onNavigate("voices")} />
        <LaunchCard title="Transcriptions" description="Upload audio or video, transcribe, and export with timestamps." onClick={() => onNavigate("transcriptions")} />
        <LaunchCard title="Projects" description="Manage voice, dub, story, audiobook, and transcription projects." onClick={() => onNavigate("projects")} />
      </div>
    </div>
  );
}

function LaunchCard({ title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20 hover:bg-white/10"
    >
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-white/70">{description}</p>
    </button>
  );
}

function VoiceWorkspace() {
  const [mode, setMode] = useState("from-audio");
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Voice</h2>
        <span className="text-xs text-white/50">From Audio / By Design / Convert</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setMode("from-audio")} className={`rounded-lg px-3 py-2 text-sm ${mode === "from-audio" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}>From Audio</button>
        <button onClick={() => setMode("by-design")} className={`rounded-lg px-3 py-2 text-sm ${mode === "by-design" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}>By Design</button>
        <button onClick={() => setMode("convert")} className={`rounded-lg px-3 py-2 text-sm ${mode === "convert" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}>Convert</button>
      </div>
      {mode === "from-audio" && <FromAudioWorkspace />}
      {mode === "by-design" && <ByDesignWorkspace />}
      {mode === "convert" && <ConvertWorkspace />}
    </div>
  );
}

function FromAudioWorkspace() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("idle");
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-medium">Reference audio</h3>
        <div className="space-y-2">
          <input type="file" accept="audio/*" className="block w-full text-sm text-white/70" />
          <div className="flex items-center gap-2">
            <button onClick={() => setRecording(!recording)} className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">
              {recording ? "Stop recording" : "Record"}
            </button>
            {recording && <span className="text-xs text-white/60">Recording...</span>}
          </div>
        </div>
        <AudioPreview label="Reference preview" />
      </div>
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-medium">Generation</h3>
        <textarea placeholder="Enter script or prompt..." className="min-h-[120px] w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/90 placeholder:text-white/40" />
        <div className="flex items-center gap-2">
          <button onClick={() => setStatus("processing")} className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Generate</button>
          {status === "processing" && <span className="text-xs text-white/60">Generating...</span>}
          {status === "completed" && <span className="text-xs text-green-400">Complete</span>}
        </div>
        <AudioPreview label="Result" />
      </div>
    </div>
  );
}

function ByDesignWorkspace() {
  const [attributes, setAttributes] = useState({ tone: "", pace: "", style: "", gender: "" });
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-medium">Describe your voice</h3>
        <textarea placeholder="Describe the voice you want..." className="min-h-[120px] w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/90 placeholder:text-white/40" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tone" value={attributes.tone} onChange={(e) => setAttributes({ ...attributes, tone: e.target.value })} placeholder="Warm, authoritative..." />
          <Field label="Pace" value={attributes.pace} onChange={(e) => setAttributes({ ...attributes, pace: e.target.value })} placeholder="Slow, conversational..." />
          <Field label="Style" value={attributes.style} onChange={(e) => setAttributes({ ...attributes, style: e.target.value })} placeholder="Narration, ad, podcast..." />
          <Field label="Gender" value={attributes.gender} onChange={(e) => setAttributes({ ...attributes, gender: e.target.value })} placeholder="Male, female, neutral..." />
        </div>
      </div>
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-medium">Synthesize</h3>
        <textarea placeholder="Script to preview..." className="min-h-[120px] w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/90 placeholder:text-white/40" />
        <button className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Synthesize</button>
        <AudioPreview label="Preview" />
      </div>
    </div>
  );
}

function ConvertWorkspace() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-medium">Source audio</h3>
        <input type="file" accept="audio/*" className="block w-full text-sm text-white/70" />
        <AudioPreview label="Source preview" />
      </div>
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-medium">Target voice</h3>
        <select className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-white/90">
          <option>Saved voice 1</option>
          <option>Saved voice 2</option>
          <option>Preset voice</option>
        </select>
        <button className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Convert</button>
        <AudioPreview label="Converted result" />
      </div>
    </div>
  );
}

function DubShell() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dub</h2>
        <span className="text-xs text-white/50">Source video + translation + casting</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-medium">Source</h3>
          <input type="file" accept="video/*" className="mt-2 block w-full text-sm text-white/70" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="Source language" placeholder="Auto detect" />
            <Field label="Target language" placeholder="English" />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
          <h3 className="font-medium">Casting</h3>
          <CastingBoard />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-medium">Timeline</h3>
        <TimelineShell />
      </div>
    </div>
  );
}

function StoriesWorkspace() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-xl font-semibold">Stories</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
          {["Scene 1", "Scene 2", "Scene 3"].map((scene) => (
            <div key={scene} className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{scene}</span>
                <span className="text-xs text-white/50">Voice: default</span>
              </div>
              <textarea placeholder={`Script for ${scene}...`} className="min-h-[80px] w-full rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-white/90 placeholder:text-white/40" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-medium">Playback</h3>
          <AudioPreview label="Story preview" />
        </div>
      </div>
    </div>
  );
}

function AudiobookWorkspace() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audiobook</h2>
        <span className="text-xs text-white/50">Chapters + voice assignment</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
          {["Chapter 1", "Chapter 2", "Chapter 3"].map((chapter) => (
            <div key={chapter} className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{chapter}</span>
                <span className="text-xs text-white/50">Voice: default</span>
              </div>
              <textarea placeholder={`Text for ${chapter}...`} className="min-h-[80px] w-full rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-white/90 placeholder:text-white/40" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-medium">Playback</h3>
          <AudioPreview label="Chapter preview" />
        </div>
      </div>
    </div>
  );
}

function VoicesGallery() {
  const [query, setQuery] = useState("");
  const voices = [
    { id: "preset-1", name: "Nova", type: "Preset", language: "English" },
    { id: "saved-1", name: "Founder", type: "Saved", language: "English" },
    { id: "designed-1", name: "Warm Narrator", type: "Designed", language: "English" },
    { id: "cloned-1", name: "Guest A", type: "Cloned", language: "English" },
  ];
  const filtered = voices.filter((v) => v.name.toLowerCase().includes(query.toLowerCase()) || v.type.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Voices</h2>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search voices..." className="w-64 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90 placeholder:text-white/40" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((voice) => (
          <div key={voice.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{voice.name}</h3>
                <p className="text-xs text-white/60">{voice.type} • {voice.language}</p>
              </div>
              <button className="rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20">Use</button>
            </div>
            <AudioPreview label="Preview" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TranscriptionsWorkspace() {
  const [status, setStatus] = useState("idle");
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h2 className="text-xl font-semibold">Transcriptions</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-medium">Upload</h3>
          <input type="file" accept="audio/*,video/*" className="block w-full text-sm text-white/70" />
          <Field label="Language" placeholder="Auto detect" />
          <button onClick={() => setStatus("processing")} className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">Transcribe</button>
          {status === "processing" && <p className="text-xs text-white/60">Processing...</p>}
        </div>
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-medium">Transcript</h3>
          <textarea readOnly placeholder="Transcription will appear here..." className="min-h-[200px] w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/90 placeholder:text-white/40" />
        </div>
      </div>
    </div>
  );
}

function ProjectsWorkspace() {
  const projects = [
    { id: "p1", name: "Product launch narration", type: "Voice", updated: "2h ago" },
    { id: "p2", name: "App trailer dub", type: "Dub", updated: "1d ago" },
    { id: "p3", name: "Chapter 1-3 draft", type: "Audiobook", updated: "3d ago" },
  ];
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <button className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20">New project</button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-xs text-white/60">{project.type} • {project.updated}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20">Open</button>
                <button className="rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20">Rename</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AudioPreview({ label }) {
  return (
    <div className="space-y-2">
      <span className="text-xs text-white/60">{label}</span>
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
        <button className="rounded-full bg-white/10 p-2 text-xs hover:bg-white/20">Play</button>
        <div className="h-1 flex-1 rounded-full bg-white/10" />
        <span className="text-xs text-white/50">0:00</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-white/70">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90 placeholder:text-white/40" />
    </div>
  );
}

function CastingBoard() {
  const speakers = ["Speaker 1", "Speaker 2", "Speaker 3"];
  return (
    <div className="space-y-2">
      {speakers.map((speaker) => (
        <div key={speaker} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
          <span className="text-sm">{speaker}</span>
          <select className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/90">
            <option>Default</option>
            <option>Preset voice</option>
            <option>Saved voice</option>
            <option>Designed voice</option>
            <option>Cloned voice</option>
          </select>
        </div>
      ))}
    </div>
  );
}

function TimelineShell() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button className="rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20">Play</button>
        <div className="h-2 flex-1 rounded-full bg-white/10" />
      </div>
      <div className="h-16 rounded-lg border border-dashed border-white/20 bg-white/5" />
    </div>
  );
}
