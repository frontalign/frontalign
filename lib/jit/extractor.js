/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
export function extractClassesFromContent(content) {
  const found = new Set();

  function addClasses(value) {
    if (!value || typeof value !== "string") return;

    value
      .replace(/\$\{[^}]*\}/g, " ")
      .replace(/["'`]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => found.add(t));
  }

  function extractStringsFromRange(text) {
    const re = /["'`]([^"'`]*)["'`]/g;
    let m;

    while ((m = re.exec(text)) !== null) {
      addClasses(m[1]);
    }
  }

  let match;

  const staticClassRe = /\bclass(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g;
  while ((match = staticClassRe.exec(content)) !== null) {
    addClasses(match[1]);
  }

  const wrappedStringRe =
    /\bclass(?:Name)?\s*=\s*\{\s*["'`]([^"'`]+)["'`]\s*\}/g;
  while ((match = wrappedStringRe.exec(content)) !== null) {
    addClasses(match[1]);
  }

  const expressionRe = /\bclass(?:Name)?\s*=\s*\{([\s\S]*?)\}/g;
  while ((match = expressionRe.exec(content)) !== null) {
    extractStringsFromRange(match[1]);
  }

  const clsxCallRe = /\b(?:clsx|cn|cx)\s*\(([\s\S]*?)\)/g;
  while ((match = clsxCallRe.exec(content)) !== null) {
    extractStringsFromRange(match[1]);
  }

  const cvaCallRe = /\bcva\s*\(([\s\S]*?)\)\s*[;,)]/g;
  while ((match = cvaCallRe.exec(content)) !== null) {
    extractStringsFromRange(match[1]);
  }

  const tvCallRe = /\b(?:tv|variants)\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  while ((match = tvCallRe.exec(content)) !== null) {
    extractStringsFromRange(match[1]);
  }

  return found;
}

export function extractVarsFromContent(content) {
  const found = new Set();
  const re = /var\(\s*(--[^),\s]+)/g;
  let m;

  while ((m = re.exec(content)) !== null) {
    found.add(m[1].trim());
  }

  return found;
}
