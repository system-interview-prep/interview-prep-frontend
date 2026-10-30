"use client";

import { useState } from "react";

interface EvidenceItem {
  requirement: string;
  status: "matched" | "missing";
  snippets: string[];
}

interface EvidenceGroup {
  must_have: EvidenceItem[];
  nice_to_have: EvidenceItem[];
  constraints: EvidenceItem[];
}

interface EvidenceComparePanelProps {
  evidence: EvidenceGroup | null;
  onSnippetClick: (snippet: string) => void;
}

type TabType = "all" | "must" | "nice" | "constraints";

export default function EvidenceComparePanel({ evidence, onSnippetClick }: EvidenceComparePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const mustHave = evidence?.must_have || [];
  const niceToHave = evidence?.nice_to_have || [];
  const constraints = evidence?.constraints || [];

  const filteredItems = (() => {
    switch (activeTab) {
      case "must":
        return mustHave.map(item => ({ ...item, category: "Bắt buộc" }));
      case "nice":
        return niceToHave.map(item => ({ ...item, category: "Khuyến khích" }));
      case "constraints":
        return constraints.map(item => ({ ...item, category: "Ràng buộc" }));
      default:
        return [
          ...mustHave.map(item => ({ ...item, category: "Bắt buộc" })),
          ...niceToHave.map(item => ({ ...item, category: "Khuyến khích" })),
          ...constraints.map(item => ({ ...item, category: "Ràng buộc" })),
        ];
    }
  })();

  const matchedCount = mustHave.filter(i => i.status === "matched").length +
    niceToHave.filter(i => i.status === "matched").length +
    constraints.filter(i => i.status === "matched").length;

  const totalCount = mustHave.length + niceToHave.length + constraints.length;

  return (
    <div className="flex flex-col w-full h-full min-h-[35rem] max-h-[45rem] bg-white ring-1 ring-[#DCE4F3] rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#EAEFF8]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-semibold text-[#14244B]">
            Minh chứng Đối chiếu JD - CV
          </h3>
          <span className="rounded-full bg-[#EAF5EE] px-3 py-1 text-xs font-semibold text-[#287A4B]">
            Khớp {matchedCount}/{totalCount}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#607096] leading-relaxed">
          Nhấp vào các từ khóa minh chứng màu xanh để định vị trực tiếp vị trí trên bản vẽ PDF của CV.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[#EAEFF8] p-2 gap-1 bg-[#F8FAFC]">
        {(
          [
            { id: "all", label: "Tất cả" },
            { id: "must", label: "Bắt buộc" },
            { id: "nice", label: "Khuyến khích" },
            { id: "constraints", label: "Ràng buộc" },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 whitespace-nowrap text-xs font-semibold py-2 px-3 rounded-full transition-all ${
              activeTab === tab.id
                ? "bg-[#14244B] text-white"
                : "text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="mt-2 text-sm text-[#607096] font-semibold">Không tìm thấy yêu cầu nào.</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isMatched = item.status === "matched";
            return (
              <div
                key={`${item.requirement}-${idx}`}
                className={`p-4 rounded-2xl bg-white ring-1 transition-all ${
                  isMatched
                    ? "ring-[#287A4B]/25"
                    : "ring-[#FCB625]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    item.category === "Bắt buộc"
                      ? "bg-[#FDF2F2] text-[#C43B3B]"
                      : item.category === "Khuyến khích"
                        ? "bg-sky-50 text-sky-600"
                        : "bg-[#F0F4FC] text-[#607096]"
                  }`}>
                    {item.category}
                  </span>
                  
                  <div className="flex items-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isMatched ? "bg-[#EAF5EE] text-[#287A4B]" : "bg-[#FFF8E6] text-[#8A5A00]"
                    }`}>
                      {isMatched ? "ĐÃ KHỚP" : "THIẾU"}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#14244B] leading-relaxed">
                  {item.requirement}
                </p>

                {isMatched ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-[#607096]">Từ khóa tìm thấy trong CV:</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.snippets.map((snip, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => onSnippetClick(snip)}
                          className="inline-flex items-center text-xs font-semibold text-[#287A4B] bg-[#EAF5EE] hover:bg-[#287A4B]/25 py-1 px-3 rounded-full transition"
                        >
                          {snip}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-[#8A5A00] leading-relaxed bg-[#FFF8E6] p-2.5 rounded-xl">
                    <p className="font-semibold">
                      Gợi ý:
                    </p>
                    <p className="mt-0.5 text-[#8A5A00]">
                      Hãy bổ sung thông tin chứng minh cho yêu cầu này vào CV nếu bạn đã có kinh nghiệm thực tế.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
