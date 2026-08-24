with open('src/components/creator/CreatorEditor.tsx', 'r') as f:
    content = f.read()

if "import { motion, AnimatePresence } from 'framer-motion';" not in content:
    content = content.replace("import { FC } from 'react';", "import { FC } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';")

old_answers = """            {activeQuestion.answers.map((ans, idx) => (
              <div key={ans.id} className={`flex items-start gap-3 p-2 rounded-lg border-2 transition-colors ${ans.isCorrect ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>"""

new_answers = """            <AnimatePresence mode="popLayout" initial={false}>
            {activeQuestion.answers.map((ans, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                key={ans.id} 
                className={`flex items-start gap-3 p-2 rounded-lg border-2 transition-colors ${ans.isCorrect ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>"""
content = content.replace(old_answers, new_answers)

old_end_answers = """                </button>
              </div>
            ))}
            
            <div className="pt-2 px-2 pb-1">"""

new_end_answers = """                </button>
              </motion.div>
            ))}
            </AnimatePresence>
            
            <div className="pt-2 px-2 pb-1">"""
content = content.replace(old_end_answers, new_end_answers)

with open('src/components/creator/CreatorEditor.tsx', 'w') as f:
    f.write(content)
