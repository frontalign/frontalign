/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import postcss from "postcss";

function extractWithContext(node) {
  let parent = node.parent;
  let wrappers = [];

  while (parent && parent.type === "atrule" && parent.name !== "layer") {
    wrappers.push(parent);
    parent = parent.parent;
  }

  let clonedNode = node.clone();
  for (const w of wrappers) {
    const newW = postcss.atRule({ name: w.name, params: w.params });
    newW.append(clonedNode);
    clonedNode = newW;
  }
  return clonedNode;
}

export async function parseCSSInventory(cssText) {
  const root = postcss.parse(cssText);
  const inventory = {
    theme: [],
    base: [],
    components: [],
    utilities: [],
    keyframes: [],
  };

  root.walk((node) => {
    if (
      node.type !== "rule" &&
      (node.type !== "atrule" || node.name !== "keyframes")
    )
      return;

    // Skip from/to/percentage rules nested inside @keyframes — they're
    // already captured whole when the parent @keyframes atrule itself is
    // visited below. Without this, they get miscategorized as standalone
    // components/utilities with an empty selector, which always survives
    // purging and silently duplicates the whole keyframes block.
    if (node.type === "rule") {
      let kp = node.parent;
      while (kp) {
        if (kp.type === "atrule" && kp.name === "keyframes") return;
        kp = kp.parent;
      }
    }

    let layer = "none";
    let p = node.parent;
    while (p) {
      if (p.type === "atrule" && p.name === "layer") layer = p.params.trim();
      p = p.parent;
    }

    let originalSelector = node.type === "rule" ? node.selector : null;
    const wrappedNode = extractWithContext(node);
    const item = { selector: originalSelector, node: wrappedNode };

    if (node.type === "atrule" && node.name === "keyframes") {
      inventory.keyframes.push({ ...item, name: node.params.trim() });
      return;
    }

    if (layer.includes("utilities")) inventory.utilities.push(item);
    else if (layer.includes("components")) inventory.components.push(item);
    else if (layer.includes("base")) inventory.base.push(item);
    else if (layer.includes("theme")) inventory.theme.push(item);
  });

  return inventory;
}
