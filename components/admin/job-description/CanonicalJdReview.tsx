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
  if (!refs?.length) return <span className="text-xs text-error">Chưa có minh chứng</span>;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {refs.map((ref) => {
        const item = evidence.get(ref);
        return (
          <span
            key={ref}
            title={item?.text || ref}
            className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary"
          >
            {item?.page ? `Trang ${item.page}` : "Nguồn"} · {ref.slice(-6)}
          </span>
        );
      })}
    </div>
  );
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
    <section className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-on-surface">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {title}
        <span className="text-xs font-medium text-on-surface-variant">({items.length})</span>
      </h3>
      {items.length ? (
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-2">
          {items.map((item, index) => (
            <li key={`${item.text}-${index}`} className="border-l-2 border-primary/30 pl-3 text-sm text-on-surface">
              {valueOf(item.text)}
              <EvidenceRefs refs={item.evidenceRefs} evidence={evidence} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-on-surface-variant">Chưa trích xuất được mục nào.</p>
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
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Kiểm tra JD đã trích xuất</p>
            <h3 className="mt-1 text-xl font-extrabold text-on-surface">{valueOf(jd.jobTitle)}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Đối chiếu thông tin với nguồn trước khi hoàn tất.
            </p>
          </div>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-on-surface-variant">
            {valueOf(jd.parsing?.status)}
          </span>
        </div>
        {metadata.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metadata.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-surface px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
              <p className="mt-1 text-sm font-semibold text-on-surface">{valueOf(value)}</p>
            </div>
          ))}
        </div>}
      </section>

      <section className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
        <h3 className="text-sm font-bold text-on-surface">Phân loại nghề nghiệp</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {classifications.length ? classifications.map((item, index) => (
            <span key={`${item.code}-${index}`} className="rounded-full border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary">
              {item.isPrimary ? "Primary · " : ""}{valueOf(item.label)}
              {typeof item.confidence === "number" ? ` · ${Math.round(item.confidence * 100)}%` : ""}
            </span>
          )) : <p className="text-sm text-on-surface-variant">Chưa phân loại được ngành nghề.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <span className="material-symbols-outlined text-primary">rule</span>
          Yêu cầu <span className="text-xs font-medium text-on-surface-variant">({requirements.length})</span>
        </h3>
        {requirements.length ? (
          <div className="mt-4 space-y-3">
            {requirements.map((item, index) => (
              <article key={item.requirementId || index} className="rounded-xl border border-outline-variant/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${item.priority === "must_have" ? "bg-error-container/40 text-error" : "bg-secondary-container text-on-secondary-container"}`}>
                    {item.priority === "must_have" ? "Bắt buộc" : "Ưu tiên"}
                  </span>
                  <span className="text-sm font-bold text-on-surface">{valueOf(item.concept?.label || item.rawLabel)}</span>
                  {experienceLabel(item.minimumExperienceMonths) && (
                    <span className="text-xs text-on-surface-variant">{experienceLabel(item.minimumExperienceMonths)}</span>
                  )}
                </div>
                <EvidenceRefs refs={item.evidenceRefs} evidence={evidence} />
              </article>
            ))}
          </div>
        ) : <p className="mt-3 text-sm text-on-surface-variant">Chưa trích xuất được yêu cầu kỹ năng.</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <GroundedList title="Trách nhiệm" icon="assignment" items={responsibilities} evidence={evidence} />
        <GroundedList title="Quyền lợi" icon="card_giftcard" items={benefits} evidence={evidence} />
      </div>

      <details className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
        <summary className="cursor-pointer text-sm font-bold text-on-surface">Minh chứng nguồn ({evidence.size})</summary>
        <div className="mt-4 space-y-2">
          {[...evidence.entries()].map(([id, item]) => (
            <div key={id} className="rounded-xl bg-surface-container-low px-3 py-2 text-sm">
              <p className="font-semibold text-on-surface">{item.section || "Nguồn"} · {item.page ? `Trang ${item.page}` : "Chưa rõ trang"}</p>
              <p className="mt-1 text-on-surface-variant">{item.text || "Không có text trích xuất"}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
