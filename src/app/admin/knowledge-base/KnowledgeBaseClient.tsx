"use client";

import React, { useState, useRef } from "react";
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
  details?: string;
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

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultChunk[]>([]);
  const [followUpsResults, setFollowUpsResults] = useState<SearchResultChunk[]>([]);
  const [deliverablesResults, setDeliverablesResults] = useState<SearchResultChunk[]>([]);
  const [retrievalStats, setRetrievalStats] = useState<RAGRetrievalStats | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Form Fields for full Interview Document upsert
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

  // Perform search / retrieve
  const performSearch = async (query: string, diff: string, topic: string) => {
    if (!query.trim() && !topic.trim()) {
      setSearchResults([]);
      setFollowUpsResults([]);
      setDeliverablesResults([]);
      setRetrievalStats(null);
      return;
    }

    setIsSearching(true);
    try {
      const payload: Record<string, any> = {
        query_text: query.trim() || undefined,
        topic: topic.trim() || undefined,
        difficulty: diff !== "all" ? diff : undefined,
        k: 10,
      };

      const response = await axios.post(`${RAG_API_URL}/retrieve`, payload);

      if (response.data?.success && response.data?.data) {
        const { ranked_chunks, follow_ups, deliverables: delivs, metadata } = response.data.data;
        setSearchResults(ranked_chunks || []);
        setFollowUpsResults(follow_ups || []);
        setDeliverablesResults(delivs || []);
        setRetrievalStats(metadata || null);
      }
    } catch (err) {
      console.error("Error retrieving RAG context:", err);
    } finally {
      setIsSearching(false);
    }
  };

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
      const response = await axios.post(`${RAG_API_URL}/upsert-document`, payload);
      if (response.data?.success) {
        showNotification(
          "success",
          `Tài liệu '${docId}' đã được nạp thành công và chia thành ${response.data.records || 0} chunks.`
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

        // Reset form partially
        setDocId("");
        setTopicName("");
        setKnowledgeSummary("");
        setKnowledgeConcepts("");
        setExpectedPoints("");
        setCommonMistakes("");
        setFollowUpQuestions("");
        setDeliverables("");
      } else {
        showNotification("error", response.data?.error || "Không thể nạp tài liệu.");
      }
    } catch (err: any) {
      console.error("Error upserting manual doc:", err);
      showNotification("error", err.response?.data?.error || "Lỗi máy chủ khi nạp tài liệu.");
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
        const response = await axios.post(`${RAG_API_URL}/import-csv`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data?.success) {
          const count = response.data.imported_document_ids?.length || 0;
          showNotification("success", `Nạp thành công ${count} tài liệu từ tệp CSV!`);

          // Add to log
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

          const response = await axios.post(`${RAG_API_URL}/upsert-document`, docObj);
          if (response.data?.success) {
            const docIdVal = docObj.document?.document_id || fileName;
            showNotification("success", `Nạp thành công tài liệu JSON: ${docIdVal}`);

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

  // Helper to trigger template download client-side
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

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      {/* Sidebar Alert Toast */}
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

      {/* SideNavBar */}
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
        {/* TopNavBar */}
        <header className="flex justify-between items-center h-20 px-12 sticky top-0 bg-[#f7f9fb] dark:bg-slate-950 z-40">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-black text-[#191c1e] dark:text-white font-headline">
              {t("admin.topbar.title")}
            </h2>
            <div className="relative group flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg">
                  search
                </span>
                <input
                  className="bg-surface-container-highest border-none rounded-xl py-2 pl-12 pr-4 w-72 text-sm font-medium focus:ring-2 focus:ring-surface-tint focus:bg-white transition-all outline-none"
                  placeholder={t("admin.search.knowledge")}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <input
                className="bg-surface-container-highest border-none rounded-xl py-2 px-3 w-40 text-sm font-medium focus:ring-2 focus:ring-surface-tint focus:bg-white transition-all outline-none"
                placeholder="Topic..."
                type="text"
                value={topicFilter}
                onChange={handleTopicFilterChange}
              />
              <select
                className="bg-surface-container-highest border-none rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-surface-tint focus:bg-white outline-none cursor-pointer"
                value={difficultyFilter}
                onChange={handleDifficultyFilterChange}
              >
                <option value="all">Tất cả độ khó</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <LanguageToggleButton className="material-symbols-outlined rounded-full p-2 transition-colors hover:bg-surface-container" />
            </div>
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

        {/* Page Canvas */}
        <main className="p-12 space-y-12">
          {/* Hero Header Section */}
          <section className="flex justify-between items-end">
            <div className="max-w-2xl">
              <h1 className="text-6xl font-extrabold font-headline tracking-tighter text-on-surface mb-4">
                {t("admin.knowledgeBase")}
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                {t("admin.knowledge.subtitle")}
              </p>
            </div>
            <div className="flex gap-4">
              <AdminButton variant="outline" size="md" onClick={downloadCsvTemplate}>
                Tải CSV Template
              </AdminButton>
            </div>
          </section>

          {/* Stats Bar if search occurred */}
          {retrievalStats && (
            <div className="grid grid-cols-5 gap-4 p-6 bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl">
              <div className="text-center border-r border-outline-variant/20">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tổng số Chunks tìm thấy</p>
                <p className="text-2xl font-black mt-1 text-primary">{retrievalStats.original_count}</p>
              </div>
              <div className="text-center border-r border-outline-variant/20">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trùng lặp đã loại</p>
                <p className="text-2xl font-black mt-1 text-amber-600">{retrievalStats.duplicates_removed}</p>
              </div>
              <div className="text-center border-r border-outline-variant/20">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Lọc sai lệch Topic</p>
                <p className="text-2xl font-black mt-1 text-red-500">{retrievalStats.topic_mismatches_removed}</p>
              </div>
              <div className="text-center border-r border-outline-variant/20">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Lọc sai lệch Độ khó</p>
                <p className="text-2xl font-black mt-1 text-orange-500">{retrievalStats.difficulty_mismatches_removed}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số lượng hiển thị (k)</p>
                <p className="text-2xl font-black mt-1 text-green-600">{retrievalStats.final_count}</p>
              </div>
            </div>
          )}

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-8">
            {/* File Ingestion & Manual Entry Form (Left Column) */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {/* Document Editor Form (RAG Full Form) */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-outline-variant/10 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    Biên tập tài liệu phỏng vấn tri thức
                  </h3>
                  <span className="material-symbols-outlined text-primary">edit_document</span>
                </div>
                <form onSubmit={handleManualDocSubmit} className="space-y-6">
                  {/* Basic Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.documentId")} *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                        placeholder="VD: int_doc_python_oop_01"
                        value={docId}
                        onChange={(e) => setDocId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.topicName")} *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                        placeholder="VD: python-oop"
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.domain")}
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.difficulty")}
                      </label>
                      <select
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all cursor-pointer"
                        value={difficultyLevel}
                        onChange={(e) => setDifficultyLevel(e.target.value)}
                      >
                        <option value="basic">Basic</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Phiên bản (Version)
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Ngôn ngữ (Language)
                      </label>
                      <select
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all cursor-pointer"
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
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.roleTargets")}
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                        placeholder="VD: backend-engineer;python-developer"
                        value={roleTargets}
                        onChange={(e) => setRoleTargets(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.jobLevels")}
                      </label>
                      <input
                        type="text"
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                        placeholder="VD: junior;mid"
                        value={jobLevels}
                        onChange={(e) => setJobLevels(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Knowledge Unit Content */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("admin.knowledge.field.knowledgeSummary")}
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                      placeholder="VD: Hiểu về Kế thừa, Đóng gói, Đa hình và Trừu tượng trong Python."
                      value={knowledgeSummary}
                      onChange={(e) => setKnowledgeSummary(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("admin.knowledge.field.concepts")}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all"
                      placeholder="VD: MRO (Method Resolution Order);Abstract Class;Interface"
                      value={knowledgeConcepts}
                      onChange={(e) => setKnowledgeConcepts(e.target.value)}
                    />
                  </div>

                  {/* Expected Criteria, Mistakes, Followups */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.mustHave")}
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                        placeholder="Mỗi tiêu chí nằm trên một dòng riêng biệt..."
                        value={expectedPoints}
                        onChange={(e) => setExpectedPoints(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.commonMistakes")}
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                        placeholder="Mỗi sai lầm nằm trên một dòng riêng biệt..."
                        value={commonMistakes}
                        onChange={(e) => setCommonMistakes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.followUp")}
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                        placeholder="Mỗi câu hỏi bổ trợ nằm trên một dòng riêng biệt..."
                        value={followUpQuestions}
                        onChange={(e) => setFollowUpQuestions(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.deliverables")}
                      </label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#f8fafc] dark:bg-slate-950 border border-outline-variant/20 rounded-lg text-sm p-3 outline-none focus:border-primary transition-all resize-y"
                        placeholder="Mỗi bài tập thực hành/sản phẩm nằm trên một dòng riêng biệt..."
                        value={deliverables}
                        onChange={(e) => setDeliverables(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Quality rating slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {t("admin.knowledge.field.qualityScore")}
                      </label>
                      <span className="text-sm font-bold text-primary">{qualityScore.toFixed(2)}</span>
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
                    {savingManual ? "Đang huấn luyện & nạp RAG..." : "Huấn luyện & lưu tài liệu"}
                  </AdminButton>
                </form>
              </div>

              {/* Upload Dropzone */}
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm group">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-headline">{t("admin.knowledge.ingestDocuments")}</h3>
                  <span className="text-xs font-bold text-on-surface-variant px-3 py-1 bg-surface-container rounded-full">
                    CSV, JSON
                  </span>
                </div>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={handleFileUploadClick}
                  className="border-2 border-dashed border-outline-variant/40 rounded-xl p-12 flex flex-col items-center justify-center bg-surface-container-low/50 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".csv,.json"
                  />
                  <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                    <span
                      className={`material-symbols-outlined text-primary text-3xl ${
                        uploading ? "animate-bounce" : ""
                      }`}
                      data-icon="cloud_upload"
                    >
                      cloud_upload
                    </span>
                  </div>
                  <p className="text-on-surface font-semibold mb-1">
                    {uploading ? "Đang xử lý tệp..." : t("admin.knowledge.dragDrop")}
                  </p>
                  <p className="text-on-surface-variant text-sm">{t("admin.knowledge.maxPerFile")}</p>
                </div>
              </div>
            </div>

            {/* QA Ingestion Log & Search Results (Right Column) */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              {/* Session Ingested Log */}
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm">
                <h3 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500">history_edu</span>
                  Tài liệu nạp gần đây
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {ingestedDocs.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic text-center py-6">
                      Chưa nạp tài liệu nào trong phiên này.
                    </p>
                  ) : (
                    ingestedDocs.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start p-3 bg-surface-container-low/30 border border-outline-variant/10 rounded-lg"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-bold text-on-surface truncate">{doc.id}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Topic: {doc.topic} • Lvl: {doc.difficulty}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-on-surface-variant block">{doc.timestamp}</span>
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1"></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RAG Core Chunks */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                  <h4 className="font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">data_object</span>
                    {searchQuery.trim() || topicFilter.trim() ? "Tri thức cốt lõi (Chunks)" : "Tìm kiếm để xem Chunks"}
                  </h4>
                </div>
                <div className="divide-y divide-outline-variant/10 max-h-[360px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-8 text-center text-sm text-on-surface-variant animate-pulse">
                      Đang tìm kiếm dữ liệu...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((chunk, idx) => {
                      const cType = chunk.metadata?.chunk_type || "knowledge";
                      return (
                        <div key={idx} className="p-4 hover:bg-surface-container transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-primary uppercase px-2 py-0.5 bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded">
                              {t(`admin.knowledge.chunkType.${cType}`)}
                            </span>
                            <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-bold">
                              Khớp: {Math.round(chunk.score * 100)}%
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed my-2 whitespace-pre-line bg-[#fafafa] dark:bg-slate-950 p-2.5 rounded border border-outline-variant/5">
                            {chunk.text}
                          </p>
                          <div className="text-[10px] text-on-surface-variant flex flex-wrap gap-x-2 gap-y-1 italic border-t border-outline-variant/10 pt-1.5 mt-1">
                            <span>Nguồn: {chunk.metadata?.document_id}</span>
                            <span>• Topic: {chunk.metadata?.topic}</span>
                            <span>• Điểm chất lượng: {chunk.metadata?.quality_score ?? 0.8}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-sm text-on-surface-variant italic">
                      Nhập từ khóa tìm kiếm hoặc lọc chủ đề ở trên.
                    </div>
                  )}
                </div>
              </div>

              {/* RAG Follow-up Chunks */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-purple-50/20">
                  <h4 className="font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600">question_answer</span>
                    Câu hỏi bổ trợ (Follow-up)
                  </h4>
                </div>
                <div className="divide-y divide-outline-variant/10 max-h-[360px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-8 text-center text-sm text-on-surface-variant animate-pulse">
                      Đang tải câu hỏi...
                    </div>
                  ) : followUpsResults.length > 0 ? (
                    followUpsResults.map((chunk, idx) => (
                      <div key={idx} className="p-4 hover:bg-surface-container transition-colors">
                        <p className="text-sm font-semibold whitespace-pre-line text-purple-900 bg-purple-50/50 p-2.5 rounded border border-purple-100">
                          {chunk.text}
                        </p>
                        <div className="text-[10px] text-on-surface-variant mt-2">
                          Nguồn: {chunk.metadata?.document_id} (Topic: {chunk.metadata?.topic})
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-on-surface-variant italic">
                      Chưa có câu hỏi bổ trợ.
                    </div>
                  )}
                </div>
              </div>

              {/* RAG Deliverables Chunks */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-green-50/20">
                  <h4 className="font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">task</span>
                    Bài tập thực hành (Deliverables)
                  </h4>
                </div>
                <div className="divide-y divide-outline-variant/10 max-h-[360px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-8 text-center text-sm text-on-surface-variant animate-pulse">
                      Đang tải bài tập...
                    </div>
                  ) : deliverablesResults.length > 0 ? (
                    deliverablesResults.map((chunk, idx) => (
                      <div key={idx} className="p-4 hover:bg-surface-container transition-colors">
                        <p className="text-sm font-semibold whitespace-pre-line text-green-900 bg-green-50/50 p-2.5 rounded border border-green-100">
                          {chunk.text}
                        </p>
                        <div className="text-[10px] text-on-surface-variant mt-2">
                          Nguồn: {chunk.metadata?.document_id} (Topic: {chunk.metadata?.topic})
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-on-surface-variant italic">
                      Chưa có yêu cầu sản phẩm/bài tập.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
