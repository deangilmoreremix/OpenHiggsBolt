"use client";
import React from "react";

function Unavailable({ name }) {
  return React.createElement(
    "div",
    { className: "min-h-screen flex items-center justify-center bg-[#030303] text-white/70 p-8 font-inter" },
    React.createElement(
      "div",
      { className: "max-w-md text-center space-y-3" },
      React.createElement("h2", { className: "text-xl font-bold text-white" }, `${name} is unavailable in this build`),
      React.createElement(
        "p",
        { className: "text-sm text-white/50" },
        "This module's source is loaded from a git submodule that is not included in the production bundle. ",
        React.createElement("br"),
        "Please use the Studio tabs (Image, Video, Audio, Cinema, etc.) — all 13 studios remain fully functional with your own MuAPI key."
      )
    )
  );
}

export function AiAgent(props) {
  return React.createElement(Unavailable, { name: "Agent chat" });
}
export function CreateAgentPage(props) {
  return React.createElement(Unavailable, { name: "Agent builder" });
}
export function EditAgentPage(props) {
  return React.createElement(Unavailable, { name: "Agent editor" });
}
export default AiAgent;
