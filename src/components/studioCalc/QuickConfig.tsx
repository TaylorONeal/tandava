/**
 * The six inputs that actually move the answer: market, rooms, price, business
 * model, software, and whether the studio takes aggregator visits.
 *
 * Everything else lives in the advanced drawer. A credible result never
 * requires opening it.
 */
import { Plus, Minus, Flame, AlertTriangle, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUSINESS_MODELS,
  CITY_TIERS,
  CLASSPASS_NET_RANGE,
  CLASSPASS_SHARE_RANGE,
  PRICE_WARNING_RATIO,
  PRICE_WARNING_TEXT,
  type BusinessModelId,
  type CityTier,
  type RoomConfig,
  type Assumptions,
  type SoftwareChoiceId,
  type StudioInputs,
} from "@/lib/studioEcon";
import { money, pct, count } from "@/lib/studioNarrative";
import { TierSelect } from "./TierSelect";
import { SoftwareSelect } from "./SoftwareSelect";
import { InfoTip, GLOSSARY } from "./InfoTip";

interface Props {
  inputs: StudioInputs;
  /** Resolved values, so the occupancy boxes can show tier defaults live. */
  resolved: Assumptions;
  /** Computed monthly rent and footprint, shown under the occupancy boxes. */
  rent: number;
  rentableSf: number;
  softwareCost: number;
  fiveYear: { chosen: number; baseline: number; difference: number; baselineLabel: string };
  revenuePerVisit: number;
  onPatch: (patch: Partial<StudioInputs>) => void;
  onPatchAssumptions: (patch: Partial<Assumptions>) => void;
  /** Drop an override so the value falls back to the tier / model default. */
  onClearAssumptions: (keys: (keyof Assumptions)[]) => void;
}

export function QuickConfig({
  inputs,
  resolved,
  rent,
  rentableSf,
  softwareCost,
  fiveYear,
  revenuePerVisit,
  onPatch,
  onPatchAssumptions,
  onClearAssumptions,
}: Props) {
  const model = BUSINESS_MODELS[inputs.businessModel];
  const tier = CITY_TIERS[inputs.cityTier];
  const priceHigh = inputs.membershipPrice > tier.typicalMembership * PRICE_WARNING_RATIO;
  // "Overridden" means the user typed a rent that is not this tier's number.
  const rentOverridden =
    inputs.assumptions.rentPerSf !== undefined &&
    inputs.assumptions.rentPerSf !== tier.rentPerSf;

  function patchRoom(index: number, patch: Partial<RoomConfig>) {
    const rooms = inputs.rooms.map((room, i) => (i === index ? { ...room, ...patch } : room));
    onPatch({ rooms });
  }

  function addRoom() {
    if (inputs.rooms.length >= 3) return;
    onPatch({ rooms: [...inputs.rooms, { mats: 25, classesPerWeek: 20, heated: false }] });
  }

  function removeRoom(index: number) {
    if (inputs.rooms.length <= 1) return;
    onPatch({ rooms: inputs.rooms.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-6">
      <TierSelect
        value={inputs.cityTier}
        onChange={(cityTier: CityTier) => {
          // Picking a tier repopulates the rent box below with that tier's
          // number. Any manual rent the user typed is dropped, otherwise the
          // tier buttons would appear to do nothing.
          onPatch({ cityTier });
          onClearAssumptions(["rentPerSf"]);
        }}
      />

      {/* ── Occupancy ────────────────────────────────────────────────────
          Rent is the single largest line and the one the tier drives, so it
          gets a visible, editable box here rather than living in the drawer.
          The tier sets the default; typing over it wins until the tier
          changes again. */}
      <fieldset>
        <div className="flex items-center justify-between gap-2">
          <legend className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            Occupancy
            <InfoTip label="occupancy cost">
              Rent plus utilities: the cost of the box itself, before anyone
              walks in. Together these are usually the largest fixed block on
              the page and the hardest to change later.
            </InfoTip>
          </legend>
          {rentOverridden && (
            <button
              type="button"
              onClick={() => onClearAssumptions(["rentPerSf"])}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Reset to Tier {tier.tier}
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <Label
              htmlFor="rent-per-sf"
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              {rentOverridden && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              )}
              Rent, all-in $/sf/yr
              <InfoTip label="all-in rent per square foot">{GLOSSARY.rentPerSf}</InfoTip>
            </Label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="rent-per-sf"
                type="number"
                min={0}
                step={1}
                value={Number(resolved.rentPerSf.toFixed(2))}
                onChange={(e) =>
                  onPatchAssumptions({ rentPerSf: Math.max(0, Number(e.target.value) || 0) })
                }
                className="pl-6 tabular-nums"
                data-testid="rent-per-sf"
              />
            </div>
          </div>
          <div>
            <Label
              htmlFor="utilities-base"
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              Utilities, base $/mo
              <InfoTip label="base utilities">{GLOSSARY.utilities}</InfoTip>
            </Label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="utilities-base"
                type="number"
                min={0}
                step={25}
                value={Math.round(resolved.utilitiesBase)}
                onChange={(e) =>
                  onPatchAssumptions({ utilitiesBase: Math.max(0, Number(e.target.value) || 0) })
                }
                className="pl-6 tabular-nums"
                data-testid="utilities-base"
              />
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] tabular-nums text-muted-foreground" role="status">
          {money(rent)} a month on {count(rentableSf)} rentable sf
        </p>
      </fieldset>

      {/* Rooms */}
      <fieldset>
        <div className="flex items-center justify-between">
          <legend className="text-sm font-medium text-foreground">Rooms</legend>
          <button
            type="button"
            onClick={addRoom}
            disabled={inputs.rooms.length >= 3}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:border-primary/40 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="add-room"
          >
            <Plus className="h-3 w-3" aria-hidden />
            Add room
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {inputs.rooms.map((room, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2 rounded-lg border border-border bg-card p-3"
            >
              <div>
                <Label htmlFor={`mats-${index}`} className="text-[11px] text-muted-foreground">
                  Mats
                </Label>
                <Input
                  id={`mats-${index}`}
                  type="number"
                  min={1}
                  max={300}
                  value={room.mats}
                  onChange={(e) => patchRoom(index, { mats: Math.max(1, Number(e.target.value) || 1) })}
                  className="tabular-nums"
                  data-testid={`room-mats-${index}`}
                />
              </div>
              <div>
                <Label htmlFor={`classes-${index}`} className="text-[11px] text-muted-foreground">
                  Classes / week
                </Label>
                <Input
                  id={`classes-${index}`}
                  type="number"
                  min={0}
                  max={200}
                  value={room.classesPerWeek}
                  onChange={(e) =>
                    patchRoom(index, { classesPerWeek: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="tabular-nums"
                  data-testid={`room-classes-${index}`}
                />
              </div>
              <div>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  Heated
                  <InfoTip label="heated room">{GLOSSARY.heated}</InfoTip>
                </span>
                {/* A toggle, not an action. It stays visible in both states so
                    it never reads as having disappeared when switched off. */}
                <button
                  type="button"
                  onClick={() => patchRoom(index, { heated: !room.heated })}
                  role="switch"
                  aria-checked={room.heated}
                  aria-label={`Room ${index + 1} is a heated room`}
                  className={`mt-0.5 flex w-full items-center justify-center gap-1 rounded-md border px-2 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    room.heated
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                  data-testid={`room-heated-${index}`}
                >
                  <Flame className="h-3.5 w-3.5" aria-hidden />
                  {room.heated ? "On" : "Off"}
                </button>
              </div>
              <div>
                <span className="block text-[11px] text-transparent" aria-hidden>
                  Remove
                </span>
                <button
                  type="button"
                  onClick={() => removeRoom(index)}
                  disabled={inputs.rooms.length <= 1}
                  aria-label={`Remove room ${index + 1}`}
                  className="mt-0.5 flex w-full items-center justify-center rounded-md border border-border px-2 py-2 text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Minus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Price and members */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="membership-price" className="text-sm font-medium text-foreground">
            {model.donationBased ? "Suggested monthly give" : "Membership price"}
          </Label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="membership-price"
              type="number"
              min={0}
              value={Math.round(inputs.membershipPrice)}
              onChange={(e) => onPatch({ membershipPrice: Math.max(0, Number(e.target.value) || 0) })}
              className="pl-6 tabular-nums"
              data-testid="membership-price"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tier {tier.tier} clusters near {money(tier.typicalMembership)}
          </p>
          {priceHigh && (
            <p
              className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-secondary"
              role="status"
            >
              <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden />
              {PRICE_WARNING_TEXT}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="members" className="text-sm font-medium text-foreground">
            {model.donationBased ? "Regulars" : "Members"}
          </Label>
          <Input
            id="members"
            type="number"
            min={0}
            value={Math.round(inputs.members)}
            onChange={(e) => onPatch({ members: Math.max(0, Number(e.target.value) || 0) })}
            className="mt-1 tabular-nums"
            data-testid="members"
          />
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            at {inputs.memberVisitsPerMonth.toFixed(1)} visits a month
            <InfoTip label="visit frequency">{GLOSSARY.visitFreq}</InfoTip>
          </p>
        </div>
      </div>

      {/* Business model */}
      <div>
        <Label htmlFor="business-model" className="text-sm font-medium text-foreground">
          Business model
        </Label>
        <Select
          value={inputs.businessModel}
          onValueChange={(v) => {
            const next = BUSINESS_MODELS[v as BusinessModelId];
            onPatch({
              businessModel: next.id,
              memberVisitsPerMonth: next.visitFreq,
            });
          }}
        >
          <SelectTrigger id="business-model" className="mt-1" data-testid="business-model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(BUSINESS_MODELS).map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{model.note}</p>
      </div>

      <SoftwareSelect
        value={inputs.software}
        cost={softwareCost}
        fiveYear={fiveYear}
        onChangeChoice={(id: SoftwareChoiceId) => {
          // Picking a plan tier clears any manual cost override so that tier's
          // own estimate shows; the number stays editable straight after.
          onPatch({ software: id });
          onClearAssumptions(["softwareCost"]);
        }}
        onChangeCost={(cost) => onPatchAssumptions({ softwareCost: cost })}
      />

      {/* Aggregator */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor="classpass"
            className="flex items-center gap-1.5 text-sm font-medium text-foreground"
          >
            Accept aggregator visits
            <InfoTip label="aggregator visits">{GLOSSARY.aggregator}</InfoTip>
          </Label>
          <Switch
            id="classpass"
            checked={inputs.classPass.enabled}
            onCheckedChange={(enabled) =>
              onPatch({ classPass: { ...inputs.classPass, enabled } })
            }
            data-testid="classpass-toggle"
          />
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Third-party class marketplaces. Off by default; the visit mix
          redistributes to your own channels when it is off.
        </p>

        {inputs.classPass.enabled && (
          <div className="mt-3 space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="cp-share" className="text-xs text-foreground">
                  Share of visits
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {pct(inputs.classPass.shareOfVisits, 0)}
                </span>
              </div>
              <Slider
                id="cp-share"
                min={CLASSPASS_SHARE_RANGE[0] * 100}
                max={CLASSPASS_SHARE_RANGE[1] * 100}
                step={1}
                value={[inputs.classPass.shareOfVisits * 100]}
                onValueChange={([v]) =>
                  onPatch({ classPass: { ...inputs.classPass, shareOfVisits: v / 100 } })
                }
                className="mt-2"
                aria-label="Aggregator share of visits"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="cp-net" className="text-xs text-foreground">
                  Net per visit
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {money(inputs.classPass.netPerVisit, 2)}
                </span>
              </div>
              <Slider
                id="cp-net"
                min={CLASSPASS_NET_RANGE[0]}
                max={CLASSPASS_NET_RANGE[1]}
                step={0.25}
                value={[inputs.classPass.netPerVisit]}
                onValueChange={([v]) =>
                  onPatch({ classPass: { ...inputs.classPass, netPerVisit: v } })
                }
                className="mt-2"
                aria-label="Net dollars kept per aggregator visit"
              />
            </div>
            <p className="text-[11px] tabular-nums text-muted-foreground" role="status">
              Blended revenue per visit: {money(revenuePerVisit, 2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
