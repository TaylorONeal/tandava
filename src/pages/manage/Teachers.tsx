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
  Star,
  Calendar,
  DollarSign,
  Clock,
  Mail,
  Phone,
  Users,
  TrendingUp,
  Repeat2,
} from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialties: string[];
  certifications: string[];
  payType: "per_class" | "revenue_share";
  payRate: number;
  classesThisMonth: number;
  earningsThisMonth: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  canSub: boolean;
  upcomingClasses: { name: string; day: string; time: string }[];
  // Analytics
  avgStudentsPerClass: number;
  returnRate: number; // percentage of students who return to this teacher
  totalStudentsTaught: number;
}

const mockTeachers: Teacher[] = [
  {
    id: "1", firstName: "Maya", lastName: "Patel", email: "maya@tandava.yoga", phone: "+1 415-555-0201",
    specialties: ["Vinyasa", "Power Yoga"], certifications: ["E-RYT 500", "YACEP"],
    payType: "per_class", payRate: 7500, classesThisMonth: 22, earningsThisMonth: 165000,
    rating: 4.9, reviewCount: 312, isActive: true, canSub: true,
    avgStudentsPerClass: 21.4, returnRate: 78, totalStudentsTaught: 1847,
    upcomingClasses: [
      { name: "Morning Vinyasa", day: "Mon/Wed/Fri", time: "7:00 AM" },
      { name: "Evening Vinyasa", day: "Mon/Wed", time: "6:00 PM" },
      { name: "Community Flow", day: "Sat", time: "11:00 AM" },
    ],
  },
  {
    id: "2", firstName: "James", lastName: "Liu", email: "james@tandava.yoga", phone: "+1 415-555-0202",
    specialties: ["Hatha", "Ashtanga", "Yin"], certifications: ["RYT 200"],
    payType: "per_class", payRate: 6000, classesThisMonth: 16, earningsThisMonth: 96000,
    rating: 4.7, reviewCount: 189, isActive: true, canSub: true,
    avgStudentsPerClass: 17.2, returnRate: 65, totalStudentsTaught: 1203,
    upcomingClasses: [
      { name: "Gentle Flow", day: "Mon/Wed", time: "9:30 AM" },
      { name: "Ashtanga Primary", day: "Tue/Thu", time: "12:00 PM" },
      { name: "Slow Flow", day: "Fri", time: "10:00 AM" },
    ],
  },
  {
    id: "3", firstName: "Sarah", lastName: "Chen", email: "sarah@tandava.yoga", phone: "+1 415-555-0203",
    specialties: ["Vinyasa", "Power", "Hot Yoga"], certifications: ["E-RYT 500"],
    payType: "revenue_share", payRate: 40, classesThisMonth: 18, earningsThisMonth: 184000,
    rating: 4.8, reviewCount: 267, isActive: true, canSub: false,
    avgStudentsPerClass: 23.1, returnRate: 82, totalStudentsTaught: 2156,
    upcomingClasses: [
      { name: "Power Yoga", day: "Mon/Thu", time: "12:00 PM" },
      { name: "Hot Vinyasa", day: "Tue/Thu", time: "9:00 AM" },
      { name: "Weekend Power", day: "Sat", time: "9:00 AM" },
    ],
  },
  {
    id: "4", firstName: "Ava", lastName: "Kim", email: "ava@tandava.yoga", phone: "+1 415-555-0204",
    specialties: ["Yin", "Meditation", "Restorative"], certifications: ["RYT 500", "Yin Certified"],
    payType: "per_class", payRate: 6500, classesThisMonth: 12, earningsThisMonth: 78000,
    rating: 4.9, reviewCount: 198, isActive: true, canSub: true,
    avgStudentsPerClass: 15.8, returnRate: 71, totalStudentsTaught: 967,
    upcomingClasses: [
      { name: "Sunrise Meditation", day: "Tue", time: "6:30 AM" },
      { name: "Yin Restore", day: "Mon/Wed", time: "4:30 PM" },
      { name: "Restorative", day: "Thu", time: "5:30 PM" },
      { name: "Sunday Slow", day: "Sun", time: "10:00 AM" },
    ],
  },
  {
    id: "5", firstName: "David", lastName: "Park", email: "david@tandava.yoga", phone: "+1 415-555-0205",
    specialties: ["Ashtanga", "Vinyasa"], certifications: ["RYT 200"],
    payType: "per_class", payRate: 5500, classesThisMonth: 0, earningsThisMonth: 0,
    rating: 4.6, reviewCount: 87, isActive: false, canSub: true,
    avgStudentsPerClass: 14.3, returnRate: 58, totalStudentsTaught: 412,
    upcomingClasses: [],
  },
];

export default function TeachersManage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredTeachers = mockTeachers.filter(
    (t) =>
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatPay = (teacher: Teacher) => {
    if (teacher.payType === "per_class") {
      return `$${(teacher.payRate / 100).toFixed(0)}/class`;
    }
    return `${teacher.payRate}% revenue share`;
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mockTeachers.filter((t) => t.isActive).length} active teachers
            </p>
          </div>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teachers or specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Teacher Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => {
                setSelectedTeacher(teacher);
                setDetailOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-foreground font-semibold">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">
                          {teacher.firstName} {teacher.lastName}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-accent-gold text-accent-gold" />
                          <span className="text-xs">{teacher.rating}</span>
                          <span className="text-xs text-muted-foreground">({teacher.reviewCount})</span>
                        </div>
                      </div>
                      {!teacher.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {teacher.specialties.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-[10px] px-1.5 py-0">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Students</p>
                        <p className="text-sm font-semibold">{teacher.avgStudentsPerClass}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Return Rate</p>
                        <p className="text-sm font-semibold text-accent-sage">{teacher.returnRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Classes/mo</p>
                        <p className="text-sm font-semibold">{teacher.classesThisMonth}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Teacher Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-foreground text-lg font-semibold">
                    {selectedTeacher.firstName[0]}{selectedTeacher.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 fill-accent-gold text-accent-gold" />
                    <span className="text-sm">{selectedTeacher.rating} ({selectedTeacher.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{selectedTeacher.email}</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedTeacher.phone}</span>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.certifications.map((cert) => (
                    <Badge key={cert} className="bg-primary/10 text-primary text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pay & Earnings */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <DollarSign className="h-4 w-4 text-muted-foreground mx-auto" />
                  <p className="text-lg font-bold mt-1">
                    ${(selectedTeacher.earningsThisMonth / 100).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <Calendar className="h-4 w-4 text-muted-foreground mx-auto" />
                  <p className="text-lg font-bold mt-1">{selectedTeacher.classesThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary/50">
                  <Clock className="h-4 w-4 text-muted-foreground mx-auto" />
                  <p className="text-lg font-bold mt-1">{formatPay(selectedTeacher)}</p>
                  <p className="text-xs text-muted-foreground">Rate</p>
                </div>
              </div>

              {/* Teacher Analytics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent-sage" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Repeat2 className="h-4 w-4 text-accent-sage" />
                      <span className="text-sm">Student Return Rate</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-accent-sage">{selectedTeacher.returnRate}%</span>
                      <p className="text-[10px] text-muted-foreground">of students return</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">Avg Students / Class</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{selectedTeacher.avgStudentsPerClass}</span>
                      <p className="text-[10px] text-muted-foreground">per session</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total Students Taught</span>
                    </div>
                    <span className="text-sm font-bold">{selectedTeacher.totalStudentsTaught.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedTeacher.upcomingClasses.length > 0 ? (
                    selectedTeacher.upcomingClasses.map((cls, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                        <div>
                          <p className="text-sm font-medium">{cls.name}</p>
                          <p className="text-xs text-muted-foreground">{cls.day}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{cls.time}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No scheduled classes</p>
                  )}
                </CardContent>
              </Card>

              {/* Sub availability */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <span className="text-sm">Available for subs</span>
                <Badge
                  variant={selectedTeacher.canSub ? "default" : "secondary"}
                  className={selectedTeacher.canSub ? "bg-accent-sage/20 text-accent-sage" : ""}
                >
                  {selectedTeacher.canSub ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ManageLayout>
  );
}
