# Changelog

All notable changes to this project will be documented in this file.

## [1.0.6] - 2026-07-21

### Fixed
- **Button (Dark Mode):** Fixed poor and broken hover/border states on button variants in dark mode by introducing dedicated hover tokens that were previously missing, causing buttons to fall back to non-theme-aware defaults.
  - *Light Button:* Added `--btn-light-bg-hover` and `--btn-light-border-hover`.
  - *Dark Button:* Added `--btn-dark-bg-hover` and `--btn-dark-border-hover`.
  - *Disabled State:* Restructured the single `--btn-disabled` token into separate `--btn-disabled-bg` and `--btn-disabled-border` tokens for finer control.
- **Text Selection (Firefox):** Added the missing `::-moz-selection` rule alongside `::selection` in the base layer, so text-selection highlighting now renders correctly in Firefox (previously only Chromium-based browsers were styled).
- **Drawer (RTL):** Fixed the drawer failing to visually open in right-to-left (`dir="rtl"`) contexts. The RTL closed-state transform and the `.opened` transform shared identical CSS specificity, so the RTL rule — being declared later in source — permanently overrode the opened state and kept the panel off-screen regardless of the `.opened` class. Added a dedicated `[dir="rtl"] .drawer.opened .drawer-panel` rule so the opened state always takes priority.
- **Form (Validation Icons):** Fixed broken `background-position`/`background-size` on `.form-select`, `.custom-select`, and `.form-file` validation states (`user-invalid`/`user-valid`), which referenced undefined custom properties (`--_select-chevron-pos`, `--_select-icon-pos`, `--_icon-size`, `--_select-icon-pad`, `--_icon-offset`) that were never declared anywhere — silently breaking icon placement. Replaced with explicit values.
- **Drawer (RTL Borders):** Fixed `.drawer.is-end`'s panel border (and its dark-mode counterpart) always rendering on the physical `right`/`left` edge regardless of direction. Converted to logical properties (`border-inline-end`/`border-inline-start`) so the border lands on the correct edge in both LTR and RTL.
- **Form (RTL):** Fixed remaining hardcoded `left`/`right` values (floating-label position, select/validation icon backgrounds, input start/end slots, switch checkboxes) that didn't mirror under `[dir="rtl"]`, despite the rest of the component already being built on logical spacing properties. Added the missing RTL overrides to complete direction support.
- **Floating Label (Select):** Fixed the floating label on `<select>` elements never reliably toggling between its resting and floated states, since `<select>` doesn't support the `:placeholder-shown` pseudo-class the rest of the mechanism relied on. Added a dedicated `label.select-label` class hook so select labels are styled independently.

### Changed
- **Selection Color:** Switched `--selection` from `color-mix()` to the `oklch(from ...)` relative color syntax for consistency with the rest of the token system and more predictable cross-browser rendering.
  - *Light Mode:* `color-mix(in oklch, var(--primary) 30%, transparent)` → `oklch(from var(--primary) l c h / 0.25)`.
  - *Dark Mode:* Opacity and lightness fine-tuned: `oklch(from var(--primary) 0.62 calc(c * 0.9) h / 0.38)` → `oklch(from var(--primary) 0.65 calc(c * 0.9) h / 0.35)`.
- **Button Base Colors:** Refined default light and dark button colors for better visual consistency.
  - `--btn-light-bg`: `var(--light)` → `oklch(0.99 0 0)`.
  - `--btn-light-text`: `oklch(0.28 0.02 250)` → `var(--slate-800)`.
  - `--btn-dark-border`: `var(--slate-800)` → `var(--slate-900)`.
- **Form Controls (Dark Mode):** Adjusted `--form-control` and `--form-control-border` hue for better alignment with the dark palette (hue `260` → `250`).
- **Floating Label:** Reworked the positioning mechanism from a `top`/`left`/`padding`-based transition to `transform: translateY() scale()`, for smoother, more precise animation between resting and floated states.

## [1.0.5] - 2026-07-16

### Fixed
- **Semantic Contrast Optimization:** Adjusted contrast values for all semantic colors (`--primary-contrast`, `--danger-contrast`, etc.) in both Light and Dark modes to fully comply with modern UI readability (WCAG) standards.
  - *Light Mode:* Text on darker background tones (600) has been updated to a crisp off-white (`oklch(0.985 0 0)`) for a cleaner and sharper appearance (excluding the warning color).
  - *Dark Mode:* Fixed readability and "halation" (glowing) issues caused by white text on bright, vibrant backgrounds (500). All contrast texts are now set to a dark tone (`oklch(0.145 0 0)`) to ensure sharp legibility.

### Changed
- **Core Color Palette Refinement:** Optimized the OKLCH values for `Success` (Green), `Red`, and `Orange` base tokens to deliver a more vibrant, modern, and premium interface feel.

## [1.0.4] - 2026-07-15
### Fixed
- **SSR:** Fixed runtime errors when used in SSR (server-side rendering) environments where `document`/`window` are unavailable — `LazyImage.observe()`, `Range` (`constructor`, `static init()`), `Modal` (`custom`), and `DomUtils.closeOnEscape()` now safely no-op (returning immediately, an already-resolved promise, or a no-op cleanup function) instead of throwing.
- **Config:** Fixed the NPM Guard checking for the wrong stylesheet filename (`fa.build.css` instead of `frontalign.build.css`), which caused it to never detect an already-linked static build and inject runtime styles redundantly.
- **Drawer:** Fixed links inside the drawer not closing the drawer when clicked.
- **Theme:** Fixed insufficient text contrast on light-mode semantic tokens (`--primary`, `--success`, `--info`, `--danger`) when paired with white contrast text on solid backgrounds (buttons, badges, toasts). Darkened each token by one step to meet WCAG AA (4.5:1): `--primary` (blue-600 → blue-700), `--success` (green-500 → green-700), `--info` (teal-600 → teal-700), `--danger` (red-500 → red-600). `--warning` and all dark-mode tokens were verified already compliant and left unchanged.

## [1.0.3] - 2026-07-13
### Fixed
- **Theme:** Fixed critical text contrast issues in dark mode by correctly mapping `--primary-contrast` and `--accent-contrast` to `--dark`. Text is now fully readable over lighter primary and accent backgrounds.
- **Navbar:** Restored `--navbar`/`--navbar-text` custom property support (background/text color), accidentally hardcoded in a previous patch.
- **Navbar:** Fixed `.navbar-brand` overriding `color` with a literal value instead of `inherit`, which broke theme-aware text color.
- **Drawer:** Replaced hardcoded literal colors with `--surface-raised`/`--body-text` tokens so the panel is visually distinct from `--body` in dark mode; removed now-redundant manual dark-mode overrides.
- **Blockquote:** Replaced hardcoded literal colors with `--surface`/`--body-text`/`--border` tokens for consistent dark-mode theming; removed now-redundant manual dark-mode overrides.
- **Warning:** Switched to `--yellow-400` instead of `--yellow-500` for better contrast/visibility.

### Improved
- **Build Process:** Improved Rollup and Terser configuration. License banners are now strictly preserved only once at the top of the files.
- **CSS JIT:** Processed CSS files now correctly strip internal comments without minifying the layout, ensuring full compatibility with JIT compilation.

## [1.0.2] - 2026-07-12
### Fixed
- Auto-install missing JIT dependencies (postcss, cssnano, glob, chokidar)
- Restructured React adapter output under dist/react/
- Added version-sync script for banner comments

## [1.0.1] - 2026-07-12
### Removed
- Removed unused `postcss-custom-media` dependency (dead code cleanup, no functional impact).

## [1.0.0] - 2026-07-12
### Added
- Initial release.