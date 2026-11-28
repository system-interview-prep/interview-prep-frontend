"use client";

import { createContext, useContext, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

/**
 * Where Google sign-in stands on this page:
 * - unconfigured: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing, so the Google provider is not mounted.
 * - loading / ready / failed: state of the Google Identity Services script.
 */
export type GoogleAuthStatus = "unconfigured" | "loading" | "ready" | "failed";

const GoogleAuthStatusContext = createContext<GoogleAuthStatus>("unconfigured");

export function useGoogleAuthStatus(): GoogleAuthStatus {
  return useContext(GoogleAuthStatusContext);
}

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [scriptStatus, setScriptStatus] = useState<"loading" | "ready" | "failed">("loading");

  if (!clientId) {
    return (
      <GoogleAuthStatusContext.Provider value="unconfigured">{children}</GoogleAuthStatusContext.Provider>
    );
  }

  return (
    <GoogleOAuthProvider
      clientId={clientId}
      onScriptLoadSuccess={() => setScriptStatus("ready")}
      onScriptLoadError={() => setScriptStatus("failed")}
    >
      <GoogleAuthStatusContext.Provider value={scriptStatus}>{children}</GoogleAuthStatusContext.Provider>
    </GoogleOAuthProvider>
  );
}
