/*!
 * FrontAlign v1.0.2
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

/**
 * Dark mode manager with:
 * persistent theme storage,
 * auto system sync and custom toggles.
 */

export default class DarkMode {
  // Private Fields
  #config;
  #root;
  #container;
  #toggleButton;
  #input = null;
  #storageKey = "darkMode";
  #customBtnListener;
  #customBtn = null;
  #mediaQueryListener = null;
  #onChangeCallbacks = [];

  /**
   * Creates a new dark mode instance.
   */
  constructor(options = {}) {
    //SSR Guard
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    this.#root = document.documentElement;

    const defaults = {
      container: "body",
      customBtn: false,
      autoCreateBtn: true,
    };
    this.#config = { ...defaults, ...options };
    this.#container = document.querySelector(this.#config.container) || document.body;
    this.#init();
  }

  /**
   * Creates the default dark mode
   * toggle button interface.
   */
  #createButton() {
    this.#toggleButton = document.createElement("label");
    this.#toggleButton.classList.add("dark-mode-toggler");
    if (this.#config.container === "body") {
      this.#toggleButton.classList.add("is-fixed");
      this.#toggleButton.setAttribute("data-fixed-lock", "");
    }
    this.#toggleButton.setAttribute("aria-label", "Dark Mode Toggle Button");

    this.#toggleButton.addEventListener("mousedown", (e) => e.preventDefault());

    this.#input = document.createElement("input");
    this.#input.type = "checkbox";
    this.#input.setAttribute("aria-label", "Dark mode aktivləşdir");
    this.#input.setAttribute("role", "switch");

    const track = document.createElement("div");
    track.classList.add("dark-mode-toggler-track");

    const thumb = document.createElement("div");
    thumb.classList.add("dark-mode-toggler-thumb");

    thumb.innerHTML = `
    <span class="dark-mode-toggler-sun" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2"  x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="6"  y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.22" y1="4.22"   x2="7.05" y2="7.05"/>
        <line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
        <line x1="4.22" y1="19.78"  x2="7.05" y2="16.95"/>
        <line x1="16.95" y1="7.05"  x2="19.78" y2="4.22"/>
      </svg>
    </span>
    <span class="dark-mode-toggler-moon" aria-hidden="true">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </span>
  `;

    track.appendChild(thumb);
    this.#toggleButton.appendChild(this.#input);
    this.#toggleButton.appendChild(track);
    this.#container.appendChild(this.#toggleButton);
  }

  /**
   * Loads and restores the current
   * dark mode state from storage.
   */
  #loadMode() {
    // SSR Guard
    if (typeof localStorage === "undefined") return;

    const savedMode = localStorage.getItem(this.#storageKey);

    if (savedMode === "enabled") {
      this.#root.setAttribute("fa-theme", "dark");
      if (this.#input) this.#input.checked = true;
      this.#customBtn?.classList.add("is-dark");
    } else if (savedMode === null) {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        this.#root.setAttribute("fa-theme", "dark");
        if (this.#input) this.#input.checked = true;
        this.#customBtn?.classList.add("is-dark");
      }
    }
  }

  /**
   * Toggles between light and dark mode
   * and dispatches change events.
   */
  #toggleMode() {
    const isDark = this.#root.getAttribute("fa-theme") === "dark";
    if (isDark) {
      this.#root.removeAttribute("fa-theme");
      if (this.#input) this.#input.checked = false;
      if (this.#customBtn) this.#customBtn.classList.remove("is-dark");
      if (typeof localStorage !== "undefined")
        localStorage.setItem(this.#storageKey, "disabled");
    } else {
      this.#root.setAttribute("fa-theme", "dark");
      if (this.#input) this.#input.checked = true;
      if (this.#customBtn) this.#customBtn.classList.add("is-dark");
      if (typeof localStorage !== "undefined")
        localStorage.setItem(this.#storageKey, "enabled");
    }
    const isDarkNow = this.isDark();
    this.#onChangeCallbacks.forEach((cb) => cb(isDarkNow));
    const event = new CustomEvent("darkModeChange", {
      detail: { isDark: isDarkNow },
    });
    this.#root.dispatchEvent(event);
  }

  /**
   * Binds dark mode interaction events.
   */
  #bindEvents() {
    if (this.#input) {
      this.#input.addEventListener("change", () => this.#toggleMode());
    }

    if (this.#config.customBtn) {
      this.#customBtn = document.querySelector(this.#config.customBtn);
      if (!this.#customBtn) return;
      this.#customBtnListener = () => this.#toggleMode();
      this.#customBtn.addEventListener("click", this.#customBtnListener);
    }
  }

  /**
   * Initializes dark mode behavior,
   * media query sync and UI state.
   */
  #init() {
    if (this.#config.autoCreateBtn && !this.#config.customBtn) {
      this.#createButton();
    }
    this.#bindEvents();
    this.#loadMode();
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      this.#mediaQueryListener = (e) => {
        const savedMode = localStorage.getItem(this.#storageKey);
        if (savedMode !== null) return;
        if (e.matches) {
          this.#root.setAttribute("fa-theme", "dark");
          if (this.#input) this.#input.checked = true;
          this.#customBtn?.classList.add("is-dark");
        } else {
          this.#root.removeAttribute("fa-theme");
          if (this.#input) this.#input.checked = false;
          this.#customBtn?.classList.remove("is-dark");
        }
        const isDark = this.#root.getAttribute("fa-theme") === "dark";
        this.#onChangeCallbacks.forEach((cb) => cb(isDark));
        this.#root.dispatchEvent(
          new CustomEvent("darkModeChange", { detail: { isDark } }),
        );
      };
      mediaQuery.addEventListener("change", this.#mediaQueryListener);
    }
  }

  /**
   * Returns whether dark mode
   * is currently enabled.
   */
  isDark() {
    return this.#root.getAttribute("fa-theme") === "dark";
  }

  /**
   * Registers a callback for
   * dark mode state changes.
   */
  onChange(callback) {
    if (typeof callback === "function") {
      this.#onChangeCallbacks.push(callback);
    }
  }

  /**
   * Disposes all listeners,
   * observers and toggle elements.
   */
  dispose() {
    this.#toggleButton?.remove();
    this.#toggleButton = null;
    this.#input = null;

    if (this.#mediaQueryListener) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", this.#mediaQueryListener);
    }
    if (this.#customBtn && this.#customBtnListener) {
      this.#customBtn.removeEventListener("click", this.#customBtnListener);
    }
    this.#onChangeCallbacks = [];
    this.#customBtn = null;
    this.#customBtnListener = null;
    this.#mediaQueryListener = null;
  }
}
