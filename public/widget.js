/*!
 * Tandava schedule Web Component — a no-iframe embed.
 *
 * For sites/CMS plans that strip iframes (or when you want the schedule inlined
 * into your own DOM). Renders into shadow DOM, so it won't fight your page's
 * styles. Reads public data only via the get_public_schedule RPC.
 *
 *   <script src="https://YOUR-STUDIO.com/widget.js" defer></script>
 *   <tandava-schedule
 *     supabase-url="https://xxxx.supabase.co"
 *     anon-key="eyJ...publishable..."
 *     studio="your-studio-slug"
 *     app-url="https://YOUR-STUDIO.com"
 *     primary="#4fd1c5"
 *     limit="12"></tandava-schedule>
 *
 * The anon/publishable key is safe to expose — it only permits the public,
 * read-only RPC (row/column-restricted server-side). Booking opens app-url in a
 * new tab, so checkout/login are never handled here.
 */
(function () {
  if (typeof window === "undefined" || window.customElements?.get("tandava-schedule")) return;

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  function fmtWhen(iso, tz) {
    try {
      return new Date(iso).toLocaleString(undefined, {
        timeZone: tz || undefined,
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (e) {
      return new Date(iso).toLocaleString();
    }
  }

  var STYLE =
    ":host{all:initial;display:block;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1520}" +
    ".w{display:flex;flex-direction:column;gap:8px}" +
    ".hd{font-size:15px;font-weight:600;margin:0 0 2px}" +
    ".row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e5e2e8;border-radius:10px;padding:8px 12px}" +
    ".nm{font-size:14px;font-weight:500;margin:0}" +
    ".mt{font-size:12px;color:#6b7280;margin:2px 0 0}" +
    ".btn{border:0;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;color:#fff;text-decoration:none;cursor:pointer;white-space:nowrap}" +
    ".muted{font-size:13px;color:#6b7280;text-align:center;padding:20px 0}" +
    ".ft{font-size:10px;color:#9ca3af;text-align:center;margin-top:2px}";

  class TandavaSchedule extends HTMLElement {
    connectedCallback() {
      // Reuse the shadow root if the element is re-parented (connectedCallback
      // can fire more than once); attachShadow() throws on a second call.
      this._root = this.shadowRoot || this.attachShadow({ mode: "open" });
      this._primary = this.getAttribute("primary") || "#4fd1c5";
      this._appUrl = (this.getAttribute("app-url") || "").replace(/\/$/, "");
      this.render('<p class="muted">Loading classes…</p>');
      this.load();
    }

    render(inner, title) {
      this._root.innerHTML =
        "<style>" + STYLE + "</style>" +
        '<div class="w">' +
        '<h2 class="hd">' + esc(title || "Class Schedule") + "</h2>" +
        inner +
        '<p class="ft">Powered by Tandava</p></div>';
    }

    async load() {
      var url = this.getAttribute("supabase-url");
      var key = this.getAttribute("anon-key");
      var studio = this.getAttribute("studio");
      var limit = parseInt(this.getAttribute("limit") || "12", 10) || 12;

      if (!url || !key || !studio) {
        this.render('<p class="muted">Widget not configured.</p>');
        return;
      }

      try {
        var res = await fetch(url.replace(/\/$/, "") + "/rest/v1/rpc/get_public_schedule", {
          method: "POST",
          headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
          body: JSON.stringify({ p_slug: studio, p_limit: limit }),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        var rows = await res.json();
        this.renderRows(Array.isArray(rows) ? rows : []);
      } catch (e) {
        this.render('<p class="muted">Couldn\'t load the schedule.</p>');
      }
    }

    renderRows(rows) {
      var title = (rows[0] && rows[0].studio_name) || "Class Schedule";
      if (rows.length === 0) {
        this.render('<p class="muted">No upcoming classes right now — check back soon.</p>', title);
        return;
      }
      var bookHref = this._appUrl ? this._appUrl + "/schedule" : "#";
      var self = this;
      var items = rows
        .map(function (r) {
          var spots = Math.max(0, (r.capacity || 0) - (r.booked_count || 0));
          var full = spots <= 0;
          var loc = r.location_name || r.room || "";
          return (
            '<div class="row"><div><p class="nm">' + esc(r.offering_name) + "</p>" +
            '<p class="mt">' + esc(fmtWhen(r.starts_at, r.studio_timezone)) +
            (loc ? " · " + esc(loc) : "") + "</p></div>" +
            '<a class="btn" style="background:' + (full ? "#9ca3af" : esc(self._primary)) +
            '" href="' + esc(bookHref) + '" target="_blank" rel="noopener">' +
            (full ? "Waitlist" : "Book") + "</a></div>"
          );
        })
        .join("");
      this.render(items, title);
    }
  }

  window.customElements.define("tandava-schedule", TandavaSchedule);
})();
