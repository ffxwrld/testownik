# Testownik 🎓

Nowoczesna aplikacja desktopowa do nauki i rozwiązywania testów na podstawie własnych baz pytań. Stworzona z myślą o szybkiej, wygodnej i efektywnej powtórce materiału z wykorzystaniem systemu zapamiętywania (wymuszanie wielokrotnych poprawnych odpowiedzi).

## ✨ Główne funkcje

- **Własne bazy pytań:** Wgrywaj paczki w formacie `.zip` zawierające zdjęcia pytań i plik `.json` z odpowiedziami.
- **Inteligentne powtórki:** Algorytm "Testownika" upewnia się, że opanujesz materiał. Po złej odpowiedzi pytanie wraca do puli i wymaga podania poprawnej odpowiedzi np. 2 lub 3 razy z rzędu (w zależności od wybranego trybu).
- **Zarządzanie sesjami:** Aplikacja automatycznie zapisuje Twój postęp w tle (w pamięci `localStorage`). Możesz przerwać w każdej chwili i kontynuować test później.
- **Skróty klawiszowe:** Błyskawiczna obsługa bez użycia myszki – od wybierania odpowiedzi, po skalowanie interfejsu.
- **Dostępność i skalowanie:** Skróty `Cmd/Ctrl +` oraz `Cmd/Ctrl -` płynnie powiększają cały interfejs, dostosowując go do Twojego wzroku.
- **Dark Mode:** Wbudowany, elegancki tryb ciemny dla komfortowej nauki w nocy.

## 🛠 Technologie

Projekt bazuje na nowoczesnym stosie:
- **[React 19](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)** – Serce aplikacji i interfejs użytkownika.
- **[Tailwind CSS](https://tailwindcss.com/)** – System stylowania pozwalający na łatwe i piękne budowanie UI.
- **[Electron](https://www.electronjs.org/)** – Pozwala spakować aplikację webową do postaci natywnego programu na Windows i macOS.
- **[Vite](https://vitejs.dev/)** – Ultraszybki bundler i środowisko deweloperskie.

## 🚀 Jak uruchomić projekt na swoim komputerze?

Musisz mieć zainstalowane [Node.js](https://nodejs.org/) oraz system kontroli wersji [Git](https://git-scm.com/).

### 1. Pobranie kodu
Skopiuj repozytorium na swój komputer:
```bash
git clone https://github.com/TwojaNazwa/Testownik-app.git
cd Testownik-app
```

### 2. Instalacja zależności
```bash
npm install
```

### 3. Uruchomienie trybu deweloperskiego
```bash
npm run dev:electron
```
*(Aplikacja otworzy się automatycznie jako okienko Electrona. Każda zmiana w kodzie odświeży ją w czasie rzeczywistym).*

## 📦 Budowanie gotowej aplikacji (Instalator)

Dzięki odpowiedniej konfiguracji `electron-builder`, wygenerowanie gotowych instalatorów jest banalnie proste. 

Aby wygenerować wersję instalacyjną, wpisz jedną z poniższych komend w terminalu:

- **Dla systemu macOS (plik `.dmg`):**
  ```bash
  npm run build:mac
  ```

- **Dla systemu Windows (plik `.exe`):**
  ```bash
  npm run build:win
  ```
  *(Uwaga: Jeżeli budujesz na Windowsa bezpośrednio z systemu macOS, musisz upewnić się, że posiadasz zainstalowane oprogramowanie `wine`).*

- **Budowanie na oba systemy po kolei:**
  ```bash
  npm run build:all
  ```

Gotowe pliki instalacyjne znajdziesz w nowo utworzonym folderze `dist/` (lub `dist/mac-arm64/` itp., zależnie od platformy).

---
Stworzone z dbałością o detale, żeby pomóc Ci zdać wszystko śpiewająco! 🚀
