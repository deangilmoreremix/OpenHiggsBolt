"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { generateImage } from "../muapi.js";

// Layout Definition: Tabs -> Sub-categories -> Options
const TABS_CONFIG = {
  face: {
    label: "Face",
    subcategories: [
      {
        id: "species",
        label: "Species",
        options: [
          { id: "human", label: "Human", img: "/assets/influencer/option_human_49.webp", promptVal: "human features" },
          { id: "elf", label: "Elf", img: "/assets/influencer/option_elf_64.webp", promptVal: "elf with pointed ears" },
          { id: "alien", label: "Alien", img: "/assets/influencer/option_alien_7.webp", promptVal: "alien creature" },
          { id: "amphibian", label: "Amphibian", img: "/assets/influencer/option_amphibian_10.webp", promptVal: "amphibian humanoid" },
          { id: "reptile", label: "Reptile", img: "/assets/influencer/option_reptile_50.webp", promptVal: "reptilian creature" },
          { id: "mantis", label: "Mantis", img: "/assets/influencer/option_mantis_12.webp", promptVal: "mantis hybrid character" },
          { id: "bee", label: "Bee", img: "/assets/influencer/option_bee_2.webp", promptVal: "bee insect hybrid character" },
          { id: "octopus", label: "Octopus", img: "/assets/influencer/option_octopus_3.webp", promptVal: "aquatic octopus hybrid" },
          { id: "crocodile", label: "Crocodile", img: "/assets/influencer/option_crocodile_4.webp", promptVal: "crocodile humanoid" },
          { id: "iguana", label: "Iguana", img: "/assets/influencer/option_iguana_5.webp", promptVal: "iguana humanoid" },
          { id: "lizard", label: "Lizard", img: "/assets/influencer/option_lizard_6.webp", promptVal: "lizard humanoid" },
          { id: "beetle", label: "Beetle", img: "/assets/influencer/option_beetle_8.webp", promptVal: "beetle humanoid" },
          { id: "ant", label: "Ant", img: "/assets/influencer/option_ant_1.webp", promptVal: "ant hybrid character" },
        ]
      },
      {
        id: "gender",
        label: "Gender",
        options: [
          { id: "female", label: "Female", img: "/assets/influencer/option_female_13.webp", promptVal: "female" },
          { id: "male", label: "Male", img: "/assets/influencer/option_male_14.webp", promptVal: "male" },
          { id: "non_binary", label: "Non-Binary", img: "/assets/influencer/option_non_binary_17.webp", promptVal: "non-binary character" },
          { id: "trans_man", label: "Trans Man", img: "/assets/influencer/option_trans_man_15.webp", promptVal: "transgender man" },
          { id: "trans_woman", label: "Trans Woman", img: "/assets/influencer/option_trans_woman_16.webp", promptVal: "transgender woman" }
        ]
      },
      {
        id: "ethnicity",
        label: "Ethnicity / Vibe",
        options: [
          { id: "african", label: "African", img: "/assets/influencer/option_african_18.webp", promptVal: "african heritage" },
          { id: "asian", label: "Asian", img: "/assets/influencer/option_asian_19.webp", promptVal: "east asian heritage" },
          { id: "european", label: "European", img: "/assets/influencer/option_european_20.webp", promptVal: "european heritage" },
          { id: "indian", label: "Indian", img: "/assets/influencer/option_indian_21.webp", promptVal: "south asian indian heritage" },
          { id: "middle_eastern", label: "Middle Eastern", img: "/assets/influencer/option_middle_eastern_22.webp", promptVal: "middle eastern heritage" },
          { id: "mixed", label: "Mixed", img: "/assets/influencer/option_mixed_23.webp", promptVal: "multiracial mixed heritage" }
        ]
      },
      {
        id: "eye_color",
        label: "Eye Color",
        options: [
          { id: "blue", label: "Blue", img: "/assets/influencer/option_blue_33.webp", promptVal: "striking blue eyes" },
          { id: "brown", label: "Brown", img: "/assets/influencer/option_brown_29.webp", promptVal: "warm brown eyes" },
          { id: "green", label: "Green", img: "/assets/influencer/option_green_27.webp", promptVal: "emerald green eyes" },
          { id: "amber", label: "Amber", img: "/assets/influencer/option_amber_34.webp", promptVal: "amber eyes" },
          { id: "grey", label: "Grey", img: "/assets/influencer/option_grey_36.webp", promptVal: "grey eyes" },
          { id: "red", label: "Red", img: "/assets/influencer/option_red_35.webp", promptVal: "red eyes" },
          { id: "purple", label: "Purple", img: "/assets/influencer/option_purple_26.webp", promptVal: "violet eyes" },
          { id: "black", label: "Black", img: "/assets/influencer/option_black_25.webp", promptVal: "black eyes" },
          { id: "deep_brown", label: "Deep Brown", img: "/assets/influencer/option_deep_brown_32.webp", promptVal: "deep brown eyes" },
          { id: "white", label: "White", img: "/assets/influencer/option_white_28.webp", promptVal: "white eyes" },
          { id: "mixed_colors", label: "Heterochromia", img: "/assets/influencer/option_mixed_colors_24.webp", promptVal: "heterochromia eyes" },
          { id: "black_solid_void", label: "Solid Void", img: "/assets/influencer/option_black__solid_void__30.webp", promptVal: "solid black void eyes" },
          { id: "white_blind_empty", label: "Blind Empty", img: "/assets/influencer/option_white__blind_empty__31.webp", promptVal: "blind empty white eyes" }
        ]
      },
      {
        id: "ears_horns",
        label: "Ears & Horns",
        options: [
          { id: "normal_ears", label: "Normal Ears", img: "/assets/influencer/option_human_63.webp", promptVal: "normal ears" },
          { id: "elf_ears", label: "Elf Ears", img: "/assets/influencer/option_elf_64.webp", promptVal: "pointed elf ears" },
          { id: "no_ears", label: "No Ears", img: "/assets/influencer/option_no_ears_65.webp", promptVal: "no ears visible" },
          { id: "wing_ears", label: "Wing Ears", img: "/assets/influencer/option_wing_ears_66.webp", promptVal: "wing-like ears" },
          { id: "small_horns", label: "Small Horns", img: "/assets/influencer/option_small_horns_67.webp", promptVal: "small horns on forehead" },
          { id: "big_horns", label: "Big Horns", img: "/assets/influencer/option_big_horns_68.webp", promptVal: "large horns curving backward" },
          { id: "antlers", label: "Antlers", img: "/assets/influencer/option_antlers_69.webp", promptVal: "deer antlers" }
        ]
      },
      {
        id: "eye_details",
        label: "Eye Features",
        options: [
          { id: "normal_eyes", label: "Normal Eyes", img: "/assets/influencer/option_blue_33.webp", promptVal: "standard eyes" },
          { id: "different_eye_colors", label: "Heterochromia Vibe", img: "/assets/influencer/option_different_eye_colors_52.webp", promptVal: "different eye colors" },
          { id: "blind_eye", label: "Blind Eye", img: "/assets/influencer/option_blind_eye_53.webp", promptVal: "one cloudy blind eye" },
          { id: "scarred_eye", label: "Scarred Eye", img: "/assets/influencer/option_scarred_eye_54.webp", promptVal: "scar running across one eye" },
          { id: "glowing_eye", label: "Glowing Eye", img: "/assets/influencer/option_glowing_eye_55.webp", promptVal: "glowing magical eyes" }
        ]
      },
      {
        id: "mouth_teeth",
        label: "Mouth & Teeth",
        options: [
          { id: "normal_mouth", label: "Normal Mouth", img: "/assets/influencer/option_human_63.webp", promptVal: "standard mouth" },
          { id: "small_mouth", label: "Small Mouth", img: "/assets/influencer/option_small_mouth_56.webp", promptVal: "small delicate mouth" },
          { id: "large_mouth", label: "Large Mouth", img: "/assets/influencer/option_large_mouth_57.webp", promptVal: "wide expressive mouth" },
          { id: "no_teeth", label: "No Teeth", img: "/assets/influencer/option_no_teeth_58.webp", promptVal: "no visible teeth" },
          { id: "different_teeth", label: "Unique Teeth", img: "/assets/influencer/option_different_teeth_59.webp", promptVal: "unusual tooth structure" },
          { id: "sharp_teeth", label: "Sharp Teeth", img: "/assets/influencer/option_sharp_teeth_60.webp", promptVal: "sharp predatory fangs" }
        ]
      },
      {
        id: "tongue",
        label: "Tongue",
        options: [
          { id: "normal_tongue", label: "Normal", img: "/assets/influencer/option_human_63.webp", promptVal: "normal tongue" },
          { id: "forked_tongue", label: "Forked", img: "/assets/influencer/option_forked_tongue_61.webp", promptVal: "reptilian forked tongue" },
          { id: "two_tongues", label: "Two Tongues", img: "/assets/influencer/option_two_tongues_62.webp", promptVal: "two separate tongues" }
        ]
      }
    ]
  },
  body: {
    label: "Body",
    subcategories: [
      {
        id: "skin_patterns",
        label: "Skin Patterns & Texture",
        options: [
          { id: "human_skin", label: "Human", img: "/assets/influencer/option_human_skin_70.webp", promptVal: "smooth skin textures" },
          { id: "scales", label: "Scales", img: "/assets/influencer/option_scales_71.webp", promptVal: "shimmering scales" },
          { id: "fur", label: "Fur", img: "/assets/influencer/option_fur_72.webp", promptVal: "covered in soft fine fur" },
          { id: "amphibian_skin", label: "Amphibian", img: "/assets/influencer/option_amphibian_skin_73.webp", promptVal: "smooth moist amphibian skin" },
          { id: "fish_skin", label: "Fish Skin", img: "/assets/influencer/option_fish_skin_74.webp", promptVal: "iridescent fish scales skin" },
          { id: "metallic", label: "Metallic", img: "/assets/influencer/option_metallic_75.webp", promptVal: "polished reflective metallic skin" },
          { id: "solid", label: "Solid Color", img: "/assets/influencer/option_solid_76.webp", promptVal: "solid artificial skin tone" },
          { id: "stripes", label: "Stripes", img: "/assets/influencer/option_stripes_77.webp", promptVal: "exotic striped skin patterns" },
          { id: "spots", label: "Spots", img: "/assets/influencer/option_spots_78.webp", promptVal: "dappled spots skin pattern" },
          { id: "chess_pattern", label: "Chess Pattern", img: "/assets/influencer/option_chess_pattern_79.webp", promptVal: "checkerboard skin markings" },
          { id: "veins_visible", label: "Veins Visible", img: "/assets/influencer/option_veins_visible_80.webp", promptVal: "translucent skin with visible neon veins" },
          { id: "giraffe_pattern", label: "Giraffe Pattern", img: "/assets/influencer/option_giraffe_pattern_81.webp", promptVal: "giraffe print skin markings" },
          { id: "cowhide_pattern", label: "Cowhide Pattern", img: "/assets/influencer/option_cowhide_pattern_82.webp", promptVal: "black and white cowhide skin markings" }
        ]
      },
      {
        id: "body_shape",
        label: "Body Build",
        options: [
          { id: "normal", label: "Standard", img: "/assets/influencer/option_human_skin_70.webp", promptVal: "average build" },
          { id: "slim", label: "Slim", img: "/assets/influencer/option_slim_83.webp", promptVal: "slim slender physique" },
          { id: "lean", label: "Lean", img: "/assets/influencer/option_lean_84.webp", promptVal: "lean toned physique" },
          { id: "athletic", label: "Athletic", img: "/assets/influencer/option_athletic_85.webp", promptVal: "fit athletic body build" },
          { id: "muscular", label: "Muscular", img: "/assets/influencer/option_muscular_86.webp", promptVal: "strong muscular body build" },
          { id: "curvy", label: "Curvy", img: "/assets/influencer/option_curvy_87.webp", promptVal: "curvy body build" },
          { id: "heavy", label: "Heavy", img: "/assets/influencer/option_heavy_88.webp", promptVal: "robust heavier body build" },
          { id: "skinny", label: "Skinny", img: "/assets/influencer/option_skinny_89.webp", promptVal: "very thin skinny body build" }
        ]
      },
      {
        id: "left_arm",
        label: "Left Arm Style",
        options: [
          { id: "normal_arm", label: "Normal", img: "/assets/influencer/option_normal_arm_90.webp", promptVal: "normal left arm" },
          { id: "cute_arm", label: "Stylized", img: "/assets/influencer/option_cute_arm_91.webp", promptVal: "cute organic left arm design" },
          { id: "robotic_arm", label: "Robotic", img: "/assets/influencer/option_robotic_arm_92.webp", promptVal: "robotic cybernetic left arm" },
          { id: "prosthetic_arm", label: "Prosthetic", img: "/assets/influencer/option_prosthetic_arm_93.webp", promptVal: "sleek prosthetic left arm" },
          { id: "mechanical_arm", label: "Mechanical", img: "/assets/influencer/option_mechanical_arm_94.webp", promptVal: "intricate mechanical left arm" },
          { id: "none", label: "None", img: "/assets/influencer/option_none_95.webp", promptVal: "missing left arm" }
        ]
      },
      {
        id: "right_arm",
        label: "Right Arm Style",
        options: [
          { id: "normal_arm", label: "Normal", img: "/assets/influencer/option_normal_arm_96.webp", promptVal: "normal right arm" },
          { id: "cute_arm", label: "Stylized", img: "/assets/influencer/option_cute_arm_97.webp", promptVal: "cute organic right arm design" },
          { id: "robotic_arm", label: "Robotic", img: "/assets/influencer/option_robotic_arm_98.webp", promptVal: "robotic cybernetic right arm" },
          { id: "prosthetic_arm", label: "Prosthetic", img: "/assets/influencer/option_prosthetic_arm_99.webp", promptVal: "sleek prosthetic right arm" },
          { id: "mechanical_arm", label: "Mechanical", img: "/assets/influencer/option_mechanical_arm_100.webp", promptVal: "intricate mechanical right arm" },
          { id: "none", label: "None", img: "/assets/influencer/option_none_101.webp", promptVal: "missing right arm" }
        ]
      },
      {
        id: "left_leg",
        label: "Left Leg Style",
        options: [
          { id: "normal_leg", label: "Normal", img: "/assets/influencer/option_normal_leg_102.webp", promptVal: "normal left leg" },
          { id: "cute_leg", label: "Stylized", img: "/assets/influencer/option_cute_leg_103.webp", promptVal: "cute organic left leg design" },
          { id: "robotic_leg", label: "Robotic", img: "/assets/influencer/option_robotic_leg_104.webp", promptVal: "robotic cybernetic left leg" },
          { id: "prosthetic_leg", label: "Prosthetic", img: "/assets/influencer/option_prosthetic_leg_105.webp", promptVal: "sleek prosthetic left leg" },
          { id: "mechanical_leg", label: "Mechanical", img: "/assets/influencer/option_mechanical_leg_106.webp", promptVal: "intricate mechanical left leg" },
          { id: "none", label: "None", img: "/assets/influencer/option_none_107.webp", promptVal: "missing left leg" }
        ]
      },
      {
        id: "right_leg",
        label: "Right Leg Style",
        options: [
          { id: "normal_leg", label: "Normal", img: "/assets/influencer/option_normal_leg_108.webp", promptVal: "normal right leg" },
          { id: "cute_leg", label: "Stylized", img: "/assets/influencer/option_cute_leg_109.webp", promptVal: "cute organic right leg design" },
          { id: "robotic_leg", label: "Robotic", img: "/assets/influencer/option_robotic_leg_110.webp", promptVal: "robotic cybernetic right leg" },
          { id: "prosthetic_leg", label: "Prosthetic", img: "/assets/influencer/option_prosthetic_leg_111.webp", promptVal: "sleek prosthetic right leg" },
          { id: "mechanical_leg", label: "Mechanical", img: "/assets/influencer/option_mechanical_leg_112.webp", promptVal: "intricate mechanical right leg" },
          { id: "none", label: "None", img: "/assets/influencer/option_none_113.webp", promptVal: "missing right leg" }
        ]
      }
    ]
  },
  style: {
    label: "Style",
    subcategories: [
      {
        id: "hair_style",
        label: "Hair / Head Growth",
        options: [
          { id: "long_hair", label: "Long Hair", img: "/assets/influencer/option_long_hair_116.webp", promptVal: "long styled haircut" },
          { id: "short_hair", label: "Short Hair", img: "/assets/influencer/option_short_hair_115.webp", promptVal: "short modern hair" },
          { id: "bald", label: "Bald", img: "/assets/influencer/option_bald_114.webp", promptVal: "bald head" },
          { id: "afro", label: "Afro", img: "/assets/influencer/option_afro_117.webp", promptVal: "afro hair" },
          { id: "punk_hairstyle", label: "Punk Style", img: "/assets/influencer/option_punk_hairstyle_118.webp", promptVal: "punk haircut" },
          { id: "fur", label: "Fur Style", img: "/assets/influencer/option_fur_119.webp", promptVal: "fur elements" },
          { id: "tentacles", label: "Tentacles", img: "/assets/influencer/option_tentacles_120.webp", promptVal: "tentacle strands" },
          { id: "spines", label: "Spines", img: "/assets/influencer/option_spines_121.webp", promptVal: "spiky spines" }
        ]
      },
      {
        id: "skin_details",
        label: "Skin Details",
        options: [
          { id: "freckles", label: "Freckles", img: "/assets/influencer/freckles_39.webp", promptVal: "freckled skin" },
          { id: "vitiligo", label: "Vitiligo", img: "/assets/influencer/vitiligo_37.webp", promptVal: "vitiligo skin patterns" },
          { id: "pigmentation", label: "Pigmentation", img: "/assets/influencer/pigmentation_38.webp", promptVal: "pigmented skin spots" },
          { id: "birthmarks", label: "Birthmarks", img: "/assets/influencer/birthmarks_40.webp", promptVal: "skin birthmarks" },
          { id: "scars", label: "Scars", img: "/assets/influencer/scars_41.webp", promptVal: "healed scars" },
          { id: "burns", label: "Burns", img: "/assets/influencer/burns_42.webp", promptVal: "burn skin textures" },
          { id: "albinism", label: "Albinism", img: "/assets/influencer/albinism_43.webp", promptVal: "albinism pale skin tone" },
          { id: "cracked_dry_skin", label: "Cracked / Dry", img: "/assets/influencer/cracked___dry_skin_44.webp", promptVal: "cracked dry skin" },
          { id: "wrinkled_skin", label: "Wrinkled", img: "/assets/influencer/wrinkled_skin_45.webp", promptVal: "wrinkled aging skin" }
        ]
      },
      {
        id: "body_marks",
        label: "Markings & Details",
        options: [
          { id: "tattoos", label: "Tattoos", img: "/assets/influencer/option_tattoos_122.webp", promptVal: "tattoos on body" },
          { id: "piercing", label: "Piercings", img: "/assets/influencer/option_piercing_123.webp", promptVal: "metallic body piercings" },
          { id: "scarification", label: "Scarification", img: "/assets/influencer/option_scarification_124.webp", promptVal: "scarification skin markings" },
          { id: "symbols_markings", label: "Symbols / Markings", img: "/assets/influencer/option_symbols___markings_125.webp", promptVal: "symbolic markings" },
          { id: "cyber_markings", label: "Cyber Markings", img: "/assets/influencer/option_cyber_markings_126.webp", promptVal: "cybernetic markings" }
        ]
      },
      {
        id: "art_style",
        label: "Art Style & Camera",
        options: [
          { id: "hyper_realistic", label: "Hyper-Realistic", img: "/assets/influencer/option_hyper_realistic_127.webp", promptVal: "photorealistic, hyper-detailed skin pores, real photo, 8k resolution, shot on 35mm film" },
          { id: "anime", label: "Anime / Cel Shaded", img: "/assets/influencer/option_anime_128.webp", promptVal: "digital anime illustration, key art style, clean linework" },
          { id: "cartoon", label: "3D Cartoon", img: "/assets/influencer/option_cartoon_129.webp", promptVal: "3D cartoon movie style render, soft lighting, Pixar vibe" },
          { id: "2d_illustration", label: "2D Illustration", img: "/assets/influencer/option_2d_illustration_130.webp", promptVal: "flat 2D illustration design, vector graphic style, concept art" }
        ]
      }
    ]
  }
};

export default function AiInfluencerStudio({ apiKey }) {
  const PERSIST_KEY = "hg_ai_influencer_studio_persistent_v2";

  // Active section selections state
  const [selections, setSelections] = useState({
    species: "human",
    gender: "female",
    ethnicity: "asian",
    eye_color: "blue",
    ears_horns: "normal_ears",
    eye_details: "normal_eyes",
    mouth_teeth: "normal_mouth",
    tongue: "normal_tongue",

    skin_patterns: "human_skin",
    body_shape: "normal",
    left_arm: "normal_arm",
    right_arm: "normal_arm",
    left_leg: "normal_leg",
    right_leg: "normal_leg",

    hair_style: "long_hair",
    skin_details: "",
    body_marks: "",
    art_style: "hyper_realistic"
  });

  const [activeTab, setActiveTab] = useState("face"); // 'face' | 'body' | 'style'
  const [activeSubcategory, setActiveSubcategory] = useState("species");
  const [customDetail, setCustomDetail] = useState("in the streets of Tokyo at sunset, casual chic clothes, cinematic back-lighting");
  const [aspectRatio, setAspectRatio] = useState("3:4"); // Default 3:4 aspect ratio
  const [selectedModel, setSelectedModel] = useState("nano-banana-pro");
  const [isArDropdownOpen, setIsArDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);

  // History gallery
  const [history, setHistory] = useState([]);

  const timerRef = useRef(null);
  const pendingRequestId = useRef(null);

  // Auto-focus first subcategory when tab changes
  useEffect(() => {
    const config = TABS_CONFIG[activeTab];
    if (config && config.subcategories.length > 0) {
      setActiveSubcategory(config.subcategories[0].id);
    }
  }, [activeTab]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PERSIST_KEY) || "[]");
      if (Array.isArray(saved)) {
        setHistory(saved);
      }
    } catch (_) {}
  }, []);

  const saveHistory = useCallback((items) => {
    setHistory(items);
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(items));
    } catch (_) {}
  }, []);

  // Timer helpers
  const startTimer = () => {
    setElapsedTime(0);
    timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => () => stopTimer(), []);

  // Handle selected option clicks
  const selectOption = (subId, optId) => {
    const isOptional = ["skin_details", "body_marks"].includes(subId);
    setSelections(prev => ({
      ...prev,
      [subId]: prev[subId] === optId && isOptional ? "" : optId
    }));
  };

  // Select a random image from each section/subcategory
  const handleShuffle = () => {
    const nextSelections = { ...selections };
    Object.keys(TABS_CONFIG).forEach(tabKey => {
      TABS_CONFIG[tabKey].subcategories.forEach(sub => {
        const options = sub.options;
        const randomOpt = options[Math.floor(Math.random() * options.length)];
        
        // Some sections are optional (e.g. skin_details, body_marks might end up empty)
        const isOptional = ["skin_details", "body_marks"].includes(sub.id);
        if (isOptional && Math.random() < 0.25) {
          nextSelections[sub.id] = "";
        } else {
          nextSelections[sub.id] = randomOpt.id;
        }
      });
    });
    setSelections(nextSelections);
  };

  // Build the generation prompt dynamically in the background based on selections
  const constructPrompt = () => {
    const promptParts = [];

    // Art style setting tone
    const styleOpt = TABS_CONFIG.style.subcategories.find(s => s.id === "art_style")?.options.find(o => o.id === selections.art_style);
    if (styleOpt) promptParts.push(styleOpt.promptVal);

    // Identity details
    const genderOpt = TABS_CONFIG.face.subcategories.find(s => s.id === "gender")?.options.find(o => o.id === selections.gender);
    const speciesOpt = TABS_CONFIG.face.subcategories.find(s => s.id === "species")?.options.find(o => o.id === selections.species);
    const ethnicityOpt = TABS_CONFIG.face.subcategories.find(s => s.id === "ethnicity")?.options.find(o => o.id === selections.ethnicity);

    let identity = "virtual influencer character portrait";
    if (genderOpt && speciesOpt) {
      identity = `${genderOpt.promptVal} ${speciesOpt.promptVal} AI influencer`;
    }
    if (ethnicityOpt) {
      identity += `, ${ethnicityOpt.promptVal}`;
    }
    promptParts.push(identity);

    // Face details
    const eyesOpt = TABS_CONFIG.face.subcategories.find(s => s.id === "eye_color")?.options.find(o => o.id === selections.eye_color);
    const earsOpt = TABS_CONFIG.face.subcategories.find(s => s.id === "ears_horns")?.options.find(o => o.id === selections.ears_horns);
    const eyeDetailOpt = TABS_CONFIG.face.subcategories.find(s => s.id === "eye_details")?.options.find(o => o.id === selections.eye_details);
    const mouthOpt = TABS_CONFIG.face.subcategories.find(s => s.id === "mouth_teeth")?.options.find(o => o.id === selections.mouth_teeth);
    const tongueOpt = TABS_CONFIG.face.subcategories.find(s => s.id === "tongue")?.options.find(o => o.id === selections.tongue);

    if (eyesOpt) promptParts.push(eyesOpt.promptVal);
    if (earsOpt && selections.ears_horns !== "normal_ears") promptParts.push(earsOpt.promptVal);
    if (eyeDetailOpt && selections.eye_details !== "normal_eyes") promptParts.push(eyeDetailOpt.promptVal);
    if (mouthOpt && selections.mouth_teeth !== "normal_mouth") promptParts.push(mouthOpt.promptVal);
    if (tongueOpt && selections.tongue !== "normal_tongue") promptParts.push(tongueOpt.promptVal);

    // Body details
    const skinPatternOpt = TABS_CONFIG.body.subcategories.find(s => s.id === "skin_patterns")?.options.find(o => o.id === selections.skin_patterns);
    const bodyShapeOpt = TABS_CONFIG.body.subcategories.find(s => s.id === "body_shape")?.options.find(o => o.id === selections.body_shape);
    const leftArmOpt = TABS_CONFIG.body.subcategories.find(s => s.id === "left_arm")?.options.find(o => o.id === selections.left_arm);
    const rightArmOpt = TABS_CONFIG.body.subcategories.find(s => s.id === "right_arm")?.options.find(o => o.id === selections.right_arm);
    const leftLegOpt = TABS_CONFIG.body.subcategories.find(s => s.id === "left_leg")?.options.find(o => o.id === selections.left_leg);
    const rightLegOpt = TABS_CONFIG.body.subcategories.find(s => s.id === "right_leg")?.options.find(o => o.id === selections.right_leg);

    if (skinPatternOpt && selections.skin_patterns !== "human_skin") promptParts.push(skinPatternOpt.promptVal);
    if (bodyShapeOpt && selections.body_shape !== "normal") promptParts.push(bodyShapeOpt.promptVal);
    if (leftArmOpt && selections.left_arm !== "normal_arm") promptParts.push(leftArmOpt.promptVal);
    if (rightArmOpt && selections.right_arm !== "normal_arm") promptParts.push(rightArmOpt.promptVal);
    if (leftLegOpt && selections.left_leg !== "normal_leg") promptParts.push(leftLegOpt.promptVal);
    if (rightLegOpt && selections.right_leg !== "normal_leg") promptParts.push(rightLegOpt.promptVal);

    // Style details
    const hairOpt = TABS_CONFIG.style.subcategories.find(s => s.id === "hair_style")?.options.find(o => o.id === selections.hair_style);
    if (hairOpt) promptParts.push(hairOpt.promptVal);

    if (selections.skin_details) {
      const skinOpt = TABS_CONFIG.style.subcategories.find(s => s.id === "skin_details")?.options.find(o => o.id === selections.skin_details);
      if (skinOpt) promptParts.push(`with ${skinOpt.promptVal}`);
    }

    if (selections.body_marks) {
      const marksOpt = TABS_CONFIG.style.subcategories.find(s => s.id === "body_marks")?.options.find(o => o.id === selections.body_marks);
      if (marksOpt) promptParts.push(`adorned with ${marksOpt.promptVal}`);
    }

    // Custom environment detail
    if (customDetail.trim()) {
      promptParts.push(customDetail.trim());
    }

    return promptParts.join(", ");
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setGenerateError(null);
    startTimer();

    try {
      const fullPrompt = constructPrompt();
      const result = await generateImage(apiKey, {
        model: selectedModel,
        prompt: fullPrompt,
        aspect_ratio: aspectRatio === "Auto" ? "1:1" : aspectRatio,
        onRequestId: (id) => { pendingRequestId.current = id; }
      });

      const imageUrl = result.outputs?.[0] || result.url;
      if (!imageUrl) throw new Error("API returned empty output");

      const entry = {
        id: result.id || Math.random().toString(36).substring(7),
        url: imageUrl,
        prompt: fullPrompt,
        model: selectedModel,
        aspectRatio,
        selections: { ...selections },
        timestamp: new Date().toISOString()
      };

      const nextHistory = [entry, ...history];
      saveHistory(nextHistory);
    } catch (e) {
      console.error("[AiInfluencerStudio] Generation failed:", e);
      setGenerateError(e.message || "Something went wrong. Please check your API key.");
    } finally {
      stopTimer();
      setGenerating(false);
    }
  };

  const downloadImageFile = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this virtual influencer?")) {
      const nextHistory = history.filter(item => item.id !== id);
      saveHistory(nextHistory);
    }
  };

  const activeTabConfig = TABS_CONFIG[activeTab];
  const activeSub = activeTabConfig?.subcategories.find(s => s.id === activeSubcategory);

  return (
    <div className="flex flex-col h-full w-full bg-[#070709] overflow-hidden text-white font-sans">
      
      {/* Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* Left Column: Attribute Selector Grid */}
        <div className="w-full md:w-[480px] flex flex-col bg-[#0b0b0f] border-r border-white/5 shrink-0 min-h-0">
          
          {/* Top selection tabs (Face, Body, Style) */}
          <div className="flex border-b border-white/5 bg-[#0e0e14] shrink-0">
            {Object.keys(TABS_CONFIG).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === tabKey
                    ? "border-[#22d3ee] text-white bg-white/[0.02]"
                    : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.01]"
                }`}
              >
                {TABS_CONFIG[tabKey].label}
              </button>
            ))}
          </div>

          {/* Sub-categories Selector */}
          <div className="p-3 border-b border-white/5 overflow-x-auto flex gap-1.5 scrollbar-none select-none bg-[#09090d]">
            {activeTabConfig?.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubcategory(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all shrink-0 ${
                  activeSubcategory === sub.id
                    ? "bg-[#22d3ee] text-black shadow-md shadow-[#22d3ee]/20 font-black"
                    : "bg-[#13131a] text-white/50 hover:text-white/80 hover:bg-[#1a1a24]"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Option card grid view */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
            {activeSub && (
              <div className="grid grid-cols-3 gap-3">
                {activeSub.options.map((opt) => {
                  const isSelected = selections[activeSubcategory] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => selectOption(activeSubcategory, opt.id)}
                      className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected
                          ? "border-[#22d3ee] bg-[#22d3ee]/5 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                          : "border-white/5 bg-[#121217] hover:border-white/20 hover:scale-[1.01]"
                      }`}
                    >
                      <img
                        src={opt.img}
                        alt={opt.label}
                        className="w-full h-full object-cover select-none pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.target.src = "/assets/influencer/human_0.webp"; // fallback
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent flex flex-col justify-end p-2.5">
                        <span className="text-[10px] font-extrabold text-white leading-tight truncate">
                          {opt.label}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-[#22d3ee] rounded-full flex items-center justify-center border border-[#0b0b0f] shadow-lg shadow-black/60">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visualizer Canvas */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#070709] relative">
          
          <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0">
            {/* Visualizer Canvas display */}
            <div className="relative flex items-center justify-center w-full h-full max-h-[50vh] aspect-[3/4] rounded-2xl border border-white/5 bg-gradient-to-b from-[#111116] to-[#070709] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              {generating ? (
                <div className="flex flex-col items-center gap-3.5 text-center">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-35"></span>
                    <span className="animate-spin inline-block text-[#22d3ee] text-2xl font-light">◌</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-widest text-[#22d3ee] uppercase">Creating Character</span>
                    <span className="text-[10px] text-white/40 mt-1 font-mono">{elapsedTime}s elapsed</span>
                  </div>
                </div>
              ) : history[0] ? (
                <div className="w-full h-full relative group">
                  <img
                    src={history[0].url}
                    alt="Active AI Influencer"
                    className="w-full h-full object-cover cursor-pointer select-none"
                    onClick={() => setFullscreenUrl(history[0].url)}
                  />
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadImageFile(history[0].url, "influencer_character.png")}
                      className="p-2 bg-black/60 hover:bg-black/95 rounded-xl border border-white/5 hover:border-white/20 transition-all text-white/80 hover:text-white"
                      title="Download Image"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 text-center text-white/35 max-w-xs p-6 select-none">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40 animate-pulse">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  <div>
                    <h3 className="text-xs font-bold text-white/60">Influencer Workspace Empty</h3>
                    <p className="text-[10px] text-white/40 mt-1">Select details or click Shuffle, describe your scene and click Generate to see the magic.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* detailing input bar */}
          <div className="p-5 border-t border-white/5 bg-[#0b0b0f] flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-white/40 tracking-wider uppercase">Scene details & Outfit</label>
              <textarea
                value={customDetail}
                onChange={(e) => setCustomDetail(e.target.value)}
                placeholder="Describe clothes, setting, backdrop, camera lens..."
                rows={2}
                className="w-full bg-[#13131a] border border-white/5 rounded-xl p-3 text-xs text-white/90 placeholder-white/20 outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-all resize-none custom-scrollbar"
              />
            </div>

            {/* controls row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* model & AR options */}
              <div className="flex items-center gap-2">
                
                {/* Model dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="h-9 px-3 bg-[#13131a] border border-white/5 text-xs text-white/70 hover:text-white rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <span>{selectedModel === "nano-banana-pro" ? "Nano Banana Pro" : "Nano Banana 2"}</span>
                    <span className="text-[8px] opacity-40">▼</span>
                  </button>
                  {isModelDropdownOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 bg-[#0f0f12] border border-white/10 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-30 min-w-[130px]">
                      {["nano-banana-pro", "nano-banana-2"].map(m => (
                        <button
                          key={m}
                          onClick={() => {
                            setSelectedModel(m);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`text-left text-[11px] font-bold p-2 px-3 rounded-lg transition-all ${
                            selectedModel === m ? "bg-[#22d3ee]/10 text-white" : "hover:bg-white/5 text-white/60"
                          }`}
                        >
                          {m === "nano-banana-pro" ? "Nano Banana Pro" : "Nano Banana 2"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Aspect ratio selector */}
                <div className="relative">
                  <button
                    onClick={() => setIsArDropdownOpen(!isArDropdownOpen)}
                    className="h-9 px-3 bg-[#13131a] border border-white/5 text-xs text-white/70 hover:text-white rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <span>AR: {aspectRatio}</span>
                    <span className="text-[8px] opacity-40">▼</span>
                  </button>
                  {isArDropdownOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 bg-[#0f0f12] border border-white/10 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-30 min-w-[100px]">
                      {["3:4", "9:16", "1:1", "16:9"].map(r => (
                        <button
                          key={r}
                          onClick={() => {
                            setAspectRatio(r);
                            setIsArDropdownOpen(false);
                          }}
                          className={`text-left text-[11px] font-bold p-2 px-3 rounded-lg transition-all ${
                            aspectRatio === r ? "bg-[#22d3ee]/10 text-white" : "hover:bg-white/5 text-white/60"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons (Shuffle & Generate) */}
              <div className="flex items-center gap-2">
                
                {/* Shuffle/Randomizer button */}
                <button
                  onClick={handleShuffle}
                  title="Randomize selections"
                  className="h-9 w-9 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 active:scale-[0.95] text-white/70 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-md"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M4 4l5 5M15 15l6 6" />
                  </svg>
                </button>

                {/* Generate Trigger */}
                <button
                  onClick={handleGenerate}
                  disabled={generating || !customDetail.trim()}
                  className="h-9 px-6 bg-[#b5f500] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#b5f500]/10"
                >
                  {generating ? (
                    <>
                      <span className="animate-spin inline-block">◌</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      Generate Influencer
                      <span>✦</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {generateError && (
              <div className="text-[11px] font-bold text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/10">
                {generateError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generation History Bottom Bar */}
      {history.length > 0 && (
        <div className="border-t border-white/5 bg-[#0a0a0d] p-4 shrink-0 flex flex-col gap-3 z-10">
          <span className="text-[10px] font-black text-white/30 tracking-widest uppercase">Characters Library</span>
          <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="relative h-24 aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/5 bg-black hover:border-[#b5f500]/40 transition-all flex-shrink-0 group/hist"
                onClick={() => setFullscreenUrl(item.url)}
              >
                <img src={item.url} alt="Past Character" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/hist:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImageFile(item.url, "influencer_character.png");
                    }}
                    className="p-1.5 bg-black/60 rounded-md hover:bg-black text-white/80 hover:text-white"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                    className="p-1.5 bg-red-950/60 rounded-md hover:bg-red-900 text-red-400 hover:text-red-300"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Overlay Viewer */}
      {fullscreenUrl && (
        <div
          onClick={() => setFullscreenUrl(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-black">
            <img src={fullscreenUrl} alt="Fullscreen View" className="w-full h-full object-contain" />
            <button
              onClick={() => setFullscreenUrl(null)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-black/60 hover:bg-black border border-white/10 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
