import { muapi } from '../lib/muapi.js';
import { i2iModels, getAspectRatiosForModel, getResolutionsForModel, getQualityFieldForModel } from '../lib/models.js';

// Feature 14: Canvas drawing → img2img editor.
// Returns { el, open, close }. `onAddHistoryItem(entry)` is called with the
// generated result so it lands in the studio gallery.
export function DrawModal({ apiKey = '', onAddHistoryItem } = {}) {
    const el = document.createElement('div');
    el.className = 'fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-sm hidden';

    const TOOLS = [
        { id: 'pointer', label: 'Select', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 17 2.51-7.39L20 10.07 3 3z"/></svg>' },
        { id: 'pencil', label: 'Pencil', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
        { id: 'eraser', label: 'Eraser', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16a2 2 0 010-3l9-9a2 2 0 013 0l6 6a2 2 0 010 3l-7 7"/></svg>' },
        { id: 'rect', label: 'Rectangle', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>' },
        { id: 'arrow', label: 'Arrow', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="11 5 19 5 19 13"/></svg>' },
        { id: 'text', label: 'Text', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V5h16v2M9 19h6M12 5v14"/></svg>' },
    ];

    el.innerHTML = `
        <div class="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 gap-4">
            <button type="button" data-close class="absolute top-5 right-5 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10 z-10">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <!-- Setup view -->
            <div data-view="setup" class="flex flex-col items-center gap-6 max-w-lg text-center animate-fade-in-up">
                <h2 class="text-2xl md:text-3xl font-black text-white tracking-wide">Draw &amp; Generate</h2>
                <p class="text-white/50 text-sm">Upload a background, sketch a mask or edit, then run image-to-image with the model of your choice.</p>

                <div class="flex flex-col gap-2 w-full">
                    <span class="text-[10px] font-bold text-muted uppercase tracking-widest text-left">Aspect ratio</span>
                    <div data-ar class="flex gap-2">
                        ${['16:9', '1:1', 'Auto'].map(a => `<button type="button" data-ar-opt="${a}" class="flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${a === '1:1' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}">${a}</button>`).join('')}
                    </div>
                </div>

                <button type="button" data-bg class="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all">Upload background image (optional)</button>

                <div class="relative w-full">
                    <button type="button" data-model class="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all">
                        <span>Model: <span data-model-name class="text-primary">${i2iModels[0]?.name || '—'}</span></span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <div data-model-list class="hidden absolute z-20 mt-1 w-full max-h-60 overflow-y-auto custom-scrollbar bg-[#0c0c0f]/95 rounded-xl p-2 shadow-2xl border border-white/10 backdrop-blur-2xl"></div>
                </div>

                <button type="button" data-start class="px-8 py-3 rounded-full bg-primary text-black font-black text-sm hover:scale-105 transition-all shadow-lg shadow-primary/20">Open canvas</button>
            </div>

            <!-- Canvas view -->
            <div data-view="canvas" class="hidden w-full h-full flex-col items-center justify-center gap-3">
                <div data-tools class="flex items-center gap-1.5 flex-wrap justify-center bg-white/5 border border-white/10 rounded-2xl p-1.5">
                    ${TOOLS.map(t => `<button type="button" data-tool="${t.id}" title="${t.label}" class="w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${t.id === 'pencil' ? 'bg-primary/20 border-primary/40 text-primary' : 'border-transparent text-white/60 hover:bg-white/10 hover:text-white'}">${t.icon}</button>`).join('')}
                    <span class="w-px h-6 bg-white/10 mx-1"></span>
                    <input type="color" data-color value="#22d3ee" class="w-8 h-8 rounded-lg bg-transparent border border-white/10 cursor-pointer" title="Color">
                    <input type="range" data-size min="1" max="40" value="6" class="w-24 accent-primary" title="Brush size">
                    <span data-size-val class="text-xs text-white/60 w-6 text-center">6</span>
                    <button type="button" data-clear class="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all">Clear</button>
                    <button type="button" data-back class="px-3 py-1.5 rounded-xl text-xs font-bold text-white/60 hover:bg-white/10 border border-white/10 transition-all">Back</button>
                </div>

                <div class="relative flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                    <canvas data-canvas class="max-w-full max-h-full rounded-xl border border-white/10 bg-white/5 shadow-2xl touch-none" style="max-width:min(90vw,900px);max-height:60vh;"></canvas>
                </div>

                <div class="w-full max-w-3xl flex items-center gap-3">
                    <textarea data-prompt rows="1" placeholder="Optional prompt for the generation…" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none min-h-[40px] max-h-[120px]"></textarea>
                    <button type="button" data-generate class="px-6 py-3 rounded-full bg-primary text-black font-black text-sm hover:scale-105 transition-all shadow-lg shadow-primary/20 whitespace-nowrap">Generate</button>
                </div>
            </div>

            <input type="file" data-bg-input accept="image/*" class="hidden">
        </div>
    `;

    // ── State ──
    let viewState = 'setup';
    let aspectRatio = '1:1';
    let activeTool = 'pencil';
    let brushSize = 6;
    let color = '#22d3ee';
    let bgImage = null;
    let canvasObjects = [];
    let selectedModelId = i2iModels[0]?.id || null;
    let selectedModelName = i2iModels[0]?.name || '—';
    let drawing = false;
    let generating = false;
    let current = null;

    // ── Refs ──
    const canvas = el.querySelector('[data-canvas]');
    const ctx = canvas.getContext('2d');
    const promptInput = el.querySelector('[data-prompt]');
    const genBtn = el.querySelector('[data-generate]');
    const modelList = el.querySelector('[data-model-list]');

    // ── Helpers ──
    const show = (v) => {
        viewState = v;
        el.querySelectorAll('[data-view]').forEach(n => n.classList.toggle('hidden', n.dataset.view !== v));
    };

    const resizeCanvas = () => {
        let w, h;
        if (bgImage) { w = bgImage.naturalWidth; h = bgImage.naturalHeight; }
        else if (aspectRatio === '16:9') { w = 1024; h = 576; }
        else if (aspectRatio === '1:1') { w = 768; h = 768; }
        else { w = 800; h = 600; }
        canvas.width = w; canvas.height = h;
        redraw();
    };

    const redraw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (bgImage) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        canvasObjects.forEach(drawObject);
    };

    const drawObject = (o) => {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (o.type === 'pencil' || o.type === 'eraser') {
            ctx.save();
            if (o.type === 'eraser') ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = o.color; ctx.lineWidth = o.size;
            ctx.beginPath();
            o.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            if (o.points.length === 1) ctx.lineTo(o.points[0].x + 0.1, o.points[0].y + 0.1);
            ctx.stroke();
            ctx.restore();
        } else if (o.type === 'rect') {
            ctx.strokeStyle = o.color; ctx.lineWidth = o.size;
            ctx.strokeRect(o.x1, o.y1, o.x2 - o.x1, o.y2 - o.y1);
        } else if (o.type === 'arrow') {
            ctx.strokeStyle = o.color; ctx.lineWidth = o.size;
            ctx.beginPath(); ctx.moveTo(o.x1, o.y1); ctx.lineTo(o.x2, o.y2); ctx.stroke();
            const ang = Math.atan2(o.y2 - o.y1, o.x2 - o.x1); const head = 12;
            ctx.beginPath();
            ctx.moveTo(o.x2, o.y2);
            ctx.lineTo(o.x2 - head * Math.cos(ang - Math.PI / 6), o.y2 - head * Math.sin(ang - Math.PI / 6));
            ctx.lineTo(o.x2 - head * Math.cos(ang + Math.PI / 6), o.y2 - head * Math.sin(ang + Math.PI / 6));
            ctx.closePath(); ctx.fillStyle = o.color; ctx.fill();
        } else if (o.type === 'text') {
            ctx.fillStyle = o.color; ctx.font = `${Math.max(14, o.size * 3)}px sans-serif`;
            ctx.fillText(o.text, o.x, o.y);
        }
    };

    const pos = (e) => {
        const r = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) * (canvas.width / r.width),
            y: (e.clientY - r.top) * (canvas.height / r.height),
        };
    };

    // ── Pointer drawing ──
    canvas.addEventListener('pointerdown', (e) => {
        if (activeTool === 'pointer' || activeTool === 'image') return;
        canvas.setPointerCapture(e.pointerId);
        const p = pos(e);
        if (activeTool === 'text') {
            const text = window.prompt('Text:');
            if (text) { canvasObjects.push({ type: 'text', x: p.x, y: p.y + 14, text, size: brushSize, color }); redraw(); }
            return;
        }
        drawing = true;
        if (activeTool === 'pencil' || activeTool === 'eraser') {
            current = { type: activeTool, points: [p], size: brushSize, color };
        } else {
            current = { type: activeTool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, size: brushSize, color };
        }
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!drawing || !current) return;
        const p = pos(e);
        if (current.points) current.points.push(p);
        else { current.x2 = p.x; current.y2 = p.y; }
        redraw();
    });
    const endDraw = () => { if (drawing && current) canvasObjects.push(current); drawing = false; current = null; };
    canvas.addEventListener('pointerup', endDraw);
    canvas.addEventListener('pointercancel', endDraw);

    // ── Toolbar ──
    el.querySelectorAll('[data-tool]').forEach(b => {
        b.onclick = () => {
            activeTool = b.dataset.tool;
            el.querySelectorAll('[data-tool]').forEach(x => {
                const on = x.dataset.tool === activeTool;
                x.className = `w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${on ? 'bg-primary/20 border-primary/40 text-primary' : 'border-transparent text-white/60 hover:bg-white/10 hover:text-white'}`;
            });
        };
    });
    el.querySelector('[data-color]').oninput = (e) => { color = e.target.value; };
    el.querySelector('[data-size]').oninput = (e) => { brushSize = parseInt(e.target.value); el.querySelector('[data-size-val]').textContent = brushSize; };
    el.querySelector('[data-clear]').onclick = () => { canvasObjects = []; redraw(); };
    el.querySelector('[data-back]').onclick = () => show('setup');

    // ── Aspect ratio ──
    el.querySelector('[data-ar]').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-ar-opt]'); if (!btn) return;
        aspectRatio = btn.dataset.arOpt;
        el.querySelectorAll('[data-ar-opt]').forEach(x => {
            const on = x.dataset.arOpt === aspectRatio;
            x.className = `flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${on ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`;
        });
    });

    // ── Background upload ──
    const bgInput = el.querySelector('[data-bg-input]');
    el.querySelector('[data-bg]').onclick = () => bgInput.click();
    bgInput.onchange = (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { bgImage = img; if (viewState === 'canvas') resizeCanvas(); };
        img.src = url;
    };

    // ── Model picker ──
    const renderModels = () => {
        modelList.innerHTML = '';
        i2iModels.forEach(m => {
            const item = document.createElement('div');
            item.className = `flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg cursor-pointer transition-all ${m.id === selectedModelId ? 'bg-white/5' : ''}`;
            item.innerHTML = `<span class="text-xs font-semibold text-white/80">${m.name}</span>${m.id === selectedModelId ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}`;
            item.onclick = () => {
                selectedModelId = m.id; selectedModelName = m.name;
                el.querySelector('[data-model-name]').textContent = m.name;
                modelList.classList.add('hidden');
            };
            modelList.appendChild(item);
        });
    };
    el.querySelector('[data-model]').onclick = (e) => { e.stopPropagation(); renderModels(); modelList.classList.toggle('hidden'); };
    document.addEventListener('click', (e) => { if (!modelList.contains(e.target) && !el.querySelector('[data-model]').contains(e.target)) modelList.classList.add('hidden'); });

    // ── Start / close ──
    el.querySelector('[data-start]').onclick = () => { show('canvas'); resizeCanvas(); };
    el.querySelectorAll('[data-close]').forEach(b => b.onclick = () => close());
    el.onclick = (e) => { if (e.target === el) close(); };

    // ── Keyboard shortcuts ──
    const onKey = (e) => {
        if (el.classList.contains('hidden')) return;
        const map = { p: 'pencil', e: 'eraser', r: 'rect', a: 'arrow', t: 'text', v: 'pointer' };
        if (map[e.key]) { activeTool = map[e.key]; el.querySelector(`[data-tool="${activeTool}"]`)?.click(); }
        if (e.key === 'Delete' || e.key === 'Backspace') { canvasObjects = []; redraw(); }
    };
    document.addEventListener('keydown', onKey);

    // ── Generate ──
    genBtn.onclick = async () => {
        if (generating) return;
        if (!selectedModelId) { alert('Please select a model.'); return; }
        const prompt = promptInput.value.trim();
        generating = true; genBtn.disabled = true; genBtn.textContent = 'Generating…';
        try {
            const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
            const file = new File([blob], 'drawing.png', { type: 'image/png' });
            const uploadedUrl = await muapi.uploadFile(file);
            const genParams = { model: selectedModelId, image_url: uploadedUrl, aspect_ratio: aspectRatio };
            if (prompt) genParams.prompt = prompt;
            const res = await muapi.generateI2I(genParams);
            if (res && res.url) {
                if (onAddHistoryItem) onAddHistoryItem({
                    id: res.id || Date.now().toString(),
                    url: res.url,
                    prompt,
                    model: selectedModelId,
                    aspect_ratio: aspectRatio,
                    timestamp: new Date().toISOString(),
                });
                close();
            } else {
                throw new Error('No image URL returned by API');
            }
        } catch (err) {
            console.error('[DrawModal] generation failed:', err);
            alert(`Draw generation failed: ${err.message}`);
        } finally {
            generating = false; genBtn.disabled = false; genBtn.textContent = 'Generate';
        }
    };

    function close() {
        el.classList.add('hidden');
        canvasObjects = [];
        redraw();
    }
    function open() {
        el.classList.remove('hidden');
        show('setup');
        aspectRatio = '1:1';
        el.querySelectorAll('[data-ar-opt]').forEach(x => x.classList.toggle('bg-primary/20', x.dataset.arOpt === '1:1'));
        el.querySelectorAll('[data-ar-opt]').forEach(x => x.classList.toggle('border-primary/40', x.dataset.arOpt === '1:1'));
        el.querySelectorAll('[data-ar-opt]').forEach(x => x.classList.toggle('text-primary', x.dataset.arOpt === '1:1'));
        el.querySelector('[data-model-name]').textContent = selectedModelName;
    }

    return { el, open, close };
}
