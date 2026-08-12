"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = AiInfluencerStudio;
var _react = require("react");
var _muapi = require("../muapi.js");
var _jsxRuntime = require("react/jsx-runtime");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var CDN = "https://cdn.muapi.ai/influencer";

// ── Default image generation model ──────────────────────────────────────────
var INFLUENCER_MODEL = "nano-banana-pro";
var TABS_CONFIG = {
  face: {
    label: "Face",
    subcategories: [{
      id: "character_type",
      label: "Character Type",
      options: [{
        id: "human",
        label: "Human",
        img: "".concat(CDN, "/character_type_human.webp"),
        promptVal: "human features"
      }, {
        id: "elf",
        label: "Elf",
        img: "".concat(CDN, "/character_type_elf.webp"),
        promptVal: "elf with pointed ears"
      }, {
        id: "alien",
        label: "Alien",
        img: "".concat(CDN, "/character_type_alien.webp"),
        promptVal: "alien creature"
      }, {
        id: "amphibian",
        label: "Amphibian",
        img: "".concat(CDN, "/character_type_amphibian.webp"),
        promptVal: "amphibian humanoid"
      }, {
        id: "reptile",
        label: "Reptile",
        img: "".concat(CDN, "/character_type_reptile.webp"),
        promptVal: "reptilian creature"
      }, {
        id: "mantis",
        label: "Mantis",
        img: "".concat(CDN, "/character_type_mantis.webp"),
        promptVal: "mantis hybrid character"
      }, {
        id: "bee",
        label: "Bee",
        img: "".concat(CDN, "/character_type_bee.webp"),
        promptVal: "bee insect hybrid character"
      }, {
        id: "octopus",
        label: "Octopus",
        img: "".concat(CDN, "/character_type_octopus.webp"),
        promptVal: "aquatic octopus hybrid"
      }, {
        id: "crocodile",
        label: "Crocodile",
        img: "".concat(CDN, "/character_type_crocodile.webp"),
        promptVal: "crocodile humanoid"
      }, {
        id: "iguana",
        label: "Iguana",
        img: "".concat(CDN, "/character_type_iguana.webp"),
        promptVal: "iguana humanoid"
      }, {
        id: "lizard",
        label: "Lizard",
        img: "".concat(CDN, "/character_type_lizard.webp"),
        promptVal: "lizard humanoid"
      }, {
        id: "rhinoceros_beetle",
        label: "Beetle",
        img: "".concat(CDN, "/character_type_rhinoceros_beetle.webp"),
        promptVal: "rhinoceros beetle humanoid"
      }, {
        id: "ant",
        label: "Ant",
        img: "".concat(CDN, "/character_type_ant.webp"),
        promptVal: "ant hybrid character"
      }]
    }, {
      id: "gender",
      label: "Gender",
      options: [{
        id: "female",
        label: "Female",
        img: "".concat(CDN, "/gender_female.webp"),
        promptVal: "female"
      }, {
        id: "male",
        label: "Male",
        img: "".concat(CDN, "/gender_male.webp"),
        promptVal: "male"
      }, {
        id: "non_binary",
        label: "Non-binary",
        img: "".concat(CDN, "/gender_non_binary.webp"),
        promptVal: "non-binary character"
      }, {
        id: "trans_man",
        label: "Trans Man",
        img: "".concat(CDN, "/gender_trans_man.webp"),
        promptVal: "transgender man"
      }, {
        id: "trans_woman",
        label: "Trans Woman",
        img: "".concat(CDN, "/gender_trans_woman.webp"),
        promptVal: "transgender woman"
      }]
    }, {
      id: "ethnicity_origin_base",
      label: "Ethnicity / Origin",
      options: [{
        id: "african",
        label: "African",
        img: "".concat(CDN, "/ethnicity_origin_base_african.webp"),
        promptVal: "african heritage"
      }, {
        id: "asian",
        label: "Asian",
        img: "".concat(CDN, "/ethnicity_origin_base_recreate_in_east_asian_supermodel__korea.webp"),
        promptVal: "East Asian supermodel, Korean K-Pop Idol phenotype"
      }, {
        id: "european",
        label: "European",
        img: "".concat(CDN, "/ethnicity_origin_base_scandinavian_supermodel.webp"),
        promptVal: "Scandinavian Supermodel"
      }, {
        id: "indian",
        label: "Indian",
        img: "".concat(CDN, "/ethnicity_origin_base_indian.webp"),
        promptVal: "south asian indian heritage"
      }, {
        id: "middle_eastern",
        label: "Middle Eastern",
        img: "".concat(CDN, "/ethnicity_origin_base_middle_eastern.webp"),
        promptVal: "middle eastern heritage"
      }, {
        id: "mixed",
        label: "Mixed",
        img: "".concat(CDN, "/ethnicity_origin_base_mixed.webp"),
        promptVal: "multiracial mixed heritage"
      }]
    }, {
      id: "eye_color",
      label: "Eye Color",
      options: [{
        id: "eye_blue",
        label: "Blue",
        img: "".concat(CDN, "/eye_color_eye_blue.webp"),
        promptVal: "striking blue eyes"
      }, {
        id: "eye_brown",
        label: "Brown",
        img: "".concat(CDN, "/eye_color_eye_brown.webp"),
        promptVal: "warm brown eyes"
      }, {
        id: "eye_green",
        label: "Green",
        img: "".concat(CDN, "/eye_color_eye_green.webp"),
        promptVal: "emerald green eyes"
      }, {
        id: "eye_amber",
        label: "Amber",
        img: "".concat(CDN, "/eye_color_eye_amber.webp"),
        promptVal: "amber eyes"
      }, {
        id: "eye_grey",
        label: "Grey",
        img: "".concat(CDN, "/eye_color_eye_grey.webp"),
        promptVal: "grey eyes"
      }, {
        id: "eye_red",
        label: "Red",
        img: "".concat(CDN, "/eye_color_eye_red.webp"),
        promptVal: "red eyes"
      }, {
        id: "eye_purple",
        label: "Purple",
        img: "".concat(CDN, "/eye_color_eye_purple.webp"),
        promptVal: "violet purple eyes"
      }, {
        id: "eye_black",
        label: "Black",
        img: "".concat(CDN, "/eye_color_eye_black.webp"),
        promptVal: "black eyes"
      }, {
        id: "eye_deep_brown",
        label: "Deep Brown",
        img: "".concat(CDN, "/eye_color_eye_deep_brown.webp"),
        promptVal: "deep dark brown eyes"
      }, {
        id: "eye_white",
        label: "White",
        img: "".concat(CDN, "/eye_color_eye_white.webp"),
        promptVal: "white eyes"
      }, {
        id: "eye_black_void",
        label: "Solid Black",
        img: "".concat(CDN, "/eye_color_eye_black_void.webp"),
        promptVal: "solid black void eyes"
      }, {
        id: "eye_white_void",
        label: "Blind / Empty",
        img: "".concat(CDN, "/eye_color_eye_white_void.webp"),
        promptVal: "blind empty white eyes"
      }]
    }, {
      id: "eyes_type",
      label: "Eye Type",
      options: [{
        id: "eyes_human",
        label: "Human",
        img: "".concat(CDN, "/eyes_type_eyes_human.webp"),
        promptVal: "normal human eyes"
      }, {
        id: "eyes_reptile",
        label: "Reptile",
        img: "".concat(CDN, "/eyes_type_eyes_reptile.webp"),
        promptVal: "reptile slit-pupil eyes"
      }, {
        id: "eyes_mechanical",
        label: "Mechanical",
        img: "".concat(CDN, "/eyes_type_eyes_mechanical.webp"),
        promptVal: "mechanical cyborg eyes"
      }]
    }, {
      id: "eyes_details",
      label: "Eye Features",
      options: [{
        id: "eyes_different_colors",
        label: "Heterochromia",
        img: "".concat(CDN, "/eyes_details_eyes_different_colors.webp"),
        promptVal: "heterochromia different eye colors"
      }, {
        id: "eyes_blind",
        label: "Blind Eye",
        img: "".concat(CDN, "/eyes_details_eyes_blind.webp"),
        promptVal: "one cloudy blind eye"
      }, {
        id: "eyes_scarred",
        label: "Scarred Eye",
        img: "".concat(CDN, "/eyes_details_eyes_scarred.webp"),
        promptVal: "scar running across one eye"
      }, {
        id: "eyes_glowing",
        label: "Glowing Eye",
        img: "".concat(CDN, "/eyes_details_eyes_glowing.webp"),
        promptVal: "glowing magical eyes"
      }]
    }, {
      id: "mouth",
      label: "Mouth & Teeth",
      options: [{
        id: "mouth_small",
        label: "Small Mouth",
        img: "".concat(CDN, "/mouth_mouth_small.webp"),
        promptVal: "small delicate mouth"
      }, {
        id: "mouth_large",
        label: "Large Mouth",
        img: "".concat(CDN, "/mouth_mouth_large.webp"),
        promptVal: "wide expressive mouth"
      }, {
        id: "mouth_no_teeth",
        label: "No Teeth",
        img: "".concat(CDN, "/mouth_mouth_no_teeth.webp"),
        promptVal: "no visible teeth"
      }, {
        id: "mouth_different_teeth",
        label: "Unique Teeth",
        img: "".concat(CDN, "/mouth_mouth_different_teeth.webp"),
        promptVal: "unusual tooth structure"
      }, {
        id: "mouth_sharp_teeth",
        label: "Sharp Teeth",
        img: "".concat(CDN, "/mouth_mouth_sharp_teeth.webp"),
        promptVal: "sharp predatory fangs"
      }, {
        id: "mouth_forked_tongue",
        label: "Forked Tongue",
        img: "".concat(CDN, "/mouth_mouth_forked_tongue.webp"),
        promptVal: "reptilian forked tongue"
      }, {
        id: "mouth_two_tongues",
        label: "Two Tongues",
        img: "".concat(CDN, "/mouth_mouth_two_tongues.webp"),
        promptVal: "two separate tongues"
      }]
    }, {
      id: "ears",
      label: "Ears",
      options: [{
        id: "ears_human",
        label: "Human",
        img: "".concat(CDN, "/ears_ears_human.webp"),
        promptVal: "normal human ears"
      }, {
        id: "ears_elf",
        label: "Elf Ears",
        img: "".concat(CDN, "/ears_ears_elf.webp"),
        promptVal: "pointed elf ears"
      }, {
        id: "ears_no",
        label: "No Ears",
        img: "".concat(CDN, "/ears_ears_no.webp"),
        promptVal: "no visible ears"
      }, {
        id: "ears_wings",
        label: "Wing Ears",
        img: "".concat(CDN, "/ears_ears_wings.webp"),
        promptVal: "wing ears"
      }]
    }, {
      id: "horns",
      label: "Horns",
      options: [{
        id: "small_horns",
        label: "Small Horns",
        img: "".concat(CDN, "/horns_small_horns.webp"),
        promptVal: "small horns on forehead"
      }, {
        id: "big_horns",
        label: "Big Horns",
        img: "".concat(CDN, "/horns_big_horns.webp"),
        promptVal: "large curved horns"
      }, {
        id: "antlers",
        label: "Antlers",
        img: "".concat(CDN, "/horns_antlers.webp"),
        promptVal: "deer antlers on head"
      }]
    }, {
      id: "skin_conditions",
      label: "Skin Conditions",
      options: [{
        id: "condition_vitiligo",
        label: "Vitiligo",
        img: "".concat(CDN, "/skin_conditions_condition_vitiligo.webp"),
        promptVal: "vitiligo skin condition"
      }, {
        id: "condition_pigmentation",
        label: "Pigmentation",
        img: "".concat(CDN, "/skin_conditions_condition_pigmentation.webp"),
        promptVal: "hyperpigmentation"
      }, {
        id: "condition_freckles",
        label: "Freckles",
        img: "".concat(CDN, "/skin_conditions_condition_freckles.webp"),
        promptVal: "freckled skin"
      }, {
        id: "condition_birthmarks",
        label: "Birthmarks",
        img: "".concat(CDN, "/skin_conditions_condition_birthmarks.webp"),
        promptVal: "visible birthmarks"
      }, {
        id: "condition_scars",
        label: "Scars",
        img: "".concat(CDN, "/skin_conditions_condition_scars.webp"),
        promptVal: "scarred skin"
      }, {
        id: "condition_burns",
        label: "Burns",
        img: "".concat(CDN, "/skin_conditions_condition_burns.webp"),
        promptVal: "burn marks on skin"
      }, {
        id: "condition_albinism",
        label: "Albinism",
        img: "".concat(CDN, "/skin_conditions_condition_albinism.webp"),
        promptVal: "albinism pale white skin"
      }, {
        id: "condition_cracked",
        label: "Cracked Skin",
        img: "".concat(CDN, "/skin_conditions_condition_cracked.webp"),
        promptVal: "cracked dry skin texture"
      }, {
        id: "condition_wrinkled",
        label: "Wrinkled",
        img: "".concat(CDN, "/skin_conditions_condition_wrinkled.webp"),
        promptVal: "wrinkled aged skin"
      }]
    }]
  },
  body: {
    label: "Body",
    subcategories: [{
      id: "face_skin_material",
      label: "Face Skin Material",
      options: [{
        id: "face_skin_human",
        label: "Human Skin",
        img: "".concat(CDN, "/face_skin_material_face_skin_human.webp"),
        promptVal: "smooth human skin"
      }, {
        id: "face_skin_scales",
        label: "Scales",
        img: "".concat(CDN, "/face_skin_material_face_skin_scales.webp"),
        promptVal: "shimmering scales"
      }, {
        id: "face_skin_fur",
        label: "Fur",
        img: "".concat(CDN, "/face_skin_material_face_skin_fur.webp"),
        promptVal: "soft fur covered face"
      }, {
        id: "face_skin_amphibian",
        label: "Amphibian",
        img: "".concat(CDN, "/face_skin_material_face_skin_amphibian.webp"),
        promptVal: "smooth moist amphibian skin"
      }, {
        id: "face_skin_fish",
        label: "Fish Skin",
        img: "".concat(CDN, "/face_skin_material_face_skin_fish.webp"),
        promptVal: "iridescent fish scale skin"
      }, {
        id: "face_skin_metallic",
        label: "Metallic",
        img: "".concat(CDN, "/face_skin_material_face_skin_metallic.webp"),
        promptVal: "polished metallic skin"
      }]
    }, {
      id: "face_surface_pattern",
      label: "Skin Pattern",
      options: [{
        id: "face_pattern_solid",
        label: "Solid",
        img: "".concat(CDN, "/face_surface_pattern_face_pattern_solid.webp"),
        promptVal: "solid color skin"
      }, {
        id: "face_pattern_stripes",
        label: "Stripes",
        img: "".concat(CDN, "/face_surface_pattern_face_pattern_stripes.webp"),
        promptVal: "exotic striped skin pattern"
      }, {
        id: "face_pattern_spots",
        label: "Spots",
        img: "".concat(CDN, "/face_surface_pattern_face_pattern_spots.webp"),
        promptVal: "dappled spotted skin"
      }, {
        id: "face_pattern_chess",
        label: "Chess",
        img: "".concat(CDN, "/face_surface_pattern_face_pattern_chess.webp"),
        promptVal: "checkerboard skin pattern"
      }, {
        id: "face_pattern_veins",
        label: "Veins",
        img: "".concat(CDN, "/face_surface_pattern_face_pattern_veins.webp"),
        promptVal: "translucent skin with neon veins"
      }, {
        id: "face_pattern_gradient",
        label: "Gradient",
        img: "".concat(CDN, "/face_surface_pattern_face_pattern_gradient.webp"),
        promptVal: "gradient skin coloring"
      }, {
        id: "face_pattern_giraffe",
        label: "Giraffe",
        img: "".concat(CDN, "/face_surface_pattern_face_pattern_giraffe.webp"),
        promptVal: "giraffe print skin markings"
      }]
    }, {
      id: "body_type",
      label: "Body Type",
      options: [{
        id: "body_slim",
        label: "Slim",
        img: "".concat(CDN, "/body_type_body_slim.webp"),
        promptVal: "slim slender physique"
      }, {
        id: "body_lean",
        label: "Lean",
        img: "".concat(CDN, "/body_type_body_lean.webp"),
        promptVal: "lean toned physique"
      }, {
        id: "body_athletic",
        label: "Athletic",
        img: "".concat(CDN, "/body_type_body_athletic.webp"),
        promptVal: "fit athletic body"
      }, {
        id: "body_muscular",
        label: "Muscular",
        img: "".concat(CDN, "/body_type_body_muscular.webp"),
        promptVal: "strong muscular build"
      }, {
        id: "body_curvy",
        label: "Curvy",
        img: "".concat(CDN, "/body_type_body_curvy.webp"),
        promptVal: "curvy body type"
      }, {
        id: "body_heavy",
        label: "Heavy",
        img: "".concat(CDN, "/body_type_body_heavy.webp"),
        promptVal: "heavy set build"
      }, {
        id: "body_skinny",
        label: "Skinny",
        img: "".concat(CDN, "/body_type_body_skinny.webp"),
        promptVal: "very skinny thin build"
      }]
    }, {
      id: "left_arm",
      label: "Left Arm",
      options: [{
        id: "left_arm_normal",
        label: "Normal",
        img: "".concat(CDN, "/left_arm_left_arm_normal.webp"),
        promptVal: "normal left arm"
      }, {
        id: "left_arm_cute",
        label: "Cute Prosthetic",
        img: "".concat(CDN, "/left_arm_make_left_arm_stylish_pink_prosthetic_wi.webp"),
        promptVal: "stylish pink prosthetic left arm with cute stickers"
      }, {
        id: "left_arm_robotic",
        label: "Robotic",
        img: "".concat(CDN, "/left_arm_left_arm_robotic.webp"),
        promptVal: "robotic left arm"
      }, {
        id: "left_arm_prosthetic",
        label: "Prosthetic",
        img: "".concat(CDN, "/left_arm_left_arm_prosthetic.webp"),
        promptVal: "prosthetic left arm"
      }, {
        id: "left_arm_mechanical",
        label: "Mechanical",
        img: "".concat(CDN, "/left_arm_left_arm_mechanical.webp"),
        promptVal: "mechanical left arm"
      }, {
        id: "left_arm_none",
        label: "None",
        img: "".concat(CDN, "/left_arm_left_arm_none.webp"),
        promptVal: "no left arm"
      }]
    }, {
      id: "right_arm",
      label: "Right Arm",
      options: [{
        id: "right_arm_normal",
        label: "Normal",
        img: "".concat(CDN, "/right_arm_right_arm_normal.webp"),
        promptVal: "normal right arm"
      }, {
        id: "right_arm_cute",
        label: "Cute Prosthetic",
        img: "".concat(CDN, "/right_arm_make_right_arm_stylish_pink_prosthetic_w.webp"),
        promptVal: "stylish pink prosthetic right arm with cute stickers"
      }, {
        id: "right_arm_robotic",
        label: "Robotic",
        img: "".concat(CDN, "/right_arm_right_arm_robotic.webp"),
        promptVal: "robotic right arm"
      }, {
        id: "right_arm_prosthetic",
        label: "Prosthetic",
        img: "".concat(CDN, "/right_arm_right_arm_prosthetic.webp"),
        promptVal: "prosthetic right arm"
      }, {
        id: "right_arm_mechanical",
        label: "Mechanical",
        img: "".concat(CDN, "/right_arm_right_arm_mechanical.webp"),
        promptVal: "mechanical right arm"
      }, {
        id: "right_arm_none",
        label: "None",
        img: "".concat(CDN, "/right_arm_right_arm_none.webp"),
        promptVal: "no right arm"
      }]
    }, {
      id: "left_leg",
      label: "Left Leg",
      options: [{
        id: "left_leg_normal",
        label: "Normal",
        img: "".concat(CDN, "/left_leg_left_leg_normal.webp"),
        promptVal: "normal left leg"
      }, {
        id: "left_leg_cute",
        label: "Cute Prosthetic",
        img: "".concat(CDN, "/left_leg_make_left_leg_stylish_pink_prosthetic_wi.webp"),
        promptVal: "stylish pink prosthetic left leg with cute stickers"
      }, {
        id: "left_leg_robotic",
        label: "Robotic",
        img: "".concat(CDN, "/left_leg_left_leg_robotic.webp"),
        promptVal: "robotic left leg"
      }, {
        id: "left_leg_prosthetic",
        label: "Prosthetic",
        img: "".concat(CDN, "/left_leg_left_leg_prosthetic.webp"),
        promptVal: "prosthetic left leg"
      }, {
        id: "left_leg_mechanical",
        label: "Mechanical",
        img: "".concat(CDN, "/left_leg_left_leg_mechanical.webp"),
        promptVal: "mechanical left leg"
      }, {
        id: "left_leg_none",
        label: "None",
        img: "".concat(CDN, "/left_leg_left_leg_none.webp"),
        promptVal: "no left leg"
      }]
    }, {
      id: "right_leg",
      label: "Right Leg",
      options: [{
        id: "right_leg_normal",
        label: "Normal",
        img: "".concat(CDN, "/right_leg_right_leg_normal.webp"),
        promptVal: "normal right leg"
      }, {
        id: "right_leg_cute",
        label: "Cute Prosthetic",
        img: "".concat(CDN, "/right_leg_make_right_leg_stylish_pink_prosthetic_w.webp"),
        promptVal: "stylish pink prosthetic right leg with cute stickers"
      }, {
        id: "right_leg_robotic",
        label: "Robotic",
        img: "".concat(CDN, "/right_leg_right_leg_robotic.webp"),
        promptVal: "robotic right leg"
      }, {
        id: "right_leg_prosthetic",
        label: "Prosthetic",
        img: "".concat(CDN, "/right_leg_right_leg_prosthetic.webp"),
        promptVal: "prosthetic right leg"
      }, {
        id: "right_leg_mechanical",
        label: "Mechanical",
        img: "".concat(CDN, "/right_leg_right_leg_mechanical.webp"),
        promptVal: "mechanical right leg"
      }, {
        id: "right_leg_none",
        label: "None",
        img: "".concat(CDN, "/right_leg_right_leg_none.webp"),
        promptVal: "no right leg"
      }]
    }]
  },
  style: {
    label: "Style",
    subcategories: [{
      id: "hair",
      label: "Hair / Head Growth",
      options: [{
        id: "hair_bald",
        label: "Bald",
        img: "".concat(CDN, "/hair_hair_bald.webp"),
        promptVal: "bald head"
      }, {
        id: "hair_short",
        label: "Short Hair",
        img: "".concat(CDN, "/hair_hair_short.webp"),
        promptVal: "short hair"
      }, {
        id: "hair_long",
        label: "Long Hair",
        img: "".concat(CDN, "/hair_hair_long.webp"),
        promptVal: "long flowing hair"
      }, {
        id: "hair_afro",
        label: "Afro",
        img: "".concat(CDN, "/hair_hair_afro.webp"),
        promptVal: "afro hairstyle"
      }, {
        id: "hair_punk",
        label: "Punk",
        img: "".concat(CDN, "/hair_hair_punk.webp"),
        promptVal: "punk mohawk hairstyle"
      }, {
        id: "hair_fur",
        label: "Fur / Mane",
        img: "".concat(CDN, "/hair_hair_fur.webp"),
        promptVal: "fur mane on head"
      }, {
        id: "hair_tentacles",
        label: "Tentacles",
        img: "".concat(CDN, "/hair_hair_tentacles.webp"),
        promptVal: "tentacles as hair"
      }, {
        id: "hair_spines",
        label: "Spines",
        img: "".concat(CDN, "/hair_hair_spines.webp"),
        promptVal: "spines as hair"
      }]
    }, {
      id: "accessories",
      label: "Accessories & Markings",
      options: [{
        id: "accessory_tattoos",
        label: "Tattoos",
        img: "".concat(CDN, "/accessories_accessory_tattoos.webp"),
        promptVal: "covered in tattoos"
      }, {
        id: "accessory_piercing",
        label: "Piercings",
        img: "".concat(CDN, "/accessories_accessory_piercing.webp"),
        promptVal: "multiple piercings"
      }, {
        id: "accessory_scarification",
        label: "Scarification",
        img: "".concat(CDN, "/accessories_accessory_scarification.webp"),
        promptVal: "ritual scarification marks"
      }, {
        id: "accessory_symbols",
        label: "Symbols / Markings",
        img: "".concat(CDN, "/accessories_accessory_symbols.webp"),
        promptVal: "symbolic tribal markings"
      }, {
        id: "accessory_cyber",
        label: "Cyber Markings",
        img: "".concat(CDN, "/accessories_accessory_cyber.webp"),
        promptVal: "cyberpunk circuit markings"
      }]
    }, {
      id: "rendering_style",
      label: "Rendering Style",
      options: [{
        id: "style_hyper_realistic",
        label: "Hyper-Realistic",
        img: "".concat(CDN, "/character_type_human.webp"),
        promptVal: "hyper-realistic 8k photograph"
      }, {
        id: "style_anime",
        label: "Anime",
        img: "".concat(CDN, "/character_type_elf.webp"),
        promptVal: "anime art style"
      }, {
        id: "style_cartoon",
        label: "Cartoon",
        img: "".concat(CDN, "/character_type_mantis.webp"),
        promptVal: "cartoon illustration style"
      }, {
        id: "style_2d",
        label: "2D Illustration",
        img: "".concat(CDN, "/character_type_alien.webp"),
        promptVal: "2D flat illustration style"
      }]
    }]
  }
};

// ─── SVG Icon Components ────────────────────────────────────────────────────
var ShuffleIcon = function ShuffleIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "16 3 21 3 21 8"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
      x1: "4",
      y1: "20",
      x2: "21",
      y2: "3"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "21 16 21 21 16 21"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
      x1: "15",
      y1: "15",
      x2: "21",
      y2: "21"
    })]
  });
};
var BoltIcon = function BoltIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M13 10V3L4 14h7v7l9-11h-7z"
    })
  });
};
var CheckIcon = function CheckIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "9",
    height: "9",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "20 6 9 17 4 12"
    })
  });
};
var DownloadIcon = function DownloadIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "7 10 12 15 17 10"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
      x1: "12",
      y1: "15",
      x2: "12",
      y2: "3"
    })]
  });
};

// ─── Hover Pill — shows label, reveals image on hover ───────────────────────
function HoverPill(_ref) {
  var label = _ref.label,
    img = _ref.img,
    onClick = _ref.onClick;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    hovered = _useState2[0],
    setHovered = _useState2[1];
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "relative shrink-0",
    onMouseEnter: function onMouseEnter() {
      return setHovered(true);
    },
    onMouseLeave: function onMouseLeave() {
      return setHovered(false);
    },
    children: [hovered && img && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none",
      style: {
        filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))"
      },
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-[72px] h-[72px] rounded-xl overflow-hidden border border-white/20 bg-[#1a1a1a]",
        style: {
          transform: "rotate(-3deg)"
        },
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: img,
          alt: label,
          className: "w-full h-full object-cover"
        })
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      onClick: onClick,
      className: "h-[22px] px-2 rounded-md bg-white/[0.07] hover:bg-white/[0.13] border border-white/[0.10] text-[11px] font-medium text-gray-200 whitespace-nowrap transition-all cursor-pointer",
      children: label
    })]
  });
}

// ─── Main Component ─────────────────────────────────────────────────────────
function AiInfluencerStudio(_ref2) {
  var _TABS_CONFIG$activeTa, _arMap$aspectRatio;
  var apiKey = _ref2.apiKey,
    onGenerate = _ref2.onGenerate,
    externalIsGenerating = _ref2.isGenerating;
  var _useState3 = (0, _react.useState)("face"),
    _useState4 = _slicedToArray(_useState3, 2),
    activeTab = _useState4[0],
    setActiveTab = _useState4[1];
  var _useState5 = (0, _react.useState)(function () {
      var init = {};
      Object.values(TABS_CONFIG).forEach(function (tab) {
        return tab.subcategories.forEach(function (sub) {
          var _sub$options;
          if (((_sub$options = sub.options) === null || _sub$options === void 0 ? void 0 : _sub$options.length) > 0) init[sub.id] = sub.options[0].id;
        });
      });
      return init;
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    selectedOptions = _useState6[0],
    setSelectedOptions = _useState6[1];
  var _useState7 = (0, _react.useState)("3:4"),
    _useState8 = _slicedToArray(_useState7, 2),
    aspectRatio = _useState8[0],
    setAspectRatio = _useState8[1];
  var _useState9 = (0, _react.useState)(""),
    _useState0 = _slicedToArray(_useState9, 2),
    customPrompt = _useState0[0],
    setCustomPrompt = _useState0[1];
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    isGeneratingInternal = _useState10[0],
    setIsGeneratingInternal = _useState10[1];
  var _useState11 = (0, _react.useState)(null),
    _useState12 = _slicedToArray(_useState11, 2),
    currentResult = _useState12[0],
    setCurrentResult = _useState12[1]; // latest generated image
  var _useState13 = (0, _react.useState)([]),
    _useState14 = _slicedToArray(_useState13, 2),
    history = _useState14[0],
    setHistory = _useState14[1]; // all generated images
  var _useState15 = (0, _react.useState)(null),
    _useState16 = _slicedToArray(_useState15, 2),
    selectedHistoryIdx = _useState16[0],
    setSelectedHistoryIdx = _useState16[1];
  var _useState17 = (0, _react.useState)(""),
    _useState18 = _slicedToArray(_useState17, 2),
    errorMsg = _useState18[0],
    setErrorMsg = _useState18[1];
  var abortRef = (0, _react.useRef)(null);
  // Abort any in-flight generation when this studio unmounts (e.g. the user
  // switches tabs) so we stop polling MuAPI and burning API quota.
  (0, _react.useEffect)(function () {
    return function () {
      var _abortRef$current;
      (_abortRef$current = abortRef.current) === null || _abortRef$current === void 0 || _abortRef$current.abort();
    };
  }, []);
  var isGenerating = externalIsGenerating || isGeneratingInternal;

  // ── Build prompt from selections ──────────────────────────────────────────
  var buildPrompt = (0, _react.useCallback)(function () {
    var parts = [];
    Object.values(TABS_CONFIG).forEach(function (tab) {
      return tab.subcategories.forEach(function (sub) {
        var opt = sub.options.find(function (o) {
          return o.id === selectedOptions[sub.id];
        });
        if (opt !== null && opt !== void 0 && opt.promptVal) parts.push(opt.promptVal);
      });
    });
    var prompt = "Ultra-realistic professional portrait photograph of an AI influencer character, 8k resolution, cinematic lighting, sharp detail";
    if (parts.length) prompt += ", " + parts.join(", ");
    if (customPrompt.trim()) prompt += ", " + customPrompt.trim();
    return prompt;
  }, [selectedOptions, customPrompt]);

  // ── Option selection ───────────────────────────────────────────────────────
  var handleOptionSelect = function handleOptionSelect(subcatId, optId) {
    return setSelectedOptions(function (p) {
      return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, subcatId, optId));
    });
  };

  // ── Shuffle all options randomly ───────────────────────────────────────────
  var handleShuffle = function handleShuffle() {
    var next = {};
    Object.values(TABS_CONFIG).forEach(function (tab) {
      return tab.subcategories.forEach(function (sub) {
        var _sub$options2;
        if (((_sub$options2 = sub.options) === null || _sub$options2 === void 0 ? void 0 : _sub$options2.length) > 0) next[sub.id] = sub.options[Math.floor(Math.random() * sub.options.length)].id;
      });
    });
    setSelectedOptions(next);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  var handleGenerate = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var ac, prompt, _res, res, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!isGenerating) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setIsGeneratingInternal(true);
            setErrorMsg("");

            // New controller per generation; also lets a tab-switch unmount abort a
            // long-running poll loop early.
            ac = new AbortController();
            abortRef.current = ac;
            prompt = buildPrompt();
            _context.p = 2;
            if (!onGenerate) {
              _context.n = 4;
              break;
            }
            _context.n = 3;
            return onGenerate({
              prompt: prompt,
              aspectRatio: aspectRatio,
              selections: selectedOptions
            });
          case 3:
            res = _context.v;
            _context.n = 6;
            break;
          case 4:
            _context.n = 5;
            return (0, _muapi.generateImage)(apiKey, {
              model: INFLUENCER_MODEL,
              prompt: prompt,
              aspect_ratio: aspectRatio,
              signal: ac.signal
            });
          case 5:
            res = _context.v;
          case 6:
            if ((_res = res) !== null && _res !== void 0 && _res.url) {
              setCurrentResult(res.url);
              // Bound history so a long session can't grow memory without limit.
              setHistory(function (prev) {
                return [{
                  url: res.url,
                  ts: Date.now()
                }].concat(_toConsumableArray(prev)).slice(0, 50);
              });
              setSelectedHistoryIdx(0);
            }
            _context.n = 9;
            break;
          case 7:
            _context.p = 7;
            _t = _context.v;
            if (!ac.signal.aborted) {
              _context.n = 8;
              break;
            }
            return _context.a(2);
          case 8:
            setErrorMsg((_t === null || _t === void 0 ? void 0 : _t.message) || "Generation failed. Please try again.");
          case 9:
            _context.p = 9;
            setIsGeneratingInternal(false);
            return _context.f(9);
          case 10:
            return _context.a(2);
        }
      }, _callee, null, [[2, 7, 9, 10]]);
    }));
    return function handleGenerate() {
      return _ref3.apply(this, arguments);
    };
  }();

  // ── Download helper ───────────────────────────────────────────────────────
  var downloadImg = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(url) {
      var res, blob, a, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            _context2.p = 0;
            _context2.n = 1;
            return fetch(url);
          case 1:
            res = _context2.v;
            _context2.n = 2;
            return res.blob();
          case 2:
            blob = _context2.v;
            a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "ai-influencer-".concat(Date.now(), ".webp");
            a.click();
            URL.revokeObjectURL(a.href);
            _context2.n = 4;
            break;
          case 3:
            _context2.p = 3;
            _t2 = _context2.v;
            window.open(url, "_blank");
          case 4:
            return _context2.a(2);
        }
      }, _callee2, null, [[0, 3]]);
    }));
    return function downloadImg(_x) {
      return _ref4.apply(this, arguments);
    };
  }();

  // Preview image = selected history or current result
  var previewUrl = selectedHistoryIdx !== null && history[selectedHistoryIdx] ? history[selectedHistoryIdx].url : currentResult;
  var arMap = {
    "3:4": "3/4",
    "1:1": "1/1",
    "9:16": "9/16",
    "16:9": "16/9"
  };

  // ── Collect all selected options as flat list for the pill tags bar ─────────
  var selectedTags = [];
  Object.keys(TABS_CONFIG).forEach(function (tabKey) {
    TABS_CONFIG[tabKey].subcategories.forEach(function (sub) {
      var selId = selectedOptions[sub.id];
      var opt = sub.options.find(function (o) {
        return o.id === selId;
      });
      if (opt) selectedTags.push({
        subcatId: sub.id,
        label: opt.label,
        img: opt.img
      });
    });
  });
  var _useState19 = (0, _react.useState)(false),
    _useState20 = _slicedToArray(_useState19, 2),
    showAllTags = _useState20[0],
    setShowAllTags = _useState20[1];
  var TAGS_VISIBLE = 7; // how many pills to show before "show more"

  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex h-full bg-[#0a0a0a] text-white overflow-hidden select-none font-sans",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col w-[320px] shrink-0 border-r border-white/[0.07] bg-[#111111] overflow-hidden",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-[13px] font-bold text-white tracking-tight",
          children: "Builder"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: function onClick() {
            return setSelectedOptions(function () {
              var init = {};
              Object.values(TABS_CONFIG).forEach(function (tab) {
                return tab.subcategories.forEach(function (sub) {
                  var _sub$options3;
                  if (((_sub$options3 = sub.options) === null || _sub$options3 === void 0 ? void 0 : _sub$options3.length) > 0) init[sub.id] = sub.options[0].id;
                });
              });
              return init;
            }());
          },
          className: "text-[11px] text-gray-500 hover:text-white transition-colors font-medium",
          children: "Reset"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex gap-1 px-3 py-2 border-b border-white/[0.07] shrink-0",
        children: Object.keys(TABS_CONFIG).map(function (key) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveTab(key);
            },
            className: "flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ".concat(activeTab === key ? "bg-white text-black shadow" : "text-gray-500 hover:text-white hover:bg-white/[0.06]"),
            children: TABS_CONFIG[key].label
          }, key);
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-1 overflow-y-auto p-3 space-y-5",
        children: (_TABS_CONFIG$activeTa = TABS_CONFIG[activeTab]) === null || _TABS_CONFIG$activeTa === void 0 || (_TABS_CONFIG$activeTa = _TABS_CONFIG$activeTa.subcategories) === null || _TABS_CONFIG$activeTa === void 0 ? void 0 : _TABS_CONFIG$activeTa.map(function (subcat) {
          var _subcat$options;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-0.5",
              children: subcat.label
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "grid grid-cols-3 gap-1.5",
              children: (_subcat$options = subcat.options) === null || _subcat$options === void 0 ? void 0 : _subcat$options.map(function (opt) {
                var sel = selectedOptions[subcat.id] === opt.id;
                return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                  onClick: function onClick() {
                    return handleOptionSelect(subcat.id, opt.id);
                  },
                  className: "group relative aspect-square rounded-xl overflow-hidden border transition-all ".concat(sel ? "border-white/80 ring-1 ring-white/30 shadow-lg" : "border-white/[0.08] hover:border-white/25"),
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                    src: opt.img,
                    alt: opt.label,
                    loading: "lazy",
                    className: "w-full h-full object-cover",
                    onError: function onError(e) {
                      e.target.onerror = null;
                      e.target.src = "".concat(CDN, "/character_type_human.webp");
                    }
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-4 pb-1 px-1",
                    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-[9px] font-semibold text-white leading-none",
                      children: opt.label
                    })
                  }), sel && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center",
                    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckIcon, {})
                  })]
                }, opt.id);
              })
            })]
          }, subcat.id);
        })
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col flex-1 min-w-0 overflow-hidden bg-[#0a0a0a]",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center justify-between px-6 py-3 border-b border-white/[0.07] shrink-0",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex gap-0.5 bg-white/[0.05] border border-white/[0.08] rounded-xl p-1",
          children: ["3:4", "1:1", "9:16", "16:9"].map(function (r) {
            return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setAspectRatio(r);
              },
              className: "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ".concat(aspectRatio === r ? "bg-[#22d3ee] text-black shadow-md shadow-[#22d3ee]/30" : "text-gray-500 hover:text-white"),
              children: r
            }, r);
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            onClick: handleShuffle,
            className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/10 text-[12px] font-semibold transition-all",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ShuffleIcon, {}), "Shuffle"]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: handleGenerate,
            disabled: isGenerating,
            className: "flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all shadow-lg ".concat(isGenerating ? "bg-[#22d3ee]/40 text-white/60 cursor-not-allowed" : "bg-[#22d3ee] text-black shadow-lg shadow-[#22d3ee]/20 hover:shadow-[#22d3ee]/35 border border-[#22d3ee]/10"),
            children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                className: "animate-spin",
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  strokeOpacity: "0.3"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M21 12a9 9 0 00-9-9"
                })]
              }), "Generating\u2026"]
            }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(BoltIcon, {}), "Generate Character"]
            })
          })]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-1 flex items-center justify-center p-6 overflow-hidden",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "relative rounded-2xl overflow-hidden bg-[#141414] border border-white/[0.07] shadow-2xl flex items-center justify-center",
          style: {
            aspectRatio: (_arMap$aspectRatio = arMap[aspectRatio]) !== null && _arMap$aspectRatio !== void 0 ? _arMap$aspectRatio : "3/4",
            maxHeight: "100%",
            maxWidth: "100%"
          },
          children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col items-center gap-4 text-center px-8 py-12",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-12 h-12 border-[3px] border-[#22d3ee]/20 border-t-[#22d3ee] rounded-full animate-spin"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-sm text-gray-400 font-medium",
              children: "Generating your AI influencer\u2026"
            })]
          }) : previewUrl ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: previewUrl,
              alt: "Generated AI Character",
              className: "w-full h-full object-cover"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick() {
                return downloadImg(previewUrl);
              },
              className: "absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[11px] font-semibold hover:bg-black/80 transition-all",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(DownloadIcon, {}), "Save"]
            })]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col items-center gap-3 text-center px-8 py-12",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "48",
              height: "48",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "0.8",
              className: "text-gray-700",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                cx: "12",
                cy: "7",
                r: "4"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-sm text-gray-600 font-medium",
              children: "Your AI influencer lives here."
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
              className: "text-xs text-gray-700",
              children: ["Design and build your AI influencer", /*#__PURE__*/(0, _jsxRuntime.jsx)("br", {}), "from scratch"]
            })]
          })
        })
      }), selectedTags.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "px-6 pb-3 shrink-0",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-wrap gap-1.5 items-center",
          children: [(showAllTags ? selectedTags : selectedTags.slice(0, TAGS_VISIBLE)).map(function (tag) {
            return /*#__PURE__*/(0, _jsxRuntime.jsx)(HoverPill, {
              label: tag.label,
              img: tag.img,
              onClick: function onClick() {
                // Jump builder panel to the tab that owns this subcategory
                var ownerTab = Object.keys(TABS_CONFIG).find(function (tk) {
                  return TABS_CONFIG[tk].subcategories.some(function (s) {
                    return s.id === tag.subcatId;
                  });
                });
                if (ownerTab) setActiveTab(ownerTab);
              }
            }, tag.subcatId);
          }), selectedTags.length > TAGS_VISIBLE && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: function onClick() {
              return setShowAllTags(function (v) {
                return !v;
              });
            },
            className: "h-[22px] px-2 rounded-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] text-gray-500 hover:text-gray-300 whitespace-nowrap transition-all",
            children: showAllTags ? "hide" : "show more"
          })]
        })
      }), errorMsg && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "mx-6 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] shrink-0",
        children: errorMsg
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "px-6 pb-4 shrink-0",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
          type: "text",
          value: customPrompt,
          onChange: function onChange(e) {
            return setCustomPrompt(e.target.value);
          },
          placeholder: "Add extra details\u2026 e.g. neon cyberpunk lighting, dramatic shadows",
          className: "w-full h-9 bg-[#161616] border border-white/[0.07] rounded-xl px-3 text-[12px] text-gray-200 placeholder-gray-600 outline-none focus:border-[#22d3ee]/40 transition-colors"
        })
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col w-[160px] shrink-0 border-l border-white/[0.07] bg-[#111111] overflow-hidden",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "px-3 py-3 border-b border-white/[0.07] shrink-0",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-[11px] font-bold text-white tracking-tight",
          children: "Generated"
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
          className: "text-[9px] text-gray-600 mt-0.5",
          children: [history.length, " characters"]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-1 overflow-y-auto p-2 space-y-2",
        children: history.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col items-center justify-center h-32 text-center px-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
            width: "28",
            height: "28",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1",
            className: "text-gray-700 mb-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
              x: "3",
              y: "3",
              width: "18",
              height: "18",
              rx: "2",
              ry: "2"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
              cx: "8.5",
              cy: "8.5",
              r: "1.5"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
              points: "21 15 16 10 5 21"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
            className: "text-[9px] text-gray-700 leading-relaxed",
            children: ["Generated characters", /*#__PURE__*/(0, _jsxRuntime.jsx)("br", {}), "appear here"]
          })]
        }) : history.map(function (item, idx) {
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            role: "button",
            tabIndex: 0,
            onClick: function onClick() {
              return setSelectedHistoryIdx(idx);
            },
            onKeyDown: function onKeyDown(e) {
              return e.key === "Enter" && setSelectedHistoryIdx(idx);
            },
            className: "group relative w-full aspect-[3/4] rounded-xl overflow-hidden border transition-all cursor-pointer ".concat(selectedHistoryIdx === idx ? "border-[#22d3ee] ring-1 ring-[#22d3ee]/40" : "border-white/[0.08] hover:border-white/20"),
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: item.url,
              alt: "Character ".concat(idx + 1),
              className: "w-full h-full object-cover"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                role: "button",
                tabIndex: 0,
                onClick: function onClick(e) {
                  e.stopPropagation();
                  downloadImg(item.url);
                },
                onKeyDown: function onKeyDown(e) {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    downloadImg(item.url);
                  }
                },
                className: "p-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(DownloadIcon, {})
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[8px] text-gray-300 font-bold",
              children: ["#", history.length - idx]
            })]
          }, item.ts);
        })
      })]
    })]
  });
}