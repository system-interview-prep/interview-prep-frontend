"use client";

import React, { useState } from "react";
import HeroSection from "@features/marketing/components/hero/HeroSection";
import HumanMomentSection from "@features/marketing/components/HumanMomentSection";
import MarketingCareerClassification from "@features/marketing/components/classification/MarketingCareerClassification";
import MarketingTargetJobSection from "@features/marketing/components/jobs/MarketingTargetJobSection";
import MatchingShowcase from "@features/marketing/components/matching/MatchingShowcase";
import InterviewExperience from "@features/marketing/components/interview/InterviewExperience";
import ProductVideo from "@features/marketing/components/demo/ProductVideo";
import ProductWalkthrough from "@features/marketing/components/demo/ProductWalkthrough";
import MarketingFeedbackPreview from "@features/marketing/components/feedback/MarketingFeedbackPreview";
import TrustSection from "@features/marketing/components/trust/TrustSection";
import FAQ from "@features/marketing/components/FAQ";
import FinalCTA from "@features/marketing/components/FinalCTA";

export default function LandingPage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-[#14244B]">
      {/* 01. Hero Section (45% Text / 55% Composite Visual with candidate & product UI) */}
      <HeroSection onOpenVideo={() => setIsVideoOpen(true)} />

      {/* 02. Human Moment / Problem Section (Editorial quote & real candidate photo) */}
      <HumanMomentSection />

      {/* 03. Career Classification (Split layout: Product UI ← Text) */}
      <MarketingCareerClassification />

      {/* 04. Choose Target Role (Split layout: Text → Job cards & requirements) */}
      <MarketingTargetJobSection />

      {/* 05. CV ↔ JD Evidence Matching (Split layout: Product UI ← Text) */}
      <MatchingShowcase />

      {/* 06. Cinematic AI Interview (#204195 Dark Navy background, Waveform, Transcript, Evidence chips) */}
      <InterviewExperience />

      {/* 07. Product Demo Video (30-60s video player & muted preview loop) */}
      <ProductVideo isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />

      {/* 08. How It Works (Linear process walkthrough without repetitive 3-cards) */}
      <ProductWalkthrough />

      {/* 09. Structured Feedback (Authentic STAR report UI) */}
      <MarketingFeedbackPreview />

      {/* 10. Trust / Evidence (Calm proof & metrics) */}
      <TrustSection />

      {/* 11. FAQ (Pure typography accordion) */}
      <FAQ />

      {/* 12. Final CTA (Typography + subtle mascot encouragement helper) */}
      <FinalCTA />
    </main>
  );
}

