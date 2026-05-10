import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetBusinessProfile, getGetBusinessProfileQueryKey, useCreateBusinessProfile, useUpdateBusinessProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Loader2, Link as LinkIcon, MapPin, Phone, Mail, Globe, Palette } from "lucide-react";

const schema = z.object({
  businessName: z.string().min(1, "Business name required"),
  description: z.string().optional(),
  logoUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  coverImageUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  googleMapsUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  googlePlaceId: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  facebookUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  businessHours: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function BusinessProfilePage() {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useGetBusinessProfile({ query: { queryKey: getGetBusinessProfileQueryKey() } });
  const createMutation = useCreateBusinessProfile();
  const updateMutation = useUpdateBusinessProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "", description: "", logoUrl: "", coverImageUrl: "",
      address: "", city: "", state: "", zip: "", phone: "", email: "",
      website: "", googleMapsUrl: "", googlePlaceId: "",
      primaryColor: "#1e3a5f", secondaryColor: "#f59e0b",
      facebookUrl: "", instagramUrl: "", twitterUrl: "", linkedinUrl: "", businessHours: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        businessName: profile.businessName ?? "",
        description: profile.description ?? "",
        logoUrl: profile.logoUrl ?? "",
        coverImageUrl: profile.coverImageUrl ?? "",
        address: profile.address ?? "",
        city: profile.city ?? "",
        state: profile.state ?? "",
        zip: profile.zip ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        website: profile.website ?? "",
        googleMapsUrl: profile.googleMapsUrl ?? "",
        googlePlaceId: profile.googlePlaceId ?? "",
        primaryColor: profile.primaryColor ?? "#1e3a5f",
        secondaryColor: profile.secondaryColor ?? "#f59e0b",
        facebookUrl: profile.facebookUrl ?? "",
        instagramUrl: profile.instagramUrl ?? "",
        twitterUrl: profile.twitterUrl ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        businessHours: profile.businessHours ?? "",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: FormValues) => {
    const cleanValues = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === "" ? undefined : v]));
    const mutation = profile ? updateMutation : createMutation;
    mutation.mutate(
      { data: cleanValues as FormValues },
      {
        onSuccess: () => {
          toast.success(`Business profile ${profile ? "updated" : "created"}!`);
          qc.invalidateQueries({ queryKey: getGetBusinessProfileQueryKey() });
        },
        onError: () => toast.error("Failed to save profile"),
      },
    );
  };

  if (isLoading) return <div className="p-6 space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Business Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your public business presence</p>
        </div>
        {profile?.slug && (
          <a href={`/b/${profile.slug}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" data-testid="link-public-page">
              <LinkIcon className="w-3 h-3 mr-2" /> View page
            </Button>
          </a>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="businessName" render={({ field }) => (
                <FormItem><FormLabel>Business Name *</FormLabel><FormControl><Input {...field} data-testid="input-business-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} className="resize-none" data-testid="input-description" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="logoUrl" render={({ field }) => (
                  <FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} data-testid="input-logo-url" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="coverImageUrl" render={({ field }) => (
                  <FormItem><FormLabel>Cover Image URL</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} data-testid="input-cover-url" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Contact & Location</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} data-testid="input-address" /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="zip" render={({ field }) => (
                  <FormItem><FormLabel>Zip</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} data-testid="input-phone" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} data-testid="input-email" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem><FormLabel>Website</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} data-testid="input-website" /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Google Maps</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="googleMapsUrl" render={({ field }) => (
                <FormItem><FormLabel>Google Maps URL</FormLabel><FormControl><Input type="url" placeholder="https://google.com/maps/place/..." {...field} data-testid="input-maps-url" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="googlePlaceId" render={({ field }) => (
                <FormItem><FormLabel>Google Place ID</FormLabel><FormControl><Input placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="businessHours" render={({ field }) => (
                <FormItem><FormLabel>Business Hours</FormLabel><FormControl><Textarea placeholder="Mon-Fri: 9am-6pm&#10;Sat: 10am-4pm&#10;Sun: Closed" {...field} rows={4} className="resize-none text-sm" /></FormControl></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" /> Brand Colors</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="primaryColor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={field.value ?? "#1e3a5f"} onChange={(e) => field.onChange(e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-border" data-testid="color-primary" />
                      <Input value={field.value ?? ""} onChange={field.onChange} className="font-mono text-sm" />
                    </div>
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="secondaryColor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={field.value ?? "#f59e0b"} onChange={(e) => field.onChange(e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-border" />
                      <Input value={field.value ?? ""} onChange={field.onChange} className="font-mono text-sm" />
                    </div>
                  </FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Social Links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "facebookUrl" as const, label: "Facebook" },
                { name: "instagramUrl" as const, label: "Instagram" },
                { name: "twitterUrl" as const, label: "Twitter / X" },
                { name: "linkedinUrl" as const, label: "LinkedIn" },
              ].map(({ name, label }) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {profile ? "Update Profile" : "Create Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
