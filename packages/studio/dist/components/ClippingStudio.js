"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ClippingStudio;
var _react = require("react");
var _muapi = require("../muapi.js");
var _jsxRuntime = require("react/jsx-runtime");
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
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; } // ---------------------------------------------------------------------------
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
var ClockIcon = function ClockIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "14",
    height: "14",
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
var CheckIcon = function CheckIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#22d3ee",
    strokeWidth: "3",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
      points: "20 6 9 17 4 12"
    })
  });
};
var ChevronDownIcon = function ChevronDownIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
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
  });
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
function ClippingStudio(_ref2) {
  var _result$coordinates;
  var apiKey = _ref2.apiKey,
    onGenerationComplete = _ref2.onGenerationComplete,
    droppedFiles = _ref2.droppedFiles,
    onFilesHandled = _ref2.onFilesHandled;
  var PERSIST_KEY = "hg_clipping_studio_persistent";

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

  // ── Dropdowns state ──
  var _useState9 = (0, _react.useState)(false),
    _useState0 = _slicedToArray(_useState9, 2),
    aspectDropdownOpen = _useState0[0],
    setAspectDropdownOpen = _useState0[1];
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    highlightsDropdownOpen = _useState10[0],
    setHighlightsDropdownOpen = _useState10[1];
  var dropdownRef = (0, _react.useRef)(null);
  var highlightsDropdownRef = (0, _react.useRef)(null);
  var textareaRef = (0, _react.useRef)(null);

  // ── Upload State ──
  var _useState11 = (0, _react.useState)(false),
    _useState12 = _slicedToArray(_useState11, 2),
    videoUploading = _useState12[0],
    setVideoUploading = _useState12[1];
  var _useState13 = (0, _react.useState)(0),
    _useState14 = _slicedToArray(_useState13, 2),
    videoProgress = _useState14[0],
    setVideoProgress = _useState14[1];
  var videoFileInputRef = (0, _react.useRef)(null);

  // ── Generation State ─────────────────────────────────────────────────────
  var _useState15 = (0, _react.useState)(false),
    _useState16 = _slicedToArray(_useState15, 2),
    isGenerating = _useState16[0],
    setIsGenerating = _useState16[1];
  var _useState17 = (0, _react.useState)(null),
    _useState18 = _slicedToArray(_useState17, 2),
    generateError = _useState18[0],
    setGenerateError = _useState18[1];
  var _useState19 = (0, _react.useState)(null),
    _useState20 = _slicedToArray(_useState19, 2),
    fullscreenUrl = _useState20[0],
    setFullscreenUrl = _useState20[1];
  var _useState21 = (0, _react.useState)(0),
    _useState22 = _slicedToArray(_useState21, 2),
    elapsedTime = _useState22[0],
    setElapsedTime = _useState22[1];
  var timerRef = (0, _react.useRef)(null);

  // ── Output State ─────────────────────────────────────────────────────────
  var _useState23 = (0, _react.useState)(null),
    _useState24 = _slicedToArray(_useState23, 2),
    result = _useState24[0],
    setResult = _useState24[1]; // stores parsed completed API output
  var _useState25 = (0, _react.useState)(0),
    _useState26 = _slicedToArray(_useState25, 2),
    activeHighlightIndex = _useState26[0],
    setActiveHighlightIndex = _useState26[1];
  var mainVideoRef = (0, _react.useRef)(null);

  // ── History State ────────────────────────────────────────────────────────
  var _useState27 = (0, _react.useState)([]),
    _useState28 = _slicedToArray(_useState27, 2),
    history = _useState28[0],
    setHistory = _useState28[1];
  var ASPECT_RATIOS = [{
    label: "9:16 (TikTok / Reels / Shorts)",
    value: "9:16"
  }, {
    label: "16:9 (YouTube / TV)",
    value: "16:9"
  }, {
    label: "1:1 (Instagram Square)",
    value: "1:1"
  }, {
    label: "4:5 (Instagram Portrait)",
    value: "4:5"
  }, {
    label: "4:3 (Classic Video)",
    value: "4:3"
  }, {
    label: "3:4 (Portrait)",
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
        setVideoUploading(true);
        setVideoProgress(0);
        (0, _muapi.uploadFile)(apiKey, videoFiles[0], function (pct) {
          setVideoProgress(pct);
        }).then(function (url) {
          setVideoUrl(url);
          setVideoUploading(false);
        })["catch"](function (err) {
          setVideoUploading(false);
          alert("Failed to upload dropped file: ".concat(err.message));
        });
      }
      onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
    }
  }, [droppedFiles, onFilesHandled, apiKey]);

  // Adjust URL textarea height dynamically
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
  }, [videoUrl]);

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
    alert("URL copied to clipboard!");
  };
  var downloadVideo = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(url) {
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
      return _ref3.apply(this, arguments);
    };
  }();
  var handleUrlInput = function handleUrlInput(e) {
    setVideoUrl(e.target.value);
    var el = e.target;
    el.style.height = "auto";
    var maxH = window.innerWidth < 768 ? 150 : 250;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  };

  // ── Video File Handlers ──
  var handleVideoFileChange = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(e) {
      var file, url, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            file = e.target.files[0];
            if (file) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            if (!(file.size > 100 * 1024 * 1024)) {
              _context2.n = 2;
              break;
            }
            alert("Video exceeds 100MB limit.");
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
            alert("Video upload failed: ".concat(_t2.message));
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
    return function handleVideoFileChange(_x2) {
      return _ref4.apply(this, arguments);
    };
  }();
  var clearVideoUpload = function clearVideoUpload() {
    setVideoUrl("");
  };

  // ── Dispatch Run / Call submitAndPoll ────────────────────────────────────
  var handleGenerate = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var _res$output, _res$output2, _res$output3, params, res, clips, outputCoordinates, newResult, _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (videoUrl) {
              _context3.n = 1;
              break;
            }
            alert("Please upload a video or paste a video URL first.");
            return _context3.a(2);
          case 1:
            setIsGenerating(true);
            setGenerateError(null);
            setResult(null);
            _context3.p = 2;
            params = {
              video_url: videoUrl,
              num_highlights: numHighlights,
              aspect_ratio: aspectRatio,
              return_coordinates_only: returnCoordinatesOnly
            };
            _context3.n = 3;
            return (0, _muapi.runClipping)(apiKey, params);
          case 3:
            res = _context3.v;
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
            _context3.n = 5;
            break;
          case 4:
            _context3.p = 4;
            _t3 = _context3.v;
            console.error("[ClippingStudio] Error generating clips:", _t3);
            setGenerateError(_t3.message || "Failed to process AI clipping.");
          case 5:
            _context3.p = 5;
            setIsGenerating(false);
            return _context3.f(5);
          case 6:
            return _context3.a(2);
        }
      }, _callee3, null, [[2, 4, 5, 6]]);
    }));
    return function handleGenerate() {
      return _ref5.apply(this, arguments);
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
        className: "flex-grow flex flex-col items-center justify-center animate-fade-in-up transition-all duration-700 min-h-[55vh]",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "mb-12 relative group",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)(ScissorsIcon, {
                className: "text-primary opacity-80 w-8 h-8"
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
            children: "AI CLIPPING STUDIO"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed",
          children: "Extract viral highlights and timings from your videos automatically"
        })]
      }), !result && history.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "space-y-6 pt-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-between border-b border-white/5 pb-4",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("h2", {
            className: "text-sm font-black text-white uppercase tracking-widest flex items-center gap-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ScissorsIcon, {
              className: "text-primary w-4 h-4"
            }), "Clipping History Runs"]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
            className: "text-xs font-bold text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded",
            children: [history.length, " Saved Generations"]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-fade-in-up",
          children: history.map(function (entry, idx) {
            var _entry$coordinates, _entry$clips;
            return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "aspect-video bg-zinc-950 flex items-center justify-center border-b border-white/5 relative overflow-hidden",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
                  src: entry.videoUrl,
                  className: "w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity cursor-pointer animate-fade-in",
                  preload: "metadata",
                  muted: true,
                  loop: true,
                  playsInline: true,
                  onClick: function onClick() {
                    return handleSelectHistory(entry);
                  },
                  onMouseOver: function onMouseOver(e) {
                    return e.target.play();
                  },
                  onMouseOut: function onMouseOut(e) {
                    e.target.pause();
                    e.target.currentTime = 0;
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                    type: "button",
                    title: "Delete from history",
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
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                onClick: function onClick() {
                  return handleSelectHistory(entry);
                },
                className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2 cursor-pointer",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex flex-col gap-1",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h4", {
                    className: "text-xs font-bold text-white truncate",
                    title: entry.videoUrl.split('/').pop(),
                    children: entry.videoUrl.split('/').pop() || "source_video.mp4"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                    className: "text-[9px] text-zinc-500 font-semibold uppercase tracking-wider",
                    children: entry.returnCoordinatesOnly ? "Timeline Seek Mode" : "Clips Gallery Mode"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center justify-between mt-1",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20",
                    children: entry.aspectRatio
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] text-white/40",
                    children: entry.returnCoordinatesOnly ? "".concat(((_entry$coordinates = entry.coordinates) === null || _entry$coordinates === void 0 ? void 0 : _entry$coordinates.length) || 0, " Highlights") : "".concat(((_entry$clips = entry.clips) === null || _entry$clips === void 0 ? void 0 : _entry$clips.length) || 0, " Clips")
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
            }), "Back to History"]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded",
              children: result.returnCoordinatesOnly ? "Timeline Seek Mode" : "Clips Gallery Mode"
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
              children: "Original Video Player"
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
                children: "Highlights Timeline"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800",
                children: [((_result$coordinates = result.coordinates) === null || _result$coordinates === void 0 ? void 0 : _result$coordinates.length) || 0, " Matches"]
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
                      children: hl.label || "Highlight #".concat(i + 1)
                    }), hl.score && /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                      className: "text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20",
                      children: [(hl.score * 100).toFixed(0), "% Score"]
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
                      children: [(end - start).toFixed(0), "s duration"]
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "flex items-center gap-1.5 text-[10px] font-bold text-primary mt-1 opacity-0 group-hover/hl:opacity-100 transition-opacity",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(PlayIcon, {}), " Seek & Play"]
                  })]
                }, i);
              }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-center py-8 text-xs text-zinc-500 font-semibold",
                children: "No highlights extracted."
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
              children: "Extracted Video Clips"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
              className: "text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800",
              children: ["Aspect Ratio: ", result.aspectRatio]
            })]
          }), result.clips && result.clips.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6",
            children: result.clips.map(function (clipUrl, i) {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "relative group/vid border-b border-white/5 overflow-hidden bg-black/40",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
                    src: clipUrl,
                    className: "w-full ".concat(getAspectClass(result.aspectRatio), " object-cover bg-black/40 cursor-pointer hover:opacity-85 transition-opacity"),
                    onClick: function onClick() {
                      return setFullscreenUrl(clipUrl);
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
                    className: "absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover/vid:opacity-100 transition-opacity z-10",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                      type: "button",
                      title: "Fullscreen",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        setFullscreenUrl(clipUrl);
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
                      title: "Copy Link",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        copyToClipboard(clipUrl);
                      },
                      className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10",
                      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(CopyIcon, {})
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                      type: "button",
                      title: "Download",
                      onClick: function onClick(e) {
                        e.stopPropagation();
                        downloadVideo(clipUrl, "clip-".concat(i + 1, ".mp4"));
                      },
                      className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10",
                      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(DownloadIcon, {})
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/5 text-[9px] uppercase font-black tracking-wider text-primary",
                    children: ["Clip #", i + 1]
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "flex items-center justify-between mt-1",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                      className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap",
                      children: ["Clip #", i + 1]
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-[10px] text-white/40",
                      children: result.aspectRatio
                    })]
                  })
                })]
              }, i);
            })
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "py-20 text-center text-xs text-zinc-500 font-semibold border border-zinc-900 rounded bg-zinc-950/20",
            children: "No video clips generated. Try re-running."
          })]
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up",
      style: {
        animationDelay: "0.2s"
      },
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "w-full bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-3 px-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
            ref: videoFileInputRef,
            type: "file",
            accept: "video/*",
            className: "hidden",
            onChange: handleVideoFileChange
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            type: "button",
            title: videoUrl ? "Clear video" : "Upload source video",
            onClick: function onClick() {
              var _videoFileInputRef$cu;
              return videoUrl ? clearVideoUpload() : (_videoFileInputRef$cu = videoFileInputRef.current) === null || _videoFileInputRef$cu === void 0 ? void 0 : _videoFileInputRef$cu.click();
            },
            className: "w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ".concat(videoUrl ? "border-[#22d3ee]/60 bg-[#22d3ee]/5" : "bg-white/5 border-white/[0.03] hover:bg-white/10 hover:border-[#22d3ee]/40", " group"),
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
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "absolute text-[8px] font-black text-[#22d3ee] leading-none",
                children: [videoProgress, "%"]
              })]
            }) : null, videoUrl ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-full h-full flex items-center justify-center bg-[#22d3ee]/10 text-[#22d3ee]",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "18",
                height: "18",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
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
              })
            }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
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
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
              ref: textareaRef,
              value: videoUrl,
              onChange: handleUrlInput,
              placeholder: "Upload a video file or paste a video S3 URL here...",
              rows: 1,
              className: "w-full bg-transparent border-none text-white text-sm placeholder:text-white/20 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] overflow-y-auto custom-scrollbar disabled:opacity-40"
            })
          }), videoUrl && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: clearVideoUpload,
            className: "p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors self-start mt-1",
            title: "Clear input",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
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
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 relative flex-wrap pb-1 md:pb-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-md border border-white/[0.03] whitespace-nowrap",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center shadow-lg shadow-[#22d3ee]/10",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[9px] font-bold text-black uppercase",
                  children: "C"
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-semibold text-white/70",
                children: "AI Clipping"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              ref: dropdownRef,
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: function onClick() {
                  return setAspectDropdownOpen(!aspectDropdownOpen);
                },
                className: "flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap",
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
                  children: aspectRatio
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ChevronDownIcon, {})]
              }), aspectDropdownOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] min-w-[160px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2",
                  children: "Aspect Ratio"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar",
                  children: ASPECT_RATIOS.map(function (r) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                      className: "flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt",
                      onClick: function onClick() {
                        setAspectRatio(r.value);
                        setAspectDropdownOpen(false);
                      },
                      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                        className: "text-[11px] font-semibold text-white/70 group-hover/opt:text-white transition-opacity",
                        children: r.value
                      }), aspectRatio === r.value && /*#__PURE__*/(0, _jsxRuntime.jsx)(CheckIcon, {})]
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
                className: "flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ClockIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: [numHighlights, " Highlights"]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ChevronDownIcon, {})]
              }), highlightsDropdownOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/10 min-w-[180px]",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-xs font-bold text-white/20 border-b border-white/[0.03] mb-3",
                  children: "Max Highlights"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "space-y-3",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "flex items-center justify-between",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-xs text-white/60",
                      children: "Limit:"
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
              className: "flex items-center gap-2 px-3 py-2 rounded-md transition-all border whitespace-nowrap text-[11px] font-semibold ".concat(returnCoordinatesOnly ? "bg-primary/10 border-primary/20 text-[#22d3ee]" : "bg-white/[0.03] border-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ScissorsIcon, {
                className: "w-3.5 h-3.5 text-current"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                children: "Coordinates Only"
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: handleGenerate,
            disabled: isGenerating,
            className: "bg-[#22d3ee] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/10 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider",
            children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "animate-spin inline-block text-black",
                children: "\u25CC"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                children: [elapsedTime, "s"]
              })]
            }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(ScissorsIcon, {
                className: "text-black w-4 h-4"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                children: "Generate"
              })]
            })
          })]
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("style", {
      jsx: true,
      global: true,
      children: "\n        .custom-scrollbar::-webkit-scrollbar {\n          width: 6px;\n          height: 6px;\n        }\n        .custom-scrollbar::-webkit-scrollbar-track {\n          background: transparent;\n        }\n        .custom-scrollbar::-webkit-scrollbar-thumb {\n          background: rgba(255, 255, 255, 0.08);\n          border-radius: 99px;\n        }\n        .custom-scrollbar::-webkit-scrollbar-thumb:hover {\n          background: rgba(255, 255, 255, 0.15);\n        }\n        .custom-scrollbar {\n          scrollbar-width: thin;\n          scrollbar-color: rgba(255, 255, 255, 0.08) transparent;\n        }\n      "
    })]
  });
}