import { useState } from "react";
import { useLocation } from "wouter";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Star, ChevronRight, Loader2, Building2 } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "single", label: "Single Location", desc: "One business location" },
  { value: "multiple", label: "Multiple Locations", desc: "2-10 locations" },
  { value: "franchise", label: "Franchise", desc: "Franchise system" },
  { value: "agency", label: "Agency", desc: "Managing for clients" },
];

const INDUSTRIES = [
  "restaurant", "healthcare", "hospitality", "retail", "real_estate", "professional", "education", "other",
];

const CHALLENGES = [
  { value: "more_reviews", label: "Get more reviews" },
  { value: "time_resources", label: "Time & resources" },
  { value: "monitoring", label: "Monitoring reviews" },
  { value: "negative_reviews", label: "Handling negative reviews" },
  { value: "ratings", label: "Improving ratings" },
  { value: "trends", label: "Tracking trends" },
  { value: "other", label: "Other challenges" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [industry, setIndustry] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const mutation = useCompleteOnboarding();

  const toggleChallenge = (val: string) => {
    setChallenges((prev) => prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]);
  };

  const handleFinish = () => {
    if (!businessType || !industry || challenges.length === 0) {
      toast.error("Please complete all fields");
      return;
    }
    mutation.mutate(
      { data: { phone, company, businessType: businessType as "single" | "multiple" | "franchise" | "agency", industry: industry as "restaurant" | "healthcare" | "hospitality" | "retail" | "real_estate" | "professional" | "education" | "other", challenges } },
      {
        onSuccess: () => {
          toast.success("Profile complete! Welcome to Ravyu.");
          setLocation("/dashboard");
        },
        onError: () => toast.error("Something went wrong. Please try again."),
      },
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(227,45%,10%)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[hsl(40,93%,50%)] flex items-center justify-center">
            <Star className="w-4 h-4 text-[hsl(227,45%,12%)]" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">Ravyu</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-[hsl(40,93%,50%)]" : "bg-white/15"}`} />
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Let's set up your profile</h2>
                <p className="text-white/50 text-sm">Hello, {user?.username}. Tell us a bit about yourself.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="bg-white/10 border-white/20 text-white placeholder:text-white/30 mt-1" data-testid="input-phone" />
                </div>
                <div>
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Company name</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Co." className="bg-white/10 border-white/20 text-white placeholder:text-white/30 mt-1" data-testid="input-company" />
                </div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] font-semibold" data-testid="button-next">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">What type of business?</h2>
                <p className="text-white/50 text-sm">This helps us tailor your experience.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    onClick={() => setBusinessType(bt.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${businessType === bt.value ? "border-[hsl(40,93%,50%)] bg-[hsl(40,93%,50%)]/10" : "border-white/15 hover:border-white/30"}`}
                    data-testid={`business-type-${bt.value}`}
                  >
                    <Building2 className={`w-5 h-5 mb-2 ${businessType === bt.value ? "text-[hsl(40,93%,55%)]" : "text-white/40"}`} />
                    <div className="font-semibold text-sm text-white">{bt.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{bt.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">Back</Button>
                <Button onClick={() => businessType && setStep(3)} className="flex-1 bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] font-semibold" disabled={!businessType} data-testid="button-next">Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">What's your industry?</h2>
                <p className="text-white/50 text-sm">Select the one that best fits your business.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className={`py-2.5 px-3 rounded-lg border text-sm capitalize transition-all ${industry === ind ? "border-[hsl(40,93%,50%)] bg-[hsl(40,93%,50%)]/10 text-[hsl(40,93%,60%)]" : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"}`}
                    data-testid={`industry-${ind}`}
                  >
                    {ind.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">Back</Button>
                <Button onClick={() => industry && setStep(4)} className="flex-1 bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] font-semibold" disabled={!industry} data-testid="button-next">Continue</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">What are your challenges?</h2>
                <p className="text-white/50 text-sm">Select all that apply — we'll focus on solving these.</p>
              </div>
              <div className="space-y-2.5">
                {CHALLENGES.map((ch) => (
                  <label key={ch.value} className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
                      checked={challenges.includes(ch.value)}
                      onCheckedChange={() => toggleChallenge(ch.value)}
                      className="border-white/30 data-[state=checked]:bg-[hsl(40,93%,50%)] data-[state=checked]:border-[hsl(40,93%,50%)]"
                      data-testid={`challenge-${ch.value}`}
                    />
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors">{ch.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">Back</Button>
                <Button onClick={handleFinish} className="flex-1 bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] font-semibold" disabled={mutation.isPending || challenges.length === 0} data-testid="button-finish">
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Complete setup
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
