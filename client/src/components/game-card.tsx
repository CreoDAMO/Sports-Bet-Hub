import { useLocation } from "wouter";
import type { Game } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatOdds, getStatusLabel } from "@/lib/sports-data";
import { useBetSlip } from "@/lib/bet-slip-store";
import { Clock, Zap } from "lucide-react";

function OddsButton({
  label,
  odds,
  gameId,
  betType,
  selection,
  displaySelection,
  homeTeam,
  awayTeam,
}: {
  label: string;
  odds: number;
  gameId: string;
  betType: "moneyline" | "spread" | "total";
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
      size="sm"
      className={`flex flex-col gap-0.5 min-w-[72px] py-1.5 font-mono text-xs ${selected ? "" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        addItem({
          id: `${gameId}-${betType}-${selection}`,
          gameId,
          homeTeam,
          awayTeam,
          betType,
          selection,
          displaySelection,
          odds,
        });
      }}
      data-testid={`button-odds-${gameId}-${betType}-${selection}`}
    >
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
      <span className="font-semibold leading-none">{formatOdds(odds)}</span>
    </Button>
  );
}

export function GameCard({ game }: { game: Game }) {
  const [, setLocation] = useLocation();
  const isLive = game.status === "live";

  return (
    <Card
      className="hover-elevate cursor-pointer transition-all duration-200"
      onClick={() => setLocation(`/game/${game.id}`)}
      data-testid={`card-game-${game.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={isLive ? "default" : "outline"}
              className={`text-[10px] ${isLive ? "bg-green-600 border-green-700" : ""}`}
            >
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-live mr-1" />}
              {getStatusLabel(game)}
            </Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {game.league}
            </span>
          </div>
          {isLive && (
            <Zap className="w-3.5 h-3.5 text-primary" />
          )}
          {game.status === "upcoming" && (
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{game.awayTeam}</span>
            {(isLive || game.status === "final") && (
              <span className="text-lg font-bold tabular-nums" data-testid={`text-away-score-${game.id}`}>
                {game.awayScore}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{game.homeTeam}</span>
            {(isLive || game.status === "final") && (
              <span className="text-lg font-bold tabular-nums" data-testid={`text-home-score-${game.id}`}>
                {game.homeScore}
              </span>
            )}
          </div>
        </div>

        {game.status !== "final" && (
          <div className="grid grid-cols-3 gap-1.5">
            <OddsButton
              label={game.awayTeam.split(" ").pop()!}
              odds={game.awayMoneyline}
              gameId={game.id}
              betType="moneyline"
              selection="away"
              displaySelection={`${game.awayTeam} ML`}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
            />
            <OddsButton
              label={`O ${game.totalPoints}`}
              odds={game.overOdds}
              gameId={game.id}
              betType="total"
              selection="over"
              displaySelection={`Over ${game.totalPoints}`}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
            />
            <OddsButton
              label={game.homeTeam.split(" ").pop()!}
              odds={game.homeMoneyline}
              gameId={game.id}
              betType="moneyline"
              selection="home"
              displaySelection={`${game.homeTeam} ML`}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
