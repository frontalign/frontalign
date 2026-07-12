/*!
 * FrontAlign v1.0.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import type { RefObject, ReactNode } from "react";

// HTML ATTRIBUTE AUGMENTATION

declare module "react" {
  interface HTMLAttributes<T> {
    /** Marks an element as a FrontAlign observer-based component. */
    "fa-component"?:
      | "swiper"
      | "badge"
      | "tabview"
      | "tooltip"
      | "popover"
      | "accordion"
      | "form"
      | "alert"
      | "range";
    /** Marks an element as a FrontAlign delegate-driven toggle. */
    "fa-toggle"?:
      | "navbar"
      | "drawer"
      | "collapse"
      | "dropdown"
      | "accordion"
      | "popover";
    /** CSS selector of the target element. Used by Navbar, Drawer, Collapse. */
    "data-target"?: string;
    /** Trigger mode for Collapse or Dropdown. */
    "data-trigger"?: "click" | "hover" | "manual";
    /** Animation type for Collapse. */
    "data-animation"?: "slide" | "fade";
    /** CSS selector of a parent container — closes sibling collapses when one opens. */
    "data-parent"?: string;

    // Accordion 
    /** If 'false', allows multiple accordion items to be open simultaneously. Default: 'true'. */
    "data-single-open"?: "true" | "false";
    /** If 'true', keeps the first accordion item open on initialization. */
    "data-open-stay"?: "true" | "false";

    // Tabview
    /** CSS selector of the panel this tab controls. Example: '#panel-1'. */
    "data-tab"?: string;

    // Badge
    /** Numeric count value to display. Values ≥ 100 render as '99+'. */
    "data-count"?: string | number;

    // Alert
    /** If 'true', persists dismissal in localStorage so the alert won't reappear. */
    "data-persistent"?: "true" | "false";
    /** Unique key used with data-persistent to remember dismissed state. */
    "data-alert"?: string;

    // LazyImage
    /** Deferred image source URL. Loads when element enters the viewport. */
    "data-src"?: string;
    /** Fallback error message shown when the image fails to load. */
    "data-error-text"?: string;

    // Form 
    /** Space-separated FrontAlign validation rules. Example: 'email min:5 match:#password'. */
    "data-rule"?: string;
    /** Custom error message displayed when a required field is left empty. */
    "data-required-msg"?: string;
    /** Custom error message displayed when a validation rule or regex pattern fails. */
    "data-error-msg"?: string;
    /** Regular expression pattern used for custom field validation. */
    "data-regex"?: string;
    /** If present, prevents the automatic generation of a validation feedback element for this field. */
    "data-no-feedback"?: boolean | "true" | "false" | string;
    /** If 'true', intercepts the submit event and sends the form data via AJAX (Fetch API). */
    "data-ajax"?: boolean | "true" | "false" | string;
    /** Custom headers for the AJAX request, formatted as a JSON string. Example: '{"X-CSRF-Token":"..."}'. */
    "data-ajax-headers"?: string;
    /** Maximum timeout for the AJAX request in milliseconds. Default: 30000 (30 seconds). */
    "data-ajax-timeout"?: string | number;
    /** Default placeholder text displayed in custom file inputs when no file is selected. */
    "data-default-text"?: string;

    // Skeleton
    /** Activates the skeleton loading overlay on this element. */
    "data-skeleton"?: string;
    /** Skeleton layout preset. */
    "data-skeleton-layout"?: "auto" | "card" | "list" | "article" | "profile";
    /** Number of columns for 'card' layout. */
    "data-skeleton-cols"?: string | number;
    /** Number of rows for 'card' or 'list' layout. */
    "data-skeleton-rows"?: string | number;
    /** If 'false', prevents automatic skeleton activation on mount. */
    "data-skeleton-auto"?: "true" | "false";
    /** Excludes this child element from the skeleton visibility overlay. */
    "data-skeleton-ignore"?: string;
  }
}

// PRIMITIVE TYPES

/** Status variants shared across Alert, Toast, Modal icon types. */
export type StatusVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "default";

/** Opaque Toast instance returned by useToast methods. */
export interface Toast {
  /** Programmatically dismiss this toast. */
  dismiss(): void;
}

/** Select instance returned via useSelect — exposes the full public API. */
export interface SelectInstance {
  /** Select an option programmatically. */
  select(opt: SelectOption): void;
  /** Remove a selected option by value (multi-select). */
  remove(value: string | number): void;
  /** Open the dropdown panel. */
  open(): void;
  /** Close the dropdown panel. */
  close(): void;
  /** Toggle the dropdown panel open/closed. */
  toggle(): void;
  /** Destroy the instance and remove all event listeners from the DOM. */
  dispose(): void;
}

// OPTION INTERFACES

export interface DarkModeOptions {
  /** Selector of the element to mount the auto-created toggle button into. Default: 'body'. */
  container?: string;
  /** Selector of a custom toggle button. Set to false to disable. Default: false. */
  customBtn?: string | false;
  /** Automatically create and inject a toggle button. Default: true. */
  autoCreateBtn?: boolean;
  /** Callback fired whenever the theme changes. */
  onChange?: (isDark: boolean) => void;
}

export interface TooltipOptions {
  /** Tooltip display text. */
  message?: string;
  /** Preferred placement relative to the trigger element. Default: 'auto'. */
  placement?: "auto" | "top" | "bottom" | "left" | "right";
  /** Interaction that triggers the tooltip. Default: 'hover'. */
  trigger?: "hover" | "click" | "focus" | "manual";
  /** Render a directional arrow on the tooltip bubble. Default: true. */
  hasArrow?: boolean;
  /** Automatically dispose the instance after the first hide. Default: false. */
  autoClean?: boolean;
}

export type PopoverPlacement =
  | "auto"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

export interface PopoverOptions {
  /** The title of the popover header. */
  title?: string;
  /** The text content or HTML Node for the popover body. */
  content?: string | ReactNode | Node;
  /** CSS selector for an existing DOM element to use as content. */
  target?: string;
  /** Preferred placement relative to the anchor element. Default: 'auto' */
  placement?: PopoverPlacement;
  /** How the popover is triggered. Default: 'click' */
  trigger?: "click" | "manual";
  hasArrow?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  /** Distance in pixels between the target element and the popover. Default: 10 */
  offset?: number;
  autoClean?: boolean;
}

export interface SelectOption {
  value: string | number;
  name: string;
  /** Optional icon HTML or URL rendered beside the option label. */
  icon?: string;
}

export interface SelectOptions {
  /** Static option data. */
  data?: SelectOption[];
  /** Enable multi-select mode. Default: false. */
  multiple?: boolean;
  /** Render a search input inside the dropdown. Default: false. */
  search?: boolean;
  /** Placeholder label when no value is selected. Default: '--SELECT--'. */
  placeholder?: string;
  /** Name attribute of the underlying hidden input. Default: 'select'. */
  inputName?: string;
  /** Pre-selected value(s) on initialization. */
  defaultValue?: string | number | Array<string | number>;
  /** Fired whenever the selected value changes. */
  onChange?: (value: string) => void;
}

export interface AlertOptions {
  /** Alert body text. */
  message?: string;
  /** Visual status variant. Default: 'default'. */
  status?: StatusVariant;
  /** Show a status icon. Default: false. */
  hasIcon?: boolean;
  /** Render a dismiss (×) button. Default: true. */
  dismissible?: boolean;
  /** Insert position relative to the target element. Default: 'before'. */
  position?: "before" | "after";
  /** Enable entrance animation. Default: true. */
  animated?: boolean;
  /** Animation style. Default: 'fade'. */
  animation?: "fade" | "slide";
  /** Render a left-side status border. Default: false. */
  bordered?: boolean;
  /** Remove the element from the DOM after dismissal. Default: false. */
  autoClean?: boolean;
}

export interface ModalOptions {
  /** Modal title text. */
  heading?: string;
  /** Modal body HTML or text. */
  content?: string | ReactNode;
  /** Vertical alignment of the modal dialog. Default: 'center'. */
  align?: "top" | "center" | "bottom";
  /** Destroy the modal element after it closes. Default: false. */
  dispose?: boolean;
  /** Text of the dismiss anchor rendered below the modal. */
  dismissText?: string;
  /** URL navigated to when the confirm button is clicked. */
  confirmUrl?: string;
  /** Labels for the cancel and confirm action buttons. */
  actions?: {
    cancelText?: string;
    confirmText?: string;
  };
  /** Status icon displayed inside the modal. */
  icon?: {
    visible?: boolean;
    type?: "none" | "success" | "error" | "warning" | "info";
  };
  /** Require the user to click a guard button before the modal closes. */
  guardMode?: boolean;
  guardButtonText?: string;
  guardButtonClass?: string;
  guardButtonUrl?: string;
  /** Close the modal when the Escape key is pressed. Default: true. */
  closeOnEsc?: boolean;
  /** Render the backdrop overlay. Default: true. */
  backdrop?: boolean;
  /** Close the modal when the backdrop is clicked. Default: true. */
  backdropClose?: boolean;
  /** Focus the first focusable element inside the modal on open. Default: true. */
  focusFirst?: boolean;
  /** CSS selector of a pre-existing custom modal element. */
  id?: string;
}

export interface ToastOptions {
  /** Toast body text. */
  message?: string;
  /** Visual status variant. Default: 'default'. */
  status?: StatusVariant;
  /** Screen position of the toast stack. Default: 'bottom'. */
  position?: "top" | "bottom";
  /** Auto-dismiss delay in milliseconds. Default: 4000. */
  duration?: number;
  /** Dismiss any currently visible toast before showing this one. Default: false. */
  dismissPrevious?: boolean;
  /** Show a status icon beside the message. Default: true. */
  showIcon?: boolean;
  /** Remove the toast element from the DOM after dismissal. Default: false. */
  autoClean?: boolean;
}

export interface SkeletonErrorOptions {
  /** Error message rendered inside the skeleton error state. */
  message?: string;
  /** Show a retry button inside the error state. Default: false. */
  retry?: boolean;
  /** Callback invoked when the retry button is clicked. */
  onRetry?: (el: HTMLElement) => void;
}

export interface CarouselOptions {
  /** Slide transition style. Default: 'slide'. */
  mode?: "slide" | "fade";
  /** Show previous / next control buttons. Default: true. */
  controls?: boolean;
  /** Show dot pager indicators. Default: true. */
  pager?: boolean;
  /** Loop back to the first slide after the last. Default: true. */
  loop?: boolean;
  /** Enable touch / pointer swipe gestures. Default: true. */
  swipe?: boolean;
  autoplay?: {
    /** Enable auto-advance. Default: true. */
    enabled?: boolean;
    /** Advance interval in milliseconds. Default: 4000. */
    interval?: number;
    /** Pause auto-advance while the cursor is over the carousel. Default: true. */
    pauseOnHover?: boolean;
    /** Pause auto-advance during a swipe gesture. Default: true. */
    pauseOnSwipe?: boolean;
  };
  thumbnails?: {
    /** Render a thumbnail strip. Default: false. */
    enabled?: boolean;
    /** Make thumbnails clickable to jump to that slide. Default: true. */
    clickable?: boolean;
  };
}

// HOOK RETURN TYPES

export interface AlertAPI {
  /** Insert an alert with full option control. */
  show(selector: string, options?: AlertOptions): HTMLElement | undefined;
  success(
    selector: string,
    options?: Omit<AlertOptions, "status">,
  ): HTMLElement | undefined;
  danger(
    selector: string,
    options?: Omit<AlertOptions, "status">,
  ): HTMLElement | undefined;
  warning(
    selector: string,
    options?: Omit<AlertOptions, "status">,
  ): HTMLElement | undefined;
  info(
    selector: string,
    options?: Omit<AlertOptions, "status">,
  ): HTMLElement | undefined;
}

export interface CarouselAPI<T extends HTMLElement = any> {
  /** React ref — attach to the carousel root element. */
  ref: RefObject<T | null>;
  /** Advance to the next slide. */
  next(): void;
  /** Return to the previous slide. */
  prev(): void;
  /** Jump to a specific slide by zero-based index. */
  go(index: number): void;
}

export interface SkeletonAPI<T extends HTMLElement = any> {
  /** Attach to the skeleton host element. */
  ref: RefObject<T | null>;
  /** Activate the skeleton overlay. */
  show(): void;
  /** Deactivate the skeleton overlay and reveal content. */
  hide(): void;
  /** Transition the skeleton into an error state. */
  error(opts?: SkeletonErrorOptions): void;
  /**
   * Wrap an async function: auto show → hide on resolve, error on reject.
   * Returns the same Promise so callers can await it.
   */
  wrap<R = unknown>(
    asyncFn: () => Promise<R>,
    opts?: SkeletonErrorOptions,
  ): Promise<R> | undefined;
}

export interface ModalAPI {
  /** Display an informational alert modal. Resolves when closed. */
  alert(options?: ModalOptions): Promise<void>;
  /** Display a confirmation modal. Resolves with true (confirmed) or false (cancelled). */
  confirm(options?: ModalOptions): Promise<boolean>;
  /** Open a fully custom modal by selector. Resolves when closed. */
  custom(options?: ModalOptions): Promise<void>;
  queue: {
    /** Queue an alert modal to show after any currently open modal closes. */
    alert(options?: ModalOptions): Promise<void>;
    /** Queue a confirm modal. Resolves with the user's choice. */
    confirm(options?: ModalOptions): Promise<boolean>;
  };
}

export interface ToastAPI {
  success(
    message: string,
    options?: Omit<ToastOptions, "status" | "message">,
  ): Toast;
  danger(
    message: string,
    options?: Omit<ToastOptions, "status" | "message">,
  ): Toast;
  warning(
    message: string,
    options?: Omit<ToastOptions, "status" | "message">,
  ): Toast;
  info(
    message: string,
    options?: Omit<ToastOptions, "status" | "message">,
  ): Toast;
  /** Show a toast with full option control. */
  show(options?: ToastOptions): Toast;
}

export interface SelectAPI {
  /** Ref holding the underlying Select instance. */
  instance: RefObject<SelectInstance | null>;
}

export interface DarkModeAPI {
  /** Returns true if dark mode is currently active. */
  isDark(): boolean;
}

// DELEGATE HOOKS

/** Initializes responsive navbar toggle interactions. */
export declare function useNavbar(): void;
/** Initializes drawer / offcanvas open-close behavior with focus trap and scroll lock. */
export declare function useDrawer(): void;
/** Initializes dropdown click and hover interactions with full ARIA support. */
export declare function useDropdown(): void;
/** Initializes collapsible elements with slide / fade animations and accordion group support. */
export declare function useCollapse(): void;
/** Initializes accessible accordion interactions with animated open/close behavior. */
export declare function useAccordion(): void;
/** Initializes dismissible static alert components with optional localStorage persistence. */
export declare function useAlertDismiss(): void;
/** Initializes form validation, file upload helpers, floating labels and range sliders. */
export declare function useForm(): void;

// REF-BASED HOOKS
// Return a React ref. Attach the ref to the target DOM element.

/** Initializes tabview tab-switching with animated underline and ResizeObserver cleanup. */
export declare function useTabview<
  T extends HTMLElement = any,
>(): RefObject<T | null>;
/** Initializes pointer-based drag / swipe behavior on a scroll container. */
export declare function useSwiper<
  T extends HTMLElement = any,
>(): RefObject<T | null>;
/**
 * Formats badge counters and caps values ≥ 100 at "99+".
 * Re-runs whenever `count` changes.
 */
export declare function useBadge<T extends HTMLElement = any>(
  count?: number | string,
): RefObject<T | null>;

/**
 * Attaches a Tooltip to the returned ref element.
 *
 * @example
 * const tipRef = useTooltip({ message: 'Copy', placement: 'top' });
 * <button ref={tipRef}>Copy</button>
 */
export declare function useTooltip<T extends HTMLElement = any>(
  options?: TooltipOptions,
): RefObject<T | null>;

/**
 * Attaches a Popover to the returned ref element.
 *
 * @example
 * const popoverRef = usePopover({ title: 'Info', content: 'Details here' });
 * <button ref={popoverRef}>Info</button>
 */
export declare function usePopover<T extends HTMLElement = any>(
  options?: PopoverOptions,
): RefObject<T | null>;

// IMPERATIVE HOOKS

/**
 * Dynamically creates and inserts alert elements adjacent to a target selector.
 *
 * @example
 * const alert = useAlert();
 * alert.success('#form', { message: 'Saved!' });
 */
export declare function useAlert(): AlertAPI;

/**
 * Initializes a Carousel on a ref or CSS selector with imperative controls.
 *
 * @example — ref (recommended)
 * const { ref, next, prev } = useCarousel(null, { loop: true });
 * <div className="carousel" ref={ref}>...</div>
 *
 * @example — selector (legacy / interop)
 * useCarousel('#hero', { autoplay: { interval: 3000 } });
 */
export declare function useCarousel<T extends HTMLElement = any>(
  target?: RefObject<T | null> | string | null,
  options?: CarouselOptions,
): CarouselAPI<T>;

/**
 * Initializes a custom select on a CSS selector or React ref.
 * Returns the underlying Select instance ref for advanced control.
 *
 * @example — ref
 * const ref = useRef(null);
 * useSelect(ref, { multiple: true, search: true });
 * <select ref={ref} />
 */
export declare function useSelect<
  T extends HTMLSelectElement | HTMLElement = any,
>(target: string | RefObject<T | null>, options?: SelectOptions): SelectAPI;

/**
 * Binds Skeleton loading state to a ref element.
 * Exposes full lifecycle control: show, hide, error, wrap.
 *
 * @example — wrap (recommended)
 * const { ref, wrap } = useSkeleton();
 * useEffect(() => { wrap(() => fetchData()); }, []);
 * <div ref={ref} data-skeleton-layout="list">...</div>
 */
export declare function useSkeleton<
  T extends HTMLElement = any,
>(): SkeletonAPI<T>;

/**
 * Promise-based modal hook. Supports alert, confirm, custom, and queued modals.
 *
 * @example
 * const { alert, confirm } = useModal();
 * const ok = await confirm({ heading: 'Delete?', content: 'Cannot be undone.' });
 */
export declare function useModal(): ModalAPI;

/**
 * Displays toast notifications with status-based convenience methods.
 *
 * @example
 * const toast = useToast();
 * toast.success('Saved!');
 * toast.danger('Failed.', { duration: 6000 });
 */
export declare function useToast(): ToastAPI;

/**
 * Initializes dark mode with optional auto-created or custom toggle button.
 *
 * @example
 * const { isDark } = useDarkMode({ customBtn: '#toggle', onChange: setDark });
 */
export declare function useDarkMode(options?: DarkModeOptions): DarkModeAPI;
