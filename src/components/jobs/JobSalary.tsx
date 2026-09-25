"use client";

import React from "react";
import { Coins } from "lucide-react";
import { JobCardSalary } from "./job-card.types";
import { formatSalary } from "./job-card.utils";
import { useLanguage } from "@/i18n/LanguageProvider";

interface JobSalaryProps {
  salary?: JobCardSalary;
}

export function JobSalary({ salary }: JobSalaryProps) {
  const { t } = useLanguage();

  const formatted = formatSalary(salary, {
    month: t("jobs.card.salaryMonth") || "/ month",
    year: t("jobs.card.salaryYear") || "/ year",
    hour: t("jobs.card.salaryHour") || "/ hour",
  });

  if (!formatted) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14244B]">
      <Coins className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
      <span>{formatted}</span>
    </div>
  );
}

export default JobSalary;
