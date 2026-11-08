/*
 * Turnstile bridge for the Tandava native apps.
 *
 * Supabase Auth on tandava-prod requires a Turnstile token for every sign-up,
 * password sign-in and reset. Turnstile cannot run on the apps' own origins
 * (capacitor://localhost on iOS, https://localhost on Android), so the apps
 * frame this page from tandavastudio.com, where the site key is valid, and
 * receive the token by postMessage. vercel.json only lets the two app origins
 * frame this page, so no other site can collect tokens through it.
 */
(function () {
  var APP_ORIGINS = ["capacitor://localhost", "https://localhost"];
  var KEY_PATTERN = /^0x[A-Za-z0-9_-]{10,60}$/;
  var params = new URLSearchParams(window.location.search);
  var siteKey = params.get("k") || "";
  var theme = params.get("theme") === "dark" ? "dark" : "light";
  var widgetId = null;

  function framedByApp() {
    if (window.parent === window) return false;
    var ancestors = window.location.ancestorOrigins;
    if (ancestors && ancestors.length) return APP_ORIGINS.indexOf(ancestors[ancestors.length - 1]) !== -1;
    return true; // No ancestorOrigins (Firefox): the frame-ancestors header still applies.
  }

  function send(event, token) {
    var msg = { type: "tandava-turnstile", event: event };
    if (token) msg.token = token;
    window.parent.postMessage(msg, "*");
  }

  if (!framedByApp() || !KEY_PATTERN.test(siteKey)) {
    document.getElementById("note").style.display = "block";
    return;
  }

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent || APP_ORIGINS.indexOf(e.origin) === -1) return;
    if (e.data && e.data.type === "tandava-turnstile-reset" && widgetId !== null && window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  });

  window.onTandavaTurnstileLoad = function () {
    widgetId = window.turnstile.render("#widget", {
      sitekey: siteKey,
      theme: theme,
      appearance: "interaction-only",
      "before-interactive-callback": function () { send("show"); },
      "after-interactive-callback": function () { send("hide"); },
      callback: function (token) { send("token", token); },
      "expired-callback": function () { send("expired"); },
      "error-callback": function () { send("error"); }
    });
  };

  var s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTandavaTurnstileLoad";
  s.async = true;
  s.onerror = function () { send("error"); };
  document.head.appendChild(s);
})();
