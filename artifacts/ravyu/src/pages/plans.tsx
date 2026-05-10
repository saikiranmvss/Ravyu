import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tier = { name: string; monthlyInr: number | null; features: string[]; pricingType?: string };
type IndustryPlans = { industry: string; tiers: Tier[] };

export default function PlansPage() {
  const [plans, setPlans] = useState<IndustryPlans[]>([]);

  useEffect(() => {
    void fetch("/api/public/pricing")
      .then((r) => r.json())
      .then((data: { plans: IndustryPlans[] }) => setPlans(data.plans ?? []))
      .catch(() => setPlans([]));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
        <p className="text-sm text-muted-foreground">Internal + in-product pricing placeholders by industry.</p>
      </div>
      <div className="space-y-6">
        {plans.map((plan) => (
          <div key={plan.industry}>
            <h2 className="text-lg font-semibold capitalize mb-3">{plan.industry}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plan.tiers.map((tier) => (
                <Card key={`${plan.industry}-${tier.name}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{tier.name}</span>
                      <Badge>{tier.monthlyInr ? `₹${tier.monthlyInr}/mo` : "Custom"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      {tier.features.map((f) => (
                        <li key={f}>- {f}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
