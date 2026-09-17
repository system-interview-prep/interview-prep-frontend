import Link from "next/link";

export default function AdminSidebarBrand() {
  return (
    <div className="mb-8">
      <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-[#F0F4FC]">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border-2 border-[#234196]">
          <img src="/logo.jpg" alt="INTERVIA Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-[#234196] xl:text-2xl">
            INTERVIA
          </h1>
          <p className="text-xs text-[#5A6B8F]">AI Interview Suite</p>
        </div>
      </Link>
    </div>
  );
}

