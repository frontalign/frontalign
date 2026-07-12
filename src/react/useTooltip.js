import { useEffect, useRef } from "react";
import Tooltip from "../js/components/Tooltip.js";
/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useTooltip
 * Initializes a Tooltip instance on the returned ref.
 * Automatically disposes on unmount.
 *
 * @param {Object} options — Tooltip options
 * @param {string} [options.message] — Tooltip text
 * @param {string} [options.placement] — 'auto' | 'top' | 'bottom' | 'left' | 'right'
 * @param {string} [options.trigger] — 'hover' | 'click' | 'focus' | 'manual'
 * @param {boolean} [options.hasArrow] — Show arrow
 * @param {boolean} [options.autoClean] — Dispose after first hide
 *
 * @returns {React.RefObject} — attach to the trigger element
 *
 * @example
 * const tipRef = useTooltip({
 *   message: "Copy to clipboard",
 *   placement: "top"
 * });
 *
 * <button ref={tipRef}>Copy</button>
 */
export function useTooltip(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const instance = new Tooltip(el, options);

    return () => instance?.dispose?.();
  }, []);

  return ref;
}
