/*!
 * Tandava embeddable booking widget.
 *
 * Paste on any website (Squarespace, Wix, WordPress, plain HTML):
 *
 *   <script src="https://YOUR-STUDIO.com/embed.js"
 *           data-studio="your-studio-slug"
 *           data-view="schedule"></script>
 *
 *   data-view:  "schedule" (inline class list) | "button" (lightbox) | "event"
 *   data-event: event id (required when data-view="event")
 *   data-label: button text (data-view="button"), default "Book a Class"
 *   data-primary: brand hex (e.g. "4fd1c5") to match your site
 *
 * The script injects a sandboxed iframe pointing at the studio's Tandava
 * deployment, auto-resizes it to fit, and never touches the host page's styles.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var base = new URL(script.src).origin;
  var studio = script.getAttribute("data-studio") || "";
  var view = script.getAttribute("data-view") || "schedule";
  var eventId = script.getAttribute("data-event") || "";
  var label = script.getAttribute("data-label") || "Book a Class";
  var primary = (script.getAttribute("data-primary") || "").replace(/^#/, "");

  function embedSrc() {
    var path =
      view === "event"
        ? "/embed/event/" + encodeURIComponent(eventId)
        : "/embed/schedule/" + encodeURIComponent(studio);
    return base + path + (primary ? "?primary=" + encodeURIComponent(primary) : "");
  }

  function makeIframe() {
    var iframe = document.createElement("iframe");
    iframe.src = embedSrc();
    iframe.title = "Tandava booking";
    iframe.setAttribute("loading", "lazy");
    // Sandbox: allow the app to run (same-origin to Tandava, scripts, forms) and
    // to open booking/checkout in a new tab, while isolating it from the host page.
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
    );
    iframe.style.cssText =
      "width:100%;border:0;display:block;background:transparent;min-height:120px;";
    iframe.setAttribute("scrolling", "no");
    return iframe;
  }

  // Auto-resize: the embed page posts its height; match the right iframe.
  var frames = [];
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "tandava-embed-height") return;
    frames.forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = e.data.height + "px";
    });
  });

  if (view === "button") {
    var btn = document.createElement("button");
    btn.textContent = label;
    btn.type = "button";
    btn.style.cssText =
      "background:" + (primary ? "#" + primary : "#4fd1c5") +
      ";color:#fff;border:0;border-radius:8px;padding:12px 22px;font:600 15px/1 system-ui,sans-serif;cursor:pointer;";
    btn.addEventListener("click", function () {
      var overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;";
      var panel = document.createElement("div");
      panel.style.cssText =
        "background:#fff;border-radius:14px;max-width:460px;width:100%;max-height:90vh;overflow:auto;position:relative;";
      var close = document.createElement("button");
      close.textContent = "×";
      close.setAttribute("aria-label", "Close");
      close.style.cssText =
        "position:absolute;top:8px;right:12px;border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:#666;";
      var iframe = makeIframe();
      frames.push(iframe);
      close.addEventListener("click", function () { document.body.removeChild(overlay); });
      overlay.addEventListener("click", function (e) { if (e.target === overlay) document.body.removeChild(overlay); });
      panel.appendChild(close);
      panel.appendChild(iframe);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
    });
    script.parentNode.insertBefore(btn, script);
    return;
  }

  // Inline iframe (schedule / event).
  var frame = makeIframe();
  frames.push(frame);
  script.parentNode.insertBefore(frame, script);
})();
