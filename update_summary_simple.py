with open('src/components/SummaryView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { useState, useMemo, FC } from 'react';",
    "import { useState, useMemo, FC } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';"
)

# Modal animation
old_modal = """      {showBeerModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowBeerModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-zinc-200 dark:border-zinc-800 animate-slideDown"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce">🍻</div>"""
new_modal = """      <AnimatePresence>
        {showBeerModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowBeerModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-zinc-200 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl mb-4 origin-bottom inline-block"
              >
                🍻
              </motion.div>"""
content = content.replace(old_modal, new_modal)

content = content.replace(
    "            <Button onClick={() => setShowBeerModal(false)} variant=\"primary\" className=\"w-full\">\n              {t('summary.beerModalBtn')}\n            </Button>\n          </div>\n        </div>\n      )}",
    "            <Button onClick={() => setShowBeerModal(false)} variant=\"primary\" className=\"w-full\">\n              {t('summary.beerModalBtn')}\n            </Button>\n          </motion.div>\n        </motion.div>\n      )}\n      </AnimatePresence>"
)

# Main content entrance
content = content.replace(
    '<div className="w-full max-w-2xl space-y-6">',
    '<motion.div initial={{ opacity: 0, y: 20, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="w-full max-w-2xl space-y-6">'
)
content = content.replace(
    "        </Button>\n      </div>\n    </div>",
    "        </Button>\n      </motion.div>\n    </div>"
)

with open('src/components/SummaryView.tsx', 'w') as f:
    f.write(content)
