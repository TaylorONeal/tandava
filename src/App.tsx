import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthCallback } from "@/components/auth/AuthCallback";
// DemoPanel removed — role selection now happens on landing page + DemoRoleBar
import { DemoRoleBar } from "@/components/DemoRoleBar";
import { Component, type ErrorInfo, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Error Boundary — shows the crash instead of a black screen
// ---------------------------------------------------------------------------
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Tandava] Render crash:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0a14", color: "#f5f0e8", fontFamily: "'DM Sans', sans-serif", padding: "2rem" }}>
          <div style={{ maxWidth: "32rem", textAlign: "center" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", marginBottom: "1rem" }}>Something went wrong</h1>
            <p style={{ opacity: 0.7, marginBottom: "1.5rem" }}>Tandava encountered an error during startup.</p>
            <pre style={{ textAlign: "left", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.75rem", overflow: "auto", maxHeight: "12rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: "1.5rem", padding: "0.5rem 1.5rem", background: "#4fd1c5", color: "#0f0a14", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 600 }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
import Demo from "./pages/Demo";
import OpenSource from "./pages/OpenSource";

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
import OnboardingManage from "./pages/manage/Onboarding";
import MemberDetailManage from "./pages/manage/MemberDetail";
import PromoCodesManage from "./pages/manage/PromoCodes";
import EventsManage from "./pages/manage/Events";
import LandingPagesManage from "./pages/manage/LandingPages";
import AnalyticsHubManage from "./pages/manage/AnalyticsHub";
import MemberAnalyticsManage from "./pages/manage/MemberAnalytics";
import SalesAnalyticsManage from "./pages/manage/SalesAnalytics";
import FinancialAnalyticsManage from "./pages/manage/FinancialAnalytics";
import SiteAnalyticsManage from "./pages/manage/SiteAnalytics";
import DataConnectorsManage from "./pages/manage/DataConnectors";
import ProductsManage from "./pages/manage/Products";
import InventoryManage from "./pages/manage/Inventory";
import PurchaseOrdersManage from "./pages/manage/PurchaseOrders";
import NotificationSettingsManage from "./pages/manage/NotificationSettings";
import SmsInboxManage from "./pages/manage/SmsInbox";
import UtmBuilderManage from "./pages/manage/UtmBuilder";
import CampaignsManage from "./pages/manage/Campaigns";
import TasksManage from "./pages/manage/Tasks";
import OnDemandManage from "./pages/manage/OnDemand";
import FeatureSettingsManage from "./pages/manage/FeatureSettings";
import AuditLogsManage from "./pages/manage/AuditLogs";
import DataDictionaryManage from "./pages/manage/DataDictionary";
import DefinitionsManage from "./pages/manage/Definitions";

// Account pages
import NotificationPreferences from "./pages/account/NotificationPreferences";

// Instructor portal pages
import TeachDashboard from "./pages/teach/Dashboard";
import TeachSchedule from "./pages/teach/Schedule";
import TeachSubs from "./pages/teach/Subs";
import TeachEarnings from "./pages/teach/Earnings";
import TeachAvailability from "./pages/teach/Availability";
import TeachProfile from "./pages/teach/Profile";

// Staff (front desk) pages
import StaffCheckin from "./pages/staff/StaffCheckin";
import StaffWaitlist from "./pages/staff/StaffWaitlist";

// Kiosk page
import Kiosk from "./pages/Kiosk";

// Platform admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudios from "./pages/admin/AdminStudios";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
      <DemoProvider>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <DemoRoleBar />
                <Routes>
                  {/* ---- Demo landing page (role picker) ---- */}
                  <Route path="/" element={<Demo />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="/open-source" element={<OpenSource />} />

                  {/* ---- Student-facing routes ---- */}
                  <Route path="/home" element={<Index />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/events" element={<Studios />} />
                  <Route path="/events/:id" element={<StudioDetail />} />
                  <Route path="/instructors" element={<Instructors />} />
                  <Route path="/instructors/:id" element={<InstructorDetail />} />
                  <Route path="/on-demand" element={<OnDemand />} />

                  {/* ---- Auth routes ---- */}
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* ---- Authenticated member routes ---- */}
                  <Route path="/my-schedule" element={<MySchedule />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/account/notifications" element={<NotificationPreferences />} />

                  {/* ---- Platform admin routes (/admin) ---- */}
                  <Route path="/admin" element={<ProtectedRoute permission="platform.admin"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/studios" element={<ProtectedRoute permission="platform.manage_studios"><AdminStudios /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute permission="platform.manage_users"><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/billing" element={<ProtectedRoute permission="platform.manage_billing"><AdminBilling /></ProtectedRoute>} />
                  <Route path="/admin/feedback" element={<ProtectedRoute permission="platform.admin"><AdminFeedback /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute permission="platform.admin"><AdminSettings /></ProtectedRoute>} />

                  {/* ---- Studio management routes (/manage) ---- */}
                  <Route path="/manage" element={<ManageDashboard />} />
                  <Route path="/manage/schedule" element={<ScheduleManage />} />
                  <Route path="/manage/students" element={<StudentsManage />} />
                  <Route path="/manage/teachers" element={<TeachersManage />} />
                  <Route path="/manage/offerings" element={<OfferingsManage />} />
                  <Route path="/manage/financials" element={<FinancialsManage />} />
                  <Route path="/manage/reports" element={<ReportsManage />} />
                  <Route path="/manage/import" element={<ImportManage />} />
                  <Route path="/manage/settings" element={<SettingsManage />} />
                  <Route path="/manage/onboarding" element={<OnboardingManage />} />
                  <Route path="/manage/members/:id" element={<MemberDetailManage />} />
                  <Route path="/manage/promo-codes" element={<PromoCodesManage />} />
                  <Route path="/manage/events" element={<EventsManage />} />
                  <Route path="/manage/landing-pages" element={<LandingPagesManage />} />
                  <Route path="/manage/analytics" element={<AnalyticsHubManage />} />
                  <Route path="/manage/analytics/members" element={<MemberAnalyticsManage />} />
                  <Route path="/manage/analytics/sales" element={<SalesAnalyticsManage />} />
                  <Route path="/manage/analytics/financials" element={<FinancialAnalyticsManage />} />
                  <Route path="/manage/analytics/site" element={<SiteAnalyticsManage />} />
                  <Route path="/manage/connectors" element={<DataConnectorsManage />} />
                  <Route path="/manage/products" element={<ProductsManage />} />
                  <Route path="/manage/inventory" element={<InventoryManage />} />
                  <Route path="/manage/purchase-orders" element={<PurchaseOrdersManage />} />
                  <Route path="/manage/notification-settings" element={<NotificationSettingsManage />} />
                  <Route path="/manage/sms-inbox" element={<SmsInboxManage />} />
                  <Route path="/manage/utm-builder" element={<UtmBuilderManage />} />
                  <Route path="/manage/campaigns" element={<CampaignsManage />} />
                  <Route path="/manage/tasks" element={<TasksManage />} />
                  <Route path="/manage/on-demand" element={<OnDemandManage />} />
                  <Route path="/manage/feature-settings" element={<FeatureSettingsManage />} />
                  <Route path="/manage/audit-logs" element={<AuditLogsManage />} />
                  <Route path="/manage/data-dictionary" element={<DataDictionaryManage />} />
                  <Route path="/manage/definitions" element={<DefinitionsManage />} />

                  {/* ---- Instructor portal routes (/teach) ---- */}
                  <Route path="/teach" element={<TeachDashboard />} />
                  <Route path="/teach/schedule" element={<TeachSchedule />} />
                  <Route path="/teach/availability" element={<TeachAvailability />} />
                  <Route path="/teach/subs" element={<TeachSubs />} />
                  <Route path="/teach/earnings" element={<TeachEarnings />} />
                  <Route path="/teach/profile" element={<TeachProfile />} />

                  {/* ---- Staff (front desk) routes ---- */}
                  <Route path="/staff/checkin" element={<StaffCheckin />} />
                  <Route path="/staff/waitlist" element={<StaffWaitlist />} />

                  {/* ---- Kiosk mode ---- */}
                  <Route path="/kiosk/:studioId" element={<Kiosk />} />

                  {/* ---- Catch-all ---- */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </DemoProvider>
      </LocaleProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </AppErrorBoundary>
);

export default App;
