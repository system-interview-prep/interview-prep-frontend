/**
 * Admin pages reachable straight from the sidebar. On these the sidebar already
 * marks where the admin is, so the page header shows no breadcrumb; only
 * nested pages (detail, create, import) get a link back to their parent.
 */
export const ADMIN_NAV_ROUTES = new Set([
  "/admin",
  "/admin/dashboard",
  "/admin/users",
  "/admin/job-descriptions",
  "/admin/question-bank",
  "/admin/question-quality",
  "/admin/taxonomy",
  "/admin/rubrics",
  "/admin/interviews",
  "/admin/practice",
  "/admin/system",
  "/admin/cv-parsing",
  "/admin/matching",
  "/admin/ai",
  "/admin/ai/traces",
  "/admin/ai/speech",
  "/admin/ai/models",
  "/admin/evaluation",
  "/admin/audit-logs",
  "/admin/settings",
  "/admin/help",
  "/admin/profile",
]);

export function isAdminNavRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return ADMIN_NAV_ROUTES.has(clean);
}
