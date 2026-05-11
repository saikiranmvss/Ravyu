import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppBrandLogo } from "@/components/brand-logo";

const signupSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const signupMutation = useSignup();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onSubmit = (values: SignupValues) => {
    signupMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.accessToken, data.refreshToken);
          setLocation("/onboarding");
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed";
          toast.error(msg);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(227,45%,10%)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <AppBrandLogo
            className="h-16 w-auto max-w-[min(280px,85vw)] object-contain"
            alt="Ravyu"
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-white/50 text-sm mb-6">Start managing your reputation today</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 text-xs uppercase tracking-wider">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 text-xs uppercase tracking-wider">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 text-xs uppercase tracking-wider">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min 6 characters" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] hover:bg-[hsl(40,93%,45%)] font-semibold" disabled={signupMutation.isPending} data-testid="button-submit">
                {signupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create account
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-[hsl(40,93%,55%)] hover:underline cursor-pointer font-medium">Sign in</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
