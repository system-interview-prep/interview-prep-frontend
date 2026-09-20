# ADMIN BACKEND GAPS & INTEGRATION STATUS

_Source of truth: Backend module routers in `d:\KLTN\interview-prep-core\src\modules\`_  
_Last Updated: 2026-09-20 (Post-Implementation Audit)_

---

## 1. Backend Capability Matrix (Current Implementation)

| Capability | Existing BE API | FE Admin Route / Consumer | Status |
|---|---|---|---|
| **Admin Overview Dashboard** | `GET /admin/overview` | `/admin/dashboard`, `/admin/insights` | ✅ CONNECTED (Real PostgreSQL metrics) |
| **Sessions Management** | `GET /admin/sessions` | `/admin/interviews` | ✅ CONNECTED (Search & mode filter) |
| **Job Descriptions CRUD** | `GET/POST/PATCH/DELETE /admin/job-descriptions` | `/admin/job-profiles`, `/admin/job-profiles/[id]` | ✅ CONNECTED |
| **JD Upload & Parse** | `POST/GET/PATCH/POST /admin/job-descriptions/uploads/*` | `/admin/job-profiles/create` | ✅ CONNECTED |
| **JD Upload SSE** | `GET /admin/job-descriptions/uploads/{id}/events` | `/admin/job-profiles/create` | ✅ CONNECTED |
| **Job Categories** | `GET /admin/job-categories` | `/admin/job-profiles/categories` | ✅ CONNECTED (Read-only) |
| **Taxonomy Concepts** | `GET/PUT/POST /admin/taxonomy/*` | `/admin/job-profiles/create` | ✅ CONNECTED |
| **Knowledge Base (RAG)** | KB REST + WebSocket | `/admin/knowledge-base` | ✅ CONNECTED |
| **Admin Profile** | `GET/PATCH /users/me` | `/admin/profile` | ✅ CONNECTED |
| **User Management** | None | `/admin/users` | ❌ BACKEND REQUIRED (`GET /admin/users`) |
| **User Detail** | None | `/admin/users/[id]` | ❌ BACKEND REQUIRED (`GET /admin/users/{id}`) |
| **Question Bank** | None | `/admin/question-bank` | ❌ BACKEND REQUIRED (`GET /admin/questions`) |
| **Question Detail** | None | `/admin/question-bank/[id]` | ❌ BACKEND REQUIRED (`GET /admin/questions/{id}`) |
| **Rubrics Management** | None | `/admin/rubrics` | ❌ BACKEND REQUIRED (`GET /admin/rubrics`) |
| **Rubric Detail** | None | `/admin/rubrics/[id]` | ❌ BACKEND REQUIRED (`GET /admin/rubrics/{id}`) |
| **AI Model Config Editing** | None (Static Registry) | `/admin/ai/models` | ❌ BACKEND REQUIRED FOR EDITING |
| **AI Prompts Management** | None | `/admin/ai/prompts` | ❌ BACKEND REQUIRED (`GET /admin/ai/prompts`) |
| **Prompt Detail & Versions** | None | `/admin/ai/prompts/[id]` | ❌ BACKEND REQUIRED (`GET /admin/ai/prompts/{id}/versions`) |
| **AI Traces (Proxy)** | None | `/admin/ai/traces` | ❌ OBSERVABILITY NOT CONNECTED (Langfuse proxy needed) |
| **Token / Cost Usage** | None | `/admin/ai/usage` | ❌ OBSERVABILITY NOT CONNECTED (Langfuse proxy needed) |
| **AI Error Logs** | None | `/admin/ai/errors` | ❌ OBSERVABILITY NOT CONNECTED (Langfuse proxy needed) |
| **Evaluation Overview** | None | `/admin/evaluation` | ❌ BACKEND REQUIRED |
| **Evaluation Datasets** | None | `/admin/evaluation/datasets` | ❌ BACKEND REQUIRED (`GET /admin/eval/datasets`) |
| **Evaluation Experiments** | None | `/admin/evaluation/experiments` | ❌ BACKEND REQUIRED (`GET /admin/eval/experiments`) |
| **Evaluation Regression** | None | `/admin/evaluation/regression` | ❌ BACKEND REQUIRED |
| **Audit Logs** | None | `/admin/audit-logs` | ❌ BACKEND REQUIRED (`GET /admin/audit-logs`) |

---

## 2. Gap Specification & Required Contracts

### 2.1 User Management
- **Endpoint**: `GET /admin/users`
- **Method**: GET
- **Auth**: `require_admin`
- **Params**: `page`, `limit`, `search`, `role` (`ADMIN` | `CANDIDATE` | `USER`), `status`
- **Output**: `{ items: UserSummaryItem[], total: number }`
- **Why Needed**: Cho phép quản trị viên tra cứu tài khoản, phân quyền và kiểm soát người dùng nền tảng.

### 2.2 Question Bank
- **Endpoint**: `GET /admin/questions`
- **Method**: GET
- **Auth**: `require_admin`
- **Params**: `difficulty`, `question_type`, `job_family`, `search`, `limit`, `offset`
- **Output**: `{ items: QuestionBankItem[], total: number }`
- **Why Needed**: Chuẩn hóa kho câu hỏi dùng cho phỏng vấn và benchmark AI.

### 2.3 Rubrics Management
- **Endpoint**: `GET /admin/rubrics`
- **Method**: GET
- **Auth**: `require_admin`
- **Output**: `{ items: RubricItem[], total: number }`
- **Why Needed**: Quản lý thang đo năng lực và tiêu chí chấm điểm tự động.

### 2.4 AI Prompt Management & Versioning
- **Endpoint**: `GET /admin/ai/prompts`, `GET /admin/ai/prompts/{id}/versions`
- **Method**: GET, POST
- **Auth**: `require_admin`
- **Why Needed**: Đảm bảo quy trình promote an toàn (Draft → Benchmark → Approval → Production), không sửa đè trực tiếp trên production.

### 2.5 Observability Integration (Langfuse / LangSmith Proxy)
- **Endpoints**:
  - `GET /admin/ai/traces`: Lấy tóm tắt danh sách traces (Latency, tokens, cost, status).
  - `GET /admin/ai/usage`: Dữ liệu phân bổ tokens, chi phí và độ trễ p50/p95.
  - `GET /admin/ai/errors`: Gom cụm các exceptions từ LLM Gateway.
- **Security Constraint**: Secret key của Langfuse/LangSmith lưu tại backend `.env`, browser chỉ nhận dữ liệu đã được sanitize qua backend proxy.

### 2.6 Audit Logs
- **Endpoint**: `GET /admin/audit-logs`
- **Method**: GET
- **Auth**: `require_admin`
- **Params**: `action`, `actor`, `limit`, `offset`
- **Why Needed**: Truy vết các thao tác thay đổi cấu hình nhạy cảm.
