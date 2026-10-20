import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "@/i18n/i18n";
import AdminProfilePersonalInfoClient from "@features/admin/components/AdminProfilePersonalInfoClient";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import { Lock, ShieldCheck } from "lucide-react";

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("admin.profile.adminProfileTitle")}
        description={t("admin.profile.adminProfileSubtitle")}
        breadcrumbs={[
          { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
          { label: t("admin.profile.adminProfileTitle") },
        ]}
        primaryAction={
          <button
            type="button"
            className="rounded-full bg-[#204195] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#183377]"
          >
            {t("admin.profile.saveSettings")}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {/* Personal Information */}
        <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#14244B] sm:text-lg">
              {t("admin.profile.personalInfo")}
            </h2>
            <p className="text-xs text-[#607096]">
              {t("admin.profile.personalInfoDesc")}
            </p>
          </div>

          <AdminProfilePersonalInfoClient
            avatarTitle={t("admin.profile.profileAvatar")}
            avatarHint=""
            fullNameLabel={t("admin.profile.fullName")}
            emailLabel={t("admin.profile.emailAddress")}
            roleLabel={t("admin.profile.role")}
            roleValue={t("admin.profile.role.seniorAdministrator")}
          />
        </section>

        {/* Account Security */}
        <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:p-6">
          <h2 className="mb-1 text-base font-bold text-[#14244B] sm:text-lg">
            {t("admin.profile.accountSecurity")}
          </h2>
          <p className="mb-6 text-xs text-[#607096]">
            {t("admin.profile.accountSecurityDesc")}
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAEFF8] bg-[#F8FAFC] p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FD] text-[#204195]">
                  <Lock className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#14244B]">{t("admin.profile.changePassword")}</p>
                  <p className="text-[11px] text-[#607096]">
                    {t("admin.profile.lastChangedMonthsAgo")}
                  </p>
                </div>
              </div>
              <button type="button" className="text-xs font-semibold text-[#204195] hover:underline">
                {t("admin.profile.update")}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAEFF8] bg-[#F8FAFC] p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#14244B]">{t("admin.profile.twoFactor")}</p>
                  <p className="text-[11px] text-[#607096]">
                    {t("admin.profile.recommendedHighSecurity")}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                {t("admin.profile.enabled")}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
