import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove FOOTER_HEIGHT_PX and style bottom padding
content = content.replace("style={{ paddingBottom: `${FOOTER_HEIGHT_PX}px` }}", "style={{ paddingBottom: displayPhase === 'test' ? '0px' : '24px' }}")

# 2. Extract settings buttons
settings_buttons = """
        {displayPhase !== 'test' && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-1.5 rounded-2xl shadow-sm">
            <button
              onClick={() => setShowFormatInfo(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
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
              className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-base leading-none select-none"
            >
              −
            </button>
            <button
              onClick={() => setZoomLevel(applyZoom(1))}
              className="px-2 h-7 flex items-center justify-center rounded-xl text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 font-mono tabular-nums min-w-[2.8rem]"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel(prev => applyZoom(prev + ZOOM_STEP))}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-base leading-none select-none"
            >
              +
            </button>
          </div>
        )}
"""

# 3. Replace the entire footer with the floating settings (if we want them)
footer_regex = r'<footer.*?</footer>'
content = re.sub(footer_regex, settings_buttons, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)

