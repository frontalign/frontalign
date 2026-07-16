/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useEffect, useRef, useCallback } from "react";
import DarkMode from "../js/components/DarkMode.js";

export function useDarkMode(options = {}) {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const { onChange, ...darkModeOptions } = options;

    const instance = new DarkMode(darkModeOptions);

    if (typeof onChange === "function") {
      instance.onChange(onChange);
    }

    instanceRef.current = instance;

    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };

    // Init once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDark = useCallback(() => {
    return instanceRef.current?.isDark() ?? false;
  }, []);

  return { isDark };
}
