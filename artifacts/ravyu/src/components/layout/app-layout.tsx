import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, Star, Sparkles, Building2, Users, BarChart3, LineChart, Settings, LogOut, User, Menu, ChevronDown, ChevronRight, Brain, BadgeIndianRupee,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Reviews", href: "/reviews", icon: <Star className="w-4 h-4" /> },
  { label: "AI Generator", href: "/ai-generator", icon: <Sparkles className="w-4 h-4" /> },
  {
    label: "Business",
    href: "/business/profile",
    icon: <Building2 className="w-4 h-4" />,
    children: [
      { label: "Profile", href: "/business/profile" },
      { label: "Requests", href: "/business/requests" },
    ],
  },
  { label: "Reports", href: "/reports", icon: <BarChart3 className="w-4 h-4" /> },
  {
    label: "Intelligence",
    href: "/industry-insights",
    icon: <Brain className="w-4 h-4" />,
    children: [
      { label: "Industry insights", href: "/industry-insights" },
      { label: "Weekly reports", href: "/weekly-reports" },
      { label: "Risk & compliance", href: "/risk-compliance" },
    ],
  },
  { label: "Analytics", href: "/analytics", icon: <LineChart className="w-4 h-4" /> },
  { label: "Plans", href: "/plans", icon: <BadgeIndianRupee className="w-4 h-4" /> },
];

function NavLink({ item, collapsed = false }: { item: NavItem; collapsed?: boolean }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = location === item.href || (item.children?.some((c) => location === c.href));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            isActive && "text-sidebar-foreground bg-sidebar-accent",
          )}
          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {item.icon}
          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
          {!collapsed && (open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
        </button>
        {open && !collapsed && (
          <div className="ml-7 mt-1 space-y-1">
            {item.children.map((child) => (
              <Link key={child.href} href={child.href}>
                <span
                  className={cn(
                    "block px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                    location === child.href && "text-sidebar-primary font-semibold",
                  )}
                  data-testid={`nav-${child.label.toLowerCase()}`}
                >
                  {child.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.href}>
      <span
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
          isActive && "text-sidebar-primary bg-sidebar-accent font-semibold",
        )}
        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {item.icon}
        {!collapsed && item.label}
      </span>
    </Link>
  );
}

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  return (
    <div className={cn("flex flex-col h-full bg-sidebar", mobile ? "w-full" : "w-64")}>
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Star className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-sidebar-foreground tracking-tight">Ravyu</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.href} onClick={mobile ? onClose : undefined}>
            <NavLink item={item} />
          </div>
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-sidebar-border">
        <Link href="/settings">
          <span
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors"
            data-testid="nav-settings"
            onClick={mobile ? onClose : undefined}
          >
            <Settings className="w-4 h-4" />
            Settings
          </span>
        </Link>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    if (!isLoading && user && !user.profileComplete) {
      setLocation("/onboarding");
    }
  }, [user, isLoading, setLocation]);

  const handleLogout = () => {
    const refreshToken = localStorage.getItem("refreshToken") ?? "";
    logoutMutation.mutate({ data: { refreshToken } } as never);
    logout();
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-card border-b border-border shrink-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar mobile onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="hidden md:block" />

          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-8 px-2" data-testid="user-menu">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{user?.username ?? "User"}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-profile">
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")} data-testid="menu-settings">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive" data-testid="menu-logout">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
