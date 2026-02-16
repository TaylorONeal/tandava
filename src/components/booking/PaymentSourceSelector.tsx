import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, CreditCard, Infinity as InfinityIcon, Sparkles, Ticket } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useTranslation } from "react-i18next";

export type PaymentSourceType = "MEMBERSHIP" | "CLASS_PACK" | "WORKSHOP_PASS" | "DROP_IN";

export interface PaymentSource {
  id: string;
  type: PaymentSourceType;
  name: string;
  description?: string;
  remaining?: number;
  expiresAt?: string;
  covers: boolean; // whether this source covers the booking
  priceCents?: number; // for drop-in
}

interface PaymentSourceSelectorProps {
  sources: PaymentSource[];
  dropInPriceCents: number;
  currency?: string;
  selectedId: string | null;
  onSelect: (source: PaymentSource) => void;
}

const sourceIcons: Record<PaymentSourceType, React.ReactNode> = {
  MEMBERSHIP: <InfinityIcon className="h-5 w-5" />,
  CLASS_PACK: <Ticket className="h-5 w-5" />,
  WORKSHOP_PASS: <Ticket className="h-5 w-5" />,
  DROP_IN: <CreditCard className="h-5 w-5" />,
};

// sourceLabels moved to component body for i18n access

export function PaymentSourceSelector({
  sources,
  dropInPriceCents,
  currency = "USD",
  selectedId,
  onSelect,
}: PaymentSourceSelectorProps) {
  const { formatPrice: localeFormatPrice } = useLocale();
  const { t } = useTranslation('booking');
  const formatPrice = (cents: number) => localeFormatPrice(cents, currency);

  const sourceLabels: Record<PaymentSourceType, string> = {
    MEMBERSHIP: t('paymentSources.membership'),
    CLASS_PACK: t('paymentSources.classPack'),
    WORKSHOP_PASS: t('paymentSources.workshopPass'),
    DROP_IN: t('paymentSources.dropIn'),
  };

  // Sort: covering sources first, then by type
  const sortedSources = [...sources].sort((a, b) => {
    if (a.covers !== b.covers) return a.covers ? -1 : 1;
    return 0;
  });

  // Add drop-in option if no covering sources
  const hasDropIn = sources.some(s => s.type === "DROP_IN");
  const allSources = hasDropIn ? sortedSources : [
    ...sortedSources,
    {
      id: "drop-in",
      type: "DROP_IN" as PaymentSourceType,
      name: t('payDropInRate'),
      description: t('oneTimePayment'),
      covers: true,
      priceCents: dropInPriceCents,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">{t('selectPaymentMethod')}</h3>
      
      {allSources.map((source) => {
        const isSelected = selectedId === source.id;
        const isRecommended = source.covers && source.type !== "DROP_IN";
        
        return (
          <Card
            key={source.id}
            className={cn(
              "cursor-pointer transition-all duration-200",
              isSelected 
                ? "border-primary ring-2 ring-primary/20" 
                : "hover:border-primary/50",
              !source.covers && "opacity-50"
            )}
            onClick={() => source.covers && onSelect(source)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Selection indicator */}
                <div className={cn(
                  "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>

                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center",
                  source.type === "MEMBERSHIP" && "bg-primary/10 text-primary",
                  source.type === "CLASS_PACK" && "bg-accent-lilac/50 text-foreground",
                  source.type === "WORKSHOP_PASS" && "bg-accent-mint/50 text-foreground",
                  source.type === "DROP_IN" && "bg-muted text-muted-foreground"
                )}>
                  {sourceIcons[source.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium">{source.name}</span>
                    {isRecommended && (
                      <Badge variant="class" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        {t('recommended')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {source.remaining !== undefined && (
                      <span>{t('classesRemaining', { count: source.remaining })}</span>
                    )}
                    {source.expiresAt && (
                      <>
                        <span>•</span>
                        <span>{t('expires', { date: source.expiresAt })}</span>
                      </>
                    )}
                    {source.description && !source.remaining && (
                      <span>{source.description}</span>
                    )}
                  </div>

                  {!source.covers && (
                    <p className="text-xs text-destructive mt-1">
                      {t('doesntCover', { type: sourceLabels[source.type].toLowerCase() })}
                    </p>
                  )}
                </div>

                {/* Price (for drop-in) */}
                {source.priceCents && (
                  <div className="flex-shrink-0 text-right">
                    <span className="font-semibold">{formatPrice(source.priceCents)}</span>
                  </div>
                )}

                {/* Free indicator for membership/packs */}
                {source.covers && !source.priceCents && (
                  <div className="flex-shrink-0">
                    <Badge variant="mint">{t('included')}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
