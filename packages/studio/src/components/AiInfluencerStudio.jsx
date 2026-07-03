"use client";

import { useState, useCallback } from "react";
import { generateImage } from "../muapi.js";

const CDN = "https://cdn.muapi.ai/influencer";

const TABS_CONFIG = {
  face: {
    label: "Face",
    subcategories: [
      {
        id: "character_type",
        label: "Character Type",
        options: [
          { id: "human",             label: "Human",    img: `${CDN}/character_type_human.webp`,             promptVal: "human features" },
          { id: "elf",               label: "Elf",      img: `${CDN}/character_type_elf.webp`,               promptVal: "elf with pointed ears" },
          { id: "alien",             label: "Alien",    img: `${CDN}/character_type_alien.webp`,             promptVal: "alien creature" },
          { id: "amphibian",         label: "Amphibian",img: `${CDN}/character_type_amphibian.webp`,         promptVal: "amphibian humanoid" },
          { id: "reptile",           label: "Reptile",  img: `${CDN}/character_type_reptile.webp`,           promptVal: "reptilian creature" },
          { id: "mantis",            label: "Mantis",   img: `${CDN}/character_type_mantis.webp`,            promptVal: "mantis hybrid character" },
          { id: "bee",               label: "Bee",      img: `${CDN}/character_type_bee.webp`,               promptVal: "bee insect hybrid character" },
          { id: "octopus",           label: "Octopus",  img: `${CDN}/character_type_octopus.webp`,           promptVal: "aquatic octopus hybrid" },
          { id: "crocodile",         label: "Crocodile",img: `${CDN}/character_type_crocodile.webp`,         promptVal: "crocodile humanoid" },
          { id: "iguana",            label: "Iguana",   img: `${CDN}/character_type_iguana.webp`,            promptVal: "iguana humanoid" },
          { id: "lizard",            label: "Lizard",   img: `${CDN}/character_type_lizard.webp`,            promptVal: "lizard humanoid" },
          { id: "rhinoceros_beetle", label: "Beetle",   img: `${CDN}/character_type_rhinoceros_beetle.webp`, promptVal: "rhinoceros beetle humanoid" },
          { id: "ant",               label: "Ant",      img: `${CDN}/character_type_ant.webp`,               promptVal: "ant hybrid character" },
        ],
      },
      {
        id: "gender",
        label: "Gender",
        options: [
          { id: "female",      label: "Female",      img: `${CDN}/gender_female.webp`,      promptVal: "female" },
          { id: "male",        label: "Male",        img: `${CDN}/gender_male.webp`,        promptVal: "male" },
          { id: "non_binary",  label: "Non-binary",  img: `${CDN}/gender_non_binary.webp`,  promptVal: "non-binary character" },
          { id: "trans_man",   label: "Trans Man",   img: `${CDN}/gender_trans_man.webp`,   promptVal: "transgender man" },
          { id: "trans_woman", label: "Trans Woman", img: `${CDN}/gender_trans_woman.webp`, promptVal: "transgender woman" },
        ],
      },
      {
        id: "ethnicity_origin_base",
        label: "Ethnicity / Origin",
        options: [
          { id: "african",       label: "African",       img: `${CDN}/ethnicity_origin_base_african.webp`,                                          promptVal: "african heritage" },
          { id: "asian",         label: "Asian",         img: `${CDN}/ethnicity_origin_base_recreate_in_east_asian_supermodel__korea.webp`,          promptVal: "East Asian supermodel, Korean K-Pop Idol phenotype" },
          { id: "european",      label: "European",      img: `${CDN}/ethnicity_origin_base_scandinavian_supermodel.webp`,                           promptVal: "Scandinavian Supermodel" },
          { id: "indian",        label: "Indian",        img: `${CDN}/ethnicity_origin_base_indian.webp`,                                            promptVal: "south asian indian heritage" },
          { id: "middle_eastern",label: "Middle Eastern",img: `${CDN}/ethnicity_origin_base_middle_eastern.webp`,                                    promptVal: "middle eastern heritage" },
          { id: "mixed",         label: "Mixed",         img: `${CDN}/ethnicity_origin_base_mixed.webp`,                                             promptVal: "multiracial mixed heritage" },
        ],
      },
      {
        id: "eye_color",
        label: "Eye Color",
        options: [
          { id: "eye_blue",       label: "Blue",         img: `${CDN}/eye_color_eye_blue.webp`,       promptVal: "striking blue eyes" },
          { id: "eye_brown",      label: "Brown",        img: `${CDN}/eye_color_eye_brown.webp`,      promptVal: "warm brown eyes" },
          { id: "eye_green",      label: "Green",        img: `${CDN}/eye_color_eye_green.webp`,      promptVal: "emerald green eyes" },
          { id: "eye_amber",      label: "Amber",        img: `${CDN}/eye_color_eye_amber.webp`,      promptVal: "amber eyes" },
          { id: "eye_grey",       label: "Grey",         img: `${CDN}/eye_color_eye_grey.webp`,       promptVal: "grey eyes" },
          { id: "eye_red",        label: "Red",          img: `${CDN}/eye_color_eye_red.webp`,        promptVal: "red eyes" },
          { id: "eye_purple",     label: "Purple",       img: `${CDN}/eye_color_eye_purple.webp`,     promptVal: "violet purple eyes" },
          { id: "eye_black",      label: "Black",        img: `${CDN}/eye_color_eye_black.webp`,      promptVal: "black eyes" },
          { id: "eye_deep_brown", label: "Deep Brown",   img: `${CDN}/eye_color_eye_deep_brown.webp`, promptVal: "deep dark brown eyes" },
          { id: "eye_white",      label: "White",        img: `${CDN}/eye_color_eye_white.webp`,      promptVal: "white eyes" },
          { id: "eye_black_void", label: "Solid Black",  img: `${CDN}/eye_color_eye_black_void.webp`, promptVal: "solid black void eyes" },
          { id: "eye_white_void", label: "Blind / Empty",img: `${CDN}/eye_color_eye_white_void.webp`, promptVal: "blind empty white eyes" },
        ],
      },
      {
        id: "eyes_type",
        label: "Eye Type",
        options: [
          { id: "eyes_human",      label: "Human",     img: `${CDN}/eyes_type_eyes_human.webp`,      promptVal: "normal human eyes" },
          { id: "eyes_reptile",    label: "Reptile",   img: `${CDN}/eyes_type_eyes_reptile.webp`,    promptVal: "reptile slit-pupil eyes" },
          { id: "eyes_mechanical", label: "Mechanical",img: `${CDN}/eyes_type_eyes_mechanical.webp`, promptVal: "mechanical cyborg eyes" },
        ],
      },
      {
        id: "eyes_details",
        label: "Eye Features",
        options: [
          { id: "eyes_different_colors", label: "Heterochromia", img: `${CDN}/eyes_details_eyes_different_colors.webp`, promptVal: "heterochromia different eye colors" },
          { id: "eyes_blind",            label: "Blind Eye",     img: `${CDN}/eyes_details_eyes_blind.webp`,            promptVal: "one cloudy blind eye" },
          { id: "eyes_scarred",          label: "Scarred Eye",   img: `${CDN}/eyes_details_eyes_scarred.webp`,          promptVal: "scar running across one eye" },
          { id: "eyes_glowing",          label: "Glowing Eye",   img: `${CDN}/eyes_details_eyes_glowing.webp`,          promptVal: "glowing magical eyes" },
        ],
      },
      {
        id: "mouth",
        label: "Mouth & Teeth",
        options: [
          { id: "mouth_small",           label: "Small Mouth",   img: `${CDN}/mouth_mouth_small.webp`,           promptVal: "small delicate mouth" },
          { id: "mouth_large",           label: "Large Mouth",   img: `${CDN}/mouth_mouth_large.webp`,           promptVal: "wide expressive mouth" },
          { id: "mouth_no_teeth",        label: "No Teeth",      img: `${CDN}/mouth_mouth_no_teeth.webp`,        promptVal: "no visible teeth" },
          { id: "mouth_different_teeth", label: "Unique Teeth",  img: `${CDN}/mouth_mouth_different_teeth.webp`, promptVal: "unusual tooth structure" },
          { id: "mouth_sharp_teeth",     label: "Sharp Teeth",   img: `${CDN}/mouth_mouth_sharp_teeth.webp`,     promptVal: "sharp predatory fangs" },
          { id: "mouth_forked_tongue",   label: "Forked Tongue", img: `${CDN}/mouth_mouth_forked_tongue.webp`,   promptVal: "reptilian forked tongue" },
          { id: "mouth_two_tongues",     label: "Two Tongues",   img: `${CDN}/mouth_mouth_two_tongues.webp`,     promptVal: "two separate tongues" },
        ],
      },
      {
        id: "ears",
        label: "Ears",
        options: [
          { id: "ears_human", label: "Human",     img: `${CDN}/ears_ears_human.webp`, promptVal: "normal human ears" },
          { id: "ears_elf",   label: "Elf Ears",  img: `${CDN}/ears_ears_elf.webp`,   promptVal: "pointed elf ears" },
          { id: "ears_no",    label: "No Ears",   img: `${CDN}/ears_ears_no.webp`,    promptVal: "no visible ears" },
          { id: "ears_wings", label: "Wing Ears", img: `${CDN}/ears_ears_wings.webp`, promptVal: "wing ears" },
        ],
      },
      {
        id: "horns",
        label: "Horns",
        options: [
          { id: "small_horns", label: "Small Horns", img: `${CDN}/horns_small_horns.webp`, promptVal: "small horns on forehead" },
          { id: "big_horns",   label: "Big Horns",   img: `${CDN}/horns_big_horns.webp`,   promptVal: "large curved horns" },
          { id: "antlers",     label: "Antlers",     img: `${CDN}/horns_antlers.webp`,      promptVal: "deer antlers on head" },
        ],
      },
      {
        id: "skin_conditions",
        label: "Skin Conditions",
        options: [
          { id: "condition_vitiligo",    label: "Vitiligo",     img: `${CDN}/skin_conditions_condition_vitiligo.webp`,    promptVal: "vitiligo skin condition" },
          { id: "condition_pigmentation",label: "Pigmentation", img: `${CDN}/skin_conditions_condition_pigmentation.webp`,promptVal: "hyperpigmentation" },
          { id: "condition_freckles",    label: "Freckles",     img: `${CDN}/skin_conditions_condition_freckles.webp`,    promptVal: "freckled skin" },
          { id: "condition_birthmarks",  label: "Birthmarks",   img: `${CDN}/skin_conditions_condition_birthmarks.webp`,  promptVal: "visible birthmarks" },
          { id: "condition_scars",       label: "Scars",        img: `${CDN}/skin_conditions_condition_scars.webp`,       promptVal: "scarred skin" },
          { id: "condition_burns",       label: "Burns",        img: `${CDN}/skin_conditions_condition_burns.webp`,       promptVal: "burn marks on skin" },
          { id: "condition_albinism",    label: "Albinism",     img: `${CDN}/skin_conditions_condition_albinism.webp`,    promptVal: "albinism pale white skin" },
          { id: "condition_cracked",     label: "Cracked Skin", img: `${CDN}/skin_conditions_condition_cracked.webp`,     promptVal: "cracked dry skin texture" },
          { id: "condition_wrinkled",    label: "Wrinkled",     img: `${CDN}/skin_conditions_condition_wrinkled.webp`,    promptVal: "wrinkled aged skin" },
        ],
      },
    ],
  },

  body: {
    label: "Body",
    subcategories: [
      {
        id: "face_skin_material",
        label: "Face Skin Material",
        options: [
          { id: "face_skin_human",     label: "Human Skin",   img: `${CDN}/face_skin_material_face_skin_human.webp`,     promptVal: "smooth human skin" },
          { id: "face_skin_scales",    label: "Scales",       img: `${CDN}/face_skin_material_face_skin_scales.webp`,    promptVal: "shimmering scales" },
          { id: "face_skin_fur",       label: "Fur",          img: `${CDN}/face_skin_material_face_skin_fur.webp`,       promptVal: "soft fur covered face" },
          { id: "face_skin_amphibian", label: "Amphibian",    img: `${CDN}/face_skin_material_face_skin_amphibian.webp`, promptVal: "smooth moist amphibian skin" },
          { id: "face_skin_fish",      label: "Fish Skin",    img: `${CDN}/face_skin_material_face_skin_fish.webp`,      promptVal: "iridescent fish scale skin" },
          { id: "face_skin_metallic",  label: "Metallic",     img: `${CDN}/face_skin_material_face_skin_metallic.webp`,  promptVal: "polished metallic skin" },
        ],
      },
      {
        id: "face_surface_pattern",
        label: "Skin Pattern",
        options: [
          { id: "face_pattern_solid",    label: "Solid Color",    img: `${CDN}/face_surface_pattern_face_pattern_solid.webp`,    promptVal: "solid color skin" },
          { id: "face_pattern_stripes",  label: "Stripes",        img: `${CDN}/face_surface_pattern_face_pattern_stripes.webp`,  promptVal: "exotic striped skin pattern" },
          { id: "face_pattern_spots",    label: "Spots",          img: `${CDN}/face_surface_pattern_face_pattern_spots.webp`,    promptVal: "dappled spotted skin" },
          { id: "face_pattern_chess",    label: "Chess Pattern",  img: `${CDN}/face_surface_pattern_face_pattern_chess.webp`,    promptVal: "checkerboard skin pattern" },
          { id: "face_pattern_veins",    label: "Veins Visible",  img: `${CDN}/face_surface_pattern_face_pattern_veins.webp`,    promptVal: "translucent skin with neon veins" },
          { id: "face_pattern_gradient", label: "Gradient",       img: `${CDN}/face_surface_pattern_face_pattern_gradient.webp`, promptVal: "gradient skin coloring" },
          { id: "face_pattern_giraffe",  label: "Giraffe Pattern",img: `${CDN}/face_surface_pattern_face_pattern_giraffe.webp`,  promptVal: "giraffe print skin markings" },
        ],
      },
      {
        id: "body_type",
        label: "Body Type",
        options: [
          { id: "body_slim",     label: "Slim",     img: `${CDN}/body_type_body_slim.webp`,     promptVal: "slim slender physique" },
          { id: "body_lean",     label: "Lean",     img: `${CDN}/body_type_body_lean.webp`,     promptVal: "lean toned physique" },
          { id: "body_athletic", label: "Athletic", img: `${CDN}/body_type_body_athletic.webp`, promptVal: "fit athletic body" },
          { id: "body_muscular", label: "Muscular", img: `${CDN}/body_type_body_muscular.webp`, promptVal: "strong muscular build" },
          { id: "body_curvy",    label: "Curvy",    img: `${CDN}/body_type_body_curvy.webp`,    promptVal: "curvy body type" },
          { id: "body_heavy",    label: "Heavy",    img: `${CDN}/body_type_body_heavy.webp`,    promptVal: "heavy set build" },
          { id: "body_skinny",   label: "Skinny",   img: `${CDN}/body_type_body_skinny.webp`,   promptVal: "very skinny thin build" },
        ],
      },
      {
        id: "left_arm",
        label: "Left Arm",
        options: [
          { id: "left_arm_normal",      label: "Normal",          img: `${CDN}/left_arm_left_arm_normal.webp`,                             promptVal: "normal left arm" },
          { id: "left_arm_cute",        label: "Cute Prosthetic", img: `${CDN}/left_arm_make_left_arm_stylish_pink_prosthetic_wi.webp`,    promptVal: "stylish pink prosthetic left arm with cute stickers" },
          { id: "left_arm_robotic",     label: "Robotic",         img: `${CDN}/left_arm_left_arm_robotic.webp`,                           promptVal: "robotic left arm" },
          { id: "left_arm_prosthetic",  label: "Prosthetic",      img: `${CDN}/left_arm_left_arm_prosthetic.webp`,                        promptVal: "prosthetic left arm" },
          { id: "left_arm_mechanical",  label: "Mechanical",      img: `${CDN}/left_arm_left_arm_mechanical.webp`,                        promptVal: "mechanical left arm" },
          { id: "left_arm_none",        label: "None",            img: `${CDN}/left_arm_left_arm_none.webp`,                              promptVal: "no left arm" },
        ],
      },
      {
        id: "right_arm",
        label: "Right Arm",
        options: [
          { id: "right_arm_normal",     label: "Normal",          img: `${CDN}/right_arm_right_arm_normal.webp`,                          promptVal: "normal right arm" },
          { id: "right_arm_cute",       label: "Cute Prosthetic", img: `${CDN}/right_arm_make_right_arm_stylish_pink_prosthetic_w.webp`,  promptVal: "stylish pink prosthetic right arm with cute stickers" },
          { id: "right_arm_robotic",    label: "Robotic",         img: `${CDN}/right_arm_right_arm_robotic.webp`,                         promptVal: "robotic right arm" },
          { id: "right_arm_prosthetic", label: "Prosthetic",      img: `${CDN}/right_arm_right_arm_prosthetic.webp`,                      promptVal: "prosthetic right arm" },
          { id: "right_arm_mechanical", label: "Mechanical",      img: `${CDN}/right_arm_right_arm_mechanical.webp`,                      promptVal: "mechanical right arm" },
          { id: "right_arm_none",       label: "None",            img: `${CDN}/right_arm_right_arm_none.webp`,                            promptVal: "no right arm" },
        ],
      },
      {
        id: "left_leg",
        label: "Left Leg",
        options: [
          { id: "left_leg_normal",     label: "Normal",          img: `${CDN}/left_leg_left_leg_normal.webp`,                           promptVal: "normal left leg" },
          { id: "left_leg_cute",       label: "Cute Prosthetic", img: `${CDN}/left_leg_make_left_leg_stylish_pink_prosthetic_wi.webp`,  promptVal: "stylish pink prosthetic left leg with cute stickers" },
          { id: "left_leg_robotic",    label: "Robotic",         img: `${CDN}/left_leg_left_leg_robotic.webp`,                          promptVal: "robotic left leg" },
          { id: "left_leg_prosthetic", label: "Prosthetic",      img: `${CDN}/left_leg_left_leg_prosthetic.webp`,                       promptVal: "prosthetic left leg" },
          { id: "left_leg_mechanical", label: "Mechanical",      img: `${CDN}/left_leg_left_leg_mechanical.webp`,                       promptVal: "mechanical left leg" },
          { id: "left_leg_none",       label: "None",            img: `${CDN}/left_leg_left_leg_none.webp`,                             promptVal: "no left leg" },
        ],
      },
      {
        id: "right_leg",
        label: "Right Leg",
        options: [
          { id: "right_leg_normal",     label: "Normal",          img: `${CDN}/right_leg_right_leg_normal.webp`,                         promptVal: "normal right leg" },
          { id: "right_leg_cute",       label: "Cute Prosthetic", img: `${CDN}/right_leg_make_right_leg_stylish_pink_prosthetic_w.webp`, promptVal: "stylish pink prosthetic right leg with cute stickers" },
          { id: "right_leg_robotic",    label: "Robotic",         img: `${CDN}/right_leg_right_leg_robotic.webp`,                        promptVal: "robotic right leg" },
          { id: "right_leg_prosthetic", label: "Prosthetic",      img: `${CDN}/right_leg_right_leg_prosthetic.webp`,                     promptVal: "prosthetic right leg" },
          { id: "right_leg_mechanical", label: "Mechanical",      img: `${CDN}/right_leg_right_leg_mechanical.webp`,                     promptVal: "mechanical right leg" },
          { id: "right_leg_none",       label: "None",            img: `${CDN}/right_leg_right_leg_none.webp`,                           promptVal: "no right leg" },
        ],
      },
    ],
  },

  style: {
    label: "Style",
    subcategories: [
      {
        id: "hair",
        label: "Hair / Head Growth",
        options: [
          { id: "hair_bald",      label: "Bald",          img: `${CDN}/hair_hair_bald.webp`,      promptVal: "bald head" },
          { id: "hair_short",     label: "Short Hair",    img: `${CDN}/hair_hair_short.webp`,     promptVal: "short hair" },
          { id: "hair_long",      label: "Long Hair",     img: `${CDN}/hair_hair_long.webp`,      promptVal: "long flowing hair" },
          { id: "hair_afro",      label: "Afro",          img: `${CDN}/hair_hair_afro.webp`,      promptVal: "afro hairstyle" },
          { id: "hair_punk",      label: "Punk",          img: `${CDN}/hair_hair_punk.webp`,      promptVal: "punk mohawk hairstyle" },
          { id: "hair_fur",       label: "Fur / Mane",    img: `${CDN}/hair_hair_fur.webp`,       promptVal: "fur mane on head" },
          { id: "hair_tentacles", label: "Tentacles",     img: `${CDN}/hair_hair_tentacles.webp`, promptVal: "tentacles as hair" },
          { id: "hair_spines",    label: "Spines",        img: `${CDN}/hair_hair_spines.webp`,    promptVal: "spines as hair" },
        ],
      },
      {
        id: "accessories",
        label: "Accessories & Markings",
        options: [
          { id: "accessory_tattoos",        label: "Tattoos",             img: `${CDN}/accessories_accessory_tattoos.webp`,        promptVal: "covered in tattoos" },
          { id: "accessory_piercing",       label: "Piercings",           img: `${CDN}/accessories_accessory_piercing.webp`,       promptVal: "multiple piercings" },
          { id: "accessory_scarification",  label: "Scarification",       img: `${CDN}/accessories_accessory_scarification.webp`,  promptVal: "ritual scarification marks" },
          { id: "accessory_symbols",        label: "Symbols / Markings",  img: `${CDN}/accessories_accessory_symbols.webp`,        promptVal: "symbolic tribal markings" },
          { id: "accessory_cyber",          label: "Cyber Markings",      img: `${CDN}/accessories_accessory_cyber.webp`,          promptVal: "cyberpunk circuit markings" },
        ],
      },
      {
        id: "rendering_style",
        label: "Rendering Style",
        options: [
          { id: "style_hyper_realistic", label: "Hyper-Realistic",  img: `${CDN}/character_type_human.webp`, promptVal: "hyper-realistic 8k photograph" },
          { id: "style_anime",           label: "Anime",            img: `${CDN}/character_type_elf.webp`,   promptVal: "anime art style" },
          { id: "style_cartoon",         label: "Cartoon",          img: `${CDN}/character_type_mantis.webp`,promptVal: "cartoon illustration style" },
          { id: "style_2d_illustration", label: "2D Illustration",  img: `${CDN}/character_type_alien.webp`, promptVal: "2D flat illustration style" },
        ],
      },
    ],
  },
};

// ─── Reusable icon components ──────────────────────────────────────────────────
const IconShuffle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
  </svg>
);

const IconBolt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconSpinner = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
    <path d="M21 12a9 9 0 00-9-9" />
  </svg>
);

const IconCheck = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
  </svg>
);

const IconImage = () => (
  <svg className="w-11 h-11 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AiInfluencerStudio({ onGenerate, isGenerating: externalIsGenerating }) {
  const [activeTab, setActiveTab] = useState("face");

  const [selectedOptions, setSelectedOptions] = useState(() => {
    const initial = {};
    Object.keys(TABS_CONFIG).forEach((tabKey) => {
      TABS_CONFIG[tabKey].subcategories.forEach((sub) => {
        if (sub.options?.length > 0) initial[sub.id] = sub.options[0].id;
      });
    });
    return initial;
  });

  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [customPromptText, setCustomPromptText] = useState("");
  const [isGeneratingInternal, setIsGeneratingInternal] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const isGenerating = externalIsGenerating || isGeneratingInternal;

  const buildPrompt = useCallback(() => {
    const parts = [];
    Object.keys(TABS_CONFIG).forEach((tabKey) => {
      TABS_CONFIG[tabKey].subcategories.forEach((sub) => {
        const opt = sub.options.find((o) => o.id === selectedOptions[sub.id]);
        if (opt?.promptVal) parts.push(opt.promptVal);
      });
    });
    let prompt = "Ultra-realistic professional portrait photograph of an AI influencer character, 8k resolution, cinematic lighting, sharp detail";
    if (parts.length) prompt += ", " + parts.join(", ");
    if (customPromptText.trim()) prompt += ", " + customPromptText.trim();
    return prompt;
  }, [selectedOptions, customPromptText]);

  const handleOptionSelect = (subcatId, optionId) =>
    setSelectedOptions((prev) => ({ ...prev, [subcatId]: optionId }));

  const handleShuffle = () => {
    const next = {};
    Object.keys(TABS_CONFIG).forEach((tabKey) => {
      TABS_CONFIG[tabKey].subcategories.forEach((sub) => {
        if (sub.options?.length > 0)
          next[sub.id] = sub.options[Math.floor(Math.random() * sub.options.length)].id;
      });
    });
    setSelectedOptions(next);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGeneratingInternal(true);
    setErrorMsg("");
    setGenerationResult(null);
    const prompt = buildPrompt();
    try {
      if (onGenerate) {
        await onGenerate({ prompt, aspectRatio, selections: selectedOptions });
      } else {
        const res = await generateImage({ prompt, aspect_ratio: aspectRatio });
        setGenerationResult(res);
      }
    } catch (err) {
      setErrorMsg(err?.message || "Failed to generate character image");
    } finally {
      setIsGeneratingInternal(false);
    }
  };

  const arStyle = { "3:4": "3/4", "1:1": "1/1", "9:16": "9/16", "16:9": "16/9" }[aspectRatio] ?? "3/4";

  return (
    <div className="flex flex-col h-full bg-[#0F1117] text-white overflow-hidden select-none font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] bg-[#141722]/90 backdrop-blur-md shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <IconStar />
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-tight text-white leading-none">AI Influencer Studio</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Design a unique AI character with fine-grained controls</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Shuffle */}
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-violet-400 text-[13px] font-semibold hover:bg-white/10 transition-colors"
          >
            <IconShuffle />
            Shuffle
          </button>

          {/* Aspect Ratio */}
          <div className="flex gap-0.5 bg-white/[0.05] border border-white/10 rounded-xl p-1">
            {["3:4", "1:1", "9:16", "16:9"].map((r) => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  aspectRatio === r
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/40"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[13px] font-bold shadow-lg shadow-violet-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? <><IconSpinner />Generating…</> : <><IconBolt />Generate Character</>}
          </button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left – Customizer */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Tab Nav */}
          <nav className="flex gap-1 px-6 pt-3 border-b border-white/[0.07] bg-[#141722]/40 shrink-0">
            {Object.keys(TABS_CONFIG).map((tabKey) => {
              const tab = TABS_CONFIG[tabKey];
              const active = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex items-center gap-1.5 px-5 py-2.5 pb-3 rounded-t-xl text-[13px] font-semibold border-b-2 transition-all ${
                    active
                      ? "border-violet-500 bg-white/[0.05] text-violet-300"
                      : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-violet-500/20 text-violet-300" : "bg-white/[0.07] text-gray-500"}`}>
                    {tab.subcategories?.length}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Option Grids */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {TABS_CONFIG[activeTab]?.subcategories?.map((subcat) => (
              <section key={subcat.id}>
                {/* Subcat header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{subcat.label}</h3>
                  <span className="text-[10px] text-gray-600">{subcat.options?.length} options</span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2.5">
                  {subcat.options?.map((opt) => {
                    const selected = selectedOptions[subcat.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionSelect(subcat.id, opt.id)}
                        className={`group flex flex-col items-center p-2 rounded-xl border transition-all ${
                          selected
                            ? "border-violet-500 bg-violet-600/10 ring-1 ring-violet-500/40 shadow-lg shadow-violet-500/20"
                            : "border-white/[0.06] bg-[#161922] hover:border-white/20 hover:bg-[#1b1e2b]"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black/40 mb-1.5">
                          <img
                            src={opt.img}
                            alt={opt.label}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => { e.target.onerror = null; e.target.src = `${CDN}/character_type_human.webp`; }}
                          />
                          {selected && (
                            <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-violet-600 flex items-center justify-center shadow-md">
                              <IconCheck />
                            </span>
                          )}
                        </div>
                        {/* Label */}
                        <span className={`text-[10px] font-semibold w-full text-center truncate leading-tight ${selected ? "text-violet-300" : "text-gray-400"}`}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Right – Preview Panel */}
        <aside className="w-[340px] shrink-0 border-l border-white/[0.07] bg-[#12141D] flex flex-col p-5 overflow-y-auto">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Character Preview</p>

          {/* Preview box */}
          <div
            className="w-full rounded-2xl border border-white/[0.07] bg-[#181B26] flex items-center justify-center overflow-hidden mb-4 shadow-2xl"
            style={{ aspectRatio: arStyle, maxHeight: 420 }}
          >
            {generationResult?.url ? (
              <img src={generationResult.url} alt="Generated AI Character" className="w-full h-full object-cover" />
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="w-9 h-9 border-[3px] border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-[11px] text-violet-300">Generating your character…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 p-6 text-center text-gray-600">
                <IconImage />
                <p className="text-[11px]">Select options &amp; click<br />Generate to create your character</p>
              </div>
            )}
          </div>

          {/* Extra prompt */}
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Additional Details</label>
          <textarea
            value={customPromptText}
            onChange={(e) => setCustomPromptText(e.target.value)}
            placeholder="e.g. neon cyberpunk lighting, luxury penthouse background…"
            className="w-full h-20 bg-[#181B26] border border-white/[0.07] rounded-xl p-3 text-[11px] text-gray-200 placeholder-gray-600 resize-none outline-none focus:border-violet-500/50 transition-colors mb-4"
          />

          {/* Error */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] mb-4">
              {errorMsg}
            </div>
          )}

          {/* Selections summary */}
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Selections</p>
          <div className="flex flex-col gap-0.5">
            {Object.keys(TABS_CONFIG).map((tabKey) =>
              TABS_CONFIG[tabKey].subcategories.map((sub) => {
                const opt = sub.options.find((o) => o.id === selectedOptions[sub.id]);
                if (!opt) return null;
                return (
                  <div key={sub.id} className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
                    <span className="text-[10px] text-gray-600">{sub.label}</span>
                    <span className="text-[10px] text-violet-300 font-semibold">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
