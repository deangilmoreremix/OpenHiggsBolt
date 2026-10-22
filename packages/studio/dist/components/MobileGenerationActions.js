"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CopyContentIcon = CopyContentIcon;
exports.GenerationCopyButtons = GenerationCopyButtons;
exports["default"] = MobileGenerationActions;
var _react = require("react");
var _jsxRuntime = require("react/jsx-runtime");
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
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function getClipboardPngBlob(_x) {
  return _getClipboardPngBlob.apply(this, arguments);
}
function _getClipboardPngBlob() {
  _getClipboardPngBlob = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(url) {
    var response, sourceBlob, objectUrl, image, canvas, context;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          _context4.n = 1;
          return fetch(url);
        case 1:
          response = _context4.v;
          if (response.ok) {
            _context4.n = 2;
            break;
          }
          throw new Error("Image request failed with status ".concat(response.status, "."));
        case 2:
          _context4.n = 3;
          return response.blob();
        case 3:
          sourceBlob = _context4.v;
          if (!(sourceBlob.type === "image/png")) {
            _context4.n = 4;
            break;
          }
          return _context4.a(2, sourceBlob);
        case 4:
          objectUrl = URL.createObjectURL(sourceBlob);
          _context4.p = 5;
          _context4.n = 6;
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
          image = _context4.v;
          canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          context = canvas.getContext("2d");
          if (context) {
            _context4.n = 7;
            break;
          }
          throw new Error("Could not create an image clipboard canvas.");
        case 7:
          context.drawImage(image, 0, 0);
          _context4.n = 8;
          return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
              return blob ? resolve(blob) : reject(new Error("Could not convert the image to PNG."));
            }, "image/png");
          });
        case 8:
          return _context4.a(2, _context4.v);
        case 9:
          _context4.p = 9;
          URL.revokeObjectURL(objectUrl);
          return _context4.f(9);
        case 10:
          return _context4.a(2);
      }
    }, _callee4, null, [[5,, 9, 10]]);
  }));
  return _getClipboardPngBlob.apply(this, arguments);
}
function copyPrompt(_x2) {
  return _copyPrompt.apply(this, arguments);
}
function _copyPrompt() {
  _copyPrompt = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(prompt) {
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          if (prompt) {
            _context5.n = 1;
            break;
          }
          return _context5.a(2);
        case 1:
          _context5.n = 2;
          return navigator.clipboard.writeText(prompt);
        case 2:
          return _context5.a(2);
      }
    }, _callee5);
  }));
  return _copyPrompt.apply(this, arguments);
}
function copyImage(_x3) {
  return _copyImage.apply(this, arguments);
}
function _copyImage() {
  _copyImage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(url) {
    var _navigator$clipboard;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.n) {
        case 0:
          if (url) {
            _context6.n = 1;
            break;
          }
          return _context6.a(2);
        case 1:
          if (!(!window.isSecureContext || !((_navigator$clipboard = navigator.clipboard) !== null && _navigator$clipboard !== void 0 && _navigator$clipboard.write) || typeof window.ClipboardItem === "undefined")) {
            _context6.n = 2;
            break;
          }
          throw new Error("Image clipboard access requires HTTPS or localhost.");
        case 2:
          _context6.n = 3;
          return navigator.clipboard.write([new window.ClipboardItem({
            "image/png": getClipboardPngBlob(url)
          })]);
        case 3:
          return _context6.a(2);
      }
    }, _callee6);
  }));
  return _copyImage.apply(this, arguments);
}
function CopyContentIcon(_ref) {
  var kind = _ref.kind,
    _ref$size = _ref.size,
    size = _ref$size === void 0 ? 19 : _ref$size;
  var isText = kind === "text";
  if (!isText) {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M6 5V4.5A2.5 2.5 0 018.5 2H19a3 3 0 013 3v10.5a2.5 2.5 0 01-2.5 2.5H19",
        opacity: "0.65"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
        x: "2",
        y: "6",
        width: "17",
        height: "16",
        rx: "2.5",
        strokeWidth: "2.2"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
        cx: "6.5",
        cy: "10.5",
        r: "1.25"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M3.5 19l4.2-4.4 3.1 3.1 2.4-2.5 4.3 4.2",
        strokeWidth: "2.2"
      })]
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M2.5 3.5h13",
      strokeWidth: "2.7"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M9 3.5v14",
      strokeWidth: "2.7"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M19 15.25V14.2A1.2 1.2 0 0017.8 13h-3.6a1.2 1.2 0 00-1.2 1.2v3.6a1.2 1.2 0 001.2 1.2h1.05",
      strokeWidth: "1.6"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
      x: "15.25",
      y: "15.25",
      width: "6.25",
      height: "6.25",
      rx: "1.15",
      strokeWidth: "1.6"
    })]
  });
}
function CopiedIcon(_ref2) {
  var _ref2$size = _ref2.size,
    size = _ref2$size === void 0 ? 15 : _ref2$size;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M5 12l4 4L19 6"
    })
  });
}
function GenerationCopyButtons(_ref3) {
  var prompt = _ref3.prompt,
    imageUrl = _ref3.imageUrl,
    onCopyError = _ref3.onCopyError;
  var _useState = (0, _react.useState)(null),
    _useState2 = _slicedToArray(_useState, 2),
    copiedKind = _useState2[0],
    setCopiedKind = _useState2[1];
  var runCopy = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(event, kind) {
      var contentLabel, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            event.stopPropagation();
            _context.p = 1;
            if (!(kind === "text")) {
              _context.n = 3;
              break;
            }
            _context.n = 2;
            return copyPrompt(prompt);
          case 2:
            _context.n = 4;
            break;
          case 3:
            _context.n = 4;
            return copyImage(imageUrl);
          case 4:
            setCopiedKind(kind);
            window.setTimeout(function () {
              setCopiedKind(function (current) {
                return current === kind ? null : current;
              });
            }, 1600);
            _context.n = 6;
            break;
          case 5:
            _context.p = 5;
            _t = _context.v;
            contentLabel = kind === "text" ? "the prompt" : "the image";
            console.error("Failed to copy ".concat(contentLabel, ":"), _t);
            onCopyError === null || onCopyError === void 0 || onCopyError(kind === "text" ? "Could not copy the prompt to the clipboard." : "Could not copy the image. Image copy requires HTTPS or localhost.");
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[1, 5]]);
    }));
    return function runCopy(_x4, _x5) {
      return _ref4.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
    children: [prompt && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      title: copiedKind === "text" ? "Prompt copied" : "Copy prompt",
      "aria-label": copiedKind === "text" ? "Prompt copied" : "Copy prompt",
      onClick: function onClick(event) {
        return runCopy(event, "text");
      },
      className: "flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-md transition-all hover:bg-[#22d3ee] hover:text-black ".concat(copiedKind === "text" ? "text-[#22d3ee]" : "text-white"),
      children: copiedKind === "text" ? /*#__PURE__*/(0, _jsxRuntime.jsx)(CopiedIcon, {}) : /*#__PURE__*/(0, _jsxRuntime.jsx)(CopyContentIcon, {
        kind: "text",
        size: 17
      })
    }), imageUrl && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      title: copiedKind === "image" ? "Image copied" : "Copy image",
      "aria-label": copiedKind === "image" ? "Image copied" : "Copy image",
      onClick: function onClick(event) {
        return runCopy(event, "image");
      },
      className: "flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-md transition-all hover:bg-[#22d3ee] hover:text-black ".concat(copiedKind === "image" ? "text-[#22d3ee]" : "text-white"),
      children: copiedKind === "image" ? /*#__PURE__*/(0, _jsxRuntime.jsx)(CopiedIcon, {}) : /*#__PURE__*/(0, _jsxRuntime.jsx)(CopyContentIcon, {
        kind: "image",
        size: 17
      })
    })]
  });
}
function ActionIcon(_ref5) {
  var kind = _ref5.kind;
  if (kind === "text") {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(CopyContentIcon, {
      kind: "text"
    });
  }
  if (kind === "image") {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(CopyContentIcon, {
      kind: "image"
    });
  }
  if (kind === "download") {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
      width: "17",
      height: "17",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M7 10l5 5 5-5M12 15V3"
      })]
    });
  }
  if (kind === "delete") {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
      width: "17",
      height: "17",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M10 11v5M14 11v5"
      })]
    });
  }
  if (kind === "extend") {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
      width: "17",
      height: "17",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M5 12h14M12 5l7 7-7 7"
      })
    });
  }
  if (kind === "remix") {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
      width: "17",
      height: "17",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M17 2l4 4-4 4"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M21 13v2a3 3 0 01-3 3H3"
      })]
    });
  }
  if (kind === "copy") {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
      width: "17",
      height: "17",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("rect", {
        x: "9",
        y: "9",
        width: "11",
        height: "11",
        rx: "2"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
        d: "M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3"
      })]
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
      cx: "12",
      cy: "12",
      r: "9"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
      d: "M12 8v4l3 2"
    })]
  });
}
function MobileGenerationActions(_ref6) {
  var _ref6$actions = _ref6.actions,
    actions = _ref6$actions === void 0 ? [] : _ref6$actions,
    prompt = _ref6.prompt,
    imageUrl = _ref6.imageUrl,
    onCopyError = _ref6.onCopyError;
  var _useState3 = (0, _react.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    open = _useState4[0],
    setOpen = _useState4[1];
  var copyActions = [prompt ? {
    kind: "text",
    label: "Copy prompt",
    onSelect: function () {
      var _onSelect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var _t2;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              _context2.p = 0;
              _context2.n = 1;
              return copyPrompt(prompt);
            case 1:
              _context2.n = 3;
              break;
            case 2:
              _context2.p = 2;
              _t2 = _context2.v;
              console.error("Failed to copy the prompt:", _t2);
              onCopyError === null || onCopyError === void 0 || onCopyError("Could not copy the prompt to the clipboard.");
            case 3:
              return _context2.a(2);
          }
        }, _callee2, null, [[0, 2]]);
      }));
      function onSelect() {
        return _onSelect.apply(this, arguments);
      }
      return onSelect;
    }()
  } : null, imageUrl ? {
    kind: "image",
    label: "Copy image",
    onSelect: function () {
      var _onSelect2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var _t3;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              _context3.p = 0;
              _context3.n = 1;
              return copyImage(imageUrl);
            case 1:
              _context3.n = 3;
              break;
            case 2:
              _context3.p = 2;
              _t3 = _context3.v;
              console.error("Failed to copy the image:", _t3);
              onCopyError === null || onCopyError === void 0 || onCopyError("Could not copy the image. Image copy requires HTTPS or localhost.");
            case 3:
              return _context3.a(2);
          }
        }, _callee3, null, [[0, 2]]);
      }));
      function onSelect() {
        return _onSelect2.apply(this, arguments);
      }
      return onSelect;
    }()
  } : null];
  var availableActions = [].concat(copyActions, _toConsumableArray(actions)).filter(Boolean);
  if (availableActions.length === 0) return null;
  var stopCardClick = function stopCardClick(event) {
    event.stopPropagation();
  };
  var runAction = function runAction(event, action) {
    var _action$onSelect;
    event.stopPropagation();
    setOpen(false);
    (_action$onSelect = action.onSelect) === null || _action$onSelect === void 0 || _action$onSelect.call(action);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "absolute right-2 top-2 z-40 md:hidden",
    onClick: stopCardClick,
    children: [open && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      "aria-label": "Close actions",
      className: "fixed inset-0 z-40 cursor-default bg-transparent",
      onClick: function onClick(event) {
        event.stopPropagation();
        setOpen(false);
      }
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      "aria-label": "Generation actions",
      "aria-expanded": open,
      onClick: function onClick(event) {
        event.stopPropagation();
        setOpen(function (current) {
          return !current;
        });
      },
      className: "relative z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-lg backdrop-blur-md active:scale-95",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "currentColor",
        "aria-hidden": "true",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
          cx: "5",
          cy: "12",
          r: "1.7"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
          cx: "12",
          cy: "12",
          r: "1.7"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
          cx: "19",
          cy: "12",
          r: "1.7"
        })]
      })
    }), open && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute right-0 top-12 z-50 min-w-[178px] overflow-hidden rounded-xl border border-white/15 bg-[#151515]/95 p-1.5 shadow-2xl backdrop-blur-xl",
      children: availableActions.map(function (action) {
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          type: "button",
          onClick: function onClick(event) {
            return runAction(event, action);
          },
          className: "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition-colors ".concat(action.danger ? "text-red-400 hover:bg-red-500/15 active:bg-red-500/20" : "text-white hover:bg-white/10 active:bg-white/15"),
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "flex h-6 w-6 items-center justify-center",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)(ActionIcon, {
              kind: action.kind
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: action.label
          })]
        }, "".concat(action.kind, "-").concat(action.label));
      })
    })]
  });
}