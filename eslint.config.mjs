import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";

const legacyUntypedIntegrationFiles = [
  "components/admin/AdminJobProfileCreateView.tsx",
  "components/admin/AdminJobProfilesPanel.tsx",
  "src/app/admin/knowledge-base/KnowledgeBaseClient.tsx",
  "src/components/interview/SimliAvatar.tsx",
  "src/components/pdf-visualizer/PdfEvidenceVisualizer.tsx",
  "src/lib/aiService.ts",
  "src/services/socket.ts",
  "src/utils/index.ts",
];

const effectInitializationFiles = [
  "src/app/interview/room/**",
  "src/auth/useAuthProfile.ts",
  "src/components/NavigationLoadingProvider.tsx",
  "src/components/user-dashboard/DemoSessionsHistory.tsx",
  "src/hooks/useAudioPlayer.ts",
  "src/hooks/useJpUploadStatus.ts",
  "src/hooks/useVoiceRecognition.ts",
  "src/hooks/useWebRTC.ts",
];

const legacyImageFiles = [
  "components/admin/AdminSidebarBrand.tsx",
  "src/app/admin/**/*.tsx",
  "src/app/chat/page.tsx",
  "src/app/component/ChatInterviewBrand.tsx",
  "src/app/component/ChatMessages.tsx",
  "src/app/dashboard/**/*.tsx",
  "src/app/interview/**/*.tsx",
  "src/app/practice/page.tsx",
  "src/app/voice/components/VoiceLiveTranscript.tsx",
  "src/components/user-dashboard/UserDashboardShell.tsx",
];

const legacyUnusedValueFiles = [
  "components/admin/AdminJobProfileCreateView.tsx",
  "components/admin/AdminJobProfileDetailView.tsx",
  "components/admin/AdminJobProfilesPanel.tsx",
  "src/app/admin/knowledge-base/KnowledgeBaseClient.tsx",
  "src/app/chat/page.tsx",
  "src/app/component/InterviewRoomHeader.tsx",
  "src/app/interview/room/**",
  "src/components/interview/SimliAvatar.tsx",
  "src/components/pdf-visualizer/PdfEvidenceVisualizer.tsx",
  "src/hooks/useChat.ts",
  "src/hooks/useMedia.ts",
  "src/hooks/useVideoCallChat.ts",
  "src/services/jobProfileApi.ts",
];

const legacyEffectDependencyFiles = [
  "components/admin/AdminJobProfilesPanel.tsx",
  "src/app/admin/knowledge-base/KnowledgeBaseClient.tsx",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: legacyUntypedIntegrationFiles,
    rules: {
      // These files adapt untyped third-party SDK and API payloads. Keep the
      // exception narrow while new code remains subject to strict typing.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: effectInitializationFiles,
    rules: {
      // These effects initialize browser-only state or subscribe to external
      // resources; the rule is retained everywhere else.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: legacyImageFiles,
    rules: {
      // These views render user-provided or runtime image URLs. Migrating them
      // to next/image requires a shared remote-image policy, not a lint-only edit.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: legacyUnusedValueFiles,
    rules: {
      // Keep legacy optional integrations intact while they are incrementally
      // refactored; new files remain subject to this rule.
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: legacyEffectDependencyFiles,
    rules: {
      // These effects intentionally coordinate URL and asynchronous search state.
      "react-hooks/exhaustive-deps": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;