import React, { createContext, useContext, ReactNode } from 'react';
import { useMultiplayer } from '../hooks/useMultiplayer';

type MultiplayerContextType = ReturnType<typeof useMultiplayer>;

const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

export const MultiplayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const multiplayerState = useMultiplayer();
  return (
    <MultiplayerContext.Provider value={multiplayerState}>
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayerContext = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayerContext must be used within a MultiplayerProvider');
  }
  return context;
};
