import React from 'react';
import MarketingNav from '@components/layout/MarketingNav';
import Footer from '@components/layout/Footer';
import MarketingMotionConfig from '@features/marketing/motion/MarketingMotionConfig';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-body text-[#14244B]">
      <MarketingNav />
      <main className="flex-1">
        <MarketingMotionConfig>{children}</MarketingMotionConfig>
      </main>
      <Footer />
    </div>
  );
}
