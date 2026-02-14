import { storage } from "./storage";
import type { Game, GameStats } from "@shared/schema";
import WebSocket from "ws";

let wss: WebSocket.Server | null = null;

export function setWebSocketServer(server: WebSocket.Server) {
  wss = server;
}

function broadcast(type: string, data: any) {
  if (!wss) return;
  const message = JSON.stringify({ type, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function randomDelta(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateStatsDelta(stats: GameStats | null, sport: string): GameStats {
  if (!stats) return {};
  const s = { ...stats };

  if (sport === "soccer") {
    if (s.possession !== undefined) {
      const delta = randomDelta(-2, 2);
      s.possession = Math.max(30, Math.min(70, s.possession + delta));
    }
    if (s.totalShots !== undefined) s.totalShots += Math.random() > 0.7 ? 1 : 0;
    if (s.shotsOnTarget !== undefined && s.totalShots !== undefined) {
      s.shotsOnTarget = Math.min(s.shotsOnTarget + (Math.random() > 0.8 ? 1 : 0), s.totalShots);
    }
    if (s.fouls !== undefined) s.fouls += Math.random() > 0.8 ? 1 : 0;
    if (s.corners !== undefined) s.corners += Math.random() > 0.9 ? 1 : 0;
  }

  if (sport === "nfl") {
    if (s.passingYards !== undefined) s.passingYards += randomDelta(0, 15);
    if (s.rushingYards !== undefined) s.rushingYards += randomDelta(0, 8);
    if (s.turnovers !== undefined) s.turnovers += Math.random() > 0.95 ? 1 : 0;
  }

  if (sport === "nba") {
    if (s.rebounds !== undefined) s.rebounds += Math.random() > 0.6 ? 1 : 0;
    if (s.assists !== undefined) s.assists += Math.random() > 0.6 ? 1 : 0;
    if (s.steals !== undefined) s.steals += Math.random() > 0.9 ? 1 : 0;
    if (s.fieldGoalPct !== undefined) {
      s.fieldGoalPct = Math.round((s.fieldGoalPct + randomDelta(-1, 1)) * 10) / 10;
    }
  }

  if (sport === "mlb") {
    if (s.hits !== undefined) s.hits += Math.random() > 0.85 ? 1 : 0;
    if (s.strikeouts !== undefined) s.strikeouts += Math.random() > 0.8 ? 1 : 0;
    if (s.walks !== undefined) s.walks += Math.random() > 0.9 ? 1 : 0;
  }

  return s;
}

async function simulateTick() {
  const allGames = await storage.getGames();
  const liveGames = allGames.filter((g) => g.status === "live");

  for (const game of liveGames) {
    const updates: Partial<Game> = {};
    let changed = false;

    if (Math.random() > 0.85) {
      const team = Math.random() > 0.5 ? "home" : "away";
      let points = 1;
      if (game.sport === "nba") points = randomDelta(1, 3);
      if (game.sport === "nfl") points = [3, 6, 7][Math.floor(Math.random() * 3)];

      if (team === "home") {
        updates.homeScore = game.homeScore + points;
      } else {
        updates.awayScore = game.awayScore + points;
      }
      changed = true;
    }

    const oddsShift = randomDelta(-8, 8);
    if (Math.abs(oddsShift) > 3) {
      updates.homeMoneyline = game.homeMoneyline + oddsShift;
      updates.awayMoneyline = game.awayMoneyline - oddsShift;
      if (updates.homeMoneyline > -101 && updates.homeMoneyline < 101) {
        updates.homeMoneyline = updates.homeMoneyline > 0 ? 101 : -101;
      }
      if (updates.awayMoneyline > -101 && updates.awayMoneyline < 101) {
        updates.awayMoneyline = updates.awayMoneyline > 0 ? 101 : -101;
      }
      changed = true;
    }

    if (Math.random() > 0.7) {
      updates.homeStats = updateStatsDelta(game.homeStats as GameStats | null, game.sport);
      updates.awayStats = updateStatsDelta(game.awayStats as GameStats | null, game.sport);
      changed = true;
    }

    if (changed) {
      const updated = await storage.updateGame(game.id, updates);
      if (updated) {
        broadcast("game_update", updated);
      }
    }
  }
}

export function startSimulator() {
  setInterval(simulateTick, 5000);
}
