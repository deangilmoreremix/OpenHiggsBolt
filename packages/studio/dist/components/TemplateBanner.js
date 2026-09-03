"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = TemplateBanner;
var _react = _interopRequireDefault(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function TemplateBanner(_ref) {
  var isApplied = _ref.isApplied,
    onClear = _ref.onClear,
    _ref$label = _ref.label,
    label = _ref$label === void 0 ? 'Template loaded' : _ref$label;
  if (!isApplied) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex items-center justify-between rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 px-3 py-2 text-xs text-[#22d3ee]",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
      className: "font-semibold",
      children: label
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      onClick: onClear,
      className: "rounded-md bg-white/5 px-2 py-1 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors",
      children: "Clear"
    })]
  });
}