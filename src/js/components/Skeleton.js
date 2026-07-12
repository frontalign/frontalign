/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

export default class Skeleton {
  // Activate skeleton on el.
  static show(el) {
    if (!el || el._faSkActive) return;
    if (Skeleton._emit(el, "fa.skeleton.show", true)) return;

    el._faSkActive = true;
    el._faSkPrevAH = el.getAttribute("aria-hidden");
    el._faSkPrevAL = el.getAttribute("aria-label");

    el.setAttribute("aria-hidden", "true");
    el.setAttribute("aria-label", "Loading…");
    el.setAttribute("data-skeleton", "");

    Skeleton._clearError(el);
    Skeleton._injectWave(el);
    Skeleton._watchResize(el);
    Skeleton._emit(el, "fa.skeleton.shown");
  }

  // Deactivate skeleton and reveal content.
  static hide(el) {
    if (!el || !el._faSkActive) return;
    if (Skeleton._emit(el, "fa.skeleton.hide", true)) return;

    el._faSkActive = false;
    el.removeAttribute("data-skeleton");

    Skeleton._unwatchResize(el);
    Skeleton._restoreAria(el);
    Skeleton._removeOverlay(el);
    Skeleton._emit(el, "fa.skeleton.hidden");
  }

  // Show error state.
  static error(el, opts = {}) {
    if (!el) return;
    const { message = "Failed to load", retry = false, onRetry = null } = opts;

    // Clean up active skeleton if present
    if (el._faSkActive) {
      el._faSkActive = false;
      el.removeAttribute("data-skeleton");
      Skeleton._unwatchResize(el);
      Skeleton._removeOverlay(el);
      Skeleton._restoreAria(el);
    }

    Skeleton._clearError(el);
    el.setAttribute("data-skeleton-error", "");
    el.setAttribute("aria-live", "polite");

    const layer = Skeleton._el("div", "fa-sk-error-layer", {
      "data-skeleton-injected": "",
      "data-skeleton-ignore": "",
      role: "alert",
    });

    layer.appendChild(Skeleton._errorIcon());

    const msg = Skeleton._el("p", "fa-sk-error-msg");
    msg.textContent = message;
    layer.appendChild(msg);

    if (retry) {
      const btn = Skeleton._el("button", "fa-sk-retry");
      btn.type = "button";
      btn.textContent = "Try again";
      btn.addEventListener("click", () => {
        Skeleton._clearError(el);
        if (typeof onRetry === "function") onRetry(el);
        Skeleton._emit(el, "fa.skeleton.retry");
      });
      layer.appendChild(btn);
    }

    el.appendChild(layer);
    Skeleton._emit(el, "fa.skeleton.error", false, { message });
  }

  // Convenience wrapper: show → asyncFn() → hide. On throw → error().
  static async wrap(el, asyncFn, opts = {}) {
    Skeleton.show(el);
    try {
      return await asyncFn();
    } catch (err) {
      Skeleton.error(el, {
        message: opts.message ?? err.message ?? "Failed to load",
        retry: opts.retry ?? false,
        onRetry: opts.onRetry ?? null,
      });
      throw err;
    } finally {
      if (el._faSkActive) Skeleton.hide(el);
    }
  }

  /**
   * Boot method — call once on DOMContentLoaded (or top-level await).
   * Activates all [data-skeleton] elements already in the DOM,
   * then watches for new ones via MutationObserver.
   *
   * Usage:
   *   import Skeleton from './Skeleton.js';
   *   Skeleton.mount();
   */
  static mount() {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    // Activate pre-existing elements
    document.querySelectorAll("[data-skeleton]").forEach((el) => {
      if (el.getAttribute("data-skeleton-auto") === "false") return;
      if (!el._faSkActive) Skeleton.show(el);
    });

    // Watch for dynamically added [data-skeleton] elements
    if (Skeleton._mo) return;
    Skeleton._mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.hasAttribute("data-skeleton") && !node._faSkActive) {
            if (node.getAttribute("data-skeleton-auto") !== "false")
              Skeleton.show(node);
          }
          node.querySelectorAll?.("[data-skeleton]").forEach((child) => {
            if (
              !child._faSkActive &&
              child.getAttribute("data-skeleton-auto") !== "false"
            ) {
              Skeleton.show(child);
            }
          });
        }
      }
    });
    Skeleton._mo.observe(document.body, { childList: true, subtree: true });
  }

  // ResizeObserver
  static _watchResize(el) {
    if (el._faSkRO) return;
    if (el._faSkRO || typeof ResizeObserver === "undefined") return;
    el._faSkRO = new ResizeObserver(() => {
      if (el._faSkActive) {
        Skeleton._removeOverlay(el);
        Skeleton._injectWave(el);
      }
    });
    el._faSkRO.observe(el);
  }

  static _unwatchResize(el) {
    if (el._faSkRO) {
      el._faSkRO.disconnect();
      el._faSkRO = null;
    }
  }

  /**
   * Builds ghost overlay based on data-skeleton-layout.
   *
   * layout="auto"     — mirrors real child element geometry   (default)
   * layout="card"     — N×M card grid ghosts
   * layout="list"     — avatar + lines row pattern
   * layout="article"  — hero image block + text lines
   * layout="profile"  — large avatar + text block side-by-side
   *
   * data-skeleton-cols  — integer, columns for "card" layout
   * data-skeleton-rows  — integer, rows for "card" / "list" layout
   */
  static _injectWave(el) {
    if (el.querySelector("[data-skeleton-injected]")) return;

    const overlay = Skeleton._el("div", "fa-sk-wave-overlay", {
      "data-skeleton-injected": "",
      "data-skeleton-ignore": "",
      "aria-hidden": "true",
    });

    const layout = el.getAttribute("data-skeleton-layout") || "auto";
    const w = el.offsetWidth || 300;
    const h = el.offsetHeight || 200;

    const shapes =
      layout === "card"
        ? Skeleton._shapesCard(el, w, h)
        : layout === "list"
          ? Skeleton._shapesList(el, w, h)
          : layout === "article"
            ? Skeleton._shapesArticle(w, h)
            : layout === "profile"
              ? Skeleton._shapesProfile(w, h)
              : Skeleton._detectShapes(el, el.getBoundingClientRect());

    if (shapes.length === 0) {
      const g = Skeleton._el("span", "fa-sk-ghost");
      g.style.cssText = "position:absolute;inset:0;border-radius:inherit;";
      overlay.appendChild(g);
    } else {
      for (const s of shapes) {
        const g = Skeleton._el("span", "fa-sk-ghost");
        g.style.cssText =
          `position:absolute;` +
          `top:${s.top}px;left:${s.left}px;` +
          `width:${s.width}px;height:${s.height}px;` +
          `border-radius:${s.radius};`;
        overlay.appendChild(g);
      }
    }

    el.appendChild(overlay);
  }

  // Layout Shape Generators

  static _shapesCard(el, w, h) {
    const cols = Math.max(
      1,
      parseInt(el.getAttribute("data-skeleton-cols"), 10) ||
        Math.max(1, Math.round(w / 220)),
    );
    const rows = Math.max(
      1,
      parseInt(el.getAttribute("data-skeleton-rows"), 10) || 2,
    );
    const gap = 12;
    const cardW = (w - gap * (cols - 1)) / cols;
    const cardH = (h - gap * (rows - 1)) / rows;
    const shapes = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * (cardW + gap);
        const y = r * (cardH + gap);
        shapes.push({
          top: y,
          left: x,
          width: cardW,
          height: cardH * 0.52,
          radius: "8px",
        }); // thumbnail
        shapes.push({
          top: y + cardH * 0.57,
          left: x,
          width: 32,
          height: 32,
          radius: "50%",
        }); // avatar
        shapes.push({
          top: y + cardH * 0.57 + 6,
          left: x + 42,
          width: cardW * 0.55,
          height: 11,
          radius: "6px",
        }); // title
        shapes.push({
          top: y + cardH * 0.57 + 24,
          left: x + 42,
          width: cardW * 0.35,
          height: 9,
          radius: "6px",
        }); // subtitle
        shapes.push({
          top: y + cardH * 0.83,
          left: x,
          width: cardW * 0.42,
          height: 9,
          radius: "6px",
        }); // tag
      }
    }
    return shapes;
  }

  static _shapesList(el, w, h) {
    const count = Math.max(
      1,
      parseInt(el.getAttribute("data-skeleton-rows"), 10) || 5,
    );
    const rowH = 56;
    const shapes = [];

    for (let i = 0; i < count; i++) {
      const y = i * rowH;
      shapes.push({
        top: y + 10,
        left: 12,
        width: 36,
        height: 36,
        radius: "50%",
      }); // avatar
      shapes.push({
        top: y + 13,
        left: 60,
        width: w * (0.4 + (i % 3) * 0.07),
        height: 11,
        radius: "6px",
      }); // line 1
      shapes.push({
        top: y + 31,
        left: 60,
        width: w * (0.25 + (i % 2) * 0.06),
        height: 9,
        radius: "6px",
      }); // line 2
    }
    return shapes;
  }

  static _shapesArticle(w, h) {
    const heroH = Math.min(200, h * 0.4);
    const shapes = [
      { top: 0, left: 0, width: w, height: heroH, radius: "10px" },
    ];
    const widths = [0.9, 0.76, 0.83, 0.6, 0.78, 0.5];
    let y = heroH + 18;
    for (const frac of widths) {
      shapes.push({
        top: y,
        left: 0,
        width: w * frac,
        height: 12,
        radius: "6px",
      });
      y += 21;
    }
    return shapes;
  }

  static _shapesProfile(w) {
    const av = 64;
    const lx = av + 16;
    const lw = w - lx - 8;
    return [
      { top: 0, left: 0, width: av, height: av, radius: "50%" },
      { top: 5, left: lx, width: lw * 0.55, height: 13, radius: "6px" },
      { top: 25, left: lx, width: lw * 0.38, height: 11, radius: "6px" },
      { top: 50, left: lx, width: lw * 0.7, height: 10, radius: "6px" },
      { top: 67, left: lx, width: lw * 0.5, height: 10, radius: "6px" },
    ];
  }

  // Auto Shape Detection (layout="auto")

  static _detectShapes(root, rootRect) {
    const shapes = [];
    const seen = new WeakSet();

    const INLINE = new Set([
      "SPAN",
      "A",
      "STRONG",
      "EM",
      "B",
      "I",
      "LABEL",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "P",
      "LI",
      "TD",
      "TH",
      "CAPTION",
      "FIGCAPTION",
      "TIME",
      "CODE",
      "KBD",
      "MARK",
      "SMALL",
    ]);
    const BLOCK = new Set([
      "IMG",
      "SVG",
      "VIDEO",
      "CANVAS",
      "INPUT",
      "TEXTAREA",
      "SELECT",
      "BUTTON",
      "PICTURE",
      "FIGURE",
      "IFRAME",
      "HR",
      "TABLE",
      "PROGRESS",
      "METER",
    ]);

    const getRadius = (node) => {
      try {
        const cs = getComputedStyle(node);
        const r = cs.borderRadius || "0px";
        const px = parseFloat(r);
        const min = Math.min(
          parseFloat(cs.width) || 0,
          parseFloat(cs.height) || 0,
        );
        return px >= min / 2 && min > 0 ? "50%" : r;
      } catch {
        return "4px";
      }
    };

    const visit = (node) => {
      if (node.nodeType !== 1) return;
      if (node.hasAttribute?.("data-skeleton-ignore")) return;
      if (node.hasAttribute?.("data-skeleton-injected")) return;
      if (seen.has(node)) return;

      const rect = node.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      const top = rect.top - rootRect.top;
      const left = rect.left - rootRect.left;

      if (top + rect.height < 0 || left + rect.width < 0) return;
      if (top > rootRect.height || left > rootRect.width) return;

      const tag = node.tagName;
      const isBlock = BLOCK.has(tag);
      const isInline = INLINE.has(tag);

      if (isBlock || isInline) {
        seen.add(node);
        shapes.push({
          top: Math.max(0, top),
          left: Math.max(0, left),
          width: Math.min(rect.width, rootRect.width - Math.max(0, left)),
          height: Math.min(rect.height, rootRect.height - Math.max(0, top)),
          radius: getRadius(node),
        });
        if (isBlock) return; // don't recurse into block leaves
      }

      for (const child of node.children) visit(child);
    };

    for (const child of root.children) visit(child);
    return Skeleton._dedupe(shapes);
  }

  static _dedupe(shapes) {
    return shapes.filter(
      (a, i) =>
        !shapes.some((b, j) => {
          if (i === j) return false;
          const inside =
            a.top >= b.top &&
            a.left >= b.left &&
            a.top + a.height <= b.top + b.height &&
            a.left + a.width <= b.left + b.width;
          return inside && b.width * b.height > a.width * a.height;
        }),
    );
  }

  // Private Helpers
  static _removeOverlay(el) {
    el.querySelectorAll("[data-skeleton-injected]").forEach((n) => n.remove());
  }

  static _clearError(el) {
    el.removeAttribute("data-skeleton-error");
    el.removeAttribute("aria-live");
    el.querySelectorAll(".fa-sk-error-layer").forEach((n) => n.remove());
  }

  static _restoreAria(el) {
    el._faSkPrevAH === null
      ? el.removeAttribute("aria-hidden")
      : el.setAttribute("aria-hidden", el._faSkPrevAH);
    el._faSkPrevAL === null
      ? el.removeAttribute("aria-label")
      : el.setAttribute("aria-label", el._faSkPrevAL);
  }

  static _emit(el, name, cancelable = false, detail = {}) {
    const ev = new CustomEvent(name, {
      bubbles: true,
      cancelable,
      detail: { el, ...detail },
    });
    el.dispatchEvent(ev);
    return ev.defaultPrevented;
  }

  static _el(tag, cls = "", attrs = {}) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  static _errorIcon() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    const set = (el, attrs) => {
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    };
    const mk = (tag, attrs) => set(document.createElementNS(ns, tag), attrs);

    set(svg, {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    });

    svg.appendChild(mk("circle", { cx: "12", cy: "12", r: "10" }));
    svg.appendChild(mk("line", { x1: "12", y1: "8", x2: "12", y2: "12" }));
    svg.appendChild(mk("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" }));
    return svg;
  }
}
