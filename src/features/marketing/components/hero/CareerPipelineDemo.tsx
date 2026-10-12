"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export function CareerPipelineDemo() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 0, y: 8 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.65,
        delay: 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="
        relative
        w-full
        lg:-ml-10
        xl:-ml-14
      "
    >
      {/* Ambient bridge giữa text và product scene */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-[10%]
          top-[20%]
          h-[54%]
          w-[42%]
          rounded-full
          bg-[#204195]/[0.025]
          blur-[90px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[4%]
          top-[54%]
          h-[28%]
          w-[32%]
          rounded-full
          bg-[#FCB625]/[0.035]
          blur-[75px]
        "
      />

      {/* Product scene */}
      <div
        className="
          relative
          ml-auto

          w-[110%]
          max-w-[820px]

          aspect-[16/10]

          lg:w-[114%]
          lg:max-w-[850px]
          lg:aspect-auto
          lg:h-[500px]

          xl:h-[525px]
          xl:max-w-[880px]

          2xl:h-[545px]
          2xl:max-w-[910px]
        "
      >
        {/* 
          IMAGE LAYER
          Ảnh lớn hơn vùng hiển thị để không nhìn thấy ranh giới ảnh gốc
        */}
        <div
          className="
            absolute
            -inset-x-[7%]
            -inset-y-[5%]
          "
          style={{
            WebkitMaskImage: `
              radial-gradient(
                ellipse 108% 104% at 60% 50%,
                #000 0%,
                #000 80%,
                rgba(0,0,0,0.97) 86%,
                rgba(0,0,0,0.78) 92%,
                rgba(0,0,0,0.35) 97%,
                transparent 100%
              )
            `,
            maskImage: `
              radial-gradient(
                ellipse 108% 104% at 60% 50%,
                #000 0%,
                #000 80%,
                rgba(0,0,0,0.97) 86%,
                rgba(0,0,0,0.78) 92%,
                rgba(0,0,0,0.35) 97%,
                transparent 100%
              )
            `,
          }}
        >
          <Image
            src="/landing/hero/hero-composite-v2.png"
            alt="Mascot fox cùng hành trình CV, evidence matching và AI interview của INTERVIA"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 58vw"
            className="
              object-contain
              object-right-center
            "
          />
        </div>

        {/* 
          White air bên trái.
          Không che ảnh, chỉ làm vùng giao giữa text và visual sáng hơn.
        */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-[8%]
            inset-y-[10%]
            z-10

            w-[17%]

            bg-gradient-to-r
            from-white
            via-white/45
            to-transparent
          "
        />

        {/* Một lớp ánh sáng rất mỏng thay cho blur/fade mạnh */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            z-[5]

            bg-[radial-gradient(circle_at_30%_44%,rgba(255,255,255,0.15),transparent_24%)]
          "
        />
      </div>
    </motion.div>
  );
}

export default CareerPipelineDemo;