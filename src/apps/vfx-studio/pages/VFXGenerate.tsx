'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Image as ImageIcon, Sparkles } from 'lucide-react';

// VFX Studio - Main generation page
export default function VFXGenerate() {
  const [activeFilter, setActiveFilter] = useState('AI Effects');
  const [showInputBar, setShowInputBar] = useState(true);
  const [showChatButton, setShowChatButton] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [selectedResolution, setSelectedResolution] = useState("480p");
  const [selectedQuality, setSelectedQuality] = useState("medium");
  const [imageUrl, setImageUrl] = useState("");
  const [inputText, setInputText] = useState("");
  const [selectedAspect, setSelectedAspect] = useState("9:16");
  const [selectedDuration, setSelectedDuration] = useState("5s");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Video generation state
  const [status, setStatus] = useState('idle');
  const [requestId, setRequestId] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [log, setLog] = useState([]);
  const isMountedRef = useRef(true);
  const pollTimeoutRef = useRef(null);

  const aiEffectsRef = useRef(null);
  const motionControlsRef = useRef(null);
  const vfxControlsRef = useRef(null);

  const filters = [
    { name: "AI Effects", icon: "⭐" },
    { name: "Motion Controls", icon: "🎬" },
    { name: "VFX", icon: "⚡" }
  ];

  // Scroll to section when filter is selected
  useEffect(() => {
    if (activeFilter === 'AI Effects' && aiEffectsRef.current) {
      aiEffectsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeFilter === 'Motion Controls' && motionControlsRef.current) {
      motionControlsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeFilter === 'VFX' && vfxControlsRef.current) {
      vfxControlsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeFilter]);

  // Log helper
  const addLog = useCallback((message) => {
    if (isMountedRef.current) {
      setLog(prevLog => [...prevLog, message]);
    }
  }, []);

  // Poll for result
  const pollForResult = useCallback(async (reqId, userApiKey) => {
    const pollUrl = `/api/proxy-muapi?id=${reqId}`;
    const start = Date.now();
    let tries = 0;
    const MAX_POLL_ATTEMPTS = 180;

    const poll = async () => {
      if (!isMountedRef.current) return;
      tries++;
      addLog(`Polling attempt #${tries}...`);
      try {
        const res = await fetch(pollUrl, { headers: { 'x-api-key': userApiKey } });
        if (!res.ok) throw new Error(`Poll error: ${res.status}`);
        const data = await res.json();
        if (!data.status) throw new Error('Invalid response: missing status');
        const taskStatus = data.status;

        if (taskStatus === 'completed') {
          let videoUrl = data.video?.url;
          if (!videoUrl && data.output && typeof data.output === 'string') {
            videoUrl = data.output;
          }
          if (videoUrl) {
            if (isMountedRef.current) {
              setStatus('completed');
              setVideoUrl(videoUrl);
              addLog(`Task completed in ${((Date.now()-start)/1000).toFixed(1)}s`);
            }
            return;
          } else {
            setStatus('failed');
            setError('Video generation failed: No video URL received');
            return;
          }
        } else if (taskStatus === 'failed') {
          if (isMountedRef.current) {
            setStatus('failed');
            setError(data.error || 'Task failed');
            addLog(`Task failed: ${data.error}`);
          }
          return;
        } else {
          addLog(`Status: ${taskStatus}`);
        }

        if (tries < MAX_POLL_ATTEMPTS && isMountedRef.current) {
          pollTimeoutRef.current = setTimeout(poll, 1000);
        } else if (tries >= MAX_POLL_ATTEMPTS) {
          setStatus('timeout');
          setError('Polling timeout: Maximum attempts reached');
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message);
          setStatus('error');
          addLog(`Polling error: ${err.message}`);
        }
      }
    };
    poll();
  }, [addLog]);

  // Start generation
  const startGenerationWithKey = useCallback(async (userApiKey) => {
    const getMuApiSize = (aspect) => {
      if (typeof aspect === 'string') aspect = aspect.trim();
      if (aspect === '16:9') return '832*480';
      if (aspect === '9:16') return '480*832';
      return '832*480';
    };

    let size = getMuApiSize(selectedAspect);
    if (size !== '832*480' && size !== '480*832') size = '832*480';

    const videoPayload = {
      prompt: inputText,
      name: selectedEffect?.name,
      aspect_ratio: selectedAspect,
      size,
      quality: selectedQuality,
      duration: parseInt(selectedDuration),
    };

    if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
      setError('Please provide a valid image URL');
      return;
    }
    videoPayload.image_url = imageUrl;

    if (!userApiKey.trim()) {
      setError('API key is required');
      return;
    }

    setStatus('submitting');
    setLog([`Submitting task to MuApi...`]);
    setError('');
    setVideoUrl('');
    setRequestId(null);

    try {
      addLog('Payload: ' + JSON.stringify(videoPayload, null, 2));
      const res = await fetch('/api/proxy-muapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': userApiKey,
        },
        body: JSON.stringify(videoPayload),
      });
      addLog('API response status: ' + res.status);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      addLog('API response: ' + JSON.stringify(data));
      if (!data.request_id) throw new Error('Invalid response: missing request_id');
      setRequestId(data.request_id);
      addLog(`Task submitted. Request ID: ${data.request_id}`);
      setStatus('polling');
      pollForResult(data.request_id, userApiKey);
    } catch (err) {
      setError(err.message);
      setStatus('error');
      addLog(`Error: ${err.message}`);
    }
  }, [addLog, inputText, selectedEffect, selectedAspect, selectedQuality, selectedDuration, imageUrl, pollForResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  // Show modal when generation starts
  useEffect(() => {
    if ((status === 'submitting' || status === 'polling') && !showVideoModal) {
      setShowVideoModal(true);
    }
    if (status === 'idle' && showVideoModal) {
      setShowVideoModal(false);
    }
  }, [status, showVideoModal]);

  // Handle generate button click
  const handleVideoGenerate = useCallback(() => {
    if (!selectedEffect) {
      alert('Please select an effect before generating');
      return;
    }
    if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
      alert('Please provide a valid image URL');
      return;
    }
    setShowApiKeyModal(true);
  }, [selectedEffect, imageUrl]);

  // Pixverse Effects
  const pixverseEffects = [
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss_Me_AI.webp', name: 'Kiss Me AI' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Kiss.webp', name: 'Kiss' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Venom.webp', name: 'Venom' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Hulk_.webp', name: 'Hulk' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Muscle_Surge.webp', name: 'Muscle Surge' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/The_Tiger_Touch.webp', name: 'The Tiger Touch' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Anything_Robot.webp', name: 'Anything, Robot' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Warmth_of_Jesus.webp', name: 'Warmth of Jesus' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Holy_Wings.webp', name: 'Holy Wings' },
    { effect: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/ai_effects/Microwave.webp', name: 'Microwave' },
  ];

  // Motion Controls
  const motionControls = [
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/360+Orbit.webp', name: '360 Orbit' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Action+Run.webp', name: 'Hero Run' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Arc.webp', name: 'Arc Shot' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Bullet+Time.webp', name: 'Matrix Shot' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Car+Chasing.webp', name: 'Car Chase' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Down.webp', name: 'Crane Down' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Over+The+Head.webp', name: 'Crane Overhead' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crane+Up.webp', name: 'Crane Up' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+In.webp', name: 'Crash Zoom In' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Crash+Zoom+Out.webp', name: 'Crash Zoom Out' },
  ];

  // VFX Controls
  const vfxControls = [
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Levitation.webp', name: 'Levitate' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Disintegration.webp', name: 'Disintegration' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Flying.webp', name: 'Flying' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Car+Explosion.webp', name: 'Car Explosion' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tornado.webp', name: 'Tornado' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Electricity.webp', name: 'Electricity' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Huge+Explosion.webp', name: 'Huge Explosion' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Decay+Time-Lapse.webp', name: 'Decay Time-Lapse' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Tsunami.webp', name: 'Tsunami' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Fire.webp', name: 'Fire' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Robotic+Face+Reveal.webp', name: 'Robotic Face Reveal' },
    { url: 'https://d3adwkbyhxyrtq.cloudfront.net/motioncontrols/Building+Explosion.webp', name: 'Building Explosion' },
  ];

  // Inline Dropdown component matching platform design
  const InlineDropdown = ({ value, onChange, options = [], placeholder = 'Select', style = {} }) => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const handleClick = (e) => {
        if (buttonRef.current && !buttonRef.current.contains(e.target) &&
            dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const selected = options.find(opt => opt.value === value);

    return (
      <div style={{ position: 'relative', minWidth: 120, ...style }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-xl px-4 py-2 text-sm font-medium shadow-sm outline-none cursor-pointer text-left transition-all hover:border-white/20"
        >
          {selected ? selected.label : <span className="text-white/40">{placeholder}</span>}
        </button>
        {open && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 bottom-full mb-1 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl z-50 py-1"
          >
            {options.map(opt => (
              <div
                key={opt.value}
                onClick={() => { setOpen(false); onChange({ target: { value: opt.value } }); }}
                className={`px-4 py-2 cursor-pointer transition-colors ${value === opt.value ? 'text-[#22d3ee] bg-[#22d3ee]/10' : 'text-white hover:bg-white/5'}`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-bg-app flex flex-col overflow-hidden relative">
      {/* Video Generation Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 min-w-[340px] shadow-2xl relative">
            <button
              onClick={() => {
                setShowVideoModal(false);
                setStatus('idle');
                setError('');
                setLog([]);
                setVideoUrl('');
                setRequestId(null);
                setInputText('');
                setImageUrl('');
                setSelectedEffect(null);
              }}
              className="absolute top-3 right-3 bg-none border-none text-white/40 text-2xl cursor-pointer rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              ×
            </button>

            {(status === 'submitting' || status === 'polling') && (
              <>
                <div className="text-white font-semibold text-lg mb-2 text-center flex items-center justify-center gap-2">
                  <Sparkles size={20} className="text-[#22d3ee]" />
                  Generating your video...
                </div>
                <div className="w-80 max-w-full h-2 bg-[#0a0a0a] rounded-lg overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-[#22d3ee] to-[#a855f7] animate-pulse" style={{width: '100%'}} />
                </div>
              </>
            )}

            {status === 'completed' && videoUrl && (
              <>
                <div className="text-white font-semibold text-lg mb-4 text-center">
                  🎉 Your video is ready!
                </div>
                <video src={videoUrl} controls className="max-w-[400px] max-h-[300px] rounded-xl mb-4 bg-black" />
                <div className="flex gap-4 justify-center">
                  <a href={videoUrl} download className="px-5 py-2.5 rounded-lg bg-[#22d3ee] text-black font-semibold text-sm hover:bg-[#22d3ee]/90 transition-all">
                    Download
                  </a>
                  <button
                    onClick={() => {
                      setShowVideoModal(false);
                      setStatus('idle');
                      setError('');
                      setLog([]);
                      setVideoUrl('');
                      setRequestId(null);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 text-sm font-medium transition-all border border-white/10"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {(status === 'error' || status === 'failed') && error && (
              <div className="text-red-400 mt-4 text-center">
                <b>Error:</b> {error}
              </div>
            )}

            {status === 'failed' && error.includes('retry') && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => { setError(''); setStatus('idle'); setLog([]); setShowApiKeyModal(true); }}
                  className="px-6 py-2.5 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-500/90 transition-all"
                >
                  Retry Generation
                </button>
              </div>
            )}

            {requestId && (
              <div className="mt-4 text-center text-white/40 text-xs">
                <b>Request ID:</b> {requestId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 min-w-[320px] shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Enter your MuApi API Key</h3>
            <p className="text-white/40 text-sm mb-6">
              Don&apos;t have an API key?&nbsp;
              <a href="https://muapi.ai/" target="_blank" rel="noopener noreferrer" className="text-[#22d3ee] underline">
                Get it from muapi.ai
              </a>
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="API Key"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#22d3ee] transition-colors"
              autoFocus
              disabled={status === 'submitting' || status === 'polling'}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowApiKeyModal(false); setApiKeyInput(''); }}
                className="flex-1 h-11 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 text-sm font-medium transition-all border border-white/5"
                disabled={status === 'submitting' || status === 'polling'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  startGenerationWithKey(apiKeyInput);
                }}
                className="flex-1 h-11 rounded-xl bg-[#22d3ee] text-black hover:bg-[#22d3ee]/90 text-sm font-semibold transition-all disabled:opacity-50"
                disabled={!apiKeyInput.trim() || status === 'submitting' || status === 'polling'}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-b border-white/[0.03]">
          <div className="w-8 h-8 bg-gradient-to-br from-[#22d3ee] to-[#a855f7] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-xl font-bold text-white">VFX Studio</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.03] overflow-x-auto scrollbar-none">
          {filters.map((filter, index) => (
            <button
              key={index}
              onClick={() => setActiveFilter(filter.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.name
                  ? 'bg-[#22d3ee]/10 border-[#22d3ee]/50 text-[#22d3ee]'
                  : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.name}</span>
            </button>
          ))}
        </div>

        {/* AI Effects Grid */}
        <div ref={aiEffectsRef} className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg">⭐</span>
            <h2 className="text-xl font-bold text-white">AI Effects</h2>
          </div>
          <div className="grid grid-cols-5 gap-4 max-w-[1200px]">
            {pixverseEffects.map((effect, index) => (
              <div
                key={index}
                onClick={() => setSelectedEffect(effect)}
                className={`cursor-pointer bg-[#0a0a0a] rounded-xl overflow-hidden border transition-all ${
                  selectedEffect && selectedEffect.name === effect.name
                    ? 'border-[#22d3ee] ring-2 ring-[#22d3ee]/20'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="aspect-[4/3] bg-[#0a0a0a] relative overflow-hidden">
                  <img src={effect.effect} alt={effect.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-10 h-10 bg-[#22d3ee] rounded-full flex items-center justify-center">
                      <Play size={20} color="black" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white text-center py-3 font-medium truncate px-2">
                  {effect.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Motion Controls Grid */}
        <div ref={motionControlsRef} className="p-6 border-t border-white/[0.03]">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg">🎬</span>
            <h2 className="text-xl font-bold text-white">Motion Controls</h2>
          </div>
          <div className="grid grid-cols-5 gap-4 max-w-[1200px]">
            {motionControls.map((control, index) => (
              <div
                key={index}
                onClick={() => setSelectedEffect(control)}
                className={`cursor-pointer bg-[#0a0a0a] rounded-xl overflow-hidden border transition-all ${
                  selectedEffect && selectedEffect.name === control.name
                    ? 'border-[#22d3ee] ring-2 ring-[#22d3ee]/20'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="aspect-[4/3] bg-[#0a0a0a] overflow-hidden">
                  <img src={control.url} alt={control.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-white text-center py-3 font-medium truncate px-2">
                  {control.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* VFX Controls Grid */}
        <div ref={vfxControlsRef} className="p-6 border-t border-white/[0.03]">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg">⚡</span>
            <h2 className="text-xl font-bold text-white">VFX Controls</h2>
          </div>
          <div className="grid grid-cols-5 gap-4 max-w-[1200px]">
            {vfxControls.map((vfx, index) => (
              <div
                key={index}
                onClick={() => setSelectedEffect(vfx)}
                className={`cursor-pointer bg-[#0a0a0a] rounded-xl overflow-hidden border transition-all ${
                  selectedEffect && selectedEffect.name === vfx.name
                    ? 'border-[#22d3ee] ring-2 ring-[#22d3ee]/20'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="aspect-[4/3] bg-[#0a0a0a] overflow-hidden">
                  <img src={vfx.url} alt={vfx.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-white text-center py-3 font-medium truncate px-2">
                  {vfx.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Input Bar */}
      {showInputBar && (
        <div
          className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[800px] max-w-[95vw] z-20 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all"
        >
          {/* Close Button */}
          <button
            onClick={() => { setShowInputBar(false); setShowChatButton(true); }}
            className="absolute top-2 right-4 bg-none border-none text-white/40 text-2xl cursor-pointer z-10 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="p-6 flex flex-col gap-4">
            {/* Image URL Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setImageUrlInput(""); setShowImageUrlModal(true); }}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2 rounded-full text-sm font-medium text-white transition-all"
              >
                <ImageIcon size={18} />
                <span>Image URL</span>
              </button>
              <div className="flex-1" />
            </div>

            {/* Input Row */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-0">
              <input
                type="text"
                placeholder="Enter your prompt here"
                className="flex-1 bg-transparent text-white/80 border-none outline-none text-base p-3 font-medium placeholder:text-white/30"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <button
                onClick={handleVideoGenerate}
                className="bg-gradient-to-r from-[#22d3ee] to-[#a855f7] border-none rounded-full p-2 ml-2 cursor-pointer flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              >
                <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24" style={{transform: 'rotate(90deg)'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* Dropdowns Row */}
            <div className="flex items-start gap-4 w-full">
              <div className="flex flex-col min-w-[120px]">
                <label className="text-white/40 text-xs font-medium mb-1 ml-1">Aspect Ratio</label>
                <InlineDropdown
                  value={selectedAspect}
                  onChange={e => setSelectedAspect(e.target.value)}
                  options={[
                    { value: '16:9', label: '16:9' },
                    { value: '9:16', label: '9:16' },
                    { value: '1:1', label: '1:1' },
                  ]}
                />
              </div>
              <div className="flex flex-col min-w-[120px]">
                <label className="text-white/40 text-xs font-medium mb-1 ml-1">Duration</label>
                <InlineDropdown
                  value={selectedDuration}
                  onChange={e => setSelectedDuration(e.target.value)}
                  options={[
                    { value: '5s', label: '5s' },
                    { value: '10s', label: '10s' },
                  ]}
                />
              </div>
              <div className="flex flex-col min-w-[120px]">
                <label className="text-white/40 text-xs font-medium mb-1 ml-1">Resolution</label>
                <InlineDropdown
                  value={selectedResolution}
                  onChange={e => setSelectedResolution(e.target.value)}
                  options={[
                    { value: '480p', label: '480p' },
                    { value: '720p', label: '720p' },
                  ]}
                />
              </div>
              <div className="flex flex-col min-w-[120px]">
                <label className="text-white/40 text-xs font-medium mb-1 ml-1">Quality</label>
                <InlineDropdown
                  value={selectedQuality}
                  onChange={e => setSelectedQuality(e.target.value)}
                  options={[
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                />
              </div>
              <div className="flex-1" />
            </div>

            {/* Selected Effect Badge */}
            {selectedEffect && (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2">
                {selectedEffect.effect || selectedEffect.url ? (
                  <img
                    src={selectedEffect.effect || selectedEffect.url}
                    alt={selectedEffect.name || 'Effect'}
                    className="w-9 h-9 rounded-lg object-cover border border-white/10"
                  />
                ) : null}
                <span className="text-white font-medium">{selectedEffect.name || 'Selected Effect'}</span>
                <button
                  onClick={() => setSelectedEffect(null)}
                  className="ml-auto bg-none border-none text-white/40 text-2xl cursor-pointer rounded-full w-7 h-7 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  ×
                </button>
              </div>
            )}

            {/* Image URL Preview */}
            {imageUrl && (
              <div className="mt-3 max-w-[180px] relative">
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute -top-2 -right-2 bg-[#0a0a0a] text-white border-none rounded-full w-6 h-6 flex items-center justify-center text-lg z-10 shadow-lg hover:bg-white/10"
                >
                  ×
                </button>
                <img
                  src={imageUrl}
                  alt="Image URL Preview"
                  className="max-w-[160px] max-h-[90px] rounded-lg border border-white/10 bg-[#0a0a0a]"
                  onError={e => { e.target.onerror = null; e.target.src = ''; }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Button */}
      {showChatButton && !showInputBar && (
        <button
          onClick={() => { setShowInputBar(true); setShowChatButton(false); }}
          className="fixed bottom-20 right-10 z-30 bg-gradient-to-r from-[#0a0a0a] to-[#22d3ee] text-white border-none rounded-full w-14 h-14 shadow-lg flex items-center justify-center cursor-pointer hover:opacity-90 transition-all"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Image URL Modal */}
      {showImageUrlModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Enter Image URL</h3>
            <p className="text-white/40 text-sm mb-6">Paste a direct link to your image</p>
            <input
              type="text"
              value={imageUrlInput}
              onChange={e => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#22d3ee] transition-colors"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowImageUrlModal(false); setImageUrlInput(""); }}
                className="flex-1 h-11 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 text-sm font-medium transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (/^https?:\/\//.test(imageUrlInput)) {
                    setImageUrl(imageUrlInput);
                    setShowImageUrlModal(false);
                  } else {
                    alert('Please enter a valid image URL (http/https)');
                  }
                }}
                className="flex-1 h-11 rounded-xl bg-[#22d3ee] text-black hover:bg-[#22d3ee]/90 text-sm font-semibold transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}