/*!
 * FrontAlign v1.0.6
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useEffect } from "react";
import Components from "../js/core/Component.js";
import Form from "../js/components/Form.js";

/**
 * useNavbar
 * Initializes responsive navbar toggle interactions.
 * Attaches a delegated click listener to document.body.
 */
export function useNavbar() {
  useEffect(() => {
    const dispose = Components.navbar();
    return () => dispose?.();
  }, []);
}

/**
 * useDrawer
 * Initializes drawer/offcanvas open-close behavior.
 * Handles click, keyboard (Escape), focus trap and body scroll lock.
 */
export function useDrawer() {
  useEffect(() => {
    const dispose = Components.drawer();
    return () => dispose?.();
  }, []);
}

/**
 * useDropdown
 * Initializes dropdown click and hover interactions
 * with accessibility (aria-expanded, Escape key) support.
 */
export function useDropdown() {
  useEffect(() => {
    const dispose = Components.dropdown();
    return () => dispose?.();
  }, []);
}

/**
 * useCollapse
 * Initializes collapsible elements with
 * slide/fade animations and accordion group support.
 */
export function useCollapse() {
  useEffect(() => {
    const dispose = Components.collapse();
    return () => dispose?.();
  }, []);
}

/**
 * useAccordion
 * Initializes accessible accordion interactions
 * with animated open/close behavior.
 */
export function useAccordion() {
  useEffect(() => {
    const dispose = Components.accordion();
    return () => dispose?.();
  }, []);
}

/**
 * useAlert
 * Initializes dismissible alert components
 * with persistence (localStorage) and animation support.
 */
export function useAlertDismiss() {
  useEffect(() => {
    const dispose = Components.alert();
    return () => dispose?.();
  }, []);
}

/**
 * useForm
 * Initializes form validation, file upload helpers,
 * floating labels and range slider interactions.
 */
export function useForm() {
  useEffect(() => {
    const dispose = Form.init();
    return () => dispose?.();
  }, []);
}
