# Welcome Modal Design Specification

## Design Tokens

### Colors
```css
/* Background */
--background-primary: #1F1C09;
--background-accent: rgba(20, 185, 164, 0.03); /* Very faint teal */

/* Card */
--card-bg: rgba(0, 0, 0, 0.2);
--card-border: rgba(255, 255, 255, 0.1);
--card-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

/* Typography */
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.6);
--text-muted: rgba(255, 255, 255, 0.5);
--text-placeholder: rgba(255, 255, 255, 0.4);

/* Interactive Elements */
--accent-primary: #44BBA4;
--accent-hover: rgba(68, 187, 164, 0.9);
--accent-focus: rgba(68, 187, 164, 0.2);

/* Input States */
--input-bg: rgba(0, 0, 0, 0.3);
--input-bg-focus: rgba(0, 0, 0, 0.4);
--input-border: rgba(255, 255, 255, 0.2);
--input-border-hover: rgba(255, 255, 255, 0.3);
--input-border-focus: #44BBA4;
```

### Typography
```css
/* Font Family */
--font-primary: 'Inter', system-ui, sans-serif;

/* Font Weights */
--font-weight-semibold: 600;
--font-weight-medium: 500;

/* Font Sizes */
--text-title: 1.5rem; /* 24px */
--text-subtitle: 0.875rem; /* 14px */
--text-label: 0.875rem; /* 14px */
--text-caption: 0.75rem; /* 12px */

/* Line Heights */
--line-height-relaxed: 1.6;
--line-height-normal: 1.4;
```

### Spacing
```css
/* Card Spacing */
--spacing-card-padding: 1.5rem; /* 24px */
--spacing-header-gap: 1rem; /* 16px */
--spacing-content-gap: 1.5rem; /* 24px */
--spacing-form-gap: 1.5rem; /* 24px */
--spacing-field-gap: 1rem; /* 16px */

/* Component Spacing */
--spacing-input-height: 3rem; /* 48px */
--spacing-button-height: 3rem; /* 48px */
--spacing-icon-size: 1rem; /* 16px */
```

### Border Radius
```css
--radius-card: 1rem; /* 16px */
--radius-input: 0.75rem; /* 12px */
--radius-button: 0.75rem; /* 12px */
--radius-icon: 0.5rem; /* 8px */
```

### Shadows
```css
--shadow-card: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
--shadow-button: 0 4px 12px rgba(68, 187, 164, 0.25);
--shadow-focus: 0 0 0 2px rgba(68, 187, 164, 0.2);
```

### Transitions
```css
--transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

## Layout Specifications

### Desktop (1024px+)
- Card width: 28rem (448px)
- Card padding: 1.5rem
- Max width: 28rem
- Centered with 2rem padding

### Mobile (768px and below)
- Card width: 100% (with 1rem padding)
- Card padding: 1.5rem
- Full width with 1rem margin
- Touch-friendly 48px minimum touch targets

## Component States

### Input Field
- **Default**: Low-contrast inset with subtle border
- **Hover**: Slightly brighter border
- **Focus**: #44BBA4 border with ring glow
- **Active**: Maintains focus state

### Refresh Button
- **Default**: Subtle white/60 opacity
- **Hover**: #44BBA4 color with background glow
- **Active**: Scale down to 0.95

### Primary Button
- **Default**: Full-width #44BBA4 background
- **Hover**: Slightly darker with scale up 1.02
- **Active**: Scale down to 0.98
- **Focus**: Ring glow effect

## Micro-Interactions

### Card Entrance
- Fade in with subtle scale animation
- Duration: 0.4s ease-out
- Scale: 0.95 → 1.0

### Input Focus
- Border color transition to #44BBA4
- Ring glow appears (2px, 20% opacity)
- Background slightly brightens
- Duration: 0.3s ease-out

### Button Hover
- Scale up to 1.02
- Shadow appears with teal glow
- Duration: 0.3s ease-out

### Button Press
- Scale down to 0.98
- Duration: 0.1s ease-in

### Refresh Icon
- Hover scale to 1.1
- Color transition to #44BBA4
- Duration: 0.2s ease-out

## Accessibility

### Focus Management
- Visible focus indicators on all interactive elements
- Logical tab order: input → refresh button → submit button
- Focus ring uses #44BBA4 with 20% opacity

### Color Contrast
- Primary text: 4.5:1 contrast ratio
- Secondary text: 3:1 contrast ratio
- Interactive elements meet WCAG AA standards

### Keyboard Navigation
- Enter key submits form
- Tab navigation between elements
- Escape key could close modal (if implemented)

## Responsive Behavior

### Breakpoint: 768px
- Card maintains same proportions
- Touch targets remain 48px minimum
- Spacing adjusts for mobile viewport
- Blurred accent shapes scale appropriately

### Breakpoint: 480px
- Card uses full width with 1rem padding
- Typography scales appropriately
- Maintains visual hierarchy
