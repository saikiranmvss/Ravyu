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
import { AlertTriangle, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Industry Insights</h1>
          <p className="text-muted-foreground text-sm">
            Actionable intelligence for {data?.industry ?? "your"} business.
          </p>
        </div>
        <div className="flex gap-2">
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
            {weeklyMutation.isPending ? "Generating..." : "Generate Weekly Report"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Sentiment Trend</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Positive: <strong>{data?.trend.positive ?? 0}</strong></p>
            <p>Neutral: <strong>{data?.trend.neutral ?? 0}</strong></p>
            <p>Negative: <strong>{data?.trend.negative ?? 0}</strong></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Praised Items</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.topPraisedItems ?? []).slice(0, 5).map((item) => (
              <div key={item.name} className="flex justify-between text-sm"><span>{item.name}</span><Badge>{item.pos}</Badge></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Most Complained Items</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.topComplainedItems ?? []).slice(0, 5).map((item) => (
              <div key={item.name} className="flex justify-between text-sm"><span>{item.name}</span><Badge variant="destructive">{item.neg}</Badge></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Brain className="w-4 h-4" /> AI Action Suggestions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data?.actionSuggestions ?? []).map((s, i) => (
            <div key={i} className="text-sm rounded border p-3 bg-muted/20">{s}</div>
          ))}
          {!loading && (data?.actionSuggestions?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No suggestions yet.</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Mixed Sentiment Warning Zone</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.mixedItems ?? []).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-muted-foreground">+{item.pos} / -{item.neg}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Risk Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(data?.riskAlerts ?? []).map((alert, i) => (
              <div key={i} className="rounded border p-2 text-sm">
                <div className="font-medium">{alert.aspect} <Badge variant="outline">{alert.severity}</Badge></div>
                <div className="text-muted-foreground">{alert.reason ?? "Repeated negative pattern"}</div>
              </div>
            ))}
            {!loading && (data?.riskAlerts?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No active alerts.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> Latest Weekly Owner Report</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data?.weeklyReport ? (
            <>
              <p>{data.weeklyReport.summary}</p>
              <p><strong>Recommended action:</strong> {data.weeklyReport.recommendedAction}</p>
              <p className="text-muted-foreground">Generated: {new Date(data.weeklyReport.createdAt).toLocaleString()}</p>
            </>
          ) : (
            <p className="text-muted-foreground">No weekly report generated yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
