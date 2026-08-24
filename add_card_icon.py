with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

old_title = """          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 text-transparent bg-clip-text pb-1">
            {t('home.title')}
          </h1>"""

new_title = """          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter flex items-center justify-center gap-3 pb-1">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500 drop-shadow-md"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
            </svg>
            <span className="bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 text-transparent bg-clip-text">
              {t('home.title')}
            </span>
          </h1>"""

content = content.replace(old_title, new_title)

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)
