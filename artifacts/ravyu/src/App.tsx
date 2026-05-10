import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import ReviewsPage from "@/pages/reviews";
import AiGeneratorPage from "@/pages/ai-generator";
import BusinessProfilePage from "@/pages/business-profile";
import BusinessRequestsPage from "@/pages/business-requests";
import ReportsPage from "@/pages/reports";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import PublicBusinessPage from "@/pages/public-business";
import ReviewCollectionPage from "@/pages/review-collection";
import TrackedReviewPage from "@/pages/tracked-review";
import IndustryInsightsPage from "@/pages/industry-insights";
import PlansPage from "@/pages/plans";
import PricingPage from "@/pages/pricing";
import { AppLayout } from "@/components/layout/app-layout";

setAuthTokenGetter(() => localStorage.getItem("accessToken"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/b/:slug" component={PublicBusinessPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/review/:slug/:token" component={TrackedReviewPage} />
      <Route path="/review/:slug" component={ReviewCollectionPage} />
      <Route>
        {() => (
          <AppLayout>
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/reviews" component={ReviewsPage} />
              <Route path="/ai-generator" component={AiGeneratorPage} />
              <Route path="/business/profile" component={BusinessProfilePage} />
              <Route path="/business/requests" component={BusinessRequestsPage} />
              <Route path="/reports" component={ReportsPage} />
              <Route path="/analytics" component={AnalyticsPage} />
              <Route path="/industry-insights" component={IndustryInsightsPage} />
              <Route path="/plans" component={PlansPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
