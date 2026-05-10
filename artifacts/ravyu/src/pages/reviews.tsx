import { useState } from "react";
import { useGetReviews, getGetReviewsQueryKey, useScrapeReviews, useGenerateReply, useGeneratePost, useDeleteReview } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star, Search, Download, Sparkles, Share2, Trash2, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function ScrapeModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [mapsUrl, setMapsUrl] = useState("");
  const [maxReviews, setMaxReviews] = useState("50");
  const mutation = useScrapeReviews();

  const handleScrape = () => {
    if (!mapsUrl) { toast.error("Enter a Google Maps URL"); return; }
    mutation.mutate(
      { data: { mapsUrl, maxReviews: Number(maxReviews) } },
      {
        onSuccess: (data) => {
          toast.success(`Imported ${data.imported} reviews`);
          setOpen(false);
          onSuccess();
        },
        onError: () => toast.error("Scrape failed. Check the URL and try again."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-scrape">
          <Download className="w-4 h-4 mr-2" /> Import Reviews
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Import Google Reviews</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Google Maps URL</Label>
            <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://google.com/maps/place/..." className="mt-1" data-testid="input-maps-url" />
          </div>
          <div>
            <Label>Max reviews to import</Label>
            <Select value={maxReviews} onValueChange={setMaxReviews}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["25", "50", "100", "200", "500"].map((v) => <SelectItem key={v} value={v}>{v} reviews</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleScrape} disabled={mutation.isPending} className="w-full" data-testid="button-import">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {mutation.isPending ? "Importing..." : "Import Reviews"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewCard({ review, onDelete }: { review: { id: number; author: string; rating: number; text: string; date: string }; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [postText, setPostText] = useState("");
  const [tone, setTone] = useState("professional");
  const replyMutation = useGenerateReply();
  const postMutation = useGeneratePost();
  const deleteMutation = useDeleteReview();

  const handleReply = () => {
    replyMutation.mutate(
      { data: { reviewText: review.text, rating: review.rating, author: review.author, tone: tone as "professional" | "casual" | "enthusiastic" | "formal" | "humorous" } },
      {
        onSuccess: (data) => { setReplyText(data.reply); toast.success("Reply generated"); },
        onError: () => toast.error("Failed to generate reply"),
      },
    );
  };

  const handlePost = () => {
    postMutation.mutate(
      { data: { reviewText: review.text, platform: "instagram", tone: tone as "professional" | "casual" | "enthusiastic" | "formal" | "humorous" } },
      {
        onSuccess: (data) => { setPostText(data.caption); toast.success("Post generated"); },
        onError: () => toast.error("Failed to generate post"),
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: review.id } as never, {
      onSuccess: () => { toast.success("Review deleted"); onDelete(); },
    });
  };

  const sentimentColor = review.rating >= 4 ? "text-emerald-500" : review.rating === 3 ? "text-amber-500" : "text-red-500";

  return (
    <Card data-testid={`review-card-${review.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {review.author[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{review.author}</span>
              <StarRating rating={review.rating} />
              <span className={`text-xs font-medium ${sentimentColor}`}>{review.rating >= 4 ? "Positive" : review.rating === 3 ? "Neutral" : "Negative"}</span>
              <span className="text-xs text-muted-foreground ml-auto">{review.date}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-3">{review.text}</p>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["professional", "casual", "enthusiastic", "formal", "humorous"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleReply} disabled={replyMutation.isPending} data-testid={`button-reply-${review.id}`}>
                {replyMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                AI Reply
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handlePost} disabled={postMutation.isPending} data-testid={`button-post-${review.id}`}>
                {postMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Share2 className="w-3 h-3 mr-1" />}
                Social Post
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive ml-auto" onClick={handleDelete} disabled={deleteMutation.isPending} data-testid={`button-delete-${review.id}`}>
                <Trash2 className="w-3 h-3" />
              </Button>
              {(replyText || postText) && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              )}
            </div>

            {expanded && (
              <div className="mt-3 space-y-3">
                {replyText && (
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Reply</span>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { navigator.clipboard.writeText(replyText); toast.success("Copied!"); }}>Copy</Button>
                    </div>
                    <p className="text-sm">{replyText}</p>
                  </div>
                )}
                {postText && (
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Social Post</span>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { navigator.clipboard.writeText(postText); toast.success("Copied!"); }}>Copy</Button>
                    </div>
                    <p className="text-sm">{postText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useGetReviews(
    { search: search || undefined, rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined },
    { query: { queryKey: getGetReviewsQueryKey({ search: search || undefined, rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined }) } },
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetReviewsQueryKey() });
    refetch();
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Reviews</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} reviews stored</p>
        </div>
        <ScrapeModal onSuccess={refresh} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-36" data-testid="select-rating">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} stars</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={refresh} title="Refresh" data-testid="button-refresh">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : (data?.reviews?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium mb-1">No reviews yet</p>
          <p className="text-sm">Click "Import Reviews" to scrape from Google Maps.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data!.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onDelete={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
