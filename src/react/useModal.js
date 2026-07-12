import { useCallback } from "react";
import Modal from "../js/components/Modal.js";
/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */
/**
 * useModal
 * Promise-based modal hook.
 * Mirrors Modal.alert(), Modal.confirm(), Modal.custom()
 * and Modal.queue API.
 *
 * Returns:
 *   alert(options)          → Promise<void>
 *   confirm(options)        → Promise<true | false>
 *   custom(options)         → Promise<void>
 *   queue.alert(options)    → Promise<void>   (queued)
 *   queue.confirm(options)  → Promise<true | false> (queued)
 *
 * @example — alert
 * const { alert } = useModal();
 * await alert({ heading: 'Done', content: 'Saved successfully.' });
 *
 * @example — confirm
 * const { confirm } = useModal();
 * const confirmed = await confirm({ heading: 'Delete?', content: 'This cannot be undone.' });
 * if (confirmed) { ... }
 *
 * @example — custom
 * const { custom } = useModal();
 * await custom({ id: '#my-modal' });
 *
 * @example — queue
 * const { queue } = useModal();
 * await queue.alert({ heading: 'Step 1' });
 * await queue.confirm({ heading: 'Step 2' });
 */

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
