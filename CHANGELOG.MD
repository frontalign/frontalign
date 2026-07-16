# Changelog

All notable changes to this project will be documented in this file.

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