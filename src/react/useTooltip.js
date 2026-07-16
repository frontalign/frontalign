/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useEffect, useRef } from "react";
import Tooltip from "../js/components/Tooltip.js";

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
