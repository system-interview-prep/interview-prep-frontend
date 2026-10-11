"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import MarketingPageIntro from "@features/marketing/components/shared/MarketingPageIntro";
import { useAuthProfile } from "@/features/auth/hooks/useAuthProfile";
import MarketingSectionHeader from "../shared/MarketingSectionHeader";
import MarketingCTA from "../shared/MarketingCTA";
import CoachCallout from "../shared/CoachCallout";
import {
  RESOURCE_ITEMS,
  RESOURCE_TOPICS,
  TopicId,
} from "../../data/resources.data";

export default function ResourcesPageClient() {
  const { t } = useLanguage();
  const { profile } = useAuthProfile();
  const isAuthenticated = !!profile;
  const coachCtaHref = isAuthenticated ? "/dashboard/cvs" : "/signup";
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

  // The guides are not written yet: show them as upcoming, never with read-times or dates.
  const upcomingBadge = (
    <span className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-[11px] font-semibold text-[#607096]">
      {t("fixm.resources.upcoming")}
    </span>
  );

  return (
    <div className="w-full bg-[#F7F9FD] text-[#14244B] antialiased">
      {/* ============================================================ */}
      {/* SECTION 01: HERO                                              */}
      {/* ============================================================ */}
      <section className="px-4 pb-12 pt-6 sm:px-8 sm:pb-14 sm:pt-10 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingPageIntro
            title={`${t("resources.heroTitleA")} ${t("resources.heroTitleB")}`}
            body={t("fixm.resources.heroBody")}
            aside={
              <div className="rounded-3xl bg-white/90 p-5 sm:p-6">
                <p className="text-sm font-semibold text-[#14244B]">{t("fixm.resources.asideTitle")}</p>
                <ul className="mt-3 divide-y divide-[#DCE4F3]">
                  {RESOURCE_ITEMS.slice(0, 3).map((item) => (
                    <li key={item.id} className="py-3">
                      <span className="flex items-center gap-2 text-[12px] font-semibold text-[#204195]">
                        {t(item.typeKey)}
                        {upcomingBadge}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-[#14244B]">{t(item.titleKey)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            }
          >
            {/* Search box */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="w-full max-w-[540px]"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("resources.searchPlaceholder")}
                  aria-label={t("resources.searchPlaceholder")}
                  className="h-12 w-full rounded-full border-0 bg-[#F7F9FD] pl-5 pr-28 text-sm text-[#14244B] outline-none ring-1 ring-[#DCE4F3] transition placeholder:text-[#8A98B8] focus:bg-white focus:ring-2 focus:ring-[#204195]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 flex h-9 items-center justify-center rounded-full bg-[#204195] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#183275]"
                >
                  {t("resources.searchButton")}
                </button>
              </div>
            </form>
          </MarketingPageIntro>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 02: TOPICS FILTER                                     */}
      {/* ============================================================ */}
      <section className="px-4 pb-14 pt-4 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingSectionHeader
            eyebrow={t("resources.topicSectionEyebrow")}
            title={t("resources.topicSectionTitle")}
            description={t("resources.topicSectionDescription")}
            align="center"
            className="mb-8"
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            {RESOURCE_TOPICS.map((topic) => {
              const isActive = selectedTopic === topic.id;

              return (
                <button
                  type="button"
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "bg-[#204195] text-white"
                      : "bg-white text-[#607096] ring-1 ring-[#DCE4F3] hover:bg-[#EEF3FC] hover:text-[#14244B]"
                  }`}
                >
                  {t(topic.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 03: FEATURED PLAYBOOK CARD                           */}
      {/* ============================================================ */}
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="rounded-[28px] bg-[#204195] p-7 text-white sm:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {t("fixm.resources.featuredTitle")}
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/75">
                  {t("fixm.resources.featuredDescription")}
                </p>

                <ol className="mt-5 flex flex-wrap items-center gap-2 text-[13px] text-white/85">
                  {[t("resources.featuredStep1"), t("resources.featuredStep2"), t("resources.featuredStep3")].map((step, idx) => (
                    <li key={idx} className="rounded-full bg-white/10 px-3.5 py-1.5">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                <Link
                  href={coachCtaHref}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#FCB625] px-6 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#E5A21D]"
                >
                  {t("fixm.resources.featuredCta")}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 04: RESOURCE LIBRARY LIST                             */}
      {/* ============================================================ */}
      <section id="resource-library" className="scroll-mt-20 px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-[26px] font-semibold tracking-tight text-[#14244B] sm:text-[30px]">
                {t("fixm.resources.libraryTitle")}
              </h2>
              <p className="mt-1 text-sm text-[#607096]">{t("fixm.resources.libraryNote")}</p>
            </div>

            <span role="status" aria-live="polite" className="text-[13px] text-[#607096]">
              {searchQuery.trim()
                ? fmt(t("uxm.resources.found"), { count: filteredResources.length, query: searchQuery.trim() })
                : fmt(t("fixm.resources.count"), { count: filteredResources.length })}
            </span>
          </div>

          {filteredResources.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-3xl bg-white p-7 ring-1 ring-[#DCE4F3]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12px] font-semibold text-[#204195]">
                        {t(item.typeKey)}
                      </span>
                      {upcomingBadge}
                    </div>

                    <h3 className="mt-3 text-[17px] font-semibold leading-6 text-[#14244B]">
                      {t(item.titleKey)}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#607096]">
                      {t(item.descKey)}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-1.5 border-t border-[#DCE4F3] pt-4">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-[#F7F9FD] px-2.5 py-0.5 text-[11px] text-[#607096]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-3xl bg-white p-12 text-center ring-1 ring-[#DCE4F3]">
              <h3 className="text-lg font-semibold text-[#14244B]">
                {t("resources.noResultsTitle")}
              </h3>
              <p className="mt-1 text-sm text-[#607096]">
                {t("resources.noResultsBody")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTopic("all");
                  setSearchQuery("");
                }}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
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
      <section className="px-4 pb-12 sm:px-8 lg:px-10 xl:px-12">
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
            ctaHref={coachCtaHref}
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 06: COMMUNITY SECTION                                */}
      {/* ============================================================ */}
      <section className="bg-white px-4 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingSectionHeader
            eyebrow={t("resources.communityEyebrow")}
            title={t("fixm.resources.communityTitle")}
            description={t("fixm.resources.communityDescription")}
            align="center"
            className="mb-10"
          />

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-3xl bg-[#F7F9FD] p-7">
              {upcomingBadge}
              <h3 className="mt-3 text-[17px] font-semibold leading-6 text-[#14244B]">
                {t("resources.communityTile1")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#607096]">
                {t("fixm.resources.communityTile1Desc")}
              </p>
            </div>

            <div className="rounded-3xl bg-[#F7F9FD] p-7">
              {upcomingBadge}
              <h3 className="mt-3 text-[17px] font-semibold leading-6 text-[#14244B]">
                {t("resources.communityTile2")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#607096]">
                {t("resources.communityTile2Desc")}
              </p>
            </div>

            <div className="rounded-3xl bg-[#F7F9FD] p-7">
              {upcomingBadge}
              <h3 className="mt-3 text-[17px] font-semibold leading-6 text-[#14244B]">
                {t("resources.communityTile3")}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#607096]">
                {t("resources.communityTile3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 07: BOTTOM FINAL CTA                                 */}
      {/* ============================================================ */}
      <section className="px-4 py-12 sm:px-8 sm:py-16 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1320px]">
          <MarketingCTA
            eyebrow={t("resources.finalEyebrow")}
            title={t("resources.finalTitle")}
            titleAccent={t("resources.finalTitleAccent")}
            description={t("fixm.resources.finalDescription")}
            primaryCtaText={t("resources.finalPrimary")}
            primaryCtaHref="/signup"
            secondaryCtaText={t("fixm.resources.finalSecondary")}
            secondaryCtaHref="/pricing"
          />
        </div>
      </section>
    </div>
  );
}
