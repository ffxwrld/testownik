# Naprawa Anti-AFK

## Opis problemu:
Użytkownik zauważył, że system Anti-AFK nie działa (czas leciał dalej, a ekran informujący o braku aktywności się nie pojawiał). 

## Przyczyna:
Stan `isAfk` oraz śledzenie aktywności myszki/klawiatury (`lastActivityRef`) były poprawnie podpięte, ale sam interwał zliczający czas (`setInterval` w `useTestEngine.ts`) nie posiadał warunku sprawdzającego czas bezczynności. Referencja `lastActivityRef` była aktualizowana przy każdym kliknięciu, ale interwał nigdy z niej nie czytał.

## Zrealizowane zmiany:
1. **Warunek bezczynności:** Dodano w interwale zegara warunek: jeśli od ostatniej akcji minęło ponad 60 sekund (`Date.now() - lastActivityRef.current > 60000`), czas przestaje się liczyć, a `isAfk` ustawiane jest na `true`.
2. **Bezpieczny powrót:** Dodano nową funkcję `dismissAfk()`, która przypisana jest do przycisku "Wracam do nauki". Oprócz zamknięcia okienka drzemki, funkcja ta natychmiastowo resetuje czas aktywności (`lastActivityRef`), dzięki czemu po zamknięciu okienka odliczanie czasu wznawia się bez problemów.
