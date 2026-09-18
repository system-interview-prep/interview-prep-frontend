import React from "react";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-900 p-6 md:p-10">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-slate-800" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="h-32 rounded-xl bg-slate-800/80" />
          <div className="h-32 rounded-xl bg-slate-800/80" />
          <div className="h-32 rounded-xl bg-slate-800/80" />
          <div className="h-32 rounded-xl bg-slate-800/80" />
        </div>
        <div className="h-80 rounded-xl bg-slate-800/60" />
      </div>
    </div>
  );
}
