import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Curator AI | Master Your Next Interview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script id="tailwind-config">{`tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "error-container": "#ffdad6",
        "secondary-container": "#d5e3fc",
        "surface-container-highest": "#e0e3e5",
        "inverse-on-surface": "#eff1f3",
        "on-primary": "#ffffff",
        "on-surface-variant": "#434654",
        "primary": "#003d9b",
        "surface-dim": "#d8dadc",
        "on-error-container": "#93000a",
        "secondary-fixed-dim": "#b9c7df",
        "on-tertiary-fixed-variant": "#5a00c6",
        "on-tertiary": "#ffffff",
        "surface": "#f7f9fb",
        "surface-container-high": "#e6e8ea",
        "tertiary-container": "#7029e1",
        "primary-fixed": "#dae2ff",
        "on-primary-fixed-variant": "#0040a2",
        "tertiary": "#5600be",
        "on-background": "#191c1e",
        "on-secondary-fixed": "#0d1c2e",
        "on-primary-container": "#c4d2ff",
        "secondary": "#515f74",
        "surface-container": "#eceef0",
        "surface-container-low": "#f2f4f6",
        "primary-fixed-dim": "#b2c5ff",
        "tertiary-fixed": "#eaddff",
        "surface-bright": "#f7f9fb",
        "on-tertiary-fixed": "#25005a",
        "on-secondary-fixed-variant": "#3a485b",
        "on-secondary": "#ffffff",
        "primary-container": "#0052cc",
        "outline": "#737685",
        "secondary-fixed": "#d5e3fc",
        "tertiary-fixed-dim": "#d2bbff",
        "outline-variant": "#c3c6d6",
        "on-primary-fixed": "#001848",
        "inverse-surface": "#2d3133",
        "surface-variant": "#e0e3e5",
        "on-secondary-container": "#57657a",
        "error": "#ba1a1a",
        "background": "#f7f9fb",
        "on-error": "#ffffff",
        "on-tertiary-container": "#decbff",
        "on-surface": "#191c1e",
        "surface-tint": "#0c56d0",
        "surface-container-lowest": "#ffffff",
        "inverse-primary": "#b2c5ff"
      },
      fontFamily: {
        headline: ["Manrope"],
        body: ["Inter"],
        label: ["Inter"]
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" }
    }
  }
}`}</script>
      </Head>
      <nav className="bg-[#f7f9fb] dark:bg-slate-900 sticky top-0 z-50 transition-colors duration-200">
        <div className="flex justify-between items-center w-full px-12 py-4 mx-auto max-w-7xl">
          <div className="text-2xl font-black text-[#191c1e] dark:text-white tracking-tighter font-headline">Curator AI</div>
          <div className="hidden md:flex items-center space-x-8 font-headline tracking-tight font-bold text-lg">
            <Link className="text-[#003d9b] dark:text-blue-300 border-b-2 border-[#003d9b] pb-1" href="/">Platform</Link>
            <Link className="text-[#434654] dark:text-slate-400 hover:text-[#191c1e] transition-colors duration-200" href="/solutions">Solutions</Link>
            <Link className="text-[#434654] dark:text-slate-400 hover:text-[#191c1e] transition-colors duration-200" href="/pricing">Pricing</Link>
            <Link className="text-[#434654] dark:text-slate-400 hover:text-[#191c1e] transition-colors duration-200" href="/resources">Resources</Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/login" className="text-[#434654] font-medium hover:text-[#191c1e] active:scale-95 transition-transform">Login</Link>
            <Link href="/signup" className="bg-primary text-white px-6 py-2.5 rounded-md font-bold hover:bg-primary-container active:scale-95 transition-transform">Get Started</Link>
            <div className="flex items-center gap-2 border-l border-outline-variant pl-4 text-[#434654]">
              <span className="material-symbols-outlined cursor-pointer hover:bg-[#eceef0] p-1 rounded-full transition-colors">language</span>
              <span className="material-symbols-outlined cursor-pointer hover:bg-[#eceef0] p-1 rounded-full transition-colors">settings</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="bg-surface font-body text-on-surface">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-12 max-w-7xl mx-auto overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-on-tertiary-fixed bg-tertiary-fixed rounded-full uppercase">
                AI-Powered Editorial Intelligence
              </span>
              <h1 className="font-headline text-6xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-8 leading-[0.95]">
                Master the Art of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Modern Interview.</span>
              </h1>
              <p className="text-on-surface-variant text-xl md:text-2xl mb-10 max-w-xl leading-relaxed">
                Practice with Curator AI. Realistic interview simulations across Chat, Voice, and Video to sharpen your performance with instant editorial feedback.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="bg-gradient-to-r from-primary to-tertiary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-transform inline-block">
                  Start Your Free Session
                </Link>
                <Link href="/demo" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-primary border border-outline-variant/20 hover:bg-surface-container transition-colors inline-block">
                  <span className="material-symbols-outlined">play_circle</span>
                  Watch Demo
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-tertiary/10 rounded-full blur-[100px]"></div>
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
              {/* Decorative Bento Image Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-outline-variant/10">
                    <img className="w-full h-48 object-cover rounded-2xl mb-4" alt="professional woman smiling confidently during a video conference" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSqeZrQ5uHSHv6d5S2vpVcmrwqjmhKFNQdXpQ4HPTY3VEAtWvriz08FNoWklZV9T3hEW9C8MGNhVHjbVyLTZGwpNgq16MsF9NOB-qWuQt90yBjuGGwTZeeXb22wRm_SV5J5xoHp1EM5lWcybbPVcaNEJ0RKKCl3l0dKghyy-9ItOvRr2upWRkmJsZsPSoGzEJP_Ztk7M4-hoUSj712dyak0r-5gEHFRbblgFUx5HOrsPnvbQ1Aq6NxPMmoMVtsciZEe6LgJDXyMzHr" />
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined ai-pulse">videocam</span>
                      <span className="text-sm">Live Video Mode</span>
                    </div>
                  </div>
                  <div className="bg-primary text-white p-6 rounded-3xl h-40 flex flex-col justify-end">
                    <p className="font-headline font-bold text-lg">98% Accuracy</p>
                    <p className="text-xs opacity-70">Sentiment Analysis Engine</p>
                  </div>
                </div>
                <div className="pt-12 space-y-4">
                  <div className="bg-surface-container-low p-6 rounded-3xl h-56 border border-outline-variant/10 flex flex-col justify-center">
                    <div className="flex gap-1 mb-4">
                      <div className="w-1 h-8 bg-tertiary rounded-full"></div>
                      <div className="w-1 h-12 bg-tertiary rounded-full"></div>
                      <div className="w-1 h-6 bg-tertiary rounded-full"></div>
                      <div className="w-1 h-10 bg-tertiary rounded-full"></div>
                    </div>
                    <p className="text-on-surface font-bold">Voice Transcription</p>
                    <p className="text-sm text-on-surface-variant">Real-time tone detection and clarity score.</p>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-sm border border-outline-variant/10 overflow-hidden">
                    <img className="w-full h-32 object-cover rounded-2xl" alt="high tech computer screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDedDBH3BHTRJY2TjzV4DCjdqeSXLUKtz3J-zlomUXtVBNF3wCQ8hR31jhexfbGZ_-f3hQs3EAVHFWpqcVkHtW4MCv4pDA49wk2n_Mgr7t-2LLmxtb8iJJA43HN9ypTdzJZqtLkvvluHsmSPzaFTfCIqrcUhTKtVNpsBjeTi5lJeUHhWndRu91bO9IJKd7p3DGbbO4jpU5USfZX42IUSWYLatM8mfdkAdR_6pQrhueLc-_UcqDY20-vZnYkLFUpH6YGqFUdRHHD85xu" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Interview Modes Section */}
        <section className="bg-surface-container-low py-24">
          <div className="max-w-7xl mx-auto px-12">
            <div className="mb-16 text-center">
              <h2 className="font-headline text-4xl font-extrabold mb-4">Practice Without the Pressure.</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">Choose the modality that matches your upcoming interview. Our AI adapts its personality and questioning style to each format.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Chat Mode */}
              <div className="group bg-surface-container-lowest p-8 rounded-3xl hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined text-4xl">forum</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">AI Chat Mentorship</h3>
                <p className="text-on-surface-variant mb-6">Master technical screenings and written assessments. Get instant feedback on grammar, tone, and technical accuracy.</p>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/3 transition-all duration-700 group-hover:w-full"></div>
                </div>
              </div>
              {/* Call Mode */}
              <div className="group bg-surface-container-lowest p-8 rounded-3xl hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-16 h-16 bg-tertiary-fixed rounded-2xl flex items-center justify-center mb-6 text-tertiary">
                  <span className="material-symbols-outlined text-4xl">call</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Voice Simulations</h3>
                <p className="text-on-surface-variant mb-6">Perfect your phone etiquette. Our AI analyzes your pace, confidence markers, and use of filler words in real-time.</p>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary w-1/3 transition-all duration-700 group-hover:w-full"></div>
                </div>
              </div>
              {/* Video Mode */}
              <div className="group bg-surface-container-lowest p-8 rounded-3xl hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <span className="material-symbols-outlined text-4xl">videocam</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Immersive Video Call</h3>
                <p className="text-on-surface-variant mb-6">The ultimate test. AI-driven video agents analyze your body language, eye contact, and background professionality.</p>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container w-1/3 transition-all duration-700 group-hover:w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works (Editorial Style) */}
        <section className="py-24 px-12 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <img className="rounded-[2.5rem] shadow-2xl" alt="modern office interior" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDltl6LOsClo0AdcojJaHxuNwxG8GYZlP7_y2Kex87P5hPvtACBWHVZB-R9bi6DpRdSV9FSdVj9rlD8g9lcTm02JqnWj7fxPcFtQnwkQ7YnzFl6Vmbkac53T7vAsibxbmKOG3NdZPVk-5sy5aN8l0jmoQe9vgz_5HCob8oiKW5ygPn4JCCAsMLHpIym2hVlrg87Zg_SOV3DdrB4EcbGE6kdOMTB99og3d-V1fi0j7WV9XMyJACpxYvZEznpNp3piOxH5i_SECq7Dqjo" />
            </div>
            <div className="lg:w-1/2 space-y-12">
              <div>
                <h2 className="font-headline text-5xl font-extrabold mb-6">An Editorial Approach to Hiring.</h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">We don't just score you. We curate your professional narrative, helping you articulate your value with clarity and conviction.</p>
              </div>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <span className="text-4xl font-headline font-black text-outline-variant/30">01</span>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Configure Your Persona</h4>
                    <p className="text-on-surface-variant">Upload your resume and the target job description. Curator AI builds a custom interview persona.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <span className="text-4xl font-headline font-black text-outline-variant/30">02</span>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Simulated Engagement</h4>
                    <p className="text-on-surface-variant">Engage in a 15-30 minute session tailored to your industry's specific challenges.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <span className="text-4xl font-headline font-black text-outline-variant/30">03</span>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Curated Insights</h4>
                    <p className="text-on-surface-variant">Receive a deep-dive report with specific transcript improvements and behavioral coaching.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Testimonials */}
        <section className="bg-surface-dim/20 py-24">
          <div className="max-w-7xl mx-auto px-12">
            <h2 className="font-headline text-3xl font-bold mb-12 text-center">Loved by top professionals.</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
                <div className="flex gap-1 text-tertiary mb-4">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <p className="italic text-on-surface mb-6">"The video call simulation felt incredibly real. The feedback on my body language helped me land my Senior Product role at a Tier 1 tech firm."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed overflow-hidden">
                    <img className="w-full h-full object-cover" alt="Alex Rivera" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFe8SRdQXrbOy3Y7zHT7QAkJUHMOwPhB3_ILdGTJWrr-j0qc_9J0kAD0Tj1VATbA3Ds9r-26i6_HSIZ0M5piYPyHeVpsoGPvnPF2R1L4UsingSY3wBIay2U89-pvD6qUPBMbX-dCxYdOlrTHieXa2UmV5mB2LY6LfuR3-Sy48lGz0VygxnBX6lUGcwKDaoP6SDC0i0EjOl4ig7edEgvn_xvznHBT6nVd-JvFc3jvbrLGNbK1T2JarA5u67nPUb0mUrxaXTO8j5a9OQ" />
                  </div>
                  <div>
                    <p className="font-bold">Alex Rivera</p>
                    <p className="text-xs text-on-surface-variant">Product Lead</p>
                  </div>
                </div>
              </div>
              {/* Testimonial 2 */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
                <div className="flex gap-1 text-tertiary mb-4">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <p className="italic text-on-surface mb-6">"Curator AI's editorial feedback is a game changer. It didn't just tell me what was wrong, it showed me how to phrase my answers more powerfully."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-fixed overflow-hidden">
                    <img className="w-full h-full object-cover" alt="Sarah Jenkins" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6v0u4dXiMcG4uoy57zQbNUridLNjOQHyHwuhS4zUhVRfLIng6elWlB1sSMmGzuSGQv-edIMynHdEhn8WmdAzh_tr8Ef4R40Nrr_X5JesKrt_6y1j9SRgQg7wifBTUtGUwsjJm5rJmXrQx_oPxDXGVRSIljZ2ZPIOVXCnQ1rd9fBkz3A44ZPn9yoy8-GuuWP7fKUfpJo3dIbqhOtstUY1b8uZhECK9IH5wipnWnkQUR4gskOQnfd6ZHVzsuPEsb-lz1JFKj2FcJZeN" />
                  </div>
                  <div>
                    <p className="font-bold">Sarah Jenkins</p>
                    <p className="text-xs text-on-surface-variant">HR Director</p>
                  </div>
                </div>
              </div>
              {/* Testimonial 3 */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10">
                <div className="flex gap-1 text-tertiary mb-4">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <p className="italic text-on-surface mb-6">"Perfect for high-stakes interviews. The AI's ability to follow-up on my specific technical answers was impressively rigorous."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-tertiary-fixed overflow-hidden">
                    <img className="w-full h-full object-cover" alt="David Chen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYecQ0JpKYG-mIn5LMHRgfLTm3GjWz3T7NrxYOUsfe3o0Z9XnvXLUr5B6GE5-KftETiey8q-q-oMnxCrg1oANdDnlEZ7KZHdyIbPLF5Rp75G09SyFAExewLeEZXAic-rDfBRHIO6e30pL0Dq_LEFbg5SHHDJ_Y_mQ9UAs1rq8iBY0mbMV8P9q1t5t7Uw20a8oJsfclm2Dc0cr_XF1b_GMzlDr-Df9fPR_1dqfwGPH5ufSKKUUPVRW-NXyBW6hlwzLEd9JOkDIKjmXG" />
                  </div>
                  <div>
                    <p className="font-bold">David Chen</p>
                    <p className="text-xs text-on-surface-variant">Software Engineer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-24 px-12">
          <div className="max-w-5xl mx-auto bg-[#7029e1] rounded-[3rem] p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="font-headline text-5xl font-extrabold mb-8 tracking-tighter">Ready to Curate Your Career?</h2>
              <p className="text-white/80 text-xl mb-12 max-w-xl mx-auto">Join 50,000+ professionals using AI to master their communication skills.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/signup" className="bg-white text-tertiary px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl inline-block">Get Started Free</Link>
                <Link href="/pricing" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all inline-block">View Pricing</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="w-full border-t border-[#c3c6d6]/20 py-12 bg-[#f7f9fb] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="font-manrope font-bold text-[#191c1e] text-xl">Curator AI</div>
            <p className="font-inter text-xs text-[#434654] dark:text-slate-500 max-w-xs text-center md:text-left">© 2024 Curator AI Platform. Editorial Intelligence for HR.</p>
          </div>
          <div className="flex gap-8 font-inter text-xs text-[#434654] dark:text-slate-500">
            <Link className="hover:underline transition-all" href="/privacy">Privacy Policy</Link>
            <Link className="hover:underline transition-all" href="/terms">Terms of Service</Link>
            <Link className="hover:underline transition-all" href="/cookies">Cookie Policy</Link>
            <Link className="hover:underline transition-all" href="/security">Security</Link>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[#434654] hover:bg-primary-container hover:text-white cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-sm">share</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[#434654] hover:bg-primary-container hover:text-white cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-sm">email</span>
            </div>
          </div>
        </div>
      </footer>
      {/* Bottom Nav Bar (Mobile Only) */}
      <nav className="md:hidden bg-[#7029e1]/85 backdrop-blur-xl fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full px-8 py-3 w-fit min-w-[320px] flex items-center justify-around gap-6 z-50 shadow-[0_40px_60px_rgba(25,28,30,0.04)] border-[#c3c6d0]/20">
        <div className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all cursor-pointer"><span className="material-symbols-outlined">mic</span><span className="font-inter text-[10px] uppercase tracking-widest">Mic</span></div>
        <div className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all cursor-pointer"><span className="material-symbols-outlined">videocam</span><span className="font-inter text-[10px] uppercase tracking-widest">Video</span></div>
        <div className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all cursor-pointer"><span className="material-symbols-outlined">history</span><span className="font-inter text-[10px] uppercase tracking-widest">History</span></div>
        <div className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-all cursor-pointer bg-white/20 rounded-full p-3"><span className="material-symbols-outlined">call_end</span><span className="font-inter text-[10px] uppercase tracking-widest">End</span></div>
      </nav>
    </>
  );
}
