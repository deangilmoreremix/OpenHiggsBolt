'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Image as ImageIcon, Sparkles, Upload, X, Search, Download } from 'lucide-react';

const AI_EFFECTS = [
  { name: 'Kiss Me AI', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss_Me_AI.webp', prompt: 'romantic kiss me ai cinematic effect', emoji: '💋' },
  { name: 'Kiss', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss.webp', prompt: 'romantic kiss cinematic effect close up', emoji: '😘' },
  { name: 'Venom', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Venom.webp', prompt: 'venom black symbiote transformation engulfs subject', emoji: '🖤' },
  { name: 'Hulk', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Hulk_.webp', prompt: 'hulk green muscle transformation rage', emoji: '💚' },
  { name: 'Muscle Surge', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Muscle_Surge.webp', prompt: 'extreme muscle growth power surge transformation', emoji: '💪' },
  { name: 'The Tiger Touch', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/The_Tiger_Touch.webp', prompt: 'majestic tiger appears and gently touches subject', emoji: '🐯' },
  { name: 'Anything Robot', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Anything_Robot.webp', prompt: 'subject transforms into robot mechanical parts assembling', emoji: '🤖' },
  { name: 'Warmth of Jesus', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Warmth_of_Jesus.webp', prompt: 'divine holy light warmth spiritual glow effect', emoji: '✨' },
  { name: 'Holy Wings', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Holy_Wings.webp', prompt: 'angelic white wings appear spreading divine light', emoji: '🪽' },
  { name: 'Microwave', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Microwave.webp', prompt: 'microwave radiation heat distortion surreal effect', emoji: '📡' },
  { name: 'Iron Man', prompt: 'iron man suit assembles around subject piece by piece', emoji: '🦾' },
  { name: 'Spiderman', prompt: 'spiderman web shoots out transformation cinematic', emoji: '🕷️' },
  { name: 'Dragon Ball', prompt: 'dragon ball super saiyan golden power up aura explosion', emoji: '⚡' },
  { name: 'Freeze', prompt: 'ice freeze spreads across everything crystalline frozen', emoji: '❄️' },
  { name: 'Invisibility', prompt: 'subject turns invisible predator cloaking effect', emoji: '👻' },
  { name: 'Zombie', prompt: 'zombie transformation decaying undead horror effect', emoji: '🧟' },
  { name: 'Mermaid', prompt: 'mermaid transformation scales tail ocean fantasy', emoji: '🧜' },
  { name: 'Werewolf', prompt: 'werewolf transformation fur claws howl full moon', emoji: '🐺' },
  { name: 'Vampire', prompt: 'vampire transformation pale fangs dark gothic', emoji: '🧛' },
  { name: 'Witch', prompt: 'witch transformation magic spell casting dark fantasy', emoji: '🧙' },
  { name: 'Angel', prompt: 'angel transformation golden wings divine light halo', emoji: '😇' },
  { name: 'Demon', prompt: 'demon transformation dark wings fire eyes horror', emoji: '😈' },
  { name: 'Phoenix', prompt: 'phoenix fire transformation rises from ashes flames', emoji: '🔥' },
  { name: 'Crystal', prompt: 'subject crystallizes into sparkling gemstone crystal', emoji: '💎' },
  { name: 'Gold Transform', prompt: 'everything turns to solid gold midas touch effect', emoji: '🥇' },
  { name: 'Age Regression', prompt: 'subject grows younger reverse aging effect', emoji: '👶' },
  { name: 'Age Progression', prompt: 'rapid aging transformation grows old time lapse', emoji: '👴' },
  { name: 'Gender Swap', prompt: 'gender transformation face morphing AI effect', emoji: '🔄' },
];

const MOTION_CONTROLS = [
  { name: '360 Orbit', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/360+Orbit.webp', prompt: '0rb4it 360 degree orbit camera circles subject completely', emoji: '🔄' },
  { name: 'Hero Run', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Action+Run.webp', prompt: '4ct3ion Action Run hero sprints toward camera slow motion', emoji: '🏃' },
  { name: 'Arc Shot', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Arc.webp', prompt: '34Ar2c arc camera moves in smooth curve around subject', emoji: '🌀' },
  { name: 'Matrix Shot', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Bullet+Time.webp', prompt: 'b4ll3t t1m3 bullet time matrix freeze 360 rotation', emoji: '💊' },
  { name: 'Car Chase', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Car+Chasing.webp', prompt: 'c4r ch4s3 car chase high speed pursuit dynamic camera', emoji: '🚗' },
  { name: 'Crane Down', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Down.webp', prompt: 'cr4n3 crane down camera descends from above', emoji: '⬇️' },
  { name: 'Crane Up', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Up.webp', prompt: 'crane up camera rises revealing scene below', emoji: '⬆️' },
  { name: 'Crash Zoom In', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+In.webp', prompt: 'cr4sh z00m in rapid crash zoom punch into subject', emoji: '🔍' },
  { name: 'Crash Zoom Out', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+Out.webp', prompt: 'crash zoom out rapid pull back reveal wide scene', emoji: '🔎' },
  { name: 'Dolly In', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Dolly+In.webp', prompt: 'smooth dolly push toward subject cinematic rack focus', emoji: '📹' },
  { name: 'Dolly Out', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Dolly+Out.webp', prompt: 'smooth dolly pull back from subject reveal environment', emoji: '🎥' },
  { name: 'Drone Flight', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Drone+Flight.webp', prompt: 'drone aerial flight swooping forward overhead view', emoji: '🚁' },
  { name: 'Dutch Angle', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Dutch+Angle.webp', prompt: 'dutch angle tilted camera roll disorienting cinematic', emoji: '📐' },
  { name: 'FPV Dive', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/FPV+Dive.webp', prompt: 'FPV drone dive first person racing spin', emoji: '🎯' },
  { name: 'Handheld', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Handheld.webp', prompt: 'handheld documentary style camera natural shake', emoji: '✋' },
  { name: 'Jib Arm', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Jib+Arm.webp', prompt: 'jib arm swing camera sweeps up and over subject', emoji: '🏗️' },
  { name: 'Ken Burns', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Ken+Burns.webp', prompt: 'ken burns effect slow pan and zoom documentary', emoji: '📸' },
  { name: 'Low Angle', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Low+Angle.webp', prompt: 'low angle worm eye view looking up powerful dramatic', emoji: '🐛' },
  { name: 'Overhead Crane', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Overhead+Crane.webp', prompt: 'overhead crane bird eye view directly above looking down', emoji: '🦅' },
  { name: 'Pan Left', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pan+Left.webp', prompt: 'camera pans smoothly to the left following action', emoji: '⬅️' },
  { name: 'Pan Right', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pan+Right.webp', prompt: 'camera pans smoothly to the right revealing scene', emoji: '➡️' },
  { name: 'Parallax', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Parallax.webp', prompt: 'parallax depth effect foreground and background separate', emoji: '🌊' },
  { name: 'Pedestal Down', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pedestal+Down.webp', prompt: 'pedestal camera drops straight down vertically', emoji: '⬇️' },
  { name: 'Pedestal Up', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pedestal+Up.webp', prompt: 'pedestal camera rises straight up vertically revealing', emoji: '⬆️' },
  { name: 'Pull Focus', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pull+Focus.webp', prompt: 'pull focus rack focus shift between foreground background', emoji: '🎯' },
  { name: 'Push In', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Push+In.webp', prompt: 'camera pushes in forward motion toward subject intense', emoji: '➡️' },
  { name: 'Roll', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Roll.webp', prompt: 'camera barrel roll rotation spinning around axis', emoji: '🌀' },
  { name: 'Shake', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Shake.webp', prompt: 'camera shake earthquake impact tremor effect intense', emoji: '📳' },
  { name: 'Tilt Down', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tilt+Down.webp', prompt: 'camera tilts down from high to low reveal feet ground', emoji: '⬇️' },
  { name: 'Tilt Up', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tilt+Up.webp', prompt: 'camera tilts up revealing tall subject sky epic', emoji: '⬆️' },
  { name: 'Tracking Shot', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tracking+Shot.webp', prompt: 'tracking shot camera follows alongside moving subject', emoji: '📍' },
  { name: 'Truck Left', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Truck+Left.webp', prompt: 'truck left camera moves laterally to the left', emoji: '⬅️' },
  { name: 'Truck Right', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Truck+Right.webp', prompt: 'truck right camera moves laterally to the right', emoji: '➡️' },
  { name: 'Vertigo Effect', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Vertigo.webp', prompt: 'hitchcock vertigo dolly zoom background stretches dizzy', emoji: '😵' },
  { name: 'Whip Pan', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Whip+Pan.webp', prompt: 'fast whip pan blur transition between scenes rapid', emoji: '💨' },
  { name: 'Zoom In', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Zoom+In.webp', prompt: 'slow dramatic zoom in toward subject cinematic', emoji: '🔍' },
  { name: 'Zoom Out', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Zoom+Out.webp', prompt: 'slow dramatic zoom out reveal wide landscape epic', emoji: '🔎' },
];

const VFX_EFFECTS = [
  { name: 'Building Explosion', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Building+Explosion.webp', prompt: 'massive building explosion debris shockwave fireball destruction', emoji: '🏢' },
  { name: 'Car Explosion', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Car+Explosion.webp', prompt: 'car explodes massive fireball action movie shockwave', emoji: '🚘' },
  { name: 'Decay Time-Lapse', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Decay+Time-Lapse.webp', prompt: 'rapid decay time lapse organic decomposition nature', emoji: '🍂' },
  { name: 'Disintegration', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Disintegration.webp', prompt: 'subject disintegrates into dust particles thanos snap ash', emoji: '💨' },
  { name: 'Electricity', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Electricity.webp', prompt: 'electric lightning bolts surge around subject plasma arcs', emoji: '⚡' },
  { name: 'Flying', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Flying.webp', prompt: 'subject lifts off and flies through sky superhero', emoji: '🦅' },
  { name: 'Huge Explosion', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Huge+Explosion.webp', prompt: 'massive nuclear explosion mushroom cloud shockwave destruction', emoji: '💥' },
  { name: 'Levitate', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Levitate.webp', prompt: 'subject levitates floats upward defying gravity telekinesis', emoji: '🌟' },
  { name: 'Tornado', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Tornado.webp', prompt: 'massive tornado forms approaches swirling destruction debris', emoji: '🌪️' },
  { name: 'Fire Effect', prompt: 'dramatic fire engulfs everything cinematic flame inferno', emoji: '🔥' },
  { name: 'Tsunami', prompt: 'giant tsunami wave crashes through scene flooding destruction', emoji: '🌊' },
  { name: 'Meteor Strike', prompt: 'meteor strikes ground massive impact explosion crater', emoji: '☄️' },
  { name: 'Black Hole', prompt: 'black hole forms pulls everything in gravitational lensing', emoji: '🌑' },
  { name: 'Portal Open', prompt: 'interdimensional portal opens swirling vortex glowing energy', emoji: '🌀' },
  { name: 'Time Freeze', prompt: 'time freezes everything stops mid action suspended', emoji: '⏱️' },
  { name: 'Gravity Flip', prompt: 'gravity reverses everything floats rises upward surreal', emoji: '🔄' },
  { name: 'Glass Shatter', prompt: 'world shatters like breaking glass into pieces', emoji: '💎' },
  { name: 'Laser Beam', prompt: 'powerful laser beam shoots through destroying everything', emoji: '🔴' },
  { name: 'Smoke Bomb', prompt: 'colorful smoke bomb explosion billows fills entire frame', emoji: '💜' },
  { name: 'Snow Storm', prompt: 'blizzard snow storm sweeps through freezing everything', emoji: '❄️' },
  { name: 'Rain Storm', prompt: 'heavy rain storm pours down dramatic lightning thunder', emoji: '⛈️' },
  { name: 'Earthquake', prompt: 'massive earthquake ground splits cracks destroy everything', emoji: '🌍' },
  { name: 'Volcanic Eruption', prompt: 'volcano erupts lava flows ash cloud massive destruction', emoji: '🌋' },
  { name: 'Nuclear Blast', prompt: 'nuclear explosion shockwave obliterates everything white flash', emoji: '☢️' },
  { name: 'Acid Rain', prompt: 'toxic acid rain melts dissolves everything it touches', emoji: '🧪' },
];

const ASPECT_RATIOS = [{ value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '1:1', label: '1:1' }];
const RESOLUTIONS = [{ value: '480p', label: '480p' }, { value: '720p', label: '720p' }];
const DURATIONS = [5, 10];
const QUALITIES = [{ value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }];

type Effect = { name: string; preview?: string; prompt: string; emoji: string };

export default function VFXGenerate() {
  const [activeCategory, setActiveCategory] = useState<'AI Effects' | 'Motion Controls' | 'VFX'>('AI Effects');
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('480p');
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState('medium');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{ effect: string; url: string; thumb?: string }[]>([]);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allEffects = activeCategory === 'AI Effects' ? AI_EFFECTS : activeCategory === 'Motion Controls' ? MOTION_CONTROLS : VFX_EFFECTS;
  const filteredEffects = search.trim() ? allEffects.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())) : allEffects;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageUrl('');
    setShowUrlInput(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageUrl('');
    }
  };

  const clearImage = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target && typeof e.target.result === 'string' ? e.target.result : '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleGenerate = async () => {
    if (!selectedEffect) {
      setError('Select an effect first');
      return;
    }
    const finalImageUrl = imageUrl || (uploadedFile ? await toBase64(uploadedFile) : null);
    if (!finalImageUrl) {
      setError('Upload an image or enter an image URL');
      return;
    }
    setIsGenerating(true);
    setError('');
    setVideoUrl(null);
    setStatusMsg('Submitting to MuAPI...');

    try {
      const res = await fetch('/api/vfx/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${selectedEffect.prompt}${prompt ? '. ' + prompt : ''}`,
          image_url: finalImageUrl,
          name: selectedEffect.name,
          aspect_ratio: aspectRatio,
          resolution,
          quality,
          duration,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      const id = data.request_id || data.id || data.task_id;
      if (!id) throw new Error('No job ID returned from generation');

      setStatusMsg('Processing: typically 1–3 minutes');
      startPolling(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setIsGenerating(false);
    }
  };

  const startPolling = (id: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/vfx/status?id=${id}`);
        const data = await res.json().catch(() => ({}));
        let url = data.video_url || data.url;
        if (data.outputs && Array.isArray(data.outputs)) {
          url = data.outputs[0] || url;
        } else if (data.output && typeof data.output === 'string') {
          url = data.output;
        }

        if (url || data.status === 'completed') {
          setVideoUrl(url || '');
          setIsGenerating(false);
          setStatusMsg('Done');
          if (selectedEffect && url) {
            setHistory((prev) => [{ effect: selectedEffect.name, url, thumb: previewUrl || undefined }, ...prev.slice(0, 19)]);
          }
          return;
        }

        if (data.status === 'failed') {
          setError(data.error || 'Generation failed');
          setIsGenerating(false);
          return;
        }

        setStatusMsg(`Processing: ${data.status || 'pending'}...`);
        pollRef.current = setTimeout(poll, 4000);
      } catch {
        pollRef.current = setTimeout(poll, 6000);
      }
    };

    pollRef.current = setTimeout(poll, 2000);
  };

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  const handleDownload = async () => {
    if (!videoUrl) return;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vfx-${selectedEffect ? selectedEffect.name : 'video'}.mp4`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>VFX Studio</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI effects, motion controls, and VFX</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-16 border-r flex flex-col items-center py-4 gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="px-2 space-y-2 w-full">
            {(['AI Effects', 'Motion Controls', 'VFX'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setActiveCategory(item)}
                className={`w-full flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-colors ${
                  activeCategory === item ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                style={{ color: activeCategory === item ? 'var(--selected-text)' : 'var(--text-muted)' }}
              >
                <span>{item === 'AI Effects' ? '⭐' : item === 'Motion Controls' ? '🎬' : '💥'}</span>
                <span className="leading-tight">{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search effects..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowUrlInput((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <ImageIcon size={14} />
              <span>URL</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <Upload size={14} />
              <span>Upload</span>
            </button>
          </div>

          {showUrlInput && (
            <div className="px-6 py-3 border-b flex gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                Done
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredEffects.map((effect) => {
                const isSelected = selectedEffect && selectedEffect.name === effect.name;
                return (
                  <button
                    key={effect.name}
                    onClick={() => setSelectedEffect(effect)}
                    className={`flex flex-col rounded-xl border transition-colors ${
                      isSelected ? 'border-[var(--selected-border)]' : 'border-[var(--border-color)]'
                    }`}
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <div className="aspect-video w-full overflow-hidden rounded-t-xl" style={{ background: 'var(--bg-panel)' }}>
                      {effect.preview ? (
                        <img src={effect.preview} alt={effect.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">{effect.emoji}</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {effect.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t px-6 py-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-panel)' }}>
        <div className="flex flex-wrap items-center gap-4">
          {selectedEffect && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
              {selectedEffect.preview && (
                <img src={selectedEffect.preview} alt={selectedEffect.name} className="w-8 h-8 rounded-lg object-cover" />
              )}
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedEffect.name}</span>
              <button type="button" onClick={() => setSelectedEffect(null)} className="p-1 rounded-full hover:bg-white/10">
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          )}

          {previewUrl && (
            <div className="flex items-center gap-2">
              <img src={previewUrl} alt="Uploaded" className="w-10 h-10 rounded-lg object-cover border" style={{ borderColor: 'var(--border-color)' }} />
              <span className="text-xs truncate max-w-[220px]" style={{ color: 'var(--text-secondary)' }}>
                {uploadedFile ? uploadedFile.name : 'Uploaded image'}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setAspectRatio(r.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  aspectRatio === r.value ? 'border' : ''
                }`}
                style={{
                  background: 'var(--bg-card)',
                  color: aspectRatio === r.value ? 'var(--selected-text)' : 'var(--text-secondary)',
                  borderColor: aspectRatio === r.value ? 'var(--selected-border)' : 'transparent',
                }}
              >
                {r.label}
              </button>
            ))}
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            {RESOLUTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setResolution(r.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  resolution === r.value ? 'border' : ''
                }`}
                style={{
                  background: 'var(--bg-card)',
                  color: resolution === r.value ? 'var(--selected-text)' : 'var(--text-secondary)',
                  borderColor: resolution === r.value ? 'var(--selected-border)' : 'transparent',
                }}
              >
                {r.label}
              </button>
            ))}
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  duration === d ? 'border' : ''
                }`}
                style={{
                  background: 'var(--bg-card)',
                  color: duration === d ? 'var(--selected-text)' : 'var(--text-secondary)',
                  borderColor: duration === d ? 'var(--selected-border)' : 'transparent',
                }}
              >
                {d}s
              </button>
            ))}
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            {QUALITIES.map((q) => (
              <button
                key={q.value}
                type="button"
                onClick={() => setQuality(q.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  quality === q.value ? 'border' : ''
                }`}
                style={{
                  background: 'var(--bg-card)',
                  color: quality === q.value ? 'var(--selected-text)' : 'var(--text-secondary)',
                  borderColor: quality === q.value ? 'var(--selected-border)' : 'transparent',
                }}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--selected-bg)', color: 'var(--selected-text)' }}
            >
              {isGenerating ? <Sparkles size={16} className="animate-pulse" /> : <Play size={16} />}
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {(statusMsg || error) && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {statusMsg && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{statusMsg}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}

        {videoUrl && (
          <div className="mt-4 flex flex-wrap items-center gap-4 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
            <video src={videoUrl} controls className="max-h-[220px] rounded-lg" style={{ background: '#000' }} />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--selected-bg)', color: 'var(--selected-text)' }}
              >
                <Download size={14} />
                Download
              </button>
              <button
                type="button"
                onClick={() => window.open(videoUrl, '_blank')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                <ImageIcon size={14} />
                Open
              </button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Recent</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {history.map((item, idx) => (
                <button
                  key={`${item.url}-${idx}`}
                  type="button"
                  onClick={() => setVideoUrl(item.url)}
                  className="flex-shrink-0 w-28 rounded-lg overflow-hidden border text-left"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
                >
                  {item.thumb ? (
                    <img src={item.thumb} alt={item.effect} className="w-full h-16 object-cover" />
                  ) : (
                    <div className="w-full h-16 flex items-center justify-center text-xl" style={{ background: 'var(--bg-panel)' }}>
                      🎬
                    </div>
                  )}
                  <div className="px-2 py-1">
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-primary)' }}>{item.effect}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
