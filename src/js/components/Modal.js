/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

/**
 * Advanced modal system with:
 * queue support, confirm dialogs,
 * custom modals and lifecycle callbacks.
 */
import DomUtils from "../utils/DomUtils.js";
import ScrollBarHelper from "../utils/ScrollBarHelper.js";

export default class Modal {
  // Static queue support
  static #queue = [];
  static #processingQueue = false;

  static TRANSITION_DURATION = 280;
  static TRANSITION_BUFFER = 60;

  static #closeHandlers = new WeakMap();

  /**
   * Adds a modal request
   * into the shared modal queue.
   */
  static enqueue(item) {
    Modal.#queue.push(item);
    Modal.#processQueue();
  }

  /**
   * Processes queued modal instances
   * sequentially.
   */
  static async #processQueue() {
    if (Modal.#processingQueue) return;
    Modal.#processingQueue = true;

    while (Modal.#queue.length) {
      const item = Modal.#queue.shift();
      try {
        const modal = new Modal(item.type, item.options);
        const result = modal.build();
        if (result instanceof Promise) {
          const value = await result;
          item.resolve?.(value);
        } else {
          item.resolve?.(undefined);
        }
      } catch (err) {
        item.reject?.(err);
      }
    }

    Modal.#processingQueue = false;
  }

  /**
   * Creates a promise-based
   * confirm dialog modal.
   */
  static #open(type, options = {}, useQueue = false) {
    return new Promise((resolve, reject) => {
      if (useQueue) {
        Modal.enqueue({ type, options, resolve, reject });
        return;
      }

      const modal = new Modal(type, options);
      modal.build().then(resolve).catch(reject);
    });
  }

  /**
   * Creates a promise-based
   * Confirm dialog modal.
   */
  static confirm(options = {}) {
    return Modal.#open("confirm", options);
  }

  /**
   * Creates a promise-based
   * Default alert modal.
   */
  static alert(options = {}) {
    return Modal.#open("default", options);
  }

  /**
   * Creates a promise-based
   * Custom alert modal.
   */
  static custom(options = {}) {
    return Modal.#open("custom", options);
  }

  static queue = {
    alert: (options = {}) => Modal.#open("default", options, true),
    confirm: (options = {}) => Modal.#open("confirm", options, true),
  };

  #config = null;

  #class = {
    opened: "opened",
    align: { top: "is-top", center: "is-center", bottom: "is-bottom" },
  };

  #modal = null;
  #dialog = null;
  #header = null;
  #body = null;
  #actionsWrap = null;
  #backdrop = null;
  #promiseResolve = null;
  static #scrollbar = new ScrollBarHelper();
  static #lockCount = 0;

  #handlers = {
    esc: null,
    backdropClick: null,
    dismissClick: null,
    confirmClick: null,
    transitionEnd: null,
  };

  static #lockBodyScroll() {
    Modal.#lockCount += 1;

    if (Modal.#lockCount === 1) {
      Modal.#scrollbar.hide();
    }
  }

  static #unlockBodyScroll() {
    Modal.#lockCount = Math.max(0, Modal.#lockCount - 1);

    if (Modal.#lockCount === 0) {
      Modal.#scrollbar.reset();
    }
  }

  /**
   * Creates a new modal instance.
   */
  constructor(type, options = {}) {
    if (!["default", "confirm", "custom"].includes(type)) {
      throw new Error(
        `Invalid modal type "${type}". Must be: default, confirm, custom`,
      );
    }

    // Defaults
    const defaults = {
      default: {
        heading: undefined,
        content: "This is a Modal message",
        align: "center",
        dispose: false,
        dismissText: "OK",
        icon: { visible: false, type: "none" },
        guardMode: false,
        guardButtonText: "Go here",
        guardButtonClass: "",
        guardButtonUrl: "",
        closeOnEsc: true,
        backdrop: true,
        backdropClose: true,
        focusFirst: true,
        onOpen: null,
        onOpened: null,
        onClose: null,
        onClosed: null,
      },
      confirm: {
        heading: undefined,
        content: "Are you sure?",
        confirmUrl: "#",
        align: "center",
        dispose: false,
        actions: { cancelText: "No", confirmText: "Yes" },
        closeOnEsc: false,
        backdrop: true,
        backdropClose: false,
        focusFirst: true,
        onOpen: null,
        onOpened: null,
        onClose: null,
        onClosed: null,
      },
      custom: {
        id: "#",
        onOpen: null,
        onOpened: null,
        onClose: null,
        onClosed: null,
        closeOnEsc: true,
        backdropClose: true,
        focusFirst: true,
      },
    };
    this.type = type;
    this.#config = { ...defaults[type], ...options };
    this.#config.icon = {
      visible: false,
      type: "none",
      ...(this.#config.icon || {}),
    };

    // Bind handlers
    this.#handlers.esc = this.#handleEsc.bind(this);
    this.#handlers.dismissClick = this.#handleDismissClick.bind(this);
    this.#handlers.confirmClick = this.#handleConfirmClick.bind(this);
  }

  /**
   * Creates the modal
   * DOM structure and backdrop.
   */
  #create() {
    if (this.type === "custom") return;
    this.#backdrop = document.createElement("div");
    this.#backdrop.className = "modal-backdrop generated-by-fajs-backdrop";
    this.#modal = document.createElement("div");
    this.#modal.className = "modal generated-by-fajs";
    this.#modal.setAttribute("role", "dialog");
    this.#modal.setAttribute("aria-modal", "true");
    this.#dialog = document.createElement("div");
    this.#dialog.className = "modal-dialog";
    this.#header = document.createElement("div");
    this.#header.className = "modal-header";
    this.#body = document.createElement("div");
    this.#body.className = "modal-body";
    this.#dialog.append(this.#header, this.#body);
    this.#modal.append(this.#dialog);
    this.#backdrop.appendChild(this.#modal);
    document.body.appendChild(this.#backdrop);
  }

  /**
   * Applies modal heading
   * and content text.
   */
  #applyText() {
    if (this.#config.heading) {
      this.#header.id = "fa-modal-title-" + crypto.randomUUID();
      this.#header.textContent = this.#config.heading;
      this.#modal.setAttribute("aria-labelledby", this.#header.id);
    }
    this.#body.textContent = this.#config.content;
  }

  /**
   * Creates modal action buttons
   * and guard mode behavior.
   */
  #addButtons() {
    this.#actionsWrap = document.createElement("div");
    this.#actionsWrap.className = "modal-actions";

    if (this.type === "default") {
      const btn = document.createElement("button");
      btn.className = "button is-primary-ghost modal-close";
      btn.textContent = this.#config.dismissText;
      this.#actionsWrap.appendChild(btn);
    } else if (this.type === "confirm") {
      const cancel = document.createElement("button");
      cancel.className = "button is-dark-ghost modal-close";
      cancel.textContent = this.#config.actions.cancelText;

      const confirm = document.createElement("button");
      confirm.className = "button is-primary-ghost modal-confirm";
      confirm.textContent = this.#config.actions.confirmText;

      this.#actionsWrap.append(cancel, confirm);
    }

    this.#dialog.appendChild(this.#actionsWrap);

    if (this.#config.guardMode) {
      this.#actionsWrap.innerHTML = "";

      const gbtn = document.createElement("button");
      gbtn.className = "button";
      gbtn.textContent = this.#config.guardButtonText || "Go here";
      if (typeof this.#config.guardButtonClass === "string") {
        const safeClasses = this.#config.guardButtonClass
          .split(" ")
          .filter((c) => /^[a-z0-9-_]+$/i.test(c));
        gbtn.classList.add(...safeClasses);
      }
      gbtn.addEventListener("click", () => {
        this.#close("guard-exit");
        if (this.#config.guardButtonUrl) {
          window.location.href = this.#config.guardButtonUrl;
        }

        if (this.#promiseResolve) {
          this.#promiseResolve("guard-exit");
          this.#promiseResolve = null;
        }
      });

      this.#actionsWrap.appendChild(gbtn);

      return;
    }
  }

  /**
   * Injects status icons
   * into the modal dialog.
   */
  #addIcon() {
    const { icon } = this.#config;
    if (!icon.visible || icon.type === "none") return;


    const iconHTML = {
      success: `
    <div class="status-icon is-success is-animated">
      <svg class="status-svg" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
        <circle class="status-ring" cx="40" cy="40" r="32"></circle>
        <path class="status-mark" d="M25 41 L35 51 L56 29"></path>
      </svg>
    </div>
  `,
      error: `
    <div class="status-icon is-error is-animated">
      <svg class="status-svg" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
        <circle class="status-ring" cx="40" cy="40" r="32"></circle>
        <path class="status-mark" d="M28 28 L52 52"></path>
        <path class="status-mark is-second" d="M52 28 L28 52"></path>
      </svg>
    </div>
  `,
      warning: `
    <div class="status-icon is-warning is-animated">
      <svg class="status-svg" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
        <path class="status-ring" d="M40 12 L68 62 H12 Z" stroke-linejoin="round"></path>
        <path class="status-mark" d="M40 27 V45"></path>
        <circle class="status-dot" cx="40" cy="55" r="3.5"></circle>
      </svg>
    </div>
  `,
      info: `
    <div class="status-icon is-info is-animated">
      <svg class="status-svg" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
        <circle class="status-ring" cx="40" cy="40" r="32"></circle>
        <path class="status-mark" d="M40 37 V55"></path>
        <circle class="status-dot" cx="40" cy="25" r="3.5"></circle>
      </svg>
    </div>
  `,
    }[icon.type];

    if (iconHTML) this.#dialog.insertAdjacentHTML("afterbegin", iconHTML);
  }

  /**
   * Applies modal alignment classes.
   */
  #setAlign() {
    const pos = this.#class.align[this.#config.align];
    if (pos) this.#modal.classList.add(pos);
    else this.#modal.classList.add(this.#class.align.center);
  }

  /**
   * Focuses the modal dialog
   * for accessibility support.
   */
  #trapFocus() {
    if (!this.#config.focusFirst) return;
    this.#dialog.setAttribute("tabindex", "-1");
    this.#dialog.focus();
  }

  /**
   * Handles Escape key interactions.
   */
  #handleEsc(e) {
    if (e.key === "Escape" && this.#config.closeOnEsc) {
      this.#close("esc");
    }
  }

  /**
   * Handles dismiss button interactions.
   */
  #handleDismissClick(e) {
    e.preventDefault();
    this.#close("dismiss");
  }

  /**
   * Handles confirm button interactions.
   */
  #handleConfirmClick(e) {
    e.preventDefault();
    this.#resolveConfirm();
  }

  /**
   * Builds and opens the modal instance.
   * Returns a promise-based modal result.
   */
  build() {
    if (this.type === "custom") return this.#runCustom();
    this.#create();
    this.#setAlign();
    this.#applyText();
    this.#addButtons();
    this.#addIcon();

    if (typeof this.#config.onOpen === "function") {
      const shouldOpen = this.#config.onOpen(this.#modal);
      if (shouldOpen === false) {
        this.#backdrop.remove();
        return Promise.reject("Cancelled by onOpen callback");
      }
    }
    if (
      this.#config.backdrop &&
      this.#config.backdropClose &&
      !this.#config.guardMode
    ) {
      this.#handlers.backdropClick = (e) => {
        if (!this.#dialog.contains(e.target)) {
          this.#close("backdrop");
        }
      };
      this.#backdrop.addEventListener("click", this.#handlers.backdropClick);
    }

    if (this.#config.closeOnEsc && !this.#config.guardMode) {
      document.addEventListener("keydown", this.#handlers.esc);
    }
    this.#actionsWrap?.querySelectorAll(".modal-close")?.forEach((btn) => {
      btn.addEventListener("click", this.#handlers.dismissClick);
    });
    this.#actionsWrap?.querySelectorAll(".modal-confirm")?.forEach((btn) => {
      btn.addEventListener("click", this.#handlers.confirmClick);
    });
    Modal.#lockBodyScroll();
    DomUtils.afterPaint(() => {
      this.#modal.classList.add(this.#class.opened);
    });
    setTimeout(() => {
      if (typeof this.#config.onOpened === "function") {
        this.#config.onOpened(this.#modal);
      }
    }, Modal.TRANSITION_DURATION + Modal.TRANSITION_BUFFER);

    this.#trapFocus();
    return new Promise((resolve) => {
      this.#promiseResolve = resolve;
    });
  }

  /**
   * Resolves confirm actions
   * and closes the modal.
   */
  #resolveConfirm() {
    if (this.#promiseResolve) {
      this.#promiseResolve(true);
      this.#promiseResolve = null;
    }
    this.#close("confirm");
  }

  /**
   * Closes the modal instance
   * and performs cleanup.
   */
  #close(reason = "dismiss") {
    if (typeof this.#config.onClose === "function") {
      const shouldClose = this.#config.onClose(this.#modal, reason);
      if (shouldClose === false) return;
    }

    if (this.#backdrop && this.#handlers.backdropClick) {
      this.#backdrop.removeEventListener("click", this.#handlers.backdropClick);
      this.#handlers.backdropClick = null;
    }
    document.removeEventListener("keydown", this.#handlers.esc);

    this.#actionsWrap?.querySelectorAll(".modal-close")?.forEach((btn) => {
      btn.removeEventListener("click", this.#handlers.dismissClick);
    });
    this.#actionsWrap?.querySelectorAll(".modal-confirm")?.forEach((btn) => {
      btn.removeEventListener("click", this.#handlers.confirmClick);
    });

    this.#modal.classList.remove(this.#class.opened);

    let called = false;
    const done = () => {
      if (called) return;
      called = true;
      Modal.#unlockBodyScroll();
      if (typeof this.#config.onClosed === "function") {
        this.#config.onClosed(this.#modal, reason);
      }

      if (this.#backdrop && this.#backdrop.parentNode) {
        this.#backdrop.parentNode.removeChild(this.#backdrop);
      }

      // Resolve promise based on reason
      if (reason !== "confirm" && this.#promiseResolve) {
        this.#promiseResolve(this.type === "confirm" ? false : undefined);
        this.#promiseResolve = null;
      }

      // final cleanup if dispose requested
      if (this.#config.dispose) this.dispose();
    };

    const el = this.#modal;

    const onEnd = (e) => {
      if (e.target !== el) return;
      el.removeEventListener("transitionend", onEnd);
      done();
    };

    if (el) {
      el.addEventListener("transitionend", onEnd, { once: true });
      setTimeout(() => {
        if (document.body.contains(el)) {
          try {
            el.removeEventListener("transitionend", onEnd);
          } catch (e) {}
          done();
        }
      }, Modal.TRANSITION_DURATION + Modal.TRANSITION_BUFFER);
    } else {
      done();
    }
  }

  /**
   * Runs an existing custom modal element
   * using FrontAlign modal behavior.
   */
  #runCustom() {
    const el =
      this.#config.id instanceof Element
        ? this.#config.id
        : document.querySelector(this.#config.id);

    if (!el) {
      return Promise.reject(
        new Error("Custom modal element not found: " + this.#config.id),
      );
    }

    const dialog = el.querySelector(".modal-dialog");

    if (typeof this.#config.onOpen === "function") {
      const shouldOpen = this.#config.onOpen(el);
      if (shouldOpen === false) return Promise.reject("Cancelled by onOpen");
    }

    const cleanup = () => {
      document.removeEventListener("keydown", this.#handlers.esc);

      if (this.#handlers.backdropClick) {
        el.removeEventListener("click", this.#handlers.backdropClick);
        this.#handlers.backdropClick = null;
      }

      el.querySelectorAll(".modal-close").forEach((btn) => {
        const old = Modal.#closeHandlers.get(btn);
        if (old) btn.removeEventListener("click", old);
        Modal.#closeHandlers.delete(btn);
      });
    };

    const close = (reason = "dismiss") => {
      if (typeof this.#config.onClose === "function") {
        const shouldClose = this.#config.onClose(el, reason);
        if (shouldClose === false) return;
      }

      cleanup();

      el.classList.remove(this.#class.opened);

      let called = false;

      const done = () => {
        if (called) return;
        called = true;
        Modal.#unlockBodyScroll();

        el.removeEventListener("transitionend", this.#handlers.transitionEnd);

        if (typeof this.#config.onClosed === "function") {
          this.#config.onClosed(el, reason);
        }
        if (this.#promiseResolve) {
          this.#promiseResolve();
          this.#promiseResolve = null;
        }
      };

      this.#handlers.transitionEnd = (e) => {
        if (e.target !== el) return;
        done();
      };

      el.addEventListener("transitionend", this.#handlers.transitionEnd, {
        once: true,
      });

      setTimeout(done, Modal.TRANSITION_DURATION + Modal.TRANSITION_BUFFER);
    };

    this.#handlers.esc = (e) => {
      if (e.key === "Escape" && this.#config.closeOnEsc) {
        close("esc");
      }
    };

    this.#handlers.backdropClick = (e) => {
      if (!this.#config.backdropClose) return;
      if (dialog && !dialog.contains(e.target)) {
        close("backdrop");
      }
    };

    this.#handlers.dismissClick = (e) => {
      e.preventDefault();
      close("dismiss");
    };

    el.querySelectorAll(".modal-close").forEach((btn) => {
      const old = Modal.#closeHandlers.get(btn);
      if (old) btn.removeEventListener("click", old);

      Modal.#closeHandlers.set(btn, this.#handlers.dismissClick);
      btn.addEventListener("click", this.#handlers.dismissClick);
    });

    if (this.#config.closeOnEsc) {
      document.addEventListener("keydown", this.#handlers.esc);
    }

    if (this.#config.backdropClose) {
      el.addEventListener("click", this.#handlers.backdropClick);
    }
    Modal.#lockBodyScroll();
    DomUtils.afterPaint(() => {
      el.classList.add(this.#class.opened);
    });

    if (this.#config.focusFirst && dialog) {
      dialog.setAttribute("tabindex", "-1");
      dialog.focus();
    }

    let openedCalled = false;

    const opened = () => {
      if (openedCalled) return;
      openedCalled = true;

      el.removeEventListener("transitionend", this.#handlers.transitionEnd);

      if (typeof this.#config.onOpened === "function") {
        this.#config.onOpened(el);
      }
    };

    this.#handlers.transitionEnd = (e) => {
      if (e.target !== el) return;
      opened();
    };

    el.addEventListener("transitionend", this.#handlers.transitionEnd, {
      once: true,
    });

    setTimeout(opened, Modal.TRANSITION_DURATION + Modal.TRANSITION_BUFFER);

    return new Promise((resolve) => {
      this.#promiseResolve = resolve;
    });
  }

  /**
   * Releases modal references
   * and internal memory state.
   */
  dispose() {
    this.#modal = null;
    this.#dialog = null;
    this.#header = null;
    this.#body = null;
    this.#actionsWrap = null;
    this.#backdrop = null;
    this.#promiseResolve = null;
    this.#config = null;
  }
}
