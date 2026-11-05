import { describe, expect, it } from "vitest";
import { extractHtml } from "./questionVisualReportGenerator.js";

describe("extractHtml", () => {
  it("returns plain HTML as is", () => {
    const html = "<!DOCTYPE html><html><body>a</body></html>";
    expect(extractHtml(html)).toBe(html);
  });

  it("removes a code fence", () => {
    expect(extractHtml("```html\n<html><body>a</body></html>\n```")).toBe(
      "<html><body>a</body></html>"
    );
  });

  it("removes text before and after the HTML", () => {
    const content =
      "以下がHTMLです。\n```html\n<!DOCTYPE html>\n<html><body>a</body></html>\n```\nご確認ください。";
    expect(extractHtml(content)).toBe(
      "<!DOCTYPE html>\n<html><body>a</body></html>"
    );
  });

  it("keeps a truncated HTML without the closing fence", () => {
    expect(extractHtml("```html\n<html><body>a")).toBe("<html><body>a");
  });
});
