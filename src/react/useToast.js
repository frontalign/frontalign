import { useCallback } from "react";
import Toast from "../js/components/Toast.js";
/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useToast
 * React hook for displaying FrontAlign toast notifications.
 * Provides convenience methods for common status variants
 * and a generic show() method for full control.
 *
 * @returns {{
 *   success: (message: string, options?: Object) => Toast,
 *   danger: (message: string, options?: Object) => Toast,
 *   warning: (message: string, options?: Object) => Toast,
 *   info: (message: string, options?: Object) => Toast,
 *   show: (options?: Object) => Toast
 * }}
 *
 * @example — success toast
 * const toast = useToast();
 *
 * toast.success("Profile updated successfully");
 *
 * @example — error toast
 * const toast = useToast();
 *
 * toast.danger("Failed to save changes", {
 *   duration: 6000,
 *   dismissPrevious: true,
 * });
 *
 * @example — warning toast
 * const toast = useToast();
 *
 * toast.warning("Unsaved changes detected", {
 *   position: "top",
 * });
 *
 * @example — info toast
 * const toast = useToast();
 *
 * toast.info("New update available");
 *
 * @example — custom toast
 * const toast = useToast();
 *
 * toast.show({
 *   message: "Custom notification",
 *   status: "default",
 *   position: "bottom",
 *   showIcon: true,
 *   dismissPrevious: false,
 * });
 */

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
