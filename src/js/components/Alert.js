/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import DomUtils from "../utils/DomUtils.js";
import Debug from "../core/Debug.js";

export default class Alert {
  #selectorElement = null;
  #config = null;
  #clickHandler = null;
  #supportedTypes = ["success", "danger", "warning", "info", "default"];

  // Class
  #class = {
    icon: "has-icon",
    animated: "animation-none",
    bordered: "border-0",
    alertBase: "alert",
    closeBtn: "alert-close",
  };

  // Defaults
  #defaults = {
    message: "This is an alert message",
    status: "default",
    hasIcon: false,
    dismissible: true,
    position: "before",
    animated: true,
    animation: "fade", // fade or slide
    bordered: false,
    autoClean: false,
  };

  /**
   * Creates and inserts a dynamic alert instance.
   */
  static create(selector, options = {}) {
    const instance = new Alert(selector, options);
    if (!instance.#selectorElement) {
      Debug.warn(
        `[Alert] Target element "${selector}" was not found. Instance was not created.`,
      );
      return null;
    }
    instance.build();
    return instance;
  }

  /**
   * Creates a new alert instance.
   */
  constructor(selector, options = {}) {
    //SSR Guard
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    this.#selectorElement =
      selector instanceof Element ? selector : document.querySelector(selector);
    if (!(this.#selectorElement instanceof Element)) {
      Debug.warn(
        `[Alert] Target element "${selector}" was not found. Instance was not created.`,
      );
      return null;
    }
    this.#config = { ...this.#defaults, ...options };
    // Bind click handler
    this.#clickHandler = this.#handleDismissClick.bind(this);
  }

  /**
   * Builds and inserts the alert element
   * into the DOM.
   */
  build() {
    if (!this.#selectorElement) return;
    const alertEl = this.#createAlert();
    // Determine the position: "before" places the alert before the element, otherwise after
    const insertPos =
      this.#config.position === "before" ? "beforebegin" : "afterend";
    this.#selectorElement.insertAdjacentElement(insertPos, alertEl);
    if (this.#config.dismissible) {
      alertEl.addEventListener("click", this.#clickHandler);
    }
    return alertEl;
  }

  /**
   * Resolves the current alert
   * status utility class.
   */
  #type(prefix = "is-") {
    return this.#supportedTypes.includes(this.#config.status)
      ? `${prefix}${this.#config.status}`
      : `${prefix}default`;
  }

  /**
   * Creates the internal alert DOM structure.
   */
  #createAlert() {
    const classList = [
      this.#class.alertBase,
      this.#type(),
      this.#config.hasIcon ? this.#class.icon : "",
      this.#config.animated === false ? this.#class.animated : "",
      this.#config.bordered === false ? this.#class.bordered : "",
    ]
      .filter(Boolean)
      .join(" ");

    const container = document.createElement("div");
    container.setAttribute("role", "alert");
    const span = document.createElement("span");
    container.className = classList;
    span.className = "alert-content";

    span.appendChild(document.createTextNode(this.#config.message));
    container.appendChild(span);

    if (this.#config.dismissible) {
      const btn = document.createElement("button");
      btn.className = `button ${this.#class.closeBtn}`;
      btn.setAttribute("aria-label", "Dismiss alert");
      container.appendChild(btn);
    }

    return container;
  }

  /**
   * Handles dismiss button interactions
   * and triggers close animations.
   */
  #handleDismissClick(evt) {
    const target = evt.target.closest(`.${this.#class.closeBtn}`);
    if (!target) return;

    const alertEl = target.closest(`.${this.#class.alertBase}`);
    if (!alertEl) return;
    alertEl.removeEventListener("click", this.#clickHandler);
    if (this.#config.animation === "slide") {
      DomUtils.slideUp(alertEl, 200, true).then(() => {
        if (this.#config.autoClean) this.dispose();
      });
    } else {
      // default fade
      alertEl.style.transition = "opacity 0.2s ease";
      alertEl.style.opacity = "0";

      alertEl.addEventListener("transitionend", () => this.#finalize(alertEl), {
        once: true,
      });
    }
  }

  /**
   * Finalizes alert removal
   * and optional cleanup.
   */
  #finalize(el) {
    el.remove();
    if (this.#config.autoClean) this.dispose();
  }

  /**
   * Cleans internal references
   * and releases memory.
   */
  dispose() {
    this.#selectorElement = null;
    this.#config = null;
    this.#clickHandler = null;
  }
}
