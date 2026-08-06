/**
 * Every remaining assumption, grouped, with a modified dot and a per-group
 * reset. Collapsed by default: a credible answer never requires opening it.
 *
 * The point of exposing all of it is honesty. These constants are best guesses,
 * so anyone who disagrees with one should be able to replace it rather than
 * argue with a black box.
 */
import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type Assumptions,
  type StudioInputs,
  type StudioResults,
} from "@/lib/studioEcon";
import { usePrefersReducedMotion } from "./useAnimatedNumber";

type Field = {
  key: keyof Assumptions;
  label: string;
  /** "$" for dollars, "%" for rates stored as 0-1, "" for plain numbers. */
  unit: "$" | "%" | "";
  step?: number;
  hint?: string;
};

type Group = { title: string; blurb: string; fields: Field[] };

const GROUPS: Group[] = [
  {
    title: "Space and rent",
    blurb: "The lease decides more than anything else on this page.",
    fields: [
      { key: "rentPerSf", label: "Rent, all-in $/sf/yr", unit: "$", step: 1 },
      { key: "sfPerMat", label: "Square feet per mat", unit: "", step: 1, hint: "Includes circulation" },
      { key: "supportSfBase", label: "Support space, first room", unit: "", step: 25 },
      { key: "supportSfPerExtraRoom", label: "Support space per extra room", unit: "", step: 25 },
      { key: "loadFactor", label: "Load factor", unit: "", step: 0.01, hint: "Rentable divided by usable" },
    ],
  },
  {
    title: "Utilities and facilities",
    blurb: "Scaled by square footage and by how much of the studio is heated.",
    fields: [
      { key: "utilitiesBase", label: "Utilities at reference size", unit: "$", step: 25 },
      { key: "utilitiesRefSf", label: "Reference size, sf", unit: "", step: 100 },
      { key: "cleaningBase", label: "Cleaning", unit: "$", step: 25 },
      { key: "laundryBase", label: "Laundry and towels", unit: "$", step: 25 },
      { key: "repairs", label: "Repairs and maintenance", unit: "$", step: 25 },
    ],
  },
  {
    title: "Labor",
    blurb: "The largest cost block, and the one most sensitive to your schedule.",
    fields: [
      { key: "frontDeskHourly", label: "Front desk, $/hr", unit: "$", step: 0.5 },
      { key: "frontDeskBaseHours", label: "Front desk hours, base", unit: "", step: 5 },
      { key: "frontDeskHoursPerRoom", label: "Front desk hours per room", unit: "", step: 5 },
      { key: "frontDeskMaxHours", label: "Front desk hours cap", unit: "", step: 5 },
      { key: "gmSalary", label: "General manager, monthly", unit: "$", step: 100 },
      { key: "asstProgrammingMulti", label: "Assistant, 2+ rooms", unit: "$", step: 100 },
      { key: "asstProgrammingSingle", label: "Assistant, 1 room", unit: "$", step: 100 },
      { key: "payrollBurdenRate", label: "Payroll burden", unit: "%", step: 0.5, hint: "Taxes, comp, benefits" },
    ],
  },
  {
    title: "Operating costs",
    blurb: "Small individually, roughly a fifth of the cost base together.",
    fields: [
      { key: "insurance", label: "Insurance", unit: "$", step: 25 },
      { key: "marketingFloor", label: "Marketing floor", unit: "$", step: 100 },
      { key: "marketingRate", label: "Marketing, share of revenue", unit: "%", step: 0.5 },
      { key: "music", label: "Music licensing", unit: "$", step: 5 },
      { key: "internet", label: "Internet and phone", unit: "$", step: 10 },
      { key: "accounting", label: "Accounting", unit: "$", step: 25 },
      { key: "miscFailedPayments", label: "Misc and failed payments", unit: "$", step: 100 },
      { key: "merchantRate", label: "Card processing", unit: "%", step: 0.1 },
    ],
  },
  {
    title: "Pricing ladder",
    blurb: "Pack and drop-in prices are set as multiples of the membership so the ladder stays coherent.",
    fields: [
      { key: "packPriceRatio", label: "Pack price per class", unit: "%", step: 0.5, hint: "Of the monthly membership" },
      { key: "dropInRatio", label: "Drop-in price", unit: "%", step: 0.5, hint: "Of the monthly membership" },
      { key: "donationAverage", label: "Average donation", unit: "$", step: 1, hint: "Donation model only" },
      { key: "retailPerMember", label: "Retail per member", unit: "$", step: 0.5 },
      { key: "retailMargin", label: "Retail margin", unit: "%", step: 1 },
    ],
  },
  {
    title: "Ancillary programs",
    blurb: "Revenue that does not need a mat. Toggle each on below.",
    fields: [
      { key: "teacherTrainingRevenue", label: "Teacher training revenue", unit: "$", step: 100 },
      { key: "teacherTrainingMargin", label: "Teacher training margin", unit: "%", step: 1 },
      { key: "workshopRevenue", label: "Workshop revenue", unit: "$", step: 100 },
      { key: "workshopHouseShare", label: "House share of workshops", unit: "%", step: 1 },
      { key: "rentalRevenue", label: "Room rental revenue", unit: "$", step: 100 },
    ],
  },
];

interface Props {
  inputs: StudioInputs;
  results: StudioResults;
  modified: Set<keyof Assumptions>;
  onPatch: (patch: Partial<StudioInputs>) => void;
  onPatchAssumptions: (patch: Partial<Assumptions>) => void;
  onResetKeys: (keys: (keyof Assumptions)[]) => void;
}

export function AdvancedDrawer({
  inputs,
  results,
  modified,
  onPatch,
  onPatchAssumptions,
  onResetKeys,
}: Props) {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <section className="rounded-xl border border-border bg-card">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="advanced-drawer"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          data-testid="advanced-toggle"
        >
          <span>
            <span className="block text-sm font-medium text-foreground">
              Every assumption, editable
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {modified.size > 0
                ? `${modified.size} changed from the preset`
                : "Open only if you disagree with a default"}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </h2>

      {/* Height animation without a motion library: a 0fr -> 1fr grid row.
          Under reduced motion the transition class is dropped, so the drawer
          snaps open and every control stays reachable. */}
      <div
        id="advanced-drawer"
        className={`grid overflow-hidden ${
          reduced ? "" : "transition-[grid-template-rows] duration-200 ease-out"
        } ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        aria-hidden={!open}
      >
        <div className="min-h-0">
          {open && (
            <div className="space-y-5 border-t border-border px-4 py-4">
              {/* Behaviour toggles that are not numeric assumptions. */}
              <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                <ToggleRow
                  id="owner-gm"
                  label="I am the general manager"
                  hint="Adds the GM salary back, so the result reads as owner-operator cash."
                  checked={inputs.ownerIsGm}
                  onChange={(ownerIsGm) => onPatch({ ownerIsGm })}
                />
                <ToggleRow
                  id="anc-tt"
                  label="Run teacher trainings"
                  hint={`Adds ${Math.round(results.resolvedAssumptions.teacherTrainingRevenue)} a month of revenue at the margin set below.`}
                  checked={inputs.ancillary.teacherTraining}
                  onChange={(teacherTraining) =>
                    onPatch({ ancillary: { ...inputs.ancillary, teacherTraining } })
                  }
                />
                <ToggleRow
                  id="anc-ws"
                  label="Run workshops"
                  hint="Weekend workshops and series, split with the presenter."
                  checked={inputs.ancillary.workshops}
                  onChange={(workshops) => onPatch({ ancillary: { ...inputs.ancillary, workshops } })}
                />
                <ToggleRow
                  id="anc-rn"
                  label="Rent the room out"
                  hint="Off-schedule rentals to other teachers and groups."
                  checked={inputs.ancillary.rentals}
                  onChange={(rentals) => onPatch({ ancillary: { ...inputs.ancillary, rentals } })}
                />
              </div>

              {/* Teacher pay is per-scenario rather than a global assumption. */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Teacher pay
                  </h3>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <NumberField
                    id="tp-base"
                    label="Per class"
                    unit="$"
                    value={inputs.teacherPay.base}
                    step={1}
                    onChange={(base) => onPatch({ teacherPay: { ...inputs.teacherPay, base } })}
                  />
                  <NumberField
                    id="tp-bonus"
                    label="Per head over"
                    unit="$"
                    value={inputs.teacherPay.perHeadBonus}
                    step={0.5}
                    onChange={(perHeadBonus) =>
                      onPatch({ teacherPay: { ...inputs.teacherPay, perHeadBonus } })
                    }
                  />
                  <NumberField
                    id="tp-threshold"
                    label="Threshold"
                    unit=""
                    value={inputs.teacherPay.bonusThreshold}
                    step={1}
                    onChange={(bonusThreshold) =>
                      onPatch({ teacherPay: { ...inputs.teacherPay, bonusThreshold } })
                    }
                  />
                </div>
                <div className="mt-2">
                  <NumberField
                    id="visit-freq"
                    label="Member visits per month"
                    unit=""
                    value={inputs.memberVisitsPerMonth}
                    step={0.1}
                    onChange={(memberVisitsPerMonth) => onPatch({ memberVisitsPerMonth })}
                  />
                </div>
              </div>

              {GROUPS.map((group) => {
                const groupModified = group.fields.filter((f) => modified.has(f.key));
                return (
                  <div key={group.title}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {group.title}
                        {groupModified.length > 0 && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                            aria-label={`${groupModified.length} values changed`}
                          />
                        )}
                      </h3>
                      {groupModified.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onResetKeys(groupModified.map((f) => f.key))}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <RotateCcw className="h-3 w-3" aria-hidden />
                          Reset group
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {group.blurb}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {group.fields.map((field) => {
                        const raw = results.resolvedAssumptions[field.key];
                        const display = field.unit === "%" ? raw * 100 : raw;
                        return (
                          <NumberField
                            key={field.key}
                            id={`adv-${field.key}`}
                            label={field.label}
                            hint={field.hint}
                            unit={field.unit}
                            value={display}
                            step={field.step}
                            modified={modified.has(field.key)}
                            onChange={(next) =>
                              onPatchAssumptions({
                                [field.key]: field.unit === "%" ? next / 100 : next,
                              } as Partial<Assumptions>)
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <Label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}
        </Label>
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} data-testid={id} />
    </div>
  );
}

function NumberField({
  id,
  label,
  hint,
  unit,
  value,
  step = 1,
  modified,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  unit: "$" | "%" | "";
  value: number;
  step?: number;
  modified?: boolean;
  onChange: (v: number) => void;
}) {
  const decimals = step < 1 ? 2 : 0;
  return (
    <div>
      <Label htmlFor={id} className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {modified && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
        {label}
        {unit === "%" && " (%)"}
      </Label>
      <div className="relative mt-0.5">
        {unit === "$" && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            $
          </span>
        )}
        <Input
          id={id}
          type="number"
          min={0}
          step={step}
          value={Number(value.toFixed(decimals))}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className={`h-8 tabular-nums ${unit === "$" ? "pl-5" : ""} text-xs`}
        />
      </div>
      {hint && <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}
