import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthCallback } from "@/components/auth/AuthCallback";

// Public pages
import Index from "./pages/Index";
import Schedule from "./pages/Schedule";
import MySchedule from "./pages/MySchedule";
import Community from "./pages/Community";
import Account from "./pages/Account";
import Studios from "./pages/Studios";
import StudioDetail from "./pages/StudioDetail";
import Instructors from "./pages/Instructors";
import InstructorDetail from "./pages/InstructorDetail";
import OnDemand from "./pages/OnDemand";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";

// Platform admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudios from "./pages/admin/AdminStudios";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminSettings from "./pages/admin/AdminSettings";

// Studio management pages
import ManageDashboard from "./pages/manage/ManageDashboard";
import ManageSchedule from "./pages/manage/ManageSchedule";
import ManageMembers from "./pages/manage/ManageMembers";
import ManageInbox from "./pages/manage/ManageInbox";
import ManageSettings from "./pages/manage/ManageSettings";

// Staff pages
import StaffCheckin from "./pages/staff/StaffCheckin";
import StaffWaitlist from "./pages/staff/StaffWaitlist";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* ---- Public routes ---- */}
              <Route path="/" element={<Index />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/studios" element={<Studios />} />
              <Route path="/studios/:id" element={<StudioDetail />} />
              <Route path="/instructors" element={<Instructors />} />
              <Route path="/instructors/:id" element={<InstructorDetail />} />
              <Route path="/on-demand" element={<OnDemand />} />

              {/* ---- Auth routes ---- */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* ---- Authenticated member routes ---- */}
              <Route path="/my-schedule" element={<ProtectedRoute permission="member.manage_bookings"><MySchedule /></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute permission="member.view_profile"><Community /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute permission="member.view_profile"><Account /></ProtectedRoute>} />

              {/* ---- Platform admin routes (/admin) ---- */}
              <Route path="/admin" element={<ProtectedRoute permission="platform.admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/studios" element={<ProtectedRoute permission="platform.manage_studios"><AdminStudios /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute permission="platform.manage_users"><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/billing" element={<ProtectedRoute permission="platform.manage_billing"><AdminBilling /></ProtectedRoute>} />
              <Route path="/admin/feedback" element={<ProtectedRoute permission="platform.admin"><AdminFeedback /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute permission="platform.admin"><AdminSettings /></ProtectedRoute>} />

              {/* ---- Studio management routes (/manage) ---- */}
              <Route path="/manage" element={<ProtectedRoute permission="studio.manage_settings"><ManageDashboard /></ProtectedRoute>} />
              <Route path="/manage/schedule" element={<ProtectedRoute permission="studio.manage_schedule"><ManageSchedule /></ProtectedRoute>} />
              <Route path="/manage/members" element={<ProtectedRoute permission="studio.manage_members"><ManageMembers /></ProtectedRoute>} />
              <Route path="/manage/inbox" element={<ProtectedRoute permission="studio.view_inbox"><ManageInbox /></ProtectedRoute>} />
              <Route path="/manage/settings" element={<ProtectedRoute permission="studio.manage_settings"><ManageSettings /></ProtectedRoute>} />

              {/* ---- Staff routes (/staff) ---- */}
              <Route path="/staff/checkin" element={<ProtectedRoute permission="studio.checkin"><StaffCheckin /></ProtectedRoute>} />
              <Route path="/staff/waitlist" element={<ProtectedRoute permission="studio.manage_waitlist"><StaffWaitlist /></ProtectedRoute>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
