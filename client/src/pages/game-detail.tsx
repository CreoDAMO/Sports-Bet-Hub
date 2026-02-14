import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import type { Game, GameStats } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatOdds, getStatusLabel } from "@/lib/sports-data";
import { useBetSlip } from "@/lib/bet-slip-store";
import { useWebSocket } from "@/hooks/use-websocket";
import { ArrowLeft, Zap, BarChart3, Target } from "lucide-react";
import { useState, useEffect } from "react";

function BettingOption({
  label,
  value,
  odds,
  gameId,
  betType,
  selection,
  displaySelection,
  homeTeam,
  awayTeam,
}: {
  label: string;
  value: string;
  odds: number;
  gameId: string;
  betType: "moneyline" | "spread" | "total" | "prop";
  selection: string;
  displaySelection: string;
  homeTeam: string;
  awayTeam: string;
}) {
  const { addItem, isSelected } = useBetSlip();
  const selected = isSelected(gameId, betType, selection);

  return (
    <Button
      variant={selected ? "default" : "outline"}
      className="flex items-center justify-between gap-2 w-full"
      onClick={() =>
        addItem({
          id: `${gameId}-${betType}-${selection}`,
          gameId,
          homeTeam,
          awayTeam,
          betType,
          selection,
          displaySelection,
          odds,
        })
      }
      data-testid={`button-bet-${betType}-${selection}`}
    >
      <div className="text-left">
        <span className="text-xs text-muted-foreground block">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <span className="font-mono font-bold text-sm">{formatOdds(odds)}</span>
    </Button>
  );
}

function StatBar({ label, homeValue, awayValue, unit }: { label: string; homeValue: number; awayValue: number; unit?: string }) {
  const total = homeValue + awayValue || 1;
  const homePercent = (homeValue / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono tabular-nums">
          {homeValue}{unit}
        </span>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">
          {awayValue}{unit}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
        <div
          className="bg-primary rounded-l-full transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-chart-2 rounded-r-full transition-all duration-500"
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
    </div>
  );
}

export default function GameDetail() {
  const [, params] = useRoute("/game/:id");
  const [, setLocation] = useLocation();
  const gameId = params?.id;

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
  });

  const { on } = useWebSocket();
  const [liveGame, setLiveGame] = useState<Game | null>(null);

  useEffect(() => {
    if (game) setLiveGame(game);
  }, [game]);

  useEffect(() => {
    const unsub = on("game_update", (updated: Game) => {
      if (updated.id === gameId) {
        setLiveGame(updated);
      }
    });
    return unsub;
  }, [on, gameId]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!liveGame) {
    return (
      <div className="p-4 md:p-6 text-center py-16">
        <p className="text-muted-foreground">Game not found</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  const g = liveGame;
  const isLive = g.status === "live";
  const homeStats = g.homeStats as GameStats | null;
  const awayStats = g.awayStats as GameStats | null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/")}
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <Badge
                variant={isLive ? "default" : "outline"}
                className={isLive ? "bg-green-600 border-green-700" : ""}
              >
                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-live mr-1" />}
                {getStatusLabel(g)}
              </Badge>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{g.league}</span>
              {homeStats?.integrityAlert && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Integrity Alert
                </Badge>
              )}
            </div>
            {isLive && <Zap className="w-4 h-4 text-primary" />}
          </div>

          <div className="grid grid-cols-3 items-center gap-4 text-center">
            <div>
              <p className="text-lg font-bold">{g.awayTeam}</p>
              <p className="text-xs text-muted-foreground">Away</p>
            </div>
            <div>
              {(isLive || g.status === "final") ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold tabular-nums" data-testid="text-away-score">
                    {g.awayScore}
                  </span>
                  <span className="text-xl text-muted-foreground">-</span>
                  <span className="text-4xl font-bold tabular-nums" data-testid="text-home-score">
                    {g.homeScore}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold text-muted-foreground">VS</span>
              )}
            </div>
            <div>
              <p className="text-lg font-bold">{g.homeTeam}</p>
              <p className="text-xs text-muted-foreground">Home</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="markets">
        <TabsList>
          <TabsTrigger value="markets" data-testid="tab-markets">
            <Target className="w-3.5 h-3.5 mr-1.5" />
            Markets
          </TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="space-y-4 mt-4">
          {g.status !== "final" && (
            <>
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Moneyline</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2">
                  <BettingOption
                    label="Away"
                    value={g.awayTeam}
                    odds={g.awayMoneyline}
                    gameId={g.id}
                    betType="moneyline"
                    selection="away"
                    displaySelection={`${g.awayTeam} ML`}
                    homeTeam={g.homeTeam}
                    awayTeam={g.awayTeam}
                  />
                  <BettingOption
                    label="Home"
                    value={g.homeTeam}
                    odds={g.homeMoneyline}
                    gameId={g.id}
                    betType="moneyline"
                    selection="home"
                    displaySelection={`${g.homeTeam} ML`}
                    homeTeam={g.homeTeam}
                    awayTeam={g.awayTeam}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Spread</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2">
                  <BettingOption
                    label="Away"
                    value={`${g.awayTeam} ${g.spread > 0 ? "+" : ""}${g.spread}`}
                    odds={g.spreadOdds}
                    gameId={g.id}
                    betType="spread"
                    selection="away"
                    displaySelection={`${g.awayTeam} ${g.spread > 0 ? "+" : ""}${g.spread}`}
                    homeTeam={g.homeTeam}
                    awayTeam={g.awayTeam}
                  />
                  <BettingOption
                    label="Home"
                    value={`${g.homeTeam} ${-g.spread > 0 ? "+" : ""}${-g.spread}`}
                    odds={g.spreadOdds}
                    gameId={g.id}
                    betType="spread"
                    selection="home"
                    displaySelection={`${g.homeTeam} ${-g.spread > 0 ? "+" : ""}${-g.spread}`}
                    homeTeam={g.homeTeam}
                    awayTeam={g.awayTeam}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Total Points</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2">
                  <BettingOption
                    label="Over"
                    value={`Over ${g.totalPoints}`}
                    odds={g.overOdds}
                    gameId={g.id}
                    betType="total"
                    selection="over"
                    displaySelection={`Over ${g.totalPoints}`}
                    homeTeam={g.homeTeam}
                    awayTeam={g.awayTeam}
                  />
                  <BettingOption
                    label="Under"
                    value={`Under ${g.totalPoints}`}
                    odds={g.underOdds}
                    gameId={g.id}
                    betType="total"
                    selection="under"
                    displaySelection={`Under ${g.totalPoints}`}
                    homeTeam={g.homeTeam}
                    awayTeam={g.awayTeam}
                  />
                </CardContent>
              </Card>

              {isLive && (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      Same-Game Parlay Props
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2">
                    <BettingOption
                      label="Next Score"
                      value={g.awayTeam}
                      odds={Math.round(-120 + Math.random() * 60)}
                      gameId={g.id}
                      betType="prop"
                      selection="next_score_away"
                      displaySelection={`${g.awayTeam} Next Score`}
                      homeTeam={g.homeTeam}
                      awayTeam={g.awayTeam}
                    />
                    <BettingOption
                      label="Next Score"
                      value={g.homeTeam}
                      odds={Math.round(-120 + Math.random() * 60)}
                      gameId={g.id}
                      betType="prop"
                      selection="next_score_home"
                      displaySelection={`${g.homeTeam} Next Score`}
                      homeTeam={g.homeTeam}
                      awayTeam={g.awayTeam}
                    />
                    <BettingOption
                      label="Margin"
                      value={`${g.awayTeam} by 1-6`}
                      odds={Math.round(150 + Math.random() * 200)}
                      gameId={g.id}
                      betType="prop"
                      selection="margin_away_close"
                      displaySelection={`${g.awayTeam} wins by 1-6`}
                      homeTeam={g.homeTeam}
                      awayTeam={g.awayTeam}
                    />
                    <BettingOption
                      label="Margin"
                      value={`${g.homeTeam} by 1-6`}
                      odds={Math.round(150 + Math.random() * 200)}
                      gameId={g.id}
                      betType="prop"
                      selection="margin_home_close"
                      displaySelection={`${g.homeTeam} wins by 1-6`}
                      homeTeam={g.homeTeam}
                      awayTeam={g.awayTeam}
                    />
                  </CardContent>
                </Card>
              )}

              {g.sport === "esports" && (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      Player Prop Markets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2">
                    <BettingOption
                      label="Kills"
                      value="Player 1 Over 12.5"
                      odds={-110}
                      gameId={g.id}
                      betType="prop"
                      selection="player_kills_over"
                      displaySelection="Player 1 Over 12.5 Kills"
                      homeTeam={g.homeTeam}
                      awayTeam={g.awayTeam}
                    />
                    <BettingOption
                      label="Kills"
                      value="Player 1 Under 12.5"
                      odds={-110}
                      gameId={g.id}
                      betType="prop"
                      selection="player_kills_under"
                      displaySelection="Player 1 Under 12.5 Kills"
                      homeTeam={g.homeTeam}
                      awayTeam={g.awayTeam}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{g.homeTeam}</span>
                <CardTitle className="text-sm">Game Stats</CardTitle>
                <span className="text-sm font-medium">{g.awayTeam}</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              {homeStats && awayStats ? (
                <>
                  {homeStats.possession !== undefined && awayStats.possession !== undefined && (
                    <StatBar label="Possession %" homeValue={homeStats.possession} awayValue={awayStats.possession} unit="%" />
                  )}
                  {homeStats.totalShots !== undefined && awayStats.totalShots !== undefined && (
                    <StatBar label="Total Shots" homeValue={homeStats.totalShots} awayValue={awayStats.totalShots} />
                  )}
                  {homeStats.shotsOnTarget !== undefined && awayStats.shotsOnTarget !== undefined && (
                    <StatBar label="Shots on Target" homeValue={homeStats.shotsOnTarget} awayValue={awayStats.shotsOnTarget} />
                  )}
                  {homeStats.fouls !== undefined && awayStats.fouls !== undefined && (
                    <StatBar label="Fouls" homeValue={homeStats.fouls} awayValue={awayStats.fouls} />
                  )}
                  {homeStats.corners !== undefined && awayStats.corners !== undefined && (
                    <StatBar label="Corners" homeValue={homeStats.corners} awayValue={awayStats.corners} />
                  )}
                  {homeStats.passingYards !== undefined && awayStats.passingYards !== undefined && (
                    <StatBar label="Passing Yards" homeValue={homeStats.passingYards} awayValue={awayStats.passingYards} />
                  )}
                  {homeStats.rushingYards !== undefined && awayStats.rushingYards !== undefined && (
                    <StatBar label="Rushing Yards" homeValue={homeStats.rushingYards} awayValue={awayStats.rushingYards} />
                  )}
                  {homeStats.turnovers !== undefined && awayStats.turnovers !== undefined && (
                    <StatBar label="Turnovers" homeValue={homeStats.turnovers} awayValue={awayStats.turnovers} />
                  )}
                  {homeStats.rebounds !== undefined && awayStats.rebounds !== undefined && (
                    <StatBar label="Rebounds" homeValue={homeStats.rebounds} awayValue={awayStats.rebounds} />
                  )}
                  {homeStats.assists !== undefined && awayStats.assists !== undefined && (
                    <StatBar label="Assists" homeValue={homeStats.assists} awayValue={awayStats.assists} />
                  )}
                  {homeStats.fieldGoalPct !== undefined && awayStats.fieldGoalPct !== undefined && (
                    <StatBar label="FG %" homeValue={homeStats.fieldGoalPct} awayValue={awayStats.fieldGoalPct} unit="%" />
                  )}
                  {homeStats.hits !== undefined && awayStats.hits !== undefined && (
                    <StatBar label="Hits" homeValue={homeStats.hits} awayValue={awayStats.hits} />
                  )}
                  {homeStats.strikeouts !== undefined && awayStats.strikeouts !== undefined && (
                    <StatBar label="Strikeouts" homeValue={homeStats.strikeouts} awayValue={awayStats.strikeouts} />
                  )}
                  {/* Esports Stats */}
                  {homeStats.kills !== undefined && awayStats.kills !== undefined && (
                    <StatBar label="Kills" homeValue={homeStats.kills} awayValue={awayStats.kills} />
                  )}
                  {homeStats.deaths !== undefined && awayStats.deaths !== undefined && (
                    <StatBar label="Deaths" homeValue={homeStats.deaths} awayValue={awayStats.deaths} />
                  )}
                  {homeStats.damage !== undefined && awayStats.damage !== undefined && (
                    <StatBar label="Total Damage" homeValue={homeStats.damage} awayValue={awayStats.damage} />
                  )}
                  {homeStats.objectives !== undefined && awayStats.objectives !== undefined && (
                    <StatBar label="Objectives Secured" homeValue={homeStats.objectives} awayValue={awayStats.objectives} />
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Stats will be available once the game starts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
