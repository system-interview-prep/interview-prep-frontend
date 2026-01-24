"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "../types/message";
import { sendChatMessage } from "../lib/aiService";


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Xin chào! Tôi là AI, bạn cần luyện phỏng vấn lĩnh vực nào?", sender: "ai" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: messages.length + 1,
      text: input,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Hiển thị trạng thái đang xử lý
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        text: "AI đang xử lý...",
        sender: "ai",
      },
    ]);

    try {
      const data = await sendChatMessage({ prompt: input });
      setMessages((prev) => {
        // Xóa trạng thái đang xử lý
        const filtered = prev.filter((m) => m.text !== "AI đang xử lý...");
        return [
          ...filtered,
          {
            id: filtered.length + 1,
            text: data.reply || "Không nhận được phản hồi từ AI.",
            sender: "ai",
          },
        ];
      });
    } catch (err) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.text !== "AI đang xử lý...");
        return [
          ...filtered,
          {
            id: filtered.length + 1,
            text: "Lỗi kết nối đến AI.",
            sender: "ai",
          },
        ];
      });
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-black dark:to-zinc-900">
      <header className="px-6 py-4 bg-white dark:bg-zinc-900 shadow flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-300">AI Interview Chat</h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Luyện phỏng vấn cùng AI</span>
      </header>
      <main className="flex-1 overflow-y-auto px-0 sm:px-24 py-6">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="flex items-end mr-2">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">AI</div>
                </div>
              )}
              <div
                className={`max-w-xl px-5 py-3 rounded-2xl text-base shadow ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-zinc-200 text-black rounded-bl-none dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                {msg.sender === "ai" ? (
                  <div className="prose prose-sm dark:prose-invert">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
              {msg.sender === "user" && (
                <div className="flex items-end ml-2">
                  <div className="w-8 h-8 bg-zinc-400 text-white rounded-full flex items-center justify-center font-bold">U</div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="px-6 py-4 bg-white dark:bg-zinc-900 shadow flex items-center">
        <form
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-zinc-800 dark:text-zinc-100"
            type="text"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Gửi
          </button>
        </form>
      </footer>
    </div>
  );
}
