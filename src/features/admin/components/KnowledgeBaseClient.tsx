"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminRowAction, { AdminRowActions } from "./primitives/AdminRowAction";
import axios from "axios";
import Button from "@components/ui/Button";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import { Pagination } from "@components/shared/Pagination";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { fmt } from "@/i18n/format";
import {
  CheckCircle2,
  AlertCircle,
  Brain,
  List,
  FileEdit,
  PlusSquare,
  FlaskConical,
  Tags,
  FolderOpen,
  Folder,
  Search,
  CheckSquare,
  ToggleRight,
  Trash2,
  Edit,
  UploadCloud,
  History,
  Sliders,
  Database,
  Code,
  X,
  Lightbulb,
  Network,
} from "lucide-react";

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || "http://localhost:5001";

type IngestedDocument = {
  id: string;
  topic: string;
  difficulty: string;
  status: "success" | "failed";
  timestamp: string;
};

type DocumentInfo = {
  document_id: string;
  topic: string;
  domain: string;
  difficulty: string;
  language: string;
  is_active: boolean;
  quality_score: number;
  updated_at: string;
  chunk_count: number;
};

type SearchResultChunk = {
  id: string;
  text: string;
  score: number;
  metadata: {
    chunk_id?: string;
    chunk_type?: string;
    topic?: string;
    difficulty?: string;
    document_id?: string;
    knowledge_unit_id?: string;
    roles?: string[];
    job_levels?: string[];
    quality_score?: number;
    combined_quality_score?: number;
    raw_similarity_score?: number;
  };
};

type RAGRetrievalStats = {
  original_count: number;
  duplicates_removed: number;
  topic_mismatches_removed: number;
  difficulty_mismatches_removed: number;
  final_count: number;
};

interface KnowledgeBaseClientProps {
  lang: string;
  dictionary: Record<string, string>;
}

export default function KnowledgeBaseClient({
  lang,
  dictionary,
}: KnowledgeBaseClientProps) {
  const t = (key: string) => dictionary[key] ?? key;

  // Active Tab: catalog | editor | playground
  const [activeTab, setActiveTab] = useState<"catalog" | "editor" | "playground" | "graph">("catalog");

  // Multi-select & Domain categorization states
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Document list states
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  // The knowledge base runs as a separate RAG service; null until the first load.
  const [ragReachable, setRagReachable] = useState<boolean | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Reset selection on filter changes
  useEffect(() => {
    setSelectedDocIds([]);
  }, [activeTab, selectedDomain, catalogSearch]);

  // Catalog pagination (client-side over the filtered list)
  const [catalogPage, setCatalogPage] = useState(1);

  // Delete confirmation states
  const [pendingDelete, setPendingDelete] = useState<{ kind: "single" | "bulk"; ids: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  // Edit Mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDocId, setEditDocId] = useState("");

  // Evaluation AI Modal states
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalDocId, setEvalDocId] = useState("");
  const [evalData, setEvalData] = useState<Record<string, any> | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const evalDialogRef = useDialogA11y<HTMLDivElement>(isEvalModalOpen, () => setIsEvalModalOpen(false));
  const evalTitleId = `${uid}-eval-title`;

  // Playground / Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("");
  const [simWeight, setSimWeight] = useState(0.7);
  const [qualWeight, setQualWeight] = useState(0.3);
  const [searchResults, setSearchResults] = useState<SearchResultChunk[]>([]);
  const [followUpsResults, setFollowUpsResults] = useState<SearchResultChunk[]>([]);
  const [deliverablesResults, setDeliverablesResults] = useState<SearchResultChunk[]>([]);
  const [retrievalStats, setRetrievalStats] = useState<RAGRetrievalStats | null>(null);
  const [promptPreview, setPromptPreview] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Form Fields for Interview Document
  const [docId, setDocId] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [docStatus, setDocStatus] = useState("approved");
  const [docLang, setDocLang] = useState(lang === "vi" ? "vi" : "en");
  const [domain, setDomain] = useState("backend");
  const [topicName, setTopicName] = useState("");
  const [roleTargets, setRoleTargets] = useState("");
  const [jobLevels, setJobLevels] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("intermediate");
  const [knowledgeSummary, setKnowledgeSummary] = useState("");
  const [knowledgeConcepts, setKnowledgeConcepts] = useState("");
  const [expectedPoints, setExpectedPoints] = useState("");
  const [commonMistakes, setCommonMistakes] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [qualityScore, setQualityScore] = useState(0.8);
  const [savingManual, setSavingManual] = useState(false);

  // Session Ingestion Log
  const [ingestedDocs, setIngestedDocs] = useState<IngestedDocument[]>([]);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Fetch all documents on load
  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await axios.get(`${RAG_API_URL}/api/v1/rag/documents?t=${Date.now()}`);
      if (response.data?.success) {
        setDocuments(response.data.data || []);
      }
      setRagReachable(true);
    } catch (err) {
      // No response at all: the RAG service is not running. Say so once, in the page.
      if (axios.isAxiosError(err) && !err.response) {
        setRagReachable(false);
      } else {
        console.error("Error fetching documents:", err);
        setRagReachable(true);
        showNotification("error", t("fixAdmin.kb.loadDocsFailed"));
      }
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Ask before deleting (single document or the current selection)
  const requestDeleteDoc = (documentId: string) => {
    setPendingDelete({ kind: "single", ids: [documentId] });
  };

  const requestBulkDelete = () => {
    if (selectedDocIds.length === 0) return;
    setPendingDelete({ kind: "bulk", ids: [...selectedDocIds] });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      if (pendingDelete.kind === "single") {
        await handleDeleteDoc(pendingDelete.ids[0]);
      } else {
        await handleBulkDeleteDocs(pendingDelete.ids);
      }
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  // Delete a document
  const handleDeleteDoc = async (documentId: string) => {
    try {
      const response = await axios.delete(`${RAG_API_URL}/api/v1/rag/documents/${documentId}`);
      if (response.data?.success) {
        showNotification("success", fmt(t("fixAdmin.kb.deleted"), { id: documentId }));
        fetchDocuments();
        // If searching, refresh playground search
        if (searchQuery || topicFilter) {
          performSearch(searchQuery, difficultyFilter, topicFilter);
        }
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      showNotification("error", fmt(t("fixAdmin.kb.deleteFailed"), { id: documentId }));
    }
  };

  // Toggle active state
  const handleToggleActive = async (documentId: string, currentActive: boolean) => {
    try {
      const targetState = !currentActive;
      const response = await axios.post(`${RAG_API_URL}/api/v1/rag/documents/${documentId}/toggle`, {
        is_active: targetState,
      });
      if (response.data?.success) {
        showNotification("success", fmt(targetState ? t("fixAdmin.kb.activated") : t("fixAdmin.kb.deactivated"), { id: documentId }));
        // Update local state directly for responsive UI
        setDocuments((prev) =>
          prev.map((d) => (d.document_id === documentId ? { ...d, is_active: targetState } : d))
        );
      }
    } catch (err) {
      console.error("Error toggling active status:", err);
      showNotification("error", t("fixAdmin.kb.toggleFailed"));
    }
  };

  // Toggle selection for individual document
  const handleToggleSelectDoc = (documentId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  // Toggle selection for all visible documents
  const handleToggleSelectAll = (visibleIds: string[]) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedDocIds.includes(id));
    if (allSelected) {
      setSelectedDocIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedDocIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Bulk delete documents
  const handleBulkDeleteDocs = async (ids: string[]) => {
    if (ids.length === 0) return;
    setIsLoadingDocs(true);
    try {
      const response = await axios.post(`${RAG_API_URL}/api/v1/rag/documents/bulk-delete`, {
        document_ids: ids,
      });
      if (response.data?.success) {
        showNotification("success", fmt(t("fixAdmin.kb.bulkDeleted"), { n: ids.length }));
        setSelectedDocIds([]);
        fetchDocuments();
        if (searchQuery || topicFilter) {
          performSearch(searchQuery, difficultyFilter, topicFilter);
        }
      }
    } catch (err) {
      console.error("Error bulk deleting documents:", err);
      showNotification("error", t("fixAdmin.kb.bulkDeleteFailed"));
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Bulk toggle active status
  const handleBulkToggleActive = async () => {
    if (selectedDocIds.length === 0) return;
    const firstSelected = documents.find((d) => d.document_id === selectedDocIds[0]);
    if (!firstSelected) return;
    const targetState = !firstSelected.is_active;

    setIsLoadingDocs(true);
    try {
      const response = await axios.post(`${RAG_API_URL}/api/v1/rag/documents/bulk-toggle`, {
        document_ids: selectedDocIds,
        is_active: targetState,
      });
      if (response.data?.success) {
        showNotification(
          "success",
          fmt(targetState ? t("fixAdmin.kb.bulkActivated") : t("fixAdmin.kb.bulkDeactivated"), { n: selectedDocIds.length })
        );
        setSelectedDocIds([]);
        fetchDocuments();
      }
    } catch (err) {
      console.error("Error bulk toggling active status:", err);
      showNotification("error", t("fixAdmin.kb.bulkToggleFailed"));
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Load document for editing
  const handleLoadEdit = async (documentId: string) => {
    try {
      const response = await axios.get(`${RAG_API_URL}/api/v1/rag/documents/${documentId}`);
      if (response.data?.success && response.data?.data) {
        const doc = response.data.data.document;
        setDocId(doc.document.document_id);
        setVersion(doc.document.version || "1.0.0");
        setDocStatus(doc.document.status || "approved");
        setDocLang(doc.document.language || "vi");
        setDomain(doc.topic.domain || "general");
        setTopicName(doc.topic.topic_name || "");
        setRoleTargets(doc.topic.role_targets?.join(";") || "");
        setJobLevels(doc.topic.job_levels?.join(";") || "");
        setDifficultyLevel(doc.difficulty.level || "intermediate");
        setKnowledgeSummary(doc.knowledge.summary || "");
        setKnowledgeConcepts(doc.knowledge.concepts?.join(";") || "");
        setExpectedPoints(doc.expected_points.must_have?.join("\n") || "");
        setCommonMistakes(doc.common_mistakes.mistakes?.join("\n") || "");
        setFollowUpQuestions(doc.follow_up.questions?.join("\n") || "");
        setDeliverables(doc.deliverables.action_items?.join("\n") || "");
        setQualityScore(doc.metadata.retrieval.quality_score ?? 0.8);

        setIsEditMode(true);
        setEditDocId(documentId);
        setActiveTab("editor");
      }
    } catch (err) {
      console.error("Error loading document:", err);
      showNotification("error", t("fixAdmin.kb.loadDocFailed"));
    }
  };

  // Evaluate document via LLM
  const handleEvaluateDoc = async (documentId: string) => {
    setIsEvaluating(true);
    setEvalDocId(documentId);
    setEvalData(null);
    setIsEvalModalOpen(true);
    try {
      const response = await axios.post(`${RAG_API_URL}/api/v1/rag/documents/${documentId}/evaluate`);
      if (response.data?.success) {
        setEvalData(response.data.evaluation);
      } else {
        showNotification("error", t("fixAdmin.kb.evalServerError"));
      }
    } catch (err) {
      console.error("Error evaluating document:", err);
      showNotification("error", t("fixAdmin.kb.evalConnError"));
    } finally {
      setIsEvaluating(false);
    }
  };

  // Apply suggestions and adjust quality score in DB
  const handleApplyQualityScore = async (score: number) => {
    try {
      setQualityScore(score);
      showNotification("success", fmt(t("fixAdmin.kb.scoreApplied"), { score: score.toFixed(2) }));
      setIsEvalModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Perform search / retrieve inside Playground
  const performSearch = async (query: string, diff: string, topic: string) => {
    if (!query.trim() && !topic.trim()) {
      setSearchResults([]);
      setFollowUpsResults([]);
      setDeliverablesResults([]);
      setRetrievalStats(null);
      setPromptPreview("");
      return;
    }

    setIsSearching(true);
    try {
      const payload: Record<string, unknown> = {
        query_text: query.trim() || undefined,
        topic: topic.trim() || undefined,
        difficulty: diff !== "all" ? diff : undefined,
        similarity_weight: simWeight,
        quality_weight: qualWeight,
        k: 10,
      };

      const response = await axios.post(`${RAG_API_URL}/api/v1/rag/retrieve`, payload);

      if (response.data?.success && response.data?.data) {
        const { ranked_chunks, follow_ups, deliverables: delivs, metadata, prompt_preview } = response.data.data;
        setSearchResults(ranked_chunks || []);
        setFollowUpsResults(follow_ups || []);
        setDeliverablesResults(delivs || []);
        setRetrievalStats(metadata || null);
        setPromptPreview(prompt_preview || "");
      }
    } catch (err) {
      console.error("Error retrieving RAG context:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Real-time search update when sliders modify
  useEffect(() => {
    if (activeTab === "playground" && (searchQuery || topicFilter)) {
      const delayDebounceFn = setTimeout(() => {
        performSearch(searchQuery, difficultyFilter, topicFilter);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [simWeight, qualWeight]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    performSearch(val, difficultyFilter, topicFilter);
  };

  const handleDifficultyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDifficultyFilter(val);
    performSearch(searchQuery, val, topicFilter);
  };

  const handleTopicFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTopicFilter(val);
    performSearch(searchQuery, difficultyFilter, val);
  };

  // Helper to split text values by semicolon or newline
  const parseListField = (val: string): string[] => {
    if (!val) return [];
    return val
      .split(/[;\n]/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditDocId("");
    // Reset form fields
    setDocId("");
    setTopicName("");
    setKnowledgeSummary("");
    setKnowledgeConcepts("");
    setExpectedPoints("");
    setCommonMistakes("");
    setFollowUpQuestions("");
    setDeliverables("");
    setQualityScore(0.8);
    setActiveTab("catalog");
  };

  // Submit manual document form
  const handleManualDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docId.trim()) {
      showNotification("error", t("fixAdmin.kb.docIdRequired"));
      return;
    }
    if (!topicName.trim()) {
      showNotification("error", t("fixAdmin.kb.topicRequired"));
      return;
    }

    setSavingManual(true);

    const payload = {
      document: {
        document_id: docId.trim(),
        version: version.trim() || "1.0.0",
        status: docStatus,
        language: docLang,
        updated_at: new Date().toISOString(),
      },
      topic: {
        domain: domain.trim() || "general",
        topic_name: topicName.trim(),
        role_targets: parseListField(roleTargets),
        job_levels: parseListField(jobLevels),
      },
      difficulty: {
        level: difficultyLevel,
      },
      knowledge: {
        summary: knowledgeSummary.trim(),
        concepts: parseListField(knowledgeConcepts),
      },
      expected_points: {
        must_have: parseListField(expectedPoints),
      },
      common_mistakes: {
        mistakes: parseListField(commonMistakes),
      },
      follow_up: {
        questions: parseListField(followUpQuestions),
      },
      deliverables: {
        action_items: parseListField(deliverables),
      },
      metadata: {
        retrieval: {
          is_active: true,
          quality_score: qualityScore,
        },
      },
    };

    try {
      const response = await axios.post(`${RAG_API_URL}/api/v1/rag/upsert-document`, payload);
      if (response.data?.success) {
        showNotification(
          "success",
          isEditMode
            ? fmt(t("fixAdmin.kb.updatedDoc"), { id: docId, n: response.data.records || 0 })
            : fmt(t("fixAdmin.kb.ingestedDoc"), { id: docId, n: response.data.records || 0 })
        );

        // Add to Ingested log
        const logDoc: IngestedDocument = {
          id: docId.trim(),
          topic: topicName.trim(),
          difficulty: difficultyLevel,
          status: "success",
          timestamp: new Date().toLocaleTimeString(),
        };
        setIngestedDocs((prev) => [logDoc, ...prev]);

        // Reset form
        setIsEditMode(false);
        setEditDocId("");
        setDocId("");
        setTopicName("");
        setKnowledgeSummary("");
        setKnowledgeConcepts("");
        setExpectedPoints("");
        setCommonMistakes("");
        setFollowUpQuestions("");
        setDeliverables("");
        setQualityScore(0.8);

        // Refresh documents and switch to catalog
        fetchDocuments();
        setActiveTab("catalog");
      } else {
        showNotification("error", response.data?.error || t("fixAdmin.kb.saveFailed"));
      }
    } catch (err: unknown) {
      console.error("Error upserting doc:", err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showNotification("error", msg || t("fixAdmin.kb.ragConnError"));
    } finally {
      setSavingManual(false);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
  };

  const processAndUploadFile = async (file: File) => {
    const fileName = file.name;
    const isCsv = fileName.toLowerCase().endsWith(".csv");
    const isJson = fileName.toLowerCase().endsWith(".json");

    if (!isCsv && !isJson) {
      showNotification("error", t("fixAdmin.kb.fileTypeUnsupported"));
      return;
    }

    setUploading(true);
    showNotification("success", fmt(t("fixAdmin.kb.uploadingFile"), { file: fileName }));

    if (isCsv) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(`${RAG_API_URL}/api/v1/rag/import-csv`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data?.success) {
          const count = response.data.imported_document_ids?.length || 0;
          showNotification("success", fmt(t("fixAdmin.kb.csvImported"), { n: count }));
          fetchDocuments();

          const newLogs: IngestedDocument[] = (response.data.imported_document_ids || []).map(
            (id: string) => ({
              id,
              topic: t("fixAdmin.kb.logImportedCsv"),
              difficulty: t("fixAdmin.kb.logDynamic"),
              status: "success",
              timestamp: new Date().toLocaleTimeString(),
            })
          );
          setIngestedDocs((prev) => [...newLogs, ...prev]);
        } else {
          showNotification("error", response.data?.error || t("fixAdmin.kb.csvFailed"));
        }
      } catch (err: unknown) {
        console.error("Error uploading CSV:", err);
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        showNotification("error", msg || t("fixAdmin.kb.ragConnError"));
      } finally {
        setUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const docObj = JSON.parse(text);

          const response = await axios.post(`${RAG_API_URL}/api/v1/rag/upsert-document`, docObj);
          if (response.data?.success) {
            const docIdVal = docObj.document?.document_id || fileName;
            showNotification("success", fmt(t("fixAdmin.kb.jsonImported"), { id: docIdVal }));
            fetchDocuments();

            const logDoc: IngestedDocument = {
              id: docIdVal,
              topic: docObj.topic?.topic_name || t("fixAdmin.kb.logJsonUpload"),
              difficulty: docObj.difficulty?.level || t("fixAdmin.kb.logDynamic"),
              status: "success",
              timestamp: new Date().toLocaleTimeString(),
            };
            setIngestedDocs((prev) => [logDoc, ...prev]);
          } else {
            showNotification("error", response.data?.error || t("fixAdmin.kb.jsonFailed"));
          }
        } catch (err: unknown) {
          console.error("Error parsing/uploading JSON:", err);
          showNotification("error", t("fixAdmin.kb.jsonInvalid"));
        } finally {
          setUploading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
  };

  const downloadCsvTemplate = () => {
    const csvContent =
      "document_id,version,status,language,domain,topic_name,role_targets,job_levels,difficulty_level,knowledge_summary,knowledge_concepts,expected_points_must_have,common_mistakes,follow_up_questions,deliverables_action_items,is_active,quality_score\n" +
      'int_doc_python_oop_01,1.0.0,approved,vi,backend,python-oop,"backend-engineer;python-developer","junior;mid",intermediate,"Hiểu về các nguyên lý hướng đối tượng (OOP) trong Python bao gồm kế thừa, đóng gói, đa hình và trừu tượng.","MRO (Method Resolution Order);Abstract Class;Interface;super()","Giải thích cơ chế đa kế thừa và thứ tự Method Resolution Order (MRO);Phân biệt classmethod và staticmethod;Sử dụng đúng hàm super() để khởi tạo lớp cha","Nhầm lẫn cơ chế đa kế thừa chạy theo chiều rộng thuần túy thay vì thuật toán C3 Linearization;Dùng đối tượng mutable làm giá trị mặc định cho tham số của phương thức","Làm thế nào để tạo một singleton class thread-safe trong Python?;Sự khác biệt giữa __new__ và __init__ là gì và khi nào nên ghi đè __new__?","Xây dựng một Class Decorator tự động log thời gian chạy và lưu vết cuộc gọi của mọi phương thức trong Class.",true,0.95\n' +
      'int_doc_caching_01,1.0.0,approved,vi,backend,caching-strategies,"backend-engineer;devops","mid;senior",advanced,"Nắm vững các chiến lược Caching phổ biến (Cache-Aside, Write-Through, Write-Behind) và cơ chế dọn dẹp bộ nhớ đệm.","Cache-Aside;Write-Through;Write-Behind;Eviction Policies (LRU, LFU);Cache Stampede","Mô tả chi tiết cách hoạt động của Cache-Aside và Write-Through;So sánh ưu nhược điểm về độ trễ và tính nhất quán dữ liệu giữa các chiến lược;Giải thích cách phòng tránh hiện tượng Cache Stampede / Thundering Herd","Không xử lý trường hợp Cache Stampede dẫn đến sập DB khi key hết hạn;Đặt TTL quá dài gây lệch dữ liệu giữa Cache và DB","Cơ chế dọn dẹp bộ nhớ LRU hoạt động thế nào và cách tối ưu hóa Redis khi bộ nhớ bị đầy?;Làm thế nào để triển khai phân tán khóa (Distributed Lock) sử dụng Redis?","Thiết kế kiến trúc Cache-Aside kết hợp cơ chế khóa phân tán Redlock bằng mã giả để đảm bảo tính nhất quán.",true,0.90\n';

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "interview_docs_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get all unique domains dynamically from documents
  const domains = Array.from(new Set(documents.map((d) => d.domain).filter(Boolean)));

  // Filter documents in client table based on search
  const filteredDocs = documents.filter((doc) => {
    const q = catalogSearch.toLowerCase();
    const matchesSearch =
      doc.document_id.toLowerCase().includes(q) ||
      doc.topic.toLowerCase().includes(q) ||
      doc.domain.toLowerCase().includes(q);
    const matchesDomain = !selectedDomain || doc.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const CATALOG_PAGE_SIZE = 20;
  const catalogPageCount = Math.max(1, Math.ceil(filteredDocs.length / CATALOG_PAGE_SIZE));
  // Clamp when the list shrinks (e.g. after deletes) without an extra render.
  const currentCatalogPage = Math.min(catalogPage, catalogPageCount);
  const pagedDocs = filteredDocs.slice(
    (currentCatalogPage - 1) * CATALOG_PAGE_SIZE,
    currentCatalogPage * CATALOG_PAGE_SIZE
  );

  return (
    <div className="min-w-0 text-on-surface antialiased">
      {/* Notification Toast */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {notification && (
          <div
            className={`fixed top-20 left-4 right-4 z-[9999] sm:left-auto sm:right-6 sm:top-6 sm:max-w-md p-4 rounded-3xl shadow-2xl transition-all duration-300 transform translate-y-0 text-white flex items-start gap-3 border ${
              notification.type === "success"
                ? "bg-[#287A4B] border-[#287A4B]"
                : "bg-[#C43B3B] border-[#C43B3B]"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="min-w-0 break-words">
              <p className="font-bold text-sm">
                {notification.type === "success" ? t("fixAdmin.kb.toastSuccess") : t("fixAdmin.kb.toastError")}
              </p>
              <p className="text-xs opacity-90 leading-relaxed mt-1">{notification.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="w-full space-y-6">
        {/* Top Header */}
        <div>
          <AdminPageHeader
            title={t("admin.knowledgeBase") || "Cơ sở tri thức (RAG)"}
            description={t("fixAdmin.kb.subtitle")}
            breadcrumbs={[
              { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
              { label: t("admin.knowledgeBase") },
            ]}
          />

          {ragReachable === false ? (
            <div role="status" className="mb-4 rounded-2xl border border-[#FCE3A6] bg-[#FFF7E3] p-4 text-sm text-[#8A5A00]">
              <p className="font-bold">{t("adminOps.kb.downTitle")}</p>
              <p className="mt-1 text-xs leading-5">{fmt(t("adminOps.kb.downBody"), { url: RAG_API_URL })}</p>
              <button
                type="button"
                onClick={() => void fetchDocuments()}
                className="mt-2 text-xs font-semibold text-[#204195] hover:underline"
              >
                {t("adminOps.kb.retry")}
              </button>
            </div>
          ) : null}

          {/* Tab Switcher */}
          <div role="tablist" aria-label={t("fixAdmin.kb.tabsLabel")} className="grid grid-cols-2 gap-1 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-1 shadow-xs sm:inline-flex sm:flex-wrap">
            <button
              id="knowledge-tab-catalog"
              type="button"
              role="tab"
              aria-selected={activeTab === "catalog"}
              aria-controls="knowledge-panel-catalog"
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-center text-xs font-bold transition-all ${
                activeTab === "catalog"
                  ? "bg-white text-[#204195] shadow-xs"
                  : "text-[#607096] hover:text-[#204195]"
              }`}
            >
              <List className="size-4" aria-hidden="true" />
              {t("fixAdmin.kb.tabCatalog")}
            </button>
            <button
              id="knowledge-tab-editor"
              type="button"
              role="tab"
              aria-selected={activeTab === "editor"}
              aria-controls="knowledge-panel-editor"
              onClick={() => setActiveTab("editor")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-center text-xs font-bold transition-all ${
                activeTab === "editor"
                  ? "bg-white text-[#204195] shadow-xs"
                  : "text-[#607096] hover:text-[#204195]"
              }`}
            >
              {isEditMode ? <FileEdit className="size-4" /> : <PlusSquare className="size-4" />}
              {isEditMode ? t("fixAdmin.kb.tabEditMode") : t("fixAdmin.kb.tabEditor")}
            </button>
            <button
              id="knowledge-tab-vector"
              type="button"
              role="tab"
              aria-selected={activeTab === "playground"}
              aria-controls="knowledge-panel-vector"
              onClick={() => setActiveTab("playground")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-center text-xs font-bold transition-all ${
                activeTab === "playground"
                  ? "bg-white text-[#204195] shadow-xs"
                  : "text-[#607096] hover:text-[#204195]"
              }`}
            >
              <FlaskConical className="size-4" />
              {t("fixAdmin.kb.tabVector")}
            </button>
            <button id="knowledge-tab-graph" type="button" role="tab" aria-selected={activeTab === "graph"} aria-controls="knowledge-panel-graph" onClick={() => setActiveTab("graph")} className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-center text-xs font-bold transition-all ${activeTab === "graph" ? "bg-white text-[#204195] shadow-xs" : "text-[#607096] hover:text-[#204195]"}`}>
              <Network className="size-4" /> {t("fixAdmin.kb.tabGraph")}
            </button>
          </div>
        </div>

        {/* Content Canvas */}
        <div className="w-full">
          {/* TAB 1: CATALOG OF KNOWLEDGE UNITS */}
          {activeTab === "catalog" && (
            <div id="knowledge-panel-catalog" role="tabpanel" aria-labelledby="knowledge-tab-catalog" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-[#14244B] sm:text-lg">{t("fixAdmin.kb.catalogTitle")}</h2>
                  <p className="text-[#607096] text-xs mt-1">
                    {t("fixAdmin.kb.catalogSubtitle")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Left Category Column */}
                <div className="col-span-12 min-w-0 lg:col-span-3 space-y-4">
                  <div className="bg-white border border-[#DCE4F3] rounded-3xl p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#607096] mb-4 flex items-center gap-2">
                      <Tags className="size-4" />
                      {t("fixAdmin.kb.byDomain")}
                    </h3>
                    <div className="space-y-1">
                      <button
                        type="button"
                        aria-pressed={selectedDomain === null}
                        onClick={() => {
                          setSelectedDomain(null);
                          setCatalogPage(1);
                        }}
                        className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all duration-200 ${
                          selectedDomain === null
                            ? "bg-[#204195] text-white shadow-xs"
                            : "text-[#607096] hover:bg-[#F8FAFC] hover:text-[#204195]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FolderOpen className="size-4" />
                          {t("fixAdmin.kb.allKnowledge")}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          selectedDomain === null ? "bg-white/20 text-white" : "bg-[#EEF2FD] text-[#204195]"
                        }`}>
                          {documents.length}
                        </span>
                      </button>

                      {domains.map((dom) => {
                        const count = documents.filter((d) => d.domain === dom).length;
                        return (
                          <button
                            key={dom}
                            type="button"
                            aria-pressed={selectedDomain === dom}
                            onClick={() => {
                              setSelectedDomain(dom);
                              setCatalogPage(1);
                            }}
                            className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all duration-200 capitalize ${
                              selectedDomain === dom
                                ? "bg-[#204195] text-white shadow-xs"
                                : "text-[#607096] hover:bg-[#F8FAFC] hover:text-[#204195]"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Folder className="size-4" />
                              {dom}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              selectedDomain === dom ? "bg-white/20 text-white" : "bg-[#EAEFF8] text-[#607096]"
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Main Table Column */}
                <div className="col-span-12 min-w-0 lg:col-span-9 space-y-6">
                  {/* Filtering bar */}
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#DCE4F3] flex gap-4 items-center shadow-xs focus-within:ring-2 focus-within:ring-[#204195]/20 focus-within:border-[#204195] transition-all">
                    <Search className="size-5 text-[#607096] shrink-0" aria-hidden="true" />
                    <input
                      type="search"
                      aria-label={t("fixAdmin.kb.searchLabel")}
                      placeholder={t("fixAdmin.kb.searchPlaceholder")}
                      value={catalogSearch}
                      onChange={(e) => {
                        setCatalogSearch(e.target.value);
                        setCatalogPage(1);
                      }}
                      className="bg-transparent border-none outline-none text-sm w-full font-medium text-[#14244B] placeholder:text-[#607096]"
                    />
                  </div>

                  {/* Bulk Actions Alert Bar */}
                  {selectedDocIds.length > 0 && (
                    <div className="bg-[#F0F4FC] border border-[#DCE4F3] p-4 rounded-xl flex flex-wrap justify-between items-center gap-3 animate-fade-in shadow-xs">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="size-5 text-primary shrink-0" />
                        <span className="text-xs font-bold text-[#14244B]">
                          {fmt(t("fixAdmin.kb.selectedCount"), { n: selectedDocIds.length })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleBulkToggleActive}
                          className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] border border-[#DCE4F3] text-[#14244B] font-bold rounded-full text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <ToggleRight className="size-4" aria-hidden="true" />
                          {t("fixAdmin.kb.bulkToggle")}
                        </button>
                        <button
                          type="button"
                          onClick={requestBulkDelete}
                          className="px-3.5 py-2 bg-[#C43B3B] hover:bg-[#A93232] text-white font-bold rounded-full text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          {fmt(t("fixAdmin.kb.bulkDelete"), { n: selectedDocIds.length })}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDocIds([])}
                          className="px-3.5 py-2 border border-[#DCE4F3] hover:bg-[#F8FAFC] text-[#607096] font-bold rounded-full text-xs transition-colors"
                        >
                          {t("fixAdmin.kb.clearSelection")}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Catalog Table */}
                  <div className="bg-white border border-[#DCE4F3] rounded-3xl overflow-hidden shadow-xs">
                    {isLoadingDocs ? (
                      <div className="p-12 text-center text-[#607096] font-medium animate-pulse">
                        {t("fixAdmin.kb.loadingDocs")}
                      </div>
                    ) : filteredDocs.length === 0 ? (
                      <div className="p-12 text-center text-[#607096] italic">
                        {catalogSearch ? t("fixAdmin.kb.noMatch") : t("fixAdmin.kb.empty")}
                      </div>
                    ) : (
                      <>
                      <div className="relative overflow-x-auto">
                      <table className="w-full min-w-[960px] text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F8FAFC] text-[10px] uppercase font-bold text-[#607096] border-b border-[#DCE4F3]">
                            <th scope="col" className="p-4 w-12 text-center">
                              <input
                                type="checkbox"
                                aria-label={t("fixAdmin.kb.selectAllOnPage")}
                                checked={pagedDocs.length > 0 && pagedDocs.every((d) => selectedDocIds.includes(d.document_id))}
                                onChange={() => handleToggleSelectAll(pagedDocs.map((d) => d.document_id))}
                                className="rounded border-[#DCE4F3] text-[#204195] focus:ring-2 focus:ring-[#204195]/20 h-4 w-4 cursor-pointer"
                              />
                            </th>
                            <th scope="col" className="p-4">{t("fixAdmin.kb.colDocId")}</th>
                            <th scope="col" className="p-4">{t("fixAdmin.kb.colTopic")}</th>
                            <th scope="col" className="p-4">{t("fixAdmin.kb.colDifficulty")}</th>
                            <th scope="col" className="p-4 text-center">{t("fixAdmin.kb.colLanguage")}</th>
                            <th scope="col" className="p-4 text-center">{t("fixAdmin.kb.colChunks")}</th>
                            <th scope="col" className="p-4 text-center">{t("fixAdmin.kb.colQuality")}</th>
                            <th scope="col" className="p-4 text-center">{t("fixAdmin.kb.colStatus")}</th>
                            <th scope="col" className="p-4 text-right">{t("fixAdmin.kb.colActions")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAEFF8] text-sm">
                          {pagedDocs.map((doc) => (
                            <tr key={doc.document_id} className="hover:bg-[#F8FAFC]/60 transition-colors">
                              <td className="p-4 w-12 text-center">
                                <input
                                  type="checkbox"
                                  aria-label={fmt(t("fixAdmin.kb.selectDoc"), { id: doc.document_id })}
                                  checked={selectedDocIds.includes(doc.document_id)}
                                  onChange={() => handleToggleSelectDoc(doc.document_id)}
                                  className="rounded border-[#DCE4F3] text-[#204195] focus:ring-2 focus:ring-[#204195]/20 h-4 w-4 cursor-pointer"
                                />
                              </td>
                              <td className="max-w-[220px] p-4 font-bold text-[#14244B] [overflow-wrap:anywhere]">
                                {doc.document_id}
                              </td>
                              <td className="p-4">
                                <span className="inline-block px-2.5 py-0.5 bg-[#F0F4FC] text-[#204195] rounded text-xs font-bold mr-1.5">
                                  {doc.topic}
                                </span>
                                <span className="text-[#607096] text-xs font-medium">({doc.domain})</span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold capitalize ${
                                  doc.difficulty === "basic"
                                    ? "bg-[#EAF5EE] text-[#287A4B]"
                                    : doc.difficulty === "intermediate"
                                    ? "bg-[#FFF6DF] text-[#8A5A00]"
                                    : "bg-[#FDF2F2] text-[#C43B3B]"
                                }`}>
                                  {doc.difficulty === "basic"
                                    ? t("fixAdmin.kb.diffBasic")
                                    : doc.difficulty === "intermediate"
                                    ? t("fixAdmin.kb.diffIntermediate")
                                    : doc.difficulty === "advanced"
                                    ? t("fixAdmin.kb.diffAdvanced")
                                    : doc.difficulty}
                                </span>
                              </td>
                              <td className="p-4 text-center capitalize font-semibold">{doc.language}</td>
                              <td className="p-4 text-center font-bold text-[#607096]">{doc.chunk_count}</td>
                              <td className="p-4 text-center">
                                <span className="font-extrabold text-primary px-2 py-0.5 bg-primary/5 rounded border border-primary/20 text-xs">
                                  {typeof doc.quality_score === "number" ? doc.quality_score.toFixed(2) : "—"}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    role="switch"
                                    aria-checked={doc.is_active}
                                    aria-label={fmt(t("fixAdmin.kb.toggleActive"), { id: doc.document_id })}
                                    checked={doc.is_active}
                                    onChange={() => handleToggleActive(doc.document_id, doc.is_active)}
                                    className="sr-only peer"
                                  />
                                  <div aria-hidden="true" className="w-9 h-5 bg-[#EAEFF8] peer-focus-visible:ring-2 peer-focus-visible:ring-[#204195]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#DCE4F3] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#287A4B]"></div>
                                </label>
                              </td>
                              <td className="p-4 text-right">
                                <AdminRowActions>
                                  <AdminRowAction
                                    icon={Brain}
                                    tone="neutral"
                                    iconOnly
                                    label={t("fixAdmin.kb.evaluate")}
                                    aria-label={fmt(t("fixAdmin.kb.evaluateDoc"), { id: doc.document_id })}
                                    onClick={() => handleEvaluateDoc(doc.document_id)}
                                  />
                                  <AdminRowAction
                                    icon={Edit}
                                    iconOnly
                                    label={t("fixAdmin.kb.edit")}
                                    aria-label={fmt(t("fixAdmin.kb.editDoc"), { id: doc.document_id })}
                                    onClick={() => handleLoadEdit(doc.document_id)}
                                  />
                                  <AdminRowAction
                                    icon={Trash2}
                                    tone="danger"
                                    iconOnly
                                    label={t("fixAdmin.kb.delete")}
                                    aria-label={fmt(t("fixAdmin.kb.deleteDoc"), { id: doc.document_id })}
                                    onClick={() => requestDeleteDoc(doc.document_id)}
                                  />
                                </AdminRowActions>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                      {filteredDocs.length > CATALOG_PAGE_SIZE && (
                        <div className="border-t border-[#EAEFF8] px-4 py-3">
                          <Pagination
                            page={currentCatalogPage}
                            pageSize={CATALOG_PAGE_SIZE}
                            total={filteredDocs.length}
                            onPageChange={setCatalogPage}
                          />
                        </div>
                      )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL EDITOR AND DROP INGESTION */}
          {activeTab === "editor" && (
            <div id="knowledge-panel-editor" role="tabpanel" aria-labelledby="knowledge-tab-editor" className="grid grid-cols-12 gap-8">
              {/* Form Input (Left panel) */}
              <div className="col-span-12 min-w-0 lg:col-span-8 space-y-6">
                <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#DCE4F3] shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-[#DCE4F3]">
                    <div className="min-w-0 break-words">
                      <h3 className="text-base font-bold sm:text-lg text-on-surface">
                        {isEditMode ? fmt(t("fixAdmin.kb.editorTitleEdit"), { id: editDocId }) : t("fixAdmin.kb.editorTitleNew")}
                      </h3>
                      <p className="text-[#607096] text-xs mt-1">
                        {isEditMode ? t("fixAdmin.kb.editorHintEdit") : t("fixAdmin.kb.editorHintNew")}
                      </p>
                    </div>
                    {isEditMode && (
                      <button
                        onClick={handleCancelEdit}
                        className="text-xs font-bold text-[#C43B3B] bg-[#FDF2F2] px-3.5 py-1.5 rounded-lg hover:bg-[#FBE5E5]"
                      >
                        {t("fixAdmin.kb.cancelEdit")}
                      </button>
                    )}
                  </div>
                  
                  <form onSubmit={handleManualDocSubmit} className="space-y-6">
                    {/* Basic Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb1")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.documentId")} *
                        </label>
                        <input id={fieldId("kb1")}
                          type="text"
                          required
                          disabled={isEditMode}
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all disabled:opacity-50"
                          placeholder={t("fixAdmin.kb.phDocId")}
                          value={docId}
                          onChange={(e) => setDocId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb2")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.topicName")} *
                        </label>
                        <input id={fieldId("kb2")}
                          type="text"
                          required
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all"
                          placeholder={t("fixAdmin.kb.phTopic")}
                          value={topicName}
                          onChange={(e) => setTopicName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb3")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.domain")}
                        </label>
                        <input id={fieldId("kb3")}
                          type="text"
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb4")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.difficulty")}
                        </label>
                        <select id={fieldId("kb4")}
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all cursor-pointer"
                          value={difficultyLevel}
                          onChange={(e) => setDifficultyLevel(e.target.value)}
                        >
                          <option value="basic">{t("fixAdmin.kb.diffBasic")}</option>
                          <option value="intermediate">{t("fixAdmin.kb.diffIntermediate")}</option>
                          <option value="advanced">{t("fixAdmin.kb.diffAdvanced")}</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb5")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("fixAdmin.kb.fieldVersion")}
                        </label>
                        <input id={fieldId("kb5")}
                          type="text"
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb6")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("fixAdmin.kb.fieldLanguage")}
                        </label>
                        <select id={fieldId("kb6")}
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all cursor-pointer"
                          value={docLang}
                          onChange={(e) => setDocLang(e.target.value)}
                        >
                          <option value="vi">{t("fixAdmin.kb.langVi")}</option>
                          <option value="en">{t("fixAdmin.kb.langEn")}</option>
                        </select>
                      </div>
                    </div>

                    {/* Target Audience & Stack */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb7")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.roleTargets")}
                        </label>
                        <input id={fieldId("kb7")}
                          type="text"
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all"
                          placeholder={t("fixAdmin.kb.phRoles")}
                          value={roleTargets}
                          onChange={(e) => setRoleTargets(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb8")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.jobLevels")}
                        </label>
                        <input id={fieldId("kb8")}
                          type="text"
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all"
                          placeholder={t("fixAdmin.kb.phLevels")}
                          value={jobLevels}
                          onChange={(e) => setJobLevels(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Knowledge Unit Content */}
                    <div className="space-y-1">
                      <label htmlFor={fieldId("kb9")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                        {t("admin.knowledge.field.knowledgeSummary")}
                      </label>
                      <textarea id={fieldId("kb9")}
                        rows={3}
                        className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all resize-y"
                        placeholder={t("fixAdmin.kb.phSummary")}
                        value={knowledgeSummary}
                        onChange={(e) => setKnowledgeSummary(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={fieldId("kb10")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                        {t("admin.knowledge.field.concepts")}
                      </label>
                      <input id={fieldId("kb10")}
                        type="text"
                        className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all"
                        placeholder={t("fixAdmin.kb.phConcepts")}
                        value={knowledgeConcepts}
                        onChange={(e) => setKnowledgeConcepts(e.target.value)}
                      />
                    </div>

                    {/* Expected Criteria, Mistakes, Followups */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb11")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.mustHave")}
                        </label>
                        <textarea id={fieldId("kb11")}
                          rows={3}
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all resize-y"
                          placeholder={t("fixAdmin.kb.phMustHave")}
                          value={expectedPoints}
                          onChange={(e) => setExpectedPoints(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb12")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.commonMistakes")}
                        </label>
                        <textarea id={fieldId("kb12")}
                          rows={3}
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all resize-y"
                          placeholder={t("fixAdmin.kb.phMistakes")}
                          value={commonMistakes}
                          onChange={(e) => setCommonMistakes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb13")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.followUp")}
                        </label>
                        <textarea id={fieldId("kb13")}
                          rows={3}
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all resize-y"
                          placeholder={t("fixAdmin.kb.phFollowUp")}
                          value={followUpQuestions}
                          onChange={(e) => setFollowUpQuestions(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor={fieldId("kb14")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.deliverables")}
                        </label>
                        <textarea id={fieldId("kb14")}
                          rows={3}
                          className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all resize-y"
                          placeholder={t("fixAdmin.kb.phDeliverables")}
                          value={deliverables}
                          onChange={(e) => setDeliverables(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Quality rating slider */}
                    <div className="space-y-2 bg-[#F8FAFC] p-4 rounded-xl">
                      <div className="flex justify-between items-center">
                        <label htmlFor={fieldId("kb15")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                          {t("admin.knowledge.field.qualityScore")}
                        </label>
                        <span className="text-sm font-bold text-primary">{(qualityScore ?? 0.8).toFixed(2)}</span>
                      </div>
                      <input id={fieldId("kb15")}
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full h-2 bg-[#EAEFF8] rounded-lg appearance-none cursor-pointer accent-primary"
                        value={qualityScore}
                        onChange={(e) => setQualityScore(parseFloat(e.target.value))}
                      />
                    </div>

                    <Button variant="primary" size="lg" className="w-full" type="submit" disabled={savingManual}>
                      {savingManual ? t("fixAdmin.kb.submitSaving") : isEditMode ? t("fixAdmin.kb.submitUpdate") : t("fixAdmin.kb.submitCreate")}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Upload zone & Log (Right panel) */}
              <div className="col-span-12 min-w-0 lg:col-span-4 space-y-6">
                {/* Upload Dropzone */}
                <div className="bg-white rounded-3xl p-6 border border-[#DCE4F3] shadow-xs group">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold sm:text-lg">{t("admin.knowledge.ingestDocuments")}</h3>
                    <span className="text-[10px] font-bold text-[#607096] px-2.5 py-1 bg-[#F0F4FC] rounded-full">
                      CSV, JSON
                    </span>
                  </div>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleFileUploadClick}
                    className="border-2 border-dashed border-[#DCE4F3] rounded-xl p-8 flex flex-col items-center justify-center bg-[#F8FAFC]/60 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".csv,.json"
                    />
                    <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                      <UploadCloud
                        className={`size-6 text-primary ${
                          uploading ? "animate-bounce" : ""
                        }`}
                      />
                    </div>
                    <p className="text-on-surface font-semibold text-sm mb-1">
                      {uploading ? t("fixAdmin.kb.uploadProcessing") : t("admin.knowledge.dragDrop")}
                    </p>
                    <p className="text-[#607096] text-xs">{t("fixAdmin.kb.uploadHint")}</p>
                  </div>
                </div>

                {/* Session Log */}
                <div className="bg-white rounded-3xl p-6 border border-[#DCE4F3] shadow-xs">
                  <h3 className="text-base font-bold sm:text-lg mb-4 flex items-center gap-2">
                    <History className="size-5 text-[#287A4B]" />
                    {t("fixAdmin.kb.sessionLogTitle")}
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {ingestedDocs.length === 0 ? (
                      <p className="text-xs text-[#607096] italic text-center py-6">
                        {t("fixAdmin.kb.sessionLogEmpty")}
                      </p>
                    ) : (
                      ingestedDocs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start p-3 bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold text-[#14244B] truncate">{doc.id}</p>
                            <p className="text-[10px] text-[#607096] mt-0.5">
                              {fmt(t("fixAdmin.kb.sessionLogMeta"), { topic: doc.topic, level: doc.difficulty })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-[#607096] block">{doc.timestamp}</span>
                            <span className="inline-block w-2 h-2 rounded-full bg-[#287A4B] mt-1"></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "graph" && (
            <div id="knowledge-panel-graph" role="tabpanel" aria-labelledby="knowledge-tab-graph" className="space-y-6">
              <div className="rounded-3xl border border-[#DCE4F3] bg-white p-6 shadow-xs">
                <div className="flex items-start gap-3"><div className="rounded-xl bg-[#EEF2FD] p-3 text-[#204195]"><Network className="size-6" /></div><div><h2 className="text-base font-bold text-[#14244B] sm:text-lg">{t("fixAdmin.kb.graphTitle")}</h2><p className="mt-1 text-sm text-[#607096]">{t("fixAdmin.kb.graphSubtitle")}</p></div></div>
              </div>
              <div className="rounded-3xl border border-dashed border-[#DCE4F3] bg-white p-6 text-center sm:p-10"><Network className="mx-auto size-9 text-[#204195]" /><h3 className="mt-4 font-bold text-[#14244B]">{t("fixAdmin.kb.graphEmptyTitle")}</h3><p className="mx-auto mt-2 max-w-xl text-sm text-[#607096]">{t("fixAdmin.kb.graphEmptyBody")}</p><div className="mx-auto mt-6 max-w-xl rounded-xl bg-[#F8FAFC] p-4 text-left font-mono text-xs text-[#607096] [overflow-wrap:anywhere]">GET /admin/question-bank/graph?rootType=questionVersion&amp;rootId=...<br />GET /admin/taxonomy/active</div></div>
            </div>
          )}

          {/* TAB 3: PLAYGROUND / TESTING RETRIEVAL */}
          {activeTab === "playground" && (
            <div id="knowledge-panel-vector" role="tabpanel" aria-labelledby="knowledge-tab-vector" className="grid grid-cols-12 gap-8">
              {/* Controls (Left Column) */}
              <div className="col-span-12 min-w-0 lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-[#DCE4F3] shadow-xs">
                  <h3 className="text-base font-bold sm:text-lg mb-6 flex items-center gap-2">
                    <Sliders className="size-5 text-primary" />
                    {t("fixAdmin.kb.filtersTitle")}
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor={fieldId("kb16")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">{t("fixAdmin.kb.queryText")}</label>
                      <input id={fieldId("kb16")}
                        type="text"
                        placeholder={t("fixAdmin.kb.queryPlaceholder")}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={fieldId("kb17")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">{t("fixAdmin.kb.topicFilter")}</label>
                      <input id={fieldId("kb17")}
                        type="text"
                        placeholder="python-oop, caching-strategies..."
                        value={topicFilter}
                        onChange={handleTopicFilterChange}
                        className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={fieldId("kb18")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">{t("fixAdmin.kb.difficultyFilter")}</label>
                      <select id={fieldId("kb18")}
                        value={difficultyFilter}
                        onChange={handleDifficultyFilterChange}
                        className="w-full bg-[#F8FAFC] border border-[#DCE4F3] rounded-lg text-sm p-3 outline-none focus:ring-2 focus:ring-[#204195]/20 focus:border-[#204195] transition-all cursor-pointer"
                      >
                        <option value="all">{t("fixAdmin.kb.allDifficulties")}</option>
                        <option value="basic">{t("fixAdmin.kb.diffBasic")}</option>
                        <option value="intermediate">{t("fixAdmin.kb.diffIntermediate")}</option>
                        <option value="advanced">{t("fixAdmin.kb.diffAdvanced")}</option>
                      </select>
                    </div>

                    {/* Weight sliders */}
                    <div className="pt-4 border-t border-[#DCE4F3] space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label htmlFor={fieldId("kb19")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">{t("fixAdmin.kb.simWeight")}</label>
                          <span className="text-xs font-bold text-primary">{(simWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input id={fieldId("kb19")}
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={simWeight}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSimWeight(val);
                            setQualWeight(1 - val);
                          }}
                          className="w-full h-1.5 bg-[#EAEFF8] rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label htmlFor={fieldId("kb20")} className="text-xs font-bold uppercase tracking-wider text-[#607096]">{t("fixAdmin.kb.qualWeight")}</label>
                          <span className="text-xs font-bold text-[#204195]">{(qualWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input id={fieldId("kb20")}
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={qualWeight}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setQualWeight(val);
                            setSimWeight(1 - val);
                          }}
                          className="w-full h-1.5 bg-[#EAEFF8] rounded-lg appearance-none cursor-pointer accent-[#204195]"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-[#607096] italic mt-2 leading-relaxed bg-[#F8FAFC] p-2.5 rounded border border-[#DCE4F3]">
                      {fmt(t("fixAdmin.kb.rerankFormula"), { sim: simWeight.toFixed(2), qual: qualWeight.toFixed(2) })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Results (Right Column) */}
              <div className="col-span-12 min-w-0 lg:col-span-8 space-y-6">
                {/* Stats bar if search occurred */}
                {retrievalStats && (
                  <div className="grid grid-cols-5 gap-3 p-4 bg-[#F0F4FC] border border-[#DCE4F3] rounded-xl">
                    <div className="text-center border-r border-[#DCE4F3]">
                      <p className="text-[9px] font-bold text-[#607096] uppercase tracking-wider">{t("fixAdmin.kb.statTotal")}</p>
                      <p className="text-lg font-black mt-0.5 text-primary">{retrievalStats.original_count}</p>
                    </div>
                    <div className="text-center border-r border-[#DCE4F3]">
                      <p className="text-[9px] font-bold text-[#607096] uppercase tracking-wider">{t("fixAdmin.kb.statDuplicates")}</p>
                      <p className="text-lg font-black mt-0.5 text-[#8A5A00]">{retrievalStats.duplicates_removed}</p>
                    </div>
                    <div className="text-center border-r border-[#DCE4F3]">
                      <p className="text-[9px] font-bold text-[#607096] uppercase tracking-wider">{t("fixAdmin.kb.statTopic")}</p>
                      <p className="text-lg font-black mt-0.5 text-[#C43B3B]">{retrievalStats.topic_mismatches_removed}</p>
                    </div>
                    <div className="text-center border-r border-[#DCE4F3]">
                      <p className="text-[9px] font-bold text-[#607096] uppercase tracking-wider">{t("fixAdmin.kb.statDifficulty")}</p>
                      <p className="text-lg font-black mt-0.5 text-[#8A5A00]">{retrievalStats.difficulty_mismatches_removed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-[#607096] uppercase tracking-wider">{t("fixAdmin.kb.statShown")}</p>
                      <p className="text-lg font-black mt-0.5 text-[#287A4B]">{retrievalStats.final_count}</p>
                    </div>
                  </div>
                )}

                {/* Main Results tabs */}
                <div className="bg-white border border-[#DCE4F3] rounded-3xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-[#DCE4F3] flex justify-between items-center bg-[#F8FAFC]/60">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Database className="size-5 text-primary" />
                      {t("fixAdmin.kb.resultsTitle")}
                    </h4>
                  </div>
                  <div className="divide-y divide-[#EAEFF8] max-h-[600px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-12 text-center text-sm text-[#607096] animate-pulse font-medium">
                        {t("fixAdmin.kb.searching")}
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((chunk, idx) => {
                        const cType = chunk.metadata?.chunk_type || "knowledge";
                        const rawSim = chunk.metadata?.raw_similarity_score ?? chunk.score;
                        // No invented fallback: a missing quality score is shown as "—".
                        const qualScore = chunk.metadata?.quality_score;
                        const finalScore = chunk.score;

                        return (
                          <div key={idx} className="p-5 hover:bg-[#F8FAFC]/60 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[9px] font-bold text-primary uppercase px-2 py-0.5 bg-[#F0F4FC] border border-[#DCE4F3] rounded">
                                {t(`admin.knowledge.chunkType.${cType}`)}
                              </span>
                              <span className="text-xs font-black text-[#14244B]">
                                {fmt(t("fixAdmin.kb.rerankScore"), { n: Math.round(finalScore * 100) })}
                              </span>
                            </div>

                            {/* Score contribution visualization */}
                            <div className="grid grid-cols-2 gap-4 my-2 text-[10px] text-[#607096] font-semibold bg-[#F8FAFC] p-2.5 rounded-lg border border-[#DCE4F3]">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>{t("fixAdmin.kb.similarityScore")}</span>
                                  <span>{Math.round(rawSim * 100)}% {fmt(t("fixAdmin.kb.weightShort"), { n: (simWeight * 100).toFixed(0) })}</span>
                                </div>
                                <div className="w-full bg-[#EAEFF8] h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-primary h-full rounded-full" style={{ width: `${rawSim * 100}%` }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>{t("fixAdmin.kb.qualityScore")}</span>
                                  <span>{typeof qualScore === "number" ? `${Math.round(qualScore * 100)}%` : "—"} {fmt(t("fixAdmin.kb.weightShort"), { n: (qualWeight * 100).toFixed(0) })}</span>
                                </div>
                                <div className="w-full bg-[#EAEFF8] h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-[#204195] h-full rounded-full" style={{ width: `${(qualScore ?? 0) * 100}%` }}></div>
                                </div>
                              </div>
                            </div>

                            <p className="text-sm leading-relaxed my-3 whitespace-pre-line bg-[#F8FAFC] p-3 rounded-xl border border-[#DCE4F3] font-medium">
                              {chunk.text}
                            </p>
                            
                            <div className="text-[10px] text-[#607096] flex flex-wrap gap-x-2 gap-y-1 italic border-t border-[#DCE4F3] pt-2.5 mt-2">
                              <span>{fmt(t("fixAdmin.kb.source"), { id: chunk.metadata?.knowledge_unit_id || chunk.metadata?.document_id || "—" })}</span>
                              <span>{fmt(t("fixAdmin.kb.chunkTopic"), { topic: chunk.metadata?.topic || "—" })}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-12 text-center text-sm text-[#607096] italic">
                        {t("fixAdmin.kb.playgroundEmpty")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated Compiled Prompt Preview */}
                {promptPreview && (
                  <div className="bg-white border border-[#DCE4F3] rounded-3xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-[#DCE4F3] bg-[#F8FAFC]/60">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <Code className="size-5 text-[#204195]" />
                        {t("fixAdmin.kb.promptPreviewTitle")}
                      </h4>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-[#607096] mb-3">
                        {t("fixAdmin.kb.promptPreviewHint")}
                      </p>
                      <pre className="bg-[#14244B] text-[#9FE0B8] text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[350px] font-mono leading-relaxed border border-[#14244B]">
                        {promptPreview}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI QUALITY EVALUATION REPORT MODAL */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#14244B]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={evalDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={evalTitleId}
            aria-busy={isEvaluating}
            className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#DCE4F3] max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-[#DCE4F3] flex justify-between items-center bg-[#F0F4FC]">
              <h3 id={evalTitleId} className="font-black text-lg flex items-center gap-2 text-[#204195]">
                <Brain className="size-5" aria-hidden="true" />
                {fmt(t("fixAdmin.kb.evalTitle"), { id: evalDocId })}
              </h3>
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                aria-label={t("fixAdmin.kb.closeDialog")}
                className="p-1.5 rounded-full text-[#607096] hover:text-[#14244B] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]/30"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {isEvaluating ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-[#204195] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-[#607096] font-medium animate-pulse">
                    {t("fixAdmin.kb.evaluating")}
                  </p>
                </div>
              ) : evalData ? (
                <div className="space-y-6">
                  {/* Scores Bar */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#DCE4F3] text-center">
                      <p className="text-[10px] font-bold text-[#607096] uppercase">{t("fixAdmin.kb.evalTotal")}</p>
                      <p className="text-3xl font-black mt-1 text-[#204195]">{(evalData.score * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#DCE4F3] text-center">
                      <p className="text-[10px] font-bold text-[#607096] uppercase">{t("fixAdmin.kb.evalDepth")}</p>
                      <p className="text-3xl font-black mt-1 text-[#204195]">{(evalData.technical_depth_score * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#DCE4F3] text-center">
                      <p className="text-[10px] font-bold text-[#607096] uppercase">{t("fixAdmin.kb.evalClarity")}</p>
                      <p className="text-3xl font-black mt-1 text-[#287A4B]">{(evalData.criteria_clarity_score * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Findings */}
                  <div>
                    <h4 className="font-bold text-[#14244B] mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-[#287A4B]" />
                      {t("fixAdmin.kb.evalFindings")}
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-[#607096]">
                      {evalData.findings?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  {evalData.suggestions && evalData.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-bold text-[#14244B] mb-2 flex items-center gap-1.5">
                        <Lightbulb className="size-4 text-[#B07A00]" />
                        {t("fixAdmin.kb.evalSuggestions")}
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-[#607096]">
                        {evalData.suggestions.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Score adjustment recommendation */}
                  <div className="p-4 bg-[#F0F4FC] border border-[#DCE4F3] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#14244B]">{t("fixAdmin.kb.evalSuggestedScore")}</p>
                      <p className="text-xs text-[#204195] mt-0.5">
                        {t("fixAdmin.kb.evalSuggestedHint")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#204195] mr-4">
                        {(evalData.adjusted_quality_score ?? evalData.score).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleApplyQualityScore(evalData.adjusted_quality_score ?? evalData.score)}
                        type="button"
                        className="px-3.5 py-1.5 bg-[#204195] text-white font-bold rounded-full text-xs hover:bg-[#183275] shadow"
                      >
                        {t("fixAdmin.kb.apply")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 italic text-[#607096]">
                  {t("fixAdmin.kb.evalNoResult")}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#DCE4F3] flex justify-end">
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                className="px-4 py-2 border border-[#DCE4F3] hover:bg-[#F8FAFC] rounded-full text-xs font-bold text-[#14244B]"
              >
                {t("fixAdmin.kb.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.kind === "bulk"
            ? fmt(t("fixAdmin.kb.bulkDeleteTitle"), { n: pendingDelete.ids.length })
            : t("fixAdmin.kb.deleteTitle")
        }
        body={
          pendingDelete?.kind === "bulk"
            ? fmt(t("fixAdmin.kb.bulkDeleteBody"), { n: pendingDelete.ids.length })
            : fmt(t("fixAdmin.kb.deleteBody"), { id: pendingDelete?.ids[0] ?? "" })
        }
        confirmLabel={isDeleting ? t("fixAdmin.kb.deleting") : t("fixAdmin.kb.confirmDelete")}
        cancelLabel={t("fixAdmin.kb.cancel")}
        tone="danger"
        busy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
