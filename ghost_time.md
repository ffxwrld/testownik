# Problem "Ducha" (Czas 185 minut)

## Wyjaśnienie:
- Wartość 185 minut, która pojawiła się na wykresie i w statystykach tygodniowych, jest bezpośrednim skutkiem poprzedniego błędu z Anti-AFK.
- Ponieważ przez pewien czas aplikacja nie zatrzymywała licznika czasu w przypadku braku aktywności użytkownika, włączony w tle test po prostu "nabił" około 3 godzin pustego czasu nauki.
- Ten czas został prawidłowo (z punktu widzenia systemu) zsynchronizowany z bazą danych Supabase jako autentyczny czas nauki.
- Po naprawieniu funkcji Anti-AFK ten problem już nie wystąpi, ale dotychczasowy "duchowy czas" z dzisiaj pozostał w historii konta.
