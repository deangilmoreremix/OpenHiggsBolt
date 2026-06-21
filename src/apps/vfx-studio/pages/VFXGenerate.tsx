'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Image as ImageIcon,
  Sparkles,
  Upload,
  X,
  Search,
  Download,
  Copy,
  RotateCcw,
  Link as LinkIcon,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import type { VFXEffect, AspectRatio, Resolution, Quality } from '@/types/vfx';

const STORAGE_KEY_UI = 'vfx_ui_state';

const AI_EFFECTS: VFXEffect[] = [
  { id: 'kiss-me-ai', name: 'Kiss Me AI', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss_Me_AI.webp', prompt: 'romantic kiss me ai cinematic effect', emoji: '💋', category: 'ai-effects' },
  { id: 'kiss', name: 'Kiss', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss.webp', prompt: 'romantic kiss cinematic effect close up', emoji: '😘', category: 'ai-effects' },
  { id: 'venom', name: 'Venom', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Venom.webp', prompt: 'venom black symbiote transformation engulfs subject', emoji: '🖤', category: 'ai-effects' },
  { id: 'hulk', name: 'Hulk', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Hulk_.webp', prompt: 'hulk green muscle transformation rage', emoji: '💚', category: 'ai-effects' },
  { id: 'muscle-surge', name: 'Muscle Surge', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Muscle_Surge.webp', prompt: 'extreme muscle growth power surge transformation', emoji: '💪', category: 'ai-effects' },
  { id: 'the-tiger-touch', name: 'The Tiger Touch', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/The_Tiger_Touch.webp', prompt: 'majestic tiger appears and gently touches subject', emoji: '🐯', category: 'ai-effects' },
  { id: 'anything-robot', name: 'Anything Robot', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Anything_Robot.webp', prompt: 'subject transforms into robot mechanical parts assembling', emoji: '🤖', category: 'ai-effects' },
  { id: 'warmth-of-jesus', name: 'Warmth of Jesus', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Warmth_of_Jesus.webp', prompt: 'divine holy light warmth spiritual glow effect', emoji: '✨', category: 'ai-effects' },
  { id: 'holy-wings', name: 'Holy Wings', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Holy_Wings.webp', prompt: 'angelic white wings appear spreading divine light', emoji: '🪽', category: 'ai-effects' },
  { id: 'microwave', name: 'Microwave', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Microwave.webp', prompt: 'microwave radiation heat distortion surreal effect', emoji: '📡', category: 'ai-effects' },
  { id: 'iron-man', name: 'Iron Man', prompt: 'iron man suit assembles around subject piece by piece', emoji: '🦾', category: 'ai-effects' },
  { id: 'spiderman', name: 'Spiderman', prompt: 'spiderman web shoots out transformation cinematic', emoji: '🕷️', category: 'ai-effects' },
  { id: 'dragon-ball', name: 'Dragon Ball', prompt: 'dragon ball super saiyan golden power up aura explosion', emoji: '⚡', category: 'ai-effects' },
  { id: 'freeze', name: 'Freeze', prompt: 'ice freeze spreads across everything crystalline frozen', emoji: '❄️', category: 'ai-effects' },
  { id: 'invisibility', name: 'Invisibility', prompt: 'subject turns invisible predator cloaking effect', emoji: '👻', category: 'ai-effects' },
  { id: 'zombie', name: 'Zombie', prompt: 'zombie transformation decaying undead horror effect', emoji: '🧟', category: 'ai-effects' },
  { id: 'mermaid', name: 'Mermaid', prompt: 'mermaid transformation scales tail ocean fantasy', emoji: '🧜', category: 'ai-effects' },
  { id: 'werewolf', name: 'Werewolf', prompt: 'werewolf transformation fur claws howl full moon', emoji: '🐺', category: 'ai-effects' },
  { id: 'vampire', name: 'Vampire', prompt: 'vampire transformation pale fangs dark gothic', emoji: '🧛', category: 'ai-effects' },
  { id: 'witch', name: 'Witch', prompt: 'witch transformation magic spell casting dark fantasy', emoji: '🧙', category: 'ai-effects' },
  { id: 'angel', name: 'Angel', prompt: 'angel transformation golden wings divine light halo', emoji: '😇', category: 'ai-effects' },
  { id: 'demon', name: 'Demon', prompt: 'demon transformation dark wings fire eyes horror', emoji: '😈', category: 'ai-effects' },
  { id: 'phoenix', name: 'Phoenix', prompt: 'phoenix fire transformation rises from ashes flames', emoji: '🔥', category: 'ai-effects' },
  { id: 'crystal', name: 'Crystal', prompt: 'subject crystallizes into sparkling gemstone crystal', emoji: '💎', category: 'ai-effects' },
  { id: 'gold-transform', name: 'Gold Transform', prompt: 'everything turns to solid gold midas touch effect', emoji: '🥇', category: 'ai-effects' },
  { id: 'age-regression', name: 'Age Regression', prompt: 'subject grows younger reverse aging effect', emoji: '👶', category: 'ai-effects' },
  { id: 'age-progression', name: 'Age Progression', prompt: 'rapid aging transformation grows old time lapse', emoji: '👴', category: 'ai-effects' },
  { id: 'gender-swap', name: 'Gender Swap', prompt: 'gender transformation face morphing AI effect', emoji: '🔄', category: 'ai-effects' },
];

const MOTION_CONTROLS: VFXEffect[] = [
  { id: '360-orbit', name: '360 Orbit', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/360+Orbit.webp', prompt: '0rb4it 360 degree orbit camera circles subject completely', emoji: '🔄', category: 'motion-controls' },
  { id: 'hero-run', name: 'Hero Run', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Action+Run.webp', prompt: '4ct3ion Action Run hero sprints toward camera slow motion', emoji: '🏃', category: 'motion-controls' },
  { id: 'arc-shot', name: 'Arc Shot', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Arc.webp', prompt: '34Ar2c arc camera moves in smooth curve around subject', emoji: '🌀', category: 'motion-controls' },
  { id: 'matrix-shot', name: 'Matrix Shot', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Bullet+Time.webp', prompt: 'b4ll3t t1m3 bullet time matrix freeze 360 rotation', emoji: '💊', category: 'motion-controls' },
  { id: 'car-chase', name: 'Car Chase', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Car+Chasing.webp', prompt: 'c4r ch4s3 car chase high speed pursuit dynamic camera', emoji: '🚗', category: 'motion-controls' },
  { id: 'crane-down', name: 'Crane Down', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Down.webp', prompt: 'cr4n3 crane down camera descends from above', emoji: '⬇️', category: 'motion-controls' },
  { id: 'crane-up', name: 'Crane Up', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Up.webp', prompt: 'crane up camera rises revealing scene below', emoji: '⬆️', category: 'motion-controls' },
  { id: 'crash-zoom-in', name: 'Crash Zoom In', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+In.webp', prompt: 'cr4sh z00m in rapid crash zoom punch into subject', emoji: '🔍', category: 'motion-controls' },
  { id: 'crash-zoom-out', name: 'Crash Zoom Out', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+Out.webp', prompt: 'crash zoom out rapid pull back reveal wide scene', emoji: '🔎', category: 'motion-controls' },
  { id: 'dolly-in', name: 'Dolly In', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Dolly+In.webp', prompt: 'smooth dolly push toward subject cinematic rack focus', emoji: '📹', category: 'motion-controls' },
  { id: 'dolly-out', name: 'Dolly Out', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Dolly+Out.webp', prompt: 'smooth dolly pull back from subject reveal environment', emoji: '🎥', category: 'motion-controls' },
  { id: 'drone-flight', name: 'Drone Flight', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Drone+Flight.webp', prompt: 'drone aerial flight swooping forward overhead view', emoji: '🚁', category: 'motion-controls' },
  { id: 'dutch-angle', name: 'Dutch Angle', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Dutch+Angle.webp', prompt: 'dutch angle tilted camera roll disorienting cinematic', emoji: '📐', category: 'motion-controls' },
  { id: 'fpv-dive', name: 'FPV Dive', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/FPV+Dive.webp', prompt: 'FPV drone dive first person racing spin', emoji: '🎯', category: 'motion-controls' },
  { id: 'handheld', name: 'Handheld', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Handheld.webp', prompt: 'handheld documentary style camera natural shake', emoji: '✋', category: 'motion-controls' },
  { id: 'jib-arm', name: 'Jib Arm', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Jib+Arm.webp', prompt: 'jib arm swing camera sweeps up and over subject', emoji: '🏗️', category: 'motion-controls' },
  { id: 'ken-burns', name: 'Ken Burns', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Ken+Burns.webp', prompt: 'ken burns effect slow pan and zoom documentary', emoji: '📸', category: 'motion-controls' },
  { id: 'low-angle', name: 'Low Angle', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Low+Angle.webp', prompt: 'low angle worm eye view looking up powerful dramatic', emoji: '🐛', category: 'motion-controls' },
  { id: 'overhead-crane', name: 'Overhead Crane', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Overhead+Crane.webp', prompt: 'overhead crane bird eye view directly above looking down', emoji: '🦅', category: 'motion-controls' },
  { id: 'pan-left', name: 'Pan Left', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pan+Left.webp', prompt: 'camera pans smoothly to the left following action', emoji: '⬅️', category: 'motion-controls' },
  { id: 'pan-right', name: 'Pan Right', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pan+Right.webp', prompt: 'camera pans smoothly to the right revealing scene', emoji: '➡️', category: 'motion-controls' },
  { id: 'parallax', name: 'Parallax', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Parallax.webp', prompt: 'parallax depth effect foreground and background separate', emoji: '🌊', category: 'motion-controls' },
  { id: 'pedestal-down', name: 'Pedestal Down', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pedestal+Down.webp', prompt: 'pedestal camera drops straight down vertically', emoji: '⬇️', category: 'motion-controls' },
  { id: 'pedestal-up', name: 'Pedestal Up', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pedestal+Up.webp', prompt: 'pedestal camera rises straight up vertically revealing', emoji: '⬆️', category: 'motion-controls' },
  { id: 'pull-focus', name: 'Pull Focus', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Pull+Focus.webp', prompt: 'pull focus rack focus shift between foreground background', emoji: '🎯', category: 'motion-controls' },
  { id: 'push-in', name: 'Push In', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Push+In.webp', prompt: 'camera pushes in forward motion toward subject intense', emoji: '➡️', category: 'motion-controls' },
  { id: 'roll', name: 'Roll', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Roll.webp', prompt: 'camera barrel roll rotation spinning around axis', emoji: '🌀', category: 'motion-controls' },
  { id: 'shake', name: 'Shake', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Shake.webp', prompt: 'camera shake earthquake impact tremor effect intense', emoji: '📳', category: 'motion-controls' },
  { id: 'tilt-down', name: 'Tilt Down', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tilt+Down.webp', prompt: 'camera tilts down from high to low reveal feet ground', emoji: '⬇️', category: 'motion-controls' },
  { id: 'tilt-up', name: 'Tilt Up', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tilt+Up.webp', prompt: 'camera tilts up revealing tall subject sky epic', emoji: '⬆️', category: 'motion-controls' },
  { id: 'tracking-shot', name: 'Tracking Shot', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tracking+Shot.webp', prompt: 'tracking shot camera follows alongside moving subject', emoji: '📍', category: 'motion-controls' },
  { id: 'truck-left', name: 'Truck Left', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Truck+Left.webp', prompt: 'truck left camera moves laterally to the left', emoji: '⬅️', category: 'motion-controls' },
  { id: 'truck-right', name: 'Truck Right', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Truck+Right.webp', prompt: 'truck right camera moves laterally to the right', emoji: '➡️', category: 'motion-controls' },
  { id: 'vertigo-effect', name: 'Vertigo Effect', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Vertigo.webp', prompt: 'hitchcock vertigo dolly zoom background stretches dizzy', emoji: '😵', category: 'motion-controls' },
  { id: 'whip-pan', name: 'Whip Pan', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Whip+Pan.webp', prompt: 'fast whip pan blur transition between scenes rapid', emoji: '💨', category: 'motion-controls' },
  { id: 'zoom-in', name: 'Zoom In', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Zoom+In.webp', prompt: 'slow dramatic zoom in toward subject cinematic', emoji: '🔍', category: 'motion-controls' },
  { id: 'zoom-out', name: 'Zoom Out', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Zoom+Out.webp', prompt: 'slow dramatic zoom out reveal wide landscape epic', emoji: '🔎', category: 'motion-controls' },
];

const VFX_EFFECTS: VFXEffect[] = [
  { id: 'building-explosion', name: 'Building Explosion', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Building+Explosion.webp', prompt: 'massive building explosion debris shockwave fireball destruction', emoji: '🏢', category: 'vfx' },
  { id: 'car-explosion', name: 'Car Explosion', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Car+Explosion.webp', prompt: 'car explodes massive fireball action movie shockwave', emoji: '🚘', category: 'vfx' },
  { id: 'decay-time-lapse', name: 'Decay Time-Lapse', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Decay+Time-Lapse.webp', prompt: 'rapid decay time lapse organic decomposition nature', emoji: '🍂', category: 'vfx' },
  { id: 'disintegration', name: 'Disintegration', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Disintegration.webp', prompt: 'subject disintegrates into dust particles thanos snap ash', emoji: '💨', category: 'vfx' },
  { id: 'electricity', name: 'Electricity', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Electricity.webp', prompt: 'electric lightning bolts surge around subject plasma arcs', emoji: '⚡', category: 'vfx' },
  { id: 'flying', name: 'Flying', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Flying.webp', prompt: 'subject lifts off and flies through sky superhero', emoji: '🦅', category: 'vfx' },
  { id: 'huge-explosion', name: 'Huge Explosion', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Huge+Explosion.webp', prompt: 'massive nuclear explosion mushroom cloud shockwave destruction', emoji: '💥', category: 'vfx' },
  { id: 'levitate', name: 'Levitate', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Levitate.webp', prompt: 'subject levitates floats upward defying gravity telekinesis', emoji: '🌟', category: 'vfx' },
  { id: 'tornado', name: 'Tornado', preview: 'https://d3adwkbyhxyrtq.cloudfront.net/vfxcontrols/Tornado.webp', prompt: 'massive tornado forms approaches swirling destruction debris', emoji: '🌪️', category: 'vfx' },
  { id: 'fire-effect', name: 'Fire Effect', prompt: 'dramatic fire engulfs everything cinematic flame inferno', emoji: '🔥', category: 'vfx' },
  { id: 'tsunami', name: 'Tsunami', prompt: 'giant tsunami wave crashes through scene flooding destruction', emoji: '🌊', category: 'vfx' },
  { id: 'meteor-strike', name: 'Meteor Strike', prompt: 'meteor strikes ground massive impact explosion crater', emoji: '☄️', category: 'vfx' },
  { id: 'black-hole', name: 'Black Hole', prompt: 'black hole forms pulls everything in gravitational lensing', emoji: '🌑', category: 'vfx' },
  { id: 'portal-open', name: 'Portal Open', prompt: 'interdimensional portal opens swirling vortex glowing energy', emoji: '🌀', category: 'vfx' },
  { id: 'time-freeze', name: 'Time Freeze', prompt: 'time freezes everything stops mid action suspended', emoji: '⏱️', category: 'vfx' },
  { id: 'gravity-flip', name: 'Gravity Flip', prompt: 'gravity reverses everything floats rises upward surreal', emoji: '🔄', category: 'vfx' },
  { id: 'glass-shatter', name: 'Glass Shatter', prompt: 'world shatters like breaking glass into pieces', emoji: '💎', category: 'vfx' },
  { id: 'laser-beam', name: 'Laser Beam', prompt: 'powerful laser beam shoots through destroying everything', emoji: '🔴', category: 'vfx' },
  { id: 'smoke-bomb', name: 'Smoke Bomb', prompt: 'colorful smoke bomb explosion billows fills entire frame', emoji: '💜', category: 'vfx' },
  { id: 'snow-storm', name: 'Snow Storm', prompt: 'blizzard snow storm sweeps through freezing everything', emoji: '❄️', category: 'vfx' },
  { id: 'rain-storm', name: 'Rain Storm', prompt: 'heavy rain storm pours down dramatic lightning thunder', emoji: '⛈️', category: 'vfx' },
  { id: 'earthquake', name: 'Earthquake', prompt: 'massive earthquake ground splits cracks destroy everything', emoji: '🌍', category: 'vfx' },
  { id: 'volcanic-eruption', name: 'Volcanic Eruption', prompt: 'volcano erupts lava flows ash cloud massive destruction', emoji: '🌋', category: 'vfx' },
  { id: 'nuclear-blast', name: 'Nuclear Blast', prompt: 'nuclear explosion shockwave obliterates everything white flash', emoji: '☢️', category: 'vfx' },
  { id: 'acid-rain', name: 'Acid Rain', prompt: 'toxic acid rain melts dissolves everything it touches', emoji: '🧪', category: 'vfx' },
];

const ALL_EFFECTS = [...AI_EFFECTS, ...MOTION_CONTROLS, ...VFX_EFFECTS];

const CATEGORIES = [
  { id: 'ai-effects', label: 'AI Effects', icon: '⭐' },
  { id: 'motion-controls', label: 'Motion Controls', icon: '🎬' },
  { id: 'vfx', label: 'VFX', icon: '💥' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
];

const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p' },
];

const DURATIONS = [5, 10];

const QUALITIES: { value: Quality; label: string }[] = [
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface UIState {
  activeCategory: CategoryId;
  selectedEffectId: string | null;
  imageUrl: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: number;
  quality: Quality;
}

function loadUIState(): Partial<UIState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UI);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUIState(state: UIState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_UI, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export default function VFXGenerate() {
  const saved = loadUIState();

  const [activeCategory, setActiveCategory] = useState<CategoryId>(saved?.activeCategory || 'ai-effects');
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(saved?.selectedEffectId || null);
  const [imageUrl, setImageUrl] = useState(saved?.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(saved?.prompt || '');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(saved?.aspectRatio || '16:9');
  const [resolution, setResolution] = useState<Resolution>(saved?.resolution || '480p');
  const [duration, setDuration] = useState(saved?.duration ?? 5);
  const [quality, setQuality] = useState<Quality>(saved?.quality || 'medium');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    progress,
    videoUrl,
    error,
    loading,
    requestId,
    uploadImage,
    generateVideo,
    cancelVideo,
    retryVideo,
    reset,
    setError,
  } = useVideoGeneration();

  const selectedEffect = useMemo(
    () => ALL_EFFECTS.find((e) => e.id === selectedEffectId) || null,
    [selectedEffectId]
  );

  const effectsByCategory = useMemo(() => {
    const map = new Map<CategoryId, VFXEffect[]>();
    map.set('ai-effects', AI_EFFECTS);
    map.set('motion-controls', MOTION_CONTROLS);
    map.set('vfx', VFX_EFFECTS);
    return map;
  }, []);

  const filteredEffects = useMemo(() => {
    const list = effectsByCategory.get(activeCategory) || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((e) => e.name.toLowerCase().includes(q));
  }, [activeCategory, effectsByCategory, search]);

  // Persist UI settings
  useEffect(() => {
    saveUIState({
      activeCategory,
      selectedEffectId,
      imageUrl,
      prompt,
      aspectRatio,
      resolution,
      duration,
      quality,
    });
  }, [activeCategory, selectedEffectId, imageUrl, prompt, aspectRatio, resolution, duration, quality]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl('');
      setShowUrlInput(false);
      const url = await uploadImage(file);
      if (url) {
        setImageUrl(url);
      }
    },
    [uploadImage]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) await handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handlePasteUrl = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value.trim();
      setImageUrl(url);
      if (url) {
        setImageFile(null);
        setImagePreview(null);
        const uploaded = await uploadImage(url);
        if (uploaded) setImageUrl(uploaded);
      }
    },
    [uploadImage]
  );

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    setShowUrlInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedEffect) {
      setError('Select an effect first');
      return;
    }
    if (!imageUrl) {
      setError('Upload an image or paste an image URL first');
      return;
    }

    await generateVideo({
      image_url: imageUrl,
      effect: selectedEffect.name,
      prompt: prompt ? `${selectedEffect.prompt}. ${prompt}` : selectedEffect.prompt,
      aspect_ratio: aspectRatio,
      resolution,
      duration,
      quality,
    });
  }, [selectedEffect, imageUrl, prompt, aspectRatio, resolution, duration, quality, generateVideo, setError]);

  const handleDownload = useCallback(async () => {
    if (!videoUrl) return;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vfx-${selectedEffect?.name || 'video'}.mp4`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(videoUrl, '_blank');
    }
  }, [videoUrl, selectedEffect]);

  const handleCopyUrl = useCallback(() => {
    if (!videoUrl) return;
    navigator.clipboard.writeText(videoUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [videoUrl]);

  const handleRegenerate = useCallback(() => {
    retryVideo();
  }, [retryVideo]);

  const handleReset = useCallback(() => {
    reset();
    clearImage();
    setSelectedEffectId(null);
    setPrompt('');
  }, [reset, clearImage]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'uploading':
        return 'Uploading image...';
      case 'queued':
        return 'Queued for generation';
      case 'processing':
        return `Processing video... ${progress}%`;
      case 'completed':
        return 'Generation complete';
      case 'failed':
        return 'Generation failed';
      case 'cancelled':
        return 'Generation cancelled';
      default:
        return '';
    }
  }, [status, progress]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>VFX Studio</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI effects, motion controls, and VFX</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
        {/* Sidebar categories */}
        <div className="w-full sm:w-16 border-b sm:border-b-0 sm:border-r flex flex-row sm:flex-col items-center py-2 sm:py-4 gap-2 sm:gap-3 overflow-x-auto" style={{ borderColor: 'var(--border-color)' }}>
          <div className="px-2 space-y-0 sm:space-y-2 w-full flex sm:flex-col">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className={`flex-1 sm:flex-none flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-colors ${
                  activeCategory === item.id ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                style={{ color: activeCategory === item.id ? 'var(--selected-text)' : 'var(--text-muted)' }}
              >
                <span>{item.icon}</span>
                <span className="leading-tight hidden sm:inline">{item.label}</span>
                <span className="leading-tight sm:hidden">{item.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative flex-1 min-w-[180px]">
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
              onClick={() => setShowUrlInput((p) => !p)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <LinkIcon size={14} />
              <span className="hidden sm:inline">URL</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <Upload size={14} />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>

          {showUrlInput && (
            <div className="px-4 sm:px-6 py-3 border-b flex gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <input
                value={imageUrl}
                onChange={handlePasteUrl}
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

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div
              className={`grid gap-3 sm:gap-4 ${
                activeCategory === 'motion-controls'
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}
            >
              {filteredEffects.map((effect) => {
                const isSelected = selectedEffectId === effect.id;
                return (
                  <button
                    key={effect.id}
                    onClick={() => setSelectedEffectId(effect.id)}
                    className={`flex flex-col rounded-xl border transition-colors ${
                      isSelected ? 'border-[var(--selected-border)] ring-1 ring-[var(--selected-border)]' : 'border-[var(--border-color)]'
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
                    <div className="p-2 sm:p-3">
                      <p className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
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

      {/* Drop target / preview */}
      <div
        className={`border-t px-4 sm:px-6 py-4 transition-colors ${isDragging ? 'bg-[#22d3ee]/10' : ''}`}
        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-panel)' }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Prompt */}
        <div className="mb-3">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Prompt (optional)</label>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add extra direction to the effect..."
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4">
          {selectedEffect && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
              {selectedEffect.preview && (
                <img src={selectedEffect.preview} alt={selectedEffect.name} className="w-8 h-8 rounded-lg object-cover" />
              )}
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedEffect.name}</span>
              <button type="button" onClick={() => setSelectedEffectId(null)} className="p-1 rounded-full hover:bg-white/10">
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          )}

          {imagePreview && (
            <div className="flex items-center gap-2">
              <img src={imagePreview} alt="Uploaded" className="w-10 h-10 rounded-lg object-cover border" style={{ borderColor: 'var(--border-color)' }} />
              <span className="text-xs truncate max-w-[180px] sm:max-w-[220px]" style={{ color: 'var(--text-secondary)' }}>
                {imageFile ? imageFile.name : 'Image URL'}
              </span>
              <button type="button" onClick={clearImage} className="p-1 rounded-full hover:bg-white/10">
                <X size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setAspectRatio(r.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${aspectRatio === r.value ? 'border' : ''}`}
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
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${resolution === r.value ? 'border' : ''}`}
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
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${duration === d ? 'border' : ''}`}
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
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${quality === q.value ? 'border' : ''}`}
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

          <div className="flex items-center gap-3">
            {loading ? (
              <button
                type="button"
                onClick={cancelVideo}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                <X size={16} />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedEffect || !imageUrl}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--selected-bg)', color: 'var(--selected-text)' }}
              >
                <Play size={16} />
                Generate
              </button>
            )}
          </div>
        </div>

        {/* Status & progress */}
        {(statusLabel || error || loading) && (
          <div className="mt-3 flex flex-col gap-2">
            {statusLabel && (
              <div className="flex items-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{statusLabel}</p>
              </div>
            )}
            {loading && (
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'var(--selected-bg)' }}
                />
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Video result */}
        {videoUrl && (
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-start gap-4 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
            <video src={videoUrl} controls className="w-full sm:w-auto max-w-full max-h-[220px] rounded-lg" style={{ background: '#000' }} />
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--selected-bg)', color: 'var(--selected-text)' }}
              >
                <Download size={14} />
                Download
              </button>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy URL'}
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                <RotateCcw size={14} />
                Regenerate
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}
              >
                <Sparkles size={14} />
                New Video
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
