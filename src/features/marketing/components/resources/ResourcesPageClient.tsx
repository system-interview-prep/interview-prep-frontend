"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";
import MarketingSectionHeader from "../shared/MarketingSectionHeader";
import MarketingCTA from "../shared/MarketingCTA";
import CoachCallout from "../shared/CoachCallout";
import {
  RESOURCE_ITEMS,
  RESOURCE_TOPICS,
  TopicId,
} from "../../data/resources.data";

export default function ResourcesPageClient() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const [selectedTopic, setSelectedTopic] = useState<TopicId>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      const validTopic = RESOURCE_TOPICS.find((tp) => tp.id === topicParam);
      if (validTopic) {
        queueMicrotask(() => setSelectedTopic(validTopic.id));
      }
    }
  }, [searchParams]);

  const filteredResources = useMemo(() => {
    return RESOURCE_ITEMS.filter((item) => {
      const matchTopic =
        selectedTopic === "all" || item.topic === selectedTopic;
      if (!matchTopic) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const title = t(item.titleKey).toLowerCase();
      const desc = t(item.descKey).toLowerCase();
      const type = t(item.typeKey).toLowerCase();
      const tags = item.tags.join(" ").toLowerCase();

      return (
        title.includes(q) ||
        desc.includes(q) ||
        type.includes(q) ||
        tags.includes(q)
      );
    });
  }, [selectedTopic, searchQuery, t]);

  return (
    <div className="w-full bg-white text-[#14244B] antialiased">
      {/* ============================================================ */}
      {/* SECTION 01: HERO                                              */}
      {/* ============================================================ */}
      <section
        className="
          relative overflow-hidden
          px-5 pb-12 pt-8
          sm:px-8 sm:pb-14 sm:pt-10
          lg:px-10 lg:py-14
          xl:px-12 xl:py-16
        "
      >
        <div className="mx-auto w-full max-w-[1320px]">
          <div
            className="
              grid w-full items-center
              gap-10
              lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]
              lg:gap-4
              xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]
              xl:gap-5
            "
          >
            {/* Left Column Copy & Search */}
            <div className="relative z-20 max-w-[560px] text-left lg:pr-2">
              <span
                className="
                  inline-flex items-center gap-2
                  rounded-full
                  border border-[#C9D7F1]
                  bg-[#F7F9FD]/90
                  px-3.5 py-1.5
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.12em]
                  text-[#204195]
                  sm:text-[11px]
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#FCB625]" />
                {t("resources.badge")}
              </span>

              <h1
                className="
                  mt-5
                  max-w-[540px]
                  font-sans
                  text-[clamp(2.6rem,3.85vw,4.25rem)]
                  font-extrabold
                  leading-[0.99]
                  tracking-[-0.045em]
                  text-[#14244B]
                "
              >
                <span className="block">
                  {t("resources.heroTitleA")}
                </span>

                <span className="relative mt-1.5 inline-block text-[#204195]">
                  {t("resources.heroTitleB")}

                  <span
                    aria-hidden="true"
                    className="
                      absolute -bottom-1 left-0 -z-10
                      h-[0.12em] w-full
                      rounded-full
                      bg-[#FCB625]/30
                    "
                  />
                </span>
              </h1>

              <p
                className="
                  mt-5
                  max-w-[600px]
                  text-base
                  leading-7
                  text-[#607096]
                  sm:text-lg
                  sm:leading-8
                "
              >
                {t("resources.heroDescription")}
              </p>

              {/* Search Box */}
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-6 w-full max-w-[540px]"
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-4 size-5 text-[#8090B5]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("resources.searchPlaceholder")}
                    aria-label={t("resources.searchPlaceholder")}
                    className="h-[52px] w-full rounded-[16px] border border-[#DCE4F3] bg-white pl-12 pr-28 text-sm font-medium text-[#14244B] shadow-sm outline-none transition-all placeholder:text-[#8090B5] focus:border-[#204195] focus:ring-2 focus:ring-[#204195]/10"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 flex h-[40px] items-center justify-center rounded-[12px] bg-[#204195] px-5 text-xs font-bold text-white transition-all hover:bg-[#183275]"
                  >
                    {t("resources.searchButton")}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Visual: Resource Playbooks Card Flow */}
            <div className="relative">
              <div className="relative bg-[#F7F9FD] border border-[#DCE4F3] rounded-[26px] p-6 sm:p-8 shadow-[0_10px_34px_rgba(32,65,149,0.045)] space-y-4">
                {/* Resource Card 1 */}
                <div className="bg-white border border-[#DCE4F3] p-4.5 rounded-[18px] shadow-xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF3FC] text-[#204195] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#607096] uppercase tracking-wider">GUIDE & BLUEPRINT</span>
                    <h4 className="text-sm font-bold text-[#14244B]">Khung câu trả lời chuẩn STAR</h4>
                    <p className="text-xs text-[#607096]">Chiến lược trình bày bằng chứng dự án thực tế</p>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="flex justify-center my-0.5">
                  <div className="w-0.5 h-3 bg-[#DCE4F3]"></div>
                </div>

                {/* Resource Card 2 */}
                <div className="bg-white border border-[#DCE4F3] p-4.5 rounded-[18px] shadow-xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF3FC] text-[#204195] flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#607096] uppercase tracking-wider">ATS OPTIMIZATION</span>
                    <h4 className="text-sm font-bold text-[#14244B]">Tối ưu từ khóa CV theo JD</h4>
                    <p className="text-xs text-[#607096]">Bí quyết tăng điểm khớp hồ sơ lên 85%+</p>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="flex justify-center my-0.5">
                  <div className="w-0.5 h-3 bg-[#DCE4F3]"></div>
                </div>

                {/* Resource Card 3 */}
                <div className="bg-white border-2 border-[#204195]/20 p-4.5 rounded-[18px] shadow-xs flex items-center gap-4 bg-gradient-to-r from-white to-[#EEF3FC]/50">
                  <div className="w-10 h-10 rounded-xl bg-[#204195] text-white flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#FCB625]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#204195] uppercase tracking-wider">MOCK INTERVIEW</span>
                    <h4 className="text-sm font-bold text-[#14244B]">Checklist phỏng vấn giọng nói AI</h4>
                    <p className="text-xs text-[#607096]">Luyện phản xạ & cách kiểm soát tâm lý</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 02: TOPICS FILTER                                     */}
      {/* ============================================================ */}
      <section className="bg-[#F7F9FD] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12 border-t border-[#DCE4F3]">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingSectionHeader
            eyebrow={t("resources.topicSectionEyebrow")}
            title={t("resources.topicSectionTitle")}
            description={t("resources.topicSectionDescription")}
            align="center"
            className="mb-8"
          />

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {RESOURCE_TOPICS.map((topic) => {
              const isActive = selectedTopic === topic.id;

              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#204195] text-white shadow-sm"
                      : "border border-[#DCE4F3] bg-white text-[#607096] hover:bg-[#EEF3FC] hover:text-[#14244B]"
                  }`}
                >
                  <span>{t(topic.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 03: FEATURED PLAYBOOK CARD                           */}
      {/* ============================================================ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12 border-t border-[#DCE4F3]">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="relative overflow-hidden rounded-[26px] border border-[#DCE4F3] bg-gradient-to-r from-[#F7F9FD] via-white to-[#EEF3FC] p-7 shadow-sm sm:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl space-y-3">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#204195]">
                  <Sparkles className="size-3.5 text-[#FCB625]" />
                  {t("resources.featuredEyebrow")}
                </span>

                <h3 className="text-2xl font-bold tracking-tight text-[#14244B] sm:text-3xl">
                  {t("resources.featuredTitle")}
                </h3>

                <p className="text-sm font-medium leading-6 text-[#607096]">
                  {t("resources.featuredDescription")}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#204195]">
                  <span className="rounded-full bg-[#EEF3FC] px-3.5 py-1.5 font-mono">
                    {t("resources.featuredStep1")}
                  </span>
                  <span>→</span>
                  <span className="rounded-full bg-[#EEF3FC] px-3.5 py-1.5 font-mono">
                    {t("resources.featuredStep2")}
                  </span>
                  <span>→</span>
                  <span className="rounded-full bg-[#EEF3FC] px-3.5 py-1.5 font-mono">
                    {t("resources.featuredStep3")}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                <span className="text-xs font-semibold text-[#8090B5]">
                  {t("resources.featuredMeta")}
                </span>
                <a
                  href="#resource-library"
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#204195] px-7 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-[#183275]"
                >
                  {t("resources.featuredCta")}
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 04: RESOURCE LIBRARY LIST                             */}
      {/* ============================================================ */}
      <section id="resource-library" className="bg-[#F7F9FD] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12 border-t border-[#DCE4F3] scroll-mt-20">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#204195]">
                {t("resources.libraryEyebrow")}
              </span>
              <h3 className="mt-1 text-2xl font-bold text-[#14244B]">
                {t("resources.libraryTitle")}
              </h3>
            </div>

            <span className="text-xs font-semibold text-[#607096]">
              {filteredResources.length} {t("resources.libraryTitle").toLowerCase()}
            </span>
          </div>

          {filteredResources.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between rounded-[26px] border border-[#DCE4F3] bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#204195]/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#EEF3FC] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#204195]">
                        {t(item.typeKey)}
                      </span>
                      <span className="text-[11px] font-medium text-[#8090B5]">
                        {lang === "vi"
                          ? `${item.readMinutes} phút`
                          : `${item.readMinutes} min`}
                      </span>
                    </div>

                    <h4 className="mt-4 text-[17px] font-bold leading-6 tracking-[-0.015em] text-[#14244B] transition-colors group-hover:text-[#204195]">
                      {t(item.titleKey)}
                    </h4>

                    <p className="mt-2 text-sm font-medium leading-6 text-[#607096]">
                      {t(item.descKey)}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-wrap gap-1.5 border-t border-[#EEF3FC] pt-4">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-[#F7F9FD] px-2 py-0.5 text-[10px] font-semibold text-[#607096]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-[#DCE4F3] bg-white p-12 text-center shadow-xs">
              <h4 className="text-lg font-bold text-[#14244B]">
                {t("resources.noResultsTitle")}
              </h4>
              <p className="mt-1 text-xs text-[#607096]">
                {t("resources.noResultsBody")}
              </p>
              <button
                onClick={() => {
                  setSelectedTopic("all");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-[12px] bg-[#204195] px-5 text-xs font-bold text-white"
              >
                {t("resources.reset")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 05: COACH CALLOUT                                    */}
      {/* ============================================================ */}
      <section className="px-5 py-10 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <CoachCallout
            eyebrow={t("resources.coachEyebrow")}
            title={t("resources.coachTitle")}
            description={t("resources.coachDescription")}
            steps={[
              { num: "1", text: t("resources.coachStep1") },
              { num: "2", text: t("resources.coachStep2") },
              { num: "3", text: t("resources.coachStep3") },
            ]}
            ctaText={t("resources.coachCta")}
            ctaHref="/dashboard/cvs"
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 06: COMMUNITY SECTION                                */}
      {/* ============================================================ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12 border-t border-[#DCE4F3]">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingSectionHeader
            eyebrow={t("resources.communityEyebrow")}
            title={t("resources.communityTitle")}
            description={t("resources.communityDescription")}
            align="center"
            className="mb-10"
          />

          <div className="grid gap-6 sm:grid-cols-3">
            <Link
              href="/interview/select"
              className="group rounded-[26px] border border-[#DCE4F3] bg-white p-7 shadow-xs transition-all hover:-translate-y-1 hover:border-[#204195]/40"
            >
              <div className="grid size-12 place-items-center rounded-[16px] bg-[#EEF3FC] text-[#204195] transition-colors group-hover:bg-[#204195] group-hover:text-white">
                <FileText className="size-6" />
              </div>
              <h4 className="mt-4 text-[17px] font-bold leading-6 text-[#14244B]">
                {t("resources.communityTile1")}
              </h4>
              <p className="mt-2 text-sm font-medium leading-6 text-[#607096]">
                {t("resources.communityTile1Desc")}
              </p>
            </Link>

            <div className="rounded-[26px] border border-[#DCE4F3] bg-white p-7 shadow-xs">
              <div className="grid size-12 place-items-center rounded-[16px] bg-[#EEF3FC] text-[#204195]">
                <Users className="size-6" />
              </div>
              <h4 className="mt-4 text-[17px] font-bold leading-6 text-[#14244B]">
                {t("resources.communityTile2")}
              </h4>
              <p className="mt-2 text-sm font-medium leading-6 text-[#607096]">
                {t("resources.communityTile2Desc")}
              </p>
            </div>

            <div className="rounded-[26px] border border-[#DCE4F3] bg-white p-7 shadow-xs">
              <div className="grid size-12 place-items-center rounded-[16px] bg-[#EEF3FC] text-[#204195]">
                <Sparkles className="size-6 text-[#FCB625]" />
              </div>
              <h4 className="mt-4 text-[17px] font-bold leading-6 text-[#14244B]">
                {t("resources.communityTile3")}
              </h4>
              <p className="mt-2 text-sm font-medium leading-6 text-[#607096]">
                {t("resources.communityTile3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 07: BOTTOM FINAL CTA                                 */}
      {/* ============================================================ */}
      <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingCTA
            eyebrow={t("resources.finalEyebrow")}
            title={t("resources.finalTitle")}
            titleAccent={t("resources.finalTitleAccent")}
            description={t("resources.finalDescription")}
            primaryCtaText={t("resources.finalPrimary")}
            primaryCtaHref="/signup"
            secondaryCtaText={t("resources.finalSecondary")}
            secondaryCtaHref="/pricing"
          />
        </div>
      </section>
    </div>
  );
}