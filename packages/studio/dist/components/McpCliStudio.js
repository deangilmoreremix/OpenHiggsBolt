"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = McpCliStudio;
var _react = _interopRequireDefault(require("react"));
var _fa = require("react-icons/fa");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var FEATURES = [{
  tag: 'CLI',
  title: 'muapi-cli',
  icon: _fa.FaTerminal,
  description: 'Generate images, videos, and audio from the terminal across 14+ AI models. Dual interface — colored human output plus JSON for agents (--output-json, --jq filtering). Async workflows, file uploads, credit tracking.',
  code: "npm install -g muapi-cli\nmuapi auth login\nmuapi image generate \"a cyberpunk city\" \\\n  --model flux-dev",
  href: 'https://github.com/SamurAIGPT/muapi-cli'
}, {
  tag: 'MCP',
  title: 'muapi-mcp-server',
  icon: _fa.FaPlug,
  description: 'Connect Claude, Cursor, Windsurf, and any MCP-compatible assistant to 100+ generative models. Hosted endpoint — no install. 19 structured tools with input/output schemas, async polling, and account management.',
  code: "claude mcp add --transport http muapi \\\n  https://api.muapi.ai/mcp \\\n  --header \"Authorization: Bearer YOUR_KEY\"",
  href: 'https://github.com/SamurAIGPT/muapi-mcp-server'
}, {
  tag: 'Skills',
  title: 'Generative Media Skills',
  icon: _fa.FaStar,
  description: 'Multimodal toolkit for Claude Code, Cursor, and Gemini CLI. Cinema Director, Nano-Banana, UI Designer, Logo Creator, Seedance 2, AI Clipping, and YouTube Shorts presets. Agent-native with JSON outputs and semantic exit codes.',
  code: "npx skills add SamurAIGPT/Generative-Media-Skills --all",
  href: 'https://github.com/SamurAIGPT/Generative-Media-Skills'
}];
var QUICK_STEPS = [{
  num: '1',
  title: 'Install the CLI',
  code: 'npm install -g muapi-cli'
}, {
  num: '2',
  title: 'Sign in',
  code: 'muapi auth login'
}, {
  num: '3',
  title: 'Add the skills',
  code: 'npx skills add SamurAIGPT/Generative-Media-Skills'
}];
var EXAMPLES = [{
  title: 'Image generation',
  code: 'muapi image generate "a serene mountain lake at sunrise" \\\n  --model flux-dev --download ./outputs'
}, {
  title: 'Text-to-video',
  code: 'muapi video generate "a dog running on a beach" \\\n  --model kling-master'
}, {
  title: 'Audio creation',
  code: 'muapi audio create "upbeat lo-fi hip hop for studying"'
}, {
  title: 'Run a skill',
  code: 'bash library/visual/nano-banana/scripts/\\\n  generate-nano-art.sh --file image.jpg --view'
}];
function CodeBlock(_ref) {
  var children = _ref.children,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? '' : _ref$className;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("pre", {
    className: "text-[11.5px] font-mono text-[#22d3ee] bg-black/50 border border-white/5 rounded-md px-3 py-2 overflow-x-auto whitespace-pre ".concat(className),
    children: children
  });
}
function McpCliStudio() {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "w-full h-full overflow-y-auto bg-[#050505] text-white",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("section", {
        className: "flex flex-col items-center text-center gap-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white/60",
          children: "For developers & AI agents"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h1", {
          className: "text-4xl md:text-5xl font-bold tracking-tight",
          children: "MCP & CLI"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-white/60 text-base md:text-lg max-w-2xl",
          children: "Use SmartVideo GO from your terminal, your IDE, or any MCP-compatible assistant. Generate cinematic images, videos, and audio across 100+ models \u2014 without leaving your workflow."
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("section", {
        className: "rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-8 flex flex-col gap-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[11px] font-bold uppercase tracking-widest text-white/50",
            children: "Quick start"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex-1 h-px bg-white/5"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "grid md:grid-cols-3 gap-4",
          children: QUICK_STEPS.map(function (step) {
            return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
                className: "flex items-center gap-2",
                children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center",
                  children: step.num
                }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                  className: "text-sm font-bold",
                  children: step.title
                })]
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(CodeBlock, {
                className: "text-[11.5px]",
                children: step.code
              })]
            }, step.num);
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("section", {
        className: "grid md:grid-cols-3 gap-4",
        children: FEATURES.map(function (f) {
          var Icon = f.icon;
          return /*#__PURE__*/(0, _jsxRuntime.jsxs)("a", {
            href: f.href,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col gap-3 hover:bg-white/[0.04] hover:border-white/10 transition-colors group",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                className: "w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white",
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(Icon, {
                  className: "text-lg"
                })
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[10px] font-bold uppercase tracking-widest text-white/50",
                children: f.tag
              })]
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
              className: "text-lg font-bold",
              children: f.title
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
              className: "text-[13px] text-white/60 leading-relaxed",
              children: f.description
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(CodeBlock, {
              children: f.code
            }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "mt-auto flex items-center gap-1.5 text-[12px] font-bold text-white/50 group-hover:text-white transition-colors",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_fa.FaGithub, {
                className: "text-sm"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                children: "View on GitHub"
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_fa.FaExternalLinkAlt, {
                className: "text-[10px]"
              })]
            })]
          }, f.title);
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("section", {
        className: "flex flex-col gap-4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center gap-2",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-[11px] font-bold uppercase tracking-widest text-white/50",
            children: "Examples"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "flex-1 h-px bg-white/5"
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "grid md:grid-cols-2 gap-4",
          children: EXAMPLES.map(function (ex) {
            return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
              className: "rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2",
              children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-[12px] font-bold text-white/80",
                children: ex.title
              }), /*#__PURE__*/(0, _jsxRuntime.jsx)(CodeBlock, {
                children: ex.code
              })]
            }, ex.title);
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        className: "text-center text-xs text-white/40 pb-4",
        children: "Open-source \xB7 MIT licensed \xB7 Works with Claude, Cursor, Windsurf, and Gemini CLI"
      })]
    })
  });
}