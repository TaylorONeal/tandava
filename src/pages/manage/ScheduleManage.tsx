import { useState } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  UserMinus,
  Users,
  Ban,
  Bell,
  MoreHorizontal,
  Clock,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type InstructorRole = 'lead' | 'assistant' | 'staff_instructor' | 'teacher_in_training';

const instructorRoleLabels: Record<InstructorRole, string> = {
  lead: "Lead Instructor",
  assistant: "Assistant",
  staff_instructor: "Staff Instructor",
  teacher_in_training: "Teacher in Training",
};

interface ClassOccurrence {
  id: string;
  name: string;
  style: string;
  teacher: string;
  instructorRole: InstructorRole;
  time: string;
  endTime: string;
  room: string;
  location: string;
  capacity: number;
  booked: number;
  waitlisted: number;
  checkedIn: number;
  isCancelled: boolean;
  isSubbed: boolean;
  originalTeacher?: string;
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const mockSchedule: Record<string, ClassOccurrence[]> = {
  Mon: [
    { id: "1", name: "Morning Vinyasa", style: "Vinyasa", teacher: "Maya Patel", instructorRole: "lead", time: "7:00 AM", endTime: "8:15 AM", room: "Main Studio", location: "SOMA", capacity: 25, booked: 22, waitlisted: 2, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "2", name: "Gentle Flow", style: "Hatha", teacher: "James Liu", instructorRole: "lead", time: "9:30 AM", endTime: "10:30 AM", room: "Main Studio", location: "SOMA", capacity: 20, booked: 12, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "3", name: "Power Yoga", style: "Power", teacher: "Sarah Chen", instructorRole: "lead", time: "12:00 PM", endTime: "1:00 PM", room: "Hot Room", location: "SOMA", capacity: 30, booked: 30, waitlisted: 3, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "4", name: "Yin Restore", style: "Yin", teacher: "Ava Kim", instructorRole: "staff_instructor", time: "4:30 PM", endTime: "5:45 PM", room: "Main Studio", location: "SOMA", capacity: 20, booked: 8, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "5", name: "Evening Vinyasa", style: "Vinyasa", teacher: "Maya Patel", instructorRole: "lead", time: "6:00 PM", endTime: "7:15 PM", room: "Main Studio", location: "SOMA", capacity: 25, booked: 20, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
  ],
  Tue: [
    { id: "6", name: "Sunrise Meditation", style: "Meditation", teacher: "Ava Kim", instructorRole: "lead", time: "6:30 AM", endTime: "7:15 AM", room: "Meditation Room", location: "SOMA", capacity: 15, booked: 10, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "7", name: "Hot Vinyasa", style: "Vinyasa", teacher: "Sarah Chen", instructorRole: "lead", time: "9:00 AM", endTime: "10:15 AM", room: "Hot Room", location: "SOMA", capacity: 30, booked: 28, waitlisted: 1, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "8", name: "Ashtanga Primary", style: "Ashtanga", teacher: "James Liu", instructorRole: "lead", time: "12:00 PM", endTime: "1:30 PM", room: "Main Studio", location: "SOMA", capacity: 20, booked: 15, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: true, originalTeacher: "David Park" },
  ],
  Wed: [
    { id: "9", name: "Morning Vinyasa", style: "Vinyasa", teacher: "Maya Patel", instructorRole: "lead", time: "7:00 AM", endTime: "8:15 AM", room: "Main Studio", location: "SOMA", capacity: 25, booked: 19, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "10", name: "Gentle Flow", style: "Hatha", teacher: "James Liu", instructorRole: "teacher_in_training", time: "9:30 AM", endTime: "10:30 AM", room: "Main Studio", location: "SOMA", capacity: 20, booked: 14, waitlisted: 0, checkedIn: 0, isCancelled: true, isSubbed: false },
  ],
  Thu: [
    { id: "11", name: "Hot Vinyasa", style: "Vinyasa", teacher: "Sarah Chen", instructorRole: "lead", time: "9:00 AM", endTime: "10:15 AM", room: "Hot Room", location: "SOMA", capacity: 30, booked: 25, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "12", name: "Restorative", style: "Restorative", teacher: "Ava Kim", instructorRole: "lead", time: "5:30 PM", endTime: "7:00 PM", room: "Main Studio", location: "SOMA", capacity: 18, booked: 16, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
  ],
  Fri: [
    { id: "13", name: "Morning Vinyasa", style: "Vinyasa", teacher: "Maya Patel", instructorRole: "lead", time: "7:00 AM", endTime: "8:15 AM", room: "Main Studio", location: "SOMA", capacity: 25, booked: 17, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "14", name: "Slow Flow", style: "Hatha", teacher: "James Liu", instructorRole: "lead", time: "10:00 AM", endTime: "11:15 AM", room: "Main Studio", location: "SOMA", capacity: 20, booked: 11, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
  ],
  Sat: [
    { id: "15", name: "Weekend Power", style: "Power", teacher: "Sarah Chen", instructorRole: "lead", time: "9:00 AM", endTime: "10:15 AM", room: "Hot Room", location: "SOMA", capacity: 30, booked: 28, waitlisted: 2, checkedIn: 0, isCancelled: false, isSubbed: false },
    { id: "16", name: "Community Flow", style: "Vinyasa", teacher: "Maya Patel", instructorRole: "lead", time: "11:00 AM", endTime: "12:15 PM", room: "Main Studio", location: "SOMA", capacity: 25, booked: 23, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
  ],
  Sun: [
    { id: "17", name: "Sunday Slow", style: "Yin", teacher: "Ava Kim", instructorRole: "lead", time: "10:00 AM", endTime: "11:30 AM", room: "Main Studio", location: "SOMA", capacity: 20, booked: 18, waitlisted: 0, checkedIn: 0, isCancelled: false, isSubbed: false },
  ],
};

const availableSubs = [
  { id: "t1", name: "Maya Patel", specialties: ["Vinyasa", "Power"] },
  { id: "t2", name: "James Liu", specialties: ["Hatha", "Ashtanga", "Yin"] },
  { id: "t3", name: "Ava Kim", specialties: ["Yin", "Meditation", "Restorative"] },
  { id: "t4", name: "Sarah Chen", specialties: ["Vinyasa", "Power", "Hot"] },
  { id: "t5", name: "David Park", specialties: ["Ashtanga", "Vinyasa"] },
];

export default function ScheduleManage() {
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [searchQuery, setSearchQuery] = useState("");
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [addClassDialogOpen, setAddClassDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassOccurrence | null>(null);
  const [selectedSub, setSelectedSub] = useState("");
  const [subInstructorRole, setSubInstructorRole] = useState<InstructorRole>("lead");
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [schedule, setSchedule] = useState(mockSchedule);
  const [newClassName, setNewClassName] = useState("");
  const [newClassTime, setNewClassTime] = useState("");
  const [newClassTeacher, setNewClassTeacher] = useState("");
  const [newClassStyle, setNewClassStyle] = useState("");
  const [newClassInstructorRole, setNewClassInstructorRole] = useState<InstructorRole>("lead");
  const [newClassRecurring, setNewClassRecurring] = useState(true);
  const { toast } = useToast();

  const classes = schedule[selectedDay] || [];
  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSub = () => {
    if (!selectedClass || !selectedSub) return;
    const subTeacher = availableSubs.find((t) => t.id === selectedSub);
    const roleLabel = instructorRoleLabels[subInstructorRole];
    toast({
      title: "Sub confirmed",
      description: `${subTeacher?.name} (${roleLabel}) will teach ${selectedClass.name} at ${selectedClass.time}. ${notifyStudents ? "Students have been notified." : ""}`,
    });
    setSubDialogOpen(false);
    setSelectedClass(null);
    setSelectedSub("");
    setSubInstructorRole("lead");
  };

  const handleCancel = () => {
    if (!selectedClass) return;
    // Mark class as cancelled in local state
    setSchedule((prev) => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map((cls) =>
        cls.id === selectedClass.id ? { ...cls, isCancelled: true } : cls
      ),
    }));
    toast({
      title: "Class cancelled",
      description: `${selectedClass.name} at ${selectedClass.time} has been cancelled. ${notifyStudents ? `${selectedClass.booked} students notified.` : ""}`,
    });
    setCancelDialogOpen(false);
    setSelectedClass(null);
  };

  const handleAddClass = () => {
    if (!newClassName || !newClassTime || !newClassTeacher) return;
    const newId = `new-${Date.now()}`;
    const teacher = availableSubs.find((t) => t.id === newClassTeacher);
    const endTime = (() => {
      const [time, period] = newClassTime.split(" ");
      const [h, m] = time.split(":").map(Number);
      const hour24 = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h;
      const endHour = hour24 + 1;
      const endPeriod = endHour >= 12 ? "PM" : "AM";
      const endH12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
      return `${endH12}:${String(m).padStart(2, "0")} ${endPeriod}`;
    })();
    const newClass: ClassOccurrence = {
      id: newId,
      name: newClassName,
      style: newClassStyle || "Vinyasa",
      teacher: teacher?.name || "TBD",
      instructorRole: newClassInstructorRole,
      time: newClassTime,
      endTime,
      room: "Main Studio",
      location: "SOMA",
      capacity: 25,
      booked: 0,
      waitlisted: 0,
      checkedIn: 0,
      isCancelled: false,
      isSubbed: false,
    };
    setSchedule((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newClass].sort((a, b) =>
        a.time.localeCompare(b.time)
      ),
    }));
    const roleLabel = instructorRoleLabels[newClassInstructorRole];
    toast({
      title: "Class added",
      description: `${newClassName} at ${newClassTime} with ${teacher?.name || "TBD"} (${roleLabel})${newClassRecurring ? " — recurring weekly on " + selectedDay : ""}`,
    });
    setAddClassDialogOpen(false);
    setNewClassName("");
    setNewClassTime("");
    setNewClassTeacher("");
    setNewClassStyle("");
    setNewClassInstructorRole("lead");
    setNewClassRecurring(true);
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage classes, subs, and cancellations</p>
          </div>
          <Button size="sm" onClick={() => setAddClassDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1 overflow-x-auto">
            {weekDays.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedDay(day)}
                className="min-w-[52px]"
              >
                {day}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes or teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Class List */}
        <div className="space-y-3">
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No classes scheduled for {selectedDay}</p>
              </CardContent>
            </Card>
          ) : (
            filteredClasses.map((cls) => (
              <Card
                key={cls.id}
                className={`${cls.isCancelled ? "opacity-60" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      {/* Time */}
                      <div className="shrink-0 w-20 text-center">
                        <p className="text-sm font-semibold">{cls.time}</p>
                        <p className="text-xs text-muted-foreground">{cls.endTime}</p>
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">{cls.name}</h3>
                          {cls.instructorRole !== "lead" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {instructorRoleLabels[cls.instructorRole]}
                            </Badge>
                          )}
                          {cls.isCancelled && (
                            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                          )}
                          {cls.isSubbed && (
                            <Badge variant="outline" className="text-xs border-accent-gold/50 text-accent-gold">
                              Sub: {cls.teacher}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {cls.teacher}
                            {cls.isSubbed && cls.originalTeacher && (
                              <span className="line-through ml-1">({cls.originalTeacher})</span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cls.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {cls.style}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Status + Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {cls.booked}/{cls.capacity}
                        </p>
                        {cls.waitlisted > 0 && (
                          <p className="text-xs text-accent-gold">+{cls.waitlisted} waitlisted</p>
                        )}
                        {cls.checkedIn > 0 && (
                          <p className="text-xs text-accent-sage">{cls.checkedIn} checked in</p>
                        )}
                      </div>

                      {!cls.isCancelled && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuItem className="rounded-lg cursor-pointer">
                              <Users className="h-4 w-4 mr-2" />
                              View Roster
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer"
                              onClick={() => {
                                setSelectedClass(cls);
                                setSubDialogOpen(true);
                              }}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Find Sub
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg cursor-pointer">
                              <Bell className="h-4 w-4 mr-2" />
                              Notify Students
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="rounded-lg cursor-pointer text-destructive"
                              onClick={() => {
                                setSelectedClass(cls);
                                setCancelDialogOpen(true);
                              }}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Cancel Class
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Sub Teacher Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Find a Sub</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/50">
                <p className="text-sm font-semibold">{selectedClass.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDay} {selectedClass.time} — Currently: {selectedClass.teacher}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Substitute Teacher</label>
                <Select value={selectedSub} onValueChange={setSelectedSub}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubs
                      .filter((t) => t.name !== selectedClass.teacher)
                      .map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          <span>{teacher.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({teacher.specialties.join(", ")})
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Instructor Role</label>
                <Select value={subInstructorRole} onValueChange={(v) => setSubInstructorRole(v as InstructorRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead Instructor</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                    <SelectItem value="staff_instructor">Staff Instructor</SelectItem>
                    <SelectItem value="teacher_in_training">Teacher in Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={notifyStudents}
                  onChange={(e) => setNotifyStudents(e.target.checked)}
                  className="rounded"
                />
                Notify {selectedClass.booked} booked students
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSub} disabled={!selectedSub}>
              Confirm Sub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Class Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel Class</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-semibold">{selectedClass.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDay} {selectedClass.time} — {selectedClass.teacher}
                </p>
                <p className="text-xs text-destructive mt-1">
                  {selectedClass.booked} students will be affected
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={notifyStudents}
                  onChange={(e) => setNotifyStudents(e.target.checked)}
                  className="rounded"
                />
                Notify {selectedClass.booked} booked students
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Class
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Class Dialog */}
      <Dialog open={addClassDialogOpen} onOpenChange={setAddClassDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Class to Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium">Adding to: <span className="font-semibold">{selectedDay}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">This class will appear in the weekly schedule</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Class Name</label>
              <Input
                placeholder="e.g. Morning Vinyasa"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Select value={newClassTime} onValueChange={setNewClassTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time..." />
                </SelectTrigger>
                <SelectContent>
                  {["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "9:30 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "7:00 PM", "7:30 PM"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Teacher</label>
              <Select value={newClassTeacher} onValueChange={setNewClassTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSubs.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Instructor Role</label>
              <Select value={newClassInstructorRole} onValueChange={(v) => setNewClassInstructorRole(v as InstructorRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead Instructor</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                  <SelectItem value="staff_instructor">Staff Instructor</SelectItem>
                  <SelectItem value="teacher_in_training">Teacher in Training</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Select value={newClassStyle} onValueChange={setNewClassStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style..." />
                </SelectTrigger>
                <SelectContent>
                  {["Vinyasa", "Hatha", "Power", "Yin", "Restorative", "Ashtanga", "Meditation", "Hot"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newClassRecurring}
                onChange={(e) => setNewClassRecurring(e.target.checked)}
                className="rounded"
              />
              Recurring weekly on {selectedDay}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClassDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClass} disabled={!newClassName || !newClassTime || !newClassTeacher}>
              Add Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManageLayout>
  );
}
