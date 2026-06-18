"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  ImageStudio: true,
  VideoStudio: true,
  ClippingStudio: true,
  VibeMotionStudio: true,
  LipSyncStudio: true,
  CinemaStudio: true,
  AudioStudio: true,
  MarketingStudio: true,
  WorkflowStudio: true,
  AgentStudio: true,
  DesignAgentStudio: true,
  AppsStudio: true,
  McpCliStudio: true
};
Object.defineProperty(exports, "AgentStudio", {
  enumerable: true,
  get: function get() {
    return _AgentStudio["default"];
  }
});
Object.defineProperty(exports, "AppsStudio", {
  enumerable: true,
  get: function get() {
    return _AppsStudio["default"];
  }
});
Object.defineProperty(exports, "AudioStudio", {
  enumerable: true,
  get: function get() {
    return _AudioStudio["default"];
  }
});
Object.defineProperty(exports, "CinemaStudio", {
  enumerable: true,
  get: function get() {
    return _CinemaStudio["default"];
  }
});
Object.defineProperty(exports, "ClippingStudio", {
  enumerable: true,
  get: function get() {
    return _ClippingStudio["default"];
  }
});
Object.defineProperty(exports, "DesignAgentStudio", {
  enumerable: true,
  get: function get() {
    return _DesignAgentStudio["default"];
  }
});
Object.defineProperty(exports, "ImageStudio", {
  enumerable: true,
  get: function get() {
    return _ImageStudio["default"];
  }
});
Object.defineProperty(exports, "LipSyncStudio", {
  enumerable: true,
  get: function get() {
    return _LipSyncStudio["default"];
  }
});
Object.defineProperty(exports, "MarketingStudio", {
  enumerable: true,
  get: function get() {
    return _MarketingStudio["default"];
  }
});
Object.defineProperty(exports, "McpCliStudio", {
  enumerable: true,
  get: function get() {
    return _McpCliStudio["default"];
  }
});
Object.defineProperty(exports, "VibeMotionStudio", {
  enumerable: true,
  get: function get() {
    return _VibeMotionStudio["default"];
  }
});
Object.defineProperty(exports, "VideoStudio", {
  enumerable: true,
  get: function get() {
    return _VideoStudio["default"];
  }
});
Object.defineProperty(exports, "WorkflowStudio", {
  enumerable: true,
  get: function get() {
    return _WorkflowStudio["default"];
  }
});
var _ImageStudio = _interopRequireDefault(require("./components/ImageStudio"));
var _VideoStudio = _interopRequireDefault(require("./components/VideoStudio"));
var _ClippingStudio = _interopRequireDefault(require("./components/ClippingStudio"));
var _VibeMotionStudio = _interopRequireDefault(require("./components/VibeMotionStudio"));
var _LipSyncStudio = _interopRequireDefault(require("./components/LipSyncStudio"));
var _CinemaStudio = _interopRequireDefault(require("./components/CinemaStudio"));
var _AudioStudio = _interopRequireDefault(require("./components/AudioStudio"));
var _MarketingStudio = _interopRequireDefault(require("./components/MarketingStudio"));
var _WorkflowStudio = _interopRequireDefault(require("./components/WorkflowStudio"));
var _AgentStudio = _interopRequireDefault(require("./components/AgentStudio"));
var _DesignAgentStudio = _interopRequireDefault(require("./components/DesignAgentStudio"));
var _AppsStudio = _interopRequireDefault(require("./components/AppsStudio"));
var _McpCliStudio = _interopRequireDefault(require("./components/McpCliStudio"));
var _muapi = require("./muapi");
Object.keys(_muapi).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _muapi[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _muapi[key];
    }
  });
});
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }