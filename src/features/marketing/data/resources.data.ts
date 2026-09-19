export type TopicId =
  | "all"
  | "cv"
  | "matching"
  | "interview"
  | "voice"
  | "career"
  | "offer";

export type VisualType =
  | "cv"
  | "star"
  | "voice"
  | "evidence"
  | "career"
  | "offer";

export interface ResourceTopic {
  id: TopicId;
  labelKey: string;
  descKey?: string;
  icon?: "document" | "sparkles" | "message" | "mic" | "chart" | "badge";
}

export interface ResourceItem {
  id: string;
  topic: Exclude<TopicId, "all">;
  typeKey: string;
  titleKey: string;
  descKey: string;
  readMinutes: number;
  tags: string[];
  visual: VisualType;
}

export const RESOURCE_TOPICS: ResourceTopic[] = [
  { id: "all", labelKey: "resources.topic.all" },
  {
    id: "cv",
    labelKey: "resources.topic.cv.label",
    descKey: "resources.topic.cv.desc",
    icon: "document",
  },
  {
    id: "matching",
    labelKey: "resources.topic.matching.label",
    descKey: "resources.topic.matching.desc",
    icon: "sparkles",
  },
  {
    id: "interview",
    labelKey: "resources.topic.interview.label",
    descKey: "resources.topic.interview.desc",
    icon: "message",
  },
  {
    id: "voice",
    labelKey: "resources.topic.voice.label",
    descKey: "resources.topic.voice.desc",
    icon: "mic",
  },
  {
    id: "career",
    labelKey: "resources.topic.career.label",
    descKey: "resources.topic.career.desc",
    icon: "chart",
  },
  {
    id: "offer",
    labelKey: "resources.topic.offer.label",
    descKey: "resources.topic.offer.desc",
    icon: "badge",
  },
];

export const RESOURCE_ITEMS: ResourceItem[] = [
  {
    id: "res-1",
    topic: "cv",
    typeKey: "resources.item.res1.type",
    titleKey: "resources.item.res1.title",
    descKey: "resources.item.res1.desc",
    readMinutes: 8,
    tags: ["CV Evidence", "ATS", "Impact metric"],
    visual: "cv",
  },
  {
    id: "res-2",
    topic: "matching",
    typeKey: "resources.item.res2.type",
    titleKey: "resources.item.res2.title",
    descKey: "resources.item.res2.desc",
    readMinutes: 10,
    tags: ["JD Audit", "Gap Analysis", "Skill Match"],
    visual: "evidence",
  },
  {
    id: "res-3",
    topic: "interview",
    typeKey: "resources.item.res3.type",
    titleKey: "resources.item.res3.title",
    descKey: "resources.item.res3.desc",
    readMinutes: 12,
    tags: ["Behavioral", "STAR", "AI Feedback"],
    visual: "star",
  },
  {
    id: "res-4",
    topic: "voice",
    typeKey: "resources.item.res4.type",
    titleKey: "resources.item.res4.title",
    descKey: "resources.item.res4.desc",
    readMinutes: 7,
    tags: ["Tone", "Pacing", "Pillar Speech"],
    visual: "voice",
  },
  {
    id: "res-5",
    topic: "career",
    typeKey: "resources.item.res5.type",
    titleKey: "resources.item.res5.title",
    descKey: "resources.item.res5.desc",
    readMinutes: 9,
    tags: ["Positioning", "Senior Role", "System Thinking"],
    visual: "career",
  },
  {
    id: "res-6",
    topic: "offer",
    typeKey: "resources.item.res6.type",
    titleKey: "resources.item.res6.title",
    descKey: "resources.item.res6.desc",
    readMinutes: 11,
    tags: ["Closing", "Offer", "Interview Loop"],
    visual: "offer",
  },
];
