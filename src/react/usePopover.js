import { useEffect, useRef } from "react";
import Popover from "../js/components/Popover.js";
/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * usePopover
 * Initializes a Popover instance on the returned ref.
 * Automatically disposes on unmount.
 *
 * @param {Object} options — Popover options
 * @param {string} [options.title] — Popover title
 * @param {string|Node} [options.content] — Popover content
 * @param {string} [options.target] — CSS selector for template/content element
 * @param {string} [options.placement] — 'auto' | 'top' | 'bottom' | 'left' | 'right'
 * @param {string} [options.trigger] — 'click' | 'manual'
 * @param {boolean} [options.closeOnOutsideClick] — Close when clicking outside
 * @param {boolean} [options.closeOnEscape] — Close on Escape key
 * @param {number} [options.offset] — Distance from trigger
 * @param {boolean} [options.autoClean] — Dispose after first hide
 *
 * @returns {React.RefObject} — attach to the trigger element
 *
 * @example
 * const popoverRef = usePopover({
 *   title: "Info",
 *   content: "Popover content",
 *   placement: "bottom"
 * });
 *
 * <button ref={popoverRef}>Open</button>
 */
export function usePopover(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const instance = new Popover(el, options);

    return () => instance?.dispose?.();
  }, []);

  return ref;
}
