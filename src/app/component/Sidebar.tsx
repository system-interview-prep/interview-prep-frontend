import React from "react";

type SidebarProps = {
    sessions: string[];
    currentSessionId: string;
    onSelectSession: (id: string) => void;
    onNewSession: () => void;
};

export function Sidebar({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewSession,
}: SidebarProps) {
    return (
        <aside className="w-80 h-full flex flex-col bg-white/50 dark:bg-zinc-900/50 border-r border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl">
            <div className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <button
                    onClick={onNewSession}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    + New Interview Session
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <h3 className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    History
                </h3>
                {sessions.length === 0 && (
                    <div className="px-2 text-sm text-zinc-500 italic">No history yet</div>
                )}
                {sessions.map((sid) => (
                    <button
                        key={sid}
                        onClick={() => onSelectSession(sid)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${sid === currentSessionId
                                ? "bg-white dark:bg-zinc-800 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700 text-blue-600 dark:text-blue-400"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                            }`}
                    >
                        <div className="truncate">{sid}</div>
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500"></div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">User Account</span>
                        <span className="text-xs text-zinc-500">Free Plan</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
