/*! FormChat embed script */
(function () {
  "use strict";

  var script =
    document.currentScript || document.querySelector("script[data-form]");
  if (!script) return;

  var slug = script.getAttribute("data-form") || "";
  if (!/^[a-zA-Z0-9]{6,40}$/.test(slug)) {
    console.warn("[FormChat] Missing or invalid data-form attribute.");
    return;
  }

  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch {
    return;
  }

  // Do not add the same widget twice
  window.__formchat = window.__formchat || {};
  if (window.__formchat[slug]) return;
  window.__formchat[slug] = true;

  var ICON_CHAT =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_CLOSE =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>';

  var CSS =
    ":host{all:initial}" +
    ".launcher{position:fixed;right:20px;bottom:20px;width:56px;height:56px;padding:0;margin:0;border:0;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.25);z-index:2147483647;transition:transform .15s ease}" +
    ".launcher:hover{transform:scale(1.05)}" +
    ".launcher:focus-visible{outline:3px solid #94a3b8;outline-offset:3px}" +
    ".panel{position:fixed;right:20px;bottom:90px;width:380px;max-width:calc(100vw - 40px);height:560px;max-height:calc(100vh - 110px);border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.25);z-index:2147483647;display:none}" +
    ".panel.open{display:block}" +
    "iframe{display:block;width:100%;height:100%;border:0;background:#fff}" +
    "@media (max-width:639px){" +
    ".panel{top:0;left:0;right:0;bottom:0;width:auto;max-width:none;height:auto;max-height:none;border-radius:0}" +
    ".launcher.open{display:none}" +
    "}";

  function readableTextColor(hex) {
    var value = parseInt(hex.slice(1), 16);
    var r = (value >> 16) & 255;
    var g = (value >> 8) & 255;
    var b = value & 255;
    var brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 160 ? "#0f172a" : "#ffffff";
  }

  function whenBodyReady(callback) {
    if (document.body) {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  }

  function mount(info) {
    var color = /^#[0-9a-fA-F]{6}$/.test(info.primaryColor)
      ? info.primaryColor
      : "#4f46e5";
    var title = typeof info.title === "string" ? info.title : "Chat";

    var host = document.createElement("div");
    host.setAttribute("data-formchat-host", slug);
    var root = host.attachShadow({ mode: "closed" });

    var style = document.createElement("style");
    style.textContent = CSS;

    var panel = document.createElement("div");
    panel.className = "panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", title);

    var launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "launcher";
    launcher.style.backgroundColor = color;
    launcher.style.color = readableTextColor(color);

    root.appendChild(style);
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(host);

    var iframe = null;
    var isOpen = false;

    function setOpen(value) {
      isOpen = value;

      // The chat page loads only the first time the visitor opens it
      if (isOpen && !iframe) {
        iframe = document.createElement("iframe");
        iframe.src = origin + "/embed/" + encodeURIComponent(slug);
        iframe.title = title;
        panel.appendChild(iframe);
      }

      panel.className = isOpen ? "panel open" : "panel";
      launcher.className = isOpen ? "launcher open" : "launcher";
      launcher.innerHTML = isOpen ? ICON_CLOSE : ICON_CHAT;
      launcher.setAttribute("aria-expanded", String(isOpen));
      launcher.setAttribute("aria-label", isOpen ? "Close chat" : "Open chat");
    }

    launcher.addEventListener("click", function () {
      setOpen(!isOpen);
    });

    window.addEventListener("message", function (event) {
      if (event.origin !== origin) return;
      if (!iframe || event.source !== iframe.contentWindow) return;
      if (event.data && event.data.type === "formchat:close") {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) setOpen(false);
    });

    setOpen(false);
  }

  // Only published forms answer with 200. Anything else adds nothing to the page.
  fetch(origin + "/api/public/forms/" + encodeURIComponent(slug))
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (info) {
      if (!info) {
        window.__formchat[slug] = false;
        return;
      }
      whenBodyReady(function () {
        mount(info);
      });
    })
    .catch(function () {
      window.__formchat[slug] = false;
    });
})();