# QA CHECKLIST — RESOURCES & PRICING

## 1. Gate 0 — Build & Regression
- [x] `pnpm run build` → Exit code 0 (Verified: 27 routes built successfully)
- [x] `/resources` load bình thường
- [x] `/pricing` load bình thường
- [x] Không xuất hiện duplicate `MarketingNav`
- [x] Không xuất hiện duplicate `Footer`
- [x] Console browser không có React hydration error
- [x] Console không có key warning
- [x] Console không có failed image request 404
- [x] Không có TypeScript error mới
- [x] Các route marketing cũ vẫn mở được:
  - `/`
  - `/resources`
  - `/pricing`
  - `/solutions`
  - `/login`
  - `/signup`

> **Blocker:** chỉ cần 1 mục trên fail thì chưa chuyển sang `/solutions`.

---

## 2. Resources — Functional QA

### Search
- [x] Search `"CV"` → chỉ hiện resource liên quan
- [x] Search `"STAR"` → tìm được Interview Framework
- [x] Search `"voice"` → tìm được Voice resource
- [x] Search bằng tiếng Việt hoạt động
- [x] Search bằng tiếng Anh hoạt động
- [x] Search không phân biệt hoa/thường
- [x] Xóa nội dung search → toàn bộ resource xuất hiện lại
- [x] Search không có kết quả → hiển thị empty state
- [x] Nút reset ở empty state:
  - clear query
  - reset topic về `all`

### Acceptance
- [x] `query` + `topic filter` phải kết hợp đúng

Ví dụ:
- Topic: `Interview`, Query: `STAR` → có kết quả
- Topic: `Voice`, Query: `STAR` → không có kết quả

---

## 3. Resources — Topic Navigation

### Kiểm tra các topic:
- All
- CV & ATS
- Evidence Matching
- Interview
- Voice & Delivery
- Career Strategy
- Offer & Salary

### Tiêu chí:
- [x] Click từng topic → danh sách filter đúng
- [x] Active topic có state màu đúng
- [x] Topic ở Hero click → scroll xuống Library
- [x] Topic ở Browse by Goal click → scroll xuống Library
- [x] Scroll không bị Navbar sticky che heading
- [x] `scroll-mt-*` hoạt động đúng
- [x] Topic filter trên mobile có thể horizontal scroll
- [x] Không xuất hiện scrollbar khó chịu

---

## 4. Resources — Featured Resource
- [x] Section không bị quá cao
- [x] 3 bước hiển thị đúng: `CV evidence` ↓ `JD requirement` ↓ `Interview practice`
- [x] Không bị overflow ở 375px
- [x] CTA scroll đúng tới library (`#resource-library`)
- [x] Text EN không làm vỡ layout
- [x] Background dots không ảnh hưởng readability
- [x] Contrast chữ trắng đủ rõ

---

## 5. Resources — Library Cards

### Mỗi card cần kiểm tra:
- [x] visual đúng loại resource
- [x] title không vượt layout
- [x] description không làm card biến dạng bất thường
- [x] read time hiển thị (định dạng theo ngôn ngữ: 8 phút / 8 min)
- [x] tag hiển thị
- [x] hover chỉ nhẹ, không nhảy mạnh
- [x] card cùng hàng có chiều cao hợp lý
- [x] animation xuất hiện mượt
- [x] `prefers-reduced-motion` không gây vấn đề

---

## 6. Resources — Coach Section
- [x] Mascot không bị crop đầu/tai
- [x] Mascot không che text
- [x] Glow không tạo một hình tròn quá rõ
- [x] 3 recommendation steps thẳng hàng
- [x] CTA: `/dashboard/cvs` thực sự tồn tại
- [x] User chưa login → behavior hợp lý (middleware redirect về `/login?next=...`)

---

## 7. Resources — Community

### Kiểm tra CTA:
- [x] `/interview/select`
- [x] `/#how-to-use`
- [x] `/interview/select` tồn tại
- [x] Link `/#how-to-use` scroll đúng section landing
- [x] Mock interview tile rõ nghĩa
- [x] Peer review không tạo hiểu lầm nếu tính năng chưa thực sự có
- [x] Coach feedback không quảng cáo capability chưa được implement

---

## 8. Resources — Final CTA
- [x] Mascot chỉ là decoration
- [x] Không che headline
- [x] Mobile có thể ẩn mascot
- [x] `/signup` hoạt động
- [x] `/pricing` hoạt động
- [x] Yellow CTA đủ contrast
- [x] Không có quá nhiều mascot cùng viewport

---

## 9. Pricing — Hero QA

### Kiểm tra ở các viewport:
- 375px
- 430px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

### Tiêu chí:
- [x] headline wrap đẹp
- [x] Không xuất hiện 1 từ cô lập trên dòng cuối
- [x] Visual pricing card không đè lên mascot
- [x] Fox không che giá
- [x] 249.000 VNĐ đọc rõ
- [x] Starter card decoration không làm section rối
- [x] “No auto-renew” nhìn thấy nhưng không cạnh tranh với CTA
- [x] Choose a plan scroll đúng `#plans`
- [x] `/signup` hoạt động

---

## 10. Pricing — One-Time Payment

### Phải truyền tải nhất quán:
- One-time payment
- No subscription
- No auto-renew
- User decides when to buy again

### Cấm xuất hiện:
- [x] Không còn chữ monthly
- [x] Không còn chữ annual
- [x] Không còn Save 20%
- [x] Không còn /month
- [x] Không còn copy subscription cũ
- [x] VN/EN truyền tải cùng ý nghĩa

---

## 11. Pricing — Plan Data Integrity

### Kiểm tra source data phải đúng:
| Plan | Price | Usage |
| --- | --- | --- |
| Starter Pass | 99,000 | 14 ngày |
| Career Pro | 249,000 | 30 ngày |
| Flex Credit | 49,000 | linh hoạt |

### Kiểm tra UI:
- [x] Starter = 99.000 VNĐ
- [x] Career Pro = 249.000 VNĐ
- [x] Flex = 49.000 VNĐ
- [x] Career Pro có badge recommended
- [x] Career Pro nổi bật nhưng không to quá mức
- [x] Giá được lấy từ number, không duplicate hard-code trong component
- [x] Formatter thống nhất (`formatVnd(value: number)`)

---

## 12. Pricing — Plan Selection

### Test lần lượt:
- [x] **Starter**: Click Starter Pass → Modal mở → Tên plan = Starter Pass → Giá = 99.000 → transfer content nhận đúng plan
- [x] **Career Pro**: Click Career Pro → Modal mở → Giá = 249.000 → Không giữ state Starter trước đó
- [x] **Flex**: Click Flex → Modal mở → Giá = 49.000 → Nội dung payment đúng Flex

---

## 13. VietQR Modal — Functional QA (P0)
- [x] **Open / close**: Click plan → modal mở; Click X → đóng; ESC → đóng; Click backdrop → đóng; Click bên trong modal → không đóng; Đóng rồi mở plan khác → data được reset
- [x] **Copy**: Bank, Account number, Transfer content (click hiện Copied, trạng thái tự reset)
- [x] **Payment state**: Ban đầu = idle → click “Tôi đã chuyển khoản” → chuyển checking → chuyển demo-complete; button không double-click được
- [x] **THIS IS DEMO**: Không có wording khiến user nghĩ ngân hàng đã thực sự xác minh giao dịch, demo notice luôn nhìn thấy

---

## 14. VietQR Modal — Production Safety

Trước production, checklist phải giữ fail:
- [ ] Real payment verification implemented

> **Note:** Demo mode simulation active. Real payment gateway verification requires backend integration prior to live production.

---

## 15. Pricing Comparison Table
- [x] Check từng row: CV – JD matching, Mock interviews, Chat, Voice, Video, Evidence feedback, Progress tracking, Access period
- [x] Dữ liệu khớp plan card (Plan Card data == Comparison Table data)
- [x] Career Pro column được highlight vừa phải
- [x] Mobile horizontal scroll được
- [x] Header không biến mất khi scroll ngang
- [x] Check icon có nghĩa rõ, `—` có nghĩa là không hỗ trợ
- [x] Unlimited không bị xuống dòng xấu

---

## 16. Pricing — FAQ
- [x] Mặc định chỉ 1 item mở
- [x] Mở item mới → behavior đúng
- [x] Đóng item đang mở được
- [x] Chevron rotate, animation không giật
- [x] Keyboard Enter / Space hoạt động
- [x] VN / EN copy đúng
- [x] FAQ payment nói rõ VietQR hiện là demo nếu backend chưa tích hợp

---

## 17. i18n Regression QA
- [x] Test flow: EN → VN → EN trên cả `/resources` và `/pricing`
- [x] Không reload lỗi, Language selector cập nhật, Cookie `lang` cập nhật, `<html lang="">` cập nhật
- [x] Search, Topic active, Pricing modal, FAQ state vẫn hoạt động sau khi đổi ngôn ngữ
- [x] Không xuất key dạng raw `pricing.hero.title`, `resources.library.title`
- [x] Hard-code audit: `PricingBillingToggle` and modal copy fully refactored to `t(...)` keys

---

## 18. Responsive QA Matrix
Test ở các viewport: 375px, 430px, 768px, 1024px, 1280px, 1440px, 1920px:
- [x] Không horizontal overflow toàn page
- [x] Text không crop, mascot không che content, CTA không quá rộng
- [x] Pricing cards không lệch bất thường, table vẫn dùng được
- [x] Modal không vượt viewport
- [x] Navbar không wrap, Footer không bị phá layout

---

## 19. Browser QA
- [x] Chrome, Edge, Firefox, Safari/iOS
- [x] Check: backdrop blur, sticky Navbar, SVG, mask-image, Framer Motion, Clipboard API, scrollIntoView, modal fixed positioning

---

## 20. Accessibility QA
- [x] Tab đi được toàn bộ interactive elements, focus ring nhìn thấy
- [x] Không có keyboard trap ngoài modal, khi modal mở focus vào modal, đóng focus trở về button
- [x] Decorative images `alt=""`, meaningful mascot alt hợp lý
- [x] Search có `aria-label`, FAQ button có `aria-expanded` & `aria-controls`, Modal có `aria-modal="true"` & `aria-labelledby`
- [x] Comparison table dùng `<th>`, Contrast đạt mức dễ đọc

---

## 21. Motion QA
- [x] Không animation quá nhiều cùng lúc
- [x] Mascot không float liên tục nếu không cần
- [x] Hover card tối đa `translateY(-2px ~ -4px)`
- [x] Respect `prefers-reduced-motion`

---

## 22. Performance QA
- [x] Target: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [x] Mascot PNG không quá lớn, background image tối ưu
- [x] Final CTA below fold không priority, Hero visual xem xét priority

---

## 23. SEO QA
- [x] Resources & Pricing: title, description đúng VN/EN
- [x] Duy nhất 1 `<h1>` mỗi trang, heading hierarchy `h1` → `h2` → `h3`
- [x] Content crawl được, search UI không làm mất server metadata

---

## 24. Content Accuracy Gate
- [x] Resources không tự claim con số không có nguồn
- [x] Pricing xác nhận chính thức business rules:
  - Starter: 3 CV-JD, 2 mock
  - Pro: unlimited matching, 10 mock, Chat, Voice, Video
  - Flex: 5 matching OR 1 interview

---

## 25. Source-of-truth QA
- [x] `pricing.data.ts` là Single Source of Truth cho Plan Cards, Comparison Table và VietQR Modal

---

## 26. QA Gate để được bắt đầu /solutions

> QA Gate Status: **PASS — READY FOR /solutions**

- [x] **BUILD:** `pnpm build` pass (Exit code 0, 27 static routes generated)
- [x] **FUNCTIONAL:** Resources search/filter, Pricing plan/modal, FAQ, all CTAs pass
- [x] **I18N:** VN, EN pass, không có raw translation key
- [x] **RESPONSIVE:** 375, 768, 1024, 1440 pass
- [x] **PAYMENT:** Wording ghi rõ demo flow ("Demo complete" / "Demo hoàn tất")
- [x] **ACCESSIBILITY:** Keyboard navigation, focus, modal dialog, FAQ ARIA attributes pass
- [x] **CONTENT:** Rules & pricing confirmed
- [x] **REGRESSION:** No duplicate nav/footer, landing unaffected
