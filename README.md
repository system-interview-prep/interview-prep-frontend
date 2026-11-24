# interview-prep-frontend · INTERVIA

Frontend của hệ thống **INTERVIA** — nền tảng luyện phỏng vấn AI, bao gồm giao diện người dùng, trang phỏng vấn fullscreen, trang admin và trang marketing.

---

## Tính năng chính

| Feature | Mô tả |
|---|---|
| **Auth** | Đăng nhập Google OAuth2, JWT session |
| **Resume** | Upload CV, xem kết quả parse và matching |
| **Interview** | Phòng phỏng vấn fullscreen với voice/video AI |
| **Chat** | Chat AI realtime qua Socket.IO |
| **Dashboard** | Xem lịch sử phiên, kết quả, thống kê cá nhân |
| **Admin** | Quản trị người dùng, phiên, nội dung hệ thống |
| **Marketing** | Landing page, giới thiệu sản phẩm |

---

## Kiến trúc hệ thống

```
Browser
  |
  +-- Next.js App Router (React 19)
  |     +-- (marketing)/       <- Landing page
  |     +-- (auth)/            <- Login, register
  |     +-- (workspace)/       <- Dashboard, resume, notifications
  |     +-- (interview-fullscreen)/  <- Phòng phỏng vấn
  |     +-- admin/             <- Admin panel
  |
  +-- HTTP (axios) ----------> FastAPI backend :5000
  +-- Socket.IO client ------> Socket.IO server :5000
```

**State management:** Zustand
**Animation:** Framer Motion + GSAP
**Rich text:** Lexical editor

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| React | React 19 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| HTTP | Axios |
| Realtime | Socket.IO Client 4 |
| Animation | Framer Motion 13, GSAP 3 |
| Rich Text | Lexical |
| Auth | @react-oauth/google |
| AI Avatar | simli-client |
| PDF Viewer | pdfjs-dist |
| Testing | Vitest 5 |
| Linting | ESLint 9 |
| Package Manager | pnpm |
| Container | Docker (Node 20) |

---

## Cấu trúc thư mục

```
interview-prep-frontend/
+-- src/
|   +-- app/                    # Next.js App Router
|   |   +-- (auth)/             # Login, register pages
|   |   +-- (marketing)/        # Landing page
|   |   +-- (workspace)/        # Dashboard, resume, user pages
|   |   +-- (interview-fullscreen)/  # Interview room
|   |   +-- admin/              # Admin panel
|   +-- features/               # Feature modules
|   |   +-- auth/
|   |   +-- resume/
|   |   +-- interview/
|   |   +-- admin/
|   |   +-- user-dashboard/
|   |   +-- marketing/
|   |   +-- mascot/
|   +-- components/             # Shared UI components
|   +-- hooks/                  # Custom React hooks
|   +-- store/                  # Zustand stores
|   +-- lib/                    # API clients, utilities
|   +-- types/                  # TypeScript type definitions
|   +-- constants/              # App-wide constants
|   +-- i18n/                   # Internationalization
|   +-- theme/                  # Design tokens
|   +-- middleware.ts           # Auth middleware (route protection)
+-- public/                     # Static assets
+-- docs/                       # Internal docs (admin, auth, plans, security, ux)
+-- scripts/                    # Utility scripts
+-- Dockerfile
+-- next.config.ts
+-- vitest.config.mts
+-- .env.local                  # Xem phần Cấu hình .env
```

---

## Yêu cầu môi trường

| Công cụ | Phiên bản |
|---|---|
| Node.js | >= 20.x |
| pnpm | >= 9.x |
| Docker | >= 24.x (nếu chạy container) |

> Backend (interview-prep-core) phải đang chạy tại http://localhost:5000.

---

## Cách cài đặt

`ash
# 1. Clone repo
git clone <repo-url> interview-prep-frontend
cd interview-prep-frontend

# 2. Cài dependencies
pnpm install

# 3. Tạo .env.local
cp .env.example .env.local
# Điền các giá trị vào .env.local
`

---

## Cấu hình .env

Tạo file .env.local. **Không commit API key thật.**

`dotenv
# URL của backend API (interview-prep-core)
NEXT_PUBLIC_API_URL=http://localhost:5000

# URL của Socket.IO server (thường cùng host với API)
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Google OAuth Client ID (lấy từ Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-client-id>
`

---

## Cách chạy project

### Development

`ash
pnpm dev
`

Mở http://localhost:3000 trên trình duyệt.

### Production build (local verify)

`ash
pnpm build
pnpm start
`

### Docker

`ash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 \
  --build-arg NEXT_PUBLIC_SOCKET_URL=http://localhost:5000 \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id> \
  -t intervia-frontend:latest .

docker run -p 3000:3000 intervia-frontend:latest
`

---

## Testing

`ash
# Chạy unit tests
pnpm test

# Lint
pnpm lint

# Kiểm tra dead code
pnpm check:deadcode
`

Test runner: **Vitest 5**. Config: itest.config.mts.

---

## Git Workflow & Conventional Commits

`
main  <- production-ready
  +-- dev  <- integration
        +-- feat/*, fix/*, chore/*  <- feature branches
`

**Format commit message:**

`
feat(interview): thêm màn hình phỏng vấn fullscreen
fix(auth): sửa lỗi redirect sau khi login Google
chore(deps): nâng next lên 16.1.4
docs(readme): cập nhật hướng dẫn cài đặt
`

Types: eat · ix · chore · docs · 	est · efactor · style

---

## Deployment

Các biến NEXT_PUBLIC_* phải được truyền vào lúc **build** (không phải runtime).

`ash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=<prod-client-id> \
  -t intervia-frontend:prod .
`

Production tại https://phongvan.app (EC2 + Caddy + ECR, CI/CD bằng GitHub Actions): xem [infra/aws/README.md](infra/aws/README.md).

---

## Security

- Route protection qua src/middleware.ts — redirect unauthenticated users
- Google Client ID là public variable (safe), không có secret trong frontend
- Không lưu JWT vào localStorage; dùng cookie/memory theo cấu hình auth
- Chi tiết: docs/security/

---

## Documentation liên quan

| Tài liệu | Mô tả |
|---|---|
| docs/admin/ | Admin panel design và audit |
| docs/auth/ | Auth flow documentation |
| docs/ux/ | UX/UI guidelines |
| docs/security/ | Security notes |
| DESIGN.md | Design system overview |
| interview-prep-core | Backend API repo |

---

## License

Dự án luận văn tốt nghiệp — nội bộ nhóm nghiên cứu.