"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ImageStudio;
var _react = require("react");
var _muapi = require("../muapi.js");
var _characterStore = require("../lib/characterStore");
var _DrawModal = _interopRequireDefault(require("./DrawModal.jsx"));
var _SocialPublishProvider = require("../../../../components/SocialPublishProvider");
var _AiAssistantProvider = require("../../../../components/AiAssistantProvider");
var _storyboardHandoff = require("../storyboardHandoff.js");
var _models = require("../models.js");
var _registry = _interopRequireDefault(require("../skills/registry.json"));
var _skillStore = require("../lib/skillStore");
var _promptRecipes = require("../lib/promptRecipes");
var _navigation = require("next/navigation");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
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
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // ─── helpers ────────────────────────────────────────────────────────────────
function downloadImage(_x, _x2) {
  return _downloadImage.apply(this, arguments);
} // ─── UploadButton (inline picker) ───────────────────────────────────────────
function _downloadImage() {
  _downloadImage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(url, filename) {
    var response, blob, blobUrl, a, _t6;
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
          _t6 = _context7.v;
          window.open(url, "_blank");
        case 4:
          return _context7.a(2);
      }
    }, _callee7, null, [[0, 3]]);
  }));
  return _downloadImage.apply(this, arguments);
}
function UploadButton(_ref) {
  var apiKey = _ref.apiKey,
    maxImages = _ref.maxImages,
    onSelect = _ref.onSelect,
    onClear = _ref.onClear,
    _ref$initialUrls = _ref.initialUrls,
    initialUrls = _ref$initialUrls === void 0 ? [] : _ref$initialUrls,
    _ref$label = _ref.label,
    label = _ref$label === void 0 ? null : _ref$label;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    panelOpen = _useState2[0],
    setPanelOpen = _useState2[1];
  var _useState3 = (0, _react.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    uploading = _useState4[0],
    setUploading = _useState4[1];
  var _useState5 = (0, _react.useState)([]),
    _useState6 = _slicedToArray(_useState5, 2),
    selectedEntries = _useState6[0],
    setSelectedEntries = _useState6[1]; // [{url, thumbnail}]
  var _useState7 = (0, _react.useState)([]),
    _useState8 = _slicedToArray(_useState7, 2),
    uploadHistory = _useState8[0],
    setUploadHistory = _useState8[1]; // [{id, name, url, thumbnail}]
  var _useState9 = (0, _react.useState)(0),
    _useState0 = _slicedToArray(_useState9, 2),
    lastUploadProgress = _useState0[0],
    setLastUploadProgress = _useState0[1];
  var fileInputRef = (0, _react.useRef)(null);
  var panelRef = (0, _react.useRef)(null);
  var triggerRef = (0, _react.useRef)(null);

  // Close on outside click
  (0, _react.useEffect)(function () {
    if (!panelOpen) return;
    var handler = function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) && triggerRef.current && !triggerRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [panelOpen]);

  // Sync initialUrls from parent (e.g. restored from localStorage)
  (0, _react.useEffect)(function () {
    if (initialUrls && initialUrls.length > 0) {
      // Avoid infinite loops by only updating if URLs actually changed
      var currentUrls = selectedEntries.map(function (e) {
        return e.url;
      });
      var isSame = initialUrls.length === currentUrls.length && initialUrls.every(function (u) {
        return currentUrls.includes(u);
      });
      if (isSame) return;
      var newEntries = initialUrls.map(function (url) {
        return {
          url: url
        };
      });
      setSelectedEntries(newEntries);

      // Also ensure they are in the history panel
      setUploadHistory(function (prev) {
        var existingUrls = prev.map(function (h) {
          return h.url;
        });
        var missing = initialUrls.filter(function (u) {
          return !existingUrls.includes(u);
        }).map(function (u) {
          return {
            id: "restored-".concat(u),
            name: "Restored Image",
            url: u,
            progress: 100
          };
        });
        return [].concat(_toConsumableArray(missing), _toConsumableArray(prev));
      });
    }
  }, [initialUrls]); // eslint-disable-line react-hooks/exhaustive-deps

  // When maxImages changes, trim excess selections
  (0, _react.useEffect)(function () {
    if (selectedEntries.length > maxImages) {
      var trimmed = selectedEntries.slice(0, maxImages);
      setSelectedEntries(trimmed);
      if (trimmed.length === 0) onClear === null || onClear === void 0 || onClear();
    }
    if (fileInputRef.current) {
      fileInputRef.current.multiple = maxImages > 1;
    }
  }, [maxImages]); // eslint-disable-line react-hooks/exhaustive-deps

  var fireOnSelect = (0, _react.useCallback)(function (entries) {
    if (!entries.length) return;
    var urls = entries.map(function (e) {
      return e.url;
    });
    onSelect({
      url: urls[0],
      urls: urls,
      thumbnail: entries[0].url
    });
  }, [onSelect]);
  var handleFileChange = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(e) {
      var files, MAX_IMAGE_SIZE, tooLarge, toUpload, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            files = Array.from(e.target.files);
            if (files.length) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            e.target.value = "";
            MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
            tooLarge = files.filter(function (f) {
              return f.size > MAX_IMAGE_SIZE;
            });
            if (!(tooLarge.length > 0)) {
              _context2.n = 2;
              break;
            }
            alert("The following images are too large (max 10MB): ".concat(tooLarge.map(function (f) {
              return f.name;
            }).join(", ")));
            return _context2.a(2);
          case 2:
            setUploading(true);
            _context2.p = 3;
            toUpload = maxImages === 1 ? files.slice(0, 1) : files.slice(0, maxImages - selectedEntries.length || 1);
            _context2.n = 4;
            return Promise.all(toUpload.map(/*#__PURE__*/function () {
              var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(file) {
                var id, placeholder, uploadedUrl, newEntry, _t;
                return _regenerator().w(function (_context) {
                  while (1) switch (_context.p = _context.n) {
                    case 0:
                      id = Date.now().toString() + Math.random(); // Add a placeholder to history immediately without local preview
                      placeholder = {
                        id: id,
                        name: file.name,
                        url: null,
                        progress: 0
                      };
                      setUploadHistory(function (prev) {
                        return [placeholder].concat(_toConsumableArray(prev));
                      });
                      _context.p = 1;
                      _context.n = 2;
                      return (0, _muapi.uploadFile)(apiKey, file, function (pct) {
                        setLastUploadProgress(pct);
                        setUploadHistory(function (prev) {
                          return prev.map(function (h) {
                            return h.id === id ? _objectSpread(_objectSpread({}, h), {}, {
                              progress: pct
                            }) : h;
                          });
                        });
                      });
                    case 2:
                      uploadedUrl = _context.v;
                      // Update history with real URL and Mark as 100%
                      setUploadHistory(function (prev) {
                        return prev.map(function (h) {
                          if (h.id === id) {
                            return _objectSpread(_objectSpread({}, h), {}, {
                              url: uploadedUrl,
                              progress: 100
                            });
                          }
                          return h;
                        });
                      });

                      // Auto-select if there's room
                      if (selectedEntries.length < maxImages) {
                        newEntry = {
                          url: uploadedUrl
                        };
                        setSelectedEntries(function (prev) {
                          return [].concat(_toConsumableArray(prev), [newEntry]);
                        });
                        if (maxImages === 1) {
                          fireOnSelect([newEntry]);
                          setPanelOpen(false);
                        }
                      }
                      _context.n = 4;
                      break;
                    case 3:
                      _context.p = 3;
                      _t = _context.v;
                      console.error("[UploadButton] Upload failed for", file.name, _t);
                      setUploadHistory(function (prev) {
                        return prev.filter(function (h) {
                          return h.id !== id;
                        });
                      });
                      throw _t;
                    case 4:
                      return _context.a(2);
                  }
                }, _callee, null, [[1, 3]]);
              }));
              return function (_x4) {
                return _ref3.apply(this, arguments);
              };
            }()));
          case 4:
            _context2.n = 6;
            break;
          case 5:
            _context2.p = 5;
            _t2 = _context2.v;
            alert("Image upload failed: ".concat(_t2.message));
          case 6:
            _context2.p = 6;
            setUploading(false);
            setLastUploadProgress(0);
            return _context2.f(6);
          case 7:
            return _context2.a(2);
        }
      }, _callee2, null, [[3, 5, 6, 7]]);
    }));
    return function handleFileChange(_x3) {
      return _ref2.apply(this, arguments);
    };
  }();
  var handleCellClick = function handleCellClick(entry) {
    var selIdx = selectedEntries.findIndex(function (e) {
      return e.url === entry.url;
    });
    var isSelected = selIdx !== -1;
    var atMax = maxImages > 1 && !isSelected && selectedEntries.length >= maxImages;
    if (atMax) return;
    if (maxImages === 1) {
      var newSelected = [{
        url: entry.url,
        localUrl: entry.localUrl
      }];
      setSelectedEntries(newSelected);
      fireOnSelect(newSelected);
      setPanelOpen(false);
    } else {
      var next;
      if (isSelected) {
        next = selectedEntries.filter(function (_, i) {
          return i !== selIdx;
        });
        if (next.length === 0) onClear === null || onClear === void 0 || onClear();
      } else {
        next = [].concat(_toConsumableArray(selectedEntries), [{
          url: entry.url,
          localUrl: entry.localUrl
        }]);
      }
      setSelectedEntries(next);
    }
  };
  var handleRemoveFromHistory = function handleRemoveFromHistory(e, entry) {
    e.stopPropagation();
    if (entry.localUrl) URL.revokeObjectURL(entry.localUrl);
    setUploadHistory(function (prev) {
      return prev.filter(function (h) {
        return h.id !== entry.id;
      });
    });
    var next = selectedEntries.filter(function (s) {
      return s.url !== entry.url;
    });
    if (next.length !== selectedEntries.length) {
      setSelectedEntries(next);
      if (next.length === 0) onClear === null || onClear === void 0 || onClear();
    }
  };
  var handleDone = function handleDone(e) {
    e.stopPropagation();
    fireOnSelect(selectedEntries);
    setPanelOpen(false);
  };
  var reset = function reset() {
    setSelectedEntries([]);
    setPanelOpen(false);
  };

  // expose reset via ref pattern — parent calls reset() directly
  // (handled by parent through uploadedImageUrls state reset)

  var isMulti = maxImages > 1;
  var count = selectedEntries.length;
  var hasSelection = count > 0;

  // Trigger icon content
  var triggerContent = uploading ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
        strokeDashoffset: 88 - 88 * lastUploadProgress / 100,
        className: "text-[#22d3ee] transition-all duration-300"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
      className: "absolute text-[9px] font-black text-[#22d3ee] leading-none",
      children: [lastUploadProgress, "%"]
    })]
  }) : label === "Swap Face" ? hasSelection ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
    src: selectedEntries[0].url,
    alt: "",
    className: "w-full h-full object-cover"
  }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
    className: "text-[10px] font-bold text-white/50",
    children: "Face"
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
  });
  var defaultLabel = isMulti ? "Add up to ".concat(maxImages, " images") : "Reference image";
  var triggerTitle = hasSelection ? count > 1 ? "".concat(count, " of ").concat(maxImages, " images selected \u2014 click to manage") : isMulti ? "1 image selected \u2014 click to add more (up to ".concat(maxImages, ")") : label || "Reference image" : label || defaultLabel;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "relative",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      ref: fileInputRef,
      type: "file",
      accept: "image/*",
      multiple: isMulti,
      className: "hidden",
      onChange: handleFileChange
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      ref: triggerRef,
      type: "button",
      title: triggerTitle,
      onClick: function onClick(e) {
        e.stopPropagation();
        setPanelOpen(function (o) {
          return !o;
        });
      },
      className: "w-12 h-12 shrink-0 rounded-xl border border-dashed transition-all flex items-center justify-center relative overflow-hidden bg-white/[0.02] hover:bg-white/5 group ".concat(hasSelection ? "border-[#22d3ee]/40 hover:border-[#22d3ee]/60" : "border-white/10 hover:border-[#22d3ee]/40"),
      children: triggerContent
    }), panelOpen && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      ref: panelRef,
      onClick: function onClick(e) {
        return e.stopPropagation();
      },
      className: "absolute z-50 bottom-[calc(100%+8px)] left-0 bg-[#111] rounded-xl p-3 shadow-4xl border border-white/10 w-96",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/5",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col gap-0.5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-xs font-bold text-secondary",
            children: "Reference Images"
          }), isMulti && /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
            className: "text-[9px] text-muted",
            children: ["Select up to ", maxImages, " images"]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [isMulti && hasSelection && /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            type: "button",
            onClick: handleDone,
            className: "flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105",
            children: ["\u2713 Done (", count, ")"]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            type: "button",
            onClick: function onClick(e) {
              var _fileInputRef$current;
              e.stopPropagation();
              setPanelOpen(false);
              (_fileInputRef$current = fileInputRef.current) === null || _fileInputRef$current === void 0 || _fileInputRef$current.click();
            },
            className: "flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition-all border border-primary/20",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "11",
              height: "11",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "3",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                points: "17 8 12 3 7 8"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
                x1: "12",
                y1: "3",
                x2: "12",
                y2: "15"
              })]
            }), isMulti ? "Upload files" : "Upload new"]
          })]
        })]
      }), uploadHistory.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "py-6 flex flex-col items-center gap-2 opacity-40",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
          width: "28",
          height: "28",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.5",
          className: "text-secondary",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
            points: "17 8 12 3 7 8"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("line", {
            x1: "12",
            y1: "3",
            x2: "12",
            y2: "15"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-xs text-secondary",
          children: "No uploads yet"
        })]
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5",
        children: uploadHistory.map(function (entry) {
          var selIdx = selectedEntries.findIndex(function (e) {
            return e.url === entry.url;
          });
          var isSelected = selIdx !== -1;
          var atMax = isMulti && !isSelected && selectedEntries.length >= maxImages;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            title: entry.name,
            onClick: function onClick() {
              return entry.url && handleCellClick(entry);
            },
            className: "relative rounded-xl overflow-hidden border-2 cursor-pointer group/cell aspect-square transition-all ".concat(isSelected ? "border-primary shadow-glow" : "border-white/10 hover:border-white/30", " ").concat(atMax ? "opacity-40 cursor-not-allowed" : "", " ").concat(!entry.url ? "cursor-wait" : ""),
            children: [entry.url ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: entry.url,
              alt: entry.name,
              className: "w-full h-full object-cover"
            }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "w-full h-full bg-white/5 flex flex-col items-center justify-center",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-1"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "text-[10px] font-black text-primary",
                children: [entry.progress, "%"]
              })]
            }), entry.url && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute inset-0 bg-black/60 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-end justify-end p-1",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                title: "Remove from history",
                onClick: function onClick(e) {
                  return handleRemoveFromHistory(e, entry);
                },
                className: "w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-md flex items-center justify-center transition-colors",
                children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                  width: "8",
                  height: "8",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "white",
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
                })
              })
            }), isSelected && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "absolute top-1 left-1 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1",
              children: isMulti ? /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] font-black text-black",
                children: selIdx + 1
              }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                width: "9",
                height: "9",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "black",
                strokeWidth: "4",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                  points: "20 6 9 17 4 12"
                })
              })
            })]
          }, entry.id);
        })
      }), isMulti && hasSelection && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "mt-3 pt-3 border-t border-white/5 flex items-center justify-between",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
          className: "text-xs text-secondary",
          children: [count, " of ", maxImages, " selected"]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "button",
          onClick: handleDone,
          className: "px-4 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105",
          children: "Use Selected"
        })]
      })]
    })]
  });
}

// ─── ModelDropdown ────────────────────────────────────────────────────────────

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
function ModelDropdown(_ref4) {
  var _availableProviders$f;
  var models = _ref4.models,
    selectedModel = _ref4.selectedModel,
    onSelect = _ref4.onSelect,
    onClose = _ref4.onClose;
  var _useState1 = (0, _react.useState)(""),
    _useState10 = _slicedToArray(_useState1, 2),
    search = _useState10[0],
    setSearch = _useState10[1];
  var _useState11 = (0, _react.useState)("all"),
    _useState12 = _slicedToArray(_useState11, 2),
    selectedProvider = _useState12[0],
    setSelectedProvider = _useState12[1];
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

  // Dynamically compute list of providers from the input models list
  var availableProviders = [];
  var seenProviders = new Set();
  models.forEach(function (m) {
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
  var filtered = models.filter(function (m) {
    // 1. Filter by provider tab
    if (selectedProvider !== "all") {
      var pId = m.provider || 'muapi';
      if (pId !== selectedProvider) return false;
    }
    // 2. Filter by search query
    var query = search.toLowerCase();
    return m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query);
  });
  var invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex gap-4 h-full max-h-[60vh] min-h-[350px] overflow-x-hidden",
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
        className: "border-b border-white/5 shrink-0 pb-2",
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
            onClick: function onClick(e) {
              return e.stopPropagation();
            },
            onChange: function onChange(e) {
              return setSearch(e.target.value);
            },
            className: "bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 focus:outline-none"
          })]
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "text-xs font-semibold text-secondary py-1 shrink-0 flex items-center justify-between",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          children: "Available models"
        }), selectedProvider !== "all" && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60",
          children: ((_availableProviders$f = availableProviders.find(function (p) {
            return p.id === selectedProvider;
          })) === null || _availableProviders$f === void 0 ? void 0 : _availableProviders$f.name) || selectedProvider
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1",
        children: filtered.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "text-xs text-white/30 text-center py-6",
          children: "No models found"
        }) : filtered.map(function (m) {
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            onClick: function onClick(e) {
              e.stopPropagation();
              onSelect(m);
              onClose();
            },
            className: "flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 ".concat(selectedModel === m.id ? "bg-white/5 border-white/5" : ""),
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center gap-3",
              children: [PROVIDER_LOGOS[m.provider] ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-8 h-8 rounded-full border border-white/5 overflow-hidden shrink-0 flex items-center justify-center bg-white/[0.02]",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                  src: PROVIDER_LOGOS[m.provider],
                  alt: m.provider_name,
                  className: "w-full h-full object-contain p-1 ".concat(invertLogos.includes(m.provider) ? "invert" : "")
                })
              }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-8.5 h-8.5 ".concat(m.family === "kontext" ? "bg-blue-500/10 text-blue-400 border-blue-500/10" : m.family === "effects" ? "bg-purple-500/10 text-purple-400 border-purple-500/10" : "bg-primary/10 text-primary border-primary/10", " border rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase"),
                children: m.name.charAt(0)
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex flex-col gap-0.5 min-w-0",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-bold text-white tracking-tight truncate",
                  children: m.name
                }), selectedProvider === "all" && m.provider_name && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[9px] text-white/40",
                  children: m.provider_name
                })]
              })]
            }), selectedModel === m.id && /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "#22d3ee",
              strokeWidth: "4",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                points: "20 6 9 17 4 12"
              })
            })]
          }, m.id);
        })
      })]
    })]
  });
}

// ─── SimpleDropdown ───────────────────────────────────────────────────────────

function SimpleDropdown(_ref5) {
  var title = _ref5.title,
    options = _ref5.options,
    selected = _ref5.selected,
    onSelect = _ref5.onSelect,
    onClose = _ref5.onClose;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "text-xs font-semibold text-white/30 uppercase tracking-wider pb-2 border-b border-white/[0.05] mb-2 px-1",
      children: title
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex flex-col gap-1",
      children: options.map(function (opt) {
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          onClick: function onClick(e) {
            e.stopPropagation();
            onSelect(opt);
            onClose();
          },
          className: "flex items-center justify-between p-2.5 px-3 hover:bg-[#22d3ee]/10 hover:text-white rounded-xl cursor-pointer transition-all group",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
            children: opt
          }), selected === opt && /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "#22d3ee",
            strokeWidth: "4.5",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
              points: "20 6 9 17 4 12"
            })
          })]
        }, opt);
      })
    })]
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

function ImageStudio(_ref6) {
  var _t2iModels$0$inputs, _getI2IModelById;
  var apiKey = _ref6.apiKey,
    onGenerationComplete = _ref6.onGenerationComplete,
    onGenerationError = _ref6.onGenerationError,
    historyItems = _ref6.historyItems,
    droppedFiles = _ref6.droppedFiles,
    onFilesHandled = _ref6.onFilesHandled;
  var PERSIST_KEY = "hg_image_studio_persistent";
  var router = (0, _navigation.useRouter)();

  // ── Model / mode state ──────────────────────────────────────────────────
  var _useState13 = (0, _react.useState)(false),
    _useState14 = _slicedToArray(_useState13, 2),
    imageMode = _useState14[0],
    setImageMode = _useState14[1]; // false=t2i, true=i2i
  var _useState15 = (0, _react.useState)(_models.t2iModels[0].id),
    _useState16 = _slicedToArray(_useState15, 2),
    selectedModelId = _useState16[0],
    setSelectedModelId = _useState16[1];
  var _useState17 = (0, _react.useState)(_models.t2iModels[0].name),
    _useState18 = _slicedToArray(_useState17, 2),
    selectedModelName = _useState18[0],
    setSelectedModelName = _useState18[1];
  var _useState19 = (0, _react.useState)(((_t2iModels$0$inputs = _models.t2iModels[0].inputs) === null || _t2iModels$0$inputs === void 0 || (_t2iModels$0$inputs = _t2iModels$0$inputs.aspect_ratio) === null || _t2iModels$0$inputs === void 0 ? void 0 : _t2iModels$0$inputs["default"]) || "1:1"),
    _useState20 = _slicedToArray(_useState19, 2),
    selectedAr = _useState20[0],
    setSelectedAr = _useState20[1];
  var _useState21 = (0, _react.useState)(function () {
      var resolutions = (0, _models.getResolutionsForModel)(_models.t2iModels[0].id);
      return resolutions[0] || null;
    }),
    _useState22 = _slicedToArray(_useState21, 2),
    selectedQuality = _useState22[0],
    setSelectedQuality = _useState22[1];
  var _useState23 = (0, _react.useState)(""),
    _useState24 = _slicedToArray(_useState23, 2),
    selectedEffect = _useState24[0],
    setSelectedEffect = _useState24[1];
  var _useState25 = (0, _react.useState)(1),
    _useState26 = _slicedToArray(_useState25, 2),
    maxImages = _useState26[0],
    setMaxImages = _useState26[1];

  // ── Prompt / upload state ───────────────────────────────────────────────
  var _useState27 = (0, _react.useState)(""),
    _useState28 = _slicedToArray(_useState27, 2),
    prompt = _useState28[0],
    setPrompt = _useState28[1];
  var _useState29 = (0, _react.useState)([]),
    _useState30 = _slicedToArray(_useState29, 2),
    uploadedImageUrls = _useState30[0],
    setUploadedImageUrls = _useState30[1];
  var _useState31 = (0, _react.useState)(null),
    _useState32 = _slicedToArray(_useState31, 2),
    swapImageUrl = _useState32[0],
    setSwapImageUrl = _useState32[1];

  // ── Wave 1 recipe-driven state ───────────────────────────────────────────
  var _useState33 = (0, _react.useState)(null),
    _useState34 = _slicedToArray(_useState33, 2),
    selectedResolution = _useState34[0],
    setSelectedResolution = _useState34[1];
  var _useState35 = (0, _react.useState)(false),
    _useState36 = _slicedToArray(_useState35, 2),
    grokEditMode = _useState36[0],
    setGrokEditMode = _useState36[1];
  var _useState37 = (0, _react.useState)(""),
    _useState38 = _slicedToArray(_useState37, 2),
    grokRequestId = _useState38[0],
    setGrokRequestId = _useState38[1];
  var _useState39 = (0, _react.useState)(""),
    _useState40 = _slicedToArray(_useState39, 2),
    grokMask = _useState40[0],
    setGrokMask = _useState40[1];
  var _useState41 = (0, _react.useState)(null),
    _useState42 = _slicedToArray(_useState41, 2),
    characterSheetUrl = _useState42[0],
    setCharacterSheetUrl = _useState42[1];

  // ── UI state ────────────────────────────────────────────────────────────
  var _useState43 = (0, _react.useState)(null),
    _useState44 = _slicedToArray(_useState43, 2),
    dropdownOpen = _useState44[0],
    setDropdownOpen = _useState44[1]; // 'model' | 'ar' | 'quality' | null
  var _useState45 = (0, _react.useState)(false),
    _useState46 = _slicedToArray(_useState45, 2),
    generating = _useState46[0],
    setGenerating = _useState46[1];
  var _useState47 = (0, _react.useState)(null),
    _useState48 = _slicedToArray(_useState47, 2),
    generateError = _useState48[0],
    setGenerateError = _useState48[1];
  var _useState49 = (0, _react.useState)(null),
    _useState50 = _slicedToArray(_useState49, 2),
    fullscreenUrl = _useState50[0],
    setFullscreenUrl = _useState50[1];
  var _useState51 = (0, _react.useState)(false),
    _useState52 = _slicedToArray(_useState51, 2),
    isDrawModalOpen = _useState52[0],
    setIsDrawModalOpen = _useState52[1];

  // ── Canvas / history state ──────────────────────────────────────────────
  var _useState53 = (0, _react.useState)(null),
    _useState54 = _slicedToArray(_useState53, 2),
    currentImageUrl = _useState54[0],
    setCurrentImageUrl = _useState54[1];
  var _useState55 = (0, _react.useState)(0),
    _useState56 = _slicedToArray(_useState55, 2),
    activeHistoryIdx = _useState56[0],
    setActiveHistoryIdx = _useState56[1];
  var _useState57 = (0, _react.useState)(1),
    _useState58 = _slicedToArray(_useState57, 2),
    batchSize = _useState58[0],
    setBatchSize = _useState58[1];
  var _useState59 = (0, _react.useState)([]),
    _useState60 = _slicedToArray(_useState59, 2),
    localHistory = _useState60[0],
    setLocalHistory = _useState60[1]; // [{id,url,prompt,model,aspect_ratio,timestamp}]

  // Use prop history if provided, otherwise local
  var history = historyItems !== null && historyItems !== void 0 ? historyItems : localHistory;

  // ── Refs ────────────────────────────────────────────────────────────────
  var textareaRef = (0, _react.useRef)(null);
  var dropdownRef = (0, _react.useRef)(null);
  var uploadPickerResetRef = (0, _react.useRef)(null); // not used directly — managed via key

  // ── Close dropdown on outside click ─────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (!dropdownOpen) return;
    var handler = function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(null);
      }
    };
    window.addEventListener("click", handler);
    return function () {
      return window.removeEventListener("click", handler);
    };
  }, [dropdownOpen]);

  // ── Apply cross-studio handoff from GO-Viral / Storyboard ──────────────────
  var handoffApplied = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    try {
      var handoff = (0, _storyboardHandoff.readStoryboardHandoff)("image");
      if (!handoff || handoffApplied.current === handoff.createdAt) return;
      handoffApplied.current = handoff.createdAt;
      if (handoff.combinedPrompt || handoff.projectName) {
        setPrompt(handoff.combinedPrompt || handoff.projectName);
      }
      var ref = handoff.firstFrameUrl || handoff.referenceImageUrl;
      if (ref) {
        setUploadedImageUrls(function (prev) {
          return prev.includes(ref) ? prev : [].concat(_toConsumableArray(prev), [ref]);
        });
        setSwapImageUrl(ref);
        setImageMode(true);
      }
      if (handoff.aspectRatio) {
        setSelectedAr(handoff.aspectRatio);
      }
    } catch (error) {/* silent */}
  }, []);

  // ── Persistence: Load ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    try {
      var stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        var data = JSON.parse(stored);
        if (data.imageMode !== undefined) setImageMode(data.imageMode);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.selectedModelName) setSelectedModelName(data.selectedModelName);
        if (data.selectedAr) setSelectedAr(data.selectedAr);
        if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
        if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
        if (data.maxImages) setMaxImages(data.maxImages);
        if (data.prompt) setPrompt(data.prompt);
        if (data.uploadedImageUrls) setUploadedImageUrls(data.uploadedImageUrls);
        if (data.batchSize) setBatchSize(data.batchSize);
        if (data.localHistory) setLocalHistory(data.localHistory);
      }
    } catch (err) {
      console.warn("Failed to load ImageStudio persistence:", err);
    }
  }, []);

  // ── Adjust height on load ────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      handleTextareaInput();
    }, 150);
    return function () {
      return clearTimeout(timer);
    };
  }, []);

  // ── Apply pending Skills recipe (set by SkillsBrowser) ────────────────────
  (0, _react.useEffect)(function () {
    var pending = (0, _skillStore.getPendingRecipe)("image");
    if (!pending) return;
    var skill = _registry["default"].skills.find(function (s) {
      return s.slug === pending;
    });
    (0, _skillStore.clearPendingRecipe)("image");
    if (!skill) return;
    applyRecipe(skill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    var timer = setTimeout(function () {
      try {
        var state = {
          imageMode: imageMode,
          selectedModelId: selectedModelId,
          selectedModelName: selectedModelName,
          selectedAr: selectedAr,
          selectedQuality: selectedQuality,
          selectedEffect: selectedEffect,
          maxImages: maxImages,
          prompt: prompt,
          uploadedImageUrls: uploadedImageUrls,
          batchSize: batchSize,
          localHistory: localHistory
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save ImageStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return function () {
      return clearTimeout(timer);
    };
  }, [imageMode, selectedModelId, selectedModelName, selectedAr, selectedQuality, selectedEffect, maxImages, prompt, uploadedImageUrls, batchSize, localHistory]);
  var processDroppedImages = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(files) {
      var MAX_IMAGE_SIZE, tooLarge, toUpload, urls, _t4;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
            tooLarge = files.filter(function (f) {
              return f.size > MAX_IMAGE_SIZE;
            });
            if (!(tooLarge.length > 0)) {
              _context4.n = 1;
              break;
            }
            alert("The following images are too large (max 10MB): ".concat(tooLarge.map(function (f) {
              return f.name;
            }).join(", ")));
            return _context4.a(2);
          case 1:
            setGenerating(true); // Show as generating/busy
            _context4.p = 2;
            toUpload = maxImages === 1 ? files.slice(0, 1) : files.slice(0, maxImages);
            _context4.n = 3;
            return Promise.all(toUpload.map(/*#__PURE__*/function () {
              var _ref8 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(file) {
                var _t3;
                return _regenerator().w(function (_context3) {
                  while (1) switch (_context3.p = _context3.n) {
                    case 0:
                      _context3.p = 0;
                      _context3.n = 1;
                      return (0, _muapi.uploadFile)(apiKey, file);
                    case 1:
                      return _context3.a(2, _context3.v);
                    case 2:
                      _context3.p = 2;
                      _t3 = _context3.v;
                      console.error("[ImageStudio] Drop upload failed for", file.name, _t3);
                      throw _t3;
                    case 3:
                      return _context3.a(2);
                  }
                }, _callee3, null, [[0, 2]]);
              }));
              return function (_x6) {
                return _ref8.apply(this, arguments);
              };
            }()));
          case 3:
            urls = _context4.v;
            handleUploadSelect({
              urls: urls
            });
            _context4.n = 5;
            break;
          case 4:
            _context4.p = 4;
            _t4 = _context4.v;
            alert("Image upload failed: ".concat(_t4.message));
          case 5:
            _context4.p = 5;
            setGenerating(false);
            return _context4.f(5);
          case 6:
            return _context4.a(2);
        }
      }, _callee4, null, [[2, 4, 5, 6]]);
    }));
    return function processDroppedImages(_x5) {
      return _ref7.apply(this, arguments);
    };
  }();

  // ── Handle Dropped Files ────────────────────────────────────────────────
  (0, _react.useEffect)(function () {
    if (droppedFiles && droppedFiles.length > 0) {
      var imageFiles = droppedFiles.filter(function (f) {
        return f.type.startsWith('image/');
      });
      if (imageFiles.length > 0) {
        processDroppedImages(imageFiles);
      }
      onFilesHandled === null || onFilesHandled === void 0 || onFilesHandled();
    }
  }, [droppedFiles, onFilesHandled, processDroppedImages]);

  // ── Derived: current model lists & helpers ───────────────────────────────
  var currentModels = imageMode ? _models.i2iModels : _models.t2iModels;
  var currentAspectRatios = imageMode ? (0, _models.getAspectRatiosForI2IModel)(selectedModelId) : (0, _models.getAspectRatiosForModel)(selectedModelId);
  var currentResolutions = imageMode ? (0, _models.getResolutionsForI2IModel)(selectedModelId) : (0, _models.getResolutionsForModel)(selectedModelId);
  var currentQualityField = imageMode ? (0, _models.getQualityFieldForI2IModel)(selectedModelId) : (0, _models.getQualityFieldForModel)(selectedModelId);
  var showQualityBtn = currentResolutions.length > 0;
  var currentEffects = imageMode ? (0, _models.getEffectsForI2IModel)(selectedModelId) : [];
  var showEffectBtn = currentEffects.length > 0;

  // ── Textarea auto-resize ─────────────────────────────────────────────────
  var handleTextareaInput = function handleTextareaInput() {
    var el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    var maxHeight = window.innerWidth < 768 ? 150 : 250;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  // ── Upload picker callbacks ──────────────────────────────────────────────
  var handleUploadSelect = (0, _react.useCallback)(function (_ref9) {
    var url = _ref9.url,
      urls = _ref9.urls;
    var newUrls = urls || [url];
    setUploadedImageUrls(newUrls);
    if (!imageMode) {
      var firstI2I = _models.i2iModels[0];
      var ars = (0, _models.getAspectRatiosForI2IModel)(firstI2I.id);
      var resolutions = (0, _models.getResolutionsForI2IModel)(firstI2I.id);
      var effects = (0, _models.getEffectsForI2IModel)(firstI2I.id);
      setImageMode(true);
      setSelectedModelId(firstI2I.id);
      setSelectedModelName(firstI2I.name);
      setSelectedAr(ars[0] || "1:1");
      setSelectedQuality(resolutions[0] || null);
      setSelectedEffect(effects.length > 0 ? (0, _models.getDefaultEffectForI2IModel)(firstI2I.id) || effects[0] : "");
      setMaxImages((0, _models.getMaxImagesForI2IModel)(firstI2I.id));
    }
  }, [imageMode]);
  var handleUploadClear = (0, _react.useCallback)(function () {
    setUploadedImageUrls([]);
    setImageMode(false);
    var firstT2I = _models.t2iModels[0];
    var ars = (0, _models.getAspectRatiosForModel)(firstT2I.id);
    var resolutions = (0, _models.getResolutionsForModel)(firstT2I.id);
    setSelectedModelId(firstT2I.id);
    setSelectedModelName(firstT2I.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setSelectedEffect("");
    setMaxImages(1);
  }, []);

  // ── Model selection ──────────────────────────────────────────────────────
  var handleModelSelect = function handleModelSelect(m) {
    var ars = imageMode ? (0, _models.getAspectRatiosForI2IModel)(m.id) : (0, _models.getAspectRatiosForModel)(m.id);
    var resolutions = imageMode ? (0, _models.getResolutionsForI2IModel)(m.id) : (0, _models.getResolutionsForModel)(m.id);
    setSelectedModelId(m.id);
    setSelectedModelName(m.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setSwapImageUrl(null);
    if (imageMode) {
      setMaxImages((0, _models.getMaxImagesForI2IModel)(m.id));
      var effects = (0, _models.getEffectsForI2IModel)(m.id);
      setSelectedEffect(effects.length > 0 ? (0, _models.getDefaultEffectForI2IModel)(m.id) || effects[0] : "");
    } else {
      setSelectedEffect("");
    }
  };

  // ── History helpers ──────────────────────────────────────────────────────
  var addToHistory = (0, _react.useCallback)(function (entry) {
    if (!historyItems) {
      setLocalHistory(function (prev) {
        return [entry].concat(_toConsumableArray(prev.slice(0, 49)));
      });
    }
    setActiveHistoryIdx(0);
    setCurrentImageUrl(entry.url);
  }, [historyItems]);

  // ── View state ─────────────────────────────────────

  var resetToPrompt = function resetToPrompt() {
    setCurrentImageUrl(null);
    setPrompt("");
    setUploadedImageUrls([]);
    setImageMode(false);
    var firstT2I = _models.t2iModels[0];
    var ars = (0, _models.getAspectRatiosForModel)(firstT2I.id);
    var resolutions = (0, _models.getResolutionsForModel)(firstT2I.id);
    setSelectedModelId(firstT2I.id);
    setSelectedModelName(firstT2I.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setSelectedEffect("");
    setMaxImages(1);
  };

  // ── Apply a skill recipe to the form ─────────────────────────────────────
  function applyRecipe(skill) {
    var step0 = skill.steps && skill.steps[0];
    if (!step0) {
      if (skill.description) setPrompt(skill.description);
      return;
    }
    var modelId = step0.endpoint || step0.model;
    var allModels = [].concat(_toConsumableArray(_models.t2iModels), _toConsumableArray(_models.i2iModels));
    var model = allModels.find(function (m) {
      return m.id === modelId;
    });
    var wantsI2I = _models.i2iModels.some(function (m) {
      return m.id === modelId;
    }) || step0.type === "i2v" || step0.type === "edit" || step0.references && step0.references.length > 0;
    if (model) {
      setImageMode(!!wantsI2I);
      setSelectedModelId(model.id);
      setSelectedModelName(model.name);
    }
    if (step0.aspectRatio) setSelectedAr(step0.aspectRatio);
    var vals = {};
    (skill.inputs || []).forEach(function (i) {
      vals[i.name] = "";
    });
    setPrompt((0, _promptRecipes.fillTemplate)(step0.prompt || skill.description || "", vals));
    var flags = step0.flags || {};
    if (step0.rate !== undefined) {/* noop */}

    // Resolution: prefer mapping onto the quality enum, else a custom field.
    if (step0.resolution) {
      var resList = imageMode ? (0, _models.getResolutionsForI2IModel)(selectedModelId) : (0, _models.getResolutionsForModel)(selectedModelId);
      if (resList.includes(step0.resolution)) {
        setSelectedQuality(step0.resolution);
      } else {
        setSelectedResolution(step0.resolution);
      }
    }

    // Grok edit mode → surface request_id / mask inputs.
    if (flags.grokEdit) setGrokEditMode(true);

    // Dev mode → flux-3-dev model.
    if (flags.devMode) {
      var dev = allModels.find(function (m) {
        return m.id === "flux-3-dev";
      });
      if (dev) {
        setImageMode(false);
        setSelectedModelId(dev.id);
        setSelectedModelName(dev.name);
        var ars = (0, _models.getAspectRatiosForModel)(dev.id);
        var res = (0, _models.getResolutionsForModel)(dev.id);
        setSelectedAr(ars[0] || "1:1");
        setSelectedQuality(res[0] || null);
      }
    }

    // References (string refs or {url, role} objects).
    var refs = step0.references || [];
    var imageRefs = [];
    refs.forEach(function (ref) {
      var url = typeof ref === "string" ? ref : ref.url;
      var role = typeof ref === "string" ? null : ref.role || null;
      if (!url) return;
      if (role === "character_sheet") {
        (0, _characterStore.setCharacterSheet)("image", url);
        setCharacterSheetUrl(url);
        return;
      }
      imageRefs.push(url);
    });
    if (imageRefs.length > 0) {
      setImageMode(true);
      setUploadedImageUrls(imageRefs);
    }
  }

  // ── Generation ───────────────────────────────────────────────────────────
  var handleGenerate = /*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
      var modelInfo, results, _e$message, _t5;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.p = _context6.n) {
          case 0:
            if (!generating) {
              _context6.n = 1;
              break;
            }
            return _context6.a(2);
          case 1:
            if (!imageMode) {
              _context6.n = 4;
              break;
            }
            if (!(uploadedImageUrls.length === 0)) {
              _context6.n = 2;
              break;
            }
            alert("Please upload a reference image first.");
            return _context6.a(2);
          case 2:
            modelInfo = (0, _models.getI2IModelById)(selectedModelId);
            if (!(modelInfo !== null && modelInfo !== void 0 && modelInfo.swapField && !swapImageUrl)) {
              _context6.n = 3;
              break;
            }
            alert("Please upload a swap face image.");
            return _context6.a(2);
          case 3:
            _context6.n = 5;
            break;
          case 4:
            if (prompt.trim()) {
              _context6.n = 5;
              break;
            }
            alert("Please enter a prompt to generate an image.");
            return _context6.a(2);
          case 5:
            setGenerating(true);
            setGenerateError(null);
            _context6.p = 6;
            _context6.n = 7;
            return Promise.all(Array.from({
              length: batchSize
            }).map(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
              var genParams, _genParams, _genParams2;
              return _regenerator().w(function (_context5) {
                while (1) switch (_context5.n) {
                  case 0:
                    if (!grokEditMode) {
                      _context5.n = 2;
                      break;
                    }
                    genParams = {
                      request_id: grokRequestId,
                      mask: grokMask || undefined,
                      prompt: prompt.trim(),
                      aspect_ratio: selectedAr
                    };
                    if (selectedResolution) genParams.resolution = selectedResolution;
                    _context5.n = 1;
                    return (0, _muapi.generateImage)(apiKey, genParams);
                  case 1:
                    return _context5.a(2, _context5.v);
                  case 2:
                    if (!imageMode) {
                      _context5.n = 4;
                      break;
                    }
                    _genParams = {
                      model: selectedModelId,
                      images_list: uploadedImageUrls,
                      image_url: uploadedImageUrls[0],
                      aspect_ratio: selectedAr
                    };
                    if (swapImageUrl) _genParams.swap_url = swapImageUrl;
                    if (prompt.trim()) _genParams.prompt = prompt.trim();
                    if (currentQualityField && selectedQuality) {
                      _genParams[currentQualityField] = selectedQuality;
                    }
                    if (selectedResolution) _genParams.resolution = selectedResolution;
                    if (showEffectBtn && selectedEffect) _genParams.name = selectedEffect;
                    _context5.n = 3;
                    return (0, _muapi.generateI2I)(apiKey, _genParams);
                  case 3:
                    return _context5.a(2, _context5.v);
                  case 4:
                    _genParams2 = {
                      model: selectedModelId,
                      prompt: prompt.trim(),
                      aspect_ratio: selectedAr
                    };
                    if (currentQualityField && selectedQuality) {
                      _genParams2[currentQualityField] = selectedQuality;
                    }
                    if (selectedResolution) _genParams2.resolution = selectedResolution;
                    _context5.n = 5;
                    return (0, _muapi.generateImage)(apiKey, _genParams2);
                  case 5:
                    return _context5.a(2, _context5.v);
                  case 6:
                    return _context5.a(2);
                }
              }, _callee5);
            }))));
          case 7:
            results = _context6.v;
            results.forEach(function (res) {
              if (res && res.url) {
                var entry = {
                  id: res.id || Math.random().toString(36).substring(7),
                  url: res.url,
                  prompt: prompt.trim(),
                  model: selectedModelId,
                  aspect_ratio: selectedAr,
                  timestamp: new Date().toISOString()
                };
                addToHistory(entry);
                onGenerationComplete === null || onGenerationComplete === void 0 || onGenerationComplete({
                  url: res.url,
                  model: selectedModelId,
                  prompt: prompt.trim(),
                  type: "image"
                });
              }
            });
            _context6.n = 9;
            break;
          case 8:
            _context6.p = 8;
            _t5 = _context6.v;
            console.error("[ImageStudio] Generation failed:", _t5);
            setGenerateError(_t5.message.slice(0, 80));
            setTimeout(function () {
              return setGenerateError(null);
            }, 4000);
            onGenerationError === null || onGenerationError === void 0 || onGenerationError(((_e$message = _t5.message) === null || _e$message === void 0 ? void 0 : _e$message.slice(0, 120)) || "Image generation failed");
          case 9:
            _context6.p = 9;
            setGenerating(false);
            return _context6.f(9);
          case 10:
            return _context6.a(2);
        }
      }, _callee6, null, [[6, 8, 9, 10]]);
    }));
    return function handleGenerate() {
      return _ref0.apply(this, arguments);
    };
  }();
  var placeholderText = uploadedImageUrls.length > 1 ? "".concat(uploadedImageUrls.length, " images selected \u2014 describe the transformation (optional)") : imageMode ? "Describe how to transform this image (optional)" : "Describe the image you want to create";

  // ── Render ───────────────────────────────────────────────────────────────
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-hidden",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2",
      children: history.length > 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full pt-4 animate-fade-in-up",
        children: history.map(function (entry, idx) {
          var _entry$prompt, _entry$prompt2, _entry$model;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: entry.url,
              alt: ((_entry$prompt = entry.prompt) === null || _entry$prompt === void 0 ? void 0 : _entry$prompt.substring(0, 30)) || "Generated image",
              className: "w-full aspect-square object-cover bg-black/40 cursor-pointer hover:opacity-80 transition-opacity",
              onClick: function onClick() {
                return setFullscreenUrl(entry.url);
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
                  downloadImage(entry.url, "muapi-".concat(entry.id || idx, ".jpg"));
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
                mediaType: "image",
                title: ((_entry$prompt2 = entry.prompt) === null || _entry$prompt2 === void 0 ? void 0 : _entry$prompt2.substring(0, 50)) || 'Generated image',
                className: "p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_AiAssistantProvider.AssistStep, {
                assetUrl: entry.url,
                assetType: "image",
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
                title: entry.prompt,
                children: entry.prompt || "No prompt provided"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center justify-between mt-1",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20",
                  children: (_entry$model = entry.model) === null || _entry$model === void 0 ? void 0 : _entry$model.replace("-", " ")
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[10px] text-white/40",
                  children: entry.aspect_ratio
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
          children: "Describe a scene, character, mood, or style \u2014 and watch it come to life"
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
            children: [uploadedImageUrls && uploadedImageUrls.length > 0 && uploadedImageUrls.map(function (url, idx) {
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden shadow-md group",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                  src: url,
                  alt: "",
                  className: "w-full h-full object-cover"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  type: "button",
                  onClick: function onClick() {
                    var next = uploadedImageUrls.filter(function (_, i) {
                      return i !== idx;
                    });
                    setUploadedImageUrls(next);
                    if (next.length === 0) handleUploadClear();
                  },
                  className: "absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white/85 hover:text-white text-[8px] border border-white/5",
                  children: "\xD7"
                })]
              }, idx);
            }), uploadedImageUrls.length < maxImages && /*#__PURE__*/(0, _jsxRuntime.jsx)(UploadButton, {
              apiKey: apiKey,
              maxImages: maxImages,
              onSelect: handleUploadSelect,
              onClear: handleUploadClear,
              initialUrls: uploadedImageUrls
            }), imageMode && ((_getI2IModelById = (0, _models.getI2IModelById)(selectedModelId)) === null || _getI2IModelById === void 0 ? void 0 : _getI2IModelById.swapField) && /*#__PURE__*/(0, _jsxRuntime.jsx)(UploadButton, {
              apiKey: apiKey,
              maxImages: 1,
              onSelect: function onSelect(_ref10) {
                var urls = _ref10.urls;
                return setSwapImageUrl(urls[0] || null);
              },
              onClear: function onClear() {
                return setSwapImageUrl(null);
              },
              initialUrls: swapImageUrl ? [swapImageUrl] : [],
              label: "Swap Face"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
            ref: textareaRef,
            value: prompt,
            onChange: function onChange(e) {
              return setPrompt(e.target.value);
            },
            onInput: handleTextareaInput,
            placeholder: placeholderText,
            rows: 1,
            className: "w-full bg-transparent border-none text-white text-sm placeholder:text-white/20 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar"
          }), grokEditMode && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 flex-wrap",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "text",
              value: grokRequestId,
              onChange: function onChange(e) {
                return setGrokRequestId(e.target.value);
              },
              placeholder: "request_id",
              className: "h-[34px] w-44 bg-black/40 border border-white/10 rounded-md px-3 text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/40"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "text",
              value: grokMask,
              onChange: function onChange(e) {
                return setGrokMask(e.target.value);
              },
              placeholder: "mask URL (optional)",
              className: "h-[34px] flex-1 min-w-[160px] bg-black/40 border border-white/10 rounded-md px-3 text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-[#22d3ee]/40"
            })]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-white/[0.03] relative",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-2 relative flex-wrap pb-1 md:pb-0",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setDropdownOpen(function (o) {
                    return o === "model" ? null : "model";
                  });
                },
                className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-4 h-4 rounded overflow-hidden shrink-0 flex items-center justify-center bg-white/5",
                  children: function () {
                    var selectedModelObj = currentModels.find(function (m) {
                      return m.id === selectedModelId;
                    });
                    var selectedModelProvider = (selectedModelObj === null || selectedModelObj === void 0 ? void 0 : selectedModelObj.provider) || 'muapi';
                    return PROVIDER_LOGOS[selectedModelProvider] ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                      src: PROVIDER_LOGOS[selectedModelProvider],
                      alt: "",
                      className: "w-full h-full object-contain ".concat(invertLogos.includes(selectedModelProvider) ? "invert" : "")
                    }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-[9px] font-bold text-black uppercase",
                      children: "G"
                    });
                  }()
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: selectedModelName
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "10",
                  height: "10",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "4",
                  className: "opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M6 9l6 6 6-6"
                  })
                })]
              }), dropdownOpen === "model" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                ref: dropdownRef,
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl w-[calc(100vw-2rem)] md:w-[480px] max-w-md md:max-w-none",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(ModelDropdown, {
                  models: currentModels,
                  selectedModel: selectedModelId,
                  onSelect: handleModelSelect,
                  onClose: function onClose() {
                    return setDropdownOpen(null);
                  }
                })
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setDropdownOpen(function (o) {
                    return o === "ar" ? null : "ar";
                  });
                },
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
              }), dropdownOpen === "ar" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[160px]",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(SimpleDropdown, {
                  title: "Aspect Ratio",
                  options: currentAspectRatios,
                  selected: selectedAr,
                  onSelect: function onSelect(val) {
                    return setSelectedAr(val);
                  },
                  onClose: function onClose() {
                    return setDropdownOpen(null);
                  }
                })
              })]
            }), showQualityBtn && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setDropdownOpen(function (o) {
                    return o === "quality" ? null : "quality";
                  });
                },
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
                  children: selectedQuality || currentResolutions[0]
                })]
              }), dropdownOpen === "quality" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[160px]",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(SimpleDropdown, {
                  title: "Resolution",
                  options: currentResolutions,
                  selected: selectedQuality,
                  onSelect: function onSelect(val) {
                    return setSelectedQuality(val);
                  },
                  onClose: function onClose() {
                    return setDropdownOpen(null);
                  }
                })
              })]
            }), selectedResolution && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "relative",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("select", {
                value: selectedResolution,
                onChange: function onChange(e) {
                  return setSelectedResolution(e.target.value);
                },
                className: "h-[34px] flex items-center px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] text-[11px] font-semibold text-white/70 hover:text-[#22d3ee] shadow-inner",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
                  value: selectedResolution,
                  children: selectedResolution
                }), currentResolutions.filter(function (r) {
                  return r !== selectedResolution;
                }).map(function (r) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
                    value: r,
                    children: r
                  }, r);
                })]
              })
            }), grokEditMode && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              onClick: function onClick(e) {
                e.stopPropagation();
                setDropdownOpen(function (o) {
                  return o === "grok" ? null : "grok";
                });
              },
              className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-white/10 rounded-md transition-all border border-[#22d3ee]/40 group whitespace-nowrap shadow-inner",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-semibold text-[#22d3ee]/80",
                children: "Grok Edit"
              })
            }), showEffectBtn && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "relative",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: function onClick(e) {
                  e.stopPropagation();
                  setDropdownOpen(function (o) {
                    return o === "effect" ? null : "effect";
                  });
                },
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
              }), dropdownOpen === "effect" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0c0c0f]/95 rounded-xl p-3.5 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/[0.08] backdrop-blur-2xl min-w-[200px]",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(SimpleDropdown, {
                  title: "Effect Type",
                  options: currentEffects,
                  selected: selectedEffect,
                  onSelect: function onSelect(val) {
                    return setSelectedEffect(val);
                  },
                  onClose: function onClose() {
                    return setDropdownOpen(null);
                  }
                })
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "h-[34px] flex items-center gap-2 bg-[#16161a]/60 rounded-md px-2.5 border border-white/[0.06] shadow-inner select-none",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                onClick: function onClick() {
                  return setBatchSize(function (prev) {
                    return Math.max(1, prev - 1);
                  });
                },
                className: "text-white/40 hover:text-white/80 font-extrabold text-xs transition-colors px-1",
                children: "-"
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "text-[11px] font-black text-white/70 min-w-[24px] text-center",
                children: [batchSize, "/4"]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                type: "button",
                onClick: function onClick() {
                  return setBatchSize(function (prev) {
                    return Math.min(4, prev + 1);
                  });
                },
                className: "text-white/40 hover:text-white/80 font-extrabold text-xs transition-colors px-1",
                children: "+"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-white/[0.06] group whitespace-nowrap shadow-inner",
              onClick: function onClick() {
                return setIsDrawModalOpen(true);
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "12",
                height: "12",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.5",
                className: "opacity-40 text-white group-hover:text-[#22d3ee] transition-colors",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M12 20h9"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                children: "Draw"
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
              type: "button",
              className: "h-[34px] flex items-center gap-2 px-3.5 bg-[#16161a]/60 hover:bg-[#202026]/80 rounded-md transition-all border border-[#22d3ee]/40 group whitespace-nowrap shadow-inner",
              onClick: function onClick() {
                return router.push("/studio/skills");
              },
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "12",
                height: "12",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                className: "opacity-60 text-[#22d3ee] group-hover:text-[#22d3ee] transition-colors",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M4 4h6v6H4z"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M14 4h6v6h-6z"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M4 14h6v6H4z"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                  d: "M14 14h6v6h-6z"
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[11px] font-semibold text-[#22d3ee]/80 group-hover:text-[#22d3ee] transition-colors",
                children: "Recipes"
              })]
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: handleGenerate,
            disabled: generating,
            className: "bg-[#22d3ee] text-black px-7 py-3 rounded-full font-bold text-sm hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/20 hover:shadow-[#22d3ee]/35 border border-[#22d3ee]/10 z-10",
            children: generating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "animate-spin inline-block text-black",
                children: "\u25CC"
              }), "Generating..."]
            }) : generateError ? "Error: ".concat(generateError) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                children: ["Generate \u2726 ", batchSize]
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
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_DrawModal["default"], {
      isOpen: isDrawModalOpen,
      onClose: function onClose() {
        return setIsDrawModalOpen(false);
      },
      apiKey: apiKey,
      batchSize: 1,
      onAddHistoryItem: addToHistory
    })]
  });
}