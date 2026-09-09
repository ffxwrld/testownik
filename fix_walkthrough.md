# Aktualizacja nawigacji - Poprawka (Statsy)

## Naprawione błędy:
1. **Brakująca ścieżka routingu dla StatsView**
   - Po kliknięciu zakładki "Statsy" aplikacja próbowała wejść na URL `/stats`, ale w pliku `App.tsx` nie było zdefiniowanej obsługi tego adresu. W rezultacie aplikacja automatycznie "cofała" użytkownika na Pulpit, co wyglądało tak, jakby zakładka nie działała.
   - Dodano brakujący routing (`if (loc === '/stats') return 'stats';` oraz uzupełniono tablicę `paths`).
2. **Niedziałające linki na Pulpicie**
   - Na karcie "Ranking" na ekranie Pulpitu, przycisk "Pełny >" prowadził pod stary adres `/ranking`. Został podmieniony na poprawny `/stats`.
3. **Kreator - stabilność**
   - Upewniono się, że po wyjściu z "Kreatora" w zakładce "Nauka" aplikacja nie przechowuje starych stanów, co mogło powodować zgrzyty przy tworzeniu nowych paczek.
