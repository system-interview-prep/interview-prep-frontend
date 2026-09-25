"use client";

type Evidence = {
  evidenceId?: string;
  section?: string;
  text?: string;
  page?: number | null;
  readingOrder?: number | null;
};

type Requirement = {
  requirementId?: string;
  kind?: string;
  priority?: "must_have" | "preferred" | string;
  rawLabel?: string;
  minimumExperienceMonths?: number | null;
  concept?: { label?: string } | null;
  evidenceRefs?: string[];
};

type GroundedText = { text?: string; evidenceRefs?: string[] };

type CareerClassification = {
  code?: string;
  label?: string;
  confidence?: number;
  isPrimary?: boolean;
  evidenceRefs?: string[];
};

type CanonicalJd = {
  schemaVersion?: string;
  jobTitle?: string | null;
  seniority?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  location?: string | null;
  requirements?: Requirement[];
  responsibilities?: GroundedText[];
  benefits?: GroundedText[];
  careerClassifications?: CareerClassification[];
  evidence?: Evidence[];
  parsing?: { status?: string; parserVersion?: string; extractionVersion?: string };
};

function valueOf(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "—";
}

function experienceLabel(months: number | null | undefined): string | null {
  if (!months) return null;
  if (months % 12 === 0) return `Tối thiểu ${months / 12} năm`;
  return `Tối thiểu ${months} tháng`;
}

function EvidenceRefs({ refs, evidence }: { refs?: string[]; evidence: Map<string, Evidence> }) {
  if (!refs?.length) return <span className="text-xs text-red-500">Chưa có minh chứng</span>;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {refs.map((ref) => {
        const item = evidence.get(ref);
        return (
          <span
            key={ref}
            title={item?.text || ref}
            className="rounded-full bg-[#EEF2FD] border border-[#204195]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#204195]"
          >
            {item?.page ? `Trang ${item.page}` : "Nguồn"} · {ref.slice(-6)}
          </span>
        );
      })}
    </div>
  );
}

import { CheckSquare, ClipboardList, Gift } from "lucide-react";

function DynamicIcon({ name, className = "size-5 text-[#204195]" }: { name: string; className?: string }) {
  if (name === "assignment") return <ClipboardList className={className} />;
  if (name === "card_giftcard") return <Gift className={className} />;
  if (name === "rule") return <CheckSquare className={className} />;
  return <CheckSquare className={className} />;
}

function GroundedList({
  title,
  icon,
  items,
  evidence,
}: {
  title: string;
  icon: string;
  items: GroundedText[];
  evidence: Map<string, Evidence>;
}) {
  return (
    <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[#14244B]">
        <DynamicIcon name={icon} className="size-5 text-[#204195]" />
        {title}
        <span className="text-xs font-medium text-[#607096]">({items.length})</span>
      </h3>
      {items.length ? (
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-2">
          {items.map((item, index) => (
            <li key={`${item.text}-${index}`} className="border-l-2 border-[#204195]/30 pl-3 text-xs sm:text-sm text-[#14244B]">
              {valueOf(item.text)}
              <EvidenceRefs refs={item.evidenceRefs} evidence={evidence} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#607096]">Chưa trích xuất được mục nào.</p>
      )}
    </section>
  );
}

export default function CanonicalJdReview({ data }: { data: Record<string, unknown> }) {
  const jd = data as CanonicalJd;
  const evidence = new Map(
    (Array.isArray(jd.evidence) ? jd.evidence : [])
      .filter((item) => Boolean(item.evidenceId))
      .map((item) => [item.evidenceId as string, item]),
  );
  const requirements = Array.isArray(jd.requirements) ? jd.requirements : [];
  const classifications = Array.isArray(jd.careerClassifications) ? jd.careerClassifications : [];
  const responsibilities = Array.isArray(jd.responsibilities) ? jd.responsibilities : [];
  const benefits = Array.isArray(jd.benefits) ? jd.benefits : [];
  const metadata = [
    ["Cấp bậc", jd.seniority],
    ["Hình thức", jd.employmentType],
    ["Làm việc", jd.workMode],
    ["Địa điểm", jd.location],
  ].filter(([, value]) => typeof value === "string" && value.trim());

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#204195]/20 bg-[#F0F4FC] p-5 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#204195]">Kiểm tra JD đã trích xuất</p>
            <h3 className="mt-1 text-xl font-extrabold text-[#14244B]">{valueOf(jd.jobTitle)}</h3>
            <p className="mt-1 text-xs sm:text-sm text-[#607096]">
              Đối chiếu thông tin với nguồn trước khi hoàn tất.
            </p>
          </div>
          <span className="rounded-full bg-white border border-[#DCE4F3] px-3 py-1 text-xs font-bold text-[#204195] shadow-2xs">
            {valueOf(jd.parsing?.status)}
          </span>
        </div>
        {metadata.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metadata.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#607096]">{label}</p>
                <p className="mt-1 text-sm font-semibold text-[#14244B]">{valueOf(value)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-[#14244B]">Phân loại nghề nghiệp</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {classifications.length ? (
            classifications.map((item, index) => (
              <span key={`${item.code}-${index}`} className="rounded-full border border-[#204195]/20 bg-[#EEF2FD] px-3 py-1.5 text-xs font-semibold text-[#204195]">
                {item.isPrimary ? "Primary · " : ""}{valueOf(item.label)}
                {typeof item.confidence === "number" ? ` · ${Math.round(item.confidence * 100)}%` : ""}
              </span>
            ))
          ) : (
            <p className="text-sm text-[#607096]">Chưa phân loại được ngành nghề.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#14244B]">
          <CheckSquare className="size-5 text-[#204195]" />
          Yêu cầu <span className="text-xs font-medium text-[#607096]">({requirements.length})</span>
        </h3>
        {requirements.length ? (
          <div className="mt-4 space-y-3">
            {requirements.map((item, index) => (
              <article key={item.requirementId || index} className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC]/50 p-4 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.priority === "must_have" ? "bg-red-50 text-red-700 border border-red-200" : "bg-[#EEF2FD] text-[#204195] border border-[#204195]/20"}`}>
                    {item.priority === "must_have" ? "Bắt buộc" : "Ưu tiên"}
                  </span>
                  <span className="text-sm font-bold text-[#14244B]">{valueOf(item.concept?.label || item.rawLabel)}</span>
                  {experienceLabel(item.minimumExperienceMonths) && (
                    <span className="text-xs text-[#607096]">{experienceLabel(item.minimumExperienceMonths)}</span>
                  )}
                </div>
                <EvidenceRefs refs={item.evidenceRefs} evidence={evidence} />
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#607096]">Chưa trích xuất được yêu cầu kỹ năng.</p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <GroundedList title="Trách nhiệm" icon="assignment" items={responsibilities} evidence={evidence} />
        <GroundedList title="Quyền lợi" icon="card_giftcard" items={benefits} evidence={evidence} />
      </div>

      <details className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs">
        <summary className="cursor-pointer text-sm font-bold text-[#14244B]">Minh chứng nguồn ({evidence.size})</summary>
        <div className="mt-4 space-y-2">
          {[...evidence.entries()].map(([id, item]) => (
            <div key={id} className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3.5 py-2.5 text-xs sm:text-sm shadow-2xs">
              <p className="font-semibold text-[#14244B]">{item.section || "Nguồn"} · {item.page ? `Trang ${item.page}` : "Chưa rõ trang"}</p>
              <p className="mt-1 text-xs text-[#607096]">{item.text || "Không có text trích xuất"}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
