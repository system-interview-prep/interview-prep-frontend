# ADMIN AUTH & API SECURITY AUDIT

_Document Version: 1.0.0_  
_Date: 2026-09-20_  
_Project: INTERVIA - Technical Graduation Thesis (KLTN)_

---

## 1. Executive Summary

This security audit verifies the separation of User and Admin authentication boundaries across frontend and backend services.

- **Frontend Security Boundary Principle**: The frontend middleware and client-side guards provide **UX navigation and route routing**, but **MUST NEVER** be treated as a security boundary.
- **Backend Security Boundary Principle**: The Core Backend (`interview-prep-core`) must enforce strict JWT token validation and role authorization (`role === "ADMIN"`) on every administrative endpoint.

---

## 2. Server-Side Protection Audit (interview-prep-core)

### 2.1 Security Mechanism
The Core Backend uses FastAPI dependency injection with `require_admin`:

```python
# src/core/security.py
async def require_admin(user: Annotated[dict[str, str], Depends(current_user)]) -> dict[str, str]:
    if user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Yêu cầu quyền quản trị viên."
        )
    return user
```

When an unauthenticated request reaches an admin endpoint, the server responds with `401 Unauthorized`.  
When an authenticated candidate/user without the `ADMIN` role reaches an admin endpoint, the server responds with `403 Forbidden`.

### 2.2 Endpoint Protection Matrix

| Route | Method | Backend Handler | Protected By | Verification Result |
|---|---|---|---|---|
| `/admin/overview` | GET | `src/modules/admin/router.py` | `Depends(require_admin)` | ✅ VERIFIED SECURE |
| `/admin/sessions` | GET | `src/modules/admin/router.py` | `Depends(require_admin)` | ✅ VERIFIED SECURE |
| `/admin/job-descriptions` | GET, POST, PATCH, DELETE | `src/modules/job_descriptions/router.py` | `Depends(require_admin)` | ✅ VERIFIED SECURE |
| `/admin/job-descriptions/uploads/*` | POST, GET, PATCH | `src/modules/job_descriptions/router.py` | `Depends(require_admin)` | ✅ VERIFIED SECURE |
| `/admin/job-categories` | GET | `src/modules/job_categories/router.py` | `Depends(require_admin)` | ✅ VERIFIED SECURE |
| `/admin/taxonomy/*` | GET, PUT, POST | `src/modules/taxonomy/router.py` | `Depends(require_admin)` | ✅ VERIFIED SECURE |

---

## 3. Identified Gaps & Backend Requirements

The following endpoints are currently missing on the backend (documented in [`docs/admin/ADMIN_BACKEND_GAPS.md`](file:///d:/KLTN/interview-prep-frontend/docs/admin/ADMIN_BACKEND_GAPS.md)). When implemented, they **MUST** include `Depends(require_admin)`:

| Missing Capability | Proposed Endpoint | Required Security Guard | Priority |
|---|---|---|---|
| User Management | `GET /admin/users`, `GET /admin/users/{id}` | `require_admin` | **P0** |
| Question Bank | `GET /admin/questions`, `POST /admin/questions` | `require_admin` | **P1** |
| Rubrics System | `GET /admin/rubrics`, `POST /admin/rubrics` | `require_admin` | **P1** |
| AI Prompt Management | `GET /admin/ai/prompts`, `PATCH /admin/ai/prompts/{id}` | `require_admin` | **P1** |
| AI Observability Proxy | `GET /admin/ai/traces`, `GET /admin/ai/usage` | `require_admin` | **P1** |
| Evaluation Datasets | `GET /admin/eval/datasets`, `POST /admin/eval/experiments` | `require_admin` | **P2** |
| Audit Logs | `GET /admin/audit-logs` | `require_admin` | **P0** |

---

## 4. Frontend Security Safeguards

1. **No Client-Side Role Elevation**:
   - `POST /auth/register` hardcodes `role: "CANDIDATE"`.
   - Admin accounts cannot be created via `/signup` or any public form.
2. **Dedicated Route Guard**:
   - `src/middleware.ts` rejects non-admin users attempting to open `/admin/**` and routes them away.
3. **Session Verification**:
   - `AdminLoginForm` performs role checking (`user.role === "ADMIN"`) immediately upon credential authentication.
   - If a candidate attempts to log in at `/admin/login`, the session is rejected with an explicit error message: `"Tài khoản này không có quyền truy cập hệ thống quản trị."`
