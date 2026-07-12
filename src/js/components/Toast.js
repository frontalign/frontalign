/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

/**
 * Toast notification system with:
 * auto dismiss, progress timers,
 * status variants and queue cleanup.
 */

import DomUtils from "../utils/DomUtils.js";
import Debug from "../core/Debug.js";

export default class Toast {
  // Static private storage
  static #instances = new Map();
  static #counter = 0;

  // Public read-only access
  static get instances() {
    return Toast.#instances;
  }

  // Private Fields
  #id = null;
  #config = null;
  #el = null;
  #progressEl = null;
  #timeoutId = null;
  #handleClick;
  #container = null;

  // Defaults
  #defaults = {
    message: "Hi, I am a toast message",
    status: "default",
    position: "bottom",
    duration: 4000,
    dismissPrevious: false,
    showIcon: false,
    autoClean: false,
  };

  // Selector
  #selector = {
    rootParent: "body",
    toastBase: "toast",
    generated: "generated-by-fajs",
  };

  // Class
  #class = {
    active: "is-active",
    posTop: "is-top",
    posBottom: "is-bottom",
  };

  #variantMap = {
    success: "is-success",
    danger: "is-danger",
    warning: "is-warning",
    info: "is-info",
    default: "is-default",
  };

  /**
   * Creates a new toast instance.
   */
  constructor(options = {}) {
    this.#config = { ...this.#defaults, ...options };

    // Clamp duration
    this.#config.duration = Math.min(
      Math.max(parseInt(this.#config.duration) || 0, 1000),
      10000,
    );

    // Id + register instance
    this.#id = `toast-${++Toast.#counter}`;
    Toast.#instances.set(this.#id, this);
  }

  /**
   * Creates and displays
   * a toast notification quickly.
   */
  static show(options = {}) {
    const t = new Toast(options);
    t.build();
    return t;
  }

  /**
   * Initializes the toast instance
   * and mounts it into the DOM.
   */
  build() {
    // SSR Guard
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const parent =
      this.#selector.rootParent instanceof Element
        ? this.#selector.rootParent
        : document.querySelector(this.#selector.rootParent) || document.body;

    const containerClass = `fa-toast-container-${this.#config.position}`;
    let container = parent.querySelector(`.${containerClass}`);

    if (!container) {
      container = document.createElement("div");
      container.className = `fa-toast-container ${containerClass}`;
      parent.appendChild(container);
    }

    this.#container = container;

    if (this.#config.dismissPrevious) {
      this.#removeExistingToasts(this.#container);
    }

    this.#create(this.#container);
    this.#setup();
    this.#startAutoClose();
  }

  /**
   * Removes the toast instance immediately.
   */
  remove() {
    this.#clearAutoClose();
    this.#teardownElement();
    Toast.#instances.delete(this.#id);
    if (this.#config.autoClean) this.dispose();
  }

  /**
   * Builds the toast DOM structure
   * and visual progress layer.
   */
  #create(parent) {
    const el = document.createElement("div");
    el.classList.add(this.#selector.toastBase, this.#selector.generated);
    el.setAttribute("data-toast-id", this.#id);
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    if (this.#config.showIcon) {
      const icon = document.createElement("span");
      icon.className = "toast-icon";
      el.appendChild(icon);
    }

    // Message
    const content = document.createElement("span");
    content.className = "toast-message";
    content.textContent = this.#config.message;
    el.appendChild(content);

    const progress = document.createElement("div");
    progress.className = "toast-progress";
    el.appendChild(progress);

    parent.appendChild(el);

    // Store refs
    this.#el = el;
    this.#progressEl = progress;

    DomUtils.afterPaint(() => {
      this.#el.classList.add(this.#class.active);
    });
  }

  /**
   * Applies toast interaction events
   * and visual state classes.
   */
  #setup() {
    if (!(this.#el instanceof Element)) {
      Debug.warn(`[Toast] Target element was not found.`);
      return;
    }
    this.#handleClick = () => this.remove();
    this.#el.addEventListener("click", this.#handleClick);

    const posClass =
      this.#config.position === "top"
        ? this.#class.posTop
        : this.#class.posBottom;
    this.#el.classList.add(posClass);
    const variantClass =
      this.#variantMap[this.#config.status] ?? this.#variantMap.default;
    this.#el.classList.add(variantClass);
    if (this.#config.showIcon) this.#el.classList.add("has-icon");
  }

  /**
   * Starts automatic toast dismissal
   * and progress animations.
   */
  #startAutoClose() {
    if (!this.#progressEl || !this.#el) return;

    this.#progressEl.style.width = "100%";

    DomUtils.afterPaint(() => {
      if (!this.#progressEl) return;

      this.#progressEl.style.transition = `width ${this.#config.duration}ms linear`;

      this.#progressEl.style.width = "0%";
    });

    this.#timeoutId = setTimeout(() => {
      if (this.#el && this.#el.parentNode) {
        this.remove();
      }
      this.#timeoutId = null;
    }, this.#config.duration);
  }

  /**
   * Stops automatic dismissal
   * and clears active timers.
   */
  #clearAutoClose() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
    if (this.#progressEl) {
      this.#progressEl.style.transition = "";
    }
  }

  /**
   * Removes toast elements
   * and unbinds listeners safely.
   */
  #teardownElement() {
    if (!this.#el) return;

    if (this.#handleClick) {
      this.#el.removeEventListener("click", this.#handleClick);
    }

    try {
      if (this.#el.parentNode) {
        this.#el.parentNode.removeChild(this.#el);
      }
    } catch (e) {
      /* ignore */
    }

    this.#el = null;
    this.#progressEl = null;
    this.#handleClick = null;
  }

  /**
   * Removes existing toast instances
   * from the current container.
   */
  #removeExistingToasts(parent) {
    const found = parent.querySelectorAll(`.${this.#selector.generated}`);
    found.forEach((node) => {
      const id = node.getAttribute("data-toast-id");
      if (id) {
        const inst = Toast.#instances.get(id);
        try {
          node.remove();
        } catch (e) {}
        if (inst && inst.#config?.autoClean) inst.dispose();
        Toast.#instances.delete(id);
      } else {
        try {
          node.remove();
        } catch (e) {}
      }
    });
  }

  /**
   * Cleans internal references
   * and releases memory state.
   */
  dispose() {
    this.#clearAutoClose();
    this.#el = null;
    this.#progressEl = null;
    Toast.#instances.delete(this.#id);
    this.#id = null;
    this.#config = null;
  }
}
