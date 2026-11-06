// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const assets = [
  { id: "a1", kind: "image", url: "https://x.test/a.png", name: "a.png", source: "upload" },
  { id: "a2", kind: "image", url: "https://x.test/b.png", name: "b.png", source: "result" },
];
const listAssets = vi.fn(async () => assets);
const deleteAsset = vi.fn(async () => true);
vi.mock("../../lib/assetStore.js", () => ({
  listAssets: (...a) => listAssets(...a),
  deleteAsset: (...a) => deleteAsset(...a),
  onLibraryChanged: () => () => {},
}));

import AssetLibraryButton from "../AssetLibraryButton.jsx";

describe("AssetLibraryButton", () => {
  beforeEach(() => { cleanup(); listAssets.mockClear(); deleteAsset.mockClear(); });
  afterEach(() => cleanup());

  it("lists the saved assets and hands the chosen one back", async () => {
    const onSelect = vi.fn();
    render(<AssetLibraryButton kinds={["image"]} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    const use = await screen.findByRole("button", { name: "Use b.png" });
    fireEvent.click(use);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "a2", url: "https://x.test/b.png" }));
    expect(listAssets).toHaveBeenCalledWith({ kind: "image" });
  });

  it("removes an asset from the library", async () => {
    render(<AssetLibraryButton kinds={["image"]} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    fireEvent.click(await screen.findByRole("button", { name: /Remove a\.png/ }));
    await waitFor(() => expect(deleteAsset).toHaveBeenCalledWith("a1"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Use a.png" })).toBeNull());
  });

  it("offers a tab per media kind", async () => {
    render(<AssetLibraryButton kinds={["image", "video"]} onSelect={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    fireEvent.click(await screen.findByRole("tab", { name: "Videos" }));
    await waitFor(() => expect(listAssets).toHaveBeenLastCalledWith({ kind: "video" }));
  });
});
