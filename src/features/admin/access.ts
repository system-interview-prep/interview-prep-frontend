/**
 * Which admin pages a signed-in internal actor can use.
 *
 * Core checks every endpoint's roles; this only shapes the console so a
 * question author or reviewer is not dropped on pages that answer 403
 * (dashboard, users, system…). ADMIN sees everything.
 */

export const QUESTION_BANK_ROLES = ["QUESTION_AUTHOR", "QUESTION_REVIEWER", "QUESTION_BANK_ADMIN"] as const;

/** Pages the question-bank roles can use (their APIs accept those roles). */
const QUESTION_BANK_PAGES = ["/admin/question-bank", "/admin/rubrics", "/admin/profile"];

const upper = (roles: readonly string[] | null | undefined) => (roles ?? []).map((role) => role.toUpperCase());

export function isFullAdmin(roles: readonly string[] | null | undefined): boolean {
  return upper(roles).includes("ADMIN");
}

export function hasQuestionBankRole(roles: readonly string[] | null | undefined): boolean {
  const held = upper(roles);
  return QUESTION_BANK_ROLES.some((role) => held.includes(role));
}

/**
 * Whether these roles can use the page at `path`. Unknown roles (profile not
 * read yet) get `true`, so the console never flashes "no access" on load.
 */
export function canOpenAdminPath(path: string, roles: readonly string[] | null | undefined): boolean {
  if (!roles || roles.length === 0 || isFullAdmin(roles)) return true;
  if (!hasQuestionBankRole(roles)) return false;
  return QUESTION_BANK_PAGES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/** Where the console opens for these roles. */
export function adminHomePath(roles: readonly string[] | null | undefined): string {
  if (!roles || roles.length === 0 || isFullAdmin(roles)) return "/admin/dashboard";
  return hasQuestionBankRole(roles) ? "/admin/question-bank" : "/admin/profile";
}

/** The most senior role, for the badge under the name. */
export function primaryAdminRole(roles: readonly string[] | null | undefined): string | null {
  const held = upper(roles);
  for (const role of ["ADMIN", "QUESTION_BANK_ADMIN", "QUESTION_REVIEWER", "QUESTION_AUTHOR"]) {
    if (held.includes(role)) return role;
  }
  return null;
}
