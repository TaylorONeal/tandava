import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Tag,
  MoreHorizontal,
  Filter,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  membershipType: string | null;
  membershipStatus: "active" | "expired" | "none";
  classPackRemaining: number | null;
  totalClasses: number;
  lastVisit: string;
  lifetimeRevenue: number;
  tags: string[];
  joinedAt: string;
}

const mockStudents: Student[] = [
  { id: "1", firstName: "Emma", lastName: "Wilson", email: "emma@example.com", phone: "+1 415-555-0101", membershipType: "Unlimited Monthly", membershipStatus: "active", classPackRemaining: null, totalClasses: 156, lastVisit: "Today", lifetimeRevenue: 5840, tags: ["VIP", "Teacher Training"], joinedAt: "2023-03-15" },
  { id: "2", firstName: "Alex", lastName: "Rivera", email: "alex@example.com", phone: "+1 415-555-0102", membershipType: null, membershipStatus: "none", classPackRemaining: 7, totalClasses: 42, lastVisit: "Yesterday", lifetimeRevenue: 1250, tags: [], joinedAt: "2024-01-20" },
  { id: "3", firstName: "Mia", lastName: "Tanaka", email: "mia@example.com", phone: "+1 415-555-0103", membershipType: "Unlimited Monthly", membershipStatus: "active", classPackRemaining: null, totalClasses: 89, lastVisit: "2 days ago", lifetimeRevenue: 3420, tags: ["Referred by Emma"], joinedAt: "2023-08-10" },
  { id: "4", firstName: "Jordan", lastName: "Blake", email: "jordan@example.com", phone: "+1 415-555-0104", membershipType: "8x Monthly", membershipStatus: "active", classPackRemaining: null, totalClasses: 64, lastVisit: "3 days ago", lifetimeRevenue: 2180, tags: [], joinedAt: "2023-11-05" },
  { id: "5", firstName: "Noah", lastName: "Garcia", email: "noah@example.com", phone: "+1 415-555-0105", membershipType: null, membershipStatus: "none", classPackRemaining: 3, totalClasses: 18, lastVisit: "1 week ago", lifetimeRevenue: 650, tags: ["New Student"], joinedAt: "2024-10-01" },
  { id: "6", firstName: "Sophia", lastName: "Lee", email: "sophia@example.com", phone: "+1 415-555-0106", membershipType: "Unlimited Monthly", membershipStatus: "expired", classPackRemaining: null, totalClasses: 203, lastVisit: "3 weeks ago", lifetimeRevenue: 8920, tags: ["At Risk"], joinedAt: "2022-06-12" },
  { id: "7", firstName: "Liam", lastName: "Park", email: "liam@example.com", phone: "+1 415-555-0107", membershipType: null, membershipStatus: "none", classPackRemaining: null, totalClasses: 5, lastVisit: "2 months ago", lifetimeRevenue: 125, tags: ["Intro Offer"], joinedAt: "2024-09-15" },
  { id: "8", firstName: "Isabella", lastName: "Chen", email: "isabella@example.com", phone: "+1 415-555-0108", membershipType: "4x Monthly", membershipStatus: "active", classPackRemaining: null, totalClasses: 31, lastVisit: "Today", lifetimeRevenue: 1560, tags: [], joinedAt: "2024-05-20" },
];

export default function StudentsManage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredStudents = mockStudents.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setDetailOpen(true);
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mockStudents.length} total students — {mockStudents.filter((s) => s.membershipStatus === "active").length} active members
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Student List */}
        <Card>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Student</span>
              <span>Membership</span>
              <span>Classes</span>
              <span>Last Visit</span>
              <span>Revenue</span>
              <span></span>
            </div>

            {/* Student Rows */}
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="grid md:grid-cols-[2fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => handleViewStudent(student)}
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-foreground text-xs font-semibold">
                      {student.firstName[0]}{student.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>
                  {student.tags.length > 0 && (
                    <div className="hidden lg:flex gap-1">
                      {student.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Membership */}
                <div className="hidden md:block">
                  {student.membershipType ? (
                    <div>
                      <p className="text-sm">{student.membershipType}</p>
                      <Badge
                        variant={student.membershipStatus === "active" ? "default" : "secondary"}
                        className={`text-[10px] mt-0.5 ${
                          student.membershipStatus === "active"
                            ? "bg-accent-sage/20 text-accent-sage"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {student.membershipStatus}
                      </Badge>
                    </div>
                  ) : student.classPackRemaining ? (
                    <p className="text-sm">{student.classPackRemaining} classes left</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No active plan</p>
                  )}
                </div>

                {/* Classes */}
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{student.totalClasses}</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>

                {/* Last Visit */}
                <div className="hidden md:block">
                  <p className="text-sm">{student.lastVisit}</p>
                </div>

                {/* Revenue */}
                <div className="hidden md:block">
                  <p className="text-sm font-medium">${student.lifetimeRevenue.toLocaleString()}</p>
                </div>

                {/* Actions */}
                <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem className="rounded-lg cursor-pointer">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg cursor-pointer">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Purchase
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg cursor-pointer">
                        <Tag className="h-4 w-4 mr-2" />
                        Add Tag
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-foreground text-lg font-semibold">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedStudent.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{selectedStudent.email}</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedStudent.phone}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <p className="text-xl font-bold">{selectedStudent.totalClasses}</p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <p className="text-xl font-bold">${selectedStudent.lifetimeRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Lifetime Revenue</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <p className="text-xl font-bold">{selectedStudent.lastVisit}</p>
                  <p className="text-xs text-muted-foreground">Last Visit</p>
                </div>
              </div>

              {/* Membership/Pack */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedStudent.membershipType ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{selectedStudent.membershipType}</p>
                        <Badge
                          className={`text-xs mt-1 ${
                            selectedStudent.membershipStatus === "active"
                              ? "bg-accent-sage/20 text-accent-sage"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {selectedStudent.membershipStatus}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  ) : selectedStudent.classPackRemaining ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{selectedStudent.classPackRemaining} classes remaining</p>
                        <p className="text-xs text-muted-foreground">10-Class Pack</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground mb-2">No active membership or pack</p>
                      <Button size="sm">Add Membership</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Member Since */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Member since {new Date(selectedStudent.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ManageLayout>
  );
}
