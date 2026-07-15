/*!
 * FrontAlign v1.0.4
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useEffect, useRef } from "react";
import Popover from "../js/components/Popover.js";

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
