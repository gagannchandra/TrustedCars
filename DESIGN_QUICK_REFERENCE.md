# TrustedCars Design System - Quick Reference
**Cheat sheet for developers**

---

## Color Palette

### Primary Actions & Brand
```
bg-primary-800     #0B3A6E  Main brand color
bg-primary-600     #1E5AA8  Interactive elements
bg-primary-50      #F5FAFF  Light backgrounds
```

### Success & CTAs
```
bg-success-600     #10B981  Primary buttons, checkmarks
bg-success-100     #D1FAE5  Success backgrounds
text-success-700   #059669  Success text
```

### Premium/Featured
```
bg-amber-500       #F59E0B  Premium badges
bg-amber-100       #FEF3C7  Premium backgrounds
```

### Neutrals
```
text-slate-900     #0F172A  Primary text
text-slate-700     #334155  Body text
text-slate-600     #475569  Secondary text
text-slate-400     #94A3B8  Disabled/placeholder
bg-slate-50        #F8FAFC  Page background
border-slate-200   #E2E8F0  Default borders
```

---

## Typography

### Font Families
```jsx
font-display    // Headings, buttons (Manrope)
font-body       // Body text, forms (Inter)
font-mono       // Code (JetBrains Mono)
```

### Common Text Sizes
```jsx
text-xs         // 12px - Labels, captions
text-sm         // 14px - Secondary text
text-base       // 16px - Body text (default)
text-lg         // 18px - Emphasized body
text-xl         // 20px - Small headings
text-2xl        // 24px - Section headings
text-4xl        // 36px - Page titles
text-7xl        // 72px - Hero headlines
```

### Font Weights
```jsx
font-normal     // 400 - Body text
font-medium     // 500 - Emphasis
font-semibold   // 600 - Buttons
font-bold       // 700 - Headings
font-extrabold  // 800 - Hero only
```

---

## Spacing

### Most Common
```jsx
p-4    // 16px - Base padding
p-6    // 24px - Card padding
p-8    // 32px - Section padding
py-12  // 48px - Between sections
py-16  // 64px - Large sections
py-24  // 96px - Hero sections

gap-4  // 16px - Common gap
gap-6  // 24px - Larger gap
```

### Margins
```jsx
mb-2   // 8px  - Small bottom margin
mb-4   // 16px - Default bottom margin
mb-6   // 24px - Card spacing
mb-8   // 32px - Section spacing
```

---

## Layout

### Container Widths
```jsx
max-w-container-xl    // 1280px - Recommended default
max-w-container-lg    // 1024px - Narrow content
max-w-container-2xl   // 1440px - Wide layouts
```

### Padding
```jsx
px-6 lg:px-8          // Horizontal page padding
py-24                 // Vertical section padding
```

---

## Border Radius

```jsx
rounded-lg      // 12px - Cards, buttons
rounded-xl      // 16px - Large cards
rounded-2xl     // 24px - Featured cards
rounded-full    // Pills, badges, avatars
```

---

## Shadows

```jsx
shadow-sm       // Subtle elevation
shadow-md       // Default cards
shadow-lg       // Hover states
shadow-xl       // Modals, popovers
shadow-success  // Green CTA buttons
shadow-primary  // Blue elements
```

---

## Common Component Patterns

### Primary Button
```jsx
<button className="
  font-display font-bold
  px-8 py-4 
  rounded-full
  bg-gradient-success text-white
  shadow-success
  hover:shadow-success-lg hover:-translate-y-0.5
  transition-all duration-base
">
  Click Me
</button>
```

### Card
```jsx
<div className="
  bg-white 
  rounded-xl 
  border border-slate-200 
  p-6 
  shadow-sm
  hover:shadow-lg hover:-translate-y-1
  transition-all duration-slow
">
  {/* Content */}
</div>
```

### Input
```jsx
<input className="
  w-full
  px-4 py-3.5
  border-2 border-slate-200
  rounded-lg
  font-body font-medium
  focus:border-primary-600 focus:ring-4 focus:ring-primary-500/10
  transition-all duration-base
" />
```

### Badge
```jsx
<span className="
  inline-flex items-center gap-2
  px-4 py-2
  bg-success-50 border border-success-600
  rounded-full
  font-display font-bold text-xs
  text-success-700
  uppercase tracking-wider
">
  <CheckIcon className="w-4 h-4" />
  Certified
</span>
```

---

## Gradients

```jsx
bg-gradient-hero-primary     // Dark blue hero
bg-gradient-hero-light       // Light blue hero
bg-gradient-success          // Green buttons
bg-gradient-amber            // Premium badges
bg-gradient-premium-card     // Featured card bg
```

---

## Animations

```jsx
transition-all duration-base    // 200ms - Default
transition-all duration-slow    // 300ms - Cards
hover:-translate-y-1            // Lift effect
hover:scale-[1.02]              // Subtle scale

// Classes
animate-fade-in-up              // Entrance
animate-shimmer                 // Loading
animate-pulse                   // Attention
```

---

## Z-Index Layers

```jsx
z-base             // 0   - Default
z-dropdown         // 100 - Dropdowns
z-sticky           // 200 - Sticky headers
z-fixed            // 300 - Fixed nav
z-modal-backdrop   // 400 - Modal backdrop
z-modal            // 500 - Modal content
z-tooltip          // 700 - Tooltips
```

---

## Responsive Breakpoints

```jsx
sm:   // 640px
md:   // 768px
lg:   // 1024px
xl:   // 1280px
2xl:  // 1536px

// Example
<h1 className="text-4xl sm:text-5xl lg:text-7xl">
  Responsive Heading
</h1>
```

---

## Grid Layouts

```jsx
// 4-column grid (responsive)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Items */}
</div>

// 3-column grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items */}
</div>

// Auto-fit grid (cards)
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
  {/* Cards auto-arrange */}
</div>
```

---

## Focus States (Accessibility)

Always add focus states:

```jsx
focus:outline-none 
focus:ring-4 
focus:ring-primary-500/20
focus:border-primary-600
```

For links:
```jsx
focus-visible:ring-2 
focus-visible:ring-primary-500/30 
focus-visible:rounded
```

---

## Trust-Building Patterns

### Show Loading States
```jsx
<div className="skeleton h-48 w-full"></div>
```

### Add Hover Feedback
```jsx
hover:shadow-lg hover:-translate-y-1 transition-all
```

### Use Specific Numbers
```jsx
// ✅ Good
<span>50,247 customers</span>

// ❌ Bad
<span>50K+ customers</span>
```

### Include Verification
```jsx
<div className="flex items-center gap-2 text-success-700">
  <CheckCircleIcon className="w-4 h-4" />
  <span className="text-xs font-medium">Verified Purchase</span>
</div>
```

---

## Performance Tips

### Lazy Load Images
```jsx
<img 
  src="..." 
  alt="..." 
  loading="lazy"
  className="transition-opacity duration-300"
/>
```

### Debounce Search
```jsx
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);
```

### Skeleton While Loading
```jsx
{isLoading ? (
  <div className="skeleton h-64 w-full"></div>
) : (
  <CarCard data={data} />
)}
```

---

## Common Mistakes to Avoid

### ❌ Don't Do
```jsx
// Random colors
<button className="bg-blue-500">

// No hover state
<button className="bg-primary">

// Tiny text
<p className="text-[11px]">

// Low contrast
<span className="text-gray-400">Text</span> // on white

// Vague CTA
<button>Click Here</button>
```

### ✅ Do This
```jsx
// System colors
<button className="bg-primary-800">

// Always hover
<button className="bg-primary-800 hover:bg-primary-700 transition-colors">

// Minimum 12px
<p className="text-xs">  // 12px

// WCAG AA compliant
<span className="text-slate-700">Text</span>

// Specific CTA
<button>View Car Details</button>
```

---

## Code Snippets

### Section Container
```jsx
<section className="py-16 bg-white">
  <div className="max-w-container-xl mx-auto px-6 lg:px-8">
    {/* Content */}
  </div>
</section>
```

### Centered Content
```jsx
<div className="text-center max-w-3xl mx-auto">
  <h2 className="font-display font-bold text-4xl text-slate-900 mb-4">
    Heading
  </h2>
  <p className="text-lg text-slate-600 leading-relaxed">
    Description text
  </p>
</div>
```

### Feature Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {features.map(feature => (
    <div key={feature.id} className="text-center">
      <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <feature.icon className="w-8 h-8 text-primary-600" />
      </div>
      <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
        {feature.title}
      </h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>
  ))}
</div>
```

---

## Testing Checklist

Before committing:
- [ ] All interactive elements have hover states
- [ ] Focus states work (tab through page)
- [ ] Colors from design system only
- [ ] Spacing in 4px increments
- [ ] Text contrast passes WCAG AA (use contrast checker)
- [ ] Works on mobile (test at 375px width)
- [ ] Images have alt text
- [ ] Buttons use semantic `<button>` (not `<div>`)

---

## Resources

- **Full Design System**: `/DESIGN_SYSTEM.md`
- **Component Library**: `/COMPONENT_LIBRARY.md`
- **CSS Variables**: `/frontend/src/styles/design-system.css`
- **Tailwind Config**: `/frontend/tailwind.config.example.js`

---

**Pro Tip**: Copy this file to your `.kiro/steering/` folder to have design guidance in every chat session!
