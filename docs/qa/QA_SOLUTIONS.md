# QA CHECKLIST — SOLUTIONS

## Build
- [x] `pnpm run build` executed successfully (Exit code 0, 27 routes generated including `/solutions`)

## Architecture
- [x] Page wrapper `src/app/(marketing)/solutions/page.tsx` renders server metadata & `<SolutionsPageClient />`
- [x] No duplicate `MarketingNav` or `Footer` rendered in Solutions page
- [x] No nested `<main>` tags
- [x] Single semantic `<h1>` tag in Hero section
- [x] Persona switcher extracted into clean `<SolutionsPersonaTabs />` client island

## Content Claims Cleanup
- [x] Removed "98% Editorial Accuracy"
- [x] Removed "15+ Leadership Models"
- [x] Removed "50,000+ professionals"
- [x] Removed "+35% Lương đàm phán trung bình"
- [x] Removed "Real-time eye contact & posture analysis"
- [x] Removed "AI video agents analyze your body language, eye contact"
- [x] Removed "Emotional Resonance"
- [x] Removed "Predictive cultural fit"
- [x] Removed unverified filler-word detection claims
- [x] No rigid experience year ranges (0–1 years, 2–5 years, 5+ years)

## Persona Switcher
- [x] Accessible WAI-ARIA implementation (`role="tablist"`, `role="tab"`, `role="tabpanel"`)
- [x] Roving `tabIndex` (`0` for selected, `-1` for unselected)
- [x] Full keyboard navigation support (`ArrowRight`, `ArrowLeft`, `Home`, `End` with focus wrapping)
- [x] Visible focus outline styling (`focus-visible:outline-2 focus-visible:outline-[#204195]`)
- [x] Grounded persona names: Student / Early Career, Active Job Seeker, Professional

## Workflow Section
- [x] 4-step workflow: CV Evidence → Target Role → Requirement Match → Practice & Refine
- [x] Evidence-based matching claims (no LLM recruiter mind reading claims)

## Modalities Section
- [x] Chat: Structured Q&A flow, instant written feedback, self-paced drafting
- [x] Voice: Speech recognition integration, pace & clarity feedback, real-time verbal practice
- [x] Video: Simulated video call room, realistic environment, integrated prompt display
- [x] Zero computer vision or pose/facial analysis claims

## Feedback & Progress Section
- [x] Per-question rubric scoring
- [x] Identified strengths & missing evidence gaps
- [x] Readiness & progress tracking across practice sessions

## Routing & CTA
- [x] Auth-aware routing implemented via `useAuthProfile()`
  - Student persona: Guest → `/signup`, Authenticated → `/dashboard/cvs`
  - Seeker persona: Guest → `/signup`, Authenticated → `/dashboard/jobs`
  - Professional persona: Guest → `/signup`, Authenticated → `/interview/select`
- [x] Invalid `/interview/cv-score` routes completely removed
- [x] Secondary CTA routes correctly to `/pricing`

## i18n
- [x] Comprehensive dictionary entries added to `src/i18n/i18n.ts` for both EN & VI
- [x] `solutions.metaTitle` and `solutions.metaDescription` defined and consumed by `generateMetadata()`
- [x] Zero hardcoded marketing strings in Solutions page components

## Accessibility
- [x] Single `<h1>` on page
- [x] Logical heading hierarchy (`<h1>` → `<h2>` → `<h3>`)
- [x] WAI-ARIA tablist accessibility with keyboard roving focus
- [x] High-contrast colors matching design system tokens

## Design System Alignment
- [x] Shared color palette (#204195, #FCB625, #14244B, #506085, #DCE4F3, #F7F9FD, #EEF3FC)
- [x] Rounded radii (14px buttons, 18px-22px cards, 26px-30px feature containers)
- [x] Soft ambient shadows (`shadow-sm`, `shadow-[0_10px_34px_rgba(32,65,149,0.045)]`)
- [x] All brutalist styles (`border-2`, `storybook-card`, `chunky`, `shadow-[4px_4px_0_#234196]`, `paper-dots`, rotated stickers) removed

## Responsive
- [x] Designed for mobile (375px/430px stacked), tablet (768px), and desktop (1024px/1280px/1440px/1920px)
- [x] [ ] Browser visual testing (runtime browser unavailable; static audit passed)

## Final Gate
- [x] SOLUTIONS QA GATE: PASS
