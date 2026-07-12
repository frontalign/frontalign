/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import Toast from "../components/Toast.js";
import ScrollBarHelper from "../utils/ScrollBarHelper.js";
import DomUtils from "../utils/DomUtils.js";
export default class Components {
  /**
   * Initializes responsive navbar toggle interactions.
   * Returns a cleanup disposer function.
   */
  static navbar() {
    const _config = {
      trigger: '[fa-toggle="navbar"]',
      menuSelector: ".navbar-menu",
      toggleClass: "is-active",
      lockMap: new WeakMap(),
    };

    const handler = async (e) => {
      const btn = e.target.closest(_config.trigger);
      if (!btn) return;

      e.preventDefault();
      const targetSelector = btn.getAttribute("data-target");
      if (!targetSelector) return;

      const menu = document.querySelector(targetSelector);
      if (!menu) return;

      if (_config.lockMap.get(menu)) return;
      _config.lockMap.set(menu, true);

      const isOpen = btn.classList.contains(_config.toggleClass);

      document.querySelectorAll(_config.menuSelector).forEach((el) => {
        if (el !== menu)
          DomUtils.slideUp(el).finally(() => _config.lockMap.set(el, false));
      });
      document.querySelectorAll(_config.trigger).forEach((el) => {
        if (el !== btn) el.classList.remove(_config.toggleClass);
      });

      if (isOpen) {
        btn.classList.remove(_config.toggleClass);
        await DomUtils.slideUp(menu, 300);
      } else {
        btn.classList.add(_config.toggleClass);
        await DomUtils.slideDown(menu, 300, "flex");
        const disposeEsc = DomUtils.closeOnEscape(menu, btn, 300);
        menu._disposeEsc = disposeEsc;
      }

      _config.lockMap.set(menu, false);
    };

    document.body.addEventListener("click", handler);
    return () => document.body.removeEventListener("click", handler);
  }

  /**
   * Initializes dismissible alert components
   * with persistence and animation support.
   * Returns a cleanup disposer function.
   */
  static alert() {
    const _config = {
      alertSelector: '[fa-component="alert"]',
      closeBtn: ".alert-close",
      persistent: "data-persistent",
      alertId: "data-alert",
      animation: "data-close-animation",
    };

    const storage = {
      get: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (e) {
          return null;
        }
      },
      set: (key, val) => {
        try {
          localStorage.setItem(key, val);
        } catch (e) {}
      },
    };

    document
      .querySelectorAll(
        `${_config.alertSelector}[${_config.persistent}="true"]`,
      )
      .forEach((alert) => {
        const key = alert.getAttribute(_config.alertId);
        if (key && storage.get(`dismissed-${key}`)) alert.remove();
      });
    const clickHandler = (evt) => {
      const closeBtn = evt.target.closest(_config.closeBtn);
      if (!closeBtn) return;

      const alertElement = closeBtn.closest(_config.alertSelector);
      if (!alertElement) return;

      evt.preventDefault();

      const closeEvent = new CustomEvent("fa.alert.close", {
        detail: { alert: alertElement },
      });
      alertElement.dispatchEvent(closeEvent);
      if (closeEvent.defaultPrevented) return;

      if (alertElement.getAttribute(_config.persistent) === "true") {
        const key = alertElement.getAttribute(_config.alertId);
        if (key) {
          storage.set(`dismissed-${key}`, "true");
        }
      }

      const dismissMode = alertElement.getAttribute(_config.animation);
      let isRemoved = false;

      const finalizeDismiss = () => {
        if (isRemoved) return;
        isRemoved = true;
        document.dispatchEvent(
          new CustomEvent("fa.alert.closed", {
            detail: { alert: alertElement },
          }),
        );
        alertElement.remove();
      };

      if (dismissMode === "slide") {
        DomUtils.slideUp(alertElement, 300).then(finalizeDismiss);
      } else {
        alertElement.style.transition = "opacity 0.25s ease";
        alertElement.style.opacity = "0";
        alertElement.addEventListener("transitionend", finalizeDismiss, {
          once: true,
        });
        setTimeout(finalizeDismiss, 350);
      }
    };

    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }

  /**
   * Initializes collapsible elements with
   * accessible slide open/close behavior.
   * Returns a cleanup disposer function.
   */
  static collapse() {
    const _config = {
      trigger: '[fa-toggle="collapse"]',
      target: "data-target",
      toggleClass: "opened",
      duration: 300,
    };

    const locks = new WeakSet();

    const updateState = (btn, target, isOpen) => {
      btn.classList.toggle(_config.toggleClass, isOpen);
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");

      if (target.id) {
        btn.setAttribute("aria-controls", target.id);
      }

      target.classList.toggle(_config.toggleClass, isOpen);
      target.setAttribute("data-state", isOpen ? "open" : "closed");
    };

    const setInitialState = () => {
      document.querySelectorAll(_config.trigger).forEach((btn) => {
        const targetSelector = btn.getAttribute(_config.target);
        if (!targetSelector) return;

        const target = document.querySelector(targetSelector);
        if (!target) return;

        const isOpen =
          btn.classList.contains(_config.toggleClass) ||
          target.classList.contains(_config.toggleClass) ||
          target.getAttribute("data-open") === "true";

        updateState(btn, target, isOpen);

        if (isOpen) {
          target.style.display = "block";
        } else {
          target.style.display = "none";
        }
      });
    };

    const toggleCollapse = async (btn) => {
      if (btn.disabled || btn.getAttribute("aria-disabled") === "true") return;

      const targetSelector = btn.getAttribute(_config.target);
      if (!targetSelector) return;

      const target = document.querySelector(targetSelector);
      if (!target) return;

      if (locks.has(target)) return;
      locks.add(target);

      const isOpen = target.classList.contains(_config.toggleClass);

      const eventName = isOpen ? "close" : "open";
      const startEvent = new CustomEvent(`fa.collapse.${eventName}`, {
        detail: { trigger: btn, target },
        bubbles: true,
        cancelable: true,
      });

      target.dispatchEvent(startEvent);

      if (startEvent.defaultPrevented) {
        locks.delete(target);
        return;
      }

      updateState(btn, target, !isOpen);

      if (isOpen) {
        await DomUtils.slideUp(target, _config.duration);
      } else {
        await DomUtils.slideDown(target, _config.duration);
      }

      target.dispatchEvent(
        new CustomEvent(`fa.collapse.${isOpen ? "closed" : "opened"}`, {
          detail: { trigger: btn, target },
          bubbles: true,
        }),
      );

      locks.delete(target);
    };

    const clickHandler = (evt) => {
      const btn = evt.target.closest(_config.trigger);
      if (!btn) return;

      evt.preventDefault();
      toggleCollapse(btn);
    };

    setInitialState();

    document.addEventListener("click", clickHandler);

    return () => {
      document.removeEventListener("click", clickHandler);
    };
  }

  /**
   * Initializes draggable horizontal swiper behavior.
   * Adds pointer-based touch and mouse dragging support.
   */
  static swiper(element) {
    if (!element) return;

    const wrapper = element.querySelector(".swiper-wrapper");
    if (!wrapper) return;

    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;
    let moved = false;
    const DRAG_THRESHOLD = 3; // px

    const onPointerDown = (e) => {
      isDragging = true;
      moved = false;

      element.classList.add("is-dragging");

      startX = e.clientX;
      scrollStart = wrapper.scrollLeft;

      wrapper.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;

      const delta = e.clientX - startX;

      if (Math.abs(delta) > DRAG_THRESHOLD) {
        moved = true;
      }

      const movement = delta * 1.15;
      wrapper.scrollLeft = scrollStart - movement;
    };

    const onPointerUpOrCancel = (e) => {
      if (!isDragging) return;

      isDragging = false;
      element.classList.remove("is-dragging");

      wrapper.releasePointerCapture(e.pointerId);

      // If dragged, prevent click events inside the swiper
      if (moved) {
        const preventClick = (ev) => {
          ev.preventDefault();
          ev.stopImmediatePropagation();
        };

        wrapper.addEventListener("click", preventClick, {
          capture: true,
          once: true,
        });
      }
    };

    wrapper.addEventListener("pointerdown", onPointerDown, { passive: true });
    wrapper.addEventListener("pointermove", onPointerMove, { passive: false });
    wrapper.addEventListener("pointerup", onPointerUpOrCancel, {
      passive: true,
    });
    wrapper.addEventListener("pointercancel", onPointerUpOrCancel, {
      passive: true,
    });
    wrapper.addEventListener("pointerleave", onPointerUpOrCancel, {
      passive: true,
    });

    return {
      dispose: () => {
        wrapper.removeEventListener("pointerdown", onPointerDown);
        wrapper.removeEventListener("pointermove", onPointerMove);
        wrapper.removeEventListener("pointerup", onPointerUpOrCancel);
        wrapper.removeEventListener("pointercancel", onPointerUpOrCancel);
        wrapper.removeEventListener("pointerleave", onPointerUpOrCancel);
      },
    };
  }

  /**
   * Initializes dropdown interactions including
   * click, hover and accessibility behavior.
   * Returns a cleanup disposer function.
   */
  static dropdown() {
    const _config = {
      selector: ".dropdown",
      toggleClass: "is-active",
      triggerMode: "data-trigger",
      menuSelector: ".dropdown-menu",
      trigger: '[fa-toggle="dropdown"]',
    };

    const toggleDropdown = (drop, show) => {
      show
        ? drop.classList.add(_config.toggleClass)
        : drop.classList.remove(_config.toggleClass);
      const trigger = drop.querySelector(_config.trigger);
      if (trigger)
        trigger.setAttribute("aria-expanded", show ? "true" : "false");
    };

    const closeAll = (except = null) => {
      document
        .querySelectorAll(`${_config.selector}.${_config.toggleClass}`)
        .forEach((drop) => {
          if (drop !== except) toggleDropdown(drop, false);
        });
    };
    const clickHandler = (evt) => {
      const trigger = evt.target.closest(_config.trigger);
      const isInsideMenu = evt.target.closest(_config.menuSelector);

      if (isInsideMenu) {
        const link = evt.target.closest("a");
        if (link) {
          const drop = isInsideMenu.closest(_config.selector);
          if (drop) toggleDropdown(drop, false);
        }
        return;
      }

      if (!trigger) {
        closeAll();
        return;
      }

      const drop = trigger.closest(_config.selector);
      if (!drop) return;

      closeAll(drop);
      const isActive = drop.classList.contains(_config.toggleClass);
      toggleDropdown(drop, !isActive);
    };

    const keyHandler = (evt) => {
      if (evt.key === "Escape" || evt.key === "Esc") closeAll();
    };

    document.addEventListener("click", clickHandler);
    document.addEventListener("keydown", keyHandler);

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const hoverTimers = new WeakMap();

      const mouseoverHandler = (evt) => {
        const hoverEl = evt.target.closest(
          `${_config.selector}[${_config.triggerMode}="hover"]`,
        );
        if (!hoverEl) return;
        if (hoverTimers.has(hoverEl)) {
          clearTimeout(hoverTimers.get(hoverEl));
          hoverTimers.delete(hoverEl);
        }
        closeAll(hoverEl);
        toggleDropdown(hoverEl, true);
      };

      const mouseoutHandler = (evt) => {
        const hoverEl = evt.target.closest(
          `${_config.selector}[${_config.triggerMode}="hover"]`,
        );
        if (!hoverEl) return;
        if (hoverTimers.has(hoverEl)) clearTimeout(hoverTimers.get(hoverEl));
        const timer = setTimeout(() => {
          if (!hoverEl.matches(":hover") && !hoverEl.querySelector(":hover")) {
            toggleDropdown(hoverEl, false);
          }
          hoverTimers.delete(hoverEl);
        }, 150);
        hoverTimers.set(hoverEl, timer);
      };

      document.addEventListener("mouseover", mouseoverHandler);
      document.addEventListener("mouseout", mouseoutHandler);

      return () => {
        document.removeEventListener("click", clickHandler);
        document.removeEventListener("keydown", keyHandler);
        document.removeEventListener("mouseover", mouseoverHandler);
        document.removeEventListener("mouseout", mouseoutHandler);
      };
    }

    return () => {
      document.removeEventListener("click", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }

  /**
   * Initializes drawer/modal interactions with:
   * focus trap, ESC close, backdrop handling,
   * body scroll locking and accessibility support.
   * Returns a cleanup disposer function.
   */
  static drawer() {
    const _config = {
      parent: ".drawer",
      dismissBtn: ".drawer-close",
      target: "data-target",
      openClass: "opened",
      panel: ".drawer-panel",
      transitionDuration: 420,
      focusableSelectors:
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    };

    const body = document.body;
    let activeDrawer = null;
    let drawerLock = false;
    const scrollbar = new ScrollBarHelper();

    const lockBodyScroll = () => {
      scrollbar.hide();
    };

    const unlockBodyScroll = () => {
      scrollbar.reset();
    };

    const trapFocus = (drawer) => {
      const focusables = Array.from(
        drawer.querySelectorAll(_config.focusableSelectors),
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) {
        drawer.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      const keyHandler = (e) => {
        if (e.key !== "Tab") return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };

      drawer._focusHandler = keyHandler;
      drawer.addEventListener("keydown", keyHandler);
      first.focus();
    };

    const releaseFocusTrap = (drawer) => {
      if (drawer._focusHandler) {
        drawer.removeEventListener("keydown", drawer._focusHandler);
        drawer._focusHandler = null;
      }
    };

    const openDrawer = (drawer) => {
      if (drawerLock || drawer.classList.contains(_config.openClass)) return;

      const openEvent = new CustomEvent("fa.drawer.open", {
        detail: { drawer },
        bubbles: true,
        cancelable: true,
      });
      drawer.dispatchEvent(openEvent);
      if (openEvent.defaultPrevented) return;

      drawerLock = true;
      activeDrawer = drawer;
      drawer.setAttribute("aria-modal", "true");
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("tabindex", "-1");

      if (!drawer.classList.contains("has-no-backdrop")) {
        lockBodyScroll();
      }

      DomUtils.afterPaint(() => {
        drawer.classList.add(_config.openClass);
      });

      setTimeout(() => {
        trapFocus(drawer);
        drawerLock = false;
        drawer.dispatchEvent(
          new CustomEvent("fa.drawer.opened", {
            detail: { drawer },
            bubbles: true,
          }),
        );
      }, _config.transitionDuration + 50);
    };

    const closeDrawer = (drawer) => {
      if (!drawer.classList.contains(_config.openClass)) return;
      if (activeDrawer === drawer) activeDrawer = null;
      const closeEvent = new CustomEvent("fa.drawer.close", {
        detail: { drawer },
        bubbles: true,
        cancelable: true,
      });
      drawer.dispatchEvent(closeEvent);
      if (closeEvent.defaultPrevented) return;

      drawerLock = true;
      drawer.classList.remove(_config.openClass);
      drawer.removeAttribute("aria-modal");
      drawer.removeAttribute("role");
      releaseFocusTrap(drawer);

      let transitioned = false;
      const cleanup = () => {
        if (transitioned) return;
        transitioned = true;
        drawerLock = false;
        if (!drawer.classList.contains("has-no-backdrop")) {
          unlockBodyScroll();
        }
        drawer.dispatchEvent(
          new CustomEvent("fa.drawer.closed", {
            detail: { drawer },
            bubbles: true,
          }),
        );
      };

      const handler = (e) => {
        if (
          e.target !== drawer &&
          e.target !== drawer.querySelector(_config.panel)
        )
          return;
        drawer.removeEventListener("transitionend", handler);
        cleanup();
      };

      drawer.addEventListener("transitionend", handler);
      setTimeout(cleanup, _config.transitionDuration + 50);
    };

    const clickHandler = (evt) => {
      const trigger = evt.target.closest('[fa-toggle="drawer"]');
      const dismissBtn = evt.target.closest(_config.dismissBtn);

      if (trigger) {
        evt.preventDefault();
        const selector = trigger.getAttribute(_config.target);
        const drawer = selector
          ? document.querySelector(selector)
          : trigger.closest(_config.parent);
        if (!drawer) return;
        openDrawer(drawer);
        return;
      }

      if (dismissBtn) {
        evt.preventDefault();
        const drawer = dismissBtn.closest(_config.parent);
        if (drawer) closeDrawer(drawer);
        return;
      }

      if (activeDrawer && activeDrawer.classList.contains(_config.openClass)) {
        const panel = activeDrawer.querySelector(_config.panel);
        if (
          panel &&
          !panel.contains(evt.target) &&
          !evt.target.closest('[fa-toggle="drawer"]')
        ) {
          closeDrawer(activeDrawer);
        }
      }
    };

    const keyHandler = (evt) => {
      if ((evt.key === "Escape" || evt.key === "Esc") && activeDrawer) {
        closeDrawer(activeDrawer);
      }
    };

    document.addEventListener("click", clickHandler);
    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("click", clickHandler);
      document.removeEventListener("keydown", keyHandler);
      if (activeDrawer) closeDrawer(activeDrawer);
      unlockBodyScroll();
    };
  }

  static tabview(tabContainer) {
    if (!tabContainer) return;

    const config = {
      tabPanel: "data-tab",
      toggleClass: "is-active",
      contentToggleClass: "is-open",
    };

    const tabs = Array.from(
      tabContainer.querySelectorAll(`[${config.tabPanel}]`),
    );
    const isVertical = tabContainer.classList.contains("is-vertical");

    if (!tabs.length) return;

    // Underline
    const underline = document.createElement("div");
    underline.className = "is-underline";
    underline.style.position = "absolute";
    underline.style.transition = "all 0.25s ease";

    tabContainer.appendChild(underline);

    // Cached tab panel map
    const panelMap = {};
    tabs.forEach((tab) => {
      const panelSelector = tab.getAttribute(config.tabPanel);
      const panel = panelSelector
        ? document.querySelector(panelSelector)
        : null;
      if (panel) panelMap[panelSelector] = panel;
    });

    function updateUnderline() {
      const activeTab = tabContainer.querySelector(`.${config.toggleClass}`);
      if (!activeTab) return;

      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = tabContainer.getBoundingClientRect();

      requestAnimationFrame(() => {
        const offsetTop = tabRect.top - containerRect.top;
        const offsetLeft = tabRect.left - containerRect.left;

        if (isVertical) {
          underline.style.transform = `translateY(${offsetTop}px)`;
          underline.style.height = `${tabRect.height}px`;
          underline.style.width = "4px";
          underline.style.top = "0";
          underline.style.left = "0";
        } else {
          underline.style.transform = `translateX(${offsetLeft}px)`;
          underline.style.width = `${tabRect.width}px`;
          underline.style.height = "4px";
          underline.style.top = "auto";
          underline.style.left = "0";
        }
      });
    }

    // Initialize: activate first tab if none active
    let activeTab =
      tabContainer.querySelector(`.${config.toggleClass}`) || tabs[0];

    if (activeTab) {
      activeTab.classList.add(config.toggleClass);

      const panelSelector = activeTab.getAttribute(config.tabPanel);
      const panel = panelMap[panelSelector];

      if (panel) {
        panel.classList.add(config.contentToggleClass);
      }
    }

    updateUnderline();

    // Event Delegation
    const clickHandler = (evt) => {
      const tab = evt.target.closest(`[${config.tabPanel}]`);
      if (!tab || !tabContainer.contains(tab)) return;

      evt.preventDefault();

      tabs.forEach((t) => t.classList.remove(config.toggleClass));
      Object.values(panelMap).forEach((panel) => {
        panel.classList.remove(config.contentToggleClass);
      });

      tab.classList.add(config.toggleClass);

      const panelSelector = tab.getAttribute(config.tabPanel);
      const panel = panelMap[panelSelector];

      if (panel) {
        panel.classList.add(config.contentToggleClass);
      }

      updateUnderline();
    };

    tabContainer.addEventListener("click", clickHandler);

    // Responsive underline
    const resizeObserver = new ResizeObserver(() => {
      updateUnderline();
    });

    resizeObserver.observe(tabContainer);

    // Dispose function
    return {
      dispose: () => {
        tabContainer.removeEventListener("click", clickHandler);
        resizeObserver.disconnect();
        underline.remove();
      },
    };
  }

  /**
   * Formats badge counters and automatically
   * limits large values to 99+.
   */
  static badge(element) {
    const countRaw = element.getAttribute("data-count");
    if (!countRaw) return;

    const count = Number(countRaw);
    if (Number.isNaN(count)) return;

    element.textContent = count < 100 ? count : "99+";
    element.setAttribute("aria-label", `${count}`);
  }

  /**
   * Initializes form validation, file upload helpers,
   * floating labels and range slider interactions.
   * Returns a cleanup disposer function.
   */
  static form() {
    const _config = {
      selector: '[fa-component="form"]',
      validateClass: "validated",
      groupFile: ".group-file",
      inputFile: ".form-input-file",
      uploadDisplay: ".upload-display",
      defaultMaxFileSize: 10 * 1024 * 1024,
    };

    const submitHandler = (evt) => {
      const form = evt.target.closest(_config.selector);
      if (!form) return;
      if (!form.checkValidity()) {
        evt.preventDefault();
        evt.stopPropagation();
      }
      form.classList.replace("validate", _config.validateClass);
    };

    const changeHandler = (evt) => {
      if (!evt.target.matches(_config.inputFile)) return;

      const input = evt.target;
      const group = input.closest(_config.groupFile);
      if (!group) return;

      const display = group.querySelector(_config.uploadDisplay);
      if (!display) return;

      const maxSize =
        parseInt(group.getAttribute("max-file-size")) ||
        _config.defaultMaxFileSize;

      const allowAttr = group.getAttribute("data-allow");
      const allowedExtensions = allowAttr
        ? new Set(allowAttr.split(",").map((e) => e.trim().toLowerCase()))
        : null;

      const validFiles = Array.from(input.files).filter((file) => {
        const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
        const ext = extMatch ? extMatch[1].toLowerCase() : "";

        const blockedMsg =
          group.getAttribute("data-lang-blocked") ||
          `Blocked file type: ${file.name}`;
        const sizeMsg =
          group.getAttribute("data-lang-large") ||
          `File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, max ${maxSize / 1024 / 1024}MB)`;

        if (allowedExtensions && !allowedExtensions.has(ext)) {
          Toast.show({ message: blockedMsg, status: "danger", duration: 4000 });
          return false;
        }
        if (file.size > maxSize) {
          Toast.show({ message: sizeMsg, status: "warning", duration: 4000 });
          return false;
        }
        return true;
      });

      display.textContent =
        validFiles.length === 1
          ? "Selected: " + validFiles[0].name.replace(/[<>\/\\|:*?"']/g, "_")
          : `${validFiles.length} Items Selected`;
    };

    document.addEventListener("submit", submitHandler);
    document.addEventListener("change", changeHandler);

    document
      .querySelectorAll(".group.floating-label select")
      .forEach((select) => {
        const label = document.createElement("label");
        label.className = "select-label floating-label-hidden";
        label.textContent =
          select.options[0]?.textContent || "Select an option";
        select.insertAdjacentElement("afterend", label);

        const toggleLabel = () => {
          const isVisible = select.value !== "";
          label.classList.toggle("floating-label-visible", isVisible);
          label.classList.toggle("floating-label-hidden", !isVisible);
        };

        select.addEventListener("change", toggleLabel);
        toggleLabel();
      });

    const updateRangeTrack = (range) => {
      const min = Number(range.min || 0);
      const max = Number(range.max || 100);
      const value = Number(range.value || min);

      if (max === min) {
        range.style.setProperty("--range-track-fill", "0%");
        return;
      }

      const percent = ((value - min) / (max - min)) * 100;
      range.style.setProperty("--range-track-fill", `${percent}%`);
    };

    const rangeInputHandler = (evt) => {
      const range = evt.target.closest('.form-input-range[type="range"]');
      if (!range) return;

      updateRangeTrack(range);
    };

    document.addEventListener("input", rangeInputHandler);

    document
      .querySelectorAll('.form-input-range[type="range"]')
      .forEach(updateRangeTrack);

    return () => {
      document.removeEventListener("submit", submitHandler);
      document.removeEventListener("change", changeHandler);
      document.removeEventListener("input", rangeInputHandler);
    };
  }

  /**
   * Initializes accessible accordion interactions
   * with animated open/close behavior.
   * Returns a cleanup disposer function.
   */
  static accordion() {
    const selector = '[fa-component="accordion"]';
    const openClass = "opened";
    const togglerSelector = ".accordion-toggler";
    const contentSelector = ".accordion-content";

    const clickHandler = async (evt) => {
      const toggler = evt.target.closest(togglerSelector);
      if (!toggler) return;

      const root = toggler.closest(selector);
      if (!root) return;

      if (root._faAccordionLock) return;
      root._faAccordionLock = true;

      const singleOpen = root.getAttribute("data-single-open") !== "false";
      const isOpen = toggler.classList.contains(openClass);

      if (isOpen) {
        await accordionClose(toggler);
      } else {
        const openedSuccessfully = await accordionOpen(toggler);
        if (openedSuccessfully && singleOpen) {
          const others = [...root.querySelectorAll(togglerSelector)].filter(
            (btn) => btn !== toggler && btn.classList.contains(openClass),
          );
          await Promise.all(others.map((btn) => accordionClose(btn)));
        }
      }

      root._faAccordionLock = false;
    };

    document.querySelectorAll(selector).forEach((root) => {
      if (root.getAttribute("data-open-stay") !== "true") return;
      const first = root.querySelector(togglerSelector);
      if (!first) return;
      first.classList.add(openClass);
      const content = first.parentElement.querySelector(contentSelector);
      if (content) content.style.display = "block";
    });

    document.addEventListener("click", clickHandler);

    return () => document.removeEventListener("click", clickHandler);

    async function accordionClose(btn) {
      const item = btn.parentElement;
      const content = item.querySelector(contentSelector);
      if (!content) return false;

      const closeEvent = new CustomEvent("fa.accordion.close", {
        detail: { trigger: btn, content, item },
        bubbles: true,
        cancelable: true,
      });
      item.dispatchEvent(closeEvent);
      if (closeEvent.defaultPrevented) return false;

      btn.classList.remove(openClass);
      await DomUtils.slideUp(content, 200);

      item.dispatchEvent(
        new CustomEvent("fa.accordion.closed", {
          detail: { trigger: btn, content, item },
          bubbles: true,
        }),
      );

      return true;
    }

    async function accordionOpen(btn) {
      const item = btn.parentElement;
      const content = item.querySelector(contentSelector);
      if (!content) return false;

      const openEvent = new CustomEvent("fa.accordion.open", {
        detail: { trigger: btn, content, item },
        bubbles: true,
        cancelable: true,
      });
      item.dispatchEvent(openEvent);
      if (openEvent.defaultPrevented) return false;

      btn.classList.add(openClass);
      await DomUtils.slideDown(content, 200);

      item.dispatchEvent(
        new CustomEvent("fa.accordion.opened", {
          detail: { trigger: btn, content, item },
          bubbles: true,
        }),
      );

      return true;
    }
  }
}
