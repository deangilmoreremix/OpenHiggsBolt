"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = AgentStudio;
var _react = require("react");
var _navigation = require("next/navigation");
var _reactMarkdown = _interopRequireDefault(require("react-markdown"));
var _remarkGfm = _interopRequireDefault(require("remark-gfm"));
var _muapi = require("../muapi.js");
var _agentStudio = _interopRequireDefault(require("../messages/en/agentStudio.json"));
var _agentStudio2 = _interopRequireDefault(require("../messages/zh/agentStudio.json"));
var _i18nUtils = require("../i18nUtils");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
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
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; } // ─── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(dateStr, copy) {
  if (!dateStr) return "";
  var utcStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  var diff = Math.floor((Date.now() - new Date(utcStr)) / 1000);
  if (diff < 60) return copy.time.justNow;
  if (diff < 3600) return copy.time.minutesAgo.replace("{n}", Math.floor(diff / 60));
  if (diff < 86400) return copy.time.hoursAgo.replace("{n}", Math.floor(diff / 3600));
  if (diff < 604800) return copy.time.daysAgo.replace("{n}", Math.floor(diff / 86400));
  return new Date(utcStr).toLocaleDateString();
}

// ─── Agent Card (grid) ───────────────────────────────────────────────────────
function AgentCard(_ref) {
  var agent = _ref.agent,
    _onClick = _ref.onClick,
    onEdit = _ref.onEdit,
    copy = _ref.copy;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "group relative aspect-[4/5] rounded-xl cursor-pointer",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      onClick: function onClick() {
        return _onClick(agent);
      },
      className: "absolute inset-0 rounded-xl overflow-hidden border border-white/5 bg-[#0a0a0a] transition-all group-hover:border-[#22d3ee]/30 group-hover:scale-[1.02] shadow-2xl",
      children: [agent.icon_url ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: agent.icon_url,
        alt: agent.name,
        className: "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "40",
          height: "40",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "white",
          strokeWidth: "1",
          className: "opacity-20",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          })
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "absolute inset-x-0 bottom-0 p-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "text-[10px] font-bold text-[#22d3ee] uppercase tracking-wider mb-1 opacity-80",
          children: agent.category || copy.card.defaultCategory
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
          className: "text-sm font-bold text-white truncate group-hover:text-[#22d3ee] transition-colors",
          children: agent.name || copy.card.unnamedAgent
        }), agent.owner_username && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
          className: "text-[9px] text-white/40 mt-1 uppercase tracking-tighter font-black",
          children: [copy.card.byPrefix, " ", agent.owner_username]
        })]
      })]
    }), onEdit && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      onClick: function onClick(e) {
        e.stopPropagation();
        onEdit(agent);
      },
      className: "absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-[#22d3ee] hover:text-black hover:scale-110 z-10",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        })]
      })
    })]
  });
}

// ─── Conversation Card (My Chats) ────────────────────────────────────────────
function ConversationCard(_ref2) {
  var conv = _ref2.conv,
    _onClick2 = _ref2.onClick,
    copy = _ref2.copy;
  var displayTitle = conv.title || copy.card.newChat;
  var agentSlug = conv.agent_slug || conv.agent_id;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    onClick: function onClick() {
      return _onClick2(agentSlug, conv.id);
    },
    className: "group flex flex-col gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-[#22d3ee]/20 hover:bg-white/5 transition-all cursor-pointer",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center gap-3",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "relative w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/5 shrink-0",
        children: conv.agent_icon_url ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: conv.agent_icon_url,
          alt: conv.agent_name || "Agent",
          className: "w-full h-full object-cover"
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-full h-full flex items-center justify-center text-white/20",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            })
          })
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex-1 min-w-0",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-[10px] font-black text-[#22d3ee] uppercase tracking-wider truncate",
          children: conv.agent_name || copy.card.unknownAgent
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-sm font-bold text-white truncate",
          title: displayTitle,
          children: displayTitle
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center justify-between pt-2 border-t border-white/5 mt-auto text-[10px] text-white/30 font-medium",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        children: timeAgo(conv.updated_at, copy)
      }), conv.message_count != null && /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
        children: [conv.message_count, " ", copy.card.msgsSuffix]
      })]
    })]
  });
}

// Conversation history entries can carry `content` as a plain string or as a
// list of structured blocks (matches the shape agent_router.py's own last-message
// preview extraction already assumes for the "My Chats" list).
function textFromContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(function (b) {
      return typeof b === "string" ? b : (b === null || b === void 0 ? void 0 : b.text) || "";
    }).join("\n");
  }
  return "";
}
function ChatBubble(_ref3) {
  var message = _ref3.message;
  var isUser = message.role === "user";
  var text = textFromContent(message.content);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "flex ".concat(isUser ? "justify-end" : "justify-start"),
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ".concat(isUser ? "bg-[#22d3ee] text-black font-medium" : "bg-white/[0.04] border border-white/5 text-white/90"),
      children: isUser ? /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "whitespace-pre-wrap",
        children: text
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "prose prose-invert prose-sm max-w-none prose-p:my-2 prose-pre:bg-black/40",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactMarkdown["default"], {
          remarkPlugins: [_remarkGfm["default"]],
          children: text || "…"
        })
      })
    })
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────
var TABS = ["templates", "my-agents", "my-chats"];
function AgentStudio(_ref4) {
  var apiKey = _ref4.apiKey,
    _ref4$locale = _ref4.locale,
    locale = _ref4$locale === void 0 ? "en" : _ref4$locale;
  var router = (0, _navigation.useRouter)();
  var params = (0, _navigation.useParams)();
  var copy = (0, _i18nUtils.resolveCopy)(_agentStudio["default"], _agentStudio2["default"], locale);
  var _useState = (0, _react.useState)("templates"),
    _useState2 = _slicedToArray(_useState, 2),
    activeMainTab = _useState2[0],
    setActiveMainTab = _useState2[1];
  var _useState3 = (0, _react.useState)([]),
    _useState4 = _slicedToArray(_useState3, 2),
    agents = _useState4[0],
    setAgents = _useState4[1];
  var _useState5 = (0, _react.useState)([]),
    _useState6 = _slicedToArray(_useState5, 2),
    conversations = _useState6[0],
    setConversations = _useState6[1];
  var _useState7 = (0, _react.useState)(true),
    _useState8 = _slicedToArray(_useState7, 2),
    loading = _useState8[0],
    setLoading = _useState8[1];
  var _useState9 = (0, _react.useState)(null),
    _useState0 = _slicedToArray(_useState9, 2),
    error = _useState0[0],
    setError = _useState0[1];

  // Deep-link routing. `router.push('/agents/...')` below is a real full navigation
  // away from the studio shell on muapi.ai (BYOK/dashboard) — AiAgent's own standalone
  // pages handle it there, unaffected. On a white-label custom domain the same push is
  // transparently rewritten by middleware.js back to this same catch-all shell route, so
  // reading it back out via useParams() here drives an inline view instead of navigating
  // anywhere — see docs/whitelabel_plan.md for the full routing writeup.
  var tabSegments = Array.isArray(params === null || params === void 0 ? void 0 : params.tab) ? params.tab : [];
  var agentsIdx = tabSegments.indexOf("agents");
  var urlAgentSlug = agentsIdx === -1 ? null : tabSegments[agentsIdx + 1] || null;
  var urlConversationId = agentsIdx === -1 ? null : tabSegments[agentsIdx + 2] || null;
  var _useState1 = (0, _react.useState)("list"),
    _useState10 = _slicedToArray(_useState1, 2),
    view = _useState10[0],
    setView = _useState10[1]; // 'list' | 'chat' | 'create'
  var _useState11 = (0, _react.useState)(null),
    _useState12 = _slicedToArray(_useState11, 2),
    activeAgent = _useState12[0],
    setActiveAgent = _useState12[1];
  var _useState13 = (0, _react.useState)(null),
    _useState14 = _slicedToArray(_useState13, 2),
    conversationId = _useState14[0],
    setConversationId = _useState14[1];
  var _useState15 = (0, _react.useState)([]),
    _useState16 = _slicedToArray(_useState15, 2),
    chatMessages = _useState16[0],
    setChatMessages = _useState16[1];
  var _useState17 = (0, _react.useState)(""),
    _useState18 = _slicedToArray(_useState17, 2),
    chatInput = _useState18[0],
    setChatInput = _useState18[1];
  var _useState19 = (0, _react.useState)(false),
    _useState20 = _slicedToArray(_useState19, 2),
    chatLoading = _useState20[0],
    setChatLoading = _useState20[1];
  var _useState21 = (0, _react.useState)(false),
    _useState22 = _slicedToArray(_useState21, 2),
    sending = _useState22[0],
    setSending = _useState22[1];
  var _useState23 = (0, _react.useState)(null),
    _useState24 = _slicedToArray(_useState23, 2),
    chatError = _useState24[0],
    setChatError = _useState24[1];
  var _useState25 = (0, _react.useState)({
      name: "",
      description: "",
      system_prompt: "",
      welcome_message: ""
    }),
    _useState26 = _slicedToArray(_useState25, 2),
    createForm = _useState26[0],
    setCreateForm = _useState26[1];
  var _useState27 = (0, _react.useState)(false),
    _useState28 = _slicedToArray(_useState27, 2),
    creating = _useState28[0],
    setCreating = _useState28[1];
  var _useState29 = (0, _react.useState)(null),
    _useState30 = _slicedToArray(_useState29, 2),
    createError = _useState30[0],
    setCreateError = _useState30[1];

  // Navigate to the standalone /agents page — AiAgent handles its own routing there
  // (on a custom domain, this instead drives the inline view below via urlAgentSlug)
  var handleSelectAgent = (0, _react.useCallback)(function (agent) {
    var id = agent.agent_id || agent.id;
    router.push("/agents/".concat(id));
  }, [router]);
  var handleEditAgent = (0, _react.useCallback)(function (agent) {
    var id = agent.agent_id || agent.id;
    router.push("/agents/edit/".concat(id));
  }, [router]);
  var handleCreateAgent = (0, _react.useCallback)(function () {
    router.push("/agents/create");
  }, [router]);
  var handleOpenConversation = (0, _react.useCallback)(function (agentSlug, convId) {
    router.push("/agents/".concat(agentSlug, "/").concat(convId));
  }, [router]);

  // Resolve the inline view from the URL. 'edit' isn't built inline yet (only used
  // from the standalone dashboard today) — treat it as "back to list" rather than
  // trying to load an agent named "edit" and showing a confusing error.
  (0, _react.useEffect)(function () {
    if (!apiKey) return;
    if (!urlAgentSlug || urlAgentSlug === "edit") {
      setView("list");
      return;
    }
    if (urlAgentSlug === "create") {
      setView("create");
      return;
    }
    var cancelled = false;
    function openFromUrl() {
      return _openFromUrl.apply(this, arguments);
    }
    function _openFromUrl() {
      _openFromUrl = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var agent, conv, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              setChatLoading(true);
              setChatError(null);
              _context.p = 1;
              _context.n = 2;
              return (0, _muapi.getAgentBySlug)(apiKey, urlAgentSlug);
            case 2:
              agent = _context.v;
              if (!cancelled) {
                _context.n = 3;
                break;
              }
              return _context.a(2);
            case 3:
              setActiveAgent(agent);
              if (!urlConversationId) {
                _context.n = 6;
                break;
              }
              _context.n = 4;
              return (0, _muapi.getAgentConversation)(apiKey, urlAgentSlug, urlConversationId);
            case 4:
              conv = _context.v;
              if (!cancelled) {
                _context.n = 5;
                break;
              }
              return _context.a(2);
            case 5:
              setConversationId(conv.id);
              setChatMessages(conv.history || []);
              _context.n = 7;
              break;
            case 6:
              setConversationId(null);
              setChatMessages([]);
            case 7:
              setView("chat");
              _context.n = 9;
              break;
            case 8:
              _context.p = 8;
              _t = _context.v;
              if (!cancelled) setChatError(_t.message || copy.errors.loadAgentFailed);
            case 9:
              _context.p = 9;
              if (!cancelled) setChatLoading(false);
              return _context.f(9);
            case 10:
              return _context.a(2);
          }
        }, _callee, null, [[1, 8, 9, 10]]);
      }));
      return _openFromUrl.apply(this, arguments);
    }
    openFromUrl();
    return function () {
      cancelled = true;
    };
  }, [apiKey, urlAgentSlug, urlConversationId]);
  var handleSendMessage = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var text, agentSlug, _yield$sendAgentChatM, request_id, result, assistantMessage, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          if (!(!chatInput.trim() || sending || !activeAgent)) {
            _context2.n = 1;
            break;
          }
          return _context2.a(2);
        case 1:
          text = chatInput.trim();
          setChatInput("");
          setChatMessages(function (prev) {
            return [].concat(_toConsumableArray(prev), [{
              role: "user",
              content: text
            }]);
          });
          setSending(true);
          setChatError(null);
          _context2.p = 2;
          agentSlug = activeAgent.agent_id;
          _context2.n = 3;
          return (0, _muapi.sendAgentChatMessage)(apiKey, agentSlug, {
            message: text,
            conversationId: conversationId
          });
        case 3:
          _yield$sendAgentChatM = _context2.v;
          request_id = _yield$sendAgentChatM.request_id;
          _context2.n = 4;
          return (0, _muapi.pollAgentChatResult)(apiKey, request_id);
        case 4:
          result = _context2.v;
          // result.messages is only this turn's assistant/pulse entries, not the
          // full transcript (see AiAgent.jsx) — append, don't replace, or every
          // send wipes the user's own message and all prior history from view.
          assistantMessage = (result.messages || []).find(function (m) {
            return m.role === "assistant" && m.content;
          });
          setChatMessages(function (prev) {
            return [].concat(_toConsumableArray(prev), [assistantMessage || {
              role: "assistant",
              content: ""
            }]);
          });
          if (result.conversation_id && result.conversation_id !== conversationId) {
            setConversationId(result.conversation_id);
            router.replace("/agents/".concat(agentSlug, "/").concat(result.conversation_id), {
              scroll: false
            });
          }
          _context2.n = 6;
          break;
        case 5:
          _context2.p = 5;
          _t2 = _context2.v;
          setChatError(_t2.message || copy.errors.sendFailed);
        case 6:
          _context2.p = 6;
          setSending(false);
          return _context2.f(6);
        case 7:
          return _context2.a(2);
      }
    }, _callee2, null, [[2, 5, 6, 7]]);
  })), [apiKey, activeAgent, conversationId, chatInput, sending, router]);
  var handleCreateSubmit = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(e) {
      var created, _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            e.preventDefault();
            if (!(!createForm.name.trim() || !createForm.system_prompt.trim() || creating)) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            setCreating(true);
            setCreateError(null);
            _context3.p = 2;
            _context3.n = 3;
            return (0, _muapi.createAgent)(apiKey, {
              name: createForm.name.trim(),
              description: createForm.description.trim() || null,
              system_prompt: createForm.system_prompt.trim(),
              welcome_message: createForm.welcome_message.trim() || null,
              skill_ids: []
            });
          case 3:
            created = _context3.v;
            router.push("/agents/".concat(created.agent_id));
            _context3.n = 5;
            break;
          case 4:
            _context3.p = 4;
            _t3 = _context3.v;
            setCreateError(_t3.message || copy.errors.createFailed);
          case 5:
            _context3.p = 5;
            setCreating(false);
            return _context3.f(5);
          case 6:
            return _context3.a(2);
        }
      }, _callee3, null, [[2, 4, 5, 6]]);
    }));
    return function (_x) {
      return _ref6.apply(this, arguments);
    };
  }(), [apiKey, createForm, creating, router]);
  (0, _react.useEffect)(function () {
    if (!apiKey || view !== "list") return;
    var cancelled = false;
    function load() {
      return _load.apply(this, arguments);
    }
    function _load() {
      _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        var data, _data, _data2, _t4;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              setLoading(true);
              setError(null);
              setAgents([]);
              setConversations([]);
              _context4.p = 1;
              if (!(activeMainTab === "templates")) {
                _context4.n = 3;
                break;
              }
              _context4.n = 2;
              return (0, _muapi.getTemplateAgents)(apiKey);
            case 2:
              data = _context4.v;
              if (!cancelled) setAgents(data);
              _context4.n = 7;
              break;
            case 3:
              if (!(activeMainTab === "my-agents")) {
                _context4.n = 5;
                break;
              }
              _context4.n = 4;
              return (0, _muapi.getUserAgents)(apiKey);
            case 4:
              _data = _context4.v;
              if (!cancelled) setAgents(_data);
              _context4.n = 7;
              break;
            case 5:
              if (!(activeMainTab === "my-chats")) {
                _context4.n = 7;
                break;
              }
              _context4.n = 6;
              return (0, _muapi.getUserConversations)(apiKey);
            case 6:
              _data2 = _context4.v;
              if (!cancelled) setConversations(_data2);
            case 7:
              _context4.n = 9;
              break;
            case 8:
              _context4.p = 8;
              _t4 = _context4.v;
              console.error("AgentStudio load error:", _t4);
              if (!cancelled) setError(_t4.message || copy.errors.loadFailed);
            case 9:
              _context4.p = 9;
              if (!cancelled) setLoading(false);
              return _context4.f(9);
            case 10:
              return _context4.a(2);
          }
        }, _callee4, null, [[1, 8, 9, 10]]);
      }));
      return _load.apply(this, arguments);
    }
    load();
    return function () {
      cancelled = true;
    };
  }, [apiKey, activeMainTab, view]);

  // ── Render: Create ───────────────────────────────────────────────────────────
  if (view === "create") {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "h-full flex flex-col bg-[#030303] text-white overflow-y-auto custom-scrollbar",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex-shrink-0 h-16 border-b border-white/5 flex items-center gap-6 px-8 bg-black/40",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          onClick: function onClick() {
            return router.push("/agents");
          },
          className: "flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors",
          type: "button",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M19 12H5M12 19l-7-7 7-7"
            })
          }), copy.buttons.back]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
          className: "text-sm font-black uppercase tracking-[0.2em] text-[#22d3ee]",
          children: copy.headings.createAgent
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("form", {
        onSubmit: handleCreateSubmit,
        className: "max-w-2xl w-full mx-auto p-8 space-y-6",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
            className: "block text-[10px] font-black text-white/40 uppercase tracking-widest",
            children: copy.labels.name
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
            type: "text",
            required: true,
            value: createForm.name,
            onChange: function onChange(e) {
              return setCreateForm(function (f) {
                return _objectSpread(_objectSpread({}, f), {}, {
                  name: e.target.value
                });
              });
            },
            placeholder: copy.placeholders.name,
            className: "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
            className: "block text-[10px] font-black text-white/40 uppercase tracking-widest",
            children: copy.labels.description
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
            type: "text",
            value: createForm.description,
            onChange: function onChange(e) {
              return setCreateForm(function (f) {
                return _objectSpread(_objectSpread({}, f), {}, {
                  description: e.target.value
                });
              });
            },
            placeholder: copy.placeholders.description,
            className: "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
            className: "block text-[10px] font-black text-white/40 uppercase tracking-widest",
            children: copy.labels.systemPrompt
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
            required: true,
            value: createForm.system_prompt,
            onChange: function onChange(e) {
              return setCreateForm(function (f) {
                return _objectSpread(_objectSpread({}, f), {}, {
                  system_prompt: e.target.value
                });
              });
            },
            placeholder: copy.placeholders.systemPrompt,
            className: "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors min-h-[140px] resize-none"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
            className: "block text-[10px] font-black text-white/40 uppercase tracking-widest",
            children: copy.labels.welcomeMessage
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
            type: "text",
            value: createForm.welcome_message,
            onChange: function onChange(e) {
              return setCreateForm(function (f) {
                return _objectSpread(_objectSpread({}, f), {}, {
                  welcome_message: e.target.value
                });
              });
            },
            placeholder: copy.placeholders.welcomeMessage,
            className: "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
          })]
        }), createError && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-xs font-bold text-red-400",
          children: createError
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "submit",
          disabled: creating || !createForm.name.trim() || !createForm.system_prompt.trim(),
          className: "w-full py-4 bg-[#22d3ee] text-black text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all disabled:opacity-40 flex items-center justify-center gap-3",
          children: creating ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              children: copy.buttons.creating
            })]
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            children: copy.buttons.createAgentSubmit
          })
        })]
      })]
    });
  }

  // ── Render: Chat ─────────────────────────────────────────────────────────────
  if (view === "chat") {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "h-full flex flex-col bg-[#030303] text-white",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex-shrink-0 h-16 border-b border-white/5 flex items-center gap-4 px-8 bg-black/40",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          onClick: function onClick() {
            return router.push("/agents");
          },
          className: "flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors",
          type: "button",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M19 12H5M12 19l-7-7 7-7"
            })
          }), copy.buttons.back]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "h-4 w-[1px] bg-white/10"
        }), activeAgent && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/5 shrink-0",
            children: activeAgent.icon_url ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
              src: activeAgent.icon_url,
              alt: activeAgent.name,
              className: "w-full h-full object-cover"
            }) : null
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-sm font-bold text-white",
            children: activeAgent.name
          })]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4 max-w-3xl w-full mx-auto",
        children: chatLoading ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "h-full flex items-center justify-center",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-10 h-10 border-2 border-white/5 border-t-[#22d3ee] rounded-full animate-spin"
          })
        }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
          children: [chatMessages.length === 0 && (activeAgent === null || activeAgent === void 0 ? void 0 : activeAgent.welcome_message) && /*#__PURE__*/(0, _jsxRuntime.jsx)(ChatBubble, {
            message: {
              role: "assistant",
              content: activeAgent.welcome_message
            }
          }), chatMessages.map(function (msg, i) {
            return /*#__PURE__*/(0, _jsxRuntime.jsx)(ChatBubble, {
              message: msg
            }, i);
          }), sending && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex justify-start",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "bg-white/[0.04] border border-white/5 rounded-2xl px-4 py-3",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-4 h-4 border-2 border-white/10 border-t-[#22d3ee] rounded-full animate-spin"
              })
            })
          }), chatError && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
            className: "text-xs font-bold text-red-400",
            children: chatError
          })]
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-shrink-0 border-t border-white/5 p-6 bg-black/40",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("form", {
          onSubmit: function onSubmit(e) {
            e.preventDefault();
            handleSendMessage();
          },
          className: "max-w-3xl w-full mx-auto flex items-end gap-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
            value: chatInput,
            onChange: function onChange(e) {
              return setChatInput(e.target.value);
            },
            onKeyDown: function onKeyDown(e) {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            },
            placeholder: copy.placeholders.chatInput,
            rows: 1,
            className: "flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors resize-none max-h-40"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            type: "submit",
            disabled: !chatInput.trim() || sending,
            className: "px-5 py-3 bg-[#22d3ee] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:opacity-40",
            children: copy.buttons.send
          })]
        })
      })]
    });
  }

  // ── Render: List ──────────────────────────────────────────────────────────────
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "h-full flex flex-col bg-[#030303] text-white",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex-shrink-0 h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-8 h-full",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
          className: "text-sm font-black uppercase tracking-[0.2em] text-[#22d3ee]",
          children: copy.headings.agents
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex gap-1 bg-white/5 p-1 rounded-xl",
          children: TABS.map(function (tab) {
            return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setActiveMainTab(tab);
              },
              className: "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ".concat(activeMainTab === tab ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white hover:bg-white/5"),
              children: copy.tabs[tab] || tab.replace(/-/g, " ")
            }, tab);
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
        onClick: handleCreateAgent,
        className: "px-6 py-2 bg-[#22d3ee] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#ebff66] transition-all active:scale-95 flex items-center gap-2",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-sm",
          children: "+"
        }), copy.buttons.create]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex-1 overflow-y-auto custom-scrollbar p-8",
      children: loading ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "h-full flex items-center justify-center",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-10 h-10 border-2 border-white/5 border-t-[#22d3ee] rounded-full animate-spin"
        })
      }) : error ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "h-full flex flex-col items-center justify-center text-white/20 gap-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
          width: "40",
          height: "40",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1",
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
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-xs font-bold uppercase tracking-widest",
          children: error
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: function onClick() {
            return setActiveMainTab(activeMainTab);
          } // retrigger effect
          ,
          className: "text-[10px] text-white/40 hover:text-white border border-white/10 px-4 py-2 rounded-lg transition-colors",
          children: copy.buttons.retry
        })]
      }) : activeMainTab === "my-chats" ?
      // ── My Chats view ─────────────────────────────────────────────────
      conversations.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "h-full flex flex-col items-center justify-center text-white/10 gap-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "60",
          height: "60",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "0.5",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-[10px] font-black uppercase tracking-[0.3em]",
          children: copy.empty.noChats
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: function onClick() {
            return setActiveMainTab("templates");
          },
          className: "text-[10px] text-[#22d3ee] hover:text-white border border-[#22d3ee]/20 hover:border-white/20 px-4 py-2 rounded-lg transition-colors",
          children: copy.buttons.browseTemplates
        })]
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-[1600px] mx-auto",
        children: conversations.map(function (conv) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(ConversationCard, {
            conv: conv,
            onClick: handleOpenConversation,
            copy: copy
          }, conv.id);
        })
      }) :
      // ── Agents grid (templates / my-agents) ───────────────────────────
      agents.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "h-full flex flex-col items-center justify-center text-white/10 gap-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          width: "60",
          height: "60",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "0.5",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-[10px] font-black uppercase tracking-[0.3em]",
          children: copy.empty.noAgents
        })]
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 max-w-[1600px] mx-auto",
        children: agents.map(function (agent) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(AgentCard, {
            agent: agent,
            onClick: handleSelectAgent,
            copy: copy
          }, agent.agent_id || agent.id);
        })
      })
    })]
  });
}