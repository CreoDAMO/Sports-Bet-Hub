import { useQuery, useMutation } from "@tanstack/react-query";
import type { Bet, Parlay } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatOdds } from "@/lib/sports-data";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Layers, DollarSign, Clock, CheckCircle2, XCircle, ArrowDownRight } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "won":
      return <Badge className="bg-green-600 border-green-700 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Won</Badge>;
    case "lost":
      return <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />Lost</Badge>;
    case "cashed_out":
      return <Badge variant="secondary" className="text-[10px]"><ArrowDownRight className="w-3 h-3 mr-1" />Cashed Out</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function BetCard({ bet }: { bet: Bet }) {
  const { toast } = useToast();

  const cashOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/bets/${bet.id}/cashout`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cashed out!", description: `$${bet.cashOutValue?.toFixed(2)} added to your balance` });
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cash out failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card data-testid={`card-bet-${bet.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{bet.selection}</p>
            <p className="text-xs text-muted-foreground capitalize">{bet.betType}</p>
          </div>
          {getStatusBadge(bet.status)}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Stake:</span>{" "}
            <span className="font-mono font-bold">${bet.stake.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Odds:</span>{" "}
            <span className="font-mono font-bold">{formatOdds(bet.odds)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Payout:</span>{" "}
            <span className="font-mono font-bold text-primary">${bet.potentialPayout.toFixed(2)}</span>
          </div>
        </div>

        {bet.status === "pending" && bet.cashOutValue && bet.cashOutValue > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => cashOutMutation.mutate()}
            disabled={cashOutMutation.isPending}
            data-testid={`button-cashout-${bet.id}`}
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            {cashOutMutation.isPending ? "Cashing out..." : `Cash Out $${bet.cashOutValue.toFixed(2)}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ParlayCard({ parlay, legs }: { parlay: Parlay; legs: Bet[] }) {
  const { toast } = useToast();

  const cashOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/parlays/${parlay.id}/cashout`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Parlay cashed out!", description: `$${parlay.cashOutValue?.toFixed(2)} added to your balance` });
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parlays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cash out failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card data-testid={`card-parlay-${parlay.id}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{legs.length}-Leg Parlay</p>
            <p className="text-xs text-muted-foreground">
              Combined odds: {formatOdds(parlay.totalOdds)}
            </p>
          </div>
          {getStatusBadge(parlay.status)}
        </div>

        <div className="space-y-1">
          {legs.map((leg, idx) => (
            <div key={leg.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs">
              <span className="text-muted-foreground font-mono shrink-0">#{idx + 1}</span>
              <span className="font-medium truncate">{leg.selection}</span>
              <Badge variant="outline" className="ml-auto text-[10px] font-mono shrink-0">
                {formatOdds(leg.odds)}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Stake:</span>{" "}
            <span className="font-mono font-bold">${parlay.stake.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Payout:</span>{" "}
            <span className="font-mono font-bold text-primary">${parlay.potentialPayout.toFixed(2)}</span>
          </div>
        </div>

        {parlay.status === "pending" && parlay.cashOutValue && parlay.cashOutValue > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => cashOutMutation.mutate()}
            disabled={cashOutMutation.isPending}
            data-testid={`button-cashout-parlay-${parlay.id}`}
          >
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            {cashOutMutation.isPending ? "Cashing out..." : `Cash Out $${parlay.cashOutValue.toFixed(2)}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyBets() {
  const { data: betsData, isLoading: betsLoading } = useQuery<Bet[]>({
    queryKey: ["/api/bets"],
  });
  const { data: parlaysData, isLoading: parlaysLoading } = useQuery<{ parlays: Parlay[]; legs: Record<string, Bet[]> }>({
    queryKey: ["/api/parlays"],
  });

  const isLoading = betsLoading || parlaysLoading;
  const singleBets = betsData?.filter((b) => !b.isParlay) || [];
  const parlays = parlaysData?.parlays || [];
  const parlayLegs = parlaysData?.legs || {};

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold">My Bets</h2>

      <Tabs defaultValue="singles">
        <TabsList>
          <TabsTrigger value="singles" data-testid="tab-singles-bets">
            <Receipt className="w-3.5 h-3.5 mr-1.5" />
            Singles
            {singleBets.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{singleBets.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="parlays" data-testid="tab-parlays-bets">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Parlays
            {parlays.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{parlays.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="singles" className="mt-4 space-y-3">
          {singleBets.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No bets placed yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Head to the games to place your first bet</p>
            </div>
          ) : (
            singleBets.map((bet) => <BetCard key={bet.id} bet={bet} />)
          )}
        </TabsContent>

        <TabsContent value="parlays" className="mt-4 space-y-3">
          {parlays.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No parlays placed yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Combine 2+ selections into a parlay for bigger payouts</p>
            </div>
          ) : (
            parlays.map((parlay) => (
              <ParlayCard key={parlay.id} parlay={parlay} legs={parlayLegs[parlay.id] || []} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
