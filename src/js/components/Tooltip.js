/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import DomUtils from "../utils/DomUtils.js";
import Debug from "../core/Debug.js";

export default class Tooltip {
  static #instances = new WeakMap();

  #el = null;
  #tooltip = null;
  #config = null;
  #shown = false;
  #isDisposed = false;

  #showHandler = null;
  #hideHandler = null;
  #escapeHandler = null;
  #updateHandler = null;

  #defaults = {
    message: "Hi, I am a tooltip message",
    placement: "auto",
    hasArrow: true,
    autoClean: false,
  };

  #class = {
    tooltip: "tooltip",
    active: "opened",
    arrow: "has-arrow",
    top: "is-top",
    bottom: "is-bottom",
    left: "is-left",
    right: "is-right",
  };

  constructor(selector, options = {}) {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    this.#el =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;

    if (!(this.#el instanceof Element)) {
      Debug.warn("[Tooltip] Target element is not a valid DOM element.");
      return;
    }

    const existing = Tooltip.#instances.get(this.#el);
    if (existing) existing.dispose();

    this.#config = this.#readConfig(options);
    Tooltip.#instances.set(this.#el, this);

    this.#bindEvents();
  }

  #readConfig(options = {}) {
    const attrConfig = {
      message: this.#el.dataset.tooltip,
      placement: this.#el.dataset.placement,
    };

    return {
      ...this.#defaults,
      ...this.#clean(attrConfig),
      ...this.#clean(options),
    };
  }

  #clean(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([, value]) => {
        return value !== undefined && value !== null && value !== "";
      }),
    );
  }

  #bindEvents() {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    this.#escapeHandler = (event) => {
      if (event.key === "Escape") this.remove();
    };

    this.#showHandler = () => this.create();
    this.#hideHandler = () => this.remove();

    if (isTouch) {
      this.#el.addEventListener("touchstart", this.#showHandler, {
        passive: true,
      });
      this.#el.addEventListener("touchend", this.#hideHandler);
      this.#el.addEventListener("touchcancel", this.#hideHandler);
    } else {
      this.#el.addEventListener("mouseenter", this.#showHandler);
      this.#el.addEventListener("mouseleave", this.#hideHandler);
    }

    this.#el.addEventListener("focus", this.#showHandler);
    this.#el.addEventListener("blur", this.#hideHandler);
    document.addEventListener("keydown", this.#escapeHandler);
  }

  create() {
    if (this.#isDisposed || this.#shown || !this.#el) return;

    const message = String(this.#config.message ?? "").trim();
    if (!message) return;

    const id = this.#uniqueId();

    this.#tooltip = document.createElement("div");
    this.#tooltip.id = id;
    this.#tooltip.className = this.#class.tooltip;
    this.#tooltip.setAttribute("role", "tooltip");
    this.#tooltip.textContent = message;

    if (this.#config.hasArrow) {
      this.#tooltip.classList.add(this.#class.arrow);
    }

    this.#el.setAttribute("aria-describedby", id);

    if (getComputedStyle(this.#el).position === "static") {
      this.#el.style.position = "relative";
    }

    this.#el.appendChild(this.#tooltip);

    DomUtils.afterPaint(() => {
      if (!this.#tooltip) return;

      this.#applyPlacement();
      this.#tooltip.classList.add(this.#class.active);
    });

    this.#shown = true;

    this.#startAutoUpdate();
  }

  #applyPlacement() {
    if (!this.#tooltip || !this.#el) return;

    this.#clearPlacement();

    const placement = this.#resolvePlacement();
    this.#tooltip.classList.add(this.#class[placement]);
  }

  #resolvePlacement() {
    const preferred = this.#normalizePlacement(this.#config.placement);
    const rect = this.#el.getBoundingClientRect();
    const tooltipRect = this.#tooltip.getBoundingClientRect();

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const space = {
      top: rect.top,
      bottom: winH - rect.bottom,
      left: rect.left,
      right: winW - rect.right,
    };

    const fits = {
      top: space.top >= tooltipRect.height,
      bottom: space.bottom >= tooltipRect.height,
      left: space.left >= tooltipRect.width,
      right: space.right >= tooltipRect.width,
    };

    if (preferred !== "auto" && fits[preferred]) {
      return preferred;
    }

    const fittingPlacements = Object.keys(fits).filter((key) => fits[key]);

    if (fittingPlacements.length) {
      return this.#bestPlacement(fittingPlacements, space, tooltipRect);
    }

    return this.#bestPlacement(
      ["top", "bottom", "left", "right"],
      space,
      tooltipRect,
    );
  }

  #bestPlacement(placements, space, tooltipRect) {
    const scores = {
      top: space.top / tooltipRect.height,
      bottom: space.bottom / tooltipRect.height,
      left: space.left / tooltipRect.width,
      right: space.right / tooltipRect.width,
    };

    return placements.sort((a, b) => scores[b] - scores[a])[0];
  }

  #normalizePlacement(value) {
    return ["auto", "top", "bottom", "left", "right"].includes(value)
      ? value
      : "auto";
  }

  #clearPlacement() {
    this.#tooltip.classList.remove(
      this.#class.top,
      this.#class.bottom,
      this.#class.left,
      this.#class.right,
    );
  }

  #startAutoUpdate() {
    if (this.#updateHandler) return;

    this.#updateHandler = () => {
      if (!this.#shown) return;
      this.#applyPlacement();
    };

    window.addEventListener("resize", this.#updateHandler);
    window.addEventListener("scroll", this.#updateHandler, true);
  }

  #stopAutoUpdate() {
    if (!this.#updateHandler) return;

    window.removeEventListener("resize", this.#updateHandler);
    window.removeEventListener("scroll", this.#updateHandler, true);

    this.#updateHandler = null;
  }

  remove() {
    if (!this.#shown || this.#isDisposed) return;

    this.#stopAutoUpdate();

    this.#tooltip?.remove();
    this.#tooltip = null;
    this.#shown = false;

    this.#el?.removeAttribute("aria-describedby");

    if (this.#config.autoClean) this.dispose();
  }

  #uniqueId() {
    return `fa-tooltip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  static getInstance(element) {
    return Tooltip.#instances.get(element);
  }

  static init(selector = '[fa-component="tooltip"]') {
    if (typeof document === "undefined") return [];

    return [...document.querySelectorAll(selector)].map((el) => {
      return Tooltip.#instances.get(el) || new Tooltip(el);
    });
  }

  dispose() {
    if (this.#isDisposed) return;
    this.remove();
    this.#el?.removeEventListener("mouseenter", this.#showHandler);
    this.#el?.removeEventListener("mouseleave", this.#hideHandler);
    this.#el?.removeEventListener("touchstart", this.#showHandler);
    this.#el?.removeEventListener("touchend", this.#hideHandler);
    this.#el?.removeEventListener("touchcancel", this.#hideHandler);
    this.#el?.removeEventListener("focus", this.#showHandler);
    this.#el?.removeEventListener("blur", this.#hideHandler);
    document.removeEventListener("keydown", this.#escapeHandler);
    Tooltip.#instances.delete(this.#el);
    this.#isDisposed = true;
    this.#el = null;
    this.#tooltip = null;
    this.#config = null;
  }
}
