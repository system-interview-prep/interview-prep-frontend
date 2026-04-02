import Link from "next/link";

export default function AdminSidebarBrand() {
  return (
    <div className="mb-12">
      <Link href="/admin/dashboard" className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white" data-icon="psychology">
            psychology
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-[#191c1e] dark:text-white">
            The Curator
          </h1>
          <p className="text-xs text-on-surface-variant">AI Interview Suite</p>
        </div>
      </Link>
    </div>
  );
}

