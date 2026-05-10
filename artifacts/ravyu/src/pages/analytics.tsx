import { useGetAnalytics, getGetAnalyticsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, MousePointerClick, TrendingUp, BarChart3, ExternalLink } from "lucide-react";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useGetAnalytics({ query: { queryKey: getGetAnalyticsQueryKey() } });

  const kpis = [
    { label: "Page Views", value: analytics?.pageViews ?? 0, icon: <Eye className="w-4 h-4" />, color: "text-blue-500" },
    { label: "Review Clicks", value: analytics?.reviewClicks ?? 0, icon: <MousePointerClick className="w-4 h-4" />, color: "text-amber-500" },
    { label: "Conversion Rate", value: analytics?.conversionRate != null ? `${analytics.conversionRate.toFixed(1)}%` : "0%", icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-500" },
    { label: "Public URL", value: analytics?.publicUrl ? "Live" : "Not set", icon: <ExternalLink className="w-4 h-4" />, color: "text-purple-500" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Analytics</h1>
        <p className="text-muted-foreground text-sm">Track your public page performance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)
          : kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <span className={kpi.color}>{kpi.icon}</span>
                  <span className="text-xs font-medium uppercase tracking-wide">{kpi.label}</span>
                </div>
                <p className="text-3xl font-bold tracking-tight" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, "-")}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Analytics summary */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Performance Summary</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{analytics?.pageViews ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Page Views</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <MousePointerClick className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold">{analytics?.reviewClicks ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Review Clicks</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-2xl font-bold">{analytics?.conversionRate?.toFixed(1) ?? 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Conversion Rate</p>
                </div>
              </div>

              {analytics?.publicUrl && (
                <div className="border border-border rounded-lg p-4 flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Your public business page</p>
                    <a href={analytics.publicUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">{analytics.publicUrl}</a>
                  </div>
                </div>
              )}

              {!analytics?.publicUrl && !isLoading && (
                <div className="text-center py-6 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium mb-1">No public page yet</p>
                  <p className="text-xs">Set up your Business Profile to start tracking analytics</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
