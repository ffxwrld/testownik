# 📋 Testownik — Backlog & Lista Zadań (TODO)

Stan projektu: **v1.1.3** | Stabilny build | TypeScript 0 błędów | Testy: 48/48 PASS | 100% Bilingual PL/EN

---

## 🎯 Najbliższe Zadania (Priorytety)

### 1. ⚡ Optymalizacja Bundle Size i Code-Splitting
- [x] Zastąpienie synchronicznych importów ciężkich widoków dynamicznym `React.lazy()` + `Suspense` w `App.tsx`:
  - `CreatorView`, `ScheduleView`, `GameHubView`, `SoloGameView`, `FlashcardsView`, `StatsView`, `ProfileView`, `FriendsView`, `TestView`, `SummaryView`.
  - Architektura persistent layout: zachowanie stałego sidebar/navbaru podczas dociągania chunków bez migotania ekranu.
- [x] Konfiguracja podziału chunków w `vite.config.ts` (`rollupOptions.output.manualChunks` dla KaTeX, Calendar, Supabase, Framer Motion, Markdown, JSZip, React).
- [x] Wynik: Zmniejszenie początkowego bundle JS z **1.84 MB** do **298 kB** (85 kB gzip) — spadek o **83.8%**!

### 2. 🧪 Pokrycie Testami Silników Domenowych (Test Coverage)
- [x] Testy jednostkowe hooka `useTestEngine` (5/5 PASS):
  - Inicjalizacja, kolejka pytań i przechodzenie do kolejnych pytań.
  - Weryfikacja pojedynczego wyboru i wielokrotnego wyboru (częściowy wybór błędny, pełny poprawny).
  - Pomijanie pytań (zatwierdzenie pustego wyboru) i dodawanie do kolejki powtórek.
  - Zapisywanie stanu poprzedniego pytania (`previousQuestion`) i postępu w sesji.
- [x] Testy jednostkowe hooka `useFlashcardsEngine` (7/7 PASS):
  - Odwracanie karty, akcja `markKnown` vs `markRepeat`.
  - Obsługa defensywna końca puli kart (Out-of-Bounds prevention, brak przepełnienia indeksu) oraz restart.
- [x] Testy jednostkowe hooka `useSoloGameEngine` (8/8 PASS):
  - Naliczanie punktacji i progresja mnożników combo (`COMBO_MULTIPLIERS` x1 -> x4).
  - Mechanika serc w Sudden Death (utrata życia, blokada inputu i game over przy 0 żyć).
  - Bonusy (+3s) i kary czasowe (-5s) w Time Attack.
  - Płynne podsumowanie i zapis w trybie Zen (`handleFinishZen`).

### 3. 🎨 Szlif Ekranu Rozwiązywania Testu (`TestView` & `QuestionCard`)
- [x] Zgodność z Apple HIG i `UI_UX_DESIGN_SPEC.md`:
  - Dopracowanie focus ringów (`focus-visible:ring-2`) i ergonomii klawiatury (1-9 w jedno- i wielokrotnym wyborze, `Spacja` / `Enter` w legendzie skrótów).
  - Skalowanie i dedykowany modal Lightbox dla grafik w treści pytań (`[img]...[/img]` oraz fallback) z płynnym zoomem (+, -, 100%), klawiszem `Esc` i panowaniem myszką.
  - Justowanie i czytelność formuł matematycznych KaTeX na telefonach (dedykowany horyzontalny scrollbar bez rozpychania karty).
  - Płynny collapse paska bocznego `TestSidebar` na desktopie (przełącznik z ikoną w nagłówku, floating action dock) oraz kompaktowy pasek z safe-area na telefonach.

### 4. 📚 Przypisanie Przedmiotu do Testu (Kategorie / Przedmioty)
- [ ] Rozszerzenie modelu danych (`SessionState`, `SavedSessionMetadata`) o pole `subject?: string` (oraz opcjonalnie `subjectColor?: string`).
- [ ] UI zarządzania przedmiotem:
  - Pole wyboru/wpisania przedmiotu w formularzu nowego testu oraz w menu opcji kafelka paczki (`SessionsList`).
  - Badge z nazwą i kolorem przedmiotu na kafelkach testów w widoku Nauki i Pulpitu.
  - Filtrowanie paczek pytań według przedmiotów na liście testów.
  - Integracja z Harmonogramem: automatyczne powiązanie egzaminów z przedmiotem.

### 5. 🎮 Gruntowna Naprawa i Dopracowanie Trybów Gry (Game Modes Overhaul)
- [x] **Audyt i naprawa trybów Solo (`useSoloGameEngine` & `SoloGameView`)**:
  - **Sudden Death**: Poprawna utrata serc, natychmiastowe zablokowanie inputu przy 0 żyć (likwidacja wyścigu zdarzeń z Enter/Spacja).
  - **Time Attack**: Stabilny zegar bez timer drift (timestamp delta timing), animowany floating wskaźnik bonusu (+3s) i kary (-5s), brak niszczenia/stawiania interwału co odpowiedź.
  - **Trening Zen**: Możliwość eleganckiego zakończenia sesji z zachowaniem statystyk (`handleFinishZen` w HUD) oraz automatyczne podsumowanie i zapis po przejściu całej talii.
  - **Klawiatura i Input**: Dynamiczna obsługa klawiszy 1-9, ukrycie mylącego Backspace w arcade (`hideNavigationHints`), i18n na przycisku zatwierdzenia wielokrotnego wyboru.
  - **Audio & FX**: Odblokowanie AudioContext gestem użytkownika (`pointerdown`/`keydown`), zbalansowana głośność buzzera błędu, synchronizacja wyciszenia zdarzeniem systemowym `testownik-sound-toggle`.
  - **Persystencja rekordów**: Stabilne przekazywanie statystyk do `arcadeStorage` przez `statsRef`.
- [x] **Audyt trybu Multiplayer (`useMultiplayer` & `MultiplayerView`)**:
  - Stabilność połączeń WebRTC P2P (room signaling, obsługa rozłączeń graczy, ICE timeout na eduroam/NAT zwiększony z 1.5s do 4s).
  - Likwidacja synchronicznych, blokujących `alert()` na rzecz powiadomień `toast` z `sonner`.
  - Naprawa desynchronizacji rewanżu (`rematchEventCount` automatycznie restartuje sesję i przełącza gości z `SummaryView` do `TestView`).
  - Synchronizacja toru wyścigu (`MultiplayerRaceTrack`) i ekranu podium (`MultiplayerPodium`) z obsługą graczy rozłączonych (status DNF).

### 6. 🧹 Porządki w Repozytorium (Git Housekeeping)
- [x] Usunięcie niepotrzebnych plików tymczasowych i patchy z katalogu głównego (`showcase.html`, stare pliki `.patch` i `.sql`).
- [x] Zaktualizowanie `.gitignore` (ignorowanie `graphify-out/` oraz `strix_runs/`).
- [x] Przygotowanie spójnego commita w git podsumowującego refaktoryzację (nagłówki, i18n, bezpieczeństwo, optymalizacja bundle, testy silników domenowych).

---

## ✅ Zrealizowane Kamienie Milowe

- [x] **100% Bilingual i18n (PL / EN)**:
  - Symetryczne słowniki `pl.json` i `en.json` dla wszystkich widoków, nagłówków, kart i modali.
  - Dynamiczne przełączanie języka w locie i persystencja w pamięci.
  - Lokalizacja kalendarza egzaminów, dat sesji oraz powiadomień.
- [x] **Ujednolicenie Nagłówków (`PageHeader`)**:
  - Wdrożenie standardowego komponentu `PageHeader` we wszystkich 7 głównych widokach (Pulpit, Graj, Nauka, Harmonogram, Statystyki, Profil, Znajomi).
- [x] **Eliminacja Mikro-Zacięć i Zbędnych Animacji**:
  - Usunięcie kaskadowych opóźnień (`staggerChildren`) i blokujących wejść kart przy przełączaniu zakładek.
  - Natychmiastowe ładowanie widoków (0ms opóźnienia).
- [x] **Audyt Jakościowy i Typowania**:
  - Wyeliminowanie 100% `any` i dyrektyw `// @ts-ignore`.
  - Wzmocnienie bezpieczeństwa IPC w Electronie (`nodeIntegration: false`).
  - Bezpieczny renderer Markdown/KaTeX z ograniczeniem XSS.
