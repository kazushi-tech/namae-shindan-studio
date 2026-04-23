---
name: Japanese Modern Warmth
colors:
  surface: '#fff8f6'
  surface-dim: '#ead6d2'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ee'
  surface-container: '#fee9e5'
  surface-container-high: '#f8e4e0'
  surface-container-highest: '#f2deda'
  on-surface: '#241917'
  on-surface-variant: '#57423e'
  inverse-surface: '#3a2e2b'
  inverse-on-surface: '#ffede9'
  outline: '#8a726d'
  outline-variant: '#ddc0ba'
  surface-tint: '#a23e2c'
  primary: '#a23e2c'
  on-primary: '#ffffff'
  primary-container: '#e8725c'
  on-primary-container: '#5e0c02'
  inverse-primary: '#ffb4a6'
  secondary: '#006b54'
  on-secondary: '#ffffff'
  secondary-container: '#9cf3d5'
  on-secondary-container: '#0a725a'
  tertiary: '#7d5800'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf8c23'
  on-tertiary-container: '#3e2a00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a6'
  on-primary-fixed: '#3f0300'
  on-primary-fixed-variant: '#822717'
  secondary-fixed: '#9cf3d5'
  secondary-fixed-dim: '#81d7ba'
  on-secondary-fixed: '#002118'
  on-secondary-fixed-variant: '#00513f'
  tertiary-fixed: '#ffdea8'
  tertiary-fixed-dim: '#f6bd52'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4200'
  background: '#fff8f6'
  on-background: '#241917'
  surface-variant: '#f2deda'
typography:
  h1:
    fontFamily: Zen Maru Gothic
    fontSize: 32px
    fontWeight: '900'
    lineHeight: '1.4'
  h2:
    fontFamily: Zen Maru Gothic
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.5'
  h3:
    fontFamily: Zen Maru Gothic
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Noto Sans JP
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.8'
  body-md:
    fontFamily: Noto Sans JP
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.7'
  body-sm:
    fontFamily: Noto Sans JP
    fontSize: 14px
    fontWeight: '300'
    lineHeight: '1.6'
  label:
    fontFamily: Noto Sans JP
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
---

## Brand & Style

The design system is centered on the profound emotional journey of naming a new life. It harmonizes "Wa-modern" (Japanese Modern) aesthetics with a gentle, tactile warmth to support parents-to-be and new parents. The visual language balances the weight of tradition required for fortune-telling with the soft, approachable atmosphere necessary for childcare.

The style is **Modern-Tactile**. It avoids the sterile coldness of typical tech platforms by utilizing organic textures, rounded geometries, and a color palette inspired by natural pigments. The experience should feel like a high-quality stationery set—dependable, celebratory, and deeply personal.

## Colors

The palette is derived from traditional Japanese "Wae" colors, modernized for digital accessibility.

- **Primary (Terracotta):** Represents vitality and the "earth" from which a name grows. Used for the most critical actions.
- **Secondary (Sage Green):** Evokes growth and tranquility. Used for supportive elements and secondary information.
- **Accents (Soft Gold & Pink):** Used sparingly to highlight "good fortune" results and celebratory milestones.
- **Neutrals (Cream & Dark Brown):** Instead of pure blacks or grays, deep browns and warm creams are used to maintain the "warmth" narrative and reduce eye strain for tired parents.

All color combinations must maintain a contrast ratio of at least 4.5:1 for readability.

## Typography

The typography strategy prioritizes "softness" and "clarity." 

**Zen Maru Gothic** is reserved for headings to provide a friendly, rounded appearance that mimics the gentle curves of a child's features. Use the 900 weight for primary page titles and 700 for sub-headers.

**Noto Sans JP** provides the necessary legibility for long-form fortune-telling results. The 300 weight is used for decorative or supplementary text, while 400 and 500 are the standards for readability.

**Prohibited Fonts:** To maintain the specific brand identity, avoid all "default" system fonts such as Inter, Roboto, or Arial.

## Layout & Spacing

The design system utilizes a **Fixed Grid** model to instill a sense of order and reliability—essential for a fortune-telling service. 

A 12-column grid is used for desktop layouts, transitioning to a single-column fluid layout for mobile devices. Vertical rhythm is established using 8px increments. Generous whitespace (the "lg" and "xl" tokens) should be used between major sections to prevent the interface from feeling cluttered or overwhelming to users who may be multitasking.

## Elevation & Depth

Hierarchy is established through soft, ambient shadows and layered textures rather than harsh borders.

- **Standard Elevation:** Used for cards and floating elements. A very subtle brown-tinted shadow `rgba(61,48,41,0.06)` ensures elements feel like they are resting gently on paper.
- **Hover State:** When interacted with, elements lift significantly (6px) and gain a more pronounced shadow to provide immediate tactile feedback.
- **Background Textures:** To add depth without complexity, use a combination of Japanese dot patterns (Wagara) and soft radial gradients blending Pink and Sage Green. This creates a "misty" and ethereal background layer that feels like traditional washi paper.

## Shapes

The shape language is consistently rounded to reinforce the "warmth" and "safety" of the brand.

- **Cards:** Utilize a 20px radius. This large radius communicates friendliness.
- **Buttons:** A 12px radius provides a modern, "squishy" feel that is easy to target on mobile devices.
- **Inputs:** A slightly sharper 10px radius distinguishes interactive form fields from static decorative elements while remaining within the soft aesthetic.

## Components

### BEM Naming Convention
All components must follow the `.block__element--modifier` structure to ensure CSS maintainability. (e.g., `.card__header`, `.button--primary`).

### Cards
Cards are the primary container for fortune-telling results.
- **Surface:** White (#FFFFFF).
- **Border:** 1px solid #E8DFD3.
- **Accent:** A signature 3px top-border gradient: Terracotta → Gold → Sage.
- **Interaction:** On hover, the card rises 6px and rotates -1 degree for a playful, "picked-up" physical effect.

### Buttons
- **Primary CTA:** Uses a Terracotta gradient. It is the most prominent element on the page. Hover state shifts the tone to #D05A46.
- **Outline Button:** Transparent background with a Terracotta border. Used for secondary actions like "Back" or "Reset."

### Input Fields
Inputs should feel inviting. Use the 10px corner radius and ensure the focus state uses a Sage Green glow to signal a "safe" entry area.

### Animations
Implement a staggered entrance for content.
- Use `fade-in` and `slide-up` transitions.
- Apply a 0.1s incremental delay to elements within a list or a grid to create a "cascading" effect that feels intentional and calm.