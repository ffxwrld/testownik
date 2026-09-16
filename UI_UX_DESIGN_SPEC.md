# 🎨 Specyfikacja Wizualna i Audyt UI/UX — Testownik

> **Dokumentacja wzornicza (Design System & Product Specification)**  
> **Wersja:** 1.1.3 (Vite + React 19 + Tailwind CSS v4 + Framer Motion)  
> **Zastosowanie:** Dokument źródłowy dla narzędzi Figma, Figma AI, Design System Ops oraz architektów produktu do przeprowadzenia całościowego redesignu i szlifu estetycznego.

---

## 1. Design System & Tokeny Wizualne

Aplikacja oparta jest na nowoczesnym silniku **Tailwind CSS v4** z definicjami wstrzykiwanymi dynamicznie w `src/index.css`. Wygląd łączy zasady **Apple Human Interface Guidelines (HIG)**, rygor przestrzenny oraz estetykę dark/light mode inspirowaną natywnym oprogramowaniem macOS.

### 1.1 Paleta Kolorów

#### Tryby Bazowe (Light & Dark Mode)
Aplikacja przełącza się klasą `.dark` na elemencie `<html>`.

| Rola w UI | Tryb Jasny (Light) | Tryb Ciemny (Dark) | Zastosowanie |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#fafafa` (`zinc-50`) | `#09090b` (`zinc-950`) | Główne tło okna, body, tło głównego scrollera |
| **Surface / Card** | `#ffffff` (`white`) | `#18181b` (`zinc-900`) | Kafelki, kontenery, panele danych, edytor |
| **Subtle Surface** | `#f4f4f5` (`zinc-100`) | `#27272a` (`zinc-800`) | Wewnętrzne tła, segmenty, hover stanów |
| **Hairline Border** | `rgba(228, 228, 231, 0.8)` (`zinc-200/80`) | `rgba(39, 39, 42, 0.8)` (`zinc-800/80`) | Ramki kart, separatory list, paski narzędzi |
| **Muted Border** | `rgba(212, 212, 216, 0.6)` (`zinc-300/60`) | `rgba(63, 63, 70, 0.6)` (`zinc-700/60`) | Obramowania kontrolek formularzy, inputy |
| **Text Primary** | `#18181b` (`zinc-900`) | `#fafafa` (`zinc-50`) | Nagłówki h1–h3, główne pytania, kluczowe liczby |
| **Text Secondary** | `#71717a` (`zinc-500`) | `#a1a1aa` (`zinc-400`) | Opisy, podtytuły, etykiety sekcji |
| **Text Muted** | `#a1a1aa` (`zinc-400`) | `#71717a` (`zinc-500`) | Skróty klawiszowe, pomocnicze daty, metadane |

#### Dynamiczny Akcent Główny (Dynamic Theme Colors)
Kolor akcentu jest dynamiczny i sterowany atrybutem `html[data-theme="..."]`. Definiuje on pełną 11-stopniową skalę `primary-50` do `primary-950` mapowaną na zmienne `--theme-*`.

- **Domyślny (Default Blue):** `var(--color-blue-*)` — odcień `primary-600` (`#2563eb`), w dark mode `primary-500` (`#3b82f6`).
- **Wariant Violet:** `html[data-theme="violet"]` — `var(--color-violet-*)`.
- **Wariant Rose:** `html[data-theme="rose"]` — `var(--color-rose-*)`.
- **Wariant Emerald:** `html[data-theme="emerald"]` — `var(--color-emerald-*)`.
- **Wariant Amber:** `html[data-theme="amber"]` — `var(--color-amber-*)`.

#### Kolory Semantyczne i Stanów
- **Success (Poprawna odpowiedź, Opanowane):**
  - Akcent: `emerald-500` (`#10b981`), hover `emerald-600` (`#059669`).
  - Tło podświetlenia: Light `emerald-500/10`, Dark `emerald-500/20`.
  - Ramka: `border-emerald-500/40` lub `border-emerald-200/80`.
- **Danger / Destructive (Błąd, Odrzucenie, Porażka, Kasowanie):**
  - Akcent: `rose-600` (`#e11d48`) / `red-500` (`#ef4444`).
  - Tło podświetlenia: Light `rose-500/10`, Dark `rose-500/20`.
  - Ramka: `border-rose-500/40` lub `border-red-200/80`.
- **Warning (Uwaga, Czas na ukończeniu, Streak):**
  - Akcent: `amber-500` (`#f59e0b`).
  - Tło: `amber-500/10`, ciemne `amber-950/30`.
- **Gamification / XP & Trophy:**
  - Gold: `amber-400` (`#fbbf24`), `yellow-500` (`#eab308`).
  - Silver: `zinc-300` / `zinc-600`.
  - Bronze: `amber-700` (`#b45309`).

---

### 1.2 Typografia

Aplikacja bazuje na systemowym stosie krojów pisma (Apple SF Pro Display / SF Pro Text w środowisku macOS).

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

#### Hierarchia Skali Typograficznej
- **Display / H1 (Ekrany główne, Liczniki):** `text-2xl sm:text-3xl font-bold tracking-tight` (28px / 32px, letter-spacing -0.02em).
- **Section Heading / H2:** `text-xl md:text-2xl font-bold tracking-tight` (20px / 24px).
- **Card Title / H3:** `text-lg md:text-xl font-semibold text-zinc-900 dark:text-zinc-100` (18px / 20px).
- **Subheadings & Labels:** `text-sm font-semibold tracking-wide` (14px).
- **Body Regular:** `text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300` (14px / 16px).
- **Eyebrow / Overline:** `text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400`.
- **Data / Stats / Timers:** `tabular-nums font-black text-2xl md:text-4xl tracking-tight` (cyfry o stałej szerokości dla eliminacji drżenia przy odliczaniu).
- **Matematyka i formuły:** Wbudowane renderowanie KaTeX (`.katex`) ze zoptymalizowanym rozmiarem i justowaniem w treści pytań.

---

### 1.3 Kształty, Zaokrąglenia i Głębia (Radius & Elevation)

Zasada: **Koncentryczność promieni (Concentric Radii)** — elementy zagnieżdżone posiadają proporcjonalnie mniejsze zaokrąglenie niż ich kontenery.

- **Karty Hero / Duże Panele:** `rounded-3xl` (24px).
- **Karty Standardowe / Listy / Segmented Controls:** `rounded-2xl` (16px).
- **Przyciski główne / Kontrolki:** `rounded-xl` (12px).
- **Przyciski małe / Badges / Tagi:** `rounded-lg` (8px).
- **Kapsuły / Avatary / Floating Pill:** `rounded-full` (9999px).

#### Cienie i Warstwy (Elevation)
- **Karty statyczne:** `shadow-xs` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`) — subtelne odcięcie bez ciężkich, brudzących cieni.
- **Karty aktywne / Hover:** `shadow-sm` lub `shadow-md` z przejściem koloru ramki.
- **Modale i dialogi:** `shadow-[0_24px_64px_rgba(0,0,0,0.25)]` z tłem `backdrop-blur-2xl` lub `backdrop-blur-3xl`.
- **Paski pływające (HUD):** `shadow-lg border border-white/60 dark:border-white/10 backdrop-blur-xl`.

---

### 1.4 Komponenty Bazowe (UI Kit Specs)

#### Przyciski (`Button.tsx`)
Wysokość określona z góry (Fixed Touch Targets):
- `sm`: wysokość 32px (`h-8 px-3 text-xs rounded-lg`).
- `md`: wysokość 44px (`h-11 px-4 text-sm rounded-xl`) — zgodne ze standardem 44pt Apple Touch Target.
- `lg`: wysokość 48px (`h-12 px-6 text-base rounded-xl`).
- `xl`: wysokość 56px (`h-14 px-8 text-lg rounded-2xl`).
- **Mikrointerakcja:** `active:scale-[0.98] transition-all duration-150 cursor-pointer`.

#### Karty (`Card.tsx`)
- Domyślnie ostre, solidne tło: `bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs`.
- Opcja `glass={true}`: używana wyłącznie w pływających kapsułach.
- Warianty paddingu: `sm` (12px), `md` (16-20px), `lg` (24px), `xl` (24-32px).

#### Segmented Control (Apple-Style)
Pojemnik o twardym zaokrągleniu `p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50`.
Aktywna pigułka przemieszcza się płynnie dzięki Framer Motion (`layoutId` ze sprężyną `stiffness: 400, damping: 30`), podczas gdy etykiety zachowują stabilną typografię.

---

## 2. Architektura Układu (App Shell & Navigation)

```
+------------------------------------------------------------------------------------+
| ELECTRON WINDOW (1200 x 800 min 800x600)                                           |
+---------------------+--------------------------------------------------------------+
| SIDEBAR (w-64)      | MAIN SCROLL CONTAINER (<main ref={mainRef}>)                 |
|                     | max-w-5xl mx-auto px-4 md:px-8 py-8                          |
| [Logo] Testownik    |                                                              |
|                     | [Page Title & Segmented Navigation Pill]                     |
| Primary Nav:        | ------------------------------------------------------------ |
| - Pulpit            |                                                              |
| - Graj              | [Hero Card / Metric Summary]                                 |
| - Nauka             |                                                              |
| - Harmonogram       | [Main Content Grid / Question Workspace / Calendar]          |
| - Statystyki        |                                                              |
|                     |                                                              |
| Secondary Nav:      |                                                              |
| - Znajomi           |                                                              |
|                     |                                                              |
| [User Level & XP]   | (Automatyczny reset scrolla scrollTo(0,0) przy zmianie fazy) |
+---------------------+--------------------------------------------------------------+
| MOBILE VIEW: Fixed Bottom Tab Bar (h-16 pb-safe) + Floating Profile Top Right      |
+------------------------------------------------------------------------------------+
```

### 2.1 Desktop Shell
- **Pasek boczny (Sidebar):** Stała szerokość 256px (`w-64`), przypięty do lewej krawędzi (`fixed top-0 left-0 bottom-0`). Posiada `backdrop-blur-xl`, delikatną prawą ramkę `border-r border-zinc-200/50 dark:border-zinc-800/50`.
- **Główna przestrzeń robocza:** `flex-1 md:ml-64 overflow-y-auto h-full`. Cała nawigacja deleguje przewijanie wyłącznie do tego jednego kontenera.
- **Maksymalna szerokość treści:** `max-w-5xl` (1024px), wycentrowana w poziomie z obustronnym bezpiecznym marginesem `px-4 md:px-8`.

### 2.2 Mobile Shell
- **Pasek dolny (Bottom Dock):** `fixed bottom-0 left-0 right-0 z-40`, podparty rozmyciem `backdrop-blur-md` oraz tłem `bg-white/90 dark:bg-[#0f0f13]/90`.
- **Safe Area Insets:** Precyzyjne wsparcie dla dolnego paska domowego iOS/macOS (`pb-[calc(0.5rem+env(safe-area-inset-bottom))]`).
- **Pływający Profil:** Dyskretna pigułka/avatar w prawym górnym rogu ekranu (`top-[max(1rem,env(safe-area-inset-top))] right-4`), zapewniająca szybki dostęp do profilu bez zajmowania miejsca w dolnym docku.

---

## 3. Przegląd Ekranów (Screen-by-Screen Breakdown)

---

### 3.1 Pulpit (`DashboardView.tsx`)

- **Cel i punkt skupienia:** Podsumowanie stanu nauki, licznik dni do najbliższego egzaminu, natychmiastowe wznowienie ostatnio rozwiązywanego testu.
- **Hierarchia wizualna:**
  1. **Zintegrowany Nagłówek & Cel:** Imię użytkownika, liczba ukończonych sesji, łączny czas nauki oraz kafelka „Cel na dziś” / „Do egzaminu zostało X dni”.
  2. **Hero Card Ostatniego Testu:** Duży kafelek z paskiem postępu opanowania bazy, liczbą pytań i głównym przyciskiem akcji „Kontynuuj naukę” lub „Zacznij od nowa”.
  3. **Dolny Grid (Podział 2:1):**
     - Lewa kolumna (2 spans): Ostatnie starsze bazy pytań z przyciskiem szybkiego uruchomienia.
     - Prawa kolumna (1 span): Skrócona tabela liderów (Top 5 ze znajomych) z medalami 1, 2, 3 miejsca.
- **Stany ekranu:**
  - *Brak aktywnych baz:* Czysty, zachęcający banner z przyciskiem „Dodaj paczkę”.
  - *Aktywna baza bez terminu:* Ukrycie licznika dni bez pustych dziur w układzie.

---

### 3.2 Tryb Rozwiązywania Testu (`TestView.tsx`)

- **Cel i punkt skupienia:** Maksymalna koncentracja (zero-distraction mode). Odpowiedzi na pytania, natychmiastowy feedback logiczny, nauka wielokrotnego powtórzenia (algorytm wymaganej serii poprawnych odpowiedzi).
- **Hierarchia wizualna:**
  1. **Pasek stanu (`TestHeader`):** Licznik zrobionych pytań, stoper rzeczywistego czasu nauki, miniaturowy pasek postępu, wskaźnik podziału na części (Chunking) oraz przycisk wyjścia z potwierdzeniem.
  2. **Pasek rywalizacji na żywo (`MultiplayerRaceTrack`):** Gdy w pokoju multiplayer — horyzontalny tor wyścigowy z płynnie sunącymi awatarami przeciwników.
  3. **Karta pytania (`QuestionCard`):**
     - Numer i status (Jednokrotny / Wielokrotny wybór, wskaźnik trudności pytania).
     - Treść pytania z obsługą Markdownu, tabel oraz wzorów KaTeX.
     - Zdjęcie (jeśli dołączone do pytania) z możliwością powiększenia.
     - Kafelki odpowiedzi: wyraźne litery klawiaturowe (A, B, C, D), duża powierzchnia klikalna, stany wyboru (obramowanie akcentowe), stany weryfikacji (zielony sukces, czerwony błąd z ujawnieniem poprawnych opcji).
  4. **Pasek narzędziowy / Dok boczny (`TestSidebar`):**
     - Kropki wymaganej serii (Streak Dots) symbolizujące ile razy z rzędu trzeba odpowiedzieć poprawnie, by pytanie zniknęło z puli.
     - Przycisk główny: „Zatwierdź odpowiedź” (Enter) / „Następne pytanie” (Spacja/Enter).
     - Opcjonalny podgląd poprzedniego pytania (`PreviousQuestionModal`).
- **Obsługa stanów specjalnych:**
  - *AFK Detection:* Automatyczne wstrzymanie stopera po 45s bezczynności z modalem wznowienia.
  - *Ukończenie części bazy (Chunk Completion):* Modal z gratulacjami i opcją przejścia do kolejnej partii.

---

### 3.3 Podsumowanie Wyników (`SummaryView.tsx`)

- **Cel i punkt skupienia:** Podsumowanie ukończonego testu, celebracja osiągnięcia, analiza najtrudniejszych pytań i eksport.
- **Hierarchia wizualna:**
  1. **Banner Sukcesu:** Duży puchar/emotikon, ocena opisowa (Nieskazitelny, Sprinter, Opanowany), animowane cząsteczki sukcesu przy 100%.
  2. **Kluczowe metryki w kafelkach:** Celność (procentowo i liczba bezbłędnych za 1. razem), Całkowity czas, Średni czas na pytanie, Liczba błędów.
  3. **Lista najtrudniejszych pytań:** Rozwijane kafelki pytań, w których popełniono najwięcej błędów, z pełnym podglądem pytań i poprawnych odpowiedzi.
  4. **Pasek akcji:** „Powtórz błędne pytania”, „Rozpocznij od nowa”, „Eksportuj do PDF”.

---

### 3.4 Kreator Testów (`CreatorView.tsx`)

- **Cel i punkt skupienia:** Zaawansowane środowisko desktopowe do tworzenia, edycji pytań, formatowania wzorów matematycznych i dodawania multimediów.
- **Hierarchia wizualna:**
  1. **Pasek tytułowy (`CreatorHeader`):** Pole nazwy paczki, licznik pytań, przycisk zapisu do bazy lokalnej, eksport do pliku ZIP.
  2. **Panel boczny z listą (`CreatorSidebar`):** Wyszukiwarka pytań, miniatury z numeracją i wskaźnikiem poprawnych odpowiedzi, drag-and-drop kolejności, szybkie duplikowanie i usuwanie.
  3. **Edytor centralny (`CreatorEditor`):**
     - Pole tekstowe pytania z paskiem narzędzi Markdown (pogrubienie, kursywa, kod, formuła KaTeX `$...$`, lista).
     - Strefa przeciągania obrazka (Drag & Drop) z podglądem i usuwaniem.
     - Dynamiczna lista odpowiedzi: możliwość dodawania dowolnej liczby wariantów, oznaczanie poprawnych (checkbox/radio), przycisk usuwania wariantu.

---

### 3.5 Tryb Fiszek (`FlashcardsView.tsx`)

- **Cel i punkt skupienia:** Szybka nauka pamięciowa w stylu Anki / Quizlet.
- **Hierarchia wizualna:**
  1. **Główna Karta 3D:** Fizyczny obrót karty w osi X (`rotateX: 180deg`), awers z treścią pytania i notatką, rewers z wyróżnioną na zielono poprawną odpowiedzią.
  2. **Klawisze skrótów:** Spacja = obrót, Strzałka w lewo / 1 = „Jeszcze raz”, Strzałka w prawo / 2 = „Znam”.
  3. **Przyciski decyzyjne:** Czerwona pigułka „Powtórz” vs Zielona pigułka „Znam”.

---

### 3.6 Baza Materiałów do Nauki (`LearnView.tsx`)

- **Cel i punkt skupienia:** Centralny hub zarządzania plikami i bazami pytań użytkownika.
- **Hierarchia wizualna:**
  1. **Nagłówek i Przełącznik Trybu:** Segmented control „Testy” vs „Fiszki”.
  2. **Strefa akcji:** Przycisk uruchomienia Kreatora, przycisk importu pliku `.zip` / `.txt`, strefa przeciągania plików na całe okno.
  3. **Siatka baz pytań (`SessionsList`):** Kafelki baz z tytułem, datą edycji, paskiem postępu, szybkim edytorem nazwy (inline rename) oraz menu akcji.

---

### 3.7 Harmonogram (`ScheduleView.tsx`)

- **Cel i punkt skupienia:** Planowanie nauki pod kątem zbliżających się kolokwiów i egzaminów.
- **Hierarchia wizualna:**
  1. **Top Hero:** Licznik nadchodzących egzaminów, przycisk szybkiego przypisania terminu do bazy.
  2. **Kalendarz Główny:** Integracja stylów Apple Calendar z widokiem Miesiąca i Agendy. Wyraźne kropki i znaczniki egzaminów powiązanych bezpośrednio z paczkami pytań.

---

### 3.8 Centrum Rozgrywki (`GameHubView.tsx` & `MultiplayerView.tsx`)

- **Cel i punkt skupienia:** Rywalizacja solo na rekordy oraz pojedynki wieloosobowe.
- **Tryby Solo:**
  - *Sudden Death (Śmierć Nagła):* Hero banner w odcieniach rose/crimson. 1 błąd = koniec gry.
  - *Time Attack:* 60-sekundowy wyścig z czasem.
  - *Tryb Zen:* Spokojna sesja bez limitów czasu i utraty żyć.
- **Tryb Wieloosobowy:** Tworzenie pokoju P2P (WebRTC), 6-cyfrowy kod wejścia, automatyczny transfer pytań od hosta do graczy w formie Blob ZIP.

---

## 4. Mikrointerakcje i Animacje

System interakcji został oczyszczony z wolnych animacji wejścia na rzecz **błyskawicznej responsywności (0ms latency)** zgodnie z wytycznymi Apple Design (*WWDC Designing Fluid Interfaces*):

- **Przełączanie zakładek:** Natychmiastowe (brak sztucznego wygaszania `AnimatePresence` na głównych ekranach).
- **Segmented Control Pill:** Sprężyna krytycznie tłumiona (`type: "spring", stiffness: 400, damping: 30`), płynnie przemieszczająca białą/ciemną pigułkę pod aktywną opcją.
- **Reakcja na wciśnięcie (Press Feedback):** Wszystkie elementy klikalne posiadają natychmiastową reakcję na wciśnięcie `active:scale-[0.98]` lub `whileTap={{ scale: 0.96 }}` z czasem powrotu poniżej 150ms.
- **Usuwanie elementów z list:** `AnimatePresence` z płynnym kurczeniem (`exit={{ opacity: 0, scale: 0.95 }}`) oraz animacją sąsiednich elementów dzięki propowi `layout`.
- **System powiadomień:** Biblioteka `sonner` umieszczona w stałym rogu, powiadomienia z ikonami sukcesu/błędu.

---

## 5. Zidentyfikowane Tarcia Wizualne i Niespójności (Heuristic Flaws)

Podczas dogłębnej inspekcji kodu zidentyfikowano następujące obszary do usprawnienia w fazie projektowej w Figmie:

1. **Niejednorodne promienie zaokrągleń (Radius Inconsistency):**
   - W większości miejsc używane jest `rounded-2xl` (16px) oraz `rounded-3xl` (24px), jednak w starszych modalach i inputach pojawiają się surowe `rounded-lg` (8px) oraz `rounded-md` (6px), co na monitorach o wysokiej gęstości pikseli sprawia wrażenie niespójnego wieku komponentów.
2. **Zagospodarowanie szerokości na ekranach Ultra-Wide (> 1440px):**
   - Sztywny limit `max-w-5xl` na monitorach 27"–32" powoduje powstawanie pustych przestrzeni po prawej stronie. Widoki takie jak `ScheduleView` czy `ProgressView` mogłyby zyskać układ 2- lub 3-kolumnowy z dedykowanym panelem bocznym na szerokich ekranach.
3. **Integracja paska okna Electrona na macOS:**
   - Aplikacja używa obecnie standardowej ramki okna. Nowoczesne aplikacje na macOS (jak Apple Music, Craft, Raycast) korzystają z `titleBarStyle: 'hiddenInset'`, co pozwala wtopić przyciski okna (traffic lights) bezpośrednio w tło lewego sidebara, eliminując dodatkowy 28-pikselowy szary pasek u góry.
4. **Zróżnicowanie pustych stanów (Empty States):**
   - Niektóre ekrany mają pięknie ostylowane puste stany z ilustracją i CTA (np. ekran nauki), podczas gdy inne (np. lista starszych testów na pulpicie) używają prostej przerywanej ramki `border-dashed` z surowym szarym tekstem.
5. **Hierarchia kolorów w trybie ciemnym:**
   - Tło `#09090b` w połączeniu z kartami `#18181b` i ramkami `border-zinc-800/80` ma bardzo zbliżony kontrast luminancji (różnica ~5%). Przy słabszych matrycach IPS karty mogą zlewać się z tłem. Warto rozważyć subtelne rozjaśnienie powierzchni kart do `#1c1c21` lub zastosowanie delikatnego wewnętrznego cienia (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`).

---

## 6. Gotowy Blok do Wklejenia do Figmy / Redesign AI

Poniższy prompt w języku angielskim jest gotowy do skopiowania i wklejenia do **Figma AI, Claude for Design, Midjourney/UI Prompters** lub jako brief dla projektanta Product Designer:

```markdown
Act as a Principal Product & UI/UX Designer specializing in Apple Human Interface Guidelines (macOS & iOS) and high-end desktop productivity software (like Linear, Raycast, Things 3, and Apple Music).

I need a comprehensive, world-class redesign concept for "Testownik" — a modern, hybrid desktop/web flashcard and exam study engine built with React 19, Electron, and Tailwind CSS v4.

### 1. Visual Language & Aesthetics:
- **Style:** Pure Apple macOS Tahoe/Sequoia aesthetics — ultra-crisp typography, concentric rounded corners (12px buttons, 16px cards, 24px hero containers, 9999px pills), subtle 1px hairline borders (`rgba(255,255,255,0.08)` on dark, `rgba(0,0,0,0.08)` on light), and delicate ambient depth.
- **Color Palette:**
  - Dark Canvas: `#0a0a0c` (rich obsidian) with surface elevation `#141418` and interactive elements `#1e1e24`.
  - Light Canvas: `#fafafa` with pure white cards `#ffffff` and subtle hover states `#f4f4f6`.
  - Accent System: Dynamic primary tint (Default Electric Blue `#2563eb`, with user-switchable Violet, Rose, Emerald, and Amber accents).
  - Status Colors: Vivid Emerald (`#10b981`) for correct answers/mastery, Radiant Rose (`#f43f5e`) for errors/danger, Warm Amber (`#f59e0b`) for streaks & exam countdowns.
- **Typography:** SF Pro Display for bold tracking-tight headings, SF Pro Text for readable questions, and SF Mono for KaTeX math and keyboard shortcuts. Tabular numerals for all countdowns and XP counters.

### 2. Core Layout & Navigation:
- **Desktop Shell:** Integrated macOS titlebar with hidden inset window controls (traffic lights seamlessly embedded into the left sidebar header). Left navigation sidebar (width 256px) featuring:
  - App brand mark and workspace selector at the top.
  - Primary tabs: Dashboard (Pulpit), Play/Game Hub (Graj), Study Decks (Nauka), Exam Schedule (Harmonogram), Analytics (Statystyki).
  - Bottom docked section: Social/Friends tab and mini Profile card with Level badge, Avatar, and XP bar.
- **Main Viewport:** Centered responsive content container (`max-w-5xl` up to 1280px wide) with instantaneous, zero-latency transitions and flawless scrolling.

### 3. Deliver High-Fidelity UI Screens For:
1. **Pulpit (Dashboard View):**
   - Top greeting with integrated study metrics and exam countdown capsule ("3 days left until Biologia Egzamin — daily goal: 45 questions").
   - Large Hero Card for the most recent test deck with progress ring/bar and one-click "Resume Study" button.
   - 2-column lower grid: Recent question sets + Mini Friends Leaderboard widget.
2. **Obszar Testu (Test Engine Screen):**
   - Distraction-free exam mode with top minimalist HUD (question countdown, elapsed study timer, chunk progress).
   - Multiplayer live racetrack bar showing opponent positions in real time.
   - Large central Question Card rendering rich Markdown, LaTeX equations, and attached high-res diagrams.
   - 4 choice buttons (A, B, C, D) with distinct keyboard shortcut badges and instant emerald/rose feedback states.
   - Right-hand floating action pill with streak dots (consecutive correct requirement) and "Confirm / Next" button.
3. **Kreator Pytań (Question Creator & Editor):**
   - Full-window IDE experience: Left reorderable list of questions with status badges and search; center rich Markdown/KaTeX editor with floating formatting toolbar, image attachment dropzone, and dynamic multi-answer configuration.
4. **Fiszki 3D (Flashcards View):**
   - Minimalist card with realistic 3D perspective flip, tactile "Repeat" vs "Known" action pills, and keyboard shortcut legends.
5. **Harmonogram (Exam Schedule View):**
   - Apple Calendar-inspired view showing upcoming exams mapped directly to test deck completion rates.

Please provide the complete Figma component architecture, auto-layout guidelines, exact spacing scale (4px/8px grid), and pixel-perfect design specifications for both Light and Dark themes.
```
