# Testownik

Testownik is a lightweight, high-performance desktop application designed to optimize the learning and memorization process. Moving beyond traditional static note-reading, the application employs active recall and spaced repetition principles. Users can import their own datasets or create tests directly within the application, ensuring that incorrect answers are methodically repeated until mastery is achieved.

## Table of Contents
- [Download & Installation](#download--installation)
- [Installation Troubleshooting](#installation-troubleshooting)
  - [Windows SmartScreen](#windows-smartscreen)
  - [macOS Gatekeeper](#macos-gatekeeper)
- [Application Workflow](#application-workflow)
- [Detailed Features](#detailed-features)
- [For Developers](#for-developers)

---

*Home View (Dark Mode)*
![Home View - Dark Mode](<img width="1313" height="959" alt="Zrzut ekranu 2026-06-27 o 18 03 46" src="https://github.com/user-attachments/assets/569f4301-f719-4a7c-8e1c-91772a105362" />)

*Home View (Light Mode)*
![Home View - Light Mode](<img width="1313" height="959" alt="Zrzut ekranu 2026-06-27 o 18 03 50" src="https://github.com/user-attachments/assets/00ee9f22-ff1f-4caf-a0ff-f0c0cfe05b03" />)

*Taking a test*
![Test View](<img width="1313" height="959" alt="Zrzut ekranu 2026-06-27 o 18 04 07" src="https://github.com/user-attachments/assets/4faac9a0-36b7-4c32-8e09-5ddaa7d0ebba" />)

*Base creator view*
![Creator_view](<img width="1313" height="959" alt="Zrzut ekranu 2026-06-27 o 18 04 07" src="https://github.com/user-attachments/assets/fb403320-79f9-482e-abc7-f1df1a3f1fa7" />)

---

## Download & Installation

The application is distributed as pre-compiled standalone executables for all major operating systems. Navigate to the [Releases page](https://github.com/ffxwrld/testownik/releases) and download the appropriate package for your architecture:

- **Windows**: Download the `.exe` installer.
- **macOS**: Download the `.dmg` image (Universal build for both Intel and Apple Silicon is available; select the corresponding architecture).
- **Linux**: Download the `.AppImage` or `.deb` package.

Note: Additional metadata files generated in the release folder (such as `.yml` or `.blockmap`) are utilized internally by the application's auto-updater mechanism and do not need to be downloaded manually.

---

## Installation Troubleshooting

Due to strict modern operating system security protocols, unsigned applications distributed outside of official app stores may trigger warnings. Please follow the instructions below to bypass these security mechanisms safely.

### Windows SmartScreen

Because this application does not currently possess a paid EV (Extended Validation) code signing certificate, Windows Defender SmartScreen may interrupt the initial launch, displaying a "Windows protected your PC" dialog.

To proceed with the installation:
1. Click on **More info** within the dialog window.
2. A new button labeled **Run anyway** will appear at the bottom.
3. Click **Run anyway** to authorize the application. The installer will then execute silently and launch the application.

### macOS Gatekeeper

macOS implements a strict security feature known as Gatekeeper. When an application without an Apple Developer certificate is downloaded via a web browser, macOS attaches a quarantine extended attribute (`com.apple.quarantine`) to the file. Attempting to launch the application may result in an error stating that the application is **damaged and can't be opened**, prompting you to move it to the Trash.

To remove the quarantine attribute and run the application:
1. Open the downloaded `.dmg` file and drag `Testownik.app` into your **Applications** folder.
2. Open the **Terminal** application (accessible via Spotlight Search).
3. Execute the following command to strip the quarantine attribute:
   ```bash
   xattr -cr /Applications/Testownik.app
   ```
4. You may now launch the application normally from your Applications directory. The error will not appear again.

---

## Application Workflow

1. **Database Creation or Import**: Utilize the built-in Creator module to generate a custom database of questions and answers. Alternatively, import an existing `.zip` archive containing image-based questions and a corresponding `.json` file containing the correct answer keys.
2. **Active Testing Phase**: The application presents the questions sequentially, recording the accuracy of your responses.
3. **Algorithmic Repetition**: Incorrectly answered questions are not discarded. The system queues them for subsequent review, requiring multiple consecutive correct answers to mark the question as successfully learned.
4. **Persistent State Management**: Your learning progress is continuously auto-saved to the local disk. You may terminate the application at any time and seamlessly resume your session upon relaunching.

---

## Detailed Features

- **Integrated Test Creator**: A comprehensive graphical interface for creating, editing, and managing custom question databases directly within the application environment.
- **Intelligent Auto-Updater**: A robust background service monitors the repository for new releases. On Windows, updates are downloaded and installed entirely in the background, utilizing custom bypass logic to prevent deployment race conditions. On macOS, the application intelligently disables background execution to comply with Gatekeeper policies, instead surfacing a non-intrusive UI notification that directs the user to the latest `.dmg` download.
- **Custom Question Banks**: Complete flexibility in defining the scope of your learning material.
- **Real-Time Auto-Saving**: All session data, including current progress and repetition queues, is serialized and saved locally to prevent data loss.
- **Keyboard-Centric Navigation**: The entire testing interface is fully navigable via keyboard shortcuts, drastically increasing the speed and efficiency of the learning session.
- **Theming & Accessibility**: Full support for both Dark and Light modes, ensuring optimal contrast and readability across different environments.
- **Dynamic Zoom Interface**: Leverage `Ctrl` + `+`/`-` (or `Cmd` on macOS) to dynamically scale the application interface, accommodating various screen resolutions and visual preferences.

---

## For Developers

This project is built utilizing a modern, high-performance desktop application stack. 

**Technology Stack**: 
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite.
- **Backend/Container**: Electron.
- **Package Management**: npm.

### Local Setup Instructions

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/ffxwrld/testownik.git
   ```
2. Navigate into the project directory:
   ```bash
   cd testownik
   ```
3. Install the required Node.js dependencies:
   ```bash
   npm install
   ```
4. Initialize the local development server with Hot Module Replacement (HMR):
   ```bash
   npm run dev
   ```

### Build Instructions

To compile the source code and generate production-ready standalone executables, execute the following npm scripts. The output artifacts will be placed in the `release/` directory.

- `npm run build:mac` : Generates `.dmg` and `.zip` archives for macOS (includes configurations for both Intel x64 and Apple Silicon ARM64 architectures).
- `npm run build:win` : Generates the `.exe` NSIS installer for Windows x64.
- `npm run build:linux` : Generates `.AppImage` and `.deb` packages for Linux x64.
- `npm run build:all` : Sequentially compiles the application for all supported operating systems.
