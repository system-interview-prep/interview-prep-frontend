import { cookies } from "next/headers";
import { getDictionary, normalizeLang } from "@/i18n/i18n";
import AdminProfilePersonalInfoClient from "@features/admin/components/AdminProfilePersonalInfoClient";
import { Lock, ShieldCheck } from "lucide-react";

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("lang")?.value);
  const t = (key: string) => getDictionary(lang)[key] ?? key;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-[#14244B] sm:text-3xl">
            {t("admin.profile.adminProfileTitle")}
          </h1>
          <p className="mt-1 text-sm text-[#607096]">
            {t("admin.profile.adminProfileSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-xl bg-[#204195] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#183377] transition-all">
            {t("admin.profile.saveSettings")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {/* Personal Information */}
        <section className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-6">
            <h2 className="font-headline text-lg font-bold text-[#14244B]">
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
        <section className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-8">
          <h2 className="mb-1 font-headline text-lg font-bold text-[#14244B]">
            {t("admin.profile.accountSecurity")}
          </h2>
          <p className="mb-6 text-xs text-[#607096]">
            {t("admin.profile.accountSecurityDesc")}
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[#EAEFF8] bg-[#F8FAFC] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF2FD] text-[#204195]">
                  <Lock className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#14244B]">{t("admin.profile.changePassword")}</p>
                  <p className="text-[11px] text-[#607096]">
                    {t("admin.profile.lastChangedMonthsAgo")}
                  </p>
                </div>
              </div>
              <button className="text-xs font-semibold text-[#204195] hover:underline">
                {t("admin.profile.update")}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#EAEFF8] bg-[#F8FAFC] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
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
