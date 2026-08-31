"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = CinemaStudio;
var _react = require("react");
var _SocialPublishProvider = require("../../../../components/SocialPublishProvider");
var _AiAssistantProvider = require("../../../../components/AiAssistantProvider");
var _muapi = require("../muapi.js");
var _skillStore = require("../lib/skillStore");
var _registry = _interopRequireDefault(require("../skills/registry.json"));
var _promptRecipes = require("../lib/promptRecipes");
var _useTemplateData2 = require("../hooks/useTemplateData");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
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
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; } // ─── Constants (inlined from promptUtils) ───────────────────────────────────
var CAMERA_MAP = {
  "Modular 8K Digital": "modular 8K digital cinema camera",
  "Full-Frame Cine Digital": "full-frame digital cinema camera",
  "Grand Format 70mm Film": "grand format 70mm film camera",
  "Studio Digital S35": "Super 35 studio digital camera",
  "Classic 16mm Film": "classic 16mm film camera",
  "Premium Large Format Digital": "premium large-format digital cinema camera"
};
var LENS_MAP = {
  "Creative Tilt Lens": "creative tilt lens effect",
  "Compact Anamorphic": "compact anamorphic lens",
  "Extreme Macro": "extreme macro lens",
  "70s Cinema Prime": "1970s cinema prime lens",
  "Classic Anamorphic": "classic anamorphic lens",
  "Premium Modern Prime": "premium modern prime lens",
  "Warm Cinema Prime": "warm-toned cinema prime lens",
  "Swirl Bokeh Portrait": "swirl bokeh portrait lens",
  "Vintage Prime": "vintage prime lens",
  "Halation Diffusion": "halation diffusion filter",
  "Clinical Sharp Prime": "ultra-sharp clinical prime lens"
};
var FOCAL_PERSPECTIVE = {
  8: "ultra-wide perspective",
  14: "wide-angle perspective",
  24: "wide-angle dynamic perspective",
  35: "natural cinematic perspective",
  50: "standard portrait perspective",
  85: "classic portrait perspective"
};
var APERTURE_EFFECT = {
  "f/1.4": "shallow depth of field, creamy bokeh",
  "f/4": "balanced depth of field",
  "f/11": "deep focus clarity, sharp foreground to background"
};
var ASSET_URLS = {
  "Modular 8K Digital": "/assets/cinema/modular_8k_digital.webp",
  "Full-Frame Cine Digital": "/assets/cinema/full_frame_cine_digital.webp",
  "Grand Format 70mm Film": "/assets/cinema/grand_format_70mm_film.webp",
  "Studio Digital S35": "/assets/cinema/studio_digital_s35.webp",
  "Classic 16mm Film": "/assets/cinema/classic_16mm_film.webp",
  "Premium Large Format Digital": "/assets/cinema/premium_large_format_digital.webp",
  "Creative Tilt Lens": "/assets/cinema/creative_tilt_lens.webp",
  "Compact Anamorphic": "/assets/cinema/compact_anamorphic.webp",
  "Extreme Macro": "/assets/cinema/extreme_macro.webp",
  "70s Cinema Prime": "/assets/cinema/70s_cinema_prime.webp",
  "Classic Anamorphic": "/assets/cinema/classic_anamorphic.webp",
  "Premium Modern Prime": "/assets/cinema/premium_modern_prime.webp",
  "Warm Cinema Prime": "/assets/cinema/warm_cinema_prime.webp",
  "Swirl Bokeh Portrait": "/assets/cinema/swirl_bokeh_portrait.webp",
  "Vintage Prime": "/assets/cinema/vintage_prime.webp",
  "Halation Diffusion": "/assets/cinema/halation_diffusion.webp",
  "Clinical Sharp Prime": "/assets/cinema/clinical_sharp_prime.webp",
  "f/1.4": "/assets/cinema/f_1_4.webp",
  "f/4": "/assets/cinema/f_4.webp",
  "f/11": "/assets/cinema/f_11.webp"
};
var ASPECT_RATIOS = ["16:9", "21:9", "9:16", "1:1", "4:5"];
var RESOLUTIONS = ["1K", "2K", "4K"];
var CAMERAS = Object.keys(CAMERA_MAP);
var LENSES = Object.keys(LENS_MAP);
var FOCAL_LENGTHS = Object.keys(FOCAL_PERSPECTIVE).map(function (k) {
  return parseInt(k);
});
var APERTURES = Object.keys(APERTURE_EFFECT);
function buildNanoBananaPrompt(basePrompt, camera, lens, focalLength, aperture) {
  var cameraDesc = CAMERA_MAP[camera] || camera;
  var lensDesc = LENS_MAP[lens] || lens;
  var perspective = FOCAL_PERSPECTIVE[focalLength] || "";
  var depthEffect = APERTURE_EFFECT[aperture] || "";
  var qualityTags = ["professional photography", "ultra-detailed", "8K resolution"];
  var parts = [basePrompt, "shot on a ".concat(cameraDesc), "using a ".concat(lensDesc, " at ").concat(focalLength, "mm ").concat(perspective ? "(".concat(perspective, ")") : ""), "aperture ".concat(aperture), depthEffect, "cinematic lighting", "natural color science", "high dynamic range", qualityTags.join(", ")];
  return parts.filter(function (p) {
    return p && p.trim() !== "";
  }).join(", ");
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

function Dropdown(_ref) {
  var items = _ref.items,
    selected = _ref.selected,
    onSelect = _ref.onSelect,
    triggerRef = _ref.triggerRef,
    onClose = _ref.onClose;
  var menuRef = (0, _react.useRef)(null);
  var _useState = (0, _react.useState)({
      bottom: 0,
      left: 0
    }),
    _useState2 = _slicedToArray(_useState, 2),
    position = _useState2[0],
    setPosition = _useState2[1];
  (0, _react.useEffect)(function () {
    var handler = function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && triggerRef.current && !triggerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return function () {
      return document.removeEventListener("mousedown", handler);
    };
  }, [onClose, triggerRef]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    ref: menuRef,
    className: "custom-dropdown absolute bottom-[calc(100%+8px)] left-0 bg-[#1a1a1a] border border-white/10 rounded py-1 shadow-2xl z-50 flex flex-col min-w-[120px] animate-fade-in",
    children: items.map(function (item) {
      return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        className: "px-3 py-2 text-xs font-bold text-left hover:bg-white/10 transition-colors ".concat(item === selected ? "text-primary" : "text-white"),
        onClick: function onClick(e) {
          e.stopPropagation();
          onSelect(item);
          onClose();
        },
        children: item
      }, item);
    })
  });
}

// ─── Scroll Column (Camera Controls) ─────────────────────────────────────────

function ScrollColumn(_ref2) {
  var title = _ref2.title,
    items = _ref2.items,
    columnKey = _ref2.columnKey,
    value = _ref2.value,
    onChange = _ref2.onChange;
  var listRef = (0, _react.useRef)(null);
  var isDragging = (0, _react.useRef)(false);
  var startY = (0, _react.useRef)(0);
  var scrollTopStart = (0, _react.useRef)(0);
  var isSnapEnabled = (0, _react.useRef)(true);

  // Scroll to initial value on mount
  (0, _react.useEffect)(function () {
    var list = listRef.current;
    if (!list) return;
    var timer = setTimeout(function () {
      var target = Array.from(list.children).find(function (c) {
        return c.dataset.value == String(value);
      });
      if (target) target.scrollIntoView({
        block: "center"
      });
    }, 100);
    return function () {
      return clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  var handleScroll = (0, _react.useCallback)(function () {
    var list = listRef.current;
    if (!list) return;
    var centerY = list.scrollTop + list.clientHeight / 2;
    var closest = null;
    var minDist = Infinity;
    var children = Array.from(list.children).filter(function (c) {
      return c.dataset.value;
    });
    children.forEach(function (child) {
      var childCenter = child.offsetTop + child.offsetHeight / 2;
      var dist = Math.abs(centerY - childCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = child;
      }
    });
    children.forEach(function (child) {
      var imgBox = child.querySelector("[data-imgbox]");
      var label = child.querySelector("[data-label]");
      var isClosest = child === closest;
      if (isClosest) {
        child.classList.remove("opacity-20", "scale-90");
        child.classList.add("opacity-100", "scale-100", "z-30");
        if (imgBox) {
          imgBox.classList.add("border-primary/40", "bg-primary/5", "scale-110");
          imgBox.classList.remove("border-transparent", "bg-transparent");
        }
        if (label) label.classList.add("text-primary");
      } else {
        child.classList.add("opacity-20", "scale-90");
        child.classList.remove("opacity-100", "scale-100", "z-30");
        if (imgBox) {
          imgBox.classList.remove("border-primary/40", "bg-primary/5", "scale-110");
          imgBox.classList.add("border-transparent", "bg-transparent");
        }
        if (label) label.classList.remove("text-primary");
      }
    });
    if (closest) {
      var newVal = columnKey === "focal" ? parseInt(closest.dataset.value) : closest.dataset.value;
      if (String(newVal) !== String(value)) {
        onChange(newVal);
      }
    }
  }, [columnKey, value, onChange]);

  // Attach scroll handler with initial check
  (0, _react.useEffect)(function () {
    var list = listRef.current;
    if (!list) return;
    list.addEventListener("scroll", handleScroll);
    var timer = setTimeout(handleScroll, 150);
    return function () {
      list.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [handleScroll]);

  // Mouse drag handlers
  var onMouseDown = function onMouseDown(e) {
    isDragging.current = true;
    isSnapEnabled.current = false;
    listRef.current.classList.add("cursor-grabbing");
    listRef.current.classList.remove("snap-y");
    startY.current = e.pageY - listRef.current.offsetTop;
    scrollTopStart.current = listRef.current.scrollTop;
    e.preventDefault();
  };
  var onMouseLeave = function onMouseLeave() {
    isDragging.current = false;
    listRef.current.classList.remove("cursor-grabbing");
    listRef.current.classList.add("snap-y");
  };
  var onMouseUp = function onMouseUp() {
    isDragging.current = false;
    listRef.current.classList.remove("cursor-grabbing");
    listRef.current.classList.add("snap-y");
  };
  var onMouseMove = function onMouseMove(e) {
    if (!isDragging.current) return;
    e.preventDefault();
    var y = e.pageY - listRef.current.offsetTop;
    var walk = (y - startY.current) * 1.5;
    listRef.current.scrollTop = scrollTopStart.current - walk;
  };
  var onItemClick = function onItemClick(item) {
    var list = listRef.current;
    if (!list) return;
    var target = Array.from(list.children).find(function (c) {
      return c.dataset.value == String(item);
    });
    if (target) target.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  };
  var getSelectedDescription = function getSelectedDescription() {
    if (columnKey === 'camera') return CAMERA_MAP[value] || '';
    if (columnKey === 'lens') return LENS_MAP[value] || '';
    if (columnKey === 'focal') return FOCAL_PERSPECTIVE[value] || '';
    if (columnKey === 'aperture') return APERTURE_EFFECT[value] || '';
    return '';
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col items-center relative w-[130px] md:w-[150px] shrink-0 snap-center",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "mb-4 text-[10px] font-black text-white/20 uppercase tracking-[0.25em] text-center",
      children: title
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "relative overflow-hidden w-full h-[280px] md:h-[300px] bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl border border-white/[0.03] shadow-2xl backdrop-blur-3xl group",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0a0a0a] to-transparent z-20 pointer-events-none"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[70px] bg-white/[0.02] border border-white/[0.05] rounded-xl pointer-events-none z-0"
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        ref: listRef,
        className: "h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10",
        onMouseDown: onMouseDown,
        onMouseLeave: onMouseLeave,
        onMouseUp: onMouseUp,
        onMouseMove: onMouseMove,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          style: {
            height: "calc(50% - 35px)"
          }
        }), items.map(function (item) {
          var imageUrl = ASSET_URLS[item];
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            "data-value": item,
            className: "h-[70px] flex flex-col items-center justify-center gap-2 snap-center cursor-pointer transition-all duration-300 ease-out text-white p-2 select-none opacity-20 scale-90",
            onClick: function onClick() {
              return onItemClick(item);
            },
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              "data-imgbox": "true",
              className: "w-10 h-10 rounded-lg border border-transparent flex items-center justify-center transition-all duration-300 overflow-hidden relative",
              children: imageUrl ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                src: imageUrl,
                alt: String(item),
                className: "w-full h-full object-cover opacity-70"
              }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-sm font-bold text-white/40",
                children: item
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              "data-label": "true",
              className: "text-[8px] md:text-[9px] font-black uppercase text-center leading-tight max-w-full truncate px-1 tracking-widest text-white/60",
              children: item
            })]
          }, item);
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          style: {
            height: "calc(50% - 35px)"
          }
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "mt-4 h-8 px-2 text-center",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-[9px] font-medium text-primary/60 uppercase tracking-widest animate-fade-in inline-block leading-tight",
        children: getSelectedDescription()
      })
    })]
  });
}
function CameraControlsOverlay(_ref3) {
  var isOpen = _ref3.isOpen,
    onClose = _ref3.onClose,
    settings = _ref3.settings,
    onSettingsChange = _ref3.onSettingsChange;
  var backdropRef = (0, _react.useRef)(null);
  var handleBackdropClick = function handleBackdropClick(e) {
    if (e.target === backdropRef.current) onClose();
  };
  var updateSetting = function updateSetting(key) {
    return function (val) {
      onSettingsChange(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, val));
      });
    };
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    ref: backdropRef,
    className: "fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-2xl z-[100] flex items-center justify-center transition-all duration-500 ".concat(isOpen ? "opacity-100" : "opacity-0 pointer-events-none"),
    onClick: handleBackdropClick,
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "w-full max-w-5xl bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] transform transition-all duration-500 flex flex-col max-h-[90vh] ".concat(isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-10"),
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center justify-between mb-8",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col gap-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
            className: "text-2xl font-black text-white tracking-tighter uppercase italic",
            children: "Camera Config"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "h-[1px] w-12 bg-primary/40"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: onClose,
          className: "w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M18 6L6 18M6 6l12 12"
            })
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "w-full flex justify-start md:justify-center gap-3 md:gap-6 py-4 md:py-8 overflow-x-auto no-scrollbar snap-x px-4 md:px-0",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollColumn, {
          title: "Camera",
          items: CAMERAS,
          columnKey: "camera",
          value: settings.camera,
          onChange: updateSetting("camera")
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollColumn, {
          title: "Lens",
          items: LENSES,
          columnKey: "lens",
          value: settings.lens,
          onChange: updateSetting("lens")
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollColumn, {
          title: "Focal Length",
          items: FOCAL_LENGTHS,
          columnKey: "focal",
          value: settings.focal,
          onChange: updateSetting("focal")
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollColumn, {
          title: "Aperture",
          items: APERTURES,
          columnKey: "aperture",
          value: settings.aperture,
          onChange: updateSetting("aperture")
        })]
      })]
    })
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CinemaStudio(_ref4) {
  var apiKey = _ref4.apiKey,
    onGenerationComplete = _ref4.onGenerationComplete,
    historyItems = _ref4.historyItems,
    templateData = _ref4.templateData;
  var PERSIST_KEY = "hg_cinema_studio_persistent";

  // ── Settings state ──
  var _useState3 = (0, _react.useState)({
      prompt: "",
      aspect_ratio: "16:9",
      camera: CAMERAS[0],
      lens: LENSES[0],
      focal: 35,
      aperture: "f/1.4"
    }),
    _useState4 = _slicedToArray(_useState3, 2),
    settings = _useState4[0],
    setSettings = _useState4[1];
  var _useState5 = (0, _react.useState)("2K"),
    _useState6 = _slicedToArray(_useState5, 2),
    resolution = _useState6[0],
    setResolution = _useState6[1];

  // ── UI state ──
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    isOverlayOpen = _useState8[0],
    setIsOverlayOpen = _useState8[1];
  var _useState9 = (0, _react.useState)(false),
    _useState0 = _slicedToArray(_useState9, 2),
    isGenerating = _useState0[0],
    setIsGenerating = _useState0[1];
  var _useState1 = (0, _react.useState)(null),
    _useState10 = _slicedToArray(_useState1, 2),
    canvasUrl = _useState10[0],
    setCanvasUrl = _useState10[1]; // null = prompt view
  var _useState11 = (0, _react.useState)(null),
    _useState12 = _slicedToArray(_useState11, 2),
    fullscreenUrl = _useState12[0],
    setFullscreenUrl = _useState12[1];
  var _useState13 = (0, _react.useState)(null),
    _useState14 = _slicedToArray(_useState13, 2),
    uploadedImage = _useState14[0],
    setUploadedImage = _useState14[1];
  var _useState15 = (0, _react.useState)(false),
    _useState16 = _slicedToArray(_useState15, 2),
    isUploadingImage = _useState16[0],
    setIsUploadingImage = _useState16[1];
  var _useState17 = (0, _react.useState)(0),
    _useState18 = _slicedToArray(_useState17, 2),
    imageUploadProgress = _useState18[0],
    setImageUploadProgress = _useState18[1];
  var imageInputRef = (0, _react.useRef)(null);
  var _useState19 = (0, _react.useState)(null),
    _useState20 = _slicedToArray(_useState19, 2),
    activeHistoryIndex = _useState20[0],
    setactiveHistoryIndex = _useState20[1];

  // ── Internal history state (used when historyItems prop is not provided) ──
  var _useState21 = (0, _react.useState)([]),
    _useState22 = _slicedToArray(_useState21, 2),
    internalHistory = _useState22[0],
    setInternalHistory = _useState22[1];

  // ── Dropdown state ──
  var _useState23 = (0, _react.useState)(null),
    _useState24 = _slicedToArray(_useState23, 2),
    openDropdown = _useState24[0],
    setOpenDropdown = _useState24[1]; // 'ar' | 'res' | null
  var arBtnRef = (0, _react.useRef)(null);
  var resBtnRef = (0, _react.useRef)(null);

  // ── Textarea auto-grow ──
  var textareaRef = (0, _react.useRef)(null);
  var resultImgRef = (0, _react.useRef)(null);
  var handleImageUpload = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(e) {
      var _e$target$files;
      var file, url, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
            if (file) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setIsUploadingImage(true);
            setImageUploadProgress(0);
            _context.p = 2;
            _context.n = 3;
            return (0, _muapi.uploadFile)(apiKey, file, function (progress) {
              setImageUploadProgress(progress);
            });
          case 3:
            url = _context.v;
            if (url) setUploadedImage(url);
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            console.error("Image upload failed:", _t);
          case 5:
            _context.p = 5;
            setIsUploadingImage(false);
            setImageUploadProgress(0);
            if (imageInputRef.current) imageInputRef.current.value = "";
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4, 5, 6]]);
    }));
    return function handleImageUpload(_x) {
      return _ref5.apply(this, arguments);
    };
  }();
  var removeImage = function removeImage() {
    setUploadedImage(null);
  };

  // ── Apply pending Skills recipe (set by SkillsBrowser) ────────────────────
  (0, _react.useEffect)(function () {
    var pending = (0, _skillStore.getPendingRecipe)("cinema");
    if (!pending) return;
    var skill = _registry["default"].skills.find(function (s) {
      return s.slug === pending;
    });
    (0, _skillStore.clearPendingRecipe)("cinema");
    if (!skill) return;
    applyRecipe(skill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function applyRecipe(skill) {
    var step0 = skill.steps && skill.steps[0];
    if (!step0) {
      if (skill.description) setSettings(function (s) {
        return _objectSpread(_objectSpread({}, s), {}, {
          prompt: skill.description
        });
      });
      return;
    }
    if (step0.prompt || skill.description) {
      setSettings(function (s) {
        return _objectSpread(_objectSpread({}, s), {}, {
          prompt: (0, _promptRecipes.fillTemplate)(step0.prompt || skill.description || "", {})
        });
      });
    }
    if (step0.aspectRatio) setSettings(function (s) {
      return _objectSpread(_objectSpread({}, s), {}, {
        aspect_ratio: step0.aspectRatio
      });
    });
    if (step0.resolution) setResolution(step0.resolution);
  }

  // ── Persistence: Load ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        if (data.settings) setSettings(data.settings);
        if (data.resolution) setResolution(data.resolution);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
        if (data.uploadedImage) setUploadedImage(data.uploadedImage);
      }
    } catch (err) {
      console.warn("Failed to load CinemaStudio persistence:", err);
    }
  }, []);

  // ── Apply template data from landing page "Create This Style" ──────────────
  var _useTemplateData = (0, _useTemplateData2.useTemplateData)(templateData, function (data) {
      if (data.prompt) {
        setSettings(function (s) {
          return _objectSpread(_objectSpread({}, s), {}, {
            prompt: data.prompt
          });
        });
      }
      if (data.aspectRatio) {
        var normalized = (0, _useTemplateData2.normalizeAspectRatio)(data.aspectRatio, "16:9");
        setSettings(function (s) {
          return _objectSpread(_objectSpread({}, s), {}, {
            aspect_ratio: normalized
          });
        });
      }
      if (data.resolution) {
        setResolution(data.resolution);
      }
    }),
    resetTemplate = _useTemplateData.reset,
    isTemplateApplied = _useTemplateData.isTemplateApplied;

  // ── Adjust height on load ────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      if (textareaRef.current) {
        var el = textareaRef.current;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
    }, 150);
    return function () {
      return clearTimeout(timer);
    };
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      try {
        var state = {
          settings: settings,
          resolution: resolution,
          internalHistory: internalHistory,
          uploadedImage: uploadedImage
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save CinemaStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return function () {
      return clearTimeout(timer);
    };
  }, [settings, resolution, internalHistory, uploadedImage]);

  // Derive effective history (prop wins over internal)
  var history = historyItems != null ? historyItems : internalHistory;
  (0, _react.useEffect)(function () {
    var _history$;
    setCanvasUrl(((_history$ = history[0]) === null || _history$ === void 0 ? void 0 : _history$.url) || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyItems]);
  var formatSummaryValue = function formatSummaryValue() {
    return "".concat(settings.lens, ", ").concat(settings.focal, "mm, ").concat(settings.aperture);
  };

  // ── Textarea auto-height ──
  var handleTextareaInput = function handleTextareaInput(e) {
    var el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    setSettings(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        prompt: el.value
      });
    });
  };

  // ── Generate ──
  var handleGenerate = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var basePrompt, finalPrompt, res, entry, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          basePrompt = settings.prompt.trim();
          if (!(!basePrompt || isGenerating)) {
            _context2.n = 1;
            break;
          }
          return _context2.a(2);
        case 1:
          setIsGenerating(true);
          finalPrompt = buildNanoBananaPrompt(basePrompt, settings.camera, settings.lens, settings.focal, settings.aperture);
          _context2.p = 2;
          _context2.n = 3;
          return (0, _muapi.generateImage)(apiKey, {
            model: uploadedImage ? "nano-banana-pro-edit" : "nano-banana-pro",
            prompt: finalPrompt,
            aspect_ratio: settings.aspect_ratio,
            resolution: resolution.toLowerCase(),
            negative_prompt: "blurry, low quality, distortion, bad composition",
            images_list: uploadedImage ? [uploadedImage] : []
          });
        case 3:
          res = _context2.v;
          if (!(res && res.url)) {
            _context2.n = 4;
            break;
          }
          entry = {
            url: res.url,
            timestamp: Date.now(),
            settings: {
              prompt: basePrompt,
              camera: settings.camera,
              lens: settings.lens,
              focal: settings.focal,
              aperture: settings.aperture,
              aspect_ratio: settings.aspect_ratio,
              resolution: resolution
            }
          }; // Only update internal history if not using prop-driven history
          if (historyItems == null) {
            setInternalHistory(function (prev) {
              return [entry].concat(_toConsumableArray(prev)).slice(0, 50);
            });
          }
          setCanvasUrl(res.url);
          if (onGenerationComplete) {
            onGenerationComplete({
              url: res.url,
              model: "nano-banana-pro",
              prompt: basePrompt,
              type: "cinema"
            });
          }
          _context2.n = 5;
          break;
        case 4:
          throw new Error("No data returned");
        case 5:
          _context2.n = 7;
          break;
        case 6:
          _context2.p = 6;
          _t2 = _context2.v;
          console.error(_t2);
          alert("Generation Failed: " + _t2.message);
        case 7:
          _context2.p = 7;
          setIsGenerating(false);
          return _context2.f(7);
        case 8:
          return _context2.a(2);
      }
    }, _callee2, null, [[2, 6, 7, 8]]);
  })), [settings, resolution, apiKey, isGenerating, onGenerationComplete, historyItems]);

  // ── Regenerate ──
  var handleRegenerate = (0, _react.useCallback)(function () {
    setCanvasUrl(null);
    // Small delay then generate
    setTimeout(function () {
      return handleGenerate();
    }, 300);
  }, [handleGenerate]);

  // ── Download ──
  var handleDownload = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var response, blob, blobUrl, a, _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          if (canvasUrl) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2);
        case 1:
          _context3.p = 1;
          _context3.n = 2;
          return fetch(canvasUrl);
        case 2:
          response = _context3.v;
          _context3.n = 3;
          return response.blob();
        case 3:
          blob = _context3.v;
          blobUrl = URL.createObjectURL(blob);
          a = document.createElement("a");
          a.href = blobUrl;
          a.download = "cinema-shot-".concat(Date.now(), ".jpg");
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          _context3.n = 5;
          break;
        case 4:
          _context3.p = 4;
          _t3 = _context3.v;
          window.open(canvasUrl, "_blank");
        case 5:
          return _context3.a(2);
      }
    }, _callee3, null, [[1, 4]]);
  })), [canvasUrl]);

  // ── Load history item ──
  var loadHistoryItem = function loadHistoryItem(entry, idx) {
    if (entry.settings) {
      setSettings(function (prev) {
        var _entry$settings$camer, _entry$settings$lens, _entry$settings$focal, _entry$settings$apert, _entry$settings$aspec, _entry$settings$promp;
        return _objectSpread(_objectSpread({}, prev), {}, {
          camera: (_entry$settings$camer = entry.settings.camera) !== null && _entry$settings$camer !== void 0 ? _entry$settings$camer : prev.camera,
          lens: (_entry$settings$lens = entry.settings.lens) !== null && _entry$settings$lens !== void 0 ? _entry$settings$lens : prev.lens,
          focal: (_entry$settings$focal = entry.settings.focal) !== null && _entry$settings$focal !== void 0 ? _entry$settings$focal : prev.focal,
          aperture: (_entry$settings$apert = entry.settings.aperture) !== null && _entry$settings$apert !== void 0 ? _entry$settings$apert : prev.aperture,
          aspect_ratio: (_entry$settings$aspec = entry.settings.aspect_ratio) !== null && _entry$settings$aspec !== void 0 ? _entry$settings$aspec : prev.aspect_ratio,
          prompt: (_entry$settings$promp = entry.settings.prompt) !== null && _entry$settings$promp !== void 0 ? _entry$settings$promp : prev.prompt
        });
      });
      if (entry.settings.resolution) setResolution(entry.settings.resolution);

      // Sync textarea height
      if (textareaRef.current) {
        textareaRef.current.value = entry.settings.prompt || "";
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      }
    }
    setCanvasUrl(entry.url);
  };
  var resetToPrompt = function resetToPrompt() {
    setCanvasUrl(null);
    setSettings(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        prompt: ""
      });
    });
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
      setTimeout(function () {
        var _textareaRef$current;
        return (_textareaRef$current = textareaRef.current) === null || _textareaRef$current === void 0 ? void 0 : _textareaRef$current.focus();
      }, 50);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2",
      children: history.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up",
        children: history.map(function (entry, idx) {
          var _entry$timestamp, _entry$settings, _entry$settings2, _entry$settings3, _entry$settings4, _entry$settings5;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-[#22d3ee]/50 transition-all duration-300 flex flex-col cursor-pointer",
            onClick: function onClick() {
              return loadHistoryItem(entry, idx);
            },
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: entry.url,
              alt: "History item ".concat(idx + 1),
              className: "w-full aspect-[4/3] object-cover bg-black/40"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Fullscreen",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setFullscreenUrl(entry.url);
                },
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10",
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
                onClick: (/*#__PURE__*/function () {
                  var _ref8 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(e) {
                    var response, blob, blobUrl, a, _t4;
                    return _regenerator().w(function (_context4) {
                      while (1) switch (_context4.p = _context4.n) {
                        case 0:
                          e.stopPropagation();
                          _context4.p = 1;
                          _context4.n = 2;
                          return fetch(entry.url);
                        case 2:
                          response = _context4.v;
                          _context4.n = 3;
                          return response.blob();
                        case 3:
                          blob = _context4.v;
                          blobUrl = URL.createObjectURL(blob);
                          a = document.createElement("a");
                          a.href = blobUrl;
                          a.download = "cinema-shot-".concat(entry.id || idx, ".jpg");
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                          _context4.n = 5;
                          break;
                        case 4:
                          _context4.p = 4;
                          _t4 = _context4.v;
                          window.open(entry.url, "_blank");
                        case 5:
                          return _context4.a(2);
                      }
                    }, _callee4, null, [[1, 4]]);
                  }));
                  return function (_x2) {
                    return _ref8.apply(this, arguments);
                  };
                }()),
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10",
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
                mediaType: "image",
                title: ((_entry$settings = entry.settings) === null || _entry$settings === void 0 || (_entry$settings = _entry$settings.prompt) === null || _entry$settings === void 0 ? void 0 : _entry$settings.substring(0, 50)) || 'Cinema shot',
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10 flex items-center justify-center"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_AiAssistantProvider.AssistStep, {
                assetUrl: entry.url,
                assetType: "image",
                onApply: function onApply() {},
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10 flex items-center justify-center",
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
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-white/70 text-xs line-clamp-3 leading-relaxed",
                children: ((_entry$settings2 = entry.settings) === null || _entry$settings2 === void 0 ? void 0 : _entry$settings2.prompt) || "No prompt"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center justify-between mt-1 flex-wrap gap-1",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] font-bold text-[#22d3ee] px-2 py-0.5 bg-[#22d3ee]/10 rounded border border-[#22d3ee]/20",
                  children: ((_entry$settings3 = entry.settings) === null || _entry$settings3 === void 0 ? void 0 : _entry$settings3.camera) || "Standard"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] text-white/40",
                    children: ((_entry$settings4 = entry.settings) === null || _entry$settings4 === void 0 ? void 0 : _entry$settings4.lens) || "35mm"
                  }), ((_entry$settings5 = entry.settings) === null || _entry$settings5 === void 0 ? void 0 : _entry$settings5.aspect_ratio) && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] text-white/40",
                    children: entry.settings.aspect_ratio
                  })]
                })]
              })]
            })]
          }, (_entry$timestamp = entry.timestamp) !== null && _entry$timestamp !== void 0 ? _entry$timestamp : idx);
        })
      }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in-up transition-all duration-700 min-h-[50vh]",
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
            children: "CINEMA STUDIO"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4",
          children: "What would you shoot with infinite budget? Control cameras, lighting, lenses, and prompt high-end cinematic scenes."
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute bottom-4 left-4 right-4 md:left-0 md:right-0 md:mx-auto md:max-w-[95%] lg:max-w-4xl z-30 transition-all duration-700 animate-fade-in-up",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "w-full bg-gradient-to-b from-[#18181c]/90 via-[#0f0f12]/90 to-[#0c0c0e]/95 backdrop-blur-2xl rounded-[2rem] border border-white/[0.08] p-4 flex flex-col gap-3 shadow-[0_15px_50px_rgba(0,0,0,0.8)]",
        children: [isTemplateApplied && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-between rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 px-3 py-2 text-xs text-[#22d3ee]",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "font-semibold",
            children: "Template loaded"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: resetTemplate,
            className: "rounded-md bg-white/5 px-2 py-1 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors",
            children: "Clear"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-start gap-4 w-full px-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative pt-0.5",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "file",
              ref: imageInputRef,
              className: "hidden",
              accept: "image/*",
              onChange: handleImageUpload
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                var _imageInputRef$curren;
                return uploadedImage ? removeImage() : (_imageInputRef$curren = imageInputRef.current) === null || _imageInputRef$curren === void 0 ? void 0 : _imageInputRef$curren.click();
              },
              disabled: isUploadingImage,
              className: "w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ".concat(uploadedImage ? "border-[#22d3ee]/60 bg-white/5" : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-[#22d3ee]/40", " group"),
              children: isUploadingImage ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
                    strokeDashoffset: 88 - 88 * imageUploadProgress / 100,
                    className: "text-primary transition-all duration-300"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                  className: "absolute text-[8px] font-bold text-white",
                  children: [imageUploadProgress, "%"]
                })]
              }) : uploadedImage ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "relative w-full h-full group",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                  src: uploadedImage,
                  alt: "Reference",
                  className: "w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                    width: "14",
                    height: "14",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "3",
                    className: "text-white",
                    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                      d: "M18 6L6 18M6 6l12 12"
                    })
                  })
                })]
              }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                className: "text-white/40 group-hover:text-[#22d3ee] transition-colors",
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
              })
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
            ref: textareaRef,
            value: settings.prompt,
            onChange: function onChange(e) {
              setSettings(function (prev) {
                return _objectSpread(_objectSpread({}, prev), {}, {
                  prompt: e.target.value
                });
              });
              var el = e.target;
              el.style.height = "auto";
              var maxH = window.innerWidth < 768 ? 150 : 250;
              el.style.height = Math.min(el.scrollHeight, maxH) + "px";
            },
            placeholder: "Describe your cinema scene...",
            className: "w-full bg-transparent border-none text-white text-sm placeholder:text-white/20 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar disabled:opacity-40",
            rows: 1
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-white/[0.03] relative",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 relative flex-wrap pb-1 md:pb-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                ref: arBtnRef,
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner text-[11px] font-semibold text-white/70 hover:text-white",
                onClick: function onClick() {
                  return setOpenDropdown(function (d) {
                    return d === "ar" ? null : "ar";
                  });
                },
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  className: "opacity-40",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                    x: "2",
                    y: "7",
                    width: "20",
                    height: "10",
                    rx: "2",
                    ry: "2"
                  })
                }), settings.aspect_ratio]
              }), openDropdown === "ar" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[140px]",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
                  items: ASPECT_RATIOS,
                  selected: settings.aspect_ratio,
                  onSelect: function onSelect(val) {
                    return setSettings(function (prev) {
                      return _objectSpread(_objectSpread({}, prev), {}, {
                        aspect_ratio: val
                      });
                    });
                  },
                  triggerRef: arBtnRef,
                  onClose: function onClose() {
                    return setOpenDropdown(null);
                  }
                })
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                ref: resBtnRef,
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner text-[11px] font-semibold text-white/70 hover:text-white",
                onClick: function onClick() {
                  return setOpenDropdown(function (d) {
                    return d === "res" ? null : "res";
                  });
                },
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  className: "opacity-40",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                  })
                }), resolution]
              }), openDropdown === "res" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[140px]",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
                  items: RESOLUTIONS,
                  selected: resolution,
                  onSelect: setResolution,
                  triggerRef: resBtnRef,
                  onClose: function onClose() {
                    return setOpenDropdown(null);
                  }
                })
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] text-left group overflow-hidden shadow-inner text-[11px] font-semibold text-white/70 hover:text-white",
              onClick: function onClick() {
                return setIsOverlayOpen(true);
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-1.5 h-1.5 bg-[#22d3ee] rounded-full shadow-lg shadow-[#22d3ee]/20 shrink-0"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "max-w-[120px] truncate text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                children: [settings.camera, " \xB7 ", formatSummaryValue()]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            className: "bg-[#22d3ee] text-black px-7 py-3 rounded-full font-black text-sm hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/20 hover:shadow-[#22d3ee]/35 border border-[#22d3ee]/10 z-10 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed",
            disabled: isGenerating || !settings.prompt.trim(),
            onClick: handleGenerate,
            children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "animate-spin inline-block text-black",
                children: "\u25CC"
              }), " SHOOTING..."]
            }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                children: "SHOOT"
              })
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
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: fullscreenUrl,
        alt: "Fullscreen Preview",
        className: "max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up",
        onClick: function onClick(e) {
          return e.stopPropagation();
        }
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(CameraControlsOverlay, {
      isOpen: isOverlayOpen,
      onClose: function onClose() {
        return setIsOverlayOpen(false);
      },
      settings: settings,
      onSettingsChange: setSettings
    })]
  });
}