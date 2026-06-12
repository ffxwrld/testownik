# Testownik

Testownik is a desktop application designed for learning and testing through custom question banks. It focuses on efficiency and memory retention by enforcing repeated correct answers for questions you get wrong.

## Features

- Custom Question Banks: Load tests via .zip files containing question images and a .json file with answers.
- Repetition System: When you answer a question incorrectly, the app returns it to the pool and requires you to answer it correctly a set number of times in a row (e.g., 2 or 3 times) before considering it learned.
- Auto-Saving: Progress is automatically saved locally. You can close the app at any time and resume your session later.
- Keyboard Navigation: Fully navigable using keyboard shortcuts for a faster workflow.
- UI Scaling: Built-in zoom functionality (Cmd/Ctrl + and -) to adjust the interface size.
- Dark Mode: Native dark mode support.

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS
- Electron
- Vite

## Local Development Setup

To run the project locally, ensure you have Node.js and Git installed.

1. Clone the repository:
```bash
git clone https://github.com/YourUsername/Testownik-app.git
cd Testownik-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev:electron
```
This will spin up the Vite dev server and open the Electron application. Changes to the code will reflect automatically.

## Building for Production

The project is configured with electron-builder to generate standalone executables.

To build the macOS application (.dmg):
```bash
npm run build:mac
```

To build the Windows installer (.exe):
```bash
npm run build:win
```

To build for both platforms sequentially:
```bash
npm run build:all
```

The compiled applications will be available in the generated `dist/` directory. Note: Building the Windows version directly from macOS requires `wine` to be installed on your host system. Alternatively, run the build command on a native Windows machine.
