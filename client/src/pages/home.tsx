import { useQuery } from "@tanstack/react-query";
import type { Game } from "@shared/schema";
import { GameCard } from "@/components/game-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Zap, Clock, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Home() {
  const [activeTab, setActiveTab] = useState("live");
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { on } = useWebSocket();
  const [liveGames, setLiveGames] = useState<Game[]>([]);

  useEffect(() => {
    if (games) {
      setLiveGames(games);
    }
  }, [games]);

  useEffect(() => {
    const unsub = on("game_update", (updatedGame: Game) => {
      setLiveGames((prev) =>
        prev.map((g) => (g.id === updatedGame.id ? updatedGame : g))
      );
    });
    return unsub;
  }, [on]);

  const live = liveGames.filter((g) => g.status === "live");
  const upcoming = liveGames.filter((g) => g.status === "upcoming");
  const featured = liveGames.filter((g) => g.featured);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {featured.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Featured Games</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {featured.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <TabsList>
            <TabsTrigger value="live" data-testid="tab-live-games">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Live
              {live.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">{live.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming-games">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Upcoming
              {upcoming.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">{upcoming.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="live">
          {live.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No live games right now</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Check back soon for in-play action</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {live.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No upcoming games</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {upcoming.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
