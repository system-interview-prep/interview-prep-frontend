"use client";
import React from "react";
import { useChat } from "../../hooks/useChat";
import { ChatHeader } from "../component/ChatHeader";
import { ChatMessages } from "../component/ChatMessages";
import { ChatInput } from "../component/ChatInput";
import { Sidebar } from "../component/Sidebar";

export default function ChatPage() {
  const {
    messages,
    sessionId,
    language,
    sessions,
    isLoading,
    setLanguage,
    startNewSession,
    loadSession,
    sendMessage, // Use the sendMessage from hook which takes input string
  } = useChat();

  const [input, setInput] = React.useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput(""); // Clear immediately
    await sendMessage(currentInput);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-100 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100">
      {/* Sidebar */}
      <div className="hidden md:block h-full border-r border-zinc-200/50 dark:border-zinc-800/50">
        <Sidebar
          sessions={sessions}
          currentSessionId={sessionId}
          onSelectSession={loadSession}
          onNewSession={() => startNewSession(language)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-3xl relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] bg-purple-200 dark:bg-purple-900/40 rounded-full blur-3xl filter opacity-60 mix-blend-multiply dark:mix-blend-normal animate-blob"></div>
          <div className="absolute top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-blue-200 dark:bg-blue-900/40 rounded-full blur-3xl filter opacity-60 mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] bg-pink-200 dark:bg-pink-900/40 rounded-full blur-3xl filter opacity-60 mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-4000"></div>
        </div>

        <ChatHeader
          language={language}
          setLanguage={setLanguage}
          onNewSession={() => startNewSession()}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 scroll-smooth">
          <div className="max-w-4xl mx-auto flex flex-col min-h-0">
            <ChatMessages messages={messages} isLoading={isLoading} />
          </div>
        </main>

        <div className="flex-shrink-0 w-full z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50">
          <ChatInput input={input} setInput={setInput} onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
