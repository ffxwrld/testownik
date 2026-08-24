with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add state for mobile settings
state_injection = "const [showFormatInfo, setShowFormatInfo] = useState(false);\n  const [showMobileSettings, setShowMobileSettings] = useState(false);"
content = content.replace("const [showFormatInfo, setShowFormatInfo] = useState(false);", state_injection)

# 2. Modify container padding
old_container = """      <div 
        className={`flex-1 flex flex-col ${displayPhase === 'creator' ? 'min-h-0' : ''}`}
        style={{ paddingBottom: `${FOOTER_HEIGHT_PX}px` }}
      >"""
new_container = """      <div 
        className={`flex-1 flex flex-col pb-0 md:pb-[40px] ${displayPhase === 'creator' ? 'min-h-0' : ''}`}
      >"""
content = content.replace(old_container, new_container)

# 3. Modify footer and add mobile UI
import re
footer_regex = re.compile(r'(<footer.*?</footer>)', re.DOTALL)
footer_match = footer_regex.search(content)

if footer_match:
    original_footer = footer_match.group(1)
    
    # Hide original footer on mobile
    hidden_footer = original_footer.replace('className="fixed', 'className="hidden md:flex fixed')
    
    mobile_ui = """
      {/* Mobile Settings FAB */}
      <button
        onClick={() => setShowMobileSettings(true)}
        className="md:hidden fixed bottom-6 right-6 w-12 h-12 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center z-40 transition-transform active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Mobile Settings Modal */}
      <AnimatePresence>
        {showMobileSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
            onClick={() => setShowMobileSettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ustawienia</h3>
                <button
                  onClick={() => setShowMobileSettings(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Format pytań</span>
                  <button
                    onClick={() => { setShowMobileSettings(false); setShowFormatInfo(true); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                  >
                    Zobacz
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Język</span>
                  <LanguageSwitcher />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Motyw koloru</span>
                  <ThemePicker />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tryb ciemny</span>
                  <DarkModeToggle />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
"""
    
    content = content.replace(original_footer, hidden_footer + mobile_ui)

with open('src/App.tsx', 'w') as f:
    f.write(content)
