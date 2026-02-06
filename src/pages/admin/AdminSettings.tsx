import { AdminLayout } from "@/components/layout/AdminLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSettings() {
  const envVars = [
    { key: "VITE_SUPABASE_URL", label: "Supabase URL", category: "Database" },
    { key: "VITE_SUPABASE_ANON_KEY", label: "Supabase Anon Key", category: "Database" },
    { key: "VITE_STRIPE_PUBLISHABLE_KEY", label: "Stripe Publishable Key", category: "Payments" },
    { key: "VITE_SENTRY_DSN", label: "Sentry DSN", category: "Monitoring" },
    { key: "VITE_APP_URL", label: "App URL", category: "Application" },
    { key: "VITE_APP_NAME", label: "App Name", category: "Application" },
  ];

  return (
    <AdminLayout>
      <SEOHead title="Platform Settings" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Instance configuration and environment status.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Environment Configuration</CardTitle>
            <CardDescription>Status of required environment variables. Set these in your .env file.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {envVars.map((v) => {
                const value = import.meta.env[v.key];
                const isSet = Boolean(value && !value.includes("placeholder") && !value.includes("your-"));
                return (
                  <div key={v.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{v.label}</p>
                      <code className="text-xs text-muted-foreground">{v.key}</code>
                    </div>
                    <Badge variant={isSet ? "default" : "secondary"}>
                      {isSet ? "Configured" : "Not Set"}
                    </Badge>
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
