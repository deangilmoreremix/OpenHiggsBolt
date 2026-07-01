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
  AlertCircle,
  Check,
  Loader2,
  Plus,
} from 'lucide-react';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import BottomInputBar from '@/apps/vfx-studio/components/BottomInputBar';
import type { VFXEffect, AspectRatio, Resolution, Quality } from '@/types/vfx';

const STORAGE_KEY_UI = 'vfx_ui_state';

const CDN = 'https://d3adwkbyhxyrtq.cloudfront.net';

const AI_EFFECTS: VFXEffect[] = [
  { id: 'kiss-me-ai', name: 'Kiss Me AI', preview: `${CDN}/webassets/ai_effects/Kiss_Me_AI.webp`, prompt: 'romantic kiss me ai cinematic effect', emoji: '💋', category: 'ai-effects' },
  { id: 'kiss', name: 'Kiss', preview: `${CDN}/webassets/ai_effects/Kiss.webp`, prompt: 'romantic kiss cinematic effect close up', emoji: '😘', category: 'ai-effects' },
  { id: 'venom', name: 'Venom', preview: `${CDN}/webassets/ai_effects/Venom.webp`, prompt: 'venom black symbiote transformation engulfs subject', emoji: '🖤', category: 'ai-effects' },
  { id: 'hulk', name: 'Hulk', preview: `${CDN}/webassets/ai_effects/Hulk_.webp`, prompt: 'hulk green muscle transformation rage', emoji: '💚', category: 'ai-effects' },
  { id: 'muscle-surge', name: 'Muscle Surge', preview: `${CDN}/webassets/ai_effects/Muscle_Surge.webp`, prompt: 'extreme muscle growth power surge transformation', emoji: '💪', category: 'ai-effects' },
  { id: 'the-tiger-touch', name: 'The Tiger Touch', preview: `${CDN}/webassets/ai_effects/The_Tiger_Touch.webp`, prompt: 'majestic tiger appears and gently touches subject', emoji: '🐯', category: 'ai-effects' },
  { id: 'anything-robot', name: 'Anything Robot', preview: `${CDN}/webassets/ai_effects/Anything_Robot.webp`, prompt: 'subject transforms into robot mechanical parts assembling', emoji: '🤖', category: 'ai-effects' },
  { id: 'warmth-of-jesus', name: 'Warmth of Jesus', preview: `${CDN}/webassets/ai_effects/Warmth_of_Jesus.webp`, prompt: 'divine holy light warmth spiritual glow effect', emoji: '✨', category: 'ai-effects' },
  { id: 'holy-wings', name: 'Holy Wings', preview: `${CDN}/webassets/ai_effects/Holy_Wings.webp`, prompt: 'angelic white wings appear spreading divine light', emoji: '🪽', category: 'ai-effects' },
  { id: 'microwave', name: 'Microwave', preview: `${CDN}/webassets/ai_effects/Microwave.webp`, prompt: 'microwave radiation heat distortion surreal effect', emoji: '📡', category: 'ai-effects' },
  { id: 'iron-man', name: 'Iron Man', preview: `${CDN}/webassets/ai_effects/Iron_Man.webp`, prompt: 'iron man suit assembles around subject piece by piece', emoji: '🦾', category: 'ai-effects' },
  { id: 'spiderman', name: 'Spiderman', preview: `${CDN}/webassets/ai_effects/Spiderman.webp`, prompt: 'spiderman web shoots out transformation cinematic', emoji: '🕷️', category: 'ai-effects' },
  { id: 'dragon-ball', name: 'Dragon Ball', preview: `${CDN}/webassets/ai_effects/Dragon_Ball.webp`, prompt: 'dragon ball super saiyan golden power up aura explosion', emoji: '⚡', category: 'ai-effects' },
  { id: 'freeze', name: 'Freeze', preview: `${CDN}/webassets/ai_effects/Freeze.webp`, prompt: 'ice freeze spreads across everything crystalline frozen', emoji: '❄️', category: 'ai-effects' },
  { id: 'invisibility', name: 'Invisibility', preview: `${CDN}/webassets/ai_effects/Invisibility.webp`, prompt: 'subject turns invisible predator cloaking effect', emoji: '👻', category: 'ai-effects' },
  { id: 'zombie', name: 'Zombie', preview: `${CDN}/webassets/ai_effects/Zombie.webp`, prompt: 'zombie transformation decaying undead horror effect', emoji: '🧟', category: 'ai-effects' },
  { id: 'mermaid', name: 'Mermaid', preview: `${CDN}/webassets/ai_effects/Mermaid.webp`, prompt: 'mermaid transformation scales tail ocean fantasy', emoji: '🧜', category: 'ai-effects' },
  { id: 'werewolf', name: 'Werewolf', preview: `${CDN}/webassets/ai_effects/Werewolf.webp`, prompt: 'werewolf transformation fur claws howl full moon', emoji: '🐺', category: 'ai-effects' },
  { id: 'vampire', name: 'Vampire', preview: `${CDN}/webassets/ai_effects/Vampire.webp`, prompt: 'vampire transformation pale fangs dark gothic', emoji: '🧛', category: 'ai-effects' },
  { id: 'witch', name: 'Witch', preview: `${CDN}/webassets/ai_effects/Witch.webp`, prompt: 'witch transformation magic spell casting dark fantasy', emoji: '🧙', category: 'ai-effects' },
  { id: 'angel', name: 'Angel', preview: `${CDN}/webassets/ai_effects/Angel.webp`, prompt: 'angel transformation golden wings divine light halo', emoji: '😇', category: 'ai-effects' },
  { id: 'demon', name: 'Demon', preview: `${CDN}/webassets/ai_effects/Demon.webp`, prompt: 'demon transformation dark wings fire eyes horror', emoji: '😈', category: 'ai-effects' },
  { id: 'phoenix', name: 'Phoenix', preview: `${CDN}/webassets/ai_effects/Phoenix.webp`, prompt: 'phoenix fire transformation rises from ashes flames', emoji: '🔥', category: 'ai-effects' },
  { id: 'crystal', name: 'Crystal', preview: `${CDN}/webassets/ai_effects/Crystal.webp`, prompt: 'subject crystallizes into sparkling gemstone crystal', emoji: '💎', category: 'ai-effects' },
  { id: 'gold-transform', name: 'Gold Transform', preview: `${CDN}/webassets/ai_effects/Gold_Transform.webp`, prompt: 'everything turns to solid gold midas touch effect', emoji: '🥇', category: 'ai-effects' },
  { id: 'age-regression', name: 'Age Regression', preview: `${CDN}/webassets/ai_effects/Age_Regression.webp`, prompt: 'subject grows younger reverse aging effect', emoji: '👶', category: 'ai-effects' },
  { id: 'age-progression', name: 'Age Progression', preview: `${CDN}/webassets/ai_effects/Age_Progression.webp`, prompt: 'rapid aging transformation grows old time lapse', emoji: '👴', category: 'ai-effects' },
  { id: 'gender-swap', name: 'Gender Swap', preview: `${CDN}/webassets/ai_effects/Gender_Swap.webp`, prompt: 'gender transformation face morphing AI effect', emoji: '🔄', category: 'ai-effects' },
];

const MOTION_CONTROLS: VFXEffect[] = [
  { id: '360-orbit', name: '360 Orbit', preview: `${CDN}/motioncontrols/360+Orbit.webp`, prompt: '360 degree orbit camera circles subject completely', emoji: '🔄', category: 'motion-controls' },
  { id: 'hero-run', name: 'Hero Run', preview: `${CDN}/motioncontrols/Action+Run.webp`, prompt: 'hero sprints toward camera slow motion action shot', emoji: '🏃', category: 'motion-controls' },
  { id: 'arc-shot', name: 'Arc Shot', preview: `${CDN}/motioncontrols/Arc.webp`, prompt: 'arc camera moves in smooth curve around subject', emoji: '🌀', category: 'motion-controls' },
  { id: 'matrix-shot', name: 'Matrix Shot', preview: `${CDN}/motioncontrols/Bullet+Time.webp`, prompt: 'bullet time matrix freeze 360 rotation', emoji: '💊', category: 'motion-controls' },
  { id: 'car-chase', name: 'Car Chase', preview: `${CDN}/motioncontrols/Car+Chasing.webp`, prompt: 'high speed car chase pursuit dynamic camera', emoji: '🚗', category: 'motion-controls' },
  { id: 'crane-down', name: 'Crane Down', preview: `${CDN}/motioncontrols/Crane+Down.webp`, prompt: 'crane down camera descends from above', emoji: '⬇️', category: 'motion-controls' },
  { id: 'crane-up', name: 'Crane Up', preview: `${CDN}/motioncontrols/Crane+Up.webp`, prompt: 'crane up camera rises revealing scene below', emoji: '⬆️', category: 'motion-controls' },
  { id: 'crash-zoom-in', name: 'Crash Zoom In', preview: `${CDN}/motioncontrols/Crash+Zoom+In.webp`, prompt: 'rapid crash zoom punch into subject', emoji: '🔍', category: 'motion-controls' },
  { id: 'crash-zoom-out', name: 'Crash Zoom Out', preview: `${CDN}/motioncontrols/Crash+Zoom+Out.webp`, prompt: 'rapid crash zoom out pull back reveal wide scene', emoji: '🔎', category: 'motion-controls' },
  { id: 'dolly-in', name: 'Dolly In', preview: `${CDN}/motioncontrols/Dolly+In.webp`, prompt: 'smooth dolly push toward subject cinematic rack focus', emoji: '📹', category: 'motion-controls' },
  { id: 'dolly-out', name: 'Dolly Out', preview: `${CDN}/motioncontrols/Dolly+Out.webp`, prompt: 'smooth dolly pull back from subject reveal environment', emoji: '🎥', category: 'motion-controls' },
  { id: 'drone-flight', name: 'Drone Flight', preview: `${CDN}/motioncontrols/Drone+Flight.webp`, prompt: 'drone aerial flight swooping forward overhead view', emoji: '🚁', category: 'motion-controls' },
  { id: 'dutch-angle', name: 'Dutch Angle', preview: `${CDN}/motioncontrols/Dutch+Angle.webp`, prompt: 'dutch angle tilted camera roll disorienting cinematic', emoji: '📐', category: 'motion-controls' },
  { id: 'fpv-dive', name: 'FPV Dive', preview: `${CDN}/motioncontrols/FPV+Dive.webp`, prompt: 'FPV drone dive first person racing spin', emoji: '🎯', category: 'motion-controls' },
  { id: 'handheld', name: 'Handheld', preview: `${CDN}/motioncontrols/Handheld.webp`, prompt: 'handheld documentary style camera natural shake', emoji: '✋', category: 'motion-controls' },
  { id: 'jib-arm', name: 'Jib Arm', preview: `${CDN}/motioncontrols/Jib+Arm.webp`, prompt: 'jib arm swing camera sweeps up and over subject', emoji: '🏗️', category: 'motion-controls' },
  { id: 'ken-burns', name: 'Ken Burns', preview: `${CDN}/motioncontrols/Ken+Burns.webp`, prompt: 'ken burns effect slow pan and zoom documentary', emoji: '📸', category: 'motion-controls' },
  { id: 'low-angle', name: 'Low Angle', preview: `${CDN}/motioncontrols/Low+Angle.webp`, prompt: 'low angle worm eye view looking up powerful dramatic', emoji: '🐛', category: 'motion-controls' },
  { id: 'overhead-crane', name: 'Overhead Crane', preview: `${CDN}/motioncontrols/Overhead+Crane.webp`, prompt: 'overhead crane bird eye view directly above looking down', emoji: '🦅', category: 'motion-controls' },
  { id: 'pan-left', name: 'Pan Left', preview: `${CDN}/motioncontrols/Pan+Left.webp`, prompt: 'camera pans smoothly to the left following action', emoji: '⬅️', category: 'motion-controls' },
  { id: 'pan-right', name: 'Pan Right', preview: `${CDN}/motioncontrols/Pan+Right.webp`, prompt: 'camera pans smoothly to the right revealing scene', emoji: '➡️', category: 'motion-controls' },
  { id: 'parallax', name: 'Parallax', preview: `${CDN}/motioncontrols/Parallax.webp`, prompt: 'parallax depth effect foreground and background separate', emoji: '🌊', category: 'motion-controls' },
  { id: 'pedestal-down', name: 'Pedestal Down', preview: `${CDN}/motioncontrols/Pedestal+Down.webp`, prompt: 'pedestal camera drops straight down vertically', emoji: '⬇️', category: 'motion-controls' },
  { id: 'pedestal-up', name: 'Pedestal Up', preview: `${CDN}/motioncontrols/Pedestal+Up.webp`, prompt: 'pedestal camera rises straight up vertically revealing', emoji: '⬆️', category: 'motion-controls' },
  { id: 'pull-focus', name: 'Pull Focus', preview: `${CDN}/motioncontrols/Pull+Focus.webp`, prompt: 'pull focus rack focus shift between foreground background', emoji: '🎯', category: 'motion-controls' },
  { id: 'push-in', name: 'Push In', preview: `${CDN}/motioncontrols/Push+In.webp`, prompt: 'camera pushes in forward motion toward subject intense', emoji: '➡️', category: 'motion-controls' },
  { id: 'roll', name: 'Roll', preview: `${CDN}/motioncontrols/Roll.webp`, prompt: 'camera barrel roll rotation spinning around axis', emoji: '🌀', category: 'motion-controls' },
  { id: 'shake', name: 'Shake', preview: `${CDN}/motioncontrols/Shake.webp`, prompt: 'camera shake earthquake impact tremor effect intense', emoji: '📳', category: 'motion-controls' },
  { id: 'tilt-down', name: 'Tilt Down', preview: `${CDN}/motioncontrols/Tilt+Down.webp`, prompt: 'camera tilts down from high to low reveal feet ground', emoji: '⬇️', category: 'motion-controls' },
  { id: 'tilt-up', name: 'Tilt Up', preview: `${CDN}/motioncontrols/Tilt+Up.webp`, prompt: 'camera tilts up revealing tall subject sky epic', emoji: '⬆️', category: 'motion-controls' },
  { id: 'tracking-shot', name: 'Tracking Shot', preview: `${CDN}/motioncontrols/Tracking+Shot.webp`, prompt: 'tracking shot camera follows alongside moving subject', emoji: '📍', category: 'motion-controls' },
  { id: 'truck-left', name: 'Truck Left', preview: `${CDN}/motioncontrols/Truck+Left.webp`, prompt: 'truck left camera moves laterally to the left', emoji: '⬅️', category: 'motion-controls' },
  { id: 'truck-right', name: 'Truck Right', preview: `${CDN}/motioncontrols/Truck+Right.webp`, prompt: 'truck right camera moves laterally to the right', emoji: '➡️', category: 'motion-controls' },
  { id: 'vertigo-effect', name: 'Vertigo Effect', preview: `${CDN}/motioncontrols/Vertigo.webp`, prompt: 'hitchcock vertigo dolly zoom background stretches dizzy', emoji: '😵', category: 'motion-controls' },
  { id: 'whip-pan', name: 'Whip Pan', preview: `${CDN}/motioncontrols/Whip+Pan.webp`, prompt: 'fast whip pan blur transition between scenes rapid', emoji: '💨', category: 'motion-controls' },
  { id: 'zoom-in', name: 'Zoom In', preview: `${CDN}/motioncontrols/Zoom+In.webp`, prompt: 'slow dramatic zoom in toward subject cinematic', emoji: '🔍', category: 'motion-controls' },
  { id: 'zoom-out', name: 'Zoom Out', preview: `${CDN}/motioncontrols/Zoom+Out.webp`, prompt: 'slow dramatic zoom out reveal wide landscape epic', emoji: '🔎', category: 'motion-controls' },
];

const VFX_EFFECTS: VFXEffect[] = [
  { id: 'levitate', name: 'Levitate', preview: `${CDN}/motioncontrols/Levitation.webp`, prompt: 'subject levitates floats upward defying gravity telekinesis', emoji: '🌟', category: 'vfx' },
  { id: 'disintegration', name: 'Disintegration', preview: `${CDN}/motioncontrols/Disintegration.webp`, prompt: 'subject disintegrates into dust particles thanos snap ash', emoji: '💨', category: 'vfx' },
  { id: 'flying', name: 'Flying', preview: `${CDN}/motioncontrols/Flying.webp`, prompt: 'subject lifts off and flies through sky superhero', emoji: '🦅', category: 'vfx' },
  { id: 'car-explosion', name: 'Car Explosion', preview: `${CDN}/motioncontrols/Car+Explosion.webp`, prompt: 'car explodes massive fireball action movie shockwave', emoji: '🚘', category: 'vfx' },
  { id: 'tornado', name: 'Tornado', preview: `${CDN}/motioncontrols/Tornado.webp`, prompt: 'massive tornado forms approaches swirling destruction debris', emoji: '🌪️', category: 'vfx' },
  { id: 'electricity', name: 'Electricity', preview: `${CDN}/motioncontrols/Electricity.webp`, prompt: 'electric lightning bolts surge around subject plasma arcs', emoji: '⚡', category: 'vfx' },
  { id: 'huge-explosion', name: 'Huge Explosion', preview: `${CDN}/motioncontrols/Huge+Explosion.webp`, prompt: 'massive nuclear explosion mushroom cloud shockwave destruction', emoji: '💥', category: 'vfx' },
  { id: 'decay-time-lapse', name: 'Decay Time-Lapse', preview: `${CDN}/motioncontrols/Decay+Time-Lapse.webp`, prompt: 'rapid decay time lapse organic decomposition nature', emoji: '🍂', category: 'vfx' },
  { id: 'building-explosion', name: 'Building Explosion', preview: `${CDN}/motioncontrols/Building+Explosion.webp`, prompt: 'massive building explosion debris shockwave fireball destruction', emoji: '🏢', category: 'vfx' },
  { id: 'tsunami', name: 'Tsunami', preview: `${CDN}/motioncontrols/Tsunami.webp`, prompt: 'giant tsunami wave crashes through scene flooding destruction', emoji: '🌊', category: 'vfx' },
  { id: 'fire', name: 'Fire Effect', preview: `${CDN}/motioncontrols/Fire.webp`, prompt: 'dramatic fire engulfs everything cinematic flame inferno', emoji: '🔥', category: 'vfx' },
  { id: 'meteor-strike', name: 'Meteor Strike', preview: `${CDN}/motioncontrols/Meteor+Strike.webp`, prompt: 'meteor strikes ground massive impact explosion crater', emoji: '☄️', category: 'vfx' },
  { id: 'black-hole', name: 'Black Hole', preview: `${CDN}/motioncontrols/Black+Hole.webp`, prompt: 'black hole forms pulls everything in gravitational lensing', emoji: '🌑', category: 'vfx' },
  { id: 'portal-open', name: 'Portal Open', preview: `${CDN}/motioncontrols/Portal+Open.webp`, prompt: 'interdimensional portal opens swirling vortex glowing energy', emoji: '🌀', category: 'vfx' },
  { id: 'time-freeze', name: 'Time Freeze', preview: `${CDN}/motioncontrols/Time+Freeze.webp`, prompt: 'time freezes everything stops mid action suspended', emoji: '⏱️', category: 'vfx' },
  { id: 'gravity-flip', name: 'Gravity Flip', preview: `${CDN}/motioncontrols/Gravity+Flip.webp`, prompt: 'gravity reverses everything floats rises upward surreal', emoji: '🔄', category: 'vfx' },
  { id: 'glass-shatter', name: 'Glass Shatter', preview: `${CDN}/motioncontrols/Glass+Shatter.webp`, prompt: 'world shatters like breaking glass into pieces', emoji: '💎', category: 'vfx' },
  { id: 'laser-beam', name: 'Laser Beam', preview: `${CDN}/motioncontrols/Laser+Beam.webp`, prompt: 'powerful laser beam shoots through destroying everything', emoji: '🔴', category: 'vfx' },
  { id: 'smoke-bomb', name: 'Smoke Bomb', preview: `${CDN}/motioncontrols/Smoke+Bomb.webp`, prompt: 'colorful smoke bomb explosion billows fills entire frame', emoji: '💜', category: 'vfx' },
  { id: 'snow-storm', name: 'Snow Storm', preview: `${CDN}/motioncontrols/Snow+Storm.webp`, prompt: 'blizzard snow storm sweeps through freezing everything', emoji: '❄️', category: 'vfx' },
  { id: 'rain-storm', name: 'Rain Storm', preview: `${CDN}/motioncontrols/Rain+Storm.webp`, prompt: 'heavy rain storm pours down dramatic lightning thunder', emoji: '⛈️', category: 'vfx' },
  { id: 'earthquake', name: 'Earthquake', preview: `${CDN}/motioncontrols/Earthquake.webp`, prompt: 'massive earthquake ground splits cracks destroy everything', emoji: '🌍', category: 'vfx' },
  { id: 'volcanic-eruption', name: 'Volcanic Eruption', preview: `${CDN}/motioncontrols/Volcanic+Eruption.webp`, prompt: 'volcano erupts lava flows ash cloud massive destruction', emoji: '🌋', category: 'vfx' },
  { id: 'nuclear-blast', name: 'Nuclear Blast', preview: `${CDN}/motioncontrols/Nuclear+Blast.webp`, prompt: 'nuclear explosion shockwave obliterates everything white flash', emoji: '☢️', category: 'vfx' },
  { id: 'acid-rain', name: 'Acid Rain', preview: `${CDN}/motioncontrols/Acid+Rain.webp`, prompt: 'toxic acid rain melts dissolves everything it touches', emoji: '🧪', category: 'vfx' },
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
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showInputBar, setShowInputBar] = useState(true);
  const [showChatButton, setShowChatButton] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [showGenerationModal, setShowGenerationModal] = useState(false);

  // Ensure the prompt input bar is visible when the VFX studio tab mounts
  useEffect(() => {
    setShowInputBar(true);
    setShowChatButton(false);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    progress,
    videoUrl,
    error: hookError,
    loading,
    requestId,
    uploadImage,
    generateVideo,
    cancelVideo,
    retryVideo,
    reset,
    setError,
  } = useVideoGeneration(userApiKey || undefined);

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

  // Show generation modal when generating
  useEffect(() => {
    if ((status === 'queued' || status === 'processing') && !showGenerationModal) {
      setShowGenerationModal(true);
    }
    if (status === 'idle' && showGenerationModal) {
      setShowGenerationModal(false);
    }
  }, [status, showGenerationModal]);

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
    setShowGenerationModal(false);
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

  const errorMessage = hookError ?? '';

  return (
    <div className="flex flex-col h-full">
      {/* Generation Modal (upstream feature parity) */}
      {showGenerationModal && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.55)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#232b39',
              padding: 32,
              borderRadius: 16,
              minWidth: 340,
              minHeight: 220,
              boxShadow: '0 4px 32px 0 #0008',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <button
              onClick={() => {
                setShowGenerationModal(false);
                reset();
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 22,
                cursor: 'pointer',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              title="Close"
              aria-label="Close"
              onMouseOver={(e) => e.currentTarget.style.background = '#2d2d2d'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              ×
            </button>
            {(status === 'queued' || status === 'processing') && (
              <>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
                  ⏳ Generating your video...
                </div>
                <div style={{ width: 320, maxWidth: '90vw', height: 8, background: '#18181b', borderRadius: 8, margin: '0 auto', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                {requestId && (
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                    Request ID: {requestId}
                  </div>
                )}
              </>
            )}
            {status === 'completed' && videoUrl && (
              <>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
                  🎉 Your video is ready!
                </div>
                <video src={videoUrl} controls style={{ maxWidth: 400, maxHeight: 300, borderRadius: 10, marginBottom: 12, background: '#000' }} />
                <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={handleDownload}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setShowGenerationModal(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      background: '#232b39',
                      color: '#fff',
                      border: '1px solid #444',
                      fontWeight: 500,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
            {status === 'failed' && errorMessage && (
              <div style={{ color: '#f87171', marginTop: 12, textAlign: 'center', maxWidth: 400 }}>
                <b>Error:</b> {errorMessage}
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => {
                      setShowGenerationModal(false);
                      reset();
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      background: '#232b39',
                      color: '#fff',
                      border: '1px solid #444',
                      fontWeight: 500,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
               onClick={() => fileInputRef.current?.click()}
               className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
             >
               <Upload size={14} />
               <span className="hidden sm:inline">Upload</span>
             </button>
          </div>

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
                         <img
                           src={effect.preview}
                           alt={effect.name}
                           className="w-full h-full object-cover"
                           loading="lazy"
                           onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                         />
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

      {/* Bottom Input Bar */}
      <BottomInputBar
        showInputBar={showInputBar}
        setShowInputBar={setShowInputBar}
        showChatButton={showChatButton}
        setShowChatButton={setShowChatButton}
        uploadedFile={imageFile}
        setUploadedFile={setImageFile}
        previewUrl={imagePreview}
        setPreviewUrl={setImagePreview}
        inputText={prompt}
        setInputText={setPrompt}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        selectedAspect={aspectRatio}
        setSelectedAspect={setAspectRatio}
        selectedDuration={duration}
        setSelectedDuration={setDuration}
        selectedResolution={resolution}
        setSelectedResolution={setResolution}
        selectedQuality={quality}
        setSelectedQuality={setQuality}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        handleDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        handleDragLeave={() => setIsDragging(false)}
        handleDrop={handleDrop}
        handleGenerate={handleGenerate}
        handleCancel={cancelVideo}
        handleReset={handleReset}
        selectedEffect={selectedEffect ? { id: selectedEffect.id, name: selectedEffect.name, preview: selectedEffect.preview } : null}
        setSelectedEffect={(effect) => setSelectedEffectId(effect?.id || null)}
        loading={loading}
        status={status}
        progress={progress}
        error={errorMessage}
        videoUrl={videoUrl}
        userApiKey={userApiKey}
        setUserApiKey={setUserApiKey}
      />

      {/* Video result inline (local repo feature) */}
      {videoUrl && status === 'completed' && (
        <div className="mx-4 sm:mx-6 mb-4 flex flex-col sm:flex-row flex-wrap items-start gap-4 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }} id="video-generation-status">
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

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
