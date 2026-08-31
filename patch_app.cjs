const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const importsToReplace = `import { LearnView as HomeView } from "./components/LearnView";
import { DashboardView } from "./components/DashboardView";
import { TestView } from './components/TestView';
import { SummaryView } from './components/SummaryView';
import { CreatorView, type EditingQuestion, } from './components/CreatorView';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGuard } from './components/auth/AuthGuard';
import { ProfileView } from './components/social/ProfileView';
import { LeaderboardView } from './components/social/LeaderboardView';
import { FriendsView } from './components/social/FriendsView';`;

const newImports = `import { motion, AnimatePresence } from 'framer-motion';
import { AuthGuard } from './components/auth/AuthGuard';
import { lazy, Suspense } from 'react';
import type { EditingQuestion } from './components/CreatorView';

const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const HomeView = lazy(() => import('./components/LearnView').then(m => ({ default: m.LearnView })));
const TestView = lazy(() => import('./components/TestView').then(m => ({ default: m.TestView })));
const SummaryView = lazy(() => import('./components/SummaryView').then(m => ({ default: m.SummaryView })));
const CreatorView = lazy(() => import('./components/CreatorView').then(m => ({ default: m.CreatorView })));
const ProfileView = lazy(() => import('./components/social/ProfileView').then(m => ({ default: m.ProfileView })));
const LeaderboardView = lazy(() => import('./components/social/LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const FriendsView = lazy(() => import('./components/social/FriendsView').then(m => ({ default: m.FriendsView })));`;

content = content.replace(importsToReplace, newImports);

// Find the main switch rendering and wrap it in Suspense.
// First, we create a fallback loader.
const fallback = `<div className="flex-1 flex items-center justify-center p-8">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>`;

// Since the components are rendered inside AnimatePresence -> motion.div, we can wrap the whole `<AnimatePresence...>` inside Suspense, or just wrap the components inside.
// Wait, wrapping AnimatePresence in Suspense can sometimes break exit animations, but React 18 handles Suspense much better. Actually, it's safer to wrap the individual switch cases inside Suspense if we want fast transitions. But we can just wrap the AnimatePresence children.
// Let's do a simple wrap of the main content div:
// <div className="flex-1 relative overflow-hidden flex flex-col">
content = content.replace(
  '<div className="flex-1 relative overflow-hidden flex flex-col">',
  '<div className="flex-1 relative overflow-hidden flex flex-col">\n          <Suspense fallback={' + fallback + '}>'
);

// Close Suspense after AnimatePresence
content = content.replace(
  '</AnimatePresence>\n        </div>\n      </MainLayout>',
  '</AnimatePresence>\n          </Suspense>\n        </div>\n      </MainLayout>'
);

fs.writeFileSync('src/App.tsx', content);
