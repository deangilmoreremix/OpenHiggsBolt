"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = MarketingStudio;
var _react = require("react");
var _SocialPublishProvider = require("../../../../components/SocialPublishProvider");
var _AiAssistantProvider = require("../../../../components/AiAssistantProvider");
var _muapi = require("../muapi.js");
var _persistKey = require("../persistKey.js");
var _MobileGenerationActions = _interopRequireWildcard(require("./MobileGenerationActions.jsx"));
var _PromptComposer = require("./prompt/PromptComposer.jsx");
var _marketingStudio = _interopRequireDefault(require("../messages/en/marketingStudio.json"));
var _marketingStudio2 = _interopRequireDefault(require("../messages/zh/marketingStudio.json"));
var _i18nUtils = require("../i18nUtils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t6 in e) "default" !== _t6 && {}.hasOwnProperty.call(e, _t6) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t6)) && (i.get || i.set) ? o(f, _t6, i) : f[_t6] = e[_t6]); return f; })(e, t); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
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
var SCROLLBAR_STYLE = "\n  .custom-scrollbar-thin::-webkit-scrollbar {\n    height: 4px;\n  }\n  .custom-scrollbar-thin::-webkit-scrollbar-track {\n    background: transparent;\n  }\n  .custom-scrollbar-thin::-webkit-scrollbar-thumb {\n    background: rgba(255, 255, 255, 0.1);\n    border-radius: 10px;\n  }\n  .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {\n    background: rgba(34, 211, 238, 0.3);\n  }\n";

// ── Icons ────────────────────────────────────────────────────────────────────

var CheckSvg = function CheckSvg() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#22d3ee",
    strokeWidth: "4",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "20 6 9 17 4 12"
    })
  });
};
var PlusSvg = function PlusSvg() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
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
  });
};
var CloseSvg = function CloseSvg() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
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
  });
};
var ProductIcon = function ProductIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M21 8l-2-2H5L3 8v10a2 2 0 002 2h14a2 2 0 002-2V8z"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M3 10h18"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
    })]
  });
};
var AvatarIcon = function AvatarIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
      cx: "12",
      cy: "7",
      r: "4"
    })]
  });
};
var RefIcon = function RefIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
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

// ── Assets ───────────────────────────────────────────────────────────────────

var ASSETS = {
  avatar: [{
    id: "aa252283-8591-4d14-91a8-41ce54187992",
    name: "Priya",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Priya.webp"
  }, {
    id: "ba6c9b18-f79c-4dab-9649-88a181d0a038",
    name: "Elena",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Elena.webp"
  }, {
    id: "30e2cadd-987c-4a7a-81c3-094d4fb3a65e",
    name: "Kai",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Kai.webp"
  }, {
    id: "fbed59e1-4b8d-4625-9140-ef2044e0be72",
    name: "Sora",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Sora.webp"
  }, {
    id: "bcd9e6ee-c000-48e6-9f4b-a20fc2a674f7",
    name: "Minji",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Minji.webp"
  }, {
    id: "1da384ed-3856-45e4-bf4c-a496c7aa95ff",
    name: "Margot",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Margot.webp"
  }, {
    id: "b799c8f5-fb6e-4905-b33b-cdefac153ec3",
    name: "Niko",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Niko.webp"
  }, {
    id: "b6971dd4-55fa-4e64-b318-392b16504284",
    name: "Jin",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/Jin.webp"
  }],
  ugc: [{
    id: 1,
    name: "UGC",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc.mp4"
  }, {
    id: 2,
    name: "Tutorial",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc_how_to.mp4"
  }, {
    id: 3,
    name: "Unboxing",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/ugc_unboxing.mp4"
  }, {
    id: 4,
    name: "Hyper Motion",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/hyper-motion-mini.mp4"
  }, {
    id: 5,
    name: "Product Review",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/product_review.mp4"
  }, {
    id: 6,
    name: "TV Spot",
    url: "https://d3adwkbyhxyrtq.cloudfront.net/web-app/tv-spot-mini.mp4"
  }]
};
var OPTIONS = {
  ratio: ["9:16", "3:4", "4:3", "16:9", "1:1"],
  res: ["720p", "1080p"],
  duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
};

// ── Components ───────────────────────────────────────────────────────────────

function UploadSlot(_ref) {
  var icon = _ref.icon,
    url = _ref.url,
    progress = _ref.progress,
    label = _ref.label,
    title = _ref.title,
    onUpload = _ref.onUpload,
    onClear = _ref.onClear,
    _ref$multiple = _ref.multiple,
    multiple = _ref$multiple === void 0 ? false : _ref$multiple,
    _ref$images = _ref.images,
    images = _ref$images === void 0 ? [] : _ref$images;
  var inputRef = (0, _react.useRef)(null);
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isDraggingSlot = _useState2[0],
    setIsDraggingSlot = _useState2[1];
  var dragCounterRef = (0, _react.useRef)(0);
  var handleSlotDragEnter = function handleSlotDragEnter(e) {
    var _e$dataTransfer;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingSlot(true);
    }
  };
  var handleSlotDragLeave = function handleSlotDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingSlot(false);
    }
  };
  var handleSlotDragOver = function handleSlotDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  var handleSlotDrop = function handleSlotDrop(e) {
    var _e$dataTransfer2;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingSlot(false);
    var files = (_e$dataTransfer2 = e.dataTransfer) === null || _e$dataTransfer2 === void 0 ? void 0 : _e$dataTransfer2.files;
    if (files && files.length > 0) {
      onUpload(Array.from(files));
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "relative group/slot flex items-center",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      onClick: function onClick() {
        var _inputRef$current;
        return (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 ? void 0 : _inputRef$current.click();
      },
      onDragEnter: handleSlotDragEnter,
      onDragLeave: handleSlotDragLeave,
      onDragOver: handleSlotDragOver,
      onDrop: handleSlotDrop,
      title: title,
      className: (0, _PromptComposer.promptMediaButtonClassName)({
        active: Boolean(url) || isDraggingSlot,
        className: "cursor-pointer".concat(isDraggingSlot ? " ring-2 ring-primary ring-offset-1 ring-offset-black/40" : "")
      }),
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        ref: inputRef,
        type: "file",
        accept: "image/*",
        className: "hidden",
        multiple: multiple,
        onChange: function onChange(e) {
          return onUpload(Array.from(e.target.files));
        }
      }), progress > 0 && progress < 100 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-10",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
          className: "text-[8px] font-black text-primary",
          children: [progress, "%"]
        })
      }) : url ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-full h-full rounded-full overflow-hidden border border-black/20",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: url,
          className: "w-full h-full object-cover",
          alt: label
        })
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "text-white/40 group-hover:text-primary transition-colors",
        children: icon
      }), url && !multiple && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        onClick: function onClick(e) {
          e.stopPropagation();
          onClear();
        },
        className: "absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-lg",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(CloseSvg, {})
      })]
    })
  });
}
function Dropdown(_ref2) {
  var isOpen = _ref2.isOpen,
    title = _ref2.title,
    items = _ref2.items,
    selectedId = _ref2.selectedId,
    onSelect = _ref2.onSelect,
    onClose = _ref2.onClose,
    _ref2$isVideo = _ref2.isVideo,
    isVideo = _ref2$isVideo === void 0 ? false : _ref2$isVideo,
    _ref2$onPreview = _ref2.onPreview,
    onPreview = _ref2$onPreview === void 0 ? null : _ref2$onPreview,
    _ref2$copy = _ref2.copy,
    copy = _ref2$copy === void 0 ? _marketingStudio["default"] : _ref2$copy;
  var ref = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    if (!isOpen) return;
    var handler = function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
    ref: ref,
    className: "w-[420px] max-w-[calc(100vw-2rem)]",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
      className: "mb-3",
      children: title
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1",
      children: items.map(function (item) {
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          onClick: function onClick() {
            return onSelect(item);
          },
          className: "relative rounded overflow-hidden border-2 transition-all group cursor-pointer ".concat(selectedId === item.id || selectedId === item.url ? 'border-primary shadow-glow' : 'border-white/5 hover:border-white/20'),
          children: [onPreview && !isVideo && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            title: copy.buttons.enlargePreview,
            onClick: function onClick(e) {
              e.stopPropagation();
              onPreview(item);
            },
            className: "absolute top-1.5 left-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10 z-20 text-white",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "12",
              height: "12",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                cx: "11",
                cy: "11",
                r: "8"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "21",
                y1: "21",
                x2: "16.65",
                y2: "16.65"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "11",
                y1: "8",
                x2: "11",
                y2: "14"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "8",
                y1: "11",
                x2: "14",
                y2: "11"
              })]
            })
          }), isVideo ? /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
            src: item.url,
            autoPlay: true,
            loop: true,
            muted: true,
            className: "w-full aspect-[3/4] object-cover group-hover:scale-105 transition-all duration-500"
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: item.url,
            className: "w-full aspect-square object-cover group-hover:scale-105 transition-all duration-500",
            alt: item.name
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[9px] font-black text-white uppercase tracking-tight",
              children: item.name
            })
          }), (selectedId === item.id || selectedId === item.url) && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-lg",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})
          })]
        }, item.id);
      })
    })]
  });
}
function SimpleDropdown(_ref3) {
  var isOpen = _ref3.isOpen,
    title = _ref3.title,
    options = _ref3.options,
    selected = _ref3.selected,
    onSelect = _ref3.onSelect,
    onClose = _ref3.onClose;
  var ref = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    if (!isOpen) return;
    var handler = function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
    ref: ref,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
      children: title
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
      children: options.map(function (opt) {
        return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
          selected: selected === opt,
          onClick: function onClick() {
            onSelect(opt);
            onClose();
          },
          children: opt
        }, opt);
      })
    })]
  });
}

// ── Main Component ───────────────────────────────────────────────────────────

function MarketingStudio(_ref4) {
  var _ASSETS$avatar$find;
  var apiKey = _ref4.apiKey,
    droppedFiles = _ref4.droppedFiles,
    onFilesHandled = _ref4.onFilesHandled,
    onGenerationStart = _ref4.onGenerationStart,
    onGenerationEnd = _ref4.onGenerationEnd,
    onGenerationComplete = _ref4.onGenerationComplete,
    onGenerationError = _ref4.onGenerationError,
    historyItems = _ref4.historyItems,
    _ref4$locale = _ref4.locale,
    locale = _ref4$locale === void 0 ? "en" : _ref4$locale;
  var copy = (0, _i18nUtils.resolveCopy)(_marketingStudio["default"], _marketingStudio2["default"], locale);
  var LEGACY_PERSIST_KEY = "hg_marketing_studio_persistent";
  var PERSIST_KEY = (0, _persistKey.scopedPersistKey)(LEGACY_PERSIST_KEY, apiKey);
  (0, _react.useEffect)(function () {
    (0, _persistKey.migrateLegacyPersistKey)(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);
  var _useState3 = (0, _react.useState)(""),
    _useState4 = _slicedToArray(_useState3, 2),
    prompt = _useState4[0],
    setPrompt = _useState4[1];
  var _useState5 = (0, _react.useState)(null),
    _useState6 = _slicedToArray(_useState5, 2),
    productImage = _useState6[0],
    setProductImage = _useState6[1];
  var _useState7 = (0, _react.useState)(null),
    _useState8 = _slicedToArray(_useState7, 2),
    avatarImage = _useState8[0],
    setAvatarImage = _useState8[1];
  var _useState9 = (0, _react.useState)([]),
    _useState0 = _slicedToArray(_useState9, 2),
    additionalImages = _useState0[0],
    setAdditionalImages = _useState0[1];
  var _useState1 = (0, _react.useState)({
      ratio: "9:16",
      format: ASSETS.ugc[0].name,
      videoUrl: ASSETS.ugc[0].url,
      res: "1080p",
      duration: 5
    }),
    _useState10 = _slicedToArray(_useState1, 2),
    params = _useState10[0],
    setParams = _useState10[1];
  var _useState11 = (0, _react.useState)([]),
    _useState12 = _slicedToArray(_useState11, 2),
    localHistory = _useState12[0],
    setLocalHistory = _useState12[1];
  var history = historyItems !== null && historyItems !== void 0 ? historyItems : localHistory;
  var _useState13 = (0, _react.useState)(false),
    _useState14 = _slicedToArray(_useState13, 2),
    isGenerating = _useState14[0],
    setIsGenerating = _useState14[1];
  var _useState15 = (0, _react.useState)(null),
    _useState16 = _slicedToArray(_useState15, 2),
    dropdown = _useState16[0],
    setDropdown = _useState16[1]; // 'format' | 'avatar' | 'ratio' | 'res' | 'duration'
  var _useState17 = (0, _react.useState)({
      product: 0,
      avatar: 0,
      additional: 0
    }),
    _useState18 = _slicedToArray(_useState17, 2),
    uploadProgress = _useState18[0],
    setUploadProgress = _useState18[1];
  var _useState19 = (0, _react.useState)(null),
    _useState20 = _slicedToArray(_useState19, 2),
    fullscreenUrl = _useState20[0],
    setFullscreenUrl = _useState20[1];
  var _useState21 = (0, _react.useState)(null),
    _useState22 = _slicedToArray(_useState21, 2),
    previewAvatar = _useState22[0],
    setPreviewAvatar = _useState22[1];
  var _useState23 = (0, _react.useState)("next"),
    _useState24 = _slicedToArray(_useState23, 2),
    slideDirection = _useState24[0],
    setSlideDirection = _useState24[1]; // 'next' | 'prev'

  var textareaRef = (0, _react.useRef)(null);

  // ── Persistence ───────────────────────────────────────────────────────────

  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        if (data.prompt) setPrompt(data.prompt);
        if (data.params) setParams(data.params);
        if (data.productImage) setProductImage(data.productImage);
        if (data.avatarImage) setAvatarImage(data.avatarImage);
        if (data.additionalImages) setAdditionalImages(data.additionalImages);
        if (data.localHistory) setLocalHistory(data.localHistory);else if (data.history) setLocalHistory(data.history);
      }
    } catch (err) {
      console.warn("Load failed", err);
    }
  }, []);
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      var state = {
        prompt: prompt,
        params: params,
        productImage: productImage,
        avatarImage: avatarImage,
        additionalImages: additionalImages,
        localHistory: localHistory
      };
      localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
    }, 500);
    return function () {
      return clearTimeout(timer);
    };
  }, [prompt, params, productImage, avatarImage, additionalImages, localHistory]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  var downloadFile = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(url, filename) {
      var response, blob, blobUrl, a, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.p = 0;
            _context.n = 1;
            return fetch(url);
          case 1:
            response = _context.v;
            _context.n = 2;
            return response.blob();
          case 2:
            blob = _context.v;
            blobUrl = URL.createObjectURL(blob);
            a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
            window.open(url, "_blank");
          case 4:
            return _context.a(2);
        }
      }, _callee, null, [[0, 3]]);
    }));
    return function downloadFile(_x, _x2) {
      return _ref5.apply(this, arguments);
    };
  }();
  var handleUpload = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(files, target) {
      var remaining, toUpload, _iterator, _step, _loop, file, url, _t3, _t4;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (!(!files || !files.length)) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            if (!(target === 'additional')) {
              _context3.n = 9;
              break;
            }
            remaining = 6 - additionalImages.length;
            toUpload = files.slice(0, remaining);
            _iterator = _createForOfIteratorHelper(toUpload);
            _context3.p = 2;
            _loop = /*#__PURE__*/_regenerator().m(function _loop() {
              var file, url, _t2;
              return _regenerator().w(function (_context2) {
                while (1) switch (_context2.p = _context2.n) {
                  case 0:
                    file = _step.value;
                    _context2.p = 1;
                    _context2.n = 2;
                    return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
                      return setUploadProgress(function (p) {
                        return _objectSpread(_objectSpread({}, p), {}, {
                          additional: pct
                        });
                      });
                    });
                  case 2:
                    url = _context2.v;
                    setAdditionalImages(function (prev) {
                      return [].concat(_toConsumableArray(prev), [url]).slice(0, 6);
                    });
                    _context2.n = 4;
                    break;
                  case 3:
                    _context2.p = 3;
                    _t2 = _context2.v;
                    alert(_t2.message);
                  case 4:
                    return _context2.a(2);
                }
              }, _loop, null, [[1, 3]]);
            });
            _iterator.s();
          case 3:
            if ((_step = _iterator.n()).done) {
              _context3.n = 5;
              break;
            }
            return _context3.d(_regeneratorValues(_loop()), 4);
          case 4:
            _context3.n = 3;
            break;
          case 5:
            _context3.n = 7;
            break;
          case 6:
            _context3.p = 6;
            _t3 = _context3.v;
            _iterator.e(_t3);
          case 7:
            _context3.p = 7;
            _iterator.f();
            return _context3.f(7);
          case 8:
            _context3.n = 13;
            break;
          case 9:
            file = files[0];
            _context3.p = 10;
            _context3.n = 11;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              return setUploadProgress(function (p) {
                return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, target, pct));
              });
            });
          case 11:
            url = _context3.v;
            if (target === 'product') setProductImage(url);else setAvatarImage(url);
            _context3.n = 13;
            break;
          case 12:
            _context3.p = 12;
            _t4 = _context3.v;
            alert(_t4.message);
          case 13:
            setUploadProgress(function (p) {
              return _objectSpread(_objectSpread({}, p), {}, _defineProperty({}, target, 0));
            });
          case 14:
            return _context3.a(2);
        }
      }, _callee2, null, [[10, 12], [2, 6, 7, 8]]);
    }));
    return function handleUpload(_x3, _x4) {
      return _ref6.apply(this, arguments);
    };
  }();
  var handleGenerate = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var result, entry, _err$message, _t5;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (prompt.trim()) {
              _context4.n = 1;
              break;
            }
            return _context4.a(2, alert(copy.errors.missingScript));
          case 1:
            if (productImage) {
              _context4.n = 2;
              break;
            }
            return _context4.a(2, alert(copy.errors.missingProductImage));
          case 2:
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            setIsGenerating(true);
            _context4.p = 3;
            _context4.n = 4;
            return (0, _muapi.generateMarketingStudioAd)(apiKey, {
              prompt: prompt,
              aspect_ratio: params.ratio,
              duration: params.duration,
              resolution: params.res,
              images_list: [productImage, avatarImage].concat(_toConsumableArray(additionalImages)).filter(Boolean),
              video_files: params.videoUrl ? [params.videoUrl] : []
            });
          case 4:
            result = _context4.v;
            if (result !== null && result !== void 0 && result.url) {
              entry = {
                id: Date.now(),
                url: result.url,
                prompt: prompt,
                format: params.format,
                timestamp: new Date().toISOString()
              };
              if (!historyItems) {
                setLocalHistory(function (prev) {
                  return [entry].concat(_toConsumableArray(prev));
                });
              }
              setFullscreenUrl(result.url);
              onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete({
                url: result.url,
                type: "video"
              });
            }
            _context4.n = 6;
            break;
          case 5:
            _context4.p = 5;
            _t5 = _context4.v;
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(((_err$message = _t5.message) === null || _err$message === void 0 ? void 0 : _err$message.slice(0, 120)) || copy.errors.generationFailed);
          case 6:
            _context4.p = 6;
            setIsGenerating(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context4.f(6);
          case 7:
            return _context4.a(2);
        }
      }, _callee3, null, [[3, 5, 6, 7]]);
    }));
    return function handleGenerate() {
      return _ref7.apply(this, arguments);
    };
  }();

  // ── Render ─────────────────────────────────────────────────────────────────

  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("style", {
      children: SCROLLBAR_STYLE
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2",
      children: history.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up",
        children: history.map(function (entry) {
          var _entry$prompt;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            onClick: function onClick() {
              return setFullscreenUrl(entry.url);
            },
            className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
              src: entry.url,
              className: "w-full aspect-video object-cover hover:opacity-80 transition-opacity",
              muted: true,
              loop: true,
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
                onClick: function onClick(e) {
                  e.stopPropagation();
                  downloadFile(entry.url, "marketing-ad-".concat(entry.id, ".mp4"));
                },
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10",
                title: copy.buttons.download,
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
                title: ((_entry$prompt = entry.prompt) === null || _entry$prompt === void 0 ? void 0 : _entry$prompt.substring(0, 50)) || 'Marketing ad',
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
                title: copy.buttons["delete"],
                onClick: function onClick(e) {
                  e.stopPropagation();
                  if (confirm(copy.confirm.deleteItem)) {
                    if (!historyItems) {
                      setLocalHistory(function (prev) {
                        return prev.filter(function (h) {
                          return h.id !== entry.id;
                        });
                      });
                    }
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
                label: copy.buttons.download,
                onSelect: function onSelect() {
                  return downloadFile(entry.url, "marketing-ad-".concat(entry.id, ".mp4"));
                }
              }, {
                kind: "delete",
                label: copy.buttons["delete"],
                danger: true,
                onSelect: function onSelect() {
                  if (confirm(copy.confirm.deleteItem)) {
                    if (!historyItems) {
                      setLocalHistory(function (prev) {
                        return prev.filter(function (item) {
                          return item.id !== entry.id;
                        });
                      });
                    }
                  }
                }
              }]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex items-center justify-between gap-2",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center gap-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[9px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 uppercase tracking-tighter",
                  children: copy.history.badge
                }), entry.format && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[9px] text-white/40 font-bold",
                  children: entry.format
                })]
              })
            })]
          }, entry.id);
        })
      }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-center gap-1.5 md:gap-3 mb-10 select-none scale-90 sm:scale-100",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/sdxl-image.avif",
              alt: copy.alt.creativeAsset.replace("{index}", "1"),
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[4deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/chroma-image.avif",
              alt: copy.alt.creativeAsset.replace("{index}", "2"),
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-18 sm:w-24 sm:h-24 rounded-full border border-white/10 shadow-2xl rotate-[6deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif",
              alt: copy.alt.creativeAsset.replace("{index}", "3"),
              className: "w-full h-full object-cover"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/perfect-pony-xl.avif",
              alt: copy.alt.creativeAsset.replace("{index}", "4"),
              className: "w-full h-full object-cover"
            })
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("h1", {
          className: "text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center px-4 flex flex-col items-center",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-white font-black uppercase text-xl sm:text-3xl tracking-wide mb-1 opacity-90",
            children: copy.empty.titleLine1
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight",
            children: copy.empty.titleLine2
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4",
          children: copy.empty.subtitle
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptComposer, {
      children: [additionalImages.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-center gap-1.5",
        children: additionalImages.map(function (img, idx) {
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group/img flex-shrink-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: img,
              className: "w-9 h-9 rounded-full object-cover border border-white/10"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setAdditionalImages(function (prev) {
                  return prev.filter(function (_, i) {
                    return i !== idx;
                  });
                });
              },
              className: "absolute -top-1 -right-1 w-3.5 h-3.5 bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity border border-white/10",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)(CloseSvg, {})
            })]
          }, idx);
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-full relative",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptTextarea, {
          ref: textareaRef,
          value: prompt,
          onChange: function onChange(e) {
            return setPrompt(e.target.value);
          },
          placeholder: copy.prompt.placeholder
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptFooter, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptControls, {
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-1.5 pr-3 border-r border-white/10",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(UploadSlot, {
              label: copy.uploadSlots.product,
              title: "".concat(copy.uploadSlots.uploadPrefix, " ").concat(copy.uploadSlots.product),
              icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(ProductIcon, {}),
              url: productImage,
              progress: uploadProgress.product,
              onUpload: function onUpload(files) {
                return handleUpload(files, 'product');
              },
              onClear: function onClear() {
                return setProductImage(null);
              }
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(UploadSlot, {
              label: copy.uploadSlots.avatar,
              title: "".concat(copy.uploadSlots.uploadPrefix, " ").concat(copy.uploadSlots.avatar),
              icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(AvatarIcon, {}),
              url: avatarImage,
              progress: uploadProgress.avatar,
              onUpload: function onUpload(files) {
                return handleUpload(files, 'avatar');
              },
              onClear: function onClear() {
                return setAvatarImage(null);
              }
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(UploadSlot, {
              label: copy.uploadSlots.references,
              title: "".concat(copy.uploadSlots.uploadPrefix, " ").concat(copy.uploadSlots.references),
              icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(RefIcon, {}),
              url: additionalImages[0],
              progress: uploadProgress.additional,
              multiple: true,
              images: additionalImages,
              onUpload: function onUpload(files) {
                return handleUpload(files, 'additional');
              },
              onClear: function onClear(idx) {
                if (idx !== undefined) {
                  setAdditionalImages(function (prev) {
                    return prev.filter(function (_, i) {
                      return i !== idx;
                    });
                  });
                } else {
                  setAdditionalImages([]);
                }
              }
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick(e) {
                e.stopPropagation();
                setDropdown(dropdown === 'format' ? null : 'format');
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: dropdown === "format"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-4 h-4 bg-primary/10 rounded flex items-center justify-center border border-primary/20",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[8px] font-black text-primary uppercase",
                  children: "U"
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: params.format
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
              isOpen: dropdown === 'format',
              title: copy.dropdowns.videoFormatPresets,
              items: ASSETS.ugc,
              selectedId: params.format,
              onSelect: function onSelect(item) {
                return setParams(_objectSpread(_objectSpread({}, params), {}, {
                  format: item.name,
                  videoUrl: item.url
                }));
              },
              onClose: function onClose() {
                return setDropdown(null);
              },
              isVideo: true,
              copy: copy
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative flex items-center gap-1.5",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick(e) {
                e.stopPropagation();
                setDropdown(dropdown === 'avatar' ? null : 'avatar');
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: dropdown === "avatar"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-4 h-4 rounded-full overflow-hidden border border-white/20 shadow-inner",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                  src: avatarImage || ASSETS.avatar[0].url,
                  className: "w-full h-full object-cover"
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: ((_ASSETS$avatar$find = ASSETS.avatar.find(function (a) {
                  return a.url === avatarImage;
                })) === null || _ASSETS$avatar$find === void 0 ? void 0 : _ASSETS$avatar$find.name) || copy.dropdowns.selectAvatarFallback
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), avatarImage && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              title: copy.buttons.enlargeSelectedAvatar,
              onClick: function onClick(e) {
                e.stopPropagation();
                var currentAvatar = ASSETS.avatar.find(function (a) {
                  return a.url === avatarImage;
                });
                if (currentAvatar) {
                  setPreviewAvatar(currentAvatar);
                } else {
                  setPreviewAvatar({
                    id: "custom",
                    name: "Custom Uploaded Avatar",
                    url: avatarImage
                  });
                }
              },
              className: (0, _PromptComposer.promptControlClassName)({
                iconOnly: true,
                className: "text-white/40 hover:text-[#22d3ee]"
              }),
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                  cx: "11",
                  cy: "11",
                  r: "8"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "21",
                  y1: "21",
                  x2: "16.65",
                  y2: "16.65"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "11",
                  y1: "8",
                  x2: "11",
                  y2: "14"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "8",
                  y1: "11",
                  x2: "14",
                  y2: "11"
                })]
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
              isOpen: dropdown === 'avatar',
              title: copy.dropdowns.avatarPresets,
              items: ASSETS.avatar,
              selectedId: avatarImage,
              onSelect: function onSelect(item) {
                return setAvatarImage(item.url);
              },
              onPreview: function onPreview(item) {
                return setPreviewAvatar(item);
              },
              onClose: function onClose() {
                return setDropdown(null);
              },
              copy: copy
            })]
          }), ['ratio', 'res', 'duration'].map(function (key) {
            return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setDropdown(dropdown === key ? null : key);
                },
                className: (0, _PromptComposer.promptControlClassName)({
                  active: dropdown === key,
                  className: dropdown === key ? "text-xs font-semibold text-[#22d3ee]" : "text-xs font-semibold text-white/70"
                }),
                children: [key === "ratio" ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAspectRatioIcon, {}) : key === "res" ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptQualityIcon, {}) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptDurationIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                  children: key === "duration" ? "".concat(params[key], "s") : params[key]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(SimpleDropdown, {
                isOpen: dropdown === key,
                title: key === "ratio" ? copy.dropdowns.aspectRatio : key === "res" ? copy.dropdowns.resolution : copy.dropdowns.duration,
                options: OPTIONS[key],
                selected: params[key],
                onSelect: function onSelect(val) {
                  return setParams(_objectSpread(_objectSpread({}, params), {}, _defineProperty({}, key, val)));
                },
                onClose: function onClose() {
                  return setDropdown(null);
                }
              })]
            }, key);
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAction, {
          onClick: handleGenerate,
          disabled: isGenerating,
          children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "animate-spin inline-block text-black",
              children: "\u25CC"
            }), copy.buttons.generating]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: copy.buttons.launch
          })
        })]
      })]
    }), fullscreenUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in",
      onClick: function onClick() {
        return setFullscreenUrl(null);
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        className: "absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white border border-white/10 transition-colors shadow-2xl",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(CloseSvg, {})
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
        src: fullscreenUrl,
        controls: true,
        autoPlay: true,
        className: "max-w-[95vw] max-h-[95vh] rounded-lg shadow-4xl animate-scale-up",
        onClick: function onClick(e) {
          return e.stopPropagation();
        }
      })]
    }), previewAvatar && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in select-none",
      onClick: function onClick() {
        return setPreviewAvatar(null);
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        className: "absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10 z-50 animate-fade-in",
        onClick: function onClick(e) {
          e.stopPropagation();
          setPreviewAvatar(null);
        },
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(CloseSvg, {})
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("style", {
        children: "\n            @keyframes slide-in-next {\n              0% {\n                transform: translateX(80px) scale(0.95);\n                filter: blur(4px);\n                opacity: 0.5;\n              }\n              100% {\n                transform: translateX(0) scale(1);\n                filter: blur(0);\n                opacity: 1;\n              }\n            }\n            @keyframes slide-in-prev {\n              0% {\n                transform: translateX(-80px) scale(0.95);\n                filter: blur(4px);\n                opacity: 0.5;\n              }\n              100% {\n                transform: translateX(0) scale(1);\n                filter: blur(0);\n                opacity: 1;\n              }\n            }\n            .animate-slide-next {\n              animation: slide-in-next 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;\n            }\n            .animate-slide-prev {\n              animation: slide-in-prev 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;\n            }\n          "
      }), previewAvatar.id !== "custom" && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        className: "absolute left-6 p-4 bg-white/5 hover:bg-white/10 hover:text-primary rounded-full text-white transition-all border border-white/10 z-50",
        onClick: function onClick(e) {
          e.stopPropagation();
          var currentIndex = ASSETS.avatar.findIndex(function (a) {
            return a.id === previewAvatar.id;
          });
          if (currentIndex !== -1) {
            var prevAvatar = ASSETS.avatar[(currentIndex - 1 + ASSETS.avatar.length) % ASSETS.avatar.length];
            setSlideDirection("prev");
            setPreviewAvatar(prevAvatar);
          }
        },
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "24",
          height: "24",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "3",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
            points: "15 18 9 12 15 6"
          })
        })
      }), previewAvatar.id !== "custom" && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        className: "absolute right-6 p-4 bg-white/5 hover:bg-white/10 hover:text-primary rounded-full text-white transition-all border border-white/10 z-50",
        onClick: function onClick(e) {
          e.stopPropagation();
          var currentIndex = ASSETS.avatar.findIndex(function (a) {
            return a.id === previewAvatar.id;
          });
          if (currentIndex !== -1) {
            var nextAvatar = ASSETS.avatar[(currentIndex + 1) % ASSETS.avatar.length];
            setSlideDirection("next");
            setPreviewAvatar(nextAvatar);
          }
        },
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "24",
          height: "24",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "3",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
            points: "9 18 15 12 9 6"
          })
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-6 md:gap-12 max-w-[95vw] justify-center relative",
        children: [previewAvatar.id !== "custom" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          onClick: function onClick(e) {
            e.stopPropagation();
            var currentIndex = ASSETS.avatar.findIndex(function (a) {
              return a.id === previewAvatar.id;
            });
            if (currentIndex !== -1) {
              var prevAvatar = ASSETS.avatar[(currentIndex - 1 + ASSETS.avatar.length) % ASSETS.avatar.length];
              setSlideDirection("prev");
              setPreviewAvatar(prevAvatar);
            }
          },
          className: "hidden md:flex flex-col items-center opacity-50 hover:opacity-60 scale-75 hover:scale-80 transition-all duration-300 cursor-pointer select-none max-w-[15vw] max-h-[50vh] rounded-xl overflow-hidden border border-white/5 bg-[#0d0d0f]/50",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: ASSETS.avatar[(ASSETS.avatar.findIndex(function (a) {
              return a.id === previewAvatar.id;
            }) - 1 + ASSETS.avatar.length) % ASSETS.avatar.length].url,
            alt: copy.alt.previousAvatar,
            className: "w-full h-full object-cover aspect-[3/4]"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "relative flex flex-col items-center max-w-[90vw] md:max-w-[45vw] max-h-[85vh] z-10 ".concat(slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"),
          onClick: function onClick(e) {
            return e.stopPropagation();
          },
          children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0f] shadow-2xl",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: previewAvatar.url,
              alt: previewAvatar.name,
              className: "max-w-[80vw] md:max-w-[40vw] max-h-[70vh] md:max-h-[65vh] object-contain"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-10 flex flex-col items-center justify-end gap-3",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
                className: "text-xl font-black text-white tracking-wide uppercase",
                children: previewAvatar.name
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: function onClick() {
                  setAvatarImage(previewAvatar.url);
                  setPreviewAvatar(null);
                  setDropdown(null);
                },
                className: "bg-[#22d3ee] text-black px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-95 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#22d3ee]/20",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {}), copy.buttons.selectAvatar]
              })]
            })]
          })
        }, previewAvatar.id), previewAvatar.id !== "custom" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          onClick: function onClick(e) {
            e.stopPropagation();
            var currentIndex = ASSETS.avatar.findIndex(function (a) {
              return a.id === previewAvatar.id;
            });
            if (currentIndex !== -1) {
              var nextAvatar = ASSETS.avatar[(currentIndex + 1) % ASSETS.avatar.length];
              setSlideDirection("next");
              setPreviewAvatar(nextAvatar);
            }
          },
          className: "hidden md:flex flex-col items-center opacity-50 hover:opacity-60 scale-75 hover:scale-80 transition-all duration-300 cursor-pointer select-none max-w-[15vw] max-h-[50vh] rounded-xl overflow-hidden border border-white/5 bg-[#0d0d0f]/50",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: ASSETS.avatar[(ASSETS.avatar.findIndex(function (a) {
              return a.id === previewAvatar.id;
            }) + 1) % ASSETS.avatar.length].url,
            alt: copy.alt.nextAvatar,
            className: "w-full h-full object-cover aspect-[3/4]"
          })
        })]
      })]
    })]
  });
}