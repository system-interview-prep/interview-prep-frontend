# Design System Specification: The Intelligent Dialogue

## 1. Overview & Creative North Star
### The Creative North Star: "The Digital Curator"
This design system rejects the cluttered, "dashboard-heavy" aesthetic of traditional HR software. Instead, it adopts the persona of **The Digital Curator**: an interface that feels like a high-end editorial gallery. 

To achieve a "tech-focused" yet "trustworthy" environment, we move beyond generic grids. We utilize **intentional asymmetry**, where large typographic headers (`display-lg`) are offset against breathable, negative space. Elements should feel like they are floating in a pressurized, clean environment—achieved through overlapping layers and sophisticated tonal depth rather than rigid lines.

---

## 2. Colors & Surface Philosophy
The palette is anchored in authoritative `primary` blues and `tertiary` purples for AI-driven insights.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. 
*   **Implementation:** A `surface-container-low` (#f2f4f6) sidebar sitting against a `surface` (#f7f9fb) main stage.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface tiers to create "nested" depth:
*   **Base:** `surface` (#f7f9fb)
*   **Sectioning:** `surface-container-low` (#f2f4f6)
*   **Primary Interaction Cards:** `surface-container-lowest` (#ffffff)
*   **Overlays/Popovers:** `surface-bright` (#f7f9fb) with Glassmorphism.

### The "Glass & Gradient" Rule
For AI-related elements (transcriptions, real-time analysis), use the **Signature AI Texture**:
*   **Background:** `tertiary_container` (#7029e1) at 85% opacity with a `backdrop-blur` of 20px.
*   **Gradient:** A subtle linear transition from `primary` (#003d9b) to `tertiary` (#5600be) at a 45-degree angle for CTA buttons to provide "visual soul."

---

## 3. Typography
We use a dual-sans-serif approach to balance editorial authority with functional clarity.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` (3.5rem) for hero moments and `headline-md` (1.75rem) for interview categories. These should be set with tight letter-spacing (-0.02em) to feel premium.
*   **Body & Labels (Inter):** The workhorse. Use `body-md` (0.875rem) for candidate bios and `label-md` (0.75rem) for metadata. 
*   **Tonal Authority:** Always use `on_surface_variant` (#434654) for secondary body text to reduce visual vibration, keeping the focus on `on_surface` (#191c1e) titles.

---

## 4. Elevation & Depth

### The Layering Principle
Forget drop shadows for standard cards. Achieve "lift" by placing a `surface-container-lowest` (#ffffff) card on a `surface-container` (#eceef0) background. This creates a soft, architectural edge.

### Ambient Shadows
When an element must float (e.g., a recording controls bar), use **Ambient Light Shadows**:
*   **Blur:** 40px to 60px.
*   **Color:** `on_surface` (#191c1e) at **4% opacity**. It should be felt, not seen.

### The "Ghost Border" Fallback
If contrast testing requires a boundary (e.g., in high-glare environments), use a **Ghost Border**:
*   **Stroke:** 1px `outline-variant` (#c3c6d6) at 20% opacity. 100% opaque borders are strictly forbidden.

---

## 5. Components

### Buttons
*   **Primary (The Lead):** Background `primary` (#003d9b), rounded `md` (0.75rem). On hover, transition to `primary_container` (#0052cc).
*   **AI-Accent:** Use a gradient from `tertiary` to `tertiary_container`. Reserved exclusively for "Generate Insights" or "Start AI Analysis."
*   **Secondary:** No fill. Use `on_primary_fixed_variant` (#0040a2) text with a Ghost Border.

### Input Fields
*   **Resting:** `surface-container-highest` (#e0e3e5) background, no border.
*   **Focus:** `surface-container-lowest` (#ffffff) background with a 2px `surface_tint` (#0c56d0) Ghost Border. This "glow" indicates the AI is listening.

### Cards & Lists
*   **Constraint:** Forbid the use of divider lines. 
*   **Separation:** Use the **Spacing Scale `6` (2rem)** to separate list items. For history logs, alternate background colors between `surface` and `surface-container-low`.

### Specialized Components
*   **The Pulse Indicator:** A small, `tertiary` colored dot with a repeating scale animation (1.0 to 1.2) to indicate active AI processing.
*   **Glass Mic-Tray:** A floating `backdrop-blur` bar at the bottom of the screen containing thin-line communication icons.

---

## 6. Do’s and Don'ts

### Do
*   **DO** use `xl` (1.5rem) rounding for large "AI Insights" containers to make them feel friendly and distinct from "Standard Data" (`md` rounding).
*   **DO** use `surface-dim` (#d8dadc) for disabled states to maintain the tonal aesthetic.
*   **DO** utilize the Spacing Scale `12` (4rem) for page margins to ensure the "Editorial" feel.

### Don’t
*   **DON'T** use pure black (#000000) for text. Always use `on_surface` (#191c1e).
*   **DON'T** stack more than three layers of surfaces. If you need more depth, use a Glassmorphism overlay.
*   **DON'T** use "Standard" blue (#0000FF). Only use the refined `primary` (#003d9b) to maintain professional trust.