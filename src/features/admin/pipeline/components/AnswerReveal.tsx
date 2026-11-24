"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { pipelineService, type CandidateAnswer } from "../services/pipeline.service";
import { clock, fill } from "../utils/pipelineFormat";

type State =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "shown"; answers: CandidateAnswer[] }
  | { status: "error"; notMigrated: boolean };

/**
 * The candidate's own answers to one question, hidden until an admin asks.
 * Each request is written to the access log on the server (and refused when
 * it cannot be), so the button says so before and after.
 */
export default function AnswerReveal({ sessionId, turnId }: { sessionId: string; turnId: string }) {
  const { t } = useLanguage();
  const [state, setState] = useState<State>({ status: "hidden" });

  const show = async () => {
    setState({ status: "loading" });
    try {
      const answers = await pipelineService.answers(sessionId, turnId);
      setState({ status: "shown", answers });
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      setState({ status: "error", notMigrated: status === 503 });
    }
  };

  if (state.status === "hidden" || state.status === "loading") {
    return (
      <button
        type="button"
        onClick={() => void show()}
        disabled={state.status === "loading"}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#204195] transition-colors hover:bg-[#F5F8FF] disabled:opacity-60"
      >
        <Eye className="size-3.5" aria-hidden="true" />
        {state.status === "loading" ? t("aiPipeline.answer.loading") : t("aiPipeline.answer.show")}
      </button>
    );
  }

  if (state.status === "error") {
    return (
      <p className="text-xs text-[#C43B3B]" role="alert">
        {t(state.notMigrated ? "aiPipeline.answer.notMigrated" : "aiPipeline.answer.error")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setState({ status: "hidden" })}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC]"
        >
          <EyeOff className="size-3.5" aria-hidden="true" />
          {t("aiPipeline.answer.hide")}
        </button>
        <span className="inline-flex items-center gap-1 text-[11px] text-[#607096]">
          <ShieldCheck className="size-3.5 text-[#287A4B]" aria-hidden="true" />
          {t("aiPipeline.answer.logged")}
        </span>
      </div>
      {state.answers.length ? (
        <ol className="space-y-2">
          {state.answers.map((answer, index) => (
            <li key={`${answer.at}-${index}`} className="rounded-lg border border-[#EAEFF8] bg-[#F8FAFC] p-3">
              <p className="text-[11px] font-semibold text-[#607096]">
                {fill(t("aiPipeline.answer.item"), { n: index + 1, time: clock(answer.at) })}
                {answer.truncated ? <> · {fill(t("aiPipeline.answer.truncated"), { n: answer.chars })}</> : null}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#14244B]">{answer.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-[#607096]">{t("aiPipeline.answer.none")}</p>
      )}
    </div>
  );
}
