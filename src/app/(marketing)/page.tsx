import React from "react";
import HeroSection from "@features/marketing/components/hero/HeroSection";
import HumanMomentSection from "@features/marketing/components/HumanMomentSection";
import MarketingCareerClassification from "@features/marketing/components/classification/MarketingCareerClassification";
import MarketingTargetJobSection from "@features/marketing/components/jobs/MarketingTargetJobSection";
import MatchingShowcase from "@features/marketing/components/matching/MatchingShowcase";
import InterviewExperience from "@features/marketing/components/interview/InterviewExperience";
import ProductWalkthrough from "@features/marketing/components/demo/ProductWalkthrough";
import MarketingFeedbackPreview from "@features/marketing/components/feedback/MarketingFeedbackPreview";
import TrustSection from "@features/marketing/components/trust/TrustSection";
import FAQ from "@features/marketing/components/FAQ";
import FinalCTA from "@features/marketing/components/FinalCTA";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FD] text-[#14244B]">
      {/* 01. Hero: headline + a sample CV ↔ JD preview */}
      <HeroSection />

      {/* 02. Human moment (editorial quote & candidate photo) */}
      <HumanMomentSection />

      {/* 03. Career classification */}
      <MarketingCareerClassification />

      {/* 04. Choose target role */}
      <MarketingTargetJobSection />

      {/* 05. CV ↔ JD evidence matching */}
      <MatchingShowcase />

      {/* 06. Interview room preview */}
      <InterviewExperience />

      {/* 07. How it works (hero secondary CTA anchors here: #how-to-use) */}
      <ProductWalkthrough />

      {/* 08. Structured feedback */}
      <MarketingFeedbackPreview />

      {/* 09. Trust */}
      <TrustSection />

      {/* 10. FAQ */}
      <FAQ />

      {/* 11. Final CTA */}
      <FinalCTA />
    </div>
  );
}
