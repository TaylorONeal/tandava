import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Student-facing pages
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

// Studio management pages
import ManageDashboard from "./pages/manage/Dashboard";
import ScheduleManage from "./pages/manage/ScheduleManage";
import StudentsManage from "./pages/manage/Students";
import TeachersManage from "./pages/manage/Teachers";
import OfferingsManage from "./pages/manage/Offerings";
import FinancialsManage from "./pages/manage/Financials";
import ReportsManage from "./pages/manage/Reports";
import ImportManage from "./pages/manage/Import";
import SettingsManage from "./pages/manage/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Student-facing routes */}
            <Route path="/" element={<Index />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/my-schedule" element={<MySchedule />} />
            <Route path="/community" element={<Community />} />
            <Route path="/account" element={<Account />} />
            <Route path="/studios" element={<Studios />} />
            <Route path="/studios/:id" element={<StudioDetail />} />
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/instructors/:id" element={<InstructorDetail />} />
            <Route path="/on-demand" element={<OnDemand />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />

            {/* Studio management routes */}
            <Route path="/manage" element={<ManageDashboard />} />
            <Route path="/manage/schedule" element={<ScheduleManage />} />
            <Route path="/manage/students" element={<StudentsManage />} />
            <Route path="/manage/teachers" element={<TeachersManage />} />
            <Route path="/manage/offerings" element={<OfferingsManage />} />
            <Route path="/manage/financials" element={<FinancialsManage />} />
            <Route path="/manage/reports" element={<ReportsManage />} />
            <Route path="/manage/import" element={<ImportManage />} />
            <Route path="/manage/settings" element={<SettingsManage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
