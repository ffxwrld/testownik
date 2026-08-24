with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

old_hero = """        <div className="text-center space-y-4 pb-4">
          <div className="relative inline-flex items-center justify-center mb-2">
            {/* Ambient glow behind the logo */}
            <div className="absolute inset-0 bg-primary-500/30 blur-2xl rounded-full scale-[1.8] translate-y-2 pointer-events-none"></div>
            
            <img 
              src={logo} 
              alt="Testownik" 
              className="w-16 h-16 object-contain relative z-10 drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter flex items-center justify-center gap-3 pb-1">
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
          </h1>
          {/* Subtitle removed per user request */}
        </div>"""

new_hero = """        <div className="flex items-center justify-center gap-5 pb-6 pt-2">
          <div className="relative inline-flex items-center justify-center">
            {/* Ambient glow behind the logo */}
            <div className="absolute inset-0 bg-primary-500/30 blur-2xl rounded-full scale-[1.5] pointer-events-none"></div>
            
            <img 
              src={logo} 
              alt="Testownik Logo" 
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10 drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 text-transparent bg-clip-text pb-1">
            {t('home.title')}
          </h1>
        </div>"""

content = content.replace(old_hero, new_hero)

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)
