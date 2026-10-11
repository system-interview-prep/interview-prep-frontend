"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import MDEditor from "@uiw/react-md-editor";
import { taxonomyApi, type TaxonomyConcept } from "@/lib/api/taxonomyApi";
import {
  emptyJobProfileForm,
  jobProfileApi,
  keywordsStringToArray,
  type JobProfileFormState,
  type CanonicalFinalizeFormState,
  type JobDescriptionVersion,
  initialFinalizeForm,
  serializeFinalizePayload,
} from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { useJpUploadStatus } from "@features/resume/hooks/useJpUploadStatus";
import { ArrowLeft, UploadCloud, FileText, Building2, MapPin, Briefcase, Clock, Coins, Globe, Upload, Trash2, CheckCircle2, Eye, LoaderCircle } from "lucide-react";
import { getCompanyInitials } from "@/components/jobs/job-card.utils";
import { humanizeKey } from "@/utils";
import CanonicalJdReview from "./job-description/CanonicalJdReview";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";

export { type CanonicalFinalizeFormState, initialFinalizeForm };

function findEvidenceForField(structuredData: any, prefix: string): string | null {
  if (!structuredData || typeof structuredData !== "object") return null;
  const evidenceList = Array.isArray(structuredData.evidence) ? structuredData.evidence : [];
  const match = evidenceList.find((ev: any) => typeof ev?.evidenceId === "string" && ev.evidenceId.startsWith(prefix));
  if (match?.text) return String(match.text).trim();
  return null;
}

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
  const { t } = useLanguage();

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
          placeholder={t("fixAdmin.jp.editor.empty")}
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
            {t("fixAdmin.jp.editor.complexList")}
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
  const { t } = useLanguage();
  const entries = Object.entries(value || {})
    .filter(([k]) => !shouldHideKey(k))
    .filter(([, v]) => !isEmptyValue(v));

  if (entries.length === 0) {
    return (
      <div className="text-sm text-on-surface-variant">
        {t("fixAdmin.jp.editor.noData")}
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
  const { t } = useLanguage();

  const renderNode = (node: any, path: (string | number)[], fallbackLabel: string) => {
    if (isLabeledNode(node)) {
      const label = String(node.label || fallbackLabel || t("fixAdmin.jp.editor.field"));
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
  const draftUploadId = String(searchParams.get("upload") || "").trim();
  const isEditMode = Boolean(editId);

  const [form, setForm] = useState<JobProfileFormState>(emptyJobProfileForm);
  const [finalizeForm, setFinalizeForm] = useState<CanonicalFinalizeFormState>(initialFinalizeForm);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(t("fixAdmin.jp.err.logoTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFinalizeForm((f) => ({ ...f, companyLogoUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const [parserEvidence, setParserEvidence] = useState<{
    company?: string | null;
    location?: string | null;
    experience?: string | null;
    salary?: string | null;
  }>({});

  const [taxonomyConcepts, setTaxonomyConcepts] = useState<TaxonomyConcept[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [jdFile, setJdFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(draftUploadId || null);
  const [uploading, setUploading] = useState(false);
  const { status: jpStatus, latestUpload, restartTracking } = useJpUploadStatus(uploadId);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [reparseBusy, setReparseBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [descriptionHtml, setDescriptionHtml] = useState<string>("");
  const [versions, setVersions] = useState<JobDescriptionVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<JobDescriptionVersion | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionBusy, setVersionBusy] = useState(false);

  const [editableCanonicalUi, setEditableCanonicalUi] = useState<any | null>(null);
  const [editableExtras, setEditableExtras] = useState<any | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [aiViewMode, setAiViewMode] = useState<"review" | "advanced">("review");

  useEffect(() => {
    if (!uploadId || jpStatus !== "DONE" || !latestUpload) return;
    try {
      const canonicalUi = latestUpload.structuredData ?? null;
      const extras = latestUpload.extractedMetadata ?? null;
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
          {t("fixAdmin.jp.preview.empty")}
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

  useEffect(() => {
    if (!editableCanonicalUi || typeof editableCanonicalUi !== "object") return;
    const sd = editableCanonicalUi;

    // Detect parser evidence spans for UI badges
    const compEv = findEvidenceForField(sd, "ev-jd-company");
    const locEv = findEvidenceForField(sd, "ev-jd-location") || (typeof sd.location === "string" && sd.location ? sd.location : null);
    const expEv = findEvidenceForField(sd, "ev-jd-experience") || (typeof sd.experienceRaw === "string" && sd.experienceRaw ? sd.experienceRaw : null);
    const salEv = findEvidenceForField(sd, "ev-jd-salary") || (typeof sd.salaryRaw === "string" && sd.salaryRaw ? sd.salaryRaw : null);

    setParserEvidence({
      company: compEv,
      location: locEv,
      experience: expEv,
      salary: salEv,
    });

    // Prefill form from parser proposal, but allow admin to freely edit
    setFinalizeForm((prev) => ({
      ...prev,
      title: prev.title || String(sd.jobTitle || sd.title || "").trim(),
      companyName: prev.companyName || String(sd.companyName || "").trim(),
      location: prev.location || String(sd.location || "").trim(),
      workMode: prev.workMode || (["remote", "hybrid", "on_site"].includes(sd.workMode) ? sd.workMode : ""),
      employmentType: prev.employmentType || (["full_time", "part_time", "internship", "contract", "temporary"].includes(sd.employmentType) ? sd.employmentType : ""),
      seniority: prev.seniority || (["intern", "junior", "mid", "senior", "lead", "manager", "director"].includes(sd.seniority) ? sd.seniority : ""),
      experienceMinYears: prev.experienceMinYears || (sd.experienceMinYears != null ? String(sd.experienceMinYears) : ""),
      experienceMaxYears: prev.experienceMaxYears || (sd.experienceMaxYears != null ? String(sd.experienceMaxYears) : ""),
      salaryMin: prev.salaryMin || (sd.salaryMin != null ? String(sd.salaryMin) : ""),
      salaryMax: prev.salaryMax || (sd.salaryMax != null ? String(sd.salaryMax) : ""),
      salaryCurrency: prev.salaryCurrency || String(sd.salaryCurrency || "VND"),
      salaryPeriod: prev.salaryPeriod || (["hour", "month", "year"].includes(sd.salaryPeriod) ? sd.salaryPeriod : ""),
      salaryNegotiable: prev.salaryNegotiable !== "unknown" ? prev.salaryNegotiable : (sd.salaryNegotiable === true ? "yes" : sd.salaryNegotiable === false ? "no" : "unknown"),
    }));

    const title = String(sd.jobTitle ?? "").trim();
    if (title && !form.title.trim()) {
      setForm((f) => ({ ...f, title }));
    }
    const classifications =
      sd.career_classifications ??
      sd.careerClassifications;
    if (Array.isArray(classifications) && classifications.length > 0) {
      const primary = classifications.find((c: any) => c?.is_primary || c?.isPrimary) ?? classifications[0];
      if (primary?.code) {
        if (!form.primaryTaxonomyConceptId) {
          setForm((f) => ({ ...f, primaryTaxonomyConceptId: primary.code }));
        }
        setFinalizeForm((f) => ({ ...f, primaryTaxonomyConceptId: f.primaryTaxonomyConceptId || primary.code }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableCanonicalUi]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await taxonomyApi.getActive();
        if (cancelled) return;
        const allConcepts = data.concepts ?? [];
        const filtered = allConcepts.filter((concept) =>
          ["domain", "occupation", "job_family", "competency", "job_role", "specialization"].includes(concept.kind)
        );
        const items = filtered.length > 0 ? filtered : allConcepts;
        setTaxonomyConcepts(items);
        setForm((f) => {
          // A parsed upload will supply its own primary classification.  Do
          // not race it by selecting the first taxonomy item while parsing.
          if (uploadId) return f;
          return f.primaryTaxonomyConceptId ? f : { ...f, primaryTaxonomyConceptId: items[0]?.concept_id ?? "" };
        });
      } catch {
        if (!cancelled) setError(t("fixAdmin.jp.err.taxonomy"));
      } finally {
        if (!cancelled) setLoadingTaxonomy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t, uploadId]);

  const handleCancel = useCallback(() => {
    router.push("/admin/job-descriptions");
  }, [router]);

  // Edit mode: load existing JobProfile to show description for editing.
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    (async () => {
      setEditBusy(true);
      setError(null);
      try {
        const [{ data }, { data: versionData }] = await Promise.all([
          jobProfileApi.get(editId),
          jobProfileApi.listVersions(editId),
        ]);
        if (cancelled) return;
        const desc = stripMarkdownHeadings(String((data as any)?.description || ""));
        setDescriptionHtml(desc);
        setVersions(versionData.items ?? []);
        setFinalizeForm((f) => ({ ...f, title: data.title || "", companyName: data.company?.name || "", location: data.location || "", workMode: data.workMode || "", employmentType: data.employmentType || "", seniority: data.seniority || "", primaryTaxonomyConceptId: data.primaryTaxonomy?.conceptId || "", keywords: (data.keywords || []).join(", "), listingStatus: data.listingStatus === "ACTIVE" ? "ACTIVE" : "DRAFT" }));
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

  const refreshVersions = useCallback(async () => {
    if (!editId) return;
    const { data } = await jobProfileApi.listVersions(editId);
    setVersions(data.items ?? []);
  }, [editId]);

  const handleViewVersion = useCallback(async (versionId: string) => {
    if (!editId) return;
    setError(null);
    try {
      const { data } = await jobProfileApi.getVersion(editId, versionId);
      setSelectedVersion(data);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String((err.response?.data as any)?.detail ?? err.message) : t("fixAdmin.jp.err.loadVersion"));
    }
  }, [editId, t]);

  useEffect(() => {
    if (!isEditMode || !versions.some((v) => ["PENDING", "PROCESSING"].includes(v.processingStatus))) return;
    const timer = window.setInterval(() => void refreshVersions(), 2000);
    return () => window.clearInterval(timer);
  }, [isEditMode, versions, refreshVersions]);

  useEffect(() => {
    if (!isEditMode || versions.length === 0) return;
    const summary = selectedVersion
      ? versions.find((version) => version.id === selectedVersion.id)
      : versions.find((version) => version.status === "ACTIVE") ?? versions[0];
    if (!summary) return;
    if (!selectedVersion || summary.processingStatus !== selectedVersion.processingStatus || summary.status !== selectedVersion.status) {
      void handleViewVersion(summary.id);
    }
  }, [isEditMode, versions, selectedVersion, handleViewVersion]);

  const handleCreateVersion = async () => {
    if (!editId || !versionFile || versionBusy) return;
    setVersionBusy(true);
    setError(null);
    try {
      const { data } = await jobProfileApi.createVersion(editId, versionFile);
      setVersionFile(null);
      setSelectedVersion(data);
      await refreshVersions();
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String((err.response?.data as any)?.detail ?? err.message) : t("fixAdmin.jp.err.createVersion"));
    } finally {
      setVersionBusy(false);
    }
  };

  const [confirmAction, setConfirmAction] = useState<
    { kind: "publish"; versionId: string } | { kind: "delete" } | null
  >(null);

  const handlePublishVersion = (versionId: string) => {
    if (!editId || versionBusy) return;
    setConfirmAction({ kind: "publish", versionId });
  };

  const doPublishVersion = async (versionId: string) => {
    if (!editId || versionBusy) return;
    setConfirmAction(null);
    setVersionBusy(true);
    setError(null);
    try {
      await jobProfileApi.publishVersion(editId, versionId);
      await refreshVersions();
      await handleViewVersion(versionId);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String((err.response?.data as any)?.detail ?? err.message) : t("fixAdmin.jp.err.publishVersion"));
    } finally {
      setVersionBusy(false);
    }
  };

  const handleSaveEdit = useCallback(async () => {
    if (!isEditMode || editBusy) return;
    setEditBusy(true);
    setError(null);
    try {
      await jobProfileApi.update(editId, serializeFinalizePayload(finalizeForm, finalizeForm.title, descriptionHtml));
      router.push(`/admin/job-descriptions/${editId}`);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setEditBusy(false);
    }
  }, [isEditMode, editBusy, editId, finalizeForm, descriptionHtml, router, t]);

  const pageBusy = loadingTaxonomy;

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
      router.replace(`/admin/job-descriptions/create?upload=${encodeURIComponent(data.id)}`);

    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFinalize = async (listingStatus: "DRAFT" | "ACTIVE") => {
    if (!uploadId || finalizeBusy) return;
    const title = finalizeForm.title.trim();
    if (!title) {
      setError(t("fixAdmin.jp.err.titleRequired"));
      return;
    }

    // Salary metadata is optional; only reject an internally inconsistent range.
    const hasNumericSalary = Boolean(finalizeForm.salaryMin.trim() || finalizeForm.salaryMax.trim());
    if (hasNumericSalary) {
      const minNum = Number(finalizeForm.salaryMin.trim() || 0);
      const maxNum = Number(finalizeForm.salaryMax.trim() || 0);
      if (finalizeForm.salaryMin.trim() && finalizeForm.salaryMax.trim() && minNum > maxNum) {
        setError(t("fixAdmin.jp.err.salaryRange"));
        return;
      }
    }

    // Validate experience range if both provided
    if (finalizeForm.experienceMinYears.trim() && finalizeForm.experienceMaxYears.trim()) {
      const minExp = Number(finalizeForm.experienceMinYears.trim());
      const maxExp = Number(finalizeForm.experienceMaxYears.trim());
      if (minExp > maxExp) {
        setError(t("fixAdmin.jp.err.expRange"));
        return;
      }
    }

    setFinalizeBusy(true);
    setError(null);
    try {
      const payload = serializeFinalizePayload(
        { ...finalizeForm, listingStatus },
        title,
        descriptionHtml
      );

      const { data } = await jobProfileApi.finalizeUpload(uploadId, payload);
      router.push(`/admin/job-descriptions/${data.id}`);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string; detail?: any })?.detail || ((err.response?.data as any)?.message ?? err.message))
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setFinalizeBusy(false);
    }
  };

  const handleDelete = () => {
    const targetId = isEditMode ? editId : uploadId;
    if (!targetId) return;
    setConfirmAction({ kind: "delete" });
  };

  const doDelete = async () => {
    const targetId = isEditMode ? editId : uploadId;
    setConfirmAction(null);
    if (!targetId) return;
    setError(null);
    try {
      if (isEditMode) {
        await jobProfileApi.delete(targetId);
      } else {
        await jobProfileApi.deleteUpload(targetId);
      }
      router.push("/admin/job-descriptions");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    }
  };

  const handleReparse = async () => {
    if (!uploadId || reparseBusy) return;
    setReparseBusy(true);
    setError(null);
    try {
      await jobProfileApi.reparseUpload(uploadId);
      setEditableCanonicalUi(null);
      setEditableExtras(null);
      setDraftSavedAt(null);
      restartTracking();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setReparseBusy(false);
    }
  };

  const handleSaveDraftAiJson = async () => {
    if (!uploadId || draftSaving) return;
    setDraftSaving(true);
    setError(null);
    try {
      await jobProfileApi.updateUpload(uploadId, {
        structuredData: editableCanonicalUi,
        extractedMetadata: editableExtras,
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

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-[#607096]">
            {t("fixAdmin.jp.ai.extracted")}{draftSavedAt ? t("fixAdmin.jp.ai.saved") : ""}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAiViewMode((m) => (m === "review" ? "advanced" : "review"))}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-1.5 text-xs font-bold text-[#14244B] shadow-2xs hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195] transition-all"
            >
              {aiViewMode === "review" ? t("fixAdmin.jp.ai.advanced") : t("fixAdmin.jp.ai.evidence")}
            </button>
            <button
              type="button"
              onClick={handleSaveDraftAiJson}
              disabled={!canSaveDraft}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[#204195] hover:bg-[#183275] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50"
            >
              {draftSaving ? t("fixAdmin.jp.saving") : t("fixAdmin.jp.saveChanges")}
            </button>
          </div>
        </div>

        {aiViewMode === "review" && hasCanonical ? (
          <CanonicalJdReview data={editableCanonicalUi as Record<string, unknown>} />
        ) : (
          <>
            {hasCanonical && (
              <LabeledJsonForm
                title={t("fixAdmin.jp.ai.structuredTitle")}
                data={editableCanonicalUi}
                onChange={(next) => setEditableCanonicalUi(next)}
              />
            )}
            {hasExtras && (
              <details className="rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-2xs">
                <summary className="cursor-pointer text-sm font-bold text-[#14244B]">{t("fixAdmin.jp.ai.technicalTitle")}</summary>
                <div className="mt-4">
                  <LabeledJsonForm
                    title={t("fixAdmin.jp.ai.technicalTitle")}
                    data={editableExtras}
                    onChange={(next) => setEditableExtras(next)}
                  />
                </div>
              </details>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto min-w-0 max-w-[1400px] space-y-6">
      <header className="flex min-w-0 flex-col gap-3 border-b border-[#EAEFF8] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/job-descriptions"
            className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#204195]/8 border border-[#204195]/15 px-3 py-1 text-xs font-semibold text-[#204195] transition-colors hover:bg-[#204195]/15"
          >
            <ArrowLeft className="size-3.5" />
            {isEditMode ? t("admin.jobProfile.detail.back") : t("admin.jobProfile.createPage.back")}
          </Link>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-[#14244B] md:text-3xl">
            {isEditMode ? t("fixAdmin.jp.editTitle") : t("admin.jobProfile.createPage.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#607096]">
            {isEditMode
              ? t("fixAdmin.jp.editSubtitle")
              : t("admin.jobProfile.createPage.subtitle")}
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-[#C43B3B]/30 bg-[#FDF2F2] px-4 py-3 text-sm text-[#C43B3B] shadow-xs" role="alert">
          {error}
        </div>
      )}

      <div className="min-w-0">
        <div className="w-full">
          <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs md:p-8">
            {pageBusy ? (
              <p className="py-10 text-center text-sm text-[#607096]">{t("admin.jobProfile.loading")}</p>
            ) : (
              <div className="space-y-6">
                {isEditMode && (
                  <section className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
                    <div className="border-b border-[#DCE4F3] bg-gradient-to-r from-[#EEF2FD] to-white p-5 md:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div>
                            <h2 className="font-headline text-lg font-bold text-[#14244B]">{t("fixAdmin.jp.versions.title")}</h2>
                            <p className="mt-1 max-w-xl text-sm text-[#607096]">{t("fixAdmin.jp.versions.hint")}</p>
                          </div>
                        </div>
                        <label className="group cursor-pointer rounded-xl border-2 border-dashed border-[#AFC0E5] bg-white px-4 py-3 transition hover:border-[#204195] hover:bg-[#F8FAFF]">
                          <div className="flex items-center gap-3">
                            <UploadCloud className="size-5 text-[#204195]" />
                            <div>
                              <div className="text-xs font-bold text-[#14244B]">{versionFile?.name || t("fixAdmin.jp.versions.chooseFile")}</div>
                              <div className="text-[11px] text-[#607096]">{t("fixAdmin.jp.versions.fileTypes")}</div>
                            </div>
                          </div>
                          <input type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)} className="hidden" />
                        </label>
                      </div>
                      {versionFile && (
                        <div className="mt-4 flex justify-end">
                          <button type="button" onClick={handleCreateVersion} disabled={versionBusy}
                            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#204195] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#183275] disabled:opacity-50">
                            {versionBusy ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                            {versionBusy ? t("fixAdmin.jp.versions.creating") : t("fixAdmin.jp.versions.create")}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid min-w-0 lg:grid-cols-[340px_1fr]">
                      <div className="space-y-2 border-b border-[#DCE4F3] bg-[#F8FAFC] p-4 lg:border-b-0 lg:border-r">
                        {versions.map((version) => {
                          const active = selectedVersion?.id === version.id;
                          const parsing = ["PENDING", "PROCESSING"].includes(version.processingStatus);
                          return (
                            <button key={version.id} type="button" onClick={() => void handleViewVersion(version.id)}
                              className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-[#204195] bg-white shadow-sm ring-2 ring-[#204195]/10" : "border-[#DCE4F3] bg-white/70 hover:border-[#AFC0E5] hover:bg-white"}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-[#14244B] px-2 py-1 text-[11px] font-bold text-white">v{version.versionNumber}</span>
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${version.status === "ACTIVE" ? "bg-[#EAF5EE] text-[#287A4B]" : version.status === "DRAFT" ? "bg-[#FCB625]/15 text-[#7A5600]" : "bg-[#F0F4FC] text-[#607096]"}`}>{version.status === "ACTIVE" ? t("fixAdmin.jp.status.active") : version.status === "DRAFT" ? t("fixAdmin.jp.status.draft") : t("fixAdmin.jp.status.superseded")}</span>
                                  </div>
                                  <div className="mt-2 truncate text-xs font-semibold text-[#14244B]">{version.filename || t("fixAdmin.jp.versions.noFilename")}</div>
                                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#607096]">
                                    {parsing ? <LoaderCircle className="size-3 animate-spin text-[#204195]" /> : <CheckCircle2 className="size-3 text-[#287A4B]" />}
                                    {fmt(t("fixAdmin.jp.versions.parser"), { status: version.processingStatus })}
                                  </div>
                                </div>
                                <Eye className="mt-1 size-4 shrink-0 text-[#607096]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="min-w-0 p-5 md:p-6">
                        {!selectedVersion ? (
                          <div className="flex min-h-48 items-center justify-center text-sm text-[#607096]">{t("fixAdmin.jp.versions.pick")}</div>
                        ) : selectedVersion.processingStatus !== "DONE" ? (
                          <div className="flex min-h-56 flex-col items-center justify-center text-center">
                            <LoaderCircle className="size-8 animate-spin text-[#204195]" />
                            <div className="mt-3 font-bold text-[#14244B]">{fmt(t("fixAdmin.jp.versions.parsing"), { n: selectedVersion.versionNumber })}</div>
                            <p className="mt-1 text-sm text-[#607096]">{t("fixAdmin.jp.versions.parsingHint")}</p>
                            {selectedVersion.error && <p className="mt-3 rounded-lg bg-[#FDF2F2] px-3 py-2 text-xs text-[#C43B3B]">{selectedVersion.error}</p>}
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAEFF8] pb-4">
                              <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-[#204195]">{fmt(t("fixAdmin.jp.versions.parsed"), { n: selectedVersion.versionNumber })}</div>
                                <div className="mt-1 text-xs text-[#607096]">{t("fixAdmin.jp.versions.parsedHint")}</div>
                              </div>
                              {selectedVersion.status !== "ACTIVE" && (
                                <button type="button" onClick={() => handlePublishVersion(selectedVersion.id)} disabled={versionBusy}
                                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#287A4B] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#21653E] disabled:opacity-50">
                                  <CheckCircle2 className="size-4" /> {t("fixAdmin.jp.versions.publish")}
                                </button>
                              )}
                            </div>
                            {selectedVersion.structuredData ? (
                              <CanonicalJdReview data={selectedVersion.structuredData} />
                            ) : selectedVersion.rawText ? (
                              renderDescriptionPreview(selectedVersion.rawText)
                            ) : (
                              <div className="rounded-xl bg-[#FCB625]/10 p-4 text-sm text-[#7A5600]">{t("fixAdmin.jp.versions.noData")}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}
                {!isEditMode && uploadId && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-4 py-3 shadow-2xs">
                    <div className="text-sm font-semibold text-[#14244B]">
                      {t("fixAdmin.jp.uploadId")} <span className="font-mono text-[#607096]">{uploadId}</span>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#607096]">
                      {t("fixAdmin.jp.statusLabel")}: <span className="text-[#204195]">{jpStatus ?? "—"}</span>
                    </div>
                  </div>
                )}

                {!isEditMode && uploadId && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleReparse}
                      disabled={reparseBusy || jpStatus === "PARSING" || jpStatus === "PENDING"}
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-1.5 text-xs font-bold text-[#14244B] shadow-2xs hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195] transition-all disabled:opacity-50"
                    >
                      {reparseBusy ? t("fixAdmin.jp.reparsing") : t("fixAdmin.jp.reparse")}
                    </button>
                  </div>
                )}

                {/* Upload */}
                {!isEditMode && (
                  <section className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC]/50 p-6 shadow-2xs">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-widest text-[#204195]">
                        {t("fixAdmin.jp.upload.heading")}
                      </div>
                      <div className="mt-1 text-xs sm:text-sm text-[#607096]">
                        {t("fixAdmin.jp.upload.hint")}
                      </div>
                    </div>
                  </div>
                
                  {/* Drop zone */}
                  <label className="group block cursor-pointer">
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DCE4F3] bg-white px-6 py-10 text-center transition-all hover:border-[#204195] hover:bg-[#F0F4FC]/40">
                      <div className="rounded-2xl bg-[#EEF2FD] border border-[#204195]/15 p-3 text-[#204195] mb-2">
                        <UploadCloud className="size-6 text-[#204195]" />
                      </div>
                
                      <div className="text-sm font-bold text-[#14244B]">
                        {t("fixAdmin.jp.upload.drop")}
                      </div>
                
                      <div className="mt-1 text-xs text-[#607096]">
                        {t("fixAdmin.jp.upload.formats")}
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
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-[#DCE4F3] bg-white px-4 py-2.5 shadow-2xs">
                      <div className="flex items-center gap-2.5 text-sm">
                        <FileText className="size-5 text-[#204195]" />
                        <span className="font-semibold text-[#14244B]">{jdFile.name}</span>
                      </div>
                
                      <button
                        onClick={() => setJdFile(null)}
                        className="text-xs font-semibold text-[#607096] transition-colors hover:text-[#C43B3B]"
                      >
                        {t("fixAdmin.jp.upload.remove")}
                      </button>
                    </div>
                  )}
                
                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleUploadJd}
                      disabled={!canUpload}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#204195] hover:bg-[#183275] active:bg-[#122557] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                      {uploading ? t("fixAdmin.jp.upload.busy") : t("fixAdmin.jp.upload.submit")}
                    </button>
                
                    <button
                      type="button"
                      onClick={() => {
                        setUploadId(null);
                        setJdFile(null);
                      }}
                      disabled={uploading}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#DCE4F3] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#14244B] shadow-xs hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("fixAdmin.jp.upload.reset")}
                    </button>
                  </div>
                </section>
                )}

<section className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs md:p-8">
  {/* Header */}
  <div className="mb-6 flex items-start justify-between">
    <div>
      <div className="text-xs font-bold uppercase tracking-widest text-[#204195]">
        {isEditMode ? t("fixAdmin.jp.content.editTitle") : t("fixAdmin.jp.content.title")}
      </div>

      <p className="mt-1 text-xs sm:text-sm text-[#607096]">
        {isEditMode
          ? t("fixAdmin.jp.content.editHint")
          : t("fixAdmin.jp.content.hint")}
      </p>
    </div>
  </div>

  {renderAiReviewForm() ?? null}
        

  {/* Canonical Review & Finalize Form */}
  {(
    <div className="mb-8 space-y-5">
      {/* 1. Basic Information */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC]/60 p-5 md:p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
          <FileText className="size-4" />
          <span>{t("fixAdmin.jp.section.basic")}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-[#14244B]">
              {t("fixAdmin.jp.field.title")} <span className="text-[#C43B3B]">*</span>
            </label>
            <input
              value={finalizeForm.title}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("fixAdmin.jp.ph.title")}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.taxonomy")}
            </label>
            <select
              value={finalizeForm.primaryTaxonomyConceptId}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, primaryTaxonomyConceptId: e.target.value }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="">{t("fixAdmin.jp.opt.noTaxonomy")}</option>
              {taxonomyConcepts.map((concept) => (
                <option key={concept.concept_id} value={concept.concept_id}>
                  {concept.label} {concept.kind ? `(${concept.kind})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.keywords")}
            </label>
            <input
              value={finalizeForm.keywords}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, keywords: e.target.value }))}
              placeholder={t("fixAdmin.jp.ph.keywords")}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Company */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC]/60 p-5 md:p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
          <Building2 className="size-4" />
          <span>{t("fixAdmin.jp.section.company")}</span>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#14244B]">
              {t("fixAdmin.jp.field.companyName")}
            </label>
            <input
              value={finalizeForm.companyName}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, companyName: e.target.value }))}
              placeholder={t("fixAdmin.jp.ph.company")}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
            {parserEvidence.company && (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-[#EEF2FD] border border-[#204195]/15 px-2.5 py-1 text-[11px] font-semibold text-[#204195]">
                <span className="truncate">{fmt(t("fixAdmin.jp.suggestion"), { text: parserEvidence.company })}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#14244B]">
              {t("fixAdmin.jp.field.companyLogo")}
            </label>

            <div className="flex items-start gap-4">
              {/* Logo Preview Avatar */}
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-2xs">
                {finalizeForm.companyLogoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={finalizeForm.companyLogoUrl}
                    alt={t("fixAdmin.jp.logoPreviewAlt")}
                    className="h-full w-full object-cover"
                  />
                ) : finalizeForm.companyName ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#EEF2FD] font-bold text-base text-[#204195] select-none">
                    {getCompanyInitials(finalizeForm.companyName)}
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#F1F5F9] text-[#94A3B8]">
                    <Building2 className="size-6" />
                  </div>
                )}
              </div>

              {/* Upload button & URL input */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-1.5 text-xs font-bold text-[#14244B] shadow-2xs hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195] transition-all active:scale-95"
                  >
                    <Upload className="size-3.5 text-[#204195]" />
                    <span>{t("fixAdmin.jp.logo.choose")}</span>
                  </button>

                  {finalizeForm.companyLogoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFinalizeForm((f) => ({ ...f, companyLogoUrl: "" }));
                        if (logoFileInputRef.current) logoFileInputRef.current.value = "";
                      }}
                      className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-[#C43B3B]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#C43B3B] shadow-2xs hover:bg-[#FDF2F2] transition-all"
                    >
                      <Trash2 className="size-3.5" />
                      <span>{t("fixAdmin.jp.logo.remove")}</span>
                    </button>
                  )}
                </div>

                <input
                  value={finalizeForm.companyLogoUrl.startsWith("data:") ? "" : finalizeForm.companyLogoUrl}
                  onChange={(e) => setFinalizeForm((f) => ({ ...f, companyLogoUrl: e.target.value }))}
                  placeholder={
                    finalizeForm.companyLogoUrl.startsWith("data:")
                      ? t("fixAdmin.jp.logo.uploaded")
                      : t("fixAdmin.jp.logo.urlPlaceholder")
                  }
                  className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
                />
                <p className="text-[11px] text-[#607096]">
                  {t("fixAdmin.jp.logo.hint")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Work Arrangement */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC]/60 p-5 md:p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
          <MapPin className="size-4" />
          <span>{t("fixAdmin.jp.section.work")}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#14244B]">
              {t("fixAdmin.jp.field.location")}
            </label>
            <input
              value={finalizeForm.location}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, location: e.target.value }))}
              placeholder={t("fixAdmin.jp.ph.location")}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
            {parserEvidence.location && (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-[#EEF2FD] border border-[#204195]/15 px-2.5 py-1 text-[11px] font-semibold text-[#204195]">
                <span className="truncate">{fmt(t("fixAdmin.jp.suggestion"), { text: parserEvidence.location })}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.workMode")}
            </label>
            <select
              value={finalizeForm.workMode}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, workMode: e.target.value as any }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="">{t("fixAdmin.jp.opt.unset")}</option>
              <option value="remote">{t("fixAdmin.jp.opt.remote")}</option>
              <option value="hybrid">{t("fixAdmin.jp.opt.hybrid")}</option>
              <option value="on_site">{t("fixAdmin.jp.opt.onSite")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.employmentType")}
            </label>
            <select
              value={finalizeForm.employmentType}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, employmentType: e.target.value as any }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="">{t("fixAdmin.jp.opt.unset")}</option>
              <option value="full_time">{t("fixAdmin.jp.emp.fullTime")}</option>
              <option value="part_time">{t("fixAdmin.jp.emp.partTime")}</option>
              <option value="internship">{t("fixAdmin.jp.emp.internship")}</option>
              <option value="contract">{t("fixAdmin.jp.emp.contract")}</option>
              <option value="temporary">{t("fixAdmin.jp.emp.temporary")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Experience */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC]/60 p-5 md:p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
          <Briefcase className="size-4" />
          <span>{t("fixAdmin.jp.section.experience")}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.seniority")}
            </label>
            <select
              value={finalizeForm.seniority}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, seniority: e.target.value as any }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="">{t("fixAdmin.jp.opt.unset")}</option>
              <option value="intern">{t("fixAdmin.jp.seniority.intern")}</option>
              <option value="fresher">{t("fixAdmin.jp.seniority.fresher")}</option>
              <option value="junior">{t("fixAdmin.jp.seniority.junior")}</option>
              <option value="mid">{t("fixAdmin.jp.seniority.mid")}</option>
              <option value="senior">{t("fixAdmin.jp.seniority.senior")}</option>
              <option value="lead">{t("fixAdmin.jp.seniority.lead")}</option>
              <option value="manager">{t("fixAdmin.jp.seniority.manager")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.expMin")}
            </label>
            <input
              type="number"
              min="0"
              value={finalizeForm.experienceMinYears}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, experienceMinYears: e.target.value }))}
              placeholder={t("fixAdmin.jp.ph.expMin")}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
            {parserEvidence.experience && (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-[#EEF2FD] border border-[#204195]/15 px-2.5 py-1 text-[11px] font-semibold text-[#204195]">
                <span className="truncate">{fmt(t("fixAdmin.jp.suggestion"), { text: parserEvidence.experience })}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.expMax")}
            </label>
            <input
              type="number"
              min="0"
              value={finalizeForm.experienceMaxYears}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, experienceMaxYears: e.target.value }))}
              placeholder={t("fixAdmin.jp.ph.expMax")}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 5. Compensation */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC]/60 p-5 md:p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
          <Coins className="size-4" />
          <span>{t("fixAdmin.jp.section.compensation")}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.salaryMin")}
            </label>
            <input
              type="number"
              min="0"
              value={finalizeForm.salaryMin}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, salaryMin: e.target.value }))}
              placeholder="20000000"
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
            {parserEvidence.salary && (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-[#EEF2FD] border border-[#204195]/15 px-2.5 py-1 text-[11px] font-semibold text-[#204195]">
                <span className="truncate">{fmt(t("fixAdmin.jp.suggestion"), { text: parserEvidence.salary })}</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.salaryMax")}
            </label>
            <input
              type="number"
              min="0"
              value={finalizeForm.salaryMax}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, salaryMax: e.target.value }))}
              placeholder="30000000"
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.currency")}
            </label>
            <select
              value={finalizeForm.salaryCurrency}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, salaryCurrency: e.target.value }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="VND">VND (₫)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="SGD">SGD (S$)</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.period")}
            </label>
            <select
              value={finalizeForm.salaryPeriod}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, salaryPeriod: e.target.value as any }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="">{t("fixAdmin.jp.period.unset")}</option>
              <option value="month">{t("fixAdmin.jp.period.month")}</option>
              <option value="year">{t("fixAdmin.jp.period.year")}</option>
              <option value="hour">{t("fixAdmin.jp.period.hour")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.negotiable")}
            </label>
            <select
              value={finalizeForm.salaryNegotiable}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, salaryNegotiable: e.target.value as any }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="unknown">{t("fixAdmin.jp.opt.negUnknown")}</option>
              <option value="yes">{t("fixAdmin.jp.opt.negYes")}</option>
              <option value="no">{t("fixAdmin.jp.opt.negNo")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6. Source Metadata */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC]/60 p-5 md:p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
          <Globe className="size-4" />
          <span>{t("fixAdmin.jp.section.source")}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.sourceType")}
            </label>
            <select
              value={finalizeForm.sourceType}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, sourceType: e.target.value }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="internal_upload">{t("fixAdmin.jp.opt.srcInternal")}</option>
              <option value="manual">{t("fixAdmin.jp.opt.srcManual")}</option>
              <option value="greenhouse">Greenhouse</option>
              <option value="lever">Lever</option>
              <option value="company_career">{t("fixAdmin.jp.opt.srcCareer")}</option>
              <option value="other">{t("fixAdmin.jp.opt.srcOther")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.sourceKey")}
            </label>
            <input
              value={finalizeForm.sourceKey}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, sourceKey: e.target.value }))}
              placeholder="default"
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.sourceName")}
            </label>
            <input
              value={finalizeForm.sourceName}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, sourceName: e.target.value }))}
              placeholder={t("fixAdmin.jp.ph.sourceName")}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.sourceUrl")}
            </label>
            <input
              value={finalizeForm.sourceUrl}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, sourceUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.applyUrl")}
            </label>
            <input
              value={finalizeForm.applyUrl}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, applyUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.externalId")}
            </label>
            <input
              value={finalizeForm.externalJobId}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, externalJobId: e.target.value }))}
              placeholder={t("fixAdmin.jp.ph.externalId")}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 7. Publishing */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC]/60 p-5 md:p-6 shadow-2xs">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
          <Clock className="size-4" />
          <span>{t("fixAdmin.jp.section.publishing")}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#14244B]">
              {t("fixAdmin.jp.field.listingStatus")} <span className="text-[#C43B3B]">*</span>
            </label>
            <select
              value={finalizeForm.listingStatus}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, listingStatus: e.target.value as any }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            >
              <option value="ACTIVE">{t("fixAdmin.jp.opt.listActive")}</option>
              <option value="DRAFT">{t("fixAdmin.jp.opt.listDraft")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#607096]">
              {t("fixAdmin.jp.field.postedAt")}
            </label>
            <input
              type="datetime-local"
              value={finalizeForm.postedAt}
              onChange={(e) => setFinalizeForm((f) => ({ ...f, postedAt: e.target.value }))}
              className="w-full rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#14244B] shadow-2xs focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Description Markdown Editor */}
  <div className="rounded-2xl border border-[#DCE4F3] overflow-hidden shadow-2xs bg-white">
    <div className="flex items-center justify-between border-b border-[#EAEFF8] bg-[#F8FAFC] px-4 py-3">
      <span className="text-xs sm:text-sm font-bold text-[#14244B]">{t("fixAdmin.jp.candidateContent")}</span>
    </div>
    <div data-color-mode="light" className="p-1">
      <MDEditor
        value={descriptionHtml}
        onChange={(v) => setDescriptionHtml(String(v || ""))}
        preview="edit"
        height={260}
        textareaProps={{ placeholder: t("fixAdmin.jp.ph.description") }}
      />
    </div>
  </div>

  {/* Actions */}
  <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-[#EAEFF8] pt-6">
    <button
      onClick={handleCancel}
      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#DCE4F3] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#14244B] shadow-xs hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195] transition-all"
    >
      {t("fixAdmin.jp.cancel")}
    </button>

    {isEditMode ? (
      <>
      <button
        onClick={handleDelete}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#C43B3B]/30 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#C43B3B] hover:bg-[#FDF2F2]"
      >
        {t("fixAdmin.jp.deleteJd")}
      </button>
      <button
        onClick={handleSaveEdit}
        disabled={!canSaveEdit}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#204195] hover:bg-[#183275] active:bg-[#122557] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {editBusy ? t("fixAdmin.jp.saving") : t("fixAdmin.jp.saveChanges")}
      </button>
      </>
    ) : (
      <>
        <button
          onClick={handleDelete}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#C43B3B]/30 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#C43B3B] hover:bg-[#FDF2F2]"
        >
          {t("fixAdmin.jp.deleteJd")}
        </button>
        <button
          onClick={() => handleFinalize("DRAFT")}
          disabled={!canFinalize}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#204195] bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-[#204195] disabled:opacity-50"
        >
          {finalizeBusy ? t("fixAdmin.jp.saving") : t("fixAdmin.jp.saveDraft")}
        </button>
        <button
          onClick={() => handleFinalize("ACTIVE")}
          disabled={!canFinalize}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#204195] hover:bg-[#183275] active:bg-[#122557] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {finalizeBusy ? t("fixAdmin.jp.publishing") : t("fixAdmin.jp.publishJd")}
        </button>
      </>
    )}
  </div>
</section>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.kind === "publish" ? t("fixAdmin.jp.publishConfirm.title") : t("fixAdmin.jp.deleteConfirm.title")}
        body={confirmAction?.kind === "publish" ? t("fixAdmin.jp.publishConfirm.body") : t("fixAdmin.jp.deleteConfirm.body")}
        confirmLabel={confirmAction?.kind === "publish" ? t("fixAdmin.jp.publishConfirm.confirm") : t("fixAdmin.jp.deleteConfirm.confirm")}
        cancelLabel={t("fixAdmin.jp.cancel")}
        tone={confirmAction?.kind === "delete" ? "danger" : "default"}
        busy={versionBusy}
        onConfirm={() => {
          if (confirmAction?.kind === "publish") void doPublishVersion(confirmAction.versionId);
          else if (confirmAction?.kind === "delete") void doDelete();
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
