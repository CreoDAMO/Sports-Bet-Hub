import { useLocation } from "wouter";
import {
  Trophy,
  Zap,
  LayoutGrid,
  History,
  Wallet,
  TrendingUp,
  Circle,
  Diamond,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Live & Upcoming", url: "/", icon: Zap },
  { title: "All Sports", url: "/sports", icon: LayoutGrid },
  { title: "My Bets", url: "/my-bets", icon: History },
];

const sports: { title: string; url: string; icon: LucideIcon }[] = [
  { title: "NFL", url: "/sport/nfl", icon: Trophy },
  { title: "NBA", url: "/sport/nba", icon: Circle },
  { title: "MLB", url: "/sport/mlb", icon: Diamond },
  { title: "Soccer", url: "/sport/soccer", icon: Target },
];

export function AppSidebar({ balance }: { balance: number }) {
  const [location, setLocation] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setLocation("/")}
          data-testid="link-home"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <Trophy className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-sidebar-foreground">
              BetEdge
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Sportsbook</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                  >
                    <a
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        setLocation(item.url);
                      }}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sports.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url}
                  >
                    <a
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        setLocation(item.url);
                      }}
                      data-testid={`link-sport-${item.title.toLowerCase()}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-sidebar-accent">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-sidebar-foreground/70" />
            <span className="text-xs text-sidebar-foreground/70">Balance</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-sm font-bold text-sidebar-foreground" data-testid="text-balance">
              ${balance.toFixed(2)}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
