import { describe, expect, it } from "vitest";

import { isProbablyEnglishJobDescription } from "../utils/job-description-language";

describe("isProbablyEnglishJobDescription", () => {
  it("recognizes a typical English JD", () => {
    expect(
      isProbablyEnglishJobDescription(
        "We are looking for a backend engineer. You will build APIs and work with our product team."
      )
    ).toBe(true);
  });

  it("does not offer translation for a Vietnamese JD", () => {
    expect(
      isProbablyEnglishJobDescription(
        "Chúng tôi đang tìm kỹ sư backend. Bạn sẽ làm việc với đội ngũ sản phẩm và xây dựng API."
      )
    ).toBe(false);
  });
});
