"use client";

import { Lock, Sparkles, Target } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { cn } from "@/utils";
import { nextTierHint, type EntryDecision, type InterviewEntryPolicy } from "@features/interview/utils/entryGate";

/**
 * The practice tier the match score unlocks, and how far the next one is.
 * The score is a reward, not a gate: a better CV unlocks a harder interview.
 */
export function PracticeTierNote({
  decision,
  policy,
  className,
}: {
  decision: EntryDecision;
  policy: InterviewEntryPolicy;
  className?: string;
}) {
  const { t } = useLanguage();
  const hint = nextTierHint(decision, policy);
  const isChallenge = decision.tier === "challenge";
  const Icon = isChallenge ? Sparkles : Target;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-xs ring-1",
        isChallenge ? "bg-[#FFF8E6] text-[#7A4B00] ring-[#FCB625]/50" : "bg-white text-[#14244B] ring-[#DCE4F3]",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", isChallenge ? "text-[#D99A19]" : "text-[#204195]")} aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-bold">{t(`picker.tier.${decision.tier}`)}</p>
        <p className="mt-0.5 leading-relaxed opacity-90">{t(`picker.tier.${decision.tier}.desc`)}</p>
        {hint && (
          <p className="mt-1 flex items-center gap-1.5 font-semibold text-[#204195]">
            <Lock className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {fmt(t(hint.key), {
                points: hint.points ?? "",
                challenge: policy.challengePercent,
              })}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
