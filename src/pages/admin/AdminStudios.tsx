import { AdminLayout } from "@/components/layout/AdminLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function AdminStudios() {
  return (
    <AdminLayout>
      <SEOHead title="Manage Studios" noindex />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Studios</h1>
            <p className="text-muted-foreground">Approve, configure, and manage studios on this instance.</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Studio
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Studios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>No studios yet. Connect Supabase and create your first studio.</p>
              <p className="text-sm mt-2">See <code className="text-xs bg-muted px-1.5 py-0.5 rounded">docs/developer/setup.md</code> for instructions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
