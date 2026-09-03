"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = VideoStudioParity;
var _react = require("react");
var _reactHotToast = _interopRequireWildcard(require("react-hot-toast"));
var _muapi = require("../muapi.js");
var _models = require("../models.js");
var _modelFamilies = require("../modelFamilies.js");
var _modelCapabilities = require("../modelCapabilities.js");
var _modelParameters = require("../modelParameters.js");
var _videoWorkflows = require("../videoWorkflows.js");
var _videoAdvancedControls = require("../videoAdvancedControls.js");
var _persistKey = require("../persistKey.js");
var _formatError = require("../utils/formatError.js");
var _storyboardHandoff = require("../storyboardHandoff.js");
var _skillStore = require("../lib/skillStore");
var _characterStore = require("../lib/characterStore");
var _promptRecipes = require("../lib/promptRecipes");
var _registry = _interopRequireDefault(require("../skills/registry.json"));
var _ModelParameterControls = _interopRequireDefault(require("./ModelParameterControls.jsx"));
var _MobileGenerationActions = _interopRequireWildcard(require("./MobileGenerationActions.jsx"));
var _UniversalMediaUploader = _interopRequireDefault(require("./UniversalMediaUploader.jsx"));
var _DrawModal = _interopRequireDefault(require("./DrawModal.jsx"));
var _PromptComposer = require("./prompt/PromptComposer.jsx");
var _SocialPublishProvider = require("../../../../components/SocialPublishProvider");
var _AiAssistantProvider = require("../../../../components/AiAssistantProvider");
var _videoStudio = _interopRequireDefault(require("../messages/en/videoStudio.json"));
var _i18nUtils = require("../i18nUtils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t5 in e) "default" !== _t5 && {}.hasOwnProperty.call(e, _t5) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t5)) && (i.get || i.set) ? o(f, _t5, i) : f[_t5] = e[_t5]); return f; })(e, t); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var LEGACY_MEDIA_ADVANCED_KEYS = new Set(["first_frame", "last_frame", "images_list", "videos_list", "audios_list", "reference_image_urls", "audio_url", "video_url", "references"]);
function migrateLegacyVideoFrames(stored, selectedWorkflowId, setWorkflowMedia, setBaseMedia) {
  var _workflowMedia$startF, _workflowMedia$endFra, _workflowMedia$startF2, _baseMedia$imageUrls, _workflowMedia$endFra2;
  if (!selectedWorkflowId || !(stored !== null && stored !== void 0 && stored.baseMedia)) return;
  var workflowMedia = stored.workflowMedia || {};
  if ((_workflowMedia$startF = workflowMedia.startFrame) !== null && _workflowMedia$startF !== void 0 && _workflowMedia$startF.length || (_workflowMedia$endFra = workflowMedia.endFrame) !== null && _workflowMedia$endFra !== void 0 && _workflowMedia$endFra.length) return;
  var baseMedia = stored.baseMedia;
  var updates = {};
  if (!((_workflowMedia$startF2 = workflowMedia.startFrame) !== null && _workflowMedia$startF2 !== void 0 && _workflowMedia$startF2.length) && (_baseMedia$imageUrls = baseMedia.imageUrls) !== null && _baseMedia$imageUrls !== void 0 && _baseMedia$imageUrls[0]) {
    updates.startFrame = unique([baseMedia.imageUrls[0]]).slice(0, 1);
  }
  if (!((_workflowMedia$endFra2 = workflowMedia.endFrame) !== null && _workflowMedia$endFra2 !== void 0 && _workflowMedia$endFra2.length) && baseMedia.endImageUrl) {
    updates.endFrame = unique([baseMedia.endImageUrl]).slice(0, 1);
  }
  if (Object.keys(updates).length) {
    setWorkflowMedia(function (media) {
      return _objectSpread(_objectSpread({}, media), updates);
    });
  }
}
function unique(items) {
  return _toConsumableArray(new Set((items || []).filter(Boolean)));
}
function downloadFile(url, filename) {
  fetch(url).then(function (response) {
    return response.blob();
  }).then(function (blob) {
    var blobUrl = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  })["catch"](function () {
    return window.open(url, "_blank");
  });
}
function AdvancedField(_ref) {
  var _ref3;
  var control = _ref.control,
    value = _ref.value,
    _onChange = _ref.onChange;
  var common = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-[#22d3ee]/50";
  if (control.type === "boolean") {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("label", {
      className: "flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-xs font-semibold text-white/65",
        children: control.label
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        type: "checkbox",
        checked: Boolean(value),
        onChange: function onChange(event) {
          return _onChange(event.target.checked);
        }
      })]
    });
  }
  if (control.type === "enum") {
    var _ref2;
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("label", {
      className: "flex flex-col gap-1.5",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-[11px] font-semibold text-white/50",
        children: control.label
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("select", {
        className: common,
        value: (_ref2 = value !== null && value !== void 0 ? value : control["default"]) !== null && _ref2 !== void 0 ? _ref2 : "",
        onChange: function onChange(event) {
          return _onChange(event.target.value);
        },
        children: (control["enum"] || []).map(function (option) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
            value: option,
            children: option
          }, option);
        })
      })]
    });
  }
  if (control.type === "textarea") {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("label", {
      className: "flex flex-col gap-1.5",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-[11px] font-semibold text-white/50",
        children: control.label
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
        className: "".concat(common, " min-h-20 resize-y"),
        value: value !== null && value !== void 0 ? value : "",
        onChange: function onChange(event) {
          return _onChange(event.target.value);
        }
      })]
    });
  }
  var numeric = control.type === "int" || control.type === "number";
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("label", {
    className: "flex flex-col gap-1.5",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "text-[11px] font-semibold text-white/50",
      children: control.label
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      className: common,
      type: numeric ? "number" : "text",
      min: control.min,
      max: control.max,
      step: control.step,
      value: (_ref3 = value !== null && value !== void 0 ? value : control["default"]) !== null && _ref3 !== void 0 ? _ref3 : "",
      onChange: function onChange(event) {
        return _onChange(numeric ? Number(event.target.value) : event.target.value);
      }
    })]
  });
}
function VideoStudioParity(_ref4) {
  var _t2vModels$, _defaultVariant$model, _defaultVariant$model2, _defaultVariant$model3, _defaultVariant$model4, _defaultVariant$model5, _defaultVariant$model6, _selectedModelObj$inp, _selectedFamily$suppo5, _selectedFamily$suppo6, _workflowFamily$workf, _workflowFamily$workf2, _selectedFamily$suppo8;
  var apiKey = _ref4.apiKey,
    onGenerationStart = _ref4.onGenerationStart,
    onGenerationEnd = _ref4.onGenerationEnd,
    onGenerationComplete = _ref4.onGenerationComplete,
    onGenerationError = _ref4.onGenerationError,
    historyItems = _ref4.historyItems,
    onDeleteHistoryItem = _ref4.onDeleteHistoryItem,
    droppedFiles = _ref4.droppedFiles,
    onFilesHandled = _ref4.onFilesHandled,
    templateData = _ref4.templateData,
    _ref4$locale = _ref4.locale,
    locale = _ref4$locale === void 0 ? "en" : _ref4$locale;
  var copy = (0, _i18nUtils.resolveCopy)(_videoStudio["default"], null, locale);
  var defaultVariant = _modelFamilies.videoModelCatalog.variantById.get((_t2vModels$ = _models.t2vModels[0]) === null || _t2vModels$ === void 0 ? void 0 : _t2vModels$.id);
  var defaultFamily = _modelFamilies.videoModelCatalog.familyByVariantId.get(defaultVariant === null || defaultVariant === void 0 || (_defaultVariant$model = defaultVariant.model) === null || _defaultVariant$model === void 0 ? void 0 : _defaultVariant$model.id);
  var persistKey = (0, _persistKey.scopedPersistKey)("hg_video_studio_persistent", apiKey);
  var _useState = (0, _react.useState)((defaultVariant === null || defaultVariant === void 0 || (_defaultVariant$model2 = defaultVariant.model) === null || _defaultVariant$model2 === void 0 ? void 0 : _defaultVariant$model2.id) || ""),
    _useState2 = _slicedToArray(_useState, 2),
    selectedModel = _useState2[0],
    setSelectedModel = _useState2[1];
  var _useState3 = (0, _react.useState)((defaultFamily === null || defaultFamily === void 0 ? void 0 : defaultFamily.id) || ""),
    _useState4 = _slicedToArray(_useState3, 2),
    selectedFamilyId = _useState4[0],
    setSelectedFamilyId = _useState4[1];
  var _useState5 = (0, _react.useState)(null),
    _useState6 = _slicedToArray(_useState5, 2),
    selectedWorkflowId = _useState6[0],
    setSelectedWorkflowId = _useState6[1];
  var _useState7 = (0, _react.useState)(""),
    _useState8 = _slicedToArray(_useState7, 2),
    prompt = _useState8[0],
    setPrompt = _useState8[1];
  var _useState9 = (0, _react.useState)((defaultVariant === null || defaultVariant === void 0 || (_defaultVariant$model3 = defaultVariant.model) === null || _defaultVariant$model3 === void 0 || (_defaultVariant$model3 = _defaultVariant$model3.inputs) === null || _defaultVariant$model3 === void 0 || (_defaultVariant$model3 = _defaultVariant$model3.aspect_ratio) === null || _defaultVariant$model3 === void 0 ? void 0 : _defaultVariant$model3["default"]) || "16:9"),
    _useState0 = _slicedToArray(_useState9, 2),
    selectedAr = _useState0[0],
    setSelectedAr = _useState0[1];
  var _useState1 = (0, _react.useState)((defaultVariant === null || defaultVariant === void 0 || (_defaultVariant$model4 = defaultVariant.model) === null || _defaultVariant$model4 === void 0 || (_defaultVariant$model4 = _defaultVariant$model4.inputs) === null || _defaultVariant$model4 === void 0 || (_defaultVariant$model4 = _defaultVariant$model4.duration) === null || _defaultVariant$model4 === void 0 ? void 0 : _defaultVariant$model4["default"]) || 5),
    _useState10 = _slicedToArray(_useState1, 2),
    selectedDuration = _useState10[0],
    setSelectedDuration = _useState10[1];
  var _useState11 = (0, _react.useState)((defaultVariant === null || defaultVariant === void 0 || (_defaultVariant$model5 = defaultVariant.model) === null || _defaultVariant$model5 === void 0 || (_defaultVariant$model5 = _defaultVariant$model5.inputs) === null || _defaultVariant$model5 === void 0 || (_defaultVariant$model5 = _defaultVariant$model5.resolution) === null || _defaultVariant$model5 === void 0 ? void 0 : _defaultVariant$model5["default"]) || ""),
    _useState12 = _slicedToArray(_useState11, 2),
    selectedResolution = _useState12[0],
    setSelectedResolution = _useState12[1];
  var _useState13 = (0, _react.useState)((defaultVariant === null || defaultVariant === void 0 || (_defaultVariant$model6 = defaultVariant.model) === null || _defaultVariant$model6 === void 0 || (_defaultVariant$model6 = _defaultVariant$model6.inputs) === null || _defaultVariant$model6 === void 0 || (_defaultVariant$model6 = _defaultVariant$model6.quality) === null || _defaultVariant$model6 === void 0 ? void 0 : _defaultVariant$model6["default"]) || ""),
    _useState14 = _slicedToArray(_useState13, 2),
    selectedQuality = _useState14[0],
    setSelectedQuality = _useState14[1];
  var _useState15 = (0, _react.useState)(""),
    _useState16 = _slicedToArray(_useState15, 2),
    selectedEffect = _useState16[0],
    setSelectedEffect = _useState16[1];
  var _useState17 = (0, _react.useState)(""),
    _useState18 = _slicedToArray(_useState17, 2),
    selectedModeParam = _useState18[0],
    setSelectedModeParam = _useState18[1];
  var _useState19 = (0, _react.useState)(function () {
      return (0, _modelParameters.createModelParameterValues)(defaultVariant === null || defaultVariant === void 0 ? void 0 : defaultVariant.model);
    }),
    _useState20 = _slicedToArray(_useState19, 2),
    modelParameterValues = _useState20[0],
    setModelParameterValues = _useState20[1];
  var _useState21 = (0, _react.useState)({}),
    _useState22 = _slicedToArray(_useState21, 2),
    advancedValues = _useState22[0],
    setAdvancedValues = _useState22[1];
  var _useState23 = (0, _react.useState)({
      imageUrls: [],
      endImageUrl: null,
      videoUrls: [],
      audioUrls: []
    }),
    _useState24 = _slicedToArray(_useState23, 2),
    baseMedia = _useState24[0],
    setBaseMedia = _useState24[1];
  var _useState25 = (0, _react.useState)({}),
    _useState26 = _slicedToArray(_useState25, 2),
    workflowMedia = _useState26[0],
    setWorkflowMedia = _useState26[1];
  var _useState27 = (0, _react.useState)([]),
    _useState28 = _slicedToArray(_useState27, 2),
    localHistory = _useState28[0],
    setLocalHistory = _useState28[1];
  var _useState29 = (0, _react.useState)(false),
    _useState30 = _slicedToArray(_useState29, 2),
    generating = _useState30[0],
    setGenerating = _useState30[1];
  var _useState31 = (0, _react.useState)(null),
    _useState32 = _slicedToArray(_useState31, 2),
    openDropdown = _useState32[0],
    setOpenDropdown = _useState32[1];
  var _useState33 = (0, _react.useState)(null),
    _useState34 = _slicedToArray(_useState33, 2),
    fullscreenUrl = _useState34[0],
    setFullscreenUrl = _useState34[1];
  var _useState35 = (0, _react.useState)(false),
    _useState36 = _slicedToArray(_useState35, 2),
    isDrawModalOpen = _useState36[0],
    setIsDrawModalOpen = _useState36[1];
  var _useState37 = (0, _react.useState)({}),
    _useState38 = _slicedToArray(_useState37, 2),
    generationSources = _useState38[0],
    setGenerationSources = _useState38[1];
  var initialized = (0, _react.useRef)(false);
  var templateApplied = (0, _react.useRef)(null);
  var textareaRef = (0, _react.useRef)(null);
  var selectedVariant = _modelFamilies.videoModelCatalog.variantById.get(selectedModel) || defaultVariant;
  var selectedModelObj = selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model;
  var selectedFamily = _modelFamilies.videoModelCatalog.familyById.get(selectedFamilyId) || defaultFamily;
  var mode = (selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.mode) || "t2v";
  var capabilities = (0, _modelCapabilities.getModelMediaCapabilities)(selectedModelObj);
  var workflowFamily = (0, _videoWorkflows.getVideoWorkflowFamily)(selectedFamily === null || selectedFamily === void 0 ? void 0 : selectedFamily.id);
  var workflowMediaSlots = selectedWorkflowId ? (0, _videoWorkflows.getVideoWorkflowMediaSlots)(selectedModelObj, selectedWorkflowId) : [];
  var supplementalInputs = (0, _modelParameters.getSupplementalModelInputs)(selectedModelObj);
  var modelParameters = (0, _modelParameters.createModelParameterValues)(selectedModelObj, modelParameterValues);
  var advancedControls = (0, _videoAdvancedControls.getAdvancedControlsForModel)(selectedModelObj).filter(function (control) {
    return !LEGACY_MEDIA_ADVANCED_KEYS.has(control.key);
  });
  var history = historyItems !== null && historyItems !== void 0 ? historyItems : localHistory;
  var promptDisabled = (0, _modelCapabilities.shouldDisableVideoPrompt)(selectedModelObj, mode);
  var aspectRatios = mode === "i2v" ? (0, _models.getAspectRatiosForI2VModel)(selectedModel) : mode === "t2v" ? (0, _models.getAspectRatiosForVideoModel)(selectedModel) : [];
  var durations = mode === "i2v" ? (0, _models.getDurationsForI2VModel)(selectedModel) : mode === "t2v" ? (0, _models.getDurationsForModel)(selectedModel) : [];
  var resolutions = mode === "i2v" ? (0, _models.getResolutionsForI2VModel)(selectedModel) : mode === "t2v" ? (0, _models.getResolutionsForVideoModel)(selectedModel) : [];
  var qualities = (selectedModelObj === null || selectedModelObj === void 0 || (_selectedModelObj$inp = selectedModelObj.inputs) === null || _selectedModelObj$inp === void 0 || (_selectedModelObj$inp = _selectedModelObj$inp.quality) === null || _selectedModelObj$inp === void 0 ? void 0 : _selectedModelObj$inp["enum"]) || [];
  var modes = (0, _models.getModesForModel)(selectedModel) || [];
  var effects = mode === "i2v" ? (0, _models.getEffectsForI2VModel)(selectedModel) : [];
  var applyVariant = (0, _react.useCallback)(function (variant) {
    var _variant$model$inputs, _variant$model$inputs2, _variant$model$inputs3, _variant$model$inputs4, _variant$model$inputs5, _variant$model$inputs6, _variant$model$inputs7;
    var workflowId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var preserveMedia = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    if (!(variant !== null && variant !== void 0 && variant.model)) return;
    var family = _modelFamilies.videoModelCatalog.familyByVariantId.get(variant.model.id);
    setSelectedModel(variant.model.id);
    setSelectedFamilyId((family === null || family === void 0 ? void 0 : family.id) || "");
    setSelectedWorkflowId(workflowId);
    setModelParameterValues(function (previous) {
      return (0, _modelParameters.createModelParameterValues)(variant.model, previous);
    });
    setAdvancedValues({});
    var nextArs = variant.mode === "i2v" ? (0, _models.getAspectRatiosForI2VModel)(variant.model.id) : (0, _models.getAspectRatiosForVideoModel)(variant.model.id);
    if (nextArs.length) setSelectedAr(((_variant$model$inputs = variant.model.inputs) === null || _variant$model$inputs === void 0 || (_variant$model$inputs = _variant$model$inputs.aspect_ratio) === null || _variant$model$inputs === void 0 ? void 0 : _variant$model$inputs["default"]) || nextArs[0]);
    var nextDurations = variant.mode === "i2v" ? (0, _models.getDurationsForI2VModel)(variant.model.id) : (0, _models.getDurationsForModel)(variant.model.id);
    if (nextDurations.length) setSelectedDuration((_variant$model$inputs2 = (_variant$model$inputs3 = variant.model.inputs) === null || _variant$model$inputs3 === void 0 || (_variant$model$inputs3 = _variant$model$inputs3.duration) === null || _variant$model$inputs3 === void 0 ? void 0 : _variant$model$inputs3["default"]) !== null && _variant$model$inputs2 !== void 0 ? _variant$model$inputs2 : nextDurations[0]);
    var nextResolutions = variant.mode === "i2v" ? (0, _models.getResolutionsForI2VModel)(variant.model.id) : (0, _models.getResolutionsForVideoModel)(variant.model.id);
    setSelectedResolution(((_variant$model$inputs4 = variant.model.inputs) === null || _variant$model$inputs4 === void 0 || (_variant$model$inputs4 = _variant$model$inputs4.resolution) === null || _variant$model$inputs4 === void 0 ? void 0 : _variant$model$inputs4["default"]) || nextResolutions[0] || "");
    setSelectedQuality(((_variant$model$inputs5 = variant.model.inputs) === null || _variant$model$inputs5 === void 0 || (_variant$model$inputs5 = _variant$model$inputs5.quality) === null || _variant$model$inputs5 === void 0 ? void 0 : _variant$model$inputs5["default"]) || ((_variant$model$inputs6 = variant.model.inputs) === null || _variant$model$inputs6 === void 0 || (_variant$model$inputs6 = _variant$model$inputs6.quality) === null || _variant$model$inputs6 === void 0 || (_variant$model$inputs6 = _variant$model$inputs6["enum"]) === null || _variant$model$inputs6 === void 0 ? void 0 : _variant$model$inputs6[0]) || "");
    setSelectedModeParam(((_variant$model$inputs7 = variant.model.inputs) === null || _variant$model$inputs7 === void 0 || (_variant$model$inputs7 = _variant$model$inputs7.mode) === null || _variant$model$inputs7 === void 0 ? void 0 : _variant$model$inputs7["default"]) || "");
    setSelectedEffect(variant.mode === "i2v" ? (0, _models.getDefaultEffectForI2VModel)(variant.model.id) || "" : "");
    if (!preserveMedia) {
      setBaseMedia({
        imageUrls: [],
        endImageUrl: null,
        videoUrls: [],
        audioUrls: []
      });
      setWorkflowMedia({});
    }
  }, []);
  var selectFamily = function selectFamily(familyId) {
    var _entry$variantsByMode;
    var entry = _modelFamilies.videoModelPickerEntries.find(function (item) {
      return item.family.id === familyId;
    });
    if (!entry) return;
    var preferred = ((_entry$variantsByMode = entry.variantsByMode) === null || _entry$variantsByMode === void 0 ? void 0 : _entry$variantsByMode[mode]) || entry.defaultVariant;
    applyVariant(preferred, null);
  };
  var selectMode = function selectMode(nextMode) {
    var variant = (0, _modelFamilies.getFamilyVariant)(_modelFamilies.videoModelCatalog, selectedFamily, nextMode, selectedModel);
    if (variant) applyVariant(variant, null);
  };
  var selectWorkflow = function selectWorkflow(workflowId) {
    if (!workflowId) {
      var baseVariant = (0, _videoWorkflows.resolveVideoBaseVariant)(selectedFamily.id, selectedModel) || selectedVariant;
      applyVariant(baseVariant, null);
      return;
    }
    var target = (0, _videoWorkflows.resolveVideoWorkflowVariant)(selectedFamily.id, workflowId, selectedModel);
    if (!target) {
      _reactHotToast["default"].error("This workflow is not available for the selected model family.");
      return;
    }
    applyVariant(target, workflowId);
    setWorkflowMedia({});
  };
  var applyRecipe = (0, _react.useCallback)(function (skill) {
    var _skill$steps;
    var step = skill === null || skill === void 0 || (_skill$steps = skill.steps) === null || _skill$steps === void 0 ? void 0 : _skill$steps[0];
    if (!step) {
      if (skill !== null && skill !== void 0 && skill.description) setPrompt(skill.description);
      return;
    }
    var modelId = step.endpoint || step.model;
    var target = _modelFamilies.videoModelCatalog.variantById.get(modelId);
    if (target) applyVariant(target, null);
    if (step.aspectRatio) setSelectedAr(step.aspectRatio);
    if (step.duration) setSelectedDuration(Number(step.duration));
    if (step.resolution) setSelectedResolution(step.resolution);
    var inputValues = {};
    (skill.inputs || []).forEach(function (input) {
      inputValues[input.name] = "";
    });
    setPrompt((0, _promptRecipes.fillTemplate)(step.prompt || skill.description || "", inputValues));
    var refs = step.references || [];
    var nextImages = [];
    var nextEnd = null;
    var _iterator = _createForOfIteratorHelper(refs),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var ref = _step.value;
        var item = ref && _typeof(ref) === "object" ? ref : {
          url: ref
        };
        if (!item.url || String(item.url).startsWith("{{")) continue;
        if (item.role === "last_frame") nextEnd = item.url;else if (item.role === "character_sheet") {
          (0, _characterStore.setCharacterSheet)("video", item.url);
          nextImages.push(item.url);
        } else nextImages.push(item.url);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    if (nextImages.length || nextEnd) {
      setBaseMedia(function (media) {
        return _objectSpread(_objectSpread({}, media), {}, {
          imageUrls: unique([].concat(_toConsumableArray(media.imageUrls), nextImages)),
          endImageUrl: nextEnd || media.endImageUrl
        });
      });
    }
  }, [applyVariant]);
  (0, _react.useEffect)(function () {
    if (initialized.current || typeof window === "undefined") return;
    initialized.current = true;
    var restoredVariantForHandoff = null;
    try {
      var _stored = JSON.parse(window.localStorage.getItem(persistKey) || "null");
      if (_stored) {
        var _stored$baseMedia, _stored$workflowMedia;
        var restored = (0, _videoWorkflows.resolvePersistedVideoWorkflowSelection)(_stored.selectedModel, _stored.selectedWorkflowId || null, {
          hasEndFrame: Boolean(((_stored$baseMedia = _stored.baseMedia) === null || _stored$baseMedia === void 0 ? void 0 : _stored$baseMedia.endImageUrl) || ((_stored$workflowMedia = _stored.workflowMedia) === null || _stored$workflowMedia === void 0 || (_stored$workflowMedia = _stored$workflowMedia.endFrame) === null || _stored$workflowMedia === void 0 ? void 0 : _stored$workflowMedia.length))
        });
        if (restored !== null && restored !== void 0 && restored.variant) {
          restoredVariantForHandoff = restored.variant;
          applyVariant(restored.variant, restored.workflowId || null);
        }
        if (_stored.prompt) setPrompt(_stored.prompt);
        if (_stored.selectedAr) setSelectedAr(_stored.selectedAr);
        if (_stored.selectedDuration) setSelectedDuration(_stored.selectedDuration);
        if (_stored.selectedResolution) setSelectedResolution(_stored.selectedResolution);
        if (_stored.selectedQuality) setSelectedQuality(_stored.selectedQuality);
        if (_stored.selectedEffect) setSelectedEffect(_stored.selectedEffect);
        if (_stored.selectedModeParam) setSelectedModeParam(_stored.selectedModeParam);
        if (_stored.modelParameterValues) setModelParameterValues(_stored.modelParameterValues);
        if (_stored.advancedValues) setAdvancedValues(_stored.advancedValues);
        if (_stored.baseMedia) setBaseMedia(_stored.baseMedia);
        if (_stored.workflowMedia) setWorkflowMedia(_stored.workflowMedia);
        if (_stored.localHistory) setLocalHistory(_stored.localHistory);
        if (_stored.generationSources) setGenerationSources(_stored.generationSources);
      }
    } catch (error) {
      console.warn("Failed to restore SmartVideo Video Studio:", error);
    }
    try {
      migrateLegacyVideoFrames(stored, selectedWorkflowId, setWorkflowMedia, setBaseMedia);
    } catch (_unused) {
      // Migration is best-effort; ignore failures.
    }
    try {
      var handoff = (0, _storyboardHandoff.readStoryboardHandoff)("video");
      if (handoff) {
        if (handoff.combinedPrompt || handoff.projectName) setPrompt(handoff.combinedPrompt || handoff.projectName);
        var first = handoff.firstFrameUrl || handoff.referenceImageUrl;
        if (first) {
          var _currentVariant$model, _currentVariant$model2;
          var currentVariant = restoredVariantForHandoff || defaultVariant;
          var family = _modelFamilies.videoModelCatalog.familyByVariantId.get(currentVariant === null || currentVariant === void 0 || (_currentVariant$model = currentVariant.model) === null || _currentVariant$model === void 0 ? void 0 : _currentVariant$model.id) || defaultFamily;
          var animateVariant = family ? (0, _videoWorkflows.resolveVideoWorkflowVariant)(family.id, "animate_image", currentVariant === null || currentVariant === void 0 || (_currentVariant$model2 = currentVariant.model) === null || _currentVariant$model2 === void 0 ? void 0 : _currentVariant$model2.id) : null;
          if (animateVariant) {
            applyVariant(animateVariant, "animate_image");
            setWorkflowMedia(function (media) {
              return _objectSpread(_objectSpread({}, media), {}, {
                startFrame: unique([first].concat(_toConsumableArray(media.startFrame || []))).slice(0, 1)
              });
            });
          } else {
            var _currentVariant$model3;
            var i2vVariant = family ? (0, _modelFamilies.getFamilyVariant)(_modelFamilies.videoModelCatalog, family, "i2v", currentVariant === null || currentVariant === void 0 || (_currentVariant$model3 = currentVariant.model) === null || _currentVariant$model3 === void 0 ? void 0 : _currentVariant$model3.id) : null;
            if (i2vVariant) applyVariant(i2vVariant, null);
            setBaseMedia(function (media) {
              return _objectSpread(_objectSpread({}, media), {}, {
                imageUrls: unique([first].concat(_toConsumableArray(media.imageUrls)))
              });
            });
          }
        }
        if (handoff.aspectRatio) setSelectedAr(handoff.aspectRatio);
      }
    } catch (error) {
      console.warn("Failed to apply Storyboard handoff:", error);
    }
    var pending = (0, _skillStore.getPendingRecipe)("video");
    if (pending) {
      var skill = _registry["default"].skills.find(function (item) {
        return item.slug === pending;
      });
      (0, _skillStore.clearPendingRecipe)("video");
      if (skill) applyRecipe(skill);
    }
  }, [applyRecipe, applyVariant, defaultFamily, defaultVariant, persistKey]);
  (0, _react.useEffect)(function () {
    if (!initialized.current || typeof window === "undefined") return;
    var timer = window.setTimeout(function () {
      try {
        window.localStorage.setItem(persistKey, JSON.stringify({
          selectedModel: selectedModel,
          selectedFamilyId: selectedFamilyId,
          selectedWorkflowId: selectedWorkflowId,
          prompt: prompt,
          selectedAr: selectedAr,
          selectedDuration: selectedDuration,
          selectedResolution: selectedResolution,
          selectedQuality: selectedQuality,
          selectedEffect: selectedEffect,
          selectedModeParam: selectedModeParam,
          modelParameterValues: modelParameterValues,
          advancedValues: advancedValues,
          baseMedia: baseMedia,
          workflowMedia: workflowMedia,
          localHistory: localHistory,
          generationSources: generationSources
        }));
      } catch (_unused2) {
        // Persistence is non-critical.
      }
    }, 350);
    return function () {
      return window.clearTimeout(timer);
    };
  }, [persistKey, selectedModel, selectedFamilyId, selectedWorkflowId, prompt, selectedAr, selectedDuration, selectedResolution, selectedQuality, selectedEffect, selectedModeParam, modelParameterValues, advancedValues, baseMedia, workflowMedia, localHistory, generationSources]);
  (0, _react.useEffect)(function () {
    var templateId = templateData !== null && templateData !== void 0 && templateData.sourceRepo && templateData !== null && templateData !== void 0 && templateData.slug ? "".concat(templateData.sourceRepo, "|").concat(templateData.slug) : (templateData === null || templateData === void 0 ? void 0 : templateData.slug) || null;
    if (!templateData || templateApplied.current === templateId) return;
    templateApplied.current = templateId;
    if (templateData.prompt) setPrompt(templateData.prompt);
    if (templateData.aspectRatio) setSelectedAr(templateData.aspectRatio);
    if (templateData.duration) setSelectedDuration(Number(templateData.duration));
    if (templateData.model) {
      var target = _modelFamilies.videoModelCatalog.variantById.get(templateData.model);
      if (target) applyVariant(target, null);
    }
  }, [templateData, applyVariant]);
  var uploadExternalFiles = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(files) {
      var candidates, _loop, _ret, _i, _candidates;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            candidates = Array.from(files || []);
            if (!(!apiKey || candidates.length === 0)) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            _loop = /*#__PURE__*/_regenerator().m(function _loop() {
              var file, mediaType, url, slot, _selectedFamily$suppo, _selectedFamily$suppo2, _t;
              return _regenerator().w(function (_context) {
                while (1) switch (_context.p = _context.n) {
                  case 0:
                    file = _candidates[_i];
                    mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : null;
                    if (mediaType) {
                      _context.n = 1;
                      break;
                    }
                    return _context.a(2, 0);
                  case 1:
                    _context.p = 1;
                    _context.n = 2;
                    return (0, _muapi.uploadFile)(apiKey, file);
                  case 2:
                    url = _context.v;
                    if (!selectedWorkflowId) {
                      _context.n = 3;
                      break;
                    }
                    slot = workflowMediaSlots.find(function (item) {
                      var _workflowMedia$item$i;
                      return item.mediaType === mediaType && item.acceptDrop !== false && (((_workflowMedia$item$i = workflowMedia[item.id]) === null || _workflowMedia$item$i === void 0 ? void 0 : _workflowMedia$item$i.length) || 0) < item.maxItems;
                    });
                    if (slot) setWorkflowMedia(function (media) {
                      return _objectSpread(_objectSpread({}, media), {}, _defineProperty({}, slot.id, unique([].concat(_toConsumableArray(media[slot.id] || []), [url])).slice(0, slot.maxItems)));
                    });
                    return _context.a(2, 0);
                  case 3:
                    if (mediaType === "image") {
                      if (mode === "t2v" && (_selectedFamily$suppo = selectedFamily.supports) !== null && _selectedFamily$suppo !== void 0 && _selectedFamily$suppo.i2v) selectMode("i2v");
                      setBaseMedia(function (media) {
                        return _objectSpread(_objectSpread({}, media), {}, {
                          imageUrls: unique([].concat(_toConsumableArray(media.imageUrls), [url])).slice(0, Math.max(1, capabilities.image.maxItems || 1))
                        });
                      });
                    } else if (mediaType === "video") {
                      if (mode !== "v2v" && (_selectedFamily$suppo2 = selectedFamily.supports) !== null && _selectedFamily$suppo2 !== void 0 && _selectedFamily$suppo2.v2v) selectMode("v2v");
                      setBaseMedia(function (media) {
                        return _objectSpread(_objectSpread({}, media), {}, {
                          videoUrls: unique([].concat(_toConsumableArray(media.videoUrls), [url])).slice(0, Math.max(1, capabilities.video.maxItems || 1))
                        });
                      });
                    } else {
                      setBaseMedia(function (media) {
                        return _objectSpread(_objectSpread({}, media), {}, {
                          audioUrls: unique([].concat(_toConsumableArray(media.audioUrls), [url])).slice(0, Math.max(1, capabilities.audio.maxItems || 1))
                        });
                      });
                    }
                    _context.n = 5;
                    break;
                  case 4:
                    _context.p = 4;
                    _t = _context.v;
                    _reactHotToast["default"].error((0, _formatError.formatErrorMessage)(_t, "Media upload failed"));
                  case 5:
                    return _context.a(2);
                }
              }, _loop, null, [[1, 4]]);
            });
            _i = 0, _candidates = candidates;
          case 2:
            if (!(_i < _candidates.length)) {
              _context2.n = 5;
              break;
            }
            return _context2.d(_regeneratorValues(_loop()), 3);
          case 3:
            _ret = _context2.v;
            if (!(_ret === 0)) {
              _context2.n = 4;
              break;
            }
            return _context2.a(3, 4);
          case 4:
            _i++;
            _context2.n = 2;
            break;
          case 5:
            return _context2.a(2);
        }
      }, _callee);
    }));
    return function (_x) {
      return _ref5.apply(this, arguments);
    };
  }(), [apiKey, capabilities, mode, selectedFamily, selectedWorkflowId, workflowMedia, workflowMediaSlots]);
  (0, _react.useEffect)(function () {
    if (!(droppedFiles !== null && droppedFiles !== void 0 && droppedFiles.length)) return;
    void uploadExternalFiles(droppedFiles)["finally"](function () {
      return onFilesHandled === null || onFilesHandled === void 0 ? void 0 : onFilesHandled();
    });
  }, [droppedFiles, onFilesHandled, uploadExternalFiles]);
  var handleBaseMediaChange = function handleBaseMediaChange(type, urls) {
    if (type === "image") {
      var _selectedFamily$suppo3;
      if (urls.length && mode === "t2v" && (_selectedFamily$suppo3 = selectedFamily.supports) !== null && _selectedFamily$suppo3 !== void 0 && _selectedFamily$suppo3.i2v) selectMode("i2v");
      setBaseMedia(function (media) {
        return _objectSpread(_objectSpread({}, media), {}, {
          imageUrls: urls
        });
      });
    } else if (type === "video") {
      var _selectedFamily$suppo4;
      if (urls.length && mode !== "v2v" && (_selectedFamily$suppo4 = selectedFamily.supports) !== null && _selectedFamily$suppo4 !== void 0 && _selectedFamily$suppo4.v2v) selectMode("v2v");
      setBaseMedia(function (media) {
        return _objectSpread(_objectSpread({}, media), {}, {
          videoUrls: urls
        });
      });
    } else if (type === "audio") {
      setBaseMedia(function (media) {
        return _objectSpread(_objectSpread({}, media), {}, {
          audioUrls: urls
        });
      });
    } else if (type === "end") {
      setBaseMedia(function (media) {
        return _objectSpread(_objectSpread({}, media), {}, {
          endImageUrl: urls[0] || null
        });
      });
    }
  };
  var addHistory = function addHistory(result, requestPrompt) {
    var _result$outputs, _result$output;
    var requestId = (result === null || result === void 0 ? void 0 : result.request_id) || (result === null || result === void 0 ? void 0 : result.id) || Date.now().toString();
    var url = (result === null || result === void 0 ? void 0 : result.url) || (result === null || result === void 0 || (_result$outputs = result.outputs) === null || _result$outputs === void 0 ? void 0 : _result$outputs[0]) || (result === null || result === void 0 || (_result$output = result.output) === null || _result$output === void 0 ? void 0 : _result$output.url);
    if (!url) throw new Error(copy.errors.noVideoUrlReturned);
    var entry = {
      id: requestId,
      request_id: requestId,
      url: url,
      prompt: requestPrompt,
      model: selectedModel,
      aspect_ratio: selectedAr,
      duration: selectedDuration,
      resolution: selectedResolution,
      timestamp: new Date().toISOString()
    };
    setLocalHistory(function (items) {
      return [entry].concat(_toConsumableArray(items)).slice(0, 40);
    });
    setGenerationSources(function (sources) {
      return _objectSpread(_objectSpread({}, sources), {}, _defineProperty({}, selectedFamily.id, {
        requestId: requestId,
        modelId: selectedModel
      }));
    });
    onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete(_objectSpread(_objectSpread({}, entry), {}, {
      type: "video"
    }));
    return entry;
  };
  var handleGenerate = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var trimmedPrompt, validation, mediaPayload, advancedPayload, payload, source, result, message, _t2, _t3, _t4;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (apiKey) {
              _context3.n = 1;
              break;
            }
            _reactHotToast["default"].error("Add your MuAPI key before generating.");
            return _context3.a(2);
          case 1:
            trimmedPrompt = prompt.trim();
            if (!(selectedModelObj !== null && selectedModelObj !== void 0 && selectedModelObj.promptRequired && !trimmedPrompt)) {
              _context3.n = 2;
              break;
            }
            _reactHotToast["default"].error(copy.errors.noPromptForModel);
            return _context3.a(2);
          case 2:
            if (!selectedWorkflowId) {
              _context3.n = 4;
              break;
            }
            validation = (0, _videoWorkflows.validateVideoWorkflowMedia)(selectedWorkflowId, workflowMedia, selectedModelObj);
            if (validation.valid) {
              _context3.n = 3;
              break;
            }
            _reactHotToast["default"].error(validation.message);
            return _context3.a(2);
          case 3:
            _context3.n = 6;
            break;
          case 4:
            if (!(mode === "i2v" && baseMedia.imageUrls.length === 0)) {
              _context3.n = 5;
              break;
            }
            _reactHotToast["default"].error(copy.errors.uploadAtLeastOneReferenceImage);
            return _context3.a(2);
          case 5:
            if (!(mode === "v2v" && baseMedia.videoUrls.length === 0)) {
              _context3.n = 6;
              break;
            }
            _reactHotToast["default"].error(copy.errors.uploadVideoFirst);
            return _context3.a(2);
          case 6:
            setGenerating(true);
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            _context3.p = 7;
            mediaPayload = selectedWorkflowId ? (0, _videoWorkflows.buildVideoWorkflowMediaParams)(selectedModelObj, selectedWorkflowId, workflowMedia) : (0, _modelCapabilities.buildReferenceParams)(selectedModelObj, baseMedia);
            advancedPayload = (0, _videoAdvancedControls.buildAdvancedPayload)(advancedControls, advancedValues);
            payload = _objectSpread(_objectSpread(_objectSpread({
              model: selectedModel
            }, (0, _modelParameters.buildSupplementalInputPayload)(selectedModelObj, modelParameters)), advancedPayload), mediaPayload);
            if (!promptDisabled && trimmedPrompt) payload.prompt = trimmedPrompt;
            if (aspectRatios.length) payload.aspect_ratio = selectedAr;
            if (durations.length) payload.duration = selectedDuration;
            if (resolutions.length && selectedResolution) payload.resolution = selectedResolution;
            if (qualities.length && selectedQuality) payload.quality = selectedQuality;
            if (modes.length && selectedModeParam) payload.mode = selectedModeParam;
            if (effects.length && selectedEffect) payload.name = selectedEffect;
            if (!(selectedModelObj !== null && selectedModelObj !== void 0 && selectedModelObj.requiresRequestId)) {
              _context3.n = 9;
              break;
            }
            source = generationSources[selectedFamily.id];
            if (source !== null && source !== void 0 && source.requestId) {
              _context3.n = 8;
              break;
            }
            throw new Error("Create a ".concat(selectedFamily.name, " video first before using Extend."));
          case 8:
            payload.request_id = source.requestId;
          case 9:
            if (!(mode === "v2v")) {
              _context3.n = 11;
              break;
            }
            _context3.n = 10;
            return (0, _muapi.processV2V)(apiKey, payload);
          case 10:
            _t2 = _context3.v;
            _context3.n = 16;
            break;
          case 11:
            if (!(mode === "i2v")) {
              _context3.n = 13;
              break;
            }
            _context3.n = 12;
            return (0, _muapi.generateI2V)(apiKey, payload);
          case 12:
            _t3 = _context3.v;
            _context3.n = 15;
            break;
          case 13:
            _context3.n = 14;
            return (0, _muapi.generateVideo)(apiKey, payload);
          case 14:
            _t3 = _context3.v;
          case 15:
            _t2 = _t3;
          case 16:
            result = _t2;
            addHistory(result, trimmedPrompt);
            _context3.n = 18;
            break;
          case 17:
            _context3.p = 17;
            _t4 = _context3.v;
            message = (0, _formatError.formatErrorMessage)(_t4, copy.errors.videoGenerationFailed);
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(message);
            _reactHotToast["default"].error(message);
          case 18:
            _context3.p = 18;
            setGenerating(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context3.f(18);
          case 19:
            return _context3.a(2);
        }
      }, _callee2, null, [[7, 17, 18, 19]]);
    }));
    return function handleGenerate() {
      return _ref6.apply(this, arguments);
    };
  }();
  var deleteEntry = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(entry, index) {
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            if (!(historyItems && onDeleteHistoryItem)) {
              _context4.n = 2;
              break;
            }
            _context4.n = 1;
            return onDeleteHistoryItem(entry);
          case 1:
            _context4.n = 3;
            break;
          case 2:
            setLocalHistory(function (items) {
              return items.filter(function (_, itemIndex) {
                return itemIndex !== index;
              });
            });
          case 3:
            return _context4.a(2);
        }
      }, _callee3);
    }));
    return function deleteEntry(_x2, _x3) {
      return _ref7.apply(this, arguments);
    };
  }();
  var addDrawReference = function addDrawReference(entry) {
    if (!(entry !== null && entry !== void 0 && entry.url)) return;
    if (selectedWorkflowId) {
      var slot = workflowMediaSlots.find(function (item) {
        return item.mediaType === "image" && item.acceptDrop !== false;
      });
      if (slot) setWorkflowMedia(function (media) {
        return _objectSpread(_objectSpread({}, media), {}, _defineProperty({}, slot.id, unique([].concat(_toConsumableArray(media[slot.id] || []), [entry.url])).slice(0, slot.maxItems)));
      });
      return;
    }
    handleBaseMediaChange("image", unique([].concat(_toConsumableArray(baseMedia.imageUrls), [entry.url])).slice(0, Math.max(1, capabilities.image.maxItems || 1)));
  };
  var mediaSlots = selectedWorkflowId ? workflowMediaSlots : [];
  var showBaseImage = !selectedWorkflowId && (capabilities.image.maxItems > 0 || ((_selectedFamily$suppo5 = selectedFamily.supports) === null || _selectedFamily$suppo5 === void 0 ? void 0 : _selectedFamily$suppo5.i2v));
  var showBaseVideo = !selectedWorkflowId && (capabilities.video.maxItems > 0 || ((_selectedFamily$suppo6 = selectedFamily.supports) === null || _selectedFamily$suppo6 === void 0 ? void 0 : _selectedFamily$suppo6.v2v));
  var showBaseAudio = !selectedWorkflowId && capabilities.audio.maxItems > 0;
  var showEndFrame = !selectedWorkflowId && capabilities.image.separateLastItem;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "relative flex h-full w-full flex-col items-center overflow-hidden bg-app-bg",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactHotToast.Toaster, {
      position: "top-right",
      containerStyle: {
        zIndex: 99999
      }
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "w-full max-w-7xl flex-1 overflow-y-auto px-3 pb-44 pt-4 custom-scrollbar",
      children: history.length ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3",
        children: history.map(function (entry, index) {
          var _entry$prompt;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "group relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-xl",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
              src: entry.url,
              controls: true,
              className: "aspect-video w-full bg-black object-cover"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute right-2 top-2 hidden flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100 md:flex",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions.GenerationCopyButtons, {
                prompt: entry.prompt,
                onCopyError: onGenerationError
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                onClick: function onClick() {
                  return downloadFile(entry.url, "video-".concat(entry.id || index, ".mp4"));
                },
                className: "rounded-full border border-white/10 bg-black/65 p-2 text-white hover:bg-[#22d3ee] hover:text-black",
                children: "\u2193"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_SocialPublishProvider.PublishStep, {
                mediaUrl: entry.url,
                mediaType: "video",
                title: ((_entry$prompt = entry.prompt) === null || _entry$prompt === void 0 ? void 0 : _entry$prompt.substring(0, 50)) || "Generated video",
                className: "flex items-center justify-center rounded-full border border-white/10 bg-black/65 p-2 text-white hover:bg-[#22d3ee] hover:text-black"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_AiAssistantProvider.AssistStep, {
                assetUrl: entry.url,
                assetType: "video",
                onApply: function onApply() {},
                className: "flex items-center justify-center rounded-full border border-white/10 bg-black/65 p-2 text-white hover:bg-[#22d3ee] hover:text-black"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                onClick: function onClick() {
                  return deleteEntry(entry, index);
                },
                className: "rounded-full border border-red-500/20 bg-black/65 p-2 text-red-400 hover:bg-red-500 hover:text-white",
                children: "\xD7"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions["default"], {
              prompt: entry.prompt,
              onCopyError: onGenerationError,
              actions: [{
                kind: "download",
                label: copy.gallery.download,
                onSelect: function onSelect() {
                  return downloadFile(entry.url, "video-".concat(entry.id || index, ".mp4"));
                }
              }, {
                kind: "delete",
                label: copy.gallery["delete"],
                danger: true,
                onSelect: function onSelect() {
                  return deleteEntry(entry, index);
                }
              }]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setFullscreenUrl(entry.url);
              },
              className: "w-full p-3 text-left",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "line-clamp-2 text-xs text-white/65",
                children: entry.prompt || copy.gallery.noPromptProvided
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "mt-2 flex flex-wrap gap-2 text-[10px] text-white/35",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "rounded bg-[#22d3ee]/10 px-2 py-0.5 font-bold text-[#22d3ee]",
                  children: entry.model
                }), entry.duration && /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                  children: [entry.duration, "s"]
                }), entry.resolution && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: entry.resolution
                })]
              })]
            })]
          }, entry.id || index);
        })
      }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex min-h-[48vh] flex-col items-center justify-center text-center",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "mb-5 rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#22d3ee]",
          children: "SmartVideo workflow engine"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h1", {
          className: "text-3xl font-black uppercase tracking-tight text-white sm:text-5xl",
          children: (selectedFamily === null || selectedFamily === void 0 ? void 0 : selectedFamily.name) || "Video Studio"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "mt-3 max-w-xl text-sm text-white/40",
          children: "Text-to-video, image animation, start/end frames, references, video editing, extension and motion transfer use the same model-aware media system."
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptComposer, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col gap-3",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-wrap items-start gap-3",
          children: [selectedWorkflowId && mediaSlots.map(function (slot) {
            return /*#__PURE__*/(0, _jsxRuntime.jsx)(_UniversalMediaUploader["default"], {
              apiKey: apiKey,
              slot: _objectSpread(_objectSpread({}, slot), {}, {
                role: slot.id
              }),
              values: workflowMedia[slot.id] || [],
              onChange: function onChange(urls) {
                return setWorkflowMedia(function (media) {
                  return _objectSpread(_objectSpread({}, media), {}, _defineProperty({}, slot.id, urls));
                });
              },
              disabled: generating
            }, slot.id);
          }), showBaseImage && /*#__PURE__*/(0, _jsxRuntime.jsx)(_UniversalMediaUploader["default"], {
            apiKey: apiKey,
            slot: {
              id: "referenceImages",
              role: "reference_image",
              mediaType: "image",
              label: mode === "i2v" ? "First / Reference" : "Reference Image",
              maxItems: Math.max(1, capabilities.image.maxItems || 1)
            },
            values: baseMedia.imageUrls,
            onChange: function onChange(urls) {
              return handleBaseMediaChange("image", urls);
            },
            disabled: generating
          }), showEndFrame && /*#__PURE__*/(0, _jsxRuntime.jsx)(_UniversalMediaUploader["default"], {
            apiKey: apiKey,
            slot: {
              id: "endFrame",
              role: "last_frame",
              mediaType: "image",
              label: "Last Frame",
              maxItems: 1
            },
            values: baseMedia.endImageUrl ? [baseMedia.endImageUrl] : [],
            onChange: function onChange(urls) {
              return handleBaseMediaChange("end", urls);
            },
            disabled: generating
          }), showBaseVideo && /*#__PURE__*/(0, _jsxRuntime.jsx)(_UniversalMediaUploader["default"], {
            apiKey: apiKey,
            slot: {
              id: "referenceVideos",
              role: "reference_video",
              mediaType: "video",
              label: "Reference Video",
              maxItems: Math.max(1, capabilities.video.maxItems || 1)
            },
            values: baseMedia.videoUrls,
            onChange: function onChange(urls) {
              return handleBaseMediaChange("video", urls);
            },
            disabled: generating
          }), showBaseAudio && /*#__PURE__*/(0, _jsxRuntime.jsx)(_UniversalMediaUploader["default"], {
            apiKey: apiKey,
            slot: {
              id: "referenceAudios",
              role: "reference_audio",
              mediaType: "audio",
              label: "Reference Audio",
              maxItems: Math.max(1, capabilities.audio.maxItems || 1)
            },
            values: baseMedia.audioUrls,
            onChange: function onChange(urls) {
              return handleBaseMediaChange("audio", urls);
            },
            disabled: generating
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptTextarea, {
          ref: textareaRef,
          value: prompt,
          disabled: promptDisabled,
          onChange: function onChange(event) {
            setPrompt(event.target.value);
            (0, _storyboardHandoff.clearStoryboardHandoff)();
          },
          placeholder: promptDisabled ? "This workflow does not require a prompt" : copy.placeholders.describeVideo
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptFooter, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptControls, {
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setOpenDropdown(openDropdown === "model" ? null : "model");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "model"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: (selectedFamily === null || selectedFamily === void 0 ? void 0 : selectedFamily.name) || "Model"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), openDropdown === "model" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              className: "w-[min(420px,calc(100vw-2rem))] max-h-[60vh]",
              onClick: function onClick(event) {
                return event.stopPropagation();
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.model
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                className: "mb-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none",
                placeholder: "Search model families...",
                onChange: function onChange(event) {
                  var query = event.target.value.toLowerCase();
                  event.currentTarget.parentElement.querySelectorAll("[data-family]").forEach(function (node) {
                    node.style.display = node.dataset.search.includes(query) ? "flex" : "none";
                  });
                }
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: _modelFamilies.videoModelPickerEntries.map(function (entry) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    "data-family": "true",
                    "data-search": entry.searchText,
                    selected: entry.family.id === selectedFamilyId,
                    onClick: function onClick() {
                      selectFamily(entry.family.id);
                      setOpenDropdown(null);
                    },
                    children: entry.name
                  }, entry.family.id);
                })
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5",
            children: ["t2v", "i2v", "v2v"].filter(function (item) {
              var _selectedFamily$suppo7;
              return selectedFamily === null || selectedFamily === void 0 || (_selectedFamily$suppo7 = selectedFamily.supports) === null || _selectedFamily$suppo7 === void 0 ? void 0 : _selectedFamily$suppo7[item];
            }).map(function (item) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                onClick: function onClick() {
                  return selectMode(item);
                },
                className: "rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase ".concat(mode === item && !selectedWorkflowId ? "bg-[#22d3ee] text-black" : "text-white/45 hover:text-white"),
                children: item.replace("2", "→")
              }, item);
            })
          }), (workflowFamily === null || workflowFamily === void 0 || (_workflowFamily$workf = workflowFamily.workflows) === null || _workflowFamily$workf === void 0 ? void 0 : _workflowFamily$workf.length) > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setOpenDropdown(openDropdown === "workflow" ? null : "workflow");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "workflow"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: ((_workflowFamily$workf2 = workflowFamily.workflowById.get(selectedWorkflowId)) === null || _workflowFamily$workf2 === void 0 ? void 0 : _workflowFamily$workf2.label) || "Workflow"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), openDropdown === "workflow" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              className: "min-w-[220px]",
              onClick: function onClick(event) {
                return event.stopPropagation();
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.source
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptMenuList, {
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                  selected: !selectedWorkflowId,
                  onClick: function onClick() {
                    selectWorkflow(null);
                    setOpenDropdown(null);
                  },
                  children: "Base generation"
                }), workflowFamily.workflows.map(function (workflow) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    selected: selectedWorkflowId === workflow.id,
                    onClick: function onClick() {
                      selectWorkflow(workflow.id);
                      setOpenDropdown(null);
                    },
                    children: workflow.label
                  }, workflow.id);
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_ModelParameterControls["default"], {
            inputs: supplementalInputs,
            values: modelParameters,
            onChange: function onChange(key, value) {
              return setModelParameterValues(function (values) {
                return _objectSpread(_objectSpread({}, values), {}, _defineProperty({}, key, value));
              });
            },
            open: openDropdown === "parameters",
            onToggle: function onToggle() {
              return setOpenDropdown(openDropdown === "parameters" ? null : "parameters");
            }
          }), aspectRatios.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setOpenDropdown(openDropdown === "ar" ? null : "ar");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "ar"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAspectRatioIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: selectedAr
              })]
            }), openDropdown === "ar" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.aspectRatio
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: aspectRatios.map(function (value) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    selected: selectedAr === value,
                    onClick: function onClick() {
                      setSelectedAr(value);
                      setOpenDropdown(null);
                    },
                    children: value
                  }, value);
                })
              })]
            })]
          }), durations.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setOpenDropdown(openDropdown === "duration" ? null : "duration");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "duration"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptDurationIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: [selectedDuration, "s"]
              })]
            }), openDropdown === "duration" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.duration
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: durations.map(function (value) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptMenuItem, {
                    selected: selectedDuration === value,
                    onClick: function onClick() {
                      setSelectedDuration(value);
                      setOpenDropdown(null);
                    },
                    children: [value, "s"]
                  }, value);
                })
              })]
            })]
          }), resolutions.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setOpenDropdown(openDropdown === "resolution" ? null : "resolution");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "resolution"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptQualityIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: selectedResolution || resolutions[0]
              })]
            }), openDropdown === "resolution" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.resolution
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: resolutions.map(function (value) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    selected: selectedResolution === value,
                    onClick: function onClick() {
                      setSelectedResolution(value);
                      setOpenDropdown(null);
                    },
                    children: value
                  }, value);
                })
              })]
            })]
          }), qualities.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("select", {
            value: selectedQuality,
            onChange: function onChange(event) {
              return setSelectedQuality(event.target.value);
            },
            className: "h-[38px] rounded-md border border-white/[0.06] bg-[#16161a]/60 px-3 text-xs font-semibold text-white/70 outline-none",
            children: qualities.map(function (value) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
                value: value,
                children: value
              }, value);
            })
          }), modes.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("select", {
            value: selectedModeParam,
            onChange: function onChange(event) {
              return setSelectedModeParam(event.target.value);
            },
            className: "h-[38px] rounded-md border border-white/[0.06] bg-[#16161a]/60 px-3 text-xs font-semibold text-white/70 outline-none",
            children: modes.map(function (value) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
                value: value,
                children: value
              }, value);
            })
          }), effects.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("select", {
            value: selectedEffect,
            onChange: function onChange(event) {
              return setSelectedEffect(event.target.value);
            },
            className: "h-[38px] max-w-[160px] rounded-md border border-white/[0.06] bg-[#16161a]/60 px-3 text-xs font-semibold text-white/70 outline-none",
            children: effects.map(function (value) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
                value: value,
                children: value
              }, value);
            })
          }), advancedControls.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: function onClick() {
                return setOpenDropdown(openDropdown === "advanced" ? null : "advanced");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "advanced"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: "Advanced"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), openDropdown === "advanced" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              className: "w-[min(430px,calc(100vw-2rem))] max-h-[60vh]",
              onClick: function onClick(event) {
                return event.stopPropagation();
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: "SmartVideo advanced controls"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "grid grid-cols-1 gap-3 sm:grid-cols-2",
                children: advancedControls.map(function (control) {
                  var _advancedValues$contr;
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(AdvancedField, {
                    control: control,
                    value: (_advancedValues$contr = advancedValues[control.key]) !== null && _advancedValues$contr !== void 0 ? _advancedValues$contr : control["default"],
                    onChange: function onChange(value) {
                      return setAdvancedValues(function (values) {
                        return _objectSpread(_objectSpread({}, values), {}, _defineProperty({}, control.key, value));
                      });
                    }
                  }, control.key);
                })
              })]
            })]
          }), (capabilities.image.maxItems > 0 || (selectedFamily === null || selectedFamily === void 0 || (_selectedFamily$suppo8 = selectedFamily.supports) === null || _selectedFamily$suppo8 === void 0 ? void 0 : _selectedFamily$suppo8.i2v)) && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: function onClick() {
              return setIsDrawModalOpen(true);
            },
            className: (0, _PromptComposer.promptControlClassName)(),
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
              children: copy.controls.draw
            })
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAction, {
          onClick: handleGenerate,
          disabled: generating,
          children: generating ? copy.controls.generating : copy.controls.generate
        })]
      })]
    }), fullscreenUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4",
      onClick: function onClick() {
        return setFullscreenUrl(null);
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
        src: fullscreenUrl,
        controls: true,
        autoPlay: true,
        loop: true,
        className: "max-h-[95vh] max-w-[95vw] rounded-2xl",
        onClick: function onClick(event) {
          return event.stopPropagation();
        }
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        className: "absolute right-6 top-6 rounded-full bg-white/10 px-4 py-2 text-white",
        onClick: function onClick() {
          return setFullscreenUrl(null);
        },
        children: "\xD7"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_DrawModal["default"], {
      isOpen: isDrawModalOpen,
      onClose: function onClose() {
        return setIsDrawModalOpen(false);
      },
      apiKey: apiKey,
      batchSize: 1,
      onAddHistoryItem: addDrawReference
    })]
  });
}