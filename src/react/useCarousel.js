/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useEffect, useRef, useCallback } from "react";
import Carousel from "../js/components/Carousel.js";

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
