# Aktualizacja nawigacji (Złączenie widoków)

## Zrealizowane zmiany:
1. **StatsView (Statystyki)**
   - Stworzono nowy widok łączący `ProgressView` (Twój Postęp) i `LeaderboardView` (Ranking).
   - Widoki można przełączać za pomocą przełącznika na samej górze ekranu.

2. **LearnView (Nauka / Moje Testy + Kreator)**
   - W sekcji "Nauka" umieszczono przełącznik "Moje Testy" i "Kreator".
   - Stan kreatora (edycja testów, zapamiętywanie formularza) został bezpiecznie przeniesiony wewnątrz `LearnView`. Kliknięcie edycji paczki płynnie przełącza na zakładkę Kreatora.
   - Po zapisaniu nowej paczki aplikacja automatycznie wraca do zakładki "Moje Testy".

3. **MainLayout i App.tsx (Główne menu)**
   - Zredukowano paski nawigacji z 6 zakładek głównych do zaledwie 4 (Pulpit, Graj, Nauka, Statsy).
   - Usunięto nieużywane już ścieżki i odpowiednio zoptymalizowano kod `App.tsx`.
