import { useState } from "react";
import { useBetSlip } from "@/lib/bet-slip-store";
import { formatOdds, calculatePayout, calculateParlayOdds } from "@/lib/sports-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Trash2, Receipt, Layers } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function BetSlip() {
  const { items, removeItem, updateStake, clearSlip, totalStake, parlayOdds, parlayPayout, count } = useBetSlip();
  const [betMode, setBetMode] = useState<"singles" | "parlay">("singles");
  const [parlayStake, setParlayStake] = useState(0);
  const { toast } = useToast();

  const placeBetMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bets", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Bet placed!", description: "Good luck!" });
      clearSlip();
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to place bet", description: err.message, variant: "destructive" });
    },
  });

  const placeParlayMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/parlays", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Parlay placed!", description: "Good luck!" });
      clearSlip();
      queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to place parlay", description: err.message, variant: "destructive" });
    },
  });

  if (count === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Receipt className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Bet Slip Empty</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Click on odds to add selections
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePlaceSingles = () => {
    const validBets = items.filter((i) => i.stake > 0);
    if (validBets.length === 0) {
      toast({ title: "Enter a stake", description: "Add a stake to at least one bet", variant: "destructive" });
      return;
    }
    validBets.forEach((item) => {
      placeBetMutation.mutate({
        gameId: item.gameId,
        betType: item.betType,
        selection: item.selection,
        odds: item.odds,
        stake: item.stake,
        potentialPayout: calculatePayout(item.stake, item.odds),
      });
    });
  };

  const handlePlaceParlay = () => {
    if (parlayStake <= 0) {
      toast({ title: "Enter a stake", description: "Add a parlay stake", variant: "destructive" });
      return;
    }
    if (items.length < 2) {
      toast({ title: "Need 2+ legs", description: "Parlays need at least 2 selections", variant: "destructive" });
      return;
    }
    placeParlayMutation.mutate({
      legs: items.map((item) => ({
        gameId: item.gameId,
        betType: item.betType,
        selection: item.selection,
        odds: item.odds,
      })),
      stake: parlayStake,
      totalOdds: parlayOdds,
      potentialPayout: calculatePayout(parlayStake, parlayOdds),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Bet Slip</CardTitle>
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSlip}
          data-testid="button-clear-slip"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs value={betMode} onValueChange={(v) => setBetMode(v as "singles" | "parlay")} className="mb-3">
          <TabsList className="w-full">
            <TabsTrigger value="singles" className="flex-1" data-testid="tab-singles">
              <Receipt className="w-3.5 h-3.5 mr-1" />
              Singles
            </TabsTrigger>
            <TabsTrigger value="parlay" className="flex-1" data-testid="tab-parlay" disabled={count < 2}>
              <Layers className="w-3.5 h-3.5 mr-1" />
              Parlay
            </TabsTrigger>
          </TabsList>

          <TabsContent value="singles">
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.displaySelection}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.awayTeam} vs {item.homeTeam}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-xs font-mono">
                        {formatOdds(item.odds)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => removeItem(item.id)}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step={5}
                        placeholder="0.00"
                        value={item.stake || ""}
                        onChange={(e) => updateStake(item.id, parseFloat(e.target.value) || 0)}
                        className="pl-6 h-8 text-sm font-mono"
                        data-testid={`input-stake-${item.id}`}
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground">Payout</p>
                      <p className="text-xs font-bold font-mono text-primary" data-testid={`text-payout-${item.id}`}>
                        ${item.stake > 0 ? calculatePayout(item.stake, item.odds).toFixed(2) : "0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 rounded-md bg-muted/30 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Stake</span>
                <span className="font-mono font-bold">${totalStake.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Payout</span>
                <span className="font-mono font-bold text-primary">
                  ${items.reduce((sum, i) => sum + (i.stake > 0 ? calculatePayout(i.stake, i.odds) : 0), 0).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-3"
              onClick={handlePlaceSingles}
              disabled={placeBetMutation.isPending || totalStake <= 0}
              data-testid="button-place-singles"
            >
              {placeBetMutation.isPending ? "Placing..." : `Place ${items.filter((i) => i.stake > 0).length} Bet${items.filter((i) => i.stake > 0).length !== 1 ? "s" : ""}`}
            </Button>
          </TabsContent>

          <TabsContent value="parlay">
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">#{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.displaySelection}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.awayTeam} @ {item.homeTeam}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-xs font-mono">
                      {formatOdds(item.odds)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 rounded-md bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Parlay Odds</span>
                <Badge className="font-mono">{formatOdds(parlayOdds)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    placeholder="0.00"
                    value={parlayStake || ""}
                    onChange={(e) => setParlayStake(parseFloat(e.target.value) || 0)}
                    className="pl-6 h-8 text-sm font-mono"
                    data-testid="input-parlay-stake"
                  />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">Payout</p>
                  <p className="text-sm font-bold font-mono text-primary" data-testid="text-parlay-payout">
                    ${parlayStake > 0 ? calculatePayout(parlayStake, parlayOdds).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-3"
              onClick={handlePlaceParlay}
              disabled={placeParlayMutation.isPending || parlayStake <= 0 || count < 2}
              data-testid="button-place-parlay"
            >
              {placeParlayMutation.isPending ? "Placing..." : `Place ${count}-Leg Parlay`}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
