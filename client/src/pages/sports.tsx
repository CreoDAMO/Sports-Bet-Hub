import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import type { Game } from "@shared/schema";
import { GameCard } from "@/components/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { LayoutGrid } from "lucide-react";

export default function Sports() {
  const [, params] = useRoute("/sport/:sport");
  const sportFilter = params?.sport;

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { on } = useWebSocket();
  const [liveGames, setLiveGames] = useState<Game[]>([]);

  useEffect(() => {
    if (games) setLiveGames(games);
  }, [games]);

  useEffect(() => {
    const unsub = on("game_update", (updated: Game) => {
      setLiveGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    });
    return unsub;
  }, [on]);

  const filtered = sportFilter
    ? liveGames.filter((g) => g.sport === sportFilter)
    : liveGames;

  const sportGroups = filtered.reduce((acc, game) => {
    if (!acc[game.sport]) acc[game.sport] = [];
    acc[game.sport].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">
          {sportFilter ? sportFilter.toUpperCase() : "All Sports"}
        </h2>
        <Badge variant="secondary" className="text-xs">{filtered.length} games</Badge>
      </div>

      {Object.entries(sportGroups).map(([sport, sportGames]) => (
        <div key={sport}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {sport.toUpperCase()}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sportGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <LayoutGrid className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No games found</p>
        </div>
      )}
    </div>
  );
}
