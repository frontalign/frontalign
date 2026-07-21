/*!
 * FrontAlign v1.0.6
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import Debug from "./Debug.js";
import Components from "./Component.js";
import { faConfig } from "./Config.js";
import Carousel from "../components/Carousel.js";
import Modal from "../components/Modal.js";
import Alert from "../components/Alert.js";
import Select from "../components/Select.js";
import Tooltip from "../components/Tooltip.js";
import Toast from "../components/Toast.js";
import DarkMode from "../components/DarkMode.js";
import Skeleton from "../components/Skeleton.js";
import LazyImage from "../components/LazyImage.js";
import Popover from "../components/Popover.js";
import Form from "../components/Form.js";
import Range from "../components/Range.js";

export default class FrontAlign {
  /**
   * Initializes the framework runtime
   * and automatically registers components.
   */
  constructor(config = {}) {
    //SSR Guard
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    // Debug Mode
    if (config.debug) Debug.enable();

    this.Registry = {
      delegate: {
        navbar: Components.navbar,
        collapse: Components.collapse,
        dropdown: Components.dropdown,
        drawer: Components.drawer,
        accordion: Components.accordion,
        alert: Components.alert,
        form: Form.init,
      },
      lazy: {
        swiper: Components.swiper,
        badge: Components.badge,
        tabview: Components.tabview,
        tooltip: (el) => new Tooltip(el),
        popover: (el) => new Popover(el),
        range: (el) => new Range(el),
      },
    };

    this.config = config;
    faConfig(config);
    // Public component APIs
    /**
     * Modal
     */
    this.modal = Modal;

    /**
     * Toast
     */
    this.toast = Toast;

    /**
     * Carousel
     */
    this.carousel = Carousel;

    /**
     * Alert
     */
    this.alert = {
      create: Alert.create,
    };

    /**
     * DarkMode
     */
    this.darkMode = DarkMode;

    /**
     * Select
     */
    this.select = Select;

    /**
     * Skeleton
     */
    this.skeleton = Skeleton;

    /**
     * Tooltip
     */
    this.tooltip = Tooltip;

    /**
     * Popover
     */
    this.popover = Popover;

    /**
     * Form
     */
    this.form = Form;
    /**
     * Range
     */
    this.range = Range;

    // Stores instances created by lazy-loaded components
    this.componentInstances = new Set();
    this.loadedComponents = new WeakSet();
    this.observer = this._setupObserver();
    this.mutationObserver = this._setupMutationObserver();
    this.startObserving(document.body);
    this._init();
  }

  /**
   * Bootstraps delegated and auto-loaded components.
   */
  _init() {
    if (typeof document === "undefined") return;

    this._disposeMap = new Map();

    for (const name in this.Registry.delegate) {
      const dispose = this.Registry.delegate[name]?.();
      if (typeof dispose === "function") {
        this._disposeMap.set(`delegate:${name}`, dispose);
      }
    }

    document.querySelectorAll("[fa-component]").forEach((el) => {
      const name = el.getAttribute("fa-component");
      if (this.Registry.lazy[name]) {
        this.observeElement(el);
      }
    });
    document
      .querySelectorAll("img[data-src]")
      .forEach((img) => this.observeElement(img));
  }

  /**
   * Creates the shared IntersectionObserver
   * used for lazy component initialization.
   */
  _setupObserver() {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !this.loadedComponents.has(entry.target)
          ) {
            const el = entry.target;
            // Call LazyLoadImage function
            if (el.tagName === "IMG" && el.dataset.src) {
              LazyImage.load(el);
              this.loadedComponents.add(el);
              this.observer.unobserve(el);
              return;
            }
            // Call all components based functions
            if (el._faCallback && typeof el._faCallback === "function") {
              el._faCallback(el);
              this.loadedComponents.add(el);
              this.observer.unobserve(el);
              return;
            }
            this._handleVisibleComponent(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "100px 0px", threshold: 0.1 },
    );
  }

  /**
   * Creates the MutationObserver used to
   * detect dynamically added DOM elements.
   */
  _setupMutationObserver() {
    return new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1 || this.loadedComponents.has(node)) return;
          if (node.hasAttribute("fa-component")) {
            const name = node.getAttribute("fa-component");
            if (this.Registry.lazy[name]) {
              this.observeElement(node);
            }
          }
          if (node.tagName === "IMG" && node.dataset.src) {
            this.observeElement(node);
          }
          node.querySelectorAll?.("[fa-component]").forEach((child) => {
            if (!this.loadedComponents.has(child)) {
              const name = child.getAttribute("fa-component");
              if (this.Registry.lazy[name]) {
                this.observeElement(child);
              }
            }
          });
          node.querySelectorAll?.("img[data-src]").forEach((img) => {
            if (!this.loadedComponents.has(img)) {
              this.observeElement(img);
            }
          });
        });
      });
    });
  }

  /**
   * Initializes a component once it
   * becomes visible in the viewport.
   */
  _handleVisibleComponent(element) {
    const componentName = element.getAttribute("fa-component");
    this._initializeComponent(componentName, element);
  }

  /**
   * Executes a component initializer
   * based on its fa-component attribute.
   */
  _initializeComponent(name, element) {
    const component = this.Registry.lazy[name];

    if (typeof component === "function") {
      const instance = component(element);

      if (instance && typeof instance.dispose === "function") {
        this.componentInstances.add(instance);
      }

      this.loadedComponents.add(element);
      return instance;
    }

    console.error(`FrontAlign: lazy component not found: ${name}`);
    return null;
  }

  /**
   * Registers an element for lazy observation.
   */
  observeElement(element) {
    if (!this.loadedComponents.has(element)) {
      this.observer.observe(element);
    }
  }

  /**
   * Starts observing DOM mutations
   * inside the provided container.
   */
  startObserving(container) {
    if (container) {
      this.mutationObserver.observe(container, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * Fully disposes the FrontAlign runtime,
   * observers and auto-loaded components.
   */
  dispose() {
    this.observer.disconnect();
    this.mutationObserver.disconnect();
    this._disposeMap?.forEach((fn) => fn());
    this._disposeMap?.clear();

    this.componentInstances?.forEach((instance) => {
      instance.dispose?.();
    });

    this.componentInstances?.clear();
    this.loadedComponents = null;
  }
}
