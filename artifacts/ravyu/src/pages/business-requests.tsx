import { useState } from "react";
import { useGetReviewRequests, getGetReviewRequestsQueryKey, useCreateReviewRequest, useBulkImportRequests, useUpdateReviewRequest, useDeleteReviewRequest, useSendReviewRequestEmail, useGetBusinessProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Mail, Copy, Trash2, Upload, Search, Loader2, CheckCircle2, Clock, Send, Eye } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-muted-foreground/20 text-muted-foreground", icon: <Clock className="w-3 h-3" /> },
  sent: { label: "Sent", color: "bg-blue-500/15 text-blue-500", icon: <Send className="w-3 h-3" /> },
  opened: { label: "Opened", color: "bg-amber-500/15 text-amber-600", icon: <Eye className="w-3 h-3" /> },
  completed: { label: "Completed", color: "bg-emerald-500/15 text-emerald-600", icon: <CheckCircle2 className="w-3 h-3" /> },
};

function AddRequestModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const mutation = useCreateReviewRequest();

  const handle = () => {
    if (!name.trim()) { toast.error("Customer name is required"); return; }
    mutation.mutate(
      { data: { customerName: name, customerEmail: email || undefined, customerPhone: phone || undefined, notes: notes || undefined } },
      {
        onSuccess: () => { toast.success("Request created"); setOpen(false); setName(""); setEmail(""); setPhone(""); setNotes(""); onSuccess(); },
        onError: () => toast.error("Failed to create request"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-request"><UserPlus className="w-4 h-4 mr-2" /> Add Request</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Review Request</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Customer Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" data-testid="input-customer-name" /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" data-testid="input-customer-email" /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 resize-none" /></div>
          <Button onClick={handle} disabled={mutation.isPending} className="w-full" data-testid="button-submit-request">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BulkImportModal({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const mutation = useBulkImportRequests();

  const handle = () => {
    const lines = csv.trim().split("\n").filter(Boolean);
    const rows = lines.map((line) => {
      const [customerName, customerEmail, customerPhone] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      return { customerName: customerName ?? "", customerEmail: customerEmail || undefined, customerPhone: customerPhone || undefined };
    }).filter((r) => r.customerName);
    if (rows.length === 0) { toast.error("No valid rows found"); return; }
    mutation.mutate(
      { data: { rows } },
      {
        onSuccess: (data) => { toast.success(`Imported ${data.imported} requests`); setOpen(false); setCsv(""); onSuccess(); },
        onError: () => toast.error("Import failed"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid="button-bulk-import"><Upload className="w-4 h-4 mr-2" /> Bulk Import</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Bulk Import (CSV)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Format: Name, Email, Phone (one per line)</p>
          <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"John Smith, john@example.com, 555-0100\nJane Doe, jane@example.com"} rows={6} className="font-mono text-sm resize-none" data-testid="textarea-csv" />
          <Button onClick={handle} disabled={mutation.isPending} className="w-full" data-testid="button-import">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />} Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BusinessRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { data: profile } = useGetBusinessProfile();
  const { data: requests, isLoading } = useGetReviewRequests(
    { status: statusFilter !== "all" ? statusFilter as "pending" | "sent" | "opened" | "completed" : undefined, search: search || undefined },
    { query: { queryKey: getGetReviewRequestsQueryKey({ status: statusFilter !== "all" ? statusFilter as "pending" | "sent" | "opened" | "completed" : undefined }) } },
  );
  const sendEmailMutation = useSendReviewRequestEmail();
  const deleteMutation = useDeleteReviewRequest();

  const refresh = () => qc.invalidateQueries({ queryKey: getGetReviewRequestsQueryKey() });

  const copyLink = (token: string) => {
    const slug = profile?.slug ?? "your-business";
    const url = `${window.location.origin}/review/${slug}/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const sendEmail = (id: number) => {
    sendEmailMutation.mutate({ id } as never, {
      onSuccess: (data) => { toast.success(data.message ?? "Email sent"); refresh(); },
      onError: () => toast.error("Failed to send email"),
    });
  };

  const deleteRequest = (id: number) => {
    deleteMutation.mutate({ id } as never, {
      onSuccess: () => { toast.success("Request deleted"); refresh(); },
    });
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Review Requests</h1>
          <p className="text-muted-foreground text-sm">{requests?.length ?? 0} total requests</p>
        </div>
        <div className="flex gap-2">
          <BulkImportModal onSuccess={refresh} />
          <AddRequestModal onSuccess={refresh} />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="pl-9" data-testid="input-search" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" data-testid="select-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.keys(STATUS_CONFIG).map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (requests?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium mb-1">No requests yet</p>
          <p className="text-sm">Add a customer to start your review campaign.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(requests ?? []).map((req) => {
                const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending!;
                return (
                  <div key={req.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors" data-testid={`request-row-${req.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{req.customerName}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.customerEmail ?? ""}{req.customerEmail && req.customerPhone ? " · " : ""}{req.customerPhone ?? ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => copyLink(req.uniqueToken)} data-testid={`button-copy-${req.id}`}>
                        <Copy className="w-3 h-3" /> Link
                      </Button>
                      {req.customerEmail && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => sendEmail(req.id)} disabled={sendEmailMutation.isPending} data-testid={`button-email-${req.id}`}>
                          <Mail className="w-3 h-3" /> Email
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => deleteRequest(req.id)} data-testid={`button-delete-${req.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
