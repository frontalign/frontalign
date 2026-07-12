import { useEffect, useRef, useCallback } from "react";
import Carousel from "../js/components/Carousel.js";
/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useCarousel
 * Initializes a Carousel instance on a ref or CSS selector.
 * Exposes next(), prev(), go() for imperative control.
 * Automatically disposes on unmount.
 *
 * @param {React.RefObject<HTMLElement>|string} target   — React ref object or CSS selector string
 * @param {Object}  [options]
 * @param {string}  [options.mode]                       — 'slide' | 'fade' (default: 'slide')
 * @param {boolean} [options.controls]                   — Show prev/next buttons (default: true)
 * @param {boolean} [options.pager]                      — Show pager dots (default: true)
 * @param {boolean} [options.loop]                       — Loop slides (default: true)
 * @param {boolean} [options.swipe]                      — Enable swipe gestures (default: true)
 * @param {Object}  [options.autoplay]
 * @param {boolean} [options.autoplay.enabled]           — (default: true)
 * @param {number}  [options.autoplay.interval]          — ms (default: 4000)
 * @param {boolean} [options.autoplay.pauseOnHover]      — (default: true)
 * @param {boolean} [options.autoplay.pauseOnSwipe]      — (default: true)
 * @param {Object}  [options.thumbnails]
 * @param {boolean} [options.thumbnails.enabled]         — (default: false)
 * @param {boolean} [options.thumbnails.clickable]       — (default: true)
 *
 * @returns {{ ref: React.RefObject<HTMLElement>, next, prev, go }}
 *
 * @example — ref (recommended for React)
 * const { ref, next, prev, go } = useCarousel(null, { autoplay: { interval: 3000 } });
 * <div className="carousel" ref={ref}>...</div>
 *
 * @example — selector (legacy / interop)
 * useCarousel('#hero-carousel', { loop: true });
 * <div className="carousel" id="hero-carousel">...</div>
 */
export function useCarousel(target = null, options = {}) {
  const instanceRef = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    const carouselTarget = target?.current ?? target ?? ref.current;

    const instance = Carousel.create(carouselTarget, options);
    if (!instance) return;

    instanceRef.current = instance;

    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };

    // Init once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = useCallback(() => {
    instanceRef.current?.next();
  }, []);

  const prev = useCallback(() => {
    instanceRef.current?.prev();
  }, []);

  const go = useCallback((index) => {
    instanceRef.current?.go(index);
  }, []);

  return { ref, next, prev, go };
}