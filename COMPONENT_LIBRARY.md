# TrustedCars Component Library
**Design System v1.0 - Implementation Guide**

> This guide shows how to implement each component using the design system. All examples use Tailwind classes based on our custom configuration.

---

## Table of Contents
1. [Buttons](#buttons)
2. [Cards](#cards)
3. [Badges](#badges)
4. [Forms](#forms)
5. [Navigation](#navigation)
6. [Trust Elements](#trust-elements)
7. [Content Sections](#content-sections)

---

## Buttons

### Primary CTA
**Use for**: Main actions, conversions (Buy, Sign Up, Search)

```jsx
<button className="
  font-display font-bold text-base
  px-8 py-4 
  rounded-full
  bg-gradient-success
  text-white
  shadow-success
  transition-all duration-base
  hover:shadow-success-lg hover:-translate-y-0.5
  active:translate-y-0
  focus-visible:ring-4 focus-visible:ring-success-500/20
  disabled:opacity-50 disabled:cursor-not-allowed
  tracking-wide
">
  Find Your Dream Car
</button>
```

**Why this builds trust**:
- Pill shape is friendly, not aggressive
- Gradient creates premium feel
- Lift on hover confirms clickability
- Focus ring for accessibility (keyboard users)
- Disabled state prevents confusion

---

### Secondary CTA
**Use for**: Alternative actions (Learn More, Cancel, Back)

```jsx
<button className="
  font-display font-semibold text-base
  px-8 py-4
  rounded-full
  bg-white
  text-slate-700
  border-2 border-slate-200
  shadow-sm
  transition-all duration-base
  hover:border-primary-600 hover:text-primary-700 hover:bg-primary-50
  focus-visible:ring-4 focus-visible:ring-primary-500/20
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Learn More
</button>
```

**Why this builds trust**:
- Clear visual hierarchy (less prominent than primary)
- Hover state shows interactivity without competing
- Border creates defined boundary

---

### Text Link Button
**Use for**: Tertiary actions, inline links

```jsx
<button className="
  font-body font-medium text-sm
  text-primary-600
  underline underline-offset-4
  transition-colors duration-fast
  hover:text-primary-700 hover:decoration-2
  focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:rounded
">
  View full details
</button>
```

---

### Icon Button
**Use for**: Navigation, tools, actions with clear icon meaning

```jsx
<button className="
  w-10 h-10
  flex items-center justify-center
  rounded-lg
  text-slate-600
  hover:text-primary-600 hover:bg-primary-50
  transition-colors duration-base
  focus-visible:ring-4 focus-visible:ring-primary-500/20
" aria-label="Add to wishlist">
  <HeartIcon className="w-5 h-5" />
</button>
```

**Why this builds trust**:
- `aria-label` for accessibility
- Clear hover state shows purpose
- Adequate touch target (40px minimum)

---

## Cards

### Standard Card
**Use for**: Car listings, content blocks, general containers

```jsx
<div className="
  bg-white
  rounded-xl
  border border-slate-200
  p-6
  shadow-sm
  transition-all duration-slow
  hover:shadow-lg hover:-translate-y-1 hover:border-slate-300
  group
">
  {/* Card content */}
  <img src="..." alt="..." className="rounded-lg mb-4 group-hover:scale-[1.02] transition-transform duration-slow" />
  <h3 className="font-display font-bold text-xl text-slate-900 mb-2">Honda City 2021</h3>
  <p className="text-slate-600 text-sm mb-4">25,000 km • Petrol • Manual</p>
  <div className="flex items-center justify-between">
    <span className="font-display font-bold text-2xl text-primary-800">₹12.5L</span>
    <button className="text-sm font-semibold text-primary-600 hover:text-primary-700">View Details →</button>
  </div>
</div>
```

**Trust elements**:
- White background = clean, premium
- Subtle shadow = elevation without heaviness
- Lift on hover = interactive feedback
- Image scales slightly on hover = visual interest
- `group` utility allows coordinated hover effects

---

### Premium/Featured Card
**Use for**: Sponsored listings, premium inventory, featured content

```jsx
<div className="
  relative overflow-hidden
  bg-gradient-premium-card
  rounded-2xl
  border-2 border-amber-500
  p-8
  shadow-amber
  transition-all duration-slow
  hover:shadow-amber-lg hover:-translate-y-1
">
  {/* Premium corner accent */}
  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-amber opacity-20 rounded-bl-full"></div>
  
  {/* Premium badge */}
  <div className="absolute top-4 right-4">
    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-amber text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
      <StarIcon className="w-3.5 h-3.5" />
      Featured
    </span>
  </div>

  {/* Card content */}
  <div className="relative z-10">
    {/* Content here */}
  </div>
</div>
```

**Trust elements**:
- Warm gradient signals premium (not default blue)
- Corner accent adds luxury detail
- Thicker border = visual importance
- Badge clearly communicates status

---

### Glass Card (Modern)
**Use for**: Hero overlays, floating elements, modern aesthetic sections

```jsx
<div className="
  glass
  rounded-2xl
  p-6
  shadow-lg
">
  {/* Content with glassmorphism effect */}
  <h3 className="font-display font-bold text-lg text-slate-900">Instant Valuation</h3>
  <p className="text-slate-700 text-sm mt-2">Get your car's value in 60 seconds</p>
</div>
```

**Why this builds trust**:
- Modern, tech-forward aesthetic
- Transparency suggests honesty
- Premium iOS/macOS feel

---

## Badges

### Trust/Verification Badge
**Use for**: Certified, Verified, Inspected indicators

```jsx
<span className="
  inline-flex items-center gap-2
  px-4 py-2
  bg-success-50
  border border-success-600
  rounded-full
  font-display font-bold text-xs
  text-success-700
  uppercase tracking-wider
">
  <CheckCircleIcon className="w-4 h-4" />
  200-Point Certified
</span>
```

**Trust elements**:
- Green = verified, safe
- Icon + text = reinforcement
- ALL CAPS + wide tracking = official, authoritative
- Pill shape = badge-like

---

### Premium Badge
**Use for**: Featured, Hot Deal, Exclusive

```jsx
<span className="
  inline-flex items-center gap-2
  px-4 py-2
  bg-gradient-amber
  rounded-full
  font-display font-bold text-xs
  text-white
  uppercase tracking-widest
  shadow-amber
">
  <StarIcon className="w-4 h-4" />
  Premium
</span>
```

---

### Info Badge
**Use for**: New, Updated, labels

```jsx
<span className="
  inline-flex items-center
  px-3 py-1
  bg-ice-100
  border border-ice-500
  rounded-full
  font-body font-medium text-xs
  text-primary-700
">
  New Arrival
</span>
```

---

## Forms

### Text Input
**Use for**: All text entry fields

```jsx
<div className="space-y-2">
  <label htmlFor="email" className="block font-body font-medium text-sm text-slate-700">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="
      w-full
      font-body font-medium text-base
      px-4 py-3.5
      border-2 border-slate-200
      rounded-lg
      bg-white
      text-slate-900
      placeholder:text-slate-400 placeholder:font-normal
      transition-all duration-base
      focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10
      disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
    "
  />
  <p className="text-xs text-slate-500 leading-relaxed">We'll never share your email</p>
</div>
```

**Trust elements**:
- Clear label with `htmlFor` (accessibility)
- Thicker border (2px) = substantial, well-made
- Focus ring = clear feedback
- Placeholder guidance
- Helper text reassures privacy
- Disabled state prevents confusion

---

### Search Bar (Hero)
**Use for**: Main search, hero section

```jsx
<form className="
  flex items-center gap-4
  bg-white
  border-2 border-white/90
  rounded-full
  p-3
  shadow-2xl
  transition-all duration-slow
  focus-within:shadow-primary-lg focus-within:scale-[1.01]
">
  <SearchIcon className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
  
  <input
    type="text"
    placeholder="Search make, model, or keyword..."
    className="
      flex-1
      font-body font-medium text-lg
      py-3 px-2
      bg-transparent
      text-slate-900
      placeholder:text-slate-400
      outline-none
    "
  />
  
  <div className="h-10 w-px bg-slate-200"></div>
  
  <MapPinIcon className="w-6 h-6 text-slate-400 shrink-0" />
  
  <select className="
    w-64
    font-body font-medium text-lg
    py-3 px-2
    bg-transparent
    text-slate-700
    outline-none
    cursor-pointer
    appearance-none
  ">
    <option>All Cities</option>
    <option>Mumbai</option>
    <option>Delhi</option>
  </select>
  
  <button
    type="submit"
    className="
      font-display font-bold text-lg
      px-10 py-4
      bg-gradient-success
      text-white
      rounded-full
      shadow-success
      transition-all duration-base
      hover:shadow-success-lg
      whitespace-nowrap
      tracking-wide
    "
  >
    Search Cars
  </button>
</form>
```

**Trust elements**:
- Pill shape = modern, friendly
- Heavy shadow = hero prominence
- Scale on focus = engagement confirmation
- Clear sections (divider line)
- Icons aid recognition

---

### Select Dropdown
**Use for**: Dropdown selections

```jsx
<div className="relative">
  <label htmlFor="city" className="block font-body font-medium text-sm text-slate-700 mb-2">
    City
  </label>
  <select
    id="city"
    className="
      w-full
      font-body font-medium text-base
      px-4 py-3.5
      pr-10
      border-2 border-slate-200
      rounded-lg
      bg-white
      text-slate-900
      appearance-none
      cursor-pointer
      transition-all duration-base
      focus:outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10
    "
  >
    <option>Select city</option>
    <option>Mumbai</option>
    <option>Delhi</option>
  </select>
  <ChevronDownIcon className="absolute right-4 top-[42px] w-5 h-5 text-slate-400 pointer-events-none" />
</div>
```

---

### Checkbox
**Use for**: Boolean selections, agreements

```jsx
<label className="flex items-start gap-3 cursor-pointer group">
  <input
    type="checkbox"
    className="
      w-5 h-5 mt-0.5
      border-2 border-slate-300
      rounded
      text-primary-600
      focus:ring-4 focus:ring-primary-500/20
      transition-all duration-base
      cursor-pointer
    "
  />
  <span className="font-body text-sm text-slate-700 leading-relaxed group-hover:text-slate-900">
    I agree to the <a href="#" className="text-primary-600 underline hover:text-primary-700">Terms of Service</a> and <a href="#" className="text-primary-600 underline hover:text-primary-700">Privacy Policy</a>
  </span>
</label>
```

**Trust elements**:
- Adequate touch target (20px)
- Links to terms/privacy (transparency)
- Hover feedback on entire label
- Focus ring for accessibility

---

## Navigation

### Header/Navbar
**Use for**: Top navigation

```jsx
<nav className="
  fixed top-0 left-0 right-0 z-fixed
  bg-white/90 backdrop-blur-md
  border-b border-slate-200
  shadow-sm
">
  <div className="max-w-container-xl mx-auto px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-primary-800 rounded-lg flex items-center justify-center group-hover:bg-primary-700 transition-colors shadow-sm">
          <CarIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-display font-bold text-slate-900 text-lg leading-none tracking-tight">
            TrustedCars
          </span>
          <div className="text-[10px] text-primary-800/80 leading-none font-medium tracking-wide">
            Premium Pre-Owned
          </div>
        </div>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-8">
        <Link to="/cars" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
          Browse Cars
        </Link>
        <Link to="/sell" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
          Sell Your Car
        </Link>
        <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
          About Us
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors px-4 py-2">
          Sign In
        </Link>
        <Link to="/register" className="
          text-sm font-bold
          bg-primary-800 hover:bg-primary-700
          text-white
          px-6 py-2.5
          rounded-full
          shadow-sm shadow-primary
          transition-all
          hover:-translate-y-0.5
        ">
          Get Started
        </Link>
      </div>
    </div>
  </div>
</nav>
```

**Trust elements**:
- Fixed position = always accessible
- Blur effect = premium, modern
- Clear hierarchy (logo → nav → actions)
- Tagline reinforces brand positioning
- CTA stands out without being aggressive

---

## Trust Elements

### Stats/Numbers Section
**Use for**: Social proof, metrics

```jsx
<section className="py-16 bg-primary-50 border-y border-primary-100">
  <div className="max-w-container-xl mx-auto px-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      
      {/* Stat Item */}
      <div className="space-y-2">
        <div className="font-display font-extrabold text-4xl text-primary-800 tracking-tight">
          50,000+
        </div>
        <div className="text-sm font-medium text-slate-600 tracking-wide">
          Happy Customers
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-display font-extrabold text-4xl text-primary-800 tracking-tight">
          ₹450Cr+
        </div>
        <div className="text-sm font-medium text-slate-600 tracking-wide">
          Cars Sold
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-display font-extrabold text-4xl text-primary-800 tracking-tight">
          4.8★
        </div>
        <div className="text-sm font-medium text-slate-600 tracking-wide">
          Average Rating
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-display font-extrabold text-4xl text-primary-800 tracking-tight">
          12,500+
        </div>
        <div className="text-sm font-medium text-slate-600 tracking-wide">
          Certified Cars
        </div>
      </div>

    </div>
  </div>
</section>
```

**Trust elements**:
- Large numbers = confidence
- Even grid = organized, legitimate
- Specific numbers (not rounded) = authentic
- Star rating = social proof

---

### Trust Badge Grid
**Use for**: Below hero, trust section

```jsx
<section className="py-12 bg-white border-b border-slate-200">
  <div className="max-w-container-xl mx-auto px-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* Trust Item */}
      <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
        <div className="shrink-0 p-3 bg-success-100 rounded-xl">
          <CheckCircleIcon className="w-6 h-6 text-success-600" />
        </div>
        <div>
          <div className="font-display font-bold text-base text-slate-900 mb-1">
            200-Point Inspection
          </div>
          <div className="text-sm text-slate-600 leading-relaxed">
            Every car thoroughly verified by certified mechanics
          </div>
        </div>
      </div>

      {/* Repeat for other trust items */}
      
    </div>
  </div>
</section>
```

**Trust elements**:
- Icons in colored backgrounds = visual anchors
- Specific claim (200-point) = credible
- Descriptive subtitle = transparency
- Subtle hover = interactive feel

---

### Testimonial Card
**Use for**: Customer reviews, social proof

```jsx
<div className="
  bg-white
  rounded-2xl
  border border-slate-200
  p-8
  shadow-sm
">
  {/* Star Rating */}
  <div className="flex gap-1 mb-4">
    {[1,2,3,4,5].map(i => (
      <StarIcon key={i} className="w-5 h-5 text-amber-500 fill-current" />
    ))}
  </div>

  {/* Quote */}
  <p className="text-slate-700 text-base leading-relaxed mb-6">
    "Best car buying experience ever. The inspection report was thorough, pricing was transparent, and the entire process took just 3 days. Highly recommended!"
  </p>

  {/* Author */}
  <div className="flex items-center gap-4">
    <img
      src="..."
      alt="Rajesh Kumar"
      className="w-12 h-12 rounded-full border-2 border-slate-200"
    />
    <div>
      <div className="font-display font-bold text-sm text-slate-900">
        Rajesh Kumar
      </div>
      <div className="text-xs text-slate-500">
        Bought Honda City · Mumbai
      </div>
    </div>
  </div>

  {/* Verification Badge */}
  <div className="mt-4 pt-4 border-t border-slate-100">
    <span className="inline-flex items-center gap-2 text-xs text-success-700 font-medium">
      <CheckCircleIcon className="w-4 h-4" />
      Verified Purchase
    </span>
  </div>
</div>
```

**Trust elements**:
- Star rating = quantifiable feedback
- Real name + photo = authenticity
- Specific details (car model, location) = credible
- "Verified Purchase" badge = legitimacy

---

## Content Sections

### Hero Section (Updated Design)
**Use for**: Homepage hero

```jsx
<section className="relative min-h-[90vh] flex items-center overflow-hidden">
  {/* Background Gradient */}
  <div className="absolute inset-0 bg-gradient-hero-primary"></div>
  
  {/* Subtle Pattern Overlay */}
  <div className="absolute inset-0 opacity-5" style={{
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  }}></div>

  <div className="relative w-full max-w-container-xl mx-auto px-6 lg:px-8 py-24 z-10">
    <div className="max-w-4xl mx-auto text-center">
      
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-8 backdrop-blur-md">
        <ShieldCheckIcon className="w-4 h-4 text-success-500" />
        <span className="text-sm text-white font-bold tracking-wide uppercase">
          Certified & Verified Platform
        </span>
      </div>

      {/* Headline */}
      <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6 tracking-tight">
        India's Most Trusted<br />
        <span className="text-ice-500">Car Marketplace</span>
      </h1>
      
      {/* Subtitle */}
      <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto font-body font-medium">
        Every vehicle verified with 200-point inspection. Transparent pricing. Comprehensive warranty. Your dream car awaits.
      </p>

      {/* Search Bar - see Forms section */}
      {/* ... */}

      {/* Quick Links */}
      <div className="flex flex-wrap justify-center gap-4 mt-10">
        {['Under ₹5L', 'Premium SUVs', 'Electric Vehicles', 'Certified Pre-Owned'].map(label => (
          <button
            key={label}
            className="text-sm font-semibold text-white/90 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 px-5 py-2.5 rounded-full transition-all backdrop-blur-sm"
          >
            {label}
          </button>
        ))}
      </div>

    </div>
  </div>

  {/* Floating Stats (optional) */}
  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6">
    <div className="glass-dark rounded-2xl p-6">
      <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
        <div>
          <div className="font-display font-extrabold text-3xl text-white">50K+</div>
          <div className="text-xs text-white/80 font-medium mt-1">Happy Customers</div>
        </div>
        <div>
          <div className="font-display font-extrabold text-3xl text-white">4.8★</div>
          <div className="text-xs text-white/80 font-medium mt-1">Average Rating</div>
        </div>
        <div>
          <div className="font-display font-extrabold text-3xl text-white">12.5K+</div>
          <div className="text-xs text-white/80 font-medium mt-1">Certified Cars</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**Trust improvements**:
- Lighter gradient (vs. current dark one)
- Removed noisy background image
- Badge says "Certified" not "Enterprise"
- Floating stats show social proof immediately
- Glass card effect = modern, premium

---

## Usage Guidelines

### Do's ✅
- **Use consistent spacing** (always 4px increments)
- **Maintain color hierarchy** (primary for brand, success for action, amber for premium)
- **Add hover states** to all interactive elements
- **Include focus states** for accessibility
- **Use semantic HTML** (button for actions, a for links)
- **Provide alt text** for images
- **Add loading states** for async actions

### Don'ts ❌
- **Don't use arbitrary colors** outside the design system
- **Don't skip hover/focus states** (feels broken)
- **Don't use tiny text** (minimum 12px)
- **Don't use low contrast** (WCAG AA minimum: 4.5:1)
- **Don't over-animate** (subtle is premium)
- **Don't use vague CTAs** ("Click here" → "View car details")

---

## Accessibility Checklist

Every component should:
- [ ] Pass WCAG AA contrast (4.5:1 text, 3:1 UI)
- [ ] Have focus indicators (ring, outline, etc.)
- [ ] Support keyboard navigation (tab, enter, escape)
- [ ] Include ARIA labels where needed
- [ ] Have adequate touch targets (44x44px minimum)
- [ ] Work with screen readers
- [ ] Support reduced motion preferences

---

## Performance Guidelines

- **Lazy load images** below the fold
- **Use WebP format** with fallbacks
- **Minimize animations** on low-end devices
- **Debounce search inputs** (300ms)
- **Show skeleton loaders** during fetch
- **Optimize font loading** (font-display: swap)

---

**Questions?** Refer to the main Design System document or contact the design team.
