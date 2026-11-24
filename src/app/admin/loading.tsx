export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10" role="status" aria-busy="true">
      <span className="sr-only">Đang tải…</span>
      <div className="mx-auto max-w-7xl animate-pulse space-y-6" aria-hidden="true">
        <div className="h-10 w-48 rounded-full bg-[#EAEFF8]" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="h-32 rounded-3xl bg-[#EAEFF8]" />
          <div className="h-32 rounded-3xl bg-[#EAEFF8]" />
          <div className="h-32 rounded-3xl bg-[#EAEFF8]" />
          <div className="h-32 rounded-3xl bg-[#EAEFF8]" />
        </div>
        <div className="h-80 rounded-3xl bg-[#EAEFF8]" />
      </div>
    </div>
  );
}
