const ENGLISH_JD_WORDS = new Set([
  "about",
  "and",
  "apis",
  "are",
  "build",
  "candidate",
  "company",
  "engineer",
  "experience",
  "job",
  "looking",
  "our",
  "requirements",
  "responsibilities",
  "role",
  "skills",
  "team",
  "the",
  "we",
  "will",
  "with",
  "work",
  "you",
]);

const VIETNAMESE_WORDS = new Set([
  "bạn",
  "các",
  "chúng",
  "công",
  "của",
  "kinh",
  "kỹ",
  "là",
  "nghiệm",
  "năng",
  "tôi",
  "việc",
  "và",
  "với",
  "yêu",
]);

/** Conservative display heuristic: false simply means the translation button stays hidden. */
export function isProbablyEnglishJobDescription(text: string): boolean {
  const tokens = text
    .toLocaleLowerCase()
    .match(/[\p{L}]+/gu)
    ?.slice(0, 500) ?? [];
  const englishScore = tokens.filter((token) => ENGLISH_JD_WORDS.has(token)).length;
  const vietnameseScore = tokens.filter((token) => VIETNAMESE_WORDS.has(token)).length;
  return englishScore >= 3 && englishScore > vietnameseScore * 1.5;
}
