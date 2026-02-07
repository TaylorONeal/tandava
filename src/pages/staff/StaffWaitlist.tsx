import { StaffLayout } from "@/components/layout/StaffLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StaffWaitlist() {
  return (
    <StaffLayout>
      <SEOHead title="Waitlist" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waitlist Management</h1>
          <p className="text-muted-foreground">Promote waitlisted members and manage no-shows.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Waitlists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>No active waitlists. Waitlists appear when classes reach capacity.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
