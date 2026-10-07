# UX-11A: Unblok Public Design Contract & Visual Foundation

**Platform**: Unblok — High-Density Engineering Execution & Dependency Intelligence  
**Document**: Public Visual System, Design System Extensions, Composition & Responsive Architecture  
**Phase**: UX-11A (Public Experience & Routing Architecture)  
**Status**: FROZEN ARCHITECTURAL SPECIFICATION  

---

## 1. Public Visual System: The Single Fixed Public Theme

### The Immutable Single-Theme Rule
In contrast to the private application shell (which supports user-selected `Light`, `Dark`, and `System` theme modes via `SettingsContext`), **the Unblok public web experience uses exactly ONE fixed, intentionally designed visual theme**.

* **No Theme Toggles**: The public header, navigation, and footer must **never** expose a theme switcher (Light/Dark/System).
* **Rationale**: Marketing and product storytelling require precise, calibrated art direction. Contrast ratios, screenshot borders, typography hierarchy, and visual depth must be deterministic and pristine for every prospective visitor, reviewer, and search engine renderer.

### Visual Palette Tokens (Public Theme)
The public theme is anchored in a bright, warm-neutral canvas paired with authoritative deep-slate typography and Unblok's signature purple execution accent:

```css
/* Core Public Tokens */
--color-pub-bg: #faf9f6;             /* Warm alabaster canvas */
--color-pub-surface: #ffffff;        /* Pure white card / panel surface */
--color-pub-surface-subtle: #f3f1ec; /* Soft warm gray for contrast bands */

--color-pub-text-primary: #111827;   /* Deep slate / ink for bold headlines */
--color-pub-text-secondary: #4b5563; /* Slate for editorial supporting body */
--color-pub-text-muted: #9ca3af;     /* Light slate for captions and eyebrows */

--color-pub-border: #e5e3df;         /* Subtle warm hairline border */
--color-pub-border-strong: #d1cfc7;  /* Accentuated card and frame perimeter */

--color-pub-accent: #6366f1;         /* Unblok Primary Brand Indigo/Purple */
--color-pub-accent-hover: #4f46e5;   /* Deepened purple interactive state */
--color-pub-accent-subtle: #eef2ff;  /* 5% tint for badge/highlight backdrops */

--color-pub-blocked: #ef4444;        /* Critical blocker indicator red */
--color-pub-done: #10b981;           /* Completed execution emerald */
```

---

## 2. One Unblok Design System: Reusing Existing Foundations

The public experience is **not** a detached second design system. It directly reuses the existing Unblok design tokens and component foundations, extending them strictly where editorial display composition requires it.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        SHARED CORE DESIGN FOUNDATION                   │
│  • Spacing System (4px base scale: 4, 8, 12, 16, 24, 32, 48, 64px)    │
│  • Typography Engine (Inter / System font stack)                      │
│  • Radii Tokens (sm: 4px, md: 6px, lg: 8px, xl: 12px, 2xl: 16px)      │
│  • Semantic Color Semantics (Blocker Red, In-Progress Blue, Done Green)│
│  • Interactive States (Focus rings, hover elevation, keyboard trap)   │
│  • Button Primitives (Primary, Ghost, Secondary, Danger)              │
│  • Icon System (Lucide React icons with 1.5px stroke width)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PUBLIC EDITORIAL EXTENSIONS                       │
│  • Display Typography Scale (Hero Headline, Section Eyebrow)          │
│  • Marketing Container Shells (max-width: 1280px / fluid padding)     │
│  • Product Screenshot Frames (Curated browser bezel, elevation shadow)│
│  • Asymmetric Editorial Grids (Staggered offsets, split cards)        │
│  • Public Header & Global Marketing Footer                            │
└────────────────────────────────────────────────────────────────────────┘
```

### Shared Primitives Reused
1. **Buttons**: Reuses the core `Button` primitive (`variant="primary"`, `variant="ghost"`). Public buttons leverage the existing 8px radius, font weights, and keyboard focus outlines.
2. **Icons**: Standardized Lucide icons with identical stroke weight (1.5px) and sizing (16px, 20px, 24px).
3. **Execution Semantics**: When rendering status badges or dependency pills in marketing materials, they strictly match internal tokens (`#ef4444` for blocked, `#10b981` for resolved/done).

---

## 3. Public UX Philosophy: "Minimal. Informative. Creative."

Unblok's public design philosophy is guided by three principles:

> **Minimal. Informative. Creative.**

### Strict Prohibitions
To preserve professional integrity, the public website strictly avoids standard SaaS cliches:
* **NO generic SaaS templates**: No cookie-cutter card grids with identical stock icons.
* **NO excessive feature card matrices**: Feature lists must demonstrate real workflows, not 20 tiny boxes with generic buzzwords.
* **NO paragraph walls**: Visitors scan; copy must be ultra-concise.
* **NO repetitive layout monotony**: The page must **never** alternate `[text left / image right]` and `[image left / text right]` down the entire screen.
* **NO fake vanity proof**:
  - NO fabricated client logos ("Trusted by Acme, Google, Meta").
  - NO fake customer testimonials ("John Doe: Unblok changed our life!").
  - NO made-up statistics ("Increases velocity by 487%").
  - NO artificial urgency or countdown banners.

---

## 4. Creative Composition & Editorial Layout

Learning from world-class product communication (such as Jira and Atlassian's high-craft information architecture, without copying their styling), Unblok employs dynamic, varied visual rhythm.

### Composition Principles
1. **Oversized Product Captures**: Let genuine product UI dominate the viewport. When showcasing the DAG graph or My Work cockpit, give it full container width (1200px+) or edge-to-edge bleed.
2. **Purposeful Crops**: Rather than shrinking an entire dense 1920px screen until text is unreadable, crop tightly into the active region of interest (e.g., the blocker relationship between `AUTH-81` and `ENG-142`, or the slide-over `IssueDrawer` property panel).
3. **Overlapping UI Fragments**: Overlay contextual UI elements (such as a hovered dependency popover or a `CompletionGuardDialog` alert) subtly over the base table view to convey spatial depth and interactive dynamism.
4. **Asymmetric Editorial Rhythm**:
   - Hero: Centered display copy with massive, centered, elevated product window.
   - Section 1 (Execution): 60/40 asymmetric layout—large My Work triage table with high-density card callout.
   - Section 2 (Dependencies): Full-width interactive-feel DAG canvas spanning 1200px.
   - Section 3 (Context): Dual split showcasing the seamless relationship between the Project Issue list and the slide-over `IssueDrawer`.
   - Section 4 (Insights): 3-column asymmetric grid highlighting real delivery risk and cycle metrics.

### Screenshot Framing Standards
Screenshots must be framed with understated, high-craft browser bezels:
* **Bezel Style**: Ultra-thin top bar (28px height, `#f3f4f6`), three subtle traffic light dots (6px diameter, `#d1d5db`), no faux URL search inputs.
* **Corner Radius**: `12px` border radius on container, `overflow: hidden`.
* **Border & Shadow**: `1px solid rgba(0, 0, 0, 0.08)`, subtle layered elevation:
  `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)`.

---

## 5. Responsive Architecture

The public interface must be tailored across four canonical viewport breakpoints:

```text
┌───────────────────────┬───────────────────────┬───────────────────────┬───────────────────────┐
│     LARGE DESKTOP     │    LAPTOP / DESKTOP   │         TABLET        │         MOBILE        │
│       (1440px+)       │       (1024px)        │        (768px)        │        (390px)        │
└───────────────────────┴───────────────────────┴───────────────────────┴───────────────────────┘
```

### Breakpoint Specifications

| Element | Large Desktop (1440px+) | Laptop (1024px) | Tablet (768px) | Mobile (390px) |
| :--- | :--- | :--- | :--- | :--- |
| **Max Container Width** | `1280px` | `960px` | `720px` | `100%` (fluid with 16px gutter) |
| **Hero Headline Size** | `64px` (`line-height: 1.1`) | `48px` (`line-height: 1.15`)| `36px` (`line-height: 1.2`) | `30px` (`line-height: 1.25`) |
| **Navigation** | Full horizontal bar | Full horizontal bar | Collapsible hamburger menu | Full-screen mobile menu sheet |
| **Product Screenshot** | Full 1280px oversized frame | Scaled 960px frame | Responsive horizontal scroll or focused crop | Intentional vertical crop of primary component |
| **Grid Layouts** | 3-column / asymmetric 60-40 | 2-column or 60-40 | 2-column stacked | Single column vertical stack |
| **CTA Group** | Side-by-side row | Side-by-side row | Side-by-side row | Full-width stacked buttons |
| **Footer** | 5-column expanded grid | 4-column grid | 2-column grid | 1-column accordion / stack |

### Intentional Mobile Adaptation Rule
Mobile layouts must **never** feel like accidentally shrunk desktop assets. Screenshots on mobile must crop into the critical focal area (e.g. the specific blocked issue row) rather than scaling down the entire desktop UI until text becomes illegible micro-pixels.

---

## 6. Accessibility Contract

Public marketing pages must meet or exceed WCAG 2.1 Level AA accessibility standards:

1. **Semantic HTML Landmarks**:
   - `<header role="banner">` for public navigation.
   - `<main id="main-content">` for primary page body.
   - `<nav aria-label="Main Navigation">` for link navigation.
   - `<footer role="contentinfo">` for site-wide legal and sitemap links.
2. **Heading Hierarchy**:
   - Strictly **one `<h1>` per page** representing the primary topic.
   - Section headers follow ordered `<h2>` and `<h3>` descending order without skipping levels.
3. **Screenshot Alternative Text Strategy**:
   - Meaningful product captures must receive descriptive, functional alt text (e.g. `alt="Unblok My Work cockpit displaying two active blocker alerts and upstream dependency status"`).
   - Purely decorative graphical embellishments must use `alt=""` and `aria-hidden="true"`.
4. **Keyboard & Focus States**:
   - All interactive links, buttons, and navigation disclosures must support full tab traversal.
   - Explicit 2px purple focus rings (`outline: 2px solid #6366f1; outline-offset: 2px`) must remain visible on keyboard focus.
5. **Contrast Compliance**:
   - Headline and body text maintain at least `7:1` contrast ratio against the alabaster and white canvas.
   - Secondary text maintains at least `4.5:1`.

---

## 7. Motion & Interaction Direction

Motion must be restrained, purposeful, and quiet. Its sole job is to clarify relationships and provide polished feedback—never to entertain or distract.

* **Entrance Animations**: Subtle fade-and-slide up on scroll (`opacity: 0 -> 1`, `translateY: 12px -> 0px` over `240ms` cubic-bezier easing).
* **Dependency Progression**: When illustrating blocker chains, subtle progressive line draws reveal downstream causality.
* **Prohibited Motion Patterns**:
  - NO continuous floating badges or oscillating geometric shapes.
  - NO heavy 3D perspective tilts on mouse movement.
  - NO scroll-hijacking (smooth scrolling libraries that alter native scroll physics are strictly banned).
* **Reduced Motion Compliance**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
