/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

export default class DomUtils {
  /**
   * Hides an element using display:none.
   */
  static hide(element) {
    element.style.display = "none";
  }

  /**
   * Shows an element using display:block.
   */
  static show(element) {
    element.style.display = "block";
  }

  /**
   * Slides an element up with height animation.
   * Optionally removes the element after animation completes.
   */
  static slideUp(el, duration = 350, removeAfter = false) {
    return new Promise((resolve) => {
      if (!el) return resolve();

      const height = el.getBoundingClientRect().height;
      if (height === 0) {
        el.style.display = "none";
        return resolve();
      }

      el.style.overflow = "hidden";
      el.style.height = height + "px";
      el.style.marginTop = getComputedStyle(el).marginTop;
      el.style.marginBottom = getComputedStyle(el).marginBottom;

      const animation = el.animate(
        [
          {
            height: height + "px",
            marginTop: getComputedStyle(el).marginTop,
            marginBottom: getComputedStyle(el).marginBottom,
          },
          { height: "0px", marginTop: "0px", marginBottom: "0px" },
        ],
        { duration, easing: "ease-out", fill: "forwards" },
      );

      animation.onfinish = () => {
        animation.cancel();
        // Inline stilləri təmizlə
        el.style.height = el.style.overflow = "";
        el.style.marginTop = el.style.marginBottom = "";
        el.style.display = "none";
        if (removeAfter) el.remove();
        resolve();
      };

      animation.oncancel = resolve;
    });
  }

  /**
   * Slides an element down with height animation.
   */
  static slideDown(el, duration = 350, display = "block") {
    return new Promise((resolve) => {
      if (!el) return resolve();

      el.style.display = display;
      void el.offsetHeight; // layout flush

      const height = el.scrollHeight;
      const cs = getComputedStyle(el);

      const animation = el.animate(
        [
          {
            height: "0px",
            overflow: "hidden",
            marginTop: "0px",
            marginBottom: "0px",
          },
          {
            height: height + "px",
            overflow: "hidden",
            marginTop: cs.marginTop,
            marginBottom: cs.marginBottom,
          },
        ],
        { duration, easing: "ease-out", fill: "forwards" },
      );

      animation.onfinish = () => {
        animation.cancel();
        resolve();
      };

      animation.oncancel = resolve;
    });
  }
  /**
   * Toggles slideUp / slideDown automatically.
   */

  static toggleSlide(el, duration = 350) {
    return getComputedStyle(el).display === "none"
      ? DomUtils.slideDown(el, duration)
      : DomUtils.slideUp(el, duration);
  }

  /**
   * Closes an element when Escape key is pressed.
   * Returns a cleanup disposer function.
   */
  static closeOnEscape(el, toggler, duration = 350) {
    if (el._escapeHandler) {
      document.removeEventListener("keydown", el._escapeHandler);
    }

    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (getComputedStyle(el).display === "none") return;

      DomUtils.slideUp(el, duration).then(() => {
        if (toggler) toggler.classList.remove("is-active");
      });

      document.removeEventListener("keydown", el._escapeHandler);
      el._escapeHandler = null;
    };

    el._escapeHandler = handler;
    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", el._escapeHandler);
      el._escapeHandler = null;
    };
  }

  /**
   * Waits until the browser completes a paint cycle
   * before executing the callback.
   *
   * Useful for triggering CSS transitions after
   * an element has been inserted or updated.
   */
  static afterPaint(callback) {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  }
}
