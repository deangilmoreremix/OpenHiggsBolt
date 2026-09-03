"use strict";

var _vitest = require("vitest");
var _react = require("react");
var _client = require("react-dom/client");
var _VideoStudio = _interopRequireDefault(require("./VideoStudio.jsx"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; } // @vitest-environment jsdom
// The component expects a global i18n `t` from the app shell.
(0, _vitest.beforeAll)(function () {
  if (!globalThis.t) globalThis.t = function (k) {
    return k;
  };
  // Enable React's act() batching/flushing in the test env.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});
var flush = function flush() {
  return (0, _react.act)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          _context.n = 1;
          return new Promise(function (r) {
            return setTimeout(r, 0);
          });
        case 1:
          return _context.a(2);
      }
    }, _callee);
  })));
};

// Click the innermost element whose text includes `text`. Dispatch the native
// click OUTSIDE `act` so React does not flush synchronously — otherwise
// the component's window-level outside-click-close handler fires (it checks
// dropdownRef.current) and immediately closes the dropdown we just opened.
// We flush afterward.
function clickText(container, text) {
  var els = _toConsumableArray(container.querySelectorAll('*')).filter(function (n) {
    var _n$textContent;
    return (_n$textContent = n.textContent) === null || _n$textContent === void 0 ? void 0 : _n$textContent.includes(text);
  });
  if (els.length === 0) throw new Error("clickText: not found: ".concat(text));
  // Prefer a real <button> control over decorative text that also
  // contains the name (e.g. the empty-state hero card), which
  // has no onClick.
  var el = els.find(function (e) {
    return e.tagName === 'BUTTON';
  }) || els.sort(function (a, b) {
    return a.textContent.length - b.textContent.length;
  })[0];
  el.dispatchEvent(new MouseEvent('click', {
    bubbles: true
  }));
  return flush();
}
function typeSearch(container, value) {
  var input = container.querySelector('input[type="text"]');
  if (!input) {
    var all = _toConsumableArray(container.querySelectorAll('input')).map(function (i) {
      return "".concat(i.type, ":").concat(i.placeholder || '');
    });
    throw new Error("search input not found. inputs=".concat(JSON.stringify(all)));
  }
  var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', {
    bubbles: true
  }));
  return flush();
}
function buttons(container) {
  return _toConsumableArray(container.querySelectorAll('button')).map(function (b) {
    return b.textContent.trim();
  });
}
function mount() {
  var container = document.createElement('div');
  document.body.appendChild(container);
  var root = (0, _client.createRoot)(container);
  (0, _react.act)(function () {
    root.render(/*#__PURE__*/(0, _jsxRuntime.jsx)(_VideoStudio["default"], {
      apiKey: "fake-key"
    }));
  });
  return {
    container: container,
    root: root
  };
}
(0, _vitest.describe)('VideoStudio Quality & Mode controls', function () {
  (0, _vitest.it)('renders and shows Quality for Seedance 2.0, Mode for Grok Imagine', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var _mount, container;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          _mount = mount(), container = _mount.container; // Default model (Seedance Lite) has neither quality nor mode.
          (0, _vitest.expect)(buttons(container)).not.toContain('basic');
          (0, _vitest.expect)(buttons(container)).not.toContain('normal');

          // Open the model picker and pick a quality-capable model.
          _context2.n = 1;
          return clickText(container, 'Seedance Lite');
        case 1:
          _context2.n = 2;
          return typeSearch(container, 'Seedance 2.0');
        case 2:
          _context2.n = 3;
          return clickText(container, 'Seedance 2.0');
        case 3:
          // Quality control now shows the model default ("basic").
          (0, _vitest.expect)(buttons(container)).toContain('basic');

          // Switch to a mode-capable model.
          _context2.n = 4;
          return clickText(container, 'Seedance 2.0');
        case 4:
          _context2.n = 5;
          return typeSearch(container, 'Grok Imagine');
        case 5:
          _context2.n = 6;
          return clickText(container, 'Grok Imagine');
        case 6:
          // Mode control now shows the model default ("normal").
          (0, _vitest.expect)(buttons(container)).toContain('normal');
          (0, _vitest.expect)(buttons(container)).not.toContain('basic');
        case 7:
          return _context2.a(2);
      }
    }, _callee2);
  })), 30000);
});