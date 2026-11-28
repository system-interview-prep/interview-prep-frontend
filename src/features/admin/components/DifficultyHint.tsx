"use client";

import { useEffect, useState } from "react";
import { questionBankApi, type DifficultyLevel } from "@features/admin/services/questionBank.service";

// The definitions are the same for every skill and rarely change: load them once per page session.
let cached: Promise<DifficultyLevel[]> | null = null;
const loadLevels = () => {
  cached ??= questionBankApi.difficultyGuide().then(({ data }) => data.levels).catch(() => { cached = null; return []; });
  return cached;
};

/**
 * What the chosen difficulty band asks of a candidate, so the author and the
 * reviewer level a question against the same definition. One line; the
 * audience and a typical question shape are in the tooltip.
 */
export default function DifficultyHint({ band }: { band: string }) {
  const [levels, setLevels] = useState<DifficultyLevel[]>([]);
  useEffect(() => {
    let live = true;
    void loadLevels().then((items) => { if (live) setLevels(items); });
    return () => { live = false; };
  }, []);
  const level = levels.find((item) => item.band === band);
  if (!level) return null;
  return <p className="text-xs text-[#607096]" title={`${level.audience} ${level.shape}`}>
    <span className="font-semibold text-[#14244B]">{level.label}:</span> {level.expects}
  </p>;
}
