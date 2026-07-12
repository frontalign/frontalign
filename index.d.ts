/*!
 * FrontAlign v1.0
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

/**
 * Status variant colors used across Alert and Toast components.
 */
export type StatusVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "default";

/**
 * The reason that triggered a modal close event.
 */
export type ModalCloseReason =
  | "dismiss"
  | "confirm"
  | "esc"
  | "backdrop"
  | "guard-exit";

/**
 * Functional type of a Modal instance.
 */
export type ModalType = "alert" | "confirm" | "custom";

// TOAST COMPONENT

export interface ToastOptions {
  /** The text content to display inside the toast. */
  message?: string;
  /** Visual theme and semantic status of the toast. Default: 'default' */
  status?: StatusVariant;
  /** Vertical position of the toast container on the screen. Default: 'bottom' */
  position?: "top" | "bottom";
  /** How long (in ms) the toast stays visible before auto-dismissing. Default: 4000 */
  duration?: number;
  /** If true, removes all existing toasts in the same container before showing this one. Default: false */
  dismissPrevious?: boolean;
  /** Whether to display a status-related icon inside the toast. Default: false */
  showIcon?: boolean;
  /** If true, fully removes the Toast instance from the internal registry after dismissal. Default: false */
  autoClean?: boolean;
}

/**
 * Component for displaying short-lived notifications (Toasts) on the screen.
 * Instantiated via static `Toast.show()`.
 *
 * @example
 * Toast.show({
 *   message: "Data saved successfully!",
 *   status: "success",
 *   position: "top",
 *   duration: 3000
 * });
 */
export class Toast {
  /** Private constructor to enforce the use of `Toast.show()`. */
  private constructor();

  /** Read-only map of all active Toast instances, keyed by their internal ID. */
  static readonly instances: Map<string, Toast>;

  /** Factory method that creates a Toast and immediately mounts it into the DOM. */
  static show(options?: ToastOptions): Toast;

  /** Removes the toast instance immediately from the screen. */
  remove(): void;

  /** Clears internal state and removes this instance from the global registry. */
  dispose(): void;
}

// ALERT COMPONENT

export interface AlertOptions {
  /** The text content to display within the alert. */
  message?: string;
  /** Visual theme and semantic status of the alert. Default: 'default' */
  status?: StatusVariant;
  /** Whether to display a status-related icon. Default: false */
  hasIcon?: boolean;
  /** If true, displays a close button to dismiss the alert. Default: true */
  dismissible?: boolean;
  /** Placement relative to the anchor element. Default: 'before' */
  position?: "before" | "after";
  /** Enables or disables entry/exit transition animations. Default: true */
  animated?: boolean;
  /** The type of animation effect to use during dismiss transitions. Default: 'fade' */
  animation?: "fade" | "slide";
  /** Whether to show a decorative border around the alert box. Default: false */
  bordered?: boolean;
  /** If true, calls `dispose()` after the alert is removed from the DOM. Default: false */
  autoClean?: boolean;
}

/**
 * Component for creating static, dismissible warning or alert messages.
 * Instantiated via static `Alert.create()`.
 *
 * @example
 * Alert.create('#form-container', {
 *   message: 'Please fill out all required fields.',
 *   status: 'danger',
 *   position: 'before',
 *   animation: 'slide'
 * });
 */
export class Alert {
  /** Private constructor to enforce the use of `Alert.create()`. */
  private constructor();

  /** Static factory that creates an Alert instance and immediately mounts it. */
  static create(
    selector: string | Element,
    options?: AlertOptions,
  ): Alert | null;

  /** Cleans internal references and releases memory state. */
  dispose(): void;
}

// MODAL COMPONENT

export interface ModalOptions {
  /** The title text displayed inside the modal header. */
  heading?: string;
  /** The main body text content of the modal. */
  content?: string;
  /** Vertical alignment of the dialog frame on the viewport. Default: 'center' */
  align?: "top" | "center" | "bottom";
  /** If true, releases modal references after closing. Default: false */
  dispose?: boolean;
  /** Text label for the primary dismiss button (Alert modals only). Default: 'OK' */
  dismissText?: string;
  /** Redirect URL triggered when the confirm button is clicked. */
  confirmUrl?: string;
  /** Labels for dual-action confirm modals. */
  actions?: { cancelText?: string; confirmText?: string };
  /** Decorative status icon configuration. */
  icon?: {
    visible?: boolean;
    type?: "none" | "success" | "error" | "warning" | "info";
  };
  /** Disables standard close interactions forcing user to use the guard button. Default: false */
  guardMode?: boolean;
  guardButtonText?: string;
  guardButtonClass?: string;
  guardButtonUrl?: string;
  /** Whether pressing Escape closes the modal. Default: true (false for confirm) */
  closeOnEsc?: boolean;
  /** Whether to render a dark backdrop overlay behind the modal. Default: true */
  backdrop?: boolean;
  /** Whether clicking the backdrop closes the modal. Default: true (false for confirm) */
  backdropClose?: boolean;
  /** If true, automatically moves focus into the modal dialog on open. Default: true */
  focusFirst?: boolean;
  /** CSS selector of a pre-existing DOM element to use as the modal wrapper (Custom modals only). */
  id?: string;

  // Callbacks
  /** Callback executed before the modal opens. Return `false` to cancel. */
  onOpen?: (modalEl: HTMLElement) => boolean | void;
  /** Callback executed after the modal opening animation completes. */
  onOpened?: (modalEl: HTMLElement) => void;
  /** Callback executed before the modal closes. Return `false` to cancel. */
  onClose?: (modalEl: HTMLElement, reason: ModalCloseReason) => boolean | void;
  /** Callback executed after the modal is fully closed. */
  onClosed?: (modalEl: HTMLElement, reason: ModalCloseReason) => void;
}

/**
 * Advanced Promise-based Modal/Dialog component.
 * Instantiated via static methods like `Modal.alert()` or `Modal.confirm()`.
 *
 * @example
 * // Simple alert
 * await Modal.alert({ heading: 'Success', content: 'Process completed.' });
 *
 * @example
 * // Confirm dialog
 * const confirmed = await Modal.confirm({
 *   heading: 'Delete Account',
 *   content: 'Are you absolutely sure?'
 * });
 * if (confirmed) { ... }
 */
export class Modal {
  /** Private constructor to enforce the use of static factory methods. */
  private constructor();

  static readonly TRANSITION_DURATION: number;
  static readonly TRANSITION_BUFFER: number;

  /** Adds a modal request into the shared modal queue. */
  static enqueue(item: any): void;

  /** Opens a promise-based confirm dialog. Returns `true` if confirmed, `false` if cancelled. */
  static confirm(options?: ModalOptions): Promise<boolean>;

  /** Opens a promise-based informational alert modal. */
  static alert(options?: ModalOptions): Promise<void>;

  /** Opens a custom modal using an existing DOM element. */
  static custom(options?: ModalOptions): Promise<void>;

  /** Queued modal variants that open sequentially. Waits for the previous to close. */
  static readonly queue: {
    alert(options?: ModalOptions): Promise<void>;
    confirm(options?: ModalOptions): Promise<boolean>;
  };

  /** Releases modal references and internal memory state. */
  dispose(): void;
}

// CAROUSEL COMPONENT

export interface CarouselAutoplayOptions {
  enabled?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  pauseOnSwipe?: boolean;
}

export interface CarouselThumbnailOptions {
  enabled?: boolean;
  clickable?: boolean;
}

export interface CarouselOptions {
  /** Transition mode. Default: 'slide' */
  mode?: "slide" | "fade";
  autoplay?: CarouselAutoplayOptions;
  controls?: boolean;
  pager?: boolean;
  thumbnails?: CarouselThumbnailOptions;
  swipe?: boolean;
  loop?: boolean;
}

/**
 * Interactive Slider/Carousel component for images or content with swipe support.
 * Instantiated via static `Carousel.create()`.
 *
 * @example
 * const slider = Carousel.create('#hero-slider', {
 *   mode: 'fade',
 *   loop: true,
 *   autoplay: { interval: 5000 }
 * });
 *
 * // Programmatic control
 * slider.next();
 * slider.go(3);
 */
export class Carousel {
  /** Private constructor to enforce the use of `Carousel.create()`. */
  private constructor();

  static defaults: Required<CarouselOptions>;
  /** Read-only map of all active Carousel instances. */
  static readonly instances: Map<string, Carousel>;

  /** Static factory that creates, builds, and returns a carousel instance. */
  static create(
    selector: string | Element,
    options?: CarouselOptions,
  ): Carousel | null;
  /** Retrieves an active Carousel instance by its internal ID. */
  static get(id: string): Carousel | undefined;

  /** Navigates to a specific slide index (1-based). */
  go(index: number): void;
  /** Navigates to the next slide. */
  next(): void;
  /** Navigates to the previous slide. */
  prev(): void;
  /** Fully disposes the carousel instance and removes all event listeners. */
  dispose(): void;
}

// TOOLTIP COMPONENT

export type TooltipPlacement = "auto" | "top" | "bottom" | "left" | "right";

export interface TooltipOptions {
  message?: string;
  placement?: TooltipPlacement;
  hasArrow?: boolean;
  autoClean?: boolean;
}

/**
 * Small informational text box that appears when hovering or focusing an element.
 *
 * @example
 * const tip = new Tooltip('#copy-btn', {
 *   message: 'Copy to clipboard',
 *   placement: 'top'
 * });
 */
export class Tooltip {
  constructor(selector: string | Element, options?: TooltipOptions);
  /** Creates and appends the tooltip element, then makes it visible. */
  create(): void;
  /** Removes the tooltip element from the DOM. */
  remove(): void;
  /** Returns the Tooltip instance currently bound to the given element, if any. */
  static getInstance(element: Element): Tooltip | undefined;
  /** Initializes all tooltips on the page based on the given selector. */
  static init(selector?: string): Tooltip[];
  /** Removes the tooltip and unbinds all event listeners. */
  dispose(): void;
}

// POPOVER COMPONENT

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
export type PopoverTrigger = "click" | "manual";

export interface PopoverOptions {
  /** The title of the popover header. */
  title?: string;
  /** The text content or HTML Node for the popover body. */
  content?: string | Node;
  /** CSS selector for an existing DOM element to use as content. */
  target?: string;
  /** Preferred placement relative to the anchor element. Default: 'auto' */
  placement?: PopoverPlacement;
  /** How the popover is triggered. Default: 'click' */
  trigger?: PopoverTrigger;
  hasArrow?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  /** Distance in pixels between the target element and the popover. Default: 10 */
  offset?: number;
  autoClean?: boolean;
}

/**
 * Content-rich dropdown/popover panel providing more information than a standard Tooltip.
 *
 * @example
 * const popover = new Popover('#info-btn', {
 *   title: 'User Details',
 *   content: 'Additional information goes here.',
 *   placement: 'right-start',
 *   trigger: 'click'
 * });
 */
export class Popover {
  constructor(selector: string | Element, options?: PopoverOptions);
  /** Shows the popover on the screen. */
  show(): void;
  /** Hides the popover. */
  hide(): void;
  /** Toggles the popover visibility state. */
  toggle(): void;
  /** Recalculates and updates the popover's position (useful during scroll/resize). */
  update(): void;
  /** Returns the Popover instance bound to the given element. */
  static getInstance(element: Element): Popover | undefined;
  /** Initializes popovers globally based on the selector. */
  static init(selector?: string): Popover[];
  /** Destroys the popover and removes event listeners. */
  dispose(): void;
}

// SELECT COMPONENT

export interface SelectOptionItem {
  value: string | number;
  name: string;
  icon?: string;
}

export interface SelectOptions {
  inputName?: string;
  /** Enables multi-selection with tag-based display. Default: false */
  multiple?: boolean;
  defaultValue?: string | number | Array<string | number> | null;
  /** Array of option objects populating the dropdown list. */
  data?: SelectOptionItem[];
  /** Renders a text input inside the dropdown for filtering options. Default: false */
  search?: boolean;
  placeholder?: string;
}

/**
 * Custom, searchable, and tag-supported component replacing the standard HTML <select> element.
 *
 * @example
 * const customSelect = new Select('#country-dropdown', {
 *   search: true,
 *   multiple: true,
 *   data: [
 *     { value: 'az', name: 'Azerbaijan' },
 *     { value: 'tr', name: 'Turkey' }
 *   ]
 * });
 */
export class Select {
  static defaults: SelectOptions;
  static variables: { animationDuration: number };

  constructor(selector: string | Element, options?: SelectOptions);
  /** Selects a specific option programmatically. */
  select(opt: SelectOptionItem): void;
  /** Removes a selected option (in multi-select mode). */
  remove(value: string | number): void;
  /** Opens the dropdown panel. */
  open(): void;
  /** Closes the dropdown panel. */
  close(): void;
  /** Toggles the dropdown panel's open/close state. */
  toggle(): void;
  /** Removes the component from the DOM and disconnects observers. */
  dispose(): void;
}

// DARKMODE COMPONENT

export interface DarkModeOptions {
  container?: string;
  customBtn?: string | false;
  autoCreateBtn?: boolean;
}

/**
 * Manages the site's Dark/Light mode. Synchronizes with LocalStorage and System OS preferences.
 *
 * @example
 * const theme = new DarkMode({
 *   autoCreateBtn: true,
 *   container: 'body'
 * });
 *
 * theme.onChange((isDark) => {
 *   console.log('Theme changed to:', isDark ? 'Dark' : 'Light');
 * });
 */
export class DarkMode {
  constructor(options?: DarkModeOptions);
  /** Returns whether dark mode is currently active. */
  isDark(): boolean;
  /** Registers a callback that is invoked whenever the theme changes. */
  onChange(callback: (isDark: boolean) => void): void;
  /** Disposes listeners, observers, and removes generated toggle elements. */
  dispose(): void;
}

// SKELETON COMPONENT

export interface SkeletonErrorOptions {
  message?: string;
  retry?: boolean;
  onRetry?: (el: HTMLElement) => void;
}

/**
 * Animated "Skeleton" loading effect component displayed while data is fetching.
 * Utility class exposing static methods only.
 *
 * @example
 * const el = document.querySelector('#data-card');
 *
 * // Show skeleton
 * Skeleton.show(el);
 *
 * // Wrap async API call
 * await Skeleton.wrap(el, async () => {
 *   const data = await fetchAPI();
 *   render(data);
 * });
 */
export class Skeleton {
  /** Private constructor to prevent instantiation. */
  private constructor();

  /** Activates the skeleton loading state on the given element. */
  static show(el: HTMLElement): void;
  /** Deactivates the skeleton and reveals the element's actual content. */
  static hide(el: HTMLElement): void;
  /** Shows an error state on the element, replacing the active skeleton. */
  static error(el: HTMLElement, opts?: SkeletonErrorOptions): void;
  /** Wrapper: activates skeleton → awaits asyncFn() → hides skeleton. Shows error on throw. */
  static wrap<T = unknown>(
    el: HTMLElement,
    asyncFn: () => Promise<T>,
    opts?: SkeletonErrorOptions,
  ): Promise<T>;
  /** Boot method. Activates all existing `[data-skeleton]` elements in the DOM and observes new ones. */
  static mount(): void;
}

// LAZY IMAGE COMPONENT

/**
 * Provides automatic lazy loading for images as the user scrolls down the page.
 * Utility class exposing static methods only.
 *
 * @example
 * // Starts observing all <img data-src="..."> tags
 * LazyImage.observe();
 *
 * // Observe a custom selector
 * LazyImage.observe('.my-gallery-img[data-src]');
 */
export class LazyImage {
  /** Private constructor to prevent instantiation. */
  private constructor();

  /** Immediately loads a single lazy image element and handles shimmer/error states. */
  static load(img: HTMLImageElement): void;
  /** Sets up automatic lazy loading for all matching images in the DOM. */
  static observe(selector?: string): void;
}

// FRONTALIGN CONFIG & MAIN CLASS

export interface FontConfig {
  family: string;
  weights?: number | number[];
  category?: string;
  alias?: string;
}

export type CustomClassDefinition =
  | string
  | (Record<string, string> & { dark?: Record<string, string> });

export interface FrontAlignThemeConfig {
  body?: string;
  bodyText?: string;
  primary?: string;
  primaryContrast?: string;
  font?: string;
  fontMono?: string;
  spaceXs?: string;
  spaceSm?: string;
  spaceMd?: string;
  spaceLg?: string;
  spaceXl?: string;
  space2xl?: string;
  /** Arbitrary additional CSS custom properties (--custom-var) injected into `:root`. */
  extend?: Record<string, string>;
  /** Dark mode token overrides injected under `[fa-theme="dark"]`. */
  dark?: Omit<FrontAlignThemeConfig, "dark">;
}

export interface FrontAlignConfig {
  theme?: FrontAlignThemeConfig;
  classes?: Record<string, CustomClassDefinition>;
  fonts?: FontConfig[];
}

/**
 * Central FrontAlign runtime object.
 * Initializes all components, lazy loaders, and applies CSS/Theme configurations.
 *
 * @example
 * import { FrontAlign } from 'frontalign';
 *
 * const fa = new FrontAlign({
 *   theme: {
 *     primary: '#ff5722',
 *     font: 'Inter, sans-serif'
 *   }
 * });
 *
 * // Programmatic access
 * fa.toast.show({ message: 'Welcome!' });
 */
export class FrontAlign {
  constructor(config?: FrontAlignConfig);

  readonly config: FrontAlignConfig;

  /** The Modal class reference. Allows calling `fa.modal.alert()`. */
  readonly modal: typeof Modal;
  /** The Toast class reference. Allows calling `fa.toast.show()`. */
  readonly toast: typeof Toast;
  /** The Carousel class reference. Allows calling `fa.carousel.create()`. */
  readonly carousel: typeof Carousel;
  /** Alert factory object. Allows calling `fa.alert.create()`. */
  readonly alert: {
    create(selector: string | Element, options?: AlertOptions): Alert | null;
  };
  /** The DarkMode class reference. */
  readonly darkMode: typeof DarkMode;
  /** The Select class reference. */
  readonly select: typeof Select;
  /** The Skeleton class reference. */
  readonly skeleton: typeof Skeleton;
  /** The Tooltip class reference. */
  readonly tooltip: typeof Tooltip;
  /** The Popover class reference. */
  readonly popover: typeof Popover;

  /** Fully disposes the FrontAlign runtime, disconnects observers, and destroys loaded components. */
  dispose(): void;
}
