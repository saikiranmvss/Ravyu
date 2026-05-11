import { useListWeeklyIndustryReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Sparkles } from "lucide-react";

export default function WeeklyReportsPage() {
  const { data, isPending } = useListWeeklyIndustryReports();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weekly owner reports</h1>
        <p className="text-sm text-muted-foreground">
          Saved snapshots from “Generate weekly report” on Industry Insights. Email / WhatsApp delivery can plug in here later.
        </p>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : (data?.reports?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No weekly reports yet. Open Industry Insights and generate your first report.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data!.reports.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Report #{r.id}
                  </CardTitle>
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.createdAt).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{r.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Top wins</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {(r.topWins ?? []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Attention areas</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {(r.attentionAreas ?? []).map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p>
                  <strong>Recommended action:</strong> {r.recommendedAction}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
