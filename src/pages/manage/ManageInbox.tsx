import { ManageLayout } from "@/components/layout/ManageLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManageInbox() {
  return (
    <ManageLayout>
      <SEOHead title="Studio Inbox" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">Messages from members and visitor inquiries.</p>
        </div>

        <Tabs defaultValue="inquiries">
          <TabsList>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="member-messages">Member Messages</TabsTrigger>
            <TabsTrigger value="class-feedback">Class Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>No inquiries yet. Visitors can submit questions from your studio's public page.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="member-messages">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>No member messages yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="class-feedback">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>Class feedback will appear here after members attend classes.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ManageLayout>
  );
}
