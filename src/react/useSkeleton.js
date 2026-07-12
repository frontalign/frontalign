import { useEffect, useRef, useCallback } from "react";
import Skeleton from "../js/components/Skeleton.js";
/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useSkeleton
 * Binds Skeleton to a ref element.
 * Exposes show(), hide(), error(), wrap() for full lifecycle control.
 * Skeleton.mount() is NOT called — React manages the DOM.
 *
 * @returns {{ ref, show, hide, error, wrap }}
 *
 * @example — manual show/hide
 * const { ref, show, hide } = useSkeleton();
 * <div ref={ref} data-skeleton-layout="card">...</div>
 *
 * @example — wrap (async, auto show → hide → error)
 * const { ref, wrap } = useSkeleton();
 * useEffect(() => {
 *     wrap(() => fetchPosts(), {
 *         message: 'Məlumat yüklənmədi',
 *         retry: true,
 *         onRetry: () => wrap(() => fetchPosts())
 *     });
 * }, []);
 * <div ref={ref} data-skeleton-layout="list">...</div>
 *
 * @example — error state
 * const { ref, show, error } = useSkeleton();
 * <div ref={ref}>...</div>
 */
export function useSkeleton() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Auto-activate if data-skeleton attribute present
    if (el.hasAttribute("data-skeleton")) {
      Skeleton.show(el);
    }
    return () => {
      if (el._faSkActive) Skeleton.hide(el);
    };
  }, []);

  const show = useCallback(() => {
    if (ref.current) Skeleton.show(ref.current);
  }, []);

  const hide = useCallback(() => {
    if (ref.current) Skeleton.hide(ref.current);
  }, []);

  const error = useCallback((opts = {}) => {
    if (ref.current) Skeleton.error(ref.current, opts);
  }, []);

  const wrap = useCallback((asyncFn, opts = {}) => {
    if (ref.current) return Skeleton.wrap(ref.current, asyncFn, opts);
  }, []);

  return { ref, show, hide, error, wrap };
}
