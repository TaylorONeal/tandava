/**
 * Building blocks for the marketing site's look, taken from the Tandava Studio
 * store art (/mnt/project-files/tandava-studio-store/set_tandavastudio.py):
 * mono eyebrow, highlighter band, chunky ink buttons, scanner-corner frame
 * and a phone frame for real app captures. Colors are fixed brand values
 * (tailwind.config.ts: ink, paper, lime, brand-teal, coral, plum).
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-brand-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink/60 ${className}`}>
      {children}
    </p>
  );
}

const BAND = { lime: "bg-lime text-ink", teal: "bg-brand-teal text-ink", coral: "bg-coral text-ink", ink: "bg-ink text-lime" };

export function Band({ children, tone = "lime" }: { children: ReactNode; tone?: keyof typeof BAND }) {
  return <span className={`mkt-band ${BAND[tone]}`}>{children}</span>;
}

const CTA = {
  primary: "bg-ink text-paper hover:bg-plum",
  secondary: "border-2 border-ink text-ink hover:bg-ink hover:text-paper",
  lime: "bg-lime text-ink hover:bg-paper",
};

export function CtaLink({
  to,
  children,
  variant = "primary",
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: keyof typeof CTA;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-bold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${CTA[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Same look as CtaLink, for links that leave the site. */
export function CtaAnchor({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof CTA;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-bold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${CTA[variant]} ${className}`}
    >
      {children}
    </a>
  );
}

/** Camera-viewfinder corners. The scan is the brand moment. */
export function ScanFrame({ children, color = "border-lime", className = "" }: { children: ReactNode; color?: string; className?: string }) {
  const corner = `pointer-events-none absolute h-8 w-8 ${color}`;
  return (
    <div className={`relative ${className}`}>
      <span aria-hidden className={`${corner} -left-3 -top-3 rounded-tl-xl border-l-4 border-t-4`} />
      <span aria-hidden className={`${corner} -right-3 -top-3 rounded-tr-xl border-r-4 border-t-4`} />
      <span aria-hidden className={`${corner} -bottom-3 -left-3 rounded-bl-xl border-b-4 border-l-4`} />
      <span aria-hidden className={`${corner} -bottom-3 -right-3 rounded-br-xl border-b-4 border-r-4`} />
      {children}
    </div>
  );
}

/** A real app capture in a plain phone frame. */
export function PhoneShot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`rounded-[2.2rem] bg-ink p-2 shadow-[0_24px_60px_-20px_rgba(14,10,18,0.45)] ${className}`}>
      <img src={src} alt={alt} width={330} height={717} loading="lazy" className="block h-auto w-full rounded-[1.8rem]" />
    </div>
  );
}
