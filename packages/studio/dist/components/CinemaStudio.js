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
var _TemplateBanner = _interopRequireDefault(require("./TemplateBanner"));
var _storyboardHandoff = require("../storyboardHandoff.js");
var _persistKey = require("../persistKey.js");
var _MobileGenerationActions = _interopRequireWildcard(require("./MobileGenerationActions.jsx"));
var _PromptComposer = require("./prompt/PromptComposer.jsx");
var _cinemaStudio = _interopRequireDefault(require("../messages/en/cinemaStudio.json"));
var _cinemaStudio2 = _interopRequireDefault(require("../messages/zh/cinemaStudio.json"));
var _i18nUtils = require("../i18nUtils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t8 in e) "default" !== _t8 && {}.hasOwnProperty.call(e, _t8) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t8)) && (i.get || i.set) ? o(f, _t8, i) : f[_t8] = e[_t8]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // ─── Constants (inlined from promptUtils) ───────────────────────────────────
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
function fetchImageAsPngBlob(_x) {
  return _fetchImageAsPngBlob.apply(this, arguments);
}
function _fetchImageAsPngBlob() {
  _fetchImageAsPngBlob = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(url) {
    var response, sourceBlob, objectUrl, image, canvas, context;
    return _regenerator().w(function (_context9) {
      while (1) switch (_context9.p = _context9.n) {
        case 0:
          _context9.n = 1;
          return fetch(url);
        case 1:
          response = _context9.v;
          if (response.ok) {
            _context9.n = 2;
            break;
          }
          throw new Error("Image request failed with status ".concat(response.status, "."));
        case 2:
          _context9.n = 3;
          return response.blob();
        case 3:
          sourceBlob = _context9.v;
          if (!(sourceBlob.type === "image/png")) {
            _context9.n = 4;
            break;
          }
          return _context9.a(2, sourceBlob);
        case 4:
          objectUrl = URL.createObjectURL(sourceBlob);
          _context9.p = 5;
          _context9.n = 6;
          return new Promise(function (resolve, reject) {
            var element = new Image();
            element.onload = function () {
              return resolve(element);
            };
            element.onerror = function () {
              return reject(new Error("Could not decode the image."));
            };
            element.src = objectUrl;
          });
        case 6:
          image = _context9.v;
          canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          context = canvas.getContext("2d");
          if (context) {
            _context9.n = 7;
            break;
          }
          throw new Error("Could not create an image clipboard canvas.");
        case 7:
          context.drawImage(image, 0, 0);
          _context9.n = 8;
          return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
              return blob ? resolve(blob) : reject(new Error("Could not convert the image to PNG."));
            }, "image/png");
          });
        case 8:
          return _context9.a(2, _context9.v);
        case 9:
          _context9.p = 9;
          URL.revokeObjectURL(objectUrl);
          return _context9.f(9);
        case 10:
          return _context9.a(2);
      }
    }, _callee9, null, [[5,, 9, 10]]);
  }));
  return _fetchImageAsPngBlob.apply(this, arguments);
}
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
  var title = _ref.title,
    items = _ref.items,
    selected = _ref.selected,
    onSelect = _ref.onSelect,
    triggerRef = _ref.triggerRef,
    onClose = _ref.onClose;
  var menuRef = (0, _react.useRef)(null);
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
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
    ref: menuRef,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
      children: title
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
      children: items.map(function (item) {
        return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
          selected: item === selected,
          onClick: function onClick(e) {
            e.stopPropagation();
            onSelect(item);
            onClose();
          },
          children: item
        }, item);
      })
    })]
  });
}

// Camera configuration controls

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
  (0, _react.useEffect)(function () {
    var list = listRef.current;
    if (!list) return undefined;
    var timer = setTimeout(function () {
      var target = Array.from(list.children).find(function (child) {
        return child.dataset.value === String(value);
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
    var children = Array.from(list.children).filter(function (child) {
      return child.dataset.value;
    });
    var closest = null;
    var minimumDistance = Infinity;
    children.forEach(function (child) {
      var childCenter = child.offsetTop + child.offsetHeight / 2;
      var distance = Math.abs(centerY - childCenter);
      if (distance < minimumDistance) {
        minimumDistance = distance;
        closest = child;
      }
    });
    children.forEach(function (child) {
      var selected = child === closest;
      child.dataset.selected = String(selected);
      child.setAttribute("aria-selected", String(selected));
    });
    if (closest) {
      var nextValue = columnKey === "focal" ? parseInt(closest.dataset.value, 10) : closest.dataset.value;
      if (String(nextValue) !== String(value)) onChange(nextValue);
    }
  }, [columnKey, onChange, value]);
  (0, _react.useEffect)(function () {
    var list = listRef.current;
    if (!list) return undefined;
    list.addEventListener("scroll", handleScroll);
    var timer = setTimeout(handleScroll, 150);
    return function () {
      list.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [handleScroll]);
  var handleMouseDown = function handleMouseDown(event) {
    var list = listRef.current;
    if (!list) return;
    isDragging.current = true;
    list.classList.add("cursor-grabbing");
    list.classList.remove("snap-y");
    startY.current = event.pageY - list.offsetTop;
    scrollTopStart.current = list.scrollTop;
    event.preventDefault();
  };
  var stopDragging = function stopDragging() {
    var list = listRef.current;
    isDragging.current = false;
    if (!list) return;
    list.classList.remove("cursor-grabbing");
    list.classList.add("snap-y");
  };
  var handleMouseMove = function handleMouseMove(event) {
    var list = listRef.current;
    if (!isDragging.current || !list) return;
    event.preventDefault();
    var y = event.pageY - list.offsetTop;
    list.scrollTop = scrollTopStart.current - (y - startY.current) * 1.5;
  };
  var handleItemClick = function handleItemClick(item) {
    var list = listRef.current;
    if (!list) return;
    var target = Array.from(list.children).find(function (child) {
      return child.dataset.value === String(item);
    });
    if (target) target.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("section", {
    className: "flex w-[170px] shrink-0 snap-center flex-col md:w-[190px]",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "mb-3 flex items-center justify-between px-1",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
        className: "text-xs font-semibold text-white/75",
        children: title
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "h-1.5 w-1.5 rounded-full bg-gradient-to-b from-[#22d3ee] to-[#a855f7] shadow-[0_0_6px_rgba(34,211,238,0.5)]"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "relative h-[320px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#030303] shadow-inner",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "pointer-events-none absolute inset-x-2 top-1/2 z-0 h-[82px] -translate-y-1/2 rounded-xl border border-[#22d3ee]/20 bg-gradient-to-r from-[#22d3ee]/15 to-purple-500/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-[#030303] via-[#030303]/85 to-transparent"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-[#030303] via-[#030303]/85 to-transparent"
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        ref: listRef,
        role: "listbox",
        "aria-label": title,
        className: "relative z-10 h-full cursor-grab snap-y snap-mandatory overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        onMouseDown: handleMouseDown,
        onMouseLeave: stopDragging,
        onMouseUp: stopDragging,
        onMouseMove: handleMouseMove,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          "aria-hidden": "true",
          style: {
            height: "calc(50% - 41px)"
          }
        }), items.map(function (item) {
          var imageUrl = ASSET_URLS[item];
          var selected = String(item) === String(value);
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            type: "button",
            role: "option",
            "aria-selected": selected,
            "data-value": item,
            "data-selected": selected,
            onClick: function onClick() {
              return handleItemClick(item);
            },
            className: "group flex h-[82px] w-full snap-center select-none items-center justify-center gap-2.5 px-4 text-left opacity-30 transition-all duration-200 data-[selected=true]:opacity-100",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "flex shrink-0 items-center justify-center font-semibold transition-colors ".concat(imageUrl ? "h-10 w-10" : "text-base text-white/55 group-data-[selected=true]:text-[#22d3ee]"),
              children: imageUrl ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                src: imageUrl,
                alt: "",
                className: "h-full w-full object-contain"
              }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
                children: [item, columnKey === "focal" ? "mm" : ""]
              })
            }), columnKey !== "focal" && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "line-clamp-2 min-w-0 text-[10px] font-medium leading-snug text-white/60 transition-colors group-data-[selected=true]:text-white",
              children: item
            })]
          }, item);
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          "aria-hidden": "true",
          style: {
            height: "calc(50% - 41px)"
          }
        })]
      })]
    })]
  });
}
function CameraControlsOverlay(_ref3) {
  var isOpen = _ref3.isOpen,
    onClose = _ref3.onClose,
    settings = _ref3.settings,
    onSettingsChange = _ref3.onSettingsChange,
    copy = _ref3.copy;
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
  (0, _react.useEffect)(function () {
    if (!isOpen) return undefined;
    var handleKeyDown = function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return function () {
      return document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    ref: backdropRef,
    className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-fade-in",
    onClick: handleBackdropClick,
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "camera-config-title",
      "aria-describedby": "camera-config-description",
      className: "flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a0b]/95 shadow-[0_24px_100px_rgba(0,0,0,0.75)] backdrop-blur-2xl animate-scale-up",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-start justify-between border-b border-white/[0.05] px-5 py-5 md:px-7 md:py-6",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#22d3ee]",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "15",
              height: "15",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "1.8",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              "aria-hidden": "true",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M14.5 4H9.5L8 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3Z"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                cx: "12",
                cy: "12.5",
                r: "3.5"
              })]
            }), copy.cameraOverlay.eyebrow]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
            id: "camera-config-title",
            className: "text-xl font-semibold tracking-tight text-white md:text-2xl",
            children: copy.cameraOverlay.title
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            id: "camera-config-description",
            className: "mt-1.5 max-w-2xl text-xs leading-relaxed text-white/45 md:text-sm",
            children: copy.cameraOverlay.description
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "button",
          onClick: onClose,
          "aria-label": copy.cameraOverlay.closeAria,
          title: copy.cameraOverlay.close,
          className: "ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/40 transition-all hover:border-white/15 hover:bg-white/[0.07] hover:text-white",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M18 6L6 18M6 6l12 12"
            })
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "overflow-x-auto px-5 py-6 no-scrollbar md:px-7 md:py-7",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "mx-auto flex w-max min-w-full justify-start gap-3 sm:justify-center md:gap-5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollColumn, {
            title: copy.cameraOverlay.columns.camera,
            items: CAMERAS,
            columnKey: "camera",
            value: settings.camera,
            onChange: updateSetting("camera")
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollColumn, {
            title: copy.cameraOverlay.columns.lens,
            items: LENSES,
            columnKey: "lens",
            value: settings.lens,
            onChange: updateSetting("lens")
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollColumn, {
            title: copy.cameraOverlay.columns.focalLength,
            items: FOCAL_LENGTHS,
            columnKey: "focal",
            value: settings.focal,
            onChange: updateSetting("focal")
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ScrollColumn, {
            title: copy.cameraOverlay.columns.aperture,
            items: APERTURES,
            columnKey: "aperture",
            value: settings.aperture,
            onChange: updateSetting("aperture")
          })]
        })
      })]
    })
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CinemaStudio(_ref4) {
  var apiKey = _ref4.apiKey,
    onGenerationStart = _ref4.onGenerationStart,
    onGenerationEnd = _ref4.onGenerationEnd,
    onGenerationComplete = _ref4.onGenerationComplete,
    onGenerationError = _ref4.onGenerationError,
    historyItems = _ref4.historyItems,
    templateData = _ref4.templateData,
    _ref4$locale = _ref4.locale,
    locale = _ref4$locale === void 0 ? "en" : _ref4$locale;
  var copy = (0, _i18nUtils.resolveCopy)(_cinemaStudio["default"], _cinemaStudio2["default"], locale);
  var LEGACY_PERSIST_KEY = "hg_cinema_studio_persistent";
  var PERSIST_KEY = (0, _persistKey.scopedPersistKey)(LEGACY_PERSIST_KEY, apiKey);
  (0, _react.useEffect)(function () {
    (0, _persistKey.migrateLegacyPersistKey)(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

  // ── Settings state ──
  var _useState = (0, _react.useState)({
      prompt: "",
      aspect_ratio: "16:9",
      camera: CAMERAS[0],
      lens: LENSES[0],
      focal: 35,
      aperture: "f/1.4"
    }),
    _useState2 = _slicedToArray(_useState, 2),
    settings = _useState2[0],
    setSettings = _useState2[1];
  var _useState3 = (0, _react.useState)("2K"),
    _useState4 = _slicedToArray(_useState3, 2),
    resolution = _useState4[0],
    setResolution = _useState4[1];

  // ── UI state ──
  var _useState5 = (0, _react.useState)(false),
    _useState6 = _slicedToArray(_useState5, 2),
    isOverlayOpen = _useState6[0],
    setIsOverlayOpen = _useState6[1];
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    isGenerating = _useState8[0],
    setIsGenerating = _useState8[1];
  var _useState9 = (0, _react.useState)(null),
    _useState0 = _slicedToArray(_useState9, 2),
    canvasUrl = _useState0[0],
    setCanvasUrl = _useState0[1]; // null = prompt view
  var _useState1 = (0, _react.useState)(null),
    _useState10 = _slicedToArray(_useState1, 2),
    fullscreenUrl = _useState10[0],
    setFullscreenUrl = _useState10[1];
  var _useState11 = (0, _react.useState)(null),
    _useState12 = _slicedToArray(_useState11, 2),
    uploadedImage = _useState12[0],
    setUploadedImage = _useState12[1];
  var _useState13 = (0, _react.useState)(false),
    _useState14 = _slicedToArray(_useState13, 2),
    isUploadingImage = _useState14[0],
    setIsUploadingImage = _useState14[1];
  var _useState15 = (0, _react.useState)(0),
    _useState16 = _slicedToArray(_useState15, 2),
    imageUploadProgress = _useState16[0],
    setImageUploadProgress = _useState16[1];
  var imageInputRef = (0, _react.useRef)(null);
  var _useState17 = (0, _react.useState)(null),
    _useState18 = _slicedToArray(_useState17, 2),
    activeHistoryIndex = _useState18[0],
    setactiveHistoryIndex = _useState18[1];
  var _useState19 = (0, _react.useState)(null),
    _useState20 = _slicedToArray(_useState19, 2),
    copiedPromptIndex = _useState20[0],
    setCopiedPromptIndex = _useState20[1];
  var _useState21 = (0, _react.useState)(null),
    _useState22 = _slicedToArray(_useState21, 2),
    copiedImageIndex = _useState22[0],
    setCopiedImageIndex = _useState22[1];

  // ── Internal history state (used when historyItems prop is not provided) ──
  var _useState23 = (0, _react.useState)([]),
    _useState24 = _slicedToArray(_useState23, 2),
    internalHistory = _useState24[0],
    setInternalHistory = _useState24[1];

  // ── Dropdown state ──
  var _useState25 = (0, _react.useState)(null),
    _useState26 = _slicedToArray(_useState25, 2),
    openDropdown = _useState26[0],
    setOpenDropdown = _useState26[1]; // 'ar' | 'res' | null
  var arBtnRef = (0, _react.useRef)(null);
  var resBtnRef = (0, _react.useRef)(null);

  // ── Textarea auto-grow ──
  var textareaRef = (0, _react.useRef)(null);
  var resultImgRef = (0, _react.useRef)(null);
  var handleImageFiles = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(files) {
      var file, url, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            file = files === null || files === void 0 ? void 0 : files[0];
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
    return function handleImageFiles(_x2) {
      return _ref5.apply(this, arguments);
    };
  }();
  var handleImageUpload = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(e) {
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            _context2.n = 1;
            return handleImageFiles(Array.from(e.target.files || []));
          case 1:
            return _context2.a(2);
        }
      }, _callee2);
    }));
    return function handleImageUpload(_x3) {
      return _ref6.apply(this, arguments);
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

  // ── Apply cross-studio handoff from GO-Viral / Storyboard ──────────────────
  var handoffApplied = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    try {
      var handoff = (0, _storyboardHandoff.readStoryboardHandoff)("cinema");
      if (!handoff || handoffApplied.current === handoff.createdAt) return;
      handoffApplied.current = handoff.createdAt;
      if (handoff.combinedPrompt || handoff.projectName) {
        setSettings(function (s) {
          return _objectSpread(_objectSpread({}, s), {}, {
            prompt: handoff.combinedPrompt || handoff.projectName
          });
        });
      }
      if (handoff.firstFrameUrl || handoff.referenceImageUrl) {
        setUploadedImage(handoff.firstFrameUrl || handoff.referenceImageUrl);
      }
      if (["1:1", "16:9", "9:16", "21:9", "4:5"].includes(handoff.aspectRatio)) {
        setSettings(function (s) {
          return _objectSpread(_objectSpread({}, s), {}, {
            aspect_ratio: handoff.aspectRatio
          });
        });
      }
    } catch (error) {
      /* silent */
    }
  }, []);

  // ── Image drag-and-drop ─────────────────────────────────────────────────
  var _useState27 = (0, _react.useState)(false),
    _useState28 = _slicedToArray(_useState27, 2),
    isImageDragging = _useState28[0],
    setIsImageDragging = _useState28[1];
  var imageDragCounterRef = (0, _react.useRef)(0);
  var handleImageDragEnter = function handleImageDragEnter(e) {
    var _e$dataTransfer;
    e.preventDefault();
    e.stopPropagation();
    imageDragCounterRef.current += 1;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsImageDragging(true);
    }
  };
  var handleImageDragLeave = function handleImageDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    imageDragCounterRef.current -= 1;
    if (imageDragCounterRef.current <= 0) {
      imageDragCounterRef.current = 0;
      setIsImageDragging(false);
    }
  };
  var handleImageDragOver = function handleImageDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  var handleImageDrop = function handleImageDrop(e) {
    var _e$dataTransfer2;
    e.preventDefault();
    e.stopPropagation();
    imageDragCounterRef.current = 0;
    setIsImageDragging(false);
    if (isUploadingImage) return;
    var files = (_e$dataTransfer2 = e.dataTransfer) === null || _e$dataTransfer2 === void 0 ? void 0 : _e$dataTransfer2.files;
    if (files && files.length > 0) {
      handleImageFiles(Array.from(files));
    }
  };

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

  // ── Adjust height on load ────────────────────────────────────────────────
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
  // ── Generate ──
  var handleGenerate = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var basePrompt, finalPrompt, res, entry, _e$message, _t2;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          basePrompt = settings.prompt.trim();
          if (!(!basePrompt || isGenerating)) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2);
        case 1:
          onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
          setIsGenerating(true);
          finalPrompt = buildNanoBananaPrompt(basePrompt, settings.camera, settings.lens, settings.focal, settings.aperture);
          _context3.p = 2;
          _context3.n = 3;
          return (0, _muapi.generateImage)(apiKey, {
            model: uploadedImage ? "nano-banana-pro-edit" : "nano-banana-pro",
            prompt: finalPrompt,
            aspect_ratio: settings.aspect_ratio,
            resolution: resolution.toLowerCase(),
            negative_prompt: "blurry, low quality, distortion, bad composition",
            images_list: uploadedImage ? [uploadedImage] : []
          });
        case 3:
          res = _context3.v;
          if (!(res && res.url)) {
            _context3.n = 4;
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
          _context3.n = 5;
          break;
        case 4:
          throw new Error("No data returned");
        case 5:
          _context3.n = 7;
          break;
        case 6:
          _context3.p = 6;
          _t2 = _context3.v;
          console.error(_t2);
          onGenerationError === null || onGenerationError === void 0 || onGenerationError(((_e$message = _t2.message) === null || _e$message === void 0 ? void 0 : _e$message.slice(0, 120)) || "Cinema generation failed");
        case 7:
          _context3.p = 7;
          setIsGenerating(false);
          onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
          return _context3.f(7);
        case 8:
          return _context3.a(2);
      }
    }, _callee3, null, [[2, 6, 7, 8]]);
  })), [settings, resolution, apiKey, isGenerating, onGenerationComplete, onGenerationEnd, onGenerationError, onGenerationStart, historyItems]);

  // ── Regenerate ──
  var handleRegenerate = (0, _react.useCallback)(function () {
    setCanvasUrl(null);
    // Small delay then generate
    setTimeout(function () {
      return handleGenerate();
    }, 300);
  }, [handleGenerate]);

  // ── Download ──
  var handleDownload = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
    var response, blob, blobUrl, a, _t3;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          if (canvasUrl) {
            _context4.n = 1;
            break;
          }
          return _context4.a(2);
        case 1:
          _context4.p = 1;
          _context4.n = 2;
          return fetch(canvasUrl);
        case 2:
          response = _context4.v;
          _context4.n = 3;
          return response.blob();
        case 3:
          blob = _context4.v;
          blobUrl = URL.createObjectURL(blob);
          a = document.createElement("a");
          a.href = blobUrl;
          a.download = "cinema-shot-".concat(Date.now(), ".jpg");
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          _context4.n = 5;
          break;
        case 4:
          _context4.p = 4;
          _t3 = _context4.v;
          window.open(canvasUrl, "_blank");
        case 5:
          return _context4.a(2);
      }
    }, _callee4, null, [[1, 4]]);
  })), [canvasUrl]);
  var handleCopyPrompt = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(prompt, index) {
      var _t4;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            if (prompt) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2);
          case 1:
            _context5.p = 1;
            _context5.n = 2;
            return navigator.clipboard.writeText(prompt);
          case 2:
            setCopiedPromptIndex(index);
            window.setTimeout(function () {
              setCopiedPromptIndex(function (current) {
                return current === index ? null : current;
              });
            }, 1600);
            _context5.n = 4;
            break;
          case 3:
            _context5.p = 3;
            _t4 = _context5.v;
            console.error("Failed to copy the prompt:", _t4);
            onGenerationError === null || onGenerationError === void 0 || onGenerationError("Could not copy the prompt to the clipboard.");
          case 4:
            return _context5.a(2);
        }
      }, _callee5, null, [[1, 3]]);
    }));
    return function (_x4, _x5) {
      return _ref9.apply(this, arguments);
    };
  }(), [onGenerationError]);
  var handleCopyImage = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(url, index) {
      var _navigator$clipboard, _t5;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.p = _context6.n) {
          case 0:
            if (url) {
              _context6.n = 1;
              break;
            }
            return _context6.a(2);
          case 1:
            _context6.p = 1;
            if (!(!window.isSecureContext || !((_navigator$clipboard = navigator.clipboard) !== null && _navigator$clipboard !== void 0 && _navigator$clipboard.write) || typeof window.ClipboardItem === "undefined")) {
              _context6.n = 2;
              break;
            }
            throw new Error("Image clipboard access requires HTTPS or localhost.");
          case 2:
            _context6.n = 3;
            return navigator.clipboard.write([new window.ClipboardItem({
              "image/png": fetchImageAsPngBlob(url)
            })]);
          case 3:
            setCopiedImageIndex(index);
            window.setTimeout(function () {
              setCopiedImageIndex(function (current) {
                return current === index ? null : current;
              });
            }, 1600);
            _context6.n = 5;
            break;
          case 4:
            _context6.p = 4;
            _t5 = _context6.v;
            console.error("Failed to copy the image:", _t5);
            onGenerationError === null || onGenerationError === void 0 || onGenerationError("Could not copy the image. Image copy requires HTTPS or localhost.");
          case 5:
            return _context6.a(2);
        }
      }, _callee6, null, [[1, 4]]);
    }));
    return function (_x6, _x7) {
      return _ref0.apply(this, arguments);
    };
  }(), [onGenerationError]);
  var resetToPrompt = function resetToPrompt() {
    setCanvasUrl(null);
    setSettings(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        prompt: ""
      });
    });
    if (textareaRef.current) {
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
          var _entry$timestamp, _entry$settings2, _entry$settings4, _entry$settings5, _entry$settings6;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-[#22d3ee]/50 transition-all duration-300 flex flex-col cursor-pointer",
            onClick: function onClick() {
              return setFullscreenUrl(entry.url);
            },
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: entry.url,
              alt: copy.card.historyItemAlt.replace("{index}", idx + 1),
              className: "w-full aspect-[4/3] object-cover bg-black/40"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute top-2 right-2 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: copiedPromptIndex === idx ? copy.actions.promptCopied : copy.actions.copyPrompt,
                "aria-label": copiedPromptIndex === idx ? copy.actions.promptCopied : copy.actions.copyPrompt,
                onClick: function onClick(event) {
                  var _entry$settings;
                  event.stopPropagation();
                  handleCopyPrompt((_entry$settings = entry.settings) === null || _entry$settings === void 0 ? void 0 : _entry$settings.prompt, idx);
                },
                className: "flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 font-black backdrop-blur-md transition-all hover:bg-[#22d3ee] hover:text-black ".concat(copiedPromptIndex === idx ? "text-[#22d3ee]" : "text-white"),
                children: copiedPromptIndex === idx ? /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M5 12l4 4L19 6"
                  })
                }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions.CopyContentIcon, {
                  kind: "text",
                  size: 17
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: copiedImageIndex === idx ? copy.actions.imageCopied : copy.actions.copyImage,
                "aria-label": copiedImageIndex === idx ? copy.actions.imageCopied : copy.actions.copyImage,
                onClick: function onClick(event) {
                  event.stopPropagation();
                  handleCopyImage(entry.url, idx);
                },
                className: "flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-md transition-all hover:bg-[#22d3ee] hover:text-black ".concat(copiedImageIndex === idx ? "text-[#22d3ee]" : "text-white"),
                children: copiedImageIndex === idx ? /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M5 12l4 4L19 6"
                  })
                }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileGenerationActions.CopyContentIcon, {
                  kind: "image",
                  size: 17
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: copy.actions.download,
                onClick: (/*#__PURE__*/function () {
                  var _ref1 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(e) {
                    var response, blob, blobUrl, a, _t6;
                    return _regenerator().w(function (_context7) {
                      while (1) switch (_context7.p = _context7.n) {
                        case 0:
                          e.stopPropagation();
                          _context7.p = 1;
                          _context7.n = 2;
                          return fetch(entry.url);
                        case 2:
                          response = _context7.v;
                          _context7.n = 3;
                          return response.blob();
                        case 3:
                          blob = _context7.v;
                          blobUrl = URL.createObjectURL(blob);
                          a = document.createElement("a");
                          a.href = blobUrl;
                          a.download = "cinema-shot-".concat(entry.id || idx, ".jpg");
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                          _context7.n = 5;
                          break;
                        case 4:
                          _context7.p = 4;
                          _t6 = _context7.v;
                          window.open(entry.url, "_blank");
                        case 5:
                          return _context7.a(2);
                      }
                    }, _callee7, null, [[1, 4]]);
                  }));
                  return function (_x8) {
                    return _ref1.apply(this, arguments);
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
                title: ((_entry$settings2 = entry.settings) === null || _entry$settings2 === void 0 || (_entry$settings2 = _entry$settings2.prompt) === null || _entry$settings2 === void 0 ? void 0 : _entry$settings2.substring(0, 50)) || "Cinema shot",
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
                title: copy.actions["delete"],
                onClick: function onClick(e) {
                  e.stopPropagation();
                  if (confirm(copy.actions.deleteConfirm)) {
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
              actions: [{
                kind: "text",
                label: copy.actions.copyPrompt,
                onSelect: function onSelect() {
                  var _entry$settings3;
                  return handleCopyPrompt((_entry$settings3 = entry.settings) === null || _entry$settings3 === void 0 ? void 0 : _entry$settings3.prompt, idx);
                }
              }, {
                kind: "image",
                label: copy.actions.copyImage,
                onSelect: function onSelect() {
                  return handleCopyImage(entry.url, idx);
                }
              }, {
                kind: "download",
                label: copy.actions.download,
                onSelect: function () {
                  var _onSelect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
                    var response, blob, blobUrl, anchor, _t7;
                    return _regenerator().w(function (_context8) {
                      while (1) switch (_context8.p = _context8.n) {
                        case 0:
                          _context8.p = 0;
                          _context8.n = 1;
                          return fetch(entry.url);
                        case 1:
                          response = _context8.v;
                          _context8.n = 2;
                          return response.blob();
                        case 2:
                          blob = _context8.v;
                          blobUrl = URL.createObjectURL(blob);
                          anchor = document.createElement("a");
                          anchor.href = blobUrl;
                          anchor.download = "cinema-shot-".concat(entry.id || idx, ".jpg");
                          document.body.appendChild(anchor);
                          anchor.click();
                          document.body.removeChild(anchor);
                          URL.revokeObjectURL(blobUrl);
                          _context8.n = 4;
                          break;
                        case 3:
                          _context8.p = 3;
                          _t7 = _context8.v;
                          window.open(entry.url, "_blank");
                        case 4:
                          return _context8.a(2);
                      }
                    }, _callee8, null, [[0, 3]]);
                  }));
                  function onSelect() {
                    return _onSelect.apply(this, arguments);
                  }
                  return onSelect;
                }()
              }, {
                kind: "delete",
                label: copy.actions["delete"],
                danger: true,
                onSelect: function onSelect() {
                  if (confirm(copy.actions.deleteConfirm)) {
                    setInternalHistory(function (prev) {
                      return prev.filter(function (_, i) {
                        return i !== idx;
                      });
                    });
                  }
                }
              }]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "w-full text-left text-xs line-clamp-3 leading-relaxed text-white/70",
                title: ((_entry$settings4 = entry.settings) === null || _entry$settings4 === void 0 ? void 0 : _entry$settings4.prompt) || copy.card.noPrompt,
                children: ((_entry$settings5 = entry.settings) === null || _entry$settings5 === void 0 ? void 0 : _entry$settings5.prompt) || copy.card.noPrompt
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "sr-only",
                "aria-live": "polite",
                children: copiedPromptIndex === idx ? copy.actions.promptCopied : copiedImageIndex === idx ? copy.actions.imageCopied : ""
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "flex items-center mt-1 flex-wrap gap-1",
                children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] font-bold text-[#22d3ee] px-2 py-0.5 bg-[#22d3ee]/10 rounded border border-[#22d3ee]/20",
                    children: copy.card.badge
                  }), ((_entry$settings6 = entry.settings) === null || _entry$settings6 === void 0 ? void 0 : _entry$settings6.camera) && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] text-white/40",
                    children: entry.settings.camera
                  })]
                })
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
            children: copy.empty.kicker
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight",
            children: copy.empty.title
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4",
          children: copy.empty.description
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptComposer, {
      positionClassName: "absolute bottom-4 left-4 right-4 md:left-0 md:right-0 md:mx-auto md:max-w-[95%] lg:max-w-4xl z-30 transition-all duration-700 animate-fade-in-up",
      style: null,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_TemplateBanner["default"], {
        isApplied: isTemplateApplied,
        onClear: resetTemplate
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-start gap-4 w-full px-1",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "relative pt-0.5",
          onDragEnter: handleImageDragEnter,
          onDragLeave: handleImageDragLeave,
          onDragOver: handleImageDragOver,
          onDrop: handleImageDrop,
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
            className: (0, _PromptComposer.promptMediaButtonClassName)({
              active: Boolean(uploadedImage) || isImageDragging
            }) + (isImageDragging ? " ring-2 ring-[#22d3ee] ring-offset-1 ring-offset-black scale-105" : ""),
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
                alt: copy.referenceImage.alt,
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
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptTextarea, {
          ref: textareaRef,
          value: settings.prompt,
          onChange: function onChange(e) {
            return setSettings(function (prev) {
              return _objectSpread(_objectSpread({}, prev), {}, {
                prompt: e.target.value
              });
            });
          },
          placeholder: copy.prompt.placeholder
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptFooter, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptControls, {
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              ref: arBtnRef,
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "ar",
                className: "text-xs font-semibold"
              }),
              onClick: function onClick() {
                return setOpenDropdown(function (d) {
                  return d === "ar" ? null : "ar";
                });
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAspectRatioIcon, {}), settings.aspect_ratio]
            }), openDropdown === "ar" && /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
              title: copy.dropdowns.aspectRatio,
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
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              ref: resBtnRef,
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "res",
                className: "text-xs font-semibold"
              }),
              onClick: function onClick() {
                return setOpenDropdown(function (d) {
                  return d === "res" ? null : "res";
                });
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptQualityIcon, {}), resolution]
            }), openDropdown === "res" && /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
              title: copy.dropdowns.resolution,
              items: RESOLUTIONS,
              selected: resolution,
              onSelect: setResolution,
              triggerRef: resBtnRef,
              onClose: function onClose() {
                return setOpenDropdown(null);
              }
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            className: (0, _PromptComposer.promptControlClassName)({
              className: "text-left overflow-hidden text-xs font-semibold text-white/70 hover:text-white"
            }),
            onClick: function onClick() {
              return setIsOverlayOpen(true);
            },
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-1.5 h-1.5 bg-[#22d3ee] rounded-full shadow-lg shadow-[#22d3ee]/20 shrink-0"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
              className: "max-w-[120px] truncate text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
              children: [settings.camera, " \xB7 ", formatSummaryValue()]
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAction, {
          disabled: isGenerating || !settings.prompt.trim(),
          onClick: handleGenerate,
          children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "animate-spin inline-block text-black",
              children: "\u25CC"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.prompt.generating
            })]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.prompt.generate
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
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: fullscreenUrl,
        alt: copy.fullscreen.alt,
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
      onSettingsChange: setSettings,
      copy: copy
    })]
  });
}