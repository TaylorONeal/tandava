import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { helpFor, type HelpAudience } from "@/content/help";

/**
 * FAQ list from the shared help content. Used on the pre-signup landing page
 * (owner audience) and reusable on booking pages (member audience).
 */
export function FaqSection({
  audience,
  ids,
  title = "Questions studio owners ask",
  className,
}: {
  audience: HelpAudience;
  ids?: string[];
  title?: string;
  className?: string;
}) {
  const entries = helpFor(audience, ids);
  if (!entries.length) return null;
  return (
    <section className={className} aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-2xl font-bold text-center mb-8">
        {title}
      </h2>
      <Accordion type="single" collapsible className="max-w-3xl mx-auto">
        {entries.map((e) => (
          <AccordionItem key={e.id} value={e.id}>
            <AccordionTrigger className="text-left">
              {e.question}
              {e.status === "planned" && (
                <span className="ml-2 shrink-0 rounded-full border px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  planned
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              {e.answer.split("\n").map((para, i) => (
                <p key={i} className="text-muted-foreground mb-2 last:mb-0">
                  {para}
                </p>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
