/*!
 * FrontAlign v1.0.3
 * (c) Eyruz Badalzada
 * Released under the MIT License
 * https://www.frontalign.dev
 */

const NAMESPACE = "FrontAlign";

const state = {
  enabled: false,
};

/**
 * Badge color for each log level.
 * In Node.js, `%c` is simply ignored (the argument is
 * dropped), so this styling is safe in both the browser
 * and server-side consoles.
 */
const LEVELS = {
  log: { label: "LOG", color: "#3b82f6" }, // blue
  warn: { label: "WARN", color: "#f59e0b" }, // amber
  error: { label: "ERROR", color: "#ef4444" }, // red
};

const NAMESPACE_STYLE =
  "background:#0f172a;color:#f8fafc;font-weight:600;padding:2px 8px;border-radius:4px 0 0 4px;";

const badgeStyle = (color) =>
  `background:${color};color:#0f172a;font-weight:700;padding:2px 8px;border-radius:0 4px 4px 0;`;

const format = (level) => [
  `%c ${NAMESPACE} %c ${LEVELS[level].label} `,
  NAMESPACE_STYLE,
  badgeStyle(LEVELS[level].color),
];

/**
 * Shared emitter for `log`/`warn`/`error`.
 * When `guarded = true`, the message is only printed if
 * debug mode is enabled.
 */
function emit(method, level, guarded, args) {
  if (guarded && !state.enabled) return;
  console[method](...format(level), ...args);
}

const Debug = {
  /** Enables debug mode. */
  enable() {
    state.enabled = true;
  },

  /** Disables debug mode. */
  disable() {
    state.enabled = false;
  },

  /** Sets the state directly from a boolean (e.g. config.debug). */
  set(value) {
    state.enabled = Boolean(value);
  },

  /** Read-only access to the current state. */
  get isEnabled() {
    return state.enabled;
  },

  /**
   * Informational messages — e.g. for cases where a
   * function exits early due to a guard clause.
   * Only visible when debug mode is enabled.
   */
  log(...args) {
    emit("log", "log", true, args);
  },

  /**
   * Warnings — for unexpected but non-critical situations
   * (e.g. an unknown component name).
   * Only visible when debug mode is enabled.
   */
  warn(...args) {
    emit("warn", "warn", true, args);
  },

  /**
   * Real errors — these are always visible REGARDLESS of
   * the debug flag, because hiding a genuine configuration
   * error in production is never the right call.
   */
  error(...args) {
    emit("error", "error", false, args);
  },

  /** Groups consecutive messages together when debug mode is enabled. */
  group(label) {
    if (!state.enabled) return;
    console.group(...format("log"), label);
  },

  groupEnd() {
    if (state.enabled) console.groupEnd();
  },
};

export default Debug;
