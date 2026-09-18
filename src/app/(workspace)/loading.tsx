import React from "react";

export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen bg-[#FEF9EE] p-6 md:p-10">
      <div className="mx-auto max-w-[1440px] animate-pulse space-y-8">
        <div className="h-16 w-1/3 rounded-xl bg-slate-200/80" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-44 rounded-2xl bg-slate-200/60" />
          <div className="h-44 rounded-2xl bg-slate-200/60" />
          <div className="h-44 rounded-2xl bg-slate-200/60" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-200/50" />
      </div>
    </div>
  );
}
