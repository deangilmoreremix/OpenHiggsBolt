"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildWorkflowApiSnippets = buildWorkflowApiSnippets;
exports.calculateDynamicCost = calculateDynamicCost;
exports.createAgent = createAgent;
exports.createWorkflow = createWorkflow;
exports.decomposeLayers = decomposeLayers;
exports.deleteMedia = deleteMedia;
exports.deleteNodeRun = deleteNodeRun;
exports.deleteWorkflow = deleteWorkflow;
exports.estimateV2VCost = estimateV2VCost;
exports.executeWorkflow = executeWorkflow;
exports.expandImage = expandImage;
exports.generateAudio = generateAudio;
exports.generateCharacterVideo = generateCharacterVideo;
exports.generateI2I = generateI2I;
exports.generateI2V = generateI2V;
exports.generateImage = generateImage;
exports.generateMarketingStudioAd = generateMarketingStudioAd;
exports.generateVideo = generateVideo;
exports.getAgentBySlug = getAgentBySlug;
exports.getAgentConversation = getAgentConversation;
exports.getAllNodeSchemas = getAllNodeSchemas;
exports.getAppInterests = getAppInterests;
exports.getHistory = getHistory;
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
exports.pollAgentChatResult = pollAgentChatResult;
exports.processLipSync = processLipSync;
exports.processRecast = processRecast;
exports.processV2V = processV2V;
exports.registerAppInterest = registerAppInterest;
exports.removeBackground = removeBackground;
exports.runClipping = runClipping;
exports.runMotionGraphics = runMotionGraphics;
exports.runMotionGraphicsEdit = runMotionGraphicsEdit;
exports.runSingleNode = runSingleNode;
exports.sendAgentChatMessage = sendAgentChatMessage;
exports.updateWorkflowName = updateWorkflowName;
exports.uploadFile = uploadFile;
exports.upscaleImage = upscaleImage;
var _models = require("./models.js");
var _videoToolCapabilities = require("./videoToolCapabilities.js");
var _imageSizing = require("./imageSizing.js");
var _imageInputContracts = require("./imageInputContracts.js");
var _generationLifecycle = require("./utils/generationLifecycle.js");
var _modelCapabilities = require("./modelCapabilities.js");
var _modelParameters = require("./modelParameters.js");
var _window$location;
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// In an http(s) browser we route through the host app's proxy (Next.js routes
// under /api/* re-issue the call server-side) so api.muapi.ai CORS is bypassed.
// SSR (no window) and Electron's file:// renderer call the upstream directly.
var BASE_URL = typeof window !== 'undefined' && (_window$location = window.location) !== null && _window$location !== void 0 && (_window$location = _window$location.protocol) !== null && _window$location !== void 0 && _window$location.startsWith('http') ? '/api' : 'https://api.muapi.ai';
var PROXY_WF_BASE = '/api/workflow';
var FILE_UPLOAD_TIMEOUT_MS = 300000;
var FILE_UPLOAD_PENDING_PROGRESS = 99;
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
function assertRequiredPrompt(model, params) {
  if (model !== null && model !== void 0 && model.promptRequired && !String(params.prompt || '').trim()) {
    throw new Error('Prompt is required for this model.');
  }
}
function includeRequiredArrayDefaults(model, payload) {
  var defaults = {};
  var _iterator = _createForOfIteratorHelper((model === null || model === void 0 ? void 0 : model.required) || []),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _model$inputs;
      var field = _step.value;
      if (payload[field] !== undefined || (model === null || model === void 0 || (_model$inputs = model.inputs) === null || _model$inputs === void 0 || (_model$inputs = _model$inputs[field]) === null || _model$inputs === void 0 ? void 0 : _model$inputs.type) !== 'array') continue;
      defaults[field] = [];
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return Object.keys(defaults).length > 0 ? _objectSpread(_objectSpread({}, defaults), payload) : payload;
}
function pollForResult(_x, _x2) {
  return _pollForResult.apply(this, arguments);
}
function _pollForResult() {
  _pollForResult = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(requestId, key) {
    var maxAttempts,
      interval,
      _args = arguments;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          maxAttempts = _args.length > 2 && _args[2] !== undefined ? _args[2] : 900;
          interval = _args.length > 3 && _args[3] !== undefined ? _args[3] : 2000;
          return _context.a(2, (0, _generationLifecycle.pollForGenerationResult)({
            baseUrl: BASE_URL,
            requestId: requestId,
            apiKey: key,
            maxAttempts: maxAttempts,
            interval: interval,
            onAuthRequired: notifyAuthRequired
          }));
      }
    }, _callee);
  }));
  return _pollForResult.apply(this, arguments);
}
function normalizePredictionResult(submitData, result, outputUrl) {
  var requestId = (submitData === null || submitData === void 0 ? void 0 : submitData.request_id) || (submitData === null || submitData === void 0 ? void 0 : submitData.id) || (result === null || result === void 0 ? void 0 : result.request_id) || (result === null || result === void 0 ? void 0 : result.id);
  return _objectSpread(_objectSpread(_objectSpread({}, result), requestId ? {
    request_id: requestId
  } : {}), {}, {
    url: outputUrl
  });
}
function submitAndPoll(_x3, _x4, _x5, _x6) {
  return _submitAndPoll.apply(this, arguments);
}
function _submitAndPoll() {
  _submitAndPoll = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(endpoint, payload, key, onRequestId) {
    var _result$outputs, _result$output;
    var maxAttempts,
      url,
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
          url = "".concat(BASE_URL, "/api/v1/").concat(endpoint);
          _context2.n = 1;
          return fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': key
            },
            body: JSON.stringify(payload)
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
          outputUrl = ((_result$outputs = result.outputs) === null || _result$outputs === void 0 ? void 0 : _result$outputs[0]) || result.url || ((_result$output = result.output) === null || _result$output === void 0 ? void 0 : _result$output.url);
          return _context2.a(2, normalizePredictionResult(submitData, result, outputUrl));
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
          payload = _objectSpread(_objectSpread({}, (0, _modelParameters.buildSupplementalInputPayload)(modelInfo, params)), {}, {
            prompt: params.prompt
          });
          if (modelInfo) Object.assign(payload, (0, _imageSizing.buildImageSizePayload)(modelInfo, params.aspect_ratio));else if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
          if (params.resolution) payload.resolution = params.resolution;
          if (params.quality) payload.quality = params.quality;
          if (params.image_url) {
            payload.image_url = params.image_url;
            payload.strength = params.strength || 0.6;
          } else if (params.images_list) {
            payload.images_list = params.images_list;
          } else {
            payload.image_url = null;
          }
          if (params.seed && params.seed !== -1) payload.seed = params.seed;
          return _context3.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60));
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
    var _modelInfo$inputs;
    var modelInfo, endpoint, imageField, imagesList, inputError, payload;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.n) {
        case 0:
          modelInfo = (0, _models.getI2IModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          imageField = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.imageField) || 'image_url';
          imagesList = (0, _imageInputContracts.normalizePrimaryImageUrls)(params.images_list, params.image_url);
          inputError = (0, _imageInputContracts.getImageInputValidationError)(modelInfo, 'i2i', {
            prompt: params.prompt,
            primaryImageUrls: imagesList,
            auxiliaryImageUrls: params
          });
          if (!inputError) {
            _context4.n = 1;
            break;
          }
          throw new Error(inputError);
        case 1:
          payload = _objectSpread(_objectSpread(_objectSpread({}, (0, _modelCapabilities.mapReferenceParams)(modelInfo, params)), (0, _modelParameters.buildSupplementalInputPayload)(modelInfo, params)), (0, _imageInputContracts.buildImageInputPayload)(modelInfo, 'i2i', params));
          if (imagesList.length > 0) {
            if (imageField === 'images_list') payload.images_list = imagesList;else payload[imageField] = imagesList[0];
          }
          if (modelInfo) Object.assign(payload, (0, _imageSizing.buildImageSizePayload)(modelInfo, params.aspect_ratio));else if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
          if (params.resolution) payload.resolution = params.resolution;
          if (params.quality) payload.quality = params.quality;
          if (modelInfo !== null && modelInfo !== void 0 && (_modelInfo$inputs = modelInfo.inputs) !== null && _modelInfo$inputs !== void 0 && _modelInfo$inputs.name) {
            payload.name = params.name || modelInfo.inputs.name["default"];
          }
          return _context4.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60));
      }
    }, _callee4);
  }));
  return _generateI2I.apply(this, arguments);
}
function decomposeLayers(_x1, _x10) {
  return _decomposeLayers.apply(this, arguments);
}
function _decomposeLayers() {
  _decomposeLayers = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(apiKey, params) {
    var _result$output2;
    var endpoint, payload, result, rawImages, images;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          endpoint = 'bytedance-seedream-5.0-pro-layer';
          payload = {
            image_url: params.image_url,
            prompt: params.prompt || '',
            resolution: params.resolution || 'auto',
            output_format: params.output_format || 'png'
          };
          _context5.n = 1;
          return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 300);
        case 1:
          result = _context5.v;
          rawImages = result.images || ((_result$output2 = result.output) === null || _result$output2 === void 0 ? void 0 : _result$output2.images) || result.outputs || (result.url ? [result.url] : []);
          images = Array.isArray(rawImages) ? rawImages : [rawImages];
          return _context5.a(2, _objectSpread(_objectSpread({}, result), {}, {
            images: images
          }));
      }
    }, _callee5);
  }));
  return _decomposeLayers.apply(this, arguments);
}
function generateVideo(_x11, _x12) {
  return _generateVideo.apply(this, arguments);
}
function _generateVideo() {
  _generateVideo = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(apiKey, params) {
    var _params$images_list, _params$videos_list, _params$video_files;
    var modelInfo, endpoint, payload;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.n) {
        case 0:
          modelInfo = (0, _models.getVideoModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          assertRequiredPrompt(modelInfo, params);
          payload = _objectSpread(_objectSpread({}, (0, _modelCapabilities.mapReferenceParams)(modelInfo, params)), (0, _modelParameters.buildSupplementalInputPayload)(modelInfo, params));
          if (params.prompt) payload.prompt = params.prompt;
          if (params.request_id) payload.request_id = params.request_id;
          if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
          if (params.duration) payload.duration = params.duration;
          if (params.resolution) payload.resolution = params.resolution;
          if (params.quality) payload.quality = params.quality;
          if (params.mode) payload.mode = params.mode;
          if (params.image_url) payload.image_url = params.image_url;
          if (((_params$images_list = params.images_list) === null || _params$images_list === void 0 ? void 0 : _params$images_list.length) > 0) payload.images_list = params.images_list;
          if (((_params$videos_list = params.videos_list) === null || _params$videos_list === void 0 ? void 0 : _params$videos_list.length) > 0) payload.videos_list = params.videos_list;
          if (((_params$video_files = params.video_files) === null || _params$video_files === void 0 ? void 0 : _params$video_files.length) > 0) payload.video_files = params.video_files;
          Object.assign(payload, (0, _videoToolCapabilities.serializeVideoToolOptions)(modelInfo, params.options));
          payload = includeRequiredArrayDefaults(modelInfo, payload);
          return _context6.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900));
      }
    }, _callee6);
  }));
  return _generateVideo.apply(this, arguments);
}
function generateI2V(_x13, _x14) {
  return _generateI2V.apply(this, arguments);
}
function _generateI2V() {
  _generateI2V = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(apiKey, params) {
    var _modelInfo$inputs2;
    var modelInfo, endpoint, payload;
    return _regenerator().w(function (_context7) {
      while (1) switch (_context7.n) {
        case 0:
          modelInfo = (0, _models.getI2VModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          assertRequiredPrompt(modelInfo, params);
          payload = _objectSpread(_objectSpread({}, (0, _modelCapabilities.mapReferenceParams)(modelInfo, params)), (0, _modelParameters.buildSupplementalInputPayload)(modelInfo, params));
          if (params.prompt) payload.prompt = params.prompt;
          if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
          if (params.duration) payload.duration = params.duration;
          if (params.resolution) payload.resolution = params.resolution;
          if (params.quality) payload.quality = params.quality;
          if (params.mode) payload.mode = params.mode;
          if (modelInfo !== null && modelInfo !== void 0 && (_modelInfo$inputs2 = modelInfo.inputs) !== null && _modelInfo$inputs2 !== void 0 && _modelInfo$inputs2.name) {
            payload.name = params.name || modelInfo.inputs.name["default"];
          }
          payload = includeRequiredArrayDefaults(modelInfo, payload);
          return _context7.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900));
      }
    }, _callee7);
  }));
  return _generateI2V.apply(this, arguments);
}
function generateMarketingStudioAd(_x15, _x16) {
  return _generateMarketingStudioAd.apply(this, arguments);
}
function _generateMarketingStudioAd() {
  _generateMarketingStudioAd = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(apiKey, params) {
    var endpoint, payload;
    return _regenerator().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          endpoint = params.resolution === '1080p' ? 'sd-2-vip-omni-reference-1080p' : 'seedance-2-vip-omni-reference';
          payload = {
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio || '16:9',
            duration: params.duration || 5,
            images_list: params.images_list || [],
            video_files: params.video_files || []
          };
          return _context8.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900));
      }
    }, _callee8);
  }));
  return _generateMarketingStudioAd.apply(this, arguments);
}
function processV2V(_x17, _x18) {
  return _processV2V.apply(this, arguments);
}
function _processV2V() {
  _processV2V = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(apiKey, params) {
    var modelInfo, endpoint, toolPayload, payload;
    return _regenerator().w(function (_context9) {
      while (1) switch (_context9.n) {
        case 0:
          modelInfo = (0, _models.getV2VModelById)(params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || params.model;
          toolPayload = (0, _videoToolCapabilities.buildVideoToolPayload)(modelInfo, params);
          payload = _objectSpread(_objectSpread(_objectSpread({}, (0, _modelCapabilities.mapReferenceParams)(modelInfo, params)), (0, _modelParameters.buildSupplementalInputPayload)(modelInfo, params)), toolPayload);
          if (modelInfo !== null && modelInfo !== void 0 && modelInfo.hasPrompt && params.prompt) {
            payload.prompt = params.prompt;
          }
          payload = includeRequiredArrayDefaults(modelInfo, payload);
          return _context9.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900));
      }
    }, _callee9);
  }));
  return _processV2V.apply(this, arguments);
}
function estimateV2VCost(_x19, _x20) {
  return _estimateV2VCost.apply(this, arguments);
}
function _estimateV2VCost() {
  _estimateV2VCost = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(params, signal) {
    var _data;
    var modelInfo, endpoint, payload, response, errText, data, _t;
    return _regenerator().w(function (_context0) {
      while (1) switch (_context0.p = _context0.n) {
        case 0:
          modelInfo = (0, _models.getV2VModelById)(params === null || params === void 0 ? void 0 : params.model);
          endpoint = (modelInfo === null || modelInfo === void 0 ? void 0 : modelInfo.endpoint) || (params === null || params === void 0 ? void 0 : params.model);
          if (endpoint) {
            _context0.n = 1;
            break;
          }
          throw new Error('A V2V model is required to estimate cost.');
        case 1:
          payload = (0, _videoToolCapabilities.buildVideoToolPayload)(modelInfo, params);
          _context0.n = 2;
          return fetch("".concat(BASE_URL, "/api/v1/models/").concat(endpoint, "/estimate-cost"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: signal
          });
        case 2:
          response = _context0.v;
          if (response.ok) {
            _context0.n = 4;
            break;
          }
          _context0.n = 3;
          return response.text();
        case 3:
          errText = _context0.v;
          throw new Error("Cost estimate failed: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errText.slice(0, 100)));
        case 4:
          _context0.p = 4;
          _context0.n = 5;
          return response.json();
        case 5:
          data = _context0.v;
          _context0.n = 7;
          break;
        case 6:
          _context0.p = 6;
          _t = _context0.v;
          throw new Error('Cost estimate returned invalid JSON.');
        case 7:
          if (!(typeof ((_data = data) === null || _data === void 0 ? void 0 : _data.cost) !== 'number' || !Number.isFinite(data.cost) || data.cost < 0)) {
            _context0.n = 8;
            break;
          }
          throw new Error('Cost estimate returned an invalid cost.');
        case 8:
          if (!(typeof data.currency !== 'string' || !/^[A-Za-z]{3}$/.test(data.currency.trim()))) {
            _context0.n = 9;
            break;
          }
          throw new Error('Cost estimate returned an invalid currency.');
        case 9:
          return _context0.a(2, {
            cost: data.cost,
            currency: data.currency.trim().toUpperCase()
          });
      }
    }, _callee0, null, [[4, 6]]);
  }));
  return _estimateV2VCost.apply(this, arguments);
}
function processRecast(_x21, _x22) {
  return _processRecast.apply(this, arguments);
}
function _processRecast() {
  _processRecast = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(apiKey, params) {
    var modelInfo, endpoint, videoField, payload;
    return _regenerator().w(function (_context1) {
      while (1) switch (_context1.n) {
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
          return _context1.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900));
      }
    }, _callee1);
  }));
  return _processRecast.apply(this, arguments);
}
function processLipSync(_x23, _x24) {
  return _processLipSync.apply(this, arguments);
}
function _processLipSync() {
  _processLipSync = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(apiKey, params) {
    var modelInfo, endpoint, payload;
    return _regenerator().w(function (_context10) {
      while (1) switch (_context10.n) {
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
          return _context10.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900));
      }
    }, _callee10);
  }));
  return _processLipSync.apply(this, arguments);
}
function generateAudio(_x25, _x26) {
  return _generateAudio.apply(this, arguments);
}
function _generateAudio() {
  _generateAudio = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11(apiKey, params) {
    var modelId, modelInfo, endpoint, payload, skipKeys, key;
    return _regenerator().w(function (_context11) {
      while (1) switch (_context11.n) {
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
          return _context11.a(2, submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 900));
      }
    }, _callee11);
  }));
  return _generateAudio.apply(this, arguments);
}
function uploadFile(apiKey, file, onProgress) {
  return new Promise(function (resolve, reject) {
    var url = "".concat(BASE_URL, "/api/v1/upload_file");
    var formData = new FormData();
    formData.append('file', file);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('x-api-key', apiKey);
    xhr.timeout = FILE_UPLOAD_TIMEOUT_MS;
    if (onProgress) {
      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          var percentComplete = Math.min(Math.round(event.loaded / event.total * 100), FILE_UPLOAD_PENDING_PROGRESS);
          onProgress(percentComplete);
        }
      };
    }
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var _data$data;
          var data = JSON.parse(xhr.responseText);
          var fileUrl = data.url || data.file_url || ((_data$data = data.data) === null || _data$data === void 0 ? void 0 : _data$data.url);
          if (!fileUrl) {
            reject(new Error('No URL returned from file upload'));
          } else {
            onProgress === null || onProgress === void 0 || onProgress(100);
            resolve(fileUrl);
          }
        } catch (e) {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        var detail = xhr.statusText;
        try {
          var errObj = JSON.parse(xhr.responseText);
          detail = errObj.detail || detail;
        } catch (e) {
          // fallback to statusText
        }
        notifyAuthRequired(xhr.status, detail);
        reject(new Error("File upload failed: ".concat(xhr.status, " - ").concat(detail)));
      }
    };
    xhr.onerror = function () {
      return reject(new Error('Network error during file upload'));
    };
    xhr.ontimeout = function () {
      return reject(new Error('File upload timed out. Please try again.'));
    };
    xhr.send(formData);
  });
}
function getUserBalance(_x27) {
  return _getUserBalance.apply(this, arguments);
}
function _getUserBalance() {
  _getUserBalance = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee12(apiKey) {
    var response, errText;
    return _regenerator().w(function (_context12) {
      while (1) switch (_context12.n) {
        case 0:
          _context12.n = 1;
          return fetch("".concat(BASE_URL, "/api/v1/account/balance"), {
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
          notifyAuthRequired(response.status, errText);
          throw new Error("Failed to fetch balance: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context12.n = 4;
          return response.json();
        case 4:
          return _context12.a(2, _context12.v);
      }
    }, _callee12);
  }));
  return _getUserBalance.apply(this, arguments);
}
function getTemplateWorkflows(_x28) {
  return _getTemplateWorkflows.apply(this, arguments);
}
function _getTemplateWorkflows() {
  _getTemplateWorkflows = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee13(apiKey) {
    var response, errText;
    return _regenerator().w(function (_context13) {
      while (1) switch (_context13.n) {
        case 0:
          _context13.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/get-template-workflows"), {
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
          throw new Error("Failed to fetch template workflows: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context13.n = 4;
          return response.json();
        case 4:
          return _context13.a(2, _context13.v);
      }
    }, _callee13);
  }));
  return _getTemplateWorkflows.apply(this, arguments);
}
;
function getUserWorkflows(_x29) {
  return _getUserWorkflows.apply(this, arguments);
}
function _getUserWorkflows() {
  _getUserWorkflows = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee14(apiKey) {
    var response, errText;
    return _regenerator().w(function (_context14) {
      while (1) switch (_context14.n) {
        case 0:
          _context14.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/get-workflow-defs"), {
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
          throw new Error("Failed to fetch user workflows: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context14.n = 4;
          return response.json();
        case 4:
          return _context14.a(2, _context14.v);
      }
    }, _callee14);
  }));
  return _getUserWorkflows.apply(this, arguments);
}
;
function getPublishedWorkflows(_x30) {
  return _getPublishedWorkflows.apply(this, arguments);
}
function _getPublishedWorkflows() {
  _getPublishedWorkflows = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee15(apiKey) {
    var response, errText;
    return _regenerator().w(function (_context15) {
      while (1) switch (_context15.n) {
        case 0:
          _context15.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/get-published-workflows"), {
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
          throw new Error("Failed to fetch published workflows: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context15.n = 4;
          return response.json();
        case 4:
          return _context15.a(2, _context15.v);
      }
    }, _callee15);
  }));
  return _getPublishedWorkflows.apply(this, arguments);
}
;

// Agents — uses direct URL → https://api.muapi.ai/agents/...
function getTemplateAgents(_x31) {
  return _getTemplateAgents.apply(this, arguments);
}
function _getTemplateAgents() {
  _getTemplateAgents = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee16(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context16) {
      while (1) switch (_context16.n) {
        case 0:
          _context16.n = 1;
          return fetch("".concat(BASE_URL, "/agents/templates/agents"), {
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
          throw new Error("Failed to fetch template agents: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context16.n = 4;
          return response.json();
        case 4:
          data = _context16.v;
          return _context16.a(2, Array.isArray(data) ? data : data.agents || data.items || []);
      }
    }, _callee16);
  }));
  return _getTemplateAgents.apply(this, arguments);
}
;
function getUserAgents(_x32) {
  return _getUserAgents.apply(this, arguments);
}
function _getUserAgents() {
  _getUserAgents = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee17(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context17) {
      while (1) switch (_context17.n) {
        case 0:
          _context17.n = 1;
          return fetch("".concat(BASE_URL, "/agents/user/agents"), {
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
          throw new Error("Failed to fetch user agents: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context17.n = 4;
          return response.json();
        case 4:
          data = _context17.v;
          return _context17.a(2, Array.isArray(data) ? data : data.agents || data.items || []);
      }
    }, _callee17);
  }));
  return _getUserAgents.apply(this, arguments);
}
;
function getPublishedAgents(_x33) {
  return _getPublishedAgents.apply(this, arguments);
}
function _getPublishedAgents() {
  _getPublishedAgents = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee18(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context18) {
      while (1) switch (_context18.n) {
        case 0:
          _context18.n = 1;
          return fetch("".concat(BASE_URL, "/agents/featured/agents"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
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
          throw new Error("Failed to fetch featured agents: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context18.n = 4;
          return response.json();
        case 4:
          data = _context18.v;
          return _context18.a(2, Array.isArray(data) ? data : data.agents || data.items || []);
      }
    }, _callee18);
  }));
  return _getPublishedAgents.apply(this, arguments);
}
;

// GET /agents/user/conversations — returns the user's chat history across all agents
function getUserConversations(_x34) {
  return _getUserConversations.apply(this, arguments);
}
function _getUserConversations() {
  _getUserConversations = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee19(apiKey) {
    var response, errText, data;
    return _regenerator().w(function (_context19) {
      while (1) switch (_context19.n) {
        case 0:
          _context19.n = 1;
          return fetch("".concat(BASE_URL, "/agents/user/conversations"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
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
          throw new Error("Failed to fetch conversations: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context19.n = 4;
          return response.json();
        case 4:
          data = _context19.v;
          return _context19.a(2, Array.isArray(data) ? data : []);
      }
    }, _callee19);
  }));
  return _getUserConversations.apply(this, arguments);
}
;

// GET /agents/by-slug/{slug} — public agent details (works unauthenticated for
// published/template agents; x-api-key is sent for consistency but not required).
function getAgentBySlug(_x35, _x36) {
  return _getAgentBySlug.apply(this, arguments);
} // GET /agents/by-slug/{slug}/{conversationId} — chat history for one conversation.
function _getAgentBySlug() {
  _getAgentBySlug = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee20(apiKey, slug) {
    var response, errText;
    return _regenerator().w(function (_context20) {
      while (1) switch (_context20.n) {
        case 0:
          _context20.n = 1;
          return fetch("".concat(BASE_URL, "/agents/by-slug/").concat(slug), {
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
          throw new Error("Failed to fetch agent: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context20.n = 4;
          return response.json();
        case 4:
          return _context20.a(2, _context20.v);
      }
    }, _callee20);
  }));
  return _getAgentBySlug.apply(this, arguments);
}
function getAgentConversation(_x37, _x38, _x39) {
  return _getAgentConversation.apply(this, arguments);
} // POST /agents/by-slug/{slug}/chat — send a message, returns {request_id, status}
// to poll via pollAgentChatResult.
function _getAgentConversation() {
  _getAgentConversation = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee21(apiKey, agentSlug, conversationId) {
    var response, errText;
    return _regenerator().w(function (_context21) {
      while (1) switch (_context21.n) {
        case 0:
          _context21.n = 1;
          return fetch("".concat(BASE_URL, "/agents/by-slug/").concat(agentSlug, "/").concat(conversationId), {
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
          throw new Error("Failed to fetch conversation: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context21.n = 4;
          return response.json();
        case 4:
          return _context21.a(2, _context21.v);
      }
    }, _callee21);
  }));
  return _getAgentConversation.apply(this, arguments);
}
function sendAgentChatMessage(_x40, _x41) {
  return _sendAgentChatMessage.apply(this, arguments);
} // Polls /api/v1/predictions/{requestId}/result until the agent turn completes.
// Unlike submitAndPoll's generic media polling, a completed agent-chat result is
// the full {conversation_id, messages, is_complete, suggestions} envelope, not a
// media URL — while processing, the endpoint doesn't surface intermediate status
// text (get_result_url_from_output only returns output_data once COMPLETED), so
// this just waits until is_complete rather than showing incremental progress.
function _sendAgentChatMessage() {
  _sendAgentChatMessage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee22(apiKey, agentSlug) {
    var _ref,
      message,
      conversationId,
      attachments,
      response,
      errText,
      _args22 = arguments;
    return _regenerator().w(function (_context22) {
      while (1) switch (_context22.n) {
        case 0:
          _ref = _args22.length > 2 && _args22[2] !== undefined ? _args22[2] : {}, message = _ref.message, conversationId = _ref.conversationId, attachments = _ref.attachments;
          _context22.n = 1;
          return fetch("".concat(BASE_URL, "/agents/by-slug/").concat(agentSlug, "/chat"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              message: message,
              conversation_id: conversationId || null,
              attachments: attachments || null,
              stream: false
            })
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
          throw new Error("Failed to send message: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context22.n = 4;
          return response.json();
        case 4:
          return _context22.a(2, _context22.v);
      }
    }, _callee22);
  }));
  return _sendAgentChatMessage.apply(this, arguments);
}
function pollAgentChatResult(_x42, _x43) {
  return _pollAgentChatResult.apply(this, arguments);
} // POST /agents — create a new persona agent (no skill picker in this minimal
// embedded form; skill_ids defaults to [] server-side, so the agent is created
// as a plain system-prompt-driven assistant with no extra tool skills attached).
function _pollAgentChatResult() {
  _pollAgentChatResult = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee23(apiKey, requestId) {
    var _ref2,
      _ref2$maxAttempts,
      maxAttempts,
      _ref2$interval,
      interval,
      url,
      attempt,
      response,
      _errBody$detail,
      errBody,
      data,
      _args23 = arguments;
    return _regenerator().w(function (_context23) {
      while (1) switch (_context23.n) {
        case 0:
          _ref2 = _args23.length > 2 && _args23[2] !== undefined ? _args23[2] : {}, _ref2$maxAttempts = _ref2.maxAttempts, maxAttempts = _ref2$maxAttempts === void 0 ? 150 : _ref2$maxAttempts, _ref2$interval = _ref2.interval, interval = _ref2$interval === void 0 ? 2000 : _ref2$interval;
          url = "".concat(BASE_URL, "/api/v1/predictions/").concat(requestId, "/result");
          attempt = 1;
        case 1:
          if (!(attempt <= maxAttempts)) {
            _context23.n = 10;
            break;
          }
          _context23.n = 2;
          return new Promise(function (resolve) {
            return setTimeout(resolve, interval);
          });
        case 2:
          _context23.n = 3;
          return fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 3:
          response = _context23.v;
          if (!(response.status === 400)) {
            _context23.n = 5;
            break;
          }
          _context23.n = 4;
          return response.json()["catch"](function () {
            return {};
          });
        case 4:
          errBody = _context23.v;
          throw new Error((errBody === null || errBody === void 0 || (_errBody$detail = errBody.detail) === null || _errBody$detail === void 0 ? void 0 : _errBody$detail.error) || 'Agent failed to respond');
        case 5:
          if (response.ok) {
            _context23.n = 7;
            break;
          }
          if (!(attempt === maxAttempts)) {
            _context23.n = 6;
            break;
          }
          throw new Error("Poll failed: ".concat(response.status));
        case 6:
          return _context23.a(3, 9);
        case 7:
          _context23.n = 8;
          return response.json();
        case 8:
          data = _context23.v;
          if (!data.is_complete) {
            _context23.n = 9;
            break;
          }
          return _context23.a(2, data);
        case 9:
          attempt++;
          _context23.n = 1;
          break;
        case 10:
          throw new Error('Agent response timed out.');
        case 11:
          return _context23.a(2);
      }
    }, _callee23);
  }));
  return _pollAgentChatResult.apply(this, arguments);
}
function createAgent(_x44, _x45) {
  return _createAgent.apply(this, arguments);
}
function _createAgent() {
  _createAgent = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee24(apiKey, payload) {
    var response, errText;
    return _regenerator().w(function (_context24) {
      while (1) switch (_context24.n) {
        case 0:
          _context24.n = 1;
          return fetch("".concat(BASE_URL, "/agents"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
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
          throw new Error("Failed to create agent: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context24.n = 4;
          return response.json();
        case 4:
          return _context24.a(2, _context24.v);
      }
    }, _callee24);
  }));
  return _createAgent.apply(this, arguments);
}
function createWorkflow(_x46, _x47) {
  return _createWorkflow.apply(this, arguments);
}
function _createWorkflow() {
  _createWorkflow = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee25(apiKey, payload) {
    var response, errText;
    return _regenerator().w(function (_context25) {
      while (1) switch (_context25.n) {
        case 0:
          _context25.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/create"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
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
          throw new Error("Failed to create workflow: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context25.n = 4;
          return response.json();
        case 4:
          return _context25.a(2, _context25.v);
      }
    }, _callee25);
  }));
  return _createWorkflow.apply(this, arguments);
}
;
function updateWorkflowName(_x48, _x49, _x50) {
  return _updateWorkflowName.apply(this, arguments);
}
function _updateWorkflowName() {
  _updateWorkflowName = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee26(apiKey, workflowId, name) {
    var response, errText;
    return _regenerator().w(function (_context26) {
      while (1) switch (_context26.n) {
        case 0:
          _context26.n = 1;
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
          response = _context26.v;
          if (response.ok) {
            _context26.n = 3;
            break;
          }
          _context26.n = 2;
          return response.text();
        case 2:
          errText = _context26.v;
          throw new Error("Failed to rename workflow: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context26.n = 4;
          return response.json();
        case 4:
          return _context26.a(2, _context26.v);
      }
    }, _callee26);
  }));
  return _updateWorkflowName.apply(this, arguments);
}
;
function deleteWorkflow(_x51, _x52) {
  return _deleteWorkflow.apply(this, arguments);
}
function _deleteWorkflow() {
  _deleteWorkflow = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee27(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context27) {
      while (1) switch (_context27.n) {
        case 0:
          _context27.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/delete-workflow-def/").concat(workflowId), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
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
          throw new Error("Failed to delete workflow: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context27.n = 4;
          return response.json();
        case 4:
          return _context27.a(2, _context27.v);
      }
    }, _callee27);
  }));
  return _deleteWorkflow.apply(this, arguments);
}
;
function getWorkflowInputs(_x53, _x54) {
  return _getWorkflowInputs.apply(this, arguments);
}
function _getWorkflowInputs() {
  _getWorkflowInputs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee28(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context28) {
      while (1) switch (_context28.n) {
        case 0:
          _context28.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/api-inputs"), {
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
          throw new Error("Failed to fetch workflow inputs: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context28.n = 4;
          return response.json();
        case 4:
          return _context28.a(2, _context28.v);
      }
    }, _callee28);
  }));
  return _getWorkflowInputs.apply(this, arguments);
}
;
function executeWorkflow(_x55, _x56, _x57) {
  return _executeWorkflow.apply(this, arguments);
}
function _executeWorkflow() {
  _executeWorkflow = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee29(apiKey, workflowId, inputs) {
    var response, errText, submitData, runId;
    return _regenerator().w(function (_context29) {
      while (1) switch (_context29.n) {
        case 0:
          _context29.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/api-execute"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              inputs: inputs
            })
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
          throw new Error("Failed to execute workflow: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context29.n = 4;
          return response.json();
        case 4:
          submitData = _context29.v;
          runId = submitData.run_id || submitData.id;
          if (runId) {
            _context29.n = 5;
            break;
          }
          return _context29.a(2, submitData);
        case 5:
          _context29.n = 6;
          return pollWorkflowResult(runId, apiKey);
        case 6:
          return _context29.a(2, _context29.v);
      }
    }, _callee29);
  }));
  return _executeWorkflow.apply(this, arguments);
}
;
function pollWorkflowResult(_x58, _x59) {
  return _pollWorkflowResult.apply(this, arguments);
}
function _pollWorkflowResult() {
  _pollWorkflowResult = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee30(runId, apiKey) {
    var maxAttempts,
      interval,
      pollUrl,
      attempt,
      _data$status,
      response,
      data,
      status,
      _args30 = arguments,
      _t2;
    return _regenerator().w(function (_context30) {
      while (1) switch (_context30.p = _context30.n) {
        case 0:
          maxAttempts = _args30.length > 2 && _args30[2] !== undefined ? _args30[2] : 900;
          interval = _args30.length > 3 && _args30[3] !== undefined ? _args30[3] : 2000;
          pollUrl = "".concat(BASE_URL, "/workflow/run/").concat(runId, "/api-outputs");
          attempt = 1;
        case 1:
          if (!(attempt <= maxAttempts)) {
            _context30.n = 11;
            break;
          }
          _context30.n = 2;
          return new Promise(function (resolve) {
            return setTimeout(resolve, interval);
          });
        case 2:
          _context30.p = 2;
          _context30.n = 3;
          return fetch(pollUrl, {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 3:
          response = _context30.v;
          if (response.ok) {
            _context30.n = 5;
            break;
          }
          if (!(response.status >= 500)) {
            _context30.n = 4;
            break;
          }
          return _context30.a(3, 10);
        case 4:
          throw new Error("Poll Failed: ".concat(response.status));
        case 5:
          _context30.n = 6;
          return response.json();
        case 6:
          data = _context30.v;
          status = (_data$status = data.status) === null || _data$status === void 0 ? void 0 : _data$status.toLowerCase();
          if (!(status === 'completed' || status === 'succeeded' || status === 'success')) {
            _context30.n = 7;
            break;
          }
          return _context30.a(2, data);
        case 7:
          if (!(status === 'failed' || status === 'error')) {
            _context30.n = 8;
            break;
          }
          throw new Error("Workflow failed: ".concat(data.error || 'Unknown error'));
        case 8:
          _context30.n = 10;
          break;
        case 9:
          _context30.p = 9;
          _t2 = _context30.v;
          if (!(attempt === maxAttempts)) {
            _context30.n = 10;
            break;
          }
          throw _t2;
        case 10:
          attempt++;
          _context30.n = 1;
          break;
        case 11:
          throw new Error('Workflow timed out after polling.');
        case 12:
          return _context30.a(2);
      }
    }, _callee30, null, [[2, 9]]);
  }));
  return _pollWorkflowResult.apply(this, arguments);
}
;
function getAllNodeSchemas(_x60, _x61) {
  return _getAllNodeSchemas.apply(this, arguments);
}
function _getAllNodeSchemas() {
  _getAllNodeSchemas = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee31(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context31) {
      while (1) switch (_context31.n) {
        case 0:
          _context31.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/node-schemas"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context31.v;
          if (response.ok) {
            _context31.n = 3;
            break;
          }
          _context31.n = 2;
          return response.text();
        case 2:
          errText = _context31.v;
          throw new Error("Failed to fetch node schemas: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context31.n = 4;
          return response.json();
        case 4:
          return _context31.a(2, _context31.v);
      }
    }, _callee31);
  }));
  return _getAllNodeSchemas.apply(this, arguments);
}
;
function getWorkflowData(_x62, _x63) {
  return _getWorkflowData.apply(this, arguments);
}
function _getWorkflowData() {
  _getWorkflowData = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee32(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context32) {
      while (1) switch (_context32.n) {
        case 0:
          _context32.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/get-workflow-def/").concat(workflowId), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
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
          throw new Error("Failed to fetch workflow data: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context32.n = 4;
          return response.json();
        case 4:
          return _context32.a(2, _context32.v);
      }
    }, _callee32);
  }));
  return _getWorkflowData.apply(this, arguments);
}
;
function getNodeSchemas(_x64, _x65) {
  return _getNodeSchemas.apply(this, arguments);
}
function _getNodeSchemas() {
  _getNodeSchemas = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee33(apiKey, workflowId) {
    var response, errText;
    return _regenerator().w(function (_context33) {
      while (1) switch (_context33.n) {
        case 0:
          _context33.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/api-node-schemas"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
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
          throw new Error("Failed to fetch node schemas: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context33.n = 4;
          return response.json();
        case 4:
          return _context33.a(2, _context33.v);
      }
    }, _callee33);
  }));
  return _getNodeSchemas.apply(this, arguments);
}
function runSingleNode(_x66, _x67, _x68, _x69) {
  return _runSingleNode.apply(this, arguments);
}
function _runSingleNode() {
  _runSingleNode = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee34(apiKey, workflowId, nodeId, payload) {
    var response, errText;
    return _regenerator().w(function (_context34) {
      while (1) switch (_context34.n) {
        case 0:
          _context34.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/").concat(workflowId, "/node/").concat(nodeId, "/run"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
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
          throw new Error("Failed to run single node: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context34.n = 4;
          return response.json();
        case 4:
          return _context34.a(2, _context34.v);
      }
    }, _callee34);
  }));
  return _runSingleNode.apply(this, arguments);
}
function deleteNodeRun(_x70, _x71) {
  return _deleteNodeRun.apply(this, arguments);
}
function _deleteNodeRun() {
  _deleteNodeRun = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee35(apiKey, nodeRunId) {
    var response, errText;
    return _regenerator().w(function (_context35) {
      while (1) switch (_context35.n) {
        case 0:
          _context35.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/node-run/").concat(nodeRunId), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context35.v;
          if (response.ok) {
            _context35.n = 3;
            break;
          }
          _context35.n = 2;
          return response.text();
        case 2:
          errText = _context35.v;
          throw new Error("Failed to delete node run: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context35.n = 4;
          return response.json();
        case 4:
          return _context35.a(2, _context35.v);
      }
    }, _callee35);
  }));
  return _deleteNodeRun.apply(this, arguments);
}
function getNodeStatus(_x72, _x73) {
  return _getNodeStatus.apply(this, arguments);
}
/**
 * Handle proxy requests centralizing communication logic with MuAPI.
 * This is used by the server-side entry points.
 */
function _getNodeStatus() {
  _getNodeStatus = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee36(apiKey, runId) {
    var response, errText;
    return _regenerator().w(function (_context36) {
      while (1) switch (_context36.n) {
        case 0:
          _context36.n = 1;
          return fetch("".concat(BASE_URL, "/workflow/run/").concat(runId, "/status"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context36.v;
          if (response.ok) {
            _context36.n = 3;
            break;
          }
          _context36.n = 2;
          return response.text();
        case 2:
          errText = _context36.v;
          throw new Error("Failed to get node status: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context36.n = 4;
          return response.json();
        case 4:
          return _context36.a(2, _context36.v);
      }
    }, _callee36);
  }));
  return _getNodeStatus.apply(this, arguments);
}
function handleProxyRequest(_x74, _x75, _x76, _x77, _x78, _x79) {
  return _handleProxyRequest.apply(this, arguments);
}
/**
 * A centralized handler for Next.js API routes or middleware.
 */
function _handleProxyRequest() {
  _handleProxyRequest = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee37(prefix, path, method, headers, body, apiKey) {
    var url, finalHeaders, response, contentType, buffer, _t3;
    return _regenerator().w(function (_context37) {
      while (1) switch (_context37.p = _context37.n) {
        case 0:
          url = "".concat(BASE_URL, "/").concat(prefix, "/").concat(path);
          finalHeaders = new Headers(headers);
          finalHeaders["delete"]('host');
          finalHeaders["delete"]('connection');
          finalHeaders["delete"]('content-length'); // Let fetch recalculate this for safety

          if (apiKey) {
            finalHeaders.set('x-api-key', apiKey);
          }
          _context37.p = 1;
          _context37.n = 2;
          return fetch(url, {
            method: method,
            headers: finalHeaders,
            body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
            redirect: 'follow'
          });
        case 2:
          response = _context37.v;
          contentType = response.headers.get('Content-Type') || 'application/json';
          _context37.n = 3;
          return response.arrayBuffer();
        case 3:
          buffer = _context37.v;
          return _context37.a(2, {
            status: response.status,
            contentType: contentType,
            data: buffer
          });
        case 4:
          _context37.p = 4;
          _t3 = _context37.v;
          console.error("MuAPI Proxy error for ".concat(url, ":"), _t3);
          throw _t3;
        case 5:
          return _context37.a(2);
      }
    }, _callee37, null, [[1, 4]]);
  }));
  return _handleProxyRequest.apply(this, arguments);
}
function handleServerSideProxy(_x80, _x81, _x82, _x83) {
  return _handleServerSideProxy.apply(this, arguments);
}
function _handleServerSideProxy() {
  _handleServerSideProxy = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee38(prefix, request, params, apiKey) {
    var slug, pathSegments, path, method, body, _URL, search, pathWithSearch, _t4;
    return _regenerator().w(function (_context38) {
      while (1) switch (_context38.p = _context38.n) {
        case 0:
          _context38.p = 0;
          _context38.n = 1;
          return params;
        case 1:
          slug = _context38.v;
          pathSegments = slug.path || [];
          path = pathSegments.join('/');
          method = request.method;
          body = null;
          if (!(method !== 'GET' && method !== 'HEAD')) {
            _context38.n = 3;
            break;
          }
          _context38.n = 2;
          return request.arrayBuffer();
        case 2:
          body = _context38.v;
        case 3:
          _URL = new URL(request.url), search = _URL.search;
          pathWithSearch = search ? "".concat(path).concat(search) : path;
          _context38.n = 4;
          return handleProxyRequest(prefix, pathWithSearch, method, request.headers, body, apiKey);
        case 4:
          return _context38.a(2, _context38.v);
        case 5:
          _context38.p = 5;
          _t4 = _context38.v;
          console.error("Server proxy failed:", _t4);
          throw _t4;
        case 6:
          return _context38.a(2);
      }
    }, _callee38, null, [[0, 5]]);
  }));
  return _handleServerSideProxy.apply(this, arguments);
}
function calculateDynamicCost(_x84, _x85, _x86) {
  return _calculateDynamicCost.apply(this, arguments);
}
function _calculateDynamicCost() {
  _calculateDynamicCost = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee39(apiKey, taskName, payload) {
    var response, errText;
    return _regenerator().w(function (_context39) {
      while (1) switch (_context39.n) {
        case 0:
          _context39.n = 1;
          return fetch("".concat(BASE_URL, "/api/v1/app/calculate_dynamic_cost"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              task_name: taskName,
              payload: payload
            })
          });
        case 1:
          response = _context39.v;
          if (response.ok) {
            _context39.n = 3;
            break;
          }
          _context39.n = 2;
          return response.text();
        case 2:
          errText = _context39.v;
          throw new Error("Failed to calculate dynamic cost: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context39.n = 4;
          return response.json();
        case 4:
          return _context39.a(2, _context39.v);
      }
    }, _callee39);
  }));
  return _calculateDynamicCost.apply(this, arguments);
}
function registerAppInterest(_x87, _x88) {
  return _registerAppInterest.apply(this, arguments);
}
function _registerAppInterest() {
  _registerAppInterest = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee40(apiKey, appName) {
    var response, errText;
    return _regenerator().w(function (_context40) {
      while (1) switch (_context40.n) {
        case 0:
          _context40.n = 1;
          return fetch("".concat(BASE_URL, "/app/interest"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              app_name: appName
            })
          });
        case 1:
          response = _context40.v;
          if (response.ok) {
            _context40.n = 3;
            break;
          }
          _context40.n = 2;
          return response.text();
        case 2:
          errText = _context40.v;
          throw new Error("Failed to register interest: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context40.n = 4;
          return response.json();
        case 4:
          return _context40.a(2, _context40.v);
      }
    }, _callee40);
  }));
  return _registerAppInterest.apply(this, arguments);
}
function getAppInterests(_x89) {
  return _getAppInterests.apply(this, arguments);
} // Paginated past-generations list, scoped server-side to the calling identity
// (BYOK key or white-label session token) — see GET /api/v1/history.
function _getAppInterests() {
  _getAppInterests = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee41(apiKey) {
    var response, errText;
    return _regenerator().w(function (_context41) {
      while (1) switch (_context41.n) {
        case 0:
          _context41.n = 1;
          return fetch("".concat(BASE_URL, "/app/interests"), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context41.v;
          if (response.ok) {
            _context41.n = 3;
            break;
          }
          _context41.n = 2;
          return response.text();
        case 2:
          errText = _context41.v;
          throw new Error("Failed to fetch interests: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context41.n = 4;
          return response.json();
        case 4:
          return _context41.a(2, _context41.v);
      }
    }, _callee41);
  }));
  return _getAppInterests.apply(this, arguments);
}
function getHistory(_x90) {
  return _getHistory.apply(this, arguments);
} // DELETE /api/v1/predictions/{requestId}/media — strips input/output media
// URLs from the request (S3 objects removed) and clears them from the row;
// used to back the "delete generated item" action against server-backed
// (backfilled) history lists, since removing an item from local component
// state alone doesn't touch the server record or its stored media.
function _getHistory() {
  _getHistory = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee42(apiKey) {
    var _ref3,
      cursor,
      _ref3$limit,
      limit,
      params,
      response,
      errText,
      _args42 = arguments;
    return _regenerator().w(function (_context42) {
      while (1) switch (_context42.n) {
        case 0:
          _ref3 = _args42.length > 1 && _args42[1] !== undefined ? _args42[1] : {}, cursor = _ref3.cursor, _ref3$limit = _ref3.limit, limit = _ref3$limit === void 0 ? 50 : _ref3$limit;
          params = new URLSearchParams();
          if (cursor) params.set('cursor', cursor);
          if (limit) params.set('limit', String(limit));
          _context42.n = 1;
          return fetch("".concat(BASE_URL, "/api/v1/history?").concat(params.toString()), {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context42.v;
          if (response.ok) {
            _context42.n = 3;
            break;
          }
          _context42.n = 2;
          return response.text();
        case 2:
          errText = _context42.v;
          throw new Error("Failed to fetch history: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context42.n = 4;
          return response.json();
        case 4:
          return _context42.a(2, _context42.v);
      }
    }, _callee42);
  }));
  return _getHistory.apply(this, arguments);
}
function deleteMedia(_x91, _x92) {
  return _deleteMedia.apply(this, arguments);
}
function _deleteMedia() {
  _deleteMedia = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee43(apiKey, requestId) {
    var response, errText;
    return _regenerator().w(function (_context43) {
      while (1) switch (_context43.n) {
        case 0:
          _context43.n = 1;
          return fetch("".concat(BASE_URL, "/api/v1/predictions/").concat(requestId, "/media"), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            }
          });
        case 1:
          response = _context43.v;
          if (response.ok) {
            _context43.n = 3;
            break;
          }
          _context43.n = 2;
          return response.text();
        case 2:
          errText = _context43.v;
          notifyAuthRequired(response.status, errText);
          throw new Error("Failed to delete: ".concat(response.status, " - ").concat(errText.slice(0, 100)));
        case 3:
          _context43.n = 4;
          return response.json();
        case 4:
          return _context43.a(2, _context43.v);
      }
    }, _callee43);
  }));
  return _deleteMedia.apply(this, arguments);
}
function runClipping(_x93, _x94) {
  return _runClipping.apply(this, arguments);
}
function _runClipping() {
  _runClipping = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee44(apiKey, params) {
    var payload;
    return _regenerator().w(function (_context44) {
      while (1) switch (_context44.n) {
        case 0:
          payload = {
            video_url: params.video_url,
            num_highlights: params.num_highlights || 3,
            aspect_ratio: params.aspect_ratio || "9:16",
            return_coordinates_only: !!params.return_coordinates_only
          };
          return _context44.a(2, submitAndPoll("ai-clipping", payload, apiKey, params.onRequestId, 900));
      }
    }, _callee44);
  }));
  return _runClipping.apply(this, arguments);
}
function runMotionGraphics(_x95, _x96) {
  return _runMotionGraphics.apply(this, arguments);
}
function _runMotionGraphics() {
  _runMotionGraphics = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee45(apiKey, params) {
    var payload;
    return _regenerator().w(function (_context45) {
      while (1) switch (_context45.n) {
        case 0:
          payload = {
            prompt: params.prompt,
            aspect_ratio: params.aspect_ratio || "16:9",
            duration_seconds: params.duration_seconds || 6
          };
          return _context45.a(2, submitAndPoll("motion-graphics", payload, apiKey, params.onRequestId, 900));
      }
    }, _callee45);
  }));
  return _runMotionGraphics.apply(this, arguments);
}
function runMotionGraphicsEdit(_x97, _x98) {
  return _runMotionGraphicsEdit.apply(this, arguments);
}
function _runMotionGraphicsEdit() {
  _runMotionGraphicsEdit = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee46(apiKey, params) {
    var payload;
    return _regenerator().w(function (_context46) {
      while (1) switch (_context46.n) {
        case 0:
          payload = {
            request_id: params.request_id,
            edit_prompt: params.edit_prompt,
            aspect_ratio: params.aspect_ratio || "16:9",
            duration_seconds: params.duration_seconds || 6
          };
          return _context46.a(2, submitAndPoll("motion-graphics-edit", payload, apiKey, params.onRequestId, 900));
      }
    }, _callee46);
  }));
  return _runMotionGraphicsEdit.apply(this, arguments);
}
function upscaleImage(_x99, _x100) {
  return _upscaleImage.apply(this, arguments);
}
function _upscaleImage() {
  _upscaleImage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee47(apiKey, _ref4) {
    var model, image_url, resolution, upscale_factor, onRequestId, endpoint, payload;
    return _regenerator().w(function (_context47) {
      while (1) switch (_context47.n) {
        case 0:
          model = _ref4.model, image_url = _ref4.image_url, resolution = _ref4.resolution, upscale_factor = _ref4.upscale_factor, onRequestId = _ref4.onRequestId;
          endpoint = model;
          payload = {
            image_url: image_url
          };
          if (model === "seedvr2-image-upscale") {
            payload.resolution = resolution || "4k";
          } else if (model === "topaz-image-upscale") {
            payload.upscale_factor = Number(upscale_factor) || 2;
          } else if (model === "ai-image-upscaler") {
            endpoint = "ai-image-upscale";
          }
          return _context47.a(2, submitAndPoll(endpoint, payload, apiKey, onRequestId, 90));
      }
    }, _callee47);
  }));
  return _upscaleImage.apply(this, arguments);
}
function removeBackground(_x101, _x102) {
  return _removeBackground.apply(this, arguments);
}
function _removeBackground() {
  _removeBackground = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee48(apiKey, _ref5) {
    var image_url, onRequestId, endpoint, payload;
    return _regenerator().w(function (_context48) {
      while (1) switch (_context48.n) {
        case 0:
          image_url = _ref5.image_url, onRequestId = _ref5.onRequestId;
          endpoint = "ai-background-remover";
          payload = {
            image_url: image_url
          };
          return _context48.a(2, submitAndPoll(endpoint, payload, apiKey, onRequestId, 90));
      }
    }, _callee48);
  }));
  return _removeBackground.apply(this, arguments);
}
function expandImage(_x103, _x104) {
  return _expandImage.apply(this, arguments);
}
function _expandImage() {
  _expandImage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee49(apiKey, _ref6) {
    var image_url, onRequestId, endpoint, payload;
    return _regenerator().w(function (_context49) {
      while (1) switch (_context49.n) {
        case 0:
          image_url = _ref6.image_url, onRequestId = _ref6.onRequestId;
          endpoint = "ai-image-extension";
          payload = {
            image_url: image_url
          };
          return _context49.a(2, submitAndPoll(endpoint, payload, apiKey, onRequestId, 90));
      }
    }, _callee49);
  }));
  return _expandImage.apply(this, arguments);
}
function buildWorkflowApiSnippets(workflowId, inputs, options) {
  return "";
}
function generateCharacterVideo() {
  return {};
}