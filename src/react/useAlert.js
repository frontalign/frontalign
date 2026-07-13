/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useCallback } from "react";
import Alert from "../js/components/Alert.js";

export function useAlert() {
  const show = useCallback((selector, options = {}) => {
    return Alert.create(selector, options);
  }, []);

  const success = useCallback((selector, options = {}) => {
    return Alert.create(selector, { ...options, status: "success" });
  }, []);

  const danger = useCallback((selector, options = {}) => {
    return Alert.create(selector, { ...options, status: "danger" });
  }, []);

  const warning = useCallback((selector, options = {}) => {
    return Alert.create(selector, { ...options, status: "warning" });
  }, []);

  const info = useCallback((selector, options = {}) => {
    return Alert.create(selector, { ...options, status: "info" });
  }, []);

  return { show, success, danger, warning, info };
}
