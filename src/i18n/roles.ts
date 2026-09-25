/**
 * Utility to format user roles into localized strings with safe fallbacks.
 */
export function formatUserRole(
  role: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!role) return t("userDash.roleFallback");
  const trimmed = role.trim();
  if (!trimmed) return t("userDash.roleFallback");

  const key = `userDash.role.${trimmed}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;

  const upperKey = `userDash.role.${trimmed.toUpperCase()}`;
  const upperTranslated = t(upperKey);
  if (upperTranslated && upperTranslated !== upperKey) return upperTranslated;

  const lowerKey = `userDash.role.${trimmed.toLowerCase()}`;
  const lowerTranslated = t(lowerKey);
  if (lowerTranslated && lowerTranslated !== lowerKey) return lowerTranslated;

  // Fallback: If no translation exists, avoid showing raw "userDash.role.*" key
  return trimmed;
}
