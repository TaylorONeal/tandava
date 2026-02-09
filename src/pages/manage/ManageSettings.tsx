import { useState } from "react";
import { ManageLayout } from "@/components/layout/ManageLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { isStripeConfigured } from "@/lib/stripe";
import { ExternalLink, Heart, Star, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ManageSettings() {
  const { toast } = useToast();
  const [tipsEnabled, setTipsEnabled] = useState(false);
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [reviewsMinStars, setReviewsMinStars] = useState(3);

  return (
    <ManageLayout>
      <SEOHead title="Studio Settings" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your studio details, policies, and integrations.</p>
        </div>

        {/* Studio Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Studio Information</CardTitle>
            <CardDescription>Name, location, contact info, and hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Connect Supabase to edit studio details.</p>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Settings</CardTitle>
            <CardDescription>Enable or disable optional features for your studio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Tips Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent-coral/10 flex items-center justify-center shrink-0">
                  <Heart className="h-4 w-4 text-accent-coral" />
                </div>
                <div>
                  <p className="text-sm font-medium">Teacher Tips</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Allow students to leave tips for teachers. Tips appear on teacher dashboards and earnings reports.
                  </p>
                  {tipsEnabled && (
                    <Badge className="mt-1.5 text-[10px] bg-accent-sage/20 text-accent-sage border-0">
                      Active — teachers can see tips
                    </Badge>
                  )}
                </div>
              </div>
              <Switch
                checked={tipsEnabled}
                onCheckedChange={(checked) => {
                  setTipsEnabled(checked);
                  toast({
                    title: checked ? "Tips enabled" : "Tips disabled",
                    description: checked
                      ? "Students can now tip teachers after class."
                      : "Tips have been disabled studio-wide.",
                  });
                }}
              />
            </div>

            {/* Reviews Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent-gold/10 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4 text-accent-gold" />
                </div>
                <div>
                  <p className="text-sm font-medium">Student Reviews</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Allow students to leave reviews for classes and teachers. Only students who have attended a class can review it.
                  </p>
                  {reviewsEnabled && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Reviews below {reviewsMinStars} stars are hidden from public profiles.
                    </p>
                  )}
                </div>
              </div>
              <Switch
                checked={reviewsEnabled}
                onCheckedChange={(checked) => {
                  setReviewsEnabled(checked);
                  toast({
                    title: checked ? "Reviews enabled" : "Reviews disabled",
                    description: checked
                      ? "Students can now leave reviews after attending classes."
                      : "Reviews have been hidden studio-wide.",
                  });
                }}
              />
            </div>

            {/* Review Moderation */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Review Security</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only verified attendees can post reviews. Rate limiting prevents abuse. Reviews below 3 stars are hidden from public profiles until the teacher's average reaches 3+.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">Always On</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Connect */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Setup</CardTitle>
            <CardDescription>
              Connect your Stripe account to accept payments for classes, memberships, and class packs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isStripeConfigured() ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Link your existing Stripe account to receive payouts directly. Stripe handles all
                  payment processing, and funds are deposited to your bank account on your Stripe payout schedule.
                </p>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Stripe Account
                </Button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Stripe's standard processing fee applies (typically 2.9% + 30 cents per transaction).</p>
                  <p>You can manage payouts, refunds, and disputes directly in your Stripe Dashboard.</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Stripe is not configured for this instance. Contact your platform administrator.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancellation Policy</CardTitle>
            <CardDescription>Displayed to members when they book classes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Connect Supabase to configure your cancellation policy.</p>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
            <CardDescription>Get support from the platform team.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Contact Platform Support</Button>
          </CardContent>
        </Card>
      </div>
    </ManageLayout>
  );
}
