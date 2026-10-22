"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = RecastStudio;
var _react = require("react");
var _reactHotToast = _interopRequireWildcard(require("react-hot-toast"));
var _SocialPublishProvider = require("../../../../components/SocialPublishProvider");
var _AiAssistantProvider = require("../../../../components/AiAssistantProvider");
var _muapi = require("../muapi.js");
var _formatError = require("../utils/formatError.js");
var _persistKey = require("../persistKey.js");
var _MobileGenerationActions = _interopRequireWildcard(require("./MobileGenerationActions.jsx"));
var _models = require("../models.js");
var _PromptComposer = require("./prompt/PromptComposer.jsx");
var _recastStudio = _interopRequireDefault(require("../messages/en/recastStudio.json"));
var _recastStudio2 = _interopRequireDefault(require("../messages/zh/recastStudio.json"));
var _i18nUtils = require("../i18nUtils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t5 in e) "default" !== _t5 && {}.hasOwnProperty.call(e, _t5) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t5)) && (i.get || i.set) ? o(f, _t5, i) : f[_t5] = e[_t5]); return f; })(e, t); }
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
// Upload button states
// ---------------------------------------------------------------------------
var UPLOAD_STATE = {
  IDLE: "idle",
  UPLOADING: "uploading",
  READY: "ready"
};
function MediaPickerButton(_ref) {
  var accept = _ref.accept,
    label = _ref.label,
    icon = _ref.icon,
    onUpload = _ref.onUpload,
    onClear = _ref.onClear,
    uploadState = _ref.uploadState,
    progress = _ref.progress,
    fileName = _ref.fileName,
    previewUrl = _ref.previewUrl,
    isVideo = _ref.isVideo,
    copy = _ref.copy;
  var inputRef = (0, _react.useRef)(null);
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isDragging = _useState2[0],
    setIsDragging = _useState2[1];
  var dragCounterRef = (0, _react.useRef)(0);
  var handleClick = function handleClick(e) {
    var _inputRef$current;
    e.stopPropagation();
    if (uploadState === UPLOAD_STATE.READY) {
      onClear();
      return;
    }
    (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 || _inputRef$current.click();
  };
  var fileMatchesAccept = function fileMatchesAccept(file) {
    if (!accept) return true;
    var patterns = accept.split(",").map(function (p) {
      return p.trim();
    }).filter(Boolean);
    if (patterns.length === 0) return true;
    return patterns.some(function (pattern) {
      if (pattern === "*" || pattern === "*/*") return true;
      if (pattern.endsWith("/*")) {
        return file.type.startsWith(pattern.slice(0, -1));
      }
      return file.type === pattern;
    });
  };
  var handleFiles = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(files) {
      var _fileList$find;
      var fileList, file;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            fileList = Array.from(files || []);
            file = (_fileList$find = fileList.find(fileMatchesAccept)) !== null && _fileList$find !== void 0 ? _fileList$find : fileList[0];
            if (file) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            _context.n = 2;
            return onUpload(file);
          case 2:
            return _context.a(2);
        }
      }, _callee);
    }));
    return function handleFiles(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var handleChange = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(e) {
      var files;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            files = Array.from(e.target.files || []);
            e.target.value = "";
            _context2.n = 1;
            return handleFiles(files);
          case 1:
            return _context2.a(2);
        }
      }, _callee2);
    }));
    return function handleChange(_x2) {
      return _ref3.apply(this, arguments);
    };
  }();
  var handleDragEnter = function handleDragEnter(e) {
    var _e$dataTransfer;
    e.preventDefault();
    e.stopPropagation();
    if (uploadState === UPLOAD_STATE.UPLOADING) return;
    dragCounterRef.current += 1;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };
  var handleDragLeave = function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };
  var handleDragOver = function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  var handleDrop = function handleDrop(e) {
    var _e$dataTransfer2;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (uploadState === UPLOAD_STATE.UPLOADING) return;
    var files = (_e$dataTransfer2 = e.dataTransfer) === null || _e$dataTransfer2 === void 0 ? void 0 : _e$dataTransfer2.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
    type: "button",
    title: uploadState === UPLOAD_STATE.READY ? copy.titles.clickToClear.replace("{fileName}", fileName) : copy.titles.uploadFile.replace("{label}", label.toLowerCase()),
    onClick: handleClick,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    className: (0, _PromptComposer.promptMediaButtonClassName)({
      active: uploadState === UPLOAD_STATE.READY,
      className: isDragging ? "border-[#22d3ee] bg-[#22d3ee]/10 ring-2 ring-[#22d3ee]/50 scale-105" : ""
    }),
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ref: inputRef,
      type: "file",
      accept: accept,
      className: "hidden",
      onChange: handleChange
    }), uploadState === UPLOAD_STATE.IDLE && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex flex-col items-center justify-center gap-1 w-full h-full",
      children: icon
    }), uploadState === UPLOAD_STATE.UPLOADING && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
          className: "text-primary transition-all duration-300"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
        className: "absolute text-[9px] font-black text-primary leading-none",
        children: [progress, "%"]
      })]
    }), uploadState === UPLOAD_STATE.READY && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex flex-col items-center justify-center gap-1 w-full h-full absolute inset-0 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-all",
      children: previewUrl ? isVideo ? /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
        src: previewUrl,
        className: "w-full h-full object-cover",
        muted: true
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: previewUrl,
        alt: "",
        className: "w-full h-full object-cover"
      }) : icon
    })]
  });
}

// ---------------------------------------------------------------------------
// Assets history dropdown
// ---------------------------------------------------------------------------
function AssetsDropdown(_ref4) {
  var videos = _ref4.videos,
    images = _ref4.images,
    results = _ref4.results,
    onSelectVideo = _ref4.onSelectVideo,
    onSelectImage = _ref4.onSelectImage,
    onSelectResultAsVideo = _ref4.onSelectResultAsVideo,
    onDeleteAsset = _ref4.onDeleteAsset,
    setFullscreenUrl = _ref4.setFullscreenUrl,
    onClose = _ref4.onClose,
    anchorRef = _ref4.anchorRef,
    copy = _ref4.copy;
  var _useState3 = (0, _react.useState)("videos"),
    _useState4 = _slicedToArray(_useState3, 2),
    activeTab = _useState4[0],
    setActiveTab = _useState4[1]; // 'videos' | 'images' | 'results'
  var dropRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    var handler = function handler(e) {
      var _dropRef$current, _anchorRef$current;
      if (!((_dropRef$current = dropRef.current) !== null && _dropRef$current !== void 0 && _dropRef$current.contains(e.target)) && !(anchorRef !== null && anchorRef !== void 0 && (_anchorRef$current = anchorRef.current) !== null && _anchorRef$current !== void 0 && _anchorRef$current.contains(e.target))) {
        onClose();
      }
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [onClose, anchorRef]);
  var items = activeTab === "videos" ? videos : activeTab === "images" ? images : results;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
    ref: dropRef,
    className: "w-80 max-h-80 overflow-hidden flex flex-col gap-2",
    onClick: function onClick(e) {
      return e.stopPropagation();
    },
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
      className: "mb-0",
      children: copy.assetLibrary.header
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex border-b border-white/5 pb-1",
      children: ["videos", "images", "results"].map(function (tab) {
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "button",
          onClick: function onClick() {
            return setActiveTab(tab);
          },
          className: "flex-1 text-center py-1 text-xs font-bold capitalize transition-colors ".concat(activeTab === tab ? "text-[#22d3ee] border-b border-[#22d3ee]" : "text-white/40 hover:text-white/80"),
          children: copy.assetLibrary.tabs[tab]
        }, tab);
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-1.5 min-h-[180px] max-h-60",
      children: items.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex flex-col items-center justify-center flex-1 py-10 text-xs text-white/20",
        children: copy.assetLibrary.empty
      }) : items.map(function (item, idx) {
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          onClick: function onClick() {
            if (activeTab === "videos") {
              onSelectVideo(item.url, item.name);
            } else if (activeTab === "images") {
              onSelectImage(item.url, item.name);
            } else {
              onSelectResultAsVideo(item.url, item.name);
            }
          },
          className: "flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/5 hover:border-white/10 transition-all gap-2 group/item cursor-pointer",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 relative",
            children: [activeTab === "images" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: item.url,
              alt: "",
              className: "w-full h-full object-cover"
            }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
              src: item.url,
              className: "w-full h-full object-cover",
              muted: true,
              playsInline: true,
              loop: true
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              title: copy.titles.enlargePreview,
              onClick: function onClick(e) {
                e.stopPropagation();
                setFullscreenUrl(item.url);
              },
              className: "absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity text-white hover:text-[#22d3ee]",
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
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex-1 min-w-0 flex flex-col",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-xs text-white/95 font-semibold truncate",
              title: item.name,
              children: item.name
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[9px] text-white/30 truncate mt-0.5",
              children: new Date(item.timestamp || Date.now()).toLocaleDateString()
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-1",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              className: "text-xs text-black font-black px-2.5 py-1 bg-[#22d3ee] rounded-md hover:bg-[#22d3ee]/90 transition-colors",
              children: copy.buttons.use
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              title: copy.titles.deleteFromLibrary,
              onClick: function onClick(e) {
                e.stopPropagation();
                onDeleteAsset(activeTab, item.url);
              },
              className: "p-1.5 text-white/30 hover:text-red-500 rounded hover:bg-white/5 transition-colors",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "12",
                height: "12",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                  points: "3 6 5 6 21 6"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                })]
              })
            })]
          })]
        }, idx);
      })
    })]
  });
}

// ---------------------------------------------------------------------------
// Inline dropdown
// ---------------------------------------------------------------------------
function Dropdown(_ref5) {
  var isOpen = _ref5.isOpen,
    title = _ref5.title,
    items = _ref5.items,
    selectedId = _ref5.selectedId,
    onSelect = _ref5.onSelect,
    onClose = _ref5.onClose,
    anchorRef = _ref5.anchorRef,
    _ref5$className = _ref5.className,
    className = _ref5$className === void 0 ? "" : _ref5$className;
  var dropRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    if (!isOpen) return;
    var handler = function handler(e) {
      var _dropRef$current2, _anchorRef$current2;
      if (!((_dropRef$current2 = dropRef.current) !== null && _dropRef$current2 !== void 0 && _dropRef$current2.contains(e.target)) && !(anchorRef !== null && anchorRef !== void 0 && (_anchorRef$current2 = anchorRef.current) !== null && _anchorRef$current2 !== void 0 && _anchorRef$current2.contains(e.target))) {
        onClose();
      }
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [isOpen, onClose, anchorRef]);
  if (!isOpen) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
    ref: dropRef,
    className: className,
    onClick: function onClick(e) {
      return e.stopPropagation();
    },
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
      children: title
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuList, {
      children: items.map(function (item) {
        var _item$description;
        return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptMenuItem, {
          selected: item.id === selectedId,
          description: (_item$description = item.description) === null || _item$description === void 0 ? void 0 : _item$description.slice(0, 75),
          onClick: function onClick() {
            onSelect(item);
            onClose();
          },
          children: item.name
        }, item.id);
      })
    })]
  });
}

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------
var VideoIcon = function VideoIcon(_ref6) {
  var _ref6$className = _ref6.className,
    className = _ref6$className === void 0 ? "text-white/40 group-hover:text-primary transition-colors" : _ref6$className;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
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
var ImageIcon = function ImageIcon(_ref7) {
  var _ref7$className = _ref7.className,
    className = _ref7$className === void 0 ? "text-white/40 group-hover:text-primary transition-colors" : _ref7$className;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: className,
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function RecastStudio(_ref8) {
  var _firstModel$id, _firstModel$inputs$as, _firstModel$inputs, _selectedModel$name;
  var apiKey = _ref8.apiKey,
    onGenerationStart = _ref8.onGenerationStart,
    onGenerationEnd = _ref8.onGenerationEnd,
    onGenerationComplete = _ref8.onGenerationComplete,
    onGenerationError = _ref8.onGenerationError,
    historyItems = _ref8.historyItems,
    droppedFiles = _ref8.droppedFiles,
    onFilesHandled = _ref8.onFilesHandled,
    _ref8$locale = _ref8.locale,
    locale = _ref8$locale === void 0 ? "en" : _ref8$locale;
  var copy = (0, _i18nUtils.resolveCopy)(_recastStudio["default"], _recastStudio2["default"], locale);
  var LEGACY_PERSIST_KEY = "hg_recast_studio_persistent";
  var PERSIST_KEY = (0, _persistKey.scopedPersistKey)(LEGACY_PERSIST_KEY, apiKey);
  (0, _react.useEffect)(function () {
    (0, _persistKey.migrateLegacyPersistKey)(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

  // ── Model state ───────────────────────────────────────────────────────────
  var firstModel = _models.recastModels[0];
  var _useState5 = (0, _react.useState)((_firstModel$id = firstModel === null || firstModel === void 0 ? void 0 : firstModel.id) !== null && _firstModel$id !== void 0 ? _firstModel$id : ""),
    _useState6 = _slicedToArray(_useState5, 2),
    selectedModelId = _useState6[0],
    setSelectedModelId = _useState6[1];
  var _useState7 = (0, _react.useState)((_firstModel$inputs$as = firstModel === null || firstModel === void 0 || (_firstModel$inputs = firstModel.inputs) === null || _firstModel$inputs === void 0 || (_firstModel$inputs = _firstModel$inputs.aspect_ratio) === null || _firstModel$inputs === void 0 ? void 0 : _firstModel$inputs["default"]) !== null && _firstModel$inputs$as !== void 0 ? _firstModel$inputs$as : "16:9"),
    _useState8 = _slicedToArray(_useState7, 2),
    selectedAspectRatio = _useState8[0],
    setSelectedAspectRatio = _useState8[1];

  // ── Upload state ──────────────────────────────────────────────────────────
  var _useState9 = (0, _react.useState)(UPLOAD_STATE.IDLE),
    _useState0 = _slicedToArray(_useState9, 2),
    videoState = _useState0[0],
    setVideoState = _useState0[1];
  var _useState1 = (0, _react.useState)(""),
    _useState10 = _slicedToArray(_useState1, 2),
    videoName = _useState10[0],
    setVideoName = _useState10[1];
  var _useState11 = (0, _react.useState)(null),
    _useState12 = _slicedToArray(_useState11, 2),
    videoUrl = _useState12[0],
    setVideoUrl = _useState12[1];
  var _useState13 = (0, _react.useState)(0),
    _useState14 = _slicedToArray(_useState13, 2),
    videoProgress = _useState14[0],
    setVideoProgress = _useState14[1];
  var _useState15 = (0, _react.useState)(UPLOAD_STATE.IDLE),
    _useState16 = _slicedToArray(_useState15, 2),
    imageState = _useState16[0],
    setImageState = _useState16[1];
  var _useState17 = (0, _react.useState)(""),
    _useState18 = _slicedToArray(_useState17, 2),
    imageName = _useState18[0],
    setImageName = _useState18[1];
  var _useState19 = (0, _react.useState)(null),
    _useState20 = _slicedToArray(_useState19, 2),
    imageUrl = _useState20[0],
    setImageUrl = _useState20[1];
  var _useState21 = (0, _react.useState)(0),
    _useState22 = _slicedToArray(_useState21, 2),
    imageProgress = _useState22[0],
    setImageProgress = _useState22[1];

  // ── Prompt ────────────────────────────────────────────────────────────────
  var _useState23 = (0, _react.useState)(""),
    _useState24 = _slicedToArray(_useState23, 2),
    prompt = _useState24[0],
    setPrompt = _useState24[1];

  // ── Character Orientation ─────────────────────────────────────────────────
  var _useState25 = (0, _react.useState)("image"),
    _useState26 = _slicedToArray(_useState25, 2),
    characterOrientation = _useState26[0],
    setCharacterOrientation = _useState26[1];

  // ── Assets Library ────────────────────────────────────────────────────────
  var _useState27 = (0, _react.useState)(function () {
      if (typeof window !== "undefined") {
        try {
          var stored = localStorage.getItem("hg_recast_studio_assets");
          if (stored) {
            var data = JSON.parse(stored);
            return data.videos || [];
          }
        } catch (err) {}
      }
      return [];
    }),
    _useState28 = _slicedToArray(_useState27, 2),
    assetVideos = _useState28[0],
    setAssetVideos = _useState28[1];
  var _useState29 = (0, _react.useState)(function () {
      if (typeof window !== "undefined") {
        try {
          var stored = localStorage.getItem("hg_recast_studio_assets");
          if (stored) {
            var data = JSON.parse(stored);
            return data.images || [];
          }
        } catch (err) {}
      }
      return [];
    }),
    _useState30 = _slicedToArray(_useState29, 2),
    assetImages = _useState30[0],
    setAssetImages = _useState30[1];
  var _useState31 = (0, _react.useState)(function () {
      if (typeof window !== "undefined") {
        try {
          var stored = localStorage.getItem("hg_recast_studio_assets");
          if (stored) {
            var data = JSON.parse(stored);
            return data.results || [];
          }
        } catch (err) {}
      }
      return [];
    }),
    _useState32 = _slicedToArray(_useState31, 2),
    assetResults = _useState32[0],
    setAssetResults = _useState32[1];

  // ── Generation / UI state ─────────────────────────────────────────────────
  var _useState33 = (0, _react.useState)(false),
    _useState34 = _slicedToArray(_useState33, 2),
    isGenerating = _useState34[0],
    setIsGenerating = _useState34[1];
  var _useState35 = (0, _react.useState)(null),
    _useState36 = _slicedToArray(_useState35, 2),
    generateError = _useState36[0],
    setGenerateError = _useState36[1];
  var _useState37 = (0, _react.useState)(null),
    _useState38 = _slicedToArray(_useState37, 2),
    fullscreenUrl = _useState38[0],
    setFullscreenUrl = _useState38[1];

  // ── History ───────────────────────────────────────────────────────────────
  var _useState39 = (0, _react.useState)([]),
    _useState40 = _slicedToArray(_useState39, 2),
    internalHistory = _useState40[0],
    setInternalHistory = _useState40[1];
  var history = historyItems !== null && historyItems !== void 0 ? historyItems : internalHistory;

  // ── Dropdown state ────────────────────────────────────────────────────────
  var _useState41 = (0, _react.useState)(null),
    _useState42 = _slicedToArray(_useState41, 2),
    openDropdown = _useState42[0],
    setOpenDropdown = _useState42[1]; // 'model' | 'aspect' | 'orientation' | 'assets' | null
  var modelBtnRef = (0, _react.useRef)(null);
  var aspectBtnRef = (0, _react.useRef)(null);
  var orientationBtnRef = (0, _react.useRef)(null);
  var assetsBtnRef = (0, _react.useRef)(null);
  var textareaRef = (0, _react.useRef)(null);
  var hasRestored = (0, _react.useRef)(false);

  // ── Persistence: Load ──────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.selectedAspectRatio) setSelectedAspectRatio(data.selectedAspectRatio);
        if (data.characterOrientation) setCharacterOrientation(data.characterOrientation);
        if (data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setVideoState(UPLOAD_STATE.READY);
        }
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setImageState(UPLOAD_STATE.READY);
        }
        if (data.videoName) setVideoName(data.videoName);
        if (data.imageName) setImageName(data.imageName);
        if (data.prompt) setPrompt(data.prompt);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
      }
    } catch (err) {
      console.warn("Failed to load RecastStudio persistence:", err);
    } finally {
      hasRestored.current = true;
    }
  }, []);

  // ── Save Assets ────────────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      localStorage.setItem("hg_recast_studio_assets", JSON.stringify({
        videos: assetVideos,
        images: assetImages,
        results: assetResults
      }));
    } catch (err) {
      console.warn("Failed to save RecastStudio assets:", err);
    }
  }, [assetVideos, assetImages, assetResults]);
  var handleDeleteAsset = function handleDeleteAsset(tab, url) {
    if (tab === "videos") {
      setAssetVideos(function (prev) {
        return prev.filter(function (item) {
          return item.url !== url;
        });
      });
    } else if (tab === "images") {
      setAssetImages(function (prev) {
        return prev.filter(function (item) {
          return item.url !== url;
        });
      });
    } else {
      setAssetResults(function (prev) {
        return prev.filter(function (item) {
          return item.url !== url;
        });
      });
    }
  };

  // ── Persistence: Save ──────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify({
          selectedModelId: selectedModelId,
          selectedAspectRatio: selectedAspectRatio,
          characterOrientation: characterOrientation,
          videoUrl: videoUrl,
          videoName: videoName,
          imageUrl: imageUrl,
          imageName: imageName,
          prompt: prompt,
          internalHistory: internalHistory
        }));
      } catch (err) {
        console.warn("Failed to save RecastStudio persistence:", err);
      }
    }, 500);
    return function () {
      return clearTimeout(timer);
    };
  }, [selectedModelId, selectedAspectRatio, characterOrientation, videoUrl, videoName, imageUrl, imageName, prompt, internalHistory]);

  // ── Derived model info ──────────────────────────────────────────────────────
  var selectedModel = (0, _models.getRecastModelById)(selectedModelId);
  var aspectOptions = (0, _models.getAspectRatiosForRecastModel)(selectedModelId);
  var showAspect = aspectOptions.length > 0;
  var showPrompt = !!(selectedModel !== null && selectedModel !== void 0 && selectedModel.hasPrompt);

  // ── Upload handlers ─────────────────────────────────────────────────────────
  var handleVideoPick = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(file) {
      var url, _t;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (!(file.size > 50 * 1024 * 1024)) {
              _context3.n = 1;
              break;
            }
            alert(copy.errors.videoTooLarge);
            return _context3.a(2);
          case 1:
            setVideoState(UPLOAD_STATE.UPLOADING);
            setVideoProgress(0);
            _context3.p = 2;
            _context3.n = 3;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              return setVideoProgress(pct);
            });
          case 3:
            url = _context3.v;
            setVideoUrl(url);
            setVideoName(file.name);
            setVideoState(UPLOAD_STATE.READY);

            // Add to assets
            setAssetVideos(function (prev) {
              var exists = prev.some(function (item) {
                return item.url === url;
              });
              if (exists) return prev;
              return [{
                url: url,
                name: file.name,
                timestamp: new Date().toISOString()
              }].concat(_toConsumableArray(prev)).slice(0, 30);
            });
            _context3.n = 5;
            break;
          case 4:
            _context3.p = 4;
            _t = _context3.v;
            setVideoState(UPLOAD_STATE.IDLE);
            alert(copy.errors.videoUploadFailed.replace("{message}", _t.message));
          case 5:
            _context3.p = 5;
            setVideoProgress(0);
            return _context3.f(5);
          case 6:
            return _context3.a(2);
        }
      }, _callee3, null, [[2, 4, 5, 6]]);
    }));
    return function (_x3) {
      return _ref9.apply(this, arguments);
    };
  }(), [apiKey]);
  var handlePromptInput = function handlePromptInput(e) {
    setPrompt(e.target.value);
  };
  var handleImageUpload = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(file) {
      var url, _t2;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (!(file.size > 10 * 1024 * 1024)) {
              _context4.n = 1;
              break;
            }
            alert(copy.errors.imageTooLarge);
            return _context4.a(2);
          case 1:
            setImageState(UPLOAD_STATE.UPLOADING);
            setImageProgress(0);
            _context4.p = 2;
            _context4.n = 3;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              return setImageProgress(pct);
            });
          case 3:
            url = _context4.v;
            setImageUrl(url);
            setImageName(file.name);
            setImageState(UPLOAD_STATE.READY);

            // Add to assets
            setAssetImages(function (prev) {
              var exists = prev.some(function (item) {
                return item.url === url;
              });
              if (exists) return prev;
              return [{
                url: url,
                name: file.name,
                timestamp: new Date().toISOString()
              }].concat(_toConsumableArray(prev)).slice(0, 30);
            });
            _context4.n = 5;
            break;
          case 4:
            _context4.p = 4;
            _t2 = _context4.v;
            setImageState(UPLOAD_STATE.IDLE);
            alert(copy.errors.imageUploadFailed.replace("{message}", _t2.message));
          case 5:
            _context4.p = 5;
            setImageProgress(0);
            return _context4.f(5);
          case 6:
            return _context4.a(2);
        }
      }, _callee4, null, [[2, 4, 5, 6]]);
    }));
    return function (_x4) {
      return _ref0.apply(this, arguments);
    };
  }(), [apiKey]);

  // ── Handle Dropped Files ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (droppedFiles && droppedFiles.length > 0) {
      var imageFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith("image/");
      });
      var videoFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith("video/");
      });
      if (videoFiles.length > 0) handleVideoPick(videoFiles[0]);
      if (imageFiles.length > 0) handleImageUpload(imageFiles[0]);
      onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
    }
  }, [droppedFiles, onFilesHandled, handleVideoPick, handleImageUpload]);

  // ── Model selection ─────────────────────────────────────────────────────────
  var handleModelSelect = function handleModelSelect(model) {
    setSelectedModelId(model.id);
    var ratios = (0, _models.getAspectRatiosForRecastModel)(model.id);
    if (ratios.length > 0) {
      var _model$inputs$aspect_, _model$inputs;
      setSelectedAspectRatio((_model$inputs$aspect_ = (_model$inputs = model.inputs) === null || _model$inputs === void 0 || (_model$inputs = _model$inputs.aspect_ratio) === null || _model$inputs === void 0 ? void 0 : _model$inputs["default"]) !== null && _model$inputs$aspect_ !== void 0 ? _model$inputs$aspect_ : ratios[0]);
    }
  };

  // ── History helpers ─────────────────────────────────────────────────────────
  var addToInternalHistory = (0, _react.useCallback)(function (entry) {
    setInternalHistory(function (prev) {
      return [entry].concat(_toConsumableArray(prev)).slice(0, 30);
    });
  }, []);
  var downloadFile = /*#__PURE__*/function () {
    var _ref1 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(url, filename) {
      var response, blob, blobUrl, a, _t3;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            _context5.p = 0;
            _context5.n = 1;
            return fetch(url);
          case 1:
            response = _context5.v;
            _context5.n = 2;
            return response.blob();
          case 2:
            blob = _context5.v;
            blobUrl = URL.createObjectURL(blob);
            a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            _context5.n = 4;
            break;
          case 3:
            _context5.p = 3;
            _t3 = _context5.v;
            window.open(url, "_blank");
          case 4:
            return _context5.a(2);
        }
      }, _callee5, null, [[0, 3]]);
    }));
    return function downloadFile(_x5, _x6) {
      return _ref1.apply(this, arguments);
    };
  }();

  // ── Generation ──────────────────────────────────────────────────────────────
  var handleGenerate = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
      var params, res, genId, entry, errMsg, _t4;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.p = _context6.n) {
          case 0:
            if (videoUrl) {
              _context6.n = 1;
              break;
            }
            alert(copy.errors.missingVideo);
            return _context6.a(2);
          case 1:
            if (imageUrl) {
              _context6.n = 2;
              break;
            }
            alert(copy.errors.missingImage);
            return _context6.a(2);
          case 2:
            onGenerationStart === null || onGenerationStart === void 0 || onGenerationStart();
            setIsGenerating(true);
            setGenerateError(null);
            _context6.p = 3;
            params = {
              model: selectedModelId,
              video_url: videoUrl,
              image_url: imageUrl,
              character_orientation: characterOrientation
            };
            if (showAspect) params.aspect_ratio = selectedAspectRatio;
            if (prompt && selectedModel !== null && selectedModel !== void 0 && selectedModel.hasPrompt) params.prompt = prompt;
            if (selectedModelId === "kling-v3.0-pro-recast") {
              params.character_orientation = characterOrientation;
            }
            _context6.n = 4;
            return (0, _muapi.processRecast)(apiKey, params);
          case 4:
            res = _context6.v;
            if (res !== null && res !== void 0 && res.url) {
              _context6.n = 5;
              break;
            }
            throw new Error("No video URL returned by API");
          case 5:
            genId = res.id || Date.now().toString();
            entry = {
              id: genId,
              url: res.url,
              prompt: prompt,
              model: (selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.name) || selectedModelId,
              timestamp: new Date().toISOString()
            };
            if (!historyItems) addToInternalHistory(entry);

            // Add to assets
            setAssetResults(function (prev) {
              var url = res.url;
              var name = prompt ? prompt.slice(0, 20) + "..." : "Result ".concat(new Date().toLocaleTimeString());
              var exists = prev.some(function (item) {
                return item.url === url;
              });
              if (exists) return prev;
              return [{
                url: url,
                name: name,
                timestamp: new Date().toISOString()
              }].concat(_toConsumableArray(prev)).slice(0, 30);
            });
            if (onGenerationComplete) {
              onGenerationComplete({
                url: res.url,
                model: selectedModelId,
                prompt: prompt,
                type: "recast"
              });
            }
            _context6.n = 7;
            break;
          case 6:
            _context6.p = 6;
            _t4 = _context6.v;
            console.error("[RecastStudio]", _t4);
            errMsg = (0, _formatError.formatErrorMessage)(_t4, copy.errors.generationFailed);
            if (onGenerationError) onGenerationError(errMsg);else _reactHotToast["default"].error(errMsg);
          case 7:
            _context6.p = 7;
            setIsGenerating(false);
            onGenerationEnd === null || onGenerationEnd === void 0 || onGenerationEnd();
            return _context6.f(7);
          case 8:
            return _context6.a(2);
        }
      }, _callee6, null, [[3, 6, 7, 8]]);
    }));
    return function handleGenerate() {
      return _ref10.apply(this, arguments);
    };
  }();

  // ── Dropdown item lists ─────────────────────────────────────────────────────
  var aspectDropdownItems = aspectOptions.map(function (r) {
    return {
      id: r,
      name: r
    };
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2",
      children: history.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up",
        children: history.map(function (entry, idx) {
          var _entry$prompt;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer",
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
                title: copy.buttons.download,
                onClick: function onClick(e) {
                  e.stopPropagation();
                  downloadFile(entry.url, "bodyswap-".concat(entry.id || idx, ".mp4"));
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
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_SocialPublishProvider.PublishStep, {
                mediaUrl: entry.url,
                mediaType: "video",
                title: ((_entry$prompt = entry.prompt) === null || _entry$prompt === void 0 ? void 0 : _entry$prompt.substring(0, 50)) || 'Body swap video',
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
                  if (confirm(copy.confirm.deleteGenerated)) {
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
              prompt: entry.prompt,
              onCopyError: onGenerationError,
              actions: [{
                kind: "download",
                label: copy.buttons.download,
                onSelect: function onSelect() {
                  return downloadFile(entry.url, "bodyswap-".concat(entry.id || idx, ".mp4"));
                }
              }, {
                kind: "delete",
                label: copy.buttons["delete"],
                danger: true,
                onSelect: function onSelect() {
                  if (confirm("Are you sure you want to delete this generated item?")) {
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
              children: [entry.prompt && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-white/70 text-xs line-clamp-2 leading-relaxed",
                title: entry.prompt,
                children: entry.prompt
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "flex items-center justify-between flex-wrap gap-1 mt-1",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap",
                  children: copy.badges.bodySwap
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
            children: copy.empty.titleLine1
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight",
            children: copy.empty.titleLine2
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4",
          children: copy.empty.description
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptComposer, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-2 px-1",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(MediaPickerButton, {
            accept: "video/*",
            label: copy.labels.video,
            icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(VideoIcon, {
              className: "text-white/40 group-hover:text-[#22d3ee] transition-colors"
            }),
            onUpload: handleVideoPick,
            onClear: function onClear() {
              setVideoUrl(null);
              setVideoState(UPLOAD_STATE.IDLE);
              setVideoName("");
            },
            uploadState: videoState,
            progress: videoProgress,
            fileName: videoName,
            previewUrl: videoUrl,
            isVideo: true,
            copy: copy
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(MediaPickerButton, {
            accept: "image/*",
            label: copy.labels.characterImage,
            icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(ImageIcon, {
              className: "text-white/40 group-hover:text-[#22d3ee] transition-colors"
            }),
            onUpload: handleImageUpload,
            onClear: function onClear() {
              setImageUrl(null);
              setImageState(UPLOAD_STATE.IDLE);
              setImageName("");
            },
            uploadState: imageState,
            progress: imageProgress,
            fileName: imageName,
            previewUrl: imageUrl,
            isVideo: false,
            copy: copy
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex-1 flex flex-col",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptTextarea, {
            ref: textareaRef,
            value: prompt,
            onChange: handlePromptInput,
            placeholder: copy.placeholders.prompt
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptFooter, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptControls, {
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              ref: modelBtnRef,
              type: "button",
              onClick: function onClick(e) {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "model" ? null : "model");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "model"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-3.5 h-3.5 bg-[#22d3ee] rounded-sm flex items-center justify-center",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[9px] font-black text-black",
                  children: "R"
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: (_selectedModel$name = selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.name) !== null && _selectedModel$name !== void 0 ? _selectedModel$name : copy.dropdowns.selectModel
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
              isOpen: openDropdown === "model",
              title: copy.dropdowns.model,
              items: _models.recastModels,
              selectedId: selectedModelId,
              onSelect: handleModelSelect,
              onClose: function onClose() {
                return setOpenDropdown(null);
              },
              anchorRef: modelBtnRef,
              className: "w-80 max-w-[calc(100vw-2rem)]"
            })]
          }), showAspect && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              ref: aspectBtnRef,
              type: "button",
              onClick: function onClick(e) {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "aspect" ? null : "aspect");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "aspect"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAspectRatioIcon, {}), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
                children: selectedAspectRatio
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
              isOpen: openDropdown === "aspect",
              title: copy.dropdowns.aspectRatio,
              items: aspectDropdownItems,
              selectedId: selectedAspectRatio,
              onSelect: function onSelect(item) {
                return setSelectedAspectRatio(item.id);
              },
              onClose: function onClose() {
                return setOpenDropdown(null);
              },
              anchorRef: aspectBtnRef
            })]
          }), selectedModelId === "kling-v3.0-pro-recast" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              ref: orientationBtnRef,
              type: "button",
              onClick: function onClick(e) {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "orientation" ? null : "orientation");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "orientation"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-xs font-semibold text-current opacity-50 group-hover:opacity-100 transition-opacity",
                children: copy.labels.orientationPrefix
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-xs font-semibold text-current capitalize",
                children: characterOrientation
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(Dropdown, {
              isOpen: openDropdown === "orientation",
              title: copy.dropdowns.orientation,
              items: [{
                id: "image",
                name: copy.dropdowns.orientationImage,
                description: copy.dropdowns.orientationImageDesc
              }, {
                id: "video",
                name: copy.dropdowns.orientationVideo,
                description: copy.dropdowns.orientationVideoDesc
              }],
              selectedId: characterOrientation,
              onSelect: function onSelect(item) {
                return setCharacterOrientation(item.id);
              },
              onClose: function onClose() {
                return setOpenDropdown(null);
              },
              anchorRef: orientationBtnRef,
              className: "w-64"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              ref: assetsBtnRef,
              type: "button",
              onClick: function onClick(e) {
                e.stopPropagation();
                setOpenDropdown(openDropdown === "assets" ? null : "assets");
              },
              className: (0, _PromptComposer.promptControlClassName)({
                active: openDropdown === "assets"
              }),
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                className: "text-white/50 group-hover:text-[#22d3ee] transition-colors",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                children: copy.labels.library
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
            }), openDropdown === "assets" && /*#__PURE__*/(0, _jsxRuntime.jsx)(AssetsDropdown, {
              videos: assetVideos,
              images: assetImages,
              results: assetResults,
              onSelectVideo: function onSelectVideo(url, name) {
                setVideoUrl(url);
                setVideoName(name || copy.defaults.selectedVideo);
                setVideoState(UPLOAD_STATE.READY);
                setOpenDropdown(null);
              },
              onSelectImage: function onSelectImage(url, name) {
                setImageUrl(url);
                setImageName(name || copy.defaults.selectedImage);
                setImageState(UPLOAD_STATE.READY);
                setOpenDropdown(null);
              },
              onSelectResultAsVideo: function onSelectResultAsVideo(url, name) {
                setVideoUrl(url);
                setVideoName(name || copy.defaults.resultVideo);
                setVideoState(UPLOAD_STATE.READY);
                setOpenDropdown(null);
              },
              onDeleteAsset: handleDeleteAsset,
              setFullscreenUrl: setFullscreenUrl,
              onClose: function onClose() {
                return setOpenDropdown(null);
              },
              anchorRef: assetsBtnRef,
              copy: copy
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptAction, {
          onClick: handleGenerate,
          disabled: isGenerating,
          children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "animate-spin inline-block text-black",
              children: "\u25CC"
            }), " ", copy.buttons.swapping]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: copy.buttons.swapBody
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
      }), function () {
        var isImg = fullscreenUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) || fullscreenUrl.includes("/ai-images/") || fullscreenUrl.includes("image") || fullscreenUrl.startsWith("data:image");
        return isImg ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: fullscreenUrl,
          alt: "Fullscreen Preview",
          className: "max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up",
          onClick: function onClick(e) {
            return e.stopPropagation();
          }
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
          src: fullscreenUrl,
          controls: true,
          autoPlay: true,
          loop: true,
          className: "max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up",
          onClick: function onClick(e) {
            return e.stopPropagation();
          }
        });
      }()]
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

// ── Asset Library Dropdown ──────────────────────────────────────────────────
function AssetsDropdown(_ref1) {
  var videos = _ref1.videos,
    images = _ref1.images,
    results = _ref1.results,
    onSelectVideo = _ref1.onSelectVideo,
    onSelectImage = _ref1.onSelectImage,
    onDeleteAsset = _ref1.onDeleteAsset,
    setFullscreenUrl = _ref1.setFullscreenUrl,
    onClose = _ref1.onClose,
    anchorRef = _ref1.anchorRef,
    copy = _ref1.copy;
  var _useState41 = (0, _react.useState)("videos"),
    _useState42 = _slicedToArray(_useState41, 2),
    activeTab = _useState42[0],
    setActiveTab = _useState42[1];
  var dropRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    var handler = function handler(e) {
      var _dropRef$current2, _anchorRef$current2;
      if (!((_dropRef$current2 = dropRef.current) !== null && _dropRef$current2 !== void 0 && _dropRef$current2.contains(e.target)) && !(anchorRef !== null && anchorRef !== void 0 && (_anchorRef$current2 = anchorRef.current) !== null && _anchorRef$current2 !== void 0 && _anchorRef$current2.contains(e.target))) {
        onClose();
      }
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [onClose, anchorRef]);
  var items = activeTab === "videos" ? videos : activeTab === "images" ? images : results;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    ref: dropRef,
    className: "absolute z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)] max-h-96 overflow-hidden flex flex-col bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl p-3",
    onClick: function onClick(e) {
      return e.stopPropagation();
    },
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center justify-between border-b border-white/10 pb-1.5 mb-2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-xs font-bold text-white",
        children: copy.assetLibrary.header
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        onClick: onClose,
        className: "text-[11px] font-bold text-[#22d3ee] hover:underline",
        children: "Done"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex bg-white/[0.04] p-1 rounded-xl gap-1 border border-white/[0.06] mb-2",
      children: ["videos", "images", "results"].map(function (tab) {
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "button",
          onClick: function onClick() {
            return setActiveTab(tab);
          },
          className: "flex-1 py-1 text-xs font-bold rounded-lg capitalize transition-all ".concat(activeTab === tab ? "bg-[#22d3ee] text-black shadow-sm" : "text-white/50 hover:text-white hover:bg-white/[0.04]"),
          children: copy.assetLibrary.tabs[tab]
        }, tab);
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-2 min-h-[160px] max-h-64 pr-1",
      children: items.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex flex-col items-center justify-center flex-1 py-10 text-xs text-white/30",
        children: copy.assetLibrary.empty
      }) : items.map(function (item, idx) {
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all gap-2.5 group/item",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "w-11 h-11 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 relative border border-white/10",
            children: [activeTab === "images" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: item.url,
              alt: "",
              className: "w-full h-full object-cover"
            }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
              src: item.url,
              className: "w-full h-full object-cover",
              muted: true,
              playsInline: true,
              loop: true
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              title: copy.titles.enlargePreview,
              onClick: function onClick(e) {
                e.stopPropagation();
                setFullscreenUrl(item.url);
                onClose();
              },
              className: "absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity text-white hover:text-[#22d3ee]",
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
                })]
              })
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex-1 min-w-0 flex flex-col",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-xs text-white/95 font-semibold truncate",
              title: item.name,
              children: item.name
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-[10px] text-white/40 truncate mt-0.5",
              children: new Date(item.timestamp || Date.now()).toLocaleDateString()
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-1.5 flex-shrink-0",
            children: [activeTab === "images" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              onClick: function onClick(e) {
                e.stopPropagation();
                onSelectImage(item.url, item.name);
              },
              className: "text-[11px] text-black font-black px-2.5 py-1 bg-[#22d3ee] rounded-md hover:bg-[#22d3ee]/90 transition-colors whitespace-nowrap shadow-sm",
              children: copy.buttons.useAsImage
            }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              onClick: function onClick(e) {
                e.stopPropagation();
                onSelectVideo(item.url, item.name);
              },
              className: "text-[11px] text-black font-black px-2.5 py-1 bg-[#22d3ee] rounded-md hover:bg-[#22d3ee]/90 transition-colors whitespace-nowrap shadow-sm",
              children: copy.buttons.useAsImage
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              title: copy.titles.deleteFromLibrary,
              onClick: function onClick(e) {
                e.stopPropagation();
                onDeleteAsset(activeTab, item.url);
              },
              className: "p-1.5 text-white/30 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "12",
                height: "12",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                  points: "3 6 5 6 21 6"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                })]
              })
            })]
          })]
        }, idx);
      })
    })]
  });
}