import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, BarChart3, Users, CheckCircle2, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(227,45%,10%)] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(40,93%,50%)] flex items-center justify-center">
            <Star className="w-4 h-4 text-[hsl(227,45%,12%)]" />
          </div>
          <span className="font-bold text-xl tracking-tight">Ravyu</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" data-testid="nav-login">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] hover:bg-[hsl(40,93%,45%)] font-semibold" data-testid="nav-signup">
              Get started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-20 pb-24 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(40,93%,50%)]/10 border border-[hsl(40,93%,50%)]/30 text-[hsl(40,93%,65%)] text-sm font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI-powered review management
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Your reputation is your
          <span className="text-[hsl(40,93%,50%)]"> most valuable asset</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Import Google reviews, reply with AI, generate social content, and run review-request campaigns — all from one command center.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup">
            <Button size="lg" className="bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] hover:bg-[hsl(40,93%,45%)] font-semibold px-8" data-testid="hero-cta">
              Start for free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" data-testid="hero-login">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Star className="w-5 h-5" />, title: "Review Management", desc: "Import and manage all your Google reviews in one place with powerful search and filtering." },
            { icon: <Sparkles className="w-5 h-5" />, title: "AI Replies & Posts", desc: "Generate professional review replies and social media posts powered by GPT-4." },
            { icon: <Users className="w-5 h-5" />, title: "Review Campaigns", desc: "Send personalized review request links to customers via email and track their journey." },
            { icon: <BarChart3 className="w-5 h-5" />, title: "Analytics", desc: "Track page views, review clicks, and conversion rates from your public business page." },
          ].map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="w-9 h-9 rounded-lg bg-[hsl(40,93%,50%)]/15 border border-[hsl(40,93%,50%)]/20 flex items-center justify-center text-[hsl(40,93%,55%)] mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 md:px-12 pb-24 border-t border-white/10 pt-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Everything you need to win on Google</h2>
          <p className="text-white/55 mb-10">One platform. All the tools. Zero hassle.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {[
              "Google review scraping", "AI reply generation", "Social post creation",
              "CSV bulk import", "Email campaigns", "Public business pages",
              "Review request tracking", "Rating analytics", "CSV export",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                <CheckCircle2 className="w-4 h-4 text-[hsl(40,93%,50%)] shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <Link href="/signup">
            <Button size="lg" className="mt-10 bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] hover:bg-[hsl(40,93%,45%)] font-semibold px-8" data-testid="bottom-cta">
              Get started free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 border-t border-white/10 text-center text-sm text-white/30">
        2026 Ravyu. Built for local businesses that care about reputation.
      </footer>
    </div>
  );
}
