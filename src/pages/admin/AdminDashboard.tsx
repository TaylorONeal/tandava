import { AdminLayout } from "@/components/layout/AdminLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t } = useTranslation('manage');

  return (
    <AdminLayout>
      <SEOHead title="Platform Admin" noindex />

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.platformDashboard')}</h1>
          <p className="text-muted-foreground">
            {t('admin.overview')}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.activeStudios')}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">{t('admin.connectSupabase')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.totalUsers')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">{t('admin.acrossAllStudios')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.stripeStatus')}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">{t('admin.webhookHealth')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.errorRate')}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">{t('admin.connectSentry')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Setup checklist */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.setupChecklist')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: t('admin.supabaseConnected'), key: "VITE_SUPABASE_URL" },
                { label: t('admin.stripeConfigured'), key: "VITE_STRIPE_PUBLISHABLE_KEY" },
                { label: t('admin.emailConfigured'), key: "EMAIL_PROVIDER" },
                { label: t('admin.sentryConfigured'), key: "VITE_SENTRY_DSN" },
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
                        {t('admin.setEnvVar', { key: item.key })}
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
