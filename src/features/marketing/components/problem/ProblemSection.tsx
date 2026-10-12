"use client";

import React from "react";
import { motion } from "framer-motion";
import { PROBLEM_DATA } from "../../data/landing.data";
import { fadeInReveal } from "../../motion/variants";

export function ProblemSection() {
  return (
    <section id="problem" className="relative px-5 py-24 sm:px-8 md:py-36 bg-white border-y border-[#DCE4F3]/60">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeInReveal}
        className="mx-auto max-w-4xl text-left"
      >
        <div className="space-y-6">
          <p className="font-serif text-2xl italic font-normal text-[#607096] sm:text-3xl md:text-4xl">
            {PROBLEM_DATA.editorialHeadline}
          </p>

          <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-5xl md:text-6xl md:leading-[1.12] max-w-3xl">
            {PROBLEM_DATA.title}
          </h2>

          <p className="text-base font-normal leading-relaxed text-[#607096] sm:text-xl max-w-2xl pt-2">
            {PROBLEM_DATA.editorialBody}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

export default ProblemSection;
