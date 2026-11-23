// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const listAssets = vi.fn(async () => [
  { id: "a1", kind: "image", url: "https://x.test/a.png", name: "a.png" },
]);
vi.mock("../../lib/assetStore.js", () => ({
  listAssets: (...a) => listAssets(...a),
  deleteAsset: vi.fn(async () => true),
  onLibraryChanged: () => () => {},
}));

import UniversalMediaUploader from "../UniversalMediaUploader.jsx";

describe("UniversalMediaUploader saved-assets button", () => {
  beforeEach(() => { cleanup(); listAssets.mockClear(); localStorage.clear(); });
  afterEach(() => cleanup());

  it("fills the slot with a saved asset of the slot's media type", async () => {
    const onChange = vi.fn();
    render(<UniversalMediaUploader apiKey="k" slot={{ mediaType: "image", maxItems: 2, label: "Ref" }} values={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Saved" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use a.png" }));
    expect(listAssets).toHaveBeenCalledWith({ kind: "image" });
    expect(onChange).toHaveBeenCalledWith(["https://x.test/a.png"]);
  });

  it("is hidden when the slot is full", () => {
    render(<UniversalMediaUploader apiKey="k" slot={{ mediaType: "image", maxItems: 1, label: "Ref" }} values={["https://x.test/b.png"]} onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: "Saved" })).toBeNull();
  });
});
