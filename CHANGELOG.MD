# Changelog

All notable changes to this project will be documented in this file.
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