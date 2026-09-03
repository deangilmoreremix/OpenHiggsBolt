"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = LayersStudio;
var _react = require("react");
var _reactHotToast = _interopRequireWildcard(require("react-hot-toast"));
var _muapi = require("../muapi.js");
var _formatError = require("../utils/formatError.js");
var _layersStudio = _interopRequireDefault(require("../messages/en/layersStudio.json"));
var _i18nUtils = require("../i18nUtils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t0 in e) "default" !== _t0 && {}.hasOwnProperty.call(e, _t0) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t0)) && (i.get || i.set) ? o(f, _t0, i) : f[_t0] = e[_t0]); return f; })(e, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; } // Upscale Models Definition from schema_data.json
var UPSCALE_MODELS = [{
  id: "topaz-image-upscale",
  name: "Topaz",
  subtitle: "The default model for general-purpose...",
  cost: "1.0"
}, {
  id: "seedvr2-image-upscale",
  name: "SeedVR2",
  subtitle: "Diffusion-transformer super-resolution (up to 8K)",
  cost: "0.02"
}, {
  id: "ai-image-upscaler",
  name: "AI Upscaler",
  subtitle: "Fast 1-click automatic super-resolution",
  cost: "1.0"
}];

// Sample initial image & decomposed layers for demonstration (Seedream Wild Beauty via CDN)
var DEFAULT_SAMPLE_IMAGE = "https://cdn.muapi.ai/assets/1786019968051_cKRYLHHu.png";
var DEFAULT_SAMPLE_LAYERS = ["https://cdn.muapi.ai/assets/1786021161819_iOe80bNR.webp", "https://cdn.muapi.ai/assets/1786020452731_mB4m6NFR.webp", "https://cdn.muapi.ai/assets/1786021169234_iyVccSAA.webp", "https://cdn.muapi.ai/assets/1786021154170_Dx9snemT.webp", "https://cdn.muapi.ai/assets/1786021150882_p9lgz4lY.webp"];

// Preset colors for Marker & Shapes tool
var PRESET_COLORS = ["#ffffff",
// White
"#22c55e",
// Green
"#eab308",
// Yellow
"#ef4444",
// Red
"#14b8a6",
// Turquoise
"#38bdf8",
// Sky Blue
"#ec4899",
// Pink
"#000000" // Black
];
var DEFAULT_COLOR_GRADING = {
  colorCorrect: {
    temp: 0,
    hue: 0.0,
    saturation: 0,
    contrast: 0,
    splitTone: 0.0
  },
  softenDetails: {
    radius: 0,
    detail: 0.0
  },
  bloom: {
    radius: 0,
    bright: 4.0,
    fade: 0.0,
    blend: "Screen"
  },
  halation: {
    strength: 0.0,
    threshold: 0.0,
    radius: 0
  },
  lensInstructions: {
    strength: 0.0,
    radius: 0,
    vignette: 0.0,
    distortion: 0.0
  },
  exposure: {
    stops: 0.0
  },
  filmGrain: {
    strength: 0.0,
    bias: 0.0,
    size: "16mm"
  }
};
function LayersStudio(_ref) {
  var _UPSCALE_MODELS$find, _UPSCALE_MODELS$find2;
  var apiKey = _ref.apiKey,
    droppedFiles = _ref.droppedFiles,
    onFilesHandled = _ref.onFilesHandled,
    onGenerationStart = _ref.onGenerationStart,
    onGenerationEnd = _ref.onGenerationEnd,
    onGenerationComplete = _ref.onGenerationComplete,
    onGenerationError = _ref.onGenerationError,
    _ref$locale = _ref.locale,
    locale = _ref$locale === void 0 ? "en" : _ref$locale;
  var copy = (0, _i18nUtils.resolveCopy)(_layersStudio["default"], null, locale);

  // Main canvas & image state
  var _useState = (0, _react.useState)(DEFAULT_SAMPLE_IMAGE),
    _useState2 = _slicedToArray(_useState, 2),
    currentImageUrl = _useState2[0],
    setCurrentImageUrl = _useState2[1];
  var _useState3 = (0, _react.useState)(""),
    _useState4 = _slicedToArray(_useState3, 2),
    prompt = _useState4[0],
    setPrompt = _useState4[1];
  var _useState5 = (0, _react.useState)(false),
    _useState6 = _slicedToArray(_useState5, 2),
    isProcessing = _useState6[0],
    setIsProcessing = _useState6[1];
  var _useState7 = (0, _react.useState)(0),
    _useState8 = _slicedToArray(_useState7, 2),
    progress = _useState8[0],
    setProgress = _useState8[1];

  // Layer Decomposition Sidebar Settings
  var _useState9 = (0, _react.useState)("1K"),
    _useState0 = _slicedToArray(_useState9, 2),
    resolution = _useState0[0],
    setResolution = _useState0[1]; // '1K' | '1.5K' | '2K'
  var _useState1 = (0, _react.useState)(8),
    _useState10 = _slicedToArray(_useState1, 2),
    layerCount = _useState10[0],
    setLayerCount = _useState10[1];
  var _useState11 = (0, _react.useState)("png"),
    _useState12 = _slicedToArray(_useState11, 2),
    outputFormat = _useState12[0],
    setOutputFormat = _useState12[1];

  // Upscale Clean Panel State
  var _useState13 = (0, _react.useState)("topaz-image-upscale"),
    _useState14 = _slicedToArray(_useState13, 2),
    upscaleModel = _useState14[0],
    setUpscaleModel = _useState14[1];
  var _useState15 = (0, _react.useState)(false),
    _useState16 = _slicedToArray(_useState15, 2),
    isModelDropdownOpen = _useState16[0],
    setIsModelDropdownOpen = _useState16[1];
  var _useState17 = (0, _react.useState)(1),
    _useState18 = _slicedToArray(_useState17, 2),
    topazFactor = _useState18[0],
    setTopazFactor = _useState18[1];
  var _useState19 = (0, _react.useState)("4k"),
    _useState20 = _slicedToArray(_useState19, 2),
    seedvrResolution = _useState20[0],
    setSeedvrResolution = _useState20[1];

  // Color Grading State (Individual Category Resets, No Toggles)
  var _useState21 = (0, _react.useState)(DEFAULT_COLOR_GRADING),
    _useState22 = _slicedToArray(_useState21, 2),
    colorGrading = _useState22[0],
    setColorGrading = _useState22[1];

  // Accordion open/close state for Color Grading sections
  var _useState23 = (0, _react.useState)({
      colorCorrect: true,
      softenDetails: true,
      bloom: true,
      halation: true,
      lensInstructions: true,
      exposure: true,
      filmGrain: true
    }),
    _useState24 = _slicedToArray(_useState23, 2),
    openSections = _useState24[0],
    setOpenSections = _useState24[1];

  // Active Tool state: 'pointer' | 'hand' | 'lasso' | 'regional-edit' | 'draw' | 'eraser' | 'shapes'
  var _useState25 = (0, _react.useState)("pointer"),
    _useState26 = _slicedToArray(_useState25, 2),
    activeTool = _useState26[0],
    setActiveTool = _useState26[1];

  // Viewport Zoom & Pan
  var _useState27 = (0, _react.useState)(100),
    _useState28 = _slicedToArray(_useState27, 2),
    zoomLevel = _useState28[0],
    setZoomLevel = _useState28[1];
  var _useState29 = (0, _react.useState)({
      x: 0,
      y: 0
    }),
    _useState30 = _slicedToArray(_useState29, 2),
    panOffset = _useState30[0],
    setPanOffset = _useState30[1];
  var _useState31 = (0, _react.useState)(false),
    _useState32 = _slicedToArray(_useState31, 2),
    isPanning = _useState32[0],
    setIsPanning = _useState32[1];
  var _useState33 = (0, _react.useState)({
      x: 0,
      y: 0
    }),
    _useState34 = _slicedToArray(_useState33, 2),
    panStart = _useState34[0],
    setPanStart = _useState34[1];

  // 1. FREEHAND LASSO EDIT STATE
  var _useState35 = (0, _react.useState)([]),
    _useState36 = _slicedToArray(_useState35, 2),
    lassoPoints = _useState36[0],
    setLassoPoints = _useState36[1];
  var _useState37 = (0, _react.useState)(false),
    _useState38 = _slicedToArray(_useState37, 2),
    isDraggingLasso = _useState38[0],
    setIsDraggingLasso = _useState38[1];

  // 2. RECTANGULAR REGIONAL EDIT BOX STATE
  var _useState39 = (0, _react.useState)({
      x: 25,
      y: 35,
      width: 50,
      height: 30
    }),
    _useState40 = _slicedToArray(_useState39, 2),
    regionalBox = _useState40[0],
    setRegionalBox = _useState40[1];
  var _useState41 = (0, _react.useState)(false),
    _useState42 = _slicedToArray(_useState41, 2),
    isSelectingRegion = _useState42[0],
    setIsSelectingRegion = _useState42[1];
  var _useState43 = (0, _react.useState)(null),
    _useState44 = _slicedToArray(_useState43, 2),
    dragStartRegion = _useState44[0],
    setDragStartRegion = _useState44[1];

  // Floating Regional/Lasso Prompt State
  var _useState45 = (0, _react.useState)(""),
    _useState46 = _slicedToArray(_useState45, 2),
    regionalPrompt = _useState46[0],
    setRegionalPrompt = _useState46[1];

  // 3. MARKED REGIONS STACK FOR SEEDREAM 5 PRO BBOX LAYER PROMPTING
  var _useState47 = (0, _react.useState)([]),
    _useState48 = _slicedToArray(_useState47, 2),
    markedRegions = _useState48[0],
    setMarkedRegions = _useState48[1];

  // 4. SHAPES (R) TOOL STATE
  var _useState49 = (0, _react.useState)("rect"),
    _useState50 = _slicedToArray(_useState49, 2),
    activeShape = _useState50[0],
    setActiveShape = _useState50[1];
  var _useState51 = (0, _react.useState)("#ffffff"),
    _useState52 = _slicedToArray(_useState51, 2),
    shapeColor = _useState52[0],
    setShapeColor = _useState52[1];
  var _useState53 = (0, _react.useState)(3),
    _useState54 = _slicedToArray(_useState53, 2),
    shapeSize = _useState54[0],
    setShapeSize = _useState54[1];
  var _useState55 = (0, _react.useState)(false),
    _useState56 = _slicedToArray(_useState55, 2),
    isDrawingShape = _useState56[0],
    setIsDrawingShape = _useState56[1];
  var _useState57 = (0, _react.useState)({
      x: 0,
      y: 0
    }),
    _useState58 = _slicedToArray(_useState57, 2),
    shapeStart = _useState58[0],
    setShapeStart = _useState58[1];
  var tempCanvasImageData = (0, _react.useRef)(null);

  // 5. DRAWING / MARKER PEN STATE
  var _useState59 = (0, _react.useState)("#ef4444"),
    _useState60 = _slicedToArray(_useState59, 2),
    brushColor = _useState60[0],
    setBrushColor = _useState60[1];
  var _useState61 = (0, _react.useState)(8),
    _useState62 = _slicedToArray(_useState61, 2),
    brushSize = _useState62[0],
    setBrushSize = _useState62[1];
  var _useState63 = (0, _react.useState)(false),
    _useState64 = _slicedToArray(_useState63, 2),
    isDrawing = _useState64[0],
    setIsDrawing = _useState64[1];

  // Right Inspector Panel State: 'layer-decomposition' | 'upscale' | 'color-grading' | 'remove-bg' | 'expand-crop' | 'menu' | etc.
  var _useState65 = (0, _react.useState)("layer-decomposition"),
    _useState66 = _slicedToArray(_useState65, 2),
    activeSideTab = _useState66[0],
    setActiveSideTab = _useState66[1];
  var _useState67 = (0, _react.useState)(true),
    _useState68 = _slicedToArray(_useState67, 2),
    isSidebarOpen = _useState68[0],
    setIsSidebarOpen = _useState68[1];

  // Tool Specific Inputs
  var _useState69 = (0, _react.useState)(""),
    _useState70 = _slicedToArray(_useState69, 2),
    textEditPrompt = _useState70[0],
    setTextEditPrompt = _useState70[1];

  // Upload & Decomposed Layers State
  var _useState71 = (0, _react.useState)(false),
    _useState72 = _slicedToArray(_useState71, 2),
    uploading = _useState72[0],
    setUploading = _useState72[1];
  var _useState73 = (0, _react.useState)(0),
    _useState74 = _slicedToArray(_useState73, 2),
    uploadProgress = _useState74[0],
    setUploadProgress = _useState74[1];
  var _useState75 = (0, _react.useState)([]),
    _useState76 = _slicedToArray(_useState75, 2),
    decomposedLayers = _useState76[0],
    setDecomposedLayers = _useState76[1];
  var _useState77 = (0, _react.useState)(0),
    _useState78 = _slicedToArray(_useState77, 2),
    carouselIndex = _useState78[0],
    setCarouselIndex = _useState78[1];
  var _useState79 = (0, _react.useState)({}),
    _useState80 = _slicedToArray(_useState79, 2),
    visibleLayers = _useState80[0],
    setVisibleLayers = _useState80[1];
  var _useState81 = (0, _react.useState)(false),
    _useState82 = _slicedToArray(_useState81, 2),
    isSoloMode = _useState82[0],
    setIsSoloMode = _useState82[1];

  // Canvas Refs
  var fileInputRef = (0, _react.useRef)(null);
  var drawingCanvasRef = (0, _react.useRef)(null);
  var imageRef = (0, _react.useRef)(null);
  var imageWrapperRef = (0, _react.useRef)(null);
  var canvasContainerRef = (0, _react.useRef)(null);

  // Drag & Drop Upload State
  var _useState83 = (0, _react.useState)(false),
    _useState84 = _slicedToArray(_useState83, 2),
    isDropzoneDragging = _useState84[0],
    setIsDropzoneDragging = _useState84[1];
  var dropzoneDragCounterRef = (0, _react.useRef)(0);

  // Drawing History Stack
  var _useState85 = (0, _react.useState)([]),
    _useState86 = _slicedToArray(_useState85, 2),
    historyStack = _useState86[0],
    setHistoryStack = _useState86[1];
  var _useState87 = (0, _react.useState)(-1),
    _useState88 = _slicedToArray(_useState87, 2),
    historyIndex = _useState88[0],
    setHistoryIndex = _useState88[1];

  // Handle external dropped files passed from parent shell
  (0, _react.useEffect)(function () {
    if (droppedFiles && droppedFiles.length > 0) {
      var file = droppedFiles[0];
      if (file.type.startsWith("image/")) {
        handleUploadFile(file);
        if (onFilesHandled) onFilesHandled();
      }
    }
  }, [droppedFiles, onFilesHandled]);

  // Sync drawing canvas overlay resolution with displayed image
  var syncCanvasDimensions = (0, _react.useCallback)(function () {
    var canvas = drawingCanvasRef.current;
    var img = imageRef.current;
    if (canvas && img && img.complete) {
      canvas.width = img.naturalWidth || img.clientWidth || 1024;
      canvas.height = img.naturalHeight || img.clientHeight || 1024;
    }
  }, []);
  (0, _react.useEffect)(function () {
    syncCanvasDimensions();
  }, [currentImageUrl, syncCanvasDimensions]);

  // Live CSS Filter computation from Color Grading settings
  var getColorGradingCSSFilter = function getColorGradingCSSFilter() {
    var filterStr = "";
    var colorCorrect = colorGrading.colorCorrect,
      exposure = colorGrading.exposure,
      softenDetails = colorGrading.softenDetails,
      bloom = colorGrading.bloom,
      halation = colorGrading.halation;

    // Exposure (stops: -5..5 -> brightness multiplier 2^stops)
    if (exposure.stops !== 0) {
      var expBrightness = Math.max(0, Math.pow(2, exposure.stops) * 100);
      filterStr += "brightness(".concat(expBrightness, "%) ");
    }

    // Color Correct (contrast, saturation, hue, temp, splitTone)
    if (colorCorrect.contrast !== 0) {
      filterStr += "contrast(".concat(100 + colorCorrect.contrast, "%) ");
    }
    if (colorCorrect.saturation !== 0) {
      filterStr += "saturate(".concat(100 + colorCorrect.saturation, "%) ");
    }
    if (colorCorrect.hue !== 0) {
      filterStr += "hue-rotate(".concat(colorCorrect.hue, "deg) ");
    }
    if (colorCorrect.temp !== 0) {
      if (colorCorrect.temp > 0) {
        filterStr += "sepia(".concat(colorCorrect.temp * 0.45, "%) saturate(").concat(100 + colorCorrect.temp * 0.3, "%) ");
      } else {
        filterStr += "hue-rotate(".concat(colorCorrect.temp * 0.5, "deg) saturate(").concat(100 + Math.abs(colorCorrect.temp) * 0.2, "%) ");
      }
    }
    if (colorCorrect.splitTone > 0) {
      filterStr += "saturate(".concat(100 + colorCorrect.splitTone * 40, "%) contrast(").concat(100 + colorCorrect.splitTone * 20, "%) ");
    }

    // Soften Details (blur)
    if (softenDetails.radius > 0) {
      filterStr += "blur(".concat(softenDetails.radius * 0.25, "px) ");
    }

    // Bloom (glow / brightness halo)
    if (bloom.radius > 0 || bloom.bright !== 4.0) {
      var bloomOpacity = bloom.bright / 10 * (1 - bloom.fade) * 0.45;
      if (bloomOpacity > 0) {
        filterStr += "drop-shadow(0 0 ".concat(bloom.radius || 8, "px rgba(255,255,255,").concat(bloomOpacity, ")) ");
      }
    }

    // Halation (red edge glow around highlights)
    if (halation.strength > 0) {
      filterStr += "drop-shadow(0 0 ".concat(halation.radius || 6, "px rgba(255, 45, 30, ").concat(halation.strength * 0.85, ")) ");
    }
    return filterStr.trim() || "none";
  };

  // Upload File Helper
  var handleUploadFile = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(file) {
      var uploadedUrl, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (apiKey) {
              _context.n = 1;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.enterApiKeyUpload);
            return _context.a(2);
          case 1:
            setUploading(true);
            setUploadProgress(0);
            _context.p = 2;
            _context.n = 3;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              return setUploadProgress(pct);
            });
          case 3:
            uploadedUrl = _context.v;
            setCurrentImageUrl(uploadedUrl);
            setDecomposedLayers([]);
            setMarkedRegions([]);
            setCarouselIndex(0);
            setLassoPoints([]);
            clearDrawingCanvas();
            _reactHotToast["default"].success(copy.toasts.imageUploaded);
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            _reactHotToast["default"].error(copy.toasts.uploadFailed.replace('{error}', (0, _formatError.formatErrorMessage)(_t)));
          case 5:
            _context.p = 5;
            setUploading(false);
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4, 5, 6]]);
    }));
    return function handleUploadFile(_x) {
      return _ref2.apply(this, arguments);
    };
  }();

  // Shared entry point for both click-to-browse and drag-and-drop uploads
  var handleFiles = function handleFiles(files) {
    var fileList = Array.from(files || []);
    if (fileList.length === 0) return;
    var MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
    var file = fileList.find(function (f) {
      return f.type.startsWith("image/");
    }) || fileList[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      _reactHotToast["default"].error(copy.toasts.uploadImageFileOnly);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      _reactHotToast["default"].error(copy.toasts.fileTooLarge.replace('{name}', file.name));
      return;
    }
    handleUploadFile(file);
  };
  var handleFileInputChange = function handleFileInputChange(e) {
    handleFiles(e.target.files);
    e.target.value = "";
  };
  var handleDropzoneDragEnter = function handleDropzoneDragEnter(e) {
    var _e$dataTransfer;
    e.preventDefault();
    e.stopPropagation();
    dropzoneDragCounterRef.current += 1;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDropzoneDragging(true);
    }
  };
  var handleDropzoneDragLeave = function handleDropzoneDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropzoneDragCounterRef.current -= 1;
    if (dropzoneDragCounterRef.current <= 0) {
      dropzoneDragCounterRef.current = 0;
      setIsDropzoneDragging(false);
    }
  };
  var handleDropzoneDragOver = function handleDropzoneDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  var handleDropzoneDrop = function handleDropzoneDrop(e) {
    var _e$dataTransfer2;
    e.preventDefault();
    e.stopPropagation();
    dropzoneDragCounterRef.current = 0;
    setIsDropzoneDragging(false);
    var files = (_e$dataTransfer2 = e.dataTransfer) === null || _e$dataTransfer2 === void 0 ? void 0 : _e$dataTransfer2.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Helper to convert mouse/touch events to normalized coordinates (0 to 1000) & percentages
  var getImageNormalizedCoords = function getImageNormalizedCoords(e) {
    var wrapper = imageWrapperRef.current || imageRef.current;
    if (!wrapper) return {
      x: 0,
      y: 0,
      xPct: 0,
      yPct: 0
    };
    var rect = wrapper.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var xPx = Math.max(0, Math.min(rect.width, clientX - rect.left));
    var yPx = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return {
      x: xPx / rect.width * 1000,
      y: yPx / rect.height * 1000,
      xPct: xPx / rect.width * 100,
      yPct: yPx / rect.height * 100
    };
  };

  // --- LASSO, REGIONAL & REAL-TIME SHAPE SELECTION DRAG LOGIC ---
  var handleImageMouseDown = function handleImageMouseDown(e) {
    var coords = getImageNormalizedCoords(e);
    if (activeTool === "lasso") {
      e.stopPropagation();
      setIsDraggingLasso(true);
      setLassoPoints([{
        x: coords.x,
        y: coords.y
      }]);
    } else if (activeTool === "regional-edit") {
      e.stopPropagation();
      setDragStartRegion(coords);
      setIsSelectingRegion(true);
      setRegionalBox({
        x: coords.xPct,
        y: coords.yPct,
        width: 0,
        height: 0
      });
    } else if (activeTool === "shapes") {
      e.stopPropagation();
      setIsDrawingShape(true);
      var canvasCoords = getCanvasCoords(e);
      setShapeStart(canvasCoords);
      var canvas = drawingCanvasRef.current;
      if (canvas) {
        var ctx = canvas.getContext("2d");
        tempCanvasImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    }
  };
  var handleImageMouseMove = function handleImageMouseMove(e) {
    var coords = getImageNormalizedCoords(e);
    if (activeTool === "lasso" && isDraggingLasso) {
      e.stopPropagation();
      setLassoPoints(function (prev) {
        return [].concat(_toConsumableArray(prev), [{
          x: coords.x,
          y: coords.y
        }]);
      });
    } else if (activeTool === "regional-edit" && isSelectingRegion && dragStartRegion) {
      e.stopPropagation();
      var minX = Math.min(dragStartRegion.xPct, coords.xPct);
      var minY = Math.min(dragStartRegion.yPct, coords.yPct);
      var width = Math.abs(coords.xPct - dragStartRegion.xPct);
      var height = Math.abs(coords.yPct - dragStartRegion.yPct);
      setRegionalBox({
        x: minX,
        y: minY,
        width: Math.max(2, width),
        height: Math.max(2, height)
      });
    } else if (activeTool === "shapes" && isDrawingShape) {
      e.stopPropagation();
      var endCoords = getCanvasCoords(e);
      drawLiveShapePreview(shapeStart, endCoords);
    }
  };
  var drawLiveShapePreview = function drawLiveShapePreview(start, end) {
    var canvas = drawingCanvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (tempCanvasImageData.current) {
      ctx.putImageData(tempCanvasImageData.current, 0, 0);
    }
    ctx.beginPath();
    ctx.strokeStyle = shapeColor;
    ctx.fillStyle = shapeColor;
    ctx.lineWidth = shapeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (activeShape === "line") {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (activeShape === "arrow") {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      var angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - 14 * Math.cos(angle - Math.PI / 6), end.y - 14 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(end.x - 14 * Math.cos(angle + Math.PI / 6), end.y - 14 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (activeShape === "rect") {
      var w = end.x - start.x;
      var h = end.y - start.y;
      ctx.strokeRect(start.x, start.y, w, h);
    } else if (activeShape === "circle") {
      var rx = Math.abs(end.x - start.x) / 2;
      var ry = Math.abs(end.y - start.y) / 2;
      var cx = Math.min(start.x, end.x) + rx;
      var cy = Math.min(start.y, end.y) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };
  var handleImageMouseUp = function handleImageMouseUp(e) {
    if (isDraggingLasso) {
      if (e) e.stopPropagation();
      setIsDraggingLasso(false);
      if (lassoPoints.length > 5) {
        var xs = lassoPoints.map(function (p) {
          return p.x;
        });
        var ys = lassoPoints.map(function (p) {
          return p.y;
        });
        var minX = Math.round(Math.min.apply(Math, _toConsumableArray(xs)));
        var minY = Math.round(Math.min.apply(Math, _toConsumableArray(ys)));
        var maxX = Math.round(Math.max.apply(Math, _toConsumableArray(xs)));
        var maxY = Math.round(Math.max.apply(Math, _toConsumableArray(ys)));
        setMarkedRegions(function (prev) {
          return [].concat(_toConsumableArray(prev), [{
            id: Date.now(),
            type: "lasso",
            label: "Layer ".concat(prev.length + 1),
            bbox: {
              xmin: minX,
              ymin: minY,
              xmax: maxX,
              ymax: maxY
            }
          }]);
        });
      }
    }
    if (isSelectingRegion) {
      if (e) e.stopPropagation();
      setIsSelectingRegion(false);
      if (regionalBox.width > 2 && regionalBox.height > 2) {
        var xmin = Math.round(regionalBox.x * 10);
        var ymin = Math.round(regionalBox.y * 10);
        var xmax = Math.round((regionalBox.x + regionalBox.width) * 10);
        var ymax = Math.round((regionalBox.y + regionalBox.height) * 10);
        setMarkedRegions(function (prev) {
          return [].concat(_toConsumableArray(prev), [{
            id: Date.now(),
            type: "region",
            label: "Layer ".concat(prev.length + 1),
            bbox: {
              xmin: xmin,
              ymin: ymin,
              xmax: xmax,
              ymax: ymax
            }
          }]);
        });
      }
    }
    if (isDrawingShape && activeTool === "shapes") {
      if (e) e.stopPropagation();
      setIsDrawingShape(false);
      var endCoords = getCanvasCoords(e);
      drawLiveShapePreview(shapeStart, endCoords);
      tempCanvasImageData.current = null;
      saveCanvasState();
      var canvas = drawingCanvasRef.current;
      if (canvas && canvas.width && canvas.height) {
        var _xmin = Math.round(Math.min(shapeStart.x, endCoords.x) / canvas.width * 1000);
        var _ymin = Math.round(Math.min(shapeStart.y, endCoords.y) / canvas.height * 1000);
        var _xmax = Math.round(Math.max(shapeStart.x, endCoords.x) / canvas.width * 1000);
        var _ymax = Math.round(Math.max(shapeStart.y, endCoords.y) / canvas.height * 1000);
        setMarkedRegions(function (prev) {
          return [].concat(_toConsumableArray(prev), [{
            id: Date.now(),
            type: activeShape,
            label: "Layer ".concat(prev.length + 1),
            bbox: {
              xmin: _xmin,
              ymin: _ymin,
              xmax: _xmax,
              ymax: _ymax
            }
          }]);
        });
      }
    }
  };

  // --- DRAWING CANVAS LOGIC ---
  var saveCanvasState = function saveCanvasState() {
    var canvas = drawingCanvasRef.current;
    if (!canvas) return;
    var dataUrl = canvas.toDataURL();
    var newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(dataUrl);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };
  var clearDrawingCanvas = function clearDrawingCanvas() {
    var canvas = drawingCanvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMarkedRegions([]);
    saveCanvasState();
  };
  var handleUndo = function handleUndo() {
    if (historyIndex > 0) {
      var prevIndex = historyIndex - 1;
      var canvas = drawingCanvasRef.current;
      var ctx = canvas.getContext("2d");
      var img = new Image();
      img.src = historyStack[prevIndex];
      img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(prevIndex);
      };
    } else if (historyIndex === 0) {
      var _canvas = drawingCanvasRef.current;
      var _ctx = _canvas.getContext("2d");
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
      setHistoryIndex(-1);
    }
  };
  var handleRedo = function handleRedo() {
    if (historyIndex < historyStack.length - 1) {
      var nextIndex = historyIndex + 1;
      var canvas = drawingCanvasRef.current;
      var ctx = canvas.getContext("2d");
      var img = new Image();
      img.src = historyStack[nextIndex];
      img.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(nextIndex);
      };
    }
  };
  var getCanvasCoords = function getCanvasCoords(e) {
    var canvas = drawingCanvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };
  var startDrawing = function startDrawing(e) {
    if (activeTool !== "draw" && activeTool !== "eraser") return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    var canvas = drawingCanvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var _getCanvasCoords = getCanvasCoords(e),
      x = _getCanvasCoords.x,
      y = _getCanvasCoords.y;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = brushColor;
    }
  };
  var drawStroke = function drawStroke(e) {
    if (!isDrawing || activeTool !== "draw" && activeTool !== "eraser") return;
    e.preventDefault();
    e.stopPropagation();
    var canvas = drawingCanvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var _getCanvasCoords2 = getCanvasCoords(e),
      x = _getCanvasCoords2.x,
      y = _getCanvasCoords2.y;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  var stopDrawing = function stopDrawing(e) {
    if (isDrawing) {
      if (e) e.stopPropagation();
      setIsDrawing(false);
      saveCanvasState();
    }
  };

  // --- PAN / HAND TOOL LOGIC ---
  var startPan = function startPan(e) {
    if (activeTool !== "hand") return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
  };
  var doPan = function doPan(e) {
    if (!isPanning || activeTool !== "hand") return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };
  var stopPan = function stopPan() {
    setIsPanning(false);
  };
  var resetView = function resetView() {
    setZoomLevel(100);
    setPanOffset({
      x: 0,
      y: 0
    });
    (0, _reactHotToast["default"])(copy.toasts.viewReset);
  };

  // --- REGIONAL & LASSO EDIT AI SUBMIT WITH <bbox> BBOX TAGS ---
  var handleRunRegionalEdit = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var _result$output, bboxTag, xs, ys, minX, minY, maxX, maxY, _minX, _minY, _maxX, _maxY, formattedPrompt, result, rawImages, layerUrls, initialVis, errorMsg, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (apiKey) {
              _context2.n = 1;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.enterApiKey);
            return _context2.a(2);
          case 1:
            if (regionalPrompt) {
              _context2.n = 2;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.enterRegionPrompt);
            return _context2.a(2);
          case 2:
            setIsProcessing(true);
            setProgress(20);
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            _context2.p = 3;
            bboxTag = "";
            if (activeTool === "lasso" && lassoPoints.length > 0) {
              xs = lassoPoints.map(function (p) {
                return p.x;
              });
              ys = lassoPoints.map(function (p) {
                return p.y;
              });
              minX = Math.round(Math.min.apply(Math, _toConsumableArray(xs)));
              minY = Math.round(Math.min.apply(Math, _toConsumableArray(ys)));
              maxX = Math.round(Math.max.apply(Math, _toConsumableArray(xs)));
              maxY = Math.round(Math.max.apply(Math, _toConsumableArray(ys)));
              bboxTag = "<bbox>".concat(minY, " ").concat(minX, " ").concat(maxY, " ").concat(maxX, "</bbox>");
            } else if (activeTool === "regional-edit") {
              _minX = Math.round(regionalBox.x * 10);
              _minY = Math.round(regionalBox.y * 10);
              _maxX = Math.round((regionalBox.x + regionalBox.width) * 10);
              _maxY = Math.round((regionalBox.y + regionalBox.height) * 10);
              bboxTag = "<bbox>".concat(_minY, " ").concat(_minX, " ").concat(_maxY, " ").concat(_maxX, "</bbox>");
            }
            formattedPrompt = bboxTag ? "Modify ".concat(bboxTag, ": ").concat(regionalPrompt) : regionalPrompt;
            _context2.n = 4;
            return (0, _muapi.decomposeLayers)(apiKey, {
              image_url: currentImageUrl,
              prompt: formattedPrompt,
              resolution: resolution,
              output_format: outputFormat
            });
          case 4:
            result = _context2.v;
            setProgress(100);
            rawImages = result.images || ((_result$output = result.output) === null || _result$output === void 0 ? void 0 : _result$output.images) || result.outputs || (result.url ? [result.url] : []);
            layerUrls = Array.isArray(rawImages) ? rawImages : [rawImages];
            if (layerUrls.length > 0) {
              setDecomposedLayers(layerUrls);
              setCarouselIndex(0);
              initialVis = {};
              layerUrls.forEach(function (_, idx) {
                initialVis[idx] = true;
              });
              setVisibleLayers(initialVis);
              _reactHotToast["default"].success("Generated ".concat(layerUrls.length, " layer(s) with Seedream 5 Pro!"));
              onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete(result);
            }
            _context2.n = 6;
            break;
          case 5:
            _context2.p = 5;
            _t2 = _context2.v;
            errorMsg = (0, _formatError.formatErrorMessage)(_t2);
            _reactHotToast["default"].error(copy.toasts.editFailed.replace('{error}', errorMsg));
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(errorMsg);
          case 6:
            _context2.p = 6;
            setIsProcessing(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context2.f(6);
          case 7:
            return _context2.a(2);
        }
      }, _callee2, null, [[3, 5, 6, 7]]);
    }));
    return function handleRunRegionalEdit() {
      return _ref3.apply(this, arguments);
    };
  }();

  // --- HELPER TO CONSTRUCT SEEDREAM 5.0 PRO LAYER DECOMPOSITION PROMPT WITH BBOX ---
  var buildSeedreamLayerPrompt = function buildSeedreamLayerPrompt(rawPrompt) {
    if (rawPrompt && (rawPrompt.includes("<bbox>") || rawPrompt.toLowerCase().includes("split the content"))) {
      return rawPrompt;
    }
    if (markedRegions.length > 0) {
      var numLayers = Math.max(markedRegions.length, layerCount);
      var promptLines = ["Split the content in the image into ".concat(numLayers, " layers:")];
      markedRegions.forEach(function (item, idx) {
        var _item$bbox = item.bbox,
          xmin = _item$bbox.xmin,
          ymin = _item$bbox.ymin,
          xmax = _item$bbox.xmax,
          ymax = _item$bbox.ymax;
        var tag = rawPrompt || "Element ".concat(idx + 1);
        promptLines.push("Layer ".concat(idx + 1, ": ").concat(tag, " <bbox>").concat(xmin, " ").concat(ymin, " ").concat(xmax, " ").concat(ymax, "</bbox>"));
      });
      return promptLines.join("\n");
    }
    return rawPrompt || "Split the content in the image into ".concat(layerCount, " transparent layers by separating foreground subjects, texts, and background elements cleanly.");
  };

  // --- API CALL: SEEDREAM 5.0 PRO LAYER DECOMPOSITION ---
  var handleDecompose = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(overridePrompt) {
      var rawPrompt, finalSeedreamPrompt, _result$output2, progressInterval, result, rawImages, layerUrls, initialVis, errorMsg, _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            rawPrompt = overridePrompt !== undefined ? overridePrompt : prompt;
            finalSeedreamPrompt = buildSeedreamLayerPrompt(rawPrompt);
            if (apiKey) {
              _context3.n = 1;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.apiKeyMissingSet);
            return _context3.a(2);
          case 1:
            if (currentImageUrl) {
              _context3.n = 2;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.uploadOrSelectDecompose);
            return _context3.a(2);
          case 2:
            setIsProcessing(true);
            setProgress(15);
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            _context3.p = 3;
            progressInterval = setInterval(function () {
              setProgress(function (prev) {
                return prev < 90 ? prev + 5 : prev;
              });
            }, 800);
            _context3.n = 4;
            return (0, _muapi.decomposeLayers)(apiKey, {
              image_url: currentImageUrl,
              prompt: finalSeedreamPrompt,
              resolution: resolution,
              output_format: outputFormat
            });
          case 4:
            result = _context3.v;
            clearInterval(progressInterval);
            setProgress(100);
            rawImages = result.images || ((_result$output2 = result.output) === null || _result$output2 === void 0 ? void 0 : _result$output2.images) || result.outputs || (result.url ? [result.url] : []);
            layerUrls = Array.isArray(rawImages) ? rawImages : [rawImages];
            setDecomposedLayers(layerUrls);
            setCarouselIndex(0);
            initialVis = {};
            layerUrls.forEach(function (_, idx) {
              initialVis[idx] = true;
            });
            setVisibleLayers(initialVis);
            _reactHotToast["default"].success(copy.toasts.decomposedInto.replace('{count}', layerUrls.length));
            onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete(result);
            _context3.n = 6;
            break;
          case 5:
            _context3.p = 5;
            _t3 = _context3.v;
            errorMsg = (0, _formatError.formatErrorMessage)(_t3);
            _reactHotToast["default"].error(copy.toasts.decompositionFailed.replace('{error}', errorMsg));
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(errorMsg);
          case 6:
            _context3.p = 6;
            setIsProcessing(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context3.f(6);
          case 7:
            return _context3.a(2);
        }
      }, _callee3, null, [[3, 5, 6, 7]]);
    }));
    return function handleDecompose(_x2) {
      return _ref4.apply(this, arguments);
    };
  }();

  // --- API CALL: UPSCALE IMAGE (seedvr2-image-upscale, topaz-image-upscale, ai-image-upscaler) ---
  var handleRunUpscale = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
      var _result$outputs, _result$output3, _result$output4, _result$output5, progressInterval, result, outputUrl, selectedModelObj, errorMsg, _t4;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (apiKey) {
              _context4.n = 1;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.enterApiKey);
            return _context4.a(2);
          case 1:
            if (currentImageUrl) {
              _context4.n = 2;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.uploadOrSelectUpscale);
            return _context4.a(2);
          case 2:
            setIsProcessing(true);
            setProgress(15);
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            _context4.p = 3;
            progressInterval = setInterval(function () {
              setProgress(function (prev) {
                return prev < 90 ? prev + 5 : prev;
              });
            }, 700);
            _context4.n = 4;
            return (0, _muapi.upscaleImage)(apiKey, {
              model: upscaleModel,
              image_url: currentImageUrl,
              resolution: seedvrResolution,
              upscale_factor: topazFactor
            });
          case 4:
            result = _context4.v;
            clearInterval(progressInterval);
            setProgress(100);
            outputUrl = ((_result$outputs = result.outputs) === null || _result$outputs === void 0 ? void 0 : _result$outputs[0]) || result.url || ((_result$output3 = result.output) === null || _result$output3 === void 0 ? void 0 : _result$output3.image) || ((_result$output4 = result.output) === null || _result$output4 === void 0 || (_result$output4 = _result$output4.images) === null || _result$output4 === void 0 ? void 0 : _result$output4[0]) || ((_result$output5 = result.output) === null || _result$output5 === void 0 ? void 0 : _result$output5.url);
            if (outputUrl) {
              setCurrentImageUrl(outputUrl);
              selectedModelObj = UPSCALE_MODELS.find(function (m) {
                return m.id === upscaleModel;
              });
              _reactHotToast["default"].success(copy.toasts.upscaleSuccess.replace('{model}', (selectedModelObj === null || selectedModelObj === void 0 ? void 0 : selectedModelObj.name) || "AI Upscaler"));
              onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete(result);
            } else {
              _reactHotToast["default"].error(copy.toasts.upscaleNoOutput);
            }
            _context4.n = 6;
            break;
          case 5:
            _context4.p = 5;
            _t4 = _context4.v;
            errorMsg = (0, _formatError.formatErrorMessage)(_t4);
            _reactHotToast["default"].error(copy.toasts.upscaleFailed.replace('{error}', errorMsg));
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(errorMsg);
          case 6:
            _context4.p = 6;
            setIsProcessing(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context4.f(6);
          case 7:
            return _context4.a(2);
        }
      }, _callee4, null, [[3, 5, 6, 7]]);
    }));
    return function handleRunUpscale() {
      return _ref5.apply(this, arguments);
    };
  }();

  // --- API CALL: REMOVE BACKGROUND (ai-background-remover) ---
  var handleRunRemoveBg = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
      var _result$outputs2, _result$output6, _result$output7, _result$output8, progressInterval, result, outputUrl, errorMsg, _t5;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            if (apiKey) {
              _context5.n = 1;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.enterApiKey);
            return _context5.a(2);
          case 1:
            if (currentImageUrl) {
              _context5.n = 2;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.uploadOrSelectRemoveBg);
            return _context5.a(2);
          case 2:
            setIsProcessing(true);
            setProgress(15);
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            _context5.p = 3;
            progressInterval = setInterval(function () {
              setProgress(function (prev) {
                return prev < 90 ? prev + 5 : prev;
              });
            }, 700);
            _context5.n = 4;
            return (0, _muapi.removeBackground)(apiKey, {
              image_url: currentImageUrl
            });
          case 4:
            result = _context5.v;
            clearInterval(progressInterval);
            setProgress(100);
            outputUrl = ((_result$outputs2 = result.outputs) === null || _result$outputs2 === void 0 ? void 0 : _result$outputs2[0]) || result.url || ((_result$output6 = result.output) === null || _result$output6 === void 0 ? void 0 : _result$output6.image) || ((_result$output7 = result.output) === null || _result$output7 === void 0 || (_result$output7 = _result$output7.images) === null || _result$output7 === void 0 ? void 0 : _result$output7[0]) || ((_result$output8 = result.output) === null || _result$output8 === void 0 ? void 0 : _result$output8.url);
            if (outputUrl) {
              setCurrentImageUrl(outputUrl);
              setDecomposedLayers(function (prev) {
                return [outputUrl].concat(_toConsumableArray(prev.filter(function (u) {
                  return u !== outputUrl;
                })));
              });
              setCarouselIndex(0);
              _reactHotToast["default"].success(copy.toasts.removeBgSuccess);
              onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete(result);
            } else {
              _reactHotToast["default"].error(copy.toasts.removeBgNoOutput);
            }
            _context5.n = 6;
            break;
          case 5:
            _context5.p = 5;
            _t5 = _context5.v;
            errorMsg = (0, _formatError.formatErrorMessage)(_t5);
            _reactHotToast["default"].error(copy.toasts.removeBgFailed.replace('{error}', errorMsg));
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(errorMsg);
          case 6:
            _context5.p = 6;
            setIsProcessing(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context5.f(6);
          case 7:
            return _context5.a(2);
        }
      }, _callee5, null, [[3, 5, 6, 7]]);
    }));
    return function handleRunRemoveBg() {
      return _ref6.apply(this, arguments);
    };
  }();

  // --- API CALL: EXPAND / OUTPAINT IMAGE (ai-image-extension) ---
  var handleRunExpand = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
      var _result$outputs3, _result$output9, _result$output0, _result$output1, progressInterval, result, outputUrl, errorMsg, _t6;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.p = _context6.n) {
          case 0:
            if (apiKey) {
              _context6.n = 1;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.enterApiKey);
            return _context6.a(2);
          case 1:
            if (currentImageUrl) {
              _context6.n = 2;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.uploadOrSelectExpand);
            return _context6.a(2);
          case 2:
            setIsProcessing(true);
            setProgress(15);
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            _context6.p = 3;
            progressInterval = setInterval(function () {
              setProgress(function (prev) {
                return prev < 90 ? prev + 5 : prev;
              });
            }, 700);
            _context6.n = 4;
            return (0, _muapi.expandImage)(apiKey, {
              image_url: currentImageUrl
            });
          case 4:
            result = _context6.v;
            clearInterval(progressInterval);
            setProgress(100);
            outputUrl = ((_result$outputs3 = result.outputs) === null || _result$outputs3 === void 0 ? void 0 : _result$outputs3[0]) || result.url || ((_result$output9 = result.output) === null || _result$output9 === void 0 ? void 0 : _result$output9.image) || ((_result$output0 = result.output) === null || _result$output0 === void 0 || (_result$output0 = _result$output0.images) === null || _result$output0 === void 0 ? void 0 : _result$output0[0]) || ((_result$output1 = result.output) === null || _result$output1 === void 0 ? void 0 : _result$output1.url);
            if (outputUrl) {
              setCurrentImageUrl(outputUrl);
              _reactHotToast["default"].success(copy.toasts.expandSuccess);
              onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete(result);
            } else {
              _reactHotToast["default"].error(copy.toasts.expandNoOutput);
            }
            _context6.n = 6;
            break;
          case 5:
            _context6.p = 5;
            _t6 = _context6.v;
            errorMsg = (0, _formatError.formatErrorMessage)(_t6);
            _reactHotToast["default"].error(copy.toasts.expandFailed.replace('{error}', errorMsg));
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(errorMsg);
          case 6:
            _context6.p = 6;
            setIsProcessing(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context6.f(6);
          case 7:
            return _context6.a(2);
        }
      }, _callee6, null, [[3, 5, 6, 7]]);
    }));
    return function handleRunExpand() {
      return _ref7.apply(this, arguments);
    };
  }();

  // Reset Upscale parameters to default
  var handleResetUpscale = function handleResetUpscale() {
    setUpscaleModel("topaz-image-upscale");
    setTopazFactor(1);
    setSeedvrResolution("4k");
    (0, _reactHotToast["default"])(copy.toasts.upscaleSettingsReset);
  };

  // Reset individual Color Grading category
  var resetCategory = function resetCategory(catKey) {
    setColorGrading(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, catKey, _objectSpread({}, DEFAULT_COLOR_GRADING[catKey])));
    });
    (0, _reactHotToast["default"])(copy.toasts.resetCategory.replace('{category}', catKey));
  };

  // Reset all Color Grading parameters
  var handleResetAllColorGrading = function handleResetAllColorGrading() {
    setColorGrading(DEFAULT_COLOR_GRADING);
    (0, _reactHotToast["default"])(copy.toasts.colorGradingReset);
  };

  // Download Color Graded Image (Includes live filters, vignette, halation, and film grain)
  var handleDownloadGradedImage = /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
      var img, canvas, ctx, vRadius, grad, grainCanvas, gCtx, gImgData, data, bias, i, noise, pat, dataUrl, a, _t7;
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.p = _context7.n) {
          case 0:
            if (currentImageUrl) {
              _context7.n = 1;
              break;
            }
            return _context7.a(2);
          case 1:
            _context7.p = 1;
            img = new Image();
            img.crossOrigin = "anonymous";
            img.src = currentImageUrl;
            _context7.n = 2;
            return new Promise(function (resolve, reject) {
              img.onload = resolve;
              img.onerror = reject;
            });
          case 2:
            canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || 1024;
            canvas.height = img.naturalHeight || 1024;
            ctx = canvas.getContext("2d"); // 1. Draw filtered base image
            ctx.filter = getColorGradingCSSFilter();
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.filter = "none";

            // 2. Add Vignette if configured
            if (colorGrading.lensInstructions.vignette > 0) {
              vRadius = Math.max(canvas.width, canvas.height) * 0.7;
              grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, vRadius * 0.35, canvas.width / 2, canvas.height / 2, vRadius);
              grad.addColorStop(0, "rgba(0,0,0,0)");
              grad.addColorStop(1, "rgba(0,0,0,".concat(colorGrading.lensInstructions.vignette * 0.95, ")"));
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // 3. Add Film Grain if configured
            if (colorGrading.filmGrain.strength > 0) {
              grainCanvas = document.createElement("canvas");
              grainCanvas.width = 128;
              grainCanvas.height = 128;
              gCtx = grainCanvas.getContext("2d");
              gImgData = gCtx.createImageData(128, 128);
              data = gImgData.data;
              bias = colorGrading.filmGrain.bias * 50;
              for (i = 0; i < data.length; i += 4) {
                noise = (Math.random() - 0.5) * 255 + bias;
                data[i] = noise;
                data[i + 1] = noise;
                data[i + 2] = noise;
                data[i + 3] = 40;
              }
              gCtx.putImageData(gImgData, 0, 0);
              ctx.globalAlpha = colorGrading.filmGrain.strength * 0.5;
              ctx.globalCompositeOperation = "overlay";
              pat = ctx.createPattern(grainCanvas, "repeat");
              ctx.fillStyle = pat;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.globalAlpha = 1.0;
              ctx.globalCompositeOperation = "source-over";
            }
            dataUrl = canvas.toDataURL("image/png");
            a = document.createElement("a");
            a.href = dataUrl;
            a.download = "color_graded_image.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            _reactHotToast["default"].success(copy.toasts.downloadedGraded);
            _context7.n = 4;
            break;
          case 3:
            _context7.p = 3;
            _t7 = _context7.v;
            handleDownloadSingle(currentImageUrl, "color_graded_image.png");
          case 4:
            return _context7.a(2);
        }
      }, _callee7, null, [[1, 3]]);
    }));
    return function handleDownloadGradedImage() {
      return _ref8.apply(this, arguments);
    };
  }();

  // Load Seedream Wild Beauty 5-Layer Decomposition Example via CDN
  var handleLoadSampleLayers = function handleLoadSampleLayers() {
    setCurrentImageUrl("https://cdn.muapi.ai/assets/1786019968051_cKRYLHHu.png");
    setDecomposedLayers(DEFAULT_SAMPLE_LAYERS);
    setCarouselIndex(0);
    var initialVis = {};
    DEFAULT_SAMPLE_LAYERS.forEach(function (_, idx) {
      initialVis[idx] = true;
    });
    setVisibleLayers(initialVis);
    clearDrawingCanvas();
    setMarkedRegions([]);
    _reactHotToast["default"].success(copy.toasts.loadedSample);
  };

  // Explicit Side Tool Execution Handler
  var handleExecuteSideTool = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(toolId) {
      var _result, result, textPrompt, errorMsg, _t8;
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.p = _context8.n) {
          case 0:
            if (apiKey) {
              _context8.n = 1;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.apiKeyMissing);
            return _context8.a(2);
          case 1:
            if (currentImageUrl) {
              _context8.n = 2;
              break;
            }
            _reactHotToast["default"].error(copy.toasts.uploadImageFirst);
            return _context8.a(2);
          case 2:
            if (!(toolId === "remove-bg")) {
              _context8.n = 3;
              break;
            }
            return _context8.a(2, handleRunRemoveBg());
          case 3:
            if (!(toolId === "expand-crop")) {
              _context8.n = 4;
              break;
            }
            return _context8.a(2, handleRunExpand());
          case 4:
            setIsProcessing(true);
            setProgress(20);
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            _context8.p = 5;
            if (!(toolId === "enhancer")) {
              _context8.n = 7;
              break;
            }
            _context8.n = 6;
            return (0, _muapi.generateI2I)(apiKey, {
              model: "nano-banana-pro-edit",
              prompt: "Enhance image contrast, color balance, exposure, and sharpness.",
              image_url: currentImageUrl
            });
          case 6:
            result = _context8.v;
            _context8.n = 11;
            break;
          case 7:
            if (!(toolId === "edit-text")) {
              _context8.n = 9;
              break;
            }
            textPrompt = textEditPrompt || prompt || "Edit and sharpen text overlay on the image cleanly.";
            _context8.n = 8;
            return (0, _muapi.generateI2I)(apiKey, {
              model: "nano-banana-pro-edit",
              prompt: textPrompt,
              image_url: currentImageUrl
            });
          case 8:
            result = _context8.v;
            _context8.n = 11;
            break;
          case 9:
            _context8.n = 10;
            return (0, _muapi.generateI2I)(apiKey, {
              model: "nano-banana-pro-edit",
              prompt: prompt || "Apply ".concat(toolId, " image transformation."),
              image_url: currentImageUrl
            });
          case 10:
            result = _context8.v;
          case 11:
            setProgress(100);
            if ((_result = result) !== null && _result !== void 0 && _result.url) {
              setCurrentImageUrl(result.url);
              _reactHotToast["default"].success(copy.toasts.toolCompleted.replace('{tool}', toolId));
              onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete(result);
            }
            _context8.n = 13;
            break;
          case 12:
            _context8.p = 12;
            _t8 = _context8.v;
            errorMsg = (0, _formatError.formatErrorMessage)(_t8);
            _reactHotToast["default"].error(copy.toasts.operationFailed.replace('{error}', errorMsg));
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(errorMsg);
          case 13:
            _context8.p = 13;
            setIsProcessing(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context8.f(13);
          case 14:
            return _context8.a(2);
        }
      }, _callee8, null, [[5, 12, 13, 14]]);
    }));
    return function handleExecuteSideTool(_x3) {
      return _ref9.apply(this, arguments);
    };
  }();
  var toggleLayerVisibility = function toggleLayerVisibility(idx) {
    setVisibleLayers(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, idx, !prev[idx]));
    });
  };
  var handleDownloadSingle = /*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(url, filename) {
      var resp, blob, blobUrl, a, _t9;
      return _regenerator().w(function (_context9) {
        while (1) switch (_context9.p = _context9.n) {
          case 0:
            _context9.p = 0;
            _context9.n = 1;
            return fetch(url);
          case 1:
            resp = _context9.v;
            _context9.n = 2;
            return resp.blob();
          case 2:
            blob = _context9.v;
            blobUrl = URL.createObjectURL(blob);
            a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename || "layer.".concat(outputFormat);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            _context9.n = 4;
            break;
          case 3:
            _context9.p = 3;
            _t9 = _context9.v;
            window.open(url, "_blank");
          case 4:
            return _context9.a(2);
        }
      }, _callee9, null, [[0, 3]]);
    }));
    return function handleDownloadSingle(_x4, _x5) {
      return _ref0.apply(this, arguments);
    };
  }();
  var handleDownloadAll = function handleDownloadAll() {
    if (decomposedLayers.length === 0) {
      if (currentImageUrl) {
        handleDownloadSingle(currentImageUrl, "image.".concat(outputFormat));
      }
      return;
    }
    decomposedLayers.forEach(function (url, i) {
      setTimeout(function () {
        handleDownloadSingle(url, "layer_".concat(i + 1, ".").concat(outputFormat));
      }, i * 300);
    });
    _reactHotToast["default"].success(copy.toasts.downloadingAll);
  };
  var sideMenuItems = [{
    id: "layer-decomposition",
    label: copy.menuItems["layer-decomposition"],
    isNew: true
  }, {
    id: "upscale",
    label: copy.menuItems.upscale,
    isNew: true
  }, {
    id: "color-grading",
    label: copy.menuItems["color-grading"],
    isNew: true
  }, {
    id: "remove-bg",
    label: copy.menuItems["remove-bg"],
    isNew: true
  }, {
    id: "expand-crop",
    label: copy.menuItems["expand-crop"],
    isNew: true
  }, {
    id: "edit-text",
    label: copy.menuItems["edit-text"],
    isNew: false
  }, {
    id: "enhancer",
    label: copy.menuItems.enhancer,
    isNew: false
  }, {
    id: "relight",
    label: copy.menuItems.relight,
    isNew: false
  }, {
    id: "angles",
    label: copy.menuItems.angles,
    isNew: false
  }];
  var getLassoPathString = function getLassoPathString() {
    if (lassoPoints.length < 2) return "";
    return lassoPoints.map(function (p, i) {
      return "".concat(i === 0 ? "M" : "L", " ").concat(p.x.toFixed(1), " ").concat(p.y.toFixed(1));
    }).join(" ") + " Z";
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "relative w-full h-full bg-[#121318] text-white flex overflow-hidden font-sans select-none",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactHotToast.Toaster, {
      position: "top-center",
      toastOptions: {
        style: {
          background: "#1c1e24",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)"
        }
      }
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      type: "file",
      ref: fileInputRef,
      onChange: handleFileInputChange,
      accept: "image/*",
      className: "hidden"
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
        onClick: function onClick() {
          var _fileInputRef$current;
          return (_fileInputRef$current = fileInputRef.current) === null || _fileInputRef$current === void 0 ? void 0 : _fileInputRef$current.click();
        },
        title: copy.tools.uploadOrChangeImage,
        className: "group relative w-12 h-14 rounded-2xl overflow-hidden bg-[#1a1c23] border border-white/10 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)] ring-2 ring-[#84cc16]/80",
        children: [currentImageUrl ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: currentImageUrl,
          alt: "Input thumb",
          className: "w-full h-full object-cover"
        }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
          width: "20",
          height: "20",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
            x1: "12",
            y1: "5",
            x2: "12",
            y2: "19"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
            x1: "5",
            y1: "12",
            x2: "19",
            y2: "12"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold tracking-tighter text-white",
          children: "CHANGE"
        })]
      }), markedRegions.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
        onClick: function onClick() {
          return setMarkedRegions([]);
        },
        className: "px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] font-black rounded-lg border border-red-500/40 shadow-sm",
        title: copy.tools.clearMarkedRegions,
        children: ["Clear (", markedRegions.length, ")"]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      ref: canvasContainerRef,
      onMouseDown: startPan,
      onMouseMove: doPan,
      onMouseUp: stopPan,
      onMouseLeave: stopPan,
      className: "flex-1 relative h-full flex flex-col items-center justify-center p-4 pb-28 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1d2029] via-[#0f1015] to-[#08090c] ".concat(activeTool === "hand" ? "cursor-grab active:cursor-grabbing" : ""),
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute w-[700px] h-[700px] bg-[#84cc16]/5 rounded-full blur-[160px] pointer-events-none"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "relative max-w-[90%] max-h-[78vh] flex items-center justify-center transition-transform duration-100 ease-out",
        style: {
          transform: "translate(".concat(panOffset.x, "px, ").concat(panOffset.y, "px) scale(").concat(zoomLevel / 100, ")"),
          filter: getColorGradingCSSFilter()
        },
        children: uploading ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col items-center justify-center p-12 bg-[#1a1c23]/80 backdrop-blur-md rounded-3xl border border-white/10",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-12 h-12 border-4 border-[#84cc16]/20 border-t-[#84cc16] rounded-full animate-spin mb-4"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
            className: "text-sm font-semibold text-white/80",
            children: ["Uploading image... ", uploadProgress, "%"]
          })]
        }) : currentImageUrl ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          ref: imageWrapperRef,
          onMouseDown: handleImageMouseDown,
          onMouseMove: handleImageMouseMove,
          onMouseUp: handleImageMouseUp,
          onTouchStart: handleImageMouseDown,
          onTouchMove: handleImageMouseMove,
          onTouchEnd: handleImageMouseUp,
          className: "relative group rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 ".concat(activeTool === "lasso" || activeTool === "regional-edit" || activeTool === "shapes" ? "cursor-crosshair" : ""),
          style: {
            transform: colorGrading.lensInstructions.distortion !== 0 ? "scale(".concat(1 + Math.abs(colorGrading.lensInstructions.distortion) * 0.08, ")") : undefined
          },
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            ref: imageRef,
            src: currentImageUrl,
            alt: "Main canvas",
            onLoad: syncCanvasDimensions,
            className: "max-h-[72vh] max-w-[70vw] object-contain transition-opacity duration-300 pointer-events-none ".concat(decomposedLayers.length > 0 ? "opacity-30 blur-[1px]" : "opacity-100")
          }), colorGrading.lensInstructions.vignette > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 pointer-events-none rounded-2xl z-20 transition-opacity duration-150",
            style: {
              background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,".concat(colorGrading.lensInstructions.vignette * 0.95, ") 100%)")
            }
          }), colorGrading.filmGrain.strength > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 pointer-events-none rounded-2xl z-20 mix-blend-overlay transition-opacity duration-150",
            style: {
              opacity: colorGrading.filmGrain.strength,
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='".concat(colorGrading.filmGrain.size === "35mm" ? "0.85" : colorGrading.filmGrain.size === "16mm" ? "0.65" : "0.45", "' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='").concat(0.35 + colorGrading.filmGrain.bias * 0.45, "'/%3E%3C/svg%3E\")")
            }
          }), activeTool === "lasso" && lassoPoints.length > 1 && /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            viewBox: "0 0 1000 1000",
            preserveAspectRatio: "none",
            className: "absolute inset-0 w-full h-full pointer-events-none z-30",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: getLassoPathString(),
              fill: "rgba(56, 189, 248, 0.18)",
              stroke: "#38bdf8",
              strokeWidth: "4",
              strokeDasharray: "8 8",
              className: "drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]"
            })
          }), activeTool === "regional-edit" && regionalBox.width > 0 && regionalBox.height > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "absolute border-2 border-dashed border-[#38bdf8] bg-[#38bdf8]/10 rounded-lg pointer-events-auto shadow-[0_0_25px_rgba(56,189,248,0.5)] z-30",
            style: {
              left: "".concat(regionalBox.x, "%"),
              top: "".concat(regionalBox.y, "%"),
              width: "".concat(regionalBox.width, "%"),
              height: "".concat(regionalBox.height, "%")
            },
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#38bdf8] border border-white rounded-full"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#38bdf8] border border-white rounded-full"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#38bdf8] border border-white rounded-full"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#38bdf8] border border-white rounded-full"
            })]
          }), (activeTool === "lasso" && lassoPoints.length > 2 && !isDraggingLasso || activeTool === "regional-edit" && regionalBox.width > 2 && !isSelectingRegion) && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            onMouseDown: function onMouseDown(e) {
              return e.stopPropagation();
            },
            className: "absolute bottom-4 left-1/2 -translate-x-1/2 w-[280px] sm:w-[340px] bg-[#161822]/95 backdrop-blur-2xl border border-white/20 rounded-full px-3.5 py-2 flex items-center gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.9)] z-50 animate-fade-in",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-white/40 font-semibold text-sm ml-1",
              children: "+"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "text",
              value: regionalPrompt,
              onChange: function onChange(e) {
                return setRegionalPrompt(e.target.value);
              },
              onKeyDown: function onKeyDown(e) {
                return e.key === "Enter" && handleRunRegionalEdit();
              },
              placeholder: copy.tools.regionalPromptPlaceholder,
              className: "flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none min-w-0 font-medium"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: handleRunRegionalEdit,
              disabled: isProcessing,
              className: "w-7 h-7 rounded-full bg-[#84cc16] hover:bg-[#a3e635] text-black flex items-center justify-center shadow-[0_0_12px_rgba(132,204,22,0.6)] transition-all hover:scale-105 active:scale-95 flex-shrink-0",
              title: copy.tools.runSelectionEdit,
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "currentColor",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                  points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                })
              })
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("canvas", {
            ref: drawingCanvasRef,
            onMouseDown: startDrawing,
            onMouseMove: drawStroke,
            onMouseUp: stopDrawing,
            onMouseLeave: stopDrawing,
            onTouchStart: startDrawing,
            onTouchMove: drawStroke,
            onTouchEnd: stopDrawing,
            className: "absolute inset-0 w-full h-full touch-none ".concat(activeTool === "draw" || activeTool === "eraser" || activeTool === "shapes" ? "cursor-crosshair z-30 pointer-events-auto" : "pointer-events-none z-10")
          }), decomposedLayers.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 flex items-center justify-center pointer-events-none",
            children: decomposedLayers.map(function (layerUrl, idx) {
              var isVisible = isSoloMode ? carouselIndex === idx : visibleLayers[idx];
              if (!isVisible) return null;
              var isSelected = carouselIndex === idx;
              return /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                src: layerUrl,
                alt: "Layer ".concat(idx + 1),
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setCarouselIndex(idx);
                },
                className: "absolute inset-0 w-full h-full object-contain transition-all duration-200 cursor-pointer pointer-events-auto ".concat(isSelected ? "ring-2 ring-[#84cc16] drop-shadow-[0_0_20px_rgba(132,204,22,0.6)]" : "hover:opacity-90")
              }, idx);
            })
          }), isProcessing && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-40",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative w-16 h-16 mb-4",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute inset-0 border-4 border-[#84cc16]/20 rounded-full"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute inset-0 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-sm font-bold tracking-wide text-white",
              children: "Processing Image..."
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-xs text-white/50 mt-1",
              children: "Open Generative AI Studio"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-48 bg-white/10 h-1.5 rounded-full overflow-hidden mt-4",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "bg-gradient-to-r from-[#84cc16] to-[#a3e635] h-full transition-all duration-300",
                style: {
                  width: "".concat(progress, "%")
                }
              })
            })]
          })]
        }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          onClick: function onClick() {
            var _fileInputRef$current2;
            return (_fileInputRef$current2 = fileInputRef.current) === null || _fileInputRef$current2 === void 0 ? void 0 : _fileInputRef$current2.click();
          },
          onDragEnter: handleDropzoneDragEnter,
          onDragLeave: handleDropzoneDragLeave,
          onDragOver: handleDropzoneDragOver,
          onDrop: handleDropzoneDrop,
          className: "flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-200 ".concat(isDropzoneDragging ? "border-[#84cc16] bg-[#84cc16]/10 scale-[1.02]" : "border-white/20 hover:border-[#84cc16]/60 bg-[#16181f]/50 hover:bg-[#16181f]/80"),
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-16 h-16 rounded-2xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center mb-4",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "32",
              height: "32",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                points: "17 8 12 3 7 8"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "12",
                y1: "3",
                x2: "12",
                y2: "15"
              })]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            className: "text-base font-bold text-white mb-1",
            children: "Click or Drop Image Here"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            className: "text-xs text-white/50",
            children: "Supports PNG, JPEG, WEBP up to 20MB"
          })]
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2.5 w-full max-w-xl px-4",
        children: [activeTool === "shapes" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-3 px-4 py-2 bg-[#1b1e26]/95 backdrop-blur-xl border border-[#84cc16]/40 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-fade-in",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-1",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setActiveShape("line");
              },
              className: "p-1.5 rounded-lg border transition-all ".concat(activeShape === "line" ? "bg-[#84cc16] text-black border-[#84cc16]" : "text-white/70 hover:text-white border-transparent"),
              title: copy.tools.line,
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "15",
                height: "15",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "5",
                  y1: "19",
                  x2: "19",
                  y2: "5"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setActiveShape("arrow");
              },
              className: "p-1.5 rounded-lg border transition-all ".concat(activeShape === "arrow" ? "bg-[#84cc16] text-black border-[#84cc16]" : "text-white/70 hover:text-white border-transparent"),
              title: copy.tools.arrow,
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "15",
                height: "15",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "5",
                  y1: "19",
                  x2: "19",
                  y2: "5"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                  points: "12 5 19 5 19 12"
                })]
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setActiveShape("rect");
              },
              className: "p-1.5 rounded-lg border transition-all ".concat(activeShape === "rect" ? "bg-[#84cc16] text-black border-[#84cc16]" : "text-white/70 hover:text-white border-transparent"),
              title: copy.tools.rectangle,
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "15",
                height: "15",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                  x: "3",
                  y: "3",
                  width: "18",
                  height: "18",
                  rx: "2"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setActiveShape("circle");
              },
              className: "p-1.5 rounded-lg border transition-all ".concat(activeShape === "circle" ? "bg-[#84cc16] text-black border-[#84cc16]" : "text-white/70 hover:text-white border-transparent"),
              title: copy.tools.circle,
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "15",
                height: "15",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                  cx: "12",
                  cy: "12",
                  r: "9"
                })
              })
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-[1px] h-4 bg-white/10"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex items-center gap-1.5",
            children: PRESET_COLORS.map(function (c) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                onClick: function onClick() {
                  return setShapeColor(c);
                },
                className: "w-4 h-4 rounded-full border border-white/20 transition-all ".concat(shapeColor === c ? "scale-125 ring-2 ring-white shadow-md" : "hover:scale-110"),
                style: {
                  backgroundColor: c
                }
              }, c);
            })
          })]
        }), (activeTool === "draw" || activeTool === "eraser") && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-3 px-4 py-2 bg-[#1b1e26]/95 backdrop-blur-xl border border-[#84cc16]/40 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-fade-in",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-xs font-extrabold uppercase text-[#a3e635] tracking-wider",
            children: activeTool === "draw" ? "Marker Pen" : "Eraser"
          }), activeTool === "draw" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-1.5",
            children: [PRESET_COLORS.map(function (c) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                onClick: function onClick() {
                  return setBrushColor(c);
                },
                className: "w-5 h-5 rounded-full border border-white/20 transition-all ".concat(brushColor === c ? "scale-125 ring-2 ring-white shadow-md" : "hover:scale-110"),
                style: {
                  backgroundColor: c
                }
              }, c);
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "color",
              value: brushColor,
              onChange: function onChange(e) {
                return setBrushColor(e.target.value);
              },
              className: "w-5 h-5 rounded-full border-0 cursor-pointer bg-transparent",
              title: copy.tools.customColor
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 border-l border-white/10 pl-3",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[11px] text-white/60 font-semibold",
              children: "Size:"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "range",
              min: "2",
              max: "40",
              value: brushSize,
              onChange: function onChange(e) {
                return setBrushSize(Number(e.target.value));
              },
              className: "w-20 accent-[#84cc16] cursor-pointer"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
              className: "text-xs font-bold text-white min-w-[20px]",
              children: [brushSize, "px"]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-1 border-l border-white/10 pl-3",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: handleUndo,
              disabled: historyIndex < 0,
              className: "p-1.5 text-white/70 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5",
              title: copy.tools.undoStroke,
              children: "\u21B6"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: handleRedo,
              disabled: historyIndex >= historyStack.length - 1,
              className: "p-1.5 text-white/70 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/5",
              title: copy.tools.redoStroke,
              children: "\u21B7"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: clearDrawingCanvas,
              className: "p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-white/5 text-xs font-bold",
              title: copy.tools.clearDrawings,
              children: "Clear"
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-1.5 px-3.5 py-2 bg-[#1b1e26]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.6)]",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveTool("pointer");
            },
            className: "p-2 rounded-xl transition-all ".concat(activeTool === "pointer" ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]" : "text-white/60 hover:text-white hover:bg-white/5"),
            title: copy.tools.selectPointerTool,
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "17",
              height: "17",
              viewBox: "0 0 24 24",
              fill: "currentColor",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                points: "3 3 10.07 19.97 12.58 12.58 19.97 10.07 3 3"
              })
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveTool("hand");
            },
            className: "p-2 rounded-xl transition-all ".concat(activeTool === "hand" ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]" : "text-white/60 hover:text-white hover:bg-white/5"),
            title: copy.tools.panTool,
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "17",
              height: "17",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M18 11V6a2 2 0 0 0-4 0v5"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M14 10V4a2 2 0 0 0-4 0v6"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M10 10.5V6a2 2 0 0 0-4 0v9"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.8-5.6-2.4l-3-4.2a2 2 0 0 1 3.2-2.4l1.4 1.6"
              })]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            onClick: function onClick() {
              return setActiveTool(activeTool === "lasso" ? "pointer" : "lasso");
            },
            className: "group relative p-2 rounded-xl transition-all ".concat(activeTool === "lasso" ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]" : "text-white/60 hover:text-white hover:bg-white/5"),
            title: copy.tools.lassoEdit,
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "17",
              height: "17",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M4 16c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2",
                strokeDasharray: "3 3"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                cx: "12",
                cy: "12",
                r: "3"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[11px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md",
              children: "Lasso edit"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            onClick: function onClick() {
              return setActiveTool(activeTool === "regional-edit" ? "pointer" : "regional-edit");
            },
            className: "group relative p-2 rounded-xl transition-all ".concat(activeTool === "regional-edit" ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]" : "text-white/60 hover:text-white hover:bg-white/5"),
            title: copy.tools.regionalEdit,
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "17",
              height: "17",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                x: "4",
                y: "4",
                width: "16",
                height: "16",
                rx: "2",
                strokeDasharray: "3 3"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M9 12h6M12 9v6"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[11px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md",
              children: "Regional edit"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveTool(activeTool === "draw" ? "pointer" : "draw");
            },
            className: "p-2 rounded-xl transition-all ".concat(activeTool === "draw" ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]" : "text-white/60 hover:text-white hover:bg-white/5"),
            title: copy.tools.highlightMarkerPen,
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "17",
              height: "17",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M12 19l7-7 3 3-7 7-3-3z"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"
              })]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveTool(activeTool === "eraser" ? "pointer" : "eraser");
            },
            className: "p-2 rounded-xl transition-all ".concat(activeTool === "eraser" ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]" : "text-white/60 hover:text-white hover:bg-white/5"),
            title: copy.tools.eraserTool,
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "17",
              height: "17",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M20 20H7L3 16C2 15 2 13 3 12L13 2C14 1 16 1 17 2L21 6C22 7 22 9 21 10L12 19"
              })
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            onClick: function onClick() {
              return setActiveTool(activeTool === "shapes" ? "pointer" : "shapes");
            },
            className: "group relative p-2 rounded-xl transition-all ".concat(activeTool === "shapes" ? "bg-[#84cc16] text-black shadow-[0_0_12px_rgba(132,204,22,0.4)]" : "text-white/60 hover:text-white hover:bg-white/5"),
            title: copy.tools.shapes,
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "17",
              height: "17",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                x: "3",
                y: "3",
                width: "10",
                height: "10",
                rx: "1"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                cx: "16",
                cy: "16",
                r: "5"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[11px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md",
              children: "Shapes (R)"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-[1px] h-4 bg-white/10 mx-1"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setZoomLevel(function (z) {
                return Math.max(50, z - 10);
              });
            },
            className: "px-1.5 py-1 text-white/60 hover:text-white text-xs font-bold",
            children: "\u2013"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            onClick: resetView,
            className: "text-xs font-semibold text-white/80 min-w-[36px] text-center hover:text-white",
            title: copy.tools.resetZoomPan,
            children: [zoomLevel, "%"]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setZoomLevel(function (z) {
                return Math.min(200, z + 10);
              });
            },
            className: "px-1.5 py-1 text-white/60 hover:text-white text-xs font-bold",
            children: "+"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "w-full relative flex items-center bg-[#15171e]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-[0_15px_40px_rgba(0,0,0,0.6)]",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              var _fileInputRef$current3;
              return (_fileInputRef$current3 = fileInputRef.current) === null || _fileInputRef$current3 === void 0 ? void 0 : _fileInputRef$current3.click();
            },
            className: "w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all mr-2 flex-shrink-0",
            title: copy.tools.addImage,
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "12",
                y1: "5",
                x2: "12",
                y2: "19"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "5",
                y1: "12",
                x2: "19",
                y2: "12"
              })]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
            type: "text",
            value: prompt,
            onChange: function onChange(e) {
              return setPrompt(e.target.value);
            },
            onKeyDown: function onKeyDown(e) {
              return e.key === "Enter" && handleDecompose();
            },
            placeholder: markedRegions.length > 0 ? "Describe layers for ".concat(markedRegions.length, " marked region(s)...") : "Describe how to edit image or split layers...",
            className: "flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none px-2 font-medium min-w-0"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return handleDecompose();
            },
            disabled: isProcessing,
            className: "w-10 h-10 rounded-full bg-[#84cc16] hover:bg-[#a3e635] text-black flex items-center justify-center shadow-[0_0_20px_rgba(132,204,22,0.5)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ml-2 flex-shrink-0",
            title: copy.tools.runLayerDecomposition,
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "18",
              height: "18",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              })
            })
          })]
        })]
      })]
    }), isSidebarOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "w-[380px] h-full bg-[#242833] border-l border-white/10 flex flex-col justify-between z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] animate-fade-in",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "p-5 flex-1 overflow-y-auto custom-scrollbar",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-between mb-5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-3",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setActiveSideTab("menu");
              },
              className: "w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors",
              title: copy.tools.backToTools,
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "18",
                height: "18",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                  points: "15 18 9 12 15 6"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-7 h-7 rounded-full bg-white flex items-center justify-center text-black shadow-sm",
                children: activeSideTab === "upscale" ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "15 3 21 3 21 9"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "9 21 3 21 3 15"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                    x1: "21",
                    y1: "3",
                    x2: "14",
                    y2: "10"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                    x1: "3",
                    y1: "21",
                    x2: "10",
                    y2: "14"
                  })]
                }) : activeSideTab === "color-grading" ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "15",
                  height: "15",
                  viewBox: "0 0 24 24",
                  fill: "currentColor",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                    cx: "12",
                    cy: "12",
                    r: "10",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    fill: "none"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z",
                    opacity: "0.4"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                    cx: "9",
                    cy: "9",
                    r: "3"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                    cx: "15",
                    cy: "9",
                    r: "3"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                    cx: "12",
                    cy: "15",
                    r: "3"
                  })]
                }) : activeSideTab === "remove-bg" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "15",
                  height: "15",
                  viewBox: "0 0 24 24",
                  fill: "currentColor",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                  })
                }) : activeSideTab === "expand-crop" ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "15",
                  height: "15",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "15 3 21 3 21 9"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "9 21 3 21 3 15"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "21 15 21 21 15 21"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "3 9 3 3 9 3"
                  })]
                }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "15",
                  height: "15",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                    points: "12 2 2 7 12 12 22 7 12 2"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "2 17 12 22 22 17"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "2 12 12 17 22 12"
                  })]
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
                className: "text-sm font-extrabold text-white tracking-tight",
                children: copy.panels[activeSideTab] || copy.panels.tools
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setIsSidebarOpen(false);
            },
            className: "w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-colors",
            title: copy.tools.closePanel,
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "18",
                y1: "6",
                x2: "6",
                y2: "18"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "6",
                y1: "6",
                x2: "18",
                y2: "18"
              })]
            })
          })]
        }), activeSideTab === "layer-decomposition" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-4",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            onClick: handleLoadSampleLayers,
            className: "group w-full bg-[#f4f4f7] hover:bg-white rounded-3xl p-3 shadow-lg overflow-hidden border border-white/20 cursor-pointer transition-all duration-200 hover:scale-[1.01]",
            title: copy.sample.clickToLoad,
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center gap-2.5",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "relative w-28 h-36 rounded-2xl overflow-hidden bg-zinc-900 flex-shrink-0 shadow-md",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                  src: "https://cdn.muapi.ai/assets/1786019968051_cKRYLHHu.png",
                  alt: "Seedream original demo",
                  className: "w-full h-full object-cover"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#d8ff00]/90 to-transparent blur-[3px] animate-pulse"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/75 text-[8px] font-black text-white backdrop-blur-sm",
                  children: copy.sample.original
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex-1 bg-[#13151d] rounded-2xl p-2.5 flex flex-col justify-between h-36 shadow-inner overflow-hidden",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center justify-between px-1",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] font-black text-[#a3e635] uppercase tracking-wider",
                    children: copy.sample.layersCount
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[9px] font-bold text-white/50 group-hover:text-white transition-colors",
                    children: copy.sample["try"]
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar",
                  children: DEFAULT_SAMPLE_LAYERS.map(function (layerUrl, idx) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex-shrink-0 w-11 h-16 rounded-xl overflow-hidden border border-white/10 relative flex items-center justify-center p-1 bg-[#1a1d26] shadow-sm hover:border-[#84cc16]/50 transition-all",
                      style: {
                        backgroundImage: "linear-gradient(45deg, #242733 25%, transparent 25%), linear-gradient(-45deg, #242733 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #242733 75%), linear-gradient(-45deg, transparent 75%, #242733 75%)",
                        backgroundSize: "6px 6px"
                      },
                      title: "Layer ".concat(idx + 1),
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                        src: layerUrl,
                        alt: "Layer ".concat(idx + 1),
                        className: "max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "absolute bottom-0.5 right-0.5 text-[8px] font-black text-white/90 bg-black/70 px-1 rounded",
                        children: idx + 1
                      })]
                    }, idx);
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-[9px] text-center text-white/40 font-semibold group-hover:text-[#84cc16] transition-colors",
                  children: copy.sample.clickToExplore
                })]
              })]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-5 border border-white/5 space-y-4 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
              className: "text-sm font-bold text-white tracking-tight",
              children: copy.settings.heading
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
                className: "block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2",
                children: copy.settings.resolution
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "grid grid-cols-3 gap-1.5 bg-[#1a1c24] p-1 rounded-2xl border border-white/5",
                children: ["1K", "1.5K", "2K"].map(function (res) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                    onClick: function onClick() {
                      return setResolution(res);
                    },
                    className: "py-2 text-xs font-extrabold rounded-xl transition-all ".concat(resolution === res ? "bg-[#383c4a] text-white shadow-md border border-white/10" : "text-white/40 hover:text-white"),
                    children: res
                  }, res);
                })
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center justify-between mb-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
                  className: "block text-[11px] font-bold uppercase tracking-wider text-white/40",
                  children: copy.settings.layers
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "px-2.5 py-0.5 rounded-lg bg-[#1a1c24] border border-white/10 text-xs font-black text-white shadow-sm",
                  children: layerCount
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1a1c24] rounded-2xl p-3 border border-white/5 flex items-center gap-3",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] font-bold text-white/30",
                  children: "2"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                  type: "range",
                  min: "2",
                  max: "16",
                  value: layerCount,
                  onChange: function onChange(e) {
                    return setLayerCount(Number(e.target.value));
                  },
                  className: "w-full accent-[#e2f924] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] font-bold text-white/30",
                  children: "16"
                })]
              })]
            })]
          }), decomposedLayers.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "space-y-4 border-t border-white/10 pt-4 animate-fade-in",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center gap-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-bold uppercase text-white/80",
                  children: copy.carousel.heading
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                  className: "px-2 py-0.5 rounded-full bg-[#84cc16]/20 text-[#a3e635] text-[10px] font-black",
                  children: [carouselIndex + 1, " / ", decomposedLayers.length]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center gap-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  onClick: function onClick() {
                    return setIsSoloMode(!isSoloMode);
                  },
                  className: "px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ".concat(isSoloMode ? "bg-[#84cc16] text-black border-[#84cc16]" : "bg-white/5 text-white/60 hover:text-white border-white/10"),
                  title: copy.carousel.viewOnlyActive,
                  children: isSoloMode ? copy.carousel.soloActive : copy.carousel.stackMode
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  onClick: handleDownloadAll,
                  className: "text-xs text-[#a3e635] hover:underline font-semibold",
                  children: copy.carousel.downloadAll
                })]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative group bg-[#111319] border border-white/15 rounded-2xl overflow-hidden p-3 flex flex-col items-center shadow-xl",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "w-full h-48 rounded-xl overflow-hidden relative flex items-center justify-center border border-white/10",
                style: {
                  backgroundImage: "linear-gradient(45deg, #1c1f26 25%, transparent 25%), linear-gradient(-45deg, #1c1f26 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1f26 75%), linear-gradient(-45deg, transparent 75%, #1c1f26 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px"
                },
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                  src: decomposedLayers[carouselIndex],
                  alt: "Layer ".concat(carouselIndex + 1),
                  className: "max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-300 transform group-hover:scale-105"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  onClick: function onClick() {
                    return setCarouselIndex(function (prev) {
                      return prev > 0 ? prev - 1 : decomposedLayers.length - 1;
                    });
                  },
                  className: "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#84cc16] text-white hover:text-black flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-md",
                  title: copy.carousel.previousLayer,
                  children: "\u2039"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  onClick: function onClick() {
                    return setCarouselIndex(function (prev) {
                      return prev < decomposedLayers.length - 1 ? prev + 1 : 0;
                    });
                  },
                  className: "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-[#84cc16] text-white hover:text-black flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-md",
                  title: copy.carousel.nextLayer,
                  children: "\u203A"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "w-full flex items-center justify-between mt-3 px-1 text-xs",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "font-extrabold text-white text-sm",
                    children: copy.carousel.layerLabel.replace('{n}', carouselIndex + 1)
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[11px] text-white/40 ml-2",
                    children: copy.carousel.seedreamDecomposed
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                    onClick: function onClick() {
                      return toggleLayerVisibility(carouselIndex);
                    },
                    className: "p-1.5 rounded-lg border transition-all ".concat(visibleLayers[carouselIndex] ? "bg-white/10 text-[#a3e635] border-white/10" : "text-white/30 border-transparent"),
                    title: copy.carousel.toggleVisibility,
                    children: "\uD83D\uDC41"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                    onClick: function onClick() {
                      return handleDownloadSingle(decomposedLayers[carouselIndex], "layer_".concat(carouselIndex + 1, ".").concat(outputFormat));
                    },
                    className: "px-2.5 py-1 rounded-lg bg-[#84cc16] hover:bg-[#a3e635] text-black font-extrabold text-xs flex items-center gap-1 shadow-md",
                    title: copy.carousel.downloadThisLayer,
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      children: "\u2B07"
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      children: copy.carousel.save
                    })]
                  })]
                })]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar",
              children: decomposedLayers.map(function (layerUrl, idx) {
                return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                  onClick: function onClick() {
                    return setCarouselIndex(idx);
                  },
                  className: "relative flex-shrink-0 w-14 h-12 rounded-xl overflow-hidden border transition-all p-1 bg-[#181a22] ".concat(carouselIndex === idx ? "border-[#84cc16] ring-2 ring-[#84cc16]/50 scale-105" : "border-white/10 opacity-60 hover:opacity-100"),
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                    src: layerUrl,
                    alt: "Thumb ".concat(idx + 1),
                    className: "w-full h-full object-contain"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "absolute bottom-0.5 right-1 text-[8px] font-black text-white/80 bg-black/60 px-1 rounded",
                    children: idx + 1
                  })]
                }, idx);
              })
            })]
          })]
        }), activeSideTab === "upscale" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-4 animate-fade-in",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "space-y-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between px-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-extrabold uppercase tracking-wider text-white/40",
                children: copy.common.model
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: handleResetUpscale,
                className: "flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-white transition-colors",
                title: copy.colorGrading.resetToDefault,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 3v5h5"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.common.reset
                })]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return setIsModelDropdownOpen(!isModelDropdownOpen);
                },
                className: "w-full bg-[#2d313d] hover:bg-[#343946] p-3 rounded-2xl border border-white/5 flex items-center justify-between text-left transition-all shadow-sm",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-3",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white flex-shrink-0",
                    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                      width: "20",
                      height: "20",
                      viewBox: "0 0 24 24",
                      fill: "currentColor",
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                        x: "4",
                        y: "14",
                        width: "5",
                        height: "5",
                        rx: "1"
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                        x: "9.5",
                        y: "9.5",
                        width: "5",
                        height: "5",
                        rx: "1"
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                        x: "15",
                        y: "4",
                        width: "5",
                        height: "5",
                        rx: "1"
                      })]
                    })
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
                      className: "text-sm font-bold text-white leading-tight",
                      children: ((_UPSCALE_MODELS$find = UPSCALE_MODELS.find(function (m) {
                        return m.id === upscaleModel;
                      })) === null || _UPSCALE_MODELS$find === void 0 ? void 0 : _UPSCALE_MODELS$find.name) || "Topaz"
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                      className: "text-[11px] text-white/50 truncate max-w-[200px]",
                      children: (_UPSCALE_MODELS$find2 = UPSCALE_MODELS.find(function (m) {
                        return m.id === upscaleModel;
                      })) === null || _UPSCALE_MODELS$find2 === void 0 ? void 0 : _UPSCALE_MODELS$find2.subtitle
                    })]
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  className: "text-white/40 transition-transform ".concat(isModelDropdownOpen ? "rotate-180" : ""),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "6 9 12 15 18 9"
                  })
                })]
              }), isModelDropdownOpen && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute top-full left-0 right-0 mt-2 bg-[#1f222b] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 space-y-1",
                children: UPSCALE_MODELS.map(function (opt) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                    onClick: function onClick() {
                      setUpscaleModel(opt.id);
                      setIsModelDropdownOpen(false);
                    },
                    className: "w-full p-2.5 rounded-xl text-left flex flex-col transition-all ".concat(upscaleModel === opt.id ? "bg-[#343946] text-white" : "text-white/70 hover:bg-white/5 hover:text-white"),
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between",
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-xs font-bold text-white",
                        children: opt.name
                      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                        className: "text-[10px] font-bold text-[#a3e635]",
                        children: [opt.cost, " credits"]
                      })]
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-[10px] text-white/40",
                      children: opt.subtitle
                    })]
                  }, opt.id);
                })
              })]
            })]
          }), upscaleModel === "topaz-image-upscale" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-2xl p-3 border border-white/5 space-y-2 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between px-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-bold text-white/40 uppercase tracking-wider",
                children: "Upscale Factor"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "bg-[#181a22] text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/10",
                children: [topazFactor * 442, "\xD7", topazFactor * 413]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "grid grid-cols-4 gap-1.5 bg-[#1a1c24] p-1 rounded-xl border border-white/5",
              children: [1, 2, 4, 8].map(function (fac) {
                return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                  onClick: function onClick() {
                    return setTopazFactor(fac);
                  },
                  className: "py-2 text-xs font-extrabold rounded-lg transition-all ".concat(topazFactor === fac ? "bg-[#383c4a] text-white shadow-md border border-white/10" : "text-white/40 hover:text-white"),
                  children: ["x", fac]
                }, fac);
              })
            })]
          }), upscaleModel === "seedvr2-image-upscale" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-2xl p-3 border border-white/5 space-y-2 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between px-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-bold text-white/40 uppercase tracking-wider",
                children: copy.settings.resolution
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "bg-[#181a22] text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/10",
                children: [seedvrResolution.toUpperCase(), " UHD"]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "grid grid-cols-3 gap-1.5 bg-[#1a1c24] p-1 rounded-xl border border-white/5",
              children: ["2k", "4k", "8k"].map(function (res) {
                return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  onClick: function onClick() {
                    return setSeedvrResolution(res);
                  },
                  className: "py-2 text-xs font-extrabold uppercase rounded-lg transition-all ".concat(seedvrResolution === res ? "bg-[#383c4a] text-white shadow-md border border-white/10" : "text-white/40 hover:text-white"),
                  children: res
                }, res);
              })
            })]
          }), upscaleModel === "ai-image-upscaler" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-2xl p-4 border border-white/5 flex items-center gap-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-8 h-8 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center flex-shrink-0",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "currentColor",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                  points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h5", {
                className: "text-xs font-bold text-white",
                children: "Automatic AI Super-Resolution"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-[10px] text-white/50",
                children: "1-click neural clarity and noise reduction."
              })]
            })]
          })]
        }), activeSideTab === "color-grading" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-4 animate-fade-in",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return setOpenSections(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, {
                      colorCorrect: !prev.colorCorrect
                    });
                  });
                },
                className: "flex items-center gap-2 text-left",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "text-white/40 transition-transform ".concat(openSections.colorCorrect ? "" : "-rotate-90"),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "6 9 12 15 18 9"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-sm font-bold text-white tracking-tight",
                  children: "Color Correct"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help",
                  title: copy.colorGrading.colorCorrect.info,
                  children: "\u2139"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return resetCategory("colorCorrect");
                },
                className: "flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5",
                title: copy.colorGrading.colorCorrect.reset,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "11",
                  height: "11",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 3v5h5"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.common.reset
                })]
              })]
            }), openSections.colorCorrect && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-2 pt-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Temp"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "-100",
                    max: "100",
                    value: colorGrading.colorCorrect.temp,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          colorCorrect: _objectSpread(_objectSpread({}, prev.colorCorrect), {}, {
                            temp: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.colorCorrect.temp
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Hue"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "-180",
                    max: "180",
                    step: "0.5",
                    value: colorGrading.colorCorrect.hue,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          colorCorrect: _objectSpread(_objectSpread({}, prev.colorCorrect), {}, {
                            hue: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.colorCorrect.hue.toFixed(1)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Saturation"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "-100",
                    max: "100",
                    value: colorGrading.colorCorrect.saturation,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          colorCorrect: _objectSpread(_objectSpread({}, prev.colorCorrect), {}, {
                            saturation: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.colorCorrect.saturation
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Contrast"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "-100",
                    max: "100",
                    value: colorGrading.colorCorrect.contrast,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          colorCorrect: _objectSpread(_objectSpread({}, prev.colorCorrect), {}, {
                            contrast: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.colorCorrect.contrast
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Split Tone"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.colorCorrect.splitTone,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          colorCorrect: _objectSpread(_objectSpread({}, prev.colorCorrect), {}, {
                            splitTone: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.colorCorrect.splitTone.toFixed(1)
                  })]
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return setOpenSections(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, {
                      softenDetails: !prev.softenDetails
                    });
                  });
                },
                className: "flex items-center gap-2 text-left",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "text-white/40 transition-transform ".concat(openSections.softenDetails ? "" : "-rotate-90"),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "6 9 12 15 18 9"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-sm font-bold text-white tracking-tight",
                  children: "Soften Details"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help",
                  title: copy.colorGrading.softenDetails.info,
                  children: "\u2139"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return resetCategory("softenDetails");
                },
                className: "flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5",
                title: copy.colorGrading.softenDetails.reset,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "11",
                  height: "11",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 3v5h5"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.common.reset
                })]
              })]
            }), openSections.softenDetails && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-2 pt-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Radius"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "50",
                    value: colorGrading.softenDetails.radius,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          softenDetails: _objectSpread(_objectSpread({}, prev.softenDetails), {}, {
                            radius: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.softenDetails.radius
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Detail"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.softenDetails.detail,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          softenDetails: _objectSpread(_objectSpread({}, prev.softenDetails), {}, {
                            detail: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.softenDetails.detail.toFixed(2)
                  })]
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return setOpenSections(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, {
                      bloom: !prev.bloom
                    });
                  });
                },
                className: "flex items-center gap-2 text-left",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "text-white/40 transition-transform ".concat(openSections.bloom ? "" : "-rotate-90"),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "6 9 12 15 18 9"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-sm font-bold text-white tracking-tight",
                  children: "Bloom"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help",
                  title: copy.colorGrading.bloom.info,
                  children: "\u2139"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return resetCategory("bloom");
                },
                className: "flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5",
                title: copy.colorGrading.bloom.reset,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "11",
                  height: "11",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 3v5h5"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.common.reset
                })]
              })]
            }), openSections.bloom && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-2 pt-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Radius"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "50",
                    value: colorGrading.bloom.radius,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          bloom: _objectSpread(_objectSpread({}, prev.bloom), {}, {
                            radius: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.bloom.radius
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Bright"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "10",
                    step: "0.5",
                    value: colorGrading.bloom.bright,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          bloom: _objectSpread(_objectSpread({}, prev.bloom), {}, {
                            bright: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.bloom.bright.toFixed(1)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Fade"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.bloom.fade,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          bloom: _objectSpread(_objectSpread({}, prev.bloom), {}, {
                            fade: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.bloom.fade.toFixed(2)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70 px-1",
                  children: "Blend"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "grid grid-cols-2 gap-1 bg-[#151720] p-0.5 rounded-xl border border-white/5",
                  children: ["Screen", "Soft Light"].map(function (b) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                      onClick: function onClick() {
                        return setColorGrading(function (prev) {
                          return _objectSpread(_objectSpread({}, prev), {}, {
                            bloom: _objectSpread(_objectSpread({}, prev.bloom), {}, {
                              blend: b
                            })
                          });
                        });
                      },
                      className: "px-3 py-1 text-xs font-bold rounded-lg transition-all ".concat(colorGrading.bloom.blend === b ? "bg-[#383c4a] text-white shadow" : "text-white/40 hover:text-white"),
                      children: b
                    }, b);
                  })
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return setOpenSections(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, {
                      halation: !prev.halation
                    });
                  });
                },
                className: "flex items-center gap-2 text-left",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "text-white/40 transition-transform ".concat(openSections.halation ? "" : "-rotate-90"),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "6 9 12 15 18 9"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-sm font-bold text-white tracking-tight",
                  children: "Halation"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help",
                  title: copy.colorGrading.halation.info,
                  children: "\u2139"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return resetCategory("halation");
                },
                className: "flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5",
                title: copy.colorGrading.halation.reset,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "11",
                  height: "11",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 3v5h5"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.common.reset
                })]
              })]
            }), openSections.halation && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-2 pt-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Strength"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.halation.strength,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          halation: _objectSpread(_objectSpread({}, prev.halation), {}, {
                            strength: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.halation.strength.toFixed(2)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Threshold"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.halation.threshold,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          halation: _objectSpread(_objectSpread({}, prev.halation), {}, {
                            threshold: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.halation.threshold.toFixed(2)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Radius"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "50",
                    value: colorGrading.halation.radius,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          halation: _objectSpread(_objectSpread({}, prev.halation), {}, {
                            radius: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.halation.radius
                  })]
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return setOpenSections(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, {
                      lensInstructions: !prev.lensInstructions
                    });
                  });
                },
                className: "flex items-center gap-2 text-left",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "text-white/40 transition-transform ".concat(openSections.lensInstructions ? "" : "-rotate-90"),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "6 9 12 15 18 9"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-sm font-bold text-white tracking-tight",
                  children: "Lens Instructions"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help",
                  title: copy.colorGrading.lensInstructions.info,
                  children: "\u2139"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return resetCategory("lensInstructions");
                },
                className: "flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5",
                title: copy.colorGrading.lensInstructions.reset,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "11",
                  height: "11",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 3v5h5"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.common.reset
                })]
              })]
            }), openSections.lensInstructions && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-2 pt-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Strength"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.01",
                    value: colorGrading.lensInstructions.strength,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          lensInstructions: _objectSpread(_objectSpread({}, prev.lensInstructions), {}, {
                            strength: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.lensInstructions.strength.toFixed(3)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Radius"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "50",
                    value: colorGrading.lensInstructions.radius,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          lensInstructions: _objectSpread(_objectSpread({}, prev.lensInstructions), {}, {
                            radius: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.lensInstructions.radius
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Vignette"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.lensInstructions.vignette,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          lensInstructions: _objectSpread(_objectSpread({}, prev.lensInstructions), {}, {
                            vignette: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.lensInstructions.vignette.toFixed(2)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Distortion"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "-1",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.lensInstructions.distortion,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          lensInstructions: _objectSpread(_objectSpread({}, prev.lensInstructions), {}, {
                            distortion: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.lensInstructions.distortion.toFixed(2)
                  })]
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return setOpenSections(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, {
                      exposure: !prev.exposure
                    });
                  });
                },
                className: "flex items-center gap-2 text-left",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "text-white/40 transition-transform ".concat(openSections.exposure ? "" : "-rotate-90"),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "6 9 12 15 18 9"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-sm font-bold text-white tracking-tight",
                  children: "Exposure"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help",
                  title: copy.colorGrading.exposure.info,
                  children: "\u2139"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return resetCategory("exposure");
                },
                className: "flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5",
                title: copy.colorGrading.exposure.reset,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "11",
                  height: "11",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 3v5h5"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.common.reset
                })]
              })]
            }), openSections.exposure && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "space-y-2 pt-1",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Stops"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "-5",
                    max: "5",
                    step: "0.1",
                    value: colorGrading.exposure.stops,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          exposure: _objectSpread(_objectSpread({}, prev.exposure), {}, {
                            stops: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.exposure.stops.toFixed(2)
                  })]
                })]
              })
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return setOpenSections(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, {
                      filmGrain: !prev.filmGrain
                    });
                  });
                },
                className: "flex items-center gap-2 text-left",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "text-white/40 transition-transform ".concat(openSections.filmGrain ? "" : "-rotate-90"),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "6 9 12 15 18 9"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-sm font-bold text-white tracking-tight",
                  children: "Film Grain"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "w-3.5 h-3.5 rounded-full border border-white/20 text-[9px] flex items-center justify-center text-white/40 cursor-help",
                  title: copy.colorGrading.filmGrain.info,
                  children: "\u2139"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  return resetCategory("filmGrain");
                },
                className: "flex items-center gap-1 text-[11px] font-bold text-white/40 hover:text-white transition-colors px-2 py-0.5 rounded-lg hover:bg-white/5",
                title: copy.colorGrading.filmGrain.reset,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "11",
                  height: "11",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M3 3v5h5"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.common.reset
                })]
              })]
            }), openSections.filmGrain && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-2 pt-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Strength"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.filmGrain.strength,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          filmGrain: _objectSpread(_objectSpread({}, prev.filmGrain), {}, {
                            strength: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.filmGrain.strength.toFixed(2)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2.5 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70",
                  children: "Bias"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    value: colorGrading.filmGrain.bias,
                    onChange: function onChange(e) {
                      return setColorGrading(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, {
                          filmGrain: _objectSpread(_objectSpread({}, prev.filmGrain), {}, {
                            bias: Number(e.target.value)
                          })
                        });
                      });
                    },
                    className: "w-24 accent-[#84cc16] cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-bold text-white min-w-[28px] text-right",
                    children: colorGrading.filmGrain.bias.toFixed(2)
                  })]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "bg-[#1f222d] rounded-2xl p-2 flex items-center justify-between",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70 px-1",
                  children: "Size"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "grid grid-cols-3 gap-1 bg-[#151720] p-0.5 rounded-xl border border-white/5",
                  children: ["35mm", "16mm", "8mm"].map(function (sz) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                      onClick: function onClick() {
                        return setColorGrading(function (prev) {
                          return _objectSpread(_objectSpread({}, prev), {}, {
                            filmGrain: _objectSpread(_objectSpread({}, prev.filmGrain), {}, {
                              size: sz
                            })
                          });
                        });
                      },
                      className: "px-2.5 py-1 text-xs font-bold rounded-lg transition-all ".concat(colorGrading.filmGrain.size === sz ? "bg-[#383c4a] text-white shadow" : "text-white/40 hover:text-white"),
                      children: sz
                    }, sz);
                  })
                })]
              })]
            })]
          })]
        }), activeSideTab === "remove-bg" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-4 animate-fade-in",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "space-y-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between px-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-extrabold uppercase tracking-wider text-white/40",
                children: copy.common.model
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] font-bold text-[#a3e635] bg-[#84cc16]/15 px-2 py-0.5 rounded-md",
                children: copy.removeBg.credit
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "bg-[#2d313d] p-3.5 rounded-2xl border border-white/5 flex items-center gap-3 shadow-sm",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-10 h-10 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center flex-shrink-0",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "20",
                  height: "20",
                  viewBox: "0 0 24 24",
                  fill: "currentColor",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                  })
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
                  className: "text-sm font-bold text-white leading-tight",
                  children: copy.removeBg.modelName
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                  className: "text-[11px] text-white/50",
                  children: "ai-background-remover"
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-xs font-bold text-white",
                children: copy.removeBg.targetPreview
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] text-white/40",
                children: copy.removeBg.alphaMatte
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-full h-44 rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/10",
              style: {
                backgroundImage: "linear-gradient(45deg, #1c1f26 25%, transparent 25%), linear-gradient(-45deg, #1c1f26 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1f26 75%), linear-gradient(-45deg, transparent 75%, #1c1f26 75%)",
                backgroundSize: "14px 14px",
                backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px"
              },
              children: currentImageUrl && /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                src: currentImageUrl,
                alt: "Current input",
                className: "max-h-full max-w-full object-contain drop-shadow-md"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-1.5 pt-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center gap-2 text-xs text-white/70",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[#a3e635] font-bold",
                  children: "\u2713"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.removeBg.feature1
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center gap-2 text-xs text-white/70",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[#a3e635] font-bold",
                  children: "\u2713"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.removeBg.feature2
                })]
              })]
            })]
          })]
        }), activeSideTab === "expand-crop" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-4 animate-fade-in",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "space-y-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between px-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-extrabold uppercase tracking-wider text-white/40",
                children: copy.common.model
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] font-bold text-[#a3e635] bg-[#84cc16]/15 px-2 py-0.5 rounded-md",
                children: copy.expandCrop.credit
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "bg-[#2d313d] p-3.5 rounded-2xl border border-white/5 flex items-center gap-3 shadow-sm",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-10 h-10 rounded-xl bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center flex-shrink-0",
                children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "20",
                  height: "20",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "15 3 21 3 21 9"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "9 21 3 21 3 15"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "21 15 21 21 15 21"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "3 9 3 3 9 3"
                  })]
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
                  className: "text-sm font-bold text-white leading-tight",
                  children: copy.expandCrop.modelName
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                  className: "text-[11px] text-white/50",
                  children: "ai-image-extension"
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "bg-[#2d313d] rounded-3xl p-4 border border-white/5 space-y-3 shadow-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-xs font-bold text-white",
                children: copy.expandCrop.canvasPreview
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] text-white/40",
                children: copy.expandCrop.boundaryOutpainting
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "w-full h-44 rounded-2xl overflow-hidden relative flex items-center justify-center border border-dashed border-[#84cc16]/50 bg-[#161822] p-4",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute top-2 left-2 text-[#84cc16] text-[10px] font-mono",
                children: '↖ ' + copy.expandCrop.expand
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute top-2 right-2 text-[#84cc16] text-[10px] font-mono",
                children: '↗ ' + copy.expandCrop.expand
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute bottom-2 left-2 text-[#84cc16] text-[10px] font-mono",
                children: '↙ ' + copy.expandCrop.expand
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute bottom-2 right-2 text-[#84cc16] text-[10px] font-mono",
                children: '↘ ' + copy.expandCrop.expand
              }), currentImageUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "relative border border-white/30 rounded-lg overflow-hidden shadow-2xl max-h-[75%] max-w-[75%]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                  src: currentImageUrl,
                  alt: "Current input",
                  className: "w-full h-full object-contain"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute inset-0 ring-1 ring-white/40 pointer-events-none"
                })]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-1.5 pt-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center gap-2 text-xs text-white/70",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[#a3e635] font-bold",
                  children: "\u2713"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.expandCrop.feature1
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center gap-2 text-xs text-white/70",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[#a3e635] font-bold",
                  children: "\u2713"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: copy.expandCrop.feature2
                })]
              })]
            })]
          })]
        }), activeSideTab === "menu" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "space-y-1 mb-6",
          children: sideMenuItems.map(function (item) {
            return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick() {
                return setActiveSideTab(item.id);
              },
              className: "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-white/70 hover:text-white hover:bg-white/5",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "flex items-center gap-3",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: item.label
                })
              }), item.isNew && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "px-2 py-0.5 text-[10px] font-black uppercase bg-[#84cc16] text-black rounded-md tracking-wider",
                children: copy.menuItems["new"]
              })]
            }, item.id);
          })
        }), activeSideTab === "edit-text" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "p-4 bg-[#2d313d] border border-white/10 rounded-2xl space-y-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
            className: "text-xs font-bold uppercase tracking-wider text-[#a3e635]",
            children: copy.editText.heading
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
            type: "text",
            value: textEditPrompt,
            onChange: function onChange(e) {
              return setTextEditPrompt(e.target.value);
            },
            placeholder: copy.editText.placeholder,
            className: "w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#84cc16]"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return handleExecuteSideTool("edit-text");
            },
            disabled: isProcessing,
            className: "w-full py-2 bg-[#84cc16] hover:bg-[#a3e635] text-black font-bold text-xs uppercase rounded-xl shadow-md",
            children: isProcessing ? copy.editText.processing : copy.editText.run
          })]
        }), activeSideTab === "enhancer" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "p-4 bg-[#2d313d] border border-white/10 rounded-2xl space-y-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
            className: "text-xs font-bold uppercase tracking-wider text-[#a3e635]",
            children: copy.enhancer.heading
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            className: "text-xs text-white/60",
            children: copy.enhancer.description
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return handleExecuteSideTool("enhancer");
            },
            disabled: isProcessing,
            className: "w-full py-2 bg-[#84cc16] hover:bg-[#a3e635] text-black font-bold text-xs uppercase rounded-xl shadow-md",
            children: isProcessing ? copy.enhancer.processing : copy.enhancer.run
          })]
        }), activeSideTab === "relight" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "p-4 bg-[#2d313d] border border-white/10 rounded-2xl space-y-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
            className: "text-xs font-bold uppercase tracking-wider text-[#a3e635]",
            children: copy.relight.heading
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            className: "text-xs text-white/60",
            children: copy.relight.description
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return handleExecuteSideTool("relight");
            },
            disabled: isProcessing,
            className: "w-full py-2 bg-[#84cc16] hover:bg-[#a3e635] text-black font-bold text-xs uppercase rounded-xl shadow-md",
            children: isProcessing ? copy.relight.processing : copy.relight.run
          })]
        }), activeSideTab === "angles" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "p-4 bg-[#2d313d] border border-white/10 rounded-2xl space-y-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
            className: "text-xs font-bold uppercase tracking-wider text-[#a3e635]",
            children: copy.angles.heading
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            className: "text-xs text-white/60",
            children: copy.angles.description
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return handleExecuteSideTool("angles");
            },
            disabled: isProcessing,
            className: "w-full py-2 bg-[#84cc16] hover:bg-[#a3e635] text-black font-bold text-xs uppercase rounded-xl shadow-md",
            children: isProcessing ? copy.angles.processing : copy.angles.run
          })]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "p-4 bg-[#242833] border-t border-white/10 flex flex-col gap-2",
        children: activeSideTab === "layer-decomposition" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: function onClick() {
            return handleDecompose();
          },
          disabled: isProcessing,
          className: "w-full py-3.5 bg-[#e2f924] hover:bg-[#d4ed1b] active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(226,249,36,0.35)] transition-all flex items-center justify-center gap-2 tracking-tight disabled:opacity-50",
          children: isProcessing ? /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: copy.footer.decomposing.replace('{progress}', progress)
          }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "18",
              height: "18",
              viewBox: "0 0 24 24",
              fill: "currentColor",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.footer.separateLayers.replace('{count}', layerCount > 4 ? 12 : 8)
            })]
          })
        }) : activeSideTab === "upscale" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: handleRunUpscale,
          disabled: isProcessing,
          className: "w-full py-3.5 bg-[#e2f924] hover:bg-[#d4ed1b] active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(226,249,36,0.35)] transition-all flex items-center justify-center gap-2 tracking-tight disabled:opacity-50",
          children: isProcessing ? /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: copy.footer.upscaling.replace('{progress}', progress)
          }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "18",
              height: "18",
              viewBox: "0 0 24 24",
              fill: "currentColor",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.footer.upscaleCost.replace('{cost}', upscaleModel === "seedvr2-image-upscale" ? "0.02" : "1.0")
            })]
          })
        }) : activeSideTab === "color-grading" ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2.5 w-full",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: handleResetAllColorGrading,
            className: "w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-all border border-white/10 hover:border-white/20 flex-shrink-0",
            title: copy.colorGrading.resetAll,
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "18",
              height: "18",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M3 3v5h5"
              })]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            onClick: handleDownloadGradedImage,
            className: "flex-1 py-3.5 bg-white/10 hover:bg-white/15 text-white font-extrabold text-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 shadow-md",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                points: "7 10 12 15 17 10"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "12",
                y1: "15",
                x2: "12",
                y2: "3"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: "Download"
            })]
          })]
        }) : activeSideTab === "remove-bg" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: handleRunRemoveBg,
          disabled: isProcessing,
          className: "w-full py-3.5 bg-[#e2f924] hover:bg-[#d4ed1b] active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(226,249,36,0.35)] transition-all flex items-center justify-center gap-2 tracking-tight disabled:opacity-50",
          children: isProcessing ? /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: copy.footer.removingBackground.replace('{progress}', progress)
          }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "18",
              height: "18",
              viewBox: "0 0 24 24",
              fill: "currentColor",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.footer.removeBackgroundCost
            })]
          })
        }) : activeSideTab === "expand-crop" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: handleRunExpand,
          disabled: isProcessing,
          className: "w-full py-3.5 bg-[#e2f924] hover:bg-[#d4ed1b] active:scale-[0.98] text-black font-extrabold text-sm rounded-2xl shadow-[0_4px_25px_rgba(226,249,36,0.35)] transition-all flex items-center justify-center gap-2 tracking-tight disabled:opacity-50",
          children: isProcessing ? /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: copy.footer.expandingBorders.replace('{progress}', progress)
          }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "18",
              height: "18",
              viewBox: "0 0 24 24",
              fill: "currentColor",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.footer.expandImageCost
            })]
          })
        }) : null
      })]
    })]
  });
}