import type { RubricCriterionInput } from "@features/admin/services/questionBank.service";

const anchors = (levels: [string, string, string, string]) =>
  levels.map((description, level) => ({ level: level as 0 | 1 | 2 | 3, description }));

/** Starting rubric for a new question: weights total 1.0 and every criterion has anchors 0-3. */
export const RUBRIC_TEMPLATE: RubricCriterionInput[] = [
  {
    stableKey: "accuracy",
    name: "Độ chính xác kỹ thuật",
    description: "Giải thích đúng khái niệm và cơ chế.",
    weight: 0.5,
    anchors: anchors(["Sai hoặc không trả lời", "Đúng một phần, còn nhầm lẫn", "Đúng, thiếu chi tiết", "Đúng và đầy đủ"]),
  },
  {
    stableKey: "depth",
    name: "Chiều sâu & trade-off",
    description: "Nêu được giới hạn, đánh đổi và ví dụ thực tế.",
    weight: 0.5,
    anchors: anchors(["Không có", "Nêu chung chung", "Có trade-off cụ thể", "Trade-off kèm ví dụ thực tế"]),
  },
];

export const RUBRIC_TEMPLATE_JSON = JSON.stringify(RUBRIC_TEMPLATE, null, 2);

/** Parse and pre-check rubric JSON so the author sees mistakes before Core rejects them. */
export function parseRubricCriteria(raw: string): { criteria: RubricCriterionInput[] } | { error: string } {
  let criteria: RubricCriterionInput[];
  try { criteria = JSON.parse(raw); } catch { return { error: "Rubric JSON không đúng cú pháp." }; }
  if (!Array.isArray(criteria) || criteria.length === 0) return { error: "Rubric cần ít nhất một tiêu chí." };
  const total = criteria.reduce((sum, item) => sum + Number(item?.weight ?? 0), 0);
  if (Math.abs(total - 1) > 0.0001) return { error: `Tổng trọng số rubric phải bằng 1.0 (hiện tại ${total}).` };
  const missingAnchors = criteria.find((item) => [0, 1, 2, 3].some((level) => !item?.anchors?.some((anchor) => anchor.level === level)));
  if (missingAnchors) return { error: `Tiêu chí "${missingAnchors.stableKey ?? "?"}" cần đủ anchor mức 0-3.` };
  return { criteria };
}
