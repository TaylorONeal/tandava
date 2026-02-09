import { useState } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle2, Clock, Users } from "lucide-react";

const todaysClasses = [
  { id: "1", name: "Morning Vinyasa", time: "7:00 AM", teacher: "Maya J.", capacity: 20, checkedIn: 14, status: "in_progress" as const },
  { id: "2", name: "Power Flow", time: "9:00 AM", teacher: "Alex R.", capacity: 18, checkedIn: 0, status: "upcoming" as const },
  { id: "3", name: "Yin Yoga", time: "12:00 PM", teacher: "David P.", capacity: 15, checkedIn: 0, status: "upcoming" as const },
  { id: "4", name: "Hot Power", time: "5:30 PM", teacher: "Alex R.", capacity: 18, checkedIn: 0, status: "upcoming" as const },
  { id: "5", name: "Gentle Stretch", time: "7:00 PM", teacher: "Emma T.", capacity: 15, checkedIn: 0, status: "upcoming" as const },
];

const waitingMembers = [
  { id: "m1", name: "Sarah Chen", membership: "Unlimited", classId: "1" },
  { id: "m2", name: "James Wilson", membership: "10-Pack (6 left)", classId: "1" },
  { id: "m3", name: "Priya Sharma", membership: "Unlimited", classId: "1" },
  { id: "m4", name: "Michael Torres", membership: "Drop-in", classId: "1" },
];

export default function StaffCheckin() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [selectedClass, setSelectedClass] = useState(todaysClasses[0]);

  const filteredMembers = waitingMembers.filter(
    (m) => m.classId === selectedClass.id && (
      !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCheckIn = (memberId: string, memberName: string) => {
    setCheckedInIds((prev) => new Set(prev).add(memberId));
    toast({ title: "Checked in", description: `${memberName} has been checked in.` });
  };

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
          <Input
            placeholder="Search by name or email..."
            className="pl-10 h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Today's classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today's Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todaysClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedClass.id === cls.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{cls.name}</span>
                    {cls.status === "in_progress" && (
                      <Badge variant="default" className="text-xs">Live</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{cls.time} • {cls.teacher}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {cls.checkedIn + (selectedClass.id === cls.id ? checkedInIds.size : 0)}/{cls.capacity}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class Roster */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedClass.name} — {selectedClass.time}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const isCheckedIn = checkedInIds.has(member.id);
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.membership}</p>
                      </div>
                    </div>
                    {isCheckedIn ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Checked In
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => handleCheckIn(member.id, member.name)}>
                        Check In
                      </Button>
                    )}
                  </div>
                );
              })}
              {filteredMembers.length === 0 && (
                <p className="text-center py-6 text-muted-foreground text-sm">
                  {searchQuery ? "No members match your search." : "No members booked for this class yet."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
