/**
 * /tools/studio-calculator — Yoga Studio Profitability Calculator.
 *
 * Public, no auth, no paywall, entirely client-side. Pick a preset, adjust six
 * inputs, get break-even members, students per class and a twelve-month cash
 * curve. Every assumption underneath is editable, because every assumption is a
 * best guess rather than a quote.
 *
 * The model lives in src/lib/studioEcon.ts and is readable top to bottom.
 * scripts/prerender-tools.ts writes a static HTML snapshot of this route at
 * build time from the same article and FAQ module the page renders
 * (src/content/studioCalculator.ts), so the structured data can never claim
 * something the page does not say.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Link2, Check, ShieldAlert, Calculator } from "lucide-react";
import {
  CALC_ARTICLE,
  CALC_CAVEATS,
  CALC_DISCLAIMER_SHORT,
  CALC_FAQ,
  CALC_HERO_PROMISE,
  CALC_TITLE,
} from "@/content/studioCalculator";
import {
  DEFAULT_PRESET_ID,
  classPassDilution,
  clonePresetInputs,
  computeStudio,
  getPreset,
  softwareFiveYear,
  type Assumptions,
  type StudioInputs,
  type StudioPreset,
} from "@/lib/studioEcon";
import {
  decodeScenario,
  encodeScenario,
  modifiedAssumptionKeys,
  scenarioUrl,
} from "@/lib/studioCalcUrl";
import { money, count } from "@/lib/studioNarrative";
import { PresetCards } from "@/components/studioCalc/PresetCards";
import { QuickConfig } from "@/components/studioCalc/QuickConfig";
import { AdvancedDrawer } from "@/components/studioCalc/AdvancedDrawer";
import { HeadlineStrip } from "@/components/studioCalc/HeadlineStrip";
import { CostDonut } from "@/components/studioCalc/CostDonut";
import { BreakEvenMountain } from "@/components/studioCalc/BreakEvenMountain";
import { SeasonalityWave } from "@/components/studioCalc/SeasonalityWave";
import { RoomEconomics } from "@/components/studioCalc/RoomEconomics";
import { ClassPassStrip } from "@/components/studioCalc/ClassPassStrip";
import { NarrativePanel } from "@/components/studioCalc/NarrativePanel";
import { useDebounced, usePrefersReducedMotion } from "@/components/studioCalc/useAnimatedNumber";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { CALC_META_DESCRIPTION, CALC_KEYWORDS, calcStructuredData } from "@/content/studioCalculator";

const ENGINE_SOURCE_URL =
  "https://github.com/TaylorONeal/tandava/blob/main/src/lib/studioEcon.ts";

export default function StudioCalculator() {
  // Initial state comes from the URL when a scenario was shared, otherwise from
  // the default preset. Reading it once on mount keeps the page deterministic.
  const initial = useMemo(
    () =>
      typeof window !== "undefined"
        ? decodeScenario(window.location.search)
        : { inputs: clonePresetInputs(getPreset(DEFAULT_PRESET_ID)), presetId: DEFAULT_PRESET_ID },
    [],
  );

  const [inputs, setInputs] = useState<StudioInputs>(initial.inputs);
  const [presetId, setPresetId] = useState(initial.presetId);
  const [copied, setCopied] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const reduced = usePrefersReducedMotion();

  // 120ms debounce so slider drags feel live without recomputing on every frame.
  const debouncedInputs = useDebounced(inputs, 120);
  const results = useMemo(() => computeStudio(debouncedInputs), [debouncedInputs]);
  const dilution = useMemo(() => classPassDilution(debouncedInputs), [debouncedInputs]);
  const fiveYear = useMemo(() => softwareFiveYear(debouncedInputs), [debouncedInputs]);
  const modified = useMemo(
    () => modifiedAssumptionKeys(inputs, presetId),
    [inputs, presetId],
  );

  useEffect(() => {
    document.title = CALC_TITLE;
  }, []);

  // Keep the URL in step with the scenario so a copied address bar is already
  // a shareable link. replaceState rather than pushState: a slider drag should
  // not fill the back button with history.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = encodeScenario(debouncedInputs, presetId);
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }, [debouncedInputs, presetId]);

  const patch = useCallback((next: Partial<StudioInputs>) => {
    setInputs((prev) => ({ ...prev, ...next }));
  }, []);

  const patchAssumptions = useCallback((next: Partial<Assumptions>) => {
    setInputs((prev) => ({ ...prev, assumptions: { ...prev.assumptions, ...next } }));
  }, []);

  /**
   * Drop overrides so the tier or business-model default takes effect again.
   * Distinct from resetKeys, which restores the preset's own explicit values.
   */
  const clearAssumptions = useCallback((keys: (keyof Assumptions)[]) => {
    setInputs((prev) => {
      const assumptions = { ...prev.assumptions };
      keys.forEach((key) => delete assumptions[key]);
      return { ...prev, assumptions };
    });
  }, []);

  const resetKeys = useCallback(
    (keys: (keyof Assumptions)[]) => {
      setInputs((prev) => {
        const assumptions = { ...prev.assumptions };
        const presetAssumptions = getPreset(presetId).inputs.assumptions;
        for (const key of keys) {
          if (presetAssumptions[key] !== undefined) {
            assumptions[key] = presetAssumptions[key];
          } else {
            delete assumptions[key];
          }
        }
        return { ...prev, assumptions };
      });
    },
    [presetId],
  );

  const selectPreset = useCallback(
    (preset: StudioPreset) => {
      setInputs(clonePresetInputs(preset));
      setPresetId(preset.id);
      // Brief sweep across the config column so it is obvious what changed.
      setHighlight(true);
      window.setTimeout(() => setHighlight(false), 700);
    },
    [],
  );

  const copyLink = useCallback(async () => {
    const url = scenarioUrl(inputs, presetId);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the address bar already holds the same URL.
      setCopied(false);
    }
  }, [inputs, presetId]);

  const dirty =
    JSON.stringify(inputs) !== JSON.stringify(clonePresetInputs(getPreset(presetId)));

  return (
    <ToolLayout>
      <SEOHead
        title="Yoga Studio Profitability Calculator: Break-Even, Costs, and Cash Flow"
        description={CALC_META_DESCRIPTION}
        canonical="/tools/studio-calculator"
        ogType="article"
        structuredData={calcStructuredData()}
      />
      <div className="mx-auto w-full max-w-6xl">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header>
          {/* Not a pricing badge. Everything Tandava ships is free and open
              source, so "free tool, no account" would be saying nothing here.
              The eyebrow says what the page is instead. */}
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Calculator className="h-3.5 w-3.5" aria-hidden />
            Studio economics
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">
            Yoga Studio Profitability Calculator
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {CALC_HERO_PROMISE}
          </p>
        </header>

        <div className="mt-6">
          <HeadlineStrip results={results} members={debouncedInputs.members} />
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {CALC_DISCLAIMER_SHORT}
        </p>

        {/* ── Presets ──────────────────────────────────────────────────── */}
        <div className="mt-8">
          <PresetCards activePresetId={presetId} dirty={dirty} onSelect={selectPreset} />
        </div>

        {/* ── Config + results ─────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          {/* Preset selection sweeps a brief tint across the changed fields.
              Reduced motion drops the transition, so the tint never appears. */}
          <div
            className={`space-y-4 rounded-xl ${
              reduced ? "" : "transition-colors duration-700"
            } ${highlight && !reduced ? "bg-primary/10" : "bg-transparent"}`}
          >
            <QuickConfig
              inputs={inputs}
              resolved={results.resolvedAssumptions}
              rent={results.rent}
              rentableSf={results.rentableSf}
              softwareCost={results.resolvedAssumptions.softwareCost}
              fiveYear={fiveYear}
              revenuePerVisit={results.revenuePerVisit}
              onPatch={patch}
              onPatchAssumptions={patchAssumptions}
              onClearAssumptions={clearAssumptions}
            />
            <AdvancedDrawer
              inputs={inputs}
              results={results}
              modified={modified}
              onPatch={patch}
              onPatchAssumptions={patchAssumptions}
              onResetKeys={resetKeys}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid="copy-link"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Link2 className="h-3.5 w-3.5" aria-hidden />
                )}
                {copied ? "Link copied" : "Copy link to this scenario"}
              </button>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <NarrativePanel inputs={debouncedInputs} results={results} />
            <BreakEvenMountain
              inputs={debouncedInputs}
              results={results}
              onMembersChange={(members) => patch({ members })}
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CostDonut results={results} />
              <SeasonalityWave results={results} />
            </div>
            <RoomEconomics results={results} />
            <ClassPassStrip inputs={debouncedInputs} dilution={dilution} />
            <ScenarioSummary results={results} />
          </div>
        </div>

        {/* ── Article ──────────────────────────────────────────────────── */}
        <article className="mt-14 max-w-3xl">
          <h2 className="font-display text-2xl text-foreground">
            How yoga studio economics actually work
          </h2>
          {CALC_ARTICLE.map((section) => (
            <section key={section.heading} className="mt-8">
              <h2 className="font-display text-xl leading-snug text-foreground">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          {/* ── FAQ ────────────────────────────────────────────────────── */}
          <section className="mt-12">
            <h2 className="font-display text-2xl text-foreground">Frequently asked questions</h2>
            <dl className="mt-4 space-y-5">
              {CALC_FAQ.map((item) => (
                <div key={item.q}>
                  <dt className="text-sm font-medium text-foreground">{item.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── Caveats ────────────────────────────────────────────────── */}
          <section className="mt-12 rounded-xl border border-border bg-muted/50 p-4">
            <h2 className="flex items-center gap-1.5 font-display text-lg text-foreground">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" aria-hidden />
              Read this before you use any of these numbers
            </h2>
            <ul className="mt-3 space-y-2.5">
              {CALC_CAVEATS.map((caveat) => (
                <li key={caveat} className="text-xs leading-relaxed text-muted-foreground">
                  {caveat}
                </li>
              ))}
            </ul>
          </section>
        </article>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="mt-12 border-t border-border pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            The math is not hidden. Every formula and every constant in this calculator lives in a
            single readable file,{" "}
            <a
              href={ENGINE_SOURCE_URL}
              className="text-primary hover:underline"
              rel="noreferrer"
            >
              <code>src/lib/studioEcon.ts</code>
            </a>
            , with each number either sourced or labelled as an assumption, and every one of them
            editable in the advanced drawer above. Tandava is MIT licensed. If a default is wrong for
            your market, change it here and share the link, or send a correction upstream.
          </p>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <a href={ENGINE_SOURCE_URL} className="text-primary hover:underline" rel="noreferrer">
              Read the model
            </a>
            <Link to="/open-source" className="text-primary hover:underline">
              About the project
            </Link>
            <a
              href="https://github.com/TaylorONeal/tandava/blob/main/DEPLOYMENT.md"
              className="text-primary hover:underline"
              rel="noreferrer"
            >
              Self-hosting guide
            </a>
            <Link to="/blog" className="text-primary hover:underline">
              Studio operations writing
            </Link>
          </nav>
        </footer>
      </div>
    </ToolLayout>
  );
}

/** A compact numeric read-out of the scenario, for anyone who wants the table. */
function ScenarioSummary({ results }: { results: ReturnType<typeof computeStudio> }) {
  const rows: Array<[string, string]> = [
    ["Revenue", money(results.revenue)],
    ["Total cost", money(results.totalCost)],
    ["Rentable square feet", count(results.rentableSf)],
    ["Classes per month", count(results.classesPerMonth)],
    ["Total visits per month", count(results.totalVisits)],
    ["Average headcount", count(results.avgHeadcount, 1)],
    ["Seat utilization", `${(results.utilization * 100).toFixed(0)}%`],
    ["Revenue per visit", money(results.revenuePerVisit, 2)],
    ["Contribution per visit", money(results.contributionPerVisit, 2)],
    ["Break-even students per class", count(results.breakEvenHeads, 1)],
    ["Seasonal reserve", money(results.recommendedReserve)],
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-foreground">The whole scenario, in numbers</h3>
      <dl className="mt-2 divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-xs tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
