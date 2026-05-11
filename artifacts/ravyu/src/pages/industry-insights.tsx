import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetIndustryReportsQueryKey,
  useGenerateWeeklyIndustryReport,
  useGetIndustryReports,
  type GetIndustryReportsParams,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  Brain,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Plane,
  Hotel,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

function PhaseIcon({ industry }: { industry: string }) {
  const i = industry.toLowerCase();
  if (i === "healthcare") return <Stethoscope className="w-5 h-5 text-emerald-600" />;
  if (i === "hospitality") return <Hotel className="w-5 h-5 text-sky-600" />;
  if (i === "travel") return <Plane className="w-5 h-5 text-violet-600" />;
  if (i === "restaurant") return <UtensilsCrossed className="w-5 h-5 text-orange-600" />;
  return <Brain className="w-5 h-5 text-primary" />;
}

export default function IndustryInsightsPage() {
  const [windowDays, setWindowDays] = useState("30");
  const queryClient = useQueryClient();

  const industryParams = useMemo<GetIndustryReportsParams>(
    () => ({ window: Number(windowDays) as GetIndustryReportsParams["window"] }),
    [windowDays],
  );

  const { data, isPending: loading, isError } = useGetIndustryReports(industryParams);

  const weeklyMutation = useGenerateWeeklyIndustryReport({
    mutation: {
      onSuccess: () => {
        toast.success("Weekly report generated");
        void queryClient.invalidateQueries({ queryKey: getGetIndustryReportsQueryKey(industryParams) });
      },
      onError: () => toast.error("Failed to generate weekly report"),
    },
  });

  useEffect(() => {
    if (isError) toast.error("Unable to load insights");
  }, [isError]);

  const ind = (data?.industry ?? "other").toLowerCase();
  const phaseTitle =
    ind === "restaurant"
      ? "Restaurant — food & service intelligence"
      : ind === "healthcare"
        ? "Medical — patient experience & risk signals"
        : ind === "hospitality"
          ? "Hospitality — department sentiment"
          : ind === "travel"
            ? "Travel — tours, guides & early warning"
            : "Industry intelligence";

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-xl bg-muted p-2">
            <PhaseIcon industry={ind} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Industry Insights</h1>
            <p className="text-muted-foreground text-sm">{phaseTitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={windowDays} onValueChange={setWindowDays}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => weeklyMutation.mutate()} disabled={weeklyMutation.isPending}>
            {weeklyMutation.isPending ? "Generating..." : "Generate weekly report"}
          </Button>
        </div>
      </div>

      {/* Momentum strip */}
      {data?.momentum && (
        <Card className="border-border/80 bg-gradient-to-r from-muted/40 to-transparent">
          <CardContent className="py-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-sm">
              {data.momentum.negativeDeltaPercent != null && data.momentum.negativeDeltaPercent > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              )}
              <span>{data.momentum.summary}</span>
            </div>
            {data.momentum.negativeDeltaPercent != null && (
              <Badge variant="outline" className="w-fit">
                Negative mentions Δ {data.momentum.negativeDeltaPercent > 0 ? "+" : ""}
                {data.momentum.negativeDeltaPercent}% vs prior period
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This period — sentiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Positive: <strong>{data?.trend.positive ?? 0}</strong>
            </p>
            <p>
              Neutral: <strong>{data?.trend.neutral ?? 0}</strong>
            </p>
            <p>
              Negative: <strong>{data?.trend.negative ?? 0}</strong>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prior period — sentiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Positive: <strong>{data?.priorTrend?.positive ?? 0}</strong>
            </p>
            <p>
              Neutral: <strong>{data?.priorTrend?.neutral ?? 0}</strong>
            </p>
            <p>
              Negative: <strong>{data?.priorTrend?.negative ?? 0}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {(data?.aspectMomentum?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aspect momentum (negative mentions)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 pr-4">Aspect</th>
                  <th className="pb-2 pr-4">This window</th>
                  <th className="pb-2 pr-4">Prior window</th>
                  <th className="pb-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {(data!.aspectMomentum ?? []).slice(0, 8).map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 capitalize">{row.aspect.replace(/_/g, " ")}</td>
                    <td>{row.negativeCount}</td>
                    <td>{row.priorNegativeCount}</td>
                    <td>
                      {row.changePercent == null ? (
                        "—"
                      ) : (
                        <span className={row.changePercent > 10 ? "text-red-600 font-medium" : ""}>
                          {row.changePercent > 0 ? "+" : ""}
                          {row.changePercent}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Phase-specific */}
      {ind === "healthcare" && (data?.careTeamInsights?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Anonymized care-team mentions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground text-xs mb-2">
              Buckets are hashed labels — not verified clinician identities. Use for operational trends only.
            </p>
            {(data!.careTeamInsights ?? []).map((c) => (
              <div key={c.label} className="flex justify-between items-center rounded-md border p-2">
                <span className="font-mono text-xs">{c.label}</span>
                <span className="text-muted-foreground">
                  +{c.positives} / −{c.negatives} / ○{c.neutrals}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {ind === "hospitality" && data?.hospitalityTrendSummary && (
        <Card className="border-sky-500/30 bg-sky-500/5">
          <CardContent className="py-4 text-sm">{data.hospitalityTrendSummary}</CardContent>
        </Card>
      )}

      {ind === "travel" && data?.travelEarlyWarning && (
        <Card
          className={
            data.travelEarlyWarning.level === "elevated"
              ? "border-red-500/40 bg-red-500/5"
              : data.travelEarlyWarning.level === "watch"
                ? "border-amber-500/40 bg-amber-500/5"
                : ""
          }
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="w-4 h-4" /> Complaint early warning
              <Badge variant="outline">{data.travelEarlyWarning.level}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{data.travelEarlyWarning.summary}</p>
            {(data.travelEarlyWarning.factors?.length ?? 0) > 0 && (
              <ul className="list-disc pl-5 text-muted-foreground">
                {data.travelEarlyWarning.factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ind === "restaurant" ? "Top praised dishes / items" : "Top praised"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading &&
              (data?.topPraisedItems ?? []).slice(0, 5).map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <Badge>{item.pos}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ind === "restaurant" ? "Most complained dishes / items" : "Most complained"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading &&
              (data?.topComplainedItems ?? []).slice(0, 5).map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <Badge variant="destructive">{item.neg}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mixed sentiment zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!loading &&
              (data?.mixedItems ?? []).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">
                    +{item.pos} / −{item.neg}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {(data?.aspectBreakdown?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {ind === "hospitality" ? "Department-style breakdown" : "Aspect breakdown"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {(data!.aspectBreakdown ?? []).map((a) => (
              <div key={a.aspect} className="rounded-lg border p-3">
                <p className="font-medium capitalize mb-2">{a.aspect.replace(/_/g, " ")}</p>
                <div className="flex gap-3 text-muted-foreground">
                  <span className="text-emerald-600">+{a.positive}</span>
                  <span>○{a.neutral}</span>
                  <span className="text-red-600">−{a.negative}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" /> AI action suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.actionSuggestions ?? []).map((s, i) => (
            <div key={i} className="text-sm rounded border p-3 bg-muted/20">
              {s}
            </div>
          ))}
          {!loading && (data?.actionSuggestions?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">No suggestions yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Risk-style alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.riskAlerts ?? []).map((alert, i) => (
              <div key={i} className="rounded border p-2 text-sm">
                <div className="font-medium">
                  {alert.aspect} <Badge variant="outline">{alert.severity}</Badge>
                </div>
                <div className="text-muted-foreground">{alert.reason ?? "Repeated negative pattern"}</div>
              </div>
            ))}
            {!loading && (data?.riskAlerts?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No active alerts.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Latest weekly snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data?.weeklyReport ? (
              <>
                <p>{data.weeklyReport.summary}</p>
                <p>
                  <strong>Recommended action:</strong> {data.weeklyReport.recommendedAction}
                </p>
                <p className="text-muted-foreground">Generated: {new Date(data.weeklyReport.createdAt).toLocaleString()}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No weekly report yet — generate one above or visit Weekly reports in the sidebar.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
