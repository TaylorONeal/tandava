import { AdminLayout } from "@/components/layout/AdminLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBilling() {
  return (
    <AdminLayout>
      <SEOHead title="Platform Billing" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Billing</h1>
          <p className="text-muted-foreground">Stripe configuration, plan management, and revenue overview.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stripe Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Configure Stripe keys in your environment variables.</p>
              <p className="text-sm mt-2">See <code className="text-xs bg-muted px-1.5 py-0.5 rounded">docs/developer/stripe-setup.md</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
