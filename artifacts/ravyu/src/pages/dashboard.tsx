import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Star, MessageSquare, Users, TrendingUp } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${s <= rating ? "fill-[hsl(40,93%,50%)] text-[hsl(40,93%,50%)]" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

const RATING_COLORS: Record<number, string> = {
  5: "hsl(160,84%,39%)",
  4: "hsl(40,93%,50%)",
  3: "hsl(40,80%,60%)",
  2: "hsl(20,80%,55%)",
  1: "hsl(0,84%,60%)",
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });

  const funnel = stats?.requestFunnel;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your reputation at a glance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: stats?.totalReviews ?? 0, icon: <MessageSquare className="w-4 h-4" />, color: "text-blue-500" },
          { label: "Avg Rating", value: stats?.averageRating?.toFixed(1) ?? "0.0", icon: <Star className="w-4 h-4" />, color: "text-amber-500" },
          { label: "Total Requests", value: stats?.totalRequests ?? 0, icon: <Users className="w-4 h-4" />, color: "text-purple-500" },
          { label: "Positive Reviews", value: stats?.positiveReviews ?? 0, icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <span className={kpi.color}>{kpi.icon}</span>
                <span className="text-xs font-medium uppercase tracking-wide">{kpi.label}</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tracking-tight" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s/g, "-")}`}>{kpi.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Rating distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.ratingDistribution ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <XAxis dataKey="rating" tickFormatter={(v) => `${v}★`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    formatter={(v: number) => [v, "Reviews"] as [number, string]}
                    labelFormatter={(l) => `${l} Stars`}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(stats?.ratingDistribution ?? []).map((entry) => (
                      <Cell key={entry.rating} fill={RATING_COLORS[entry.rating] ?? "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Request funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Request Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {(["pending", "sent", "opened", "completed"] as const).map((stage) => {
                  const count = funnel?.[stage] ?? 0;
                  const total = stats?.totalRequests ?? 1;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colors: Record<string, string> = {
                    pending: "bg-muted-foreground/40", sent: "bg-blue-500", opened: "bg-amber-500", completed: "bg-emerald-500",
                  };
                  return (
                    <div key={stage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize text-muted-foreground font-medium">{stage}</span>
                        <span className="font-bold" data-testid={`funnel-${stage}`}>{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${colors[stage]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent reviews */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (stats?.recentReviews?.length ?? 0) === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reviews yet. Go to Reviews to import some.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats!.recentReviews.map((review) => (
                <div key={review.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card" data-testid={`review-card-${review.id}`}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {review.author[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{review.author}</span>
                      <StarRating rating={review.rating} />
                      <Badge variant="outline" className="text-xs ml-auto shrink-0">{review.date}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{review.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
