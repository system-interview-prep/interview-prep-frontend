# INTERVIA /solutions — Audit Report

## 1. Executive Summary

- **Current Status:** **READY FOR REDESIGN** (Audit completed, architecture and content discrepancies documented)
- **Build Baseline:** **PASS** (`pnpm run build` Exit code 0, 27 routes compiled successfully)
- **Major Audit Findings:**
  1. **Duplicate Nav & Footer**: `SolutionsPage` explicitly renders `<MarketingNav />` and `<Footer />` inside `src/app/(marketing)/solutions/page.tsx`, causing duplicate header/footer rendering and nested `<main>` tags alongside `src/app/(marketing)/layout.tsx`.
  2. **Severe Design Language Mismatch**: `/solutions` uses old 2D "chunky brutalist" styling (`storybook-card`, `shadow-[4px_4px_0_#234196]`, `border-2`, `paper-dots`, rotated stickers) that directly conflicts with the polished ambient-shadow design system standardized on `/resources` and `/pricing` (`border-[#DCE4F3]`, `rounded-[26px]`, `shadow-sm`, `bg-[#F7F9FD]`).
  3. **Broken / Unmapped CTA Links**: CTAs link to non-existent `/interview/cv-score` route instead of valid App Router paths.
  4. **Unsupported & Fake Metric Claims**: Contains several unverifiable metrics and computer vision claims ("98% Editorial Accuracy", "15+ Leadership Models", "50,000+ professionals", "+35% Lương đàm phán", "real-time eye contact & posture analysis", "AI video agents analyze body language", "predictive cultural fit").
  5. **Hardcoded Copy**: Contains hardcoded Vietnamese copy in section titles and CTA buttons instead of sourcing from `i18n.ts`.

---

## 2. Current Architecture

- **Page File:** `src/app/(marketing)/solutions/page.tsx`
- **Components Used:** `SolutionsPersonaSwitcher.tsx`, inline section JSX
- **i18n Keys:** `solutions.metaTitle`, `solutions.hero.*`, `solutions.segment.*`, `solutions.modalities.*`, `solutions.editorial.*`, `solutions.cta.*`
- **Data Layer:** None (currently hardcoded arrays inside page component)
- **Shared Components Used:** Lucide icons (`Sparkles`, `ArrowRight`, `GraduationCap`, `Briefcase`, `Crown`, `Mic`, `FileCheck2`, `ShieldCheck`)

---

## 3. Product Capability Matrix

| Capability | Status | Source Evidence | Can Market? |
|---|---|---|---|
| **CV Upload & Parsing** | IMPLEMENTED | `src/app/(workspace)/dashboard/cvs`, PDF/docx drag & drop parser | YES |
| **CV Evidence Extraction** | IMPLEMENTED | Bullet-point Action-Context-Metric extraction logic | YES |
| **Job Profile & JD Matching** | IMPLEMENTED | `src/app/(workspace)/dashboard/jobs`, `MatchingShowcase.tsx` | YES |
| **Skill Gap Analysis** | IMPLEMENTED | Missing skill badge extraction (`dbt?`, `SQL`, gap alerts) | YES |
| **Chat Interview** | IMPLEMENTED | `src/app/(workspace)/practice` / `/chat`, text AI interviewer | YES |
| **Voice Interview** | IMPLEMENTED | `src/app/(workspace)/practice` / `/voice`, WebRTC audio streaming & speech-to-text | YES |
| **Video Interview Call** | PARTIAL / DEMO | WebRTC video peer room (`useWebRTC.ts`), video room UI | YES (As video call room) |
| **Eye Contact Tracking AI** | NOT FOUND | Zero computer vision / facial tracking models in codebase | **NO** (Must remove) |
| **Posture & Emotion AI** | NOT FOUND | Zero pose / emotion detection models in codebase | **NO** (Must remove) |
| **Body Language AI** | NOT FOUND | Zero body gesture analysis code in codebase | **NO** (Must remove) |
| **Per-question Scoring** | IMPLEMENTED | `src/app/(interview-fullscreen)/interview/results/[id]` | YES |
| **Rubric Breakdown** | IMPLEMENTED | Technical accuracy, communication, problem-solving rubrics | YES |
| **Strengths & Improvements** | IMPLEMENTED | Categorized feedback bullets per question | YES |
| **Progress Tracking** | IMPLEMENTED | `ProgressPreview.tsx` candidate readiness tracking | YES |

---

## 4. Content Claim Audit

| Key / Location | Current Copy | Claim Type | Supported? | Evidence | Decision |
|---|---|---|---|---|---|
| `solutions.segment.seekers.visualDesc` | "Real-time eye contact & posture analysis" | UNSUPPORTED CLAIM | NO | No vision AI in codebase | **REMOVE / REWRITE** to "Video interview practice & delivery" |
| `solutions.segment.professionals.stat1Value` | "98% Editorial Accuracy" | FAKE METRIC | NO | No accuracy benchmark data | **REMOVE** |
| `solutions.segment.professionals.stat2Value` | "15+ Leadership Models" | UNSUPPORTED METRIC | NO | No 15+ model taxonomy | **REMOVE** |
| `solutions.modalities.video.desc` | "AI-driven video agents analyze your body language, eye contact, and background..." | MISLEADING CLAIM | NO | Video call is WebRTC stream without vision AI | **REWRITE** to "Immersive video call simulation with per-question scoring" |
| `solutions.editorial.feature2Title` | "Emotional Resonance" | UNSUPPORTED CLAIM | NO | Feedback is rubric-based | **REWRITE** to "Communication Clarity" |
| `solutions.cta.subtitle` | "Join 50,000+ professionals using AI..." | FAKE SOCIAL PROOF | NO | Fake user metric | **REWRITE** to "Start practicing with your own CV and target job today." |
| `SolutionsPage:68` | "+35% Lương đàm phán trung bình" | FAKE METRIC | NO | Hardcoded metric in JSX | **REMOVE** |
| `SolutionsPage:68` | "100% Bảo mật danh tính hồ sơ" | MARKETING CLAIM | PARTIAL | Data is private per user | **REWRITE** to "Private & secure practice environment" |

---

## 5. Unsupported / Risky Claims

The following exact claims currently exist in `/solutions` and must be **purged or rewritten** during redesign:
1. `"98% Editorial Accuracy"`
2. `"15+ Leadership Models"`
3. `"50,000+ professionals"`
4. `"+35% Lương đàm phán trung bình"`
5. `"Real-time eye contact & posture analysis"`
6. `"AI video agents analyze your body language, eye contact"`
7. `"Emotional Resonance: Measure how your delivery connects on a deep human level"`
8. `"Predictive cultural fit"`

---

## 6. Persona Audit

### Persona 1: Students & Entry-Level Candidates (0–1 yrs)
- **Pain Point:** Lack of formal work experience, difficulty framing academic projects into STAR format.
- **Relevant Capability:** Career Classification, CV Evidence Extraction, STAR method interview practice.
- **Recommended Flow:** Upload CV/Project -> Extract Evidence Bullets -> Practice STAR Answers -> Receive Feedback.
- **CTA:** `/signup` (Start Free) or `/interview/select`.

### Persona 2: Active Job Seekers (2–5 yrs)
- **Pain Point:** Applying to specific JDs, unknown skill gaps, needing high-reflex interview practice.
- **Relevant Capability:** Target Job Selection, CV-JD Match & Gap Analysis, Chat/Voice Interview Practice.
- **Recommended Flow:** Select Target Job -> Audit Skill Gaps -> Run Voice Mock Interview -> Review Per-question Rubric.
- **CTA:** `/dashboard/jobs` or `/signup`.

### Persona 3: Seasoned Professionals & Managers (5+ yrs)
- **Pain Point:** Executive positioning, system thinking, behavioral loop preparation.
- **Relevant Capability:** Evidence Refinement, Multi-modal Mock Interview, Per-question In-depth Analytics.
- **Recommended Flow:** Target Senior Role -> Refine Career Narrative -> Executive Panel Simulation -> Progress Tracking.
- **CTA:** `/signup` or `/pricing`.

---

## 7. User Journey Audit

The core product journey mapped to implementation status:

```
CV Upload (IMPLEMENTED)
  ↓
Career Classification (IMPLEMENTED)
  ↓
Target Job Selection (IMPLEMENTED)
  ↓
CV-JD Evidence Match (IMPLEMENTED)
  ↓
AI Interview Practice [Chat/Voice/Video] (IMPLEMENTED / Video PARTIAL)
  ↓
Per-question Rubric Feedback (IMPLEMENTED)
  ↓
Progress Tracking (IMPLEMENTED)
```

---

## 8. Existing UI / Design Audit

- **What works:** Clear section division, persona-focused copy structure.
- **What conflicts with Resources/Pricing:**
  - Hard 2D borders (`border-2 border-[#234196]`), offset block shadows (`shadow-[4px_4px_0_#234196]`), rotated sticker badges (`sticker -rotate-2`), dot background (`paper-dots`).
  - Dark yellow background overload (`bg-[#FEF9EE]`).
- **What should be removed:**
  - Duplicate `<MarketingNav />` and `<Footer />`.
  - Nested `<main>` wrapper.
  - Hardcoded brutalist card styling.

---

## 9. Component Reuse Matrix

| Component | Decision | Reason |
|---|---|---|
| `MarketingEyebrow` | **REUSE DIRECTLY** | Sourced from shared design system |
| `MarketingSectionHeader` | **REUSE DIRECTLY** | Supports `as="h1"` / `as="h2"`, align="center"/"left" |
| `MarketingCTA` | **REUSE DIRECTLY** | Sourced from shared design system |
| `CoachCallout` | **REUSE DIRECTLY** | Sourced from shared design system |
| `MarketingCareerClassification` | **REUSE WITH WRAPPER** | Displays real persona classification capability |
| `MarketingEvidencePreview` | **REUSE WITH WRAPPER** | Displays real CV-JD evidence matching |
| `MarketingInterviewPreview` | **REUSE WITH WRAPPER** | Displays real Chat/Voice interview interface |
| `MarketingFeedbackPreview` | **REUSE WITH WRAPPER** | Displays real per-question rubric feedback |
| `ProgressPreview` | **REUSE WITH WRAPPER** | Displays real candidate progress tracking |
| `SolutionsPersonaSwitcher` | **REWRITE / REFACTOR** | Convert brutalist switcher to clean tabbed card container |

---

## 10. Routing Audit

| CTA Text / Element | Intended Destination | Exists? | Auth Required? | Decision |
|---|---|---|---|---|
| "Tìm lộ trình của bạn" | `/interview/cv-score` | **NO** | N/A | **REPLACE** with `/signup` or `/interview/select` |
| "Xem theo kinh nghiệm" | `#personas` | YES | NO | **KEEP** (smooth scroll anchor) |
| "Khám phá lộ trình Fresher" | `/signup` | YES | NO | **KEEP** |
| "Tối ưu CV & Luyện Phỏng vấn" | `/interview/cv-score` | **NO** | N/A | **REPLACE** with `/dashboard/cvs` |
| "Đặt phiên tư vấn bảo mật" | `/signup` | YES | NO | **KEEP** |
| "Bắt đầu Thử nghiệm Ngay" | `/signup` | YES | NO | **KEEP** |
| "Xem Bảng Giá Minh Bạch" | `/pricing` | YES | NO | **KEEP** |

---

## 11. i18n Audit

- **Total `solutions.*` keys in `i18n.ts`:** 45 keys (EN & VI)
- **Keys to keep & refine:** 30 keys (Hero, Student segment, Seeker segment, Modalities title, Editorial title, CTA)
- **Keys to rewrite / remove:** 15 keys (Fake metrics `stat1Value`, `stat2Value`, unsupported vision claims `visualDesc`, `video.desc`)
- **Hardcoded strings in JSX:** 4 strings in `SolutionsPage` (Need migration to `i18n.ts`)

---

## 12. Accessibility Audit

- **`<h1>` count:** 1 (Hero header)
- **Heading hierarchy:** `h1` -> `h2` -> `h3` -> `h4` (Needs proper hierarchy without skipping levels)
- **Keyboard navigation:** Persona switcher needs proper `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` attributes.
- **Focus states:** Focus rings must be visible on all interactive elements.
- **Contrast:** Ensure all text on blue (`#204195`) and yellow (`#FCB625`) backgrounds meets WCAG AA standards.

---

## 13. Responsive Risks

- **375px:** Persona cards and CTA buttons must stack vertically without horizontal overflow.
- **768px (Tablet):** Grid layouts must transition gracefully from 1-column to 2-column.
- **1024px+ (Desktop):** Max container width `max-w-6xl` (1152px) or `max-w-[1320px]` matching Resources/Pricing layout.

---

## 14. SEO Audit

- **Metadata:** Sourced via `generateMetadata()` using `dict["solutions.metaTitle"]`.
- **H1:** Single semantic `<h1>` tag in Hero.
- **Content Crawlability:** Persona descriptions and core modality benefits fully rendered server-side for search engines.

---

## 15. Performance Risks

- **Images:** No large unoptimized PNGs or heavy GIF assets.
- **Client JS Bundle:** Keep page wrapper as a Server Component, with minimal interactive Client islands (e.g. persona tabs).
- **Framer Motion:** Use light hover/fade animations (`prefers-reduced-motion` compliant).

---

## 16. Blockers

- **None.** Architecture is fully clear and ready for the Redesign Plan.

---

## 17. Audit Decision

> **AUDIT: PASS — READY TO PLAN REDESIGN**
