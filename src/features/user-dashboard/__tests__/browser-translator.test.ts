import { describe, expect, it, vi } from "vitest";

import {
  BrowserTranslationUnavailable,
  translateEnglishToVietnameseInBrowser,
} from "../utils/browser-translator";

describe("translateEnglishToVietnameseInBrowser", () => {
  it("uses Chrome's on-device en to vi translator and releases it", async () => {
    const destroy = vi.fn();
    const translate = vi.fn().mockResolvedValue("Kỹ sư phần mềm");
    const create = vi.fn().mockResolvedValue({ translate, destroy });
    const availability = vi.fn().mockResolvedValue("available");

    const result = await translateEnglishToVietnameseInBrowser(
      "Software engineer",
      undefined,
      { Translator: { availability, create } } as never,
    );

    expect(result).toBe("Kỹ sư phần mềm");
    expect(availability).toHaveBeenCalledWith({ sourceLanguage: "en", targetLanguage: "vi" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ sourceLanguage: "en", targetLanguage: "vi" }),
    );
    expect(translate).toHaveBeenCalledWith("Software engineer");
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("reports unsupported browsers without making a network request", async () => {
    await expect(
      translateEnglishToVietnameseInBrowser("Software engineer", undefined, {} as never),
    ).rejects.toBeInstanceOf(BrowserTranslationUnavailable);
  });

  it("reports unsupported language pairs", async () => {
    await expect(
      translateEnglishToVietnameseInBrowser(
        "Software engineer",
        undefined,
        {
          Translator: {
            availability: vi.fn().mockResolvedValue("unavailable"),
            create: vi.fn(),
          },
        } as never,
      ),
    ).rejects.toBeInstanceOf(BrowserTranslationUnavailable);
  });

  it("preserves JD Markdown structure, links and code while translating text", async () => {
    const translations: Record<string, string> = {
      "Responsibilities": "Trách nhiệm",
      "Build APIs": "Xây dựng API",
      "Review pull requests": "Đánh giá pull request",
      "Read": "Đọc",
      "the handbook": "sổ tay",
      ".": ".",
    };
    const translate = vi.fn(async (text: string) => translations[text] ?? text);
    const destroy = vi.fn();
    const input = [
      "## Responsibilities",
      "",
      "- **Build APIs** with `FastAPI`",
      "- Review pull requests",
      "",
      "Read [the handbook](https://example.com/handbook).",
      "",
      "```python",
      "def untouched():",
      "    return True",
      "```",
    ].join("\n");

    const result = await translateEnglishToVietnameseInBrowser(
      input,
      undefined,
      {
        Translator: {
          availability: vi.fn().mockResolvedValue("available"),
          create: vi.fn().mockResolvedValue({ translate, destroy }),
        },
      } as never,
    );

    expect(result).toBe([
      "## Trách nhiệm",
      "",
      "- **Xây dựng API** with `FastAPI`",
      "- Đánh giá pull request",
      "",
      "Đọc [sổ tay](https://example.com/handbook).",
      "",
      "```python",
      "def untouched():",
      "    return True",
      "```",
    ].join("\n"));
    expect(translate).not.toHaveBeenCalledWith("FastAPI");
    expect(translate).not.toHaveBeenCalledWith("def untouched():");
    expect(destroy).toHaveBeenCalledOnce();
  });
});
