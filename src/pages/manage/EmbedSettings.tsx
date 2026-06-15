import { useMemo, useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Code2, Copy, Calendar, MousePointerClick, CalendarDays } from "lucide-react";

function Snippet({ code, onCopy }: { code: string; onCopy: () => void }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-3 pr-12 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-7 w-7" onClick={onCopy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function EmbedSettings() {
  const { toast } = useToast();
  const [slug, setSlug] = useState("your-studio-slug");
  const [primary, setPrimary] = useState("4fd1c5");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://yourstudio.com";
  const p = primary.replace(/^#/, "");

  const snippets = useMemo(() => ({
    schedule: `<script src="${origin}/embed.js"\n  data-studio="${slug}"\n  data-view="schedule"\n  data-primary="${p}"></script>`,
    button: `<script src="${origin}/embed.js"\n  data-studio="${slug}"\n  data-view="button"\n  data-label="Book a Class"\n  data-primary="${p}"></script>`,
    event: `<script src="${origin}/embed.js"\n  data-studio="${slug}"\n  data-view="event"\n  data-event="EVENT_ID"\n  data-primary="${p}"></script>`,
  }), [origin, slug, p]);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast({ title: "Copied", description: "Paste it into your website's HTML." });
  };

  const cards = [
    { key: "schedule", icon: Calendar, title: "Class schedule", desc: "Shows your upcoming classes inline with a Book button on each." },
    { key: "button", icon: MousePointerClick, title: "Book Now button", desc: "A single button that opens your schedule in a lightbox popup." },
    { key: "event", icon: CalendarDays, title: "Single event", desc: "Promotes one workshop/training (set data-event to the event ID)." },
  ] as const;

  return (
    <ManageLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Code2 className="h-6 w-6" /> Website Embed
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Put your booking on your own website — Squarespace, Wix, WordPress, or plain HTML.
            Paste one line; it stays in sync and matches your brand. No iframe wrangling.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Configure</CardTitle>
            <CardDescription>Your studio must be set to “discoverable” for the public schedule to show.</CardDescription>
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
