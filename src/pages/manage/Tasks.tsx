import { useState, useMemo } from "react";
import { ManageLayout } from "@/components/manage/ManageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Plus,
  MoreVertical,
  Calendar,
  Search,
  Filter,
  LayoutGrid,
  List,
  Trash2,
  Edit,
  GripVertical,
  ChevronRight,
  MessageSquare,
  Paperclip,
  RefreshCw,
  MapPin,
  X,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import type {
  StaffTask,
  TaskPriority,
  TaskStatus,
  TaskCategory,
  ChecklistItem,
  Profile,
} from "@/types/database";

// Mock data for staff members
const mockStaff: (Profile & { id: string })[] = [
  { id: "s1", first_name: "Maya", last_name: "Patel", email: "maya@tandava.yoga", display_name: null, phone: null, avatar_url: null, date_of_birth: null, pronouns: null, emergency_contact_name: null, emergency_contact_phone: null, bio: null, specialties: [], certifications: [], instagram_handle: null, website: null, created_at: "", updated_at: "" },
  { id: "s2", first_name: "James", last_name: "Liu", email: "james@tandava.yoga", display_name: null, phone: null, avatar_url: null, date_of_birth: null, pronouns: null, emergency_contact_name: null, emergency_contact_phone: null, bio: null, specialties: [], certifications: [], instagram_handle: null, website: null, created_at: "", updated_at: "" },
  { id: "s3", first_name: "Sarah", last_name: "Chen", email: "sarah@tandava.yoga", display_name: null, phone: null, avatar_url: null, date_of_birth: null, pronouns: null, emergency_contact_name: null, emergency_contact_phone: null, bio: null, specialties: [], certifications: [], instagram_handle: null, website: null, created_at: "", updated_at: "" },
  { id: "s4", first_name: "Alex", last_name: "Rivera", email: "alex@tandava.yoga", display_name: null, phone: null, avatar_url: null, date_of_birth: null, pronouns: null, emergency_contact_name: null, emergency_contact_phone: null, bio: null, specialties: [], certifications: [], instagram_handle: null, website: null, created_at: "", updated_at: "" },
];

// Mock task categories
const mockCategories: TaskCategory[] = [
  { id: "c1", studio_id: "1", name: "Cleaning", color: "#10B981", icon: null, sort_order: 1, created_at: "" },
  { id: "c2", studio_id: "1", name: "Maintenance", color: "#F59E0B", icon: null, sort_order: 2, created_at: "" },
  { id: "c3", studio_id: "1", name: "Admin", color: "#6366F1", icon: null, sort_order: 3, created_at: "" },
  { id: "c4", studio_id: "1", name: "Inventory", color: "#EC4899", icon: null, sort_order: 4, created_at: "" },
  { id: "c5", studio_id: "1", name: "Customer Service", color: "#14B8A6", icon: null, sort_order: 5, created_at: "" },
];

// Mock locations
const mockLocations = [
  { id: "l1", name: "Main Studio" },
  { id: "l2", name: "Downtown Location" },
  { id: "l3", name: "Westside Studio" },
];

// Mock tasks
const mockTasks: (StaffTask & { assignee?: Profile; category?: TaskCategory })[] = [
  {
    id: "t1", studio_id: "1", title: "Restock yoga mats in Hot Room", description: "Check inventory and restock mats from storage. Replace any worn mats.", category_id: "c4", priority: "high", status: "pending", assigned_to: "s1", assigned_by: "s3", due_date: "2025-02-05", due_time: "09:00", started_at: null, completed_at: null, completed_by: null, location_id: "l1", room_id: null, is_recurring: false, recurrence_rule_id: null, parent_task_id: null, checklist: [{ id: "cl1", text: "Count current mat inventory", completed: true }, { id: "cl2", text: "Get mats from storage", completed: false }, { id: "cl3", text: "Replace worn mats", completed: false }], attachments_count: 0, notes: null, created_by: "s3", created_at: "2025-02-04T10:00:00", updated_at: "2025-02-04T10:00:00",
    assignee: mockStaff[0], category: mockCategories[3]
  },
  {
    id: "t2", studio_id: "1", title: "Deep clean meditation room", description: "Weekly deep cleaning including floors, cushions, and props.", category_id: "c1", priority: "medium", status: "in_progress", assigned_to: "s2", assigned_by: "s3", due_date: "2025-02-05", due_time: "17:00", started_at: "2025-02-05T14:00:00", completed_at: null, completed_by: null, location_id: "l1", room_id: null, is_recurring: true, recurrence_rule_id: "r1", parent_task_id: null, checklist: [{ id: "cl4", text: "Vacuum floors", completed: true }, { id: "cl5", text: "Wipe down surfaces", completed: true }, { id: "cl6", text: "Clean cushions", completed: false }, { id: "cl7", text: "Organize props", completed: false }], attachments_count: 1, notes: "Use the eco-friendly cleaning solution.", created_by: "s3", created_at: "2025-02-04T08:00:00", updated_at: "2025-02-05T14:00:00",
    assignee: mockStaff[1], category: mockCategories[0]
  },
  {
    id: "t3", studio_id: "1", title: "Fix wobbly ceiling fan in main studio", description: "The ceiling fan near the front desk has been making noise. Check and tighten as needed.", category_id: "c2", priority: "urgent", status: "pending", assigned_to: "s4", assigned_by: "s3", due_date: "2025-02-04", due_time: "12:00", started_at: null, completed_at: null, completed_by: null, location_id: "l1", room_id: null, is_recurring: false, recurrence_rule_id: null, parent_task_id: null, checklist: [], attachments_count: 0, notes: null, created_by: "s3", created_at: "2025-02-03T16:00:00", updated_at: "2025-02-03T16:00:00",
    assignee: mockStaff[3], category: mockCategories[1]
  },
  {
    id: "t4", studio_id: "1", title: "Update class schedule on website", description: "Add new Saturday morning classes to the public schedule.", category_id: "c3", priority: "low", status: "completed", assigned_to: "s3", assigned_by: "s3", due_date: "2025-02-03", due_time: "18:00", started_at: "2025-02-03T14:00:00", completed_at: "2025-02-03T15:30:00", completed_by: "s3", location_id: null, room_id: null, is_recurring: false, recurrence_rule_id: null, parent_task_id: null, checklist: [{ id: "cl8", text: "Update schedule", completed: true }, { id: "cl9", text: "Test booking flow", completed: true }], attachments_count: 0, notes: null, created_by: "s3", created_at: "2025-02-02T10:00:00", updated_at: "2025-02-03T15:30:00",
    assignee: mockStaff[2], category: mockCategories[2]
  },
  {
    id: "t5", studio_id: "1", title: "Respond to member inquiry about private sessions", description: "Emma Wilson asked about private yoga sessions. Follow up with pricing and availability.", category_id: "c5", priority: "high", status: "pending", assigned_to: "s3", assigned_by: null, due_date: "2025-02-05", due_time: "12:00", started_at: null, completed_at: null, completed_by: null, location_id: null, room_id: null, is_recurring: false, recurrence_rule_id: null, parent_task_id: null, checklist: [], attachments_count: 2, notes: null, created_by: "s3", created_at: "2025-02-04T11:00:00", updated_at: "2025-02-04T11:00:00",
    assignee: mockStaff[2], category: mockCategories[4]
  },
  {
    id: "t6", studio_id: "1", title: "Order new bolsters", description: "We need 10 new bolsters for the restorative classes.", category_id: "c4", priority: "medium", status: "pending", assigned_to: null, assigned_by: "s3", due_date: "2025-02-07", due_time: null, started_at: null, completed_at: null, completed_by: null, location_id: "l1", room_id: null, is_recurring: false, recurrence_rule_id: null, parent_task_id: null, checklist: [{ id: "cl10", text: "Research vendors", completed: false }, { id: "cl11", text: "Get approval for budget", completed: false }, { id: "cl12", text: "Place order", completed: false }], attachments_count: 0, notes: null, created_by: "s3", created_at: "2025-02-04T09:00:00", updated_at: "2025-02-04T09:00:00",
    category: mockCategories[3]
  },
  {
    id: "t7", studio_id: "1", title: "Morning studio opening checklist", description: "Daily opening tasks for the studio.", category_id: "c1", priority: "medium", status: "completed", assigned_to: "s1", assigned_by: null, due_date: "2025-02-05", due_time: "06:00", started_at: "2025-02-05T05:45:00", completed_at: "2025-02-05T06:15:00", completed_by: "s1", location_id: "l1", room_id: null, is_recurring: true, recurrence_rule_id: "r2", parent_task_id: null, checklist: [{ id: "cl13", text: "Unlock doors", completed: true }, { id: "cl14", text: "Turn on lights and HVAC", completed: true }, { id: "cl15", text: "Check restrooms", completed: true }, { id: "cl16", text: "Set up front desk", completed: true }], attachments_count: 0, notes: null, created_by: "s3", created_at: "2025-02-04T20:00:00", updated_at: "2025-02-05T06:15:00",
    assignee: mockStaff[0], category: mockCategories[0]
  },
];

// Mock activity log
const mockActivityLog = [
  { id: "a1", task_id: "t1", actor: "Sarah Chen", action: "created", timestamp: "2025-02-04T10:00:00" },
  { id: "a2", task_id: "t1", actor: "Sarah Chen", action: "assigned to Maya Patel", timestamp: "2025-02-04T10:01:00" },
  { id: "a3", task_id: "t1", actor: "Maya Patel", action: "completed checklist item", timestamp: "2025-02-04T14:30:00" },
];

// Mock comments
const mockComments = [
  { id: "cm1", task_id: "t1", author: mockStaff[0], content: "I'll get to this after the morning classes.", timestamp: "2025-02-04T11:00:00" },
  { id: "cm2", task_id: "t1", author: mockStaff[2], content: "Thanks Maya! Let me know if you need help finding the mats in storage.", timestamp: "2025-02-04T11:15:00" },
];

// Priority config
const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string; icon: typeof AlertCircle }> = {
  low: { label: "Low", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800", icon: Circle },
  medium: { label: "Medium", color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: Clock },
  high: { label: "High", color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30", icon: AlertTriangle },
  urgent: { label: "Urgent", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle },
};

// Status config
const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: "To Do", color: "bg-gray-500" },
  in_progress: { label: "In Progress", color: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500" },
};

function getInitials(profile?: Profile | null): string {
  if (!profile) return "?";
  const first = profile.first_name?.[0] || "";
  const last = profile.last_name?.[0] || "";
  return (first + last).toUpperCase() || "?";
}

function getFullName(profile?: Profile | null): string {
  if (!profile) return "Unassigned";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function isOverdue(task: StaffTask): boolean {
  if (task.status === "completed" || task.status === "cancelled") return false;
  if (!task.due_date) return false;
  const dueDate = new Date(task.due_date);
  if (task.due_time) {
    const [hours, minutes] = task.due_time.split(":").map(Number);
    dueDate.setHours(hours, minutes);
  } else {
    dueDate.setHours(23, 59, 59);
  }
  return dueDate < new Date();
}

interface TaskFormData {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  categoryId: string;
  locationId: string;
  isRecurring: boolean;
  recurrenceFrequency: "daily" | "weekly" | "monthly";
  checklist: ChecklistItem[];
}

const emptyFormData: TaskFormData = {
  title: "",
  description: "",
  assignee: "",
  dueDate: "",
  dueTime: "",
  priority: "medium",
  categoryId: "",
  locationId: "",
  isRecurring: false,
  recurrenceFrequency: "weekly",
  checklist: [],
};

export default function TasksManage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StaffTask | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(emptyFormData);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const [selectedTask, setSelectedTask] = useState<typeof mockTasks[0] | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAssignee = filterAssignee === "all" || task.assigned_to === filterAssignee;
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
      const matchesCategory = filterCategory === "all" || task.category_id === filterCategory;
      const matchesOverdue = !showOverdueOnly || isOverdue(task);
      return matchesSearch && matchesAssignee && matchesPriority && matchesCategory && matchesOverdue;
    });
  }, [tasks, searchQuery, filterAssignee, filterPriority, filterCategory, showOverdueOnly]);

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof mockTasks> = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
    filteredTasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      total: tasks.length,
      overdue: tasks.filter((t) => isOverdue(t)).length,
      completedToday: tasks.filter((t) => t.completed_at && t.completed_at.startsWith(today)).length,
      myTasks: tasks.filter((t) => t.assigned_to === "s3" && t.status !== "completed").length,
    };
  }, [tasks]);

  // Handlers
  const handleOpenCreateDialog = () => {
    setEditingTask(null);
    setFormData(emptyFormData);
    setCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (task: typeof mockTasks[0]) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assignee: task.assigned_to || "",
      dueDate: task.due_date || "",
      dueTime: task.due_time || "",
      priority: task.priority,
      categoryId: task.category_id || "",
      locationId: task.location_id || "",
      isRecurring: task.is_recurring,
      recurrenceFrequency: "weekly",
      checklist: [...task.checklist],
    });
    setCreateDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!formData.title.trim()) return;

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: formData.title,
                description: formData.description || null,
                assigned_to: formData.assignee || null,
                due_date: formData.dueDate || null,
                due_time: formData.dueTime || null,
                priority: formData.priority,
                category_id: formData.categoryId || null,
                location_id: formData.locationId || null,
                is_recurring: formData.isRecurring,
                checklist: formData.checklist,
                assignee: mockStaff.find((s) => s.id === formData.assignee),
                category: mockCategories.find((c) => c.id === formData.categoryId),
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );
    } else {
      const newTask: typeof mockTasks[0] = {
        id: `t${Date.now()}`,
        studio_id: "1",
        title: formData.title,
        description: formData.description || null,
        category_id: formData.categoryId || null,
        priority: formData.priority,
        status: "pending",
        assigned_to: formData.assignee || null,
        assigned_by: "s3",
        due_date: formData.dueDate || null,
        due_time: formData.dueTime || null,
        started_at: null,
        completed_at: null,
        completed_by: null,
        location_id: formData.locationId || null,
        room_id: null,
        is_recurring: formData.isRecurring,
        recurrence_rule_id: null,
        parent_task_id: null,
        checklist: formData.checklist,
        attachments_count: 0,
        notes: null,
        created_by: "s3",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: mockStaff.find((s) => s.id === formData.assignee),
        category: mockCategories.find((c) => c.id === formData.categoryId),
      };
      setTasks((prev) => [newTask, ...prev]);
    }

    setCreateDialogOpen(false);
    setFormData(emptyFormData);
    setEditingTask(null);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { id: `cl${Date.now()}`, text: newChecklistItem, completed: false }],
    }));
    setNewChecklistItem("");
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }));
  };

  const handleToggleChecklistItem = (taskId: string, itemId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              checklist: t.checklist.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : t
      )
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              checklist: prev.checklist.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : null
      );
    }
  };

  const handleChangeStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              started_at: newStatus === "in_progress" && !t.started_at ? new Date().toISOString() : t.started_at,
              completed_at: newStatus === "completed" ? new Date().toISOString() : null,
              completed_by: newStatus === "completed" ? "s3" : null,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setDetailPanelOpen(false);
      setSelectedTask(null);
    }
  };

  const handleOpenDetail = (task: typeof mockTasks[0]) => {
    setSelectedTask(task);
    setDetailPanelOpen(true);
  };

  // Task Card Component
  const TaskCard = ({ task }: { task: typeof mockTasks[0] }) => {
    const priority = priorityConfig[task.priority];
    const PriorityIcon = priority.icon;
    const taskIsOverdue = isOverdue(task);
    const checklistProgress = task.checklist.length > 0
      ? Math.round((task.checklist.filter((c) => c.completed).length / task.checklist.length) * 100)
      : null;

    return (
      <Card
        className={`cursor-pointer hover:border-primary/30 transition-all group ${
          taskIsOverdue ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/10" : ""
        }`}
        onClick={() => handleOpenDetail(task)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {task.category && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: task.category.color }}
                    title={task.category.name}
                  />
                )}
                <h4 className="text-sm font-medium truncate">{task.title}</h4>
              </div>

              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-[10px] px-1.5 py-0 ${priority.bgColor} ${priority.color} border-0`}>
                  <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
                  {priority.label}
                </Badge>

                {task.due_date && (
                  <span className={`text-[10px] flex items-center gap-0.5 ${taskIsOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                    <Calendar className="h-2.5 w-2.5" />
                    {formatDate(task.due_date)}
                    {task.due_time && ` ${task.due_time}`}
                  </span>
                )}

                {task.is_recurring && (
                  <RefreshCw className="h-3 w-3 text-muted-foreground" title="Recurring" />
                )}

                {checklistProgress !== null && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <CheckSquare className="h-2.5 w-2.5" />
                    {checklistProgress}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(task); }}>
                    <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {task.status !== "completed" && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleChangeStatus(task.id, "completed"); }}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark Complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {task.assignee && (
                <Avatar className="h-6 w-6 mt-1">
                  <AvatarFallback className="text-[9px] bg-primary/10">
                    {getInitials(task.assignee)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {/* Drag indicator (visual only) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ManageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track staff tasks across your studio
            </p>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Tasks</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <CheckSquare className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className={stats.overdue > 0 ? "border-red-500/50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className={`text-xl font-bold ${stats.overdue > 0 ? "text-red-500" : ""}`}>{stats.overdue}</p>
                </div>
                <AlertCircle className={`h-5 w-5 ${stats.overdue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed Today</p>
                  <p className="text-xl font-bold text-green-500">{stats.completedToday}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">My Tasks</p>
                  <p className="text-xl font-bold">{stats.myTasks}</p>
                </div>
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-36">
                <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {mockStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {getFullName(staff)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-36">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {mockCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showOverdueOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              className={showOverdueOnly ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Overdue
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("board")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Board
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1.5" />
              List
            </Button>
          </div>
        </div>

        {/* Board View */}
        {viewMode === "board" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["pending", "in_progress", "completed"] as TaskStatus[]).map((status) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig[status].color}`} />
                    <h3 className="text-sm font-semibold">{statusConfig[status].label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {tasksByStatus[status].length}
                    </Badge>
                  </div>
                  {status === "pending" && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleOpenCreateDialog}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 border-2 border-dashed border-transparent hover:border-primary/20 transition-colors">
                  {tasksByStatus[status].map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                      <CheckSquare className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-xs">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Task</span>
                <span>Assignee</span>
                <span>Due Date</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Category</span>
                <span></span>
              </div>

              {/* Task Rows */}
              {filteredTasks.map((task) => {
                const priority = priorityConfig[task.priority];
                const PriorityIcon = priority.icon;
                const taskIsOverdue = isOverdue(task);

                return (
                  <div
                    key={task.id}
                    className={`grid md:grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr,auto] gap-4 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-secondary/30 transition-colors cursor-pointer ${
                      taskIsOverdue ? "bg-red-50/50 dark:bg-red-950/10" : ""
                    }`}
                    onClick={() => handleOpenDetail(task)}
                  >
                    {/* Task */}
                    <div className="flex items-center gap-3 min-w-0">
                      {task.category && (
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: task.category.color }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.checklist.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {task.checklist.filter((c) => c.completed).length}/{task.checklist.length} items
                          </p>
                        )}
                      </div>
                      {task.is_recurring && <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>

                    {/* Assignee */}
                    <div className="hidden md:flex items-center gap-2">
                      {task.assignee ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px] bg-primary/10">
                              {getInitials(task.assignee)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{getFullName(task.assignee)}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="hidden md:block">
                      {task.due_date ? (
                        <span className={`text-sm ${taskIsOverdue ? "text-red-500 font-medium" : ""}`}>
                          {formatDate(task.due_date)}
                          {task.due_time && <span className="text-muted-foreground ml-1">{task.due_time}</span>}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No due date</span>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="hidden md:block">
                      <Badge className={`text-[10px] ${priority.bgColor} ${priority.color} border-0`}>
                        <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />
                        {priority.label}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="hidden md:block">
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleChangeStatus(task.id, value as TaskStatus)}
                      >
                        <SelectTrigger className="h-7 text-xs w-28" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category */}
                    <div className="hidden md:block">
                      {task.category ? (
                        <Badge variant="outline" className="text-[10px]">
                          <div
                            className="w-2 h-2 rounded-full mr-1"
                            style={{ backgroundColor: task.category.color }}
                          />
                          {task.category.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleOpenEditDialog(task)}>
                            <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm">No tasks found</p>
                  <p className="text-xs mt-1">Try adjusting your filters or create a new task</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the task details below." : "Add a new task for your team."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add task details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={formData.assignee}
                  onValueChange={(value) => setFormData({ ...formData, assignee: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {mockStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {getFullName(staff)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-gray-500" /> Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-blue-500" /> Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-orange-500" /> High
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-red-500" /> Urgent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueTime">Due Time</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {mockLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <Label>Checklist</Label>
              <div className="space-y-2">
                {formData.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <Checkbox checked={item.completed} disabled />
                    <span className="flex-1 text-sm">{item.text}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add checklist item..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChecklistItem())}
                  />
                  <Button variant="outline" size="icon" onClick={handleAddChecklistItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Recurrence */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium">Recurring Task</p>
                <p className="text-xs text-muted-foreground">Automatically create new instances</p>
              </div>
              <Switch
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
              />
            </div>

            {formData.isRecurring && (
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select
                  value={formData.recurrenceFrequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, recurrenceFrequency: value as "daily" | "weekly" | "monthly" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask} disabled={!formData.title.trim()}>
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Panel */}
      <Sheet open={detailPanelOpen} onOpenChange={setDetailPanelOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {selectedTask.category && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedTask.category.color }}
                      />
                    )}
                    <SheetTitle className="text-left">{selectedTask.title}</SheetTitle>
                  </div>
                </div>
                <SheetDescription className="text-left">
                  {selectedTask.description || "No description provided."}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                    <Select
                      value={selectedTask.status}
                      onValueChange={(value) => {
                        handleChangeStatus(selectedTask.id, value as TaskStatus);
                        setSelectedTask({ ...selectedTask, status: value as TaskStatus });
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Priority</p>
                    <Badge className={`${priorityConfig[selectedTask.priority].bgColor} ${priorityConfig[selectedTask.priority].color} border-0`}>
                      {priorityConfig[selectedTask.priority].label}
                    </Badge>
                  </div>
                </div>

                {/* Assignment & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Assignee</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px] bg-primary/10">
                          {getInitials(selectedTask.assignee)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getFullName(selectedTask.assignee)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Due Date</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={`text-sm ${isOverdue(selectedTask) ? "text-red-500 font-medium" : ""}`}>
                        {selectedTask.due_date ? formatDate(selectedTask.due_date) : "No due date"}
                        {selectedTask.due_time && ` at ${selectedTask.due_time}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                {selectedTask.location_id && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Location</p>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">
                        {mockLocations.find((l) => l.id === selectedTask.location_id)?.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {selectedTask.checklist.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Checklist</p>
                      <span className="text-xs text-muted-foreground">
                        {selectedTask.checklist.filter((c) => c.completed).length}/{selectedTask.checklist.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedTask.checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
                          onClick={() => handleToggleChecklistItem(selectedTask.id, item.id)}
                        >
                          <Checkbox checked={item.completed} />
                          <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Log */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Activity</p>
                  <div className="space-y-3">
                    {mockActivityLog
                      .filter((a) => a.task_id === selectedTask.id)
                      .map((activity) => (
                        <div key={activity.id} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div>
                            <span className="font-medium">{activity.actor}</span>{" "}
                            <span className="text-muted-foreground">{activity.action}</span>
                            <p className="text-muted-foreground">{formatDateTime(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    {selectedTask.completed_at && (
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium">Task completed</span>
                          <p className="text-muted-foreground">{formatDateTime(selectedTask.completed_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Comments</p>
                  <div className="space-y-3 mb-3">
                    {mockComments
                      .filter((c) => c.task_id === selectedTask.id)
                      .map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-[9px] bg-primary/10">
                              {getInitials(comment.author)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{getFullName(comment.author)}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDateTime(comment.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm mt-0.5">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" disabled={!newComment.trim()}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Attachments</p>
                  {selectedTask.attachments_count > 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedTask.attachments_count} attachment(s)</span>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Attachment
                    </Button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleOpenEditDialog(selectedTask);
                      setDetailPanelOpen(false);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      handleDeleteTask(selectedTask.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ManageLayout>
  );
}
