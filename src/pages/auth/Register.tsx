import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type RegistrationStep = "info" | "complete";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<RegistrationStep>("info");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: searchParams.get("email") || "",
    password: "",
    agreeToTerms: false,
    marketingConsent: false,
  });

  // Check if form is valid for quick validation
  const isFormValid = formData.firstName && formData.lastName &&
    formData.email && formData.password.length >= 8 && formData.agreeToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and waiver to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate registration
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsLoading(false);
    setStep("complete");
  };

  // Success screen - mobile-optimized with clear next actions
  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-accent/20">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Success animation container */}
          <div className="relative">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-10 w-10 text-primary animate-in zoom-in-50 duration-300" />
            </div>
            <Sparkles className="absolute top-0 right-1/3 h-5 w-5 text-primary/60 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Welcome, {formData.firstName}!</h1>
            <p className="text-muted-foreground">
              Your account is ready. Let's find your first class.
            </p>
          </div>

          {/* Quick actions - large touch targets for mobile */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => navigate("/schedule")}
              className="w-full h-14 text-lg"
              size="lg"
            >
              Browse Classes
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/account")}
              className="w-full h-12"
            >
              Complete Your Profile
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Go to Home
            </Button>
          </div>

          {/* First-time member benefits hint */}
          <div className="pt-4 text-sm text-muted-foreground">
            <p>New members get special intro pricing on classes and memberships.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Welcome to Tandava!",
      description: "Your account has been created with Google.",
    });
    navigate("/");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-accent to-primary/5 p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <span className="text-4xl font-bold text-primary-foreground">T</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Begin Your Journey</h2>
          <p className="text-muted-foreground text-lg">
            Join our community of practitioners and discover the transformative power of yoga.
          </p>
        </div>
      </div>

      {/* Right side - Form (mobile-optimized) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-5">
          {/* Logo - smaller on mobile */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg sm:text-xl font-bold text-primary-foreground">T</span>
              </div>
              <span className="text-xl sm:text-2xl font-semibold tracking-tight">Tandava</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              Start your yoga journey today
            </p>
          </div>

          {/* Form - larger touch targets for mobile */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields - stack on very small screens */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="Sarah"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="pl-10 h-12 text-base"
                    autoComplete="given-name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Chen"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="h-12 text-base"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12 text-base"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-12 h-12 text-base"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground touch-manipulation"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* Password strength hint */}
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  formData.password.length === 0 ? "bg-muted" :
                  formData.password.length < 8 ? "bg-destructive" :
                  formData.password.length < 12 ? "bg-warning" : "bg-primary"
                )} />
                <span className="text-xs text-muted-foreground">
                  {formData.password.length === 0 ? "8+ characters" :
                   formData.password.length < 8 ? `${8 - formData.password.length} more needed` :
                   "Strong"}
                </span>
              </div>
            </div>

            {/* Checkboxes - larger tap areas */}
            <div className="space-y-2 pt-2">
              <label className="flex items-start gap-3 p-3 -mx-3 rounded-xl hover:bg-muted/50 cursor-pointer touch-manipulation">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreeToTerms: checked as boolean })
                  }
                  className="mt-0.5 h-5 w-5"
                />
                <span className="text-sm leading-tight">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/waiver" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    Studio Waiver
                  </Link>
                </span>
              </label>
              <label className="flex items-start gap-3 p-3 -mx-3 rounded-xl hover:bg-muted/50 cursor-pointer touch-manipulation">
                <Checkbox
                  id="marketing"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, marketingConsent: checked as boolean })
                  }
                  className="mt-0.5 h-5 w-5"
                />
                <span className="text-sm leading-tight">
                  Send me updates about classes, workshops, and special offers
                </span>
              </label>
            </div>

            {/* Submit - large touch target */}
            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold"
              size="lg"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative py-2">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or continue with
            </span>
          </div>

          {/* Social signup - larger buttons for mobile */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full h-12"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button variant="outline" disabled className="w-full h-12">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple
            </Button>
          </div>

          {/* Login link - larger tap area */}
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
            </p>
            <Link
              to="/auth/login"
              className="inline-block mt-1 px-4 py-2 text-primary hover:underline font-medium touch-manipulation"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;