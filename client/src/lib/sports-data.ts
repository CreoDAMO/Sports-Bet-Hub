import type { Game, BetSlipItem } from "@shared/schema";

export const SPORTS = [
  { id: "all", name: "All Sports", icon: "Trophy" },
  { id: "nfl", name: "NFL", icon: "Shirt" },
  { id: "nba", name: "NBA", icon: "Circle" },
  { id: "mlb", name: "MLB", icon: "Diamond" },
  { id: "soccer", name: "Soccer", icon: "Target" },
] as const;

export type SportId = typeof SPORTS[number]["id"];

export function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function calculatePayout(stake: number, odds: number): number {
  if (odds > 0) {
    return stake + (stake * odds) / 100;
  } else {
    return stake + (stake * 100) / Math.abs(odds);
  }
}

export function calculateParlayOdds(items: BetSlipItem[]): number {
  if (items.length === 0) return 0;
  let decimalOdds = 1;
  for (const item of items) {
    if (item.odds > 0) {
      decimalOdds *= 1 + item.odds / 100;
    } else {
      decimalOdds *= 1 + 100 / Math.abs(item.odds);
    }
  }
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "live": return "text-green-400";
    case "upcoming": return "text-muted-foreground";
    case "final": return "text-muted-foreground";
    default: return "text-muted-foreground";
  }
}

export function getStatusLabel(game: Game): string {
  if (game.status === "live") {
    return game.quarter ? `${game.quarter} - ${game.timeRemaining}` : "LIVE";
  }
  if (game.status === "final") return "Final";
  return new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function getSportIcon(sport: string): string {
  const map: Record<string, string> = {
    nfl: "football",
    nba: "basketball",
    mlb: "baseball",
    soccer: "soccer",
  };
  return map[sport] || "trophy";
}

export function generateCashOutValue(bet: { stake: number; potentialPayout: number; status: string }): number {
  if (bet.status !== "pending") return 0;
  const base = bet.stake;
  const max = bet.potentialPayout;
  const factor = 0.3 + Math.random() * 0.5;
  return Math.round((base + (max - base) * factor) * 100) / 100;
}
