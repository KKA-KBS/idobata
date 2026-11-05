import { describe, expect, it } from "vitest";
import { buildThemeContext } from "./chatController.js";

describe("buildThemeContext", () => {
  it("includes the title and description", () => {
    const context = buildThemeContext({
      title: "子育て支援",
      description: "保育園の入りやすさについて",
    });
    expect(context).toContain("この対話のテーマ: 子育て支援");
    expect(context).toContain("テーマの説明: 保育園の入りやすさについて");
  });

  it("omits the description when it is empty", () => {
    const context = buildThemeContext({ title: "子育て支援", description: "" });
    expect(context).toContain("この対話のテーマ: 子育て支援");
    expect(context).not.toContain("テーマの説明");
  });

  it("returns an empty string without a theme", () => {
    expect(buildThemeContext(null)).toBe("");
  });
});
