import { useGetReports, getGetReportsQueryKey, useGetIndustryReports, GetIndustryReportsWindow } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Star, BarChart3, ThumbsUp, ThumbsDown, Minus } from "lucide-react";

const RATING_COLORS: Record<number, string> = {
  5: "hsl(160,84%,39%)",
  4: "hsl(40,93%,50%)",
  3: "hsl(40,80%,60%)",
  2: "hsl(20,80%,55%)",
  1: "hsl(0,84%,60%)",
};

export default function ReportsPage() {
  const { data: report, isLoading } = useGetReports({ query: { queryKey: getGetReportsQueryKey() } });
  const { data: industryReport } = useGetIndustryReports({ window: GetIndustryReportsWindow.NUMBER_30 });
  const topAuthors = (report as { topAuthors?: Array<{ author: string; count: number }> } | undefined)?.topAuthors ?? [];

  const total = report?.totalReviews ?? 0;
  const positivePercent = total > 0 ? Math.round(((report?.positiveCount ?? 0) / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round(((report?.negativeCount ?? 0) / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round(((report?.neutralCount ?? 0) / total) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Reports</h1>
        <p className="text-muted-foreground text-sm">Performance overview and review analysis</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)
          : [
            { label: "Total Reviews", value: report?.totalReviews ?? 0, icon: <BarChart3 className="w-4 h-4" />, color: "text-blue-500" },
            { label: "Avg Rating", value: report?.averageRating?.toFixed(1) ?? "—", icon: <Star className="w-4 h-4" />, color: "text-amber-500" },
            { label: "Positive", value: report?.positiveCount ?? 0, icon: <ThumbsUp className="w-4 h-4" />, color: "text-emerald-500" },
            { label: "Last 7 Days", value: report?.last7DaysCount ?? 0, icon: <BarChart3 className="w-4 h-4" />, color: "text-purple-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <span className={s.color}>{s.icon}</span>
                  <span className="text-xs font-medium uppercase tracking-wide">{s.label}</span>
                </div>
                <p className="text-3xl font-bold tracking-tight" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rating distribution chart */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Rating Distribution</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-44 w-full" /> : (report?.ratingDistribution?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={report!.ratingDistribution} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <XAxis dataKey="rating" tickFormatter={(v: number) => `${v}★`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    formatter={(v: number) => [v, "Reviews"] as [number, string]}
                    labelFormatter={(l: number) => `${l} Stars`}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {report!.ratingDistribution.map((entry) => (
                      <Cell key={entry.rating} fill={RATING_COLORS[entry.rating] ?? "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44 text-muted-foreground">
                <div className="text-center">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Import reviews to see distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sentiment breakdown */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Sentiment Breakdown</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-44 w-full" /> : (
              <div className="space-y-4 pt-2">
                {[
                  { label: "Positive (4-5 ★)", count: report?.positiveCount ?? 0, pct: positivePercent, color: "bg-emerald-500", icon: <ThumbsUp className="w-4 h-4 text-emerald-500" /> },
                  { label: "Neutral (3 ★)", count: report?.neutralCount ?? 0, pct: neutralPercent, color: "bg-amber-500", icon: <Minus className="w-4 h-4 text-amber-500" /> },
                  { label: "Negative (1-2 ★)", count: report?.negativeCount ?? 0, pct: negativePercent, color: "bg-red-500", icon: <ThumbsDown className="w-4 h-4 text-red-500" /> },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        {s.icon}
                        <span className="font-medium">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold" data-testid={`sentiment-${s.label.split(" ")[0].toLowerCase()}`}>{s.count}</span>
                        <span className="text-muted-foreground">{s.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${s.color}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top authors */}
      {topAuthors.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top Reviewers</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topAuthors.map((author) => (
                <div key={author.author} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {author.author[0]}
                    </div>
                    <span className="text-sm font-medium">{author.author}</span>
                  </div>
                  <Badge variant="secondary">{author.count} reviews</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Industry Action Layer</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">What to fix next based on aspect-level patterns.</p>
          {(industryReport?.actionSuggestions ?? []).slice(0, 3).map((item) => (
            <div key={item} className="rounded-md border p-3 text-sm">{item}</div>
          ))}
          {(industryReport?.topComplainedItems ?? []).slice(0, 3).map((item) => (
            <div key={item.name} className="text-sm flex justify-between">
              <span>{item.name}</span><Badge variant="destructive">{item.neg}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
