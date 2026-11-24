"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAdminRoles } from "@features/admin/useAdminRoles";
import BankSuggestionCard from "./BankSuggestionCard";
import { bankInsightsApi, type BankSuggestion } from "@features/admin/services/bankInsights.service";

/** Open suggestions from real interviews for one question (shown on its detail page). */
export default function QuestionSuggestionsSection({ questionId, onChanged }: { questionId: string; onChanged: () => void }) {
  const { t } = useLanguage();
  const roles = useAdminRoles();
  const [items, setItems] = useState<BankSuggestion[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    bankInsightsApi
      .list({ questionId, status: "OPEN" })
      .then(({ data }) => !cancelled && setItems(data.items))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [questionId, reload]);

  const decided = useCallback(() => {
    setReload((n) => n + 1);
    onChanged();
  }, [onChanged]);

  if (items.length === 0) return null;
  return (
    <section className="min-w-0 space-y-3 rounded-2xl border border-[#F3DFB0] bg-[#FFFBF2] p-4 text-sm text-[#14244B] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">{t("bankAi.detail.title")}</h2>
        <Link href="/admin/question-bank/insights" className="text-xs font-semibold text-[#204195] hover:underline">
          {t("bankAi.detail.all")}
        </Link>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <BankSuggestionCard key={item.id} suggestion={item} roles={roles} showQuestion={false} onDecided={decided} />
        ))}
      </ul>
    </section>
  );
}
