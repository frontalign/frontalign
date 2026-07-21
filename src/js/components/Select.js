/*!
 * FrontAlign v1.0.6
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import Debug from "../core/Debug";

export default class Select {
  // Private Fields
  #el;
  #config;
  #data;
  #selected = [];
  #root;
  #display;
  #list;
  #hidden;
  #searchInput;
  #onDocClick;
  #duration;
  #handleDisplayClick;
  #handleSearchInput;
  #resizeObserver;

  // Defaults
  static defaults = {
    inputName: "select",
    multiple: false,
    defaultValue: null,
    data: [],
    search: false,
    placeholder: "--SELECT--",
  };

  // Variables
  static variables = {
    animationDuration: 200, // ms
  };

  /**
   * Creates a new custom select instance.
   */
  constructor(selector, options = {}) {
    //SSR Guard
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    this.#el =
      selector instanceof Element ? selector : document.querySelector(selector);

    if (!(this.#el instanceof Element)) {
      Debug.warn(`[ComponentName] Target element was not found.`);
      return;
    }

    this.#config = {
      ...Select.defaults,
      ...options,
      data: options.data ?? Select.defaults.data,
    };
    this.#data = this.#config.data;
    this.#duration = Select.variables.animationDuration;
    this.#init();
  }

  /**
   * Initializes the select component
   * and default behaviors.
   */
  #init() {
    this.#build();
    this.#bindDocumentClose();
    if (this.#config.defaultValue) this.#applyDefault();
  }

  /**
   * Builds the custom select
   * user interface structure.
   */
  #build() {
    this.#root = document.createElement("div");
    this.#root.className = "custom-select";
    this.#root.tabIndex = 0;
    this.#root.setAttribute("role", "combobox");
    this.#root.setAttribute("aria-expanded", "false");
    this.#root.setAttribute("aria-haspopup", "listbox");

    this.#display = document.createElement("div");
    this.#display.className = "selected-option";
    this.#display.innerText = this.#config.placeholder;
    this.#root.appendChild(this.#display);

    this.#list = document.createElement("div");
    this.#list.className = "options-container";
    this.#list.style.transition = `all ${this.#duration}ms ease`;
    this.#root.appendChild(this.#list);

    this.#hidden = document.createElement("input");
    this.#hidden.type = "hidden";
    this.#hidden.name = this.#config.inputName;
    this.#root.appendChild(this.#hidden);

    if (this.#config.search) {
      this.#searchInput = document.createElement("input");
      this.#searchInput.type = "text";
      this.#searchInput.placeholder = "Search...";
      this.#searchInput.className = "form-input";
      this.#handleSearchInput = () => this.#filterOptions();
      this.#searchInput.addEventListener("input", this.#handleSearchInput);
      this.#list.appendChild(this.#searchInput);
    }

    this.#data.forEach((opt) => this.#addOption(opt));
    this.#handleDisplayClick = () => this.toggle();
    this.#display.addEventListener("click", this.#handleDisplayClick);
    this.#el.insertAdjacentElement("afterend", this.#root);
  }

  /**
   * Creates and appends
   * a selectable option item.
   */
  #addOption(opt) {
    const div = document.createElement("div");
    div.setAttribute("role", "option");
    div.className = "select-option";
    div.dataset.value = opt.value;
    div.dataset.name = opt.name.toLowerCase();
    if (opt.icon) {
      const img = document.createElement("img");
      img.src = opt.icon;
      img.className = "option-icon";
      div.appendChild(img);
    }
    const textNode = document.createTextNode(opt.name);
    div.appendChild(textNode);
    div.addEventListener("click", () => this.select(opt));
    this.#list.appendChild(div);
  }

  /**
   * Handles option selection logic
   * for single and multiple modes.
   */
  select(opt) {
    if (this.#config.multiple) {
      if (this.#selected.find((s) => s.value === opt.value)) return;
      this.#selected.push(opt);
      this.#renderMultiSelected();
    } else {
      this.#selected = [opt];
      this.#display.innerHTML = "";
      if (opt.icon) {
        const img = document.createElement("img");
        img.src = opt.icon;
        img.className = "option-icon";
        this.#display.appendChild(img);
      }
      this.#display.appendChild(document.createTextNode(opt.name));

      this.close();
    }

    this.#hidden.value = this.#selected.map((e) => e.value).join(",");
    this.#el.value = this.#hidden.value;
    this.#el.dispatchEvent(new Event("change"));
  }

  /**
   * Renders multi-select tags
   * and responsive overflow handling.
   */
  #renderMultiSelected() {
    this.#display.innerHTML = "";
    if (!this.#config.multiple || this.#selected.length === 0) {
      this.#display.innerText = this.#config.placeholder;
      return;
    }

    // 1. Genrating tags
    const tagElements = this.#selected.map((opt) => {
      const d = document.createElement("div");
      d.className = "select-tag";

      if (opt.icon) {
        const img = document.createElement("img");
        img.src = opt.icon;
        img.className = "option-icon";
        d.appendChild(img);
      }

      d.appendChild(document.createTextNode(opt.name));

      const removeBtn = document.createElement("span");
      removeBtn.className = "tag-remove";
      removeBtn.textContent = "×";
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        this.remove(opt.value);
      };
      d.appendChild(removeBtn);

      this.#display.appendChild(d);
      return d;
    });

    // 2. Calculating
    const calculateLayout = () => {
      const rootWidth = this.#display.getBoundingClientRect().width;
      if (rootWidth <= 0) return;

      let availableWidth = rootWidth - 55;
      let currentWidth = 0;
      let moreCount = 0;

      tagElements.forEach((el) => {
        el.style.display = "flex";
        const w = el.offsetWidth + 6;

        if (currentWidth + w > availableWidth) {
          el.style.display = "none";
          moreCount++;
        } else {
          currentWidth += w;
        }
      });

      this.#display.querySelector(".more-tag")?.remove();
      if (moreCount > 0) {
        const moreTag = document.createElement("div");
        moreTag.className = "more-tag";
        moreTag.textContent = `+${moreCount} more`;
        this.#display.appendChild(moreTag);
      }
    };

    // 3. ResizeObserver
    if (!this.#resizeObserver && typeof ResizeObserver !== "undefined") {
      this.#resizeObserver = new ResizeObserver(() =>
        requestAnimationFrame(calculateLayout),
      );
      this.#resizeObserver.observe(this.#display);
    } else {
      requestAnimationFrame(calculateLayout);
    }
  }

  /**
   * Removes a selected option
   * from the current selection.
   */
  remove(value) {
    this.#selected = this.#selected.filter((s) => s.value !== value);
    this.#renderMultiSelected();
    this.#hidden.value = this.#selected.map((e) => e.value).join(",");
    this.#el.value = this.#hidden.value;
    this.#el.dispatchEvent(new Event("change"));
  }

  /**
   * Applies the configured
   * default selected values.
   */
  #applyDefault() {
    const def = Array.isArray(this.#config.defaultValue)
      ? this.#config.defaultValue.map((v) =>
          this.#data.find((o) => o.value == v),
        )
      : [this.#data.find((o) => o.value == this.#config.defaultValue)];

    def.forEach((o) => o && this.select(o));
  }

  /**
   * Opens the select dropdown panel.
   */
  open() {
    this.#list.style.display = "block";
    void this.#list.offsetWidth;
    this.#list.style.opacity = "1";
    this.#list.style.transform = "translateX(-50%) translateY(0)";
    this.#root.setAttribute("aria-expanded", "true");
  }

  /**
   * Closes the select dropdown panel.
   */
  close() {
    this.#list.style.opacity = 0;
    this.#list.style.transform = "translateX(-50%) translateY(-8px)";
    this.#root.setAttribute("aria-expanded", "false");
    setTimeout(() => (this.#list.style.display = "none"), this.#duration);
  }

  /**
   * Toggles the select dropdown state.
   */
  toggle() {
    if (this.#list.style.display === "block") this.close();
    else this.open();
  }

  /**
   * Filters selectable options
   * based on the search query.
   */
  #filterOptions() {
    const query = this.#searchInput.value.toLowerCase();
    this.#list.querySelectorAll(".select-option").forEach((opt) => {
      const txt = opt.dataset.name;
      opt.style.display = txt.includes(query) ? "flex" : "none";
    });
  }

  /**
   * Automatically closes the select
   * when clicking outside the component.
   */
  #bindDocumentClose() {
    this.#onDocClick = (e) => {
      if (!this.#root.contains(e.target)) this.close();
    };
    document.addEventListener("click", this.#onDocClick);
  }

  /**
   * Disposes the select instance,
   * observers and event listeners.
   */
  dispose() {
    document.removeEventListener("click", this.#onDocClick);
    this.#display.removeEventListener("click", this.#handleDisplayClick);
    if (this.#searchInput && this.#handleSearchInput) {
      this.#searchInput.removeEventListener("input", this.#handleSearchInput);
    }
    this.#root.remove();
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
  }
}
