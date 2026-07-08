"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import axios from "axios";
import AdminButton from "../../../../components/admin/AdminButton";
import AdminSidebarBrand from "../../../../components/admin/AdminSidebarBrand";
import LanguageToggleButton from "../../../components/LanguageToggleButton";

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || "http://localhost:5001";

type SourceStatus = "processed" | "analyzing" | "syncing" | "failed";

type KnowledgeSource = {
  id: string;
  icon: string;
  iconClassName: string;
  title: string;
  subtitle: string;
  subtitleParams?: Record<string, string>;
  status: SourceStatus;
};

type RecentQa = {
  id: string;
  tag: string;
  tagClassName: string;
  question: string;
  answer?: string;
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

  // Local state
  const [sources, setSources] = useState<KnowledgeSource[]>([
    {
      id: "pdf-guidelines",
      icon: "picture_as_pdf",
      iconClassName: "text-red-500",
      title: "2024_Hiring_Guidelines.pdf",
      subtitle: "admin.knowledge.source.uploadedHoursAgo",
      subtitleParams: { count: "2", size: "14.2 MB", chunks: "42 Chunks" },
      status: "processed",
    },
    {
      id: "docx-arch",
      icon: "description",
      iconClassName: "text-blue-500",
      title: "Product_Architecture_V2.docx",
      subtitle: "admin.knowledge.source.uploadedMinsAgoProcessing",
      subtitleParams: { count: "5", size: "2.8 MB", status: "admin.knowledge.source.processing" },
      status: "processed",
    },
  ]);

  const [recentQas, setRecentQas] = useState<RecentQa[]>([
    {
      id: "culture",
      tag: "admin.knowledge.qaTag.companyCulture",
      tagClassName: "text-primary",
      question: "admin.knowledge.recentQa.culture",
    },
    {
      id: "stack",
      tag: "admin.knowledge.qaTag.technicalStack",
      tagClassName: "text-tertiary",
      question: "admin.knowledge.recentQa.stack",
    },
    {
      id: "security",
      tag: "admin.knowledge.qaTag.security",
      tagClassName: "text-amber-600",
      question: "admin.knowledge.recentQa.security",
    },
  ]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Manual QA
  const [topicInput, setTopicInput] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  // File Upload
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.post(`${RAG_API_URL}/retrieve`, {
        query_text: val,
        k: 6,
      });

      if (response.data?.success && response.data?.data?.ranked_chunks) {
        setSearchResults(response.data.data.ranked_chunks);
      }
    } catch (err) {
      console.error("Error retrieving search results:", err);
    }
  };

  const handleManualQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || !answerInput.trim()) {
      showNotification("error", "Vui lòng nhập đầy đủ câu hỏi và câu trả lời.");
      return;
    }

    setSavingManual(true);
    const manualDocId = `manual_qa_${Date.now()}`;
    const cleanTopic = topicInput.trim() || "general";

    const payload = {
      document: {
        document_id: manualDocId,
        version: "1.0.0",
        status: "approved",
        language: lang === "vi" ? "vi" : "en",
      },
      topic: {
        domain: "backend",
        topic_name: cleanTopic,
      },
      difficulty: {
        level: "intermediate",
      },
      knowledge: {
        summary: answerInput.trim(),
        concepts: [questionInput.trim()],
      },
      expected_points: {
        must_have: [answerInput.trim()],
      },
      metadata: {
        retrieval: {
          is_active: true,
          quality_score: 1.0,
        },
      },
    };

    try {
      const response = await axios.post(`${RAG_API_URL}/upsert-document`, payload);
      if (response.data?.success) {
        showNotification("success", `Đã lưu câu hỏi thủ công thành công!`);

        // Add to recent list
        const newQa: RecentQa = {
          id: manualDocId,
          tag: cleanTopic,
          tagClassName: "text-green-600",
          question: questionInput.trim(),
          answer: answerInput.trim(),
        };
        setRecentQas((prev) => [newQa, ...prev.slice(0, 4)]);

        // Clear input
        setQuestionInput("");
        setAnswerInput("");
      } else {
        showNotification("error", response.data?.error || "Không thể lưu câu hỏi.");
      }
    } catch (err: any) {
      console.error("Error saving manual QA:", err);
      showNotification("error", err.response?.data?.error || "Lỗi máy chủ khi lưu câu hỏi.");
    } finally {
      setSavingManual(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
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
    showNotification("success", `Đang tải lên và xử lý tệp ${fileName}...`);

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
          showNotification("success", `Nạp thành công ${response.data.imported_document_ids?.length || 0} tài liệu từ tệp CSV!`);
          
          const newSource: KnowledgeSource = {
            id: `csv-${Date.now()}`,
            icon: "table_chart",
            iconClassName: "text-green-500",
            title: fileName,
            subtitle: "admin.knowledge.source.uploadedMinsAgoProcessing",
            subtitleParams: { count: "1", size: `${(file.size / 1024).toFixed(1)} KB`, status: t("admin.knowledge.status.processed") },
            status: "processed",
          };
          setSources((prev) => [newSource, ...prev]);
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
      // JSON file parsing client-side and posting to /upsert-document
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const docObj = JSON.parse(text);

          const response = await axios.post(`${RAG_API_URL}/upsert-document`, docObj);
          if (response.data?.success) {
            showNotification("success", `Nạp thành công tài liệu JSON: ${docObj.document?.document_id || fileName}`);
            
            const newSource: KnowledgeSource = {
              id: docObj.document?.document_id || `json-${Date.now()}`,
              icon: "settings_ethernet",
              iconClassName: "text-amber-500",
              title: fileName,
              subtitle: "admin.knowledge.source.uploadedMinsAgoProcessing",
              subtitleParams: { count: "1", size: `${(file.size / 1024).toFixed(1)} KB`, status: t("admin.knowledge.status.processed") },
              status: "processed",
            };
            setSources((prev) => [newSource, ...prev]);
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

  function statusBadge(status: SourceStatus) {
    if (status === "processed") {
      return (
        <span className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span> {t("admin.knowledge.status.processed")}
        </span>
      );
    }
    if (status === "analyzing") {
      return (
        <span className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-3 py-1 rounded-full">
          <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></span>{" "}
          {t("admin.knowledge.status.analyzing")}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
        {t("admin.knowledge.status.activeSync")}
      </span>
    );
  }

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
            <p className="text-xs opacity-90 leading-relaxed mt-1">
              {notification.message}
            </p>
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
              <span className="material-symbols-outlined" data-icon="dashboard">
                dashboard
              </span>
              <span>{t("common.dashboard")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/interviews"
            >
              <span className="material-symbols-outlined" data-icon="video_chat">
                video_chat
              </span>
              <span>{t("admin.interviews")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/insights"
            >
              <span className="material-symbols-outlined" data-icon="psychology">
                psychology
              </span>
              <span>{t("admin.aiInsights")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#003d9b] dark:text-blue-400 font-bold border-r-4 border-[#003d9b] dark:border-blue-400 bg-white/50 dark:bg-white/5"
              href="/admin/knowledge-base"
            >
              <span className="material-symbols-outlined" data-icon="library_books">
                library_books
              </span>
              <span>{t("admin.knowledgeBase")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-[#434654] dark:text-slate-400 font-medium hover:bg-[#e0e3e5] dark:hover:bg-slate-800 transition-colors duration-200"
              href="/admin/settings"
            >
              <span className="material-symbols-outlined" data-icon="settings">
                settings
              </span>
              <span>{t("common.settings")}</span>
            </Link>
          </nav>

          <div className="mt-auto space-y-2 pt-6 border-t border-outline-variant/20">
            <AdminButton
              variant="gradient"
              size="md"
              icon="auto_awesome"
              iconFill
              className="w-full mb-6"
            >
              {t("admin.settings.startAiAnalysis")}
            </AdminButton>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-[#e0e3e5] transition-colors duration-200"
              href="/admin/help"
            >
              <span className="material-symbols-outlined" data-icon="help">
                help
              </span>
              <span>{t("common.helpCenter")}</span>
            </Link>
            <Link
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-[#e0e3e5] transition-colors duration-200"
              href="/logout"
            >
              <span className="material-symbols-outlined" data-icon="logout">
                logout
              </span>
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
            <div className="relative group">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg"
                data-icon="search"
              >
                search
              </span>
              <input
                className="bg-surface-container-highest border-none rounded-xl py-2 pl-12 pr-4 w-80 text-sm font-medium focus:ring-2 focus:ring-surface-tint focus:bg-white transition-all outline-none"
                placeholder={t("admin.search.knowledge")}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
              />
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
              <AdminButton variant="outline" size="md">
                {t("admin.knowledge.viewAuditLogs")}
              </AdminButton>
              <AdminButton variant="gradient" size="md" icon="bolt" iconFill>
                {t("admin.knowledge.retrainFoundation")}
              </AdminButton>
            </div>
          </section>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-8">
            {/* File Upload & Sources (Left Column) */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
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
                  <p className="text-on-surface-variant text-sm">
                    {t("admin.knowledge.maxPerFile")}
                  </p>
                </div>
              </div>

              {/* Source List */}
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    {t("admin.knowledge.sources")}
                  </h3>
                  <div className="flex gap-2">
                    <button className="text-xs font-bold uppercase tracking-widest text-primary">
                      All
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {sources.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center p-4 bg-surface-container-low/30 rounded-xl hover:bg-surface-container transition-colors group"
                    >
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-outline-variant/10 mr-4">
                        <span
                          className={`material-symbols-outlined ${s.iconClassName}`}
                          data-icon={s.icon}
                        >
                          {s.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-on-surface">{s.title}</h4>
                        <p className="text-xs text-on-surface-variant">
                          {Object.entries(s.subtitleParams ?? {}).reduce(
                            (acc, [k, v]) => {
                              const value = v.startsWith("admin.") ? t(v) : v;
                              return acc.replace(`{${k}}`, value);
                            },
                            t(s.subtitle)
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 px-4">
                        {statusBadge(s.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* QA Refinement & Statistics (Right Column) */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              {/* Manual QA Editor */}
              <div className="bg-surface-container-highest rounded-xl p-8 border border-outline-variant/10 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    {t("admin.knowledge.overrideQa")}
                  </h3>
                  <span className="material-symbols-outlined text-primary" data-icon="edit_note">
                    edit_note
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                  {t("admin.knowledge.overrideQaDesc")}
                </p>
                <form onSubmit={handleManualQASubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Chủ đề (Topic)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-surface-container-lowest border-none rounded-lg text-sm focus:ring-2 focus:ring-surface-tint p-3 outline-none"
                      placeholder="Ví dụ: python-oop, concurrency, caching..."
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("admin.knowledge.promptQuestion")}
                    </label>
                    <textarea
                      className="w-full bg-surface-container-lowest border-none rounded-lg text-sm focus:ring-2 focus:ring-surface-tint p-4 outline-none resize-none"
                      placeholder={t("admin.knowledge.promptPlaceholder")}
                      rows={2}
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("admin.knowledge.modelAnswer")}
                    </label>
                    <textarea
                      className="w-full bg-surface-container-lowest border-none rounded-lg text-sm focus:ring-2 focus:ring-surface-tint p-4 outline-none resize-none"
                      placeholder={t("admin.knowledge.answerPlaceholder")}
                      rows={4}
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                    />
                  </div>
                  <AdminButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    type="submit"
                    disabled={savingManual}
                  >
                    {savingManual ? "Đang lưu..." : t("admin.knowledge.savePair")}
                  </AdminButton>
                </form>
              </div>

              {/* RAG Context Results / QA Pairs list */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                  <h4 className="font-bold">
                    {searchQuery.trim() ? "Kết quả tìm kiếm RAG" : t("admin.knowledge.recentQaPairs")}
                  </h4>
                  <span className="material-symbols-outlined text-primary">
                    {searchQuery.trim() ? "travel_explore" : "library_books"}
                  </span>
                </div>
                <div className="divide-y divide-outline-variant/10 max-h-[360px] overflow-y-auto">
                  {searchQuery.trim() ? (
                    searchResults.length > 0 ? (
                      searchResults.map((chunk: any, idx: number) => (
                        <div key={idx} className="p-4 hover:bg-surface-container transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-bold text-primary uppercase">
                              {chunk.metadata?.topic || "RAG Chunk"}
                            </p>
                            <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-bold">
                              Score: {Math.round(chunk.score * 100)}%
                            </span>
                          </div>
                          <p className="text-sm font-semibold truncate mb-1">
                            {chunk.text}
                          </p>
                          <p className="text-[10px] text-on-surface-variant italic">
                            Source: {chunk.metadata?.document_id || "RAG Core"} (Type: {chunk.metadata?.chunk_type || "knowledge"})
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-sm text-on-surface-variant">
                        Không tìm thấy chunk nào khớp với từ khóa.
                      </div>
                    )
                  ) : (
                    recentQas.map((qa) => (
                      <div
                        key={qa.id}
                        className="p-4 hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <p className={`text-xs font-bold mb-1 ${qa.tagClassName}`}>
                          {qa.tag.startsWith("admin.") ? t(qa.tag) : qa.tag}
                        </p>
                        <p className="text-sm font-semibold truncate">
                          {qa.question.startsWith("admin.") ? t(qa.question) : qa.question}
                        </p>
                        {qa.answer && (
                          <p className="text-xs text-on-surface-variant truncate mt-1">
                            {qa.answer}
                          </p>
                        )}
                      </div>
                    ))
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
