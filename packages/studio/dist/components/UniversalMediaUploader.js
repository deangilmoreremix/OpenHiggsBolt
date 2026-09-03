"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = UniversalMediaUploader;
var _react = require("react");
var _reactHotToast = _interopRequireDefault(require("react-hot-toast"));
var _muapi = require("../muapi.js");
var _formatError = require("../utils/formatError.js");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
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
var HISTORY_KEY = "smartvideo_media_upload_history_v1";
var HISTORY_LIMIT = 40;
var DEFAULT_MAX_BYTES = {
  image: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024
};
function readHistory() {
  if (typeof window === "undefined") return [];
  try {
    var value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (_unused) {
    return [];
  }
}
function writeHistory(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
  } catch (_unused2) {
    // Storage is a convenience only; upload still succeeds when storage is unavailable.
  }
}
function matchesMediaType(file, mediaType) {
  var _file$type;
  return Boolean(file === null || file === void 0 || (_file$type = file.type) === null || _file$type === void 0 ? void 0 : _file$type.startsWith("".concat(mediaType, "/")));
}
function Preview(_ref) {
  var type = _ref.type,
    url = _ref.url;
  if (type === "video") {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
      src: url,
      muted: true,
      playsInline: true,
      className: "h-full w-full object-cover"
    });
  }
  if (type === "audio") {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex h-full w-full items-center justify-center bg-white/[0.04] text-[#22d3ee]",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.2",
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
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
    src: url,
    alt: "",
    className: "h-full w-full object-cover"
  });
}
function UniversalMediaUploader(_ref2) {
  var apiKey = _ref2.apiKey,
    slot = _ref2.slot,
    _ref2$values = _ref2.values,
    values = _ref2$values === void 0 ? [] : _ref2$values,
    onChange = _ref2.onChange,
    _ref2$disabled = _ref2.disabled,
    disabled = _ref2$disabled === void 0 ? false : _ref2$disabled,
    maxBytes = _ref2.maxBytes,
    _ref2$showHistory = _ref2.showHistory,
    showHistory = _ref2$showHistory === void 0 ? true : _ref2$showHistory,
    _ref2$className = _ref2.className,
    className = _ref2$className === void 0 ? "" : _ref2$className;
  var inputRef = (0, _react.useRef)(null);
  var dragDepth = (0, _react.useRef)(0);
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    dragging = _useState2[0],
    setDragging = _useState2[1];
  var _useState3 = (0, _react.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    uploading = _useState4[0],
    setUploading = _useState4[1];
  var _useState5 = (0, _react.useState)(0),
    _useState6 = _slicedToArray(_useState5, 2),
    progress = _useState6[0],
    setProgress = _useState6[1];
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    historyOpen = _useState8[0],
    setHistoryOpen = _useState8[1];
  var _useState9 = (0, _react.useState)(0),
    _useState0 = _slicedToArray(_useState9, 2),
    historyVersion = _useState0[0],
    setHistoryVersion = _useState0[1];
  var mediaType = (slot === null || slot === void 0 ? void 0 : slot.mediaType) || "image";
  var label = (slot === null || slot === void 0 ? void 0 : slot.label) || "Media";
  var role = (slot === null || slot === void 0 ? void 0 : slot.role) || (slot === null || slot === void 0 ? void 0 : slot.id) || "reference";
  var limit = Math.max(1, Number((slot === null || slot === void 0 ? void 0 : slot.maxItems) || 1));
  var remaining = Math.max(limit - values.length, 0);
  var accepted = "".concat(mediaType, "/*");
  var sizeLimit = maxBytes || DEFAULT_MAX_BYTES[mediaType] || DEFAULT_MAX_BYTES.image;
  var history = (0, _react.useMemo)(function () {
    return readHistory().filter(function (item) {
      return item.type === mediaType;
    });
  }, [historyOpen, historyVersion, mediaType]);
  var updateHistory = function updateHistory(entries) {
    var existing = readHistory();
    var urls = new Set(entries.map(function (item) {
      return item.url;
    }));
    writeHistory([].concat(_toConsumableArray(entries), _toConsumableArray(existing.filter(function (item) {
      return !urls.has(item.url);
    }))));
    setHistoryVersion(function (version) {
      return version + 1;
    });
  };
  var uploadFiles = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(files) {
      var candidates, tooLarge, perFile, urls, validUrls, next, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (apiKey) {
              _context.n = 1;
              break;
            }
            _reactHotToast["default"].error("Add your MuAPI key before uploading media.");
            return _context.a(2);
          case 1:
            if (!(disabled || uploading || remaining <= 0)) {
              _context.n = 2;
              break;
            }
            return _context.a(2);
          case 2:
            candidates = Array.from(files || []).filter(function (file) {
              return matchesMediaType(file, mediaType);
            }).slice(0, remaining);
            if (!(candidates.length === 0)) {
              _context.n = 3;
              break;
            }
            _reactHotToast["default"].error("Drop or choose a ".concat(mediaType, " file for ").concat(label, "."));
            return _context.a(2);
          case 3:
            tooLarge = candidates.find(function (file) {
              return file.size > sizeLimit;
            });
            if (!tooLarge) {
              _context.n = 4;
              break;
            }
            _reactHotToast["default"].error("".concat(tooLarge.name, " exceeds the ").concat(Math.round(sizeLimit / 1024 / 1024), "MB upload limit."));
            return _context.a(2);
          case 4:
            setUploading(true);
            setProgress(0);
            _context.p = 5;
            perFile = new Array(candidates.length).fill(0);
            _context.n = 6;
            return Promise.all(candidates.map(function (file, index) {
              return (0, _muapi.uploadFile)(apiKey, file, function (value) {
                perFile[index] = Number(value || 0);
                setProgress(Math.round(perFile.reduce(function (sum, item) {
                  return sum + item;
                }, 0) / perFile.length));
              });
            }));
          case 6:
            urls = _context.v;
            validUrls = urls.filter(Boolean);
            next = _toConsumableArray(new Set([].concat(_toConsumableArray(values), _toConsumableArray(validUrls)))).slice(0, limit);
            onChange === null || onChange === void 0 || onChange(next);
            updateHistory(validUrls.map(function (url, index) {
              var _candidates$index;
              return {
                url: url,
                type: mediaType,
                role: role,
                name: ((_candidates$index = candidates[index]) === null || _candidates$index === void 0 ? void 0 : _candidates$index.name) || label,
                createdAt: new Date().toISOString()
              };
            }));
            _context.n = 8;
            break;
          case 7:
            _context.p = 7;
            _t = _context.v;
            _reactHotToast["default"].error((0, _formatError.formatErrorMessage)(_t, "".concat(label, " upload failed")));
          case 8:
            _context.p = 8;
            setUploading(false);
            setProgress(0);
            if (inputRef.current) inputRef.current.value = "";
            return _context.f(8);
          case 9:
            return _context.a(2);
        }
      }, _callee, null, [[5, 7, 8, 9]]);
    }));
    return function uploadFiles(_x) {
      return _ref3.apply(this, arguments);
    };
  }();
  var removeAt = function removeAt(index) {
    onChange === null || onChange === void 0 || onChange(values.filter(function (_, itemIndex) {
      return itemIndex !== index;
    }));
  };
  var selectHistory = function selectHistory(item) {
    if (remaining <= 0) return;
    onChange === null || onChange === void 0 || onChange(_toConsumableArray(new Set([].concat(_toConsumableArray(values), [item.url]))).slice(0, limit));
    setHistoryOpen(false);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "relative flex min-w-[74px] flex-col gap-1.5 ".concat(className),
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex min-h-[62px] items-center gap-2",
      children: [values.map(function (url, index) {
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "group relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(Preview, {
            type: mediaType,
            url: url
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            "aria-label": "Remove ".concat(label),
            onClick: function onClick() {
              return removeAt(index);
            },
            className: "absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/75 text-[10px] text-white opacity-80 hover:opacity-100",
            children: "\xD7"
          })]
        }, "".concat(url, ":").concat(index));
      }), remaining > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        disabled: disabled || uploading,
        onClick: function onClick() {
          var _inputRef$current;
          return (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 ? void 0 : _inputRef$current.click();
        },
        onDragEnter: function onDragEnter(event) {
          event.preventDefault();
          event.stopPropagation();
          if (disabled || uploading) return;
          dragDepth.current += 1;
          setDragging(true);
        },
        onDragLeave: function onDragLeave(event) {
          event.preventDefault();
          event.stopPropagation();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        },
        onDragOver: function onDragOver(event) {
          event.preventDefault();
          event.stopPropagation();
        },
        onDrop: function onDrop(event) {
          var _event$dataTransfer;
          event.preventDefault();
          event.stopPropagation();
          dragDepth.current = 0;
          setDragging(false);
          void uploadFiles((_event$dataTransfer = event.dataTransfer) === null || _event$dataTransfer === void 0 ? void 0 : _event$dataTransfer.files);
        },
        className: "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed transition-all disabled:cursor-not-allowed disabled:opacity-50 ".concat(dragging ? "scale-105 border-[#22d3ee] bg-[#22d3ee]/15 ring-2 ring-[#22d3ee]/30" : "border-white/15 bg-white/[0.03] text-white/45 hover:border-[#22d3ee]/50 hover:text-[#22d3ee]"),
        title: "Upload ".concat(label),
        children: uploading ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex flex-col items-center text-[9px] font-bold text-[#22d3ee]",
          children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
            children: [progress, "%"]
          })
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "18",
          height: "18",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.2",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M12 5v14M5 12h14"
          })
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        ref: inputRef,
        className: "hidden",
        type: "file",
        accept: accepted,
        multiple: remaining > 1,
        onChange: function onChange(event) {
          return void uploadFiles(event.target.files);
        }
      }), showHistory && remaining > 0 && history.length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        type: "button",
        onClick: function onClick() {
          return setHistoryOpen(function (open) {
            return !open;
          });
        },
        className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/45 hover:text-white",
        title: "Choose previous ".concat(mediaType),
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M3 12a9 9 0 1 0 3-6.7L3 8"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M3 3v5h5M12 7v5l3 2"
          })]
        })
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center gap-1 text-[10px] font-semibold text-white/45",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        children: label
      }), (slot === null || slot === void 0 ? void 0 : slot.required) && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-[#22d3ee]",
        children: "*"
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
        className: "text-white/20",
        children: [values.length, "/", limit]
      })]
    }), historyOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "absolute bottom-[calc(100%+8px)] left-0 z-[80] w-72 rounded-2xl border border-white/10 bg-[#101014]/95 p-3 shadow-2xl backdrop-blur-xl",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "mb-2 text-[10px] font-black uppercase tracking-widest text-white/35",
        children: ["Recent ", mediaType, "s"]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid max-h-52 grid-cols-4 gap-2 overflow-y-auto",
        children: history.map(function (item) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: function onClick() {
              return selectHistory(item);
            },
            className: "h-14 overflow-hidden rounded-lg border border-white/10 bg-black/30 hover:border-[#22d3ee]/50",
            title: item.name || label,
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)(Preview, {
              type: mediaType,
              url: item.url
            })
          }, "".concat(item.url, ":").concat(item.createdAt));
        })
      })]
    })]
  });
}