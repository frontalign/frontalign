import { useEffect, useRef } from "react";
import Components from "../js/core/Component.js";
/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useTabview
 * Initializes tabview behavior on the returned ref.
 * Handles tab switching, animated underline and ResizeObserver cleanup.
 *
 * @returns {React.RefObject<HTMLElement>} — attach to the tab container element
 *
 * @example
 * const tabRef = useTabview();
 *
 * <div fa-component="tabview" ref={tabRef}>
 *   ...
 * </div>
 */
export function useTabview() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const instance = Components.tabview(el);

    return () => {
      instance?.dispose?.();
    };
  }, []);

  return ref;
}

/**
 * useSwiper
 * Initializes pointer-based drag/swipe behavior on the returned ref.
 * Automatically removes pointer listeners on unmount.
 *
 * @returns {React.RefObject<HTMLElement>} — attach to the swiper root element
 *
 * @example
 * const swiperRef = useSwiper();
 *
 * <div fa-component="swiper" ref={swiperRef}>
 *   ...
 * </div>
 */
export function useSwiper() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const instance = Components.swiper(el);

    return () => {
      instance?.dispose?.();
    };
  }, []);

  return ref;
}

/**
 * useBadge
 * Formats badge counters and limits values above 99 to "99+".
 *
 * @param {number} count Current badge count.
 * @returns {React.RefObject<HTMLElement>} Badge element ref.
 *
 * @example
 * const badgeRef = useBadge(count);
 *
 * <span ref={badgeRef} data-count={count} />
 */
export function useBadge(count) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    Components.badge(el);
  }, [count]);

  return ref;
}
