import { useMemo, useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Code2, Copy, Calendar, MousePointerClick, CalendarDays, ChevronDown, AlertTriangle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useMyStudio } from "@/hooks/useBooking";
import { isBackendConfigured } from "@/lib/backend";
import { DEMO_STUDIO } from "@/contexts/DemoContext";

/** Demo mode has no backend; show the page against the demo studio. */
const DEMO_STUDIO_SUMMARY = {
  slug: DEMO_STUDIO.slug,
  name: DEMO_STUDIO.name,
  brand_primary_color: DEMO_STUDIO.brand_primary_color ?? "#4fd1c5",
  discoverable: true,
  page_live: true,
};

/**
 * Per-platform install steps.
 *
 * The guide previously covered Squarespace, Wix, WordPress, Webflow and plain
 * HTML with one sentence: "paste it into a code/embed block." Those are four
 * genuinely different flows, and the plan requirement on Squarespace is a hard
 * blocker worth naming before an owner spends twenty minutes discovering it.
 * Vague instructions are the specific thing that makes a competitor's install
 * page a mess.
 */
const PLATFORM_STEPS: { name: string; note?: string; steps: string[] }[] = [
  {
    name: "Squarespace",
    note: "Needs a Business plan or higher. Personal plans cannot add code blocks at all.",
    steps: [
      "Open the page where you want your schedule and click Edit.",
      "Click an insert point (+), then search for and choose Code.",
      "Delete the sample HTML in the block.",
      "Paste the snippet you copied above.",
      "Click Apply, then Save. The schedule appears when you view the live page, not always in the editor.",
    ],
  },
  {
    name: "Wix",
    steps: [
      "In the editor, click Add (+) → Embed Code → Embed HTML.",
      "Click Enter Code on the box that appears.",
      "Paste the snippet, then click Update.",
      "Drag the box to size it roughly; it will resize itself to fit your classes.",
      "Click Publish. It will not show while you are still editing.",
    ],
  },
  {
    name: "WordPress",
    note: "If someone else maintains your site, send them the snippet instead.",
    steps: [
      "Edit the page where you want your schedule.",
      "Block editor: add a Custom HTML block. Classic editor: switch to the Text tab.",
      "Paste the snippet.",
      "Update the page.",
      "If the snippet disappears when you save, your host or a security plugin is stripping scripts. Ask whoever maintains the site to allow it, or use the Booking Links page instead.",
    ],
  },
];


function Snippet({ code, onCopy }: { code: string; onCopy: () => void }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-3 pe-12 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button variant="ghost" size="icon" className="absolute end-2 top-2 h-7 w-7" onClick={onCopy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function EmbedSettings() {
  const { toast } = useToast();
  const live = isBackendConfigured();
  const { data: myStudio } = useMyStudio();

  // Prefilled from the studio record. The previous version defaulted to the
  // literal string "your-studio-slug" and a generic teal, which asked an owner
  // to know what a slug is and to go find their own brand color. This page's
  // audience is the owner installing it alone
  // (docs/positioning/AUDIENCES.md), so neither question should be asked.
  const studio = live ? myStudio : DEMO_STUDIO_SUMMARY;
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [primaryOverride, setPrimaryOverride] = useState<string | null>(null);

  const slug = slugOverride ?? studio?.slug ?? "";
  const primary = primaryOverride ?? (studio?.brand_primary_color ?? "#4fd1c5").replace(/^#/, "");
  const setSlug = (v: string) => setSlugOverride(v);
  const setPrimary = (v: string) => setPrimaryOverride(v);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://yourstudio.com";
  const p = primary.replace(/^#/, "");
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://YOUR-PROJECT.supabase.co";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_PUBLISHABLE_ANON_KEY";

  const snippets = useMemo(() => ({
    schedule: `<script src="${origin}/embed.js"\n  data-studio="${slug}"\n  data-view="schedule"\n  data-primary="${p}"></script>`,
    button: `<script src="${origin}/embed.js"\n  data-studio="${slug}"\n  data-view="button"\n  data-label="Book a Class"\n  data-primary="${p}"></script>`,
    event: `<script src="${origin}/embed.js"\n  data-studio="${slug}"\n  data-view="event"\n  data-event="EVENT_ID"\n  data-primary="${p}"></script>`,
    webComponent: `<script src="${origin}/widget.js" defer></script>\n<tandava-schedule\n  supabase-url="${supabaseUrl}"\n  anon-key="${anonKey}"\n  studio="${slug}"\n  app-url="${origin}"\n  primary="#${p}"></tandava-schedule>`,
  }), [origin, slug, p, supabaseUrl, anonKey]);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast({ title: "Copied", description: "Paste it into your website's HTML." });
  };

  // The three an owner should ever need. The web-component variant is a
  // developer escape hatch (it requires a Supabase URL and publishable key) and
  // lives behind a disclosure below rather than as a fourth peer option.
  const cards = [
    { key: "schedule", icon: Calendar, title: "Class schedule", desc: "Your upcoming classes, with a Book button on each. Start here." },
    { key: "button", icon: MousePointerClick, title: "Book Now button", desc: "One button that opens your schedule in a popup. Good for a header or hero." },
    { key: "event", icon: CalendarDays, title: "Single event", desc: "Promotes one workshop or training." },
  ] as const;

  return (
    <ManageLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Code2 className="h-6 w-6" /> Website Embed
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Put your booking on your own website. Paste one line; it stays in sync and matches your
            brand.
          </p>
        </div>

        {/* Not everyone needs a widget, and the link needs no install at all.
            Saying so up front costs us nothing and saves the wrong person
            twenty minutes. */}
        <Card className="border-border bg-muted/40">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-medium">Don't have a website, or can't edit it?</p>
              <p className="text-muted-foreground">
                You can share a link straight to your branded booking page instead. Nothing to
                install.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to="/manage/share">
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Get my booking link
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Check your details</CardTitle>
            <CardDescription>
              Filled in from your studio settings. You only need to change these if you want the
              widget to look different from your brand.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Studio slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary">Brand color (hex)</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={`#${p}`} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-12 p-1" />
                <Input id="primary" value={p} onChange={(e) => setPrimary(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Copy a snippet</CardTitle>
            <CardDescription>Pick the widget you want and paste it where it should appear.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {cards.map((c) => (
              <div key={c.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <c.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{c.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
                <Snippet code={snippets[c.key]} onCopy={() => copy(snippets[c.key])} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Paste it into your site</CardTitle>
            <CardDescription>Steps for the platform your website is built on.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PLATFORM_STEPS.map((platform) => (
              <Collapsible key={platform.name}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50">
                  <span>{platform.name}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-2 pt-3">
                  {platform.note && (
                    <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                      <span>{platform.note}</span>
                    </div>
                  )}
                  <ol className="list-decimal space-y-1.5 ps-5 text-sm text-muted-foreground">
                    {platform.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </CollapsibleContent>
              </Collapsible>
            ))}
            <p className="text-xs text-muted-foreground">
              Built on something else, or someone else maintains your site? Send them the snippet
              above and tell them it goes anywhere in the page body.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Preview</CardTitle>
            <CardDescription>The live widget for this studio and color (uses sample data in demo mode).</CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              title="Widget preview"
              src={`${origin}/embed/schedule/${encodeURIComponent(slug)}?primary=${p}`}
              className="w-full rounded-lg border border-border"
              style={{ minHeight: 320 }}
            />
          </CardContent>
        </Card>

        {live && studio && "page_live" in studio && !studio.page_live && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Your schedule isn't public yet</p>
                <p className="text-muted-foreground">
                  The widget will load empty until your booking page is live. Turn on Booking page live
                  in Settings, then reload your site.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Developer escape hatch. Collapsed, and labelled as such, because it
            needs a Supabase URL and publishable key — not something to put in
            front of a studio owner installing this alone. */}
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-2.5 text-left text-sm hover:bg-muted/50">
            <span className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              My site strips scripts or blocks iframes
              <Badge variant="outline" className="ms-1 text-[10px]">
                For developers
              </Badge>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 px-3 pb-2 pt-3">
            <p className="text-sm text-muted-foreground">
              Some hosts remove <code>&lt;iframe&gt;</code> tags. This custom element renders the
              schedule inline instead. It needs two technical values, so it is best handed to
              whoever maintains the site. The key is safe to publish: it only permits the public,
              read-only schedule.
            </p>
            <Snippet code={snippets.webComponent} onCopy={() => copy(snippets.webComponent)} />
          </CollapsibleContent>
        </Collapsible>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>The snippet loads a small script that injects a secure, auto-resizing frame showing your live schedule. Booking and payment open on your Tandava site in a new tab, so checkout and login are never trapped inside the widget.</p>
            <p>Because it reads public data only, there are no API keys on your website. Update your classes in Tandava and the widget updates everywhere it's embedded.</p>
          </CardContent>
        </Card>
      </div>
    </ManageLayout>
  );
}
