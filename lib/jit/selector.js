/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
export function splitSelectorList(selector) {
  const parts = [];
  let depth = 0;
  let current = "";

  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];

    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function decodeCssClassName(raw) {
  return raw
    .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/\\(.)/g, "$1");
}

export function extractAllClasses(selector) {
  const classes = [];
  const re = /\.((?:\\[0-9a-fA-F]{1,6}(?:\s)?|\\[^\s.]|[^\s.#:[>{+~),])+)/g;

  let m;
  while ((m = re.exec(selector)) !== null) {
    classes.push(decodeCssClassName(m[1]));
  }

  return classes;
}

// Pseudo-class functions whose contents describe a *condition* on the
// element (absence, a relative element, an alternative match), not a
// class the element itself is required to carry. A class appearing only
// inside one of these must never be treated as "required" for JIT
// inclusion purposes — e.g. in `.foo:not(.is-active)`, "is-active" must
// NOT gate whether the rule for `.foo` gets kept.
const IGNORED_PSEUDO_FUNCTIONS = new Set(["not", "has", "is", "where"]);

/**
 * Removes the contents of :not(), :has(), :is() and :where() from a
 * selector (nesting-aware), so downstream class extraction only sees
 * classes the element itself must actually carry.
 */
export function stripIgnoredPseudoFunctions(selector) {
  let result = "";
  let i = 0;

  while (i < selector.length) {
    const rest = selector.slice(i);
    const fnMatch = /^:{1,2}([a-zA-Z-]+)\(/.exec(rest);

    if (fnMatch && IGNORED_PSEUDO_FUNCTIONS.has(fnMatch[1].toLowerCase())) {
      let depth = 0;
      let j = i + fnMatch[0].length - 1;

      for (; j < selector.length; j++) {
        if (selector[j] === "(") depth++;
        else if (selector[j] === ")") {
          depth--;
          if (depth === 0) break;
        }
      }

      i = j + 1;
      continue;
    }

    result += selector[i];
    i++;
  }

  return result;
}

/**
 * Like extractAllClasses, but ignores classes that only appear inside
 * :not()/:has()/:is()/:where() — the set of classes this selector's
 * element is actually *required* to carry for JIT purge decisions.
 */
export function extractRequiredClasses(selector) {
  return extractAllClasses(stripIgnoredPseudoFunctions(selector));
}
