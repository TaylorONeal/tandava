import { AdminLayout } from "@/components/layout/AdminLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <SEOHead title="Platform Admin" noindex />

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Tandava instance health and activity.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Studios
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Connect Supabase to see live data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Across all studios</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stripe Status
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Webhook health</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Error Rate
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Connect Sentry for monitoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Setup checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Supabase connected", key: "VITE_SUPABASE_URL" },
                { label: "Stripe configured", key: "VITE_STRIPE_PUBLISHABLE_KEY" },
                { label: "Email provider configured", key: "EMAIL_PROVIDER" },
                { label: "Sentry error monitoring", key: "VITE_SENTRY_DSN" },
              ].map((item) => {
                const isConfigured = Boolean(import.meta.env[item.key]);
                return (
                  <div key={item.key} className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        isConfigured ? "bg-green-500" : "bg-muted-foreground/30"
                      }`}
                    />
                    <span className={isConfigured ? "text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                    {!isConfigured && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Set {item.key} in .env
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
