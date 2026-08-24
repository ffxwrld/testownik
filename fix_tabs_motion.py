import re

with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

# Re-import motion
if "import { motion } from 'framer-motion';" not in content:
    content = content.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\nimport { motion } from 'framer-motion';")

old_tabs = """        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => onTabChange('new')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {t('home.tabs.newTest')}
          </button>
          <button
            onClick={() => onTabChange('saved')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'saved'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {t('home.tabs.myTests')}
            {savedSessions.length > 0 && (
              <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                {savedSessions.length}
              </span>
            )}
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onEnterCreator}
            className="px-4 py-3 font-bold text-sm border-b-2 border-transparent text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('home.tabs.creator')}
          </button>
        </div>"""

new_tabs = """        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 relative">
          <button
            onClick={() => onTabChange('new')}
            className={`relative flex items-center justify-center h-12 px-4 font-medium text-sm transition-colors ${
              activeTab === 'new'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'new' && (
              <motion.div
                layoutId="homeTabIndicator"
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-500"
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }}
              />
            )}
            {t('home.tabs.newTest')}
          </button>
          <button
            onClick={() => onTabChange('saved')}
            className={`relative flex items-center justify-center h-12 px-4 font-medium text-sm transition-colors ${
              activeTab === 'saved'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'saved' && (
              <motion.div
                layoutId="homeTabIndicator"
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-500"
                transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }}
              />
            )}
            <span>{t('home.tabs.myTests')}</span>
            {savedSessions.length > 0 && (
              <span className="ml-2 flex items-center justify-center px-2 py-0.5 text-[10px] font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                {savedSessions.length}
              </span>
            )}
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onEnterCreator}
            className="relative flex items-center justify-center gap-1.5 h-12 px-4 font-bold text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('home.tabs.creator')}
          </button>
        </div>"""

content = content.replace(old_tabs, new_tabs)
with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)
