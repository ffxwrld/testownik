# Możliwość usunięcia konta

- **Interfejs (ProfileView)**: Dodano czerwoną, ostrzegawczą "Strefę niebezpieczną" (Danger Zone) na samym dole karty profilu, która zawiera przycisk trwałego usunięcia konta.
- **Zabezpieczenie**: Kliknięcie przycisku wywołuje okienko z prośbą o potwierdzenie tej nieodwracalnej akcji, żeby uniknąć przypadkowego kliknięcia.
- **Logika autoryzacji (useAuth)**: Zaktualizowano hook `useAuth`, by wywoływał procedurę `delete_user` ze strony serwera (Supabase) i poprawnie czyścił sesję z wylogowaniem.
