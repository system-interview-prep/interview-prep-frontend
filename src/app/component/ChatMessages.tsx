import React, { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "../../types/message";

export function ChatMessages({ messages, isLoading }: { messages: Message[], isLoading?: boolean }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.sender === "ai" && (
            <div className="flex-shrink-0 mr-4 flex flex-col justify-end">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path><path d="M12 16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"></path><path d="M2 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"></path><path d="M16 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"></path></svg>
              </div>
            </div>
          )}

          <div
            className={`relative max-w-[80%] px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.sender === "user"
                ? "bg-blue-600 text-white rounded-br-none shadow-blue-500/20"
                : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 text-zinc-800 dark:text-zinc-100 rounded-bl-none"
              }`}
          >
            {msg.sender === "ai" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ) : (
              msg.text
            )}
          </div>

          {msg.sender === "user" && (
            <div className="flex-shrink-0 ml-4 flex flex-col justify-end">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start w-full animate-pulse">
          <div className="flex-shrink-0 mr-4">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
          </div>
          <div className="bg-white dark:bg-zinc-800 px-6 py-4 rounded-2xl rounded-bl-none border border-zinc-100 dark:border-zinc-700/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
