#!/usr/bin/env python3
import os

root = "/workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_27562e7b-e793-4f91-a948-46742e07398d"

# Fix: remove tailwindcss and @tailwindcss/postcss from root deps
pkg_path = os.path.join(root, "package.json")
with open(pkg_path, "r") as f:
    pkg = __import__("json").load(f)

for dep in ["tailwindcss", "@tailwindcss/postcss", "autoprefixer", "postcss"]:
    for section in ["dependencies", "devDependencies"]:
        pkg.get(section, {}).pop(dep, None)

with open(pkg_path, "w") as f:
    __import__("json").dump(pkg, f, indent=2)

# Fix: replace tailwind config with plain PostCSS / CSS setup
tw_conf = os.path.join(root, "tailwind.config.js")
if os.path.exists(tw_conf):
    with open(tw_conf, "w") as f:
        f.write(
            "module.exports = {\n"
            "  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],\n"
            "  theme: {\n"
            "    extend: {\n"
            '      colors: {\n'
            '        primary: { DEFAULT: "#22d3ee", hover: "#06b6d4" },\n'
            '        accent: "#a855f7",\n'
            '        "bg-panel": "#0a0a0a",\n'
            '        muted: "#52525b"\n'
            "      }\n"
            "    }\n"
            "  },\n"
            "  plugins: []\n"
            "};\n"
        )
