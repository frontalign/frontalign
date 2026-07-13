/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

const SELECTOR_FIXED = "[data-fixed-lock]";
const SELECTOR_STICKY = "[data-sticky-lock]";

export default class ScrollBarHelper {
  constructor() {
    //SSR Guard
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    this._body = document.body;
    this._html = document.documentElement;
  }

  getWidth() {
    return Math.abs(window.innerWidth - document.documentElement.clientWidth);
  }

  hide() {
    if (!this._body) return;

    // Reference counting: allows nested hide()/reset() calls (e.g. two
    // modals open at once) without unlocking the scroll too early.
    const count = parseInt(this._body.dataset.faLockCount || "0", 10) + 1;
    this._body.dataset.faLockCount = String(count);

    if (this._body.dataset.faScrollLocked === "true") return;

    const width = this.getWidth();

    this._body.dataset.faScrollLocked = "true";

    // Disable CSS scroll-anchoring while we mutate layout below.
    // Without this, browsers try to "compensate" for the reflow of
    // scrollable elements (e.g. <pre>) above the fold by nudging the
    // scroll position, which is the source of the small vertical jump.
    this._setInline(this._html, "overflow-anchor", "none");
    this._setInline(this._body, "overflow-anchor", "none");

    document.documentElement.style.setProperty(
      "--fa-scrollbar-width",
      `${width}px`,
    );

    // --- READ PHASE ---
    // Gather every value we need up front instead of interleaving reads
    // (getComputedStyle) with writes (style.setProperty). Interleaving
    // forces a synchronous layout recalculation on every element, which
    // is what causes the visible "jitter" on fixed/sticky elements.
    const fixedEls = width
      ? Array.from(document.querySelectorAll(SELECTOR_FIXED))
      : [];
    const stickyEls = width
      ? Array.from(document.querySelectorAll(SELECTOR_STICKY))
      : [];

    const bodyPadding = width
      ? parseFloat(getComputedStyle(this._body).paddingRight) || 0
      : 0;
    const fixedPaddings = fixedEls.map(
      (el) => parseFloat(getComputedStyle(el).paddingRight) || 0,
    );
    const stickyMargins = stickyEls.map(
      (el) => parseFloat(getComputedStyle(el).marginRight) || 0,
    );

    // --- WRITE PHASE ---
    this._setInline(this._body, "overflow", "hidden");

    if (width) {
      this._writeAttr(this._body, "padding-right", `${bodyPadding + width}px`);

      fixedEls.forEach((el, i) => {
        this._writeAttr(el, "padding-right", `${fixedPaddings[i] + width}px`);
      });

      stickyEls.forEach((el, i) => {
        this._writeAttr(el, "margin-right", `${stickyMargins[i] + width}px`);
      });
    }
  }

  reset() {
    if (!this._body) return;

    const count = Math.max(
      0,
      parseInt(this._body.dataset.faLockCount || "0", 10) - 1,
    );

    if (count > 0) {
      // Someone else still needs the lock (e.g. another open modal).
      this._body.dataset.faLockCount = String(count);
      return;
    }

    delete this._body.dataset.faLockCount;

    if (this._body.dataset.faScrollLocked !== "true") return;

    document.documentElement.style.removeProperty("--fa-scrollbar-width");

    this._resetInline(this._body, "overflow");
    this._resetAttr(this._body, "padding-right");

    document.querySelectorAll(SELECTOR_FIXED).forEach((el) => {
      this._resetAttr(el, "padding-right");
    });

    document.querySelectorAll(SELECTOR_STICKY).forEach((el) => {
      this._resetAttr(el, "margin-right");
    });

    delete this._body.dataset.faScrollLocked;

    // Restore scroll-anchoring behaviour once layout is stable again.
    this._resetInline(this._html, "overflow-anchor");
    this._resetInline(this._body, "overflow-anchor");
  }

  isOverflowing() {
    return this.getWidth() > 0;
  }

  _writeAttr(el, prop, value) {
    const key = this._key(prop);

    if (!(key in el.dataset)) {
      el.dataset[key] = el.style.getPropertyValue(prop);
    }

    el.style.setProperty(prop, value);
  }

  _resetAttr(el, prop) {
    const key = this._key(prop);

    if (!(key in el.dataset)) return;

    const saved = el.dataset[key];

    if (saved) {
      el.style.setProperty(prop, saved);
    } else {
      el.style.removeProperty(prop);
    }

    delete el.dataset[key];
  }

  _setInline(el, prop, value) {
    const key = this._key(prop);

    if (!(key in el.dataset)) {
      el.dataset[key] = el.style.getPropertyValue(prop);
    }

    el.style.setProperty(prop, value);
  }

  _resetInline(el, prop) {
    const key = this._key(prop);

    if (!(key in el.dataset)) return;

    const saved = el.dataset[key];

    if (saved) {
      el.style.setProperty(prop, saved);
    } else {
      el.style.removeProperty(prop);
    }

    delete el.dataset[key];
  }

  _key(prop) {
    return "fa" + prop.replace(/-./g, (c) => c[1].toUpperCase());
  }
}
