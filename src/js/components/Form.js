/*!
 * FrontAlign v1.0.5
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

import Toast from "./Toast.js";

export default class Form {
  static #rules = {
    email: (val) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val) ||
      "Please enter a valid email address.",

    phone: (val) =>
      /^\+?[1-9]\d{1,14}$/.test(val.replace(/[\s\-()]/g, "")) ||
      "Please enter a valid phone number.",

    number: (val) =>
      /^-?\d+(\.\d+)?$/.test(val) || "This field must be a valid number.",

    integer: (val) => /^-?\d+$/.test(val) || "This field must be an integer.",

    alphanumeric: (val) =>
      /^[a-zA-Z0-9]+$/.test(val) || "Only letters and numbers are allowed.",

    url: (val) =>
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(val) ||
      "Please enter a valid URL.",

    "password-strength": (val) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\s\S]{8,}$/.test(val) ||
      "Password must be 8+ chars, include uppercase, lowercase, and a number.",

    "no-spaces": (val) => !/\s/.test(val) || "Spaces are not allowed.",

    min: (val, param) => {
      const n = Number(param);
      if (isNaN(n)) return `Invalid min param: "${param}".`;
      const isNumeric = /^-?\d+(\.\d+)?$/.test(val.trim());
      if (isNumeric)
        return Number(val) >= n ? true : `Value must be at least ${n}.`;
      return val.length >= n ? true : `Must be at least ${n} characters.`;
    },

    max: (val, param) => {
      const n = Number(param);
      if (isNaN(n)) return `Invalid max param: "${param}".`;
      const isNumeric = /^-?\d+(\.\d+)?$/.test(val.trim());
      if (isNumeric)
        return Number(val) <= n ? true : `Value must be no more than ${n}.`;
      return val.length <= n ? true : `Must be no more than ${n} characters.`;
    },

    minlen: (val, param) => {
      const n = Number(param);
      if (isNaN(n)) return `Invalid minlen param: "${param}".`;
      return val.length >= n ? true : `Must be at least ${n} characters.`;
    },

    maxlen: (val, param) => {
      const n = Number(param);
      if (isNaN(n)) return `Invalid maxlen param: "${param}".`;
      return val.length <= n ? true : `Must be no more than ${n} characters.`;
    },

    minval: (val, param) => {
      const n = Number(param);
      if (isNaN(n)) return `Invalid minval param: "${param}".`;
      return Number(val) >= n ? true : `Value must be at least ${n}.`;
    },

    maxval: (val, param) => {
      const n = Number(param);
      if (isNaN(n)) return `Invalid maxval param: "${param}".`;
      return Number(val) <= n ? true : `Value must be no more than ${n}.`;
    },

    exact: (val, param) => {
      const n = Number(param);
      if (isNaN(n)) return `Invalid exact param: "${param}".`;
      return val.length === n ? true : `Must be exactly ${n} characters.`;
    },

    match: (val, param) => {
      if (!param)
        return "match rule requires a selector param, e.g. match:#other-id";
      const other = document.querySelector(param);
      if (!other) {
        console.warn(
          `FrontAlign [match]: No element found for selector "${param}"`,
        );
        return `match rule: target "${param}" not found.`;
      }
      return val === other.value ? true : "Fields do not match.";
    },

    contains: (val, param) =>
      val.includes(param) ? true : `Must contain "${param}".`,
    startswith: (val, param) =>
      val.startsWith(param) ? true : `Must start with "${param}".`,
    endswith: (val, param) =>
      val.endsWith(param) ? true : `Must end with "${param}".`,
    "file-max": (val, param, field) => {
      if (field.type !== "file" || !field.files || field.files.length === 0)
        return true;
      const maxSize = Number(param) * 1024 * 1024;
      const overSized = Array.from(field.files).find((f) => f.size > maxSize);
      return !overSized ? true : `File size cannot exceed ${param}MB.`;
    },
    "file-ext": (val, param, field) => {
      if (field.type !== "file" || !field.files || field.files.length === 0)
        return true;
      const exts = param.split(",").map((e) => e.trim().toLowerCase());
      const invalidFile = Array.from(field.files).find((f) => {
        const extMatch = f.name.match(/\.([a-z0-9]+)$/i);
        return !exts.includes(extMatch ? extMatch[1].toLowerCase() : "");
      });
      return !invalidFile ? true : `Allowed file types: ${exts.join(", ")}`;
    },
  };

  // Public API
  static addRule(name, fn) {
    if (typeof name !== "string" || !name.trim()) {
      console.warn(
        "FrontAlign [addRule]: Rule name must be a non-empty string.",
      );
      return;
    }
    if (typeof fn !== "function") {
      console.warn(`FrontAlign [addRule]: Rule "${name}" must be a function.`);
      return;
    }
    if (Form.#rules[name]) {
      console.warn(
        `FrontAlign [addRule]: Rule "${name}" already exists — overwriting.`,
      );
    }
    Form.#rules[name] = fn;
  }

  static init() {
    const config = {
      selector: '[fa-component="form"]',
      validateClass: "is-validated",
      groupFile: ".group-file",
      inputFile: ".form-file",
      uploadDisplay: ".upload-display",
      defaultMaxFileSize: 10 * 1024 * 1024, // 10 MB
      btnLoadingClass: "is-loading",
      ajaxTimeout: 30000, // 30s default request timeout (override per-form via data-ajax-timeout)
    };

    const runDataRules = (field) => {
      const raw = field.getAttribute("data-rule");
      if (!raw) return null;
      if (!field.value && field.type !== "file") return null;

      for (const token of raw.trim().split(/\s+/)) {
        const colonIdx = token.indexOf(":");
        const ruleName = colonIdx === -1 ? token : token.slice(0, colonIdx);
        const param = colonIdx === -1 ? undefined : token.slice(colonIdx + 1);

        const rule = Form.#rules[ruleName];
        if (!rule) {
          console.warn(`FrontAlign: Unknown rule "${ruleName}"`);
          continue;
        }

        const result = rule(field.value, param, field);
        if (result !== true) return String(result); // first failure wins
      }

      return null;
    };

    const SKIP_TYPES = new Set([
      "hidden",
      "submit",
      "button",
      "reset",
      "image",
    ]);

    const getOrGenerateFeedbackEl = (field) => {
      if (SKIP_TYPES.has(field.type)) return null;

      if (field.hasAttribute("data-no-feedback")) return null;
      const atom = field.closest(
        ".group-checkbox, .group-radio, .group-switch",
      );
      const parent = atom?.closest(".group") || atom || field.parentNode;

      let el = parent.querySelector(":scope > .form-feedback.is-invalid");
      if (!el) {
        el = document.createElement("div");
        el.className = "form-feedback is-invalid";
        parent.appendChild(el);
      }
      return el;
    };

    const clearServerFeedback = (form) => {
      form.querySelectorAll(".form-feedback.from-server").forEach((el) => {
        el.classList.remove("from-server", "with-success", "with-error");
        el.textContent = "";
      });
    };
    /*
     * Auto-populate field-level errors from a server JSON response.
     * Convention: { errors: { fieldName: "message" | ["message", ...] } }
     * Consumers using a different shape can still listen to "fa.form.error"
     * and build their own UI — this just covers the common case for free.
     */
    const populateServerFeedback = (form, data) => {
      const errors = data?.errors;
      if (!errors || typeof errors !== "object") return;

      Object.entries(errors).forEach(([name, msg]) => {
        const field = form.querySelector(`[name="${CSS.escape(name)}"]`);
        if (!field) return;

        const message = Array.isArray(msg) ? msg[0] : msg;
        if (!message) return;

        field.setCustomValidity(String(message));

        const el = getOrGenerateFeedbackEl(field);
        if (el) {
          el.textContent = String(message);
          el.classList.add("form-feedback", "from-server", "with-error");
        }
      });

      form.querySelector(":invalid")?.focus();
    };
    /*
     * `.value` on a checkbox/radio is its static value attribute (e.g. "on"),
     * unrelated to whether it's checked — so the plain `!field.value` check
     * used below never "sees" an unchecked required checkbox/radio. This
     * checks the actual checked-state instead, group-aware for radios.
     */
    const isFieldEmpty = (field) => {
      if (field.type === "checkbox") return !field.checked;

      if (field.type === "radio") {
        const root = field.form || document;
        const group = root.querySelectorAll(
          `input[type="radio"][name="${CSS.escape(field.name)}"]`,
        );
        return !Array.from(group).some((radio) => radio.checked);
      }

      return !field.value;
      if (field.type === "file") return field.files.length === 0;
    };

    const validateField = (field) => {
      if (SKIP_TYPES.has(field.type)) return;

      // Always reset native custom validity first
      field.setCustomValidity("");

      const hasDataRule = field.hasAttribute("data-rule");

      // Empty field handling
      if (isFieldEmpty(field)) {
        if (field.required || hasDataRule) {
          const msg =
            field.getAttribute("data-required-msg") ||
            "This field is required.";
          field.setCustomValidity(msg);
          const el = getOrGenerateFeedbackEl(field);
          if (el) el.textContent = msg;
        }
        return;
      }

      let errorMsg = null;

      // 1. data-rule (multi, parametric) — independent of `required`
      errorMsg = runDataRules(field);

      // 2. data-regex — only when no rule error yet
      if (!errorMsg) {
        const pattern = field.getAttribute("data-regex");
        if (pattern) {
          try {
            if (!new RegExp(pattern).test(field.value)) {
              errorMsg =
                field.getAttribute("data-error-msg") || "Format is invalid.";
            }
          } catch {
            console.error(`FrontAlign: Invalid regex pattern: ${pattern}`);
          }
        }
      }

      if (errorMsg) field.setCustomValidity(errorMsg);

      if (!field.validity.valid) {
        const el = getOrGenerateFeedbackEl(field);
        if (el) {
          el.textContent =
            field.getAttribute("data-error-msg") ||
            errorMsg ||
            field.validationMessage;
        }
      }
    };

    // live real-time validation on input events (avoids premature errors).
    const touchedFields = new WeakSet();
    const submittingForms = new WeakSet();

    // AJAX submit
    const handleAjaxSubmit = async (form, submitBtn) => {
      // Guard against overlapping submissions (double-click, double-enter)
      if (submittingForms.has(form)) return;
      submittingForms.add(form);

      submitBtn?.classList.add(config.btnLoadingClass);
      if (submitBtn) submitBtn.disabled = true;

      // form.method (the DOM IDL property) always resolves to at least
      // "get", so `form.method || "POST"` never falls back. Reading the
      // raw attribute is the only reliable way to detect "no method set".
      const method = (form.getAttribute("method") || "POST").toUpperCase();

      // Optional per-form extra headers: data-ajax-headers='{"X-CSRF-Token":"..."}'
      let customHeaders = {};
      const headersAttr = form.getAttribute("data-ajax-headers");
      if (headersAttr) {
        try {
          customHeaders = JSON.parse(headersAttr);
        } catch {
          console.warn(
            "FrontAlign: Invalid JSON in data-ajax-headers — ignoring.",
            form,
          );
        }
      }

      // Optional per-form timeout override: data-ajax-timeout="15000"
      const timeoutMs =
        Number(form.getAttribute("data-ajax-timeout")) || config.ajaxTimeout;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      form.dispatchEvent(
        new CustomEvent("fa.form.start", { detail: { form } }),
      );

      try {
        const response = await fetch(form.action || window.location.href, {
          method,
          body: new FormData(form),
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json",
            ...customHeaders,
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
          clearServerFeedback(form);
          form.reset();
          form.classList.remove(config.validateClass);
          // Clear touched state on reset
          form.querySelectorAll("input, select, textarea").forEach((f) => {
            touchedFields.delete(f);
          });
          form.dispatchEvent(
            new CustomEvent("fa.form.success", { detail: { response, data } }),
          );
        } else {
          populateServerFeedback(form, data);
          form.dispatchEvent(
            new CustomEvent("fa.form.error", { detail: { response, data } }),
          );
        }
      } catch (error) {
        const aborted = error.name === "AbortError";
        console.error(
          aborted
            ? "FrontAlign AJAX Form Error: request timed out."
            : "FrontAlign AJAX Form Error:",
          aborted ? "" : error,
        );
        form.dispatchEvent(
          new CustomEvent("fa.form.error", {
            detail: { error, timeout: aborted },
          }),
        );
      } finally {
        clearTimeout(timeoutId);
        submittingForms.delete(form);
        submitBtn?.classList.remove(config.btnLoadingClass);
        if (submitBtn) submitBtn.disabled = false;
      }
    };

    // Event handlers

    const submitHandler = (evt) => {
      const form = evt.target.closest(config.selector);
      if (!form) return;

      // Clear any leftover server feedback before re-validating
      clearServerFeedback(form);

      form.classList.add(config.validateClass);
      form.querySelectorAll("input, select, textarea").forEach((f) => {
        touchedFields.add(f);
        validateField(f);
      });

      if (!form.checkValidity()) {
        evt.preventDefault();
        evt.stopPropagation();
        form.querySelector(":user-invalid")?.focus();
        return;
      }

      if (form.getAttribute("data-ajax") === "true") {
        evt.preventDefault();
        handleAjaxSubmit(form, evt.submitter);
      }
    };

    // blur → mark field as touched, validate immediately
    const blurHandler = (evt) => {
      const field = evt.target;
      if (!field.matches("input, select, textarea")) return;
      if (!field.closest(config.selector)) return;

      touchedFields.add(field);
      validateField(field);
    };

    // input → live validation only for already-touched fields
    const inputHandler = (evt) => {
      const target = evt.target;

      if (
        target.matches("input, select, textarea") &&
        target.closest(config.selector) &&
        touchedFields.has(target)
      ) {
        validateField(target);
      }
    };

    const changeHandler = (evt) => {
      const input = evt.target;
      if (!input.matches(config.inputFile)) return;

      const group = input.closest(config.groupFile);
      if (!group) return;

      const display = group.querySelector(config.uploadDisplay);

      if (display) {
        if (input.files.length === 0) {
          display.textContent =
            group.getAttribute("data-default-text") || "No file selected";
        } else if (input.files.length === 1) {
          display.textContent = `Selected: ${input.files[0].name.replace(/[<>/\\|:*?"']/g, "_")}`;
        } else {
          display.textContent = `${input.files.length} items selected`;
        }
      }

      // Seçilən kimi yoxlanışı işə salır
      touchedFields.add(input);
      validateField(input);
    };

    // Init visuals
    const initVisuals = () => {
      // Floating label for <select>
      document
        .querySelectorAll(".group.floating-label select")
        .forEach((select) => {
          if (select.nextElementSibling?.classList.contains("select-label"))
            return;

          const label = document.createElement("label");
          label.className = "select-label floating-label-hidden";
          label.textContent =
            select.options[0]?.textContent || "Select an option";
          select.insertAdjacentElement("afterend", label);

          select._faLabelToggle = () => {
            const visible = select.value !== "";
            label.classList.toggle("floating-label-visible", visible);
            label.classList.toggle("floating-label-hidden", !visible);
          };

          select.addEventListener("change", select._faLabelToggle);
          select._faLabelToggle();
        });

      // Pre-generate all feedback containers
      document
        .querySelectorAll(
          `${config.selector} input, ${config.selector} select, ${config.selector} textarea`,
        )
        .forEach(getOrGenerateFeedbackEl);
    };

    // Bind
    document.addEventListener("submit", submitHandler);
    document.addEventListener("change", changeHandler);
    document.addEventListener("input", inputHandler);
    document.addEventListener("blur", blurHandler, true);

    initVisuals();

    // Cleanup
    return () => {
      document.removeEventListener("submit", submitHandler);
      document.removeEventListener("change", changeHandler);
      document.removeEventListener("input", inputHandler);
      document.removeEventListener("blur", blurHandler, true);

      document
        .querySelectorAll(".group.floating-label select")
        .forEach((select) => {
          if (select._faLabelToggle) {
            select.removeEventListener("change", select._faLabelToggle);
            delete select._faLabelToggle;
          }
        });
    };
  }
}
