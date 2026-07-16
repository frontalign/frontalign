/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useCallback } from "react";
import Toast from "../js/components/Toast.js";

export function useToast() {
  const success = useCallback((message, options = {}) => {
    return Toast.show({ ...options, message, status: "success" });
  }, []);

  const danger = useCallback((message, options = {}) => {
    return Toast.show({ ...options, message, status: "danger" });
  }, []);

  const warning = useCallback((message, options = {}) => {
    return Toast.show({ ...options, message, status: "warning" });
  }, []);

  const info = useCallback((message, options = {}) => {
    return Toast.show({ ...options, message, status: "info" });
  }, []);

  const show = useCallback((options = {}) => {
    return Toast.show(options);
  }, []);

  return { success, danger, warning, info, show };
}
