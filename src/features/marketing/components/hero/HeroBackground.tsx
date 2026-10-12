"use client";

import React from "react";

export function HeroBackground() {
  return (
    <div
      className="
        pointer-events-none
        absolute inset-0
        overflow-hidden
        select-none
      "
      aria-hidden="true"
    >
      {/* =====================================================
          1. BASE CANVAS
          Một nền trắng có chuyển sắc cực nhẹ xuyên cả Hero.
          Không để text-zone và image-zone thành hai vùng riêng.
      ====================================================== */}
      <div
        className="
          absolute inset-0
        "
        style={{
          background: `
            linear-gradient(
              90deg,
              #FFFFFF 0%,
              #FFFFFF 26%,
              rgba(248,250,254,0.72) 48%,
              rgba(250,251,254,0.48) 64%,
              #FFFFFF 100%
            )
          `,
        }}
      />

      {/* =====================================================
          2. LARGE BLUE ATMOSPHERE
          Glow rất rộng, đi từ headline qua khoảng giao giữa
          2 cột để chúng có cùng "không khí".
      ====================================================== */}
      <div
        className="
          absolute
          -left-[12%]
          top-[4%]

          h-[82%]
          w-[72%]

          rounded-[50%]

          bg-[#204195]/[0.035]
          blur-[150px]
        "
      />

      {/* =====================================================
          3. CENTER BRIDGE
          Đây là lớp quan trọng nhất:
          nối khu vực text với product visual.
      ====================================================== */}
      <div
        className="
          absolute
          left-[27%]
          top-[12%]

          h-[72%]
          w-[54%]

          rounded-[50%]

          bg-[#204195]/[0.025]
          blur-[120px]
        "
      />

      {/* =====================================================
          4. WARM ACCENT GLOW
          Vàng rất nhẹ quanh vùng headline / visual giao nhau.
          Không tạo một đốm vàng nhìn thấy rõ.
      ====================================================== */}
      <div
        className="
          absolute
          left-[30%]
          top-[48%]

          h-[28%]
          w-[30%]

          rounded-full

          bg-[#FCB625]/[0.045]
          blur-[105px]
        "
      />

      {/* =====================================================
          5. PRODUCT SIDE AIR
          Giữ vùng phía phải sáng và sạch để background
          của PNG có thể hòa vào trang.
      ====================================================== */}
      <div
        className="
          absolute
          right-[-14%]
          top-[-10%]

          h-[105%]
          w-[64%]

          rounded-full

          bg-white/90
          blur-[110px]
        "
      />

      {/* =====================================================
          6. EDITORIAL DOTS
          Chỉ xuất hiện nhẹ quanh headline.
          Không kéo tới visual.
      ====================================================== */}
      <div
        className="
          absolute
          -left-[2%]
          top-[4%]

          h-[78%]
          w-[42%]

          opacity-[0.015]
        "
        style={{
          backgroundImage:
            "radial-gradient(circle, #204195 1px, transparent 1px)",

          backgroundSize: "26px 26px",

          maskImage: `
            radial-gradient(
              ellipse 72% 72% at 36% 44%,
              black 0%,
              rgba(0,0,0,0.72) 48%,
              transparent 100%
            )
          `,

          WebkitMaskImage: `
            radial-gradient(
              ellipse 72% 72% at 36% 44%,
              black 0%,
              rgba(0,0,0,0.72) 48%,
              transparent 100%
            )
          `,
        }}
      />

      {/* =====================================================
          7. SOFT WHITE MIST BETWEEN TEXT & IMAGE
          Không phải fade ảnh.
          Chỉ làm vùng transition có độ "air".
      ====================================================== */}
      <div
        className="
          absolute
          left-[39%]
          top-[14%]

          h-[76%]
          w-[22%]

          rounded-full

          bg-white/35
          blur-[75px]
        "
      />

      {/* =====================================================
          8. BOTTOM LIGHT
          Giúp toàn hero kết thúc mềm thay vì thành block.
      ====================================================== */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0

          h-[18%]

          bg-gradient-to-t
          from-white
          via-white/55
          to-transparent
        "
      />
    </div>
  );
}

export default HeroBackground;