import { useEffect } from "react";
import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Loader2, Bell } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const mutation = useUpdateSettings();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.emailNotifications ?? true);
      setSmsNotifications(settings.smsNotifications ?? false);
      setPushNotifications(settings.pushNotifications ?? true);
      setMarketingEmails(settings.marketingEmails ?? false);
    }
  }, [settings]);

  const handleSave = () => {
    mutation.mutate(
      { data: { emailNotifications, smsNotifications, pushNotifications, marketingEmails } },
      {
        onSuccess: () => {
          toast.success("Settings saved");
          qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        },
        onError: () => toast.error("Failed to save settings"),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  const notificationItems = [
    { label: "Email Notifications", desc: "Receive important updates by email", value: emailNotifications, setter: setEmailNotifications, id: "emailNotifications" },
    { label: "SMS Notifications", desc: "Receive text message alerts", value: smsNotifications, setter: setSmsNotifications, id: "smsNotifications" },
    { label: "Push Notifications", desc: "Browser push notifications", value: pushNotifications, setter: setPushNotifications, id: "pushNotifications" },
    { label: "Marketing Emails", desc: "Tips, product updates and news", value: marketingEmails, setter: setMarketingEmails, id: "marketingEmails" },
  ];

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground text-sm">Configure your notification preferences</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationItems.map(({ label, desc, value, setter, id }) => (
            <div key={id} className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5">
              <div>
                <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                id={id}
                checked={value}
                onCheckedChange={setter}
                data-testid={`switch-${id}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={mutation.isPending} className="w-full" data-testid="button-save">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Settings
      </Button>
    </div>
  );
}
