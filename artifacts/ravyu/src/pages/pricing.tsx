import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tier = { name: string; monthlyInr: number | null; features: string[] };
type IndustryPlans = { industry: string; tiers: Tier[] };

export default function PricingPage() {
  const [plans, setPlans] = useState<IndustryPlans[]>([]);
  useEffect(() => {
    void fetch("/api/public/pricing")
      .then((r) => r.json())
      .then((d: { plans: IndustryPlans[] }) => setPlans(d.plans ?? []))
      .catch(() => setPlans([]));
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(227,45%,10%)] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Industry plans for growth</h1>
          <p className="text-white/60">Ravyu tells you what to fix, why it matters, and what to do next.</p>
          <Link href="/signup"><Button className="bg-[hsl(40,93%,50%)] text-black">Start Free Trial</Button></Link>
        </div>
        {plans.map((industry) => (
          <section key={industry.industry} className="space-y-3">
            <h2 className="text-2xl font-semibold capitalize">{industry.industry}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {industry.tiers.map((tier) => (
                <Card key={`${industry.industry}-${tier.name}`} className="bg-white/5 border-white/10 text-white">
                  <CardHeader><CardTitle>{tier.name} {tier.monthlyInr ? `- ₹${tier.monthlyInr}/month` : "- Custom"}</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-white/80">
                      {tier.features.map((feature) => <li key={feature}>- {feature}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
