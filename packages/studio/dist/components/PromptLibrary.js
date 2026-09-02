"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = PromptLibrary;
var _react = require("react");
var _registry = _interopRequireDefault(require("../skills/registry.json"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var PROMPT_CATEGORIES = ['visual', 'motion', 'social', 'edit', 'workflow'];
var CATEGORY_LABELS = {
  all: 'All',
  visual: 'Visual',
  motion: 'Motion',
  social: 'Social',
  edit: 'Edit',
  workflow: 'Workflow'
};
function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)["catch"](function () {
      return fallbackCopy(text);
    });
  }
  return fallbackCopy(text);
}
function fallbackCopy(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (err) {
    /* no-op: copy best effort */
  }
}
function PromptLibrary(_ref) {
  var apiKey = _ref.apiKey;
  var _useState = (0, _react.useState)('all'),
    _useState2 = _slicedToArray(_useState, 2),
    activeCat = _useState2[0],
    setActiveCat = _useState2[1];
  var _useState3 = (0, _react.useState)(null),
    _useState4 = _slicedToArray(_useState3, 2),
    expanded = _useState4[0],
    setExpanded = _useState4[1];
  var _useState5 = (0, _react.useState)(null),
    _useState6 = _slicedToArray(_useState5, 2),
    copiedKey = _useState6[0],
    setCopiedKey = _useState6[1];
  var promptsByCat = _registry["default"].prompts || {};
  var presentCats = PROMPT_CATEGORIES.filter(function (c) {
    return Array.isArray(promptsByCat[c]);
  });
  var allPrompts = presentCats.flatMap(function (cat) {
    return promptsByCat[cat].map(function (p) {
      return _objectSpread(_objectSpread({}, p), {}, {
        category: cat
      });
    });
  });
  var filtered = activeCat === 'all' ? allPrompts : allPrompts.filter(function (p) {
    return p.category === activeCat;
  });
  var tabs = ['all'].concat(_toConsumableArray(presentCats));
  var handleEnhance = function handleEnhance(item) {
    var key = item.title + '|' + item.category;
    copyToClipboard(item.prompt);
    setCopiedKey(key);
    setTimeout(function () {
      return setCopiedKey(function (k) {
        return k === key ? null : k;
      });
    }, 1600);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex flex-wrap gap-2",
      children: tabs.map(function (cat) {
        var active = activeCat === cat;
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: function onClick() {
            return setActiveCat(cat);
          },
          className: "rounded-full border px-4 py-1.5 text-sm transition ".concat(active ? 'border-[#22d3ee] bg-[#22d3ee]/15 text-[#22d3ee]' : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20 hover:text-white'),
          children: CATEGORY_LABELS[cat] || cat
        }, cat);
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
      children: filtered.map(function (item, idx) {
        var key = item.title + '|' + item.category + '|' + idx;
        var isOpen = expanded === key;
        var isCopied = copiedKey === item.title + '|' + item.category;
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col rounded-lg border border-white/10 bg-black/60 p-4 backdrop-blur transition hover:border-[#22d3ee]/40",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex items-start justify-between gap-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
              className: "text-sm font-semibold text-white",
              children: item.title
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ".concat(item.category === 'workflow' ? 'border-purple-400/40 bg-purple-500/15 text-purple-300' : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'),
              children: item.category
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "mt-2",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50",
              children: item.model || 'unknown'
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            onClick: function onClick() {
              return setExpanded(isOpen ? null : key);
            },
            className: "mt-3 cursor-pointer text-sm text-white/60 ".concat(isOpen ? '' : 'line-clamp-3'),
            children: item.prompt
          }), item.params && Object.keys(item.params).length > 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "mt-2 flex flex-wrap gap-1",
            children: Object.entries(item.params).map(function (_ref2) {
              var _ref3 = _slicedToArray(_ref2, 2),
                k = _ref3[0],
                v = _ref3[1];
              return /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/40",
                children: [k, ": ", String(v)]
              }, k);
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "mt-auto flex gap-2 pt-4",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setExpanded(isOpen ? null : key);
              },
              className: "flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:text-white",
              children: isOpen ? 'Collapse' : 'Show Full'
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return handleEnhance(item);
              },
              className: "flex-1 rounded-md border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-3 py-2 text-sm font-semibold text-[#22d3ee] transition hover:bg-[#22d3ee]/20",
              children: isCopied ? 'Copied!' : 'Enhance'
            })]
          })]
        }, key);
      })
    }), filtered.length === 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
      className: "text-sm text-white/40",
      children: "No prompts in this category yet."
    })]
  });
}