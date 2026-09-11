"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { UserDashboardShell } from "../../../components/user-dashboard/UserDashboardShell";
import { useAuthProfile } from "../../../auth/useAuthProfile";

interface FaqItem {
  id: string;
  category: "webrtc" | "cv" | "voice" | "payment";
  categoryLabel: string;
  question: string;
  answer: string;
  tips?: string[];
}

const FAQ_LIST: FaqItem[] = [
  {
    id: "faq-webrtc-permission",
    category: "webrtc",
    categoryLabel: "Phòng phỏng vấn WebRTC",
    question: "Làm thế nào khi phòng phỏng vấn không nhận micro hoặc camera?",
    answer:
      "Nguyên nhân phổ biến nhất là trình duyệt chưa được cấp quyền truy cập thiết bị hoặc đang bị ứng dụng khác (Zoom, Teams, Skype) chiếm quyền kiểm soát camera/micro.",
    tips: [
      "Nhấp vào biểu tượng Ổ khóa trên thanh địa chỉ trình duyệt (Chrome/Firefox/Edge/Safari).",
      "Chọn 'Cài đặt trang web' (Site Settings) và chuyển Quyền Máy ảnh và Micro sang 'Cho phép' (Allow).",
      "Đảm bảo đóng tất cả ứng dụng đang chạy nền có sử dụng webcam rồi tải lại trang.",
      "Nếu dùng tai nghe Bluetooth, hãy kiểm tra Input Source trong phần Cài đặt âm thanh của hệ điều hành.",
    ],
  },
  {
    id: "faq-voice-interrupt",
    category: "voice",
    categoryLabel: "Voice & Chat AI",
    question: "Tôi có thể ngắt lời AI khi AI đang nói dở được không?",
    answer:
      "Hoàn toàn được! Bạn có thể ngắt lời AI bất cứ lúc nào để mô phỏng tương tác thực tế giữa người với người trong phòng phỏng vấn chuyên nghiệp.",
    tips: [
      "Bấm nút 'Dừng AI' (Interrupt) màu vàng trên thanh điều khiển phòng phỏng vấn.",
      "Hoặc nhấn phím tắt Spacebar (Phím cách) trên bàn phím để dừng giọng đọc AI ngay lập tức.",
      "Sau khi AI dừng, micro sẽ tự động thu lại giọng nói phản hồi mới nhất của bạn.",
    ],
  },
  {
    id: "faq-cv-ats",
    category: "cv",
    categoryLabel: "Chấm điểm CV & ATS",
    question: "Tại sao điểm ATS cho CV của tôi lại thấp và làm sao để cải thiện?",
    answer:
      "Hệ thống phân tích CV theo chuẩn ATS quốc tế dựa trên 3 tiêu chí: Mức độ tương thích từ khóa kỹ thuật với JD, cấu trúc định dạng chuẩn và các thành tích có số liệu định lượng (theo mô hình STAR / XYZ).",
    tips: [
      "Nên xuất CV định dạng file PDF hoặc DOCX với dung lượng dưới 5MB.",
      "Tránh để văn bản dạng ảnh hoặc bảng biểu phức tạp khiến máy quét OCR khó nhận diện.",
      "Bổ sung các từ khóa công nghệ chính xác có trong tin tuyển dụng.",
      "Sử dụng công cụ 'Tối ưu CV với AI' trong mục Quản lý CV để nhận các gợi ý viết lại từng gạch đầu dòng.",
    ],
  },
  {
    id: "faq-payment-vietqr",
    category: "payment",
    categoryLabel: "Gói cước & VietQR",
    question: "Sau khi chuyển khoản VietQR, mất bao lâu tài khoản được kích hoạt gói?",
    answer:
      "Hệ thống tích hợp cổng thanh toán VietQR tự động quét biến động số dư và kích hoạt gói cước tài khoản của bạn chỉ sau 30 đến 60 giây.",
    tips: [
      "Quét đúng mã QR được tạo riêng cho đơn hàng (mã đã chứa sẵn nội dung chuyển khoản).",
      "Không sửa đổi nội dung chuyển khoản để hệ thống đối soát chính xác 100%.",
      "Nếu sau 3 phút gói cước chưa được cập nhật, hãy gửi mã giao dịch vào form hỗ trợ bên dưới để đội ngũ kỹ thuật đối soát ngay.",
    ],
  },
  {
    id: "faq-interview-retake",
    category: "webrtc",
    categoryLabel: "Phòng phỏng vấn WebRTC",
    question: "Một buổi phỏng vấn thử có bị giới hạn số lần làm lại hoặc thời gian không?",
    answer:
      "Không giới hạn! Bạn có thể thực hiện lại nhiều lần cho cùng một vị trí tuyển dụng để cải thiện độ trôi chảy và mức độ tự tin.",
    tips: [
      "Thời lượng khuyến nghị mỗi buổi là 15 - 30 phút tương đương một vòng sơ vấn thực tế.",
      "Sau mỗi lần làm lại, báo cáo AI sẽ so sánh sự tiến bộ của bạn so với các lần thử trước đó.",
      "Bạn có thể tùy chỉnh độ khắt khe của AI trong mục Cài đặt tài khoản.",
    ],
  },
  {
    id: "faq-data-privacy",
    category: "voice",
    categoryLabel: "Voice & Chat AI",
    question: "Dữ liệu âm thanh và hình ảnh của tôi có được bảo mật an toàn không?",
    answer:
      "Chúng tôi áp dụng mã hóa SSL/TLS cho toàn bộ luồng truyền tải WebRTC. Dữ liệu video chỉ được xử lý cục bộ trên trình duyệt để phân tích ánh mắt/cử chỉ và hoàn toàn KHÔNG lưu lại video nếu không có sự đồng ý của bạn.",
    tips: [
      "Toàn bộ lịch sử phỏng vấn thuộc quyền sở hữu của bạn.",
      "Bạn có thể xuất toàn bộ bản ghi văn bản hoặc yêu cầu xóa vĩnh viễn dữ liệu trong trang Cài đặt.",
    ],
  },
];

export default function HelpCenterPage() {
  const { profile } = useAuthProfile();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Accordion State
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-webrtc-permission");

  // Helpful Feedback State
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "yes" | "no">>({});

  // Ticket Form State
  const [ticketCategory, setTicketCategory] = useState("webrtc");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketEmail, setTicketEmail] = useState(profile?.email || "");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccessId, setTicketSuccessId] = useState<string | null>(null);

  // Form Accessibility IDs
  const searchInputId = useId();
  const ticketCategoryId = useId();
  const ticketEmailId = useId();
  const ticketSubjectId = useId();
  const ticketDescId = useId();

  // Filter FAQ based on search and category
  const filteredFaqs = useMemo(() => {
    return FAQ_LIST.filter((item) => {
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCategory;

      const matchText =
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.tips && item.tips.some((tip) => tip.toLowerCase().includes(q)));

      return matchCategory && matchText;
    });
  }, [searchQuery, selectedCategory]);

  // Handle Feedback click
  const handleFeedback = (id: string, type: "yes" | "no") => {
    setFeedbackGiven((prev) => ({ ...prev, [id]: type }));
  };

  // Submit Ticket Handler
  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    setIsSubmittingTicket(true);
    setTimeout(() => {
      const generatedId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
      setIsSubmittingTicket(false);
      setTicketSuccessId(generatedId);
      setTicketSubject("");
      setTicketDescription("");
    }, 800);
  };

  return (
    <UserDashboardShell>
      <div className="min-h-full bg-[#FEF9EE] p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* HERO HEADER & SEARCH */}
          <header className="relative overflow-hidden rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[4px_4px_0_#234196] sm:p-10">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              {/* Eyebrow Sticker */}
              <div className="inline-flex -rotate-1 items-center gap-2 rounded-lg border-2 border-[#234196] bg-[#FCB625] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#234196] shadow-[2px_2px_0_#234196]">
                <span className="material-symbols-outlined text-base">support_agent</span>
                HỖ TRỢ 24/7 &amp; HƯỚNG DẪN KỸ THUẬT
              </div>

              {/* Title */}
              <h1 className="font-headline text-3xl font-black tracking-tight text-[#234196] sm:text-4xl md:text-5xl">
                Bạn đang gặp khó khăn gì?
              </h1>
              <p className="mx-auto max-w-xl text-sm font-medium text-[#5A6B8F] sm:text-base">
                Tìm câu trả lời nhanh cho các vấn đề kết nối phòng phỏng vấn, tối ưu hóa CV và chính sách tài khoản.
              </p>

              {/* Search Bar Input */}
              <div className="relative mx-auto mt-2 max-w-2xl">
                <label htmlFor={searchInputId} className="sr-only">
                  Tìm kiếm bài viết trợ giúp
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-2xl text-[#234196]">
                    search
                  </span>
                  <input
                    id={searchInputId}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm giải pháp: micro, camera, điểm ATS, VietQR, ngắt lời AI..."
                    className="w-full rounded-2xl border-2 border-[#234196] bg-[#FEF9EE] py-3.5 pl-12 pr-12 text-sm font-bold text-[#234196] placeholder-[#5A6B8F]/70 shadow-[3px_3px_0_#234196] transition-all focus:bg-white focus:outline-none sm:text-base"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 rounded-lg p-1 text-[#5A6B8F] hover:bg-[#234196]/10 hover:text-[#234196]"
                      aria-label="Xóa từ khóa tìm kiếm"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                    </button>
                  )}
                </div>

                {/* Quick Search Tag Pills */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
                  <span className="font-bold text-[#5A6B8F]">Tìm nhanh:</span>
                  {[
                    "Lỗi micro / camera",
                    "Ngắt lời AI",
                    "Điểm ATS thấp",
                    "Thanh toán VietQR",
                    "Bảo mật WebRTC",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="rounded-lg border border-[#234196]/30 bg-[#F0F4FC] px-2.5 py-1 font-semibold text-[#234196] transition-colors hover:border-[#234196] hover:bg-[#FCB625]"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* 4 QUICK ACCESS CARDS */}
          <section aria-labelledby="heading-quick-topics" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="heading-quick-topics" className="font-headline text-xl font-black text-[#234196]">
                Nhóm chủ đề trợ giúp nhanh
              </h2>
              <span className="text-xs font-bold text-[#5A6B8F]">Chọn chủ đề để lọc bài viết</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  id: "webrtc",
                  title: "Phòng phỏng vấn WebRTC",
                  desc: "Khắc phục lỗi camera, micro, giảm độ trễ hình ảnh và âm thanh.",
                  icon: "videocam",
                  count: "3 hướng dẫn",
                },
                {
                  id: "cv",
                  title: "Chấm điểm CV & ATS",
                  desc: "Định dạng file chuẩn, cách đẩy điểm ATS lên trên 85%.",
                  icon: "description",
                  count: "4 hướng dẫn",
                },
                {
                  id: "voice",
                  title: "Voice & Chat AI",
                  desc: "Phím tắt ngắt lời AI, chỉnh tốc độ đọc và sửa phát âm.",
                  icon: "record_voice_over",
                  count: "3 hướng dẫn",
                },
                {
                  id: "payment",
                  title: "Gói cước & VietQR",
                  desc: "Kích hoạt tự động sau 30s, hóa đơn và chính sách dịch vụ.",
                  icon: "payments",
                  count: "2 hướng dẫn",
                },
              ].map((topic) => {
                const isSelected = selectedCategory === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(selectedCategory === topic.id ? "all" : topic.id)
                    }
                    className={`flex flex-col justify-between rounded-2xl border-2 p-5 text-left transition-all ${
                      isSelected
                        ? "border-[#234196] bg-[#FCB625] shadow-[4px_4px_0_#234196] translate-y-[-2px]"
                        : "border-[#234196] bg-white shadow-[3px_3px_0_#234196] hover:bg-[#F0F4FC] hover:translate-y-[-1px]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#234196] bg-white text-[#234196] shadow-[2px_2px_0_#234196]">
                          <span className="material-symbols-outlined text-2xl">{topic.icon}</span>
                        </div>
                        <span className="rounded-md border border-[#234196]/30 bg-white/70 px-2 py-0.5 text-[10px] font-mono font-bold text-[#234196]">
                          {topic.count}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#234196] sm:text-base">{topic.title}</h3>
                        <p className="mt-1 text-xs text-[#5A6B8F] line-clamp-2">{topic.desc}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#234196]">
                      <span>{isSelected ? "Đang lọc câu hỏi" : "Xem câu hỏi"}</span>
                      <span className="material-symbols-outlined text-base">
                        {isSelected ? "check" : "arrow_forward"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* INTERACTIVE FAQ ACCORDION */}
          <section
            aria-labelledby="heading-faq-list"
            className="rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[4px_4px_0_#234196] sm:p-8"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#234196]/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FEF9EE] text-[#234196] shadow-[2px_2px_0_#234196]">
                  <span className="material-symbols-outlined text-2xl">quiz</span>
                </div>
                <div>
                  <h2 id="heading-faq-list" className="font-headline text-xl font-black text-[#234196]">
                    Câu hỏi thường gặp (FAQ)
                  </h2>
                  <p className="text-xs text-[#5A6B8F]">
                    Tìm thấy <strong>{filteredFaqs.length}</strong> bài viết phù hợp
                    {selectedCategory !== "all" && " trong nhóm đang chọn"}
                  </p>
                </div>
              </div>

              {selectedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#234196] hover:underline"
                >
                  <span className="material-symbols-outlined text-base">filter_list_off</span>
                  Hiển thị tất cả
                </button>
              )}
            </div>

            {/* List */}
            <div className="mt-6 divide-y-2 divide-[#234196]/10">
              {filteredFaqs.length === 0 ? (
                <div className="py-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-[#5A6B8F]">search_off</span>
                  <p className="mt-2 text-sm font-bold text-[#234196]">
                    Không tìm thấy bài viết nào cho từ khóa &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-xs text-[#5A6B8F]">
                    Vui lòng thử từ khóa khác hoặc gửi yêu cầu hỗ trợ trực tiếp ở biểu mẫu phía dưới.
                  </p>
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  const feedback = feedbackGiven[faq.id];

                  return (
                    <article key={faq.id} className="py-4 first:pt-0 last:pb-0">
                      {/* Accordion Trigger */}
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${faq.id}`}
                        className="flex w-full items-start justify-between gap-4 text-left transition-colors hover:text-[#234196]"
                      >
                        <div className="space-y-1">
                          <span className="inline-block rounded border border-[#234196]/20 bg-[#F0F4FC] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#234196]">
                            {faq.categoryLabel}
                          </span>
                          <h3 className="text-sm font-black text-[#234196] sm:text-base">{faq.question}</h3>
                        </div>
                        <div
                          className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#234196] text-[#234196] transition-transform duration-200 ${
                            isOpen ? "rotate-180 bg-[#FCB625]" : "bg-white"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">expand_more</span>
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div
                          id={`faq-answer-${faq.id}`}
                          className="mt-3.5 space-y-3 rounded-xl border-2 border-[#234196]/15 bg-[#FEF9EE] p-4 text-xs sm:text-sm"
                        >
                          <p className="font-medium leading-relaxed text-[#234196]">{faq.answer}</p>

                          {faq.tips && faq.tips.length > 0 && (
                            <div className="rounded-lg border-2 border-[#234196]/20 bg-white p-3 space-y-1.5">
                              <p className="font-bold text-[#234196] flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-base text-amber-600">
                                  lightbulb
                                </span>
                                Các bước xử lý cụ thể:
                              </p>
                              <ul className="list-disc space-y-1 pl-5 text-[#5A6B8F]">
                                {faq.tips.map((tip, idx) => (
                                  <li key={idx}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Helpful Feedback Box */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#234196]/15 pt-3">
                            <span className="text-[11px] font-bold text-[#5A6B8F]">
                              Thông tin này có giúp ích cho bạn không?
                            </span>

                            {feedback ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Cảm ơn bạn đã đóng góp phản hồi!
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(faq.id, "yes")}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#234196] bg-white px-2 py-1 text-[11px] font-bold text-[#234196] hover:bg-[#F0F4FC]"
                                  aria-label="Đánh giá hữu ích"
                                >
                                  <span className="material-symbols-outlined text-xs">thumb_up</span>
                                  Hữu ích
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(faq.id, "no")}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#234196] bg-white px-2 py-1 text-[11px] font-bold text-[#5A6B8F] hover:bg-[#F0F4FC]"
                                  aria-label="Đánh giá chưa giải quyết được"
                                >
                                  <span className="material-symbols-outlined text-xs">thumb_down</span>
                                  Chưa giải quyết
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* CONTACT CHANNELS & TICKET SUPPORT CARD */}
          <section
            aria-labelledby="heading-support-contact"
            className="rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[4px_4px_0_#234196] sm:p-8"
          >
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* LEFT COLUMN: CONTACT CHANNELS (5 cols) */}
              <div className="space-y-6 lg:col-span-5 lg:border-r-2 lg:border-[#234196]/15 lg:pr-8">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-[#234196] bg-[#FEF9EE] px-2.5 py-0.5 text-[10px] font-mono font-black uppercase text-[#234196]">
                    TRỢ GIÚP TRỰC TIẾP
                  </div>
                  <h2 id="heading-support-contact" className="font-headline text-2xl font-black text-[#234196]">
                    Liên hệ Kỹ thuật viên
                  </h2>
                  <p className="text-xs font-medium text-[#5A6B8F] sm:text-sm">
                    Đội ngũ kỹ sư hỗ trợ trực tiếp từ <strong>08:00 - 22:00 hàng ngày</strong> (kể cả cuối tuần).
                  </p>
                </div>

                {/* Direct Channel Cards */}
                <div className="space-y-3">
                  {/* Hotline / Zalo */}
                  <div className="flex items-center gap-3.5 rounded-xl border-2 border-[#234196]/20 bg-[#FEF9EE] p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#234196] bg-white text-[#234196]">
                      <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-[#234196]">Hotline &amp; Zalo Hỗ trợ</p>
                      <p className="font-mono text-sm font-bold text-[#234196]">0988.123.456 (Zalo OA)</p>
                      <span className="text-[10px] text-emerald-700 font-bold">● Phản hồi dưới 5 phút</span>
                    </div>
                  </div>

                  {/* Email Support */}
                  <div className="flex items-center gap-3.5 rounded-xl border-2 border-[#234196]/20 bg-[#F0F4FC] p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#234196] bg-white text-[#234196]">
                      <span className="material-symbols-outlined text-xl">mail</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-[#234196]">Email Kỹ thuật</p>
                      <p className="font-mono text-xs font-bold text-[#234196]">support@intervia.ai</p>
                      <span className="text-[10px] text-[#5A6B8F]">Phản hồi trong 2 giờ làm việc</span>
                    </div>
                  </div>

                  {/* Community Discord / Telegram */}
                  <div className="flex items-center gap-3.5 rounded-xl border-2 border-[#234196]/20 bg-white p-3.5 shadow-[2px_2px_0_#234196]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] text-[#234196]">
                      <span className="material-symbols-outlined text-xl">forum</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-[#234196]">Cộng đồng Luyện phỏng vấn</p>
                      <p className="text-xs font-medium text-[#5A6B8F]">Hơn 5,000 ứng viên &amp; Tech Leads</p>
                      <a
                        href="https://discord.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[#234196] underline"
                      >
                        Tham gia Discord cộng đồng &rarr;
                      </a>
                    </div>
                  </div>
                </div>

                {/* Remote Assistance Note */}
                <div className="rounded-xl border border-dashed border-[#234196]/40 p-3 text-xs text-[#5A6B8F]">
                  <p className="font-bold text-[#234196]">Hỗ trợ từ xa qua UltraViewer / AnyDesk:</p>
                  <p className="mt-0.5">
                    Nếu gặp lỗi phần cứng hoặc mạng WebRTC khó xử lý, kỹ thuật viên có thể hỗ trợ kiểm tra trực tiếp máy tính của bạn.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: SUBMIT TICKET FORM (7 cols) */}
              <div className="space-y-4 lg:col-span-7">
                <div className="space-y-1">
                  <h3 className="font-headline text-xl font-black text-[#234196]">Gửi yêu cầu hỗ trợ nhanh</h3>
                  <p className="text-xs text-[#5A6B8F]">
                    Báo cáo sự cố hoặc gửi ý kiến đóng góp trực tiếp đến nhóm phát triển.
                  </p>
                </div>

                {/* Success Alert */}
                {ticketSuccessId && (
                  <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 shadow-[2px_2px_0_#047857]">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-2xl text-emerald-700">task_alt</span>
                      <div>
                        <p className="text-sm font-bold text-emerald-900">
                          Đã gửi yêu cầu hỗ trợ thành công!
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-800">
                          Mã Ticket của bạn là <strong className="font-mono">{ticketSuccessId}</strong>. Đội ngũ kỹ sư sẽ phản hồi qua email của bạn trong thời gian sớm nhất.
                        </p>
                        <button
                          type="button"
                          onClick={() => setTicketSuccessId(null)}
                          className="mt-2 text-xs font-bold text-emerald-900 underline"
                        >
                          Gửi thêm yêu cầu khác
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleTicketSubmit} className="space-y-3.5">
                  {/* Category & Email */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor={ticketCategoryId} className="text-xs font-black uppercase text-[#234196]">
                        Loại vấn đề:
                      </label>
                      <select
                        id={ticketCategoryId}
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full rounded-xl border-2 border-[#234196] bg-white px-3 py-2 text-xs font-bold text-[#234196] shadow-[2px_2px_0_#234196] focus:bg-[#FEF9EE] focus:outline-none"
                      >
                        <option value="webrtc">Lỗi Camera / Micro WebRTC</option>
                        <option value="ai_voice">Giọng nói &amp; Nhận diện AI</option>
                        <option value="cv_ats">Chấm điểm CV &amp; Xuất file</option>
                        <option value="payment">Thanh toán VietQR &amp; Gói cước</option>
                        <option value="feature">Góp ý tính năng mới</option>
                        <option value="other">Vấn đề khác</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor={ticketEmailId} className="text-xs font-black uppercase text-[#234196]">
                        Email nhận phản hồi:
                      </label>
                      <input
                        id={ticketEmailId}
                        type="email"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        className="w-full rounded-xl border-2 border-[#234196] bg-white px-3 py-2 text-xs font-bold text-[#234196] shadow-[2px_2px_0_#234196] focus:bg-[#FEF9EE] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label htmlFor={ticketSubjectId} className="text-xs font-black uppercase text-[#234196]">
                      Tiêu đề sự cố:
                    </label>
                    <input
                      id={ticketSubjectId}
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Ví dụ: Phòng phỏng vấn báo lỗi 'Device in use' dù đã tắt Zoom"
                      required
                      className="w-full rounded-xl border-2 border-[#234196] bg-white px-3.5 py-2 text-xs font-bold text-[#234196] shadow-[2px_2px_0_#234196] focus:bg-[#FEF9EE] focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label htmlFor={ticketDescId} className="text-xs font-black uppercase text-[#234196]">
                      Mô tả chi tiết vấn đề:
                    </label>
                    <textarea
                      id={ticketDescId}
                      rows={4}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Mô tả cụ thể thông báo lỗi hiển thị trên màn hình, thiết bị bạn đang dùng (Windows/Mac, trình duyệt Chrome/Safari)..."
                      required
                      className="w-full rounded-xl border-2 border-[#234196] bg-white p-3 text-xs font-medium text-[#234196] shadow-[2px_2px_0_#234196] focus:bg-[#FEF9EE] focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 text-right">
                    <button
                      type="submit"
                      disabled={isSubmittingTicket}
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-[#234196] bg-[#FCB625] px-6 py-2.5 text-xs font-black text-[#234196] shadow-[3px_3px_0_#234196] transition-all hover:bg-[#ffc33f] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 sm:text-sm"
                    >
                      {isSubmittingTicket ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-base">
                            progress_activity
                          </span>
                          Đang gửi yêu cầu...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">send</span>
                          Gửi yêu cầu hỗ trợ
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </UserDashboardShell>
  );
}
