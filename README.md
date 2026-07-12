# FrontAlign

> Build Modern Interfaces Without Framework Chaos.

A modern UI engine with utility-first CSS, smart components, runtime theming, CSS compiler & JIT builder, modular NPM exports, React support, hooks and a zero-dependency JavaScript runtime.

---

## Why FrontAlign?

Most front-end tools solve only one part of the interface problem.

Some give you utilities.

Some give you components.

Some give you framework integrations.

FrontAlign brings the interface layer together in one clean system.

- Utility-first CSS
- Modern OKLCH color system
- CSS layers
- Smart auto-initialized components
- CSS compiler & JIT builder
- Runtime theming
- Dark mode
- Skeleton loading system
- React package with provider and hooks
- Modular NPM exports
- CDN support
- Zero dependencies

Initialize once. Build freely.

---

## Install
```bash
npm install frontalign
```

Or use the CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/frontalign/dist/css/frontalign.min.css">
<script src="https://cdn.jsdelivr.net/npm/frontalign/dist/js/frontalign.min.js"></script>
```

---

## Quick Start

### NPM

```js
import 'frontalign/css';
import { FrontAlign } from 'frontalign';

new FrontAlign();
```

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/frontalign/dist/css/frontalign.min.css">
<script src="https://cdn.jsdelivr.net/npm/frontalign/dist/js/frontalign.min.js"></script>

<script>
    new FrontAlign();
</script>
```

That's it.

---

## What You Get

| Feature | Included |
|----------|----------|
| Utility-First CSS | ✓ |
| Modern CSS Layers | ✓ |
| Smart Components | ✓ |
| Smart Observer Runtime | ✓ |
| CSS Compiler & JIT Builder | ✓ |
| Runtime Theming | ✓ |
| Dark Mode | ✓ |
| Skeleton System | ✓ |
| React Hooks | ✓ |
| Modular NPM Exports | ✓ |
| SSR Safe Runtime | ✓ |
| CDN Support | ✓ |
| Zero Dependencies | ✓ |

---

## Smart Observer Runtime

FrontAlign automatically discovers and initializes supported components.

Add new content dynamically?

FrontAlign detects it.

Render components later?

FrontAlign observes them.

Use images with `data-src`?

FrontAlign lazy-loads them automatically.

```html
<div fa-component="swiper">
    ...
</div>

```html
<nav fa-component="tabview">
    ...
</nav>

<img data-src="/image.jpg" alt="Lazy image">
```

```js
new FrontAlign();
```

No manual re-initialization required.

---

## CSS Compiler & JIT Engine

FrontAlign ships with a built-in CSS compiler and JIT Engine for production builds.

It scans your project, detects the classes you actually use, applies your `fa.config.js` configuration, removes unused framework CSS and writes the optimized result into a single production stylesheet.

```bash
npx frontalign build
```

```js
// fa.config.js

export default {
    theme: {
        primary: '#2563eb'
    },

    fonts: [
        {
            family: 'Inter',
            weights: '400,600,700'
        }
    ],

    scan: [
        './app',
        './components',
        './pages',
        './src'
    ],

    safelist: [
        'dark-mode'
    ]
};
```

The compiler is designed to keep your final CSS clean, small and production-ready.

- Scans source files
- Keeps only used FrontAlign classes
- Applies theme tokens
- Includes configured fonts
- Preserves safelisted runtime classes
- Supports custom utilities
- Outputs a single optimized CSS file

Build-time optimization without shipping unnecessary CSS.

---

## Breakpoints

FrontAlign uses a modern breakpoint scale out of the box, tuned for today's screen sizes rather than legacy device widths.

```js
{
    sm: "640px",
    md: "864px",
    lg: "1120px",
    xl: "1408px",
    "2xl": "1792px",
}
```

These breakpoints power all responsive utilities (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) and can be fully customized through `fa.config.js`. The JIT compiler picks up your overrides at build time and regenerates the responsive utility set accordingly.

```js
// fa.config.js

export default {
    theme: {
    breakpoints: {
        sm: "640px",
        md: "864px",
        lg: "1120px",
        xl: "1408px",
        "2xl": "1792px"
    }
    }
};
```

---

## Runtime Configuration

Need to update your theme without rebuilding?

Use `new FrontAlign(config)`.

```js
new FrontAlign({
    theme: {
        primary: '#6366f1'
    }
});
```

This is for is for runtime configuration.

`fa.config.js` is for build-time CSS compilation.

---

## Modular Architecture

Import the full runtime:

```js
import { FrontAlign } from 'frontalign';

new FrontAlign();
```

Import only what you need:

```js
import {
    Modal,
    Toast,
    Carousel,
    DarkMode,
    Skeleton
} from 'frontalign';
```

Import CSS separately:

```js
import 'frontalign/css';
```
---

## React Support

FrontAlign includes a dedicated React package with provider-based setup and hooks for React and Next.js applications.

```tsx
'use client';

import { useNavbar , useDrawer } from 'frontalign/react';

export default function MyReactApp(){

    return (
    );
}
```

Use hooks when you need component-level control.

FrontAlign continues to work with:

- Vanilla JavaScript
- React
- Next.js
- Vue
- Astro
- Laravel
- WordPress
- Static HTML

---

## Components

FrontAlign ships with production-ready components powered by the smart runtime.

| Component | Description |
|------------|------------|
| Modal | Dialogs and overlays |
| Drawer | Slide-in panels |
| Dropdown | Accessible menus |
| Collapse | Expandable content |
| Accordion | Collapsible sections |
| Navbar | Responsive navigation |
| Carousel | Advanced slider |
| Swiper | Touch scrolling |
| Toast | Notifications |
| Tooltip | Contextual hints |
| Popover | Detailed contextual information |
| Alert | Dismissible messages |
| Select | Enhanced selects |
| Tabview | Tab interfaces |
| DarkMode | Theme switching |
| Form | Validation helpers |
| Badge | Status indicators |
| Skeleton | Loading placeholders |
| Lazy Image | Automatic `data-src` image loading |
| Range | Single & dual-mode range slider |

---

## Form Validation & Range

FrontAlign's `Form` component ships with built-in validation driven directly by user input, requiring no extra JS wiring, plus optional AJAX submission support.

```html
<form fa-component="form" data-ajax="/api/submit"novalidate>
    <input type="email" data-rule="email">
    <button type="submit">Send</button>
</form>
```

The `Range` component supports both single-value and dual-mode (min/max) sliders out of the box.

```html
<div class="group-range"fa-component="range">
    <input class="form-range"type="range"max="100"min="10"/>
</div>
```

---

## Skeleton System

FrontAlign includes a flexible skeleton system for loading states.

Use it in static HTML, CDN projects, React, Next.js, Vue, WordPress or any server-rendered interface.

```html
<div
  data-skeleton
  data-skeleton-layout="card"
  data-skeleton-cols="2"
  data-skeleton-rows="3"
>
  <!-- Cards rendered here after load -->
</div>
```

Skeletons work everywhere because they are CSS-first and framework-independent.

---

## Browser Support

FrontAlign targets modern browsers supporting:

- CSS Custom Properties
- OKLCH colors
- CSS Layers
- IntersectionObserver
- MutationObserver
- ES Modules
- Modern DOM APIs

| Browser | Version |
|----------|----------|
| Chrome | 111+ |
| Edge | 111+ |
| Firefox | 113+ |
| Opera | 97+ |
| Safari | 15.4+ |
| iOS Safari | 15.4+ |
| Samsung Internet | 22+ |

---

## Documentation

- Website → https://frontalign.dev
- Documentation → https://frontalign.dev/docs

---

## License

MIT © Eyruz Badalzada

## Troubleshooting

### Fixed elements shift when a modal or drawer opens

FrontAlign locks body scrolling while drawers and modals are open. If a fixed or sticky element shifts when the scrollbar disappears, add one of the following attributes:

```html
<button data-fixed-lock></button>

<header data-sticky-lock></header>