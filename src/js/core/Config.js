/*!
 * FrontAlign v1.0.4
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

const themeMap = {
  body: "--body",
  bodyText: "--body-text",
  primary: "--primary",
  primaryContrast: "--primary-contrast",
  font: "--font",
  fontMono: "--font-monospace",
  spaceXs: "--space-xs",
  spaceSm: "--space-sm",
  spaceMd: "--space-md",
  spaceLg: "--space-lg",
  spaceXl: "--space-xl",
  space2xl: "--space-2xl",
};

/**
 * Initializes FrontAlign runtime configuration:
 * themes, fonts and custom utility classes.
 */
export function faConfig(config = {}) {
  // SSR Guard
  if (typeof document === "undefined") return;

  // NPM Guard
  if (document.querySelector('link[href*="frontalign.build.css"]')) {
    return;
  }

  const _config = config || {};
  if (!Object.keys(_config).length) return;

  if (_config.theme) {
    // Light tokens
    const lightVars = [];

    Object.keys(themeMap).forEach((key) => {
      if (_config.theme[key]) {
        lightVars.push(`    ${themeMap[key]}: ${_config.theme[key]};`);
      }
    });

    if (_config.theme.extend) {
      Object.entries(_config.theme.extend).forEach(([key, val]) => {
        const varName = key.startsWith("--") ? key : `--${key}`;
        lightVars.push(`    ${varName}: ${val};`);
      });
    }

    if (lightVars.length > 0) {
      _injectStyles(`:root {\n${lightVars.join("\n")}\n}`, "fa-theme-styles");
    }

    // Dark tokens
    if (_config.theme.dark) {
      const darkVars = [];

      Object.keys(themeMap).forEach((key) => {
        if (_config.theme.dark[key]) {
          darkVars.push(`    ${themeMap[key]}: ${_config.theme.dark[key]};`);
        }
      });

      if (_config.theme.dark.extend) {
        Object.entries(_config.theme.dark.extend).forEach(([key, val]) => {
          const varName = key.startsWith("--") ? key : `--${key}`;
          darkVars.push(`    ${varName}: ${val};`);
        });
      }

      if (darkVars.length > 0) {
        _injectStyles(
          `[fa-theme="dark"] {\n${darkVars.join("\n")}\n}`,
          "fa-theme-dark-styles",
        );
      }
    }
  }

  if (_config.classes) {
    _processClasses(_config.classes);
  }

  if (_config.fonts && Array.isArray(_config.fonts)) {
    _processFonts(_config.fonts);
  }
}

/**
 * Processes custom class definitions
 * and generates dynamic CSS rules.
 */
function _processClasses(classes) {
  if (!classes || typeof classes !== "object" || Array.isArray(classes)) return;

  const lightRules = [];
  const darkRules = [];

  Object.entries(classes).forEach(([selector, declarations]) => {
    if (!selector || typeof selector !== "string") return;

    if (typeof declarations === "string" && declarations.trim()) {
      lightRules.push(`.${selector} { ${declarations.trim()} }`);
      return;
    }

    if (
      !declarations ||
      typeof declarations !== "object" ||
      Array.isArray(declarations)
    )
      return;

    const { dark, ...lightDecls } = declarations;

    if (Object.keys(lightDecls).length) {
      const props = Object.entries(lightDecls)
        .filter(([p, v]) => p && v !== undefined && v !== null && v !== "")
        .map(([p, v]) => `    ${p}: ${v};`)
        .join("\n");

      if (props) lightRules.push(`.${selector} {\n${props}\n}`);
    }

    if (
      dark &&
      typeof dark === "object" &&
      !Array.isArray(dark) &&
      Object.keys(dark).length
    ) {
      const darkProps = Object.entries(dark)
        .filter(([p, v]) => p && v !== undefined && v !== null && v !== "")
        .map(([p, v]) => `    ${p}: ${v};`)
        .join("\n");

      if (darkProps)
        darkRules.push(`[fa-theme="dark"] .${selector} {\n${darkProps}\n}`);
    }
  });

  const cssOutput = [...lightRules, ...darkRules].join("\n\n");
  if (cssOutput) _injectStyles(cssOutput, "fa-custom-classes");
}

/**
 * Processes Google Font definitions
 * and generates font utility classes.
 */
function _processFonts(fonts) {
  _addPreconnect("https://fonts.googleapis.com");
  _addPreconnect("https://fonts.gstatic.com", true);

  const validFonts = [];
  let fontCssClasses = "";

  fonts.forEach((fontObj) => {
    if (typeof fontObj !== "object" || !fontObj.family) return;
    validFonts.push(fontObj);
    const alias =
      fontObj.alias || fontObj.family.toLowerCase().replace(/\s+/g, "-");
    const category = fontObj.category || "sans-serif";
    fontCssClasses += `.font-${alias} {\n    --fa-font-family: "${fontObj.family}", ${category};\n    font-family: var(--fa-font-family) !important;\n}\n`;
  });

  if (validFonts.length > 0) {
    _injectValidFonts(validFonts);
    _injectStyles(fontCssClasses, "fa-font-classes");
  }
}

/**
 * Generates and injects Google Fonts
 * stylesheet links dynamically.
 */
function _injectValidFonts(validFonts) {
  const fontQuery = validFonts
    .map((font) => {
      const cleanFamily = font.family.trim().replace(/ /g, "+");
      if (font.weights) {
        const w = font.weights.toString().replace(/,/g, ";").replace(/\s/g, "");
        return `family=${cleanFamily}:wght@${w}`;
      }
      return `family=${cleanFamily}`;
    })
    .join("&");

  const finalUrl = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;

  if (!document.head.querySelector(`link[href="${finalUrl}"]`)) {
    const link = document.createElement("link");
    link.href = finalUrl;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
}

/**
 * Injects generated CSS styles
 * into the document head.
 */
function _injectStyles(cssContent, id) {
  if (!cssContent) return;
  let styleTag = document.getElementById(id);
  if (styleTag) styleTag.remove();
  styleTag = document.createElement("style");
  styleTag.id = id;
  styleTag.textContent = cssContent;
  document.head.appendChild(styleTag);
}

/**
 * Adds a preconnect resource hint
 * for external font providers.
 */
function _addPreconnect(href, crossOrigin = false) {
  if (!document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    if (crossOrigin) link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }
}
