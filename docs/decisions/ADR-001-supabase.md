# ADR 001: Use Supabase as Backend

## Status
Accepted

## Context
The application is currently fully local and offline-first, using IndexedDB. We need to introduce social features (friends, leaderboards, user profiles) without sacrificing the offline-first experience for core features. We need a backend solution that prioritizes security, privacy (GDPR compliance), is free to start, and integrates well with our existing React/Vite stack.

## Decision
We will use **Supabase** as our backend. We will leverage:
- **Supabase PostgreSQL**: For storing user profiles, aggregated stats, and friendships.
- **Supabase Auth**: For user authentication using Magic Links (passwordless).
- **Row Level Security (RLS)**: To ensure users can only see stats of their accepted friends and modify only their own stats.

## Consequences
- **Positive**:
  - We get a robust PostgreSQL database with enterprise-grade security out of the box (RLS).
  - Open-source, easily self-hostable if we ever decide to move off the cloud.
  - EU-hosted regions available for GDPR compliance.
  - Magic Link auth aligns with the privacy-first approach (minimal data collection).
- **Negative/Trade-offs**:
  - Introduces a dependency on a managed service provider (Supabase).
  - Requires maintaining offline-sync logic on the client to ensure the app continues to function perfectly when offline.
