"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = RecastStudio;
var _react = require("react");
var _useTemplateData2 = require("../hooks/useTemplateData");
var _TemplateBanner = _interopRequireDefault(require("./TemplateBanner"));
var _SocialPublishProvider = require("../../../../components/SocialPublishProvider");
var _AiAssistantProvider = require("../../../../components/AiAssistantProvider");
var _muapi = require("../muapi.js");
var _models = require("../models.js");
var _skillStore = require("../lib/skillStore");
var _registry = _interopRequireDefault(require("../skills/registry.json"));
var _promptRecipes = require("../lib/promptRecipes");
var _storyboardHandoff = require("../storyboardHandoff.js");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
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
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // ---------------------------------------------------------------------------
// Upload button states
// ---------------------------------------------------------------------------
var UPLOAD_STATE = {
  IDLE: "idle",
  UPLOADING: "uploading",
  READY: "ready"
};
function MediaPickerButton(_ref) {
  var accept = _ref.accept,
    label = _ref.label,
    icon = _ref.icon,
    onUpload = _ref.onUpload,
    onClear = _ref.onClear,
    uploadState = _ref.uploadState,
    progress = _ref.progress,
    fileName = _ref.fileName,
    previewUrl = _ref.previewUrl,
    isVideo = _ref.isVideo;
  var inputRef = (0, _react.useRef)(null);
  var handleClick = function handleClick(e) {
    var _inputRef$current;
    e.stopPropagation();
    if (uploadState === UPLOAD_STATE.READY) {
      onClear();
      return;
    }
    (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 || _inputRef$current.click();
  };
  var handleChange = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(e) {
      var _e$target$files;
      var file;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
            if (file) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            e.target.value = "";
            _context.n = 2;
            return onUpload(file);
          case 2:
            return _context.a(2);
        }
      }, _callee);
    }));
    return function handleChange(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var borderClass = uploadState === UPLOAD_STATE.READY ? "border-primary/60 bg-primary/5" : "border-white/[0.03] bg-white/[0.03] hover:bg-white/[0.06] hover:border-primary/40";
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
    type: "button",
    title: uploadState === UPLOAD_STATE.READY ? "".concat(fileName, " \u2014 click to clear") : "Upload ".concat(label.toLowerCase(), " file"),
    onClick: handleClick,
    className: "flex-shrink-0 w-10 h-10 rounded-full border transition-all flex items-center justify-center relative overflow-hidden group ".concat(borderClass),
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ref: inputRef,
      type: "file",
      accept: accept,
      className: "hidden",
      onChange: handleChange
    }), uploadState === UPLOAD_STATE.IDLE && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex flex-col items-center justify-center gap-1 w-full h-full",
      children: icon
    }), uploadState === UPLOAD_STATE.UPLOADING && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        className: "w-8 h-8 -rotate-90",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
          cx: "16",
          cy: "16",
          r: "14",
          stroke: "currentColor",
          strokeWidth: "2",
          fill: "transparent",
          className: "text-white/10"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
          cx: "16",
          cy: "16",
          r: "14",
          stroke: "currentColor",
          strokeWidth: "2",
          fill: "transparent",
          strokeDasharray: 88,
          strokeDashoffset: 88 - 88 * progress / 100,
          className: "text-primary transition-all duration-300"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
        className: "absolute text-[9px] font-black text-primary leading-none",
        children: [progress, "%"]
      })]
    }), uploadState === UPLOAD_STATE.READY && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex flex-col items-center justify-center gap-1 w-full h-full absolute inset-0 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-all",
      children: previewUrl ? isVideo ? /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
        src: previewUrl,
        className: "w-full h-full object-cover",
        muted: true
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: previewUrl,
        alt: "",
        className: "w-full h-full object-cover"
      }) : icon
    })]
  });
}

// ---------------------------------------------------------------------------
// Inline dropdown
// ---------------------------------------------------------------------------
function Dropdown(_ref3) {
  var isOpen = _ref3.isOpen,
    items = _ref3.items,
    selectedId = _ref3.selectedId,
    onSelect = _ref3.onSelect,
    onClose = _ref3.onClose,
    anchorRef = _ref3.anchorRef;
  var dropRef = (0, _react.useRef)(null);
  var _useState = (0, _react.useState)({}),
    _useState2 = _slicedToArray(_useState, 2),
    style = _useState2[0],
    setStyle = _useState2[1];
  (0, _react.useEffect)(function () {
    if (!isOpen || !(anchorRef !== null && anchorRef !== void 0 && anchorRef.current) || !dropRef.current) return;
    var rect = anchorRef.current.getBoundingClientRect();
    var ddHeight = dropRef.current.offsetHeight;
    var spaceBelow = window.innerHeight - rect.bottom - 8;
    var spaceAbove = rect.top - 8;
    var top, bottom, maxHeight;
    if (spaceBelow >= ddHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 8;
      bottom = "auto";
      maxHeight = Math.max(150, spaceBelow - 8);
    } else {
      top = "auto";
      bottom = window.innerHeight - rect.top + 8;
      maxHeight = Math.max(150, spaceAbove - 8);
    }
    var left = Math.min(rect.left, window.innerWidth - 220);
    setStyle({
      top: top,
      bottom: bottom,
      left: left,
      maxHeight: maxHeight
    });
  }, [isOpen, anchorRef]);
  (0, _react.useEffect)(function () {
    if (!isOpen) return;
    var handler = function handler(e) {
      var _dropRef$current, _anchorRef$current;
      if (!((_dropRef$current = dropRef.current) !== null && _dropRef$current !== void 0 && _dropRef$current.contains(e.target)) && !(anchorRef !== null && anchorRef !== void 0 && (_anchorRef$current = anchorRef.current) !== null && _anchorRef$current !== void 0 && _anchorRef$current.contains(e.target))) {
        onClose();
      }
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [isOpen, onClose, anchorRef]);
  if (!isOpen) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    ref: dropRef,
    style: _objectSpread({
      position: "fixed",
      zIndex: 100,
      overflowY: "auto"
    }, style),
    className: "bg-[#111] border border-white/10 rounded-lg shadow-3xl p-2 custom-scrollbar w-[calc(100vw-3rem)] max-w-xs",
    children: items.map(function (item) {
      return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
        type: "button",
        onClick: function onClick() {
          onSelect(item);
          onClose();
        },
        className: "w-full text-left px-4 py-2 rounded text-sm transition-all hover:bg-white/10 ".concat(item.id === selectedId ? "text-primary font-bold bg-primary/5" : "text-white font-medium"),
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          children: item.name
        }), item.description && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "text-xs text-muted mt-0.5",
          children: [item.description.slice(0, 60), "..."]
        })]
      }, item.id);
    })
  });
}

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------
var VideoIcon = function VideoIcon(_ref4) {
  var _ref4$className = _ref4.className,
    className = _ref4$className === void 0 ? "text-white/40 group-hover:text-primary transition-colors" : _ref4$className;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: className,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
      points: "23 7 16 12 23 17 23 7"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
      x: "1",
      y: "5",
      width: "15",
      height: "14",
      rx: "2",
      ry: "2"
    })]
  });
};
var ImageIcon = function ImageIcon(_ref5) {
  var _ref5$className = _ref5.className,
    className = _ref5$className === void 0 ? "text-white/40 group-hover:text-primary transition-colors" : _ref5$className;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: className,
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
  });
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function RecastStudio(_ref6) {
  var _firstModel$id, _firstModel$inputs$as, _firstModel$inputs, _selectedModel$name;
  var apiKey = _ref6.apiKey,
    onGenerationComplete = _ref6.onGenerationComplete,
    historyItems = _ref6.historyItems,
    droppedFiles = _ref6.droppedFiles,
    onFilesHandled = _ref6.onFilesHandled,
    templateData = _ref6.templateData;
  var PERSIST_KEY = "hg_recast_studio_persistent";

  // ── Model state ───────────────────────────────────────────────────────────
  var firstModel = _models.recastModels[0];
  var _useState3 = (0, _react.useState)((_firstModel$id = firstModel === null || firstModel === void 0 ? void 0 : firstModel.id) !== null && _firstModel$id !== void 0 ? _firstModel$id : ""),
    _useState4 = _slicedToArray(_useState3, 2),
    selectedModelId = _useState4[0],
    setSelectedModelId = _useState4[1];
  var _useState5 = (0, _react.useState)((_firstModel$inputs$as = firstModel === null || firstModel === void 0 || (_firstModel$inputs = firstModel.inputs) === null || _firstModel$inputs === void 0 || (_firstModel$inputs = _firstModel$inputs.aspect_ratio) === null || _firstModel$inputs === void 0 ? void 0 : _firstModel$inputs["default"]) !== null && _firstModel$inputs$as !== void 0 ? _firstModel$inputs$as : "16:9"),
    _useState6 = _slicedToArray(_useState5, 2),
    selectedAspectRatio = _useState6[0],
    setSelectedAspectRatio = _useState6[1];

  // ── Upload state ──────────────────────────────────────────────────────────
  var _useState7 = (0, _react.useState)(UPLOAD_STATE.IDLE),
    _useState8 = _slicedToArray(_useState7, 2),
    videoState = _useState8[0],
    setVideoState = _useState8[1];
  var _useState9 = (0, _react.useState)(""),
    _useState0 = _slicedToArray(_useState9, 2),
    videoName = _useState0[0],
    setVideoName = _useState0[1];
  var _useState1 = (0, _react.useState)(null),
    _useState10 = _slicedToArray(_useState1, 2),
    videoUrl = _useState10[0],
    setVideoUrl = _useState10[1];
  var _useState11 = (0, _react.useState)(0),
    _useState12 = _slicedToArray(_useState11, 2),
    videoProgress = _useState12[0],
    setVideoProgress = _useState12[1];
  var _useState13 = (0, _react.useState)(UPLOAD_STATE.IDLE),
    _useState14 = _slicedToArray(_useState13, 2),
    imageState = _useState14[0],
    setImageState = _useState14[1];
  var _useState15 = (0, _react.useState)(""),
    _useState16 = _slicedToArray(_useState15, 2),
    imageName = _useState16[0],
    setImageName = _useState16[1];
  var _useState17 = (0, _react.useState)(null),
    _useState18 = _slicedToArray(_useState17, 2),
    imageUrl = _useState18[0],
    setImageUrl = _useState18[1];
  var _useState19 = (0, _react.useState)(0),
    _useState20 = _slicedToArray(_useState19, 2),
    imageProgress = _useState20[0],
    setImageProgress = _useState20[1];

  // ── Prompt ────────────────────────────────────────────────────────────────
  var _useState21 = (0, _react.useState)(""),
    _useState22 = _slicedToArray(_useState21, 2),
    prompt = _useState22[0],
    setPrompt = _useState22[1];

  // ── Generation / UI state ─────────────────────────────────────────────────
  var _useState23 = (0, _react.useState)(false),
    _useState24 = _slicedToArray(_useState23, 2),
    isGenerating = _useState24[0],
    setIsGenerating = _useState24[1];
  var _useState25 = (0, _react.useState)(null),
    _useState26 = _slicedToArray(_useState25, 2),
    generateError = _useState26[0],
    setGenerateError = _useState26[1];
  var _useState27 = (0, _react.useState)(null),
    _useState28 = _slicedToArray(_useState27, 2),
    fullscreenUrl = _useState28[0],
    setFullscreenUrl = _useState28[1];

  // ── History ───────────────────────────────────────────────────────────────
  var _useState29 = (0, _react.useState)([]),
    _useState30 = _slicedToArray(_useState29, 2),
    internalHistory = _useState30[0],
    setInternalHistory = _useState30[1];
  var history = historyItems !== null && historyItems !== void 0 ? historyItems : internalHistory;

  // ── Dropdown state ────────────────────────────────────────────────────────
  var _useState31 = (0, _react.useState)(null),
    _useState32 = _slicedToArray(_useState31, 2),
    openDropdown = _useState32[0],
    setOpenDropdown = _useState32[1]; // 'model' | 'aspect' | null
  var modelBtnRef = (0, _react.useRef)(null);
  var aspectBtnRef = (0, _react.useRef)(null);
  var textareaRef = (0, _react.useRef)(null);
  var hasRestored = (0, _react.useRef)(false);

  // ── Apply pending Skills recipe (set by SkillsBrowser) ────────────────────
  (0, _react.useEffect)(function () {
    var pending = (0, _skillStore.getPendingRecipe)("recast");
    if (!pending) return;
    var skill = _registry["default"].skills.find(function (s) {
      return s.slug === pending;
    });
    (0, _skillStore.clearPendingRecipe)("recast");
    if (!skill) return;
    applyRecipe(skill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cross-studio: import a Storyboard hand-off ────────────────────────────
  var handoffApplied = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    try {
      var handoff = (0, _storyboardHandoff.readStoryboardHandoff)("recast");
      if (!handoff || handoffApplied.current === handoff.createdAt) return;
      handoffApplied.current = handoff.createdAt;
      if (handoff.combinedPrompt || handoff.projectName) {
        setPrompt(handoff.combinedPrompt || handoff.projectName);
      }
      if (["1:1", "16:9", "9:16"].includes(handoff.aspectRatio)) {
        setSelectedAspectRatio(handoff.aspectRatio);
      }
    } catch (err) {
      console.warn("Failed to apply Storyboard hand-off:", err);
    }
  }, []);
  function applyRecipe(skill) {
    var step0 = skill.steps && skill.steps[0];
    if (!step0) {
      if (skill.description) setPrompt(skill.description);
      return;
    }
    var modelId = step0.endpoint || step0.model;
    var model = _models.recastModels.find(function (m) {
      return m.id === modelId;
    });
    if (model) setSelectedModelId(model.id);
    if (step0.aspectRatio) setSelectedAspectRatio(step0.aspectRatio);
    var vals = {};
    (skill.inputs || []).forEach(function (i) {
      vals[i.name] = "";
    });
    setPrompt((0, _promptRecipes.fillTemplate)(step0.prompt || skill.description || "", vals));
  }

  // ── Persistence: Load ──────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.selectedAspectRatio) setSelectedAspectRatio(data.selectedAspectRatio);
        if (data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setVideoState(UPLOAD_STATE.READY);
        }
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setImageState(UPLOAD_STATE.READY);
        }
        if (data.videoName) setVideoName(data.videoName);
        if (data.imageName) setImageName(data.imageName);
        if (data.prompt) setPrompt(data.prompt);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
      }
    } catch (err) {
      console.warn("Failed to load RecastStudio persistence:", err);
    } finally {
      hasRestored.current = true;
    }
  }, []);

  // ── Persistence: Save ──────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          selectedModelId: selectedModelId,
          selectedAspectRatio: selectedAspectRatio,
          videoUrl: videoUrl,
          videoName: videoName,
          imageUrl: imageUrl,
          imageName: imageName,
          prompt: prompt,
          internalHistory: internalHistory
        }));
      } catch (err) {
        console.warn("Failed to save RecastStudio persistence:", err);
      }
    }, 500);
    return function () {
      return clearTimeout(timer);
    };
  }, [selectedModelId, selectedAspectRatio, videoUrl, videoName, imageUrl, imageName, prompt, internalHistory]);

  // ── Apply template data from landing page "Create This Style" ──────────────
  var _useTemplateData = (0, _useTemplateData2.useTemplateData)(templateData, function (data) {
      if (data.prompt) {
        setPrompt(data.prompt);
      }
      if (data.aspectRatio) {
        var normalized = (0, _useTemplateData2.normalizeAspectRatio)(data.aspectRatio, "16:9");
        setSelectedAspectRatio(normalized);
      }
    }),
    resetTemplate = _useTemplateData.reset,
    isTemplateApplied = _useTemplateData.isTemplateApplied;

  // ── Derived model info ──────────────────────────────────────────────────────
  var selectedModel = (0, _models.getRecastModelById)(selectedModelId);
  var aspectOptions = (0, _models.getAspectRatiosForRecastModel)(selectedModelId);
  var showAspect = aspectOptions.length > 0;
  var showPrompt = !!(selectedModel !== null && selectedModel !== void 0 && selectedModel.hasPrompt);

  // ── Upload handlers ─────────────────────────────────────────────────────────
  var handleVideoPick = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(file) {
      var url, _t;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (!(file.size > 50 * 1024 * 1024)) {
              _context2.n = 1;
              break;
            }
            alert("Video exceeds 50MB limit.");
            return _context2.a(2);
          case 1:
            setVideoState(UPLOAD_STATE.UPLOADING);
            setVideoProgress(0);
            _context2.p = 2;
            _context2.n = 3;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              return setVideoProgress(pct);
            });
          case 3:
            url = _context2.v;
            setVideoUrl(url);
            setVideoName(file.name);
            setVideoState(UPLOAD_STATE.READY);
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t = _context2.v;
            setVideoState(UPLOAD_STATE.IDLE);
            alert("Video upload failed: ".concat(_t.message));
          case 5:
            _context2.p = 5;
            setVideoProgress(0);
            return _context2.f(5);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 4, 5, 6]]);
    }));
    return function (_x2) {
      return _ref7.apply(this, arguments);
    };
  }(), [apiKey]);
  var handlePromptInput = function handlePromptInput(e) {
    setPrompt(e.target.value);
    var el = e.target;
    el.style.height = "auto";
    var maxH = window.innerWidth < 768 ? 150 : 250;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  };
  var handleImageUpload = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(file) {
      var url, _t2;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (!(file.size > 10 * 1024 * 1024)) {
              _context3.n = 1;
              break;
            }
            alert("Image exceeds 10MB limit.");
            return _context3.a(2);
          case 1:
            setImageState(UPLOAD_STATE.UPLOADING);
            setImageProgress(0);
            _context3.p = 2;
            _context3.n = 3;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              return setImageProgress(pct);
            });
          case 3:
            url = _context3.v;
            setImageUrl(url);
            setImageName(file.name);
            setImageState(UPLOAD_STATE.READY);
            _context3.n = 5;
            break;
          case 4:
            _context3.p = 4;
            _t2 = _context3.v;
            setImageState(UPLOAD_STATE.IDLE);
            alert("Image upload failed: ".concat(_t2.message));
          case 5:
            _context3.p = 5;
            setImageProgress(0);
            return _context3.f(5);
          case 6:
            return _context3.a(2);
        }
      }, _callee3, null, [[2, 4, 5, 6]]);
    }));
    return function (_x3) {
      return _ref8.apply(this, arguments);
    };
  }(), [apiKey]);

  // ── Handle Dropped Files ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (droppedFiles && droppedFiles.length > 0) {
      var imageFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith("image/");
      });
      var videoFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith("video/");
      });
      if (videoFiles.length > 0) handleVideoPick(videoFiles[0]);
      if (imageFiles.length > 0) handleImageUpload(imageFiles[0]);
      onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
    }
  }, [droppedFiles, onFilesHandled, handleVideoPick, handleImageUpload]);

  // ── Model selection ─────────────────────────────────────────────────────────
  var handleModelSelect = function handleModelSelect(model) {
    setSelectedModelId(model.id);
    var ratios = (0, _models.getAspectRatiosForRecastModel)(model.id);
    if (ratios.length > 0) {
      var _model$inputs$aspect_, _model$inputs;
      setSelectedAspectRatio((_model$inputs$aspect_ = (_model$inputs = model.inputs) === null || _model$inputs === void 0 || (_model$inputs = _model$inputs.aspect_ratio) === null || _model$inputs === void 0 ? void 0 : _model$inputs["default"]) !== null && _model$inputs$aspect_ !== void 0 ? _model$inputs$aspect_ : ratios[0]);
    }
  };

  // ── History helpers ─────────────────────────────────────────────────────────
  var addToInternalHistory = (0, _react.useCallback)(function (entry) {
    setInternalHistory(function (prev) {
      return [entry].concat(_toConsumableArray(prev)).slice(0, 30);
    });
  }, []);
  var downloadFile = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(url, filename) {
      var response, blob, blobUrl, a, _t3;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            _context4.p = 0;
            _context4.n = 1;
            return fetch(url);
          case 1:
            response = _context4.v;
            _context4.n = 2;
            return response.blob();
          case 2:
            blob = _context4.v;
            blobUrl = URL.createObjectURL(blob);
            a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            _context4.n = 4;
            break;
          case 3:
            _context4.p = 3;
            _t3 = _context4.v;
            window.open(url, "_blank");
          case 4:
            return _context4.a(2);
        }
      }, _callee4, null, [[0, 3]]);
    }));
    return function downloadFile(_x4, _x5) {
      return _ref9.apply(this, arguments);
    };
  }();

  // ── Generation ──────────────────────────────────────────────────────────────
  var handleGenerate = /*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
      var params, res, genId, entry, _e$message$slice, _e$message, _t4;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            if (videoUrl) {
              _context5.n = 1;
              break;
            }
            alert("Please upload a source video first.");
            return _context5.a(2);
          case 1:
            if (imageUrl) {
              _context5.n = 2;
              break;
            }
            alert("Please upload a character image first.");
            return _context5.a(2);
          case 2:
            setIsGenerating(true);
            setGenerateError(null);
            _context5.p = 3;
            params = {
              model: selectedModelId,
              video_url: videoUrl,
              image_url: imageUrl
            };
            if (showAspect) params.aspect_ratio = selectedAspectRatio;
            if (prompt && selectedModel !== null && selectedModel !== void 0 && selectedModel.hasPrompt) params.prompt = prompt;
            _context5.n = 4;
            return (0, _muapi.processRecast)(apiKey, params);
          case 4:
            res = _context5.v;
            if (res !== null && res !== void 0 && res.url) {
              _context5.n = 5;
              break;
            }
            throw new Error("No video URL returned by API");
          case 5:
            genId = res.id || Date.now().toString();
            entry = {
              id: genId,
              url: res.url,
              prompt: prompt,
              model: (selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.name) || selectedModelId,
              timestamp: new Date().toISOString()
            };
            if (!historyItems) addToInternalHistory(entry);
            if (onGenerationComplete) {
              onGenerationComplete({
                url: res.url,
                model: selectedModelId,
                prompt: prompt,
                type: "recast"
              });
            }
            _context5.n = 7;
            break;
          case 6:
            _context5.p = 6;
            _t4 = _context5.v;
            console.error("[RecastStudio]", _t4);
            setGenerateError((_e$message$slice = (_e$message = _t4.message) === null || _e$message === void 0 ? void 0 : _e$message.slice(0, 80)) !== null && _e$message$slice !== void 0 ? _e$message$slice : "Unknown error");
            setTimeout(function () {
              return setGenerateError(null);
            }, 4000);
          case 7:
            _context5.p = 7;
            setIsGenerating(false);
            return _context5.f(7);
          case 8:
            return _context5.a(2);
        }
      }, _callee5, null, [[3, 6, 7, 8]]);
    }));
    return function handleGenerate() {
      return _ref0.apply(this, arguments);
    };
  }();

  // ── Dropdown item lists ─────────────────────────────────────────────────────
  var aspectDropdownItems = aspectOptions.map(function (r) {
    return {
      id: r,
      name: r
    };
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2",
      children: history.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up",
        children: history.map(function (entry, idx) {
          var _entry$prompt, _entry$model;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
              src: entry.url,
              className: "w-full aspect-video object-cover bg-black/40 cursor-pointer hover:opacity-80 transition-opacity",
              onClick: function onClick() {
                return setFullscreenUrl(entry.url);
              },
              controls: false,
              loop: true,
              muted: true,
              playsInline: true,
              onMouseOver: function onMouseOver(e) {
                return e.target.play();
              },
              onMouseOut: function onMouseOut(e) {
                e.target.pause();
                e.target.currentTime = 0;
              }
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Fullscreen",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setFullscreenUrl(entry.url);
                },
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10",
                children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
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
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Download",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  downloadFile(entry.url, "bodyswap-".concat(entry.id || idx, ".mp4"));
                },
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  })
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_SocialPublishProvider.PublishStep, {
                mediaUrl: entry.url,
                mediaType: "video",
                title: ((_entry$prompt = entry.prompt) === null || _entry$prompt === void 0 ? void 0 : _entry$prompt.substring(0, 50)) || 'Body swap video',
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_AiAssistantProvider.AssistStep, {
                assetUrl: entry.url,
                assetType: "video",
                onApply: function onApply() {},
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
                  })
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Delete",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this generated item?")) {
                    setInternalHistory(function (prev) {
                      return prev.filter(function (_, i) {
                        return i !== idx;
                      });
                    });
                  }
                },
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all border border-white/10",
                children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "3 6 5 6 21 6"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                    x1: "10",
                    y1: "11",
                    x2: "10",
                    y2: "17"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                    x1: "14",
                    y1: "11",
                    x2: "14",
                    y2: "17"
                  })]
                })
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "flex items-center justify-between flex-wrap gap-1",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap",
                  children: ((_entry$model = entry.model) === null || _entry$model === void 0 ? void 0 : _entry$model.name) || entry.model || "Body Swap"
                })
              })
            })]
          }, entry.id || idx);
        })
      }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-center gap-1.5 md:gap-3 mb-10 select-none scale-90 sm:scale-100",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/sdxl-image.avif",
              alt: "Creative asset 1",
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[4deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/chroma-image.avif",
              alt: "Creative asset 2",
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-18 sm:w-24 sm:h-24 rounded-full border border-white/10 shadow-2xl rotate-[6deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif",
              alt: "Creative asset 3",
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/perfect-pony-xl.avif",
              alt: "Creative asset 4",
              className: "w-full h-full object-cover"
            })
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("h1", {
          className: "text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center px-4 flex flex-col items-center",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-white font-black uppercase text-xl sm:text-3xl tracking-wide mb-1 opacity-90",
            children: "START CREATING WITH"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight",
            children: "BODY SWAP STUDIO"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4",
          children: "Swap the character in any video dynamically by choosing a video clip and a target character image."
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up",
      style: {
        animationDelay: "0.2s"
      },
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "w-full bg-gradient-to-b from-[#18181c]/90 via-[#0f0f12]/90 to-[#0c0c0e]/95 backdrop-blur-2xl rounded-[2rem] border border-white/[0.08] p-4 flex flex-col gap-3 shadow-[0_15px_50px_rgba(0,0,0,0.8)]",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2 px-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(MediaPickerButton, {
              accept: "video/*",
              label: "Video",
              icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(VideoIcon, {
                className: "text-white/40 group-hover:text-[#22d3ee] transition-colors"
              }),
              onUpload: handleVideoPick,
              onClear: function onClear() {
                setVideoUrl(null);
                setVideoState(UPLOAD_STATE.IDLE);
                setVideoName("");
              },
              uploadState: videoState,
              progress: videoProgress,
              fileName: videoName,
              previewUrl: videoUrl,
              isVideo: true
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(MediaPickerButton, {
              accept: "image/*",
              label: "Character image",
              icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(ImageIcon, {
                className: "text-white/40 group-hover:text-[#22d3ee] transition-colors"
              }),
              onUpload: handleImageUpload,
              onClear: function onClear() {
                setImageUrl(null);
                setImageState(UPLOAD_STATE.IDLE);
                setImageName("");
              },
              uploadState: imageState,
              progress: imageProgress,
              fileName: imageName,
              previewUrl: imageUrl,
              isVideo: false
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex-1 flex flex-col",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_TemplateBanner["default"], {
              isApplied: isTemplateApplied,
              onClear: resetTemplate
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
              ref: textareaRef,
              value: prompt,
              onChange: handlePromptInput,
              placeholder: "Optional \u2014 describe the motion or scene...",
              className: "w-full bg-transparent border-none text-white text-sm placeholder:text-white/10 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar disabled:opacity-40",
              rows: 1
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-white/[0.03] relative",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 px-1",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                ref: modelBtnRef,
                type: "button",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === "model" ? null : "model");
                },
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-3.5 h-3.5 bg-[#22d3ee] rounded-sm flex items-center justify-center",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[9px] font-black text-black",
                    children: "R"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: (_selectedModel$name = selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.name) !== null && _selectedModel$name !== void 0 ? _selectedModel$name : "Select model"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "10",
                  height: "10",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "4",
                  className: "opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M6 9l6 6 6-6"
                  })
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
                isOpen: openDropdown === "model",
                items: _models.recastModels,
                selectedId: selectedModelId,
                onSelect: handleModelSelect,
                onClose: function onClose() {
                  return setOpenDropdown(null);
                },
                anchorRef: modelBtnRef
              })]
            }), showAspect && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                ref: aspectBtnRef,
                type: "button",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === "aspect" ? null : "aspect");
                },
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: selectedAspectRatio
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
                isOpen: openDropdown === "aspect",
                items: aspectDropdownItems,
                selectedId: selectedAspectRatio,
                onSelect: function onSelect(item) {
                  return setSelectedAspectRatio(item.id);
                },
                onClose: function onClose() {
                  return setOpenDropdown(null);
                },
                anchorRef: aspectBtnRef
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: handleGenerate,
            disabled: isGenerating,
            className: "bg-[#22d3ee] text-black px-7 py-3 rounded-full font-black text-sm hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/20 hover:shadow-[#22d3ee]/35 border border-[#22d3ee]/10 z-10 disabled:opacity-50 disabled:cursor-not-allowed",
            children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "animate-spin inline-block text-black",
                children: "\u25CC"
              }), " ", "Swapping..."]
            }) : generateError ? "Error: ".concat(generateError) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: "Swap Body"
            })
          })]
        })]
      })
    }), fullscreenUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in",
      onClick: function onClick() {
        return setFullscreenUrl(null);
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        className: "absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10",
        onClick: function onClick(e) {
          e.stopPropagation();
          setFullscreenUrl(null);
        },
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
          width: "24",
          height: "24",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
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
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
        src: fullscreenUrl,
        controls: true,
        autoPlay: true,
        loop: true,
        className: "max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up",
        onClick: function onClick(e) {
          return e.stopPropagation();
        }
      })]
    })]
  });
}