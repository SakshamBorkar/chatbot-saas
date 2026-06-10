/**
 * Chatbot SaaS — Embeddable Widget Loader
 *
 * Usage:
 *   <script src="https://your-chatbot.vercel.app/widget.js"
 *           data-bot-id="customer123" async></script>
 *
 * Optional attributes:
 *   data-theme         "light" | "dark"          (default: loaded from bot config)
 *   data-primary-color "#hex"                     (default: loaded from bot config)
 *   data-position      "bottom-right"|"bottom-left" (default: "bottom-right")
 */
(function () {
  "use strict";

  // ── Config ────────────────────────────────────────────────────────────────
  var script = document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var BASE_URL = (script.src || "").replace(/\/widget\.js.*$/, "");
  var botId = script.getAttribute("data-bot-id");
  var overrideTheme = script.getAttribute("data-theme");
  var overrideColor = script.getAttribute("data-primary-color");
  var position = script.getAttribute("data-position") || "bottom-right";

  if (!botId) {
    console.warn("[ChatWidget] data-bot-id is required.");
    return;
  }

  // ── State ─────────────────────────────────────────────────────────────────
  var isOpen = false;
  var iframe = null;
  var button = null;
  var config = {};

  // ── Helpers ───────────────────────────────────────────────────────────────
  function isRight() { return position !== "bottom-left"; }

  function trackEvent(eventType) {
    try {
      fetch(BASE_URL + "/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: botId, eventType: eventType }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  // ── Build UI ───────────────────────────────────────────────────────────────
  function buildButton(primaryColor) {
    button = document.createElement("button");
    button.id = "__chatwidget-btn__";
    button.setAttribute("aria-label", "Open chat");
    button.innerHTML = "&#x1F4AC;"; // 💬

    var side = isRight() ? "right" : "left";
    Object.assign(button.style, {
      position: "fixed",
      bottom: "24px",
      [side]: "24px",
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      backgroundColor: primaryColor || "#2563eb",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontSize: "24px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      zIndex: "2147483646",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform 0.15s ease",
    });

    button.addEventListener("mouseenter", function () {
      button.style.transform = "scale(1.1)";
    });
    button.addEventListener("mouseleave", function () {
      button.style.transform = "scale(1)";
    });

    button.addEventListener("click", toggleWidget);
    document.body.appendChild(button);
  }

  function buildIframe() {
    var container = document.createElement("div");
    container.id = "__chatwidget-container__";

    var side = isRight() ? "right" : "left";
    Object.assign(container.style, {
      position: "fixed",
      bottom: "92px",
      [side]: "24px",
      width: "370px",
      height: "560px",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      zIndex: "2147483645",
      border: "1px solid rgba(0,0,0,0.08)",
      display: "none",
      // Responsive on narrow screens
      maxWidth: "calc(100vw - 48px)",
      maxHeight: "calc(100vh - 116px)",
    });

    iframe = document.createElement("iframe");

    var params = new URLSearchParams({ botId: botId });
    if (overrideTheme) params.set("theme", overrideTheme);
    if (overrideColor) params.set("primaryColor", overrideColor);

    iframe.src = BASE_URL + "/embed?" + params.toString();
    iframe.title = "Chat widget";
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "none",
    });
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allow", "");
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");

    container.appendChild(iframe);
    document.body.appendChild(container);
    return container;
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────
  function toggleWidget() {
    if (!iframe) {
      var container = buildIframe();
      isOpen = true;
      container.style.display = "block";
      button.innerHTML = "&#x2715;"; // ✕
      button.setAttribute("aria-label", "Close chat");
      trackEvent("widget_opened");
      return;
    }

    isOpen = !isOpen;
    var c = document.getElementById("__chatwidget-container__");
    if (c) c.style.display = isOpen ? "block" : "none";
    button.innerHTML = isOpen ? "&#x2715;" : "&#x1F4AC;";
    button.setAttribute("aria-label", isOpen ? "Close chat" : "Open chat");

    if (isOpen) trackEvent("widget_opened");
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(cfg) {
    config = cfg || {};
    var color = overrideColor || config.primaryColor || "#2563eb";
    buildButton(color);
    trackEvent("widget_loaded");
  }

  function fetchConfigAndInit() {
    fetch(BASE_URL + "/api/bot/" + encodeURIComponent(botId))
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(init)
      .catch(function () { init({}); });
  }

  // Wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fetchConfigAndInit);
  } else {
    fetchConfigAndInit();
  }
})();
