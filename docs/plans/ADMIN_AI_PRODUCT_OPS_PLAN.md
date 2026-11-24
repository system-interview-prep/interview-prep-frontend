# INTERVIA Admin AI Product Operations Plan

_Version: 0.1 (Draft for Review)_
_Audited: 2026-09-20_
_Status: **WAITING FOR USER APPROVAL – NOT IMPLEMENTED**_

---

## 1. Executive Summary

INTERVIA hiện có một Admin panel **hoạt động một nửa**:
- **Phần hoạt động thật**: Job Profiles CRUD, JD upload/parse, Knowledge Base management, Job Categories (read-only)
- **Phần là placeholder hoàn toàn**: Interviews (mock data), Insights (mock data), Settings (mock data), Help (static)
- **Phần thiếu hoàn toàn**: Users management, AI Operations, Evaluation, Audit Logs, Sessions (admin-scoped)

Mục tiêu plan này là nâng cấp Admin thành **INTERVIA AI Product Operations Console** – không chỉ CRUD mà bao gồm:
- Product operations (Users, Sessions, Content)
- AI Operations (Models, Prompts, Traces, Usage, Errors)
- Evaluation (Datasets, Experiments, Regression)
- Audit & Security

---

## 2. Current Admin State

### Routes hiện có

| Route | Trạng thái |
|---|---|
| `/admin` (redirect) | IMPLEMENTED |
| `/admin/dashboard` (= Job Profiles panel) | IMPLEMENTED – real data |
| `/admin/job-profiles/create` | IMPLEMENTED – real data |
| `/admin/job-profiles/[id]` | IMPLEMENTED – real data |
| `/admin/job-profiles/categories` | IMPLEMENTED – read-only |
| `/admin/knowledge-base` | IMPLEMENTED – real data |
| `/admin/interviews` | PLACEHOLDER – hardcoded mock data |
| `/admin/insights` | PLACEHOLDER – hardcoded mock data |
| `/admin/settings` | PLACEHOLDER – hardcoded mock data |
| `/admin/help` | PLACEHOLDER – static content |
| `/admin/profile` | PARTIAL – real name/picture, save not wired |

### Vấn đề nghiêm trọng

1. **Sidebar inconsistency**: 2 sidebar designs hoàn toàn khác nhau – "Chunky" (dashboard) vs "Soft Gray" (các trang khác) – mỗi trang tự embed sidebar riêng → code duplication
2. **Mock data không được label**: Người dùng nhìn vào không biết data là fake
3. **Không có admin role guard**: Bất kỳ ai cũng truy cập `/admin/*` được
4. **Dead links**: `/admin/practice` link tồn tại nhưng route không có

---

## 3. Current Backend / Data Capability

### Đã có

| Capability | API |
|---|---|
| Job Descriptions CRUD | `GET/POST/PATCH/DELETE /admin/job-descriptions` |
| JD Upload & Parse | `/admin/job-descriptions/uploads/*` |
| Job Categories (read) | `GET /admin/job-categories` |
| Taxonomy | `GET/PUT/POST /admin/taxonomy/*` |
| Knowledge Base | REST + Socket |
| User (self only) | `GET/PATCH /users/me` |
| AI Sessions (user-scoped) | `GET /ai/sessions`, `POST /ai/session` |
| AI Chat | `/ai/chat`, `/ai/history` |
| Notifications (user-scoped) | `GET/PATCH/DELETE /notifications` |

### Chưa có

| Capability | Gap |
|---|---|
| Users list (admin-scoped) | ❌ NOT IN BE |
| Sessions list (admin-scoped) | ❌ NOT IN BE |
| Admin Overview Metrics | ❌ NOT IN BE |
| Question Bank | ❌ NOT IN BE |
| Rubrics | ❌ NOT IN BE |
| AI Prompts management | ❌ NOT IN BE |
| AI Models config | ❌ NOT IN BE |
| Tracing / Observability | ❌ NO INTEGRATION |
| Token / Cost / Latency | ❌ NOT IN BE |
| Evaluation Datasets | ❌ NOT IN BE |
| Evaluation Experiments | ❌ NOT IN BE |
| Audit Logs | ❌ NOT IN BE |

---

## 4. Problems

1. **Admin không reflect thực tế**: Dashboard hiển thị "Job Profiles" nhưng không có metrics tổng quan
2. **Interviews page: 100% fake** nhưng không có disclaimer
3. **Insights: 100% fake** (hardcoded "92%", "+12.4%", cohort data)
4. **Settings: non-functional** sliders, toggles
5. **Không có user management** → Admin không biết ai đang dùng hệ thống
6. **Không có AI observability** → Không biết AI đang hoạt động tốt hay xấu
7. **Không có prompt versioning** → Prompt thay đổi không có audit trail
8. **Không có evaluation** → Không biết AI improve hay regress sau mỗi thay đổi
9. **Không có RBAC** → Security risk

---

## 5. Target Admin Architecture

```
INTERVIA Admin (Product Operations Console)
│
├── Overview
│   └── /admin/dashboard
│       ├── Total users, active sessions
│       ├── AI run success rate
│       ├── Recent failed sessions
│       └── Quick links
│
├── People
│   └── /admin/users
│       ├── User list: search, filter by role, status
│       └── /admin/users/[id]: detail, sessions, CVs, role change
│
├── Interview Content
│   ├── /admin/job-profiles (existing – working)
│   ├── /admin/job-profiles/categories (existing – working)
│   ├── /admin/question-bank (new – requires BE)
│   ├── /admin/rubrics (new – requires BE)
│   └── /admin/knowledge-base (existing – working)
│
├── Interviews
│   └── /admin/interviews
│       ├── Session listing: filter by mode, status, date, user
│       └── /admin/interviews/[id]: transcript, score, AI assessment
│
├── AI Operations
│   ├── /admin/ai – AI health overview
│   ├── /admin/ai/models – model config per capability
│   ├── /admin/ai/prompts – prompt listing + versioning
│   ├── /admin/ai/traces – trace summary → link to Langfuse
│   ├── /admin/ai/usage – token/cost/latency (p50, p95)
│   └── /admin/ai/errors – error log
│
├── Evaluation
│   ├── /admin/evaluation – eval overview
│   ├── /admin/evaluation/datasets
│   ├── /admin/evaluation/experiments
│   └── /admin/evaluation/regression
│
├── Insights
│   └── /admin/insights – product analytics (real data)
│
├── Audit Logs
│   └── /admin/audit-logs
│
└── System
    ├── /admin/settings
    ├── /admin/profile
    └── /admin/help
```

---

## 6. Information Architecture

### Sidebar Groups (Proposed)

| Group | Items | Icon |
|---|---|---|
| **Overview** | Dashboard | LayoutDashboard |
| **People** | Users | Users |
| **Interview Content** | Job Profiles, Categories, Question Bank, Rubrics, Knowledge Base | Briefcase |
| **Interviews** | Sessions, Results | Video |
| **AI Operations** | Overview, Models, Prompts, Traces, Usage & Cost, Errors | Cpu |
| **Evaluation** | Datasets, Experiments, Regression | FlaskConical |
| **Analytics** | Insights | TrendingUp |
| **System** | Audit Logs, Settings, Profile, Help | Settings |

---

## 7. Route Plan

Xem chi tiết: [`ADMIN_ROUTE_PROPOSAL.md`](./ADMIN_ROUTE_PROPOSAL.md)

---

## 8. User Management

### Purpose
Cho phép admin xem, quản lý người dùng trong hệ thống.

### Data Required
- User list với pagination, search, filter by role/status
- Per-user: email, name, role, createdAt, lastSeen, cvCount, sessionCount

### Backend Required (MISSING)
- `GET /admin/users?search=&role=&status=&cursor=`
- `GET /admin/users/{id}`
- `PATCH /admin/users/{id}/role` → `{ role: "CANDIDATE" | "ADMIN" }`
- `PATCH /admin/users/{id}/status` → `{ status: "ACTIVE" | "SUSPENDED" }`

### Security
- Do NOT expose: password hash, tokens, Google OAuth tokens
- Role change phải require confirmation modal + audit log entry

### Priority: **P1**

---

## 9. Job Profiles

**Status**: IMPLEMENTED – working. Minor improvements planned:
- Add filters by category, status in listing
- Show "parsed_by_ai" vs "manual" badge
- Add taxonomy concept display in detail view

### Priority: **P0** (maintain current)

---

## 10. Question Bank

### Purpose
Quản lý ngân hàng câu hỏi phỏng vấn theo role/capability.

### Data Required
- `question_id`, `position`, `competency`, `difficulty`, `language`, `question_text`, `rubric_id`, `status`

### Backend Required (MISSING)
- `GET /admin/questions?position=&difficulty=&language=&cursor=`
- `POST /admin/questions`
- `PATCH /admin/questions/{id}`
- `DELETE /admin/questions/{id}`

### Priority: **P2** – Cần BE implement trước

---

## 11. Rubrics

### Purpose
Quản lý tiêu chí đánh giá câu trả lời phỏng vấn.

### Data Required
```
Rubric:
  - id
  - name
  - version
  - criteria: [{ name, weight, description, scoringGuide }]
  - linkedQuestions: QuestionRef[]
  - status: draft | active | deprecated
  - updatedBy, updatedAt
```

### Relationship
```
Question → Rubric → EvaluationPrompt → InterviewScore
```

### Backend Required (MISSING)
- `GET/POST/PATCH/DELETE /admin/rubrics`

### Priority: **P2**

---

## 12. Interviews (Sessions)

### Current State
`/admin/interviews` = 100% fake hardcoded data. Cần replace hoàn toàn.

### Target
Session operations table:

| Column | Source |
|---|---|
| Session ID | BE |
| Candidate | user.name, user.email |
| Mode | chat / voice / video |
| Position | session.position |
| Started | session.created_at |
| Duration | computed |
| Status | completed / in_progress / failed |
| AI Score | evaluation result |
| Actions | View detail |

### Backend Required (MISSING)
- `GET /admin/sessions` admin-scoped với pagination, filter
- `GET /admin/sessions/{id}` with full transcript + AI assessment

### Priority: **P1**

---

## 13. Knowledge Base

**Status**: IMPLEMENTED – working well. Keep as-is.
- Document upload, management, tagging
- Socket-based indexing status

### Priority: **P0** (maintain current)

---

## 14. AI Operations

**⚠️ IMPORTANT: Phân biệt 2 lớp**

```
INTERVIA Admin AI Ops = Product Summary View
   (success rate, overall latency, error counts, cost estimate)

Langfuse UI = AI Engineering Deep Debug
   (span timelines, prompt diffs, retrieval logs, raw token counts)
```

Admin không clone Langfuse. Admin chỉ hiển thị **aggregated summary** từ Langfuse API.

### Sub-modules

#### AI Overview (`/admin/ai`)
- Total AI runs (last 24h, 7d, 30d)
- Success / failure rate
- p50 / p95 latency
- Total token usage + cost estimate
- Failed runs count → link to Langfuse
- Model health per capability

**Data**: Langfuse API aggregate endpoints
**Backend required**: Langfuse SDK integration in BE

#### Models (`/admin/ai/models`)

| Capability | Provider | Model | Environment | Status |
|---|---|---|---|---|
| CV Parsing | OpenAI | gpt-4o | production | active |
| CV-JD Matching | OpenAI | gpt-4o | production | active |
| Question Generation | OpenAI | gpt-4o | production | active |
| Interview Conversation | OpenAI/Gemini | — | production | active |
| Interview Scoring | OpenAI | — | production | active |
| Voice (STT) | Deepgram | — | production | active |

_Capabilities list phải được confirm từ BE code thực tế._

**Backend required**: `GET/PATCH /admin/ai/models/{capability}`

#### Prompts (`/admin/ai/prompts`)
Xem section 16 bên dưới.

#### Traces (`/admin/ai/traces`)
- Summary table: TraceID, Feature, Model, Latency, Tokens, Status, Timestamp
- Click row → link to Langfuse trace detail

**Langfuse required**: Yes

#### Usage & Cost (`/admin/ai/usage`)
- Line chart: daily token usage (7d, 30d)
- Breakdown by: feature, model, provider
- p50 / p95 latency per feature
- Estimated cost (requires pricing config)

**Data**: Langfuse API
**Priority**: P1

#### Errors (`/admin/ai/errors`)

| Error Type | Provider | Model | Feature | Count | Last Occurrence |
|---|---|---|---|---|---|
| timeout | OpenAI | gpt-4o | cv_parsing | 3 | — |
| rate_limit | OpenAI | gpt-4o | interview | 1 | — |
| invalid_json | — | — | scoring | 2 | — |

**Data**: Langfuse failed traces filtered
**Priority**: P1

---

## 15. Models Management

### Purpose
Cho admin thay đổi model config per capability mà không cần deploy code.

### Required Fields
```
ModelConfig:
  capability: cv_parsing | cv_jd_matching | question_generation | interview_chat | scoring | voice_stt
  provider: openai | google | deepgram | simli
  modelId: string (gpt-4o, gemini-pro, etc.)
  environment: staging | production
  status: active | inactive
  config: { temperature, maxTokens, topP }
  lastChangedBy: string
  lastChangedAt: datetime
```

### Backend Required: `GET /admin/ai/models`, `PATCH /admin/ai/models/{capability}`

### Security: Model config change phải trigger audit log entry

### Priority: **P1**

---

## 16. Prompt Management

**P0 nếu system đang dùng AI production prompts.**

### Target Route: `/admin/ai/prompts`

### Prompt Model
```
Prompt:
  id
  name: "cv_parsing_system" | "question_generation" | etc.
  capability: enum
  version: semver (1.0.0, 1.1.0, ...)
  environment: draft | staging | production
  status: active | deprecated
  systemPrompt: text
  template: text (với {{variables}})
  variables: string[]
  outputSchema: JSON Schema
  modelConfig: ModelConfig ref
  createdBy, updatedBy
  createdAt, updatedAt
```

### Workflow
```
Draft (edit freely)
  → Evaluate (run against dataset)
  → Review (human approval)
  → Promote to Staging
  → Promote to Production
  → Rollback available
```

### Version History
- Diff view giữa 2 versions
- Linked Langfuse experiment (nếu có)
- Audit log: who changed, when, what

### Rules
- KHÔNG edit production prompt trực tiếp
- Mọi thay đổi đi qua workflow
- Rollback = promote version cũ lên production

### Backend Required
- `GET /admin/ai/prompts` (list)
- `POST /admin/ai/prompts` (create draft)
- `PATCH /admin/ai/prompts/{id}` (edit draft)
- `GET /admin/ai/prompts/{id}/versions`
- `POST /admin/ai/prompts/{id}/versions/{v}/promote` (staging/production)
- `POST /admin/ai/prompts/{id}/versions/{v}/rollback`

### Frontend Required
- Prompt editor (Monaco or CodeMirror for system prompt)
- Variable highlighting
- Version comparison diff
- Workflow status indicator
- Linked experiment button

### Priority: **P1**

---

## 17. Tracing

### Architecture (As decided in observability doc)

```
BE (FastAPI + Celery)
    │ langfuse-sdk
    ▼
Langfuse Server
    │ Langfuse REST API
    ▼
INTERVIA Admin (summary)  →  Link to →  Langfuse UI (deep trace)
```

### INTERVIA Admin shows (summary only)
- Trace ID (truncated), Feature, Model, Latency, Status, Timestamp
- Click → Langfuse deep link (no re-implementation)

### Empty State
> "No AI traces yet. Make sure Langfuse is connected and your AI backend is instrumented."

### Priority: **P1** (after Langfuse integration)

---

## 18. Cost / Tokens / Latency

### Data Source: Langfuse API aggregation

### Metrics Required
- **Latency**: p50, p95 (not just avg)
- **Tokens**: total_prompt + total_completion per feature
- **Cost**: estimated from pricing table (admin-configured per model)
- **Breakdown**: by feature, by model, by date

### Charts
- Line chart: daily usage (7d, 30d)
- Bar chart: by feature
- Table: by model with cost per run

### Warning
> Cost display only enabled if admin has configured pricing for each model.

### Priority: **P1**

---

## 19. AI Errors

### Error Categories (potential – do not claim they currently exist)
- `timeout` – provider response timeout
- `rate_limit` – 429 from provider
- `provider_5xx` – provider server error
- `invalid_json` – model returned non-parseable JSON
- `schema_parsing` – output didn't match expected schema
- `context_too_long` – input exceeded model context window
- `retrieval_failure` – KB/RAG retrieval failed

### UI
- Filter by error type, provider, feature, date range
- Error count trend chart
- "Example trace" → link to Langfuse

### Priority: **P1**

---

## 20. Evaluation Module

**Goal**: Trả lời "AI có tốt hơn hay tệ hơn sau mỗi thay đổi?"

```
Datasets → Experiments → Evaluators → Results → Regression
```

---

## 21. Datasets

### Purpose
Tập hợp test cases để chạy offline evaluation.

### Dataset Types
1. **Golden Dataset**: Curated, human-reviewed, ground truth labels → không thay đổi tùy tiện
2. **Production Sample**: Sampled from real sessions (anonymized) → rolling dataset

### Fields
```
Dataset:
  id
  name
  feature: cv_parsing | question_generation | scoring | etc.
  version: 1.0.0, 1.1.0
  caseCount: number
  status: draft | reviewed | approved
  isGolden: boolean
  updatedBy, updatedAt
```

### Lifecycle
```
Draft → Reviewed (human review all cases) → Approved (can be used in experiments)
```

### Case Format (example for question generation)
```json
{
  "input": { "position": "Backend Engineer", "language": "en" },
  "expected": { "questions": [...], "minCount": 5 },
  "metadata": { "difficulty": "mid", "source": "human" }
}
```

### Priority: **P2**

---

## 22. Experiments

### Purpose
Compare 2+ variants (prompt, model, rubric) against same dataset.

### Experiment Model
```
Experiment:
  id
  name
  variants: [
    { name: "variant_a", promptId, promptVersion, modelConfig },
    { name: "variant_b", promptId, promptVersion, modelConfig }
  ]
  datasetId
  datasetVersion
  status: running | completed | failed
  metrics: { accuracy, avgScore, p50latency, p95latency, tokenUsage }
  createdBy, createdAt
```

### UI
- Experiment list with status
- Detail: variant comparison table
- Per-case: input, expected output, actual output A vs B
- Metric comparison: accuracy, latency, cost

### Priority: **P2**

---

## 23. Evaluators

### Types Planned

| Type | Method | Use Case |
|---|---|---|
| Rule-based | Code logic | Schema validation, format check |
| Exact Match | String comparison | Structured outputs |
| LLM-as-Judge | AI call | Free-text quality |
| Human Review | Manual | Golden dataset cases |

**Note**: Do not implement actual evaluators in this planning phase.

### Priority: **P2**

---

## 24. Regression

### Purpose
Phát hiện version mới làm tệ hơn version cũ.

### UI
| Case | Previous Result | Current Result | Delta | Failure Reason | Review |
|---|---|---|---|---|---|
| Case 001 | Pass | Fail | -15% | schema_mismatch | Pending |
| Case 002 | Pass | Pass | 0% | — | — |

### Trigger: Chạy sau mỗi experiment so với baseline experiment

### Priority: **P2**

---

## 25. Production Quality

### Concept
Monitor quality of live AI responses (online evaluation).

### Mechanism
1. Sample N% of production traces
2. Run automated evaluators (LLM-as-judge) on sampled traces
3. Score → store in Langfuse
4. Dashboard: daily quality score, degradation alert

### Alert
> "Production quality score dropped below threshold. Review recent traces."

### Priority: **P2** (requires Langfuse + evaluator infra first)

---

## 26. LangSmith vs Langfuse

### Quick Summary

| | Langfuse Self-host | LangSmith Cloud |
|---|---|---|
| Data Privacy | ✅ Full | ❌ Data on US servers |
| Cost | ✅ Free | 🟡 Limited free tier |
| Self-host | ✅ Docker | ❌ Enterprise only |
| Prompt management | ✅ Built-in | ✅ Prompt Hub |
| Evaluation | ✅ Datasets + runs | ✅ |
| Setup | 🟡 Medium (Docker) | 🟢 Easy |
| Thesis fit | ✅ Excellent | 🟡 Data concern |

Full analysis: [`AI_OBSERVABILITY_OPTIONS.md`](./AI_OBSERVABILITY_OPTIONS.md)

---

## 27. Recommended Observability Architecture

```
INTERVIA Backend (FastAPI)
        │
        │  langfuse Python SDK
        │  (instrument all AI calls)
        ▼
   Langfuse Server (Docker self-hosted)
        │
        ├── Prompt Management
        ├── Trace Storage  
        ├── Evaluation Datasets
        └── Experiments
              │
              │  Langfuse REST API (aggregation)
              ▼
     INTERVIA Admin FE
     (Summary metrics only)
              │
              │  Deep link
              ▼
     Langfuse UI (engineering tool)
```

**Recommendation: Langfuse Self-hosted**
**Confidence: HIGH**

---

## 28. Audit Logs

### Purpose
Track significant admin actions for accountability.

### Events to Capture

| Event | Priority |
|---|---|
| Prompt promoted to production | P0 |
| Model config changed | P0 |
| User role changed | P1 |
| Job Profile deleted | P1 |
| Dataset approved | P1 |
| Knowledge Base document deleted | P1 |
| Rubric updated | P2 |

### Fields
```
AuditLog:
  id
  action: string (enum)
  actorId: string
  actorEmail: string
  resourceType: "prompt" | "model" | "user" | "session" | ...
  resourceId: string
  before: JSON (snapshot)
  after: JSON (snapshot)
  ip: string
  timestamp: datetime
```

### Backend Required: `GET /admin/audit-logs?action=&actor=&from=&to=&cursor=`

### Privacy: `before/after` JSON phải redact CV content, prompt raw text (view tiết trong Langfuse)

### Priority: **P1**

---

## 29. Security & Privacy

### Admin Route Security
- **Required**: Next.js `middleware.ts` checking `AuthProfile.role === "ADMIN"` + redirect to `/login` if not
- Current state: No guard exists

### Data Privacy

| Data Type | Risk | Mitigation |
|---|---|---|
| CV content | High – personal PII | Never expose in trace payload in UI; requires explicit decrypt |
| Interview answers | High | Collapsed/redacted in trace view |
| Prompts | Medium | Gate behind prompt role |
| API Keys / tokens | Critical | Server-side only, never in FE |
| OAuth tokens | Critical | Server-side only |

### Trace Payload Policy
- Raw trace content collapsed by default in INTERVIA Admin
- Click-to-expand requires explicit permission
- Deep trace with full payload: Langfuse UI only
- Langfuse admin access gated separately

### Cookie / Auth
- Admin uses same auth cookie as user panel
- Authorization check: BE validates `role=ADMIN` on all `/admin/*` BE routes

### Priority: **P0**

---

## 30. RBAC

### Current State
- No middleware guard
- `roleLabel` hardcoded string "Senior Admin"
- `AuthProfile.role` field exists in type but unused in routing

### Proposed Roles

| Role | Access |
|---|---|
| `ADMIN` | Full admin panel |
| `CONTENT_ADMIN` | Job Profiles, Knowledge Base, Question Bank, Rubrics |
| `AI_OPS` | AI Operations, Prompts, Models, Traces |
| `REVIEWER` | Evaluation, Experiments, Dataset approval |
| `CANDIDATE` | User panel only |

### Implementation Approach
1. `middleware.ts`: Check `role` cookie/header → redirect
2. BE: Enforce role on all admin endpoints
3. FE: Hide nav items based on role (defense-in-depth only)

### Note
`FUTURE` – Current scope only supports `ADMIN` role check.

---

## 31. UI/UX Direction

### Brand Colors (INTERVIA)
```css
--primary: #204195;
--secondary: #FCB625;
--dark-navy: #14244B;
--slate: #607096;
--light-blue: #DCE4F3;
--bg-light: #F7F9FD;
--bg-lighter: #EEF3FC;
```

### Admin Design Principles
- **Dense, not sparse**: Tables, not cards for data-heavy views
- **No marketing elements**: No mascot, no hero, no excessive gradients
- **Consistent sidebar**: Single shared `AdminShell` layout (not per-page)
- **Status clarity**: Clear badges for PLACEHOLDER/real data distinction during migration
- **Action confirmation**: Destructive actions need confirmation modals

### Table Pattern (Standard)
```
[Search bar]  [Filter dropdowns]  [Status tabs]         [Primary Action btn]
─────────────────────────────────────────────────────────
| Col 1 | Col 2 | Col 3 | Status | Actions |
─────────────────────────────────────────────────────────
| ...   | ...   | ...   | badge  | [Edit] [Delete] |
Pagination: ← 1 2 3 ... → "Showing 1-24 of 142"
```

### Empty States
Every module must define:
- **Loading**: Skeleton rows
- **Empty**: Descriptive empty state with action button
- **Error**: Error message + retry
- **Backend Required**: Visible banner "This feature requires backend implementation"

Examples:
> "No interview sessions yet. Sessions will appear here after candidates complete interviews."
> "AI tracing is not connected. Deploy Langfuse and configure the SDK to enable this view."
> "No experiments have been run yet. Start by creating a dataset and running your first experiment."

---

## 32. Backend Gaps

Full detail: [`ADMIN_BACKEND_GAPS.md`](./ADMIN_BACKEND_GAPS.md)

### Summary of Critical Missing APIs

| Priority | Missing API |
|---|---|
| P0 | Admin role guard on all `/admin/*` BE routes |
| P0 | `GET /admin/overview` – dashboard metrics |
| P1 | `GET /admin/users` – user list |
| P1 | `GET/PATCH /admin/users/{id}` – user detail + role |
| P1 | `GET /admin/sessions` – admin-scoped session list |
| P1 | `GET /admin/sessions/{id}` – session detail + transcript |
| P1 | `GET/POST/PATCH /admin/ai/prompts` – prompt management |
| P1 | `GET/PATCH /admin/ai/models/{capability}` – model config |
| P1 | `GET /admin/audit-logs` – audit trail |
| P1 | Langfuse SDK integration in BE |

---

## 33. Dependency Matrix

| Feature | FE | BE | DB | Observability | Notes |
|---|:---:|:---:|:---:|:---:|---|
| Admin Role Guard | Required | Required | — | — | middleware.ts + BE middleware |
| Dashboard Metrics | Required | Required | — | Optional | `/admin/overview` BE endpoint |
| User Management | Required | Required | — | — | New BE endpoints |
| Sessions (Admin) | Required | Required | — | — | New admin-scoped query |
| Question Bank | Required | Required | Required | — | New schema + endpoints |
| Rubrics | Required | Required | Required | — | New schema + endpoints |
| Prompt Management | Required | Required | Required | Optional | New schema + CRUD |
| Prompt Versioning | Required | Required | Required | Optional | Version history in DB |
| AI Traces (Summary) | Required | Integration | Optional | **Required** | Langfuse |
| Token/Cost/Latency | Required | Integration | — | **Required** | Langfuse |
| AI Errors | Required | Integration | — | **Required** | Langfuse |
| Evaluation Datasets | Required | Required | Required | Optional | Langfuse + BE |
| Experiments | Required | Required | Required | **Required** | Langfuse |
| Regression | Required | Required | — | **Required** | Langfuse |
| Audit Logs | Required | Required | Required | — | New schema + endpoints |
| Job Profiles | ✅ Done | ✅ Done | ✅ Done | — | Working |
| Knowledge Base | ✅ Done | ✅ Done | ✅ Done | — | Working |

---

## 34. Priorities

### P0 (Needed for usable admin / security)
- Admin role guard (middleware.ts)
- Unified AdminShell layout (fix sidebar inconsistency)
- Remove/label all mock data
- Wire `/admin/profile` save to `PATCH /users/me`
- Admin route guard in BE

### P1 (Important operational enhancement)
- Dashboard: real overview metrics
- User Management (list, detail, role change)
- Sessions (admin-scoped, list + detail)
- AI Prompts management + versioning
- AI Models config
- Langfuse integration (BE SDK)
- Trace summary view
- Usage & Cost dashboard (p50/p95)
- Audit Logs
- Insights: replace mock with real product analytics

### P2 (Nice improvement)
- Question Bank
- Rubrics
- Evaluation Datasets
- Evaluation Experiments
- Evaluators
- Regression detection
- Production Quality monitoring
- User suspend/ban

### DEFER
- Eye contact / emotion recognition (not supported by BE, not in scope)
- Real-time simulation management (Interviews page FAB)
- Billing management
- Multi-tenant organization management

---

## 35. Implementation Phases

Full checklist: [`ADMIN_IMPLEMENTATION_CHECKLIST.md`](../plans/ADMIN_IMPLEMENTATION_CHECKLIST.md)

### PHASE 0 – Architecture & Data Contracts | Complexity: M
**Goal**: Align on contracts before building
- Finalize IA and routes
- Define missing BE API contracts
- Select Langfuse / LangSmith
- Design admin CSS design system

### PHASE 1 – Admin Shell + Existing Content | Complexity: M
**Goal**: Fix inconsistency, secure admin, wire profile
- Unified AdminShell (replace 2-sidebar problem)
- Admin role guard middleware
- Wire Profile save
- Label remaining mock pages as "Coming Soon"
- Remove dead links

### PHASE 2 – Interview Sessions + Basic Settings | Complexity: L
**Goal**: Real data for sessions page
- BE: admin-scoped sessions endpoints
- FE: Real interviews table + session detail

### PHASE 3 – Users + Content | Complexity: L
**Goal**: People management
- BE: admin users endpoints
- FE: User management
- FE: Question Bank (if BE ready)
- FE: Rubrics (if BE ready)

### PHASE 4 – AI Operations Overview + Insights | Complexity: M
**Goal**: Real product metrics
- BE: overview endpoint
- FE: Real dashboard
- FE: Real insights (replace mock)
- Langfuse integration start (Gate C must pass)

### PHASE 5 – Prompt + Model Management | Complexity: XL
**Goal**: AI engineering control
- BE: Prompt CRUD + versioning
- BE: Model config endpoints
- FE: Prompt management UI (editor, diff, workflow)
- FE: Model config table

### PHASE 6 – Tracing (Langfuse) | Complexity: L (FE) / XL (BE integration)
**Goal**: Observability visibility in Admin
- BE: Full Langfuse SDK instrumentation
- FE: Trace summary table
- FE: Usage & Cost dashboard
- FE: Error log

### PHASE 7 – Evaluation Datasets | Complexity: L
**Goal**: Offline eval foundation
- BE: Dataset CRUD
- FE: Dataset management

### PHASE 8 – Experiments + Regression | Complexity: XL
**Goal**: Know if AI improved or regressed
- BE: Experiment run + results
- FE: Experiment comparison UI
- FE: Regression table

### PHASE 9 – Audit Logs + Security Hardening | Complexity: M
**Goal**: Accountability + security
- BE: Audit log storage
- FE: Audit log viewer
- Admin RBAC refinement

---

## 36. Approval Gates

| Gate | Condition |
|---|---|
| **GATE A** | Admin IA approved by product owner |
| **GATE B** | Missing BE API contracts confirmed by BE team |
| **GATE C** | Observability provider selected (Langfuse vs LangSmith decision) |
| **GATE D** | AI Ops MVP scope approved (what's shown in Admin vs Langfuse UI) |
| **GATE E** | Evaluation MVP scope approved (datasets + experiments only?) |
| **GATE F** | Production security requirements approved (data redaction, RBAC) |

---

## 37. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| BE không có bandwidth implement missing APIs | High | High | Phân chia phase, prioritize P0/P1 only |
| Langfuse Docker infra chưa sẵn | Medium | High | Start with mock Langfuse data in FE |
| Prompt management scope quá lớn cho thesis | Medium | Medium | Simplify: no workflow, basic CRUD + version only |
| Admin role guard bypass (security) | Low | Critical | Must implement P0 |
| Mock data bị nhầm là real data | Current | Medium | Label tất cả mock pages clearly |
| KnowledgeBaseClient quá lớn (90KB) | Current | Low | Monitor perf, defer refactor |

---

## 38. Open Questions

1. **Langfuse**: Backend đang dùng LangChain hay gọi OpenAI SDK trực tiếp? (affects integration approach)
2. **Docker infra**: Langfuse self-host yêu cầu Docker. Server có support Docker không?
3. **Data sovereignty**: Có yêu cầu data ở VN server không? (affects LangSmith eligibility)
4. **Question Bank**: BE có kế hoạch implement không, hay Admin tự tạo schema mới?
5. **Rubrics**: Rubric logic hiện tại có trong prompt không? Hay trong BE scoring code?
6. **Prompt Versioning scope**: Cần workflow phức tạp (Draft → Evaluate → Promote) hay CRUD đơn giản với version number?
7. **Admin sidebar**: Giữ 2 sidebars hay unify? Cần thiết kế lại hoàn toàn không?
8. **Sessions Admin scope**: Chỉ xem được sessions của user hiện tại, hay tất cả users?

---

## 39. Decisions Required From Product Owner

1. **Observability Tool**: Approve Langfuse self-hosted? Hay chọn LangSmith?
2. **Phase Priority**: Bắt đầu từ Phase 1 (shell fix) hay Phase 2 (sessions)?
3. **Prompt Management depth**: Full workflow (Draft→Promote) hay basic CRUD + version number?
4. **Evaluation scope for thesis**: Có cần Datasets/Experiments không, hay AI Ops overview là đủ?
5. **User Management**: Có cần ban/suspend user không trong MVP?
6. **Sidebar redesign**: Unify sidebar ngay Phase 1 hay để sau?
7. **Mock data pages**: Giữ current design nhưng gắn "PLACEHOLDER" banner, hay remove và rebuild?

---

## 40. Approval Status

```
╔═══════════════════════════════════════════════════════╗
║         IMPLEMENTATION STATUS: NOT STARTED            ║
║                                                       ║
║      WAITING FOR USER APPROVAL                        ║
║                                                       ║
║  DO NOT IMPLEMENT UNTIL APPROVED                      ║
╚═══════════════════════════════════════════════════════╝
```
