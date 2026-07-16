/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

export default class LazyImage {
  static load(img) {
    if (!img.dataset.src) return;

    const errorText = img.dataset.errorText || "Image failed to load";

    const wrap = document.createElement("div");
    wrap.className = "fa-image-wrap";
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);

    const shimmer = document.createElement("div");
    shimmer.className = "fa-image-shimmer";
    wrap.appendChild(shimmer);

    const errorLayer = document.createElement("div");
    errorLayer.className = "fa-image-error-layer";
    errorLayer.appendChild(LazyImage._createErrorSVG());
    const span = document.createElement("span");
    span.textContent = errorText;
    errorLayer.appendChild(span);
    wrap.appendChild(errorLayer);

    const temp = new Image();

    temp.onload = () => {
      img.src = temp.src;
      img.removeAttribute("data-src");
      img.classList.add("fa-image-loaded");
      shimmer.remove();
    };

    temp.onerror = () => {
      temp.onerror = null;
      shimmer.remove();
      img.removeAttribute("data-src");
      errorLayer.classList.add("is-visible");
    };

    temp.src = img.dataset.src;
  }

  /**
   * Observes all matching images and dynamically
   * added elements for lazy loading via
   * IntersectionObserver and MutationObserver.
   */
  static observe(selector = "img[data-src]") {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            LazyImage.load(entry.target);
            intersectionObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "100px 0px", threshold: 0.1 },
    );

    document
      .querySelectorAll(selector)
      .forEach((img) => intersectionObserver.observe(img));

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.(selector)) intersectionObserver.observe(node);
          node
            .querySelectorAll?.(selector)
            .forEach((img) => intersectionObserver.observe(img));
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Creates the default SVG error icon
   * used by the lazy image fallback layer.
   */
  static _createErrorSVG() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "3");
    rect.setAttribute("y", "3");
    rect.setAttribute("width", "18");
    rect.setAttribute("height", "18");
    rect.setAttribute("rx", "2");

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    circle.setAttribute("cx", "8.5");
    circle.setAttribute("cy", "8.5");
    circle.setAttribute("r", "1.5");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "m21 15-5-5L5 21");

    svg.appendChild(rect);
    svg.appendChild(circle);
    svg.appendChild(path);
    return svg;
  }
}
