"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = VideoStudio;
var _react = require("react");
var _reactHotToast = _interopRequireWildcard(require("react-hot-toast"));
var _muapi = require("../muapi.js");
var _formatError = require("../utils/formatError.js");
var _persistKey = require("../persistKey.js");
var _DrawModal = _interopRequireDefault(require("./DrawModal.jsx"));
var _ModelParameterControls = _interopRequireDefault(require("./ModelParameterControls.jsx"));
var _VideoModelControls = require("./VideoModelControls.jsx");
var _MobileGenerationActions = _interopRequireWildcard(require("./MobileGenerationActions.jsx"));
var _models = require("../models.js");
var _modelFamilies = require("../modelFamilies.js");
var _seedanceModels = require("../seedanceModels.js");
var _veoModels = require("../veoModels.js");
var _groupedVideoModels = require("../groupedVideoModels.js");
var _videoModelParameters = require("../videoModelParameters.js");
var _groupedVideoParameters = require("../groupedVideoParameters.js");
var _seedanceParameters = require("../seedanceParameters.js");
var _videoModelCopy = require("../videoModelCopy.js");
var _modelCapabilities = require("../modelCapabilities.js");
var _modelParameters = require("../modelParameters.js");
var _videoToolCapabilities = require("../videoToolCapabilities.js");
var _videoWorkflows = require("../videoWorkflows.js");
var _PromptComposer = require("./prompt/PromptComposer.jsx");
var _usePromptMenu2 = _interopRequireDefault(require("./prompt/usePromptMenu.js"));
var _videoStudio = _interopRequireDefault(require("../messages/en/videoStudio.json"));
var _videoStudio2 = _interopRequireDefault(require("../messages/zh/videoStudio.json"));
var _i18nUtils = require("../i18nUtils");
var _storyboardHandoff = require("../storyboardHandoff.js");
var _skillStore = require("../lib/skillStore");
var _characterStore = require("../lib/characterStore");
var _promptRecipes = require("../lib/promptRecipes");
var _registry = _interopRequireDefault(require("../skills/registry.json"));
var _SocialPublishProvider = require("../../../../components/SocialPublishProvider");
var _AiAssistantProvider = require("../../../../components/AiAssistantProvider");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t6 in e) "default" !== _t6 && {}.hasOwnProperty.call(e, _t6) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t6)) && (i.get || i.set) ? o(f, _t6, i) : f[_t6] = e[_t6]); return f; })(e, t); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // ── Local app integrations (upstream parity adapter) ─────────────────────────
// Upstream has no notion of these SmartVideo surfaces; they are re-applied here
// as the smallest possible adapter over upstream's own state model.
function downloadFile(_x, _x2) {
  return _downloadFile.apply(this, arguments);
}
function _downloadFile() {
  _downloadFile = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(url, filename) {
    var response, blob, blobUrl, a, _t5;
    return _regenerator().w(function (_context11) {
      while (1) switch (_context11.p = _context11.n) {
        case 0:
          _context11.p = 0;
          _context11.n = 1;
          return fetch(url);
        case 1:
          response = _context11.v;
          _context11.n = 2;
          return response.blob();
        case 2:
          blob = _context11.v;
          blobUrl = URL.createObjectURL(blob);
          a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          _context11.n = 4;
          break;
        case 3:
          _context11.p = 3;
          _t5 = _context11.v;
          window.open(url, "_blank");
        case 4:
          return _context11.a(2);
      }
    }, _callee10, null, [[0, 3]]);
  }));
  return _downloadFile.apply(this, arguments);
}
function mergeReferenceUrls(current, incoming, limit) {
  return _toConsumableArray(new Set([].concat(_toConsumableArray(current), _toConsumableArray(incoming)))).slice(0, limit);
}
var EMPTY_WORKFLOW_MEDIA_DRAFT = Object.freeze({});
function workflowContextKey(familyId, workflowId) {
  return "".concat(familyId, ":").concat(workflowId || "base");
}
function isSameSelection(left, right) {
  return (left === null || left === void 0 ? void 0 : left.selectedFamilyId) === (right === null || right === void 0 ? void 0 : right.selectedFamilyId) && (left === null || left === void 0 ? void 0 : left.selectedModel) === (right === null || right === void 0 ? void 0 : right.selectedModel) && (left === null || left === void 0 ? void 0 : left.selectedWorkflowId) === (right === null || right === void 0 ? void 0 : right.selectedWorkflowId);
}
function ReferenceMediaLabel(_ref) {
  var label = _ref.label,
    _ref$required = _ref.required,
    required = _ref$required === void 0 ? false : _ref$required;
  if (!label) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
    className: "flex min-h-6 max-w-[88px] items-start justify-center text-balance text-center text-[10px] font-semibold leading-3 ".concat(required ? "text-white/60" : "text-white/45"),
    children: [label, required && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "ml-0.5 text-[#22d3ee]",
      "aria-hidden": "true",
      children: "*"
    })]
  });
}
function ReferencePreview(_ref2) {
  var type = _ref2.type,
    url = _ref2.url,
    index = _ref2.index,
    onRemove = _ref2.onRemove,
    _ref2$label = _ref2.label,
    label = _ref2$label === void 0 ? null : _ref2$label,
    _ref2$description = _ref2.description,
    description = _ref2$description === void 0 ? null : _ref2$description,
    _ref2$copy = _ref2.copy,
    copy = _ref2$copy === void 0 ? _videoStudio["default"] : _ref2$copy;
  var mediaLabel = label || (type === "image" ? copy.media.image : type === "video" ? copy.media.video : copy.media.audio);
  var actionLabel = description || mediaLabel;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex min-w-[60px] flex-col items-center gap-1.5",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: _PromptComposer.PROMPT_MEDIA_PREVIEW_CLASS,
      children: [type === "image" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: url,
        alt: "",
        className: "w-full h-full object-cover"
      }) : type === "video" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
        src: url,
        className: "w-full h-full object-cover",
        muted: true
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-full h-full flex items-center justify-center bg-white/5 text-primary",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
          width: "18",
          height: "18",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M9 18V5l10-2v13"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
            cx: "6",
            cy: "18",
            r: "3"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
            cx: "16",
            cy: "16",
            r: "3"
          })]
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        "aria-label": "".concat(copy.media.removePrefix, " ").concat(actionLabel),
        title: "".concat(copy.media.removePrefix, " ").concat(actionLabel),
        onClick: function onClick() {
          return onRemove(index);
        },
        className: "absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white/85 hover:text-white text-[8px] border border-white/5",
        children: "\xD7"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferenceMediaLabel, {
      label: mediaLabel
    })]
  });
}
function ReferenceUploadButton(_ref3) {
  var inputRef = _ref3.inputRef,
    accept = _ref3.accept,
    multiple = _ref3.multiple,
    onChange = _ref3.onChange,
    onClick = _ref3.onClick,
    title = _ref3.title,
    uploading = _ref3.uploading,
    progress = _ref3.progress,
    type = _ref3.type,
    _ref3$label = _ref3.label,
    label = _ref3$label === void 0 ? null : _ref3$label,
    _ref3$required = _ref3.required,
    required = _ref3$required === void 0 ? false : _ref3$required,
    _ref3$disabled = _ref3.disabled,
    disabled = _ref3$disabled === void 0 ? false : _ref3$disabled,
    _ref3$copy = _ref3.copy,
    copy = _ref3$copy === void 0 ? _videoStudio["default"] : _ref3$copy;
  var localInputRef = (0, _react.useRef)(null);
  var resolvedInputRef = inputRef || localInputRef;
  var announcedProgress = Math.min(100, Math.max(0, Math.floor(progress / 10) * 10));
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isUploadDragging = _useState2[0],
    setIsUploadDragging = _useState2[1];
  var uploadDragCounterRef = (0, _react.useRef)(0);
  var acceptPrefixes = (accept || "").split(",").map(function (token) {
    return token.trim();
  }).filter(Boolean);
  var fileMatchesAccept = function fileMatchesAccept(file) {
    if (acceptPrefixes.length === 0) return true;
    return acceptPrefixes.some(function (token) {
      if (token.endsWith("/*")) {
        var _file$type;
        return (_file$type = file.type) === null || _file$type === void 0 ? void 0 : _file$type.startsWith(token.slice(0, -1));
      }
      if (token.startsWith(".")) {
        var _file$name;
        return (_file$name = file.name) === null || _file$name === void 0 ? void 0 : _file$name.toLowerCase().endsWith(token.toLowerCase());
      }
      return file.type === token;
    });
  };
  var handleUploadDragEnter = function handleUploadDragEnter(e) {
    var _e$dataTransfer;
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;
    uploadDragCounterRef.current += 1;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsUploadDragging(true);
    }
  };
  var handleUploadDragLeave = function handleUploadDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadDragCounterRef.current -= 1;
    if (uploadDragCounterRef.current <= 0) {
      uploadDragCounterRef.current = 0;
      setIsUploadDragging(false);
    }
  };
  var handleUploadDragOver = function handleUploadDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  var handleUploadDrop = function handleUploadDrop(e) {
    var _e$dataTransfer2;
    e.preventDefault();
    e.stopPropagation();
    uploadDragCounterRef.current = 0;
    setIsUploadDragging(false);
    if (disabled || uploading) return;
    var droppedFiles = Array.from(((_e$dataTransfer2 = e.dataTransfer) === null || _e$dataTransfer2 === void 0 ? void 0 : _e$dataTransfer2.files) || []).filter(fileMatchesAccept);
    if (droppedFiles.length === 0) return;
    var filesToUse = multiple ? droppedFiles : [droppedFiles[0]];
    onChange === null || onChange === void 0 || onChange({
      target: {
        files: filesToUse,
        value: ""
      }
    });
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: label ? "relative flex min-w-[60px] flex-col items-center gap-1.5" : "relative",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ref: resolvedInputRef,
      type: "file",
      accept: accept,
      multiple: multiple,
      className: "hidden",
      onChange: onChange
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      title: title,
      "aria-label": title,
      "aria-busy": uploading || undefined,
      disabled: disabled,
      onClick: onClick || function () {
        var _resolvedInputRef$cur;
        return (_resolvedInputRef$cur = resolvedInputRef.current) === null || _resolvedInputRef$cur === void 0 ? void 0 : _resolvedInputRef$cur.click();
      },
      onDragEnter: handleUploadDragEnter,
      onDragLeave: handleUploadDragLeave,
      onDragOver: handleUploadDragOver,
      onDrop: handleUploadDrop,
      className: "".concat((0, _PromptComposer.promptMediaButtonClassName)(), " disabled:cursor-not-allowed disabled:opacity-50").concat(isUploadDragging ? " ring-2 ring-primary border-primary bg-primary/10" : ""),
      children: uploading ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
            className: "text-[#22d3ee] transition-all duration-300"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
          className: "absolute text-[9px] font-black text-[#22d3ee] leading-none",
          children: [progress, "%"]
        })]
      }) : type === "video" ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "currentColor",
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
      }) : type === "audio" ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.5",
        className: "text-white/40 group-hover:text-[#22d3ee] transition-colors",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M9 18V5l10-2v13"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
          cx: "6",
          cy: "18",
          r: "3"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
          cx: "16",
          cy: "16",
          r: "3"
        })]
      }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.5",
        className: "text-white/40 group-hover:text-[#22d3ee] transition-colors",
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
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "sr-only",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
      children: uploading ? copy.upload.uploadingProgress.replace('{title}', title).replace('{progress}', announcedProgress) : ""
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferenceMediaLabel, {
      label: label,
      required: required
    })]
  });
}

// ── SVG icons (kept inline to avoid extra deps) ───────────────────────────────

var CheckSvg = function CheckSvg() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#22d3ee",
    strokeWidth: "4",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "20 6 9 17 4 12"
    })
  });
};
var VideoIconSvg = function VideoIconSvg(_ref4) {
  var className = _ref4.className;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "18",
    height: "18",
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
var VideoReadySvg = function VideoReadySvg() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: "text-primary",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
      points: "23 7 16 12 23 17 23 7"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
      x: "1",
      y: "5",
      width: "15",
      height: "14",
      rx: "2",
      ry: "2"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "7 10 10 13 15 8",
      stroke: "#22d3ee",
      strokeWidth: "2.5"
    })]
  });
};

// ── Dropdown components ───────────────────────────────────────────────────────

var PROVIDER_LOGOS = {
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
var invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];
function seedanceToolLabel(tool, copy) {
  var includeAction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return [includeAction ? copy.seedance.toolNames[tool.group] : null, copy.seedance.toolVariants[tool.variant], tool.resolution].filter(Boolean).join(" · ");
}
function ModelDropdown(_ref5) {
  var _availableProviders$f;
  var selectedModel = _ref5.selectedModel,
    onSelect = _ref5.onSelect,
    onClose = _ref5.onClose,
    _ref5$copy = _ref5.copy,
    copy = _ref5$copy === void 0 ? _videoStudio["default"] : _ref5$copy;
  var _useState3 = (0, _react.useState)(""),
    _useState4 = _slicedToArray(_useState3, 2),
    search = _useState4[0],
    setSearch = _useState4[1];
  var selectedEntry = _modelFamilies.videoModelMenuEntryByVariantId.get(selectedModel);
  var selectedModelProvider = (selectedEntry === null || selectedEntry === void 0 ? void 0 : selectedEntry.family.provider) || "all";
  var modelCategories = [{
    id: "all",
    label: copy.categories.all,
    entries: _modelFamilies.videoModelMenuEntries
  }, {
    id: "t2v",
    label: copy.categories.t2v,
    entries: _modelFamilies.videoModelMenuEntries.filter(function (entry) {
      return entry.variantsByMode.t2v && !(0, _veoModels.getVeoToolConfiguration)(entry.defaultVariant.model.id);
    })
  }, {
    id: "i2v",
    label: copy.categories.i2v,
    entries: _modelFamilies.videoModelMenuEntries.filter(function (entry) {
      return entry.variantsByMode.i2v;
    })
  }, {
    id: "v2v",
    label: copy.categories.v2v,
    entries: _modelFamilies.videoModelMenuEntries.filter(function (entry) {
      return entry.variantsByMode.v2v || (0, _veoModels.getVeoToolConfiguration)(entry.defaultVariant.model.id);
    })
  }];
  var _useState5 = (0, _react.useState)("all"),
    _useState6 = _slicedToArray(_useState5, 2),
    selectedCategory = _useState6[0],
    setSelectedCategory = _useState6[1];
  var _useState7 = (0, _react.useState)(function () {
      return selectedModelProvider;
    }),
    _useState8 = _slicedToArray(_useState7, 2),
    selectedProvider = _useState8[0],
    setSelectedProvider = _useState8[1];
  var activeCategory = modelCategories.find(function (category) {
    return category.id === selectedCategory;
  }) || modelCategories[0];
  var modelEntries = activeCategory.entries;
  var activeItemRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    // Automatically scroll the active model into view when opening
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest"
      });
    }
  }, []);
  var getProviderStyle = function getProviderStyle(provider) {
    switch (provider) {
      case "grok":
        return {
          text: "xI",
          bg: "bg-orange-500/10 text-orange-400 border-orange-500/25"
        };
      case "openai":
        return {
          text: "O",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
        };
      case "google":
        return {
          text: "G",
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/25"
        };
      case "blackforest":
        return {
          text: "BF",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/25"
        };
      case "bytedance":
        return {
          text: "BD",
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/25"
        };
      case "midjourney":
        return {
          text: "MJ",
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25"
        };
      case "kling":
        return {
          text: "KL",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/25"
        };
      case "vidu":
        return {
          text: "VD",
          bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25"
        };
      case "minimax":
        return {
          text: "MX",
          bg: "bg-pink-500/10 text-pink-400 border-pink-500/25"
        };
      case "ideogram":
        return {
          text: "ID",
          bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25"
        };
      case "luma":
        return {
          text: "LM",
          bg: "bg-teal-500/10 text-teal-400 border-teal-500/25"
        };
      case "alibaba":
        return {
          text: "AL",
          bg: "bg-sky-500/10 text-sky-400 border-sky-500/25"
        };
      case "leonardoai":
        return {
          text: "LE",
          bg: "bg-violet-500/10 text-violet-400 border-violet-500/25"
        };
      case "stability":
        return {
          text: "SD",
          bg: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25"
        };
      default:
        var name = provider ? provider.toUpperCase() : "AI";
        return {
          text: name.substring(0, 2),
          bg: "bg-primary/10 text-primary border-primary/25"
        };
    }
  };

  // Dynamically compute list of providers from the input models lists
  var availableProviders = [];
  var seenProviders = new Set();
  modelEntries.forEach(function (_ref6) {
    var family = _ref6.family;
    var pId = family.provider || 'muapi';
    var pName = family.provider_name || 'Muapi';
    if (!seenProviders.has(pId)) {
      seenProviders.add(pId);
      availableProviders.push({
        id: pId,
        name: pName
      });
    }
  });
  var lf = search.toLowerCase();
  var filtered = modelEntries.filter(function (entry) {
    var family = entry.family;
    // 1. Filter by provider tab
    if (selectedProvider !== "all") {
      var pId = family.provider || 'muapi';
      if (pId !== selectedProvider) return false;
    }
    // 2. Filter by search query
    return entry.searchText.includes(lf);
  });
  var selectedTool = (0, _seedanceModels.getSeedanceToolConfiguration)(selectedModel);
  var selectedVeoTool = (0, _veoModels.getVeoToolConfiguration)(selectedModel);
  var mainEntries = [];
  var seedanceToolsByGroup = {
    continueGenerated: [],
    removeWatermark: []
  };
  var veoTools = [];
  var _iterator = _createForOfIteratorHelper(filtered),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var entry = _step.value;
      var tool = (0, _seedanceModels.getSeedanceToolConfiguration)(entry.defaultVariant.model.id);
      var veoTool = (0, _veoModels.getVeoToolConfiguration)(entry.defaultVariant.model.id);
      if (tool) seedanceToolsByGroup[tool.group][tool.order] = entry;else if (veoTool) veoTools[veoTool.order] = entry;else mainEntries.push(entry);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  var getIconColor = function getIconColor(family) {
    if (family.id.includes("kling")) return "bg-blue-500/10 text-blue-400 border-blue-500/10";
    if (family.id.includes("veo")) return "bg-purple-500/10 text-purple-400 border-purple-500/10";
    if (family.id.includes("sora")) return "bg-rose-500/10 text-rose-400 border-rose-500/10";
    return "bg-primary/10 text-primary border-primary/10";
  };
  var renderItem = function renderItem(entry) {
    var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : entry.name;
    var family = entry.family;
    var isSelected = selectedEntry === entry;
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
      type: "button",
      "aria-pressed": isSelected,
      ref: isSelected ? activeItemRef : null,
      className: "flex w-full text-left items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ".concat(isSelected ? "bg-white/5 border-white/5" : ""),
      onClick: function onClick(e) {
        e.stopPropagation();
        onSelect(entry, activeCategory.id);
        onClose();
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-3.5",
        children: [PROVIDER_LOGOS[family.provider] ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-8 h-8 rounded-xl border border-white/5 overflow-hidden shrink-0 flex items-center justify-center bg-white/[0.02]",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: PROVIDER_LOGOS[family.provider],
            alt: family.provider_name,
            className: "w-full h-full object-contain p-1 ".concat(invertLogos.includes(family.provider) ? "invert" : "")
          })
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-9 h-9 ".concat(getIconColor(family), " border rounded-xl flex items-center justify-center font-black text-xs shadow-inner uppercase"),
          children: entry.name.charAt(0)
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col gap-0.5 min-w-0",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-xs font-bold text-white tracking-tight truncate",
            children: label
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex items-center gap-1.5",
            children: selectedProvider === "all" && family.provider_name && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[9px] text-white/40",
              children: family.provider_name
            })
          })]
        })]
      }), isSelected && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
    }, entry.id);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex gap-4 h-full max-h-[70vh] min-h-[350px]",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col gap-2.5 items-center pr-2 border-r border-white/5 shrink-0 select-none overflow-y-auto custom-scrollbar w-14 pt-0.5",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        onClick: function onClick() {
          return setSelectedProvider("all");
        },
        className: "w-8 h-8 rounded-full flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer ".concat(selectedProvider === "all" ? "bg-white/10 text-yellow-400 border-yellow-500/30 shadow-md scale-105" : "bg-white/[0.02] text-white/50 border-white/[0.03] hover:bg-white/5 hover:text-white"),
        title: copy.providers.allProviders,
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "15",
          height: "15",
          viewBox: "0 0 24 24",
          fill: selectedProvider === "all" ? "currentColor" : "none",
          stroke: "currentColor",
          strokeWidth: "2",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
            points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          })
        })
      }), availableProviders.map(function (p) {
        var style = getProviderStyle(p.id);
        var isSelected = selectedProvider === p.id;
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "button",
          onClick: function onClick() {
            return setSelectedProvider(p.id);
          },
          "aria-pressed": isSelected,
          className: "w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden font-black text-[10px] border transition-all cursor-pointer ".concat(isSelected ? "".concat(style.bg, " scale-105 shadow-md shadow-black/10") : "bg-white/[0.02] text-white/40 border-white/[0.02] hover:bg-white/5 hover:text-white/80"),
          title: p.name,
          children: PROVIDER_LOGOS[p.id] ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: PROVIDER_LOGOS[p.id],
            alt: p.name,
            className: "w-full h-full rounded-full object-contain ".concat(invertLogos.includes(p.id) ? "invert" : "")
          }) : style.text
        }, p.id);
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex-1 flex flex-col gap-2 min-w-0",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "px-1 pb-2 border-b border-white/5 shrink-0 space-y-2",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex gap-1.5 overflow-x-auto custom-scrollbar pb-0.5",
          children: modelCategories.map(function (category) {
            return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              onClick: function onClick() {
                setSelectedCategory(category.id);
                setSelectedProvider("all");
              },
              className: "shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors border ".concat(selectedCategory === category.id ? "bg-primary/15 text-primary border-primary/30" : "bg-white/[0.02] text-white/50 border-white/[0.04] hover:bg-white/5 hover:text-white"),
              children: category.label
            }, category.id);
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/5 focus-within:border-primary/50 transition-colors",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "3",
            className: "text-muted",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
              cx: "11",
              cy: "11",
              r: "8"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M21 21l-4.35-4.35"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
            type: "text",
            placeholder: copy.search.placeholder,
            value: search,
            onChange: function onChange(e) {
              var value = e.target.value;
              setSearch(value);
              if (value.trim()) setSelectedProvider("all");
            },
            onClick: function onClick(e) {
              return e.stopPropagation();
            },
            className: "bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none"
          })]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "text-xs font-bold text-secondary px-2 py-1 shrink-0 flex items-center justify-between",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
          children: [activeCategory.label, " models"]
        }), selectedProvider !== "all" && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60",
          children: ((_availableProviders$f = availableProviders.find(function (p) {
            return p.id === selectedProvider;
          })) === null || _availableProviders$f === void 0 ? void 0 : _availableProviders$f.name) || selectedProvider
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1",
        children: filtered.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "text-xs text-white/30 text-center py-6",
          children: "No models found"
        }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
          children: [mainEntries.map(function (entry) {
            return renderItem(entry);
          }), Object.values(seedanceToolsByGroup).some(function (entries) {
            return entries.length > 0;
          }) && /*#__PURE__*/(0, _jsxRuntime.jsxs)("details", {
            open: Boolean(search.trim()) || Boolean(selectedTool),
            className: "mt-2 border-t border-white/5 pt-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("summary", {
              className: "cursor-pointer px-3 py-2 text-xs font-semibold text-white/50",
              children: copy.seedance.tools
            }), ["continueGenerated", "removeWatermark"].map(function (group) {
              var entries = seedanceToolsByGroup[group].filter(Boolean);
              return entries.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                role: "group",
                "aria-label": copy.seedance[group],
                className: "pt-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                  className: "px-3 pb-1 text-[11px] font-semibold text-white/60",
                  children: copy.seedance[group]
                }), entries.map(function (entry) {
                  return renderItem(entry, seedanceToolLabel((0, _seedanceModels.getSeedanceToolConfiguration)(entry.defaultVariant.model.id), copy));
                })]
              }, group);
            })]
          }), veoTools.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("details", {
            open: Boolean(search.trim()) || Boolean(selectedVeoTool),
            className: "mt-2 border-t border-white/5 pt-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("summary", {
              className: "cursor-pointer px-3 py-2 text-xs font-semibold text-white/50",
              children: copy.veo.tools
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "px-3 pb-2 text-[11px] text-white/45",
              children: copy.veo.toolsHelp
            }), veoTools.filter(Boolean).map(function (entry) {
              return renderItem(entry, copy.veo.toolNames[(0, _veoModels.getVeoToolConfiguration)(entry.defaultVariant.model.id).key]);
            })]
          })]
        })
      })]
    })]
  });
}

// ── Control button ────────────────────────────────────────────────────────────

// ── Dropdown panel ─────────────────────────────────────────────────────────────
// Rendered inside a `relative` wrapper div; floats above the anchor button.

// ── Main component ────────────────────────────────────────────────────────────

function VideoStudio(_ref7) {
  var _defaultModel$inputs, _defaultModel$inputs2, _defaultModel$inputs3, _defaultModel$inputs4, _selectedVariant$mode, _selectedVariant$mode2;
  var apiKey = _ref7.apiKey,
    onGenerationStart = _ref7.onGenerationStart,
    onGenerationEnd = _ref7.onGenerationEnd,
    onGenerationComplete = _ref7.onGenerationComplete,
    onGenerationError = _ref7.onGenerationError,
    historyItems = _ref7.historyItems,
    onDeleteHistoryItem = _ref7.onDeleteHistoryItem,
    droppedFiles = _ref7.droppedFiles,
    onFilesHandled = _ref7.onFilesHandled,
    templateData = _ref7.templateData,
    _ref7$locale = _ref7.locale,
    locale = _ref7$locale === void 0 ? "en" : _ref7$locale;
  var copy = (0, _react.useMemo)(function () {
    return (0, _i18nUtils.resolveCopy)(_videoStudio["default"], _videoStudio2["default"], locale);
  }, [locale]);
  var LEGACY_PERSIST_KEY = "hg_video_studio_persistent";
  var PERSIST_KEY = (0, _persistKey.scopedPersistKey)(LEGACY_PERSIST_KEY, apiKey);
  (0, _react.useEffect)(function () {
    (0, _persistKey.migrateLegacyPersistKey)(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

  // ── generation state ──
  var _useState9 = (0, _react.useState)(false),
    _useState0 = _slicedToArray(_useState9, 2),
    imageMode = _useState0[0],
    setImageMode = _useState0[1]; // i2v
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    v2vMode = _useState10[0],
    setV2vMode = _useState10[1];
  var _useState11 = (0, _react.useState)(null),
    _useState12 = _slicedToArray(_useState11, 2),
    selectedWorkflowId = _useState12[0],
    setSelectedWorkflowId = _useState12[1];

  // ── model / params ──
  var defaultModel = _models.t2vModels[0];
  var defaultFamily = _modelFamilies.videoModelCatalog.familyByVariantId.get(defaultModel.id);
  var _useState13 = (0, _react.useState)(defaultModel.id),
    _useState14 = _slicedToArray(_useState13, 2),
    selectedModel = _useState14[0],
    setSelectedModel = _useState14[1];
  var _useState15 = (0, _react.useState)(defaultFamily.id),
    _useState16 = _slicedToArray(_useState15, 2),
    selectedFamilyId = _useState16[0],
    setSelectedFamilyId = _useState16[1];
  var _useState17 = (0, _react.useState)(((_defaultModel$inputs = defaultModel.inputs) === null || _defaultModel$inputs === void 0 || (_defaultModel$inputs = _defaultModel$inputs.aspect_ratio) === null || _defaultModel$inputs === void 0 ? void 0 : _defaultModel$inputs["default"]) || "16:9"),
    _useState18 = _slicedToArray(_useState17, 2),
    selectedAr = _useState18[0],
    setSelectedAr = _useState18[1];
  var _useState19 = (0, _react.useState)(((_defaultModel$inputs2 = defaultModel.inputs) === null || _defaultModel$inputs2 === void 0 || (_defaultModel$inputs2 = _defaultModel$inputs2.duration) === null || _defaultModel$inputs2 === void 0 ? void 0 : _defaultModel$inputs2["default"]) || 5),
    _useState20 = _slicedToArray(_useState19, 2),
    selectedDuration = _useState20[0],
    setSelectedDuration = _useState20[1];
  var _useState21 = (0, _react.useState)(((_defaultModel$inputs3 = defaultModel.inputs) === null || _defaultModel$inputs3 === void 0 || (_defaultModel$inputs3 = _defaultModel$inputs3.resolution) === null || _defaultModel$inputs3 === void 0 ? void 0 : _defaultModel$inputs3["default"]) || ""),
    _useState22 = _slicedToArray(_useState21, 2),
    selectedResolution = _useState22[0],
    setSelectedResolution = _useState22[1];
  var _useState23 = (0, _react.useState)(((_defaultModel$inputs4 = defaultModel.inputs) === null || _defaultModel$inputs4 === void 0 || (_defaultModel$inputs4 = _defaultModel$inputs4.quality) === null || _defaultModel$inputs4 === void 0 ? void 0 : _defaultModel$inputs4["default"]) || ""),
    _useState24 = _slicedToArray(_useState23, 2),
    selectedQuality = _useState24[0],
    setSelectedQuality = _useState24[1];
  var _useState25 = (0, _react.useState)(""),
    _useState26 = _slicedToArray(_useState25, 2),
    selectedEffect = _useState26[0],
    setSelectedEffect = _useState26[1];
  var _useState27 = (0, _react.useState)(function () {
      return (0, _modelParameters.createModelParameterValues)(defaultModel);
    }),
    _useState28 = _slicedToArray(_useState27, 2),
    modelParameterValues = _useState28[0],
    setModelParameterValues = _useState28[1];

  // ── upload progress ──
  var _useState29 = (0, _react.useState)(0),
    _useState30 = _slicedToArray(_useState29, 2),
    imageProgress = _useState30[0],
    setImageProgress = _useState30[1];
  var _useState31 = (0, _react.useState)(0),
    _useState32 = _slicedToArray(_useState31, 2),
    videoProgress = _useState32[0],
    setVideoProgress = _useState32[1];

  // ── control visibility ──
  var _useState33 = (0, _react.useState)(true),
    _useState34 = _slicedToArray(_useState33, 2),
    showAr = _useState34[0],
    setShowAr = _useState34[1];
  var _useState35 = (0, _react.useState)(true),
    _useState36 = _slicedToArray(_useState35, 2),
    showDuration = _useState36[0],
    setShowDuration = _useState36[1];
  var _useState37 = (0, _react.useState)(false),
    _useState38 = _slicedToArray(_useState37, 2),
    showResolution = _useState38[0],
    setShowResolution = _useState38[1];
  var _useState39 = (0, _react.useState)(false),
    _useState40 = _slicedToArray(_useState39, 2),
    showQuality = _useState40[0],
    setShowQuality = _useState40[1];
  var _useState41 = (0, _react.useState)(false),
    _useState42 = _slicedToArray(_useState41, 2),
    showEffect = _useState42[0],
    setShowEffect = _useState42[1];

  // ── uploads ──
  var _useState43 = (0, _react.useState)([]),
    _useState44 = _slicedToArray(_useState43, 2),
    uploadedImageUrls = _useState44[0],
    setUploadedImageUrls = _useState44[1];
  var _useState45 = (0, _react.useState)(false),
    _useState46 = _slicedToArray(_useState45, 2),
    imageUploading = _useState46[0],
    setImageUploading = _useState46[1];
  var _useState47 = (0, _react.useState)(null),
    _useState48 = _slicedToArray(_useState47, 2),
    uploadedEndImageUrl = _useState48[0],
    setUploadedEndImageUrl = _useState48[1];
  var _useState49 = (0, _react.useState)(false),
    _useState50 = _slicedToArray(_useState49, 2),
    endImageUploading = _useState50[0],
    setEndImageUploading = _useState50[1];
  var _useState51 = (0, _react.useState)(0),
    _useState52 = _slicedToArray(_useState51, 2),
    endImageProgress = _useState52[0],
    setEndImageProgress = _useState52[1];
  var _useState53 = (0, _react.useState)([]),
    _useState54 = _slicedToArray(_useState53, 2),
    uploadedVideoUrls = _useState54[0],
    setUploadedVideoUrls = _useState54[1];
  var _useState55 = (0, _react.useState)(false),
    _useState56 = _slicedToArray(_useState55, 2),
    videoUploading = _useState56[0],
    setVideoUploading = _useState56[1];
  var _useState57 = (0, _react.useState)([]),
    _useState58 = _slicedToArray(_useState57, 2),
    uploadedAudioUrls = _useState58[0],
    setUploadedAudioUrls = _useState58[1];
  var _useState59 = (0, _react.useState)(false),
    _useState60 = _slicedToArray(_useState59, 2),
    audioUploading = _useState60[0],
    setAudioUploading = _useState60[1];
  var _useState61 = (0, _react.useState)(0),
    _useState62 = _slicedToArray(_useState61, 2),
    audioProgress = _useState62[0],
    setAudioProgress = _useState62[1];
  var _useState63 = (0, _react.useState)({}),
    _useState64 = _slicedToArray(_useState63, 2),
    workflowMediaDrafts = _useState64[0],
    setWorkflowMediaDrafts = _useState64[1];
  var _useState65 = (0, _react.useState)(null),
    _useState66 = _slicedToArray(_useState65, 2),
    workflowUploadSlotId = _useState66[0],
    setWorkflowUploadSlotId = _useState66[1];
  var mediaUploading = imageUploading || endImageUploading || videoUploading || audioUploading || Boolean(workflowUploadSlotId);
  var uploadedImageUrl = uploadedImageUrls[0] || null;
  var uploadedVideoUrl = uploadedVideoUrls[0] || null;

  // ── generation / canvas ──
  var _useState67 = (0, _react.useState)(false),
    _useState68 = _slicedToArray(_useState67, 2),
    generating = _useState68[0],
    setGenerating = _useState68[1];
  var _useState69 = (0, _react.useState)(null),
    _useState70 = _slicedToArray(_useState69, 2),
    generateError = _useState70[0],
    setGenerateError = _useState70[1];
  var _useState71 = (0, _react.useState)(null),
    _useState72 = _slicedToArray(_useState71, 2),
    fullscreenUrl = _useState72[0],
    setFullscreenUrl = _useState72[1];
  var _useState73 = (0, _react.useState)(null),
    _useState74 = _slicedToArray(_useState73, 2),
    canvasUrl = _useState74[0],
    setCanvasUrl = _useState74[1];
  var _useState75 = (0, _react.useState)(null),
    _useState76 = _slicedToArray(_useState75, 2),
    canvasModel = _useState76[0],
    setCanvasModel = _useState76[1];
  var _useState77 = (0, _react.useState)(false),
    _useState78 = _slicedToArray(_useState77, 2),
    showCanvas = _useState78[0],
    setShowCanvas = _useState78[1];
  var _useState79 = (0, _react.useState)(false),
    _useState80 = _slicedToArray(_useState79, 2),
    isDrawModalOpen = _useState80[0],
    setIsDrawModalOpen = _useState80[1];
  var _useState81 = (0, _react.useState)({}),
    _useState82 = _slicedToArray(_useState81, 2),
    generationSources = _useState82[0],
    setGenerationSources = _useState82[1];
  var _useState83 = (0, _react.useState)(""),
    _useState84 = _slicedToArray(_useState83, 2),
    selectedVeoSourceId = _useState84[0],
    setSelectedVeoSourceId = _useState84[1];

  // ── history ──
  var _useState85 = (0, _react.useState)([]),
    _useState86 = _slicedToArray(_useState85, 2),
    localHistory = _useState86[0],
    setLocalHistory = _useState86[1];
  var _useState87 = (0, _react.useState)(0),
    _useState88 = _slicedToArray(_useState87, 2),
    activeHistoryIdx = _useState88[0],
    setActiveHistoryIdx = _useState88[1];

  // ── dropdown ──
  var _useState89 = (0, _react.useState)(null),
    _useState90 = _slicedToArray(_useState89, 2),
    openDropdown = _useState90[0],
    setOpenDropdown = _useState90[1];

  // ── prompt ──
  var _useState91 = (0, _react.useState)(""),
    _useState92 = _slicedToArray(_useState91, 2),
    prompt = _useState92[0],
    setPrompt = _useState92[1];

  // ── refs ──
  var containerRef = (0, _react.useRef)(null);
  var textareaRef = (0, _react.useRef)(null);
  var dropdownRef = (0, _react.useRef)(null);
  var imageFileInputRef = (0, _react.useRef)(null);
  var endImageFileInputRef = (0, _react.useRef)(null);
  var videoFileInputRef = (0, _react.useRef)(null);
  var audioFileInputRef = (0, _react.useRef)(null);
  var resultVideoRef = (0, _react.useRef)(null);
  var workflowControlId = (0, _react.useId)();
  var workflowMenuId = "".concat(workflowControlId, "-menu");
  var hasRestored = (0, _react.useRef)(false);
  var selectionRef = (0, _react.useRef)(null);
  selectionRef.current = {
    selectedFamilyId: selectedFamilyId,
    selectedModel: selectedModel,
    selectedWorkflowId: selectedWorkflowId,
    imageMode: imageMode,
    v2vMode: v2vMode
  };
  var workflowVariantPreferencesRef = (0, _react.useRef)(new Map());
  var workflowUploadSlotRef = (0, _react.useRef)(null);
  var workflowDraftSessionRef = (0, _react.useRef)(0);
  var mediaRef = (0, _react.useRef)(null);
  mediaRef.current = {
    imageUrls: uploadedImageUrls,
    endImageUrl: uploadedEndImageUrl,
    videoUrls: uploadedVideoUrls,
    audioUrls: uploadedAudioUrls
  };
  var workflowMediaDraftsRef = (0, _react.useRef)(workflowMediaDrafts);
  workflowMediaDraftsRef.current = workflowMediaDrafts;
  var commonParameterValuesRef = (0, _react.useRef)(null);
  commonParameterValuesRef.current = _objectSpread(_objectSpread({}, modelParameterValues), {}, {
    aspectRatio: selectedAr,
    duration: selectedDuration,
    resolution: selectedResolution,
    quality: selectedQuality
  });

  // ── derived data ──
  var history = historyItems !== null && historyItems !== void 0 ? historyItems : localHistory;

  // See ImageStudio's handleDeleteEntry: when historyItems is server-backed
  // (White Label / backfilled sessions), localHistory isn't what's rendered,
  // so removal has to go through the parent to delete server-side and
  // update the same state `history` reads from.
  var handleDeleteEntry = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(entry, idx) {
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            if (!(historyItems && onDeleteHistoryItem)) {
              _context.n = 2;
              break;
            }
            _context.n = 1;
            return onDeleteHistoryItem(entry);
          case 1:
            _context.n = 3;
            break;
          case 2:
            setLocalHistory(function (prev) {
              return prev.filter(function (_, i) {
                return i !== idx;
              });
            });
          case 3:
            return _context.a(2);
        }
      }, _callee);
    }));
    return function (_x3, _x4) {
      return _ref8.apply(this, arguments);
    };
  }(), [historyItems, onDeleteHistoryItem]);
  var getCurrentAspectRatios = (0, _react.useCallback)(function (id) {
    return imageMode ? (0, _models.getAspectRatiosForI2VModel)(id) : (0, _models.getAspectRatiosForVideoModel)(id);
  }, [imageMode]);
  var getCurrentDurations = (0, _react.useCallback)(function (id) {
    return imageMode ? (0, _models.getDurationsForI2VModel)(id) : (0, _models.getDurationsForModel)(id);
  }, [imageMode]);
  var getCurrentResolutions = (0, _react.useCallback)(function (id) {
    return imageMode ? (0, _models.getResolutionsForI2VModel)(id) : (0, _models.getResolutionsForVideoModel)(id);
  }, [imageMode]);
  var getCurrentModel = (0, _react.useCallback)(function () {
    var _videoModelCatalog$va;
    return (_videoModelCatalog$va = _modelFamilies.videoModelCatalog.variantById.get(selectedModel)) === null || _videoModelCatalog$va === void 0 ? void 0 : _videoModelCatalog$va.model;
  }, [selectedModel]);
  var isMotionControlSelection = (0, _react.useCallback)(function (modelId, isV2v) {
    var _videoModelCatalog$va2;
    if (!isV2v) return false;
    var m = (_videoModelCatalog$va2 = _modelFamilies.videoModelCatalog.variantById.get(modelId)) === null || _videoModelCatalog$va2 === void 0 ? void 0 : _videoModelCatalog$va2.model;
    return !!(m !== null && m !== void 0 && m.imageField);
  }, []);

  // ── update controls when the selected model changes ─────────────────────
  var applyControlsForModel = (0, _react.useCallback)(function (modelId, isImageMode, isV2vMode) {
    var _videoModelCatalog$va4, _model$inputs2;
    if ((0, _groupedVideoModels.getGroupedVideoConfiguration)(modelId)) {
      var _videoModelCatalog$va3, _values$resolution;
      var _model = (_videoModelCatalog$va3 = _modelFamilies.videoModelCatalog.variantById.get(modelId)) === null || _videoModelCatalog$va3 === void 0 ? void 0 : _videoModelCatalog$va3.model;
      var options = (0, _videoModelParameters.getVideoCommonOptions)(_model, commonParameterValuesRef.current);
      var values = (0, _videoModelParameters.getVideoCommonValues)(_model, commonParameterValuesRef.current);
      setShowAr(options.aspectRatios.length > 0);
      setShowDuration(options.durations.length > 0);
      setShowResolution(options.resolutions.length > 0);
      setShowQuality(options.qualities.length > 0);
      setShowEffect(false);
      if (values.aspectRatio !== undefined) setSelectedAr(values.aspectRatio);
      if (values.duration !== undefined) setSelectedDuration(values.duration);
      var resolution = (_values$resolution = values.resolution) !== null && _values$resolution !== void 0 ? _values$resolution : (0, _seedanceModels.getSeedanceEndpointResolution)(modelId);
      if (resolution !== undefined) setSelectedResolution(resolution);
      if (values.quality !== undefined) setSelectedQuality(values.quality);
      return;
    }
    if (isV2vMode || (0, _veoModels.getVeoToolConfiguration)(modelId)) {
      setShowAr(false);
      setShowDuration(false);
      setShowResolution(false);
      setShowQuality(false);
      setShowEffect(false);
      return;
    }
    var model = (_videoModelCatalog$va4 = _modelFamilies.videoModelCatalog.variantById.get(modelId)) === null || _videoModelCatalog$va4 === void 0 ? void 0 : _videoModelCatalog$va4.model;
    var ars = isImageMode ? (0, _models.getAspectRatiosForI2VModel)(modelId) : (0, _models.getAspectRatiosForVideoModel)(modelId);
    if (ars.length > 0) {
      setSelectedAr(ars[0]);
      setShowAr(true);
    } else {
      setShowAr(false);
    }
    var durations = isImageMode ? (0, _models.getDurationsForI2VModel)(modelId) : (0, _models.getDurationsForModel)(modelId);
    if (durations.length > 0) {
      var _model$inputs$duratio, _model$inputs;
      setSelectedDuration((_model$inputs$duratio = model === null || model === void 0 || (_model$inputs = model.inputs) === null || _model$inputs === void 0 || (_model$inputs = _model$inputs.duration) === null || _model$inputs === void 0 ? void 0 : _model$inputs["default"]) !== null && _model$inputs$duratio !== void 0 ? _model$inputs$duratio : durations[0]);
      setShowDuration(true);
    } else {
      setShowDuration(false);
    }
    var resolutions = isImageMode ? (0, _models.getResolutionsForI2VModel)(modelId) : (0, _models.getResolutionsForVideoModel)(modelId);
    if (resolutions.length > 0) {
      setSelectedResolution(resolutions[0]);
      setShowResolution(true);
    } else {
      setShowResolution(false);
    }
    var qualities = (model === null || model === void 0 || (_model$inputs2 = model.inputs) === null || _model$inputs2 === void 0 || (_model$inputs2 = _model$inputs2.quality) === null || _model$inputs2 === void 0 ? void 0 : _model$inputs2["enum"]) || [];
    if (qualities.length > 0) {
      var _model$inputs3;
      setSelectedQuality((model === null || model === void 0 || (_model$inputs3 = model.inputs) === null || _model$inputs3 === void 0 || (_model$inputs3 = _model$inputs3.quality) === null || _model$inputs3 === void 0 ? void 0 : _model$inputs3["default"]) || qualities[0]);
      setShowQuality(true);
    } else {
      setSelectedQuality("");
      setShowQuality(false);
    }
    var effects = isImageMode ? (0, _models.getEffectsForI2VModel)(modelId) : [];
    if (effects.length > 0) {
      setSelectedEffect((0, _models.getDefaultEffectForI2VModel)(modelId) || effects[0]);
      setShowEffect(true);
    } else {
      setSelectedEffect("");
      setShowEffect(false);
    }
  }, []);
  var selectedFamily = _modelFamilies.videoModelCatalog.familyById.get(selectedFamilyId) || defaultFamily;
  var currentFamilyMode = v2vMode ? "v2v" : imageMode ? "i2v" : "t2v";
  var workflowFamily = (0, _videoWorkflows.getVideoWorkflowFamily)(selectedFamilyId);
  var selectedWorkflow = selectedWorkflowId ? (workflowFamily === null || workflowFamily === void 0 ? void 0 : workflowFamily.workflowById.get(selectedWorkflowId)) || null : null;
  var groupedConfiguration = (0, _groupedVideoModels.getGroupedVideoConfiguration)(selectedModel);
  var groupCopyKey = (0, _groupedVideoModels.getGroupedVideoCopyKey)(selectedFamilyId);
  var providerCopy = copy[groupCopyKey] || copy.seedance;
  var groupCopy = (0, _react.useMemo)(function () {
    return _objectSpread(_objectSpread(_objectSpread({}, copy.modelControls), providerCopy), {}, {
      fields: _objectSpread(_objectSpread({}, copy.modelControls.fields), providerCopy.fields),
      adjustments: _objectSpread(_objectSpread({}, copy.modelControls.adjustments), providerCopy.adjustments)
    });
  }, [copy, providerCopy]);
  var workflowControlState = groupedConfiguration && workflowFamily ? {
    kind: "menu",
    workflow: null
  } : (0, _videoWorkflows.getVideoWorkflowControlState)(workflowFamily, selectedModel);
  var workflowMediaDraftKey = selectedWorkflowId ? (0, _videoWorkflows.getVideoWorkflowDraftKey)(selectedFamilyId, selectedWorkflowId) : null;
  var selectedVariant = _modelFamilies.videoModelCatalog.variantById.get(selectedModel);
  var activeWorkflowMediaDraft = (0, _react.useMemo)(function () {
    return workflowMediaDraftKey ? (0, _videoWorkflows.projectVideoWorkflowMedia)(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model, selectedWorkflowId, workflowMediaDrafts[workflowMediaDraftKey] || EMPTY_WORKFLOW_MEDIA_DRAFT) : null;
  }, [selectedVariant, selectedWorkflowId, workflowMediaDraftKey, workflowMediaDrafts]);
  var selectedPickerEntry = _modelFamilies.videoModelMenuEntryByVariantId.get(selectedModel);
  var selectedTool = (0, _seedanceModels.getSeedanceToolConfiguration)(selectedModel);
  var selectedVeoTool = (0, _veoModels.getVeoToolConfiguration)(selectedModel);
  var veoContinuation = selectedVeoTool ? (0, _videoToolCapabilities.getContinuationConfig)(selectedModel) : null;
  var veoSources = (0, _react.useMemo)(function () {
    return selectedVeoTool ? (0, _videoToolCapabilities.getCompatibleContinuationSources)(selectedModel, history) : [];
  }, [selectedModel, selectedVeoTool, history]);
  var selectedVeoSource = veoSources.find(function (entry) {
    return entry.requestId === selectedVeoSourceId;
  }) || veoSources[0];
  var selectedPickerLabel = selectedTool ? seedanceToolLabel(selectedTool, copy, true) : selectedVeoTool ? copy.veo.toolNames[selectedVeoTool.key] : (selectedPickerEntry === null || selectedPickerEntry === void 0 ? void 0 : selectedPickerEntry.name) || selectedFamily.name;
  var getSelectionPlan = (0, _react.useCallback)(function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return (0, _groupedVideoParameters.planGroupedVideoSelection)(_objectSpread({
      familyId: selectedFamilyId,
      workflowId: selectedWorkflowId,
      currentWorkflowId: selectedWorkflowId,
      media: activeWorkflowMediaDraft,
      currentModelId: selectedModel,
      nativeResolution: selectedResolution,
      commonValues: _objectSpread(_objectSpread({}, modelParameterValues), {}, {
        aspectRatio: selectedAr,
        duration: selectedDuration,
        quality: selectedQuality
      })
    }, options));
  }, [selectedFamilyId, selectedWorkflowId, selectedModel, selectedResolution, selectedAr, selectedDuration, selectedQuality, modelParameterValues, activeWorkflowMediaDraft]);
  var describeSelectionAdjustments = (0, _react.useCallback)(function (adjustments) {
    var valueLabel = function valueLabel(key, value) {
      var _groupCopy$profiles$v;
      if (key === "duration") return (0, _videoModelCopy.getVideoDurationLabel)(value, groupCopy);
      if (key === "aspectRatio") return (0, _videoModelCopy.getVideoAspectRatioLabel)(value, groupCopy);
      if (key === "profile") return ((_groupCopy$profiles$v = groupCopy.profiles[value]) === null || _groupCopy$profiles$v === void 0 ? void 0 : _groupCopy$profiles$v.label) || value;
      if (key === "speed") return groupCopy.speeds[value] || value;
      if (key === "resolution" && value === "default") return groupCopy.defaultResolution;
      return String(value).toLowerCase() === "4k" ? "4K" : value;
    };
    return adjustments.map(function (_ref9) {
      var key = _ref9.key,
        to = _ref9.to;
      return groupCopy.adjustments[key].replace("{value}", valueLabel(key, to));
    }).join(" · ");
  }, [groupCopy]);
  var groupedVariantOptions = (0, _react.useMemo)(function () {
    return groupedConfiguration ? (0, _groupedVideoModels.getGroupedVideoVariantOptions)(selectedFamilyId, selectedWorkflowId, selectedModel).filter(function (field) {
      return field.key !== "resolution";
    }).map(function (field) {
      return _objectSpread(_objectSpread({}, field), {}, {
        options: field.options.map(function (option) {
          var _groupCopy$speedDescr;
          var plan = getSelectionPlan({
            changes: _defineProperty({}, field.key, option.value)
          });
          return _objectSpread(_objectSpread({}, option), {}, {
            description: (_groupCopy$speedDescr = groupCopy.speedDescriptions) === null || _groupCopy$speedDescr === void 0 ? void 0 : _groupCopy$speedDescr[option.value],
            disabled: !plan,
            adjustmentDescription: plan ? describeSelectionAdjustments(plan.adjustments) : ""
          });
        })
      });
    }) : [];
  }, [groupedConfiguration, selectedFamilyId, selectedWorkflowId, selectedModel, getSelectionPlan, describeSelectionAdjustments, groupCopy]);
  var groupedProfile = groupedVariantOptions.find(function (field) {
    return field.key === "profile";
  });
  var groupedSpeed = groupedVariantOptions.find(function (field) {
    return field.key === "speed";
  });
  var groupedResolution = (0, _react.useMemo)(function () {
    if (!groupedConfiguration) return null;
    var field = (0, _groupedVideoParameters.getGroupedVideoResolutionOptions)(selectedFamilyId, selectedWorkflowId, selectedModel, selectedResolution, {
      aspectRatio: selectedAr,
      duration: selectedDuration,
      quality: selectedQuality
    });
    return _objectSpread(_objectSpread(_objectSpread({}, field), {}, {
      key: "resolution"
    }, groupCopyKey === "seedance" && !field.value && selectedWorkflowId !== "extend_uploaded_video" ? {
      label: groupCopy.defaultResolution
    } : {}), {}, {
      options: field.options.map(function (option) {
        var adjustments = option.disabled ? [] : (0, _groupedVideoParameters.getGroupedVideoSelectionAdjustments)({
          currentModelId: selectedModel,
          nativeResolution: selectedResolution,
          currentWorkflowId: selectedWorkflowId,
          media: activeWorkflowMediaDraft,
          commonValues: _objectSpread(_objectSpread({}, modelParameterValues), {}, {
            aspectRatio: selectedAr,
            duration: selectedDuration,
            quality: selectedQuality
          }),
          selection: option,
          changes: {
            resolution: option.value
          }
        });
        return _objectSpread(_objectSpread({}, option), {}, {
          adjustmentDescription: describeSelectionAdjustments(adjustments)
        });
      })
    });
  }, [groupedConfiguration, selectedFamilyId, selectedWorkflowId, selectedModel, selectedResolution, selectedAr, selectedDuration, selectedQuality, modelParameterValues, describeSelectionAdjustments, groupCopy, groupCopyKey, activeWorkflowMediaDraft]);
  var commonOptions = (0, _react.useMemo)(function () {
    return (0, _videoModelParameters.getVideoCommonOptions)(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model, _objectSpread(_objectSpread({}, modelParameterValues), {}, {
      aspectRatio: selectedAr,
      duration: selectedDuration,
      resolution: selectedResolution,
      quality: selectedQuality
    }));
  }, [selectedVariant, modelParameterValues, selectedAr, selectedDuration, selectedResolution, selectedQuality]);
  var aspectRatioHelp = groupCopy[selectedVariant === null || selectedVariant === void 0 || (_selectedVariant$mode = selectedVariant.model.inputs) === null || _selectedVariant$mode === void 0 || (_selectedVariant$mode = _selectedVariant$mode.aspect_ratio) === null || _selectedVariant$mode === void 0 ? void 0 : _selectedVariant$mode.descriptionKey];
  var groupedModes = (0, _react.useMemo)(function () {
    return groupedConfiguration && workflowFamily ? [].concat(_toConsumableArray(workflowFamily.hasBase ? [{
      id: null
    }] : []), _toConsumableArray(workflowFamily.workflows)).map(function (workflow) {
      var _videoModelCatalog$va5;
      var plan = getSelectionPlan({
        workflowId: workflow.id
      });
      return {
        id: workflow.id,
        label: groupCopy.modes[workflow.id || "text"],
        description: (0, _videoModelCopy.getVideoModeDescription)((_videoModelCatalog$va5 = _modelFamilies.videoModelCatalog.variantById.get(plan === null || plan === void 0 ? void 0 : plan.selection.modelId)) === null || _videoModelCatalog$va5 === void 0 ? void 0 : _videoModelCatalog$va5.model, workflow.id, groupCopy),
        adjustmentDescription: plan ? describeSelectionAdjustments(plan.adjustments) : "",
        disabled: !plan
      };
    }) : [];
  }, [groupedConfiguration, workflowFamily, getSelectionPlan, describeSelectionAdjustments, groupCopy]);
  var promptDisabled = Boolean(selectedVeoTool && !(selectedVariant !== null && selectedVariant !== void 0 && (_selectedVariant$mode2 = selectedVariant.model.inputs) !== null && _selectedVariant$mode2 !== void 0 && _selectedVariant$mode2.prompt)) || (0, _modelCapabilities.shouldDisableVideoPrompt)(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model, currentFamilyMode);
  var workflowMediaSlots = (0, _react.useMemo)(function () {
    return selectedWorkflowId ? (0, _videoWorkflows.getVideoWorkflowMediaSlots)(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model, selectedWorkflowId) : [];
  }, [selectedVariant, selectedWorkflowId]);
  var currentModelCapabilities = (0, _modelCapabilities.getModelMediaCapabilities)(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model);
  var supplementalInputs = (0, _react.useMemo)(function () {
    var inputs = (0, _modelParameters.getSupplementalModelInputs)(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model);
    return groupedConfiguration ? inputs.filter(function (_ref0) {
      var key = _ref0.key;
      return key !== "omni_reference_task_type";
    }).map(function (_ref1) {
      var key = _ref1.key,
        schema = _ref1.schema;
      return {
        key: key,
        schema: _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, schema), groupCopy.fields[key]), schema.descriptionKey ? {
          description: groupCopy[schema.descriptionKey]
        } : {}), key === "generate_audio" && selectedWorkflowId === "edit_video" ? groupCopy.editAudio : {})
      };
    }) : inputs;
  }, [selectedVariant, groupedConfiguration, selectedWorkflowId, groupCopy]);
  var handleModelParameterChange = (0, _react.useCallback)(function (key, value) {
    setModelParameterValues(function (values) {
      return _objectSpread(_objectSpread({}, values), {}, _defineProperty({}, key, value));
    });
    if (selectedVariant !== null && selectedVariant !== void 0 && selectedVariant.model.commonParameterRules) {
      commonParameterValuesRef.current = _objectSpread(_objectSpread({}, commonParameterValuesRef.current), {}, _defineProperty({}, key, value));
      applyControlsForModel(selectedModel, imageMode, v2vMode);
    }
  }, [selectedVariant, selectedModel, imageMode, v2vMode, applyControlsForModel]);
  var applySelectedVariant = (0, _react.useCallback)(function (variant, mode, family) {
    var workflowId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var model = variant.model;
    var nextV2VMode = mode === "v2v";
    var nextImageMode = mode === "i2v";
    var previous = selectionRef.current;
    if (previous !== null && previous !== void 0 && previous.selectedFamilyId && previous !== null && previous !== void 0 && previous.selectedModel) {
      workflowVariantPreferencesRef.current.set(workflowContextKey(previous.selectedFamilyId, previous.selectedWorkflowId), previous.selectedModel);
    }
    workflowVariantPreferencesRef.current.set(workflowContextKey(family.id, workflowId), model.id);
    selectionRef.current = {
      selectedFamilyId: family.id,
      selectedModel: model.id,
      selectedWorkflowId: workflowId,
      imageMode: nextImageMode,
      v2vMode: nextV2VMode
    };
    setSelectedFamilyId(family.id);
    setSelectedModel(model.id);
    setSelectedWorkflowId(workflowId);
    setModelParameterValues(function (values) {
      return (0, _modelParameters.mergeModelParameterValues)(model, values);
    });
    setV2vMode(nextV2VMode);
    setImageMode(nextImageMode);
    applyControlsForModel(model.id, nextImageMode, nextV2VMode);
  }, [applyControlsForModel]);
  var reconcileReferencesForModel = (0, _react.useCallback)(function (model) {
    var capabilities = (0, _modelCapabilities.getModelMediaCapabilities)(model);
    setUploadedImageUrls(function (urls) {
      return urls.slice(0, capabilities.image.maxItems);
    });
    setUploadedVideoUrls(function (urls) {
      return urls.slice(0, capabilities.video.maxItems);
    });
    setUploadedAudioUrls(function (urls) {
      return urls.slice(0, capabilities.audio.maxItems);
    });
    if (!capabilities.image.separateLastItem) setUploadedEndImageUrl(null);
  }, []);
  var applyUserSelectedVariant = (0, _react.useCallback)(function (variant, mode, family) {
    var workflowId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    if (workflowId) {
      var _videoModelCatalog$va6;
      var draftKey = (0, _videoWorkflows.getVideoWorkflowDraftKey)(family.id, workflowId);
      var previous = selectionRef.current;
      var sourceWorkflowId = (previous === null || previous === void 0 ? void 0 : previous.selectedFamilyId) === family.id ? previous.selectedWorkflowId : null;
      var sourceDraftKey = sourceWorkflowId ? (0, _videoWorkflows.getVideoWorkflowDraftKey)(family.id, sourceWorkflowId) : null;
      var sourceModel = sourceDraftKey ? (_videoModelCatalog$va6 = _modelFamilies.videoModelCatalog.variantById.get(previous.selectedModel)) === null || _videoModelCatalog$va6 === void 0 ? void 0 : _videoModelCatalog$va6.model : null;
      var legacyMedia = mediaRef.current;
      setWorkflowMediaDrafts(function (drafts) {
        if (drafts[draftKey]) return drafts;
        // Seed a new mode from matching active slots; keep existing drafts intact.
        var media = sourceDraftKey ? (0, _videoWorkflows.projectVideoWorkflowMedia)(sourceModel, sourceWorkflowId, drafts[sourceDraftKey]) : legacyMedia;
        return _objectSpread(_objectSpread({}, drafts), {}, _defineProperty({}, draftKey, (0, _videoWorkflows.projectVideoWorkflowMedia)(variant.model, workflowId, media)));
      });
    } else {
      reconcileReferencesForModel(variant.model);
    }
    if ((0, _modelCapabilities.shouldDisableVideoPrompt)(variant.model, mode)) {
      setPrompt("");
    }
    applySelectedVariant(variant, mode, family, workflowId);
  }, [applySelectedVariant, reconcileReferencesForModel]);

  // ── Local integration: import a Storyboard hand-off ───────────────────────
  // Applies once per payload (guarded by createdAt) so React Strict Mode's
  // double-invoke can't duplicate it. Sets the prompt, an optional reference
  // image (image-to-video mode), and the aspect ratio.
  var handoffApplied = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    try {
      var handoff = (0, _storyboardHandoff.readStoryboardHandoff)("video");
      if (!handoff || handoffApplied.current === handoff.createdAt) return;
      handoffApplied.current = handoff.createdAt;
      if (handoff.combinedPrompt || handoff.projectName) {
        setPrompt(handoff.combinedPrompt || handoff.projectName);
      }
      var ref = handoff.firstFrameUrl || handoff.referenceImageUrl;
      if (ref) {
        setUploadedImageUrls([ref]);
        setImageMode(true);
      }
      if (handoff.aspectRatio === "9:16" || handoff.aspectRatio === "16:9") {
        setSelectedAr(handoff.aspectRatio);
      }
    } catch (err) {
      console.warn("Failed to apply Storyboard hand-off:", err);
    }
  }, []);

  // ── Local integration: apply pending Skills recipe (set by SkillsBrowser) ──
  var applyRecipe = (0, _react.useCallback)(function (skill) {
    var step0 = skill.steps && skill.steps[0];
    if (!step0) {
      if (skill.description) setPrompt(skill.description);
      return;
    }
    var modelId = step0.endpoint || step0.model;
    var variant = _modelFamilies.videoModelCatalog.variantById.get(modelId);
    var family = variant ? _modelFamilies.videoModelCatalog.familyByVariantId.get(modelId) : null;
    var wantsI2V = (variant === null || variant === void 0 ? void 0 : variant.mode) === "i2v" || step0.type === "i2v" || step0.type === "edit" || step0.references && step0.references.length > 0;
    if (variant && family) {
      applySelectedVariant(variant, variant.mode, family);
    } else if (wantsI2V) {
      setImageMode(true);
    }
    if (step0.aspectRatio) setSelectedAr(step0.aspectRatio);
    var flags = step0.flags || {};
    if (step0.audio || flags.nativeAudio) {
      setModelParameterValues(function (values) {
        return _objectSpread(_objectSpread({}, values), {}, {
          generate_audio: true
        });
      });
    }
    if (step0.duration) setSelectedDuration(Number(step0.duration));
    if (step0.resolution) setSelectedResolution(step0.resolution);
    var refs = step0.references || [];
    var _iterator2 = _createForOfIteratorHelper(refs),
      _step2;
    try {
      var _loop = function _loop() {
        var r = _step2.value;
        var isObj = r && _typeof(r) === "object";
        var rawUrl = isObj ? r.url : r;
        var role = isObj ? r.role : null;
        var url = rawUrl && !String(rawUrl).startsWith("{{") ? rawUrl : null;
        if (!url) return 1; // continue
        if (role === "first_frame") {
          setUploadedImageUrls([url]);
          setImageMode(true);
        } else if (role === "last_frame") {
          setUploadedEndImageUrl(url);
        } else if (role === "character_sheet") {
          (0, _characterStore.setCharacterSheet)("video", url);
        } else {
          setUploadedImageUrls(function (prev) {
            return [].concat(_toConsumableArray(prev), [url]);
          });
          setImageMode(true);
        }
      };
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        if (_loop()) continue;
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    var vals = {};
    (skill.inputs || []).forEach(function (i) {
      vals[i.name] = "";
    });
    setPrompt((0, _promptRecipes.fillTemplate)(step0.prompt || skill.description || "", vals));
  }, [applySelectedVariant]);
  (0, _react.useEffect)(function () {
    var pending = (0, _skillStore.getPendingRecipe)("video");
    if (!pending) return;
    var skill = _registry["default"].skills.find(function (s) {
      return s.slug === pending;
    });
    (0, _skillStore.clearPendingRecipe)("video");
    if (!skill) return;
    applyRecipe(skill);
  }, [applyRecipe]);

  // ── Persistence: Load ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        var restoredMode = data.v2vMode ? "v2v" : data.imageMode ? "i2v" : "t2v";
        var restoredModelId = data.selectedModel || defaultModel.id;
        var restoredWorkflowId = null;
        var restoredModel = defaultModel;
        var restoredFamilyId = defaultFamily.id;
        var restoredResolution = data.selectedResolution;
        if (data.selectedModel) {
          var _data$uploadedImageUr;
          var restored = (0, _videoWorkflows.resolvePersistedVideoWorkflowSelection)((0, _seedanceParameters.migrateSeedanceResolutionSelection)(data.selectedModel, data.selectedResolution), data.selectedWorkflowId || null, {
            hasEndFrame: Boolean(data.uploadedEndImageUrl || ((_data$uploadedImageUr = data.uploadedImageUrls) === null || _data$uploadedImageUr === void 0 ? void 0 : _data$uploadedImageUr[1]))
          });
          if (restored.family && restored.variant) {
            var _resolutionField$opti, _resolutionField$opti2;
            restoredModelId = restored.variant.model.id;
            restoredMode = restored.variant.mode;
            restoredWorkflowId = restored.workflowId;
            restoredModel = restored.variant.model;
            restoredFamilyId = restored.family.id;
            var resolutionField = (0, _groupedVideoParameters.getGroupedVideoResolutionOptions)(restoredFamilyId, restoredWorkflowId, restoredModelId, restoredResolution);
            // Restore the exact endpoint while respecting the workflow's allowed resolutions.
            restoredResolution = (_resolutionField$opti = (_resolutionField$opti2 = resolutionField.options.find(function (option) {
              return option.modelId === restoredModelId && option.value === resolutionField.value;
            })) === null || _resolutionField$opti2 === void 0 ? void 0 : _resolutionField$opti2.resolution) !== null && _resolutionField$opti !== void 0 ? _resolutionField$opti : restoredResolution;
            setSelectedModel(restoredModelId);
            setSelectedFamilyId(restored.family.id);
            setSelectedWorkflowId(restored.workflowId);
            setModelParameterValues((0, _modelParameters.mergeModelParameterValues)(restoredModel, data.modelParameterValues || {}));
          }
        }
        setImageMode(restoredMode === "i2v");
        setV2vMode(restoredMode === "v2v");
        if (data.selectedAr) setSelectedAr(data.selectedAr);
        if (data.selectedDuration) setSelectedDuration(data.selectedDuration);
        if (restoredResolution) setSelectedResolution(restoredResolution);
        if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
        if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
        if (data.selectedVeoSourceId) setSelectedVeoSourceId(data.selectedVeoSourceId);
        if (data.uploadedImageUrls) {
          setUploadedImageUrls(data.uploadedImageUrls);
        } else if (data.uploadedImageUrl) {
          setUploadedImageUrls([data.uploadedImageUrl]);
        }
        if (data.uploadedEndImageUrl) setUploadedEndImageUrl(data.uploadedEndImageUrl);
        if (data.uploadedVideoUrls) {
          setUploadedVideoUrls(data.uploadedVideoUrls);
        } else if (data.uploadedVideoUrl) {
          setUploadedVideoUrls([data.uploadedVideoUrl]);
        }
        if (data.uploadedAudioUrls) setUploadedAudioUrls(data.uploadedAudioUrls);
        var persistedDrafts = data.workflowMediaDrafts && _typeof(data.workflowMediaDrafts) === "object" ? (0, _videoWorkflows.migrateVideoWorkflowMediaDrafts)(data.workflowMediaDrafts) : {};
        if (restoredWorkflowId) {
          var draftKey = (0, _videoWorkflows.getVideoWorkflowDraftKey)(restoredFamilyId, restoredWorkflowId);
          if (!data.selectedWorkflowId || !persistedDrafts[draftKey]) {
            var _data$uploadedImageUr2;
            persistedDrafts[draftKey] = (0, _videoWorkflows.legacyVideoMediaToWorkflowDraft)(restoredModel, restoredWorkflowId, {
              imageUrls: data.uploadedImageUrls || (data.uploadedImageUrl ? [data.uploadedImageUrl] : []),
              endImageUrl: data.uploadedEndImageUrl || (restoredWorkflowId === "keyframes" ? (_data$uploadedImageUr2 = data.uploadedImageUrls) === null || _data$uploadedImageUr2 === void 0 ? void 0 : _data$uploadedImageUr2[1] : null),
              videoUrls: data.uploadedVideoUrls || (data.uploadedVideoUrl ? [data.uploadedVideoUrl] : []),
              audioUrls: data.uploadedAudioUrls || []
            });
          }
        }
        setWorkflowMediaDrafts(persistedDrafts);
        if (data.prompt) setPrompt(data.prompt);
        if (data.localHistory) setLocalHistory(data.localHistory);

        // Update control visibility based on restored model/mode
        commonParameterValuesRef.current = _objectSpread(_objectSpread({}, data.modelParameterValues), {}, {
          aspectRatio: data.selectedAr,
          duration: data.selectedDuration,
          resolution: restoredResolution,
          quality: data.selectedQuality
        });
        applyControlsForModel(restoredModelId, restoredMode === "i2v", restoredMode === "v2v");
      }
    } catch (err) {
      console.warn("Failed to load VideoStudio persistence:", err);
    } finally {
      hasRestored.current = true;
    }
  }, [applyControlsForModel, defaultModel.id]);

  // ── Local integration: apply template data from the landing page ───────────
  var templateApplied = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    var templateId = templateData !== null && templateData !== void 0 && templateData.sourceRepo && templateData !== null && templateData !== void 0 && templateData.slug ? "".concat(templateData.sourceRepo, "|").concat(templateData.slug) : templateData === null || templateData === void 0 ? void 0 : templateData.slug;
    if (!templateData || templateApplied.current === templateId) return;
    templateApplied.current = templateId;
    if (templateData.prompt) {
      setPrompt(templateData.prompt);
    }
    if (templateData.aspectRatio) {
      setSelectedAr(templateData.aspectRatio);
    }
    if (templateData.duration) {
      var d = parseInt(String(templateData.duration), 10);
      if (!isNaN(d)) setSelectedDuration(d);
    }
    if (templateData.model) {
      var variant = _modelFamilies.videoModelCatalog.variantById.get(templateData.model);
      var family = variant ? _modelFamilies.videoModelCatalog.familyByVariantId.get(templateData.model) : null;
      if (variant && family) {
        applySelectedVariant(variant, variant.mode, family);
      }
    }
  }, [templateData, applySelectedVariant]);

  // ── Persistence: Save ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      try {
        var state = {
          imageMode: imageMode,
          v2vMode: v2vMode,
          selectedWorkflowId: selectedWorkflowId,
          selectedModel: selectedModel,
          selectedFamilyId: selectedFamilyId,
          selectedAr: selectedAr,
          selectedDuration: selectedDuration,
          selectedResolution: selectedResolution,
          selectedQuality: selectedQuality,
          selectedEffect: selectedEffect,
          selectedVeoSourceId: selectedVeoSourceId,
          modelParameterValues: modelParameterValues,
          uploadedImageUrls: uploadedImageUrls,
          uploadedEndImageUrl: uploadedEndImageUrl,
          uploadedVideoUrls: uploadedVideoUrls,
          uploadedAudioUrls: uploadedAudioUrls,
          workflowMediaDrafts: workflowMediaDrafts,
          prompt: prompt,
          localHistory: localHistory
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save VideoStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return function () {
      return clearTimeout(timer);
    };
  }, [imageMode, v2vMode, selectedWorkflowId, selectedModel, selectedFamilyId, selectedAr, selectedDuration, selectedResolution, selectedQuality, selectedEffect, selectedVeoSourceId, modelParameterValues, uploadedImageUrls, uploadedEndImageUrl, uploadedVideoUrls, uploadedAudioUrls, workflowMediaDrafts, prompt, localHistory]);

  // ── Derived UI values ────────────────────────────────────────────────────

  var resolveMediaTarget = (0, _react.useCallback)(function (mediaType) {
    var selection = selectionRef.current;
    var family = _modelFamilies.videoModelCatalog.familyById.get(selection.selectedFamilyId);
    var currentVariant = _modelFamilies.videoModelCatalog.variantById.get(selection.selectedModel);
    var currentCapabilities = (0, _modelCapabilities.getModelMediaCapabilities)(currentVariant === null || currentVariant === void 0 ? void 0 : currentVariant.model);
    if (currentCapabilities[mediaType].maxItems > 0) {
      return {
        family: family,
        mode: selection.v2vMode ? "v2v" : selection.imageMode ? "i2v" : "t2v",
        variant: currentVariant
      };
    }

    // Families with explicit workflows never switch endpoints because a file
    // was uploaded. The user chooses the workflow first.
    if ((0, _videoWorkflows.getVideoWorkflowFamily)(family === null || family === void 0 ? void 0 : family.id)) return null;
    var targetMode = mediaType === "image" ? "i2v" : mediaType === "video" ? "v2v" : null;
    if (!targetMode || !(family !== null && family !== void 0 && family.supports[targetMode])) return null;
    var variant = (0, _modelFamilies.getFamilyVariant)(_modelFamilies.videoModelCatalog, family, targetMode, selection.selectedModel);
    return variant ? {
      family: family,
      mode: targetMode,
      variant: variant
    } : null;
  }, []);
  var applyReferenceUrls = (0, _react.useCallback)(function (mediaType, urls) {
    var target = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var selectionAtStart = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var validUrls = urls.filter(Boolean);
    if (validUrls.length === 0) return;
    if (selectionAtStart && !isSameSelection(selectionAtStart, selectionRef.current)) {
      _reactHotToast["default"].error(copy.errors.modelChangedDuringUpload);
      return;
    }
    var resolvedTarget = target || resolveMediaTarget(mediaType);
    if (!resolvedTarget) {
      var family = _modelFamilies.videoModelCatalog.familyById.get(selectionRef.current.selectedFamilyId);
      _reactHotToast["default"].error(copy.errors.modelDoesNotSupportReference.replace('{family}', family.name).replace('{mediaType}', mediaType));
      return;
    }
    var isCurrentVariant = resolvedTarget.variant.model.id === selectionRef.current.selectedModel;
    if (!isCurrentVariant) {
      reconcileReferencesForModel(resolvedTarget.variant.model);
      applySelectedVariant(resolvedTarget.variant, resolvedTarget.mode, resolvedTarget.family);
    }
    var activeWorkflowId = selectionRef.current.selectedWorkflowId;
    var workflowConfig = activeWorkflowId ? (0, _videoWorkflows.getVideoWorkflowMediaConfig)(resolvedTarget.variant.model, activeWorkflowId) : null;
    var limit = workflowConfig ? mediaType === "image" ? workflowConfig.imageLimit : mediaType === "video" ? workflowConfig.videoLimit : workflowConfig.audioLimit : (0, _modelCapabilities.getModelMediaCapabilities)(resolvedTarget.variant.model)[mediaType].maxItems;
    var setter = mediaType === "image" ? setUploadedImageUrls : mediaType === "video" ? setUploadedVideoUrls : setUploadedAudioUrls;
    setter(function (current) {
      return mergeReferenceUrls(current, validUrls, limit);
    });
  }, [applySelectedVariant, reconcileReferencesForModel, resolveMediaTarget]);
  var handleDrawReference = (0, _react.useCallback)(function (entry) {
    if (!selectedWorkflowId) {
      applyReferenceUrls("image", [entry === null || entry === void 0 ? void 0 : entry.url]);
      return;
    }
    var slot = workflowMediaSlots.find(function (item) {
      return item.mediaType === "image" && item.acceptDrop !== false && (0, _videoWorkflows.getVideoWorkflowSlotRemaining)(item, activeWorkflowMediaDraft) > 0;
    });
    if (!slot || !workflowMediaDraftKey || !(entry !== null && entry !== void 0 && entry.url)) {
      _reactHotToast["default"].error(copy.errors.sourceDoesNotAcceptImages);
      return;
    }
    setWorkflowMediaDrafts(function (drafts) {
      var draft = drafts[workflowMediaDraftKey] || {};
      var activeDraft = (0, _videoWorkflows.projectVideoWorkflowMedia)(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model, selectedWorkflowId, draft);
      return (0, _videoWorkflows.appendVideoWorkflowMedia)(drafts, workflowMediaDraftKey, slot, [entry.url], activeDraft);
    });
  }, [activeWorkflowMediaDraft, applyReferenceUrls, selectedWorkflowId, selectedVariant, workflowMediaDraftKey, workflowMediaSlots]);
  var uploadFiles = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref11 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(files, _ref10) {
      var label, maxBytes, setUploading, setProgress, selectedFiles, tooLarge, progress, results, failures, _t;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            label = _ref10.label, maxBytes = _ref10.maxBytes, setUploading = _ref10.setUploading, setProgress = _ref10.setProgress;
            selectedFiles = Array.from(files);
            tooLarge = selectedFiles.find(function (file) {
              return file.size > maxBytes;
            });
            if (!tooLarge) {
              _context2.n = 1;
              break;
            }
            alert(copy.errors.labelExceedsLimit.replace('{label}', label).replace('{limit}', Math.round(maxBytes / 1024 / 1024)));
            return _context2.a(2, []);
          case 1:
            setUploading(true);
            setProgress(0);
            _context2.p = 2;
            progress = new Array(selectedFiles.length).fill(0);
            _context2.n = 3;
            return Promise.allSettled(selectedFiles.map(function (file, index) {
              return (0, _muapi.uploadFile)(apiKey, file, function (value) {
                progress[index] = value;
                setProgress(Math.round(progress.reduce(function (sum, item) {
                  return sum + item;
                }, 0) / progress.length));
              });
            }));
          case 3:
            results = _context2.v;
            failures = results.flatMap(function (result, index) {
              var _result$reason;
              return result.status === "rejected" ? ["".concat(selectedFiles[index].name, ": ").concat(((_result$reason = result.reason) === null || _result$reason === void 0 ? void 0 : _result$reason.message) || result.reason)] : [];
            });
            if (failures.length > 0) {
              alert(copy.errors.labelUploadFailed.replace('{label}', label).replace('{message}', failures.join('\n')));
            }
            return _context2.a(2, results.flatMap(function (result) {
              return result.status === "fulfilled" ? [result.value] : [];
            }));
          case 4:
            _context2.p = 4;
            _t = _context2.v;
            console.error("[VideoStudio] ".concat(label, " upload failed:"), _t);
            alert(copy.errors.labelUploadFailed.replace('{label}', label).replace('{message}', _t.message));
            return _context2.a(2, []);
          case 5:
            _context2.p = 5;
            setUploading(false);
            setProgress(0);
            return _context2.f(5);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 4, 5, 6]]);
    }));
    return function (_x5, _x6) {
      return _ref11.apply(this, arguments);
    };
  }(), [apiKey, copy.errors.labelExceedsLimit, copy.errors.labelUploadFailed]);
  var uploadWorkflowSlotFiles = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref12 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(draftKey, slot, files) {
      var _videoModelCatalog$va7, _context$session;
      var context,
        selectionAtStart,
        targetModel,
        workflowIdAtStart,
        draftSession,
        currentDraft,
        activeDraft,
        remaining,
        selectedFiles,
        options,
        uploadKey,
        urls,
        appendUploads,
        _args3 = arguments;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            context = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : null;
            if (!(!draftKey || !slot || workflowUploadSlotRef.current)) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            selectionAtStart = (context === null || context === void 0 ? void 0 : context.selection) || _objectSpread({}, selectionRef.current);
            targetModel = (_videoModelCatalog$va7 = _modelFamilies.videoModelCatalog.variantById.get(selectionAtStart.selectedModel)) === null || _videoModelCatalog$va7 === void 0 ? void 0 : _videoModelCatalog$va7.model;
            workflowIdAtStart = selectionAtStart.selectedWorkflowId;
            draftSession = (_context$session = context === null || context === void 0 ? void 0 : context.session) !== null && _context$session !== void 0 ? _context$session : workflowDraftSessionRef.current;
            currentDraft = workflowMediaDraftsRef.current[draftKey] || {};
            activeDraft = (0, _videoWorkflows.projectVideoWorkflowMedia)(targetModel, workflowIdAtStart, currentDraft);
            remaining = (0, _videoWorkflows.getVideoWorkflowSlotRemaining)(slot, activeDraft);
            if (!(remaining === 0)) {
              _context3.n = 2;
              break;
            }
            return _context3.a(2);
          case 2:
            selectedFiles = Array.from(files).slice(0, remaining);
            if (!(selectedFiles.length === 0)) {
              _context3.n = 3;
              break;
            }
            return _context3.a(2);
          case 3:
            options = slot.mediaType === "image" ? {
              label: slot.label,
              maxBytes: 10 * 1024 * 1024,
              setUploading: setImageUploading,
              setProgress: setImageProgress
            } : slot.mediaType === "video" ? {
              label: slot.label,
              maxBytes: 50 * 1024 * 1024,
              setUploading: setVideoUploading,
              setProgress: setVideoProgress
            } : {
              label: slot.label,
              maxBytes: 50 * 1024 * 1024,
              setUploading: setAudioUploading,
              setProgress: setAudioProgress
            };
            uploadKey = "".concat(draftKey, ":").concat(slot.id);
            workflowUploadSlotRef.current = uploadKey;
            setWorkflowUploadSlotId(uploadKey);
            _context3.p = 4;
            _context3.n = 5;
            return uploadFiles(selectedFiles, options);
          case 5:
            urls = _context3.v;
            if (urls.length > 0 && draftSession === workflowDraftSessionRef.current) {
              appendUploads = function appendUploads(drafts) {
                return (0, _videoWorkflows.appendVideoWorkflowMedia)(drafts, draftKey, slot, urls, (0, _videoWorkflows.projectVideoWorkflowMedia)(targetModel, workflowIdAtStart, drafts[draftKey] || {}));
              }; // Keep upload capacity current without overwriting queued draft edits.
              workflowMediaDraftsRef.current = appendUploads(workflowMediaDraftsRef.current);
              setWorkflowMediaDrafts(appendUploads);
            }
          case 6:
            _context3.p = 6;
            workflowUploadSlotRef.current = null;
            setWorkflowUploadSlotId(null);
            return _context3.f(6);
          case 7:
            return _context3.a(2);
        }
      }, _callee3, null, [[4,, 6, 7]]);
    }));
    return function (_x7, _x8, _x9) {
      return _ref12.apply(this, arguments);
    };
  }(), [uploadFiles]);
  var uploadDroppedWorkflowFiles = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref13 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(files) {
      var _videoModelCatalog$va8;
      var dropSession, dropSelection, dropModel, remainingFiles, _iterator3, _step3, _loop2, _ret, _t2;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            if (workflowMediaDraftKey) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2);
          case 1:
            dropSession = workflowDraftSessionRef.current;
            dropSelection = _objectSpread({}, selectionRef.current);
            dropModel = (_videoModelCatalog$va8 = _modelFamilies.videoModelCatalog.variantById.get(dropSelection.selectedModel)) === null || _videoModelCatalog$va8 === void 0 ? void 0 : _videoModelCatalog$va8.model;
            remainingFiles = Array.from(files);
            _iterator3 = _createForOfIteratorHelper(workflowMediaSlots);
            _context5.p = 2;
            _loop2 = /*#__PURE__*/_regenerator().m(function _loop2() {
              var slot, matching, currentDraft, activeDraft, capacity, batch, _iterator4, _step4, file, index;
              return _regenerator().w(function (_context4) {
                while (1) switch (_context4.n) {
                  case 0:
                    slot = _step3.value;
                    if (!(dropSession !== workflowDraftSessionRef.current)) {
                      _context4.n = 1;
                      break;
                    }
                    return _context4.a(2, 0);
                  case 1:
                    if (!(slot.acceptDrop === false)) {
                      _context4.n = 2;
                      break;
                    }
                    return _context4.a(2, 1);
                  case 2:
                    matching = remainingFiles.filter(function (file) {
                      return file.type.startsWith("".concat(slot.mediaType, "/"));
                    });
                    if (!(matching.length === 0)) {
                      _context4.n = 3;
                      break;
                    }
                    return _context4.a(2, 1);
                  case 3:
                    currentDraft = workflowMediaDraftsRef.current[workflowMediaDraftKey] || {};
                    activeDraft = (0, _videoWorkflows.projectVideoWorkflowMedia)(dropModel, dropSelection.selectedWorkflowId, currentDraft);
                    capacity = (0, _videoWorkflows.getVideoWorkflowSlotRemaining)(slot, activeDraft);
                    if (!(capacity === 0)) {
                      _context4.n = 4;
                      break;
                    }
                    return _context4.a(2, 1);
                  case 4:
                    batch = matching.slice(0, capacity);
                    _context4.n = 5;
                    return uploadWorkflowSlotFiles(workflowMediaDraftKey, slot, batch, {
                      selection: dropSelection,
                      session: dropSession
                    });
                  case 5:
                    if (!(dropSession !== workflowDraftSessionRef.current)) {
                      _context4.n = 6;
                      break;
                    }
                    return _context4.a(2, 0);
                  case 6:
                    _iterator4 = _createForOfIteratorHelper(batch);
                    try {
                      for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                        file = _step4.value;
                        index = remainingFiles.indexOf(file);
                        if (index >= 0) remainingFiles.splice(index, 1);
                      }
                    } catch (err) {
                      _iterator4.e(err);
                    } finally {
                      _iterator4.f();
                    }
                  case 7:
                    return _context4.a(2);
                }
              }, _loop2);
            });
            _iterator3.s();
          case 3:
            if ((_step3 = _iterator3.n()).done) {
              _context5.n = 7;
              break;
            }
            return _context5.d(_regeneratorValues(_loop2()), 4);
          case 4:
            _ret = _context5.v;
            if (!(_ret === 0)) {
              _context5.n = 5;
              break;
            }
            return _context5.a(3, 7);
          case 5:
            if (!(_ret === 1)) {
              _context5.n = 6;
              break;
            }
            return _context5.a(3, 6);
          case 6:
            _context5.n = 3;
            break;
          case 7:
            _context5.n = 9;
            break;
          case 8:
            _context5.p = 8;
            _t2 = _context5.v;
            _iterator3.e(_t2);
          case 9:
            _context5.p = 9;
            _iterator3.f();
            return _context5.f(9);
          case 10:
            return _context5.a(2);
        }
      }, _callee4, null, [[2, 8, 9, 10]]);
    }));
    return function (_x0) {
      return _ref13.apply(this, arguments);
    };
  }(), [uploadWorkflowSlotFiles, workflowMediaDraftKey, workflowMediaSlots]);
  var removeWorkflowMedia = (0, _react.useCallback)(function (slotId, index) {
    if (!workflowMediaDraftKey) return;
    setWorkflowMediaDrafts(function (drafts) {
      return (0, _videoWorkflows.removeVideoWorkflowMedia)(drafts, workflowMediaDraftKey, slotId, index);
    });
  }, [workflowMediaDraftKey]);
  var uploadReferences = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref14 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(mediaType, files) {
      var selectionAtStart, target, family, capability, workflowConfig, currentUrls, configuredLimit, mainLimit, remaining, options, urls;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.n) {
          case 0:
            selectionAtStart = _objectSpread({}, selectionRef.current);
            target = resolveMediaTarget(mediaType);
            if (target) {
              _context6.n = 1;
              break;
            }
            family = _modelFamilies.videoModelCatalog.familyById.get(selectionRef.current.selectedFamilyId);
            _reactHotToast["default"].error("".concat(family.name, " does not support ").concat(mediaType, " references."));
            return _context6.a(2);
          case 1:
            capability = (0, _modelCapabilities.getModelMediaCapabilities)(target.variant.model)[mediaType];
            workflowConfig = selectionAtStart.selectedWorkflowId ? (0, _videoWorkflows.getVideoWorkflowMediaConfig)(target.variant.model, selectionAtStart.selectedWorkflowId) : null;
            currentUrls = mediaType === "image" ? mediaRef.current.imageUrls : mediaType === "video" ? mediaRef.current.videoUrls : mediaRef.current.audioUrls;
            configuredLimit = workflowConfig ? mediaType === "image" ? workflowConfig.imageLimit : mediaType === "video" ? workflowConfig.videoLimit : workflowConfig.audioLimit : capability.maxItems;
            mainLimit = mediaType === "image" && (capability.separateLastItem || workflowConfig !== null && workflowConfig !== void 0 && workflowConfig.separateEndImage) ? Math.min(configuredLimit, 1) : configuredLimit;
            remaining = Math.max(mainLimit - currentUrls.length, 0);
            if (!(remaining === 0)) {
              _context6.n = 2;
              break;
            }
            return _context6.a(2);
          case 2:
            options = mediaType === "image" ? {
              label: copy.media.image,
              maxBytes: 10 * 1024 * 1024,
              setUploading: setImageUploading,
              setProgress: setImageProgress
            } : mediaType === "video" ? {
              label: copy.media.video,
              maxBytes: 50 * 1024 * 1024,
              setUploading: setVideoUploading,
              setProgress: setVideoProgress
            } : {
              label: copy.media.audio,
              maxBytes: 50 * 1024 * 1024,
              setUploading: setAudioUploading,
              setProgress: setAudioProgress
            };
            _context6.n = 3;
            return uploadFiles(Array.from(files).slice(0, remaining), options);
          case 3:
            urls = _context6.v;
            applyReferenceUrls(mediaType, urls, target, selectionAtStart);
          case 4:
            return _context6.a(2);
        }
      }, _callee5);
    }));
    return function (_x1, _x10) {
      return _ref14.apply(this, arguments);
    };
  }(), [applyReferenceUrls, resolveMediaTarget, uploadFiles]);

  // ── Handle Dropped Files ────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (droppedFiles && droppedFiles.length > 0) {
      if (selectedWorkflowId) {
        if (workflowUploadSlotRef.current) {
          _reactHotToast["default"].error(copy.errors.waitForCurrentUpload);
          onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
          return;
        }
        void uploadDroppedWorkflowFiles(droppedFiles);
        onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
        return;
      }
      var imageFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith('image/');
      });
      var videoFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith('video/');
      });
      var audioFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith('audio/');
      });
      if (videoFiles.length > 0) {
        uploadReferences("video", videoFiles);
      } else if (imageFiles.length > 0) {
        uploadReferences("image", imageFiles);
      } else if (audioFiles.length > 0) {
        uploadReferences("audio", audioFiles);
      }
      onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
    }
  }, [droppedFiles, onFilesHandled, selectedWorkflowId, uploadDroppedWorkflowFiles, uploadReferences]);

  // Initialise controls for default model on mount
  (0, _react.useEffect)(function () {
    if (hasRestored.current) return;
    applyControlsForModel(defaultModel.id, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── close dropdown on outside click ─────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (!openDropdown) return;
    var handler = function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [openDropdown]);
  var handlePromptInput = function handlePromptInput(e) {
    setPrompt(e.target.value);
  };

  // ── image upload ─────────────────────────────────────────────────────────
  var handleImageFileChange = /*#__PURE__*/function () {
    var _ref15 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(e) {
      var files;
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.p = _context7.n) {
          case 0:
            files = Array.from(e.target.files);
            if (!(files.length === 0)) {
              _context7.n = 1;
              break;
            }
            return _context7.a(2);
          case 1:
            _context7.p = 1;
            _context7.n = 2;
            return uploadReferences("image", files);
          case 2:
            _context7.p = 2;
            if (imageFileInputRef.current) imageFileInputRef.current.value = "";
            return _context7.f(2);
          case 3:
            return _context7.a(2);
        }
      }, _callee6, null, [[1,, 2, 3]]);
    }));
    return function handleImageFileChange(_x11) {
      return _ref15.apply(this, arguments);
    };
  }();
  var removeImageAtIndex = function removeImageAtIndex(idx) {
    var nextUrls = uploadedImageUrls.filter(function (_, i) {
      return i !== idx;
    });
    setUploadedImageUrls(nextUrls);
    if (nextUrls.length === 0) {
      if (workflowFamily) return;
      if (isMotionControlSelection(selectedModel, v2vMode)) return;
      if (currentFamilyMode === "t2v" && currentModelCapabilities.image.maxItems > 0) return;
      var family = _modelFamilies.videoModelCatalog.familyById.get(selectedFamilyId);
      var target = (0, _modelFamilies.getFamilyVariant)(_modelFamilies.videoModelCatalog, family, "t2v", selectedModel);
      if (target) applyUserSelectedVariant(target, "t2v", family);
    }
  };

  // ── end-frame upload (FLF i2v models) ──────────────────────────────────────
  var handleEndImageFileChange = /*#__PURE__*/function () {
    var _ref16 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(e) {
      var file, selectionAtStart, _videoModelCatalog$va9, url, latestModel, _t3;
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.p = _context8.n) {
          case 0:
            file = e.target.files[0];
            if (file) {
              _context8.n = 1;
              break;
            }
            return _context8.a(2);
          case 1:
            if (!(file.size > 10 * 1024 * 1024)) {
              _context8.n = 2;
              break;
            }
            alert(copy.errors.imageExceeds10MB);
            return _context8.a(2);
          case 2:
            setEndImageUploading(true);
            setEndImageProgress(0);
            selectionAtStart = _objectSpread({}, selectionRef.current);
            _context8.p = 3;
            _context8.n = 4;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              setEndImageProgress(pct);
            });
          case 4:
            url = _context8.v;
            latestModel = (_videoModelCatalog$va9 = _modelFamilies.videoModelCatalog.variantById.get(selectionRef.current.selectedModel)) === null || _videoModelCatalog$va9 === void 0 ? void 0 : _videoModelCatalog$va9.model;
            if (isSameSelection(selectionAtStart, selectionRef.current) && (selectionRef.current.selectedWorkflowId === "keyframes" || (0, _modelCapabilities.getModelMediaCapabilities)(latestModel).image.separateLastItem)) {
              setUploadedEndImageUrl(url);
            }
            _context8.n = 6;
            break;
          case 5:
            _context8.p = 5;
            _t3 = _context8.v;
            alert("End frame upload failed: ".concat(_t3.message));
          case 6:
            _context8.p = 6;
            setEndImageUploading(false);
            setEndImageProgress(0);
            if (endImageFileInputRef.current) endImageFileInputRef.current.value = "";
            return _context8.f(6);
          case 7:
            return _context8.a(2);
        }
      }, _callee7, null, [[3, 5, 6, 7]]);
    }));
    return function handleEndImageFileChange(_x12) {
      return _ref16.apply(this, arguments);
    };
  }();
  var clearEndImage = function clearEndImage() {
    return setUploadedEndImageUrl(null);
  };

  // ── video upload ─────────────────────────────────────────────────────────
  var handleVideoFileChange = /*#__PURE__*/function () {
    var _ref17 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(e) {
      var files;
      return _regenerator().w(function (_context9) {
        while (1) switch (_context9.p = _context9.n) {
          case 0:
            files = Array.from(e.target.files);
            if (!(files.length === 0)) {
              _context9.n = 1;
              break;
            }
            return _context9.a(2);
          case 1:
            _context9.p = 1;
            _context9.n = 2;
            return uploadReferences("video", files);
          case 2:
            _context9.p = 2;
            if (videoFileInputRef.current) videoFileInputRef.current.value = "";
            return _context9.f(2);
          case 3:
            return _context9.a(2);
        }
      }, _callee8, null, [[1,, 2, 3]]);
    }));
    return function handleVideoFileChange(_x13) {
      return _ref17.apply(this, arguments);
    };
  }();
  var removeVideoAtIndex = function removeVideoAtIndex(index) {
    var nextUrls = uploadedVideoUrls.filter(function (_, itemIndex) {
      return itemIndex !== index;
    });
    setUploadedVideoUrls(nextUrls);
    if (workflowFamily) return;
    if (nextUrls.length > 0 || currentFamilyMode !== "v2v") return;
    var family = _modelFamilies.videoModelCatalog.familyById.get(selectedFamilyId);
    var target = (0, _modelFamilies.getFamilyVariant)(_modelFamilies.videoModelCatalog, family, "t2v", selectedModel);
    if (target) applyUserSelectedVariant(target, "t2v", family);
  };
  var handleAudioFileChange = /*#__PURE__*/function () {
    var _ref18 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(e) {
      var files;
      return _regenerator().w(function (_context0) {
        while (1) switch (_context0.p = _context0.n) {
          case 0:
            files = Array.from(e.target.files);
            if (!(files.length === 0)) {
              _context0.n = 1;
              break;
            }
            return _context0.a(2);
          case 1:
            _context0.p = 1;
            _context0.n = 2;
            return uploadReferences("audio", files);
          case 2:
            _context0.p = 2;
            if (audioFileInputRef.current) audioFileInputRef.current.value = "";
            return _context0.f(2);
          case 3:
            return _context0.a(2);
        }
      }, _callee9, null, [[1,, 2, 3]]);
    }));
    return function handleAudioFileChange(_x14) {
      return _ref18.apply(this, arguments);
    };
  }();
  var removeAudioAtIndex = function removeAudioAtIndex(index) {
    setUploadedAudioUrls(function (urls) {
      return urls.filter(function (_, itemIndex) {
        return itemIndex !== index;
      });
    });
  };
  var handleGroupedSelection = (0, _react.useCallback)(function (plan, family, workflowId) {
    if (!plan) {
      _reactHotToast["default"].error(groupCopy.incompatible);
      return;
    }
    var selection = plan.selection,
      adjustments = plan.adjustments;
    var target = _modelFamilies.videoModelCatalog.variantById.get(selection.modelId);
    if (selection.resolution !== undefined) {
      commonParameterValuesRef.current = _objectSpread(_objectSpread({}, commonParameterValuesRef.current), {}, {
        resolution: selection.resolution
      });
    }
    applyUserSelectedVariant(target, target.mode, family, workflowId);
    if (selection.resolution !== undefined) setSelectedResolution(selection.resolution);
    if (adjustments.length) {
      (0, _reactHotToast["default"])(describeSelectionAdjustments(adjustments));
    }
  }, [applyUserSelectedVariant, describeSelectionAdjustments, groupCopy]);

  // ── model selection from dropdown ─────────────────────────────────────────
  var handleModelSelect = (0, _react.useCallback)(function (pickerEntry) {
    var category = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "all";
    var family = pickerEntry.family,
      variantsByMode = pickerEntry.variantsByMode,
      defaultVariant = pickerEntry.defaultVariant;
    if (pickerEntry.groupedVideo) {
      // Reopening the model picker must not reset a configured version.
      if (family.id === selectedFamilyId && (category === "all" || category === currentFamilyMode && (category !== "t2v" || !selectedWorkflowId)) && pickerEntry.variantIds.has(selectedModel)) return;
      var candidate = category !== "all" ? variantsByMode[category] : variantsByMode[currentFamilyMode] || defaultVariant;
      if (!candidate) return;
      var targetFamily = (0, _videoWorkflows.getVideoWorkflowFamily)(family.id);
      var workflowId = category === "all" && selectedWorkflowId && targetFamily !== null && targetFamily !== void 0 && targetFamily.workflowById.has(selectedWorkflowId) ? selectedWorkflowId : (0, _videoWorkflows.inferVideoWorkflowId)(family.id, candidate.model.id);
      var remembered = workflowVariantPreferencesRef.current.get(workflowContextKey(family.id, workflowId));
      var plan = getSelectionPlan({
        familyId: family.id,
        workflowId: workflowId,
        currentModelId: family.id === selectedFamilyId ? selectedModel : remembered,
        nativeResolution: family.id === selectedFamilyId ? selectedResolution : undefined
      });
      handleGroupedSelection(plan, family, workflowId);
      return;
    }
    var target = category !== "all" ? category === "v2v" && (0, _veoModels.getVeoToolConfiguration)(defaultVariant.model.id) ? defaultVariant : variantsByMode[category] : variantsByMode[currentFamilyMode] || defaultVariant;
    if (!target) return;
    var targetWorkflowFamily = (0, _videoWorkflows.getVideoWorkflowFamily)(family.id);
    if (targetWorkflowFamily) {
      var _workflowId = targetWorkflowFamily.base.variantIds.has(target.model.id) || targetWorkflowFamily.unmanagedVariantIds.has(target.model.id) ? null : (0, _videoWorkflows.inferVideoWorkflowId)(family.id, target.model.id, {
        preferredWorkflowId: family.id === selectedFamilyId ? selectedWorkflowId : null
      });
      applyUserSelectedVariant(target, target.mode, family, _workflowId);
      return;
    }
    applyUserSelectedVariant(target, target.mode, family);
  }, [applyUserSelectedVariant, handleGroupedSelection, getSelectionPlan, currentFamilyMode, selectedFamilyId, selectedWorkflowId, selectedModel, selectedResolution]);
  var handleWorkflowSelect = (0, _react.useCallback)(function (workflowId) {
    if ((0, _groupedVideoModels.getGroupedVideoConfiguration)(selectedModel)) {
      handleGroupedSelection(getSelectionPlan({
        workflowId: workflowId
      }), selectedFamily, workflowId);
      return;
    }
    var preferred = workflowVariantPreferencesRef.current.get(workflowContextKey(selectedFamilyId, workflowId));
    var target = (0, _videoWorkflows.resolveVideoWorkflowVariant)(selectedFamilyId, workflowId, selectedModel, preferred);
    if (target) {
      applyUserSelectedVariant(target, target.mode, selectedFamily, workflowId);
    }
  }, [applyUserSelectedVariant, selectedFamily, selectedFamilyId, selectedModel, getSelectionPlan, handleGroupedSelection]);
  var clearWorkflow = (0, _react.useCallback)(function () {
    if ((0, _groupedVideoModels.getGroupedVideoConfiguration)(selectedModel)) {
      handleGroupedSelection(getSelectionPlan({
        workflowId: null
      }), selectedFamily, null);
      return;
    }
    var preferred = workflowVariantPreferencesRef.current.get(workflowContextKey(selectedFamilyId, null));
    var target = (0, _videoWorkflows.resolveVideoBaseVariant)(selectedFamilyId, selectedModel, preferred);
    if (target) applyUserSelectedVariant(target, target.mode, selectedFamily, null);
  }, [applyUserSelectedVariant, selectedFamily, selectedFamilyId, selectedModel, getSelectionPlan, handleGroupedSelection]);
  var handleGroupedOptionChange = (0, _react.useCallback)(function (key, value) {
    handleGroupedSelection(getSelectionPlan({
      changes: _defineProperty({}, key, value)
    }), selectedFamily, selectedWorkflowId);
  }, [selectedFamily, selectedWorkflowId, getSelectionPlan, handleGroupedSelection]);
  var handleGroupedResolutionChange = (0, _react.useCallback)(function (option) {
    if (option.disabled) return;
    var adjustments = (0, _groupedVideoParameters.getGroupedVideoSelectionAdjustments)({
      currentModelId: selectedModel,
      currentWorkflowId: selectedWorkflowId,
      media: activeWorkflowMediaDraft,
      nativeResolution: selectedResolution,
      commonValues: commonParameterValuesRef.current,
      selection: option,
      changes: {
        resolution: option.value
      }
    });
    handleGroupedSelection({
      selection: option,
      adjustments: adjustments
    }, selectedFamily, selectedWorkflowId);
    setOpenDropdown(null);
  }, [handleGroupedSelection, selectedFamily, selectedWorkflowId, selectedModel, selectedResolution, activeWorkflowMediaDraft]);

  // ── add to local history ──────────────────────────────────────────────────
  var addToLocalHistory = (0, _react.useCallback)(function (entry) {
    setLocalHistory(function (prev) {
      return [entry].concat(_toConsumableArray(prev)).slice(0, 30);
    });
    setActiveHistoryIdx(0);
  }, []);

  // ── show result in canvas ─────────────────────────────────────────────────
  var showVideoInCanvas = (0, _react.useCallback)(function (url, model) {
    setCanvasUrl(url);
    setCanvasModel(model);
    setShowCanvas(true);
  }, []);

  // ── generate ──────────────────────────────────────────────────────────────
  var handleGenerate = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0() {
    var _currentModel$inputs;
    var currentModel, grouped, activeParameterValues, generationParameterValues, commonParams, groupedHistorySettings, isExtendMode, capabilities, requestSource, trimmedPrompt, workflowMedia, validation, requiresImage, res, referenceParams, _res, v2vParams, genId, entry, _res2, i2vParams, aspectRatios, durations, resolutions, _genId, _entry, _res3, params, _durations, _resolutions, _genId2, _entry2, errMsg, _t4;
    return _regenerator().w(function (_context1) {
      while (1) switch (_context1.p = _context1.n) {
        case 0:
          if (!(mediaUploading || workflowUploadSlotRef.current)) {
            _context1.n = 1;
            break;
          }
          _reactHotToast["default"].error(copy.errors.waitForCurrentUpload);
          return _context1.a(2);
        case 1:
          currentModel = getCurrentModel();
          grouped = (0, _groupedVideoModels.getGroupedVideoConfiguration)(selectedModel);
          activeParameterValues = (0, _modelParameters.createModelParameterValues)(currentModel, modelParameterValues);
          generationParameterValues = grouped && (_currentModel$inputs = currentModel.inputs) !== null && _currentModel$inputs !== void 0 && _currentModel$inputs.omni_reference_task_type ? _objectSpread(_objectSpread({}, activeParameterValues), {}, {
            omni_reference_task_type: "auto"
          }) : activeParameterValues;
          commonParams = grouped ? (0, _videoModelParameters.buildVideoCommonPayload)(currentModel, _objectSpread(_objectSpread({}, generationParameterValues), {}, {
            aspectRatio: selectedAr,
            duration: selectedDuration,
            resolution: selectedResolution,
            quality: selectedQuality
          })) : {};
          groupedHistorySettings = grouped ? _objectSpread(_objectSpread(_objectSpread({}, currentModel.fixedParameters), commonParams), {}, {
            workflowId: selectedWorkflowId,
            modelParameterValues: _objectSpread({}, generationParameterValues)
          }) : {};
          isExtendMode = currentModel === null || currentModel === void 0 ? void 0 : currentModel.requiresRequestId;
          capabilities = (0, _modelCapabilities.getModelMediaCapabilities)(currentModel);
          requestSource = selectedVeoTool ? selectedVeoSource : generationSources[selectedFamily.id];
          trimmedPrompt = promptDisabled ? "" : prompt.trim();
          workflowMedia = selectedWorkflowId ? activeWorkflowMediaDraft || {} : {
            imageUrls: uploadedImageUrls,
            endImageUrl: uploadedEndImageUrl,
            videoUrls: uploadedVideoUrls,
            audioUrls: uploadedAudioUrls
          };
          if (!(!selectedWorkflowId && uploadedVideoUrls.length > 0 && capabilities.video.maxItems === 0)) {
            _context1.n = 2;
            break;
          }
          alert("".concat(selectedFamily.name, " does not support video references."));
          return _context1.a(2);
        case 2:
          if (!(!selectedWorkflowId && uploadedImageUrls.length > 0 && capabilities.image.maxItems === 0)) {
            _context1.n = 3;
            break;
          }
          alert("".concat(selectedFamily.name, " does not support image references."));
          return _context1.a(2);
        case 3:
          if (!(!selectedWorkflowId && uploadedAudioUrls.length > 0 && capabilities.audio.maxItems === 0)) {
            _context1.n = 4;
            break;
          }
          alert("".concat(selectedFamily.name, " does not support audio references."));
          return _context1.a(2);
        case 4:
          if (!((currentModel !== null && currentModel !== void 0 && currentModel.promptRequired || veoContinuation !== null && veoContinuation !== void 0 && veoContinuation.promptRequired) && !trimmedPrompt)) {
            _context1.n = 5;
            break;
          }
          alert(copy.errors.noPromptForModel);
          return _context1.a(2);
        case 5:
          if (!selectedWorkflowId) {
            _context1.n = 7;
            break;
          }
          validation = (0, _videoWorkflows.validateVideoWorkflowMedia)(selectedWorkflowId, workflowMedia, currentModel);
          if (validation.valid) {
            _context1.n = 6;
            break;
          }
          alert(validation.message);
          return _context1.a(2);
        case 6:
          _context1.n = 15;
          break;
        case 7:
          if (!v2vMode) {
            _context1.n = 10;
            break;
          }
          if (uploadedVideoUrl) {
            _context1.n = 8;
            break;
          }
          alert(copy.errors.uploadVideoFirst);
          return _context1.a(2);
        case 8:
          if (!(currentModel !== null && currentModel !== void 0 && currentModel.imageField && !(currentModel !== null && currentModel !== void 0 && currentModel.imageOptional) && !uploadedImageUrl)) {
            _context1.n = 9;
            break;
          }
          alert(copy.errors.uploadReferenceImageForMotion);
          return _context1.a(2);
        case 9:
          _context1.n = 15;
          break;
        case 10:
          if (!isExtendMode) {
            _context1.n = 12;
            break;
          }
          if (!(!(requestSource !== null && requestSource !== void 0 && requestSource.requestId) || selectedFamily.id === "seedance-2" && !(0, _videoToolCapabilities.isContinuationSourceModel)(currentModel, requestSource.modelId))) {
            _context1.n = 11;
            break;
          }
          alert(copy.errors.noContinuationSource.replace("{family}", selectedFamily.name));
          return _context1.a(2);
        case 11:
          _context1.n = 15;
          break;
        case 12:
          if (!imageMode) {
            _context1.n = 14;
            break;
          }
          requiresImage = (currentModel === null || currentModel === void 0 ? void 0 : currentModel.imageField) && !(currentModel !== null && currentModel !== void 0 && currentModel.imageOptional);
          if (!(requiresImage && uploadedImageUrls.length === 0)) {
            _context1.n = 13;
            break;
          }
          alert(copy.errors.uploadAtLeastOneReferenceImage);
          return _context1.a(2);
        case 13:
          _context1.n = 15;
          break;
        case 14:
          if (trimmedPrompt) {
            _context1.n = 15;
            break;
          }
          alert(copy.errors.enterPromptToGenerate);
          return _context1.a(2);
        case 15:
          onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
          setGenerating(true);
          setGenerateError(null);
          _context1.p = 16;
          referenceParams = selectedWorkflowId ? (0, _videoWorkflows.buildVideoWorkflowMediaParams)(currentModel, selectedWorkflowId, workflowMedia) : (0, _modelCapabilities.buildReferenceParams)(currentModel, workflowMedia);
          if (!v2vMode) {
            _context1.n = 19;
            break;
          }
          // V2V: dedicated processV2V handles single-input tools (e.g. watermark
          // remover) and motion-control models (which take video + image + prompt)
          v2vParams = _objectSpread(_objectSpread(_objectSpread({
            model: selectedModel
          }, (0, _modelParameters.buildSupplementalInputPayload)(currentModel, generationParameterValues)), commonParams), referenceParams);
          if (currentModel !== null && currentModel !== void 0 && currentModel.hasPrompt && trimmedPrompt) {
            v2vParams.prompt = trimmedPrompt;
          }
          _context1.n = 17;
          return (0, _muapi.processV2V)(apiKey, v2vParams);
        case 17:
          res = _context1.v;
          if ((_res = res) !== null && _res !== void 0 && _res.url) {
            _context1.n = 18;
            break;
          }
          throw new Error(copy.errors.noVideoUrlReturned);
        case 18:
          genId = res.request_id || res.id || Date.now().toString();
          entry = _objectSpread(_objectSpread({
            id: genId,
            url: res.url,
            prompt: currentModel !== null && currentModel !== void 0 && currentModel.hasPrompt ? trimmedPrompt : "",
            model: selectedModel
          }, groupedHistorySettings), {}, {
            timestamp: new Date().toISOString()
          });
          addToLocalHistory(entry);
          showVideoInCanvas(res.url, selectedModel);
          if (onGenerationComplete) onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: currentModel !== null && currentModel !== void 0 && currentModel.hasPrompt ? trimmedPrompt : "",
            type: "video"
          });
          _context1.n = 25;
          break;
        case 19:
          if (!imageMode) {
            _context1.n = 22;
            break;
          }
          i2vParams = _objectSpread(_objectSpread(_objectSpread({
            model: selectedModel
          }, (0, _modelParameters.buildSupplementalInputPayload)(currentModel, generationParameterValues)), commonParams), referenceParams);
          if (trimmedPrompt) i2vParams.prompt = trimmedPrompt;
          aspectRatios = (0, _models.getAspectRatiosForI2VModel)(selectedModel);
          if (!grouped && aspectRatios.length > 0) i2vParams.aspect_ratio = selectedAr;
          durations = (0, _models.getDurationsForI2VModel)(selectedModel);
          if (!grouped && durations.length > 0) i2vParams.duration = selectedDuration;
          resolutions = (0, _models.getResolutionsForI2VModel)(selectedModel);
          if (!grouped && resolutions.length > 0) i2vParams.resolution = selectedResolution;
          if (!grouped && selectedQuality) i2vParams.quality = selectedQuality;
          if (showEffect && selectedEffect) i2vParams.name = selectedEffect;
          _context1.n = 20;
          return (0, _muapi.generateI2V)(apiKey, i2vParams);
        case 20:
          res = _context1.v;
          if ((_res2 = res) !== null && _res2 !== void 0 && _res2.url) {
            _context1.n = 21;
            break;
          }
          throw new Error(copy.errors.noVideoUrlReturned);
        case 21:
          _genId = res.request_id || res.id || Date.now().toString();
          setGenerationSources(function (sources) {
            return (0, _modelCapabilities.recordGenerationSource)(sources, selectedFamily.id, _genId, selectedModel);
          });
          _entry = _objectSpread(_objectSpread(_objectSpread({
            id: _genId,
            url: res.url,
            prompt: trimmedPrompt,
            model: selectedModel
          }, !grouped ? _objectSpread(_objectSpread({}, aspectRatios.length > 0 ? {
            aspect_ratio: selectedAr
          } : {}), {}, {
            duration: selectedDuration
          }) : {}), groupedHistorySettings), {}, {
            timestamp: new Date().toISOString()
          });
          addToLocalHistory(_entry);
          showVideoInCanvas(res.url, selectedModel);
          if (onGenerationComplete) onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video"
          });
          _context1.n = 25;
          break;
        case 22:
          // T2V (including extend mode)
          params = _objectSpread(_objectSpread(_objectSpread({
            model: selectedModel
          }, (0, _modelParameters.buildSupplementalInputPayload)(currentModel, generationParameterValues)), commonParams), referenceParams);
          if (trimmedPrompt) params.prompt = trimmedPrompt;
          if (isExtendMode) {
            params.request_id = requestSource.requestId;
          } else if (!grouped) {
            params.aspect_ratio = selectedAr;
          }
          _durations = (0, _models.getDurationsForModel)(selectedModel);
          if (!grouped && _durations.length > 0) params.duration = selectedDuration;
          _resolutions = (0, _models.getResolutionsForVideoModel)(selectedModel);
          if (!grouped && _resolutions.length > 0) params.resolution = selectedResolution;
          if (!grouped && !selectedVeoTool && selectedQuality) params.quality = selectedQuality;
          _context1.n = 23;
          return (0, _muapi.generateVideo)(apiKey, params);
        case 23:
          res = _context1.v;
          if ((_res3 = res) !== null && _res3 !== void 0 && _res3.url) {
            _context1.n = 24;
            break;
          }
          throw new Error(copy.errors.noVideoUrlReturned);
        case 24:
          _genId2 = res.request_id || res.id || Date.now().toString();
          setGenerationSources(function (sources) {
            return (0, _modelCapabilities.recordGenerationSource)(sources, selectedFamily.id, _genId2, selectedModel);
          });
          _entry2 = _objectSpread(_objectSpread(_objectSpread({
            id: _genId2,
            url: res.url,
            prompt: trimmedPrompt,
            model: selectedModel
          }, !grouped && !selectedVeoTool ? {
            aspect_ratio: selectedAr,
            duration: selectedDuration
          } : {}), groupedHistorySettings), {}, {
            timestamp: new Date().toISOString()
          });
          addToLocalHistory(_entry2);
          showVideoInCanvas(res.url, selectedModel);
          if (onGenerationComplete) onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video"
          });
        case 25:
          _context1.n = 27;
          break;
        case 26:
          _context1.p = 26;
          _t4 = _context1.v;
          console.error("[VideoStudio]", _t4);
          errMsg = (0, _formatError.formatErrorMessage)(_t4, copy.errors.videoGenerationFailed);
          if (onGenerationError) onGenerationError(errMsg);else _reactHotToast["default"].error(errMsg);
        case 27:
          _context1.p = 27;
          setGenerating(false);
          onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
          return _context1.f(27);
        case 28:
          return _context1.a(2);
      }
    }, _callee0, null, [[16, 26, 27, 28]]);
  })), [apiKey, copy, prompt, promptDisabled, v2vMode, imageMode, selectedWorkflowId, selectedModel, selectedFamily, selectedAr, selectedDuration, selectedResolution, selectedQuality, selectedEffect, modelParameterValues, showEffect, uploadedImageUrls, uploadedEndImageUrl, uploadedVideoUrls, uploadedAudioUrls, activeWorkflowMediaDraft, generationSources, selectedVeoTool, selectedVeoSource, veoContinuation, mediaUploading, getCurrentModel, addToLocalHistory, showVideoInCanvas, onGenerationComplete, onGenerationEnd, onGenerationError, onGenerationStart]);

  // ── reset to prompt bar ───────────────────────────────────────────────────
  var resetToPromptBar = (0, _react.useCallback)(function () {
    setShowCanvas(false);
  }, []);
  var handleNewPrompt = (0, _react.useCallback)(function () {
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrls([]);
    setUploadedEndImageUrl(null);
    setUploadedVideoUrls([]);
    setUploadedAudioUrls([]);
    workflowDraftSessionRef.current += 1;
    setWorkflowMediaDrafts({});
    var first = _models.t2vModels[0];
    var family = _modelFamilies.videoModelCatalog.familyByVariantId.get(first.id);
    var variant = _modelFamilies.videoModelCatalog.variantById.get(first.id);
    applyUserSelectedVariant(variant, "t2v", family);
    setTimeout(function () {
      var _textareaRef$current;
      return (_textareaRef$current = textareaRef.current) === null || _textareaRef$current === void 0 ? void 0 : _textareaRef$current.focus();
    }, 50);
  }, [applyUserSelectedVariant, resetToPromptBar]);
  var handleExtend = (0, _react.useCallback)(function (requestId, sourceModelId) {
    if (!requestId) return;
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrls([]);
    setUploadedEndImageUrl(null);
    setUploadedVideoUrls([]);
    setUploadedAudioUrls([]);
    var family = _modelFamilies.videoModelCatalog.familyById.get("seedance-2");
    var target = _modelFamilies.videoModelCatalog.variantById.get("seedance-2-extend");
    setGenerationSources(function (sources) {
      return (0, _modelCapabilities.recordGenerationSource)(sources, family.id, requestId, sourceModelId);
    });
    applyUserSelectedVariant(target, "t2v", family);
    setTimeout(function () {
      var _textareaRef$current2;
      return (_textareaRef$current2 = textareaRef.current) === null || _textareaRef$current2 === void 0 ? void 0 : _textareaRef$current2.focus();
    }, 50);
  }, [applyUserSelectedVariant, resetToPromptBar]);

  // ── derived UI values ────────────────────────────────────────────────────
  var currentModelObj = selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.model;
  var isExtendMode = currentModelObj === null || currentModelObj === void 0 ? void 0 : currentModelObj.requiresRequestId;
  var continuationSource = generationSources[selectedFamily.id];
  var hasContinuationSource = (continuationSource === null || continuationSource === void 0 ? void 0 : continuationSource.requestId) && (!selectedTool || (0, _videoToolCapabilities.isContinuationSourceModel)(currentModelObj, continuationSource.modelId));
  var isMotionControlModel = isMotionControlSelection(selectedModel, v2vMode);
  var workflowMediaConfig = selectedWorkflowId ? (0, _videoWorkflows.getVideoWorkflowMediaConfig)(currentModelObj, selectedWorkflowId) : null;
  var canUploadImageReference = workflowMediaConfig ? workflowMediaConfig.imageLimit > 0 : workflowFamily ? currentModelCapabilities.image.maxItems > 0 : currentModelCapabilities.image.maxItems > 0 || !v2vMode && selectedFamily.supports.i2v;
  var imageTargetVariant = workflowFamily ? selectedVariant : currentModelCapabilities.image.maxItems > 0 ? selectedVariant : (0, _modelFamilies.getFamilyVariant)(_modelFamilies.videoModelCatalog, selectedFamily, "i2v", selectedModel);
  var imageUploadCapability = (0, _modelCapabilities.getModelMediaCapabilities)(imageTargetVariant === null || imageTargetVariant === void 0 ? void 0 : imageTargetVariant.model).image;
  var imageUploadLimit = workflowMediaConfig ? workflowMediaConfig.imageLimit : imageUploadCapability.separateLastItem ? 1 : imageUploadCapability.maxItems;
  var videoTargetVariant = workflowFamily ? selectedVariant : currentModelCapabilities.video.maxItems > 0 ? selectedVariant : (0, _modelFamilies.getFamilyVariant)(_modelFamilies.videoModelCatalog, selectedFamily, "v2v", selectedModel);
  var videoUploadLimit = workflowMediaConfig ? workflowMediaConfig.videoLimit : (0, _modelCapabilities.getModelMediaCapabilities)(videoTargetVariant === null || videoTargetVariant === void 0 ? void 0 : videoTargetVariant.model).video.maxItems;
  var audioUploadLimit = workflowMediaConfig ? workflowMediaConfig.audioLimit : currentModelCapabilities.audio.maxItems;
  var showEndImageUpload = workflowMediaConfig ? workflowMediaConfig.separateEndImage : imageUploadCapability.separateLastItem;
  var promptPlaceholder = selectedWorkflowId === "edit_video" ? copy.placeholders.editVideo : selectedWorkflowId === "extend_uploaded_video" ? copy.placeholders.continueVideo : selectedWorkflowId === "motion_transfer" ? currentModelObj !== null && currentModelObj !== void 0 && currentModelObj.promptRequired ? copy.placeholders.motion : copy.placeholders.motionOptional : v2vMode ? currentModelObj !== null && currentModelObj !== void 0 && currentModelObj.imageField ? currentModelObj !== null && currentModelObj !== void 0 && currentModelObj.promptRequired ? copy.placeholders.motion : copy.placeholders.motionOptional : copy.placeholders.videoReadyRemoveWatermark : imageMode ? currentModelObj !== null && currentModelObj !== void 0 && currentModelObj.promptRequired ? copy.placeholders.motionOrEffect : copy.placeholders.motionOrEffectOptional : isExtendMode ? veoContinuation !== null && veoContinuation !== void 0 && veoContinuation.promptRequired ? copy.placeholders.continueVideo : copy.placeholders.optionalContinueVideo : copy.placeholders.describeVideo;
  var _usePromptMenu = (0, _usePromptMenu2["default"])({
      open: openDropdown === "workflow",
      onOpen: function onOpen() {
        return setOpenDropdown("workflow");
      },
      onClose: function onClose() {
        return setOpenDropdown(null);
      },
      selectionKey: selectedWorkflowId
    }),
    workflowTriggerRef = _usePromptMenu.triggerRef,
    workflowMenuRef = _usePromptMenu.menuRef,
    workflowMenuFocusTargetRef = _usePromptMenu.focusTargetRef,
    handleWorkflowTriggerKeyDown = _usePromptMenu.onTriggerKeyDown,
    handleWorkflowMenuKeyDown = _usePromptMenu.onMenuKeyDown,
    closeWorkflowMenu = _usePromptMenu.closeMenu;
  var toggleDropdown = function toggleDropdown(type) {
    return function (e) {
      e.stopPropagation();
      setOpenDropdown(function (prev) {
        return prev === type ? null : type;
      });
    };
  };

  // ── render ────────────────────────────────────────────────────────────────
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    ref: containerRef,
    className: "w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2",
      children: history.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up",
        children: history.map(function (entry, idx) {
          var _entry$prompt, _entry$model;
          var isSeedance2 = (0, _videoToolCapabilities.isContinuationSourceModel)("seedance-2-extend", entry.model);
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer",
            onClick: function onClick() {
              return setFullscreenUrl(entry.url);
            },
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
              src: entry.url,
              className: "w-full aspect-video object-cover bg-black/40 hover:opacity-80 transition-opacity",
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
              className: "absolute top-2 right-2 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions.GenerationCopyButtons, {
                prompt: entry.prompt,
                onCopyError: onGenerationError
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: copy.gallery.download,
                onClick: function onClick(e) {
                  e.stopPropagation();
                  downloadFile(entry.url, "video-".concat(entry.id || idx, ".mp4"));
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
              }), isSeedance2 && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: copy.gallery.extendSeedance,
                onClick: function onClick(e) {
                  e.stopPropagation();
                  handleExtend(entry.id, entry.model);
                },
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M5 12h14M12 5l7 7-7 7"
                  })
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_SocialPublishProvider.PublishStep, {
                mediaUrl: entry.url,
                mediaType: "video",
                title: ((_entry$prompt = entry.prompt) === null || _entry$prompt === void 0 ? void 0 : _entry$prompt.substring(0, 50)) || 'Generated video',
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
                title: copy.gallery["delete"],
                onClick: function onClick(e) {
                  e.stopPropagation();
                  if (confirm(copy.gallery.confirmDelete)) {
                    handleDeleteEntry(entry, idx)["catch"](function (err) {
                      onGenerationError === null || onGenerationError === void 0 || onGenerationError(err.message || copy.errors.deleteItemFailed);
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
                    d: "M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
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
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions["default"], {
              prompt: entry.prompt,
              onCopyError: onGenerationError,
              actions: [{
                kind: "download",
                label: copy.gallery.download,
                onSelect: function onSelect() {
                  return downloadFile(entry.url, "video-".concat(entry.id || idx, ".mp4"));
                }
              }, isSeedance2 && {
                kind: "extend",
                label: copy.gallery.extend,
                onSelect: function onSelect() {
                  return handleExtend(entry.id, entry.model);
                }
              }, {
                kind: "delete",
                label: copy.gallery["delete"],
                danger: true,
                onSelect: function onSelect() {
                  if (confirm(copy.gallery.confirmDelete)) {
                    handleDeleteEntry(entry, idx)["catch"](function (err) {
                      onGenerationError === null || onGenerationError === void 0 || onGenerationError(err.message || copy.errors.deleteItemFailed);
                    });
                  }
                }
              }]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-white/70 text-xs line-clamp-3 leading-relaxed",
                title: entry.prompt,
                children: entry.prompt || copy.gallery.noPromptProvided
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "flex items-center justify-between mt-1 flex-wrap gap-1",
                children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap capitalize",
                    children: ((_entry$model = entry.model) === null || _entry$model === void 0 ? void 0 : _entry$model.replace("-", " ")) || copy.gallery.fallbackTitle
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "flex gap-2",
                    children: [entry.resolution && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-[10px] text-white/40",
                      children: entry.resolution
                    }), entry.duration && /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                      className: "text-[10px] text-white/40",
                      children: [entry.duration, "s"]
                    })]
                  })]
                })
              })]
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
              alt: copy.creativeAssets.asset1,
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[4deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/chroma-image.avif",
              alt: copy.creativeAssets.asset2,
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-18 sm:w-24 sm:h-24 rounded-full border border-white/10 shadow-2xl rotate-[6deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif",
              alt: copy.creativeAssets.asset3,
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/perfect-pony-xl.avif",
              alt: copy.creativeAssets.asset4,
              className: "w-full h-full object-cover"
            })
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("h1", {
          className: "text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center px-4 flex flex-col items-center",
          children: [!selectedTool && !selectedVeoTool && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-white font-black uppercase text-xl sm:text-3xl tracking-wide mb-1 opacity-90",
            children: copy.empty.heading
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight",
            children: selectedTool || selectedVeoTool || selectedPickerEntry !== null && selectedPickerEntry !== void 0 && selectedPickerEntry.groupedVideo ? selectedPickerLabel : selectedFamily.name
          })]
        }), !selectedTool && !selectedVeoTool && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4",
          children: groupedConfiguration ? (0, _videoModelCopy.getVideoModeDescription)(selectedVariant.model, selectedWorkflowId, groupCopy) : copy.empty.subtitle
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptComposer, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col gap-3",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex items-start gap-2.5 flex-wrap",
          children: selectedWorkflowId ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [workflowMediaSlots.flatMap(function (slot) {
              var values = (activeWorkflowMediaDraft === null || activeWorkflowMediaDraft === void 0 ? void 0 : activeWorkflowMediaDraft[slot.id]) || [];
              return values.map(function (url, index) {
                return /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferencePreview, {
                  copy: copy,
                  type: slot.mediaType,
                  url: url,
                  index: index,
                  onRemove: function onRemove(itemIndex) {
                    return removeWorkflowMedia(slot.id, itemIndex);
                  },
                  label: values.length > 1 ? "".concat(slot.label, " \xB7 ").concat(index + 1) : slot.label,
                  description: values.length > 1 ? "".concat(slot.description, " ").concat(index + 1) : slot.description
                }, "".concat(slot.id, ":").concat(index, ":").concat(url));
              });
            }), workflowMediaSlots.map(function (slot) {
              var values = (activeWorkflowMediaDraft === null || activeWorkflowMediaDraft === void 0 ? void 0 : activeWorkflowMediaDraft[slot.id]) || [];
              var remaining = (0, _videoWorkflows.getVideoWorkflowSlotRemaining)(slot, activeWorkflowMediaDraft);
              if (remaining <= 0) return null;
              var uploadKey = "".concat(workflowMediaDraftKey, ":").concat(slot.id);
              var uploading = workflowUploadSlotId === uploadKey;
              var progress = slot.mediaType === "image" ? imageProgress : slot.mediaType === "video" ? videoProgress : audioProgress;
              return /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferenceUploadButton, {
                copy: copy,
                accept: "".concat(slot.mediaType, "/*"),
                multiple: remaining > 1,
                onChange: (/*#__PURE__*/function () {
                  var _ref20 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(event) {
                    var files;
                    return _regenerator().w(function (_context10) {
                      while (1) switch (_context10.n) {
                        case 0:
                          files = Array.from(event.target.files || []);
                          event.target.value = "";
                          _context10.n = 1;
                          return uploadWorkflowSlotFiles(workflowMediaDraftKey, slot, files);
                        case 1:
                          return _context10.a(2);
                      }
                    }, _callee1);
                  }));
                  return function (_x15) {
                    return _ref20.apply(this, arguments);
                  };
                }()),
                title: "".concat(slot.description || slot.label).concat(slot.required ? " (required)" : " (optional)"),
                uploading: uploading,
                progress: progress,
                type: slot.mediaType,
                label: slot.label,
                required: slot.required,
                disabled: Boolean(workflowUploadSlotId)
              }, slot.id);
            })]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [uploadedImageUrls.map(function (url, index) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferencePreview, {
                copy: copy,
                type: "image",
                url: url,
                index: index,
                onRemove: removeImageAtIndex,
                label: uploadedImageUrls.length > 1 ? "".concat(copy.media.image, " \xB7 ").concat(index + 1) : copy.media.image
              }, url);
            }), uploadedEndImageUrl && /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferencePreview, {
              copy: copy,
              type: "image",
              url: uploadedEndImageUrl,
              index: 0,
              onRemove: clearEndImage,
              label: copy.media.endFrame
            }), uploadedVideoUrls.map(function (url, index) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferencePreview, {
                copy: copy,
                type: "video",
                url: url,
                index: index,
                onRemove: removeVideoAtIndex,
                label: uploadedVideoUrls.length > 1 ? "".concat(copy.media.video, " \xB7 ").concat(index + 1) : copy.media.video
              }, url);
            }), uploadedAudioUrls.map(function (url, index) {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferencePreview, {
                copy: copy,
                type: "audio",
                url: url,
                index: index,
                onRemove: removeAudioAtIndex,
                label: uploadedAudioUrls.length > 1 ? "".concat(copy.media.audio, " \xB7 ").concat(index + 1) : copy.media.audio
              }, url);
            }), canUploadImageReference && uploadedImageUrls.length < imageUploadLimit && /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferenceUploadButton, {
              copy: copy,
              inputRef: imageFileInputRef,
              accept: "image/*",
              multiple: imageUploadLimit - uploadedImageUrls.length > 1,
              onChange: handleImageFileChange,
              onClick: function onClick() {
                var _imageFileInputRef$cu;
                return (_imageFileInputRef$cu = imageFileInputRef.current) === null || _imageFileInputRef$cu === void 0 ? void 0 : _imageFileInputRef$cu.click();
              },
              title: selectedWorkflowId === "keyframes" ? copy.upload.uploadStartFrame : copy.upload.uploadUpToReferenceImages.replace('{count}', imageUploadLimit),
              uploading: imageUploading,
              progress: imageProgress,
              type: "image"
            }), showEndImageUpload && !uploadedEndImageUrl && /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferenceUploadButton, {
              copy: copy,
              inputRef: endImageFileInputRef,
              accept: "image/*",
              multiple: false,
              onChange: handleEndImageFileChange,
              onClick: function onClick() {
                var _endImageFileInputRef;
                return (_endImageFileInputRef = endImageFileInputRef.current) === null || _endImageFileInputRef === void 0 ? void 0 : _endImageFileInputRef.click();
              },
              title: copy.upload.uploadEndFrame,
              uploading: endImageUploading,
              progress: endImageProgress,
              type: "image"
            }), videoUploadLimit > 0 && uploadedVideoUrls.length < videoUploadLimit && /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferenceUploadButton, {
              copy: copy,
              inputRef: videoFileInputRef,
              accept: "video/*",
              multiple: videoUploadLimit - uploadedVideoUrls.length > 1,
              onChange: handleVideoFileChange,
              onClick: function onClick() {
                var _videoFileInputRef$cu;
                return (_videoFileInputRef$cu = videoFileInputRef.current) === null || _videoFileInputRef$cu === void 0 ? void 0 : _videoFileInputRef$cu.click();
              },
              title: "Upload up to ".concat(videoUploadLimit, " reference videos"),
              uploading: videoUploading,
              progress: videoProgress,
              type: "video"
            }), audioUploadLimit > 0 && uploadedAudioUrls.length < audioUploadLimit && /*#__PURE__*/(0, _jsxRuntime.jsx)(ReferenceUploadButton, {
              copy: copy,
              inputRef: audioFileInputRef,
              accept: "audio/*",
              multiple: audioUploadLimit - uploadedAudioUrls.length > 1,
              onChange: handleAudioFileChange,
              onClick: function onClick() {
                var _audioFileInputRef$cu;
                return (_audioFileInputRef$cu = audioFileInputRef.current) === null || _audioFileInputRef$cu === void 0 ? void 0 : _audioFileInputRef$cu.click();
              },
              title: "Upload up to ".concat(audioUploadLimit, " reference audio files"),
              uploading: audioUploading,
              progress: audioProgress,
              type: "audio"
            })]
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex-1 flex flex-col gap-1",
          children: !(selectedVeoTool && promptDisabled) && /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptTextarea, {
            ref: textareaRef,
            value: prompt,
            onChange: handlePromptInput,
            placeholder: promptPlaceholder,
            disabled: promptDisabled
          })
        })]
      }), selectedVeoTool ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "mx-3 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2",
        children: selectedVeoSource ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("label", {
          className: "flex min-w-0 items-center gap-3 text-xs text-white/70",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "shrink-0",
            children: copy.veo.sourceVideo
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("select", {
            className: "min-w-0 flex-1 rounded-lg border border-white/10 bg-[#17191c] px-2 py-2 text-xs text-white",
            value: selectedVeoSource.requestId,
            onChange: function onChange(event) {
              return setSelectedVeoSourceId(event.target.value);
            },
            children: veoSources.map(function (entry, index) {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("option", {
                value: entry.requestId,
                children: [index + 1, ". ", entry.prompt || "Veo 3.1"]
              }, entry.requestId);
            })
          })]
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-xs text-white/60",
          children: copy.veo.sourceHelp[selectedVeoTool.key]
        })
      }) : isExtendMode && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-2 px-3 py-1.5 mx-3 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary/80 font-medium tracking-tight",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "13",
          height: "13",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.5",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M5 12h14M12 5l7 7-7 7"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          children: hasContinuationSource ? copy.extend.continuingGeneration.replace('{family}', selectedFamily.name) : copy.errors.noContinuationSource.replace("{family}", selectedFamily.name)
        })]
      }), groupedConfiguration && selectedVariant.model.aspectRatioMode === "inherited" && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        className: "px-2 text-[10px] text-white/40",
        children: groupCopy.inheritedFormat
      }), groupedConfiguration && selectedWorkflowId === "extend_uploaded_video" && groupedResolution.options.length === 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        className: "px-2 text-[10px] text-white/40",
        children: groupCopy.inheritedVideoResolution
      }), (groupedResolution === null || groupedResolution === void 0 ? void 0 : groupedResolution.label) && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        className: "px-2 text-[10px] text-white/40",
        children: groupCopy.resolutionUnknown
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptFooter, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptControls, {
          ref: dropdownRef,
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: toggleDropdown("model"),
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "model"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-4 h-4 rounded overflow-hidden shrink-0 flex items-center justify-center bg-white/5",
                children: function () {
                  var selectedModelProvider = selectedFamily.provider || 'muapi';
                  return PROVIDER_LOGOS[selectedModelProvider] ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                    src: PROVIDER_LOGOS[selectedModelProvider],
                    alt: "",
                    className: "w-full h-full object-contain ".concat(invertLogos.includes(selectedModelProvider) ? "invert" : "")
                  }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[9px] font-bold text-black uppercase",
                    children: "V"
                  });
                }()
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: selectedPickerLabel
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), openDropdown === "model" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              onClick: function onClick(e) {
                return e.stopPropagation();
              },
              className: "w-[calc(100vw-2rem)] md:w-[480px] max-w-md md:max-w-none max-h-[70vh]",
              fitViewport: Boolean(groupedConfiguration),
              solid: Boolean(groupedConfiguration),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.model
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ModelDropdown, {
                selectedModel: selectedModel,
                onSelect: handleModelSelect,
                onClose: function onClose() {
                  return setOpenDropdown(null);
                },
                copy: copy
              })]
            })]
          }), workflowControlState.kind !== "hidden" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative flex items-center gap-1",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              ref: workflowTriggerRef,
              id: workflowControlId,
              "aria-haspopup": workflowControlState.kind === "menu" ? "menu" : undefined,
              "aria-controls": workflowControlState.kind === "menu" ? workflowMenuId : undefined,
              "aria-expanded": workflowControlState.kind === "menu" ? openDropdown === "workflow" : undefined,
              "aria-pressed": workflowControlState.kind === "direct" ? Boolean(selectedWorkflowId) : undefined,
              onClick: function onClick(event) {
                if (workflowControlState.kind === "direct") {
                  event.stopPropagation();
                  if (selectedWorkflowId) {
                    clearWorkflow();
                  } else if (workflowControlState.workflow) {
                    handleWorkflowSelect(workflowControlState.workflow.id);
                  }
                  setOpenDropdown(null);
                  return;
                }
                event.stopPropagation();
                if (openDropdown === "workflow") {
                  setOpenDropdown(null);
                  return;
                }
                workflowMenuFocusTargetRef.current = "selected";
                setOpenDropdown("workflow");
              },
              onKeyDown: workflowControlState.kind === "menu" ? handleWorkflowTriggerKeyDown : undefined,
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "workflow"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: groupedConfiguration ? groupCopy.modes[selectedWorkflowId || "text"] : (0, _videoWorkflows.getVideoWorkflowControlLabel)(selectedWorkflow)
              }), workflowControlState.kind === "menu" && /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), workflowControlState.kind === "menu" && openDropdown === "workflow" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              className: groupedConfiguration ? "w-[300px] max-w-[calc(100vw-32px)]" : "min-w-[210px]",
              fitViewport: Boolean(groupedConfiguration),
              solid: Boolean(groupedConfiguration),
              style: {
                maxHeight: groupedConfiguration ? "65vh" : "55vh"
              },
              onClick: function onClick(event) {
                return event.stopPropagation();
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.source
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                ref: workflowMenuRef,
                id: workflowMenuId,
                role: "menu",
                "aria-labelledby": workflowControlId,
                onKeyDown: handleWorkflowMenuKeyDown,
                className: "flex flex-col gap-1",
                children: [(groupedConfiguration ? groupedModes : workflowFamily.workflows).map(function (workflow) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    selected: selectedWorkflowId === workflow.id,
                    disabled: workflow.disabled,
                    wrapDescription: Boolean(groupedConfiguration),
                    description: groupedConfiguration && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
                      children: [workflow.description, workflow.adjustmentDescription && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "mt-1 block text-amber-200/85",
                        children: workflow.adjustmentDescription
                      })]
                    }),
                    className: "disabled:opacity-40 disabled:cursor-not-allowed",
                    onClick: function onClick(event) {
                      event.stopPropagation();
                      if (workflow.id === null) clearWorkflow();else handleWorkflowSelect(workflow.id);
                      closeWorkflowMenu(true);
                    },
                    children: workflow.label
                  }, workflow.id || "text");
                }), !groupedConfiguration && selectedWorkflow && (workflowFamily === null || workflowFamily === void 0 ? void 0 : workflowFamily.hasBase) && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "mt-2 border-t border-white/[0.05] pt-2",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                    type: "button",
                    role: "menuitemradio",
                    "aria-checked": false,
                    onClick: function onClick(event) {
                      event.stopPropagation();
                      clearWorkflow();
                      closeWorkflowMenu(true);
                    },
                    className: "flex min-h-9 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px] font-semibold text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/70 focus:outline-none focus-visible:bg-white/[0.04] focus-visible:text-white/70",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                      width: "13",
                      height: "13",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      "aria-hidden": "true",
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                        d: "M3 12a9 9 0 1 0 3-6.7L3 8"
                      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                        d: "M3 3v5h5"
                      })]
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      children: copy.dropdowns.baseGeneration
                    })]
                  })
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_VideoModelControls.VideoOptionControl, {
            label: groupCopy.speed,
            field: groupedSpeed,
            open: openDropdown === "generation-speed",
            onToggle: toggleDropdown("generation-speed"),
            onSelect: function onSelect(option) {
              handleGroupedOptionChange("speed", option.value);
              setOpenDropdown(null);
            },
            copy: groupCopy
          }), groupedConfiguration ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_VideoModelControls.VideoSettingsControl, {
            profile: groupedProfile,
            onDefaultResolution: groupedConfiguration.profile === "legacy" && groupedConfiguration.resolution !== "default" ? function () {
              return handleGroupedOptionChange("resolution", "default");
            } : undefined,
            qualities: commonOptions.qualities,
            quality: selectedQuality,
            onProfileChange: function onProfileChange(value) {
              return handleGroupedOptionChange("profile", value);
            },
            onQualityChange: setSelectedQuality,
            inputs: supplementalInputs,
            values: modelParameterValues,
            onChange: handleModelParameterChange,
            open: openDropdown === "parameters",
            onToggle: toggleDropdown("parameters"),
            copy: groupCopy
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_ModelParameterControls["default"], {
            inputs: supplementalInputs,
            values: modelParameterValues,
            onChange: handleModelParameterChange,
            open: openDropdown === "parameters",
            onToggle: toggleDropdown("parameters")
          }), showAr && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: toggleDropdown("ar"),
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "ar"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAspectRatioIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: (0, _videoModelCopy.getVideoAspectRatioLabel)(selectedAr, groupCopy)
              })]
            }), openDropdown === "ar" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              onClick: function onClick(e) {
                return e.stopPropagation();
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.aspectRatio
              }), aspectRatioHelp && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "px-3 pb-2 text-[11px] text-white/45",
                children: aspectRatioHelp
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: (groupedConfiguration ? commonOptions.aspectRatios : getCurrentAspectRatios(selectedModel)).map(function (r) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    selected: selectedAr === r,
                    onClick: function onClick(e) {
                      e.stopPropagation();
                      setSelectedAr(r);
                      setOpenDropdown(null);
                    },
                    children: (0, _videoModelCopy.getVideoAspectRatioLabel)(r, groupCopy)
                  }, r);
                })
              })]
            })]
          }), showEffect && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: toggleDropdown("effect"),
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "effect"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                className: "opacity-40 text-white",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M5 3l14 9-14 9V3z"
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "".concat(_PromptComposer.PROMPT_CONTROL_LABEL_CLASS, " max-w-[140px] truncate"),
                children: selectedEffect || copy.dropdowns.effect
              })]
            }), openDropdown === "effect" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              onClick: function onClick(e) {
                return e.stopPropagation();
              },
              className: "min-w-[200px]",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.effectType
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: (0, _models.getEffectsForI2VModel)(selectedModel).map(function (eff) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    selected: selectedEffect === eff,
                    onClick: function onClick(e) {
                      e.stopPropagation();
                      setSelectedEffect(eff);
                      setOpenDropdown(null);
                    },
                    children: eff
                  }, eff);
                })
              })]
            })]
          }), groupedConfiguration && /*#__PURE__*/(0, _jsxRuntime.jsx)(_VideoModelControls.VideoOptionControl, {
            label: selectedWorkflowId === "extend_uploaded_video" ? groupCopy.extensionDuration : copy.dropdowns.duration,
            field: {
              key: "duration",
              value: selectedDuration,
              options: commonOptions.durations.map(function (value) {
                return {
                  value: value,
                  label: (0, _videoModelCopy.getVideoDurationLabel)(value, groupCopy)
                };
              })
            },
            icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptDurationIcon, {}),
            open: openDropdown === "duration",
            onToggle: toggleDropdown("duration"),
            onSelect: function onSelect(option) {
              setSelectedDuration(option.value);
              setOpenDropdown(null);
            },
            copy: groupCopy
          }), !groupedConfiguration && showDuration && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: toggleDropdown("duration"),
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "duration"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptDurationIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: [selectedDuration, "s"]
              })]
            }), openDropdown === "duration" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              onClick: function onClick(e) {
                return e.stopPropagation();
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.duration
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: getCurrentDurations(selectedModel).map(function (d) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptMenuItem, {
                    selected: selectedDuration === d,
                    onClick: function onClick(e) {
                      e.stopPropagation();
                      setSelectedDuration(d);
                      setOpenDropdown(null);
                    },
                    children: [d, "s"]
                  }, d);
                })
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_VideoModelControls.VideoOptionControl, {
            label: copy.dropdowns.resolution,
            field: groupedResolution,
            icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptQualityIcon, {}),
            open: openDropdown === "resolution",
            onToggle: toggleDropdown("resolution"),
            onSelect: handleGroupedResolutionChange,
            copy: groupCopy
          }), !groupedConfiguration && showResolution && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              onClick: toggleDropdown("resolution"),
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "resolution"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptQualityIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: selectedResolution || "720p"
              })]
            }), openDropdown === "resolution" && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
              onClick: function onClick(e) {
                return e.stopPropagation();
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
                children: copy.dropdowns.resolution
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
                children: getCurrentResolutions(selectedModel).map(function (r) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
                    selected: selectedResolution === r,
                    onClick: function onClick(e) {
                      e.stopPropagation();
                      setSelectedResolution(r);
                      setOpenDropdown(null);
                    },
                    children: r
                  }, r);
                })
              })]
            })]
          }), canUploadImageReference && /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            type: "button",
            className: (0, _PromptComposer.promptControlClassName)(),
            onClick: function onClick() {
              return setIsDrawModalOpen(true);
            },
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              className: "opacity-40 text-white group-hover:text-[#22d3ee] transition-colors",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M12 20h9"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
              children: copy.controls.draw
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAction, {
          onClick: handleGenerate,
          disabled: generating || mediaUploading || (selectedTool === null || selectedTool === void 0 ? void 0 : selectedTool.group) === "continueGenerated" && !hasContinuationSource || selectedVeoTool && !selectedVeoSource,
          children: generating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "animate-spin inline-block text-black",
              children: "\u25CC"
            }), " ", copy.controls.generating]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.controls.generate
            })
          })
        })]
      })]
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
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_DrawModal["default"], {
      isOpen: isDrawModalOpen,
      onClose: function onClose() {
        return setIsDrawModalOpen(false);
      },
      apiKey: apiKey,
      batchSize: 1,
      onAddHistoryItem: handleDrawReference
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactHotToast.Toaster, {
      position: "top-right",
      containerStyle: {
        zIndex: 99999
      },
      toastOptions: {
        duration: 5000,
        style: {
          background: '#18181b',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.15)',
          fontSize: '13px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          maxWidth: '440px',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          padding: '12px 16px'
        }
      }
    })]
  });
}