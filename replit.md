# BetEdge Sportsbook

## Overview
A responsive sportsbook website with live in-play betting, same-game parlays, real-time stats, and early cash-out functionality. Built with React, Express, PostgreSQL, and WebSockets.

## Recent Changes
- 2026-02-14: Initial MVP built with full sportsbook functionality

## Architecture

### Frontend (client/)
- React SPA with wouter routing
- Shadcn UI components with dark/light theme
- WebSocket client for real-time odds updates
- Bet slip with singles and parlay modes
- Pages: Home (live/upcoming), Game Detail (markets/stats), My Bets, Sports

### Backend (server/)
- Express.js API server
- WebSocket server at /ws for live game updates
- Game simulator running every 5 seconds for live games
- PostgreSQL database via Drizzle ORM
- Demo user with $1000 starting balance

### Shared (shared/)
- schema.ts: Drizzle models for users, games, bets, parlays

### Key Features
- Live in-play betting with real-time odds movement
- Same-game parlay builder (2+ selections)
- Early cash-out on pending bets and parlays
- Real-time game stats (sport-specific)
- Mock wallet system

### Database
- PostgreSQL with Drizzle ORM
- Tables: users, games, bets, parlays
- Seed data: 10 games across NFL, NBA, MLB, Soccer

## User Preferences
- Dark mode default (sportsbook-appropriate green primary color)
