import { useParams } from "wouter";
import { useGetTrackedReviewLink, getGetTrackedReviewLinkQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, ExternalLink, CheckCircle2 } from "lucide-react";

export default function TrackedReviewPage() {
  const params = useParams<{ slug: string; token: string }>();
  const slug = params.slug ?? "";
  const token = params.token ?? "";

  const { data, isLoading, isError } = useGetTrackedReviewLink(slug, token, {
    query: { queryKey: getGetTrackedReviewLinkQueryKey(slug, token), enabled: !!slug && !!token },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-xl font-bold mb-2">Invalid link</h1>
          <p className="text-muted-foreground text-sm">This review request link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const primary = data.primaryColor ?? "#1e3a5f";
  const secondary = "#f59e0b";
  const customerName = data.customerName;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <div
          className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center overflow-hidden shadow-lg"
          style={{ background: data.logoUrl ? undefined : primary }}
        >
          {data.logoUrl
            ? <img src={data.logoUrl} alt={data.businessName} className="w-full h-full object-cover" />
            : <Star className="w-8 h-8 text-white" />
          }
        </div>

        <div>
          <h1 className="text-2xl font-bold">{data.businessName}</h1>
          {customerName && <p className="text-muted-foreground text-sm mt-1">Hi {customerName}, thanks for choosing us!</p>}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold mb-1">Share your experience</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              It only takes 30 seconds and means the world to us. Your review helps our business grow.
            </p>
          </div>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-7 h-7 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <Button
            className="w-full font-semibold py-5 text-base"
            style={{ background: secondary, color: primary }}
            onClick={() => data.googleReviewUrl && window.open(data.googleReviewUrl, "_blank", "noopener,noreferrer")}
            disabled={!data.googleReviewUrl}
            data-testid="button-review-google"
          >
            <Star className="w-4 h-4 mr-2 fill-current" />
            Review on Google
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">Powered by Ravyu</p>
      </div>
    </div>
  );
}
