"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = AudioStudio;
var _react = require("react");
var _useTemplateData2 = require("../hooks/useTemplateData");
var _muapi = require("../muapi.js");
var _models = require("../models.js");
var _CostEstimator = _interopRequireDefault(require("./CostEstimator.jsx"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
var PlayIcon = function PlayIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M8 5v14l11-7z"
    })
  });
};
var PauseIcon = function PauseIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M6 19h4V5H6v14zm8-14v14h4V5h-4z"
    })
  });
};
var VolumeIcon = function VolumeIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
      points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M15.54 8.46a5 5 0 0 1 0 7.07"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M19.07 4.93a10 10 0 0 1 0 14.14"
    })]
  });
};
var VolumeMuteIcon = function VolumeMuteIcon() {
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
      points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
      x1: "23",
      y1: "9",
      x2: "17",
      y2: "15"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
      x1: "17",
      y1: "9",
      x2: "23",
      y2: "15"
    })]
  });
};
var MusicIcon = function MusicIcon(_ref) {
  var _ref$className = _ref.className,
    className = _ref$className === void 0 ? "text-[#22d3ee]" : _ref$className;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M9 18V5l12-2v13"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
      cx: "6",
      cy: "18",
      r: "3"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
      cx: "18",
      cy: "16",
      r: "3"
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

// ---------------------------------------------------------------------------
// Single File Uploader Component
// ---------------------------------------------------------------------------
function AudioFileUploader(_ref2) {
  var label = _ref2.label,
    value = _ref2.value,
    onChange = _ref2.onChange,
    apiKey = _ref2.apiKey;
  var _useState = (0, _react.useState)(value ? UPLOAD_STATE.READY : UPLOAD_STATE.IDLE),
    _useState2 = _slicedToArray(_useState, 2),
    uploadState = _useState2[0],
    setUploadState = _useState2[1];
  var _useState3 = (0, _react.useState)(0),
    _useState4 = _slicedToArray(_useState3, 2),
    progress = _useState4[0],
    setProgress = _useState4[1];
  var _useState5 = (0, _react.useState)(value ? value.split('/').pop().slice(-30) : ""),
    _useState6 = _slicedToArray(_useState5, 2),
    fileName = _useState6[0],
    setFileName = _useState6[1];
  var fileInputRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    if (!value) {
      setUploadState(UPLOAD_STATE.IDLE);
      setFileName("");
      setProgress(0);
    } else if (uploadState !== UPLOAD_STATE.READY) {
      setUploadState(UPLOAD_STATE.READY);
      setFileName(value.split('/').pop().slice(-30));
    }
  }, [value]);
  var handleUpload = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(e) {
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
            if (!(file.size > 20 * 1024 * 1024)) {
              _context.n = 2;
              break;
            }
            alert("Audio file exceeds 20MB limit.");
            return _context.a(2);
          case 2:
            setUploadState(UPLOAD_STATE.UPLOADING);
            setProgress(0);
            _context.p = 3;
            _context.n = 4;
            return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
              setProgress(pct);
            });
          case 4:
            url = _context.v;
            setFileName(file.name);
            setUploadState(UPLOAD_STATE.READY);
            onChange(url);
            _context.n = 6;
            break;
          case 5:
            _context.p = 5;
            _t = _context.v;
            setUploadState(UPLOAD_STATE.IDLE);
            alert("Upload failed: ".concat(_t.message));
          case 6:
            _context.p = 6;
            setProgress(0);
            return _context.f(6);
          case 7:
            return _context.a(2);
        }
      }, _callee, null, [[3, 5, 6, 7]]);
    }));
    return function handleUpload(_x) {
      return _ref3.apply(this, arguments);
    };
  }();
  var clearFile = function clearFile(e) {
    e.stopPropagation();
    onChange(null);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "space-y-2",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
        className: "text-xs font-bold text-zinc-200 uppercase tracking-wider",
        children: label
      }), uploadState === UPLOAD_STATE.READY && /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
        type: "button",
        onClick: clearFile,
        className: "text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider flex items-center gap-1.5",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(TrashIcon, {}), " Clear"]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      onClick: function onClick() {
        var _fileInputRef$current;
        return uploadState === UPLOAD_STATE.IDLE && ((_fileInputRef$current = fileInputRef.current) === null || _fileInputRef$current === void 0 ? void 0 : _fileInputRef$current.click());
      },
      className: "relative border rounded p-4 transition-all duration-300 flex items-center gap-3.5 cursor-pointer ".concat(uploadState === UPLOAD_STATE.READY ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_rgba(34,211,238,0.05)]" : "border-zinc-700 bg-zinc-900 hover:bg-zinc-850 hover:border-primary/50"),
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        ref: fileInputRef,
        type: "file",
        accept: "audio/*",
        className: "hidden",
        onChange: handleUpload
      }), uploadState === UPLOAD_STATE.IDLE && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-200 border border-zinc-700/50",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.5",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
            })
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "text-left",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "text-xs font-bold text-white",
            children: "Upload audio track"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "text-[11px] text-zinc-300 font-medium mt-0.5",
            children: "MP3, WAV, M4A up to 20MB"
          })]
        })]
      }), uploadState === UPLOAD_STATE.UPLOADING && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-full flex items-center gap-4",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex justify-between text-xs text-white/95 mb-1.5 font-bold",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: "Uploading..."
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
              children: [progress, "%"]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "h-1.5 bg-zinc-800 rounded-full overflow-hidden",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "h-full bg-primary transition-all duration-300",
              style: {
                width: "".concat(progress, "%")
              }
            })
          })]
        })
      }), uploadState === UPLOAD_STATE.READY && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-primary border border-primary/30",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(MusicIcon, {
            className: "text-primary"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "text-left flex-1 min-w-0",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "text-xs font-bold text-white truncate",
            children: fileName
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "text-[11px] text-primary font-bold mt-0.5",
            children: "Ready to generate"
          })]
        })]
      })]
    })]
  });
}

// ---------------------------------------------------------------------------
// Multiple File Uploader Component (for array fields like audios_list)
// ---------------------------------------------------------------------------
function AudioListUploader(_ref4) {
  var label = _ref4.label,
    _ref4$value = _ref4.value,
    value = _ref4$value === void 0 ? [] : _ref4$value,
    onChange = _ref4.onChange,
    apiKey = _ref4.apiKey,
    _ref4$maxItems = _ref4.maxItems,
    maxItems = _ref4$maxItems === void 0 ? 2 : _ref4$maxItems;
  var handleItemChange = function handleItemChange(index, url) {
    var newItems = _toConsumableArray(value);
    if (url) {
      newItems[index] = url;
    } else {
      newItems.splice(index, 1);
    }
    onChange(newItems.filter(Boolean));
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "space-y-4",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("label", {
      className: "block text-xs font-bold text-zinc-200 uppercase tracking-wider",
      children: [label, " (Max ", maxItems, ")"]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "space-y-3",
      children: Array.from({
        length: maxItems
      }).map(function (_, i) {
        return /*#__PURE__*/(0, _jsxRuntime.jsx)(AudioFileUploader, {
          label: "Track #".concat(i + 1),
          value: value[i] || null,
          onChange: function onChange(url) {
            return handleItemChange(i, url);
          },
          apiKey: apiKey
        }, i);
      })
    })]
  });
}

// ---------------------------------------------------------------------------
// Premium Custom Audio Player with Waveform Animation
// ---------------------------------------------------------------------------
function PremiumAudioPlayer(_ref5) {
  var url = _ref5.url,
    title = _ref5.title;
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    isPlaying = _useState8[0],
    setIsPlaying = _useState8[1];
  var _useState9 = (0, _react.useState)(0),
    _useState0 = _slicedToArray(_useState9, 2),
    currentTime = _useState0[0],
    setCurrentTime = _useState0[1];
  var _useState1 = (0, _react.useState)(0),
    _useState10 = _slicedToArray(_useState1, 2),
    duration = _useState10[0],
    setDuration = _useState10[1];
  var _useState11 = (0, _react.useState)(1),
    _useState12 = _slicedToArray(_useState11, 2),
    volume = _useState12[0],
    setVolume = _useState12[1];
  var _useState13 = (0, _react.useState)(false),
    _useState14 = _slicedToArray(_useState13, 2),
    isMuted = _useState14[0],
    setIsMuted = _useState14[1];
  var audioRef = (0, _react.useRef)(null);
  var progressBarRef = (0, _react.useRef)(null);
  var visualizerIntervalRef = (0, _react.useRef)(null);
  var _useState15 = (0, _react.useState)(Array(18).fill(15)),
    _useState16 = _slicedToArray(_useState15, 2),
    visualizerHeights = _useState16[0],
    setVisualizerHeights = _useState16[1];

  // Reset player when URL changes
  (0, _react.useEffect)(function () {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [url]);

  // Audio state event listeners
  var onTimeUpdate = function onTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  var onLoadedMetadata = function onLoadedMetadata() {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  var onAudioEnded = function onAudioEnded() {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Toggle playback
  var togglePlay = function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(function () {
        setIsPlaying(true);
      })["catch"](function (err) {
        console.error("Audio playback error:", err);
      });
    }
  };

  // Equalizer visualizer effect
  (0, _react.useEffect)(function () {
    if (isPlaying) {
      visualizerIntervalRef.current = setInterval(function () {
        setVisualizerHeights(Array(18).fill(0).map(function () {
          return Math.floor(Math.random() * 32) + 6;
        }));
      }, 100);
    } else {
      if (visualizerIntervalRef.current) {
        clearInterval(visualizerIntervalRef.current);
      }
      setVisualizerHeights(Array(18).fill(12));
    }
    return function () {
      if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    };
  }, [isPlaying]);

  // Volume control
  var handleVolumeChange = function handleVolumeChange(e) {
    var val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  var toggleMute = function toggleMute() {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Scrubbing
  var handleScrub = function handleScrub(e) {
    if (!audioRef.current || duration === 0) return;
    var rect = progressBarRef.current.getBoundingClientRect();
    var pos = (e.clientX - rect.left) / rect.width;
    var seekTime = Math.min(Math.max(pos * duration, 0), duration);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Helper formatting time
  var formatTime = function formatTime(time) {
    if (isNaN(time)) return "0:00";
    var minutes = Math.floor(time / 60);
    var seconds = Math.floor(time % 60);
    return "".concat(minutes, ":").concat(seconds < 10 ? "0" : "").concat(seconds);
  };
  var downloadAudio = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var response, blob, blobUrl, a, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            _context2.p = 0;
            _context2.n = 1;
            return fetch(url);
          case 1:
            response = _context2.v;
            _context2.n = 2;
            return response.blob();
          case 2:
            blob = _context2.v;
            blobUrl = URL.createObjectURL(blob);
            a = document.createElement("a");
            a.href = blobUrl;
            a.download = title ? "".concat(title.replace(/\s+/g, '_'), ".mp3") : "generated_audio.mp3";
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
    return function downloadAudio() {
      return _ref6.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "w-full bg-zinc-900 border border-zinc-700/80 rounded p-6 shadow-3xl space-y-6 backdrop-blur-md",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("audio", {
      ref: audioRef,
      src: url,
      onTimeUpdate: onTimeUpdate,
      onLoadedMetadata: onLoadedMetadata,
      onEnded: onAudioEnded,
      preload: "auto"
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col items-center justify-center py-6 relative rounded bg-black/60 overflow-hidden border border-zinc-800",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-center gap-1.5 h-12 mb-4 justify-center",
        children: visualizerHeights.map(function (h, i) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-1.5 rounded-full bg-gradient-to-t from-primary to-[#a855f7] transition-all duration-100",
            style: {
              height: "".concat(h, "px")
            }
          }, i);
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "text-center px-4 max-w-full relative z-10",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-xs font-black text-primary uppercase tracking-[0.2em] block mb-1",
          children: "Now Playing"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white font-bold text-base truncate max-w-xs",
          children: title || "Generated Track"
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "space-y-4",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-3",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-xs font-bold text-zinc-200 w-10 text-right",
          children: formatTime(currentTime)
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          ref: progressBarRef,
          onClick: handleScrub,
          className: "flex-1 h-2 bg-zinc-700 hover:bg-zinc-650 rounded-full cursor-pointer relative group transition-colors",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute left-0 top-0 bottom-0 bg-primary rounded-full group-hover:bg-primary/95 transition-all",
            style: {
              width: "".concat(currentTime / (duration || 1) * 100, "%")
            }
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute w-3.5 h-3.5 bg-white rounded-full -top-[3px] shadow-glow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
            style: {
              left: "calc(".concat(currentTime / (duration || 1) * 100, "% - 7px)")
            }
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-xs font-bold text-zinc-200 w-10 text-left",
          children: formatTime(duration)
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center justify-between pt-2",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2 group/volume w-24",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: toggleMute,
            className: "p-2 bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 rounded text-zinc-200 hover:text-white transition-all",
            title: "Mute/Unmute",
            type: "button",
            children: isMuted ? /*#__PURE__*/(0, _jsxRuntime.jsx)(VolumeMuteIcon, {}) : /*#__PURE__*/(0, _jsxRuntime.jsx)(VolumeIcon, {})
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
            type: "range",
            min: "0",
            max: "1",
            step: "0.05",
            value: isMuted ? 0 : volume,
            onChange: handleVolumeChange,
            className: "w-16 h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-primary hover:bg-zinc-600 transition-all opacity-0 group-hover/volume:opacity-100"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: togglePlay,
          className: "w-12 h-12 bg-primary hover:bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow",
          title: isPlaying ? "Pause" : "Play",
          type: "button",
          children: isPlaying ? /*#__PURE__*/(0, _jsxRuntime.jsx)(PauseIcon, {}) : /*#__PURE__*/(0, _jsxRuntime.jsx)(PlayIcon, {})
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          onClick: downloadAudio,
          className: "px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-bold text-white flex items-center gap-2 hover:border-primary/45 transition-all",
          title: "Download Audio",
          type: "button",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.5",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: "Save"
          })]
        })]
      })]
    })]
  });
}

// ---------------------------------------------------------------------------
// Main Audio Studio Component
// ---------------------------------------------------------------------------
function AudioStudio(_ref7) {
  var _audioModels$0$id, _audioModels$, _selectedModel$name;
  var apiKey = _ref7.apiKey,
    onGenerationComplete = _ref7.onGenerationComplete,
    historyItems = _ref7.historyItems,
    droppedFiles = _ref7.droppedFiles,
    onFilesHandled = _ref7.onFilesHandled,
    templateData = _ref7.templateData;
  var PERSIST_KEY = "hg_audio_studio_persistent";

  // ── Mode & model state ──────────────────────────────────────────────────
  var _useState17 = (0, _react.useState)((_audioModels$0$id = (_audioModels$ = _models.audioModels[0]) === null || _audioModels$ === void 0 ? void 0 : _audioModels$.id) !== null && _audioModels$0$id !== void 0 ? _audioModels$0$id : ""),
    _useState18 = _slicedToArray(_useState17, 2),
    selectedModelId = _useState18[0],
    setSelectedModelId = _useState18[1];
  var _useState19 = (0, _react.useState)({}),
    _useState20 = _slicedToArray(_useState19, 2),
    params = _useState20[0],
    setParams = _useState20[1];
  var _useState21 = (0, _react.useState)(false),
    _useState22 = _slicedToArray(_useState21, 2),
    openDropdown = _useState22[0],
    setOpenDropdown = _useState22[1];
  var modelBtnRef = (0, _react.useRef)(null);

  // ── Generation state ──────────────────────────────────────────────────
  var _useState23 = (0, _react.useState)(false),
    _useState24 = _slicedToArray(_useState23, 2),
    isGenerating = _useState24[0],
    setIsGenerating = _useState24[1];
  var _useState25 = (0, _react.useState)(null),
    _useState26 = _slicedToArray(_useState25, 2),
    generateError = _useState26[0],
    setGenerateError = _useState26[1];
  var _useState27 = (0, _react.useState)(null),
    _useState28 = _slicedToArray(_useState27, 2),
    activeResultUrl = _useState28[0],
    setActiveResultUrl = _useState28[1];
  var _useState29 = (0, _react.useState)(""),
    _useState30 = _slicedToArray(_useState29, 2),
    activeResultTitle = _useState30[0],
    setActiveResultTitle = _useState30[1];
  var _useState31 = (0, _react.useState)("input"),
    _useState32 = _slicedToArray(_useState31, 2),
    view = _useState32[0],
    setView = _useState32[1]; // 'input' | 'result'

  // ── History state ────────────────────────────────────────────────────
  var _useState33 = (0, _react.useState)([]),
    _useState34 = _slicedToArray(_useState33, 2),
    internalHistory = _useState34[0],
    setInternalHistory = _useState34[1];
  var history = historyItems !== null && historyItems !== void 0 ? historyItems : internalHistory;
  var _useState35 = (0, _react.useState)(0),
    _useState36 = _slicedToArray(_useState35, 2),
    activeHistoryIdx = _useState36[0],
    setActiveHistoryIdx = _useState36[1];
  var selectedModel = (0, _models.getAudioModelById)(selectedModelId);

  // ── Initialize params when model changes ──────────────────────────────
  (0, _react.useEffect)(function () {
    if (!selectedModel) return;
    var initial = {};
    Object.entries(selectedModel.inputs || {}).forEach(function (_ref8) {
      var _ref9 = _slicedToArray(_ref8, 2),
        key = _ref9[0],
        schema = _ref9[1];
      // Don't overwrite parameters like vocal upload, list etc. if they are already in state
      if (params[key] !== undefined) {
        initial[key] = params[key];
      } else {
        initial[key] = schema["default"] !== undefined ? schema["default"] : "";
      }
    });
    setParams(initial);
  }, [selectedModelId]); // Only reset when model ID changes

  // ── Persistence: Load ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.params) setParams(data.params);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
        if (data.activeResultUrl) setActiveResultUrl(data.activeResultUrl);
        if (data.activeResultTitle) setActiveResultTitle(data.activeResultTitle);
        if (data.view) setView(data.view);
      }
    } catch (err) {
      console.warn("Failed to load AudioStudio persistence:", err);
    }
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      try {
        var state = {
          selectedModelId: selectedModelId,
          params: params,
          internalHistory: internalHistory,
          activeResultUrl: activeResultUrl,
          activeResultTitle: activeResultTitle,
          view: view
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save AudioStudio persistence:", err);
      }
    }, 500);
    return function () {
      return clearTimeout(timer);
    };
  }, [selectedModelId, params, internalHistory, activeResultUrl, activeResultTitle, view]);

  // ── Apply template data from landing page "Create This Style" ──────────────
  var _useTemplateData = (0, _useTemplateData2.useTemplateData)(templateData, function (data) {
      if (data.prompt) {
        setParams(function (p) {
          return _objectSpread(_objectSpread({}, p), {}, {
            prompt: data.prompt
          });
        });
      }
    }),
    resetTemplate = _useTemplateData.reset,
    isTemplateApplied = _useTemplateData.isTemplateApplied;

  // ── Handle Dropped Files ────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (droppedFiles && droppedFiles.length > 0) {
      var audioFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith('audio/');
      });
      if (audioFiles.length > 0 && selectedModel) {
        // Find the first audio input field in the current model
        var firstAudioField = Object.entries(selectedModel.inputs || {}).find(function (_ref0) {
          var _ref1 = _slicedToArray(_ref0, 2),
            _ = _ref1[0],
            schema = _ref1[1];
          return schema.field === 'audio';
        });
        var firstAudioListField = Object.entries(selectedModel.inputs || {}).find(function (_ref10) {
          var _ref11 = _slicedToArray(_ref10, 2),
            _ = _ref11[0],
            schema = _ref11[1];
          return schema.field === 'audios_list';
        });
        if (firstAudioField) {
          var _firstAudioField = _slicedToArray(firstAudioField, 1),
            key = _firstAudioField[0];
          // Trigger file upload helper
          (0, _muapi.uploadFile)(apiKey, audioFiles[0], function () {}).then(function (url) {
            setParams(function (prev) {
              return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, url));
            });
          })["catch"](function (err) {
            return alert("Failed to upload dropped file: ".concat(err.message));
          });
        } else if (firstAudioListField) {
          var _firstAudioListField = _slicedToArray(firstAudioListField, 1),
            _key = _firstAudioListField[0];
          (0, _muapi.uploadFile)(apiKey, audioFiles[0], function () {}).then(function (url) {
            setParams(function (prev) {
              var currentList = Array.isArray(prev[_key]) ? _toConsumableArray(prev[_key]) : [];
              if (currentList.length < 2) currentList.push(url);
              return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, _key, currentList));
            });
          })["catch"](function (err) {
            return alert("Failed to upload dropped file: ".concat(err.message));
          });
        }
      }
      onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
    }
  }, [droppedFiles, onFilesHandled, selectedModel, apiKey]);

  // ── History helpers ─────────────────────────────────────────────────────
  var addToInternalHistory = (0, _react.useCallback)(function (entry) {
    setInternalHistory(function (prev) {
      return [entry].concat(_toConsumableArray(prev)).slice(0, 30);
    });
  }, []);
  var handleSelectHistory = function handleSelectHistory(entry, index) {
    setActiveResultUrl(entry.url);
    setActiveResultTitle(entry.title || entry.prompt || "Generated Track");
    setActiveHistoryIdx(index);
    setView("result");
  };
  var handleGenerate = /*#__PURE__*/function () {
    var _ref12 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var _iterator, _step, field, _selectedModel$inputs, audioParams, res, title, entry, _e$message$slice, _e$message, _t3, _t4;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (selectedModel) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            if (!selectedModel.required) {
              _context3.n = 8;
              break;
            }
            _iterator = _createForOfIteratorHelper(selectedModel.required);
            _context3.p = 2;
            _iterator.s();
          case 3:
            if ((_step = _iterator.n()).done) {
              _context3.n = 5;
              break;
            }
            field = _step.value;
            if (!(!params[field] || Array.isArray(params[field]) && params[field].length === 0)) {
              _context3.n = 4;
              break;
            }
            alert("Please complete the required field: ".concat(((_selectedModel$inputs = selectedModel.inputs) === null || _selectedModel$inputs === void 0 || (_selectedModel$inputs = _selectedModel$inputs[field]) === null || _selectedModel$inputs === void 0 ? void 0 : _selectedModel$inputs.title) || field));
            return _context3.a(2);
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
            setIsGenerating(true);
            setGenerateError(null);
            _context3.p = 9;
            audioParams = _objectSpread(_objectSpread({}, params), {}, {
              _modelId: selectedModelId
            }); // Call generateAudio
            _context3.n = 10;
            return (0, _muapi.generateAudio)(apiKey, audioParams);
          case 10:
            res = _context3.v;
            if (res !== null && res !== void 0 && res.url) {
              _context3.n = 11;
              break;
            }
            throw new Error("No audio URL returned by the API.");
          case 11:
            title = params.title || params.prompt || "Generated ".concat(selectedModel.name);
            entry = {
              id: res.id || Date.now().toString(),
              url: res.url,
              title: title,
              prompt: params.prompt || "",
              model: selectedModelId,
              timestamp: new Date().toISOString()
            };
            if (!historyItems) addToInternalHistory(entry);
            setActiveResultUrl(res.url);
            setActiveResultTitle(title);
            setView("result");
            setActiveHistoryIdx(0);
            if (onGenerationComplete) {
              onGenerationComplete({
                url: res.url,
                model: selectedModelId,
                prompt: params.prompt,
                type: "audio"
              });
            }
            _context3.n = 13;
            break;
          case 12:
            _context3.p = 12;
            _t4 = _context3.v;
            console.error("[AudioStudio]", _t4);
            setGenerateError((_e$message$slice = (_e$message = _t4.message) === null || _e$message === void 0 ? void 0 : _e$message.slice(0, 100)) !== null && _e$message$slice !== void 0 ? _e$message$slice : "Audio generation failed");
          case 13:
            _context3.p = 13;
            setIsGenerating(false);
            return _context3.f(13);
          case 14:
            return _context3.a(2);
        }
      }, _callee3, null, [[9, 12, 13, 14], [2, 6, 7, 8]]);
    }));
    return function handleGenerate() {
      return _ref12.apply(this, arguments);
    };
  }();
  var handleNew = function handleNew() {
    setView("input");
    setActiveResultUrl(null);
    setActiveResultTitle("");
    // Keep parameters to avoid having to reupload files if they wish to adjust details
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "w-full h-full flex bg-app-bg text-white overflow-hidden relative",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "w-full lg:w-[400px] border-r border-zinc-900 flex flex-col bg-zinc-950/40 backdrop-blur-lg flex-shrink-0 z-30",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 pb-24",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-2 relative",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
            className: "text-xs font-bold text-zinc-300 uppercase tracking-wider block",
            children: "Audio Model"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            ref: modelBtnRef,
            type: "button",
            onClick: function onClick() {
              return setOpenDropdown(!openDropdown);
            },
            className: "w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-3.5 text-sm text-left font-bold text-white flex items-center justify-between hover:bg-zinc-850 hover:border-primary/50 transition-all",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: (_selectedModel$name = selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.name) !== null && _selectedModel$name !== void 0 ? _selectedModel$name : "Select Model"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              className: "transition-transform duration-200 ".concat(openDropdown ? 'rotate-180' : ''),
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                points: "6 9 12 15 18 9"
              })
            })]
          }), openDropdown && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute left-0 right-0 mt-2 z-50 bg-[#161618] border border-zinc-700 rounded shadow-3xl max-h-60 overflow-y-auto custom-scrollbar p-1.5",
            children: _models.audioModels.map(function (model) {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: function onClick() {
                  setSelectedModelId(model.id);
                  setOpenDropdown(false);
                },
                className: "w-full text-left px-4 py-2.5 rounded text-xs font-bold transition-all flex flex-col gap-1.5 border ".concat(model.id === selectedModelId ? "text-primary bg-primary/10 border-primary/20" : "text-zinc-200 border-transparent hover:bg-zinc-900 hover:text-white"),
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: model.name
                }), model.description && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] text-zinc-300 truncate max-w-[320px] font-normal",
                  children: model.description
                })]
              }, model.id);
            })
          })]
        }), (selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.description) && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[10px] font-bold text-primary uppercase tracking-wider block mb-1.5",
            children: "Description"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            className: "text-zinc-400 text-xs leading-relaxed font-semibold",
            children: selectedModel.description
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "space-y-5",
          children: selectedModel && Object.entries(selectedModel.inputs || {}).map(function (_ref13) {
            var _ref14 = _slicedToArray(_ref13, 2),
              key = _ref14[0],
              schema = _ref14[1];
            // Skip model switcher itself (if it's in schemas)
            if (key === 'model') return null;
            // Audio URL file upload (single)
            if (schema.type === "string" && schema.field === "audio") {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)(AudioFileUploader, {
                label: schema.title || key,
                value: params[key] || "",
                onChange: function onChange(url) {
                  return setParams(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, url));
                  });
                },
                apiKey: apiKey
              }, key);
            }
            // Audio URLs list file upload (multiple)
            if (schema.type === "array" && schema.field === "audios_list") {
              return /*#__PURE__*/(0, _jsxRuntime.jsx)(AudioListUploader, {
                label: schema.title || key,
                value: params[key] || [],
                onChange: function onChange(urls) {
                  return setParams(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, urls));
                  });
                },
                apiKey: apiKey,
                maxItems: schema.maxItems || 2
              }, key);
            }
            // Boolean Toggles
            if (schema.type === "boolean") {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center justify-between bg-zinc-900 border border-zinc-700/80 rounded p-4 transition-all hover:border-zinc-600",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex-1 pr-4",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "block text-xs font-bold text-white tracking-tight",
                    children: schema.title || key
                  }), schema.description && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "block text-[11px] text-zinc-300 leading-normal mt-1",
                    children: schema.description
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  type: "button",
                  onClick: function onClick() {
                    return setParams(function (prev) {
                      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, !prev[key]));
                    });
                  },
                  className: "w-11 h-6 rounded-full p-1 transition-all duration-300 relative shrink-0 ".concat(params[key] ? "bg-primary" : "bg-zinc-800"),
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "w-4 h-4 rounded-full bg-black shadow-md transform transition-all duration-300 ".concat(params[key] ? "translate-x-5 bg-white" : "translate-x-0")
                  })
                })]
              }, key);
            }
            // Enum Dropdowns
            if (schema["enum"]) {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "space-y-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
                  className: "block text-xs font-bold text-zinc-200 uppercase tracking-wider",
                  children: schema.title || key
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("select", {
                  value: params[key] || "",
                  onChange: function onChange(e) {
                    return setParams(function (prev) {
                      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, e.target.value));
                    });
                  },
                  className: "w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all cursor-pointer",
                  children: schema["enum"].map(function (opt) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
                      value: opt,
                      className: "bg-zinc-900 text-white text-xs",
                      children: opt
                    }, opt);
                  })
                }), schema.description && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "block text-[11px] text-zinc-300 leading-normal",
                  children: schema.description
                })]
              }, key);
            }

            // Number Sliders & Ranges
            var isNumber = schema.type === "int" || schema.type === "integer" || schema.type === "float" || schema.type === "number";
            var hasMinMax = schema.minValue !== undefined && schema.maxValue !== undefined;
            if (isNumber && hasMinMax) {
              var step = schema.step || (schema.type === "float" ? 0.05 : 1);
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "space-y-3 bg-zinc-900 border border-zinc-700/80 rounded p-4 transition-all hover:border-zinc-600",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center justify-between text-xs font-bold",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-white tracking-tight",
                    children: schema.title || key
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-primary font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20",
                    children: params[key] !== undefined ? params[key] : schema["default"]
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] text-zinc-300 font-medium w-6 text-right",
                    children: schema.minValue
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "range",
                    min: schema.minValue,
                    max: schema.maxValue,
                    step: step,
                    value: params[key] !== undefined ? params[key] : schema["default"] || 0,
                    onChange: function onChange(e) {
                      return setParams(function (prev) {
                        return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, parseFloat(e.target.value)));
                      });
                    },
                    className: "flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary hover:bg-zinc-700 transition-all"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] text-zinc-300 font-medium w-6 text-left",
                    children: schema.maxValue
                  })]
                }), schema.description && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "block text-[11px] text-zinc-300 leading-normal",
                  children: schema.description
                })]
              }, key);
            }

            // Prompt / Textarea Input
            if (key === "prompt") {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "space-y-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
                  className: "block text-xs font-bold text-zinc-200 uppercase tracking-wider",
                  children: schema.title || "Lyrics / Prompt"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
                  value: params[key] || "",
                  onChange: function onChange(e) {
                    return setParams(function (prev) {
                      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, e.target.value));
                    });
                  },
                  className: "w-full bg-zinc-900 border border-zinc-700 focus:border-primary/85 rounded p-3 text-xs text-white placeholder:text-zinc-400 focus:outline-none transition-all min-h-[100px] resize-none leading-relaxed shadow-inner",
                  placeholder: schema.description || "Enter what you want generated..."
                }), schema.examples && Array.isArray(schema.examples) && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "flex flex-wrap gap-1.5 mt-2",
                  children: schema.examples.map(function (ex, idx) {
                    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                      type: "button",
                      onClick: function onClick() {
                        return setParams(function (prev) {
                          return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, ex));
                        });
                      },
                      className: "text-[11px] px-3 py-1 bg-zinc-800/80 border border-zinc-700 hover:bg-primary/20 hover:border-primary/45 hover:text-white rounded-full transition-all font-semibold text-zinc-100",
                      children: ["\"", ex.slice(0, 35), "...\""]
                    }, idx);
                  })
                })]
              }, key);
            }

            // Standard Text / Input fields
            return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "space-y-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
                className: "block text-xs font-bold text-zinc-200 uppercase tracking-wider",
                children: schema.title || key
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                type: isNumber ? "number" : "text",
                value: params[key] !== undefined ? params[key] : "",
                placeholder: schema.placeholder || schema.description || "Enter ".concat(key, "..."),
                onChange: function onChange(e) {
                  var val = isNumber ? e.target.value === "" ? "" : parseFloat(e.target.value) : e.target.value;
                  setParams(function (prev) {
                    return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, val));
                  });
                },
                className: "w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-primary/80 rounded px-4 py-3.5 text-xs text-white placeholder:text-zinc-400 focus:outline-none transition-all shadow-inner"
              }), schema.description && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "block text-[11px] text-zinc-300 leading-normal",
                children: schema.description
              })]
            }, key);
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "p-4 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-xl absolute bottom-0 left-0 w-full lg:w-[400px] z-40",
        children: [selectedModel && /*#__PURE__*/(0, _jsxRuntime.jsx)(_CostEstimator["default"], {
          apiKey: apiKey,
          model: selectedModel,
          params: params
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "button",
          onClick: handleGenerate,
          disabled: isGenerating || !selectedModel,
          className: "w-full py-4 bg-primary text-black text-base font-bold rounded hover:bg-white transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:grayscale shadow-glow flex items-center justify-center gap-3",
          children: isGenerating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: "Generating Audio..."
            })]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "3",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M5 3l14 9-14 9V3z"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: "Generate Track"
            })]
          })
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex-1 flex flex-col min-w-0 h-full relative z-20",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 flex flex-col justify-between",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex-1 flex items-center justify-center min-h-[400px] mb-8",
          children: [generateError && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "w-full max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded flex flex-col items-center gap-4 animate-shake",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 border border-red-500/30 shadow-lg",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
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
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "text-center",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-xs font-black text-red-500 uppercase tracking-widest block mb-1",
                children: "Generation Error"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-white font-medium text-sm leading-relaxed",
                children: generateError
              })]
            })]
          }), isGenerating && !generateError && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col items-center gap-6 animate-fade-in",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-24 h-24 border-[3px] border-zinc-800 border-t-primary rounded-full animate-spin shadow-glow"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "absolute inset-0 flex items-center justify-center text-primary",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(MusicIcon, {
                  className: "animate-pulse text-primary"
                })
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "text-center space-y-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-xs font-black text-primary uppercase tracking-[0.3em] animate-pulse",
                children: "Generating Soundtrack"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-sm text-zinc-200 font-bold",
                children: "Rendering audio waveforms and vocals..."
              })]
            })]
          }), view === "input" && !isGenerating && !generateError && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col items-center gap-6 max-w-md text-center p-8 bg-zinc-900/40 border border-zinc-800 rounded backdrop-blur-sm relative group animate-fade-in-up",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-25 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-20 h-20 bg-zinc-900 border border-zinc-705 rounded flex items-center justify-center shadow-inner relative z-10 transition-transform duration-500 group-hover:scale-105",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)(MusicIcon, {
                className: "text-primary w-8 h-8 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative z-10",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
                className: "text-white font-black text-xl mb-3 tracking-tight",
                children: "Audio Studio"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-sm text-zinc-200 font-medium leading-relaxed px-4",
                children: "Choose an AI music model, voice cloner, or sound generator. Modify variables on the left and craft your next high-fidelity track."
              })]
            })]
          }), view === "result" && activeResultUrl && !isGenerating && !generateError && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "w-full max-w-2xl animate-fade-in-up space-y-4",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between px-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                onClick: handleNew,
                className: "text-xs font-bold text-zinc-200 hover:text-primary flex items-center gap-2 transition-all bg-zinc-905 border border-zinc-700 hover:border-primary/30 px-4 py-2 rounded-full",
                type: "button",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "12",
                  height: "12",
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
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  children: "New Generation"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "text-[11px] font-bold text-green-400 px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"
                }), " Success"]
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(PremiumAudioPlayer, {
              url: activeResultUrl,
              title: activeResultTitle
            })]
          })]
        }), history.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "border-t border-zinc-900 pt-6 w-full animate-fade-in-up",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("h4", {
            className: "text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4 px-1",
            children: ["Generation History (", history.length, ")"]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
            children: history.map(function (entry, idx) {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                onClick: function onClick() {
                  return handleSelectHistory(entry, idx);
                },
                className: "p-3.5 bg-zinc-900 border rounded cursor-pointer transition-all flex flex-col justify-between h-28 border-zinc-700/80 hover:bg-zinc-850 hover:border-zinc-500 ".concat(activeResultUrl === entry.url && view === "result" ? "border-primary bg-primary/5 shadow-glow" : ""),
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ".concat(activeResultUrl === entry.url && view === "result" ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-200"),
                    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                      width: "14",
                      height: "14",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2.5",
                      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polygon", {
                        points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                      })
                    })
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[10px] font-bold text-primary uppercase tracking-wider truncate",
                    children: entry.model ? entry.model.split('-').slice(0, 2).join(' ') : 'Audio'
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                  className: "text-[11px] font-semibold text-white line-clamp-2 leading-tight",
                  children: entry.title || entry.prompt || "Untitled Audio"
                })]
              }, entry.id || idx);
            })
          })]
        })]
      })
    })]
  });
}