# TrustedCars Design System v1.0
**Premium Pre-Owned Car Marketplace**

> **Design Philosophy**: Balance premium quality with human warmth. Build trust through transparency, consistency, and attention to detail.

---

## Table of Contents
1. [Brand Foundation](#brand-foundation)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Library](#component-library)
6. [Logo Guidelines](#logo-guidelines)
7. [Trust-Building Principles](#trust-building-principles)

---

## Brand Foundation

### Core Values
- **Trustworthy**: Transparent, verified, accountable
- **Premium**: Quality-focused, attention to detail
- **Approachable**: Human, helpful, not intimidating
- **Modern**: Tech-forward, efficient, progressive

### Voice & Tone
- **Professional but warm**: "We've got you covered" not "Our enterprise solution provides comprehensive coverage"
- **Confident but humble**: Show expertise without arrogance
- **Clear over clever**: Transparency builds trust more than marketing speak

---

## Color System

### Primary Palette

#### **Trust Blue** (Primary)
```css
--color-primary-900: #082A4F;  /* Deepest - rare use */
--color-primary-800: #0B3A6E;  /* Brand primary - headers, major CTAs */
--color-primary-700: #0D4A8F;  /* Hover states */
--color-primary-600: #1E5AA8;  /* Interactive elements */
--color-primary-500: #2B6CB8;  /* Backgrounds */
--color-primary-100: #E6F2FF;  /* Subtle backgrounds */
--color-primary-50:  #F5FAFF;  /* Lightest tints */
```

**Why Trust Blue?**
- Blue is universally associated with trust, reliability, and security
- Darker shades convey professionalism and stability
- Used by financial institutions (banks) to signal security
- Avoids red (danger) and pure black (harsh)

#### **Success Green** (Accent)
```css
--color-success-700: #059669;  /* Hover state */
--color-success-600: #10B981;  /* Primary green - CTAs, checkmarks */
--color-success-500: #34D399;  /* Lighter interactions */
--color-success-100: #D1FAE5;  /* Success backgrounds */
--color-success-50:  #ECFDF5;  /* Lightest tint */
```

**Why Success Green?**
- Green signals "verified", "approved", "safe to proceed"
- Creates visual contrast against blue (action vs. stability)
- Warmer than pure blue palette - adds approachability
- Used for positive actions: "Certified", "Approved", "Buy Now"

#### **Ice Blue** (Accent/Highlight)
```css
--color-ice-600: #7DD3FC;  /* Interactive */
--color-ice-500: #BAE6FD;  /* Highlights, badges */
--color-ice-100: #E0F2FE;  /* Subtle backgrounds */
--color-ice-50:  #F0F9FF;  /* Lightest wash */
```

**Why Ice Blue?**
- Adds premium, modern feel (think luxury car showrooms)
- Creates visual interest without overwhelming
- Softer than primary blue - more approachable
- Used for secondary information, highlights, premium badges

### Secondary Palette

#### **Warm Accent** (NEW - Approachability)
```css
--color-amber-600: #D97706;  /* Warm CTAs, highlights */
--color-amber-500: #F59E0B;  /* Warning, premium badges */
--color-amber-100: #FEF3C7;  /* Warm backgrounds */
```

**Why Amber?**
- Adds human warmth to cool blue palette
- Signals premium/VIP without being aggressive (vs. red/orange)
- Used sparingly: premium listings, special offers, "hot deals"
- Creates visual hierarchy and draws attention

### Neutral Palette

```css
--color-slate-900: #0F172A;  /* Primary text */
--color-slate-800: #1E293B;  /* Secondary headings */
--color-slate-700: #334155;  /* Body text */
--color-slate-600: #475569;  /* Secondary text */
--color-slate-500: #64748B;  /* Placeholders */
--color-slate-400: #94A3B8;  /* Disabled text */
--color-slate-300: #CBD5E1;  /* Borders */
--color-slate-200: #E2E8F0;  /* Dividers */
--color-slate-100: #F1F5F9;  /* Subtle backgrounds */
--color-slate-50:  #F8FAFC;  /* Page background */
--color-white:     #FFFFFF;  /* Cards, elevated surfaces */
```

**Why Slate (not Gray)?**
- Slate has subtle blue undertone - cohesive with brand
- Warmer than pure gray - more approachable
- Modern tech aesthetic (used by Stripe, Linear, etc.)
- Better readability than stark black/white contrast

### Semantic Colors

```css
--color-error-600:   #DC2626;  /* Error states */
--color-error-50:    #FEF2F2;  /* Error backgrounds */
--color-warning-600: #D97706;  /* Warnings */
--color-warning-50:  #FFFBEB;  /* Warning backgrounds */
--color-info-600:    #2563EB;  /* Information */
--color-info-50:     #EFF6FF;  /* Info backgrounds */
```

---

## Gradients

### Hero Backgrounds

#### **Primary Hero** (Default)
```css
background: linear-gradient(135deg, #0D4A8F 0%, #0B3A6E 50%, #082A4F 100%);
```
**Improvement over current**: Lighter, less saturated. Diagonal flow is more dynamic than radial.

#### **Premium Hero** (Featured pages)
```css
background: linear-gradient(
  135deg, 
  #0B3A6E 0%, 
  #1E5AA8 25%,
  #2B6CB8 50%,
  #1E5AA8 75%,
  #0B3A6E 100%
);
```
**Why**: Creates depth and movement without being too dark.

#### **Light Hero Alternative**
```css
background: linear-gradient(
  to bottom,
  #F5FAFF 0%,
  #E6F2FF 50%,
  #FFFFFF 100%
);
```
**Why**: For pages needing lighter, more approachable feel (sell your car, onboarding).

### Accent Gradients

#### **Success Gradient** (CTAs)
```css
background: linear-gradient(135deg, #10B981 0%, #059669 100%);
box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
```
**Why**: Directional gradient adds depth. Shadow creates elevation (clickability).

#### **Premium Badge Gradient**
```css
background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
box-shadow: 0 2px 12px rgba(245, 158, 11, 0.3);
```
**Why**: Warm gradient signals exclusivity. Used for "Featured", "Premium Listing", "Hot Deal".

#### **Glass Morphism** (Modern cards)
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow: 0 8px 32px rgba(11, 58, 110, 0.08);
```
**Why**: Premium, modern aesthetic. Creates depth without heavy shadows.

---

## Typography

### Font Families

```css
--font-display: 'Manrope', system-ui, sans-serif;
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', 'Courier New', monospace;
```

**Why These Fonts?**
- **Manrope**: Geometric, modern, slightly rounded. Conveys precision + approachability. Used by premium brands.
- **Inter**: Designed for screen readability. Professional but not corporate. Open-source = cost-effective.
- **Fallback to system-ui**: Performance + accessibility if webfonts fail.

### Type Scale

```css
--text-xs:    0.75rem;   /* 12px - Fine print, labels */
--text-sm:    0.875rem;  /* 14px - Secondary text, captions */
--text-base:  1rem;      /* 16px - Body text (default) */
--text-lg:    1.125rem;  /* 18px - Emphasized body, intros */
--text-xl:    1.25rem;   /* 20px - Small headings, subheadings */
--text-2xl:   1.5rem;    /* 24px - Section headings */
--text-3xl:   1.875rem;  /* 30px - Page titles */
--text-4xl:   2.25rem;   /* 36px - Important headings */
--text-5xl:   3rem;      /* 48px - Hero headlines (desktop) */
--text-6xl:   3.75rem;   /* 60px - Large hero text */
--text-7xl:   4.5rem;    /* 72px - Homepage hero only */
```

**Why This Scale?**
- Based on major third (1.25) ratio - harmonious, proven
- 16px base = accessible, readable for all ages
- Larger sizes (5xl-7xl) for premium, confident first impressions

### Font Weights

```css
--font-normal:    400;  /* Body text */
--font-medium:    500;  /* Emphasis, captions */
--font-semibold:  600;  /* Buttons, labels */
--font-bold:      700;  /* Headings, strong emphasis */
--font-extrabold: 800;  /* Hero headlines only */
```

**Usage Rules**:
- **Body text**: font-normal (400)
- **Buttons**: font-semibold (600) or font-bold (700)
- **Headings**: font-bold (700)
- **Hero headlines**: font-extrabold (800)

**Why**: Clear hierarchy without overusing heavy weights. Extrabold only for hero = premium focus.

### Line Heights

```css
--leading-tight:   1.25;  /* Large headlines */
--leading-snug:    1.375; /* Subheadings */
--leading-normal:  1.5;   /* Body text */
--leading-relaxed: 1.625; /* Emphasized body */
--leading-loose:   1.75;  /* Long-form content */
```

**Why Generous Line Heights?**
- 1.5 (normal) minimum for accessibility and readability
- Tighter (1.25) for large display text = visual impact
- Looser (1.625-1.75) for trust-building content = breathing room

### Letter Spacing

```css
--tracking-tighter: -0.05em;  /* Large headings (60px+) */
--tracking-tight:   -0.025em; /* Medium headings */
--tracking-normal:  0;        /* Body text */
--tracking-wide:    0.025em;  /* Buttons, labels */
--tracking-wider:   0.05em;   /* Uppercase labels */
--tracking-widest:  0.1em;    /* Small caps, badges */
```

**Trust-Building Usage**:
- **Wide tracking on labels**: "CERTIFIED", "VERIFIED" - appears more official
- **Tight tracking on headlines**: Creates premium, editorial feel
- **Normal on body**: Prioritize readability

---

## Spacing & Layout

### Spacing Scale

```css
--space-0:   0;
--space-1:   0.25rem;  /*  4px */
--space-2:   0.5rem;   /*  8px */
--space-3:   0.75rem;  /* 12px */
--space-4:   1rem;     /* 16px - base unit */
--space-5:   1.25rem;  /* 20px */
--space-6:   1.5rem;   /* 24px */
--space-8:   2rem;     /* 32px */
--space-10:  2.5rem;   /* 40px */
--space-12:  3rem;     /* 48px */
--space-16:  4rem;     /* 64px */
--space-20:  5rem;     /* 80px */
--space-24:  6rem;     /* 96px */
--space-32:  8rem;     /* 128px */
```

**Why 4px Base Unit?**
- Divisible by 2 and 4 = flexible, harmonious
- Works across all screen sizes
- Industry standard (Material Design, iOS HIG)

### Container Widths

```css
--container-sm:  640px;   /* Mobile content */
--container-md:  768px;   /* Tablet */
--container-lg:  1024px;  /* Small desktop */
--container-xl:  1280px;  /* Desktop */
--container-2xl: 1440px;  /* Wide desktop */
--container-max: 1600px;  /* Maximum (rare) */
```

**Recommended**: `1280px` (xl) for main content. Provides generous whitespace on large screens = premium feel.

### Border Radius

```css
--radius-none: 0;
--radius-sm:   0.25rem;  /*  4px - Small elements */
--radius-md:   0.5rem;   /*  8px - Inputs, small cards */
--radius-lg:   0.75rem;  /* 12px - Cards, buttons */
--radius-xl:   1rem;     /* 16px - Large cards */
--radius-2xl:  1.5rem;   /* 24px - Featured cards */
--radius-full: 9999px;   /* Pills, badges, avatars */
```

**Trust Strategy**:
- **Moderate rounding (12-16px)**: Modern but not playful (vs. Cars24's heavy rounding)
- **Full radius for CTAs**: Makes buttons feel clickable, friendly
- **Subtle rounding on cards**: Professional yet approachable

### Shadows

```css
/* Elevation levels */
--shadow-xs:  0 1px 2px rgba(11, 58, 110, 0.05);
--shadow-sm:  0 1px 3px rgba(11, 58, 110, 0.08), 
              0 1px 2px rgba(11, 58, 110, 0.06);
--shadow-md:  0 4px 6px rgba(11, 58, 110, 0.07),
              0 2px 4px rgba(11, 58, 110, 0.06);
--shadow-lg:  0 10px 15px rgba(11, 58, 110, 0.08),
              0 4px 6px rgba(11, 58, 110, 0.05);
--shadow-xl:  0 20px 25px rgba(11, 58, 110, 0.1),
              0 10px 10px rgba(11, 58, 110, 0.04);
--shadow-2xl: 0 25px 50px rgba(11, 58, 110, 0.15);

/* Colored shadows for CTAs */
--shadow-success: 0 4px 20px rgba(16, 185, 129, 0.25);
--shadow-primary: 0 4px 20px rgba(27, 90, 168, 0.25);
--shadow-amber:   0 4px 20px rgba(245, 158, 11, 0.25);
```

**Why Colored Shadows with Low Opacity?**
- Creates depth without harsh contrast
- Feels premium and modern (Apple-like)
- Brand-colored shadows subtly reinforce identity

---

## Component Library

### Buttons

#### **Primary CTA**
```css
.btn-primary {
  font-family: var(--font-display);
  font-weight: var(--font-bold);
  font-size: var(--text-base);
  padding: 1rem 2rem;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  box-shadow: var(--shadow-success);
  transition: all 0.2s ease;
  letter-spacing: var(--tracking-wide);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(16, 185, 129, 0.35);
}
```

**Trust Elements**:
- **Pill shape**: Friendly, approachable
- **Gradient**: Premium feel, creates depth
- **Lift on hover**: Confirms interactivity
- **Shadow**: Makes button feel elevated, important

#### **Secondary CTA**
```css
.btn-secondary {
  font-family: var(--font-display);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  padding: 1rem 2rem;
  border-radius: var(--radius-full);
  background: white;
  color: var(--color-slate-700);
  border: 2px solid var(--color-slate-200);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--color-primary-600);
  color: var(--color-primary-700);
  background: var(--color-primary-50);
}
```

**Trust Elements**:
- **Clear hierarchy**: Less prominent than primary
- **Border signal**: "Alternative action" not dismissive
- **Subtle hover**: Provides feedback without distraction

#### **Text Link Button**
```css
.btn-link {
  font-family: var(--font-body);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  color: var(--color-primary-600);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.2s ease;
}

.btn-link:hover {
  color: var(--color-primary-700);
  text-decoration-thickness: 2px;
}
```

### Cards

#### **Standard Card**
```css
.card {
  background: white;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-slate-200);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
  border-color: var(--color-slate-300);
}
```

**Trust Elements**:
- **White background**: Clean, premium
- **Subtle border**: Defines boundaries without harshness
- **Lift on hover**: Signals interactivity
- **Generous padding**: Breathing room = premium feel

#### **Featured/Premium Card**
```css
.card-premium {
  background: linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 100%);
  border-radius: var(--radius-2xl);
  border: 2px solid var(--color-amber-500);
  padding: var(--space-8);
  box-shadow: var(--shadow-amber);
  position: relative;
  overflow: hidden;
}

.card-premium::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), transparent);
  border-radius: 0 0 0 100%;
}
```

**Trust Elements**:
- **Warm gradient**: Signals premium/featured
- **Thicker border**: Visual importance
- **Decorative corner**: Subtle luxury signal
- **Colored shadow**: Reinforces premium status

#### **Glass Card** (Modern)
```css
.card-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  box-shadow: 0 8px 32px rgba(11, 58, 110, 0.08);
}
```

**Trust Elements**:
- **Transparency**: Modern, tech-forward
- **Blur effect**: Premium iOS/macOS aesthetic
- **Soft edges**: Approachable, not harsh

### Badges

#### **Trust Badge**
```css
.badge-trust {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-success-50);
  border: 1px solid var(--color-success-600);
  border-radius: var(--radius-full);
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--color-success-700);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}
```

**Trust Elements**:
- **Pill shape**: Official, badge-like
- **Icon + text**: Visual + verbal reinforcement
- **ALL CAPS + wide tracking**: Authority, certification
- **Green color**: Verified, approved

#### **Premium Badge**
```css
.badge-premium {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  border-radius: var(--radius-full);
  font-family: var(--font-display);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: white;
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.3);
}
```

### Forms

#### **Input Fields**
```css
.input {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-slate-200);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--color-slate-900);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px rgba(27, 90, 168, 0.1);
}

.input::placeholder {
  color: var(--color-slate-400);
  font-weight: var(--font-normal);
}
```

**Trust Elements**:
- **Thicker border (2px)**: Feels substantial, well-made
- **Focus ring**: Clear feedback, accessibility
- **Medium font weight**: Appears more premium than normal weight

#### **Search Bar** (Hero)
```css
.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-full);
  padding: 0.75rem;
  box-shadow: 0 20px 60px rgba(11, 58, 110, 0.25);
  gap: 1rem;
}

.search-bar:focus-within {
  box-shadow: 0 25px 80px rgba(11, 58, 110, 0.35);
  transform: scale(1.01);
}
```

**Trust Elements**:
- **Pill shape**: Modern, friendly
- **Heavy shadow**: Hero element, primary action
- **Subtle scale on focus**: Confirms engagement
- **White background**: Stands out against dark hero

---

## Logo Guidelines

### Logo Variations

#### **Primary Lockup** (Default)
```
[Icon] TrustedCars
       Premium Pre-Owned
```
- Icon: 32-40px
- TrustedCars: Manrope Bold, 20-24px
- Tagline: Inter Medium, 10-11px, 80% opacity

**Usage**: Navbar, footer, marketing materials

#### **Horizontal Lockup** (Compact)
```
[Icon] TrustedCars | Premium Pre-Owned
```
- For tight spaces, mobile headers

#### **Icon Only**
```
[House/Shield Icon]
```
- Favicon, app icon, social media avatar
- Minimum size: 24px

#### **Wordmark Only**
```
TrustedCars
```
- When icon is implied (emails, documents)

### Logo Colors

#### **Primary** (Preferred)
- Icon: `#0B3A6E` (Primary blue)
- Text: `#0F172A` (Slate 900)
- Tagline: `#475569` (Slate 600)

#### **Reversed** (Dark backgrounds)
- Icon: `#FFFFFF` (White)
- Text: `#FFFFFF` (White)
- Tagline: `rgba(255, 255, 255, 0.8)`

#### **Monochrome**
- All black: `#0F172A`
- All white: `#FFFFFF`

### Clear Space
- Maintain space equal to icon height on all sides
- Never place text closer than 1x icon width

### Don'ts
- ❌ Don't stretch or distort
- ❌ Don't rotate
- ❌ Don't use drop shadows
- ❌ Don't use gradients on logo (only flat colors)
- ❌ Don't place on busy backgrounds
- ❌ Don't change font (always Manrope for wordmark)

### Minimum Sizes
- Digital: 120px width minimum
- Print: 25mm width minimum
- Icon only: 24px minimum

---

## Trust-Building Principles

### Visual Trust Signals

#### 1. **Consistency = Reliability**
- Use spacing scale strictly (4px increments)
- Maintain color palette (no random colors)
- Keep border radius consistent per component type
- **Why**: Inconsistency signals carelessness. Users subconsciously assess attention to detail.

#### 2. **Generous Whitespace = Premium**
- Minimum 48px between major sections
- 24px padding in cards (not 16px)
- Don't cram content
- **Why**: Luxury brands use whitespace to signal quality. Crowded = cheap.

#### 3. **Hierarchy = Clarity = Honesty**
- Use only 3 text sizes per screen
- Primary CTA must be visually dominant
- Group related items with proximity
- **Why**: Clear hierarchy suggests organized thinking. Users trust organized brands.

#### 4. **Subtle Animations = Quality**
- 200-300ms transitions (not instant, not slow)
- Ease-out for entrances, ease-in for exits
- Lift buttons/cards on hover (2-4px)
- **Why**: Smooth interactions feel expensive. Janky = amateur.

#### 5. **Real Imagery > Stock Photos**
- Show actual cars, actual team, actual locations
- Avoid generic stock images
- Use photos with real lighting (not overly edited)
- **Why**: Stock photos = generic = untrustworthy. Real = authentic.

#### 6. **Accessibility = Inclusivity = Trust**
- 4.5:1 contrast minimum for text
- Focus states on all interactive elements
- Labels on all form fields
- **Why**: Accessible design shows you care about all users, not just majority.

### Micro-Interactions for Trust

#### **Loading States**
```css
.skeleton {
  background: linear-gradient(
    90deg, 
    var(--color-slate-100) 0%,
    var(--color-slate-50) 50%,
    var(--color-slate-100) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```
**Why**: Never show blank screens. Skeletons signal "we're working on it" = respectful of user time.

#### **Success States**
```css
.success-checkmark {
  animation: checkmarkDraw 0.4s ease forwards;
}

@keyframes checkmarkDraw {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```
**Why**: Celebrate positive actions. Confirms success clearly.

#### **Error States**
```css
.error-shake {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```
**Why**: Gentle error feedback. Not aggressive, but clear something needs attention.

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. Implement color system in CSS variables
2. Set up typography scale
3. Update spacing to 4px system
4. Create button component library

### Phase 2: Components (Week 2)
1. Rebuild cards with new styles
2. Update form inputs
3. Create badge system
4. Implement shadows and hover states

### Phase 3: Polish (Week 3)
1. Add micro-interactions
2. Implement loading states
3. Add glass morphism where appropriate
4. Final accessibility audit

---

## Measuring Success

### Trust Metrics to Track
- **Bounce rate**: Should decrease (users stay longer)
- **Time on page**: Should increase (exploring, not confused)
- **Conversion rate**: More sign-ups, inquiries
- **Return visitors**: Trust brings people back
- **Net Promoter Score**: "Would you recommend?"

### Design Quality Indicators
- All interactive elements have hover states ✓
- All colors from defined palette ✓
- All spacing in 4px increments ✓
- All text passes WCAG AA contrast ✓
- All animations under 300ms ✓

---

## Resources

### Design Tools
- **Figma**: Full design system available (request access)
- **Tailwind Config**: CSS implementation ready
- **Component Library**: React components with TypeScript

### References
- [Apple Human Interface Guidelines](https://developer.apple.com/design/)
- [Material Design 3](https://m3.material.io/)
- [Stripe Design System](https://stripe.com/docs/design)

---

**Last Updated**: June 23, 2026  
**Version**: 1.0  
**Maintained by**: TrustedCars Design Team  
**Questions?**: Contact design@trustedcars.com
