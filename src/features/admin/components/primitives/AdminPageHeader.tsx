"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { isAdminNavRoute } from "./adminNavRoutes";

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: AdminBreadcrumbItem[];
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  statusBadge?: ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryAction,
  statusBadge,
}: AdminPageHeaderProps) {
  const pathname = usePathname();
  // Sidebar pages need no trail (the sidebar marks them). Nested pages get one
  // link back to their nearest parent page; the "Quản trị" root and group
  // labels without a page are never shown, they only repeated the sidebar.
  const parents = (breadcrumbs ?? [])
    .slice(0, -1)
    .filter((item) => item.href && item.href !== "/admin/dashboard" && item.href !== "/admin");
  const backTo = !isAdminNavRoute(pathname) && parents.length ? parents[parents.length - 1] : null;
  return (
    <div className="mb-6 pb-4 border-b border-[#DCE4F3]">
      {backTo ? (
        <Link
          href={backTo.href!}
          className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#607096] transition-colors hover:text-[#204195]"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          {backTo.label}
        </Link>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#14244B]">
              {title}
            </h1>
            {statusBadge}
          </div>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-[#607096] max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2.5 shrink-0">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
