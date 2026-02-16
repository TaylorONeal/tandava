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
import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";

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

const Index = lazy(() => import("./pages/Index"));
const Schedule = lazy(() => import("./pages/Schedule"));
const MySchedule = lazy(() => import("./pages/MySchedule"));
const Community = lazy(() => import("./pages/Community"));
const Account = lazy(() => import("./pages/Account"));
const Studios = lazy(() => import("./pages/Studios"));
const StudioDetail = lazy(() => import("./pages/StudioDetail"));
const Instructors = lazy(() => import("./pages/Instructors"));
const InstructorDetail = lazy(() => import("./pages/InstructorDetail"));
const OnDemand = lazy(() => import("./pages/OnDemand"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Demo = lazy(() => import("./pages/Demo"));
const OpenSource = lazy(() => import("./pages/OpenSource"));

const ManageDashboard = lazy(() => import("./pages/manage/Dashboard"));
const ScheduleManage = lazy(() => import("./pages/manage/ScheduleManage"));
const StudentsManage = lazy(() => import("./pages/manage/Students"));
const TeachersManage = lazy(() => import("./pages/manage/Teachers"));
const OfferingsManage = lazy(() => import("./pages/manage/Offerings"));
const FinancialsManage = lazy(() => import("./pages/manage/Financials"));
const ReportsManage = lazy(() => import("./pages/manage/Reports"));
const ImportManage = lazy(() => import("./pages/manage/Import"));
const SettingsManage = lazy(() => import("./pages/manage/Settings"));
const OnboardingManage = lazy(() => import("./pages/manage/Onboarding"));
const MemberDetailManage = lazy(() => import("./pages/manage/MemberDetail"));
const PromoCodesManage = lazy(() => import("./pages/manage/PromoCodes"));
const EventsManage = lazy(() => import("./pages/manage/Events"));
const LandingPagesManage = lazy(() => import("./pages/manage/LandingPages"));
const AnalyticsHubManage = lazy(() => import("./pages/manage/AnalyticsHub"));
const MemberAnalyticsManage = lazy(() => import("./pages/manage/MemberAnalytics"));
const SalesAnalyticsManage = lazy(() => import("./pages/manage/SalesAnalytics"));
const FinancialAnalyticsManage = lazy(() => import("./pages/manage/FinancialAnalytics"));
const SiteAnalyticsManage = lazy(() => import("./pages/manage/SiteAnalytics"));
const DataConnectorsManage = lazy(() => import("./pages/manage/DataConnectors"));
const ProductsManage = lazy(() => import("./pages/manage/Products"));
const InventoryManage = lazy(() => import("./pages/manage/Inventory"));
const PurchaseOrdersManage = lazy(() => import("./pages/manage/PurchaseOrders"));
const NotificationSettingsManage = lazy(() => import("./pages/manage/NotificationSettings"));
const SmsInboxManage = lazy(() => import("./pages/manage/SmsInbox"));
const UtmBuilderManage = lazy(() => import("./pages/manage/UtmBuilder"));
const CampaignsManage = lazy(() => import("./pages/manage/Campaigns"));
const TasksManage = lazy(() => import("./pages/manage/Tasks"));
const OnDemandManage = lazy(() => import("./pages/manage/OnDemand"));
const FeatureSettingsManage = lazy(() => import("./pages/manage/FeatureSettings"));
const AuditLogsManage = lazy(() => import("./pages/manage/AuditLogs"));
const DataDictionaryManage = lazy(() => import("./pages/manage/DataDictionary"));
const DefinitionsManage = lazy(() => import("./pages/manage/Definitions"));

const NotificationPreferences = lazy(() => import("./pages/account/NotificationPreferences"));

const TeachDashboard = lazy(() => import("./pages/teach/Dashboard"));
const TeachSchedule = lazy(() => import("./pages/teach/Schedule"));
const TeachSubs = lazy(() => import("./pages/teach/Subs"));
const TeachEarnings = lazy(() => import("./pages/teach/Earnings"));
const TeachAvailability = lazy(() => import("./pages/teach/Availability"));
const TeachProfile = lazy(() => import("./pages/teach/Profile"));

const StaffCheckin = lazy(() => import("./pages/staff/StaffCheckin"));
const StaffWaitlist = lazy(() => import("./pages/staff/StaffWaitlist"));

const Kiosk = lazy(() => import("./pages/Kiosk"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminStudios = lazy(() => import("./pages/admin/AdminStudios"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const AdminFeedback = lazy(() => import("./pages/admin/AdminFeedback"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient();

const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

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
                <Suspense fallback={<RouteLoadingFallback />}>
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
                </Suspense>
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
