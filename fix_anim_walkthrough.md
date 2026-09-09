# Audyt Animacji (Emil Kowalski's Rules)

## Podsumowanie audytu:
Przeprowadzono pełen skan aplikacji pod kątem wytycznych projektowych (m.in. zasady Emila Kowalskiego dot. animacji UI). Aplikacja bazuje na `framer-motion` i w większości stosuje bardzo nowoczesne, przyjemne dla oka sprężyny (springs) oraz krzywe (cubic-beziers).

## Co poprawiono (mikro-optymalizacje):
1. **Layout Thrashing:** Usunięto użycia `transition-all` (m.in. w paskach postępu i liście gier multiplayer), zastępując je sprecyzowanymi wartościami (np. `transition-[width]`). Zabezpiecza to przed spadkiem klatek animacji na słabszych urządzeniach mobilnych, gdy przeglądarka niepotrzebnie przeliczała wszystkie atrybuty elementu.
2. **Pojawianie się ze zbytniego oddalenia:** Poprawiono menu/modal głównego layoutu, który wchodził ze `scale(0.8)`. Zgodnie z zasadami naturalnego UI zmieniono początkową wielkość na `scale(0.95)` — nic w naturze nie pojawia się z czystego zera (lub mikroskopijnych rozmiarów).
3. **Szybsze paski postępu:** Zmieniono `duration-300` na szybsze `duration-200 ease-out` przy Fiszki progress-bar, co daje poczucie "snappy" UI. Paski muszą natychmiast reagować na sukces użytkownika.
