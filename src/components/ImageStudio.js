import { muapi } from '../lib/muapi.js';
import {
    t2iModels, getAspectRatiosForModel, getResolutionsForModel, getQualityFieldForModel,
    i2iModels, getAspectRatiosForI2IModel, getResolutionsForI2IModel, getQualityFieldForI2IModel,
    getMaxImagesForI2IModel
} from '../lib/models.js';
import { localAI, isLocalAIAvailable } from '../lib/localInferenceClient.js';
import { LOCAL_MODEL_CATALOG, getLocalModelById } from '../lib/localModels.js';
import { ENHANCE_TAGS, QUICK_PROMPTS } from '../lib/promptUtils.js';
import { AuthModal } from './AuthModal.js';
import { t } from '../lib/i18n.js';
import { createUploadPicker } from './UploadPicker.js';
import { DrawModal } from './DrawModal.js';
import { savePendingJob, removePendingJob, getPendingJobs } from '../lib/pendingJobs.js';

function createInlineInstructions(type) {
    const el = document.createElement('div');
    el.className = 'w-full text-center text-white/30 text-sm flex flex-col items-center gap-2 py-2';
    const icon = type === 'image' ? '🖼️' : '🎬';
    el.innerHTML = `
        <p>${icon} Enter a prompt above and click <span class="text-primary font-semibold">Generate</span> to create your ${type}.</p>
        <p class="text-xs text-white/20">Tip: Be descriptive — include style, lighting, mood, and subject for best results.</p>
    `;
    return el;
}

export function ImageStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

    // --- State ---
    const defaultModel = t2iModels[0];
    let selectedModel = defaultModel.id;
    let selectedModelName = defaultModel.name;
    let selectedAr = defaultModel.inputs?.aspect_ratio?.default || '1:1';
    let dropdownOpen = null;
    let uploadedImageUrls = []; // array of uploaded image URLs (multi-image support)
    let imageMode = false; // false = t2i models, true = i2i models

    // Local inference state — only image-capable models surface here.
    // sd.cpp uses type='sd1'|'sdxl'|'z-image'; Wan2GP image models use type='image'.
    // Wan2GP video models (type='video') are hidden from ImageStudio.
    const LOCAL_IMAGE_MODELS = LOCAL_MODEL_CATALOG.filter(m => m.type !== 'video');
    let useLocalModel = false;
    let selectedLocalModel = LOCAL_IMAGE_MODELS[0]?.id || null;
    let localGenProgress = 0; // 0–1

    // Advanced parameters state
    let negativePrompt = '';
    let guidanceScale = 7.5;
    let steps = 25;
    let seed = -1;
    let showAdvanced = false;
    let selectedStyle = 'None';
    let batchCount = 1;

    // New advanced controls
    let customWidth = 0;  // 0 means use default (aspect ratio based)
    let customHeight = 0;
    let referenceStrength = 50;  // 0-100, for style reference models
    let selectedLora = '';  // LoRA model ID from Civitai
    let loraWeight = 1.0;
    let selectedEffect = '';  // i2i effect name (Feature 5)
    let swapImageUrl = null;  // swap-face source image (Feature 7)

    // Quick tools panel state
    let showToolsPanel = false;

    const getCurrentModels = () => imageMode ? i2iModels : t2iModels;
    const getCurrentAspectRatios = (id) => imageMode ? getAspectRatiosForI2IModel(id) : getAspectRatiosForModel(id);
    const getCurrentResolutions = (id) => imageMode ? getResolutionsForI2IModel(id) : getResolutionsForModel(id);
    const getCurrentQualityField = (id) => imageMode ? getQualityFieldForI2IModel(id) : getQualityFieldForModel(id);

    // ── Feature 2: provider logos for the model picker ──
    const PROVIDER_LOGOS = {
        openai: "https://cdn.muapi.ai/models/openai.png",
        google: "https://cdn.muapi.ai/models/gemini.png",
        kling: "https://cdn.muapi.ai/models/kling.png",
        alibaba: "https://cdn.muapi.ai/models/alibaba.png",
        bytedance: "https://cdn.muapi.ai/models/bytedance.png",
        blackforest: "https://cdn.muapi.ai/models/bfl.png",
        minimax: "https://cdn.muapi.ai/models/minimax.png",
        suno: "https://cdn.muapi.ai/models/suno.png",
        anthropic: "https://cdn.muapi.ai/models/claude.png",
        meshy: "https://cdn.muapi.ai/models/meshy-3.png",
        tripo3d: "https://cdn.muapi.ai/models/tripo3d.png",
        grok: "https://cdn.muapi.ai/models/xai.png",
        muapi: "https://cdn.muapi.ai/models/muapi.png",
        midjourney: "https://cdn.muapi.ai/models/midjourney.png",
        vidu: "https://cdn.muapi.ai/models/vidu.png",
        runway: "https://cdn.muapi.ai/models/runway.png",
        luma: "https://cdn.muapi.ai/models/luma.png",
        ideogram: "https://cdn.muapi.ai/models/ideogram.png",
        leonardoai: "https://cdn.muapi.ai/models/leonardoai.png",
        hunyuan: "https://cdn.muapi.ai/models/hunyuan.png",
        hidream: "https://cdn.muapi.ai/models/hidream.png",
        lightricks: "https://cdn.muapi.ai/models/lightricks.png",
        pixverse: "https://cdn.muapi.ai/models/pixverse.png",
        reve: "https://cdn.muapi.ai/models/reve.png",
        stability: "https://cdn.muapi.ai/models/stability.png"
    };
    const invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];
    let modelProviderFilter = 'all';

    // ==========================================
    // 1. HERO SECTION
    // ==========================================
    const hero = document.createElement('div');
    hero.className = 'flex flex-col items-center mb-10 md:mb-20 animate-fade-in-up transition-all duration-700';
    hero.innerHTML = `
        <div class="mb-10 relative group">
             <div class="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-1000"></div>
             <div class="relative w-24 h-24 md:w-32 md:h-32 bg-teal-900/40 rounded-3xl flex items-center justify-center border border-white/5 overflow-hidden">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-primary opacity-20 absolute -right-4 -bottom-4">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
                <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow relative z-10">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-primary">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                </div>
                <!-- Sparkles -->
                <div class="absolute top-4 right-4 text-primary animate-pulse">✨</div>
             </div>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-7xl font-black text-white tracking-widest uppercase mb-4 selection:bg-primary selection:text-black text-center px-4">${t('image.title')}</h1>
        <p class="text-secondary text-sm font-medium tracking-wide opacity-60">${t('image.subtitle')}</p>
    `;
    container.appendChild(hero);

    // ==========================================
    // 2. PROMPT BAR (Tailwind Refactor)
    // ==========================================
    const promptWrapper = document.createElement('div');
    promptWrapper.className = 'w-full max-w-4xl relative z-40 animate-fade-in-up';
    promptWrapper.style.animationDelay = '0.2s';

    const bar = document.createElement('div');
    bar.className = 'w-full bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-5 flex flex-col gap-3 md:gap-5 shadow-3xl';

    // Top Row: Input
    const topRow = document.createElement('div');
    topRow.className = 'flex items-start gap-5 px-2';

    // --- Image Upload Picker (Image-to-Image) ---
    const picker = createUploadPicker({
        anchorContainer: container,
        uploadFn: (file) => useLocalModel ? URL.createObjectURL(file) : muapi.uploadFile(file),
        requireApiKey: () => !useLocalModel,
        onSelect: ({ url, urls }) => {
            uploadedImageUrls = urls || [url];
            if (!imageMode) {
                imageMode = true;
                selectedModel = i2iModels[0].id;
                selectedModelName = i2iModels[0].name;
                selectedAr = getAspectRatiosForI2IModel(selectedModel)[0];
                document.getElementById('model-btn-label').textContent = selectedModelName;
                document.getElementById('ar-btn-label').textContent = selectedAr;
                const validResolutions = getResolutionsForI2IModel(selectedModel);
                qualityBtn.style.display = validResolutions.length > 0 ? 'flex' : 'none';
                if (validResolutions.length > 0) document.getElementById('quality-btn-label').textContent = validResolutions[0];
                picker.setMaxImages(getMaxImagesForI2IModel(selectedModel));
                selectedEffect = '';
                updateEffectBtn();
                updateSwapBtn();
            }
            textarea.placeholder = uploadedImageUrls.length > 1
                ? `${uploadedImageUrls.length} ${t('image.multiImageNote') || 'images selected — describe the transformation (optional)'}`
                : t('image.placeholderTransform');
            saveSettings();
        },
        onClear: () => {
            uploadedImageUrls = [];
            imageMode = false;
            selectedModel = t2iModels[0].id;
            selectedModelName = t2iModels[0].name;
            selectedAr = getAspectRatiosForModel(selectedModel)[0];
            document.getElementById('model-btn-label').textContent = selectedModelName;
            document.getElementById('ar-btn-label').textContent = selectedAr;
            const t2iResolutions = getResolutionsForModel(selectedModel);
            qualityBtn.style.display = t2iResolutions.length > 0 ? 'flex' : 'none';
            if (t2iResolutions.length > 0) document.getElementById('quality-btn-label').textContent = t2iResolutions[0];
            picker.setMaxImages(1);
            textarea.placeholder = t('image.placeholder');
            selectedEffect = '';
            updateEffectBtn();
            swapImageUrl = null;
            updateSwapBtn();
            saveSettings();
        }
    });
    topRow.appendChild(picker.trigger);
    container.appendChild(picker.panel);

    // ── Feature 8: Drag & drop upload ──
    let dragDepth = 0;
    container.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragDepth++;
        container.classList.add('ring-2', 'ring-primary/50');
    });
    container.addEventListener('dragover', (e) => { e.preventDefault(); });
    container.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) container.classList.remove('ring-2', 'ring-primary/50');
    });
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDepth = 0;
        container.classList.remove('ring-2', 'ring-primary/50');
        const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
        if (files.length && typeof picker.addFiles === 'function') picker.addFiles(files);
    });

    // ── Feature 7: Swap-face source uploader ──
    const swapPicker = createUploadPicker({
        anchorContainer: container,
        uploadFn: (file) => muapi.uploadFile(file),
        requireApiKey: () => true,
        onSelect: ({ url }) => { swapImageUrl = url; saveSettings(); },
        onClear: () => { swapImageUrl = null; saveSettings(); },
    });
    swapPicker.trigger.title = 'Swap face';
    topRow.appendChild(swapPicker.trigger);
    container.appendChild(swapPicker.panel);
    swapPicker.trigger.style.display = 'none';

    const updateSwapBtn = () => {
        const model = imageMode ? i2iModels.find(m => m.id === selectedModel) : null;
        const show = !!(model && model.swapField);
        swapPicker.trigger.style.display = show ? 'flex' : 'none';
    };
    updateSwapBtn();

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Describe the image you want to create';
    textarea.className = 'flex-1 bg-transparent border-none text-white text-base md:text-xl placeholder:text-muted focus:outline-none resize-none pt-2.5 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar';
    textarea.rows = 1;
    textarea.oninput = () => {
        textarea.style.height = 'auto';
        const maxHeight = window.innerWidth < 768 ? 150 : 250;
        textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        saveSettings();
    };

    topRow.appendChild(textarea);
    bar.appendChild(topRow);

    // Bottom Row: Controls
    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-2 pt-4 border-t border-white/5';

    const controlsLeft = document.createElement('div');
    controlsLeft.className = 'flex items-center gap-1.5 md:gap-2.5 relative overflow-x-auto no-scrollbar pb-1 md:pb-0';

    const createControlBtn = (icon, label, id, tooltip) => {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = 'flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap';
        if (tooltip) btn.setAttribute('data-tooltip', tooltip);
        btn.innerHTML = `
            ${icon}
            <span id="${id}-label" class="text-xs font-bold text-white group-hover:text-primary transition-colors">${label}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" class="opacity-20 group-hover:opacity-100 transition-opacity"><path d="M6 9l6 6 6-6"/></svg>
        `;
        return btn;
    };

    const modelBtn = createControlBtn(`
        <div class="w-5 h-5 bg-primary rounded-md flex items-center justify-center shadow-lg shadow-primary/20">
            <span class="text-[10px] font-black text-black">G</span>
        </div>
    `, selectedModelName, 'model-btn', t('image.modelTooltip'));

    const arBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
    `, selectedAr, 'ar-btn', t('image.arTooltip'));

    const qualityBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"/></svg>
    `, '720p', 'quality-btn', t('image.qualityTooltip'));

    // Local / API source toggle (only shown in Electron)
    let localToggleBtn = null;
    if (isLocalAIAvailable()) {
        localToggleBtn = document.createElement('button');
        localToggleBtn.id = 'local-toggle-btn';
        localToggleBtn.className = 'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border text-xs font-bold whitespace-nowrap';
        const updateLocalToggleStyle = () => {
            if (useLocalModel) {
                localToggleBtn.className = 'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border text-xs font-bold whitespace-nowrap bg-primary/20 border-primary/40 text-primary';
                localToggleBtn.textContent = t('image.local');
            } else {
                localToggleBtn.className = 'flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border text-xs font-bold whitespace-nowrap bg-white/5 border-white/5 text-white/60 hover:bg-white/10';
                localToggleBtn.textContent = t('image.api');
            }
        };
        updateLocalToggleStyle();
        localToggleBtn.onclick = (e) => {
            e.stopPropagation();
            useLocalModel = !useLocalModel;
            updateLocalToggleStyle();
            // Reflect active model in the button label
            if (useLocalModel) {
                const lm = getLocalModelById(selectedLocalModel);
                if (lm) document.getElementById('model-btn-label').textContent = lm.name;
            } else {
                document.getElementById('model-btn-label').textContent = selectedModelName;
            }
        };
        controlsLeft.appendChild(localToggleBtn);
    }

    controlsLeft.appendChild(modelBtn);
    controlsLeft.appendChild(arBtn);
    controlsLeft.appendChild(qualityBtn);

    // Feature 5: i2i effect picker
    const effectBtn = createControlBtn(`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-40 text-white"><path d="M5 3l14 9-14 9V3z"/></svg>
    `, 'Effect', 'effect-btn', t('image.effectTooltip') || 'Effect type');
    effectBtn.style.display = 'none';
    controlsLeft.appendChild(effectBtn);

    const updateEffectBtn = () => {
        const effects = imageMode ? getEffectsForI2IModel(selectedModel) : [];
        const show = effects.length > 0;
        effectBtn.style.display = show ? 'flex' : 'none';
        if (show) {
            const lbl = document.getElementById('effect-btn-label');
            if (lbl) lbl.textContent = selectedEffect || 'Effect';
        }
    };
    updateEffectBtn();
    
    // Advanced options toggle button
    const advancedBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 001.82-.33 1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-1.82.33A1.65 1.65 0 0019.4 9a1.65 1.65 0 00-1.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
    `, t('common.advanced'), 'advanced-btn', t('image.advancedTooltip'));
    controlsLeft.appendChild(advancedBtn);

    // Quick Tools toggle button
    const toolsBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
    `, t('common.tools'), 'tools-btn', t('image.toolsTooltip'));
    controlsLeft.appendChild(toolsBtn);
    // Feature 14: Draw button
    const drawBtn = createControlBtn(`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-40 text-white group-hover:text-primary transition-colors"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    `, 'Draw', 'draw-btn', t('image.drawTooltip') || 'Draw');
    controlsLeft.appendChild(drawBtn);
    // Show quality button if the default model has quality/resolution options
    const _initResolutions = getResolutionsForModel(defaultModel.id);
    qualityBtn.style.display = _initResolutions.length > 0 ? 'flex' : 'none';
    if (_initResolutions.length > 0) {
        const qlabel = qualityBtn.querySelector('#quality-btn-label');
        if (qlabel) qlabel.textContent = _initResolutions[0];
    }

    const generateBtn = document.createElement('button');
    generateBtn.className = 'bg-primary text-black px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-base hover:shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto shadow-lg';
    generateBtn.setAttribute('data-tooltip', t('image.generateTooltip'));
    generateBtn.innerHTML = t('common.generate');

    bottomRow.appendChild(controlsLeft);
    bottomRow.appendChild(generateBtn);
    bar.appendChild(bottomRow);
    promptWrapper.appendChild(bar);
    container.appendChild(promptWrapper);

    const inlineInstructions = createInlineInstructions('image');
    inlineInstructions.classList.add('max-w-4xl', 'mt-8');
    container.appendChild(inlineInstructions);

    // Local generation progress bar (hidden until active)
    const localProgressWrap = document.createElement('div');
    localProgressWrap.className = 'w-full max-w-4xl mt-4 hidden flex-col gap-2';
    localProgressWrap.id = 'local-progress-wrap';
    localProgressWrap.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white/60">${t('image.generatingLocally')}</span>
            <span id="local-progress-pct" class="text-xs font-bold text-primary">0%</span>
        </div>
        <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div id="local-progress-fill" class="h-full bg-primary transition-all duration-200" style="width:0%"></div>
        </div>
        <div class="flex justify-end">
            <button id="local-cancel-btn" class="text-xs text-red-400 hover:text-red-300 transition-colors">${t('common.cancel')}</button>
        </div>
    `;
    container.appendChild(localProgressWrap);

    localProgressWrap.querySelector('#local-cancel-btn')?.addEventListener('click', () => {
        localAI.cancelGeneration();
        localProgressWrap.classList.remove('flex');
        localProgressWrap.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.innerHTML = t('common.generate');
    });

    // ==========================================
    // 3. QUICK TOOLS PANEL (Prompt Enhancer + Quick Starters)
    // ==========================================
    const toolsPanel = document.createElement('div');
    toolsPanel.className = 'w-full max-w-4xl mt-6 animate-fade-in-up hidden';
    toolsPanel.id = 'tools-panel';
    
    // Build tools panel HTML
    toolsPanel.innerHTML = `
        <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 class="text-sm font-bold text-white">${t('image.quickTools')}</h3>
                <button id="close-tools-btn" class="text-white/40 hover:text-white transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Quick Starters Section -->
                <div class="flex-1">
                    <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-3">${t('image.quickStarters')}</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        ${QUICK_PROMPTS.map(q => `
                            <button class="quick-starter-btn px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 hover:text-primary transition-all text-left border border-white/5 hover:border-primary/30" data-prompt="${q.prompt}">
                                ${q.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Prompt Enhancer Section -->
                <div class="flex-1">
                    <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-3">${t('image.promptEnhancer')}</h4>
                    <div class="flex flex-col gap-3">
                        <input type="text" id="base-prompt-input"
                            placeholder="${t('image.basePromptPlaceholder')}"
                            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">

                        <div>
                            <label class="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">${t('image.enhancementTags')}</label>
                            <div id="enhance-tags-area" class="flex flex-wrap gap-1.5">
                                ${Object.entries(ENHANCE_TAGS).map(([category, tags]) => 
                                    tags.map(tag => `<button class="enhance-tag-btn px-2 py-1 rounded-full text-[10px] font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all" data-tag="${tag}">${tag}</button>`).join('')
                                ).join('')}
                            </div>
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-bold text-muted uppercase tracking-wider">${t('image.enhancedPrompt')}</label>
                            <div id="enhanced-prompt-display" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs min-h-[40px]"></div>
                            <div class="flex gap-2">
                                <button id="copy-enhanced-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all">
                                    ${t('common.copy')}
                                </button>
                                <button id="use-enhanced-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:shadow-glow transition-all">
                                    ${t('common.useInGenerator')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(toolsPanel);

    // ==========================================
    // 4. ADVANCED OPTIONS PANEL
    // ==========================================
    const STYLE_PRESETS = ['None', 'Photorealistic', 'Anime', 'Cinematic', 'Oil Painting', 'Watercolor', 'Digital Art', 'Concept Art', 'Cyberpunk'];
    
    const advancedPanel = document.createElement('div');
    advancedPanel.className = 'w-full max-w-4xl mt-6 animate-fade-in-up hidden';
    advancedPanel.id = 'advanced-panel';
    advancedPanel.innerHTML = `
        <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 class="text-sm font-bold text-white">${t('image.advancedOptions')}</h3>
                <button id="close-adv-btn" class="text-white/40 hover:text-white transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            <!-- Style Presets -->
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.stylePreset')}</label>
                <div class="flex gap-2 flex-wrap">
                    ${STYLE_PRESETS.map(s => `<button class="style-preset-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all" data-style="${s}">${s}</button>`).join('')}
                </div>
            </div>
            
            <!-- Negative Prompt -->
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.negPromptLabel')}</label>
                <input type="text" id="negative-prompt-input"
                    placeholder="${t('image.negPromptPlaceholder')}"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
            </div>
            
            <!-- Guidance Scale & Steps Row -->
            <div class="flex gap-4 flex-wrap">
                <div class="flex-1 min-w-[200px] flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.guidanceScale')}</label>
                        <span id="guidance-value" class="text-xs font-bold text-primary">7.5</span>
                    </div>
                    <input type="range" id="guidance-slider" min="1" max="20" step="0.5" value="7.5" 
                        class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
                </div>
                
                <div class="flex-1 min-w-[200px] flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.steps')}</label>
                        <span id="steps-value" class="text-xs font-bold text-primary">25</span>
                    </div>
                    <input type="range" id="steps-slider" min="1" max="50" step="1" value="25" 
                        class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
                </div>
            </div>
            
            <!-- Seed -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.seed')}</label>
                    <button id="randomize-seed-btn" class="text-xs font-bold text-primary hover:text-primary/80 transition-colors">${t('common.randomize')}</button>
                </div>
                <input type="number" id="seed-input"
                    placeholder="${t('image.seedPlaceholder')}"
                    value="-1"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
            </div>
            
            <!-- Batch Count -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.batchCount')}</label>
                    <span id="batch-value" class="text-xs font-bold text-primary">1</span>
                </div>
                <input type="range" id="batch-slider" min="1" max="4" step="1" value="1" 
                    class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
            </div>
            
            <!-- Width & Height -->
            <div class="flex gap-4 flex-wrap">
                <div class="flex-1 min-w-[120px] flex flex-col gap-2">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.width')}</label>
                    <input type="number" id="width-input"
                        placeholder="${t('image.widthPlaceholder')}"
                        value=""
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
                </div>
                <div class="flex-1 min-w-[120px] flex flex-col gap-2">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.height')}</label>
                    <input type="number" id="height-input"
                        placeholder="${t('image.heightPlaceholder')}"
                        value=""
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
                </div>
            </div>
            
            <!-- Reference Strength (for I2I models) -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.refStrength')}</label>
                    <span id="reference-strength-value" class="text-xs font-bold text-primary">50%</span>
                </div>
                <input type="range" id="reference-strength-slider" min="0" max="100" step="5" value="50" 
                    class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
                <p class="text-xs text-muted">${t('image.refStrengthNote')}</p>
            </div>
            
            <!-- LoRA Model Selection -->
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-secondary uppercase tracking-wider">${t('image.lora')}</label>
                <input type="text" id="lora-input"
                    placeholder="${t('image.loraPlaceholder')}"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
                <div class="flex items-center gap-2 mt-1">
                    <label class="text-xs font-bold text-secondary">${t('image.loraWeight')}</label>
                    <input type="number" id="lora-weight-input" 
                        value="1.0" min="0" max="4" step="0.1"
                        class="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors">
                </div>
                <p class="text-xs text-muted">${t('image.loraNote')}</p>
            </div>
        </div>
    `;
    container.appendChild(advancedPanel);

    // Advanced panel toggle logic
    const toggleAdvanced = () => {
        showAdvanced = !showAdvanced;
        advancedPanel.classList.toggle('hidden', !showAdvanced);
        document.getElementById('advanced-btn-label').textContent = showAdvanced ? t('common.less') : t('common.advanced');
    };
    
    // Add tools panel and advanced panel to container first before accessing their elements
    container.appendChild(toolsPanel);
    container.appendChild(advancedPanel);
    
    // Now set up event handlers after elements are in DOM
    advancedBtn.onclick = toggleAdvanced;
    const closeAdvBtn = advancedPanel.querySelector('#close-adv-btn');
    if (closeAdvBtn) closeAdvBtn.onclick = toggleAdvanced;
    
    // Quick Tools Panel toggle
    const toggleTools = () => {
        showToolsPanel = !showToolsPanel;
        toolsPanel.classList.toggle('hidden', !showToolsPanel);
        if (showToolsPanel) {
            // Close advanced panel when opening tools
            if (!showAdvanced) {
                showAdvanced = true;
                advancedPanel.classList.remove('hidden');
            }
        }
        document.getElementById('tools-btn-label').textContent = showToolsPanel ? 'Tools' : 'Tools';
    };
    
    toolsBtn.onclick = toggleTools;
    const closeToolsBtn = toolsPanel.querySelector('#close-tools-btn');
    if (closeToolsBtn) closeToolsBtn.onclick = toggleTools;
    
    // Quick Starter buttons
    const quickStarterBtns = toolsPanel.querySelectorAll('.quick-starter-btn');
    quickStarterBtns.forEach(btn => {
        btn.onclick = () => {
            const prompt = btn.dataset.prompt;
            textarea.value = prompt;
            textarea.style.height = 'auto';
            const maxHeight = window.innerWidth < 768 ? 150 : 250;
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
            // Close tools panel after selection
            showToolsPanel = false;
            toolsPanel.classList.add('hidden');
        };
    });
    
    // Prompt Enhancer - selected tags state
    const enhanceSelectedTags = new Set();
    const basePromptInput = toolsPanel.querySelector('#base-prompt-input');
    const enhancedPromptDisplay = toolsPanel.querySelector('#enhanced-prompt-display');
    
    // Update enhanced prompt display
    const updateEnhancedPrompt = () => {
        const base = basePromptInput?.value?.trim() || '';
        const tags = Array.from(enhanceSelectedTags).join(', ');
        const enhanced = [base, tags].filter(p => p).join(', ');
        if (enhancedPromptDisplay) {
            enhancedPromptDisplay.textContent = enhanced || t('image.enhancedPlaceholder');
            enhancedPromptDisplay.classList.toggle('text-muted', !enhanced);
        }
    };
    
    // Base prompt input handler
    if (basePromptInput) {
        basePromptInput.oninput = updateEnhancedPrompt;
    }
    
    // Enhance tag buttons
    const enhanceTagBtns = toolsPanel.querySelectorAll('.enhance-tag-btn');
    enhanceTagBtns.forEach(btn => {
        btn.onclick = () => {
            const tag = btn.dataset.tag;
            if (enhanceSelectedTags.has(tag)) {
                enhanceSelectedTags.delete(tag);
                btn.classList.remove('bg-primary', 'text-black');
                btn.classList.add('bg-white/5', 'text-secondary');
            } else {
                enhanceSelectedTags.add(tag);
                btn.classList.remove('bg-white/5', 'text-secondary');
                btn.classList.add('bg-primary', 'text-black');
            }
            updateEnhancedPrompt();
        };
    });
    
    // Copy enhanced button
    const copyEnhancedBtn = toolsPanel.querySelector('#copy-enhanced-btn');
    if (copyEnhancedBtn) {
        copyEnhancedBtn.onclick = () => {
            const text = enhancedPromptDisplay?.textContent || '';
            if (text && text !== t('image.enhancedPlaceholder')) {
                navigator.clipboard.writeText(text);
                copyEnhancedBtn.textContent = t('common.copied');
                setTimeout(() => { copyEnhancedBtn.textContent = t('common.copy'); }, 1500);
            }
        };
    }
    
    // Use enhanced button
    const useEnhancedBtn = toolsPanel.querySelector('#use-enhanced-btn');
    if (useEnhancedBtn) {
        useEnhancedBtn.onclick = () => {
            const text = enhancedPromptDisplay?.textContent || '';
            if (text && text !== t('image.enhancedPlaceholder')) {
                textarea.value = text;
                textarea.style.height = 'auto';
                const maxHeight = window.innerWidth < 768 ? 150 : 250;
                textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
                // Close tools panel after use
                showToolsPanel = false;
                toolsPanel.classList.add('hidden');
            }
        };
    }
    
    // Negative prompt
    const negPromptInput = advancedPanel.querySelector('#negative-prompt-input');
    if (negPromptInput) negPromptInput.oninput = (e) => { negativePrompt = e.target.value; saveSettings(); };
    
    // Guidance scale slider
    const guidanceSlider = advancedPanel.querySelector('#guidance-slider');
    const guidanceValue = advancedPanel.querySelector('#guidance-value');
    if (guidanceSlider && guidanceValue) {
        guidanceSlider.oninput = (e) => {
            guidanceScale = parseFloat(e.target.value);
            guidanceValue.textContent = guidanceScale;
            saveSettings();
        };
    }
    
    // Steps slider
    const stepsSlider = advancedPanel.querySelector('#steps-slider');
    const stepsValue = advancedPanel.querySelector('#steps-value');
    if (stepsSlider && stepsValue) {
        stepsSlider.oninput = (e) => {
            steps = parseInt(e.target.value);
            stepsValue.textContent = steps;
            saveSettings();
        };
    }
    
    // Seed input
    const seedInput = advancedPanel.querySelector('#seed-input');
    if (seedInput) seedInput.oninput = (e) => { seed = parseInt(e.target.value) || -1; saveSettings(); };
    
    // Randomize seed button
    const randSeedBtn = advancedPanel.querySelector('#randomize-seed-btn');
    if (randSeedBtn) {
        randSeedBtn.onclick = () => {
            seed = Math.floor(Math.random() * 999999999);
            if (seedInput) seedInput.value = seed;
        };
    }
    
    // Batch count slider
    const batchSlider = advancedPanel.querySelector('#batch-slider');
    const batchValueEl = advancedPanel.querySelector('#batch-value');
    if (batchSlider && batchValueEl) {
        batchSlider.oninput = (e) => {
            batchCount = parseInt(e.target.value);
            batchValueEl.textContent = batchCount;
            saveSettings();
        };
    }
    
    // Width input
    const widthInput = advancedPanel.querySelector('#width-input');
    if (widthInput) {
        widthInput.oninput = (e) => {
            customWidth = parseInt(e.target.value) || 0;
            saveSettings();
        };
    }
    
    // Height input
    const heightInput = advancedPanel.querySelector('#height-input');
    if (heightInput) {
        heightInput.oninput = (e) => {
            customHeight = parseInt(e.target.value) || 0;
            saveSettings();
        };
    }
    
    // Reference strength slider
    const refStrengthSlider = advancedPanel.querySelector('#reference-strength-slider');
    const refStrengthValue = advancedPanel.querySelector('#reference-strength-value');
    if (refStrengthSlider && refStrengthValue) {
        refStrengthSlider.oninput = (e) => {
            referenceStrength = parseInt(e.target.value);
            refStrengthValue.textContent = referenceStrength + '%';
            saveSettings();
        };
    }
    
    // LoRA input
    const loraInput = advancedPanel.querySelector('#lora-input');
    if (loraInput) {
        loraInput.oninput = (e) => {
            selectedLora = e.target.value.trim();
            saveSettings();
        };
    }
    
    // LoRA weight input
    const loraWeightInput = advancedPanel.querySelector('#lora-weight-input');
    if (loraWeightInput) {
        loraWeightInput.oninput = (e) => {
            loraWeight = parseFloat(e.target.value) || 1.0;
            saveSettings();
        };
    }

    // ── Studio settings persistence (Feature 12) ──
    const PERSIST_KEY = 'hg_image_studio_state';
    const saveSettings = () => {
        try {
            const state = {
                selectedModel, selectedModelName, selectedAr,
                quality: document.getElementById('quality-btn-label')?.textContent || '',
                imageMode, uploadedImageUrls,
                batchCount, prompt: textarea.value,
                selectedStyle, negativePrompt, guidanceScale, steps, seed,
                customWidth, customHeight, referenceStrength, selectedLora, loraWeight,
                useLocalModel, selectedLocalModel,
                selectedEffect,
            };
            localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
        } catch (e) { /* ignore */ }
    };
    const loadSettings = () => {
        try {
            const s = JSON.parse(localStorage.getItem(PERSIST_KEY) || '{}');
            if (s.selectedModel) {
                selectedModel = s.selectedModel;
                selectedModelName = s.selectedModelName || selectedModelName;
                const ml = document.getElementById('model-btn-label'); if (ml) ml.textContent = selectedModelName;
            }
            if (s.selectedAr) {
                selectedAr = s.selectedAr;
                const al = document.getElementById('ar-btn-label'); if (al) al.textContent = selectedAr;
            }
            if (s.quality) {
                const ql = document.getElementById('quality-btn-label'); if (ql) ql.textContent = s.quality;
            }
            if (typeof s.imageMode === 'boolean') imageMode = s.imageMode;
            if (Array.isArray(s.uploadedImageUrls)) uploadedImageUrls = s.uploadedImageUrls;
            if (typeof s.batchCount === 'number') {
                batchCount = s.batchCount;
                const be = document.getElementById('batch-value'); if (be) be.textContent = batchCount;
                const bs = document.getElementById('batch-slider'); if (bs) bs.value = batchCount;
            }
            if (typeof s.prompt === 'string' && s.prompt) textarea.value = s.prompt;
            if (typeof s.selectedStyle === 'string') selectedStyle = s.selectedStyle;
            if (typeof s.negativePrompt === 'string') negativePrompt = s.negativePrompt;
            if (typeof s.guidanceScale === 'number') guidanceScale = s.guidanceScale;
            if (typeof s.steps === 'number') steps = s.steps;
            if (typeof s.seed === 'number') seed = s.seed;
            if (typeof s.customWidth === 'number') customWidth = s.customWidth;
            if (typeof s.customHeight === 'number') customHeight = s.customHeight;
            if (typeof s.referenceStrength === 'number') referenceStrength = s.referenceStrength;
            if (typeof s.selectedLora === 'string') selectedLora = s.selectedLora;
            if (typeof s.loraWeight === 'number') loraWeight = s.loraWeight;
            if (typeof s.useLocalModel === 'boolean') useLocalModel = s.useLocalModel;
            if (s.selectedLocalModel) selectedLocalModel = s.selectedLocalModel;
            if (typeof s.selectedEffect === 'string') selectedEffect = s.selectedEffect;
            updateEffectBtn();
            updateSwapBtn();
        } catch (e) { /* ignore */ }
    };
    
    // Style preset handlers
    advancedPanel.querySelectorAll('.style-preset-btn').forEach(btn => {
        btn.onclick = () => {
            selectedStyle = btn.dataset.style;
            advancedPanel.querySelectorAll('.style-preset-btn').forEach(b => {
                b.classList.remove('bg-primary/20', 'text-primary', 'border-primary/30');
                b.classList.add('bg-white/5', 'text-secondary');
            });
            btn.classList.add('bg-primary/20', 'text-primary', 'border-primary/30');
                btn.classList.remove('bg-white/5', 'text-secondary');
                saveSettings();
            };
    });
    // ==========================================
    // 3. DROPDOWNS (Professional implementation)
    // ==========================================
    const dropdown = document.createElement('div');
    dropdown.className = 'absolute bottom-[102%] left-2 z-50 transition-all opacity-0 pointer-events-none scale-95 origin-bottom-left glass rounded-3xl p-3 translate-y-2 w-[calc(100vw-3rem)] max-w-xs shadow-4xl border border-white/10 flex flex-col';

    const showDropdown = (type, anchorBtn) => {
        dropdown.innerHTML = '';
        dropdown.classList.remove('opacity-0', 'pointer-events-none');
        dropdown.classList.add('opacity-100', 'pointer-events-auto');

        if (type === 'model') {
            dropdown.classList.add('max-w-md');
            dropdown.classList.remove('max-w-[240px]', 'max-w-[200px]', 'w-[calc(100vw-3rem)]', 'max-w-xs');
            dropdown.innerHTML = `
                <div class="flex gap-3 h-full max-h-[70vh] min-h-[320px] overflow-hidden">
                    <div id="model-provider-tabs" class="flex flex-col gap-2 items-center pr-3 border-r border-white/5 shrink-0 overflow-y-auto custom-scrollbar w-12 py-0.5"></div>
                    <div class="flex-1 flex flex-col gap-2 min-w-0">
                        <div class="border-b border-white/5 shrink-0 pb-2">
                            <div class="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/5 focus-within:border-primary/50 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-muted"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                                <input type="text" id="model-search" placeholder="${t('common.searchModels')}" class="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0">
                            </div>
                        </div>
                        <div class="text-xs font-semibold text-secondary py-1 shrink-0">Available models</div>
                        <div id="model-list-container" class="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1"></div>
                    </div>
                </div>
            `;
            const list = dropdown.querySelector('#model-list-container');
            const tabsEl = dropdown.querySelector('#model-provider-tabs');

            const renderTabs = () => {
                tabsEl.innerHTML = '';
                if (useLocalModel) return; // local models have no provider logos
                const models = getCurrentModels();
                const seen = new Set();
                const providers = [];
                models.forEach(m => {
                    const pId = m.provider || 'muapi';
                    if (!seen.has(pId)) { seen.add(pId); providers.push({ id: pId, name: m.provider_name || 'Muapi' }); }
                });
                const mkTab = (pId, pName, isAll) => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    const active = isAll ? modelProviderFilter === 'all' : modelProviderFilter === pId;
                    b.className = `w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center border transition-all ${active ? 'bg-white/10 text-yellow-400 border-yellow-500/30 scale-105 shadow-md' : 'bg-white/[0.02] text-white/50 border-white/[0.03] hover:bg-white/5 hover:text-white'}`;
                    b.title = pName;
                    if (PROVIDER_LOGOS[pId]) {
                        b.innerHTML = `<img src="${PROVIDER_LOGOS[pId]}" alt="${pName}" class="w-full h-full rounded-full object-contain ${invertLogos.includes(pId) ? 'invert' : ''}">`;
                    } else {
                        b.textContent = (pName || 'AI').substring(0, 2);
                    }
                    b.onclick = (e) => { e.stopPropagation(); modelProviderFilter = pId; renderTabs(); renderModels(); };
                    return b;
                };
                tabsEl.appendChild(mkTab('all', 'All Providers', true));
                providers.forEach(p => tabsEl.appendChild(mkTab(p.id, p.name, false)));
            };
            renderTabs();

            const renderModels = (filter = '') => {
                list.innerHTML = '';

                if (useLocalModel) {
                    // ── Local model list (Wan2GP image-capable models only) ───
                    const filtered = LOCAL_IMAGE_MODELS.filter(m =>
                        m.name.toLowerCase().includes(filter.toLowerCase()) ||
                        m.id.toLowerCase().includes(filter.toLowerCase())
                    );
                    if (filtered.length === 0) {
                        list.innerHTML = `<div class="text-xs text-muted text-center py-4">${t('common.noResults')}</div>`;
                        return;
                    }
                    filtered.forEach(m => {
                        const item = document.createElement('div');
                        item.className = `flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedLocalModel === m.id ? 'bg-white/5 border-white/5' : ''}`;
                        item.innerHTML = `
                            <div class="flex items-center gap-3.5">
                                <div class="w-10 h-10 ${m.featured ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-400'} border border-white/5 rounded-xl flex items-center justify-center font-black text-sm shadow-inner uppercase">${m.featured ? '⚡' : m.name.charAt(0)}</div>
                                <div class="flex flex-col gap-0.5">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs font-bold text-white tracking-tight">${m.name}</span>
                                        ${m.featured ? '<span class="text-[9px] font-black px-1 py-0.5 rounded bg-primary/20 text-primary">FEATURED</span>' : ''}
                                    </div>
                                    <span class="text-[10px] text-muted">${m.type.toUpperCase()} · ${m.family}</span>
                                </div>
                            </div>
                            ${selectedLocalModel === m.id ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                        `;
                        item.onclick = (e) => {
                            e.stopPropagation();
                            selectedLocalModel = m.id;
                            document.getElementById('model-btn-label').textContent = m.name;
                            selectedAr = m.aspectRatios[0];
                            document.getElementById('ar-btn-label').textContent = selectedAr;
                            qualityBtn.style.display = 'none';
                            saveSettings();
                            closeDropdown();
                        };
                        list.appendChild(item);
                    });
                    return;
                }

                // ── Remote (API) model list ───────────────────────────────────
                const q = (filter || '').toLowerCase();
                const filtered = getCurrentModels().filter(m => {
                    if (modelProviderFilter !== 'all') {
                        const pId = m.provider || 'muapi';
                        if (pId !== modelProviderFilter) return false;
                    }
                    return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
                });

                if (filtered.length === 0) {
                    list.innerHTML = `<div class="text-xs text-muted text-center py-4">${t('common.noResults')}</div>`;
                    return;
                }

                filtered.forEach(m => {
                    const logo = PROVIDER_LOGOS[m.provider]
                        ? `<img src="${PROVIDER_LOGOS[m.provider]}" alt="${m.provider_name || ''}" class="w-8 h-8 rounded-full object-contain p-1 ${invertLogos.includes(m.provider) ? 'invert' : ''}">`
                        : `<div class="w-8.5 h-8.5 ${m.family === 'kontext' ? 'bg-blue-500/10 text-blue-400' : m.family === 'effects' ? 'bg-purple-500/10 text-purple-400' : 'bg-primary/10 text-primary'} border rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase">${m.name.charAt(0)}</div>`;
                    const item = document.createElement('div');
                    item.className = `flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedModel === m.id ? 'bg-white/5 border-white/5' : ''}`;
                    item.innerHTML = `
                        <div class="flex items-center gap-3.5">
                             ${logo}
                             <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-white tracking-tight">${m.name}</span>
                                ${modelProviderFilter === 'all' && m.provider_name ? `<span class="text-[10px] text-white/40">${m.provider_name}</span>` : ''}
                             </div>
                        </div>
                        ${selectedModel === m.id ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                    `;
                    item.onclick = (e) => {
                        e.stopPropagation();
                        selectedModel = m.id;
                        selectedModelName = m.name;
                        const availableArs = getCurrentAspectRatios(selectedModel);
                        selectedAr = availableArs[0];
                        document.getElementById('model-btn-label').textContent = selectedModelName;
                        document.getElementById('ar-btn-label').textContent = selectedAr;

                        const validResolutions = getCurrentResolutions(selectedModel);
                        qualityBtn.style.display = validResolutions.length > 0 ? 'flex' : 'none';
                        if (validResolutions.length > 0) {
                            document.getElementById('quality-btn-label').textContent = validResolutions[0];
                        }

                        // Update picker's max images when switching i2i models
                        if (imageMode) {
                            picker.setMaxImages(getMaxImagesForI2IModel(selectedModel));
                            selectedEffect = '';
                            updateEffectBtn();
                            swapImageUrl = '';
                            updateSwapBtn();
                        }

                        saveSettings();
                        closeDropdown();
                    };
                    list.appendChild(item);
                });
            };

            renderModels();

            const searchInput = dropdown.querySelector('#model-search');
            searchInput.onclick = (e) => e.stopPropagation();
            searchInput.oninput = (e) => renderModels(e.target.value);

        } else if (type === 'ar') {
            dropdown.classList.add('max-w-[240px]');
            dropdown.innerHTML = `<div class="text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Aspect Ratio</div>`;
            const list = document.createElement('div');
            list.className = 'flex flex-col gap-1';

            const availableArs = getCurrentAspectRatios(selectedModel);
            availableArs.forEach(r => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group';
                item.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-6 h-6 border-2 border-white/20 rounded-md shadow-inner flex items-center justify-center group-hover:border-primary/50 transition-colors">
                             <div class="w-3 h-3 bg-white/10 rounded-sm"></div>
                        </div>
                        <span class="text-xs font-bold text-white opacity-80 group-hover:opacity-100 transition-opacity">${r}</span>
                    </div>
                     ${selectedAr === r ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                `;
                item.onclick = (e) => {
                    e.stopPropagation();
                    selectedAr = r;
                    document.getElementById('ar-btn-label').textContent = r;
                    saveSettings();
                    closeDropdown();
                };
                list.appendChild(item);
            });
            dropdown.appendChild(list);
        } else if (type === 'quality') {
            dropdown.classList.add('max-w-[200px]');
            dropdown.innerHTML = `<div class="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Resolution</div>`;
            const list = document.createElement('div');
            list.className = 'flex flex-col gap-1';

            const options = getCurrentResolutions(selectedModel);

            options.forEach(opt => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group';
                item.innerHTML = `
                    <span class="text-xs font-bold text-white opacity-80 group-hover:opacity-100">${opt}</span>
                     ${document.getElementById('quality-btn-label').textContent === opt ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                `;
                item.onclick = (e) => {
                    e.stopPropagation();
                    document.getElementById('quality-btn-label').textContent = opt;
                    saveSettings();
                    closeDropdown();
                };
                list.appendChild(item);
            });
            dropdown.appendChild(list);
        } else if (type === 'effect') {
            dropdown.classList.add('max-w-[200px]');
            dropdown.classList.remove('max-w-[240px]', 'max-w-xs', 'max-w-md');
            dropdown.innerHTML = `<div class="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Effect Type</div>`;
            const list = document.createElement('div');
            list.className = 'flex flex-col gap-1';
            const effects = getEffectsForI2IModel(selectedModel);
            effects.forEach(eff => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group';
                item.innerHTML = `
                    <span class="text-xs font-bold text-white opacity-80 group-hover:opacity-100">${eff}</span>
                    ${selectedEffect === eff ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                `;
                item.onclick = (e) => {
                    e.stopPropagation();
                    selectedEffect = eff;
                    const lbl = document.getElementById('effect-btn-label');
                    if (lbl) lbl.textContent = eff;
                    saveSettings();
                    closeDropdown();
                };
                list.appendChild(item);
            });
            dropdown.appendChild(list);
        }

        // Position dropdown
        const btnRect = anchorBtn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Horizontal position
        if (window.innerWidth < 768) {
            // Center on mobile
            dropdown.style.left = '50%';
            dropdown.style.transform = 'translateX(-50%) translate(0, 8px)';
        } else {
            // Align with button on desktop
            dropdown.style.left = `${btnRect.left - containerRect.left}px`;
            dropdown.style.transform = 'translate(0, 8px)';
        }

        // Vertical position (always above button)
        dropdown.style.bottom = `${containerRect.bottom - btnRect.top + 8}px`;
    };

    const closeDropdown = () => {
        dropdown.classList.add('opacity-0', 'pointer-events-none');
        dropdown.classList.remove('opacity-100', 'pointer-events-auto');
        dropdownOpen = null;
    };

    modelBtn.onclick = (e) => {
        e.stopPropagation();
        if (dropdownOpen === 'model') closeDropdown();
        else {
            dropdownOpen = 'model';
            showDropdown('model', modelBtn);
        }
    };

    arBtn.onclick = (e) => {
        e.stopPropagation();
        if (dropdownOpen === 'ar') closeDropdown();
        else {
            dropdownOpen = 'ar';
            showDropdown('ar', arBtn);
        }
    };

    qualityBtn.onclick = (e) => {
        e.stopPropagation();
        if (dropdownOpen === 'quality') closeDropdown();
        else {
            dropdownOpen = 'quality';
            showDropdown('quality', qualityBtn);
        }
    };

    effectBtn.onclick = (e) => {
        e.stopPropagation();
        if (dropdownOpen === 'effect') closeDropdown();
        else {
            dropdownOpen = 'effect';
            showDropdown('effect', effectBtn);
        }
    };

    window.onclick = () => closeDropdown();
    container.appendChild(dropdown);

    // ==========================================
    // 4. CANVAS AREA + HISTORY
    // ==========================================
    const generationHistory = [];

    // History gallery (Features 11/13) — responsive grid in the main flow
    const gallery = document.createElement('div');
    gallery.className = 'w-full max-w-7xl mx-auto px-2 pb-32 mt-8';
    gallery.id = 'image-gallery';
    gallery.style.display = 'none';
    const galleryGrid = document.createElement('div');
    galleryGrid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
    gallery.appendChild(galleryGrid);
    container.appendChild(gallery);

    // Fullscreen modal (Feature 13)
    const fullscreenModal = document.createElement('div');
    fullscreenModal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm hidden';
    const fsImg = document.createElement('img');
    fsImg.className = 'max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain';
    fsImg.onclick = (e) => e.stopPropagation();
    fullscreenModal.appendChild(fsImg);
    const fsClose = document.createElement('button');
    fsClose.type = 'button';
    fsClose.className = 'absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10';
    fsClose.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    fsClose.onclick = () => closeFullscreen();
    fullscreenModal.appendChild(fsClose);
    fullscreenModal.onclick = () => closeFullscreen();
    document.body.appendChild(fullscreenModal);
    function openFullscreen(url) { fsImg.src = url; fullscreenModal.classList.remove('hidden'); }
    function closeFullscreen() { fullscreenModal.classList.add('hidden'); fsImg.src = ''; }

    // Main canvas
    const canvas = document.createElement('div');
    canvas.className = 'absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-10 opacity-0 pointer-events-none transition-all duration-1000 translate-y-10 scale-95';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative group';

    const resultImg = document.createElement('img');
    resultImg.className = 'max-h-[60vh] max-w-[80vw] rounded-3xl shadow-3xl border border-white/10 interactive-glow object-contain';
    imageContainer.appendChild(resultImg);

    // Canvas Controls
    const canvasControls = document.createElement('div');
    canvasControls.className = 'mt-6 flex gap-3 opacity-0 transition-opacity delay-500 duration-500 justify-center';

    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    regenerateBtn.textContent = t('common.regenerate');

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'bg-primary text-black px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-glow active:scale-95';
    downloadBtn.textContent = t('common.download');

    const newPromptBtn = document.createElement('button');
    newPromptBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    newPromptBtn.textContent = t('common.newItem');

    canvasControls.appendChild(regenerateBtn);
    canvasControls.appendChild(downloadBtn);
    canvasControls.appendChild(newPromptBtn);

    canvas.appendChild(imageContainer);
    canvas.appendChild(canvasControls);
    container.appendChild(canvas);

    // --- Helper: Show image in canvas ---
    const showImageInCanvas = (imageUrl) => {
        // Fully hide hero and prompt
        hero.classList.add('hidden');
        promptWrapper.classList.add('hidden');

        resultImg.src = imageUrl;
        resultImg.onload = () => {
            canvas.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
            canvas.classList.add('opacity-100', 'translate-y-0', 'scale-100');
            canvasControls.classList.remove('opacity-0');
            canvasControls.classList.add('opacity-100');
        };
    };

    // --- Helper: Add to history ---
    const addToHistory = (entry) => {
        generationHistory.unshift(entry);

        // Save to localStorage
        localStorage.setItem('muapi_history', JSON.stringify(generationHistory.slice(0, 50)));

        renderHistory();
    };

    const renderHistory = () => {
        galleryGrid.innerHTML = '';
        if (generationHistory.length === 0) {
            gallery.style.display = 'none';
            return;
        }
        gallery.style.display = '';

        const svgFull = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
        const svgDown = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';
        const svgDel = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';

        generationHistory.forEach((entry, idx) => {
            const card = document.createElement('div');
            card.className = 'relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col animate-fade-in-up';

            const img = document.createElement('img');
            img.src = entry.url;
            img.alt = entry.prompt?.substring(0, 30) || 'Generated image';
            img.className = 'w-full aspect-square object-cover bg-black/40 cursor-pointer hover:opacity-80 transition-opacity';
            img.onclick = () => openFullscreen(entry.url);
            card.appendChild(img);

            // Hover actions (Feature 13: fullscreen / download / delete)
            const actions = document.createElement('div');
            actions.className = 'absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity';
            const mkBtn = (title, svg, handler) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.title = title;
                b.className = 'p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10';
                b.innerHTML = svg;
                b.onclick = (e) => { e.stopPropagation(); handler(); };
                return b;
            };
            actions.appendChild(mkBtn('Fullscreen', svgFull, () => openFullscreen(entry.url)));
            actions.appendChild(mkBtn('Download', svgDown, () => downloadImage(entry.url, `muapi-${entry.id || idx}.jpg`)));
            actions.appendChild(mkBtn('Delete', svgDel, () => {
                if (confirm('Delete this generated image?')) {
                    generationHistory.splice(idx, 1);
                    localStorage.setItem('muapi_history', JSON.stringify(generationHistory.slice(0, 50)));
                    renderHistory();
                }
            }));
            card.appendChild(actions);

            // Prompt + meta
            const meta = document.createElement('div');
            meta.className = 'p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2';
            const p = document.createElement('p');
            p.className = 'text-white/70 text-xs line-clamp-3 leading-relaxed';
            p.textContent = entry.prompt || 'No prompt provided';
            p.title = entry.prompt;
            const metaRow = document.createElement('div');
            metaRow.className = 'flex items-center justify-between mt-1';
            const modelBadge = document.createElement('span');
            modelBadge.className = 'text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20';
            modelBadge.textContent = (entry.model || '').replace('-', ' ');
            const arSpan = document.createElement('span');
            arSpan.className = 'text-[10px] text-white/40';
            arSpan.textContent = entry.aspect_ratio || '';
            metaRow.appendChild(modelBadge);
            metaRow.appendChild(arSpan);
            meta.appendChild(p);
            meta.appendChild(metaRow);
            card.appendChild(meta);

            galleryGrid.appendChild(card);
        });
    };

    // --- Helper: Download image ---
    const downloadImage = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            // Fallback: open in new tab
            window.open(url, '_blank');
        }
    };

    // Feature 14: Draw modal
    const drawModal = DrawModal({ apiKey: localStorage.getItem('muapi_key') || '', onAddHistoryItem: addToHistory });
    document.body.appendChild(drawModal.el);
    drawBtn.onclick = () => { drawModal.open(); };

    // --- Load history from localStorage ---
    try {
        const saved = JSON.parse(localStorage.getItem('muapi_history') || '[]');
        if (saved.length > 0) {
            saved.forEach(e => generationHistory.push(e));
            renderHistory();
        }
    } catch (e) { /* ignore */ }

    // --- Resume any pending image generations from a previous session ---
    (async () => {
        const pending = getPendingJobs('image');
        if (!pending.length) return;

        const apiKey = localStorage.getItem('muapi_key');
        if (!apiKey) return; // can't poll without key; jobs remain for next time

        const banner = document.createElement('div');
        banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-[#111] border border-white/10 text-white text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3';
        banner.innerHTML = `<span class="animate-spin text-primary">◌</span> <span class="banner-text">Resuming ${pending.length} pending generation${pending.length > 1 ? 's' : ''}…</span>`;
        document.body.appendChild(banner);

        let remaining = pending.length;
        pending.forEach(async (job) => {
            const elapsedAttempts = Math.floor((Date.now() - job.submittedAt) / job.interval);
            const attemptsLeft = Math.max(1, job.maxAttempts - elapsedAttempts);
            try {
                const result = await muapi.pollForResult(job.requestId, apiKey, attemptsLeft, job.interval);
                const url = result.outputs?.[0] || result.url || result.output?.url;
                if (url) {
                    addToHistory({ id: job.requestId, url, ...job.historyMeta, timestamp: new Date().toISOString() });
                }
            } catch (e) {
                console.warn('[ImageStudio] Pending job failed on resume:', job.requestId, e.message);
            } finally {
                removePendingJob(job.requestId);
                remaining--;
                if (remaining === 0) banner.remove();
                else banner.querySelector('.banner-text').textContent = `Resuming ${remaining} pending generation${remaining > 1 ? 's' : ''}…`;
            }
        });
    })();

    // --- Button Handlers ---
    downloadBtn.onclick = () => {
        const current = resultImg.src;
        if (current) {
            const entry = generationHistory.find(e => e.url === current);
            downloadImage(current, `muapi-${entry?.id || 'image'}.jpg`);
        }
    };

    regenerateBtn.onclick = () => {
        generateBtn.click();
    };

    newPromptBtn.onclick = () => {
        // Reset to prompt view
        canvas.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
        canvas.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
        canvasControls.classList.add('opacity-0');
        canvasControls.classList.remove('opacity-100');
        // Restore hero and prompt
        hero.classList.remove('hidden', 'opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
        promptWrapper.classList.remove('hidden', 'opacity-40');
        textarea.value = '';
        picker.reset();
        uploadedImageUrls = [];
        picker.setMaxImages(1);
        // Reset to t2i mode
        imageMode = false;
        selectedModel = t2iModels[0].id;
        selectedModelName = t2iModels[0].name;
        selectedAr = getAspectRatiosForModel(selectedModel)[0];
        document.getElementById('model-btn-label').textContent = selectedModelName;
        document.getElementById('ar-btn-label').textContent = selectedAr;
        const resetResolutions = getResolutionsForModel(selectedModel);
        qualityBtn.style.display = resetResolutions.length > 0 ? 'flex' : 'none';
        if (resetResolutions.length > 0) document.getElementById('quality-btn-label').textContent = resetResolutions[0];
        textarea.placeholder = t('image.placeholder');
        textarea.focus();
    };

    // ==========================================
    // 5. GENERATION LOGIC
    // ==========================================
    generateBtn.onclick = async () => {
        const prompt = textarea.value.trim();
        if (imageMode) {
            if (uploadedImageUrls.length === 0) {
                alert('Please upload a reference image first.');
                return;
            }
        } else {
            if (!prompt) {
                alert('Please enter a prompt to generate an image.');
                return;
            }
        }

        // ── Local inference path ──────────────────────────────────────────────
        if (useLocalModel) {
            const lm = getLocalModelById(selectedLocalModel);
            if (!lm) { alert('No local model selected.'); return; }

            hero.classList.add('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
            generateBtn.disabled = true;
            generateBtn.innerHTML = `<span class="animate-spin inline-block mr-2 text-black">◌</span> ${t('common.generating')}`;

            const progressWrap = document.getElementById('local-progress-wrap');
            const progressFill = document.getElementById('local-progress-fill');
            const progressPct = document.getElementById('local-progress-pct');
            progressWrap.classList.remove('hidden');
            progressWrap.classList.add('flex');

            const unsub = localAI.onProgress(({ progress, status, message }) => {
                const pct = Math.round((progress ?? 0) * 100);
                const label = message || (status === 'starting' ? 'Starting...' : `${pct}%`);
                if (progressFill) progressFill.style.width = `${pct}%`;
                if (progressPct) progressPct.textContent = label;
                generateBtn.innerHTML = `<span class="animate-spin inline-block mr-2 text-black">◌</span> ${label}`;
            });

            let hadError = false;
            try {
                const res = await localAI.generate({
                    model: selectedLocalModel,
                    prompt,
                    negative_prompt: negativePrompt || undefined,
                    aspect_ratio: selectedAr,
                    steps: steps,
                    guidance_scale: guidanceScale,
                    seed,
                });
                unsub();
                progressWrap.classList.replace('flex', 'hidden');
                progressWrap.classList.add('hidden');

                if (!res?.url) throw new Error('No output returned from local generation');
                if (res.mediaType === 'video') {
                    throw new Error('This model produces video — use the Video studio instead.');
                }
                addToHistory({
                    id: Date.now().toString(),
                    url: res.url,
                    prompt,
                    model: `local:${selectedLocalModel}`,
                    aspect_ratio: selectedAr,
                    seed: res.seed,
                    timestamp: new Date().toISOString()
                });
                showImageInCanvas(res.url);
            } catch (e) {
                hadError = true;
                unsub();
                progressWrap.classList.add('hidden');
                console.error('[Local] generation error:', e);
                hero.classList.remove('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
                console.error('[Local] full error:', e.message);
                generateBtn.innerHTML = `Error: ${e.message.slice(0, 120)}`;
                setTimeout(() => { generateBtn.innerHTML = t('common.generate'); }, 6000);
            } finally {
                generateBtn.disabled = false;
                if (!hadError) generateBtn.innerHTML = t('common.generate');
            }
            return;
        }

        // ── Remote API path ───────────────────────────────────────────────────
        const apiKey = localStorage.getItem('muapi_key');
        if (!apiKey) {
            AuthModal(() => generateBtn.click());
            return;
        }

        hero.classList.add('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
        generateBtn.disabled = true;

        let hadError = false;
        const historyMeta = { prompt, model: selectedModel, aspect_ratio: selectedAr };

        // Feature 6: one generation; called N times in parallel for batch size.
        const generateOnce = async (idx) => {
            const qualityLabel = document.getElementById('quality-btn-label')?.textContent;
            const genParams = imageMode
                ? { model: selectedModel, images_list: uploadedImageUrls, image_url: uploadedImageUrls[0], aspect_ratio: selectedAr }
                : { model: selectedModel, prompt, aspect_ratio: selectedAr };
            if (prompt) genParams.prompt = prompt;
            const qualityField = getCurrentQualityField(selectedModel);
            if (qualityField && qualityLabel) genParams[qualityField] = qualityLabel;
            // Feature 5 (effects) + Feature 7 (swap face)
            if (imageMode && selectedEffect) genParams.name = selectedEffect;
            if (imageMode && swapImageUrl) genParams.swap_url = swapImageUrl;
            let capturedRequestId = null;
            genParams.onRequestId = (rid) => {
                capturedRequestId = rid;
                savePendingJob({ requestId: rid, studioType: 'image', historyMeta, maxAttempts: 60, interval: 2000, submittedAt: Date.now() });
            };
            const res = await (imageMode ? muapi.generateI2I(genParams) : muapi.generateImage(genParams));
            if (capturedRequestId) removePendingJob(capturedRequestId);
            if (res && res.url) {
                addToHistory({
                    id: res.id || `${Date.now().toString()}-${idx}`,
                    url: res.url,
                    prompt,
                    model: selectedModel,
                    aspect_ratio: selectedAr,
                    timestamp: new Date().toISOString(),
                });
                showImageInCanvas(res.url);
                return res;
            }
            throw new Error('No image URL returned by API');
        };

        try {
            const runs = Math.max(1, batchCount || 1);
            generateBtn.innerHTML = `<span class="animate-spin inline-block mr-2 text-black">◌</span> ${t('common.generating')} ${runs}…`;
            await Promise.all(Array.from({ length: runs }, (_, i) => generateOnce(i)));
        } catch (e) {
            hadError = true;
            console.error(e);
            // Restore hero so the page doesn't look broken after a failed generation
            hero.classList.remove('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
            generateBtn.innerHTML = `Error: ${e.message.slice(0, 60)}`;
            setTimeout(() => {
                generateBtn.innerHTML = t('common.generate');
            }, 4000);
        } finally {
            generateBtn.disabled = false;
            // Only reset the label on success; the catch timeout handles the error case
            if (!hadError) generateBtn.innerHTML = t('common.generate');
        }
    };

    // Restore persisted studio settings (Feature 12)
    loadSettings();

    return container;
}
