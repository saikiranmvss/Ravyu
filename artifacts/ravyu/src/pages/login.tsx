import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useLogin, useFirebaseAuth } from "@workspace/api-client-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppBrandLogo } from "@/components/brand-logo";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginValues) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.accessToken, data.refreshToken);
          if (!data.user.profileComplete) {
            setLocation("/onboarding");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Invalid email or password";
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
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-white/50 text-sm mb-6">Sign in to your account</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 text-xs uppercase tracking-wider">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[hsl(40,93%,50%)] focus:ring-[hsl(40,93%,50%)]"
                        data-testid="input-email"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[hsl(40,93%,50%)] focus:ring-[hsl(40,93%,50%)]"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-[hsl(40,93%,50%)] text-[hsl(227,45%,12%)] hover:bg-[hsl(40,93%,45%)] font-semibold"
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign in
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-white/40 mt-6">
            No account?{" "}
            <Link href="/signup">
              <span className="text-[hsl(40,93%,55%)] hover:underline cursor-pointer font-medium">Sign up</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
