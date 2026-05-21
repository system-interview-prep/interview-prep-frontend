"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import MDEditor from "@uiw/react-md-editor";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import {
  emptyJobProfileForm,
  jobProfileApi,
  keywordsStringToArray,
  type JobProfileFormState,
} from "@/services/jobProfileApi";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useJpUploadStatus } from "@/hooks/useJpUploadStatus";
import { humanizeKey } from "@/utils";

type LabeledNode = { label?: string; value?: unknown } & Record<string, unknown>;

function isLabeledNode(x: unknown): x is { label: string; value: unknown } {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  return "value" in x && "label" in x;
}

function stripMarkdownHeadings(s: string): string {
  return String(s || "").replace(/^\s*#{1,6}\s*/gm, "").trim();
}

function cloneDeep<T>(x: T): T {
  // best-effort clone for JSON-ish structures
  if (typeof structuredClone === "function") return structuredClone(x);
  return JSON.parse(JSON.stringify(x)) as T;
}

function setAtPath(root: any, path: (string | number)[], nextValue: unknown) {
  const out = cloneDeep(root);
  let cur: any = out;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    cur[k] = cur[k] ?? (typeof path[i + 1] === "number" ? [] : {});
    cur = cur[k];
  }
  cur[path[path.length - 1]] = nextValue;
  return out;
}

function isEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0 || v.every((x) => isEmptyValue(x));
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return true;
    return keys.every((k) => isEmptyValue(obj[k]));
  }
  return false;
}

function shouldHideKey(key: string): boolean {
  const k = String(key || "").trim().toLowerCase();
  return (
    k === "id" ||
    k === "jobid" ||
    k === "uploadid" ||
    k === "user_id" ||
    k === "userid" ||
    k === "owner_user_id"
  );
}

function labeledJsonToText(input: unknown, indent = 0): string {
  const pad = "  ".repeat(Math.max(0, indent));

  const formatExperience = (value: any, label: string) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const hasMin = Object.prototype.hasOwnProperty.call(value, "minYears");
    const hasMax = Object.prototype.hasOwnProperty.call(value, "maxYears");
    if (!hasMin && !hasMax) return null;

    const min = value.minYears;
    const max = value.maxYears;
    const minNum = typeof min === "number" ? min : min === null || min === undefined ? null : Number(min);
    const maxNum = typeof max === "number" ? max : max === null || max === undefined ? null : Number(max);
    const minOk = minNum !== null && Number.isFinite(minNum);
    const maxOk = maxNum !== null && Number.isFinite(maxNum);

    const vnLabel = /experience/i.test(label) ? "Kinh nghiệm" : label;

    if (minOk && maxOk) return `${pad}${vnLabel}: ${minNum}–${maxNum} năm`;
    if (minOk) return `${pad}${vnLabel}: tối thiểu ${minNum} năm`;
    if (maxOk) return `${pad}${vnLabel}: tối đa ${maxNum} năm`;
    return `${pad}${vnLabel}:`;
  };

  if (isLabeledNode(input)) {
    const label = String((input as any).label || "").trim();
    const value = (input as any).value;

    const exp = formatExperience(value, label);
    if (exp) return exp;

    const body = labeledJsonToText(value, indent + 1);

    // leaf-ish
    if (value === null || value === undefined) return label ? `${pad}${label}:` : "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return label ? `${pad}${label}: ${String(value)}` : `${pad}${String(value)}`;
    }
    if (Array.isArray(value) && value.every((x) => typeof x !== "object" || x === null)) {
      const items = value.map((x) => String(x)).filter((s) => s.trim().length > 0);
      return label ? `${pad}${label}: ${items.join(", ")}` : `${pad}${items.join(", ")}`;
    }

    if (!label) return body;
    const trimmedBody = body.trim();
    return trimmedBody ? `${pad}${label}:\n${body}` : `${pad}${label}:`;
  }

  if (input === null || input === undefined) return "";
  if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
    return `${pad}${String(input)}`;
  }
  if (Array.isArray(input)) {
    const parts = input
      .map((x) => labeledJsonToText(x, indent + 1).trim())
      .filter(Boolean)
      .map((x) => `${pad}- ${x.replace(/\n/g, `\n${pad}  `)}`);
    return parts.join("\n");
  }
  if (typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>)
      .filter(([k]) => !shouldHideKey(k))
      .map(([k, v]) => {
        // Special-case: canonical experience object → render as a single line.
        if (
          String(k).toLowerCase() === "experience" &&
          v &&
          typeof v === "object" &&
          !Array.isArray(v) &&
          !isLabeledNode(v)
        ) {
          const exp = formatExperience(v, "Kinh nghiệm");
          if (exp) return exp;
        }

        const t = labeledJsonToText(v, indent + 1).trim();
        if (!t) return "";
        // If child already starts with its own label, don't prepend key
        if (isLabeledNode(v)) return t;
        return `${pad}${humanizeKey(k)}:\n${"  ".repeat(indent + 1)}${t.replace(/\n/g, `\n${"  ".repeat(indent + 1)}`)}`;
      })
      .filter(Boolean);
    return entries.join("\n");
  }
  return "";
}

function unwrapLabeledToPlain(input: unknown): unknown {
  if (isLabeledNode(input)) return unwrapLabeledToPlain((input as any).value);
  if (Array.isArray(input)) return input.map((x) => unwrapLabeledToPlain(x));
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (shouldHideKey(k)) continue;
      out[k] = unwrapLabeledToPlain(v);
    }
    return out;
  }
  return input;
}

function asStringOrNull(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : String(v ?? "").trim();
  return s ? s : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim()))
    .filter(Boolean);
}

function section(title: string, lines: string[]): string {
  const body = lines.map((l) => l.trim()).filter(Boolean);
  if (body.length === 0) return "";
  return [`${title}`, ...body.map((l) => `- ${l}`), ""].join("\n");
}

function buildJdText(canonicalUi: any | null, extrasUi: any | null): string {
  const canonical = (unwrapLabeledToPlain(canonicalUi) || {}) as Record<string, any>;
  const extras = (unwrapLabeledToPlain(extrasUi) || {}) as Record<string, any>;

  const labelOf = (key: string, fallback: string) => {
    if (canonicalUi && typeof canonicalUi === "object") {
      const node = (canonicalUi as any)[key];
      if (isLabeledNode(node)) {
        const l = String((node as any).label || "").trim();
        if (l) return l;
      }
    }
    return fallback;
  };

  const header: string[] = [];
  const title = asStringOrNull(canonical.title);
  if (title) header.push(`Vị trí: ${title}`);
  const level = asStringOrNull(canonical.level);
  const seniority = asStringOrNull(canonical.seniority);
  const roleType = asStringOrNull(canonical.roleType);
  const employmentType = asStringOrNull(canonical.employmentType);
  const workModel = asStringOrNull(canonical.workModel);
  const location = asStringOrNull(canonical.location);

  const metaBits = [level, seniority, roleType, employmentType, workModel, location].filter(Boolean);
  if (metaBits.length) header.push(`Thông tin: ${metaBits.join(" • ")}`);

  // Experience
  const exp = canonical.experience && typeof canonical.experience === "object" ? canonical.experience : null;
  const minY = exp ? exp.minYears : null;
  const maxY = exp ? exp.maxYears : null;
  const minOk = typeof minY === "number" && Number.isFinite(minY);
  const maxOk = typeof maxY === "number" && Number.isFinite(maxY);
  if (minOk && maxOk) header.push(`Kinh nghiệm: ${minY}–${maxY} năm`);
  else if (minOk) header.push(`Kinh nghiệm: tối thiểu ${minY} năm`);
  else if (maxOk) header.push(`Kinh nghiệm: tối đa ${maxY} năm`);

  const out: string[] = [];
  if (header.length) out.push(header.join("\n"), "");

  // Responsibilities
  out.push(
    section(
      "Mô tả công việc",
      asStringArray(canonical.responsibilities).length
        ? asStringArray(canonical.responsibilities)
        : asStringArray(canonical.deliverables),
    ),
  );

  // Requirements
  const req = canonical.requirements && typeof canonical.requirements === "object" ? canonical.requirements : {};
  const reqLabel = labelOf("requirements", "Requirements");
  const mustHave = asStringArray((req as any).mustHave);
  const niceToHave = asStringArray((req as any).niceToHave);
  if (mustHave.length || niceToHave.length) {
    const lines: string[] = [];
    if (mustHave.length) {
      lines.push(`- MustHave:`);
      lines.push(...mustHave.map((x) => ` + ${x}`));
    }
    if (niceToHave.length) {
      lines.push(`- NiceToHave:`);
      lines.push(...niceToHave.map((x) => ` + ${x}`));
    }
    out.push([reqLabel, ...lines, ""].join("\n"));
  }

  // Skills / Tech stack
  const tech = canonical.techStack && typeof canonical.techStack === "object" ? canonical.techStack : {};
  const techLines: string[] = [];
  const langs = asStringArray((tech as any).languages);
  const frws = asStringArray((tech as any).frameworks);
  const tools = asStringArray((tech as any).tools);
  const apis = asStringArray((tech as any).apis);
  const plats = asStringArray((tech as any).platforms);
  if (langs.length) techLines.push(`Ngôn ngữ: ${langs.join(", ")}`);
  if (frws.length) techLines.push(`Framework: ${frws.join(", ")}`);
  if (tools.length) techLines.push(`Tools: ${tools.join(", ")}`);
  if (apis.length) techLines.push(`APIs: ${apis.join(", ")}`);
  if (plats.length) techLines.push(`Platforms: ${plats.join(", ")}`);
  out.push(section("Kỹ năng / Tech stack", techLines));

  out.push(
    section("Kiến thức chuyên môn", asStringArray(canonical.knowledgeDomains)),
    section("Kỹ năng mềm", asStringArray(canonical.softSkills)),
    section("Ràng buộc", asStringArray(canonical.constraints)),
  );

  // Working environment (best-effort)
  const env = canonical.workingEnvironment && typeof canonical.workingEnvironment === "object" ? canonical.workingEnvironment : {};
  const envLines: string[] = [];
  const methodology = asStringArray((env as any).methodology);
  const teamInteraction = asStringOrNull((env as any).teamInteraction);
  const language = asStringOrNull((env as any).language);
  const clientFacing = (env as any).clientFacing;
  if (methodology.length) envLines.push(`Methodology: ${methodology.join(", ")}`);
  if (teamInteraction) envLines.push(`Team interaction: ${teamInteraction}`);
  if (typeof clientFacing === "boolean") envLines.push(`Client-facing: ${clientFacing ? "Có" : "Không"}`);
  if (language) envLines.push(`Ngôn ngữ: ${language}`);
  out.push(section("Môi trường làm việc", envLines));

  // Extras: keep human readable
  const extraLines: string[] = [];
  for (const [k, v] of Object.entries(extras)) {
    if (shouldHideKey(k)) continue;
    if (isEmptyValue(v)) continue;
    const keyLabel = humanizeKey(k);
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      extraLines.push(`${keyLabel}: ${String(v)}`);
      continue;
    }
    if (Array.isArray(v)) {
      const xs = asStringArray(v);
      if (xs.length) extraLines.push(`${keyLabel}: ${xs.join(", ")}`);
      continue;
    }
    // object → flatten one level
    if (v && typeof v === "object") {
      const parts: string[] = [];
      for (const [ck, cv] of Object.entries(v as Record<string, unknown>)) {
        if (shouldHideKey(ck)) continue;
        if (isEmptyValue(cv)) continue;
        if (typeof cv === "string" || typeof cv === "number" || typeof cv === "boolean") {
          parts.push(`${humanizeKey(ck)}: ${String(cv)}`);
        } else if (Array.isArray(cv)) {
          const xs = asStringArray(cv);
          if (xs.length) parts.push(`${humanizeKey(ck)}: ${xs.join(", ")}`);
        }
      }
      if (parts.length) extraLines.push(`${keyLabel}: ${parts.join(" • ")}`);
    }
  }
  out.push(section("Thông tin thêm", extraLines));

  return out.join("\n").trim();
}

function ValueEditor(props: {
  label: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const { label, value, onChange } = props;

  if (typeof value === "string") {
    const multiline = value.length > 80 || value.includes("\n");
    return (
      <div className="space-y-2">
        <div className="text-sm font-bold text-on-surface">{label}</div>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface"
          />
        )}
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="space-y-2">
        <div className="text-sm font-bold text-on-surface">{label}</div>
        <input
          type="number"
          value={Number.isFinite(value) ? String(value) : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface"
        />
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/20 bg-surface px-4 py-3">
        <span className="text-sm font-bold text-on-surface">{label}</span>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
      </label>
    );
  }

  if (value === null || value === undefined) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-bold text-on-surface">{label}</div>
        <input
          value={""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="(empty)"
          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface"
        />
      </div>
    );
  }

  if (Array.isArray(value)) {
    const allStrings = value.every((x) => typeof x === "string");
    const allObjects = value.every((x) => x && typeof x === "object" && !Array.isArray(x));
    return (
      <div className="space-y-2">
        <div className="text-sm font-bold text-on-surface">{label}</div>
        {allStrings ? (
          <textarea
            value={(value as string[]).join("\n")}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            rows={Math.min(10, Math.max(3, value.length + 1))}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface"
          />
        ) : allObjects ? (
          <div className="space-y-3">
            {(value as any[]).map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4"
              >
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {label} #{idx + 1}
                </div>
                <ObjectEditor
                  value={item as Record<string, unknown>}
                  onChange={(next) => {
                    const nextArr = [...(value as any[])];
                    nextArr[idx] = next;
                    onChange(nextArr);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant/20 bg-surface px-4 py-3 text-sm text-on-surface-variant">
            Trường dạng danh sách phức tạp. Hãy dùng “JD text view” để xem; hiện tại form không hiển thị JSON.
          </div>
        )}
      </div>
    );
  }

  // objects: render nested fields (no JSON)
  if (value && typeof value === "object") {
    return (
      <div className="space-y-2">
        <div className="text-sm font-bold text-on-surface">{label}</div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
          <ObjectEditor
            value={value as Record<string, unknown>}
            onChange={(next) => onChange(next)}
          />
        </div>
      </div>
    );
  }

  return null;
}

function ObjectEditor(props: {
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const { value, onChange } = props;
  const entries = Object.entries(value || {})
    .filter(([k]) => !shouldHideKey(k))
    .filter(([, v]) => !isEmptyValue(v));

  if (entries.length === 0) {
    return (
      <div className="text-sm text-on-surface-variant">
        (Không có dữ liệu)
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(([k, v]) => {
        const fieldLabel = humanizeKey(k);
        return (
          <div key={k} className="space-y-2">
            <ValueEditor
              label={fieldLabel}
              value={v}
              onChange={(nextVal) => {
                onChange({ ...value, [k]: nextVal });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function LabeledJsonForm(props: {
  title: string;
  data: any;
  onChange: (next: any) => void;
}) {
  const { title, data, onChange } = props;

  const renderNode = (node: any, path: (string | number)[], fallbackLabel: string) => {
    if (isLabeledNode(node)) {
      const label = String(node.label || fallbackLabel || "Field");
      const v = (node as any).value;
      if (isEmptyValue(v)) return null;
      return (
        <div className="rounded-2xl border border-outline-variant/15 bg-surface p-4">
          <ValueEditor
            label={label}
            value={v}
            onChange={(nextVal) => {
              onChange(setAtPath(data, [...path, "value"], nextVal));
            }}
          />
        </div>
      );
    }

    if (Array.isArray(node) || node === null || typeof node !== "object") {
      // Not labeled → edit this node directly as a single value
      if (isEmptyValue(node)) return null;
      return (
        <div className="rounded-2xl border border-outline-variant/15 bg-surface p-4">
          <ValueEditor
            label={fallbackLabel}
            value={node}
            onChange={(nextVal) => onChange(setAtPath(data, path, nextVal))}
          />
        </div>
      );
    }

    const entries = Object.entries(node as Record<string, any>)
      .filter(([k]) => !shouldHideKey(k))
      .filter(([, v]) => {
        if (isLabeledNode(v)) return !isEmptyValue((v as any).value);
        return !isEmptyValue(v);
      });
    if (entries.length === 0) return null;
    return (
      <div className="space-y-3">
        {entries.map(([k, v]) => (
          <div key={k} className="space-y-2">
            {/* If node is already labeled, avoid rendering a duplicate heading */}
            {!isLabeledNode(v) && (
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {humanizeKey(k)}
              </div>
            )}
            {renderNode(v, [...path, k], humanizeKey(k))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        {title}
      </h3>
      {renderNode(data, [], title)}
    </section>
  );
}

export default function AdminJobProfileCreateView() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = String(searchParams.get("id") || "").trim();
  const isEditMode = Boolean(editId);

  const [form, setForm] = useState<JobProfileFormState>(emptyJobProfileForm);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [jdFile, setJdFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { status: jpStatus, latestUpload } = useJpUploadStatus(uploadId);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [descriptionHtml, setDescriptionHtml] = useState<string>("");
  const [descriptionPreviewBusy, setDescriptionPreviewBusy] = useState(false);
  const [descriptionPreviewError, setDescriptionPreviewError] = useState<string | null>(null);

  const [editableCanonicalUi, setEditableCanonicalUi] = useState<any | null>(null);
  const [editableExtras, setEditableExtras] = useState<any | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [aiViewMode, setAiViewMode] = useState<"form" | "jd">("form");

  useEffect(() => {
    if (!uploadId || jpStatus !== "DONE" || !latestUpload) return;
    try {
      const canonicalUiRaw = String((latestUpload as any).aiProfileUiJson || "").trim();
      const extrasRaw = String((latestUpload as any).aiExtrasJson || "").trim();
      const canonicalUi = canonicalUiRaw ? JSON.parse(canonicalUiRaw) : null;
      const extras = extrasRaw ? JSON.parse(extrasRaw) : null;
      setEditableCanonicalUi((prev: any | null) => (prev === null ? canonicalUi : prev));
      setEditableExtras((prev: any | null) => (prev === null ? extras : prev));
    } catch {
      // ignore: keep preview only
    }
    // Hydrate description preview generated by worker (best-effort).
    try {
      const d = stripMarkdownHeadings(String((latestUpload as any)?.description || ""));
      if (d && !String(descriptionHtml || "").trim()) {
        setDescriptionHtml(d);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, jpStatus, latestUpload?.updatedAt]);

  const renderDescriptionPreview = (value: string) => {
    const v = String(value || "").trim();
    if (!v) {
      return (
        <div className="rounded-xl border border-outline-variant/20 bg-surface p-4 text-sm text-on-surface-variant">
          Chưa có mô tả. Bạn có thể bấm “Generate (AI) preview” để tạo lại.
        </div>
      );
    }

    // Only treat as HTML when it looks like an actual tag, not just "<" in text.
    const looksLikeHtml = /^\s*<[a-z][\w-]*(\s[^>]*)?>/i.test(v);
    if (looksLikeHtml) {
      return (
        <div
          className="prose prose-invert max-w-none rounded-xl border border-outline-variant/20 bg-surface p-4"
          dangerouslySetInnerHTML={{ __html: v }}
        />
      );
    }

    return (
      <div className="prose prose-invert max-w-none rounded-xl border border-outline-variant/20 bg-surface p-4">
        <ReactMarkdown>{v}</ReactMarkdown>
      </div>
    );
  };

  const handleGenerateDescriptionPreview = useCallback(async () => {
    if (!uploadId || jpStatus !== "DONE") return;
    setDescriptionPreviewBusy(true);
    setDescriptionPreviewError(null);
    try {
      const { data } = await jobProfileApi.previewUploadDescription(uploadId, { title: form.title });
      const next = String((data as any)?.description || "").trim();
      if (next) setDescriptionHtml(next);
    } catch (e: any) {
      setDescriptionPreviewError(
        String(e?.response?.data?.message || e?.message || "Generate description failed")
      );
    } finally {
      setDescriptionPreviewBusy(false);
    }
  }, [uploadId, jpStatus, form.title]);

  useEffect(() => {
    if (!editableCanonicalUi || typeof editableCanonicalUi !== "object") return;
    const title = String((editableCanonicalUi as any)?.title?.value ?? "").trim();
    if (title && !form.title.trim()) {
      setForm((f) => ({ ...f, title }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableCanonicalUi]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await jobCategoryApi.list({ limit: 200 });
        if (cancelled) return;
        const items = data.items ?? [];
        setCategories(items);
        setForm((f) => {
          return f.categoryId ? f : { ...f, categoryId: items[0]?.id ?? "" };
        });
      } catch {
        if (!cancelled) setError(t("admin.jobCategories.errorLoad"));
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleCancel = useCallback(() => {
    router.push("/admin/dashboard");
  }, [router]);

  // Edit mode: load existing JobProfile to show description for editing.
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    (async () => {
      setEditBusy(true);
      setError(null);
      try {
        const { data } = await jobProfileApi.get(editId);
        if (cancelled) return;
        const desc = stripMarkdownHeadings(String((data as any)?.description || ""));
        setDescriptionHtml(desc);
      } catch (err: unknown) {
        const msg = axios.isAxiosError(err)
          ? String((err.response?.data as { message?: string })?.message ?? err.message)
          : t("admin.jobProfile.error.load");
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setEditBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editId]);

  const canSaveEdit = isEditMode && !editBusy;

  const handleSaveEdit = useCallback(async () => {
    if (!isEditMode || editBusy) return;
    setEditBusy(true);
    setError(null);
    try {
      await jobProfileApi.update(editId, { description: descriptionHtml.trim() ? descriptionHtml : "" });
      router.push(`/admin/job-profiles/${editId}`);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setEditBusy(false);
    }
  }, [isEditMode, editBusy, editId, descriptionHtml, router, t]);

  const pageBusy = loadingCategories;

  const canUpload = Boolean(jdFile) && !uploading && !uploadId;
  const canFinalize = Boolean(uploadId) && jpStatus === "DONE" && !finalizeBusy;
  const canSaveDraft =
    Boolean(uploadId) &&
    jpStatus === "DONE" &&
    !draftSaving &&
    (editableCanonicalUi !== null || editableExtras !== null);

  const handleUploadJd = async () => {
    if (!jdFile || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const { data } = await jobProfileApi.uploadJd(jdFile);
      setUploadId(data.id);

      // Prefill basic form from AI output if possible (best-effort)
      try {
        const uiRaw = String((data as any).aiProfileUiJson ?? "");
        const ui = uiRaw ? JSON.parse(uiRaw) : null;
        const title = String(ui?.title?.value ?? "").trim();
        if (title) {
          setForm((f) => ({ ...f, title }));
        }
      } catch {}
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFinalize = async () => {
    if (!uploadId || finalizeBusy) return;
    if (!form.title.trim() || !form.categoryId) {
      setError("Missing title/category");
      return;
    }
    setFinalizeBusy(true);
    setError(null);
    try {
      const { data } = await jobProfileApi.finalizeUpload(uploadId, {
        title: form.title.trim(),
        categoryId: form.categoryId,
        keywords: keywordsStringToArray(form.keywords),
        status: form.status,
        description: descriptionHtml.trim() ? descriptionHtml : undefined,
      });
      router.push(`/admin/job-profiles/${data.id}`);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setFinalizeBusy(false);
    }
  };

  const handleSaveDraftAiJson = async () => {
    if (!uploadId || draftSaving) return;
    setDraftSaving(true);
    setError(null);
    try {
      await jobProfileApi.updateUpload(uploadId, {
        aiProfileUiJson: editableCanonicalUi,
        aiExtrasJson: editableExtras,
      });
      setDraftSavedAt(new Date().toISOString());
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setDraftSaving(false);
    }
  };

  const renderAiReviewForm = () => {
    if (!uploadId || jpStatus !== "DONE") return null;

    const hasCanonical = editableCanonicalUi && typeof editableCanonicalUi === "object";
    const hasExtras = editableExtras && typeof editableExtras === "object";
    if (!hasCanonical && !hasExtras) return null;

    const jdText = buildJdText(editableCanonicalUi, editableExtras).trim();

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-on-surface-variant">
            AI parsed result (editable){draftSavedAt ? ` • Draft saved` : ""}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAiViewMode((m) => (m === "form" ? "jd" : "form"))}
              className="rounded-xl border border-outline-variant/40 bg-surface px-4 py-2 text-sm font-bold text-on-surface"
            >
              {aiViewMode === "form" ? "JD text view" : "Form view"}
            </button>
            <button
              type="button"
              onClick={handleSaveDraftAiJson}
              disabled={!canSaveDraft}
              className="rounded-xl border border-outline-variant/40 bg-surface px-4 py-2 text-sm font-bold text-on-surface disabled:opacity-50"
            >
              {draftSaving ? "Saving draft…" : "Save draft changes"}
            </button>
          </div>
        </div>

        {aiViewMode === "form" ? (
          <>
            {hasCanonical && (
              <LabeledJsonForm
                title="Canonical (UI)"
                data={editableCanonicalUi}
                onChange={(next) => setEditableCanonicalUi(next)}
              />
            )}
            {hasExtras && (
              <LabeledJsonForm
                title="Extras"
                data={editableExtras}
                onChange={(next) => setEditableExtras(next)}
              />
            )}
          </>
        ) : (
          <section className="rounded-2xl border border-outline-variant/20 bg-surface p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              JD (Text)
            </h3>
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-sm text-on-surface">
              {jdText || "—"}
            </pre>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-w-0 flex-col">
      <header className="mb-8 flex min-w-0 flex-col gap-3 border-b border-outline-variant/20 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {isEditMode ? "Quay lại" : t("admin.jobProfile.createPage.back")}
          </Link>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {isEditMode ? "Chỉnh sửa Job Description" : t("admin.jobProfile.createPage.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            {isEditMode
              ? "Cập nhật mô tả công việc (description) để ứng viên xem. Nhấn “Save changes” để lưu."
              : t("admin.jobProfile.createPage.subtitle")}
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      <div className="min-w-0">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            {pageBusy ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
            ) : (
              <div className="space-y-6">
                {!isEditMode && uploadId && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/15 bg-surface px-4 py-3">
                    <div className="text-sm font-semibold text-on-surface">
                      Upload ID: <span className="font-mono text-on-surface-variant">{uploadId}</span>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Status: <span className="text-primary">{jpStatus ?? "—"}</span>
                    </div>
                  </div>
                )}

                {/* Upload */}
                {!isEditMode && (
                  <section className="rounded-2xl border border-outline-variant/20 bg-surface p-6 shadow-sm">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-widest text-primary">
                        Upload Job Description
                      </div>
                      <div className="mt-1 text-sm text-on-surface-variant">
                        Upload JD (PDF, DOCX, Image). AI sẽ tự động phân tích và điền thông tin.
                      </div>
                    </div>
                  </div>
                
                  {/* Drop zone */}
                  <label className="group block cursor-pointer">
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/40 bg-surface-container/30 px-6 py-8 text-center transition hover:border-primary hover:bg-primary/5">

                      <div className="rounded-xl bg-primary/10 p-2">
                      <span className="material-symbols-outlined text-primary">
                        cloud_upload
                      </span>
                    </div>
                
                      <div className="text-sm font-semibold text-on-surface">
                        Drag & drop file hoặc click để upload
                      </div>
                
                      <div className="mt-1 text-xs text-on-surface-variant">
                        PDF, DOCX, PNG, JPG, WEBP (max 10MB)
                      </div>
                
                      <input
                        type="file"
                        accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
                        onChange={(e) => setJdFile(e.target.files?.[0] ?? null)}
                        disabled={uploading || Boolean(uploadId)}
                        className="hidden"
                      />
                    </div>
                  </label>
                
                  {/* Selected file */}
                  {jdFile && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-primary">
                          description
                        </span>
                        <span className="font-medium">{jdFile.name}</span>
                      </div>
                
                      <button
                        onClick={() => setJdFile(null)}
                        className="text-xs text-on-surface-variant hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                
                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleUploadJd}
                      disabled={!canUpload}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:opacity-90 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        auto_awesome
                      </span>
                      {uploading ? "Parsing with AI..." : "Upload & Parse with AI"}
                    </button>
                
                    <button
                      type="button"
                      onClick={() => {
                        setUploadId(null);
                        setJdFile(null);
                      }}
                      disabled={uploading}
                      className="rounded-xl border border-outline-variant/40 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
                    >
                      Reset
                    </button>
                  </div>
                </section>
                )}

<section className="rounded-2xl border border-outline-variant/20 bg-surface p-6">
  {/* Header */}
  <div className="mb-5 flex items-start justify-between">
    <div>
      <div className="text-xs font-bold uppercase tracking-widest text-primary">
        {isEditMode ? "Edit Job Profile" : "Description"}
      </div>

      <p className="mt-1 text-sm text-on-surface-variant">
        {isEditMode
          ? "Chỉnh sửa nội dung hiển thị cho ứng viên"
          : "AI sẽ generate description, bạn có thể chỉnh sửa trước khi lưu"}
      </p>
    </div>
  </div>

  {renderAiReviewForm() ?? null}
        

  {/* Meta fields */}
  {!isEditMode && (
    <div className="mb-5 rounded-xl border border-outline-variant/20 bg-surface-container/30 p-4">
      <div className="mb-3 text-xs font-semibold uppercase text-on-surface-variant">
        Job Information
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-on-surface-variant">
            Title
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-outline-variant/30 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-on-surface-variant">
            Category
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="w-full rounded-lg border border-outline-variant/30 px-3 py-2.5 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-on-surface-variant">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as any }))
            }
            className="w-full rounded-lg border border-outline-variant/30 px-3 py-2.5 text-sm"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-on-surface-variant">
            Keywords
          </label>
          <input
            value={form.keywords}
            onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            placeholder="nestjs, aws, docker"
            className="w-full rounded-lg border border-outline-variant/30 px-3 py-2.5 text-sm"
          />
        </div>
      </div>
    </div>
  )}

  {/* Description editor */}
  <div className="rounded-xl border border-outline-variant/20">
    {/* header */}
    <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-2">
      <span className="text-sm font-semibold">Job Description</span>
    </div>
    <div data-color-mode="light" className="rounded-b-xl">
      <MDEditor
        value={descriptionHtml}
        onChange={(v) => setDescriptionHtml(String(v || ""))}
        preview="edit"
        height={320}
        textareaProps={{ placeholder: "Write job description..." }}
      />
    </div>
  </div>

  {/* Preview */}
  <div className="mt-5 rounded-xl border border-outline-variant/20 bg-surface-container/30 p-4">
    <div className="mb-2 text-xs font-semibold uppercase text-on-surface-variant">
      Candidate Preview
    </div>

    <div className="prose prose-sm max-w-none">
      {renderDescriptionPreview(descriptionHtml)}
    </div>
  </div>

  {/* Actions */}
  <div className="mt-6 flex justify-end gap-2">
    <button
      onClick={handleCancel}
      className="rounded-xl border border-outline-variant/40 px-4 py-2.5 text-sm font-medium"
    >
      Cancel
    </button>

    {isEditMode ? (
      <button
        onClick={handleSaveEdit}
        disabled={!canSaveEdit}
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
      >
        {editBusy ? "Saving..." : "Save changes"}
      </button>
    ) : (
      <button
        onClick={handleFinalize}
        disabled={!canFinalize}
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
      >
        {finalizeBusy ? "Saving..." : "Save Job"}
      </button>
    )}
  </div>
</section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 
