import { useCallback, useEffect, useState } from "react";
import api from "@/lib/apiClient";

/** An interview type a candidate may choose (Core: GET /interview-types). */
export type InterviewType = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  /** What each session package gets with this type. */
  preview: { durationMinutes: number; technicalQuestions: number; expectedSeconds: number; fits: boolean }[];
  /** Turns every session asks besides technical questions (warm-up, CV project, behavioral). */
  presetQuestions: number;
};

export const interviewTypesApi = {
  list: () => api.get<{ items: InterviewType[] }>("/interview-types"),
};

/** Questions a session of this type and package asks, or null when the package is not previewed. */
export function questionCountOf(type: InterviewType | null | undefined, durationMinutes: number): number | null {
  const row = type?.preview.find((item) => item.durationMinutes === durationMinutes);
  return row ? row.technicalQuestions + type!.presetQuestions : null;
}

/** The listed types with the default pre-selected; `reload` after the chosen one was withdrawn. */
export function useInterviewTypes() {
  const [items, setItems] = useState<InterviewType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    interviewTypesApi
      .list()
      .then(({ data }) => {
        if (cancelled) return;
        const list = data.items ?? [];
        setItems(list);
        setSelectedId((current) =>
          current && list.some((item) => item.id === current)
            ? current
            : (list.find((item) => item.isDefault) ?? list[0])?.id ?? null,
        );
      })
      .catch(() => {
        // No list: sessions start with the default type, as before types existed.
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  return { items, selected, selectedId, setSelectedId, reload };
}
