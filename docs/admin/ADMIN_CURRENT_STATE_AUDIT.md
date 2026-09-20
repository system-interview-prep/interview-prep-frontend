# ADMIN CURRENT STATE AUDIT
_Audited: 2026-09-20 | Source: d:\KLTN\interview-prep-frontend_

---

## 1. Route Inventory

| Route | File | Shell | Status | Notes |
|---|---|---|---|---|
| `/admin` | `app/admin/page.tsx` | — | IMPLEMENTED | Redirect → `/admin/dashboard` |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | `AdminDashboardShell` | IMPLEMENTED | Renders `AdminJobProfilesPanel` (real data) |
| `/admin/job-profiles` | _(no page.tsx)_ | — | NOT IMPLEMENTED | No root listing page; dashboard IS the listing |
| `/admin/job-profiles/create` | `app/admin/job-profiles/create/page.tsx` | — | IMPLEMENTED | Full create flow via `AdminJobProfileCreateView` |
| `/admin/job-profiles/[id]` | `app/admin/job-profiles/[id]/page.tsx` | — | IMPLEMENTED | Detail view via `AdminJobProfileDetailView` |
| `/admin/job-profiles/categories` | `app/admin/job-profiles/categories/page.tsx` | — | IMPLEMENTED | `AdminJobCategoriesView` – real data, read-only |
| `/admin/knowledge-base` | `app/admin/knowledge-base/page.tsx` | — | IMPLEMENTED | `KnowledgeBaseClient` (~90KB) – real KB/RAG management |
| `/admin/interviews` | `app/admin/interviews/page.tsx` | Custom sidebar inline | PLACEHOLDER | **100% static mock data** – hardcoded rows, no API calls |
| `/admin/insights` | `app/admin/insights/page.tsx` | Custom sidebar inline | PLACEHOLDER | **100% static mock data** – fake cohorts, fake charts |
| `/admin/settings` | `app/admin/settings/page.tsx` | Custom sidebar inline | PLACEHOLDER | **100% static mock data** – fake members, sliders non-functional |
| `/admin/help` | `app/admin/help/page.tsx` | Custom sidebar inline | PLACEHOLDER | Static content, system status hardcoded |
| `/admin/profile` | `app/admin/profile/page.tsx` | Custom sidebar inline | PARTIAL | `AdminProfilePersonalInfoClient` reads real auth profile |

---

## 2. Sidebar Architecture Problem

**CRITICAL INCONSISTENCY**: 2 sidebar designs hoàn toàn khác nhau:

### Sidebar A – "Chunky" Brand Style (INTERVIA design)
- **File**: `AdminDashboardShell.tsx`
- **Used by**: `/admin/dashboard`, `/admin/job-profiles/*`
- **Style**: `border-2 border-[#234196]`, `bg-[#FEF9EE]`, neo-brutalist

### Sidebar B – "Soft" Gray Style (generic)
- **File**: Inline trong từng page (copy-paste)
- **Used by**: `/admin/insights`, `/admin/interviews`, `/admin/settings`, `/admin/help`, `/admin/profile`
- **Style**: `bg-[#f2f4f6]`, `rounded-lg`, generic modern

**Impact**: Code duplication, UX inconsistency, no shared layout for non-dashboard pages.

---

## 3. Component Analysis

| Component | Size | Data Source | Status | Notes |
|---|---|---|---|---|
| `AdminDashboardShell.tsx` | 5.6KB | Auth cookies | IMPLEMENTED | Shared layout for dashboard + job-profiles |
| `AdminJobProfilesPanel.tsx` | 26KB | `jobProfileApi.list/delete`, `jobCategoryApi.list` | IMPLEMENTED | Search, filter, pagination, delete |
| `AdminJobProfileCreateView.tsx` | 45KB | `jobProfileApi.*`, `taxonomyApi`, `jobCategoryApi` | IMPLEMENTED | Create + edit, JD upload, Lexical editor |
| `AdminJobProfileDetailView.tsx` | 6.6KB | `jobProfileApi.get/delete` | IMPLEMENTED | View + delete only |
| `AdminJobCategoriesView.tsx` | 8.2KB | `jobCategoryApi.list` | IMPLEMENTED | Read-only, no create/edit/delete |
| `KnowledgeBaseClient.tsx` | 90KB | KB API + jpSocket | IMPLEMENTED | Full KB management |
| `AdminAuthBadge.tsx` | 1.7KB | `useAuthProfile()` | IMPLEMENTED | Real name/picture |
| `AdminProfilePersonalInfoClient.tsx` | 3.7KB | `useAuthProfile()` | PARTIAL | View-only, save not wired |
| `AdminSidebarBrand.tsx` | 0.75KB | Static | IMPLEMENTED | Logo only |
| `AdminDashboardJobNav.tsx` | 2.7KB | Links only | IMPLEMENTED | Nav links |

---

## 4. API Coverage in Admin

| Endpoint | Caller | Status |
|---|---|---|
| `GET /admin/job-descriptions` | AdminJobProfilesPanel | REAL |
| `GET /admin/job-descriptions/{id}` | AdminJobProfileDetailView, AdminJobProfileCreateView | REAL |
| `POST /admin/job-descriptions/uploads` | AdminJobProfileCreateView | REAL |
| `GET /admin/job-descriptions/uploads/{id}` | AdminJobProfileCreateView | REAL |
| `POST /admin/job-descriptions/uploads/{id}/reparse` | AdminJobProfileCreateView | REAL |
| `PATCH /admin/job-descriptions/uploads/{id}` | AdminJobProfileCreateView | REAL |
| `POST /admin/job-descriptions/uploads/{id}/finalize` | AdminJobProfileCreateView | REAL |
| `DELETE /admin/job-descriptions/{id}` | AdminJobProfilesPanel, AdminJobProfileDetailView | REAL |
| `GET /admin/job-categories` | AdminJobProfilesPanel, AdminJobProfileCreateView, AdminJobCategoriesView | REAL |
| `GET /admin/taxonomy/active` | AdminJobProfileCreateView | REAL |
| `GET /users/me` | AdminAuthBadge, AdminProfilePersonalInfoClient | REAL |
| `PATCH /users/me` | NOT USED in admin | NOT CONNECTED |
| `GET /notifications` | NOT USED in admin | NOT CONNECTED |
| Interviews API | Admin interviews page | NOT CONNECTED (mock) |
| Sessions API | Admin interviews page | NOT CONNECTED (mock) |
| Users API (list all users) | Admin | NOT FOUND IN BE |
| AI Metrics/Traces | Admin insights | NOT FOUND IN BE |

---

## 5. Mock / Static Data Detected

| Page | Mock Data | Items |
|---|---|---|
| `/admin/interviews` | YES | 4 hardcoded rows (Sarah Mitchell, James Rodriguez, Linda Wu, Alex Kim) |
| `/admin/insights` | YES | Cohorts, chart bars, "92%", "+12.4%", "9.2 avg score" all fake |
| `/admin/settings` | YES | 2 hardcoded members, temperature slider, API latency "42ms" fake |
| `/admin/help` | YES | System status hardcoded, "Indexing Pipeline degraded" hardcoded |
| `/admin/profile` | PARTIAL | Name/email real; 2FA toggle, save button fake |

---

## 6. Dead / Non-functional UI Elements

- "Schedule New Interview" button
- "Start AI Analysis" button (all sidebar B pages)
- "Optimize with AI" FAB in Settings
- "Manage Simulation" button in Interviews
- Floating Mic Tray (Interviews, Help)
- Bell/MessageSquare/Grid icon buttons in headers
- Temperature slider, Context Length select in Settings
- 2FA toggle in Profile
- "View All Articles" in Help
- "Contact Support" in Help
- `/admin/practice` link in profile sidebar (route NOT FOUND)
- All sidebar B Save/Discard buttons

---

## 7. Auth / RBAC

- No middleware-level admin role guard detected
- `roleLabel` is hardcoded string, not fetched from API
- Non-admin users can access `/admin/*` routes (no redirect guard found)
- `AuthProfile.role` field exists in type but not enforced in routing
