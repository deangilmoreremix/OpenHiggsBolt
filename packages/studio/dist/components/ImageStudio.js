"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ImageStudio;
var _react = require("react");
var _muapi = require("../muapi.js");
var _DrawModal = _interopRequireDefault(require("./DrawModal.jsx"));
var _models = require("../models.js");
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
    initialUrls = _ref$initialUrls === void 0 ? [] : _ref$initialUrls;
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
            if (apiKey) {
              _context2.n = 1;
              break;
            }
            alert('Please enter your MuAPI key in Settings to upload images.');
            return _context2.a(2);
          case 1:
            files = Array.from(e.target.files);
            if (files.length) {
              _context2.n = 2;
              break;
            }
            return _context2.a(2);
          case 2:
            e.target.value = "";
            MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
            tooLarge = files.filter(function (f) {
              return f.size > MAX_IMAGE_SIZE;
            });
            if (!(tooLarge.length > 0)) {
              _context2.n = 3;
              break;
            }
            alert("The following images are too large (max 10MB): ".concat(tooLarge.map(function (f) {
              return f.name;
            }).join(", ")));
            return _context2.a(2);
          case 3:
            setUploading(true);
            _context2.p = 4;
            toUpload = maxImages === 1 ? files.slice(0, 1) : files.slice(0, maxImages - selectedEntries.length || 1);
            _context2.n = 5;
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
          case 5:
            _context2.n = 7;
            break;
          case 6:
            _context2.p = 6;
            _t2 = _context2.v;
            alert("Image upload failed: ".concat(_t2.message));
          case 7:
            _context2.p = 7;
            setUploading(false);
            setLastUploadProgress(0);
            return _context2.f(7);
          case 8:
            return _context2.a(2);
        }
      }, _callee2, null, [[4, 6, 7, 8]]);
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
  var triggerContent;
  if (hasSelection || uploading) {
    var _selectedEntries$, _selectedEntries$2;
    var mainEntry = selectedEntries[0] || uploadHistory[0];
    var canAddMore = isMulti && count < maxImages;
    var badge;
    if (uploading && !hasSelection) {
      badge = /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
            className: "text-primary transition-all duration-300"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
          className: "absolute text-[9px] font-black text-primary leading-none",
          children: [lastUploadProgress, "%"]
        })]
      });
    } else if (count > 1) {
      badge = /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-[9px] font-black text-black leading-none",
          children: count
        })
      });
    } else if (canAddMore) {
      badge = /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-white/80 rounded-full flex items-center justify-center px-0.5 border border-primary/60",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-[9px] font-black text-black leading-none",
          children: "+"
        })
      });
    } else {
      badge = /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "8",
          height: "8",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "black",
          strokeWidth: "4",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
            points: "20 6 9 17 4 12"
          })
        })
      });
    }
    triggerContent = /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
      children: [uploading && hasSelection && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5"
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
          className: "text-[8px] font-black text-primary",
          children: [lastUploadProgress, "%"]
        })]
      }), count > 1 ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "relative w-full h-full p-1.5 flex items-center justify-center",
        children: [((_selectedEntries$ = selectedEntries[1]) === null || _selectedEntries$ === void 0 ? void 0 : _selectedEntries$.url) && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "absolute top-1 left-1 w-6 h-6 rounded-md border border-black/40 overflow-hidden shadow-lg rotate-[-8deg] translate-x-[-1px] translate-y-[-1px]",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: selectedEntries[1].url,
            alt: "",
            className: "w-full h-full object-cover"
          })
        }), ((_selectedEntries$2 = selectedEntries[0]) === null || _selectedEntries$2 === void 0 ? void 0 : _selectedEntries$2.url) && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "absolute bottom-1 right-1 w-7 h-7 rounded-sm border-[1.5px] border-black/60 overflow-hidden shadow-2xl z-10 rotate-[4deg] translate-x-[1px] translate-y-[1px]",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: selectedEntries[0].url,
            alt: "",
            className: "w-full h-full object-cover transition-all duration-300 ".concat(uploading && hasSelection ? "blur-[2px] opacity-60" : "opacity-100")
          })
        })]
      }) : mainEntry !== null && mainEntry !== void 0 && mainEntry.url ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: mainEntry.url,
        alt: "",
        className: "w-full h-full object-cover transition-all duration-300 ".concat(uploading && hasSelection ? "blur-[2px] scale-110 opacity-60" : "blur-0 scale-100 opacity-100")
      }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "w-full h-full flex flex-col items-center justify-center bg-white/5 animate-pulse",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-4 h-4 rounded-full border border-primary/20 border-t-primary animate-spin mb-0.5"
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
          className: "text-[8px] font-black text-primary",
          children: [lastUploadProgress, "%"]
        })]
      }), !uploading && badge]
    });
  } else {
    triggerContent = /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      className: "text-white/40 group-hover:text-primary transition-colors",
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
  }
  var triggerTitle = hasSelection ? count > 1 ? "".concat(count, " of ").concat(maxImages, " images selected \u2014 click to manage") : isMulti ? "1 image selected \u2014 click to add more (up to ".concat(maxImages, ")") : "Reference image" : isMulti ? "Add up to ".concat(maxImages, " images") : "Reference image";
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
      className: "w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden mt-1.5 bg-white/5 hover:bg-white/10 group ".concat(hasSelection ? "border-primary/60 hover:border-primary/40" : "border-white/10 hover:border-primary/40"),
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
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_DrawModal["default"], {
              isOpen: isDrawModalOpen,
              onClose: function onClose() {
                return setIsDrawModalOpen(false);
              },
              apiKey: apiKey,
              batchSize: 1,
              onAddHistoryItem: addToHistory
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

function ModelDropdown(_ref4) {
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
    var pId = m.provider || "muapi";
    var pName = m.provider_name || "Muapi";
    if (!seenProviders.has(pId)) {
      seenProviders.add(pId);
      availableProviders.push({
        id: pId,
        name: pName
      });
    }
  });
  var filterFn = function filterFn(m) {
    // 1. Filter by provider
    if (selectedProvider !== "all") {
      var pId = m.provider || "muapi";
      if (pId !== selectedProvider) return false;
    }
    // 2. Filter by search query
    var query = search.toLowerCase();
    return m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query);
  };
  var filtered = models.filter(filterFn);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col gap-2 h-full max-h-[60vh]",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "border-b border-white/5 shrink-0",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-primary/50 transition-colors",
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
    }), availableProviders.length > 1 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "shrink-0",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("select", {
        value: selectedProvider,
        onClick: function onClick(e) {
          return e.stopPropagation();
        },
        onChange: function onChange(e) {
          return setSelectedProvider(e.target.value);
        },
        className: "w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
          value: "all",
          children: "All Providers"
        }), availableProviders.map(function (p) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
            value: p.id,
            children: p.name
          }, p.id);
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "text-xs font-medium text-secondary py-2 shrink-0",
      children: "Available models"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2",
      children: filtered.map(function (m) {
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          onClick: function onClick(e) {
            e.stopPropagation();
            onSelect(m);
            onClose();
          },
          className: "flex items-center justify-between p-3.5 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 ".concat(selectedModel === m.id ? "bg-white/5 border-white/5" : ""),
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-center gap-3.5",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-10 h-10 ".concat(m.family === "kontext" ? "bg-blue-500/10 text-blue-400" : m.family === "effects" ? "bg-purple-500/10 text-purple-400" : "bg-primary/10 text-primary", " border border-white/5 rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase"),
              children: m.name.charAt(0)
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "flex flex-col gap-0.5",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-xs font-bold text-white tracking-tight",
                children: m.name
              })
            })]
          }), selectedModel === m.id && /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "16",
            height: "16",
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
      className: "text-xs font-medium text-muted pb-2 border-b border-white/5 mb-2",
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
          className: "flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer transition-all group",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-xs font-bold text-white opacity-80 group-hover:opacity-100",
            children: opt
          }), selected === opt && /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "#22d3ee",
            strokeWidth: "4",
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
  var _t2iModels$0$inputs;
  var apiKey = _ref6.apiKey,
    onGenerationComplete = _ref6.onGenerationComplete,
    historyItems = _ref6.historyItems,
    droppedFiles = _ref6.droppedFiles,
    onFilesHandled = _ref6.onFilesHandled;
  var PERSIST_KEY = "hg_image_studio_persistent";

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

  // ── UI state ────────────────────────────────────────────────────────────
  var _useState31 = (0, _react.useState)(null),
    _useState32 = _slicedToArray(_useState31, 2),
    dropdownOpen = _useState32[0],
    setDropdownOpen = _useState32[1]; // 'model' | 'ar' | 'quality' | null
  var _useState33 = (0, _react.useState)(false),
    _useState34 = _slicedToArray(_useState33, 2),
    generating = _useState34[0],
    setGenerating = _useState34[1];
  var _useState35 = (0, _react.useState)(null),
    _useState36 = _slicedToArray(_useState35, 2),
    generateError = _useState36[0],
    setGenerateError = _useState36[1];
  var _useState37 = (0, _react.useState)(null),
    _useState38 = _slicedToArray(_useState37, 2),
    fullscreenUrl = _useState38[0],
    setFullscreenUrl = _useState38[1];
  var _useState39 = (0, _react.useState)(false),
    _useState40 = _slicedToArray(_useState39, 2),
    isDrawModalOpen = _useState40[0],
    setIsDrawModalOpen = _useState40[1];

  // ── Canvas / history state ──────────────────────────────────────────────
  var _useState41 = (0, _react.useState)(null),
    _useState42 = _slicedToArray(_useState41, 2),
    currentImageUrl = _useState42[0],
    setCurrentImageUrl = _useState42[1];
  var _useState43 = (0, _react.useState)(0),
    _useState44 = _slicedToArray(_useState43, 2),
    activeHistoryIdx = _useState44[0],
    setActiveHistoryIdx = _useState44[1];
  var _useState45 = (0, _react.useState)(1),
    _useState46 = _slicedToArray(_useState45, 2),
    batchSize = _useState46[0],
    setBatchSize = _useState46[1];
  var _useState47 = (0, _react.useState)([]),
    _useState48 = _slicedToArray(_useState47, 2),
    localHistory = _useState48[0],
    setLocalHistory = _useState48[1]; // [{id,url,prompt,model,aspect_ratio,timestamp}]

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
            if (apiKey) {
              _context4.n = 1;
              break;
            }
            alert('Please enter your MuAPI key in Settings to upload images.');
            return _context4.a(2);
          case 1:
            MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
            tooLarge = files.filter(function (f) {
              return f.size > MAX_IMAGE_SIZE;
            });
            if (!(tooLarge.length > 0)) {
              _context4.n = 2;
              break;
            }
            alert("The following images are too large (max 10MB): ".concat(tooLarge.map(function (f) {
              return f.name;
            }).join(", ")));
            return _context4.a(2);
          case 2:
            setGenerating(true); // Show as generating/busy
            _context4.p = 3;
            toUpload = maxImages === 1 ? files.slice(0, 1) : files.slice(0, maxImages);
            _context4.n = 4;
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
          case 4:
            urls = _context4.v;
            handleUploadSelect({
              urls: urls
            });
            _context4.n = 6;
            break;
          case 5:
            _context4.p = 5;
            _t4 = _context4.v;
            alert("Image upload failed: ".concat(_t4.message));
          case 6:
            _context4.p = 6;
            setGenerating(false);
            return _context4.f(6);
          case 7:
            return _context4.a(2);
        }
      }, _callee4, null, [[3, 5, 6, 7]]);
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

  // ── Generation ───────────────────────────────────────────────────────────
  var handleGenerate = /*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
      var results, _t5;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.p = _context6.n) {
          case 0:
            if (!generating) {
              _context6.n = 1;
              break;
            }
            return _context6.a(2);
          case 1:
            if (apiKey) {
              _context6.n = 2;
              break;
            }
            alert("Please enter your MuAPI key in Settings first.");
            return _context6.a(2);
          case 2:
            if (!imageMode) {
              _context6.n = 4;
              break;
            }
            if (!(uploadedImageUrls.length === 0)) {
              _context6.n = 3;
              break;
            }
            alert("Please upload a reference image first.");
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
              var genParams, _genParams;
              return _regenerator().w(function (_context5) {
                while (1) switch (_context5.n) {
                  case 0:
                    if (!imageMode) {
                      _context5.n = 2;
                      break;
                    }
                    genParams = {
                      model: selectedModelId,
                      images_list: uploadedImageUrls,
                      image_url: uploadedImageUrls[0],
                      aspect_ratio: selectedAr
                    };
                    if (prompt.trim()) genParams.prompt = prompt.trim();
                    if (currentQualityField && selectedQuality) {
                      genParams[currentQualityField] = selectedQuality;
                    }
                    if (showEffectBtn && selectedEffect) genParams.name = selectedEffect;
                    _context5.n = 1;
                    return (0, _muapi.generateI2I)(apiKey, genParams);
                  case 1:
                    return _context5.a(2, _context5.v);
                  case 2:
                    _genParams = {
                      model: selectedModelId,
                      prompt: prompt.trim(),
                      aspect_ratio: selectedAr
                    };
                    if (currentQualityField && selectedQuality) {
                      _genParams[currentQualityField] = selectedQuality;
                    }
                    _context5.n = 3;
                    return (0, _muapi.generateImage)(apiKey, _genParams);
                  case 3:
                    return _context5.a(2, _context5.v);
                  case 4:
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
          var _entry$prompt, _entry$model;
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
          className: "mb-12 relative group",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
                width: "32",
                height: "32",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.5",
                className: "text-primary opacity-80",
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
            children: "IMAGE STUDIO"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed",
          children: "Describe a scene, character, mood, or style \u2014 and watch it come to life"
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up",
      style: {
        animationDelay: "0.2s"
      },
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "w-full bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(UploadButton, {
            apiKey: apiKey,
            maxImages: maxImages,
            onSelect: handleUploadSelect,
            onClear: handleUploadClear,
            initialUrls: uploadedImageUrls
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex-1 flex flex-col gap-2",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
              ref: textareaRef,
              value: prompt,
              onChange: function onChange(e) {
                return setPrompt(e.target.value);
              },
              onInput: handleTextareaInput,
              placeholder: placeholderText,
              rows: 1,
              className: "w-full bg-transparent border-none text-white text-sm placeholder:text-white/20 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar"
            })
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative",
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
                className: "flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                    className: "text-[9px] font-bold text-black uppercase",
                    children: "G"
                  })
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
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] w-[calc(100vw-3rem)] max-w-xs",
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
                  children: selectedAr
                })]
              }), dropdownOpen === "ar" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/10 min-w-[160px]",
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
                className: "flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  className: "opacity-40 text-white",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"
                  })
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors",
                  children: selectedQuality || currentResolutions[0]
                })]
              }), dropdownOpen === "quality" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                onClick: function onClick(e) {
                  return e.stopPropagation();
                },
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]",
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
                className: "flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap",
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
                className: "absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[200px]",
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
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "flex items-center gap-1 bg-white/[0.03] rounded-md p-1 border border-white/[0.03]",
              children: [1, 2, 3, 4].map(function (num) {
                return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  type: "button",
                  onClick: function onClick() {
                    return setBatchSize(num);
                  },
                  className: "w-7 h-7 flex items-center justify-center rounded-md text-[10px] font-black transition-all ".concat(batchSize === num ? "bg-[#22d3ee] text-black shadow-lg shadow-[#22d3ee]/20" : "text-white/40 hover:text-white/80 hover:bg-white/5"),
                  children: num
                }, num);
              })
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
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "button",
            onClick: handleGenerate,
            disabled: generating,
            className: "bg-[#22d3ee] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/10 disabled:opacity-50 disabled:cursor-not-allowed z-10",
            children: generating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "animate-spin inline-block text-black",
                children: "\u25CC"
              }), "Generating..."]
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
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: fullscreenUrl,
        alt: "Fullscreen Preview",
        className: "max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up",
        onClick: function onClick(e) {
          return e.stopPropagation();
        }
      })]
    })]
  });
}