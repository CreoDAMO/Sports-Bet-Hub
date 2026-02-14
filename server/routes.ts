import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { seedGames } from "./seed";
import { startSimulator, setWebSocketServer } from "./game-simulator";
import { z } from "zod";
import WebSocket, { WebSocketServer } from "ws";

const placeBetSchema = z.object({
  gameId: z.string().min(1),
  betType: z.string().min(1),
  selection: z.string().min(1),
  odds: z.number().int(),
  stake: z.number().positive(),
  potentialPayout: z.number().positive().optional(),
});

const placeParlaySchema = z.object({
  legs: z.array(z.object({
    gameId: z.string().min(1),
    betType: z.string().min(1),
    selection: z.string().min(1),
    odds: z.number().int(),
  })).min(2),
  stake: z.number().positive(),
  totalOdds: z.number().int(),
  potentialPayout: z.number().positive().optional(),
});

async function getOrCreateUser() {
  let user = await storage.getUserByUsername("demo");
  if (!user) {
    user = await storage.createUser({ username: "demo", password: "demo123" });
  }
  return user;
}

function calculatePayoutServer(stake: number, odds: number): number {
  if (odds > 0) {
    return Math.round((stake + (stake * odds) / 100) * 100) / 100;
  } else {
    return Math.round((stake + (stake * 100) / Math.abs(odds)) * 100) / 100;
  }
}

function generateCashOutValue(stake: number, potentialPayout: number): number {
  const factor = 0.3 + Math.random() * 0.5;
  return Math.round((stake + (potentialPayout - stake) * factor) * 100) / 100;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.on("error", () => {});
  });

  setWebSocketServer(wss);

  await seedGames();
  startSimulator();

  app.get("/api/wallet", async (_req, res) => {
    const user = await getOrCreateUser();
    res.json({ balance: user.balance });
  });

  app.get("/api/games", async (_req, res) => {
    const games = await storage.getGames();
    res.json(games);
  });

  app.get("/api/games/:id", async (req, res) => {
    const game = await storage.getGame(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  });

  app.get("/api/bets", async (_req, res) => {
    const user = await getOrCreateUser();
    const userBets = await storage.getBets(user.id);
    const updatedBets = userBets.map((bet) => ({
      ...bet,
      cashOutValue: bet.status === "pending" ? generateCashOutValue(bet.stake, bet.potentialPayout) : null,
    }));
    res.json(updatedBets);
  });

  app.post("/api/bets", async (req, res) => {
    const parsed = placeBetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors.map((e) => e.message).join(", ") });
    }

    const user = await getOrCreateUser();
    const { gameId, betType, selection, odds, stake, potentialPayout } = parsed.data;

    if (stake > user.balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const game = await storage.getGame(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    const payout = potentialPayout || calculatePayoutServer(stake, odds);

    const bet = await storage.createBet({
      userId: user.id,
      gameId,
      betType,
      selection,
      odds,
      stake,
      potentialPayout: payout,
      status: "pending",
      cashOutValue: null,
      isParlay: false,
      parlayId: null,
    });

    await storage.updateUserBalance(user.id, user.balance - stake);
    res.json(bet);
  });

  app.post("/api/bets/:id/cashout", async (req, res) => {
    const user = await getOrCreateUser();
    const bet = await storage.getBet(req.params.id);

    if (!bet) return res.status(404).json({ message: "Bet not found" });
    if (bet.status !== "pending") return res.status(400).json({ message: "Bet already settled" });

    const cashOutValue = generateCashOutValue(bet.stake, bet.potentialPayout);

    await storage.updateBet(bet.id, { status: "cashed_out", cashOutValue });
    await storage.updateUserBalance(user.id, user.balance + cashOutValue);

    res.json({ cashOutValue });
  });

  app.get("/api/parlays", async (_req, res) => {
    const user = await getOrCreateUser();
    const userParlays = await storage.getParlays(user.id);

    const parlaysWithLegs: Record<string, any[]> = {};
    const updatedParlays = [];

    for (const parlay of userParlays) {
      const legs = await storage.getBetsByParlay(parlay.id);
      parlaysWithLegs[parlay.id] = legs;
      updatedParlays.push({
        ...parlay,
        cashOutValue: parlay.status === "pending" ? generateCashOutValue(parlay.stake, parlay.potentialPayout) : null,
      });
    }

    res.json({ parlays: updatedParlays, legs: parlaysWithLegs });
  });

  app.post("/api/parlays", async (req, res) => {
    const parsed = placeParlaySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors.map((e) => e.message).join(", ") });
    }

    const user = await getOrCreateUser();
    const { legs, stake, totalOdds, potentialPayout } = parsed.data;

    if (stake > user.balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const payout = potentialPayout || calculatePayoutServer(stake, totalOdds);

    const parlay = await storage.createParlay({
      userId: user.id,
      totalOdds,
      stake,
      potentialPayout: payout,
      status: "pending",
      cashOutValue: null,
    });

    for (const leg of legs) {
      await storage.createBet({
        userId: user.id,
        gameId: leg.gameId,
        betType: leg.betType,
        selection: leg.selection,
        odds: leg.odds,
        stake: 0,
        potentialPayout: 0,
        status: "pending",
        cashOutValue: null,
        isParlay: true,
        parlayId: parlay.id,
      });
    }

    await storage.updateUserBalance(user.id, user.balance - stake);
    res.json(parlay);
  });

  app.post("/api/parlays/:id/cashout", async (req, res) => {
    const user = await getOrCreateUser();
    const parlay = await storage.getParlay(req.params.id);

    if (!parlay) return res.status(404).json({ message: "Parlay not found" });
    if (parlay.status !== "pending") return res.status(400).json({ message: "Parlay already settled" });

    const cashOutValue = generateCashOutValue(parlay.stake, parlay.potentialPayout);

    await storage.updateParlay(parlay.id, { status: "cashed_out", cashOutValue });

    const parlayLegs = await storage.getBetsByParlay(parlay.id);
    for (const leg of parlayLegs) {
      await storage.updateBet(leg.id, { status: "cashed_out" });
    }

    await storage.updateUserBalance(user.id, user.balance + cashOutValue);

    res.json({ cashOutValue });
  });

  return httpServer;
}
