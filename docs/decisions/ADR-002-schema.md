# ADR 002: Database Schema Design for Gamification

## Status
Accepted

## Context
We need a robust data structure for the gamification and social features that respects user privacy and enables performant queries for the leaderboard and friend lists. The schema must enforce invariants and authorization at the database level.

## Decision
We will adopt a 3NF schema using PostgreSQL features. 
- **`profiles`**: Extends the `auth.users` table. Only stores a unique username and creation timestamps.
- **`user_stats`**: A 1:1 relation with `profiles`. Stores denormalized, aggregated statistics (XP, sessions, streaks). Kept separate to allow specific RLS policies (only visible to friends).
- **`friendships`**: A many-to-many self-referencing table between `profiles`. Uses a status enum (`pending`, `accepted`, `declined`).

All tables will use Row Level Security (RLS) to enforce that:
1. Profiles are public (to search for users).
2. Stats are only visible to the user and their accepted friends.
3. Friend requests can only be sent by the authenticated user.

## Consequences
- **Positive**: 
  - High security by default (RLS).
  - Data minimization (only aggregated stats go to the server, no actual test contents).
  - Fast leaderboard generation via indexed numerical columns.
- **Negative/Trade-offs**:
  - The client must compute aggregated stats locally and send deltas/totals to the server.
