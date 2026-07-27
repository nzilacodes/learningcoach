---
name: Luminous Clarity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464554'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#904900'
  on-tertiary: '#ffffff'
  tertiary-container: '#b55d00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 1.5rem
  margin-page: 2rem
  stack-xl: 4rem
  stack-md: 1.5rem
---

## Brand & Style

The design system adopts a **Corporate Modern** aesthetic with a strong emphasis on **Minimalism** and precision. It translates the centered, focused layout of the reference image into a light-flooded environment that evokes productivity, intelligence, and transparency.

The brand personality is professional yet visionary. By replacing the dark, moody gradients of the original with a crisp white and light gray foundation, the interface feels expansive and breathable. We use subtle glassmorphism for floating elements to maintain a sense of lightness and technical sophistication, ensuring the UI feels like a high-end tool for deep work.

## Colors

This design system utilizes a "High-Key" palette. The background is a pure white (#FFFFFF), while structural containers use a very light cool gray (#F8FAFC) to create soft distinction without heavy borders.

- **Primary:** An electric Indigo (#6366F1) serves as the primary action color, providing a professional yet energetic focus point.
- **Surface:** We use a tiered system of grays (Slate 50 to Slate 200) for input fields and secondary cards to define the layout structure.
- **Accent:** A vibrant Violet (#8B5CF6) is reserved for special AI-driven states, mimicking the "spark" or "magic" elements from the reference.
- **Text:** High-contrast Slate 900 (#0F172A) ensures exceptional legibility for body copy and headings.

## Typography

The typography strategy focuses on a high-tech, precise feel. 

- **Headlines:** Hanken Grotesk provides a sharp, contemporary geometric look that works perfectly for large centered titles.
- **Body:** Inter is used for all functional text and long-form content to maximize readability and maintain a systematic appearance.
- **Labels/Technical:** JetBrains Mono is used sparingly for small labels and "Configuration" details to lean into the developer-friendly, precise nature of the tool.

Tracking is tightened on large display headers (-0.02em) to create a more impactful, editorial feel.

## Layout & Spacing

The design system follows a **Fixed Grid** approach for the core application canvas, centered horizontally to maintain the focus found in the reference image.

- **Central Focus:** The main interaction area is constrained to a 800px width within the larger container to prevent line lengths from becoming too long and to keep the "Search/Ask" interface at the heart of the experience.
- **Vertical Rhythm:** Large "Stack" units (4rem) separate the header, the primary prompt area, and the bottom suggestion cards.
- **Reflow:** On mobile, the three-column card layout at the bottom stacks vertically, and horizontal margins reduce to 1rem.

## Elevation & Depth

Depth is achieved through **Ambient Shadows** and **Tonal Layers** rather than heavy borders.

- **Base Layer:** Pure white (#FFFFFF).
- **Interactive Layer:** Input fields and secondary cards use a very subtle 1px border (#E2E8F0) and a soft, diffused shadow (Y: 4px, Blur: 20px, 4% Opacity) to appear "lifted."
- **Focus State:** When the "Ask Anything" box is active, it gains a slightly more pronounced shadow and a 2px primary color ring to draw the eye.
- **Glassmorphism:** Navigation bars and top-level menus use a `backdrop-filter: blur(12px)` with a 80% white opacity to maintain context while feeling premium.

## Shapes

The shape language is modern and approachable. 

- **Cards & Inputs:** A base radius of 1rem (`rounded-lg`) is used for the main input area and bottom feature cards, matching the soft-edged boxes in the reference.
- **Action Buttons:** Smaller buttons and chips use a "Pill" shape (Full radius) to distinguish them as tappable actions vs. structural containers.
- **Visual Flourish:** The central orb/graphic should maintain a perfect circle to contrast against the rectangular layout.

## Components

- **Primary Input:** The "Ask Anything" container should be white with a subtle inner shadow to give it a "recessed" feel. The "Attach" and "Options" buttons within it use Slate 600 text for a low-key appearance.
- **Action Button (Send):** A high-contrast circular button using the Primary Color (#6366F1) with a white icon.
- **Feature Cards:** Subtle gray backgrounds (#F8FAFC) that transition to a slightly darker tint on hover. The icons in the top-left of these cards should use the Accent Violet color.
- **Chips (Quick Actions):** Outlined style with 1px border. On hover, they fill with a light primary tint (Primary 50).
- **Navigation:** Floating at the top, using the glassmorphic blur defined in Elevation.