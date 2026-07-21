/*!
 * FrontAlign v1.0.6
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

// Delegate hooks — attach event listeners to document
export { useNavbar } from "./useDelegates.js";
export { useDrawer } from "./useDelegates.js";
export { useDropdown } from "./useDelegates.js";
export { useCollapse } from "./useDelegates.js";
export { useAccordion } from "./useDelegates.js";
export { useAlertDismiss } from "./useDelegates.js";
export { useForm } from "./useDelegates.js";

// Ref-based hooks — return a ref to attach to DOM element
export { useTabview } from "./useComponents.js";
export { useSwiper } from "./useComponents.js";
export { useBadge } from "./useComponents.js";

// Imperative hooks — dynamic DOM creation
export { useAlert } from "./useAlert.js";
export { useCarousel } from "./useCarousel.js";
export { useTooltip } from "./useTooltip.js";
export { useSelect } from "./useSelect.js";
export { useSkeleton } from "./useSkeleton.js";
export { usePopover } from "./usePopover.js";

// Utility hooks
export { useModal } from "./useModal.js";
export { useToast } from "./useToast.js";
export { useDarkMode } from "./useDarkMode.js";
export { useRange } from "./useRange.js";
