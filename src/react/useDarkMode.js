import { useEffect, useRef, useCallback } from "react";
import DarkMode from "../js/components/DarkMode.js";
/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useDarkMode
 * Initializes DarkMode instance with full React integration.
 * Supports auto-created toggle button, custom button, and onChange callback.
 *
 * @param {Object}   [options]
 * @param {string}   [options.container]      — Toggle button mount target (default: 'body')
 * @param {string}   [options.customBtn]      — Custom button selector (default: false)
 * @param {boolean}  [options.autoCreateBtn]  — Auto-create toggle button (default: true)
 * @param {Function} [options.onChange]       — Callback when theme changes: (isDark: boolean) => void
 *
 * @returns {{ isDark }}
 *   isDark() — returns current dark mode state
 *
 * @example — auto button (fixed corner)
 * useDarkMode();
 *
 * @example — custom button via selector
 * const { isDark } = useDarkMode({
 *     autoCreateBtn: false,
 *     customBtn: '#my-toggle',
 *     onChange: (dark) => console.log(dark ? 'Dark' : 'Light')
 * });
 *
 * @example — onChange ilə React state sync
 * const [dark, setDark] = useState(false);
 * useDarkMode({ autoCreateBtn: false, customBtn: '#my-toggle', onChange: setDark });
 */
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