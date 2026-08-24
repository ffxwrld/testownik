import re

with open('src/components/SessionsList.tsx', 'r') as f:
    content = f.read()

if "import { motion, AnimatePresence } from 'framer-motion';" not in content:
    content = content.replace("import { type FC, useState } from 'react';", "import { type FC, useState } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';")

old_return = """  return (
    <div className="space-y-3">
      {sessions.map((session) => {"""

new_return = """  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout" initial={false}>
      {sessions.map((session) => {"""
content = content.replace(old_return, new_return)

old_card = """        return (
          <div
            key={session.id}
            className={`p-4 bg-white dark:bg-zinc-800 rounded-xl border transition-shadow hover:shadow-md ${"""

new_card = """        return (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            key={session.id}
            className={`p-4 bg-white dark:bg-zinc-800 rounded-xl border transition-shadow hover:shadow-md ${"""
content = content.replace(old_card, new_card)

old_card_close = """              )}
            </div>
          </div>
        );
      })}
    </div>"""

new_card_close = """              )}
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>
    </div>"""
content = content.replace(old_card_close, new_card_close)

with open('src/components/SessionsList.tsx', 'w') as f:
    f.write(content)
