with open('src/components/HomeView.tsx', 'r') as f:
    content = f.read()

old_hero = """        <div className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src={logo} 
              alt="Testownik" 
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('home.title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-sm mx-auto">
            {t('home.subtitle')}
          </p>
        </div>"""

new_hero = """        <div className="text-center space-y-4 pb-4">
          <div className="relative inline-flex items-center justify-center mb-2">
            {/* Ambient glow behind the logo */}
            <div className="absolute inset-0 bg-primary-500/30 blur-2xl rounded-full scale-[1.8] translate-y-2 pointer-events-none"></div>
            
            <img 
              src={logo} 
              alt="Testownik" 
              className="w-16 h-16 object-contain relative z-10 drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 text-transparent bg-clip-text pb-1">
            {t('home.title')}
          </h1>
          {/* Subtitle removed per user request */}
        </div>"""

content = content.replace(old_hero, new_hero)

with open('src/components/HomeView.tsx', 'w') as f:
    f.write(content)
