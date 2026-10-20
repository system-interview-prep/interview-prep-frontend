"use client";

import { useId, useMemo, useState } from "react";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import WorkspacePageHeader from "@features/resume/components/WorkspacePageHeader";
import StatusNote from "@components/shared/StatusNote";
import { Search, X, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";

interface FaqItem {
  id: string;
  category: "webrtc" | "cv" | "voice" | "payment";
  /** i18n keys; translated at render. */
  categoryLabelKey: string;
  questionKey: string;
  answerKey: string;
  tipKeys?: string[];
}

const SUPPORT_EMAIL = "support@intervia.io";

const FAQ_LIST: FaqItem[] = [
  {
    id: "faq-webrtc-permission",
    category: "webrtc",
    categoryLabelKey: "help.page.cat.webrtc",
    questionKey: "help.page.faq.webrtcPermission.q",
    answerKey: "help.page.faq.webrtcPermission.a",
    tipKeys: [
      "help.page.faq.webrtcPermission.tip1",
      "help.page.faq.webrtcPermission.tip2",
      "help.page.faq.webrtcPermission.tip3",
      "help.page.faq.webrtcPermission.tip4",
    ],
  },
  {
    id: "faq-voice-interrupt",
    category: "voice",
    categoryLabelKey: "help.page.cat.voice",
    questionKey: "help.page.faq.voiceInterrupt.q",
    answerKey: "help.page.faq.voiceInterrupt.a",
    tipKeys: [
      "help.page.faq.voiceInterrupt.tip1",
      "help.page.faq.voiceInterrupt.tip2",
      "help.page.faq.voiceInterrupt.tip3",
    ],
  },
  {
    id: "faq-cv-ats",
    category: "cv",
    categoryLabelKey: "help.page.cat.cv",
    questionKey: "help.page.faq.cvAts.q",
    answerKey: "help.page.faq.cvAts.a",
    tipKeys: [
      "help.page.faq.cvAts.tip1",
      "help.page.faq.cvAts.tip2",
      "help.page.faq.cvAts.tip3",
      "help.page.faq.cvAts.tip4",
    ],
  },
  {
    id: "faq-payment-vietqr",
    category: "payment",
    categoryLabelKey: "help.page.cat.payment",
    questionKey: "help.page.faq.paymentVietqr.q",
    answerKey: "help.page.faq.paymentVietqr.a",
    tipKeys: [
      "help.page.faq.paymentVietqr.tip1",
      "help.page.faq.paymentVietqr.tip2",
    ],
  },
  {
    id: "faq-interview-retake",
    category: "webrtc",
    categoryLabelKey: "help.page.cat.webrtc",
    questionKey: "help.page.faq.interviewRetake.q",
    answerKey: "help.page.faq.interviewRetake.a",
    tipKeys: [
      "help.page.faq.interviewRetake.tip1",
      "help.page.faq.interviewRetake.tip2",
    ],
  },
  {
    id: "faq-data-privacy",
    category: "voice",
    categoryLabelKey: "help.page.cat.voice",
    questionKey: "help.page.faq.dataPrivacy.q",
    answerKey: "help.page.faq.dataPrivacy.a",
    tipKeys: [
      "help.page.faq.dataPrivacy.tip1",
      "help.page.faq.dataPrivacy.tip2",
      "help.page.faq.dataPrivacy.tip3",
    ],
  },
];

const TOPICS: Array<{ id: FaqItem["category"]; titleKey: string; descKey: string }> = [
  { id: "webrtc", titleKey: "help.page.cat.webrtc", descKey: "help.page.topic.webrtc.desc" },
  { id: "cv", titleKey: "help.page.cat.cv", descKey: "help.page.topic.cv.desc" },
  { id: "voice", titleKey: "help.page.cat.voice", descKey: "help.page.topic.voice.desc" },
  { id: "payment", titleKey: "help.page.cat.payment", descKey: "help.page.topic.payment.desc" },
];

/** Quick-search words (i18n keys) that appear in the translated FAQ text above. */
const QUICK_SEARCH = ["help.page.quick.micro", "help.page.quick.camera", "help.page.quick.interrupt", "help.page.quick.ats", "help.page.quick.transfer", "help.page.quick.privacy"];

const TICKET_CATEGORIES = [
  { id: "webrtc", labelKey: "help.page.ticket.webrtc" },
  { id: "ai_voice", labelKey: "help.page.ticket.aiVoice" },
  { id: "cv_ats", labelKey: "help.page.ticket.cvAts" },
  { id: "payment", labelKey: "help.page.ticket.payment" },
  { id: "feature", labelKey: "help.page.ticket.feature" },
  { id: "other", labelKey: "help.page.ticket.other" },
];

export default function HelpCenterPage() {
  const { profile } = useAuthProfile();
  const { t } = useLanguage();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Accordion State
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-webrtc-permission");

  // Helpful Feedback State
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "yes" | "no">>({});

  // Ticket Form State
  const [ticketCategory, setTicketCategory] = useState("webrtc");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketEmail, setTicketEmail] = useState(profile?.email || "");
  // There is no ticket API: the form only drafts an email in the user's mail app.
  const [mailDraftOpened, setMailDraftOpened] = useState(false);

  // Form Accessibility IDs
  const searchInputId = useId();
  const ticketCategoryId = useId();
  const ticketEmailId = useId();
  const ticketSubjectId = useId();
  const ticketDescId = useId();

  // Filter FAQ based on search and category
  const filteredFaqs = useMemo(() => {
    return FAQ_LIST.filter((item) => {
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCategory;

      const matchText =
        t(item.questionKey).toLowerCase().includes(q) ||
        t(item.answerKey).toLowerCase().includes(q) ||
        (item.tipKeys && item.tipKeys.some((tipKey) => t(tipKey).toLowerCase().includes(q)));

      return matchCategory && matchText;
    });
  }, [searchQuery, selectedCategory, t]);

  // Handle Feedback click
  const handleFeedback = (id: string, type: "yes" | "no") => {
    setFeedbackGiven((prev) => ({ ...prev, [id]: type }));
  };

  // Submit Ticket Handler
  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    const categoryLabelKey = TICKET_CATEGORIES.find((c) => c.id === ticketCategory)?.labelKey;
    const categoryLabel = categoryLabelKey ? t(categoryLabelKey) : ticketCategory;
    const subject = `[${categoryLabel}] ${ticketSubject.trim()}`;
    const body = fmt(t("help.page.ticket.mailBody"), {
      description: ticketDescription.trim(),
      category: categoryLabel,
      email: ticketEmail.trim(),
    });
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMailDraftOpened(true);
  };

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-16 pt-4 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1280px] space-y-6">
          {/* HERO: the fox asks, the search answers */}
          <WorkspacePageHeader
            title={t("help.page.header.title")}
            subtitle={t("help.page.header.subtitle")}
          >
              {/* Search Bar Input */}
              <div className="relative w-full min-w-0">
                <label htmlFor={searchInputId} className="sr-only">
                  {t("help.page.search.label")}
                </label>
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3.5 size-4 text-[#607096]" aria-hidden="true" />
                  <input
                    id={searchInputId}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("help.page.search.placeholder")}
                    className="h-10 w-full rounded-xl border-0 bg-white pl-11 pr-11 text-sm font-medium text-[#14244B] border border-[#DCE4F3] placeholder-[#607096]/70 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 rounded-full p-1 text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
                      aria-label={t("help.page.search.clearAria")}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Quick Search Tag Pills */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-medium text-[#204195]">{t("help.page.search.quick")}</span>
                  {QUICK_SEARCH.map((tagKey) => t(tagKey)).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="rounded-full bg-[#F8FAFC] px-3 py-1 font-medium text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC] hover:text-[#204195]"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
          </WorkspacePageHeader>

          {/* 4 QUICK ACCESS CARDS */}
          <section aria-labelledby="heading-quick-topics" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <h2 id="heading-quick-topics" className="text-lg font-bold text-[#14244B]">
                {t("help.page.topics.title")}
              </h2>
              <span className="text-sm text-[#607096]">{t("help.page.topics.hint")}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TOPICS.map((topic) => {
                const isSelected = selectedCategory === topic.id;
                const count = FAQ_LIST.filter((faq) => faq.category === topic.id).length;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(selectedCategory === topic.id ? "all" : topic.id)
                    }
                    aria-pressed={isSelected}
                    className={`flex min-w-0 flex-col justify-between rounded-2xl p-4 text-left transition-colors ${
                      isSelected
                        ? "bg-[#F0F4FC] ring-2 ring-[#204195]"
                        : "bg-white border border-[#DCE4F3] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-[#14244B]">{t(topic.titleKey)}</h3>
                      <p className="text-sm text-[#607096] line-clamp-2">{t(topic.descKey)}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-[#204195]">
                        {isSelected ? t("help.page.topics.filtering") : t("help.page.topics.view")}
                      </span>
                      <span className="text-xs font-medium text-[#204195]">{fmt(t("help.page.topics.count"), { n: count })}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* INTERACTIVE FAQ ACCORDION */}
          <section
            aria-labelledby="heading-faq-list"
            className="rounded-2xl bg-white p-5 border border-[#DCE4F3] sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#EAEFF8] pb-4">
              <div className="min-w-0">
                <div>
                  <h2 id="heading-faq-list" className="text-lg font-bold text-[#14244B]">
                    {t("help.page.faqList.title")}
                  </h2>
                  <p className="mt-1 text-sm text-[#607096]">
                    {t("help.page.faqList.foundBefore")}<strong>{filteredFaqs.length}</strong>{t("help.page.faqList.foundAfter")}
                    {selectedCategory !== "all" && t("help.page.faqList.inCategory")}
                  </p>
                </div>
              </div>

              {selectedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="self-start text-sm font-semibold text-[#204195] underline-offset-4 hover:underline sm:self-auto"
                >
                  {t("help.page.faqList.showAll")}
                </button>
              )}
            </div>

            {/* List */}
            <div className="mt-6 divide-y divide-[#EAEFF8]">
              {filteredFaqs.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <p className="mt-3 break-words text-base font-semibold text-[#14244B]">
                    {fmt(t("help.page.faqList.emptyTitle"), { q: searchQuery })}
                  </p>
                  <p className="mt-1 text-sm text-[#607096]">
                    {t("help.page.faqList.emptyHint")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-5 h-10 rounded-xl bg-[#F8FAFC] px-5 text-sm font-semibold text-[#14244B] hover:bg-[#F0F4FC]"
                  >
                    {t("help.page.faqList.showAll")}
                  </button>
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  const feedback = feedbackGiven[faq.id];

                  return (
                    <article key={faq.id} className="py-4 first:pt-0 last:pb-0">
                      {/* Accordion Trigger */}
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${faq.id}`}
                        className="group flex w-full items-start justify-between gap-4 text-left"
                      >
                        <div className="min-w-0 space-y-1">
                          <span className="block text-xs font-medium text-[#204195]">
                            {t(faq.categoryLabelKey)}
                          </span>
                          <h3 className="text-sm font-semibold text-[#14244B] transition-colors group-hover:text-[#204195] sm:text-base">{t(faq.questionKey)}</h3>
                        </div>
                        <div
                          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${
                            isOpen ? "rotate-180 bg-[#F0F4FC] text-[#204195]" : "bg-[#F8FAFC] text-[#607096]"
                          }`}
                        >
                          <ChevronDown className="size-4" aria-hidden="true" />
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div
                          id={`faq-answer-${faq.id}`}
                          className="mt-3.5 space-y-3 rounded-2xl bg-[#F8FAFC] p-4 text-sm"
                        >
                          <p className="leading-relaxed text-[#14244B]">{t(faq.answerKey)}</p>

                          {faq.tipKeys && faq.tipKeys.length > 0 && (
                            <div className="rounded-2xl bg-white p-3.5 space-y-1.5 border border-[#DCE4F3]">
                              <p className="font-semibold text-[#14244B]">
                                {t("help.page.faqList.steps")}
                              </p>
                              <ul className="list-disc space-y-1 pl-5 text-[#607096]">
                                {faq.tipKeys.map((tipKey, idx) => (
                                  <li key={idx}>{t(tipKey)}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Helpful Feedback Box */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE4F3] pt-3">
                            <span className="text-xs text-[#607096]">
                              {t("help.page.feedback.question")}
                            </span>

                            {feedback ? (
                              <span className="text-xs font-semibold text-[#287A4B]">
                                {t("help.page.feedback.thanks")}
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(faq.id, "yes")}
                                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#204195] border border-[#DCE4F3] hover:bg-[#F0F4FC]"
                                  aria-label={t("help.page.feedback.yesAria")}
                                >
                                  {t("help.page.feedback.yes")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(faq.id, "no")}
                                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#607096] border border-[#DCE4F3] hover:bg-[#F0F4FC]"
                                  aria-label={t("help.page.feedback.noAria")}
                                >
                                  {t("help.page.feedback.no")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* CONTACT CHANNELS & TICKET SUPPORT CARD */}
          <section
            aria-labelledby="heading-support-contact"
            className="rounded-2xl bg-white p-5 border border-[#DCE4F3] sm:p-6"
          >
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* LEFT COLUMN: CONTACT CHANNELS (5 cols) */}
              <div className="min-w-0 space-y-6 lg:col-span-5 lg:border-r lg:border-[#EAEFF8] lg:pr-8">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#204195]">
                    {t("help.page.contact.eyebrow")}
                  </p>
                  <h2 id="heading-support-contact" className="text-lg font-bold text-[#14244B]">
                    {t("help.page.contact.title")}
                  </h2>
                  <p className="text-sm text-[#607096]">
                    {t("help.page.contact.desc")}
                  </p>
                </div>

                {/* The one real support channel */}
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#F8FAFC] p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#14244B]">{t("help.page.contact.emailLabel")}</p>
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="break-all font-mono text-sm font-bold text-[#204195] underline-offset-4 hover:underline"
                      >
                        {SUPPORT_EMAIL}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: SUBMIT TICKET FORM (7 cols) */}
              <div className="min-w-0 space-y-4 lg:col-span-7">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#14244B]">{t("help.page.form.title")}</h3>
                  <p className="text-sm text-[#607096]">
                    {fmt(t("help.page.form.desc"), { email: SUPPORT_EMAIL })}
                  </p>
                </div>

                <form onSubmit={handleTicketSubmit} className="space-y-3.5">
                  {/* Category & Email */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor={ticketCategoryId} className="block text-sm font-semibold text-[#14244B]">
                        {t("help.page.form.category")}
                      </label>
                      <select
                        id={ticketCategoryId}
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full rounded-2xl border-0 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                      >
                        {TICKET_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {t(c.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor={ticketEmailId} className="block text-sm font-semibold text-[#14244B]">
                        {t("help.page.form.email")}
                      </label>
                      <input
                        id={ticketEmailId}
                        type="email"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        className="w-full rounded-2xl border-0 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label htmlFor={ticketSubjectId} className="block text-sm font-semibold text-[#14244B]">
                      {t("help.page.form.subject")}
                    </label>
                    <input
                      id={ticketSubjectId}
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder={t("help.page.form.subjectPlaceholder")}
                      required
                      className="w-full rounded-2xl border-0 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label htmlFor={ticketDescId} className="block text-sm font-semibold text-[#14244B]">
                      {t("help.page.form.description")}
                    </label>
                    <textarea
                      id={ticketDescId}
                      rows={4}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder={t("help.page.form.descriptionPlaceholder")}
                      required
                      className="w-full rounded-2xl border-0 bg-[#F8FAFC] p-3.5 text-sm font-medium text-[#14244B] border border-[#DCE4F3] transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 text-right">
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:opacity-50"
                    >
                      {t("help.page.form.submit")}
                    </button>
                  </div>

                  {/* Say what happened: only a draft was opened, nothing was sent */}
                  {mailDraftOpened && (
                    <StatusNote
                      tone="info"
                      text={t("help.page.form.draftOpened")}
                      hint={fmt(t("help.page.form.draftHint"), { email: SUPPORT_EMAIL })}
                      onDismiss={() => setMailDraftOpened(false)}
                      dismissLabel={t("help.page.form.dismiss")}
                    />
                  )}
                </form>
              </div>
            </div>
          </section>
        </div>
      </main>
    </UserDashboardShell>
  );
}
