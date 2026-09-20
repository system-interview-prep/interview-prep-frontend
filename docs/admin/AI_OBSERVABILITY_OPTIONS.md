# AI OBSERVABILITY OPTIONS

_Task: Select observability layer for INTERVIA AI Backend_
_Audited: 2026-09-20_

---

## Context

INTERVIA sử dụng nhiều AI capabilities:
- CV parsing (Celery background jobs)
- CV-JD Matching
- Interview conversation (chat, voice, video)
- Interview question generation
- Voice-to-text (Deepgram/similar)
- Video call AI (Simli)

Hiện tại **không có observability layer nào** trong codebase (không có LangSmith, Langfuse, OpenTelemetry, hay custom tracing).

---

## Options Evaluated

### Option 1: Langfuse (Self-hosted)

**What it is**: Open-source LLM observability platform. Self-host available.

| Criterion | Assessment |
|---|---|
| Tracing | ✅ Full span tracing, nested traces, latency |
| Prompt Versioning | ✅ First-class support – prompt CMS built-in |
| Datasets | ✅ Dataset management for eval |
| Offline Evaluation | ✅ Run evals against datasets |
| Online Evaluation | ✅ Score live traces |
| Latency (p50/p95) | ✅ Available in dashboard |
| Token Usage | ✅ Per-model, per-feature |
| Cost | ✅ With pricing config |
| Error Analysis | ✅ Failed traces filterable |
| Self-host | ✅ Docker Compose or Kubernetes |
| Data Control | ✅ Full – data stays on your servers |
| Setup Effort | 🟡 Medium – Docker + SDK integration |
| Frontend Integration | ✅ Can embed public traces link |
| Backend Integration | ✅ Python SDK (`langfuse`) |
| Deployment Complexity | 🟡 Medium |
| Thesis/Project Suitability | ✅ Very suitable – open source, no credit card |
| Production Path | ✅ Can migrate to Langfuse Cloud |
| Prompt Management | ✅ Best-in-class for self-hosted |
| **Cost (self-hosted)** | **FREE** |

**Pros**: Open source, full data control, prompt management, evaluation datasets, suitable for thesis
**Cons**: Requires Docker infra; smaller community than LangSmith

---

### Option 2: LangSmith (Cloud)

**What it is**: LangChain's observability + evaluation platform. Cloud-first.

| Criterion | Assessment |
|---|---|
| Tracing | ✅ Excellent – auto-trace LangChain |
| Prompt Versioning | ✅ Prompt Hub |
| Datasets | ✅ |
| Offline Evaluation | ✅ |
| Online Evaluation | ✅ |
| Latency (p50/p95) | ✅ |
| Token Usage | ✅ |
| Cost | ✅ (requires pricing setup) |
| Error Analysis | ✅ |
| Self-host | ❌ Only on Enterprise plan |
| Data Control | ❌ Data on LangChain servers (US) |
| Setup Effort | 🟢 Low – API key only |
| Frontend Integration | 🟡 Via share link |
| Backend Integration | ✅ Python SDK (`langsmith`) |
| Deployment Complexity | 🟢 Low |
| Thesis/Project Suitability | 🟡 Free tier limited; data privacy concern |
| Production Path | 🟡 Vendor lock-in |
| **Cost (free tier)** | **5K traces/month** |

**Pros**: Easiest setup, best for LangChain-based apps
**Cons**: Data leaves your server; free tier limited; vendor lock-in; not self-hostable without Enterprise

---

### Option 3: Custom Minimal Tracing

**What it is**: Tự implement logging + metrics trong BE (Python + DB).

| Criterion | Assessment |
|---|---|
| Tracing | 🟡 Basic (log-level, no spans) |
| Prompt Versioning | ❌ Must build from scratch |
| Datasets | ❌ Must build from scratch |
| Evaluation | ❌ Must build from scratch |
| Latency (p50/p95) | 🟡 Possible via DB aggregation |
| Token Usage | 🟡 Parse from OpenAI response |
| Cost | ❌ Must calculate manually |
| Self-host | ✅ |
| Data Control | ✅ |
| Setup Effort | 🔴 Very high (months of dev) |
| Deployment Complexity | 🟢 Low (same infra) |
| Thesis/Project Suitability | ❌ Too much scope |
| **Cost** | **Dev time only** |

**Pros**: Full control, no external dependency
**Cons**: Extremely high development cost; reinventing the wheel; not suitable for thesis scope

---

### Option 4: No Observability Tool

**What it is**: Chỉ dùng `print()`/Python logging → stdout.

| Criterion | Assessment |
|---|---|
| Tracing | ❌ None |
| Prompt Versioning | ❌ None |
| Datasets/Eval | ❌ None |
| Latency | ❌ None |
| Token/Cost | ❌ None |
| Setup Effort | 🟢 Zero |
| Suitability | ❌ Not viable for AI product ops |

**Suitable for**: MVP demo only. Not for any production or evaluation claim.

---

## Comparison Matrix

| Criterion | Langfuse Self-host | LangSmith Cloud | Custom | None |
|---|:---:|:---:|:---:|:---:|
| Tracing | ✅ | ✅ | 🟡 | ❌ |
| Prompt versioning | ✅ | ✅ | ❌ | ❌ |
| Datasets | ✅ | ✅ | ❌ | ❌ |
| Evaluation | ✅ | ✅ | ❌ | ❌ |
| p50/p95 latency | ✅ | ✅ | 🟡 | ❌ |
| Token/cost | ✅ | ✅ | 🟡 | ❌ |
| Self-host | ✅ | ❌ | ✅ | — |
| Data privacy | ✅ | ❌ | ✅ | — |
| Setup effort | 🟡 | 🟢 | 🔴 | — |
| Free for thesis | ✅ | 🟡 | ✅ | — |
| FE integration | ✅ | 🟡 | 🟡 | — |

---

## Recommended Option

### ✅ RECOMMENDATION: **Langfuse (Self-hosted)**

**Confidence: HIGH**

**Rationale**:

1. **INTERVIA BE là Python/FastAPI** – không phải LangChain-only → LangSmith mất lợi thế chính
2. **Data Privacy**: CV và interview answers là sensitive data – không nên để trên LangChain server US
3. **Thesis suitability**: Langfuse open-source, Docker Compose, hoàn toàn miễn phí
4. **Prompt Management**: Langfuse có prompt CMS tốt nhất trong open-source stack
5. **Evaluation**: Datasets + experiments built-in – phù hợp nghiên cứu luận văn
6. **INTERVIA Admin layer**: Admin dashboard FE chỉ cần hiển thị **summary metrics** từ Langfuse API, deep debugging vẫn trong Langfuse UI

### Architecture Proposal

```
INTERVIA Backend (FastAPI + Celery)
        │
        │  langfuse Python SDK
        │  (trace, score, dataset)
        ▼
   Langfuse Server (Docker)
        │
        ├── Prompt Management
        ├── Trace Storage
        ├── Evaluation Datasets
        ├── Experiment Results
        └── Cost/Token/Latency
              │
              │  Langfuse REST API
              ▼
     INTERVIA Admin FE
     (Summary dashboard only)
              │
              │  link to
              ▼
     Langfuse UI (deep debug)
```

**INTERVIA Admin** hiển thị:
- Tổng runs / success rate (last 7d)
- p50/p95 latency (tổng hợp)
- Token usage / cost estimate
- Failed runs count + link to Langfuse
- Evaluation score trends

**Langfuse UI** xử lý:
- Span timeline per trace
- Prompt diff và version history
- Dataset management
- Experiment comparisons
- Raw trace inspection

---

## Decision Status

**DECISION PENDING USER APPROVAL**

Cần confirm:
1. Có Docker infrastructure trên server không?
2. Đang dùng LangChain hay gọi OpenAI SDK trực tiếp?
3. Có yêu cầu data sovereignty không (VN regulation)?
