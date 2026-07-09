"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = WorkflowStudio;
var _react = require("react");
var _navigation = require("next/navigation");
var _muapi = require("../muapi.js");
var _dynamic = _interopRequireDefault(require("next/dynamic"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t7 in e) "default" !== _t7 && {}.hasOwnProperty.call(e, _t7) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t7)) && (i.get || i.set) ? o(f, _t7, i) : f[_t7] = e[_t7]); return f; })(e, t); }
var WorkflowUI = (0, _dynamic["default"])(function () {
  return Promise.resolve().then(function () {
    return _interopRequireWildcard(require("./WorkflowUI"));
  });
}, {
  ssr: false,
  loading: function loading() {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute inset-0 flex items-center justify-center",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col items-center gap-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-12 h-12 border-4 border-white/5 border-t-[#22d3ee] rounded-full animate-spin"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
          children: "Loading Builder..."
        })]
      })
    });
  }
});
function WorkflowCard(_ref) {
  var workflow = _ref.workflow,
    _onClick = _ref.onClick,
    activeTab = _ref.activeTab,
    onRename = _ref.onRename,
    onDelete = _ref.onDelete;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    showOptions = _useState2[0],
    setShowOptions = _useState2[1];
  var _useState3 = (0, _react.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    imgError = _useState4[0],
    setImgError = _useState4[1];

  // If the local/proxied thumbnail fails, fall back to the original raw URL.
  var handleImgError = function handleImgError(e) {
    var src = e.currentTarget.src;
    var proxied = src.match(/[?&]url=([^&]+)/);
    var fallback = proxied ? decodeURIComponent(proxied[1]) : workflow.thumbnail;
    if (fallback && src !== fallback) {
      e.currentTarget.src = fallback;
    } else {
      setImgError(true);
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    onClick: function onClick() {
      return _onClick(workflow);
    },
    className: "group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-white/5 bg-[#0a0a0a] transition-all hover:border-[#22d3ee]/30 hover:scale-[1.02] shadow-2xl",
    children: [workflow.thumbnail && !imgError ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
      src: workflow.thumbnail,
      alt: workflow.name,
      className: "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
      onError: handleImgError
    }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
        width: "40",
        height: "40",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "white",
        strokeWidth: "1",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "opacity-20",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        })
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
    }), activeTab === 'my-workflows' && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "absolute top-2 right-2 z-30",
      onClick: function onClick(e) {
        e.stopPropagation();
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        onClick: function onClick() {
          return setShowOptions(!showOptions);
        },
        onBlur: function onBlur() {
          return setTimeout(function () {
            return setShowOptions(false);
          }, 200);
        },
        className: "w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
          width: "14",
          height: "14",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
            cx: "12",
            cy: "5",
            r: "1"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
            cx: "12",
            cy: "12",
            r: "1"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("circle", {
            cx: "12",
            cy: "19",
            r: "1"
          })]
        })
      }), showOptions && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "absolute top-10 right-0 w-32 bg-[#111] border border-white/10 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in duration-200",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          onClick: function onClick() {
            return onRename(workflow);
          },
          className: "w-full px-4 py-2 text-left text-[11px] font-bold text-white/70 hover:text-[#22d3ee] hover:bg-white/5 transition-colors flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.5",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
            })]
          }), "Rename"]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          onClick: function onClick() {
            return onDelete(workflow.id);
          },
          className: "w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.5",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
            })
          }), "Delete"]
        })]
      })]
    }), activeTab === 'published' && workflow.user_name && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "absolute top-2 left-2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
        src: workflow.user_profile || "/user_profile.png",
        alt: "profile",
        className: "w-4 h-4 rounded-full"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-[9px] font-black text-white/80 uppercase tracking-widest",
        children: workflow.user_name
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "absolute inset-x-0 bottom-0 p-4",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "text-[10px] font-bold text-[#22d3ee] uppercase tracking-wider mb-1 opacity-80",
        children: workflow.category || "General"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
        className: "text-sm font-bold text-white truncate group-hover:text-[#22d3ee] transition-colors",
        children: workflow.name || "Untitled Flow"
      })]
    })]
  });
}
function WorkflowStudio(_ref2) {
  var apiKey = _ref2.apiKey,
    _ref2$isHeaderVisible = _ref2.isHeaderVisible,
    isHeaderVisible = _ref2$isHeaderVisible === void 0 ? true : _ref2$isHeaderVisible,
    onToggleHeader = _ref2.onToggleHeader;
  var params = (0, _navigation.useParams)();
  var router = (0, _navigation.useRouter)();
  var slug = (params === null || params === void 0 ? void 0 : params.slug) || [];
  var idFromParams = params === null || params === void 0 ? void 0 : params.id; // exists on /workflow/[id]/[tab] route
  var tabFromParams = params === null || params === void 0 ? void 0 : params.tab; // exists on /workflow/[id]/[tab] route

  // Robustly extract ID and Tab from either route structure
  var getWorkflowInfo = (0, _react.useCallback)(function () {
    // Priority 1: Dedicated /workflow/[id]/[tab] route  
    if (idFromParams) {
      return {
        id: idFromParams,
        tab: tabFromParams || null
      };
    }
    // Priority 2: Catch-all /studio/[[...slug]] route
    var wfIndex = slug.findIndex(function (s) {
      return s === 'workflows' || s === 'workflow';
    });
    if (wfIndex === -1) return {
      id: null,
      tab: null
    };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);
  var _getWorkflowInfo = getWorkflowInfo(),
    urlWorkflowId = _getWorkflowInfo.id,
    urlTab = _getWorkflowInfo.tab;
  var _useState5 = (0, _react.useState)([]),
    _useState6 = _slicedToArray(_useState5, 2),
    workflows = _useState6[0],
    setWorkflows = _useState6[1];
  var _useState7 = (0, _react.useState)(true),
    _useState8 = _slicedToArray(_useState7, 2),
    loading = _useState8[0],
    setLoading = _useState8[1];
  var _useState9 = (0, _react.useState)(null),
    _useState0 = _slicedToArray(_useState9, 2),
    selectedWorkflow = _useState0[0],
    setSelectedWorkflow = _useState0[1];
  var _useState1 = (0, _react.useState)("playground"),
    _useState10 = _slicedToArray(_useState1, 2),
    activeSubTab = _useState10[0],
    setActiveSubTab = _useState10[1]; // 'playground' | 'builder'
  var _useState11 = (0, _react.useState)("templates"),
    _useState12 = _slicedToArray(_useState11, 2),
    activeMainTab = _useState12[0],
    setActiveMainTab = _useState12[1]; // 'templates' | 'my-workflows' | 'published'
  var _useState13 = (0, _react.useState)(null),
    _useState14 = _slicedToArray(_useState13, 2),
    renamingWorkflow = _useState14[0],
    setRenamingWorkflow = _useState14[1];
  var _useState15 = (0, _react.useState)(""),
    _useState16 = _slicedToArray(_useState15, 2),
    newWorkflowName = _useState16[0],
    setNewWorkflowName = _useState16[1];
  var _useState17 = (0, _react.useState)(null),
    _useState18 = _slicedToArray(_useState17, 2),
    isDeletingId = _useState18[0],
    setIsDeletingId = _useState18[1];
  var _useState19 = (0, _react.useState)(null),
    _useState20 = _slicedToArray(_useState19, 2),
    inputSchema = _useState20[0],
    setInputSchema = _useState20[1];
  var _useState21 = (0, _react.useState)(null),
    _useState22 = _slicedToArray(_useState21, 2),
    nodeSchemas = _useState22[0],
    setNodeSchemas = _useState22[1];
  var _useState23 = (0, _react.useState)(null),
    _useState24 = _slicedToArray(_useState23, 2),
    workflowDef = _useState24[0],
    setWorkflowDef = _useState24[1];
  var _useState25 = (0, _react.useState)({}),
    _useState26 = _slicedToArray(_useState25, 2),
    formData = _useState26[0],
    setFormData = _useState26[1];
  var _useState27 = (0, _react.useState)(false),
    _useState28 = _slicedToArray(_useState27, 2),
    isExecuting = _useState28[0],
    setIsExecuting = _useState28[1];
  var _useState29 = (0, _react.useState)(null),
    _useState30 = _slicedToArray(_useState29, 2),
    result = _useState30[0],
    setResult = _useState30[1];
  var _useState31 = (0, _react.useState)(null),
    _useState32 = _slicedToArray(_useState31, 2),
    error = _useState32[0],
    setError = _useState32[1];
  var _useState33 = (0, _react.useState)(""),
    _useState34 = _slicedToArray(_useState33, 2),
    webhookUrl = _useState34[0],
    setWebhookUrl = _useState34[1];
  var _useState35 = (0, _react.useState)("form"),
    _useState36 = _slicedToArray(_useState35, 2),
    playgroundView = _useState36[0],
    setPlaygroundView = _useState36[1]; // 'form' | 'api'
  var _useState37 = (0, _react.useState)(null),
    _useState38 = _slicedToArray(_useState37, 2),
    rawResult = _useState38[0],
    setRawResult = _useState38[1];
  var _useState39 = (0, _react.useState)(null),
    _useState40 = _slicedToArray(_useState39, 2),
    copiedKey = _useState40[0],
    setCopiedKey = _useState40[1];
  var _useState41 = (0, _react.useState)(false),
    _useState42 = _slicedToArray(_useState41, 2),
    showRaw = _useState42[0],
    setShowRaw = _useState42[1];

  // Handlers defined early so they can be used in effects
  var handleSelectWorkflow = (0, _react.useCallback)(/*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(wf) {
      var fromUrl,
        targetTab,
        _args = arguments;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            fromUrl = _args.length > 1 && _args[1] !== undefined ? _args[1] : false;
            setSelectedWorkflow(wf);
            setResult(null);
            setError(null);
            targetTab = urlTab || (activeMainTab === "templates" ? "builder" : "playground");
            setActiveSubTab(targetTab);
            if (!fromUrl) {
              // Always route to /workflow/[id] so the builder library's useParams().id resolves correctly
              router.push("/workflow/".concat(wf.id, "/").concat(targetTab));
            }
          case 1:
            return _context.a(2);
        }
      }, _callee);
    }));
    return function (_x) {
      return _ref3.apply(this, arguments);
    };
  }(), [router, urlTab, activeMainTab]);

  // Dedicated data fetching effect for the active workflow
  (0, _react.useEffect)(function () {
    if (!(selectedWorkflow !== null && selectedWorkflow !== void 0 && selectedWorkflow.id) || !apiKey) return;
    function loadWorkflowDetails() {
      return _loadWorkflowDetails.apply(this, arguments);
    }
    function _loadWorkflowDetails() {
      _loadWorkflowDetails = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var wfId, results, response, schema, initial, nodes, def, _def$nodes, reasons, message, isAuth, _t;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              _context2.p = 0;
              setLoading(true);
              wfId = selectedWorkflow.id; // Fetch everything in parallel with allSettled so one failure doesn't block the others
              _context2.n = 1;
              return Promise.allSettled([(0, _muapi.getWorkflowInputs)(apiKey, wfId), (0, _muapi.getAllNodeSchemas)(apiKey, wfId), (0, _muapi.getWorkflowData)(apiKey, wfId)]);
            case 1:
              results = _context2.v;
              // Process Input Schema
              if (results[0].status === "fulfilled") {
                response = results[0].value;
                schema = response.input_data || response;
                setInputSchema(schema);
                initial = {};
                Object.entries(schema.properties || {}).forEach(function (_ref4) {
                  var _ref5 = _slicedToArray(_ref4, 2),
                    key = _ref5[0],
                    prop = _ref5[1];
                  initial[key] = prop["default"] || (Array.isArray(prop.examples) ? prop.examples[0] : prop.examples) || "";
                });
                setFormData(initial);
              } else {
                console.warn("Input schema not available for this workflow:", results[0].reason);
                setInputSchema(null);
                setFormData({});
              }

              // Process Builder State
              nodes = results[1].status === "fulfilled" ? results[1].value : [];
              def = results[2].status === "fulfilled" ? results[2].value : {
                nodes: [],
                edges: []
              };
              setNodeSchemas(nodes);
              setWorkflowDef(def);
              if (results[1].status === "rejected" || results[2].status === "rejected") {
                reasons = [results[1].reason, results[2].reason].filter(Boolean).join(", ");
                console.error("Builder components failed to load:", reasons);
                if (!nodes.length && !((_def$nodes = def.nodes) !== null && _def$nodes !== void 0 && _def$nodes.length)) {
                  setError("Failed to load workflow data. If you're opening a template, enter a valid MuAPI key in Settings first.");
                }
              }
              _context2.n = 3;
              break;
            case 2:
              _context2.p = 2;
              _t = _context2.v;
              console.error("Critical error loading workflow details:", _t);
              message = (_t === null || _t === void 0 ? void 0 : _t.message) || String(_t);
              isAuth = /401|403|auth|credentials/i.test(message);
              setError(isAuth ? "Enter a valid MuAPI key to load this workflow." : "Critical error loading workflow: " + message);
              setNodeSchemas([]);
              setWorkflowDef({
                nodes: [],
                edges: []
              });
            case 3:
              _context2.p = 3;
              setLoading(false);
              return _context2.f(3);
            case 4:
              return _context2.a(2);
          }
        }, _callee2, null, [[0, 2, 3, 4]]);
      }));
      return _loadWorkflowDetails.apply(this, arguments);
    }
    loadWorkflowDetails();
  }, [selectedWorkflow === null || selectedWorkflow === void 0 ? void 0 : selectedWorkflow.id, apiKey]);
  var handleCreateWorkflow = (0, _react.useCallback)(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var fromUrl,
      payload,
      response,
      _args3 = arguments,
      _t2;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          fromUrl = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : false;
          _context3.p = 1;
          setLoading(true);
          if (fromUrl) {
            _context3.n = 3;
            break;
          }
          payload = {
            workflow_id: null,
            name: "Untitled Workflow",
            edges: [],
            data: {
              nodes: []
            }
          };
          _context3.n = 2;
          return (0, _muapi.createWorkflow)(apiKey, payload);
        case 2:
          response = _context3.v;
          // Route to /workflow/[id] so useParams().id works in the builder library
          router.push("/workflow/".concat(response.workflow_id, "/builder"));
          return _context3.a(2);
        case 3:
          // Initialize state for the new flow
          setSelectedWorkflow({
            id: null,
            name: "Untitled Workflow"
          });
          setNodeSchemas([]);
          setWorkflowDef({
            nodes: [],
            edges: []
          });
          setActiveSubTab("builder");
          _context3.n = 5;
          break;
        case 4:
          _context3.p = 4;
          _t2 = _context3.v;
          setError("Failed to initialize workflow: " + _t2.message);
        case 5:
          _context3.p = 5;
          setLoading(false);
          return _context3.f(5);
        case 6:
          return _context3.a(2);
      }
    }, _callee3, null, [[1, 4, 5, 6]]);
  })), [apiKey, router]);
  var handleDeleteWorkflow = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(wfId) {
      var _t3;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (confirm("Are you sure you want to delete this workflow?")) {
              _context4.n = 1;
              break;
            }
            return _context4.a(2);
          case 1:
            setIsDeletingId(wfId);
            _context4.p = 2;
            _context4.n = 3;
            return (0, _muapi.deleteWorkflow)(apiKey, wfId);
          case 3:
            setWorkflows(function (prev) {
              return prev.filter(function (w) {
                return w.id !== wfId;
              });
            });
            _context4.n = 5;
            break;
          case 4:
            _context4.p = 4;
            _t3 = _context4.v;
            console.error("Delete failed:", _t3);
            alert("Failed to delete workflow");
          case 5:
            _context4.p = 5;
            setIsDeletingId(null);
            return _context4.f(5);
          case 6:
            return _context4.a(2);
        }
      }, _callee4, null, [[2, 4, 5, 6]]);
    }));
    return function handleDeleteWorkflow(_x2) {
      return _ref7.apply(this, arguments);
    };
  }();
  var handleRenameWorkflow = /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(e) {
      var wfId, _t4;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            e === null || e === void 0 || e.preventDefault();
            if (!(!renamingWorkflow || !newWorkflowName.trim())) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2);
          case 1:
            wfId = renamingWorkflow.id;
            _context5.p = 2;
            _context5.n = 3;
            return (0, _muapi.updateWorkflowName)(apiKey, wfId, newWorkflowName);
          case 3:
            setWorkflows(function (prev) {
              return prev.map(function (w) {
                return w.id === wfId ? _objectSpread(_objectSpread({}, w), {}, {
                  name: newWorkflowName
                }) : w;
              });
            });
            if ((selectedWorkflow === null || selectedWorkflow === void 0 ? void 0 : selectedWorkflow.id) === wfId) {
              setSelectedWorkflow(_objectSpread(_objectSpread({}, selectedWorkflow), {}, {
                name: newWorkflowName
              }));
            }
            setRenamingWorkflow(null);
            _context5.n = 5;
            break;
          case 4:
            _context5.p = 4;
            _t4 = _context5.v;
            console.error("Rename failed:", _t4);
            alert("Failed to rename workflow");
          case 5:
            return _context5.a(2);
        }
      }, _callee5, null, [[2, 4]]);
    }));
    return function handleRenameWorkflow(_x3) {
      return _ref8.apply(this, arguments);
    };
  }();

  // KEY FIX: If the user is on /studio/workflows/[id], redirect to /workflow/[id]
  // so the builder library's useParams().id resolves correctly, preventing duplicate creation.
  (0, _react.useEffect)(function () {
    if (typeof window !== 'undefined' && urlWorkflowId && urlWorkflowId !== 'new') {
      var path = window.location.pathname;
      if (path.startsWith('/studio/workflows/')) {
        var tab = urlTab || 'builder';
        router.replace("/workflow/".concat(urlWorkflowId, "/").concat(tab));
      }
    }
  }, [urlWorkflowId, urlTab, router]);

  // 1. Sync state with URL on mount or URL change
  (0, _react.useEffect)(function () {
    if (loading) return;
    if (urlWorkflowId) {
      if (urlWorkflowId === "new") {
        if (!selectedWorkflow || selectedWorkflow.id !== null) {
          handleCreateWorkflow(true);
        }
      } else {
        var found = workflows.find(function (wf) {
          return wf.id === urlWorkflowId;
        });
        if (found) {
          if (!selectedWorkflow || selectedWorkflow.id !== urlWorkflowId) {
            handleSelectWorkflow(found, true);
          }
        } else if (!selectedWorkflow || selectedWorkflow.id !== urlWorkflowId) {
          // Fallback for deep-linking: attempt to open even if not in the current tab's list
          // handleSelectWorkflow fetches official name/data anyway
          handleSelectWorkflow({
            id: urlWorkflowId,
            name: "Loading..."
          }, true);
        }
      }
    } else if (selectedWorkflow) {
      setSelectedWorkflow(null);
    }
  }, [urlWorkflowId, workflows, loading, selectedWorkflow, handleCreateWorkflow, handleSelectWorkflow]);

  // Handle reload on exit to clear builder CSS
  (0, _react.useEffect)(function () {
    var fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    if (fromBuilder && (!urlWorkflowId || activeSubTab !== "builder")) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      window.location.reload();
    }
  }, [urlWorkflowId, activeSubTab]);
  (0, _react.useEffect)(function () {
    function loadWorkflows() {
      return _loadWorkflows.apply(this, arguments);
    }
    function _loadWorkflows() {
      _loadWorkflows = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        var data, _t5;
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.p = _context6.n) {
            case 0:
              if (apiKey) {
                _context6.n = 1;
                break;
              }
              setLoading(false);
              return _context6.a(2);
            case 1:
              _context6.p = 1;
              setLoading(true);
              data = [];
              if (!(activeMainTab === "templates")) {
                _context6.n = 3;
                break;
              }
              _context6.n = 2;
              return (0, _muapi.getTemplateWorkflows)(apiKey);
            case 2:
              data = _context6.v;
              _context6.n = 7;
              break;
            case 3:
              if (!(activeMainTab === "my-workflows")) {
                _context6.n = 5;
                break;
              }
              _context6.n = 4;
              return (0, _muapi.getUserWorkflows)(apiKey);
            case 4:
              data = _context6.v;
              _context6.n = 7;
              break;
            case 5:
              if (!(activeMainTab === "published")) {
                _context6.n = 7;
                break;
              }
              _context6.n = 6;
              return (0, _muapi.getPublishedWorkflows)(apiKey);
            case 6:
              data = _context6.v;
            case 7:
              setWorkflows(data);
              _context6.n = 9;
              break;
            case 8:
              _context6.p = 8;
              _t5 = _context6.v;
              console.error("Failed to load workflows:", _t5);
              setError("Failed to load workflows list.");
            case 9:
              _context6.p = 9;
              setLoading(false);
              return _context6.f(9);
            case 10:
              return _context6.a(2);
          }
        }, _callee6, null, [[1, 8, 9, 10]]);
      }));
      return _loadWorkflows.apply(this, arguments);
    }
    loadWorkflows();
  }, [apiKey, activeMainTab]);
  var copyTimerRef = (0, _react.useRef)(null);
  var copySnippet = function copySnippet(key, text) {
    try {
      var _navigator$clipboard;
      (_navigator$clipboard = navigator.clipboard) === null || _navigator$clipboard === void 0 || _navigator$clipboard.writeText(text);
      setCopiedKey(key);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(function () {
        return setCopiedKey(null);
      }, 1500);
    } catch (_) {}
  };
  (0, _react.useEffect)(function () {
    return function () {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);
  var buildInputs = (0, _react.useCallback)(function () {
    var inputs = {};
    Object.entries(formData).forEach(function (_ref9) {
      var _ref0 = _slicedToArray(_ref9, 2),
        key = _ref0[0],
        value = _ref0[1];
      if (!value) return;
      if (key.startsWith("text")) inputs[key] = {
        prompt: value
      };else if (key.startsWith("image")) inputs[key] = {
        image_url: value
      };else if (key.startsWith("video")) inputs[key] = {
        video_url: value
      };else inputs[key] = value;
    });
    return inputs;
  }, [formData]);
  var apiSnippets = (0, _react.useMemo)(function () {
    return (0, _muapi.buildWorkflowApiSnippets)(selectedWorkflow === null || selectedWorkflow === void 0 ? void 0 : selectedWorkflow.id, buildInputs(), {
      webhookUrl: webhookUrl || undefined
    });
  }, [selectedWorkflow === null || selectedWorkflow === void 0 ? void 0 : selectedWorkflow.id, buildInputs, webhookUrl]);
  var makeSnippet = function makeSnippet(label, key, text) {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "space-y-2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-center justify-between",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-[10px] font-black text-white/40 uppercase tracking-widest",
          children: label
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "button",
          onClick: function onClick() {
            return copySnippet(key, text);
          },
          className: "text-[10px] font-black text-[#22d3ee] uppercase tracking-widest hover:text-white transition-colors",
          children: copiedKey === key ? "Copied" : "Copy"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("pre", {
        className: "text-[11px] text-white/70 bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all",
        children: text
      })]
    });
  };
  var handleRun = /*#__PURE__*/function () {
    var _ref1 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(e) {
      var inputs, data, _t6;
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.p = _context7.n) {
          case 0:
            e.preventDefault();
            if (!isExecuting) {
              _context7.n = 1;
              break;
            }
            return _context7.a(2);
          case 1:
            setIsExecuting(true);
            setError(null);
            setResult(null);
            _context7.p = 2;
            inputs = buildInputs();
            _context7.n = 3;
            return (0, _muapi.executeWorkflow)(apiKey, selectedWorkflow.id, inputs, webhookUrl || undefined);
          case 3:
            data = _context7.v;
            setResult(data);
            setRawResult(data);
            _context7.n = 5;
            break;
          case 4:
            _context7.p = 4;
            _t6 = _context7.v;
            console.error("Execution failed:", _t6);
            setError(_t6.message || "Execution failed");
            setRawResult({
              error: (_t6 === null || _t6 === void 0 ? void 0 : _t6.message) || String(_t6)
            });
          case 5:
            _context7.p = 5;
            setIsExecuting(false);
            return _context7.f(5);
          case 6:
            return _context7.a(2);
        }
      }, _callee7, null, [[2, 4, 5, 6]]);
    }));
    return function handleRun(_x4) {
      return _ref1.apply(this, arguments);
    };
  }();
  if (loading && !selectedWorkflow) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "h-full flex items-center justify-center",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "animate-spin text-[#22d3ee] text-3xl",
        children: "\u25CC"
      })
    });
  }
  if (selectedWorkflow) {
    var _result$outputs;
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "h-full flex flex-col bg-[#030303] text-white",
      children: [isHeaderVisible ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex-shrink-0 h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 z-30",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-8 h-full",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            onClick: function onClick() {
              return router.push("/studio/workflows");
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
            }), "All Workflows"]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "h-4 w-[1px] bg-white/10"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex h-full",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex bg-white/5 p-1 rounded-lg my-auto",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                onClick: function onClick() {
                  setActiveSubTab("playground");
                  if (selectedWorkflow !== null && selectedWorkflow !== void 0 && selectedWorkflow.id) router.push("/workflow/".concat(selectedWorkflow.id, "/playground"));
                },
                type: "button",
                className: "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ".concat(activeSubTab === "playground" ? "bg-[#22d3ee] text-black shadow-[0_0_15px_rgba(34, 211, 238,0.2)]" : "text-white/40 hover:text-white"),
                children: "Playground"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                onClick: function onClick() {
                  setActiveSubTab("builder");
                  if (selectedWorkflow !== null && selectedWorkflow !== void 0 && selectedWorkflow.id) router.push("/workflow/".concat(selectedWorkflow.id, "/builder"));
                },
                type: "button",
                className: "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ".concat(activeSubTab === "builder" ? "bg-[#22d3ee] text-black shadow-[0_0_15px_rgba(34, 211, 238,0.2)]" : "text-white/40 hover:text-white"),
                children: "Full Workflow"
              })]
            })
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-3",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[11px] font-black text-[#22d3ee] uppercase tracking-widest",
            children: selectedWorkflow.name
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return onToggleHeader === null || onToggleHeader === void 0 ? void 0 : onToggleHeader(false);
            },
            className: "p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white",
            title: "Enter Zen Mode",
            type: "button",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.5",
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                d: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
              })
            })
          })]
        })]
      }) :
      /*#__PURE__*/
      /* Floating Immersive Mode Controller */
      (0, _jsxRuntime.jsxs)("div", {
        className: "absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl animate-fade-in-down",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          onClick: function onClick() {
            return router.push("/studio/workflows");
          },
          className: "p-1.5 text-white/40 hover:text-white transition-colors",
          title: "Back to All Workflows",
          type: "button",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.5",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M19 12H5M12 19l-7-7 7-7"
            })
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "h-4 w-[1px] bg-white/10"
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex bg-white/5 p-1 rounded-lg",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveSubTab("playground");
            },
            type: "button",
            className: "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ".concat(activeSubTab === "playground" ? "bg-[#22d3ee] text-black" : "text-white/40"),
            children: "Play"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveSubTab("builder");
            },
            type: "button",
            className: "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ".concat(activeSubTab === "builder" ? "bg-[#22d3ee] text-black" : "text-white/40"),
            children: "Builder"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "h-4 w-[1px] bg-white/10"
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          onClick: function onClick() {
            return onToggleHeader === null || onToggleHeader === void 0 ? void 0 : onToggleHeader(true);
          },
          className: "px-3 py-1 bg-white/10 hover:bg-white/20 text-[9px] font-black text-white uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2",
          type: "button",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            width: "10",
            height: "10",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "3",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              d: "M4 14h6v6M20 10h-6V4M10 20l-7-7M14 4l7 7"
            })
          }), "Exit Zen"]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-1 overflow-hidden flex flex-col lg:flex-row",
        children: activeSubTab === "playground" ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-full lg:w-[400px] border-r border-white/5 flex flex-col bg-black/20",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "p-6 overflow-y-auto flex-1 custom-scrollbar",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex gap-1 p-1 bg-white/5 rounded-lg mb-4",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  type: "button",
                  onClick: function onClick() {
                    return setPlaygroundView("form");
                  },
                  className: "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ".concat(playgroundView === "form" ? "bg-[#22d3ee] text-black" : "text-white/40 hover:text-white"),
                  children: "Run"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  type: "button",
                  onClick: function onClick() {
                    return setPlaygroundView("api");
                  },
                  className: "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ".concat(playgroundView === "api" ? "bg-[#22d3ee] text-black" : "text-white/40 hover:text-white"),
                  children: "API & CLI"
                })]
              }), playgroundView === "form" ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("form", {
                onSubmit: handleRun,
                className: "space-y-6",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
                    className: "text-xs font-black text-white/30 uppercase tracking-widest mb-4",
                    children: "Configuration"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "space-y-4",
                    children: inputSchema && Object.entries(inputSchema.properties || {}).map(function (_ref10) {
                      var _ref11 = _slicedToArray(_ref10, 2),
                        key = _ref11[0],
                        prop = _ref11[1];
                      return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                        className: "space-y-2",
                        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
                          className: "block text-[11px] font-bold text-white/80 uppercase tracking-wider",
                          children: prop.title || key
                        }), prop.type === "string" && !prop["enum"] ? /*#__PURE__*/(0, _jsxRuntime.jsx)("textarea", {
                          value: formData[key] || "",
                          onChange: function onChange(e) {
                            return setFormData(_objectSpread(_objectSpread({}, formData), {}, _defineProperty({}, key, e.target.value)));
                          },
                          className: "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors min-h-[80px] resize-none",
                          placeholder: prop.description || "Enter ".concat(key, "...")
                        }) : prop["enum"] ? /*#__PURE__*/(0, _jsxRuntime.jsx)("select", {
                          value: formData[key] || "",
                          onChange: function onChange(e) {
                            return setFormData(_objectSpread(_objectSpread({}, formData), {}, _defineProperty({}, key, e.target.value)));
                          },
                          className: "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors",
                          children: prop["enum"].map(function (opt) {
                            return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
                              value: opt,
                              className: "bg-black",
                              children: opt
                            }, opt);
                          })
                        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                          type: "text",
                          value: formData[key] || "",
                          onChange: function onChange(e) {
                            return setFormData(_objectSpread(_objectSpread({}, formData), {}, _defineProperty({}, key, e.target.value)));
                          },
                          className: "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors",
                          placeholder: prop.description || "Enter ".concat(key, "...")
                        })]
                      }, key);
                    })
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "space-y-2",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("label", {
                    className: "block text-[11px] font-bold text-white/80 uppercase tracking-wider",
                    children: ["Webhook URL ", /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-white/30 normal-case font-medium",
                      children: "(optional)"
                    })]
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
                    type: "url",
                    value: webhookUrl,
                    onChange: function onChange(e) {
                      return setWebhookUrl(e.target.value);
                    },
                    placeholder: "https://your-app.com/webhook",
                    className: "w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
                  }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                    className: "text-[10px] text-white/30",
                    children: "Receive a notification when the workflow completes."
                  })]
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
                  type: "submit",
                  disabled: isExecuting || !selectedWorkflow.id,
                  className: "w-full py-4 bg-[#22d3ee] text-black text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale shadow-[0_0_30px_rgba(34, 211, 238,0.15)] flex items-center justify-center gap-3 mt-8",
                  children: isExecuting ? /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                      className: "w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      children: "Generating..."
                    })]
                  }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                      width: "16",
                      height: "16",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "3",
                      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                        d: "M5 3l14 9-14 9V3z"
                      })
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      children: "Run Workflow"
                    })]
                  })
                }), !selectedWorkflow.id && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                  className: "text-[10px] text-white/30 text-center mt-4",
                  children: "Save your workflow first to enable execution."
                })]
              }) : function () {
                var snippets = apiSnippets;
                return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "space-y-6",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "space-y-2",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                      className: "text-[10px] font-black text-white/40 uppercase tracking-widest",
                      children: "Endpoint"
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("pre", {
                      className: "text-[11px] text-white/70 bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all",
                      children: "".concat(snippets.method, " ").concat(snippets.endpoint)
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("pre", {
                      className: "text-[11px] text-white/70 bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all",
                      children: "Poll ".concat(snippets.pollUrl)
                    })]
                  }), makeSnippet("cURL", "curl", snippets.curl), makeSnippet("JSON body", "json", snippets.json), makeSnippet("Node.js", "node", snippets.node), makeSnippet("Python", "python", snippets.python), makeSnippet("CLI", "cli", [snippets.cliDiscover, snippets.cliGet, snippets.cliRun].filter(Boolean).join("\n\n")), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "mt-6 p-4 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-white/50 leading-relaxed",
                    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                      className: "text-[10px] font-black text-white/40 uppercase tracking-widest mb-2",
                      children: "Dynamic references"
                    }), "Pipe outputs between nodes with Jinja2 syntax, e.g. ", /*#__PURE__*/(0, _jsxRuntime.jsx)("code", {
                      className: "text-[#22d3ee]",
                      children: "{{ node_id.outputs[0].value }}"
                    }), ". Node categories: Text, Image, Video, Audio, Utility, API."]
                  })]
                });
              }()]
            })
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex-1 overflow-y-auto p-8 lg:p-12 bg-[#050505] flex items-center justify-center min-h-[500px]",
            children: [error && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "w-full max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center gap-4 animate-shake",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500",
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
                  className: "text-[10px] font-black text-red-500 uppercase tracking-widest block mb-1",
                  children: "Execution Error"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                  className: "text-white/60 text-sm leading-relaxed",
                  children: error
                })]
              })]
            }), !isExecuting && !result && !error && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex flex-col items-center gap-6 opacity-40",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/20",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                  width: "40",
                  height: "40",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "1.5",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                    d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  })
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
                className: "text-xs text-white/40 max-w-[200px] mx-auto text-center font-medium",
                children: "Configure parameters and run the workflow to see results."
              })]
            }), isExecuting && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex flex-col items-center gap-6 animate-fade-in",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "relative",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "w-24 h-24 border-[3px] border-white/5 border-t-[#22d3ee] rounded-full animate-spin shadow-[0_0_40px_rgba(34, 211, 238,0.1)]"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "absolute inset-0 flex items-center justify-center text-[#22d3ee]",
                  children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                    width: "32",
                    height: "32",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2.5",
                    className: "animate-pulse",
                    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("polyline", {
                      points: "22 12 18 12 15 21 9 3 6 12 2 12"
                    })
                  })
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "text-center space-y-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-[10px] font-black text-[#22d3ee] uppercase tracking-[0.3em] animate-pulse",
                  children: "Running Pipeline"
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                  className: "text-[13px] text-white/40 font-medium",
                  children: "Processing nodes and generating assets..."
                })]
              })]
            }), result && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "w-full max-w-4xl space-y-8 animate-fade-in-up",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center justify-between mb-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
                  className: "text-xs font-black text-white/30 uppercase tracking-widest",
                  children: "Workflow Results"
                }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                  className: "flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold border border-green-500/20",
                  children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                    className: "w-1 h-1 bg-green-500 rounded-full animate-pulse"
                  }), " ", "COMPLETED"]
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                children: (_result$outputs = result.outputs) === null || _result$outputs === void 0 ? void 0 : _result$outputs.map(function (out, idx) {
                  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                    className: "group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#22d3ee]/30 transition-all shadow-2xl",
                    children: [out.type === "image_url" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
                      src: out.value,
                      className: "w-full aspect-square object-cover",
                      alt: "Output"
                    }) : out.type === "video_url" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("video", {
                      src: out.value,
                      controls: true,
                      className: "w-full aspect-square object-cover"
                    }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                      className: "p-6 min-h-[200px] flex items-center justify-center italic text-white/60",
                      children: out.value
                    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                      className: "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform",
                      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                        className: "flex items-center justify-between",
                        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                          className: "text-[10px] font-black text-[#22d3ee] uppercase tracking-widest",
                          children: out.id
                        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("a", {
                          href: out.value,
                          target: "_blank",
                          rel: "noreferrer",
                          className: "w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#22d3ee] hover:text-black transition-colors",
                          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
                            width: "14",
                            height: "14",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2.5",
                            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
                              d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                            })
                          })
                        })]
                      })
                    })]
                  }, idx);
                })
              })]
            }), rawResult && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "w-full max-w-4xl mt-8",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
                type: "button",
                onClick: function onClick() {
                  return setShowRaw(function (v) {
                    return !v;
                  });
                },
                className: "text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-[#22d3ee] transition-colors flex items-center gap-2",
                children: [showRaw ? "Hide" : "Show", " raw response"]
              }), showRaw && /*#__PURE__*/(0, _jsxRuntime.jsx)("pre", {
                className: "mt-3 text-[11px] text-white/60 bg-black/40 border border-white/10 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto",
                children: JSON.stringify(rawResult, null, 2)
              })]
            })]
          })]
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex-1 relative bg-[#050505]",
          children: error && !loading ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 flex items-center justify-center",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "w-full max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-red-400 text-xs font-bold uppercase tracking-widest mb-2",
                children: "Unable to load workflow"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-white/60 text-sm",
                children: error
              })]
            })
          }) : nodeSchemas && workflowDef ? /*#__PURE__*/(0, _jsxRuntime.jsx)(WorkflowUI, {
            workflowId: selectedWorkflow === null || selectedWorkflow === void 0 ? void 0 : selectedWorkflow.id,
            initialNodeSchemas: nodeSchemas,
            initialWorkflowData: _objectSpread(_objectSpread({}, workflowDef), {}, {
              workflow_id: selectedWorkflow === null || selectedWorkflow === void 0 ? void 0 : selectedWorkflow.id
            })
          }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute inset-0 flex items-center justify-center",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex flex-col items-center gap-4",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-12 h-12 border-4 border-white/5 border-t-[#22d3ee] rounded-full animate-spin"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "text-[10px] font-black text-white/20 uppercase tracking-widest",
                children: "Loading Builder..."
              })]
            })
          })
        })
      })]
    });
  }

  // Render main workflow list
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "h-full w-full flex flex-col p-8 overflow-y-auto custom-scrollbar",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "max-w-7xl mx-auto w-full",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col gap-6 mb-12",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-end justify-between",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h1", {
              className: "text-3xl font-bold text-white mb-2 tracking-tight",
              children: "Workflows"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-white/40 text-sm font-medium",
              children: "Create and manage your asynchronous AI processing pipelines"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            onClick: function onClick() {
              return handleCreateWorkflow();
            },
            className: "px-6 py-3 bg-[#22d3ee] text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34, 211, 238,0.3)] flex items-center gap-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "3",
              strokeLinecap: "round",
              strokeLinejoin: "round",
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
            }), "Create Workflow"]
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2 border-b border-white/5",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveMainTab("templates");
            },
            className: "px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ".concat(activeMainTab === "templates" ? "text-[#22d3ee] border-[#22d3ee]" : "text-white/30 border-transparent hover:text-white"),
            children: "Templates"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveMainTab("my-workflows");
            },
            className: "px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ".concat(activeMainTab === "my-workflows" ? "text-[#22d3ee] border-[#22d3ee]" : "text-white/30 border-transparent hover:text-white"),
            children: "My Workflows"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: function onClick() {
              return setActiveMainTab("published");
            },
            className: "px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ".concat(activeMainTab === "published" ? "text-[#22d3ee] border-[#22d3ee]" : "text-white/30 border-transparent hover:text-white"),
            children: "Community"
          })]
        })]
      }), loading ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "py-20 flex items-center justify-center",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-10 h-10 border-4 border-white/5 border-t-[#22d3ee] rounded-full animate-spin"
        })
      }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6",
        children: [workflows.map(function (wf) {
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(WorkflowCard, {
            workflow: wf,
            onClick: handleSelectWorkflow,
            activeTab: activeMainTab,
            onRename: function onRename(wf) {
              setRenamingWorkflow(wf);
              setNewWorkflowName(wf.name);
            },
            onDelete: handleDeleteWorkflow
          }, wf.id);
        }), !loading && workflows.length === 0 && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "text-white/20 text-sm font-medium italic",
            children: "No workflows found in this section."
          })
        })]
      })]
    }), renamingWorkflow && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "fixed inset-0 z-[100] flex items-center justify-center p-6",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "absolute inset-0 bg-black/80 backdrop-blur-md",
        onClick: function onClick() {
          return setRenamingWorkflow(null);
        }
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("form", {
        onSubmit: handleRenameWorkflow,
        className: "relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
          className: "text-xl font-bold text-white mb-2",
          children: "Rename Workflow"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/40 text-sm mb-6",
          children: "Enter a new descriptive name for your pipeline."
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "space-y-4",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "space-y-2",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
              className: "text-[10px] font-black text-[#22d3ee] uppercase tracking-widest",
              children: "Workflow Name"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              autoFocus: true,
              type: "text",
              value: newWorkflowName,
              onChange: function onChange(e) {
                return setNewWorkflowName(e.target.value);
              },
              placeholder: "e.g. Cinematic Video Flow",
              className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex gap-3 pt-4",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "button",
              onClick: function onClick() {
                return setRenamingWorkflow(null);
              },
              className: "flex-1 px-4 py-3 text-xs font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors",
              children: "Cancel"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "submit",
              className: "flex-1 bg-[#22d3ee] text-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105 active:scale-95",
              children: "Save Name"
            })]
          })]
        })]
      })]
    })]
  });
}