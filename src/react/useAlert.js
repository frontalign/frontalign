import { useCallback } from "react";
import Alert from "../js/components/Alert.js";

/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

/**
 * useAlert
 * Dynamically creates and inserts alert elements into the DOM.
 * Returns status-based methods for quick usage.
 *
 * @returns {{ success, danger, warning, info, show }}
 *
 * @param {string}  selector                  — Target element selector (alert inserts before/after it)
 * @param {Object}  [options]
 * @param {string}  [options.message]         — Alert text
 * @param {string}  [options.position]        — 'before' | 'after' (default: 'before')
 * @param {boolean} [options.dismissible]     — Show close button (default: true)
 * @param {boolean} [options.hasIcon]         — Show status icon (default: false)
 * @param {boolean} [options.animated]        — Enable animation (default: true)
 * @param {string}  [options.animation]      — 'fade' | 'slide' (default: 'fade')
 * @param {boolean} [options.bordered]        — Show border (default: false)
 * @param {boolean} [options.autoClean]       — Dispose after dismiss (default: false)
 *
 * @example
 * const alert = useAlert();
 * alert.success('#form-container', { message: 'Saved!' });
 * alert.danger('#form-container', { message: 'Error!' });
 * alert.show('#form-container', { message: '...', status: 'default' });
 */
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
