import { AdminLayout } from "@/components/layout/AdminLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsers() {
  return (
    <AdminLayout>
      <SEOHead title="Manage Users" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and access across all studios.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Connect Supabase to manage users.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
