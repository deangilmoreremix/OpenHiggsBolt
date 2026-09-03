"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = ModelParameterControls;
var _PromptComposer = require("./prompt/PromptComposer.jsx");
var _jsxRuntime = require("react/jsx-runtime");
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var FIELD_CLASS = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none transition-colors focus:border-[#22d3ee]/50";
function createEmptyValue() {
  var schema = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  if (schema["default"] !== undefined) return schema["default"];
  if (schema.type === "boolean") return false;
  if (schema.type === "array") return [];
  if (schema.type === "object") {
    return Object.fromEntries(Object.entries(schema.properties || {}).map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        property = _ref2[1];
      return [key, createEmptyValue(property)];
    }));
  }
  if (["number", "integer", "int"].includes(schema.type)) return 0;
  return "";
}
function FieldLabel(_ref3) {
  var schema = _ref3.schema,
    inputKey = _ref3.inputKey;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "min-w-0",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "text-xs font-semibold text-white/75",
      children: schema.title || inputKey.replaceAll("_", " ")
    }), schema.description && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "mt-0.5 text-[10px] leading-relaxed text-white/35",
      children: schema.description
    })]
  });
}
function ScalarInput(_ref4) {
  var _schema$minValue, _schema$maxValue, _schema$examples;
  var schema = _ref4.schema,
    value = _ref4.value,
    _onChange = _ref4.onChange,
    label = _ref4.label;
  if (schema["enum"]) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("select", {
      className: FIELD_CLASS,
      "aria-label": label,
      value: value !== null && value !== void 0 ? value : "",
      onChange: function onChange(event) {
        var selected = schema["enum"].find(function (option) {
          return String(option) === event.target.value;
        });
        _onChange(selected);
      },
      children: schema["enum"].map(function (option) {
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("option", {
          value: String(option),
          children: String(option)
        }, String(option));
      })
    });
  }
  if (schema.type === "boolean") {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      role: "switch",
      "aria-label": label,
      "aria-checked": !!value,
      onClick: function onClick() {
        return _onChange(!value);
      },
      className: "relative h-6 w-11 shrink-0 rounded-full border transition-colors ".concat(value ? "border-[#22d3ee]/50 bg-[#22d3ee]/30" : "border-white/10 bg-white/[0.06]"),
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ".concat(value ? "translate-x-5" : "translate-x-0")
      })
    });
  }
  var numeric = ["number", "integer", "int"].includes(schema.type);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
    className: FIELD_CLASS,
    "aria-label": label,
    type: numeric ? "number" : "text",
    value: value !== null && value !== void 0 ? value : "",
    min: (_schema$minValue = schema.minValue) !== null && _schema$minValue !== void 0 ? _schema$minValue : schema.minimum,
    max: (_schema$maxValue = schema.maxValue) !== null && _schema$maxValue !== void 0 ? _schema$maxValue : schema.maximum,
    step: schema.step || (schema.type === "number" ? "any" : 1),
    placeholder: (_schema$examples = schema.examples) !== null && _schema$examples !== void 0 && _schema$examples[0] && _typeof(schema.examples[0]) !== "object" ? String(schema.examples[0]) : undefined,
    onChange: function onChange(event) {
      return _onChange(event.target.value);
    }
  });
}
function ArrayInput(_ref5) {
  var _ref6, _schema$maxItems;
  var schema = _ref5.schema,
    value = _ref5.value,
    onChange = _ref5.onChange,
    label = _ref5.label;
  var items = Array.isArray(value) ? value : [];
  var itemSchema = schema.items || {
    type: "string"
  };
  var maxItems = (_ref6 = (_schema$maxItems = schema.maxItems) !== null && _schema$maxItems !== void 0 ? _schema$maxItems : schema.max_items) !== null && _ref6 !== void 0 ? _ref6 : Infinity;
  var updateItem = function updateItem(index, nextValue) {
    onChange(items.map(function (item, itemIndex) {
      return itemIndex === index ? nextValue : item;
    }));
  };
  var removeItem = function removeItem(index) {
    onChange(items.filter(function (_, itemIndex) {
      return itemIndex !== index;
    }));
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col gap-2",
    children: [items.map(function (item, index) {
      return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "rounded-lg border border-white/[0.07] bg-black/20 p-2.5",
        children: [itemSchema.type === "object" ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "flex flex-col gap-2",
          children: Object.entries(itemSchema.properties || {}).map(function (_ref7) {
            var _item$key;
            var _ref8 = _slicedToArray(_ref7, 2),
              key = _ref8[0],
              property = _ref8[1];
            return /*#__PURE__*/(0, _jsxRuntime.jsxs)("label", {
              className: "flex flex-col gap-1",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] font-semibold text-white/45",
                children: property.title || key.replaceAll("_", " ")
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(ScalarInput, {
                schema: property,
                label: property.title || key.replaceAll("_", " "),
                value: (_item$key = item === null || item === void 0 ? void 0 : item[key]) !== null && _item$key !== void 0 ? _item$key : createEmptyValue(property),
                onChange: function onChange(nextValue) {
                  return updateItem(index, _objectSpread(_objectSpread({}, item), {}, _defineProperty({}, key, nextValue)));
                }
              })]
            }, key);
          })
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(ScalarInput, {
          schema: itemSchema,
          label: "".concat(label, " ").concat(index + 1),
          value: item,
          onChange: function onChange(nextValue) {
            return updateItem(index, nextValue);
          }
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          type: "button",
          onClick: function onClick() {
            return removeItem(index);
          },
          "aria-label": "Remove ".concat(label, " ").concat(index + 1),
          className: "mt-2 text-[10px] font-semibold text-red-300/70 hover:text-red-300",
          children: "Remove"
        })]
      }, index);
    }), items.length < maxItems && /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      type: "button",
      onClick: function onClick() {
        return onChange([].concat(_toConsumableArray(items), [createEmptyValue(itemSchema)]));
      },
      "aria-label": "Add ".concat(label),
      className: "rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs font-semibold text-white/45 hover:border-[#22d3ee]/30 hover:text-[#22d3ee]",
      children: "+ Add"
    })]
  });
}
function ModelParameterControls(_ref9) {
  var inputs = _ref9.inputs,
    values = _ref9.values,
    _onChange2 = _ref9.onChange,
    open = _ref9.open,
    onToggle = _ref9.onToggle;
  if (inputs.length === 0) return null;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "relative",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
      type: "button",
      onClick: onToggle,
      className: (0, _PromptComposer.promptControlClassName)({
        active: open
      }),
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-[10px] font-black text-primary/80",
        children: "PARAMS"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: _PromptComposer.PROMPT_CONTROL_LABEL_CLASS,
        children: inputs.length
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptChevronIcon, {})]
    }), open && /*#__PURE__*/(0, _jsxRuntime.jsxs)(_PromptComposer.PromptPopover, {
      onClick: function onClick(event) {
        return event.stopPropagation();
      },
      className: "w-[min(420px,calc(100vw-2rem))] max-h-[60vh]",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_PromptComposer.PromptPopoverHeader, {
        children: "Model parameters"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex flex-col gap-4",
        children: inputs.map(function (_ref0) {
          var key = _ref0.key,
            schema = _ref0.schema;
          return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex flex-col gap-2",
            children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: schema.type === "boolean" ? "flex items-center justify-between gap-4" : "flex flex-col gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(FieldLabel, {
                schema: schema,
                inputKey: key
              }), schema.type === "array" ? /*#__PURE__*/(0, _jsxRuntime.jsx)(ArrayInput, {
                schema: schema,
                label: schema.title || key.replaceAll("_", " "),
                value: values[key],
                onChange: function onChange(nextValue) {
                  return _onChange2(key, nextValue);
                }
              }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(ScalarInput, {
                schema: schema,
                label: schema.title || key.replaceAll("_", " "),
                value: values[key],
                onChange: function onChange(nextValue) {
                  return _onChange2(key, nextValue);
                }
              })]
            })
          }, key);
        })
      })]
    })]
  });
}