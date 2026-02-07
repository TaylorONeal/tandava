import { StaffLayout } from "@/components/layout/StaffLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function StaffCheckin() {
  return (
    <StaffLayout>
      <SEOHead title="Check-in" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class Check-in</h1>
          <p className="text-muted-foreground">Search members by name or scan to check in.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-10 h-12" />
        </div>

        {/* Today's classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>No classes scheduled today. Connect Supabase to see your schedule.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
