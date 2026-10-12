export function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export type PlanId = "starter" | "pro" | "flex";

export interface PricingPlan {
  id: PlanId;
  price: number;
  featured?: boolean;
  nameKey: string;
  periodKey: string;
  descKey: string;
  featureKeys: string[];
}

export interface ComparisonRow {
  id: string;
  labelKey: string;
  starterValueKey: string;
  proValueKey: string;
  flexValueKey: string;
}

export interface FaqItem {
  id: string;
  qKey: string;
  aKey: string;
}

export interface BankConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  getTransferNote: (planId: PlanId) => string;
}

export const PAYMENT_BANK_CONFIG: BankConfig = {
  bankName: "MB Bank",
  accountNumber: "0888 2026 78",
  accountHolder: "INTERVIA TECH",
  getTransferNote: (planId: PlanId) => `INTERVIA ${planId.toUpperCase()} PASS`,
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    price: 99000,
    nameKey: "pricing.starterName",
    periodKey: "pricing.starterPeriod",
    descKey: "pricing.starterDescription",
    featureKeys: [
      "pricing.starterFeature1",
      "pricing.starterFeature2",
      "pricing.starterFeature3",
      "pricing.starterFeature4",
    ],
  },
  {
    id: "pro",
    price: 249000,
    featured: true,
    nameKey: "pricing.proName",
    periodKey: "pricing.proPeriod",
    descKey: "pricing.proDescription",
    featureKeys: [
      "pricing.proFeature1",
      "pricing.proFeature2",
      "pricing.proFeature3",
      "pricing.proFeature4",
      "pricing.proFeature5",
    ],
  },
  {
    id: "flex",
    price: 49000,
    nameKey: "pricing.flexName",
    periodKey: "pricing.flexPeriod",
    descKey: "pricing.flexDescription",
    featureKeys: [
      "pricing.flexFeature1",
      "pricing.flexFeature2",
      "pricing.flexFeature3",
      "pricing.flexFeature4",
    ],
  },
];

export const PRICING_COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: "cvMatching",
    labelKey: "pricing.cvMatching",
    starterValueKey: "pricing.valStarterCv",
    proValueKey: "pricing.unlimited",
    flexValueKey: "pricing.valFlexCv",
  },
  {
    id: "mockInterview",
    labelKey: "pricing.mockInterview",
    starterValueKey: "pricing.valStarterMock",
    proValueKey: "pricing.valProMock",
    flexValueKey: "pricing.valFlexMock",
  },
  {
    id: "chatPractice",
    labelKey: "pricing.chatPractice",
    starterValueKey: "pricing.included",
    proValueKey: "pricing.included",
    flexValueKey: "pricing.included",
  },
  {
    id: "voicePractice",
    labelKey: "pricing.voicePractice",
    starterValueKey: "pricing.notIncluded",
    proValueKey: "pricing.included",
    flexValueKey: "pricing.notIncluded",
  },
  {
    id: "videoPractice",
    labelKey: "pricing.videoPractice",
    starterValueKey: "pricing.notIncluded",
    proValueKey: "pricing.included",
    flexValueKey: "pricing.notIncluded",
  },
  {
    id: "evidenceFeedback",
    labelKey: "pricing.evidenceFeedback",
    starterValueKey: "pricing.included",
    proValueKey: "pricing.included",
    flexValueKey: "pricing.included",
  },
  {
    id: "progressTracking",
    labelKey: "pricing.progressTracking",
    starterValueKey: "pricing.included",
    proValueKey: "pricing.included",
    flexValueKey: "pricing.notIncluded",
  },
  {
    id: "cycle",
    labelKey: "pricing.cycle",
    starterValueKey: "pricing.starterPeriod",
    proValueKey: "pricing.proPeriod",
    flexValueKey: "pricing.flexPeriod",
  },
];

export const PRICING_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    qKey: "pricing.faq1Q",
    aKey: "pricing.faq1A",
  },
  {
    id: "faq-2",
    qKey: "pricing.faq2Q",
    aKey: "pricing.faq2A",
  },
  {
    id: "faq-3",
    qKey: "pricing.faq3Q",
    aKey: "pricing.faq3A",
  },
  {
    id: "faq-4",
    qKey: "pricing.faq4Q",
    aKey: "pricing.faq4A",
  },
];
