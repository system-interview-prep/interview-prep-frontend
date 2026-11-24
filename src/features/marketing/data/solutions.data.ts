export type PersonaId = "student" | "seeker" | "professional";

export interface PersonaConfig {
  id: PersonaId;
  labelKey: string;
  badgeKey: string;
  titleKey: string;
  situationKey: string;
  problemKey: string;
  stepKeys: string[];
  capabilityKeys: string[];
  ctaKey: string;
  action: "cv" | "jobs" | "interview";
}

export interface ModalityItem {
  id: "chat" | "voice" | "video";
  titleKey: string;
  descKey: string;
  iconName: "chat" | "mic" | "video";
  featureKeys: string[];
}

export const SOLUTIONS_PERSONAS: PersonaConfig[] = [
  {
    id: "student",
    labelKey: "solutions.persona.student.label",
    badgeKey: "solutions.persona.student.badge",
    titleKey: "solutions.persona.student.title",
    situationKey: "solutions.persona.student.situation",
    problemKey: "solutions.persona.student.problem",
    stepKeys: [
      "solutions.persona.student.step1",
      "solutions.persona.student.step2",
      "solutions.persona.student.step3",
    ],
    capabilityKeys: [
      "solutions.persona.student.capability1",
      "solutions.persona.student.capability2",
      "solutions.persona.student.capability3",
    ],
    ctaKey: "solutions.persona.student.cta",
    action: "cv",
  },
  {
    id: "seeker",
    labelKey: "solutions.persona.seeker.label",
    badgeKey: "solutions.persona.seeker.badge",
    titleKey: "solutions.persona.seeker.title",
    situationKey: "solutions.persona.seeker.situation",
    problemKey: "solutions.persona.seeker.problem",
    stepKeys: [
      "solutions.persona.seeker.step1",
      "solutions.persona.seeker.step2",
      "solutions.persona.seeker.step3",
    ],
    capabilityKeys: [
      "solutions.persona.seeker.capability1",
      "solutions.persona.seeker.capability2",
      "solutions.persona.seeker.capability3",
    ],
    ctaKey: "solutions.persona.seeker.cta",
    action: "jobs",
  },
  {
    id: "professional",
    labelKey: "solutions.persona.professional.label",
    badgeKey: "solutions.persona.professional.badge",
    titleKey: "solutions.persona.professional.title",
    situationKey: "solutions.persona.professional.situation",
    problemKey: "solutions.persona.professional.problem",
    stepKeys: [
      "solutions.persona.professional.step1",
      "solutions.persona.professional.step2",
      "solutions.persona.professional.step3",
    ],
    capabilityKeys: [
      "solutions.persona.professional.capability1",
      "solutions.persona.professional.capability2",
      "solutions.persona.professional.capability3",
    ],
    ctaKey: "solutions.persona.professional.cta",
    action: "interview",
  },
];

export const SOLUTIONS_MODALITIES: ModalityItem[] = [
  {
    id: "chat",
    titleKey: "solutions.modalities.chat.title",
    descKey: "solutions.modalities.chat.desc",
    iconName: "chat",
    featureKeys: [
      "solutions.modalities.chat.feature1",
      "solutions.modalities.chat.feature2",
      "solutions.modalities.chat.feature3",
    ],
  },
  {
    id: "voice",
    titleKey: "solutions.modalities.voice.title",
    descKey: "solutions.modalities.voice.desc",
    iconName: "mic",
    featureKeys: [
      "solutions.modalities.voice.feature1",
      "solutions.modalities.voice.feature2",
      "solutions.modalities.voice.feature3",
    ],
  },
  {
    id: "video",
    titleKey: "solutions.modalities.video.title",
    descKey: "solutions.modalities.video.desc",
    iconName: "video",
    featureKeys: [
      "solutions.modalities.video.feature1",
      "solutions.modalities.video.feature2",
      "solutions.modalities.video.feature3",
    ],
  },
];
