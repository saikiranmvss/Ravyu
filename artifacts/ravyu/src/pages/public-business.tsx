import { useParams } from "wouter";
import { useGetPublicBusiness, getGetPublicBusinessQueryKey, useTrackPageView, useTrackReviewClick } from "@workspace/api-client-react";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Globe, Facebook, Instagram, Twitter, Linkedin, Clock } from "lucide-react";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function PublicBusinessPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const { data: biz, isLoading, isError } = useGetPublicBusiness(slug, {
    query: { queryKey: getGetPublicBusinessQueryKey(slug), enabled: !!slug },
  });
  const trackPageView = useTrackPageView();
  const trackReviewClick = useTrackReviewClick();

  useEffect(() => {
    if (slug) trackPageView.mutate({ data: { slug } } as never);
  }, [slug]);

  const handleReviewClick = () => {
    if (biz?.googleMapsUrl) {
      trackReviewClick.mutate({ data: { slug } } as never);
      window.open(biz.googleMapsUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 w-full" />
        <div className="max-w-3xl mx-auto p-6 space-y-4">
          <Skeleton className="h-16 w-64" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !biz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-xl font-bold mb-2">Business not found</h1>
          <p className="text-muted-foreground">This page doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const primary = biz.primaryColor ?? "#1e3a5f";
  const secondary = biz.secondaryColor ?? "#f59e0b";

  return (
    <div className="min-h-screen bg-background">
      {/* Cover */}
      <div
        className="h-40 md:h-56 w-full relative"
        style={{ background: biz.coverImageUrl ? `url(${biz.coverImageUrl}) center/cover` : `linear-gradient(135deg, ${primary}, ${secondary}40)` }}
      />

      <div className="max-w-3xl mx-auto px-4 -mt-12 pb-12 relative">
        {/* Logo + name */}
        <div className="flex items-end gap-4 mb-4">
          <div
            className="w-20 h-20 rounded-xl border-4 border-background shadow-lg flex items-center justify-center overflow-hidden"
            style={{ background: biz.logoUrl ? undefined : primary }}
          >
            {biz.logoUrl
              ? <img src={biz.logoUrl} alt={biz.businessName} className="w-full h-full object-cover" />
              : <Star className="w-8 h-8 text-white" />
            }
          </div>
          <div className="mb-1">
            <h1 className="text-2xl font-bold leading-tight">{biz.businessName}</h1>
            {biz.averageRating != null && (
              <div className="flex items-center gap-2">
                <StarDisplay rating={biz.averageRating} />
                <span className="text-sm text-muted-foreground">{biz.averageRating.toFixed(1)} ({biz.totalReviews ?? 0} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {biz.googleMapsUrl && (
          <Button
            onClick={handleReviewClick}
            className="w-full mb-6 font-semibold text-base py-5"
            style={{ background: secondary, color: primary }}
            data-testid="button-leave-review"
          >
            <Star className="w-4 h-4 mr-2 fill-current" /> Leave Us a Review on Google
          </Button>
        )}

        {/* Description */}
        {biz.description && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{biz.description}</p>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {biz.address && (
            <div className="flex gap-3 items-start bg-card border border-border rounded-lg px-4 py-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-sm">{[biz.address, biz.city, biz.state].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {biz.phone && (
            <a href={`tel:${biz.phone}`} className="flex gap-3 items-center bg-card border border-border rounded-lg px-4 py-3 hover:bg-muted/40 transition-colors">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{biz.phone}</span>
            </a>
          )}
          {biz.website && (
            <a href={biz.website} target="_blank" rel="noreferrer" className="flex gap-3 items-center bg-card border border-border rounded-lg px-4 py-3 hover:bg-muted/40 transition-colors">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{biz.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
        </div>

        {/* Social */}
        {(biz.facebookUrl || biz.instagramUrl || biz.twitterUrl || biz.linkedinUrl) && (
          <div className="flex gap-2 mb-6">
            {biz.facebookUrl && <a href={biz.facebookUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-border hover:bg-muted/40 transition-colors"><Facebook className="w-4 h-4" /></a>}
            {biz.instagramUrl && <a href={biz.instagramUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-border hover:bg-muted/40 transition-colors"><Instagram className="w-4 h-4" /></a>}
            {biz.twitterUrl && <a href={biz.twitterUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-border hover:bg-muted/40 transition-colors"><Twitter className="w-4 h-4" /></a>}
            {biz.linkedinUrl && <a href={biz.linkedinUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg border border-border hover:bg-muted/40 transition-colors"><Linkedin className="w-4 h-4" /></a>}
          </div>
        )}

        {/* Recent reviews */}
        {(biz.recentReviews?.length ?? 0) > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3">What customers say</h2>
            <div className="space-y-3">
              {biz.recentReviews!.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{r.author[0]}</div>
                    <div>
                      <p className="text-sm font-semibold leading-none">{r.author}</p>
                      <StarDisplay rating={r.rating} />
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Powered by Ravyu
      </footer>
    </div>
  );
}
