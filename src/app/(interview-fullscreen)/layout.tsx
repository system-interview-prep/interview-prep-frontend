import React from 'react';

export default function InterviewFullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-white flex flex-col select-none">
      {children}
    </div>
  );
}
