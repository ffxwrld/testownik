import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { LoginView } from './LoginView';
import { SetupProfileView } from './SetupProfileView';

interface AuthGuardProps {
  children: React.ReactNode;
  onCancel: () => void;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, onCancel }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onBack={onCancel} />;
  }

  if (profileLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <SetupProfileView onComplete={() => {}} />;
  }

  return <>{children}</>;
};
