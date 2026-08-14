"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = VideoStudio;
var _react = require("react");
var _muapi = require("../muapi.js");
var _models = require("../models.js");
var _jsxRuntime = require("react/jsx-runtime");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // ── tiny helpers ──────────────────────────────────────────────────────────────
function getQualitiesForModel(modelList, modelId) {
  var _model$inputs;
  var model = modelList.find(function (m) {
    return m.id === modelId;
  });
  return (model === null || model === void 0 || (_model$inputs = model.inputs) === null || _model$inputs === void 0 || (_model$inputs = _model$inputs.quality) === null || _model$inputs === void 0 ? void 0 : _model$inputs["enum"]) || [];
}
function downloadFile(_x, _x2) {
  return _downloadFile.apply(this, arguments);
} // ── SVG icons (kept inline to avoid extra deps) ───────────────────────────────
function _downloadFile() {
  _downloadFile = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(url, filename) {
    var response, blob, blobUrl, a, _t7;
    return _regenerator().w(function (_context7) {
      while (1) switch (_context7.p = _context7.n) {
        case 0:
          _context7.p = 0;
          _context7.n = 1;
          return fetch(url);
        case 1:
          response = _context7.v;
          _context7.n = 2;
          return response.blob();
        case 2:
          blob = _context7.v;
          blobUrl = URL.createObjectURL(blob);
          a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          _context7.n = 4;
          break;
        case 3:
          _context7.p = 3;
          _t7 = _context7.v;
          window.open(url, "_blank");
        case 4:
          return _context7.a(2);
      }
    }, _callee7, null, [[0, 3]]);
  }));
  return _downloadFile.apply(this, arguments);
}
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
var VideoIconSvg = function VideoIconSvg(_ref) {
  var className = _ref.className;
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

function DropdownItem(_ref2) {
  var label = _ref2.label,
    selected = _ref2.selected,
    onClick = _ref2.onClick;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group",
    onClick: onClick,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "text-xs font-bold text-white opacity-80 group-hover:opacity-100 capitalize",
      children: label
    }), selected && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
  });
}
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
function ModelDropdown(_ref3) {
  var _availableProviders$f;
  var imageMode = _ref3.imageMode,
    selectedModel = _ref3.selectedModel,
    onSelect = _ref3.onSelect,
    onClose = _ref3.onClose;
  var _useState = (0, _react.useState)(""),
    _useState2 = _slicedToArray(_useState, 2),
    search = _useState2[0],
    setSearch = _useState2[1];
  var _useState3 = (0, _react.useState)("all"),
    _useState4 = _slicedToArray(_useState3, 2),
    selectedProvider = _useState4[0],
    setSelectedProvider = _useState4[1];
  var generationModels = imageMode ? _models.i2vModels : _models.t2vModels;
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
  var allCurrentModels = [].concat(_toConsumableArray(generationModels), _toConsumableArray(_models.v2vModels));
  allCurrentModels.forEach(function (m) {
    var pId = m.provider || 'muapi';
    var pName = m.provider_name || 'Muapi';
    if (!seenProviders.has(pId)) {
      seenProviders.add(pId);
      availableProviders.push({
        id: pId,
        name: pName
      });
    }
  });
  var lf = search.toLowerCase();
  var filterFn = function filterFn(m) {
    // 1. Filter by provider tab
    if (selectedProvider !== "all") {
      var pId = m.provider || 'muapi';
      if (pId !== selectedProvider) return false;
    }
    // 2. Filter by search query
    return m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf);
  };
  var filteredMain = generationModels.filter(filterFn);
  var filteredV2V = _models.v2vModels.filter(filterFn);
  var getIconColor = function getIconColor(m, isV2V) {
    if (isV2V) return "bg-orange-500/10 text-orange-400 border-orange-500/10";
    if (m.id.includes("kling")) return "bg-blue-500/10 text-blue-400 border-blue-500/10";
    if (m.id.includes("veo")) return "bg-purple-500/10 text-purple-400 border-purple-500/10";
    if (m.id.includes("sora")) return "bg-rose-500/10 text-rose-400 border-rose-500/10";
    return "bg-primary/10 text-primary border-primary/10";
  };
  var renderItem = function renderItem(m) {
    var isV2V = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ".concat(selectedModel === m.id ? "bg-white/5 border-white/5" : ""),
      onClick: function onClick(e) {
        e.stopPropagation();
        onSelect(m, isV2V);
        onClose();
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-3.5",
        children: [PROVIDER_LOGOS[m.provider] ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-8 h-8 rounded-xl border border-white/5 overflow-hidden shrink-0 flex items-center justify-center bg-white/[0.02]",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: PROVIDER_LOGOS[m.provider],
            alt: m.provider_name,
            className: "w-full h-full object-contain p-1 ".concat(invertLogos.includes(m.provider) ? "invert" : "")
          })
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-9 h-9 ".concat(getIconColor(m, isV2V), " border rounded-xl flex items-center justify-center font-black text-xs shadow-inner uppercase"),
          children: m.name.charAt(0)
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col gap-0.5 min-w-0",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-xs font-bold text-white tracking-tight truncate",
            children: m.name
          }), isV2V ? /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[9px] text-orange-400/70",
            children: m.imageField ? "Upload a video and image" : "Upload a video to use"
          }) : selectedProvider === "all" && m.provider_name && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[9px] text-white/40",
            children: m.provider_name
          })]
        })]
      }), selectedModel === m.id && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
    }, m.id);
  };
  var invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex gap-4 h-full max-h-[70vh] min-h-[350px]",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col gap-2.5 items-center pr-3 border-r border-white/5 shrink-0 select-none overflow-y-auto custom-scrollbar w-12 pt-0.5",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        onClick: function onClick() {
          return setSelectedProvider("all");
        },
        className: "w-8.5 h-8.5 rounded-full flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer ".concat(selectedProvider === "all" ? "bg-white/10 text-yellow-400 border-yellow-500/30 shadow-md scale-105" : "bg-white/[0.02] text-white/50 border-white/[0.03] hover:bg-white/5 hover:text-white"),
        title: "All Providers",
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
          className: "w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-black text-[10px] border transition-all flex-shrink-0 cursor-pointer overflow-hidden ".concat(isSelected ? "".concat(style.bg, " border-white/25 scale-105 shadow-md") : "bg-white/[0.02] text-white/40 border-white/[0.02] hover:bg-white/5 hover:text-white/80"),
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
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "px-1 pb-2 border-b border-white/5 shrink-0",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
            placeholder: "Search models...",
            value: search,
            onChange: function onChange(e) {
              return setSearch(e.target.value);
            },
            onClick: function onClick(e) {
              return e.stopPropagation();
            },
            className: "bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none"
          })]
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "text-xs font-bold text-secondary px-2 py-1 shrink-0 flex items-center justify-between",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          children: "Video models"
        }), selectedProvider !== "all" && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60",
          children: ((_availableProviders$f = availableProviders.find(function (p) {
            return p.id === selectedProvider;
          })) === null || _availableProviders$f === void 0 ? void 0 : _availableProviders$f.name) || selectedProvider
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1",
        children: filteredMain.length === 0 && filteredV2V.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "text-xs text-white/30 text-center py-6",
          children: "No models found"
        }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
          children: [filteredMain.map(function (m) {
            return renderItem(m, false);
          }), filteredV2V.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "text-xs font-bold text-orange-400/70 px-3 py-2 mt-1 border-t border-white/5",
              children: "Video Tools"
            }), filteredV2V.map(function (m) {
              return renderItem(m, true);
            })]
          })]
        })
      })]
    })]
  });
}

// ── Control button ────────────────────────────────────────────────────────────

function ControlBtn(_ref4) {
  var icon = _ref4.icon,
    label = _ref4.label,
    onClick = _ref4.onClick,
    style = _ref4.style;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
    type: "button",
    onClick: onClick,
    style: style,
    className: "flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap",
    children: [icon, /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "text-xs font-bold text-white group-hover:text-primary transition-colors",
      children: label
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
      width: "10",
      height: "10",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "4",
      className: "opacity-20 group-hover:opacity-100 transition-opacity",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M6 9l6 6 6-6"
      })
    })]
  });
}

// ── Dropdown panel ─────────────────────────────────────────────────────────────
// Rendered inside a `relative` wrapper div; floats above the anchor button.

// ── Main component ────────────────────────────────────────────────────────────

function VideoStudio(_ref5) {
  var _defaultModel$inputs, _defaultModel$inputs2, _defaultModel$inputs3, _defaultModel$inputs4, _currentModelObj$inpu, _i2vModels$find, _currentModelObj$inpu2;
  var apiKey = _ref5.apiKey,
    onGenerationComplete = _ref5.onGenerationComplete,
    onGenerationError = _ref5.onGenerationError,
    historyItems = _ref5.historyItems,
    droppedFiles = _ref5.droppedFiles,
    onFilesHandled = _ref5.onFilesHandled;
  var PERSIST_KEY = "hg_video_studio_persistent";

  // ── mode state ──
  var _useState5 = (0, _react.useState)(false),
    _useState6 = _slicedToArray(_useState5, 2),
    imageMode = _useState6[0],
    setImageMode = _useState6[1]; // i2v
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    v2vMode = _useState8[0],
    setV2vMode = _useState8[1];

  // ── model / params ──
  var defaultModel = _models.t2vModels[0];
  var _useState9 = (0, _react.useState)(defaultModel.id),
    _useState0 = _slicedToArray(_useState9, 2),
    selectedModel = _useState0[0],
    setSelectedModel = _useState0[1];
  var _useState1 = (0, _react.useState)(defaultModel.name),
    _useState10 = _slicedToArray(_useState1, 2),
    selectedModelName = _useState10[0],
    setSelectedModelName = _useState10[1];
  var _useState11 = (0, _react.useState)(((_defaultModel$inputs = defaultModel.inputs) === null || _defaultModel$inputs === void 0 || (_defaultModel$inputs = _defaultModel$inputs.aspect_ratio) === null || _defaultModel$inputs === void 0 ? void 0 : _defaultModel$inputs["default"]) || "16:9"),
    _useState12 = _slicedToArray(_useState11, 2),
    selectedAr = _useState12[0],
    setSelectedAr = _useState12[1];
  var _useState13 = (0, _react.useState)(((_defaultModel$inputs2 = defaultModel.inputs) === null || _defaultModel$inputs2 === void 0 || (_defaultModel$inputs2 = _defaultModel$inputs2.duration) === null || _defaultModel$inputs2 === void 0 ? void 0 : _defaultModel$inputs2["default"]) || 5),
    _useState14 = _slicedToArray(_useState13, 2),
    selectedDuration = _useState14[0],
    setSelectedDuration = _useState14[1];
  var _useState15 = (0, _react.useState)(((_defaultModel$inputs3 = defaultModel.inputs) === null || _defaultModel$inputs3 === void 0 || (_defaultModel$inputs3 = _defaultModel$inputs3.resolution) === null || _defaultModel$inputs3 === void 0 ? void 0 : _defaultModel$inputs3["default"]) || ""),
    _useState16 = _slicedToArray(_useState15, 2),
    selectedResolution = _useState16[0],
    setSelectedResolution = _useState16[1];
  var _useState17 = (0, _react.useState)(((_defaultModel$inputs4 = defaultModel.inputs) === null || _defaultModel$inputs4 === void 0 || (_defaultModel$inputs4 = _defaultModel$inputs4.quality) === null || _defaultModel$inputs4 === void 0 ? void 0 : _defaultModel$inputs4["default"]) || ""),
    _useState18 = _slicedToArray(_useState17, 2),
    selectedQuality = _useState18[0],
    setSelectedQuality = _useState18[1];
  var _useState19 = (0, _react.useState)(""),
    _useState20 = _slicedToArray(_useState19, 2),
    selectedMode = _useState20[0],
    setSelectedMode = _useState20[1];
  var _useState21 = (0, _react.useState)(""),
    _useState22 = _slicedToArray(_useState21, 2),
    selectedEffect = _useState22[0],
    setSelectedEffect = _useState22[1];

  // ── upload progress ──
  var _useState23 = (0, _react.useState)(0),
    _useState24 = _slicedToArray(_useState23, 2),
    imageProgress = _useState24[0],
    setImageProgress = _useState24[1];
  var _useState25 = (0, _react.useState)(0),
    _useState26 = _slicedToArray(_useState25, 2),
    videoProgress = _useState26[0],
    setVideoProgress = _useState26[1];

  // ── control visibility ──
  var _useState27 = (0, _react.useState)(true),
    _useState28 = _slicedToArray(_useState27, 2),
    showAr = _useState28[0],
    setShowAr = _useState28[1];
  var _useState29 = (0, _react.useState)(true),
    _useState30 = _slicedToArray(_useState29, 2),
    showDuration = _useState30[0],
    setShowDuration = _useState30[1];
  var _useState31 = (0, _react.useState)(false),
    _useState32 = _slicedToArray(_useState31, 2),
    showResolution = _useState32[0],
    setShowResolution = _useState32[1];
  var _useState33 = (0, _react.useState)(false),
    _useState34 = _slicedToArray(_useState33, 2),
    showQuality = _useState34[0],
    setShowQuality = _useState34[1];
  var _useState35 = (0, _react.useState)(false),
    _useState36 = _slicedToArray(_useState35, 2),
    showMode = _useState36[0],
    setShowMode = _useState36[1];
  var _useState37 = (0, _react.useState)(false),
    _useState38 = _slicedToArray(_useState37, 2),
    showEffect = _useState38[0],
    setShowEffect = _useState38[1];

  // ── uploads ──
  var _useState39 = (0, _react.useState)(null),
    _useState40 = _slicedToArray(_useState39, 2),
    uploadedImageUrl = _useState40[0],
    setUploadedImageUrl = _useState40[1];
  var _useState41 = (0, _react.useState)([]),
    _useState42 = _slicedToArray(_useState41, 2),
    uploadedImageUrls = _useState42[0],
    setUploadedImageUrls = _useState42[1];
  var _useState43 = (0, _react.useState)(false),
    _useState44 = _slicedToArray(_useState43, 2),
    imageUploading = _useState44[0],
    setImageUploading = _useState44[1];
  var _useState45 = (0, _react.useState)(null),
    _useState46 = _slicedToArray(_useState45, 2),
    uploadedEndImageUrl = _useState46[0],
    setUploadedEndImageUrl = _useState46[1];
  var _useState47 = (0, _react.useState)(false),
    _useState48 = _slicedToArray(_useState47, 2),
    endImageUploading = _useState48[0],
    setEndImageUploading = _useState48[1];
  var _useState49 = (0, _react.useState)(0),
    _useState50 = _slicedToArray(_useState49, 2),
    endImageProgress = _useState50[0],
    setEndImageProgress = _useState50[1];
  var _useState51 = (0, _react.useState)(null),
    _useState52 = _slicedToArray(_useState51, 2),
    uploadedVideoUrl = _useState52[0],
    setUploadedVideoUrl = _useState52[1];
  var _useState53 = (0, _react.useState)(false),
    _useState54 = _slicedToArray(_useState53, 2),
    videoUploading = _useState54[0],
    setVideoUploading = _useState54[1];
  var _useState55 = (0, _react.useState)(null),
    _useState56 = _slicedToArray(_useState55, 2),
    uploadedVideoName = _useState56[0],
    setUploadedVideoName = _useState56[1];

  // ── generation / canvas ──
  var _useState57 = (0, _react.useState)(false),
    _useState58 = _slicedToArray(_useState57, 2),
    generating = _useState58[0],
    setGenerating = _useState58[1];
  var _useState59 = (0, _react.useState)(null),
    _useState60 = _slicedToArray(_useState59, 2),
    generateError = _useState60[0],
    setGenerateError = _useState60[1];
  var _useState61 = (0, _react.useState)(null),
    _useState62 = _slicedToArray(_useState61, 2),
    fullscreenUrl = _useState62[0],
    setFullscreenUrl = _useState62[1];
  var _useState63 = (0, _react.useState)(null),
    _useState64 = _slicedToArray(_useState63, 2),
    canvasUrl = _useState64[0],
    setCanvasUrl = _useState64[1];
  var _useState65 = (0, _react.useState)(null),
    _useState66 = _slicedToArray(_useState65, 2),
    canvasModel = _useState66[0],
    setCanvasModel = _useState66[1];
  var _useState67 = (0, _react.useState)(false),
    _useState68 = _slicedToArray(_useState67, 2),
    showCanvas = _useState68[0],
    setShowCanvas = _useState68[1];
  var _useState69 = (0, _react.useState)(null),
    _useState70 = _slicedToArray(_useState69, 2),
    lastGenerationId = _useState70[0],
    setLastGenerationId = _useState70[1];
  var _useState71 = (0, _react.useState)(null),
    _useState72 = _slicedToArray(_useState71, 2),
    lastGenerationModel = _useState72[0],
    setLastGenerationModel = _useState72[1];

  // ── history ──
  var _useState73 = (0, _react.useState)([]),
    _useState74 = _slicedToArray(_useState73, 2),
    localHistory = _useState74[0],
    setLocalHistory = _useState74[1];
  var _useState75 = (0, _react.useState)(0),
    _useState76 = _slicedToArray(_useState75, 2),
    activeHistoryIdx = _useState76[0],
    setActiveHistoryIdx = _useState76[1];

  // ── dropdown ──
  var _useState77 = (0, _react.useState)(null),
    _useState78 = _slicedToArray(_useState77, 2),
    openDropdown = _useState78[0],
    setOpenDropdown = _useState78[1]; // 'model'|'ar'|'duration'|'resolution'|'quality'|'mode'|null

  // ── prompt ──
  var _useState79 = (0, _react.useState)(""),
    _useState80 = _slicedToArray(_useState79, 2),
    prompt = _useState80[0],
    setPrompt = _useState80[1];
  var _useState81 = (0, _react.useState)(false),
    _useState82 = _slicedToArray(_useState81, 2),
    promptDisabled = _useState82[0],
    setPromptDisabled = _useState82[1];

  // ── refs ──
  var containerRef = (0, _react.useRef)(null);
  var textareaRef = (0, _react.useRef)(null);
  var dropdownRef = (0, _react.useRef)(null);
  var imageFileInputRef = (0, _react.useRef)(null);
  var endImageFileInputRef = (0, _react.useRef)(null);
  var videoFileInputRef = (0, _react.useRef)(null);
  var resultVideoRef = (0, _react.useRef)(null);
  var hasRestored = (0, _react.useRef)(false);

  // ── derived data ──
  var history = historyItems !== null && historyItems !== void 0 ? historyItems : localHistory;
  var getCurrentModels = (0, _react.useCallback)(function () {
    if (v2vMode) return _models.v2vModels;
    return imageMode ? _models.i2vModels : _models.t2vModels;
  }, [imageMode, v2vMode]);
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
    return getCurrentModels().find(function (m) {
      return m.id === selectedModel;
    });
  }, [getCurrentModels, selectedModel]);
  var isMotionControlSelection = (0, _react.useCallback)(function (modelId, isV2v) {
    if (!isV2v) return false;
    var m = _models.v2vModels.find(function (x) {
      return x.id === modelId;
    });
    return !!(m !== null && m !== void 0 && m.imageField);
  }, []);

  // ── update controls when model/mode changes ──────────────────────────────
  var applyControlsForModel = (0, _react.useCallback)(function (modelId, isImageMode, isV2vMode) {
    if (isV2vMode) {
      setShowAr(false);
      setShowDuration(false);
      setShowResolution(false);
      setShowQuality(false);
      setShowMode(false);
      setShowEffect(false);
      return;
    }
    var modelList = isImageMode ? _models.i2vModels : _models.t2vModels;
    var model = modelList.find(function (m) {
      return m.id === modelId;
    });
    var ars = isImageMode ? (0, _models.getAspectRatiosForI2VModel)(modelId) : (0, _models.getAspectRatiosForVideoModel)(modelId);
    if (ars.length > 0) {
      setSelectedAr(ars[0]);
      setShowAr(true);
    } else {
      setShowAr(false);
    }
    var durations = isImageMode ? (0, _models.getDurationsForI2VModel)(modelId) : (0, _models.getDurationsForModel)(modelId);
    if (durations.length > 0) {
      setSelectedDuration(durations[0]);
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
    var qualities = getQualitiesForModel(modelList, modelId);
    if (qualities.length > 0) {
      var _model$inputs2;
      setSelectedQuality((model === null || model === void 0 || (_model$inputs2 = model.inputs) === null || _model$inputs2 === void 0 || (_model$inputs2 = _model$inputs2.quality) === null || _model$inputs2 === void 0 ? void 0 : _model$inputs2["default"]) || qualities[0]);
      setShowQuality(true);
    } else {
      setSelectedQuality("");
      setShowQuality(false);
    }
    var modes = (0, _models.getModesForModel)(modelId);
    if (modes.length > 0) {
      var _model$inputs3;
      setSelectedMode((model === null || model === void 0 || (_model$inputs3 = model.inputs) === null || _model$inputs3 === void 0 || (_model$inputs3 = _model$inputs3.mode) === null || _model$inputs3 === void 0 ? void 0 : _model$inputs3["default"]) || modes[0]);
      setShowMode(true);
    } else {
      setSelectedMode("");
      setShowMode(false);
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

  // ── Persistence: Load ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        if (data.imageMode !== undefined) setImageMode(data.imageMode);
        if (data.v2vMode !== undefined) setV2vMode(data.v2vMode);
        if (data.selectedModel) setSelectedModel(data.selectedModel);
        if (data.selectedModelName) setSelectedModelName(data.selectedModelName);
        if (data.selectedAr) setSelectedAr(data.selectedAr);
        if (data.selectedDuration) setSelectedDuration(data.selectedDuration);
        if (data.selectedResolution) setSelectedResolution(data.selectedResolution);
        if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
        if (data.selectedMode) setSelectedMode(data.selectedMode);
        if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
        if (data.uploadedImageUrl) setUploadedImageUrl(data.uploadedImageUrl);
        if (data.uploadedImageUrls) {
          setUploadedImageUrls(data.uploadedImageUrls);
        } else if (data.uploadedImageUrl) {
          setUploadedImageUrls([data.uploadedImageUrl]);
        }
        if (data.uploadedVideoUrl) setUploadedVideoUrl(data.uploadedVideoUrl);
        if (data.uploadedVideoName) setUploadedVideoName(data.uploadedVideoName);
        if (data.prompt) setPrompt(data.prompt);
        if (data.localHistory) setLocalHistory(data.localHistory);

        // Update control visibility based on restored model/mode
        applyControlsForModel(data.selectedModel || defaultModel.id, !!data.imageMode, !!data.v2vMode);
      }
    } catch (err) {
      console.warn("Failed to load VideoStudio persistence:", err);
    } finally {
      hasRestored.current = true;
    }
  }, [applyControlsForModel, defaultModel.id]);

  // ── Adjust height on load ────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      if (textareaRef.current) {
        var el = textareaRef.current;
        el.style.height = "auto";
        var maxH = window.innerWidth < 768 ? 150 : 250;
        el.style.height = Math.min(el.scrollHeight, maxH) + "px";
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
          imageMode: imageMode,
          v2vMode: v2vMode,
          selectedModel: selectedModel,
          selectedModelName: selectedModelName,
          selectedAr: selectedAr,
          selectedDuration: selectedDuration,
          selectedResolution: selectedResolution,
          selectedQuality: selectedQuality,
          selectedMode: selectedMode,
          selectedEffect: selectedEffect,
          uploadedImageUrl: uploadedImageUrl,
          uploadedImageUrls: uploadedImageUrls,
          uploadedVideoUrl: uploadedVideoUrl,
          uploadedVideoName: uploadedVideoName,
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
  }, [imageMode, v2vMode, selectedModel, selectedModelName, selectedAr, selectedDuration, selectedResolution, selectedQuality, selectedMode, selectedEffect, uploadedImageUrl, uploadedImageUrls, uploadedVideoUrl, uploadedVideoName, prompt, localHistory]);

  // ── Derived UI values ────────────────────────────────────────────────────

  var processDroppedImage = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(file) {
      var url, targetModelId, currentT2V, sibling, target, maxImgs, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(file.size > 10 * 1024 * 1024)) {
              _context.n = 1;
              break;
            }
            alert("Image exceeds 10MB limit.");
            return _context.a(2);
          case 1:
            setImageUploading(true);
            setImageProgress(0);
            _context.p = 2;
            _context.n = 3;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              setImageProgress(pct);
            });
          case 3:
            url = _context.v;
            setUploadedImageUrl(url);
            setUploadedVideoUrl(null);
            setUploadedVideoName(null);
            setV2vMode(false);
            targetModelId = selectedModel;
            if (!imageMode) {
              currentT2V = _models.t2vModels.find(function (m) {
                return m.id === selectedModel;
              });
              sibling = currentT2V !== null && currentT2V !== void 0 && currentT2V.family ? _models.i2vModels.find(function (m) {
                return m.family === currentT2V.family;
              }) : null;
              target = sibling || _models.i2vModels[0];
              targetModelId = target.id;
              setImageMode(true);
              setSelectedModel(target.id);
              setSelectedModelName(target.name);
              applyControlsForModel(target.id, true, false);
            }
            maxImgs = (0, _models.getMaxImagesForI2VModel)(targetModelId);
            if (maxImgs > 2) {
              setUploadedImageUrls(function (prev) {
                if (prev.includes(url)) return prev;
                return [].concat(_toConsumableArray(prev), [url]).slice(0, maxImgs);
              });
            } else {
              setUploadedImageUrls([url]);
            }
            setPromptDisabled(false);
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            alert("Image upload failed: ".concat(_t.message));
          case 5:
            _context.p = 5;
            setImageUploading(false);
            setImageProgress(0);
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4, 5, 6]]);
    }));
    return function processDroppedImage(_x3) {
      return _ref6.apply(this, arguments);
    };
  }();
  var processDroppedVideo = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(file) {
      var url, firstV2V, _t2;
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
            setVideoUploading(true);
            setVideoProgress(0);
            _context2.p = 2;
            _context2.n = 3;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              setVideoProgress(pct);
            });
          case 3:
            url = _context2.v;
            setUploadedVideoUrl(url);
            setUploadedVideoName(file.name);
            if (imageMode) {
              setUploadedImageUrl(null);
              setImageMode(false);
            }
            setV2vMode(true);
            firstV2V = _models.v2vModels[0];
            setSelectedModel(firstV2V.id);
            setSelectedModelName(firstV2V.name);
            applyControlsForModel(firstV2V.id, false, true);
            setPrompt("");
            setPromptDisabled(true);
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t2 = _context2.v;
            alert("Video upload failed: ".concat(_t2.message));
          case 5:
            _context2.p = 5;
            setVideoUploading(false);
            setVideoProgress(0);
            return _context2.f(5);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 4, 5, 6]]);
    }));
    return function processDroppedVideo(_x4) {
      return _ref7.apply(this, arguments);
    };
  }();

  // ── Handle Dropped Files ────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (droppedFiles && droppedFiles.length > 0) {
      var imageFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith('image/');
      });
      var videoFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith('video/');
      });
      if (videoFiles.length > 0) {
        processDroppedVideo(videoFiles[0]);
      } else if (imageFiles.length > 0) {
        processDroppedImage(imageFiles[0]);
      }
      onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
    }
  }, [droppedFiles, onFilesHandled, processDroppedImage, processDroppedVideo]);

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

  // ── textarea auto-resize ──────────────────────────────────────────────────
  var handlePromptInput = function handlePromptInput(e) {
    setPrompt(e.target.value);
    var el = e.target;
    el.style.height = "auto";
    var maxH = window.innerWidth < 768 ? 150 : 250;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  };

  // ── image upload ─────────────────────────────────────────────────────────
  var handleImageFileChange = /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(e) {
      var file, url, _currentT2VOrExtend$i, currentT2VOrExtend, _currentT2VOrExtend$i2, maxImgs, targetModelId, sibling, target, _maxImgs, _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            file = e.target.files[0];
            if (file) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            if (!(file.size > 10 * 1024 * 1024)) {
              _context3.n = 2;
              break;
            }
            alert("Image exceeds 10MB limit.");
            return _context3.a(2);
          case 2:
            setImageUploading(true);
            setImageProgress(0);
            _context3.p = 3;
            _context3.n = 4;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              setImageProgress(pct);
            });
          case 4:
            url = _context3.v;
            setUploadedImageUrl(url);

            // Motion-control v2v: image is a second input, not a mode switch
            if (isMotionControlSelection(selectedModel, v2vMode)) {
              setPromptDisabled(false);
              setUploadedImageUrls([url]);
            } else {
              // Model-native image reference (e.g. Seedance 2.0 Extend with inputs.images_list):
              // keep the current model & mode; just accumulate the image URL
              currentT2VOrExtend = _models.t2vModels.find(function (m) {
                return m.id === selectedModel;
              });
              if (currentT2VOrExtend !== null && currentT2VOrExtend !== void 0 && (_currentT2VOrExtend$i = currentT2VOrExtend.inputs) !== null && _currentT2VOrExtend$i !== void 0 && _currentT2VOrExtend$i.images_list) {
                maxImgs = ((_currentT2VOrExtend$i2 = currentT2VOrExtend.inputs) === null || _currentT2VOrExtend$i2 === void 0 || (_currentT2VOrExtend$i2 = _currentT2VOrExtend$i2.images_list) === null || _currentT2VOrExtend$i2 === void 0 ? void 0 : _currentT2VOrExtend$i2.maxItems) || 8;
                setUploadedImageUrls(function (prev) {
                  if (prev.includes(url)) return prev;
                  return [].concat(_toConsumableArray(prev), [url]).slice(0, maxImgs);
                });
                setPromptDisabled(false);
              } else {
                // Standard flow: clear v2v and switch to an I2V sibling model
                setUploadedVideoUrl(null);
                setUploadedVideoName(null);
                setV2vMode(false);
                targetModelId = selectedModel;
                if (!imageMode) {
                  sibling = currentT2VOrExtend !== null && currentT2VOrExtend !== void 0 && currentT2VOrExtend.family ? _models.i2vModels.find(function (m) {
                    return m.family === currentT2VOrExtend.family;
                  }) : null;
                  target = sibling || _models.i2vModels[0];
                  targetModelId = target.id;
                  setImageMode(true);
                  setSelectedModel(target.id);
                  setSelectedModelName(target.name);
                  applyControlsForModel(target.id, true, false);
                }
                _maxImgs = (0, _models.getMaxImagesForI2VModel)(targetModelId);
                if (_maxImgs > 2) {
                  setUploadedImageUrls(function (prev) {
                    if (prev.includes(url)) return prev;
                    return [].concat(_toConsumableArray(prev), [url]).slice(0, _maxImgs);
                  });
                } else {
                  setUploadedImageUrls([url]);
                }
                setPromptDisabled(false);
              }
            }
            _context3.n = 6;
            break;
          case 5:
            _context3.p = 5;
            _t3 = _context3.v;
            console.error("[VideoStudio] Image upload failed:", _t3);
            alert("Image upload failed: ".concat(_t3.message));
          case 6:
            _context3.p = 6;
            setImageUploading(false);
            setImageProgress(0);
            if (imageFileInputRef.current) imageFileInputRef.current.value = "";
            return _context3.f(6);
          case 7:
            return _context3.a(2);
        }
      }, _callee3, null, [[3, 5, 6, 7]]);
    }));
    return function handleImageFileChange(_x5) {
      return _ref8.apply(this, arguments);
    };
  }();
  var clearImageUpload = function clearImageUpload() {
    var _currentT2V$inputs;
    setUploadedImageUrl(null);
    setUploadedImageUrls([]);
    setUploadedEndImageUrl(null);
    // Motion-control v2v or model with inputs.images_list: keep model, just drop the image
    if (isMotionControlSelection(selectedModel, v2vMode)) return;
    var currentT2V = _models.t2vModels.find(function (m) {
      return m.id === selectedModel;
    });
    if (currentT2V !== null && currentT2V !== void 0 && (_currentT2V$inputs = currentT2V.inputs) !== null && _currentT2V$inputs !== void 0 && _currentT2V$inputs.images_list) return;
    setImageMode(false);
    var first = _models.t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
  };
  var removeImageAtIndex = function removeImageAtIndex(idx) {
    var nextUrls = uploadedImageUrls.filter(function (_, i) {
      return i !== idx;
    });
    setUploadedImageUrls(nextUrls);
    if (nextUrls.length === 0) {
      setUploadedImageUrl(null);
      // Reset to text-to-video if empty list
      if (isMotionControlSelection(selectedModel, v2vMode)) return;
      setImageMode(false);
      var first = _models.t2vModels[0];
      setSelectedModel(first.id);
      setSelectedModelName(first.name);
      applyControlsForModel(first.id, false, false);
      setPromptDisabled(false);
    } else {
      setUploadedImageUrl(nextUrls[0]);
    }
  };

  // ── end-frame upload (FLF i2v models) ──────────────────────────────────────
  var handleEndImageFileChange = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(e) {
      var file, url, _t4;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            file = e.target.files[0];
            if (file) {
              _context4.n = 1;
              break;
            }
            return _context4.a(2);
          case 1:
            if (!(file.size > 10 * 1024 * 1024)) {
              _context4.n = 2;
              break;
            }
            alert("Image exceeds 10MB limit.");
            return _context4.a(2);
          case 2:
            setEndImageUploading(true);
            setEndImageProgress(0);
            _context4.p = 3;
            _context4.n = 4;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              setEndImageProgress(pct);
            });
          case 4:
            url = _context4.v;
            setUploadedEndImageUrl(url);
            _context4.n = 6;
            break;
          case 5:
            _context4.p = 5;
            _t4 = _context4.v;
            alert("End frame upload failed: ".concat(_t4.message));
          case 6:
            _context4.p = 6;
            setEndImageUploading(false);
            setEndImageProgress(0);
            if (endImageFileInputRef.current) endImageFileInputRef.current.value = "";
            return _context4.f(6);
          case 7:
            return _context4.a(2);
        }
      }, _callee4, null, [[3, 5, 6, 7]]);
    }));
    return function handleEndImageFileChange(_x6) {
      return _ref9.apply(this, arguments);
    };
  }();
  var clearEndImage = function clearEndImage() {
    return setUploadedEndImageUrl(null);
  };

  // ── video upload ─────────────────────────────────────────────────────────
  var handleVideoFileChange = /*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(e) {
      var file, url, _currentT2VOrExtend$i3, currentT2VOrExtend, firstV2V, _t5;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            file = e.target.files[0];
            if (file) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2);
          case 1:
            if (!(file.size > 50 * 1024 * 1024)) {
              _context5.n = 2;
              break;
            }
            alert("Video exceeds 50MB limit.");
            return _context5.a(2);
          case 2:
            setVideoUploading(true);
            setVideoProgress(0);
            _context5.p = 3;
            _context5.n = 4;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              setVideoProgress(pct);
            });
          case 4:
            url = _context5.v;
            setUploadedVideoUrl(url);
            setUploadedVideoName(file.name);
            if (isMotionControlSelection(selectedModel, v2vMode)) {
              // Already in motion-control mode — keep model and image, allow prompt
              setPromptDisabled(false);
            } else {
              // Model-native video reference (e.g. Seedance 2.0 Extend with inputs.video_files):
              // keep the current model & mode; just store the video URL as a reference
              currentT2VOrExtend = _models.t2vModels.find(function (m) {
                return m.id === selectedModel;
              });
              if (currentT2VOrExtend !== null && currentT2VOrExtend !== void 0 && (_currentT2VOrExtend$i3 = currentT2VOrExtend.inputs) !== null && _currentT2VOrExtend$i3 !== void 0 && _currentT2VOrExtend$i3.video_files) {
                setPromptDisabled(false);
              } else {
                // Default v2v flow (e.g. watermark remover) — auto-pick the first v2v model
                if (imageMode) {
                  setUploadedImageUrl(null);
                  setImageMode(false);
                }
                setV2vMode(true);
                firstV2V = _models.v2vModels[0];
                setSelectedModel(firstV2V.id);
                setSelectedModelName(firstV2V.name);
                applyControlsForModel(firstV2V.id, false, true);
                setPrompt("");
                setPromptDisabled(true);
              }
            }
            _context5.n = 6;
            break;
          case 5:
            _context5.p = 5;
            _t5 = _context5.v;
            console.error("[VideoStudio] Video upload failed:", _t5);
            alert("Video upload failed: ".concat(_t5.message));
          case 6:
            _context5.p = 6;
            setVideoUploading(false);
            setVideoProgress(0);
            if (videoFileInputRef.current) videoFileInputRef.current.value = "";
            return _context5.f(6);
          case 7:
            return _context5.a(2);
        }
      }, _callee5, null, [[3, 5, 6, 7]]);
    }));
    return function handleVideoFileChange(_x7) {
      return _ref0.apply(this, arguments);
    };
  }();
  var clearVideoUpload = function clearVideoUpload() {
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    setV2vMode(false);
    var first = _models.t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
  };

  // ── model selection from dropdown ─────────────────────────────────────────
  var handleModelSelect = (0, _react.useCallback)(function (m, isV2V) {
    if (isV2V) {
      setV2vMode(true);
      setImageMode(false);
      var isMC = !!m.imageField;
      if (!isMC) {
        // Single-input v2v (watermark remover etc.) — drop any image
        setUploadedImageUrl(null);
      }
      setSelectedModel(m.id);
      setSelectedModelName(m.name);
      applyControlsForModel(m.id, false, true);
      if (isMC) {
        // Motion-control: prompt is editable, video+image are needed
        setPromptDisabled(false);
      } else {
        setPrompt("");
        setPromptDisabled(true);
      }
    } else {
      if (v2vMode) {
        setV2vMode(false);
        setUploadedVideoUrl(null);
        setUploadedVideoName(null);
        setPromptDisabled(false);
      }
      setSelectedModel(m.id);
      setSelectedModelName(m.name);
      applyControlsForModel(m.id, imageMode, false);
    }
  }, [v2vMode, imageMode, applyControlsForModel]);

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
  var handleGenerate = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
    var currentModel, isExtendMode, trimmedPrompt, maxImgs, hadError, res, _res, v2vParams, genId, entry, _res2, _maxImgs2, i2vParams, i2vModel, durations, resolutions, _genId, _entry, _res3, params, _durations, _resolutions, _genId2, _entry2, _e$message, _e$message2, _t6;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.p = _context6.n) {
        case 0:
          currentModel = getCurrentModel();
          isExtendMode = currentModel === null || currentModel === void 0 ? void 0 : currentModel.requiresRequestId;
          trimmedPrompt = prompt.trim();
          if (!v2vMode) {
            _context6.n = 4;
            break;
          }
          if (uploadedVideoUrl) {
            _context6.n = 1;
            break;
          }
          alert("Please upload a video first.");
          return _context6.a(2);
        case 1:
          if (!(currentModel !== null && currentModel !== void 0 && currentModel.imageField && !uploadedImageUrl)) {
            _context6.n = 2;
            break;
          }
          alert("Please upload a reference image for motion control.");
          return _context6.a(2);
        case 2:
          if (!(currentModel !== null && currentModel !== void 0 && currentModel.promptRequired && !trimmedPrompt)) {
            _context6.n = 3;
            break;
          }
          alert("Please describe the motion you want.");
          return _context6.a(2);
        case 3:
          _context6.n = 11;
          break;
        case 4:
          if (!isExtendMode) {
            _context6.n = 6;
            break;
          }
          if (lastGenerationId) {
            _context6.n = 5;
            break;
          }
          alert("No Seedance 2.0 generation found to extend. Generate a video first.");
          return _context6.a(2);
        case 5:
          _context6.n = 11;
          break;
        case 6:
          if (!imageMode) {
            _context6.n = 10;
            break;
          }
          maxImgs = (0, _models.getMaxImagesForI2VModel)(selectedModel);
          if (!(maxImgs > 2)) {
            _context6.n = 8;
            break;
          }
          if (!(uploadedImageUrls.length === 0)) {
            _context6.n = 7;
            break;
          }
          alert("Please upload at least one reference image first.");
          return _context6.a(2);
        case 7:
          _context6.n = 9;
          break;
        case 8:
          if (uploadedImageUrl) {
            _context6.n = 9;
            break;
          }
          alert("Please upload a start frame image first.");
          return _context6.a(2);
        case 9:
          _context6.n = 11;
          break;
        case 10:
          if (trimmedPrompt) {
            _context6.n = 11;
            break;
          }
          alert("Please enter a prompt to generate a video.");
          return _context6.a(2);
        case 11:
          setGenerating(true);
          setGenerateError(null);
          hadError = false;
          _context6.p = 12;
          if (!v2vMode) {
            _context6.n = 15;
            break;
          }
          // V2V: dedicated processV2V handles single-input tools (e.g. watermark
          // remover) and motion-control models (which take video + image + prompt)
          v2vParams = {
            model: selectedModel,
            video_url: uploadedVideoUrl
          };
          if (currentModel !== null && currentModel !== void 0 && currentModel.imageField && uploadedImageUrl) {
            v2vParams.image_url = uploadedImageUrl;
          }
          if (currentModel !== null && currentModel !== void 0 && currentModel.hasPrompt && trimmedPrompt) {
            v2vParams.prompt = trimmedPrompt;
          }
          _context6.n = 13;
          return (0, _muapi.processV2V)(apiKey, v2vParams);
        case 13:
          res = _context6.v;
          if ((_res = res) !== null && _res !== void 0 && _res.url) {
            _context6.n = 14;
            break;
          }
          throw new Error("No video URL returned by API");
        case 14:
          genId = res.id || Date.now().toString();
          setLastGenerationId(null);
          setLastGenerationModel(null);
          entry = {
            id: genId,
            url: res.url,
            prompt: currentModel !== null && currentModel !== void 0 && currentModel.hasPrompt ? trimmedPrompt : "",
            model: selectedModel,
            timestamp: new Date().toISOString()
          };
          addToLocalHistory(entry);
          showVideoInCanvas(res.url, selectedModel);
          if (onGenerationComplete) onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: currentModel !== null && currentModel !== void 0 && currentModel.hasPrompt ? trimmedPrompt : "",
            type: "video"
          });
          _context6.n = 21;
          break;
        case 15:
          if (!imageMode) {
            _context6.n = 18;
            break;
          }
          _maxImgs2 = (0, _models.getMaxImagesForI2VModel)(selectedModel);
          i2vParams = {
            model: selectedModel
          };
          if (_maxImgs2 > 2) {
            i2vParams.images_list = uploadedImageUrls;
          } else {
            i2vParams.image_url = uploadedImageUrl;
          }
          if (trimmedPrompt) i2vParams.prompt = trimmedPrompt;
          i2vParams.aspect_ratio = selectedAr;
          i2vModel = _models.i2vModels.find(function (m) {
            return m.id === selectedModel;
          });
          if (uploadedEndImageUrl && i2vModel !== null && i2vModel !== void 0 && i2vModel.lastImageField) {
            i2vParams.last_image = uploadedEndImageUrl;
          }
          durations = (0, _models.getDurationsForI2VModel)(selectedModel);
          if (durations.length > 0) i2vParams.duration = selectedDuration;
          resolutions = (0, _models.getResolutionsForI2VModel)(selectedModel);
          if (resolutions.length > 0) i2vParams.resolution = selectedResolution;
          if (selectedQuality) i2vParams.quality = selectedQuality;
          if (selectedMode) i2vParams.mode = selectedMode;
          if (showEffect && selectedEffect) i2vParams.name = selectedEffect;
          _context6.n = 16;
          return (0, _muapi.generateI2V)(apiKey, i2vParams);
        case 16:
          res = _context6.v;
          if ((_res2 = res) !== null && _res2 !== void 0 && _res2.url) {
            _context6.n = 17;
            break;
          }
          throw new Error("No video URL returned by API");
        case 17:
          _genId = res.id || Date.now().toString();
          if (selectedModel === "seedance-v2.0-i2v") {
            setLastGenerationId(_genId);
            setLastGenerationModel(selectedModel);
          } else {
            setLastGenerationId(null);
            setLastGenerationModel(null);
          }
          _entry = {
            id: _genId,
            url: res.url,
            prompt: trimmedPrompt,
            model: selectedModel,
            aspect_ratio: selectedAr,
            duration: selectedDuration,
            timestamp: new Date().toISOString()
          };
          addToLocalHistory(_entry);
          showVideoInCanvas(res.url, selectedModel);
          if (onGenerationComplete) onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video"
          });
          _context6.n = 21;
          break;
        case 18:
          // T2V (including extend mode)
          params = {
            model: selectedModel
          };
          if (trimmedPrompt) params.prompt = trimmedPrompt;
          if (isExtendMode) {
            params.request_id = lastGenerationId;
            // Optional reference media for Seedance 2.0 Extend:
            // images map to @image2…@image9 and videos map to @video1…@video3 in the prompt
            if (uploadedImageUrls.length > 0) {
              params.images_list = uploadedImageUrls;
            }
            if (uploadedVideoUrl) {
              params.videos_list = [uploadedVideoUrl];
            }
          } else {
            params.aspect_ratio = selectedAr;
          }
          _durations = (0, _models.getDurationsForModel)(selectedModel);
          if (_durations.length > 0) params.duration = selectedDuration;
          _resolutions = (0, _models.getResolutionsForVideoModel)(selectedModel);
          if (_resolutions.length > 0) params.resolution = selectedResolution;
          if (selectedQuality) params.quality = selectedQuality;
          if (selectedMode) params.mode = selectedMode;
          _context6.n = 19;
          return (0, _muapi.generateVideo)(apiKey, params);
        case 19:
          res = _context6.v;
          if ((_res3 = res) !== null && _res3 !== void 0 && _res3.url) {
            _context6.n = 20;
            break;
          }
          throw new Error("No video URL returned by API");
        case 20:
          _genId2 = res.id || Date.now().toString();
          if (selectedModel === "seedance-v2.0-t2v" || selectedModel === "seedance-v2.0-i2v") {
            setLastGenerationId(_genId2);
            setLastGenerationModel(selectedModel);
          } else {
            setLastGenerationId(null);
            setLastGenerationModel(null);
          }
          _entry2 = {
            id: _genId2,
            url: res.url,
            prompt: trimmedPrompt,
            model: selectedModel,
            aspect_ratio: selectedAr,
            duration: selectedDuration,
            timestamp: new Date().toISOString()
          };
          addToLocalHistory(_entry2);
          showVideoInCanvas(res.url, selectedModel);
          if (onGenerationComplete) onGenerationComplete({
            url: res.url,
            model: selectedModel,
            prompt: trimmedPrompt,
            type: "video"
          });
        case 21:
          _context6.n = 23;
          break;
        case 22:
          _context6.p = 22;
          _t6 = _context6.v;
          hadError = true;
          console.error("[VideoStudio]", _t6);
          setGenerateError(((_e$message = _t6.message) === null || _e$message === void 0 ? void 0 : _e$message.slice(0, 80)) || "Generation failed");
          setTimeout(function () {
            return setGenerateError(null);
          }, 4000);
          onGenerationError === null || onGenerationError === void 0 || onGenerationError(((_e$message2 = _t6.message) === null || _e$message2 === void 0 ? void 0 : _e$message2.slice(0, 120)) || "Video generation failed");
        case 23:
          _context6.p = 23;
          setGenerating(false);
          return _context6.f(23);
        case 24:
          return _context6.a(2);
      }
    }, _callee6, null, [[12, 22, 23, 24]]);
  })), [apiKey, prompt, v2vMode, imageMode, selectedModel, selectedAr, selectedDuration, selectedResolution, selectedQuality, selectedMode, selectedEffect, showEffect, uploadedImageUrl, uploadedImageUrls, uploadedVideoUrl, lastGenerationId, getCurrentModel, addToLocalHistory, showVideoInCanvas, onGenerationComplete]);

  // ── reset to prompt bar ───────────────────────────────────────────────────
  var resetToPromptBar = (0, _react.useCallback)(function () {
    setShowCanvas(false);
  }, []);
  var handleNewPrompt = (0, _react.useCallback)(function () {
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrl(null);
    setUploadedImageUrls([]);
    setImageMode(false);
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    setV2vMode(false);
    var first = _models.t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
    setTimeout(function () {
      var _textareaRef$current;
      return (_textareaRef$current = textareaRef.current) === null || _textareaRef$current === void 0 ? void 0 : _textareaRef$current.focus();
    }, 50);
  }, [resetToPromptBar, applyControlsForModel]);
  var handleExtend = (0, _react.useCallback)(function () {
    if (!lastGenerationId) return;
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrl(null);
    setUploadedImageUrls([]);
    setImageMode(false);
    setSelectedModel("seedance-v2.0-extend");
    setSelectedModelName("Seedance 2.0 Extend");
    applyControlsForModel("seedance-v2.0-extend", false, false);
    setPromptDisabled(false);
    setTimeout(function () {
      var _textareaRef$current2;
      return (_textareaRef$current2 = textareaRef.current) === null || _textareaRef$current2 === void 0 ? void 0 : _textareaRef$current2.focus();
    }, 50);
  }, [lastGenerationId, resetToPromptBar, applyControlsForModel]);

  // ── derived UI values ────────────────────────────────────────────────────
  var isSeedance2Canvas = canvasModel === "seedance-v2.0-t2v" || canvasModel === "seedance-v2.0-i2v";
  var currentModelObj = getCurrentModel();
  var isExtendMode = currentModelObj === null || currentModelObj === void 0 ? void 0 : currentModelObj.requiresRequestId;
  var promptPlaceholder = v2vMode ? currentModelObj !== null && currentModelObj !== void 0 && currentModelObj.imageField ? currentModelObj !== null && currentModelObj !== void 0 && currentModelObj.promptRequired ? "Describe the motion" : "Describe the motion (optional)" : "Video ready — click Generate to remove watermark" : imageMode ? "Describe the motion or effect (optional)" : isExtendMode ? "Optional: describe how to continue the video..." : "Describe the video you want to create";
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
          var _entry$model;
          var isSeedance2 = entry.model === "seedance-v2.0-t2v" || entry.model === "seedance-v2.0-i2v";
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col",
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
                title: "Extend this video using Seedance 2.0 Extend",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setLastGenerationId(entry.id);
                  handleExtend();
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
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Delete",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this generated item?")) {
                    setLocalHistory(function (prev) {
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
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-white/70 text-xs line-clamp-3 leading-relaxed",
                title: entry.prompt,
                children: entry.prompt || "No prompt provided"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center justify-between mt-1 flex-wrap gap-1",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap",
                  children: (_entry$model = entry.model) === null || _entry$model === void 0 ? void 0 : _entry$model.replace("-", " ")
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
            children: selectedModelName
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4",
          children: "Animate images into stunning AI videos with motion effects"
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
          className: "flex flex-col gap-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2.5 flex-wrap",
            children: [uploadedImageUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden shadow-md group",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                src: uploadedImageUrl,
                alt: "",
                className: "w-full h-full object-cover"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                onClick: clearImageUpload,
                className: "absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white/85 hover:text-white text-[8px] border border-white/5",
                children: "\xD7"
              })]
            }), uploadedEndImageUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden shadow-md group",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                src: uploadedEndImageUrl,
                alt: "",
                className: "w-full h-full object-cover"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                onClick: clearEndImage,
                className: "absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white/85 hover:text-white text-[8px] border border-white/5",
                children: "\xD7"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "absolute bottom-0.5 left-0.5 px-1 h-3.5 bg-black/60 rounded-md text-[7px] font-black text-[#22d3ee] leading-none flex items-center justify-center pointer-events-none",
                children: "END"
              })]
            }), uploadedVideoUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden shadow-md group",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
                src: uploadedVideoUrl,
                className: "w-full h-full object-cover",
                muted: true
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                onClick: clearVideoUpload,
                className: "absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white/85 hover:text-white text-[8px] border border-white/5",
                children: "\xD7"
              })]
            }), imageMode && (0, _models.getMaxImagesForI2VModel)(selectedModel) > 2 && /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
              children: uploadedImageUrls.map(function (url, idx) {
                return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden shadow-md group",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                    src: url,
                    alt: "",
                    className: "w-full h-full object-cover"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                    type: "button",
                    onClick: function onClick() {
                      return removeImageAtIndex(idx);
                    },
                    className: "absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white/85 hover:text-white text-[8px] border border-white/5",
                    children: "\xD7"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "absolute bottom-0.5 right-0.5 px-1 h-3.5 bg-black/60 rounded-full text-[8px] font-black text-[#22d3ee] leading-none flex items-center justify-center pointer-events-none",
                    children: idx + 1
                  })]
                }, idx);
              })
            }), (!v2vMode || isMotionControlSelection(selectedModel, v2vMode)) && (!isExtendMode || (currentModelObj === null || currentModelObj === void 0 || (_currentModelObj$inpu = currentModelObj.inputs) === null || _currentModelObj$inpu === void 0 ? void 0 : _currentModelObj$inpu.images_list)) && ((0, _models.getMaxImagesForI2VModel)(selectedModel) > 2 ? uploadedImageUrls.length < (0, _models.getMaxImagesForI2VModel)(selectedModel) && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                ref: imageFileInputRef,
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: handleImageFileChange
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Upload reference image",
                onClick: function onClick() {
                  var _imageFileInputRef$cu;
                  return (_imageFileInputRef$cu = imageFileInputRef.current) === null || _imageFileInputRef$cu === void 0 ? void 0 : _imageFileInputRef$cu.click();
                },
                className: "w-12 h-12 shrink-0 rounded-xl border border-dashed border-white/10 hover:border-[#22d3ee]/40 bg-white/[0.02] hover:bg-white/5 transition-all flex items-center justify-center relative overflow-hidden group",
                children: imageUploading ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
                      strokeDashoffset: 88 - 88 * imageProgress / 100,
                      className: "text-[#22d3ee] transition-all duration-300"
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                    className: "absolute text-[9px] font-black text-[#22d3ee] leading-none",
                    children: [imageProgress, "%"]
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
              })]
            }) : !uploadedImageUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                ref: imageFileInputRef,
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: handleImageFileChange
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Upload reference image",
                onClick: function onClick() {
                  var _imageFileInputRef$cu2;
                  return (_imageFileInputRef$cu2 = imageFileInputRef.current) === null || _imageFileInputRef$cu2 === void 0 ? void 0 : _imageFileInputRef$cu2.click();
                },
                className: "w-12 h-12 shrink-0 rounded-xl border border-dashed border-white/10 hover:border-[#22d3ee]/40 bg-white/[0.02] hover:bg-white/5 transition-all flex items-center justify-center relative overflow-hidden group",
                children: imageUploading ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
                      strokeDashoffset: 88 - 88 * imageProgress / 100,
                      className: "text-[#22d3ee] transition-all duration-300"
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                    className: "absolute text-[9px] font-black text-[#22d3ee] leading-none",
                    children: [imageProgress, "%"]
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
              })]
            })), imageMode && ((_i2vModels$find = _models.i2vModels.find(function (m) {
              return m.id === selectedModel;
            })) === null || _i2vModels$find === void 0 ? void 0 : _i2vModels$find.lastImageField) && !uploadedEndImageUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                ref: endImageFileInputRef,
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: handleEndImageFileChange
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Upload end frame (optional)",
                onClick: function onClick() {
                  var _endImageFileInputRef;
                  return (_endImageFileInputRef = endImageFileInputRef.current) === null || _endImageFileInputRef === void 0 ? void 0 : _endImageFileInputRef.click();
                },
                className: "w-12 h-12 shrink-0 rounded-xl border border-dashed border-white/10 hover:border-[#22d3ee]/40 bg-white/[0.02] hover:bg-white/5 transition-all flex items-center justify-center relative overflow-hidden group",
                children: endImageUploading ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
                      strokeDashoffset: 88 - 88 * endImageProgress / 100,
                      className: "text-[#22d3ee] transition-all duration-300"
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                    className: "absolute text-[9px] font-black text-[#22d3ee] leading-none",
                    children: [endImageProgress, "%"]
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
              })]
            }), !uploadedVideoUrl && (v2vMode || (currentModelObj === null || currentModelObj === void 0 || (_currentModelObj$inpu2 = currentModelObj.inputs) === null || _currentModelObj$inpu2 === void 0 ? void 0 : _currentModelObj$inpu2.video_files)) && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                ref: videoFileInputRef,
                type: "file",
                accept: "video/*",
                className: "hidden",
                onChange: handleVideoFileChange
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Upload video to remove watermark",
                onClick: function onClick() {
                  var _videoFileInputRef$cu;
                  return (_videoFileInputRef$cu = videoFileInputRef.current) === null || _videoFileInputRef$cu === void 0 ? void 0 : _videoFileInputRef$cu.click();
                },
                className: "w-12 h-12 shrink-0 rounded-xl border border-dashed border-white/10 hover:border-[#22d3ee]/40 bg-white/[0.02] hover:bg-white/5 transition-all flex items-center justify-center relative overflow-hidden group",
                children: videoUploading ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
                      strokeDashoffset: 88 - 88 * videoProgress / 100,
                      className: "text-[#22d3ee] transition-all duration-300"
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                    className: "absolute text-[9px] font-black text-[#22d3ee] leading-none",
                    children: [videoProgress, "%"]
                  })]
                }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "text-white/40 group-hover:text-[#22d3ee] transition-colors",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                    points: "23 7 16 12 23 17 23 7",
                    fill: "currentColor"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                    x: "1",
                    y: "5",
                    width: "15",
                    height: "14",
                    rx: "2",
                    ry: "2",
                    fill: "currentColor"
                  })]
                })
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex-1 flex flex-col gap-1",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
              ref: textareaRef,
              value: prompt,
              onChange: handlePromptInput,
              placeholder: promptPlaceholder,
              disabled: promptDisabled,
              rows: 1,
              className: "w-full bg-transparent border-none text-white text-sm placeholder:text-white/10 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar disabled:opacity-40"
            })
          })]
        }), isExtendMode && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
            children: "Extending previous Seedance 2.0 generation"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-white/[0.03] relative",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 relative flex-wrap pb-1 md:pb-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("model"),
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-4 h-4 rounded overflow-hidden shrink-0 flex items-center justify-center bg-white/5",
                  children: function () {
                    var allCurrentModels = [].concat(_toConsumableArray(_models.t2vModels), _toConsumableArray(_models.i2vModels), _toConsumableArray(_models.v2vModels));
                    var selectedModelObj = allCurrentModels.find(function (m) {
                      return m.id === selectedModel;
                    });
                    var selectedModelProvider = (selectedModelObj === null || selectedModelObj === void 0 ? void 0 : selectedModelObj.provider) || 'muapi';
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
                  className: "text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: selectedModelName
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "8",
                  height: "8",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "4",
                  className: "opacity-20 group-hover:opacity-100 transition-opacity",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M6 9l6 6 6-6"
                  })
                })]
              }), openDropdown === "model" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                ref: dropdownRef,
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-[1.5rem] p-3.5 shadow-2xl border border-white/[0.05] w-[calc(100vw-2rem)] md:w-[480px] max-w-md md:max-w-none",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(ModelDropdown, {
                  imageMode: imageMode,
                  selectedModel: selectedModel,
                  onSelect: handleModelSelect,
                  onClose: function onClose() {
                    return setOpenDropdown(null);
                  }
                })
              })]
            }), showAr && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("ar"),
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  className: "opacity-40 text-white",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                    x: "3",
                    y: "3",
                    width: "18",
                    height: "18",
                    rx: "2",
                    ry: "2"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: selectedAr
                })]
              }), openDropdown === "ar" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                ref: dropdownRef,
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 max-h-80 overflow-y-auto custom-scrollbar shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[160px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-semibold text-white/30 uppercase tracking-wider pb-2 border-b border-white/[0.05] mb-2 px-1",
                  children: "Aspect Ratio"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: getCurrentAspectRatios(selectedModel).map(function (r) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-2.5 px-3 hover:bg-[#22d3ee]/10 hover:text-white rounded-xl cursor-pointer transition-all group/opt",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        setSelectedAr(r);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-xs font-semibold text-white/70 group-hover/opt:text-[#22d3ee] transition-colors",
                        children: r
                      }), selectedAr === r && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, r);
                  })
                })]
              })]
            }), showEffect && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("effect"),
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  className: "opacity-40 text-white",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M5 3l14 9-14 9V3z"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors max-w-[140px] truncate",
                  children: selectedEffect || "Effect"
                })]
              }), openDropdown === "effect" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                ref: dropdownRef,
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 max-h-80 overflow-y-auto custom-scrollbar shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[200px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-semibold text-white/30 uppercase tracking-wider pb-2 border-b border-white/[0.05] mb-2 px-1",
                  children: "Effect Type"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: (0, _models.getEffectsForI2VModel)(selectedModel).map(function (eff) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-2.5 px-3 hover:bg-[#22d3ee]/10 hover:text-white rounded-xl cursor-pointer transition-all group/opt",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        setSelectedEffect(eff);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-xs font-semibold text-white/70 group-hover/opt:text-[#22d3ee] transition-colors",
                        children: eff
                      }), selectedEffect === eff && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, eff);
                  })
                })]
              })]
            }), showDuration && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("duration"),
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  className: "opacity-40 text-white",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                    cx: "12",
                    cy: "12",
                    r: "10"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "12 6 12 12 16 14"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                  className: "text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: [selectedDuration, "s"]
                })]
              }), openDropdown === "duration" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                ref: dropdownRef,
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[140px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-semibold text-white/30 uppercase tracking-wider pb-2 border-b border-white/[0.05] mb-2 px-1",
                  children: "Duration"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: getCurrentDurations(selectedModel).map(function (d) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-2.5 px-3 hover:bg-[#22d3ee]/10 hover:text-white rounded-xl cursor-pointer transition-all group/opt",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        setSelectedDuration(d);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                        className: "text-xs font-semibold text-white/70 group-hover/opt:text-[#22d3ee] transition-colors",
                        children: [d, "s"]
                      }), selectedDuration === d && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, d);
                  })
                })]
              })]
            }), showResolution && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("resolution"),
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "opacity-40 text-white",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                    points: "12 2 22 12 12 22 2 12"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: selectedResolution || "720p"
                })]
              }), openDropdown === "resolution" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                ref: dropdownRef,
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[140px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-semibold text-white/30 uppercase tracking-wider pb-2 border-b border-white/[0.05] mb-2 px-1",
                  children: "Resolution"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: getCurrentResolutions(selectedModel).map(function (r) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-2.5 px-3 hover:bg-[#22d3ee]/10 hover:text-white rounded-xl cursor-pointer transition-all group/opt",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        setSelectedResolution(r);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-xs font-semibold text-white/70 group-hover/opt:text-[#22d3ee] transition-colors",
                        children: r
                      }), selectedResolution === r && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, r);
                  })
                })]
              })]
            }), showQuality && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("quality"),
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "opacity-60 text-secondary",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors capitalize",
                  children: selectedQuality || "basic"
                })]
              }), openDropdown === "quality" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                ref: dropdownRef,
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[140px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-semibold text-white/30 uppercase tracking-wider pb-2 border-b border-white/[0.05] mb-2 px-1",
                  children: "Quality"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: getQualitiesForModel(imageMode ? _models.i2vModels : _models.t2vModels, selectedModel).map(function (q) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-2.5 px-3 hover:bg-[#22d3ee]/10 hover:text-white rounded-xl cursor-pointer transition-all group/opt",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        setSelectedQuality(q);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-xs font-semibold text-white/70 group-hover/opt:text-[#22d3ee] transition-colors capitalize",
                        children: q
                      }), selectedQuality === q && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, q);
                  })
                })]
              })]
            }), showMode && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("mode"),
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  className: "opacity-60 text-secondary",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors capitalize",
                  children: selectedMode || "normal"
                })]
              }), openDropdown === "mode" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                ref: dropdownRef,
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[140px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-semibold text-white/30 uppercase tracking-wider pb-2 border-b border-white/[0.05] mb-2 px-1",
                  children: "Mode"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: (0, _models.getModesForModel)(selectedModel).map(function (m) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-2.5 px-3 hover:bg-[#22d3ee]/10 hover:text-white rounded-xl cursor-pointer transition-all group/opt",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        setSelectedMode(m);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-xs font-semibold text-white/70 group-hover/opt:text-[#22d3ee] transition-colors capitalize",
                        children: m
                      }), selectedMode === m && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, m);
                  })
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: handleGenerate,
            disabled: generating,
            className: "bg-[#22d3ee] text-black px-7 py-3 rounded-full font-bold text-sm hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/20 hover:shadow-[#22d3ee]/35 border border-[#22d3ee]/10 disabled:opacity-50 disabled:cursor-not-allowed",
            children: generating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "animate-spin inline-block text-black",
                children: "\u25CC"
              }), " ", "Generating..."]
            }) : generateError ? "Error: ".concat(generateError) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                children: "Generate"
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