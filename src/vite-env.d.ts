/// <reference types="vite/client" />

export interface ElectronUpdaterInfo {
  version?: string;
  releaseDate?: string;
  [key: string]: unknown;
}

export interface ElectronAPI {
  app: {
    name: string;
  };
  updater: {
    onUpdateAvailable: (callback: (info: ElectronUpdaterInfo) => void) => void;
    onUpdateAvailableMac?: (callback: (info: ElectronUpdaterInfo) => void) => void;
    onUpdateDownloaded: (callback: (info: ElectronUpdaterInfo) => void) => void;
    restartApp: () => void;
  };
  zoom: {
    set: (factor: number) => void;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

