"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import LanguageToggleButton from "../../../components/LanguageToggleButton";

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
  const [activeTab, setActiveTab] = useState<"catalog" | "editor" | "playground">("catalog");

  // Document list states
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  // Edit Mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDocId, setEditDocId] = useState("");

  // Evaluation AI Modal states
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalDocId, setEvalDocId] = useState("");
  const [evalData, setEvalData] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

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
      const response = await axios.get(`${RAG_API_URL}/api/v1/rag/documents`);
      if (response.data?.success) {
        setDocuments(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      showNotification("error", "Không thể tải danh sách tài liệu từ máy chủ RAG.");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Delete a document
  const handleDeleteDoc = async (documentId: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài liệu '${documentId}'? Tất cả các chunks liên quan sẽ bị xóa.`)) {
      return;
    }
    try {
      const response = await axios.delete(`${RAG_API_URL}/api/v1/rag/documents/${documentId}`);
      if (response.data?.success) {
        showNotification("success", `Đã xóa thành công tài liệu '${documentId}'`);
        fetchDocuments();
        // If searching, refresh playground search
        if (searchQuery || topicFilter) {
          performSearch(searchQuery, difficultyFilter, topicFilter);
        }
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      showNotification("error", `Lỗi khi xóa tài liệu: ${documentId}`);
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
        showNotification("success", `Đã ${targetState ? "kích hoạt" : "vô hiệu hóa"} tài liệu '${documentId}'`);
        // Update local state directly for responsive UI
        setDocuments((prev) =>
          prev.map((d) => (d.document_id === documentId ? { ...d, is_active: targetState } : d))
        );
      }
    } catch (err) {
      console.error("Error toggling active status:", err);
      showNotification("error", "Không thể cập nhật trạng thái hoạt động.");
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
      showNotification("error", "Lỗi khi tải dữ liệu tài liệu.");
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
        showNotification("error", "Lỗi máy chủ khi đánh giá tài liệu.");
      }
    } catch (err) {
      console.error("Error evaluating document:", err);
      showNotification("error", "Lỗi kết nối khi gọi AI đánh giá.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Apply suggestions and adjust quality score in DB
  const handleApplyQualityScore = async (score: number) => {
    try {
      setQualityScore(score);
      showNotification("success", `Đã lưu điểm chất lượng gợi ý: ${score.toFixed(2)}. Hãy nhấn "Lưu tài liệu" để hoàn thành cập nhật.`);
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
      const payload: Record<string, any> = {
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
      showNotification("error", "Vui lòng nhập Document ID.");
      return;
    }
    if (!topicName.trim()) {
      showNotification("error", "Vui lòng nhập Tên chủ đề.");
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
            ? `Cập nhật tài liệu '${docId}' thành công. Đã cập nhật ${response.data.records || 0} chunks.`
            : `Tài liệu '${docId}' đã được nạp thành công và chia thành ${response.data.records || 0} chunks.`
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
        showNotification("error", response.data?.error || "Không thể lưu tài liệu.");
      }
    } catch (err: any) {
      console.error("Error upserting doc:", err);
      showNotification("error", err.response?.data?.error || "Lỗi kết nối máy chủ RAG.");
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
      showNotification("error", "Chỉ hỗ trợ nhập tài liệu từ tệp CSV (.csv) hoặc JSON (.json).");
      return;
    }

    setUploading(true);
    showNotification("success", `Đang tải lên và phân tích tệp ${fileName}...`);

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
          showNotification("success", `Nạp thành công ${count} tài liệu từ tệp CSV!`);
          fetchDocuments();

          const newLogs: IngestedDocument[] = (response.data.imported_document_ids || []).map(
            (id: string) => ({
              id,
              topic: "Imported via CSV",
              difficulty: "Dynamic",
              status: "success",
              timestamp: new Date().toLocaleTimeString(),
            })
          );
          setIngestedDocs((prev) => [...newLogs, ...prev]);
        } else {
          showNotification("error", response.data?.error || "Lỗi khi nạp tệp CSV.");
        }
      } catch (err: any) {
        console.error("Error uploading CSV:", err);
        showNotification("error", err.response?.data?.error || "Lỗi kết nối máy chủ RAG.");
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
            showNotification("success", `Nạp thành công tài liệu JSON: ${docIdVal}`);
            fetchDocuments();

            const logDoc: IngestedDocument = {
              id: docIdVal,
              topic: docObj.topic?.topic_name || "JSON Upload",
              difficulty: docObj.difficulty?.level || "Dynamic",
              status: "success",
              timestamp: new Date().toLocaleTimeString(),
            };
            setIngestedDocs((prev) => [logDoc, ...prev]);
          } else {
            showNotification("error", response.data?.error || "Lỗi khi nạp tài liệu JSON.");
          }
        } catch (err: any) {
          console.error("Error parsing/uploading JSON:", err);
          showNotification("error", "Định dạng JSON không hợp lệ hoặc lỗi kết nối.");
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

  // Filter documents in client table based on search
  const filteredDocs = documents.filter((doc) => {
    const q = catalogSearch.toLowerCase();
    return (
      doc.document_id.toLowerCase().includes(q) ||
      doc.topic.toLowerCase().includes(q) ||
      doc.domain.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-[9999] max-w-md p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 text-white flex items-start gap-3 border ${
            notification.type === "success"
              ? "bg-green-600 border-green-500"
              : "bg-red-600 border-red-500"
          }`}
        >
          <span className="material-symbols-outlined mt-0.5">
            {notification.type === "success" ? "check_circle" : "error"}
          </span>
          <div>
            <p className="font-bold text-sm">
              {notification.type === "success" ? "Thành công" : "Lỗi xử lý"}
            </p>
            <p className="text-xs opacity-90 leading-relaxed mt-1">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 z-50 flex h-dvh w-80 flex-col overflow-y-auto overscroll-contain bg-[#f2f4f6] font-headline antialiased tracking-tight dark:bg-slate-900 xl:w-96">
        <div className="flex flex-col h-full py-12 px-6">
          <AdminSidebarBrand />

          <nav className="flex-1 space-y-2">
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/dashboard"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>{t("common.dashboard")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/interviews"
            >
              <span className="material-symbols-outlined">video_chat</span>
              <span>{t("admin.interviews")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/insights"
            >
              <span className="material-symbols-outlined">psychology</span>
              <span>{t("admin.aiInsights")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] dark:border-blue-400 bg-white/50 dark:bg-white/5"
              href="/admin/knowledge-base"
            >
              <span className="material-symbols-outlined">library_books</span>
              <span>{t("admin.knowledgeBase")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/settings"
            >
              <span className="material-symbols-outlined">settings</span>
              <span>{t("common.settings")}</span>
            </Link>
          </nav>

          <div className="mt-auto space-y-2 pt-6 border-t border-outline-variant/20">
            <AdminButton variant="gradient" size="md" icon="auto_awesome" iconFill className="w-full mb-6">
              {t("admin.settings.startAiAnalysis")}
            </AdminButton>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-[#e0e3e5] transition-colors duration-200"
              href="/admin/help"
            >
              <span className="material-symbols-outlined">help</span>
              <span>{t("common.helpCenter")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-[#e0e3e5] transition-colors duration-200"
              href="/logout"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>{t("common.logout")}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-80 min-h-screen flex flex-col bg-surface xl:ml-96">
        {/* Top Header Navbar */}
        <header className="flex justify-between items-center h-20 px-12 sticky top-0 bg-[#f7f9fb] dark:bg-slate-950 z-40 border-b border-outline-variant/5">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black text-[#191c1e] dark:text-white font-headline">
              {t("admin.topbar.title")}
            </h2>
            
            {/* Custom Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab("catalog")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "catalog"
                    ? "bg-white dark:bg-slate-700 text-primary shadow"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-sm">view_list</span>
                Quản lý Unit
              </button>
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "editor"
                    ? "bg-white dark:bg-slate-700 text-primary shadow"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isEditMode ? "edit_document" : "add_box"}
                </span>
                {isEditMode ? "Sửa tài liệu" : "Biên tập & Nạp"}
              </button>
              <button
                onClick={() => setActiveTab("playground")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "playground"
                    ? "bg-white dark:bg-slate-700 text-primary shadow"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined text-sm">science</span>
                RAG Playground
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <LanguageToggleButton className="material-symbols-outlined rounded-full p-2 transition-colors hover:bg-surface-container" />
            <Link href="/admin/profile" aria-label="Open profile settings">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-outline-variant/30">
                <img
                  alt="Administrator Profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2PaN3-0pU4S-qEkEvMq-k8OLUcC_FHxLyPcloSmcN31xwjvzJtFjKByuhHM1AGBo-y82OnD8GcbBKJdRyzHOQGDCNeQj9L8OwJhs6Jiu96vGtvSdPOFDFMngbsnXqSebPxq36xqFHgA9gNZLPm8MMk5titPOdWgL4giUiUc0t7KtrMJ5YFmwrKruBN5yHTt_b07szL4CrFLevJABdeiHkgrL87j70DioANLK3s7SVwJmNzX2qDB02_qTiZvjwIT_g03g-_OtbOLZF"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="p-12 flex-1">
          {/* TAB 1: CATALOG OF KNOWLEDGE UNITS */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black font-headline tracking-tight">Danh sách các Tri Thức nguồn (Units)</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Xem, kích hoạt/vô hiệu hóa, đánh giá tự động và quản lý vòng đời dữ liệu RAG.
                  </p>
                </div>
                <div className="flex gap-3">
                  <AdminButton variant="outline" size="md" onClick={downloadCsvTemplate}>
                    Tải CSV Template
                  </AdminButton>
                  <AdminButton variant="primary" size="md" onClick={() => { setIsEditMode(false); setActiveTab("editor"); }}>
                    Thêm tài liệu mới
                  </AdminButton>
                </div>
              </div>

              {/* Filtering bar */}
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-4 items-center">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Tìm tài liệu theo ID, chủ đề, domain..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full font-medium"
                />
              </div>

              {/* Catalog Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {isLoadingDocs ? (
                  <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
                    Đang tải danh sách tri thức từ máy chủ...
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 italic">
                    {catalogSearch ? "Không tìm thấy tài liệu phù hợp." : "Chưa có tài liệu tri thức nào. Hãy nạp tài liệu mới ở Tab bên cạnh."}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100 dark:border-slate-700">
                        <th className="p-4">Document ID</th>
                        <th className="p-4">Topic / Domain</th>
                        <th className="p-4">Độ khó</th>
                        <th className="p-4 text-center">Ngôn ngữ</th>
                        <th className="p-4 text-center">Số Chunks</th>
                        <th className="p-4 text-center">Điểm Chất lượng</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {filteredDocs.map((doc) => (
                        <tr key={doc.document_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 font-bold text-slate-950 dark:text-slate-100">
                            {doc.document_id}
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-bold mr-1.5">
                              {doc.topic}
                            </span>
                            <span className="text-slate-400 text-xs font-medium">({doc.domain})</span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold capitalize ${
                              doc.difficulty === "basic"
                                ? "bg-green-50 text-green-700 dark:bg-green-900/30"
                                : doc.difficulty === "intermediate"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30"
                                : "bg-red-50 text-red-700 dark:bg-red-900/30"
                            }`}>
                              {doc.difficulty}
                            </span>
                          </td>
                          <td className="p-4 text-center capitalize font-semibold">{doc.language}</td>
                          <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-400">{doc.chunk_count}</td>
                          <td className="p-4 text-center">
                            <span className="font-extrabold text-primary px-2 py-0.5 bg-primary/5 rounded border border-primary/20 text-xs">
                              {(doc.quality_score ?? 0.8).toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={doc.is_active}
                                onChange={() => handleToggleActive(doc.document_id, doc.is_active)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleEvaluateDoc(doc.document_id)}
                              title="Đánh giá chất lượng tự động bằng AI"
                              className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors inline-flex items-center"
                            >
                              <span className="material-symbols-outlined text-lg">psychology</span>
                            </button>
                            <button
                              onClick={() => handleLoadEdit(doc.document_id)}
                              title="Chỉnh sửa nội dung"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors inline-flex items-center"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.document_id)}
                              title="Xóa tài liệu"
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors inline-flex items-center"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL EDITOR AND DROP INGESTION */}
          {activeTab === "editor" && (
            <div className="grid grid-cols-12 gap-8">
              {/* Form Input (Left panel) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-xl font-bold font-headline text-on-surface">
                        {isEditMode ? `Biên tập tài liệu: ${editDocId}` : "Biên tập tài liệu phỏng vấn tri thức"}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">
                        {isEditMode ? "Đang chạy chế độ chỉnh sửa. Tất cả thay đổi sẽ ghi đè và tái nhúng vector các chunks." : "Nhập tài liệu tri thức phỏng vấn có cấu trúc chuẩn hệ thống."}
                      </p>
                    </div>
                    {isEditMode && (
                      <button
                        onClick={handleCancelEdit}
                        className="text-xs font-bold text-red-500 bg-red-50 px-3.5 py-1.5 rounded-lg hover:bg-red-100"
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>
                  
                  <form onSubmit={handleManualDocSubmit} className="space-y-6">
                    {/* Basic Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.documentId")} *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isEditMode}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all disabled:opacity-50"
                          placeholder="VD: int_doc_python_oop_01"
                          value={docId}
                          onChange={(e) => setDocId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.topicName")} *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                          placeholder="VD: python-oop"
                          value={topicName}
                          onChange={(e) => setTopicName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.domain")}
                        </label>
                        <input
                          type="text"
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.difficulty")}
                        </label>
                        <select
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all cursor-pointer"
                          value={difficultyLevel}
                          onChange={(e) => setDifficultyLevel(e.target.value)}
                        >
                          <option value="basic">Basic</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Phiên bản
                        </label>
                        <input
                          type="text"
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Ngôn ngữ
                        </label>
                        <select
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all cursor-pointer"
                          value={docLang}
                          onChange={(e) => setDocLang(e.target.value)}
                        >
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">Tiếng Anh</option>
                        </select>
                      </div>
                    </div>

                    {/* Target Audience & Stack */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.roleTargets")}
                        </label>
                        <input
                          type="text"
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                          placeholder="VD: backend-engineer;python-developer"
                          value={roleTargets}
                          onChange={(e) => setRoleTargets(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.jobLevels")}
                        </label>
                        <input
                          type="text"
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                          placeholder="VD: junior;mid"
                          value={jobLevels}
                          onChange={(e) => setJobLevels(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Knowledge Unit Content */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t("admin.knowledge.field.knowledgeSummary")}
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                        placeholder="VD: Hiểu về Kế thừa, Đóng gói, Đa hình và Trừu tượng trong Python."
                        value={knowledgeSummary}
                        onChange={(e) => setKnowledgeSummary(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t("admin.knowledge.field.concepts")}
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                        placeholder="VD: MRO (Method Resolution Order);Abstract Class;Interface"
                        value={knowledgeConcepts}
                        onChange={(e) => setKnowledgeConcepts(e.target.value)}
                      />
                    </div>

                    {/* Expected Criteria, Mistakes, Followups */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.mustHave")}
                        </label>
                        <textarea
                          rows={3}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                          placeholder="Mỗi tiêu chí nằm trên một dòng riêng biệt..."
                          value={expectedPoints}
                          onChange={(e) => setExpectedPoints(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.commonMistakes")}
                        </label>
                        <textarea
                          rows={3}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                          placeholder="Mỗi sai lầm nằm trên một dòng riêng biệt..."
                          value={commonMistakes}
                          onChange={(e) => setCommonMistakes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.followUp")}
                        </label>
                        <textarea
                          rows={3}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                          placeholder="Mỗi câu hỏi bổ trợ nằm trên một dòng riêng biệt..."
                          value={followUpQuestions}
                          onChange={(e) => setFollowUpQuestions(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.deliverables")}
                        </label>
                        <textarea
                          rows={3}
                          className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                          placeholder="Mỗi bài tập thực hành/sản phẩm nằm trên một dòng riêng biệt..."
                          value={deliverables}
                          onChange={(e) => setDeliverables(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Quality rating slider */}
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {t("admin.knowledge.field.qualityScore")}
                        </label>
                        <span className="text-sm font-bold text-primary">{(qualityScore ?? 0.8).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        value={qualityScore}
                        onChange={(e) => setQualityScore(parseFloat(e.target.value))}
                      />
                    </div>

                    <AdminButton variant="primary" size="lg" className="w-full" type="submit" disabled={savingManual}>
                      {savingManual ? "Đang huấn luyện & nạp RAG..." : isEditMode ? "Cập nhật tài liệu tri thức" : "Huấn luyện & lưu tài liệu"}
                    </AdminButton>
                  </form>
                </div>
              </div>

              {/* Upload zone & Log (Right panel) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* Upload Dropzone */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm group">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold font-headline">{t("admin.knowledge.ingestDocuments")}</h3>
                    <span className="text-[10px] font-bold text-slate-500 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                      CSV, JSON
                    </span>
                  </div>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleFileUploadClick}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 transition-colors cursor-pointer"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".csv,.json"
                    />
                    <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                      <span
                        className={`material-symbols-outlined text-primary text-2xl ${
                          uploading ? "animate-bounce" : ""
                        }`}
                      >
                        cloud_upload
                      </span>
                    </div>
                    <p className="text-on-surface font-semibold text-sm mb-1">
                      {uploading ? "Đang xử lý tệp..." : t("admin.knowledge.dragDrop")}
                    </p>
                    <p className="text-slate-400 text-xs">{t("admin.knowledge.maxPerFile")}</p>
                  </div>
                </div>

                {/* Session Log */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold font-headline mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500">history_edu</span>
                    Tài liệu vừa nạp (Lượt này)
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {ingestedDocs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">
                        Chưa nạp tài liệu nào trong phiên này.
                      </p>
                    ) : (
                      ingestedDocs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-lg"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{doc.id}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Topic: {doc.topic} • Lvl: {doc.difficulty}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block">{doc.timestamp}</span>
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1"></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLAYGROUND / TESTING RETRIEVAL */}
          {activeTab === "playground" && (
            <div className="grid grid-cols-12 gap-8">
              {/* Controls (Left Column) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold font-headline mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">tune</span>
                    Bộ lọc & Rerank Weights
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Query Text</label>
                      <input
                        type="text"
                        placeholder="Nhập câu hỏi test retrieval..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Lọc Topic</label>
                      <input
                        type="text"
                        placeholder="python-oop, caching-strategies..."
                        value={topicFilter}
                        onChange={handleTopicFilterChange}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Lọc Độ khó</label>
                      <select
                        value={difficultyFilter}
                        onChange={handleDifficultyFilterChange}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="all">Tất cả độ khó</option>
                        <option value="basic">Basic</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    {/* Weight sliders */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Similarity Weight (Vector)</label>
                          <span className="text-xs font-bold text-primary">{(simWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input
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
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quality Weight (Intrinsic)</label>
                          <span className="text-xs font-bold text-purple-600">{(qualWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input
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
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic mt-2 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      Rerank score = (Similarity Score * {simWeight.toFixed(2)}) + (Quality Score * {qualWeight.toFixed(2)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Results (Right Column) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                {/* Stats bar if search occurred */}
                {retrievalStats && (
                  <div className="grid grid-cols-5 gap-3 p-4 bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl">
                    <div className="text-center border-r border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tổng Chunks tìm thấy</p>
                      <p className="text-lg font-black mt-0.5 text-primary">{retrievalStats.original_count}</p>
                    </div>
                    <div className="text-center border-r border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Trùng lặp đã loại</p>
                      <p className="text-lg font-black mt-0.5 text-amber-600">{retrievalStats.duplicates_removed}</p>
                    </div>
                    <div className="text-center border-r border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Lọc sai Topic</p>
                      <p className="text-lg font-black mt-0.5 text-red-500">{retrievalStats.topic_mismatches_removed}</p>
                    </div>
                    <div className="text-center border-r border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Lọc sai Độ khó</p>
                      <p className="text-lg font-black mt-0.5 text-orange-500">{retrievalStats.difficulty_mismatches_removed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hiển thị (k)</p>
                      <p className="text-lg font-black mt-0.5 text-green-600">{retrievalStats.final_count}</p>
                    </div>
                  </div>
                )}

                {/* Main Results tabs */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">data_object</span>
                      Kết quả truy xuất Chunks
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-12 text-center text-sm text-slate-500 animate-pulse font-medium">
                        Đang truy xuất ngữ cảnh và tính toán Rerank...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((chunk, idx) => {
                        const cType = chunk.metadata?.chunk_type || "knowledge";
                        const rawSim = chunk.metadata?.raw_similarity_score ?? chunk.score;
                        const qualScore = chunk.metadata?.quality_score ?? 0.8;
                        const finalScore = chunk.score;

                        return (
                          <div key={idx} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[9px] font-bold text-primary uppercase px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded">
                                {t(`admin.knowledge.chunkType.${cType}`)}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                Rerank Score: {Math.round(finalScore * 100)}%
                              </span>
                            </div>

                            {/* Score contribution visualization */}
                            <div className="grid grid-cols-2 gap-4 my-2 text-[10px] text-slate-500 font-semibold bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>Similarity Score:</span>
                                  <span>{Math.round(rawSim * 100)}% (wt: {(simWeight * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-primary h-full rounded-full" style={{ width: `${rawSim * 100}%` }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span>Quality Score:</span>
                                  <span>{Math.round(qualScore * 100)}% (wt: {(qualWeight * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${qualScore * 100}%` }}></div>
                                </div>
                              </div>
                            </div>

                            <p className="text-sm leading-relaxed my-3 whitespace-pre-line bg-[#fafafa] dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-medium">
                              {chunk.text}
                            </p>
                            
                            <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-1 italic border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-2">
                              <span>Nguồn: {chunk.metadata?.knowledge_unit_id || chunk.metadata?.document_id}</span>
                              <span>• Topic: {chunk.metadata?.topic}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-12 text-center text-sm text-slate-500 italic">
                        Nhập từ khóa tìm kiếm hoặc lọc chủ đề ở cột bên trái để bắt đầu.
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulated Compiled Prompt Preview */}
                {promptPreview && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600 text-lg">code</span>
                        Trình biên dịch Prompt mô phỏng (Prompt Preview)
                      </h4>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-slate-400 mb-3">
                        Đây là cấu trúc prompt hoàn chỉnh sẽ được gửi tới LLM sau khi chèn các ngữ cảnh đã truy xuất thông qua RAG ở trên.
                      </p>
                      <pre className="bg-slate-950 text-green-400 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-[350px] font-mono leading-relaxed border border-slate-900">
                        {promptPreview}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI QUALITY EVALUATION REPORT MODAL */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-purple-50/30 dark:bg-purple-950/20">
              <h3 className="font-black text-lg flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <span className="material-symbols-outlined">psychology</span>
                Báo cáo đánh giá tri thức AI: {evalDocId}
              </h3>
              <button
                onClick={() => setIsEvalModalOpen(false)}
                className="material-symbols-outlined text-slate-500 hover:text-slate-800"
              >
                close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {isEvaluating ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-500 font-medium animate-pulse">
                    AI đang phân tích chất lượng tài liệu và kiểm duyệt nội dung RAG...
                  </p>
                </div>
              ) : evalData ? (
                <div className="space-y-6">
                  {/* Scores Bar */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng điểm chất lượng</p>
                      <p className="text-3xl font-black mt-1 text-purple-600">{(evalData.score * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Chiều sâu kỹ thuật</p>
                      <p className="text-3xl font-black mt-1 text-blue-600">{(evalData.technical_depth_score * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Độ rõ ràng tiêu chí</p>
                      <p className="text-3xl font-black mt-1 text-green-600">{(evalData.criteria_clarity_score * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Findings */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                      Kết quả ghi nhận
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                      {evalData.findings?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  {evalData.suggestions && evalData.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-500 text-base">lightbulb</span>
                        Đề xuất cải tiến
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                        {evalData.suggestions.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Score adjustment recommendation */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-purple-900 dark:text-purple-300">Điểm chất lượng được đề xuất (RAG Quality Score)</p>
                      <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                        Áp dụng điểm này sẽ tăng/giảm tỉ lệ xuất hiện của tài liệu khi Reranking RAG.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-purple-700 dark:text-purple-400 mr-4">
                        {(evalData.adjusted_quality_score ?? evalData.score).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleApplyQualityScore(evalData.adjusted_quality_score ?? evalData.score)}
                        className="px-3.5 py-1.5 bg-purple-600 text-white font-bold rounded-lg text-xs hover:bg-purple-700 shadow"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 italic text-slate-500">
                  Không nhận được kết quả đánh giá từ máy chủ.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsEvalModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
