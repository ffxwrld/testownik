import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Re-add FOOTER_HEIGHT_PX
content = content.replace("const ZOOM_MAX = 2.0;", "const ZOOM_MAX = 2.0;\nconst FOOTER_HEIGHT_PX = 40;")

# 2. Replace the floating widget and padding logic with the footer
old_bottom = r"""      <div 
        className={`flex-1 flex flex-col \$\{displayPhase === 'creator' \? 'min-h-0' : ''\}`}
        style={{ paddingBottom: displayPhase === 'test' \? '0px' : '24px' }}
      >
        <AnimatePresence mode="wait">
          \{content\}
        </AnimatePresence>
      </div>

      
        \{displayPhase !== 'test' && \(
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-1.5 rounded-2xl shadow-sm">
            <button
              onClick=\{\(\) => setShowFormatInfo\(true\)\}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              \{t\('components.formatInfo.button'\)\}
            </button>
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <LanguageSwitcher />
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <ThemePicker />
            <DarkModeToggle />
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <button
              onClick=\{\(\) => setZoomLevel\(prev => applyZoom\(prev - ZOOM_STEP\)\)\}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-base leading-none select-none"
            >
              −
            </button>
            <button
              onClick=\{\(\) => setZoomLevel\(applyZoom\(1\)\)\}
              className="px-2 h-7 flex items-center justify-center rounded-xl text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 font-mono tabular-nums min-w-\[2.8rem\]"
            >
              \{Math.round\(zoomLevel \* 100\)\}%
            </button>
            <button
              onClick=\{\(\) => setZoomLevel\(prev => applyZoom\(prev \+ ZOOM_STEP\)\)\}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-base leading-none select-none"
            >
              \+
            </button>
          </div>
        \)\}"""

new_bottom = """      <div 
        className={`flex-1 flex flex-col ${displayPhase === 'creator' ? 'min-h-0' : ''}`}
        style={{ paddingBottom: `${FOOTER_HEIGHT_PX}px` }}
      >
        <AnimatePresence mode="wait">
          {content}
        </AnimatePresence>
      </div>

      <footer
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl saturate-150 border-t border-zinc-200/50 dark:border-zinc-800/50"
        style={{ height: `${FOOTER_HEIGHT_PX}px` }}
      >
        <div className="flex items-center pl-5">
          <a
            href="https://github.com/ffxwrld"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors duration-150 font-mono"
          >
            by fifi
          </a>
        </div>

        <div className="flex items-center gap-2 pr-3">
          <button
            onClick={() => setShowFormatInfo(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            {t('components.formatInfo.button')}
          </button>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <LanguageSwitcher />
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <ThemePicker />
          <DarkModeToggle />
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <button
            onClick={() => setZoomLevel(prev => applyZoom(prev - ZOOM_STEP))}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-base leading-none select-none"
          >
            −
          </button>
          <button
            onClick={() => setZoomLevel(applyZoom(1))}
            className="px-1.5 h-6 flex items-center justify-center rounded-md text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 font-mono tabular-nums min-w-[2.8rem]"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={() => setZoomLevel(prev => applyZoom(prev + ZOOM_STEP))}
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-base leading-none select-none"
          >
            +
          </button>
        </div>
      </footer>"""

content = re.sub(old_bottom, new_bottom, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
