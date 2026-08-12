"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.estimateModelCost = estimateModelCost;
var _axios = _interopRequireDefault(require("axios"));
var _window$location;
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var BASE_URL = typeof window !== "undefined" && (_window$location = window.location) !== null && _window$location !== void 0 && (_window$location = _window$location.protocol) !== null && _window$location !== void 0 && _window$location.startsWith("http") ? "/api" : "https://api.muapi.ai";
function buildPayload(params) {
  var payload = {};
  var skipKeys = ["_modelId", "onRequestId"];
  for (var key in params) {
    if (!skipKeys.includes(key) && params[key] !== undefined && params[key] !== null) {
      payload[key] = params[key];
    }
  }
  return payload;
}
function extractCost(data) {
  if (data === null || data === undefined) return null;
  if (typeof data === "number") return data;
  if (typeof data === "string") {
    var parsed = parseFloat(data.replace(/[^0-9.]/g, ""));
    return isNaN(parsed) ? data : parsed;
  }
  if (_typeof(data) === "object") {
    var _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _data$cost, _ref7, _data$data$cost;
    var maybe = (_ref = (_ref2 = (_ref3 = (_ref4 = (_ref5 = (_ref6 = (_data$cost = data.cost) !== null && _data$cost !== void 0 ? _data$cost : data.estimated_cost) !== null && _ref6 !== void 0 ? _ref6 : data.estimate) !== null && _ref5 !== void 0 ? _ref5 : data.price) !== null && _ref4 !== void 0 ? _ref4 : data.amount) !== null && _ref3 !== void 0 ? _ref3 : data.total) !== null && _ref2 !== void 0 ? _ref2 : data.usd) !== null && _ref !== void 0 ? _ref : data.data && ((_ref7 = (_data$data$cost = data.data.cost) !== null && _data$data$cost !== void 0 ? _data$data$cost : data.data.estimated_cost) !== null && _ref7 !== void 0 ? _ref7 : data.data.price);
    return maybe !== null && maybe !== void 0 ? maybe : null;
  }
  return null;
}
function postEstimate(_x, _x2, _x3) {
  return _postEstimate.apply(this, arguments);
}
function _postEstimate() {
  _postEstimate = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(modelName, payload, apiKey) {
    var url, response;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          url = "".concat(BASE_URL, "/api/v1/models/").concat(encodeURIComponent(modelName), "/estimate-cost");
          _context.n = 1;
          return _axios["default"].post(url, payload, {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey
            },
            validateStatus: function validateStatus(status) {
              return status >= 200 && status < 300;
            }
          });
        case 1:
          response = _context.v;
          return _context.a(2, response.data);
      }
    }, _callee);
  }));
  return _postEstimate.apply(this, arguments);
}
function estimateModelCost(_x4, _x5, _x6) {
  return _estimateModelCost.apply(this, arguments);
}
function _estimateModelCost() {
  _estimateModelCost = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(apiKey, modelName, payload) {
    var data, _err$response, _data, _t, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          if (!(!apiKey || !modelName)) {
            _context2.n = 1;
            break;
          }
          return _context2.a(2, null);
        case 1:
          _context2.p = 1;
          _context2.n = 2;
          return postEstimate(modelName, buildPayload(payload), apiKey);
        case 2:
          data = _context2.v;
          return _context2.a(2, extractCost(data));
        case 3:
          _context2.p = 3;
          _t = _context2.v;
          if (!((_t === null || _t === void 0 || (_err$response = _t.response) === null || _err$response === void 0 ? void 0 : _err$response.status) === 404)) {
            _context2.n = 7;
            break;
          }
          _context2.p = 4;
          _context2.n = 5;
          return postEstimate((payload === null || payload === void 0 ? void 0 : payload._modelId) || modelName, buildPayload(payload), apiKey);
        case 5:
          _data = _context2.v;
          return _context2.a(2, extractCost(_data));
        case 6:
          _context2.p = 6;
          _t2 = _context2.v;
          return _context2.a(2, null);
        case 7:
          return _context2.a(2, null);
      }
    }, _callee2, null, [[4, 6], [1, 3]]);
  }));
  return _estimateModelCost.apply(this, arguments);
}