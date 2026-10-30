"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { Chip, Muted, TableShell, Th } from "@features/admin/pipeline/components/ui";
import { clock, fill, tr } from "@features/admin/pipeline/utils/pipelineFormat";
import { langfuseService } from "@features/admin/services/langfuse.service";

/**
 * Latest turns a rule flagged (Langfuse `rule.flagged = 1`), each opening the
 * interview in our console and the trace in Langfuse: the same turn seen from
 * both sides.
 */
export default function FlaggedTurnsSection({ days, projectUrl }: { days: number; projectUrl: string }) {
  const { t } = useLanguage();
  const { state } = usePolledResource(() => langfuseService.flagged(days), () => 120_000, [days]);

  let body;
  if (state.status === "loading") body = <Muted>{t("langfuseUi.loading")}</Muted>;
  else if (state.status === "error" || !state.data.connected) body = <Muted>{t("langfuseUi.error")}</Muted>;
  else if (state.data.items.length === 0) body = <Muted>{fill(t("langfuseUi.flagged.empty"), { n: days })}</Muted>;
  else
    body = (
      <TableShell>
        <thead>
          <tr>
            <Th>{t("langfuseUi.flagged.time")}</Th>
            <Th>{t("langfuseUi.flagged.session")}</Th>
            <Th>{t("langfuseUi.flagged.flags")}</Th>
            <Th align="right">{t("langfuseUi.flagged.langfuse")}</Th>
          </tr>
        </thead>
        <tbody>
          {state.data.items.map((item) => (
            <tr key={item.traceId} className="border-t border-[#EAEFF8] text-xs">
              <td className="py-2 pr-3 tabular-nums text-[#475569]">{clock(item.at)}</td>
              <td className="py-2 pr-3">
                {item.sessionId ? (
                  <Link href={`/admin/interviews/${encodeURIComponent(item.sessionId)}`} className="font-semibold text-[#204195] hover:underline">
                    {item.sessionId.slice(0, 8)}
                    {item.turnIndex != null ? ` · ${fill(t("langfuseUi.flagged.turn"), { n: item.turnIndex + 1 })}` : ""}
                  </Link>
                ) : (
                  <span className="text-[#8A98B8]">{t("langfuseUi.flagged.noSession")}</span>
                )}
              </td>
              <td className="py-2 pr-3">
                <span className="flex flex-wrap gap-1">
                  {(item.flags ?? []).length
                    ? (item.flags ?? []).map((flag) => (
                        <Chip key={flag} tone="warn">
                          {tr(t, `aiPipeline.flag.${flag}`, flag)}
                        </Chip>
                      ))
                    : "—"}
                </span>
              </td>
              <td className="py-2 text-right">
                <a
                  href={`${projectUrl}/traces/${encodeURIComponent(item.traceId)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#204195] hover:underline"
                >
                  {t("aiPipeline.llm.openTrace")}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    );

  return (
    <AdminSection title={t("langfuseUi.flagged.title")} description={t("langfuseUi.flagged.note")}>
      {body}
    </AdminSection>
  );
}
