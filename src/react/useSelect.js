import { useEffect, useRef } from "react";
import Select from "../js/components/Select.js";
/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useSelect
 * Initializes a FrontAlign custom select instance.
 * Accepts a CSS selector or a React ref pointing to a native <select> element.
 * Syncs native change events with an optional React onChange callback.
 * Automatically disposes the Select instance on unmount.
 *
 * @param {string|React.RefObject<HTMLElement>} target
 *   CSS selector or React ref of the target <select> element.
 *
 * @param {Object} [options]
 * @param {Array<{ value: string|number, name: string, icon?: string }>} [options.data]
 *   Select option data.
 * @param {boolean} [options.multiple=false]
 *   Enables multi-select mode.
 * @param {boolean} [options.search=false]
 *   Enables search input inside the dropdown.
 * @param {string} [options.placeholder="--SELECT--"]
 *   Placeholder text.
 * @param {string} [options.inputName="select"]
 *   Hidden input name.
 * @param {string|number|Array<string|number>|null} [options.defaultValue]
 *   Default selected value or values.
 * @param {(value: string) => void} [options.onChange]
 *   Called when selected value changes.
 *
 * @returns {{ instance: React.MutableRefObject<Select|null> }}
 *
 * @example — selector
 * useSelect("#country", {
 *   data: [
 *     { value: "az", name: "Azerbaijan" },
 *     { value: "others", name: "Others" },
 *   ],
 *   placeholder: "Select country",
 *   onChange: (value) => setCountry(value),
 * });
 *
 * @example — ref
 * const selectRef = useRef(null);
 *
 * useSelect(selectRef, {
 *   data: [
 *     { value: "react", name: "React" },
 *     { value: "vue", name: "Vue" },
 *   ],
 *   multiple: true,
 *   search: true,
 *   onChange: (value) => setTags(value.split(",")),
 * });
 *
 * <select ref={selectRef} />
 */
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
