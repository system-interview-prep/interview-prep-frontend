type Translate = (key: string) => string;

/** Fill `{name}` placeholders in a translated template. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

/** "45 phút" / "1 giờ 5 phút" (or the English equivalents). */
export function formatMinutes(t: Translate, totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes < 60) return fmt(t("common.minutes"), { n: minutes });
  return fmt(t("common.hoursMinutes"), { h: Math.floor(minutes / 60), m: minutes % 60 });
}

/** BCP-47 locale for dates and numbers from the UI language. */
export function localeOf(lang: string): string {
  return lang === "vi" ? "vi-VN" : "en-US";
}
