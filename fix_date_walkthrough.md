# Poprawka Wykresu Kolumnowego (Statsy)

## Naprawione błędy:
1. **Przesunięcie strefy czasowej (UTC vs Lokalny czas)**
   - Algorytm, który rysował wykres aktywności (i przypisywał kolumny do konkretnych dni tygodnia), używał `Date.toISOString().split('T')[0]`.
   - Z racji tego, że jesteśmy w strefie czasowej różniącej się od UTC, funkcja ta systematycznie przekłamywała dni (np. północ dzisiaj wg UTC to ciągle "wczoraj").
   - Przez ten błąd tablica 7 dni celowała w okno od "wczoraj minus 7 dni" do "wczoraj", przez co cała dzisiejsza aktywność nie mieściła się na wykresie i był on pusty!
2. Zastąpiono mechanizm przeliczania dat tak, aby rygorystycznie używał lokalnego czasu przeglądarki (`getFullYear()`, `getMonth()`, `getDate()`).
