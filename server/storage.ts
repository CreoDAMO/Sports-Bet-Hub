import {
  users, games, bets, parlays,
  type User, type InsertUser, type Game, type InsertGame,
  type Bet, type InsertBet, type Parlay, type InsertParlay,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: string, balance: number): Promise<User | undefined>;

  getGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  getGameCount(): Promise<number>;

  getBets(userId: string): Promise<Bet[]>;
  getBet(id: string): Promise<Bet | undefined>;
  createBet(bet: InsertBet): Promise<Bet>;
  updateBet(id: string, updates: Partial<Bet>): Promise<Bet | undefined>;
  getBetsByParlay(parlayId: string): Promise<Bet[]>;

  getParlays(userId: string): Promise<Parlay[]>;
  getParlay(id: string): Promise<Parlay | undefined>;
  createParlay(parlay: InsertParlay): Promise<Parlay>;
  updateParlay(id: string, updates: Partial<Parlay>): Promise<Parlay | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(id: string, balance: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({ balance }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getGames(): Promise<Game[]> {
    return db.select().from(games);
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [created] = await db.insert(games).values(game).returning();
    return created;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const [game] = await db.update(games).set(updates).where(eq(games.id, id)).returning();
    return game || undefined;
  }

  async getGameCount(): Promise<number> {
    const result = await db.select().from(games);
    return result.length;
  }

  async getBets(userId: string): Promise<Bet[]> {
    return db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt));
  }

  async getBet(id: string): Promise<Bet | undefined> {
    const [bet] = await db.select().from(bets).where(eq(bets.id, id));
    return bet || undefined;
  }

  async createBet(bet: InsertBet): Promise<Bet> {
    const [created] = await db.insert(bets).values(bet).returning();
    return created;
  }

  async updateBet(id: string, updates: Partial<Bet>): Promise<Bet | undefined> {
    const [bet] = await db.update(bets).set(updates).where(eq(bets.id, id)).returning();
    return bet || undefined;
  }

  async getBetsByParlay(parlayId: string): Promise<Bet[]> {
    return db.select().from(bets).where(eq(bets.parlayId, parlayId));
  }

  async getParlays(userId: string): Promise<Parlay[]> {
    return db.select().from(parlays).where(eq(parlays.userId, userId)).orderBy(desc(parlays.createdAt));
  }

  async getParlay(id: string): Promise<Parlay | undefined> {
    const [parlay] = await db.select().from(parlays).where(eq(parlays.id, id));
    return parlay || undefined;
  }

  async createParlay(parlay: InsertParlay): Promise<Parlay> {
    const [created] = await db.insert(parlays).values(parlay).returning();
    return created;
  }

  async updateParlay(id: string, updates: Partial<Parlay>): Promise<Parlay | undefined> {
    const [parlay] = await db.update(parlays).set(updates).where(eq(parlays.id, id)).returning();
    return parlay || undefined;
  }
}

export const storage = new DatabaseStorage();
