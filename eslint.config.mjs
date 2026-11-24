import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";

const legacyUntypedIntegrationFiles = [
  "src/features/admin/components/AdminJobProfileCreateView.tsx",
  "src/features/admin/components/AdminJobProfilesPanel.tsx",
  "src/features/admin/components/KnowledgeBaseClient.tsx",
  "src/features/interview/components/SimliAvatar.tsx",
  "src/features/resume/components/PdfEvidenceVisualizer.tsx",
  "src/lib/aiService.ts",
  "src/services/socket.ts",
  "src/utils/index.ts",
];

const effectInitializationFiles = [
  "src/app/(interview-fullscreen)/interview/room/**",
  "src/auth/useAuthProfile.ts",
  "src/components/NavigationLoadingProvider.tsx",
  "src/components/user-dashboard/DemoSessionsHistory.tsx",
  "src/hooks/useAudioPlayer.ts",
  "src/hooks/useJpUploadStatus.ts",
  "src/hooks/useVoiceRecognition.ts",
  "src/hooks/useWebRTC.ts",
];

const legacyImageFiles = [
  "src/features/admin/components/AdminSidebarBrand.tsx",
  "src/features/admin/components/KnowledgeBaseClient.tsx",
  "src/features/interview/components/ChatInterviewBrand.tsx",
  "src/features/interview/components/ChatMessages.tsx",
  "src/features/interview/components/VoiceLiveTranscript.tsx",
  "src/features/user-dashboard/components/UserDashboardShell.tsx",
  "src/app/(workspace)/**/*.tsx",
  "src/app/(interview-fullscreen)/**/*.tsx",
  "src/app/admin/**/*.tsx",
];

const legacyUnusedValueFiles = [
  "src/features/admin/components/AdminJobProfileCreateView.tsx",
  "src/features/admin/components/AdminJobProfileDetailView.tsx",
  "src/features/admin/components/AdminJobProfilesPanel.tsx",
  "src/features/admin/components/KnowledgeBaseClient.tsx",
  "src/features/interview/components/InterviewRoomHeader.tsx",
  "src/features/interview/components/SimliAvatar.tsx",
  "src/features/resume/components/PdfEvidenceVisualizer.tsx",
  "src/app/(interview-fullscreen)/interview/**",
  "src/services/jobProfileApi.ts",
];

const legacyEffectDependencyFiles = [
  "src/features/admin/components/AdminJobProfilesPanel.tsx",
  "src/features/admin/components/KnowledgeBaseClient.tsx",
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
    files: ["src/components/ui/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/features/**",
                "@/features/**",
                "@features/**",
                "../features/**",
                "../../features/**",
                "../../../features/**",
              ],
              message:
                "Reverse dependency violation: UI primitives and core lib modules must not import from feature modules.",
            },
          ],
        },
      ],
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