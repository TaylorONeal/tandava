/**
 * Layout primitives for the redesigned site (docs/design/DESIGN_SYSTEM.md).
 *
 * The direction is "a studio's front desk on a good morning": paper, ink and
 * one highlighter. Two objects from the front desk carry the look: the pass a
 * member shows at the door (PassStub) and the day's class board
 * (ScheduleBoard). Content is grouped with ink rules, not boxes: Section puts
 * a heading column beside its content, RuledList numbers rows in mono.
 */
import type { ReactNode } from "react";
import { Eyebrow } from "./brand";

/** Heading column on the left, content on the right, ink rule on top. */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`max-w-6xl mx-auto px-6 ${className}`}>
      <div className="grid gap-8 border-t-2 border-ink pt-8 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-12 md:pt-10">
        <div className="min-w-0">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 id={headingId} className="mt-3 font-brand text-3xl font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[2.1rem]">
            {title}
          </h2>
          {lead && <p className="mt-4 max-w-[34ch] leading-relaxed text-ink/70">{lead}</p>}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

/** Numbered rows divided by rules. Replaces rows of equal cards. */
export function RuledList({
  items,
  start = 1,
  dense = false,
}: {
  items: { title: ReactNode; body?: ReactNode; aside?: ReactNode }[];
  start?: number;
  dense?: boolean;
}) {
  return (
    <ol className="divide-y divide-ink/15 border-y border-ink/15">
      {items.map((item, i) => (
        <li
          key={i}
          className={`grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] ${dense ? "py-3.5" : "py-5"}`}
        >
          <span className="pt-1 font-brand-mono text-sm font-semibold tabular-nums text-ink/60">
            {String(start + i).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className={`font-brand font-bold tracking-tight ${dense ? "text-base" : "text-lg sm:text-xl"}`}>{item.title}</p>
            {item.body && <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-ink/70 sm:text-[0.95rem]">{item.body}</p>}
          </div>
          {item.aside && <div className="col-start-2 mt-3 sm:col-start-3 sm:mt-0 sm:self-center">{item.aside}</div>}
        </li>
      ))}
    </ol>
  );
}

export interface ScheduleRow {
  time: string;
  name: string;
  teacher: string;
  room?: string;
  /** Spots left. 0 shows "Waitlist". */
  spots?: number;
}

/** The day's class board, as it hangs behind a front desk. */
export function ScheduleBoard({
  day,
  place,
  rows,
  className = "",
}: {
  day: string;
  place?: string;
  rows: ScheduleRow[];
  className?: string;
}) {
  return (
    <figure className={`overflow-hidden rounded-2xl border-2 border-ink bg-white ${className}`}>
      <figcaption className="flex items-baseline justify-between gap-3 border-b-2 border-ink bg-ink px-4 py-2.5 text-paper">
        <span className="font-brand text-base font-extrabold tracking-tight">{day}</span>
        {place && <span className="font-brand-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-paper/70">{place}</span>}
      </figcaption>
      <ul className="divide-y divide-ink/10">
        {rows.map((r) => (
          <li key={`${r.time}-${r.name}`} className="grid grid-cols-[4.9rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <span className="font-brand-mono text-sm font-semibold tabular-nums">{r.time}</span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{r.name}</span>
              <span className="block truncate text-xs text-ink/60">
                {r.teacher}
                {r.room ? ` · ${r.room}` : ""}
              </span>
            </span>
            {r.spots !== undefined && (
              <span
                className={`rounded-full px-2.5 py-1 font-brand-mono text-[0.7rem] font-semibold tabular-nums ${
                  r.spots === 0 ? "bg-coral text-ink" : r.spots <= 3 ? "bg-lime text-ink" : "bg-ink/5 text-ink/70"
                }`}
              >
                {r.spots === 0 ? "Waitlist" : `${r.spots} left`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** A member's pass, with the tear line. The check-in moment, in print. */
export function PassStub({
  label = "Class pass",
  name,
  detail,
  code,
  status,
  className = "",
}: {
  label?: string;
  name: string;
  detail: string;
  code: string;
  status?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative grid grid-cols-[minmax(0,1fr)_auto] rounded-2xl border-2 border-ink bg-white text-ink shadow-[6px_6px_0_0_rgba(14,10,18,1)] ${className}`}
    >
      <div className="min-w-0 px-4 py-3.5">
        <p className="font-brand-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink/60">{label}</p>
        <p className="mt-1 truncate font-brand text-lg font-extrabold leading-tight tracking-tight">{name}</p>
        <p className="truncate text-xs text-ink/65">{detail}</p>
      </div>
      <div className="relative flex flex-col items-center justify-center border-l-2 border-dashed border-ink/40 px-4 py-3.5">
        <span aria-hidden className="absolute -left-[9px] -top-[2px] h-3 w-4 rounded-b-full border-2 border-t-0 border-ink bg-paper" />
        <span aria-hidden className="absolute -bottom-[2px] -left-[9px] h-3 w-4 rounded-t-full border-2 border-b-0 border-ink bg-paper" />
        <span className="font-brand-mono text-xs font-semibold tabular-nums">{code}</span>
        {status && <span className="mt-1.5 rounded-md bg-lime px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide">{status}</span>}
      </div>
    </div>
  );
}

/** Check list in ink with lime ticks. Use on paper. */
export function TickList({ items, tone = "paper" }: { items: ReactNode[]; tone?: "paper" | "ink" }) {
  return (
    <ul className={`divide-y ${tone === "ink" ? "divide-paper/15" : "divide-ink/10"}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 py-2.5 text-[0.95rem]">
          <span
            aria-hidden
            className={`mt-[0.45rem] h-2 w-3.5 shrink-0 -rotate-45 border-b-[3px] border-l-[3px] ${
              tone === "ink" ? "border-lime" : "border-ink"
            }`}
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}
