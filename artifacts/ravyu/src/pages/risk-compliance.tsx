import { useGetIndustryReports, GetIndustryReportsWindow } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RiskCompliancePage() {
  const { data, isPending } = useGetIndustryReports({ window: GetIndustryReportsWindow.NUMBER_30 });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Risk & compliance</h1>
        <p className="text-sm text-muted-foreground">
          High-severity signals and safety-related language from your reviews (last 30 days). Not a substitute for clinical or legal advice.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Healthcare & sensitive industries
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Care-team labels elsewhere in the product are <strong>anonymized hashes</strong> of explicit “Dr./Doctor” mentions in text — not verified identities.
            Use this dashboard for operational awareness, not workforce performance reviews tied to individuals.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Active risk-style alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : (data?.riskAlerts?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No elevated alerts in this window.</p>
          ) : (
            data!.riskAlerts.map((a, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium capitalize">{a.aspect.replace(/_/g, " ")}</span>
                  <Badge variant={a.severity === "high" ? "destructive" : "secondary"}>{a.severity}</Badge>
                </div>
                <p className="text-muted-foreground">{a.reason ?? "Pattern flagged for review."}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
