/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import { useCallback } from "react";
import Modal from "../js/components/Modal.js";

export function useModal() {
  const alert = useCallback((options = {}) => {
    return Modal.alert(options);
  }, []);

  const confirm = useCallback((options = {}) => {
    return Modal.confirm(options);
  }, []);

  const custom = useCallback((options = {}) => {
    return Modal.custom(options);
  }, []);

  const queueAlert = useCallback((options = {}) => {
    return Modal.queue.alert(options);
  }, []);

  const queueConfirm = useCallback((options = {}) => {
    return Modal.queue.confirm(options);
  }, []);

  return {
    alert,
    confirm,
    custom,
    queue: {
      alert: queueAlert,
      confirm: queueConfirm,
    },
  };
}
