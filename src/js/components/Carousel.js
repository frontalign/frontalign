/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

/**
 * Advanced carousel component with:
 * autoplay, swipe gestures, pager,
 * thumbnails and loop support.
 */
import Debug from "../core/Debug.js";

export default class Carousel {
  static #instances = new Map();
  static #count = 0;
  static get instances() {
    return Carousel.#instances;
  }

  /**
   * Creates, builds and returns a carousel instance.
   */
  static create(selector, options = {}) {
    const instance = new Carousel(selector, options);
    if (!instance.#root || !instance.#inner || !instance.#items?.length) {
      Debug.warn(
        `[Carousel] Missing root, inner element, or carousel items. Instance was not created.`,
      );
      return null;
    }
    instance.build();
    return instance;
  }

  static get(id) {
    return Carousel.#instances.get(id);
  }

  // Private Fields
  #id = null;
  #root = null;
  #inner = null;
  #items = null;
  #pagerEl = null;
  #thumbEl = null;
  #interval = null;
  #isDragging = false;
  #isPausedByHover = false;
  #isPausedBySwipe = false;
  #handleNext = null;
  #handlePrev = null;
  #handleStart = null;
  #handleMove = null;
  #handleEnd = null;
  #handleEnter = null;
  #handleLeave = null;

  // Swipe data
  #swipe = {
    x: null,
    y: null,
    dx: 0,
    dy: 0,
    startTime: 0,
    threshold: 40,
  };

  // Config
  #config = {};
  #current = 1;

  // Defaults
  static defaults = {
    mode: "slide",
    autoplay: {
      enabled: true,
      interval: 4000,
      pauseOnHover: true,
      pauseOnSwipe: true,
    },
    controls: true,
    pager: true,
    thumbnails: { enabled: false, clickable: true },
    swipe: true,
    loop: true,
  };

  // Selector
  static selector = {
    inner: ".carousel-items",
    item: ".item",
    pager: ".pager",
    thumbs: ".thumbnails",
    thumbItem: ".thumbnail-image",
    next: ".carousel-next",
    prev: ".carousel-prev",
  };

  // Class
  static class = {
    active: "is-active",
    fade: "is-fade",
  };

  // Template
  static template = {
    next: `<button class="button carousel-next next-icon" aria-label="Next"></button>`,
    prev: `<button class="button carousel-prev prev-icon" aria-label="Prev"></button>`,
    pager: `<ul class="pager"></ul>`,
    pagerItem: `<li class="item"></li>`,
    thumbs: `<ul class="thumbnails"></ul>`,
  };

  /**
   * Creates a new carousel instance.
   */
  constructor(selector, options = {}) {
    //SSR Guard
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    // Accept a CSS selector string or a raw DOM element
    this.#root =
      selector instanceof Element ? selector : document.querySelector(selector);

    if (!(this.#root instanceof Element)) {
      Debug.warn("[Carousel] Target element was not found.");
      return;
    }

    this.#config = Carousel.deepMerge(Carousel.defaults, options);
    this.#inner = this.#root.querySelector(Carousel.selector.inner);
    this.#items = [...(this.#inner?.children ?? [])];
    if (!this.#inner || !this.#items.length) return;
    this.#id = `carousel-${++Carousel.#count}`;
    Carousel.#instances.set(this.#id, this);
    this.#safeBindEvents();
  }

  /**
   * Deep merges user options
   * with default configuration values.
   */
  static deepMerge(target, source) {
    const output = { ...target };
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        output[key] = Carousel.deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  /**
   * Builds the carousel structure,
   * controls and autoplay behavior.
   */
  build() {
    this.#root.setAttribute("role", "region");
    this.#root.setAttribute("aria-roledescription", "carousel");
    this.#root.setAttribute(
      "aria-live",
      this.#config.autoplay.enabled ? "off" : "polite",
    );
    this.#applyControls();
    this.#applyPagerOrThumbs();
    if (this.#config.swipe) this.#enableSwipe();
    if (this.#config.autoplay.enabled) this.#autoplay(true);
    this.#applyHoverAutoplay();
    this.go(1);
  }

  /**
   * Navigates to a specific slide index.
   */
  go(index) {
    const max = this.#items.length;

    if (this.#config.loop) {
      if (index > max) index = 1;
      if (index < 1) index = max;
    } else {
      index = Math.min(Math.max(index, 1), max);
    }

    this.#current = index;
    const pos = -(index - 1) * 100 + "%";

    if (this.#config.mode === "fade") {
      this.#inner.style.transform = "";
      this.#root.classList.add(Carousel.class.fade);

      this.#items.forEach((x) => x.classList.remove(Carousel.class.active));
      this.#items[index - 1].classList.add(Carousel.class.active);
    } else {
      this.#root.classList.remove(Carousel.class.fade);
      this.#inner.style.transform = `translateX(${pos})`;
    }

    this.#updatePager();
    this.#updateThumbs();
  }

  /**
   * Navigates to the next slide.
   */
  next() {
    this.#autoStop();
    this.go(this.#current + 1);
    this.#autoResume();
  }

  /**
   * Navigates to the previous slide.
   */
  prev() {
    this.#autoStop();
    this.go(this.#current - 1);
    this.#autoResume();
  }

  /**
   * Creates carousel navigation controls.
   */
  #applyControls() {
    if (!this.#config.controls) return;
    this.#root.insertAdjacentHTML("beforeend", Carousel.template.prev);
    this.#root.insertAdjacentHTML("beforeend", Carousel.template.next);
    this.#root
      .querySelector(Carousel.selector.next)
      .addEventListener("click", this.#handleNext);
    this.#root
      .querySelector(Carousel.selector.prev)
      .addEventListener("click", this.#handlePrev);
  }

  /**
   * Determines whether pager or thumbnail
   * navigation should be rendered.
   */
  #applyPagerOrThumbs() {
    if (this.#config.pager && this.#config.thumbnails.enabled) {
      this.#config.pager = false;
    }
    if (this.#config.pager) {
      this.#buildPager();
    } else if (this.#config.thumbnails.enabled) {
      this.#buildThumbs();
    }
  }

  /**
   * Builds interactive pager indicators.
   */
  #buildPager() {
    this.#inner.insertAdjacentHTML("afterend", Carousel.template.pager);
    this.#pagerEl = this.#root.querySelector(Carousel.selector.pager);
    this.#items.forEach(() =>
      this.#pagerEl.insertAdjacentHTML(
        "beforeend",
        Carousel.template.pagerItem,
      ),
    );
    [...this.#pagerEl.children].forEach((li, i) => {
      li.addEventListener("click", () => {
        this.go(i + 1);
        this.#autoRestart();
      });
    });
  }

  /**
   * Builds thumbnail navigation items.
   */
  #buildThumbs() {
    this.#inner.insertAdjacentHTML("afterend", Carousel.template.thumbs);
    this.#thumbEl = this.#root.querySelector(Carousel.selector.thumbs);
    this.#items.forEach((slide) => {
      const img = slide.querySelector("img");
      const li = document.createElement("li");
      li.className = "item";
      const thumb = document.createElement("img");
      thumb.className = "thumbnail-image";
      try {
        thumb.src = new URL(img?.src ?? "", location.href).href;
      } catch {
        thumb.src = "";
      }
      li.appendChild(thumb);
      this.#thumbEl.appendChild(li);
    });

    if (this.#config.thumbnails.clickable)
      [...this.#thumbEl.children].forEach((t, i) =>
        t.addEventListener("click", () => {
          this.go(i + 1);
          this.#autoRestart();
        }),
      );
  }

  /**
   * Updates the active pager state.
   */
  #updatePager() {
    if (!this.#pagerEl) return;
    [...this.#pagerEl.children].forEach((x) =>
      x.classList.remove(Carousel.class.active),
    );
    this.#pagerEl.children[this.#current - 1].classList.add(
      Carousel.class.active,
    );
  }

  /**
   * Updates the active thumbnail state.
   */
  #updateThumbs() {
    if (!this.#thumbEl) return;
    [...this.#thumbEl.children].forEach((x) =>
      x.classList.remove(Carousel.class.active),
    );
    this.#thumbEl.children[this.#current - 1].classList.add(
      Carousel.class.active,
    );
  }

  /**
   * Enables pointer-based swipe interactions.
   */
  #enableSwipe() {
    this.#inner.addEventListener("pointerdown", this.#handleStart);
    this.#inner.addEventListener("pointermove", this.#handleMove);
    this.#inner.addEventListener("pointerup", this.#handleEnd);
    this.#inner.addEventListener("pointercancel", this.#handleEnd);
  }

  /**
   * Starts swipe gesture tracking.
   */
  #startSwipe(e) {
    e.preventDefault();
    this.#isDragging = true;
    if (this.#config.autoplay.pauseOnSwipe) {
      this.#isPausedBySwipe = true;
      this.#autoStop();
    }
    this.#swipe.x = e.clientX;
    this.#swipe.y = e.clientY;
    this.#swipe.startTime = performance.now();
  }

  /**
   * Tracks swipe movement direction and distance.
   */
  #moveSwipe(e) {
    if (!this.#isDragging) return;
    this.#swipe.dx = this.#swipe.x - e.clientX;
    this.#swipe.dy = this.#swipe.y - e.clientY;
  }

  /**
   * Finalizes swipe gestures
   * and triggers slide navigation.
   */
  #endSwipe() {
    this.#isDragging = false;
    if (this.#config.autoplay.pauseOnSwipe) {
      this.#isPausedBySwipe = false;
      if (!this.#isPausedByHover) this.#autoResume();
    }
    const dt = performance.now() - this.#swipe.startTime;
    if (
      Math.abs(this.#swipe.dx) > Math.abs(this.#swipe.dy) &&
      Math.abs(this.#swipe.dx) > this.#swipe.threshold &&
      dt > 120
    ) {
      this.#swipe.dx > 0 ? this.next() : this.prev();
    }
  }

  /**
   * Starts automatic slide playback.
   */
  #autoplay(start) {
    if (!this.#config.autoplay.enabled) return;
    if (start && !this.#interval) {
      this.#interval = setInterval(
        () => this.go(this.#current + 1),
        this.#config.autoplay.interval,
      );
    }
  }

  /**
   * Stops autoplay playback.
   */
  #autoStop() {
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
  }

  /**
   * Resumes autoplay playback
   * when interaction ends.
   */
  #autoResume() {
    if (
      this.#config.autoplay.enabled &&
      !this.#isPausedByHover &&
      !this.#isPausedBySwipe
    )
      this.#autoplay(true);
  }

  /**
   * Restarts autoplay timing
   * after manual navigation.
   */
  #autoRestart() {
    if (!this.#config.autoplay.enabled) return;
    this.#autoStop();
    this.#autoResume();
  }

  /**
   * Safely binds internal event handlers.
   */
  #safeBindEvents() {
    this.#handleNext = () => this.next();
    this.#handlePrev = () => this.prev();
    this.#handleStart = (e) => this.#startSwipe(e);
    this.#handleMove = (e) => this.#moveSwipe(e);
    this.#handleEnd = () => this.#endSwipe();
    this.#handleEnter = () => {
      this.#isPausedByHover = true;
      this.#autoStop();
    };
    this.#handleLeave = () => {
      this.#isPausedByHover = false;
      if (!this.#isPausedBySwipe) this.#autoResume();
    };
  }

  /**
   * Applies autoplay pause behavior
   * while hovering the carousel.
   */
  #applyHoverAutoplay() {
    if (!this.#config.autoplay.pauseOnHover) return;
    this.#root.addEventListener("pointerenter", this.#handleEnter);
    this.#root.addEventListener("pointerleave", this.#handleLeave);
  }

  /**
   * Fully disposes the carousel instance
   * and removes all event listeners.
   */
  dispose() {
    this.#autoStop();
    this.#root
      .querySelector(Carousel.selector.next)
      ?.removeEventListener("click", this.#handleNext);
    this.#root
      .querySelector(Carousel.selector.prev)
      ?.removeEventListener("click", this.#handlePrev);
    this.#pagerEl?.remove();
    this.#thumbEl?.remove();
    this.#root.querySelector(Carousel.selector.next)?.remove();
    this.#root.querySelector(Carousel.selector.prev)?.remove();
    this.#inner.removeEventListener("pointerdown", this.#handleStart);
    this.#inner.removeEventListener("pointermove", this.#handleMove);
    this.#inner.removeEventListener("pointerup", this.#handleEnd);
    this.#inner.removeEventListener("pointercancel", this.#handleEnd);
    Carousel.#instances.delete(this.#id);
    this.#root.removeEventListener("pointerenter", this.#handleEnter);
    this.#root.removeEventListener("pointerleave", this.#handleLeave);
  }
}
