"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  generateVideo,
  generateI2V,
  processV2V,
  uploadFile,
} from "../muapi.js";
import {
  t2vModels,
  getAspectRatiosForVideoModel,
  getDurationsForModel,
  getResolutionsForVideoModel,
  getAspectRatiosForI2VModel,
  getDurationsForI2VModel,
  getResolutionsForI2VModel,
  getEffectsForI2VModel,
  getDefaultEffectForI2VModel,
  getModesForModel,
} from "../models.js";
import {
  getFamilyVariant,
  videoModelCatalog,
  videoModelPickerEntries,
} from "../modelFamilies.js";
import {
  buildReferenceParams,
  getModelMediaCapabilities,
  shouldDisableVideoPrompt,
} from "../modelCapabilities.js";
import {
  buildSupplementalInputPayload,
  createModelParameterValues,
  getSupplementalModelInputs,
} from "../modelParameters.js";
import {
  buildVideoWorkflowMediaParams,
  getVideoWorkflowFamily,
  getVideoWorkflowMediaSlots,
  resolvePersistedVideoWorkflowSelection,
  resolveVideoBaseVariant,
  resolveVideoWorkflowVariant,
  validateVideoWorkflowMedia,
} from "../videoWorkflows.js";
import {
  buildAdvancedPayload,
  getAdvancedControlsForModel,
} from "../videoAdvancedControls.js";
import { scopedPersistKey } from "../persistKey.js";
import { formatErrorMessage } from "../utils/formatError.js";
import { readStoryboardHandoff, clearStoryboardHandoff } from "../storyboardHandoff.js";
import { getPendingRecipe, clearPendingRecipe } from "../lib/skillStore";
import { setCharacterSheet } from "../lib/characterStore";
import { fillTemplate } from "../lib/promptRecipes";
import registry from "../skills/registry.json";
import ModelParameterControls from "./ModelParameterControls.jsx";
import MobileGenerationActions, { GenerationCopyButtons } from "./MobileGenerationActions.jsx";
import UniversalMediaUploader from "./UniversalMediaUploader.jsx";
import DrawModal from "./DrawModal.jsx";
import {
  PROMPT_CONTROL_LABEL_CLASS,
  PromptAction,
  PromptAspectRatioIcon,
  PromptChevronIcon,
  PromptComposer,
  PromptControls,
  PromptDurationIcon,
  PromptFooter,
  PromptMenuItem,
  PromptMenuList,
  PromptPopover,
  PromptPopoverHeader,
  PromptQualityIcon,
  PromptTextarea,
  promptControlClassName,
} from "./prompt/PromptComposer.jsx";
import { PublishStep } from "../../../../components/SocialPublishProvider";
import { AssistStep } from "../../../../components/AiAssistantProvider";
import en from "../messages/en/videoStudio.json";
import { resolveCopy } from "../i18nUtils";

const LEGACY_MEDIA_ADVANCED_KEYS = new Set([
  "first_frame",
  "last_frame",
  "images_list",
  "videos_list",
  "audios_list",
  "reference_image_urls",
  "audio_url",
  "video_url",
  "references",
]);

function migrateLegacyVideoFrames(stored, selectedWorkflowId, setWorkflowMedia, setBaseMedia) {
  if (!selectedWorkflowId || !stored?.baseMedia) return;
  const workflowMedia = stored.workflowMedia || {};
  if (workflowMedia.startFrame?.length || workflowMedia.endFrame?.length) return;
  const baseMedia = stored.baseMedia;
  const updates = {};
  if (!workflowMedia.startFrame?.length && baseMedia.imageUrls?.[0]) {
    updates.startFrame = unique([baseMedia.imageUrls[0]]).slice(0, 1);
  }
  if (!workflowMedia.endFrame?.length && baseMedia.endImageUrl) {
    updates.endFrame = unique([baseMedia.endImageUrl]).slice(0, 1);
  }
  if (Object.keys(updates).length) {
    setWorkflowMedia((media) => ({ ...media, ...updates }));
  }
}

function unique(items) {
  return [...new Set((items || []).filter(Boolean))];
}

function downloadFile(url, filename) {
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => window.open(url, "_blank"));
}

function AdvancedField({ control, value, onChange }) {
  const common = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-[#22d3ee]/50";
  if (control.type === "boolean") {
    return (
      <label className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
        <span className="text-xs font-semibold text-white/65">{control.label}</span>
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      </label>
    );
  }
  if (control.type === "enum") {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-white/50">{control.label}</span>
        <select className={common} value={value ?? control.default ?? ""} onChange={(event) => onChange(event.target.value)}>
          {(control.enum || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  if (control.type === "textarea") {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-white/50">{control.label}</span>
        <textarea className={`${common} min-h-20 resize-y`} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  const numeric = control.type === "int" || control.type === "number";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-white/50">{control.label}</span>
      <input
        className={common}
        type={numeric ? "number" : "text"}
        min={control.min}
        max={control.max}
        step={control.step}
        value={value ?? control.default ?? ""}
        onChange={(event) => onChange(numeric ? Number(event.target.value) : event.target.value)}
      />
    </label>
  );
}

export default function VideoStudioParity({
  apiKey,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
  historyItems,
  onDeleteHistoryItem,
  droppedFiles,
  onFilesHandled,
  templateData,
  locale = "en",
}) {
  const copy = resolveCopy(en, null, locale);
  const defaultVariant = videoModelCatalog.variantById.get(t2vModels[0]?.id);
  const defaultFamily = videoModelCatalog.familyByVariantId.get(defaultVariant?.model?.id);
  const persistKey = scopedPersistKey("hg_video_studio_persistent", apiKey);

  const [selectedModel, setSelectedModel] = useState(defaultVariant?.model?.id || "");
  const [selectedFamilyId, setSelectedFamilyId] = useState(defaultFamily?.id || "");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [selectedAr, setSelectedAr] = useState(defaultVariant?.model?.inputs?.aspect_ratio?.default || "16:9");
  const [selectedDuration, setSelectedDuration] = useState(defaultVariant?.model?.inputs?.duration?.default || 5);
  const [selectedResolution, setSelectedResolution] = useState(defaultVariant?.model?.inputs?.resolution?.default || "");
  const [selectedQuality, setSelectedQuality] = useState(defaultVariant?.model?.inputs?.quality?.default || "");
  const [selectedEffect, setSelectedEffect] = useState("");
  const [selectedModeParam, setSelectedModeParam] = useState("");
  const [modelParameterValues, setModelParameterValues] = useState(() => createModelParameterValues(defaultVariant?.model));
  const [advancedValues, setAdvancedValues] = useState({});
  const [baseMedia, setBaseMedia] = useState({ imageUrls: [], endImageUrl: null, videoUrls: [], audioUrls: [] });
  const [workflowMedia, setWorkflowMedia] = useState({});
  const [localHistory, setLocalHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [generationSources, setGenerationSources] = useState({});
  const initialized = useRef(false);
  const templateApplied = useRef(null);
  const textareaRef = useRef(null);

  const selectedVariant = videoModelCatalog.variantById.get(selectedModel) || defaultVariant;
  const selectedModelObj = selectedVariant?.model;
  const selectedFamily = videoModelCatalog.familyById.get(selectedFamilyId) || defaultFamily;
  const mode = selectedVariant?.mode || "t2v";
  const capabilities = getModelMediaCapabilities(selectedModelObj);
  const workflowFamily = getVideoWorkflowFamily(selectedFamily?.id);
  const workflowMediaSlots = selectedWorkflowId
    ? getVideoWorkflowMediaSlots(selectedModelObj, selectedWorkflowId)
    : [];
  const supplementalInputs = getSupplementalModelInputs(selectedModelObj);
  const modelParameters = createModelParameterValues(selectedModelObj, modelParameterValues);
  const advancedControls = getAdvancedControlsForModel(selectedModelObj).filter(
    (control) => !LEGACY_MEDIA_ADVANCED_KEYS.has(control.key),
  );
  const history = historyItems ?? localHistory;
  const promptDisabled = shouldDisableVideoPrompt(selectedModelObj, mode);

  const aspectRatios = mode === "i2v"
    ? getAspectRatiosForI2VModel(selectedModel)
    : mode === "t2v"
      ? getAspectRatiosForVideoModel(selectedModel)
      : [];
  const durations = mode === "i2v"
    ? getDurationsForI2VModel(selectedModel)
    : mode === "t2v"
      ? getDurationsForModel(selectedModel)
      : [];
  const resolutions = mode === "i2v"
    ? getResolutionsForI2VModel(selectedModel)
    : mode === "t2v"
      ? getResolutionsForVideoModel(selectedModel)
      : [];
  const qualities = selectedModelObj?.inputs?.quality?.enum || [];
  const modes = getModesForModel(selectedModel) || [];
  const effects = mode === "i2v" ? getEffectsForI2VModel(selectedModel) : [];

  const applyVariant = useCallback((variant, workflowId = null, preserveMedia = true) => {
    if (!variant?.model) return;
    const family = videoModelCatalog.familyByVariantId.get(variant.model.id);
    setSelectedModel(variant.model.id);
    setSelectedFamilyId(family?.id || "");
    setSelectedWorkflowId(workflowId);
    setModelParameterValues((previous) => createModelParameterValues(variant.model, previous));
    setAdvancedValues({});
    const nextArs = variant.mode === "i2v" ? getAspectRatiosForI2VModel(variant.model.id) : getAspectRatiosForVideoModel(variant.model.id);
    if (nextArs.length) setSelectedAr(variant.model.inputs?.aspect_ratio?.default || nextArs[0]);
    const nextDurations = variant.mode === "i2v" ? getDurationsForI2VModel(variant.model.id) : getDurationsForModel(variant.model.id);
    if (nextDurations.length) setSelectedDuration(variant.model.inputs?.duration?.default ?? nextDurations[0]);
    const nextResolutions = variant.mode === "i2v" ? getResolutionsForI2VModel(variant.model.id) : getResolutionsForVideoModel(variant.model.id);
    setSelectedResolution(variant.model.inputs?.resolution?.default || nextResolutions[0] || "");
    setSelectedQuality(variant.model.inputs?.quality?.default || variant.model.inputs?.quality?.enum?.[0] || "");
    setSelectedModeParam(variant.model.inputs?.mode?.default || "");
    setSelectedEffect(variant.mode === "i2v" ? getDefaultEffectForI2VModel(variant.model.id) || "" : "");
    if (!preserveMedia) {
      setBaseMedia({ imageUrls: [], endImageUrl: null, videoUrls: [], audioUrls: [] });
      setWorkflowMedia({});
    }
  }, []);

  const selectFamily = (familyId) => {
    const entry = videoModelPickerEntries.find((item) => item.family.id === familyId);
    if (!entry) return;
    const preferred = entry.variantsByMode?.[mode] || entry.defaultVariant;
    applyVariant(preferred, null);
  };

  const selectMode = (nextMode) => {
    const variant = getFamilyVariant(videoModelCatalog, selectedFamily, nextMode, selectedModel);
    if (variant) applyVariant(variant, null);
  };

  const selectWorkflow = (workflowId) => {
    if (!workflowId) {
      const baseVariant = resolveVideoBaseVariant(selectedFamily.id, selectedModel) || selectedVariant;
      applyVariant(baseVariant, null);
      return;
    }
    const target = resolveVideoWorkflowVariant(selectedFamily.id, workflowId, selectedModel);
    if (!target) {
      toast.error("This workflow is not available for the selected model family.");
      return;
    }
    applyVariant(target, workflowId);
    setWorkflowMedia({});
  };

  const applyRecipe = useCallback((skill) => {
    const step = skill?.steps?.[0];
    if (!step) {
      if (skill?.description) setPrompt(skill.description);
      return;
    }
    const modelId = step.endpoint || step.model;
    const target = videoModelCatalog.variantById.get(modelId);
    if (target) applyVariant(target, null);
    if (step.aspectRatio) setSelectedAr(step.aspectRatio);
    if (step.duration) setSelectedDuration(Number(step.duration));
    if (step.resolution) setSelectedResolution(step.resolution);
    const inputValues = {};
    (skill.inputs || []).forEach((input) => { inputValues[input.name] = ""; });
    setPrompt(fillTemplate(step.prompt || skill.description || "", inputValues));
    const refs = step.references || [];
    const nextImages = [];
    let nextEnd = null;
    for (const ref of refs) {
      const item = ref && typeof ref === "object" ? ref : { url: ref };
      if (!item.url || String(item.url).startsWith("{{")) continue;
      if (item.role === "last_frame") nextEnd = item.url;
      else if (item.role === "character_sheet") {
        setCharacterSheet("video", item.url);
        nextImages.push(item.url);
      } else nextImages.push(item.url);
    }
    if (nextImages.length || nextEnd) {
      setBaseMedia((media) => ({
        ...media,
        imageUrls: unique([...media.imageUrls, ...nextImages]),
        endImageUrl: nextEnd || media.endImageUrl,
      }));
    }
  }, [applyVariant]);

  useEffect(() => {
    if (initialized.current || typeof window === "undefined") return;
    initialized.current = true;
    let restoredVariantForHandoff = null;
    try {
      const stored = JSON.parse(window.localStorage.getItem(persistKey) || "null");
      if (stored) {
        const restored = resolvePersistedVideoWorkflowSelection(
          stored.selectedModel,
          stored.selectedWorkflowId || null,
          {
            hasEndFrame: Boolean(
              stored.baseMedia?.endImageUrl ||
              stored.workflowMedia?.endFrame?.length,
            ),
          },
        );
        if (restored?.variant) {
          restoredVariantForHandoff = restored.variant;
          applyVariant(restored.variant, restored.workflowId || null);
        }
        if (stored.prompt) setPrompt(stored.prompt);
        if (stored.selectedAr) setSelectedAr(stored.selectedAr);
        if (stored.selectedDuration) setSelectedDuration(stored.selectedDuration);
        if (stored.selectedResolution) setSelectedResolution(stored.selectedResolution);
        if (stored.selectedQuality) setSelectedQuality(stored.selectedQuality);
        if (stored.selectedEffect) setSelectedEffect(stored.selectedEffect);
        if (stored.selectedModeParam) setSelectedModeParam(stored.selectedModeParam);
        if (stored.modelParameterValues) setModelParameterValues(stored.modelParameterValues);
        if (stored.advancedValues) setAdvancedValues(stored.advancedValues);
        if (stored.baseMedia) setBaseMedia(stored.baseMedia);
        if (stored.workflowMedia) setWorkflowMedia(stored.workflowMedia);
        if (stored.localHistory) setLocalHistory(stored.localHistory);
        if (stored.generationSources) setGenerationSources(stored.generationSources);
      }
    } catch (error) {
      console.warn("Failed to restore SmartVideo Video Studio:", error);
    }

    try {
      migrateLegacyVideoFrames(stored, selectedWorkflowId, setWorkflowMedia, setBaseMedia);
    } catch {
      // Migration is best-effort; ignore failures.
    }

    try {
      const handoff = readStoryboardHandoff("video");
      if (handoff) {
        if (handoff.combinedPrompt || handoff.projectName) setPrompt(handoff.combinedPrompt || handoff.projectName);
        const first = handoff.firstFrameUrl || handoff.referenceImageUrl;
        if (first) {
          const currentVariant = restoredVariantForHandoff || defaultVariant;
          const family = videoModelCatalog.familyByVariantId.get(currentVariant?.model?.id) || defaultFamily;
          const animateVariant = family
            ? resolveVideoWorkflowVariant(family.id, "animate_image", currentVariant?.model?.id)
            : null;
          if (animateVariant) {
            applyVariant(animateVariant, "animate_image");
            setWorkflowMedia((media) => ({
              ...media,
              startFrame: unique([first, ...(media.startFrame || [])]).slice(0, 1),
            }));
          } else {
            const i2vVariant = family
              ? getFamilyVariant(videoModelCatalog, family, "i2v", currentVariant?.model?.id)
              : null;
            if (i2vVariant) applyVariant(i2vVariant, null);
            setBaseMedia((media) => ({ ...media, imageUrls: unique([first, ...media.imageUrls]) }));
          }
        }
        if (handoff.aspectRatio) setSelectedAr(handoff.aspectRatio);
      }
    } catch (error) {
      console.warn("Failed to apply Storyboard handoff:", error);
    }

    const pending = getPendingRecipe("video");
    if (pending) {
      const skill = registry.skills.find((item) => item.slug === pending);
      clearPendingRecipe("video");
      if (skill) applyRecipe(skill);
    }
  }, [applyRecipe, applyVariant, defaultFamily, defaultVariant, persistKey]);

  useEffect(() => {
    if (!initialized.current || typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(persistKey, JSON.stringify({
          selectedModel,
          selectedFamilyId,
          selectedWorkflowId,
          prompt,
          selectedAr,
          selectedDuration,
          selectedResolution,
          selectedQuality,
          selectedEffect,
          selectedModeParam,
          modelParameterValues,
          advancedValues,
          baseMedia,
          workflowMedia,
          localHistory,
          generationSources,
        }));
      } catch {
        // Persistence is non-critical.
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [
    persistKey, selectedModel, selectedFamilyId, selectedWorkflowId, prompt,
    selectedAr, selectedDuration, selectedResolution, selectedQuality,
    selectedEffect, selectedModeParam, modelParameterValues, advancedValues,
    baseMedia, workflowMedia, localHistory, generationSources,
  ]);

  useEffect(() => {
    const templateId = templateData?.sourceRepo && templateData?.slug
      ? `${templateData.sourceRepo}|${templateData.slug}`
      : templateData?.slug || null;
    if (!templateData || templateApplied.current === templateId) return;
    templateApplied.current = templateId;
    if (templateData.prompt) setPrompt(templateData.prompt);
    if (templateData.aspectRatio) setSelectedAr(templateData.aspectRatio);
    if (templateData.duration) setSelectedDuration(Number(templateData.duration));
    if (templateData.model) {
      const target = videoModelCatalog.variantById.get(templateData.model);
      if (target) applyVariant(target, null);
    }
  }, [templateData, applyVariant]);

  const uploadExternalFiles = useCallback(async (files) => {
    const candidates = Array.from(files || []);
    if (!apiKey || candidates.length === 0) return;
    for (const file of candidates) {
      const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : null;
      if (!mediaType) continue;
      try {
        const url = await uploadFile(apiKey, file);
        if (selectedWorkflowId) {
          const slot = workflowMediaSlots.find((item) => item.mediaType === mediaType && item.acceptDrop !== false && (workflowMedia[item.id]?.length || 0) < item.maxItems);
          if (slot) setWorkflowMedia((media) => ({ ...media, [slot.id]: unique([...(media[slot.id] || []), url]).slice(0, slot.maxItems) }));
          continue;
        }
        if (mediaType === "image") {
          if (mode === "t2v" && selectedFamily.supports?.i2v) selectMode("i2v");
          setBaseMedia((media) => ({ ...media, imageUrls: unique([...media.imageUrls, url]).slice(0, Math.max(1, capabilities.image.maxItems || 1)) }));
        } else if (mediaType === "video") {
          if (mode !== "v2v" && selectedFamily.supports?.v2v) selectMode("v2v");
          setBaseMedia((media) => ({ ...media, videoUrls: unique([...media.videoUrls, url]).slice(0, Math.max(1, capabilities.video.maxItems || 1)) }));
        } else {
          setBaseMedia((media) => ({ ...media, audioUrls: unique([...media.audioUrls, url]).slice(0, Math.max(1, capabilities.audio.maxItems || 1)) }));
        }
      } catch (error) {
        toast.error(formatErrorMessage(error, "Media upload failed"));
      }
    }
  }, [apiKey, capabilities, mode, selectedFamily, selectedWorkflowId, workflowMedia, workflowMediaSlots]);

  useEffect(() => {
    if (!droppedFiles?.length) return;
    void uploadExternalFiles(droppedFiles).finally(() => onFilesHandled?.());
  }, [droppedFiles, onFilesHandled, uploadExternalFiles]);

  const handleBaseMediaChange = (type, urls) => {
    if (type === "image") {
      if (urls.length && mode === "t2v" && selectedFamily.supports?.i2v) selectMode("i2v");
      setBaseMedia((media) => ({ ...media, imageUrls: urls }));
    } else if (type === "video") {
      if (urls.length && mode !== "v2v" && selectedFamily.supports?.v2v) selectMode("v2v");
      setBaseMedia((media) => ({ ...media, videoUrls: urls }));
    } else if (type === "audio") {
      setBaseMedia((media) => ({ ...media, audioUrls: urls }));
    } else if (type === "end") {
      setBaseMedia((media) => ({ ...media, endImageUrl: urls[0] || null }));
    }
  };

  const addHistory = (result, requestPrompt) => {
    const requestId = result?.request_id || result?.id || Date.now().toString();
    const url = result?.url || result?.outputs?.[0] || result?.output?.url;
    if (!url) throw new Error(copy.errors.noVideoUrlReturned);
    const entry = {
      id: requestId,
      request_id: requestId,
      url,
      prompt: requestPrompt,
      model: selectedModel,
      aspect_ratio: selectedAr,
      duration: selectedDuration,
      resolution: selectedResolution,
      timestamp: new Date().toISOString(),
    };
    setLocalHistory((items) => [entry, ...items].slice(0, 40));
    setGenerationSources((sources) => ({ ...sources, [selectedFamily.id]: { requestId, modelId: selectedModel } }));
    onGenerationComplete?.({ ...entry, type: "video" });
    return entry;
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error("Add your MuAPI key before generating.");
      return;
    }
    const trimmedPrompt = prompt.trim();
    if (selectedModelObj?.promptRequired && !trimmedPrompt) {
      toast.error(copy.errors.noPromptForModel);
      return;
    }
    if (selectedWorkflowId) {
      const validation = validateVideoWorkflowMedia(selectedWorkflowId, workflowMedia, selectedModelObj);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
    } else {
      if (mode === "i2v" && baseMedia.imageUrls.length === 0) {
        toast.error(copy.errors.uploadAtLeastOneReferenceImage);
        return;
      }
      if (mode === "v2v" && baseMedia.videoUrls.length === 0) {
        toast.error(copy.errors.uploadVideoFirst);
        return;
      }
    }

    setGenerating(true);
    onGenerationStart?.();
    try {
      const mediaPayload = selectedWorkflowId
        ? buildVideoWorkflowMediaParams(selectedModelObj, selectedWorkflowId, workflowMedia)
        : buildReferenceParams(selectedModelObj, baseMedia);
      const advancedPayload = buildAdvancedPayload(advancedControls, advancedValues);
      const payload = {
        model: selectedModel,
        ...buildSupplementalInputPayload(selectedModelObj, modelParameters),
        ...advancedPayload,
        ...mediaPayload,
      };
      if (!promptDisabled && trimmedPrompt) payload.prompt = trimmedPrompt;
      if (aspectRatios.length) payload.aspect_ratio = selectedAr;
      if (durations.length) payload.duration = selectedDuration;
      if (resolutions.length && selectedResolution) payload.resolution = selectedResolution;
      if (qualities.length && selectedQuality) payload.quality = selectedQuality;
      if (modes.length && selectedModeParam) payload.mode = selectedModeParam;
      if (effects.length && selectedEffect) payload.name = selectedEffect;
      if (selectedModelObj?.requiresRequestId) {
        const source = generationSources[selectedFamily.id];
        if (!source?.requestId) throw new Error(`Create a ${selectedFamily.name} video first before using Extend.`);
        payload.request_id = source.requestId;
      }

      const result = mode === "v2v"
        ? await processV2V(apiKey, payload)
        : mode === "i2v"
          ? await generateI2V(apiKey, payload)
          : await generateVideo(apiKey, payload);
      addHistory(result, trimmedPrompt);
    } catch (error) {
      const message = formatErrorMessage(error, copy.errors.videoGenerationFailed);
      onGenerationError?.(message);
      toast.error(message);
    } finally {
      setGenerating(false);
      onGenerationEnd?.();
    }
  };

  const deleteEntry = async (entry, index) => {
    if (historyItems && onDeleteHistoryItem) await onDeleteHistoryItem(entry);
    else setLocalHistory((items) => items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addDrawReference = (entry) => {
    if (!entry?.url) return;
    if (selectedWorkflowId) {
      const slot = workflowMediaSlots.find((item) => item.mediaType === "image" && item.acceptDrop !== false);
      if (slot) setWorkflowMedia((media) => ({ ...media, [slot.id]: unique([...(media[slot.id] || []), entry.url]).slice(0, slot.maxItems) }));
      return;
    }
    handleBaseMediaChange("image", unique([...baseMedia.imageUrls, entry.url]).slice(0, Math.max(1, capabilities.image.maxItems || 1)));
  };

  const mediaSlots = selectedWorkflowId ? workflowMediaSlots : [];
  const showBaseImage = !selectedWorkflowId && (capabilities.image.maxItems > 0 || selectedFamily.supports?.i2v);
  const showBaseVideo = !selectedWorkflowId && (capabilities.video.maxItems > 0 || selectedFamily.supports?.v2v);
  const showBaseAudio = !selectedWorkflowId && capabilities.audio.maxItems > 0;
  const showEndFrame = !selectedWorkflowId && capabilities.image.separateLastItem;

  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-hidden bg-app-bg">
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />

      <div className="w-full max-w-7xl flex-1 overflow-y-auto px-3 pb-44 pt-4 custom-scrollbar">
        {history.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {history.map((entry, index) => (
              <div key={entry.id || index} className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-xl">
                <video src={entry.url} controls className="aspect-video w-full bg-black object-cover" />
                <div className="absolute right-2 top-2 hidden flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
                  <GenerationCopyButtons prompt={entry.prompt} onCopyError={onGenerationError} />
                  <button type="button" onClick={() => downloadFile(entry.url, `video-${entry.id || index}.mp4`)} className="rounded-full border border-white/10 bg-black/65 p-2 text-white hover:bg-[#22d3ee] hover:text-black">↓</button>
                  <PublishStep mediaUrl={entry.url} mediaType="video" title={entry.prompt?.substring(0, 50) || "Generated video"} className="flex items-center justify-center rounded-full border border-white/10 bg-black/65 p-2 text-white hover:bg-[#22d3ee] hover:text-black" />
                  <AssistStep assetUrl={entry.url} assetType="video" onApply={() => {}} className="flex items-center justify-center rounded-full border border-white/10 bg-black/65 p-2 text-white hover:bg-[#22d3ee] hover:text-black" />
                  <button type="button" onClick={() => deleteEntry(entry, index)} className="rounded-full border border-red-500/20 bg-black/65 p-2 text-red-400 hover:bg-red-500 hover:text-white">×</button>
                </div>
                <MobileGenerationActions
                  prompt={entry.prompt}
                  onCopyError={onGenerationError}
                  actions={[
                    { kind: "download", label: copy.gallery.download, onSelect: () => downloadFile(entry.url, `video-${entry.id || index}.mp4`) },
                    { kind: "delete", label: copy.gallery.delete, danger: true, onSelect: () => deleteEntry(entry, index) },
                  ]}
                />
                <button type="button" onClick={() => setFullscreenUrl(entry.url)} className="w-full p-3 text-left">
                  <p className="line-clamp-2 text-xs text-white/65">{entry.prompt || copy.gallery.noPromptProvided}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/35">
                    <span className="rounded bg-[#22d3ee]/10 px-2 py-0.5 font-bold text-[#22d3ee]">{entry.model}</span>
                    {entry.duration && <span>{entry.duration}s</span>}
                    {entry.resolution && <span>{entry.resolution}</span>}
                  </div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[48vh] flex-col items-center justify-center text-center">
            <div className="mb-5 rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#22d3ee]">SmartVideo workflow engine</div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">{selectedFamily?.name || "Video Studio"}</h1>
            <p className="mt-3 max-w-xl text-sm text-white/40">Text-to-video, image animation, start/end frames, references, video editing, extension and motion transfer use the same model-aware media system.</p>
          </div>
        )}
      </div>

      <PromptComposer>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start gap-3">
            {selectedWorkflowId && mediaSlots.map((slot) => (
              <UniversalMediaUploader
                key={slot.id}
                apiKey={apiKey}
                slot={{ ...slot, role: slot.id }}
                values={workflowMedia[slot.id] || []}
                onChange={(urls) => setWorkflowMedia((media) => ({ ...media, [slot.id]: urls }))}
                disabled={generating}
              />
            ))}
            {showBaseImage && (
              <UniversalMediaUploader apiKey={apiKey} slot={{ id: "referenceImages", role: "reference_image", mediaType: "image", label: mode === "i2v" ? "First / Reference" : "Reference Image", maxItems: Math.max(1, capabilities.image.maxItems || 1) }} values={baseMedia.imageUrls} onChange={(urls) => handleBaseMediaChange("image", urls)} disabled={generating} />
            )}
            {showEndFrame && (
              <UniversalMediaUploader apiKey={apiKey} slot={{ id: "endFrame", role: "last_frame", mediaType: "image", label: "Last Frame", maxItems: 1 }} values={baseMedia.endImageUrl ? [baseMedia.endImageUrl] : []} onChange={(urls) => handleBaseMediaChange("end", urls)} disabled={generating} />
            )}
            {showBaseVideo && (
              <UniversalMediaUploader apiKey={apiKey} slot={{ id: "referenceVideos", role: "reference_video", mediaType: "video", label: "Reference Video", maxItems: Math.max(1, capabilities.video.maxItems || 1) }} values={baseMedia.videoUrls} onChange={(urls) => handleBaseMediaChange("video", urls)} disabled={generating} />
            )}
            {showBaseAudio && (
              <UniversalMediaUploader apiKey={apiKey} slot={{ id: "referenceAudios", role: "reference_audio", mediaType: "audio", label: "Reference Audio", maxItems: Math.max(1, capabilities.audio.maxItems || 1) }} values={baseMedia.audioUrls} onChange={(urls) => handleBaseMediaChange("audio", urls)} disabled={generating} />
            )}
          </div>

          <PromptTextarea
            ref={textareaRef}
            value={prompt}
            disabled={promptDisabled}
            onChange={(event) => {
              setPrompt(event.target.value);
              clearStoryboardHandoff();
            }}
            placeholder={promptDisabled ? "This workflow does not require a prompt" : copy.placeholders.describeVideo}
          />
        </div>

        <PromptFooter>
          <PromptControls>
            <div className="relative">
              <button type="button" onClick={() => setOpenDropdown(openDropdown === "model" ? null : "model")} className={promptControlClassName({ active: openDropdown === "model" })}>
                <span className={PROMPT_CONTROL_LABEL_CLASS}>{selectedFamily?.name || "Model"}</span><PromptChevronIcon />
              </button>
              {openDropdown === "model" && (
                <PromptPopover className="w-[min(420px,calc(100vw-2rem))] max-h-[60vh]" onClick={(event) => event.stopPropagation()}>
                  <PromptPopoverHeader>{copy.dropdowns.model}</PromptPopoverHeader>
                  <input className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none" placeholder="Search model families..." onChange={(event) => {
                    const query = event.target.value.toLowerCase();
                    event.currentTarget.parentElement.querySelectorAll("[data-family]").forEach((node) => { node.style.display = node.dataset.search.includes(query) ? "flex" : "none"; });
                  }} />
                  <PromptMenuList>
                    {videoModelPickerEntries.map((entry) => (
                      <PromptMenuItem key={entry.family.id} data-family="true" data-search={entry.searchText} selected={entry.family.id === selectedFamilyId} onClick={() => { selectFamily(entry.family.id); setOpenDropdown(null); }}>{entry.name}</PromptMenuItem>
                    ))}
                  </PromptMenuList>
                </PromptPopover>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
              {["t2v", "i2v", "v2v"].filter((item) => selectedFamily?.supports?.[item]).map((item) => (
                <button key={item} type="button" onClick={() => selectMode(item)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase ${mode === item && !selectedWorkflowId ? "bg-[#22d3ee] text-black" : "text-white/45 hover:text-white"}`}>{item.replace("2", "→")}</button>
              ))}
            </div>

            {workflowFamily?.workflows?.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setOpenDropdown(openDropdown === "workflow" ? null : "workflow")} className={promptControlClassName({ active: openDropdown === "workflow" })}>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>{workflowFamily.workflowById.get(selectedWorkflowId)?.label || "Workflow"}</span><PromptChevronIcon />
                </button>
                {openDropdown === "workflow" && (
                  <PromptPopover className="min-w-[220px]" onClick={(event) => event.stopPropagation()}>
                    <PromptPopoverHeader>{copy.dropdowns.source}</PromptPopoverHeader>
                    <PromptMenuList>
                      <PromptMenuItem selected={!selectedWorkflowId} onClick={() => { selectWorkflow(null); setOpenDropdown(null); }}>Base generation</PromptMenuItem>
                      {workflowFamily.workflows.map((workflow) => <PromptMenuItem key={workflow.id} selected={selectedWorkflowId === workflow.id} onClick={() => { selectWorkflow(workflow.id); setOpenDropdown(null); }}>{workflow.label}</PromptMenuItem>)}
                    </PromptMenuList>
                  </PromptPopover>
                )}
              </div>
            )}

            <ModelParameterControls inputs={supplementalInputs} values={modelParameters} onChange={(key, value) => setModelParameterValues((values) => ({ ...values, [key]: value }))} open={openDropdown === "parameters"} onToggle={() => setOpenDropdown(openDropdown === "parameters" ? null : "parameters")} />

            {aspectRatios.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setOpenDropdown(openDropdown === "ar" ? null : "ar")} className={promptControlClassName({ active: openDropdown === "ar" })}><PromptAspectRatioIcon /><span className={PROMPT_CONTROL_LABEL_CLASS}>{selectedAr}</span></button>
                {openDropdown === "ar" && <PromptPopover><PromptPopoverHeader>{copy.dropdowns.aspectRatio}</PromptPopoverHeader><PromptMenuList>{aspectRatios.map((value) => <PromptMenuItem key={value} selected={selectedAr === value} onClick={() => { setSelectedAr(value); setOpenDropdown(null); }}>{value}</PromptMenuItem>)}</PromptMenuList></PromptPopover>}
              </div>
            )}

            {durations.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setOpenDropdown(openDropdown === "duration" ? null : "duration")} className={promptControlClassName({ active: openDropdown === "duration" })}><PromptDurationIcon /><span className={PROMPT_CONTROL_LABEL_CLASS}>{selectedDuration}s</span></button>
                {openDropdown === "duration" && <PromptPopover><PromptPopoverHeader>{copy.dropdowns.duration}</PromptPopoverHeader><PromptMenuList>{durations.map((value) => <PromptMenuItem key={value} selected={selectedDuration === value} onClick={() => { setSelectedDuration(value); setOpenDropdown(null); }}>{value}s</PromptMenuItem>)}</PromptMenuList></PromptPopover>}
              </div>
            )}

            {resolutions.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setOpenDropdown(openDropdown === "resolution" ? null : "resolution")} className={promptControlClassName({ active: openDropdown === "resolution" })}><PromptQualityIcon /><span className={PROMPT_CONTROL_LABEL_CLASS}>{selectedResolution || resolutions[0]}</span></button>
                {openDropdown === "resolution" && <PromptPopover><PromptPopoverHeader>{copy.dropdowns.resolution}</PromptPopoverHeader><PromptMenuList>{resolutions.map((value) => <PromptMenuItem key={value} selected={selectedResolution === value} onClick={() => { setSelectedResolution(value); setOpenDropdown(null); }}>{value}</PromptMenuItem>)}</PromptMenuList></PromptPopover>}
              </div>
            )}

            {qualities.length > 0 && (
              <select value={selectedQuality} onChange={(event) => setSelectedQuality(event.target.value)} className="h-[38px] rounded-md border border-white/[0.06] bg-[#16161a]/60 px-3 text-xs font-semibold text-white/70 outline-none">
                {qualities.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            )}
            {modes.length > 0 && (
              <select value={selectedModeParam} onChange={(event) => setSelectedModeParam(event.target.value)} className="h-[38px] rounded-md border border-white/[0.06] bg-[#16161a]/60 px-3 text-xs font-semibold text-white/70 outline-none">
                {modes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            )}
            {effects.length > 0 && (
              <select value={selectedEffect} onChange={(event) => setSelectedEffect(event.target.value)} className="h-[38px] max-w-[160px] rounded-md border border-white/[0.06] bg-[#16161a]/60 px-3 text-xs font-semibold text-white/70 outline-none">
                {effects.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            )}

            {advancedControls.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setOpenDropdown(openDropdown === "advanced" ? null : "advanced")} className={promptControlClassName({ active: openDropdown === "advanced" })}><span className={PROMPT_CONTROL_LABEL_CLASS}>Advanced</span><PromptChevronIcon /></button>
                {openDropdown === "advanced" && (
                  <PromptPopover className="w-[min(430px,calc(100vw-2rem))] max-h-[60vh]" onClick={(event) => event.stopPropagation()}>
                    <PromptPopoverHeader>SmartVideo advanced controls</PromptPopoverHeader>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {advancedControls.map((control) => <AdvancedField key={control.key} control={control} value={advancedValues[control.key] ?? control.default} onChange={(value) => setAdvancedValues((values) => ({ ...values, [control.key]: value }))} />)}
                    </div>
                  </PromptPopover>
                )}
              </div>
            )}

            {(capabilities.image.maxItems > 0 || selectedFamily?.supports?.i2v) && (
              <button type="button" onClick={() => setIsDrawModalOpen(true)} className={promptControlClassName()}><span className={PROMPT_CONTROL_LABEL_CLASS}>{copy.controls.draw}</span></button>
            )}
          </PromptControls>

          <PromptAction onClick={handleGenerate} disabled={generating}>
            {generating ? copy.controls.generating : copy.controls.generate}
          </PromptAction>
        </PromptFooter>
      </PromptComposer>

      {fullscreenUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={() => setFullscreenUrl(null)}>
          <video src={fullscreenUrl} controls autoPlay loop className="max-h-[95vh] max-w-[95vw] rounded-2xl" onClick={(event) => event.stopPropagation()} />
          <button type="button" className="absolute right-6 top-6 rounded-full bg-white/10 px-4 py-2 text-white" onClick={() => setFullscreenUrl(null)}>×</button>
        </div>
      )}

      <DrawModal isOpen={isDrawModalOpen} onClose={() => setIsDrawModalOpen(false)} apiKey={apiKey} batchSize={1} onAddHistoryItem={addDrawReference} />
    </div>
  );
}
