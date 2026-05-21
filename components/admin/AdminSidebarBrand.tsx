import Link from "next/link";

export default function AdminSidebarBrand() {
  return (
    <div className="mb-8">
      <Link href="/admin/dashboard" className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
          <img src="/logo.jpg" alt="INTERVIA Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-[#191c1e] dark:text-white xl:text-2xl">
            INTERVIA
          </h1>
          <p className="text-xs text-on-surface-variant">AI Interview Suite</p>
        </div>
      </Link>
    </div>
  );
}

