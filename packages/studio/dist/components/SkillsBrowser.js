"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = SkillsBrowser;
var _react = require("react");
var _registry = _interopRequireDefault(require("../skills/registry.json"));
var _navigation = require("next/navigation");
var _skillStore = require("../lib/skillStore");
var _SkillRunner = _interopRequireDefault(require("./SkillRunner"));
var _PromptLibrary = _interopRequireDefault(require("./PromptLibrary"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var CATEGORIES = ['all', 'visual', 'motion', 'social', 'edit', 'workflow'];
var CATEGORY_LABELS = {
  all: 'All',
  visual: 'Visual',
  motion: 'Motion',
  social: 'Social',
  edit: 'Edit',
  workflow: 'Workflow'
};
function SkillsBrowser(_ref) {
  var apiKey = _ref.apiKey;
  var router = (0, _navigation.useRouter)();
  var _useState = (0, _react.useState)('all'),
    _useState2 = _slicedToArray(_useState, 2),
    activeCat = _useState2[0],
    setActiveCat = _useState2[1];
  var _useState3 = (0, _react.useState)(null),
    _useState4 = _slicedToArray(_useState3, 2),
    runnerSkill = _useState4[0],
    setRunnerSkill = _useState4[1];
  var _useState5 = (0, _react.useState)('skills'),
    _useState6 = _slicedToArray(_useState5, 2),
    view = _useState6[0],
    setView = _useState6[1];
  var skills = _registry["default"].skills || [];
  var filtered = activeCat === 'all' ? skills : skills.filter(function (s) {
    return (s.category || '').toLowerCase() === activeCat;
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex flex-wrap gap-2",
      children: [{
        id: 'skills',
        label: 'Skills'
      }, {
        id: 'prompts',
        label: 'Prompt Library'
      }].map(function (tab) {
        var active = view === tab.id;
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: function onClick() {
            return setView(tab.id);
          },
          className: "rounded-full border px-4 py-1.5 text-sm transition ".concat(active ? 'border-[#22d3ee] bg-[#22d3ee]/15 text-[#22d3ee]' : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20 hover:text-white'),
          children: tab.label
        }, tab.id);
      })
    }), view === 'prompts' ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptLibrary["default"], {
      apiKey: apiKey
    }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex flex-wrap gap-2",
        children: CATEGORIES.map(function (cat) {
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
        children: filtered.map(function (skill) {
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col rounded-lg border border-white/10 bg-black/60 p-4 backdrop-blur transition hover:border-[#22d3ee]/40",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-start justify-between gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
                className: "text-sm font-semibold text-white",
                children: skill.name
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ".concat((skill.kind || 'recipe') === 'workflow' ? 'border-purple-400/40 bg-purple-500/15 text-purple-300' : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'),
                children: skill.kind === 'workflow' ? 'Workflow' : 'Recipe'
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "mt-2 line-clamp-2 text-sm text-white/60",
              children: skill.description
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "mt-3",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50",
                children: skill.category || 'uncategorized'
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "mt-auto pt-4",
              children: skill.kind === 'workflow' ? /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                onClick: function onClick() {
                  return setRunnerSkill(skill);
                },
                className: "w-full rounded-md border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-3 py-2 text-sm font-semibold text-[#22d3ee] transition hover:bg-[#22d3ee]/20",
                children: "Run Skill"
              }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                onClick: function onClick() {
                  (0, _skillStore.setPendingRecipe)(skill.slug, skill.studio);
                  router.push('/studio/' + skill.studio);
                },
                className: "w-full rounded-md bg-[#22d3ee] px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300",
                children: "Open in Studio"
              })
            })]
          }, skill.slug);
        })
      }), runnerSkill && /*#__PURE__*/(0, _jsxRuntime.jsx)(_SkillRunner["default"], {
        skill: runnerSkill,
        apiKey: apiKey,
        onClose: function onClose() {
          return setRunnerSkill(null);
        }
      })]
    })]
  });
}