"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = AppsStudio;
var _react = _interopRequireWildcard(require("react"));
var _fa = require("react-icons/fa");
var _muapi = require("../muapi.js");
var _reactHotToast = _interopRequireWildcard(require("react-hot-toast"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t2 in e) "default" !== _t2 && {}.hasOwnProperty.call(e, _t2) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t2)) && (i.get || i.set) ? o(f, _t2, i) : f[_t2] = e[_t2]); return f; })(e, t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var templateApps = [{
  name: "AI Headshot Studio",
  description: "Launch a headshot SaaS in minutes. Charge $5–$20 per set, keep all profits. Stripe payments & user accounts included.",
  icon: _fa.FaUserTie,
  color: "blue",
  repo: "https://github.com/SamurAIGPT/ai-headshot-generator",
  hosted: "https://ai-headshot-generator-xi.vercel.app/",
  thumbnail: "https://cdn.muapi.ai/apps/d9c39378f60e48098f6b6ce657dc18b5.png",
  isTemplate: true
}, {
  name: "Nano Banana Studio",
  description: "Your own AI image generation platform, ready to monetize. Add credit packs or subscriptions and start earning from day one.",
  icon: _fa.FaHandSparkles,
  color: "amber",
  repo: "https://github.com/SamurAIGPT/nano-banana-generator",
  hosted: "https://nano-banana-generator-psi.vercel.app",
  thumbnail: "https://cdn.muapi.ai/data/2/874086171651/Screenshot_2026-04-15_103743.png",
  isTemplate: true
}, {
  name: "Seedance V2 Studio",
  description: "Deploy a premium AI art studio and sell access to users. Full Stripe integration lets you collect revenue immediately after launch.",
  icon: _fa.FaMagic,
  color: "purple",
  repo: "https://github.com/SamurAIGPT/seedance-2-generator",
  hosted: "https://seedance-2-generator.vercel.app/",
  thumbnail: "https://cdn.muapi.ai/apps/4cd1f49d48934d448e7f493f9d5e476e.png",
  isTemplate: true
}, {
  name: "AI Clipping Studio",
  description: "Launch your own AI-powered video clipping SaaS. Download YouTube videos and extract viral highlights with ease.",
  icon: _fa.FaVideo,
  color: "emerald",
  repo: "https://github.com/SamurAIGPT/ai-clipping-generator",
  hosted: "https://ai-clipping-generator.vercel.app/",
  thumbnail: "https://cdn.muapi.ai/data/2/883345778103/cca8b5bb-25f1-40fe-928e-53dce2c8c928.png",
  isTemplate: true
}, {
  name: "EasyVeo Studio",
  description: "The complete Veo 3.1 video generation suite. Monetize text-to-video, image-to-video, and reference-to-video workflows with ease.",
  icon: _fa.FaVideo,
  color: "indigo",
  repo: "https://github.com/SamurAIGPT/veo4-video-generator",
  hosted: "https://veo4-video-generator.vercel.app/",
  thumbnail: "https://cdn.muapi.ai/data/2/901343404247/94ac6d86-be4e-4b70-b1e6-96d7e3692604.png",
  isTemplate: true
}];
var dummyAppsData = [{
  thumbnail: "https://cdn.muapi.ai/apps/Pet_Product_Studio.jpg",
  name: "Pet Product Studio",
  description: "High-end product photography specifically for pet toys and food.",
  icon: _fa.FaPaw,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Resale_Photo_Enhancer.png",
  name: "Resale Photo Enhancer",
  description: "Boost sales by elevating low-quality product photos to studio level.",
  icon: _fa.FaImage,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Recruiter.png",
  name: "AI Recruiter",
  description: "Smart candidate screening and interview assistant.",
  icon: _fa.FaBriefcase,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Talk_to_PDF.png",
  name: "Talk to PDF",
  description: "Interactive document chat for deep research and summarization.",
  icon: _fa.FaFileAlt,
  category: "Productivity"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Blogger_CMS.png",
  name: "Blogger CMS",
  description: "AI-powered content management for high-velocity SEO blogs.",
  icon: _fa.FaBriefcase,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Amazon_Product_Studio.webp",
  name: "Amazon Product Studio",
  description: "Perfect Amazon-ready product shots with AI backdrops.",
  icon: _fa.FaImage,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Business_Card.webp",
  name: "AI Business Card",
  description: "Digital-first business card generator with AI networking.",
  icon: _fa.FaBriefcase,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/MailWise.png",
  name: "MailWise",
  description: "Intelligent email drafting and scheduling assistant.",
  icon: _fa.FaBriefcase,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/My_Podcast.webp",
  name: "My Podcast",
  description: "Automated podcast editing and show-note generation.",
  icon: _fa.FaMicrophone,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/EZScribe.png",
  name: "EZScribe",
  description: "Instant transcription and meeting minute automation.",
  icon: _fa.FaFileAlt,
  category: "Productivity"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Knowledge_Base.png",
  name: "AI Knowledge Base",
  description: "Train an AI on your company data for instant support.",
  icon: _fa.FaBriefcase,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Outbound.webp",
  name: "AI Outbound",
  description: "Personalized cold outreach at scale for sales teams.",
  icon: _fa.FaBriefcase,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Royal_Portrait.png",
  name: "AI Royal Portrait",
  description: "Transform your photos into 18th-century royal oil paintings.",
  icon: _fa.FaHandSparkles,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_MEME.png",
  name: "AI MEME",
  description: "Viral-ready meme generation based on trending topics.",
  icon: _fa.FaMagic,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Real_Estate_Stager.webp",
  name: "AI Real Estate Stager",
  description: "Virtually furnish and stage empty homes for sale.",
  icon: _fa.FaHome,
  category: "Real Estate"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Logo.png",
  name: "AI Logo",
  description: "Dynamic brand identity and logo generator.",
  icon: _fa.FaHandSparkles,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/OldPhoto.png",
  name: "OldPhoto",
  description: "Restore, colorize, and sharpen vintage family photos.",
  icon: _fa.FaImage,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AITryOn.png",
  name: "AITryOn",
  description: "Virtual fitting room for fashion brands and enthusiasts.",
  icon: _fa.FaHandSparkles,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Age_Transformation.webp",
  name: "AI Age Transformation",
  description: "Visualize yourself at different stages of life with high fidelity.",
  icon: _fa.FaImage,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Professional_Makeup_Generator.webp",
  name: "AI Professional Makeup Generator",
  description: "Try on hundreds of makeup looks virtually.",
  icon: _fa.FaHandSparkles,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Flash_Cards.webp",
  name: "AI Flash Cards",
  description: "Turn any text or PDF into pedagogical flashcards.",
  icon: _fa.FaFileAlt,
  category: "Education"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Group_Photo.webp",
  name: "AI Group Photo",
  description: "Seamlessly combine individual portraits into a group photo.",
  icon: _fa.FaImage,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Tattoo_Try_On.webp",
  name: "AI Tattoo Try-On",
  description: "Visualize tattoos on your body before getting inked.",
  icon: _fa.FaHandSparkles,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Hair_Style_Simulator.webp",
  name: "AI Hair Style Simulator",
  description: "Try on new haircuts and colors with zero commitment.",
  icon: _fa.FaHandSparkles,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Kids_to_Adult_Prediction.webp",
  name: "AI Kids-to-Adult Prediction",
  description: "Ever wonder what your kid will look like as an adult?",
  icon: _fa.FaImage,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Room_Declutter.webp",
  name: "AI Room Declutter",
  description: "Instantly clean up messy room photos for listings.",
  icon: _fa.FaHome,
  category: "Real Estate"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Fitness_Body_Simulator.webp",
  name: "AI Fitness Body Simulator",
  description: "Visualize your fitness goals on your own body.",
  icon: _fa.FaImage,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Pet_Portrait.webp",
  name: "AI Pet Portrait",
  description: "Elegant, artistic portraits for your beloved pets.",
  icon: _fa.FaPaw,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Kissing_Video_Generator.webp",
  name: "AI Kissing Video Generator",
  description: "Expressive AI video generation for romantic moments.",
  icon: _fa.FaVideo,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Chat_with_PDF.webp",
  name: "Chat with PDF",
  description: "Ask questions and extract data from massive PDF files.",
  icon: _fa.FaFileAlt,
  category: "Productivity"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Travel_Studio.png",
  name: "AI Travel Studio",
  description: "Create stunning travel posters and visuals from prompts.",
  icon: _fa.FaMapMarkerAlt,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Prompt_Architect.webp",
  name: "Prompt Architect",
  description: "Refine and optimize complex prompts for high-tier AI models.",
  icon: _fa.FaMagic,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/ClearMark_AI.webp",
  name: "ClearMark AI",
  description: "Automated watermark removal and brand cleanup for assets.",
  icon: _fa.FaImage,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/PlantVision_AI.webp",
  name: "PlantVision AI",
  description: "Identify plants and generate gardening care guides.",
  icon: _fa.FaHandSparkles,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Wedding_Photo.png",
  name: "AI Wedding Photo",
  description: "Cinematic wedding photography enhancements and filters.",
  icon: _fa.FaImage,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/User_Account_Registration_Form.webp",
  name: "User Account Registration Form",
  description: "Beautiful, conversion-optimized signup flows.",
  icon: _fa.FaBriefcase,
  category: "Development"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Social_Post.webp",
  name: "Social Post",
  description: "AI-generated social media scheduling and copy creator.",
  icon: _fa.FaBriefcase,
  category: "Marketing"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/MagicSelf_AI.webp",
  name: "MagicSelf AI",
  description: "The ultimate AI selfie and avatar generation engine.",
  icon: _fa.FaMagic,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Resume_Builder.webp",
  name: "AI Resume Builder",
  description: "Craft the perfect, ATS-friendly resume in seconds.",
  icon: _fa.FaFileAlt,
  category: "Productivity"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/GEO_Checker.webp",
  name: "GEO Checker",
  description: "AI-powered location tagging and geodata validation.",
  icon: _fa.FaMapMarkerAlt,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Character_Studio.webp",
  name: "AI Character Studio",
  description: "Consistent character design for animators and writers.",
  icon: _fa.FaUserTie,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Luxury_Hair_Studio.webp",
  name: "Luxury Hair Studio",
  description: "High-end hair visualization for top-tier salons.",
  icon: _fa.FaHandSparkles,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/ProFlow_Plumbing.webp",
  name: "ProFlow Plumbing",
  description: "AI scheduling and diagnostics for plumbing services.",
  icon: _fa.FaHome,
  category: "Services"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Solace_AI.webp",
  name: "Solace AI",
  description: "Empathetic AI assistant for mental well-being support.",
  icon: _fa.FaHandSparkles,
  category: "Health"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/ReLive_AI.webp",
  name: "ReLive AI",
  description: "Immersive memory and historical visualization engine.",
  icon: _fa.FaHandSparkles,
  category: "Creative"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/AI_Chiropractic_Service.webp",
  name: "AI Chiropractic Service",
  description: "Postural analysis and exercise recommendation AI.",
  icon: _fa.FaUserInjured,
  category: "Health"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Tabla___ReserveAI.webp",
  name: "Tabla - ReserveAI",
  description: "Intelligent table reservation engine for restaurants.",
  icon: _fa.FaBuilding,
  category: "Services"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Dental_ReserveAI.webp",
  name: "Dental ReserveAI",
  description: "Smart dental appointment and follow-up management.",
  icon: _fa.FaStethoscope,
  category: "Health"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/CounselMate.webp",
  name: "CounselMate",
  description: "Legal research and document drafting aid for lawyers.",
  icon: _fa.FaBalanceScale,
  category: "Legal"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Intelligent_Real_Estate_Agent.webp",
  name: "Intelligent Real Estate Agent",
  description: "Automate leads and property matches with AI agents.",
  icon: _fa.FaHome,
  category: "Real Estate"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Fixera.webp",
  name: "Fixera",
  description: "Home repair diagnosis and pro-finding ecosystem.",
  icon: _fa.FaHome,
  category: "Services"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Velora___Yoga_AI.webp",
  name: "Velora - Yoga AI",
  description: "Personalized AI yoga and posture guidance engine.",
  icon: _fa.FaHandSparkles,
  category: "Health"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Nova_AssuranceAI.webp",
  name: "Nova AssuranceAI",
  description: "Smart insurance quote and claim processing assistant.",
  icon: _fa.FaBalanceScale,
  category: "Legal"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/TurboGlow_Auto_Spa.webp",
  name: "TurboGlow Auto Spa",
  description: "AI booking and customization for luxury auto detailing.",
  icon: _fa.FaCar,
  category: "Services"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Paws___Pals.webp",
  name: "Paws & Pals",
  description: "AI-powered pet care and walking coordination hub.",
  icon: _fa.FaPaw,
  category: "Lifestyle"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Vertex_Tax_Strategy.webp",
  name: "Vertex Tax Strategy",
  description: "Intelligent tax planning and deduction spotting AI.",
  icon: _fa.FaBalanceScale,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/LedgerSync.webp",
  name: "LedgerSync",
  description: "Automated bookkeeping and financial reconciliations.",
  icon: _fa.FaBriefcase,
  category: "Business"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Nova_Care_Clinic.webp",
  name: "Nova Care Clinic",
  description: "Patient scheduling and medical intake automation.",
  icon: _fa.FaStethoscope,
  category: "Health"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Opulent_Drive.webp",
  name: "Opulent Drive",
  description: "Luxury car rental and fleet management AI.",
  icon: _fa.FaCar,
  category: "Services"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/ProFix_Auto.webp",
  name: "ProFix Auto",
  description: "Engine diagnostics and preventive maintenance alerts.",
  icon: _fa.FaCar,
  category: "Services"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/TowMate.webp",
  name: "TowMate",
  description: "Smart roadside assistance and dispatch coordination.",
  icon: _fa.FaTruck,
  category: "Services"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/SwiftLink_Logistics.webp",
  name: "SwiftLink Logistics",
  description: "AI route optimization and fleet tracking system.",
  icon: _fa.FaTruck,
  category: "Services"
}, {
  thumbnail: "https://cdn.muapi.ai/apps/Lumea_Residence.webp",
  name: "Lumea Residence",
  description: "Smart home property management and tenant portal.",
  icon: _fa.FaHome,
  category: "Real Estate"
}];
function AppsStudio(_ref) {
  var apiKey = _ref.apiKey;
  var _useState = (0, _react.useState)(null),
    _useState2 = _slicedToArray(_useState, 2),
    selectedApp = _useState2[0],
    setSelectedApp = _useState2[1];
  var _useState3 = (0, _react.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    isRequesting = _useState4[0],
    setIsRequesting = _useState4[1];
  var _useState5 = (0, _react.useState)([]),
    _useState6 = _slicedToArray(_useState5, 2),
    requestedApps = _useState6[0],
    setRequestedApps = _useState6[1];
  (0, _react.useEffect)(function () {
    if (apiKey) {
      (0, _muapi.getAppInterests)(apiKey).then(setRequestedApps)["catch"](function (err) {
        return console.error("Error fetching interests:", err);
      });
    }
  }, [apiKey]);
  var handleRequestAccess = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!selectedApp || !apiKey)) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setIsRequesting(true);
            _context.p = 2;
            _context.n = 3;
            return (0, _muapi.registerAppInterest)(apiKey, selectedApp.name);
          case 3:
            setRequestedApps(function (prev) {
              return [].concat(_toConsumableArray(prev), [selectedApp.name]);
            });
            _reactHotToast["default"].success("Got it! We'll send you the template details shortly.");
            setTimeout(function () {
              return setSelectedApp(null);
            }, 1500);
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            console.error(_t);
            _reactHotToast["default"].error("Failed to register interest. Please try again later.");
          case 5:
            _context.p = 5;
            setIsRequesting(false);
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4, 5, 6]]);
    }));
    return function handleRequestAccess() {
      return _ref2.apply(this, arguments);
    };
  }();
  var renderAppCard = function renderAppCard(app) {
    var isDummy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    // Premium Vibrant Gradients for placeholders
    var gradients = ["from-blue-600/20 to-indigo-600/20", "from-purple-600/20 to-pink-600/20", "from-amber-500/20 to-orange-600/20", "from-emerald-500/20 to-teal-600/20", "from-rose-500/20 to-red-600/20", "from-cyan-500/20 to-blue-600/20"];
    var cardGradient = gradients[index % gradients.length];
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "group bg-[#0a0a0a] border border-white/5 rounded-lg flex flex-col overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-[#0f0f0f] hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "relative h-44 w-full overflow-hidden bg-white/5",
        children: [app.thumbnail ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: app.thumbnail,
          alt: app.name,
          className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-full h-full flex items-center justify-center bg-gradient-to-br ".concat(cardGradient, " transition-colors group-hover:scale-110 duration-700"),
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(app.icon, {
            className: "text-4xl opacity-20 group-hover:opacity-40 transition-opacity text-white"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "p-5 flex flex-col flex-1 space-y-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg text-[#22d3ee] border border-white/5 group-hover:border-white/10 transition-colors",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)(app.icon, {})
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex-1 min-w-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
              className: "text-sm font-bold text-white uppercase tracking-tight truncate",
              children: app.name
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-[10px] text-white/40 font-bold uppercase tracking-widest",
              children: app.category || 'Template'
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-xs text-white/50 leading-relaxed font-medium line-clamp-2 min-h-[2.5rem]",
          children: app.description
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex items-center gap-2 pt-2",
          children: isDummy ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick() {
                return setSelectedApp(app);
              },
              className: "flex-1 py-2 bg-white/5 text-white rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/5 active:scale-95",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_fa.FaGithub, {
                className: "text-xs"
              }), "Github"]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick() {
                return setSelectedApp(app);
              },
              className: "flex-1 py-2 bg-[#22d3ee]/10 text-[#22d3ee] rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#22d3ee]/20 transition-all border border-[#22d3ee]/20 active:scale-95",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_fa.FaExternalLinkAlt, {
                className: "text-[9px]"
              }), "Demo"]
            })]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("a", {
              href: app.repo || '#',
              target: "_blank",
              rel: "noopener noreferrer",
              className: "flex-1 py-2 bg-white/5 text-white rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/5 active:scale-95",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_fa.FaGithub, {
                className: "text-xs"
              }), "Github"]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("a", {
              href: app.hosted || '#',
              target: "_blank",
              rel: "noopener noreferrer",
              className: "flex-1 py-2 bg-[#22d3ee]/10 text-[#22d3ee] rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#22d3ee]/20 transition-all border border-[#22d3ee]/20 active:scale-95",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_fa.FaExternalLinkAlt, {
                className: "text-[9px]"
              }), "Demo"]
            })]
          })
        })]
      })]
    }, app.name);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "h-full w-full flex flex-col items-center bg-[#030303] overflow-y-auto custom-scrollbar relative",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactHotToast.Toaster, {
      position: "bottom-right",
      reverseOrder: false
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col gap-10 items-center w-full max-w-7xl pt-12 pb-24 px-6",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "text-center space-y-6 max-w-3xl",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "inline-flex items-center gap-2 px-3 py-1.5 bg-[#22d3ee]/10 border border-[#22d3ee]/20 rounded-full",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_fa.FaDollarSign, {
            className: "text-[#22d3ee] text-xs"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[10px] font-black text-[#22d3ee] uppercase tracking-widest",
            children: "Revenue-Ready Templates"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("h1", {
          className: "text-5xl font-black text-white tracking-tighter leading-[0.9]",
          children: ["LAUNCH AN AI APP.", /*#__PURE__*/(0, _jsxRuntime.jsx)("br", {}), "START EARNING TODAY."]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-sm font-medium leading-relaxed max-w-xl mx-auto",
          children: "Each template is a fully-functional, Stripe-integrated AI SaaS you can deploy in minutes. Charge your users, keep the revenue \u2014 muapi handles the AI infrastructure."
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-full grid grid-cols-1 sm:grid-cols-3 gap-4",
        children: [{
          icon: _fa.FaRocket,
          step: "01",
          title: "Deploy in Minutes",
          body: "Fork the open-source template, add your muapi key, and push to Vercel. No backend setup needed."
        }, {
          icon: _fa.FaCreditCard,
          step: "02",
          title: "Collect Payments",
          body: "Stripe is pre-wired. Set your own pricing — one-time credits, subscriptions, or pay-per-use."
        }, {
          icon: _fa.FaDollarSign,
          step: "03",
          title: "Keep the Revenue",
          body: "Payments go straight to your Stripe account. You own the product, the brand, and the profits."
        }].map(function (_ref3) {
          var Icon = _ref3.icon,
            step = _ref3.step,
            title = _ref3.title,
            body = _ref3.body;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-start gap-4 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-12 h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-[#22d3ee] border border-white/5",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)(Icon, {
                className: "text-lg"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
                className: "text-[10px] font-black text-white/30 uppercase tracking-widest mb-1",
                children: ["Step ", step]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
                className: "text-sm font-bold text-white mb-1.5",
                children: title
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-xs text-white/40 leading-relaxed font-medium",
                children: body
              })]
            })]
          }, step);
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full pt-8",
        children: [templateApps.map(function (app, index) {
          return renderAppCard(app, false, index);
        }), dummyAppsData.map(function (app, index) {
          return renderAppCard(app, true, index + templateApps.length);
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "pt-24 pb-12 flex flex-col items-center gap-4",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "block w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[9px] font-black text-white/40 uppercase tracking-widest",
            children: "Muapi Ecosystem \u2014 More templates coming soon"
          })]
        })
      })]
    }), selectedApp && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "fixed inset-0 z-[100] flex items-center justify-center px-6",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in",
        onClick: function onClick() {
          return setSelectedApp(null);
        }
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl p-8 space-y-8 animate-scale-up shadow-2xl",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col items-center text-center space-y-4",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-20 h-20 rounded-[28px] bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center text-4xl text-[#22d3ee] mb-2",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)(selectedApp.icon, {})
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("h2", {
            className: "text-2xl font-black text-white uppercase tracking-tight",
            children: ["Deploy ", selectedApp.name]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
            className: "text-sm font-medium text-white/40 leading-relaxed px-4",
            children: ["Enter your details and we'll send you the ", /*#__PURE__*/(0, _jsxRuntime.jsx)("b", {
              children: selectedApp.name
            }), " template along with setup instructions so you can deploy and start earning immediately."]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: handleRequestAccess,
            disabled: isRequesting,
            className: "w-full py-4 bg-[#22d3ee] text-black rounded-md text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#22d3ee]/90 transition-all shadow-lg active:scale-95 disabled:opacity-50",
            children: isRequesting ? 'Sending Details...' : 'Get Template'
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setSelectedApp(null);
            },
            className: "w-full py-4 bg-white/5 border border-white/10 text-white/60 rounded-md text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all",
            children: "Maybe Later"
          })]
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("style", {
      jsx: true,
      global: true,
      children: "\n        @keyframes fadeIn {\n          from { opacity: 0; }\n          to { opacity: 1; }\n        }\n        @keyframes scaleUp {\n          from { opacity: 0; transform: scale(0.95) translateY(10px); }\n          to { opacity: 1; transform: scale(1) translateY(0); }\n        }\n        .animate-fade-in { animation: fadeIn 0.3s ease-out; }\n        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }\n      "
    })]
  });
}