# Plan przebudowy nawigacji

## 1. Zmiana paska nawigacji (MainLayout.tsx)
Usuniemy stare zakładki (Ranking, Postępy, Kreator) i zostawimy cztery główne:
- Pulpit (DashboardView)
- Graj (MultiplayerView)
- Nauka (LearnView - nowa wersja)
- Statsy (StatsView - nowy widok)

## 2. Nauka (LearnView)
Dodamy na samej górze przełącznik zakładek (Tabs):
- **Moje Testy** -> obecny widok `LearnView` (lista sesji do załadowania)
- **Kreator** -> zagnieżdżony komponent `CreatorView`

## 3. Statsy (StatsView)
Stworzymy nowy komponent integrujący dwa stare:
Dodamy na samej górze przełącznik zakładek (Tabs):
- **Twój Postęp** -> zagnieżdżony `ProgressView`
- **Ranking** -> zagnieżdżony `LeaderboardView`

## 4. App.tsx
Zaktualizujemy routing (`displayPhase`) żeby obsługiwał nowy, uproszczony układ.
