"use client";

import { Box, Cpu, Mic } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { Chip, Muted, TableShell, Th } from "@features/admin/pipeline/components/ui";
import { clock, fill, purposeLabel, tr } from "@features/admin/pipeline/utils/pipelineFormat";
import { aiAdminService, type ConfiguredModel } from "../services/aiAdmin.service";

const PROVIDER_LABEL: Record<string, string> = {
  openai: "OpenAI",
  assemblyai: "AssemblyAI",
  vieneu: "VieNeu",
  elevenlabs: "ElevenLabs",
  cartesia: "Cartesia",
  mineru: "MinerU",
  paddleocr: "PaddleOCR",
  typesafe: "Typesafe",
  livekit: "LiveKit",
};

function providerLabel(provider: string | null | undefined): string {
  if (!provider) return "—";
  return PROVIDER_LABEL[provider.toLowerCase()] ?? provider;
}

/** Provider and model of each AI feature: from the backend configuration, and as seen in the call log. */
export default function AdminAiModelsClient() {
  const { t } = useLanguage();
  const { state, refresh } = usePolledResource(() => aiAdminService.models(30), () => null, []);

  const header = (
    <AdminPageHeader
      title={t("admin.ai.models.title")}
      description={t("aiAdmin.models.subtitle")}
      breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("admin.sidebar.aiModels") }]}
    />
  );

  if (state.status !== "ready") {
    return (
      <div className="space-y-6">
        {header}
        {state.status === "loading" ? (
          <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("aiPipeline.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState variant="error" title={t("aiAdmin.loadError")} description="" onRetry={() => void refresh()} />
        )}
      </div>
    );
  }

  const data = state.data;
  const active = data.configured.filter((row) => row.active);
  const llm = data.configured.find((row) => row.capability === "INTERVIEW_TURN");
  const stt = data.configured.find((row) => row.capability === "VOICE_STT");
  const tts = data.configured.find((row) => row.capability === "VOICE_TTS");
  const label = (row: ConfiguredModel) => tr(t, `aiAdmin.capability.${row.capability}`, row.capability);

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("aiAdmin.models.interviewModel")}
          value={llm?.model ?? "—"}
          subtitle={fill(t("aiAdmin.models.providerSub"), { provider: providerLabel(llm?.provider) })}
          icon={Cpu}
        />
        <AdminMetricCard
          title={t("aiAdmin.models.voice")}
          value={`${providerLabel(stt?.provider)} · ${providerLabel(tts?.provider)}`}
          subtitle={t("aiAdmin.models.voiceSub")}
          icon={Mic}
        />
        <AdminMetricCard
          title={t("aiAdmin.models.activeFeatures")}
          value={`${active.length}/${data.configured.length}`}
          subtitle={t("aiAdmin.models.activeFeaturesSub")}
          icon={Box}
        />
      </div>

      <AdminSection title={t("aiAdmin.models.configured")} description={t("aiAdmin.models.configuredNote")}>
        <TableShell minWidth={640}>
          <thead>
            <tr>
              <Th>{t("aiAdmin.models.feature")}</Th>
              <Th>{t("aiAdmin.models.provider")}</Th>
              <Th>{t("aiAdmin.models.model")}</Th>
              <Th>{t("aiAdmin.models.source")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF8]">
            {data.configured.map((row) => (
              <tr key={row.capability} className={row.active ? "" : "opacity-60"}>
                <td className="py-2 pr-4">
                  <span className="font-semibold text-[#14244B]">{label(row)}</span>
                  <span className="block text-[11px] text-[#607096]">{tr(t, `aiAdmin.capabilityNote.${row.capability}`, "")}</span>
                </td>
                <td className="py-2 pr-4 text-[#14244B]">{providerLabel(row.provider)}</td>
                <td className="py-2 pr-4">
                  <span className="whitespace-nowrap rounded bg-[#EEF2FD] px-2 py-0.5 font-mono text-xs font-semibold text-[#204195]">{row.model}</span>
                </td>
                <td className="py-2">
                  <span className="block font-mono text-[11px] text-[#8A98B8]">{row.source}</span>
                  {!row.active ? (
                    <Chip tone="neutral">
                      {row.mode ? fill(t("aiAdmin.models.offMode"), { mode: row.mode }) : t("aiAdmin.models.off")}
                    </Chip>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </AdminSection>

      <AdminSection
        title={fill(t("aiAdmin.models.observed"), { n: data.windowDays })}
        description={t("aiAdmin.models.observedNote")}
      >
        {data.observed.length ? (
          <TableShell minWidth={640}>
            <thead>
              <tr>
                <Th>{t("aiPipeline.ai.purpose")}</Th>
                <Th>{t("aiAdmin.models.model")}</Th>
                <Th align="right">{t("aiPipeline.ai.calls")}</Th>
                <Th align="right">{t("aiPipeline.ai.errors")}</Th>
                <Th align="right">{t("aiAdmin.models.lastUsed")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {data.observed.map((row) => (
                <tr key={`${row.purpose}-${row.model}`}>
                  <td className="py-2 pr-4">
                    <span className="font-semibold text-[#14244B]">{purposeLabel(row.purpose, t)}</span>
                    <span className="block font-mono text-[11px] text-[#8A98B8]">{row.purpose}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="font-mono text-xs text-[#204195]">{row.model ?? "—"}</span>
                    <span className="block text-[11px] text-[#607096]">{providerLabel(row.provider)}</span>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{row.calls}</td>
                  <td className={`py-2 pr-4 text-right tabular-nums ${row.errors ? "text-[#C43B3B]" : ""}`}>{row.errors}</td>
                  <td className="py-2 text-right text-xs tabular-nums text-[#607096]">
                    {row.lastAt ? `${new Date(row.lastAt).toLocaleDateString("vi-VN")} ${clock(row.lastAt)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <Muted>{t("aiAdmin.models.noCalls")}</Muted>
        )}
      </AdminSection>
    </div>
  );
}
