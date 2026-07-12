import { useEffect, useRef, useCallback, useState } from "react";
import Range from "../js/components/Range.js";
/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useRange
 * React hook for the FrontAlign Range component.
 * Mounts a vanilla `Range` instance on a DOM ref, keeps it in sync
 * with React's lifecycle, and exposes convenience methods plus
 * live value state for single or dual (min/max) ranges.
 *
 * @param {Object} [options] — same options accepted by `new Range(el, options)`
 *   @param {boolean} [options.tooltip=true]
 *   @param {boolean} [options.ticks=true]
 *   @param {string|Function|null} [options.valueLabel=null]
 *   @param {(value: number|number[]) => void} [options.onInput] — fires on "fa.range.input"
 *   @param {(value: number|number[]) => void} [options.onChange] — fires on "fa.range.change"
 *
 * @returns {{
 *   ref: import("react").RefObject<HTMLElement>,
 *   value: number | number[],
 *   getValue: () => number | number[],
 *   setValue: (value: number | number[]) => void,
 *   refresh: () => void,
 *   instance: Range | null
 * }}
 *
 * @example — single range
 * const range = useRange({ valueLabel: (v) => `${v}%` });
 *
 * <div fa-component="range" ref={range.ref}>
 *   <input type="range" min="0" max="100" defaultValue="50" />
 * </div>
 *
 * @example — dual (min/max) range with change handler
 * const range = useRange({
 *   onChange: (value) => console.log("committed:", value),
 * });
 *
 * <div fa-component="range" ref={range.ref}>
 *   <input type="range" min="0" max="100" defaultValue="20" />
 *   <input type="range" min="0" max="100" defaultValue="80" />
 * </div>
 *
 * @example — programmatic control
 * const range = useRange();
 *
 * range.setValue(75);
 * range.refresh(); // re-read min/max/step/list after changing them in the DOM
 */

export function useRange(options = {}) {
  const { onInput, onChange, ...rangeOptions } = options;

  const elementRef = useRef(null);
  const instanceRef = useRef(null);
  const optionsRef = useRef(rangeOptions);
  optionsRef.current = rangeOptions;

  const [value, setValueState] = useState(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const instance = Range.getOrCreateInstance(el, optionsRef.current);
    instanceRef.current = instance;
    setValueState(instance.getValue());

    const handleInput = (event) => {
      setValueState(event.detail.value);
      onInput?.(event.detail.value, event.detail.index);
    };

    const handleChange = (event) => {
      setValueState(event.detail.value);
      onChange?.(event.detail.value, event.detail.index);
    };

    el.addEventListener("fa.range.input", handleInput);
    el.addEventListener("fa.range.change", handleChange);

    return () => {
      el.removeEventListener("fa.range.input", handleInput);
      el.removeEventListener("fa.range.change", handleChange);
      instance.dispose();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getValue = useCallback(() => {
    return instanceRef.current?.getValue() ?? value;
  }, [value]);

  const setValue = useCallback((newValue) => {
    instanceRef.current?.setValue(newValue);
    setValueState(newValue);
  }, []);

  const refresh = useCallback(() => {
    instanceRef.current?.refresh();
  }, []);

  return {
    ref: elementRef,
    value,
    getValue,
    setValue,
    refresh,
    instance: instanceRef.current,
  };
}
