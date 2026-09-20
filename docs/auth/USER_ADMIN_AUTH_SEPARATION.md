# USER & ADMIN AUTHENTICATION SEPARATION

_Document Version: 1.0.0_  
_Date: 2026-09-20_  
_Project: INTERVIA Frontend_

---

## 1. Architectural Overview

INTERVIA uses a **single, unified backend authentication system** (`POST /auth/login`, `POST /auth/register`, `POST /auth/google`) paired with **dedicated frontend entrypoints and route guards** tailored to specific personas:

```
                          CORE BACKEND
                               │
                       POST /auth/login
                               │
                         JWT / SESSION
                               │
                ┌──────────────┴──────────────┐
                │                             │
         USER / CANDIDATE               ADMINISTRATOR
                │                             │
          Route: /login              Route: /admin/login
          Route: /signup             (No signup allowed)
                │                             │
                ▼                             ▼
        /dashboard (User)             /admin/dashboard (Admin)
```

---

## 2. Route Matrix

| Route | Persona | Form Component | Design Characteristics | Access Level |
|---|---|---|---|---|
| `/login` | Candidate / User | `UserAuthentication` | Interactive, brand artwork, Google OAuth, switchable signup tab | Public |
| `/signup` | Candidate / User | `UserAuthentication` | Multi-step password meter, terms acceptance | Public |
| `/logout` | All | `LogoutPage` | Clears tokens, cookies, Zustand store; redirects | Public |
| `/admin/login` | Administrator | `AdminLoginForm` | Clean, minimal, operational `#204195`, no mascot, no signup | Public / Admin Redirect |
| `/admin/**` | Administrator | Admin Features | Full admin operational dashboard | **ADMIN Only** |
| `/dashboard/**` | Candidate | User Features | User interview workspace | **Authenticated User** |

---

## 3. Shared Auth Architecture

All presentation components share underlying services in `src/features/auth/`:

```
src/features/auth/
├── components/
│   ├── user/
│   │   └── UserAuthentication.tsx   # Candidate login + signup
│   └── admin/
│       └── AdminLoginForm.tsx       # Minimalist admin console login
├── hooks/
│   └── useAuthProfile.ts            # Hydrates profile & reactive listeners
├── services/
│   └── auth.service.ts              # Session persistence, cookies, logout, error parsing
└── types/
    └── auth.types.ts                # TypeScript types (AuthUser, AuthResponse, AuthProfile)
```

### Shared Logic Functions (`src/features/auth/services/auth.service.ts`):
- `completeAuthSession(data: AuthResponse, expectedRole?: "ADMIN" | "USER")`:
  - Enforces `data.user.role === "ADMIN"` when logging into Admin.
  - Persists `accessToken` to `localStorage` and `cookie`.
  - Sets `role` cookie (`admin` or `user`).
  - Writes profile to `localStorage` (`auth.googleProfile`).
  - Updates `useUserStore`.
- `performClientLogout(redirectTo?: string)`:
  - Wipes cookies, local storage keys, and resets Zustand state.
  - Redirects to `/login` for user, `/admin/login` for admin.
- `getAuthErrorMessage(error: unknown, fallback: string)`:
  - Normalizes backend error strings or network exceptions without leaking stack traces.

---

## 4. Role Authorization & Error Handling

When credentials are submitted on `/admin/login`:
1. The request is dispatched to `POST /auth/login`.
2. If authentication succeeds, the returned `user.role` is inspected:
   - If `role === "ADMIN"`: The session is finalized, cookies are set, and the user is redirected to `/admin/dashboard` (or `nextUrl`).
   - If `role !== "ADMIN"`: The session is immediately rejected. The error banner displays:
     > **"Tài khoản này không có quyền truy cập hệ thống quản trị."**
     *(No session or admin cookies are created)*.

---

## 5. Middleware & Route Guards (`src/middleware.ts`)

| Scenario | Requested URL | Auth State | Middleware Action |
|---|---|---|---|
| 1 | `/admin/dashboard` | Unauthenticated | Redirects to `/admin/login?next=/admin/dashboard` |
| 2 | `/admin/dashboard` | User / Candidate | Redirects to `/dashboard` |
| 3 | `/admin/dashboard` | Administrator | Allows request (`NextResponse.next()`) |
| 4 | `/admin/login` | Unauthenticated | Displays Admin Login Form |
| 5 | `/admin/login` | Administrator | Redirects to `/admin/dashboard` (No double login) |
| 6 | `/login` | Administrator | Redirects to `/admin/dashboard` |
| 7 | `/login` | User / Candidate | Redirects to `/dashboard` |

---

## 6. Future RBAC Extensibility

The current implementation uses `role: "ADMIN"`. The `completeAuthSession` and backend `require_admin` architecture easily supports future granular roles:
- `SUPER_ADMIN`
- `CONTENT_ADMIN`
- `AI_OPS_ADMIN`
- `EVALUATION_REVIEWER`
