# Intervia design system

Goal: a UI that **explains itself**. At a glance the user knows what the
system is doing right now and which step of the process they are on. It
should not look AI-generated or icon-heavy. The fox is the app's
**assistant**, living in one place (the corner), not decoration on every page.

## Principles

1. **Show the process, once.** The journey pipeline (`JourneySteps`: Tải CV →
   Chọn vị trí → Phỏng vấn → Nhận báo cáo) appears only on the dashboard
   overview. Other pages say their next step in one plain sentence; don't
   repeat the pipeline on every page. Work that takes time shows `ProcessStatus`, phase by phase,
   instead of a bare spinner ("Đang tạo phiên…", "Đang chấm từng câu…").
   Every result says what happened and what to do next.
2. **Never claim what didn't happen.** No fake success toasts, invented
   devices/IPs/stats, buttons that do nothing, or features the backend doesn't
   have. If something isn't available yet, say so ("chưa hỗ trợ", "sắp có").
3. **Words over icons.** No icon in a tinted square next to every heading,
   no Sparkles/"magic" icons. Keep an icon only when it is the whole control
   (close, mic, camera, send, the collapsed sidebar rail) or a status tick.
4. **Original colours stay.**
   - Brand blue `#204195` (hover `#183275`) for primary actions.
   - Yellow `#FCB625` for the current step and highlights.
   - Text `#14244B` / `#607096`.
   - Surfaces `#FFFFFF` / `#F8FAFC` / `#F0F4FC`; borders `#DCE4F3` / `#EAEFF8`.
   - Green `#287A4B` (tint `#EAF5EE`) and red `#C43B3B` (hover `#A93232`, tint `#FDF2F2`) for success and error.
   - No purple, indigo, violet or rose; no glow blobs.
   - Older Material-style class names (`text-primary`, `bg-error-container`…) are aliases of these in `globals.css`.
5. **Type.** Titles in Fraunces (`h1`, `.font-display`), body text in Be Vietnam Pro (both support Vietnamese).
6. **Shapes.** Cards are `rounded-3xl` with a `border-[#DCE4F3]`; buttons are `rounded-full`.
7. **Motion is quiet.** Transform and opacity only; 150–300 ms, ease-out in,
   shorter out; no bounce. Entrances play once (refreshes update in place).
   Everything respects `prefers-reduced-motion`. Utilities in `globals.css`:
   - `anim-rise`: entrance fade + 8px rise; stagger with `style={{ "--i": n }}` (capped).
   - `anim-pop`: popovers, bubbles, dialogs.
   - `anim-grow-y` / `anim-grow-x`: bars growing from the baseline / meters filling.
   - `anim-shimmer`: skeleton placeholders.
   - `press`: subtle scale on press.

## The fox

- **Corner assistant** (`GlobalMascot` → `MascotContainer`): a round launcher
  bottom-right that opens a small panel of tips for the current page, with
  links to start an interview and to help. It speaks up by itself at most once
  per page per session; users can turn automatic tips off. Hidden in rooms,
  admin and auth. `triggerMascot({ mood, speechKey | speechText, durationMs })`
  shows a short bubble for app events.
- **Logo**: `FoxAvatar` next to the word "Intervia" (sidebar, top bars, marketing nav/footer).
- **Nowhere else**: not in page heroes, empty/loading/error states, modals or
  notes. In interview rooms the interviewer's face is `InterviewerAvatar` (a
  neutral "AI" badge), not the fox.

## Components

- `@components/shared/PageHero`: the page intro card: `h1`, body, actions (children), optional `aside` and `steps`.
- `@components/shared/ProcessSteps`
  - `ProcessSteps`: where the user is in the journey (done / current / todo, plus a hint).
  - `JourneySteps`: `ProcessSteps` for the one shared journey (`JOURNEY_STEPS`). Used on the dashboard overview only, and only until the journey is done (first report); after that the hero's next step is the weakest skill of the latest report. CV–JD matching counts as part of "Chọn vị trí", not as a step of its own.
  - `ProcessStatus`: what the system is doing now (running / done / error, plus a message).
- `@components/shared/StatusNote`: one-line status next to what just happened (info / success / error), coloured edge + words.
- `@components/shared/Pagination`: "Hiển thị 11–20 / 37" plus page buttons. Any list that can grow past ~10–20 items is paginated.
- `@components/shared/ConfirmDialog`: replaces `window.confirm`; `@components/shared/useDialogA11y` gives every custom dialog Escape, focus-in, a focus trap and focus restore.
- `@components/shared/CountUp`: a number that counts up once on first appearance (final value for screen readers / reduced motion).

## Navigation

The user nav is: Trang chủ · Phỏng vấn · Việc làm · CV của tôi · Lịch sử, plus Cài đặt and Trợ giúp.

The desktop sidebar collapses to an icon rail (the panel button next to the logo, or Ctrl/⌘+B; remembered per browser). Icons appear only on the collapsed rail, where each icon is the whole control and has a tooltip; the expanded sidebar stays words-only. On mobile, the bottom tab bar's last item opens a "Thêm" sheet with the remaining destinations and logout.

There is no separate "Luyện tập" section, because practice *is* the chat, voice or video interview.
- `/practice` redirects to `/interview/select`.
- `/practice/room/[id]` still serves question-practice sessions.

## Candidate home (dashboard overview)

Built for long-term practice, from real data only (sessions, CV count, roles, saved roles, the weekly goal):

1. **Today** (`PageHero`): one next step and one primary action. An open session appears here once (an old one can also be closed here). The aside is `WeekGoal`: the weekly goal the candidate chose leads, and the streak is a plain fact under it, never loss-pressure copy.
2. **Progress**: `ScoreTrend` + `CompetencyFocus` (or `RecentActivity` before there are competency scores).
3. **Consistency**: `PracticeCalendar` (12 weeks, one brand-blue scale) + `Milestones` (computed from finished sessions, fixed order, the first unreached one is "Tiếp theo"; nothing is stored or awarded).
4. `RecentActivity`, then `SuggestedJobs`.

No XP, levels, leaderboards, badges or daily challenges: the backend has none of them.
