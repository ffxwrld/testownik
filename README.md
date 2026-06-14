# Testownik

Testownik is a simple and fast desktop application that helps you memorize information and prepare for exams. Instead of just reading notes, you load your own tests, and the app makes sure you actually remember the answers by repeating the questions you got wrong.

## 🚀 Download & Install (For standard users)

You don't need to be a programmer to use Testownik. Just go to the [Releases page](https://github.com/ffxwrld/testownik/releases) and download the file for your system:
- **Windows**: Download the **`.exe`** file.
- **macOS**: Download the **`.dmg`** file.
- **Linux**: Download the **`.AppImage`** or **`.deb`** file.

*(You can ignore all the other small files like `.yml` or `.blockmap` - the app will use them automatically in the background).*

---

![Home View - Dark Mode](https://github.com/user-attachments/assets/a3f1aa1a-9e0f-46f1-bea0-4532e58762c2)
*Home View (Dark Mode)*

![Home View - Light Mode](https://github.com/user-attachments/assets/234fb581-86db-4d1f-9a91-5c552b7a868b)
*Home View (Light Mode)*

![Test View](https://github.com/user-attachments/assets/8d946cf0-1e2d-49fc-89a5-90290c048302)
*Taking a test*

## How it works

1. **Create or Load a test**: Use the built-in Creator to write your questions, or import a `.zip` file containing images of your questions and a `.json` file with the correct answers.
2. **Take the test**: The app shows you the questions one by one.
3. **Smart repetitions**: If you answer incorrectly, the app won't let you just skip it. The question will return later, and you'll have to answer it correctly a few times in a row to prove you've learned it.
4. **Take a break**: Your progress is automatically saved. You can close the app at any moment and resume exactly where you left off.

## Key Features

- **Built-in Creator**: Create, edit, and save custom question databases directly inside the app.
- **Auto-Updates**: The app silently checks for new versions in the background so you are always up to date.
- **Custom Question Banks**: Learn exactly what you need by loading your own materials.
- **Auto-Saving**: Progress is always saved locally on your computer.
- **Keyboard Shortcuts**: You don't need a mouse. Navigate and answer questions entirely with your keyboard for maximum speed.
- **Dark & Light Mode**: Choose the theme that is easier on your eyes.
- **Zooming**: Use `Ctrl` + `+` or `-` (or `Cmd` on Mac) to make the text and images larger.

---

## 💻 For Developers (Tech Stack & Building)

If you want to modify the code or build the app from source, here is what you need.

**Tech Stack**: React 19, TypeScript, Tailwind CSS, Electron, Vite.

### Local Setup
1. Clone this repository: 
   ```bash
   git clone https://github.com/ffxwrld/testownik.git
   ```
2. Enter the directory: 
   ```bash
   cd testownik
   ```
3. Install dependencies: 
   ```bash
   npm install
   ```
4. Start development mode: 
   ```bash
   npm run dev
   ```

### Building the App
Run these commands to generate the standalone executables (they will appear in the `release/` folder):
- `npm run build:mac` (Builds for macOS Intel & Apple Silicon)
- `npm run build:win` (Builds for Windows x64)
- `npm run build:linux` (Builds for Linux x64)
- `npm run build:all` (Builds for all platforms into their respective folders)
