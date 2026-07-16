/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useEffect, useRef, useCallback, useState } from "react";
import Range from "../js/components/Range.js";

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
