import { AdminLayout } from "@/components/layout/AdminLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminFeedback() {
  return (
    <AdminLayout>
      <SEOHead title="Feedback & Support" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback & Support</h1>
          <p className="text-muted-foreground">Platform feedback from users and support tickets from studio owners.</p>
        </div>

        <Tabs defaultValue="feedback">
          <TabsList>
            <TabsTrigger value="feedback">User Feedback</TabsTrigger>
            <TabsTrigger value="support">Support Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>No feedback yet. Users can submit feedback from Account → Help & Support.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Studio Owner Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>No support tickets. Studio owners can request help from Manage → Settings → Support.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
