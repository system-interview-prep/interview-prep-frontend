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
  "/admin/taxonomy",
  "/admin/rubrics",
  "/admin/knowledge-base",
  "/admin/interviews",
  "/admin/cv-parsing",
  "/admin/matching",
  "/admin/ai",
  "/admin/ai/traces",
  "/admin/ai/models",
  "/admin/ai/prompts",
  "/admin/evaluation",
  "/admin/evaluation/datasets",
  "/admin/evaluation/experiments",
  "/admin/evaluation/regression",
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
