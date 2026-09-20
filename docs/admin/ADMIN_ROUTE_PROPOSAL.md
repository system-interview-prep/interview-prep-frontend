# ADMIN ROUTE PROPOSAL

_Status: PLANNING ONLY – Not implemented_
_Audited: 2026-09-20_

---

## Full Route Map

| Route | Purpose | Primary Data | Priority | BE Ready | Phase |
|---|---|---|---|---|---|
| `/admin` | Redirect to dashboard | — | P0 | ✅ | 0 |
| `/admin/dashboard` | Overview metrics + quick access | `GET /admin/overview` (MISSING) | P0 | ❌ | 1 |
| **PEOPLE** |
| `/admin/users` | User listing – search, filter, status | `GET /admin/users` (MISSING) | P1 | ❌ | 3 |
| `/admin/users/[id]` | User detail – CVs, sessions, role | `GET /admin/users/{id}` (MISSING) | P1 | ❌ | 3 |
| **INTERVIEW CONTENT** |
| `/admin/job-profiles` | Job description listing | `GET /admin/job-descriptions` | P0 | ✅ | 1 |
| `/admin/job-profiles/create` | Create / edit JD | `POST/PATCH /admin/job-descriptions` | P0 | ✅ | 1 |
| `/admin/job-profiles/[id]` | JD detail view | `GET /admin/job-descriptions/{id}` | P0 | ✅ | 1 |
| `/admin/job-profiles/categories` | Category listing | `GET /admin/job-categories` | P0 | ✅ | 1 |
| `/admin/question-bank` | Question listing + CRUD | `GET /admin/questions` (MISSING) | P2 | ❌ | 3 |
| `/admin/question-bank/[id]` | Question detail + rubric link | `GET /admin/questions/{id}` (MISSING) | P2 | ❌ | 3 |
| `/admin/rubrics` | Rubric listing + CRUD | `GET /admin/rubrics` (MISSING) | P2 | ❌ | 3 |
| `/admin/rubrics/[id]` | Rubric detail + criteria | `GET /admin/rubrics/{id}` (MISSING) | P2 | ❌ | 3 |
| `/admin/knowledge-base` | KB document management | KB REST + Socket | P0 | ✅ | 1 |
| **INTERVIEWS** |
| `/admin/interviews` | Session listing – filter, search | `GET /admin/sessions` (MISSING) | P1 | ❌ | 2 |
| `/admin/interviews/[id]` | Session detail + transcript + score | `GET /admin/sessions/{id}` (MISSING) | P1 | ❌ | 2 |
| **AI OPERATIONS** |
| `/admin/ai` | AI Ops overview – health, stats | Langfuse API summary | P1 | ❌ (need Langfuse) | 4 |
| `/admin/ai/models` | Model config per capability | `GET /admin/ai/models` (MISSING) | P1 | ❌ | 5 |
| `/admin/ai/prompts` | Prompt listing + versions | `GET /admin/ai/prompts` (MISSING) | P1 | ❌ | 5 |
| `/admin/ai/prompts/[id]` | Prompt detail + version history | `GET /admin/ai/prompts/{id}/versions` (MISSING) | P1 | ❌ | 5 |
| `/admin/ai/traces` | Trace listing (summary) | Langfuse API | P1 | ❌ (need Langfuse) | 6 |
| `/admin/ai/traces/[id]` | Trace detail → redirect to Langfuse | Langfuse deep link | P1 | ❌ (need Langfuse) | 6 |
| `/admin/ai/usage` | Token / cost / latency dashboard | Langfuse API | P1 | ❌ (need Langfuse) | 6 |
| `/admin/ai/errors` | AI error log | Langfuse API | P1 | ❌ (need Langfuse) | 6 |
| **EVALUATION** |
| `/admin/evaluation` | Evaluation overview | Langfuse API | P2 | ❌ (need Langfuse) | 7 |
| `/admin/evaluation/datasets` | Dataset listing + CRUD | Langfuse API + `GET /admin/eval/datasets` | P2 | ❌ | 7 |
| `/admin/evaluation/datasets/[id]` | Dataset detail + cases | Langfuse API | P2 | ❌ | 7 |
| `/admin/evaluation/experiments` | Experiment listing | Langfuse API + `GET /admin/eval/experiments` | P2 | ❌ | 8 |
| `/admin/evaluation/experiments/[id]` | Experiment detail + comparison | Langfuse API | P2 | ❌ | 8 |
| `/admin/evaluation/regression` | Regression detection table | Langfuse API | P2 | ❌ | 8 |
| **ANALYTICS** |
| `/admin/insights` | Product analytics – usage, roles, completion | `GET /admin/overview` (MISSING) | P1 | ❌ | 4 |
| **SYSTEM** |
| `/admin/audit-logs` | Audit event log | `GET /admin/audit-logs` (MISSING) | P1 | ❌ | 9 |
| `/admin/settings` | Admin settings | `GET/PATCH /admin/settings` (MISSING) | P1 | ❌ | 2 |
| `/admin/profile` | Admin personal profile | `GET/PATCH /users/me` | P0 | ✅ | 1 |
| `/admin/help` | Help center | Static | P2 | ✅ | 1 |
