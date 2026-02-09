# Design System

Visual design guidelines for maintaining consistency across Tandava.

---

## Brand Identity

### Philosophy

Tandava represents the cosmic dance of creation and transformation. Our design should feel:
- **Grounded** - Reliable, trustworthy, professional
- **Flowing** - Organic, natural, not rigid
- **Warm** - Welcoming, approachable, human
- **Clear** - Easy to understand, no confusion

### Visual Metaphors

- Breath and flow (curved elements, transitions)
- Earth and nature (sage green, warm neutrals)
- Light and energy (gold accents, luminosity)

---

## Color Palette

### Primary Colors

```css
/* Primary - Gold/Yellow */
--primary: #D4A72C;           /* Main brand color */
--primary-foreground: #FFFFFF; /* Text on primary */

/* Background tones */
--background: #FAF8F5;        /* Warm off-white */
--foreground: #1A1A1A;        /* Near-black text */
--muted: #F5F3F0;             /* Subtle background */
--muted-foreground: #6B7280;  /* Secondary text */
```

### Accent Colors

```css
/* Semantic accents */
--accent-sage: #A8B5A2;       /* Success, nature, calm */
--accent-lilac: #C4B7D1;      /* Virtual, digital, zen */
--accent-coral: #E8998D;      /* Heated, warning, energy */
--accent-gold: #D4A72C;       /* Highlight, special */
--accent-peach: #F5D5C8;      /* Soft accent, gentle */

/* Status colors */
--success: var(--accent-sage);
--warning: #F59E0B;           /* Amber */
--error: #EF4444;             /* Red */
--info: var(--accent-lilac);
```

### Color Usage

| Element | Color | Usage |
|---------|-------|-------|
| Primary buttons | `primary` | Main actions (Book, Save) |
| Secondary buttons | `muted` | Secondary actions |
| Destructive buttons | `destructive` | Delete, cancel membership |
| Success states | `accent-sage` | Confirmations, completed |
| Virtual/live badges | `accent-lilac` | Online classes |
| Heated class badges | `accent-coral` | Hot yoga indicator |
| Highlight text | `accent-gold` | Important info |

### Dark Mode

```css
/* Dark mode overrides */
.dark {
  --background: #0F0A14;       /* Deep purple-black */
  --foreground: #FAF8F5;       /* Light text */
  --muted: #1A1520;            /* Dark surface */
  --muted-foreground: #A0A0A0; /* Muted text */
}
```

---

## Typography

### Font Stack

```css
/* Primary - Display headings */
font-family: 'Cinzel', serif;
/* Usage: Page titles, section headers */

/* Secondary - Body headings */
font-family: 'Cormorant Garamond', serif;
/* Usage: Card titles, elegant labels */

/* Tertiary - Body text */
font-family: 'DM Sans', system-ui, sans-serif;
/* Usage: Body text, UI elements */
```

### Type Scale

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| `display` | 48px | 500 | Hero headings |
| `h1` | 32px | 600 | Page titles |
| `h2` | 24px | 600 | Section titles |
| `h3` | 20px | 600 | Card titles |
| `h4` | 16px | 600 | Subsection titles |
| `body` | 16px | 400 | Body text |
| `small` | 14px | 400 | Secondary text |
| `xs` | 12px | 400 | Labels, captions |

### Text Styling

```typescript
// Tailwind classes
<h1 className="text-2xl font-bold tracking-tight">Page Title</h1>
<h2 className="text-xl font-semibold">Section Title</h2>
<p className="text-base text-muted-foreground">Body text</p>
<span className="text-sm text-muted-foreground">Small text</span>
```

---

## Spacing

### Scale

```css
/* Spacing scale (4px base) */
--space-1: 4px;   /* Tight */
--space-2: 8px;   /* Compact */
--space-3: 12px;  /* Default */
--space-4: 16px;  /* Comfortable */
--space-5: 20px;  /* Relaxed */
--space-6: 24px;  /* Spacious */
--space-8: 32px;  /* Generous */
--space-10: 40px; /* Very spacious */
--space-12: 48px; /* Section breaks */
```

### Usage Patterns

```typescript
// Card padding
<Card className="p-4 sm:p-6">  {/* 16px mobile, 24px desktop */}

// Section spacing
<section className="space-y-6">  {/* 24px between items */}

// Grid gaps
<div className="grid gap-4">  {/* 16px gaps */}

// Component internal spacing
<div className="space-y-2">  {/* 8px between elements */}
```

---

## Components

### Buttons

```typescript
// Primary - Main actions
<Button>Book Class</Button>

// Secondary - Alternative actions
<Button variant="outline">View Details</Button>

// Tertiary - Subtle actions
<Button variant="ghost">Cancel</Button>

// Destructive - Dangerous actions
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With icon
<Button>
  <Calendar className="mr-2 h-4 w-4" />
  Schedule
</Button>

// Loading state
<Button disabled>
  <Loader className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>
```

### Cards

```typescript
// Standard card
<Card className="p-6">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>

// Interactive card
<Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
  {/* Clickable content */}
</Card>
```

### Badges

```typescript
// Status badges
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>

// Custom color badges
<Badge variant="mint">Active</Badge>      {/* Green */}
<Badge variant="coral">Heated</Badge>     {/* Red/orange */}
<Badge variant="lilac">Virtual</Badge>    {/* Purple */}
<Badge variant="class">Class</Badge>      {/* Primary */}
```

### Form Elements

```typescript
// Input with label
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// Input with icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input className="pl-10" placeholder="Search..." />
</div>

// Select
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>
```

---

## Layout Patterns

### Page Structure

```typescript
// Member-facing page
<AppLayout>
  <div className="space-y-6">
    {/* Page header */}
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Page Title</h1>
      <p className="text-muted-foreground mt-1">Page description</p>
    </div>

    {/* Page content */}
    <div className="grid gap-6">
      {/* ... */}
    </div>
  </div>
</AppLayout>

// Admin page
<ManageLayout>
  <div className="space-y-6">
    {/* Similar structure */}
  </div>
</ManageLayout>
```

### Responsive Grid

```typescript
// 1-2-3 column responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>

// 2-column with sidebar
<div className="grid lg:grid-cols-[1fr_300px] gap-6">
  <main>{/* Main content */}</main>
  <aside>{/* Sidebar */}</aside>
</div>

// Dashboard stats row
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map(stat => <StatCard key={stat.label} />)}
</div>
```

### Mobile-First Breakpoints

```typescript
// Tailwind breakpoints
// sm: 640px   - Large phones, small tablets
// md: 768px   - Tablets
// lg: 1024px  - Small laptops
// xl: 1280px  - Desktops
// 2xl: 1536px - Large desktops

// Pattern: Start mobile, add complexity
<div className="
  flex flex-col      // Mobile: stack vertically
  sm:flex-row        // Tablet+: side by side
  gap-4 sm:gap-6     // Smaller gap on mobile
  p-4 sm:p-6         // Less padding on mobile
">
```

---

## Animation

### Transitions

```typescript
// Standard transition
<div className="transition-colors duration-200">

// Hover effects
<Card className="transition-shadow hover:shadow-lg">

// Transform transitions
<Button className="transition-transform hover:scale-105">
```

### Loading States

```typescript
// Spinner
<Loader className="h-4 w-4 animate-spin" />

// Skeleton loading
<div className="animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4" />
</div>

// Pulsing indicator
<div className="relative">
  <span className="absolute -top-1 -right-1 flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
  </span>
</div>
```

---

## Icons

### Icon Library

We use [Lucide React](https://lucide.dev/) for icons.

```typescript
import {
  Calendar, Clock, MapPin,          // Scheduling
  Users, User, UserPlus,            // People
  CreditCard, DollarSign, Receipt,  // Payments
  Settings, Menu, MoreHorizontal,   // UI
  Check, X, AlertCircle, Info,      // Status
  ChevronRight, ArrowLeft, ExternalLink, // Navigation
} from 'lucide-react';
```

### Icon Sizing

```typescript
// In buttons and inline
<Calendar className="h-4 w-4" />

// In cards and lists
<Calendar className="h-5 w-5" />

// Feature icons
<Calendar className="h-6 w-6" />

// Hero icons
<Calendar className="h-8 w-8" />
```

---

## Role-Specific Design

### Member Experience

- **Warmth**: Softer colors, friendly tone
- **Simplicity**: Minimal options, clear paths
- **Encouragement**: Celebrate achievements
- **Trust**: Clear pricing, no surprises

### Instructor Experience

- **Efficiency**: Quick actions, keyboard shortcuts
- **Information density**: More data visible
- **Reliability**: Always accurate schedules
- **Professional**: Clean, businesslike

### Owner Experience

- **Power**: Full control, all options
- **Insights**: Data-rich dashboards
- **Confidence**: Clear status indicators
- **Scale**: Handle many students/classes

---

## Accessibility

### Color Contrast

- All text meets WCAG AA contrast ratio (4.5:1)
- Interactive elements have visible focus states
- Don't rely on color alone to convey meaning

### Focus States

```typescript
// Default focus ring
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">

// Custom focus
<Input className="focus-visible:ring-2 focus-visible:ring-primary">
```

### Screen Readers

```typescript
// Hidden but accessible text
<span className="sr-only">Opens in new window</span>

// ARIA labels
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

---

*Keep design consistent. When in doubt, match existing patterns.*
