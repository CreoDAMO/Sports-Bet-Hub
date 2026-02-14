import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: real("balance").notNull().default(1000),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sport: text("sport").notNull(),
  league: text("league").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  status: text("status").notNull().default("upcoming"),
  quarter: text("quarter"),
  timeRemaining: text("time_remaining"),
  startTime: timestamp("start_time").notNull(),
  homeMoneyline: integer("home_moneyline").notNull(),
  awayMoneyline: integer("away_moneyline").notNull(),
  spread: real("spread").notNull(),
  spreadOdds: integer("spread_odds").notNull().default(-110),
  totalPoints: real("total_points").notNull(),
  overOdds: integer("over_odds").notNull().default(-110),
  underOdds: integer("under_odds").notNull().default(-110),
  homeStats: jsonb("home_stats"),
  awayStats: jsonb("away_stats"),
  featured: boolean("featured").notNull().default(false),
});

export const bets = pgTable("bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
  betType: text("bet_type").notNull(),
  selection: text("selection").notNull(),
  odds: integer("odds").notNull(),
  stake: real("stake").notNull(),
  potentialPayout: real("potential_payout").notNull(),
  status: text("status").notNull().default("pending"),
  cashOutValue: real("cash_out_value"),
  isParlay: boolean("is_parlay").notNull().default(false),
  parlayId: varchar("parlay_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const parlays = pgTable("parlays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  totalOdds: integer("total_odds").notNull(),
  stake: real("stake").notNull(),
  potentialPayout: real("potential_payout").notNull(),
  status: text("status").notNull().default("pending"),
  cashOutValue: real("cash_out_value"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
  parlays: many(parlays),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  bets: many(bets),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, { fields: [bets.userId], references: [users.id] }),
  game: one(games, { fields: [bets.gameId], references: [games.id] }),
  parlay: one(parlays, { fields: [bets.parlayId], references: [parlays.id] }),
}));

export const parlaysRelations = relations(parlays, ({ one, many }) => ({
  user: one(users, { fields: [parlays.userId], references: [users.id] }),
  legs: many(bets),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export const insertBetSchema = createInsertSchema(bets).omit({ id: true, createdAt: true });
export const insertParlaySchema = createInsertSchema(parlays).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Parlay = typeof parlays.$inferSelect;
export type InsertParlay = z.infer<typeof insertParlaySchema>;

export type GameStats = {
  possession?: number;
  shotsOnTarget?: number;
  totalShots?: number;
  fouls?: number;
  corners?: number;
  yellowCards?: number;
  redCards?: number;
  passingYards?: number;
  rushingYards?: number;
  turnovers?: number;
  timeOfPossession?: string;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  fieldGoalPct?: number;
  threePointPct?: number;
  hits?: number;
  errors?: number;
  strikeouts?: number;
  walks?: number;
};

export type BetSlipItem = {
  id: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  betType: "moneyline" | "spread" | "total" | "prop";
  selection: string;
  displaySelection: string;
  odds: number;
  stake: number;
};
