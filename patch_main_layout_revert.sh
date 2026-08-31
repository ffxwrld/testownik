#!/bin/bash
sed -i '' 's|interface MainLayoutProps {|interface MainLayoutProps {\n  onNavigate?: (phase: string) => void;|g' src/components/layout/MainLayout.tsx
sed -i '' 's|export const MainLayout: FC<MainLayoutProps> = ({ children }) => {|export const MainLayout: FC<MainLayoutProps> = ({ children, onNavigate }) => {|g' src/components/layout/MainLayout.tsx
