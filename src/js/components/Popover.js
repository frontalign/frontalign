/*!
 * FrontAlign v1.0.6
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import DomUtils from "../utils/DomUtils.js";
import Debug from "../core/Debug.js";

export default class Popover {
  static #instances = new WeakMap();

  #el = null;
  #popover = null;
  #config = null;
  #shown = false;
  #isDisposed = false;
  #id = null;
  #toggleHandler = null;
  #escapeHandler = null;
  #outsideHandler = null;
  #updateHandler = null;

  #defaults = {
    title: "",
    content: "",
    target: null,
    placement: "auto",
    trigger: "click", // click | manual
    hasArrow: true,
    closeOnOutsideClick: true,
    closeOnEscape: true,
    offset: 10,
    autoClean: false,
  };

  #class = {
    popover: "popover",
    active: "opened",
    arrow: "has-arrow",
    header: "popover-header",
    body: "popover-body",

    top: "is-top",
    bottom: "is-bottom",
    left: "is-left",
    right: "is-right",

    start: "is-start",
    end: "is-end",
  };

  constructor(selector, options = {}) {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    this.#el =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;

    if (!(this.#el instanceof Element)) {
      Debug.warn(
        `[Popover] Target element was not found or is not a valid DOM element.`,
      );
      return;
    }

    const existing = Popover.#instances.get(this.#el);
    if (existing) existing.dispose();

    this.#config = this.#readConfig(options);
    this.#id = this.#uniqueId();

    Popover.#instances.set(this.#el, this);

    this.#bindEvents();
  }

  #readConfig(options = {}) {
    const attrConfig = {
      title: this.#el.dataset.title,
      content: this.#el.dataset.content || this.#el.dataset.popover,
      target: this.#el.dataset.target || this.#el.dataset.popoverTarget,
      placement: this.#el.dataset.placement,
      trigger: this.#el.dataset.trigger,
      hasArrow: this.#toBoolean(this.#el.dataset.arrow),
      closeOnOutsideClick: this.#toBoolean(this.#el.dataset.closeOutside),
      closeOnEscape: this.#toBoolean(this.#el.dataset.closeEscape),
      offset: this.#toNumber(this.#el.dataset.offset),
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

  #toBoolean(value) {
    if (value === undefined || value === null || value === "") return undefined;
    return value === "true" || value === true;
  }

  #toNumber(value) {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  #bindEvents() {
    const trigger = this.#normalizeTrigger(this.#config.trigger);

    this.#escapeHandler = (event) => {
      if (this.#config.closeOnEscape && event.key === "Escape" && this.#shown) {
        this.hide();
      }
    };

    this.#outsideHandler = (event) => {
      if (!this.#config.closeOnOutsideClick || !this.#shown) return;

      const target = event.target;

      if (this.#el?.contains(target)) return;
      if (this.#popover?.contains(target)) return;

      this.hide();
    };

    this.#toggleHandler = (event) => {
      event.preventDefault();
      this.toggle();
    };

    if (trigger === "click") {
      this.#el.addEventListener("click", this.#toggleHandler);
    }

    document.addEventListener("keydown", this.#escapeHandler);
  }

  show() {
    if (this.#isDisposed || this.#shown || !this.#el) return;

    if (!this.#dispatch("fa.popover.show", true)) return;

    const fragment = this.#getContentFragment();
    const title = String(this.#config.title ?? "").trim();

    if (!title && !fragment) return;

    this.#popover = document.createElement("div");
    this.#popover.id = this.#id;
    this.#popover.className = this.#class.popover;
    this.#popover.setAttribute("role", "dialog");

    if (this.#config.hasArrow) {
      this.#popover.classList.add(this.#class.arrow);
    }

    if (title) {
      const header = document.createElement("div");
      header.className = this.#class.header;
      header.id = `${this.#id}-title`;
      header.textContent = title;

      this.#popover.setAttribute("aria-labelledby", header.id);
      this.#popover.appendChild(header);
    }

    if (fragment) {
      const body = document.createElement("div");
      body.className = this.#class.body;
      body.appendChild(fragment);
      this.#popover.appendChild(body);
    }

    this.#el.setAttribute("aria-expanded", "true");
    this.#el.setAttribute("aria-controls", this.#id);

    document.body.appendChild(this.#popover);

    DomUtils.afterPaint(() => {
      if (!this.#popover) return;

      this.update();
      this.#popover.classList.add(this.#class.active);
      this.#dispatch("fa.popover.shown");
    });

    this.#shown = true;
    this.#startAutoUpdate();

    if (this.#config.closeOnOutsideClick) {
      DomUtils.afterPaint(() => {
        document.addEventListener("pointerdown", this.#outsideHandler);
      });
    }
  }

  hide() {
    if (!this.#shown || this.#isDisposed) return;

    if (!this.#dispatch("fa.popover.hide", true)) return;
    this.#stopAutoUpdate();

    document.removeEventListener("pointerdown", this.#outsideHandler);

    this.#popover?.classList.remove(this.#class.active);
    this.#popover?.remove();

    this.#popover = null;
    this.#shown = false;

    this.#el?.setAttribute("aria-expanded", "false");
    this.#el?.removeAttribute("aria-controls");

    this.#dispatch("fa.popover.hidden");

    if (this.#config.autoClean) this.dispose();
  }

  toggle() {
    if (this.#shown) {
      this.hide();
    } else {
      this.show();
    }
  }

  update() {
    if (!this.#shown || !this.#popover || !this.#el) return;

    this.#clearPlacement();

    const resolved = this.#resolvePlacement();
    const { side, align } = resolved;

    this.#popover.classList.add(this.#class[side]);

    if (align && this.#class[align]) {
      this.#popover.classList.add(this.#class[align]);
    }

    this.#applyPosition(side, align);
  }

  #getContentFragment() {
    const target = this.#config.target
      ? document.querySelector(this.#config.target)
      : null;

    if (target) {
      const template = document.createDocumentFragment();

      [...target.childNodes].forEach((node) => {
        template.appendChild(node.cloneNode(true));
      });

      return template.childNodes.length ? template : null;
    }

    const content = this.#config.content;

    if (content instanceof Node) {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(content.cloneNode(true));
      return fragment;
    }

    const text = String(content ?? "").trim();
    if (!text) return null;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode(text));
    return fragment;
  }

  #resolvePlacement() {
    const preferred = this.#normalizePlacement(this.#config.placement);
    const placements =
      preferred.side === "auto"
        ? this.#rankPlacements()
        : [preferred, ...this.#rankPlacements()];

    const unique = placements.filter((item, index, array) => {
      return (
        array.findIndex(
          (x) => x.side === item.side && x.align === item.align,
        ) === index
      );
    });

    return unique.find((placement) => this.#fits(placement.side)) || unique[0];
  }

  #rankPlacements() {
    const rect = this.#el.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const space = {
      top: rect.top,
      bottom: winH - rect.bottom,
      left: rect.left,
      right: winW - rect.right,
    };

    return ["bottom", "top", "right", "left"]
      .sort((a, b) => space[b] - space[a])
      .map((side) => ({ side, align: "center" }));
  }

  #fits(side) {
    if (!this.#popover || !this.#el) return false;

    const rect = this.#el.getBoundingClientRect();
    const popoverRect = this.#popover.getBoundingClientRect();

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const offset = this.#config.offset;

    const space = {
      top: rect.top,
      bottom: winH - rect.bottom,
      left: rect.left,
      right: winW - rect.right,
    };

    if (side === "top" || side === "bottom") {
      return space[side] >= popoverRect.height + offset;
    }

    return space[side] >= popoverRect.width + offset;
  }

  #applyPosition(side, align = "center") {
    const rect = this.#el.getBoundingClientRect();
    const popoverRect = this.#popover.getBoundingClientRect();

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    const offset = this.#config.offset;

    let top = 0;
    let left = 0;

    if (side === "top") {
      top = rect.top + scrollY - popoverRect.height - offset;
      left = this.#alignedLeft(rect, popoverRect, align) + scrollX;
    }

    if (side === "bottom") {
      top = rect.bottom + scrollY + offset;
      left = this.#alignedLeft(rect, popoverRect, align) + scrollX;
    }

    if (side === "left") {
      top = this.#alignedTop(rect, popoverRect, align) + scrollY;
      left = rect.left + scrollX - popoverRect.width - offset;
    }

    if (side === "right") {
      top = this.#alignedTop(rect, popoverRect, align) + scrollY;
      left = rect.right + scrollX + offset;
    }

    const padding = 8;

    left = Math.max(
      padding + scrollX,
      Math.min(left, window.innerWidth + scrollX - popoverRect.width - padding),
    );

    top = Math.max(
      padding + scrollY,
      Math.min(
        top,
        window.innerHeight + scrollY - popoverRect.height - padding,
      ),
    );

    Object.assign(this.#popover.style, {
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
    });
  }

  #alignedLeft(rect, popoverRect, align) {
    if (align === "start") return rect.left;
    if (align === "end") return rect.right - popoverRect.width;
    return rect.left + rect.width / 2 - popoverRect.width / 2;
  }

  #alignedTop(rect, popoverRect, align) {
    if (align === "start") return rect.top;
    if (align === "end") return rect.bottom - popoverRect.height;
    return rect.top + rect.height / 2 - popoverRect.height / 2;
  }

  #normalizeTrigger(value) {
    return ["click", "manual"].includes(value) ? value : "click";
  }

  #normalizePlacement(value) {
    const allowedSides = ["auto", "top", "bottom", "left", "right"];
    const allowedAligns = ["start", "end"];

    const raw = String(value || "auto").trim();
    const [side, align] = raw.split("-");

    return {
      side: allowedSides.includes(side) ? side : "auto",
      align: allowedAligns.includes(align) ? align : "center",
    };
  }

  #clearPlacement() {
    this.#popover.classList.remove(
      this.#class.top,
      this.#class.bottom,
      this.#class.left,
      this.#class.right,
      this.#class.start,
      this.#class.end,
    );
  }

  #startAutoUpdate() {
    if (this.#updateHandler) return;

    this.#updateHandler = () => this.update();

    window.addEventListener("resize", this.#updateHandler);
    window.addEventListener("scroll", this.#updateHandler, true);
  }

  #stopAutoUpdate() {
    if (!this.#updateHandler) return;

    window.removeEventListener("resize", this.#updateHandler);
    window.removeEventListener("scroll", this.#updateHandler, true);

    this.#updateHandler = null;
  }

  #dispatch(name, cancelable = false) {
    if (!this.#el) return false;

    const event = new CustomEvent(name, {
      bubbles: true,
      cancelable,
      detail: {
        instance: this,
        trigger: this.#el,
        popover: this.#popover,
      },
    });

    return this.#el.dispatchEvent(event);
  }

  #uniqueId() {
    return `fa-popover-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  static getInstance(element) {
    return Popover.#instances.get(element);
  }

  static init(selector = '[fa-toggle="popover"], [fa-component="popover"]') {
    if (typeof document === "undefined") return [];

    return [...document.querySelectorAll(selector)].map((el) => {
      return Popover.#instances.get(el) || new Popover(el);
    });
  }

  dispose() {
    if (this.#isDisposed) return;
    this.hide();
    this.#el?.removeEventListener("click", this.#toggleHandler);
    document.removeEventListener("keydown", this.#escapeHandler);
    document.removeEventListener("pointerdown", this.#outsideHandler);
    Popover.#instances.delete(this.#el);
    this.#stopAutoUpdate();
    this.#isDisposed = true;
    this.#el = null;
    this.#popover = null;
    this.#config = null;
    this.#id = null;
  }
}
