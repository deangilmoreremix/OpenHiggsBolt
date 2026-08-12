"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = DrawModal;
var _react = _interopRequireWildcard(require("react"));
var _muapi = require("../muapi.js");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t2 in e) "default" !== _t2 && {}.hasOwnProperty.call(e, _t2) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t2)) && (i.get || i.set) ? o(f, _t2, i) : f[_t2] = e[_t2]); return f; })(e, t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
function DrawModal(_ref) {
  var isOpen = _ref.isOpen,
    onClose = _ref.onClose,
    apiKey = _ref.apiKey,
    _ref$batchSize = _ref.batchSize,
    batchSize = _ref$batchSize === void 0 ? 1 : _ref$batchSize,
    onAddHistoryItem = _ref.onAddHistoryItem;
  var _useState = (0, _react.useState)("draw-to-edit"),
    _useState2 = _slicedToArray(_useState, 2),
    activeTab = _useState2[0],
    setActiveTab = _useState2[1]; // 'sketch-to-video' | 'draw-to-video' | 'draw-to-edit'
  var _useState3 = (0, _react.useState)("setup"),
    _useState4 = _slicedToArray(_useState3, 2),
    viewState = _useState4[0],
    setViewState = _useState4[1]; // 'setup' | 'canvas'
  var _useState5 = (0, _react.useState)(null),
    _useState6 = _slicedToArray(_useState5, 2),
    bgImageUrl = _useState6[0],
    setBgImageUrl = _useState6[1]; // Image dataURL or src
  var _useState7 = (0, _react.useState)("16:9"),
    _useState8 = _slicedToArray(_useState7, 2),
    aspectRatio = _useState8[0],
    setAspectRatio = _useState8[1]; // '16:9' | '1:1' | 'Auto'
  var _useState9 = (0, _react.useState)("nano-banana-pro-edit"),
    _useState0 = _slicedToArray(_useState9, 2),
    selectedModel = _useState0[0],
    setSelectedModel = _useState0[1]; // 'nano-banana-2-edit' | 'nano-banana-pro-edit'
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    isModelDropdownOpen = _useState10[0],
    setIsModelDropdownOpen = _useState10[1];
  var _useState11 = (0, _react.useState)(false),
    _useState12 = _slicedToArray(_useState11, 2),
    isArDropdownOpen = _useState12[0],
    setIsArDropdownOpen = _useState12[1];
  var _useState13 = (0, _react.useState)("Edit the image based on the drawing overlay"),
    _useState14 = _slicedToArray(_useState13, 2),
    promptText = _useState14[0],
    setPromptText = _useState14[1]; // text prompt for generation

  // Drawing Tools
  var _useState15 = (0, _react.useState)("pencil"),
    _useState16 = _slicedToArray(_useState15, 2),
    activeTool = _useState16[0],
    setActiveTool = _useState16[1]; // 'pointer' | 'pencil' | 'eraser' | 'rect' | 'arrow' | 'text' | 'image'
  var _useState17 = (0, _react.useState)("#eab308"),
    _useState18 = _slicedToArray(_useState17, 2),
    brushColor = _useState18[0],
    setBrushColor = _useState18[1]; // default yellow
  var _useState19 = (0, _react.useState)(5),
    _useState20 = _slicedToArray(_useState19, 2),
    brushSize = _useState20[0],
    setBrushSize = _useState20[1];
  var _useState21 = (0, _react.useState)(false),
    _useState22 = _slicedToArray(_useState21, 2),
    showSettingsPopover = _useState22[0],
    setShowSettingsPopover = _useState22[1];

  // Unified Object-based Canvas state
  var _useState23 = (0, _react.useState)([]),
    _useState24 = _slicedToArray(_useState23, 2),
    canvasObjects = _useState24[0],
    setCanvasObjects = _useState24[1]; // [{id, type, points, x, y, width, height, color, brushSize}]
  var _useState25 = (0, _react.useState)(null),
    _useState26 = _slicedToArray(_useState25, 2),
    selectedObjectId = _useState26[0],
    setSelectedObjectId = _useState26[1];

  // History Undo/Redo stack for objects
  var _useState27 = (0, _react.useState)([[]]),
    _useState28 = _slicedToArray(_useState27, 2),
    history = _useState28[0],
    setHistory = _useState28[1];
  var _useState29 = (0, _react.useState)(0),
    _useState30 = _slicedToArray(_useState29, 2),
    historyIdx = _useState30[0],
    setHistoryIdx = _useState30[1];
  var _useState31 = (0, _react.useState)(false),
    _useState32 = _slicedToArray(_useState31, 2),
    canUndo = _useState32[0],
    setCanUndo = _useState32[1];
  var _useState33 = (0, _react.useState)(false),
    _useState34 = _slicedToArray(_useState33, 2),
    canRedo = _useState34[0],
    setCanRedo = _useState34[1];

  // Canvas Dimensions State
  var _useState35 = (0, _react.useState)({
      width: 800,
      height: 450
    }),
    _useState36 = _slicedToArray(_useState35, 2),
    canvasDimensions = _useState36[0],
    setCanvasDimensions = _useState36[1];
  var _useState37 = (0, _react.useState)(false),
    _useState38 = _slicedToArray(_useState37, 2),
    generating = _useState38[0],
    setGenerating = _useState38[1];

  // Refs
  var canvasRef = (0, _react.useRef)(null);
  var bgCanvasRef = (0, _react.useRef)(null);
  var canvasWrapperRef = (0, _react.useRef)(null);
  var drawingState = (0, _react.useRef)({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0,
    activePoints: []
  });
  var fileInputRef = (0, _react.useRef)(null);
  var insertImageInputRef = (0, _react.useRef)(null);
  var modelDropdownRef = (0, _react.useRef)(null);
  var arDropdownRef = (0, _react.useRef)(null);

  // Predefined colors for drawing toolbar (rendered inline now)
  var PRESET_COLORS = ["#ef4444",
  // Red
  "#f97316",
  // Orange
  "#eab308",
  // Yellow
  "#22c55e",
  // Green
  "#3b82f6",
  // Blue
  "#a855f7",
  // Purple
  "#ffffff",
  // White
  "#000000" // Black
  ];
  var handleSelectTool = function handleSelectTool(tool) {
    setActiveTool(tool);
    setSelectedObjectId(null);
  };

  // Adjust container clicks to close open menus
  (0, _react.useEffect)(function () {
    var handleOutsideClick = function handleOutsideClick(e) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
      }
      if (arDropdownRef.current && !arDropdownRef.current.contains(e.target)) {
        setIsArDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return function () {
      return window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  // Keep refs to latest handlers to avoid stale closures in keyboard shortcut listener
  var keyboardCallbacksRef = (0, _react.useRef)({});

  // Keyboard shortcuts event listener
  (0, _react.useEffect)(function () {
    if (!isOpen) return;
    var handleKeyDown = function handleKeyDown(e) {
      // Ignore shortcuts if writing in an input, textarea or contenteditable element
      var activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable)) {
        return;
      }
      var key = e.key.toLowerCase();

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && key === "z") {
        var _keyboardCallbacksRef, _keyboardCallbacksRef2;
        e.preventDefault();
        (_keyboardCallbacksRef = (_keyboardCallbacksRef2 = keyboardCallbacksRef.current).handleUndo) === null || _keyboardCallbacksRef === void 0 || _keyboardCallbacksRef.call(_keyboardCallbacksRef2);
      } else if ((e.ctrlKey || e.metaKey) && key === "y") {
        var _keyboardCallbacksRef3, _keyboardCallbacksRef4;
        e.preventDefault();
        (_keyboardCallbacksRef3 = (_keyboardCallbacksRef4 = keyboardCallbacksRef.current).handleRedo) === null || _keyboardCallbacksRef3 === void 0 || _keyboardCallbacksRef3.call(_keyboardCallbacksRef4);
      }
      // Delete Selected Object
      else if (key === "delete" || key === "backspace") {
        if (keyboardCallbacksRef.current.selectedObjectId) {
          var _keyboardCallbacksRef5, _keyboardCallbacksRef6;
          e.preventDefault();
          (_keyboardCallbacksRef5 = (_keyboardCallbacksRef6 = keyboardCallbacksRef.current).handleRemoveSelected) === null || _keyboardCallbacksRef5 === void 0 || _keyboardCallbacksRef5.call(_keyboardCallbacksRef6);
        }
      }
      // Toolbar selections
      else if (key === "v" || key === "1") {
        var _keyboardCallbacksRef7, _keyboardCallbacksRef8;
        e.preventDefault();
        (_keyboardCallbacksRef7 = (_keyboardCallbacksRef8 = keyboardCallbacksRef.current).handleSelectTool) === null || _keyboardCallbacksRef7 === void 0 || _keyboardCallbacksRef7.call(_keyboardCallbacksRef8, "pointer");
      } else if (key === "b" || key === "2") {
        var _keyboardCallbacksRef9, _keyboardCallbacksRef0;
        e.preventDefault();
        (_keyboardCallbacksRef9 = (_keyboardCallbacksRef0 = keyboardCallbacksRef.current).handleSelectTool) === null || _keyboardCallbacksRef9 === void 0 || _keyboardCallbacksRef9.call(_keyboardCallbacksRef0, "pencil");
      } else if (key === "e" || key === "3") {
        var _keyboardCallbacksRef1, _keyboardCallbacksRef10;
        e.preventDefault();
        (_keyboardCallbacksRef1 = (_keyboardCallbacksRef10 = keyboardCallbacksRef.current).handleSelectTool) === null || _keyboardCallbacksRef1 === void 0 || _keyboardCallbacksRef1.call(_keyboardCallbacksRef10, "eraser");
      } else if (key === "r" || key === "4") {
        var _keyboardCallbacksRef11, _keyboardCallbacksRef12;
        e.preventDefault();
        (_keyboardCallbacksRef11 = (_keyboardCallbacksRef12 = keyboardCallbacksRef.current).handleSelectTool) === null || _keyboardCallbacksRef11 === void 0 || _keyboardCallbacksRef11.call(_keyboardCallbacksRef12, "rect");
      } else if (key === "a" || key === "5") {
        var _keyboardCallbacksRef13, _keyboardCallbacksRef14;
        e.preventDefault();
        (_keyboardCallbacksRef13 = (_keyboardCallbacksRef14 = keyboardCallbacksRef.current).handleSelectTool) === null || _keyboardCallbacksRef13 === void 0 || _keyboardCallbacksRef13.call(_keyboardCallbacksRef14, "arrow");
      } else if (key === "t" || key === "6") {
        var _keyboardCallbacksRef15, _keyboardCallbacksRef16;
        e.preventDefault();
        (_keyboardCallbacksRef15 = (_keyboardCallbacksRef16 = keyboardCallbacksRef.current).handleSelectTool) === null || _keyboardCallbacksRef15 === void 0 || _keyboardCallbacksRef15.call(_keyboardCallbacksRef16, "text");
      } else if (key === "i" || key === "7") {
        var _keyboardCallbacksRef17, _keyboardCallbacksRef18;
        e.preventDefault();
        (_keyboardCallbacksRef17 = (_keyboardCallbacksRef18 = keyboardCallbacksRef.current).handleInsertImageClick) === null || _keyboardCallbacksRef17 === void 0 || _keyboardCallbacksRef17.call(_keyboardCallbacksRef18);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return function () {
      return window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Save history state
  var saveStateToHistory = function saveStateToHistory(newObjects) {
    var nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(newObjects);
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
    setCanUndo(nextHistory.length > 1);
    setCanRedo(false);
  };
  var handleUndo = function handleUndo() {
    if (historyIdx > 0) {
      var nextIdx = historyIdx - 1;
      setHistoryIdx(nextIdx);
      setCanvasObjects(history[nextIdx]);
      setSelectedObjectId(null);
      setCanUndo(nextIdx > 0);
      setCanRedo(true);
    }
  };
  var handleRedo = function handleRedo() {
    if (historyIdx < history.length - 1) {
      var nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setCanvasObjects(history[nextIdx]);
      setSelectedObjectId(null);
      setCanUndo(true);
      setCanRedo(nextIdx < history.length - 1);
    }
  };

  // Initialize Canvas
  (0, _react.useEffect)(function () {
    if (viewState !== "canvas") return;
    var canvas = canvasRef.current;
    var bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;
    var ctx = canvas.getContext("2d");
    var bgCtx = bgCanvas.getContext("2d");
    var initCanvas = function initCanvas(img) {
      // Canvas always matches the image's natural dimensions (aspect ratio dropdown is for AI output only)
      var width, height;
      if (img) {
        var maxW = 800;
        var maxH = 800;
        var imgW = img.naturalWidth || img.width || 800;
        var imgH = img.naturalHeight || img.height || 600;
        var scale = Math.min(maxW / imgW, maxH / imgH, 1);
        width = Math.round(imgW * scale);
        height = Math.round(imgH * scale);
      } else {
        // Blank canvas: default 800×600
        width = 800;
        height = 600;
      }
      canvas.width = width;
      canvas.height = height;
      bgCanvas.width = width;
      bgCanvas.height = height;

      // Draw background image if exists, else white background
      if (img) {
        bgCtx.drawImage(img, 0, 0, width, height);
      } else {
        bgCtx.fillStyle = "#ffffff";
        bgCtx.fillRect(0, 0, width, height);
      }

      // Reset drawing canvases
      ctx.clearRect(0, 0, width, height);
      setCanvasDimensions({
        width: width,
        height: height
      });
      setHistory([[]]);
      setHistoryIdx(0);
      setCanvasObjects([]);
      setSelectedObjectId(null);
      setCanUndo(false);
      setCanRedo(false);
    };
    if (bgImageUrl) {
      var img = new Image();
      img.onload = function () {
        initCanvas(img);
      };
      img.src = bgImageUrl;
    } else {
      initCanvas(null);
    }
  }, [viewState, bgImageUrl]);

  // Redraw main drawing ink canvas when objects or active sketch changes
  var redrawCanvas = function redrawCanvas() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvasObjects.forEach(function (obj) {
      ctx.lineWidth = obj.brushSize || 5;
      ctx.strokeStyle = obj.color || "#eab308";
      ctx.fillStyle = obj.color || "#eab308";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (obj.type === "pencil") {
        ctx.globalCompositeOperation = "source-over";
        var p = obj.points;
        if (p.length > 0) {
          ctx.beginPath();
          ctx.moveTo(p[0].x, p[0].y);
          for (var i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
          }
          ctx.stroke();
        }
      } else if (obj.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        var _p = obj.points;
        if (_p.length > 0) {
          ctx.beginPath();
          ctx.moveTo(_p[0].x, _p[0].y);
          for (var _i = 1; _i < _p.length; _i++) {
            ctx.lineTo(_p[_i].x, _p[_i].y);
          }
          ctx.stroke();
        }
      } else if (obj.type === "rect") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === "arrow") {
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(obj.x1, obj.y1);
        ctx.lineTo(obj.x2, obj.y2);
        ctx.stroke();
        var angle = Math.atan2(obj.y2 - obj.y1, obj.x2 - obj.x1);
        ctx.beginPath();
        ctx.moveTo(obj.x2, obj.y2);
        ctx.lineTo(obj.x2 - 15 * Math.cos(angle - Math.PI / 6), obj.y2 - 15 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(obj.x2, obj.y2);
        ctx.lineTo(obj.x2 - 15 * Math.cos(angle + Math.PI / 6), obj.y2 - 15 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    });

    // Draw temporary preview stroke if actively drawing
    if (drawingState.current.isDrawing) {
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      var startX = drawingState.current.startX;
      var startY = drawingState.current.startY;
      var currX = drawingState.current.currX;
      var currY = drawingState.current.currY;
      if (activeTool === "pencil") {
        ctx.globalCompositeOperation = "source-over";
        var p = drawingState.current.activePoints;
        if (p.length > 0) {
          ctx.beginPath();
          ctx.moveTo(p[0].x, p[0].y);
          for (var i = 1; i < p.length; i++) {
            ctx.lineTo(p[i].x, p[i].y);
          }
          ctx.stroke();
        }
      } else if (activeTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = brushSize * 2;
        var _p2 = drawingState.current.activePoints;
        if (_p2.length > 0) {
          ctx.beginPath();
          ctx.moveTo(_p2[0].x, _p2[0].y);
          for (var _i2 = 1; _i2 < _p2.length; _i2++) {
            ctx.lineTo(_p2[_i2].x, _p2[_i2].y);
          }
          ctx.stroke();
        }
      } else if (activeTool === "rect") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeRect(startX, startY, currX - startX, currY - startY);
      } else if (activeTool === "arrow") {
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currX, currY);
        ctx.stroke();
        var angle = Math.atan2(currY - startY, currX - startX);
        ctx.beginPath();
        ctx.moveTo(currX, currY);
        ctx.lineTo(currX - 15 * Math.cos(angle - Math.PI / 6), currY - 15 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(currX, currY);
        ctx.lineTo(currX - 15 * Math.cos(angle + Math.PI / 6), currY - 15 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  };

  // Trigger redraw on object updates
  (0, _react.useEffect)(function () {
    redrawCanvas();
  }, [canvasObjects, canvasDimensions, activeTool]);

  // Drawing coordinates resolver
  var getCanvasMousePos = function getCanvasMousePos(e) {
    var canvas = canvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    var rect = canvas.getBoundingClientRect();

    // Resolve touch or mouse events
    var clientX = e.clientX;
    var clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }
    return {
      x: (clientX - rect.left) / rect.width * canvas.width,
      y: (clientY - rect.top) / rect.height * canvas.height
    };
  };

  // Click on canvas (used to detect selection or place text)
  var handleCanvasClick = function handleCanvasClick(e) {
    var pos = getCanvasMousePos(e);
    if (activeTool === "pointer") {
      // Select the clicked object (traverse backwards to select top element first)
      var foundId = null;
      for (var i = canvasObjects.length - 1; i >= 0; i--) {
        var obj = canvasObjects[i];
        var _bbox = getObjectBoundingBox(obj);
        if (_bbox) {
          // Add 16px selection tolerance to make small sketches/lines easy to click
          var tolerance = Math.max(16, (obj.brushSize || 5) * 2);
          if (pos.x >= _bbox.x - tolerance && pos.x <= _bbox.x + _bbox.width + tolerance && pos.y >= _bbox.y - tolerance && pos.y <= _bbox.y + _bbox.height + tolerance) {
            foundId = obj.id;
            break;
          }
        }
      }
      setSelectedObjectId(foundId);
    } else if (activeTool === "text") {
      var fontSize = brushSize * 4 > 12 ? brushSize * 4 : 20;
      var newText = {
        id: Math.random().toString(36).substring(7),
        type: "text",
        text: "Type text here...",
        x: Math.round(pos.x),
        y: Math.round(pos.y),
        width: 160,
        height: Math.round(fontSize * 1.5),
        fontSize: fontSize,
        color: brushColor
      };
      var nextObjs = [].concat(_toConsumableArray(canvasObjects), [newText]);
      setCanvasObjects(nextObjs);
      saveStateToHistory(nextObjs);
      setSelectedObjectId(newText.id);
      setActiveTool("pointer"); // switch back to pointer to allow typing and dragging
    }
  };
  var handleStartDraw = function handleStartDraw(e) {
    if (activeTool === "pointer" || activeTool === "text") return;
    var pos = getCanvasMousePos(e);
    drawingState.current.isDrawing = true;
    drawingState.current.startX = pos.x;
    drawingState.current.startY = pos.y;
    drawingState.current.currX = pos.x;
    drawingState.current.currY = pos.y;
    drawingState.current.activePoints = [pos];
    redrawCanvas();
  };
  var handleDrawing = function handleDrawing(e) {
    if (!drawingState.current.isDrawing) return;
    var pos = getCanvasMousePos(e);
    drawingState.current.currX = pos.x;
    drawingState.current.currY = pos.y;
    if (activeTool === "pencil" || activeTool === "eraser") {
      drawingState.current.activePoints.push(pos);
    }
    redrawCanvas();
  };
  var handleEndDraw = function handleEndDraw(e) {
    if (!drawingState.current.isDrawing) return;
    drawingState.current.isDrawing = false;
    var pos = getCanvasMousePos(e);
    var newObj = null;
    var startX = drawingState.current.startX;
    var startY = drawingState.current.startY;
    if (activeTool === "pencil") {
      newObj = {
        id: Math.random().toString(36).substring(7),
        type: "pencil",
        points: drawingState.current.activePoints,
        color: brushColor,
        brushSize: brushSize
      };
    } else if (activeTool === "eraser") {
      newObj = {
        id: Math.random().toString(36).substring(7),
        type: "eraser",
        points: drawingState.current.activePoints,
        brushSize: brushSize * 2
      };
    } else if (activeTool === "rect") {
      var w = pos.x - startX;
      var h = pos.y - startY;
      newObj = {
        id: Math.random().toString(36).substring(7),
        type: "rect",
        x: w < 0 ? startX + w : startX,
        y: h < 0 ? startY + h : startY,
        width: Math.abs(w),
        height: Math.abs(h),
        color: brushColor,
        brushSize: brushSize
      };
    } else if (activeTool === "arrow") {
      newObj = {
        id: Math.random().toString(36).substring(7),
        type: "arrow",
        x1: startX,
        y1: startY,
        x2: pos.x,
        y2: pos.y,
        color: brushColor,
        brushSize: brushSize
      };
    }
    if (newObj) {
      var nextObjs = [].concat(_toConsumableArray(canvasObjects), [newObj]);
      setCanvasObjects(nextObjs);
      saveStateToHistory(nextObjs);
      setSelectedObjectId(newObj.id);
    }
  };

  // Helper: compute bounding box of any object type
  var getObjectBoundingBox = function getObjectBoundingBox(obj) {
    if (!obj) return null;
    if (obj.type === "pencil" || obj.type === "eraser") {
      var xs = obj.points.map(function (p) {
        return p.x;
      });
      var ys = obj.points.map(function (p) {
        return p.y;
      });
      if (xs.length === 0) return null;
      var minX = Math.min.apply(Math, _toConsumableArray(xs));
      var maxX = Math.max.apply(Math, _toConsumableArray(xs));
      var minY = Math.min.apply(Math, _toConsumableArray(ys));
      var maxY = Math.max.apply(Math, _toConsumableArray(ys));
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    if (obj.type === "rect" || obj.type === "text" || obj.type === "image") {
      return {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height
      };
    }
    if (obj.type === "arrow") {
      var _minX = Math.min(obj.x1, obj.x2);
      var _maxX = Math.max(obj.x1, obj.x2);
      var _minY = Math.min(obj.y1, obj.y2);
      var _maxY = Math.max(obj.y1, obj.y2);
      return {
        x: _minX,
        y: _minY,
        width: _maxX - _minX,
        height: _maxY - _minY
      };
    }
    return null;
  };

  // Drag selected object
  var handleStartMoveSelected = function handleStartMoveSelected(e) {
    e.preventDefault();
    if (activeTool !== "pointer") return;
    var startX = e.clientX;
    var startY = e.clientY;
    var targetObj = canvasObjects.find(function (o) {
      return o.id === selectedObjectId;
    });
    if (!targetObj) return;
    var origObj = JSON.parse(JSON.stringify(targetObj));
    var handleMove = function handleMove(moveEvent) {
      if (!canvasWrapperRef.current) return;
      var rect = canvasWrapperRef.current.getBoundingClientRect();
      var scaleX = canvasDimensions.width / rect.width;
      var scaleY = canvasDimensions.height / rect.height;
      var dx = (moveEvent.clientX - startX) * scaleX;
      var dy = (moveEvent.clientY - startY) * scaleY;
      setCanvasObjects(function (prev) {
        return prev.map(function (o) {
          if (o.id !== selectedObjectId) return o;
          if (o.type === "pencil" || o.type === "eraser") {
            return _objectSpread(_objectSpread({}, o), {}, {
              points: origObj.points.map(function (p) {
                return {
                  x: p.x + dx,
                  y: p.y + dy
                };
              })
            });
          }
          if (o.type === "rect" || o.type === "text" || o.type === "image") {
            return _objectSpread(_objectSpread({}, o), {}, {
              x: Math.round(origObj.x + dx),
              y: Math.round(origObj.y + dy)
            });
          }
          if (o.type === "arrow") {
            return _objectSpread(_objectSpread({}, o), {}, {
              x1: Math.round(origObj.x1 + dx),
              y1: Math.round(origObj.y1 + dy),
              x2: Math.round(origObj.x2 + dx),
              y2: Math.round(origObj.y2 + dy)
            });
          }
          return o;
        });
      });
    };
    var _handleMoveEnd = function handleMoveEnd() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", _handleMoveEnd);
      saveStateToHistory(canvasObjects);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", _handleMoveEnd);
  };

  // Resize selected object using corner handles
  var handleStartResizeSelected = function handleStartResizeSelected(e, direction) {
    e.preventDefault();
    e.stopPropagation();
    var startX = e.clientX;
    var startY = e.clientY;
    var targetObj = canvasObjects.find(function (o) {
      return o.id === selectedObjectId;
    });
    if (!targetObj) return;
    var origObj = JSON.parse(JSON.stringify(targetObj));
    var origBbox = getObjectBoundingBox(origObj);
    var handleResize = function handleResize(moveEvent) {
      if (!canvasWrapperRef.current) return;
      var rect = canvasWrapperRef.current.getBoundingClientRect();
      var scaleX = canvasDimensions.width / rect.width;
      var scaleY = canvasDimensions.height / rect.height;
      var dx = (moveEvent.clientX - startX) * scaleX;
      var dy = (moveEvent.clientY - startY) * scaleY;
      setCanvasObjects(function (prev) {
        return prev.map(function (o) {
          if (o.id !== selectedObjectId) return o;
          if (o.type === "rect" || o.type === "text" || o.type === "image") {
            var newX = origObj.x;
            var newY = origObj.y;
            var newW = origObj.width;
            var newH = origObj.height;
            if (direction.includes("l")) {
              newX = origObj.x + dx;
              newW = origObj.width - dx;
            }
            if (direction.includes("r")) {
              newW = origObj.width + dx;
            }
            if (direction.includes("t")) {
              newY = origObj.y + dy;
              newH = origObj.height - dy;
            }
            if (direction.includes("b")) {
              newH = origObj.height + dy;
            }
            return _objectSpread(_objectSpread({}, o), {}, {
              x: Math.round(newX),
              y: Math.round(newY),
              width: Math.max(15, Math.round(newW)),
              height: Math.max(15, Math.round(newH))
            });
          }
          if (o.type === "arrow") {
            var newX1 = origObj.x1;
            var newY1 = origObj.y1;
            var newX2 = origObj.x2;
            var newY2 = origObj.y2;
            if (direction.includes("t") || direction.includes("l")) {
              newX1 = origObj.x1 + dx;
              newY1 = origObj.y1 + dy;
            }
            if (direction.includes("b") || direction.includes("r")) {
              newX2 = origObj.x2 + dx;
              newY2 = origObj.y2 + dy;
            }
            return _objectSpread(_objectSpread({}, o), {}, {
              x1: Math.round(newX1),
              y1: Math.round(newY1),
              x2: Math.round(newX2),
              y2: Math.round(newY2)
            });
          }
          if (o.type === "pencil" || o.type === "eraser") {
            // Scale vector points relative to bounding box scale changes
            var wScale = (origBbox.width + dx) / origBbox.width;
            var hScale = (origBbox.height + dy) / origBbox.height;
            return _objectSpread(_objectSpread({}, o), {}, {
              points: origObj.points.map(function (p) {
                return {
                  x: origBbox.x + (p.x - origBbox.x) * wScale,
                  y: origBbox.y + (p.y - origBbox.y) * hScale
                };
              })
            });
          }
          return o;
        });
      });
    };
    var _handleResizeEnd = function handleResizeEnd() {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", _handleResizeEnd);
      saveStateToHistory(canvasObjects);
    };
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", _handleResizeEnd);
  };

  // Remove the currently selected drawing object
  var handleRemoveSelected = function handleRemoveSelected() {
    if (selectedObjectId) {
      var nextObjs = canvasObjects.filter(function (o) {
        return o.id !== selectedObjectId;
      });
      setCanvasObjects(nextObjs);
      saveStateToHistory(nextObjs);
      setSelectedObjectId(null);
    }
  };

  // Listen for brush property changes and update selected text/shape colors or sizes
  (0, _react.useEffect)(function () {
    if (selectedObjectId) {
      setCanvasObjects(function (prev) {
        return prev.map(function (o) {
          if (o.id !== selectedObjectId) return o;
          var updates = {};
          if (o.type === "text" || o.type === "rect" || o.type === "arrow") {
            updates.color = brushColor;
          }
          return _objectSpread(_objectSpread({}, o), updates);
        });
      });
    }
  }, [brushColor]);
  (0, _react.useEffect)(function () {
    if (selectedObjectId) {
      setCanvasObjects(function (prev) {
        return prev.map(function (o) {
          if (o.id !== selectedObjectId) return o;
          var updates = {};
          if (o.type === "text") {
            updates.fontSize = brushSize * 4 > 12 ? brushSize * 4 : 20;
            updates.height = Math.round(updates.fontSize * 1.5);
          } else if (o.type === "rect" || o.type === "arrow") {
            // Only update shapes (not pencil/eraser — those are pixel-based strokes.
            // Retroactively resizing an eraser stroke would cause erased content to reappear.)
            updates.brushSize = brushSize;
          }
          return _objectSpread(_objectSpread({}, o), updates);
        });
      });
    }
  }, [brushSize]);

  // Upload background file
  var handleUploadBg = function handleUploadBg(e) {
    var _e$target$files;
    var file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (event) {
      setBgImageUrl(event.target.result);
      setAspectRatio("Auto");
      setViewState("canvas");
    };
    reader.readAsDataURL(file);
  };

  // Insert Overlay image
  var handleInsertImageClick = function handleInsertImageClick() {
    var _insertImageInputRef$;
    (_insertImageInputRef$ = insertImageInputRef.current) === null || _insertImageInputRef$ === void 0 || _insertImageInputRef$.click();
  };
  var handleInsertImage = function handleInsertImage(e) {
    var _e$target$files2;
    var file = (_e$target$files2 = e.target.files) === null || _e$target$files2 === void 0 ? void 0 : _e$target$files2[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (event) {
      var img = new Image();
      img.onload = function () {
        var id = Math.random().toString(36).substring(7);
        var w = img.naturalWidth || img.width || 150;
        var h = img.naturalHeight || img.height || 150;
        var maxDim = 150;
        var scale = Math.min(maxDim / w, maxDim / h);
        var startW = Math.round(w * scale);
        var startH = Math.round(h * scale);
        var newImageObj = {
          id: id,
          type: "image",
          img: img,
          url: event.target.result,
          x: Math.round((canvasDimensions.width - startW) / 2),
          y: Math.round((canvasDimensions.height - startH) / 2),
          width: startW,
          height: startH
        };
        var nextObjs = [].concat(_toConsumableArray(canvasObjects), [newImageObj]);
        setCanvasObjects(nextObjs);
        saveStateToHistory(nextObjs);
        setSelectedObjectId(id);
        setActiveTool("pointer");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Clear Canvas (Remove image, drawings, text overlays and reset to setup screen)
  var handleClearCanvas = function handleClearCanvas() {
    if (confirm("Clear all drawings, text overlays, and remove the background image?")) {
      var canvas = canvasRef.current;
      if (canvas) {
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setCanvasObjects([]);
      setSelectedObjectId(null);
      saveStateToHistory([]);
      setBgImageUrl(null);
      setViewState("setup");
    }
  };

  // Merge Layers and Trigger Generation
  var handleGenerateClick = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var canvas, bgCanvas, mergeCanvas, mCtx, bgImg, blob, uploadedUrl, results, _t;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (!generating) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            canvas = canvasRef.current;
            bgCanvas = bgCanvasRef.current;
            if (!(!canvas || !bgCanvas)) {
              _context2.n = 2;
              break;
            }
            return _context2.a(2);
          case 2:
            setGenerating(true);
            _context2.p = 3;
            mergeCanvas = document.createElement("canvas");
            mergeCanvas.width = canvas.width;
            mergeCanvas.height = canvas.height;
            mCtx = mergeCanvas.getContext("2d"); // 1. Draw static background layer (preserving asynchronous image loading coordinates)
            if (!bgImageUrl) {
              _context2.n = 5;
              break;
            }
            _context2.n = 4;
            return new Promise(function (resolve, reject) {
              var img = new Image();
              img.onload = function () {
                return resolve(img);
              };
              img.onerror = reject;
              img.src = bgImageUrl;
            });
          case 4:
            bgImg = _context2.v;
            mCtx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            _context2.n = 6;
            break;
          case 5:
            mCtx.drawImage(bgCanvas, 0, 0);
          case 6:
            // 2. Draw overlay image objects (in lower order than drawings)
            canvasObjects.filter(function (o) {
              return o.type === "image";
            }).forEach(function (imgObj) {
              mCtx.drawImage(imgObj.img, imgObj.x, imgObj.y, imgObj.width, imgObj.height);
            });

            // 3. Draw drawing overlay layer
            mCtx.drawImage(canvas, 0, 0);

            // 4. Draw texts with wrap formatting
            canvasObjects.filter(function (o) {
              return o.type === "text";
            }).forEach(function (textObj) {
              mCtx.fillStyle = textObj.color;
              mCtx.font = "bold ".concat(textObj.fontSize, "px Inter, sans-serif");
              mCtx.textBaseline = "top";
              var words = textObj.text.split(" ");
              var line = "";
              var testY = textObj.y;
              var lineHeight = textObj.fontSize * 1.25;
              for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + " ";
                var metrics = mCtx.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > textObj.width && n > 0) {
                  mCtx.fillText(line, textObj.x, testY);
                  line = words[n] + " ";
                  testY += lineHeight;
                } else {
                  line = testLine;
                }
              }
              mCtx.fillText(line, textObj.x, testY);
            });
            _context2.n = 7;
            return new Promise(function (resolve) {
              return mergeCanvas.toBlob(resolve, "image/jpeg", 0.92);
            });
          case 7:
            blob = _context2.v;
            if (blob) {
              _context2.n = 8;
              break;
            }
            throw new Error("Canvas serialization failed");
          case 8:
            _context2.n = 9;
            return (0, _muapi.uploadFile)(apiKey, blob);
          case 9:
            uploadedUrl = _context2.v;
            _context2.n = 10;
            return Promise.all(Array.from({
              length: batchSize
            }).map(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
              var genParams;
              return _regenerator().w(function (_context) {
                while (1) switch (_context.n) {
                  case 0:
                    genParams = {
                      model: selectedModel,
                      prompt: promptText.trim() || "Edit the image based on the drawing overlay",
                      images_list: [uploadedUrl],
                      aspect_ratio: aspectRatio === "Auto" ? "1:1" : aspectRatio
                    };
                    _context.n = 1;
                    return (0, _muapi.generateI2I)(apiKey, genParams);
                  case 1:
                    return _context.a(2, _context.v);
                }
              }, _callee);
            }))));
          case 10:
            results = _context2.v;
            results.forEach(function (res) {
              if (res && res.url) {
                var entry = {
                  id: res.id || Math.random().toString(36).substring(7),
                  url: res.url,
                  prompt: "Draw to Edit with ".concat(selectedModel === "nano-banana-pro-edit" ? "Nano Banana Pro Edit" : "Nano Banana 2 Edit"),
                  model: selectedModel,
                  aspect_ratio: aspectRatio === "Auto" ? "1:1" : aspectRatio,
                  timestamp: new Date().toISOString()
                };
                onAddHistoryItem(entry);
              }
            });
            alert("Generations complete!");
            onClose();
            _context2.n = 12;
            break;
          case 11:
            _context2.p = 11;
            _t = _context2.v;
            console.error("[DrawModal] Generation failed:", _t);
            alert("Generation failed: ".concat(_t.message));
          case 12:
            _context2.p = 12;
            setGenerating(false);
            return _context2.f(12);
          case 13:
            return _context2.a(2);
        }
      }, _callee2, null, [[3, 11, 12, 13]]);
    }));
    return function handleGenerateClick() {
      return _ref2.apply(this, arguments);
    };
  }();

  // Keep keyboardCallbacksRef up-to-date every render (placed after all handlers are defined)
  keyboardCallbacksRef.current = {
    selectedObjectId: selectedObjectId,
    handleRemoveSelected: handleRemoveSelected,
    handleUndo: handleUndo,
    handleRedo: handleRedo,
    handleSelectTool: handleSelectTool,
    handleInsertImageClick: handleInsertImageClick
  };
  if (!isOpen) return null;

  // Helper variables for outline layout
  var selectedObj = canvasObjects.find(function (o) {
    return o.id === selectedObjectId;
  });
  var bbox = getObjectBoundingBox(selectedObj);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "relative w-full max-w-5xl bg-[#0b0b0d] border border-white/10 rounded-2xl flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden h-[90vh]",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center justify-between border-b border-white/5 p-4 shrink-0 bg-[#0f0f12]",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex items-center gap-1.5 bg-[#131316]/60 border border-white/5 p-1 rounded-full select-none",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveTab("draw-to-edit");
            },
            className: "px-4 py-1.5 rounded-full text-xs font-semibold transition-all ".concat(activeTab === "draw-to-edit" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"),
            children: "Draw to Edit"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: onClose,
          className: "w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all",
          children: "\xD7"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto custom-scrollbar relative bg-[#070708]/30",
        children: viewState === "setup" ?
        /*#__PURE__*/
        /* Setup Card */
        (0, _jsxRuntime.jsxs)("div", {
          className: "border-2 border-dashed border-white/10 rounded-2xl p-8 max-w-md w-full text-center flex flex-col items-center gap-6 bg-[#070708]/50",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "w-56 h-36 rounded-xl border border-white/5 overflow-hidden shadow-lg select-none relative bg-black/40",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: "https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif",
              alt: "Draw visual representation",
              className: "w-full h-full object-cover opacity-60"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md rounded-md p-1 px-2 border border-white/5 flex items-center gap-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-2.5 h-2.5 rounded-full bg-[#b5f500] animate-pulse"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[9px] text-white/50 tracking-wider uppercase font-bold",
                children: "Sketchpad active"
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
              className: "text-white font-extrabold text-lg tracking-wide mb-1.5 uppercase",
              children: "DRAW TO EDIT"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-white/40 text-xs font-medium max-w-xs leading-relaxed mx-auto",
              children: "From sketch to a complete picture in a second. No prompt needed."
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col gap-2.5 w-full max-w-[240px]",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick() {
                var _fileInputRef$current;
                return (_fileInputRef$current = fileInputRef.current) === null || _fileInputRef$current === void 0 ? void 0 : _fileInputRef$current.click();
              },
              className: "bg-white hover:bg-white/90 text-black font-bold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                })
              }), "Upload Media"]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "file",
              ref: fileInputRef,
              onChange: handleUploadBg,
              accept: "image/*",
              className: "hidden"
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick() {
                setBgImageUrl(null);
                setViewState("canvas");
              },
              className: "bg-[#131316]/80 hover:bg-[#1c1c22] text-white border border-white/10 font-bold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-inner",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                  x: "3",
                  y: "3",
                  width: "18",
                  height: "18",
                  rx: "2",
                  ry: "2"
                })
              }), "Create blank"]
            })]
          })]
        }) :
        /*#__PURE__*/
        /* Canvas Screen */
        (0, _jsxRuntime.jsxs)("div", {
          className: "flex-1 flex flex-col items-center justify-center w-full relative h-full",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex items-center justify-center w-full",
            style: {
              height: "60vh",
              maxHeight: "60vh"
            },
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              ref: canvasWrapperRef,
              className: "relative border border-white/10 shadow-2xl rounded-lg overflow-hidden bg-black select-none",
              style: {
                height: "100%",
                width: "auto",
                aspectRatio: "".concat(canvasDimensions.width, " / ").concat(canvasDimensions.height),
                maxWidth: "100%"
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("canvas", {
                ref: bgCanvasRef,
                className: "absolute inset-0 w-full h-full pointer-events-none"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("canvas", {
                ref: canvasRef,
                onClick: handleCanvasClick,
                onMouseDown: handleStartDraw,
                onMouseMove: handleDrawing,
                onMouseUp: handleEndDraw,
                onMouseLeave: handleEndDraw,
                onTouchStart: handleStartDraw,
                onTouchMove: handleDrawing,
                onTouchEnd: handleEndDraw,
                className: "absolute inset-0 w-full h-full ".concat(activeTool === "pointer" ? "cursor-default" : "cursor-crosshair")
              }), canvasObjects.filter(function (o) {
                return o.type === "image";
              }).map(function (imgObj) {
                var leftPct = imgObj.x / canvasDimensions.width * 100;
                var topPct = imgObj.y / canvasDimensions.height * 100;
                var widthPct = imgObj.width / canvasDimensions.width * 100;
                var heightPct = imgObj.height / canvasDimensions.height * 100;
                var isSelected = selectedObjectId === imgObj.id;
                return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute group cursor-move ".concat(isSelected ? "ring-2 ring-[#b5f500] ring-offset-1 ring-offset-black z-10" : ""),
                  style: {
                    left: "".concat(leftPct, "%"),
                    top: "".concat(topPct, "%"),
                    width: "".concat(widthPct, "%"),
                    height: "".concat(heightPct, "%"),
                    pointerEvents: activeTool === "pointer" ? "auto" : "none"
                  },
                  onMouseDown: function onMouseDown(e) {
                    if (activeTool !== "pointer") return;
                    setSelectedObjectId(imgObj.id);
                    handleStartMoveSelected(e);
                  },
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                    src: imgObj.url,
                    alt: "",
                    className: "w-full h-full object-cover pointer-events-none"
                  })
                }, imgObj.id);
              }), canvasObjects.filter(function (o) {
                return o.type === "text";
              }).map(function (textObj) {
                var leftPct = textObj.x / canvasDimensions.width * 100;
                var topPct = textObj.y / canvasDimensions.height * 100;
                var widthPct = textObj.width / canvasDimensions.width * 100;
                var heightPct = textObj.height / canvasDimensions.height * 100;
                var isSelected = selectedObjectId === textObj.id;
                return /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
                  value: textObj.text,
                  onChange: function onChange(e) {
                    var val = e.target.value;
                    setCanvasObjects(function (prev) {
                      return prev.map(function (o) {
                        return o.id === textObj.id ? _objectSpread(_objectSpread({}, o), {}, {
                          text: val
                        }) : o;
                      });
                    });
                  },
                  onFocus: function onFocus() {
                    if (activeTool === "pointer") {
                      setSelectedObjectId(textObj.id);
                    }
                  },
                  className: "absolute bg-transparent border-none outline-none resize-none font-bold text-left overflow-hidden select-text z-10 ".concat(isSelected ? "ring-1 ring-[#b5f500] ring-dashed bg-black/25" : ""),
                  style: {
                    left: "".concat(leftPct, "%"),
                    top: "".concat(topPct, "%"),
                    width: "".concat(widthPct, "%"),
                    height: "".concat(heightPct, "%"),
                    fontSize: "".concat(textObj.fontSize / canvasDimensions.height * 100, "cqh"),
                    color: textObj.color,
                    lineHeight: 1.25,
                    pointerEvents: activeTool === "pointer" ? "auto" : "none"
                  }
                }, textObj.id);
              }), activeTool === "pointer" && selectedObjectId && bbox && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "absolute border border-dashed border-[#b5f500] pointer-events-auto z-20 cursor-move",
                style: {
                  left: "".concat(bbox.x / canvasDimensions.width * 100, "%"),
                  top: "".concat(bbox.y / canvasDimensions.height * 100, "%"),
                  width: "".concat(bbox.width / canvasDimensions.width * 100, "%"),
                  height: "".concat(bbox.height / canvasDimensions.height * 100, "%")
                },
                onMouseDown: handleStartMoveSelected,
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-nwse-resize rounded-full",
                  onMouseDown: function onMouseDown(e) {
                    return handleStartResizeSelected(e, "tl");
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-nesw-resize rounded-full",
                  onMouseDown: function onMouseDown(e) {
                    return handleStartResizeSelected(e, "tr");
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-nesw-resize rounded-full",
                  onMouseDown: function onMouseDown(e) {
                    return handleStartResizeSelected(e, "bl");
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-nwse-resize rounded-full",
                  onMouseDown: function onMouseDown(e) {
                    return handleStartResizeSelected(e, "br");
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute -top-1.5 left-[calc(50%-6px)] w-3 h-3 bg-white border border-[#b5f500] cursor-ns-resize rounded-full",
                  onMouseDown: function onMouseDown(e) {
                    return handleStartResizeSelected(e, "t");
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute -bottom-1.5 left-[calc(50%-6px)] w-3 h-3 bg-white border border-[#b5f500] cursor-ns-resize rounded-full",
                  onMouseDown: function onMouseDown(e) {
                    return handleStartResizeSelected(e, "b");
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute top-[calc(50%-6px)] -left-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-ew-resize rounded-full",
                  onMouseDown: function onMouseDown(e) {
                    return handleStartResizeSelected(e, "l");
                  }
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute top-[calc(50%-6px)] -right-1.5 w-3 h-3 bg-white border border-[#b5f500] cursor-ew-resize rounded-full",
                  onMouseDown: function onMouseDown(e) {
                    return handleStartResizeSelected(e, "r");
                  }
                })]
              }), activeTool === "pointer" && selectedObjectId && /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: handleRemoveSelected,
                className: "absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 hover:bg-black text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xl z-30 transition-all pointer-events-auto select-none",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                    points: "3 6 5 6 21 6"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                  })]
                }), "Remove selected"]
              })]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "mt-6 bg-[#0f0f11]/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl z-20 select-none",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                setActiveTool("pointer");
                setSelectedObjectId(null);
              },
              title: "Selection pointer",
              className: "p-1.5 rounded-lg transition-all ".concat(activeTool === "pointer" ? "bg-white text-black" : "text-white/60 hover:text-white"),
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                  points: "3 11 22 2 13 21 11 13 3 11"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                setActiveTool("pencil");
                setSelectedObjectId(null);
              },
              title: "Draw pencil",
              className: "p-1.5 rounded-lg transition-all ".concat(activeTool === "pencil" ? "bg-white text-black" : "text-white/60 hover:text-white"),
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                setActiveTool("eraser");
                setSelectedObjectId(null);
              },
              title: "Eraser (E)",
              className: "p-1.5 rounded-lg transition-all ".concat(activeTool === "eraser" ? "bg-white text-black" : "text-white/60 hover:text-white"),
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M20 20H7L3 16c-1-1-1-2.5 0-3.5L13 2c1-1 2.5-1 3.5 0l4 4c1 1 1 2.5 0 3.5L11 19l9 1z"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                setActiveTool("rect");
                setSelectedObjectId(null);
              },
              title: "Rectangle shape",
              className: "p-1.5 rounded-lg transition-all ".concat(activeTool === "rect" ? "bg-white text-black" : "text-white/60 hover:text-white"),
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                  x: "3",
                  y: "3",
                  width: "18",
                  height: "18",
                  rx: "2",
                  ry: "2"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                setActiveTool("arrow");
                setSelectedObjectId(null);
              },
              title: "Arrow shape",
              className: "p-1.5 rounded-lg transition-all ".concat(activeTool === "arrow" ? "bg-white text-black" : "text-white/60 hover:text-white"),
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "5",
                  y1: "19",
                  x2: "19",
                  y2: "5"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                  points: "12 5 19 5 19 12"
                })]
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                setActiveTool("text");
                setSelectedObjectId(null);
              },
              title: "Text tool",
              className: "p-1.5 rounded-lg transition-all ".concat(activeTool === "text" ? "bg-white text-black" : "text-white/60 hover:text-white"),
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-sm font-black tracking-tight select-none px-0.5",
                children: "T"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: handleInsertImageClick,
              title: "Insert overlay image",
              className: "p-1.5 rounded-lg transition-all ".concat(activeTool === "image" ? "bg-white text-black" : "text-white/60 hover:text-white"),
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
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
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "file",
              ref: insertImageInputRef,
              onChange: handleInsertImage,
              accept: "image/*",
              className: "hidden"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "h-6 w-px bg-white/10 mx-0.5"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "flex items-center gap-1.5 bg-[#16161a]/60 px-2 py-1 rounded-xl border border-white/5",
              children: PRESET_COLORS.map(function (col) {
                return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  onClick: function onClick() {
                    return setBrushColor(col);
                  },
                  className: "w-4 h-4 rounded-full border border-white/10 hover:scale-110 transition-transform relative flex items-center justify-center",
                  style: {
                    backgroundColor: col
                  },
                  children: brushColor === col && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "w-1.5 h-1.5 rounded-full bg-white mix-blend-difference"
                  })
                }, col);
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "h-6 w-px bg-white/10 mx-0.5"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: handleUndo,
              disabled: !canUndo,
              title: "Undo",
              className: "p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-25 transition-all",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: handleRedo,
              disabled: !canRedo,
              title: "Redo",
              className: "p-1.5 rounded-lg text-white/60 hover:text-white disabled:opacity-25 transition-all",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"
                })
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: handleGenerateClick,
              disabled: generating,
              className: "ml-1 bg-[#b5f500] hover:opacity-90 active:scale-[0.97] transition-all text-black font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#b5f500]/10 disabled:opacity-50 disabled:cursor-not-allowed",
              children: generating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "animate-spin inline-block",
                  children: "\u25CC"
                }), "Generating..."]
              }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
                children: ["Generate Image", /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                  className: "opacity-80",
                  children: ["\u2726 ", batchSize]
                })]
              })
            })]
          })]
        })
      }), viewState === "canvas" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "border-t border-white/5 p-4 shrink-0 bg-[#0f0f12] flex items-center justify-between z-20",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            ref: modelDropdownRef,
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick() {
                return setIsModelDropdownOpen(!isModelDropdownOpen);
              },
              className: "h-[38px] flex items-center gap-2 px-3 bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-xs text-white/70 whitespace-nowrap shadow-xl",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] text-[#b5f500] font-black bg-[#b5f500]/10 px-1.5 rounded border border-[#b5f500]/25",
                children: "G"
              }), selectedModel === "nano-banana-pro-edit" ? "Nano Banana Pro Edit" : "Nano Banana 2 Edit", /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "opacity-45 text-[8px] ml-0.5",
                children: "\u25BC"
              })]
            }), isModelDropdownOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute bottom-[calc(100%+8px)] left-0 bg-[#0f0f12] border border-white/10 rounded-2xl p-2 w-64 shadow-2xl flex flex-col gap-1 z-30",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-[10px] font-black text-white/30 uppercase tracking-widest p-1.5 pb-1 select-none",
                children: "Select model"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  setSelectedModel("nano-banana-2-edit");
                  setIsModelDropdownOpen(false);
                },
                className: "flex flex-col text-left p-2.5 rounded-xl transition-all ".concat(selectedModel === "nano-banana-2-edit" ? "bg-[#b5f500]/10 text-white" : "hover:bg-white/5 text-white/70"),
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "text-xs font-bold flex items-center gap-1.5",
                  children: ["Nano Banana 2 Edit", selectedModel === "nano-banana-2-edit" && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[#b5f500]",
                    children: "\u2713"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-[9px] text-white/30 leading-snug mt-0.5",
                  children: "Google's Advanced Image Editing Model"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: function onClick() {
                  setSelectedModel("nano-banana-pro-edit");
                  setIsModelDropdownOpen(false);
                },
                className: "flex flex-col text-left p-2.5 rounded-xl transition-all ".concat(selectedModel === "nano-banana-pro-edit" ? "bg-[#b5f500]/10 text-white" : "hover:bg-white/5 text-white/70"),
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "text-xs font-bold flex items-center gap-1.5",
                  children: ["Nano Banana Pro Edit", selectedModel === "nano-banana-pro-edit" && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[#b5f500]",
                    children: "\u2713"
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-[9px] text-white/30 leading-snug mt-0.5",
                  children: "Best 4K Image Model Ever"
                })]
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setShowSettingsPopover(!showSettingsPopover);
              },
              className: "h-[38px] w-[38px] flex items-center justify-center bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-white/60 shadow-xl transition-all",
              title: "Adjust Brush / Font Size",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "15",
                height: "15",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "4",
                  y1: "21",
                  x2: "4",
                  y2: "14"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "4",
                  y1: "10",
                  x2: "4",
                  y2: "3"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "12",
                  y1: "21",
                  x2: "12",
                  y2: "12"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "12",
                  y1: "8",
                  x2: "12",
                  y2: "3"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "20",
                  y1: "21",
                  x2: "20",
                  y2: "16"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "20",
                  y1: "12",
                  x2: "20",
                  y2: "3"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "1",
                  y1: "14",
                  x2: "7",
                  y2: "14"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "9",
                  y1: "8",
                  x2: "15",
                  y2: "8"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                  x1: "17",
                  y1: "16",
                  x2: "23",
                  y2: "16"
                })]
              })
            }), showSettingsPopover && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute bottom-[calc(100%+8px)] left-0 bg-[#0f0f12] border border-white/10 rounded-2xl p-3.5 w-44 shadow-2xl flex flex-col gap-2 z-30",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-[10px] font-black text-white/30 uppercase tracking-widest",
                children: selectedObj && selectedObj.type === "text" ? "Text Size" : "Brush Size"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                type: "range",
                min: "1",
                max: "100",
                value: brushSize,
                onChange: function onChange(e) {
                  return setBrushSize(parseInt(e.target.value));
                },
                className: "w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#b5f500]"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "text-[11px] font-bold text-white/60 text-right",
                children: [brushSize, "px"]
              })]
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
          type: "text",
          value: promptText,
          onChange: function onChange(e) {
            return setPromptText(e.target.value);
          },
          onKeyDown: function onKeyDown(e) {
            if (e.key === "Enter" && !generating) handleGenerateClick();
          },
          placeholder: "Describe what you want to generate\u2026",
          className: "flex-1 mx-3 h-[38px] bg-[#131316]/80 border border-white/5 rounded-xl px-3 text-xs text-white/80 placeholder-white/25 outline-none focus:border-[#b5f500]/40 focus:ring-1 focus:ring-[#b5f500]/20 transition-all"
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            ref: arDropdownRef,
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              onClick: function onClick() {
                return setIsArDropdownOpen(!isArDropdownOpen);
              },
              className: "h-[38px] flex items-center gap-2 px-3 bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-xs text-white/70 whitespace-nowrap shadow-xl",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "12",
                height: "12",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                className: "opacity-50",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
                  x: "3",
                  y: "3",
                  width: "18",
                  height: "18",
                  rx: "2",
                  ry: "2"
                })
              }), aspectRatio, /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "opacity-45 text-[8px] ml-0.5",
                children: "\u25BC"
              })]
            }), isArDropdownOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "absolute bottom-[calc(100%+8px)] right-0 bg-[#0f0f12] border border-white/10 rounded-xl p-2 w-36 max-h-72 overflow-y-auto shadow-2xl flex flex-col gap-1 z-30",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-[10px] font-black text-white/30 uppercase tracking-widest p-1.5 pb-1 select-none",
                children: "Aspect Ratio"
              }), ["16:9", "9:16", "4:3", "3:4", "1:1", "Auto"].map(function (r) {
                return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  onClick: function onClick() {
                    setAspectRatio(r);
                    setIsArDropdownOpen(false);
                  },
                  className: "text-left p-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ".concat(aspectRatio === r ? "bg-[#b5f500]/10 text-white" : "hover:bg-white/5 text-white/70"),
                  children: r
                }, r);
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: handleClearCanvas,
            title: "Clear drawings",
            className: "h-[38px] w-[38px] flex items-center justify-center bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-white/60 shadow-xl transition-all",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "15",
              height: "15",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                points: "3 6 5 6 21 6"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
              })]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return alert("Draw to Edit: paint directly over an image, insert overlay image/text objects, drag/resize elements, or select and delete specific components.");
            },
            title: "Info",
            className: "h-[38px] w-[38px] flex items-center justify-center bg-[#131316]/80 hover:bg-[#1c1c22] rounded-xl border border-white/5 text-white/60 shadow-xl transition-all",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-xs font-bold leading-none",
              children: "i"
            })
          })]
        })]
      })]
    })
  });
}