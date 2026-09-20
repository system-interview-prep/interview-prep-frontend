import {
  AIOverviewStats,
  ObservabilityConnectionStatus,
  AIModelConfig,
  AIPromptItem,
  AITraceItem,
  AIErrorGroup,
} from "../types/aiOps.types";

export interface AIObservabilityProvider {
  name: "Langfuse" | "LangSmith" | "None";
  getConnectionStatus(): Promise<ObservabilityConnectionStatus>;
  getOverview(): Promise<AIOverviewStats | null>;
  getTraces(params?: { feature?: string; status?: string }): Promise<AITraceItem[]>;
  getTraceDetail(traceId: string): Promise<AITraceItem | null>;
  getErrors(): Promise<AIErrorGroup[]>;
  getModels(): Promise<AIModelConfig[]>;
  getPrompts(): Promise<AIPromptItem[]>;
}

/**
 * BackendProxyObservabilityProvider
 * Obays Rule 4: Zero browser credentials.
 * Interacts only via INTERVIA Core Backend proxy endpoints.
 * When backend endpoints are missing, safely returns NOT_CONNECTED.
 */
export class BackendProxyObservabilityProvider implements AIObservabilityProvider {
  name: "Langfuse" | "LangSmith" | "None" = "None";

  async getConnectionStatus(): Promise<ObservabilityConnectionStatus> {
    // Backend integration is pending as documented in ADMIN_BACKEND_GAPS.md
    return "NOT_CONNECTED";
  }

  async getOverview(): Promise<AIOverviewStats | null> {
    // Strict Rule 2 & 25: No fake data. Return null when backend provider is not connected.
    return null;
  }

  async getTraces(): Promise<AITraceItem[]> {
    return [];
  }

  async getTraceDetail(): Promise<AITraceItem | null> {
    return null;
  }

  async getErrors(): Promise<AIErrorGroup[]> {
    return [];
  }

  async getModels(): Promise<AIModelConfig[]> {
    // Proven real capabilities from project codebase (Rule 27):
    // 1. CV Parsing / Extraction
    // 2. CV-JD Matching
    // 3. Question Generation
    // 4. Interview Conversation
    // 5. Interview Scoring
    // 6. Feedback Generation
    return [
      {
        id: "cv-parser-1",
        capability: "CV_PARSING",
        capabilityLabel: "CV Parsing & Extraction",
        provider: "Google Vertex",
        modelName: "gemini-2.5-flash",
        environment: "PRODUCTION",
        version: "v1.0",
        status: "ACTIVE",
        lastChanged: "2026-09-18",
        readOnly: true,
      },
      {
        id: "cv-match-1",
        capability: "CV_JD_MATCHING",
        capabilityLabel: "CV - JD Taxonomy Matching",
        provider: "Google Vertex",
        modelName: "gemini-2.5-flash",
        environment: "PRODUCTION",
        version: "v1.0",
        status: "ACTIVE",
        lastChanged: "2026-09-18",
        readOnly: true,
      },
      {
        id: "q-gen-1",
        capability: "QUESTION_GENERATION",
        capabilityLabel: "Adaptive Question Generation",
        provider: "Google Vertex",
        modelName: "gemini-2.5-pro",
        environment: "PRODUCTION",
        version: "v1.0",
        status: "ACTIVE",
        lastChanged: "2026-09-19",
        readOnly: true,
      },
      {
        id: "conv-1",
        capability: "INTERVIEW_CONVERSATION",
        capabilityLabel: "Live Interview Voice/Chat Agent",
        provider: "Google Vertex",
        modelName: "gemini-2.5-pro",
        environment: "PRODUCTION",
        version: "v1.0",
        status: "ACTIVE",
        lastChanged: "2026-09-19",
        readOnly: true,
      },
      {
        id: "score-1",
        capability: "INTERVIEW_SCORING",
        capabilityLabel: "Interview Scoring & Rubric Evaluator",
        provider: "Google Vertex",
        modelName: "gemini-2.5-pro",
        environment: "PRODUCTION",
        version: "v1.0",
        status: "ACTIVE",
        lastChanged: "2026-09-19",
        readOnly: true,
      },
      {
        id: "fb-1",
        capability: "FEEDBACK_GENERATION",
        capabilityLabel: "Detailed Candidate Feedback",
        provider: "Google Vertex",
        modelName: "gemini-2.5-flash",
        environment: "PRODUCTION",
        version: "v1.0",
        status: "ACTIVE",
        lastChanged: "2026-09-19",
        readOnly: true,
      },
    ];
  }

  async getPrompts(): Promise<AIPromptItem[]> {
    return [];
  }
}

export const aiOpsService = new BackendProxyObservabilityProvider();
