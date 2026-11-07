// @vitest-environment jsdom
/**
 * Regression: in multi-image mode the picker used to tell the prompt bar about
 * uploaded images only when the user clicked "Done", so a finished upload stayed
 * hidden until the picker was reopened.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import en from "../../messages/en/imageStudio.json";

vi.mock("../../muapi.js", async (orig) => {
  const actual = await orig();
  let n = 0;
  return {
    ...actual,
    uploadFile: vi.fn(async () => `https://example.test/upload-${++n}.png`),
  };
});

import { UploadButton } from "../ImageStudio.jsx";

describe("UploadButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports each finished upload to the parent without waiting for Done", async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <UploadButton apiKey="k" maxImages={4} onSelect={onSelect} onClear={() => {}} copy={en} />,
    );

    const input = container.querySelector('input[type="file"]');
    const files = [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ];
    fireEvent.change(input, { target: { files } });

    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    await waitFor(() => {
      const last = onSelect.mock.calls.at(-1)[0];
      expect(last.urls).toHaveLength(2);
    });
    // The picker panel was never opened, yet both images reached the parent.
    expect(screen.queryByText(en.uploadButton.headerTitle)).toBeNull();
  });

  it("replaces the current pick when a new image is uploaded in single-image mode", async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <UploadButton apiKey="k" maxImages={1} onSelect={onSelect} onClear={() => {}} copy={en} />,
    );
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(["a"], "a.png", { type: "image/png" })] } });
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    fireEvent.change(input, { target: { files: [new File(["b"], "b.png", { type: "image/png" })] } });
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(2));
    const urls = onSelect.mock.calls.at(-1)[0].urls;
    expect(urls).toHaveLength(1);
    expect(urls[0]).not.toBe(onSelect.mock.calls[0][0].urls[0]);
  });
});
