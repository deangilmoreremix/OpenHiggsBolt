"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildWorkflowApiSnippets = buildWorkflowApiSnippets;
exports.buildWorkflowBody = buildWorkflowBody;
exports.calculateDynamicCost = calculateDynamicCost;
exports.createWorkflow = createWorkflow;
exports.deleteNodeRun = deleteNodeRun;
exports.deleteWorkflow = deleteWorkflow;
exports.executeWorkflow = executeWorkflow;
exports.generateAudio = generateAudio;
exports.generateI2I = generateI2I;
exports.generateI2V = generateI2V;
exports.generateImage = generateImage;
exports.generateMarketingStudioAd = generateMarketingStudioAd;
exports.generateVideo = generateVideo;
exports.getAllNodeSchemas = getAllNodeSchemas;
exports.getAppInterests = getAppInterests;
exports.getNodeSchemas = getNodeSchemas;
exports.getNodeStatus = getNodeStatus;
exports.getPublishedAgents = getPublishedAgents;
exports.getPublishedWorkflows = getPublishedWorkflows;
exports.getTemplateAgents = getTemplateAgents;
exports.getTemplateWorkflows = getTemplateWorkflows;
exports.getUserAgents = getUserAgents;
exports.getUserBalance = getUserBalance;
exports.getUserConversations = getUserConversations;
exports.getUserWorkflows = getUserWorkflows;
exports.getWorkflowData = getWorkflowData;
exports.getWorkflowInputs = getWorkflowInputs;
exports.handleProxyRequest = handleProxyRequest;
exports.handleServerSideProxy = handleServerSideProxy;
exports.processLipSync = processLipSync;
exports.processRecast = processRecast;
exports.processV2V = processV2V;
exports.registerAppInterest = registerAppInterest;
exports.rewriteThumbnail = rewriteThumbnail;
exports.rewriteThumbnails = rewriteThumbnails;
exports.runClipping = runClipping;
exports.runMotionGraphics = runMotionGraphics;
exports.runMotionGraphicsEdit = runMotionGraphicsEdit;
exports.runSingleNode = runSingleNode;
exports.updateWorkflowName = updateWorkflowName;
exports.uploadFile = uploadFile;
var _models = require("./models.js");
var _thumbnailMap = _interopRequireDefault(require("./thumbnail-map.js"));
var _window$location;
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); } // Local mirrors for workflow/agent thumbnails. Maps upstream MuAPI thumbnail
// URLs -> local files in /public/thumbnails/workflows. Plain ESM import so it
// bundles cleanly in the browser (Turbopack/Webpack/Vite) with no fs/JSON-assert.
// A URL is already "final" (no further rewriting needed) when it is a
// same-origin path — either a local file under /public (e.g.
// /thumbnails/workflows/foo.jpg) or an already-proxied URL
// (/api/thumbnail?url=...). This makes the function idempotent so it can be
// applied safely on data that the /api/workflow and /api/agents proxies have
// ALREADY rewritten (previously a second pass turned local paths into broken
// "/api/thumbnail?url=/thumbnails/..." URLs, collapsing every card to the
// placeholder).
function isFinalUrl(url) {
  return typeof url === 'string' && url.startsWith('/');
}
function rewriteThumbnail(url) {
  if (!url || typeof url !== 'string') return url;
  if (isFinalUrl(url)) return url;
  if (_thumbnailMap["default"][url]) return _thumbnailMap["default"][url];
  // Same-origin proxy: server fetches the upstream image (with Referer) and
  // streams it back so it always loads regardless of CDN hotlink protection.
  return "/api/thumbnail?url=".concat(encodeURIComponent(url));
}
function rewriteThumbnails(list) {
  if (!Array.isArray(list)) return list;
  return list.map(function (item) {
    if (!item || _typeof(item) !== 'object') return item;
    var next = item;
    if (item.thumbnail) {
      next = _objectSpread(_objectSpread({}, next), {}, {
        thumbnail: rewriteThumbnail(item.thumbnail)
      });
    }
    // Agents expose their artwork as `icon_url` rather than `thumbnail`.
    if (item.icon_url) {
      next = _objectSpread(_objectSpread({}, next), {}, {
        icon_url: rewriteThumbnail(item.icon_url)
      });
    }
    return next;
  });
}

/**
 * Normalize a MuAPI prediction response into a consistent shape.
 * MuAPI wraps payloads in `data` and sometimes nests `video`/`output`,
 * so we tolerate both the flat and the wrapped response shapes.
 */
function normalizeMuapiResult(raw) {
  var body = raw && raw.data ? raw.data : raw;
  var video = raw && raw.video ? raw.video : body && body.video;
  var requestId = raw && (raw.request_id || raw.id) || body && (body.request_id || body.id);
  var status = String(raw && raw.status || body && body.status || '').toLowerCase();
  var outputs = raw && raw.outputs || body && body.outputs || (video ? [video.url] : null);
  var url = Array.isArray(outputs) && outputs[0] || raw && (raw.url || raw.video_url) || body && (body.url || body.video_url) || video && video.url || raw && raw.output && raw.output.url || body && body.output && body.output.url || null;
  var error = raw && raw.error || body && body.error || null;
  return {
    requestId: requestId,
    status: status,
    outputs: outputs,
    url: url,
    error: error,
    body: body
  };
}

// In an http(s) browser we route through the host app's proxy (Next.js routes
// under /api/* re-issue the call server-side) so api.muapi.ai CORS is bypassed.
// SSR (no window) and Electron's file:// renderer call the upstream directly.
var BASE_URL = typeof window !== 'undefined' && (_window$location = window.location) !== null && _window$location !== void 0 && (_window$location = _window$location.protocol) !== null && _window$location !== void 0 && _window$location.startsWith('http') ? '/api' : 'https://api.muapi.ai';
var PROXY_WF_BASE = '/api/workflow';

// Combine a caller-supplied AbortSignal (e.g. from a component's unmount
// cleanup) with a hard client-side timeout so a hung upstream connection
// cannot block forever. Degrades gracefully where AbortSignal.timeout /
// AbortSignal.any are unavailable (older runtimes / jsdom).
function toSignal(signal) {
  var timeoutMs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 120000;
  var hasTimeout = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function';
  var timeout = hasTimeout ? AbortSignal.timeout(timeoutMs) : null;
  if (signal && timeout && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeout]);
  }
  return signal || timeout;
}
function notifyAuthRequired(status, detail) {
  if (typeof window === 'undefined') return;
  if (status !== 401 && status !== 403) return;
  window.dispatchEvent(new CustomEvent('muapi:auth-required', {
    detail: {
      status: status,
      message: detail
    }
  }));
}
function pollForResult(_x, _x2) {
  return _pollForResult.apply(this, arguments);
}
function _pollForResult() {
  _pollForResult = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(requestId, key) {
    var maxAttempts,
      interval,
      signal,
      pollUrl,
      effSignal,
      attempt,
      headers,
      response,
      errText,
      data,
      norm,
      status,
      _args = arguments,
      _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          maxAttempts = _args.length > 2 && _args[2] !== undefined ? _args[2] : 900;
          interval = _args.length > 3 && _args[3] !== undefined ? _args[3] : 2000;
          signal = _args.length > 4 && _args[4] !== undefined ? _args[4] : null;
          pollUrl = "".concat(BASE_URL, "/api/v1/predictions/").concat(requestId, "/result");
          effSignal = toSignal(signal);
          attempt = 1;
        case 1:
          if (!(attempt <= maxAttempts)) {
            _context.n = 12;
            break;
          }
          _context.n = 2;
          return new Promise(function (resolve) {
            return setTimeout(resolve, interval);
          });
        case 2:
          _context.p = 2;
          headers = {
            'Content-Type': 'application/json'
          };
          if (key) headers['x-api-key'] = key;
          _context.n = 3;
          return fetch(pollUrl, {
            headers: headers,
            signal: effSignal
          });
        case 3:
          response = _context.v;
          if (response.ok) {
            _context.n = 6;
            break;
          }
          _context.n = 4;
          return response.text();
        case 4:
          errText = _context.v;
          if (!(response.status >= 500)) {
            _context.n = 5;
            break;
          }
          return _context.a(3, 11);
        case 5:
          notifyAuthRequired(response.status, errText);
          throw new Error("Poll Failed: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 6:
          _context.n = 7;
          return response.json();
        case 7:
          data = _context.v;
          norm = normalizeMuapiResult(data);
          status = norm.status;
          if (!(status === 'completed' || status === 'succeeded' || status === 'success')) {
            _context.n = 8;
            break;
          }
          return _context.a(2, norm.body);
        case 8:
          if (!(status === 'failed' || status === 'error')) {
            _context.n = 9;
            break;
          }
          throw new Error("Generation failed: ".concat(norm.error || 'Unknown error'));
        case 9:
          _context.n = 11;
          break;
        case 10:
          _context.p = 10;
          _t = _context.v;
          if (!(attempt === maxAttempts)) {
            _context.n = 11;
            break;
          }
          throw _t;
        case 11:
          attempt++;
          _context.n = 1;
          break;
        case 12:
          throw new Error('Generation timed out after polling.');
        case 13:
          return _context.a(2);
      }
    }, _callee, null, [[2, 10]]);
  }));
  return _pollForResult.apply(this, arguments);
}
function submitAndPoll(_x3, _x4, _x5, _x6) {
  return _submitAndPoll.apply(this, arguments);
}
function _submitAndPoll() {
  _submitAndPoll = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(endpoint, payload, key, onRequestId) {
    var maxAttempts,
      signal,
      url,
      headers,
      effSignal,
      response,
      errText,
      submitData,
      requestId,
      result,
      outputUrl,
      _args2 = arguments;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          maxAttempts = _args2.length > 4 && _args2[4] !== undefined ? _args2[4] : 60;
          signal = _args2.length > 5 && _args2[5] !== undefined ? _args2[5] : null;
          url = "".concat(BASE_URL, "/api/v1/").concat(endpoint);
          headers = {
            'Content-Type': 'application/json'
          };
          if (key) headers['x-api-key'] = key;
          effSignal = toSignal(signal);
          _context2.n = 1;
          return fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            signal: effSignal
          });
        case 1:
          response = _context2.v;
          if (response.ok) {
            _context2.n = 3;
            break;
          }
          _context2.n = 2;
          return response.text();
        case 2:
          errText = _context2.v;
          notifyAuthRequired(response.status, errText);
          throw new Error("API Request Failed: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context2.n = 4;
          return response.json();
        case 4:
          submitData = _context2.v;
          requestId = submitData.request_id || submitData.id;
          if (requestId) {
            _context2.n = 5;
            break;
          }
          return _context2.a(2, submitData);
        case 5:
          if (onRequestId) onRequestId(requestId);
          _context2.n = 6;
          return pollForResult(requestId, key, maxAttempts);
        case 6:
          result = _context2.v;
          outputUrl = normalizeMuapiResult(result).url;
          return _context2.a(2, _objectSpread(_objectSpread({}, result), {}, {
            url: outputUrl
          }));
      }
    }, _callee2);
  }));
  return _submitAndPoll.apply(this, arguments);
}
function generateImage(_x7, _x8) {
  return _generateImage.apply(this, arguments);
}
function _generateImage() {
  _generateImage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(apiKey, params) {
    var modelInfo, endpoint, payload;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          modelInfo = (0, _models.getModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          payload = {
            prompt: params.prompt
          };
          if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
          if (params.resolution) payload.resolution = params.resolution;
          if (params.quality) payload.quality = params.quality;
          if (params.image_url) {
            payload.image_url = params.image_url;
            payload.strength = params.strength || 0.6;
          } else if (params.images_list) {
            payload.images_list = params.images_list;
          }
          // NOTE: when neither is provided we intentionally send NO image reference
          // at all (previously an explicit `image_url: null`, which some endpoints
          // reject). The model defaults to a text-to-image generation.
          if (params.seed && params.seed !== -1) payload.seed = params.seed;
          return _context3.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60, params.signal));
      }
    }, _callee3);
  }));
  return _generateImage.apply(this, arguments);
}
function generateI2I(_x9, _x0) {
  return _generateI2I.apply(this, arguments);
}
function _generateI2I() {
  _generateI2I = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(apiKey, params) {
    var _params$images_list, _modelInfo$inputs;
    var modelInfo, endpoint, payload, imageField, imagesList;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.n) {
        case 0:
          modelInfo = (0, _models.getI2IModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          payload = {};
          if (params.prompt) payload.prompt = params.prompt;
          imageField = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.imageField) || 'image_url';
          imagesList = ((_params$images_list = params.images_list) === null || _params$images_list === void 0 ? void 0 : _params$images_list.length) > 0 ? params.images_list : params.image_url ? [params.image_url] : null;
          if (imagesList) {
            if (imageField === 'images_list') payload.images_list = imagesList;else payload[imageField] = imagesList[0];
          }
          if (modelInfo !== null && modelInfo !== void 0 && modelInfo.swapField && params.swap_url) {
            payload[modelInfo.swapField] = params.swap_url;
          }
          if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
          if (params.resolution) payload.resolution = params.resolution;
          if (params.quality) payload.quality = params.quality;
          if (modelInfo !== null && modelInfo !== void 0 && (_modelInfo$inputs = modelInfo.inputs) !== null && _modelInfo$inputs !== void 0 && _modelInfo$inputs.name) {
            payload.name = params.name || modelInfo.inputs.name["default"];
          }
          return _context4.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60, params.signal));
      }
    }, _callee4);
  }));
  return _generateI2I.apply(this, arguments);
}
function generateVideo(_x1, _x10) {
  return _generateVideo.apply(this, arguments);
}
function _generateVideo() {
  _generateVideo = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(apiKey, params) {
    var _params$images_list2, _params$videos_list;
    var modelInfo, endpoint, payload;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          modelInfo = (0, _models.getVideoModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          payload = {};
          if (params.prompt) payload.prompt = params.prompt;
          if (params.request_id) payload.request_id = params.request_id;
          if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
          if (params.duration) payload.duration = params.duration;
          if (params.resolution) payload.resolution = params.resolution;
          if (params.quality) payload.quality = params.quality;
          if (params.mode) payload.mode = params.mode;
          if (params.image_url) payload.image_url = params.image_url;
          if (((_params$images_list2 = params.images_list) === null || _params$images_list2 === void 0 ? void 0 : _params$images_list2.length) > 0) payload.images_list = params.images_list;
          if (((_params$videos_list = params.videos_list) === null || _params$videos_list === void 0 ? void 0 : _params$videos_list.length) > 0) payload.videos_list = params.videos_list;
          return _context5.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee5);
  }));
  return _generateVideo.apply(this, arguments);
}
function generateI2V(_x11, _x12) {
  return _generateI2V.apply(this, arguments);
}
function _generateI2V() {
  _generateI2V = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(apiKey, params) {
    var _modelInfo$inputs2;
    var modelInfo, endpoint, payload, imageField, lastImageField;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.n) {
        case 0:
          modelInfo = (0, _models.getI2VModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          payload = {};
          if (params.prompt) payload.prompt = params.prompt;
          imageField = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.imageField) || 'image_url';
          if (params.images_list && params.images_list.length > 0) {
            if (imageField === 'images_list') payload.images_list = params.images_list;else payload[imageField] = params.images_list[0];
          } else if (params.image_url) {
            if (imageField === 'images_list') payload.images_list = [params.image_url];else payload[imageField] = params.image_url;
          }
          lastImageField = modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.lastImageField;
          if (lastImageField && params.last_image) {
            if (lastImageField === 'images_list') {
              if (!payload.images_list) payload.images_list = [];
              if (payload.images_list.indexOf(params.last_image) === -1) {
                payload.images_list.push(params.last_image);
              }
            } else {
              payload[lastImageField] = params.last_image;
            }
          }
          if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
          if (params.duration) payload.duration = params.duration;
          if (params.resolution) payload.resolution = params.resolution;
          if (params.quality) payload.quality = params.quality;
          if (params.mode) payload.mode = params.mode;
          if (modelInfo !== null && modelInfo !== void 0 && (_modelInfo$inputs2 = modelInfo.inputs) !== null && _modelInfo$inputs2 !== void 0 && _modelInfo$inputs2.name) {
            payload.name = params.name || modelInfo.inputs.name["default"];
          }
          return _context6.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee6);
  }));
  return _generateI2V.apply(this, arguments);
}
function generateMarketingStudioAd(_x13, _x14) {
  return _generateMarketingStudioAd.apply(this, arguments);
}
function _generateMarketingStudioAd() {
  _generateMarketingStudioAd = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(apiKey, params) {
    var endpoint, payload;
    return _regenerator().w(function (_context7) {
      while (1) switch (_context7.n) {
        case 0:
          endpoint = params.resolution === '1080p' ? 'sd-2-vip-omni-reference-1080p' : 'seedance-2-vip-omni-reference';
          payload = {
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio || '16:9',
            duration: params.duration || 5,
            images_list: params.images_list || [],
            video_files: params.video_files || []
          };
          return _context7.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee7);
  }));
  return _generateMarketingStudioAd.apply(this, arguments);
}
function processV2V(_x15, _x16) {
  return _processV2V.apply(this, arguments);
}
function _processV2V() {
  _processV2V = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(apiKey, params) {
    var modelInfo, endpoint, videoField, payload;
    return _regenerator().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          modelInfo = (0, _models.getV2VModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          videoField = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.videoField) || 'video_url';
          payload = _defineProperty({}, videoField, params.video_url);
          if (modelInfo !== null && modelInfo !== void 0 && modelInfo.imageField && params.image_url) {
            payload[modelInfo.imageField] = params.image_url;
          }
          if (modelInfo !== null && modelInfo !== void 0 && modelInfo.hasPrompt && params.prompt) {
            payload.prompt = params.prompt;
          }
          return _context8.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee8);
  }));
  return _processV2V.apply(this, arguments);
}
function processRecast(_x17, _x18) {
  return _processRecast.apply(this, arguments);
}
function _processRecast() {
  _processRecast = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(apiKey, params) {
    var modelInfo, endpoint, videoField, payload;
    return _regenerator().w(function (_context9) {
      while (1) switch (_context9.n) {
        case 0:
          modelInfo = (0, _models.getRecastModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          videoField = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.videoField) || 'video_url';
          payload = _defineProperty({}, videoField, params.video_url);
          if (modelInfo !== null && modelInfo !== void 0 && modelInfo.imageField && params.image_url) {
            payload[modelInfo.imageField] = params.image_url;
          }
          if (modelInfo !== null && modelInfo !== void 0 && modelInfo.hasPrompt && params.prompt) {
            payload.prompt = params.prompt;
          }
          if (params.aspect_ratio) {
            payload.aspect_ratio = params.aspect_ratio;
          }
          if (params.character_orientation) {
            payload.character_orientation = params.character_orientation;
          }
          return _context9.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee9);
  }));
  return _processRecast.apply(this, arguments);
}
function processLipSync(_x19, _x20) {
  return _processLipSync.apply(this, arguments);
}
function _processLipSync() {
  _processLipSync = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(apiKey, params) {
    var modelInfo, endpoint, payload;
    return _regenerator().w(function (_context0) {
      while (1) switch (_context0.n) {
        case 0:
          modelInfo = (0, _models.getLipSyncModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          payload = {};
          if (params.audio_url) payload.audio_url = params.audio_url;
          if (params.image_url) payload.image_url = params.image_url;
          if (params.video_url) payload.video_url = params.video_url;
          if (modelInfo !== null && modelInfo !== void 0 && modelInfo.hasPrompt) payload.prompt = params.prompt || '';
          if (params.resolution) payload.resolution = params.resolution;
          if (params.seed !== undefined && params.seed !== -1) payload.seed = params.seed;
          return _context0.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee0);
  }));
  return _processLipSync.apply(this, arguments);
}
function generateAudio(_x21, _x22) {
  return _generateAudio.apply(this, arguments);
}
function _generateAudio() {
  _generateAudio = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(apiKey, params) {
    var modelId, modelInfo, endpoint, payload, skipKeys, key;
    return _regenerator().w(function (_context1) {
      while (1) switch (_context1.n) {
        case 0:
          modelId = params._modelId || params.model;
          modelInfo = (0, _models.getAudioModelById)(modelId);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || modelId;
          payload = {};
          skipKeys = ['_modelId', 'onRequestId'];
          for (key in params) {
            if (!skipKeys.includes(key) && params[key] !== undefined && params[key] !== null) {
              payload[key] = params[key];
            }
          }
          return _context1.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee1);
  }));
  return _generateAudio.apply(this, arguments);
}
var ALLOWED_UPLOAD_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/webm', 'application/zip', 'application/pdf', 'application/json']);
var MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per MuAPI docs

function parseApiErrorBody(text) {
  try {
    var parsed = JSON.parse(text);
    return parsed.detail || parsed.error || parsed.message || text.slice(0, 200);
  } catch (_unused) {
    return text.slice(0, 200);
  }
}
function uploadFile(apiKey, file, onProgress) {
  return new Promise(function (resolve, reject) {
    // --- Client-side pre-flight validation (MuAPI file upload spec) ---
    if (!file) {
      return reject(new Error('No file provided'));
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
      return reject(new Error("Invalid file type: ".concat(file.type, ". Allowed: ").concat(_toConsumableArray(ALLOWED_UPLOAD_MIME_TYPES).join(', '))));
    }
    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      var sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return reject(new Error("File too large: ".concat(sizeMB, " MB. Maximum size: 10 MB")));
    }
    var url = "".concat(BASE_URL, "/api/v1/upload_file");
    var formData = new FormData();
    formData.append('file', file);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (apiKey) xhr.setRequestHeader('x-api-key', apiKey);
    if (onProgress) {
      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          var percentComplete = Math.round(event.loaded / event.total * 100);
          onProgress(percentComplete);
        }
      };
    }
    xhr.onload = function () {
      if (xhr.status < 200 || xhr.status >= 300) {
        var detail = xhr.statusText;
        try {
          detail = parseApiErrorBody(xhr.responseText);
        } catch (_unused2) {
          // fallback to statusText
        }
        notifyAuthRequired(xhr.status, detail);
        return reject(new Error("Image upload failed: ".concat(xhr.status, " - ").concat(detail)));
      }
      try {
        var _data$data;
        var data = JSON.parse(xhr.responseText);
        var fileUrl = data.url || data.file_url || ((_data$data = data.data) === null || _data$data === void 0 ? void 0 : _data$data.url);
        if (!fileUrl) {
          return reject(new Error('No URL returned from file upload'));
        }
        resolve(fileUrl);
      } catch (_unused3) {
        reject(new Error('Invalid upload response'));
      }
    };
    xhr.onerror = function () {
      return reject(new Error('Network error during file upload'));
    };
    xhr.send(formData);
  });
}
function getUserBalance(_x23) {
  return _getUserBalance.apply(this, arguments);
}
function _getUserBalance() {
  _getUserBalance = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(apiKey) {
    var response, errText;
    return _regenerator().w(function (_context10) {
      while (1) switch (_context10.n) {
        case 0:
          _context10.n = 1;
          return fetch("".concat(BASE_URL, "/api/v1/account/balance"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context10.v;
          if (response.ok) {
            _context10.n = 3;
            break;
          }
          _context10.n = 2;
          return response.text();
        case 2:
          errText = _context10.v;
          notifyAuthRequired(response.status, errText);
          throw new Error("Failed to fetch balance: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context10.n = 4;
          return response.json();
        case 4:
          return _context10.a(2, _context10.v);
      }
    }, _callee10);
  }));
  return _getUserBalance.apply(this, arguments);
}
function getTemplateWorkflows(_x24) {
  return _getTemplateWorkflows.apply(this, arguments);
}
function _getTemplateWorkflows() {
  _getTemplateWorkflows = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11(apiKey) {
    var headers, response, errText, data;
    return _regenerator().w(function (_context11) {
      while (1) switch (_context11.n) {
        case 0:
          headers = {
            'Content-Type': 'application/json'
          };
          if (apiKey) headers['x-api-key'] = apiKey;
          _context11.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/get-template-workflows"), {
            headers: headers
          });
        case 1:
          response = _context11.v;
          if (response.ok) {
            _context11.n = 3;
            break;
          }
          _context11.n = 2;
          return response.text();
        case 2:
          errText = _context11.v;
          throw new Error("Failed to fetch template workflows: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context11.n = 4;
          return response.json();
        case 4:
          data = _context11.v;
          return _context11.a(2, rewriteThumbnails(Array.isArray(data) ? data : data.workflows || data.items || []));
      }
    }, _callee11);
  }));
  return _getTemplateWorkflows.apply(this, arguments);
}
;
function getUserWorkflows(_x25) {
  return _getUserWorkflows.apply(this, arguments);
}
function _getUserWorkflows() {
  _getUserWorkflows = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee12(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context12) {
      while (1) switch (_context12.n) {
        case 0:
          _context12.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/get-workflow-defs"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context12.v;
          if (response.ok) {
            _context12.n = 3;
            break;
          }
          _context12.n = 2;
          return response.text();
        case 2:
          errText = _context12.v;
          throw new Error("Failed to fetch user workflows: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context12.n = 4;
          return response.json();
        case 4:
          data = _context12.v;
          return _context12.a(2, rewriteThumbnails(Array.isArray(data) ? data : data.workflows || data.items || []));
      }
    }, _callee12);
  }));
  return _getUserWorkflows.apply(this, arguments);
}
;
function getPublishedWorkflows(_x26) {
  return _getPublishedWorkflows.apply(this, arguments);
}
function _getPublishedWorkflows() {
  _getPublishedWorkflows = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee13(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context13) {
      while (1) switch (_context13.n) {
        case 0:
          _context13.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/get-published-workflows"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context13.v;
          if (response.ok) {
            _context13.n = 3;
            break;
          }
          _context13.n = 2;
          return response.text();
        case 2:
          errText = _context13.v;
          throw new Error("Failed to fetch published workflows: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context13.n = 4;
          return response.json();
        case 4:
          data = _context13.v;
          return _context13.a(2, rewriteThumbnails(Array.isArray(data) ? data : data.workflows || data.items || []));
      }
    }, _callee13);
  }));
  return _getPublishedWorkflows.apply(this, arguments);
}
;

// Agents — uses direct URL → https://api.muapi.ai/agents/...
function getTemplateAgents(_x27) {
  return _getTemplateAgents.apply(this, arguments);
}
function _getTemplateAgents() {
  _getTemplateAgents = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee14(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context14) {
      while (1) switch (_context14.n) {
        case 0:
          _context14.n = 1;
          return fetch("".concat(BASE_URL, "/agents/templates/agents"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context14.v;
          if (response.ok) {
            _context14.n = 3;
            break;
          }
          _context14.n = 2;
          return response.text();
        case 2:
          errText = _context14.v;
          throw new Error("Failed to fetch template agents: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context14.n = 4;
          return response.json();
        case 4:
          data = _context14.v;
          return _context14.a(2, rewriteThumbnails(Array.isArray(data) ? data : data.agents || data.items || []));
      }
    }, _callee14);
  }));
  return _getTemplateAgents.apply(this, arguments);
}
;
function getUserAgents(_x28) {
  return _getUserAgents.apply(this, arguments);
}
function _getUserAgents() {
  _getUserAgents = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee15(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context15) {
      while (1) switch (_context15.n) {
        case 0:
          _context15.n = 1;
          return fetch("".concat(BASE_URL, "/agents/user/agents"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context15.v;
          if (response.ok) {
            _context15.n = 3;
            break;
          }
          _context15.n = 2;
          return response.text();
        case 2:
          errText = _context15.v;
          throw new Error("Failed to fetch user agents: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context15.n = 4;
          return response.json();
        case 4:
          data = _context15.v;
          return _context15.a(2, rewriteThumbnails(Array.isArray(data) ? data : data.agents || data.items || []));
      }
    }, _callee15);
  }));
  return _getUserAgents.apply(this, arguments);
}
;
function getPublishedAgents(_x29) {
  return _getPublishedAgents.apply(this, arguments);
}
function _getPublishedAgents() {
  _getPublishedAgents = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee16(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context16) {
      while (1) switch (_context16.n) {
        case 0:
          _context16.n = 1;
          return fetch("".concat(BASE_URL, "/agents/featured/agents"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context16.v;
          if (response.ok) {
            _context16.n = 3;
            break;
          }
          _context16.n = 2;
          return response.text();
        case 2:
          errText = _context16.v;
          throw new Error("Failed to fetch featured agents: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context16.n = 4;
          return response.json();
        case 4:
          data = _context16.v;
          return _context16.a(2, rewriteThumbnails(Array.isArray(data) ? data : data.agents || data.items || []));
      }
    }, _callee16);
  }));
  return _getPublishedAgents.apply(this, arguments);
}
;

// GET /agents/user/conversations — returns the user's chat history across all agents
function getUserConversations(_x30) {
  return _getUserConversations.apply(this, arguments);
}
function _getUserConversations() {
  _getUserConversations = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee17(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context17) {
      while (1) switch (_context17.n) {
        case 0:
          _context17.n = 1;
          return fetch("".concat(BASE_URL, "/agents/user/conversations"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context17.v;
          if (response.ok) {
            _context17.n = 3;
            break;
          }
          _context17.n = 2;
          return response.text();
        case 2:
          errText = _context17.v;
          throw new Error("Failed to fetch conversations: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context17.n = 4;
          return response.json();
        case 4:
          data = _context17.v;
          return _context17.a(2, Array.isArray(data) ? data : []);
      }
    }, _callee17);
  }));
  return _getUserConversations.apply(this, arguments);
}
;
function createWorkflow(_x31, _x32) {
  return _createWorkflow.apply(this, arguments);
}
function _createWorkflow() {
  _createWorkflow = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee18(apiKey, payload) {
    var response, errText;
    return _regenerator().w(function (_context18) {
      while (1) switch (_context18.n) {
        case 0:
          _context18.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/create"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
          });
        case 1:
          response = _context18.v;
          if (response.ok) {
            _context18.n = 3;
            break;
          }
          _context18.n = 2;
          return response.text();
        case 2:
          errText = _context18.v;
          throw new Error("Failed to create workflow: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context18.n = 4;
          return response.json();
        case 4:
          return _context18.a(2, _context18.v);
      }
    }, _callee18);
  }));
  return _createWorkflow.apply(this, arguments);
}
;
function updateWorkflowName(_x33, _x34, _x35) {
  return _updateWorkflowName.apply(this, arguments);
}
function _updateWorkflowName() {
  _updateWorkflowName = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee19(apiKey, workflowId, name) {
    var response, errText;
    return _regenerator().w(function (_context19) {
      while (1) switch (_context19.n) {
        case 0:
          _context19.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/update-name/").concat(workflowId), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              name: name
            })
          });
        case 1:
          response = _context19.v;
          if (response.ok) {
            _context19.n = 3;
            break;
          }
          _context19.n = 2;
          return response.text();
        case 2:
          errText = _context19.v;
          throw new Error("Failed to rename workflow: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context19.n = 4;
          return response.json();
        case 4:
          return _context19.a(2, _context19.v);
      }
    }, _callee19);
  }));
  return _updateWorkflowName.apply(this, arguments);
}
;
function deleteWorkflow(_x36, _x37) {
  return _deleteWorkflow.apply(this, arguments);
}
function _deleteWorkflow() {
  _deleteWorkflow = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee20(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context20) {
      while (1) switch (_context20.n) {
        case 0:
          _context20.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/delete-workflow-def/").concat(workflowId), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context20.v;
          if (response.ok) {
            _context20.n = 3;
            break;
          }
          _context20.n = 2;
          return response.text();
        case 2:
          errText = _context20.v;
          throw new Error("Failed to delete workflow: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context20.n = 4;
          return response.json();
        case 4:
          return _context20.a(2, _context20.v);
      }
    }, _callee20);
  }));
  return _deleteWorkflow.apply(this, arguments);
}
;
function getWorkflowInputs(_x38, _x39) {
  return _getWorkflowInputs.apply(this, arguments);
}
function _getWorkflowInputs() {
  _getWorkflowInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee21(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context21) {
      while (1) switch (_context21.n) {
        case 0:
          _context21.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/api-inputs"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context21.v;
          if (response.ok) {
            _context21.n = 3;
            break;
          }
          _context21.n = 2;
          return response.text();
        case 2:
          errText = _context21.v;
          throw new Error("Failed to fetch workflow inputs: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context21.n = 4;
          return response.json();
        case 4:
          return _context21.a(2, _context21.v);
      }
    }, _callee21);
  }));
  return _getWorkflowInputs.apply(this, arguments);
}
;

// Single source of truth for the workflow execute request body. Keeping this in
// one place ensures the copy-paste snippets (buildWorkflowApiSnippets) stay in
// sync with what executeWorkflow actually sends over the wire.
function buildWorkflowBody() {
  var inputs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var webhookUrl = arguments.length > 1 ? arguments[1] : undefined;
  return _objectSpread({
    inputs: inputs
  }, webhookUrl ? {
    webhook_url: webhookUrl
  } : {});
}
function executeWorkflow(_x40, _x41, _x42, _x43) {
  return _executeWorkflow.apply(this, arguments);
}
function _executeWorkflow() {
  _executeWorkflow = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee22(apiKey, workflowId, inputs, webhookUrl) {
    var response, errText, submitData, runId;
    return _regenerator().w(function (_context22) {
      while (1) switch (_context22.n) {
        case 0:
          _context22.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/api-execute"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify(buildWorkflowBody(inputs, webhookUrl))
          });
        case 1:
          response = _context22.v;
          if (response.ok) {
            _context22.n = 3;
            break;
          }
          _context22.n = 2;
          return response.text();
        case 2:
          errText = _context22.v;
          throw new Error("Failed to execute workflow: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context22.n = 4;
          return response.json();
        case 4:
          submitData = _context22.v;
          runId = submitData.run_id || submitData.id;
          if (runId) {
            _context22.n = 5;
            break;
          }
          return _context22.a(2, submitData);
        case 5:
          _context22.n = 6;
          return pollWorkflowResult(runId, apiKey);
        case 6:
          return _context22.a(2, _context22.v);
      }
    }, _callee22);
  }));
  return _executeWorkflow.apply(this, arguments);
}
;

// Pure helper: builds copy-paste "how to use" snippets for a workflow's playground.
// No network calls. Returns strings the UI can render + copy.
function buildWorkflowApiSnippets(workflowId) {
  var inputs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var id = workflowId || '<workflow_id>';
  var webhookUrl = options.webhookUrl || '';
  var publicBase = 'https://api.muapi.ai';
  var endpoint = "".concat(publicBase, "/workflow/").concat(id, "/api-execute");
  var pollUrl = "".concat(publicBase, "/workflow/run/{run_id}/api-outputs");
  var bodyObj = buildWorkflowBody(inputs, webhookUrl);
  var json = JSON.stringify(bodyObj, null, 2);

  // Escape single quotes so the body survives bash single-quoted strings
  // (JSON.stringify does not escape "'"; a prompt like "don't" would break it).
  var curlBody = JSON.stringify(bodyObj).replace(/'/g, "'\\''");
  var curl = ["curl -X POST '".concat(endpoint, "' \\"), "  -H 'Content-Type: application/json' \\", "  -H 'x-api-key: YOUR_API_KEY' \\", "  -d '".concat(curlBody, "'")].join('\n');
  var node = ["const res = await fetch('".concat(endpoint, "', {"), "  method: 'POST',", "  headers: {", "    'Content-Type': 'application/json',", "    'x-api-key': process.env.MUAPI_API_KEY,", "  },", "  body: JSON.stringify(".concat(JSON.stringify(bodyObj, null, 2).replace(/\n/g, '\n  '), "),"), "});", "const { run_id } = await res.json();", "// Then poll: GET ".concat(pollUrl)].join('\n');
  var python = ["import requests", "", "resp = requests.post(", "    \"".concat(endpoint, "\","), "    headers={\"Content-Type\": \"application/json\", \"x-api-key\": \"YOUR_API_KEY\"},", "    json=".concat(json.replace(/\n/g, '\n    '), ","), ")", "run_id = resp.json()[\"run_id\"]", "# Then poll: GET ".concat(pollUrl)].join('\n');
  var cliGet = "muapi workflow get ".concat(id, " --output-json");
  var cliRun = "muapi workflow run-interactive ".concat(id);
  var cliDiscover = "muapi workflow discover --output-json";
  return {
    endpoint: endpoint,
    pollUrl: pollUrl,
    method: 'POST',
    json: json,
    curl: curl,
    node: node,
    python: python,
    cliGet: cliGet,
    cliRun: cliRun,
    cliDiscover: cliDiscover
  };
}
function pollWorkflowResult(_x44, _x45) {
  return _pollWorkflowResult.apply(this, arguments);
}
function _pollWorkflowResult() {
  _pollWorkflowResult = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee23(runId, apiKey) {
    var maxAttempts,
      interval,
      pollUrl,
      headers,
      attempt,
      _data$status,
      response,
      data,
      status,
      _args23 = arguments,
      _t2;
    return _regenerator().w(function (_context23) {
      while (1) switch (_context23.p = _context23.n) {
        case 0:
          maxAttempts = _args23.length > 2 && _args23[2] !== undefined ? _args23[2] : 900;
          interval = _args23.length > 3 && _args23[3] !== undefined ? _args23[3] : 2000;
          pollUrl = "".concat(BASE_URL, "/workflow/run/").concat(runId, "/api-outputs");
          headers = {
            'Content-Type': 'application/json'
          };
          if (apiKey) headers['x-api-key'] = apiKey;
          attempt = 1;
        case 1:
          if (!(attempt <= maxAttempts)) {
            _context23.n = 11;
            break;
          }
          _context23.n = 2;
          return new Promise(function (resolve) {
            return setTimeout(resolve, interval);
          });
        case 2:
          _context23.p = 2;
          _context23.n = 3;
          return fetch(pollUrl, {
            headers: headers
          });
        case 3:
          response = _context23.v;
          if (response.ok) {
            _context23.n = 5;
            break;
          }
          if (!(response.status >= 500)) {
            _context23.n = 4;
            break;
          }
          return _context23.a(3, 10);
        case 4:
          throw new Error("Poll Failed: ".concat(response.status));
        case 5:
          _context23.n = 6;
          return response.json();
        case 6:
          data = _context23.v;
          status = (_data$status = data.status) === null || _data$status === void 0 ? void 0 : _data$status.toLowerCase();
          if (!(status === 'completed' || status === 'succeeded' || status === 'success')) {
            _context23.n = 7;
            break;
          }
          return _context23.a(2, data);
        case 7:
          if (!(status === 'failed' || status === 'error')) {
            _context23.n = 8;
            break;
          }
          throw new Error("Workflow failed: ".concat(data.error || 'Unknown error'));
        case 8:
          _context23.n = 10;
          break;
        case 9:
          _context23.p = 9;
          _t2 = _context23.v;
          if (!(attempt === maxAttempts)) {
            _context23.n = 10;
            break;
          }
          throw _t2;
        case 10:
          attempt++;
          _context23.n = 1;
          break;
        case 11:
          throw new Error('Workflow timed out after polling.');
        case 12:
          return _context23.a(2);
      }
    }, _callee23, null, [[2, 9]]);
  }));
  return _pollWorkflowResult.apply(this, arguments);
}
;
function getAllNodeSchemas(_x46, _x47) {
  return _getAllNodeSchemas.apply(this, arguments);
}
function _getAllNodeSchemas() {
  _getAllNodeSchemas = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee24(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context24) {
      while (1) switch (_context24.n) {
        case 0:
          _context24.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/node-schemas"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context24.v;
          if (response.ok) {
            _context24.n = 3;
            break;
          }
          _context24.n = 2;
          return response.text();
        case 2:
          errText = _context24.v;
          throw new Error("Failed to fetch node schemas: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context24.n = 4;
          return response.json();
        case 4:
          return _context24.a(2, _context24.v);
      }
    }, _callee24);
  }));
  return _getAllNodeSchemas.apply(this, arguments);
}
;
function getWorkflowData(_x48, _x49) {
  return _getWorkflowData.apply(this, arguments);
}
function _getWorkflowData() {
  _getWorkflowData = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee25(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context25) {
      while (1) switch (_context25.n) {
        case 0:
          _context25.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/get-workflow-def/").concat(workflowId), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context25.v;
          if (response.ok) {
            _context25.n = 3;
            break;
          }
          _context25.n = 2;
          return response.text();
        case 2:
          errText = _context25.v;
          throw new Error("Failed to fetch workflow data: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context25.n = 4;
          return response.json();
        case 4:
          return _context25.a(2, _context25.v);
      }
    }, _callee25);
  }));
  return _getWorkflowData.apply(this, arguments);
}
;
function getNodeSchemas(_x50, _x51) {
  return _getNodeSchemas.apply(this, arguments);
}
function _getNodeSchemas() {
  _getNodeSchemas = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee26(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context26) {
      while (1) switch (_context26.n) {
        case 0:
          _context26.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/api-node-schemas"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context26.v;
          if (response.ok) {
            _context26.n = 3;
            break;
          }
          _context26.n = 2;
          return response.text();
        case 2:
          errText = _context26.v;
          throw new Error("Failed to fetch node schemas: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context26.n = 4;
          return response.json();
        case 4:
          return _context26.a(2, _context26.v);
      }
    }, _callee26);
  }));
  return _getNodeSchemas.apply(this, arguments);
}
function runSingleNode(_x52, _x53, _x54, _x55) {
  return _runSingleNode.apply(this, arguments);
}
function _runSingleNode() {
  _runSingleNode = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee27(apiKey, workflowId, nodeId, payload) {
    var response, errText;
    return _regenerator().w(function (_context27) {
      while (1) switch (_context27.n) {
        case 0:
          _context27.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/node/").concat(nodeId, "/run"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
          });
        case 1:
          response = _context27.v;
          if (response.ok) {
            _context27.n = 3;
            break;
          }
          _context27.n = 2;
          return response.text();
        case 2:
          errText = _context27.v;
          throw new Error("Failed to run single node: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context27.n = 4;
          return response.json();
        case 4:
          return _context27.a(2, _context27.v);
      }
    }, _callee27);
  }));
  return _runSingleNode.apply(this, arguments);
}
function deleteNodeRun(_x56, _x57) {
  return _deleteNodeRun.apply(this, arguments);
}
function _deleteNodeRun() {
  _deleteNodeRun = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee28(apiKey, nodeRunId) {
    var response, errText;
    return _regenerator().w(function (_context28) {
      while (1) switch (_context28.n) {
        case 0:
          _context28.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/node-run/").concat(nodeRunId), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context28.v;
          if (response.ok) {
            _context28.n = 3;
            break;
          }
          _context28.n = 2;
          return response.text();
        case 2:
          errText = _context28.v;
          throw new Error("Failed to delete node run: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context28.n = 4;
          return response.json();
        case 4:
          return _context28.a(2, _context28.v);
      }
    }, _callee28);
  }));
  return _deleteNodeRun.apply(this, arguments);
}
function getNodeStatus(_x58, _x59) {
  return _getNodeStatus.apply(this, arguments);
}
/**
 * Handle proxy requests centralizing communication logic with MuAPI.
 * This is used by the server-side entry points.
 */
function _getNodeStatus() {
  _getNodeStatus = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee29(apiKey, runId) {
    var response, errText;
    return _regenerator().w(function (_context29) {
      while (1) switch (_context29.n) {
        case 0:
          _context29.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/run/").concat(runId, "/status"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context29.v;
          if (response.ok) {
            _context29.n = 3;
            break;
          }
          _context29.n = 2;
          return response.text();
        case 2:
          errText = _context29.v;
          throw new Error("Failed to get node status: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context29.n = 4;
          return response.json();
        case 4:
          return _context29.a(2, _context29.v);
      }
    }, _callee29);
  }));
  return _getNodeStatus.apply(this, arguments);
}
function handleProxyRequest(_x60, _x61, _x62, _x63, _x64, _x65) {
  return _handleProxyRequest.apply(this, arguments);
}
/**
 * A centralized handler for Next.js API routes or middleware.
 */
function _handleProxyRequest() {
  _handleProxyRequest = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee30(prefix, path, method, headers, body, apiKey) {
    var url, finalHeaders, response, contentType, buffer, _t3;
    return _regenerator().w(function (_context30) {
      while (1) switch (_context30.p = _context30.n) {
        case 0:
          url = "".concat(BASE_URL, "/").concat(prefix, "/").concat(path);
          finalHeaders = new Headers(headers);
          finalHeaders["delete"]('host');
          finalHeaders["delete"]('connection');
          finalHeaders["delete"]('content-length'); // Let fetch recalculate this for safety

          if (apiKey) {
            finalHeaders.set('x-api-key', apiKey);
          }
          _context30.p = 1;
          _context30.n = 2;
          return fetch(url, {
            method: method,
            headers: finalHeaders,
            body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
            redirect: 'follow'
          });
        case 2:
          response = _context30.v;
          contentType = response.headers.get('Content-Type') || 'application/json';
          _context30.n = 3;
          return response.arrayBuffer();
        case 3:
          buffer = _context30.v;
          return _context30.a(2, {
            status: response.status,
            contentType: contentType,
            data: buffer
          });
        case 4:
          _context30.p = 4;
          _t3 = _context30.v;
          console.error("MuAPI Proxy error for ".concat(url, ":"), _t3);
          throw _t3;
        case 5:
          return _context30.a(2);
      }
    }, _callee30, null, [[1, 4]]);
  }));
  return _handleProxyRequest.apply(this, arguments);
}
function handleServerSideProxy(_x66, _x67, _x68, _x69) {
  return _handleServerSideProxy.apply(this, arguments);
}
function _handleServerSideProxy() {
  _handleServerSideProxy = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee31(prefix, request, params, apiKey) {
    var slug, pathSegments, path, method, body, _URL, search, pathWithSearch, _t4;
    return _regenerator().w(function (_context31) {
      while (1) switch (_context31.p = _context31.n) {
        case 0:
          _context31.p = 0;
          _context31.n = 1;
          return params;
        case 1:
          slug = _context31.v;
          pathSegments = slug.path || [];
          path = pathSegments.join('/');
          method = request.method;
          body = null;
          if (!(method !== 'GET' && method !== 'HEAD')) {
            _context31.n = 3;
            break;
          }
          _context31.n = 2;
          return request.arrayBuffer();
        case 2:
          body = _context31.v;
        case 3:
          _URL = new URL(request.url), search = _URL.search;
          pathWithSearch = search ? "".concat(path).concat(search) : path;
          _context31.n = 4;
          return handleProxyRequest(prefix, pathWithSearch, method, request.headers, body, apiKey);
        case 4:
          return _context31.a(2, _context31.v);
        case 5:
          _context31.p = 5;
          _t4 = _context31.v;
          console.error("Server proxy failed:", _t4);
          throw _t4;
        case 6:
          return _context31.a(2);
      }
    }, _callee31, null, [[0, 5]]);
  }));
  return _handleServerSideProxy.apply(this, arguments);
}
function calculateDynamicCost(_x70, _x71, _x72) {
  return _calculateDynamicCost.apply(this, arguments);
}
function _calculateDynamicCost() {
  _calculateDynamicCost = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee32(apiKey, taskName, payload) {
    var headers, response, errText;
    return _regenerator().w(function (_context32) {
      while (1) switch (_context32.n) {
        case 0:
          headers = {
            'Content-Type': 'application/json'
          };
          if (apiKey) headers['x-api-key'] = apiKey;
          _context32.n = 1;
          return fetch("".concat(BASE_URL, "/api/v1/app/calculate_dynamic_cost"), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              task_name: taskName,
              payload: payload
            })
          });
        case 1:
          response = _context32.v;
          if (response.ok) {
            _context32.n = 3;
            break;
          }
          _context32.n = 2;
          return response.text();
        case 2:
          errText = _context32.v;
          throw new Error("Failed to calculate dynamic cost: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context32.n = 4;
          return response.json();
        case 4:
          return _context32.a(2, _context32.v);
      }
    }, _callee32);
  }));
  return _calculateDynamicCost.apply(this, arguments);
}
function registerAppInterest(_x73, _x74) {
  return _registerAppInterest.apply(this, arguments);
}
function _registerAppInterest() {
  _registerAppInterest = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee33(apiKey, appName) {
    var headers, response, errText;
    return _regenerator().w(function (_context33) {
      while (1) switch (_context33.n) {
        case 0:
          headers = {
            'Content-Type': 'application/json'
          };
          if (apiKey) headers['x-api-key'] = apiKey;
          _context33.n = 1;
          return fetch("".concat(BASE_URL, "/app/interest"), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              app_name: appName
            })
          });
        case 1:
          response = _context33.v;
          if (response.ok) {
            _context33.n = 3;
            break;
          }
          _context33.n = 2;
          return response.text();
        case 2:
          errText = _context33.v;
          throw new Error("Failed to register interest: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context33.n = 4;
          return response.json();
        case 4:
          return _context33.a(2, _context33.v);
      }
    }, _callee33);
  }));
  return _registerAppInterest.apply(this, arguments);
}
function getAppInterests(_x75) {
  return _getAppInterests.apply(this, arguments);
}
function _getAppInterests() {
  _getAppInterests = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee34(apiKey) {
    var headers, response, errText;
    return _regenerator().w(function (_context34) {
      while (1) switch (_context34.n) {
        case 0:
          headers = {
            'Content-Type': 'application/json'
          };
          if (apiKey) headers['x-api-key'] = apiKey;
          _context34.n = 1;
          return fetch("".concat(BASE_URL, "/app/interests"), {
            headers: headers
          });
        case 1:
          response = _context34.v;
          if (response.ok) {
            _context34.n = 3;
            break;
          }
          _context34.n = 2;
          return response.text();
        case 2:
          errText = _context34.v;
          throw new Error("Failed to fetch interests: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context34.n = 4;
          return response.json();
        case 4:
          return _context34.a(2, _context34.v);
      }
    }, _callee34);
  }));
  return _getAppInterests.apply(this, arguments);
}
function runClipping(_x76, _x77) {
  return _runClipping.apply(this, arguments);
}
function _runClipping() {
  _runClipping = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee35(apiKey, params) {
    var payload;
    return _regenerator().w(function (_context35) {
      while (1) switch (_context35.n) {
        case 0:
          payload = {
            video_url: params.video_url,
            num_highlights: params.num_highlights || 3,
            aspect_ratio: params.aspect_ratio || "9:16",
            return_coordinates_only: !!params.return_coordinates_only
          };
          return _context35.a(2, submitAndPoll("ai-clipping", payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee35);
  }));
  return _runClipping.apply(this, arguments);
}
function runMotionGraphics(_x78, _x79) {
  return _runMotionGraphics.apply(this, arguments);
}
function _runMotionGraphics() {
  _runMotionGraphics = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee36(apiKey, params) {
    var payload;
    return _regenerator().w(function (_context36) {
      while (1) switch (_context36.n) {
        case 0:
          payload = {
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio || "16:9",
            duration_seconds: params.duration_seconds || 6
          };
          return _context36.a(2, submitAndPoll("motion-graphics", payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee36);
  }));
  return _runMotionGraphics.apply(this, arguments);
}
function runMotionGraphicsEdit(_x80, _x81) {
  return _runMotionGraphicsEdit.apply(this, arguments);
}
function _runMotionGraphicsEdit() {
  _runMotionGraphicsEdit = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee37(apiKey, params) {
    var payload;
    return _regenerator().w(function (_context37) {
      while (1) switch (_context37.n) {
        case 0:
          payload = {
            request_id: params.request_id,
            edit_prompt: params.edit_prompt,
            aspect_ratio: params.aspect_ratio || "16:9",
            duration_seconds: params.duration_seconds || 6
          };
          return _context37.a(2, submitAndPoll("motion-graphics-edit", payload, apiKey, params.onRequestId, 900, params.signal));
      }
    }, _callee37);
  }));
  return _runMotionGraphicsEdit.apply(this, arguments);
}