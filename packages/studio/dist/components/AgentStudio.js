"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = AgentStudio;
var _react = require("react");
var _navigation = require("next/navigation");
var _muapi = require("../muapi.js");
var _jsxRuntime = require("react/jsx-runtime");
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
// The API client (muapi.js) already rewrites upstream artwork URLs (thumbnail /
// icon_url) into either a same-origin local path or an /api/thumbnail proxy URL.
// If the value is already a same-origin path, use it directly instead of
// re-wrapping it (which would produce a broken "/api/thumbnail?url=/api/thumbnail?...").
function toProxiedIcon(rawUrl) {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("/")) return rawUrl;
  return "/api/thumbnail?url=".concat(encodeURIComponent(rawUrl));
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  var utcStr = dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  var diff = Math.floor((Date.now() - new Date(utcStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return "".concat(Math.floor(diff / 60), "m ago");
  if (diff < 86400) return "".concat(Math.floor(diff / 3600), "h ago");
  if (diff < 604800) return "".concat(Math.floor(diff / 86400), "d ago");
  return new Date(utcStr).toLocaleDateString();
}

// ─── Agent Card (grid) ───────────────────────────────────────────────────────
function AgentCard(_ref) {
  var agent = _ref.agent,
    _onClick = _ref.onClick,
    onEdit = _ref.onEdit;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    imgError = _useState2[0],
    setImgError = _useState2[1];
  // Route the upstream icon through the same-origin proxy (and fall back to the
  // raw URL if the proxy fails) so CDN hotlink protection can't block the image.
  var hasIcon = !!agent.icon_url;
  var proxiedIcon = toProxiedIcon(agent.icon_url);
  var showIcon = hasIcon && proxiedIcon && !imgError;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "group relative aspect-[4/5] rounded-xl cursor-pointer",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      onClick: function onClick() {
        return _onClick(agent);
      },
      className: "absolute inset-0 rounded-xl overflow-hidden border border-white/5 bg-[#0a0a0a] transition-all group-hover:border-[#22d3ee]/30 group-hover:scale-[1.02] shadow-2xl",
      children: [showIcon ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: proxiedIcon,
        alt: agent.name,
        onError: function onError() {
          return setImgError(true);
        },
        className: "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      }) : hasIcon ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
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
          children: agent.category || "AI Assistant"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
          className: "text-sm font-bold text-white truncate group-hover:text-[#22d3ee] transition-colors",
          children: agent.name || "Unnamed Agent"
        }), agent.owner_username && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
          className: "text-[9px] text-white/40 mt-1 uppercase tracking-tighter font-black",
          children: ["By ", agent.owner_username]
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
    _onClick2 = _ref2.onClick;
  var _useState3 = (0, _react.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    imgError = _useState4[0],
    setImgError = _useState4[1];
  var displayTitle = conv.title || "New Chat";
  var agentSlug = conv.agent_slug || conv.agent_id;
  var hasIcon = !!conv.agent_icon_url;
  var proxiedIcon = toProxiedIcon(conv.agent_icon_url);
  var showIcon = hasIcon && proxiedIcon && !imgError;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    onClick: function onClick() {
      return _onClick2(agentSlug, conv.id);
    },
    className: "group flex flex-col gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-[#22d3ee]/20 hover:bg-white/5 transition-all cursor-pointer",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center gap-3",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "relative w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/5 shrink-0",
        children: showIcon ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: proxiedIcon,
          alt: conv.agent_name || "Agent",
          onError: function onError() {
            return setImgError(true);
          },
          className: "w-full h-full object-cover"
        }) : hasIcon ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
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
          children: conv.agent_name || "Unknown Agent"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-sm font-bold text-white truncate",
          title: displayTitle,
          children: displayTitle
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center justify-between pt-2 border-t border-white/5 mt-auto text-[10px] text-white/30 font-medium",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        children: timeAgo(conv.updated_at)
      }), conv.message_count != null && /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
        children: [conv.message_count, " msgs"]
      })]
    })]
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────
var TABS = ["templates", "my-agents", "my-chats"];
function AgentStudio(_ref3) {
  var apiKey = _ref3.apiKey,
    templateData = _ref3.templateData;
  var router = (0, _navigation.useRouter)();
  var _useState5 = (0, _react.useState)("templates"),
    _useState6 = _slicedToArray(_useState5, 2),
    activeMainTab = _useState6[0],
    setActiveMainTab = _useState6[1];
  var _useState7 = (0, _react.useState)([]),
    _useState8 = _slicedToArray(_useState7, 2),
    agents = _useState8[0],
    setAgents = _useState8[1];
  var _useState9 = (0, _react.useState)([]),
    _useState0 = _slicedToArray(_useState9, 2),
    conversations = _useState0[0],
    setConversations = _useState0[1];
  var _useState1 = (0, _react.useState)(true),
    _useState10 = _slicedToArray(_useState1, 2),
    loading = _useState10[0],
    setLoading = _useState10[1];
  var _useState11 = (0, _react.useState)(null),
    _useState12 = _slicedToArray(_useState11, 2),
    error = _useState12[0],
    setError = _useState12[1];

  // ── Apply template data from landing page "Create This Style" ──────────────
  var templateApplied = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    if (!templateData || templateApplied.current === templateData.slug) return;
    templateApplied.current = templateData.slug;
    // AgentStudio is a gallery/launcher; templateData is accepted for routing
    // but prompt pre-fill is handled by the standalone /agents pages.
  }, [templateData]);

  // Navigate to the standalone /agents page — AiAgent handles its own routing there
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
  (0, _react.useEffect)(function () {
    if (!apiKey) return;
    var cancelled = false;
    function load() {
      return _load.apply(this, arguments);
    }
    function _load() {
      _load = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var data, _data, _data2, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              setLoading(true);
              setError(null);
              setAgents([]);
              setConversations([]);
              _context.p = 1;
              if (!(activeMainTab === "templates")) {
                _context.n = 3;
                break;
              }
              _context.n = 2;
              return (0, _muapi.getTemplateAgents)(apiKey);
            case 2:
              data = _context.v;
              if (!cancelled) setAgents(data);
              _context.n = 7;
              break;
            case 3:
              if (!(activeMainTab === "my-agents")) {
                _context.n = 5;
                break;
              }
              _context.n = 4;
              return (0, _muapi.getUserAgents)(apiKey);
            case 4:
              _data = _context.v;
              if (!cancelled) setAgents(_data);
              _context.n = 7;
              break;
            case 5:
              if (!(activeMainTab === "my-chats")) {
                _context.n = 7;
                break;
              }
              _context.n = 6;
              return (0, _muapi.getUserConversations)(apiKey);
            case 6:
              _data2 = _context.v;
              if (!cancelled) setConversations(_data2);
            case 7:
              _context.n = 9;
              break;
            case 8:
              _context.p = 8;
              _t = _context.v;
              console.error("AgentStudio load error:", _t);
              if (!cancelled) setError(_t.message || "Failed to load.");
            case 9:
              _context.p = 9;
              if (!cancelled) setLoading(false);
              return _context.f(9);
            case 10:
              return _context.a(2);
          }
        }, _callee, null, [[1, 8, 9, 10]]);
      }));
      return _load.apply(this, arguments);
    }
    load();
    return function () {
      cancelled = true;
    };
  }, [apiKey, activeMainTab]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "h-full flex flex-col bg-[#030303] text-white",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex-shrink-0 h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/40",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center gap-8 h-full",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
          className: "text-sm font-black uppercase tracking-[0.2em] text-[#22d3ee]",
          children: "Agents"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex gap-1 bg-white/5 p-1 rounded-xl",
          children: TABS.map(function (tab) {
            return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              onClick: function onClick() {
                return setActiveMainTab(tab);
              },
              className: "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ".concat(activeMainTab === tab ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white hover:bg-white/5"),
              children: tab.replace(/-/g, " ")
            }, tab);
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
        onClick: handleCreateAgent,
        className: "px-6 py-2 bg-[#22d3ee] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#ebff66] transition-all active:scale-95 flex items-center gap-2",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-sm",
          children: "+"
        }), "Create"]
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
          children: "Retry"
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
          children: "No chats yet"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: function onClick() {
            return setActiveMainTab("templates");
          },
          className: "text-[10px] text-[#22d3ee] hover:text-white border border-[#22d3ee]/20 hover:border-white/20 px-4 py-2 rounded-lg transition-colors",
          children: "Browse Templates"
        })]
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-[1600px] mx-auto",
        children: conversations.map(function (conv) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(ConversationCard, {
            conv: conv,
            onClick: handleOpenConversation
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
          children: "No agents found"
        })]
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 max-w-[1600px] mx-auto",
        children: agents.map(function (agent) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(AgentCard, {
            agent: agent,
            onClick: handleSelectAgent
          }, agent.agent_id || agent.id);
        })
      })
    })]
  });
}