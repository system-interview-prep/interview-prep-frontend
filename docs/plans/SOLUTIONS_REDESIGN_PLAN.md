# INTERVIA /solutions — Redesign Plan

## 1. Design Objective

The redesigned `/solutions` page serves as the **tailored onboarding and solution guide** for INTERVIA. It clearly explains how INTERVIA adapts to a candidate's specific career stage (Student, Active Job Seeker, Seasoned Professional) by connecting their actual CV evidence to target job requirements and structured AI interview practice.

---

## 2. Target Users

1. **Students & Undergraduates (0–1 yrs experience):**
   - Goal: Turn academic projects and basic internships into structured STAR evidence; build interview confidence.
2. **Active Job Seekers (2–5 yrs experience):**
   - Goal: Target specific job roles (JDs), identify skill gaps, and practice high-reflex voice/chat interviews.
3. **Seasoned Professionals & Managers (5+ yrs experience):**
   - Goal: Refine executive narratives, practice scenario-based leadership questions, and track overall interview readiness.

---

## 3. Approved Product Capabilities

Only features supported by actual implementation in the codebase will be featured:

- **CV Evidence Extraction:** Converting work experience into Action–Context–Metric bullet points.
- **Job Profile & JD Matching:** Comparing CV proof against target job requirements and displaying skill gap analysis.
- **Chat Interview Practice:** Text-based interactive AI interviewer for screening and technical questions.
- **Voice Interview Practice:** WebRTC audio streaming simulation with speech recognition and filler word detection.
- **Video Call Simulation:** Immersive video call room environment for real-time interview practice.
- **Per-question Feedback & Rubric:** Detailed scoring, rubric breakdown (Technical, Communication, Problem Solving), strengths, and improvements.
- **Progress Tracking:** Candidate readiness score tracking over time.

---

## 4. Content Principles

1. **Zero Unsupported Metric Claims:** Remove all fake stats (`98% Editorial Accuracy`, `15+ Leadership Models`, `50,000+ professionals`, `+35% Lương`).
2. **Zero Unsupported Computer Vision Claims:** Remove all false claims regarding facial eye-contact tracking, posture AI, and body language analysis.
3. **Grounded, Evidence-First Copy:** Use factual wording ("practice against structured criteria", "compare evidence with job requirements", "receive structured feedback").
4. **Valid Conversion Paths:** Ensure all CTAs point to existing App Router paths (`/signup`, `/pricing`, `/resources`, `/dashboard/cvs`, `/interview/select`).

---

## 5. Information Architecture (IA)

The page will consist of **7 cohesive sections**:

1. **Section 01 — Hero Section:**
   - **Goal:** Set the value proposition ("INTERVIA adapts to your exact career stage").
   - **Visual:** Left column headline & CTAs, Right column interactive/visual preview card.
2. **Section 02 — Persona Solution Switcher:**
   - **Goal:** Allow candidates to select their stage (Student, Job Seeker, Professional) and view tailored workflow steps & recommended tools.
3. **Section 03 — CV → Role → Evidence Workflow:**
   - **Goal:** Visualize how INTERVIA connects candidate CV bullets to target JDs and interview prompts.
4. **Section 04 — Practice Modalities:**
   - **Goal:** Showcase the 3 practice channels (Chat Mentorship, Voice Simulation, Video Call).
5. **Section 05 — Evidence-Based Feedback Loop:**
   - **Goal:** Highlight per-question scoring, rubrics, strengths, and candidate progress tracking.
6. **Section 06 — INTERVIA Coach Callout:**
   - **Goal:** Provide guided next-step recommendation ("Start with your CV").
7. **Section 07 — Final Conversion CTA:**
   - **Goal:** Drive conversion to `/signup` and `/pricing`.

---

## 6. Proposed Page Structure (ASCII Map)

```
┌─────────────────────────────────────────────────────────────┐
│                    MARKETING NAV (Layout)                   │
├─────────────────────────────────────────────────────────────┤
│ 01. HERO                                                    │
│     [Eyebrow: ADAPTIVE CAREER SOLUTIONS]                    │
│     Headline: Prepare for the role you actually want.       │
│     Sub: From campus to executive interviews, INTERVIA...   │
│     [CTA: Find your path ->]  [CTA: View Pricing]           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 02. PERSONA SOLUTION FIT (Tabs: Student | Seeker | Pro)    │
│     [Card] Stage Overview & Pain Points                     │
│     [Bullets] Tailored Solution Steps                       │
│     [CTA: Launch Stage Prep ->]                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 03. CV → ROLE → EVIDENCE WORKFLOW                           │
│     Step 1: Extract CV Evidence                             │
│     Step 2: Match Target Job & Gap Analysis                 │
│     Step 3: Generate Interview Prompts                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 04. PRACTICE MODALITIES                                     │
│     [Card 1: Chat]  [Card 2: Voice]  [Card 3: Video]        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 05. STRUCTURED FEEDBACK & PROGRESS                          │
│     - Per-question Rubric Scoring                           │
│     - Strengths & Actionable Improvements                   │
│     - Candidate Readiness Tracking                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 06. INTERVIA COACH CALLOUT                                  │
│     "Not sure where to begin? Start with your CV."          │
│     [CTA: Start with my CV ->]                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 07. FINAL CTA                                               │
│     "Ready to prepare with real evidence?"                  │
│     [CTA: Start Free ->]  [CTA: View Pricing]               │
├─────────────────────────────────────────────────────────────┤
│                      FOOTER (Layout)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Design System Alignment

Align completely with `/resources` and `/pricing`:

- **Palette:**
  - Primary Brand: `#204195` (Navy Blue)
  - Accent / Badge: `#FCB625` (Golden Yellow)
  - Dark Headings: `#14244B`
  - Body Text: `#506085` / `#607096`
  - Border: `#DCE4F3`
  - Backgrounds: `#FFFFFF`, `#F7F9FD`, `#EEF3FC`
- **Border Radius:**
  - Controls & Buttons: `14px` / `16px`
  - Standard Cards: `22px`
  - Feature Containers: `26px`
- **Shadows:** Soft ambient glow `shadow-sm` / `shadow-[0_10px_34px_rgba(32,65,149,0.045)]`
- **Typography:** Plus Jakarta Sans (Headings/Body), JetBrains Mono (Eyebrows/Badges)
- **Mascot Rules:** Decorative use in Hero, Coach Callout, and Final CTA.

---

## 8. Component Architecture

```
src/
├── app/(marketing)/solutions/
│   └── page.tsx                         # Server Page Wrapper (Metadata + Client Client)
└── features/marketing/
    ├── components/solutions/
    │   ├── SolutionsHero.tsx            # Hero section
    │   ├── SolutionsPersonaTabs.tsx     # Persona switcher (Student/Seeker/Pro)
    │   ├── SolutionsWorkflowSection.tsx # CV -> Role -> Evidence steps
    │   └── SolutionsPageClient.tsx      # Main Client Island
    └── data/
        └── solutions.data.ts            # Persona & capability metadata IDs
```

- **Clean Layout Rule:** `src/app/(marketing)/solutions/page.tsx` will ONLY render `<SolutionsPageClient />`. `<MarketingNav />` and `<Footer />` are provided automatically by `src/app/(marketing)/layout.tsx`.

---

## 9. Data Architecture (`solutions.data.ts`)

```typescript
export type PersonaId = "student" | "seeker" | "professional";

export interface PersonaConfig {
  id: PersonaId;
  badgeKey: string;
  titleKey: string;
  descKey: string;
  stepsKeys: string[];
  ctaTextKey: string;
  ctaHref: string;
}

export const SOLUTIONS_PERSONAS: PersonaConfig[] = [
  {
    id: "student",
    badgeKey: "solutions.persona.student.badge",
    titleKey: "solutions.persona.student.title",
    descKey: "solutions.persona.student.desc",
    stepsKeys: [
      "solutions.persona.student.step1",
      "solutions.persona.student.step2",
      "solutions.persona.student.step3",
    ],
    ctaTextKey: "solutions.persona.student.cta",
    ctaHref: "/signup",
  },
  {
    id: "seeker",
    badgeKey: "solutions.persona.seeker.badge",
    titleKey: "solutions.persona.seeker.title",
    descKey: "solutions.persona.seeker.desc",
    stepsKeys: [
      "solutions.persona.seeker.step1",
      "solutions.persona.seeker.step2",
      "solutions.persona.seeker.step3",
    ],
    ctaTextKey: "solutions.persona.seeker.cta",
    ctaHref: "/dashboard/jobs",
  },
  {
    id: "professional",
    badgeKey: "solutions.persona.pro.badge",
    titleKey: "solutions.persona.pro.title",
    descKey: "solutions.persona.pro.desc",
    stepsKeys: [
      "solutions.persona.pro.step1",
      "solutions.persona.pro.step2",
      "solutions.persona.pro.step3",
    ],
    ctaTextKey: "solutions.persona.pro.cta",
    ctaHref: "/pricing",
  },
];
```

---

## 10. i18n Architecture

Proposed key structure in `src/i18n/i18n.ts`:

- `solutions.metaTitle`: Title for page metadata
- `solutions.badge`: Hero eyebrow text
- `solutions.heroTitleA` / `heroTitleB`: Hero title split
- `solutions.heroDescription`: Hero subtitle
- `solutions.persona.*`: Tab labels and content for Student, Job Seeker, Professional
- `solutions.workflow.*`: CV -> Role -> Evidence titles & step descriptions
- `solutions.modalities.*`: Chat, Voice, Video modality cards
- `solutions.feedback.*`: Rubric, scoring, and progress tracking explanations
- `solutions.cta.*`: Final conversion section copy

---

## 11. Interaction Design

- **Persona Switcher:** Accessible tab navigation (`role="tablist"`). Clicking a tab updates state without layout shift.
- **Animations:** Subtle Framer Motion fade/translate-y (`<= -4px` on hover).
- **Reduced Motion:** Full compliance via `prefers-reduced-motion` CSS rules.

---

## 12. Responsive Behavior

- **375px (Mobile Small):** Hero stacks vertically; persona tabs wrap horizontally; CTA buttons take full width `w-full`.
- **768px (Tablet):** Modalities grid displays in 2 columns; workflow steps stack cleanly.
- **1024px–1440px+ (Desktop):** Hero displays 2-column layout; modalities display in 3-column grid; max container width `max-w-6xl`.

---

## 13. Accessibility Requirements

- Exactly one `<h1>` tag in Hero (`MarketingSectionHeader(as="h1")`).
- `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` for persona switcher.
- High contrast colors meeting WCAG AA standards.
- Visible focus rings on keyboard navigation.

---

## 14. SEO Requirements

- Page title and meta description provided via `generateMetadata()`.
- Semantic HTML tags (`<h1>`, `<h2>`, `<h3>`, `<section>`, `<article>`).
- Server-rendered initial markup so search engine crawlers index persona benefits and solution details.

---

## 15. Performance Requirements

- Server Component entry wrapper (`page.tsx`).
- Zero unoptimized heavy assets.
- Small Client JS bundle for interactive islands.

---

## 16. Implementation Order (Post-Approval)

1. **Phase 1 — Data & i18n Dictionary Setup:**
   - Create `src/features/marketing/data/solutions.data.ts`.
   - Update EN & VI dictionaries in `src/i18n/i18n.ts` with clean, grounded keys.
2. **Phase 2 — Solutions Components & Client Island:**
   - Create `SolutionsPersonaTabs.tsx` and `SolutionsPageClient.tsx`.
   - Update `src/app/(marketing)/solutions/page.tsx` to remove duplicate Nav/Footer and render `<SolutionsPageClient />`.
3. **Phase 3 — Build & Verification:**
   - Run `pnpm run build` to verify 0 errors.
   - Audit accessibility, responsive layout, and CTA routing.

---

## 17. Acceptance Criteria

- [ ] `pnpm run build` succeeds with Exit Code 0.
- [ ] No duplicate `MarketingNav` or `Footer` on `/solutions`.
- [ ] Exactly one `<h1>` tag on `/solutions`.
- [ ] Zero unsupported metric claims (98%, 15+, 50,000+, +35%).
- [ ] Zero unsupported computer vision claims (eye-contact, posture AI).
- [ ] Persona switcher is accessible via keyboard (`role="tablist"`).
- [ ] All CTAs point to valid routes (`/signup`, `/pricing`, `/resources`, `/dashboard/cvs`, `/interview/select`).
- [ ] Design language completely matches `/resources` and `/pricing`.

---

## 18. Risks / Decisions Needed

- **Decision Needed:** Confirm whether persona CTAs should link to `/signup` vs `/dashboard/cvs` for authenticated users. (Default proposed: Guest -> `/signup`, Authenticated -> `/dashboard/cvs`).
