import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BetSlip } from "@/components/bet-slip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Receipt } from "lucide-react";
import { useState } from "react";
import { useBetSlip } from "@/lib/bet-slip-store";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import GameDetail from "@/pages/game-detail";
import MyBets from "@/pages/my-bets";
import Sports from "@/pages/sports";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function MobileBetSlipToggle({ onClick, count }: { onClick: () => void; count: number }) {
  if (count === 0) return null;
  return (
    <Button
      variant="default"
      size="sm"
      className="lg:hidden fixed bottom-4 right-4 z-50 shadow-lg"
      onClick={onClick}
      data-testid="button-mobile-betslip"
    >
      <Receipt className="w-4 h-4 mr-1" />
      Bet Slip
      <Badge variant="secondary" className="ml-1 text-[10px]">{count}</Badge>
    </Button>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/:id" component={GameDetail} />
      <Route path="/my-bets" component={MyBets} />
      <Route path="/sports" component={Sports} />
      <Route path="/sport/:sport" component={Sports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { data: walletData } = useQuery<{ balance: number }>({
    queryKey: ["/api/wallet"],
  });
  const { count } = useBetSlip();
  const [showMobileSlip, setShowMobileSlip] = useState(false);

  const balance = walletData?.balance ?? 1000;

  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar balance={balance} />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">BetEdge Sportsbook</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <Router />
            </main>
            <aside className="hidden lg:block w-80 border-l overflow-y-auto p-4 shrink-0 bg-background">
              <BetSlip />
            </aside>
          </div>
        </div>
      </div>

      <MobileBetSlipToggle onClick={() => setShowMobileSlip(!showMobileSlip)} count={count} />

      {showMobileSlip && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowMobileSlip(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto bg-background border-t p-4 rounded-t-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            <BetSlip />
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppLayout />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
