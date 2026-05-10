import { useState } from "react";
import { useGenerateContent, useGeneratePost } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Copy, Loader2, FileText, Image } from "lucide-react";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "google_business", label: "Google Business" },
];

const TONES = ["professional", "casual", "enthusiastic", "formal", "humorous"];

function ResultCard({ content, label }: { content: string; label: string }) {
  const copy = () => { navigator.clipboard.writeText(content); toast.success("Copied to clipboard"); };
  return (
    <div className="bg-muted rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={copy} data-testid="button-copy-result">
          <Copy className="w-3 h-3" /> Copy
        </Button>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

export default function AiGeneratorPage() {
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [contentType, setContentType] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [postResult, setPostResult] = useState<string | null>(null);

  const contentMutation = useGenerateContent();
  const postMutation = useGeneratePost();

  const handleGenerate = () => {
    if (!prompt.trim()) { toast.error("Enter a prompt"); return; }
    setResult(null);
    contentMutation.mutate(
      { data: { prompt, platform: platform as "instagram" | "facebook" | "twitter" | "linkedin" | "google_business", contentType, tone: tone as "professional" | "casual" | "enthusiastic" | "formal" | "humorous" } },
      {
        onSuccess: (data) => { setResult(data.content); toast.success("Content generated"); },
        onError: () => toast.error("Generation failed"),
      },
    );
  };

  const handleGeneratePost = () => {
    if (!reviewText.trim()) { toast.error("Paste a review first"); return; }
    setPostResult(null);
    postMutation.mutate(
      { data: { reviewText, platform: platform as "instagram" | "facebook" | "twitter" | "linkedin" | "google_business", tone: tone as "professional" | "casual" | "enthusiastic" | "formal" | "humorous" } },
      {
        onSuccess: (data) => { setPostResult(data.caption); toast.success("Post generated"); },
        onError: () => toast.error("Generation failed"),
      },
    );
  };

  const sharedControls = (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs">Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="mt-1" data-testid="select-platform"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Tone</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="mt-1" data-testid="select-tone"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TONES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">AI Generator</h1>
        <p className="text-muted-foreground text-sm">Generate social content with AI</p>
      </div>

      <Tabs defaultValue="custom">
        <TabsList>
          <TabsTrigger value="custom" data-testid="tab-custom">
            <FileText className="w-4 h-4 mr-2" /> Custom Prompt
          </TabsTrigger>
          <TabsTrigger value="review" data-testid="tab-review">
            <Sparkles className="w-4 h-4 mr-2" /> From Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Generate from custom prompt</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {sharedControls}
              <div>
                <Label className="text-xs">Content type</Label>
                <div className="flex gap-2 mt-1">
                  {(["text", "image"] as const).map((ct) => (
                    <Button
                      key={ct}
                      variant={contentType === ct ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContentType(ct)}
                      className="capitalize"
                      data-testid={`button-type-${ct}`}
                    >
                      {ct === "text" ? <FileText className="w-3 h-3 mr-1" /> : <Image className="w-3 h-3 mr-1" />}
                      {ct}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Your prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Write a post celebrating our 5-year anniversary..."
                  className="mt-1 min-h-24 resize-none"
                  data-testid="textarea-prompt"
                />
              </div>
              <Button onClick={handleGenerate} disabled={contentMutation.isPending} className="w-full" data-testid="button-generate">
                {contentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate
              </Button>
              {result && <ResultCard content={result} label="Generated Content" />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Generate from a review</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {sharedControls}
              <div>
                <Label className="text-xs">Paste a review</Label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste a customer review here..."
                  className="mt-1 min-h-24 resize-none"
                  data-testid="textarea-review"
                />
              </div>
              <Button onClick={handleGeneratePost} disabled={postMutation.isPending} className="w-full" data-testid="button-generate-post">
                {postMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Social Post
              </Button>
              {postResult && <ResultCard content={postResult} label={`${PLATFORMS.find((p) => p.value === platform)?.label ?? "Social"} Post`} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
