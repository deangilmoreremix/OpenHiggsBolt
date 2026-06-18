"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = VibeMotionStudio;
var _react = require("react");
var _muapi = require("../muapi.js");
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["canEdit"],
  _excluded2 = ["canEdit"];
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // ── helpers ───────────────────────────────────────────────────────────────────
function downloadFile(_x, _x2) {
  return _downloadFile.apply(this, arguments);
}
function _downloadFile() {
  _downloadFile = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(url, filename) {
    var res, blob, blobUrl, a, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          _context2.p = 0;
          _context2.n = 1;
          return fetch(url);
        case 1:
          res = _context2.v;
          _context2.n = 2;
          return res.blob();
        case 2:
          blob = _context2.v;
          blobUrl = URL.createObjectURL(blob);
          a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          _context2.n = 4;
          break;
        case 3:
          _context2.p = 3;
          _t2 = _context2.v;
          window.open(url, "_blank");
        case 4:
          return _context2.a(2);
      }
    }, _callee2, null, [[0, 3]]);
  }));
  return _downloadFile.apply(this, arguments);
}
var formatTime = function formatTime(s) {
  return "".concat(Math.floor(s / 60), ":").concat(String(s % 60).padStart(2, "0"));
};

// ── icons ─────────────────────────────────────────────────────────────────────
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

// ── Dropdown helper ───────────────────────────────────────────────────────────
function DropdownItem(_ref) {
  var label = _ref.label,
    selected = _ref.selected,
    onClick = _ref.onClick;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex items-center justify-between p-3.5 hover:bg-white/5 rounded cursor-pointer transition-all group",
    onClick: onClick,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "text-xs font-bold text-white opacity-80 group-hover:opacity-100",
      children: label
    }), selected && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
function VibeMotionStudio(_ref2) {
  var _sourceEntry$prompt, _sourceEntry$prompt2, _sourceEntry$prompt3;
  var apiKey = _ref2.apiKey;
  var PERSIST_KEY = "hg_vibe_motion_studio_persistent";

  // ── Params ────────────────────────────────────────────────────────────────
  var _useState = (0, _react.useState)(""),
    _useState2 = _slicedToArray(_useState, 2),
    prompt = _useState2[0],
    setPrompt = _useState2[1];
  var _useState3 = (0, _react.useState)("16:9"),
    _useState4 = _slicedToArray(_useState3, 2),
    aspectRatio = _useState4[0],
    setAspectRatio = _useState4[1];
  var _useState5 = (0, _react.useState)(6),
    _useState6 = _slicedToArray(_useState5, 2),
    duration = _useState6[0],
    setDuration = _useState6[1];

  // ── Edit mode ─────────────────────────────────────────────────────────────
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    editMode = _useState8[0],
    setEditMode = _useState8[1];
  var _useState9 = (0, _react.useState)(null),
    _useState0 = _slicedToArray(_useState9, 2),
    editSourceId = _useState0[0],
    setEditSourceId = _useState0[1]; // request_id of source

  // ── Dropdown open state ───────────────────────────────────────────────────
  var _useState1 = (0, _react.useState)(null),
    _useState10 = _slicedToArray(_useState1, 2),
    openDropdown = _useState10[0],
    setOpenDropdown = _useState10[1]; // "ar" | "dur" | "source"
  var containerRef = (0, _react.useRef)(null);
  var textareaRef = (0, _react.useRef)(null);

  // ── Generation state ──────────────────────────────────────────────────────
  var _useState11 = (0, _react.useState)(false),
    _useState12 = _slicedToArray(_useState11, 2),
    generating = _useState12[0],
    setGenerating = _useState12[1];
  var _useState13 = (0, _react.useState)(null),
    _useState14 = _slicedToArray(_useState13, 2),
    generateError = _useState14[0],
    setGenerateError = _useState14[1];
  var _useState15 = (0, _react.useState)(0),
    _useState16 = _slicedToArray(_useState15, 2),
    elapsedTime = _useState16[0],
    setElapsedTime = _useState16[1];
  var timerRef = (0, _react.useRef)(null);
  var pendingRequestId = (0, _react.useRef)(null);

  // ── History ───────────────────────────────────────────────────────────────
  var _useState17 = (0, _react.useState)([]),
    _useState18 = _slicedToArray(_useState17, 2),
    history = _useState18[0],
    setHistory = _useState18[1];
  var _useState19 = (0, _react.useState)(null),
    _useState20 = _slicedToArray(_useState19, 2),
    fullscreenUrl = _useState20[0],
    setFullscreenUrl = _useState20[1];

  // ── Load from localStorage ─────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var saved = JSON.parse(localStorage.getItem(PERSIST_KEY) || "[]");
      if (Array.isArray(saved)) {
        // Strip any wrongly-persisted canEdit:false flags from old bug — restore all entries as remixable
        var restored = saved.map(function (h) {
          var canEdit = h.canEdit,
            rest = _objectWithoutProperties(h, _excluded);
          return rest; // canEdit is only an in-memory hint, never persisted
        });
        setHistory(restored);
      }
    } catch (_) {}
  }, []);
  var saveHistory = (0, _react.useCallback)(function (items) {
    setHistory(items);
    // Strip canEdit from persisted data — it is an in-memory hint only
    var stripped = items.map(function (_ref3) {
      var canEdit = _ref3.canEdit,
        rest = _objectWithoutProperties(_ref3, _excluded2);
      return rest;
    });
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(stripped));
    } catch (_) {}
  }, []);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  (0, _react.useEffect)(function () {
    var handler = function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return function () {
      return document.removeEventListener("mousedown", handler);
    };
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  var startTimer = function startTimer() {
    setElapsedTime(0);
    timerRef.current = setInterval(function () {
      return setElapsedTime(function (t) {
        return t + 1;
      });
    }, 1000);
  };
  var stopTimer = function stopTimer() {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };
  (0, _react.useEffect)(function () {
    return function () {
      return stopTimer();
    };
  }, []);

  // ── Generate ──────────────────────────────────────────────────────────────
  var handleGenerate = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var _result, _result2, _result3, _result4, _result5, result, videoUrl, requestId, entry, next, raw, isStaleEdit, _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (!(!prompt.trim() || generating)) {
            _context.n = 1;
            break;
          }
          return _context.a(2);
        case 1:
          setGenerating(true);
          setGenerateError(null);
          startTimer();
          _context.p = 2;
          if (!editMode) {
            _context.n = 4;
            break;
          }
          _context.n = 3;
          return (0, _muapi.runMotionGraphicsEdit)(apiKey, {
            request_id: editSourceId,
            edit_prompt: prompt.trim(),
            aspect_ratio: aspectRatio,
            duration_seconds: duration,
            onRequestId: function onRequestId(id) {
              pendingRequestId.current = id;
            }
          });
        case 3:
          result = _context.v;
          _context.n = 6;
          break;
        case 4:
          _context.n = 5;
          return (0, _muapi.runMotionGraphics)(apiKey, {
            prompt: prompt.trim(),
            aspect_ratio: aspectRatio,
            duration_seconds: duration,
            onRequestId: function onRequestId(id) {
              pendingRequestId.current = id;
            }
          });
        case 5:
          result = _context.v;
        case 6:
          videoUrl = ((_result = result) === null || _result === void 0 || (_result = _result.output) === null || _result === void 0 ? void 0 : _result.video) || ((_result2 = result) === null || _result2 === void 0 ? void 0 : _result2.url) || ((_result3 = result) === null || _result3 === void 0 || (_result3 = _result3.outputs) === null || _result3 === void 0 ? void 0 : _result3[0]);
          requestId = ((_result4 = result) === null || _result4 === void 0 ? void 0 : _result4.id) || ((_result5 = result) === null || _result5 === void 0 ? void 0 : _result5.request_id) || pendingRequestId.current;
          entry = {
            id: requestId || Date.now().toString(),
            requestId: requestId,
            url: videoUrl,
            prompt: prompt.trim(),
            aspectRatio: aspectRatio,
            duration: duration,
            mode: editMode ? "edit" : "generate",
            sourceId: editMode ? editSourceId : null,
            timestamp: new Date().toISOString(),
            // Mark as editable — only generations created with saved animation code can be remixed
            canEdit: true
          };
          next = [entry].concat(_toConsumableArray(history)).slice(0, 30);
          saveHistory(next);
          _context.n = 8;
          break;
        case 7:
          _context.p = 7;
          _t = _context.v;
          // Detect the backend's "animation code not saved" limitation
          raw = _t.message || "";
          isStaleEdit = raw.includes("animation code") || raw.includes("does not have saved") || raw.includes("Original generation does not");
          if (isStaleEdit) {
            // Known backend limitation — warn only (not error), keep console clean
            console.warn("[VibeMotionStudio] Remix unavailable:", raw.slice(0, 120));
            setGenerateError("This generation can't be remixed — the animation code wasn't saved server-side. " + "Generate a new motion graphic first, then remix that result.");
            // Exit edit mode WITHOUT persisting canEdit:false — let user retry after refresh
            setEditMode(false);
            setEditSourceId(null);
          } else {
            console.error("[VibeMotionStudio]", _t);
            setGenerateError(raw.slice(0, 120) || "Generation failed");
          }
          setTimeout(function () {
            return setGenerateError(null);
          }, 10000);
        case 8:
          _context.p = 8;
          setGenerating(false);
          stopTimer();
          return _context.f(8);
        case 9:
          return _context.a(2);
      }
    }, _callee, null, [[2, 7, 8, 9]]);
  })), [apiKey, prompt, editMode, editSourceId, aspectRatio, duration, history, saveHistory]);
  var handleKeyDown = function handleKeyDown(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerate();
  };
  var toggleDropdown = function toggleDropdown(type) {
    return function (e) {
      e.stopPropagation();
      setOpenDropdown(function (prev) {
        return prev === type ? null : type;
      });
    };
  };
  var ASPECT_RATIOS = ["16:9", "9:16", "1:1"];
  var DURATION_OPTIONS = [5, 6, 8, 10, 12, 15, 20, 25, 30];

  // Show all entries with a requestId as editable UNLESS they are explicitly marked canEdit:false
  // (entries loaded from localStorage without the flag are treated as optimistically editable)
  var editSources = history.filter(function (h) {
    return h.requestId && h.canEdit !== false;
  });
  var sourceEntry = editSources.find(function (h) {
    return h.requestId === editSourceId;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    ref: containerRef,
    className: "w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden",
    children: [fullscreenUrl && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "fixed inset-0 z-[200] bg-black/95 flex items-center justify-center",
      onClick: function onClick() {
        return setFullscreenUrl(null);
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
        src: fullscreenUrl,
        autoPlay: true,
        loop: true,
        controls: true,
        className: "max-h-[90vh] max-w-[90vw] rounded shadow-2xl",
        onClick: function onClick(e) {
          return e.stopPropagation();
        }
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        className: "absolute top-6 right-6 text-white/60 hover:text-white transition-colors text-3xl font-light leading-none",
        onClick: function onClick() {
          return setFullscreenUrl(null);
        },
        children: "\xD7"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2",
      children: [generating &&
      /*#__PURE__*/
      /* ── Loading card at top of grid ── */
      (0, _jsxRuntime.jsx)("div", {
        className: "w-full pt-6 flex justify-center animate-fade-in-up",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col items-center gap-4 py-16",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative w-20 h-20",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute inset-2 rounded-full border-2 border-[#22d3ee]/30 animate-spin"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute inset-4 rounded-full border-2 border-violet-400/50 animate-[spin_1.5s_linear_infinite_reverse]"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute inset-0 flex items-center justify-center",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "text-violet-400 animate-pulse",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
                })
              })
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col items-center gap-1",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-white/80 font-semibold text-sm",
              children: editMode ? "Remixing motion graphics…" : "Generating motion graphics…"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-white/30 text-xs",
              children: "React/Remotion rendering on Modal"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 text-white/30 text-xs bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/[0.05]",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              className: "animate-spin",
              width: "10",
              height: "10",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "3",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
                cx: "12",
                cy: "12",
                r: "10",
                strokeOpacity: "0.2"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M12 2a10 10 0 0 1 10 10"
              })]
            }), formatTime(elapsedTime)]
          })]
        })
      }), !generating && history.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up",
        children: history.map(function (entry, idx) {
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group rounded overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col",
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
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm border ".concat(entry.mode === "edit" ? "bg-[#22d3ee]/20 text-[#22d3ee] border-[#22d3ee]/30" : "bg-violet-600/30 text-violet-300 border-violet-500/30"),
              children: entry.mode === "edit" ? "✏ Edit" : "✦ Generated"
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
                  downloadFile(entry.url, "motion-".concat(entry.id || idx, ".mp4"));
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
              }), entry.requestId && entry.canEdit !== false ? /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Remix this generation",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setEditMode(true);
                  setEditSourceId(entry.requestId);
                  setPrompt("");
                  setTimeout(function () {
                    var _textareaRef$current;
                    return (_textareaRef$current = textareaRef.current) === null || _textareaRef$current === void 0 ? void 0 : _textareaRef$current.focus();
                  }, 50);
                },
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10",
                children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  })]
                })
              }) : entry.requestId && entry.canEdit === false ?
              /*#__PURE__*/
              /* Legacy generation — animation code not saved by API, remix not available */
              (0, _jsxRuntime.jsx)("div", {
                title: "Legacy generation \u2014 remix not available. Generate a new motion graphic to enable editing.",
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white/20 border border-white/5 cursor-not-allowed",
                children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  className: "opacity-40",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                    x1: "4",
                    y1: "4",
                    x2: "20",
                    y2: "20",
                    stroke: "currentColor",
                    strokeWidth: "2"
                  })]
                })
              }) : null]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-white/70 text-xs line-clamp-3 leading-relaxed",
                title: entry.prompt,
                children: entry.prompt || "No prompt"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center justify-between mt-1 flex-wrap gap-1",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                  className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap",
                  children: ["motion-graphics", entry.mode === "edit" ? "-edit" : ""]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex gap-2",
                  children: [entry.aspectRatio && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] text-white/40",
                    children: entry.aspectRatio
                  }), entry.duration && /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                    className: "text-[10px] text-white/40",
                    children: [entry.duration, "s"]
                  })]
                })]
              })]
            })]
          }, entry.id || idx);
        })
      }) : !generating ?
      /*#__PURE__*/
      /* ── Empty State ── */
      (0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "mb-12 relative group",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-16 h-16 bg-primary/5 rounded flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "32",
                height: "32",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.5",
                className: "text-primary opacity-80",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse",
              children: "\u2728"
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("h1", {
          className: "text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-white/40 font-medium",
            children: "START CREATING WITH"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("br", {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-white",
            children: "VIBE MOTION"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed",
          children: "Generate animated motion graphics from a text prompt \u2014 kinetic typography, data charts, logo reveals and more"
        })]
      }) : null]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up",
      style: {
        animationDelay: "0.2s"
      },
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "w-full bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl",
        children: [editMode && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2 px-3 py-1.5 mx-0 bg-[#22d3ee]/5 border border-[#22d3ee]/10 rounded text-[10px] text-[#22d3ee]/80 font-medium tracking-tight",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
            width: "13",
            height: "13",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: sourceEntry ? "Editing: \"".concat((_sourceEntry$prompt = sourceEntry.prompt) === null || _sourceEntry$prompt === void 0 ? void 0 : _sourceEntry$prompt.slice(0, 50)).concat(((_sourceEntry$prompt2 = sourceEntry.prompt) === null || _sourceEntry$prompt2 === void 0 ? void 0 : _sourceEntry$prompt2.length) > 50 ? "…" : "", "\"") : "Select a source generation from the gallery"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              setEditMode(false);
              setEditSourceId(null);
              setPrompt("");
            },
            className: "ml-auto text-[#22d3ee]/40 hover:text-[#22d3ee] transition-colors text-base leading-none",
            children: "\xD7"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2 px-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-1 bg-white/[0.03] border border-white/[0.05] rounded-full p-0.5 flex-shrink-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              onClick: function onClick() {
                setEditMode(false);
                setEditSourceId(null);
              },
              className: "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ".concat(!editMode ? "bg-[#22d3ee] text-black shadow" : "text-white/40 hover:text-white/70"),
              children: "Generate"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              onClick: function onClick() {
                return setEditMode(true);
              },
              disabled: editSources.length === 0,
              className: "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ".concat(editMode ? "bg-[#22d3ee] text-black shadow" : "text-white/40 hover:text-white/70"),
              children: "Edit"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex-1 flex flex-col gap-1",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
              ref: textareaRef,
              value: prompt,
              onChange: function onChange(e) {
                return setPrompt(e.target.value);
              },
              onKeyDown: handleKeyDown,
              placeholder: editMode ? "Describe what to change — 'change background to dark navy, make bars gold, add particles…'" : "Describe the motion graphic — 'Animated sales dashboard with glowing bar charts and rising numbers'",
              rows: 1,
              className: "w-full bg-transparent border-none text-white text-sm placeholder:text-white/10 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar"
            })
          })]
        }), generateError && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
              cx: "12",
              cy: "12",
              r: "10"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
              x1: "12",
              y1: "8",
              x2: "12",
              y2: "12"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
              x1: "12",
              y1: "16",
              x2: "12.01",
              y2: "16"
            })]
          }), generateError]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 relative flex-wrap pb-1 md:pb-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("ar"),
                className: "flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center shadow-lg shadow-[#22d3ee]/10",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[9px] font-bold text-black uppercase",
                    children: "A"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: aspectRatio
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "8",
                  height: "8",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "4",
                  className: "opacity-20 group-hover:opacity-100 transition-opacity ml-1",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M6 9l6 6 6-6"
                  })
                })]
              }), openDropdown === "ar" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] min-w-[140px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2",
                  children: "Aspect Ratio"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: ASPECT_RATIOS.map(function (ar) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt",
                      onClick: function onClick() {
                        setAspectRatio(ar);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-[11px] font-semibold text-white/70 group-hover/opt:text-white transition-opacity",
                        children: ar
                      }), aspectRatio === ar && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, ar);
                  })
                })]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("dur"),
                className: "flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center shadow-lg shadow-[#22d3ee]/10",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[9px] font-bold text-black uppercase",
                    children: "T"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: [duration, "s"]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "8",
                  height: "8",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "4",
                  className: "opacity-20 group-hover:opacity-100 transition-opacity ml-1",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M6 9l6 6 6-6"
                  })
                })]
              }), openDropdown === "dur" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/10 min-w-[140px] max-h-52 overflow-y-auto custom-scrollbar",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2",
                  children: "Duration"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: DURATION_OPTIONS.map(function (d) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer transition-all group/opt",
                      onClick: function onClick() {
                        setDuration(d);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                        className: "text-xs font-semibold text-white/70 group-hover/opt:text-white",
                        children: [d, "s"]
                      }), duration === d && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, d);
                  })
                })]
              })]
            }), editMode && editSources.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: toggleDropdown("source"),
                className: "flex items-center gap-2 px-3 py-2 bg-[#22d3ee]/[0.04] hover:bg-[#22d3ee]/[0.08] rounded-md transition-all border border-[#22d3ee]/[0.08] group whitespace-nowrap",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-4 h-4 bg-[#22d3ee]/20 rounded flex items-center justify-center border border-[#22d3ee]/30",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                    width: "9",
                    height: "9",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "#22d3ee",
                    strokeWidth: "3",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                      d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                      d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    })]
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-[#22d3ee]/70 group-hover:text-[#22d3ee] transition-colors max-w-[120px] truncate",
                  children: sourceEntry ? "Source: ".concat((_sourceEntry$prompt3 = sourceEntry.prompt) === null || _sourceEntry$prompt3 === void 0 ? void 0 : _sourceEntry$prompt3.slice(0, 20), "\u2026") : "Pick source…"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "10",
                  height: "10",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "3",
                  className: "opacity-30 flex-shrink-0",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M6 9l6 6 6-6"
                  })
                })]
              }), openDropdown === "source" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 w-64 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] max-h-64 overflow-y-auto custom-scrollbar",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2",
                  children: "Source Generation"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1",
                  children: editSources.map(function (src) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer transition-all group/opt",
                      onClick: function onClick() {
                        setEditSourceId(src.requestId);
                        setOpenDropdown(null);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                        className: "w-10 h-7 rounded overflow-hidden bg-black/40 flex-shrink-0 border border-white/5",
                        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
                          src: src.url,
                          className: "w-full h-full object-cover",
                          muted: true,
                          playsInline: true
                        })
                      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                        className: "flex-1 min-w-0",
                        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                          className: "text-[11px] text-white/70 truncate leading-tight group-hover/opt:text-white",
                          children: src.prompt
                        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
                          className: "text-[9px] text-white/30 mt-0.5",
                          children: [src.aspectRatio, " \xB7 ", src.duration, "s"]
                        })]
                      }), editSourceId === src.requestId && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckSvg, {})]
                    }, src.requestId);
                  })
                })]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[10px] text-white/20 hidden sm:block ml-2",
              children: "Ctrl+Enter to run"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: handleGenerate,
            disabled: generating || !prompt.trim() || editMode && !editSourceId,
            className: "bg-[#22d3ee] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/10 disabled:opacity-50 disabled:cursor-not-allowed",
            children: generating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "animate-spin inline-block text-black",
                children: "\u25CC"
              }), " ", editMode ? "Remixing..." : "Generating..."]
            }) : generateError ? "Error: ".concat(generateError.slice(0, 40), "\u2026") : editMode ? /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: "Remix"
            }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: "Generate"
            })
          })]
        })]
      })
    })]
  });
}