import re
with open('src/components/SummaryView.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useState, useMemo, FC } from 'react';", "import { useState, useMemo, FC } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';")

# 1. Parent container
content = content.replace(
    '<div className="w-full max-w-2xl space-y-6">',
    """<motion.div 
        className="w-full max-w-2xl space-y-6"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >"""
)

# Replace the closing div of the parent container
# It's right above the final </div>
content = content.replace(
    "        </div>\n      </div>\n    </div>\n  );\n};",
    "        </div>\n      </motion.div>\n    </div>\n  );\n};"
)

# 2. Child 1: The Score / Header
content = content.replace(
    '<div className="text-center space-y-3">',
    """<motion.div 
          className="text-center space-y-3"
          variants={{
            hidden: { opacity: 0, y: 20, scale: 0.95 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }
          }}
        >"""
)
content = content.replace(
    '        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">',
    '        </motion.div>\n\n        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6" variants={{ hidden: { opacity: 0, y: 20, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } } }}>'
)
# Close the grid div
content = content.replace(
    '          </Card>\n        </div>\n\n        {worstQuestions.length > 0 && (',
    '          </Card>\n        </motion.div>\n\n        {worstQuestions.length > 0 && ('
)

# 3. Child 2: The worst questions section
content = content.replace(
    '        {worstQuestions.length > 0 && (\n          <div className="space-y-3">',
    '        {worstQuestions.length > 0 && (\n          <motion.div className="space-y-3" variants={{ hidden: { opacity: 0, y: 20, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } } }}>'
)
content = content.replace(
    '            </div>\n          </div>\n        )}\n\n        <div className="flex gap-3 pt-4">',
    '            </div>\n          </motion.div>\n        )}\n\n        <motion.div className="flex gap-3 pt-4" variants={{ hidden: { opacity: 0, y: 20, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } } }}>'
)
content = content.replace(
    '          </Button>\n        </div>\n      </motion.div>\n    </div>\n  );\n};',
    '          </Button>\n        </motion.div>\n      </motion.div>\n    </div>\n  );\n};'
)

# 4. Beer Modal Animation - move from CSS to Framer Motion
old_beer = """      {showBeerModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowBeerModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-zinc-200 dark:border-zinc-800 animate-slideDown"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce">🍻</div>"""

new_beer = """      <AnimatePresence>
        {showBeerModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowBeerModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-zinc-200 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
                className="text-6xl mb-4 inline-block origin-bottom"
              >
                🍻
              </motion.div>"""

content = content.replace(old_beer, new_beer)
content = content.replace(
    "            <Button onClick={() => setShowBeerModal(false)} variant=\"primary\" className=\"w-full\">\n              {t('summary.beerModalBtn')}\n            </Button>\n          </div>\n        </div>\n      )}",
    "            <Button onClick={() => setShowBeerModal(false)} variant=\"primary\" className=\"w-full\">\n              {t('summary.beerModalBtn')}\n            </Button>\n            </motion.div>\n          </motion.div>\n        )}\n      </AnimatePresence>"
)

with open('src/components/SummaryView.tsx', 'w') as f:
    f.write(content)

