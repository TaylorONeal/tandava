import { ManageLayout } from "@/components/layout/ManageLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ManageSchedule() {
  return (
    <ManageLayout>
      <SEOHead title="Manage Schedule" noindex />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
            <p className="text-muted-foreground">Create and manage your class schedule.</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No classes scheduled yet. Create your first class to get started.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManageLayout>
  );
}
