/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useEffect, useRef, useCallback } from "react";
import Skeleton from "../js/components/Skeleton.js";

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
