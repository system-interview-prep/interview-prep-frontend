"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Search,
  Sparkles,
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
        setSelectedTopic(validTopic.id);
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
    <div className="relative min-h-screen bg-white text-[#14244B]">
      {/* Background radial highlight */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(32,65,149,0.06),transparent_70%)]" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* HERO SECTION */}
        <section className="mb-14 text-center">
          <MarketingSectionHeader
            as="h1"
            eyebrow={t("resources.badge")}
            title={`${t("resources.heroTitleA")} ${t("resources.heroTitleB")}`}
            description={t("resources.heroDescription")}
            align="center"
          />

          {/* Search Box */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-8 max-w-xl"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 size-5 text-[#8090B5]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("resources.searchPlaceholder")}
                aria-label={t("resources.searchPlaceholder")}
                className="h-12 w-full rounded-[16px] border border-[#DCE4F3] bg-white pl-12 pr-28 text-sm font-medium text-[#14244B] shadow-sm outline-none transition-all placeholder:text-[#8090B5] focus:border-[#204195] focus:ring-2 focus:ring-[#204195]/10"
              />
              <button
                type="submit"
                className="absolute right-1.5 flex h-9 items-center justify-center rounded-[12px] bg-[#204195] px-4 text-xs font-bold text-white transition-all hover:bg-[#183275]"
              >
                {t("resources.searchButton")}
              </button>
            </div>
          </form>
        </section>

        {/* TOPICS SECTION */}
        <section className="mb-16">
          <MarketingSectionHeader
            eyebrow={t("resources.topicSectionEyebrow")}
            title={t("resources.topicSectionTitle")}
            description={t("resources.topicSectionDescription")}
            align="center"
            className="mb-8"
          />

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {RESOURCE_TOPICS.map((topic) => {
              const isActive = selectedTopic === topic.id;

              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#204195] text-white shadow-sm"
                      : "border border-[#DCE4F3] bg-white text-[#506085] hover:bg-[#F7F9FD] hover:text-[#14244B]"
                  }`}
                >
                  <span>{t(topic.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* FEATURED PLAYBOOK CARD */}
        <section className="mb-20">
          <div className="relative overflow-hidden rounded-[26px] border border-[#DCE4F3] bg-gradient-to-r from-[#F7F9FD] via-white to-[#EEF3FC] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <span className="mb-2 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#204195]">
                  <Sparkles className="size-3.5" />
                  {t("resources.featuredEyebrow")}
                </span>

                <h3 className="text-xl font-bold tracking-tight text-[#14244B] sm:text-2xl">
                  {t("resources.featuredTitle")}
                </h3>

                <p className="mt-2 text-sm font-medium leading-relaxed text-[#506085]">
                  {t("resources.featuredDescription")}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#204195]">
                  <span className="rounded-full bg-[#EEF3FC] px-3 py-1">
                    {t("resources.featuredStep1")}
                  </span>
                  <span>→</span>
                  <span className="rounded-full bg-[#EEF3FC] px-3 py-1">
                    {t("resources.featuredStep2")}
                  </span>
                  <span>→</span>
                  <span className="rounded-full bg-[#EEF3FC] px-3 py-1">
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
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#204195] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#183275]"
                >
                  {t("resources.featuredCta")}
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* RESOURCE LIBRARY LIST */}
        <section id="resource-library" className="mb-20 scroll-mt-20">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
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
                  className="group flex flex-col justify-between rounded-[22px] border border-[#DCE4F3] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B5C9EE] hover:shadow-md"
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

                    <h4 className="mt-4 text-base font-bold tracking-tight text-[#14244B] transition-colors group-hover:text-[#204195]">
                      {t(item.titleKey)}
                    </h4>

                    <p className="mt-2 text-xs font-medium leading-relaxed text-[#506085]">
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
            <div className="rounded-[22px] border border-[#DCE4F3] bg-[#F7F9FD] p-12 text-center">
              <h4 className="text-lg font-bold text-[#14244B]">
                {t("resources.noResultsTitle")}
              </h4>
              <p className="mt-1 text-xs text-[#506085]">
                {t("resources.noResultsBody")}
              </p>
              <button
                onClick={() => {
                  setSelectedTopic("all");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-[12px] bg-[#204195] px-4 text-xs font-bold text-white"
              >
                {t("resources.reset")}
              </button>
            </div>
          )}
        </section>

        {/* COACH CALLOUT */}
        <section className="mb-20">
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
        </section>

        {/* COMMUNITY SECTION */}
        <section className="mb-20">
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
              className="group rounded-[22px] border border-[#DCE4F3] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#B5C9EE]"
            >
              <div className="grid size-10 place-items-center rounded-[14px] bg-[#EEF3FC] text-[#204195] transition-colors group-hover:bg-[#204195] group-hover:text-white">
                <FileText className="size-5" />
              </div>
              <h4 className="mt-4 font-bold text-[#14244B]">
                {t("resources.communityTile1")}
              </h4>
              <p className="mt-2 text-xs font-medium text-[#506085]">
                {t("resources.communityTile1Desc")}
              </p>
            </Link>

            <div className="rounded-[22px] border border-[#DCE4F3] bg-white p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-[14px] bg-[#EEF3FC] text-[#204195]">
                <Users className="size-5" />
              </div>
              <h4 className="mt-4 font-bold text-[#14244B]">
                {t("resources.communityTile2")}
              </h4>
              <p className="mt-2 text-xs font-medium text-[#506085]">
                {t("resources.communityTile2Desc")}
              </p>
            </div>

            <div className="rounded-[22px] border border-[#DCE4F3] bg-white p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-[14px] bg-[#EEF3FC] text-[#204195]">
                <Sparkles className="size-5 text-[#FCB625]" />
              </div>
              <h4 className="mt-4 font-bold text-[#14244B]">
                {t("resources.communityTile3")}
              </h4>
              <p className="mt-2 text-xs font-medium text-[#506085]">
                {t("resources.communityTile3Desc")}
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM FINAL CTA */}
        <section>
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
        </section>
      </div>
    </div>
  );
}