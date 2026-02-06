import { ManageLayout } from "@/components/layout/ManageLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isStripeConfigured } from "@/lib/stripe";
import { ExternalLink } from "lucide-react";

export default function ManageSettings() {
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
