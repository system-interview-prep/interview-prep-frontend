import React from "react";

export function ChatInput({ input, setInput, onSend }: { input: string; setInput: (v: string) => void; onSend: () => void }) {
  return (
    <footer className="p-4 bg-transparent">
      <div className="max-w-4xl mx-auto">
        <form
          className="relative flex items-center shadow-lg shadow-blue-500/5 rounded-2xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-300 overflow-hidden"
          onSubmit={e => {
            e.preventDefault();
            onSend();
          }}
        >
          <input
            className="flex-1 px-6 py-4 bg-transparent text-base placeholder-zinc-400 focus:outline-none dark:text-zinc-100"
            type="text"
            placeholder={input.length === 0 ? "Type your answer..." : ""}
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="mr-3 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </footer>
  );
}
