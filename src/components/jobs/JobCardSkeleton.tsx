"use client";

import React from "react";

export function JobCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-full flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs animate-pulse ${className}`}
      role="status"
      aria-label="Loading job..."
    >
      <div className="space-y-3.5">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {/* Logo */}
            <div className="size-11 shrink-0 rounded-xl bg-[#EAEFF8]" />
            {/* Title & Company */}
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <div className="h-4 w-4/5 rounded-md bg-[#EAEFF8]" />
              <div className="h-3 w-1/3 rounded-md bg-[#F1F5F9]" />
            </div>
          </div>
          {/* Bookmark icon placeholder */}
          <div className="size-8 shrink-0 rounded-lg bg-[#F1F5F9]" />
        </div>

        {/* Metadata Skeleton: 2 rows */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="size-3.5 rounded-full bg-[#EAEFF8]" />
            <div className="h-3 w-1/2 rounded bg-[#F1F5F9]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3.5 rounded-full bg-[#EAEFF8]" />
            <div className="h-3 w-2/5 rounded bg-[#F1F5F9]" />
          </div>
        </div>

        {/* Salary Skeleton */}
        <div className="flex items-center gap-2 pt-1">
          <div className="size-3.5 rounded-full bg-[#EAEFF8]" />
          <div className="h-3.5 w-1/3 rounded bg-[#EAEFF8]" />
        </div>

        {/* Match Block Skeleton */}
        <div className="rounded-xl border border-[#EAEFF8] bg-[#F8FAFC] p-2.5 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded bg-[#EAEFF8]" />
            <div className="h-3 w-12 rounded bg-[#EAEFF8]" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#EAEFF8]" />
          <div className="flex gap-2 pt-0.5">
            <div className="h-2.5 w-20 rounded bg-[#F1F5F9]" />
            <div className="h-2.5 w-16 rounded bg-[#F1F5F9]" />
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="mt-4 flex items-center justify-between border-t border-[#EAEFF8] pt-3">
        <div className="h-3 w-24 rounded bg-[#F1F5F9]" />
        <div className="h-3 w-16 rounded bg-[#EAEFF8]" />
      </div>
    </div>
  );
}

export default JobCardSkeleton;
