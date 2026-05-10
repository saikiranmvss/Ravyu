import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetUserProfile, getGetUserProfileQueryKey, useUpdateUserProfile, useChangePassword, useDeleteAccount } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Save, Loader2, User, Lock, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

const profileSchema = z.object({
  username: z.string().min(2, "Min 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(6, "Min 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const qc = useQueryClient();
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile, isLoading } = useGetUserProfile({ query: { queryKey: getGetUserProfileQueryKey() } });
  const updateMutation = useUpdateUserProfile();
  const passwordMutation = useChangePassword();
  const deleteMutation = useDeleteAccount();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "", email: "", phone: "", company: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        username: profile.username ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        company: profile.company ?? "",
      });
    }
  }, [profile, profileForm]);

  const onProfileSubmit = (values: ProfileValues) => {
    updateMutation.mutate(
      { data: values },
      {
        onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: getGetUserProfileQueryKey() }); },
        onError: () => toast.error("Failed to update profile"),
      },
    );
  };

  const onPasswordSubmit = (values: PasswordValues) => {
    passwordMutation.mutate(
      { data: { currentPassword: values.currentPassword, newPassword: values.newPassword } },
      {
        onSuccess: () => { toast.success("Password changed"); passwordForm.reset(); },
        onError: (e: unknown) => { const msg = (e as { data?: { error?: string } })?.data?.error ?? "Wrong current password"; toast.error(msg); },
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => { logout(); setLocation("/"); },
      onError: () => toast.error("Failed to delete account"),
    });
  };

  if (isLoading) return <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;

  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your personal information and security</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{profile?.username}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Personal Info</CardTitle></CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={profileForm.control} name="username" render={({ field }) => (
                  <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} data-testid="input-username" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} data-testid="input-email" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={profileForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={profileForm.control} name="company" render={({ field }) => (
                  <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-profile">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Password form */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</CardTitle></CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" {...field} data-testid="input-current-password" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} data-testid="input-new-password" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} data-testid="input-confirm-password" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" disabled={passwordMutation.isPending} data-testid="button-change-password">
                {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />} Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3"><CardTitle className="text-sm text-destructive flex items-center gap-2"><Trash2 className="w-4 h-4" /> Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" data-testid="button-delete-account">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete your account, all reviews, business profile, and request history. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
