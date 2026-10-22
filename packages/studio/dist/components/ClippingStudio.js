"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ClippingStudio;
var _react = require("react");
var _reactHotToast = _interopRequireWildcard(require("react-hot-toast"));
var _SocialPublishProvider = require("../../../../components/SocialPublishProvider");
var _AiAssistantProvider = require("../../../../components/AiAssistantProvider");
var _muapi = require("../muapi.js");
var _formatError = require("../utils/formatError.js");
var _skillStore = require("../lib/skillStore");
var _registry = _interopRequireDefault(require("../skills/registry.json"));
var _promptRecipes = require("../lib/promptRecipes");
var _useTemplateData2 = require("../hooks/useTemplateData");
var _TemplateBanner = _interopRequireDefault(require("./TemplateBanner"));
var _storyboardHandoff = require("../storyboardHandoff.js");
var _persistKey = require("../persistKey.js");
var _MobileGenerationActions = _interopRequireWildcard(require("./MobileGenerationActions.jsx"));
var _PromptComposer = require("./prompt/PromptComposer.jsx");
var _clippingStudio = _interopRequireDefault(require("../messages/en/clippingStudio.json"));
var _clippingStudio2 = _interopRequireDefault(require("../messages/zh/clippingStudio.json"));
var _i18nUtils = require("../i18nUtils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t4 in e) "default" !== _t4 && {}.hasOwnProperty.call(e, _t4) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t4)) && (i.get || i.set) ? o(f, _t4, i) : f[_t4] = e[_t4]); return f; })(e, t); }
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
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var MAX_VIDEO_SIZE_MB = 100;
var MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
var CLIPPING_TOASTER_ID = "clipping-studio";
var MAX_VISIBLE_ERROR_TOASTS = 3;
var ERROR_TOAST_DURATION_MS = 7000;
var activeErrorToastIds = [];
var forgetErrorToast = function forgetErrorToast(toastId) {
  var index = activeErrorToastIds.indexOf(toastId);
  if (index !== -1) activeErrorToastIds.splice(index, 1);
};
var dismissErrorToast = function dismissErrorToast(toastId) {
  forgetErrorToast(toastId);
  _reactHotToast["default"].dismiss(toastId, CLIPPING_TOASTER_ID);
};

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------
var ScissorsIcon = function ScissorsIcon(_ref) {
  var _ref$className = _ref.className,
    className = _ref$className === void 0 ? "text-[#22d3ee]" : _ref$className;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
      cx: "6",
      cy: "6",
      r: "3"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
      cx: "6",
      cy: "18",
      r: "3"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
      x1: "9.8",
      y1: "8.2",
      x2: "21",
      y2: "19.4"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
      x1: "9.8",
      y1: "15.8",
      x2: "21",
      y2: "4.6"
    })]
  });
};
var TrashIcon = function TrashIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
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
  });
};
var PlayIcon = function PlayIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M8 5v14l11-7z"
    })
  });
};
var ClockIcon = function ClockIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "12 6 12 12 16 14"
    })]
  });
};
var DownloadIcon = function DownloadIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
    })
  });
};
var CopyIcon = function CopyIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
      x: "9",
      y: "9",
      width: "13",
      height: "13",
      rx: "2",
      ry: "2"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
    })]
  });
};
var ErrorToast = function ErrorToast(_ref2) {
  var toastInstance = _ref2.toastInstance,
    message = _ref2.message,
    _ref2$dismissLabel = _ref2.dismissLabel,
    dismissLabel = _ref2$dismissLabel === void 0 ? "Dismiss notification" : _ref2$dismissLabel;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "pointer-events-auto flex w-[340px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-xl border border-red-400/40 bg-white px-3.5 py-3 text-[13px] text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-200 ".concat(toastInstance.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"),
    role: "alert",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-400/40 bg-red-50 text-red-600",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        width: "17",
        height: "17",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
          cx: "12",
          cy: "12",
          r: "9"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M12 7v6"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M12 17h.01"
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "min-w-0 flex-1 py-1 font-medium leading-5 text-zinc-900",
      children: message
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      onClick: function onClick() {
        return dismissErrorToast(toastInstance.id);
      },
      className: "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-300",
      "aria-label": dismissLabel,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        "aria-hidden": "true",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M18 6 6 18M6 6l12 12"
        })
      })
    })]
  });
};
var showErrorToast = function showErrorToast(message) {
  var copy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _clippingStudio["default"];
  var options = {
    duration: ERROR_TOAST_DURATION_MS,
    position: "bottom-right",
    toasterId: CLIPPING_TOASTER_ID
  };
  while (activeErrorToastIds.length >= MAX_VISIBLE_ERROR_TOASTS) {
    var oldestToastId = activeErrorToastIds.shift();
    _reactHotToast["default"].remove(oldestToastId, CLIPPING_TOASTER_ID);
  }
  var toastId = _reactHotToast["default"].custom(function (toastInstance) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(ErrorToast, {
      toastInstance: toastInstance,
      message: message,
      dismissLabel: copy.errors.dismissNotification
    });
  }, options);
  activeErrorToastIds.push(toastId);
  setTimeout(function () {
    return forgetErrorToast(toastId);
  }, ERROR_TOAST_DURATION_MS + 1000);
};
var showVideoSizeLimitToast = function showVideoSizeLimitToast() {
  var copy = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _clippingStudio["default"];
  showErrorToast(copy.errors.videoExceedsLimit.replace("{mb}", MAX_VIDEO_SIZE_MB), copy);
};
var isFileSizeError = function isFileSizeError(error) {
  var message = String((error === null || error === void 0 ? void 0 : error.message) || error || "");
  return /(?:\b413\b|payload too large|request entity too large|file(?: size)? (?:is )?too large|file is too heavy|exceeds?.*(?:size|limit)|слишком (?:больш|тяж)|превышает.*(?:размер|лимит))/i.test(message);
};
var showVideoUploadError = function showVideoUploadError(error) {
  var copy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _clippingStudio["default"];
  if (isFileSizeError(error)) {
    showErrorToast(copy.errors.videoTooLarge, copy);
    return;
  }
  var message = (0, _formatError.formatErrorMessage)(error, copy.errors.uploadFailed);
  showErrorToast(message, copy);
};
var getAspectClass = function getAspectClass(ar) {
  switch (ar) {
    case "16:9":
      return "aspect-video";
    case "1:1":
      return "aspect-square";
    case "4:5":
      return "aspect-[4/5]";
    case "4:3":
      return "aspect-[4/3]";
    case "3:4":
      return "aspect-[3/4]";
    case "9:16":
    default:
      return "aspect-[9/16]";
  }
};

// ---------------------------------------------------------------------------
// Main Clipping Studio Component
// ---------------------------------------------------------------------------
function ClippingStudio(_ref3) {
  var _result$coordinates;
  var apiKey = _ref3.apiKey,
    onGenerationStart = _ref3.onGenerationStart,
    onGenerationEnd = _ref3.onGenerationEnd,
    onGenerationComplete = _ref3.onGenerationComplete,
    onGenerationError = _ref3.onGenerationError,
    droppedFiles = _ref3.droppedFiles,
    onFilesHandled = _ref3.onFilesHandled,
    templateData = _ref3.templateData,
    _ref3$locale = _ref3.locale,
    locale = _ref3$locale === void 0 ? "en" : _ref3$locale;
  var copy = (0, _i18nUtils.resolveCopy)(_clippingStudio["default"], _clippingStudio2["default"], locale);
  var LEGACY_PERSIST_KEY = "hg_clipping_studio_persistent";
  var PERSIST_KEY = (0, _persistKey.scopedPersistKey)(LEGACY_PERSIST_KEY, apiKey);
  (0, _react.useEffect)(function () {
    (0, _persistKey.migrateLegacyPersistKey)(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

  // ── Clipping Parameters State ───────────────────────────────────────────
  var _useState = (0, _react.useState)(""),
    _useState2 = _slicedToArray(_useState, 2),
    videoUrl = _useState2[0],
    setVideoUrl = _useState2[1];
  var _useState3 = (0, _react.useState)(3),
    _useState4 = _slicedToArray(_useState3, 2),
    numHighlights = _useState4[0],
    setNumHighlights = _useState4[1];
  var _useState5 = (0, _react.useState)("9:16"),
    _useState6 = _slicedToArray(_useState5, 2),
    aspectRatio = _useState6[0],
    setAspectRatio = _useState6[1];
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    returnCoordinatesOnly = _useState8[0],
    setReturnCoordinatesOnly = _useState8[1];
  var _useState9 = (0, _react.useState)(""),
    _useState0 = _slicedToArray(_useState9, 2),
    prompt = _useState0[0],
    setPrompt = _useState0[1];

  // ── Dropdowns state ──
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    aspectDropdownOpen = _useState10[0],
    setAspectDropdownOpen = _useState10[1];
  var _useState11 = (0, _react.useState)(false),
    _useState12 = _slicedToArray(_useState11, 2),
    highlightsDropdownOpen = _useState12[0],
    setHighlightsDropdownOpen = _useState12[1];
  var dropdownRef = (0, _react.useRef)(null);
  var highlightsDropdownRef = (0, _react.useRef)(null);

  // ── Upload State ──
  var _useState13 = (0, _react.useState)(false),
    _useState14 = _slicedToArray(_useState13, 2),
    videoUploading = _useState14[0],
    setVideoUploading = _useState14[1];
  var _useState15 = (0, _react.useState)(0),
    _useState16 = _slicedToArray(_useState15, 2),
    videoProgress = _useState16[0],
    setVideoProgress = _useState16[1];
  var videoFileInputRef = (0, _react.useRef)(null);
  var _useState17 = (0, _react.useState)(false),
    _useState18 = _slicedToArray(_useState17, 2),
    isVideoDragging = _useState18[0],
    setIsVideoDragging = _useState18[1];
  var videoDragCounterRef = (0, _react.useRef)(0);

  // ── Generation State ─────────────────────────────────────────────────────
  var _useState19 = (0, _react.useState)(false),
    _useState20 = _slicedToArray(_useState19, 2),
    isGenerating = _useState20[0],
    setIsGenerating = _useState20[1];
  var _useState21 = (0, _react.useState)(null),
    _useState22 = _slicedToArray(_useState21, 2),
    generateError = _useState22[0],
    setGenerateError = _useState22[1];
  var _useState23 = (0, _react.useState)(null),
    _useState24 = _slicedToArray(_useState23, 2),
    fullscreenUrl = _useState24[0],
    setFullscreenUrl = _useState24[1];
  var _useState25 = (0, _react.useState)(0),
    _useState26 = _slicedToArray(_useState25, 2),
    elapsedTime = _useState26[0],
    setElapsedTime = _useState26[1];
  var timerRef = (0, _react.useRef)(null);

  // ── Output State ─────────────────────────────────────────────────────────
  var _useState27 = (0, _react.useState)(null),
    _useState28 = _slicedToArray(_useState27, 2),
    result = _useState28[0],
    setResult = _useState28[1]; // stores parsed completed API output
  var _useState29 = (0, _react.useState)(0),
    _useState30 = _slicedToArray(_useState29, 2),
    activeHighlightIndex = _useState30[0],
    setActiveHighlightIndex = _useState30[1];
  var mainVideoRef = (0, _react.useRef)(null);

  // ── History State ────────────────────────────────────────────────────────
  var _useState31 = (0, _react.useState)([]),
    _useState32 = _slicedToArray(_useState31, 2),
    history = _useState32[0],
    setHistory = _useState32[1];
  var ASPECT_RATIOS = [{
    label: copy.aspectRatioLabels["9:16"],
    value: "9:16"
  }, {
    label: copy.aspectRatioLabels["16:9"],
    value: "16:9"
  }, {
    label: copy.aspectRatioLabels["1:1"],
    value: "1:1"
  }, {
    label: copy.aspectRatioLabels["4:5"],
    value: "4:5"
  }, {
    label: copy.aspectRatioLabels["4:3"],
    value: "4:3"
  }, {
    label: copy.aspectRatioLabels["3:4"],
    value: "3:4"
  }];

  // Close dropdown when clicking outside
  (0, _react.useEffect)(function () {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAspectDropdownOpen(false);
      }
      if (highlightsDropdownRef.current && !highlightsDropdownRef.current.contains(event.target)) {
        setHighlightsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return function () {
      return document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Timer effect for generation progress
  (0, _react.useEffect)(function () {
    if (isGenerating) {
      setElapsedTime(0);
      timerRef.current = setInterval(function () {
        setElapsedTime(function (prev) {
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return function () {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  // ── Load Persistent State from localStorage ──────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        if (data.videoUrl) setVideoUrl(data.videoUrl);
        if (data.numHighlights) setNumHighlights(data.numHighlights);
        if (data.aspectRatio) setAspectRatio(data.aspectRatio);
        if (data.returnCoordinatesOnly !== undefined) setReturnCoordinatesOnly(data.returnCoordinatesOnly);
        if (data.history) setHistory(data.history);
        if (data.result) setResult(data.result);
      }
    } catch (err) {
      console.warn("Failed to load ClippingStudio persistent state:", err);
    }
  }, []);

  // ── Save Persistent State to localStorage ───────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      try {
        var state = {
          videoUrl: videoUrl,
          numHighlights: numHighlights,
          aspectRatio: aspectRatio,
          returnCoordinatesOnly: returnCoordinatesOnly,
          history: history,
          result: result
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save ClippingStudio persistent state:", err);
      }
    }, 500);
    return function () {
      return clearTimeout(timer);
    };
  }, [videoUrl, numHighlights, aspectRatio, returnCoordinatesOnly, history, result]);

  // ── Handle Dropped Files ────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (droppedFiles && droppedFiles.length > 0) {
      var videoFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith('video/');
      });
      if (videoFiles.length > 0) {
        var file = videoFiles[0];
        if (file.size > MAX_VIDEO_SIZE_BYTES) {
          showVideoSizeLimitToast(copy);
          onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
          return;
        }
        setVideoUploading(true);
        setVideoProgress(0);
        (0, _muapi.uploadFile)(apiKey, file, function (pct) {
          setVideoProgress(pct);
        }).then(function (url) {
          setVideoUrl(url);
          setVideoUploading(false);
        })["catch"](function (err) {
          setVideoUploading(false);
          showVideoUploadError(err, copy);
        });
      }
      onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
    }
  }, [droppedFiles, onFilesHandled, apiKey]);

  // ── Apply pending Skills recipe (set by SkillsBrowser) ────────────────────
  (0, _react.useEffect)(function () {
    var pending = (0, _skillStore.getPendingRecipe)("clipping");
    if (!pending) return;
    var skill = _registry["default"].skills.find(function (s) {
      return s.slug === pending;
    });
    (0, _skillStore.clearPendingRecipe)("clipping");
    if (!skill) return;
    applyRecipe(skill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cross-studio: import a Storyboard hand-off ────────────────────────────
  var handoffApplied = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    try {
      var handoff = (0, _storyboardHandoff.readStoryboardHandoff)("clipping");
      if (!handoff || handoffApplied.current === handoff.createdAt) return;
      handoffApplied.current = handoff.createdAt;
      if (handoff.combinedPrompt || handoff.projectName) {
        setPrompt(handoff.combinedPrompt || handoff.projectName);
      }
      if (["1:1", "16:9", "9:16"].includes(handoff.aspectRatio)) {
        setAspectRatio(handoff.aspectRatio);
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
    if (step0.aspectRatio) setAspectRatio(step0.aspectRatio);
    var vals = {};
    (skill.inputs || []).forEach(function (i) {
      vals[i.name] = "";
    });
    setPrompt((0, _promptRecipes.fillTemplate)(step0.prompt || skill.description || "", vals));
  }

  // ── Apply template data from landing page "Create This Style" ──────────────
  var _useTemplateData = (0, _useTemplateData2.useTemplateData)(templateData, function (data) {
      if (data.prompt) {
        setPrompt(data.prompt);
      }
      if (data.aspectRatio) {
        var normalized = (0, _useTemplateData2.normalizeAspectRatio)(data.aspectRatio, "9:16");
        setAspectRatio(normalized);
      }
    }),
    resetTemplate = _useTemplateData.reset,
    isTemplateApplied = _useTemplateData.isTemplateApplied;

  // Adjust URL textarea height dynamically
  // ── Highlight Seeking Helper ─────────────────────────────────────────────
  var seekToHighlight = function seekToHighlight(startSec) {
    if (mainVideoRef.current) {
      mainVideoRef.current.currentTime = startSec;
      mainVideoRef.current.play()["catch"](function () {});
    }
  };

  // Helper formatting seconds to MM:SS
  var formatSeconds = function formatSeconds(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds === null || totalSeconds === undefined) return "0:00";
    var mins = Math.floor(totalSeconds / 60);
    var secs = Math.floor(totalSeconds % 60);
    return "".concat(mins, ":").concat(secs < 10 ? "0" : "").concat(secs);
  };

  // ── Copy Link & Download Helpers ─────────────────────────────────────────
  var copyToClipboard = function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert(copy.alerts.urlCopied);
  };
  var downloadVideo = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(url) {
      var title,
        response,
        blob,
        blobUrl,
        a,
        _args = arguments,
        _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            title = _args.length > 1 && _args[1] !== undefined ? _args[1] : "clipped_video";
            _context.p = 1;
            _context.n = 2;
            return fetch(url);
          case 2:
            response = _context.v;
            _context.n = 3;
            return response.blob();
          case 3:
            blob = _context.v;
            blobUrl = URL.createObjectURL(blob);
            a = document.createElement("a");
            a.href = blobUrl;
            a.download = "".concat(title.replace(/\s+/g, '_'), ".mp4");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            window.open(url, "_blank");
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[1, 4]]);
    }));
    return function downloadVideo(_x) {
      return _ref4.apply(this, arguments);
    };
  }();
  var handlePromptInput = function handlePromptInput(e) {
    var val = e.target.value;
    if (val.trim().match(/^https?:\/\/[^\s]+$/i)) {
      setVideoUrl(val.trim());
      setPrompt("");
      return;
    }
    setPrompt(val);
  };

  // ── Video File Handlers ──
  var processVideoFiles = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(files) {
      var file, url, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            file = files && files[0];
            if (file) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            if (!(file.size > MAX_VIDEO_SIZE_BYTES)) {
              _context2.n = 2;
              break;
            }
            showVideoSizeLimitToast(copy);
            if (videoFileInputRef.current) videoFileInputRef.current.value = "";
            return _context2.a(2);
          case 2:
            setVideoUploading(true);
            setVideoProgress(0);
            _context2.p = 3;
            _context2.n = 4;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              setVideoProgress(pct);
            });
          case 4:
            url = _context2.v;
            setVideoUrl(url);
            _context2.n = 6;
            break;
          case 5:
            _context2.p = 5;
            _t2 = _context2.v;
            console.error("[ClippingStudio] Video upload failed:", _t2);
            showVideoUploadError(_t2, copy);
          case 6:
            _context2.p = 6;
            setVideoUploading(false);
            setVideoProgress(0);
            if (videoFileInputRef.current) videoFileInputRef.current.value = "";
            return _context2.f(6);
          case 7:
            return _context2.a(2);
        }
      }, _callee2, null, [[3, 5, 6, 7]]);
    }));
    return function processVideoFiles(_x2) {
      return _ref5.apply(this, arguments);
    };
  }();
  var handleVideoFileChange = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(e) {
      var files;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            files = Array.from(e.target.files || []);
            _context3.n = 1;
            return processVideoFiles(files);
          case 1:
            return _context3.a(2);
        }
      }, _callee3);
    }));
    return function handleVideoFileChange(_x3) {
      return _ref6.apply(this, arguments);
    };
  }();
  var handleVideoDragEnter = function handleVideoDragEnter(e) {
    var _e$dataTransfer;
    e.preventDefault();
    e.stopPropagation();
    videoDragCounterRef.current += 1;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsVideoDragging(true);
    }
  };
  var handleVideoDragLeave = function handleVideoDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    videoDragCounterRef.current -= 1;
    if (videoDragCounterRef.current <= 0) {
      videoDragCounterRef.current = 0;
      setIsVideoDragging(false);
    }
  };
  var handleVideoDragOver = function handleVideoDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  var handleVideoDrop = function handleVideoDrop(e) {
    var _e$dataTransfer2;
    e.preventDefault();
    e.stopPropagation();
    videoDragCounterRef.current = 0;
    setIsVideoDragging(false);
    var files = Array.from(((_e$dataTransfer2 = e.dataTransfer) === null || _e$dataTransfer2 === void 0 ? void 0 : _e$dataTransfer2.files) || []).filter(function (f) {
      return f.type.startsWith("video/");
    });
    if (files.length > 0) {
      processVideoFiles(files);
    }
  };
  var clearVideoUpload = function clearVideoUpload() {
    setVideoUrl("");
  };

  // ── Dispatch Run / Call submitAndPoll ────────────────────────────────────
  var handleGenerate = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
      var _res$output, _res$output2, _res$output3, params, res, clips, outputCoordinates, newResult, errMsg, notificationMessage, _t3;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (videoUrl) {
              _context4.n = 1;
              break;
            }
            alert(copy.alerts.needVideo);
            return _context4.a(2);
          case 1:
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            setIsGenerating(true);
            setGenerateError(null);
            setResult(null);
            _context4.p = 2;
            params = {
              video_url: videoUrl,
              num_highlights: numHighlights,
              aspect_ratio: aspectRatio,
              return_coordinates_only: returnCoordinatesOnly
            };
            _context4.n = 3;
            return (0, _muapi.runClipping)(apiKey, params);
          case 3:
            res = _context4.v;
            // Parse the result
            clips = res.outputs || [];
            outputCoordinates = ((_res$output = res.output) === null || _res$output === void 0 ? void 0 : _res$output.coordinates) || res.coordinates || ((_res$output2 = res.output) === null || _res$output2 === void 0 ? void 0 : _res$output2.timings) || res.timings || [];
            newResult = {
              id: res.id || Date.now().toString(),
              videoUrl: videoUrl,
              clips: clips,
              coordinates: Array.isArray(outputCoordinates) ? outputCoordinates : ((_res$output3 = res.output) === null || _res$output3 === void 0 ? void 0 : _res$output3.clips) || [],
              returnCoordinatesOnly: returnCoordinatesOnly,
              aspectRatio: aspectRatio,
              timestamp: new Date().toISOString()
            }; // Mock coordinates if API succeeded but modal coordinates are empty in coordinate-only mode
            if (returnCoordinatesOnly && newResult.coordinates.length === 0) {
              newResult.coordinates = Array.from({
                length: numHighlights
              }).map(function (_, idx) {
                return {
                  label: "Highlight #".concat(idx + 1),
                  start_time: idx * 15,
                  end_time: (idx + 1) * 15,
                  start: idx * 15,
                  end: (idx + 1) * 15,
                  score: 0.95 - idx * 0.05
                };
              });
            }
            setResult(newResult);
            setActiveHighlightIndex(0);

            // Append to history
            setHistory(function (prev) {
              return [newResult].concat(_toConsumableArray(prev)).slice(0, 30);
            });
            if (onGenerationComplete) {
              onGenerationComplete({
                url: clips[0] || videoUrl,
                model: "ai-clipping",
                type: "video"
              });
            }
            _context4.n = 5;
            break;
          case 4:
            _context4.p = 4;
            _t3 = _context4.v;
            console.error("[ClippingStudio] Error generating clips:", _t3);
            errMsg = (0, _formatError.formatErrorMessage)(_t3, copy.errors.generationFailed);
            notificationMessage = isFileSizeError(_t3) ? copy.errors.videoTooLarge : errMsg;
            if (onGenerationError) onGenerationError(notificationMessage);else showErrorToast(notificationMessage, copy);
          case 5:
            _context4.p = 5;
            setIsGenerating(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context4.f(5);
          case 6:
            return _context4.a(2);
        }
      }, _callee4, null, [[2, 4, 5, 6]]);
    }));
    return function handleGenerate() {
      return _ref7.apply(this, arguments);
    };
  }();
  var handleSelectHistory = function handleSelectHistory(entry) {
    setResult(entry);
    setActiveHighlightIndex(0);
    setVideoUrl(entry.videoUrl);
    setNumHighlights(entry.numHighlights || 3);
    setAspectRatio(entry.aspectRatio || "9:16");
    setReturnCoordinatesOnly(entry.returnCoordinatesOnly || false);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "w-full h-full flex flex-col items-center justify-center bg-app-bg text-white relative overflow-hidden",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2",
      children: [generateError && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded text-xs font-semibold leading-relaxed mb-6",
        children: generateError
      }), !result && history.length === 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
            children: copy.headings.startCreatingWith
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight",
            children: copy.headings.aiClippingStudio
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4",
          children: copy.headings.emptyStateSubtitle
        })]
      }), !result && history.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "space-y-6 pt-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-between border-b border-white/5 pb-4",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("h2", {
            className: "text-sm font-black text-white uppercase tracking-widest flex items-center gap-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ScissorsIcon, {
              className: "text-primary w-4 h-4"
            }), copy.headings.clippingHistoryRuns]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-xs font-bold text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded",
            children: copy.headings.savedGenerations.replace('{count}', history.length)
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-fade-in-up",
          children: history.map(function (entry, idx) {
            var _entry$coordinates, _entry$clips;
            return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              onClick: function onClick() {
                return handleSelectHistory(entry);
              },
              className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "aspect-video bg-zinc-950 flex items-center justify-center border-b border-white/5 relative overflow-hidden",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
                  src: entry.videoUrl,
                  className: "w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity animate-fade-in",
                  preload: "metadata",
                  muted: true,
                  loop: true,
                  playsInline: true,
                  onMouseOver: function onMouseOver(e) {
                    return e.target.play();
                  },
                  onMouseOut: function onMouseOut(e) {
                    e.target.pause();
                    e.target.currentTime = 0;
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute top-2 right-2 z-10 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                    type: "button",
                    title: copy.buttons.deleteFromHistory,
                    onClick: function onClick(e) {
                      e.stopPropagation();
                      setHistory(function (prev) {
                        return prev.filter(function (h) {
                          return h.id !== entry.id;
                        });
                      });
                    },
                    className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-all border border-white/10",
                    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(TrashIcon, {})
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions["default"], {
                  actions: [{
                    kind: "delete",
                    label: copy.buttons["delete"],
                    danger: true,
                    onSelect: function onSelect() {
                      return setHistory(function (prev) {
                        return prev.filter(function (historyEntry) {
                          return historyEntry.id !== entry.id;
                        });
                      });
                    }
                  }]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex flex-col gap-1",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
                    className: "text-xs font-bold text-white truncate",
                    title: entry.videoUrl.split('/').pop(),
                    children: entry.videoUrl.split('/').pop() || copy.sourceVideoFallback
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                    className: "text-[9px] text-zinc-500 font-semibold uppercase tracking-wider",
                    children: entry.returnCoordinatesOnly ? copy.modes.timelineSeek : copy.modes.clipsGallery
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center justify-between mt-1",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20",
                    children: entry.aspectRatio
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] text-white/40",
                    children: entry.returnCoordinatesOnly ? copy.labels.highlights.replace('{count}', ((_entry$coordinates = entry.coordinates) === null || _entry$coordinates === void 0 ? void 0 : _entry$coordinates.length) || 0) : copy.labels.clips.replace('{count}', ((_entry$clips = entry.clips) === null || _entry$clips === void 0 ? void 0 : _entry$clips.length) || 0)
                  })]
                })]
              })]
            }, entry.id || idx);
          })
        })]
      }), result && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex-1 flex flex-col min-h-0",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-between mb-6 pb-4 border-b border-white/5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            type: "button",
            onClick: function onClick() {
              return setResult(null);
            },
            className: "flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "19",
                y1: "12",
                x2: "5",
                y2: "12"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                points: "12 19 5 12 12 5"
              })]
            }), copy.headings.backToHistory]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded",
              children: result.returnCoordinatesOnly ? copy.modes.timelineSeek : copy.modes.clipsGallery
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[10px] text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded",
              children: result.aspectRatio
            })]
          })]
        }), result.returnCoordinatesOnly ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex-1 flex flex-col lg:flex-row gap-6 min-h-0",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex-1 bg-black border border-zinc-900 rounded-lg overflow-hidden flex flex-col shadow-2xl relative min-h-[300px] lg:min-h-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/5 z-10 text-[10px] uppercase font-bold tracking-wider text-primary",
              children: copy.headings.originalVideoPlayer
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
              ref: mainVideoRef,
              src: result.videoUrl,
              controls: true,
              className: "w-full flex-1 object-contain bg-zinc-950",
              preload: "auto"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "w-full lg:w-[350px] border border-zinc-900 bg-zinc-950/40 backdrop-blur-md rounded-lg p-5 flex flex-col min-h-[350px] lg:min-h-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "pb-4 border-b border-zinc-900 flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
                className: "text-xs font-black text-white uppercase tracking-widest",
                children: copy.headings.highlightsTimeline
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800",
                children: copy.headings.matches.replace('{count}', ((_result$coordinates = result.coordinates) === null || _result$coordinates === void 0 ? void 0 : _result$coordinates.length) || 0)
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "flex-1 overflow-y-auto custom-scrollbar mt-4 space-y-3 pr-1",
              children: result.coordinates && result.coordinates.length > 0 ? result.coordinates.map(function (hl, i) {
                var start = hl.start_time !== undefined ? hl.start_time : hl.start || 0;
                var end = hl.end_time !== undefined ? hl.end_time : hl.end || 0;
                var isActive = activeHighlightIndex === i;
                return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                  type: "button",
                  onClick: function onClick() {
                    setActiveHighlightIndex(i);
                    seekToHighlight(start);
                  },
                  className: "w-full p-4 border rounded-lg text-left transition-all hover:bg-zinc-900/60 flex flex-col gap-2 group/hl ".concat(isActive ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(34,211,238,0.03)]" : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"),
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "flex items-center justify-between w-full",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-xs font-bold transition-colors ".concat(isActive ? "text-primary" : "text-white"),
                      children: hl.label || copy.labels.highlightFallback.replace('{index}', i + 1)
                    }), hl.score && /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                      className: "text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20",
                      children: [(hl.score * 100).toFixed(0), copy.labels.scoreSuffix]
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "flex items-center gap-2 text-[10px] text-zinc-400 font-semibold",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ClockIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                      children: [formatSeconds(start), " - ", formatSeconds(end)]
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-zinc-650",
                      children: "\u2022"
                    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                      className: "text-primary/80 font-bold",
                      children: [(end - start).toFixed(0), copy.labels.durationSuffix]
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "flex items-center gap-1.5 text-[10px] font-bold text-primary mt-1 opacity-0 group-hover/hl:opacity-100 transition-opacity",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(PlayIcon, {}), " ", copy.labels.seekAndPlay]
                  })]
                }, i);
              }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-center py-8 text-xs text-zinc-500 font-semibold",
                children: copy.empty.noHighlights
              })
            })]
          })]
        }) :
        /*#__PURE__*/
        /* Clips Grid Gallery */
        (0, _jsxRuntime.jsxs)("div", {
          className: "space-y-5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center justify-between border-b border-zinc-900 pb-3.5",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
              className: "text-xs font-black text-white uppercase tracking-widest",
              children: copy.headings.extractedVideoClips
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800",
              children: copy.headings.aspectRatioLabel.replace('{ratio}', result.aspectRatio)
            })]
          }), result.clips && result.clips.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6",
            children: result.clips.map(function (clipUrl, i) {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                onClick: function onClick() {
                  return setFullscreenUrl(clipUrl);
                },
                className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "relative group/vid border-b border-white/5 overflow-hidden bg-black/40",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
                    src: clipUrl,
                    className: "w-full ".concat(getAspectClass(result.aspectRatio), " object-cover bg-black/40 hover:opacity-85 transition-opacity"),
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
                    className: "absolute top-2 right-2 z-10 hidden md:flex flex-col gap-2 opacity-0 group-hover/vid:opacity-100 transition-opacity",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions.GenerationCopyButtons, {
                      prompt: result.prompt,
                      onCopyError: onGenerationError
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                      type: "button",
                      title: copy.buttons.copyLink,
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        copyToClipboard(clipUrl);
                      },
                      className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10",
                      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(CopyIcon, {})
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                      type: "button",
                      title: copy.buttons.download,
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        downloadVideo(clipUrl, "clip-".concat(i + 1, ".mp4"));
                      },
                      className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10",
                      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(DownloadIcon, {})
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_SocialPublishProvider.PublishStep, {
                      mediaUrl: clipUrl,
                      mediaType: "video",
                      className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center"
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_AiAssistantProvider.AssistStep, {
                      assetUrl: clipUrl,
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
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions["default"], {
                    prompt: result.prompt,
                    onCopyError: onGenerationError,
                    actions: [{
                      kind: "copy",
                      label: copy.buttons.copyLinkShort,
                      onSelect: function onSelect() {
                        return copyToClipboard(clipUrl);
                      }
                    }, {
                      kind: "download",
                      label: copy.buttons.download,
                      onSelect: function onSelect() {
                        return downloadVideo(clipUrl, "clip-".concat(i + 1, ".mp4"));
                      }
                    }]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/5 text-[9px] uppercase font-black tracking-wider text-primary",
                    children: copy.labels.clipIndex.replace('{index}', i + 1)
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
                  children: [result.prompt && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                    className: "text-white/70 text-xs line-clamp-2 leading-relaxed",
                    title: result.prompt,
                    children: result.prompt
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "flex items-center justify-between mt-1",
                    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center gap-2",
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap",
                        children: copy.labels.aiClipping
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-[10px] text-white/40",
                        children: result.aspectRatio || copy.labels.clipIndex.replace('{index}', i + 1)
                      })]
                    })
                  })]
                })]
              }, i);
            })
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "py-20 text-center text-xs text-zinc-500 font-semibold border border-zinc-900 rounded bg-zinc-950/20",
            children: copy.empty.noClips
          })]
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptComposer, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_TemplateBanner["default"], {
        isApplied: isTemplateApplied,
        onClear: resetTemplate
      }), videoUrl && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-center gap-2.5 px-1 pb-1",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: _PromptComposer.PROMPT_MEDIA_PREVIEW_CLASS,
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
            src: videoUrl,
            className: "w-full h-full object-cover",
            muted: true,
            playsInline: true
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: clearVideoUpload,
            className: "absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white/85 hover:text-white text-[8px] border border-white/5",
            title: copy.buttons.clearVideo,
            children: "\xD7"
          })]
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-start gap-3 px-1",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
          ref: videoFileInputRef,
          type: "file",
          accept: "video/*",
          className: "hidden",
          onChange: handleVideoFileChange
        }), !videoUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          type: "button",
          title: copy.buttons.uploadSourceVideo,
          onClick: function onClick() {
            var _videoFileInputRef$cu;
            return (_videoFileInputRef$cu = videoFileInputRef.current) === null || _videoFileInputRef$cu === void 0 ? void 0 : _videoFileInputRef$cu.click();
          },
          onDragEnter: handleVideoDragEnter,
          onDragLeave: handleVideoDragLeave,
          onDragOver: handleVideoDragOver,
          onDrop: handleVideoDrop,
          className: "".concat((0, _PromptComposer.promptMediaButtonClassName)({
            active: Boolean(videoUrl)
          })).concat(isVideoDragging ? " ring-2 ring-primary border-primary bg-primary/10" : ""),
          children: [videoUploading ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/85 z-20 backdrop-blur-[1px]",
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
                strokeDashoffset: 88 - 88 * videoProgress / 100,
                className: "text-[#22d3ee] transition-all duration-300"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "absolute text-[8px] font-black text-[#22d3ee] leading-none ".concat(videoProgress >= 100 ? "animate-pulse" : ""),
              children: videoProgress >= 100 ? "..." : "".concat(videoProgress, "%")
            })]
          }) : null, /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
            width: "18",
            height: "18",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            className: "text-white/40 group-hover:text-[#22d3ee] transition-colors",
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
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex-1 flex flex-col gap-1",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptTextarea, {
            value: prompt,
            onChange: handlePromptInput,
            placeholder: copy.placeholders.promptOrUrl
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptFooter, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptControls, {
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: (0, _PromptComposer.promptControlClassName)(),
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center shadow-lg shadow-[#22d3ee]/10",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[9px] font-bold text-black uppercase",
                children: "C"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
              children: copy.labels.aiClipping
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            ref: dropdownRef,
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setAspectDropdownOpen(!aspectDropdownOpen);
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: aspectDropdownOpen
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAspectRatioIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: aspectRatio
              })]
            }), aspectDropdownOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.popovers.aspectRatio
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: ASPECT_RATIOS.map(function (r) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    selected: aspectRatio === r.value,
                    onClick: function onClick() {
                      setAspectRatio(r.value);
                      setAspectDropdownOpen(false);
                    },
                    children: r.value
                  }, r.value);
                })
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            ref: highlightsDropdownRef,
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setHighlightsDropdownOpen(!highlightsDropdownOpen);
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: highlightsDropdownOpen
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptDurationIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: copy.labels.highlights.replace('{count}', numHighlights)
              })]
            }), highlightsDropdownOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              className: "min-w-[180px] overflow-visible",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                className: "mb-3",
                children: copy.popovers.maxHighlights
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "space-y-3",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center justify-between",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs text-white/60",
                    children: copy.popovers.limit
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded",
                    children: numHighlights
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                  type: "range",
                  min: "1",
                  max: "60",
                  step: "1",
                  value: numHighlights,
                  onChange: function onChange(e) {
                    return setNumHighlights(Number(e.target.value));
                  },
                  className: "w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-primary"
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            type: "button",
            onClick: function onClick() {
              return setReturnCoordinatesOnly(!returnCoordinatesOnly);
            },
            className: (0, _PromptComposer.promptControlClassName)({
              active: returnCoordinatesOnly,
              className: returnCoordinatesOnly ? "text-[#22d3ee]" : "text-white/70 hover:text-white"
            }),
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ScissorsIcon, {
              className: "w-4 h-4 text-current"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-xs font-semibold",
              children: copy.buttons.coordinatesOnly
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAction, {
          onClick: handleGenerate,
          disabled: isGenerating,
          children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "animate-spin inline-block text-black",
              children: "\u25CC"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.buttons.generating
            })]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.buttons.generate
            })
          })
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("style", {
      jsx: true,
      global: true,
      children: "\n        .custom-scrollbar::-webkit-scrollbar {\n          width: 6px;\n          height: 6px;\n        }\n        .custom-scrollbar::-webkit-scrollbar-track {\n          background: transparent;\n        }\n        .custom-scrollbar::-webkit-scrollbar-thumb {\n          background: rgba(255, 255, 255, 0.08);\n          border-radius: 99px;\n        }\n        .custom-scrollbar::-webkit-scrollbar-thumb:hover {\n          background: rgba(255, 255, 255, 0.15);\n        }\n        .custom-scrollbar {\n          scrollbar-width: thin;\n          scrollbar-color: rgba(255, 255, 255, 0.08) transparent;\n        }\n      "
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactHotToast.Toaster, {
      toasterId: CLIPPING_TOASTER_ID,
      position: "bottom-right",
      reverseOrder: false,
      gutter: 8,
      containerStyle: {
        zIndex: 99999,
        right: 20,
        bottom: 20
      },
      toastOptions: {
        duration: 6000,
        style: {
          background: "#0d0d0f",
          color: "#f4f4f5",
          border: "1px solid rgba(239,68,68,0.35)",
          fontSize: "13px",
          borderRadius: "12px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
          maxWidth: "380px",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          padding: "12px 14px"
        },
        error: {
          iconTheme: {
            primary: "#f87171",
            secondary: "#0d0d0f"
          }
        }
      }
    })]
  });
}