import { ManageLayout } from "@/components/layout/ManageLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManageMembers() {
  return (
    <ManageLayout>
      <SEOHead title="Manage Members" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">View your member directory, membership status, and attendance history.</p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No members yet. Members appear here once they book a class at your studio.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManageLayout>
  );
}
