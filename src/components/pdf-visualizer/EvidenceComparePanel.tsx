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
    <div className="flex flex-col w-full h-full min-h-[35rem] max-h-[45rem] bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-lg font-black tracking-tight text-slate-900">
            Minh chứng Đối chiếu JD - CV
          </h3>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Khớp {matchedCount}/{totalCount}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Nhấp vào các từ khóa minh chứng màu xanh để định vị trực tiếp vị trí trên bản vẽ PDF của CV.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 p-2 gap-1 bg-slate-50/30">
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
            className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/10">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[36px] text-slate-300">find_in_page</span>
            <p className="mt-2 text-sm text-slate-500 font-semibold">Không tìm thấy yêu cầu nào.</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isMatched = item.status === "matched";
            return (
              <div
                key={`${item.requirement}-${idx}`}
                className={`p-4 rounded-2xl border transition-all ${
                  isMatched
                    ? "border-emerald-100 bg-emerald-50/20"
                    : "border-amber-100 bg-amber-50/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    item.category === "Bắt buộc"
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : item.category === "Khuyến khích"
                        ? "bg-sky-50 text-sky-600 border border-sky-100"
                        : "bg-purple-50 text-purple-600 border border-purple-100"
                  }`}>
                    {item.category}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <span className={`material-symbols-outlined text-[18px] ${
                      isMatched ? "text-emerald-600" : "text-amber-600"
                    }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isMatched ? "check_circle" : "error"}
                    </span>
                    <span className={`text-xs font-bold ${
                      isMatched ? "text-emerald-700" : "text-amber-700"
                    }`}>
                      {isMatched ? "ĐÃ KHỚP" : "THIẾU"}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-800 leading-relaxed">
                  {item.requirement}
                </p>

                {isMatched ? (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Từ khóa tìm thấy trong CV:</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.snippets.map((snip, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => onSnippetClick(snip)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/50 hover:bg-emerald-200/90 py-1 px-2.5 rounded-lg transition"
                        >
                          <span className="material-symbols-outlined text-[14px]">search</span>
                          {snip}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-amber-800 leading-relaxed bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl">
                    <p className="font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                      Gợi ý:
                    </p>
                    <p className="mt-0.5 text-amber-700">
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
