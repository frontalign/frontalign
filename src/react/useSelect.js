/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useEffect, useRef } from "react";
import Select from "../js/components/Select.js";

export function useSelect(target, options = {}) {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!target) return;

    const { onChange, ...selectOptions } = options;
    const el = target?.current ?? target;

    const instance = new Select(el, selectOptions);
    instanceRef.current = instance;

    const selectEl = typeof el === "string" ? document.querySelector(el) : el;

    const handleChange = (event) => {
      onChange?.(event.target.value);
    };

    selectEl?.addEventListener("change", handleChange);

    return () => {
      selectEl?.removeEventListener("change", handleChange);
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };

    // Init once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { instance: instanceRef };
}
